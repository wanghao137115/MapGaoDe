import React, { useState, useCallback, useEffect } from 'react';  // React核心hooks
import { 
  Card,          // 卡片容器组件
  Row,           // 栅格行组件  
  Col,           // 栅格列组件
  Space,         // 间距组件
  Button,        // 按钮组件
  Select,        // 选择器组件
  Badge,         // 徽章组件
  Tag,           // 标签组件
  Timeline,      // 时间轴组件
  Statistic,     // 统计数值组件
  Progress,      // 进度条组件
  Divider,       // 分割线组件
  message,       // 消息提示
  Modal,         // 弹窗组件
  Form,          // 表单组件
  Input,         // 输入框组件
  DatePicker,    // 日期选择器
  TimePicker,    // 时间选择器
} from 'antd';    // Ant Design UI组件库

import { 
  CarOutlined,        // 车辆图标
  EnvironmentOutlined,// 位置图标  
  ClockCircleOutlined,// 时间图标
  PlayCircleOutlined, // 播放图标
  PauseCircleOutlined,// 暂停图标
  ReloadOutlined,     // 刷新图标
  CheckCircleOutlined,// 完成图标
  ExclamationCircleOutlined, // 警告图标
  MenuFoldOutlined,   // 折叠图标
  MenuUnfoldOutlined, // 展开图标
  UpOutlined,         // 向上收起
  DownOutlined,       // 向下展开
} from '@ant-design/icons'; // Ant Design图标库

import MapContainer from '@/components/Map/MapContainer';  // 地图容器组件
import MarkerLayer from '@/components/Map/MarkerLayer';    // 标记层组件
import RouteLayer from '@/components/Map/RouteLayer';      // 路径层组件
import RoutePlanningForm, { RoutePlanningParams } from '@/components/Map/RoutePlanningForm'; // 路径规划表单
import RouteDetailsPanel from '@/components/Map/RouteDetailsPanel'; // 路径详情面板
import PlaceSearch from '@/components/Map/PlaceSearch';    // 地点搜索组件
import { useGeolocation } from '@/hooks/useGeolocation';    // 地理位置hook

import type { MapPosition, Marker } from '@/types';         // 类型定义

// 定义车辆状态枚举
enum VehicleStatus {
  IDLE = 'idle',           // 空闲状态
  EN_ROUTE = 'en_route',   // 行驶中
  DELIVERING = 'delivering', // 配送中
  MAINTENANCE = 'maintenance', // 维修中
  OFFLINE = 'offline'      // 离线状态
}

// 定义配送任务状态枚举  
enum DeliveryStatus {
  PENDING = 'pending',     // 待分配
  ASSIGNED = 'assigned',   // 已分配
  IN_TRANSIT = 'in_transit', // 运输中
  DELIVERED = 'delivered', // 已送达
  FAILED = 'failed'        // 配送失败
}

// 快递优先级枚举
enum DeliveryPriority {
  NORMAL = 'normal',   // 普通
  URGENT = 'urgent'    // 加急
}

// 车辆信息接口定义
interface Vehicle {
  id: string;              // 车辆唯一标识
  licensePlate: string;    // 车牌号
  driver: string;          // 司机姓名
  status: VehicleStatus;   // 车辆状态
  position: MapPosition;   // 当前位置
  batteryLevel: number;    // 电量百分比
  lastUpdate: Date;        // 最后更新时间
  speed: number;           // 当前速度(km/h)
  temperature: number;     // 车内温度(°C)
}

// 配送任务接口定义
interface DeliveryTask {
  id: string;              // 任务唯一标识
  vehicleId: string;       // 分配车辆ID
  orderId: string;         // 订单号
  customerName: string;    // 客户姓名
  customerPhone: string;   // 客户电话
  pickupAddress: MapPosition;  // 取货地址（快递站位置）
  deliveryAddress: MapPosition; // 送货地址（终点）
  status: DeliveryStatus;  // 任务状态
  priority: DeliveryPriority;  // 快递优先级
  estimatedArrival: Date;  // 预计送达时间
  actualArrival?: Date;    // 实际送达时间
  items: string[];         // 配送物品列表
  notes?: string;          // 备注信息
}

// 轨迹点接口定义
interface TrackPoint {
  position: MapPosition;   // 轨迹点位置
  timestamp: Date;         // 时间戳
  speed: number;           // 速度
  status: VehicleStatus;   // 车辆状态
}

// 配送节点接口定义
interface DeliveryNode {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  position?: MapPosition;
}

type UserRole = 'admin' | 'courier';

