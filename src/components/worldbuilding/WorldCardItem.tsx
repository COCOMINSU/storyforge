/**
 * 세계관 카드 아이템
 *
 * 카드 목록에서 개별 카드를 표시합니다.
 */

import { useWorldStore, useUIStore } from '@/stores';
import { cn } from '@/lib';
import type { WorldCard, CharacterCard } from '@/types';

// 타입별 아이콘
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

const TYPE_ICONS = {
  character: UserIcon,
  location: MapPinIcon,
  item: CubeIcon,
};

const TYPE_COLORS = {
  character: 'bg-blue-500/10 text-blue-500',
  location: 'bg-green-500/10 text-green-500',
  item: 'bg-amber-500/10 text-amber-500',
};

const ROLE_LABELS: Record<string, string> = {
  protagonist: '주인공',
  antagonist: '악역',
  supporting: '조연',
  minor: '단역',
};

interface WorldCardItemProps {
  card: WorldCard;
}

export function WorldCardItem({ card }: WorldCardItemProps) {
  const { selectedCard, selectCard } = useWorldStore();
  const { openModal } = useUIStore();

  const isSelected = selectedCard?.id === card.id;
  const Icon = TYPE_ICONS[card.type];

  const handleClick = () => {
    selectCard(card);
  };

  const handleDoubleClick = () => {
    const modalType =
      card.type === 'character'
        ? 'character-card'
        : card.type === 'location'
          ? 'location-card'
          : 'item-card';
    openModal(modalType, { cardId: card.id, mode: 'view' });
  };

  // 인물 카드의 역할 뱃지
  const characterRole =
    card.type === 'character' ? (card as CharacterCard).role : null;

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'group flex cursor-pointer items-start gap-2 rounded border p-2 transition-colors',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:border-border hover:bg-accent/50'
      )}
    >
      {/* 이미지 또는 아이콘 */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded',
          card.imageUrl ? '' : TYPE_COLORS[card.type]
        )}
      >
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <Icon />
        )}
      </div>

      {/* 정보 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-sm font-medium text-foreground">
            {card.name}
          </span>
          {characterRole && (
            <span
              className={cn(
                'flex-shrink-0 rounded px-1 py-0.5 text-[10px]',
                characterRole === 'protagonist' && 'bg-yellow-500/20 text-yellow-600',
                characterRole === 'antagonist' && 'bg-red-500/20 text-red-600',
                characterRole === 'supporting' && 'bg-blue-500/20 text-blue-600',
                characterRole === 'minor' && 'bg-gray-500/20 text-gray-600'
              )}
            >
              {ROLE_LABELS[characterRole]}
            </span>
          )}
        </div>

        {/* 설명 미리보기 */}
        {card.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {card.description}
          </p>
        )}

        {/* 태그 */}
        {card.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {card.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="rounded bg-accent px-1 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {card.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{card.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
