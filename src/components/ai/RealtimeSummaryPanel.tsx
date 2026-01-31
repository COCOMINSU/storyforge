/**
 * 실시간 요약 패널 컴포넌트
 *
 * 프로젝트의 진행상황, 등장인물 상태, 최근 요약을 실시간으로 표시합니다.
 * AI가 맥락을 참조할 때 사용됩니다.
 */

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Users, BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/stores';
import { generateRealtimeSummary } from '@/services/ai/summaryService';
import { CharacterStateCard } from './CharacterStateCard';
import type { RealtimeSummary } from '@/types';
import { cn } from '@/lib/cn';

/**
 * 실시간 요약 패널
 */
export function RealtimeSummaryPanel() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const [summary, setSummary] = useState<RealtimeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 요약 데이터 로드
   */
  const loadSummary = useCallback(async () => {
    if (!currentProject) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await generateRealtimeSummary(currentProject.id);
      setSummary(data);
    } catch (err) {
      console.error('[RealtimeSummaryPanel] Failed to load summary:', err);
      setError('요약을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [currentProject?.id]);

  // 프로젝트 변경 시 요약 로드
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // 프로젝트 미선택
  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Sparkles className="w-8 h-8 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          프로젝트를 선택하면
          <br />
          실시간 요약을 볼 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          실시간 요약
        </h3>
        <button
          onClick={loadSummary}
          disabled={isLoading}
          className={cn(
            'p-1.5 rounded-md',
            'hover:bg-accent',
            'text-muted-foreground hover:text-foreground',
            'transition-colors'
          )}
          title="새로고침"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-md bg-destructive/10 border border-destructive text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 진행 상황 */}
        <section>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4" />
            진행 상황
          </h4>
          {summary ? (
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">현재 위치</span>
                <span className="font-medium">
                  {summary.progress.currentVolume}권{' '}
                  {summary.progress.currentChapter}화
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">총 진행</span>
                <span className="font-medium">
                  {summary.progress.totalChapters}화 중{' '}
                  {summary.progress.currentChapter - 1}화 완료
                </span>
              </div>

              {/* 진행 바 */}
              <div className="space-y-1">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${summary.progress.completionPercentage}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {summary.progress.completionPercentage}% 완료
                </div>
              </div>
            </div>
          ) : (
            <SkeletonBox />
          )}
        </section>

        {/* 등장인물 상태 */}
        <section>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" />
            주요 등장인물
          </h4>
          {summary ? (
            summary.characterStates.length > 0 ? (
              <div className="space-y-2">
                {summary.characterStates.map((char) => (
                  <CharacterStateCard key={char.characterId} character={char} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-2">
                등록된 인물이 없습니다.
              </p>
            )
          ) : (
            <SkeletonList />
          )}
        </section>

        {/* 최근 내용 */}
        <section>
          <h4 className="text-sm font-medium mb-3">최근 내용</h4>
          {summary ? (
            summary.recentChapterSummaries.length > 0 ? (
              <div className="space-y-3">
                {summary.recentChapterSummaries.map((chapter, index) => (
                  <div
                    key={index}
                    className="p-3 bg-secondary/50 rounded-lg"
                  >
                    <p className="text-sm font-medium mb-1">
                      {chapter.chapterTitle}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {chapter.summary}
                    </p>
                    {chapter.keyEvents.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {chapter.keyEvents.map((event, i) => (
                          <span
                            key={i}
                            className="text-xs px-1.5 py-0.5 bg-muted rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-2">
                작성된 내용이 없습니다.
              </p>
            )
          ) : (
            <SkeletonList />
          )}
        </section>

        {/* 마지막 업데이트 시간 */}
        {summary && (
          <p className="text-xs text-muted-foreground text-center">
            마지막 업데이트:{' '}
            {summary.lastUpdatedAt.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 로딩 스켈레톤 - 박스
 */
function SkeletonBox() {
  return (
    <div className="bg-secondary/50 rounded-lg p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-2 bg-muted rounded" />
    </div>
  );
}

/**
 * 로딩 스켈레톤 - 리스트
 */
function SkeletonList() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-2 bg-muted rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
