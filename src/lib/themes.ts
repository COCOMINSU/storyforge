/**
 * 테마 정의
 *
 * StoryForge의 모든 테마를 정의합니다.
 * CSS 변수 값은 HSL 형식 (색조 채도% 명도%)입니다.
 */

import type { ThemeId } from '@/types';

/**
 * 테마 정보
 */
export interface ThemeInfo {
  id: ThemeId;
  name: string;
  description: string;
  category: 'dark' | 'light' | 'season' | 'system';
  isDark: boolean;
  emoji?: string;
}

/**
 * 테마 CSS 변수
 */
export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // 사이드바 (추가)
  sidebar?: string;
  sidebarForeground?: string;
}

/**
 * 전체 테마 정의
 */
export interface ThemeDefinition extends ThemeInfo {
  colors: ThemeColors;
}

// ============================================
// 다크 테마
// ============================================

const darkDefault: ThemeDefinition = {
  id: 'dark-default',
  name: '기본 다크',
  description: '기본 어두운 테마',
  category: 'dark',
  isDark: true,
  emoji: '🌙',
  colors: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    popover: '222.2 84% 4.9%',
    popoverForeground: '210 40% 98%',
    primary: '210 40% 98%',
    primaryForeground: '222.2 47.4% 11.2%',
    secondary: '217.2 32.6% 17.5%',
    secondaryForeground: '210 40% 98%',
    muted: '217.2 32.6% 17.5%',
    mutedForeground: '215 20.2% 65.1%',
    accent: '217.2 32.6% 17.5%',
    accentForeground: '210 40% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '210 40% 98%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '212.7 26.8% 83.9%',
  },
};

const darkMidnight: ThemeDefinition = {
  id: 'dark-midnight',
  name: '미드나잇',
  description: '깊은 자정의 어둠',
  category: 'dark',
  isDark: true,
  emoji: '🌑',
  colors: {
    background: '240 10% 3.9%',
    foreground: '0 0% 98%',
    card: '240 10% 3.9%',
    cardForeground: '0 0% 98%',
    popover: '240 10% 5%',
    popoverForeground: '0 0% 98%',
    primary: '0 0% 98%',
    primaryForeground: '240 5.9% 10%',
    secondary: '240 3.7% 15.9%',
    secondaryForeground: '0 0% 98%',
    muted: '240 3.7% 15.9%',
    mutedForeground: '240 5% 64.9%',
    accent: '240 3.7% 15.9%',
    accentForeground: '0 0% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '0 0% 98%',
    border: '240 3.7% 15.9%',
    input: '240 3.7% 15.9%',
    ring: '240 4.9% 83.9%',
  },
};

const darkForest: ThemeDefinition = {
  id: 'dark-forest',
  name: '포레스트',
  description: '깊은 숲속의 고요함',
  category: 'dark',
  isDark: true,
  emoji: '🌲',
  colors: {
    background: '150 30% 5%',
    foreground: '138 40% 95%',
    card: '150 25% 7%',
    cardForeground: '138 40% 95%',
    popover: '150 25% 7%',
    popoverForeground: '138 40% 95%',
    primary: '142 70% 45%',
    primaryForeground: '0 0% 100%', // 흰색으로 변경 (대비 향상)
    secondary: '150 20% 15%',
    secondaryForeground: '138 40% 95%',
    muted: '150 20% 15%',
    mutedForeground: '150 15% 60%',
    accent: '150 25% 18%',
    accentForeground: '138 40% 95%',
    destructive: '0 62.8% 35%',
    destructiveForeground: '0 0% 100%',
    border: '150 20% 15%',
    input: '150 20% 15%',
    ring: '142 50% 50%',
  },
};

const darkPurple: ThemeDefinition = {
  id: 'dark-purple',
  name: '퍼플 나잇',
  description: '신비로운 보라빛 밤',
  category: 'dark',
  isDark: true,
  emoji: '🔮',
  colors: {
    background: '270 50% 5%',
    foreground: '270 20% 95%',
    card: '270 45% 7%',
    cardForeground: '270 20% 95%',
    popover: '270 45% 7%',
    popoverForeground: '270 20% 95%',
    primary: '280 70% 60%',
    primaryForeground: '0 0% 100%', // 흰색으로 변경 (대비 향상)
    secondary: '270 30% 15%',
    secondaryForeground: '270 20% 95%',
    muted: '270 30% 15%',
    mutedForeground: '270 15% 60%',
    accent: '280 40% 20%',
    accentForeground: '270 20% 95%',
    destructive: '0 62.8% 35%',
    destructiveForeground: '0 0% 100%',
    border: '270 30% 15%',
    input: '270 30% 15%',
    ring: '280 60% 60%',
  },
};

