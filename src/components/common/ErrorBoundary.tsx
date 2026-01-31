/**
 * 에러 바운더리
 *
 * React 컴포넌트 트리에서 발생하는 JavaScript 에러를 캐치하고
 * 사용자에게 친화적인 에러 UI를 표시합니다.
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] 에러 발생:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full min-h-[200px] flex-col items-center justify-center bg-background p-8">
          <div className="text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-medium text-foreground">
              문제가 발생했습니다
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={this.handleRetry}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-accent"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
