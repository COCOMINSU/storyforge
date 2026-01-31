/**
 * 타입 정의 모음
 *
 * 모든 타입 정의를 중앙에서 re-export합니다.
 * 다른 모듈에서는 '@/types'에서 직접 import할 수 있습니다.
 *
 * @example
 * import type { Project, Scene, CharacterCard } from '@/types';
 */

// 프로젝트 관련 타입
export type {
  ProjectTemplate,
  DocumentStatus,
  Project,
  TemplateConfig,
} from './project';

// 문서 관련 타입
export type {
  Volume,
  Chapter,
  Scene,
  VersionReason,
  DocumentVersion,
  TreeNode,
} from './document';

// 세계관 관련 타입
export type {
  CardType,
  CharacterRole,
  WorldCardBase,
  CharacterCard,
  LocationCard,
  ItemCard,
  WorldCard,
  Relationship,
} from './worldbuilding';

// 공통 타입
export type {
  SaveStatus,
  SyncStatus,
  ModalType,
  LeftPanelTab,
  Theme,
  CharCountResult,
  User,
  SyncInfo,
  ShortcutDefinition,
  ExportOptions,
  ImportResult,
} from './common';

// AI 관련 타입 (Phase 2)
export type {
  // AI 설정 및 모델
  AIModel,
  AIConfig,
  AIAPIConfig,

  // 대화 메시지
  MessageRole,
  MessageStatus,
  ChatMessage,
  SuggestedAction,
  ActionType,

  // 대화 세션
  ConversationType,
  ChatSession,

  // 맥락 관리
  ProjectContext,
  CharacterSummary,
  ContextBudget,

  // 줄거리 설정
  PlotSettingStep,
  PlotSettingState,

  // 인물 설정
  CharacterSettingStep,
  CharacterSettingState,

  // 실시간 요약
  RealtimeSummary,

  // 토큰 및 비용 관리
  TokenUsage,
  DailyUsageSummary,
  UsageLimits,

  // API 응답 타입
  ClaudeMessageResponse,
  ClaudeStreamEvent,
  AIServiceError,
} from './ai';
