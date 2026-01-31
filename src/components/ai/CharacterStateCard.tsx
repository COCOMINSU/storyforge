/**
 * 캐릭터 상태 카드 컴포넌트
 *
 * 실시간 요약 패널에서 캐릭터의 현재 상태를 표시합니다.
 */

import { User } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CharacterStateCardProps {
  /** 캐릭터 상태 데이터 */
  character: {
    characterId: string;
    name: string;
    location?: string;
    condition?: string;
    lastAppearance?: string;
  };
  /** 클릭 콜백 */
  onClick?: () => void;
}

/**
 * 캐릭터 상태 카드
 */
export function CharacterStateCard({
  character,
  onClick,
}: CharacterStateCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-md',
        'bg-secondary/50',
        onClick && 'hover:bg-secondary cursor-pointer',
        'transition-colors text-left'
      )}
    >
      {/* 아바타 */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <User className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{character.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {character.condition && (
            <span className="flex items-center gap-1">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  getConditionColor(character.condition)
                )}
              />
              {character.condition}
            </span>
          )}
          {character.location && (
            <span className="truncate">@ {character.location}</span>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * 상태에 따른 색상 반환
 */
function getConditionColor(condition: string): string {
  const lowercased = condition.toLowerCase();

  if (
    lowercased.includes('위험') ||
    lowercased.includes('부상') ||
    lowercased.includes('죽')
  ) {
    return 'bg-red-500';
  }

  if (
    lowercased.includes('경고') ||
    lowercased.includes('주의') ||
    lowercased.includes('피로')
  ) {
    return 'bg-yellow-500';
  }

  if (
    lowercased.includes('활동') ||
    lowercased.includes('정상') ||
    lowercased.includes('등장')
  ) {
    return 'bg-green-500';
  }

  return 'bg-gray-500';
}
