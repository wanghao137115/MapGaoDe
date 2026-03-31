import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import 'antd/dist/reset.css';
import './styles/global.css';
import { initMonitoring, MonitoringErrorBoundary } from './monitoring';
import { globalUsageStats } from './hooks/useUsageStats';

// 初始化监控系统
initMonitoring();

// 暴露使用统计函数到全局
(window as any).getUsageStats = () => {
  const report = globalUsageStats.getReport();
  console.group('📊 使用统计数据报告');
  console.log('搜索统计:', {
    总搜索次数: report.searchCount,
    缓存命中: report.searchCacheHits,
    缓存命中率: report.cacheHitRate,
    平均响应时间: report.searchAvgResponseTime,
  });
  console.log('标记渲染:', {
    渲染次数: report.markerRenderCount,
    平均渲染时间: report.markerAvgTime,
  });
  console.log('路线规划:', {
    总次数: report.routePlanCount,
    成功率: report.routeSuccessRate,
  });
  console.log('用户行为:', {
    停留时长: `${Math.floor((report.pageStayDuration || 0) / 60)}分钟`,
    POI点击: report.poiDetailClickCount,
  });
  console.log('首屏性能:', {
    FCP: report.fcp,
    LCP: report.lcp,
  });
  console.groupEnd();
  return report;
};
console.log('📊 使用统计函数已可用: window.getUsageStats()');

// 暴露测试函数到全局，用于测试 ARMS 错误上报
if (import.meta.env.DEV) {
  // 导入手动上报函数
  import('./monitoring').then(({ captureError }) => {
    (window as any).testArmsError = () => {
      const error = new Error('测试ARMS错误上报 - ' + new Date().toISOString());
      console.log('📤 手动上报错误...');
      captureError(error);
      console.log('✅ 手动上报完成');
    };
    (window as any).testArmsPromiseError = () => {
      return Promise.reject(new Error('测试Promise错误上报 - ' + new Date().toISOString()));
    };
    console.log('🧪 ARMS 测试函数已可用: window.testArmsError() | window.testArmsPromiseError()');
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MonitoringErrorBoundary>
      <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
        <AntdApp>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    </MonitoringErrorBoundary>
  </React.StrictMode>,
);