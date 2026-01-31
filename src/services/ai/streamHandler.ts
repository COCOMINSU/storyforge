/**
 * 스트리밍 응답 핸들러
 *
 * 스트리밍 응답의 안정성과 성능을 관리합니다.
 *
 * 주요 기능:
 * - AbortController를 통한 요청 취소
 * - 연결 끊김 감지 및 처리
 * - 부분 응답 저장 및 복구
 * - 청크 단위 렌더링 최적화
 */

import type { ChatMessage, AIServiceError } from '@/types';

// ============================================
// Types
// ============================================

/**
 * 스트리밍 상태
 */
export type StreamStatus =
  | 'idle'
  | 'connecting'
  | 'streaming'
  | 'paused'
  | 'completed'
  | 'error'
  | 'aborted';

/**
 * 스트리밍 세션 정보
 */
export interface StreamSession {
  /** 세션 ID */
  id: string;
  /** 현재 상태 */
  status: StreamStatus;
  /** 누적된 콘텐츠 */
  content: string;
  /** 시작 시간 */
  startedAt: Date;
  /** 마지막 청크 수신 시간 */
  lastChunkAt: Date | null;
  /** 총 청크 수 */
  chunkCount: number;
  /** 에러 정보 (있는 경우) */
  error?: AIServiceError;
  /** AbortController */
  abortController: AbortController;
}

/**
 * 스트리밍 옵션
 */
export interface StreamOptions {
  /** 청크 버퍼 크기 (기본: 5) - 이 수만큼 청크가 쌓이면 한 번에 렌더링 */
  chunkBufferSize?: number;
  /** 청크 플러시 간격 (ms, 기본: 50) */
  chunkFlushInterval?: number;
  /** 연결 타임아웃 (ms, 기본: 30000) */
  connectionTimeout?: number;
  /** 청크 타임아웃 (ms, 기본: 60000) - 마지막 청크 이후 대기 시간 */
  chunkTimeout?: number;
}

/**
 * 스트리밍 콜백
 */
export interface StreamCallbacks {
  /** 연결 시작 시 */
  onStart?: () => void;
  /** 청크 수신 시 (버퍼링된 청크) */
  onChunk?: (chunk: string, accumulated: string) => void;
  /** 완료 시 */
  onComplete?: (finalContent: string) => void;
  /** 에러 발생 시 */
  onError?: (error: AIServiceError) => void;
  /** 중단 시 */
  onAbort?: (partialContent: string) => void;
  /** 상태 변경 시 */
  onStatusChange?: (status: StreamStatus) => void;
}

// ============================================
// Constants
// ============================================

const DEFAULT_OPTIONS: Required<StreamOptions> = {
  chunkBufferSize: 5,
  chunkFlushInterval: 50,
  connectionTimeout: 30000,
  chunkTimeout: 60000,
};

// ============================================
// Stream Session Manager
// ============================================

/**
 * 활성 스트리밍 세션 관리
 */
const activeSessions = new Map<string, StreamSession>();

/**
 * 새 스트리밍 세션 생성
 */
export function createStreamSession(sessionId: string): StreamSession {
  // 기존 세션이 있다면 중단
  const existing = activeSessions.get(sessionId);
  if (existing) {
    existing.abortController.abort();
    activeSessions.delete(sessionId);
  }

  const session: StreamSession = {
    id: sessionId,
    status: 'idle',
    content: '',
    startedAt: new Date(),
    lastChunkAt: null,
    chunkCount: 0,
    abortController: new AbortController(),
  };

  activeSessions.set(sessionId, session);
  console.log(`[StreamHandler] 세션 생성: ${sessionId}`);

  return session;
}

/**
 * 스트리밍 세션 가져오기
 */
export function getStreamSession(sessionId: string): StreamSession | undefined {
  return activeSessions.get(sessionId);
}

/**
 * 스트리밍 세션 업데이트
 */
export function updateStreamSession(
  sessionId: string,
  updates: Partial<Omit<StreamSession, 'id' | 'abortController'>>
): StreamSession | undefined {
  const session = activeSessions.get(sessionId);
  if (!session) return undefined;

  Object.assign(session, updates);
  return session;
}

/**
 * 스트리밍 세션 종료
 */
