/**
 * 모바일 드로어 컴포넌트
 *
 * 모바일에서 좌/우측에서 슬라이드되어 나오는 패널
 * - 스와이프로 닫기 지원
 * - 배경 오버레이
 * - 애니메이션 전환
 */

import { useEffect, useRef } from 'react';
import { useSwipe } from '@/hooks';
import { cn } from '@/lib';

interface MobileDrawerProps {
  /** 열림 상태 */
  isOpen: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 드로어 위치 */
  position?: 'left' | 'right';
  /** 드로어 제목 */
  title?: string;
  /** 드로어 내용 */
  children: React.ReactNode;
  /** 드로어 너비 (기본: 85%) */
  width?: string;
}

export function MobileDrawer({
  isOpen,
  onClose,
  position = 'left',
  title,
  children,
  width = '85%',
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // 스와이프로 닫기
  const swipeHandlers = useSwipe({
    onSwipeLeft: position === 'left' ? onClose : undefined,
    onSwipeRight: position === 'right' ? onClose : undefined,
  });

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 배경 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // 포커스 트랩
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      firstElement?.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 드로어 패널 */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed top-0 z-50 h-full bg-sidebar shadow-xl transition-transform duration-300 ease-out safe-area-top',
          position === 'left' ? 'left-0' : 'right-0',
          isOpen
            ? 'translate-x-0'
            : position === 'left'
              ? '-translate-x-full'
              : 'translate-x-full'
        )}
        style={{ width }}
        {...swipeHandlers}
      >
        {/* 드로어 헤더 */}
        {title && (
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-muted"
              aria-label="닫기"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* 드로어 콘텐츠 */}
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto pb-safe">
          {children}
        </div>
      </div>
    </>
  );
}

export default MobileDrawer;
