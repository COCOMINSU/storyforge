/**
 * 사용량 제한 설정 모달
 *
 * 일일 토큰/비용 제한을 설정할 수 있는 모달입니다.
 */

import { useState } from 'react';
import { X, Settings2, AlertTriangle } from 'lucide-react';
import { useAIStore, useUIStore } from '@/stores';
import { cn } from '@/lib/cn';

/**
 * 사용량 제한 설정 모달
 */
export function UsageLimitModal() {
  const { usageLimits, setUsageLimits } = useAIStore();
  const { closeModal } = useUIStore();

  const [tokenLimit, setTokenLimit] = useState(
    usageLimits.dailyTokenLimit?.toString() || ''
  );
  const [costLimit, setCostLimit] = useState(
    usageLimits.dailyCostLimit?.toString() || ''
  );
  const [warningThreshold, setWarningThreshold] = useState(
    ((usageLimits.warningThreshold || 0.8) * 100).toString()
  );

  /**
   * 설정 저장
   */
  const handleSave = () => {
    setUsageLimits({
      dailyTokenLimit: tokenLimit ? parseInt(tokenLimit, 10) : undefined,
      dailyCostLimit: costLimit ? parseFloat(costLimit) : undefined,
      warningThreshold: parseFloat(warningThreshold) / 100,
    });
    closeModal();
  };

  /**
   * 기본값으로 리셋
   */
  const handleReset = () => {
    setTokenLimit('100000');
    setCostLimit('5');
    setWarningThreshold('80');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeModal}
      />

      {/* 모달 */}
      <div className="relative w-full max-w-md mx-4 bg-background rounded-lg shadow-xl border border-border">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            사용량 제한 설정
          </h2>
          <button
            onClick={closeModal}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-4 space-y-6">
          {/* 안내 */}
          <div className="p-3 rounded-md bg-muted text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-muted-foreground">
              사용량 제한을 설정하면 일일 한도에 도달했을 때 AI 기능이 비활성화됩니다.
              비용 관리에 유용합니다.
            </p>
          </div>

          {/* 토큰 제한 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              일일 토큰 제한
            </label>
            <div className="relative">
              <input
                type="number"
                value={tokenLimit}
                onChange={(e) => setTokenLimit(e.target.value)}
                placeholder="제한 없음"
                min="0"
                step="10000"
                className={cn(
                  'w-full px-3 py-2 rounded-md',
                  'bg-background border border-input',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'text-sm'
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                토큰
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              권장: 50,000 ~ 200,000 토큰 (약 $0.5 ~ $2/일)
            </p>
          </div>

          {/* 비용 제한 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              일일 비용 제한
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                type="number"
                value={costLimit}
                onChange={(e) => setCostLimit(e.target.value)}
                placeholder="제한 없음"
                min="0"
                step="0.5"
                className={cn(
                  'w-full px-3 py-2 pl-7 rounded-md',
                  'bg-background border border-input',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'text-sm'
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                USD
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              권장: $1 ~ $10/일
            </p>
          </div>

          {/* 경고 임계값 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              경고 임계값
            </label>
            <div className="relative">
              <input
                type="number"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(e.target.value)}
                placeholder="80"
                min="0"
                max="100"
                className={cn(
                  'w-full px-3 py-2 rounded-md',
                  'bg-background border border-input',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'text-sm'
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              이 비율에 도달하면 경고를 표시합니다.
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <button
            onClick={handleReset}
            className={cn(
              'px-4 py-2 text-sm rounded-md',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-accent',
              'transition-colors'
            )}
          >
            기본값
          </button>

          <div className="flex gap-2">
            <button
              onClick={closeModal}
              className={cn(
                'px-4 py-2 text-sm rounded-md',
                'border border-border',
                'hover:bg-accent',
                'transition-colors'
              )}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className={cn(
                'px-4 py-2 text-sm rounded-md',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90',
                'transition-colors'
              )}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
