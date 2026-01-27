// 地图相关服务
// 高德地图支持混合使用：Web端(JS API)用于地图显示，Web服务API用于路径规划
const amapWebKey = import.meta.env.VITE_AMAP_WEB_KEY || '00486a9a193a5201580a7767bedbc09d'; // Web端Key - 用于地图显示
const amapServiceKey = import.meta.env.VITE_AMAP_SERVICE_KEY || '49bfb83db90187047c48ccc2e711ea32'; // Web服务Key - 用于路径规划

import type {
    MapPosition,
    RoutePoint,
    RouteResult,
    RouteRequest,
    RouteServiceResult,
    RouteError,
    RouteStep,
    RoutePlan
  } from '@/types';

// 导入运行时需要的枚举
import { RouteServiceStatus, RouteStrategy } from '@/types';

// 加载状态枚举
export enum MapLoadStatus {
    NOT_LOADED = 'not_loaded',
    LOADING = 'loading',
    SUCCESS = 'success',
    FAILED = 'failed',
    MISSING_KEY = 'missing_key',
}

// 全局遍历：存储 AMap 构造函数（加载成功后赋值）
declare global {
    interface Window {
        AMap?: any;
    }
}

// 全局状态：当前加载状态
let loadStatus: MapLoadStatus = MapLoadStatus.NOT_LOADED;

// 加载 Promise（避免重复加载）
let loadPromise: Promise<MapLoadStatus> | null = null;

/**
 * 动态加载高德地图 JS API
 * @returns Promise<MapLoadStatus> - 加载状态
 */
