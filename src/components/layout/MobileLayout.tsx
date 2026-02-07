/**
 * 모바일 레이아웃
 *
 * 모바일 환경에 최적화된 레이아웃
 * - 하단 네비게이션 바
 * - 풀스크린 뷰
 * - 스와이프 제스처 지원
 */

import type { ReactNode } from 'react';
import { useUIStore } from '@/stores';
import { useSwipe } from '@/hooks';
import { MobileNav } from './MobileNav';
import { MobileDrawer } from './MobileDrawer';
import { MobileSettingsView } from '@/components/settings/MobileSettingsView';

interface MobileLayoutProps {
  /** 좌측 패널 (구조/세계관) */
  leftPanel: ReactNode;
  /** 메인 콘텐츠 (에디터 또는 AI Agent) */
  mainContent: ReactNode;
  /** 상단 헤더 */
  header?: ReactNode;
}

export function MobileLayout({ leftPanel, mainContent, header }: MobileLayoutProps) {
  const {
    leftPanelTab,
    isMobileDrawerOpen,
    isMobileSettingsOpen,
    openMobileDrawer,
    closeMobileDrawer,
  } = useUIStore();

  // 스와이프로 드로어 열기
  const swipeHandlers = useSwipe({
    onSwipeRight: () => {
      if (!isMobileSettingsOpen) {
        openMobileDrawer(leftPanelTab);
      }
    },
    onSwipeLeft: () => {
      if (isMobileDrawerOpen) {
        closeMobileDrawer();
      }
    },
  });

  return (
    <div
      className="relative flex h-screen flex-col bg-background"
      {...swipeHandlers}
    >
      {/* 헤더 (선택적) */}
      {header && (
        <header className="flex-shrink-0 border-b border-border bg-sidebar/95 backdrop-blur-sm safe-area-top">
          {header}
        </header>
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 overflow-hidden pb-16">
        {isMobileSettingsOpen ? <MobileSettingsView /> : mainContent}
      </main>

      {/* 좌측 드로어 (구조/세계관) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={closeMobileDrawer}
        position="left"
        title={leftPanelTab === 'structure' ? '작품 구조' : '세계관'}
      >
        {leftPanel}
      </MobileDrawer>

      {/* 하단 네비게이션 */}
      <MobileNav />
    </div>
  );
}

export default MobileLayout;
