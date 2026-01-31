/**
 * 모달 컨테이너
 *
 * 앱에서 사용하는 모든 모달을 관리합니다.
 * 현재 activeModal 상태에 따라 적절한 모달을 렌더링합니다.
 * 각 모달은 lazy loading으로 필요할 때만 로드됩니다.
 */

import { lazy, Suspense } from 'react';
import { useUIStore } from '@/stores';

// 모달 lazy loading
const NewProjectModal = lazy(() =>
  import('@/components/project/NewProjectModal').then((m) => ({
    default: m.NewProjectModal,
  }))
);
const ProjectListModal = lazy(() =>
  import('@/components/project/ProjectListModal').then((m) => ({
    default: m.ProjectListModal,
  }))
);
const ProjectSettingsModal = lazy(() =>
  import('@/components/project/ProjectSettingsModal').then((m) => ({
    default: m.ProjectSettingsModal,
  }))
);
const ExportModal = lazy(() =>
  import('@/components/project/ExportModal').then((m) => ({
    default: m.ExportModal,
  }))
);
const ConfirmDeleteModal = lazy(() =>
  import('./ConfirmDeleteModal').then((m) => ({
    default: m.ConfirmDeleteModal,
  }))
);
const CharacterCardModal = lazy(() =>
  import('@/components/worldbuilding/CharacterCardModal').then((m) => ({
    default: m.CharacterCardModal,
  }))
);
const LocationCardModal = lazy(() =>
  import('@/components/worldbuilding/LocationCardModal').then((m) => ({
    default: m.LocationCardModal,
  }))
);
const ItemCardModal = lazy(() =>
  import('@/components/worldbuilding/ItemCardModal').then((m) => ({
    default: m.ItemCardModal,
  }))
);
const VersionHistoryModal = lazy(() =>
  import('@/components/editor/VersionHistoryModal').then((m) => ({
    default: m.VersionHistoryModal,
  }))
);
const AuthModal = lazy(() =>
  import('@/components/auth/AuthModal').then((m) => ({
    default: m.AuthModal,
  }))
);
const ShortcutsModal = lazy(() =>
  import('@/components/modals/ShortcutsModal').then((m) => ({
    default: m.ShortcutsModal,
  }))
);
const QuickOpenModal = lazy(() =>
  import('@/components/modals/QuickOpenModal').then((m) => ({
    default: m.QuickOpenModal,
  }))
);
const ProjectSearchModal = lazy(() =>
  import('@/components/modals/ProjectSearchModal').then((m) => ({
    default: m.ProjectSearchModal,
  }))
);
const WritingGoalModal = lazy(() =>
  import('@/components/modals/WritingGoalModal').then((m) => ({
    default: m.WritingGoalModal,
  }))
);

// 모달 타입별 컴포넌트 매핑
const MODAL_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'new-project': NewProjectModal,
  'project-list': ProjectListModal,
  'project-settings': ProjectSettingsModal,
  export: ExportModal,
  'confirm-delete': ConfirmDeleteModal,
  'character-card': CharacterCardModal,
  'location-card': LocationCardModal,
  'item-card': ItemCardModal,
  'version-history': VersionHistoryModal,
  auth: AuthModal,
  shortcuts: ShortcutsModal,
  'quick-open': QuickOpenModal,
  'project-search': ProjectSearchModal,
  'writing-goal': WritingGoalModal,
};

export function ModalContainer() {
  const { activeModal } = useUIStore();

  // 열린 모달이 없으면 아무것도 렌더링하지 않음
  if (!activeModal) return null;

  const ModalComponent = MODAL_MAP[activeModal];
  if (!ModalComponent) return null;

  return (
    <Suspense fallback={null}>
      <ModalComponent />
    </Suspense>
  );
}
