// src/hooks/__tests__/useGeolocation.test.ts
// useGeolocation Hook 单元测试

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('useGeolocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.position).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful geolocation', async () => {
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

    const { result } = renderHook(() => useGeolocation());

    // Trigger geolocation
    result.current.getCurrentPosition();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.position).toEqual({
        lat: 39.9093,
        lng: 116.3974,
      });
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle geolocation error', async () => {
    const mockError = {
      code: 1,
      message: 'User denied geolocation',
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error?.(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    // Trigger geolocation
    result.current.getCurrentPosition();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.position).toBeNull();
      expect(result.current.error).toBe('User denied geolocation');
    });
  });
});
