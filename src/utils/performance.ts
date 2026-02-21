/**
 * 性能监控工具
 * 使用 PerformanceObserver 收集用户性能数据
 */

import type { PerformanceEvent } from '../types';

// ==================== 类型定义 ====================

/** 性能指标类型 */
export type PerformanceMetricType =
  | 'lcp'      // Largest Contentful Paint - 最大内容绘制
  | 'fid'      // First Input Delay - 首次输入延迟
  | 'cls'      // Cumulative Layout Shift - 累积布局偏移
  | 'fcp'      // First Contentful Paint - 首次内容绘制
  | 'ttfb';    // Time to First Byte - 首字节时间

/** 性能数据条目 */
export interface PerformanceEntry {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

/** 完整的性能报告 */
export interface PerformanceReport {
  // Web Vitals
  lcp?: PerformanceEntry;
  fid?: PerformanceEntry;
  cls?: PerformanceEntry;
  fcp?: PerformanceEntry;
  ttfb?: PerformanceEntry;
  
  // 额外信息
  url: string;
  timestamp: number;
  userAgent: string;
  
  // 自定义指标
  customMetrics?: Record<string, number>;
  
  // 导航类型
  navigationType?: PerformanceNavigationTiming['type'];
}

/** 上报回调函数类型 */
export type ReportCallback = (report: PerformanceReport) => void;

/** 性能监控配置 */
export interface PerformanceMonitorConfig {
  /** 是否启用监控 */
  enabled?: boolean;
  /** 上报阈值，只有超过阈值的才上报（可选）*/
  reportThreshold?: {
    lcp?: number;   // ms
    fid?: number;    // ms
    cls?: number;
  };
  /** 上报回调 */
  onReport?: ReportCallback;
  /** 是否在控制台输出调试信息 */
  debug?: boolean;
}

// ==================== 常量定义 ====================

/** Web Vitals 评级阈值（基于 Google 标准）*/
const RATING_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

// ==================== 工具函数 ====================

/**
 * 性能评级
 */
function getRating(metric: PerformanceMetricType, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = RATING_THRESHOLDS[metric];
  if (!threshold) return 'needs-improvement';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * 格式化性能数据
 */
function formatEntry(
  metricType: PerformanceMetricType,
  entry: PerformanceEntry
): PerformanceEntry {
  return {
    ...entry,
    rating: getRating(metricType, entry.value),
  };
}

// ==================== 性能监控类 ====================

class PerformanceMonitor {
  private config: Required<PerformanceMonitorConfig>;
  private report: PerformanceReport;
  private observers: PerformanceObserver[] = [];
  private isCollecting = false;
  private reportTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: PerformanceMonitorConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      reportThreshold: config.reportThreshold ?? {},
      onReport: config.onReport ?? (() => {}),
      debug: config.debug ?? false,
    };

    this.report = this.initReport();
  }

  /**
   * 初始化报告对象
   */
  private initReport(): PerformanceReport {
    return {
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      navigationType: performance.getEntriesByType('navigation')[0]?.type as PerformanceNavigationTiming['type'],
    };
  }

  /**
   * 检查是否支持 PerformanceObserver
   */
  private isSupported(): boolean {
    return typeof PerformanceObserver !== 'undefined';
  }

