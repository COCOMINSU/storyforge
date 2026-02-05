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
  FullProjectContext,
  CharacterDetailContext,
  RelationshipContext,
  LocationContext,
  ChapterSummaryContext,
  LocationCard,
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
// Full Agent Context (AI Agent Mode)
// ============================================

/**
 * AI Agent 모드용 전체 프로젝트 컨텍스트 수집
 *
 * 프로젝트의 모든 설정, 캐릭터, 장소, 복선 등을 수집합니다.
 * AI가 작품 전체를 이해하고 일관된 응답을 생성할 수 있도록 합니다.
 *
 * @param projectId - 프로젝트 ID
 * @returns 전체 프로젝트 컨텍스트
 */
export async function buildFullAgentContext(
  projectId: string
): Promise<FullProjectContext> {
  // 프로젝트 정보 가져오기
  const project = await db.projects.get(projectId);
  if (!project) {
    throw new Error('[ContextManager] 프로젝트를 찾을 수 없습니다.');
  }

  console.log(`[ContextManager] 전체 컨텍스트 수집 시작: ${project.title}`);

  // 모든 캐릭터 가져오기
  const characters = await db.characters
    .where('projectId')
    .equals(projectId)
    .toArray();

  // 모든 장소 가져오기
  const locations = await db.locations
    .where('projectId')
    .equals(projectId)
    .toArray();

  // 캐릭터 상세 정보 변환
  const allCharacters: CharacterDetailContext[] = characters.map((char: CharacterCard) => {
    // 외모 정보를 문자열로 결합
    const appearanceParts: string[] = [];
    if (char.appearance.height) appearanceParts.push(`키: ${char.appearance.height}`);
    if (char.appearance.bodyType) appearanceParts.push(`체형: ${char.appearance.bodyType}`);
    if (char.appearance.hairColor) appearanceParts.push(`머리색: ${char.appearance.hairColor}`);
    if (char.appearance.eyeColor) appearanceParts.push(`눈색: ${char.appearance.eyeColor}`);
    if (char.appearance.distinguishingFeatures) appearanceParts.push(char.appearance.distinguishingFeatures);

    return {
      id: char.id,
      name: char.name,
      role: ROLE_LABELS[char.role] || char.role,
      age: char.basicInfo.age,
      gender: char.basicInfo.gender,
      occupation: char.basicInfo.occupation,
      appearance: appearanceParts.length > 0 ? appearanceParts.join(', ').slice(0, 200) : undefined,
      personality: char.personality?.slice(0, 200),
      background: char.background?.slice(0, 200),
    };
  });

  // 관계 정보 수집
  const characterRelationships: RelationshipContext[] = [];
  for (const char of characters) {
    if (char.relationships) {
      for (const rel of char.relationships) {
        // 중복 방지 (A→B와 B→A 모두 있을 수 있음)
        const exists = characterRelationships.some(
          (r) =>
            (r.character1Name === char.name && r.character2Name === rel.targetName) ||
            (r.character1Name === rel.targetName && r.character2Name === char.name)
        );
        if (!exists) {
          characterRelationships.push({
            character1Name: char.name,
            character2Name: rel.targetName,
            relationshipType: rel.relationType,
            description: rel.description,
          });
        }
      }
    }
  }

  // 장소 정보 변환
  const allLocations: LocationContext[] = locations.map((loc: LocationCard) => ({
    id: loc.id,
    name: loc.name,
    description: loc.description?.slice(0, 200),
    significance: loc.significance?.slice(0, 100),
  }));

  // 최근 회차 요약 수집 (최근 5개 챕터)
  const recentChapterSummaries: ChapterSummaryContext[] = [];
  const chapters = await db.chapters
    .where('projectId')
    .equals(projectId)
    .reverse()
    .sortBy('updatedAt');

  for (const chapter of chapters.slice(0, 5)) {
    const volume = await db.volumes.get(chapter.volumeId);
    // 챕터의 첫 씬 내용을 요약으로 사용
    const chapterScenes = await db.scenes
      .where('chapterId')
      .equals(chapter.id)
      .sortBy('order');

    const firstScene = chapterScenes[0];
    if (firstScene?.plainText) {
      recentChapterSummaries.push({
        volumeNumber: volume?.order || 1,
        chapterNumber: chapter.order,
        title: chapter.title,
        summary: firstScene.plainText.slice(0, 300) + (firstScene.plainText.length > 300 ? '...' : ''),
      });
    }
  }

  // 통계 계산
  const scenes = await db.scenes
    .where('projectId')
    .equals(projectId)
    .toArray();

  const totalCharCount = scenes.reduce(
    (sum, scene) => sum + (scene.plainText?.length || 0),
    0
  );

  const context: FullProjectContext = {
    projectInfo: {
      id: project.id,
      title: project.title,
      description: project.description,
      genre: project.genre,
      targetPlatform: project.targetPlatform,
      targetLength: project.targetLength,
    },
    // synopsis는 현재 Project 타입에 없으므로 description을 활용
    synopsis: project.description || undefined,
    allCharacters,
    characterRelationships,
    allLocations,
    activeForeshadowing: [], // TODO: 복선 시스템 구현 후 연동
    recentChapterSummaries,
    metadata: {
      totalCharCount,
      totalChapterCount: chapters.length,
      totalSceneCount: scenes.length,
      lastUpdatedAt: new Date(),
    },
  };

  console.log(
    `[ContextManager] 전체 컨텍스트 수집 완료: ` +
    `캐릭터 ${allCharacters.length}, 장소 ${allLocations.length}, ` +
    `관계 ${characterRelationships.length}, 회차요약 ${recentChapterSummaries.length}`
  );

  return context;
}

