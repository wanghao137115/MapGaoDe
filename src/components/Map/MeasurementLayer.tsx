// src/components/Map/MeasurementLayer.tsx
// 测量层组件 - 支持距离测量和面积测量

import React, { useEffect, useRef, useState } from 'react';
import type { MapPosition } from '@/types';

interface MeasurementResult {
  id: string;
  type: 'distance' | 'area';
  value: number;
  unit: string;
  positions: MapPosition[];
}

interface MeasurementLayerProps {
  activeTool: 'none' | 'draw_circle' | 'draw_polygon' | 'measure_distance' | 'measure_area';
  measurements?: MeasurementResult[]; // 已完成的测量结果列表
  onMeasurementComplete?: (result: MeasurementResult) => void;
}

const MeasurementLayer: React.FC<MeasurementLayerProps> = ({
  activeTool,
  measurements = [],
  onMeasurementComplete
}) => {
  const [measurementPoints, setMeasurementPoints] = useState<MapPosition[]>([]);
  const [tempOverlays, setTempOverlays] = useState<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const measurementOverlaysRef = useRef<Map<string, any[]>>(new Map()); // 存储已完成的测量覆盖物

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

  // 处理已完成测量结果的渲染
  useEffect(() => {
    if (!mapReady) return;

    const map = (window as any).currentMap;
    const AMap = (window as any).AMap;

    // 获取当前测量结果ID
    const currentIds = new Set(measurements.map(m => m.id));
    const existingIds = new Set(measurementOverlaysRef.current.keys());

    // 找出需要删除的测量结果
    const toDelete = [...existingIds].filter(id => !currentIds.has(id));

    // 找出需要添加的测量结果
    const toAdd = measurements.filter(m => !existingIds.has(m.id));

    // 删除不需要的测量结果
    toDelete.forEach(id => {
      const overlays = measurementOverlaysRef.current.get(id);
      if (overlays && map) {
        overlays.forEach(overlay => {
          try {
            map.remove(overlay);
          } catch (error) {
            console.warn('Error removing measurement overlay:', error);
          }
        });
        measurementOverlaysRef.current.delete(id);
      }
    });

    // 添加新的测量结果
    toAdd.forEach(measurement => {
      const overlays: any[] = [];

      if (measurement.type === 'distance' && measurement.positions.length >= 2) {
        // 绘制距离测量线段
        for (let i = 0; i < measurement.positions.length - 1; i++) {
          const line = new AMap.Polyline({
            path: [
              [measurement.positions[i].lng, measurement.positions[i].lat],
              [measurement.positions[i + 1].lng, measurement.positions[i + 1].lat]
            ],
            strokeColor: '#fa8c16',
            strokeWeight: 3,
            strokeOpacity: 0.8,
            zIndex: 15
          });
          overlays.push(line);
        }

        // 添加距离标签
        const midPoint = measurement.positions[Math.floor(measurement.positions.length / 2)];
        const text = new AMap.Text({
          text: `${measurement.value.toFixed(2)} ${measurement.unit}`,
          position: [midPoint.lng, midPoint.lat],
          offset: new AMap.Pixel(0, -10),
          style: {
            backgroundColor: '#fff',
            border: '1px solid #fa8c16',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '12px',
            color: '#fa8c16'
          },
          zIndex: 16
        });
        overlays.push(text);

      } else if (measurement.type === 'area' && measurement.positions.length >= 3) {
        // 绘制面积测量多边形
        const path = measurement.positions.map(pos => [pos.lng, pos.lat]);
        const polygon = new AMap.Polygon({
          path: path,
          strokeColor: '#722ed1',
          strokeWeight: 2,
          strokeOpacity: 0.8,
          fillColor: '#722ed1',
          fillOpacity: 0.2,
          zIndex: 15
        });
        overlays.push(polygon);

        // 计算中心点位置
        const centerLng = measurement.positions.reduce((sum, pos) => sum + pos.lng, 0) / measurement.positions.length;
        const centerLat = measurement.positions.reduce((sum, pos) => sum + pos.lat, 0) / measurement.positions.length;

        // 添加面积标签
        const text = new AMap.Text({
          text: `${measurement.value.toFixed(2)} ${measurement.unit}`,
          position: [centerLng, centerLat],
          style: {
            backgroundColor: '#fff',
            border: '1px solid #722ed1',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '12px',
            color: '#722ed1'
          },
          zIndex: 16
        });
        overlays.push(text);
      }

      if (overlays.length > 0 && map) {
        map.add(overlays);
        measurementOverlaysRef.current.set(measurement.id, overlays);
      }
    });

    // 清理函数
    return () => {
      if (map) {
        measurementOverlaysRef.current.forEach(overlays => {
          overlays.forEach(overlay => {
            try {
              map.remove(overlay);
            } catch (error) {
              console.warn('Error removing overlay on cleanup:', error);
            }
          });
        });
        measurementOverlaysRef.current.clear();
      }
    };
  }, [measurements, mapReady]);

  // 清理临时覆盖物
  const clearTempOverlays = () => {
    const map = (window as any).currentMap;
    if (map && tempOverlays.length > 0 && typeof map.remove === 'function') {
      tempOverlays.forEach(overlay => {
        if (overlay) {
          try {
            map.remove(overlay);
          } catch (error) {
            console.warn('Error removing overlay:', error);
          }
        }
      });
      setTempOverlays([]);
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

  // 创建测量标记和线段
  const createMeasurementOverlay = (points: MapPosition[], type: 'distance' | 'area') => {
    const map = (window as any).currentMap;
    const AMap = (window as any).AMap;
    if (!map || !AMap) return [];

    const overlays: any[] = [];

    // 创建标记点
    points.forEach((point, index) => {
      const marker = new AMap.Marker({
        position: [point.lng, point.lat],
        content: `<div style="
          background: #1890ff;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">${index + 1}</div>`,
        offset: new AMap.Pixel(-12, -12),
      });
      map.add(marker);
      overlays.push(marker);
    });

    // 创建线段或多边形
    if (type === 'distance' && points.length >= 2) {
      // 距离测量：创建折线
      const polyline = new AMap.Polyline({
        path: points.map(p => [p.lng, p.lat]),
        strokeColor: '#ff4d4f',
        strokeWeight: 3,
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
      });
      map.add(polyline);
      overlays.push(polyline);

      // 添加距离标签
      if (points.length === 2) {
        const distance = calculateDistance(points[0], points[1]);
        const centerLng = (points[0].lng + points[1].lng) / 2;
        const centerLat = (points[0].lat + points[1].lat) / 2;

        const text = new AMap.Text({
          text: `${distance.toFixed(0)}m`,
          position: [centerLng, centerLat],
          style: {
            'background-color': 'rgba(255, 255, 255, 0.8)',
            'border': '1px solid #ccc',
            'padding': '2px 6px',
            'border-radius': '4px',
            'font-size': '12px',
            'color': '#333',
          },
          offset: new AMap.Pixel(0, -20),
        });
        map.add(text);
        overlays.push(text);
      }
    } else if (type === 'area' && points.length >= 3) {
      // 面积测量：创建多边形
      const polygon = new AMap.Polygon({
        path: points.map(p => [p.lng, p.lat]),
        strokeColor: '#faad14',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: '#faad14',
        fillOpacity: 0.1,
      });
      map.add(polygon);
      overlays.push(polygon);

      // 添加面积标签
      const area = calculateArea(points);
      const centerLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
      const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;

      const text = new AMap.Text({
        text: `${area.toFixed(0)}m²`,
        position: [centerLng, centerLat],
        style: {
          'background-color': 'rgba(255, 255, 255, 0.8)',
          'border': '1px solid #ccc',
          'padding': '2px 6px',
          'border-radius': '4px',
          'font-size': '12px',
          'color': '#333',
        },
      });
      map.add(text);
      overlays.push(text);
    }

    return overlays;
  };

  // 处理地图点击 - 距离测量
  useEffect(() => {
    if (!mapReady || activeTool !== 'measure_distance') {
      return;
    }

    const map = (window as any).currentMap;

    const handleMapClick = (e: any) => {
      const position: MapPosition = {
        lng: e.lnglat.lng,
        lat: e.lnglat.lat
      };

      const newPoints = [...measurementPoints, position];
      setMeasurementPoints(newPoints);

      // 清除之前的临时覆盖物
      clearTempOverlays();

      // 创建新的测量覆盖物
      const overlays = createMeasurementOverlay(newPoints, 'distance');
      setTempOverlays(overlays);

      // 如果已经有2个点，完成距离测量
      if (newPoints.length === 2) {
        const distance = calculateDistance(newPoints[0], newPoints[1]);

        const result: MeasurementResult = {
          id: `distance_${Date.now()}`,
          type: 'distance',
          value: distance,
          unit: '米',
          positions: newPoints,
        };

        onMeasurementComplete?.(result);
        setMeasurementPoints([]);
        setTempOverlays([]);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapReady, activeTool, measurementPoints, onMeasurementComplete]);

  // 处理地图点击 - 面积测量
  useEffect(() => {
    if (!mapReady || activeTool !== 'measure_area') {
      return;
    }

    const map = (window as any).currentMap;

    const handleMapClick = (e: any) => {
      const position: MapPosition = {
        lng: e.lnglat.lng,
        lat: e.lnglat.lat
      };

      const newPoints = [...measurementPoints, position];
      setMeasurementPoints(newPoints);

      // 清除之前的临时覆盖物
      clearTempOverlays();

      // 创建新的测量覆盖物
      const overlays = createMeasurementOverlay(newPoints, 'area');
      setTempOverlays(overlays);

      // 如果已经有3个点以上，可以完成面积测量（双击或右键完成）
      if (newPoints.length >= 3) {
        // 用户可以通过其他方式完成测量，比如双击或者切换工具
        // 这里暂时保持累积点，直到工具切换或其他条件
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapReady, activeTool, measurementPoints, onMeasurementComplete]);

  // 处理双击完成面积测量
  useEffect(() => {
    if (!mapReady || activeTool !== 'measure_area') {
      return;
    }

    const map = (window as any).currentMap;

    const handleDoubleClick = (e: any) => {
      if (measurementPoints.length >= 3) {
        const area = calculateArea(measurementPoints);

        const result: MeasurementResult = {
          id: `area_${Date.now()}`,
          type: 'area',
          value: area,
          unit: '平方米',
          positions: measurementPoints,
        };

        onMeasurementComplete?.(result);
        setMeasurementPoints([]);
        setTempOverlays([]);
      }
    };

    map.on('dblclick', handleDoubleClick);

    return () => {
      map.off('dblclick', handleDoubleClick);
    };
  }, [mapReady, activeTool, measurementPoints, onMeasurementComplete]);

  // 当工具改变时清理状态
  useEffect(() => {
    if (activeTool !== 'measure_distance' && activeTool !== 'measure_area') {
      setMeasurementPoints([]);
      clearTempOverlays();
    }
  }, [activeTool]);

  return null; // 不渲染任何DOM，只处理地图事件
};

export default MeasurementLayer;
