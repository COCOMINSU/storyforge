/**
 * 프로젝트 상태 관리 스토어
 *
 * 현재 열린 프로젝트와 프로젝트 목록을 관리합니다.
 *
 * 주요 기능:
 * - 프로젝트 CRUD
 * - 프로젝트 통계 갱신
 * - 최근 프로젝트 관리
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { db } from '@/db';
import { generateId } from '@/lib';
import type { Project, ProjectTemplate, TemplateConfig } from '@/types';

/**
 * 템플릿별 기본 설정
 */
export const TEMPLATE_CONFIGS: Record<ProjectTemplate, TemplateConfig> = {
  'web-novel': {
    name: '웹소설',
    description: '문피아, 카카오페이지, 네이버시리즈 등 웹소설 플랫폼용',
    terminology: { volume: '권', chapter: '화', scene: '씬' },
    targetLength: 5000,
    initialStructure: {
      volumes: [
        {
          title: '1권',
          chapters: [
            {
              title: '1화',
              scenes: [{ title: '씬 1' }],
            },
          ],
        },
      ],
    },
  },
  novel: {
    name: '장편소설',
    description: '출판용 장편소설',
    terminology: { volume: '부', chapter: '장', scene: '절' },
    targetLength: 10000,
    initialStructure: {
      volumes: [
        {
          title: '제1부',
          chapters: [
            {
              title: '제1장',
              scenes: [{ title: '제1절' }],
            },
          ],
        },
      ],
    },
  },
  'short-story': {
    name: '단편소설',
    description: '공모전, 문학지 등 단편소설용',
    terminology: { volume: '파트', chapter: '섹션', scene: '씬' },
    targetLength: 15000,
    initialStructure: {
      volumes: [
        {
          title: '본문',
          chapters: [
            {
              title: '섹션 1',
              scenes: [{ title: '씬 1' }],
            },
          ],
        },
      ],
    },
  },
  screenplay: {
    name: '시나리오',
    description: '드라마, 영화 시나리오용',
    terminology: { volume: '에피소드', chapter: '씬', scene: '비트' },
    targetLength: 0,
    initialStructure: {
      volumes: [
        {
          title: 'EP.1',
          chapters: [
            {
              title: 'S#1',
              scenes: [{ title: '비트 1' }],
            },
          ],
        },
      ],
    },
  },
};

interface ProjectState {
  /** 현재 열린 프로젝트 */
  currentProject: Project | null;

  /** 모든 프로젝트 목록 */
  projects: Project[];

  /** 프로젝트 목록 로딩 상태 */
  isLoading: boolean;

  /** 에러 메시지 */
  error: string | null;
}

interface ProjectActions {
  /** 모든 프로젝트 로드 */
  loadProjects: () => Promise<void>;

  /** 새 프로젝트 생성 */
  createProject: (
    title: string,
    template: ProjectTemplate,
    options?: {
      description?: string;
      genre?: string[];
      targetPlatform?: string;
      targetLength?: number;
    }
  ) => Promise<Project>;

  /** 프로젝트 열기 */
  openProject: (projectId: string) => Promise<void>;

  /** 프로젝트 닫기 */
  closeProject: () => void;

  /** 프로젝트 업데이트 */
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;

  /** 프로젝트 삭제 */
  deleteProject: (projectId: string) => Promise<void>;

  /** 프로젝트 통계 갱신 */
  updateProjectStats: (projectId: string) => Promise<void>;

  /** 에러 초기화 */
  clearError: () => void;
}

type ProjectStore = ProjectState & ProjectActions;

/**
 * 프로젝트 스토어
 *
 * @example
 * const { currentProject, openProject } = useProjectStore();
 *
 * // 프로젝트 열기
 * await openProject('project-id');
 *
 * // 새 프로젝트 생성
 * const project = await createProject('내 소설', 'web-novel');
 */
