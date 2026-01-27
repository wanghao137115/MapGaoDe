// src/test/setup.ts
// 测试环境设置文件

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展 expect 方法
expect.extend(matchers);

// 每次测试后清理
afterEach(() => {
  cleanup();
});

// Mock window.AMap
Object.defineProperty(window, 'AMap', {
  writable: true,
  value: {
    Map: vi.fn().mockImplementation(() => ({
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      getCenter: vi.fn(() => [116.3974, 39.9093]),
      getZoom: vi.fn(() => 10),
    })),
    Marker: vi.fn().mockImplementation(() => ({
      setPosition: vi.fn(),
      setIcon: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    })),
    Icon: vi.fn(),
    Size: vi.fn(),
    Pixel: vi.fn(),
    GeometryUtil: {
      distance: vi.fn(() => 1000),
      ringArea: vi.fn(() => 5000),
    },
  },
});

// Mock window.currentMap
Object.defineProperty(window, 'currentMap', {
  writable: true,
  value: null,
});

export {};
