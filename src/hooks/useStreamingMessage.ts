/**
 * 스트리밍 메시지 훅
 *
 * AI 스트리밍 응답을 관리하는 React 훅입니다.
 *
 * 주요 기능:
 * - 스트리밍 상태 관리
 * - 청크 버퍼링 및 렌더링 최적화
 * - 요청 취소 및 재시도
 * - 부분 응답 복구
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAIStore } from '@/stores';
import { sendMessageStream, calculateCost } from '@/services/ai/claudeClient';
import {
  createStreamSession,
  getStreamSession,
  closeStreamSession,
  abortStreamSession,
  ChunkBuffer,
  ConnectionMonitor,
  savePartialResponse,
  loadPartialResponse,
  clearPartialResponse,
  cleanupOldPartialResponses,
  calculateStreamStats,
  type StreamStatus,
  type StreamOptions,
} from '@/services/ai/streamHandler';
import type { ChatMessage, AIServiceError, AIConfig } from '@/types';
import { generateId } from '@/lib/id';

// ============================================
// Types
// ============================================

export interface UseStreamingMessageOptions extends StreamOptions {
  /** 세션 ID (기본: 자동 생성) */
  sessionId?: string;
  /** 자동 재시도 활성화 (기본: true) */
  autoRetry?: boolean;
  /** 최대 재시도 횟수 (기본: 2) */
  maxRetries?: number;
  /** 재시도 지연 (ms, 기본: 1000) */
  retryDelay?: number;
}

export interface UseStreamingMessageReturn {
  /** 현재 스트리밍 상태 */
  status: StreamStatus;
  /** 현재 스트리밍 중인 콘텐츠 */
  streamingContent: string;
  /** 에러 정보 */
  error: AIServiceError | null;
  /** 스트리밍 진행률 (추정치, 0-100) */
  progress: number;
  /** 스트리밍 시작 */
  startStream: (
    messages: ChatMessage[],
    systemPrompt?: string,
    config?: Partial<AIConfig>
  ) => Promise<ChatMessage | null>;
  /** 스트리밍 중단 */
  abortStream: () => void;
  /** 재시도 */
  retry: () => Promise<ChatMessage | null>;
  /** 부분 응답 복구 */
  recoverPartial: () => string | null;
  /** 상태 초기화 */
  reset: () => void;
}

// ============================================
// Constants
// ============================================

const DEFAULT_OPTIONS: Required<UseStreamingMessageOptions> = {
  sessionId: '',
  autoRetry: true,
  maxRetries: 2,
  retryDelay: 1000,
  chunkBufferSize: 5,
  chunkFlushInterval: 50,
  connectionTimeout: 30000,
  chunkTimeout: 60000,
};

// ============================================
// Hook Implementation
// ============================================

/**
 * 스트리밍 메시지 훅
 */
