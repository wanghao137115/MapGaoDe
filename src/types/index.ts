// 全局通用类型定义占位文件
// 后续在此集中管理业务与地图相关的类型别名与接口

// 地图相关类型定义

// 地图中心点坐标（经纬度）
export interface MapPosition {
    lng: number;
    lat: number;
  }
  
  // 地图配置
  export interface MapConfig {
    center: MapPosition;
    zoom: number;
    mapType?: 'normal' | 'satellite' | '3d'; // 普通 / 卫星 / 3D
    controls?: {
      scale?: boolean;      // 比例尺
      toolBar?: boolean;    // 工具条
      mapType?: boolean;    // 地图类型切换
    };
  }
  
  // 标记点类型（占位，后续扩展）
  // 标记点类型（扩展）
  export interface Marker {
    id: string;
    position: MapPosition;
    title: string;
    type: 'store' | 'warehouse' | 'user' | 'vehicle';
    icon?: string;
    data?: {
      // 基础信息
      phone?: string;        // 联系电话
      address?: string;      // 详细地址
      description?: string;  // 描述信息
  
      // 扩展信息
      imageUrl?: string;     // 图片URL
      website?: string;      // 网站链接
      email?: string;        // 邮箱地址
      category?: string;     // 分类标签
  
      // 业务特定字段
      storeId?: string;      // 门店ID
      vehicleId?: string;    // 车辆ID
      capacity?: number;     // 容量/载重
      status?: 'active' | 'inactive' | 'maintenance'; // 状态
  
      // 自定义扩展字段
      [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
  }
  
// 路径规划相关类型（先占位）
export interface RoutePoint {
  lng: number;
  lat: number;
  name?: string;
}

// 路径规划结果
export interface RouteResult {
  polyline: MapPosition[]; // 路径点序列（用于绘制路线）
  distance: number;        // 总距离（米）
  duration: number;        // 预计时长（秒）
  tolls?: number;          // 收费金额（元，仅驾车）
  steps?: RouteStep[];     // 详细步骤说明
}


// 路径规划步骤详情
export interface RouteStep {
  instruction: string;     // 步骤说明（如"向北前行100米"）
  distance: number;        // 该步骤距离（米）
  duration: number;        // 该步骤预计时间（秒）
  polyline: MapPosition[]; // 该步骤的路径点
}

// 路径规划请求参数
export interface RouteRequest {
  origin: MapPosition;      // 起点
  destination: MapPosition; // 终点
  waypoints?: MapPosition[]; // 途经点（可选）
  strategy?: RouteStrategy;  // 规划策略
}

// 路径规划策略枚举
export enum RouteStrategy {
  FASTEST = 0,      // 最快路线（默认）
  SHORTEST = 1,     // 最短路线
  AVOID_HIGHWAY = 2, // 避免高速
  AVOID_CONGESTION = 3, // 避免拥堵
}

// 路径规划服务状态
export enum RouteServiceStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

// 路径规划错误信息
export interface RouteError {
  code: string;
  message: string;
  details?: any;
}

// 路径规划服务返回结果
export interface RouteServiceResult {
  status: RouteServiceStatus;
  data?: RouteResult;
  error?: RouteError;
}

// 地理位置错误类型
export interface GeolocationErrorType {
  code: number;
  message: string;
  description?: string;
  solution?: string;
}

// 地理位置状态
export interface GeolocationState {
  position: MapPosition | null;
  loading: boolean;
  error: GeolocationErrorType | null;
}