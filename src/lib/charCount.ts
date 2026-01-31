/**
 * 글자수 계산 유틸리티
 *
 * 한국 웹소설 플랫폼별 글자수 계산 기준:
 * - 문피아/카카오페이지: 공백 제외
 * - 네이버시리즈: 공백 포함
 *
 * 이 유틸리티는 두 가지 기준 모두 제공합니다.
 */

import type { CharCountResult } from '@/types';

/**
 * 텍스트의 글자수를 계산합니다.
 *
 * 줄바꿈 문자는 1글자로 계산됩니다 (네이버시리즈 기준).
 * 공백 제외 글자수는 모든 공백 문자(스페이스, 탭)를 제외합니다.
 *
 * @param text - 계산할 텍스트
 * @returns 공백 포함/제외 글자수
 *
 * @example
 * const result = countCharacters('안녕하세요 반갑습니다');
 * // result.withSpaces: 11
 * // result.withoutSpaces: 10
 *
 * @example
 * // 빈 문자열
 * countCharacters('');
 * // { withSpaces: 0, withoutSpaces: 0 }
 *
 * @example
 * // 줄바꿈 포함
 * countCharacters('첫째 줄\n둘째 줄');
 * // withSpaces: 9 (공백 2 + 줄바꿈 1 + 글자 6)
 * // withoutSpaces: 6 (순수 글자만)
 */
export function countCharacters(text: string): CharCountResult {
  if (!text) {
    return {
      withSpaces: 0,
      withoutSpaces: 0,
    };
  }

  // 공백 포함 글자수 (네이버시리즈 기준)
  // 모든 문자를 1글자로 계산
  const withSpaces = text.length;

  // 공백 제외 글자수 (문피아/카카오페이지 기준)
  // 스페이스와 탭만 제외, 줄바꿈은 유지
  const withoutSpaces = text.replace(/[ \t]/g, '').length;

  return {
    withSpaces,
    withoutSpaces,
  };
}

/**
 * TipTap JSON에서 순수 텍스트를 추출합니다.
 *
 * TipTap 에디터의 JSON 구조에서 모든 텍스트 노드를 찾아
 * 하나의 문자열로 결합합니다.
 *
 * @param json - TipTap JSON 문자열 또는 객체
 * @returns 추출된 순수 텍스트
 *
 * @example
 * const json = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"안녕"}]}]}';
 * extractPlainText(json);
 * // → '안녕'
 */
export function extractPlainText(json: string | object): string {
  try {
    const doc = typeof json === 'string' ? JSON.parse(json) : json;
    return extractTextFromNode(doc);
  } catch {
    // JSON 파싱 실패 시 빈 문자열 반환
    return '';
  }
}

/**
 * TipTap 노드에서 재귀적으로 텍스트를 추출합니다.
 *
 * @internal
 * @param node - TipTap 노드 객체
 * @returns 추출된 텍스트
 */
function extractTextFromNode(node: unknown): string {
  if (!node || typeof node !== 'object') {
    return '';
  }

  const typedNode = node as {
    type?: string;
    text?: string;
    content?: unknown[];
  };

  // 텍스트 노드인 경우
  if (typedNode.type === 'text' && typeof typedNode.text === 'string') {
    return typedNode.text;
  }

  // 하드 브레이크 (Shift+Enter)
  if (typedNode.type === 'hardBreak') {
    return '\n';
  }

  // 자식 노드가 있는 경우 재귀 처리
  if (Array.isArray(typedNode.content)) {
    const texts = typedNode.content.map(extractTextFromNode);

    // 블록 레벨 요소 사이에 줄바꿈 추가
    if (
      typedNode.type === 'doc' ||
      typedNode.type === 'paragraph' ||
      typedNode.type === 'heading' ||
      typedNode.type === 'blockquote' ||
      typedNode.type === 'listItem'
    ) {
      return texts.join('') + (typedNode.type !== 'doc' ? '\n' : '');
    }

    return texts.join('');
  }

  return '';
}

/**
 * 글자수를 포맷팅하여 표시합니다.
 *
 * 1000 이상은 천 단위 구분자를 추가합니다.
 *
 * @param count - 글자수
 * @returns 포맷팅된 문자열
 *
 * @example
 * formatCharCount(12345);
 * // → '12,345'
 */
export function formatCharCount(count: number): string {
  return count.toLocaleString('ko-KR');
}

/**
 * 목표 글자수 대비 현재 진행률을 계산합니다.
 *
 * @param current - 현재 글자수
 * @param target - 목표 글자수
 * @returns 진행률 (0-100, 소수점 1자리)
 *
 * @example
 * calculateProgress(2500, 5000);
 * // → 50.0
 *
 * @example
 * // 목표 초과
 * calculateProgress(6000, 5000);
 * // → 120.0
 */
export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((current / target) * 1000) / 10;
}

/**
 * 씬/버전의 stats 형식으로 글자수를 계산합니다.
 *
 * Scene과 DocumentVersion의 stats 필드에 맞는 형식으로 반환합니다.
 *
 * @param text - 계산할 텍스트
 * @returns Scene.stats 호환 객체
 *
 * @example
 * const stats = countCharactersForStats('안녕하세요');
 * // { charCount: 5, charCountWithSpaces: 5 }
 */
export function countCharactersForStats(text: string): {
  charCount: number;
  charCountWithSpaces: number;
} {
  const result = countCharacters(text);
  return {
    charCount: result.withoutSpaces,
    charCountWithSpaces: result.withSpaces,
  };
}
