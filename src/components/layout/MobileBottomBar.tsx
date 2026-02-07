/**
 * 모바일 하단 바
 *
 * 집필 / AI 두 버튼만 50:50으로 분할
 */

import { useUIStore } from '@/stores';
import { cn } from '@/lib';

export function MobileBottomBar() {
  const { appMode, setAppMode, closeMobileTopPanel, closeMobileUserDropdown } = useUIStore();

  const handleSwitch = (mode: 'writing' | 'agent') => {
    setAppMode(mode);
    closeMobileTopPanel();
    closeMobileUserDropdown();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-sidebar/95 backdrop-blur-sm safe-area-bottom">
      <div className="flex">
        {/* 집필 버튼 */}
        <button
          onClick={() => handleSwitch('writing')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            appMode === 'writing'
              ? 'border-t-2 border-primary bg-primary/5 text-primary'
              : 'text-muted-foreground active:text-foreground'
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          집필
        </button>

        {/* 구분선 */}
        <div className="my-2 w-px bg-border" />

        {/* AI 버튼 */}
        <button
          onClick={() => handleSwitch('agent')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            appMode === 'agent'
              ? 'border-t-2 border-primary bg-primary/5 text-primary'
              : 'text-muted-foreground active:text-foreground'
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          AI
        </button>
      </div>
    </nav>
  );
}
