/**
 * 인물 카드 모달
 *
 * 인물 카드의 상세 정보를 조회하고 편집합니다.
 */

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { useWorldStore, useUIStore } from '@/stores';
import { cn } from '@/lib';
import { ImageUploader } from './ImageUploader';
import type { CharacterCard, CharacterRole } from '@/types';

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

const ROLE_OPTIONS: Array<{ value: CharacterRole; label: string }> = [
  { value: 'protagonist', label: '주인공' },
  { value: 'antagonist', label: '악역' },
  { value: 'supporting', label: '조연' },
  { value: 'minor', label: '단역' },
];

const TABS = [
  { id: 'basic', label: '기본 정보' },
  { id: 'appearance', label: '외모' },
  { id: 'personality', label: '성격/배경' },
  { id: 'abilities', label: '능력' },
  { id: 'relationships', label: '관계' },
];

export function CharacterCardModal() {
  const { activeModal, modalData, closeModal, openModal } = useUIStore();
  const { characters, updateCharacter, deleteCharacter } = useWorldStore();

  const [activeTab, setActiveTab] = useState('basic');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<CharacterCard>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isOpen = activeModal === 'character-card';
  const data = modalData as { cardId: string; mode: 'view' | 'edit' } | null;
  const character = characters.find((c) => c.id === data?.cardId);

  // 초기 데이터 설정
  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name,
        description: character.description,
        tags: character.tags,
        role: character.role,
        imageUrl: character.imageUrl,
        basicInfo: { ...character.basicInfo },
        appearance: { ...character.appearance },
        personality: character.personality,
        background: character.background,
        motivation: character.motivation,
        abilities: character.abilities ? [...character.abilities] : [],
        relationships: [...character.relationships],
        arc: character.arc ? [...character.arc] : [],
        firstAppearance: character.firstAppearance,
      });
      setEditMode(data?.mode === 'edit');
    }
  }, [character, data?.mode]);

  if (!character) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCharacter(character.id, formData);
      setEditMode(false);
    } catch (error) {
      console.error('저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    openModal('confirm-delete', {
      type: 'character',
      id: character.id,
      title: character.name,
      onConfirm: async () => {
        await deleteCharacter(character.id);
      },
    });
  };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateBasicInfo = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value },
    }));
  };

  const updateAppearance = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, [field]: value },
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={editMode ? '인물 편집' : '인물 상세'}
      size="lg"
    >
      <div className="flex min-h-[400px] flex-col">
        {/* 헤더 - 이름 및 역할 */}
        <div className="mb-4 flex items-start gap-4">
          {/* 이미지 */}
          {editMode ? (
            <ImageUploader
              value={formData.imageUrl}
              onChange={(value) => updateField('imageUrl', value)}
              className="h-24 w-24 flex-shrink-0"
            />
          ) : (
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              {character.imageUrl ? (
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <svg
                  className="h-10 w-10 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>
          )}

          {/* 이름 및 역할 */}
          <div className="flex-1">
            {editMode ? (
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                className="mb-2 w-full rounded border border-border bg-background px-3 py-2 text-lg font-semibold focus:border-primary focus:outline-none"
                placeholder="인물 이름"
              />
            ) : (
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {character.name}
              </h3>
            )}

            {editMode ? (
              <select
                value={formData.role || 'supporting'}
                onChange={(e) => updateField('role', e.target.value)}
                className="rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className={cn(
                  'inline-block rounded px-2 py-0.5 text-xs',
                  character.role === 'protagonist' &&
                    'bg-yellow-500/20 text-yellow-600',
                  character.role === 'antagonist' && 'bg-red-500/20 text-red-600',
                  character.role === 'supporting' && 'bg-blue-500/20 text-blue-600',
                  character.role === 'minor' && 'bg-gray-500/20 text-gray-600'
                )}
              >
                {ROLE_OPTIONS.find((r) => r.value === character.role)?.label}
              </span>
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

        {/* 탭 */}
        <div className="mb-4 flex gap-1 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-2 text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'basic' && (
            <BasicInfoTab
              character={character}
              formData={formData}
              editMode={editMode}
              updateField={updateField}
              updateBasicInfo={updateBasicInfo}
            />
          )}
          {activeTab === 'appearance' && (
            <AppearanceTab
              character={character}
              formData={formData}
              editMode={editMode}
              updateAppearance={updateAppearance}
            />
          )}
          {activeTab === 'personality' && (
            <PersonalityTab
              character={character}
              formData={formData}
              editMode={editMode}
              updateField={updateField}
            />
          )}
          {activeTab === 'abilities' && (
            <AbilitiesTab
              character={character}
              formData={formData}
              editMode={editMode}
              updateField={updateField}
            />
          )}
          {activeTab === 'relationships' && (
            <RelationshipsTab
              character={character}
              formData={formData}
              editMode={editMode}
              updateField={updateField}
            />
          )}
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

