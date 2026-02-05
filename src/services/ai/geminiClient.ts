/**
 * Google Gemini API 클라이언트 (with Context Caching)
 *
 * 새로운 @google/genai SDK를 사용하여 Context Caching을 지원합니다.
 *
 * 주요 기능:
 * - Generative AI API 호출
 * - Context Caching (90% 비용 절감)
 * - 스트리밍 응답 처리
 * - 에러 핸들링 및 재시도
 * - 토큰 사용량 추적
 */

import { GoogleGenAI, type Content } from '@google/genai';
import type {
  AIConfig,
  GeminiModel,
  ChatMessage,
  AIServiceError,
} from '@/types';
import { generateId } from '@/lib/id';

// ============================================
// Constants
// ============================================

/**
 * Gemini 모델별 토큰 비용 (USD per 1K tokens, 2025년 기준)
 * https://ai.google.dev/pricing
 */
const GEMINI_TOKEN_COSTS: Record<GeminiModel, { input: number; output: number; cachedInput: number }> = {
  'gemini-3-pro': { input: 0.002, output: 0.012, cachedInput: 0.0002 },           // 90% 할인
  'gemini-2.5-pro': { input: 0.00125, output: 0.01, cachedInput: 0.000125 },      // 90% 할인
  'gemini-2.5-flash-lite': { input: 0.0001, output: 0.0003, cachedInput: 0.00001 }, // 90% 할인
};

/**
 * API 키 저장소 키
 */
const API_KEY_STORAGE_KEY = 'storyforge-gemini-api-key';

/**
 * 캐시 저장소 키
 */
const CACHE_STORAGE_KEY = 'storyforge-gemini-cache';

/**
 * 캐시 최소 토큰 수 (Gemini 요구사항)
 */
const MIN_CACHE_TOKENS = 2048;

/**
 * 캐시 기본 TTL (1시간)
 */
const DEFAULT_CACHE_TTL = '3600s';

// ============================================
// Types
// ============================================

/**
 * 캐시 정보
 */
export interface GeminiCacheInfo {
  name: string;           // 캐시 ID (API에서 반환)
  projectId: string;      // 연결된 프로젝트 ID
  model: string;          // 사용된 모델
  tokenCount: number;     // 캐시된 토큰 수
  createdAt: Date;        // 생성 시간
  expiresAt: Date;        // 만료 시간
}

/**
 * 캐시 저장소 구조
 */
interface CacheStorage {
  [projectId: string]: GeminiCacheInfo;
}

// ============================================
// API Key Management
// ============================================

/**
 * API 키 저장
 */
export function saveAPIKey(apiKey: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  console.log('[GeminiClient] API 키 저장됨');
}

/**
 * API 키 로드
 */
export function loadAPIKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

/**
 * API 키 삭제
 */
export function clearAPIKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  console.log('[GeminiClient] API 키 삭제됨');
}

/**
 * API 키 유효성 검증 (간단한 형식 체크)
 */
export function isValidAPIKey(apiKey: string): boolean {
  // Google API 키는 일반적으로 'AIza'로 시작
  return apiKey.startsWith('AIza') && apiKey.length > 20;
}

// ============================================
// Client Initialization
// ============================================

let geminiClient: GoogleGenAI | null = null;

/**
 * Gemini 클라이언트 초기화
 */
export function initializeClient(apiKey?: string): GoogleGenAI {
  const key = apiKey || loadAPIKey();

  if (!key) {
    throw createError('auth_error', 'NO_API_KEY', 'Gemini API 키가 설정되지 않았습니다.');
  }

  geminiClient = new GoogleGenAI({ apiKey: key });

  console.log('[GeminiClient] 클라이언트 초기화됨 (새 SDK)');
  return geminiClient;
}

/**
 * 현재 클라이언트 가져오기 (없으면 초기화)
 */
function getClient(): GoogleGenAI {
  if (!geminiClient) {
    return initializeClient();
  }
  return geminiClient;
}

// ============================================
// Error Handling
// ============================================

/**
 * AI 서비스 에러 생성
 */
function createError(
  type: AIServiceError['type'],
  code: string,
  message: string,
  originalError?: unknown,
  retryable = false,
  retryAfter?: number
): AIServiceError {
  return {
    type,
    code,
    message,
    originalError,
    retryable,
    retryAfter,
  };
}

/**
 * Gemini API 에러를 AIServiceError로 변환
 */
