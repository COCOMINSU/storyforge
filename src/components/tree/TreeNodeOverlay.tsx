/**
 * TreeNodeOverlay 컴포넌트
 *
 * 드래그 중에 표시되는 오버레이입니다.
 */

import type { TreeNode as TreeNodeType, DocumentStatus } from '@/types';

interface TreeNodeOverlayProps {
  node: TreeNodeType;
  terminology: { volume: string; chapter: string; scene: string };
}

// 상태 아이콘
const STATUS_ICONS: Record<DocumentStatus, { icon: string; color: string }> = {
  draft: { icon: '○', color: 'text-status-draft' },
  writing: { icon: '✍', color: 'text-status-writing' },
  complete: { icon: '✔', color: 'text-status-complete' },
  published: { icon: '↑', color: 'text-status-published' },
};

export function TreeNodeOverlay({ node, terminology }: TreeNodeOverlayProps) {
  const statusInfo = STATUS_ICONS[node.status];

  return (
    <div className="flex items-center gap-2 rounded bg-card px-3 py-2 shadow-lg ring-2 ring-primary">
      {/* 상태 아이콘 */}
      <span className={`text-xs ${statusInfo.color}`}>{statusInfo.icon}</span>

      {/* 제목 */}
      <span className="text-sm font-medium text-foreground">{node.title}</span>

      {/* 타입 배지 */}
      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
        {node.type === 'volume'
          ? terminology.volume
          : node.type === 'chapter'
          ? terminology.chapter
          : terminology.scene}
      </span>
    </div>
  );
}
