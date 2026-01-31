/**
 * 줄거리 설정 단계별 프롬프트
 *
 * AI와 단계별 대화를 통해 작품의 줄거리를 설정합니다.
 * 장르 선택부터 화별 줄거리까지 체계적으로 구성합니다.
 */

import type { PlotSettingStep, PlotSettingState } from '@/types';

/**
 * 줄거리 설정 단계 구성
 */
interface PlotStepConfig {
  /** 단계 제목 */
  title: string;
  /** 단계 설명 */
  description: string;
  /** AI 시스템 프롬프트 */
  systemPrompt: string;
  /** 초기 메시지 */
  initialMessage: string;
}

/**
 * 줄거리 설정 단계별 설정
 */
export const PLOT_STEP_CONFIG: Record<PlotSettingStep, PlotStepConfig> = {
  genre_selection: {
    title: '장르 선택',
    description: '작품의 장르를 선택합니다',
    systemPrompt: `당신은 웹소설 장르 전문가입니다.
사용자가 원하는 장르를 파악하고, 해당 장르의 특성과 독자 기대를 설명해주세요.
복수 장르 조합도 가능합니다.
한국 웹소설 시장의 트렌드를 반영해주세요.`,
    initialMessage: `어떤 장르의 이야기를 쓰고 싶으신가요?

**인기 장르:**
- 판타지 (이세계, 회귀, 헌터물)
- 로맨스 (현대, 사극, 판타지)
- 무협
- 스릴러/미스터리
- SF

여러 장르를 조합해도 좋습니다. (예: 회귀 + 로맨스)`,
  },

  premise: {
    title: '기본 전제',
    description: '이야기의 핵심 아이디어를 정합니다',
    systemPrompt: `당신은 스토리 컨셉 개발 전문가입니다.
사용자의 아이디어를 구체화하고, 더 매력적인 전제로 발전시켜주세요.
로그라인(한 줄 요약)을 함께 제안해주세요.
한국 웹소설 독자가 좋아할 만한 요소를 고려해주세요.`,
    initialMessage: `어떤 이야기를 쓰고 싶으신가요?

간단한 아이디어라도 괜찮습니다. 예를 들면:
- "평범한 회사원이 던전이 나타난 세계에서 살아남는 이야기"
- "재벌가 막내아들로 회귀한 주인공"
- "마왕을 물리친 용사가 평범하게 살고 싶은 이야기"

어떤 이야기가 마음에 드세요?`,
  },

  main_character: {
    title: '주인공 설정',
    description: '주인공의 기본적인 특성을 정합니다',
    systemPrompt: `당신은 캐릭터 설정 전문가입니다.
주인공의 핵심 특성을 파악하고, 독자가 공감하고 응원할 수 있는 캐릭터로 발전시켜주세요.
장르에 맞는 주인공 유형을 제안해주세요.
한국 웹소설에서 인기있는 주인공 특성을 참고해주세요.`,
    initialMessage: `주인공은 어떤 사람인가요?

기본적인 것부터 시작해볼까요?
- 이름과 나이
- 직업이나 상황
- 가장 두드러지는 성격
- 어떤 목표나 욕망을 가지고 있는지`,
  },

  conflict: {
    title: '갈등 요소',
    description: '이야기의 주요 갈등을 설정합니다',
    systemPrompt: `당신은 플롯 구성 전문가입니다.
매력적인 갈등 구조를 제안해주세요.
내적 갈등과 외적 갈등을 균형 있게 설계해주세요.
독자를 긴장시키고 몰입하게 만드는 갈등을 제안해주세요.`,
    initialMessage: `주인공이 극복해야 할 갈등은 무엇인가요?

좋은 갈등의 요소:
- **외적 갈등**: 악역, 조직, 상황 등 외부의 장애물
- **내적 갈등**: 두려움, 트라우마, 도덕적 딜레마

주인공의 앞을 가로막는 것은 무엇인가요?`,
  },

  world_setting: {
    title: '세계관',
    description: '이야기가 펼쳐지는 세계를 설정합니다',
    systemPrompt: `당신은 세계관 설계 전문가입니다.
장르에 맞는 세계관을 구축하고, 이야기에 필요한 핵심 설정을 제안해주세요.
일관성 있고 몰입감 있는 세계를 만들어주세요.
웹소설 특성상 독자가 쉽게 이해할 수 있는 시스템을 설계해주세요.`,
    initialMessage: `이야기는 어떤 세계에서 펼쳐지나요?

고려할 요소들:
- 시대 배경 (현대, 과거, 미래, 이세계)
- 특별한 규칙이나 시스템 (마법, 던전, 능력 등)
- 사회 구조 (국가, 조직, 계급 등)

이 세계만의 특별한 점이 있나요?`,
  },

  plot_structure: {
    title: '플롯 구조',
    description: '이야기의 전체적인 흐름을 설계합니다',
    systemPrompt: `당신은 스토리 구조 전문가입니다.
3막 구조 또는 기승전결에 맞춰 이야기의 큰 흐름을 설계해주세요.
각 구간의 핵심 이벤트를 제안해주세요.
웹소설의 연재 특성을 고려해 매 화마다 후킹 포인트를 넣을 수 있도록 설계해주세요.`,
    initialMessage: `이야기의 전체 흐름을 잡아볼까요?

**기본 구조:**
1. **시작(기)**: 주인공의 일상과 사건의 시작
2. **전개(승)**: 갈등 심화, 성장과 시련
3. **절정(전)**: 최대의 위기와 결전
4. **결말(결)**: 해결과 새로운 일상

대략적인 흐름을 말씀해주시거나, 제가 제안해드릴까요?`,
  },

  chapter_outline: {
    title: '화별 줄거리',
    description: '각 화의 내용을 구체적으로 계획합니다',
    systemPrompt: `당신은 연재소설 구성 전문가입니다.
각 화가 적절한 분량과 후킹을 가지도록 구성해주세요.
1화당 약 5000자 기준으로 계획해주세요.
매 화 끝에 독자가 다음 화를 클릭하게 만드는 후킹을 넣어주세요.`,
    initialMessage: `이제 화별로 구체적인 내용을 정해볼까요?

먼저 1권(약 25화)의 줄거리를 잡아보겠습니다.
주요 이벤트와 각 화의 끝을 어떻게 마무리할지(후킹) 함께 생각해봐요.

1화는 어떻게 시작하면 좋을까요?`,
  },

  review: {
    title: '검토 및 확정',
    description: '설정을 최종 확인합니다',
    systemPrompt: `지금까지 설정한 내용을 정리해서 보여주세요.
수정이 필요한 부분이 있는지 확인하고, 최종 확정할 수 있도록 안내해주세요.
설정의 일관성을 검토하고 잠재적인 문제점이 있다면 지적해주세요.`,
    initialMessage: `지금까지 설정한 내용을 정리해드릴게요. 확인 후 수정하거나 확정해주세요.`,
  },
};

