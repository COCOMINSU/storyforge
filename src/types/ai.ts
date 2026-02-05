/**
 * AI 관련 타입 정의
 *
 * Phase 2: AI 보조작가 기능
 * AI 모델: Claude (Anthropic), GPT (OpenAI), Gemini (Google)
 *
 * 이 파일은 AI 대화, 맥락 관리, 줄거리/인물 설정 등
 * AI 관련 모든 기능에 필요한 타입을 정의합니다.
 */

// ============================================
// AI 제공자 및 모델
// ============================================

/**
 * 지원하는 AI 제공자
 */
export type AIProvider = 'anthropic' | 'openai' | 'google';

/**
 * 지원하는 Claude AI 모델 (2025년 11월 기준)
 */
export type ClaudeModel =
  | 'claude-opus-4-5-20251101'    // 최고 성능
  | 'claude-sonnet-4-5-20250929'  // 가성비
  | 'claude-haiku-4-5-20251022';  // 저렴

/**
 * 지원하는 OpenAI GPT 모델 (2025년 8월 기준)
 */
export type GPTModel =
  | 'gpt-5'       // 최고 성능
  | 'gpt-5-mini'  // 가성비
  | 'gpt-5-nano'; // 저렴

/**
 * 지원하는 Google Gemini 모델 (2025년 말 기준)
 */
export type GeminiModel =
  | 'gemini-3-pro'          // 최고 성능
  | 'gemini-2.5-pro'        // 가성비
  | 'gemini-2.5-flash-lite'; // 저렴

/**
 * 모든 지원 모델
 */
export type AIModel = ClaudeModel | GPTModel | GeminiModel;

/**
 * AI 서비스 설정
 *
 * temperature: 창의성 조절 (0.0 ~ 1.0)
 *   - 0.0: 일관된 응답 (사실 기반 작업)
 *   - 0.7: 적당한 창의성 (기본값, 창작 보조)
 *   - 1.0: 높은 창의성 (아이디어 발상)
 */
export interface AIConfig {
  /** AI 제공자 */
  provider: AIProvider;

  /** 사용할 AI 모델 */
  model: AIModel;

  /** 창의성 수준 (0.0 ~ 1.0, 기본 0.7) */
  temperature: number;

  /** 응답 최대 토큰 수 */
  maxTokens: number;

  /** 스트리밍 응답 활성화 여부 */
  streamEnabled: boolean;
}

/**
 * 제공자별 API 키 설정
 */
export interface AIAPIKeys {
  /** Anthropic (Claude) API 키 */
  anthropic?: string;

  /** OpenAI (GPT) API 키 */
  openai?: string;

  /** Google (Gemini) API 키 */
  google?: string;
}

/**
 * API 키 설정 (레거시 호환성)
 */
export interface AIAPIConfig {
  /** AI 제공자 */
  provider: AIProvider;

  /** API 키 */
  apiKey: string;
}

// ============================================
// 대화 메시지
// ============================================

/**
 * 메시지 역할
 *
 * - user: 사용자(작가)의 메시지
 * - assistant: AI(Claude)의 응답
 * - system: 시스템 지시사항 (맥락, 규칙 등)
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 메시지 상태
 *
 * UI에서 메시지 표시 방식을 결정합니다.
 */
export type MessageStatus =
  | 'sending'      // 전송 중 (로딩 표시)
  | 'streaming'    // 스트리밍 수신 중 (타이핑 효과)
  | 'complete'     // 완료
  | 'error';       // 오류 발생

/**
 * 대화 메시지
 *
 * 사용자-AI 간 주고받는 개별 메시지입니다.
 */
export interface ChatMessage {
  /** 고유 식별자 (UUID) */
  id: string;

  /** 메시지 역할 */
  role: MessageRole;

  /** 메시지 내용 */
  content: string;

  /** 현재 상태 */
  status: MessageStatus;

  // 메타데이터
  /** 메시지 생성 시각 */
  timestamp: Date;

  /** 이 메시지에 사용된 토큰 수 (추정치) */
  tokenCount?: number;

  // AI 응답 관련 (assistant 역할일 때)
  /** 응답 생성에 사용된 모델 */
  model?: AIModel;

