/**
 * 새 프로젝트 생성 모달
 *
 * 프로젝트 제목, 템플릿, 장르 등을 설정하여 새 프로젝트를 생성합니다.
 */

import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/common/Modal';
import { useUIStore, useProjectStore, TEMPLATE_CONFIGS } from '@/stores';
import type { ProjectTemplate } from '@/types';

const TEMPLATES: { value: ProjectTemplate; label: string; description: string }[] = [
  { value: 'web-novel', label: '웹소설', description: '문피아, 카카오페이지 등 웹소설 플랫폼용' },
  { value: 'novel', label: '장편소설', description: '출판용 장편소설' },
  { value: 'short-story', label: '단편소설', description: '공모전, 문학지 등 단편소설용' },
  { value: 'screenplay', label: '시나리오', description: '드라마, 영화 시나리오용' },
];

const GENRES = [
  '판타지', '로맨스', '현대판타지', '무협', 'SF', '미스터리',
  '스릴러', '호러', '코미디', '드라마', '액션', '역사',
];

export function NewProjectModal() {
  const { activeModal, closeModal } = useUIStore();
  const { createProject, openProject } = useProjectStore();

  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<ProjectTemplate>('web-novel');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = activeModal === 'new-project';

  const handleClose = () => {
    setTitle('');
    setTemplate('web-novel');
    setDescription('');
    setSelectedGenres([]);
    setError(null);
    closeModal();
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('프로젝트 제목을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const project = await createProject(title.trim(), template, {
        description: description.trim(),
        genre: selectedGenres,
      });

      await openProject(project.id);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const templateConfig = TEMPLATE_CONFIGS[template];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="새 프로젝트"
      description="새로운 작품을 시작합니다."
      size="lg"
    >
      <div className="space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="rounded bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 제목 */}
        <div>
          <label htmlFor="project-title" className="mb-1 block text-sm font-medium text-foreground">
            프로젝트 제목 <span className="text-destructive">*</span>
          </label>
          <input
            id="project-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="내 소설 제목"
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
        </div>

        {/* 템플릿 선택 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            템플릿
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTemplate(t.value)}
                className={`rounded border p-3 text-left transition-colors ${
                  template === t.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-foreground">{t.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{t.description}</div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            구조: {templateConfig.terminology.volume} → {templateConfig.terminology.chapter} → {templateConfig.terminology.scene}
            {templateConfig.targetLength > 0 && ` | 목표: ${templateConfig.targetLength.toLocaleString()}자/${templateConfig.terminology.chapter}`}
          </p>
        </div>

        {/* 설명 */}
        <div>
          <label htmlFor="project-description" className="mb-1 block text-sm font-medium text-foreground">
            설명 <span className="text-muted-foreground">(선택)</span>
          </label>
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="작품에 대한 간단한 설명"
            rows={2}
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        {/* 장르 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            장르 <span className="text-muted-foreground">(선택)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  selectedGenres.includes(genre)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={handleClose}
          className="rounded border border-border bg-background px-4 py-2 text-foreground hover:bg-accent"
          disabled={isLoading}
        >
          취소
        </button>
        <button
          onClick={handleCreate}
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={isLoading || !title.trim()}
        >
          {isLoading ? '생성 중...' : '프로젝트 생성'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
