/**
 * 상태바
 *
 * 하단에 표시되는 상태 정보:
 * - 저장 상태
 * - 글자수
 * - 동기화 상태
 * - 단축키 힌트
 */

import { useProjectStore, useEditorStore, useAuthStore, useUIStore } from '@/stores';
import { formatCharCount, formatRelativeTime } from '@/lib';

export function StatusBar() {
  const { currentProject } = useProjectStore();
  const { saveStatus, lastSavedAt } = useEditorStore();
  const { isAuthenticated, syncInfo } = useAuthStore();
  const { toggleLeftPanel, toggleRightPanel, toggleFocusMode, isLeftPanelOpen, isRightPanelOpen } = useUIStore();

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

        {/* AI 패널 토글 */}
        <button
          onClick={toggleRightPanel}
          className="hover:text-foreground"
          title={isRightPanelOpen ? 'AI 패널 숨기기' : 'AI 패널 보이기'}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
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
