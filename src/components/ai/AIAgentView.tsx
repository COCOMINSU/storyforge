/**
 * AI Agent 전체화면 뷰
 *
 * AI Agent 모드에서 메인 영역에 표시되는 전체화면 채팅 인터페이스입니다.
 *
 * 구조:
 * - 상단: 헤더 (제목, 모델 선택, 설정)
 * - 중앙: 메시지 영역 (max-w-4xl 중앙 정렬)
 * - 하단: 입력 영역
 */

import { useRef, useEffect } from 'react';
import { useAIStore, useProjectStore } from '@/stores';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { AIAgentHeader } from './AIAgentHeader';
import type { ChatMessage as ChatMessageType } from '@/types';

export function AIAgentView() {
  const { currentSession, isGenerating, sendAgentMessage, createSession } = useAIStore();
  const { currentProject } = useProjectStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = currentSession?.messages || [];

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송 핸들러 (AI Agent 모드 - 전체 컨텍스트 사용)
  const handleSend = async (content: string) => {
    if (!currentProject) return;

    // 세션이 없으면 새로 생성 (world_building 타입 사용)
    if (!currentSession) {
      createSession(currentProject.id, 'world_building');
    }

    // AI Agent 전용 메시지 전송 (전체 컨텍스트 + 자동 업데이트)
    await sendAgentMessage(content, currentProject.id);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* 헤더 */}
      <AIAgentHeader />

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {messages.map((message: ChatMessageType) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isGenerating && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  <span className="text-sm">AI가 응답을 작성하고 있습니다...</span>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-border bg-sidebar/50">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <ChatInput
            onSend={handleSend}
            disabled={!currentProject}
            placeholder={!currentProject ? '프로젝트를 먼저 선택하세요...' : '메시지를 입력하세요...'}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 빈 상태 (대화가 없을 때)
 */
function EmptyState() {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <svg
          className="h-8 w-8 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h2 className="mb-2 text-xl font-semibold">AI 창작 보조</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        작품의 모든 설정을 파악한 AI와 대화하세요.
        캐릭터 생성, 줄거리 상담, 복선 관리 등 다양한 창작 활동을 도와드립니다.
      </p>
      <div className="grid max-w-lg gap-3 text-left text-sm">
        <SuggestionCard
          icon="👤"
          title="새 캐릭터 만들기"
          description="작품 세계관에 맞는 캐릭터를 제안받으세요"
        />
        <SuggestionCard
          icon="📖"
          title="다음 회차 구상"
          description="현재 진행 상황을 바탕으로 다음 전개를 상담하세요"
        />
        <SuggestionCard
          icon="🎭"
          title="복선 관리"
          description="깔아둔 복선을 정리하고 회수 시점을 논의하세요"
        />
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  icon: string;
  title: string;
  description: string;
}

function SuggestionCard({ icon, title, description }: SuggestionCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50">
      <span className="text-lg">{icon}</span>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
