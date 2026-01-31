/**
 * IndexedDB 데이터베이스 설정 (Dexie.js)
 *
 * Storyforge의 모든 데이터는 로컬 IndexedDB에 저장됩니다.
 * Dexie.js를 사용하여 타입 안전한 데이터베이스 접근을 제공합니다.
 *
 * 데이터베이스 구조:
 * - projects: 프로젝트 (작품)
 * - volumes: 권
 * - chapters: 화
 * - scenes: 씬 (글 내용 포함)
 * - versions: 버전 히스토리
 * - characters: 인물 카드
 * - locations: 장소 카드
 * - items: 아이템 카드
 */

import Dexie, { type EntityTable } from 'dexie';
import type {
  Project,
  Volume,
  Chapter,
  Scene,
  DocumentVersion,
  CharacterCard,
  LocationCard,
  ItemCard,
} from '@/types';

/**
 * Storyforge 데이터베이스 클래스
 *
 * Dexie를 확장하여 타입 안전한 테이블 접근을 제공합니다.
 */
export class StoryforgeDB extends Dexie {
  /**
   * 프로젝트 테이블
   *
   * 인덱스:
   * - id (PK): UUID
   * - userId: 클라우드 동기화용
   * - lastOpenedAt: 최근 프로젝트 정렬용
   */
  projects!: EntityTable<Project, 'id'>;

  /**
   * 권 테이블
   *
   * 인덱스:
   * - id (PK): UUID
   * - projectId: 프로젝트별 조회
   * - [projectId+order]: 정렬된 조회
   */
  volumes!: EntityTable<Volume, 'id'>;

  /**
   * 화 테이블
   *
   * 인덱스:
   * - id (PK): UUID
   * - volumeId: 권별 조회
   * - projectId: 프로젝트별 조회
   * - [volumeId+order]: 정렬된 조회
   */
  chapters!: EntityTable<Chapter, 'id'>;

  /**
   * 씬 테이블
   *
   * 인덱스:
   * - id (PK): UUID
   * - chapterId: 화별 조회
   * - volumeId: 권별 조회
   * - projectId: 프로젝트별 조회
   * - [chapterId+order]: 정렬된 조회
   * - plainText: 전문 검색용
   */
  scenes!: EntityTable<Scene, 'id'>;

  /**
   * 버전 히스토리 테이블
   *
   * 인덱스:
   * - id (PK): UUID
   * - sceneId: 씬별 버전 조회
   * - [sceneId+createdAt]: 시간순 조회
   */
  versions!: EntityTable<DocumentVersion, 'id'>;

  /**
   * 인물 카드 테이블
   *
   * 인덱스:
   * - id (PK): UUID
   * - projectId: 프로젝트별 조회
   * - [projectId+role]: 역할별 조회
   * - *tags: 다중값 인덱스 (태그 검색)
   */
  characters!: EntityTable<CharacterCard, 'id'>;

  /**
   * 장소 카드 테이블
   *
   * 인덱스:
   * - id (PK): UUID
   * - projectId: 프로젝트별 조회
   * - *tags: 다중값 인덱스 (태그 검색)
   */
  locations!: EntityTable<LocationCard, 'id'>;

  /**
   * 아이템 카드 테이블
   *
   * 인덱스:
   * - id (PK): UUID
   * - projectId: 프로젝트별 조회
   * - *tags: 다중값 인덱스 (태그 검색)
   */
  items!: EntityTable<ItemCard, 'id'>;

  constructor() {
    super('storyforge');

    // 스키마 버전 1
    this.version(1).stores({
      // 프로젝트
      projects: 'id, userId, lastOpenedAt',

      // 문서 계층
      volumes: 'id, projectId, [projectId+order]',
      chapters: 'id, volumeId, projectId, [volumeId+order]',
      scenes: 'id, chapterId, volumeId, projectId, [chapterId+order], plainText',

      // 버전 히스토리
      versions: 'id, sceneId, [sceneId+createdAt]',

      // 세계관 카드
      characters: 'id, projectId, [projectId+role], *tags',
      locations: 'id, projectId, *tags',
      items: 'id, projectId, *tags',
    });
  }
}

/**
 * 데이터베이스 싱글톤 인스턴스
 *
 * 앱 전체에서 하나의 데이터베이스 연결을 공유합니다.
 *
 * @example
 * import { db } from '@/db';
 *
 * // 프로젝트 조회
 * const projects = await db.projects.toArray();
 *
 * // 특정 프로젝트의 모든 권 조회
 * const volumes = await db.volumes
 *   .where('projectId')
 *   .equals(projectId)
 *   .sortBy('order');
 */
export const db = new StoryforgeDB();

/**
 * 데이터베이스 초기화 및 연결 확인
 *
 * 앱 시작 시 호출하여 데이터베이스 연결을 확인합니다.
 *
 * @returns 초기화 성공 여부
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    await db.open();
    console.log('[DB] Storyforge 데이터베이스 연결됨');
    return true;
  } catch (error) {
    console.error('[DB] 데이터베이스 연결 실패:', error);
    return false;
  }
}

/**
 * 데이터베이스 전체 삭제 (개발/디버깅용)
 *
 * 주의: 모든 데이터가 삭제됩니다!
 */
export async function deleteDatabase(): Promise<void> {
  await db.delete();
  console.log('[DB] 데이터베이스 삭제됨');
}

/**
 * 프로젝트와 관련된 모든 데이터 삭제
 *
 * @param projectId - 삭제할 프로젝트 ID
 */
export async function deleteProjectData(projectId: string): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.projects,
      db.volumes,
      db.chapters,
      db.scenes,
      db.versions,
      db.characters,
      db.locations,
      db.items,
    ],
    async () => {
      // 씬 ID 목록 조회 (버전 삭제용)
      const sceneIds = await db.scenes
        .where('projectId')
        .equals(projectId)
        .primaryKeys();

      // 버전 삭제
      await db.versions.where('sceneId').anyOf(sceneIds).delete();

      // 씬 삭제
      await db.scenes.where('projectId').equals(projectId).delete();

      // 화 삭제
      await db.chapters.where('projectId').equals(projectId).delete();

      // 권 삭제
      await db.volumes.where('projectId').equals(projectId).delete();

      // 세계관 카드 삭제
      await db.characters.where('projectId').equals(projectId).delete();
      await db.locations.where('projectId').equals(projectId).delete();
      await db.items.where('projectId').equals(projectId).delete();

      // 프로젝트 삭제
      await db.projects.delete(projectId);

      console.log(`[DB] 프로젝트 삭제됨: ${projectId}`);
    }
  );
}

// 기본 내보내기
export default db;
