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
