/**
 * 대화 메시지 컴포넌트
 *
 * 개별 메시지를 렌더링합니다.
 *
 * 기능:
 * - 사용자/AI 메시지 스타일 구분
 * - 스트리밍 중 타이핑 효과
 * - AI 제안 액션 버튼
 * - 에러 상태 표시
 */

import { memo, useState } from 'react';
import { User, Bot, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types';
import { ActionButton } from './ActionButton';
import { TypingIndicator } from './TypingIndicator';
import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/dateUtils';

interface ChatMessageProps {
  /** 메시지 데이터 */
  message: ChatMessageType;
  /** 스트리밍 중 여부 */
  isStreaming?: boolean;
  /** 스트리밍 중인 콘텐츠 */
  streamingContent?: string;
  /** 재시도 콜백 */
  onRetry?: () => void;
}

/**
 * 대화 메시지
 *
 * memo로 최적화되어 불필요한 리렌더링을 방지합니다.
 */
export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming,
  streamingContent,
  onRetry,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const [copied, setCopied] = useState(false);

  // 표시할 콘텐츠 결정
  const content = isStreaming ? streamingContent || '' : message.content;

  // 클립보드 복사
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  return (
    <div
      className={cn(
        'group flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* 아바타 */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary' : 'bg-secondary'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-secondary-foreground" />
        )}
      </div>

      {/* 메시지 내용 */}
      <div
        className={cn(
          'flex-1 max-w-[85%]',
          isUser ? 'text-right' : 'text-left'
        )}
      >
        {/* 메시지 버블 */}
        <div
          className={cn(
            'inline-block rounded-lg px-4 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground',
            isError && 'bg-destructive/10 border border-destructive'
          )}
        >
          {/* 에러 표시 */}
          {isError && (
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">오류 발생</span>
            </div>
          )}

          {/* 메시지 텍스트 */}
          <div className="whitespace-pre-wrap break-words">
            {content || (isStreaming && <TypingIndicator />)}
          </div>

          {/* 스트리밍 커서 */}
          {isStreaming && content && (
            <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-0.5 align-middle" />
          )}

          {/* 에러 메시지 */}
          {isError && message.error && (
            <p className="text-xs text-muted-foreground mt-2">
              {message.error.message}
            </p>
          )}
        </div>

        {/* 메타 정보 */}
        <div className={cn(
          'flex items-center gap-2 mt-1',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(message.timestamp)}
          </p>

          {/* 모델 정보 (AI 메시지만) */}
          {!isUser && message.model && (
            <span className="text-xs text-muted-foreground">
              · {getModelShortName(message.model)}
            </span>
          )}

          {/* 토큰 수 (AI 메시지만) */}
          {!isUser && message.tokenCount && (
            <span className="text-xs text-muted-foreground">
              · {message.tokenCount.toLocaleString()}t
            </span>
          )}

          {/* 복사 버튼 */}
          {!isStreaming && content && (
            <button
              onClick={handleCopy}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="메시지 복사"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  복사
                </>
              )}
            </button>
          )}

          {/* 재시도 버튼 (에러 시) */}
          {isError && onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              재시도
            </button>
          )}
        </div>

        {/* 액션 버튼들 */}
        {!isUser &&
          message.suggestedActions &&
          message.suggestedActions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.suggestedActions.map((action) => (
                <ActionButton key={action.id} action={action} />
              ))}
            </div>
          )}
      </div>
    </div>
  );
});

/**
 * 모델 이름을 짧은 형태로 변환
 */
function getModelShortName(model: string): string {
  const shortNames: Record<string, string> = {
    'claude-opus-4-5-20251101': 'Opus',
    'claude-sonnet-4-20250514': 'Sonnet',
    'claude-3-5-haiku-20241022': 'Haiku',
  };
  return shortNames[model] || model;
}
