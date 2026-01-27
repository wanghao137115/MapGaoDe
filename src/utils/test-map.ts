// 地图工具函数 - 保留基础功能

import { loadAMap } from '@/services/map';

/**
 * 验证地图 API 是否可用（简化版）
 */
export async function validateMapAPI(): Promise<boolean> {
  try {
    await loadAMap();
    return !!(window as any).AMap;
  } catch {
    return false;
  }
}

/**
 * 创建临时的地图容器（用于开发调试）
 */
export function createTestContainer(): void {
  if (document.getElementById('test-map-container')) return;

  const container = document.createElement('div');
  container.id = 'test-map-container';
  Object.assign(container.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '300px',
    height: '200px',
    border: '2px solid #1890ff',
    borderRadius: '8px',
    zIndex: '9999',
    background: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  });

  const title = document.createElement('div');
  title.textContent = '🗺️ 地图测试容器';
  Object.assign(title.style, {
    padding: '8px',
    background: '#1890ff',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    borderRadius: '6px 6px 0 0'
  });

  const mapDiv = document.createElement('div');
  mapDiv.id = 'test-container';
  Object.assign(mapDiv.style, {
    width: '100%',
    height: 'calc(100% - 32px)',
    borderRadius: '0 0 6px 6px'
  });

  container.appendChild(title);
  container.appendChild(mapDiv);
  document.body.appendChild(container);
}

/**
 * 清理测试容器
 */
export function removeTestContainer(): void {
  const container = document.getElementById('test-map-container');
  if (container) {
    document.body.removeChild(container);
  }
}

// 开发环境下的全局工具
if (import.meta.env.DEV) {
  (window as any).mapUtils = {
    validateMapAPI,
    createTestContainer,
    removeTestContainer
  };
}

