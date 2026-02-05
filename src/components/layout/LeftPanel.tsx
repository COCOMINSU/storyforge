/**
 * 좌측 패널
 *
 * 두 개의 탭으로 구성:
 * - 구조(structure): 문서 트리 뷰
 * - 세계관(world): 인물, 장소, 아이템 카드
 *
 * 프로젝트 헤더에 드롭다운 메뉴:
 * - 새 프로젝트, 열기, 저장, 내보내기, 프로젝트 설정
 */

import { useState, useRef, useEffect } from 'react';
import { useUIStore, useProjectStore, useDocumentStore } from '@/stores';
import { cn } from '@/lib';
import { TreeView } from '@/components/tree';
import { WorldCardList } from '@/components/worldbuilding';
import { UserMenu } from '@/components/auth';

// 아이콘
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

const ChevronDownIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const FolderOpenIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
    />
  </svg>
);

const SaveIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
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

const ExportIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

const XIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export function LeftPanel() {
  const { leftPanelTab, setLeftPanelTab, openModal } = useUIStore();
  const { currentProject, closeProject, saveCurrentProject } = useProjectStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키보드 단축키 (Ctrl+S 저장)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentProject]);

  const handleSave = async () => {
    if (currentProject) {
      await saveCurrentProject();
      // 토스트 알림은 saveCurrentProject 내부에서 처리
    }
  };

  const handleCloseProject = () => {
    if (currentProject) {
      closeProject();
    }
    setShowMenu(false);
  };

  const handleMenuAction = (action: () => void) => {
    action();
    setShowMenu(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* 프로젝트 헤더 */}
      <div className="flex items-center justify-between border-b border-border p-3">
        {/* 프로젝트 메뉴 */}
        <div className="relative flex-1" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-sm font-semibold text-foreground hover:bg-accent"
          >
            <span className="truncate max-w-[140px]">
              {currentProject?.title || '프로젝트'}
            </span>
            <ChevronDownIcon />
          </button>

          {/* 드롭다운 메뉴 */}
          {showMenu && (
            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover py-1 shadow-lg">
              {/* 새 프로젝트 */}
              <button
                onClick={() => handleMenuAction(() => openModal('new-project'))}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent"
              >
                <PlusIcon />
                <span>새 프로젝트</span>
              </button>

              {/* 프로젝트 열기 */}
              <button
                onClick={() => handleMenuAction(() => openModal('project-list'))}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent"
              >
                <FolderOpenIcon />
                <span>프로젝트 열기</span>
              </button>

              {/* 저장 */}
              <button
                onClick={() => handleMenuAction(handleSave)}
                disabled={!currentProject}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <SaveIcon />
                  <span>저장</span>
                </div>
                <span className="text-xs text-muted-foreground">Ctrl+S</span>
              </button>

              {/* 구분선 */}
              <div className="my-1 border-t border-border" />

              {/* 프로젝트 설정 */}
              <button
                onClick={() => handleMenuAction(() => openModal('project-settings'))}
                disabled={!currentProject}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SettingsIcon />
                <span>프로젝트 설정</span>
              </button>

              {/* 내보내기 */}
              <button
                onClick={() => handleMenuAction(() => openModal('export'))}
                disabled={!currentProject}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExportIcon />
                <span>내보내기</span>
              </button>

              {/* 구분선 */}
              <div className="my-1 border-t border-border" />

              {/* 프로젝트 닫기 */}
              <button
                onClick={handleCloseProject}
                disabled={!currentProject}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XIcon />
                <span>프로젝트 닫기</span>
              </button>
            </div>
          )}
        </div>

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
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        {leftPanelTab === 'structure' && <StructureTab />}
        {leftPanelTab === 'world' && <WorldCardList />}
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
          <PlusIcon />
        </button>
      </div>

      {/* 트리 뷰 */}
      <div className="flex-1 overflow-y-auto">
        <TreeView />
      </div>
    </div>
  );
}
