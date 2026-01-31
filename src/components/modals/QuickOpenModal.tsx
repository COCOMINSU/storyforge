/**
 * 빠른 열기 모달
 *
 * Ctrl+P 로 열 수 있습니다.
 * 프로젝트 내 씬을 빠르게 검색하고 열 수 있습니다.
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
  title: string;
  path: string; // 예: "1권 > 1화 > 씬 1"
  type: 'scene';
}

export function QuickOpenModal() {
  const { activeModal, closeModal } = useUIStore();
  const { currentProject } = useProjectStore();
  const { volumes, chapters, scenes, selectScene } = useDocumentStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isOpen = activeModal === 'quick-open';

  // 검색 결과 계산
  const results = useMemo(() => {
    if (!currentProject) return [];

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase().trim();

    for (const scene of scenes) {
      // 제목 또는 내용에서 검색
      const matchesTitle = scene.title.toLowerCase().includes(lowerQuery);
      const matchesContent = scene.plainText?.toLowerCase().includes(lowerQuery);

      if (!lowerQuery || matchesTitle || matchesContent) {
        const chapter = chapters.find((c) => c.id === scene.chapterId);
        const volume = chapter ? volumes.find((v) => v.id === chapter.volumeId) : null;

        const path = [
          volume?.title || '',
          chapter?.title || '',
          scene.title,
        ]
          .filter(Boolean)
          .join(' > ');

        searchResults.push({
          id: scene.id,
          title: scene.title,
          path,
          type: 'scene',
        });
      }
    }

    // 제목 매칭 우선, 그 다음 경로 알파벳 순
    return searchResults.sort((a, b) => {
      const aMatchesTitle = a.title.toLowerCase().includes(lowerQuery);
      const bMatchesTitle = b.title.toLowerCase().includes(lowerQuery);

      if (aMatchesTitle && !bMatchesTitle) return -1;
      if (!aMatchesTitle && bMatchesTitle) return 1;
      return a.path.localeCompare(b.path);
    }).slice(0, 20); // 최대 20개
  }, [query, scenes, chapters, volumes, currentProject]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // 약간의 지연 후 포커스 (모달 애니메이션 때문)
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
    selectScene(result.id);
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="빠른 열기"
      size="md"
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
            placeholder="씬 이름으로 검색..."
            className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        {/* 결과 목록 */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto"
        >
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {query ? '검색 결과가 없습니다.' : '씬이 없습니다.'}
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <DocumentIcon />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{result.title}</div>
                  <div
                    className={cn(
                      'truncate text-xs',
                      index === selectedIndex
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    )}
                  >
                    {result.path}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* 하단 안내 */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-muted px-1.5 py-0.5">↑↓</kbd>
            <span>이동</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-muted px-1.5 py-0.5">Enter</kbd>
            <span>열기</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