export function closeStreamSession(sessionId: string): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    if (session.status === 'streaming' || session.status === 'connecting') {
      session.abortController.abort();
    }
    activeSessions.delete(sessionId);
    console.log(`[StreamHandler] 세션 종료: ${sessionId}`);
  }
}

/**
 * 스트리밍 세션 중단
 */
export function abortStreamSession(sessionId: string): string {
  const session = activeSessions.get(sessionId);
  if (!session) return '';

  session.abortController.abort();
  session.status = 'aborted';

  const partialContent = session.content;
  console.log(`[StreamHandler] 세션 중단: ${sessionId}, 부분 콘텐츠 길이: ${partialContent.length}`);

  return partialContent;
}

/**
 * 모든 활성 세션 중단
 */
export function abortAllSessions(): void {
  activeSessions.forEach((session, id) => {
    session.abortController.abort();
    console.log(`[StreamHandler] 세션 강제 중단: ${id}`);
  });
  activeSessions.clear();
}

// ============================================
// Chunk Buffer
// ============================================

/**
 * 청크 버퍼 클래스
 *
 * 성능 최적화를 위해 청크를 버퍼링하여 일괄 처리합니다.
 */
export class ChunkBuffer {
  private buffer: string[] = [];
  private accumulated = '';
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private options: Required<StreamOptions>;
  private onFlush: (chunk: string, accumulated: string) => void;

  constructor(
    options: StreamOptions,
    onFlush: (chunk: string, accumulated: string) => void
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.onFlush = onFlush;
  }

  /**
   * 청크 추가
   */
  push(chunk: string): void {
    this.buffer.push(chunk);
    this.accumulated += chunk;

    // 버퍼 크기 도달 시 즉시 플러시
    if (this.buffer.length >= this.options.chunkBufferSize) {
      this.flush();
      return;
    }

    // 타이머 기반 플러시 설정
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, this.options.chunkFlushInterval);
    }
  }

  /**
   * 버퍼 플러시
   */
  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.buffer.length > 0) {
      const chunk = this.buffer.join('');
      this.buffer = [];
      this.onFlush(chunk, this.accumulated);
    }
  }

  /**
   * 누적 콘텐츠 가져오기
   */
  getAccumulated(): string {
    return this.accumulated;
  }

  /**
   * 버퍼 초기화
   */
  clear(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.buffer = [];
    this.accumulated = '';
  }
}

// ============================================
// Connection Monitor
// ============================================

/**
 * 연결 상태 모니터
 *
 * 연결 끊김을 감지하고 타임아웃을 관리합니다.
 */
export class ConnectionMonitor {
  private options: Required<StreamOptions>;
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;
  private chunkTimer: ReturnType<typeof setTimeout> | null = null;
  private onTimeout: (type: 'connection' | 'chunk') => void;

  constructor(
    options: StreamOptions,
    onTimeout: (type: 'connection' | 'chunk') => void
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.onTimeout = onTimeout;
  }

  /**
   * 연결 타임아웃 시작
   */
  startConnectionTimeout(): void {
    this.clearConnectionTimeout();
    this.connectionTimer = setTimeout(() => {
      this.onTimeout('connection');
    }, this.options.connectionTimeout);
  }

