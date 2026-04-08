/**
 * GeoJSON 矢量数据加载与渲染组件
 * 支持加载外部 GeoJSON 文件、自定义样式配置、交互事件
 */

import React, { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import type { MapPosition } from '@/types';

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface GeoJSONLayerProps {
  map: AMap.Map | null;
  data?: GeoJSONData | null;
  visible: boolean;
  style?: GeoJSONStyle;
  onFeatureClick?: (feature: GeoJSONFeature, position: MapPosition) => void;
  onFeatureHover?: (feature: GeoJSONFeature | null) => void;
  onLoad?: (featureCount: number) => void;
  onError?: (error: string) => void;
}

export interface GeoJSONStyle {
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  fillColor?: string;
  fillOpacity?: number;
  markerSize?: number;
  markerColor?: string;
}

const DEFAULT_STYLE: GeoJSONStyle = {
  strokeColor: '#1890ff',
  strokeWeight: 2,
  strokeOpacity: 0.8,
  fillColor: '#1890ff',
  fillOpacity: 0.3,
  markerSize: 10,
  markerColor: '#1890ff',
};

const GeoJSONLayer: React.FC<GeoJSONLayerProps> = ({
  map,
  data,
  visible,
  style = DEFAULT_STYLE,
  onFeatureClick,
  onFeatureHover,
  onLoad,
  onError,
}) => {
  const overlayGroupRef = useRef<AMap.OverlayGroup | null>(null);
  const overlaysRef = useRef<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 样式合并
  const mergedStyle = { ...DEFAULT_STYLE, ...style };

  // 清理所有覆盖物
  const clearOverlays = () => {
    if (overlayGroupRef.current && map) {
      map.remove(overlayGroupRef.current);
      overlayGroupRef.current = null;
    }
    overlaysRef.current = [];
    setLoaded(false);
  };

  // 渲染 GeoJSON 数据
  const renderGeoJSON = () => {
    if (!map || !data || !data.features || data.features.length === 0) {
      return;
    }

    clearOverlays();

    try {
      const group = new AMap.OverlayGroup();
      const overlays: any[] = [];

      data.features.forEach((feature, index) => {
        const { type, coordinates } = feature.geometry;
        let overlay: any;

        switch (type) {
          case 'Point':
            overlay = createPointOverlay(coordinates, feature, index);
            break;
          case 'Polygon':
            overlay = createPolygonOverlay(coordinates, mergedStyle, feature, index);
            break;
          case 'LineString':
            overlay = createLineOverlay(coordinates, mergedStyle, feature, index);
            break;
          case 'MultiPolygon':
            overlay = createMultiPolygonOverlay(coordinates, mergedStyle, feature, index);
            break;
          case 'MultiLineString':
            overlay = createMultiLineOverlay(coordinates, mergedStyle, feature, index);
            break;
          default:
            console.warn(`不支持的几何类型: ${type}`);
        }

        if (overlay) {
          overlays.push(overlay);
          group.addOverlay(overlay);
        }
      });

      overlayGroupRef.current = group;
      overlaysRef.current = overlays;

      if (visible) {
        map.add(group);
      }

      setLoaded(true);
      onLoad?.(data.features.length);
    } catch (error) {
      console.error('GeoJSON 渲染失败:', error);
      onError?.('GeoJSON 数据渲染失败');
    }
  };

  // 创建点覆盖物
  const createPointOverlay = (
    coordinates: number[],
    feature: GeoJSONFeature,
    index: number
  ): AMap.Marker => {
    const marker = new AMap.Marker({
      position: new AMap.LngLat(coordinates[0], coordinates[1]),
      title: feature.properties?.name || `点 ${index + 1}`,
      size: new AMap.Size(
        mergedStyle.markerSize || 10,
        mergedStyle.markerSize || 10
      ),
    });

    // 绑定点击事件
    if (onFeatureClick) {
      marker.on('click', () => {
        onFeatureClick(feature, {
          lng: coordinates[0],
          lat: coordinates[1],
        });
      });
    }

    // 绑定鼠标事件
    if (onFeatureHover) {
      marker.on('mouseover', () => onFeatureHover(feature));
      marker.on('mouseout', () => onFeatureHover(null));
    }

    return marker;
  };

  // 创建多边形覆盖物
  const createPolygonOverlay = (
    coordinates: number[][],
    style: GeoJSONStyle,
    feature: GeoJSONFeature,
    index: number
  ): AMap.Polygon => {
    const path = coordinates.map((coord) => new AMap.LngLat(coord[0], coord[1]));

    const polygon = new AMap.Polygon({
      path,
      strokeColor: style.strokeColor,
      strokeWeight: style.strokeWeight,
      strokeOpacity: style.strokeOpacity,
      fillColor: style.fillColor,
      fillOpacity: style.fillOpacity,
      title: feature.properties?.name || `区域 ${index + 1}`,
    });

    if (onFeatureClick) {
      polygon.on('click', () => {
        const center = polygon.getBounds()?.getCenter();
        onFeatureClick(feature, {
          lng: center?.lng || coordinates[0][0],
          lat: center?.lat || coordinates[0][1],
        });
      });
    }

    if (onFeatureHover) {
      polygon.on('mouseover', () => onFeatureHover(feature));
      polygon.on('mouseout', () => onFeatureHover(null));
    }

    return polygon;
  };

  // 创建线覆盖物
  const createLineOverlay = (
    coordinates: number[][],
    style: GeoJSONStyle,
    feature: GeoJSONFeature,
    index: number
  ): AMap.Polyline => {
    const path = coordinates.map((coord) => new AMap.LngLat(coord[0], coord[1]));

    const polyline = new AMap.Polyline({
      path,
      strokeColor: style.strokeColor,
      strokeWeight: style.strokeWeight,
      strokeOpacity: style.strokeOpacity,
      title: feature.properties?.name || `路线 ${index + 1}`,
    });

    if (onFeatureClick) {
      polyline.on('click', () => {
        const midIndex = Math.floor(coordinates.length / 2);
        onFeatureClick(feature, {
          lng: coordinates[midIndex][0],
          lat: coordinates[midIndex][1],
        });
      });
    }

    if (onFeatureHover) {
      polyline.on('mouseover', () => onFeatureHover(feature));
      polyline.on('mouseout', () => onFeatureHover(null));
    }

    return polyline;
  };

  // 创建多边形组
  const createMultiPolygonOverlay = (
    coordinates: number[][][],
    style: GeoJSONStyle,
    feature: GeoJSONFeature,
    index: number
  ): AMap.OverlayGroup => {
    const group = new AMap.OverlayGroup();

    coordinates.forEach((polygonCoords) => {
      const polygon = createPolygonOverlay(polygonCoords, style, feature, index);
      group.addOverlay(polygon);
    });

    return group;
  };

  // 创建多线组
  const createMultiLineOverlay = (
    coordinates: number[][][],
    style: GeoJSONStyle,
    feature: GeoJSONFeature,
    index: number
  ): AMap.OverlayGroup => {
    const group = new AMap.OverlayGroup();

    coordinates.forEach((lineCoords) => {
      const polyline = createLineOverlay(lineCoords, style, feature, index);
      group.addOverlay(polyline);
    });

    return group;
  };

  // 监听数据变化
  useEffect(() => {
    renderGeoJSON();
  }, [data]);

  // 控制显示/隐藏
  useEffect(() => {
    if (!overlayGroupRef.current || !map) return;

    if (visible) {
      map.add(overlayGroupRef.current);
    } else {
      map.remove(overlayGroupRef.current);
    }
  }, [visible, map]);

  // 清理
  useEffect(() => {
    return () => {
      clearOverlays();
    };
  }, [map]);

  return null;
};

export default GeoJSONLayer;

/**
 * GeoJSON 数据生成工具
 */

// 生成模拟门店分布 GeoJSON
export const generateStoreGeoJSON = (
  center: MapPosition,
  count: number
): GeoJSONData => {
  const features: GeoJSONFeature[] = [];

  for (let i = 0; i < count; i++) {
    const lng = center.lng + (Math.random() - 0.5) * 0.2;
    const lat = center.lat + (Math.random() - 0.5) * 0.2;
    const storeTypes = ['便利店', '超市', '药店', '餐厅', '水果店'];
    const storeType = storeTypes[Math.floor(Math.random() * storeTypes.length)];

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        id: `store_${i + 1}`,
        name: `${storeType} ${i + 1}`,
        type: storeType,
        address: `示例地址 ${i + 1}`,
        phone: `400-${String(i + 1).padStart(7, '0')}`,
        status: Math.random() > 0.2 ? '营业中' : '休息中',
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
};

// 生成模拟区域边界 GeoJSON
export const generateRegionGeoJSON = (
  center: MapPosition,
  radius: number = 0.05
): GeoJSONData => {
  const polygonCoords: number[][] = [];
  const sides = 6; // 六边形区域

  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * 2 * Math.PI;
    const lng = center.lng + radius * Math.cos(angle);
    const lat = center.lat + radius * Math.sin(angle);
    polygonCoords.push([lng, lat]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords],
        },
        properties: {
          id: 'region_1',
          name: '示例配送区域',
          area: '约50平方公里',
          population: 100000,
        },
      },
    ],
  };
};

// 生成模拟路线 GeoJSON
export const generateRouteGeoJSON = (
  start: MapPosition,
  end: MapPosition,
  waypoints: number = 5
): GeoJSONData => {
  const coords: number[][] = [[start.lng, start.lat]];

  for (let i = 1; i < waypoints; i++) {
    const t = i / waypoints;
    const lng = start.lng + (end.lng - start.lng) * t + (Math.random() - 0.5) * 0.02;
    const lat = start.lat + (end.lat - start.lat) * t + (Math.random() - 0.5) * 0.02;
    coords.push([lng, lat]);
  }

  coords.push([end.lng, end.lat]);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
        properties: {
          id: 'route_1',
          name: '配送路线',
          distance: '约15公里',
          estimatedTime: '约30分钟',
        },
      },
    ],
  };
};
