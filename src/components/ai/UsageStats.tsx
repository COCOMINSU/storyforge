/**
 * 사용량 통계 컴포넌트
 *
 * AI API 토큰 사용량과 비용을 표시합니다.
 */

import { BarChart3, DollarSign, Zap, AlertTriangle } from 'lucide-react';
import { useAIStore } from '@/stores';
import { cn } from '@/lib/cn';

interface UsageStatsProps {
  /** 컴팩트 모드 (헤더용) */
  compact?: boolean;
}

/**
 * 사용량 통계
 */
export function UsageStats({ compact = false }: UsageStatsProps) {
  const { todayUsage, usageLimits, config } = useAIStore();

  // 사용량 비율 계산
  const tokenRatio = usageLimits.dailyTokenLimit
    ? todayUsage.tokens / usageLimits.dailyTokenLimit
    : 0;

  const costRatio = usageLimits.dailyCostLimit
    ? todayUsage.cost / usageLimits.dailyCostLimit
    : 0;

  const maxRatio = Math.max(tokenRatio, costRatio);
  const isWarning = maxRatio >= (usageLimits.warningThreshold || 0.8);
  const isOver = maxRatio >= 1;

  if (compact) {
    return (
      <div
        className={cn(
          'text-xs px-2 py-1 rounded flex items-center gap-1',
          isOver
            ? 'bg-destructive/10 text-destructive'
            : isWarning
              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
              : 'bg-muted text-muted-foreground'
        )}
        title={`오늘 사용량: ${todayUsage.tokens.toLocaleString()} 토큰 / $${todayUsage.cost.toFixed(4)}`}
      >
        {isOver && <AlertTriangle className="w-3 h-3" />}
        <span>{Math.round(maxRatio * 100)}%</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        오늘의 사용량
      </h3>

      {/* 경고 메시지 */}
      {isOver && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          일일 사용량 제한에 도달했습니다.
        </div>
      )}

      {isWarning && !isOver && (
        <div className="p-3 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          사용량이 {Math.round(usageLimits.warningThreshold! * 100)}%를 초과했습니다.
        </div>
      )}

      {/* 토큰 사용량 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="w-4 h-4" />
            토큰
          </span>
          <span className="font-mono">
            {todayUsage.tokens.toLocaleString()}
            {usageLimits.dailyTokenLimit && (
              <span className="text-muted-foreground">
                {' '}/ {usageLimits.dailyTokenLimit.toLocaleString()}
              </span>
            )}
          </span>
        </div>
        {usageLimits.dailyTokenLimit && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                tokenRatio >= 1
                  ? 'bg-destructive'
                  : tokenRatio >= (usageLimits.warningThreshold || 0.8)
                    ? 'bg-yellow-500'
                    : 'bg-primary'
              )}
              style={{ width: `${Math.min(tokenRatio * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* 비용 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            비용
          </span>
          <span className="font-mono">
            ${todayUsage.cost.toFixed(4)}
            {usageLimits.dailyCostLimit && (
              <span className="text-muted-foreground">
                {' '}/ ${usageLimits.dailyCostLimit.toFixed(2)}
              </span>
            )}
          </span>
        </div>
        {usageLimits.dailyCostLimit && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                costRatio >= 1
                  ? 'bg-destructive'
                  : costRatio >= (usageLimits.warningThreshold || 0.8)
                    ? 'bg-yellow-500'
                    : 'bg-primary'
              )}
              style={{ width: `${Math.min(costRatio * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* 요청 수 */}
      <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
        <span className="text-muted-foreground">요청 수</span>
        <span className="font-mono">{todayUsage.requests}회</span>
      </div>

      {/* 현재 모델 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">사용 모델</span>
        <span className="font-mono text-xs">{getModelName(config.model)}</span>
      </div>

      {/* 날짜 */}
      <p className="text-xs text-muted-foreground text-center">
        {todayUsage.date}
      </p>
    </div>
  );
}

/**
 * 모델 표시 이름
 */
function getModelName(model: string): string {
  const names: Record<string, string> = {
    'claude-opus-4-5-20251101': 'Opus 4.5',
    'claude-sonnet-4-20250514': 'Sonnet 4',
    'claude-3-5-haiku-20241022': 'Haiku 3.5',
  };
  return names[model] || model;
}
