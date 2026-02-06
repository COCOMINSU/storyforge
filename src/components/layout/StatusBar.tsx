/**
 * 상태바
 *
 * 하단에 표시되는 상태 정보:
 * - 저장 상태
 * - 글자수
 * - 동기화 상태
 * - 테마 선택
 * - 단축키 힌트
 */

import { useState, useRef, useEffect } from 'react';
import { useProjectStore, useEditorStore, useAuthStore, useUIStore } from '@/stores';
import { formatCharCount, formatRelativeTime, getTheme } from '@/lib';
import { ThemeSelector } from '@/components/settings';

export function StatusBar() {
  const { currentProject } = useProjectStore();
  const { saveStatus, lastSavedAt } = useEditorStore();
  const { isAuthenticated, syncInfo } = useAuthStore();
  const { toggleLeftPanel, toggleFocusMode, isLeftPanelOpen, appMode, toggleAppMode, theme } = useUIStore();

  // 테마 드롭다운 상태
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    }

    if (isThemeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isThemeOpen]);

  return (
    <div className="flex h-6 items-center justify-between border-t border-border bg-sidebar px-3 text-xs text-muted-foreground">
      {/* 좌측 - 프로젝트 정보 */}
      <div className="flex items-center gap-3">
        {/* 패널 토글 */}
        <button
          onClick={toggleLeftPanel}
          className="hover:text-foreground"
          title={isLeftPanelOpen ? '좌측 패널 숨기기' : '좌측 패널 보이기'}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 프로젝트 통계 */}
        {currentProject && (
          <>
            <span className="text-muted-foreground/50">|</span>
            <span>
              총 {formatCharCount(currentProject.stats.totalCharCount)}자
            </span>
            <span className="text-muted-foreground/50">
              ({currentProject.stats.chapterCount}화)
            </span>
          </>
        )}
      </div>

      {/* 중앙 - 저장 상태 */}
      <div className="flex items-center gap-2">
        <SaveStatusIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
      </div>

      {/* 우측 - 동기화 및 설정 */}
      <div className="flex items-center gap-3">
        {/* 동기화 상태 */}
        {isAuthenticated && (
          <SyncStatusIndicator status={syncInfo.status} />
        )}

        {/* 포커스 모드 */}
        <button
          onClick={toggleFocusMode}
          className="hover:text-foreground"
          title="포커스 모드 (F11)"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* 테마 선택 */}
        <div className="relative" ref={themeDropdownRef}>
          <button
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="flex items-center gap-1 hover:text-foreground"
            title="테마 변경"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span className="text-[10px]">
              {getTheme(theme)?.emoji || '🎨'}
            </span>
          </button>

          {/* 테마 드롭다운 */}
          {isThemeOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-border bg-popover p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">테마 설정</h3>
                <button
                  onClick={() => setIsThemeOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ThemeSelector compact onThemeChange={() => setIsThemeOpen(false)} />
            </div>
          )}
        </div>

        {/* 모드 전환 버튼 */}
        <button
          onClick={toggleAppMode}
          className={`flex items-center gap-1.5 rounded px-2 py-0.5 transition-colors ${
            appMode === 'agent'
              ? 'bg-primary/20 text-primary hover:bg-primary/30'
              : 'hover:bg-muted hover:text-foreground'
          }`}
          title={appMode === 'writing' ? 'AI Agent 모드로 전환' : '집필 모드로 전환'}
        >
          {appMode === 'writing' ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>집필</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>AI Agent</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface SaveStatusIndicatorProps {
  status: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSavedAt: Date | null;
}

function SaveStatusIndicator({ status, lastSavedAt }: SaveStatusIndicatorProps) {
  const statusConfig = {
    saved: { icon: '✓', text: '저장됨', color: 'text-status-complete' },
    saving: { icon: '⟳', text: '저장 중...', color: 'text-status-writing' },
    unsaved: { icon: '•', text: '변경사항 있음', color: 'text-status-draft' },
    error: { icon: '✗', text: '저장 실패', color: 'text-destructive' },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-1 ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
      {status === 'saved' && lastSavedAt && (
        <span className="text-muted-foreground">
          ({formatRelativeTime(lastSavedAt)})
        </span>
      )}
    </div>
  );
}

interface SyncStatusIndicatorProps {
  status: 'synced' | 'syncing' | 'offline' | 'conflict' | 'error';
}

function SyncStatusIndicator({ status }: SyncStatusIndicatorProps) {
  const statusConfig = {
    synced: { icon: '☁️', text: '동기화됨', color: 'text-status-complete' },
    syncing: { icon: '↻', text: '동기화 중...', color: 'text-status-writing' },
    offline: { icon: '📴', text: '오프라인', color: 'text-muted-foreground' },
    conflict: { icon: '⚠', text: '충돌', color: 'text-status-published' },
    error: { icon: '✗', text: '동기화 오류', color: 'text-destructive' },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-1 ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
}
