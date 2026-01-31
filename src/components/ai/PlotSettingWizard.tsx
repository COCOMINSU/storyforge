/**
 * 줄거리 설정 마법사 컴포넌트
 *
 * AI와 단계별 대화를 통해 작품의 줄거리를 설정합니다.
 * 8단계: 장르 선택 → 기본 전제 → 주인공 설정 → 갈등 요소
 *        → 세계관 → 플롯 구조 → 화별 줄거리 → 검토 및 확정
 */

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useAIStore, useProjectStore } from '@/stores';
import { PlotStepIndicator } from './PlotStepIndicator';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { PLOT_STEPS, PLOT_STEP_CONFIG, buildPlotDataFromState } from '@/services/ai/plotPrompts';
import { cn } from '@/lib/cn';
import type { PlotSettingStep } from '@/types';

interface PlotSettingWizardProps {
  /** 닫기 콜백 */
  onClose: () => void;
  /** 완료 콜백 (저장할 데이터 전달) */
  onComplete: (data: {
    genre: string[];
    synopsis: string;
    chapterOutlines: Array<{
      volumeNumber: number;
      chapterNumber: number;
      title: string;
      summary: string;
    }>;
  }) => void;
}

/**
 * 줄거리 설정 마법사
 */
export function PlotSettingWizard({ onClose, onComplete }: PlotSettingWizardProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const {
    currentSession,
    plotSettingState,
    isGenerating,
    streamingContent,
    updatePlotSettingState,
    sendMessage,
    completePlotSetting,
  } = useAIStore();

  const currentStep = plotSettingState?.currentStep || 'genre_selection';
  const currentStepIndex = PLOT_STEPS.indexOf(currentStep);
  const stepConfig = PLOT_STEP_CONFIG[currentStep];

  // 단계 시작 시 AI 초기 메시지 전송
  useEffect(() => {
    if (!currentProject || !plotSettingState) return;

    // 현재 세션의 메시지가 없으면 초기 메시지 전송
    if (currentSession && currentSession.messages.length === 0) {
      // AI가 먼저 메시지를 보내는 형태로 시작
      // 실제로는 시스템이 AI 역할로 초기 메시지를 추가
      handleSendInitialMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 의도적으로 step/messages 변경 시에만 실행
  }, [currentStep, currentSession?.messages.length]);

  /**
   * AI의 초기 안내 메시지를 보냅니다.
   */
  const handleSendInitialMessage = async () => {
    if (!currentProject) return;
    // 사용자가 첫 대화를 시작하면 AI가 안내 메시지로 응답하도록 유도
    // 간단한 인사 메시지로 시작
    await sendMessage('안녕하세요, 줄거리 설정을 시작하고 싶어요.', currentProject.id);
  };

  /**
   * 사용자 메시지 전송
   */
  const handleSend = async (content: string) => {
    if (!currentProject) return;
    await sendMessage(content, currentProject.id);
  };

  /**
   * 다음 단계로 이동
   */
  const handleNextStep = () => {
    if (currentStepIndex < PLOT_STEPS.length - 1) {
      const nextStep = PLOT_STEPS[currentStepIndex + 1];
      updatePlotSettingState({
        currentStep: nextStep,
        completedSteps: [...(plotSettingState?.completedSteps || []), currentStep],
      });
    }
  };

  /**
   * 이전 단계로 이동
   */
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = PLOT_STEPS[currentStepIndex - 1];
      updatePlotSettingState({ currentStep: prevStep });
    }
  };

  /**
   * 특정 단계로 이동 (완료된 단계만)
   */
  const handleStepClick = (step: PlotSettingStep) => {
    const targetIndex = PLOT_STEPS.indexOf(step);
    if (
      targetIndex <= currentStepIndex ||
      plotSettingState?.completedSteps.includes(step)
    ) {
      updatePlotSettingState({ currentStep: step });
    }
  };

  /**
   * 설정 완료
   */
  const handleComplete = () => {
    if (!plotSettingState) return;

    const data = buildPlotDataFromState(plotSettingState);
    onComplete(data);
    completePlotSetting();
    onClose();
  };

  if (!plotSettingState) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold">줄거리 설정</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 단계 표시 */}
      <PlotStepIndicator
        steps={PLOT_STEPS}
        currentStep={currentStep}
        completedSteps={plotSettingState.completedSteps}
        onStepClick={handleStepClick}
      />

      {/* 대화 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentSession?.messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={
              index === currentSession.messages.length - 1 &&
              message.status === 'streaming'
            }
            streamingContent={
              index === currentSession.messages.length - 1 &&
              message.status === 'streaming'
                ? streamingContent
                : undefined
            }
          />
        ))}

        {/* 생성 중 표시 */}
        {isGenerating && !streamingContent && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-sm">AI</span>
            </div>
            <div className="bg-secondary rounded-lg px-4 py-2">
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {(!currentSession || currentSession.messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-4">{getStepEmoji(currentStep)}</div>
            <h3 className="text-lg font-medium mb-2">{stepConfig.title}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {stepConfig.description}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              아래에 메시지를 입력해서 대화를 시작하세요
            </p>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-border">
        <ChatInput
          disabled={isGenerating || !currentProject}
          onSend={handleSend}
          placeholder={getInputPlaceholder(currentStep)}
        />
      </div>

      {/* 네비게이션 */}
      <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
        <button
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          className={cn(
            'flex items-center gap-1 px-3 py-2 text-sm rounded-md',
            'border border-border',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:bg-accent transition-colors'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          이전 단계
        </button>

        <span className="text-xs text-muted-foreground">
          {currentStepIndex + 1} / {PLOT_STEPS.length} 단계
        </span>

        {currentStep === 'review' ? (
          <button
            onClick={handleComplete}
            className={cn(
              'flex items-center gap-1 px-4 py-2 text-sm rounded-md',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors'
            )}
          >
            <Check className="w-4 h-4" />
            설정 완료
          </button>
        ) : (
          <button
            onClick={handleNextStep}
            className={cn(
              'flex items-center gap-1 px-3 py-2 text-sm rounded-md',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors'
            )}
          >
            다음 단계
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 단계별 이모지
 */
function getStepEmoji(step: PlotSettingStep): string {
  const emojis: Record<PlotSettingStep, string> = {
    genre_selection: '🎭',
    premise: '💡',
    main_character: '👤',
    conflict: '⚔️',
    world_setting: '🌍',
    plot_structure: '📊',
    chapter_outline: '📝',
    review: '✅',
  };
  return emojis[step] || '📖';
}

/**
 * 단계별 입력 placeholder
 */
function getInputPlaceholder(step: PlotSettingStep): string {
  const placeholders: Record<PlotSettingStep, string> = {
    genre_selection: '원하는 장르를 말씀해주세요...',
    premise: '어떤 이야기를 쓰고 싶으신가요?',
    main_character: '주인공에 대해 알려주세요...',
    conflict: '갈등 요소를 설명해주세요...',
    world_setting: '세계관을 설명해주세요...',
    plot_structure: '이야기 흐름을 말씀해주세요...',
    chapter_outline: '각 화의 내용을 정해봐요...',
    review: '수정할 부분이 있나요?',
  };
  return placeholders[step] || '메시지를 입력하세요...';
}
