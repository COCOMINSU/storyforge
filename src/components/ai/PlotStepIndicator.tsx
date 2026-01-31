/**
 * 줄거리 설정 단계 표시 컴포넌트
 *
 * 현재 단계와 완료된 단계를 시각적으로 표시합니다.
 */

import { Check } from 'lucide-react';
import type { PlotSettingStep } from '@/types';
import { PLOT_STEP_CONFIG } from '@/services/ai/plotPrompts';
import { cn } from '@/lib/cn';

interface PlotStepIndicatorProps {
  /** 모든 단계 목록 */
  steps: PlotSettingStep[];
  /** 현재 진행 중인 단계 */
  currentStep: PlotSettingStep;
  /** 완료된 단계 목록 */
  completedSteps: PlotSettingStep[];
  /** 단계 클릭 콜백 */
  onStepClick?: (step: PlotSettingStep) => void;
}

/**
 * 줄거리 설정 단계 표시기
 */
export function PlotStepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: PlotStepIndicatorProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="border-b border-border">
      {/* 진행 바 */}
      <div className="px-4 pt-4">
        <div className="relative">
          {/* 배경 바 */}
          <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-border" />

          {/* 진행 바 */}
          <div
            className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-300"
            style={{
              width: `${(currentIndex / (steps.length - 1)) * 100}%`,
            }}
          />

          {/* 단계 점들 */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step);
              const isCurrent = step === currentStep;
              const isClickable = onStepClick && (isCompleted || isCurrent);

              return (
                <button
                  key={step}
                  onClick={() => isClickable && onStepClick?.(step)}
                  disabled={!isClickable}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-all',
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'bg-muted text-muted-foreground',
                    isClickable && 'cursor-pointer hover:ring-2 hover:ring-primary/50'
                  )}
                  title={PLOT_STEP_CONFIG[step].title}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 현재 단계 정보 */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">
              {currentIndex + 1}. {PLOT_STEP_CONFIG[currentStep].title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {PLOT_STEP_CONFIG[currentStep].description}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}
