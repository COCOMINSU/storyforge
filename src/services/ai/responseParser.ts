/**
 * AI 응답 파서
 *
 * AI 응답에서 storyforge-update JSON 블록을 추출하고
 * 표시용 텍스트와 업데이트 데이터를 분리합니다.
 */

import type { StoryforgeUpdate, ParsedAgentResponse } from '@/types';

/**
 * storyforge-update 코드 블록 패턴
 *
 * ```storyforge-update
 * { "type": "...", "data": { ... } }
 * ```
 */
const UPDATE_BLOCK_PATTERN = /```storyforge-update\s*([\s\S]*?)```/g;

/**
 * AI 응답을 파싱하여 표시 텍스트와 업데이트 블록을 분리
 *
 * @param response - AI 응답 텍스트
 * @returns 파싱된 응답 (표시 텍스트 + 업데이트 목록)
 */
export function parseAgentResponse(response: string): ParsedAgentResponse {
  const updates: StoryforgeUpdate[] = [];
  let displayText = response;

  // 모든 storyforge-update 블록 찾기
  const matches = response.matchAll(UPDATE_BLOCK_PATTERN);

  for (const match of matches) {
    const jsonString = match[1].trim();

    try {
      const update = JSON.parse(jsonString) as StoryforgeUpdate;

      // 유효한 업데이트인지 검증
      if (isValidUpdate(update)) {
        updates.push(update);
        console.log(`[ResponseParser] 업데이트 블록 추출: ${update.type}`);
      } else {
        console.warn('[ResponseParser] 유효하지 않은 업데이트 블록:', update);
      }
    } catch (e) {
      console.error('[ResponseParser] JSON 파싱 실패:', jsonString, e);
    }

    // 표시 텍스트에서 해당 블록 제거
    displayText = displayText.replace(match[0], '');
  }

  // 끝부분의 불필요한 공백 정리
  displayText = displayText.trim();

  return {
    displayText,
    updates,
  };
}

/**
 * 업데이트 블록 유효성 검증
 */
function isValidUpdate(update: unknown): update is StoryforgeUpdate {
  if (!update || typeof update !== 'object') {
    return false;
  }

  const u = update as Record<string, unknown>;

  // type 필드 검증
  if (typeof u.type !== 'string') {
    return false;
  }

  // 지원되는 type인지 확인
  const validTypes = [
    'create_character',
    'update_character',
    'create_location',
    'update_location',
    'update_synopsis',
    'create_chapter_outline',
    'add_foreshadowing',
    'resolve_foreshadowing',
  ];

  if (!validTypes.includes(u.type)) {
    console.warn(`[ResponseParser] 알 수 없는 업데이트 타입: ${u.type}`);
    return false;
  }

  // data 필드 검증
  if (!u.data || typeof u.data !== 'object') {
    return false;
  }

  return true;
}

/**
 * 업데이트 타입별 필수 필드 검증
 */
export function validateUpdateData(update: StoryforgeUpdate): {
  valid: boolean;
  missingFields?: string[];
} {
  const { type, data } = update;

  const requiredFields: Record<string, string[]> = {
    create_character: ['name', 'role'],
    update_character: ['id'],
    create_location: ['name'],
    update_location: ['id'],
    update_synopsis: ['synopsis'],
    create_chapter_outline: ['chapterNumber', 'title', 'summary'],
    add_foreshadowing: ['description'],
    resolve_foreshadowing: ['id'],
  };

  const required = requiredFields[type] || [];
  const missing = required.filter((field) => !(field in data));

  if (missing.length > 0) {
    return { valid: false, missingFields: missing };
  }

  return { valid: true };
}

export default {
  parseAgentResponse,
  validateUpdateData,
};
