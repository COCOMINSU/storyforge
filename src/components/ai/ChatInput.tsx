/**
 * 메시지 입력 컴포넌트
 *
 * AI 대화창의 메시지 입력 영역입니다.
 *
 * 기능:
 * - 텍스트 입력 (자동 높이 조절)
 * - Enter로 전송, Shift+Enter로 줄바꿈
 * - 전송 버튼
 * - 생성 중 취소 버튼
 */

import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { Send, Square } from 'lucide-react';
import { useAIStore } from '@/stores';
import { cn } from '@/lib/cn';

interface ChatInputProps {
  /** 입력 비활성화 여부 */
  disabled?: boolean;
  /** 메시지 전송 콜백 */
  onSend: (content: string) => void;
}

/**
 * 메시지 입력 컴포넌트
 */
export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isGenerating, cancelGeneration } = useAIStore();

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');

    // 높이 리셋
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    // 자동 높이 조절
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isGenerating ? 'AI가 응답 중...' : '메시지를 입력하세요...'}
          disabled={disabled || isGenerating}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-md border border-input bg-background px-3 py-2',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-[40px] max-h-[200px]',
            'text-sm'
          )}
        />

        {isGenerating ? (
          <button
            onClick={cancelGeneration}
            className={cn(
              'p-2 rounded-md',
              'bg-destructive text-destructive-foreground',
              'hover:bg-destructive/90',
              'transition-colors'
            )}
            title="생성 중지"
          >
            <Square className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={cn(
              'p-2 rounded-md',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
            title="전송"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Enter로 전송, Shift+Enter로 줄바꿈
      </p>
    </div>
  );
}
