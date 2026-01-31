/**
 * 세계관 카드 목록
 *
 * 인물, 장소, 아이템 카드를 탭별로 필터링하여 표시합니다.
 */

import { useState } from 'react';
import { useWorldStore, useProjectStore, useUIStore } from '@/stores';
import { cn } from '@/lib';
import { WorldCardItem } from './WorldCardItem';
import type { CardType } from '@/types';

// 아이콘
const UserIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const MapPinIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CubeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

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

const TABS: Array<{ id: CardType | 'all'; label: string; icon: () => JSX.Element }> = [
  { id: 'all', label: '전체', icon: () => <span className="text-xs">All</span> },
  { id: 'character', label: '인물', icon: UserIcon },
  { id: 'location', label: '장소', icon: MapPinIcon },
  { id: 'item', label: '아이템', icon: CubeIcon },
];

export function WorldCardList() {
  const { currentProject } = useProjectStore();
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    getFilteredCards,
    createCharacter,
    createLocation,
    createItem,
  } = useWorldStore();
  const { openModal } = useUIStore();

  const [isCreating, setIsCreating] = useState(false);

  const filteredCards = getFilteredCards();

  const handleAddCard = async () => {
    if (!currentProject || isCreating) return;

    setIsCreating(true);
    try {
      let card;
      switch (activeTab) {
        case 'character':
          card = await createCharacter(currentProject.id, {});
          openModal('character-card', { cardId: card.id, mode: 'edit' });
          break;
        case 'location':
          card = await createLocation(currentProject.id, {});
          openModal('location-card', { cardId: card.id, mode: 'edit' });
          break;
        case 'item':
          card = await createItem(currentProject.id, {});
          openModal('item-card', { cardId: card.id, mode: 'edit' });
          break;
        default:
          // 'all' 탭에서는 인물 카드를 기본으로 생성
          card = await createCharacter(currentProject.id, {});
          openModal('character-card', { cardId: card.id, mode: 'edit' });
      }
    } catch (error) {
      console.error('카드 생성 실패:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="border-b border-border p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">세계관</h3>
          <button
            onClick={handleAddCard}
            disabled={isCreating}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            title="카드 추가"
          >
            <PlusIcon />
          </button>
        </div>

        {/* 검색 */}
        <div className="mt-2 relative">
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="카드 검색..."
            className="w-full rounded border border-border bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <SearchIcon />
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 py-2 text-xs transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 카드 목록 */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-2 text-muted-foreground">
              {searchQuery ? (
                <>
                  <p className="text-sm">검색 결과가 없습니다</p>
                  <p className="mt-1 text-xs">다른 검색어를 시도해 보세요</p>
                </>
              ) : (
                <>
                  <p className="text-sm">아직 카드가 없습니다</p>
                  <p className="mt-1 text-xs">+ 버튼을 눌러 새 카드를 추가하세요</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCards.map((card) => (
              <WorldCardItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>

      {/* 카드 수 표시 */}
      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
        총 {filteredCards.length}개의 카드
      </div>
    </div>
  );
}
