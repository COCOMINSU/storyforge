/**
 * 사용자 메뉴 컴포넌트
 *
 * 로그인 상태에 따라 다른 UI를 표시합니다.
 * - 비로그인: 로그인 버튼
 * - 로그인: 사용자 아바타와 드롭다운 메뉴
 */

import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useUIStore } from '@/stores';

export function UserMenu() {
  const { user, isAuthenticated, isLoading, signOut, syncInfo } = useAuthStore();
  const { openModal } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginClick = () => {
    openModal('auth');
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex h-8 w-8 items-center justify-center">
        <svg className="h-4 w-4 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  // 비로그인 상태
  if (!isAuthenticated) {
    return (
      <button
        onClick={handleLoginClick}
        className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        로그인
      </button>
    );
  }

  // 로그인 상태
  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md p-1 hover:bg-accent"
      >
        {/* 아바타 */}
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName || '사용자'}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {(user?.displayName || user?.email || '?')[0].toUpperCase()}
          </div>
        )}

        {/* 동기화 상태 표시 */}
        <div className="flex items-center gap-1">
          <SyncStatusIndicator status={syncInfo.status} />
        </div>

        {/* 드롭다운 화살표 */}
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-border bg-card shadow-lg">
          {/* 사용자 정보 */}
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">
              {user?.displayName || '사용자'}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          {/* 메뉴 항목 */}
          <div className="p-2">
            {/* 동기화 상태 */}
            <div className="flex items-center justify-between px-2 py-1.5 text-sm">
              <span className="text-muted-foreground">동기화</span>
              <SyncStatusBadge status={syncInfo.status} />
            </div>

            <div className="my-2 h-px bg-border" />

            {/* 로그아웃 */}
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 동기화 상태 인디케이터 (작은 점)
function SyncStatusIndicator({ status }: { status: string }) {
  const colors: Record<string, string> = {
    synced: 'bg-status-complete',
    syncing: 'bg-status-writing',
    offline: 'bg-muted-foreground',
    error: 'bg-destructive',
    conflict: 'bg-status-draft',
  };

  return (
    <span
      className={`h-2 w-2 rounded-full ${colors[status] || colors.offline}`}
      title={status === 'synced' ? '동기화됨' : status === 'syncing' ? '동기화 중' : '오프라인'}
    />
  );
}

// 동기화 상태 배지
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
