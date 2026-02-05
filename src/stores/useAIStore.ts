/**
 * AI 상태 관리 스토어
 *
 * AI 대화 세션과 메시지를 관리합니다.
 *
 * 주요 기능:
 * - 대화 세션 관리
 * - 메시지 송수신
 * - 스트리밍 상태 관리
 * - 토큰 사용량 추적
 * - AI 설정 관리
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { generateId } from '@/lib/id';
import {
  sendMessage as sendUnifiedMessage,
  sendMessageStream,
  loadAllAPIKeys,
  saveAPIKey,
  clearAPIKey as clearStoredAPIKey,
  testConnection,
  calculateCost,
  hasAPIKey,
  getConfiguredProviders,
  getProviderFromModel,
  DEFAULT_AI_CONFIG,
  // Gemini Caching
  createGeminiCache,
  refreshGeminiCache as refreshGeminiCacheApi,
  deleteGeminiCache,
  getGeminiCacheInfo,
  isGeminiCacheValid,
} from '@/services/ai';
import type { GeminiCacheInfo } from '@/services/ai';
import {
  buildProjectContext,
  buildFullSystemPrompt,
  buildFullAgentContext,
  formatAgentSystemPrompt,
  optimizeHistoryForTokenBudget,
  DEFAULT_CONTEXT_BUDGET,
} from '@/services/ai/contextManager';
import { parseAgentResponse, applyStoryforgeUpdates } from '@/services/ai';
import type {
  ChatMessage,
  ChatSession,
  ConversationType,
  AIConfig,
  AIProvider,
  AIAPIKeys,
  UsageLimits,
  PlotSettingState,
  CharacterSettingState,
  AIServiceError,
} from '@/types';

// ============================================
// Types
// ============================================

interface AIState {
  /** 현재 활성 세션 */
  currentSession: ChatSession | null;

  /** 모든 세션 (sessionId -> session) */
  sessions: Record<string, ChatSession>;

  /** AI 응답 생성 중 여부 */
  isGenerating: boolean;

  /** 스트리밍 중인 콘텐츠 */
  streamingContent: string;

  /** AI 설정 */
  config: AIConfig;

  /** API 키 설정 여부 (현재 선택된 제공자) */
  apiKeySet: boolean;

  /** 제공자별 API 키 설정 여부 */
  apiKeys: AIAPIKeys;

  /** 오늘 사용량 */
  todayUsage: {
    date: string; // YYYY-MM-DD
    tokens: number;
    cost: number;
    requests: number;
  };

  /** 사용량 제한 설정 */
  usageLimits: UsageLimits;

  /** 줄거리 설정 모드 상태 */
  plotSettingState: PlotSettingState | null;

  /** 인물 설정 모드 상태 */
  characterSettingState: CharacterSettingState | null;

  /** 마지막 에러 */
  lastError: AIServiceError | null;

  /** Gemini 캐시 정보 (프로젝트별) */
  geminiCacheInfo: GeminiCacheInfo | null;

  /** 캐시 초기화 중 여부 */
  isCacheInitializing: boolean;
}

interface AIActions {
  // 세션 관리
  /** 새 세션 생성 */
  createSession: (projectId: string, type: ConversationType) => string;

  /** 세션 로드 */
  loadSession: (sessionId: string) => void;

  /** 현재 세션 닫기 */
  closeSession: () => void;

  /** 세션 삭제 */
  deleteSession: (sessionId: string) => void;

  /** 프로젝트의 모든 세션 가져오기 */
  getSessionsByProject: (projectId: string) => ChatSession[];

  // 메시지
  /** 메시지 전송 */
  sendMessage: (
    content: string,
    projectId: string,
    sceneId?: string
  ) => Promise<void>;

  /** AI Agent 모드 메시지 전송 (전체 컨텍스트 + 자동 업데이트) */
  sendAgentMessage: (
    content: string,
    projectId: string
  ) => Promise<void>;

  /** 생성 취소 */
  cancelGeneration: () => void;

  /** 메시지 클리어 */
  clearMessages: () => void;

  /** 메시지 재시도 */
  retryLastMessage: (projectId: string, sceneId?: string) => Promise<void>;

  // 설정
  /** AI 설정 변경 */
  setConfig: (config: Partial<AIConfig>) => void;

  /** 제공자 변경 */
  setProvider: (provider: AIProvider) => void;

  /** API 키 설정 (특정 제공자) */
  setAPIKey: (key: string, provider?: AIProvider) => Promise<boolean>;

  /** API 키 삭제 (특정 제공자) */
  clearAPIKey: (provider?: AIProvider) => void;

