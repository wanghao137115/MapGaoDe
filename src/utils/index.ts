// 地图相关工具函数

import type { MapPosition } from '@/types';

/**
 * 计算两点之间的距离（球面距离，单位：米）
 * @param pos1 第一个点
 * @param pos2 第二个点
 * @returns 距离（米）
 */
export function calculateDistance(pos1: MapPosition, pos2: MapPosition): number {
  const R = 6371000; // 地球半径（米）
  const dLat = toRadians(pos2.lat - pos1.lat);
  const dLng = toRadians(pos2.lng - pos1.lng);

  console.log('111')

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(pos1.lat)) * Math.cos(toRadians(pos2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 角度转弧度
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 格式化距离显示
 * @param meters 距离（米）
 * @returns 格式化字符串（如 "1.2 km" 或 "850 m"）
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * 格式化时长显示
 * @param seconds 时长（秒）
 * @returns 格式化字符串（如 "2 小时 30 分钟" 或 "45 分钟"）
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`;
  }
  return `${minutes} 分钟`;
}

// 其他通用工具（占位）
export const noop = () => {};