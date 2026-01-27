import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, Space, Switch, Divider, Button, message, Row, Col, Typography, Tag, Badge, Collapse, CollapseProps, Checkbox, Cascader, Spin, Popover, Input } from "antd";
import { EnvironmentOutlined, FullscreenOutlined, GlobalOutlined, CarOutlined, RadarChartOutlined, AimOutlined } from "@ant-design/icons";
import MapContainer from "@/components/Map/MapContainer";
import MarkerLayer from "@/components/Map/MarkerLayer"; // 导入标记层组件
import MarkerList from "@/components/Map/MarkerList"; // 导入标记列表组件
import MarkerSearch from "@/components/Map/MarkerSearch"; // 导入搜索筛选组件
import PlaceSearch from "@/components/Map/PlaceSearch"; // 地点搜索组件
// 导入信息弹窗组件
import InfoWindow from '@/components/UI/InfoWindow';
// 导入定位错误提示组件
import LocationErrorAlert from '@/components/UI/LocationErrorAlert';
// 导入地铁查询弹窗组件
import SubwayQueryModal from '@/components/UI/SubwayQueryModal';
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMapStore } from "@/stores/map.store";
import { useMarkersStore } from "@/stores/markers.store";
import type { MapPosition, Marker } from "@/types";

const { Text } = Typography;
const { Panel } = Collapse;

// 添加路径规划服务导入
import { planDrivingRoute, planWalkingRoute, planTransitRoute, planRidingRoute, planElectricRoute } from "@/services/map";
import type { RouteServiceResult } from "@/types";
import { RouteServiceStatus } from "@/types";

// 导入路径规划相关组件
import RoutePlanningForm, { RoutePlanningParams } from '@/components/Map/RoutePlanningForm';
import RouteDetailsPanel from '@/components/Map/RouteDetailsPanel';
import RouteLayer from '@/components/Map/RouteLayer';