  /** 응답 종료 이유 */
  stopReason?: 'end_turn' | 'max_tokens' | 'stop_sequence';

  // 액션 관련 (AI가 제안한 액션)
  /** AI가 제안한 실행 가능한 액션 목록 */
  suggestedActions?: SuggestedAction[];

  // 에러 정보
  /** 오류 발생 시 상세 정보 */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * AI가 제안한 액션
 *
 * AI 응답에서 추출된 실행 가능한 액션입니다.
 * 사용자가 버튼 클릭으로 적용할 수 있습니다.
 */
export interface SuggestedAction {
  /** 고유 식별자 */
  id: string;

  /** 액션 타입 */
  type: ActionType;

  /** 버튼에 표시될 텍스트 (예: "캐릭터 생성하기") */
  label: string;

  /** 액션 실행에 필요한 데이터 */
  data: Record<string, unknown>;

  /** 이미 적용되었는지 여부 */
  applied: boolean;
}

/**
 * 지원되는 액션 타입
 */
export type ActionType =
  | 'create_character'        // 인물 카드 생성
  | 'update_character'        // 인물 카드 수정
  | 'create_location'         // 장소 카드 생성
  | 'create_item'             // 아이템 카드 생성
  | 'update_synopsis'         // 시놉시스 업데이트
  | 'create_chapter_outline'  // 화별 줄거리 생성
  | 'apply_to_editor'         // 에디터에 텍스트 삽입
  | 'save_to_notes';          // 메모로 저장

// ============================================
// 대화 세션
// ============================================

/**
 * 대화 세션 타입
 *
 * 세션 타입에 따라 시스템 프롬프트와 UI가 달라집니다.
 */
export type ConversationType =
  | 'general'           // 일반 대화 (자유 주제)
  | 'plot_setting'      // 줄거리 설정 (단계별 가이드)
  | 'character_setting' // 인물 설정 (캐릭터 생성/수정)
  | 'writing_assist'    // 글쓰기 보조 (현재 씬 관련)
  | 'world_building';   // 세계관 구축

/**
 * 대화 세션
 *
 * 하나의 대화 흐름을 나타냅니다.
 * 프로젝트별로 여러 세션을 가질 수 있습니다.
 */
export interface ChatSession {
  /** 고유 식별자 */
  id: string;

  /** 소속 프로젝트 ID */
  projectId: string;

  /** 세션 타입 */
  type: ConversationType;

  /** 세션 제목 (AI가 자동 생성하거나 사용자 지정) */
  title: string;

  /** 세션에 포함된 메시지들 */
  messages: ChatMessage[];

  /** 사용량 통계 */
  stats: {
    /** 총 메시지 수 */
    messageCount: number;
    /** 총 사용 토큰 수 */
    totalTokens: number;
    /** 예상 비용 (USD) */
    estimatedCost: number;
  };

  /** 세션 생성 시각 */
  createdAt: Date;

  /** 마지막 수정 시각 */
  updatedAt: Date;
}

// ============================================
// 맥락 관리
// ============================================

/**
 * AI에게 전달되는 프로젝트 맥락
 *
 * AI가 작품의 맥락을 이해하고 일관된 응답을 생성하기 위해
 * 시스템 프롬프트에 포함되는 정보입니다.
 */
export interface ProjectContext {
  /** 프로젝트 기본 정보 */
  projectInfo: {
    /** 작품 제목 */
    title: string;
    /** 작품 설명 */
    description: string;
    /** 장르 목록 */
    genre: string[];
    /** 목표 플랫폼 (문피아, 카카오페이지 등) */
    targetPlatform?: string;
    /** 목표 글자수 (화당) */
    targetLength?: number;
  };

  /** 현재 작업 위치 (작가가 어디를 편집 중인지) */
  currentPosition?: {
    volumeTitle: string;
    chapterTitle: string;
    sceneTitle: string;
  };

  /** 요약된 줄거리 (전체 스토리 개요) */
  synopsis?: string;

  /** 주요 등장인물 목록 (요약 형태) */
  mainCharacters: CharacterSummary[];

  /** 최근 내용 요약 (이전 화들의 요약) */
  recentSummary?: string;

