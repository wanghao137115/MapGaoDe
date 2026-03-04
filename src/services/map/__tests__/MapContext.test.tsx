// src/services/map/__tests__/MapContext.test.tsx
// MapContext 组件测试

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { MapProvider, useMapContext, useMapReady } from '../MapContext';
import { mapManager } from '../MapManager';

// Mock loadAMap
vi.mock('../index', () => ({
  loadAMap: vi.fn().mockResolvedValue('success'),
  MapLoadStatus: {
    SUCCESS: 'success',
    MISSING_KEY: 'missing_key',
    FAILED: 'failed',
  },
}));

describe('MapContext', () => {
  beforeEach(() => {
    mapManager.destroyAll();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mapManager.destroyAll();
  });

  describe('MapProvider', () => {
    it('autoLoad=false 时初始状态应该是 not loading', async () => {
      const { result } = renderHook(() => useMapContext(), {
        wrapper: ({ children }) => (
          <MapProvider autoLoad={false}>{children}</MapProvider>
        ),
      });

      // autoLoad=false 时，isLoading 应该是 false，isReady 也是 false
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isReady).toBe(false);
      expect(result.current.map).toBeNull();
    });

    it('应该提供正确的上下文值', async () => {
      const { result } = renderHook(() => useMapContext(), {
        wrapper: ({ children }) => (
          <MapProvider autoLoad={true}>{children}</MapProvider>
        ),
      });

      // 等待加载完成
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 验证上下文方法存在
      expect(result.current.createMap).toBeDefined();
      expect(result.current.destroyMap).toBeDefined();
      expect(result.current.setCenter).toBeDefined();
      expect(result.current.setZoom).toBeDefined();
    });
  });

  describe('useMapReady', () => {
    it('autoLoad=false 时地图未就绪应该返回 false', async () => {
      const { result } = renderHook(() => useMapReady(), {
        wrapper: ({ children }) => (
          <MapProvider autoLoad={false}>{children}</MapProvider>
        ),
      });

      // autoLoad=false 时，isReady 应该是 false
      expect(result.current).toBe(false);
    });
  });

  describe('错误边界', () => {
    it('在 Provider 外使用 useMapContext 应该抛出错误', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useMapContext());
      }).toThrow('useMapContext 必须在 MapProvider 内使用');

      consoleError.mockRestore();
    });
  });
});
