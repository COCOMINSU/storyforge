/**
 * AI Agent 헤더
 *
 * AI Agent 모드의 상단 헤더 컴포넌트입니다.
 * - 제목
 * - 모델 선택
 * - Gemini 캐시 상태
 * - 설정 버튼
 * - 새 대화 버튼
 * - 대화 기록 보기
 */

import { useState, useRef, useEffect } from 'react';
import { useAIStore, useUIStore, useProjectStore } from '@/stores';
import { PROVIDER_MODELS, getProviderFromModel } from '@/services/ai/unifiedClient';
import { formatRelativeTime } from '@/lib/dateUtils';

export function AIAgentHeader() {
  const {
    config,
    setConfig,
    currentSession,
    geminiCacheInfo,
    isCacheInitializing,
    refreshGeminiCache,
    getSessionsByProject,
    loadSession,
    createSession,
    lastClaudeCacheInfo,
  } = useAIStore();
  const { openModal, setAppMode } = useUIStore();
  const { currentProject } = useProjectStore();

  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  const currentProvider = config.provider;
  const availableModels = PROVIDER_MODELS[currentProvider] || [];
  const messages = currentSession?.messages || [];

  // 프로젝트의 모든 세션 가져오기
  const projectSessions = currentProject
    ? getSessionsByProject(currentProject.id).filter(s => s.messages.length > 0)
    : [];

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 제공자 확인
  const currentModelProvider = getProviderFromModel(config.model);
  const isGemini = currentModelProvider === 'google';
  const isClaude = currentModelProvider === 'anthropic';

  // 캐시 남은 시간 계산
  const getCacheRemainingTime = () => {
    if (!geminiCacheInfo) return null;
    const remaining = geminiCacheInfo.expiresAt.getTime() - Date.now();
    if (remaining <= 0) return null;
    const minutes = Math.floor(remaining / 60000);
    return `${minutes}분`;
  };

  const handleNewChat = () => {
    if (!currentProject) return;

    if (messages.length > 0) {
      if (confirm('새 대화를 시작하시겠습니까?\n현재 대화는 기록에 저장됩니다.')) {
        // 새 세션 생성 (기존 세션은 자동 저장됨)
        createSession(currentProject.id, 'world_building');
      }
    }
  };

  const handleLoadSession = (sessionId: string) => {
    loadSession(sessionId);
    setShowHistory(false);
  };

  const handleRefreshCache = async () => {
    if (!currentProject || isCacheInitializing) return;
    await refreshGeminiCache(currentProject.id);
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
      {/* 좌측: 제목 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h1 className="text-base font-semibold">AI 창작 보조</h1>
        </div>
        {currentProject && (
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {currentProject.title}
          </span>
        )}

        {/* Gemini 캐시 상태 */}
        {isGemini && (
          <div className="flex items-center gap-1.5 text-xs">
            {isCacheInitializing ? (
              <span className="flex items-center gap-1 text-yellow-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                캐시 준비 중...
              </span>
            ) : geminiCacheInfo ? (
              <span className="flex items-center gap-1 text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                캐시 활성 ({getCacheRemainingTime()} 남음)
                <span className="text-muted-foreground">
                  · {geminiCacheInfo.tokenCount.toLocaleString()} 토큰
                </span>
                <button
                  onClick={handleRefreshCache}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                  title="캐시 갱신"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                캐시 없음
              </span>
            )}
          </div>
        )}

        {/* Claude 캐시 상태 (Prompt Caching) */}
        {isClaude && lastClaudeCacheInfo && (
          <div className="flex items-center gap-1.5 text-xs">
            {lastClaudeCacheInfo.cacheReadTokens > 0 ? (
              <span className="flex items-center gap-1 text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                캐시 적중
                <span className="text-muted-foreground">
                  · {lastClaudeCacheInfo.cacheReadTokens.toLocaleString()} 토큰 절감
                </span>
              </span>
            ) : lastClaudeCacheInfo.cacheCreationTokens > 0 ? (
              <span className="flex items-center gap-1 text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                캐시 생성됨
                <span className="text-muted-foreground">
                  · {lastClaudeCacheInfo.cacheCreationTokens.toLocaleString()} 토큰
                </span>
              </span>
            ) : null}
          </div>
        )}
        {isClaude && !lastClaudeCacheInfo && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            자동 캐시 (1024+ 토큰)
          </div>
        )}
      </div>

      {/* 우측: 컨트롤 */}
      <div className="flex items-center gap-2">
        {/* 모델 선택 */}
        <select
          value={config.model}
          onChange={(e) => setConfig({ model: e.target.value as typeof config.model })}
          className="rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
        >
          {availableModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>

        {/* 대화 기록 */}
        <div className="relative" ref={historyRef}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="대화 기록"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* 기록 드롭다운 */}
          {showHistory && (
            <div className="absolute right-0 top-full mt-1 w-80 rounded-md border border-border bg-popover p-2 shadow-lg z-50">
              <div className="mb-2 flex items-center justify-between px-2">
                <span className="text-sm font-medium">대화 기록</span>
                <span className="text-xs text-muted-foreground">
                  {projectSessions.length}개
                </span>
              </div>

              {projectSessions.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  저장된 대화가 없습니다
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {projectSessions.map((session) => {
                    const isActive = currentSession?.id === session.id;
                    const firstUserMsg = session.messages.find(m => m.role === 'user');
                    const preview = firstUserMsg?.content.slice(0, 50) || '(비어있음)';

                    return (
                      <button
                        key={session.id}
                        onClick={() => handleLoadSession(session.id)}
                        className={`w-full rounded px-2 py-2 text-left transition-colors ${
                          isActive
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(session.updatedAt)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {session.messages.length}개 메시지
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm">
                          {preview}
                          {firstUserMsg && firstUserMsg.content.length > 50 && '...'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 새 대화 */}
        <button
          onClick={handleNewChat}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="새 대화"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {/* AI 설정 */}
        <button
          onClick={() => openModal('ai-settings')}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="AI 설정"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {/* 집필 모드로 전환 */}
        <button
          onClick={() => setAppMode('writing')}
          className="ml-2 flex items-center gap-1.5 rounded border border-border px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          title="집필 모드로 전환"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          <span>집필</span>
        </button>
      </div>
    </header>
  );
}
