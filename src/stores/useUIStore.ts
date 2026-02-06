/**
 * UI 상태 관리 스토어
 *
 * 앱의 UI 상태를 관리합니다.
 *
 * 주요 기능:
 * - 패널 토글
 * - 모달 관리
 * - 테마 설정
 * - 토스트 알림
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ModalType, LeftPanelTab, ThemeId, AppMode } from '@/types';
import { isThemeDark } from '@/lib';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UIState {
  /** 앱 모드 (집필 / AI Agent) */
  appMode: AppMode;

  /** 좌측 패널 열림 상태 */
  isLeftPanelOpen: boolean;

  /** 좌측 패널 현재 탭 */
  leftPanelTab: LeftPanelTab;

  /** 좌측 패널 너비 (px) */
  leftPanelWidth: number;

  /** 우측 패널 열림 상태 (AI 패널 - 추후 구현) */
  isRightPanelOpen: boolean;

  /** 우측 패널 너비 (px) */
  rightPanelWidth: number;

  /** 현재 열린 모달 */
  activeModal: ModalType;

  /** 모달 데이터 (삭제 확인 시 대상 등) */
  modalData: Record<string, unknown> | null;

  /** 테마 */
  theme: ThemeId;

  /** 토스트 메시지 목록 */
  toasts: ToastMessage[];

  /** 전체화면 모드 */
  isFullscreen: boolean;

  /** 포커스 모드 (패널 숨김) */
  isFocusMode: boolean;
}

interface UIActions {
  /** 앱 모드 설정 */
  setAppMode: (mode: AppMode) => void;

  /** 앱 모드 토글 */
  toggleAppMode: () => void;

  /** 좌측 패널 토글 */
  toggleLeftPanel: () => void;

  /** 좌측 패널 열기/닫기 */
  setLeftPanelOpen: (open: boolean) => void;

  /** 좌측 패널 탭 변경 */
  setLeftPanelTab: (tab: LeftPanelTab) => void;

  /** 좌측 패널 너비 설정 */
  setLeftPanelWidth: (width: number) => void;

  /** 우측 패널 토글 */
  toggleRightPanel: () => void;

  /** 우측 패널 열기/닫기 */
  setRightPanelOpen: (open: boolean) => void;

  /** 우측 패널 너비 설정 */
  setRightPanelWidth: (width: number) => void;

  /** 모달 열기 */
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;

  /** 모달 닫기 */
  closeModal: () => void;

  /** 테마 변경 */
  setTheme: (theme: ThemeId) => void;

  /** 토스트 추가 */
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;

  /** 토스트 제거 */
  removeToast: (id: string) => void;

  /** 전체화면 토글 */
  toggleFullscreen: () => void;

  /** 포커스 모드 토글 */
  toggleFocusMode: () => void;

  /** 포커스 모드 설정 */
  setFocusMode: (enabled: boolean) => void;
}

type UIStore = UIState & UIActions;

/** 패널 최소/최대 너비 */
const PANEL_MIN_WIDTH = 240;
const PANEL_MAX_WIDTH = 480;
const PANEL_DEFAULT_WIDTH = 280;

