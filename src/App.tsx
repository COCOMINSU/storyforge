/**
 * Storyforge 메인 앱 컴포넌트
 *
 * 앱 초기화 및 전역 레이아웃을 담당합니다.
 */

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { WelcomeScreen } from '@/components/layout/WelcomeScreen';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ModalContainer, ErrorBoundary } from '@/components/common';
import { initializeDatabase } from '@/db';
import { useProjectStore, useDocumentStore, useWorldStore, useAuthStore, initializeTheme } from '@/stores';
import { useKeyboardShortcuts, useIsMobile } from '@/hooks';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const { currentProject, loadProjects } = useProjectStore();
  const { loadDocuments, clearDocuments } = useDocumentStore();
  const { loadCards, clearCards } = useWorldStore();
  const { initialize: initializeAuth } = useAuthStore();

  // 전역 키보드 단축키 등록
  useKeyboardShortcuts();

  // 모바일 감지
  const isMobile = useIsMobile();

  // 앱 초기화
  useEffect(() => {
    async function initialize() {
      try {
        // 테마 초기화
        initializeTheme();

        // 데이터베이스 초기화
        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
          throw new Error('데이터베이스 초기화에 실패했습니다.');
        }

        // 인증 초기화 (세션 확인)
        await initializeAuth();

        // 프로젝트 목록 로드
        await loadProjects();

        setIsInitialized(true);
      } catch (error) {
        console.error('[App] 초기화 실패:', error);
        setInitError(
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.'
        );
      }
    }

    initialize();
  }, [loadProjects, initializeAuth]);

  // 프로젝트 변경 시 문서 및 세계관 로드
  useEffect(() => {
    if (currentProject) {
      loadDocuments(currentProject.id);
      loadCards(currentProject.id);
    } else {
      clearDocuments();
      clearCards();
    }
  }, [currentProject, loadDocuments, loadCards, clearDocuments, clearCards]);

  // 로딩 중
  if (!isInitialized && !initError) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold text-foreground">
            Storyforge
          </div>
          <div className="text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 초기화 오류
  if (initError) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold text-destructive">
            초기화 오류
          </div>
          <div className="mb-4 text-muted-foreground">{initError}</div>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  // 프로젝트가 열려있으면 에디터 표시, 아니면 환영 화면
  const welcomeScreen = isMobile ? (
    <MobileLayout mainContent={<WelcomeScreen />} />
  ) : (
    <WelcomeScreen />
  );

  return (
    <ErrorBoundary>
      {currentProject ? <AppLayout /> : welcomeScreen}
      <ModalContainer />
    </ErrorBoundary>
  );
}

export default App;
