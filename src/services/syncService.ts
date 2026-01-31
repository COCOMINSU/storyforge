/**
 * 동기화 서비스
 *
 * Supabase와 로컬 IndexedDB 간의 데이터 동기화를 담당합니다.
 *
 * 주요 기능:
 * - 프로젝트 업로드/다운로드
 * - 문서 구조 동기화 (권/화/씬)
 * - 세계관 카드 동기화
 * - 충돌 감지 및 해결
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/db';
import type { Project, Volume, Chapter, Scene, CharacterCard, LocationCard, ItemCard } from '@/types';

// ============================================
// Types
// ============================================

export interface SyncResult {
  success: boolean;
  error?: string;
  conflicts?: SyncConflict[];
  syncedAt: Date;
}

export interface SyncConflict {
  type: 'project' | 'volume' | 'chapter' | 'scene' | 'card';
  id: string;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date;
  resolution?: 'local' | 'remote' | 'skip';
}

// ============================================
// Helper Functions
// ============================================

/**
 * Date를 ISO 문자열로 변환 (Supabase 호환)
 */
function toISOString(date: Date | undefined): string | null {
  if (!date) return null;
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
}

/**
 * ISO 문자열을 Date로 변환
 */
function toDate(isoString: string | null): Date {
  return isoString ? new Date(isoString) : new Date();
}

// ============================================
// Project Sync
// ============================================

/**
 * 프로젝트를 Supabase에 업로드
 */
export async function uploadProject(projectId: string, userId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.', syncedAt: new Date() };
  }

  try {
    // 로컬 데이터 로드
    const project = await db.projects.get(projectId);
    if (!project) {
      return { success: false, error: '프로젝트를 찾을 수 없습니다.', syncedAt: new Date() };
    }

    const volumes = await db.volumes.where('projectId').equals(projectId).toArray();
    const chapters = await db.chapters.where('projectId').equals(projectId).toArray();
    const scenes = await db.scenes.where('projectId').equals(projectId).toArray();
    const characters = await db.characters.where('projectId').equals(projectId).toArray();
    const locations = await db.locations.where('projectId').equals(projectId).toArray();
    const items = await db.items.where('projectId').equals(projectId).toArray();

    // 프로젝트 업로드/업데이트
    const { error: projectError } = await supabase
      .from('projects')
      .upsert({
        id: project.id,
        user_id: userId,
        title: project.title,
        description: project.description,
        template: project.template,
        terminology: project.terminology,
        genre: project.genre,
        target_platform: project.targetPlatform,
        target_length: project.targetLength,
        stats: project.stats,
        sync_enabled: project.syncEnabled,
        created_at: toISOString(project.createdAt),
        updated_at: toISOString(project.updatedAt),
        last_opened_at: toISOString(project.lastOpenedAt),
      }, { onConflict: 'id' });

    if (projectError) throw projectError;

    // Volumes 업로드
    if (volumes.length > 0) {
      const { error: volumesError } = await supabase
        .from('volumes')
        .upsert(volumes.map(v => ({
          id: v.id,
          project_id: projectId,
          title: v.title,
          description: '',
          status: v.status,
          sort_order: v.order,
          created_at: toISOString(v.createdAt),
          updated_at: toISOString(v.updatedAt),
        })), { onConflict: 'id' });

      if (volumesError) throw volumesError;
    }

    // Chapters 업로드
    if (chapters.length > 0) {
      const { error: chaptersError } = await supabase
        .from('chapters')
        .upsert(chapters.map(c => ({
          id: c.id,
          volume_id: c.volumeId,
          project_id: projectId,
          title: c.title,
          description: '',
          status: c.status,
          sort_order: c.order,
          created_at: toISOString(c.createdAt),
          updated_at: toISOString(c.updatedAt),
        })), { onConflict: 'id' });

      if (chaptersError) throw chaptersError;
    }

    // Scenes 업로드
    if (scenes.length > 0) {
      const { error: scenesError } = await supabase
        .from('scenes')
        .upsert(scenes.map(s => ({
          id: s.id,
          chapter_id: s.chapterId,
          project_id: projectId,
          title: s.title,
          content: s.content || '',
          status: s.status,
          sort_order: s.order,
          stats: s.stats,
          created_at: toISOString(s.createdAt),
          updated_at: toISOString(s.updatedAt),
        })), { onConflict: 'id' });

      if (scenesError) throw scenesError;
    }

    // World Cards 업로드
    const allCards = [
      ...characters.map(c => ({ ...c, card_type: 'character' })),
      ...locations.map(l => ({ ...l, card_type: 'location' })),
      ...items.map(i => ({ ...i, card_type: 'item' })),
    ];

    if (allCards.length > 0) {
      const { error: cardsError } = await supabase
        .from('world_cards')
        .upsert(allCards.map(card => ({
          id: card.id,
          project_id: projectId,
          card_type: card.card_type,
          name: card.name,
          description: card.description || '',
          image_url: card.imageUrl,
          data: card, // 전체 카드 데이터를 JSON으로 저장
          tags: card.tags || [],
          created_at: toISOString(card.createdAt),
          updated_at: toISOString(card.updatedAt),
        })), { onConflict: 'id' });

      if (cardsError) throw cardsError;
    }

    // 로컬 프로젝트 업데이트
    const syncedAt = new Date();
    await db.projects.update(projectId, {
      lastSyncedAt: syncedAt,
      userId,
    });

    console.log('[SyncService] 프로젝트 업로드 완료:', projectId);
    return { success: true, syncedAt };
  } catch (error) {
    console.error('[SyncService] 업로드 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.',
      syncedAt: new Date(),
    };
  }
}

