/**
 * Zustand 스토어 모음
 *
 * 모든 스토어를 중앙에서 re-export합니다.
 * 다른 모듈에서는 '@/stores'에서 직접 import할 수 있습니다.
 *
 * @example
 * import {
 *   useProjectStore,
 *   useDocumentStore,
 *   useEditorStore,
 * } from '@/stores';
 */

// 프로젝트 스토어
export { useProjectStore, TEMPLATE_CONFIGS } from './useProjectStore';

// 문서 스토어
export { useDocumentStore } from './useDocumentStore';

// 에디터 스토어
export { useEditorStore } from './useEditorStore';

// 세계관 스토어
export { useWorldStore } from './useWorldStore';

// UI 스토어
export { useUIStore, initializeTheme } from './useUIStore';

// 인증 스토어
export { useAuthStore } from './useAuthStore';

// AI 스토어 (Phase 2)
export { useAIStore, initializeAIStore } from './useAIStore';
