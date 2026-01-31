/**
 * 인물 설정 마법사 컴포넌트
 *
 * AI와 단계별 대화를 통해 인물을 설정하고,
 * 완료 시 캐릭터 카드를 자동 생성합니다.
 *
 * 9단계: 기본 정보 → 외모 → 성격 → 배경 → 동기
 *        → 관계 → 능력 → 성장 곡선 → 검토
 */

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, User } from 'lucide-react';
import { useAIStore, useProjectStore } from '@/stores';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import {
  CHARACTER_STEPS,
  CHARACTER_STEP_CONFIG,
  buildCharacterCardFromState,
} from '@/services/ai/characterPrompts';
import { cn } from '@/lib/cn';
import type { CharacterSettingStep, CharacterCard } from '@/types';

interface CharacterSettingWizardProps {
  /** 닫기 콜백 */
  onClose: () => void;
  /** 완료 콜백 (캐릭터 카드 데이터 전달) */
  onComplete: (characterData: Partial<CharacterCard>) => void;
  /** 수정 대상 캐릭터 ID (기존 캐릭터 수정 시) */
  editCharacterId?: string;
}

/**
 * 인물 설정 마법사
 */
export function CharacterSettingWizard({
  onClose,
  onComplete,
  editCharacterId,
}: CharacterSettingWizardProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const {
    currentSession,
    characterSettingState,
    isGenerating,
    streamingContent,
    updateCharacterSettingState,
    sendMessage,
    completeCharacterSetting,
  } = useAIStore();

  const currentStep = characterSettingState?.currentStep || 'basic_info';
  const currentStepIndex = CHARACTER_STEPS.indexOf(currentStep);
  const stepConfig = CHARACTER_STEP_CONFIG[currentStep];

  // 단계 시작 시 AI 초기 메시지 전송
  useEffect(() => {
    if (!currentProject || !characterSettingState) return;

    // 현재 세션의 메시지가 없으면 초기 메시지 전송
    if (currentSession && currentSession.messages.length === 0) {
      handleSendInitialMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 의도적으로 step/messages 변경 시에만 실행
  }, [currentStep, currentSession?.messages.length]);

  /**
   * AI의 초기 안내 메시지를 보냅니다.
   */
  const handleSendInitialMessage = async () => {
    if (!currentProject) return;
    const greeting = editCharacterId
      ? '기존 인물을 수정하고 싶어요.'
      : '새로운 인물을 만들고 싶어요.';
    await sendMessage(greeting, currentProject.id);
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
    if (currentStepIndex < CHARACTER_STEPS.length - 1) {
      const nextStep = CHARACTER_STEPS[currentStepIndex + 1];
      updateCharacterSettingState({
        currentStep: nextStep,
        completedSteps: [
          ...(characterSettingState?.completedSteps || []),
          currentStep,
        ],
      });
    }
  };

  /**
   * 이전 단계로 이동
   */
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = CHARACTER_STEPS[currentStepIndex - 1];
      updateCharacterSettingState({ currentStep: prevStep });
    }
  };

  /**
   * 특정 단계로 이동 (완료된 단계만)
   */
  const handleStepClick = (step: CharacterSettingStep) => {
    const targetIndex = CHARACTER_STEPS.indexOf(step);
    if (
      targetIndex <= currentStepIndex ||
      characterSettingState?.completedSteps.includes(step)
    ) {
      updateCharacterSettingState({ currentStep: step });
    }
  };

  /**
   * 설정 완료
   */
  const handleComplete = () => {
    if (!characterSettingState) return;

    const characterData = buildCharacterCardFromState(characterSettingState);
    onComplete(characterData);
    completeCharacterSetting();
    onClose();
  };

  if (!characterSettingState) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            {editCharacterId ? '인물 수정' : '새 인물 만들기'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 단계 표시 */}
      <CharacterStepIndicator
        steps={CHARACTER_STEPS}
        currentStep={currentStep}
        completedSteps={characterSettingState.completedSteps}
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
          {currentStepIndex + 1} / {CHARACTER_STEPS.length} 단계
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
            캐릭터 생성
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
 * 인물 설정 단계 표시 컴포넌트
 */
function CharacterStepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: {
  steps: CharacterSettingStep[];
  currentStep: CharacterSettingStep;
  completedSteps: CharacterSettingStep[];
  onStepClick?: (step: CharacterSettingStep) => void;
}) {
  const currentIndex = steps.indexOf(currentStep);
  const stepConfig = CHARACTER_STEP_CONFIG[currentStep];

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
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium transition-all',
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background'
                        : 'bg-muted text-muted-foreground',
                    isClickable && 'cursor-pointer hover:ring-2 hover:ring-primary/50'
                  )}
                  title={CHARACTER_STEP_CONFIG[step].title}
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
              {currentIndex + 1}. {stepConfig.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {stepConfig.description}
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

/**
 * 단계별 이모지
 */
function getStepEmoji(step: CharacterSettingStep): string {
  const emojis: Record<CharacterSettingStep, string> = {
    basic_info: '📝',
    appearance: '👤',
    personality: '💭',
    background: '📖',
    motivation: '🎯',
    relationships: '🤝',
    abilities: '⚡',
    arc: '📈',
    review: '✅',
  };
  return emojis[step] || '👤';
}

/**
 * 단계별 입력 placeholder
 */
function getInputPlaceholder(step: CharacterSettingStep): string {
  const placeholders: Record<CharacterSettingStep, string> = {
    basic_info: '이름, 나이, 역할을 알려주세요...',
    appearance: '외모를 설명해주세요...',
    personality: '성격을 알려주세요...',
    background: '과거와 배경을 알려주세요...',
    motivation: '목표와 동기를 알려주세요...',
    relationships: '다른 인물과의 관계를 설명해주세요...',
    abilities: '능력이나 특기를 알려주세요...',
    arc: '캐릭터의 성장을 계획해봐요...',
    review: '수정할 부분이 있나요?',
  };
  return placeholders[step] || '메시지를 입력하세요...';
}
