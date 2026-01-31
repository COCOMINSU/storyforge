/**
 * Claude API 클라이언트
 *
 * Anthropic Claude API와 통신하는 서비스입니다.
 *
 * 주요 기능:
 * - Messages API 호출
 * - 스트리밍 응답 처리
 * - 에러 핸들링 및 재시도
 * - 토큰 사용량 추적
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AIConfig,
  AIModel,
  ChatMessage,
  AIServiceError,
} from '@/types';
import { generateId } from '@/lib/id';

// ============================================
// Constants
// ============================================

/**
 * 모델별 토큰 비용 (USD per 1K tokens, 2025년 기준)
 * https://www.anthropic.com/pricing
 */
const TOKEN_COSTS: Record<AIModel, { input: number; output: number }> = {
  'claude-opus-4-5-20251101': { input: 0.015, output: 0.075 },
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
  'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 },
};

/**
 * 기본 AI 설정
 */
export const DEFAULT_AI_CONFIG: AIConfig = {
  model: 'claude-opus-4-5-20251101',
  temperature: 0.7,
  maxTokens: 4096,
  streamEnabled: true,
};

/**
 * API 키 저장소 키
 */
const API_KEY_STORAGE_KEY = 'storyforge-claude-api-key';

// ============================================
// API Key Management
// ============================================

/**
 * API 키 저장
 *
 * localStorage에 암호화 없이 저장합니다.
 * 프로덕션에서는 더 안전한 방식을 고려해야 합니다.
 */
export function saveAPIKey(apiKey: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  console.log('[ClaudeClient] API 키 저장됨');
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
  console.log('[ClaudeClient] API 키 삭제됨');
}

/**
 * API 키 유효성 검증 (간단한 형식 체크)
 */
export function isValidAPIKey(apiKey: string): boolean {
  // Claude API 키는 'sk-ant-' 접두사로 시작
  return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
}

// ============================================
// Client Initialization
// ============================================

let anthropicClient: Anthropic | null = null;

/**
 * Anthropic 클라이언트 초기화
 */
export function initializeClient(apiKey?: string): Anthropic {
  const key = apiKey || loadAPIKey();

  if (!key) {
    throw createError('auth_error', 'NO_API_KEY', 'API 키가 설정되지 않았습니다.');
  }

  anthropicClient = new Anthropic({
    apiKey: key,
    dangerouslyAllowBrowser: true, // 브라우저에서 직접 호출 허용
  });

  console.log('[ClaudeClient] 클라이언트 초기화됨');
  return anthropicClient;
}

/**
 * 현재 클라이언트 가져오기 (없으면 초기화)
 */
