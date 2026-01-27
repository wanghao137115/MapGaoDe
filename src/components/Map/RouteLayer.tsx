// src/components/Map/RouteLayer.tsx
// 路径绘制组件 - 在地图上绘制规划出的路线

import React, { useEffect, useRef, useState } from 'react';
import type { MapPosition } from '@/types';

// 组件Props接口定义
interface RouteLayerProps {
  polyline: MapPosition[];        // 路径坐标点数组
  mode: 'driving' | 'walking';    // 路径模式（决定颜色）
  visible: boolean;               // 是否显示路径
}

// 主组件定义 - 函数式组件，不渲染任何DOM，只负责绘制路径
const RouteLayer: React.FC<RouteLayerProps> = ({
  polyline,   // 路径坐标点
  mode,       // 路径模式
  visible     // 是否可见
}) => {
  // 使用useRef保存路径覆盖物引用，方便后续清理
  const polylineRef = useRef<any>(null);
  // 跟踪路径绘制状态
  const [drawStatus, setDrawStatus] = useState<'idle' | 'drawing' | 'success' | 'error'>('idle');

  // 使用useEffect监听props变化，重新绘制路径
  useEffect(() => {
    // 获取地图实例（通过全局变量）
    const map = (window as any).currentMap;
    const AMap = (window as any).AMap;

    // 如果地图还没有准备好，但有路径数据，尝试等待一下
    if (!map && visible && polyline && polyline.length > 0) {
      const timer = setTimeout(() => {
        const retryMap = (window as any).currentMap;
        const retryAMap = (window as any).AMap;
        if (retryMap && retryAMap) {
          // 重新触发effect
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    // 条件检查：地图不存在、不可见、无坐标点时清除路径
    if (!map || !AMap || !visible || !polyline || polyline.length === 0) {
      // 清除现有路径
      if (polylineRef.current) {
        map?.remove(polylineRef.current);  // 从地图移除覆盖物
        polylineRef.current = null;       // 清空引用
      }
      return;
    }

    try {
      // 清除现有路径（如果有）
      if (polylineRef.current) {
        map.remove(polylineRef.current);
      }

      // 将应用坐标格式转换为AMap坐标格式
      // MapPosition[] → AMap.LngLat[]
      const path = polyline.map(point =>
        new AMap.LngLat(point.lng, point.lat)
      );

      // 根据路径模式设置不同的视觉样式
      const polylineOptions = {
        path: path,  // 路径坐标数组

        // 根据模式设置颜色：驾车蓝色，步行绿色
        strokeColor: mode === 'driving' ? '#1890ff' : '#52c41a',
        strokeOpacity: 0.8,     // 线条透明度
        strokeWeight: 6,        // 线条宽度（像素）
        strokeStyle: 'solid',   // 线条样式

        // 线条连接样式
        lineJoin: 'round',      // 拐点圆角
        lineCap: 'round'        // 端点圆角
      };

      // 创建AMap折线覆盖物
      const newPolyline = new AMap.Polyline(polylineOptions);

      // 将路径添加到地图
      map.add(newPolyline);

      // 保存覆盖物引用
      polylineRef.current = newPolyline;

      // 自动调整地图视野以显示完整路径
      map.setFitView([newPolyline], {
        padding: [50, 50, 50, 50]  // 上下左右边距（像素）
      });

    } catch (error) {
      // 路径绘制失败时的错误处理
      // 可以在这里显示用户友好的错误提示
    }

    // 清理函数：组件卸载或依赖变化时执行
    return () => {
      const currentMap = (window as any).currentMap;
      if (polylineRef.current && currentMap) {
        currentMap.remove(polylineRef.current);  // 从地图移除覆盖物
        polylineRef.current = null;       // 清空引用
      }
    };

    // 依赖数组：当这些值变化时重新执行effect
  }, [polyline, mode, visible]);

  // 组件不渲染任何DOM元素，只负责副作用（绘制路径）
  return null;
};

export default RouteLayer;