/**
 * 地图容器组件 - 使用 MapManager 解耦架构
 * 
 * 所有地图操作都通过 MapManager 管理，不再直接使用 window.AMap
 */
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { loadAMap, getAMapLoadStatus, MapLoadStatus, mapManager, MapOptions } from '@/services/map';
import { debounce } from '@/utils/debounce';
import type { MapPosition, Marker } from '@/types';
import MarkerLayer from './MarkerLayer';

interface MapContainerProps {
    /** 地图中心点 */
    center?: MapPosition;
    /** 地图缩放级别 */
    zoom?: number;
    /** 地图类型 */
    mapType?: 'normal' | 'satellite' | '3d';
    /** 地图准备就绪回调 */
    onMapReady?: (map: any) => void;
    // 控件配置
    controls?:{
        scale?: boolean;      // 比例尺控件
        toolBar?: boolean;    // 工具条控件
        mapType?: boolean;    // 地图类型切换控件
    }
    /** 容器样式 */
    style?: React.CSSProperties;
    /** 容器类名 */
    className?: string;
    // 标记相关属性
    markers?: Marker[];
    onMarkerClick?: (marker: Marker) => void;
    onMarkerDragEnd?: (marker: Marker, newPosition: { lng: number; lat: number }) => void;
    onMapClick?: (e: any) => void;
    children?: React.ReactNode;
    // 地图功能属性
    showTraffic?: boolean;
    showSubway?: boolean;
    measureMode?: boolean;
    // 路线显示属性
    routePath?: Array<{lng: number, lat: number}>;
    routeVisible?: boolean;
    startPosition?: {lng: number, lat: number};
    endPosition?: {lng: number, lat: number};
    /** 地图唯一标识 */
    mapId?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({
    center = { lng: 116.3974, lat: 39.9093 },
    zoom = 10,
    mapType = 'normal',
    controls = { scale: true, toolBar: true, mapType: true },
    onMapReady,
    markers = [],
    onMarkerClick,
    onMarkerDragEnd,
    onMapClick,
    style = { width: '100%', height: '400px' },
    className,
    children,
    showTraffic = false,
    showSubway = false,
    measureMode = false,
    routePath = [],
    routeVisible = false,
    startPosition,
    endPosition,
    mapId = 'map-container-default',
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const controlsRef = useRef<{ scale?: any; toolBar?: any; mapType?: any }>({});
    const trafficLayerRef = useRef<any>(null);
    const subwayLayerRef = useRef<any>(null);
    const rangingToolRef = useRef<any>(null);
    const routeLayerRef = useRef<any>(null);
    const routeMarkersRef = useRef<any[]>([]);
    const [loadStatus, setLoadStatus] = useState<MapLoadStatus>(getAMapLoadStatus());
    const [error, setError] = useState<string | null>(null);

    // 初始化地图
    useEffect(() => {
        const initializeMap = async () => {
            try {
                const status = await loadAMap();
                setLoadStatus(status);

                if (status === MapLoadStatus.SUCCESS && mapRef.current) {
                    // 使用 MapManager 创建地图
                    const mapOptions: MapOptions = {
                        center: [center.lng, center.lat],
                        zoom: zoom,
                        viewMode: mapType === '3d' ? '3D' : '2D',
                        mapStyle: mapType === 'satellite' ? 'amap://styles/darkblue' : undefined,
                    };

                    const map = mapManager.createMap(mapRef.current, mapOptions, mapId);
                    
                    if (map) {
                        mapInstanceRef.current = map;
                        
                        // 初始化控件
                        initializeControls(map, controls);
                        
                        // 调用回调
                        onMapReady?.(map);
                        
                        console.log(`[MapContainer] 地图初始化成功: ${mapId}`);
                    }
                } else if (status === MapLoadStatus.MISSING_KEY) {
                    setError('高德地图 Key 未配置');
                } else {
                    setError('地图加载失败');
                }
            } catch (err) {
                console.error('[MapContainer] 地图初始化失败:', err);
                setError('地图初始化失败');
            }
        };

        const initializeControls = (map: any, controlsConfig: NonNullable<MapContainerProps['controls']>) => {
            // 通过 MapManager 获取 AMap
            const AMap = (window as any).AMap;
            if (!AMap) return;

            // 比例尺控件
            const scale = new AMap.Scale({
                position: 'LB',
                offset: [10, 10]
            });
            map.addControl(scale);
            controlsRef.current.scale = scale;
            if (!controlsConfig.scale) {
                scale.hide();
            }

            // 工具条控件
            const toolBar = new AMap.ToolBar({
                position: 'RT',
                offset: [10, 10]
            });
            map.addControl(toolBar);
            controlsRef.current.toolBar = toolBar;
            if (!controlsConfig.toolBar) {
                toolBar.hide();
            }

            // 地图类型控件
            const mapTypeControl = new AMap.MapType({
                position: 'RT',
                offset: [10, 100]
            });
            map.addControl(mapTypeControl);
            controlsRef.current.mapType = mapTypeControl;
            if (!controlsConfig.mapType) {
                mapTypeControl.hide();
            }
        };

        initializeMap();

        return () => {
            // 使用 MapManager 销毁地图
            if (mapInstanceRef.current) {
                mapManager.destroyMap(mapId);
                mapInstanceRef.current = null;
            }
        };
    }, []); // 只运行一次

    // Window resize 处理
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const handleResize = debounce(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.resize();
            }
        }, 200);

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // 控件配置变化
    useEffect(() => {
        if (mapInstanceRef.current) {
            updateControlsVisibility(controls);
        }
    }, [controls]);

