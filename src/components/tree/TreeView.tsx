/**
 * TreeView 컴포넌트
 *
 * 문서 구조(권-화-씬)를 계층적으로 표시합니다.
 * @dnd-kit을 사용한 드래그 앤 드롭을 지원합니다.
 */

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDocumentStore, useProjectStore } from '@/stores';
import { TreeNode } from './TreeNode';
import { TreeNodeOverlay } from './TreeNodeOverlay';
import type { TreeNode as TreeNodeType } from '@/types';

export function TreeView() {
  const { treeData, selectedSceneId, selectScene, reorderVolumes, reorderChapters, reorderScenes } = useDocumentStore();
  const { currentProject } = useProjectStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeNode, setActiveNode] = useState<TreeNodeType | null>(null);

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 노드 토글
  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // 모두 펼치기
  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collectIds = (nodes: TreeNodeType[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      });
    };
    collectIds(treeData);
    setExpandedIds(allIds);
  }, [treeData]);

  // 모두 접기
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // 드래그 시작
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const node = findNodeById(treeData, active.id as string);
    setActiveNode(node || null);
  };

  // 드래그 종료
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNode(null);

    if (!over || active.id === over.id) return;

    const activeNode = findNodeById(treeData, active.id as string);
    const overNode = findNodeById(treeData, over.id as string);

    if (!activeNode || !overNode) return;

    // 같은 타입끼리만 이동 가능
    if (activeNode.type !== overNode.type) return;

    // 같은 부모 내에서만 순서 변경
    if (activeNode.parentId !== overNode.parentId) return;

    const activeIndex = findNodeIndex(treeData, activeNode);
    const overIndex = findNodeIndex(treeData, overNode);

    if (activeIndex === -1 || overIndex === -1) return;

    // 타입에 따라 적절한 reorder 함수 호출
    switch (activeNode.type) {
      case 'volume':
        await reorderVolumes(activeIndex, overIndex);
        break;
      case 'chapter':
        if (activeNode.parentId) {
          await reorderChapters(activeNode.parentId, activeIndex, overIndex);
        }
        break;
      case 'scene':
        if (activeNode.parentId) {
          await reorderScenes(activeNode.parentId, activeIndex, overIndex);
        }
        break;
    }
  };

  // 씬 선택
  const handleSelect = (node: TreeNodeType) => {
    if (node.type === 'scene') {
      selectScene(node.id);
    } else {
      // 권/화 클릭 시 토글
      toggleExpand(node.id);
    }
  };

  // 용어 가져오기
  const terminology = currentProject?.terminology || {
    volume: '권',
    chapter: '화',
    scene: '씬',
  };

  if (treeData.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        문서가 없습니다.
        <br />
        <span className="text-xs">상단의 + 버튼으로 {terminology.volume}을 추가하세요.</span>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="tree-view">
        {/* 트리 헤더 */}
        <div className="mb-2 flex items-center justify-end gap-1 px-1">
          <button
            onClick={expandAll}
            className="rounded p-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            title="모두 펼치기"
          >
            펼치기
          </button>
          <span className="text-muted-foreground/50">|</span>
          <button
            onClick={collapseAll}
            className="rounded p-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            title="모두 접기"
          >
            접기
          </button>
        </div>

        {/* 트리 노드 */}
        <SortableContext
          items={treeData.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          {treeData.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              expandedIds={expandedIds}
              selectedId={selectedSceneId}
              onToggle={toggleExpand}
              onSelect={handleSelect}
              terminology={terminology}
            />
          ))}
        </SortableContext>
      </div>

      {/* 드래그 오버레이 */}
      <DragOverlay>
        {activeNode ? (
          <TreeNodeOverlay node={activeNode} terminology={terminology} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// 헬퍼: ID로 노드 찾기
function findNodeById(nodes: TreeNodeType[], id: string): TreeNodeType | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// 헬퍼: 노드의 형제 내 인덱스 찾기
function findNodeIndex(nodes: TreeNodeType[], target: TreeNodeType): number {
  // 최상위 레벨 (권)
  if (target.type === 'volume') {
    return nodes.findIndex((n) => n.id === target.id);
  }

  // 하위 레벨 탐색
  for (const node of nodes) {
    if (node.children) {
      const index = node.children.findIndex((n) => n.id === target.id);
      if (index !== -1) return index;

      // 더 깊은 레벨 탐색
      for (const child of node.children) {
        if (child.children) {
          const deepIndex = child.children.findIndex((n) => n.id === target.id);
          if (deepIndex !== -1) return deepIndex;
        }
      }
    }
  }

  return -1;
}
