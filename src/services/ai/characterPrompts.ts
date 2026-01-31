/**
 * 인물 설정 단계별 프롬프트
 *
 * AI와 단계별 대화를 통해 인물을 설정하고,
 * 완료 시 캐릭터 카드를 자동 생성합니다.
 */

import type { CharacterSettingStep, CharacterSettingState, CharacterCard } from '@/types';

/**
 * 인물 설정 단계 구성
 */
interface CharacterStepConfig {
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
 * 인물 설정 단계별 설정
 */
export const CHARACTER_STEP_CONFIG: Record<CharacterSettingStep, CharacterStepConfig> = {
  basic_info: {
    title: '기본 정보',
    description: '이름, 나이, 직업 등',
    systemPrompt: `당신은 캐릭터 설정 전문가입니다.
캐릭터의 기본 정보를 자연스럽게 수집해주세요.
한국 웹소설에 어울리는 이름을 제안해줄 수 있습니다.
작가가 이미 정한 것이 있다면 그것을 존중해주세요.`,
    initialMessage: `새로운 인물을 만들어볼까요?

먼저 기본적인 정보부터 정해봐요:
- 이름 (작명이 어려우시면 도와드릴게요!)
- 나이 또는 연령대
- 이 인물의 역할 (주인공, 조연, 악역 등)
- 직업이나 신분`,
  },

  appearance: {
    title: '외모',
    description: '신체적 특징',
    systemPrompt: `캐릭터의 외모를 구체적으로 설정해주세요.
독자가 쉽게 상상할 수 있도록 특징적인 부분을 강조해주세요.
너무 자세하기보다는 인상적인 특징 위주로 설정하세요.`,
    initialMessage: `이 인물의 외모는 어떤가요?

묘사할 수 있는 요소들:
- 전체적인 인상 (예: 차가운, 따뜻한, 날카로운)
- 체형과 키
- 머리카락, 눈동자 색
- 특징적인 부분 (흉터, 점, 습관적인 표정 등)`,
  },

  personality: {
    title: '성격',
    description: '성격 특성',
    systemPrompt: `캐릭터의 성격을 다면적으로 설정해주세요.
겉으로 보이는 모습과 내면이 다를 수 있습니다.
성격이 이야기에서 어떻게 작용할지도 생각해주세요.`,
    initialMessage: `이 인물의 성격을 알려주세요.

생각해볼 점들:
- 첫인상 (다른 사람들에게 어떻게 보이는지)
- 실제 성격 (친해진 후에 보이는 모습)
- 장점과 단점
- 특이한 버릇이나 습관`,
  },

  background: {
    title: '배경',
    description: '과거와 성장 환경',
    systemPrompt: `캐릭터의 과거와 배경을 설정해주세요.
현재 성격을 형성하게 된 경험을 포함해주세요.
비밀이나 트라우마가 있다면 이야기에 어떻게 활용될지 생각해보세요.`,
    initialMessage: `이 인물은 어떤 삶을 살아왔나요?

배경 이야기:
- 가족 관계
- 성장 환경
- 인생에 큰 영향을 준 사건
- 비밀이나 트라우마 (있다면)`,
  },

  motivation: {
    title: '동기',
    description: '목표와 욕망',
    systemPrompt: `캐릭터의 동기와 목표를 설정해주세요.
이야기를 이끄는 원동력이 됩니다.
내면의 진짜 욕망과 표면적 목표가 다를 수 있습니다.`,
    initialMessage: `이 인물이 가장 원하는 것은 무엇인가요?

동기 요소:
- 가장 큰 목표 (무엇을 이루고 싶은지)
- 왜 그것을 원하는지
- 목표를 위해 어디까지 할 수 있는지
- 두려워하는 것`,
  },

  relationships: {
    title: '관계',
    description: '다른 인물과의 관계',
    systemPrompt: `다른 캐릭터와의 관계를 설정해주세요.
기존 캐릭터와의 연결고리를 만들어주세요.
관계가 이야기 속에서 어떻게 변화할 수 있는지도 고려해주세요.`,
    initialMessage: `다른 인물들과 어떤 관계인가요?

주요 관계:
- 가족
- 친구 또는 동료
- 적 또는 라이벌
- 특별한 관계 (연인, 스승 등)

기존 등장인물과의 관계도 설정할 수 있어요.`,
  },

  abilities: {
    title: '능력',
    description: '특기와 능력 (장르에 따라)',
    systemPrompt: `캐릭터의 능력이나 특기를 설정해주세요.
장르에 맞는 능력을 제안해드릴 수 있습니다.
능력의 강점과 약점을 균형있게 설정해주세요.`,
    initialMessage: `이 인물의 능력이나 특기가 있나요?

(판타지/무협/능력물의 경우)
- 가진 능력이나 스킬
- 능력의 강점과 약점
- 성장 가능성

(일반 장르의 경우)
- 전문 분야나 특기
- 남다른 재능`,
  },

  arc: {
    title: '성장 곡선',
    description: '캐릭터의 변화',
    systemPrompt: `캐릭터의 성장과 변화를 설계해주세요.
이야기 진행에 따른 발전을 계획해주세요.
성장의 계기가 될 사건들을 구체적으로 설정해주세요.`,
    initialMessage: `이 인물은 이야기 속에서 어떻게 변화하나요?

캐릭터 아크:
- 시작점 (처음에는 어떤 모습인지)
- 겪게 될 시련
- 끝점 (최종적으로 어떤 모습이 되는지)
- 변화의 계기가 될 사건`,
  },

  review: {
    title: '검토',
    description: '설정 확인 및 완료',
    systemPrompt: `지금까지 설정한 캐릭터 정보를 정리해서 보여주세요.
캐릭터 카드 형식으로 요약해주세요.
수정이 필요한 부분이 있는지 확인해주세요.`,
    initialMessage: `캐릭터 설정이 완료되었습니다! 내용을 확인해주세요.`,
  },
};

/**
 * 인물 설정 단계 순서
 */
export const CHARACTER_STEPS: CharacterSettingStep[] = [
  'basic_info',
  'appearance',
  'personality',
  'background',
  'motivation',
  'relationships',
  'abilities',
  'arc',
  'review',
];

/**
 * 특정 단계의 프롬프트를 가져옵니다.
 * 이전 단계에서 수집된 정보를 맥락에 추가합니다.
 *
 * @param step 현재 단계
 * @param state 인물 설정 상태
 * @returns 시스템 프롬프트와 초기 메시지
 */
export function getCharacterStepPrompt(
  step: CharacterSettingStep,
  state: CharacterSettingState
): { system: string; initial: string } {
  const config = CHARACTER_STEP_CONFIG[step];

  // 이전 단계 정보를 맥락에 추가
  let contextAddition = '\n\n[현재까지 설정된 캐릭터 정보]';
  let hasContext = false;

  const { data } = state;

  if (data.name) {
    contextAddition += `\n- 이름: ${data.name}`;
    hasContext = true;
  }

  if (data.role) {
    contextAddition += `\n- 역할: ${data.role}`;
    hasContext = true;
  }

  if (data.age) {
    contextAddition += `\n- 나이: ${data.age}`;
    hasContext = true;
  }

  if (data.occupation) {
    contextAddition += `\n- 직업: ${data.occupation}`;
    hasContext = true;
  }

  if (data.appearance) {
    contextAddition += `\n- 외모: ${data.appearance}`;
    hasContext = true;
  }

  if (data.personality) {
    contextAddition += `\n- 성격: ${data.personality}`;
    hasContext = true;
  }

  if (data.background) {
    contextAddition += `\n- 배경: ${data.background}`;
    hasContext = true;
  }

  if (data.motivation) {
    contextAddition += `\n- 동기: ${data.motivation}`;
    hasContext = true;
  }

  if (data.relationships && data.relationships.length > 0) {
    const relStr = data.relationships
      .map((r) => `${r.targetName}(${r.type})`)
      .join(', ');
    contextAddition += `\n- 관계: ${relStr}`;
    hasContext = true;
  }

  if (data.abilities && data.abilities.length > 0) {
    const abStr = data.abilities.map((a) => a.name).join(', ');
    contextAddition += `\n- 능력: ${abStr}`;
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
 * 인물 설정 완료 후 캐릭터 카드 데이터 생성
 */
export function buildCharacterCardFromState(
  state: CharacterSettingState
): Partial<CharacterCard> {
  const { data } = state;

  // 역할 매핑
  const roleMap: Record<string, CharacterCard['role']> = {
    '주인공': 'protagonist',
    '메인': 'protagonist',
    'protagonist': 'protagonist',
    '히로인': 'supporting',
    '조연': 'supporting',
    'supporting': 'supporting',
    '악역': 'antagonist',
    '빌런': 'antagonist',
    'antagonist': 'antagonist',
    '단역': 'minor',
    'minor': 'minor',
  };

  const role = data.role
    ? roleMap[data.role.toLowerCase()] || 'supporting'
    : 'supporting';

  return {
    type: 'character',
    name: data.name || '이름 없음',
    description: data.background || '',
    role,
    basicInfo: {
      age: data.age,
      gender: data.gender,
      occupation: data.occupation,
    },
    appearance: {
      distinguishingFeatures: data.appearance,
    },
    personality: data.personality || '',
    background: data.background || '',
    motivation: data.motivation || '',
    abilities: data.abilities?.map((a) => ({
      name: a.name,
      description: a.description,
    })) || [],
    relationships:
      data.relationships?.map((r) => ({
        targetId: '', // 나중에 실제 ID로 매칭 필요
        targetName: r.targetName,
        relationType: r.type as 'family' | 'friend' | 'rival' | 'love' | 'other',
        description: r.description,
      })) || [],
    arc:
      data.arc?.map((a) => ({
        phase: a.phase,
        change: a.change,
      })) || [],
    tags: [],
  };
}