const MapPlayground: React.FC = () => {
  // 页面加载时的初始化
  React.useEffect(() => {
    // 检查地图实例是否正确设置
    const checkMapInstance = () => {
      const map = (window as any).currentMap;
      const AMap = (window as any).AMap;
      // 地图实例检查逻辑（可选）
    };

    // 延迟检查地图实例
    const timer = setTimeout(checkMapInstance, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 禁用页面滚动，确保地图全屏展示且无滚动条
  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const {
    center: storeCenter,
    zoom,
    mapType,
    setCenter,
    setZoom,
    setMapType,
  } = useMapStore();
  const { markers, addMarker, updateMarker, removeMarker } = useMarkersStore();
  // 添加选中标记状态
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  // 新增状态：信息弹窗可见性
  const [infoWindowVisible, setInfoWindowVisible] = useState(false);
  const [controls, setControls] = useState({
    scale: false,
    toolBar: false,
    mapType: false,
  });
  // 新增状态：搜索查询字符串
  const [searchQuery, setSearchQuery] = useState("");
  // 新增状态：筛选的类型数组
  const [filterTypes, setFilterTypes] = useState<Marker["type"][]>([]);
  // 新增状态：选中的标记ID
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  // 搜索历史类型与状态（本地存储）
  type SearchHistoryItem = {
    id: string;
    name: string;
    location: { lng: number; lat: number };
    address?: string;
  };
  const HISTORY_KEY = "place_search_history_v1";
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [historyVisible, setHistoryVisible] = useState<boolean>(false);
  // 路线规划面板状态
  const [showRoutePanel, setShowRoutePanel] = useState<boolean>(false);
  const [routeMode, setRouteMode] = useState<'driving' | 'walking' | 'transit' | 'riding' | 'electric'>('driving');
  const [originText, setOriginText] = useState<string>('');
  const [destText, setDestText] = useState<string>('');
  const [originLocation, setOriginLocation] = useState<{lng:number;lat:number} | null>(null);
  const [destLocation, setDestLocation] = useState<{lng:number;lat:number} | null>(null);
  const [waypoints, setWaypoints] = useState<Array<{id:string; name:string; location?:{lng:number;lat:number}}>>([]);
  const ROUTE_HISTORY_KEY = 'route_search_history_v1';
  const [routeHistory, setRouteHistory] = useState<any[]>([]);
  const [routePanelSearchResults, setRoutePanelSearchResults] = useState<any[]>([]);
  const [routePanelSearchVisible, setRoutePanelSearchVisible] = useState<boolean>(false);
  const [routePanelSearchTarget, setRoutePanelSearchTarget] = useState<'origin' | 'dest' | 'waypoint' | null>(null);
  const routePanelTargetRef = useRef<'origin' | 'dest' | 'waypoint' | null>(null);
  const routePanelWaypointIdRef = useRef<string | null>(null);
  // 地图中心点状态（可以被定位功能修改）
  const [mapCenter, setMapCenter] = useState<MapPosition>({
    lng: 116.3974,
    lat: 39.9093,
  });

  // 从 localStorage 加载历史
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      setSearchHistory(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setSearchHistory([]);
    }
  }, []);

  // 将历史保存到 localStorage（安全写入）
  const addToHistory = useCallback((item: SearchHistoryItem) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== item.id);
      const next = [item, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  const handleHistoryClick = useCallback((item: SearchHistoryItem) => {
    // 将选中历史项置为地图中心并添加确认标记
    setMapCenter(item.location);
    setZoom(18); // 放大到最大
    const starMarker = {
      id: `confirmed-${item.id}`,
      type: 'confirmed_place' as const,
      title: `📍 ${item.name}`,
      position: item.location,
      createdAt: new Date(),
      updatedAt: new Date(),
      data: {
        address: item.address,
        isConfirmedPlace: true
      }
    };
    setConfirmedPlaceMarker(starMarker);
    setHistoryVisible(false);
    message.success(`已移动到: ${item.name}`);
    // 把该项移动到历史顶部
    addToHistory(item);
  }, [addToHistory, setZoom]);

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      // ignore
    }
    setSearchHistory([]);
  }, []);

  const removeHistoryItem = useCallback((id: string) => {
    setSearchHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  // 路线历史管理
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ROUTE_HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      setRouteHistory(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setRouteHistory([]);
    }
  }, []);

  const addRouteHistory = useCallback((item: any) => {
    setRouteHistory((prev: any[]) => {
      // Normalize compare: prefer coordinates if available, fallback to texts
      const isSame = (a: any, b: any) => {
        if (a?.originLocation && b?.originLocation && a?.destLocation && b?.destLocation) {
          return a.originLocation.lng === b.originLocation.lng &&
                 a.originLocation.lat === b.originLocation.lat &&
                 a.destLocation.lng === b.destLocation.lng &&
                 a.destLocation.lat === b.destLocation.lat;
        }
        // fallback to text comparison (trimmed)
        const at = (a.originText || '').toString().trim();
        const ad = (a.destText || '').toString().trim();
        const bt = (b.originText || '').toString().trim();
        const bd = (b.destText || '').toString().trim();
        return at === bt && ad === bd;
      };

      // Remove existing duplicate (same origin/dest) if present
      const filtered = prev.filter(h => !isSame(h, item));
      const next = [item, ...filtered].slice(0, 12);
      try { localStorage.setItem(ROUTE_HISTORY_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
      return next;
    });
  }, []);

  const removeRouteHistoryItem = useCallback((id: string) => {
    setRouteHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      try { localStorage.setItem(ROUTE_HISTORY_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
      return next;
    });
  }, []);

  // 搜索结果标记
  const [searchMarkers, setSearchMarkers] = useState<any[]>([]);
  // 确认的地点标记（星号）
  const [confirmedPlaceMarker, setConfirmedPlaceMarker] = useState<any>(null);

  // 新增右上工具栏的状态：路况、测距、地铁
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [showSubway, setShowSubway] = useState<boolean>(false);
  // 地铁查询弹窗状态
  const [showSubwayModal, setShowSubwayModal] = useState<boolean>(false);
  // 卫星模式与路网显示状态
  const [showSatelliteMode, setShowSatelliteMode] = useState<boolean>(false);
  const [showSatelliteRoads, setShowSatelliteRoads] = useState<boolean>(false);
  const prevMapTypeRef = useRef<'normal' | 'satellite' | '3d'>('normal');
  // 城市级联选择数据
  const [cascaderOptions, setCascaderOptions] = useState<any[]>([]);
  const [cascaderLoading, setCascaderLoading] = useState<boolean>(false);
  // 城市弹窗状态与搜索
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [currentCity, setCurrentCity] = useState<string>('深圳');
  const [currentCityAdcode, setCurrentCityAdcode] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherInfo, setWeatherInfo] = useState<any | null>(null);
  // 天气图标映射
  const getWeatherIcon = (desc?: string) => {
    if (!desc) return '☀️';
    if (desc.includes('晴')) return '☀️';
    if (desc.includes('多云') || desc.includes('阴')) return '⛅';
    if (desc.includes('雨')) return '🌧️';
    if (desc.includes('雪')) return '❄️';
    if (desc.includes('雾') || desc.includes('霾')) return '🌫️';
    return '☀️';
  };

  // 路径规划相关状态
  const [routeResult, setRouteResult] = useState<RouteServiceResult | null>(null);
  const [routePlanning, setRoutePlanning] = useState(false);
  const [routeParams, setRouteParams] = useState<RoutePlanningParams | null>(null);

  // 使用定位 Hook
  const {
    position,
    loading: locationLoading,
    error: locationError,
    refetch: getCurrentPosition,
  } = useGeolocation();

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // 使用useMemo优化过滤逻辑，避免每次渲染都重新计算
  const filteredMarkers = React.useMemo(() => {
    // 对markers数组进行过滤
    const filtered = markers.filter((marker) => {
      // 检查名称是否匹配搜索查询（不区分大小写）
      const matchesSearch =
        !searchQuery ||
        marker.title.toLowerCase().includes(searchQuery.toLowerCase());

      // 检查类型是否在筛选类型中（如果没有筛选类型则全部匹配）
      const matchesType =
        filterTypes.length === 0 || filterTypes.includes(marker.type);

      // 只有名称和类型都匹配才保留
      return matchesSearch && matchesType;
    });


    return filtered;
  }, [markers, searchQuery, filterTypes]); // 依赖数组，相关状态改变时重新计算

  // 更新标记点击处理
  const handleMarkerClick = useCallback((marker: Marker) => {
    // 从最新的store数据中获取标记信息，确保数据一致性
    const latestMarker = markers.find(m => m.id === marker.id);
    if (latestMarker) {
      // 设置选中的标记（用于弹窗显示）
      setSelectedMarker(latestMarker);
      // 设置选中的标记ID（用于列表高亮）
      setSelectedMarkerId(latestMarker.id);
    }
  }, [markers]);

  // 弹窗关闭处理
  const handleInfoWindowClose = useCallback(() => {
    setSelectedMarker(null);
    setSelectedMarkerId(null);
  }, []);

    // 导航功能
    const handleNavigateToMarker = useCallback((marker: Marker) => {
      const { lat, lng } = marker.position;
  
      try {
        // 检测是否为移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
        let url = '';
  
        if (isMobile) {
          // 移动设备：尝试使用系统地图应用
          if (/Android/i.test(navigator.userAgent)) {
            // Android设备优先使用百度地图，其次高德地图
            url = `bdapp://map/direction?destination=${lat},${lng}&mode=driving&coord_type=gcj02`;
            // 如果百度地图不可用，尝试高德地图
            setTimeout(() => {
              if (document.hidden) return; // 如果页面被隐藏，说明地图应用已打开
              url = `amapuri://route/plan/?dlat=${lat}&dlon=${lng}&dname=${encodeURIComponent(marker.title)}&dev=0&t=0`;
              window.location.href = url;
            }, 1000);
          } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            // iOS设备使用苹果地图
            url = `maps:///?daddr=${lat},${lng}&dirflg=d`;
          }
        } else {
          // 桌面设备：使用网页地图
          // 优先尝试高德地图网页版
          url = `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(marker.title)}&mode=car&policy=1&src=mypage&coordinate=gaode&callnative=0`;
        }
  
        // 尝试打开地图应用
        if (url) {
          window.open(url, '_blank');
        }
  
        message.success(`正在导航到: ${marker.title}`);
      } catch (error) {
        // 如果地图应用不可用，提供降级方案
        navigator.clipboard.writeText(`${lat}, ${lng}`).then(() => {
          message.warning(`地图应用不可用，已复制坐标到剪贴板: ${lat}, ${lng}`);
        }).catch(() => {
          message.warning(`请手动复制坐标: ${lat}, ${lng}`);
        });
      }
    }, []);

      // 拨打电话功能
  const handleCallMarker = useCallback((marker: Marker) => {
    const phone = marker.data?.phone;
    if (!phone) {
      message.warning('该标记没有联系电话');
      return;
    }
  
    // 在移动设备上直接拨打电话
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = `tel:${phone}`;
    } else {
      // 在桌面端复制电话号码
      navigator.clipboard.writeText(phone).then(() => {
        message.success(`电话号码 ${phone} 已复制`);
      });
    }
  }, []);
  
  // 访问网站功能
  const handleVisitWebsite = useCallback((marker: Marker) => {
    const website = marker.data?.website;
    if (!website) {
      message.warning('该标记没有网站链接');
      return;
    }
  
    // 检查URL是否包含协议
    let url = website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
  
    window.open(url, '_blank');
    message.success('正在打开网站...');
  }, []);
  // 弹窗操作处理
  const handleInfoWindowAction = useCallback((action: string, marker: Marker) => {
    switch (action) {
      case 'navigate':
        // 导航到标记位置 - 调用实际的导航功能
        handleNavigateToMarker(marker);
        break;
      case 'call':
        // 拨打电话 - 调用实际的拨打电话功能
        handleCallMarker(marker);
        break;
      case 'website':
        // 访问网站 - 调用实际的访问网站功能
        handleVisitWebsite(marker);
        break;
      default:
        // 未知操作，静默处理
        break;
    }
  }, [handleNavigateToMarker, handleCallMarker, handleVisitWebsite]);

  // 处理搜索的回调函数
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query); // 更新搜索查询状态
  }, []);

  // 处理类型筛选的回调函数
  const handleFilter = useCallback((types: Marker["type"][]) => {
    setFilterTypes(types); // 更新筛选类型状态
  }, []);

  // 处理清除所有筛选的回调函数
  const handleClearFilters = useCallback(() => {
    setSearchQuery(""); // 清空搜索查询
    setFilterTypes([]); // 清空类型筛选
  }, []);

  // 处理地点选择（点击搜索结果）
  const handlePlaceSelect = useCallback((place: any) => {
    // 只设置选中状态，不立即跳转地图
    // 用户可以通过回车确认来跳转
  }, []);

  // 处理地点确认（回车确定）
  const handlePlaceConfirm = useCallback((place: any) => {
    // 设置地图中心点为确认的地点
    setMapCenter(place.location);
    setZoom(18); // 放大到最大

    // 清除之前的搜索标记和确认标记
    setSearchMarkers([]);
    setConfirmedPlaceMarker(null);

    // 添加星号标记作为确认地点
    const starMarker = {
      id: `confirmed-${place.id}`,
      type: 'confirmed_place' as const,
      title: `📍 ${place.name}`,
      position: place.location,
      createdAt: new Date(),
      updatedAt: new Date(),
      data: {
        address: place.address,
        phone: place.tel,
        description: place.tag || place.type,
        isConfirmedPlace: true // 标记这是一个确认的地点
      }
    };

    setConfirmedPlaceMarker(starMarker);
    message.success(`已锁定地点: ${place.name}`);
    // 保存到搜索历史（带容错）
    try {
      const histItem = {
        id: place.id || `${place.name}-${Date.now()}`,
        name: place.name || place.formatted_address || place.address || '地点',
        location: place.location,
        address: place.address || place.formatted_address || ''
      };
      addToHistory(histItem);
    } catch (e) {
      // ignore
    }
  }, []);

  // 处理删除标记的回调函数
  const handleDeleteMarkers = useCallback(
    (ids: string[]) => {
      // 遍历所有要删除的ID，逐个调用删除action
      ids.forEach((id) => {
        removeMarker(id);
      });
    },
    [removeMarker],
  );

  // 处理更新标记的回调函数
  const handleUpdateMarker = useCallback(
    (id: string, updates: Partial<Marker>) => {
      updateMarker(id, updates); // 调用store的更新action
    },
    [updateMarker],
  );

  // 处理地图点击添加标记的回调函数
  const handleMapClick = useCallback(
    (e: any) => {
      const { lnglat } = e; // 从事件对象中获取经纬度
      const position = { lng: lnglat.lng, lat: lnglat.lat }; // 构造位置对象

      // 调用添加标记action
      addMarker({
        position, // 位置信息
        title: `新标记 ${markers.length + 1}`, // 默认标题，包含序号
        type: "store", // 默认类型为门店
      });

      // 显示成功消息提示用户
      message.success("标记已添加，点击编辑按钮修改信息");
    },
    [addMarker, markers.length],
  );
  
  // 地图准备完成的回调
  const handleMapReady = useCallback((map: any) => {
    // 地图准备就绪，可以在这里添加初始化逻辑
  }, []);

  // 卫星模式下路网显示效果联动（尝试添加/移除覆盖层，带兼容性保护）
  React.useEffect(() => {
    const map = (window as any).currentMap;
    const AMap = (window as any).AMap;
    if (!map) return;

    try {
      if (showSatelliteMode && showSatelliteRoads) {
        // 如果已经存在 roadLayer 则跳过
        if (!map.__roadLayer) {
          // 试着使用 TileLayer 插件作为通用覆盖层（兼容性较好）
          if (AMap && (AMap as any).TileLayer) {
            try {
              const roadLayer = new (AMap as any).TileLayer();
              map.add(roadLayer);
              map.__roadLayer = roadLayer;
            } catch (e) {
              console.warn('添加路网覆盖失败:', e);
            }
          } else {
            // 作为回退，尝试通过 setMapStyle 切换到一个可能包含路网的样式
            if (typeof map.setMapStyle === 'function') {
              try { map.setMapStyle('amap://styles/darkblue'); } catch (e) { /* ignore */ }
            }
          }
        }
      } else {
        // 移除已有的路网覆盖
        if (map.__roadLayer && typeof map.remove === 'function') {
          try { map.remove(map.__roadLayer); delete map.__roadLayer; } catch (e) { /* ignore */ }
        }
        // 如果当前为卫星且没有 roadLayer，确保地图仍为卫星底图样式
        if (showSatelliteMode && typeof map.setMapStyle === 'function') {
          try { map.setMapStyle('amap://styles/darkblue'); } catch (e) { /* ignore */ }
        }
      }
    } catch (error) {
      console.warn('处理路网显示时发生错误:', error);
    }
    // 仅在以下状态变化时触发
  }, [showSatelliteMode, showSatelliteRoads]);

  // 加载高德区划数据并转换为级联选择器格式（只请求中国三级数据）
  useEffect(() => {
    const loadDistricts = async () => {
      const key = import.meta.env.VITE_AMAP_KEY;
      if (!key) {
        console.warn('VITE_AMAP_KEY 未配置，无法加载区划数据');
        return;
      }
      setCascaderLoading(true);
      try {
        const url = `https://restapi.amap.com/v3/config/district?key=${key}&keywords=中国&subdistrict=3`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status !== '1') {
          console.warn('高德区划接口返回错误', data);
          setCascaderOptions([]);
          return;
        }
        const convert = (districts: any[]): any[] => {
          return (districts || []).map(d => ({
            label: d.name,
            // value 包含 adcode 与 center，便于选择后定位
            value: `${d.adcode || d.name}|${d.center || ''}`,
            children: convert(d.districts)
          }));
        };
        const options = convert(data.districts || []);
        setCascaderOptions(options);
      } catch (e) {
        console.warn('加载区划数据失败', e);
        setCascaderOptions([]);
      } finally {
        setCascaderLoading(false);
      }
    };
    loadDistricts();
  }, []);

  // 根据 adcode 请求天气信息（使用优先的环境变量 key，回退到给定的 key）
  const fetchWeatherForAdcode = useCallback(async (adcode: string | null) => {
    if (!adcode) return;
    const key = import.meta.env.VITE_AMAP_KEY || '49bfb83db90187047c48ccc2e711ea32';
    setWeatherLoading(true);
    try {
      // 高德天气API，extensions=base 返回实时天气（lives）
      const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${adcode}&extensions=base`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.lives && data.lives.length > 0) {
        setWeatherInfo(data.lives[0]);
      } else {
        setWeatherInfo(null);
        console.warn('天气接口未返回数据', data);
      }
    } catch (e) {
      console.warn('获取天气失败', e);
      setWeatherInfo(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // 当 cascaderOptions 加载完成后，尝试找到默认 currentCity 的 adcode 并加载天气
  useEffect(() => {
    if (!cascaderOptions || cascaderOptions.length === 0) return;
    // 递归查找 label === currentCity 的节点，优先市级
    const findAdcode = (nodes: any[]): string | null => {
      for (const p of nodes) {
        if (p.label === currentCity) {
          const parts = (p.value || '').split('|');
          if (parts[0]) return parts[0];
        }
        if (p.children) {
          const found = findAdcode(p.children);
          if (found) return found;
        }
      }
      return null;
    };
    const adcode = findAdcode(cascaderOptions);
    if (adcode) {
      setCurrentCityAdcode(adcode);
      fetchWeatherForAdcode(adcode);
    }
  }, [cascaderOptions, currentCity, fetchWeatherForAdcode]);

  // 当用户选择新的城市 adcode 时，加载天气
  useEffect(() => {
    if (currentCityAdcode) {
      fetchWeatherForAdcode(currentCityAdcode);
    }
  }, [currentCityAdcode, fetchWeatherForAdcode]);

  // 处理定位按钮点击
  const handleLocateMe = useCallback(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);


  const handleMarkerDragEnd = useCallback(
    (marker: Marker, newPosition: { lng: number; lat: number }) => {
      // 更新标记位置到 store
      updateMarker(marker.id, {
        position: newPosition,
        updatedAt: new Date(),
      });

      message.success("标记位置已更新");
    },
    [updateMarker],
  );

  

  



  // 路径规划表单处理函数
  const handlePlanRoute = useCallback(async (params: RoutePlanningParams): Promise<RouteServiceResult | null> => {
    setRoutePlanning(true);   // 设置loading状态
    setRouteParams(params);   // 保存规划参数（用于路径绘制）

    try {
      // 根据模式调用不同的规划服务
      const result: RouteServiceResult = params.mode === 'driving'
        ? await planDrivingRoute(params.origin, params.destination)
        : await planWalkingRoute(params.origin, params.destination);

      // 保存规划结果
      setRouteResult(result);

      // 根据结果显示不同消息
      if (result.status === RouteServiceStatus.SUCCESS) {
        message.success(`${params.mode === 'driving' ? '🚗 驾车' : params.mode === 'walking' ? '🚶 步行' : '出行'}规划成功！`);
      } else {
        // 不直接弹出错误，这里交给调用方决定是否重试或提示
        console.warn('规划返回非成功状态', result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error(`规划过程中发生错误: ${errorMessage}`);
      return null;
    } finally {
      setRoutePlanning(false);
    }
  }, []);

  // 当用户切换路线模式并且已有起终点与已有规划结果时，自动重新规划路线
  useEffect(() => {
    const tryReplan = async () => {
      if (!originLocation || !destLocation) return;
      if (!routeResult) return; // only replan if there's an existing result (user had planned before)

      message.info('出行方式已切换，正在重新规划路线...');
      const res = await handlePlanRoute({ origin: originLocation, destination: destLocation, mode: routeMode } as any);
      if (res && res.status === RouteServiceStatus.SUCCESS) {
        // 保存一次历史，标记为当前 mode
        addRouteHistory({
          id: `${originText}=>${destText}-${Date.now()}`,
          originText, destText, originLocation, destLocation, mode: routeMode
        });
      } else if (res && res.status === RouteServiceStatus.ERROR) {
        const err = res.error?.message || res.error?.code || '未知错误';
        message.error(`切换出行方式后规划失败: ${err}`);
      }
    };

    tryReplan();
    // only trigger when routeMode changes
  }, [routeMode]);

  // 定位成功后更新地图中心，并设置起点为用户位置
  React.useEffect(() => {
    if (position) {
      setCenter(position); // 更新全局store中的中心点
      setMapCenter(position); // 更新本地地图中心状态
      setZoom(18); // 放大到最大缩放级别
      // 如果起点还未设置，自动将起点设为用户位置
      if (!originLocation) {
        setOriginText('我的位置');
        setOriginLocation(position);
      }
      message.success('定位成功，已移动到您的位置');
    }
  }, [position, setCenter, originLocation]);

  // 添加测试标记功能（修正位置计算）
  const handleAddTestMarker = useCallback(() => {
    // 在当前地图中心附近随机位置添加标记
    const offset = 0.005; // 约500米偏移
    const randomLng = mapCenter.lng + (Math.random() - 0.5) * offset * 2;
    const randomLat = mapCenter.lat + (Math.random() - 0.5) * offset * 2;

    // 随机选择标记类型
    const markerTypes: Marker["type"][] = ["store", "warehouse", "vehicle", "user"];
    const randomIndex = Math.floor(Math.random() * markerTypes.length);
    const selectedType = markerTypes[randomIndex];


    addMarker({
      position: { lng: randomLng, lat: randomLat },
      title: `测试标记 ${markers.length + 1}`,
      type: selectedType,
    });

    message.success(`测试标记已添加 (类型: ${selectedType})`);
  }, [mapCenter, markers.length, addMarker]);

  // 查看所有标记 - 调整地图视角
  const handleViewAllMarkers = useCallback(() => {
    if (markers.length === 0) {
      message.warning("没有标记可以查看");
      return;
    }

    // 通过调用地图实例的方法直接调整视角
    const map = (window as any).currentMap;
    if (map) {
      if (markers.length === 1) {
        // 只有一个标记
        const marker = markers[0];
        map.setCenter([marker.position.lng, marker.position.lat]);
        map.setZoom(15);
      } else {
        // 多个标记，计算边界
        let minLng = Infinity,
          maxLng = -Infinity;
        let minLat = Infinity,
          maxLat = -Infinity;

        markers.forEach((marker) => {
          minLng = Math.min(minLng, marker.position.lng);
          maxLng = Math.max(maxLng, marker.position.lng);
          minLat = Math.min(minLat, marker.position.lat);
          maxLat = Math.max(maxLat, marker.position.lat);
        });

        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;

        map.setCenter([centerLng, centerLat]);

        // 根据范围大小设置缩放级别
        const lngRange = maxLng - minLng;
        const latRange = maxLat - minLat;
        const maxRange = Math.max(lngRange, latRange);

        let zoom = 10;
        if (maxRange < 0.01) zoom = 15;
        else if (maxRange < 0.05) zoom = 13;
        else if (maxRange < 0.1) zoom = 11;
        else if (maxRange < 0.5) zoom = 9;
        else zoom = 7;

        map.setZoom(zoom);
      }

      message.success(`调整视角显示 ${markers.length} 个标记`);
    } else {
      message.error("地图未就绪，无法调整视角");
    }
  }, [markers]);
  // 监听定位错误的变化
  React.useEffect(() => {
    if (locationError) {
      console.error("❌ 定位失败:", locationError);
      message.error(`定位失败: ${locationError}`);
    }
  }, [locationError]);

  return (
    <div>
      {/* <Divider /> */}

          {/* 🎨 重新设计的现代化布局 */}
      <Row gutter={16}>
        <Col span={24}>

          {/* 🗺️ 主要地图区域 - 全屏地图布局 */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }}>
            {/* 左上：搜索框（固定） */}
            <div style={{
              position: 'absolute',
              left: 12,
              top: 12,
              zIndex: 1200,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.98)',
                borderRadius: 6,
                padding: '6px 10px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
              }}>
                {/* 城市按钮与天气 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Popover
                    open={showCityDropdown}
                    onOpenChange={(open) => setShowCityDropdown(open)}
                    trigger="click"
                    placement="bottomLeft"
                    content={
                      <div style={{ width: 520, padding: 12 }}>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <Input.Search
                              placeholder="搜索城市"
                              value={citySearchQuery}
                              onChange={(e) => setCitySearchQuery(e.target.value)}
                              onSearch={(v) => setCitySearchQuery(v)}
                              enterButton
                            />
                          </div>
                          <div style={{ width: 200 }}>
                            <Spin spinning={cascaderLoading} size="small">
                              <Cascader
                                options={cascaderOptions}
                                placeholder="选择城市/区县"
                                style={{ width: '100%' }}
                                expandTrigger="hover"
                                changeOnSelect
                                onChange={(values: any[], selectedOptions: any[]) => {
                                  if (!values || values.length === 0) return;
                                  const last = values[values.length - 1] as string;
                                  const parts = last.split('|');
                                  const center = parts[1] || '';
                                  if (center) {
                                    const [lngStr, latStr] = center.split(',');
                                    const lng = parseFloat(lngStr);
                                    const lat = parseFloat(latStr);
                                    if (!isNaN(lng) && !isNaN(lat)) {
                                      setMapCenter({ lng, lat });
                                      setZoom(11);
                                      const label = selectedOptions?.[selectedOptions.length-1]?.label || '';
                                      setCurrentCity(label);
                                      const adcode = (values[values.length-1] || '').toString().split('|')[0];
                                      if (adcode) setCurrentCityAdcode(adcode);
                                      setShowCityDropdown(false);
                                    }
                                  }
                                }}
                              />
                            </Spin>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                          {['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','W','X','Y','Z'].map(letter => (
                            <Button key={letter} size="small" style={{ padding: '2px 6px' }}>{letter}</Button>
                          ))}
                        </div>

                        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                          {(cascaderOptions || []).filter((p: any) => {
                            if (!citySearchQuery) return true;
                            return p.label.includes(citySearchQuery);
                          }).map((province: any) => (
                            <div key={province.value} style={{ marginBottom: 12 }}>
                              <div style={{ fontWeight: 600, marginBottom: 6 }}>{province.label}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {(province.children || []).map((city: any) => {
                                  return (
                                    <Button
                                      key={city.value}
                                      size="small"
                                      onClick={() => {
                                        const parts = (city.value || '').split('|');
                                        const adcode = parts[0] || '';
                                        const center = parts[1] || '';
                                        if (center) {
                                          const [lngStr, latStr] = center.split(',');
                                          const lng = parseFloat(lngStr);
                                          const lat = parseFloat(latStr);
                                          if (!isNaN(lng) && !isNaN(lat)) {
                                            setMapCenter({ lng, lat });
                                            setZoom(11);
                                            setCurrentCity(city.label);
                                            if (adcode) setCurrentCityAdcode(adcode);
                                            setShowCityDropdown(false);
                                          }
                                        }
                                      }}
                                    >
                                      {city.label}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                  >
                    <Button size="small" onClick={() => setShowCityDropdown(v => !v)}>
                      <span style={{ color: '#1890ff' }}>{currentCity}</span> ▾
                    </Button>
                  </Popover>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6, background: '#fff' }}>
                    <div style={{ fontSize: 18 }}>{getWeatherIcon(weatherInfo?.weather)}</div>
                    <div style={{ fontSize: 12, color: '#333' }}>
                      <div style={{ fontWeight: 600 }}>{weatherInfo ? `${weatherInfo.temperature}°C` : (weatherLoading ? '加载中' : '--') }</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{weatherInfo ? `${weatherInfo.weather}` : ''}</div>
                    </div>
                  </div>
                </div>

                {/* 搜索框（包含历史下拉） */}
                <div
                  style={{ minWidth: 260, position: 'relative' }}
                  tabIndex={-1}
                  onMouseDown={() => setHistoryVisible(true)}
                  onClickCapture={() => setHistoryVisible(true)}
                  onFocusCapture={() => setHistoryVisible(true)}
                  onBlur={() => setTimeout(() => setHistoryVisible(false), 150)}
                >
                  <PlaceSearch
                    style={{ width: '100%' }}
                    onPlaceSelect={(place: any) => {
                      // 将选择的 place 临时加入历史顶部（不会重复）
                      try {
                        const histItem = {
                          id: place.id || `${place.name}-${Date.now()}`,
                          name: place.name,
                          location: place.location,
                          address: place.address || ''
                        };
                        addToHistory(histItem);
                        setSearchQuery(place.name || '');
                      } catch (e) { /* ignore */ }
                    }}
                    onPlaceConfirm={(place: any) => {
                      // 使用现有的确认处理函数
                      handlePlaceConfirm(place);
                    }}
                  />

                  {/* 历史与分类下拉 - 始终渲染，通过样式控制展开收起以实现动画 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 44,
                      left: 0,
                      width: '100%',
                      background: '#fff',
                      borderRadius: 6,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                      zIndex: 1300,
                      maxHeight: historyVisible ? 320 : 0,
                      opacity: historyVisible ? 1 : 0,
                      transform: historyVisible ? 'translateY(0)' : 'translateY(-4px)',
                      transition: 'max-height 240ms ease, opacity 180ms ease, transform 180ms ease',
                      overflow: 'hidden',
                      pointerEvents: historyVisible ? 'auto' : 'none',
                    }}
                  >
                    <div style={{ padding: historyVisible ? 8 : 0 }}>
                      {/* 顶部四个分类图标 */}
                      <div style={{ display: 'flex', gap: 8, padding: '6px 4px', marginBottom: 6 }}>
                        {[
                          { key: 'hotel', label: '酒店', emoji: '🏨' },
                          { key: 'food', label: '美食', emoji: '🍽️' },
                          { key: 'poi', label: '景点', emoji: '🏛️' },
                          { key: 'neigh', label: '小区', emoji: '🏘️' },
                        ].map((c) => (
                          <div key={c.key} onMouseDown={(e) => e.preventDefault()} onClick={() => {
                            setSearchQuery(c.label);
                            message.info(`选择分类: ${c.label}`);
                            // optional: focus the PlaceSearch input if it exposes a ref
                          }} style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 6, cursor: 'pointer' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                              <span>{c.emoji}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#333' }}>{c.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* 搜索记录标题与清空 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 6px' }}>
                        <div style={{ fontWeight: 600 }}>搜索记录</div>
                        <Button size="small" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); clearHistory(); }}>清空</Button>
                      </div>

                      {/* 历史列表（可为空） */}
                      <div style={{ maxHeight: 180, overflow: 'auto' }}>
                        {(searchHistory && searchHistory.length > 0) ? (
                          (searchHistory || []).map((h) => (
                            <div
                              key={h.id}
                              onMouseDown={(e) => { e.preventDefault(); handleHistoryClick(h); }}
                              style={{ padding: '8px 6px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                              <div>
                                <div style={{ fontSize: 13 }}>{h.name}</div>
                                {h.address && <div style={{ fontSize: 12, color: '#888' }}>{h.address}</div>}
                              </div>
                              <Button
                                size="small"
                                danger
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); removeHistoryItem(h.id); }}
                                style={{ marginLeft: 8 }}
                              >
                                ×
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '8px 6px', color: '#888' }}>暂无搜索记录</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                                  {/* 路线按钮（搜索框右侧） */}
                                  <div style={{ display: 'inline-block', marginLeft: 8 }}>
                    <Button size="small" onClick={() => setShowRoutePanel(v => !v)} icon={<EnvironmentOutlined />}>路线</Button>

                    {/* 路线面板 */}
                    <div style={{
                      position: 'absolute',
                      left: 12,
                      top: 64,
                      width: 420,
                      background: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                      zIndex: 1400,
                      overflow: 'hidden',
                      transition: 'opacity 200ms ease, transform 200ms ease',
                      opacity: showRoutePanel ? 1 : 0,
                      transform: showRoutePanel ? 'translateY(0)' : 'translateY(-6px)',
                      pointerEvents: showRoutePanel ? 'auto' : 'none',
                    }}>
                      <div style={{ padding: 12 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <Button size="small" type={routeMode === 'driving' ? 'primary' : 'default'} onClick={() => setRouteMode('driving')} icon={<CarOutlined />}>驾车</Button>
                          <Button size="small" type={routeMode === 'transit' ? 'primary' : 'default'} onClick={() => setRouteMode('transit')} icon={<GlobalOutlined />}>公交</Button>
                          <Button size="small" type={routeMode === 'riding' ? 'primary' : 'default'} onClick={() => setRouteMode('riding')} icon={<AimOutlined />}>骑行</Button>
                          <Button size="small" type={routeMode === 'electric' ? 'primary' : 'default'} onClick={() => setRouteMode('electric')} icon={<AimOutlined />}>电动车</Button>
                          <div style={{ flex: 1 }} />
                          <Button size="small" onClick={() => setShowRoutePanel(false)}>×</Button>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <PlaceSearch
                              placeholder="我的位置"
                              value={originText}
                              onValueChange={(v: string) => setOriginText(v)}
                              suppressDropdown
                              onResultsChange={(results: any[], visible: boolean) => {
                                console.log('RoutePanel origin onResultsChange:', results?.length, 'visible=', visible);
                                if (visible) {
                                  routePanelTargetRef.current = 'origin';
                                  setRoutePanelSearchTarget('origin');
                                  setRoutePanelSearchResults(results || []);
                                  setRoutePanelSearchVisible(true);
                                } else {
                                  // only hide if current target is origin (avoid being overridden by sibling)
                                  if (routePanelTargetRef.current === 'origin') {
                                    setRoutePanelSearchResults([]);
                                    setRoutePanelSearchVisible(false);
                                    routePanelTargetRef.current = null;
                                    setRoutePanelSearchTarget(null);
                                  }
                                }
                              }}
                              onPlaceSelect={(place: any) => {
                                setOriginText(place.name);
                                setOriginLocation(place.location);
                                // hide external results
                                setRoutePanelSearchVisible(false);
                              }}
                              onPlaceConfirm={(place: any) => {
                                setOriginText(place.name);
                                setOriginLocation(place.location);
                                setRoutePanelSearchVisible(false);
                              }}
                            />
                          </div>
                          <Button size="small" onClick={() => {
                            // 交换起终点与位置
                            const ot = originText; const dt = destText;
                            const ol = originLocation; const dl = destLocation;
                            setOriginText(dt); setDestText(ot);
                            setOriginLocation(dl); setDestLocation(ol);
                          }}>↕</Button>
                          <div style={{ flex: 1 }}>
                            <PlaceSearch
                              placeholder="终点 请输入终点"
                              value={destText}
                              onValueChange={(v: string) => setDestText(v)}
                              suppressDropdown
                              onResultsChange={(results: any[], visible: boolean) => {
                                console.log('RoutePanel dest onResultsChange:', results?.length, 'visible=', visible);
                                if (visible) {
                                  routePanelTargetRef.current = 'dest';
                                  setRoutePanelSearchTarget('dest');
                                  setRoutePanelSearchResults(results || []);
                                  setRoutePanelSearchVisible(true);
                                } else {
                                  if (routePanelTargetRef.current === 'dest') {
                                    setRoutePanelSearchResults([]);
                                    setRoutePanelSearchVisible(false);
                                    routePanelTargetRef.current = null;
                                    setRoutePanelSearchTarget(null);
                                  }
                                }
                              }}
                              onPlaceSelect={(place: any) => {
                                setDestText(place.name);
                                setDestLocation(place.location);
                                setRoutePanelSearchVisible(false);
                              }}
                              onPlaceConfirm={(place: any) => {
                                setDestText(place.name);
                                setDestLocation(place.location);
                                setRoutePanelSearchVisible(false);
                              }}
                            />
                          </div>
                          <Button size="small" onClick={() => {
                            // 添加途经点（在中间）
                            const id = `wp-${Date.now()}`;
                            setWaypoints(prev => {
                              const next = [...prev];
                              next.push({ id, name: '', location: undefined });
                              return next;
                            });
                          }}>+</Button>
                        </div>

                        {/* 途经点列表 */}
                        {waypoints.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            {waypoints.map((w, idx) => (
                              <div key={w.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                                <PlaceSearch
                                  placeholder="请输入途径点"
                                  value={w.name || ''}
                                  onValueChange={(v: string) => {
                                    setWaypoints(prev => prev.map(p => p.id === w.id ? { ...p, name: v } : p));
                                  }}
                                  suppressDropdown
                                  onResultsChange={(results: any[], visible: boolean) => {
                                    if (visible) {
                                      routePanelTargetRef.current = 'waypoint';
                                      routePanelWaypointIdRef.current = w.id;
                                      setRoutePanelSearchTarget('waypoint');
                                      setRoutePanelSearchResults(results || []);
                                      setRoutePanelSearchVisible(true);
                                    } else {
                                      if (routePanelTargetRef.current === 'waypoint' && routePanelWaypointIdRef.current === w.id) {
                                        setRoutePanelSearchResults([]);
                                        setRoutePanelSearchVisible(false);
                                        routePanelTargetRef.current = null;
                                        routePanelWaypointIdRef.current = null;
                                        setRoutePanelSearchTarget(null);
                                      }
                                    }
                                  }}
                                  style={{ flex: 1 }}
                                />
                                <Button size="small" danger onClick={() => setWaypoints(prev => prev.filter(p => p.id !== w.id))}>删除</Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <Button size="small" onClick={() => setShowRoutePanel(false)}>取消</Button>
                          <Button size="small" type="primary" onClick={async () => {
                            // 提交规划：需要 originLocation & destLocation
                            if (!originLocation || !destLocation) {
                              message.warning('请先通过搜索选择起点与终点以获得坐标信息');
                              return;
                            }
                            // 筛选出有效的途径点（有位置信息的）
                            const validWaypoints = waypoints.filter(w => w.location).map(w => w.location!);
                            const params: RoutePlanningParams = {
                              origin: originLocation,
                              destination: destLocation,
                              mode: routeMode,
                              waypoints: validWaypoints.length > 0 ? validWaypoints : undefined,
                            } as any;
                            await handlePlanRoute(params);
                            // 保存历史
                            addRouteHistory({
                              id: `${originText}=>${destText}-${Date.now()}`,
                              originText, destText, originLocation, destLocation, mode: routeMode
                            });
                            setShowRoutePanel(false);
                          }}>{routeMode === 'driving' ? '开车去' : routeMode === 'transit' ? '公交去' : routeMode === 'riding' ? '骑行去' : routeMode === 'electric' ? '电动车去' : '步行去'}</Button>
                        </div>

                        {/* 路线搜索记录 或 输入时显示的搜索建议 */}
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>{routePanelSearchVisible ? '搜索结果' : '路线搜索记录'}</div>
                          <div style={{ maxHeight: 160, overflow: 'auto' }}>
                            {routePanelSearchVisible ? (
                              (routePanelSearchResults || []).length > 0 ? (routePanelSearchResults || []).map((p: any) => (
                                <div key={p.id} style={{ padding: '8px 6px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }} onMouseDown={(e) => { e.preventDefault();
                                  if (routePanelSearchTarget === 'origin') {
                                    setOriginText(p.name); setOriginLocation(p.location);
                                  } else if (routePanelSearchTarget === 'waypoint' && routePanelWaypointIdRef.current) {
                                    setWaypoints(prev => prev.map(wp =>
                                      wp.id === routePanelWaypointIdRef.current ? { ...wp, name: p.name, location: p.location } : wp
                                    ));
                                  } else {
                                    setDestText(p.name); setDestLocation(p.location);
                                  }
                                  setRoutePanelSearchVisible(false);
                                }}>
                                  <div style={{ fontSize: 13 }}>{p.name}</div>
                                  {p.address && <div style={{ fontSize: 12, color: '#888' }}>{p.address}</div>}
                                </div>
                              )) : <div style={{ color: '#888', padding: 6 }}>无匹配结果</div>
                            ) : (
                              (routeHistory && routeHistory.length > 0) ? routeHistory.map((r: any) => (
                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', borderBottom: '1px solid #f0f0f0' }}>
                                <div
                                    style={{ cursor: 'pointer', flex: 1 }}
                                    onMouseDown={async () => {
                                      if (r.originLocation && r.destLocation) {
                                        setOriginLocation(r.originLocation); setDestLocation(r.destLocation);
                                        setOriginText(r.originText || '起点'); setDestText(r.destText || '终点');
                                        setMapCenter(r.originLocation);
                                        setZoom(13);

                                        // 直接触发规划，使用当前面板选择的 mode
                                        const res = await handlePlanRoute({ origin: r.originLocation, destination: r.destLocation, mode: routeMode } as any);
                                        // 如果规划失败且错误为 OVER_DIRECTION_RANGE，尝试驾车作为回退
                                        if (res && res.status !== RouteServiceStatus.SUCCESS) {
                                          const errCode = res.error?.code || res.error?.message;
                                          if (errCode === 'OVER_DIRECTION_RANGE' && routeMode !== 'driving') {
                                            message.warning('当前出行方式超出可行范围，尝试使用驾车规划...');
                                            const fallback = await handlePlanRoute({ origin: r.originLocation, destination: r.destLocation, mode: 'driving' } as any);
                                            if (fallback && fallback.status === RouteServiceStatus.SUCCESS) {
                                              setRouteMode('driving');
                                              addRouteHistory({
                                                id: `${r.originText}=>${r.destText}-${Date.now()}`,
                                                originText: r.originText, destText: r.destText, originLocation: r.originLocation, destLocation: r.destLocation, mode: 'driving'
                                              });
                                              message.success('驾车规划成功（已回退）');
                                            } else {
                                              message.error(`规划失败: ${fallback?.error?.message || fallback?.error?.code || '未知错误'}`);
                                            }
                                          } else {
                                            message.error(`规划失败: ${res.error?.message || res.error?.code || '未知错误'}`);
                                          }
                                        }
                                      }
                                    }}
                                  >
                                    {(r.originText || '起点')} → {(r.destText || '终点')}
                                  </div>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <Button size="small" danger onClick={() => removeRouteHistoryItem(r.id)}>删除</Button>
                                  </div>
                                </div>
                              )) : <div style={{ color: '#888' }}>暂无路线记录</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>



              {/* (已改为下拉 Popover) */}
            </div>

            {/* 卫星模式下的路网选择浮层（只在卫星模式显示） */}
            {showSatelliteMode && (
              <div style={{ position: 'absolute', right: 12, top: 64, zIndex: 1201 }}>
                <Card size="small" style={{ borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: '8px' }}>
                  <Checkbox checked={showSatelliteRoads} onChange={(e) => setShowSatelliteRoads(e.target.checked)}>显示路网</Checkbox>
                </Card>
              </div>
            )}

            {/* 右上：功能区（固定） */}
            <div style={{
              position: 'absolute',
              right: 12,
              top: 12,
              zIndex: 1200,
            }}>
              <Card size="small" style={{ borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
                {/* 横向工具条样式，图标 + 文本，竖直分隔线 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '6px 8px',
                  background: 'transparent'
                }}>
                  {/* 缩放按钮 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button size="small" onClick={() => setZoom(Math.max(3, zoom - 1))}>-</Button>
                    <span style={{ minWidth: 36, textAlign: 'center', fontWeight: 'bold', color: '#1890ff' }}>{zoom}</span>
                    <Button size="small" onClick={() => setZoom(Math.min(18, zoom + 1))}>+</Button>
                  </div>

                  <div style={{ width: 1, height: 20, background: '#e6e6e6' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button type={showSatelliteMode ? "primary" : "default"} size="small" onClick={() => {
                      console.log('🎯 卫星按钮点击 - 当前状态:', {
                        showSatelliteMode,
                        mapType,
                        prevMapType: prevMapTypeRef.current
                      });

                      const map = (window as any).currentMap;
                      if (!showSatelliteMode) {
                        // 进入卫星模式，记录前一个图层类型
                        prevMapTypeRef.current = mapType || 'normal';
                        setShowSatelliteMode(true);
                        setShowSatelliteRoads(false);
                        setMapType('satellite');
                        console.log('✅ 进入卫星模式 - 设置状态:', {
                          showSatelliteMode: true,
                          mapType: 'satellite',
                          prevMapType: prevMapTypeRef.current
                        });
                      } else {
                        // 退出卫星模式，恢复之前图层并清理路网覆盖
                        setShowSatelliteMode(false);
                        setShowSatelliteRoads(false);
                        setMapType(prevMapTypeRef.current || 'normal');
                        console.log('❌ 退出卫星模式 - 恢复状态:', {
                          showSatelliteMode: false,
                          mapType: prevMapTypeRef.current || 'normal'
                        });
                        try {
                          if (map && map.__roadLayer && typeof map.remove === 'function') {
                            map.remove(map.__roadLayer);
                            delete map.__roadLayer;
                          }
                        } catch (e) {
                          console.warn('清理路网覆盖失败:', e);
                        }
                      }
                    }} icon={<RadarChartOutlined />}>
                      <span style={{ fontSize: 12 }}>卫星</span>
                    </Button>
                  </div>

                  <div style={{ width: 1, height: 20, background: '#e6e6e6' }} />

                  {/* 路况 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button size="small" type={showTraffic ? 'primary' : 'default'} onClick={() => {
                      const newValue = !showTraffic;
                      console.log('🚗 路况按钮点击 - 当前状态:', showTraffic, '-> 新状态:', newValue);
                      setShowTraffic(newValue);
                    }} icon={<CarOutlined />}>
                      <span style={{ fontSize: 12 }}>路况</span>
                    </Button>
                  </div>

                  <div style={{ width: 1, height: 20, background: '#e6e6e6' }} />

                  {/* 测距 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button size="small" type={measureMode ? 'primary' : 'default'} onClick={() => {
                      const newValue = !measureMode;
                      console.log('📏 测距按钮点击 - 当前状态:', measureMode, '-> 新状态:', newValue);
                      setMeasureMode(newValue);
                    }} icon={<AimOutlined />}>测距</Button>
                  </div>

                  <div style={{ width: 1, height: 20, background: '#e6e6e6' }} />

                  {/* 地铁 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button size="small" type={showSubwayModal ? 'primary' : 'default'} onClick={() => {
                      console.log('🚇 地铁按钮点击 - 显示地铁查询弹窗');
                      setShowSubwayModal(true);
                    }} icon={<GlobalOutlined />}>地铁</Button>
                  </div>

                  <div style={{ width: 1, height: 20, background: '#e6e6e6' }} />

                  {/* 全屏 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button size="small" onClick={() => {
                      const isFullscreen = !!document.fullscreenElement;
                      console.log('🖥️ 全屏按钮点击 - 当前状态:', isFullscreen ? '全屏' : '非全屏');
                      if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen?.();
                        console.log('✅ 请求全屏');
                      } else {
                        document.exitFullscreen?.();
                        console.log('❌ 退出全屏');
                      }
                    }} icon={<FullscreenOutlined />}>全屏</Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* 地图主体（原有地图渲染） */}
            <div style={{ width: '100%', height: '100%' }}>
              <MapContainer
                center={mapCenter}
                zoom={zoom}
                mapType={mapType}
                controls={controls}
                markers={filteredMarkers}
                onMarkerClick={handleMarkerClick}
                onMarkerDragEnd={handleMarkerDragEnd}
                onMapClick={handleMapClick}
                onMapReady={handleMapReady}
                style={{ width: '100%', height: '100%' }}
                showTraffic={showTraffic}
                showSubway={showSubway}
                measureMode={measureMode}
              >
                {/* 路径绘制层 */}
                <RouteLayer
                  polyline={routeResult?.data?.polyline || []}
                  mode={routeParams?.mode || 'driving'}
                  visible={routeResult?.status === 'success' && !!routeResult.data}
                />

                {/* 用户位置标记（星号） */}
                {position && (
                  <MarkerLayer
                    markers={[{
                      id: 'user-location',
                      type: 'user' as const,
                      title: '我的位置',
                      position: position,
                      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      data: {
                        address: '当前位置'
                      }
                    }]}
                    onMarkerClick={(marker) => {
                      message.info('这是您的当前位置');
                    }}
                  />
                )}

                {/* 途径点标记（经字） */}
                {waypoints.filter(w => w.location).length > 0 && (
                  <MarkerLayer
                    markers={waypoints.filter(w => w.location).map((w, idx) => ({
                      id: w.id,
                      type: 'warehouse' as const,
                      title: `经${idx + 1}: ${w.name}`,
                      position: w.location!,
                      icon: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="15" fill="#722ed1" stroke="#531dab" stroke-width="2"/>
                        <text x="16" y="21" font-size="12" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">经</text>
                      </svg>`)}`,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      data: {
                        address: w.name,
                        isWaypoint: true,
                        waypointIndex: idx + 1
                      }
                    }))}
                    onMarkerClick={(marker) => {
                      message.info(`途经点${marker.data?.waypointIndex}: ${marker.data?.address || ''}`);
                    }}
                  />
                )}

                {/* 调试信息：显示当前路径规划状态 */}
                {import.meta.env.DEV && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 1000
                  }}>
                    🛣️ 路径状态: {routeResult?.status || 'idle'} |
                    点数: {routeResult?.data?.polyline?.length || 0} |
                    模式: {routeParams?.mode || 'none'}
                  </div>
                )}

                {/* 搜索结果标记 */}
                {searchMarkers.length > 0 && (
                  <MarkerLayer
                    markers={searchMarkers}
                    onMarkerClick={(marker) => {
                      message.info(`${marker.title} - ${marker.data?.address || '暂无地址信息'}`);
                    }}
                  />
                )}

                {/* 确认的地点标记（星号） */}
                {confirmedPlaceMarker && (
                  <MarkerLayer
                    markers={[confirmedPlaceMarker]}
                    onMarkerClick={(marker) => {
                      message.info(`${marker.title} - ${marker.data?.address || '暂无地址信息'}`);
                    }}
                  />
                )}
              </MapContainer>

              {/* 信息弹窗 */}
              <InfoWindow
                marker={selectedMarker}
                visible={selectedMarker !== null}
                onClose={handleInfoWindowClose}
                onAction={handleInfoWindowAction}
              />

              {/* 地铁查询弹窗 */}
              <SubwayQueryModal
                visible={showSubwayModal}
                onClose={() => setShowSubwayModal(false)}
              />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default MapPlayground;
