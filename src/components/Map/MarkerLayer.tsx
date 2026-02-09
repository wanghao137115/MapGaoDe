import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import type { Marker } from "@/types";
import type { MarkerUpdate, IconConfig } from "@/workers/MarkerWorker";

// ==================== 配置 ====================

/** 智能节流：用户交互时暂停更新的时间（毫秒） */
const INTERACTION_PAUSE_MS = 800;
/** 智能节流：正常情况下的最小更新间隔（毫秒） */
const NORMAL_THROTTLE_MS = 500;
/** 强制更新：即使暂停也要更新的间隔（毫秒） */
const FORCE_UPDATE_MS = 3000;
/** 车辆动画持续时间（毫秒） */
const VEHICLE_ANIMATION_DURATION = 800;
/** 车辆动画缓动函数 */
const VEHICLE_EASING = 'easeInOutCubic' as const;

// ==================== 类型定义 ====================

interface MarkerLayerProps {
    markers: Marker[];
    onMarkerClick?: (marker: Marker) => void;
  onMarkerDragEnd?: (
    marker: Marker,
    newPosition: { lng: number; lat: number },
  ) => void;
}

// ==================== 辅助函数 ====================

/** 根据 Worker 返回的图标配置创建 AMap.Icon */
function createIconFromConfig(config: IconConfig, AMap: any) {
  if (config.size === 0) return null;

  if (config.type === 'star') {
    // 特殊星号图标
    return new AMap.Icon({
      image: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#1890ff" stroke="white" stroke-width="2"/>
          <text x="16" y="22" text-anchor="middle" fill="white" font-size="20" font-weight="bold">★</text>
        </svg>
      `),
      size: new AMap.Size(32, 32),
      imageSize: new AMap.Size(32, 32),
    });
  }

  return new AMap.Icon({
    image: config.url,
    size: new AMap.Size(config.size, config.size === 40 ? 40 : 31),
    imageSize: new AMap.Size(config.size, config.size === 40 ? 40 : 31),
  });
}

/** 获取 label 内容 */
function createLabelContent(labelText: string | undefined): any {
  if (!labelText) return null;

  return {
    direction: 'top',
    offset: new (window as any).AMap.Pixel(0, -28),
    content: `<div style="
      padding: 2px 6px;
      background: rgba(0,0,0,0.72);
      color: #fff;
      border-radius: 10px;
      font-size: 12px;
      line-height: 18px;
      white-space: nowrap;
      box-shadow: 0 6px 14px rgba(0,0,0,0.18);
    ">${String(labelText).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`,
  };
}

// ==================== 组件实现 ====================

const MarkerLayer: React.FC<MarkerLayerProps> = ({
    markers,
    onMarkerClick,
    onMarkerDragEnd,
  }) => {
  // 标记实例缓存
    const markersRef = useRef<{ [key: string]: any }>({});
  // 上一帧位置缓存（用于 Worker 计算）
  const lastPositionsRef = useRef<Record<string, { lng: number; lat: number }>>({});
  // Worker 实例
  const workerRef = useRef<Worker | null>(null);
  // 动画 Worker 实例
  const animationWorkerRef = useRef<Worker | null>(null);
  // 正在动画中的车辆
  const animatingVehiclesRef = useRef<Set<string>>(new Set());
  // 待处理的更新（用户交互期间缓存）
  const pendingUpdateRef = useRef<Marker[] | null>(null);
  // 上次更新时间
  const lastUpdateTimeRef = useRef<number>(0);
  // 交互状态
  const isInteractingRef = useRef(false);
  // 最后一次强制更新时间
  const lastForceUpdateRef = useRef<number>(0);
  // 地图就绪状态
  const [mapReady, setMapReady] = useState(false);

  // ==================== Worker 初始化 ====================

  useEffect(() => {
    // 创建 Worker
    const worker = new Worker(
      new URL('@/workers/MarkerWorker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event: MessageEvent<{ updates: MarkerUpdate[], timestamp: number }>) => {
      const { updates, timestamp } = event.data;
      const AMap = (window as any).AMap;
      const map = (window as any).currentMap;

      // 调试日志
      const vehicleUpdates = updates.filter((u: MarkerUpdate) => u.type === 'vehicle');


      if (!AMap || !map) return;

      // 应用更新
      const now = Date.now();

      updates.forEach(update => {
        // 调试日志

        const existingMarker = markersRef.current[update.id];

        if (update.isDeleted) {
          // 删除标记
          if (existingMarker) {
            try {
              map.remove(existingMarker);
            } catch (e) {
              console.warn('Error removing marker:', e);
            }
            delete markersRef.current[update.id];
          }
          // 从位置缓存中移除
          delete lastPositionsRef.current[update.id];
          return;
        }

        if (update.isNew) {
          // 新增标记
          const icon = createIconFromConfig(update.iconConfig, AMap);
          if (!icon) return;

          const mapMarker = new AMap.Marker({
            position: update.position,
            title: update.title,
            icon,
            draggable: true,
            cursor: "pointer",
          });

          // 设置 label
          const labelContent = createLabelContent(update.labelText);
          if (labelContent) {
            mapMarker.setLabel(labelContent);
          }

          // 绑定事件
          // eslint-disable-next-line prefer-destructuring
          const markerData = markers.find(m => m.id === update.id);
          mapMarker.on("click", () => {
            if (markerData) onMarkerClick?.(markerData);
          });

          mapMarker.on("dragend", (e: any) => {
            const { lng, lat } = e.lnglat;
            if (markerData) {
              onMarkerDragEnd?.(markerData, { lng, lat });
            }
          });

          try {
            map.add(mapMarker);
          } catch (e) {
            console.warn('Error adding marker:', e);
          }

          markersRef.current[update.id] = mapMarker;

          // 如果是车辆，标记为正在动画（避免首次更新不处理）
          if (update.type === 'vehicle') {
            animatingVehiclesRef.current.add(update.id);

          }
        }

        // 调试：检查为什么没进入 existingMarker 分支
        if (!update.isDeleted && !update.isNew && update.type === 'vehicle') {
          const exists = !!markersRef.current[update.id];
          if (!exists) {
            console.warn(`[MarkerLayer] 车辆 ${update.id} 有更新但找不到 existingMarker!`);
          }
        }

        if (existingMarker) {
          // 更新现有标记
          // 更新图标
          const currentIcon = existingMarker.getIcon();
          const newIcon = createIconFromConfig(update.iconConfig, AMap);

          if (newIcon && JSON.stringify(currentIcon?.image) !== JSON.stringify(newIcon?.image)) {
            existingMarker.setIcon(newIcon);
          }

          // 更新位置（车辆使用贝塞尔动画，普通标记直接更新）
          let currentPos = existingMarker.getPosition();
          let currentLng = currentPos?.[0];
          let currentLat = currentPos?.[1];

          // 如果 getPosition() 返回 undefined，使用缓存的当前位置
          if (currentLng === undefined || currentLat === undefined) {
            const cachedPos = lastPositionsRef.current[update.id];
            if (cachedPos) {
              currentLng = cachedPos.lng;
              currentLat = cachedPos.lat;

            }
          }

          const isPositionValid =
            typeof currentLng === 'number' &&
            typeof currentLat === 'number' &&
            !Number.isNaN(currentLng) &&
            !Number.isNaN(currentLat);

          const hasPositionChange = currentLng !== update.position[0] || currentLat !== update.position[1];
          const isVehicle = update.type === 'vehicle';



          if (isPositionValid && hasPositionChange) {

            if (isVehicle && animationWorkerRef.current) {
              // 车辆：启动贝塞尔平滑动画
              const vehicleId = update.id;
              const isAnimating = animatingVehiclesRef.current.has(vehicleId);


              // 如果已经在动画中，更新目标点（连续动画）
              if (isAnimating) {
                animationWorkerRef.current.postMessage({
                  type: 'UPDATE_ANIMATION_TARGET',
                  vehicleId,
                  to: { lng: update.position[0], lat: update.position[1] },
                });
              } else {
                // 没有动画，首次启动
                animatingVehiclesRef.current.add(vehicleId);
                animationWorkerRef.current.postMessage({
                  type: 'START_ANIMATION',
                  vehicleId,
                  from: { lng: currentLng, lat: currentLat },
                  to: { lng: update.position[0], lat: update.position[1] },
                  duration: VEHICLE_ANIMATION_DURATION,
                  easing: VEHICLE_EASING,
                });
              }
            } else {
              // 普通标记：直接更新
              existingMarker.setPosition(update.position);
            }
          } else if (!isPositionValid) {
            // 位置无效，直接设置目标位置
            existingMarker.setPosition(update.position);
          }

          // 更新标题
          existingMarker.setTitle(update.title);

          // 更新 label
          const labelContent = createLabelContent(update.labelText);
          try {
            if (labelContent) {
              existingMarker.setLabel(labelContent);
            } else {
              existingMarker.setLabel(null);
            }
          } catch (e) {
            // ignore
          }
        }

        // 更新位置缓存
        lastPositionsRef.current[update.id] = {
          lng: update.position[0],
          lat: update.position[1],
        };
      });

      // 标记已删除的更新
      const deletedIds = updates.filter(u => u.isDeleted).map(u => u.id);
      deletedIds.forEach(id => {
        delete lastPositionsRef.current[id];
      });

      lastUpdateTimeRef.current = now;

      // eslint-disable-next-line no-console
      console.debug(`[MarkerLayer] 应用 ${updates.length} 个更新，耗时: ${Date.now() - timestamp}ms`);
    };

    workerRef.current = worker;

    // ==================== 动画 Worker 初始化 ====================
    const animWorker = new Worker(
      new URL('@/workers/AnimationWorker.ts', import.meta.url),
      { type: 'module' }
    );

    animWorker.onmessage = (event: MessageEvent<{
      type: 'ANIMATION_FRAME' | 'ANIMATION_END';
      vehicleId: string;
      position?: { lng: number; lat: number };
      progress?: number;
      finalPosition?: { lng: number; lat: number };
    }>) => {
      const { type, vehicleId, position } = event.data;
      const AMap = (window as any).AMap;
      const map = (window as any).currentMap;

      if (!AMap || !map) return;

      const marker = markersRef.current[vehicleId];
      if (!marker) return;

      if (type === 'ANIMATION_FRAME' && position) {
        // 动画帧：平滑更新位置
        marker.setPosition([position.lng, position.lat]);
      } else if (type === 'ANIMATION_END') {
        // 动画结束：清理状态
        animatingVehiclesRef.current.delete(vehicleId);
        if (event.data.finalPosition) {
          marker.setPosition([event.data.finalPosition.lng, event.data.finalPosition.lat]);
        }
      }
    };

    animationWorkerRef.current = animWorker;

    return () => {
      worker.terminate();
      animWorker.terminate();
      workerRef.current = null;
      animationWorkerRef.current = null;
    };
  }, [onMarkerClick, onMarkerDragEnd]);

  // ==================== 地图就绪检查 ====================

  useEffect(() => {
    const checkMapReady = () => {
      if ((window as any).currentMap && (window as any).AMap) {
        setMapReady(true);
      } else {
        setMapReady(false);
      }
    };

    checkMapReady();
    const interval = setInterval(checkMapReady, 100);

    return () => clearInterval(interval);
  }, []);

  // ==================== 智能节流 + 交互检测 ====================

  useEffect(() => {
    if (!mapReady || !workerRef.current) return;

        const AMap = (window as any).AMap;
        const map = (window as any).currentMap;
    if (!AMap || !map) return;

    const now = Date.now();

    // 如果用户正在交互，缓存数据但不立即处理
    if (isInteractingRef.current) {
      // 检查是否需要强制更新（避免数据过于陈旧）
      if (now - lastForceUpdateRef.current > FORCE_UPDATE_MS) {
        // 强制更新一次
        lastForceUpdateRef.current = now;
        workerRef.current.postMessage({
          type: 'UPDATE',
          markers,
          lastPositions: lastPositionsRef.current,
        });
      } else {
        pendingUpdateRef.current = markers;
      }
      return;
    }

    // 正常情况：检查节流
    if (now - lastUpdateTimeRef.current < NORMAL_THROTTLE_MS) {
      // 还在节流窗口内，缓存但不处理
      pendingUpdateRef.current = markers;
      return;
    }

    // 发送数据到 Worker 处理
    workerRef.current.postMessage({
      type: 'UPDATE',
      markers,
      lastPositions: lastPositionsRef.current,
    });
    // eslint-disable-next-line no-console

  }, [markers, mapReady]);

  // ==================== 交互监听 ====================

  useEffect(() => {
    if (!mapReady) return;

    const map = (window as any).currentMap;
    if (!map) return;

    // 拖拽开始
    const onDragStart = () => {
      isInteractingRef.current = true;
    };

    // 拖拽/缩放结束：延迟处理更新
    const onInteractionEnd = () => {
      isInteractingRef.current = false;

      // 延迟一段时间后处理挂起的更新
      setTimeout(() => {
        const now = Date.now();
        lastForceUpdateRef.current = now;

        if (pendingUpdateRef.current && workerRef.current) {
          workerRef.current.postMessage({
            type: 'UPDATE',
            markers: pendingUpdateRef.current,
            lastPositions: lastPositionsRef.current,
          });
          pendingUpdateRef.current = null;
        }
      }, INTERACTION_PAUSE_MS);
    };

    // 绑定事件
    map.on?.('dragstart', onDragStart);
    map.on?.('dragend', onInteractionEnd);
    map.on?.('zoomstart', onDragStart);
    map.on?.('zoomend', onInteractionEnd);

    return () => {
      map.off?.('dragstart', onDragStart);
      map.off?.('dragend', onInteractionEnd);
      map.off?.('zoomstart', onDragStart);
      map.off?.('zoomend', onInteractionEnd);
    };
  }, [mapReady]);

  // ==================== 清理 ====================

  useEffect(() => {
    return () => {
      // 停止所有动画
      animatingVehiclesRef.current.forEach((vehicleId) => {
        animationWorkerRef.current?.postMessage({
          type: 'STOP_ANIMATION',
          vehicleId,
        });
      });
      animatingVehiclesRef.current.clear();

      // 清理地图标记
      const map = (window as any).currentMap;
        Object.values(markersRef.current).forEach((marker: any) => {
        if (marker && map && typeof map.remove === 'function') {
                try {
            map.remove(marker);
                } catch (error) {
                    console.warn('Error removing marker on cleanup:', error);
                }
            }
        });
        markersRef.current = {};
      lastPositionsRef.current = {};
    };
  }, []);

  // MarkerLayer 不渲染任何 DOM 元素，只负责管理标记
    return null;
};

// 使用 React.memo 进行性能优化
const MemoizedMarkerLayer = memo(MarkerLayer);
MemoizedMarkerLayer.displayName = 'MarkerLayer';

export default MemoizedMarkerLayer;
