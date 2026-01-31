/**
 * 액션 버튼 컴포넌트
 *
 * AI가 제안한 액션을 실행하는 버튼입니다.
 * 예: 인물 카드 생성, 시놉시스 업데이트 등
 */

import { Check, FileText, User, MapPin, Package } from 'lucide-react';
import type { SuggestedAction, ActionType } from '@/types';
import { cn } from '@/lib/cn';

interface ActionButtonProps {
  /** 액션 정보 */
  action: SuggestedAction;
  /** 클릭 콜백 */
  onClick?: () => void;
}

/**
 * 액션 타입별 아이콘
 */
const ACTION_ICONS: Record<ActionType, typeof FileText> = {
  create_character: User,
  update_character: User,
  create_location: MapPin,
  create_item: Package,
  update_synopsis: FileText,
  create_chapter_outline: FileText,
  apply_to_editor: FileText,
  save_to_notes: FileText,
};

/**
 * 액션 버튼
 */
export function ActionButton({ action, onClick }: ActionButtonProps) {
  const Icon = ACTION_ICONS[action.type] || FileText;

  const handleClick = () => {
    if (action.applied) return;

    // 사용자 정의 핸들러가 있으면 호출
    if (onClick) {
      onClick();
      return;
    }

    // 기본 액션 실행 로직
    // TODO: 액션 타입별 실행 로직 구현
    console.log('[ActionButton] Execute action:', action);
  };

  return (
    <button
      onClick={handleClick}
      disabled={action.applied}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
        'border border-border',
        'transition-colors',
        action.applied
          ? 'bg-accent text-muted-foreground cursor-default'
          : 'bg-background hover:bg-accent cursor-pointer'
      )}
    >
      {action.applied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      <span>{action.label}</span>
    </button>
  );
}
