/**
 * 모바일 유저 드롭다운
 *
 * 유저 아바타 클릭 시 우측 상단에서 나타나는 드롭다운
 * - 유저 정보 (로그인 시)
 * - 테마 설정 (항상)
 * - 로그아웃 (로그인 시)
 */

import { useEffect, useRef } from 'react';
import { useUIStore } from '@/stores';
import { useAuthStore } from '@/stores';
import { ThemeSelector } from '@/components/settings/ThemeSelector';

export function MobileUserDropdown() {
  const { isMobileUserDropdownOpen, closeMobileUserDropdown, openModal } = useUIStore();
  const { user, isAuthenticated, signOut, syncInfo } = useAuthStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!isMobileUserDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeMobileUserDropdown();
      }
    };

    // mousedown 대신 약간의 딜레이로 등록 (헤더 버튼 클릭과 충돌 방지)
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileUserDropdownOpen, closeMobileUserDropdown]);

  if (!isMobileUserDropdownOpen) return null;

  const handleSignOut = async () => {
    closeMobileUserDropdown();
    await signOut();
  };

  return (
    <div
      ref={dropdownRef}
      className="fixed right-2 z-50 w-72 rounded-lg border border-border bg-card shadow-xl"
      style={{ top: '3.25rem' }}
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {/* 유저 정보 (로그인 시) */}
        {isAuthenticated && user && (
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">
              {user.displayName || '사용자'}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">동기화</span>
              <SyncStatusBadge status={syncInfo.status} />
            </div>
          </div>
        )}

        {/* 테마 설정 */}
        <div className="border-b border-border p-3">
          <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">테마</h3>
          <ThemeSelector compact />
        </div>

        {/* 로그인 (비로그인 시) */}
        {!isAuthenticated && (
          <div className="p-2">
            <button
              onClick={() => { closeMobileUserDropdown(); openModal('auth'); }}
              className="flex w-full items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground active:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              로그인
            </button>
          </div>
        )}

        {/* 로그아웃 (로그인 시) */}
        {isAuthenticated && (
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-destructive active:bg-destructive/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              로그아웃
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SyncStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    synced: { label: '동기화됨', color: 'text-status-complete' },
    syncing: { label: '동기화 중...', color: 'text-status-writing' },
    offline: { label: '오프라인', color: 'text-muted-foreground' },
    error: { label: '오류', color: 'text-destructive' },
    conflict: { label: '충돌', color: 'text-status-draft' },
  };

  const config = statusConfig[status] || statusConfig.offline;

  return <span className={`text-xs ${config.color}`}>{config.label}</span>;
}
