import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { loadAMap, getAMapLoadStatus, MapLoadStatus } from '@/services/map';
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
    // 新增标记相关属性
    markers?: Marker[];
    onMarkerClick?: (marker: Marker) => void;
    onMarkerDragEnd?: (marker: Marker, newPosition: { lng: number; lat: number }) => void;
    onMapClick?: (e: any) => void;  // 新增：地图点击事件回调
    children?: React.ReactNode;      // 子组件支持
    // 新增地图功能属性
    showTraffic?: boolean;     // 是否显示路况
    showSubway?: boolean;      // 是否显示地铁
    measureMode?: boolean;     // 是否启用测距模式
    // 新增路线显示属性
    routePath?: Array<{lng: number, lat: number}>;  // 路线路径坐标
    routeVisible?: boolean;     // 是否显示路线
    startPosition?: {lng: number, lat: number};     // 起点坐标
    endPosition?: {lng: number, lat: number};       // 终点坐标
}

const MapContainer: React.FC<MapContainerProps> = ({
    center = { lng: 116.3974, lat: 39.9093 }, // 北京坐标作为默认
    zoom = 10,
    mapType = 'normal',
    controls = { scale: true, toolBar: true, mapType: true }, // 默认开启所有基础控件
    onMapReady,
    markers = [],  // 默认为空数组
    onMarkerClick,
    onMarkerDragEnd,
    onMapClick,
    style = { width: '100%', height: '400px' },
    className,
    children,
    // 新增地图功能属性
    showTraffic = false,
    showSubway = false,
    measureMode = false,
    // 新增路线显示属性
    routePath = [],
    routeVisible = false,
    startPosition,
    endPosition,
  }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const controlsRef = useRef<{ scale?: any; toolBar?: any; mapType?: any }>({});
    const trafficLayerRef = useRef<any>(null);
    const subwayLayerRef = useRef<any>(null);
    const rangingToolRef = useRef<any>(null);
    const routeLayerRef = useRef<any>(null);
    const routeMarkersRef = useRef<any[]>([]); // 存储路线相关的标记
    const [loadStatus, setLoadStatus] = useState<MapLoadStatus>(getAMapLoadStatus());
    const [error, setError] = useState<string | null>(null);

    // 地图初始化逻辑
    useEffect(() => {

        const initializeMap = async () => {
            try {
                // 加载高德地图API
                const status = await loadAMap();
                setLoadStatus(status);

                if(status === MapLoadStatus.SUCCESS && mapRef.current && (window as any).AMap) {
                    // 创建地图示例
                    const AMap = (window as any).AMap;
                    const map = new AMap.Map(mapRef.current, {
                      center: [center.lng, center.lat],
                      zoom: zoom,
                      viewMode: mapType === '3d' ? '3D' : '2D',
                      mapStyle: mapType === 'satellite' ? 'amap://styles/darkblue' : undefined,
                    });
            
                    mapInstanceRef.current = map;

                    // 设置全局地图实例，让MarkerLayer能够访问
                    (window as any).currentMap = map;

                    // 初始化控件
                    initializeControls(map, controls);
                    // 3.调用回调
                    onMapReady?.(map);
                    
                } else if (status === MapLoadStatus.MISSING_KEY) {
                    setError('高德地图 Key 未配置，请设置 VITE_AMAP_KEY 环境变量');
                } else {
                    setError('地图加载失败，请检查网络连接或 Key 配置');
                }
            } catch (error) {
                
            }
        }

        // 创建控件初始化函数 - 确保所有控件都被创建
        const initializeControls = (map: any, controls: NonNullable<MapContainerProps['controls']>) => {
            const AMap = (window as any).AMap;
        
            // 始终创建比例尺控件，根据配置决定初始显示状态
            const scale = new AMap.Scale({
            position: 'LB',
            offset: [10, 10]
            });
            map.addControl(scale);
            controlsRef.current.scale = scale;
            if (!controls.scale) {
            scale.hide(); // 初始隐藏
            }
        
            // 始终创建工具条控件
            const toolBar = new AMap.ToolBar({
            position: 'RT',
            offset: [10, 10]
            });
            map.addControl(toolBar);
            controlsRef.current.toolBar = toolBar;
            if (!controls.toolBar) {
            toolBar.hide(); // 初始隐藏
            }
        
            // 始终创建地图类型控件
            const mapTypeControl = new AMap.MapType({
            position: 'RT',
            offset: [10, 100]
            });
            map.addControl(mapTypeControl);
            controlsRef.current.mapType = mapTypeControl;
            if (!controls.mapType) {
            mapTypeControl.hide(); // 初始隐藏
            }
        };
        initializeMap();
        return () => {
            if(mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
        }
    }, []);

    // Window resize 防抖处理 - 地图窗口大小变化时重新调整
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

    // 响应控件配置变化 - 动态显示/隐藏控件
    useEffect(() => {
        if (mapInstanceRef.current) {
        updateControlsVisibility(controls);
        }
    }, [controls]);

    // 新增：绑定地图点击事件的useEffect
    useEffect(() => {
        // 检查地图实例是否存在以及是否有点击回调
        if (mapInstanceRef.current && onMapClick) {
        const map = mapInstanceRef.current;
        
        // 为地图绑定点击事件监听器
        map.on('click', onMapClick);
        
        // 返回清理函数，在组件卸载或依赖变化时移除事件监听器
        return () => {
            map.off('click', onMapClick);
        };
      }
    }, [onMapClick]);  // 依赖数组，只有onMapClick变化时才重新绑定
    // 响应标记变化 - 自动调整视角显示所有标记
    const prevMarkersCountRef = useRef(markers.length);
    useEffect(() => {
        // 只有当标记数量发生变化时才调整视角（避免无限循环）
        if (mapInstanceRef.current && markers.length > 0 && markers.length !== prevMarkersCountRef.current) {
            const map = mapInstanceRef.current;

            if (markers.length === 1) {
                // 只有一个标记，直接设置中心点和缩放级别
                const marker = markers[0];
                map.setCenter([marker.position.lng, marker.position.lat]);
                map.setZoom(15); // 设置合适的缩放级别
            } else {
                // 多个标记，计算边界并调整视角
                try {
                    // 计算所有标记的经纬度范围
                    let minLng = Infinity, maxLng = -Infinity;
                    let minLat = Infinity, maxLat = -Infinity;

                    markers.forEach(marker => {
                        minLng = Math.min(minLng, marker.position.lng);
                        maxLng = Math.max(maxLng, marker.position.lng);
                        minLat = Math.min(minLat, marker.position.lat);
                        maxLat = Math.max(maxLat, marker.position.lat);
                    });

                    // 计算中心点
                    const centerLng = (minLng + maxLng) / 2;
                    const centerLat = (minLat + maxLat) / 2;

                    // 设置地图中心
                    map.setCenter([centerLng, centerLat]);

                    // 根据范围大小设置合适的缩放级别
                    const lngRange = maxLng - minLng;
                    const latRange = maxLat - minLat;
                    const maxRange = Math.max(lngRange, latRange);

                    let zoom = 10; // 默认缩放级别
                    if (maxRange < 0.01) zoom = 15;      // 很小的范围
                    else if (maxRange < 0.05) zoom = 13;  // 小范围
                    else if (maxRange < 0.1) zoom = 11;   // 中等范围
                    else if (maxRange < 0.5) zoom = 9;    // 大范围
                    else zoom = 7;                        // 很大范围

                    map.setZoom(zoom);
                } catch (error) {
                    console.error('调整标记视角失败:', error);
                    // 降级方案：设置到第一个标记
                    const marker = markers[0];
                    map.setCenter([marker.position.lng, marker.position.lat]);
                    map.setZoom(13);
                }
            }

            prevMarkersCountRef.current = markers.length;
        }
    }, [markers.length]); // 只依赖markers.length而不是整个markers数组
    // 响应地图类型变化
    useEffect(() => {
        console.log('🗺️ MapContainer: 地图类型变化 - mapType:', mapType);
        if (mapInstanceRef.current) {
            const map = mapInstanceRef.current;
            const AMap = (window as any).AMap;

            try {
                if (mapType === 'satellite') {
                    // 切换到卫星地图
                    console.log('🛰️ MapContainer: 切换到卫星地图...');
                    try {
                        if (typeof map.setLayers === 'function' && typeof AMap.TileLayer === 'function') {
                            const satelliteLayer = new AMap.TileLayer.Satellite();
                            const roadNetLayer = new AMap.TileLayer.RoadNet();
                            map.setLayers([satelliteLayer, roadNetLayer]);
                            console.log('✅ MapContainer: 卫星地图切换成功');
                        } else if (typeof map.setMapStyle === 'function') {
                            map.setMapStyle('amap://styles/darkblue');
                            console.log('✅ MapContainer: 卫星地图样式切换成功');
                        }
                    } catch (e) {
                        console.log('🛰️ MapContainer: 卫星地图切换失败，尝试样式切换:', (e as Error).message);
                        if (typeof map.setMapStyle === 'function') {
                            map.setMapStyle('amap://styles/darkblue');
                        }
                    }
                } else if (mapType === '3d') {
                    // 切换到 3D 模式
                    console.log('🏔️ MapContainer: 切换到3D模式...');
                    try {
                        if (typeof map.setViewMode === 'function') {
                            map.setViewMode('3D');
                            console.log('✅ MapContainer: 3D模式切换成功');
                        }
                    } catch (e) {
                        console.log('🏔️ MapContainer: 3D模式切换失败:', (e as Error).message);
                    }
                } else {
                    // 普通地图
                    console.log('🗺️ MapContainer: 切换到普通地图...');
                    try {
                        if (typeof map.setLayers === 'function' && typeof AMap.TileLayer === 'function') {
                            const defaultLayer = new AMap.TileLayer();
                            map.setLayers([defaultLayer]);
                        }
                        if (typeof map.setMapStyle === 'function') {
                            map.setMapStyle('');
                        }
                        if (typeof map.setViewMode === 'function') {
                            map.setViewMode('2D');
                        }
                        console.log('✅ MapContainer: 普通地图恢复成功');
                    } catch (e) {
                        console.log('🗺️ MapContainer: 普通地图恢复失败:', (e as Error).message);
                    }
                }
            } catch (error) {
                console.log('🗺️ MapContainer: 地图类型切换出现异常:', (error as Error).message);
            }
        }
    }, [mapType]);
    // 响应地图中心点变化
    useEffect(() => {
        if (mapInstanceRef.current && center) {
            const map = mapInstanceRef.current;
            const currentCenter = map.getCenter();
            // 只有当新的中心点与当前中心点不同时才更新（避免不必要的更新）
            if (!currentCenter || 
                Math.abs(currentCenter.lng - center.lng) > 0.0001 || 
                Math.abs(currentCenter.lat - center.lat) > 0.0001) {
                // 使用高德地图的 setCenter 方法移动地图中心
                map.setCenter([center.lng, center.lat]);
            }
        }
    }, [center]);
    // MapContainer 响应 zoom 变化
    useEffect(() => {
        if (mapInstanceRef.current && zoom !== undefined) {
            const map = mapInstanceRef.current;
            const currentZoom = map.getZoom();
            // 只有当新的缩放级别与当前缩放级别不同时才更新（避免不必要的更新）
            if (currentZoom === undefined || Math.abs(currentZoom - zoom) > 0.1) {
                map.setZoom(zoom);
            }
        }
    }, [zoom]);

    // 处理路况显示/隐藏
    useEffect(() => {
        console.log('🚗 MapContainer: 路况状态变化 - showTraffic:', showTraffic);
        if (mapInstanceRef.current && (window as any).AMap) {
            const map = mapInstanceRef.current;
            const AMap = (window as any).AMap;

            console.log('🚗 MapContainer: AMap对象检查:', {
                hasTileLayer: !!AMap.TileLayer,
                hasTileTraffic: !!AMap.TileLayer?.Traffic,
                hasLegacyTraffic: typeof AMap.Traffic === 'function',
                mapReady: !!map
            });

            if (showTraffic) {
                // 显示路况
                console.log('🚗 MapContainer: 路况模式启用');
                if (!trafficLayerRef.current) {
                    try {
                        // 优先使用 v2.0 的 TileLayer.Traffic（推荐）
                        if (AMap.TileLayer && typeof AMap.TileLayer.Traffic === 'function') {
                            const layer = new AMap.TileLayer.Traffic({
                                autoRefresh: true,
                                interval: 180
                            });
                            map.add(layer);
                            trafficLayerRef.current = layer;
                            console.log('✅ MapContainer: 路况图层创建成功（TileLayer.Traffic）');
                        } else if (typeof AMap.Traffic === 'function') {
                            // 兼容老版本 v1.x 的 AMap.Traffic
                            trafficLayerRef.current = new AMap.Traffic({
                                map,
                                autoRefresh: true,
                                interval: 180
                            });
                            console.log('✅ MapContainer: 路况图层创建成功（AMap.Traffic）');
                        } else {
                            console.log('🚗 MapContainer: 未找到 Traffic 图层类，路况功能不可用');
                        }
                    } catch (e) {
                        console.log('🚗 MapContainer: 路况图层创建失败，跳过功能:', (e as Error).message);
                    }
                }
            } else {
                // 隐藏路况
                console.log('🚗 MapContainer: 路况模式禁用');
                if (trafficLayerRef.current) {
                    try {
                        map.remove(trafficLayerRef.current);
                        trafficLayerRef.current = null;
                        console.log('✅ MapContainer: 路况图层移除成功');
                    } catch (e) {
                        console.log('🚗 MapContainer: 路况图层移除失败:', (e as Error).message);
                    }
                }
            }
        } else {
            console.log('🚗 MapContainer: 地图未准备好或AMap未加载', {
                mapReady: !!mapInstanceRef.current,
                AMapReady: !!(window as any).AMap
            });
        }
    }, [showTraffic]);

    // 处理地铁显示/隐藏 - 使用TileLayer实现
    useEffect(() => {
        console.log('🚇 MapContainer: 地铁状态变化 - showSubway:', showSubway);
        if (mapInstanceRef.current && (window as any).AMap) {
            const map = mapInstanceRef.current;
            const AMap = (window as any).AMap;

            console.log('🚇 MapContainer: AMap对象检查:', {
                hasTileLayer: typeof AMap.TileLayer === 'function',
                hasSubway: typeof AMap.Subway === 'function',
                Subway: AMap.Subway,
                allAMapKeys: Object.keys(AMap).filter(key => key.includes('Subway') || key.includes('Sub') || key.includes('Layer')).join(', '),
                mapReady: !!map
            });

            if (showSubway) {
                // 显示地铁
                console.log('🚇 MapContainer: 地铁模式启用');
                if (!subwayLayerRef.current) {
                    try {
                        if (typeof AMap.Subway === 'function') {
                            subwayLayerRef.current = new AMap.Subway({
                                map: map
                            });
                            console.log('✅ MapContainer: 地铁图层创建成功');
                        } else {
                            console.log('🚇 MapContainer: AMap.Subway不存在，跳过地铁功能');
                        }
                    } catch (e) {
                        console.log('🚇 MapContainer: 地铁图层创建失败，跳过功能:', (e as Error).message);
                    }
                }
            } else {
                // 隐藏地铁
                console.log('🚇 MapContainer: 地铁模式禁用');
                if (subwayLayerRef.current) {
                    try {
                        map.remove(subwayLayerRef.current);
                        subwayLayerRef.current = null;
                        console.log('✅ MapContainer: 地铁图层移除成功');
                    } catch (e) {
                        console.log('🚇 MapContainer: 地铁图层移除失败:', (e as Error).message);
                    }
                }
            }
        } else {
            console.log('🚇 MapContainer: 地图未准备好或AMap未加载', {
                mapReady: !!mapInstanceRef.current,
                AMapReady: !!(window as any).AMap
            });
        }
    }, [showSubway]);

    // 处理测距模式
    useEffect(() => {
        console.log('📏 MapContainer: 测距状态变化 - measureMode:', measureMode);
        if (mapInstanceRef.current && (window as any).AMap) {
            const map = mapInstanceRef.current;
            const AMap = (window as any).AMap;

            console.log('📏 MapContainer: AMap对象检查:', {
                hasRangingTool: typeof AMap.RangingTool === 'function',
                RangingTool: AMap.RangingTool,
                allAMapKeys: Object.keys(AMap).filter(key => key.includes('Rang') || key.includes('Tool')).join(', '),
                mapReady: !!map,
                mapType: typeof map
            });

            if (measureMode) {
                // 启用测距
                console.log('📏 MapContainer: 测距模式启用');
                if (!rangingToolRef.current) {
                    try {
                        // 简化实现：直接尝试创建测距工具
                        if (typeof AMap.RangingTool === 'function') {
                            rangingToolRef.current = new AMap.RangingTool(map);
                            if (rangingToolRef.current && typeof rangingToolRef.current.turnOn === 'function') {
                                rangingToolRef.current.turnOn();
                                console.log('✅ MapContainer: 测距工具创建并开启成功');
                            }
                        } else {
                            console.log('📏 MapContainer: AMap.RangingTool不存在，跳过测距功能');
                        }
                    } catch (e) {
                        console.log('📏 MapContainer: 测距工具创建失败，跳过功能:', (e as Error).message);
                    }
                }
            } else {
                // 禁用测距
                console.log('📏 MapContainer: 测距模式禁用');
                if (rangingToolRef.current && typeof rangingToolRef.current.turnOff === 'function') {
                    try {
                        rangingToolRef.current.turnOff();
                        rangingToolRef.current = null;
                        console.log('✅ MapContainer: 测距工具关闭成功');
                    } catch (e) {
                        console.log('📏 MapContainer: 测距工具关闭失败:', (e as Error).message);
                    }
                }
            }
        } else {
            console.log('📏 MapContainer: 地图未准备好或AMap未加载', {
                mapReady: !!mapInstanceRef.current,
                AMapReady: !!(window as any).AMap
            });
        }
    }, [measureMode]);

    // 处理路线显示
    useEffect(() => {
        if (mapInstanceRef.current && (window as any).AMap) {
            const map = mapInstanceRef.current;
            const AMap = (window as any).AMap;

            if (routeVisible && routePath.length > 0) {
                // 显示路线

                try {

                // 强制清除旧的路线图层和标记（如果存在）
                if (routeLayerRef.current) {
                    try {
                        map.remove(routeLayerRef.current);
                        routeLayerRef.current = null;
                    } catch (e) {
                        // 忽略清除错误
                    }
                }

                // 清除旧的路线标记
                if (routeMarkersRef.current.length > 0) {
                    try {
                        routeMarkersRef.current.forEach(marker => {
                            map.remove(marker);
                        });
                        routeMarkersRef.current = [];
                    } catch (e) {
                        // 忽略清除错误
                    }
                }

                // 创建新的路线图层
                const pathPoints = routePath.map(point => {
                    return new AMap.LngLat(point.lng, point.lat);
                });

                routeLayerRef.current = new AMap.Polyline({
                    map: map,
                    path: pathPoints,
                    strokeColor: '#1890ff', // 蓝色线条
                    strokeWeight: 6,
                    strokeOpacity: 0.8,
                    lineJoin: 'round',
                    lineCap: 'round'
                });

                // 添加起点和终点标记
                if (startPosition) {
                    const startMarker = new AMap.Marker({
                        map: map,
                        position: new AMap.LngLat(startPosition.lng, startPosition.lat),
                        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
                        title: '起点'
                    });
                    routeMarkersRef.current.push(startMarker);
                }

                if (endPosition) {
                    const endMarker = new AMap.Marker({
                        map: map,
                        position: new AMap.LngLat(endPosition.lng, endPosition.lat),
                        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
                        title: '终点'
                    });
                    routeMarkersRef.current.push(endMarker);
                }
                } catch (e) {
                    console.error('❌ MapContainer: 路线图层创建失败:', e);
                    console.error('❌ MapContainer: 错误详情:', {
                        error: e,
                        routePath,
                        AMap: AMap,
                        hasPolyline: typeof AMap.Polyline === 'function',
                        hasMarker: typeof AMap.Marker === 'function'
                    });
                }
            } else {
                // 隐藏路线
                // 清除路线图层
                if (routeLayerRef.current) {
                    try {
                        map.remove(routeLayerRef.current);
                        routeLayerRef.current = null;
                    } catch (e) {
                        // 忽略移除错误
                    }
                }

                // 清除路线标记
                if (routeMarkersRef.current.length > 0) {
                    try {
                        routeMarkersRef.current.forEach(marker => {
                            map.remove(marker);
                        });
                        routeMarkersRef.current = [];
                    } catch (e) {
                        // 忽略清除错误
                    }
                }
            }
        }
    }, [routeVisible, routePath]);

    // 控件显示/隐藏管理函数
    const updateControlVisibility = (control: any, visible: boolean) => {
        if (control) {
        if (visible) {
            control.show(); // 显示控件
        } else {
            control.hide(); // 隐藏控件
        }
        }
    };
    // 批量更新控件可见性
    const updateControlsVisibility = (newControls: NonNullable<MapContainerProps['controls']>) => {
        const currentControls = controlsRef.current;

        // 更新比例尺控件
        updateControlVisibility(currentControls.scale, newControls.scale ?? true);

        // 更新工具条控件
        updateControlVisibility(currentControls.toolBar, newControls.toolBar ?? true);

        // 更新地图类型控件
        updateControlVisibility(currentControls.mapType, newControls.mapType ?? true);
    };
    // 错误处理UI
    if (loadStatus === MapLoadStatus.FAILED || error) {
        return (
          <div style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: 8 }}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <h3 style={{ color: '#ff4d4f', marginBottom: 16 }}>地图加载失败</h3>
              <p style={{ color: '#666', marginBottom: 16 }}>{error}</p>
              <div style={{ fontSize: '12px', color: '#999' }}>
                请检查：<br />
                1. 网络连接是否正常<br />
                2. 是否配置了有效的 VITE_AMAP_KEY<br />
                获取 Key: https://lbs.amap.com/console/key
              </div>
            </div>
          </div>
        );
    }
    // 加载状态显示
    if (loadStatus === MapLoadStatus.LOADING) {
        return (
          <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>正在加载地图...</div>
        </div>
        );
    }
  
    // Key 缺失状态显示
    if (loadStatus === MapLoadStatus.MISSING_KEY) {
        return (
        <div
            style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff2e8',
            border: '1px solid #ffbb96',
            borderRadius: '6px',
            }}
            className={className}
        >
            <div style={{ textAlign: 'center', color: '#d4380d' }}>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>🔑 高德地图 Key 未配置</div>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                请在 .env 文件中设置 VITE_AMAP_KEY
                <br />
                获取 Key: https://lbs.amap.com/console/key
            </div>
            </div>
        </div>
        );
    }
    return (
        <div
            ref={mapRef}
            style={style}
            className={className}
        >
            {/* 渲染标记层 */}
            <MarkerLayer
            markers={markers}
            onMarkerClick={onMarkerClick}
            onMarkerDragEnd={onMarkerDragEnd}
            />
            {/* 渲染子组件 */}
            {children}
        </div>
    );
};

// 使用React.memo进行性能优化，避免不必要的重新渲染
const MemoizedMapContainer = memo(MapContainer);
MemoizedMapContainer.displayName = 'MapContainer';

export default MemoizedMapContainer;