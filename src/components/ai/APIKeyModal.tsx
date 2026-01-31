/**
 * API 키 설정 모달 컴포넌트
 *
 * 사용자가 Claude API 키를 입력하고 관리할 수 있는 모달입니다.
 */

import { useState } from 'react';
import { X, Eye, EyeOff, Key, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAIStore, useUIStore } from '@/stores';
import { cn } from '@/lib/cn';

/**
 * API 키 설정 모달
 */
export function APIKeyModal() {
  const { apiKeySet, setAPIKey, clearAPIKey } = useAIStore();
  const { closeModal } = useUIStore();

  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * API 키 저장
   */
  const handleSave = async () => {
    if (!keyInput.trim()) {
      setError('API 키를 입력해주세요.');
      return;
    }

    // 기본 형식 검증
    if (!keyInput.startsWith('sk-ant-')) {
      setError('유효한 Claude API 키 형식이 아닙니다. (sk-ant-로 시작해야 합니다)');
      return;
    }

    setIsValidating(true);
    setError(null);
    setSuccess(false);

    try {
      const isValid = await setAPIKey(keyInput.trim());

      if (isValid) {
        setSuccess(true);
        setKeyInput('');
        // 잠시 후 모달 닫기
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setError('API 키 검증에 실패했습니다. 키가 올바른지 확인해주세요.');
      }
    } catch {
      setError('API 키 검증 중 오류가 발생했습니다.');
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * API 키 삭제
   */
  const handleDelete = () => {
    if (window.confirm('API 키를 삭제하시겠습니까?\nAI 기능을 사용하려면 다시 설정해야 합니다.')) {
      clearAPIKey();
      setSuccess(false);
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeModal}
      />

      {/* 모달 */}
      <div className="relative w-full max-w-md mx-4 bg-background rounded-lg shadow-xl border border-border">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5" />
            Claude API 키 설정
          </h2>
          <button
            onClick={closeModal}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-4 space-y-4">
          {/* 현재 상태 */}
          <div className={cn(
            'p-3 rounded-md text-sm flex items-center gap-2',
            apiKeySet
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
          )}>
            {apiKeySet ? (
              <>
                <CheckCircle className="w-4 h-4" />
                API 키가 설정되어 있습니다.
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                API 키가 설정되지 않았습니다.
              </>
            )}
          </div>

          {/* 입력 필드 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {apiKeySet ? '새 API 키로 변경' : 'API 키 입력'}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                className={cn(
                  'w-full px-3 py-2 pr-10 rounded-md',
                  'bg-background border border-input',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'text-sm font-mono'
                )}
                disabled={isValidating}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anthropic Console에서 API 키를 발급받으세요.
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                콘솔 바로가기 →
              </a>
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              API 키가 성공적으로 설정되었습니다!
            </div>
          )}

          {/* 안내 사항 */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• API 키는 로컬에 암호화되어 저장됩니다.</p>
            <p>• API 사용료는 Anthropic에 직접 청구됩니다.</p>
            <p>• 키를 다른 사람과 공유하지 마세요.</p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          {apiKeySet ? (
            <button
              onClick={handleDelete}
              className={cn(
                'px-4 py-2 text-sm rounded-md',
                'text-destructive hover:bg-destructive/10',
                'transition-colors'
              )}
            >
              키 삭제
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={closeModal}
              className={cn(
                'px-4 py-2 text-sm rounded-md',
                'border border-border',
                'hover:bg-accent',
                'transition-colors'
              )}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isValidating || !keyInput.trim()}
              className={cn(
                'px-4 py-2 text-sm rounded-md',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors',
                'flex items-center gap-2'
              )}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  검증 중...
                </>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