/**
 * UI 스토어
 *
 * 일부 상태는 localStorage에 저장되어 새로고침 후에도 유지됩니다.
 *
 * @example
 * const { isLeftPanelOpen, toggleLeftPanel, openModal } = useUIStore();
 *
 * // 패널 토글
 * toggleLeftPanel();
 *
 * // 모달 열기
 * openModal('new-project');
 */
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        appMode: 'writing',
        isLeftPanelOpen: true,
        leftPanelTab: 'structure',
        leftPanelWidth: PANEL_DEFAULT_WIDTH,
        isRightPanelOpen: false,
        rightPanelWidth: PANEL_DEFAULT_WIDTH,
        activeModal: null,
        modalData: null,
        theme: 'dark-default',
        toasts: [],
        isFullscreen: false,
        isFocusMode: false,

        // 앱 모드
        setAppMode: (mode) => {
          set({ appMode: mode });
        },

        toggleAppMode: () => {
          set((state) => ({
            appMode: state.appMode === 'writing' ? 'agent' : 'writing',
          }));
        },

        // 좌측 패널
        toggleLeftPanel: () => {
          set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen }));
        },

        setLeftPanelOpen: (open) => {
          set({ isLeftPanelOpen: open });
        },

        setLeftPanelTab: (tab) => {
          set({ leftPanelTab: tab });
        },

        setLeftPanelWidth: (width) => {
          const clampedWidth = Math.min(
            Math.max(width, PANEL_MIN_WIDTH),
            PANEL_MAX_WIDTH
          );
          set({ leftPanelWidth: clampedWidth });
        },

        // 우측 패널
        toggleRightPanel: () => {
          set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen }));
        },

        setRightPanelOpen: (open) => {
          set({ isRightPanelOpen: open });
        },

        setRightPanelWidth: (width) => {
          const clampedWidth = Math.min(
            Math.max(width, PANEL_MIN_WIDTH),
            PANEL_MAX_WIDTH
          );
          set({ rightPanelWidth: clampedWidth });
        },

        // 모달
        openModal: (modal, data) => {
          set({ activeModal: modal, modalData: data ?? null });
        },

        closeModal: () => {
          set({ activeModal: null, modalData: null });
        },

        // 테마
        setTheme: (theme) => {
          set({ theme });

          // DOM에 테마 클래스 적용
          if (typeof document !== 'undefined') {
            const root = document.documentElement;

            // 기존 테마 클래스 모두 제거
            const themeClasses = Array.from(root.classList).filter(
              (c) => c.startsWith('theme-') || c === 'dark' || c === 'light'
            );
            themeClasses.forEach((c) => root.classList.remove(c));

            if (theme === 'system') {
              // 시스템 설정 따르기
              const prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
              ).matches;
              root.classList.toggle('dark', prefersDark);
              root.classList.toggle('light', !prefersDark);
            } else {
              // 테마 클래스 추가 (dark-default는 기본값이므로 클래스 불필요)
              if (theme !== 'dark-default') {
                root.classList.add(`theme-${theme}`);
              }
              // 다크/라이트 모드 클래스 추가
              const isDark = isThemeDark(theme);
              root.classList.toggle('dark', isDark);
              root.classList.toggle('light', !isDark);
            }
          }
        },

        // 토스트
        addToast: (toast) => {
          const id = Date.now().toString();
          const newToast: ToastMessage = { ...toast, id };

          set((state) => ({ toasts: [...state.toasts, newToast] }));

          // 자동 제거
          const duration = toast.duration ?? 3000;
          if (duration > 0) {
            setTimeout(() => {
              get().removeToast(id);
            }, duration);
          }
        },

        removeToast: (id) => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        },

        // 전체화면
        toggleFullscreen: () => {
          if (typeof document !== 'undefined') {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
              set({ isFullscreen: true });
            } else {
              document.exitFullscreen();
              set({ isFullscreen: false });
            }
          }
        },

        // 포커스 모드
        toggleFocusMode: () => {
          set((state) => ({
            isFocusMode: !state.isFocusMode,
            isLeftPanelOpen: state.isFocusMode, // 포커스 모드 해제 시 패널 복원
            isRightPanelOpen: false,
          }));
        },

        setFocusMode: (enabled) => {
          set({
            isFocusMode: enabled,
            isLeftPanelOpen: !enabled,
            isRightPanelOpen: false,
          });
        },
      }),
      {
        name: 'storyforge-ui',
        // 저장할 상태 선택
        partialize: (state) => ({
          appMode: state.appMode,
          isLeftPanelOpen: state.isLeftPanelOpen,
          leftPanelTab: state.leftPanelTab,
          leftPanelWidth: state.leftPanelWidth,
          rightPanelWidth: state.rightPanelWidth,
          theme: state.theme,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

/**
 * 테마 초기화 (앱 시작 시 호출)
 */
export function initializeTheme(): void {
  const { theme, setTheme } = useUIStore.getState();

  // 저장된 테마가 레거시 값이면 변환
  const migratedTheme =
    theme === ('dark' as string) ? 'dark-default' :
    theme === ('light' as string) ? 'light-default' :
    theme;

  setTheme(migratedTheme as ThemeId);

  // 시스템 테마 변경 감지
  if (typeof window !== 'undefined' && migratedTheme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      const { theme: currentTheme } = useUIStore.getState();
      if (currentTheme === 'system') {
        setTheme('system');
      }
    });
  }
}
