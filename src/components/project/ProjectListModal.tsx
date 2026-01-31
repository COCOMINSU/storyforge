/**
 * 프로젝트 목록 모달
 *
 * 모든 프로젝트를 표시하고 열기/삭제 기능을 제공합니다.
 */

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { useUIStore, useProjectStore } from '@/stores';
import { formatRelativeTime, formatCharCount } from '@/lib';

export function ProjectListModal() {
  const { activeModal, closeModal, openModal } = useUIStore();
  const { projects, openProject, deleteProject, isLoading } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isOpen = activeModal === 'project-list';

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpen = async (projectId: string) => {
    await openProject(projectId);
    closeModal();
  };

  const handleDelete = (projectId: string, title: string) => {
    openModal('confirm-delete', {
      type: 'project',
      id: projectId,
      title,
      onConfirm: async () => {
        setDeletingId(projectId);
        await deleteProject(projectId);
        setDeletingId(null);
      },
    });
  };

  const handleClose = () => {
    setSearchQuery('');
    closeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="프로젝트 목록"
      description={`총 ${projects.length}개의 프로젝트`}
      size="lg"
    >
      <div className="space-y-4">
        {/* 검색 */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="프로젝트 검색..."
            className="w-full rounded border border-border bg-background px-3 py-2 pl-9 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* 프로젝트 목록 */}
        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {filteredProjects.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery ? '검색 결과가 없습니다.' : '프로젝트가 없습니다.'}
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center justify-between rounded border border-border p-4 transition-colors hover:bg-accent"
              >
                {/* 프로젝트 정보 */}
                <button
                  onClick={() => handleOpen(project.id)}
                  disabled={isLoading || deletingId === project.id}
                  className="flex-1 text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {project.title}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {project.template === 'web-novel' && '웹소설'}
                      {project.template === 'novel' && '장편'}
                      {project.template === 'short-story' && '단편'}
                      {project.template === 'screenplay' && '시나리오'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{formatCharCount(project.stats.totalCharCount)}자</span>
                    <span>{project.stats.chapterCount}화</span>
                    <span>{formatRelativeTime(project.lastOpenedAt)}</span>
                  </div>
                  {project.genre.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {project.genre.slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                        >
                          {g}
                        </span>
                      ))}
                      {project.genre.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{project.genre.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleDelete(project.id, project.title)}
                    disabled={deletingId === project.id}
                    className="rounded p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive disabled:opacity-50"
                    title="삭제"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 새 프로젝트 버튼 */}
        <div className="border-t border-border pt-4">
          <button
            onClick={() => {
              closeModal();
              setTimeout(() => openModal('new-project'), 100);
            }}
            className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-border py-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 프로젝트 만들기
          </button>
        </div>
      </div>
    </Modal>
  );
}
