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

  // Default export
  claudeClient,
} from './ai';
