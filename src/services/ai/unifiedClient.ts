/**
 * 통합 AI 클라이언트
 *
 * 여러 AI 제공자(Anthropic, OpenAI, Google)를 통합하여
 * 일관된 인터페이스를 제공합니다.
 */

import * as claudeClient from './claudeClient';
import * as openaiClient from './openaiClient';
import * as geminiClient from './geminiClient';
import type {
  AIConfig,
  AIProvider,
  AIModel,
  AIAPIKeys,
  ClaudeModel,
  GPTModel,
  GeminiModel,
  ChatMessage,
  AIServiceError,
} from '@/types';

// ============================================
// Provider Detection
// ============================================

/**
 * 모델 ID로 제공자 감지
 */
export function getProviderFromModel(model: AIModel): AIProvider {
  if (model.startsWith('claude')) return 'anthropic';
  if (model.startsWith('gpt')) return 'openai';
  if (model.startsWith('gemini')) return 'google';
  return 'anthropic'; // 기본값
}

/**
 * 제공자별 사용 가능한 모델 목록
 */
export const PROVIDER_MODELS: Record<AIProvider, { id: AIModel; name: string; description: string }[]> = {
  anthropic: [
    { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: '최고 성능, 복잡한 작업에 적합' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: '균형 잡힌 성능과 비용' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude Haiku 3.5', description: '빠른 응답, 간단한 작업에 적합' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', description: '최신 멀티모달 모델' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '빠르고 저렴한 소형 모델' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '강력한 성능의 이전 버전' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '빠르고 저렴한 범용 모델' },
  ],
  google: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '최신 빠른 모델' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '강력한 성능의 대형 모델' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '빠르고 효율적인 모델' },
  ],
};

/**
 * 제공자 정보
 */
export const PROVIDER_INFO: Record<AIProvider, {
  name: string;
  description: string;
  keyPrefix: string;
  keyPlaceholder: string;
  consoleUrl: string;
}> = {
  anthropic: {
    name: 'Anthropic (Claude)',
    description: 'Claude AI 모델',
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-...',
    consoleUrl: 'https://console.anthropic.com/',
  },
  openai: {
    name: 'OpenAI (GPT)',
    description: 'GPT AI 모델',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    consoleUrl: 'https://platform.openai.com/api-keys',
  },
  google: {
    name: 'Google (Gemini)',
    description: 'Gemini AI 모델',
    keyPrefix: 'AIza',
    keyPlaceholder: 'AIza...',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
  },
};

// ============================================
// API Key Management
// ============================================

/**
 * 제공자별 API 키 저장
 */
export function saveAPIKey(provider: AIProvider, apiKey: string): void {
  switch (provider) {
    case 'anthropic':
      claudeClient.saveAPIKey(apiKey);
      break;
    case 'openai':
      openaiClient.saveAPIKey(apiKey);
      break;
    case 'google':
      geminiClient.saveAPIKey(apiKey);
      break;
  }
}

/**
 * 제공자별 API 키 로드
 */
export function loadAPIKey(provider: AIProvider): string | null {
  switch (provider) {
    case 'anthropic':
      return claudeClient.loadAPIKey();
    case 'openai':
      return openaiClient.loadAPIKey();
    case 'google':
      return geminiClient.loadAPIKey();
    default:
      return null;
  }
}

/**
 * 모든 제공자의 API 키 로드
 */
export function loadAllAPIKeys(): AIAPIKeys {
  return {
    anthropic: claudeClient.loadAPIKey() || undefined,
    openai: openaiClient.loadAPIKey() || undefined,
    google: geminiClient.loadAPIKey() || undefined,
  };
}

/**
 * 제공자별 API 키 삭제
 */
export function clearAPIKey(provider: AIProvider): void {
  switch (provider) {
    case 'anthropic':
      claudeClient.clearAPIKey();
      break;
    case 'openai':
      openaiClient.clearAPIKey();
      break;
    case 'google':
      geminiClient.clearAPIKey();
      break;
  }
}

