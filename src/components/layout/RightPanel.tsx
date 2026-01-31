/**
 * 우측 패널 - AI 어시스턴트
 *
 * MVP에서는 플레이스홀더로 표시됩니다.
 * 추후 AI 기능이 추가될 예정입니다.
 */

export function RightPanel() {
  return (
    <div className="flex h-full flex-col">
      {/* 패널 헤더 */}
      <div className="border-b border-border p-3">
        <h2 className="text-sm font-semibold text-foreground">
          AI 어시스턴트
        </h2>
      </div>

      {/* 컨텐츠 */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <svg
          className="mb-4 h-12 w-12 text-muted-foreground/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <p className="text-center text-sm text-muted-foreground">
          AI 어시스턴트 기능은
          <br />
          추후 업데이트될 예정입니다.
        </p>
      </div>
    </div>
  );
}
