/**
 * 문서 구조 상태 관리 스토어
 *
 * 권-화-씬 계층 구조를 관리합니다.
 * 트리 뷰에서 문서 탐색 및 조작에 사용됩니다.
 *
 * 주요 기능:
 * - 문서 계층 CRUD
 * - 드래그 앤 드롭 순서 변경
 * - 문서 상태 변경
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '@/db';
import { generateId, reorder } from '@/lib';
import type {
  Volume,
  Chapter,
  Scene,
  DocumentStatus,
  TreeNode,
} from '@/types';

interface DocumentState {
  /** 현재 프로젝트의 권 목록 */
  volumes: Volume[];

  /** 현재 프로젝트의 화 목록 */
  chapters: Chapter[];

  /** 현재 프로젝트의 씬 목록 */
  scenes: Scene[];

  /** 트리 데이터 (UI 렌더링용) */
  treeData: TreeNode[];

  /** 현재 선택된 씬 ID */
  selectedSceneId: string | null;

  /** 로딩 상태 */
  isLoading: boolean;
}

interface DocumentActions {
  /** 프로젝트의 모든 문서 로드 */
  loadDocuments: (projectId: string) => Promise<void>;

  /** 문서 초기화 (프로젝트 닫을 때) */
  clearDocuments: () => void;

  /** 씬 선택 */
  selectScene: (sceneId: string | null) => void;

  // === 권 관련 ===
  /** 권 추가 */
  addVolume: (projectId: string, title?: string) => Promise<Volume>;
  /** 권 업데이트 */
  updateVolume: (volumeId: string, updates: Partial<Volume>) => Promise<void>;
  /** 권 삭제 */
  deleteVolume: (volumeId: string) => Promise<void>;
  /** 권 복제 */
  duplicateVolume: (volumeId: string) => Promise<Volume>;

  // === 화 관련 ===
  /** 화 추가 */
  addChapter: (volumeId: string, title?: string) => Promise<Chapter>;
  /** 화 업데이트 */
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => Promise<void>;
  /** 화 삭제 */
  deleteChapter: (chapterId: string) => Promise<void>;
  /** 화 복제 */
  duplicateChapter: (chapterId: string) => Promise<Chapter>;

  // === 씬 관련 ===
  /** 씬 추가 */
  addScene: (chapterId: string, title?: string) => Promise<Scene>;
  /** 씬 업데이트 */
  updateScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
  /** 씬 삭제 */
  deleteScene: (sceneId: string) => Promise<void>;
  /** 씬 복제 */
  duplicateScene: (sceneId: string) => Promise<Scene>;

  // === 순서 변경 ===
  /** 권 순서 변경 */
  reorderVolumes: (fromIndex: number, toIndex: number) => Promise<void>;
  /** 화 순서 변경 (같은 권 내) */
  reorderChapters: (
    volumeId: string,
    fromIndex: number,
    toIndex: number
  ) => Promise<void>;
  /** 씬 순서 변경 (같은 화 내) */
  reorderScenes: (
    chapterId: string,
    fromIndex: number,
    toIndex: number
  ) => Promise<void>;
  /** 화를 다른 권으로 이동 */
  moveChapter: (chapterId: string, targetVolumeId: string) => Promise<void>;
  /** 씬을 다른 화로 이동 */
  moveScene: (sceneId: string, targetChapterId: string) => Promise<void>;

  // === 상태 변경 ===
  /** 문서 상태 변경 */
  setDocumentStatus: (
    type: 'volume' | 'chapter' | 'scene',
    id: string,
    status: DocumentStatus
  ) => Promise<void>;

  // === 트리 데이터 ===
  /** 트리 데이터 재구성 */
  rebuildTreeData: () => void;
}

type DocumentStore = DocumentState & DocumentActions;

/**
 * 문서 스토어
 *
 * @example
 * const { volumes, addVolume, selectScene } = useDocumentStore();
 *
 * // 권 추가
 * await addVolume(projectId, '2권');
 *
 * // 씬 선택
 * selectScene(sceneId);
 */