export const useProjectStore = create<ProjectStore>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      currentProject: null,
      projects: [],
      isLoading: false,
      error: null,

      // 모든 프로젝트 로드
      loadProjects: async () => {
        set({ isLoading: true, error: null });

        try {
          const projects = await db.projects
            .orderBy('lastOpenedAt')
            .reverse()
            .toArray();

          set({ projects, isLoading: false });
        } catch (error) {
          console.error('[ProjectStore] 프로젝트 로드 실패:', error);
          set({
            error: '프로젝트 목록을 불러오는데 실패했습니다.',
            isLoading: false,
          });
        }
      },

      // 새 프로젝트 생성
      createProject: async (title, template, options = {}) => {
        const config = TEMPLATE_CONFIGS[template];
        const now = new Date();

        const project: Project = {
          id: generateId(),
          title,
          description: options.description || '',
          template,
          terminology: { ...config.terminology },
          genre: options.genre || [],
          targetPlatform: options.targetPlatform,
          targetLength: options.targetLength || config.targetLength,
          stats: {
            totalCharCount: 0,
            totalCharCountWithSpaces: 0,
            volumeCount: 0,
            chapterCount: 0,
            sceneCount: 0,
          },
          createdAt: now,
          updatedAt: now,
          lastOpenedAt: now,
          syncEnabled: false,
        };

        try {
          await db.projects.add(project);

          // 초기 구조 생성
          await createInitialStructure(project.id, config.initialStructure);

          // 통계 갱신
          await get().updateProjectStats(project.id);

          // 상태 업데이트
          set((state) => ({
            projects: [project, ...state.projects],
          }));

          return project;
        } catch (error) {
          console.error('[ProjectStore] 프로젝트 생성 실패:', error);
          throw new Error('프로젝트 생성에 실패했습니다.');
        }
      },

      // 프로젝트 열기
      openProject: async (projectId) => {
        set({ isLoading: true, error: null });

        try {
          const project = await db.projects.get(projectId);

          if (!project) {
            throw new Error('프로젝트를 찾을 수 없습니다.');
          }

          // lastOpenedAt 갱신
          const now = new Date();
          await db.projects.update(projectId, { lastOpenedAt: now });

          set({
            currentProject: { ...project, lastOpenedAt: now },
            isLoading: false,
          });

          // 프로젝트 목록에서도 갱신
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, lastOpenedAt: now } : p
            ),
          }));
        } catch (error) {
          console.error('[ProjectStore] 프로젝트 열기 실패:', error);
          set({
            error: '프로젝트를 여는데 실패했습니다.',
            isLoading: false,
          });
        }
      },

      // 프로젝트 닫기
      closeProject: () => {
        set({ currentProject: null });
      },

      // 프로젝트 업데이트
      updateProject: async (projectId, updates) => {
        try {
          const now = new Date();
          await db.projects.update(projectId, {
            ...updates,
            updatedAt: now,
          });

          // 현재 프로젝트면 상태도 업데이트
          set((state) => ({
            currentProject:
              state.currentProject?.id === projectId
                ? { ...state.currentProject, ...updates, updatedAt: now }
                : state.currentProject,
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, ...updates, updatedAt: now } : p
            ),
          }));
        } catch (error) {
          console.error('[ProjectStore] 프로젝트 업데이트 실패:', error);
          throw new Error('프로젝트 업데이트에 실패했습니다.');
        }
      },

      // 프로젝트 삭제
      deleteProject: async (projectId) => {
        try {
          // 관련 데이터 모두 삭제
          const { deleteProjectData } = await import('@/db');
          await deleteProjectData(projectId);

          // 상태 업데이트
          set((state) => ({
            currentProject:
              state.currentProject?.id === projectId
                ? null
                : state.currentProject,
            projects: state.projects.filter((p) => p.id !== projectId),
          }));
        } catch (error) {
          console.error('[ProjectStore] 프로젝트 삭제 실패:', error);
          throw new Error('프로젝트 삭제에 실패했습니다.');
        }
      },

      // 프로젝트 통계 갱신
      updateProjectStats: async (projectId) => {
        try {
          const volumes = await db.volumes
            .where('projectId')
            .equals(projectId)
            .count();

          const chapters = await db.chapters
            .where('projectId')
            .equals(projectId)
            .count();

          const scenes = await db.scenes
            .where('projectId')
            .equals(projectId)
            .toArray();

          const totalCharCount = scenes.reduce(
            (sum, s) => sum + s.stats.charCount,
            0
          );
          const totalCharCountWithSpaces = scenes.reduce(
            (sum, s) => sum + s.stats.charCountWithSpaces,
            0
          );

          const stats = {
            totalCharCount,
            totalCharCountWithSpaces,
            volumeCount: volumes,
            chapterCount: chapters,
            sceneCount: scenes.length,
          };

          await db.projects.update(projectId, { stats });

          // 현재 프로젝트면 상태도 업데이트
          set((state) => ({
            currentProject:
              state.currentProject?.id === projectId
                ? { ...state.currentProject, stats }
                : state.currentProject,
          }));
        } catch (error) {
          console.error('[ProjectStore] 통계 갱신 실패:', error);
        }
      },

      // 에러 초기화
      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'ProjectStore' }
  )
);

/**
 * 초기 문서 구조 생성 헬퍼
 */
async function createInitialStructure(
  projectId: string,
  structure: TemplateConfig['initialStructure']
): Promise<void> {
  const now = new Date();

  for (let vIdx = 0; vIdx < structure.volumes.length; vIdx++) {
    const volumeData = structure.volumes[vIdx];
    const volumeId = generateId();

    await db.volumes.add({
      id: volumeId,
      projectId,
      title: volumeData.title,
      order: vIdx,
      status: 'draft',
      stats: { charCount: 0, charCountWithSpaces: 0, chapterCount: 0 },
      createdAt: now,
      updatedAt: now,
    });

    for (let cIdx = 0; cIdx < volumeData.chapters.length; cIdx++) {
      const chapterData = volumeData.chapters[cIdx];
      const chapterId = generateId();

      await db.chapters.add({
        id: chapterId,
        volumeId,
        projectId,
        title: chapterData.title,
        order: cIdx,
        status: 'draft',
        stats: { charCount: 0, charCountWithSpaces: 0, sceneCount: 0 },
        createdAt: now,
        updatedAt: now,
      });

      for (let sIdx = 0; sIdx < chapterData.scenes.length; sIdx++) {
        const sceneData = chapterData.scenes[sIdx];

        await db.scenes.add({
          id: generateId(),
          chapterId,
          volumeId,
          projectId,
          title: sceneData.title,
          order: sIdx,
          status: 'draft',
          content: '',
          plainText: '',
          stats: { charCount: 0, charCountWithSpaces: 0 },
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
}
