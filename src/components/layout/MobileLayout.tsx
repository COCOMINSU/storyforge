/**
 * 모바일 레이아웃
 *
 * 모바일 환경에 최적화된 레이아웃
 * - 상단 헤더 (프로젝트 제목 + 유저)
 * - 메인 콘텐츠 (에디터 또는 AI)
 * - 하단 바 (집필/AI 전환)
 * - 슬라이드다운 패널 (메뉴/구조/세계관)
 * - 유저 드롭다운 (유저 정보/테마)
 */

import type { ReactNode } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileTopPanel } from './MobileTopPanel';
import { MobileBottomBar } from './MobileBottomBar';
import { MobileUserDropdown } from './MobileUserDropdown';

interface MobileLayoutProps {
  /** 메인 콘텐츠 (에디터 또는 AI Agent) */
  mainContent: ReactNode;
}

export function MobileLayout({ mainContent }: MobileLayoutProps) {
  return (
    <div className="relative flex h-screen flex-col bg-background">
      {/* 상단 헤더 */}
      <MobileHeader />

      {/* 메인 콘텐츠 (하단바 h-14 공간 확보) */}
      <main className="flex-1 overflow-hidden pb-14">
        {mainContent}
      </main>

      {/* 슬라이드다운 패널 */}
      <MobileTopPanel />

      {/* 유저 드롭다운 */}
      <MobileUserDropdown />

      {/* 하단 바 */}
      <MobileBottomBar />
    </div>
  );
}

export default MobileLayout;