// ============================================
// 라이트 테마 (파스텔)
// ============================================

const lightDefault: ThemeDefinition = {
  id: 'light-default',
  name: '기본 라이트',
  description: '깔끔한 기본 라이트 테마',
  category: 'light',
  isDark: false,
  emoji: '☀️',
  colors: {
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    popover: '0 0% 100%',
    popoverForeground: '222.2 84% 4.9%',
    primary: '222.2 47.4% 11.2%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    secondaryForeground: '222.2 47.4% 11.2%',
    muted: '210 40% 96.1%',
    mutedForeground: '215.4 16.3% 46.9%',
    accent: '210 40% 96.1%',
    accentForeground: '222.2 47.4% 11.2%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '210 40% 98%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '222.2 84% 4.9%',
  },
};

const lightLavender: ThemeDefinition = {
  id: 'light-lavender',
  name: '라벤더',
  description: '부드러운 파스텔 보라',
  category: 'light',
  isDark: false,
  emoji: '💜',
  colors: {
    background: '270 50% 98%',
    foreground: '270 50% 15%',
    card: '270 40% 99%',
    cardForeground: '270 50% 15%',
    popover: '270 40% 99%',
    popoverForeground: '270 50% 15%',
    primary: '270 60% 50%',
    primaryForeground: '270 50% 98%',
    secondary: '270 30% 93%',
    secondaryForeground: '270 50% 15%',
    muted: '270 30% 93%',
    mutedForeground: '270 20% 45%',
    accent: '280 40% 90%',
    accentForeground: '270 50% 15%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 100%',
    border: '270 25% 88%',
    input: '270 25% 88%',
    ring: '270 60% 50%',
  },
};

const lightMint: ThemeDefinition = {
  id: 'light-mint',
  name: '민트',
  description: '상쾌한 파스텔 민트',
  category: 'light',
  isDark: false,
  emoji: '🌿',
  colors: {
    background: '160 50% 97%',
    foreground: '160 50% 10%',
    card: '160 40% 99%',
    cardForeground: '160 50% 10%',
    popover: '160 40% 99%',
    popoverForeground: '160 50% 10%',
    primary: '160 70% 40%',
    primaryForeground: '160 50% 97%',
    secondary: '160 30% 92%',
    secondaryForeground: '160 50% 10%',
    muted: '160 30% 92%',
    mutedForeground: '160 20% 40%',
    accent: '150 40% 88%',
    accentForeground: '160 50% 10%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 100%',
    border: '160 25% 85%',
    input: '160 25% 85%',
    ring: '160 70% 40%',
  },
};

// ============================================
// 시즌 테마
// ============================================

const seasonOcean: ThemeDefinition = {
  id: 'season-ocean',
  name: '바다',
  description: '여름 해변의 푸른 하늘과 바다',
  category: 'season',
  isDark: false,
  emoji: '🏖️',
  colors: {
    // 거의 흰색 배경 (패턴이 잘 보이도록)
    background: '200 30% 98%',
    foreground: '210 80% 25%',
    // 카드는 하얀 구름/모래 느낌
    card: '200 20% 99%',
    cardForeground: '210 80% 25%',
    popover: '0 0% 100%',
    popoverForeground: '210 80% 25%',
    // 생생한 바다색 primary
    primary: '197 100% 45%',
    primaryForeground: '0 0% 100%',
    // secondary는 연한 하늘색 (AI 메시지 배경)
    secondary: '197 60% 90%',
    secondaryForeground: '210 80% 20%',
    // muted는 연한 파랑
    muted: '197 40% 92%',
    mutedForeground: '210 50% 35%',
    // 산호색 악센트
    accent: '25 100% 70%',
    accentForeground: '210 80% 20%',
    destructive: '0 85% 60%',
    destructiveForeground: '0 0% 100%',
    border: '197 40% 85%',
    input: '197 30% 93%',
    ring: '197 100% 47%',
    // 사이드바도 거의 흰색
    sidebar: '200 30% 98%',
    sidebarForeground: '210 80% 25%',
  },
};

