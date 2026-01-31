/**
 * 좌측 패널
 *
 * 세 개의 탭으로 구성:
 * - 구조(structure): 문서 트리 뷰
 * - 세계관(world): 인물, 장소, 아이템 카드
 * - 설정(settings): 프로젝트 설정
 */

import { useUIStore, useProjectStore, useDocumentStore } from '@/stores';
import { cn } from '@/lib';
import { TreeView } from '@/components/tree';
import { WorldCardList } from '@/components/worldbuilding';
import { UserMenu } from '@/components/auth';

// 아이콘 (임시 - 추후 lucide-react 사용)
const FolderIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export function LeftPanel() {
  const { leftPanelTab, setLeftPanelTab } = useUIStore();
  const { currentProject } = useProjectStore();

  return (
    <div className="flex h-full flex-col">
      {/* 프로젝트 헤더 */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <h2 className="truncate text-sm font-semibold text-foreground">
          {currentProject?.title || '프로젝트'}
        </h2>
        <UserMenu />
      </div>

      {/* 탭 버튼 */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setLeftPanelTab('structure')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-2 text-sm transition-colors',
            leftPanelTab === 'structure'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FolderIcon />
          <span className="hidden sm:inline">구조</span>
        </button>
        <button
          onClick={() => setLeftPanelTab('world')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-2 text-sm transition-colors',
            leftPanelTab === 'world'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <GlobeIcon />
          <span className="hidden sm:inline">세계관</span>
        </button>
        <button
          onClick={() => setLeftPanelTab('settings')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-2 text-sm transition-colors',
            leftPanelTab === 'settings'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <SettingsIcon />
          <span className="hidden sm:inline">설정</span>
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        {leftPanelTab === 'structure' && <StructureTab />}
        {leftPanelTab === 'world' && <WorldCardList />}
        {leftPanelTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

/**
 * 구조 탭 - 문서 트리 뷰
 */
function StructureTab() {
  const { addVolume } = useDocumentStore();
  const { currentProject } = useProjectStore();

  const handleAddVolume = async () => {
    if (currentProject) {
      await addVolume(currentProject.id);
    }
  };

  const terminology = currentProject?.terminology || {
    volume: '권',
    chapter: '화',
    scene: '씬',
  };

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-3 flex flex-shrink-0 items-center justify-between">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          문서 구조
        </span>
        <button
          onClick={handleAddVolume}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          title={`${terminology.volume} 추가`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* 트리 뷰 */}
      <div className="flex-1 overflow-y-auto">
        <TreeView />
      </div>
    </div>
  );
}

/**
 * 설정 탭 - 프로젝트 설정
 */
function SettingsTab() {
  const { openModal } = useUIStore();

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="space-y-4">
        {/* 프로젝트 설정 */}
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            프로젝트
          </h3>
          <button
            onClick={() => openModal('project-settings')}
            className="w-full rounded border border-border bg-card px-3 py-2 text-left text-sm hover:bg-accent"
          >
            프로젝트 설정
          </button>
        </section>

        {/* 내보내기 */}
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            내보내기
          </h3>
          <button
            onClick={() => openModal('export')}
            className="w-full rounded border border-border bg-card px-3 py-2 text-left text-sm hover:bg-accent"
          >
            내보내기
          </button>
        </section>
      </div>
    </div>
  );
}
