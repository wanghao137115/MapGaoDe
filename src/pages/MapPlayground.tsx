import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, Space, Switch, Divider, Button, message, Row, Col, Typography, Tag, Badge, Collapse, CollapseProps, Checkbox, Popover, Input, Select, Slider } from "antd";
import { EnvironmentOutlined, FullscreenOutlined, GlobalOutlined, CarOutlined, RadarChartOutlined, AimOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import MapContainer from "@/components/Map/MapContainer";
import MarkerLayer from "@/components/Map/MarkerLayer";
import MarkerList from "@/components/Map/MarkerList";
import MarkerSearch from "@/components/Map/MarkerSearch";
import PlaceSearch from "@/components/Map/PlaceSearch";
import InfoWindow from '@/components/UI/InfoWindow';
import LocationErrorAlert from '@/components/UI/LocationErrorAlert';
import SubwayQueryModal from '@/components/UI/SubwayQueryModal';
import CityWeatherBar from '@/components/Map/CityWeatherBar';
import MapToolbar from '@/components/Map/MapToolbar';
import RoutePanel from '@/components/Map/RoutePanel';
import CategorySheet from '@/components/Map/CategorySheet';
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMapStore } from "@/stores/map.store";
import { useMarkersStore } from "@/stores/markers.store";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useRouteHistory } from "@/hooks/useRouteHistory";
import { useCityWeather } from "@/hooks/useCityWeather";
import { useMapTools } from "@/hooks/useMapTools";
import { useRoutePlanning } from "@/hooks/useRoutePlanning";
import { usePerformanceReport } from "@/hooks/usePerformance";
import type { MapPosition, Marker } from "@/types";
import type { RouteServiceResult } from "@/types";
import { RouteServiceStatus, RouteStrategy } from "@/types";
import RoutePlanningForm, { RoutePlanningParams } from '@/components/Map/RoutePlanningForm';
import RouteDetailsPanel from '@/components/Map/RouteDetailsPanel';
import RouteLayer from '@/components/Map/RouteLayer';
import { CITIES_BY_LETTER, LETTERS, type CityData } from '@/data/cities';
import {
  type CategoryKey,
  type CategoryItem,
  type DistrictKey,
  CATEGORY_CONFIG,
  CATEGORY_IMAGE_URL,
  DEFAULT_AMAP_SERVICE_KEY,
  DISTRICT_CONFIG,
  SEARCH_PANEL_WIDTH,
} from '@/config/category.config';
import {
  searchPanelContainerStyle,
  historyDropdownStyle,
  categoryIconStyle,
  categoryIconInnerStyle,
  mapContainerStyle,
  historyTitleStyle,
  historyItemStyle,
  categoryIconsContainerStyle,
  historyContentStyle,
  historyListStyle,
  searchInAreaButtonStyle,
  debugInfoStyle,
} from '@/config/map.styles';

