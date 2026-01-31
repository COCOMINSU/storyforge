/**
 * 인증 모달
 *
 * 로그인, 회원가입 폼을 포함하는 인증 모달입니다.
 * 이메일/비밀번호 및 Google OAuth 로그인을 지원합니다.
 */

import { useState, useEffect } from 'react';
import { useAuthStore, useUIStore } from '@/stores';

type AuthMode = 'login' | 'signup';

export function AuthModal() {
  const { activeModal, closeModal } = useUIStore();
  const {
    isLoading,
    error,
    isSupabaseConfigured,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    clearError,
  } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const isOpen = activeModal === 'auth';

  // 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setLocalError(null);
      setSignUpSuccess(false);
      clearError();
    }
  }, [isOpen, clearError]);

  // 에러 메시지 동기화
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('이메일과 비밀번호를 입력하세요.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setLocalError('비밀번호가 일치하지 않습니다.');
        return;
      }
      if (password.length < 6) {
        setLocalError('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
      }

      await signUp(email, password);

      // 회원가입 성공 시 (에러가 없으면)
      if (!useAuthStore.getState().error) {
        setSignUpSuccess(true);
      }
    } else {
      await signInWithEmail(email, password);

      // 로그인 성공 시 모달 닫기
      if (useAuthStore.getState().isAuthenticated) {
        closeModal();
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    await signInWithGoogle();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setLocalError(null);
    setSignUpSuccess(false);
    clearError();
  };

  // 회원가입 성공 화면
  if (signUpSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-complete/20">
              <svg
                className="h-6 w-6 text-status-complete"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              이메일을 확인하세요
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{email}</span>
              으로 인증 링크를 보냈습니다.
              <br />
              링크를 클릭하여 회원가입을 완료하세요.
            </p>
            <button
              onClick={closeModal}
              className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>
          <button
            onClick={closeModal}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {/* Supabase 미설정 경고 */}
          {!isSupabaseConfigured && (
            <div className="mb-4 rounded-md bg-status-draft/20 p-3 text-sm">
              <div className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-draft"
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
                <div>
                  <p className="font-medium text-status-draft">Supabase 미설정</p>
                  <p className="mt-1 text-muted-foreground">
                    <code className="rounded bg-background px-1">.env</code> 파일에 Supabase
                    URL과 Key를 설정하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {localError && (
            <div className="mb-4 rounded-md bg-destructive/20 p-3 text-sm text-destructive">
              {localError}
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isLoading}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isSupabaseConfigured}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  처리 중...
                </span>
              ) : mode === 'login' ? (
                '로그인'
              ) : (
                '회원가입'
              )}
            </button>
          </form>

          {/* 구분선 */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">또는</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* 소셜 로그인 */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading || !isSupabaseConfigured}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google로 계속하기
          </button>

          {/* 모드 전환 */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                계정이 없으신가요?{' '}
                <button
                  onClick={switchMode}
                  className="font-medium text-primary hover:underline"
                >
                  회원가입
                </button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{' '}
                <button
                  onClick={switchMode}
                  className="font-medium text-primary hover:underline"
                >
                  로그인
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
