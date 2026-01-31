/**
 * 삭제 확인 모달
 *
 * 프로젝트, 권, 화, 씬 등의 삭제 전 확인을 요청합니다.
 */

import { useState } from 'react';
import { Modal, ModalFooter } from './Modal';
import { useUIStore } from '@/stores';

export function ConfirmDeleteModal() {
  const { activeModal, modalData, closeModal } = useUIStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const isOpen = activeModal === 'confirm-delete';

  const data = modalData as {
    type: string;
    id: string;
    title: string;
    onConfirm: () => Promise<void>;
  } | null;

  if (!data) return null;

  const typeLabels: Record<string, string> = {
    project: '프로젝트',
    volume: '권',
    chapter: '화',
    scene: '씬',
    character: '인물 카드',
    location: '장소 카드',
    item: '아이템 카드',
  };

  const typeLabel = typeLabels[data.type] || '항목';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await data.onConfirm();
      closeModal();
    } catch (error) {
      console.error('삭제 실패:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={`${typeLabel} 삭제`}
      size="sm"
      closeOnBackdrop={!isDeleting}
      closeOnEsc={!isDeleting}
    >
      <div className="space-y-4">
        <div className="text-center">
          {/* 경고 아이콘 */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <p className="text-foreground">
            <span className="font-semibold">"{data.title}"</span>
            {data.type === 'project' ? (
              <span className="block mt-1 text-sm text-muted-foreground">
                프로젝트와 모든 데이터가 영구적으로 삭제됩니다.
              </span>
            ) : (
              <span className="block mt-1 text-sm text-muted-foreground">
                {typeLabel}을(를) 삭제하시겠습니까?
                {(data.type === 'volume' || data.type === 'chapter') && (
                  <span className="block text-destructive/80">
                    하위 항목도 모두 삭제됩니다.
                  </span>
                )}
              </span>
            )}
          </p>
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={closeModal}
          disabled={isDeleting}
          className="rounded border border-border bg-background px-4 py-2 text-foreground hover:bg-accent disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
        >
          {isDeleting ? '삭제 중...' : '삭제'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