/**
 * 제공자별 API 키 유효성 검증
 */
export function isValidAPIKey(provider: AIProvider, apiKey: string): boolean {
  switch (provider) {
    case 'anthropic':
      return claudeClient.isValidAPIKey(apiKey);
    case 'openai':
      return openaiClient.isValidAPIKey(apiKey);
    case 'google':
      return geminiClient.isValidAPIKey(apiKey);
    default:
      return false;
  }
}

/**
 * 제공자별 API 키 설정 여부
 */
export function hasAPIKey(provider: AIProvider): boolean {
  return !!loadAPIKey(provider);
}

/**
 * 설정된 제공자 목록
 */
export function getConfiguredProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (hasAPIKey('anthropic')) providers.push('anthropic');
  if (hasAPIKey('openai')) providers.push('openai');
  if (hasAPIKey('google')) providers.push('google');
  return providers;
}

// ============================================
// Connection Test
// ============================================

/**
 * 제공자별 연결 테스트
 */
export async function testConnection(
  provider: AIProvider,
  apiKey?: string
): Promise<{ success: boolean; error?: string }> {
  switch (provider) {
    case 'anthropic':
      return claudeClient.testConnection(apiKey);
    case 'openai':
      return openaiClient.testConnection(apiKey);
    case 'google':
      return geminiClient.testConnection(apiKey);
    default:
      return { success: false, error: '알 수 없는 제공자입니다.' };
  }
}

// ============================================
// Message Sending
// ============================================

/**
 * 통합 메시지 전송 (일반)
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
  const provider = config.provider || getProviderFromModel(config.model || 'claude-opus-4-5-20251101');

  switch (provider) {
    case 'anthropic':
      return claudeClient.sendMessage(messages, systemPrompt, config);
    case 'openai':
      return openaiClient.sendMessage(messages, systemPrompt, config);
    case 'google':
      return geminiClient.sendMessage(messages, systemPrompt, config);
    default:
      throw new Error('알 수 없는 AI 제공자입니다.');
  }
}

/**
 * 통합 메시지 전송 (스트리밍)
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
  const provider = config.provider || getProviderFromModel(config.model || 'claude-opus-4-5-20251101');

  switch (provider) {
    case 'anthropic':
      return claudeClient.sendMessageStream(messages, systemPrompt, config, callbacks);
    case 'openai':
      return openaiClient.sendMessageStream(messages, systemPrompt, config, callbacks);
    case 'google':
      return geminiClient.sendMessageStream(messages, systemPrompt, config, callbacks);
    default:
      throw new Error('알 수 없는 AI 제공자입니다.');
  }
}

// ============================================
// Cost Calculation
// ============================================

/**
 * 통합 비용 계산
 */
export function calculateCost(
  model: AIModel,
  inputTokens: number,
  outputTokens: number
): number {
  const provider = getProviderFromModel(model);

  switch (provider) {
    case 'anthropic':
      return claudeClient.calculateCost(model as ClaudeModel, inputTokens, outputTokens);
    case 'openai':
      return openaiClient.calculateCost(model as GPTModel, inputTokens, outputTokens);
    case 'google':
      return geminiClient.calculateCost(model as GeminiModel, inputTokens, outputTokens);
    default:
      return 0;
  }
}

// ============================================
// Exports
// ============================================

export default {
  // Provider utilities
  getProviderFromModel,
  PROVIDER_MODELS,
  PROVIDER_INFO,

  // API Key management
  saveAPIKey,
  loadAPIKey,
  loadAllAPIKeys,
  clearAPIKey,
  isValidAPIKey,
  hasAPIKey,
  getConfiguredProviders,

  // Connection
  testConnection,

  // Messaging
  sendMessage,
  sendMessageStream,

  // Cost
  calculateCost,
};
