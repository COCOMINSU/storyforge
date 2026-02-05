/**
 * OpenAI GPT API 클라이언트
 *
 * OpenAI GPT API와 통신하는 서비스입니다.
 *
 * 주요 기능:
 * - Chat Completions API 호출
 * - 스트리밍 응답 처리
 * - 에러 핸들링 및 재시도
 * - 토큰 사용량 추적
 */

import OpenAI from 'openai';
import type {
  AIConfig,
  GPTModel,
  ChatMessage,
  AIServiceError,
} from '@/types';
import { generateId } from '@/lib/id';

// ============================================
// Constants
// ============================================

/**
 * GPT 모델별 토큰 비용 (USD per 1K tokens, 2025년 8월 기준)
 * https://openai.com/pricing
 */
const GPT_TOKEN_COSTS: Record<GPTModel, { input: number; output: number }> = {
  'gpt-5': { input: 0.00125, output: 0.01 },       // $1.25/$10 per 1M
  'gpt-5-mini': { input: 0.00025, output: 0.002 }, // $0.25/$2 per 1M
  'gpt-5-nano': { input: 0.00005, output: 0.0004 }, // $0.05/$0.40 per 1M
};

/**
 * API 키 저장소 키
 */
const API_KEY_STORAGE_KEY = 'storyforge-openai-api-key';

// ============================================
// API Key Management
// ============================================

/**
 * API 키 저장
 */
export function saveAPIKey(apiKey: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  console.log('[OpenAIClient] API 키 저장됨');
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
  console.log('[OpenAIClient] API 키 삭제됨');
}

/**
 * API 키 유효성 검증 (간단한 형식 체크)
 */
export function isValidAPIKey(apiKey: string): boolean {
  // OpenAI API 키는 'sk-' 접두사로 시작
  return apiKey.startsWith('sk-') && apiKey.length > 20;
}

// ============================================
// Client Initialization
// ============================================

let openaiClient: OpenAI | null = null;

/**
 * OpenAI 클라이언트 초기화
 */
export function initializeClient(apiKey?: string): OpenAI {
  const key = apiKey || loadAPIKey();

  if (!key) {
    throw createError('auth_error', 'NO_API_KEY', 'OpenAI API 키가 설정되지 않았습니다.');
  }

  openaiClient = new OpenAI({
    apiKey: key,
    dangerouslyAllowBrowser: true,
  });

  console.log('[OpenAIClient] 클라이언트 초기화됨');
  return openaiClient;
}

/**
 * 현재 클라이언트 가져오기 (없으면 초기화)
 */
function getClient(): OpenAI {
  if (!openaiClient) {
    return initializeClient();
  }
  return openaiClient;
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
 * OpenAI API 에러를 AIServiceError로 변환
 */
function handleAPIError(error: unknown): AIServiceError {
  console.error('[OpenAIClient] API 에러:', error);

  if (error instanceof OpenAI.APIError) {
    const status = error.status;

    if (status === 401) {
      return createError(
        'auth_error',
        'INVALID_API_KEY',
        'OpenAI API 키가 유효하지 않습니다. 설정에서 API 키를 확인해 주세요.',
        error,
        false
      );
    }

    if (status === 429) {
      return createError(
        'rate_limit',
        'RATE_LIMIT_EXCEEDED',
        '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
        error,
        true,
        60000
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

    if (status && status >= 500) {
      return createError(
        'api_error',
        'SERVER_ERROR',
        'OpenAI 서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
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
      status ? status >= 500 : false
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
 * GPT 토큰 비용 계산
 */
export function calculateCost(
  model: GPTModel,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = GPT_TOKEN_COSTS[model];
  if (!costs) {
    console.warn('[OpenAIClient] 알 수 없는 모델:', model);
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
 * ChatMessage 배열을 OpenAI API 형식으로 변환
 */
function formatMessagesForAPI(
  messages: ChatMessage[],
  systemPrompt?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const formatted: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  // 시스템 프롬프트 추가
  if (systemPrompt) {
    formatted.push({ role: 'system', content: systemPrompt });
  }

  for (const msg of messages) {
    if (msg.role === 'system') continue;
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
  const model = (config.model || 'gpt-5-mini') as GPTModel;

  try {
    const formattedMessages = formatMessagesForAPI(messages, systemPrompt);

    const response = await client.chat.completions.create({
      model,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      messages: formattedMessages,
    });

    const content = response.choices[0]?.message?.content || '';
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const cost = calculateCost(model, inputTokens, outputTokens);

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content,
      status: 'complete',
      timestamp: new Date(),
      tokenCount: outputTokens,
      model,
      stopReason: response.choices[0]?.finish_reason === 'stop' ? 'end_turn' : 'max_tokens',
    };

    console.log(`[OpenAIClient] 응답 완료: ${inputTokens} + ${outputTokens} tokens, $${cost.toFixed(6)}`);

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
  const model = (config.model || 'gpt-5-mini') as GPTModel;

  try {
    callbacks.onStart?.();

    const formattedMessages = formatMessagesForAPI(messages, systemPrompt);

    const stream = await client.chat.completions.create({
      model,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      messages: formattedMessages,
      stream: true,
      stream_options: { include_usage: true },
    });

    let content = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let finishReason: string | null = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        content += delta.content;
        callbacks.onToken?.(delta.content);
      }

      if (chunk.choices[0]?.finish_reason) {
        finishReason = chunk.choices[0].finish_reason;
      }

      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens || 0;
        outputTokens = chunk.usage.completion_tokens || 0;
      }
    }

    const cost = calculateCost(model, inputTokens, outputTokens);

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content,
      status: 'complete',
      timestamp: new Date(),
      tokenCount: outputTokens,
      model,
      stopReason: finishReason === 'stop' ? 'end_turn' : 'max_tokens',
    };

    console.log(`[OpenAIClient] 스트리밍 완료: ${inputTokens} + ${outputTokens} tokens, $${cost.toFixed(6)}`);

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
    const client = apiKey
      ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
      : getClient();

    await client.chat.completions.create({
      model: 'gpt-5-nano',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });

    console.log('[OpenAIClient] 연결 테스트 성공');
    return { success: true };
  } catch (error) {
    const serviceError = handleAPIError(error);
    console.error('[OpenAIClient] 연결 테스트 실패:', serviceError.message);
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