  /** 제공자별 API 키 설정 여부 확인 */
  hasProviderKey: (provider: AIProvider) => boolean;

  /** 설정된 제공자 목록 */
  getConfiguredProviders: () => AIProvider[];

  /** 사용량 제한 설정 */
  setUsageLimits: (limits: Partial<UsageLimits>) => void;

  // 특수 모드
  /** 줄거리 설정 모드 시작 */
  startPlotSetting: (projectId: string) => void;

  /** 줄거리 설정 상태 업데이트 */
  updatePlotSettingState: (state: Partial<PlotSettingState>) => void;

  /** 줄거리 설정 완료 */
  completePlotSetting: () => void;

  /** 인물 설정 모드 시작 */
  startCharacterSetting: (projectId: string, characterId?: string) => void;

  /** 인물 설정 상태 업데이트 */
  updateCharacterSettingState: (state: Partial<CharacterSettingState>) => void;

  /** 인물 설정 완료 */
  completeCharacterSetting: () => void;

  // 유틸리티
  /** 사용량 제한 초과 여부 */
  isOverUsageLimit: () => boolean;

  /** 에러 클리어 */
  clearError: () => void;

  /** 오늘 사용량 리셋 (날짜 변경 시) */
  resetDailyUsageIfNeeded: () => void;

  // Gemini 캐싱
  /** Gemini 캐시 초기화 (AI Agent 모드 진입 시) */
  initializeGeminiCache: (projectId: string) => Promise<void>;

  /** Gemini 캐시 갱신 (프로젝트 데이터 변경 시) */
  refreshGeminiCache: (projectId: string) => Promise<void>;

  /** Gemini 캐시 삭제 */
  clearGeminiCache: (projectId: string) => Promise<void>;

  /** Gemini 캐시 상태 확인 */
  checkGeminiCache: (projectId: string) => GeminiCacheInfo | null;
}

type AIStore = AIState & AIActions;

// ============================================
// Constants
// ============================================

const DEFAULT_USAGE_LIMITS: UsageLimits = {
  dailyTokenLimit: 100000,
  dailyCostLimit: 5.0,
  warningThreshold: 0.8,
};

/**
 * 세션 타입별 기본 제목
 */
function getSessionTitle(type: ConversationType): string {
  const titles: Record<ConversationType, string> = {
    general: '일반 대화',
    plot_setting: '줄거리 설정',
    character_setting: '인물 설정',
    writing_assist: '글쓰기 보조',
    world_building: '세계관 구축',
  };
  return titles[type] || '대화';
}

/**
 * 세션 타입별 추가 시스템 지침
 */
function getAdditionalInstructionsForType(type: ConversationType): string {
  const instructions: Record<ConversationType, string> = {
    general: '',
    plot_setting: `당신은 지금 줄거리 설정을 도와주고 있습니다.
- 작가가 아이디어를 구체화하도록 질문하세요.
- 장르의 관습과 독자 취향을 고려하세요.
- 플롯 구조(기-승-전-결)를 제안하세요.`,
    character_setting: `당신은 지금 인물 설정을 도와주고 있습니다.
- 캐릭터의 개성이 드러나도록 구체적인 질문을 하세요.
- 다른 인물과의 관계도 고려하세요.
- 성장 아크를 함께 설계하세요.`,
    writing_assist: `당신은 지금 글쓰기를 직접 도와주고 있습니다.
- 현재 씬의 맥락을 파악하고 이어쓰기를 제안하세요.
- 대사나 묘사를 개선하는 방안을 제시하세요.
- 문체와 톤을 유지하세요.`,
    world_building: `당신은 지금 세계관 구축을 도와주고 있습니다.
- 일관성 있는 세계관을 설계하도록 도와주세요.
- 마법 체계, 정치, 문화 등을 고려하세요.
- 기존 설정과 모순되지 않도록 주의하세요.`,
  };
  return instructions[type] || '';
}

/**
 * 오늘 날짜 문자열 (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================
// Store
// ============================================

/**
 * AI 스토어
 *
 * AI 대화 기능의 모든 상태를 관리합니다.
 * 설정과 세션 데이터는 localStorage에 저장됩니다.
 *
 * @example
 * const { currentSession, sendMessage, isGenerating } = useAIStore();
 *
 * // 메시지 전송
 * await sendMessage('안녕하세요', projectId);
 */