export const useDocumentStore = create<DocumentStore>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      volumes: [],
      chapters: [],
      scenes: [],
      treeData: [],
      selectedSceneId: null,
      isLoading: false,

      // 문서 로드
      loadDocuments: async (projectId) => {
        set({ isLoading: true });

        try {
          const [volumes, chapters, scenes] = await Promise.all([
            db.volumes.where('projectId').equals(projectId).sortBy('order'),
            db.chapters.where('projectId').equals(projectId).sortBy('order'),
            db.scenes.where('projectId').equals(projectId).sortBy('order'),
          ]);

          set({ volumes, chapters, scenes, isLoading: false });
          get().rebuildTreeData();
        } catch (error) {
          console.error('[DocumentStore] 문서 로드 실패:', error);
          set({ isLoading: false });
        }
      },

      // 문서 초기화
      clearDocuments: () => {
        set({
          volumes: [],
          chapters: [],
          scenes: [],
          treeData: [],
          selectedSceneId: null,
        });
      },

      // 씬 선택
      selectScene: (sceneId) => {
        set({ selectedSceneId: sceneId });
      },

      // === 권 관련 ===
      addVolume: async (projectId, title) => {
        const { volumes } = get();
        const now = new Date();
        const order = volumes.length;

        const volume: Volume = {
          id: generateId(),
          projectId,
          title: title || `${order + 1}권`,
          order,
          status: 'draft',
          stats: { charCount: 0, charCountWithSpaces: 0, chapterCount: 0 },
          createdAt: now,
          updatedAt: now,
        };

        await db.volumes.add(volume);
        set({ volumes: [...volumes, volume] });
        get().rebuildTreeData();

        return volume;
      },

      updateVolume: async (volumeId, updates) => {
        const now = new Date();
        await db.volumes.update(volumeId, { ...updates, updatedAt: now });

        set((state) => ({
          volumes: state.volumes.map((v) =>
            v.id === volumeId ? { ...v, ...updates, updatedAt: now } : v
          ),
        }));
        get().rebuildTreeData();
      },

      deleteVolume: async (volumeId) => {
        // 하위 화, 씬, 버전 모두 삭제
        const chapters = await db.chapters
          .where('volumeId')
          .equals(volumeId)
          .toArray();
        const chapterIds = chapters.map((c) => c.id);

        const scenes = await db.scenes
          .where('chapterId')
          .anyOf(chapterIds)
          .toArray();
        const sceneIds = scenes.map((s) => s.id);

        await db.transaction(
          'rw',
          [db.volumes, db.chapters, db.scenes, db.versions],
          async () => {
            await db.versions.where('sceneId').anyOf(sceneIds).delete();
            await db.scenes.where('chapterId').anyOf(chapterIds).delete();
            await db.chapters.where('volumeId').equals(volumeId).delete();
            await db.volumes.delete(volumeId);
          }
        );

        set((state) => ({
          volumes: state.volumes.filter((v) => v.id !== volumeId),
          chapters: state.chapters.filter((c) => c.volumeId !== volumeId),
          scenes: state.scenes.filter((s) => s.volumeId !== volumeId),
          selectedSceneId:
            sceneIds.includes(state.selectedSceneId || '')
              ? null
              : state.selectedSceneId,
        }));
        get().rebuildTreeData();
      },

      // 권 복제
      duplicateVolume: async (volumeId) => {
        const { volumes, chapters, scenes } = get();
        const volume = volumes.find((v) => v.id === volumeId);
        if (!volume) throw new Error('권을 찾을 수 없습니다.');

        const now = new Date();
        const newVolumeId = generateId();
        const newOrder = volumes.length;

        // 새 권 생성
        const newVolume: Volume = {
          ...volume,
          id: newVolumeId,
          title: `${volume.title} (복제)`,
          order: newOrder,
          createdAt: now,
          updatedAt: now,
        };

        // 하위 화 및 씬 복제
        const volumeChapters = chapters.filter((c) => c.volumeId === volumeId);
        const newChapters: Chapter[] = [];
        const newScenes: Scene[] = [];

        for (const chapter of volumeChapters) {
          const newChapterId = generateId();
          const newChapter: Chapter = {
            ...chapter,
            id: newChapterId,
            volumeId: newVolumeId,
            createdAt: now,
            updatedAt: now,
          };
          newChapters.push(newChapter);

          // 화의 씬들 복제
          const chapterScenes = scenes.filter((s) => s.chapterId === chapter.id);
          for (const scene of chapterScenes) {
            const newScene: Scene = {
              ...scene,
              id: generateId(),
              chapterId: newChapterId,
              volumeId: newVolumeId,
              createdAt: now,
              updatedAt: now,
            };
            newScenes.push(newScene);
          }
        }

        // DB에 저장
        await db.transaction('rw', [db.volumes, db.chapters, db.scenes], async () => {
          await db.volumes.add(newVolume);
          await db.chapters.bulkAdd(newChapters);
          await db.scenes.bulkAdd(newScenes);
        });

        set((state) => ({
          volumes: [...state.volumes, newVolume],
          chapters: [...state.chapters, ...newChapters],
          scenes: [...state.scenes, ...newScenes],
        }));
        get().rebuildTreeData();

        return newVolume;
      },

      // === 화 관련 ===
      addChapter: async (volumeId, title) => {
        const { chapters, volumes } = get();
        const volume = volumes.find((v) => v.id === volumeId);
        if (!volume) throw new Error('권을 찾을 수 없습니다.');

        const volumeChapters = chapters.filter((c) => c.volumeId === volumeId);
        const now = new Date();
        const order = volumeChapters.length;

        const chapter: Chapter = {
          id: generateId(),
          volumeId,
          projectId: volume.projectId,
          title: title || `${order + 1}화`,
          order,
          status: 'draft',
          stats: { charCount: 0, charCountWithSpaces: 0, sceneCount: 0 },
          createdAt: now,
          updatedAt: now,
        };

        await db.chapters.add(chapter);
        set({ chapters: [...chapters, chapter] });
        get().rebuildTreeData();

        return chapter;
      },

      updateChapter: async (chapterId, updates) => {
        const now = new Date();
        await db.chapters.update(chapterId, { ...updates, updatedAt: now });

        set((state) => ({
          chapters: state.chapters.map((c) =>
            c.id === chapterId ? { ...c, ...updates, updatedAt: now } : c
          ),
        }));
        get().rebuildTreeData();
      },

      deleteChapter: async (chapterId) => {
        const scenes = await db.scenes
          .where('chapterId')
          .equals(chapterId)
          .toArray();
        const sceneIds = scenes.map((s) => s.id);

        await db.transaction('rw', [db.chapters, db.scenes, db.versions], async () => {
          await db.versions.where('sceneId').anyOf(sceneIds).delete();
          await db.scenes.where('chapterId').equals(chapterId).delete();
          await db.chapters.delete(chapterId);
        });

        set((state) => ({
          chapters: state.chapters.filter((c) => c.id !== chapterId),
          scenes: state.scenes.filter((s) => s.chapterId !== chapterId),
          selectedSceneId:
            sceneIds.includes(state.selectedSceneId || '')
              ? null
              : state.selectedSceneId,
        }));
        get().rebuildTreeData();
      },

      // 화 복제
      duplicateChapter: async (chapterId) => {
        const { chapters, scenes } = get();
        const chapter = chapters.find((c) => c.id === chapterId);
        if (!chapter) throw new Error('화를 찾을 수 없습니다.');

        const now = new Date();
        const newChapterId = generateId();
        const volumeChapters = chapters.filter((c) => c.volumeId === chapter.volumeId);
        const newOrder = volumeChapters.length;

        // 새 화 생성
        const newChapter: Chapter = {
          ...chapter,
          id: newChapterId,
          title: `${chapter.title} (복제)`,
          order: newOrder,
          createdAt: now,
          updatedAt: now,
        };

        // 하위 씬 복제
        const chapterScenes = scenes.filter((s) => s.chapterId === chapterId);
        const newScenes: Scene[] = chapterScenes.map((scene) => ({
          ...scene,
          id: generateId(),
          chapterId: newChapterId,
          createdAt: now,
          updatedAt: now,
        }));

        // DB에 저장
        await db.transaction('rw', [db.chapters, db.scenes], async () => {
          await db.chapters.add(newChapter);
          await db.scenes.bulkAdd(newScenes);
        });

        set((state) => ({
          chapters: [...state.chapters, newChapter],
          scenes: [...state.scenes, ...newScenes],
        }));
        get().rebuildTreeData();

        return newChapter;
      },

      // === 씬 관련 ===
      addScene: async (chapterId, title) => {
        const { scenes, chapters } = get();
        const chapter = chapters.find((c) => c.id === chapterId);
        if (!chapter) throw new Error('화를 찾을 수 없습니다.');

        const chapterScenes = scenes.filter((s) => s.chapterId === chapterId);
        const now = new Date();
        const order = chapterScenes.length;

        const scene: Scene = {
          id: generateId(),
          chapterId,
          volumeId: chapter.volumeId,
          projectId: chapter.projectId,
          title: title || `씬 ${order + 1}`,
          order,
          status: 'draft',
          content: '',
          plainText: '',
          stats: { charCount: 0, charCountWithSpaces: 0 },
          createdAt: now,
          updatedAt: now,
        };

        await db.scenes.add(scene);
        set({ scenes: [...scenes, scene] });
        get().rebuildTreeData();

        return scene;
      },

      updateScene: async (sceneId, updates) => {
        const now = new Date();
        await db.scenes.update(sceneId, { ...updates, updatedAt: now });

        set((state) => ({
          scenes: state.scenes.map((s) =>
            s.id === sceneId ? { ...s, ...updates, updatedAt: now } : s
          ),
        }));
        get().rebuildTreeData();
      },

      deleteScene: async (sceneId) => {
        await db.transaction('rw', [db.scenes, db.versions], async () => {
          await db.versions.where('sceneId').equals(sceneId).delete();
          await db.scenes.delete(sceneId);
        });

        set((state) => ({
          scenes: state.scenes.filter((s) => s.id !== sceneId),
          selectedSceneId:
            state.selectedSceneId === sceneId ? null : state.selectedSceneId,
        }));
        get().rebuildTreeData();
      },

      // 씬 복제
      duplicateScene: async (sceneId) => {
        const { scenes } = get();
        const scene = scenes.find((s) => s.id === sceneId);
        if (!scene) throw new Error('씬을 찾을 수 없습니다.');

        const now = new Date();
        const chapterScenes = scenes.filter((s) => s.chapterId === scene.chapterId);
        const newOrder = chapterScenes.length;

        const newScene: Scene = {
          ...scene,
          id: generateId(),
          title: `${scene.title} (복제)`,
          order: newOrder,
          createdAt: now,
          updatedAt: now,
        };

        await db.scenes.add(newScene);

        set((state) => ({
          scenes: [...state.scenes, newScene],
        }));
        get().rebuildTreeData();

        return newScene;
      },

      // === 순서 변경 ===
      reorderVolumes: async (fromIndex, toIndex) => {
        const { volumes } = get();
        const reordered = reorder(volumes, fromIndex, toIndex);

        // order 값 갱신
        const updates = reordered.map((v, idx) => ({ ...v, order: idx }));

        await db.transaction('rw', db.volumes, async () => {
          for (const v of updates) {
            await db.volumes.update(v.id, { order: v.order });
          }
        });

        set({ volumes: updates });
        get().rebuildTreeData();
      },

      reorderChapters: async (volumeId, fromIndex, toIndex) => {
        const { chapters } = get();
        const volumeChapters = chapters
          .filter((c) => c.volumeId === volumeId)
          .sort((a, b) => a.order - b.order);

        const reordered = reorder(volumeChapters, fromIndex, toIndex);
        const updates = reordered.map((c, idx) => ({ ...c, order: idx }));

        await db.transaction('rw', db.chapters, async () => {
          for (const c of updates) {
            await db.chapters.update(c.id, { order: c.order });
          }
        });

        set((state) => ({
          chapters: state.chapters.map(
            (c) => updates.find((u) => u.id === c.id) || c
          ),
        }));
        get().rebuildTreeData();
      },

      reorderScenes: async (chapterId, fromIndex, toIndex) => {
        const { scenes } = get();
        const chapterScenes = scenes
          .filter((s) => s.chapterId === chapterId)
          .sort((a, b) => a.order - b.order);

        const reordered = reorder(chapterScenes, fromIndex, toIndex);
        const updates = reordered.map((s, idx) => ({ ...s, order: idx }));

        await db.transaction('rw', db.scenes, async () => {
          for (const s of updates) {
            await db.scenes.update(s.id, { order: s.order });
          }
        });

        set((state) => ({
          scenes: state.scenes.map(
            (s) => updates.find((u) => u.id === s.id) || s
          ),
        }));
        get().rebuildTreeData();
      },

      moveChapter: async (chapterId, targetVolumeId) => {
        const { chapters, volumes, scenes } = get();
        const chapter = chapters.find((c) => c.id === chapterId);
        const targetVolume = volumes.find((v) => v.id === targetVolumeId);

        if (!chapter || !targetVolume) return;

        const targetChapters = chapters.filter(
          (c) => c.volumeId === targetVolumeId
        );
        const newOrder = targetChapters.length;

        await db.transaction('rw', [db.chapters, db.scenes], async () => {
          await db.chapters.update(chapterId, {
            volumeId: targetVolumeId,
            order: newOrder,
          });

          // 해당 화의 모든 씬도 volumeId 업데이트
          const chapterScenes = scenes.filter((s) => s.chapterId === chapterId);
          for (const scene of chapterScenes) {
            await db.scenes.update(scene.id, { volumeId: targetVolumeId });
          }
        });

        set((state) => ({
          chapters: state.chapters.map((c) =>
            c.id === chapterId
              ? { ...c, volumeId: targetVolumeId, order: newOrder }
              : c
          ),
          scenes: state.scenes.map((s) =>
            s.chapterId === chapterId ? { ...s, volumeId: targetVolumeId } : s
          ),
        }));
        get().rebuildTreeData();
      },

      moveScene: async (sceneId, targetChapterId) => {
        const { scenes, chapters } = get();
        const scene = scenes.find((s) => s.id === sceneId);
        const targetChapter = chapters.find((c) => c.id === targetChapterId);

        if (!scene || !targetChapter) return;

        const targetScenes = scenes.filter(
          (s) => s.chapterId === targetChapterId
        );
        const newOrder = targetScenes.length;

        await db.scenes.update(sceneId, {
          chapterId: targetChapterId,
          volumeId: targetChapter.volumeId,
          order: newOrder,
        });

        set((state) => ({
          scenes: state.scenes.map((s) =>
            s.id === sceneId
              ? {
                  ...s,
                  chapterId: targetChapterId,
                  volumeId: targetChapter.volumeId,
                  order: newOrder,
                }
              : s
          ),
        }));
        get().rebuildTreeData();
      },

      // 문서 상태 변경
      setDocumentStatus: async (type, id, status) => {
        const now = new Date();

        switch (type) {
          case 'volume':
            await db.volumes.update(id, { status, updatedAt: now });
            set((state) => ({
              volumes: state.volumes.map((v) =>
                v.id === id ? { ...v, status, updatedAt: now } : v
              ),
            }));
            break;
          case 'chapter':
            await db.chapters.update(id, { status, updatedAt: now });
            set((state) => ({
              chapters: state.chapters.map((c) =>
                c.id === id ? { ...c, status, updatedAt: now } : c
              ),
            }));
            break;
          case 'scene':
            await db.scenes.update(id, { status, updatedAt: now });
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id === id ? { ...s, status, updatedAt: now } : s
              ),
            }));
            break;
        }

        get().rebuildTreeData();
      },

      // 트리 데이터 재구성
      rebuildTreeData: () => {
        const { volumes, chapters, scenes } = get();

        const treeData: TreeNode[] = volumes
          .sort((a, b) => a.order - b.order)
          .map((volume) => ({
            id: volume.id,
            title: volume.title,
            type: 'volume' as const,
            status: volume.status,
            order: volume.order,
            children: chapters
              .filter((c) => c.volumeId === volume.id)
              .sort((a, b) => a.order - b.order)
              .map((chapter) => ({
                id: chapter.id,
                title: chapter.title,
                type: 'chapter' as const,
                status: chapter.status,
                order: chapter.order,
                parentId: volume.id,
                children: scenes
                  .filter((s) => s.chapterId === chapter.id)
                  .sort((a, b) => a.order - b.order)
                  .map((scene) => ({
                    id: scene.id,
                    title: scene.title,
                    type: 'scene' as const,
                    status: scene.status,
                    order: scene.order,
                    parentId: chapter.id,
                  })),
              })),
          }));

        set({ treeData });
      },
    }),
    { name: 'DocumentStore' }
  )
);
