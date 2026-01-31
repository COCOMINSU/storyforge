/**
 * 내보내기 모달
 *
 * 프로젝트 데이터를 TXT 또는 JSON 형식으로 내보냅니다.
 */

import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { useProjectStore, useUIStore, useDocumentStore } from '@/stores';
import {
  exportToJSON,
  exportToTXT,
  exportToZIP,
  exportVolumeToTXT,
  exportChapterToTXT,
  downloadFile,
  downloadBlob,
  sanitizeFilename,
} from '@/lib';
import { cn } from '@/lib';
import type { ExportOptions } from '@/types';

// 아이콘
const DocumentIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const CodeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const ArchiveIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
    />
  </svg>
);

type ExportFormat = 'txt' | 'json' | 'zip';
type ExportScope = 'project' | 'volume' | 'chapter';

export function ExportModal() {
  const { activeModal, closeModal } = useUIStore();
  const { currentProject } = useProjectStore();
  const { volumes, chapters } = useDocumentStore();

  const [format, setFormat] = useState<ExportFormat>('txt');
  const [scope, setScope] = useState<ExportScope>('project');
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [includeWorldbuilding, setIncludeWorldbuilding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const isOpen = activeModal === 'export';

  if (!currentProject) return null;

  const terminology = currentProject.terminology;

  // 선택된 권의 화 목록
  const volumeChapters = selectedVolumeId
    ? chapters.filter((c) => c.volumeId === selectedVolumeId)
    : [];

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      if (format === 'zip') {
        // ZIP 내보내기 (항상 전체 프로젝트)
        const options: ExportOptions = {
          format: 'zip',
          scope: 'project',
          targetId: currentProject.id,
          includeWorldbuilding,
        };
        const blob = await exportToZIP(options);
        const filename = `${sanitizeFilename(currentProject.title)}.zip`;
        downloadBlob(blob, filename);
        closeModal();
        return;
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        // JSON 내보내기 (항상 전체 프로젝트)
        const options: ExportOptions = {
          format: 'json',
          scope: 'project',
          targetId: currentProject.id,
          includeWorldbuilding,
        };
        content = await exportToJSON(options);
        filename = `${sanitizeFilename(currentProject.title)}_backup.json`;
        mimeType = 'application/json;charset=utf-8';
      } else {
        // TXT 내보내기
        if (scope === 'project') {
          const options: ExportOptions = {
            format: 'txt',
            scope: 'project',
            targetId: currentProject.id,
            includeWorldbuilding,
          };
          content = await exportToTXT(options);
          filename = `${sanitizeFilename(currentProject.title)}.txt`;
        } else if (scope === 'volume' && selectedVolumeId) {
          const result = await exportVolumeToTXT(selectedVolumeId, includeWorldbuilding);
          content = result.content;
          filename = sanitizeFilename(result.filename);
        } else if (scope === 'chapter' && selectedChapterId) {
          const result = await exportChapterToTXT(selectedChapterId);
          content = result.content;
          filename = sanitizeFilename(result.filename);
        } else {
          throw new Error('내보낼 범위를 선택해주세요.');
        }
        mimeType = 'text/plain;charset=utf-8';
      }

      downloadFile(content, filename, mimeType);
      closeModal();
    } catch (error) {
      console.error('내보내기 실패:', error);
      setExportError(
        error instanceof Error ? error.message : '내보내기에 실패했습니다.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = () => {
    if (format === 'json' || format === 'zip') return true;
    if (scope === 'project') return true;
    if (scope === 'volume') return !!selectedVolumeId;
    if (scope === 'chapter') return !!selectedChapterId;
    return false;
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="내보내기" size="md">
      <div className="space-y-6">
        {/* 형식 선택 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            내보내기 형식
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setFormat('txt')}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                format === 'txt'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <DocumentIcon />
              <div className="text-center">
                <div className="text-sm font-medium">텍스트</div>
                <div className="text-xs text-muted-foreground">
                  읽기용
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setFormat('json');
                setScope('project');
              }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                format === 'json'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <CodeIcon />
              <div className="text-center">
                <div className="text-sm font-medium">백업</div>
                <div className="text-xs text-muted-foreground">
                  복원용
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setFormat('zip');
                setScope('project');
              }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                format === 'zip'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <ArchiveIcon />
              <div className="text-center">
                <div className="text-sm font-medium">압축</div>
                <div className="text-xs text-muted-foreground">
                  폴더구조
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 범위 선택 (TXT만, JSON/ZIP은 항상 전체 프로젝트) */}
        {format === 'txt' && (
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              내보내기 범위
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="project"
                  checked={scope === 'project'}
                  onChange={() => setScope('project')}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">전체 프로젝트</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="volume"
                  checked={scope === 'volume'}
                  onChange={() => setScope('volume')}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">특정 {terminology.volume}</span>
              </label>

              {scope === 'volume' && (
                <select
                  value={selectedVolumeId}
                  onChange={(e) => {
                    setSelectedVolumeId(e.target.value);
                    setSelectedChapterId('');
                  }}
                  className="ml-6 w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">선택하세요</option>
                  {volumes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {terminology.volume} {v.order + 1}: {v.title}
                    </option>
                  ))}
                </select>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="chapter"
                  checked={scope === 'chapter'}
                  onChange={() => setScope('chapter')}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">특정 {terminology.chapter}</span>
              </label>

              {scope === 'chapter' && (
                <div className="ml-6 space-y-2">
                  <select
                    value={selectedVolumeId}
                    onChange={(e) => {
                      setSelectedVolumeId(e.target.value);
                      setSelectedChapterId('');
                    }}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">{terminology.volume} 선택</option>
                    {volumes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {terminology.volume} {v.order + 1}: {v.title}
                      </option>
                    ))}
                  </select>

                  {selectedVolumeId && (
                    <select
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="">{terminology.chapter} 선택</option>
                      {volumeChapters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {terminology.chapter} {c.order + 1}: {c.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 옵션 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            옵션
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeWorldbuilding}
              onChange={(e) => setIncludeWorldbuilding(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm">세계관 카드 포함</span>
            <span className="text-xs text-muted-foreground">
              (인물, 장소, 아이템)
            </span>
          </label>
        </div>

        {/* 미리보기 정보 */}
        <div className="rounded border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">
            <strong>내보낼 파일:</strong>{' '}
            {format === 'zip'
              ? `${currentProject.title}.zip`
              : format === 'json'
                ? `${currentProject.title}_backup.json`
                : scope === 'project'
                  ? `${currentProject.title}.txt`
                  : scope === 'volume' && selectedVolumeId
                    ? `선택된 ${terminology.volume}`
                    : scope === 'chapter' && selectedChapterId
                      ? `선택된 ${terminology.chapter}`
                      : '(범위를 선택하세요)'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <strong>프로젝트 통계:</strong> {currentProject.stats.volumeCount}
            {terminology.volume}, {currentProject.stats.chapterCount}
            {terminology.chapter}, {currentProject.stats.totalCharCount.toLocaleString()}자
          </p>
        </div>

        {/* 에러 메시지 */}
        {exportError && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {exportError}
          </div>
        )}
      </div>

      <ModalFooter>
        <button
          onClick={closeModal}
          disabled={isExporting}
          className="rounded border border-border bg-background px-4 py-2 text-foreground hover:bg-accent disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting || !canExport()}
          className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <DownloadIcon />
          {isExporting ? '내보내는 중...' : '내보내기'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
