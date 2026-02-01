/**
 * API 키 설정 모달 컴포넌트
 *
 * 사용자가 여러 AI 제공자(Claude, GPT, Gemini)의 API 키를
 * 입력하고 관리할 수 있는 모달입니다.
 */

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Key, AlertCircle, CheckCircle, Loader2, Settings2 } from 'lucide-react';
import { useAIStore, useUIStore } from '@/stores';
import { PROVIDER_INFO, PROVIDER_MODELS } from '@/services/ai';
import { cn } from '@/lib/cn';
import type { AIProvider } from '@/types';

const PROVIDERS: AIProvider[] = ['anthropic', 'openai', 'google'];

/**
 * API 키 설정 모달
 */
export function APIKeyModal() {
  const {
    config,
    apiKeys,
    setAPIKey,
    clearAPIKey,
    setProvider,
    setConfig,
    hasProviderKey,
  } = useAIStore();
  const { closeModal } = useUIStore();

  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(config.provider);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const providerInfo = PROVIDER_INFO[selectedProvider];
  const providerModels = PROVIDER_MODELS[selectedProvider];
  const hasKey = hasProviderKey(selectedProvider);

  // 선택된 모델이 현재 제공자에 속하는지 확인
  const currentModelBelongsToProvider = providerModels.some(m => m.id === config.model);

  // 제공자 변경 시 상태 초기화
  useEffect(() => {
    setKeyInput('');
    setError(null);
    setSuccess(false);
  }, [selectedProvider]);

  /**
   * API 키 저장
   */
  const handleSave = async () => {
    if (!keyInput.trim()) {
      setError('API 키를 입력해주세요.');
      return;
    }

    // 기본 형식 검증
    if (!keyInput.startsWith(providerInfo.keyPrefix)) {
      setError(`유효한 ${providerInfo.name} API 키 형식이 아닙니다. (${providerInfo.keyPrefix}로 시작해야 합니다)`);
      return;
    }

    setIsValidating(true);
    setError(null);
    setSuccess(false);

    try {
      const isValid = await setAPIKey(keyInput.trim(), selectedProvider);

      if (isValid) {
        setSuccess(true);
        setKeyInput('');

        // 설정된 제공자를 현재 제공자로 선택
        if (selectedProvider !== config.provider) {
          setProvider(selectedProvider);
          // 해당 제공자의 첫 번째 모델 선택
          const firstModel = providerModels[0];
          if (firstModel) {
            setConfig({ model: firstModel.id });
          }
        }

        // 잠시 후 성공 상태 초기화
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
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
    if (window.confirm(`${providerInfo.name} API 키를 삭제하시겠습니까?\n해당 AI 기능을 사용하려면 다시 설정해야 합니다.`)) {
      clearAPIKey(selectedProvider);
      setSuccess(false);
      setError(null);
    }
  };

  /**
   * 현재 제공자로 설정
   */
  const handleSetAsDefault = () => {
    setProvider(selectedProvider);
    // 해당 제공자의 첫 번째 모델 선택
    const firstModel = providerModels[0];
    if (firstModel) {
      setConfig({ model: firstModel.id });
    }
  };

  /**
   * 모델 선택
   */
  const handleModelChange = (modelId: string) => {
    setConfig({ model: modelId as typeof config.model });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeModal}
      />

      {/* 모달 */}
      <div className="relative w-full max-w-lg mx-4 bg-background rounded-lg shadow-xl border border-border">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            AI 설정
          </h2>
          <button
            onClick={closeModal}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 제공자 탭 */}
        <div className="flex border-b border-border">
          {PROVIDERS.map((provider) => {
            const info = PROVIDER_INFO[provider];
            const isConfigured = !!apiKeys[provider];
            const isSelected = provider === selectedProvider;
            const isActive = provider === config.provider;

            return (
              <button
                key={provider}
                onClick={() => setSelectedProvider(provider)}
                className={cn(
                  'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                  isSelected
                    ? 'text-primary border-b-2 border-primary -mb-px'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  {info.name.split(' ')[0]}
                  {isConfigured && (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  )}
                  {isActive && !isConfigured && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* 컨텐츠 */}
        <div className="p-4 space-y-4">
          {/* 현재 상태 */}
          <div className={cn(
            'p-3 rounded-md text-sm flex items-center justify-between',
            hasKey
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
          )}>
            <span className="flex items-center gap-2">
              {hasKey ? (
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
            </span>
            {hasKey && selectedProvider !== config.provider && (
              <button
                onClick={handleSetAsDefault}
                className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              >
                기본으로 설정
              </button>
            )}
          </div>

          {/* 현재 사용 중 표시 */}
          {selectedProvider === config.provider && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              현재 사용 중인 제공자입니다.
            </div>
          )}

          {/* 입력 필드 */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              {hasKey ? '새 API 키로 변경' : 'API 키 입력'}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={providerInfo.keyPlaceholder}
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
              {providerInfo.description}에서 API 키를 발급받으세요.
              <a
                href={providerInfo.consoleUrl}
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

          {/* 모델 선택 (키가 설정된 경우) */}
          {hasKey && selectedProvider === config.provider && (
            <div className="space-y-2">
              <label className="text-sm font-medium">모델 선택</label>
              <select
                value={currentModelBelongsToProvider ? config.model : providerModels[0]?.id}
                onChange={(e) => handleModelChange(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 rounded-md',
                  'bg-background border border-input',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'text-sm'
                )}
              >
                {providerModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 안내 사항 */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
            <p>• API 키는 로컬에 저장됩니다.</p>
            <p>• API 사용료는 각 제공자에 직접 청구됩니다.</p>
            <p>• 키를 다른 사람과 공유하지 마세요.</p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          {hasKey ? (
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
              닫기
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
