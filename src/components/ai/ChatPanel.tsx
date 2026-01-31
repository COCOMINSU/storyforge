/**
 * AI 대화창 메인 컴포넌트
 *
 * 우측 패널에 표시되는 AI 대화 인터페이스입니다.
 *
 * 구조:
 * - 헤더 (세션 타입, 모델 선택, 설정)
 * - 메시지 목록 (스크롤 영역)
 * - 입력 영역 (하단 고정)
 */

import { useEffect, useRef } from 'react';
import { useAIStore, useProjectStore, useUIStore } from '@/stores';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { ChatHeader } from './ChatHeader';
import { EmptyChat } from './EmptyChat';
import { cn } from '@/lib/cn';

/**
 * AI 대화창
 */
export function ChatPanel() {
  const {
    currentSession,
    isGenerating,
    streamingContent,
    apiKeySet,
    sendMessage,
    createSession,
  } = useAIStore();
  const currentProject = useProjectStore((state) => state.currentProject);
  const { openModal } = useUIStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages.length, streamingContent]);

  // API 키 미설정
  if (!apiKeySet) {
    return <APIKeySetup onSetup={() => openModal('ai-settings')} />;
  }

  // 프로젝트 미선택
  if (!currentProject) {
    return <NoProjectSelected />;
  }

  const handleSend = async (content: string) => {
    // 세션이 없으면 생성
    if (!currentSession) {
      createSession(currentProject.id, 'general');
    }

    // 메시지 전송
    await sendMessage(content, currentProject.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <ChatHeader />

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentSession || currentSession.messages.length === 0 ? (
          <EmptyChat />
        ) : (
          <>
            {currentSession.messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={
                  index === currentSession.messages.length - 1 &&
                  message.status === 'streaming'
                }
                streamingContent={
                  index === currentSession.messages.length - 1 &&
                  message.status === 'streaming'
                    ? streamingContent
                    : undefined
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 입력 영역 */}
      <ChatInput
        disabled={isGenerating || !currentProject}
        onSend={handleSend}
      />
    </div>
  );
}

/**
 * API 키 설정 안내
 */
function APIKeySetup({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="text-4xl mb-4">🔑</div>
      <h3 className="text-lg font-medium mb-2">API 키 설정 필요</h3>
      <p className="text-sm text-muted-foreground mb-4">
        AI 기능을 사용하려면
        <br />
        Claude API 키가 필요합니다.
      </p>
      <button
        className={cn(
          'px-4 py-2 rounded-md',
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
          'transition-colors'
        )}
        onClick={onSetup}
      >
        API 키 설정하기
      </button>
    </div>
  );
}

/**
 * 프로젝트 미선택 안내
 */
function NoProjectSelected() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="text-4xl mb-4">📝</div>
      <h3 className="text-lg font-medium mb-2">프로젝트를 선택하세요</h3>
      <p className="text-sm text-muted-foreground">
        AI 보조작가를 사용하려면
        <br />
        먼저 프로젝트를 열어주세요.
      </p>
    </div>
  );
}
