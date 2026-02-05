/**
 * StoryForge 자동 업데이트 핸들러
 *
 * AI 응답에서 추출된 업데이트 블록을 실제 스토어에 적용합니다.
 */

import { db } from '@/db';
import { generateId } from '@/lib/id';
import { useUIStore } from '@/stores';
import type { StoryforgeUpdate, CharacterRole } from '@/types';
import { validateUpdateData } from './responseParser';

/**
 * 업데이트 적용 결과
 */
export interface UpdateResult {
  success: boolean;
  type: string;
  message: string;
  createdId?: string;
}

/**
 * StoryForge 업데이트 적용
 *
 * @param update - 업데이트 블록
 * @param projectId - 대상 프로젝트 ID
 * @returns 적용 결과
 */
export async function applyStoryforgeUpdate(
  update: StoryforgeUpdate,
  projectId: string
): Promise<UpdateResult> {
  // 데이터 유효성 검증
  const validation = validateUpdateData(update);
  if (!validation.valid) {
    return {
      success: false,
      type: update.type,
      message: `필수 필드 누락: ${validation.missingFields?.join(', ')}`,
    };
  }

  console.log(`[UpdateHandler] 업데이트 적용 시작: ${update.type}`);

  try {
    switch (update.type) {
      case 'create_character':
        return await createCharacter(update.data, projectId);

      case 'update_character':
        return await updateCharacter(update.data);

      case 'create_location':
        return await createLocation(update.data, projectId);

      case 'update_location':
        return await updateLocation(update.data);

      case 'update_synopsis':
        return await updateSynopsis(update.data, projectId);

      case 'add_foreshadowing':
        // TODO: 복선 시스템 구현 후 연동
        return {
          success: false,
          type: update.type,
          message: '복선 시스템이 아직 구현되지 않았습니다.',
        };

      default:
        return {
          success: false,
          type: update.type,
          message: `지원되지 않는 업데이트 타입: ${update.type}`,
        };
    }
  } catch (error) {
    console.error(`[UpdateHandler] 업데이트 실패:`, error);
    return {
      success: false,
      type: update.type,
      message: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 여러 업데이트 일괄 적용
 *
 * @param updates - 업데이트 블록 목록
 * @param projectId - 대상 프로젝트 ID
 * @returns 각 업데이트의 적용 결과
 */
export async function applyStoryforgeUpdates(
  updates: StoryforgeUpdate[],
  projectId: string
): Promise<UpdateResult[]> {
  const results: UpdateResult[] = [];

  for (const update of updates) {
    const result = await applyStoryforgeUpdate(update, projectId);
    results.push(result);

    // 성공 시 토스트 알림
    if (result.success) {
      showSuccessToast(result);
    }
  }

  console.log(`[UpdateHandler] ${results.filter((r) => r.success).length}/${updates.length} 업데이트 성공`);

  return results;
}

// ============================================
// 개별 업데이트 핸들러
// ============================================

/**
 * 새 캐릭터 생성
 */
async function createCharacter(
  data: Record<string, unknown>,
  projectId: string
): Promise<UpdateResult> {
  const id = generateId();
  const now = new Date();

  const character = {
    id,
    projectId,
    type: 'character' as const,
    name: String(data.name || ''),
    description: String(data.description || ''),
    imageUrl: undefined,
    tags: [],
    createdAt: now,
    updatedAt: now,
    basicInfo: {
      age: data.age ? String(data.age) : undefined,
      gender: data.gender ? String(data.gender) : undefined,
      occupation: data.occupation ? String(data.occupation) : undefined,
      nickname: [],
    },
    appearance: {
      height: data.height ? String(data.height) : undefined,
      bodyType: data.bodyType ? String(data.bodyType) : undefined,
      hairColor: data.hairColor ? String(data.hairColor) : undefined,
      eyeColor: data.eyeColor ? String(data.eyeColor) : undefined,
      distinguishingFeatures: data.distinguishingFeatures ? String(data.distinguishingFeatures) : undefined,
    },
    personality: String(data.personality || ''),
    background: String(data.background || ''),
    motivation: String(data.motivation || ''),
    abilities: [],
    relationships: [],
    role: mapRole(String(data.role || 'supporting')),
  };

  await db.characters.add(character);

  console.log(`[UpdateHandler] 캐릭터 생성: ${character.name} (${id})`);

  return {
    success: true,
    type: 'create_character',
    message: `캐릭터 '${character.name}' 생성됨`,
    createdId: id,
  };
}

/**
 * 기존 캐릭터 수정
 */
async function updateCharacter(data: Record<string, unknown>): Promise<UpdateResult> {
  const id = String(data.id);
  const existing = await db.characters.get(id);

  if (!existing) {
    return {
      success: false,
      type: 'update_character',
      message: `캐릭터를 찾을 수 없습니다: ${id}`,
    };
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  // 기본 필드 업데이트
  if (data.name) updates.name = String(data.name);
  if (data.description) updates.description = String(data.description);
  if (data.personality) updates.personality = String(data.personality);
  if (data.background) updates.background = String(data.background);
  if (data.motivation) updates.motivation = String(data.motivation);
  if (data.role) updates.role = mapRole(String(data.role));

  // basicInfo 업데이트
  if (data.age || data.gender || data.occupation) {
    const basicInfoUpdates: Record<string, string | undefined> = {};
    if (data.age) basicInfoUpdates.age = String(data.age);
    if (data.gender) basicInfoUpdates.gender = String(data.gender);
    if (data.occupation) basicInfoUpdates.occupation = String(data.occupation);

    updates.basicInfo = {
      ...existing.basicInfo,
      ...basicInfoUpdates,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.characters.update(id, updates as any);

  console.log(`[UpdateHandler] 캐릭터 수정: ${existing.name} (${id})`);

  return {
    success: true,
    type: 'update_character',
    message: `캐릭터 '${existing.name}' 수정됨`,
  };
}

/**
 * 새 장소 생성
 */
async function createLocation(
  data: Record<string, unknown>,
  projectId: string
): Promise<UpdateResult> {
  const id = generateId();
  const now = new Date();

  const location = {
    id,
    projectId,
    type: 'location' as const,
    name: String(data.name || ''),
    description: String(data.description || ''),
    imageUrl: undefined,
    tags: [],
    createdAt: now,
    updatedAt: now,
    locationType: String(data.locationType || '기타'),
    region: data.region ? String(data.region) : undefined,
    features: String(data.features || ''),
    atmosphere: String(data.atmosphere || ''),
    significance: String(data.significance || ''),
    relatedCharacters: [],
  };

  await db.locations.add(location);

  console.log(`[UpdateHandler] 장소 생성: ${location.name} (${id})`);

  return {
    success: true,
    type: 'create_location',
    message: `장소 '${location.name}' 생성됨`,
    createdId: id,
  };
}

/**
 * 기존 장소 수정
 */
async function updateLocation(data: Record<string, unknown>): Promise<UpdateResult> {
  const id = String(data.id);
  const existing = await db.locations.get(id);

  if (!existing) {
    return {
      success: false,
      type: 'update_location',
      message: `장소를 찾을 수 없습니다: ${id}`,
    };
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.name) updates.name = String(data.name);
  if (data.description) updates.description = String(data.description);
  if (data.locationType) updates.locationType = String(data.locationType);
  if (data.region) updates.region = String(data.region);
  if (data.features) updates.features = String(data.features);
  if (data.atmosphere) updates.atmosphere = String(data.atmosphere);
  if (data.significance) updates.significance = String(data.significance);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.locations.update(id, updates as any);

  console.log(`[UpdateHandler] 장소 수정: ${existing.name} (${id})`);

  return {
    success: true,
    type: 'update_location',
    message: `장소 '${existing.name}' 수정됨`,
  };
}

/**
 * 시놉시스 수정 (프로젝트 description 업데이트)
 */
async function updateSynopsis(
  data: Record<string, unknown>,
  projectId: string
): Promise<UpdateResult> {
  const synopsis = String(data.synopsis || '');

  await db.projects.update(projectId, {
    description: synopsis,
    updatedAt: new Date(),
  });

  console.log(`[UpdateHandler] 시놉시스 수정 (프로젝트: ${projectId})`);

  return {
    success: true,
    type: 'update_synopsis',
    message: '시놉시스가 수정되었습니다.',
  };
}

// ============================================
// 유틸리티
// ============================================

/**
 * 역할 문자열을 CharacterRole로 매핑
 */
function mapRole(role: string): CharacterRole {
  const roleMap: Record<string, CharacterRole> = {
    protagonist: 'protagonist',
    주인공: 'protagonist',
    antagonist: 'antagonist',
    악역: 'antagonist',
    supporting: 'supporting',
    조연: 'supporting',
    minor: 'minor',
    단역: 'minor',
  };

  return roleMap[role.toLowerCase()] || 'supporting';
}

/**
 * 성공 토스트 표시
 */
function showSuccessToast(result: UpdateResult): void {
  const { addToast } = useUIStore.getState();
  addToast({
    type: 'success',
    message: result.message,
    duration: 3000,
  });
}

export default {
  applyStoryforgeUpdate,
  applyStoryforgeUpdates,
};