/**
 * 줄거리 설정 단계 순서
 */
export const PLOT_STEPS: PlotSettingStep[] = [
  'genre_selection',
  'premise',
  'main_character',
  'conflict',
  'world_setting',
  'plot_structure',
  'chapter_outline',
  'review',
];

/**
 * 특정 단계의 프롬프트를 가져옵니다.
 * 이전 단계에서 수집된 정보를 맥락에 추가합니다.
 *
 * @param step 현재 단계
 * @param state 줄거리 설정 상태
 * @returns 시스템 프롬프트와 초기 메시지
 */
export function getPlotStepPrompt(
  step: PlotSettingStep,
  state: PlotSettingState
): { system: string; initial: string } {
  const config = PLOT_STEP_CONFIG[step];

  // 이전 단계 정보를 맥락에 추가
  let contextAddition = '\n\n[현재까지 설정된 정보]';
  let hasContext = false;

  if (state.data.genre && state.data.genre.length > 0) {
    contextAddition += `\n- 장르: ${state.data.genre.join(', ')}`;
    hasContext = true;
  }

  if (state.data.premise) {
    contextAddition += `\n- 전제: ${state.data.premise}`;
    hasContext = true;
  }

  if (state.data.mainCharacter) {
    const mc = state.data.mainCharacter;
    const mcInfo = [mc.name, mc.role, mc.description].filter(Boolean).join(' / ');
    if (mcInfo) {
      contextAddition += `\n- 주인공: ${mcInfo}`;
      hasContext = true;
    }
  }

  if (state.data.conflict) {
    contextAddition += `\n- 갈등: ${state.data.conflict}`;
    hasContext = true;
  }

  if (state.data.worldSetting) {
    contextAddition += `\n- 세계관: ${state.data.worldSetting}`;
    hasContext = true;
  }

  if (state.data.plotStructure) {
    const ps = state.data.plotStructure;
    contextAddition += `\n- 플롯 구조:`;
    if (ps.beginning) contextAddition += `\n  - 도입: ${ps.beginning}`;
    if (ps.middle) contextAddition += `\n  - 전개: ${ps.middle}`;
    if (ps.end) contextAddition += `\n  - 결말: ${ps.end}`;
    hasContext = true;
  }

  const systemPrompt = hasContext
    ? config.systemPrompt + contextAddition
    : config.systemPrompt;

  return {
    system: systemPrompt,
    initial: config.initialMessage,
  };
}

/**
 * 줄거리 설정 완료 후 프로젝트에 적용할 데이터 생성
 */
export function buildPlotDataFromState(state: PlotSettingState): {
  genre: string[];
  synopsis: string;
  chapterOutlines: Array<{
    volumeNumber: number;
    chapterNumber: number;
    title: string;
    summary: string;
  }>;
} {
  const { data } = state;

  // 시놉시스 생성
  const synopsisParts: string[] = [];
  if (data.premise) synopsisParts.push(data.premise);
  if (data.plotStructure) {
    if (data.plotStructure.beginning) {
      synopsisParts.push(`[도입] ${data.plotStructure.beginning}`);
    }
    if (data.plotStructure.middle) {
      synopsisParts.push(`[전개] ${data.plotStructure.middle}`);
    }
    if (data.plotStructure.end) {
      synopsisParts.push(`[결말] ${data.plotStructure.end}`);
    }
  }

  return {
    genre: data.genre || [],
    synopsis: synopsisParts.join('\n\n'),
    chapterOutlines: data.chapterOutlines || [],
  };
}