export async function loadAMap(): Promise<MapLoadStatus> {
    if(loadStatus === MapLoadStatus.SUCCESS){
        return MapLoadStatus.SUCCESS
    }
    // 如果正在加载，返回同一个 Promise
    if (loadPromise) {
        return loadPromise;
    }
    // 检查 Web端 Key 是否配置
    if (!amapWebKey || amapWebKey === 'DEV_PLACEHOLDER_KEY' || amapWebKey === 'YOUR_REAL_AMAP_KEY_HERE') {
      loadStatus = MapLoadStatus.MISSING_KEY;
      console.warn('[MapService] 高德地图 Web端 Key 未配置，请在 .env 文件中设置有效的 VITE_AMAP_WEB_KEY');
      return loadStatus;
    }
    // 开始加载
    loadStatus = MapLoadStatus.LOADING;
    loadPromise = new Promise<MapLoadStatus>((resolve,reject)=>{
        // 动态创建 script 标签
        const script = document.createElement('script');
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapWebKey}&plugin=AMap.Scale,AMap.ToolBar,AMap.MapType,AMap.RangingTool,AMap.Traffic,AMap.Subway,AMap.Geocoder`;
        script.async = true;
        // 加载成功
        script.onload = () => {
            if (window.AMap) {
            loadStatus = MapLoadStatus.SUCCESS;
            resolve(loadStatus);
            } else {
            loadStatus = MapLoadStatus.FAILED;
            console.error('[MapService] 高德地图 JS API 加载失败：AMap 对象不存在');
            resolve(loadStatus);
            }
        };
        // 加载失败
        script.onerror = () => {
            loadStatus = MapLoadStatus.FAILED;
            console.error('[MapService] 高德地图 JS API 加载失败：网络或 Key 错误');
            resolve(loadStatus);
        };
        // 将 script 插入到 head 中
        document.head.appendChild(script);
    })
    return loadPromise;
}

/**
 * 获取当前加载状态
 */
export function getAMapLoadStatus(): MapLoadStatus {
    return loadStatus;
  }
  
/**
 * 检查地图是否可用
 */
export function isAMapReady(): boolean {
    return loadStatus === MapLoadStatus.SUCCESS && !!window.AMap;
}

/**
 * 路径规划服务类
 */
export class RoutePlanningService {
    private amap: any = null;

    constructor() {
        // 检查高德地图是否已加载
        if (window.AMap) {
            this.amap = window.AMap;
        } else {
            console.warn('[RoutePlanningService] 高德地图未加载，请先调用 loadAMap()');
        }
    }
    /**
   * 驾车路径规划
   * @param request 路径规划请求参数
   * @returns Promise<RouteServiceResult>
   */
    async planDrivingRoute(request: RouteRequest): Promise<RouteServiceResult> {
        if (!this.amap) {
            return {
              status: RouteServiceStatus.ERROR,
              error: {
                code: 'MAP_NOT_READY',
                message: '高德地图未加载完成'
              }
            };
          }
        return new Promise((resolve,reject)=>{
            try {
                // 创建驾车导航示例
                const driving = new this.amap.Driving({
                    policy: this.mapStrategyToAMap(request.strategy || RouteStrategy.FASTEST),
                    // 是否返回路线概述信息
                    extensions: 'all'
                });

                const origin = new this.amap.LngLat(request.origin.lng, request.origin.lat);
                const destination = new this.amap.LngLat(request.destination.lng, request.destination.lat);

                // 处理途经点
                let waypoints: any[] = [];
                if (request.waypoints && request.waypoints.length > 0) {
                    waypoints = request.waypoints.map(point =>
                        new this.amap.LngLat(point.lng, point.lat)
                    );
                }
                // 执行路径规划
                driving.search(origin, destination, { waypoints }, (status: string, result: any) => {
                    if (status === 'complete' && result.info === 'OK') {
                    // 规划成功，解析结果
                    const routeResult = this.parseDrivingResult(result);
                    resolve({
                        status: RouteServiceStatus.SUCCESS,
                        data: routeResult
                    });
                    } else {
                    // 规划失败
                    resolve({
                        status: RouteServiceStatus.ERROR,
                        error: {
                        code: status,
                        message: result.info || '路径规划失败',
                        details: result
                        }
                    });
                    }
                });
            } catch (error) {
                resolve({
                    status: RouteServiceStatus.ERROR,
                    error: {
                        code: 'UNKNOWN_ERROR',
                        message: '路径规划过程中发生未知错误',
                        details: error
                    }
                });
            }
        })
    }

    /**
     * 步行路径规划
     * @param request 路径规划请求参数
     * @returns Promise<RouteServiceResult>
     */
    async planWalkingRoute(request: RouteRequest): Promise<RouteServiceResult> {
        if (!this.amap) {
            return {
                status: RouteServiceStatus.ERROR,
                error: {
                code: 'MAP_NOT_READY',
                message: '高德地图未加载完成'
                }
            };
        }
        return new Promise((resolve) => {
            try {
                // 创建步行导航实例
                const walking = new this.amap.Walking();
                // 构建起点和终点
                const origin = new this.amap.LngLat(request.origin.lng, request.origin.lat);
                const destination = new this.amap.LngLat(request.destination.lng, request.destination.lat);

                // 执行路径规划
                walking.search(origin, destination, (status: string, result: any) => {
                    if (status === 'complete' && result.info === 'OK') {
                    // 规划成功，解析结果
                    const routeResult = this.parseWalkingResult(result);
                    resolve({
                        status: RouteServiceStatus.SUCCESS,
                        data: routeResult
                    });
                    } else {
                    // 规划失败
                    resolve({
                        status: RouteServiceStatus.ERROR,
                        error: {
                        code: status,
                        message: result.info || '步行路径规划失败',
                        details: result
                        }
                    });
                    }
                });
            } catch (error) {
                resolve({
                    status: RouteServiceStatus.ERROR,
                    error: {
                      code: 'UNKNOWN_ERROR',
                      message: '步行路径规划过程中发生未知错误',
                      details: error
                    }
                });
            }
        })
    }

    /**
   * 将应用策略转换为高德地图策略
   * @param strategy 应用策略
   * @returns 高德地图策略
   */
    private mapStrategyToAMap(strategy: RouteStrategy): number {
        switch (strategy) {
            case RouteStrategy.FASTEST:
            return 0; // 最快捷模式
            case RouteStrategy.SHORTEST:
            return 1; // 最经济模式（可能更短）
            case RouteStrategy.AVOID_HIGHWAY:
            return 2; // 距离优先（不走高速）
            case RouteStrategy.AVOID_CONGESTION:
            return 3; // 速度优先（考虑实时路况）
            default:
            return 0;
        }
    }

    /**
   * 解析驾车规划结果
   * @param result 高德地图返回的原始结果
   * @returns RouteResult
   */
    private parseDrivingResult(result: any): RouteResult {
        const route = result.routes[0]; //去第一条路线
        const polyline: MapPosition[] = [];

        // 解析路线坐标串
        if(route.polyline){
            // polyline 是以分号分隔的坐标对，如 "116.3974,39.9093;116.3975,39.9094"
            const coordinates = route.polyline.split(';');
            coordinates.forEach((coord: string) => {
                const [lng, lat] = coord.split(',').map(Number);
                if (!isNaN(lng) && !isNaN(lat)) {
                  polyline.push({ lng, lat });
                }
            });
        }
        // 解析步骤信息
        const steps: RouteStep[] = [];
        if (route.steps) {
            route.steps.forEach((step: any) => {
                steps.push({
                instruction: step.instruction || step.ori_instruction || '',
                distance: step.distance || 0,
                duration: step.duration || 0,
                polyline: this.parseStepPolyline(step.polyline || '')
                });
            });
        }
        return {
            polyline,
            distance: route.distance || 0,
            duration: route.time || 0,
            tolls: route.tolls || 0,
            steps
        };
    }
    /**
   * 解析步行规划结果
   * @param result 高德地图返回的原始结果
   * @returns RouteResult
   */
    private parseWalkingResult(result: any): RouteResult {
        const route = result.routes[0]; // 取第一条路线
        const polyline: MapPosition[] = [];

        // 解析路线坐标串
        if (route.polyline) {
            const coordinates = route.polyline.split(';');
            coordinates.forEach((coord: string) => {
            const [lng, lat] = coord.split(',').map(Number);
            if (!isNaN(lng) && !isNaN(lat)) {
                polyline.push({ lng, lat });
            }
            });
        }
    
        // 解析步骤信息
        const steps: RouteStep[] = [];
        if (route.steps) {
            route.steps.forEach((step: any) => {
            steps.push({
                instruction: step.instruction || '',
                distance: step.distance || 0,
                duration: step.duration || 0,
                polyline: this.parseStepPolyline(step.polyline || '')
            });
            });
        }
    
        return {
            polyline,
            distance: route.distance || 0,
            duration: route.time || 0,
            steps
        };
    }

    /**
   * 解析步骤的polyline
   * @param polylineStr 步骤的坐标串
   * @returns MapPosition[]
   */
    private parseStepPolyline(polylineStr: string): MapPosition[] {
        const polyline: MapPosition[] = [];
        if (polylineStr) {
            const coordinates = polylineStr.split(';');
            coordinates.forEach((coord: string) => {
              const [lng, lat] = coord.split(',').map(Number);
              if (!isNaN(lng) && !isNaN(lat)) {
                polyline.push({ lng, lat });
              }
            });
          }
          return polyline;
    }
}

/**
 * Web服务API路径规划 - 使用HTTP请求
 */
export class WebServiceRoutePlanning {
  private serviceKey: string;

  constructor() {
    this.serviceKey = amapServiceKey;
  }

  /**
   * 驾车路径规划 - Web服务API
   */
  async planDrivingRouteWebService(request: RouteRequest): Promise<RouteServiceResult> {
    try {
      const params = new URLSearchParams({
        key: this.serviceKey,
        origin: `${request.origin.lng},${request.origin.lat}`,
        destination: `${request.destination.lng},${request.destination.lat}`,
        strategy: this.mapStrategyToWebService(request.strategy || RouteStrategy.FASTEST),
        extensions: 'all', // 返回完整路线信息
        output: 'json'
      });

      // 如果有途经点，添加到参数中
      if (request.waypoints && request.waypoints.length > 0) {
        const waypoints = request.waypoints.map(point => `${point.lng},${point.lat}`).join(';');
        params.append('waypoints', waypoints);
      }

      const url = `https://restapi.amap.com/v3/direction/driving?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      // 调试：打印高德驾车规划原始数据
      console.log('[AMap Driving] raw response:', data);

      if (data.status === '1' && data.route) {
        const routeResult = this.parseWebServiceDrivingResult(data);
        // 调试：打印解析后的多方案结果
        console.log('[AMap Driving] parsed result:', routeResult);
        return {
          status: RouteServiceStatus.SUCCESS,
          data: routeResult
        };
      } else {
        return {
          status: RouteServiceStatus.ERROR,
          error: {
            code: data.infocode || 'UNKNOWN_ERROR',
            message: data.info || '路径规划失败',
            details: data
          }
        };
      }
    } catch (error) {
      return {
        status: RouteServiceStatus.ERROR,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络请求失败',
          details: error
        }
      };
    }
  }

  /**
   * 步行路径规划 - Web服务API
   */
  async planWalkingRouteWebService(request: RouteRequest): Promise<RouteServiceResult> {
    try {
      const params = new URLSearchParams({
        key: this.serviceKey,
        origin: `${request.origin.lng},${request.origin.lat}`,
        destination: `${request.destination.lng},${request.destination.lat}`,
        output: 'json'
      });

      const url = `https://restapi.amap.com/v3/direction/walking?${params.toString()}`;


      const response = await fetch(url);
      const data = await response.json();

      // 调试：打印高德步行规划原始数据
      console.log('[AMap Walking] raw response:', data);

      if (data.status === '1' && data.route) {
        const routeResult = this.parseWebServiceWalkingResult(data);
        return {
          status: RouteServiceStatus.SUCCESS,
          data: routeResult
        };
      } else {
        return {
          status: RouteServiceStatus.ERROR,
          error: {
            code: data.infocode || 'UNKNOWN_ERROR',
            message: data.info || '步行路径规划失败',
            details: data
          }
        };
      }
    } catch (error) {
      return {
        status: RouteServiceStatus.ERROR,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络请求失败',
          details: error
        }
      };
    }
  }

  /**
   * 公交/换乘路径规划 - Web服务API
   */
  async planTransitRouteWebService(request: RouteRequest): Promise<RouteServiceResult> {
    try {
      const params = new URLSearchParams({
        key: this.serviceKey,
        origin: `${request.origin.lng},${request.origin.lat}`,
        destination: `${request.destination.lng},${request.destination.lat}`,
        city: request.city || '',
        output: 'json'
      });

      const url = `https://restapi.amap.com/v3/direction/transit/integrated?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && (data.route || data.transits)) {
        const routeResult = this.parseWebServiceTransitResult(data);
        return {
          status: RouteServiceStatus.SUCCESS,
          data: routeResult
        };
      } else {
        return {
          status: RouteServiceStatus.ERROR,
          error: {
            code: data.infocode || 'UNKNOWN_ERROR',
            message: data.info || '公交换乘规划失败',
            details: data
          }
        };
      }
    } catch (error) {
      return {
        status: RouteServiceStatus.ERROR,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络请求失败',
          details: error
        }
      };
    }
  }

  /**
   * 骑行路径规划 - Web服务API
   */
  async planRidingRouteWebService(request: RouteRequest): Promise<RouteServiceResult> {
    try {
      const params = new URLSearchParams({
        key: this.serviceKey,
        origin: `${request.origin.lng},${request.origin.lat}`,
        destination: `${request.destination.lng},${request.destination.lat}`,
        output: 'json'
      });
      const url = `https://restapi.amap.com/v4/riding/roadmap?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      // v4 riding returns path if successful
      if (data && (data.data || data.path)) {
        const routeResult = this.parseWebServiceRidingResult(data);
        return {
          status: RouteServiceStatus.SUCCESS,
          data: routeResult
        };
      } else {
        return {
          status: RouteServiceStatus.ERROR,
          error: {
            code: data.infocode || 'UNKNOWN_ERROR',
            message: data.info || '骑行路径规划失败',
            details: data
          }
        };
      }
    } catch (error) {
      return {
        status: RouteServiceStatus.ERROR,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络请求失败',
          details: error
        }
      };
    }
  }

  /**
   * 解析 WebService 公交换乘结果（尽量提取 polyline）
   */
  private parseWebServiceTransitResult(data: any): RouteResult {
    // Try to extract a polyline by concatenating segments if available
    const polyline: MapPosition[] = [];
    try {
      const transits = data.route?.transits || data.transits || [];
      if (transits.length > 0) {
        const first = transits[0];
        const segments = first.segments || [];
        segments.forEach((seg: any) => {
          if (seg.walk && seg.walk.path) {
            seg.walk.path.split(';').forEach((coord: string) => {
              const [lng, lat] = coord.split(',').map(Number);
              if (!isNaN(lng) && !isNaN(lat)) polyline.push({ lng, lat });
            });
          }
          if (seg.bus && seg.bus.line && seg.bus.line.path) {
            seg.bus.line.path.split(';').forEach((coord: string) => {
              const [lng, lat] = coord.split(',').map(Number);
              if (!isNaN(lng) && !isNaN(lat)) polyline.push({ lng, lat });
            });
          }
          if (seg.rail && seg.rail.path) {
            seg.rail.path.split(';').forEach((coord: string) => {
              const [lng, lat] = coord.split(',').map(Number);
              if (!isNaN(lng) && !isNaN(lat)) polyline.push({ lng, lat });
            });
          }
        });
      }
    } catch (e) {
      // ignore parse errors
    }
    return {
      polyline,
      distance: data.route?.distance || 0,
      duration: data.route?.duration || 0,
      steps: []
    };
  }

  /**
   * 解析骑行结果（v4 riding or v3 riding）
   */
  private parseWebServiceRidingResult(data: any): RouteResult {
    const polyline: MapPosition[] = [];
    try {
      // v4 riding returns data.path as array of points string
      if (data.data && data.data?.paths && data.data.paths.length > 0) {
        const path = data.data.paths[0].path || '';
        path.split(';').forEach((coord: string) => {
          const [lng, lat] = coord.split(',').map(Number);
          if (!isNaN(lng) && !isNaN(lat)) polyline.push({ lng, lat });
        });
      } else if (data.path) {
        data.path.split(';').forEach((coord: string) => {
          const [lng, lat] = coord.split(',').map(Number);
          if (!isNaN(lng) && !isNaN(lat)) polyline.push({ lng, lat });
        });
      }
    } catch (e) {
      // ignore
    }
    return { polyline, distance: 0, duration: 0, steps: [] };
  }

  /**
   * 将应用策略转换为Web服务策略参数
   */
  private mapStrategyToWebService(strategy: RouteStrategy): string {
    switch (strategy) {
      case RouteStrategy.FASTEST:
        return '0'; // 速度优先
      case RouteStrategy.SHORTEST:
        return '2'; // 距离优先
      case RouteStrategy.AVOID_HIGHWAY:
        return '3'; // 避免收费
      case RouteStrategy.AVOID_CONGESTION:
        return '4'; // 综合最优（考虑实时路况）
      default:
        return '0';
    }
  }

  /**
   * 解析Web服务驾车规划结果
   */
  private parseWebServiceDrivingResult(data: any): RouteResult {
    const paths: any[] = data?.route?.paths || [];

    const plans: RoutePlan[] = paths.map((route: any) => {
      const polyline: MapPosition[] = [];
      const steps: RouteStep[] = [];

      // 解析步骤信息，并将所有步骤的polyline合并成完整路径
      if (route.steps) {
        route.steps.forEach((step: any, index: number) => {
          const stepPolyline = this.parseStepPolylineWebService(step.polyline || '');
          polyline.push(...stepPolyline);
          steps.push({
            instruction: step.instruction || step.ori_instruction || `第${index + 1}步`,
            distance: parseInt(step.distance) || 0,
            duration: parseInt(step.duration) || 0,
            polyline: stepPolyline
          });
        });
      }

      // 如果主路径没有polyline但有 route.polyline，则使用它
      if (polyline.length === 0 && route.polyline) {
        const coordinates = route.polyline.split(';');
        coordinates.forEach((coord: string) => {
          const [lng, lat] = coord.split(',').map(Number);
          if (!isNaN(lng) && !isNaN(lat)) {
            polyline.push({ lng, lat });
          }
        });
      }

      return {
        polyline,
        distance: parseInt(route.distance) || 0,
        duration: parseInt(route.duration) || 0,
        tolls: parseFloat(route.tolls) || 0,
        steps
      };
    });

    const first = plans[0] || { polyline: [], distance: 0, duration: 0, tolls: 0, steps: [] };

    // 兼容：顶层字段仍然放“当前选中方案”（默认第一条）
    return {
      ...first,
      plans
    };
  }

  /**
   * 解析Web服务步行规划结果
   */
  private parseWebServiceWalkingResult(data: any): RouteResult {
    const route = data.route.paths[0];
    const polyline: MapPosition[] = [];

    // 解析步骤信息，并将所有步骤的polyline合并成完整路径
    const steps: RouteStep[] = [];
    if (route.steps) {
      route.steps.forEach((step: any, index: number) => {
        const stepPolyline = this.parseStepPolylineWebService(step.polyline || '');

        // 将步骤的路径点添加到主路径中
        polyline.push(...stepPolyline);

        steps.push({
          instruction: step.instruction || `第${index + 1}步`,
          distance: parseInt(step.distance) || 0,
          duration: parseInt(step.duration) || 0,
          polyline: stepPolyline
        });
      });
    }

    // 如果主路径没有polyline但有步骤，则使用合并后的步骤polyline
    if (polyline.length === 0 && route.polyline) {
      const coordinates = route.polyline.split(';');
      coordinates.forEach((coord: string) => {
        const [lng, lat] = coord.split(',').map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          polyline.push({ lng, lat });
        }
      });
    }

    return {
      polyline,
      distance: parseInt(route.distance) || 0,
      duration: parseInt(route.duration) || 0,
      steps
    };
  }

  /**
   * 解析Web服务步骤的polyline
   */
  private parseStepPolylineWebService(polylineStr: string): MapPosition[] {
    const polyline: MapPosition[] = [];
    if (polylineStr) {
      const coordinates = polylineStr.split(';');
      coordinates.forEach((coord: string) => {
        const [lng, lat] = coord.split(',').map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          polyline.push({ lng, lat });
        }
      });
    }
    return polyline;
  }
}

