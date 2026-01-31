/**
 * 프로젝트 관련 타입 정의
 *
 * 프로젝트는 Storyforge에서 하나의 작품을 나타냅니다.
 * 각 프로젝트는 템플릿을 기반으로 생성되며, 권-화-씬 구조를 가집니다.
 */

/**
 * 프로젝트 템플릿 타입
 *
 * 각 템플릿은 서로 다른 기본 구조와 용어를 가집니다:
 * - web-novel: 웹소설 (권-화-씬, 목표 5000자/화)
 * - novel: 장편소설 (부-장-절, 목표 10000자)
 * - short-story: 단편소설 (파트-섹션-씬, 목표 15000자)
 * - screenplay: 시나리오 (에피소드-씬-비트)
 */
export type ProjectTemplate = 'web-novel' | 'novel' | 'short-story' | 'screenplay';

/**
 * 문서 상태
 *
 * 트리 뷰에서 아이콘으로 표시됩니다:
 * - draft: ○ (구상 중)
 * - writing: ✍ (집필 중)
 * - complete: ✔ (탈고)
 * - published: ↑ (업로드 완료)
 */
export type DocumentStatus = 'draft' | 'writing' | 'complete' | 'published';

/**
 * 프로젝트 (작품)
 *
 * 하나의 작품을 나타내며, 여러 Volume을 포함합니다.
 * IndexedDB의 'projects' 테이블에 저장됩니다.
 */
export interface Project {
  /** UUID v4 형식의 고유 식별자 */
  id: string;

  /** 작품 제목 */
  title: string;

  /** 작품 설명 (선택사항) */
  description: string;

  /** 생성 시 선택한 템플릿 타입 */
  template: ProjectTemplate;

  /**
   * 트리 구조 용어 커스터마이징
   *
   * 사용자가 "권/화/씬" 대신 원하는 명칭을 사용할 수 있습니다.
   * 예: { volume: "부", chapter: "장", scene: "절" }
   */
  terminology: {
    volume: string;
    chapter: string;
    scene: string;
  };

  /** 장르 태그 (예: ["판타지", "로맨스"]) */
  genre: string[];

  /** 목표 플랫폼 (문피아, 카카오페이지 등) */
  targetPlatform?: string;

  /** 목표 글자수 (화당) */
  targetLength?: number;

  /**
   * 프로젝트 통계
   *
   * 문서 변경 시 자동으로 재계산됩니다.
   */
  stats: {
    /** 전체 글자수 (공백 제외, 문피아/카카오페이지 기준) */
    totalCharCount: number;
    /** 전체 글자수 (공백 포함, 네이버시리즈 기준) */
    totalCharCountWithSpaces: number;
    /** 권 수 */
    volumeCount: number;
    /** 화 수 */
    chapterCount: number;
    /** 씬 수 */
    sceneCount: number;
  };

  /** 생성 시각 */
  createdAt: Date;

  /** 마지막 수정 시각 */
  updatedAt: Date;

  /** 마지막으로 열어본 시각 (최근 프로젝트 정렬용) */
  lastOpenedAt: Date;

  /** 클라우드 동기화 활성화 여부 */
  syncEnabled: boolean;

  /** 마지막 동기화 시각 */
  lastSyncedAt?: Date;

  /** Supabase user ID (로그인 시) */
  userId?: string;
}

/**
 * 템플릿 설정
 *
 * 새 프로젝트 생성 시 템플릿 선택 다이얼로그에서 사용됩니다.
 */
export interface TemplateConfig {
  /** 표시 이름 (예: "웹소설") */
  name: string;

  /** 템플릿 설명 */
  description: string;

  /** 기본 용어 설정 */
  terminology: Project['terminology'];

  /** 목표 글자수 (화당) */
  targetLength: number;

  /**
   * 초기 구조
   *
   * 프로젝트 생성 시 자동으로 생성되는 Volume/Chapter/Scene 구조
   */
  initialStructure: {
    volumes: Array<{
      title: string;
      chapters: Array<{
        title: string;
        scenes: Array<{ title: string }>;
      }>;
    }>;
  };
}
