/**
 * 프롬프트 템플릿 시스템
 *
 * 다양한 상황에 맞는 프롬프트 템플릿을 관리합니다.
 * 글쓰기 보조, 캐릭터 분석, 플롯 제안 등 다양한 용도로 사용됩니다.
 */

/**
 * 프롬프트 템플릿 타입
 */
export type PromptTemplateType =
  | 'continue_writing'     // 이어쓰기
  | 'rewrite'              // 다시 쓰기
  | 'improve_dialogue'     // 대사 개선
  | 'describe_scene'       // 장면 묘사
  | 'character_voice'      // 캐릭터 대사 생성
  | 'brainstorm'           // 브레인스토밍
  | 'summarize'            // 요약
  | 'check_consistency'    // 일관성 검사
  | 'suggest_hooking'      // 후킹 제안
  | 'analyze_pacing'       // 페이싱 분석
  | 'custom';              // 사용자 정의

/**
 * 프롬프트 템플릿 구조
 */
export interface PromptTemplate {
  /** 템플릿 ID */
  id: PromptTemplateType;
  /** 표시 이름 */
  name: string;
  /** 설명 */
  description: string;
  /** 시스템 프롬프트 */
  systemPrompt: string;
  /** 사용자 프롬프트 템플릿 (변수: {{variable}}) */
  userPromptTemplate: string;
  /** 필요한 변수 목록 */
  requiredVariables: string[];
  /** 선택적 변수 목록 */
  optionalVariables?: string[];
  /** 권장 temperature */
  suggestedTemperature: number;
  /** 카테고리 */
  category: 'writing' | 'analysis' | 'brainstorm' | 'editing';
}

/**
 * 기본 프롬프트 템플릿 목록
 */
