/**
 * 서비스 모음
 *
 * 외부 서비스와의 통신을 담당하는 모듈들을 export합니다.
 */

export {
  uploadProject,
  downloadProject,
  getRemoteProjects,
  deleteRemoteProject,
  checkConflict,
  syncProject,
  type SyncResult,
  type SyncConflict,
} from './syncService';
