/**
 * 날짜 포맷팅 유틸리티
 *
 * 한국어 날짜 형식을 지원합니다.
 * 외부 라이브러리 없이 Intl API를 사용합니다.
 */

/**
 * 날짜를 상대적인 시간으로 표시합니다.
 *
 * @param date - 날짜 객체 또는 ISO 문자열
 * @returns 상대 시간 문자열
 *
 * @example
 * // 1분 전
 * formatRelativeTime(new Date(Date.now() - 60000));
 * // → '1분 전'
 *
 * // 3시간 전
 * formatRelativeTime(new Date(Date.now() - 3 * 60 * 60 * 1000));
 * // → '3시간 전'
 *
 * // 어제
 * formatRelativeTime(new Date(Date.now() - 24 * 60 * 60 * 1000));
 * // → '어제'
 *
 * // 7일 이상 지난 경우
 * formatRelativeTime(new Date('2024-01-01'));
 * // → '2024. 1. 1.'
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // 1분 미만
  if (diffSeconds < 60) {
    return '방금 전';
  }

  // 1시간 미만
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  // 24시간 미만
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  // 어제
  if (diffDays === 1) {
    return '어제';
  }

  // 7일 이내
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }

  // 7일 이상
  return formatDate(d);
}

/**
 * 날짜를 한국어 형식으로 포맷팅합니다.
 *
 * @param date - 날짜 객체 또는 ISO 문자열
 * @param includeTime - 시간 포함 여부 (기본: false)
 * @returns 포맷팅된 날짜 문자열
 *
 * @example
 * formatDate(new Date('2024-03-15'));
 * // → '2024. 3. 15.'
 *
 * formatDate(new Date('2024-03-15T14:30:00'), true);
 * // → '2024. 3. 15. 오후 2:30'
 */
export function formatDate(date: Date | string, includeTime = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  };

  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }

  return d.toLocaleDateString('ko-KR', options);
}

/**
 * 날짜를 짧은 형식으로 포맷팅합니다.
 *
 * 오늘인 경우 시간만, 올해인 경우 월/일, 다른 해인 경우 연/월/일을 표시합니다.
 *
 * @param date - 날짜 객체 또는 ISO 문자열
 * @returns 포맷팅된 날짜 문자열
 *
 * @example
 * // 오늘
 * formatShortDate(new Date());
 * // → '오후 3:30'
 *
 * // 올해
 * formatShortDate(new Date('2024-03-15'));
 * // → '3. 15.'
 *
 * // 다른 해
 * formatShortDate(new Date('2023-12-25'));
 * // → '2023. 12. 25.'
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const isThisYear = d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (isThisYear) {
    return d.toLocaleDateString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
    });
  }

  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * 버전 히스토리용 타임스탬프를 포맷팅합니다.
 *
 * @param date - 날짜 객체 또는 ISO 문자열
 * @returns 포맷팅된 타임스탬프
 *
 * @example
 * formatVersionTimestamp(new Date());
 * // → '오후 3:30:45'
 *
 * formatVersionTimestamp(new Date('2024-03-15T14:30:45'));
 * // → '3. 15. 오후 2:30:45'
 */
export function formatVersionTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isToday) {
    return d.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  return d.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * ISO 문자열로 변환합니다.
 *
 * @param date - 날짜 객체
 * @returns ISO 문자열
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * 두 날짜가 같은 날인지 확인합니다.
 *
 * @param date1 - 첫 번째 날짜
 * @param date2 - 두 번째 날짜
 * @returns 같은 날이면 true
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
