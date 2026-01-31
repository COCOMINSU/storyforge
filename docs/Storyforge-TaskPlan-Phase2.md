# Storyforge Task Plan Phase 2 - AI 통합 상세 작업 명세서

> **문서 버전**: 1.0
> **작성일**: 2026-02-01
> **참조 문서**: `Storyforge-PRD.md`, `Storyforge-PRD-v2.md`, `Storyforge-TaskPlan.md`
> **목적**: AI 보조작가 기능의 체계적 구현을 위한 상세 명세

---

## 문서 사용 가이드

### Phase 2 개요

Phase 2는 Storyforge의 핵심 차별화 기능인 **AI 보조작가**를 구현합니다.
창작자가 AI와 대화하며 줄거리를 설정하고, 인물을 구체화하며, 실시간으로 작품 맥락을 유지할 수 있게 합니다.

### 의존성 다이어그램

```
Phase 1 완료
    │
    ├── TASK-P2-01 (AI 타입 정의)
    │       │
    │       ├── TASK-P2-02 (AI 서비스 기반)
    │       │       │
    │       │       ├── TASK-P2-03 (맥락 관리)
    │       │       │       │
    │       │       │       └── TASK-P2-04 (AI 스토어)
    │       │       │               │
    │       │       │       ┌───────┴───────┐
    │       │       │       │               │
    │       │       │  TASK-P2-05      TASK-P2-06
    │       │       │  (대화창 UI)     (메시지 컴포넌트)
    │       │       │       │               │
    │       │       │       └───────┬───────┘
    │       │       │               │
    │       │       │       TASK-P2-07 (줄거리 설정)
    │       │       │               │
    │       │       │       TASK-P2-08 (인물 설정)
    │       │       │               │
    │       │       │       TASK-P2-09 (실시간 요약)
    │       │       │               │
    │       │       │       TASK-P2-10 (프롬프트 템플릿)
    │       │       │               │
    │       │       │       TASK-P2-11 (스트리밍 응답)
    │       │       │               │
    │       │       │       TASK-P2-12 (토큰/비용 관리)
    │       │       │               │
    │       │       │       TASK-P2-13 (QA 및 최적화)
    │       │       │
    │       │       └── TASK-P2-14 (API 키 관리)
```

---

## Phase 2 핵심 원칙

### AI 통합 철학

> **"AI는 보조자, 작가는 창작자"**

| 원칙 | 설명 |
|------|------|
| 맥락 유지 | AI는 현재 작품의 설정, 인물, 줄거리를 항상 인지 |
| 작가 중심 | 모든 AI 제안은 작가의 승인을 거쳐 반영 |
| 투명성 | AI 사용량과 비용을 명확히 표시 |
| 오프라인 대비 | AI 불가시에도 기본 기능은 정상 작동 |

### 기술 선택

| 항목 | 선택 | 이유 |
|------|------|------|
| AI 모델 | OpenAI GPT-4 / GPT-3.5 | 한국어 성능, API 안정성, 비용 효율 |
| 스트리밍 | Server-Sent Events | 실시간 응답 표시 |
| 맥락 관리 | 슬라이딩 윈도우 + 요약 | 토큰 효율성 |
| 상태 관리 | Zustand | 기존 패턴 유지 |

---

## Week 1: AI 기반 구축

---

### TASK-P2-01: AI 관련 TypeScript 타입 정의

**전체 맥락에서의 목적**:
AI 기능에 필요한 모든 데이터 구조를 TypeScript 타입으로 정의합니다. 대화 메시지, AI 설정, 맥락 데이터, 응답 구조 등을 포함합니다.

**의존성**: Phase 1 완료

**산출물**:
- `src/types/ai.ts`
- `src/types/index.ts` (업데이트)

#### 구현 요구사항

**1. AI 타입 정의** (`src/types/ai.ts`)

```typescript
/**
 * AI 관련 타입 정의
 * Phase 2: AI 보조작가 기능
 */

// ============================================
// AI 설정 및 모델
// ============================================

/**
 * 지원하는 AI 모델
 */
export type AIModel =
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo';

/**
 * AI 서비스 설정
 */
export interface AIConfig {
  model: AIModel;
  temperature: number;        // 0.0 ~ 2.0, 기본 0.7
  maxTokens: number;          // 응답 최대 토큰
  streamEnabled: boolean;     // 스트리밍 활성화
}

/**
 * API 키 설정
 */
export interface AIAPIConfig {
  provider: 'openai';
  apiKey: string;
  organizationId?: string;
}

// ============================================
// 대화 메시지
// ============================================

/**
 * 메시지 역할
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 메시지 상태
 */
export type MessageStatus =
  | 'sending'      // 전송 중
  | 'streaming'    // 스트리밍 수신 중
  | 'complete'     // 완료
  | 'error';       // 오류

/**
 * 대화 메시지
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;

  // 메타데이터
  timestamp: Date;
  tokenCount?: number;        // 토큰 사용량

  // AI 응답 관련
  model?: AIModel;            // 사용된 모델
  finishReason?: 'stop' | 'length' | 'content_filter';

  // 액션 관련 (AI가 제안한 액션)
  suggestedActions?: SuggestedAction[];

  // 에러 정보
  error?: {
    code: string;
    message: string;
  };
}

/**
 * AI가 제안한 액션
 */
export interface SuggestedAction {
  id: string;
  type: ActionType;
  label: string;              // 버튼에 표시될 텍스트
  data: Record<string, unknown>;  // 액션 실행에 필요한 데이터
  applied: boolean;           // 적용 여부
}

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
 */
export type ConversationType =
  | 'general'           // 일반 대화
  | 'plot_setting'      // 줄거리 설정
  | 'character_setting' // 인물 설정
  | 'writing_assist'    // 글쓰기 보조
  | 'world_building';   // 세계관 구축

/**
 * 대화 세션
 */
export interface ChatSession {
  id: string;
  projectId: string;
  type: ConversationType;
  title: string;              // 세션 제목

  messages: ChatMessage[];

  // 통계
  stats: {
    messageCount: number;
    totalTokens: number;
    estimatedCost: number;    // USD
  };

  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// 맥락 관리
// ============================================

/**
 * AI에게 전달되는 프로젝트 맥락
 */
export interface ProjectContext {
  // 프로젝트 기본 정보
  projectInfo: {
    title: string;
    description: string;
    genre: string[];
    targetPlatform?: string;
    targetLength?: number;
  };

  // 현재 작업 위치
  currentPosition?: {
    volumeTitle: string;
    chapterTitle: string;
    sceneTitle: string;
  };

  // 요약된 줄거리
  synopsis?: string;

  // 주요 등장인물 (요약)
  mainCharacters: CharacterSummary[];

  // 최근 내용 요약
  recentSummary?: string;

  // 현재 씬 내용 (일부)
  currentContent?: string;
}

/**
 * 인물 요약 (맥락용)
 */
export interface CharacterSummary {
  name: string;
  role: string;               // 주인공, 조연 등
  description: string;        // 한 줄 설명
  currentState?: string;      // 현재 상태 (부상, 감정 등)
}

/**
 * 맥락 토큰 예산
 */
export interface ContextBudget {
  total: number;              // 전체 예산
  system: number;             // 시스템 프롬프트
  context: number;            // 프로젝트 맥락
  history: number;            // 대화 히스토리
  response: number;           // 응답 여유분
}

// ============================================
// 줄거리 설정
// ============================================

/**
 * 줄거리 설정 단계
 */
export type PlotSettingStep =
  | 'genre_selection'     // 장르 선택
  | 'premise'             // 기본 전제
  | 'main_character'      // 주인공 설정
  | 'conflict'            // 갈등 요소
  | 'world_setting'       // 세계관
  | 'plot_structure'      // 플롯 구조
  | 'chapter_outline'     // 화별 줄거리
  | 'review';             // 검토 및 확정

/**
 * 줄거리 설정 상태
 */
export interface PlotSettingState {
  currentStep: PlotSettingStep;
  completedSteps: PlotSettingStep[];

  // 수집된 정보
  data: {
    genre?: string[];
    premise?: string;
    mainCharacter?: Partial<CharacterSummary>;
    conflict?: string;
    worldSetting?: string;
    plotStructure?: {
      beginning: string;
      middle: string;
      end: string;
    };
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
 */
export type CharacterSettingStep =
  | 'basic_info'          // 기본 정보
  | 'appearance'          // 외모
  | 'personality'         // 성격
  | 'background'          // 배경
  | 'motivation'          // 동기
  | 'relationships'       // 관계
  | 'abilities'           // 능력 (장르에 따라)
  | 'arc'                 // 성장 곡선
  | 'review';             // 검토 및 생성

/**
 * 인물 설정 상태
 */
export interface CharacterSettingState {
  currentStep: CharacterSettingStep;
  completedSteps: CharacterSettingStep[];
  targetCharacterId?: string;   // 기존 캐릭터 수정시

  // 수집 중인 데이터
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
 */
export interface RealtimeSummary {
  // 프로젝트 전체 진행상황
  progress: {
    currentVolume: number;
    currentChapter: number;
    totalChapters: number;
    completionPercentage: number;
  };

  // 등장인물 현재 상태
  characterStates: Array<{
    characterId: string;
    name: string;
    location?: string;
    condition?: string;       // 건강, 감정 등
    lastAppearance?: string;  // 마지막 등장 위치
  }>;

  // 최근 화 요약 (AI 참조용)
  recentChapterSummaries: Array<{
    chapterTitle: string;
    summary: string;
    keyEvents: string[];
  }>;

  // 활성 복선
  activeForeshadowing: Array<{
    id: string;
    description: string;
    introducedAt: string;     // 어디서 소개됐는지
    resolved: boolean;
  }>;

  // 마지막 업데이트
  lastUpdatedAt: Date;
}

// ============================================
// 토큰 및 비용 관리
// ============================================

/**
 * 토큰 사용량 기록
 */
export interface TokenUsage {
  id: string;
  projectId: string;
  sessionId: string;

  model: AIModel;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  estimatedCost: number;      // USD

  createdAt: Date;
}

/**
 * 일일 사용량 요약
 */
export interface DailyUsageSummary {
  date: string;               // YYYY-MM-DD
  totalTokens: number;
  totalCost: number;
  requestCount: number;
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
  dailyTokenLimit?: number;
  dailyCostLimit?: number;    // USD
  warningThreshold: number;   // 0.0 ~ 1.0, 기본 0.8
}

// ============================================
// API 응답 타입
// ============================================

/**
 * OpenAI Chat Completion 응답 (간소화)
 */
export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 스트리밍 청크
 */
export interface StreamChunk {
  id: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
  }>;
}
```