/**
 * 创建Web服务路径规划实例
 */
export function createWebServiceRoutePlanning(): WebServiceRoutePlanning {
  return new WebServiceRoutePlanning();
}

/**
 * 创建路径规划服务实例（保留JS API方式）
 * @returns RoutePlanningService
 */
export function createRoutePlanningService(): RoutePlanningService {
  return new RoutePlanningService();
}

/**
 * 便捷函数：规划驾车路线 (使用Web服务API)
 * @param origin 起点
 * @param destination 终点
 * @param waypoints 途经点（可选）
 * @param strategy 规划策略（推荐方案 / 避免拥堵 等）
 * @returns Promise<RouteServiceResult>
 */
export async function planDrivingRoute(
  origin: MapPosition,
  destination: MapPosition,
  waypoints?: MapPosition[],
  strategy?: RouteStrategy
): Promise<RouteServiceResult> {
  const service = createWebServiceRoutePlanning();
  return service.planDrivingRouteWebService({ origin, destination, waypoints, strategy });
}

/**
 * 便捷函数：规划步行路线 (使用Web服务API)
 * @param origin 起点
 * @param destination 终点
 * @returns Promise<RouteServiceResult>
 */
export async function planWalkingRoute(
  origin: MapPosition,
  destination: MapPosition
): Promise<RouteServiceResult> {
  const service = createWebServiceRoutePlanning();
  return service.planWalkingRouteWebService({ origin, destination });
}

/**
 * 便捷函数：规划公交/换乘路线 (使用Web服务API)
 */
export async function planTransitRoute(
  origin: MapPosition,
  destination: MapPosition
): Promise<RouteServiceResult> {
  const service = createWebServiceRoutePlanning();
  return service.planTransitRouteWebService({ origin, destination });
}

/**
 * 便捷函数：规划骑行路线 (使用Web服务API)
 */
export async function planRidingRoute(
  origin: MapPosition,
  destination: MapPosition
): Promise<RouteServiceResult> {
  const service = createWebServiceRoutePlanning();
  return service.planRidingRouteWebService({ origin, destination });
}

/**
 * 便捷函数：规划电动车路线 (映射到骑行规划，考虑后续扩展)
 */
export async function planElectricRoute(
  origin: MapPosition,
  destination: MapPosition
): Promise<RouteServiceResult> {
  // For now, map electric route to riding API; can be tuned with extra params later
  const service = createWebServiceRoutePlanning();
  return service.planRidingRouteWebService({ origin, destination });
}





  
  