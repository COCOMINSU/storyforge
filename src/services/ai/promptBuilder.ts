/**
 * 프롬프트 빌더
 *
 * 템플릿과 변수를 조합하여 최종 프롬프트를 생성합니다.
 * Handlebars 스타일의 간단한 템플릿 문법을 지원합니다.
 */

import type { PromptTemplate, PromptTemplateType } from './promptTemplates';
import { getTemplate } from './promptTemplates';

/**
 * 변수 값 타입
 */
export type VariableValues = Record<string, string | undefined>;

/**
 * 빌드된 프롬프트
 */
export interface BuiltPrompt {
  /** 시스템 프롬프트 */
  system: string;
  /** 사용자 프롬프트 */
  user: string;
  /** 권장 temperature */
  temperature: number;
}

/**
 * 템플릿 문자열에 변수를 적용합니다.
 *
 * 지원하는 문법:
 * - {{variable}}: 변수 치환
 * - {{#if variable}}...{{/if}}: 조건부 블록
 *
 * @param template 템플릿 문자열
 * @param variables 변수 값들
 * @returns 변환된 문자열
 */
function applyTemplate(template: string, variables: VariableValues): string {
  let result = template;

  // 조건부 블록 처리: {{#if variable}}content{{/if}}
  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(ifRegex, (_, varName, content) => {
    const value = variables[varName];
    if (value && value.trim()) {
      // 조건이 참이면 내용 반환 (내부 변수도 처리)
      return applyTemplate(content, variables);
    }
    return '';
  });

  // 변수 치환: {{variable}}
  const varRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(varRegex, (_, varName) => {
    const value = variables[varName];
    return value !== undefined ? value : '';
  });

  // 빈 줄 정리 (연속된 빈 줄을 하나로)
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

/**
 * 프롬프트를 빌드합니다.
 *
 * @param templateId 템플릿 ID 또는 템플릿 객체
 * @param variables 변수 값들
 * @returns 빌드된 프롬프트
 */
export function buildPrompt(
  templateId: PromptTemplateType | PromptTemplate,
  variables: VariableValues
): BuiltPrompt {
  const template =
    typeof templateId === 'string' ? getTemplate(templateId) : templateId;

  // 필수 변수 확인
  const missing = template.requiredVariables.filter(
    (v) => !variables[v] || !variables[v]!.trim()
  );

  if (missing.length > 0) {
    throw new Error(
      `필수 변수가 누락되었습니다: ${missing.join(', ')}`
    );
  }

  return {
    system: applyTemplate(template.systemPrompt, variables),
    user: applyTemplate(template.userPromptTemplate, variables),
    temperature: template.suggestedTemperature,
  };
}

/**
 * 프롬프트 템플릿의 미리보기를 생성합니다.
 * 변수를 플레이스홀더로 표시합니다.
 *
 * @param templateId 템플릿 ID
 * @returns 미리보기 문자열
 */
export function getPromptPreview(templateId: PromptTemplateType): string {
  const template = getTemplate(templateId);

  // 변수를 [변수명] 형태로 표시
  let preview = template.userPromptTemplate;
  preview = preview.replace(/\{\{(\w+)\}\}/g, '[$1]');
  preview = preview.replace(/\{\{#if\s+\w+\}\}/g, '');
  preview = preview.replace(/\{\{\/if\}\}/g, '');

  return preview.trim();
}

/**
 * 템플릿에 필요한 변수 목록을 가져옵니다.
 *
 * @param templateId 템플릿 ID
 * @returns 변수 목록
 */
export function getRequiredVariables(
  templateId: PromptTemplateType
): { required: string[]; optional: string[] } {
  const template = getTemplate(templateId);
  return {
    required: template.requiredVariables,
    optional: template.optionalVariables || [],
  };
}

/**
 * 간단한 프롬프트 빌더 (템플릿 없이)
 *
 * @param systemPrompt 시스템 프롬프트
 * @param userPrompt 사용자 프롬프트
 * @param temperature 온도 (기본 0.7)
 * @returns 빌드된 프롬프트
 */
export function buildSimplePrompt(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): BuiltPrompt {
  return {
    system: systemPrompt.trim(),
    user: userPrompt.trim(),
    temperature,
  };
}

/**
 * 이어쓰기 프롬프트를 빠르게 생성합니다.
 *
 * @param content 현재 내용
 * @param options 추가 옵션
 * @returns 빌드된 프롬프트
 */
export function buildContinuePrompt(
  content: string,
  options?: {
    characters?: string;
    style?: string;
  }
): BuiltPrompt {
  return buildPrompt('continue_writing', {
    content,
    characters: options?.characters,
    style: options?.style,
  });
}

/**
 * 브레인스토밍 프롬프트를 빠르게 생성합니다.
 *
 * @param context 상황 설명
 * @param options 추가 옵션
 * @returns 빌드된 프롬프트
 */
export function buildBrainstormPrompt(
  context: string,
  options?: {
    constraints?: string;
    direction?: string;
  }
): BuiltPrompt {
  return buildPrompt('brainstorm', {
    context,
    constraints: options?.constraints,
    direction: options?.direction,
  });
}

/**
 * 요약 프롬프트를 빠르게 생성합니다.
 *
 * @param content 요약할 내용
 * @param length 요약 길이 (예: "3줄", "100자")
 * @returns 빌드된 프롬프트
 */
export function buildSummarizePrompt(
  content: string,
  length?: string
): BuiltPrompt {
  return buildPrompt('summarize', {
    content,
    length,
  });
}
