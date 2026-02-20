/**
 * 监控配置文件
 * 用于收集生产环境的错误和性能数据
 * 
 * 使用方法：
 * 1. 在阿里云 ARMS 控制台创建应用获取 PID
 * 2. 将 PID 配置到 .env.production 文件中
 * 3. 在 main.tsx 中调用 initMonitoring()
 */

import BrowserLogger from '@arms/js-sdk';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

/**
 * ARMS PID - 从环境变量获取
 * 替换为你在阿里云 ARMS 创建应用后获取的 PID
 * 格式: xxx@xxx
 */
const ARMS_PID = import.meta.env.VITE_ARMS_PID || '';

/**
 * 是否启用监控
 * 开发环境和生产环境都可以启用，只要有 PID
 */
const ENABLE_MONITORING = !!ARMS_PID;

// ARMS 实例
let armsInstance: any = null;

/**
 * 初始化监控系统
 * 只在生产环境且配置了 PID 时生效
 */
export function initMonitoring() {
  console.log('🔔 initMonitoring 开始执行...');
  console.log('📋 ENABLE_MONITORING:', ENABLE_MONITORING);
  console.log('📋 ARMS_PID:', ARMS_PID);
  
  if (!ENABLE_MONITORING) {
    console.log('🔍 监控未启用（请在 .env.local 中配置 VITE_ARMS_PID）');
    return;
  }

  console.log('🚀 阿里云 ARMS 监控系统已启动 (PID:', ARMS_PID, ')');

  // 初始化 ARMS
  try {
    armsInstance = BrowserLogger.singleton({
      pid: ARMS_PID,
      // 国内常用的 retcode 地址
      imgUrl: 'https://arms-retcode.aliyuncs.com/r.png?',
      // SPA 应用配置
      enableSPA: true,
      // 采样配置：1 表示 100% 采样
      sample: 1,
      // 自动发送 PV
      autoSendPv: true,
      // 上报资源数据（用于慢会话追踪）
      sendResource: false,
      // 设置应用类型
      appType: 'web',
      // 开启 API 性能追踪
      api: {
        enable: true,
        injectThreshold: 0,
        resources: [],
      },
      // 开启 js 错误追踪
      js: {
        enable: true,
        error: {
          ignore: [],
          sample: 1,
        },
      },
      // 开启资源加载错误追踪
      resource: {
        enable: true,
        ignore: [],
      },
      // 开启自定义错误
      custom: {
        enable: true,
      },
    });
    
    console.log('📡 ARMS SDK 实例已创建:', armsInstance);
  } catch (e) {
    console.error('❌ ARMS SDK 初始化失败:', e);
    return;
  }

  // 初始化 Web Vitals 监控
  initWebVitals();

  // 设置全局错误捕获
  setupErrorHandling();
}

/**
 * 初始化 Web Vitals 监控
 * 监控核心网页指标：LCP, INP, CLS 等
 */
function initWebVitals() {
  // 监控 FCP (First Contentful Paint)
  onFCP((metric) => {
    logMetric('FCP', metric);
  });

  // 监控 LCP (Largest Contentful Paint)
  onLCP((metric) => {
    logMetric('LCP', metric);
  });

  // 监控 INP (Interaction to Next Paint) - 替代原来的 FID
  onINP((metric) => {
    logMetric('INP', metric);
  });

  // 监控 CLS (Cumulative Layout Shift)
  onCLS((metric) => {
    logMetric('CLS', metric);
  });

  // 监控 TTFB (Time to First Byte)
  onTTFB((metric) => {
    logMetric('TTFB', metric);
  });
}

/**
 * 上报指标数据到 ARMS
 */
function logMetric(name: string, metric: any) {
  const value = Math.round(metric.value);
  
  console.log(`📊 Web Vital - ${name}:`, value, metric.id);
  
  // 上报到 ARMS 作为自定义测速点
  if (armsInstance) {
    // 将指标名称映射到 ARMS 的 speed 点位
    const speedMap: Record<string, string> = {
      'FCP': 's0',
      'LCP': 's1',
      'INP': 's2',
      'CLS': 's3',
      'TTFB': 's4',
    };
    
    const speedPoint = speedMap[name];
    if (speedPoint) {
      armsInstance.speed(speedPoint, value);
    }
  }
}

