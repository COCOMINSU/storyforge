/**
 * 대화창 헤더 컴포넌트
 *
 * 세션 정보, 제공자/모델 선택, 설정 버튼 등을 표시합니다.
 */

import { Settings, Trash2 } from 'lucide-react';
import { useAIStore, useUIStore } from '@/stores';
import { PROVIDER_MODELS, PROVIDER_INFO, getProviderFromModel } from '@/services/ai';
import { cn } from '@/lib/cn';
import type { AIModel, AIProvider } from '@/types';

/**
 * 세션 타입 표시 이름
 */
const SESSION_TYPE_LABELS: Record<string, string> = {
  general: '일반 대화',
  plot_setting: '줄거리 설정',
  character_setting: '인물 설정',
  writing_assist: '글쓰기 보조',
  world_building: '세계관 구축',
};

export function ChatHeader() {
  const {
    currentSession,
    config,
    setConfig,
    setProvider,
    clearMessages,
    todayUsage,
    usageLimits,
    hasProviderKey,
  } = useAIStore();
  const { openModal } = useUIStore();

  // 현재 제공자
  const currentProvider = config.provider;
  const providerModels = PROVIDER_MODELS[currentProvider];
  const hasKey = hasProviderKey(currentProvider);

  // 사용량 비율 계산
  const usageRatio = usageLimits.dailyTokenLimit
    ? todayUsage.tokens / usageLimits.dailyTokenLimit
    : 0;

  const isWarning = usageRatio >= (usageLimits.warningThreshold || 0.8);

  /**
   * 제공자 변경
   */
  const handleProviderChange = (provider: AIProvider) => {
    if (!hasProviderKey(provider)) {
      openModal('ai-settings');
      return;
    }

    setProvider(provider);
    // 해당 제공자의 첫 번째 모델 선택
    const firstModel = PROVIDER_MODELS[provider][0];
    if (firstModel) {
      setConfig({ model: firstModel.id });
    }
  };

  /**
   * 모델 변경
   */
  const handleModelChange = (model: AIModel) => {
    const provider = getProviderFromModel(model);
    if (provider !== currentProvider) {
      setProvider(provider);
    }
    setConfig({ model });
  };

  return (
    <div className="border-b border-border">
      {/* 메인 헤더 */}
      <div className="flex items-center justify-between p-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            AI 보조작가
          </h2>
          {currentSession && (
            <p className="text-xs text-muted-foreground">
              {SESSION_TYPE_LABELS[currentSession.type] || '대화'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* 메시지 클리어 */}
          {currentSession && currentSession.messages.length > 0 && (
            <button
              onClick={clearMessages}
              className={cn(
                'p-1.5 rounded-md',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-accent',
                'transition-colors'
              )}
              title="대화 내용 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* 설정 버튼 */}
          <button
            onClick={() => openModal('ai-settings')}
            className={cn(
              'p-1.5 rounded-md',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-accent',
              'transition-colors'
            )}
            title="AI 설정"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 제공자 & 모델 선택 */}
      <div className="px-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* 제공자 선택 */}
          <select
            value={currentProvider}
            onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
            className={cn(
              'text-xs bg-accent rounded px-2 py-1',
              'border-none focus:outline-none focus:ring-1 focus:ring-ring',
              'cursor-pointer flex-shrink-0'
            )}
          >
            {(Object.keys(PROVIDER_INFO) as AIProvider[]).map((provider) => {
              const info = PROVIDER_INFO[provider];
              const configured = hasProviderKey(provider);
              return (
                <option key={provider} value={provider}>
                  {info.name.split(' ')[0]} {configured ? '✓' : ''}
                </option>
              );
            })}
          </select>

          {/* 모델 선택 */}
          {hasKey && (
            <select
              value={config.model}
              onChange={(e) => handleModelChange(e.target.value as AIModel)}
              className={cn(
                'text-xs bg-accent rounded px-2 py-1',
                'border-none focus:outline-none focus:ring-1 focus:ring-ring',
                'cursor-pointer truncate min-w-0 flex-1'
              )}
            >
              {providerModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          )}

          {/* 키 미설정 시 안내 */}
          {!hasKey && (
            <button
              onClick={() => openModal('ai-settings')}
              className="text-xs text-yellow-500 hover:text-yellow-400 truncate"
            >
              API 키 설정 필요
            </button>
          )}
        </div>

        {/* 사용량 표시 */}
        <div
          className={cn(
            'text-xs flex-shrink-0',
            isWarning ? 'text-yellow-500' : 'text-muted-foreground'
          )}
          title={`오늘 사용량: ${todayUsage.tokens.toLocaleString()} 토큰 / $${todayUsage.cost.toFixed(4)}`}
        >
          {Math.round(usageRatio * 100)}%
        </div>
      </div>
    </div>
  );
}
