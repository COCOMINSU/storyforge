/**
 * 환영 화면
 *
 * 프로젝트가 열려있지 않을 때 표시됩니다.
 * - 새 프로젝트 생성
 * - 최근 프로젝트 목록
 * - 로그인/사용자 메뉴
 */

import { useProjectStore, useUIStore } from '@/stores';
import { formatRelativeTime } from '@/lib';
import { UserMenu } from '@/components/auth';
import { useIsMobile } from '@/hooks';

export function WelcomeScreen() {
  const { projects, openProject, isLoading } = useProjectStore();
  const { openModal } = useUIStore();
  const isMobile = useIsMobile();

  const recentProjects = projects.slice(0, 5);

  return (
    <div className={isMobile ? 'flex h-full flex-col bg-background' : 'flex h-screen flex-col bg-background'}>
      {/* 헤더 (데스크톱만) */}
      {!isMobile && (
        <header className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Storyforge</h1>
            <p className="text-sm text-muted-foreground">
              웹소설 작가를 위한 창작 도구
            </p>
          </div>
          {/* 로그인/사용자 메뉴 */}
          <UserMenu />
        </header>
      )}

      {/* 메인 컨텐츠 */}
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl xl:max-w-3xl">
          {/* 로고/타이틀 */}
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-4xl font-bold text-foreground">
              Storyforge
            </h2>
            <p className="text-muted-foreground">
              당신의 이야기를 시작하세요
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="mb-8 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => openModal('new-project')}
              className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 프로젝트
            </button>
            <button
              onClick={() => openModal('project-list')}
              className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-accent"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
              프로젝트 열기
            </button>
          </div>

          {/* 최근 프로젝트 */}
          {recentProjects.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase text-muted-foreground">
                최근 프로젝트
              </h3>
              <div className="space-y-2">
                {recentProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => openProject(project.id)}
                    disabled={isLoading}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {project.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {project.stats.totalCharCount.toLocaleString()}자 · {project.stats.chapterCount}화
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(project.lastOpenedAt)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 프로젝트 없을 때 */}
          {recentProjects.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground">
              <p>아직 프로젝트가 없습니다.</p>
              <p className="text-sm">새 프로젝트를 만들어 시작하세요!</p>
            </div>
          )}
        </div>
      </main>

      {/* 푸터 (데스크톱만) */}
      {!isMobile && (
        <footer className="border-t border-border p-4 text-center text-xs text-muted-foreground">
          <p>
            Storyforge v0.1.0 · 로그인하면 클라우드에 자동 동기화됩니다
          </p>
        </footer>
      )}
    </div>
  );
}
