/**
 * 混合地图组件 - 使用新的解耦架构
 * 
 * 这个组件将新的 MapProvider 架构与现有的 MapContainer 结合
 * 保持向后兼容的同时，提供新的 Hook 获取地图实例的方式
 */
import React, { useRef, useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  MapProvider, 
  useMapContext, 
  useMapReady, 
  mapManager, 
  MapOptions 
} from '@/services/map';
import MapContainer, { MapContainerProps } from './MapContainer';

// 内部组件 - 处理地图初始化
interface HybridMapInnerProps {
  children?: ReactNode;
  onMapReady?: (map: any) => void;
}

const HybridMapInner: React.FC<HybridMapInnerProps> = ({ children, onMapReady }) => {
  const { map, isReady } = useMapContext();
  const hasCalledReadyRef = useRef(false);

  // 当地图就绪时，调用回调
  useEffect(() => {
    if (isReady && map && !hasCalledReadyRef.current) {
      hasCalledReadyRef.current = true;
      onMapReady?.(map);
    }
  }, [isReady, map, onMapReady]);

  // 渲染子组件
  return <>{children}</>;
};

// 加载状态组件
const LoadingView: React.FC<{ error?: string | null }> = ({ error }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
    height: '400px',
    background: '#f5f5f5' 
  }}>
    {error ? (
      <div style={{ color: '#ff4d4f' }}>地图加载失败: {error}</div>
    ) : (
      <div>正在加载地图...</div>
    )}
  </div>
);

/**
 * 混合地图组件 Props
 * 扩展了 MapContainerProps，增加了新的 Hook 支持
 */
export interface HybridMapProps extends Omit<MapContainerProps, 'children'> {
  /** 子组件 */
  children?: ReactNode;
  /** 地图就绪回调 - 使用新架构的地图实例 */
  onMapReady?: (map: any) => void;
  /** 是否使用新的 Hook 方式（默认 true） */
  enableNewHooks?: boolean;
}

/**
 * 混合地图组件（默认版本）
 * 使用新的 MapProvider 架构
 */
export const HybridMap: React.FC<HybridMapProps> = ({
  children,
  onMapReady,
  enableNewHooks = true,
  ...mapContainerProps
}) => {
  // 使用 props 传入的 mapId 或默认 'hybrid-map'
  const mapId = mapContainerProps.mapId || 'hybrid-map';

  return (
    <MapProvider mapId={mapId} autoLoad={true}>
      <HybridMapWrapper 
        {...mapContainerProps}
        mapId={mapId}
        onMapReady={onMapReady}
      >
        {children}
      </HybridMapWrapper>
    </MapProvider>
  );
};

// 内部包装组件
interface HybridMapWrapperProps extends Omit<MapContainerProps, 'children'> {
  children?: ReactNode;
  onMapReady?: (map: any) => void;
}

const HybridMapWrapper: React.FC<HybridMapWrapperProps> = ({
  children,
  onMapReady,
  ...mapContainerProps
}) => {
  const { isReady, isLoading, error } = useMapContext();
  const mapReadyRef = useRef(false);

  // 处理地图就绪回调
  const handleMapReady = useCallback((mapInstance: any) => {
    if (!mapReadyRef.current) {
      mapReadyRef.current = true;
      
      // 调用新的回调
      onMapReady?.(mapInstance);
      
      // 同时调用原有的回调（通过 mapContainerProps）
      mapContainerProps.onMapReady?.(mapInstance);
    }
  }, [onMapReady, mapContainerProps]);

  // 显示加载或错误状态
  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return <LoadingView error={error} />;
  }

  // 使用原有的 MapContainer 渲染地图
  return (
    <MapContainer {...mapContainerProps}>
      <HybridMapInner onMapReady={handleMapReady}>
        {children}
      </HybridMapInner>
    </MapContainer>
  );
};

/**
 * 兼容版本 - 不使用新的 Hook 架构
 * 适用于不需要使用 useMap 或 useMapContext 的场景
 */
export const HybridMapCompat: React.FC<HybridMapProps> = ({
  children,
  onMapReady,
  enableNewHooks,
  ...mapContainerProps
}) => {
  // 如果不需要新 Hook，直接使用原有方式
  return (
    <MapContainer {...mapContainerProps} onMapReady={onMapReady}>
      {children}
    </MapContainer>
  );
};

export default HybridMap;