**2. 타입 인덱스 업데이트** (`src/types/index.ts`)

```typescript
// 기존 export 유지
export * from './project';
export * from './document';
export * from './worldbuilding';
export * from './common';

// Phase 2: AI 타입 추가
export * from './ai';
```

#### 완료 조건

- [ ] `src/types/ai.ts` 파일 생성 완료
- [ ] TypeScript 컴파일 오류 없음
- [ ] `import type { ChatMessage, AIConfig } from '@/types'` 형태로 import 가능
- [ ] 모든 타입에 JSDoc 주석 포함

#### 테스트 시나리오

```typescript
import type {
  ChatMessage,
  ChatSession,
  ProjectContext,
  PlotSettingState
} from '@/types';

// 타입 사용 테스트
const message: ChatMessage = {
  id: 'test-1',
  role: 'user',
  content: '주인공 이름을 정해줘',
  status: 'complete',
  timestamp: new Date(),
};

// IDE 자동완성 동작 확인
```

---

### TASK-P2-02: AI 서비스 기반 구현

**전체 맥락에서의 목적**:
OpenAI API와 통신하는 기본 서비스를 구현합니다. API 호출, 에러 핸들링, 스트리밍 기반을 구축합니다.

**의존성**: TASK-P2-01

**산출물**:
- `src/services/ai/openaiClient.ts`
- `src/services/ai/index.ts`

#### 구현 요구사항

**1. OpenAI 클라이언트** (`src/services/ai/openaiClient.ts`)

```typescript
/**
 * OpenAI API 클라이언트
 *
 * 기능:
 * - Chat Completion API 호출
 * - 스트리밍 응답 처리
 * - 에러 핸들링 및 재시도
 * - 토큰 사용량 추적
 */

import type {
  AIConfig,
  AIModel,
  ChatMessage,
  ChatCompletionResponse,
  StreamChunk,
  TokenUsage
} from '@/types';
import { generateId } from '@/lib/id';

// API 엔드포인트
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// 모델별 토큰 비용 (USD per 1K tokens, 2024년 기준)
const TOKEN_COSTS: Record<AIModel, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
};

// 기본 설정
const DEFAULT_CONFIG: AIConfig = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  streamEnabled: true,
};

/**
 * OpenAI API 에러 타입
 */
export class OpenAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

/**
 * API 키 가져오기
 * localStorage에서 암호화된 키를 가져옴
 */
function getAPIKey(): string {
  const key = localStorage.getItem('storyforge-openai-key');
  if (!key) {
    throw new OpenAIError('API 키가 설정되지 않았습니다.', 'NO_API_KEY');
  }
  // 실제로는 암호화/복호화 로직 필요
  return key;
}

/**
 * 메시지를 OpenAI 형식으로 변환
 */
function formatMessages(
  messages: ChatMessage[],
  systemPrompt?: string
): Array<{ role: string; content: string }> {
  const formatted: Array<{ role: string; content: string }> = [];

  if (systemPrompt) {
    formatted.push({ role: 'system', content: systemPrompt });
  }

  for (const msg of messages) {
    if (msg.status === 'complete' || msg.status === 'streaming') {
      formatted.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  return formatted;
}

/**
 * 토큰 비용 계산
 */
export function calculateCost(
  model: AIModel,
  promptTokens: number,
  completionTokens: number
): number {
  const costs = TOKEN_COSTS[model];
  const inputCost = (promptTokens / 1000) * costs.input;
  const outputCost = (completionTokens / 1000) * costs.output;
  return inputCost + outputCost;
}

/**
 * Chat Completion API 호출 (일반)
 */
export async function chatCompletion(
  messages: ChatMessage[],
  systemPrompt?: string,
  config: Partial<AIConfig> = {}
): Promise<{
  message: ChatMessage;
  usage: TokenUsage;
}> {
  const apiKey = getAPIKey();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const formattedMessages = formatMessages(messages, systemPrompt);

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: finalConfig.model,
      messages: formattedMessages,
      temperature: finalConfig.temperature,
      max_tokens: finalConfig.maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new OpenAIError(
      error.error?.message || 'API 요청 실패',
      error.error?.code || 'API_ERROR',
      response.status
    );
  }

  const data: ChatCompletionResponse = await response.json();
  const choice = data.choices[0];

  const assistantMessage: ChatMessage = {
    id: generateId(),
    role: 'assistant',
    content: choice.message.content,
    status: 'complete',
    timestamp: new Date(),
    model: finalConfig.model,
    finishReason: choice.finish_reason,
    tokenCount: data.usage.completion_tokens,
  };

  const usage: TokenUsage = {
    id: generateId(),
    projectId: '', // 호출자가 설정
    sessionId: '', // 호출자가 설정
    model: finalConfig.model,
    promptTokens: data.usage.prompt_tokens,
    completionTokens: data.usage.completion_tokens,
    totalTokens: data.usage.total_tokens,
    estimatedCost: calculateCost(
      finalConfig.model,
      data.usage.prompt_tokens,
      data.usage.completion_tokens
    ),
    createdAt: new Date(),
  };

  return { message: assistantMessage, usage };
}

/**
 * 스트리밍 Chat Completion
 *
 * @param onChunk - 각 청크 수신시 호출되는 콜백
 * @param onComplete - 완료시 호출되는 콜백
 * @param onError - 에러 발생시 호출되는 콜백
 */
export async function chatCompletionStream(
  messages: ChatMessage[],
  systemPrompt: string | undefined,
  config: Partial<AIConfig>,
  callbacks: {
    onChunk: (content: string) => void;
    onComplete: (message: ChatMessage) => void;
    onError: (error: OpenAIError) => void;
  }
): Promise<AbortController> {
  const apiKey = getAPIKey();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const formattedMessages = formatMessages(messages, systemPrompt);

  const abortController = new AbortController();

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: finalConfig.model,
        messages: formattedMessages,
        temperature: finalConfig.temperature,
        max_tokens: finalConfig.maxTokens,
        stream: true,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new OpenAIError(
        error.error?.message || 'API 요청 실패',
        error.error?.code || 'API_ERROR',
        response.status
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new OpenAIError('스트림을 읽을 수 없습니다.', 'STREAM_ERROR');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let finishReason: ChatMessage['finishReason'];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line === 'data: [DONE]') continue;
        if (!line.startsWith('data: ')) continue;

        try {
          const json: StreamChunk = JSON.parse(line.slice(6));
          const delta = json.choices[0]?.delta?.content;

          if (delta) {
            fullContent += delta;
            callbacks.onChunk(delta);
          }

          if (json.choices[0]?.finish_reason) {
            finishReason = json.choices[0].finish_reason;
          }
        } catch {
          // 파싱 에러 무시
        }
      }
    }

    const completeMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: fullContent,
      status: 'complete',
      timestamp: new Date(),
      model: finalConfig.model,
      finishReason,
    };

    callbacks.onComplete(completeMessage);
  } catch (error) {
    if (error instanceof OpenAIError) {
      callbacks.onError(error);
    } else if ((error as Error).name === 'AbortError') {
      // 사용자가 취소함
      callbacks.onError(new OpenAIError('요청이 취소되었습니다.', 'ABORTED'));
    } else {
      callbacks.onError(new OpenAIError(
        (error as Error).message,
        'UNKNOWN_ERROR'
      ));
    }
  }

  return abortController;
}

/**
 * API 키 유효성 검사
 */
export async function validateAPIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

**2. AI 서비스 인덱스** (`src/services/ai/index.ts`)

```typescript
export {
  chatCompletion,
  chatCompletionStream,
  validateAPIKey,
  calculateCost,
  OpenAIError,
} from './openaiClient';
```

#### 완료 조건

- [ ] OpenAI API 호출 정상 동작
- [ ] 스트리밍 응답 처리 가능
- [ ] 에러 핸들링 동작 (API 키 없음, 네트워크 오류 등)
- [ ] TypeScript 컴파일 오류 없음

#### 테스트 시나리오

```typescript
// API 키 유효성 검사 테스트
const isValid = await validateAPIKey('sk-...');
console.log('API Key Valid:', isValid);

