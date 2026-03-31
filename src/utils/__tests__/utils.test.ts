// src/utils/__tests__/utils.test.ts
// 工具函数单元测试

import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance, formatDuration } from '../index';

describe('calculateDistance - 球面距离计算', () => {
  it('应该正确计算两点之间的距离', () => {
    // 天安门到故宫的距离大约 1km
    const pos1 = { lng: 116.397428, lat: 39.90923 }; // 天安门
    const pos2 = { lng: 116.397428, lat: 39.916527 }; // 故宫

    const distance = calculateDistance(pos1, pos2);

    // 误差在 200 米以内
    expect(distance).toBeGreaterThan(700);
    expect(distance).toBeLessThan(1000);
  });

  it('相同点距离应该为 0', () => {
    const pos = { lng: 116.397428, lat: 39.90923 };

    const distance = calculateDistance(pos, pos);

    expect(distance).toBe(0);
  });

  it('应该正确计算较长距离', () => {
    // 北京到上海大约 1060km
    const beijing = { lng: 116.397428, lat: 39.90923 };
    const shanghai = { lng: 121.473658, lat: 31.230416 };

    const distance = calculateDistance(beijing, shanghai);

    // 误差在 50km 以内
    expect(distance).toBeGreaterThan(1000000);
    expect(distance).toBeLessThan(1150000);
  });

  it('应该处理经度跨越 180 度的情况', () => {
    const pos1 = { lng: 179, lat: 0 };
    const pos2 = { lng: -179, lat: 0 };

    const distance = calculateDistance(pos1, pos2);

    // 应该大约 200km 左右
    expect(distance).toBeGreaterThan(100000);
    expect(distance).toBeLessThan(300000);
  });
});

describe('formatDistance - 距离格式化', () => {
  it('小于 1000 米时应该显示米', () => {
    expect(formatDistance(500)).toBe('500 m');
    expect(formatDistance(100)).toBe('100 m');
    expect(formatDistance(999)).toBe('999 m');
  });

  it('大于等于 1000 米时应该显示公里', () => {
    expect(formatDistance(1000)).toBe('1.0 km');
    expect(formatDistance(1500)).toBe('1.5 km');
    expect(formatDistance(10000)).toBe('10.0 km');
  });

  it('应该保留一位小数', () => {
    expect(formatDistance(1234)).toBe('1.2 km');
    expect(formatDistance(1567)).toBe('1.6 km');
  });
});

describe('formatDuration - 时长格式化', () => {
  it('小于 1 小时应该只显示分钟', () => {
    expect(formatDuration(0)).toBe('0 分钟');
    expect(formatDuration(60)).toBe('1 分钟');
    expect(formatDuration(1800)).toBe('30 分钟');
    expect(formatDuration(3599)).toBe('59 分钟');
  });

  it('大于等于 1 小时应该显示小时和分钟', () => {
    expect(formatDuration(3600)).toBe('1 小时 0 分钟');
    expect(formatDuration(3660)).toBe('1 小时 1 分钟');
    expect(formatDuration(7200)).toBe('2 小时 0 分钟');
    expect(formatDuration(9000)).toBe('2 小时 30 分钟');
  });

  it('应该正确处理整小时', () => {
    expect(formatDuration(3600 * 5)).toBe('5 小时 0 分钟');
  });
});