/**
 * Supabase에서 프로젝트 다운로드
 */
export async function downloadProject(projectId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.', syncedAt: new Date() };
  }

  try {
    // 프로젝트 다운로드
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;
    if (!projectData) {
      return { success: false, error: '서버에서 프로젝트를 찾을 수 없습니다.', syncedAt: new Date() };
    }

    // Volumes 다운로드
    const { data: volumesData, error: volumesError } = await supabase
      .from('volumes')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');

    if (volumesError) throw volumesError;

    // Chapters 다운로드
    const { data: chaptersData, error: chaptersError } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');

    if (chaptersError) throw chaptersError;

    // Scenes 다운로드
    const { data: scenesData, error: scenesError } = await supabase
      .from('scenes')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');

    if (scenesError) throw scenesError;

    // World Cards 다운로드
    const { data: cardsData, error: cardsError } = await supabase
      .from('world_cards')
      .select('*')
      .eq('project_id', projectId);

    if (cardsError) throw cardsError;

    // 로컬에 저장 (트랜잭션)
    await db.transaction('rw', [db.projects, db.volumes, db.chapters, db.scenes, db.characters, db.locations, db.items], async () => {
      // 프로젝트 저장
      const project: Project = {
        id: projectData.id,
        title: projectData.title,
        description: projectData.description || '',
        template: projectData.template,
        terminology: projectData.terminology,
        genre: projectData.genre || [],
        targetPlatform: projectData.target_platform,
        targetLength: projectData.target_length,
        stats: projectData.stats,
        syncEnabled: projectData.sync_enabled,
        createdAt: toDate(projectData.created_at),
        updatedAt: toDate(projectData.updated_at),
        lastOpenedAt: toDate(projectData.last_opened_at),
        lastSyncedAt: new Date(),
        userId: projectData.user_id,
      };
      await db.projects.put(project);

      // Volumes 저장
      for (const v of volumesData || []) {
        const volume: Volume = {
          id: v.id,
          projectId: v.project_id,
          title: v.title,
          status: v.status,
          order: v.sort_order,
          stats: { charCount: 0, charCountWithSpaces: 0, chapterCount: 0 },
          createdAt: toDate(v.created_at),
          updatedAt: toDate(v.updated_at),
        };
        await db.volumes.put(volume);
      }

      // Chapters 저장
      for (const c of chaptersData || []) {
        const chapter: Chapter = {
          id: c.id,
          volumeId: c.volume_id,
          projectId: c.project_id,
          title: c.title,
          status: c.status,
          order: c.sort_order,
          stats: { charCount: 0, charCountWithSpaces: 0, sceneCount: 0 },
          createdAt: toDate(c.created_at),
          updatedAt: toDate(c.updated_at),
        };
        await db.chapters.put(chapter);
      }

      // Scenes 저장
      for (const s of scenesData || []) {
        // volumeId를 찾기 위해 chapter 조회
        const chapter = chaptersData?.find(c => c.id === s.chapter_id);
        const scene: Scene = {
          id: s.id,
          chapterId: s.chapter_id,
          volumeId: chapter?.volume_id || '',
          projectId: s.project_id,
          title: s.title,
          content: s.content || '',
          plainText: '', // 클라이언트에서 다시 계산됨
          status: s.status,
          order: s.sort_order,
          stats: s.stats || { charCount: 0, charCountWithSpaces: 0 },
          createdAt: toDate(s.created_at),
          updatedAt: toDate(s.updated_at),
        };
        await db.scenes.put(scene);
      }

      // World Cards 저장
      for (const card of cardsData || []) {
        const cardData = card.data || {};
        if (card.card_type === 'character') {
          await db.characters.put({
            ...cardData,
            id: card.id,
            projectId: card.project_id,
            name: card.name,
            description: card.description,
            imageUrl: card.image_url,
            tags: card.tags,
            createdAt: toDate(card.created_at),
            updatedAt: toDate(card.updated_at),
          } as CharacterCard);
        } else if (card.card_type === 'location') {
          await db.locations.put({
            ...cardData,
            id: card.id,
            projectId: card.project_id,
            name: card.name,
            description: card.description,
            imageUrl: card.image_url,
            tags: card.tags,
            createdAt: toDate(card.created_at),
            updatedAt: toDate(card.updated_at),
          } as LocationCard);
        } else if (card.card_type === 'item') {
          await db.items.put({
            ...cardData,
            id: card.id,
            projectId: card.project_id,
            name: card.name,
            description: card.description,
            imageUrl: card.image_url,
            tags: card.tags,
            createdAt: toDate(card.created_at),
            updatedAt: toDate(card.updated_at),
          } as ItemCard);
        }
      }
    });

    console.log('[SyncService] 프로젝트 다운로드 완료:', projectId);
    return { success: true, syncedAt: new Date() };
  } catch (error) {
    console.error('[SyncService] 다운로드 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '다운로드 중 오류가 발생했습니다.',
      syncedAt: new Date(),
    };
  }
}

