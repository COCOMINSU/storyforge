/**
 * Google Gemini API 클라이언트
 *
 * Google Generative AI (Gemini) API와 통신하는 서비스입니다.
 *
 * 주요 기능:
 * - Generative AI API 호출
 * - 스트리밍 응답 처리
 * - 에러 핸들링 및 재시도
 * - 토큰 사용량 추적
 */

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
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
const GEMINI_TOKEN_COSTS: Record<GeminiModel, { input: number; output: number }> = {
  'gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
};

/**
 * API 키 저장소 키
 */
const API_KEY_STORAGE_KEY = 'storyforge-gemini-api-key';

/**
 * 안전 설정 (창작 활동을 위해 완화)
 */
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

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

let geminiClient: GoogleGenerativeAI | null = null;

/**
 * Gemini 클라이언트 초기화
 */
export function initializeClient(apiKey?: string): GoogleGenerativeAI {
  const key = apiKey || loadAPIKey();

  if (!key) {
    throw createError('auth_error', 'NO_API_KEY', 'Gemini API 키가 설정되지 않았습니다.');
  }

  geminiClient = new GoogleGenerativeAI(key);

  console.log('[GeminiClient] 클라이언트 초기화됨');
  return geminiClient;
}

/**
 * 현재 클라이언트 가져오기 (없으면 초기화)
 */
function getClient(): GoogleGenerativeAI {
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
  outputTokens: number
): number {
  const costs = GEMINI_TOKEN_COSTS[model];
  if (!costs) {
    console.warn('[GeminiClient] 알 수 없는 모델:', model);
    return 0;
  }

  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;
  return Math.round((inputCost + outputCost) * 1000000) / 1000000;
}

// ============================================
// Message Formatting
// ============================================

/**
 * ChatMessage 배열을 Gemini API 형식으로 변환
 */
function formatMessagesForAPI(
  messages: ChatMessage[]
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const formatted: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

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
// API Calls
// ============================================

/**
 * Chat Completion API 호출 (일반)
 */
export async function sendMessage(
  messages: ChatMessage[],
  systemPrompt?: string,
  config: Partial<AIConfig> = {}
): Promise<{
  message: ChatMessage;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}> {
  const client = getClient();
  const modelName = (config.model || 'gemini-1.5-flash') as GeminiModel;

  try {
    const model = client.getGenerativeModel({
      model: modelName,
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        maxOutputTokens: config.maxTokens || 4096,
        temperature: config.temperature || 0.7,
      },
      systemInstruction: systemPrompt,
    });

    const formattedMessages = formatMessagesForAPI(messages);
    const chat = model.startChat({
      history: formattedMessages.slice(0, -1),
    });

    const lastMessage = formattedMessages[formattedMessages.length - 1];
    const result = await chat.sendMessage(lastMessage?.parts[0]?.text || '');

    const content = result.response.text();
    const usageMetadata = result.response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;
    const cost = calculateCost(modelName, inputTokens, outputTokens);

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

    console.log(`[GeminiClient] 응답 완료: ${inputTokens} + ${outputTokens} tokens, $${cost.toFixed(6)}`);

    return {
      message: assistantMessage,
      inputTokens,
      outputTokens,
      cost,
    };
  } catch (error) {
    throw handleAPIError(error);
  }
}

/**
 * Chat Completion API 호출 (스트리밍)
 */
export async function sendMessageStream(
  messages: ChatMessage[],
  systemPrompt: string | undefined,
  config: Partial<AIConfig>,
  callbacks: {
    onStart?: () => void;
    onToken?: (token: string) => void;
    onComplete?: (message: ChatMessage, inputTokens: number, outputTokens: number) => void;
    onError?: (error: AIServiceError) => void;
  }
): Promise<void> {
  const client = getClient();
  const modelName = (config.model || 'gemini-1.5-flash') as GeminiModel;

  try {
    callbacks.onStart?.();

    const model = client.getGenerativeModel({
      model: modelName,
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        maxOutputTokens: config.maxTokens || 4096,
        temperature: config.temperature || 0.7,
      },
      systemInstruction: systemPrompt,
    });

    const formattedMessages = formatMessagesForAPI(messages);
    const chat = model.startChat({
      history: formattedMessages.slice(0, -1),
    });

    const lastMessage = formattedMessages[formattedMessages.length - 1];
    const result = await chat.sendMessageStream(lastMessage?.parts[0]?.text || '');

    let content = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        content += text;
        callbacks.onToken?.(text);
      }
    }

    // 최종 응답에서 토큰 정보 가져오기
    const finalResponse = await result.response;
    const usageMetadata = finalResponse.usageMetadata;
    inputTokens = usageMetadata?.promptTokenCount || 0;
    outputTokens = usageMetadata?.candidatesTokenCount || 0;

    const cost = calculateCost(modelName, inputTokens, outputTokens);

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

    console.log(`[GeminiClient] 스트리밍 완료: ${inputTokens} + ${outputTokens} tokens, $${cost.toFixed(6)}`);

    callbacks.onComplete?.(assistantMessage, inputTokens, outputTokens);
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
    const client = apiKey ? new GoogleGenerativeAI(apiKey) : getClient();

    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent('Hi');

    console.log('[GeminiClient] 연결 테스트 성공');
    return { success: true };
  } catch (error) {
    const serviceError = handleAPIError(error);
    console.error('[GeminiClient] 연결 테스트 실패:', serviceError.message);
    return { success: false, error: serviceError.message };
  }
}

// ============================================
// Exports
// ============================================

export default {
  saveAPIKey,
  loadAPIKey,
  clearAPIKey,
  isValidAPIKey,
  initializeClient,
  sendMessage,
  sendMessageStream,
  testConnection,
  calculateCost,
};
