/**
 * 에디터 상태 관리 스토어
 *
 * TipTap 에디터의 상태와 자동 저장을 관리합니다.
 *
 * 주요 기능:
 * - 에디터 컨텐츠 관리
 * - 자동 저장 (2초 디바운스)
 * - 버전 히스토리
 * - 저장 상태 표시
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Editor } from '@tiptap/react';
import { db } from '@/db';
import {
  generateId,
  countCharactersForStats,
  extractPlainText,
  debounce,
} from '@/lib';
import type { Scene, DocumentVersion, SaveStatus, VersionReason } from '@/types';
import { useProjectStore } from './useProjectStore';

/** 버전 최대 개수 (씬당) */
const MAX_VERSIONS_PER_SCENE = 50;

/** 자동 저장 디바운스 시간 (ms) */
const AUTO_SAVE_DELAY = 2000;

interface EditorState {
  /** TipTap 에디터 인스턴스 */
  editor: Editor | null;

  /** 현재 편집 중인 씬 */
  currentScene: Scene | null;

  /** 저장 상태 */
  saveStatus: SaveStatus;

  /** 마지막 저장 시각 */
  lastSavedAt: Date | null;

  /** 버전 히스토리 */
  versions: DocumentVersion[];

  /** 버전 히스토리 로딩 상태 */
  isLoadingVersions: boolean;
}

interface EditorActions {
  /** 에디터 인스턴스 설정 */
  setEditor: (editor: Editor | null) => void;

  /** 씬 로드 (에디터에 컨텐츠 로드) */
  loadScene: (sceneId: string) => Promise<void>;

  /** 씬 언로드 */
  unloadScene: () => void;

  /** 컨텐츠 변경 핸들러 (자동 저장 트리거) */
  onContentChange: (content: string) => void;

  /** 수동 저장 */
  saveManually: () => Promise<void>;

  /** 버전 히스토리 로드 */
  loadVersions: (sceneId: string) => Promise<void>;

  /** 버전 복원 */
  revertToVersion: (versionId: string) => Promise<void>;

  /** 저장 상태 설정 */
  setSaveStatus: (status: SaveStatus) => void;
}

type EditorStore = EditorState & EditorActions;

/**
 * 에디터 스토어
 *
 * @example
 * const { currentScene, saveStatus, saveManually } = useEditorStore();
 *
 * // 수동 저장
 * await saveManually();
 *
 * // 저장 상태 확인
 * if (saveStatus === 'saved') {
 *   console.log('저장됨');
 * }
 */
