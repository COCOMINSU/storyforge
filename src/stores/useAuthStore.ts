/**
 * 인증 상태 관리 스토어
 *
 * Supabase 인증 상태를 관리합니다.
 * 선택적 인증 시스템: 로그인 없이도 로컬 모드로 사용 가능
 *
 * 주요 기능:
 * - 이메일/비밀번호 로그인
 * - Google OAuth 로그인
 * - 세션 관리 (자동 갱신)
 * - 동기화 상태 관리
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User, SyncInfo, SyncStatus } from '@/types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthState {
  /** 현재 사용자 */
  user: User | null;

  /** 로딩 상태 */
  isLoading: boolean;

  /** 초기 세션 확인 완료 여부 */
  isInitialized: boolean;

  /** 인증 여부 */
  isAuthenticated: boolean;

  /** Supabase 설정 여부 */
  isSupabaseConfigured: boolean;

  /** 동기화 정보 */
  syncInfo: SyncInfo;

  /** 에러 메시지 */
  error: string | null;
}

interface AuthActions {
  /** 초기화 (세션 확인 및 리스너 등록) */
  initialize: () => Promise<void>;

  /** 이메일/비밀번호 로그인 */
  signInWithEmail: (email: string, password: string) => Promise<void>;

  /** 소셜 로그인 (Google) */
  signInWithGoogle: () => Promise<void>;

  /** 회원가입 */
  signUp: (email: string, password: string) => Promise<void>;

  /** 로그아웃 */
  signOut: () => Promise<void>;

  /** 세션 확인 */
  checkSession: () => Promise<void>;

  /** 동기화 상태 업데이트 */
  updateSyncStatus: (status: SyncStatus) => void;

  /** 동기화 활성화/비활성화 */
  setSyncEnabled: (enabled: boolean) => void;

  /** 수동 동기화 (선택적으로 특정 프로젝트 ID 지정) */
  syncNow: (projectId?: string) => Promise<void>;

  /** 에러 초기화 */
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

/**
 * Supabase 세션에서 User 객체 생성
 */
function sessionToUser(session: Session | null): User | null {
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email || '',
    displayName:
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email?.split('@')[0] ||
      '사용자',
    avatarUrl: session.user.user_metadata?.avatar_url,
  };
}

