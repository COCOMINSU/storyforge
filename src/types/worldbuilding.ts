/**
 * 세계관 관련 타입 정의
 *
 * 세계관 카드는 인물, 장소, 아이템 정보를 관리합니다.
 * 각 카드는 프로젝트에 종속되며, 이미지를 첨부할 수 있습니다.
 */

/**
 * 카드 타입
 */
export type CardType = 'character' | 'location' | 'item';

/**
 * 인물 역할
 *
 * 트리 뷰나 인물 목록에서 정렬/필터링에 사용됩니다.
 */
export type CharacterRole =
  | 'protagonist' // 주인공
  | 'antagonist' // 악역
  | 'supporting' // 조연
  | 'minor'; // 단역

/**
 * 세계관 카드 기본 타입
 *
 * 모든 카드 타입의 공통 필드를 정의합니다.
 */
export interface WorldCardBase {
  /** UUID v4 형식의 고유 식별자 */
  id: string;

  /** 소속 프로젝트 ID */
  projectId: string;

  /** 카드 타입 */
  type: CardType;

  /** 이름 (필수) */
  name: string;

  /** 설명 */
  description: string;

  /**
   * 이미지 URL
   *
   * Base64 데이터 URL 형식으로 저장됩니다.
   * 예: "data:image/png;base64,iVBORw0KGgo..."
   *
   * 최대 2MB, 400x400px로 리사이즈됩니다.
   */
  imageUrl?: string;

  /** 태그 (검색 및 필터링용) */
  tags: string[];

  /** 생성 시각 */
  createdAt: Date;

  /** 마지막 수정 시각 */
  updatedAt: Date;
}

/**
 * 인물 카드
 *
 * 등장인물의 상세 정보를 관리합니다.
 * IndexedDB의 'characters' 테이블에 저장됩니다.
 */
export interface CharacterCard extends WorldCardBase {
  type: 'character';

  /** 기본 정보 */
  basicInfo: {
    /** 나이 (문자열: "20대 초반" 등 자유 형식 가능) */
    age?: string;
    /** 성별 */
    gender?: string;
    /** 직업/역할 */
    occupation?: string;
    /** 별명 목록 */
    nickname?: string[];
  };

  /** 외모 */
  appearance: {
    /** 키 */
    height?: string;
    /** 체형 */
    bodyType?: string;
    /** 머리색 */
    hairColor?: string;
    /** 눈 색 */
    eyeColor?: string;
    /** 특징적인 외모 (흉터, 문신 등) */
    distinguishingFeatures?: string;
  };

  /** 성격 설명 */
  personality: string;

  /** 배경 스토리 */
  background: string;

  /** 동기/목표 */
  motivation: string;

  /**
   * 능력/스킬 (판타지/무협 작품용)
   */
  abilities?: Array<{
    /** 능력 이름 */
    name: string;
    /** 능력 설명 */
    description: string;
    /** 능력 수준 (예: "A급", "9성") */
    level?: string;
  }>;

  /**
   * 다른 인물과의 관계
   */
  relationships: Array<{
    /** 대상 인물 ID */
    targetId: string;
    /** 대상 인물 이름 (빠른 조회용) */
    targetName: string;
    /** 관계 유형 (친구, 적, 연인, 가족 등) */
    relationType: string;
    /** 관계 설명 */
    description?: string;
  }>;

  /**
   * 성장/변화 아크 (스포일러 주의)
   *
   * 캐릭터의 시점별 변화를 기록합니다.
   */
  arc?: Array<{
    /** 시점 (예: "1권", "중반부") */
    phase: string;
    /** 변화 내용 */
    change: string;
  }>;

  /** 역할 (주인공, 악역, 조연, 단역) */
  role: CharacterRole;

  /** 첫 등장 (예: "1권 3화") */
  firstAppearance?: string;
}

/**
 * 장소 카드
 *
 * 스토리에 등장하는 장소 정보를 관리합니다.
 * IndexedDB의 'locations' 테이블에 저장됩니다.
 */
export interface LocationCard extends WorldCardBase {
  type: 'location';

  /** 장소 유형 (도시, 던전, 학교, 카페 등) */
  locationType: string;

  /** 지역/국가 */
  region?: string;

  /** 장소의 특징 */
  features: string;

  /** 분위기 */
  atmosphere: string;

  /** 스토리상 의미/중요성 */
  significance: string;

  /** 관련 인물 ID 목록 */
  relatedCharacters?: string[];

  /** 관련 사건 */
  relatedEvents?: string;
}

/**
 * 아이템 카드
 *
 * 스토리에 등장하는 아이템 정보를 관리합니다.
 * IndexedDB의 'items' 테이블에 저장됩니다.
 */
export interface ItemCard extends WorldCardBase {
  type: 'item';

  /** 아이템 유형 (무기, 방어구, 소비품, 열쇠 등) */
  itemType: string;

  /** 희귀도 (일반, 희귀, 전설 등) */
  rarity?: string;

  /** 아이템 특성/능력 */
  properties: string;

  /** 출처/역사 */
  origin: string;

  /** 현재 소유자 인물 ID */
  currentOwner?: string;

  /** 스토리상 의미/중요성 */
  significance: string;
}

/**
 * 세계관 카드 통합 타입
 *
 * CharacterCard | LocationCard | ItemCard 중 하나입니다.
 */
export type WorldCard = CharacterCard | LocationCard | ItemCard;

/**
 * 관계 정보 (인물 관계도용)
 */
export interface Relationship {
  /** 출발 인물 ID */
  sourceId: string;
  /** 대상 인물 ID */
  targetId: string;
  /** 대상 인물 이름 */
  targetName: string;
  /** 관계 유형 */
  relationType: string;
  /** 관계 설명 */
  description?: string;
}
