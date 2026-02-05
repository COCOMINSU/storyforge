/**
 * AI 서비스 모음
 *
 * 다중 AI 제공자(Claude, GPT, Gemini)와의 통신을 담당하는 모듈들을 export합니다.
 */

// 통합 AI 클라이언트 (권장)
export {
  // Provider utilities
  getProviderFromModel,
  PROVIDER_MODELS,
  PROVIDER_INFO,

  // API Key management (multi-provider)
  saveAPIKey,
  loadAPIKey,
  loadAllAPIKeys,
  clearAPIKey,
  isValidAPIKey,
  hasAPIKey,
  getConfiguredProviders,

  // Connection
  testConnection,

  // Messaging (unified)
  sendMessage,
  sendMessageStream,

  // Cost
  calculateCost,

  // Gemini Context Caching (90% 비용 절감)
  createGeminiCache,
  refreshGeminiCache,
  deleteGeminiCache,
  getGeminiCacheInfo,
  isGeminiCacheValid,
  calculateGeminiSavings,
} from './unifiedClient';
export type { GeminiCacheInfo } from './unifiedClient';

// Claude 전용 (레거시 호환성)
export {
  DEFAULT_AI_CONFIG,
  estimateTokens,
} from './claudeClient';

// 맥락 관리 서비스
export {
  // Constants
  DEFAULT_CONTEXT_BUDGET,

  // Token Utilities
  truncateToTokenBudget,

  // Context Building
  buildProjectContext,
  getRecentContentSummary,

  // System Prompt
  formatContextAsSystemPrompt,
  getBaseSystemPrompt,
  buildFullSystemPrompt,

  // History Optimization
  optimizeHistoryForTokenBudget,
  calculateHistoryTokens,

  // AI Agent Mode
  buildFullAgentContext,
  formatAgentSystemPrompt,
} from './contextManager';

// 줄거리 설정 프롬프트
export {
  PLOT_STEP_CONFIG,
  PLOT_STEPS,
  getPlotStepPrompt,
  buildPlotDataFromState,
} from './plotPrompts';

// 인물 설정 프롬프트
export {
  CHARACTER_STEP_CONFIG,
  CHARACTER_STEPS,
  getCharacterStepPrompt,
  buildCharacterCardFromState,
} from './characterPrompts';

// 실시간 요약 서비스
export {
  generateRealtimeSummary,
  calculateTotalCharCount,
  getRecentActivity,
} from './summaryService';

// 프롬프트 템플릿
export {
  PROMPT_TEMPLATES,
  getTemplate,
  getTemplatesByCategory,
  getAllTemplates,
} from './promptTemplates';
export type { PromptTemplate, PromptTemplateType } from './promptTemplates';

// 프롬프트 빌더
export {
  buildPrompt,
  buildSimplePrompt,
  buildContinuePrompt,
  buildBrainstormPrompt,
  buildSummarizePrompt,
  getPromptPreview,
  getRequiredVariables,
} from './promptBuilder';
export type { BuiltPrompt, VariableValues } from './promptBuilder';

// 스트리밍 핸들러
export {
  // Types
  type StreamStatus,
  type StreamSession,
  type StreamOptions,
  type StreamCallbacks,

  // Session Management
  createStreamSession,
  getStreamSession,
  updateStreamSession,
  closeStreamSession,
  abortStreamSession,
  abortAllSessions,

  // Classes
  ChunkBuffer,
  ConnectionMonitor,

  // Partial Response
  savePartialResponse,
  loadPartialResponse,
  clearPartialResponse,
  cleanupOldPartialResponses,

  // Utilities
  createPartialMessage,
  calculateStreamStats,
} from './streamHandler';

// AI 응답 파서 (Agent Mode)
export {
  parseAgentResponse,
  validateUpdateData,
} from './responseParser';

// 자동 업데이트 핸들러 (Agent Mode)
export {
  applyStoryforgeUpdate,
  applyStoryforgeUpdates,
} from './updateHandler';
export type { UpdateResult } from './updateHandler';

// Re-export defaults
export { default as claudeClient } from './claudeClient';
export { default as openaiClient } from './openaiClient';
export { default as geminiClient } from './geminiClient';
export { default as unifiedClient } from './unifiedClient';
export { default as contextManager } from './contextManager';
export { default as streamHandler } from './streamHandler';
export { default as responseParser } from './responseParser';
export { default as updateHandler } from './updateHandler';
