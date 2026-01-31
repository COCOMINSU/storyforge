/**
 * 앱 메인 레이아웃
 *
 * 3컬럼 구조:
 * - 좌측 패널: 문서 구조/설정 (리사이즈 가능)
 * - 중앙: 에디터
 * - 우측 패널: AI 어시스턴트 (추후 구현)
 */

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores';
import { LeftPanel } from './LeftPanel';
import { EditorPane } from './EditorPane';
import { RightPanel } from './RightPanel';
import { StatusBar } from './StatusBar';
import { formatShortcut } from '@/lib';

export function AppLayout() {
  const {
    isLeftPanelOpen,
    leftPanelWidth,
    isRightPanelOpen,
    rightPanelWidth,
    isFocusMode,
  } = useUIStore();

  // 집중 모드 진입 시 안내 메시지 표시
  const [showFocusHint, setShowFocusHint] = useState(false);

  useEffect(() => {
    if (isFocusMode) {
      setShowFocusHint(true);
      const timer = setTimeout(() => setShowFocusHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isFocusMode]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 패널 */}
        {!isFocusMode && isLeftPanelOpen && (
          <aside
            className="flex-shrink-0 border-r border-border bg-sidebar"
            style={{ width: leftPanelWidth }}
          >
            <LeftPanel />
          </aside>
        )}

        {/* 에디터 영역 */}
        <main className="flex-1 overflow-hidden">
          <EditorPane />
        </main>

        {/* 우측 패널 (AI) */}
        {!isFocusMode && isRightPanelOpen && (
          <aside
            className="flex-shrink-0 border-l border-border bg-sidebar"
            style={{ width: rightPanelWidth }}
          >
            <RightPanel />
          </aside>
        )}
      </div>

      {/* 상태바 */}
      {!isFocusMode && <StatusBar />}

      {/* 집중 모드 안내 */}
      {isFocusMode && showFocusHint && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center">
          <div className="rounded-lg bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur">
            집중 모드 •{' '}
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {formatShortcut('F11')}
            </kbd>
            로 종료
          </div>
        </div>
      )}
    </div>
  );
}
