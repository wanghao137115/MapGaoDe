/**
 * Marker Worker - 处理标记的位置计算和图标生成
 * 
 * 功能：
 * 1. 计算标记位移（用于平滑动画）
 * 2. 预生成图标配置
 * 3. 计算聚类（准备扩展）
 * 
 * 使用方法：
 * const worker = new MarkerWorker();
 * worker.postMessage({ markers, lastPositions });
 * worker.onmessage = (e) => { updates = e.data; };
 */

import type { Marker, MapPosition } from '@/types';

// ==================== 类型定义 ====================

/** 标记更新数据 */
export interface MarkerUpdate {
  id: string;
  /** 是否新增 */
  isNew: boolean;
  /** 是否删除 */
  isDeleted: boolean;
  /** 新位置 */
  position: [number, number];
  /** 上一位置（用于计算位移） */
  lastPosition?: [number, number];
  /** 位移量（像素） */
  delta?: { dx: number; dy: number };
  /** 标记类型 */
  type: string;
  /** 图标配置 */
  iconConfig: IconConfig;
  /** 标题 */
  title: string;
  /** 标签文字 */
  labelText?: string;
}

/** 图标配置 */
export interface IconConfig {
  type: 'default' | 'custom' | 'star';
  url?: string;
  size: number;
  isSvg: boolean;
}

/** Worker 消息：发送标记数据 */
interface WorkerInput {
  type: 'UPDATE';
  markers: Marker[];
  lastPositions: Record<string, MapPosition>;
  mapZoom?: number;
  mapBounds?: {
    sw: MapPosition;
    ne: MapPosition;
  };
}

/** Worker 消息：返回计算结果 */
interface WorkerOutput {
  type: 'UPDATES';
  updates: MarkerUpdate[];
  timestamp: number;
}

// ==================== 辅助函数 ====================

/** 计算两个经纬度之间的距离（米） */
function haversineDistance(pos1: MapPosition, pos2: MapPosition): number {
  const R = 6371000; // 地球半径（米）
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLon = toRad(pos2.lng - pos1.lng);
  const lat1 = toRad(pos1.lat);
  const lat2 = toRad(pos2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * 经纬度转墨卡托坐标（简化版，用于计算位移）
 * 注意：这是近似计算，用于计算相对位移
 */
function toMercator(pos: MapPosition): { x: number; y: number } {
  const R = 20037508.34; // 地球周长的一半
  const x = (pos.lng + 180) / 360 * R;
  const y = (1 - Math.log(Math.tan((pos.lat + 90) * Math.PI / 360)) / Math.PI) / 2 * R;
  return { x, y };
}

/** 获取图标配置 */
function getIconConfig(marker: Marker): IconConfig {
  // 自定义图标
  if (marker.icon) {
    const isSvg = marker.icon.startsWith('data:image/svg+xml');
    const iconSize = isSvg ? 40 : 19;
    return {
      type: 'custom',
      url: marker.icon,
      size: iconSize,
      isSvg,
    };
  }

  // 默认图标
  switch (marker.type) {
    case 'store':
      return {
        type: 'default',
        url: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
        size: 19,
        isSvg: false,
      };
    case 'warehouse':
    case 'vehicle':
      return {
        type: 'default',
        url: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
        size: 19,
        isSvg: false,
      };
    case 'user':
      return {
        type: 'default',
        url: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_bs.png',
        size: 19,
        isSvg: false,
      };
    default:
      return {
        type: 'default',
        url: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_bs.png',
        size: 19,
        isSvg: false,
      };
  }
}

// ==================== 主处理逻辑 ====================

function processMarkers(
  markers: Marker[],
  lastPositions: Record<string, MapPosition>,
  mapZoom?: number,
  mapBounds?: { sw: MapPosition; ne: MapPosition }
): MarkerUpdate[] {
  const updates: MarkerUpdate[] = [];
  const lastIds = new Set(Object.keys(lastPositions));

  // 1. 遍历所有标记，分类处理
  markers.forEach(marker => {
    const currentPos = marker.position;
    const lastPos = lastPositions[marker.id];
    const iconConfig = getIconConfig(marker);

    // 计算位移（用于平滑动画）
    let delta: { dx: number; dy: number } | undefined;
    if (lastPos) {
      const currentMercator = toMercator(currentPos);
      const lastMercator = toMercator(lastPos);
      delta = {
        dx: currentMercator.x - lastMercator.x,
        dy: currentMercator.y - lastMercator.y,
      };
    }

    // 视口裁剪（如果在可视区域内才更新）
    if (mapBounds) {
      const { sw, ne } = mapBounds;
      if (currentPos.lng < sw.lng || currentPos.lng > ne.lng ||
        currentPos.lat < sw.lat || currentPos.lat > ne.lat) {
        // 标记在视口外，可以跳过或标记为隐藏
        // 这里先保留，等前端自己处理
      }
    }

    updates.push({
      id: marker.id,
      isNew: !lastIds.has(marker.id),
      isDeleted: false,
      position: [currentPos.lng, currentPos.lat],
      lastPosition: lastPos ? [lastPos.lng, lastPos.lat] : undefined,
      delta,
      type: marker.type,
      iconConfig,
      title: marker.title,
      labelText: marker.data?.labelText,
    });
  });

  // 2. 标记已删除的
  const markerIds = new Set(markers.map(m => m.id));
  Object.keys(lastPositions).forEach(id => {
    if (!markerIds.has(id)) {
      updates.push({
        id,
        isNew: false,
        isDeleted: true,
        position: [0, 0],
        type: 'deleted',
        iconConfig: { type: 'default', size: 0, isSvg: false },
        title: '',
      });
    }
  });

  return updates;
}

// ==================== Worker 消息处理 ====================

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const { type, markers, lastPositions, mapZoom, mapBounds } = event.data;

  if (type === 'UPDATE') {
    const startTime = performance.now();

    // 执行计算
    const updates = processMarkers(markers, lastPositions, mapZoom, mapBounds);

    const endTime = performance.now();
    // eslint-disable-next-line no-console
    console.debug(`[MarkerWorker] 处理 ${markers.length} 个标记耗时: ${(endTime - startTime).toFixed(2)}ms`);

    // 发送结果
    const output: WorkerOutput = {
      type: 'UPDATES',
      updates,
      timestamp: Date.now(),
    };

    self.postMessage(output);
  }
};

export {};