/**
 * AI Agent 모드용 시스템 프롬프트 생성
 *
 * 전체 컨텍스트를 기반으로 AI가 작품을 완전히 이해하고
 * 자동 업데이트까지 수행할 수 있는 시스템 프롬프트를 생성합니다.
 *
 * @param context - 전체 프로젝트 컨텍스트
 * @returns 시스템 프롬프트 문자열
 */
export function formatAgentSystemPrompt(context: FullProjectContext): string {
  const parts: string[] = [];

  // 1. AI 역할 정의
  parts.push(`당신은 웹소설 "${context.projectInfo.title}"의 전담 AI 창작 보조입니다.

## 역할
- 작가의 모든 창작 활동을 지원합니다.
- 작품의 설정과 맥락을 완전히 이해하고 일관성을 유지합니다.
- 캐릭터, 장소, 복선 등을 직접 생성/수정할 수 있습니다.
- 제안은 구체적이고 작품 세계관에 맞게 합니다.

## 응답 방식
- 한국어로 자연스럽게 대화합니다.
- 데이터를 생성하거나 수정할 때는 응답 끝에 특별한 JSON 블록을 포함합니다.
- 기존 설정과 모순되지 않도록 주의합니다.`);

  // 2. 작품 정보
  parts.push('\n---\n');
  parts.push('# 작품 정보');
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

  // 3. 시놉시스
  if (context.synopsis) {
    parts.push('\n# 줄거리 (시놉시스)');
    parts.push(context.synopsis);
  }

  // 4. 등장인물 전체 목록
  if (context.allCharacters.length > 0) {
    parts.push('\n# 등장인물');
    for (const char of context.allCharacters) {
      const info: string[] = [];
      if (char.age) info.push(char.age);
      if (char.gender) info.push(char.gender);
      if (char.occupation) info.push(char.occupation);

      parts.push(`\n## ${char.name} (${char.role})`);
      if (info.length > 0) parts.push(`기본: ${info.join(', ')}`);
      if (char.personality) parts.push(`성격: ${char.personality}`);
      if (char.appearance) parts.push(`외모: ${char.appearance}`);
      if (char.background) parts.push(`배경: ${char.background}`);
    }
  }

  // 5. 인물 관계도
  if (context.characterRelationships.length > 0) {
    parts.push('\n# 인물 관계');
    for (const rel of context.characterRelationships) {
      parts.push(`- ${rel.character1Name} ↔ ${rel.character2Name}: ${rel.relationshipType}`);
      if (rel.description) parts.push(`  (${rel.description})`);
    }
  }

  // 6. 주요 장소
  if (context.allLocations.length > 0) {
    parts.push('\n# 주요 장소');
    for (const loc of context.allLocations) {
      parts.push(`- **${loc.name}**: ${loc.description || '설명 없음'}`);
    }
  }

  // 7. 최근 회차 요약
  if (context.recentChapterSummaries.length > 0) {
    parts.push('\n# 최근 회차 요약');
    for (const ch of context.recentChapterSummaries) {
      parts.push(`\n## ${ch.chapterNumber}화: ${ch.title}`);
      parts.push(ch.summary);
    }
  }

  // 8. 통계
  parts.push('\n# 작품 통계');
  parts.push(`- 총 글자수: ${context.metadata.totalCharCount.toLocaleString()}자`);
  parts.push(`- 총 회차: ${context.metadata.totalChapterCount}화`);

  // 9. 자동 업데이트 안내
  parts.push(`\n---\n
# 데이터 업데이트 방법

캐릭터, 장소, 줄거리 등을 생성하거나 수정할 때,
응답의 맨 끝에 다음 형식의 JSON 블록을 포함하세요:

\`\`\`storyforge-update
{
  "type": "create_character",
  "data": {
    "name": "이름",
    "role": "protagonist|antagonist|supporting|minor",
    "age": "나이",
    "gender": "성별",
    "occupation": "직업",
    "personality": "성격 설명",
    "appearance": "외모 설명",
    "background": "배경 스토리"
  }
}
\`\`\`

지원되는 type:
- create_character: 새 캐릭터 생성
- update_character: 기존 캐릭터 수정 (data에 id 필수)
- create_location: 새 장소 생성
- update_location: 기존 장소 수정 (data에 id 필수)
- update_synopsis: 시놉시스 수정
- add_foreshadowing: 복선 추가

작가가 명시적으로 요청하지 않으면 이 블록을 포함하지 마세요.
`);

  return parts.join('\n');
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

  // AI Agent Mode
  buildFullAgentContext,
  formatAgentSystemPrompt,
};
