/**
 * 내보내기 유틸리티
 *
 * 프로젝트 데이터를 TXT, JSON 형식으로 내보냅니다.
 */

import { db } from '@/db';
import type { Project, Volume, Chapter, Scene } from '@/types';
import type { CharacterCard, LocationCard, ItemCard } from '@/types';
import type { ExportOptions } from '@/types';

export interface ExportData {
  project: Project;
  volumes: Volume[];
  chapters: Chapter[];
  scenes: Scene[];
  worldbuilding?: {
    characters: CharacterCard[];
    locations: LocationCard[];
    items: ItemCard[];
  };
  exportedAt: string;
  version: string;
}

/**
 * 프로젝트 데이터를 JSON 형식으로 내보내기
 */
export async function exportToJSON(options: ExportOptions): Promise<string> {
  const project = await db.projects.get(options.targetId || '');
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');

  const projectId = project.id;

  // 문서 데이터 로드
  const volumes = await db.volumes.where('projectId').equals(projectId).toArray();
  const chapters = await db.chapters.where('projectId').equals(projectId).toArray();
  const scenes = await db.scenes.where('projectId').equals(projectId).toArray();

  const exportData: ExportData = {
    project,
    volumes,
    chapters,
    scenes,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  // 세계관 카드 포함 옵션
  if (options.includeWorldbuilding) {
    const characters = await db.characters.where('projectId').equals(projectId).toArray();
    const locations = await db.locations.where('projectId').equals(projectId).toArray();
    const items = await db.items.where('projectId').equals(projectId).toArray();

    exportData.worldbuilding = { characters, locations, items };
  }

  return JSON.stringify(exportData, null, 2);
}

/**
 * 프로젝트 데이터를 TXT 형식으로 내보내기
 */
export async function exportToTXT(options: ExportOptions): Promise<string> {
  const project = await db.projects.get(options.targetId || '');
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');

  const projectId = project.id;
  const terminology = project.terminology;

  // 문서 데이터 로드
  const volumes = await db.volumes
    .where('projectId')
    .equals(projectId)
    .sortBy('order');

  const chapters = await db.chapters
    .where('projectId')
    .equals(projectId)
    .toArray();

  const scenes = await db.scenes
    .where('projectId')
    .equals(projectId)
    .toArray();

  // 텍스트 생성
  const lines: string[] = [];

  // 제목
  lines.push(`${project.title}`);
  lines.push('='.repeat(project.title.length * 2));
  lines.push('');

  if (project.description) {
    lines.push(project.description);
    lines.push('');
  }

  lines.push(`장르: ${project.genre.join(', ') || '없음'}`);
  lines.push(`생성일: ${project.createdAt.toLocaleDateString('ko-KR')}`);
  lines.push('');
  lines.push('-'.repeat(40));
  lines.push('');

  // 권별 내보내기
  for (const volume of volumes) {
    const volumeChapters = chapters
      .filter((c) => c.volumeId === volume.id)
      .sort((a, b) => a.order - b.order);

    lines.push(`【 ${terminology.volume} ${volume.order + 1}: ${volume.title} 】`);
    lines.push('');

    for (const chapter of volumeChapters) {
      const chapterScenes = scenes
        .filter((s) => s.chapterId === chapter.id)
        .sort((a, b) => a.order - b.order);

      lines.push(`━━━ ${terminology.chapter} ${chapter.order + 1}: ${chapter.title} ━━━`);
      lines.push('');

      for (const scene of chapterScenes) {
        if (chapterScenes.length > 1) {
          lines.push(`── ${terminology.scene} ${scene.order + 1}: ${scene.title} ──`);
          lines.push('');
        }

        // 씬 내용 (plainText 사용)
        if (scene.plainText) {
          lines.push(scene.plainText);
        } else {
          lines.push('(내용 없음)');
        }

        lines.push('');
      }

      lines.push('');
    }

    lines.push('');
  }

  // 세계관 카드 포함 시
  if (options.includeWorldbuilding) {
    const characters = await db.characters.where('projectId').equals(projectId).toArray();
    const locations = await db.locations.where('projectId').equals(projectId).toArray();
    const items = await db.items.where('projectId').equals(projectId).toArray();

    if (characters.length > 0 || locations.length > 0 || items.length > 0) {
      lines.push('═'.repeat(40));
      lines.push('【 세계관 설정 】');
      lines.push('═'.repeat(40));
      lines.push('');

      if (characters.length > 0) {
        lines.push('▶ 등장인물');
        lines.push('');
        for (const char of characters) {
          lines.push(`● ${char.name}`);
          if (char.basicInfo.occupation) lines.push(`  직업: ${char.basicInfo.occupation}`);
          if (char.description) lines.push(`  ${char.description}`);
          if (char.personality) lines.push(`  성격: ${char.personality}`);
          lines.push('');
        }
      }

      if (locations.length > 0) {
        lines.push('▶ 장소');
        lines.push('');
        for (const loc of locations) {
          lines.push(`● ${loc.name}`);
          if (loc.locationType) lines.push(`  유형: ${loc.locationType}`);
          if (loc.description) lines.push(`  ${loc.description}`);
          lines.push('');
        }
      }

      if (items.length > 0) {
        lines.push('▶ 아이템');
        lines.push('');
        for (const item of items) {
          lines.push(`● ${item.name}`);
          if (item.itemType) lines.push(`  유형: ${item.itemType}`);
          if (item.description) lines.push(`  ${item.description}`);
          lines.push('');
        }
      }
    }
  }

  // 푸터
  lines.push('-'.repeat(40));
  lines.push(`내보내기 일시: ${new Date().toLocaleString('ko-KR')}`);
  lines.push('Storyforge로 작성됨');

  return lines.join('\n');
}

/**
 * 특정 권만 TXT로 내보내기
 */
export async function exportVolumeToTXT(
  volumeId: string,
  // TODO: 세계관 포함 내보내기 구현 예정
  _includeWorldbuilding?: boolean
): Promise<{ content: string; filename: string }> {
  void _includeWorldbuilding; // 향후 사용 예정
  const volume = await db.volumes.get(volumeId);
  if (!volume) throw new Error('권을 찾을 수 없습니다.');

  const project = await db.projects.get(volume.projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');

  const terminology = project.terminology;

  const chapters = await db.chapters
    .where('volumeId')
    .equals(volumeId)
    .sortBy('order');

  const scenes = await db.scenes
    .where('volumeId')
    .equals(volumeId)
    .toArray();

  const lines: string[] = [];

  lines.push(`${project.title} - ${terminology.volume} ${volume.order + 1}: ${volume.title}`);
  lines.push('='.repeat(40));
  lines.push('');

  for (const chapter of chapters) {
    const chapterScenes = scenes
      .filter((s) => s.chapterId === chapter.id)
      .sort((a, b) => a.order - b.order);

    lines.push(`━━━ ${terminology.chapter} ${chapter.order + 1}: ${chapter.title} ━━━`);
    lines.push('');

    for (const scene of chapterScenes) {
      if (chapterScenes.length > 1) {
        lines.push(`── ${terminology.scene} ${scene.order + 1}: ${scene.title} ──`);
        lines.push('');
      }

      if (scene.plainText) {
        lines.push(scene.plainText);
      }
      lines.push('');
    }
    lines.push('');
  }

  const filename = `${project.title}_${terminology.volume}${volume.order + 1}.txt`;

  return { content: lines.join('\n'), filename };
}

/**
 * 특정 화만 TXT로 내보내기
 */
export async function exportChapterToTXT(
  chapterId: string
): Promise<{ content: string; filename: string }> {
  const chapter = await db.chapters.get(chapterId);
  if (!chapter) throw new Error('화를 찾을 수 없습니다.');

  const volume = await db.volumes.get(chapter.volumeId);
  const project = await db.projects.get(chapter.projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');

  const terminology = project.terminology;

  const scenes = await db.scenes
    .where('chapterId')
    .equals(chapterId)
    .sortBy('order');

  const lines: string[] = [];

  lines.push(`${project.title}`);
  if (volume) {
    lines.push(`${terminology.volume} ${volume.order + 1}: ${volume.title}`);
  }
  lines.push(`${terminology.chapter} ${chapter.order + 1}: ${chapter.title}`);
  lines.push('='.repeat(40));
  lines.push('');

  for (const scene of scenes) {
    if (scenes.length > 1) {
      lines.push(`── ${terminology.scene} ${scene.order + 1}: ${scene.title} ──`);
      lines.push('');
    }

    if (scene.plainText) {
      lines.push(scene.plainText);
    }
    lines.push('');
  }

  const filename = `${project.title}_${terminology.chapter}${chapter.order + 1}.txt`;

  return { content: lines.join('\n'), filename };
}

/**
 * 프로젝트 데이터를 ZIP 형식으로 내보내기
 *
 * 폴더 구조:
 * - 프로젝트명/
 *   - project.json (메타데이터)
 *   - 권1_제목/
 *     - 화1_제목/
 *       - 씬1_제목.txt
 *       - 씬2_제목.txt
 *   - 세계관/ (옵션)
 *     - 인물.json
 *     - 장소.json
 *     - 아이템.json
 */
export async function exportToZIP(options: ExportOptions): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const project = await db.projects.get(options.targetId || '');
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');

  const projectId = project.id;
  const terminology = project.terminology;

  // 문서 데이터 로드
  const volumes = await db.volumes
    .where('projectId')
    .equals(projectId)
    .sortBy('order');
  const chapters = await db.chapters
    .where('projectId')
    .equals(projectId)
    .toArray();
  const scenes = await db.scenes
    .where('projectId')
    .equals(projectId)
    .toArray();

  // 프로젝트 루트 폴더
  const projectFolder = zip.folder(sanitizeFilename(project.title));
  if (!projectFolder) throw new Error('ZIP 폴더 생성 실패');

  // 메타데이터 파일 추가
  const metadata = {
    project: {
      ...project,
      // Date 객체를 ISO 문자열로 변환
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      lastOpenedAt: project.lastOpenedAt.toISOString(),
    },
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    format: 'storyforge-zip-v1',
  };
  projectFolder.file('project.json', JSON.stringify(metadata, null, 2));

  // 권 > 화 > 씬 폴더 구조 생성
  for (const volume of volumes) {
    const volumeFolderName = `${terminology.volume}${volume.order + 1}_${sanitizeFilename(volume.title)}`;
    const volumeFolder = projectFolder.folder(volumeFolderName);
    if (!volumeFolder) continue;

    const volumeChapters = chapters
      .filter((c) => c.volumeId === volume.id)
      .sort((a, b) => a.order - b.order);

    for (const chapter of volumeChapters) {
      const chapterFolderName = `${terminology.chapter}${chapter.order + 1}_${sanitizeFilename(chapter.title)}`;
      const chapterFolder = volumeFolder.folder(chapterFolderName);
      if (!chapterFolder) continue;

      const chapterScenes = scenes
        .filter((s) => s.chapterId === chapter.id)
        .sort((a, b) => a.order - b.order);

      for (const scene of chapterScenes) {
        const sceneFilename = `${terminology.scene}${scene.order + 1}_${sanitizeFilename(scene.title)}.txt`;
        chapterFolder.file(sceneFilename, scene.plainText || '');
      }
    }
  }

  // 세계관 카드 포함 시
  if (options.includeWorldbuilding) {
    const characters = await db.characters
      .where('projectId')
      .equals(projectId)
      .toArray();
    const locations = await db.locations
      .where('projectId')
      .equals(projectId)
      .toArray();
    const items = await db.items
      .where('projectId')
      .equals(projectId)
      .toArray();

    if (characters.length > 0 || locations.length > 0 || items.length > 0) {
      const worldFolder = projectFolder.folder('세계관');
      if (worldFolder) {
        if (characters.length > 0) {
          worldFolder.file('인물.json', JSON.stringify(characters, null, 2));
        }
        if (locations.length > 0) {
          worldFolder.file('장소.json', JSON.stringify(locations, null, 2));
        }
        if (items.length > 0) {
          worldFolder.file('아이템.json', JSON.stringify(items, null, 2));
        }
      }
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Blob 다운로드 헬퍼
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 파일 다운로드 헬퍼
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 안전한 파일명 생성
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}
