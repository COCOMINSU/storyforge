/**
 * 우측 패널 - AI 어시스턴트
 *
 * AI 대화 기능을 제공하는 채팅 패널입니다.
 * ChatPanel 컴포넌트를 통해 Claude AI와 대화할 수 있습니다.
 */

import { ChatPanel } from '@/components/ai';

export function RightPanel() {
  return (
    <div className="flex h-full flex-col">
      <ChatPanel />
    </div>
  );
}
