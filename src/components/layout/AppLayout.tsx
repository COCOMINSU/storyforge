/**
 * 앱 메인 레이아웃
 *
 * 2가지 모드:
 * - 집필 모드: 좌측 패널 + 에디터
 * - AI Agent 모드: 좌측 패널 + AI 전체화면 채팅
 *
 * 반응형:
 * - 데스크톱: 기존 레이아웃
 * - 모바일: 하단 탭바 + 풀스크린 뷰
 */

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores';
import { useIsMobile } from '@/hooks';
import { LeftPanel } from './LeftPanel';
import { EditorPane } from './EditorPane';
import { StatusBar } from './StatusBar';
import { MobileLayout } from './MobileLayout';
import { AIAgentView } from '@/components/ai';
import { formatShortcut } from '@/lib';

export function AppLayout() {
  const {
    appMode,
    isLeftPanelOpen,
    leftPanelWidth,
    isFocusMode,
  } = useUIStore();

  // 모바일 감지
  const isMobile = useIsMobile();

  // 집중 모드 진입 시 안내 메시지 표시
  const [showFocusHint, setShowFocusHint] = useState(false);

  useEffect(() => {
    if (isFocusMode) {
      setShowFocusHint(true);
      const timer = setTimeout(() => setShowFocusHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isFocusMode]);

  // 모바일 레이아웃
  if (isMobile) {
    return (
      <MobileLayout
        leftPanel={<LeftPanel />}
        mainContent={appMode === 'writing' ? <EditorPane /> : <AIAgentView />}
      />
    );
  }

  // 데스크톱 레이아웃
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

        {/* 메인 영역: 모드에 따라 에디터 또는 AI Agent */}
        <main className="flex-1 overflow-hidden">
          {appMode === 'writing' ? <EditorPane /> : <AIAgentView />}
        </main>
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
