/**
 * AI 서비스 모음
 *
 * Claude AI와의 통신을 담당하는 모듈들을 export합니다.
 */

// Claude API 클라이언트
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

// Re-export defaults
export { default as claudeClient } from './claudeClient';
export { default as contextManager } from './contextManager';
