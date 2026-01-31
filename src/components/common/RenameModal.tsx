/**
 * 이름 변경 모달
 *
 * 권/화/씬의 제목을 변경하는 모달입니다.
 */

import { useState, useEffect, useRef } from 'react';
import { Modal, ModalFooter } from './Modal';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentName: string;
  itemType: string;
  onRename: (newName: string) => Promise<void>;
}

export function RenameModal({
  isOpen,
  onClose,
  title,
  currentName,
  itemType,
  onRename,
}: RenameModalProps) {
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setError(null);
      // 포커스 및 전체 선택
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (trimmedName === currentName) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onRename(trimmedName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '이름 변경에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {itemType} 이름
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${itemType} 이름을 입력하세요`}
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded border border-border bg-background px-4 py-2 text-foreground hover:bg-accent disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? '변경 중...' : '변경'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