  /**
   * 调试输出
   */
  private debug(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[Performance]', ...args);
    }
  }

  /**
   * 创建并添加 PerformanceObserver
   */
  private createObserver(
    metricType: PerformanceMetricType,
    callback: (entry: PerformanceEntry) => void
  ): PerformanceObserver | null {
    if (!this.isSupported()) {
      this.debug(`PerformanceObserver 不支持 ${metricType}`);
      return null;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const metricEntry = entry as unknown as PerformanceEntry;
          callback(formatEntry(metricType, {
            name: metricEntry.name,
            value: metricEntry.value || (metricEntry as any).duration || 0,
            delta: metricEntry.delta,
            id: metricEntry.id,
          }));
        }
      });

      observer.observe({ type: metricType, buffered: true });
      this.observers.push(observer);
      this.debug(`已订阅 ${metricType} 指标`);

      return observer;
    } catch (error) {
      this.debug(`无法订阅 ${metricType}:`, error);
      return null;
    }
  }

  /**
   * 更新报告数据
   */
  private updateReport(metricType: PerformanceMetricType, entry: PerformanceEntry): void {
    const threshold = this.config.reportThreshold[metricType];
    
    // 如果设置了阈值，检查是否需要上报
    if (threshold !== undefined && entry.value < threshold) {
      this.debug(`${metricType} (${entry.value}ms) 低于阈值 ${threshold}ms，跳过`);
      return;
    }

    switch (metricType) {
      case 'lcp':
        this.report.lcp = entry;
        break;
      case 'fid':
        this.report.fid = entry;
        break;
      case 'cls':
        this.report.cls = entry;
        break;
      case 'fcp':
        this.report.fcp = entry;
        break;
      case 'ttfb':
        this.report.ttfb = entry;
        break;
    }

    this.debug(`${metricType}: ${entry.value.toFixed(2)} (${entry.rating})`);
  }

  /**
   * 上报性能数据
   */
  private submitReport(): void {
    if (this.reportTimeout) {
      clearTimeout(this.reportTimeout);
    }

    // 延迟上报，确保所有指标都已收集
    this.reportTimeout = setTimeout(() => {
      this.config.onReport(this.report);
      this.debug('性能报告已上报:', this.report);
    }, 1000);
  }

  /**
   * 开始收集性能数据
   */
  start(): void {
    if (this.isCollecting) {
      this.debug('性能监控已在运行中');
      return;
    }

    if (!this.config.enabled) {
      this.debug('性能监控已禁用');
      return;
    }

    if (!this.isSupported()) {
      this.debug('当前浏览器不支持 PerformanceObserver');
      return;
    }

    this.isCollecting = true;
    this.report = this.initReport();

    // 订阅各性能指标
    this.createObserver('lcp', (entry) => {
      this.updateReport('lcp', entry);
      // LCP 是最重要的指标，收集完成后可以考虑提前上报
      if (entry.rating === 'poor') {
        this.submitReport();
      }
    });

    this.createObserver('fid', (entry) => {
      this.updateReport('fid', entry);
    });

    this.createObserver('cls', (entry) => {
      this.updateReport('cls', entry);
    });

    this.createObserver('fcp', (entry) => {
      this.updateReport('fcp', entry);
    });

    this.createObserver('ttfb', (entry) => {
      this.updateReport('ttfb', entry);
    });

    // 定期上报（作为兜底）
    setTimeout(() => this.submitReport(), 5000);

    this.debug('性能监控已启动');
  }

  /**
   * 停止收集性能数据
   */
  stop(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers = [];
    this.isCollecting = false;
    this.debug('性能监控已停止');
  }

  /**
   * 手动上报当前数据
   */
  reportNow(): void {
    this.submitReport();
  }

  /**
   * 添加自定义性能指标
   */
  addCustomMetric(name: string, value: number): void {
    if (!this.report.customMetrics) {
      this.report.customMetrics = {};
    }
    this.report.customMetrics[name] = value;
    this.debug(`自定义指标 ${name}: ${value}`);
  }

  /**
   * 获取当前报告副本
   */
  getReport(): PerformanceReport {
    return { ...this.report };
  }
}

// ==================== 导出单例 ====================

let performanceMonitorInstance: PerformanceMonitor | null = null;

/**
 * 获取性能监控实例
 */
export function getPerformanceMonitor(config?: PerformanceMonitorConfig): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor(config);
  }
  return performanceMonitorInstance;
}

/**
 * 便捷函数：快速启动监控
 */
export function initPerformanceMonitoring(config?: PerformanceMonitorConfig): PerformanceMonitor {
  const monitor = new PerformanceMonitor(config);
  monitor.start();
  return monitor;
}

/**
 * 测量函数执行时间
 */
export function measureExecutionTime<T>(
  fn: () => T,
  metricName: string
): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const duration = performance.now() - start;
    performanceMonitorInstance?.addCustomMetric(metricName, duration);
    console.log(`[Performance] ${metricName}: ${duration.toFixed(2)}ms`);
  }
}

/**
 * 测量异步函数执行时间
 */
export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>,
  metricName: string
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    performanceMonitorInstance?.addCustomMetric(metricName, duration);
    console.log(`[Performance] ${metricName}: ${duration.toFixed(2)}ms`);
  }
}

// ==================== 导出类型 ====================

export { PerformanceMonitor };
