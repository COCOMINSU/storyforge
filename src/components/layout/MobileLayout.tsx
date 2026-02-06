/**
 * 모바일 레이아웃
 *
 * 모바일 환경에 최적화된 레이아웃
 * - 하단 네비게이션 바
 * - 풀스크린 뷰
 * - 스와이프 제스처 지원
 */

import { useState } from 'react';
import { useUIStore } from '@/stores';
import { useSwipe } from '@/hooks';
import { MobileNav } from './MobileNav';
import { MobileDrawer } from './MobileDrawer';

// 컴포넌트 lazy import
import type { ReactNode } from 'react';

interface MobileLayoutProps {
  /** 좌측 패널 (구조/세계관) */
  leftPanel: ReactNode;
  /** 메인 콘텐츠 (에디터 또는 AI Agent) */
  mainContent: ReactNode;
  /** 상단 헤더 */
  header?: ReactNode;
}

export function MobileLayout({ leftPanel, mainContent, header }: MobileLayoutProps) {
  const { appMode, leftPanelTab } = useUIStore();

  // 드로어 상태
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<'structure' | 'world' | null>(null);

  // 현재 뷰 결정
  const currentView = appMode === 'agent' ? 'agent' : 'writing';

  // 스와이프로 드로어 열기
  const swipeHandlers = useSwipe({
    onSwipeRight: () => {
      if (currentView === 'writing' || currentView === 'agent') {
        setDrawerContent(leftPanelTab);
        setIsDrawerOpen(true);
      }
    },
    onSwipeLeft: () => {
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    },
  });

  // 드로어 닫기
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setDrawerContent(null), 300); // 애니메이션 후 정리
  };

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
        {mainContent}
      </main>

      {/* 좌측 드로어 (구조/세계관) */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        position="left"
        title={drawerContent === 'structure' ? '작품 구조' : drawerContent === 'world' ? '세계관' : ''}
      >
        {leftPanel}
      </MobileDrawer>

      {/* 하단 네비게이션 */}
      <MobileNav />
    </div>
  );
}

export default MobileLayout;
