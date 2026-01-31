/**
 * 에디터 패인
 *
 * TipTap 에디터를 포함하는 중앙 영역입니다.
 * 씬이 선택되지 않았을 때는 안내 메시지를 표시합니다.
 * 에디터는 lazy loading으로 필요할 때만 로드됩니다.
 */

import { lazy, Suspense } from 'react';
import { useDocumentStore, useEditorStore, useUIStore } from '@/stores';

// TipTap 에디터 lazy loading (가장 무거운 의존성)
const TipTapEditor = lazy(() =>
  import('@/components/editor/TipTapEditor').then((m) => ({
    default: m.TipTapEditor,
  }))
);

// 에디터 로딩 스켈레톤
function EditorSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-1/3 rounded bg-muted"></div>
      <div className="space-y-2">
        <div className="h-4 rounded bg-muted"></div>
        <div className="h-4 w-5/6 rounded bg-muted"></div>
        <div className="h-4 w-4/6 rounded bg-muted"></div>
      </div>
    </div>
  );
}

export function EditorPane() {
  const { selectedSceneId, scenes } = useDocumentStore();

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  // 씬이 선택되지 않은 경우
  if (!selectedScene) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mb-2 text-lg font-medium text-foreground">
            씬을 선택하세요
          </h3>
          <p className="text-sm text-muted-foreground">
            좌측 패널에서 편집할 씬을 선택하거나
            <br />
            새로운 씬을 추가하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* 에디터 헤더 */}
      <EditorHeader scene={selectedScene} />

      {/* 에디터 본문 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Suspense fallback={<EditorSkeleton />}>
            <TipTapEditor sceneId={selectedScene.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

interface EditorHeaderProps {
  scene: {
    id: string;
    title: string;
    stats: {
      charCount: number;
      charCountWithSpaces: number;
    };
  };
}

/**
 * 에디터 헤더 - 씬 제목 및 통계
 */
function EditorHeader({ scene }: EditorHeaderProps) {
  const { saveStatus, versions } = useEditorStore();
  const { openModal } = useUIStore();

  const saveStatusText = {
    saved: '저장됨',
    saving: '저장 중...',
    unsaved: '변경사항 있음',
    error: '저장 실패',
  };

  const saveStatusColor = {
    saved: 'text-status-complete',
    saving: 'text-status-writing',
    unsaved: 'text-status-draft',
    error: 'text-destructive',
  };

  const handleOpenVersionHistory = () => {
    openModal('version-history');
  };

  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-3">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-medium text-foreground">{scene.title}</h2>
        <span className={`text-xs ${saveStatusColor[saveStatus]}`}>
          {saveStatusText[saveStatus]}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{scene.stats.charCount.toLocaleString()}자</span>
        <span className="text-muted-foreground/50">|</span>
        <span>{scene.stats.charCountWithSpaces.toLocaleString()}자 (공백 포함)</span>
        <span className="text-muted-foreground/50">|</span>
        <button
          onClick={handleOpenVersionHistory}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          title="버전 히스토리"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{versions.length}</span>
        </button>
      </div>
    </div>
  );
}