// 일반 응답 테스트
const { message, usage } = await chatCompletion(
  [{ id: '1', role: 'user', content: '안녕', status: 'complete', timestamp: new Date() }],
  '당신은 친절한 AI 비서입니다.',
  { model: 'gpt-3.5-turbo' }
);
console.log('Response:', message.content);
console.log('Tokens:', usage.totalTokens);
```

---

### TASK-P2-03: 맥락 관리 서비스 구현

**전체 맥락에서의 목적**:
AI가 작품의 맥락을 이해할 수 있도록 프로젝트 정보, 인물 정보, 최근 내용을 수집하고 토큰 예산 내에서 최적화합니다.

**의존성**: TASK-P2-01, TASK-P2-02

**산출물**:
- `src/services/ai/contextManager.ts`

#### 구현 요구사항

```typescript
/**
 * 맥락 관리 서비스
 *
 * 기능:
 * - 프로젝트 정보 수집 및 요약
 * - 인물 정보 요약
 * - 최근 내용 추출
 * - 토큰 예산 관리
 */

import { db } from '@/db';
import type {
  ProjectContext,
  CharacterSummary,
  ContextBudget,
  CharacterCard,
  Project,
  Scene,
  Volume,
  Chapter
} from '@/types';

// 기본 토큰 예산 (GPT-4 기준 8K 컨텍스트)
const DEFAULT_BUDGET: ContextBudget = {
  total: 6000,        // 전체 예산 (응답 여유분 제외)
  system: 500,        // 시스템 프롬프트
  context: 2000,      // 프로젝트 맥락
  history: 2500,      // 대화 히스토리
  response: 1000,     // 응답 예약
};

/**
 * 토큰 수 추정 (간단한 휴리스틱)
 * 한국어는 대략 1.5~2 토큰/글자
 */
export function estimateTokens(text: string): number {
  // 한글: 대략 2토큰/글자, 영어: 대략 0.25토큰/단어
  const koreanChars = (text.match(/[가-힣]/g) || []).length;
  const otherChars = text.length - koreanChars;
  return Math.ceil(koreanChars * 2 + otherChars * 0.5);
}

/**
 * 텍스트를 토큰 예산 내로 자르기
 */
export function truncateToTokenBudget(text: string, budget: number): string {
  const estimated = estimateTokens(text);
  if (estimated <= budget) return text;

  // 대략적인 비율로 자르기
  const ratio = budget / estimated;
  const targetLength = Math.floor(text.length * ratio * 0.9); // 10% 여유
  return text.slice(0, targetLength) + '...';
}

/**
 * 인물 카드를 요약 형식으로 변환
 */
function summarizeCharacter(char: CharacterCard): CharacterSummary {
  const roleLabels = {
    protagonist: '주인공',
    antagonist: '악역',
    supporting: '조연',
    minor: '단역',
  };

  let description = '';
  if (char.basicInfo.age) description += `${char.basicInfo.age}, `;
  if (char.basicInfo.occupation) description += `${char.basicInfo.occupation}, `;
  if (char.personality) description += char.personality.slice(0, 50);

  return {
    name: char.name,
    role: roleLabels[char.role] || char.role,
    description: description.trim().replace(/,\s*$/, '') || char.description.slice(0, 100),
  };
}

/**
 * 프로젝트 맥락 수집
 */
export async function buildProjectContext(
  projectId: string,
  currentSceneId?: string,
  budget: ContextBudget = DEFAULT_BUDGET
): Promise<ProjectContext> {
  // 프로젝트 정보 가져오기
  const project = await db.projects.get(projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');

  // 모든 인물 카드 가져오기
  const characters = await db.characters
    .where('projectId')
    .equals(projectId)
    .toArray();

  // 주요 인물만 (주인공, 악역, 조연)
  const mainCharacters = characters
    .filter(c => c.role !== 'minor')
    .slice(0, 10) // 최대 10명
    .map(summarizeCharacter);

  // 현재 위치 정보
  let currentPosition: ProjectContext['currentPosition'];
  let currentContent: string | undefined;

  if (currentSceneId) {
    const scene = await db.scenes.get(currentSceneId);
    if (scene) {
      const chapter = await db.chapters.get(scene.chapterId);
      const volume = chapter ? await db.volumes.get(chapter.volumeId) : null;

      currentPosition = {
        volumeTitle: volume?.title || '',
        chapterTitle: chapter?.title || '',
        sceneTitle: scene.title,
      };

      // 현재 씬 내용 (일부)
      currentContent = truncateToTokenBudget(
        scene.plainText,
        Math.floor(budget.context * 0.3)
      );
    }
  }

  // 맥락 조립
  const context: ProjectContext = {
    projectInfo: {
      title: project.title,
      description: project.description,
      genre: project.genre,
      targetPlatform: project.targetPlatform,
      targetLength: project.targetLength,
    },
    currentPosition,
    mainCharacters,
    currentContent,
  };

  return context;
}

/**
 * 맥락을 시스템 프롬프트로 포맷팅
 */
export function formatContextAsSystemPrompt(context: ProjectContext): string {
  const parts: string[] = [];

  // 프로젝트 정보
  parts.push(`## 작품 정보`);
  parts.push(`- 제목: ${context.projectInfo.title}`);
  if (context.projectInfo.description) {
    parts.push(`- 설명: ${context.projectInfo.description}`);
  }
  if (context.projectInfo.genre.length > 0) {
    parts.push(`- 장르: ${context.projectInfo.genre.join(', ')}`);
  }
  if (context.projectInfo.targetLength) {
    parts.push(`- 목표 분량: ${context.projectInfo.targetLength}자/화`);
  }

  // 현재 위치
  if (context.currentPosition) {
    parts.push('');
    parts.push(`## 현재 작업 위치`);
    parts.push(`${context.currentPosition.volumeTitle} > ${context.currentPosition.chapterTitle} > ${context.currentPosition.sceneTitle}`);
  }

  // 주요 등장인물
  if (context.mainCharacters.length > 0) {
    parts.push('');
    parts.push(`## 주요 등장인물`);
    for (const char of context.mainCharacters) {
      parts.push(`- **${char.name}** (${char.role}): ${char.description}`);
    }
  }

  // 시놉시스
  if (context.synopsis) {
    parts.push('');
    parts.push(`## 줄거리 요약`);
    parts.push(context.synopsis);
  }

  // 최근 내용
  if (context.currentContent) {
    parts.push('');
    parts.push(`## 현재 씬 내용`);
    parts.push(context.currentContent);
  }

  return parts.join('\n');
}

/**
 * 대화 히스토리 토큰 최적화
 * 오래된 메시지부터 제거하여 예산 내로 맞춤
 */
export function optimizeHistoryForTokenBudget(
  messages: Array<{ role: string; content: string }>,
  budget: number
): Array<{ role: string; content: string }> {
  let totalTokens = 0;
  const optimized: Array<{ role: string; content: string }> = [];

  // 최신 메시지부터 추가
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const tokens = estimateTokens(msg.content);

    if (totalTokens + tokens > budget) {
      // 예산 초과, 여기서 중단
      break;
    }

    optimized.unshift(msg);
    totalTokens += tokens;
  }

  return optimized;
}

/**
 * 프로젝트의 최근 요약 생성 (AI 호출 없이 단순 추출)
 */