export function useStreamingMessage(
  options: UseStreamingMessageOptions = {}
): UseStreamingMessageReturn {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // 상태
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<AIServiceError | null>(null);
  const [progress, setProgress] = useState(0);

  // 스토어에서 config만 가져옴
  const config = useAIStore((state) => state.config);

  // Refs
  const sessionIdRef = useRef(mergedOptions.sessionId || generateId());
  const retryCountRef = useRef(0);
  const lastRequestRef = useRef<{
    messages: ChatMessage[];
    systemPrompt?: string;
    config?: Partial<AIConfig>;
  } | null>(null);
  const chunkBufferRef = useRef<ChunkBuffer | null>(null);
  const connectionMonitorRef = useRef<ConnectionMonitor | null>(null);

  // 초기화 시 오래된 부분 응답 정리
  useEffect(() => {
    cleanupOldPartialResponses();
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      closeStreamSession(sessionIdRef.current);
      chunkBufferRef.current?.clear();
      connectionMonitorRef.current?.cleanup();
    };
  }, []);

  /**
   * 상태 업데이트 함수
   */
  const updateStatus = useCallback((newStatus: StreamStatus) => {
    setStatus(newStatus);
  }, []);

  /**
   * 에러 처리
   */
  const handleError = useCallback(
    (err: AIServiceError) => {
      setError(err);
      updateStatus('error');

      // 부분 응답 저장
      const session = getStreamSession(sessionIdRef.current);
      if (session && session.content.length > 0) {
        savePartialResponse(sessionIdRef.current, session.content);
      }

      console.error('[useStreamingMessage] 에러:', err);
    },
    [updateStatus]
  );

  /**
   * 진행률 계산 (추정)
   */
  const calculateProgress = useCallback((contentLength: number): number => {
    // 평균 응답 길이를 기준으로 진행률 추정 (약 2000자 기준)
    const estimatedTotal = 2000;
    const calculatedProgress = Math.min((contentLength / estimatedTotal) * 100, 95);
    return Math.round(calculatedProgress);
  }, []);

  /**
   * 재시도 함수 (미리 정의)
   */
  const retryRef = useRef<() => Promise<ChatMessage | null>>();

  /**
   * 스트리밍 시작
   */
  const startStream = useCallback(
    async (
      messages: ChatMessage[],
      systemPrompt?: string,
      streamConfig?: Partial<AIConfig>
    ): Promise<ChatMessage | null> => {
      // 이전 세션 정리
      closeStreamSession(sessionIdRef.current);
      chunkBufferRef.current?.clear();
      connectionMonitorRef.current?.cleanup();

      // 새 세션 생성
      sessionIdRef.current = generateId();
      const session = createStreamSession(sessionIdRef.current);

      // 요청 저장 (재시도용)
      lastRequestRef.current = { messages, systemPrompt, config: streamConfig };

      // 상태 초기화
      setStreamingContent('');
      setError(null);
      setProgress(0);
      updateStatus('connecting');
      retryCountRef.current = 0;

      // 청크 버퍼 초기화
      chunkBufferRef.current = new ChunkBuffer(
        mergedOptions,
        (_bufferedChunk, accumulated) => {
          setStreamingContent(accumulated);
          setProgress(calculateProgress(accumulated.length));
        }
      );

      // 연결 모니터 초기화
      connectionMonitorRef.current = new ConnectionMonitor(
        mergedOptions,
        (timeoutType) => {
          const errMessage =
            timeoutType === 'connection'
              ? '연결 시간이 초과되었습니다.'
              : '응답 대기 시간이 초과되었습니다.';

          handleError({
            type: 'network_error',
            code: `${timeoutType.toUpperCase()}_TIMEOUT`,
            message: errMessage,
            retryable: true,
          });

          abortStreamSession(sessionIdRef.current);
        }
      );

      // 연결 타임아웃 시작
      connectionMonitorRef.current.startConnectionTimeout();

      const mergedConfig = { ...config, ...streamConfig };

      return new Promise((resolve) => {
        sendMessageStream(
          messages,
          systemPrompt,
          mergedConfig,
          {
            onStart: () => {
              connectionMonitorRef.current?.clearConnectionTimeout();
              updateStatus('streaming');
              session.status = 'streaming';
            },
            onToken: (token) => {
              connectionMonitorRef.current?.resetChunkTimeout();
              chunkBufferRef.current?.push(token);
              session.content += token;
              session.chunkCount++;
              session.lastChunkAt = new Date();
            },
            onComplete: (message, inputTokens, outputTokens) => {
              connectionMonitorRef.current?.cleanup();
              chunkBufferRef.current?.flush();
              setStreamingContent(message.content);
              setProgress(100);
              updateStatus('completed');

              // 부분 응답 삭제
              clearPartialResponse(sessionIdRef.current);

              // 비용 계산 로깅
              const cost = calculateCost(mergedConfig.model, inputTokens, outputTokens);

              // 통계 로깅
              const stats = calculateStreamStats(session);
              console.log(
                `[useStreamingMessage] 완료: ${stats.duration}ms, ${stats.charactersPerSecond.toFixed(1)} 글자/초, $${cost.toFixed(6)}`
              );

              resolve(message);
            },
            onError: (err) => {
              connectionMonitorRef.current?.cleanup();
              handleError(err);

              // 자동 재시도
              if (
                mergedOptions.autoRetry &&
                err.retryable &&
                retryCountRef.current < mergedOptions.maxRetries
              ) {
                retryCountRef.current++;
                console.log(
                  `[useStreamingMessage] 재시도 ${retryCountRef.current}/${mergedOptions.maxRetries}`
                );

                setTimeout(() => {
                  retryRef.current?.().then(resolve);
                }, mergedOptions.retryDelay * retryCountRef.current);
                return;
              }

              resolve(null);
            },
          }
        ).catch((err) => {
          handleError(err);
          resolve(null);
        });
      });
    },
    [
      config,
      mergedOptions,
      updateStatus,
      handleError,
      calculateProgress,
    ]
  );

  /**
   * 스트리밍 중단
   */
  const abortStream = useCallback(() => {
    const partialContent = abortStreamSession(sessionIdRef.current);

    // 부분 응답 저장
    if (partialContent.length > 0) {
      savePartialResponse(sessionIdRef.current, partialContent);
    }

    chunkBufferRef.current?.flush();
    connectionMonitorRef.current?.cleanup();
    updateStatus('aborted');

    console.log('[useStreamingMessage] 중단됨');
  }, [updateStatus]);

  /**
   * 재시도
   */
  const retry = useCallback(async (): Promise<ChatMessage | null> => {
    if (!lastRequestRef.current) {
      console.warn('[useStreamingMessage] 재시도할 요청이 없습니다.');
      return null;
    }

    const { messages, systemPrompt, config: reqConfig } = lastRequestRef.current;
    return startStream(messages, systemPrompt, reqConfig);
  }, [startStream]);

  // retryRef에 retry 함수 할당
  retryRef.current = retry;

  /**
   * 부분 응답 복구
   */
  const recoverPartial = useCallback((): string | null => {
    const partial = loadPartialResponse(sessionIdRef.current);
    if (partial) {
      setStreamingContent(partial.content);
      clearPartialResponse(sessionIdRef.current);
      console.log('[useStreamingMessage] 부분 응답 복구:', partial.content.length);
      return partial.content;
    }
    return null;
  }, []);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    closeStreamSession(sessionIdRef.current);
    chunkBufferRef.current?.clear();
    connectionMonitorRef.current?.cleanup();

    setStatus('idle');
    setStreamingContent('');
    setError(null);
    setProgress(0);
    retryCountRef.current = 0;
    lastRequestRef.current = null;

    sessionIdRef.current = generateId();
  }, []);

  return {
    status,
    streamingContent,
    error,
    progress,
    startStream,
    abortStream,
    retry,
    recoverPartial,
    reset,
  };
}

// ============================================
// Exports
// ============================================

export default useStreamingMessage;