  /** 현재 편집 중인 씬의 내용 (일부) */
  currentContent?: string;
}

/**
 * 인물 요약 (맥락용)
 *
 * AI에게 전달하기 위한 간략한 인물 정보입니다.
 * 전체 CharacterCard보다 가볍습니다.
 */
export interface CharacterSummary {
  /** 이름 */
  name: string;

  /** 역할 (주인공, 히로인, 조연, 악역 등) */
  role: string;

  /** 한 줄 설명 */
  description: string;

  /** 현재 상태 (부상, 감정 등 - 스토리 진행에 따라 변화) */
  currentState?: string;
}

/**
 * 맥락 토큰 예산
 *
 * Claude의 컨텍스트 윈도우를 효율적으로 사용하기 위한
 * 토큰 할당 계획입니다.
 */
export interface ContextBudget {
  /** 전체 예산 (모델별 컨텍스트 한도의 일부) */
  total: number;

  /** 시스템 프롬프트용 예산 */
  system: number;

  /** 프로젝트 맥락용 예산 */
  context: number;

  /** 대화 히스토리용 예산 */
  history: number;

  /** 응답 여유분 (max_tokens) */
  response: number;
}

// ============================================
// AI Agent 전체 컨텍스트 (Phase 3)
// ============================================

/**
 * AI Agent 모드용 전체 프로젝트 컨텍스트
 *
 * AI가 작품 전체를 파악하고 자동 업데이트를 수행하기 위해
 * 필요한 모든 정보를 포함합니다.
 */
export interface FullProjectContext {
  /** 프로젝트 기본 정보 */
  projectInfo: {
    id: string;
    title: string;
    description: string;
    genre: string[];
    targetPlatform?: string;
    targetLength?: number;
  };

  /** 시놉시스 / 전체 줄거리 */
  synopsis?: string;

  /** 지금까지 집필된 이야기 요약 */
  storySummary?: string;

  /** 모든 캐릭터 상세 정보 */
  allCharacters: CharacterDetailContext[];

  /** 캐릭터 간 관계 */
  characterRelationships: RelationshipContext[];

  /** 모든 장소 정보 */
  allLocations: LocationContext[];

  /** 활성 복선 (미해결) */
  activeForeshadowing: ForeshadowingContext[];

  /** 최근 회차 요약 */
  recentChapterSummaries: ChapterSummaryContext[];

  /** 통계 메타데이터 */
  metadata: {
    totalCharCount: number;
    totalChapterCount: number;
    totalSceneCount: number;
    lastUpdatedAt: Date;
  };
}

/**
 * 캐릭터 상세 컨텍스트
 */
export interface CharacterDetailContext {
  id: string;
  name: string;
  role: string;
  age?: string;
  gender?: string;
  occupation?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  currentState?: string;
}

/**
 * 관계 컨텍스트
 */
export interface RelationshipContext {
  character1Name: string;
  character2Name: string;
  relationshipType: string;
  description?: string;
}

/**
 * 장소 컨텍스트
 */
export interface LocationContext {
  id: string;
  name: string;
  description?: string;
  significance?: string;
}

/**
 * 복선 컨텍스트
 */
export interface ForeshadowingContext {
  id: string;
  description: string;
  introducedAt: string;
  plannedResolution?: string;
}

/**
 * 회차 요약 컨텍스트
 */
export interface ChapterSummaryContext {
  volumeNumber: number;
  chapterNumber: number;
  title: string;
  summary: string;
  keyEvents?: string[];
}

// ============================================
// AI 응답 자동 업데이트 (Phase 4)
// ============================================

/**
 * StoryForge 자동 업데이트 블록 타입
 *
 * AI 응답에 포함된 JSON 블록으로, 자동으로 데이터 업데이트를 수행합니다.
 */
export type StoryforgeUpdateType =
  | 'create_character'
  | 'update_character'
  | 'create_location'
  | 'update_location'
  | 'update_synopsis'
  | 'create_chapter_outline'
  | 'add_foreshadowing'
  | 'resolve_foreshadowing';

/**
 * StoryForge 자동 업데이트 블록
 */
export interface StoryforgeUpdate {
  type: StoryforgeUpdateType;
  data: Record<string, unknown>;
}

/**
 * AI 응답 파싱 결과
 */
export interface ParsedAgentResponse {
  /** 표시할 텍스트 (JSON 블록 제거됨) */
  displayText: string;