export async function getRecentContentSummary(
  projectId: string,
  limit: number = 3
): Promise<string> {
  // 최근 수정된 씬 가져오기
  const recentScenes = await db.scenes
    .where('projectId')
    .equals(projectId)
    .reverse()
    .sortBy('updatedAt');

  const scenes = recentScenes.slice(0, limit);

  if (scenes.length === 0) {
    return '아직 작성된 내용이 없습니다.';
  }

  const summaries: string[] = [];

  for (const scene of scenes) {
    const chapter = await db.chapters.get(scene.chapterId);
    const preview = scene.plainText.slice(0, 200);
    summaries.push(`[${chapter?.title || ''}/${scene.title}] ${preview}...`);
  }

  return summaries.join('\n\n');
}
```

#### 완료 조건

- [ ] 프로젝트 맥락 수집 정상 동작
- [ ] 토큰 예산 내 최적화 동작
- [ ] 시스템 프롬프트 포맷팅 정상
- [ ] TypeScript 컴파일 오류 없음

---

### TASK-P2-04: AI Zustand 스토어 구현

**전체 맥락에서의 목적**:
AI 대화 상태, 세션 관리, 사용량 추적을 담당하는 Zustand 스토어를 구현합니다.

**의존성**: TASK-P2-01, TASK-P2-02, TASK-P2-03

**산출물**:
- `src/stores/useAIStore.ts`
- `src/stores/index.ts` (업데이트)

#### 구현 요구사항

```typescript
/**
 * AI 스토어
 *
 * 관리 항목:
 * - 현재 대화 세션
 * - 메시지 목록
 * - 스트리밍 상태
 * - 토큰 사용량
 * - AI 설정
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '@/db';
import { generateId } from '@/lib/id';
import {
  chatCompletion,
  chatCompletionStream,
  OpenAIError
} from '@/services/ai';
import {
  buildProjectContext,
  formatContextAsSystemPrompt
} from '@/services/ai/contextManager';
import type {
  ChatMessage,
  ChatSession,
  ConversationType,
  AIConfig,
  AIModel,
  TokenUsage,
  UsageLimits,
  PlotSettingState,
  CharacterSettingState,
} from '@/types';

interface AIState {
  // 현재 세션
  currentSession: ChatSession | null;
  sessions: Map<string, ChatSession>;

  // 메시지 상태
  isGenerating: boolean;
  streamingContent: string;
  abortController: AbortController | null;

  // AI 설정
  config: AIConfig;
  apiKeySet: boolean;

  // 사용량
  todayUsage: {
    tokens: number;
    cost: number;
    requests: number;
  };
  usageLimits: UsageLimits;

  // 특수 모드 상태
  plotSettingState: PlotSettingState | null;
  characterSettingState: CharacterSettingState | null;

  // 액션 - 세션 관리
  createSession: (projectId: string, type: ConversationType) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  closeSession: () => void;
  deleteSession: (sessionId: string) => Promise<void>;

  // 액션 - 메시지
  sendMessage: (content: string, projectId: string, sceneId?: string) => Promise<void>;
  cancelGeneration: () => void;
  clearMessages: () => void;

  // 액션 - 설정
  setConfig: (config: Partial<AIConfig>) => void;
  setAPIKey: (key: string) => Promise<boolean>;
  clearAPIKey: () => void;
  setUsageLimits: (limits: Partial<UsageLimits>) => void;

  // 액션 - 특수 모드
  startPlotSetting: (projectId: string) => void;
  updatePlotSettingState: (state: Partial<PlotSettingState>) => void;
  completePlotSetting: () => Promise<void>;

  startCharacterSetting: (projectId: string, characterId?: string) => void;
  updateCharacterSettingState: (state: Partial<CharacterSettingState>) => void;
  completeCharacterSetting: () => Promise<void>;

  // 셀렉터
  getSessionsByProject: (projectId: string) => ChatSession[];
  isOverUsageLimit: () => boolean;
}

const DEFAULT_CONFIG: AIConfig = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  streamEnabled: true,
};

const DEFAULT_USAGE_LIMITS: UsageLimits = {
  dailyTokenLimit: 100000,
  dailyCostLimit: 5.0,
  warningThreshold: 0.8,
};

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessions: new Map(),
      isGenerating: false,
      streamingContent: '',
      abortController: null,
      config: DEFAULT_CONFIG,
      apiKeySet: !!localStorage.getItem('storyforge-openai-key'),
      todayUsage: { tokens: 0, cost: 0, requests: 0 },
      usageLimits: DEFAULT_USAGE_LIMITS,
      plotSettingState: null,
      characterSettingState: null,

      createSession: async (projectId, type) => {
        const id = generateId();
        const now = new Date();

        const session: ChatSession = {
          id,
          projectId,
          type,
          title: getSessionTitle(type),
          messages: [],
          stats: {
            messageCount: 0,
            totalTokens: 0,
            estimatedCost: 0,
          },
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          sessions: new Map(state.sessions).set(id, session),
          currentSession: session,
        }));

        return id;
      },

      loadSession: async (sessionId) => {
        const session = get().sessions.get(sessionId);
        if (session) {
          set({ currentSession: session });
        }
      },

      closeSession: () => {
        set({ currentSession: null });
      },

      deleteSession: async (sessionId) => {
        set(state => {
          const newSessions = new Map(state.sessions);
          newSessions.delete(sessionId);
          return {
            sessions: newSessions,
            currentSession: state.currentSession?.id === sessionId
              ? null
              : state.currentSession,
          };
        });
      },

      sendMessage: async (content, projectId, sceneId) => {
        const { currentSession, config, todayUsage, usageLimits } = get();

        // 사용량 제한 체크
        if (get().isOverUsageLimit()) {
          throw new Error('일일 사용량 제한에 도달했습니다.');
        }

        // 사용자 메시지 추가
        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          status: 'complete',
          timestamp: new Date(),
        };

        // AI 응답 플레이스홀더
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          status: 'streaming',
          timestamp: new Date(),
        };

        // 세션 업데이트
        const updatedMessages = [
          ...(currentSession?.messages || []),
          userMessage,
          assistantMessage,
        ];

        set(state => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, messages: updatedMessages }
            : null,
          isGenerating: true,
          streamingContent: '',
        }));

        try {
          // 맥락 구축
          const context = await buildProjectContext(projectId, sceneId);
          const systemPrompt = getSystemPromptForType(
            currentSession?.type || 'general',
            context
          );

          if (config.streamEnabled) {
            // 스트리밍 모드
            const abortController = await chatCompletionStream(
              updatedMessages.slice(0, -1), // assistant placeholder 제외
              systemPrompt,
              config,
              {
                onChunk: (chunk) => {
                  set(state => ({
                    streamingContent: state.streamingContent + chunk,
                  }));
                },
                onComplete: (message) => {
                  set(state => {
                    const messages = state.currentSession?.messages || [];
                    const lastIdx = messages.length - 1;
                    messages[lastIdx] = message;

                    return {
                      currentSession: state.currentSession
                        ? {
                            ...state.currentSession,
                            messages: [...messages],
                            stats: {
                              ...state.currentSession.stats,
                              messageCount: messages.length,
                            },
                          }
                        : null,
                      isGenerating: false,
                      streamingContent: '',
                      abortController: null,
                    };
                  });
                },
                onError: (error) => {
                  set(state => {
                    const messages = state.currentSession?.messages || [];
                    const lastIdx = messages.length - 1;
                    messages[lastIdx] = {
                      ...messages[lastIdx],
                      status: 'error',
                      error: { code: error.code, message: error.message },
                    };

                    return {
                      currentSession: state.currentSession
                        ? { ...state.currentSession, messages: [...messages] }
                        : null,
                      isGenerating: false,
                      streamingContent: '',
                      abortController: null,
                    };
                  });
                },
              }
            );

            set({ abortController });
          } else {
            // 일반 모드
            const { message, usage } = await chatCompletion(
              updatedMessages.slice(0, -1),
              systemPrompt,
              config
            );

            // 사용량 업데이트
            set(state => ({
              currentSession: state.currentSession
                ? {
                    ...state.currentSession,
                    messages: [
                      ...state.currentSession.messages.slice(0, -1),
                      message,
                    ],
                    stats: {
                      messageCount: state.currentSession.messages.length,
                      totalTokens: state.currentSession.stats.totalTokens + usage.totalTokens,
                      estimatedCost: state.currentSession.stats.estimatedCost + usage.estimatedCost,
                    },
                  }
                : null,
              isGenerating: false,
              todayUsage: {
                tokens: state.todayUsage.tokens + usage.totalTokens,
                cost: state.todayUsage.cost + usage.estimatedCost,
                requests: state.todayUsage.requests + 1,
              },
            }));
          }
        } catch (error) {
          set(state => {
            const messages = state.currentSession?.messages || [];
            const lastIdx = messages.length - 1;
            if (lastIdx >= 0) {
              messages[lastIdx] = {
                ...messages[lastIdx],
                status: 'error',
                error: {
                  code: 'SEND_ERROR',
                  message: (error as Error).message,
                },
              };
            }

            return {
              currentSession: state.currentSession
                ? { ...state.currentSession, messages: [...messages] }
                : null,
              isGenerating: false,
              streamingContent: '',
            };
          });
        }
      },

      cancelGeneration: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
        }
        set({ isGenerating: false, streamingContent: '', abortController: null });
      },

      clearMessages: () => {
        set(state => ({
          currentSession: state.currentSession
            ? {
                ...state.currentSession,
                messages: [],
                stats: { messageCount: 0, totalTokens: 0, estimatedCost: 0 },
              }
            : null,
        }));
      },

      setConfig: (newConfig) => {
        set(state => ({
          config: { ...state.config, ...newConfig },
        }));
      },

      setAPIKey: async (key) => {
        const { validateAPIKey } = await import('@/services/ai');
        const isValid = await validateAPIKey(key);

        if (isValid) {
          localStorage.setItem('storyforge-openai-key', key);
          set({ apiKeySet: true });
        }

        return isValid;
      },

      clearAPIKey: () => {
        localStorage.removeItem('storyforge-openai-key');
        set({ apiKeySet: false });
      },

      setUsageLimits: (limits) => {
        set(state => ({
          usageLimits: { ...state.usageLimits, ...limits },
        }));
      },

      startPlotSetting: (projectId) => {
        set({
          plotSettingState: {
            currentStep: 'genre_selection',
            completedSteps: [],
            data: {},
          },
        });
      },

      updatePlotSettingState: (state) => {
        set(prev => ({
          plotSettingState: prev.plotSettingState
            ? { ...prev.plotSettingState, ...state }
            : null,
        }));
      },

      completePlotSetting: async () => {
        // TODO: 줄거리 설정 결과를 프로젝트에 저장
        set({ plotSettingState: null });
      },

      startCharacterSetting: (projectId, characterId) => {
        set({
          characterSettingState: {
            currentStep: 'basic_info',
            completedSteps: [],
            targetCharacterId: characterId,
            data: {},
          },
        });
      },

      updateCharacterSettingState: (state) => {
        set(prev => ({
          characterSettingState: prev.characterSettingState
            ? { ...prev.characterSettingState, ...state }
            : null,
        }));
      },

      completeCharacterSetting: async () => {
        // TODO: 인물 설정 결과로 캐릭터 카드 생성/업데이트
        set({ characterSettingState: null });
      },

      getSessionsByProject: (projectId) => {
        return Array.from(get().sessions.values())
          .filter(s => s.projectId === projectId)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      },

      isOverUsageLimit: () => {
        const { todayUsage, usageLimits } = get();

        if (usageLimits.dailyTokenLimit && todayUsage.tokens >= usageLimits.dailyTokenLimit) {
          return true;
        }
        if (usageLimits.dailyCostLimit && todayUsage.cost >= usageLimits.dailyCostLimit) {
          return true;
        }

        return false;
      },
    }),
    {
      name: 'storyforge-ai',
      partialize: (state) => ({
        config: state.config,
        usageLimits: state.usageLimits,
        // sessions는 IndexedDB로 이동 예정
      }),
    }
  )
);

// 헬퍼 함수들

function getSessionTitle(type: ConversationType): string {
  const titles: Record<ConversationType, string> = {
    general: '새 대화',
    plot_setting: '줄거리 설정',
    character_setting: '인물 설정',
    writing_assist: '글쓰기 보조',
    world_building: '세계관 구축',
  };
  return titles[type];
}

function getSystemPromptForType(
  type: ConversationType,
  context: any
): string {
  const contextPrompt = formatContextAsSystemPrompt(context);

  const basePrompts: Record<ConversationType, string> = {
    general: `당신은 한국 웹소설 작가를 돕는 AI 보조작가입니다.
작가의 질문에 친절하고 구체적으로 답변하세요.
창작에 도움이 되는 제안을 적극적으로 해주세요.`,

    plot_setting: `당신은 웹소설 줄거리 설정을 돕는 전문 스토리텔러입니다.
장르의 특성을 잘 이해하고, 한국 웹소설 독자들이 좋아하는 요소를 반영하세요.
단계별로 질문하며 작가가 원하는 이야기를 구체화하도록 도와주세요.`,

    character_setting: `당신은 매력적인 캐릭터 창조를 돕는 전문가입니다.
입체적이고 일관성 있는 인물을 만들 수 있도록 도와주세요.
단계별로 질문하며 캐릭터의 세부 사항을 구체화하세요.`,

    writing_assist: `당신은 웹소설 집필을 돕는 AI 작가 보조입니다.
작가의 문체와 톤을 존중하면서 도움을 제공하세요.
구체적인 문장이나 표현을 제안할 때는 여러 옵션을 제시하세요.`,

    world_building: `당신은 세계관 구축 전문가입니다.
일관성 있고 몰입감 있는 세계관을 만들 수 있도록 도와주세요.
설정의 논리적 일관성을 검토하고 빈틈을 채워주세요.`,
  };

  return `${basePrompts[type]}

${contextPrompt}`;
}
```

#### 완료 조건

- [ ] AI 스토어 생성 완료
- [ ] 세션 생성/로드/삭제 동작
- [ ] 메시지 전송 및 스트리밍 동작
- [ ] 사용량 추적 동작
- [ ] TypeScript 컴파일 오류 없음

---

## Week 2: AI 대화 UI

---

### TASK-P2-05: AI 대화창 UI 구현

**전체 맥락에서의 목적**:
우측 패널에 AI 대화창 UI를 구현합니다. 기존 "Coming Soon" 플레이스홀더를 실제 대화 인터페이스로 교체합니다.

**의존성**: TASK-P2-04

**산출물**:
- `src/components/ai/ChatPanel.tsx`
- `src/components/ai/ChatInput.tsx`
- `src/components/ai/index.ts`
- `src/components/layout/RightPanel.tsx` (업데이트)

#### 구현 요구사항

```typescript
/**
 * ChatPanel.tsx
 *
 * AI 대화창 메인 컴포넌트
 *
 * 구조:
 * - 헤더 (세션 타입, 모델 선택, 설정)
 * - 메시지 목록 (스크롤 영역)
 * - 입력 영역 (하단 고정)
 */

