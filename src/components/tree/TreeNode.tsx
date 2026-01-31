/**
 * TreeNode 컴포넌트
 *
 * 개별 트리 노드를 렌더링합니다.
 * 드래그 가능하고, 자식 노드를 재귀적으로 렌더링합니다.
 * 우클릭 컨텍스트 메뉴를 지원합니다.
 */

import { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib';
import { useDocumentStore, useUIStore } from '@/stores';
import { ContextMenu, RenameModal, type ContextMenuItem } from '@/components/common';
import type { TreeNode as TreeNodeType, DocumentStatus } from '@/types';

interface TreeNodeProps {
  node: TreeNodeType;
  depth: number;
  expandedIds: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: TreeNodeType) => void;
  terminology: { volume: string; chapter: string; scene: string };
}

// 상태 아이콘
const STATUS_ICONS: Record<DocumentStatus, { icon: string; color: string; title: string }> = {
  draft: { icon: '○', color: 'text-status-draft', title: '구상 중' },
  writing: { icon: '✍', color: 'text-status-writing', title: '집필 중' },
  complete: { icon: '✔', color: 'text-status-complete', title: '탈고' },
  published: { icon: '↑', color: 'text-status-published', title: '업로드 완료' },
};

// 아이콘 컴포넌트들
const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CopyIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const StatusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export function TreeNode({
  node,
  depth,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
  terminology,
}: TreeNodeProps) {
  const {
    addChapter,
    addScene,
    deleteVolume,
    deleteChapter,
    deleteScene,
    updateVolume,
    updateChapter,
    updateScene,
    duplicateVolume,
    duplicateChapter,
    duplicateScene,
    setDocumentStatus,
  } = useDocumentStore();
  const { openModal } = useUIStore();

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  // 이름 변경 모달 상태
  const [showRenameModal, setShowRenameModal] = useState(false);

  const isExpanded = expandedIds.has(node.id);
  const isSelected = node.id === selectedId;
  const hasChildren = node.children && node.children.length > 0;
  const statusInfo = STATUS_ICONS[node.status];

  // 드래그 가능 설정
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 타입에 따른 용어 가져오기
  const getTypeName = useCallback(() => {
    switch (node.type) {
      case 'volume':
        return terminology.volume;
      case 'chapter':
        return terminology.chapter;
      case 'scene':
        return terminology.scene;
      default:
        return '';
    }
  }, [node.type, terminology]);

  // 추가 버튼 클릭
  const handleAdd = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (node.type === 'volume') {
      await addChapter(node.id);
      if (!isExpanded) onToggle(node.id);
    } else if (node.type === 'chapter') {
      await addScene(node.id);
      if (!isExpanded) onToggle(node.id);
    }
  };

  // 삭제 처리
  const handleDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    openModal('confirm-delete', {
      type: node.type,
      id: node.id,
      title: node.title,
      onConfirm: async () => {
        switch (node.type) {
          case 'volume':
            await deleteVolume(node.id);
            break;
          case 'chapter':
            await deleteChapter(node.id);
            break;
          case 'scene':
            await deleteScene(node.id);
            break;
        }
      },
    });
  };

  // 이름 변경 처리
  const handleRename = async (newName: string) => {
    switch (node.type) {
      case 'volume':
        await updateVolume(node.id, { title: newName });
        break;
      case 'chapter':
        await updateChapter(node.id, { title: newName });
        break;
      case 'scene':
        await updateScene(node.id, { title: newName });
        break;
    }
  };

  // 복제 처리
  const handleDuplicate = async () => {
    switch (node.type) {
      case 'volume':
        await duplicateVolume(node.id);
        break;
      case 'chapter':
        await duplicateChapter(node.id);
        break;
      case 'scene':
        await duplicateScene(node.id);
        break;
    }
  };

  // 상태 변경 처리
  const handleStatusChange = async (status: DocumentStatus) => {
    await setDocumentStatus(node.type, node.id, status);
  };

  // 버전 히스토리 열기 (씬 전용)
  const handleVersionHistory = () => {
    if (node.type === 'scene') {
      openModal('version-history');
    }
  };

  // 컨텍스트 메뉴 열기
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 컨텍스트 메뉴 아이템 생성
  const getContextMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];

    // 추가 (권, 화에서만)
    if (node.type === 'volume') {
      items.push({
        id: 'add-chapter',
        label: `${terminology.chapter} 추가`,
        icon: <PlusIcon />,
        onClick: () => handleAdd(),
      });
    } else if (node.type === 'chapter') {
      items.push({
        id: 'add-scene',
        label: `${terminology.scene} 추가`,
        icon: <PlusIcon />,
        onClick: () => handleAdd(),
      });
    }

    // 구분선
    if (items.length > 0) {
      items.push({ id: 'divider-1', label: '', divider: true });
    }

    // 이름 변경
    items.push({
      id: 'rename',
      label: '이름 변경',
      icon: <EditIcon />,
      shortcut: 'F2',
      onClick: () => setShowRenameModal(true),
    });

    // 복제
    items.push({
      id: 'duplicate',
      label: '복제',
      icon: <CopyIcon />,
      onClick: () => handleDuplicate(),
    });

    // 구분선
    items.push({ id: 'divider-2', label: '', divider: true });

    // 상태 변경 헤더
    items.push({
      id: 'status-header',
      label: '상태 변경',
      icon: <StatusIcon />,
      disabled: true,
    });

    // 상태 옵션들
    items.push({
      id: 'status-draft',
      label: '  ○ 구상 중',
      onClick: () => handleStatusChange('draft'),
      disabled: node.status === 'draft',
    });
    items.push({
      id: 'status-writing',
      label: '  ✍ 집필 중',
      onClick: () => handleStatusChange('writing'),
      disabled: node.status === 'writing',
    });
    items.push({
      id: 'status-complete',
      label: '  ✔ 탈고',
      onClick: () => handleStatusChange('complete'),
      disabled: node.status === 'complete',
    });
    items.push({
      id: 'status-published',
      label: '  ↑ 업로드 완료',
      onClick: () => handleStatusChange('published'),
      disabled: node.status === 'published',
    });

    // 버전 히스토리 (씬 전용)
    if (node.type === 'scene') {
      items.push({
        id: 'version-history',
        label: '버전 히스토리',
        icon: <HistoryIcon />,
        shortcut: 'Ctrl+H',
        onClick: () => handleVersionHistory(),
      });
    }

    // 구분선
    items.push({ id: 'divider-3', label: '', divider: true });

    // 삭제
    items.push({
      id: 'delete',
      label: '삭제',
      icon: <TrashIcon />,
      danger: true,
      onClick: () => handleDelete(),
    });

    return items;
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'tree-node',
          isDragging && 'opacity-50'
        )}
      >
        {/* 노드 행 */}
        <div
          className={cn(
            'group flex items-center gap-1 rounded px-2 py-1 cursor-pointer transition-colors',
            isSelected
              ? 'bg-primary/20 text-foreground'
              : 'hover:bg-accent text-foreground/80 hover:text-foreground'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onSelect(node)}
          onContextMenu={handleContextMenu}
          {...attributes}
          {...listeners}
        >
          {/* 펼치기/접기 버튼 */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.id);
              }}
              className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <svg
                className={cn(
                  'h-3 w-3 transition-transform',
                  isExpanded && 'rotate-90'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* 상태 아이콘 */}
          <span
            className={cn('text-xs', statusInfo.color)}
            title={statusInfo.title}
          >
            {statusInfo.icon}
          </span>

          {/* 제목 */}
          <span className="flex-1 truncate text-sm">{node.title}</span>

          {/* 액션 버튼 (호버 시 표시) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            {/* 추가 버튼 (권, 화에만) */}
            {node.type !== 'scene' && (
              <button
                onClick={(e) => handleAdd(e)}
                className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                title={`${node.type === 'volume' ? terminology.chapter : terminology.scene} 추가`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}

            {/* 삭제 버튼 */}
            <button
              onClick={(e) => handleDelete(e)}
              className="rounded p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
              title="삭제"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 자식 노드 */}
        {hasChildren && isExpanded && (
          <div className="tree-node-children">
            <SortableContext
              items={node.children!.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              {node.children!.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  expandedIds={expandedIds}
                  selectedId={selectedId}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  terminology={terminology}
                />
              ))}
            </SortableContext>
          </div>
        )}
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <ContextMenu
          items={getContextMenuItems()}
          position={contextMenu}
          onClose={closeContextMenu}
        />
      )}

      {/* 이름 변경 모달 */}
      <RenameModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        title={`${getTypeName()} 이름 변경`}
        currentName={node.title}
        itemType={getTypeName()}
        onRename={handleRename}
      />
    </>
  );
}