  /** 추출된 업데이트 블록들 */
  updates: StoryforgeUpdate[];
}

// ============================================
// 줄거리 설정
// ============================================

/**
 * 줄거리 설정 단계
 *
 * AI와의 대화를 통해 순차적으로 줄거리를 구체화합니다.
 */
export type PlotSettingStep =
  | 'genre_selection'     // 1. 장르 선택
  | 'premise'             // 2. 기본 전제 (한 줄 소개)
  | 'main_character'      // 3. 주인공 설정
  | 'conflict'            // 4. 갈등 요소
  | 'world_setting'       // 5. 세계관
  | 'plot_structure'      // 6. 플롯 구조 (기-승-전-결)
  | 'chapter_outline'     // 7. 화별 줄거리
  | 'review';             // 8. 검토 및 확정

/**
 * 줄거리 설정 상태
 *
 * 줄거리 설정 세션의 진행 상황과 수집된 데이터입니다.
 */
export interface PlotSettingState {
  /** 현재 단계 */
  currentStep: PlotSettingStep;

  /** 완료된 단계 목록 */
  completedSteps: PlotSettingStep[];

  /** 수집된 정보 */
  data: {
    /** 선택된 장르 */
    genre?: string[];

    /** 기본 전제 (로그라인) */
    premise?: string;

    /** 주인공 정보 */
    mainCharacter?: Partial<CharacterSummary>;

    /** 핵심 갈등 */
    conflict?: string;

    /** 세계관 설명 */
    worldSetting?: string;

    /** 플롯 구조 */
    plotStructure?: {
      beginning: string;   // 도입부
      middle: string;      // 전개부
      end: string;         // 결말부
    };

    /** 화별 줄거리 목록 */
    chapterOutlines?: Array<{
      volumeNumber: number;
      chapterNumber: number;
      title: string;
      summary: string;
    }>;
  };
}

// ============================================
// 인물 설정
// ============================================

/**
 * 인물 설정 단계
 *
 * AI와의 대화를 통해 단계별로 인물을 구체화합니다.
 */
export type CharacterSettingStep =
  | 'basic_info'          // 1. 기본 정보 (이름, 나이, 역할)
  | 'appearance'          // 2. 외모
  | 'personality'         // 3. 성격
  | 'background'          // 4. 배경 스토리
  | 'motivation'          // 5. 동기/목표
  | 'relationships'       // 6. 다른 인물과의 관계
  | 'abilities'           // 7. 능력 (판타지/SF 장르용)
  | 'arc'                 // 8. 성장 곡선
  | 'review';             // 9. 검토 및 생성

/**
 * 인물 설정 상태
 *
 * 인물 설정 세션의 진행 상황과 수집된 데이터입니다.
 */
export interface CharacterSettingState {
  /** 현재 단계 */
  currentStep: CharacterSettingStep;

  /** 완료된 단계 목록 */
  completedSteps: CharacterSettingStep[];

  /** 수정 대상 캐릭터 ID (기존 캐릭터 수정 시) */
  targetCharacterId?: string;

  /** 수집 중인 데이터 */
  data: Partial<{
    name: string;
    role: string;
    age: string;
    gender: string;
    occupation: string;
    appearance: string;
    personality: string;
    background: string;
    motivation: string;
    relationships: Array<{
      targetName: string;
      type: string;
      description: string;
    }>;
    abilities: Array<{
      name: string;
      description: string;
    }>;
    arc: Array<{
      phase: string;
      change: string;
    }>;
  }>;
}

// ============================================
// 실시간 요약
// ============================================

/**
 * 실시간 요약 패널 데이터
 *
 * 작가와 AI 모두에게 현재 작품 상황을 알려주는 요약 정보입니다.
 */
export interface RealtimeSummary {
  /** 프로젝트 전체 진행상황 */
  progress: {
    currentVolume: number;
    currentChapter: number;
    totalChapters: number;
    completionPercentage: number;
  };

