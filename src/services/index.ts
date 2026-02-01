/**
 * 서비스 모음
 *
 * 외부 서비스와의 통신을 담당하는 모듈들을 export합니다.
 */

// 동기화 서비스
export {
  uploadProject,
  downloadProject,
  getRemoteProjects,
  deleteRemoteProject,
  checkConflict,
  syncProject,
  type SyncResult,
  type SyncConflict,
} from './syncService';

// AI 서비스 (Phase 2)
export {
  // Provider utilities
  getProviderFromModel,
  PROVIDER_MODELS,
  PROVIDER_INFO,

  // API Key Management (multi-provider)
  saveAPIKey,
  loadAPIKey,
  loadAllAPIKeys,
  clearAPIKey,
  isValidAPIKey,
  hasAPIKey,
  getConfiguredProviders,

  // API Calls
  sendMessage,
  sendMessageStream,
  testConnection,

  // Utilities
  calculateCost,
  estimateTokens,

  // Constants
  DEFAULT_AI_CONFIG,

  // Context Manager
  DEFAULT_CONTEXT_BUDGET,
  truncateToTokenBudget,
  buildProjectContext,
  getRecentContentSummary,
  formatContextAsSystemPrompt,
  getBaseSystemPrompt,
  buildFullSystemPrompt,
  optimizeHistoryForTokenBudget,
  calculateHistoryTokens,

  // Default exports
  claudeClient,
  openaiClient,
  geminiClient,
  unifiedClient,
  contextManager,
} from './ai';
