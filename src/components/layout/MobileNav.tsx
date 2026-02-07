/**
 * 모바일 하단 네비게이션 바
 *
 * 모바일 환경에서 하단에 고정되는 탭바
 * - 구조 (챕터 목록)
 * - 세계관 (캐릭터, 장소 등)
 * - AI Agent (AI 대화)
 * - 집필 (에디터)
 * - 설정
 */

import { useUIStore } from '@/stores';
import { cn } from '@/lib';

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  isActive: boolean;
}

export function MobileNav() {
  const {
    appMode,
    setAppMode,
    leftPanelTab,
    isMobileSettingsOpen,
    openMobileDrawer,
    setMobileSettingsOpen,
    closeMobileDrawer,
  } = useUIStore();

  // 현재 활성 뷰 결정
  const activeView = isMobileSettingsOpen ? 'settings' : appMode === 'agent' ? 'agent' : leftPanelTab;

  const navItems: MobileNavItem[] = [
    {
      id: 'structure',
      label: '구조',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      action: () => {
        openMobileDrawer('structure');
      },
      isActive: activeView === 'structure',
    },
    {
      id: 'world',
      label: '세계관',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: () => {
        openMobileDrawer('world');
      },
      isActive: activeView === 'world',
    },
    {
      id: 'agent',
      label: 'AI',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => {
        setAppMode('agent');
        setMobileSettingsOpen(false);
        closeMobileDrawer();
      },
      isActive: activeView === 'agent',
    },
    {
      id: 'writing',
      label: '집필',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      action: () => {
        setAppMode('writing');
        setMobileSettingsOpen(false);
        closeMobileDrawer();
      },
      isActive: appMode === 'writing' && !isMobileSettingsOpen && activeView !== 'agent',
    },
    {
      id: 'settings',
      label: '설정',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: () => {
        setMobileSettingsOpen(true);
      },
      isActive: isMobileSettingsOpen,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-sidebar/95 backdrop-blur-sm safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-lg p-2 transition-colors',
              item.isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default MobileNav;