import { useEffect, useRef } from 'react';
import { useAIStore } from '@/stores';
import { useProjectStore } from '@/stores';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { ChatHeader } from './ChatHeader';
import { EmptyChat } from './EmptyChat';
import { cn } from '@/lib/cn';

export function ChatPanel() {
  const {
    currentSession,
    isGenerating,
    streamingContent,
    apiKeySet,
  } = useAIStore();
  const currentProject = useProjectStore(state => state.getCurrentProject());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages.length, streamingContent]);

  if (!apiKeySet) {
    return <APIKeySetup />;
  }

  if (!currentProject) {
    return <NoProjectSelected />;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentSession || currentSession.messages.length === 0 ? (
          <EmptyChat />
        ) : (
          <>
            {currentSession.messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={
                  index === currentSession.messages.length - 1 &&
                  message.status === 'streaming'
                }
                streamingContent={
                  index === currentSession.messages.length - 1
                    ? streamingContent
                    : undefined
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <ChatInput
        disabled={isGenerating || !currentProject}
        onSend={(content) => {
          const { sendMessage, currentSession, createSession } = useAIStore.getState();
          const projectId = currentProject.id;

          // 세션이 없으면 생성
          if (!currentSession) {
            createSession(projectId, 'general').then(() => {
              sendMessage(content, projectId);
            });
          } else {
            sendMessage(content, projectId);
          }
        }}
      />
    </div>
  );
}

function APIKeySetup() {
  // API 키 설정 UI
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="text-4xl mb-4">🔑</div>
      <h3 className="text-lg font-medium mb-2">API 키 설정 필요</h3>
      <p className="text-sm text-muted-foreground mb-4">
        AI 기능을 사용하려면 OpenAI API 키가 필요합니다.
      </p>
      <button
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        onClick={() => {
          // TODO: API 키 설정 모달 열기
        }}
      >
        API 키 설정하기
      </button>
    </div>
  );
}

function NoProjectSelected() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="text-4xl mb-4">📝</div>
      <h3 className="text-lg font-medium mb-2">프로젝트를 선택하세요</h3>
      <p className="text-sm text-muted-foreground">
        AI 보조작가를 사용하려면 먼저 프로젝트를 열어주세요.
      </p>
    </div>
  );
}
```

```typescript
/**
 * ChatInput.tsx
 *
 * 메시지 입력 컴포넌트
 *
 * 기능:
 * - 텍스트 입력 (자동 높이 조절)
 * - Enter로 전송, Shift+Enter로 줄바꿈
 * - 전송 버튼
 * - 생성 중 취소 버튼
 */

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';
import { useAIStore } from '@/stores';
import { cn } from '@/lib/cn';

