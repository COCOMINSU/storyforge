/**
 * 대화창 헤더 컴포넌트
 *
 * 세션 정보, 모델 선택, 설정 버튼 등을 표시합니다.
 */

import { Settings, Trash2 } from 'lucide-react';
import { useAIStore, useUIStore } from '@/stores';
import { cn } from '@/lib/cn';
import type { AIModel } from '@/types';

/**
 * 모델 표시 이름
 */
const MODEL_LABELS: Record<AIModel, string> = {
  'claude-opus-4-5-20251101': 'Claude Opus 4.5',
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-3-5-haiku-20241022': 'Claude Haiku 3.5',
};

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
    clearMessages,
    todayUsage,
    usageLimits,
  } = useAIStore();
  const { openModal } = useUIStore();

  // 사용량 비율 계산
  const usageRatio = usageLimits.dailyTokenLimit
    ? todayUsage.tokens / usageLimits.dailyTokenLimit
    : 0;

  const isWarning = usageRatio >= (usageLimits.warningThreshold || 0.8);

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

      {/* 모델 선택 & 사용량 */}
      <div className="px-3 pb-2 flex items-center justify-between">
        {/* 모델 선택 */}
        <select
          value={config.model}
          onChange={(e) => setConfig({ model: e.target.value as AIModel })}
          className={cn(
            'text-xs bg-accent rounded px-2 py-1',
            'border-none focus:outline-none focus:ring-1 focus:ring-ring',
            'cursor-pointer'
          )}
        >
          {Object.entries(MODEL_LABELS).map(([model, label]) => (
            <option key={model} value={model}>
              {label}
            </option>
          ))}
        </select>

        {/* 사용량 표시 */}
        <div
          className={cn(
            'text-xs',
            isWarning ? 'text-yellow-500' : 'text-muted-foreground'
          )}
          title={`오늘 사용량: ${todayUsage.tokens.toLocaleString()} 토큰 / $${todayUsage.cost.toFixed(4)}`}
        >
          {Math.round(usageRatio * 100)}% 사용
        </div>
      </div>
    </div>
  );
}
