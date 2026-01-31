/**
 * 맥락 관리 서비스
 *
 * AI가 작품의 맥락을 이해할 수 있도록 프로젝트 정보, 인물 정보,
 * 최근 내용을 수집하고 토큰 예산 내에서 최적화합니다.
 *
 * 주요 기능:
 * - 프로젝트 정보 수집 및 요약
 * - 인물 정보 요약
 * - 최근 내용 추출
 * - 토큰 예산 관리
 */

import { db } from '@/db';
import type {
  ProjectContext,
  CharacterSummary,
  ContextBudget,
  CharacterCard,
  ChatMessage,
} from '@/types';
import { estimateTokens } from './claudeClient';

// ============================================
// Constants
// ============================================

/**
 * 기본 토큰 예산 (Claude 기준)
 *
 * Claude Opus 4.5는 200K 컨텍스트를 지원하지만,
 * 비용 효율성과 응답 속도를 위해 적절한 예산을 설정합니다.
 */
export const DEFAULT_CONTEXT_BUDGET: ContextBudget = {
  total: 8000,        // 전체 예산
  system: 1000,       // 시스템 프롬프트 (기본 지침)
  context: 3000,      // 프로젝트 맥락 (설정, 인물 등)
  history: 3000,      // 대화 히스토리
  response: 4096,     // 응답 예약 (max_tokens)
};

/**
 * 인물 역할 한글 라벨
 */
const ROLE_LABELS: Record<string, string> = {
  protagonist: '주인공',
  antagonist: '악역',
  supporting: '조연',
  minor: '단역',
};

// ============================================
// Token Utilities
// ============================================

/**
 * 텍스트를 토큰 예산 내로 자르기
 *
 * @param text - 원본 텍스트
 * @param budget - 토큰 예산
 * @returns 잘린 텍스트
 */
export function truncateToTokenBudget(text: string, budget: number): string {
  if (!text) return '';

  const estimated = estimateTokens(text);
  if (estimated <= budget) return text;

  // 대략적인 비율로 자르기 (10% 여유 확보)
  const ratio = budget / estimated;
  const targetLength = Math.floor(text.length * ratio * 0.9);

  // 문장 단위로 자르기 시도
  const truncated = text.slice(0, targetLength);
  const lastPeriod = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );

  if (lastPeriod > targetLength * 0.7) {
    return truncated.slice(0, lastPeriod + 1);
  }

  return truncated + '...';
}

// ============================================
// Character Summarization
// ============================================

/**
 * 인물 카드를 요약 형식으로 변환
 *
 * AI에게 전달하기 위한 간략한 인물 정보를 생성합니다.
 */
function summarizeCharacter(char: CharacterCard): CharacterSummary {
  const parts: string[] = [];

  // 기본 정보
  if (char.basicInfo.age) parts.push(char.basicInfo.age);
  if (char.basicInfo.gender) parts.push(char.basicInfo.gender);
  if (char.basicInfo.occupation) parts.push(char.basicInfo.occupation);

  // 성격 요약 (50자)
  if (char.personality) {
    parts.push(char.personality.slice(0, 50));
  }

  const description = parts.join(', ').replace(/,\s*$/, '');

  return {
    name: char.name,
    role: ROLE_LABELS[char.role] || char.role,
    description: description || char.description.slice(0, 100),
  };
}

// ============================================
// Context Building
// ============================================

/**
 * 프로젝트 맥락 수집
 *
 * AI에게 전달할 프로젝트 맥락 정보를 수집합니다.
 * 토큰 예산을 고려하여 정보를 최적화합니다.
 *
 * @param projectId - 프로젝트 ID
 * @param currentSceneId - 현재 편집 중인 씬 ID (선택)
 * @param budget - 토큰 예산 (기본값 사용 가능)
 * @returns 프로젝트 맥락 객체
 */
