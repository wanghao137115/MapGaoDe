/**
 * usePerformance Hook
 * 在 React 组件中使用性能监控
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  PerformanceMonitor,
  PerformanceReport,
  PerformanceMonitorConfig,
  getPerformanceMonitor,
  measureExecutionTime,
  measureAsyncExecutionTime,
} from '../utils/performance';

interface UsePerformanceOptions extends PerformanceMonitorConfig {
  /** 是否自动启动监控 */
  autoStart?: boolean;
}

interface UsePerformanceReturn {
  /** 性能报告数据 */
  report: PerformanceReport | null;
  /** 是否正在监控 */
  isMonitoring: boolean;
  /** 启动监控 */
  start: () => void;
  /** 停止监控 */
  stop: () => void;
  /** 手动上报 */
  reportNow: () => void;
  /** 测量同步函数执行时间 */
  measure: <T>(fn: () => T, metricName: string) => T;
  /** 测量异步函数执行时间 */
  measureAsync: <T>(fn: () => Promise<T>, metricName: string) => Promise<T>;
}

/**
 * 使用性能监控的 Hook
 * 
 * @example
 * ```tsx
 * const { report, isMonitoring, start, stop } = usePerformance({
 *   debug: true,
 *   onReport: (report) => {
 *     // 上报到服务器
 *     console.log('性能报告:', report);
 *   }
 * });
 * ```
 */
export function usePerformance(options: UsePerformanceOptions = {}): UsePerformanceReturn {
  const { autoStart = true, ...config } = options;
  
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // 初始化监控器
  useEffect(() => {
    monitorRef.current = getPerformanceMonitor({
      ...config,
      onReport: (report) => {
        setReport(report);
        config.onReport?.(report);
      },
    });

    if (autoStart) {
      monitorRef.current.start();
      setIsMonitoring(true);
    }

    return () => {
      monitorRef.current?.stop();
    };
  }, []);

  // 启动监控
  const start = useCallback(() => {
    monitorRef.current?.start();
    setIsMonitoring(true);
  }, []);

  // 停止监控
  const stop = useCallback(() => {
    monitorRef.current?.stop();
    setIsMonitoring(false);
  }, []);

  // 手动上报
  const reportNow = useCallback(() => {
    monitorRef.current?.reportNow();
  }, []);

  // 测量同步函数
  const measure = useCallback(<T,>(fn: () => T, metricName: string): T => {
    const monitor = monitorRef.current;
    if (!monitor) {
      return fn();
    }
    
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      monitor.addCustomMetric(metricName, duration);
    }
  }, []);

  // 测量异步函数
  const measureAsync = useCallback(async <T,>(fn: () => Promise<T>, metricName: string): Promise<T> => {
    const monitor = monitorRef.current;
    if (!monitor) {
      return fn();
    }
    
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      monitor.addCustomMetric(metricName, duration);
    }
  }, []);

  return {
    report,
    isMonitoring,
    start,
    stop,
    reportNow,
    measure,
    measureAsync,
  };
}

/**
 * 简化版 Hook - 只返回最新报告
 * 
 * @example
 * ```tsx
 * const report = usePerformanceReport({
 *   onReport: (report) => sendToServer(report)
 * });
 * ```
 */
export function usePerformanceReport(config?: PerformanceMonitorConfig & { autoStart?: boolean }) {
  const { report, isMonitoring, start, stop, reportNow } = usePerformance(config);
  return { report, isMonitoring, start, stop, reportNow };
}

export { measureExecutionTime, measureAsyncExecutionTime };
export type { PerformanceReport, PerformanceMonitorConfig };