// 기본 정보 탭
function BasicInfoTab({
  character,
  formData,
  editMode,
  updateField,
  updateBasicInfo,
}: {
  character: CharacterCard;
  formData: Partial<CharacterCard>;
  editMode: boolean;
  updateField: (field: string, value: unknown) => void;
  updateBasicInfo: (field: string, value: string) => void;
}) {
  const info = editMode ? formData.basicInfo : character.basicInfo;

  return (
    <div className="space-y-4">
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
            placeholder="인물에 대한 간단한 설명"
          />
        ) : (
          <p className="text-sm text-foreground">
            {character.description || '설명 없음'}
          </p>
        )}
      </div>

      {/* 기본 정보 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            나이
          </label>
          {editMode ? (
            <input
              type="text"
              value={info?.age || ''}
              onChange={(e) => updateBasicInfo('age', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="예: 25세, 20대 초반"
            />
          ) : (
            <p className="text-sm text-foreground">{info?.age || '-'}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            성별
          </label>
          {editMode ? (
            <input
              type="text"
              value={info?.gender || ''}
              onChange={(e) => updateBasicInfo('gender', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="예: 남성, 여성"
            />
          ) : (
            <p className="text-sm text-foreground">{info?.gender || '-'}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            직업/역할
          </label>
          {editMode ? (
            <input
              type="text"
              value={info?.occupation || ''}
              onChange={(e) => updateBasicInfo('occupation', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="예: 검사, 마법사, 학생"
            />
          ) : (
            <p className="text-sm text-foreground">{info?.occupation || '-'}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            첫 등장
          </label>
          {editMode ? (
            <input
              type="text"
              value={formData.firstAppearance || ''}
              onChange={(e) => updateField('firstAppearance', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="예: 1권 3화"
            />
          ) : (
            <p className="text-sm text-foreground">
              {character.firstAppearance || '-'}
            </p>
          )}
        </div>
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
            placeholder="쉼표로 구분 (예: 귀족, 검술, 냉정함)"
          />
        ) : (
          <div className="flex flex-wrap gap-1">
            {character.tags.length > 0 ? (
              character.tags.map((tag, i) => (
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
  );
}

// 외모 탭
function AppearanceTab({
  character,
  formData,
  editMode,
  updateAppearance,
}: {
  character: CharacterCard;
  formData: Partial<CharacterCard>;
  editMode: boolean;
  updateAppearance: (field: string, value: string) => void;
}) {
  const appearance = editMode ? formData.appearance : character.appearance;

  const fields = [
    { id: 'height', label: '키', placeholder: '예: 175cm, 장신' },
    { id: 'bodyType', label: '체형', placeholder: '예: 근육질, 마른 체형' },
    { id: 'hairColor', label: '머리색', placeholder: '예: 흑발, 금발' },
    { id: 'eyeColor', label: '눈 색', placeholder: '예: 갈색, 파란색' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {field.label}
            </label>
            {editMode ? (
              <input
                type="text"
                value={(appearance as Record<string, string>)?.[field.id] || ''}
                onChange={(e) => updateAppearance(field.id, e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder={field.placeholder}
              />
            ) : (
              <p className="text-sm text-foreground">
                {(appearance as Record<string, string>)?.[field.id] || '-'}
              </p>
            )}
          </div>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          특징적인 외모
        </label>
        {editMode ? (
          <textarea
            value={appearance?.distinguishingFeatures || ''}
            onChange={(e) =>
              updateAppearance('distinguishingFeatures', e.target.value)
            }
            rows={3}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="흉터, 문신, 특이한 장신구 등"
          />
        ) : (
          <p className="text-sm text-foreground">
            {appearance?.distinguishingFeatures || '특이사항 없음'}
          </p>
        )}
      </div>
    </div>
  );
}

// 성격/배경 탭
function PersonalityTab({
  character,
  formData,
  editMode,
  updateField,
}: {
  character: CharacterCard;
  formData: Partial<CharacterCard>;
  editMode: boolean;
  updateField: (field: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          성격
        </label>
        {editMode ? (
          <textarea
            value={formData.personality || ''}
            onChange={(e) => updateField('personality', e.target.value)}
            rows={4}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="인물의 성격을 설명하세요"
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {character.personality || '설명 없음'}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          배경 스토리
        </label>
        {editMode ? (
          <textarea
            value={formData.background || ''}
            onChange={(e) => updateField('background', e.target.value)}
            rows={4}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="인물의 과거와 배경을 설명하세요"
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {character.background || '설명 없음'}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          동기/목표
        </label>
        {editMode ? (
          <textarea
            value={formData.motivation || ''}
            onChange={(e) => updateField('motivation', e.target.value)}
            rows={3}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="인물이 추구하는 목표나 동기"
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {character.motivation || '설명 없음'}
          </p>
        )}
      </div>
    </div>
  );
}

// 능력 탭
function AbilitiesTab({
  character,
  formData,
  editMode,
  updateField,
}: {
  character: CharacterCard;
  formData: Partial<CharacterCard>;
  editMode: boolean;
  updateField: (field: string, value: unknown) => void;
}) {
  const abilities = editMode ? formData.abilities : character.abilities;

  const addAbility = () => {
    updateField('abilities', [
      ...(formData.abilities || []),
      { name: '', description: '', level: '' },
    ]);
  };

  const updateAbility = (index: number, field: string, value: string) => {
    const newAbilities = [...(formData.abilities || [])];
    newAbilities[index] = { ...newAbilities[index], [field]: value };
    updateField('abilities', newAbilities);
  };

  const removeAbility = (index: number) => {
    const newAbilities = [...(formData.abilities || [])];
    newAbilities.splice(index, 1);
    updateField('abilities', newAbilities);
  };

  return (
    <div className="space-y-3">
      {abilities && abilities.length > 0 ? (
        abilities.map((ability, index) => (
          <div
            key={index}
            className="rounded border border-border bg-card p-3"
          >
            {editMode ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ability.name}
                    onChange={(e) => updateAbility(index, 'name', e.target.value)}
                    className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm font-medium focus:border-primary focus:outline-none"
                    placeholder="능력 이름"
                  />
                  <input
                    type="text"
                    value={ability.level || ''}
                    onChange={(e) => updateAbility(index, 'level', e.target.value)}
                    className="w-20 rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                    placeholder="등급"
                  />
                  <button
                    onClick={() => removeAbility(index)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <textarea
                  value={ability.description}
                  onChange={(e) =>
                    updateAbility(index, 'description', e.target.value)
                  }
                  rows={2}
                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                  placeholder="능력 설명"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{ability.name}</span>
                  {ability.level && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                      {ability.level}
                    </span>
                  )}
                </div>
                {ability.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ability.description}
                  </p>
                )}
              </>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          등록된 능력이 없습니다
        </p>
      )}

      {editMode && (
        <button
          onClick={addAbility}
          className="w-full rounded border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          + 능력 추가
        </button>
      )}
    </div>
  );
}

// 관계 탭
function RelationshipsTab({
  character,
  formData,
  editMode,
  updateField,
}: {
  character: CharacterCard;
  formData: Partial<CharacterCard>;
  editMode: boolean;
  updateField: (field: string, value: unknown) => void;
}) {
  const { characters } = useWorldStore();
  const relationships = editMode ? formData.relationships : character.relationships;

  const addRelationship = () => {
    updateField('relationships', [
      ...(formData.relationships || []),
      { targetId: '', targetName: '', relationType: '', description: '' },
    ]);
  };

  const updateRelationship = (
    index: number,
    field: string,
    value: string
  ) => {
    const newRelationships = [...(formData.relationships || [])];

    if (field === 'targetId') {
      const targetChar = characters.find((c) => c.id === value);
      newRelationships[index] = {
        ...newRelationships[index],
        targetId: value,
        targetName: targetChar?.name || '',
      };
    } else {
      newRelationships[index] = { ...newRelationships[index], [field]: value };
    }

    updateField('relationships', newRelationships);
  };

  const removeRelationship = (index: number) => {
    const newRelationships = [...(formData.relationships || [])];
    newRelationships.splice(index, 1);
    updateField('relationships', newRelationships);
  };

  const otherCharacters = characters.filter((c) => c.id !== character.id);

  return (
    <div className="space-y-3">
      {relationships && relationships.length > 0 ? (
        relationships.map((rel, index) => (
          <div key={index} className="rounded border border-border bg-card p-3">
            {editMode ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={rel.targetId}
                    onChange={(e) =>
                      updateRelationship(index, 'targetId', e.target.value)
                    }
                    className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">인물 선택</option>
                    {otherCharacters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={rel.relationType}
                    onChange={(e) =>
                      updateRelationship(index, 'relationType', e.target.value)
                    }
                    className="w-24 rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                    placeholder="관계"
                  />
                  <button
                    onClick={() => removeRelationship(index)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <input
                  type="text"
                  value={rel.description || ''}
                  onChange={(e) =>
                    updateRelationship(index, 'description', e.target.value)
                  }
                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                  placeholder="관계 설명 (선택사항)"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {rel.targetName}
                  </span>
                  <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-muted-foreground">
                    {rel.relationType}
                  </span>
                </div>
                {rel.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {rel.description}
                  </p>
                )}
              </>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          등록된 관계가 없습니다
        </p>
      )}

      {editMode && (
        <button
          onClick={addRelationship}
          className="w-full rounded border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          + 관계 추가
        </button>
      )}
    </div>
  );
}