export async function buildProjectContext(
  projectId: string,
  currentSceneId?: string,
  budget: ContextBudget = DEFAULT_CONTEXT_BUDGET
): Promise<ProjectContext> {
  // 프로젝트 정보 가져오기
  const project = await db.projects.get(projectId);
  if (!project) {
    throw new Error('[ContextManager] 프로젝트를 찾을 수 없습니다.');
  }

  console.log(`[ContextManager] 프로젝트 맥락 수집: ${project.title}`);

  // 모든 인물 카드 가져오기
  const characters = await db.characters
    .where('projectId')
    .equals(projectId)
    .toArray();

  // 주요 인물만 (주인공, 악역, 조연) - 최대 10명
  const mainCharacters = characters
    .filter((c) => c.role !== 'minor')
    .sort((a, b) => {
      // 역할 우선순위: protagonist > antagonist > supporting
      const priority: Record<string, number> = {
        protagonist: 0,
        antagonist: 1,
        supporting: 2,
      };
      return (priority[a.role] || 99) - (priority[b.role] || 99);
    })
    .slice(0, 10)
    .map(summarizeCharacter);

  // 현재 위치 정보 및 씬 내용
  let currentPosition: ProjectContext['currentPosition'];
  let currentContent: string | undefined;

  if (currentSceneId) {
    const scene = await db.scenes.get(currentSceneId);
    if (scene) {
      const chapter = await db.chapters.get(scene.chapterId);
      const volume = chapter ? await db.volumes.get(chapter.volumeId) : null;

      currentPosition = {
        volumeTitle: volume?.title || '',
        chapterTitle: chapter?.title || '',
        sceneTitle: scene.title,
      };

      // 현재 씬 내용 (맥락 예산의 30%)
      if (scene.plainText) {
        currentContent = truncateToTokenBudget(
          scene.plainText,
          Math.floor(budget.context * 0.3)
        );
      }
    }
  }

  // 맥락 조립
  const context: ProjectContext = {
    projectInfo: {
      title: project.title,
      description: project.description,
      genre: project.genre,
      targetPlatform: project.targetPlatform,
      targetLength: project.targetLength,
    },
    currentPosition,
    mainCharacters,
    currentContent,
  };

  console.log(
    `[ContextManager] 맥락 수집 완료: 인물 ${mainCharacters.length}명, 현재씬 ${currentContent ? '있음' : '없음'}`
  );

  return context;
}

/**
 * 최근 내용 요약 가져오기 (AI 호출 없이 단순 추출)
 *
 * 최근 수정된 씬들의 내용을 추출합니다.
 *
 * @param projectId - 프로젝트 ID
 * @param limit - 가져올 씬 개수 (기본 3)
 * @returns 최근 내용 요약 문자열
 */
export async function getRecentContentSummary(
  projectId: string,
  limit: number = 3
): Promise<string> {
  // 최근 수정된 씬 가져오기
  const recentScenes = await db.scenes
    .where('projectId')
    .equals(projectId)
    .reverse()
    .sortBy('updatedAt');

  const scenes = recentScenes.slice(0, limit);

  if (scenes.length === 0) {
    return '아직 작성된 내용이 없습니다.';
  }

  const summaries: string[] = [];

  for (const scene of scenes) {
    const chapter = await db.chapters.get(scene.chapterId);
    const preview = scene.plainText?.slice(0, 200) || '';
    if (preview) {
      summaries.push(`[${chapter?.title || ''}/${scene.title}] ${preview}...`);
    }
  }

  return summaries.join('\n\n') || '작성된 내용이 없습니다.';
}

// ============================================
// System Prompt Formatting
// ============================================

/**
 * 맥락을 시스템 프롬프트로 포맷팅
 *
 * ProjectContext 객체를 AI에게 전달할 시스템 프롬프트 문자열로 변환합니다.
 *
 * @param context - 프로젝트 맥락
 * @returns 시스템 프롬프트 문자열
 */
export function formatContextAsSystemPrompt(context: ProjectContext): string {
  const parts: string[] = [];

  // 프로젝트 정보
  parts.push('## 작품 정보');
  parts.push(`- 제목: ${context.projectInfo.title}`);
  if (context.projectInfo.description) {
    parts.push(`- 설명: ${context.projectInfo.description}`);
  }
  if (context.projectInfo.genre.length > 0) {
    parts.push(`- 장르: ${context.projectInfo.genre.join(', ')}`);
  }
  if (context.projectInfo.targetPlatform) {
    parts.push(`- 연재 플랫폼: ${context.projectInfo.targetPlatform}`);
  }
  if (context.projectInfo.targetLength) {
    parts.push(`- 목표 분량: ${context.projectInfo.targetLength.toLocaleString()}자/화`);
  }

  // 현재 위치
  if (context.currentPosition) {
    parts.push('');
    parts.push('## 현재 작업 위치');
    const position = [
      context.currentPosition.volumeTitle,
      context.currentPosition.chapterTitle,
      context.currentPosition.sceneTitle,
    ]
      .filter(Boolean)
      .join(' > ');
    parts.push(position);
  }

  // 주요 등장인물
  if (context.mainCharacters.length > 0) {
    parts.push('');
    parts.push('## 주요 등장인물');
    for (const char of context.mainCharacters) {
      parts.push(`- **${char.name}** (${char.role}): ${char.description}`);
      if (char.currentState) {
        parts.push(`  현재 상태: ${char.currentState}`);
      }
    }
  }

  // 시놉시스
  if (context.synopsis) {
    parts.push('');
    parts.push('## 줄거리 요약');
    parts.push(context.synopsis);
  }

  // 최근 내용 요약
  if (context.recentSummary) {
    parts.push('');
    parts.push('## 최근 진행 상황');
    parts.push(context.recentSummary);
  }

  // 현재 씬 내용
  if (context.currentContent) {
    parts.push('');
    parts.push('## 현재 씬 내용');
    parts.push(context.currentContent);
  }

  return parts.join('\n');
}