/**
 * 设置全局错误捕获
 */
function setupErrorHandling() {
  console.log('🔧 开始设置全局错误捕获...');

  // 监听 JS 错误
  window.addEventListener('error', (event) => {
    console.log('⚠️ 捕获到 JS 错误:', event.error);
    // 避免重复上报（浏览器本身已经上报了一些错误）
    if (event.error && armsInstance) {
      console.log('📤 正在上报错误到 ARMS...');
      try {
        armsInstance.error(event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
        console.log('✅ 错误已上报');
      } catch (e) {
        console.error('❌ 错误上报失败:', e);
      }
    }
  });

  // 监听未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.log('⚠️ 捕获到 Promise 拒绝:', event.reason);
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    if (armsInstance) {
      console.log('📤 正在上报 Promise 错误到 ARMS...');
      try {
        armsInstance.error(error);
        console.log('✅ Promise 错误已上报');
      } catch (e) {
        console.error('❌ Promise 错误上报失败:', e);
      }
    }
  });
  
  console.log('✅ 全局错误捕获设置完成');
}

/**
 * 手动上报错误
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (!ENABLE_MONITORING) {
    console.error('Error (monitoring disabled):', error, context);
    return;
  }

  if (armsInstance) {
    console.log('📤 调用 armsInstance.error() 上报错误:', error.message);
    try {
      armsInstance.error(error);
      console.log('✅ armsInstance.error() 执行完成');
    } catch (e) {
      console.error('❌ armsInstance.error() 执行失败:', e);
    }
  } else {
    console.error('❌ armsInstance 未初始化');
  }
}

/**
 * 手动上报消息
 */
export function captureMessage(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  if (!ENABLE_MONITORING) {
    console.log(`[${level}]`, message);
    return;
  }

  // ARMS 没有直接的 message 上报，可以用 error 或者 sum 来代替
  if (level === 'error') {
    armsInstance?.error(new Error(message));
  }
}

/**
 * 设置用户信息
 */
export function setUser(user: { id: string; username?: string; email?: string } | null) {
  if (!ENABLE_MONITORING || !armsInstance) return;

  // ARMS 可以通过 setCommonInfo 设置公共信息
  armsInstance.setCommonInfo({
    uid: user?.id || '',
    username: user?.username || '',
  });
}

/**
 * 添加自定义事件统计
 */
export function addBreadcrumb(category: string, message: string, data?: Record<string, any>) {
  if (!ENABLE_MONITORING || !armsInstance) return;

  // ARMS 可以用 sum 方法来统计事件次数
  const eventKey = `${category}::${message}`;
  armsInstance.sum(eventKey, 1);
}

/**
 * 设置全局标签
 */
export function setTag(key: string, value: string) {
  if (!ENABLE_MONITORING || !armsInstance) return;

  armsInstance.setCommonInfo({ [key]: value });
}

/**
 * 性能监控 Hook
 * 用于在组件中监控特定操作的性能
 */
export function usePerformanceTracking() {
  return {
    captureError,
    captureMessage,
    setUser,
    addBreadcrumb,
    setTag,
  };
}

/**
 * 手动上报 API 调用情况
 */
export function reportApi(api: string, success: boolean, time: number, code?: string | number, msg?: string) {
  if (!ENABLE_MONITORING || !armsInstance) return;
  
  armsInstance.api(api, success, time, code, msg);
}

/**
 * 手动上报自定义测速点
 */
export function reportSpeed(point: string, time: number) {
  if (!ENABLE_MONITORING || !armsInstance) return;
  
  armsInstance.speed(point, time);
}

/**
 * 错误边界组件
 * 捕获子组件的错误并上报
 */
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class MonitoringErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 上报错误到 ARMS
    if (armsInstance) {
      armsInstance.error(error);
    }
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
