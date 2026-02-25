import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import 'antd/dist/reset.css';
import './styles/global.css';
import { initMonitoring, MonitoringErrorBoundary } from './monitoring';

// 初始化监控系统
  initMonitoring();

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