/**
 * 미디어 쿼리 훅
 *
 * 반응형 디자인을 위한 미디어 쿼리 감지 훅
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * 미디어 쿼리 매칭 여부를 반환하는 훅
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** 모바일 여부 (768px 미만) */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** 태블릿 여부 (768px 이상, 1024px 미만) */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/** 데스크톱 여부 (1024px 이상) */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/** 터치 디바이스 여부 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/** 반응형 브레이크포인트 */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/** 현재 브레이크포인트 반환 */
export function useBreakpoint(): Breakpoint {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

/** 스와이프 제스처 훅 */
export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipe(
  handlers: SwipeHandlers,
  threshold: number = 50
): {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
} {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };

      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;

      // 수평 스와이프가 수직보다 큰 경우
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > threshold && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < -threshold && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      } else {
        if (deltaY > threshold && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < -threshold && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }

      setTouchStart(null);
    },
    [touchStart, handlers, threshold]
  );

  return { onTouchStart, onTouchEnd };
}