interface ChatInputProps {
  disabled?: boolean;
  onSend: (content: string) => void;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isGenerating, cancelGeneration } = useAIStore();

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');

    // 높이 리셋
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={isGenerating ? 'AI가 응답 중...' : '메시지를 입력하세요...'}
          disabled={disabled || isGenerating}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-md border border-input bg-background px-3 py-2',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-[40px] max-h-[200px]'
          )}
        />

        {isGenerating ? (
          <button
            onClick={cancelGeneration}
            className="p-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
            title="생성 중지"
          >
            <Square className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={cn(
              'p-2 rounded-md',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="전송"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Enter로 전송, Shift+Enter로 줄바꿈
      </p>
    </div>
  );
}
```

#### 완료 조건

- [ ] 대화창 UI 정상 표시
- [ ] 메시지 입력 및 전송 동작
- [ ] 스트리밍 응답 실시간 표시
- [ ] 스크롤 동작 정상
- [ ] API 키 미설정시 안내 표시

---

### TASK-P2-06: 메시지 컴포넌트 구현

**전체 맥락에서의 목적**:
대화 메시지를 렌더링하는 컴포넌트를 구현합니다. 사용자/AI 메시지 구분, 마크다운 렌더링, 액션 버튼 등을 포함합니다.

**의존성**: TASK-P2-05

**산출물**:
- `src/components/ai/ChatMessage.tsx`
- `src/components/ai/ActionButton.tsx`
- `src/components/ai/TypingIndicator.tsx`

#### 구현 요구사항

```typescript
/**
 * ChatMessage.tsx
 *
 * 개별 메시지 렌더링
 *
 * 기능:
 * - 사용자/AI 메시지 스타일 구분
 * - 마크다운 렌더링 (코드 블록, 리스트 등)
 * - 스트리밍 중 타이핑 효과
 * - AI 제안 액션 버튼
 * - 에러 상태 표시
 */

import { memo } from 'react';
import { User, Bot, AlertCircle } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types';
import { ActionButton } from './ActionButton';
import { TypingIndicator } from './TypingIndicator';
import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/dateUtils';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  streamingContent?: string;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming,
  streamingContent,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';

  const content = isStreaming ? streamingContent || '' : message.content;

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* 아바타 */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary' : 'bg-secondary'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-secondary-foreground" />
        )}
      </div>

      {/* 메시지 버블 */}
      <div
        className={cn(
          'flex-1 max-w-[80%]',
          isUser ? 'text-right' : 'text-left'
        )}
      >
        <div
          className={cn(
            'inline-block rounded-lg px-4 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground',
            isError && 'bg-destructive/10 border border-destructive'
          )}
        >
          {isError && (
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>오류 발생</span>
            </div>
          )}

          {/* 메시지 내용 */}
          <div className="whitespace-pre-wrap">
            {content || (isStreaming && <TypingIndicator />)}
          </div>

          {/* 스트리밍 중 커서 */}
          {isStreaming && content && (
            <span className="inline-block w-1 h-4 bg-current animate-pulse ml-0.5" />
          )}
        </div>

        {/* 타임스탬프 */}
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(message.timestamp)}
          {message.model && !isUser && (
            <span className="ml-2">· {message.model}</span>
          )}
        </p>

        {/* 액션 버튼들 */}
        {!isUser && message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.suggestedActions.map(action => (
              <ActionButton key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
```

```typescript
/**
 * ActionButton.tsx
 *
 * AI가 제안한 액션 버튼
 */

import { Check, Plus, FileText, User, MapPin, Package } from 'lucide-react';
import type { SuggestedAction } from '@/types';
import { cn } from '@/lib/cn';

interface ActionButtonProps {
  action: SuggestedAction;
}

const ACTION_ICONS = {
  create_character: User,
  update_character: User,
  create_location: MapPin,
  create_item: Package,
  update_synopsis: FileText,
  create_chapter_outline: FileText,
  apply_to_editor: FileText,
  save_to_notes: FileText,
};

export function ActionButton({ action }: ActionButtonProps) {
  const Icon = ACTION_ICONS[action.type] || FileText;

  const handleClick = async () => {
    if (action.applied) return;

    // TODO: 액션 실행 로직
    console.log('Execute action:', action);
  };

  return (
    <button
      onClick={handleClick}
      disabled={action.applied}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs',
        'border border-border',
        'hover:bg-accent hover:text-accent-foreground',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        action.applied && 'bg-green-500/10 border-green-500'
      )}
    >
      {action.applied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      <span>{action.label}</span>
    </button>
  );
}
```

```typescript
/**
 * TypingIndicator.tsx
 *
 * AI 타이핑 중 인디케이터
 */

export function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center h-5">
      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
    </div>
  );
}
```

#### 완료 조건

- [ ] 사용자/AI 메시지 스타일 구분 표시
- [ ] 스트리밍 중 타이핑 효과 표시
- [ ] 액션 버튼 렌더링 및 클릭 동작
- [ ] 에러 상태 표시
- [ ] TypeScript 컴파일 오류 없음

---

## Week 3: 핵심 AI 기능

---

### TASK-P2-07: 줄거리 설정 기능 구현

**전체 맥락에서의 목적**:
AI와 단계별 대화를 통해 작품의 줄거리를 설정하는 기능을 구현합니다. 장르 선택부터 화별 줄거리까지 체계적으로 구성합니다.

**의존성**: TASK-P2-05, TASK-P2-06

**산출물**:
- `src/components/ai/PlotSettingWizard.tsx`
- `src/components/ai/PlotStepIndicator.tsx`
- `src/services/ai/plotPrompts.ts`

#### 구현 요구사항

```typescript
/**
 * plotPrompts.ts
 *
 * 줄거리 설정 단계별 프롬프트
 */

import type { PlotSettingStep, PlotSettingState } from '@/types';

export const PLOT_STEP_CONFIG: Record<PlotSettingStep, {
  title: string;
  description: string;
  systemPrompt: string;
  initialMessage: string;
}> = {
  genre_selection: {
    title: '장르 선택',
    description: '작품의 장르를 선택합니다',
    systemPrompt: `당신은 웹소설 장르 전문가입니다.
사용자가 원하는 장르를 파악하고, 해당 장르의 특성과 독자 기대를 설명해주세요.
복수 장르 조합도 가능합니다.`,
    initialMessage: `어떤 장르의 이야기를 쓰고 싶으신가요?

**인기 장르:**
- 🗡️ 판타지 (이세계, 회귀, 헌터물)
- 💕 로맨스 (현대, 사극, 판타지)
- 🥋 무협
- 🔍 스릴러/미스터리
- 🚀 SF

여러 장르를 조합해도 좋습니다. (예: 회귀 + 로맨스)`,
  },

  premise: {
    title: '기본 전제',
    description: '이야기의 핵심 아이디어를 정합니다',
    systemPrompt: `당신은 스토리 컨셉 개발 전문가입니다.
사용자의 아이디어를 구체화하고, 더 매력적인 전제로 발전시켜주세요.
로그라인(한 줄 요약)을 함께 제안해주세요.`,
    initialMessage: `어떤 이야기를 쓰고 싶으신가요?

간단한 아이디어라도 괜찮습니다. 예를 들면:
- "평범한 회사원이 던전이 나타난 세계에서 살아남는 이야기"
- "재벌가 막내아들로 회귀한 주인공"
- "마왕을 물리친 용사가 평범하게 살고 싶은 이야기"

어떤 이야기가 마음에 드세요?`,
  },

  main_character: {
    title: '주인공 설정',
    description: '주인공의 기본적인 특성을 정합니다',
    systemPrompt: `당신은 캐릭터 설정 전문가입니다.
주인공의 핵심 특성을 파악하고, 독자가 공감하고 응원할 수 있는 캐릭터로 발전시켜주세요.
장르에 맞는 주인공 유형을 제안해주세요.`,
    initialMessage: `주인공은 어떤 사람인가요?

기본적인 것부터 시작해볼까요?
- 이름과 나이
- 직업이나 상황
- 가장 두드러지는 성격
- 어떤 목표나 욕망을 가지고 있는지`,
  },

  conflict: {
    title: '갈등 요소',
    description: '이야기의 주요 갈등을 설정합니다',
    systemPrompt: `당신은 플롯 구성 전문가입니다.
매력적인 갈등 구조를 제안해주세요.
내적 갈등과 외적 갈등을 균형 있게 설계해주세요.`,
    initialMessage: `주인공이 극복해야 할 갈등은 무엇인가요?

좋은 갈등의 요소:
- **외적 갈등**: 악역, 조직, 상황 등 외부의 장애물
- **내적 갈등**: 두려움, 트라우마, 도덕적 딜레마

주인공의 앞을 가로막는 것은 무엇인가요?`,
  },

  world_setting: {
    title: '세계관',
    description: '이야기가 펼쳐지는 세계를 설정합니다',
    systemPrompt: `당신은 세계관 설계 전문가입니다.
장르에 맞는 세계관을 구축하고, 이야기에 필요한 핵심 설정을 제안해주세요.
일관성 있고 몰입감 있는 세계를 만들어주세요.`,
    initialMessage: `이야기는 어떤 세계에서 펼쳐지나요?

고려할 요소들:
- 시대 배경 (현대, 과거, 미래, 이세계)
- 특별한 규칙이나 시스템 (마법, 던전, 능력 등)
- 사회 구조 (국가, 조직, 계급 등)

이 세계만의 특별한 점이 있나요?`,
  },

  plot_structure: {
    title: '플롯 구조',
    description: '이야기의 전체적인 흐름을 설계합니다',
    systemPrompt: `당신은 스토리 구조 전문가입니다.
3막 구조 또는 기승전결에 맞춰 이야기의 큰 흐름을 설계해주세요.
각 구간의 핵심 이벤트를 제안해주세요.`,
    initialMessage: `이야기의 전체 흐름을 잡아볼까요?

**기본 구조:**
1. **시작(기)**: 주인공의 일상과 사건의 시작
2. **전개(승)**: 갈등 심화, 성장과 시련
3. **절정(전)**: 최대의 위기와 결전
4. **결말(결)**: 해결과 새로운 일상

대략적인 흐름을 말씀해주시거나, 제가 제안해드릴까요?`,
  },

  chapter_outline: {
    title: '화별 줄거리',
    description: '각 화의 내용을 구체적으로 계획합니다',
    systemPrompt: `당신은 연재소설 구성 전문가입니다.
각 화가 적절한 분량과 후킹을 가지도록 구성해주세요.
1화당 약 5000자 기준으로 계획해주세요.`,
    initialMessage: `이제 화별로 구체적인 내용을 정해볼까요?

먼저 1권(약 25화)의 줄거리를 잡아보겠습니다.
주요 이벤트와 각 화의 끝을 어떻게 마무리할지(후킹) 함께 생각해봐요.

1화는 어떻게 시작하면 좋을까요?`,
  },

  review: {
    title: '검토 및 확정',
    description: '설정을 최종 확인합니다',
    systemPrompt: `지금까지 설정한 내용을 정리해서 보여주세요.
수정이 필요한 부분이 있는지 확인하고, 최종 확정할 수 있도록 안내해주세요.`,
    initialMessage: `지금까지 설정한 내용을 정리해드릴게요. 확인 후 수정하거나 확정해주세요.`,
  },
};