export const useAIStore = create<AIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        currentSession: null,
        sessions: {},
        isGenerating: false,
        streamingContent: '',
        config: DEFAULT_AI_CONFIG,
        apiKeySet: hasAPIKey(DEFAULT_AI_CONFIG.provider),
        apiKeys: loadAllAPIKeys(),
        todayUsage: {
          date: getTodayDateString(),
          tokens: 0,
          cost: 0,
          requests: 0,
        },
        usageLimits: DEFAULT_USAGE_LIMITS,
        plotSettingState: null,
        characterSettingState: null,
        lastError: null,
        geminiCacheInfo: null,
        isCacheInitializing: false,

        // ============================================
        // 세션 관리
        // ============================================

        createSession: (projectId, type) => {
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

          set((state) => ({
            sessions: { ...state.sessions, [id]: session },
            currentSession: session,
          }));

          console.log(`[AIStore] 새 세션 생성: ${id} (${type})`);
          return id;
        },

        loadSession: (sessionId) => {
          const session = get().sessions[sessionId];
          if (session) {
            set({ currentSession: session });
            console.log(`[AIStore] 세션 로드: ${sessionId}`);
          }
        },

        closeSession: () => {
          set({ currentSession: null });
        },

        deleteSession: (sessionId) => {
          set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [sessionId]: _, ...remaining } = state.sessions;
            return {
              sessions: remaining,
              currentSession:
                state.currentSession?.id === sessionId
                  ? null
                  : state.currentSession,
            };
          });
          console.log(`[AIStore] 세션 삭제: ${sessionId}`);
        },

        getSessionsByProject: (projectId) => {
          return Object.values(get().sessions)
            .filter((s) => s.projectId === projectId)
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            );
        },

        // ============================================
        // 메시지
        // ============================================

        sendMessage: async (content, projectId, sceneId) => {
          const { currentSession, config, isGenerating } = get();

          if (isGenerating) {
            console.warn('[AIStore] 이미 생성 중입니다.');
            return;
          }

          // 사용량 제한 체크
          get().resetDailyUsageIfNeeded();
          if (get().isOverUsageLimit()) {
            const error: AIServiceError = {
              type: 'rate_limit',
              code: 'DAILY_LIMIT_EXCEEDED',
              message: '일일 사용량 제한에 도달했습니다.',
              retryable: false,
            };
            set({ lastError: error });
            throw new Error(error.message);
          }

          // 사용자 메시지 생성
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
            model: config.model,
          };

          // 세션 업데이트
          const updatedMessages = [
            ...(currentSession?.messages || []),
            userMessage,
            assistantMessage,
          ];

          set((state) => ({
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  messages: updatedMessages,
                  updatedAt: new Date(),
                }
              : null,
            isGenerating: true,
            streamingContent: '',
            lastError: null,
          }));

          try {
            // 맥락 구축
            const context = await buildProjectContext(projectId, sceneId);
            const additionalInstructions = getAdditionalInstructionsForType(
              currentSession?.type || 'general'
            );
            const systemPrompt = buildFullSystemPrompt(
              context,
              additionalInstructions
            );

            // 히스토리 최적화 (토큰 예산 내로)
            const optimizedHistory = optimizeHistoryForTokenBudget(
              updatedMessages.slice(0, -1), // assistant placeholder 제외
              DEFAULT_CONTEXT_BUDGET.history
            );

            if (config.streamEnabled) {
              // 스트리밍 모드
              await sendMessageStream(
                optimizedHistory,
                systemPrompt,
                config,
                {
                  onStart: () => {
                    console.log('[AIStore] 스트리밍 시작');
                  },
                  onToken: (token) => {
                    set((state) => ({
                      streamingContent: state.streamingContent + token,
                    }));
                  },
                  onComplete: (message, inputTokens, outputTokens) => {
                    const cost = calculateCost(
                      config.model,
                      inputTokens,
                      outputTokens
                    );

                    set((state) => {
                      // 완료된 메시지로 교체
                      const messages = state.currentSession?.messages || [];
                      const updatedMsgs = messages.map((m) =>
                        m.id === assistantMessage.id
                          ? {
                              ...message,
                              id: assistantMessage.id,
                              tokenCount: outputTokens,
                            }
                          : m
                      );

                      // 세션 통계 업데이트
                      const totalTokens =
                        (state.currentSession?.stats.totalTokens || 0) +
                        inputTokens +
                        outputTokens;

                      // 오늘 사용량 업데이트
                      const todayUsage = {
                        ...state.todayUsage,
                        tokens: state.todayUsage.tokens + inputTokens + outputTokens,
                        cost: state.todayUsage.cost + cost,
                        requests: state.todayUsage.requests + 1,
                      };

                      return {
                        currentSession: state.currentSession
                          ? {
                              ...state.currentSession,
                              messages: updatedMsgs,
                              stats: {
                                messageCount: updatedMsgs.length,
                                totalTokens,
                                estimatedCost:
                                  (state.currentSession.stats.estimatedCost || 0) +
                                  cost,
                              },
                              updatedAt: new Date(),
                            }
                          : null,
                        sessions: state.currentSession
                          ? {
                              ...state.sessions,
                              [state.currentSession.id]: {
                                ...state.currentSession,
                                messages: updatedMsgs,
                                stats: {
                                  messageCount: updatedMsgs.length,
                                  totalTokens,
                                  estimatedCost:
                                    (state.currentSession.stats.estimatedCost || 0) +
                                    cost,
                                },
                                updatedAt: new Date(),
                              },
                            }
                          : state.sessions,
                        isGenerating: false,
                        streamingContent: '',
                        todayUsage,
                      };
                    });

                    console.log(
                      `[AIStore] 응답 완료: ${inputTokens + outputTokens} tokens, $${cost.toFixed(6)}`
                    );
                  },
                  onError: (error) => {
                    set((state) => {
                      // 에러 발생 시 assistant 메시지 상태 업데이트
                      const messages = state.currentSession?.messages || [];
                      const updatedMsgs = messages.map((m) =>
                        m.id === assistantMessage.id
                          ? {
                              ...m,
                              status: 'error' as const,
                              error: { code: error.code, message: error.message },
                            }
                          : m
                      );

                      return {
                        currentSession: state.currentSession
                          ? { ...state.currentSession, messages: updatedMsgs }
                          : null,
                        isGenerating: false,
                        streamingContent: '',
                        lastError: error,
                      };
                    });
                  },
                }
              );
            } else {
              // 일반 모드 (스트리밍 없이)
              const result = await sendUnifiedMessage(
                optimizedHistory,
                systemPrompt,
                config
              );

              const cost = calculateCost(
                config.model,
                result.inputTokens,
                result.outputTokens
              );

              set((state) => {
                const messages = state.currentSession?.messages || [];
                const updatedMsgs = messages.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...result.message, id: assistantMessage.id }
                    : m
                );

                const totalTokens =
                  (state.currentSession?.stats.totalTokens || 0) +
                  result.inputTokens +
                  result.outputTokens;

                const todayUsage = {
                  ...state.todayUsage,
                  tokens:
                    state.todayUsage.tokens +
                    result.inputTokens +
                    result.outputTokens,
                  cost: state.todayUsage.cost + cost,
                  requests: state.todayUsage.requests + 1,
                };

                return {
                  currentSession: state.currentSession
                    ? {
                        ...state.currentSession,
                        messages: updatedMsgs,
                        stats: {
                          messageCount: updatedMsgs.length,
                          totalTokens,
                          estimatedCost:
                            (state.currentSession.stats.estimatedCost || 0) + cost,
                        },
                        updatedAt: new Date(),
                      }
                    : null,
                  sessions: state.currentSession
                    ? {
                        ...state.sessions,
                        [state.currentSession.id]: {
                          ...state.currentSession,
                          messages: updatedMsgs,
                          stats: {
                            messageCount: updatedMsgs.length,
                            totalTokens,
                            estimatedCost:
                              (state.currentSession.stats.estimatedCost || 0) + cost,
                          },
                          updatedAt: new Date(),
                        },
                      }
                    : state.sessions,
                  isGenerating: false,
                  todayUsage,
                };
              });
            }
          } catch (error) {
            console.error('[AIStore] 메시지 전송 실패:', error);

            // 에러 상태로 업데이트
            set((state) => {
              const messages = state.currentSession?.messages || [];
              const updatedMsgs = messages.map((m) =>
                m.id === assistantMessage.id
                  ? {
                      ...m,
                      status: 'error' as const,
                      error: {
                        code: 'UNKNOWN_ERROR',
                        message:
                          error instanceof Error
                            ? error.message
                            : '알 수 없는 오류가 발생했습니다.',
                      },
                    }
                  : m
              );

              return {
                currentSession: state.currentSession
                  ? { ...state.currentSession, messages: updatedMsgs }
                  : null,
                isGenerating: false,
                streamingContent: '',
              };
            });

            throw error;
          }
        },

        /**
         * AI Agent 모드 메시지 전송
         * - 전체 프로젝트 컨텍스트 사용
         * - 응답에서 storyforge-update 블록 자동 적용
         */
        sendAgentMessage: async (content, projectId) => {
          const { currentSession, config, isGenerating } = get();

          if (isGenerating) {
            console.warn('[AIStore] 이미 생성 중입니다.');
            return;
          }

          // 사용량 제한 체크
          get().resetDailyUsageIfNeeded();
          if (get().isOverUsageLimit()) {
            const error: AIServiceError = {
              type: 'rate_limit',
              code: 'DAILY_LIMIT_EXCEEDED',
              message: '일일 사용량 제한에 도달했습니다.',
              retryable: false,
            };
            set({ lastError: error });
            throw new Error(error.message);
          }

          // 사용자 메시지 생성
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
            model: config.model,
          };

          // 세션 업데이트
          const updatedMessages = [
            ...(currentSession?.messages || []),
            userMessage,
            assistantMessage,
          ];

          set((state) => ({
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  messages: updatedMessages,
                  updatedAt: new Date(),
                }
              : null,
            isGenerating: true,
            streamingContent: '',
            lastError: null,
          }));

          try {
            // Gemini 사용 시 캐시 확인/초기화
            const provider = getProviderFromModel(config.model);
            const useGeminiCache = provider === 'google';
            let systemPrompt = '';

            if (useGeminiCache) {
              // Gemini: 캐시 사용 (캐시가 없으면 초기화)
              if (!isGeminiCacheValid(projectId)) {
                console.log('[AIStore] Gemini 캐시 초기화 중...');
                await get().initializeGeminiCache(projectId);
              } else {
                console.log('[AIStore] 기존 Gemini 캐시 사용');
              }
              // 캐시 사용 시 시스템 프롬프트는 캐시에 포함됨
              systemPrompt = '';
            } else {
              // Claude/GPT: 매번 컨텍스트 구축
              console.log('[AIStore] 전체 에이전트 컨텍스트 구축 중...');
              const fullContext = await buildFullAgentContext(projectId);
              systemPrompt = formatAgentSystemPrompt(fullContext);

              console.log('[AIStore] 에이전트 컨텍스트 구축 완료:', {
                characters: fullContext.allCharacters.length,
                locations: fullContext.allLocations.length,
                relationships: fullContext.characterRelationships.length,
              });
            }

            // 히스토리 최적화 (토큰 예산 내로)
            const optimizedHistory = optimizeHistoryForTokenBudget(
              updatedMessages.slice(0, -1), // assistant placeholder 제외
              DEFAULT_CONTEXT_BUDGET.history
            );

            // 응답 처리를 위한 전체 응답 저장
            let fullResponse = '';

            if (config.streamEnabled) {
              // 스트리밍 모드 (Gemini 캐시 사용 시 projectId 전달)
              await sendMessageStream(
                optimizedHistory,
                systemPrompt || undefined,
                config,
                {
                  onStart: () => {
                    console.log('[AIStore] 에이전트 스트리밍 시작');
                  },
                  onToken: (token) => {
                    fullResponse += token;
                    set((state) => ({
                      streamingContent: state.streamingContent + token,
                    }));
                  },
                  onComplete: async (message, inputTokens, outputTokens) => {
                    const cost = calculateCost(
                      config.model,
                      inputTokens,
                      outputTokens
                    );

                    // 응답 파싱 (업데이트 블록 추출)
                    const parsed = parseAgentResponse(message.content);
                    console.log('[AIStore] 응답 파싱 완료:', {
                      displayTextLength: parsed.displayText.length,
                      updateCount: parsed.updates.length,
                    });

                    // 업데이트 블록이 있으면 자동 적용
                    if (parsed.updates.length > 0) {
                      console.log('[AIStore] 자동 업데이트 적용 중...');
                      const updateResults = await applyStoryforgeUpdates(
                        parsed.updates,
                        projectId
                      );
                      console.log('[AIStore] 업데이트 결과:', updateResults);
                    }

                    set((state) => {
                      // 완료된 메시지로 교체 (업데이트 블록 제거된 텍스트 사용)
                      const messages = state.currentSession?.messages || [];
                      const updatedMsgs = messages.map((m) =>
                        m.id === assistantMessage.id
                          ? {
                              ...message,
                              content: parsed.displayText, // 업데이트 블록 제거된 텍스트
                              id: assistantMessage.id,
                              tokenCount: outputTokens,
                            }
                          : m
                      );

                      // 세션 통계 업데이트
                      const totalTokens =
                        (state.currentSession?.stats.totalTokens || 0) +
                        inputTokens +
                        outputTokens;

                      // 오늘 사용량 업데이트
                      const todayUsage = {
                        ...state.todayUsage,
                        tokens: state.todayUsage.tokens + inputTokens + outputTokens,
                        cost: state.todayUsage.cost + cost,
                        requests: state.todayUsage.requests + 1,
                      };

                      return {
                        currentSession: state.currentSession
                          ? {
                              ...state.currentSession,
                              messages: updatedMsgs,
                              stats: {
                                messageCount: updatedMsgs.length,
                                totalTokens,
                                estimatedCost:
                                  (state.currentSession.stats.estimatedCost || 0) +
                                  cost,
                              },
                              updatedAt: new Date(),
                            }
                          : null,
                        sessions: state.currentSession
                          ? {
                              ...state.sessions,
                              [state.currentSession.id]: {
                                ...state.currentSession,
                                messages: updatedMsgs,
                                stats: {
                                  messageCount: updatedMsgs.length,
                                  totalTokens,
                                  estimatedCost:
                                    (state.currentSession.stats.estimatedCost || 0) +
                                    cost,
                                },
                                updatedAt: new Date(),
                              },
                            }
                          : state.sessions,
                        isGenerating: false,
                        streamingContent: '',
                        todayUsage,
                      };
                    });

                    console.log(
                      `[AIStore] 에이전트 응답 완료: ${inputTokens + outputTokens} tokens, $${cost.toFixed(6)}`
                    );
                  },
                  onError: (error) => {
                    set((state) => {
                      const messages = state.currentSession?.messages || [];
                      const updatedMsgs = messages.map((m) =>
                        m.id === assistantMessage.id
                          ? {
                              ...m,
                              status: 'error' as const,
                              error: { code: error.code, message: error.message },
                            }
                          : m
                      );

                      return {
                        currentSession: state.currentSession
                          ? { ...state.currentSession, messages: updatedMsgs }
                          : null,
                        isGenerating: false,
                        streamingContent: '',
                        lastError: error,
                      };
                    });
                  },
                },
                useGeminiCache ? projectId : undefined  // Gemini 캐시용 projectId
              );
            } else {
              // 일반 모드 (스트리밍 없이)
              const result = await sendUnifiedMessage(
                optimizedHistory,
                systemPrompt || undefined,
                config,
                useGeminiCache ? projectId : undefined  // Gemini 캐시용 projectId
              );

              // 응답 파싱
              const parsed = parseAgentResponse(result.message.content);

              // 업데이트 블록이 있으면 자동 적용
              if (parsed.updates.length > 0) {
                console.log('[AIStore] 자동 업데이트 적용 중...');
                await applyStoryforgeUpdates(parsed.updates, projectId);
              }

              const cost = calculateCost(
                config.model,
                result.inputTokens,
                result.outputTokens
              );

              set((state) => {
                const messages = state.currentSession?.messages || [];
                const updatedMsgs = messages.map((m) =>
                  m.id === assistantMessage.id
                    ? {
                        ...result.message,
                        content: parsed.displayText,
                        id: assistantMessage.id,
                      }
                    : m
                );

                const totalTokens =
                  (state.currentSession?.stats.totalTokens || 0) +
                  result.inputTokens +
                  result.outputTokens;

                const todayUsage = {
                  ...state.todayUsage,
                  tokens:
                    state.todayUsage.tokens +
                    result.inputTokens +
                    result.outputTokens,
                  cost: state.todayUsage.cost + cost,
                  requests: state.todayUsage.requests + 1,
                };

                return {
                  currentSession: state.currentSession
                    ? {
                        ...state.currentSession,
                        messages: updatedMsgs,
                        stats: {
                          messageCount: updatedMsgs.length,
                          totalTokens,
                          estimatedCost:
                            (state.currentSession.stats.estimatedCost || 0) + cost,
                        },
                        updatedAt: new Date(),
                      }
                    : null,
                  sessions: state.currentSession
                    ? {
                        ...state.sessions,
                        [state.currentSession.id]: {
                          ...state.currentSession,
                          messages: updatedMsgs,
                          stats: {
                            messageCount: updatedMsgs.length,
                            totalTokens,
                            estimatedCost:
                              (state.currentSession.stats.estimatedCost || 0) + cost,
                          },
                          updatedAt: new Date(),
                        },
                      }
                    : state.sessions,
                  isGenerating: false,
                  todayUsage,
                };
              });
            }
          } catch (error) {
            console.error('[AIStore] 에이전트 메시지 전송 실패:', error);

            set((state) => {
              const messages = state.currentSession?.messages || [];
              const updatedMsgs = messages.map((m) =>
                m.id === assistantMessage.id
                  ? {
                      ...m,
                      status: 'error' as const,
                      error: {
                        code: 'UNKNOWN_ERROR',
                        message:
                          error instanceof Error
                            ? error.message
                            : '알 수 없는 오류가 발생했습니다.',
                      },
                    }
                  : m
              );

              return {
                currentSession: state.currentSession
                  ? { ...state.currentSession, messages: updatedMsgs }
                  : null,
                isGenerating: false,
                streamingContent: '',
              };
            });

            throw error;
          }
        },

        cancelGeneration: () => {
          // 현재는 스트리밍 취소가 SDK에서 직접 지원되지 않음
          // 향후 AbortController 지원 시 구현
          console.log('[AIStore] 생성 취소 요청');
          set({ isGenerating: false, streamingContent: '' });
        },

        clearMessages: () => {
          set((state) => ({
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  messages: [],
                  stats: { messageCount: 0, totalTokens: 0, estimatedCost: 0 },
                  updatedAt: new Date(),
                }
              : null,
          }));
        },

        retryLastMessage: async (projectId, sceneId) => {
          const { currentSession } = get();
          if (!currentSession || currentSession.messages.length < 2) return;

          // 마지막 user 메시지 찾기
          const messages = currentSession.messages;
          let lastUserIndex = -1;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
              lastUserIndex = i;
              break;
            }
          }

          if (lastUserIndex === -1) return;

          const lastUserMessage = messages[lastUserIndex];

          // 마지막 user 메시지와 그 이후의 assistant 메시지 제거
          const truncatedMessages = messages.slice(0, lastUserIndex);

          set((state) => ({
            currentSession: state.currentSession
              ? { ...state.currentSession, messages: truncatedMessages }
              : null,
          }));

          // 다시 전송
          await get().sendMessage(lastUserMessage.content, projectId, sceneId);
        },

        // ============================================
        // 설정
        // ============================================

        setConfig: (config) => {
          set((state) => {
            const newConfig = { ...state.config, ...config };
            // 제공자가 변경되면 해당 제공자의 API 키 설정 여부 업데이트
            const apiKeySet = config.provider
              ? hasAPIKey(config.provider)
              : state.apiKeySet;
            return { config: newConfig, apiKeySet };
          });
        },

        setProvider: (provider) => {
          set((state) => ({
            config: { ...state.config, provider },
            apiKeySet: hasAPIKey(provider),
          }));
          console.log(`[AIStore] 제공자 변경: ${provider}`);
        },

        setAPIKey: async (key, provider) => {
          const targetProvider = provider || get().config.provider;
          const result = await testConnection(targetProvider, key);

          if (result.success) {
            saveAPIKey(targetProvider, key);
            const apiKeys = loadAllAPIKeys();
            const apiKeySet = targetProvider === get().config.provider ? true : get().apiKeySet;
            set({ apiKeySet, apiKeys, lastError: null });
            console.log(`[AIStore] ${targetProvider} API 키 설정 완료`);
            return true;
          } else {
            console.error(`[AIStore] ${targetProvider} API 키 검증 실패:`, result.error);
            return false;
          }
        },

        clearAPIKey: (provider) => {
          const targetProvider = provider || get().config.provider;
          clearStoredAPIKey(targetProvider);
          const apiKeys = loadAllAPIKeys();
          const apiKeySet = targetProvider === get().config.provider ? false : get().apiKeySet;
          set({ apiKeySet, apiKeys });
          console.log(`[AIStore] ${targetProvider} API 키 삭제됨`);
        },

        hasProviderKey: (provider) => {
          return hasAPIKey(provider);
        },

        getConfiguredProviders: () => {
          return getConfiguredProviders();
        },

        setUsageLimits: (limits) => {
          set((state) => ({
            usageLimits: { ...state.usageLimits, ...limits },
          }));
        },

        // ============================================
        // 특수 모드
        // ============================================

        startPlotSetting: (projectId) => {
          const sessionId = get().createSession(projectId, 'plot_setting');

          set({
            plotSettingState: {
              currentStep: 'genre_selection',
              completedSteps: [],
              data: {},
            },
          });

          console.log(`[AIStore] 줄거리 설정 모드 시작: ${sessionId}`);
        },

        updatePlotSettingState: (state) => {
          set((prev) => ({
            plotSettingState: prev.plotSettingState
              ? {
                  ...prev.plotSettingState,
                  ...state,
                  data: { ...prev.plotSettingState.data, ...state.data },
                }
              : null,
          }));
        },

        completePlotSetting: () => {
          set({ plotSettingState: null });
          console.log('[AIStore] 줄거리 설정 완료');
        },

        startCharacterSetting: (projectId, characterId) => {
          const sessionId = get().createSession(projectId, 'character_setting');

          set({
            characterSettingState: {
              currentStep: 'basic_info',
              completedSteps: [],
              targetCharacterId: characterId,
              data: {},
            },
          });

          console.log(`[AIStore] 인물 설정 모드 시작: ${sessionId}`);
        },

        updateCharacterSettingState: (state) => {
          set((prev) => ({
            characterSettingState: prev.characterSettingState
              ? {
                  ...prev.characterSettingState,
                  ...state,
                  data: { ...prev.characterSettingState.data, ...state.data },
                }
              : null,
          }));
        },

        completeCharacterSetting: () => {
          set({ characterSettingState: null });
          console.log('[AIStore] 인물 설정 완료');
        },

        // ============================================
        // 유틸리티
        // ============================================

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

        clearError: () => {
          set({ lastError: null });
        },

        resetDailyUsageIfNeeded: () => {
          const today = getTodayDateString();
          const { todayUsage } = get();

          if (todayUsage.date !== today) {
            set({
              todayUsage: {
                date: today,
                tokens: 0,
                cost: 0,
                requests: 0,
              },
            });
            console.log('[AIStore] 일일 사용량 리셋');
          }
        },

        // ============================================
        // Gemini 캐싱
        // ============================================

        initializeGeminiCache: async (projectId) => {
          const { config } = get();
          const provider = getProviderFromModel(config.model);

          // Gemini가 아니면 캐싱 불필요
          if (provider !== 'google') {
            console.log('[AIStore] Gemini가 아니므로 캐싱 건너뜀');
            return;
          }

          // 이미 유효한 캐시가 있는지 확인
          if (isGeminiCacheValid(projectId)) {
            const existingCache = getGeminiCacheInfo(projectId);
            set({ geminiCacheInfo: existingCache });
            console.log('[AIStore] 기존 Gemini 캐시 사용:', existingCache?.name);
            return;
          }

          set({ isCacheInitializing: true });

          try {
            // 전체 컨텍스트 구축
            const fullContext = await buildFullAgentContext(projectId);
            const systemPrompt = formatAgentSystemPrompt(fullContext);

            // 캐시 생성
            const cacheInfo = await createGeminiCache(
              projectId,
              systemPrompt,
              config.model as 'gemini-2.5-pro' | 'gemini-2.5-flash-lite' | 'gemini-3-pro'
            );

            set({ geminiCacheInfo: cacheInfo, isCacheInitializing: false });
            console.log('[AIStore] Gemini 캐시 생성 완료:', cacheInfo.name);
          } catch (error) {
            console.error('[AIStore] Gemini 캐시 생성 실패:', error);
            set({ isCacheInitializing: false });
            // 캐싱 실패해도 대화는 계속 가능 (캐시 없이 진행)
          }
        },

        refreshGeminiCache: async (projectId) => {
          const { config } = get();
          const provider = getProviderFromModel(config.model);

          if (provider !== 'google') return;

          set({ isCacheInitializing: true });

          try {
            const fullContext = await buildFullAgentContext(projectId);
            const systemPrompt = formatAgentSystemPrompt(fullContext);

            const cacheInfo = await refreshGeminiCacheApi(
              projectId,
              systemPrompt,
              config.model as 'gemini-2.5-pro' | 'gemini-2.5-flash-lite' | 'gemini-3-pro'
            );

            set({ geminiCacheInfo: cacheInfo, isCacheInitializing: false });
            console.log('[AIStore] Gemini 캐시 갱신 완료:', cacheInfo.name);
          } catch (error) {
            console.error('[AIStore] Gemini 캐시 갱신 실패:', error);
            set({ isCacheInitializing: false });
          }
        },

        clearGeminiCache: async (projectId) => {
          try {
            await deleteGeminiCache(projectId);
            set({ geminiCacheInfo: null });
            console.log('[AIStore] Gemini 캐시 삭제 완료');
          } catch (error) {
            console.error('[AIStore] Gemini 캐시 삭제 실패:', error);
          }
        },

        checkGeminiCache: (projectId) => {
          return getGeminiCacheInfo(projectId);
        },
      }),
      {
        name: 'storyforge-ai',
        // 저장할 상태 선택
        partialize: (state) => ({
          sessions: state.sessions,
          config: state.config,
          todayUsage: state.todayUsage,
          usageLimits: state.usageLimits,
        }),
      }
    ),
    { name: 'AIStore' }
  )
);

/**
 * AI 스토어 초기화 (앱 시작 시 호출)
 */
export function initializeAIStore(): void {
  const { resetDailyUsageIfNeeded } = useAIStore.getState();
  resetDailyUsageIfNeeded();
  console.log('[AIStore] 초기화 완료');
}