/**
 * 기본 시스템 프롬프트 생성
 *
 * AI 보조작가로서의 기본 지침을 생성합니다.
 *
 * @returns 기본 시스템 프롬프트
 */
export function getBaseSystemPrompt(): string {
  return `당신은 한국 웹소설 창작을 돕는 AI 보조작가입니다.

## 역할
- 작가의 창작을 보조하되, 창작의 주도권은 작가에게 있습니다.
- 제안은 하되 강요하지 않습니다.
- 작가의 의도와 작품의 톤/분위기를 존중합니다.

## 답변 스타일
- 한국어로 자연스럽게 대화합니다.
- 웹소설 독자층의 취향을 이해하고 있습니다.
- 구체적이고 실용적인 조언을 제공합니다.
- 필요시 예시 문장이나 대사를 제안합니다.

## 주의사항
- 저작권 있는 작품의 내용을 그대로 복사하지 않습니다.
- 작가가 제공한 설정과 맥락을 우선시합니다.
- 기존 설정과 모순되는 제안을 피합니다.`;
}

/**
 * 전체 시스템 프롬프트 조합
 *
 * 기본 지침과 프로젝트 맥락을 합쳐 완전한 시스템 프롬프트를 생성합니다.
 *
 * @param context - 프로젝트 맥락
 * @param additionalInstructions - 추가 지침 (선택)
 * @returns 완전한 시스템 프롬프트
 */
export function buildFullSystemPrompt(
  context: ProjectContext,
  additionalInstructions?: string
): string {
  const parts: string[] = [];

  // 기본 지침
  parts.push(getBaseSystemPrompt());

  // 프로젝트 맥락
  const contextPrompt = formatContextAsSystemPrompt(context);
  if (contextPrompt) {
    parts.push('');
    parts.push('---');
    parts.push('');
    parts.push('# 현재 작품 맥락');
    parts.push(contextPrompt);
  }

  // 추가 지침
  if (additionalInstructions) {
    parts.push('');
    parts.push('---');
    parts.push('');
    parts.push('# 추가 지침');
    parts.push(additionalInstructions);
  }

  return parts.join('\n');
}

// ============================================
// History Optimization
// ============================================

/**
 * 대화 히스토리 토큰 최적화
 *
 * 오래된 메시지부터 제거하여 토큰 예산 내로 맞춥니다.
 * 최신 메시지가 우선적으로 유지됩니다.
 *
 * @param messages - 메시지 배열
 * @param budget - 토큰 예산
 * @returns 최적화된 메시지 배열
 */
export function optimizeHistoryForTokenBudget(
  messages: ChatMessage[],
  budget: number
): ChatMessage[] {
  let totalTokens = 0;
  const optimized: ChatMessage[] = [];

  // 최신 메시지부터 역순으로 추가
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];

    // 완료된 메시지만 포함
    if (msg.status !== 'complete') continue;

    const tokens = estimateTokens(msg.content);

    if (totalTokens + tokens > budget) {
      // 예산 초과, 여기서 중단
      console.log(
        `[ContextManager] 히스토리 최적화: ${messages.length - optimized.length}개 메시지 제거`
      );
      break;
    }

    optimized.unshift(msg);
    totalTokens += tokens;
  }

  return optimized;
}

/**
 * 메시지 배열의 총 토큰 수 계산
 */
export function calculateHistoryTokens(messages: ChatMessage[]): number {
  return messages.reduce((total, msg) => {
    return total + estimateTokens(msg.content);
  }, 0);
}

// ============================================
// Exports
// ============================================

export default {
  // Constants
  DEFAULT_CONTEXT_BUDGET,

  // Token Utilities
  truncateToTokenBudget,

  // Context Building
  buildProjectContext,
  getRecentContentSummary,

  // System Prompt
  formatContextAsSystemPrompt,
  getBaseSystemPrompt,
  buildFullSystemPrompt,

  // History Optimization
  optimizeHistoryForTokenBudget,
  calculateHistoryTokens,
};