  /** 등장인물 현재 상태 */
  characterStates: Array<{
    characterId: string;
    name: string;
    location?: string;
    condition?: string;       // 건강, 감정 등
    lastAppearance?: string;  // 마지막 등장 위치
  }>;

  /** 최근 화 요약 (AI 참조용) */
  recentChapterSummaries: Array<{
    chapterTitle: string;
    summary: string;
    keyEvents: string[];
  }>;

  /** 활성 복선 */
  activeForeshadowing: Array<{
    id: string;
    description: string;
    introducedAt: string;     // 어디서 소개됐는지
    resolved: boolean;
  }>;

  /** 마지막 업데이트 시각 */
  lastUpdatedAt: Date;
}

// ============================================
// 토큰 및 비용 관리
// ============================================

/**
 * 토큰 사용량 기록
 *
 * 개별 API 호출에 대한 토큰 사용 내역입니다.
 */
export interface TokenUsage {
  /** 고유 식별자 */
  id: string;

  /** 프로젝트 ID */
  projectId: string;

  /** 세션 ID */
  sessionId: string;

  /** 사용된 모델 */
  model: AIModel;

  /** 입력 토큰 수 */
  inputTokens: number;

  /** 출력 토큰 수 */
  outputTokens: number;

  /** 총 토큰 수 */
  totalTokens: number;

  /** 예상 비용 (USD) */
  estimatedCost: number;

  /** 기록 생성 시각 */
  createdAt: Date;
}

/**
 * 일일 사용량 요약
 */
export interface DailyUsageSummary {
  /** 날짜 (YYYY-MM-DD) */
  date: string;

  /** 총 토큰 수 */
  totalTokens: number;

  /** 총 비용 (USD) */
  totalCost: number;

  /** 요청 횟수 */
  requestCount: number;

  /** 모델별 사용량 */
  byModel: Record<AIModel, {
    tokens: number;
    cost: number;
    requests: number;
  }>;
}

/**
 * 사용량 제한 설정
 */
export interface UsageLimits {
  /** 일일 토큰 한도 */
  dailyTokenLimit?: number;

  /** 일일 비용 한도 (USD) */
  dailyCostLimit?: number;

  /** 경고 임계값 (0.0 ~ 1.0, 기본 0.8) */
  warningThreshold: number;
}

// ============================================
// API 응답 타입 (Claude 형식)
// ============================================

/**
 * Claude API 메시지 응답
 *
 * Anthropic API의 messages.create 응답 형식을 따릅니다.
 */
export interface ClaudeMessageResponse {
  /** 응답 ID */
  id: string;

  /** 응답 타입 */
  type: 'message';

  /** 응답 역할 */
  role: 'assistant';

  /** 응답 내용 블록들 */
  content: Array<{
    type: 'text';
    text: string;
  }>;

  /** 사용된 모델 */
  model: string;

  /** 응답 종료 이유 */
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;

  /** 종료 시퀀스 (해당 시) */
  stop_sequence: string | null;

  /** 토큰 사용량 */
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Claude API 스트리밍 이벤트
 */
export interface ClaudeStreamEvent {
  type:
    | 'message_start'
    | 'content_block_start'
    | 'content_block_delta'
    | 'content_block_stop'
    | 'message_delta'
    | 'message_stop';

  // 이벤트별 데이터
  message?: ClaudeMessageResponse;
  index?: number;
  content_block?: {
    type: 'text';
    text: string;
  };
  delta?: {
    type: 'text_delta';
    text: string;
  } | {
    stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
    stop_sequence: string | null;
  };
  usage?: {
    output_tokens: number;
  };
}

/**
 * AI 서비스 에러
 */
export interface AIServiceError {
  /** 에러 타입 */
  type: 'api_error' | 'network_error' | 'rate_limit' | 'invalid_request' | 'auth_error';

  /** 에러 코드 */
  code: string;

  /** 사용자 친화적 메시지 */
  message: string;

  /** 원본 에러 */
  originalError?: unknown;

  /** 재시도 가능 여부 */
  retryable: boolean;

  /** 재시도 권장 대기 시간 (ms) */
  retryAfter?: number;
}