/**
 * 인증 스토어
 *
 * @example
 * const { user, isAuthenticated, signInWithEmail, signInWithGoogle } = useAuthStore();
 *
 * // 이메일 로그인
 * await signInWithEmail('user@example.com', 'password');
 *
 * // Google 로그인
 * await signInWithGoogle();
 *
 * // 로그아웃
 * await signOut();
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      user: null,
      isLoading: false,
      isInitialized: false,
      isAuthenticated: false,
      isSupabaseConfigured,
      syncInfo: {
        enabled: false,
        pendingChanges: 0,
        status: 'offline',
      },
      error: null,

      // 초기화
      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });

        try {
          // Supabase가 설정되지 않은 경우 오프라인 모드
          if (!isSupabaseConfigured) {
            console.log('[AuthStore] Supabase 미설정 - 오프라인 모드');
            set({
              isInitialized: true,
              isLoading: false,
              syncInfo: { enabled: false, pendingChanges: 0, status: 'offline' },
            });
            return;
          }

          // 현재 세션 확인
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            console.error('[AuthStore] 세션 확인 실패:', error);
          }

          const user = sessionToUser(session);

          // Auth 상태 변경 리스너 등록
          supabase.auth.onAuthStateChange(
            (event: AuthChangeEvent, session: Session | null) => {
              console.log('[AuthStore] Auth 상태 변경:', event);

              const user = sessionToUser(session);

              set({
                user,
                isAuthenticated: !!user,
                syncInfo: {
                  ...get().syncInfo,
                  status: user ? 'synced' : 'offline',
                },
              });
            }
          );

          set({
            user,
            isAuthenticated: !!user,
            isInitialized: true,
            isLoading: false,
            syncInfo: {
              ...get().syncInfo,
              status: user ? 'synced' : 'offline',
            },
          });
        } catch (error) {
          console.error('[AuthStore] 초기화 실패:', error);
          set({
            isInitialized: true,
            isLoading: false,
            error: '인증 시스템 초기화에 실패했습니다.',
          });
        }
      },

      // 이메일 로그인
      signInWithEmail: async (email, password) => {
        if (!isSupabaseConfigured) {
          set({ error: 'Supabase가 설정되지 않았습니다. .env 파일을 확인하세요.' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            throw error;
          }

          const user = sessionToUser(data.session);

          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            syncInfo: {
              ...get().syncInfo,
              status: 'synced',
            },
          });

          console.log('[AuthStore] 이메일 로그인 성공:', user?.email);
        } catch (error: unknown) {
          console.error('[AuthStore] 로그인 실패:', error);

          let errorMessage = '로그인에 실패했습니다.';
          if (error instanceof Error) {
            if (error.message.includes('Invalid login credentials')) {
              errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
            } else if (error.message.includes('Email not confirmed')) {
              errorMessage = '이메일 인증이 필요합니다. 메일함을 확인하세요.';
            } else {
              errorMessage = error.message;
            }
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      // Google 로그인
      signInWithGoogle: async () => {
        if (!isSupabaseConfigured) {
          set({ error: 'Supabase가 설정되지 않았습니다. .env 파일을 확인하세요.' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin,
            },
          });

          if (error) {
            throw error;
          }

          // OAuth는 리다이렉트되므로 여기서는 로딩만 유지
          // 실제 로그인 처리는 onAuthStateChange에서 수행
        } catch (error: unknown) {
          console.error('[AuthStore] Google 로그인 실패:', error);

          let errorMessage = 'Google 로그인에 실패했습니다.';
          if (error instanceof Error) {
            errorMessage = error.message;
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      // 회원가입
      signUp: async (email, password) => {
        if (!isSupabaseConfigured) {
          set({ error: 'Supabase가 설정되지 않았습니다. .env 파일을 확인하세요.' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });

          if (error) {
            throw error;
          }

          // 이메일 인증이 필요한 경우
          if (data.user && !data.session) {
            set({
              isLoading: false,
              error: null,
            });
            // 성공 메시지는 UI에서 처리
            return;
          }

          const user = sessionToUser(data.session);

          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });

          console.log('[AuthStore] 회원가입 성공:', user?.email);
        } catch (error: unknown) {
          console.error('[AuthStore] 회원가입 실패:', error);

          let errorMessage = '회원가입에 실패했습니다.';
          if (error instanceof Error) {
            if (error.message.includes('already registered')) {
              errorMessage = '이미 등록된 이메일입니다.';
            } else if (error.message.includes('password')) {
              errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
            } else {
              errorMessage = error.message;
            }
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      // 로그아웃
      signOut: async () => {
        set({ isLoading: true });

        try {
          if (isSupabaseConfigured) {
            const { error } = await supabase.auth.signOut();
            if (error) {
              throw error;
            }
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            syncInfo: {
              enabled: false,
              pendingChanges: 0,
              status: 'offline',
            },
          });

          console.log('[AuthStore] 로그아웃 완료');
        } catch (error) {
          console.error('[AuthStore] 로그아웃 실패:', error);
          set({ isLoading: false });
        }
      },

      // 세션 확인
      checkSession: async () => {
        if (!isSupabaseConfigured) {
          set({
            user: null,
            isAuthenticated: false,
          });
          return;
        }

        set({ isLoading: true });

        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            throw error;
          }

          const user = sessionToUser(session);

          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } catch (error) {
          console.error('[AuthStore] 세션 확인 실패:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // 동기화 상태 업데이트
      updateSyncStatus: (status) => {
        set((state) => ({
          syncInfo: {
            ...state.syncInfo,
            status,
          },
        }));
      },

      // 동기화 활성화/비활성화
      setSyncEnabled: (enabled) => {
        set((state) => ({
          syncInfo: {
            ...state.syncInfo,
            enabled,
            status: enabled ? 'syncing' : 'offline',
          },
        }));

        if (enabled) {
          get().syncNow();
        }
      },

      // 수동 동기화 (특정 프로젝트)
      syncNow: async (projectId?: string) => {
        const { isAuthenticated, user } = get();

        if (!isAuthenticated || !user) {
          console.log('[AuthStore] 동기화 스킵: 로그인 필요');
          return;
        }

        set((state) => ({
          syncInfo: { ...state.syncInfo, status: 'syncing' },
        }));

        try {
          // 동적 import로 순환 의존성 방지
          const { syncProject } = await import('@/services/syncService');

          if (projectId) {
            // 특정 프로젝트 동기화
            const result = await syncProject(projectId, user.id);

            if (result.success) {
              set((state) => ({
                syncInfo: {
                  ...state.syncInfo,
                  status: 'synced',
                  lastSyncedAt: result.syncedAt,
                  pendingChanges: 0,
                },
              }));
              console.log('[AuthStore] 프로젝트 동기화 완료:', projectId);
            } else if (result.conflicts && result.conflicts.length > 0) {
              set((state) => ({
                syncInfo: { ...state.syncInfo, status: 'conflict' },
              }));
              console.log('[AuthStore] 동기화 충돌 감지:', result.conflicts);
            } else {
              throw new Error(result.error);
            }
          } else {
            // 프로젝트 ID가 없으면 동기화 완료 표시만
            set((state) => ({
              syncInfo: {
                ...state.syncInfo,
                status: 'synced',
                lastSyncedAt: new Date(),
              },
            }));
          }
        } catch (error) {
          console.error('[AuthStore] 동기화 실패:', error);
          set((state) => ({
            syncInfo: { ...state.syncInfo, status: 'error' },
          }));
        }
      },

      // 에러 초기화
      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'AuthStore' }
  )
);