export const PROMPT_TEMPLATES: Record<PromptTemplateType, PromptTemplate> = {
  continue_writing: {
    id: 'continue_writing',
    name: '이어쓰기',
    description: '현재 내용에서 자연스럽게 이어지는 글을 생성합니다.',
    systemPrompt: `당신은 한국 웹소설 전문 작가입니다.
주어진 내용에서 자연스럽게 이어지는 글을 작성해주세요.
- 기존 문체와 톤을 유지하세요
- 캐릭터의 성격과 말투를 일관되게 유지하세요
- 자연스러운 전개를 이어가세요
- 독자의 몰입을 유지하는 글을 쓰세요`,
    userPromptTemplate: `다음 내용을 이어서 써주세요:

{{content}}

{{#if characters}}
등장인물:
{{characters}}
{{/if}}

{{#if style}}
문체: {{style}}
{{/if}}`,
    requiredVariables: ['content'],
    optionalVariables: ['characters', 'style'],
    suggestedTemperature: 0.8,
    category: 'writing',
  },

  rewrite: {
    id: 'rewrite',
    name: '다시 쓰기',
    description: '선택한 부분을 다른 방식으로 다시 작성합니다.',
    systemPrompt: `당신은 한국 웹소설 전문 작가입니다.
주어진 내용을 더 나은 방식으로 다시 작성해주세요.
- 핵심 내용과 의미는 유지하세요
- 더 생동감 있고 몰입감 있게 표현하세요
- 불필요한 반복을 제거하세요`,
    userPromptTemplate: `다음 내용을 다시 써주세요:

{{content}}

{{#if direction}}
방향: {{direction}}
{{/if}}`,
    requiredVariables: ['content'],
    optionalVariables: ['direction'],
    suggestedTemperature: 0.7,
    category: 'editing',
  },

  improve_dialogue: {
    id: 'improve_dialogue',
    name: '대사 개선',
    description: '캐릭터 대사를 더 자연스럽고 개성있게 개선합니다.',
    systemPrompt: `당신은 한국 웹소설 대사 전문가입니다.
캐릭터의 대사를 더 자연스럽고 개성있게 개선해주세요.
- 캐릭터의 성격이 대사에 드러나도록 하세요
- 한국어 구어체를 자연스럽게 사용하세요
- 상황에 맞는 감정 표현을 넣으세요
- 과도한 설명조 대사는 피하세요`,
    userPromptTemplate: `다음 대사를 개선해주세요:

{{dialogue}}

{{#if character}}
캐릭터: {{character}}
{{/if}}

{{#if situation}}
상황: {{situation}}
{{/if}}`,
    requiredVariables: ['dialogue'],
    optionalVariables: ['character', 'situation'],
    suggestedTemperature: 0.7,
    category: 'editing',
  },

  describe_scene: {
    id: 'describe_scene',
    name: '장면 묘사',
    description: '장면을 생동감 있게 묘사합니다.',
    systemPrompt: `당신은 한국 웹소설 묘사 전문가입니다.
장면을 생동감 있고 몰입감 있게 묘사해주세요.
- 오감을 활용한 묘사를 사용하세요
- 과도하게 길지 않게, 핵심만 포착하세요
- 분위기와 감정을 전달하세요
- 웹소설에 맞는 간결한 문장을 사용하세요`,
    userPromptTemplate: `다음 장면을 묘사해주세요:

{{scene}}

{{#if mood}}
분위기: {{mood}}
{{/if}}

{{#if focus}}
강조할 점: {{focus}}
{{/if}}`,
    requiredVariables: ['scene'],
    optionalVariables: ['mood', 'focus'],
    suggestedTemperature: 0.8,
    category: 'writing',
  },

  character_voice: {
    id: 'character_voice',
    name: '캐릭터 대사 생성',
    description: '특정 캐릭터가 할 법한 대사를 생성합니다.',
    systemPrompt: `당신은 캐릭터 대사 전문가입니다.
주어진 캐릭터 정보를 바탕으로 그 캐릭터가 할 법한 대사를 생성해주세요.
- 캐릭터의 성격, 말투, 배경을 반영하세요
- 상황에 맞는 자연스러운 대사를 생성하세요
- 캐릭터의 감정 상태를 고려하세요`,
    userPromptTemplate: `다음 캐릭터가 할 법한 대사를 생성해주세요:

캐릭터 정보:
{{characterInfo}}

상황: {{situation}}

{{#if emotion}}
감정 상태: {{emotion}}
{{/if}}`,
    requiredVariables: ['characterInfo', 'situation'],
    optionalVariables: ['emotion'],
    suggestedTemperature: 0.8,
    category: 'writing',
  },

  brainstorm: {
    id: 'brainstorm',
    name: '브레인스토밍',
    description: '아이디어를 발산하고 새로운 전개를 제안받습니다.',
    systemPrompt: `당신은 창작 브레인스토밍 전문가입니다.
다양하고 창의적인 아이디어를 제안해주세요.
- 여러 가지 가능성을 제시하세요
- 예상치 못한 반전이나 전개도 포함하세요
- 각 아이디어의 장단점을 간단히 설명하세요`,
    userPromptTemplate: `다음 상황에서 가능한 전개를 브레인스토밍해주세요:

{{context}}

{{#if constraints}}
제약 조건:
{{constraints}}
{{/if}}

{{#if direction}}
원하는 방향: {{direction}}
{{/if}}`,
    requiredVariables: ['context'],
    optionalVariables: ['constraints', 'direction'],
    suggestedTemperature: 0.9,
    category: 'brainstorm',
  },

  summarize: {
    id: 'summarize',
    name: '요약',
    description: '내용을 핵심만 간추려 요약합니다.',
    systemPrompt: `당신은 요약 전문가입니다.
주어진 내용의 핵심을 파악하고 간결하게 요약해주세요.
- 중요한 사건과 인물 관계를 포함하세요
- 불필요한 세부사항은 생략하세요
- 읽기 쉬운 형식으로 정리하세요`,
    userPromptTemplate: `다음 내용을 요약해주세요:

{{content}}

{{#if length}}
요약 길이: {{length}}
{{/if}}`,
    requiredVariables: ['content'],
    optionalVariables: ['length'],
    suggestedTemperature: 0.3,
    category: 'analysis',
  },

  check_consistency: {
    id: 'check_consistency',
    name: '일관성 검사',
    description: '내용의 일관성을 검사하고 문제점을 찾습니다.',
    systemPrompt: `당신은 스토리 일관성 검사 전문가입니다.
주어진 내용에서 일관성 문제를 찾아주세요.
- 캐릭터 설정과 행동의 모순
- 시간선의 오류
- 세계관 설정의 충돌
- 논리적 모순`,
    userPromptTemplate: `다음 내용의 일관성을 검사해주세요:

{{content}}

{{#if settings}}
기존 설정:
{{settings}}
{{/if}}`,
    requiredVariables: ['content'],
    optionalVariables: ['settings'],
    suggestedTemperature: 0.2,
    category: 'analysis',
  },

  suggest_hooking: {
    id: 'suggest_hooking',
    name: '후킹 제안',
    description: '다음 화가 궁금해지는 끝맺음을 제안합니다.',
    systemPrompt: `당신은 웹소설 후킹 전문가입니다.
독자가 다음 화를 클릭하게 만드는 끝맺음을 제안해주세요.
- 긴장감을 유지하는 클리프행어
- 반전이나 새로운 전개의 암시
- 캐릭터의 결정적 순간
- 떡밥 투척`,
    userPromptTemplate: `다음 내용에 어울리는 후킹을 제안해주세요:

{{content}}

{{#if nextChapter}}
다음 화 계획: {{nextChapter}}
{{/if}}`,
    requiredVariables: ['content'],
    optionalVariables: ['nextChapter'],
    suggestedTemperature: 0.8,
    category: 'writing',
  },

  analyze_pacing: {
    id: 'analyze_pacing',
    name: '페이싱 분석',
    description: '이야기의 속도감과 긴장감 배분을 분석합니다.',
    systemPrompt: `당신은 스토리 페이싱 분석 전문가입니다.
이야기의 속도감과 긴장감 배분을 분석하고 개선점을 제안해주세요.
- 지루한 구간 찾기
- 너무 빠른 전개 지적
- 긴장과 이완의 배분
- 독자 피로도 고려`,
    userPromptTemplate: `다음 내용의 페이싱을 분석해주세요:

{{content}}

{{#if genre}}
장르: {{genre}}
{{/if}}`,
    requiredVariables: ['content'],
    optionalVariables: ['genre'],
    suggestedTemperature: 0.3,
    category: 'analysis',
  },

  custom: {
    id: 'custom',
    name: '사용자 정의',
    description: '직접 작성한 프롬프트를 사용합니다.',
    systemPrompt: '{{systemPrompt}}',
    userPromptTemplate: '{{userPrompt}}',
    requiredVariables: ['systemPrompt', 'userPrompt'],
    suggestedTemperature: 0.7,
    category: 'writing',
  },
};

/**
 * 템플릿 ID로 템플릿 가져오기
 */
export function getTemplate(id: PromptTemplateType): PromptTemplate {
  return PROMPT_TEMPLATES[id];
}

/**
 * 카테고리별 템플릿 목록 가져오기
 */
export function getTemplatesByCategory(
  category: PromptTemplate['category']
): PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES).filter((t) => t.category === category);
}

/**
 * 모든 템플릿 목록 가져오기
 */
export function getAllTemplates(): PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES);
}
