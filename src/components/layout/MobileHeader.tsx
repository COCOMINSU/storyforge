/**
 * 모바일 상단 헤더
 *
 * 좌측: 프로젝트 제목 (클릭 → 상단 패널 토글)
 * 우측: 로그인 버튼 또는 유저 아바타 (클릭 → 유저 드롭다운 토글)
 */

import { useUIStore, useProjectStore } from '@/stores';
import { useAuthStore } from '@/stores';
import { cn } from '@/lib';

export function MobileHeader() {
  const { isMobileTopPanelOpen, toggleMobileTopPanel, toggleMobileUserDropdown } = useUIStore();
  const { currentProject } = useProjectStore();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  return (
    <header className="relative z-50 flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-sidebar/95 px-3 backdrop-blur-sm safe-area-top">
      {/* 좌측: 프로젝트 제목 */}
      <button
        onClick={toggleMobileTopPanel}
        className="flex items-center gap-1 rounded px-2 py-1 text-sm font-semibold text-foreground active:bg-accent"
      >
        <span className="max-w-[180px] truncate">
          {currentProject?.title || '프로젝트'}
        </span>
        <svg
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            isMobileTopPanelOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 우측: 유저 영역 */}
      {isLoading ? (
        <div className="flex h-7 w-7 items-center justify-center">
          <svg className="h-4 w-4 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : !isAuthenticated ? (
        <button
          onClick={toggleMobileUserDropdown}
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground active:bg-accent"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          로그인
        </button>
      ) : (
        <button
          onClick={toggleMobileUserDropdown}
          className="rounded-full p-0.5 active:bg-accent"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || '사용자'}
              className="h-7 w-7 rounded-full"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {(user?.displayName || user?.email || '?')[0].toUpperCase()}
            </div>
          )}
        </button>
      )}
    </header>
  );
}