    // 地图点击事件
    useEffect(() => {
        if (mapInstanceRef.current && onMapClick) {
            const map = mapInstanceRef.current;
            map.on('click', onMapClick);
            return () => {
                map.off('click', onMapClick);
            };
        }
    }, [onMapClick]);

    // 标记数量变化 - 调整视角
    const prevMarkersCountRef = useRef(markers.length);
    useEffect(() => {
        if (mapInstanceRef.current && markers.length > 0 && markers.length !== prevMarkersCountRef.current) {
            const map = mapInstanceRef.current;

            if (markers.length === 1) {
                map.setCenter([markers[0].position.lng, markers[0].position.lat]);
                map.setZoom(15);
            } else {
                try {
                    let minLng = Infinity, maxLng = -Infinity;
                    let minLat = Infinity, maxLat = -Infinity;

                    markers.forEach(marker => {
                        minLng = Math.min(minLng, marker.position.lng);
                        maxLng = Math.max(maxLng, marker.position.lng);
                        minLat = Math.min(minLat, marker.position.lat);
                        maxLat = Math.max(maxLat, marker.position.lat);
                    });

                    map.setCenter([(minLng + maxLng) / 2, (minLat + maxLat) / 2]);

                    const maxRange = Math.max(maxLng - minLng, maxLat - minLat);
                    let zoomLevel = 10;
                    if (maxRange < 0.01) zoomLevel = 15;
                    else if (maxRange < 0.05) zoomLevel = 13;
                    else if (maxRange < 0.1) zoomLevel = 11;
                    else if (maxRange < 0.5) zoomLevel = 9;
                    else zoomLevel = 7;

                    map.setZoom(zoomLevel);
                } catch (e) {
                    console.error('调整标记视角失败:', e);
                    map.setCenter([markers[0].position.lng, markers[0].position.lat]);
                    map.setZoom(13);
                }
            }
            prevMarkersCountRef.current = markers.length;
        }
    }, [markers.length]);

