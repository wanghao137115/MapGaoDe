/**
 * 地图上下文 - 提供地图实例给子组件
 * 实现地图与 React 组件的解耦
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { loadAMap, MapLoadStatus } from './index';
import { mapManager, MapOptions, MapInstance } from './MapManager';

// 地图上下文类型
export interface MapContextType {
  // 地图状态
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  // 地图实例
  map: MapInstance | null;
  mapId: string;
  // 地图操作方法
  createMap: (container: HTMLElement, options: MapOptions) => MapInstance | null;
  destroyMap: () => void;
  setCenter: (position: { lng: number; lat: number }) => void;
  setZoom: (zoom: number) => void;
  addControl: (controlType: string, options?: any) => any;
  on: (eventName: string, handler: any) => void;
  off: (eventName: string, handler: any) => void;
  // 重置
  reset: () => void;
}

// 创建上下文
const MapContext = createContext<MapContextType | null>(null);

// 上下文 Provider Props
interface MapProviderProps {
  children: ReactNode;
  mapId?: string; // 支持多个地图实例
  autoLoad?: boolean; // 是否自动加载地图
}

// MapProvider 组件
export const MapProvider: React.FC<MapProviderProps> = ({ 
  children, 
  mapId = 'default',
  autoLoad = true 
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<MapInstance | null>(null);
  
  const mapIdRef = useRef(mapId);
  mapIdRef.current = mapId;

  // 加载地图
  useEffect(() => {
    if (!autoLoad) return;

    const initMap = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const status = await loadAMap();
        
        if (status === MapLoadStatus.SUCCESS) {
          setIsReady(true);
          console.log('[MapProvider] 地图加载成功');
        } else if (status === MapLoadStatus.MISSING_KEY) {
          setError('高德地图 Key 未配置');
        } else {
          setError('地图加载失败');
        }
      } catch (err) {
        setError('地图初始化失败');
        console.error('[MapProvider] 地图加载失败:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, [autoLoad]);

  // 创建地图
  const createMapInstance = useCallback((container: HTMLElement, options: MapOptions): MapInstance | null => {
    if (!isReady) {
      console.warn('[MapProvider] 地图未就绪，无法创建实例');
      return null;
    }

    const mapInstance = mapManager.createMap(container, options, mapIdRef.current);
    setMap(mapInstance);
    return mapInstance;
  }, [isReady]);

  // 销毁地图
  const destroyMapInstance = useCallback(() => {
    mapManager.destroyMap(mapIdRef.current);
    setMap(null);
  }, []);

  // 设置中心点
  const setCenter = useCallback((position: { lng: number; lat: number }) => {
    mapManager.setCenter(mapIdRef.current, position);
  }, []);

  // 设置缩放
  const setZoom = useCallback((zoom: number) => {
    mapManager.setZoom(mapIdRef.current, zoom);
  }, []);

  // 添加控件
  const addControl = useCallback((controlType: string, options?: any) => {
    return mapManager.addControl(mapIdRef.current, controlType, options);
  }, []);

  // 添加事件监听
  const on = useCallback((eventName: string, handler: any) => {
    mapManager.on(mapIdRef.current, eventName, handler);
  }, []);

  // 移除事件监听
  const off = useCallback((eventName: string, handler: any) => {
    mapManager.off(mapIdRef.current, eventName, handler);
  }, []);

  // 重置
  const reset = useCallback(() => {
    destroyMapInstance();
    setIsReady(false);
    setError(null);
  }, [destroyMapInstance]);

  const value: MapContextType = {
    isReady,
    isLoading,
    error,
    map,
    mapId,
    createMap: createMapInstance,
    destroyMap: destroyMapInstance,
    setCenter,
    setZoom,
    addControl,
    on,
    off,
    reset,
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

/**
 * 使用地图上下文的 Hook
 */
export const useMapContext = (): MapContextType => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext 必须在 MapProvider 内使用');
  }
  return context;
};

/**
 * 简化版 Hook - 返回地图实例
 */
export const useMap = (): MapInstance | null => {
  const { map, isReady } = useMapContext();
  return isReady ? map : null;
};

/**
 * 检查地图是否就绪
 */
export const useMapReady = (): boolean => {
  const { isReady, isLoading, error } = useMapContext();
  return isReady && !isLoading && !error;
};

export default MapContext;
