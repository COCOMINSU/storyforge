/**
 * 키보드 단축키 도움말 모달
 *
 * Ctrl+/ 로 열 수 있습니다.
 */

import { Modal } from '@/components/common/Modal';
import { useUIStore } from '@/stores';
import { getShortcutsByCategory } from '@/hooks/useKeyboardShortcuts';
import { formatShortcut } from '@/lib';

export function ShortcutsModal() {
  const { activeModal, closeModal } = useUIStore();
  const isOpen = activeModal === 'shortcuts';

  if (!isOpen) return null;

  const categories = getShortcutsByCategory();

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="키보드 단축키" size="md">
      <div className="space-y-6">
        {Object.entries(categories).map(([key, category]) => (
          <div key={key}>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {category.label}
            </h3>
            <div className="space-y-2">
              {category.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-accent"
                >
                  <span className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                    {formatShortcut(shortcut.shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <p>에디터 내 서식 단축키(굵게, 기울임 등)는 에디터 포커스 시 작동합니다.</p>
        </div>
      </div>
    </Modal>
  );
}