/**
 * 사용자의 모든 프로젝트 목록 가져오기 (Supabase)
 */
export async function getRemoteProjects(): Promise<{ projects: Partial<Project>[]; error?: string }> {
  if (!isSupabaseConfigured) {
    return { projects: [], error: 'Supabase가 설정되지 않았습니다.' };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, template, stats, updated_at, created_at')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const projects = (data || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      template: p.template,
      stats: p.stats,
      updatedAt: toDate(p.updated_at),
      createdAt: toDate(p.created_at),
    }));

    return { projects };
  } catch (error) {
    console.error('[SyncService] 원격 프로젝트 목록 로드 실패:', error);
    return {
      projects: [],
      error: error instanceof Error ? error.message : '프로젝트 목록을 가져올 수 없습니다.',
    };
  }
}

/**
 * 프로젝트 삭제 (Supabase)
 */
export async function deleteRemoteProject(projectId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.', syncedAt: new Date() };
  }

  try {
    // CASCADE로 인해 관련 데이터도 모두 삭제됨
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;

    console.log('[SyncService] 원격 프로젝트 삭제 완료:', projectId);
    return { success: true, syncedAt: new Date() };
  } catch (error) {
    console.error('[SyncService] 원격 프로젝트 삭제 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.',
      syncedAt: new Date(),
    };
  }
}

/**
 * 충돌 감지 (로컬 vs 원격 updatedAt 비교)
 */
export async function checkConflict(projectId: string): Promise<SyncConflict | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const localProject = await db.projects.get(projectId);
    if (!localProject) return null;

    const { data: remoteProject, error } = await supabase
      .from('projects')
      .select('updated_at')
      .eq('id', projectId)
      .single();

    if (error || !remoteProject) return null;

    const localUpdatedAt = localProject.updatedAt;
    const remoteUpdatedAt = toDate(remoteProject.updated_at);

    // 마지막 동기화 이후 양쪽 모두 변경된 경우 충돌
    const lastSyncedAt = localProject.lastSyncedAt;
    if (lastSyncedAt) {
      const localChanged = localUpdatedAt > lastSyncedAt;
      const remoteChanged = remoteUpdatedAt > lastSyncedAt;

      if (localChanged && remoteChanged) {
        return {
          type: 'project',
          id: projectId,
          localUpdatedAt,
          remoteUpdatedAt,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[SyncService] 충돌 확인 실패:', error);
    return null;
  }
}

/**
 * 양방향 동기화 (스마트 싱크)
 */
export async function syncProject(projectId: string, userId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase가 설정되지 않았습니다.', syncedAt: new Date() };
  }

  try {
    // 1. 충돌 확인
    const conflict = await checkConflict(projectId);
    if (conflict) {
      return {
        success: false,
        error: '동기화 충돌이 발생했습니다. 로컬 유지 또는 서버 유지를 선택하세요.',
        conflicts: [conflict],
        syncedAt: new Date(),
      };
    }

    // 2. 로컬 프로젝트 확인
    const localProject = await db.projects.get(projectId);
    if (!localProject) {
      return { success: false, error: '프로젝트를 찾을 수 없습니다.', syncedAt: new Date() };
    }

    // 3. 원격에 프로젝트가 있는지 확인
    const { data: remoteProject } = await supabase
      .from('projects')
      .select('updated_at')
      .eq('id', projectId)
      .single();

    if (remoteProject) {
      // 원격에 있으면 비교 후 최신 버전으로 동기화
      const remoteUpdatedAt = toDate(remoteProject.updated_at);
      const localUpdatedAt = localProject.updatedAt;

      if (remoteUpdatedAt > localUpdatedAt) {
        // 원격이 더 최신이면 다운로드
        return downloadProject(projectId);
      } else {
        // 로컬이 더 최신이면 업로드
        return uploadProject(projectId, userId);
      }
    } else {
      // 원격에 없으면 업로드
      return uploadProject(projectId, userId);
    }
  } catch (error) {
    console.error('[SyncService] 동기화 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '동기화 중 오류가 발생했습니다.',
      syncedAt: new Date(),
    };
  }
}

export default {
  uploadProject,
  downloadProject,
  getRemoteProjects,
  deleteRemoteProject,
  checkConflict,
  syncProject,
};
