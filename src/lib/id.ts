/**
 * ID 생성 유틸리티
 *
 * UUID v4 형식의 고유 식별자를 생성합니다.
 * 모든 엔티티(Project, Volume, Chapter, Scene, WorldCard 등)의 ID에 사용됩니다.
 */

/**
 * UUID v4 형식의 고유 ID를 생성합니다.
 *
 * Web Crypto API를 사용하여 암호학적으로 안전한 랜덤 값을 생성합니다.
 * 브라우저 환경에서 crypto.randomUUID()를 우선 사용합니다.
 *
 * @returns UUID v4 문자열 (예: '550e8400-e29b-41d4-a716-446655440000')
 *
 * @example
 * const projectId = generateId();
 * // → '550e8400-e29b-41d4-a716-446655440000'
 */
export function generateId(): string {
  // 모던 브라우저에서는 crypto.randomUUID() 사용
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 폴백: 수동으로 UUID v4 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 주어진 문자열이 유효한 UUID 형식인지 검증합니다.
 *
 * @param id - 검증할 문자열
 * @returns 유효한 UUID면 true
 *
 * @example
 * isValidId('550e8400-e29b-41d4-a716-446655440000');
 * // → true
 *
 * isValidId('not-a-uuid');
 * // → false
 */
export function isValidId(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * 짧은 ID를 생성합니다 (내부 용도).
 *
 * UUID의 처음 8자리만 사용합니다.
 * 디버깅이나 로깅 시 식별용으로 사용합니다.
 *
 * @param id - 전체 UUID
 * @returns 짧은 ID (8자리)
 *
 * @example
 * shortId('550e8400-e29b-41d4-a716-446655440000');
 * // → '550e8400'
 */
export function shortId(id: string): string {
  return id.slice(0, 8);
}
