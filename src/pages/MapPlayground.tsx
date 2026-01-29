import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, Space, Switch, Divider, Button, message, Row, Col, Typography, Tag, Badge, Collapse, CollapseProps, Checkbox, Popover, Input, Select, Slider } from "antd";
import { EnvironmentOutlined, FullscreenOutlined, GlobalOutlined, CarOutlined, RadarChartOutlined, AimOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
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
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

// 添加路径规划服务导入
import { planDrivingRoute, planWalkingRoute, planTransitRoute, planRidingRoute, planElectricRoute } from "@/services/map";
import type { RouteServiceResult } from "@/types";
import { RouteServiceStatus, RouteStrategy } from "@/types";

// 导入路径规划相关组件
import RoutePlanningForm, { RoutePlanningParams } from '@/components/Map/RoutePlanningForm';
import RouteDetailsPanel from '@/components/Map/RouteDetailsPanel';
import RouteLayer from '@/components/Map/RouteLayer';

// 城市数据（按字母分组）
import { CITIES_BY_LETTER, LETTERS, ALL_CITIES, searchCities, type CityData } from '@/data/cities';

// 热门城市（展示在顶部快速选择区域）
const HOT_CITY_NAMES = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '武汉', '西安'];

// 省份映射（根据 adcode 前两位划分）
const PROVINCE_CODE_MAP: Record<string, string> = {
  '11': '北京',
  '12': '天津',
  '13': '河北',
  '14': '山西',
  '15': '内蒙古',
  '21': '辽宁',
  '22': '吉林',
  '23': '黑龙江',
  '31': '上海',
  '32': '江苏',
  '33': '浙江',
  '34': '安徽',
  '35': '福建',
  '36': '江西',
  '37': '山东',
  '41': '河南',
  '42': '湖北',
  '43': '湖南',
  '44': '广东',
  '45': '广西',
  '46': '海南',
  '50': '重庆',
  '51': '四川',
  '52': '贵州',
  '53': '云南',
  '54': '西藏',
  '61': '陕西',
  '62': '甘肃',
  '63': '青海',
  '64': '宁夏',
  '65': '新疆',
};