function handleAPIError(error: unknown): AIServiceError {
  console.error('[GeminiClient] API 에러:', error);

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
      return createError(
        'auth_error',
        'INVALID_API_KEY',
        'Gemini API 키가 유효하지 않습니다. 설정에서 API 키를 확인해 주세요.',
        error,
        false
      );
    }

    if (message.includes('quota') || message.includes('rate limit') || message.includes('429')) {
      return createError(
        'rate_limit',
        'RATE_LIMIT_EXCEEDED',
        '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
        error,
        true,
        60000
      );
    }

    if (message.includes('invalid') || message.includes('400')) {
      return createError(
        'invalid_request',
        'BAD_REQUEST',
        '잘못된 요청입니다. 메시지를 확인해 주세요.',
        error,
        false
      );
    }

    if (message.includes('500') || message.includes('server')) {
      return createError(
        'api_error',
        'SERVER_ERROR',
        'Gemini 서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        error,
        true,
        5000
      );
    }
  }

  // 네트워크 에러
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createError(
      'network_error',
      'NETWORK_ERROR',
      '네트워크 연결을 확인해 주세요.',
      error,
      true,
      3000
    );
  }

  // 기타 에러
  return createError(
    'api_error',
    'UNKNOWN_ERROR',
    error instanceof Error ? error.message : 'AI 호출 중 알 수 없는 오류가 발생했습니다.',
    error,
    false
  );
}

// ============================================
// Token & Cost Calculation
// ============================================

/**
 * Gemini 토큰 비용 계산
 */
export function calculateCost(
  model: GeminiModel,
  inputTokens: number,
  outputTokens: number,
  cachedInputTokens = 0
): number {
  const costs = GEMINI_TOKEN_COSTS[model];
  if (!costs) {
    console.warn('[GeminiClient] 알 수 없는 모델:', model);
    return 0;
  }

  const regularInputTokens = inputTokens - cachedInputTokens;
  const inputCost = (regularInputTokens / 1000) * costs.input;
  const cachedCost = (cachedInputTokens / 1000) * costs.cachedInput;
  const outputCost = (outputTokens / 1000) * costs.output;

  return Math.round((inputCost + cachedCost + outputCost) * 1000000) / 1000000;
}

/**
 * 캐싱으로 절감된 비용 계산
 */
export function calculateSavings(
  model: GeminiModel,
  cachedInputTokens: number
): number {
  const costs = GEMINI_TOKEN_COSTS[model];
  if (!costs) return 0;

  const withoutCache = (cachedInputTokens / 1000) * costs.input;
  const withCache = (cachedInputTokens / 1000) * costs.cachedInput;

  return Math.round((withoutCache - withCache) * 1000000) / 1000000;
}

// ============================================
// Cache Management
// ============================================

/**
 * 로컬 캐시 정보 저장
 */
function saveCacheInfo(cacheInfo: GeminiCacheInfo): void {
  const storage = loadCacheStorage();
  storage[cacheInfo.projectId] = cacheInfo;
  localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(storage));
}

/**
 * 로컬 캐시 정보 로드
 */
function loadCacheStorage(): CacheStorage {
  const data = localStorage.getItem(CACHE_STORAGE_KEY);
  if (!data) return {};

  try {
    const storage = JSON.parse(data) as CacheStorage;
    // Date 객체 복원
    for (const key in storage) {
      storage[key].createdAt = new Date(storage[key].createdAt);
      storage[key].expiresAt = new Date(storage[key].expiresAt);
    }
    return storage;
  } catch {
    return {};
  }
}

/**
 * 프로젝트의 캐시 정보 가져오기
 */
export function getCacheInfo(projectId: string): GeminiCacheInfo | null {
  const storage = loadCacheStorage();
  const info = storage[projectId];

  if (!info) return null;

  // 만료 확인
  if (new Date() > info.expiresAt) {
    deleteCacheInfo(projectId);
    return null;
  }

  return info;
}

/**
 * 캐시 정보 삭제
 */
function deleteCacheInfo(projectId: string): void {
  const storage = loadCacheStorage();
  delete storage[projectId];
  localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(storage));
}

/**
 * 프로젝트 컨텍스트를 캐싱
 */
