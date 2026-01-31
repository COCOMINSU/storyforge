/**
 * 빈 대화 상태 컴포넌트
 *
 * 대화가 없을 때 표시되는 안내 화면입니다.
 * 빠른 시작을 위한 프롬프트 제안도 포함합니다.
 */

import { MessageSquarePlus, Lightbulb, Users, BookOpen } from 'lucide-react';
import { useAIStore, useProjectStore } from '@/stores';
import { cn } from '@/lib/cn';

/**
 * 빠른 시작 프롬프트 제안
 */
const QUICK_PROMPTS = [
  {
    icon: Lightbulb,
    label: '아이디어 브레인스토밍',
    prompt: '이 작품에 어울리는 새로운 전개를 제안해줘',
  },
  {
    icon: Users,
    label: '인물 설정 도움',
    prompt: '주인공의 성격을 더 입체적으로 만들려면 어떻게 해야 할까?',
  },
  {
    icon: BookOpen,
    label: '줄거리 검토',
    prompt: '현재 줄거리에서 개선할 점이 있을까?',
  },
];

export function EmptyChat() {
  const { sendMessage, createSession } = useAIStore();
  const currentProject = useProjectStore((state) => state.currentProject);

  const handleQuickPrompt = async (prompt: string) => {
    if (!currentProject) return;

    // 세션이 없으면 생성
    const { currentSession } = useAIStore.getState();
    if (!currentSession) {
      createSession(currentProject.id, 'general');
    }

    // 메시지 전송
    await sendMessage(prompt, currentProject.id);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {/* 아이콘 */}
      <div className="mb-4 p-4 rounded-full bg-accent">
        <MessageSquarePlus className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* 안내 텍스트 */}
      <h3 className="text-lg font-medium mb-2">AI 보조작가와 대화하기</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        줄거리 구상, 인물 설정, 글쓰기 등
        <br />
        창작 과정에서 도움을 받아보세요.
      </p>

      {/* 빠른 시작 버튼 */}
      <div className="w-full max-w-xs space-y-2">
        <p className="text-xs text-muted-foreground mb-2">빠른 시작</p>
        {QUICK_PROMPTS.map((item) => (
          <button
            key={item.label}
            onClick={() => handleQuickPrompt(item.prompt)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md',
              'bg-accent/50 hover:bg-accent',
              'text-sm text-left',
              'transition-colors'
            )}
          >
            <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
