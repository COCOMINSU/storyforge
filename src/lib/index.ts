/**
 * 유틸리티 함수 모음
 *
 * 모든 유틸리티 함수를 중앙에서 re-export합니다.
 * 다른 모듈에서는 '@/lib'에서 직접 import할 수 있습니다.
 *
 * @example
 * import { cn, generateId, countCharacters } from '@/lib';
 */

// Tailwind 클래스 병합
export { cn } from './cn';

// 글자수 계산
export {
  countCharacters,
  countCharactersForStats,
  extractPlainText,
  formatCharCount,
  calculateProgress,
} from './charCount';

// 날짜 포맷팅
export {
  formatRelativeTime,
  formatDate,
  formatShortDate,
  formatVersionTimestamp,
  toISOString,
  isSameDay,
} from './dateUtils';

// ID 생성
export { generateId, isValidId, shortId } from './id';

// 범용 유틸리티
export {
  sleep,
  debounce,
  throttle,
  deepClone,
  deepEqual,
  unique,
  groupBy,
  reorder,
  isEmpty,
  truncate,
  formatFileSize,
  parseShortcut,
  matchesShortcut,
  formatShortcut,
} from './utils';

// 내보내기
export {
  exportToJSON,
  exportToTXT,
  exportToZIP,
  exportVolumeToTXT,
  exportChapterToTXT,
  downloadFile,
  downloadBlob,
  sanitizeFilename,
} from './export';

// Supabase
export {
  supabase,
  isSupabaseConfigured,
  checkSupabaseConnection,
} from './supabase';

// 테마
export {
  themes,
  themeList,
  themesByCategory,
  getTheme,
  isThemeDark,
  themeToCSSVariables,
  type ThemeInfo,
  type ThemeColors,
  type ThemeDefinition,
} from './themes';
