/**
 * 실시간 요약 생성 서비스
 *
 * 프로젝트의 진행상황, 등장인물 상태, 최근 요약을 생성합니다.
 * AI 맥락 참조 및 사용자 대시보드에 사용됩니다.
 */

import { db } from '@/db';
import type { RealtimeSummary } from '@/types';

/**
 * 프로젝트의 실시간 요약을 생성합니다.
 *
 * @param projectId 프로젝트 ID
 * @returns 실시간 요약 데이터
 */
export async function generateRealtimeSummary(
  projectId: string
): Promise<RealtimeSummary> {
  // 프로젝트 정보
  const project = await db.projects.get(projectId);
  if (!project) {
    throw new Error('프로젝트를 찾을 수 없습니다.');
  }

  // 구조 정보
  const volumes = await db.volumes.where('projectId').equals(projectId).toArray();
  const chapters = await db.chapters.where('projectId').equals(projectId).toArray();
  const scenes = await db.scenes.where('projectId').equals(projectId).toArray();

  // 진행률 계산
  const completedChapters = chapters.filter(
    (c) => c.status === 'complete' || c.status === 'published'
  ).length;

  // 현재 권 찾기 (진행 중인 화가 있는 가장 낮은 번호의 권)
  let currentVolume = 1;
  const sortedVolumes = [...volumes].sort((a, b) => a.order - b.order);
  for (const vol of sortedVolumes) {
    const volChapters = chapters.filter((c) => c.volumeId === vol.id);
    const hasIncomplete = volChapters.some(
      (c) => c.status !== 'complete' && c.status !== 'published'
    );
    if (hasIncomplete) {
      currentVolume = vol.order;
      break;
    }
    currentVolume = vol.order;
  }

  // 캐릭터 상태 (주요 인물만)
  const characters = await db.characters
    .where('projectId')
    .equals(projectId)
    .toArray();

  const characterStates = characters
    .filter((c) => c.role !== 'minor')
    .slice(0, 5)
    .map((c) => ({
      characterId: c.id,
      name: c.name,
      condition: getCharacterCondition(c),
      lastAppearance: undefined, // TODO: 실제 등장 추적
    }));

  // 최근 씬 요약
  const recentScenes = scenes
    .filter((s) => s.plainText && s.plainText.length > 0)
    .sort((a, b) => {
      const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
      const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3);

  const recentChapterSummaries = await Promise.all(
    recentScenes.map(async (scene) => {
      const chapter = await db.chapters.get(scene.chapterId);
      return {
        chapterTitle: chapter?.title || scene.title,
        summary: truncateText(scene.plainText, 200),
        keyEvents: [], // TODO: AI로 핵심 이벤트 추출
      };
    })
  );

  return {
    progress: {
      currentVolume,
      currentChapter: completedChapters + 1,
      totalChapters: chapters.length,
      completionPercentage:
        chapters.length > 0
          ? Math.round((completedChapters / chapters.length) * 100)
          : 0,
    },
    characterStates,
    recentChapterSummaries,
    activeForeshadowing: [], // TODO: 복선 관리 기능
    lastUpdatedAt: new Date(),
  };
}

/**
 * 캐릭터의 현재 상태를 결정합니다.
 * 추후 실제 스토리 진행에 따른 상태 추적 기능 추가 예정
 */
function getCharacterCondition(character: { role: string }): string {
  // 현재는 역할에 따른 기본 상태 반환
  switch (character.role) {
    case 'protagonist':
      return '활동 중';
    case 'antagonist':
      return '활동 중';
    default:
      return '등장';
  }
}

/**
 * 텍스트를 지정된 길이로 자릅니다.
 */
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 프로젝트의 총 글자수를 계산합니다.
 *
 * @param projectId 프로젝트 ID
 * @returns 총 글자수
 */
export async function calculateTotalCharCount(projectId: string): Promise<number> {
  const scenes = await db.scenes.where('projectId').equals(projectId).toArray();
  return scenes.reduce((total, scene) => {
    if (!scene.plainText) return total;
    // 공백 제외 글자수 계산
    return total + scene.plainText.replace(/\s/g, '').length;
  }, 0);
}

/**
 * 프로젝트의 최근 활동을 가져옵니다.
 *
 * @param projectId 프로젝트 ID
 * @param limit 최대 개수
 * @returns 최근 활동 목록
 */
export async function getRecentActivity(
  projectId: string,
  limit: number = 5
): Promise<
  Array<{
    type: 'scene' | 'chapter' | 'character';
    title: string;
    timestamp: Date;
  }>
> {
  const scenes = await db.scenes
    .where('projectId')
    .equals(projectId)
    .toArray();

  const chapters = await db.chapters
    .where('projectId')
    .equals(projectId)
    .toArray();

  const characters = await db.characters
    .where('projectId')
    .equals(projectId)
    .toArray();

  // 모든 활동을 합쳐서 정렬
  const activities: Array<{
    type: 'scene' | 'chapter' | 'character';
    title: string;
    timestamp: Date;
  }> = [
    ...scenes.map((s) => ({
      type: 'scene' as const,
      title: s.title,
      timestamp: s.updatedAt instanceof Date ? s.updatedAt : new Date(s.updatedAt),
    })),
    ...chapters.map((c) => ({
      type: 'chapter' as const,
      title: c.title,
      timestamp: c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt),
    })),
    ...characters.map((c) => ({
      type: 'character' as const,
      title: c.name,
      timestamp: c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt),
    })),
  ];

  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}