export function getPlotStepPrompt(
  step: PlotSettingStep,
  state: PlotSettingState
): { system: string; initial: string } {
  const config = PLOT_STEP_CONFIG[step];

  // 이전 단계 정보를 맥락에 추가
  let contextAddition = '';
  if (state.data.genre) {
    contextAddition += `\n\n[선택된 장르: ${state.data.genre.join(', ')}]`;
  }
  if (state.data.premise) {
    contextAddition += `\n[전제: ${state.data.premise}]`;
  }
  // ... 기타 컨텍스트 추가

  return {
    system: config.systemPrompt + contextAddition,
    initial: config.initialMessage,
  };
}
```

```typescript
/**
 * PlotSettingWizard.tsx
 *
 * 줄거리 설정 마법사 컴포넌트
 */

import { useEffect } from 'react';
import { useAIStore, useProjectStore } from '@/stores';
import { PlotStepIndicator } from './PlotStepIndicator';
import { ChatPanel } from './ChatPanel';
import { PLOT_STEP_CONFIG, getPlotStepPrompt } from '@/services/ai/plotPrompts';
import type { PlotSettingStep } from '@/types';

const STEPS: PlotSettingStep[] = [
  'genre_selection',
  'premise',
  'main_character',
  'conflict',
  'world_setting',
  'plot_structure',
  'chapter_outline',
  'review',
];

export function PlotSettingWizard() {
  const currentProject = useProjectStore(state => state.getCurrentProject());
  const {
    plotSettingState,
    updatePlotSettingState,
    createSession,
    sendMessage,
  } = useAIStore();

  const currentStep = plotSettingState?.currentStep || 'genre_selection';
  const currentStepIndex = STEPS.indexOf(currentStep);

  // 단계 시작시 초기 메시지 전송
  useEffect(() => {
    if (!currentProject || !plotSettingState) return;

    const { initial } = getPlotStepPrompt(currentStep, plotSettingState);

    // 세션 생성 및 초기 메시지 전송
    createSession(currentProject.id, 'plot_setting').then(() => {
      // AI가 먼저 메시지를 보내는 형태로 시작
    });
  }, [currentStep]);

  const handleNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentStepIndex + 1];
      updatePlotSettingState({
        currentStep: nextStep,
        completedSteps: [...(plotSettingState?.completedSteps || []), currentStep],
      });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = STEPS[currentStepIndex - 1];
      updatePlotSettingState({ currentStep: prevStep });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 단계 표시 */}
      <PlotStepIndicator
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={plotSettingState?.completedSteps || []}
      />

      {/* 대화 영역 */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>

      {/* 네비게이션 */}
      <div className="flex justify-between p-4 border-t border-border">
        <button
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          className="px-4 py-2 text-sm border border-border rounded-md disabled:opacity-50"
        >
          이전 단계
        </button>

        {currentStep === 'review' ? (
          <button
            onClick={() => {
              // TODO: 설정 저장 및 완료
            }}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md"
          >
            설정 완료
          </button>
        ) : (
          <button
            onClick={handleNextStep}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md"
          >
            다음 단계
          </button>
        )}
      </div>
    </div>
  );
}
```

#### 완료 조건

- [ ] 8단계 줄거리 설정 플로우 동작
- [ ] 각 단계별 프롬프트 적용
- [ ] 이전 단계 정보가 다음 단계에 전달
- [ ] 최종 설정 저장 가능
- [ ] 단계 표시 UI 정상 동작

---

### TASK-P2-08: 인물 설정 기능 구현

**전체 맥락에서의 목적**:
AI와 단계별 대화를 통해 인물을 설정하고, 완료시 캐릭터 카드를 자동 생성하는 기능을 구현합니다.

**의존성**: TASK-P2-07

**산출물**:
- `src/components/ai/CharacterSettingWizard.tsx`
- `src/services/ai/characterPrompts.ts`

#### 구현 요구사항

```typescript
/**
 * characterPrompts.ts
 *
 * 인물 설정 단계별 프롬프트
 */

import type { CharacterSettingStep, CharacterSettingState } from '@/types';

export const CHARACTER_STEP_CONFIG: Record<CharacterSettingStep, {
  title: string;
  description: string;
  systemPrompt: string;
  initialMessage: string;
}> = {
  basic_info: {
    title: '기본 정보',
    description: '이름, 나이, 직업 등',
    systemPrompt: `당신은 캐릭터 설정 전문가입니다.
캐릭터의 기본 정보를 자연스럽게 수집해주세요.
한국 웹소설에 어울리는 이름을 제안해줄 수 있습니다.`,
    initialMessage: `새로운 인물을 만들어볼까요?

먼저 기본적인 정보부터 정해봐요:
- 이름 (작명이 어려우시면 도와드릴게요!)
- 나이 또는 연령대
- 이 인물의 역할 (주인공, 조연, 악역 등)
- 직업이나 신분`,
  },

  appearance: {
    title: '외모',
    description: '신체적 특징',
    systemPrompt: `캐릭터의 외모를 구체적으로 설정해주세요.
독자가 쉽게 상상할 수 있도록 특징적인 부분을 강조해주세요.`,
    initialMessage: `이 인물의 외모는 어떤가요?

묘사할 수 있는 요소들:
- 전체적인 인상 (예: 차가운, 따뜻한, 날카로운)
- 체형과 키
- 머리카락, 눈동자 색
- 특징적인 부분 (흉터, 점, 습관적인 표정 등)`,
  },

  personality: {
    title: '성격',
    description: '성격 특성',
    systemPrompt: `캐릭터의 성격을 다면적으로 설정해주세요.
겉으로 보이는 모습과 내면이 다를 수 있습니다.`,
    initialMessage: `이 인물의 성격을 알려주세요.

생각해볼 점들:
- 첫인상 (다른 사람들에게 어떻게 보이는지)
- 실제 성격 (친해진 후에 보이는 모습)
- 장점과 단점
- 특이한 버릇이나 습관`,
  },

  background: {
    title: '배경',
    description: '과거와 성장 환경',
    systemPrompt: `캐릭터의 과거와 배경을 설정해주세요.
현재 성격을 형성하게 된 경험을 포함해주세요.`,
    initialMessage: `이 인물은 어떤 삶을 살아왔나요?

배경 이야기:
- 가족 관계
- 성장 환경
- 인생에 큰 영향을 준 사건
- 비밀이나 트라우마 (있다면)`,
  },

  motivation: {
    title: '동기',
    description: '목표와 욕망',
    systemPrompt: `캐릭터의 동기와 목표를 설정해주세요.
이야기를 이끄는 원동력이 됩니다.`,
    initialMessage: `이 인물이 가장 원하는 것은 무엇인가요?

동기 요소:
- 가장 큰 목표 (무엇을 이루고 싶은지)
- 왜 그것을 원하는지
- 목표를 위해 어디까지 할 수 있는지
- 두려워하는 것`,
  },

  relationships: {
    title: '관계',
    description: '다른 인물과의 관계',
    systemPrompt: `다른 캐릭터와의 관계를 설정해주세요.
기존 캐릭터와의 연결고리를 만들어주세요.`,
    initialMessage: `다른 인물들과 어떤 관계인가요?

주요 관계:
- 가족
- 친구 또는 동료
- 적 또는 라이벌
- 특별한 관계 (연인, 스승 등)

기존 등장인물과의 관계도 설정할 수 있어요.`,
  },

  abilities: {
    title: '능력',
    description: '특기와 능력 (장르에 따라)',
    systemPrompt: `캐릭터의 능력이나 특기를 설정해주세요.
장르에 맞는 능력을 제안해드릴 수 있습니다.`,
    initialMessage: `이 인물의 능력이나 특기가 있나요?

(판타지/무협/능력물의 경우)
- 가진 능력이나 스킬
- 능력의 강점과 약점
- 성장 가능성

(일반 장르의 경우)
- 전문 분야나 특기
- 남다른 재능`,
  },

  arc: {
    title: '성장 곡선',
    description: '캐릭터의 변화',
    systemPrompt: `캐릭터의 성장과 변화를 설계해주세요.
이야기 진행에 따른 발전을 계획해주세요.`,
    initialMessage: `이 인물은 이야기 속에서 어떻게 변화하나요?

캐릭터 아크:
- 시작점 (처음에는 어떤 모습인지)
- 겪게 될 시련
- 끝점 (최종적으로 어떤 모습이 되는지)
- 변화의 계기가 될 사건`,
  },

  review: {
    title: '검토',
    description: '설정 확인 및 완료',
    systemPrompt: `지금까지 설정한 캐릭터 정보를 정리해서 보여주세요.
캐릭터 카드 형식으로 요약해주세요.`,
    initialMessage: `캐릭터 설정이 완료되었습니다! 내용을 확인해주세요.`,
  },
};

/**
 * 캐릭터 설정 완료 후 카드 데이터 생성
 */
