// src/components/Map/DrawingLayer.tsx
// 绘制层组件 - 支持绘制圆形和多边形区域

import React, { useEffect, useRef, useState } from 'react';
import type { MapPosition } from '@/types';

interface DrawingObject {
  id: string;
  type: 'circle' | 'polygon';
  positions: MapPosition[];
  radius?: number;
  area?: number;
  perimeter?: number;
}

interface DrawingLayerProps {
  activeTool: 'none' | 'draw_circle' | 'draw_polygon' | 'measure_distance' | 'measure_area';
  drawingObjects?: DrawingObject[]; // 已绘制的对象列表
  onDrawingComplete?: (object: DrawingObject) => void;
}

const DrawingLayer: React.FC<DrawingLayerProps> = ({
  activeTool,
  drawingObjects = [],
  onDrawingComplete
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<MapPosition[]>([]);
  const [tempOverlay, setTempOverlay] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const drawnOverlaysRef = useRef<Map<string, any>>(new Map()); // 存储已绘制的覆盖物

  // 监听地图实例变化
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

  // 处理已绘制对象的渲染
  useEffect(() => {
    if (!mapReady) return;

    const map = (window as any).currentMap;
    const AMap = (window as any).AMap;

    // 获取当前已绘制的对象ID
    const currentIds = new Set(drawingObjects.map(obj => obj.id));
    const existingIds = new Set(drawnOverlaysRef.current.keys());

    // 找出需要删除的对象
    const toDelete = [...existingIds].filter(id => !currentIds.has(id));

    // 找出需要添加的对象
    const toAdd = drawingObjects.filter(obj => !existingIds.has(obj.id));

    // 删除不需要的对象
    toDelete.forEach(id => {
      const overlay = drawnOverlaysRef.current.get(id);
      if (overlay && map) {
        try {
          map.remove(overlay);
        } catch (error) {
          console.warn('Error removing drawing overlay:', error);
        }
        drawnOverlaysRef.current.delete(id);
      }
    });

    // 添加新的对象
    toAdd.forEach(obj => {
      let overlay = null;

      if (obj.type === 'circle' && obj.radius && obj.positions.length > 0) {
        // 绘制圆形
        overlay = new AMap.Circle({
          center: [obj.positions[0].lng, obj.positions[0].lat],
          radius: obj.radius,
          strokeColor: '#1890ff',
          strokeWeight: 2,
          strokeOpacity: 0.8,
          fillColor: '#1890ff',
          fillOpacity: 0.3,
          zIndex: 10
        });
      } else if (obj.type === 'polygon' && obj.positions.length > 2) {
        // 绘制多边形
        const path = obj.positions.map(pos => [pos.lng, pos.lat]);
        overlay = new AMap.Polygon({
          path: path,
          strokeColor: '#52c41a',
          strokeWeight: 2,
          strokeOpacity: 0.8,
          fillColor: '#52c41a',
          fillOpacity: 0.3,
          zIndex: 10
        });
      }

      if (overlay && map) {
        map.add(overlay);
        drawnOverlaysRef.current.set(obj.id, overlay);
      }
    });

    // 清理函数
    return () => {
      if (map) {
        drawnOverlaysRef.current.forEach(overlay => {
          try {
            map.remove(overlay);
          } catch (error) {
            console.warn('Error removing overlay on cleanup:', error);
          }
        });
        drawnOverlaysRef.current.clear();
      }
    };
  }, [drawingObjects, mapReady]);

  // 清理临时覆盖物
  const clearTempOverlay = () => {
    if (tempOverlay) {
      const map = (window as any).currentMap;
      if (map) {
        map.remove(tempOverlay);
      }
      setTempOverlay(null);
    }
  };

  // 计算两点间距离（米）
  const calculateDistance = (point1: MapPosition, point2: MapPosition): number => {
    const AMap = (window as any).AMap;
    if (!AMap) return 0;

    return AMap.GeometryUtil.distance(
      [point1.lng, point1.lat],
      [point2.lng, point2.lat]
    );
  };

  // 计算多边形面积（平方米）
  const calculateArea = (points: MapPosition[]): number => {
    const AMap = (window as any).AMap;
    if (!AMap || points.length < 3) return 0;

    const path = points.map(p => [p.lng, p.lat]);
    return Math.abs(AMap.GeometryUtil.ringArea(path));
  };

  // 处理地图点击
  useEffect(() => {
    if (!mapReady || !activeTool || activeTool === 'none' || activeTool === 'measure_distance') {
      return;
    }

    const map = (window as any).currentMap;
    const AMap = (window as any).AMap;

    const handleMapClick = (e: any) => {
      const position: MapPosition = {
        lng: e.lnglat.lng,
        lat: e.lnglat.lat
      };

      if (activeTool === 'draw_circle') {
        // 绘制圆形：第一个点为中心点，第二个点确定半径
        if (currentPoints.length === 0) {
          setCurrentPoints([position]);
          setIsDrawing(true);
        } else if (currentPoints.length === 1) {
          const center = currentPoints[0];
          const radius = calculateDistance(center, position);

          const drawingObject: DrawingObject = {
            id: `circle_${Date.now()}`,
            type: 'circle',
            positions: [center],
            radius: radius,
          };

          onDrawingComplete?.(drawingObject);
          setCurrentPoints([]);
          setIsDrawing(false);
          clearTempOverlay();
        }
      } else if (activeTool === 'draw_polygon') {
        // 绘制多边形：连续点击添加顶点，双击或点击第一个点完成
        const newPoints = [...currentPoints, position];
        setCurrentPoints(newPoints);

        if (newPoints.length >= 3) {
          // 更新临时多边形显示
          clearTempOverlay();
          const polygon = new AMap.Polygon({
            path: newPoints.map(p => [p.lng, p.lat]),
            strokeColor: '#1890ff',
            strokeWeight: 2,
            strokeOpacity: 0.8,
            fillColor: '#1890ff',
            fillOpacity: 0.1,
          });
          map.add(polygon);
          setTempOverlay(polygon);
        }

        setIsDrawing(true);
      }
    };

    const handleMapDblClick = (e: any) => {
      if (activeTool === 'draw_polygon' && currentPoints.length >= 3) {
        // 双击完成多边形绘制
        const area = calculateArea(currentPoints);

        const drawingObject: DrawingObject = {
          id: `polygon_${Date.now()}`,
          type: 'polygon',
          positions: currentPoints,
          area: area,
        };

        onDrawingComplete?.(drawingObject);
        setCurrentPoints([]);
        setIsDrawing(false);
        clearTempOverlay();
      }
    };

    const handleMapRightClick = (e: any) => {
      // DrawingLayer不处理测量功能
    };

    map.on('click', handleMapClick);
    map.on('dblclick', handleMapDblClick);
    map.on('rightclick', handleMapRightClick);

    return () => {
      map.off('click', handleMapClick);
      map.off('dblclick', handleMapDblClick);
      map.off('rightclick', handleMapRightClick);
      clearTempOverlay();
    };
  }, [mapReady, activeTool, currentPoints, onDrawingComplete]);

  // 当工具改变时清理状态
  useEffect(() => {
    if (activeTool === 'none') {
      setCurrentPoints([]);
      setIsDrawing(false);
      clearTempOverlay();
    }
  }, [activeTool]);

  return null; // 不渲染任何DOM，只处理地图事件
};

export default DrawingLayer;
