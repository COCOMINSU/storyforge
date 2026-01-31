/**
 * 프로젝트 전체 검색 모달
 *
 * Ctrl+Shift+F 로 열 수 있습니다.
 * 프로젝트 내 모든 씬의 내용을 검색합니다.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { useUIStore, useProjectStore, useDocumentStore } from '@/stores';
import { cn } from '@/lib';

// 아이콘
const SearchIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const DocumentIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

interface SearchResult {
  id: string;
  sceneId: string;
  sceneTitle: string;
  path: string;
  matchText: string;
  matchIndex: number;
}

export function ProjectSearchModal() {
  const { activeModal, closeModal } = useUIStore();
  const { currentProject } = useProjectStore();
  const { volumes, chapters, scenes, selectScene } = useDocumentStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isOpen = activeModal === 'project-search';

  // 검색 결과 계산 (디바운스 적용)
  const results = useMemo(() => {
    if (!currentProject || !query.trim() || query.length < 2) return [];

    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase().trim();

    for (const scene of scenes) {
      const plainText = scene.plainText || '';
      const lowerText = plainText.toLowerCase();

      // 모든 매칭 위치 찾기
      let startIndex = 0;
      let matchIndex = lowerText.indexOf(lowerQuery, startIndex);

      while (matchIndex !== -1 && searchResults.length < 100) {
        // 매칭 주변 텍스트 추출 (앞뒤 30자)
        const contextStart = Math.max(0, matchIndex - 30);
        const contextEnd = Math.min(plainText.length, matchIndex + lowerQuery.length + 30);
        let matchText = plainText.slice(contextStart, contextEnd);

        // 앞뒤에 ... 추가
        if (contextStart > 0) matchText = '...' + matchText;
        if (contextEnd < plainText.length) matchText = matchText + '...';

        const chapter = chapters.find((c) => c.id === scene.chapterId);
        const volume = chapter ? volumes.find((v) => v.id === chapter.volumeId) : null;

        const path = [volume?.title, chapter?.title].filter(Boolean).join(' > ');

        searchResults.push({
          id: `${scene.id}-${matchIndex}`,
          sceneId: scene.id,
          sceneTitle: scene.title,
          path,
          matchText,
          matchIndex,
        });

        startIndex = matchIndex + 1;
        matchIndex = lowerText.indexOf(lowerQuery, startIndex);
      }
    }

    setIsSearching(false);
    return searchResults;
  }, [query, scenes, chapters, volumes, currentProject]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 선택된 항목이 보이도록 스크롤
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        closeModal();
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    selectScene(result.sceneId);
    closeModal();
  };

  // 검색어 하이라이트
  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/30 text-foreground">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="프로젝트 전체 검색"
      size="lg"
    >
      <div className="-mx-6 -mb-6 -mt-2 flex flex-col">
        {/* 검색 입력 */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="검색어를 입력하세요 (최소 2자)..."
            className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
          {isSearching && (
            <span className="text-xs text-muted-foreground">검색 중...</span>
          )}
          {results.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {results.length}개 결과
            </span>
          )}
        </div>

        {/* 결과 목록 */}
        <div ref={listRef} className="max-h-96 overflow-y-auto">
          {query.length < 2 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              2자 이상 입력하세요.
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <div className="flex items-center gap-2">
                  <DocumentIcon />
                  <span className="font-medium">{result.sceneTitle}</span>
                  {result.path && (
                    <span
                      className={cn(
                        'text-xs',
                        index === selectedIndex
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      ({result.path})
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    'ml-6 text-sm',
                    index === selectedIndex
                      ? 'text-primary-foreground/80'
                      : 'text-muted-foreground'
                  )}
                >
                  {index === selectedIndex ? result.matchText : highlightMatch(result.matchText)}
                </div>
              </button>
            ))
          )}
        </div>

        {/* 하단 안내 */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-muted px-1.5 py-0.5">↑↓</kbd>
              <span>이동</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-muted px-1.5 py-0.5">Enter</kbd>
              <span>열기</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-muted px-1.5 py-0.5">ESC</kbd>
            <span>닫기</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