export function buildCharacterCardFromState(
  state: CharacterSettingState
): Partial<import('@/types').CharacterCard> {
  const { data } = state;

  return {
    type: 'character',
    name: data.name || '이름 없음',
    description: data.background || '',
    role: (data.role as any) || 'supporting',
    basicInfo: {
      age: data.age,
      gender: data.gender,
      occupation: data.occupation,
    },
    appearance: {
      distinguishingFeatures: data.appearance,
    },
    personality: data.personality || '',
    background: data.background || '',
    motivation: data.motivation || '',
    abilities: data.abilities || [],
    relationships: data.relationships?.map(r => ({
      targetId: '', // 나중에 매칭
      targetName: r.targetName,
      relationType: r.type,
      description: r.description,
    })) || [],
    arc: data.arc || [],
    tags: [],
  };
}
```

#### 완료 조건

- [ ] 9단계 인물 설정 플로우 동작
- [ ] 설정 완료시 캐릭터 카드 자동 생성
- [ ] 기존 캐릭터 수정 모드 지원
- [ ] 다른 캐릭터와 관계 연결 가능

---

### TASK-P2-09: 실시간 요약 패널 구현

**전체 맥락에서의 목적**:
현재 프로젝트의 진행상황, 등장인물 상태, 최근 요약을 실시간으로 표시하는 패널을 구현합니다. AI가 맥락을 참조할 때 사용됩니다.

**의존성**: TASK-P2-04

**산출물**:
- `src/components/ai/RealtimeSummaryPanel.tsx`
- `src/components/ai/CharacterStateCard.tsx`
- `src/services/ai/summaryService.ts`

#### 구현 요구사항

```typescript
/**
 * summaryService.ts
 *
 * 실시간 요약 생성 서비스
 */

import { db } from '@/db';
import type { RealtimeSummary } from '@/types';

/**
 * 프로젝트의 실시간 요약 생성
 */
export async function generateRealtimeSummary(
  projectId: string
): Promise<RealtimeSummary> {
  // 프로젝트 정보
  const project = await db.projects.get(projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');

  // 구조 정보
  const volumes = await db.volumes.where('projectId').equals(projectId).toArray();
  const chapters = await db.chapters.where('projectId').equals(projectId).toArray();
  const scenes = await db.scenes.where('projectId').equals(projectId).toArray();

  // 진행률 계산
  const completedChapters = chapters.filter(c =>
    c.status === 'complete' || c.status === 'published'
  ).length;

  // 캐릭터 상태 (간단히 - 실제로는 더 복잡한 로직 필요)
  const characters = await db.characters.where('projectId').equals(projectId).toArray();
  const characterStates = characters
    .filter(c => c.role !== 'minor')
    .slice(0, 5)
    .map(c => ({
      characterId: c.id,
      name: c.name,
      condition: '활동 중', // TODO: 실제 상태 추적
    }));

  // 최근 씬 요약
  const recentScenes = scenes
    .filter(s => s.plainText.length > 0)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 3);

  const recentChapterSummaries = await Promise.all(
    recentScenes.map(async scene => {
      const chapter = await db.chapters.get(scene.chapterId);
      return {
        chapterTitle: chapter?.title || scene.title,
        summary: scene.plainText.slice(0, 200) + '...',
        keyEvents: [], // TODO: AI로 핵심 이벤트 추출
      };
    })
  );

  return {
    progress: {
      currentVolume: volumes.length > 0 ? volumes.length : 1,
      currentChapter: completedChapters + 1,
      totalChapters: chapters.length,
      completionPercentage: chapters.length > 0
        ? Math.round((completedChapters / chapters.length) * 100)
        : 0,
    },
    characterStates,
    recentChapterSummaries,
    activeForeshadowing: [], // TODO: 복선 관리 기능
    lastUpdatedAt: new Date(),
  };
}
```

```typescript
/**
 * RealtimeSummaryPanel.tsx
 *
 * 실시간 요약 패널
 */

import { useEffect, useState } from 'react';
import { RefreshCw, Users, BookOpen, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/stores';
import { generateRealtimeSummary } from '@/services/ai/summaryService';
import { CharacterStateCard } from './CharacterStateCard';
import type { RealtimeSummary } from '@/types';
import { cn } from '@/lib/cn';

export function RealtimeSummaryPanel() {
  const currentProject = useProjectStore(state => state.getCurrentProject());
  const [summary, setSummary] = useState<RealtimeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSummary = async () => {
    if (!currentProject) return;

    setIsLoading(true);
    try {
      const data = await generateRealtimeSummary(currentProject.id);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [currentProject?.id]);

  if (!currentProject) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          실시간 요약
        </h3>
        <button
          onClick={loadSummary}
          disabled={isLoading}
          className="p-1 rounded hover:bg-accent"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 진행 상황 */}
        <section>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4" />
            진행 상황
          </h4>
          {summary && (
            <div className="bg-secondary rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>현재 위치</span>
                <span className="font-medium">
                  {summary.progress.currentVolume}권 {summary.progress.currentChapter}화
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${summary.progress.completionPercentage}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {summary.progress.completionPercentage}% 완료
              </div>
            </div>
          )}
        </section>

        {/* 등장인물 상태 */}
        <section>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" />
            등장인물 상태
          </h4>
          <div className="space-y-2">
            {summary?.characterStates.map(char => (
              <CharacterStateCard key={char.characterId} character={char} />
            ))}
          </div>
        </section>

        {/* 최근 내용 */}
        <section>
          <h4 className="text-sm font-medium mb-2">최근 내용</h4>
          <div className="space-y-2">
            {summary?.recentChapterSummaries.map((chapter, index) => (
              <div key={index} className="text-sm p-2 bg-secondary rounded">
                <p className="font-medium mb-1">{chapter.chapterTitle}</p>
                <p className="text-muted-foreground text-xs line-clamp-2">
                  {chapter.summary}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
```

#### 완료 조건

- [ ] 진행 상황 실시간 표시
- [ ] 등장인물 상태 표시
- [ ] 최근 내용 요약 표시
- [ ] 새로고침 버튼 동작
- [ ] AI 맥락에서 참조 가능

---

## Week 4: 고도화 및 마무리

---

### TASK-P2-10: 프롬프트 템플릿 시스템

**전체 맥락에서의 목적**:
다양한 상황에 맞는 프롬프트 템플릿을 관리하고, 맥락에 맞게 동적으로 조합하는 시스템을 구현합니다.

**의존성**: TASK-P2-03

**산출물**:
- `src/services/ai/promptTemplates.ts`
- `src/services/ai/promptBuilder.ts`

---

### TASK-P2-11: 스트리밍 응답 최적화

**전체 맥락에서의 목적**:
스트리밍 응답의 안정성과 성능을 개선합니다. 연결 끊김 처리, 재연결 로직, 부분 응답 저장 등을 구현합니다.

**의존성**: TASK-P2-02

**산출물**:
- `src/services/ai/streamHandler.ts`
- `src/hooks/useStreamingMessage.ts`

---

### TASK-P2-12: 토큰/비용 관리 시스템

**전체 맥락에서의 목적**:
API 사용량과 비용을 추적하고, 제한을 설정할 수 있는 시스템을 구현합니다.

**의존성**: TASK-P2-04

**산출물**:
- `src/components/ai/UsageStats.tsx`
- `src/components/ai/UsageLimitModal.tsx`
- `src/services/ai/usageTracker.ts`

---

### TASK-P2-13: QA 및 최적화

**전체 맥락에서의 목적**:
Phase 2 전체 기능에 대한 품질 검증 및 성능 최적화를 수행합니다.

**의존성**: 모든 Phase 2 Task

**산출물**:
- 버그 수정
- 성능 최적화
- 사용자 피드백 반영

#### 완료 조건

- [ ] 모든 AI 기능 정상 동작
- [ ] 오프라인시 적절한 에러 처리
- [ ] 토큰 사용량 정확히 추적
- [ ] 메모리 누수 없음
- [ ] 응답 시간 3초 이내

---

### TASK-P2-14: API 키 관리 UI

**전체 맥락에서의 목적**:
사용자가 자신의 OpenAI API 키를 안전하게 설정하고 관리할 수 있는 UI를 구현합니다.

**의존성**: TASK-P2-02

**산출물**:
- `src/components/ai/APIKeyModal.tsx`
- `src/components/settings/AISettings.tsx`

---

## 부록

### Phase 2 완료 기준

- [ ] AI 대화창에서 메시지 주고받기 가능
- [ ] 스트리밍 응답 실시간 표시
- [ ] 줄거리 설정 마법사 8단계 완료 가능
- [ ] 인물 설정 마법사 9단계 완료 → 캐릭터 카드 자동 생성
- [ ] 실시간 요약 패널 표시
- [ ] 토큰 사용량 및 비용 추적
- [ ] 일일 사용량 제한 설정 가능
- [ ] API 키 없을 때 적절한 안내
- [ ] 오프라인시 기존 기능 정상 작동

### 참조 문서

- `docs/Storyforge-PRD.md` - 원본 기획서
- `docs/Storyforge-PRD-v2.md` - 상세 개발 명세
- `docs/Storyforge-TaskPlan.md` - Phase 1 작업 명세

### AI 모델 비용 참고 (2024년 기준)

| 모델 | Input (1K tokens) | Output (1K tokens) |
|------|-------------------|-------------------|
| GPT-4 | $0.03 | $0.06 |
| GPT-4 Turbo | $0.01 | $0.03 |
| GPT-3.5 Turbo | $0.0005 | $0.0015 |

예상 비용:
- 1회 대화 (약 2000 토큰): GPT-3.5 기준 약 $0.002
- 줄거리 설정 (약 20000 토큰): GPT-3.5 기준 약 $0.02
- 일일 적극 사용 (약 100000 토큰): GPT-3.5 기준 약 $0.10

---

*문서 끝*
