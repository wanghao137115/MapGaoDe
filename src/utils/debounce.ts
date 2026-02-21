import React from 'react';

/**
 * 防抖函数 - 延迟执行，在等待时间内如果再次触发则重置计时器
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 节流函数 - 立即执行，然后等待指定时间后才能再次执行
 * @param fn 要执行的函数
 * @param delay 间隔时间（毫秒）
 * @returns 节流处理后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = delay - (now - lastTime);

    if (remaining <= 0) {
      // 可以立即执行
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      // 设置定时器在剩余时间后执行
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * 使用 useMemo 缓存防抖函数的 Hook
 * @param fn 要执行的函数
 * @param delay 延迟时间
 * @param deps 依赖数组
 * @returns 防抖处理后的函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => debounce(fn, delay), deps);
}

/**
 * 使用 useMemo 缓存节流函数的 Hook
 * @param fn 要执行的函数
 * @param delay 间隔时间
 * @param deps 依赖数组
 * @returns 节流处理后的函数
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => throttle(fn, delay), deps);
}
