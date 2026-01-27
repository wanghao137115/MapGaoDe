// src/components/Map/ServiceAreaLayer.tsx
// 服务范围覆盖物组件 - 在地图上显示门店的服务范围圆形区域

import React, { useEffect, useRef, useState } from 'react';
import type { MapPosition } from '@/types';

interface ServiceArea {
  id: string;
  center: MapPosition;
  radius: number; // 米
  fillColor?: string;
  strokeColor?: string;
  visible: boolean;
}

interface ServiceAreaLayerProps {
  serviceAreas: ServiceArea[];
}

const ServiceAreaLayer: React.FC<ServiceAreaLayerProps> = ({ serviceAreas }) => {
  const circlesRef = useRef<{ [key: string]: any }>({});
  const [mapReady, setMapReady] = useState(false);

  // 监听地图实例变化
  useEffect(() => {
    const checkMapReady = () => {
      if ((window as any).currentMap && (window as any).AMap) {
        setMapReady(true);
      } else {
        setMapReady(false);
      }
    };

    // 立即检查一次
    checkMapReady();

    // 设置定时器定期检查（直到地图就绪）
    const interval = setInterval(checkMapReady, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 只有当地图就绪时才渲染覆盖物
    if (!mapReady) {
      return;
    }

    const AMap = (window as any).AMap;
    const map = (window as any).currentMap;

    // 获取现有的覆盖物ID
    const existingIds = Object.keys(circlesRef.current);
    const newIds = serviceAreas.map(area => area.id);
    const toAdd = serviceAreas.filter(area => !existingIds.includes(area.id));
    const toUpdate = serviceAreas.filter(area => existingIds.includes(area.id));
    const toRemove = existingIds.filter(id => !newIds.includes(id));

    // 移除不需要的覆盖物
    toRemove.forEach(id => {
      const circle = circlesRef.current[id];
      if (circle && map && typeof map.remove === 'function') {
        try {
          map.remove(circle);
        } catch (error) {
          console.warn('Error removing circle overlay:', error);
        }
        delete circlesRef.current[id];
      }
    });

    // 添加新的覆盖物
    toAdd.forEach(area => {
      if (area.visible && area.radius > 0) {
        const circle = new AMap.Circle({
          center: [area.center.lng, area.center.lat],
          radius: area.radius,
          strokeColor: area.strokeColor || '#1890ff',
          strokeWeight: 2,
          strokeOpacity: 0.8,
          fillColor: area.fillColor || '#1890ff',
          fillOpacity: 0.1,
          cursor: 'pointer',
        });

        map.add(circle);
        circlesRef.current[area.id] = circle;
      }
    });

    // 更新现有覆盖物
    toUpdate.forEach(area => {
      const existingCircle = circlesRef.current[area.id];
      if (existingCircle) {
        // 检查是否需要更新
        const currentCenter = existingCircle.getCenter();
        const newCenter = [area.center.lng, area.center.lat];
        const currentRadius = existingCircle.getRadius();

        if (currentCenter[0] !== newCenter[0] || currentCenter[1] !== newCenter[1] || currentRadius !== area.radius) {
          existingCircle.setCenter(newCenter);
          existingCircle.setRadius(area.radius);
        }

        // 更新可见性
        if (area.visible && area.radius > 0) {
          existingCircle.show();
        } else {
          existingCircle.hide();
        }
      }
    });

    // 清理函数
    return () => {
      // 获取当前地图实例
      const currentMap = (window as any).currentMap;
      // 清理所有覆盖物
      Object.values(circlesRef.current).forEach(circle => {
        if (circle && currentMap && typeof currentMap.remove === 'function') {
          try {
            currentMap.remove(circle);
          } catch (error) {
            console.warn('Error removing circle overlay:', error);
          }
        }
      });
      circlesRef.current = {};
    };
  }, [serviceAreas, mapReady]);

  return null; // 这个组件不渲染任何DOM，只负责在地图上添加覆盖物
};

export default ServiceAreaLayer;
