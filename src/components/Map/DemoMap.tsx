/**
 * 示例：使用解耦架构的地图组件
 * 
 * 这个组件展示了如何使用新的地图架构：
 * 1. MapProvider - 提供地图上下文
 * 2. useMap - 获取地图实例
 * 3. useMapReady - 检查地图是否就绪
 */
import React, { useRef, useEffect } from 'react';
import { MapProvider, useMapContext, useMapReady, mapManager, MapOptions } from '@/services/map';

/**
 * 子组件：通过 Hook 获取地图实例
 */
const MapChild: React.FC = () => {
  const { map, setCenter, setZoom, addControl, on, off, isReady } = useMapContext();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isReady || isInitializedRef.current || !mapContainerRef.current) return;
    
    isInitializedRef.current = true;

    // 使用 MapManager 创建地图实例
    const mapInstance = mapManager.createMap(
      mapContainerRef.current,
      {
        center: [116.3974, 39.9093], // 北京
        zoom: 12,
        viewMode: '2D',
      },
      'demo-map'
    );

    if (mapInstance) {
      // 添加控件
      mapManager.addControl('demo-map', 'Scale', { position: 'LB', offset: [10, 10] });
      mapManager.addControl('demo-map', 'ToolBar', { position: 'RT', offset: [10, 10] });

      // 添加事件监听
      mapManager.on('demo-map', 'click', (e: any) => {
        console.log('[Demo] 地图点击:', e.lnglat);
      });

      console.log('[Demo] 地图初始化成功');
    }

    return () => {
      // 清理
      mapManager.destroyMap('demo-map');
      isInitializedRef.current = false;
    };
  }, [isReady]);

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
  );
};

/**
 * 加载状态组件
 */
const MapLoading: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '400px',
    background: '#f5f5f5' 
  }}>
    <div>正在加载地图...</div>
  </div>
);

/**
 * 错误状态组件
 */
const MapError: React.FC<{ error: string }> = ({ error }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '400px',
    background: '#fff2e8' 
  }}>
    <div style={{ color: '#ff4d4f' }}>地图加载失败: {error}</div>
  </div>
);

/**
 * 主组件：使用 MapProvider 包裹
 */
export const DemoMap: React.FC = () => {
  const { isReady, isLoading, error } = useMapContext();

  if (isLoading) {
    return <MapLoading />;
  }

  if (error) {
    return <MapError error={error} />;
  }

  if (!isReady) {
    return <MapLoading />;
  }

  return (
    <div style={{ width: '100%', height: '400px', border: '1px solid #ddd' }}>
      <MapChild />
    </div>
  );
};

/**
 * 导出带 Provider 的版本
 */
export const DemoMapPage: React.FC = () => {
  return (
    <MapProvider mapId="demo-page" autoLoad={true}>
      <DemoMap />
    </MapProvider>
  );
};

export default DemoMapPage;
