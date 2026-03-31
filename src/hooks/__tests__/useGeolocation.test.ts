// src/hooks/__tests__/useGeolocation.test.ts
// useGeolocation Hook 单元测试

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGeolocation } from '../useGeolocation';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useGeolocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('无缓存时应该返回初始状态（loading=true）', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useGeolocation({ useCache: false }));

    expect(result.current.position).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('有缓存时应该使用缓存位置', () => {
    const cachedPosition = JSON.stringify({ lng: 116.3974, lat: 39.9093 });
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'map_gaode_user_position') return cachedPosition;
      if (key.includes('_timestamp')) return Date.now().toString();
      return null;
    });

    const { result } = renderHook(() => useGeolocation({ useCache: true }));

    // 有缓存时，loading 应该是 false（因为直接用缓存）
    expect(result.current.position).toEqual({ lng: 116.3974, lat: 39.9093 });
  });

  it('refetch 应该能手动刷新位置', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const mockPosition = {
      coords: {
        latitude: 39.9093,
        longitude: 116.3974,
        accuracy: 10,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useGeolocation({ useCache: false }));

    // 手动刷新
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.position).toEqual({
        lat: 39.9093,
        lng: 116.3974,
      });
      expect(result.current.error).toBeNull();
    });
  });

  it('获取位置失败但有缓存时应该使用缓存', async () => {
    // 先设置缓存
    const cachedPosition = JSON.stringify({ lng: 116.3974, lat: 39.9093 });
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'map_gaode_user_position') return cachedPosition;
      if (key.includes('_timestamp')) return Date.now().toString();
      return null;
    });

    const mockError = {
      code: 1,
      message: 'User denied geolocation',
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error?.(mockError);
    });

    const { result } = renderHook(() => useGeolocation({ useCache: true }));

    // 等待初始渲染完成
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 手动刷新，失败但有缓存
    result.current.refetch();

    await waitFor(() => {
      // 有缓存，应该继续使用缓存，不显示错误
      expect(result.current.position).toEqual({ lng: 116.3974, lat: 39.9093 });
      expect(result.current.error).toBeNull();
    });
  });

  it('无缓存且获取失败时应该返回错误', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const mockError = {
      code: 1,
      PERMISSION_DENIED: 1,
      message: 'User denied geolocation',
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error?.(mockError);
    });

    const { result } = renderHook(() => useGeolocation({ useCache: false }));

    // 等待初始请求完成
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('定位失败');
  });
});