const { Text } = Typography;
const { Panel } = Collapse;

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

  // 按字段订阅 map store，只有对应字段变化时才重新渲染
  const storeCenter = useMapStore(s => s.center);
  const zoom = useMapStore(s => s.zoom);
  const mapType = useMapStore(s => s.mapType);
  const setCenter = useMapStore(s => s.setCenter);
  const setZoom = useMapStore(s => s.setZoom);
  const setMapType = useMapStore(s => s.setMapType);
  
  // 按字段订阅 markers store，只有对应字段变化时才重新渲染
  const markers = useMarkersStore(s => s.markers);
  const addMarker = useMarkersStore(s => s.addMarker);
  const updateMarker = useMarkersStore(s => s.updateMarker);
  const removeMarker = useMarkersStore(s => s.removeMarker);
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
  // 使用自定义 hooks
  const { searchHistory, addToHistory, clearHistory, removeHistoryItem } = useSearchHistory();
  const { routeHistory, addRouteHistory, removeRouteHistoryItem } = useRouteHistory();
  const cityWeather = useCityWeather('深圳');
  const mapTools = useMapTools();
  const routePlanning = useRoutePlanning();

  // 性能监控
  const { report: perfReport, isMonitoring } = usePerformanceReport({
    debug: true,
    onReport: (report) => {
      // 可以在这里将性能数据上报到服务器
      console.log('[性能报告]', report);
    },
  });

  // 路线规划面板状态
  const [showRoutePanel, setShowRoutePanel] = useState<boolean>(false);
  const [routeMode, setRouteMode] = useState<'driving' | 'walking' | 'transit' | 'riding' | 'electric'>('driving');
  const [originText, setOriginText] = useState<string>('');
  const [destText, setDestText] = useState<string>('');
  const [originLocation, setOriginLocation] = useState<{lng:number;lat:number} | null>(null);
  const [destLocation, setDestLocation] = useState<{lng:number;lat:number} | null>(null);
  const [waypoints, setWaypoints] = useState<Array<{id:string; name:string; location?:{lng:number;lat:number}}>>([]);
  const [routePanelSearchResults, setRoutePanelSearchResults] = useState<any[]>([]);
  const [routePanelSearchVisible, setRoutePanelSearchVisible] = useState<boolean>(false);
  const [routePanelSearchTarget, setRoutePanelSearchTarget] = useState<'origin' | 'dest' | 'waypoint' | null>(null);
  const routePanelTargetRef = useRef<'origin' | 'dest' | 'waypoint' | null>(null);
  const routePanelWaypointIdRef = useRef<string | null>(null);
  const [historyVisible, setHistoryVisible] = useState<boolean>(false);
  
  // 地图中心点状态（可以被定位功能修改）
  const [mapCenter, setMapCenter] = useState<MapPosition>({
    lng: 116.3974,
    lat: 39.9093,
  });

  const handleHistoryClick = useCallback((item: { id: string; name: string; location: { lng: number; lat: number }; address?: string }) => {
    const { setMapCenter, setZoom, setConfirmedPlaceMarker, setHistoryVisible, message, addToHistory } = callbacksRef.current;
    setMapCenter(item.location);
    setZoom(18);
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
    addToHistory(item);
  }, []);

  // 搜索结果标记
  const [searchMarkers, setSearchMarkers] = useState<any[]>([]);
  // 确认的地点标记（星号）
  const [confirmedPlaceMarker, setConfirmedPlaceMarker] = useState<any>(null);
  // 分类搜索：底部弹窗 + "在此区域搜索"
  const mapRef = useRef<any>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('food');
  const [showCategorySheet, setShowCategorySheet] = useState<boolean>(false);
  const [categoryCollapsed, setCategoryCollapsed] = useState<boolean>(false);
  const [categoryDetailItem, setCategoryDetailItem] = useState<CategoryItem | null>(null);
  const [showSearchInArea, setShowSearchInArea] = useState<boolean>(false);
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false);
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);
  const SEARCH_PANEL_WIDTH = 500;
  const categoryPanelRef = useRef<HTMLDivElement | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<DistrictKey>('all');
  const [activeStationTag, setActiveStationTag] = useState<string | null>(null);
  const [districtPanelOpen, setDistrictPanelOpen] = useState<boolean>(false);
  const [sortMode, setSortMode] = useState<'recommend' | 'distance' | 'rating'>('recommend');
  const pendingNavigateRef = useRef<CategoryItem | null>(null);
  // 在程序性移动地图（setCenter/setZoom）后的短时间内，抑制"自动收起"
  const suppressCategoryCollapseUntilRef = useRef<number>(0);

  // ==================== 回调函数 Ref 存储 ====================
  // 使用 useRef 存储回调函数引用的值，避免 useCallback 依赖项过多导致频繁重建
  const callbacksRef = useRef({
    // 搜索历史相关
    addToHistory,
    setMapCenter,
    setZoom,
    setConfirmedPlaceMarker,
    setHistoryVisible,
    message,
    // 城市天气相关
    cityWeather: {
      currentCity: cityWeather.currentCity,
      currentCityAdcode: cityWeather.currentCityAdcode,
      setCurrentCity: cityWeather.setCurrentCity,
      setCurrentCityAdcode: cityWeather.setCurrentCityAdcode,
      fetchWeatherForAdcode: cityWeather.fetchWeatherForAdcode,
      setCitySearchQuery: cityWeather.setCitySearchQuery,
    },
    // 标记相关
    markers,
    setSelectedMarker,
    setSelectedMarkerId,
    updateMarker,
    removeMarker,
    // 分类搜索相关
    setCategoryItems,
    setSearchMarkers,
    setCategoryLoading,
    setCategoryCollapsed,
    setCategoryDetailItem,
    setDistrictPanelOpen,
    setShowSearchInArea,
    activeDistrict,
    activeStationTag,
    sortMode,
  });

  // 保持 ref 与源数据同步
  React.useEffect(() => {
    callbacksRef.current = {
      addToHistory,
      setMapCenter,
      setZoom,
      setConfirmedPlaceMarker,
      setHistoryVisible,
      message,
      cityWeather: {
        currentCity: cityWeather.currentCity,
        currentCityAdcode: cityWeather.currentCityAdcode,
        setCurrentCity: cityWeather.setCurrentCity,
        setCurrentCityAdcode: cityWeather.setCurrentCityAdcode,
        fetchWeatherForAdcode: cityWeather.fetchWeatherForAdcode,
        setCitySearchQuery: cityWeather.setCitySearchQuery,
      },
      markers,
      setSelectedMarker,
      setSelectedMarkerId,
      updateMarker,
      removeMarker,
      setCategoryItems,
      setSearchMarkers,
      setCategoryLoading,
      setCategoryCollapsed,
      setCategoryDetailItem,
      setDistrictPanelOpen,
      setShowSearchInArea,
      activeDistrict,
      activeStationTag,
      sortMode,
    };
  }, [
    addToHistory,
    setMapCenter,
    setZoom,
    setConfirmedPlaceMarker,
    setHistoryVisible,
    message,
    cityWeather.currentCity,
    cityWeather.currentCityAdcode,
    cityWeather.setCurrentCity,
    cityWeather.setCurrentCityAdcode,
    cityWeather.fetchWeatherForAdcode,
    cityWeather.setCitySearchQuery,
    markers,
    setSelectedMarker,
    setSelectedMarkerId,
    updateMarker,
    removeMarker,
    setCategoryItems,
    setSearchMarkers,
    setCategoryLoading,
    setCategoryCollapsed,
    setCategoryDetailItem,
    setDistrictPanelOpen,
    setShowSearchInArea,
    activeDistrict,
    activeStationTag,
    sortMode,
  ]);

  // 城市弹窗状态
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const [cityTab, setCityTab] = useState<'city' | 'province'>('city');
  const [showSubway, setShowSubway] = useState<boolean>(false);
  const trafficRefreshKey = `${mapTools.trafficMode}-${mapTools.trafficWeekday}-${mapTools.trafficHour}`;

  // 处理城市选择
  const handleCitySelect = useCallback((city: CityData) => {
    const { setMapCenter, setZoom, message, cityWeather } = callbacksRef.current;
    cityWeather.setCurrentCity(city.name.replace(/市$/, ''));
    cityWeather.setCurrentCityAdcode(city.adcode);
    const [lng, lat] = city.center;
    setMapCenter({ lng, lat });
    setZoom(11);
    cityWeather.fetchWeatherForAdcode(city.adcode);
    setShowCityDropdown(false);
    cityWeather.setCitySearchQuery('');
    message.success(`已切换到: ${city.name}`);
  }, []);

  // 路径规划相关状态（使用 hook 中的状态）
  const { routeResult, routeParams, routeStrategyTab, routePlanIndex, expandedPlanIndex, handlePlanRoute } = routePlanning;
  const setRouteResult = routePlanning.setRouteResult;
  const setRouteStrategyTab = routePlanning.setRouteStrategyTab;
  const setRoutePlanIndex = routePlanning.setRoutePlanIndex;
  const setExpandedPlanIndex = routePlanning.setExpandedPlanIndex;

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
    const { markers, setSelectedMarker, setSelectedMarkerId } = callbacksRef.current;
    // 从最新的store数据中获取标记信息，确保数据一致性
    const latestMarker = markers.find(m => m.id === marker.id);
    if (latestMarker) {
      // 设置选中的标记（用于弹窗显示）
      setSelectedMarker(latestMarker);
      // 设置选中的标记ID（用于列表高亮）
      setSelectedMarkerId(latestMarker.id);
    }
  }, []);

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
    // 保存地图实例，用于可视区域搜索 / 缩放自适应半径
    mapRef.current = map;
  }, []);

  // 分类弹窗打开时：地图拖动/缩放后显示 “在此区域搜索”
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!showCategorySheet) return;

    const onMoveOrZoomEnd = () => setShowSearchInArea(true);
    const onMapInteract = () => {
      if (Date.now() < suppressCategoryCollapseUntilRef.current) {
        return;
      }
      setCategoryCollapsed(true);
    };
    try {
      map.on?.('moveend', onMoveOrZoomEnd);
      map.on?.('zoomend', onMoveOrZoomEnd);
      // 用户开始操作地图就先收起分类块（hover 可再展开）
      map.on?.('movestart', onMapInteract);
      map.on?.('zoomstart', onMapInteract);
      map.on?.('dragstart', onMapInteract);
    } catch (e) {
      // ignore
    }
    return () => {
      try {
        map.off?.('moveend', onMoveOrZoomEnd);
        map.off?.('zoomend', onMoveOrZoomEnd);
        map.off?.('movestart', onMapInteract);
        map.off?.('zoomstart', onMapInteract);
        map.off?.('dragstart', onMapInteract);
      } catch (e) {
        // ignore
      }
    };
  }, [showCategorySheet]);

  // 点击分类块以外区域（包括地图）时，收起分类块
  React.useEffect(() => {
    if (!showCategorySheet) return;
    const onDown = (e: MouseEvent) => {
      const el = categoryPanelRef.current;
      const target = e.target as Node | null;
      if (!el || !target) return;
      if (!el.contains(target)) {
        // 详情态不自动收起（避免和“详情卡”交互冲突）
        if (categoryDetailItem) return;
        setCategoryCollapsed(true);
        setDistrictPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showCategorySheet, categoryDetailItem]);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  // 简单的可复现“随机”生成器（基于字符串 hash）
  const hashToUnit = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    // 0..1
    return (h >>> 0) / 4294967295;
  };
  const mockRating = (seed: string) => {
    const u = hashToUnit(seed);
    // 3.0 ~ 5.0
    return Math.round((3 + u * 2) * 10) / 10;
  };
  const mockCost = (seed: string) => {
    const u = hashToUnit(seed + 'cost');
    // 20 ~ 200
    return Math.round(20 + u * 180);
  };
  const haversineMeters = (a: { lng: number; lat: number }, b: { lng: number; lat: number }) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  };

  const randomBetween = (seed: string, min: number, max: number) => {
    const u = hashToUnit(seed);
    return min + u * (max - min);
  };

  const mockItemsNear = (category: CategoryKey, base: { lng: number; lat: number }, spreadMeters: number) => {
    const cfg = CATEGORY_CONFIG[category];
    // roughly convert meters to degrees (lat); lng depends on latitude
    const metersToLat = (m: number) => m / 111000;
    const metersToLng = (m: number) => m / (111000 * Math.cos((base.lat * Math.PI) / 180));

    return Array.from({ length: 20 }).map((_, idx) => {
      const id = `mock-${category}-${base.lng.toFixed(4)}-${base.lat.toFixed(4)}-${idx}`;
      const dx = randomBetween(id + '-dx', -spreadMeters, spreadMeters);
      const dy = randomBetween(id + '-dy', -spreadMeters, spreadMeters);
      const loc = {
        lng: base.lng + metersToLng(dx),
        lat: base.lat + metersToLat(dy),
      };
      const name = `${idx + 1}. ${cfg.label}店${idx + 1}`;
      return {
        id,
        name,
        address: `模拟地址 ${idx + 1} 号`,
        tel: `138${String(10000000 + Math.floor(hashToUnit(id) * 89999999)).slice(0, 8)}`,
        location: loc,
        photoUrl: CATEGORY_IMAGE_URL,
        rating: mockRating(id),
        cost: mockCost(id),
        distance: Math.round(haversineMeters(base, loc)),
      } as CategoryItem;
    });
  };

  const mockItemsInBounds = (category: CategoryKey, bounds: any) => {
    const cfg = CATEGORY_CONFIG[category];
    const sw = bounds.getSouthWest?.();
    const ne = bounds.getNorthEast?.();
    if (!sw || !ne) return [];

    return Array.from({ length: 20 }).map((_, idx) => {
      const id = `mockb-${category}-${sw.lng.toFixed(3)}-${sw.lat.toFixed(3)}-${ne.lng.toFixed(3)}-${ne.lat.toFixed(3)}-${idx}`;
      const lng = randomBetween(id + '-lng', sw.lng, ne.lng);
      const lat = randomBetween(id + '-lat', sw.lat, ne.lat);
      const name = `${idx + 1}. ${cfg.label}店${idx + 1}`;
      return {
        id,
        name,
        address: `模拟地址（可视范围）${idx + 1} 号`,
        tel: `139${String(10000000 + Math.floor(hashToUnit(id) * 89999999)).slice(0, 8)}`,
        location: { lng, lat },
        photoUrl: CATEGORY_IMAGE_URL,
        rating: mockRating(id),
        cost: mockCost(id),
      } as CategoryItem;
    });
  };
  const computeRadiusFromView = (map: any) => {
    try {
      const bounds = map.getBounds?.();
      if (!bounds) return 5000;
      const sw = bounds.getSouthWest?.();
      const ne = bounds.getNorthEast?.();
      if (!sw || !ne) return 5000;
      const diag = haversineMeters({ lng: sw.lng, lat: sw.lat }, { lng: ne.lng, lat: ne.lat });
      // 半个对角线作为 radius，适当放大一点覆盖屏幕
      const r = Math.round(diag * 0.6);
      return clamp(r, 800, 20000);
    } catch (e) {
      return 5000;
    }
  };

  const buildCategoryMarkers = (items: CategoryItem[], category: CategoryKey) => {
    const cfg = CATEGORY_CONFIG[category];
    return items.map((it, idx) => ({
      id: `cat-${category}-${it.id}`,
      type: 'store' as const,
      title: `${idx + 1}. ${it.name}`,
      position: it.location,
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
      createdAt: new Date(),
      updatedAt: new Date(),
      data: {
        address: it.address,
        phone: it.tel,
        category: cfg.label,
        rank: idx + 1,
        rating: it.rating,
        cost: it.cost,
        distance: it.distance,
      },
    }));
  };

  // ==================== 排序与标记构建 ====================
  const applySortToItems = (items: CategoryItem[], mode: 'recommend' | 'distance' | 'rating') => {
    if (mode === 'recommend') return items;
    const center = mapRef.current?.getCenter?.() || mapCenter;
    const withDistance = items.map((it) => ({
      ...it,
      distance:
        typeof it.distance === 'number'
          ? it.distance
          : Math.round(haversineMeters({ lng: center.lng, lat: center.lat }, it.location)),
    }));
    if (mode === 'distance') {
      return [...withDistance].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
    // rating
    return [...withDistance].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  };

  // ==================== useMemo 缓存计算结果 ====================
  // 缓存分类标记构建结果，避免每次渲染都重新构建
  const categoryMarkers = React.useMemo(
    () => buildCategoryMarkers(categoryItems, activeCategory),
    [categoryItems, activeCategory]
  );

  // 缓存分类项排序结果
  const sortedCategoryItems = React.useMemo(
    () => applySortToItems(categoryItems, sortMode),
    [categoryItems, sortMode]
  );

  const selectCategoryItemForDetail = (item: CategoryItem) => {
    // 列表点击会触发程序性 setMapCenter/setZoom，地图会连续触发多个事件（movestart/zoomstart...）
    // 这里用时间窗口抑制自动收起，避免被抢回收起态提示条
    suppressCategoryCollapseUntilRef.current = Date.now() + 800;
    setCategoryDetailItem(item);
    setCategoryCollapsed(false);
    setDistrictPanelOpen(false);
    setShowSearchInArea(false);
    // 给选中的 marker 加可视化 label（其余清空）
    setSearchMarkers((prev) =>
      (prev || []).map((m: any) => {
        const nextData = { ...(m.data || {}) };
        if (String(m.title || '').includes(item.name) || m.id?.endsWith?.(item.id)) {
          nextData.labelText = item.name;
        } else {
          delete nextData.labelText;
        }
        return { ...m, data: nextData };
      }),
    );
  };

  const startNavigateTo = async (item: CategoryItem) => {
    // 进入路线模式：直接关闭分类弹窗，避免地图联动触发“收起态提示条”
    setShowCategorySheet(false);
    setCategoryCollapsed(false);
    setDistrictPanelOpen(false);
    setCategoryDetailItem(null);

    // 打开路线面板并自动规划默认路线（驾车）
    setShowRoutePanel(true);
    setRouteMode('driving');
    setDestText(item.name);
    setDestLocation(item.location);
    setOriginText('我的位置');

    if (!position) {
      pendingNavigateRef.current = item;
      getCurrentPosition();
      return;
    }

    setOriginLocation(position);
    const params: RoutePlanningParams = {
      origin: position,
      destination: item.location,
      mode: 'driving',
      strategy: RouteStrategy.FASTEST,
    } as any;
    await handlePlanRoute(params    );
  };



  



  // 默认：全城推荐 Top20（使用 text 搜索 + citylimit）
  const fetchCityTop20 = useCallback(
    async (category: CategoryKey, districtOverride?: DistrictKey, stationTagOverride?: string | null) => {
      const {
        cityWeather: cw,
        setCategoryLoading,
        setCategoryItems,
        setSearchMarkers,
        setConfirmedPlaceMarker,
        setShowSearchInArea,
        message,
        activeDistrict: ad,
        activeStationTag: ast,
        sortMode: sm,
      } = callbacksRef.current;
      const cfg = CATEGORY_CONFIG[category];
      const key =
        import.meta.env.VITE_AMAP_SERVICE_KEY ||
        import.meta.env.VITE_AMAP_KEY ||
        DEFAULT_AMAP_SERVICE_KEY;

      const city = cw.currentCityAdcode || cw.currentCity;
      // 使用传入的参数，如果没有则使用当前状态
      const currentDistrict = districtOverride !== undefined ? districtOverride : ad;
      const currentStationTag = stationTagOverride !== undefined ? stationTagOverride : ast;

      setCategoryLoading(true);
      try {
        const params = new URLSearchParams({
          key,
          // 如果选中了具体区或地铁站标签，就把它们拼到关键字里，做一个"区内 + 类型"的推荐搜索
          keywords:
            currentDistrict !== 'all'
              ? `${DISTRICT_CONFIG[currentDistrict as Exclude<DistrictKey, 'all'>].name}${
                  currentStationTag || cfg.keywords
                }`
              : cfg.keywords,
          city: String(city),
          citylimit: 'true',
          offset: '20',
          page: '1',
          extensions: 'all',
        });
        const res = await fetch(`https://restapi.amap.com/v3/place/text?${params}`);
        const data = await res.json();
        if (data.status === '1' && Array.isArray(data.pois)) {
          const list: CategoryItem[] = data.pois.slice(0, 20).map((p: any) => {
            const [lngStr, latStr] = String(p.location || '').split(',');
            const id = String(p.id || `${p.name}-${lngStr}-${latStr}`);
            return {
              id,
              name: p.name,
              address: p.address || p.adname || '',
              tel: p.tel,
              location: { lng: parseFloat(lngStr), lat: parseFloat(latStr) },
              photoUrl: CATEGORY_IMAGE_URL,
              rating: mockRating(id),
              cost: mockCost(id),
            };
          });
          const sorted = applySortToItems(list, sm);
          setCategoryItems(sorted);
          setSearchMarkers(buildCategoryMarkers(sorted, category));
          setConfirmedPlaceMarker(null);
          setShowSearchInArea(false);
        } else {
          setCategoryItems([]);
          setSearchMarkers([]);
          message.warning(`未找到${cfg.label}结果`);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error(e);
        message.error(`加载${cfg.label}失败`);
      } finally {
        setCategoryLoading(false);
      }
    },
    [],
  );

  // “在此区域搜索”：按当前可视范围（bounds）取 Top20
  const fetchInViewTop20 = useCallback(
    async (category: CategoryKey) => {
      const map = mapRef.current;
      const {
        setCategoryLoading,
        setCategoryItems,
        setSearchMarkers,
        setConfirmedPlaceMarker,
        setShowSearchInArea,
        message,
        sortMode: sm,
      } = callbacksRef.current;
      const cfg = CATEGORY_CONFIG[category];
      const key =
        import.meta.env.VITE_AMAP_SERVICE_KEY ||
        import.meta.env.VITE_AMAP_KEY ||
        DEFAULT_AMAP_SERVICE_KEY;
      if (!map) {
        message.warning('地图未就绪');
        return;
      }

      setCategoryLoading(true);
      try {
        const bounds = map.getBounds?.();
        const sw = bounds?.getSouthWest?.();
        const ne = bounds?.getNorthEast?.();
        const center = map.getCenter?.();
        if (!sw || !ne || !center) {
          message.warning('无法获取当前可视区域');
          return;
        }

        const radius = computeRadiusFromView(map);
        // 推荐排序：sortrule=1（权重）；若接口不支持也会回退为默认顺序
        const params = new URLSearchParams({
          key,
          location: `${center.lng},${center.lat}`,
          keywords: cfg.keywords,
          radius: String(radius),
          offset: '50',
          page: '1',
          extensions: 'all',
          sortrule: '1',
        });
        const res = await fetch(`https://restapi.amap.com/v3/place/around?${params}`);
        const data = await res.json();
        if (!(data.status === '1' && Array.isArray(data.pois))) {
          setCategoryItems([]);
          setSearchMarkers([]);
          message.warning(`未找到${cfg.label}结果`);
          return;
        }

        // 先按"推荐/权重"返回顺序，前端过滤进可视范围，再取前 20
        const list: CategoryItem[] = data.pois
          .map((p: any) => {
            const [lngStr, latStr] = String(p.location || '').split(',');
            const lng = parseFloat(lngStr);
            const lat = parseFloat(latStr);
            return {
              raw: p,
              lng,
              lat,
              ok: lng >= sw.lng && lng <= ne.lng && lat >= sw.lat && lat <= ne.lat,
            };
          })
          .filter((x: any) => x.ok)
          .slice(0, 20)
          .map((x: any) => {
            const p = x.raw;
            const id = String(p.id || `${p.name}-${x.lng}-${x.lat}`);
            return {
              id,
              name: p.name,
              address: p.address || p.adname || '',
              tel: p.tel,
              distance: typeof p.distance === 'string' || typeof p.distance === 'number' ? Number(p.distance) : undefined,
              location: { lng: x.lng, lat: x.lat },
              photoUrl: CATEGORY_IMAGE_URL,
              rating: mockRating(id),
              cost: mockCost(id),
            };
          });

        const sorted = applySortToItems(list, sm);
        setCategoryItems(sorted);
        setSearchMarkers(buildCategoryMarkers(sorted, category));
        setConfirmedPlaceMarker(null);
        setShowSearchInArea(false);
      } catch (e) {
        if (import.meta.env.DEV) console.error(e);
        message.error(`在此区域搜索${cfg.label}失败`);
      } finally {
        setCategoryLoading(false);
      }
    },
    [],
  );

  // 卫星模式下路网显示效果联动（尝试添加/移除覆盖层，带兼容性保护）
  React.useEffect(() => {
    const map = (window as any).currentMap;
    const AMap = (window as any).AMap;
    if (!map) return;

    try {
      if (mapTools.showSatelliteMode && mapTools.showSatelliteRoads) {
        // 如果已经存在 roadLayer 则跳过
        if (!map.__roadLayer) {
          // 试着使用 TileLayer 插件作为通用覆盖层（兼容性较好）
          if (AMap && (AMap as any).TileLayer) {
            try {
              const roadLayer = new (AMap as any).TileLayer();
              map.add(roadLayer);
              map.__roadLayer = roadLayer;
            } catch (e) {
              if (import.meta.env.DEV) console.warn('添加路网覆盖失败:', e);
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
        if (mapTools.showSatelliteMode && typeof map.setMapStyle === 'function') {
          try { map.setMapStyle('amap://styles/darkblue'); } catch (e) { /* ignore */ }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn('处理路网显示时发生错误:', error);
    }
    // 仅在以下状态变化时触发
  }, [mapTools.showSatelliteMode, mapTools.showSatelliteRoads]);



  // 城市和天气相关逻辑已在 useCityWeather hook 中处理

  // 处理定位按钮点击
  const handleLocateMe = useCallback(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);


  const handleMarkerDragEnd = useCallback(
    (marker: Marker, newPosition: { lng: number; lat: number }) => {
      const { updateMarker, message } = callbacksRef.current;
      // 更新标记位置到 store
      updateMarker(marker.id, {
        position: newPosition,
        updatedAt: new Date(),
      });

      message.success("标记位置已更新");
    },
    [],
  );

  

  



  // handlePlanRoute 已在 useRoutePlanning hook 中定义

  // 当用户切换路线模式并且已有起终点与已有规划结果时，自动重新规划路线
  useEffect(() => {
    const tryReplan = async () => {
      if (!originLocation || !destLocation) return;
      if (!routeResult) return; // only replan if there's an existing result (user had planned before)

      message.info('出行方式已切换，正在重新规划路线...');
      const strategy = routeMode === 'driving'
        ? (routeStrategyTab === 'avoidCongestion' ? RouteStrategy.AVOID_CONGESTION : RouteStrategy.FASTEST)
        : undefined;
      const res = await handlePlanRoute({ origin: originLocation, destination: destLocation, mode: routeMode, strategy } as any);
      if (res && res.status === RouteServiceStatus.SUCCESS) {
        // 保存一次历史，标记为当前 mode
        addRouteHistory({
          id: `${originText}=>${destText}-${Date.now()}`,
          originText, destText, originLocation: originLocation!, destLocation: destLocation!, mode: routeMode
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

  // 如果用户点击“到这去”时尚未有定位，等定位回来后自动继续规划路线
  React.useEffect(() => {
    const pending = pendingNavigateRef.current;
    if (!pending) return;
    if (!position) return;
    pendingNavigateRef.current = null;
    (async () => {
      try {
        // 如果是从“到这去”触发的定位回调，确保分类弹窗已关闭
        setShowCategorySheet(false);
        setCategoryCollapsed(false);
        setDistrictPanelOpen(false);
        setCategoryDetailItem(null);

        setOriginText('我的位置');
        setOriginLocation(position);
        setDestText(pending.name);
        setDestLocation(pending.location);
        setShowRoutePanel(true);
        setRouteMode('driving');
        const params: RoutePlanningParams = {
          origin: position,
          destination: pending.location,
          mode: 'driving',
          strategy: RouteStrategy.FASTEST,
        } as any;
        await handlePlanRoute(params);
      } catch (e) {
        // ignore
      }
    })();
  }, [position]);

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
      if (import.meta.env.DEV) console.error("❌ 定位失败:", locationError);
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
          <div style={mapContainerStyle}>
            {/* 左上：搜索框（固定） */}
            <div style={searchPanelContainerStyle}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.98)',
                borderRadius: 6,
                padding: '6px 10px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
              }}>
                {/* 城市按钮与天气（提取为独立组件） */}
                <CityWeatherBar
                  currentCity={cityWeather.currentCity}
                  weatherInfo={cityWeather.weatherInfo}
                  weatherLoading={cityWeather.weatherLoading}
                  getWeatherIcon={cityWeather.getWeatherIcon}
                  hotCities={cityWeather.hotCities}
                  provinceGroups={cityWeather.provinceGroups}
                  citySearchQuery={cityWeather.citySearchQuery}
                  setCitySearchQuery={cityWeather.setCitySearchQuery}
                  citySearchResults={cityWeather.citySearchResults}
                  activeLetter={cityWeather.activeLetter}
                  setActiveLetter={cityWeather.setActiveLetter}
                  cityTab={cityTab}
                  setCityTab={setCityTab}
                  showCityDropdown={showCityDropdown}
                  setShowCityDropdown={setShowCityDropdown}
                  onCitySelect={handleCitySelect}
                />

                {/* 搜索框（包含历史下拉与分类弹窗） */}
                <div
                  style={{ width: SEARCH_PANEL_WIDTH }}
                  tabIndex={-1}
                  onMouseDown={() => {
                    if (!searchQuery.trim()) setHistoryVisible(true);
                  }}
                  onClickCapture={() => {
                    if (!searchQuery.trim()) setHistoryVisible(true);
                    if (showRoutePanel) {
                      setShowRoutePanel((v) => !v);
                    }
                  }}
                  onFocusCapture={() => {
                    if (!searchQuery.trim()) setHistoryVisible(true);
                  }}
                  onBlur={() => setTimeout(() => setHistoryVisible(false), 150)}
                >
                  <PlaceSearch
                    style={{ width: '100%' }}
                    value={searchQuery}
                    onValueChange={(v) => {
                      setSearchQuery(v);
                      if (v.trim()) setHistoryVisible(false);
                    }}
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
                        setHistoryVisible(false);
                      } catch (e) { /* ignore */ }
                    }}
                    onPlaceConfirm={(place: any) => {
                      // 使用现有的确认处理函数
                      handlePlaceConfirm(place);
                    }}
                  />

                  {/* 历史与分类下拉 - 始终渲染，通过样式控制展开收起以实现动画 */}
                  {!showCategorySheet && (
                  <div
                    style={{
                      ...historyDropdownStyle(SEARCH_PANEL_WIDTH),
                      maxHeight: historyVisible ? 320 : 0,
                      opacity: historyVisible ? 1 : 0,
                      transform: historyVisible ? 'translateY(0)' : 'translateY(-4px)',
                      transition: 'max-height 240ms ease, opacity 180ms ease, transform 180ms ease',
                      overflow: 'hidden',
                      pointerEvents: historyVisible ? 'auto' : 'none',
                    }}
                  >
                    <div style={historyContentStyle(historyVisible)}>
                      {/* 顶部四个分类图标 */}
                      <div style={categoryIconsContainerStyle}>
                          {([
                          { key: 'hotel', label: '酒店', emoji: '🏨' },
                          { key: 'food', label: '美食', emoji: '🍽️' },
                          { key: 'poi', label: '景点', emoji: '🏛️' },
                          { key: 'neigh', label: '小区', emoji: '🏘️' },
                          ] as Array<{ key: CategoryKey; label: string; emoji: string }>).map((c) => (
                            <div
                              key={c.key}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setHistoryVisible(false);
                                setShowCategorySheet(true);
                                setActiveCategory(c.key);
                                setShowSearchInArea(true); // 显示"在此区域搜索"按钮
                              setCategoryCollapsed(false);
                              setDistrictPanelOpen(false);
                                fetchCityTop20(c.key); // 默认全城推荐 Top20
                              }}
                              style={categoryIconStyle}
                            >
                              <div
                                style={categoryIconInnerStyle}
                              >
                              <span>{c.emoji}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#333' }}>{c.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* 搜索记录标题与清空 */}
                      <div style={historyTitleStyle}>
                        <div style={{ fontWeight: 600 }}>搜索记录</div>
                        <Button size="small" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); clearHistory(); }}>清空</Button>
                      </div>

                      {/* 历史列表（可为空） */}
                      <div style={historyListStyle}>
                        {(searchHistory && searchHistory.length > 0) ? (
                          (searchHistory || []).map((h) => (
                            <div
                              key={h.id}
                              onMouseDown={(e) => { e.preventDefault(); handleHistoryClick(h); }}
                              style={historyItemStyle}
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
                  )}

                  {/* 分类搜索结果弹窗：已提取为独立 CategorySheet 组件 */}
                  <CategorySheet
                    show={showCategorySheet}
                    panelRef={categoryPanelRef}
                    width={SEARCH_PANEL_WIDTH}
                    activeCategory={activeCategory}
                    categoryConfig={CATEGORY_CONFIG}
                    districtConfig={DISTRICT_CONFIG}
                    activeDistrict={activeDistrict}
                    setActiveDistrict={setActiveDistrict}
                    activeStationTag={activeStationTag}
                    setActiveStationTag={setActiveStationTag}
                    districtPanelOpen={districtPanelOpen}
                    setDistrictPanelOpen={setDistrictPanelOpen}
                    sortMode={sortMode}
                    setSortMode={setSortMode}
                    categoryItems={categoryItems}
                    categoryLoading={categoryLoading}
                    categoryCollapsed={categoryCollapsed}
                    setCategoryCollapsed={setCategoryCollapsed}
                    categoryDetailItem={categoryDetailItem}
                    setCategoryDetailItem={setCategoryDetailItem}
                    onItemClick={(item) => {
                      setMapCenter(item.location);
                      setZoom(16);
                      selectCategoryItemForDetail(item);
                    }}
                    onNavigateTo={startNavigateTo}
                    onFetchCityTop20={fetchCityTop20}
                    onApplySort={applySortToItems}
                    onBuildMarkers={buildCategoryMarkers}
                    setMapCenter={setMapCenter}
                    setZoom={setZoom}
                    setSearchMarkers={setSearchMarkers}
                    suppressCollapseRef={suppressCategoryCollapseUntilRef}
                    onClose={() => {
                      setShowCategorySheet(false);
                      setShowSearchInArea(false);
                      setCategoryCollapsed(false);
                      setDistrictPanelOpen(false);
                      setHistoryVisible(false);
                      setCategoryDetailItem(null);
                    }}
                  />
                        </div>

                {/* 路线按钮（搜索框右侧） - 提取为独立 RoutePanel 组件 */}
                <RoutePanel
                  show={showRoutePanel}
                  setShow={setShowRoutePanel}
                  routeMode={routeMode}
                  setRouteMode={setRouteMode}
                  originText={originText}
                  setOriginText={setOriginText}
                  destText={destText}
                  setDestText={setDestText}
                  originLocation={originLocation}
                  setOriginLocation={setOriginLocation}
                  destLocation={destLocation}
                  setDestLocation={setDestLocation}
                  waypoints={waypoints}
                  setWaypoints={setWaypoints}
                  routePanelSearchResults={routePanelSearchResults}
                  setRoutePanelSearchResults={setRoutePanelSearchResults}
                  routePanelSearchVisible={routePanelSearchVisible}
                  setRoutePanelSearchVisible={setRoutePanelSearchVisible}
                  routePanelSearchTarget={routePanelSearchTarget}
                  setRoutePanelSearchTarget={setRoutePanelSearchTarget}
                  routePanelTargetRef={routePanelTargetRef}
                  routePanelWaypointIdRef={routePanelWaypointIdRef}
                  routeResult={routeResult}
                  routeParams={routeParams}
                  routeStrategyTab={routeStrategyTab}
                  setRouteStrategyTab={setRouteStrategyTab}
                  routePlanIndex={routePlanIndex}
                  setRoutePlanIndex={setRoutePlanIndex}
                  expandedPlanIndex={expandedPlanIndex}
                  setExpandedPlanIndex={setExpandedPlanIndex}
                  handlePlanRoute={handlePlanRoute}
                  addRouteHistory={addRouteHistory}
                  routeHistory={routeHistory}
                  removeRouteHistoryItem={removeRouteHistoryItem}
                  setMapCenter={setMapCenter}
                  setZoom={setZoom}
                />
                              </div>

              {/* (已改为下拉 Popover) */}
            </div>

            {/* 右上工具栏与路况面板 */}
            <MapToolbar
              zoom={zoom}
              setZoom={setZoom}
              showSatelliteMode={mapTools.showSatelliteMode}
              showSatelliteRoads={mapTools.showSatelliteRoads}
              setShowSatelliteRoads={mapTools.setShowSatelliteRoads}
              showTraffic={mapTools.showTraffic}
              measureMode={mapTools.measureMode}
              showSubwayModal={mapTools.showSubwayModal}
              trafficPanelVisible={mapTools.trafficPanelVisible}
              trafficMode={mapTools.trafficMode}
              trafficWeekday={mapTools.trafficWeekday}
              trafficHour={mapTools.trafficHour}
              onToggleSatellite={mapTools.toggleSatelliteMode}
              onToggleTraffic={mapTools.toggleTraffic}
              onToggleMeasureMode={mapTools.toggleMeasureMode}
              onToggleSubwayModal={mapTools.toggleSubwayModal}
              onToggleFullscreen={mapTools.toggleFullscreen}
              onSetTrafficMode={mapTools.setTrafficMode}
              onSetTrafficWeekday={mapTools.setTrafficWeekday}
              onSetTrafficHour={mapTools.setTrafficHour}
            />

            {/* 地图主体（原有地图渲染） */}
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
                showTraffic={mapTools.showTraffic}
                showSubway={showSubway}
                measureMode={mapTools.measureMode}
              >
                {/* 路径绘制层 */}
                <RouteLayer
                  polyline={(routeResult?.data?.plans && routeResult.data.plans.length > 0
                    ? (routeResult.data.plans[routePlanIndex]?.polyline || routeResult.data.polyline)
                    : (routeResult?.data?.polyline || []))}
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
                  <div style={debugInfoStyle}>
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

              {/* 在此区域搜索按钮：位于地图底部中间，距离底部约 50px */}
              {showCategorySheet && showSearchInArea && (
                <div
                  style={searchInAreaButtonStyle}
                >
                  <Button
                    type="primary"
                    onClick={() => fetchInViewTop20(activeCategory)}
                    style={{
                      backgroundColor: '#65a9fc',
                      borderColor: '#65a9fc',
                      borderRadius: 2,
                    }}
                  >
                    在此区域搜索 {CATEGORY_CONFIG[activeCategory].label}
                  </Button>
                </div>
              )}

              {/* 信息弹窗 */}
              <InfoWindow
                marker={selectedMarker}
                visible={selectedMarker !== null}
                onClose={handleInfoWindowClose}
                onAction={handleInfoWindowAction}
              />

              {/* 地铁查询弹窗 */}
              <SubwayQueryModal
                visible={mapTools.showSubwayModal}
                onClose={() => mapTools.setShowSubwayModal(false)}
              />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

// MapToolbar 组件已移至独立文件 src/components/Map/MapToolbar.tsx

export default MapPlayground;