type ProvinceGroup = {
  code: string;
  name: string;
  cities: CityData[];
};

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
    // 检查起点和终点是否有效
    if (!item.originText?.trim() || !item.destText?.trim()) {
      return;
    }
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

      // 检查是否已存在相同起终点的记录
      const existingIndex = prev.findIndex(h => isSame(h, item));

      // 如果已存在，更新该记录（不创建新记录）
      if (existingIndex >= 0) {
        const updated = [...prev];
        // 更新时间戳但保持稳定的ID
        updated[existingIndex] = {
          ...item,
          id: `${item.originText?.trim()}=>${item.destText?.trim()}`.replace(/\s+/g, ''),
          updatedAt: Date.now()
        };
        // 将更新的记录移到顶部
        const [updatedItem] = updated.splice(existingIndex, 1);
        const next = [updatedItem, ...updated].slice(0, 12);
        try { localStorage.setItem(ROUTE_HISTORY_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
        return next;
      }

      // 如果不存在，添加新记录（使用稳定的ID，不含时间戳）
      const stableId = `${item.originText?.trim()}=>${item.destText?.trim()}`.replace(/\s+/g, '');
      const next = [{ ...item, id: stableId }, ...prev].slice(0, 12);
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
  // 分类搜索：底部弹窗 + “在此区域搜索”
  type CategoryKey = 'food' | 'hotel' | 'poi' | 'neigh';
  const CATEGORY_IMAGE_URL =
    'https://img.alicdn.com/i3/2207474112147/O1CN01ljnJS31RjNO9kIk0d_!!2207474112147-0-koubei.jpg?operate=merge&w=160&h=150&position=5';
  const DEFAULT_AMAP_SERVICE_KEY = '49bfb83db90187047c48ccc2e711ea32';
  const CATEGORY_CONFIG: Record<CategoryKey, { label: string; emoji: string; keywords: string }> = {
    food: { label: '美食', emoji: '🍽️', keywords: '美食' },
    hotel: { label: '酒店', emoji: '🏨', keywords: '酒店' },
    poi: { label: '景点', emoji: '🏛️', keywords: '景点' },
    neigh: { label: '小区', emoji: '🏘️', keywords: '小区' },
  };
  type CategoryItem = {
    id: string;
    name: string;
    address?: string;
    tel?: string;
    location: { lng: number; lat: number };
    distance?: number;
    photoUrl: string;
    rating: number; // 1.0 - 5.0 (mock)
    cost: number; // per person (mock)
  };
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
  // “全城”筛选：深圳各区 + 代表地铁站分类（示例数据）
  type DistrictKey = 'all' | 'futian' | 'nanshan' | 'luohu' | 'baoan' | 'longgang' | 'longhua';
  const DISTRICT_CONFIG: Record<
    Exclude<DistrictKey, 'all'>,
    { name: string; center: { lng: number; lat: number }; stations: string[] }
  > = {
    futian: {
      name: '福田区',
      center: { lng: 114.055, lat: 22.541 },
      stations: ['会展中心', '购物公园', '车公庙', '岗厦北'],
    },
    nanshan: {
      name: '南山区',
      center: { lng: 113.936, lat: 22.540 },
      stations: ['科技园', '深大', '后海', '高新园'],
    },
    luohu: {
      name: '罗湖区',
      center: { lng: 114.131, lat: 22.548 },
      stations: ['罗湖', '老街', '大剧院', '国贸'],
    },
    baoan: {
      name: '宝安区',
      center: { lng: 113.883, lat: 22.553 },
      stations: ['宝安中心', '西乡', '翻身', '宝体'],
    },
    longgang: {
      name: '龙岗区',
      center: { lng: 114.246, lat: 22.721 },
      stations: ['龙城广场', '南联', '吉祥', '双龙'],
    },
    longhua: {
      name: '龙华区',
      center: { lng: 114.044, lat: 22.696 },
      stations: ['深圳北站', '红山', '龙华', '清湖'],
    },
  };
  const [activeDistrict, setActiveDistrict] = useState<DistrictKey>('all');
  const [activeStationTag, setActiveStationTag] = useState<string | null>(null);
  const [districtPanelOpen, setDistrictPanelOpen] = useState<boolean>(false);
  const [sortMode, setSortMode] = useState<'recommend' | 'distance' | 'rating'>('recommend');
  const pendingNavigateRef = useRef<CategoryItem | null>(null);
  // 在程序性移动地图（setCenter/setZoom）后的短时间内，抑制“自动收起”
  const suppressCategoryCollapseUntilRef = useRef<number>(0);

  // 新增右上工具栏的状态：路况、测距、地铁
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [showSubway, setShowSubway] = useState<boolean>(false);
  const [trafficPanelVisible, setTrafficPanelVisible] = useState<boolean>(false);
  const [trafficMode, setTrafficMode] = useState<'realtime' | 'forecast'>('realtime');
  const [trafficWeekday, setTrafficWeekday] = useState<number>(new Date().getDay()); // 0-6, 周日=0
  const [trafficHour, setTrafficHour] = useState<number>(new Date().getHours());
  const trafficRefreshKey = `${trafficMode}-${trafficWeekday}-${trafficHour}`;
  // 地铁查询弹窗状态
  const [showSubwayModal, setShowSubwayModal] = useState<boolean>(false);
  // 卫星模式与路网显示状态
  const [showSatelliteMode, setShowSatelliteMode] = useState<boolean>(false);
  const [showSatelliteRoads, setShowSatelliteRoads] = useState<boolean>(false);
  const prevMapTypeRef = useRef<'normal' | 'satellite' | '3d'>('normal');
  // 城市弹窗状态与搜索
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const [cityTab, setCityTab] = useState<'city' | 'province'>('city');
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [citySearchResults, setCitySearchResults] = useState<CityData[]>([]);
  const [activeLetter, setActiveLetter] = useState<string>('S');
  const [currentCity, setCurrentCity] = useState<string>('深圳');
  const [currentCityAdcode, setCurrentCityAdcode] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherInfo, setWeatherInfo] = useState<any | null>(null);
  // 城市选择面板的当前选中字母索引
  const [selectedLetterIndex, setSelectedLetterIndex] = useState<number>(0);
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

  // 处理城市选择
  const handleCitySelect = useCallback((city: CityData) => {
    // 更新当前城市
    setCurrentCity(city.name);
    setCurrentCityAdcode(city.adcode);

    // 移动地图中心到该城市
    const [lng, lat] = city.center;
    setMapCenter({ lng, lat });
    setZoom(11);

    // 加载该城市天气
    fetchWeatherForAdcode(city.adcode);

    // 关闭城市选择面板
    setShowCityDropdown(false);
    setCitySearchQuery('');

    message.success(`已切换到: ${city.name}`);
  }, [fetchWeatherForAdcode, setZoom]);

  // 路径规划相关状态
  const [routeResult, setRouteResult] = useState<RouteServiceResult | null>(null);
  const [routePlanning, setRoutePlanning] = useState(false);
  const [routeParams, setRouteParams] = useState<RoutePlanningParams | null>(null);
  // 路线方案选项卡（仅驾车）：推荐方案 / 避免拥堵
  const [routeStrategyTab, setRouteStrategyTab] = useState<'recommend' | 'avoidCongestion'>('recommend');
  // 多方案：当前选中的方案索引
  const [routePlanIndex, setRoutePlanIndex] = useState<number>(0);
  // 多方案：当前展开的方案索引（null 表示全部折叠）
  const [expandedPlanIndex, setExpandedPlanIndex] = useState<number | null>(null);

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

  // 调试：观察收起状态变化
  React.useEffect(() => {
    console.log('[Category] categoryCollapsed changed =>', categoryCollapsed);
  }, [categoryCollapsed]);

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

  const selectCategoryItemForDetail = (item: CategoryItem) => {
    console.log('[Category] select item for detail:', item.name);
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
    await handlePlanRoute(params);
  };

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

  // 默认：全城推荐 Top20（使用 text 搜索 + citylimit）
  const fetchCityTop20 = useCallback(
    async (category: CategoryKey) => {
      const cfg = CATEGORY_CONFIG[category];
      const key =
        import.meta.env.VITE_AMAP_SERVICE_KEY ||
        import.meta.env.VITE_AMAP_KEY ||
        DEFAULT_AMAP_SERVICE_KEY;

      const city = currentCityAdcode || currentCity;
      setCategoryLoading(true);
      try {
        const params = new URLSearchParams({
          key,
          // 如果选中了具体区或地铁站标签，就把它们拼到关键字里，做一个“区内 + 类型”的推荐搜索
          keywords:
            activeDistrict !== 'all'
              ? `${DISTRICT_CONFIG[activeDistrict as Exclude<DistrictKey, 'all'>].name}${
                  activeStationTag || cfg.keywords
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
          const sorted = applySortToItems(list, sortMode);
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
        console.error(e);
        message.error(`加载${cfg.label}失败`);
      } finally {
        setCategoryLoading(false);
      }
    },
    [activeDistrict, activeStationTag, currentCityAdcode, currentCity, setSearchMarkers, sortMode],
  );

  // “在此区域搜索”：按当前可视范围（bounds）取 Top20
  const fetchInViewTop20 = useCallback(
    async (category: CategoryKey) => {
      const map = mapRef.current;
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

        // 先按“推荐/权重”返回顺序，前端过滤进可视范围，再取前 20
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

        const sorted = applySortToItems(list, sortMode);
        setCategoryItems(sorted);
        setSearchMarkers(buildCategoryMarkers(sorted, category));
        setConfirmedPlaceMarker(null);
        setShowSearchInArea(false);
      } catch (e) {
        console.error(e);
        message.error(`在此区域搜索${cfg.label}失败`);
      } finally {
        setCategoryLoading(false);
      }
    },
    [setSearchMarkers, sortMode],
  );

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



  // 初始化当前城市的 adcode（基于本地城市数据）
  useEffect(() => {
    if (currentCityAdcode) return;
    const found = ALL_CITIES.find(
      (c) =>
        c.name === currentCity ||
        c.name.replace(/市$/, '') === currentCity ||
        currentCity.includes(c.name.replace(/市$/, '')),
    );
    if (found) {
      setCurrentCityAdcode(found.adcode);
    }
  }, [currentCity, currentCityAdcode]);

  // 当用户选择新的城市 adcode 时，加载天气
  useEffect(() => {
    if (currentCityAdcode) {
      fetchWeatherForAdcode(currentCityAdcode);
    }
  }, [currentCityAdcode, fetchWeatherForAdcode]);

  // 城市搜索结果（基于本地城市数据）
  useEffect(() => {
    const q = citySearchQuery.trim();
    if (!q) {
      setCitySearchResults([]);
      return;
    }
    setCitySearchResults(searchCities(q));
  }, [citySearchQuery]);

  // 省份分组（基于 adcode 前两位）
  const provinceGroups = React.useMemo<ProvinceGroup[]>(() => {
    const groups: ProvinceGroup[] = [];
    Object.entries(PROVINCE_CODE_MAP).forEach(([code, name]) => {
      const cities = ALL_CITIES.filter((c) => c.adcode.startsWith(code));
      if (cities.length > 0) {
        groups.push({ code, name, cities });
      }
    });
    return groups;
  }, []);

  // 选择城市：更新当前城市、地图中心与天气
  const handleSelectCity = useCallback(
    (city: CityData) => {
      setCurrentCity(city.name.replace(/市$/, ''));
      setCurrentCityAdcode(city.adcode);
      setMapCenter({ lng: city.center[0], lat: city.center[1] });
      setZoom(11);
      setShowCityDropdown(false);
      message.success(`已切换到：${city.name}`);
    },
    [setMapCenter, setZoom],
  );

  // 热门城市列表
  const hotCities = React.useMemo(
    () =>
      HOT_CITY_NAMES.map((name) =>
        ALL_CITIES.find(
          (c) =>
            c.name === name ||
            c.name.replace(/市$/, '') === name ||
            name.includes(c.name.replace(/市$/, '')),
        ),
      ).filter(Boolean) as CityData[],
    [],
  );

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
        ? await planDrivingRoute(params.origin, params.destination, params.waypoints, params.strategy)
        : await planWalkingRoute(params.origin, params.destination);

      // 保存规划结果
      setRouteResult(result);

      // 根据结果显示不同消息
      if (result.status === RouteServiceStatus.SUCCESS) {
        message.success(`${params.mode === 'driving' ? '🚗 驾车' : params.mode === 'walking' ? '🚶 步行' : '出行'}规划成功！`);
        // 保存到历史记录（去重用稳定ID）
        addRouteHistory({
          id: `${originText}=>${destText}`.replace(/\s+/g, ''),
          originText, destText, originLocation, destLocation, mode: params.mode
        });
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
      const strategy = routeMode === 'driving'
        ? (routeStrategyTab === 'avoidCongestion' ? RouteStrategy.AVOID_CONGESTION : RouteStrategy.FASTEST)
        : undefined;
      const res = await handlePlanRoute({ origin: originLocation, destination: destLocation, mode: routeMode, strategy } as any);
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
              zIndex: 3000,
              pointerEvents: 'auto',
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
                    onOpenChange={(open) => {
                      console.log('CityPopover onOpenChange ->', open);
                      setShowCityDropdown(open);
                    }}
                    trigger="click"
                    placement="bottomLeft"
                    arrow={false}
                    overlayStyle={{ zIndex: 3000 }}
                    align={{ offset: [0, 20] }} 
                    getPopupContainer={() => document.body}
                    content={
                      <div style={{ width: 560, padding: 12 }}>
                        {/* 当前城市与热门城市 */}
                        <div style={{ marginBottom: 8, fontSize: 13 }}>
                          当前城市：
                          <span style={{ color: '#1890ff', fontWeight: 600 }}>
                            {currentCity}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: '#999' }}>热门城市：</span>
                          {hotCities.map((city) => (
                            <Button
                              key={`${city.adcode}-${city.name}`}
                              size="small"
                              type={
                                city.name.replace(/市$/, '') === currentCity ? 'primary' : 'default'
                              }
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectCity(city);
                              }}
                            >
                              {city.name.replace(/市$/, '')}
                            </Button>
                          ))}
                        </div>

                        {/* 顶部标签 + 搜索框 */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                              size="small"
                              type={cityTab === 'city' ? 'primary' : 'default'}
                              onClick={() => setCityTab('city')}
                            >
                              按城市
                            </Button>
                            <Button
                              size="small"
                              type={cityTab === 'province' ? 'primary' : 'default'}
                              onClick={() => setCityTab('province')}
                            >
                              按省份
                            </Button>
                          </div>
                          <div style={{ width: 240 }}>
                            <Input.Search
                              placeholder="输入城市名/拼音"
                              allowClear
                              size="small"
                              value={citySearchQuery}
                              onChange={(e) => setCitySearchQuery(e.target.value)}
                              onSearch={(v) => setCitySearchQuery(v)}
                            />
                          </div>
                        </div>

                        {/* 列表区域 */}
                        <div style={{ maxHeight: '60vh', overflow: 'auto', fontSize: 13 }}>
                          {cityTab === 'city' ? (
                            <>
                              {/* 字母索引 */}
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: 4,
                                  padding: '4px 0',
                                  borderTop: '1px solid #f0f0f0',
                                  borderBottom: '1px solid #f0f0f0',
                                  marginBottom: 8,
                                }}
                              >
                                {LETTERS.map((letter) => (
                                  <Button
                                    key={letter}
                                    size="small"
                                    type={activeLetter === letter ? 'primary' : 'text'}
                                    style={{ padding: '0 6px', height: 22, lineHeight: '20px' }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setActiveLetter(letter);
                                      // 滚动到对应字母分组
                                      const section = document.getElementById(
                                        `city-section-${letter}`,
                                      );
                                      if (section) {
                                        section.scrollIntoView({
                                          behavior: 'smooth',
                                          block: 'start',
                                        });
                                      }
                                    }}
                                  >
                                    {letter}
                                  </Button>
                                ))}
                              </div>

                              {/* 城市列表（按字母） */}
                              {citySearchQuery.trim() ? (
                                citySearchResults.length > 0 ? (
                                  citySearchResults.map((city) => (
                                    <div
                                      key={`${city.adcode}-${city.name}`}
                                      style={{
                                        padding: '6px 4px',
                                        borderBottom: '1px solid #f5f5f5',
                                        cursor: 'pointer',
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelectCity(city);
                                      }}
                                    >
                                      <span style={{ marginRight: 8 }}>{city.name}</span>
                                      <span style={{ color: '#999', fontSize: 12}}>
                                        {city.pinyin}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ padding: 8, color: '#999' }}>未找到匹配的城市</div>
                                )
                              ) : (
                                LETTERS.map((letter) => {
                                  const list = CITIES_BY_LETTER[letter] || [];
                                  if (!list.length) return null;
                                  return (
                                    <div
                                      key={letter}
                                      id={`city-section-${letter}`}
                                      style={{
                                        padding: '6px 0',
                                        background:
                                          letter === activeLetter
                                            ? 'rgba(24,144,255,0.03)'
                                            : 'transparent',
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontWeight: 600,
                                          marginBottom: 4,
                                          color: '#1890ff',
                                        }}
                                      >
                                        {letter}
                                      </div>
                                      <div
                                        style={{
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          gap: 8,
                                          paddingLeft: 4,
                                        }}
                                      >
                                        {list.map((city, idx) => (
                                          <span
                                            key={`${city.adcode}-${city.name}-${idx}`}
                                            style={{
                                              cursor: 'pointer',
                                              whiteSpace: 'nowrap',
                                              padding: '2px 4px',
                                              borderRadius: 4,
                                            }}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              handleSelectCity(city);
                                            }}
                                          >
                                            {city.name.replace(/市$/, '')}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </>
                          ) : (
                            /* 按省份 */
                            <>
                              {provinceGroups.map((pg) => (
                                <div
                                  key={pg.code}
                                  style={{
                                    padding: '6px 0',
                                    borderBottom: '1px solid #f5f5f5',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      marginBottom: 4,
                                      color: '#1890ff',
                                    }}
                                  >
                                    {pg.name}
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      gap: 8,
                                      paddingLeft: 4,
                                    }}
                                  >
                                    {pg.cities.map((city, idx) => (
                                      <span
                                        key={`${pg.code}-${city.adcode}-${idx}`}
                                        className="city-item"
                                        style={{
                                          cursor: 'pointer',
                                          whiteSpace: 'nowrap',
                                          padding: '2px 4px',
                                          borderRadius: 4,
                                        }}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          handleSelectCity(city);
                                        }}
                                      >
                                        {city.name.replace(/市$/, '')}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    }
                  >
                    <Button size="small">
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
                        position: 'absolute',
                        top: 60,
                        left: 0,
                        width: SEARCH_PANEL_WIDTH,
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
                                setShowSearchInArea(true); // 显示“在此区域搜索”按钮
                              setCategoryCollapsed(false);
                              setDistrictPanelOpen(false);
                                fetchCityTop20(c.key); // 默认全城推荐 Top20
                              }}
                              style={{
                                flex: '1 1 0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 6,
                                padding: 6,
                                cursor: 'pointer',
                                borderRadius: 10,
                                background: '#fafafa',
                              }}
                            >
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 8,
                                  background: '#fff',
                                  border: '1px solid #eee',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 20,
                                }}
                              >
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
                  )}

                  {/* 分类搜索结果弹窗：紧贴搜索框下方，宽度与搜索框一致 */}
                  {showCategorySheet && (
                    <div
                      ref={categoryPanelRef}
                      style={{
                        position: 'absolute',
                        top: 60,
                        left: 0,
                        width: SEARCH_PANEL_WIDTH,
                        background: '#fff',
                        borderRadius: 6,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
                        zIndex: 1400,
                        maxHeight: '70vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                      }}
                    >
                      {/* 收起态：提示条（hover 后展开） */}
                      {categoryCollapsed && (
                        <div
                          style={{
                            padding: '10px 12px',
                            fontSize: 12,
                            color: '#333',
                            background: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                          onMouseEnter={() => setCategoryCollapsed(false)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setCategoryCollapsed(false)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600 }}>{CATEGORY_CONFIG[activeCategory].label}</span>
                            <span style={{ color: '#999' }}>
                              {activeDistrict === 'all'
                                ? '展开搜索结果'
                                : `${DISTRICT_CONFIG[activeDistrict as Exclude<DistrictKey, 'all'>].name}${activeStationTag ? ` · ${activeStationTag}` : ''} · 展开搜索结果`}
                            </span>
                          </div>
                          <span style={{ color: '#1677ff',paddingRight: 50}}>展开 ▾</span>
                        </div>
                      )}

                      {/* 收起态：独立的关闭按钮（绝对定位，不放在提示条内部，避免 hover 误触） */}
                      {categoryCollapsed && (
                        <Button
                          size="small"
                          type="primary"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCategorySheet(false);
                            setCategoryCollapsed(false);
                            setDistrictPanelOpen(false);
                            setCategoryDetailItem(null);
                            setShowSearchInArea(false);
                            setShowRoutePanel(false);
                            setHistoryVisible(false);
                          }}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            width: 50,
                            height: 40,
                            padding: 0,
                            minWidth: 26,
                            lineHeight: '26px',
                            boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 5,
                          }}
                        >
                          ×
                        </Button>
                      )}

                      {/* 展开态内容 */}
                      {!categoryCollapsed && !categoryDetailItem && (
                        <>
                          {/* 顶部筛选条（相对定位：承载绝对定位的下滑块） */}
                          <div style={{ position: 'relative', borderBottom: '1px solid #f0f0f0' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            padding: '8px 10px',
                            fontSize: 12,
                            color: '#333',
                            background: '#fff',
                          }}
                        >
                          {/* 全城筛选：点击展开区 + 地铁站分类 */}
                          <div
                            style={{
                              flex: 1,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            onClick={() => {
                              setDistrictPanelOpen((v) => !v);
                            }}
                          >
                            <span>
                              {activeDistrict === 'all'
                                ? '全城'
                                : DISTRICT_CONFIG[activeDistrict as Exclude<DistrictKey, 'all'>].name}
                            </span>
                            <span>▾</span>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            {CATEGORY_CONFIG[activeCategory].label} ▾
                          </div>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                          <Select
                            size="small"
                            value={sortMode}
                            onChange={(v) => {
                              setSortMode(v);
                              // 直接对当前列表重排（不额外请求）
                              const sorted = applySortToItems(categoryItems, v);
                              setCategoryItems(sorted);
                              setSearchMarkers(buildCategoryMarkers(sorted, activeCategory));
                            }}
                            options={[
                              { value: 'recommend', label: '推荐排序' },
                              { value: 'distance', label: '距离优先' },
                              { value: 'rating', label: '评分优先' },
                            ]}
                            style={{ width: 110 }}
                          />
                          </div>
                        </div>

                        {/* 绝对定位下滑块：左侧区 / 右侧地铁站 */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 34, // 约等于顶部筛选条高度
                            left: 0,
                            right: 0,
                            background: '#fff',
                            borderBottom: '1px solid #f5f5f5',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.50)',
                            maxHeight: districtPanelOpen ? 260 : 0,
                            opacity: districtPanelOpen ? 1 : 0,
                            transform: districtPanelOpen ? 'translateY(0)' : 'translateY(-6px)',
                            transition: 'max-height 220ms ease, opacity 180ms ease, transform 180ms ease',
                            pointerEvents: districtPanelOpen ? 'auto' : 'none',
                            zIndex: 2,
                          }}
                        >
                          <div style={{ display: 'flex', height: 260 }}>
                            {/* 左侧：区域 */}
                            <div
                              style={{
                                width: 120,
                                borderRight: '1px solid #f0f0f0',
                                overflow: 'auto',
                                padding: 6,
                                background: '#fafafa',
                              }}
                            >
                              {([
                                { key: 'all' as DistrictKey, label: '附近' },
                                { key: 'futian' as DistrictKey, label: '福田区' },
                                { key: 'luohu' as DistrictKey, label: '罗湖区' },
                                { key: 'nanshan' as DistrictKey, label: '南山区' },
                                { key: 'baoan' as DistrictKey, label: '宝安区' },
                                { key: 'longgang' as DistrictKey, label: '龙岗区' },
                                { key: 'longhua' as DistrictKey, label: '龙华区' },
                              ]).map((d) => {
                                const active = activeDistrict === d.key;
                                return (
                                  <div
                                    key={d.key}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      setActiveDistrict(d.key);
                                      setActiveStationTag(null);

                                      if (d.key === 'all') {
                                        fetchCityTop20(activeCategory);
                                        return;
                                      }

                                      const info = DISTRICT_CONFIG[d.key as Exclude<DistrictKey, 'all'>];
                                      setMapCenter(info.center);
                                      setZoom(13);
                                      fetchCityTop20(activeCategory);
                                    }}
                                    style={{
                                      padding: '8px 8px',
                                      borderRadius: 6,
                                      cursor: 'pointer',
                                      background: active ? '#e6f4ff' : 'transparent',
                                      color: active ? '#1677ff' : '#333',
                                      fontSize: 12,
                                    }}
                                  >
                                    {d.label}
                                  </div>
                                );
                              })}
                            </div>

                            {/* 右侧：地铁站 */}
                            <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>

                              {activeDistrict === 'all' ? (
                                <div style={{ fontSize: 12, color: '#999', padding: '6px 0' }}>
                                  选择左侧区域后可按地铁站筛选
                                </div>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                                  {DISTRICT_CONFIG[activeDistrict as Exclude<DistrictKey, 'all'>].stations.map((s: string) => {
                                    const active = activeStationTag === s;
                                    return (
                                      <div
                                        key={s}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                          setActiveStationTag((prev) => (prev === s ? null : s));
                                          setTimeout(() => fetchCityTop20(activeCategory), 0);
                                        }}
                                        style={{
                                          fontSize: 12,
                                          padding: '6px 6px',
                                          borderRadius: 6,
                                          border: active ? '1px solid #52c41a' : '1px solid transparent',
                                          background: active ? 'rgba(82,196,26,0.10)' : '#fff',
                                          cursor: 'pointer',
                                          color: '#333',
                                          textAlign: 'center',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                        title={s}
                                      >
                                        {s}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 列表 */}
                      <div
                        style={{
                          overflow: 'auto',
                          padding: '6px 10px 8px',
                          // 下滑块为绝对定位，给列表让出空间，避免被遮挡
                          paddingTop: districtPanelOpen ? 266 : 6,
                        }}
                      >
                        {categoryLoading ? (
                          <div style={{ padding: 8, fontSize: 13, color: '#666' }}>加载中...</div>
                        ) : (
                          categoryItems.map((it, idx) => (
                            <div
                              key={it.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setMapCenter(it.location);
                                setZoom(16);
                                selectCategoryItemForDetail(it);
                              }}
                              style={{
                                display: 'flex',
                                gap: 8,
                                padding: '10px 0',
                                borderBottom: '1px solid #f5f5f5',
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ width: 18, color: '#666', fontSize: 12, marginTop: 2 }}>
                                {idx + 1}.
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#111',
                                    marginBottom: 4,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {it.name}
                                </div>

                                <div style={{ fontSize: 11, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ color: '#ff4d4f' }}>
                                    {'★'.repeat(Math.max(1, Math.min(5, Math.round(it.rating))))}
                                    <span style={{ color: '#ddd' }}>
                                      {'★'.repeat(Math.max(0, 5 - Math.round(it.rating)))}
                                    </span>
                                  </span>
                                  <span style={{ color: '#999' }}>人均: ¥{it.cost}</span>
                                  {typeof it.distance === 'number' && (
                                    <span style={{ color: '#999' }}>
                                      {it.distance < 1000 ? `${it.distance}m` : `${(it.distance / 1000).toFixed(1)}km`}
                                    </span>
                                  )}
                                </div>

                                <div style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}>
                                  {it.address || '--'}
                                </div>
                              </div>

                              <div
                                style={{
                                  width: 68,
                                  height: 68,
                                  borderRadius: 8,
                                  background: '#f5f5f5',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                  border: '1px solid #eee',
                                }}
                              >
                                <img
                                  src={it.photoUrl}
                                  alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                              </div>
                            </div>
                          ))
                        )}

                        {!categoryLoading && categoryItems.length === 0 && (
                          <div style={{ padding: 8, fontSize: 13, color: '#666' }}>暂无结果</div>
                        )}
                      </div>

                      {/* 底部关闭行 */}
                      <div style={{ padding: 6, borderTop: '1px solid #f0f0f0', textAlign: 'right' }}>
                        <Button
                          size="small"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setShowCategorySheet(false);
                            setShowSearchInArea(false);
                            setCategoryCollapsed(false);
                            setDistrictPanelOpen(false);
                            setHistoryVisible(false);
                            setCategoryDetailItem(null);
                          }}
                        >
                          关闭
                        </Button>
                      </div>
                        </>
                      )}

                      {/* 详情态：替换列表，位置与弹窗一致 */}
                      {categoryDetailItem && (
                        <div style={{ position: 'relative', background: '#fff' }}>
                          <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                            <img
                              src={categoryDetailItem.photoUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            <Button
                              size="small"
                              onClick={() => {
                                setCategoryDetailItem(null);
                                // 清掉 label
                                setSearchMarkers((prev) =>
                                  (prev || []).map((m: any) => ({ ...m, data: { ...(m.data || {}), labelText: undefined } })),
                                );
                              }}
                              style={{ position: 'absolute', top: 10, left: 10 }}
                            >
                              返回
                            </Button>

                            <Button
                              type="primary"
                              onClick={() => {startNavigateTo(categoryDetailItem);setCategoryDetailItem(null);setCategoryCollapsed(false)}}
                              style={{
                                position: 'absolute',
                                right: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                height: 44,
                                width: 44,
                                borderRadius: 22,
                                padding: 0,
                                boxShadow: '0 10px 22px rgba(0,0,0,0.22)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                lineHeight: 1.1,
                              }}
                            >
                              {/* <div style={{ fontSize: 16, marginBottom: 2 }}>↑</div> */}
                              <div style={{ fontSize: 11 }}>到这去</div>
                            </Button>
                          </div>

                          <div style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                              {categoryDetailItem.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
                              {categoryDetailItem.address || '--'}
                            </div>
                            {categoryDetailItem.tel && (
                              <div style={{ fontSize: 12, color: '#666' }}>{categoryDetailItem.tel}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                              strategy: routeMode === 'driving'
                                ? (routeStrategyTab === 'avoidCongestion' ? RouteStrategy.AVOID_CONGESTION : RouteStrategy.FASTEST)
                                : undefined,
                            } as any;
                            await handlePlanRoute(params);
                            // 保存历史
                            addRouteHistory({
                              id: `${originText}=>${destText}-${Date.now()}`,
                              originText, destText, originLocation, destLocation, mode: routeMode
                            });
                          }}>{routeMode === 'driving' ? '开车去' : routeMode === 'transit' ? '公交去' : routeMode === 'riding' ? '骑行去' : routeMode === 'electric' ? '电动车去' : '步行去'}</Button>
                        </div>

                        {/* 路线搜索记录 / 推荐方案面板 */}
                        <div style={{ marginTop: 12 }}>
                          {/* 优先显示搜索结果；否则如果已有规划结果，显示方案 Tab + 折叠详情；再否则显示原来的搜索/历史列表 */}
                          {routeResult && routeResult.status === RouteServiceStatus.SUCCESS && routeResult.data && !routePanelSearchVisible ? (
                            <div>
                              {/* 当前展示的方案（高德可能返回多条 paths） */}
                              {(() => {
                                const plans = (routeResult.data as any).plans as any[] | undefined;
                                const selected = (plans && plans.length > 0)
                                  ? (plans[routePlanIndex] || plans[0])
                                  : routeResult.data;
                                const selectedSteps = (selected as any)?.steps || [];

                                const makeViaText = (steps: any[]) => {
                                  if (!steps || steps.length === 0) return '若干道路';
                                  return steps
                                    .slice(0, 3)
                                    .map(s => (s.instruction || '').toString().trim())
                                    .filter(Boolean)
                                    .join('、') || '若干道路';
                                };

                                return (
                                  <>
                              {/* 顶部方案切换：推荐方案 / 避免拥堵（仅驾车模式下高亮可切换） */}
                              {routeMode === 'driving' && (
                                <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', marginBottom: 8 }}>
                                  {[
                                    { key: 'recommend' as const, label: '推荐方案', strategy: RouteStrategy.FASTEST },
                                    { key: 'avoidCongestion' as const, label: '避免拥堵', strategy: RouteStrategy.AVOID_CONGESTION },
                                  ].map(tab => (
                                    <div
                                      key={tab.key}
                                      onClick={async () => {
                                        if (routeStrategyTab === tab.key) return;
                                        setRouteStrategyTab(tab.key);
                                        setRoutePlanIndex(0);
                                        setExpandedPlanIndex(null);
                                        // 重新按策略规划（需要起终点存在）
                                        if (originLocation && destLocation) {
                                          const params: RoutePlanningParams = {
                                            origin: originLocation,
                                            destination: destLocation,
                                            mode: 'driving',
                                            strategy: tab.strategy,
                                          } as any;
                                          await handlePlanRoute(params);
                                        }
                                      }}
                                      style={{
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        color: routeStrategyTab === tab.key ? '#1890ff' : '#666',
                                        borderBottom: routeStrategyTab === tab.key ? '2px solid #1890ff' : '2px solid transparent',
                                        fontWeight: routeStrategyTab === tab.key ? 600 : 400,
                                      }}
                                    >
                                      {tab.label}
                                    </div>
                                  ))}
                                  <div style={{ flex: 1 }} />
                                </div>
                              )}

                              {/* 多方案列表（垂直）：默认都折叠，点右侧箭头展开；点整行切换地图路线 */}
                              <div style={{ maxHeight: 220, overflow: 'auto' }}>
                                {(plans && plans.length > 0 ? plans : [selected]).map((plan: any, idx: number) => {
                                  const expanded = expandedPlanIndex === idx;
                                  const isActive = routePlanIndex === idx;
                                  const steps = plan?.steps || [];
                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        borderBottom: '1px solid #f0f0f0',
                                        padding: '8px 2px',
                                        background: isActive ? '#f6fbff' : 'transparent',
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div
                                          style={{ cursor: 'pointer', flex: 1 }}
                                          onClick={() => {
                                            setRoutePlanIndex(idx);
                                          }}
                                        >
                                          <div style={{ fontSize: 14, fontWeight: 600 }}>
                                            约{Math.max(1, Math.round(((plan?.duration || 0) as number) / 60))}分钟
                                            <span style={{ margin: '0 8px', color: '#999' }}>
                                              {(((plan?.distance || 0) as number) / 1000).toFixed(1)}公里
                                            </span>
                                          </div>
                                          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                            途经：{makeViaText(steps)}
                                          </div>
                                        </div>
                                        <div
                                          style={{ color: '#999', paddingRight: 4, cursor: 'pointer' }}
                                          onClick={() => setExpandedPlanIndex(v => (v === idx ? null : idx))}
                                        >
                                          {expanded ? <UpOutlined /> : <DownOutlined />}
                                        </div>
                                      </div>

                                      {expanded && (
                                        <div style={{ marginTop: 8, borderTop: '1px solid #f5f5f5', paddingTop: 8 }}>
                                          {/* 起点 */}
                                          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 6 }}>
                                            <div style={{ width: 24, textAlign: 'center', color: '#1890ff', fontSize: 12 }}>
                                              起
                                            </div>
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontSize: 13, fontWeight: 500 }}>
                                                从 {originText || '起点'} 出发
                                              </div>
                                            </div>
                                          </div>

                                          {/* 步骤 */}
                                          {steps.map((step: any, sIdx: number) => (
                                            <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 6 }}>
                                              <div style={{ width: 24, textAlign: 'center', color: '#52c41a', fontSize: 12 }}>●</div>
                                              <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13 }}>{step.instruction}</div>
                                                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                                  {(((step.distance || 0) as number) / 1000).toFixed(1)}公里
                                                </div>
                                              </div>
                                            </div>
                                          ))}

                                          {/* 终点 */}
                                          <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 4 }}>
                                            <div style={{ width: 24, textAlign: 'center', color: '#ff4d4f', fontSize: 12 }}>
                                              终
                                            </div>
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontSize: 13, fontWeight: 500 }}>
                                                到达终点 {destText || '终点'}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <div>
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
                                            setOriginText(r.originText || ''); setDestText(r.destText || '');
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
                                                    id: `${r.originText}=>${r.destText}`.replace(/\s+/g, ''),
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
                          )}
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 10,
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
                    <Button
                      size="small"
                      type={showTraffic ? 'primary' : 'default'}
                      onClick={() => {
                        const newValue = !showTraffic;
                        console.log('🚗 路况按钮点击 - 当前状态:', showTraffic, '-> 新状态:', newValue);
                        setShowTraffic(newValue);
                        setTrafficPanelVisible(newValue);
                      }}
                      icon={<CarOutlined />}
                    >
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

          {/* 路况实时/预测面板 */}
          {trafficPanelVisible && (
            <Card
              size="small"
              style={{
                width: 280,
                borderRadius: 8,
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                padding: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <Button
                  type={trafficMode === 'realtime' ? 'primary' : 'default'}
                  size="small"
                  style={{ marginRight: 4 }}
                  onClick={() => setTrafficMode('realtime')}
                >
                  实时
                </Button>
                <Button
                  type={trafficMode === 'forecast' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setTrafficMode('forecast')}
                >
                  预测
                </Button>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: '#888' }}>
                  畅通
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 4,
                      background: '#00aa00',
                      borderRadius: 2,
                      margin: '0 4px',
                    }}
                  />
                  缓行
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 4,
                      background: '#ffcc00',
                      borderRadius: 2,
                      margin: '0 4px',
                    }}
                  />
                  拥堵
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 4,
                      background: '#ff0000',
                      borderRadius: 2,
                      marginLeft: 4,
                    }}
                  />
                </span>
              </div>

              {trafficMode === 'realtime' ? (
                <div style={{ fontSize: 12, color: '#555' }}>当前显示为实时路况</div>
              ) : (
                <>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>
                    预测时间：
                    <span style={{ fontWeight: 500 }}>
                      星期{WEEK_LABELS[trafficWeekday]} {trafficHour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    {WEEK_LABELS.map((label, idx) => {
                      const isToday = idx === new Date().getDay();
                      const isActive = idx === trafficWeekday;
                      return (
                        <span
                          key={idx}
                          style={{
                            padding: '2px 4px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            color: isActive ? '#1890ff' : '#555',
                            background: isActive ? 'rgba(24,144,255,0.08)' : 'transparent',
                          }}
                          onClick={() => setTrafficWeekday(idx)}
                        >
                          {label}
                          {isToday && ' (今天)'}
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 12, marginBottom: 2 }}>时间</div>
                  <Slider
                    min={0}
                    max={23}
                    step={1}
                    value={trafficHour}
                    onChange={(val) => {
                      if (typeof val === 'number') {
                        setTrafficHour(val);
                      }
                    }}
                    marks={{
                      0: '00',
                      6: '06',
                      12: '12',
                      18: '18',
                      24: '24',
                    }}
                  />
                </>
              )}
            </Card>
          )}
            </div>

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
                showTraffic={showTraffic}
                showSubway={showSubway}
                measureMode={measureMode}
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

              {/* 在此区域搜索按钮：位于地图底部中间，距离底部约 50px */}
              {showCategorySheet && showSearchInArea && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 50,
                    transform: 'translateX(-50%)',
                    zIndex: 1100,
                  }}
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
