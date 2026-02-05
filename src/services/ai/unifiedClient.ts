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
 * 제공자별 사용 가능한 모델 목록 (2025년 기준 최신)
 */
export const PROVIDER_MODELS: Record<AIProvider, { id: AIModel; name: string; description: string }[]> = {
  anthropic: [
    { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: '최고 성능, SWE-bench 80.9%' },
    { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', description: '가성비 최고, 복잡한 작업' },
    { id: 'claude-haiku-4-5-20251022', name: 'Claude Haiku 4.5', description: '빠르고 저렴, 간단한 작업' },
  ],
  openai: [
    { id: 'gpt-5', name: 'GPT-5', description: '최고 성능, 400K 컨텍스트' },
    { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: '가성비, 빠른 응답' },
    { id: 'gpt-5-nano', name: 'GPT-5 Nano', description: '가장 저렴, 간단한 작업' },
  ],
  google: [
    { id: 'gemini-3-pro', name: 'Gemini 3 Pro', description: '최신 추론 모델, 1M 컨텍스트' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: '가성비 우수, 안정적' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: '가장 저렴, 빠른 속도' },
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
 * @param projectId - Gemini 캐싱을 위한 프로젝트 ID (선택)
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
  cost: number;
}> {
  const provider = config.provider || getProviderFromModel(config.model || 'claude-opus-4-5-20251101');

  switch (provider) {
    case 'anthropic':
      return claudeClient.sendMessage(messages, systemPrompt, config);
    case 'openai':
      return openaiClient.sendMessage(messages, systemPrompt, config);
    case 'google': {
      const result = await geminiClient.sendMessage(messages, systemPrompt, config, projectId);
      // cachedTokens는 내부적으로 처리됨, 인터페이스 호환성을 위해 기본 반환
      return {
        message: result.message,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cost: result.cost,
      };
    }
    default:
      throw new Error('알 수 없는 AI 제공자입니다.');
  }
}

/**
 * 통합 메시지 전송 (스트리밍)
 * @param projectId - Gemini 캐싱을 위한 프로젝트 ID (선택)
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
  },
  projectId?: string
): Promise<void> {
  const provider = config.provider || getProviderFromModel(config.model || 'claude-opus-4-5-20251101');

  switch (provider) {
    case 'anthropic':
      return claudeClient.sendMessageStream(messages, systemPrompt, config, callbacks);
    case 'openai':
      return openaiClient.sendMessageStream(messages, systemPrompt, config, callbacks);
    case 'google':
      return geminiClient.sendMessageStream(messages, systemPrompt, config, callbacks, projectId);
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
// Gemini Context Caching
// ============================================

/**
 * Gemini 프로젝트 캐시 생성
 * 프로젝트 컨텍스트를 캐싱하여 90% 비용 절감
 */
export const createGeminiCache = geminiClient.createProjectCache;

/**
 * Gemini 캐시 갱신
 */
export const refreshGeminiCache = geminiClient.refreshProjectCache;

/**
 * Gemini 캐시 삭제
 */
export const deleteGeminiCache = geminiClient.deleteProjectCache;

/**
 * Gemini 캐시 정보 조회
 */
export const getGeminiCacheInfo = geminiClient.getCacheInfo;

/**
 * Gemini 캐시 유효 여부
 */
export const isGeminiCacheValid = geminiClient.isCacheValid;

/**
 * Gemini 캐싱으로 절감된 비용 계산
 */
export const calculateGeminiSavings = geminiClient.calculateSavings;

// Re-export type
export type { GeminiCacheInfo } from './geminiClient';

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

  // Gemini Caching
  createGeminiCache,
  refreshGeminiCache,
  deleteGeminiCache,
  getGeminiCacheInfo,
  isGeminiCacheValid,
  calculateGeminiSavings,
};
