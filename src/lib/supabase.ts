/**
 * Supabase 클라이언트
 *
 * Supabase 인증 및 데이터베이스 연동을 위한 클라이언트입니다.
 * 환경 변수에서 URL과 익명 키를 가져옵니다.
 *
 * @example
 * import { supabase } from '@/lib/supabase';
 *
 * // 인증
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password'
 * });
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase 연결 여부
 * 환경 변수가 설정되어 있으면 true
 */
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key';

/**
 * Supabase 클라이언트 인스턴스
 * 환경 변수가 설정되지 않은 경우 더미 URL로 생성 (오프라인 모드)
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'storyforge-auth',
    },
  }
);

/**
 * Supabase 연결 상태 확인
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  try {
    const { error } = await supabase.auth.getSession();
    return !error;
  } catch {
    return false;
  }
}

export default supabase;
