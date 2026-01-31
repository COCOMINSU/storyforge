/**
 * Tailwind CSS 클래스 병합 유틸리티
 *
 * clsx와 tailwind-merge를 조합하여 조건부 클래스 적용과
 * Tailwind 클래스 충돌 해결을 동시에 처리합니다.
 *
 * @example
 * // 기본 사용
 * cn('px-4 py-2', 'bg-blue-500')
 * // → 'px-4 py-2 bg-blue-500'
 *
 * // 조건부 클래스
 * cn('base-class', isActive && 'active-class')
 * // isActive가 true면 → 'base-class active-class'
 * // isActive가 false면 → 'base-class'
 *
 * // Tailwind 클래스 충돌 해결
 * cn('px-4', 'px-6')
 * // → 'px-6' (나중에 오는 클래스가 우선)
 *
 * // 객체 형태
 * cn({ 'text-red-500': hasError, 'text-green-500': isSuccess })
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 여러 클래스 값을 병합하고 Tailwind 충돌을 해결합니다.
 *
 * @param inputs - 병합할 클래스 값들 (문자열, 객체, 배열, 조건부 값)
 * @returns 병합되고 중복이 제거된 클래스 문자열
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