const seasonChristmas: ThemeDefinition = {
  id: 'season-christmas',
  name: '크리스마스',
  description: '따뜻한 겨울 밤의 버건디 & 앰버',
  category: 'season',
  isDark: true,
  emoji: '🎅',
  colors: {
    // 따뜻한 다크 버건디-블랙 배경
    background: '350 25% 6%',
    foreground: '30 30% 92%',
    // 카드 - 약간 밝은 마룬
    card: '350 20% 10%',
    cardForeground: '30 30% 92%',
    popover: '350 18% 11%',
    popoverForeground: '30 30% 92%',
    // 따뜻한 앰버 primary (창문 불빛)
    primary: '28 80% 55%',
    primaryForeground: '350 30% 6%',
    // 어두운 따뜻한 표면
    secondary: '350 18% 13%',
    secondaryForeground: '30 30% 92%',
    // muted
    muted: '350 15% 12%',
    mutedForeground: '350 10% 50%',
    // 딥 크림슨/베리 레드 악센트
    accent: '355 60% 38%',
    accentForeground: '30 30% 92%',
    destructive: '0 65% 45%',
    destructiveForeground: '0 0% 100%',
    border: '350 18% 15%',
    input: '350 15% 12%',
    // 앰버 링
    ring: '28 80% 55%',
    sidebar: '350 25% 5%',
    sidebarForeground: '30 30% 92%',
  },
};

// ============================================
// 테마 내보내기
// ============================================

/**
 * 모든 테마 정의
 */
export const themes: Record<Exclude<ThemeId, 'system'>, ThemeDefinition> = {
  'dark-default': darkDefault,
  'dark-midnight': darkMidnight,
  'dark-forest': darkForest,
  'dark-purple': darkPurple,
  'light-default': lightDefault,
  'light-lavender': lightLavender,
  'light-mint': lightMint,
  'season-ocean': seasonOcean,
  'season-christmas': seasonChristmas,
};

/**
 * 테마 목록 (UI 표시용)
 */
export const themeList: ThemeInfo[] = Object.values(themes);

/**
 * 카테고리별 테마 그룹
 */
export const themesByCategory = {
  dark: themeList.filter((t) => t.category === 'dark'),
  light: themeList.filter((t) => t.category === 'light'),
  season: themeList.filter((t) => t.category === 'season'),
};

/**
 * 테마 ID로 테마 정보 가져오기
 */
export function getTheme(themeId: ThemeId): ThemeDefinition | undefined {
  if (themeId === 'system') return undefined;
  return themes[themeId];
}

/**
 * 테마가 다크 모드인지 확인
 */
export function isThemeDark(themeId: ThemeId): boolean {
  if (themeId === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // 기본값
  }
  return themes[themeId]?.isDark ?? true;
}

/**
 * 테마 CSS 변수를 CSS 문자열로 변환
 */
export function themeToCSSVariables(theme: ThemeDefinition): string {
  const { colors } = theme;
  return `
    --background: ${colors.background};
    --foreground: ${colors.foreground};
    --card: ${colors.card};
    --card-foreground: ${colors.cardForeground};
    --popover: ${colors.popover};
    --popover-foreground: ${colors.popoverForeground};
    --primary: ${colors.primary};
    --primary-foreground: ${colors.primaryForeground};
    --secondary: ${colors.secondary};
    --secondary-foreground: ${colors.secondaryForeground};
    --muted: ${colors.muted};
    --muted-foreground: ${colors.mutedForeground};
    --accent: ${colors.accent};
    --accent-foreground: ${colors.accentForeground};
    --destructive: ${colors.destructive};
    --destructive-foreground: ${colors.destructiveForeground};
    --border: ${colors.border};
    --input: ${colors.input};
    --ring: ${colors.ring};
    ${colors.sidebar ? `--sidebar: ${colors.sidebar};` : ''}
    ${colors.sidebarForeground ? `--sidebar-foreground: ${colors.sidebarForeground};` : ''}
  `.trim();
}

export default themes;
