/**
 * 장소 카드 모달
 *
 * 장소 카드의 상세 정보를 조회하고 편집합니다.
 */

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { useWorldStore, useUIStore } from '@/stores';
import { ImageUploader } from './ImageUploader';
import type { LocationCard } from '@/types';

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

const MapPinIcon = () => (
  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export function LocationCardModal() {
  const { activeModal, modalData, closeModal, openModal } = useUIStore();
  const { locations, characters, updateLocation, deleteLocation } = useWorldStore();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<LocationCard>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isOpen = activeModal === 'location-card';
  const data = modalData as { cardId: string; mode: 'view' | 'edit' } | null;
  const location = locations.find((l) => l.id === data?.cardId);

  // 초기 데이터 설정
  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        description: location.description,
        tags: location.tags,
        imageUrl: location.imageUrl,
        locationType: location.locationType,
        region: location.region,
        features: location.features,
        atmosphere: location.atmosphere,
        significance: location.significance,
        relatedCharacters: location.relatedCharacters || [],
        relatedEvents: location.relatedEvents,
      });
      setEditMode(data?.mode === 'edit');
    }
  }, [location, data?.mode]);

  if (!location) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateLocation(location.id, formData);
      setEditMode(false);
    } catch (error) {
      console.error('저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    openModal('confirm-delete', {
      type: 'location',
      id: location.id,
      title: location.name,
      onConfirm: async () => {
        await deleteLocation(location.id);
      },
    });
  };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 관련 인물 이름 가져오기
  const getCharacterNames = (ids: string[]) => {
    return ids
      .map((id) => characters.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={editMode ? '장소 편집' : '장소 상세'}
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
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              {location.imageUrl ? (
                <img
                  src={location.imageUrl}
                  alt={location.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="text-green-500">
                  <MapPinIcon />
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
                placeholder="장소 이름"
              />
            ) : (
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {location.name}
              </h3>
            )}

            {editMode ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.locationType || ''}
                  onChange={(e) => updateField('locationType', e.target.value)}
                  className="rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                  placeholder="장소 유형 (예: 도시, 던전)"
                />
                <input
                  type="text"
                  value={formData.region || ''}
                  onChange={(e) => updateField('region', e.target.value)}
                  className="rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                  placeholder="지역/국가"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {location.locationType && (
                  <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-600">
                    {location.locationType}
                  </span>
                )}
                {location.region && (
                  <span className="rounded bg-accent px-2 py-0.5 text-xs text-muted-foreground">
                    {location.region}
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
                placeholder="장소에 대한 간단한 설명"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {location.description || '설명 없음'}
              </p>
            )}
          </div>

          {/* 특징 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              특징
            </label>
            {editMode ? (
              <textarea
                value={formData.features || ''}
                onChange={(e) => updateField('features', e.target.value)}
                rows={3}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="장소의 주요 특징"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {location.features || '설명 없음'}
              </p>
            )}
          </div>

          {/* 분위기 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              분위기
            </label>
            {editMode ? (
              <textarea
                value={formData.atmosphere || ''}
                onChange={(e) => updateField('atmosphere', e.target.value)}
                rows={2}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="장소의 분위기 (예: 어둡고 음산한, 활기차고 시끄러운)"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {location.atmosphere || '설명 없음'}
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
                placeholder="이 장소가 스토리에서 갖는 중요성"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {location.significance || '설명 없음'}
              </p>
            )}
          </div>

          {/* 관련 인물 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              관련 인물
            </label>
            {editMode ? (
              <select
                multiple
                value={formData.relatedCharacters || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(
                    (o) => o.value
                  );
                  updateField('relatedCharacters', selected);
                }}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-foreground">
                {location.relatedCharacters && location.relatedCharacters.length > 0
                  ? getCharacterNames(location.relatedCharacters)
                  : '관련 인물 없음'}
              </p>
            )}
          </div>

          {/* 관련 사건 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              관련 사건
            </label>
            {editMode ? (
              <textarea
                value={formData.relatedEvents || ''}
                onChange={(e) => updateField('relatedEvents', e.target.value)}
                rows={2}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="이 장소에서 벌어진 주요 사건들"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {location.relatedEvents || '관련 사건 없음'}
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
                placeholder="쉼표로 구분 (예: 위험, 비밀, 숲)"
              />
            ) : (
              <div className="flex flex-wrap gap-1">
                {location.tags.length > 0 ? (
                  location.tags.map((tag, i) => (
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