// 物流追踪业务场景占位页面
// 后续在此接入车辆轨迹、时间线等业务组件
const LogisticsTracking: React.FC = () => {
  // 获取用户当前位置
  const { position: userPosition, loading: locationLoading, error: locationError } = useGeolocation();

  // 地图中心点状态 - 默认为北京，获取到用户位置后自动更新
  const [mapCenter, setMapCenter] = useState<MapPosition>({ lng: 116.3974, lat: 39.9093 });
  const [mapZoom, setMapZoom] = useState<number>(12);

  // 搜索结果标记
  const [searchMarkers, setSearchMarkers] = useState<any[]>([]);
  // 确认的地点标记（星号）
  const [confirmedPlaceMarker, setConfirmedPlaceMarker] = useState<any>(null);

  // 车辆列表状态 - 所有车辆一开始都是空闲状态
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 'v001',
      licensePlate: '粤A12345',
      driver: '张师傅',
      status: VehicleStatus.IDLE,
      position: { lng: 116.3974, lat: 39.9093 },
      batteryLevel: 85,
      lastUpdate: new Date(),
      speed: 0,
      temperature: 22
    },
    {
      id: 'v002',
      licensePlate: '粤B67890',
      driver: '李师傅',
      status: VehicleStatus.IDLE,
      position: { lng: 116.4074, lat: 39.9193 },
      batteryLevel: 92,
      lastUpdate: new Date(),
      speed: 0,
      temperature: 20
    },
    {
      id: 'v003',
      licensePlate: '粤C34567',
      driver: '王师傅',
      status: VehicleStatus.IDLE,
      position: { lng: 116.3874, lat: 39.9393 },
      batteryLevel: 78,
      lastUpdate: new Date(),
      speed: 0,
      temperature: 21
    }
  ]);

  // 配送任务列表状态 - 一开始没有任务（只有确认派送后才出现）
  const [deliveryTasks, setDeliveryTasks] = useState<DeliveryTask[]>([]);
  
  // 快递站位置（区域内随机生成）
  const [warehousePosition] = useState<MapPosition>(() => {
    // 基于地图中心点，在区域内随机生成快递站位置
    const baseLng = 116.3974;
    const baseLat = 39.9093;
    return {
      lng: baseLng + (Math.random() - 0.5) * 0.05,
      lat: baseLat + (Math.random() - 0.5) * 0.05
    };
  });

  // 轨迹回放相关状态
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(''); // 选中的车辆ID
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]); // 轨迹点数据
  const [isPlaying, setIsPlaying] = useState(false); // 是否正在播放轨迹
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0); // 当前播放到的轨迹点索引
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 播放速度倍数

  // UI状态
  const [selectedTask, setSelectedTask] = useState<DeliveryTask | null>(null); // 选中的任务
  const [showTaskModal, setShowTaskModal] = useState(false); // 显示任务详情弹窗
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false); // 显示车辆分配弹窗
  const [assigningVehicleId, setAssigningVehicleId] = useState<string>(''); // 正在分配任务的车辆ID
  const [assignDeliveryAddress, setAssignDeliveryAddress] = useState<MapPosition | null>(null); // 分配的终点地址
  const [assignPriority, setAssignPriority] = useState<DeliveryPriority>(DeliveryPriority.NORMAL); // 分配的优先级
  const [routeResult, setRouteResult] = useState<any>(null); // 路径规划结果

  // 车辆轨迹状态 - 实时轨迹
  const [activeRoutes, setActiveRoutes] = useState<{[vehicleId: string]: MapPosition[]}>({}); // 正在行驶车辆的实时轨迹

  // 配送节点状态
  const [deliveryNodes, setDeliveryNodes] = useState<{[taskId: string]: DeliveryNode[]}>({}); // 配送任务的时间线节点
  const [selectedTaskTimeline, setSelectedTaskTimeline] = useState<string | null>(null); // 选中的任务时间线

  // 页面角色：管理员 / 派送员
  const [userRole, setUserRole] = useState<UserRole>('admin');
  // 当前查看的派送员（这里用车辆模拟，一个车辆=一个派送员）
  const [selectedCourierId, setSelectedCourierId] = useState<string>('v001');
  
  // 管理员视图面板折叠状态
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState<boolean>(false);
  const [statsPanelCollapsed, setStatsPanelCollapsed] = useState<boolean>(false);
  const [vehiclePanelCollapsed, setVehiclePanelCollapsed] = useState<boolean>(false);
  const [taskPanelCollapsed, setTaskPanelCollapsed] = useState<boolean>(false);

  // 当获取到用户位置时，更新地图中心点
  useEffect(() => {
    if (userPosition) {
      setMapCenter(userPosition);
      setMapZoom(14); // 设置合适的缩放级别
      // 同时更新车辆的初始位置为用户当前位置附近
      setVehicles(prevVehicles =>
        prevVehicles.map((vehicle, index) => ({
          ...vehicle,
          position: {
            lng: userPosition.lng + (Math.random() - 0.5) * 0.02,
            lat: userPosition.lat + (Math.random() - 0.5) * 0.02
          }
        }))
      );
    }
  }, [userPosition]);

  // 处理地点选择（点击搜索结果）
  const handlePlaceSelect = useCallback((place: any) => {
    // 如果正在设置派送任务，直接设置为终点
    if (showAssignModal && assigningVehicleId) {
      setAssignDeliveryAddress(place.location);
      return;
    }
    // 只设置选中状态，不立即跳转地图
    // 用户可以通过回车确认来跳转
  }, [showAssignModal, assigningVehicleId]);

  // 处理地图点击 - 如果正在设置派送任务，设置终点
  const handleMapClick = useCallback((e: any) => {
    if (showAssignModal && assigningVehicleId) {
      const position: MapPosition = {
        lng: e.lnglat.lng,
        lat: e.lnglat.lat
      };
      setAssignDeliveryAddress(position);
      message.success('已通过地图点击设置配送终点');
    }
  }, [showAssignModal, assigningVehicleId]);

  // 处理地点确认（回车确定）
  const handlePlaceConfirm = useCallback((place: any) => {
    // 设置地图中心点为确认的地点
    setMapCenter(place.location);
    setMapZoom(16); // 放大显示

    // 清除之前的搜索标记和确认标记
    setSearchMarkers([]);
    setConfirmedPlaceMarker(null);

    // 添加星号标记作为确认地点
    const starMarker = {
      id: `confirmed-${place.id}`,
      type: 'store' as const,
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
    message.success(`已锁定配送目的地: ${place.name}`);
  }, []);

  // ===== 工具函数 =====
  
  // 获取车辆状态对应的颜色和文本
  const getVehicleStatusInfo = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.IDLE:
        return { color: 'default', text: '空闲中', icon: <CheckCircleOutlined /> };
      case VehicleStatus.EN_ROUTE:
        return { color: 'processing', text: '行驶中', icon: <CarOutlined /> };
      case VehicleStatus.DELIVERING:
        return { color: 'success', text: '配送中', icon: <EnvironmentOutlined /> };
      case VehicleStatus.MAINTENANCE:
        return { color: 'warning', text: '维修中', icon: <ExclamationCircleOutlined /> };
      case VehicleStatus.OFFLINE:
        return { color: 'error', text: '离线', icon: <ExclamationCircleOutlined /> };
      default:
        return { color: 'default', text: '未知', icon: <ExclamationCircleOutlined /> };
    }
  };

    // 生成配送任务的时间线节点
    const generateDeliveryNodes = useCallback((task: DeliveryTask): DeliveryNode[] => {
      const nodes: DeliveryNode[] = [];
      const now = new Date();
  
      // 任务分配节点
      nodes.push({
        id: `${task.id}-assigned`,
        title: '任务已分配',
        description: `车辆 ${vehicles.find(v => v.id === task.vehicleId)?.licensePlate} 已分配该任务`,
        timestamp: new Date(now.getTime() - 3600000), // 1小时前分配
        status: 'completed',
      });
  
      // 取货节点
      nodes.push({
        id: `${task.id}-pickup`,
        title: '开始取货',
        description: `从仓库取货，准备配送给 ${task.customerName}`,
        timestamp: new Date(now.getTime() - 1800000), // 30分钟前开始取货
        status: task.status === DeliveryStatus.PENDING ? 'pending' : 'completed',
        position: task.pickupAddress,
      });
  
      // 运输中节点
      nodes.push({
        id: `${task.id}-transit`,
        title: '配送中',
        description: `车辆正在前往 ${task.customerName} 的配送地址`,
        timestamp: new Date(now.getTime() - 900000), // 15分钟前开始运输
        status: task.status === DeliveryStatus.IN_TRANSIT ? 'in_progress' :
                ['delivered', 'failed'].includes(task.status) ? 'completed' : 'pending',
      });
  
      // 送达节点
      nodes.push({
        id: `${task.id}-delivered`,
        title: task.status === DeliveryStatus.DELIVERED ? '已送达' : '等待送达',
        description: `预计送达时间: ${task.estimatedArrival.toLocaleString()}`,
        timestamp: task.status === DeliveryStatus.DELIVERED ? new Date() : task.estimatedArrival,
        status: task.status === DeliveryStatus.DELIVERED ? 'completed' :
                task.status === DeliveryStatus.FAILED ? 'failed' : 'pending',
        position: task.deliveryAddress,
      });
  
      return nodes;
    }, [vehicles]);

    // 计算地图中心点 - 只有在有车辆行驶时才跟随车辆
    const calculateMapCenter = useCallback(() => {
      const enRouteVehicles = vehicles.filter(v => v.status === VehicleStatus.EN_ROUTE);

      if (enRouteVehicles.length === 0) {
        // 如果没有行驶中的车辆，不改变地图中心点
        return null;
      }

      if (enRouteVehicles.length === 1) {
        // 如果只有一辆行驶中的车辆，以该车辆为中心
        return enRouteVehicles[0].position;
      }

      // 如果有多辆行驶中的车辆，计算所有车辆的中心点
      const lngs = enRouteVehicles.map(v => v.position.lng);
      const lats = enRouteVehicles.map(v => v.position.lat);

      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

      return { lng: centerLng, lat: centerLat };
    }, [vehicles]);

    // 当车辆状态或位置变化时，如果有行驶车辆则更新地图中心点
    useEffect(() => {
      const newCenter = calculateMapCenter();
      if (newCenter) {
        setMapCenter(newCenter);
      }
    }, [calculateMapCenter]);

    // 处理任务状态更新
    const handleTaskStatusUpdate = useCallback((taskId: string, newStatus: DeliveryStatus) => {
      setDeliveryTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
  
      // 同步更新对应车辆的状态
      const task = deliveryTasks.find(t => t.id === taskId);
      if (task) {
        let newVehicleStatus: VehicleStatus;
        switch (newStatus) {
          case DeliveryStatus.DELIVERED:
            newVehicleStatus = VehicleStatus.IDLE; // 任务完成，车辆变为空闲
            // 清除该车辆的实时轨迹
            setActiveRoutes(prev => {
              const newRoutes = { ...prev };
              delete newRoutes[task.vehicleId];
              return newRoutes;
            });
           
            break;
          case DeliveryStatus.IN_TRANSIT:
            newVehicleStatus = VehicleStatus.EN_ROUTE; // 任务开始运输，车辆变为行驶中
            // 初始化该车辆的实时轨迹
            setActiveRoutes(prev => ({
              ...prev,
              [task.vehicleId]: [task.pickupAddress]
            }));
            break;
          case DeliveryStatus.ASSIGNED:
            newVehicleStatus = VehicleStatus.IDLE; // 任务已分配但未开始运输，车辆空闲
            break;
          default:
            newVehicleStatus = VehicleStatus.IDLE; // 其他状态下车辆空闲
        }
  
        setVehicles(prevVehicles =>
          prevVehicles.map(vehicle =>
            vehicle.id === task.vehicleId
              ? { ...vehicle, status: newVehicleStatus, lastUpdate: new Date() }
              : vehicle
          )
        );
  
        // 更新配送节点
        const updatedTask = { ...task, status: newStatus };
        const nodes = generateDeliveryNodes(updatedTask);
        setDeliveryNodes(prev => ({
          ...prev,
          [taskId]: nodes
        }));
      }
  
      message.success('任务状态已更新');
    }, [generateDeliveryNodes]);

  // 获取配送任务状态对应的颜色和文本
  const getDeliveryStatusInfo = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.PENDING:
        return { color: 'default', text: '待分配' };
      case DeliveryStatus.ASSIGNED:
        return { color: 'processing', text: '已分配' };
      case DeliveryStatus.IN_TRANSIT:
        return { color: 'processing', text: '运输中' };
      case DeliveryStatus.DELIVERED:
        return { color: 'success', text: '已送达' };
      case DeliveryStatus.FAILED:
        return { color: 'error', text: '配送失败' };
      default:
        return { color: 'default', text: '未知' };
    }
  };

  // 模拟实时位置更新 - 实现车辆轨迹移动
  const updateVehiclePositions = useCallback(() => {
    setVehicles(prevVehicles =>
      prevVehicles.map(vehicle => {
        if (vehicle.status === VehicleStatus.EN_ROUTE) {
          // 找到该车辆的配送任务
          const task = deliveryTasks.find(t => t.vehicleId === vehicle.id && t.status === DeliveryStatus.IN_TRANSIT);
          if (task) {
            // 计算车辆当前位置到目的地的距离
            const distance = Math.sqrt(
              Math.pow(task.deliveryAddress.lng - vehicle.position.lng, 2) +
              Math.pow(task.deliveryAddress.lat - vehicle.position.lat, 2)
            );

            if (distance < 0.001) {
              // 到达目的地，更新任务状态为已送达
              setTimeout(() => {
                // 直接更新任务状态
                setDeliveryTasks(prevTasks =>
                  prevTasks.map(t =>
                    t.id === task.id ? { ...t, status: DeliveryStatus.DELIVERED } : t
                  )
                );
                // 更新车辆状态为空闲
                setVehicles(prevVehicles =>
                  prevVehicles.map(v =>
                    v.id === task.vehicleId
                      ? { ...v, status: VehicleStatus.IDLE, lastUpdate: new Date() }
                      : v
                  )
                );
                // 清除该车辆的实时轨迹
                setActiveRoutes(prev => {
                  const newRoutes = { ...prev };
                  delete newRoutes[task.vehicleId];
                  return newRoutes;
                });
                // 更新配送节点
                const updatedTask = { ...task, status: DeliveryStatus.DELIVERED };
                const nodes = generateDeliveryNodes(updatedTask);
                setDeliveryNodes(prev => ({
                  ...prev,
                  [task.id]: nodes
                }));
                message.success('任务已完成');
              }, 1000);
              return vehicle;
            } else {
              // 向目的地移动 - 根据优先级设置不同速度
              const baseSpeed = task.priority === DeliveryPriority.URGENT ? 0.001 : 0.0005; // 加急更快
              const directionLng = (task.deliveryAddress.lng - vehicle.position.lng) / distance;
              const directionLat = (task.deliveryAddress.lat - vehicle.position.lat) / distance;

              const newLng = vehicle.position.lng + directionLng * baseSpeed;
              const newLat = vehicle.position.lat + directionLat * baseSpeed;
              const newSpeed = Math.round(distance * 1000); // 根据距离计算速度

              const updatedVehicle = {
                ...vehicle,
                position: { lng: newLng, lat: newLat },
                speed: newSpeed,
                lastUpdate: new Date(),
                batteryLevel: Math.max(0, vehicle.batteryLevel - Math.random() * 0.05)
              };

              // 为正在行驶的车辆记录实时轨迹
              setActiveRoutes(prev => ({
                ...prev,
                [vehicle.id]: [...(prev[vehicle.id] || []), updatedVehicle.position]
              }));

              return updatedVehicle;
            }
          }
        }
        return vehicle;
      })
    );
  }, [deliveryTasks, handleTaskStatusUpdate]);



  // 处理车辆选择
  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    
    // 模拟加载该车辆的历史轨迹数据
    const mockTrackPoints: TrackPoint[] = [];
    const basePosition = vehicles.find(v => v.id === vehicleId)?.position || { lng: 116.3974, lat: 39.9093 };
    
    // 生成过去2小时的轨迹数据
    for (let i = 120; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 60000); // 每分钟一个点
      const offsetLng = (Math.random() - 0.5) * 0.01;
      const offsetLat = (Math.random() - 0.5) * 0.01;
      
      mockTrackPoints.push({
        position: {
          lng: basePosition.lng + offsetLng,
          lat: basePosition.lat + offsetLat
        },
        timestamp,
        speed: Math.floor(Math.random() * 60),
        status: VehicleStatus.EN_ROUTE
      });
    }
    
    setTrackPoints(mockTrackPoints);
  }, [vehicles]);

  // 处理轨迹播放控制
  const handlePlaybackToggle = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);
  
  // 处理轨迹播放速度调整
  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);
  
  // 处理任务点击 - 显示该任务的时间线
  const handleTaskClick = useCallback((task: DeliveryTask) => {
    setSelectedTask(task);
    setSelectedTaskTimeline(task.id);
    setShowTaskModal(true);
  }, []);
  


  // 打开派送设置弹窗
  const handleOpenAssignModal = useCallback((vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle || vehicle.status !== VehicleStatus.IDLE) {
      message.error('该车辆当前不可用');
      return;
    }
    setAssigningVehicleId(vehicleId);
    setAssignDeliveryAddress(null);
    setAssignPriority(DeliveryPriority.NORMAL);
    setShowAssignModal(true);
  }, [vehicles]);

  // 确认派送任务
  const handleConfirmAssign = useCallback(() => {
    if (!assignDeliveryAddress) {
      message.warning('请先设置配送终点位置');
      return;
    }

    const vehicle = vehicles.find(v => v.id === assigningVehicleId);
    if (!vehicle) {
      message.error('车辆信息不存在');
      return;
    }

    // 根据优先级计算预计送达时间（加急更快）
    const baseTime = assignPriority === DeliveryPriority.URGENT ? 900000 : 1800000; // 加急15分钟，普通30分钟
    const newTask: DeliveryTask = {
      id: `t${Date.now()}`,
      vehicleId: assigningVehicleId,
      orderId: `ORD${Date.now()}`,
      customerName: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
      customerPhone: `138${Math.floor(Math.random() * 90000000 + 10000000)}`,
      pickupAddress: warehousePosition, // 快递站位置
      deliveryAddress: assignDeliveryAddress, // 用户设置的终点
      status: DeliveryStatus.ASSIGNED,
      priority: assignPriority,
      estimatedArrival: new Date(Date.now() + baseTime),
      items: [['快递包裹'], ['文件资料'], ['电子产品']][Math.floor(Math.random() * 3)],
      notes: assignPriority === DeliveryPriority.URGENT ? '加急配送' : '普通配送'
    };

    setDeliveryTasks(prev => [...prev, newTask]);

    // 生成初始配送节点
    const initialNodes = generateDeliveryNodes(newTask);
    setDeliveryNodes(prev => ({
      ...prev,
      [newTask.id]: initialNodes
    }));

    message.success(`已为 ${vehicle.licensePlate} 分配${assignPriority === DeliveryPriority.URGENT ? '加急' : '普通'}配送任务`);

    // 关闭弹窗
    setShowAssignModal(false);
    setAssigningVehicleId('');
    setAssignDeliveryAddress(null);

    // 自动开始运输（模拟）
    setTimeout(() => {
      // 更新任务状态为运输中
      setDeliveryTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === newTask.id ? { ...task, status: DeliveryStatus.IN_TRANSIT } : task
        )
      );

      // 更新车辆状态为行驶中
      setVehicles(prevVehicles =>
        prevVehicles.map(v =>
          v.id === assigningVehicleId
            ? { ...v, status: VehicleStatus.EN_ROUTE, lastUpdate: new Date() }
            : v
        )
      );

      // 初始化该车辆的实时轨迹
      setActiveRoutes(prev => ({
        ...prev,
        [assigningVehicleId]: [warehousePosition]
      }));

      // 更新配送节点
      const transitTask = { ...newTask, status: DeliveryStatus.IN_TRANSIT };
      const nodes = generateDeliveryNodes(transitTask);
      setDeliveryNodes(prev => ({
        ...prev,
        [newTask.id]: nodes
      }));

      message.success('车辆开始运输');
    }, 2000); // 2秒后开始运输
  }, [vehicles, assignDeliveryAddress, assignPriority, assigningVehicleId, warehousePosition, generateDeliveryNodes]);

  // 处理路径规划
  const handlePlanRoute = useCallback(async (params: RoutePlanningParams) => {
    // 这里可以调用真实的路径规划服务
    // 暂时模拟路径规划结果
    setTimeout(() => {
      const mockResult = {
        status: 'success',
        data: {
          polyline: [
            params.origin,
            { lng: (params.origin.lng + params.destination.lng) / 2, lat: (params.origin.lat + params.destination.lat) / 2 },
            params.destination
          ],
          distance: 5000,
          duration: 600,
          steps: [
            { instruction: '开始配送', distance: 2500, duration: 300, polyline: [] },
            { instruction: '到达配送点', distance: 2500, duration: 300, polyline: [] }
          ]
        }
      };
      setRouteResult(mockResult);
      message.success('路径规划完成');
    }, 1000);
  }, []);

  // 实时位置更新定时器
  useEffect(() => {
    const interval = setInterval(updateVehiclePositions, 5000); // 每5秒更新一次
    return () => clearInterval(interval);
  }, [updateVehiclePositions]);
  
  // 轨迹播放逻辑
  useEffect(() => {
    if (isPlaying && trackPoints.length > 0) {
      const interval = setInterval(() => {
        setCurrentTrackIndex(prev => {
          if (prev >= trackPoints.length - 1) {
            setIsPlaying(false); // 播放完毕
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed); // 根据播放速度调整间隔
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, trackPoints.length, playbackSpeed]);


  // 渲染车辆状态卡片
  const renderVehicleCard = (vehicle: Vehicle) => {
    const statusInfo = getVehicleStatusInfo(vehicle.status);
    const isAvailable = vehicle.status === VehicleStatus.IDLE;

    return (
      <Card
        key={vehicle.id}
        size="small"
        style={{
          marginBottom: 8,
          cursor: 'pointer',
          border: selectedVehicleId === vehicle.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
          backgroundColor: vehicle.status === VehicleStatus.EN_ROUTE ? '#f6ffed' :
                          vehicle.status === VehicleStatus.IDLE ? '#f0f9ff' : '#fff'
        }}
        onClick={() => handleVehicleSelect(vehicle.id)}
        extra={
          isAvailable ? (
            <Button
              size="small"
              type="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAssignModal(vehicle.id);
              }}
            >
              派送
            </Button>
          ) : null
        }
      >
        <Row align="middle" gutter={8}>
          <Col flex="auto">
            <Space direction="vertical" size="small">
              <Space>
                {statusInfo.icon}
                <strong>{vehicle.licensePlate}</strong>
                <Badge
                  status={statusInfo.color as any}
                  text={statusInfo.text}
                  style={{
                    backgroundColor: vehicle.status === VehicleStatus.EN_ROUTE ? '#52c41a' :
                                   vehicle.status === VehicleStatus.IDLE ? '#1890ff' :
                                   vehicle.status === VehicleStatus.DELIVERING ? '#faad14' :
                                   vehicle.status === VehicleStatus.MAINTENANCE ? '#ff4d4f' : '#d9d9d9'
                  }}
                />
              </Space>
              <div style={{ fontSize: '12px', color: '#666' }}>
                司机：{vehicle.driver} | 速度：{vehicle.speed}km/h
              </div>
            </Space>
          </Col>
          <Col>
            <Space direction="vertical" align="end">
              <Progress
                type="circle"
                percent={vehicle.batteryLevel}
                size={40}
                strokeColor={
                  vehicle.batteryLevel > 60 ? '#52c41a' :
                  vehicle.batteryLevel > 20 ? '#faad14' : '#ff4d4f'
                }
                showInfo={false}
              />
              <div style={{ fontSize: '10px', color: '#999' }}>
                {vehicle.batteryLevel}%
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染配送任务卡片
  const renderDeliveryTask = (task: DeliveryTask) => {
    const statusInfo = getDeliveryStatusInfo(task.status);
    const vehicle = vehicles.find(v => v.id === task.vehicleId);
    const isSelected = selectedTaskTimeline === task.id;

    return (
      <Card
        key={task.id}
        size="small"
        style={{
          marginBottom: 8,
          cursor: 'pointer',
          border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
          backgroundColor: isSelected ? '#f0f9ff' : '#fff'
        }}
        onClick={() => {
          handleTaskClick(task);
        }}
      >
        <Row align="middle" gutter={8}>
          <Col flex="auto">
            <Space direction="vertical" size="small">
              <Space>
                <strong>订单：{task.orderId}</strong>
                <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                <Tag color={task.priority === DeliveryPriority.URGENT ? 'red' : 'default'}>
                  {task.priority === DeliveryPriority.URGENT ? '加急' : '普通'}
                </Tag>
              </Space>
              <div style={{ fontSize: '12px', color: '#666' }}>
                客户：{task.customerName} | 车辆：{vehicle?.licensePlate || '未分配'}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                预计送达：{task.estimatedArrival.toLocaleTimeString()}
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染轨迹回放控制面板
  const renderPlaybackControls = () => {
    if (!selectedVehicleId || trackPoints.length === 0) {
      return null;
    }
    
    const currentPoint = trackPoints[currentTrackIndex];
    
    return (
      <Card title="轨迹回放控制" size="small" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row align="middle" gutter={16}>
            <Col>
              <Button 
                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={handlePlaybackToggle}
                type={isPlaying ? 'primary' : 'default'}
              >
                {isPlaying ? '暂停' : '播放'}
              </Button>
            </Col>
            <Col>
              <span>播放速度：</span>
              <Select 
                value={playbackSpeed} 
                onChange={handleSpeedChange}
                style={{ width: 80 }}
                size="small"
              >
                <Select.Option value={0.5}>0.5x</Select.Option>
                <Select.Option value={1}>1x</Select.Option>
                <Select.Option value={2}>2x</Select.Option>
                <Select.Option value={4}>4x</Select.Option>
              </Select>
            </Col>
            <Col flex="auto">
              <div style={{ fontSize: '12px', color: '#666' }}>
                {currentPoint ? 
                  `时间：${currentPoint.timestamp.toLocaleTimeString()} | 速度：${currentPoint.speed}km/h` :
                  '无轨迹数据'
                }
              </div>
            </Col>
          </Row>
          
          <Progress 
            percent={(currentTrackIndex / (trackPoints.length - 1)) * 100}
            showInfo={false}
            strokeColor="#1890ff"
          />
        </Space>
      </Card>
    );
  };

  // 管理员视图布局 - 全屏地图 + 悬浮面板
  const renderAdminView = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }}>
      {/* 全屏地图 */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        controls={{ scale: true, toolBar: true, mapType: true }}
        style={{ width: '100%', height: '100%' }}
        onMapClick={handleMapClick}
      >
        {/* 车辆位置标记层 */}
        <MarkerLayer
          markers={vehicles.map(vehicle => {
            // 根据车辆状态选择不同的图标颜色
            let iconUrl = '';
            switch (vehicle.status) {
              case VehicleStatus.IDLE:
                iconUrl = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'; // 蓝色 - 空闲
                break;
              case VehicleStatus.EN_ROUTE:
                iconUrl = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'; // 红色 - 行驶中
                break;
              case VehicleStatus.DELIVERING:
                iconUrl = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_y.png'; // 黄色 - 配送中
                break;
              case VehicleStatus.MAINTENANCE:
                iconUrl = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_p.png'; // 紫色 - 维修中
                break;
              case VehicleStatus.OFFLINE:
                iconUrl = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png'; // 灰色 - 离线
                break;
              default:
                iconUrl = 'https://webapi.amap.com/theme/v1.3/markers/n/mark_bs.png';
            }

            return {
              id: vehicle.id,
              type: 'vehicle' as const,
              title: `${vehicle.licensePlate} - ${vehicle.driver} (${getVehicleStatusInfo(vehicle.status).text})`,
              position: vehicle.position,
              icon: iconUrl,
              createdAt: vehicle.lastUpdate,
              updatedAt: vehicle.lastUpdate,
              data: {
                status: vehicle.status === VehicleStatus.MAINTENANCE ? 'maintenance' :
                        vehicle.status === VehicleStatus.OFFLINE ? 'inactive' :
                        vehicle.status === VehicleStatus.IDLE ? 'inactive' : 'active',
                batteryLevel: vehicle.batteryLevel,
                speed: vehicle.speed,
                temperature: vehicle.temperature,
                lastUpdate: vehicle.lastUpdate
              }
            };
          })}
          onMarkerClick={(marker) => {
            const vehicle = vehicles.find(v => v.id === marker.id);
            if (vehicle) {
              message.info(`${vehicle.licensePlate} - ${vehicle.driver} (${getVehicleStatusInfo(vehicle.status).text})`);
            }
          }}
        />

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

        {/* 快递站位置标记 */}
        <MarkerLayer
          markers={[{
            id: 'warehouse',
            type: 'warehouse' as const,
            title: '快递站',
            position: warehousePosition,
            icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png',
            createdAt: new Date(),
            updatedAt: new Date(),
            data: {
              address: '快递站',
              isWarehouse: true
            }
          }]}
          onMarkerClick={(marker) => {
            message.info('快递站位置');
          }}
        />

        {/* 派送终点标记（如果正在设置） */}
        {assignDeliveryAddress && (
          <MarkerLayer
            markers={[{
              id: 'assign-destination',
              type: 'store' as const,
              title: '配送终点',
              position: assignDeliveryAddress,
              createdAt: new Date(),
              updatedAt: new Date(),
              data: {
                address: '配送终点',
                isAssignDestination: true
              }
            }]}
          />
        )}

        {/* 轨迹回放路径 */}
        {selectedVehicleId && trackPoints.length > 0 && (
          <RouteLayer
            polyline={isPlaying ? trackPoints.slice(0, currentTrackIndex + 1).map(p => p.position) : []}
            mode="driving"
            visible={true}
          />
        )}

        {/* 实时车辆轨迹 */}
        {Object.entries(activeRoutes).map(([vehicleId, route]) => (
          <RouteLayer
            key={`active-${vehicleId}`}
            polyline={route}
            mode="driving"
            visible={true}
          />
        ))}

        {/* 配送路线 */}
        {routeResult && (
          <RouteLayer
            polyline={routeResult.data?.polyline || []}
            mode="driving"
            visible={true}
          />
        )}
      </MapContainer>

      {/* 左上：搜索框（悬浮） */}
      <div style={{
        position: 'absolute',
        left: 12,
        top: 12,
        zIndex: 2000,
        width: 400,
      }}>
        <Card size="small" style={{ borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
          <PlaceSearch
            placeholder="搜索配送目的地、客户地址..."
            city=""
            onPlaceSelect={handlePlaceSelect}
            onPlaceConfirm={handlePlaceConfirm}
            style={{ marginBottom: 0 }}
          />
        </Card>
      </div>

      {/* 顶部：统计信息卡片（悬浮，可折叠） */}
      {statsPanelCollapsed ? (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 12,
          transform: 'translateX(-50%)',
          zIndex: 2000,
        }}>
          <Button
            type="primary"
            size="small"
            icon={<MenuUnfoldOutlined />}
            onClick={() => setStatsPanelCollapsed(false)}
            style={{ borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}
          >
            显示统计
          </Button>
        </div>
      ) : (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 12,
          width: '45%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
        }}>
          <Card 
            size="small" 
            style={{ 
              borderRadius: 8, 
              boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.98)',
            }}
            extra={
              <Button
                type="text"
                size="small"
                icon={<MenuFoldOutlined />}
                onClick={() => setStatsPanelCollapsed(true)}
              />
            }
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="在线车辆"
                  value={vehicles.filter(v => v.status !== VehicleStatus.OFFLINE).length}
                  prefix={<CarOutlined />}
                  valueStyle={{ color: '#3f8600', fontSize: 20 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="配送中订单"
                  value={deliveryTasks.filter(t => t.status === DeliveryStatus.IN_TRANSIT).length}
                  prefix={<EnvironmentOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: 20 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="今日完成"
                  value={deliveryTasks.filter(t => t.status === DeliveryStatus.DELIVERED).length}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a', fontSize: 20 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="平均配送时长"
                  value={45}
                  suffix="分钟"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#722ed1', fontSize: 20 }}
                />
              </Col>
            </Row>
          </Card>
        </div>
      )}

      {/* 左侧：展开按钮（当两个面板都收起时显示） */}
      {leftPanelCollapsed && (
        <div style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2000,
        }}>
          <Button
            type="primary"
            size="large"
            icon={<MenuUnfoldOutlined />}
            onClick={() => setLeftPanelCollapsed(false)}
            style={{ borderRadius: '8px 0 0 8px', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}
          />
        </div>
      )}

      {/* 左侧：车辆监控Card收起按钮 */}
      {!leftPanelCollapsed && vehiclePanelCollapsed && (
        <div style={{
          position: 'absolute',
          left: 12,
          top: statsPanelCollapsed ? 80 : 80,
          zIndex: 2000,
        }}>
          <Button
            type="primary"
            size="small"
            icon={<MenuUnfoldOutlined />}
            onClick={() => setVehiclePanelCollapsed(false)}
            style={{ borderRadius: '8px 0 0 8px', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}
            title="展开车辆监控"
          />
        </div>
      )}

      {/* 左侧：车辆监控Card（独立悬浮） */}
      {!leftPanelCollapsed && !vehiclePanelCollapsed && (
        <div style={{
          position: 'absolute',
          left: 12,
          top: statsPanelCollapsed ? 80 : 80,
          zIndex: 2000,
          width: 320,
        }}>
          <Card 
            size="small" 
            style={{
              borderRadius: 8,
              boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.98)',
            }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>车辆监控</span>
                <Space>
                  <Button
                    type="text"
                    size="small"
                    icon={<MenuFoldOutlined />}
                    onClick={() => setVehiclePanelCollapsed(true)}
                    title="收起车辆监控"
                  />
                </Space>
              </div>
            }
          >
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {vehicles.map(renderVehicleCard)}
            </div>
          </Card>
        </div>
      )}

      {/* 左侧：派送任务Card收起按钮 */}
      {!leftPanelCollapsed && taskPanelCollapsed && (
        <div style={{
          position: 'absolute',
          left: 12,
          top: statsPanelCollapsed ? (vehiclePanelCollapsed ? 455 : 455) : (vehiclePanelCollapsed ? 455 : 455),
          zIndex: 2000,
        }}>
          <Button
            type="primary"
            size="small"
            icon={<MenuUnfoldOutlined />}
            onClick={() => setTaskPanelCollapsed(false)}
            style={{ borderRadius: '8px 0 0 8px', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}
            title="展开派送任务"
          />
        </div>
      )}

      {/* 左侧：派送任务Card（独立悬浮） */}
      {!leftPanelCollapsed && !taskPanelCollapsed && (
        <div style={{
          position: 'absolute',
          left: 12,
          top: statsPanelCollapsed ? (vehiclePanelCollapsed ? 455 : 455) : (vehiclePanelCollapsed ? 455 : 455),
          bottom: selectedVehicleId && trackPoints.length > 0 ? 200 : 12,
          zIndex: 2000,
          width: 320,
          height: 550,
        }}>
          <Card 
            size="small" 
            style={{
              height: '100%',
              borderRadius: 8,
              boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.98)',
              display: 'flex',
              flexDirection: 'column',
            }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>派送任务</span>
                <Button
                  type="text"
                  size="small"
                  icon={<MenuFoldOutlined />}
                  onClick={() => setTaskPanelCollapsed(true)}
                  title="收起派送任务"
                />
              </div>
            }
            bodyStyle={{ flex: 1, overflow: 'auto', padding: '12px' }}
          >
            <div style={{ height: '100%', overflow: 'auto' }}>
              {deliveryTasks.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
                  暂无任务，点击车辆卡片上的"派送"按钮创建任务
                </div>
              ) : (
                deliveryTasks.map(renderDeliveryTask)
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 轨迹回放控制（独立悬浮，在派送任务下方） */}
      {!leftPanelCollapsed && selectedVehicleId && trackPoints.length > 0 && (
        <div style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          zIndex: 2000,
          width: 320,
        }}>
          {renderPlaybackControls()}
        </div>
      )}

      {/* 右侧：配送时间线面板（点击任务后显示） */}
      {selectedTaskTimeline && deliveryNodes[selectedTaskTimeline] && (
        <div style={{
          position: 'absolute',
          right: 12,
          top: statsPanelCollapsed ? 80 : 140,
          bottom: 12,
          zIndex: 2000,
          width: 320,
        }}>
          <Card
            style={{
              height: '100%',
              borderRadius: 8,
              boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.98)',
              display: 'flex',
              flexDirection: 'column',
            }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>配送时间线</span>
                <Button
                  type="text"
                  size="small"
                  onClick={() => setSelectedTaskTimeline(null)}
                >
                  关闭
                </Button>
              </div>
            }
            bodyStyle={{ flex: 1, overflow: 'auto', padding: '12px' }}
          >
            <Timeline
              items={deliveryNodes[selectedTaskTimeline].map(node => ({
                key: node.id,
                color: node.status === 'completed' ? 'green' :
                       node.status === 'in_progress' ? 'blue' :
                       node.status === 'failed' ? 'red' : 'gray',
                dot: node.status === 'in_progress' ? <ClockCircleOutlined spin /> :
                     node.status === 'completed' ? <CheckCircleOutlined /> :
                     node.status === 'failed' ? <ExclamationCircleOutlined /> : undefined,
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{node.title}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {node.description}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      {node.timestamp.toLocaleString()}
                    </div>
                  </div>
                )
              }))}
            />
          </Card>
        </div>
      )}

      {/* 右下：地图图例（悬浮） */}
      <div style={{
        position: 'absolute',
        right: 12,
        bottom: 12,
        zIndex: 2000,
      }}>
        <Card 
          size="small" 
          style={{ 
            borderRadius: 8, 
            boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.98)',
          }}
        >
          <Space size="large" direction="vertical">
            <Space>
              <div style={{ width: '12px', height: '12px', background: '#1890ff', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '12px' }}>行驶中车辆</span>
            </Space>
            <Space>
              <div style={{ width: '12px', height: '12px', background: '#52c41a', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '12px' }}>空闲车辆</span>
            </Space>
            <Space>
              <div style={{ width: '2px', height: '12px', background: '#1890ff' }}></div>
              <span style={{ fontSize: '12px' }}>配送路线</span>
            </Space>
            <Space>
              <div style={{ width: '2px', height: '12px', background: '#722ed1' }}></div>
              <span style={{ fontSize: '12px' }}>轨迹回放</span>
            </Space>
          </Space>
        </Card>
      </div>

      {/* 派送设置弹窗 */}
      <Modal
        title="设置派送任务"
        open={showAssignModal}
        onCancel={() => {
          setShowAssignModal(false);
          setAssigningVehicleId('');
          setAssignDeliveryAddress(null);
          setAssignPriority(DeliveryPriority.NORMAL);
        }}
        onOk={handleConfirmAssign}
        okText="确认派送"
        cancelText="取消"
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="起点（快递站）">
            <Input
              value={`快递站 (${warehousePosition.lng.toFixed(4)}, ${warehousePosition.lat.toFixed(4)})`}
              disabled
            />
          </Form.Item>
          <Form.Item label="终点（配送地址）" required>
            <PlaceSearch
              placeholder="搜索或点击地图设置配送终点..."
              city=""
              onPlaceSelect={(place: any) => {
                setAssignDeliveryAddress(place.location);
              }}
              onPlaceConfirm={(place: any) => {
                setAssignDeliveryAddress(place.location);
                message.success(`已设置终点: ${place.name}`);
              }}
            />
            {assignDeliveryAddress && (
              <div style={{ marginTop: 8, padding: 8, background: '#f0f9ff', borderRadius: 4 }}>
                <div style={{ fontSize: 12, color: '#666' }}>
                  已选择终点: ({assignDeliveryAddress.lng.toFixed(4)}, {assignDeliveryAddress.lat.toFixed(4)})
                </div>
              </div>
            )}
          </Form.Item>
          <Form.Item label="快递优先级" required>
            <Select
              value={assignPriority}
              onChange={(v) => setAssignPriority(v)}
              style={{ width: '100%' }}
            >
              <Select.Option value={DeliveryPriority.NORMAL}>
                <Space>
                  <span>普通</span>
                  <Tag color="default">标准速度</Tag>
                </Space>
              </Select.Option>
              <Select.Option value={DeliveryPriority.URGENT}>
                <Space>
                  <span>加急</span>
                  <Tag color="red">快速配送</Tag>
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  // 派送员视图布局（静态展示当前派送员的任务和地图）
  const renderCourierView = () => {
    const courierVehicle = vehicles.find(v => v.id === selectedCourierId) || vehicles[0];
    const myTasks = deliveryTasks.filter(t => t.vehicleId === courierVehicle?.id);

    return (
      <Row gutter={16}>
        {/* 左侧：当前派送员任务列表 */}
        <Col span={8}>
          <Card
            title={
              <Space>
                <span>我的任务</span>
                <Tag color="blue">{courierVehicle?.driver || '派送员'}</Tag>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
              今日任务：{myTasks.length} 单，运输中 {myTasks.filter(t => t.status === DeliveryStatus.IN_TRANSIT).length} 单
            </div>
            <div style={{ maxHeight: 520, overflow: 'auto' }}>
              {myTasks.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
                  暂无分配给该派送员的任务
                </div>
              ) : (
                myTasks.map((task) => (
                  <Card
                    key={task.id}
                    size="small"
                    style={{ marginBottom: 8 }}
                  >
                    <Space direction="vertical" size={4}>
                      <Space>
                        <strong>{task.customerName}</strong>
                        <Tag color={getDeliveryStatusInfo(task.status).color}>
                          {getDeliveryStatusInfo(task.status).text}
                        </Tag>
                      </Space>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        订单号：{task.orderId}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        预计送达：{task.estimatedArrival.toLocaleTimeString()}
                      </div>
                    </Space>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </Col>

        {/* 右侧：派送员地图视图 */}
        <Col span={16}>
          <Card
            title={
              <Space>
                <span>派送员地图视图</span>
                {courierVehicle && (
                  <span style={{ fontSize: 12, color: '#666' }}>
                    当前车辆：{courierVehicle.licensePlate}（{courierVehicle.driver}）
                  </span>
                )}
              </Space>
            }
            style={{ height: '700px' }}
          >
            <div style={{ position: 'relative', width: '100%', height: '600px' }}>
              <MapContainer
                center={courierVehicle?.position || mapCenter}
                zoom={15}
                controls={{ scale: true, toolBar: true, mapType: false }}
                style={{ width: '100%', height: '100%' }}
              >
                {courierVehicle && (
                  <MarkerLayer
                    markers={[
                      {
                        id: courierVehicle.id,
                        type: 'vehicle' as const,
                        title: `${courierVehicle.licensePlate} - ${courierVehicle.driver}`,
                        position: courierVehicle.position,
                        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
                        createdAt: courierVehicle.lastUpdate,
                        updatedAt: courierVehicle.lastUpdate,
                        data: {},
                      },
                    ]}
                  />
                )}
                {myTasks.length > 0 && (
                  <MarkerLayer
                    markers={myTasks.map((t) => ({
                      id: t.id,
                      type: 'store' as const,
                      title: `收件人：${t.customerName}`,
                      position: t.deliveryAddress,
                      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
                      createdAt: t.estimatedArrival,
                      updatedAt: t.estimatedArrival,
                      data: {},
                    }))}
                  />
                )}
              </MapContainer>
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* 顶部：角色切换（悬浮） */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 2000,
      }}>
        <Card 
          size="small" 
          style={{ 
            borderRadius: 8, 
            boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.98)',
          }}
        >
          <Space>
            <span style={{ fontSize: 12, color: '#666' }}>当前身份：</span>
            <Select<UserRole>
              value={userRole}
              onChange={(v) => setUserRole(v)}
              style={{ width: 120 }}
              size="small"
              options={[
                { value: 'admin', label: '管理员' },
                { value: 'courier', label: '派送员' },
              ]}
            />
            {userRole === 'courier' && (
              <>
                <span style={{ fontSize: 12, color: '#666' }}>派送员：</span>
                <Select<string>
                  value={selectedCourierId}
                  onChange={(v) => setSelectedCourierId(v)}
                  style={{ width: 140 }}
                  size="small"
                  options={vehicles.map((v) => ({
                    value: v.id,
                    label: `${v.driver}（${v.licensePlate}）`,
                  }))}
                />
              </>
            )}
          </Space>
        </Card>
      </div>

      {userRole === 'admin' ? renderAdminView() : renderCourierView()}

      {/* 任务详情弹窗 */}
      <Modal
        title="配送任务详情"
        open={showTaskModal}
        onCancel={() => setShowTaskModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowTaskModal(false)}>
            关闭
          </Button>,
          selectedTask && selectedTask.status !== DeliveryStatus.DELIVERED && (
            <Button 
              key="complete" 
              type="primary"
              onClick={() => {
                handleTaskStatusUpdate(selectedTask.id, DeliveryStatus.DELIVERED);
                setShowTaskModal(false);
              }}
            >
              标记为已送达
            </Button>
          )
        ]}
        width={600}
      >
        {selectedTask && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="订单信息">
                  <p><strong>订单号：</strong>{selectedTask.orderId}</p>
                  <p><strong>客户：</strong>{selectedTask.customerName}</p>
                  <p><strong>电话：</strong>{selectedTask.customerPhone}</p>
                  <p><strong>状态：</strong>
                    <Tag color={getDeliveryStatusInfo(selectedTask.status).color}>
                      {getDeliveryStatusInfo(selectedTask.status).text}
                    </Tag>
                  </p>
                  <p><strong>预计送达：</strong>{selectedTask.estimatedArrival.toLocaleString()}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="配送信息">
                  <p><strong>配送车辆：</strong>
                    {vehicles.find(v => v.id === selectedTask.vehicleId)?.licensePlate || '未分配'}
                  </p>
                  <p><strong>配送司机：</strong>
                    {vehicles.find(v => v.id === selectedTask.vehicleId)?.driver || '未分配'}
                  </p>
                  <p><strong>配送物品：</strong></p>
                  <ul>
                    {selectedTask.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  {selectedTask.notes && (
                    <p><strong>备注：</strong>{selectedTask.notes}</p>
                  )}
                </Card>
              </Col>
            </Row>
            
            {/* 配送路线规划 */}
            {selectedTask && (
              <Card size="small" title="配送路线规划" style={{ marginTop: 16 }}>
                <RoutePlanningForm
                  onPlanRoute={(params) => {
                    // 使用任务的取货地址作为起点，送货地址作为终点
                    const taskRouteParams = {
                      ...params,
                      origin: selectedTask.pickupAddress,
                      destination: selectedTask.deliveryAddress
                    };
                    handlePlanRoute(taskRouteParams);
                  }}
                  planning={false}
                />
                
                {routeResult && (
                  <RouteDetailsPanel routeData={routeResult.data} />
                )}
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LogisticsTracking;


