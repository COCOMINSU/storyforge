/**
 * 타이핑 인디케이터 컴포넌트
 *
 * AI가 응답을 생성 중일 때 표시되는 애니메이션입니다.
 */

import { cn } from '@/lib/cn';

interface TypingIndicatorProps {
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 타이핑 인디케이터
 *
 * 세 개의 점이 순차적으로 깜빡이는 애니메이션을 표시합니다.
 */
export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span
        className="w-2 h-2 bg-current rounded-full animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-2 h-2 bg-current rounded-full animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-2 h-2 bg-current rounded-full animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}