export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => {
      // 디바운스된 자동 저장 함수
      const debouncedSave = debounce(async (content: string) => {
        const { currentScene } = get();
        if (!currentScene) return;

        await saveScene(currentScene.id, content, 'auto-save');
      }, AUTO_SAVE_DELAY);

      return {
        // 초기 상태
        editor: null,
        currentScene: null,
        saveStatus: 'saved',
        lastSavedAt: null,
        versions: [],
        isLoadingVersions: false,

        // 에디터 인스턴스 설정
        setEditor: (editor) => {
          set({ editor });
        },

        // 씬 로드
        loadScene: async (sceneId) => {
          try {
            const scene = await db.scenes.get(sceneId);
            if (!scene) {
              throw new Error('씬을 찾을 수 없습니다.');
            }

            const { editor } = get();
            if (editor && scene.content) {
              try {
                const json = JSON.parse(scene.content);
                editor.commands.setContent(json);
              } catch {
                // JSON 파싱 실패 시 빈 문서로 설정
                editor.commands.setContent({ type: 'doc', content: [] });
              }
            } else if (editor) {
              editor.commands.setContent({ type: 'doc', content: [] });
            }

            set({
              currentScene: scene,
              saveStatus: 'saved',
              lastSavedAt: scene.updatedAt,
            });

            // 버전 히스토리도 로드
            get().loadVersions(sceneId);
          } catch (error) {
            console.error('[EditorStore] 씬 로드 실패:', error);
          }
        },

        // 씬 언로드
        unloadScene: () => {
          const { editor } = get();
          if (editor) {
            editor.commands.setContent({ type: 'doc', content: [] });
          }

          set({
            currentScene: null,
            saveStatus: 'saved',
            lastSavedAt: null,
            versions: [],
          });
        },

        // 컨텐츠 변경 핸들러
        onContentChange: (content) => {
          set({ saveStatus: 'unsaved' });
          debouncedSave(content);
        },

        // 수동 저장
        saveManually: async () => {
          const { currentScene, editor } = get();
          if (!currentScene || !editor) return;

          const content = JSON.stringify(editor.getJSON());
          await saveScene(currentScene.id, content, 'manual-save');
        },

        // 버전 히스토리 로드
        loadVersions: async (sceneId) => {
          set({ isLoadingVersions: true });

          try {
            const versions = await db.versions
              .where('sceneId')
              .equals(sceneId)
              .reverse()
              .sortBy('createdAt');

            set({ versions, isLoadingVersions: false });
          } catch (error) {
            console.error('[EditorStore] 버전 로드 실패:', error);
            set({ isLoadingVersions: false });
          }
        },

        // 버전 복원
        revertToVersion: async (versionId) => {
          const { currentScene, editor, versions } = get();
          if (!currentScene || !editor) return;

          const version = versions.find((v) => v.id === versionId);
          if (!version) return;

          // 현재 상태 백업
          const currentContent = JSON.stringify(editor.getJSON());
          await saveScene(currentScene.id, currentContent, 'before-revert');

          // 버전 복원
          try {
            const json = JSON.parse(version.content);
            editor.commands.setContent(json);

            // 씬 업데이트
            const plainText = extractPlainText(json);
            const stats = countCharactersForStats(plainText);
            const now = new Date();

            await db.scenes.update(currentScene.id, {
              content: version.content,
              plainText,
              stats,
              updatedAt: now,
            });

            set({
              currentScene: {
                ...currentScene,
                content: version.content,
                plainText,
                stats,
                updatedAt: now,
              },
              saveStatus: 'saved',
              lastSavedAt: now,
            });

            // 버전 히스토리 새로고침
            get().loadVersions(currentScene.id);
          } catch (error) {
            console.error('[EditorStore] 버전 복원 실패:', error);
          }
        },

        // 저장 상태 설정
        setSaveStatus: (status) => {
          set({ saveStatus: status });
        },
      };

      // 씬 저장 내부 함수
      async function saveScene(
        sceneId: string,
        content: string,
        reason: VersionReason
      ): Promise<void> {
        set({ saveStatus: 'saving' });

        try {
          const plainText = extractPlainText(content);
          const stats = countCharactersForStats(plainText);
          const now = new Date();

          // 씬 업데이트
          await db.scenes.update(sceneId, {
            content,
            plainText,
            stats,
            updatedAt: now,
          });

          // 버전 저장
          const version: DocumentVersion = {
            id: generateId(),
            sceneId,
            content,
            plainText,
            stats,
            createdAt: now,
            reason,
          };

          await db.versions.add(version);

          // 오래된 버전 정리
          await cleanupOldVersions(sceneId);

          // 상태 업데이트
          const currentScene = get().currentScene;
          if (currentScene?.id === sceneId) {
            set({
              currentScene: {
                ...currentScene,
                content,
                plainText,
                stats,
                updatedAt: now,
              },
              saveStatus: 'saved',
              lastSavedAt: now,
            });
          }

          // 버전 히스토리 새로고침
          get().loadVersions(sceneId);

          // 프로젝트 통계 갱신
          const scene = await db.scenes.get(sceneId);
          if (scene) {
            useProjectStore.getState().updateProjectStats(scene.projectId);
          }
        } catch (error) {
          console.error('[EditorStore] 저장 실패:', error);
          set({ saveStatus: 'error' });
        }
      }

      // 오래된 버전 정리
      async function cleanupOldVersions(sceneId: string): Promise<void> {
        const versions = await db.versions
          .where('sceneId')
          .equals(sceneId)
          .sortBy('createdAt');

        if (versions.length > MAX_VERSIONS_PER_SCENE) {
          const toDelete = versions.slice(
            0,
            versions.length - MAX_VERSIONS_PER_SCENE
          );
          const idsToDelete = toDelete.map((v) => v.id);
          await db.versions.bulkDelete(idsToDelete);
        }
      }
    },
    { name: 'EditorStore' }
  )
);
