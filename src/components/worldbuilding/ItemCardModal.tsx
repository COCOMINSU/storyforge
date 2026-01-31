/**
 * 아이템 카드 모달
 *
 * 아이템 카드의 상세 정보를 조회하고 편집합니다.
 */

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { useWorldStore, useUIStore } from '@/stores';
import { ImageUploader } from './ImageUploader';
import type { ItemCard } from '@/types';

// 아이콘
const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const CubeIcon = () => (
  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const RARITY_COLORS: Record<string, string> = {
  일반: 'bg-gray-500/20 text-gray-600',
  고급: 'bg-green-500/20 text-green-600',
  희귀: 'bg-blue-500/20 text-blue-600',
  영웅: 'bg-purple-500/20 text-purple-600',
  전설: 'bg-amber-500/20 text-amber-600',
  신화: 'bg-red-500/20 text-red-600',
};

export function ItemCardModal() {
  const { activeModal, modalData, closeModal, openModal } = useUIStore();
  const { items, characters, updateItem, deleteItem } = useWorldStore();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<ItemCard>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isOpen = activeModal === 'item-card';
  const data = modalData as { cardId: string; mode: 'view' | 'edit' } | null;
  const item = items.find((i) => i.id === data?.cardId);

  // 초기 데이터 설정
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        tags: item.tags,
        imageUrl: item.imageUrl,
        itemType: item.itemType,
        rarity: item.rarity,
        properties: item.properties,
        origin: item.origin,
        currentOwner: item.currentOwner,
        significance: item.significance,
      });
      setEditMode(data?.mode === 'edit');
    }
  }, [item, data?.mode]);

  if (!item) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateItem(item.id, formData);
      setEditMode(false);
    } catch (error) {
      console.error('저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    openModal('confirm-delete', {
      type: 'item',
      id: item.id,
      title: item.name,
      onConfirm: async () => {
        await deleteItem(item.id);
      },
    });
  };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 소유자 이름 가져오기
  const getOwnerName = (ownerId?: string) => {
    if (!ownerId) return null;
    return characters.find((c) => c.id === ownerId)?.name;
  };

  const rarityColor = item.rarity
    ? RARITY_COLORS[item.rarity] || 'bg-accent text-muted-foreground'
    : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={editMode ? '아이템 편집' : '아이템 상세'}
      size="lg"
    >
      <div className="flex min-h-[400px] flex-col">
        {/* 헤더 */}
        <div className="mb-4 flex items-start gap-4">
          {/* 이미지 */}
          {editMode ? (
            <ImageUploader
              value={formData.imageUrl}
              onChange={(value) => updateField('imageUrl', value)}
              className="h-24 w-24 flex-shrink-0"
            />
          ) : (
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="text-amber-500">
                  <CubeIcon />
                </div>
              )}
            </div>
          )}

          {/* 이름 및 유형 */}
          <div className="flex-1">
            {editMode ? (
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                className="mb-2 w-full rounded border border-border bg-background px-3 py-2 text-lg font-semibold focus:border-primary focus:outline-none"
                placeholder="아이템 이름"
              />
            ) : (
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {item.name}
              </h3>
            )}

            {editMode ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.itemType || ''}
                  onChange={(e) => updateField('itemType', e.target.value)}
                  className="rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                  placeholder="아이템 유형 (예: 무기, 방어구)"
                />
                <input
                  type="text"
                  value={formData.rarity || ''}
                  onChange={(e) => updateField('rarity', e.target.value)}
                  className="rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                  placeholder="희귀도 (예: 전설)"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {item.itemType && (
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-600">
                    {item.itemType}
                  </span>
                )}
                {item.rarity && (
                  <span className={`rounded px-2 py-0.5 text-xs ${rarityColor}`}>
                    {item.rarity}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          {!editMode && (
            <div className="flex gap-1">
              <button
                onClick={() => setEditMode(true)}
                className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="편집"
              >
                <EditIcon />
              </button>
              <button
                onClick={handleDelete}
                className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="삭제"
              >
                <TrashIcon />
              </button>
            </div>
          )}
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* 설명 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              설명
            </label>
            {editMode ? (
              <textarea
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="아이템에 대한 간단한 설명"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {item.description || '설명 없음'}
              </p>
            )}
          </div>

          {/* 특성/능력 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              특성/능력
            </label>
            {editMode ? (
              <textarea
                value={formData.properties || ''}
                onChange={(e) => updateField('properties', e.target.value)}
                rows={3}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="아이템의 특수 능력이나 효과"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {item.properties || '특성 없음'}
              </p>
            )}
          </div>

          {/* 출처/역사 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              출처/역사
            </label>
            {editMode ? (
              <textarea
                value={formData.origin || ''}
                onChange={(e) => updateField('origin', e.target.value)}
                rows={2}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="아이템의 유래나 역사"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {item.origin || '정보 없음'}
              </p>
            )}
          </div>

          {/* 현재 소유자 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              현재 소유자
            </label>
            {editMode ? (
              <select
                value={formData.currentOwner || ''}
                onChange={(e) => updateField('currentOwner', e.target.value || undefined)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">소유자 없음</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-foreground">
                {getOwnerName(item.currentOwner) || '소유자 없음'}
              </p>
            )}
          </div>

          {/* 스토리상 의미 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              스토리상 의미
            </label>
            {editMode ? (
              <textarea
                value={formData.significance || ''}
                onChange={(e) => updateField('significance', e.target.value)}
                rows={2}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="이 아이템이 스토리에서 갖는 중요성"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {item.significance || '설명 없음'}
              </p>
            )}
          </div>

          {/* 태그 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              태그
            </label>
            {editMode ? (
              <input
                type="text"
                value={(formData.tags || []).join(', ')}
                onChange={(e) =>
                  updateField(
                    'tags',
                    e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="쉼표로 구분 (예: 마법, 저주, 고대)"
              />
            ) : (
              <div className="flex flex-wrap gap-1">
                {item.tags.length > 0 ? (
                  item.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded bg-accent px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">태그 없음</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalFooter>
        {editMode ? (
          <>
            <button
              onClick={() => setEditMode(false)}
              disabled={isSaving}
              className="rounded border border-border bg-background px-4 py-2 text-foreground hover:bg-accent disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </>
        ) : (
          <button
            onClick={closeModal}
            className="rounded border border-border bg-background px-4 py-2 text-foreground hover:bg-accent"
          >
            닫기
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
