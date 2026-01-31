/**
 * 공통 타입 정의
 *
 * 여러 모듈에서 공유하는 유틸리티 타입들입니다.
 */

/**
 * 저장 상태 (UI 표시용)
 *
 * 에디터 상태바에서 저장 상태를 표시하는 데 사용됩니다.
 */
export type SaveStatus =
  | 'saved' // ✓ 저장 완료
  | 'saving' // ⟳ 저장 중
  | 'unsaved' // • 변경사항 있음
  | 'error'; // ✗ 저장 실패

/**
 * 동기화 상태
 *
 * 클라우드 동기화 상태를 나타냅니다.
 */
export type SyncStatus =
  | 'synced' // 동기화 완료
  | 'syncing' // 동기화 중
  | 'offline' // 오프라인
  | 'conflict' // 충돌 발생
  | 'error'; // 오류

/**
 * 모달 타입
 *
 * 앱에서 사용하는 모든 모달의 타입을 정의합니다.
 * useUIStore의 activeModal 상태에서 사용됩니다.
 */
export type ModalType =
  | 'new-project' // 새 프로젝트 생성
  | 'project-list' // 프로젝트 목록
  | 'project-settings' // 프로젝트 설정
  | 'export' // 내보내기
  | 'card-editor' // 세계관 카드 편집 (레거시)
  | 'character-card' // 인물 카드 뷰/편집
  | 'location-card' // 장소 카드 뷰/편집
  | 'item-card' // 아이템 카드 뷰/편집
  | 'version-history' // 버전 히스토리
  | 'confirm-delete' // 삭제 확인
  | 'auth' // 로그인/회원가입
  | 'shortcuts' // 키보드 단축키 도움말
  | 'quick-open' // 빠른 열기 (Ctrl+P)
  | 'project-search' // 프로젝트 전체 검색 (Ctrl+Shift+F)
  | 'writing-goal' // 글자수 목표 (Ctrl+Shift+O)
  | 'ai-settings' // AI 설정 (API 키, 모델 선택)
  | null; // 모달 없음

/**
 * 좌측 패널 탭
 */
export type LeftPanelTab = 'structure' | 'world' | 'settings';

/**
 * 테마
 *
 * 다크 모드가 기본값입니다.
 */
export type Theme = 'dark' | 'light' | 'system';

/**
 * 글자수 결과
 *
 * countCharacters() 함수의 반환 타입입니다.
 */
export interface CharCountResult {
  /** 공백 제외 글자수 (문피아/카카오페이지 기준) */
  withoutSpaces: number;
  /** 공백 포함 글자수 (네이버시리즈 기준) */
  withSpaces: number;
}

/**
 * 사용자 (인증)
 *
 * Supabase Auth에서 반환하는 사용자 정보의 부분집합입니다.
 */
export interface User {
  /** Supabase user ID */
  id: string;
  /** 이메일 주소 */
  email: string;
  /** 표시 이름 */
  displayName?: string;
  /** 프로필 이미지 URL */
  avatarUrl?: string;
}

/**
 * 동기화 정보
 *
 * 프로젝트의 동기화 상태를 나타냅니다.
 */
export interface SyncInfo {
  /** 동기화 활성화 여부 */
  enabled: boolean;
  /** 마지막 동기화 시각 */
  lastSyncedAt?: Date;
  /** 대기 중인 변경사항 수 */
  pendingChanges: number;
  /** 현재 상태 */
  status: SyncStatus;
}

/**
 * 키보드 단축키 정의
 */
export interface ShortcutDefinition {
  /** 단축키 조합 (예: "Ctrl+S") */
  key: string;
  /** 설명 */
  description: string;
  /** 실행할 액션 */
  action: () => void;
}

/**
 * 내보내기 옵션
 */
export interface ExportOptions {
  /** 내보내기 형식 */
  format: 'json' | 'zip' | 'txt';
  /** 포함할 범위 */
  scope: 'project' | 'volume' | 'chapter' | 'scene';
  /** 대상 ID (scope가 project가 아닐 때) */
  targetId?: string;
  /** 세계관 카드 포함 여부 (ZIP만 해당) */
  includeWorldbuilding?: boolean;
  /** 이미지 포함 여부 (ZIP만 해당) */
  includeImages?: boolean;
}

/**
 * 가져오기 결과
 */
export interface ImportResult {
  /** 성공 여부 */
  success: boolean;
  /** 생성된 프로젝트 ID */
  projectId?: string;
  /** 오류 메시지 */
  error?: string;
}
