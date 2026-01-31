/**
 * 키보드 단축키 훅
 *
 * 전역 단축키를 관리하고 처리합니다.
 * 에디터 내부 단축키(Ctrl+B, Ctrl+I 등)는 TipTap에서 처리합니다.
 */

import { useEffect, useCallback } from 'react';
import { useUIStore, useProjectStore } from '@/stores';
import { matchesShortcut } from '@/lib';

/**
 * 단축키 정의
 */
export interface ShortcutDefinition {
  /** 단축키 ID */
  id: string;
  /** 단축키 조합 (예: "Ctrl+S") */
  shortcut: string;
  /** 설명 */
  description: string;
  /** 카테고리 */
  category: 'general' | 'editor' | 'navigation' | 'project';
  /** 실행 함수 */
  action?: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

/**
 * 단축키 목록
 */
export const SHORTCUTS: ShortcutDefinition[] = [
  // 일반
  {
    id: 'show-shortcuts',
    shortcut: 'Ctrl+/',
    description: '단축키 도움말',
    category: 'general',
  },
  {
    id: 'settings',
    shortcut: 'Ctrl+,',
    description: '프로젝트 설정',
    category: 'general',
  },
  {
    id: 'close-modal',
    shortcut: 'Escape',
    description: '모달/팝업 닫기',
    category: 'general',
  },

  // 에디터 (TipTap 내장 + 커스텀)
  {
    id: 'save',
    shortcut: 'Ctrl+S',
    description: '저장 (수동)',
    category: 'editor',
  },
  {
    id: 'bold',
    shortcut: 'Ctrl+B',
    description: '굵게',
    category: 'editor',
  },
  {
    id: 'italic',
    shortcut: 'Ctrl+I',
    description: '기울임',
    category: 'editor',
  },
  {
    id: 'underline',
    shortcut: 'Ctrl+U',
    description: '밑줄',
    category: 'editor',
  },
  {
    id: 'undo',
    shortcut: 'Ctrl+Z',
    description: '실행 취소',
    category: 'editor',
  },
  {
    id: 'redo',
    shortcut: 'Ctrl+Y',
    description: '다시 실행',
    category: 'editor',
  },
  {
    id: 'redo-alt',
    shortcut: 'Ctrl+Shift+Z',
    description: '다시 실행',
    category: 'editor',
  },

  // 탐색
  {
    id: 'search',
    shortcut: 'Ctrl+F',
    description: '검색',
    category: 'navigation',
  },
  {
    id: 'quick-open',
    shortcut: 'Ctrl+P',
    description: '빠른 열기',
    category: 'navigation',
  },
  {
    id: 'project-search',
    shortcut: 'Ctrl+Shift+F',
    description: '프로젝트 전체 검색',
    category: 'navigation',
  },
  {
    id: 'toggle-left-panel',
    shortcut: 'Ctrl+\\',
    description: '좌측 패널 토글',
    category: 'navigation',
  },
  {
    id: 'toggle-right-panel',
    shortcut: 'Ctrl+Shift+\\',
    description: '우측 패널 토글',
    category: 'navigation',
  },

  // 프로젝트
  {
    id: 'new-project',
    shortcut: 'Ctrl+Shift+N',
    description: '새 프로젝트',
    category: 'project',
  },
  {
    id: 'version-history',
    shortcut: 'Ctrl+H',
    description: '버전 히스토리',
    category: 'project',
  },
  {
    id: 'writing-goal',
    shortcut: 'Ctrl+Shift+O',
    description: '글자수 목표',
    category: 'project',
  },
  {
    id: 'focus-mode',
    shortcut: 'F11',
    description: '집중 모드',
    category: 'general',
  },
];

/**
 * 카테고리별 단축키 그룹
 */
export function getShortcutsByCategory() {
  const categories = {
    general: { label: '일반', shortcuts: [] as ShortcutDefinition[] },
    editor: { label: '에디터', shortcuts: [] as ShortcutDefinition[] },
    navigation: { label: '탐색', shortcuts: [] as ShortcutDefinition[] },
    project: { label: '프로젝트', shortcuts: [] as ShortcutDefinition[] },
  };

  for (const shortcut of SHORTCUTS) {
    categories[shortcut.category].shortcuts.push(shortcut);
  }

  return categories;
}

/**
 * 전역 키보드 단축키 훅
 *
 * App 레벨에서 한 번만 사용해야 합니다.
 */
export function useKeyboardShortcuts() {
  const { openModal, activeModal, closeModal, toggleFocusMode, toggleLeftPanel, toggleRightPanel } = useUIStore();
  const { currentProject } = useProjectStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 입력 필드에서는 일부 단축키만 허용
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Escape는 항상 처리 (모달이 열려있을 때)
      if (event.key === 'Escape' && activeModal) {
        closeModal();
        return;
      }

      // 입력 필드에서는 네비게이션 단축키 무시
      if (isInputField) {
        // Ctrl+S는 에디터에서 처리하므로 여기서는 무시
        // Ctrl+/ 단축키 도움말은 허용
        if (matchesShortcut(event, 'Ctrl+/')) {
          event.preventDefault();
          openModal('shortcuts');
          return;
        }
        return;
      }

      // 단축키 도움말
      if (matchesShortcut(event, 'Ctrl+/')) {
        event.preventDefault();
        openModal('shortcuts');
        return;
      }

      // 프로젝트 설정 (프로젝트가 열려있을 때만)
      if (matchesShortcut(event, 'Ctrl+,') && currentProject) {
        event.preventDefault();
        openModal('project-settings');
        return;
      }

      // 새 프로젝트
      if (matchesShortcut(event, 'Ctrl+Shift+N')) {
        event.preventDefault();
        openModal('new-project');
        return;
      }

      // 버전 히스토리 (프로젝트가 열려있을 때만)
      if (matchesShortcut(event, 'Ctrl+H') && currentProject) {
        event.preventDefault();
        openModal('version-history');
        return;
      }

      // 빠른 열기 (프로젝트가 열려있을 때만)
      if (matchesShortcut(event, 'Ctrl+P') && currentProject) {
        event.preventDefault();
        openModal('quick-open');
        return;
      }

      // 프로젝트 전체 검색 (프로젝트가 열려있을 때만)
      if (matchesShortcut(event, 'Ctrl+Shift+F') && currentProject) {
        event.preventDefault();
        openModal('project-search');
        return;
      }

      // 글자수 목표 (프로젝트가 열려있을 때만)
      if (matchesShortcut(event, 'Ctrl+Shift+O') && currentProject) {
        event.preventDefault();
        openModal('writing-goal');
        return;
      }

      // 좌측 패널 토글 (프로젝트가 열려있을 때만)
      if (matchesShortcut(event, 'Ctrl+\\') && currentProject) {
        event.preventDefault();
        toggleLeftPanel();
        return;
      }

      // 우측 패널 토글 (프로젝트가 열려있을 때만)
      if (matchesShortcut(event, 'Ctrl+Shift+\\') && currentProject) {
        event.preventDefault();
        toggleRightPanel();
        return;
      }

      // 집중 모드 (F11) - 프로젝트가 열려있을 때만
      if (event.key === 'F11' && currentProject) {
        event.preventDefault();
        toggleFocusMode();
        return;
      }
    },
    [activeModal, closeModal, openModal, currentProject, toggleFocusMode, toggleLeftPanel, toggleRightPanel]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