  /**
   * 연결 타임아웃 클리어
   */
  clearConnectionTimeout(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * 청크 타임아웃 리셋
   */
  resetChunkTimeout(): void {
    this.clearChunkTimeout();
    this.chunkTimer = setTimeout(() => {
      this.onTimeout('chunk');
    }, this.options.chunkTimeout);
  }

  /**
   * 청크 타임아웃 클리어
   */
  clearChunkTimeout(): void {
    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
  }

  /**
   * 모든 타이머 정리
   */
  cleanup(): void {
    this.clearConnectionTimeout();
    this.clearChunkTimeout();
  }
}

// ============================================
// Partial Response Storage
// ============================================

/**
 * 부분 응답 저장소 키
 */
const PARTIAL_RESPONSE_KEY = 'storyforge-partial-responses';

/**
 * 부분 응답 정보
 */
interface PartialResponse {
  sessionId: string;
  content: string;
  savedAt: number;
  messageContext?: {
    projectId?: string;
    conversationId?: string;
  };
}

/**
 * 부분 응답 저장
 *
 * 스트리밍 중단 시 부분적으로 받은 응답을 저장합니다.
 */
export function savePartialResponse(
  sessionId: string,
  content: string,
  context?: PartialResponse['messageContext']
): void {
  if (!content || content.length < 10) return; // 너무 짧은 응답은 저장하지 않음

  try {
    const stored = localStorage.getItem(PARTIAL_RESPONSE_KEY);
    const responses: PartialResponse[] = stored ? JSON.parse(stored) : [];

    // 동일 세션의 기존 응답 제거
    const filtered = responses.filter((r) => r.sessionId !== sessionId);

    // 새 응답 추가
    filtered.push({
      sessionId,
      content,
      savedAt: Date.now(),
      messageContext: context,
    });

    // 최대 10개만 유지
    const limited = filtered.slice(-10);

    localStorage.setItem(PARTIAL_RESPONSE_KEY, JSON.stringify(limited));
    console.log(`[StreamHandler] 부분 응답 저장: ${sessionId}, 길이: ${content.length}`);
  } catch (error) {
    console.error('[StreamHandler] 부분 응답 저장 실패:', error);
  }
}

/**
 * 부분 응답 로드
 */
export function loadPartialResponse(sessionId: string): PartialResponse | null {
  try {
    const stored = localStorage.getItem(PARTIAL_RESPONSE_KEY);
    if (!stored) return null;

    const responses: PartialResponse[] = JSON.parse(stored);
    return responses.find((r) => r.sessionId === sessionId) || null;
  } catch {
    return null;
  }
}

/**
 * 부분 응답 삭제
 */
export function clearPartialResponse(sessionId: string): void {
  try {
    const stored = localStorage.getItem(PARTIAL_RESPONSE_KEY);
    if (!stored) return;

    const responses: PartialResponse[] = JSON.parse(stored);
    const filtered = responses.filter((r) => r.sessionId !== sessionId);

    localStorage.setItem(PARTIAL_RESPONSE_KEY, JSON.stringify(filtered));
  } catch {
    // 무시
  }
}

/**
 * 오래된 부분 응답 정리 (24시간 이상)
 */
export function cleanupOldPartialResponses(): void {
  try {
    const stored = localStorage.getItem(PARTIAL_RESPONSE_KEY);
    if (!stored) return;

    const responses: PartialResponse[] = JSON.parse(stored);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = responses.filter((r) => r.savedAt > oneDayAgo);

    if (filtered.length !== responses.length) {
      localStorage.setItem(PARTIAL_RESPONSE_KEY, JSON.stringify(filtered));
      console.log(`[StreamHandler] 오래된 부분 응답 정리: ${responses.length - filtered.length}개`);
    }
  } catch {
    // 무시
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * 부분 메시지 생성
 *
 * 중단된 스트리밍에서 부분 콘텐츠로 메시지를 생성합니다.
 */
export function createPartialMessage(
  partialContent: string,
  originalMessageId?: string
): Partial<ChatMessage> {
  return {
    id: originalMessageId,
    role: 'assistant',
    content: partialContent,
    status: 'error',
    error: {
      code: 'STREAM_ABORTED',
      message: '스트리밍이 중단되었습니다.',
    },
  };
}

/**
 * 스트리밍 통계 계산
 */
export function calculateStreamStats(session: StreamSession): {
  duration: number;
  averageChunkInterval: number;
  charactersPerSecond: number;
} {
  const now = new Date();
  const duration = now.getTime() - session.startedAt.getTime();

  const averageChunkInterval =
    session.chunkCount > 1 ? duration / (session.chunkCount - 1) : 0;

  const charactersPerSecond =
    duration > 0 ? (session.content.length / duration) * 1000 : 0;

  return {
    duration,
    averageChunkInterval,
    charactersPerSecond,
  };
}

// ============================================
// Exports
// ============================================

export default {
  // Session Management
  createStreamSession,
  getStreamSession,
  updateStreamSession,
  closeStreamSession,
  abortStreamSession,
  abortAllSessions,

  // Classes
  ChunkBuffer,
  ConnectionMonitor,

  // Partial Response
  savePartialResponse,
  loadPartialResponse,
  clearPartialResponse,
  cleanupOldPartialResponses,

  // Utilities
  createPartialMessage,
  calculateStreamStats,
};
