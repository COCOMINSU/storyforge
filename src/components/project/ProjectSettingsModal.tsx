/**
 * 프로젝트 설정 모달
 *
 * 프로젝트의 기본 정보, 용어, 장르 등을 편집합니다.
 */

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { useProjectStore, useUIStore, useAuthStore, TEMPLATE_CONFIGS } from '@/stores';
import { cn } from '@/lib';
import type { Project, ProjectTemplate } from '@/types';

// 아이콘
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

const XIcon = () => (
  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TABS = [
  { id: 'general', label: '기본 정보' },
  { id: 'structure', label: '용어 설정' },
  { id: 'platform', label: '플랫폼' },
  { id: 'sync', label: '클라우드 동기화' },
  { id: 'danger', label: '위험 영역' },
];

const PLATFORM_OPTIONS = [
  { value: '문피아', label: '문피아' },
  { value: '카카오페이지', label: '카카오페이지' },
  { value: '네이버시리즈', label: '네이버시리즈' },
  { value: '리디북스', label: '리디북스' },
  { value: '조아라', label: '조아라' },
  { value: '기타', label: '기타' },
];

const GENRE_SUGGESTIONS = [
  '판타지', '현대판타지', '로맨스', '로맨스판타지', '무협',
  'SF', '미스터리', '스릴러', '호러', '드라마',
  '스포츠', '학원', '일상', 'BL', 'GL', '라이트노벨',
];

export function ProjectSettingsModal() {
  const { activeModal, closeModal, openModal } = useUIStore();
  const { currentProject, updateProject, closeProject } = useProjectStore();

  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [genreInput, setGenreInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isOpen = activeModal === 'project-settings';

  // 초기 데이터 설정
  useEffect(() => {
    if (currentProject && isOpen) {
      setFormData({
        title: currentProject.title,
        description: currentProject.description,
        genre: [...currentProject.genre],
        terminology: { ...currentProject.terminology },
        targetPlatform: currentProject.targetPlatform,
        targetLength: currentProject.targetLength,
      });
      setHasChanges(false);
      setActiveTab('general');
    }
  }, [currentProject, isOpen]);

  if (!currentProject) return null;

  const handleSave = async () => {
    if (!hasChanges) {
      closeModal();
      return;
    }

    setIsSaving(true);
    try {
      await updateProject(currentProject.id, formData);
      setHasChanges(false);
      closeModal();
    } catch (error) {
      console.error('저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      // 변경사항이 있으면 확인 (간단히 처리)
      if (confirm('저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?')) {
        closeModal();
      }
    } else {
      closeModal();
    }
  };

  const updateField = <K extends keyof Project>(field: K, value: Project[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateTerminology = (field: keyof Project['terminology'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      terminology: { ...prev.terminology!, [field]: value },
    }));
    setHasChanges(true);
  };

  const addGenre = (genre: string) => {
    const trimmed = genre.trim();
    if (trimmed && !formData.genre?.includes(trimmed)) {
      updateField('genre', [...(formData.genre || []), trimmed]);
    }
    setGenreInput('');
  };

  const removeGenre = (genre: string) => {
    updateField('genre', (formData.genre || []).filter((g) => g !== genre));
  };

  const handleDeleteProject = () => {
    openModal('confirm-delete', {
      type: 'project',
      id: currentProject.id,
      title: currentProject.title,
      onConfirm: async () => {
        const { deleteProject } = useProjectStore.getState();
        await deleteProject(currentProject.id);
        closeProject();
      },
    });
  };

  const resetTerminology = () => {
    const template = currentProject.template as ProjectTemplate;
    const config = TEMPLATE_CONFIGS[template];
    updateField('terminology', { ...config.terminology });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="프로젝트 설정"
      size="lg"
    >
      <div className="flex min-h-[400px]">
        {/* 사이드 탭 */}
        <div className="w-40 flex-shrink-0 border-r border-border pr-4">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full rounded px-3 py-2 text-left text-sm transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  tab.id === 'danger' && 'text-destructive hover:text-destructive'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 overflow-y-auto pl-6">
          {activeTab === 'general' && (
            <GeneralTab
              formData={formData}
              genreInput={genreInput}
              setGenreInput={setGenreInput}
              updateField={updateField}
              addGenre={addGenre}
              removeGenre={removeGenre}
            />
          )}
          {activeTab === 'structure' && (
            <StructureTab
              formData={formData}
              currentProject={currentProject}
              updateTerminology={updateTerminology}
              resetTerminology={resetTerminology}
            />
          )}
          {activeTab === 'platform' && (
            <PlatformTab formData={formData} updateField={updateField} />
          )}
          {activeTab === 'sync' && (
            <SyncTab currentProject={currentProject} />
          )}
          {activeTab === 'danger' && (
            <DangerTab
              currentProject={currentProject}
              onDeleteProject={handleDeleteProject}
            />
          )}
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={handleClose}
          disabled={isSaving}
          className="rounded border border-border bg-background px-4 py-2 text-foreground hover:bg-accent disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </ModalFooter>
    </Modal>
  );
}

// 기본 정보 탭
function GeneralTab({
  formData,
  genreInput,
  setGenreInput,
  updateField,
  addGenre,
  removeGenre,
}: {
  formData: Partial<Project>;
  genreInput: string;
  setGenreInput: (value: string) => void;
  updateField: <K extends keyof Project>(field: K, value: Project[K]) => void;
  addGenre: (genre: string) => void;
  removeGenre: (genre: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* 제목 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          프로젝트 제목
        </label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          placeholder="작품 제목을 입력하세요"
        />
      </div>

      {/* 설명 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          설명
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          placeholder="작품에 대한 간단한 설명 (선택사항)"
        />
      </div>

      {/* 장르 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          장르
        </label>

        {/* 선택된 장르 */}
        <div className="mb-2 flex flex-wrap gap-1">
          {(formData.genre || []).map((genre) => (
            <span
              key={genre}
              className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs text-primary"
            >
              {genre}
              <button
                onClick={() => removeGenre(genre)}
                className="rounded-full p-0.5 hover:bg-primary/20"
              >
                <XIcon />
              </button>
            </span>
          ))}
          {(formData.genre || []).length === 0 && (
            <span className="text-sm text-muted-foreground">장르를 선택하세요</span>
          )}
        </div>

        {/* 장르 입력 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addGenre(genreInput);
              }
            }}
            className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            placeholder="장르 입력 후 Enter"
          />
          <button
            onClick={() => addGenre(genreInput)}
            disabled={!genreInput.trim()}
            className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            추가
          </button>
        </div>

        {/* 장르 추천 */}
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-muted-foreground">추천 장르:</p>
          <div className="flex flex-wrap gap-1">
            {GENRE_SUGGESTIONS.filter((g) => !(formData.genre || []).includes(g))
              .slice(0, 10)
              .map((genre) => (
                <button
                  key={genre}
                  onClick={() => addGenre(genre)}
                  className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                >
                  + {genre}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 용어 설정 탭
function StructureTab({
  formData,
  currentProject,
  updateTerminology,
  resetTerminology,
}: {
  formData: Partial<Project>;
  currentProject: Project;
  updateTerminology: (field: keyof Project['terminology'], value: string) => void;
  resetTerminology: () => void;
}) {
  const templateName = TEMPLATE_CONFIGS[currentProject.template]?.name || '알 수 없음';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          현재 템플릿: <span className="font-medium text-foreground">{templateName}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          문서 구조에 표시되는 용어를 커스터마이징할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            1단계 (권)
          </label>
          <input
            type="text"
            value={formData.terminology?.volume || ''}
            onChange={(e) => updateTerminology('volume', e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="예: 권, 부, 파트"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            2단계 (화)
          </label>
          <input
            type="text"
            value={formData.terminology?.chapter || ''}
            onChange={(e) => updateTerminology('chapter', e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="예: 화, 장, 섹션"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            3단계 (씬)
          </label>
          <input
            type="text"
            value={formData.terminology?.scene || ''}
            onChange={(e) => updateTerminology('scene', e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="예: 씬, 절, 비트"
          />
        </div>
      </div>

      <div className="rounded border border-border bg-card p-4">
        <p className="text-sm text-foreground">미리보기:</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded bg-accent px-2 py-0.5">
            {formData.terminology?.volume || '권'} 1
          </span>
          <span>→</span>
          <span className="rounded bg-accent px-2 py-0.5">
            {formData.terminology?.chapter || '화'} 1
          </span>
          <span>→</span>
          <span className="rounded bg-accent px-2 py-0.5">
            {formData.terminology?.scene || '씬'} 1
          </span>
        </div>
      </div>

      <button
        onClick={resetTerminology}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        기본값으로 초기화
      </button>
    </div>
  );
}

// 플랫폼 탭
function PlatformTab({
  formData,
  updateField,
}: {
  formData: Partial<Project>;
  updateField: <K extends keyof Project>(field: K, value: Project[K]) => void;
}) {
  return (
    <div className="space-y-6">
      {/* 목표 플랫폼 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          목표 플랫폼
        </label>
        <select
          value={formData.targetPlatform || ''}
          onChange={(e) => updateField('targetPlatform', e.target.value || undefined)}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">선택 안 함</option>
          {PLATFORM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          선택한 플랫폼에 맞는 글자수 기준이 상태바에 표시됩니다.
        </p>
      </div>

      {/* 목표 글자수 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          화당 목표 글자수
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={formData.targetLength || ''}
            onChange={(e) =>
              updateField('targetLength', e.target.value ? parseInt(e.target.value, 10) : undefined)
            }
            className="w-32 rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="5000"
            min={0}
            step={500}
          />
          <span className="text-sm text-muted-foreground">자</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          에디터에서 목표 달성률을 확인할 수 있습니다.
        </p>
      </div>

      {/* 플랫폼별 권장 글자수 안내 */}
      <div className="rounded border border-border bg-card p-4">
        <p className="mb-2 text-sm font-medium text-foreground">플랫폼별 권장 글자수</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• 문피아: 4,000 ~ 6,000자 (공백 제외)</li>
          <li>• 카카오페이지: 3,000 ~ 5,000자 (공백 제외)</li>
          <li>• 네이버시리즈: 4,000 ~ 7,000자 (공백 포함)</li>
          <li>• 리디북스: 3,000 ~ 5,000자</li>
        </ul>
      </div>
    </div>
  );
}

// 위험 영역 탭
function DangerTab({
  currentProject,
  onDeleteProject,
}: {
  currentProject: Project;
  onDeleteProject: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText === currentProject.title;

  return (
    <div className="space-y-6">
      <div className="rounded border border-destructive/50 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
            <TrashIcon />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-destructive">프로젝트 삭제</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              이 작업은 되돌릴 수 없습니다. 프로젝트와 모든 문서, 세계관 카드가
              영구적으로 삭제됩니다.
            </p>

            <div className="mt-4">
              <label className="mb-2 block text-sm text-muted-foreground">
                삭제하려면 프로젝트 이름을 정확히 입력하세요:
                <span className="ml-1 font-medium text-foreground">
                  {currentProject.title}
                </span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded border border-destructive/50 bg-background px-3 py-2 text-sm focus:border-destructive focus:outline-none"
                placeholder={currentProject.title}
              />
            </div>

            <button
              onClick={onDeleteProject}
              disabled={!canDelete}
              className="mt-4 rounded bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              프로젝트 삭제
            </button>
          </div>
        </div>
      </div>

      {/* 프로젝트 정보 */}
      <div className="text-xs text-muted-foreground">
        <p>프로젝트 ID: {currentProject.id}</p>
        <p>생성일: {currentProject.createdAt.toLocaleDateString('ko-KR')}</p>
        <p>
          통계: {currentProject.stats.volumeCount}권, {currentProject.stats.chapterCount}화,{' '}
          {currentProject.stats.sceneCount}씬
        </p>
      </div>
    </div>
  );
}

// 클라우드 아이콘
const CloudIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const WarningIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

// 동기화 탭
function SyncTab({ currentProject }: { currentProject: Project }) {
  const {
    isAuthenticated,
    isSupabaseConfigured,
    syncInfo,
    syncNow,
    setSyncEnabled,
    user,
  } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!isAuthenticated || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncNow(currentProject.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleSync = (enabled: boolean) => {
    setSyncEnabled(enabled);
    if (enabled && isAuthenticated) {
      handleManualSync();
    }
  };

  // Supabase 미설정 상태
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <div className="rounded border border-border bg-card p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CloudIcon />
          </div>
          <h4 className="font-medium text-foreground">클라우드 동기화 비활성화</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            클라우드 동기화를 사용하려면 Supabase 설정이 필요합니다.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            .env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정하세요.
          </p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 상태
  if (!isAuthenticated || !user) {
    return (
      <div className="space-y-6">
        <div className="rounded border border-border bg-card p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CloudIcon />
          </div>
          <h4 className="font-medium text-foreground">로그인이 필요합니다</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            클라우드 동기화를 사용하려면 먼저 로그인하세요.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            왼쪽 상단의 로그인 버튼을 클릭하여 로그인할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  // 동기화 상태에 따른 표시
  const getSyncStatusDisplay = () => {
    switch (syncInfo.status) {
      case 'synced':
        return {
          icon: <CheckIcon />,
          text: '동기화 완료',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
        };
      case 'syncing':
        return {
          icon: <RefreshIcon />,
          text: '동기화 중...',
          color: 'text-primary',
          bgColor: 'bg-primary/10',
        };
      case 'error':
        return {
          icon: <WarningIcon />,
          text: '동기화 오류',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
        };
      case 'conflict':
        return {
          icon: <WarningIcon />,
          text: '충돌 발생',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
        };
      default:
        return {
          icon: <CloudIcon />,
          text: '오프라인',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
        };
    }
  };

  const statusDisplay = getSyncStatusDisplay();

  return (
    <div className="space-y-6">
      {/* 계정 정보 */}
      <div className="rounded border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">로그인 계정</p>
        <p className="mt-1 font-medium text-foreground">{user.email}</p>
      </div>

      {/* 동기화 토글 */}
      <div className="flex items-center justify-between rounded border border-border p-4">
        <div>
          <h4 className="font-medium text-foreground">자동 동기화</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            변경사항을 클라우드에 자동으로 저장합니다.
          </p>
        </div>
        <button
          onClick={() => handleToggleSync(!syncInfo.enabled)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            syncInfo.enabled ? 'bg-primary' : 'bg-muted'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              syncInfo.enabled ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {/* 동기화 상태 */}
      <div className="rounded border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('rounded-full p-2', statusDisplay.bgColor, statusDisplay.color)}>
              {statusDisplay.icon}
            </div>
            <div>
              <p className={cn('font-medium', statusDisplay.color)}>{statusDisplay.text}</p>
              {syncInfo.lastSyncedAt && (
                <p className="text-xs text-muted-foreground">
                  마지막 동기화:{' '}
                  {new Date(syncInfo.lastSyncedAt).toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing || syncInfo.status === 'syncing'}
            className={cn(
              'flex items-center gap-2 rounded border border-border px-3 py-1.5 text-sm transition-colors',
              'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50',
              isSyncing && 'animate-pulse'
            )}
          >
            <RefreshIcon />
            {isSyncing ? '동기화 중...' : '지금 동기화'}
          </button>
        </div>

        {syncInfo.pendingChanges > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            대기 중인 변경사항: {syncInfo.pendingChanges}개
          </p>
        )}
      </div>

      {/* 충돌 안내 */}
      {syncInfo.status === 'conflict' && (
        <div className="rounded border border-yellow-500/50 bg-yellow-500/5 p-4">
          <div className="flex gap-3">
            <div className="text-yellow-500">
              <WarningIcon />
            </div>
            <div>
              <h4 className="font-medium text-yellow-500">동기화 충돌 발생</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                로컬과 클라우드의 데이터가 다릅니다. 동기화 버튼을 클릭하면
                더 최근 데이터로 병합됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 안내 */}
      <div className="text-xs text-muted-foreground">
        <p>• 동기화된 프로젝트는 다른 기기에서도 접근할 수 있습니다.</p>
        <p>• 오프라인에서 작업한 내용은 온라인 시 자동으로 동기화됩니다.</p>
        <p>• 로컬 데이터는 동기화 여부와 관계없이 항상 보존됩니다.</p>
      </div>
    </div>
  );
}
