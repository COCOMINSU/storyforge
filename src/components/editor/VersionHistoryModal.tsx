/**
 * 버전 히스토리 모달
 *
 * 씬의 버전 히스토리를 조회하고 복원할 수 있습니다.
 *
 * 기능:
 * - 버전 목록 표시 (최신순)
 * - 버전 미리보기
 * - 버전 복원 (현재 상태 자동 백업)
 * - 버전 유형 표시 (자동/수동/복원 전)
 */

import { useState, useMemo } from 'react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { useUIStore, useEditorStore } from '@/stores';
import { formatVersionTimestamp } from '@/lib/dateUtils';
import { cn } from '@/lib';
import type { DocumentVersion, VersionReason } from '@/types';

// 아이콘 컴포넌트
const ClockIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const SaveIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
    />
  </svg>
);

const RevertIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
    />
  </svg>
);

const HistoryIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/** 버전 유형별 라벨 및 스타일 */
const VERSION_REASON_CONFIG: Record<
  VersionReason,
  { label: string; icon: React.ReactNode; className: string }
> = {
  'auto-save': {
    label: '자동 저장',
    icon: <ClockIcon />,
    className: 'text-muted-foreground',
  },
  'manual-save': {
    label: '수동 저장',
    icon: <SaveIcon />,
    className: 'text-primary',
  },
  'before-revert': {
    label: '복원 전 백업',
    icon: <RevertIcon />,
    className: 'text-amber-500',
  },
};

interface VersionItemProps {
  version: DocumentVersion;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}

function VersionItem({ version, isSelected, isCurrent, onClick }: VersionItemProps) {
  const config = VERSION_REASON_CONFIG[version.reason];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-colors',
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50 hover:bg-accent/50'
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn('flex items-center gap-2', config.className)}>
          {config.icon}
          <span className="text-sm">{config.label}</span>
        </div>
        {isCurrent && (
          <span className="rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">
            현재
          </span>
        )}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {formatVersionTimestamp(version.createdAt)}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {version.stats.charCount.toLocaleString()}자 (공백 제외)
      </div>
    </button>
  );
}

export function VersionHistoryModal() {
  const { activeModal, closeModal } = useUIStore();
  const { versions, currentScene, revertToVersion, isLoadingVersions } = useEditorStore();

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');

  const isOpen = activeModal === 'version-history';

  // 선택된 버전
  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedVersionId),
    [versions, selectedVersionId]
  );

  // 현재 버전 (가장 최신)
  const currentVersionId = versions[0]?.id;

  // 버전 선택 시 미리보기 업데이트
  const handleSelectVersion = (version: DocumentVersion) => {
    setSelectedVersionId(version.id);
    setPreviewContent(version.plainText);
  };

  // 버전 복원
  const handleRevert = async () => {
    if (!selectedVersionId || selectedVersionId === currentVersionId) return;

    setIsReverting(true);
    try {
      await revertToVersion(selectedVersionId);
      closeModal();
    } catch (error) {
      console.error('버전 복원 실패:', error);
    } finally {
      setIsReverting(false);
    }
  };

  // 모달이 열릴 때 첫 버전 선택
  const handleOpen = () => {
    if (versions.length > 0 && !selectedVersionId) {
      handleSelectVersion(versions[0]);
    }
  };

  // 모달 열림 시 초기화
  if (isOpen && !selectedVersionId && versions.length > 0) {
    handleOpen();
  }

  if (!currentScene) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="버전 히스토리"
      description={`${currentScene.title} - 최대 50개 버전 보관`}
      size="xl"
    >
      <div className="flex min-h-[400px] gap-4">
        {/* 버전 목록 */}
        <div className="w-64 flex-shrink-0 overflow-y-auto rounded-lg border border-border bg-card p-2">
          {isLoadingVersions ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <HistoryIcon />
              <p className="mt-2 text-sm">저장된 버전이 없습니다</p>
              <p className="mt-1 text-xs">글을 작성하면 자동으로 버전이 저장됩니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isSelected={version.id === selectedVersionId}
                  isCurrent={version.id === currentVersionId}
                  onClick={() => handleSelectVersion(version)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 미리보기 */}
        <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-2">
            <h3 className="text-sm font-medium text-foreground">미리보기</h3>
            {selectedVersion && (
              <p className="text-xs text-muted-foreground">
                {formatVersionTimestamp(selectedVersion.createdAt)} •{' '}
                {VERSION_REASON_CONFIG[selectedVersion.reason].label}
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedVersion ? (
              <div className="whitespace-pre-wrap text-sm text-foreground">
                {previewContent || (
                  <span className="text-muted-foreground">(빈 내용)</span>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <p className="text-sm">버전을 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={closeModal}
          className="rounded border border-border bg-background px-4 py-2 text-foreground hover:bg-accent"
        >
          닫기
        </button>
        <button
          onClick={handleRevert}
          disabled={
            !selectedVersionId ||
            selectedVersionId === currentVersionId ||
            isReverting
          }
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isReverting ? '복원 중...' : '이 버전으로 복원'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