    // 地图类型变化
    useEffect(() => {
        console.log('[MapContainer] 地图类型变化:', mapType);
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        const AMap = (window as any).AMap;
        if (!AMap) return;

        try {
            if (mapType === 'satellite') {
                if (typeof map.setLayers === 'function' && AMap.TileLayer) {
                    const satelliteLayer = new AMap.TileLayer.Satellite();
                    const roadNetLayer = new AMap.TileLayer.RoadNet();
                    map.setLayers([satelliteLayer, roadNetLayer]);
                } else if (typeof map.setMapStyle === 'function') {
                    map.setMapStyle('amap://styles/darkblue');
                }
            } else if (mapType === '3d') {
                if (typeof map.setViewMode === 'function') {
                    map.setViewMode('3D');
                }
            } else {
                if (typeof map.setLayers === 'function' && AMap.TileLayer) {
                    map.setLayers([new AMap.TileLayer()]);
                }
                if (typeof map.setMapStyle === 'function') {
                    map.setMapStyle('');
                }
                if (typeof map.setViewMode === 'function') {
                    map.setViewMode('2D');
                }
            }
        } catch (e) {
            console.error('[MapContainer] 地图类型切换失败:', e);
        }
    }, [mapType]);

    // 中心点变化
    useEffect(() => {
        if (mapInstanceRef.current && center) {
            const map = mapInstanceRef.current;
            const currentCenter = map.getCenter();
            if (!currentCenter || 
                Math.abs(currentCenter.lng - center.lng) > 0.0001 || 
                Math.abs(currentCenter.lat - center.lat) > 0.0001) {
                map.setCenter([center.lng, center.lat]);
            }
        }
    }, [center]);

    // 缩放级别变化
    useEffect(() => {
        if (mapInstanceRef.current && zoom !== undefined) {
            const map = mapInstanceRef.current;
            const currentZoom = map.getZoom();
            if (currentZoom === undefined || Math.abs(currentZoom - zoom) > 0.1) {
                map.setZoom(zoom);
            }
        }
    }, [zoom]);

    // 路况显示
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        const AMap = (window as any).AMap;
        if (!AMap) return;

