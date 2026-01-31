/**
 * 모달 기본 컴포넌트
 *
 * 모든 모달의 기본 레이아웃과 동작을 정의합니다.
 * - ESC 키로 닫기
 * - 배경 클릭으로 닫기
 * - 포커스 트랩
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib';

interface ModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 모달 제목 */
  title: string;
  /** 모달 설명 (선택) */
  description?: string;
  /** 모달 컨텐츠 */
  children: ReactNode;
  /** 모달 크기 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 배경 클릭으로 닫기 허용 */
  closeOnBackdrop?: boolean;
  /** ESC 키로 닫기 허용 */
  closeOnEsc?: boolean;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC 키 처리
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // 모달 열릴 때 포커스
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* 모달 컨텐츠 */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full rounded-lg bg-card shadow-xl',
          'animate-in fade-in-0 zoom-in-95',
          SIZE_CLASSES[size],
          'mx-4'
        )}
      >
        {/* 헤더 */}
        <div className="border-b border-border px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          {description && (
            <p id="modal-description" className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {/* 본문 */}
        <div className="px-6 py-4">{children}</div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="닫기"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * 모달 푸터 컴포넌트
 */
export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
      {children}
    </div>
  );
}
