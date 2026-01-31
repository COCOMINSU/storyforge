/**
 * 문서 관련 타입 정의
 *
 * Storyforge의 문서 구조는 3단계 계층입니다:
 * Volume (권) → Chapter (화) → Scene (씬)
 *
 * Scene이 실제 글 내용을 포함하는 최소 단위입니다.
 */

import type { DocumentStatus } from './project';

/**
 * 권 (Volume) - 트리 1단계
 *
 * 여러 Chapter를 포함합니다.
 * IndexedDB의 'volumes' 테이블에 저장됩니다.
 */
export interface Volume {
  /** UUID v4 형식의 고유 식별자 */
  id: string;

  /** 소속 프로젝트 ID */
  projectId: string;

  /** 권 제목 (예: "1권", "프롤로그") */
  title: string;

  /** 정렬 순서 (0부터 시작) */
  order: number;

  /** 문서 상태 */
  status: DocumentStatus;

  /** 통계 (하위 Chapter/Scene 합계) */
  stats: {
    charCount: number;
    charCountWithSpaces: number;
    chapterCount: number;
  };

  /** 생성 시각 */
  createdAt: Date;

  /** 마지막 수정 시각 */
  updatedAt: Date;
}

/**
 * 화 (Chapter) - 트리 2단계
 *
 * 여러 Scene을 포함합니다.
 * IndexedDB의 'chapters' 테이블에 저장됩니다.
 */
export interface Chapter {
  /** UUID v4 형식의 고유 식별자 */
  id: string;

  /** 소속 Volume ID */
  volumeId: string;

  /** 소속 프로젝트 ID (빠른 쿼리용 역참조) */
  projectId: string;

  /** 화 제목 (예: "1화 - 시작") */
  title: string;

  /** Volume 내 정렬 순서 */
  order: number;

  /** 문서 상태 */
  status: DocumentStatus;

  /** 통계 (하위 Scene 합계) */
  stats: {
    charCount: number;
    charCountWithSpaces: number;
    sceneCount: number;
  };

  /** 생성 시각 */
  createdAt: Date;

  /** 마지막 수정 시각 */
  updatedAt: Date;
}

/**
 * 씬 (Scene) - 트리 3단계
 *
 * 실제 글 내용을 포함하는 최소 단위입니다.
 * IndexedDB의 'scenes' 테이블에 저장됩니다.
 */
export interface Scene {
  /** UUID v4 형식의 고유 식별자 */
  id: string;

  /** 소속 Chapter ID */
  chapterId: string;

  /** 소속 Volume ID (빠른 쿼리용 역참조) */
  volumeId: string;

  /** 소속 프로젝트 ID (빠른 쿼리용 역참조) */
  projectId: string;

  /** 씬 제목 (예: "씬 1", "카페 장면") */
  title: string;

  /** Chapter 내 정렬 순서 */
  order: number;

  /** 문서 상태 */
  status: DocumentStatus;

  /**
   * 내용 (TipTap JSON 문자열)
   *
   * TipTap 에디터의 getJSON() 결과를 JSON.stringify()한 값입니다.
   * 저장 시 이 형식으로 저장하고, 로드 시 JSON.parse()하여 에디터에 전달합니다.
   */
  content: string;

  /**
   * 순수 텍스트 (검색 및 글자수 계산용)
   *
   * content에서 텍스트만 추출한 값입니다.
   * 검색 기능과 글자수 계산에 사용됩니다.
   */
  plainText: string;

  /** 글자수 통계 */
  stats: {
    /** 공백 제외 글자수 */
    charCount: number;
    /** 공백 포함 글자수 */
    charCountWithSpaces: number;
  };

  /** 작가 메모 (선택사항) */
  note?: string;

  /** 생성 시각 */
  createdAt: Date;

  /** 마지막 수정 시각 */
  updatedAt: Date;
}

/**
 * 버전 저장 사유
 *
 * 버전 히스토리에서 어떤 이유로 저장되었는지 구분합니다.
 */
export type VersionReason =
  | 'auto-save' // 자동 저장 (2초 debounce)
  | 'manual-save' // 수동 저장 (Ctrl+S)
  | 'before-revert'; // 버전 복원 전 백업

/**
 * 버전 히스토리
 *
 * Scene의 변경 이력을 저장합니다.
 * IndexedDB의 'versions' 테이블에 저장됩니다.
 *
 * 각 Scene당 최대 50개의 버전을 유지하며,
 * 초과 시 가장 오래된 버전이 자동 삭제됩니다.
 */
export interface DocumentVersion {
  /** UUID v4 형식의 고유 식별자 */
  id: string;

  /** 소속 Scene ID */
  sceneId: string;

  /** 저장 시점의 TipTap JSON 내용 */
  content: string;

  /** 저장 시점의 순수 텍스트 */
  plainText: string;

  /** 저장 시점의 글자수 통계 */
  stats: {
    charCount: number;
    charCountWithSpaces: number;
  };

  /** 저장 시각 */
  createdAt: Date;

  /** 저장 사유 */
  reason: VersionReason;
}

/**
 * 트리 노드 (UI 렌더링용)
 *
 * TreeView 컴포넌트에서 사용하는 통합 노드 타입입니다.
 * Volume, Chapter, Scene 데이터를 트리 형태로 변환할 때 사용합니다.
 */
export interface TreeNode {
  /** 노드 ID (Volume/Chapter/Scene의 id) */
  id: string;

  /** 노드 제목 */
  title: string;

  /** 노드 타입 */
  type: 'volume' | 'chapter' | 'scene';

  /** 문서 상태 */
  status: DocumentStatus;

  /** 정렬 순서 */
  order: number;

  /** 자식 노드 (Volume/Chapter만 해당) */
  children?: TreeNode[];

  /** 부모 노드 ID (Chapter/Scene만 해당) */
  parentId?: string;
}
