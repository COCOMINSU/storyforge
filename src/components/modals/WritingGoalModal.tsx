/**
 * 글자수 목표 모달
 *
 * Ctrl+Shift+O 로 열 수 있습니다.
 * 프로젝트/화당 글자수 목표를 설정하고 현재 진행률을 확인합니다.
 */

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { useUIStore, useProjectStore, useDocumentStore } from '@/stores';
import { cn } from '@/lib';

// 아이콘
const TargetIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const TrendUpIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

export function WritingGoalModal() {
  const { activeModal, closeModal } = useUIStore();
  const { currentProject, updateProject } = useProjectStore();
  const { scenes, chapters } = useDocumentStore();

  const [targetLength, setTargetLength] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  const isOpen = activeModal === 'writing-goal';

  // 초기값 설정
  useEffect(() => {
    if (isOpen && currentProject) {
      setTargetLength(currentProject.targetLength || '');
    }
  }, [isOpen, currentProject]);

  if (!isOpen || !currentProject) return null;

  // 통계 계산
  const totalChars = currentProject.stats.totalCharCount;
  const totalCharsWithSpaces = currentProject.stats.totalCharCountWithSpaces;
  const chapterCount = chapters.length;
  const sceneCount = scenes.length;

  // 화당 평균 글자수 계산
  const avgCharsPerChapter = chapterCount > 0 ? Math.round(totalChars / chapterCount) : 0;

  // 목표 달성률
  const goalTarget = targetLength || currentProject.targetLength || 0;
  const goalProgress = goalTarget > 0 ? Math.min((avgCharsPerChapter / goalTarget) * 100, 100) : 0;

  // 전체 프로젝트 진행률 (목표 글자수 * 화 수 기준)
  const totalGoal = goalTarget * chapterCount;
  const totalProgress = totalGoal > 0 ? Math.min((totalChars / totalGoal) * 100, 100) : 0;

  const handleSave = async () => {
    if (!currentProject) return;

    setIsSaving(true);
    try {
      await updateProject(currentProject.id, {
        targetLength: targetLength || undefined,
      });
      closeModal();
    } catch (error) {
      console.error('목표 저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatNumber = (num: number) => num.toLocaleString('ko-KR');

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="글자수 목표" size="md">
      <div className="space-y-6">
        {/* 현재 통계 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">전체 글자수 (공백 제외)</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatNumber(totalChars)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">전체 글자수 (공백 포함)</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatNumber(totalCharsWithSpaces)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">화 / 씬 수</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {chapterCount} <span className="text-base font-normal text-muted-foreground">/ {sceneCount}</span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">화당 평균 글자수</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatNumber(avgCharsPerChapter)}
            </p>
          </div>
        </div>

        {/* 목표 설정 */}
        <div className="rounded-lg border border-border p-4">
          <label className="mb-2 block text-sm font-medium text-foreground">
            화당 목표 글자수
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={targetLength}
              onChange={(e) =>
                setTargetLength(e.target.value ? parseInt(e.target.value, 10) : '')
              }
              placeholder="5000"
              min={0}
              step={500}
              className="w-32 rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <span className="text-sm text-muted-foreground">자</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            플랫폼별 권장: 문피아 4,000~6,000자 / 카카오페이지 3,000~5,000자
          </p>
        </div>

        {/* 진행률 */}
        {goalTarget > 0 && (
          <div className="space-y-4">
            {/* 화당 목표 달성률 */}
            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  화당 평균 달성률
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    goalProgress >= 100
                      ? 'text-green-500'
                      : goalProgress >= 70
                        ? 'text-yellow-500'
                        : 'text-muted-foreground'
                  )}
                >
                  {goalProgress >= 100 && <TargetIcon />}
                  {goalProgress.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full transition-all',
                    goalProgress >= 100
                      ? 'bg-green-500'
                      : goalProgress >= 70
                        ? 'bg-yellow-500'
                        : 'bg-primary'
                  )}
                  style={{ width: `${Math.min(goalProgress, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                현재 평균 {formatNumber(avgCharsPerChapter)}자 / 목표 {formatNumber(goalTarget)}자
              </p>
            </div>

            {/* 전체 프로젝트 진행률 */}
            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  전체 프로젝트 진행률
                </span>
                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                  <TrendUpIcon />
                  {totalProgress.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(totalProgress, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                현재 {formatNumber(totalChars)}자 / 예상 총 {formatNumber(totalGoal)}자
                ({chapterCount}화 × {formatNumber(goalTarget)}자)
              </p>
            </div>
          </div>
        )}

        {/* 빠른 목표 설정 */}
        <div>
          <p className="mb-2 text-xs text-muted-foreground">빠른 설정:</p>
          <div className="flex flex-wrap gap-2">
            {[3000, 4000, 5000, 6000, 7000].map((value) => (
              <button
                key={value}
                onClick={() => setTargetLength(value)}
                className={cn(
                  'rounded border px-3 py-1 text-sm transition-colors',
                  targetLength === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                )}
              >
                {formatNumber(value)}자
              </button>
            ))}
          </div>
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={closeModal}
          disabled={isSaving}
          className="rounded border border-border bg-background px-4 py-2 text-foreground hover:bg-accent disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
