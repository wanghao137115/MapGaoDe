/**
 * 热力图组件
 * 基于高德地图 HeatmapLayer 实现点位密度可视化
 * 支持多数据源切换、颜色渐变配置、半径配置
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';

export interface HeatmapDataPoint {
  lng: number;
  lat: number;
  count?: number; // 权重值，默认为 1
}

export interface HeatmapLayerProps {
  map: AMap.Map | null;
  data: HeatmapDataPoint[];
  visible: boolean;
  radius?: number; // 热力半径，默认 30
  gradient?: Record<number, string>; // 颜色渐变
  max?: number; // 最大权重值
  onLoad?: () => void;
  onError?: (error: string) => void;
}

// 默认颜色渐变（从蓝到红）
const DEFAULT_GRADIENT: Record<number, string> = {
  0.0: 'rgb(0,0,255)',
  0.2: 'rgb(0,255,255)',
  0.4: 'rgb(0,255,0)',
  0.6: 'rgb(255,255,0)',
  0.8: 'rgb(255,0,0)',
  1.0: 'rgb(255,0,255)',
};

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({
  map,
  data,
  visible,
  radius = 30,
  gradient = DEFAULT_GRADIENT,
  max,
  onLoad,
  onError,
}) => {
  const heatmapLayerRef = useRef<AMap.HeatmapLayer | null>(null);

  // 初始化热力图层
  useEffect(() => {
    if (!map || heatmapLayerRef.current) return;

    const initHeatmap = () => {
      try {
        // 创建热力图图层
        const heatmapLayer = new AMap.HeatmapLayer({
          map,
          zIndex: 100,
          opacity: 0.8,
        });

        heatmapLayerRef.current = heatmapLayer;
        onLoad?.();
      } catch (error) {
        console.error('热力图初始化失败:', error);
        onError?.('热力图初始化失败');
      }
    };

    // 高德地图加载完成后初始化
    if ((window as any).AMap && map) {
      initHeatmap();
    } else {
      // 等待地图加载
      const checkAMap = setInterval(() => {
        if ((window as any).AMap && map) {
          clearInterval(checkAMap);
          initHeatmap();
        }
      }, 100);

      return () => clearInterval(checkAMap);
    }
  }, [map, onLoad, onError]);

  // 更新数据
  useEffect(() => {
    if (!heatmapLayerRef.current || !data || data.length === 0) return;

    try {
      // 转换数据格式
      const heatmapData = data.map((point) => ({
        lng: point.lng,
        lat: point.lat,
        count: point.count ?? 1,
      }));

      // 设置数据集
      heatmapLayerRef.current.setDataSet({
        data: heatmapData,
        max: max ?? Math.max(...data.map((d) => d.count ?? 1)),
      });
    } catch (error) {
      console.error('热力图数据更新失败:', error);
    }
  }, [data, max]);

  // 更新配置
  useEffect(() => {
    if (!heatmapLayerRef.current) return;

    try {
      heatmapLayerRef.current.setOptions({
        radius: radius,
        gradient: gradient,
        opacity: visible ? 0.8 : 0,
      });
    } catch (error) {
      console.error('热力图配置更新失败:', error);
    }
  }, [radius, gradient, visible]);

  // 控制显示/隐藏
  useEffect(() => {
    if (!heatmapLayerRef.current) return;

    try {
      if (visible) {
        heatmapLayerRef.current.show();
      } else {
        heatmapLayerRef.current.hide();
      }
    } catch (error) {
      console.error('热力图显示控制失败:', error);
    }
  }, [visible]);

  // 清理
  useEffect(() => {
    return () => {
      if (heatmapLayerRef.current && map) {
        try {
          map.remove(heatmapLayerRef.current);
          heatmapLayerRef.current = null;
        } catch (error) {
          console.error('热力图层清理失败:', error);
        }
      }
    };
  }, [map]);

  return null;
};

export default HeatmapLayer;

/**
 * 使用示例：

// 生成模拟热力数据（基于门店分布）
const generateHeatmapData = (center: {lng: number, lat: number}, count: number): HeatmapDataPoint[] => {
  const data: HeatmapDataPoint[] = [];
  for (let i = 0; i < count; i++) {
    const offsetLng = (Math.random() - 0.5) * 0.1;
    const offsetLat = (Math.random() - 0.5) * 0.1;
    const weight = Math.random() * 100;
    data.push({
      lng: center.lng + offsetLng,
      lat: center.lat + offsetLat,
      count: weight,
    });
  }
  return data;
};

// 在组件中使用
<HeatmapLayer
  map={mapInstance}
  data={heatmapData}
  visible={showHeatmap}
  radius={25}
  max={100}
/>
 */