function getClient(): Anthropic {
  if (!anthropicClient) {
    return initializeClient();
  }
  return anthropicClient;
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
 * Anthropic API 에러를 AIServiceError로 변환
 */
function handleAPIError(error: unknown): AIServiceError {
  console.error('[ClaudeClient] API 에러:', error);

  if (error instanceof Anthropic.APIError) {
    const status = error.status;

    if (status === 401) {
      return createError(
        'auth_error',
        'INVALID_API_KEY',
        'API 키가 유효하지 않습니다. 설정에서 API 키를 확인해 주세요.',
        error,
        false
      );
    }

    if (status === 429) {
      const retryAfter = parseInt(error.headers?.['retry-after'] || '60', 10) * 1000;
      return createError(
        'rate_limit',
        'RATE_LIMIT_EXCEEDED',
        '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
        error,
        true,
        retryAfter
      );
    }

    if (status === 400) {
      return createError(
        'invalid_request',
        'BAD_REQUEST',
        '잘못된 요청입니다. 메시지를 확인해 주세요.',
        error,
        false
      );
    }

    if (status >= 500) {
      return createError(
        'api_error',
        'SERVER_ERROR',
        'Claude 서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        error,
        true,
        5000
      );
    }

    return createError(
      'api_error',
      `API_ERROR_${status}`,
      error.message || 'API 호출 중 오류가 발생했습니다.',
      error,
      status >= 500
    );
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
 * 토큰 비용 계산
 */
export function calculateCost(
  model: AIModel,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = TOKEN_COSTS[model];
  if (!costs) {
    console.warn('[ClaudeClient] 알 수 없는 모델:', model);
    return 0;
  }

  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;
  return Math.round((inputCost + outputCost) * 1000000) / 1000000; // 소수점 6자리
}

/**
 * 텍스트의 토큰 수 추정 (한국어 기준)
 *
 * Claude는 한국어에서 평균적으로 1토큰 ≈ 1.5자 정도입니다.
 * 정확한 토큰화는 서버에서 이루어지므로 이는 추정치입니다.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // 한국어와 영어 비율에 따라 추정
  const koreanCharCount = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  const englishWordCount = (text.match(/\b[a-zA-Z]+\b/g) || []).length;
  const otherCharCount = text.length - koreanCharCount - englishWordCount;

  // 한국어: ~1.5자/토큰, 영어: ~1단어/토큰, 기타: ~4자/토큰
  const koreanTokens = koreanCharCount / 1.5;
  const englishTokens = englishWordCount;
  const otherTokens = otherCharCount / 4;

  return Math.ceil(koreanTokens + englishTokens + otherTokens);
}

// ============================================
// Message Formatting
// ============================================

/**
 * ChatMessage 배열을 Claude API 형식으로 변환
 */
function formatMessagesForAPI(
  messages: ChatMessage[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const formatted: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const msg of messages) {
    // system 역할은 별도로 처리되므로 건너뜀
    if (msg.role === 'system') continue;

    // 완료된 메시지만 포함
    if (msg.status !== 'complete' && msg.status !== 'streaming') continue;

    formatted.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  return formatted;
}

// ============================================
// API Calls
// ============================================

/**
 * Chat Completion API 호출 (일반)
 *
 * 스트리밍 없이 전체 응답을 한 번에 받습니다.
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
  const mergedConfig = { ...DEFAULT_AI_CONFIG, ...config };

  try {
    const formattedMessages = formatMessagesForAPI(messages);

    const response = await client.messages.create({
      model: mergedConfig.model,
      max_tokens: mergedConfig.maxTokens,
      temperature: mergedConfig.temperature,
      system: systemPrompt,
      messages: formattedMessages,
    });

    // 응답에서 텍스트 추출
    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => {
        if (block.type === 'text') {
          return block.text;
        }
        return '';
      })
      .join('');

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = calculateCost(mergedConfig.model, inputTokens, outputTokens);

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content,
      status: 'complete',
      timestamp: new Date(),
      tokenCount: outputTokens,
      model: mergedConfig.model,
      stopReason: response.stop_reason as ChatMessage['stopReason'],
    };

    console.log(`[ClaudeClient] 응답 완료: ${inputTokens} + ${outputTokens} tokens, $${cost.toFixed(6)}`);

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
 *
 * 실시간으로 응답을 받아 콜백으로 전달합니다.
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
  const mergedConfig = { ...DEFAULT_AI_CONFIG, ...config };

  try {
    callbacks.onStart?.();

    const formattedMessages = formatMessagesForAPI(messages);

    const stream = await client.messages.stream({
      model: mergedConfig.model,
      max_tokens: mergedConfig.maxTokens,
      temperature: mergedConfig.temperature,
      system: systemPrompt,
      messages: formattedMessages,
    });

    let content = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let stopReason: ChatMessage['stopReason'] = undefined;

    for await (const event of stream) {
      if (event.type === 'message_start') {
        inputTokens = event.message.usage.input_tokens;
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          content += event.delta.text;
          callbacks.onToken?.(event.delta.text);
        }
      } else if (event.type === 'message_delta') {
        outputTokens = event.usage.output_tokens;
        stopReason = event.delta.stop_reason as ChatMessage['stopReason'];
      }
    }

    const cost = calculateCost(mergedConfig.model, inputTokens, outputTokens);

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content,
      status: 'complete',
      timestamp: new Date(),
      tokenCount: outputTokens,
      model: mergedConfig.model,
      stopReason,
    };

    console.log(`[ClaudeClient] 스트리밍 완료: ${inputTokens} + ${outputTokens} tokens, $${cost.toFixed(6)}`);

    callbacks.onComplete?.(assistantMessage, inputTokens, outputTokens);
  } catch (error) {
    const serviceError = handleAPIError(error);
    callbacks.onError?.(serviceError);
    throw serviceError;
  }
}

/**
 * API 연결 테스트
 *
 * API 키가 유효한지 확인합니다.
 */
export async function testConnection(apiKey?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = apiKey
      ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
      : getClient();

    // 최소한의 요청으로 연결 테스트
    await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });

    console.log('[ClaudeClient] 연결 테스트 성공');
    return { success: true };
  } catch (error) {
    const serviceError = handleAPIError(error);
    console.error('[ClaudeClient] 연결 테스트 실패:', serviceError.message);
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

  // API Calls
  sendMessage,
  sendMessageStream,
  testConnection,

  // Utilities
  calculateCost,
  estimateTokens,

  // Constants
  DEFAULT_AI_CONFIG,
};