        if (showTraffic) {
            if (!trafficLayerRef.current) {
                try {
                    if (AMap.TileLayer && typeof AMap.TileLayer.Traffic === 'function') {
                        const layer = new AMap.TileLayer.Traffic({
                            autoRefresh: true,
                            interval: 180
                        });
                        map.add(layer);
                        trafficLayerRef.current = layer;
                    } else if (typeof AMap.Traffic === 'function') {
                        trafficLayerRef.current = new AMap.Traffic({
                            map,
                            autoRefresh: true,
                            interval: 180
                        });
                    }
                } catch (e) {
                    console.error('[MapContainer] 路况图层创建失败:', e);
                }
            }
        } else {
            if (trafficLayerRef.current) {
                try {
                    map.remove(trafficLayerRef.current);
                    trafficLayerRef.current = null;
                } catch (e) {
                    console.error('[MapContainer] 路况图层移除失败:', e);
                }
            }
        }
    }, [showTraffic]);

    // 地铁显示
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        const AMap = (window as any).AMap;
        if (!AMap) return;

        if (showSubway) {
            if (!subwayLayerRef.current) {
                try {
                    if (typeof AMap.Subway === 'function') {
                        subwayLayerRef.current = new AMap.Subway({ map });
                    }
                } catch (e) {
                    console.error('[MapContainer] 地铁图层创建失败:', e);
                }
            }
        } else {
            if (subwayLayerRef.current) {
                try {
                    map.remove(subwayLayerRef.current);
                    subwayLayerRef.current = null;
                } catch (e) {
                    console.error('[MapContainer] 地铁图层移除失败:', e);
                }
            }
        }
    }, [showSubway]);

    // 测距模式
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        const AMap = (window as any).AMap;
        if (!AMap) return;

        if (measureMode) {
            if (!rangingToolRef.current) {
                try {
                    if (typeof AMap.RangingTool === 'function') {
                        rangingToolRef.current = new AMap.RangingTool(map);
                        if (rangingToolRef.current?.turnOn) {
                            rangingToolRef.current.turnOn();
                        }
                    }
                } catch (e) {
                    console.error('[MapContainer] 测距工具创建失败:', e);
                }
            }
        } else {
            if (rangingToolRef.current?.turnOff) {
                try {
                    rangingToolRef.current.turnOff();
                    rangingToolRef.current = null;
                } catch (e) {
                    console.error('[MapContainer] 测距工具关闭失败:', e);
                }
            }
        }
    }, [measureMode]);

    // 路线显示
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        const AMap = (window as any).AMap;
        if (!AMap) return;

        // 清除旧路线
        if (routeLayerRef.current) {
            try { map.remove(routeLayerRef.current); } catch (e) {}
            routeLayerRef.current = null;
        }
        if (routeMarkersRef.current.length > 0) {
            try {
                routeMarkersRef.current.forEach(m => map.remove(m));
            } catch (e) {}
            routeMarkersRef.current = [];
        }

        if (routeVisible && routePath.length > 0) {
            try {
                const pathPoints = routePath.map(p => new AMap.LngLat(p.lng, p.lat));

                routeLayerRef.current = new AMap.Polyline({
                    map,
                    path: pathPoints,
                    strokeColor: '#1890ff',
                    strokeWeight: 6,
                    strokeOpacity: 0.8,
                });

                if (startPosition) {
                    const startMarker = new AMap.Marker({
                        map,
                        position: new AMap.LngLat(startPosition.lng, startPosition.lat),
                        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
                        title: '起点'
                    });
                    routeMarkersRef.current.push(startMarker);
                }

                if (endPosition) {
                    const endMarker = new AMap.Marker({
                        map,
                        position: new AMap.LngLat(endPosition.lng, endPosition.lat),
                        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
                        title: '终点'
                    });
                    routeMarkersRef.current.push(endMarker);
                }
            } catch (e) {
                console.error('[MapContainer] 路线创建失败:', e);
            }
        }
    }, [routeVisible, routePath, startPosition, endPosition]);

    // 控件显示/隐藏
    const updateControlVisibility = (control: any, visible: boolean) => {
        if (control) {
            visible ? control.show() : control.hide();
        }
    };

    const updateControlsVisibility = (newControls: NonNullable<MapContainerProps['controls']>) => {
        const currentControls = controlsRef.current;
        updateControlVisibility(currentControls.scale, newControls.scale ?? true);
        updateControlVisibility(currentControls.toolBar, newControls.toolBar ?? true);
        updateControlVisibility(currentControls.mapType, newControls.mapType ?? true);
    };

    // 错误状态
    if (loadStatus === MapLoadStatus.FAILED || error) {
        return (
            <div style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: 8 }}>
                <div style={{ textAlign: 'center', padding: 20 }}>
                    <h3 style={{ color: '#ff4d4f', marginBottom: 16 }}>地图加载失败</h3>
                    <p style={{ color: '#666', marginBottom: 16 }}>{error}</p>
                </div>
            </div>
        );
    }

    // 加载状态
    if (loadStatus === MapLoadStatus.LOADING) {
        return (
            <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>正在加载地图...</div>
            </div>
        );
    }

    // Key 缺失状态
    if (loadStatus === MapLoadStatus.MISSING_KEY) {
        return (
            <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff2e8', border: '1px solid #ffbb96', borderRadius: '6px' }}>
                <div style={{ textAlign: 'center', color: '#d4380d' }}>
                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>🔑 高德地图 Key 未配置</div>
                </div>
            </div>
        );
    }

    return (
        <div ref={mapRef} style={style} className={className}>
            <MarkerLayer
                markers={markers}
                onMarkerClick={onMarkerClick}
                onMarkerDragEnd={onMarkerDragEnd}
            />
            {children}
        </div>
    );
};

const MemoizedMapContainer = memo(MapContainer);
MemoizedMapContainer.displayName = 'MapContainer';

export default MemoizedMapContainer;
