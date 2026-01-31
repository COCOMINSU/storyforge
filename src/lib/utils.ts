/**
 * 범용 유틸리티 함수
 *
 * 프로젝트 전반에서 사용되는 공통 유틸리티입니다.
 */

/**
 * 주어진 밀리초만큼 대기합니다.
 *
 * @param ms - 대기 시간 (밀리초)
 * @returns Promise
 *
 * @example
 * await sleep(1000); // 1초 대기
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 디바운스된 함수를 생성합니다.
 *
 * 연속된 호출에서 마지막 호출만 실행합니다.
 * 자동 저장 등에 사용됩니다.
 *
 * @param fn - 디바운스할 함수
 * @param delay - 지연 시간 (밀리초)
 * @returns 디바운스된 함수
 *
 * @example
 * const debouncedSave = debounce(save, 2000);
 * // 2초 이내 연속 호출 시 마지막 호출만 실행
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 쓰로틀된 함수를 생성합니다.
 *
 * 지정된 시간 간격으로 함수 실행을 제한합니다.
 *
 * @param fn - 쓰로틀할 함수
 * @param limit - 제한 시간 (밀리초)
 * @returns 쓰로틀된 함수
 *
 * @example
 * const throttledScroll = throttle(onScroll, 100);
 * // 100ms에 한 번만 실행
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 객체를 깊은 복사합니다.
 *
 * @param obj - 복사할 객체
 * @returns 복사된 객체
 *
 * @example
 * const copy = deepClone({ a: { b: 1 } });
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 두 객체가 깊은 수준에서 같은지 비교합니다.
 *
 * @param obj1 - 첫 번째 객체
 * @param obj2 - 두 번째 객체
 * @returns 같으면 true
 */
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * 배열에서 중복을 제거합니다.
 *
 * @param arr - 배열
 * @returns 중복이 제거된 배열
 *
 * @example
 * unique([1, 2, 2, 3]);
 * // → [1, 2, 3]
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * 배열을 키로 그룹화합니다.
 *
 * @param arr - 배열
 * @param keyFn - 키 추출 함수
 * @returns 그룹화된 객체
 *
 * @example
 * const items = [{ type: 'a', value: 1 }, { type: 'b', value: 2 }, { type: 'a', value: 3 }];
 * groupBy(items, item => item.type);
 * // → { a: [...], b: [...] }
 */
export function groupBy<T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

/**
 * 배열의 항목 순서를 변경합니다.
 *
 * @param arr - 배열
 * @param fromIndex - 이동할 항목의 인덱스
 * @param toIndex - 이동할 위치의 인덱스
 * @returns 새로운 배열
 *
 * @example
 * reorder(['a', 'b', 'c'], 0, 2);
 * // → ['b', 'c', 'a']
 */
export function reorder<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * 값이 비어있는지 확인합니다.
 *
 * @param value - 확인할 값
 * @returns 비어있으면 true
 *
 * @example
 * isEmpty(null);      // true
 * isEmpty('');        // true
 * isEmpty([]);        // true
 * isEmpty({});        // true
 * isEmpty('hello');   // false
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * 문자열을 안전하게 자릅니다.
 *
 * @param str - 자를 문자열
 * @param maxLength - 최대 길이
 * @param ellipsis - 말줄임표 (기본: '...')
 * @returns 잘린 문자열
 *
 * @example
 * truncate('긴 텍스트입니다', 5);
 * // → '긴 텍스...'
 */
export function truncate(
  str: string,
  maxLength: number,
  ellipsis = '...'
): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환합니다.
 *
 * @param bytes - 바이트 수
 * @returns 포맷팅된 문자열
 *
 * @example
 * formatFileSize(1024);
 * // → '1.0 KB'
 *
 * formatFileSize(1048576);
 * // → '1.0 MB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * 키보드 단축키 문자열을 파싱합니다.
 *
 * @param shortcut - 단축키 문자열 (예: 'Ctrl+S', 'Cmd+Shift+P')
 * @returns 파싱된 단축키 객체
 *
 * @example
 * parseShortcut('Ctrl+S');
 * // → { ctrl: true, shift: false, alt: false, meta: false, key: 's' }
 */
export function parseShortcut(shortcut: string): {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
} {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];

  return {
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('cmd') || parts.includes('meta'),
    key,
  };
}

/**
 * 키보드 이벤트가 단축키와 일치하는지 확인합니다.
 *
 * @param event - 키보드 이벤트
 * @param shortcut - 단축키 문자열
 * @returns 일치하면 true
 *
 * @example
 * document.addEventListener('keydown', (e) => {
 *   if (matchesShortcut(e, 'Ctrl+S')) {
 *     e.preventDefault();
 *     save();
 *   }
 * });
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: string
): boolean {
  const parsed = parseShortcut(shortcut);

  return (
    event.ctrlKey === parsed.ctrl &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt &&
    event.metaKey === parsed.meta &&
    event.key.toLowerCase() === parsed.key
  );
}

/**
 * OS에 따른 단축키 표시 문자열을 반환합니다.
 *
 * @param shortcut - 단축키 문자열
 * @returns OS에 맞는 표시 문자열
 *
 * @example
 * // macOS에서
 * formatShortcut('Ctrl+S');
 * // → '⌘S'
 *
 * // Windows에서
 * formatShortcut('Ctrl+S');
 * // → 'Ctrl+S'
 */
export function formatShortcut(shortcut: string): string {
  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().includes('MAC');

  if (isMac) {
    return shortcut
      .replace(/Ctrl\+/gi, '⌘')
      .replace(/Alt\+/gi, '⌥')
      .replace(/Shift\+/gi, '⇧');
  }

  return shortcut;
}
