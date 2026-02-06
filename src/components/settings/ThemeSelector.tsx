/**
 * 테마 선택 컴포넌트
 *
 * 모든 테마를 카테고리별로 보여주고 선택할 수 있습니다.
 */

import { useUIStore } from '@/stores';
import { themesByCategory, type ThemeInfo } from '@/lib';
import type { ThemeId } from '@/types';
import { cn } from '@/lib';

interface ThemeSelectorProps {
  /** 컴팩트 모드 (드롭다운용) */
  compact?: boolean;
  /** 테마 변경 시 콜백 */
  onThemeChange?: (theme: ThemeId) => void;
}

/**
 * 테마 미리보기 색상 블록
 */
function ThemePreview({ theme }: { theme: ThemeInfo }) {
  // 테마별 대표 색상 (하드코딩)
  const previewColors: Record<string, { bg: string; accent: string; text: string }> = {
    'dark-default': { bg: '#0f172a', accent: '#f8fafc', text: '#94a3b8' },
    'dark-midnight': { bg: '#09090b', accent: '#fafafa', text: '#a1a1aa' },
    'dark-forest': { bg: '#052e16', accent: '#22c55e', text: '#86efac' },
    'dark-purple': { bg: '#1e1b4b', accent: '#a855f7', text: '#c4b5fd' },
    'light-default': { bg: '#ffffff', accent: '#1e293b', text: '#64748b' },
    'light-lavender': { bg: '#f5f3ff', accent: '#8b5cf6', text: '#6b21a8' },
    'light-mint': { bg: '#ecfdf5', accent: '#10b981', text: '#047857' },
    // 바다: 밝고 화사한 하늘색, 선명한 바다색, 산호색
    'season-ocean': { bg: '#d6f5ff', accent: '#00b8e6', text: '#ff9966' },
    // 크리스마스: 새하얀 눈, 빨간 포인트, 초록 악센트
    'season-christmas': { bg: '#f5faf5', accent: '#e53935', text: '#2e7d32' },
  };

  const colors = previewColors[theme.id] || previewColors['dark-default'];

  return (
    <div
      className="flex h-8 w-12 overflow-hidden rounded border border-border"
      style={{ backgroundColor: colors.bg }}
    >
      <div className="flex-1" />
      <div
        className="w-3"
        style={{ backgroundColor: colors.accent }}
      />
      <div
        className="w-2"
        style={{ backgroundColor: colors.text }}
      />
    </div>
  );
}

/**
 * 테마 버튼
 */
function ThemeButton({
  theme,
  isActive,
  onClick,
  compact,
}: {
  theme: ThemeInfo;
  isActive: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg border transition-all',
        compact ? 'p-2' : 'p-3',
        isActive
          ? 'border-primary bg-primary/10'
          : 'border-transparent hover:border-border hover:bg-muted/50'
      )}
    >
      <ThemePreview theme={theme} />
      <div className="flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{theme.name}</span>
          {theme.emoji && <span className="text-sm">{theme.emoji}</span>}
        </div>
        {!compact && (
          <p className="text-xs text-muted-foreground">{theme.description}</p>
        )}
      </div>
      {isActive && (
        <svg
          className="h-4 w-4 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * 카테고리 섹션
 */
function CategorySection({
  title,
  themes,
  currentTheme,
  onSelect,
  compact,
}: {
  title: string;
  themes: ThemeInfo[];
  currentTheme: ThemeId;
  onSelect: (theme: ThemeId) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase text-muted-foreground">
        {title}
      </h3>
      <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-2')}>
        {themes.map((theme) => (
          <ThemeButton
            key={theme.id}
            theme={theme}
            isActive={currentTheme === theme.id}
            onClick={() => onSelect(theme.id)}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 테마 선택기
 */
export function ThemeSelector({ compact, onThemeChange }: ThemeSelectorProps) {
  const { theme, setTheme } = useUIStore();

  const handleSelect = (themeId: ThemeId) => {
    setTheme(themeId);
    onThemeChange?.(themeId);
  };

  return (
    <div className="space-y-4">
      {/* 시스템 테마 */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase text-muted-foreground">
          자동
        </h3>
        <button
          onClick={() => handleSelect('system')}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg border p-3 transition-all',
            theme === 'system'
              ? 'border-primary bg-primary/10'
              : 'border-transparent hover:border-border hover:bg-muted/50'
          )}
        >
          <div className="flex h-8 w-12 items-center justify-center rounded border border-border bg-gradient-to-r from-background to-foreground/10">
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-medium">시스템 설정</span>
            {!compact && (
              <p className="text-xs text-muted-foreground">
                기기 설정에 따라 자동 전환
              </p>
            )}
          </div>
          {theme === 'system' && (
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* 다크 테마 */}
      <CategorySection
        title="다크"
        themes={themesByCategory.dark}
        currentTheme={theme}
        onSelect={handleSelect}
        compact={compact}
      />

      {/* 라이트 테마 */}
      <CategorySection
        title="라이트 (파스텔)"
        themes={themesByCategory.light}
        currentTheme={theme}
        onSelect={handleSelect}
        compact={compact}
      />

      {/* 시즌 테마 */}
      <CategorySection
        title="시즌"
        themes={themesByCategory.season}
        currentTheme={theme}
        onSelect={handleSelect}
        compact={compact}
      />
    </div>
  );
}

export default ThemeSelector;