export async function createProjectCache(
  projectId: string,
  systemPrompt: string,
  model: GeminiModel = 'gemini-2.5-pro'
): Promise<GeminiCacheInfo> {
  const client = getClient();

  // 토큰 수 추정 (대략 4자당 1토큰)
  const estimatedTokens = Math.ceil(systemPrompt.length / 4);

  if (estimatedTokens < MIN_CACHE_TOKENS) {
    throw createError(
      'invalid_request',
      'INSUFFICIENT_TOKENS',
      `캐싱하려면 최소 ${MIN_CACHE_TOKENS} 토큰이 필요합니다. (현재: ~${estimatedTokens} 토큰)`
    );
  }

  console.log(`[GeminiClient] 캐시 생성 시작: ~${estimatedTokens} 토큰`);

  try {
    const cache = await client.caches.create({
      model: model,
      config: {
        displayName: `StoryForge-${projectId}`,
        systemInstruction: systemPrompt,
        ttl: DEFAULT_CACHE_TTL,
      },
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3600000); // 1시간 후

    const cacheInfo: GeminiCacheInfo = {
      name: cache.name || '',
      projectId,
      model,
      tokenCount: cache.usageMetadata?.totalTokenCount || estimatedTokens,
      createdAt: now,
      expiresAt,
    };

    saveCacheInfo(cacheInfo);

    console.log(`[GeminiClient] 캐시 생성 완료: ${cacheInfo.name} (${cacheInfo.tokenCount} 토큰)`);

    return cacheInfo;
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * 캐시 갱신 (기존 캐시 삭제 후 새로 생성)
 */
export async function refreshProjectCache(
  projectId: string,
  systemPrompt: string,
  model: GeminiModel = 'gemini-2.5-pro'
): Promise<GeminiCacheInfo> {
  // 기존 캐시 삭제
  await deleteProjectCache(projectId);

  // 새 캐시 생성
  return createProjectCache(projectId, systemPrompt, model);
}

/**
 * 캐시 삭제
 */
export async function deleteProjectCache(projectId: string): Promise<void> {
  const cacheInfo = getCacheInfo(projectId);

  if (cacheInfo) {
    try {
      const client = getClient();
      await client.caches.delete({ name: cacheInfo.name });
      console.log(`[GeminiClient] 캐시 삭제됨: ${cacheInfo.name}`);
    } catch (error) {
      console.warn('[GeminiClient] 원격 캐시 삭제 실패:', error);
    }

    deleteCacheInfo(projectId);
  }
}

/**
 * 캐시가 유효한지 확인
 */
export function isCacheValid(projectId: string): boolean {
  const info = getCacheInfo(projectId);
  return info !== null && new Date() < info.expiresAt;
}

// ============================================
// Message Formatting
// ============================================

/**
 * ChatMessage 배열을 Gemini API 형식으로 변환
 */
function formatMessagesForAPI(messages: ChatMessage[]): Content[] {
  const formatted: Content[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') continue;
    if (msg.status !== 'complete' && msg.status !== 'streaming') continue;

    formatted.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  return formatted;
}

// ============================================
// API Calls (with Caching Support)
// ============================================

/**
 * Chat Completion API 호출 (캐시 지원)
 */
export async function sendMessage(
  messages: ChatMessage[],
  systemPrompt?: string,
  config: Partial<AIConfig> = {},
  projectId?: string
): Promise<{
  message: ChatMessage;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  cost: number;
}> {
  const client = getClient();
  const modelName = (config.model || 'gemini-2.5-flash-lite') as GeminiModel;

  try {
    const formattedMessages = formatMessagesForAPI(messages);

    // 캐시 확인
    const cacheInfo = projectId ? getCacheInfo(projectId) : null;
    let cachedTokens = 0;

    let response;

    if (cacheInfo && cacheInfo.model === modelName) {
      // 캐시 사용
      console.log(`[GeminiClient] 캐시 사용: ${cacheInfo.name}`);
      cachedTokens = cacheInfo.tokenCount;

      response = await client.models.generateContent({
        model: modelName,
        contents: formattedMessages,
        config: {
          cachedContent: cacheInfo.name,
          maxOutputTokens: config.maxTokens || 4096,
          temperature: config.temperature || 0.7,
        },
      });
    } else {
      // 캐시 없이 일반 요청
      response = await client.models.generateContent({
        model: modelName,
        contents: formattedMessages,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: config.maxTokens || 4096,
          temperature: config.temperature || 0.7,
        },
      });
    }

    const content = response.text || '';
    const usageMetadata = response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;
    const cost = calculateCost(modelName, inputTokens, outputTokens, cachedTokens);

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content,
      status: 'complete',
      timestamp: new Date(),
      tokenCount: outputTokens,
      model: modelName,
      stopReason: 'end_turn',
    };

    const savings = cachedTokens > 0 ? calculateSavings(modelName, cachedTokens) : 0;
    console.log(`[GeminiClient] 응답 완료: ${inputTokens} + ${outputTokens} tokens (캐시: ${cachedTokens}), $${cost.toFixed(6)} (절감: $${savings.toFixed(6)})`);

    return {
      message: assistantMessage,
      inputTokens,
      outputTokens,
      cachedTokens,
      cost,
    };
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Chat Completion API 호출 (스트리밍 + 캐시 지원)
 */
export async function sendMessageStream(
  messages: ChatMessage[],
  systemPrompt: string | undefined,
  config: Partial<AIConfig>,
  callbacks: {
    onStart?: () => void;
    onToken?: (token: string) => void;
    onComplete?: (message: ChatMessage, inputTokens: number, outputTokens: number, cachedTokens?: number) => void;
    onError?: (error: AIServiceError) => void;
  },
  projectId?: string
): Promise<void> {
  const client = getClient();
  const modelName = (config.model || 'gemini-2.5-flash-lite') as GeminiModel;

  try {
    callbacks.onStart?.();

    const formattedMessages = formatMessagesForAPI(messages);

    // 캐시 확인
    const cacheInfo = projectId ? getCacheInfo(projectId) : null;
    let cachedTokens = 0;

    let stream;

    if (cacheInfo && cacheInfo.model === modelName) {
      // 캐시 사용
      console.log(`[GeminiClient] 스트리밍 캐시 사용: ${cacheInfo.name}`);
      cachedTokens = cacheInfo.tokenCount;

      stream = await client.models.generateContentStream({
        model: modelName,
        contents: formattedMessages,
        config: {
          cachedContent: cacheInfo.name,
          maxOutputTokens: config.maxTokens || 4096,
          temperature: config.temperature || 0.7,
        },
      });
    } else {
      // 캐시 없이 일반 요청
      stream = await client.models.generateContentStream({
        model: modelName,
        contents: formattedMessages,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: config.maxTokens || 4096,
          temperature: config.temperature || 0.7,
        },
      });
    }

    let content = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      const text = chunk.text || '';
      if (text) {
        content += text;
        callbacks.onToken?.(text);
      }

      // 토큰 정보 업데이트
      if (chunk.usageMetadata) {
        inputTokens = chunk.usageMetadata.promptTokenCount || 0;
        outputTokens = chunk.usageMetadata.candidatesTokenCount || 0;
      }
    }

    const cost = calculateCost(modelName, inputTokens, outputTokens, cachedTokens);

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content,
      status: 'complete',
      timestamp: new Date(),
      tokenCount: outputTokens,
      model: modelName,
      stopReason: 'end_turn',
    };

    const savings = cachedTokens > 0 ? calculateSavings(modelName, cachedTokens) : 0;
    console.log(`[GeminiClient] 스트리밍 완료: ${inputTokens} + ${outputTokens} tokens (캐시: ${cachedTokens}), $${cost.toFixed(6)} (절감: $${savings.toFixed(6)})`);

    callbacks.onComplete?.(assistantMessage, inputTokens, outputTokens, cachedTokens);
  } catch (error) {
    const serviceError = handleAPIError(error);
    callbacks.onError?.(serviceError);
    throw serviceError;
  }
}

/**
 * API 연결 테스트
 */
export async function testConnection(apiKey?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = apiKey ? new GoogleGenAI({ apiKey }) : getClient();

    // gemini-2.5-flash-lite를 사용 (가장 저렴한 모델)
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: 'Say "Hello"',
    });
    const text = response.text || '';

    console.log('[GeminiClient] 연결 테스트 성공:', text.substring(0, 50));
    return { success: true };
  } catch (error) {
    console.error('[GeminiClient] 연결 테스트 원본 에러:', error);
    const serviceError = handleAPIError(error);
    console.error('[GeminiClient] 연결 테스트 실패:', serviceError.message);
    return { success: false, error: serviceError.message };
  }
}

// ============================================
// Exports
// ============================================

export default {
  // API Key Management
  saveAPIKey,
  loadAPIKey,
  clearAPIKey,
  isValidAPIKey,

  // Client
  initializeClient,

  // Messaging
  sendMessage,
  sendMessageStream,
  testConnection,

  // Cost
  calculateCost,
  calculateSavings,

  // Caching
  createProjectCache,
  refreshProjectCache,
  deleteProjectCache,
  getCacheInfo,
  isCacheValid,
};
