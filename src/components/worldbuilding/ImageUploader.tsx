/**
 * 이미지 업로더 컴포넌트
 *
 * 세계관 카드의 이미지를 업로드합니다.
 *
 * 기능:
 * - 드래그 앤 드롭
 * - 클릭하여 파일 선택
 * - 붙여넣기 (Ctrl+V)
 * - 미리보기
 * - 삭제
 * - 자동 리사이즈 (400x400)
 * - 2MB 제한
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib';

interface ImageUploaderProps {
  /** 현재 이미지 (Base64 또는 URL) */
  value?: string;
  /** 이미지 변경 시 호출 */
  onChange: (value: string | undefined) => void;
  /** 최대 파일 크기 (bytes), 기본 2MB */
  maxSize?: number;
  /** 썸네일 크기, 기본 400 */
  thumbnailSize?: number;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 클래스명 */
  className?: string;
}

// 아이콘 컴포넌트
const ImageIcon = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const DEFAULT_THUMBNAIL_SIZE = 400;

export function ImageUploader({
  value,
  onChange,
  maxSize = DEFAULT_MAX_SIZE,
  thumbnailSize = DEFAULT_THUMBNAIL_SIZE,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * 이미지 리사이즈 및 Base64 변환
   */
  const processImage = useCallback(
    async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        // 파일 크기 확인
        if (file.size > maxSize) {
          reject(
            new Error(
              `파일 크기가 ${Math.round(maxSize / 1024 / 1024)}MB를 초과합니다.`
            )
          );
          return;
        }

        // 이미지 타입 확인
        if (!file.type.startsWith('image/')) {
          reject(new Error('이미지 파일만 업로드할 수 있습니다.'));
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Canvas를 사용하여 리사이즈
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Canvas를 초기화할 수 없습니다.'));
              return;
            }

            // 비율 유지하면서 리사이즈
            let { width, height } = img;
            const maxDim = thumbnailSize;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = (height / width) * maxDim;
                width = maxDim;
              } else {
                width = (width / height) * maxDim;
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;

            // 이미지 그리기 (EXIF 회전은 브라우저가 자동 처리)
            ctx.drawImage(img, 0, 0, width, height);

            // Base64로 변환 (품질 0.9)
            const base64 = canvas.toDataURL('image/jpeg', 0.9);
            resolve(base64);
          };

          img.onerror = () => {
            reject(new Error('이미지를 로드할 수 없습니다.'));
          };

          img.src = e.target?.result as string;
        };

        reader.onerror = () => {
          reject(new Error('파일을 읽을 수 없습니다.'));
        };

        reader.readAsDataURL(file);
      });
    },
    [maxSize, thumbnailSize]
  );

  /**
   * 파일 처리
   */
  const handleFile = useCallback(
    async (file: File) => {
      if (disabled) return;

      setError(null);
      setIsProcessing(true);

      try {
        const base64 = await processImage(file);
        onChange(base64);
      } catch (err) {
        setError(err instanceof Error ? err.message : '이미지 처리에 실패했습니다.');
      } finally {
        setIsProcessing(false);
      }
    },
    [disabled, processImage, onChange]
  );

  /**
   * 파일 입력 변경
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // 같은 파일 다시 선택 가능하도록
    e.target.value = '';
  };

  /**
   * 드래그 이벤트 핸들러
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  /**
   * 클릭하여 파일 선택
   */
  const handleClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  /**
   * 이미지 삭제
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onChange(undefined);
      setError(null);
    }
  };

  /**
   * 붙여넣기 이벤트 핸들러
   */
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (disabled) return;

      // 포커스가 컨테이너에 있을 때만 처리
      if (!containerRef.current?.contains(document.activeElement)) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await handleFile(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [disabled, handleFile]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {value ? (
        // 이미지 미리보기
        <div className="relative aspect-square">
          <img
            src={value}
            alt="업로드된 이미지"
            className="h-full w-full rounded-lg object-cover"
          />
          {!disabled && (
            <button
              onClick={handleDelete}
              className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-md hover:bg-destructive/90"
              title="이미지 삭제"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      ) : (
        // 업로드 안내
        <div className="flex aspect-square cursor-pointer flex-col items-center justify-center p-4 text-center">
          {isProcessing ? (
            <>
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">처리 중...</p>
            </>
          ) : (
            <>
              <div className="mb-2 text-muted-foreground">
                <ImageIcon />
              </div>
              <p className="text-sm font-medium text-foreground">
                이미지 업로드
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                클릭, 드래그 또는 Ctrl+V
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                최대 {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-destructive/90 px-2 py-1 text-center text-xs text-destructive-foreground">
          {error}
        </div>
      )}
    </div>
  );
}
