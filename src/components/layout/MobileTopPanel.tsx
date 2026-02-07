/**
 * 모바일 상단 슬라이드다운 패널
 *
 * 프로젝트 제목 클릭 시 헤더 아래에서 슬라이드다운
 * 3개 탭: 메뉴 / 구조 / 세계관
 */

import { useState, useEffect } from 'react';
import { useUIStore, useProjectStore } from '@/stores';
import { cn } from '@/lib';
import { StructureTab } from './LeftPanel';
import { WorldCardList } from '@/components/worldbuilding';

type TopPanelTab = 'menu' | 'structure' | 'world';

export function MobileTopPanel() {
  const { isMobileTopPanelOpen, closeMobileTopPanel, openModal } = useUIStore();
  const { currentProject, closeProject, saveCurrentProject } = useProjectStore();
  const [activeTab, setActiveTab] = useState<TopPanelTab>('menu');

  // ESC 키로 닫기 + 배경 스크롤 방지
  useEffect(() => {
    if (!isMobileTopPanelOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileTopPanel();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileTopPanelOpen, closeMobileTopPanel]);

  const handleMenuAction = (action: () => void) => {
    action();
    closeMobileTopPanel();
  };

  const handleSave = async () => {
    if (currentProject) {
      await saveCurrentProject();
    }
    closeMobileTopPanel();
  };

  const handleCloseProject = () => {
    if (currentProject) {
      closeProject();
    }
    closeMobileTopPanel();
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/50 transition-opacity duration-300',
          isMobileTopPanelOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeMobileTopPanel}
        aria-hidden="true"
      />

      {/* 슬라이드다운 패널 */}
      <div
        className={cn(
          'fixed left-0 right-0 z-40 bg-sidebar shadow-xl transition-all duration-300 ease-out',
          isMobileTopPanelOpen
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        )}
        style={{ top: '3rem' }}
      >
        {/* 탭 버튼 */}
        <div className="flex border-b border-border">
          {([
            { id: 'menu' as TopPanelTab, label: '메뉴', icon: MenuIcon },
            { id: 'structure' as TopPanelTab, label: '구조', icon: FolderIcon },
            { id: 'world' as TopPanelTab, label: '세계관', icon: GlobeIcon },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        <div className="max-h-[70vh] overflow-y-auto">
          {activeTab === 'menu' && (
            <div className="py-1">
              <MenuButton
                icon={<PlusIcon />}
                label="새 프로젝트"
                onClick={() => handleMenuAction(() => openModal('new-project'))}
              />
              <MenuButton
                icon={<FolderOpenIcon />}
                label="프로젝트 열기"
                onClick={() => handleMenuAction(() => openModal('project-list'))}
              />
              <MenuButton
                icon={<SaveIcon />}
                label="저장"
                shortcut="Ctrl+S"
                disabled={!currentProject}
                onClick={handleSave}
              />
              <div className="my-1 border-t border-border" />
              <MenuButton
                icon={<SettingsIcon />}
                label="프로젝트 설정"
                disabled={!currentProject}
                onClick={() => handleMenuAction(() => openModal('project-settings'))}
              />
              <MenuButton
                icon={<ExportIcon />}
                label="내보내기"
                disabled={!currentProject}
                onClick={() => handleMenuAction(() => openModal('export'))}
              />
              <div className="my-1 border-t border-border" />
              <MenuButton
                icon={<XIcon />}
                label="프로젝트 닫기"
                disabled={!currentProject}
                destructive
                onClick={handleCloseProject}
              />
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="h-[60vh]">
              <StructureTab />
            </div>
          )}

          {activeTab === 'world' && (
            <div className="h-[60vh]">
              <WorldCardList />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// 메뉴 버튼 컴포넌트
function MenuButton({
  icon,
  label,
  shortcut,
  disabled,
  destructive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-between px-4 py-3 text-sm active:bg-accent',
        disabled && 'cursor-not-allowed opacity-50',
        destructive && 'text-destructive'
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {shortcut && (
        <span className="text-xs text-muted-foreground">{shortcut}</span>
      )}
    </button>
  );
}

// 아이콘 컴포넌트들
const MenuIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const FolderIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const FolderOpenIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ExportIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const XIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
