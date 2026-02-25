/**
 * 地图管理器 - 负责地图实例的创建、管理和销毁
 * 将地图生命周期与 React 组件解耦
 */
import type { MapPosition } from '@/types';

// 地图配置选项
export interface MapOptions {
  center: [number, number];
  zoom: number;
  viewMode?: '2D' | '3D';
  mapStyle?: string;
  [key: string]: any;
}

// 地图实例类型
export type MapInstance = any;

// 地图事件回调
export type MapEventHandler = (data?: any) => void;

/**
 * 地图管理器类
 * 单例模式，统一管理所有地图实例
 */
export class MapManager {
  private static instance: MapManager;
  private maps: Map<string, MapInstance> = new Map();
  private eventListeners: Map<string, MapEventHandler[]> = new Map();
  private currentMapId: string = 'default';

  private constructor() {}

  static getInstance(): MapManager {
    if (!MapManager.instance) {
      MapManager.instance = new MapManager();
    }
    return MapManager.instance;
  }

  /**
   * 创建地图实例
   */
  createMap(container: HTMLElement, options: MapOptions, mapId: string = 'default'): MapInstance {
    // 如果已存在，先销毁
    if (this.maps.has(mapId)) {
      this.destroyMap(mapId);
    }

    const AMap = (window as any).AMap;
    if (!AMap) {
      console.error('[MapManager] AMap 未加载');
      return null;
    }

    const map = new AMap.Map(container, {
      center: options.center,
      zoom: options.zoom,
      viewMode: options.viewMode || '2D',
      mapStyle: options.mapStyle,
    });

    this.maps.set(mapId, map);
    this.currentMapId = mapId;

    console.log(`[MapManager] 创建地图实例: ${mapId}`);
    return map;
  }

  /**
   * 获取地图实例
   */
  getMap(mapId: string = 'default'): MapInstance | null {
    return this.maps.get(mapId) || null;
  }

  /**
   * 获取当前地图实例
   */
  getCurrentMap(): MapInstance | null {
    return this.maps.get(this.currentMapId) || null;
  }

  /**
   * 获取当前地图 ID
   */
  getCurrentMapId(): string {
    return this.currentMapId;
  }

  /**
   * 设置当前地图
   */
  setCurrentMap(mapId: string): void {
    if (this.maps.has(mapId)) {
      this.currentMapId = mapId;
    }
  }

  /**
   * 销毁地图实例
   */
  destroyMap(mapId: string): void {
    const map = this.maps.get(mapId);
    if (map) {
      map.destroy();
      this.maps.delete(mapId);
      console.log(`[MapManager] 销毁地图实例: ${mapId}`);
    }
  }

  /**
   * 销毁所有地图实例
   */
  destroyAll(): void {
    this.maps.forEach((map, id) => {
      map.destroy();
    });
    this.maps.clear();
    console.log('[MapManager] 销毁所有地图实例');
  }

  /**
   * 设置中心点
   */
  setCenter(mapId: string | null, position: MapPosition): void {
    const map = mapId ? this.maps.get(mapId) : this.getCurrentMap();
    if (map) {
      map.setCenter([position.lng, position.lat]);
    }
  }

  /**
   * 设置缩放级别
   */
  setZoom(mapId: string | null, zoom: number): void {
    const map = mapId ? this.maps.get(mapId) : this.getCurrentMap();
    if (map) {
      map.setZoom(zoom);
    }
  }

  /**
   * 添加控件
   */
  addControl(mapId: string | null, controlType: string, options?: any): any {
    const map = mapId ? this.maps.get(mapId) : this.getCurrentMap();
    const AMap = (window as any).AMap;
    if (!map || !AMap || !AMap[controlType]) {
      return null;
    }

    const control = new AMap[controlType](options);
    map.addControl(control);
    return control;
  }

  /**
   * 移除控件
   */
  removeControl(mapId: string | null, control: any): void {
    const map = mapId ? this.maps.get(mapId) : this.getCurrentMap();
    if (map && control) {
      map.removeControl(control);
    }
  }

  /**
   * 添加事件监听
   */
  on(mapId: string | null, eventName: string, handler: MapEventHandler): void {
    const map = mapId ? this.maps.get(mapId) : this.getCurrentMap();
    if (map) {
      map.on(eventName, handler);
      
      // 保存引用以便移除
      const key = `${mapId || 'default'}_${eventName}`;
      if (!this.eventListeners.has(key)) {
        this.eventListeners.set(key, []);
      }
      this.eventListeners.get(key)!.push(handler);
    }
  }

  /**
   * 移除事件监听
   */
  off(mapId: string | null, eventName: string, handler: MapEventHandler): void {
    const map = mapId ? this.maps.get(mapId) : this.getCurrentMap();
    if (map) {
      map.off(eventName, handler);
    }
  }

  /**
   * 添加覆盖物
   */
  addOverlay(mapId: string | null, overlay: any): void {
    const map = mapId ? this.maps.get(mapId) : this.getCurrentMap();
    if (map && overlay) {
      map.add(overlay);
    }
  }

  /**
   * 移除覆盖物
   */
  removeOverlay(mapId: string | null, overlay: any): void {
    const map = mapId ? this.maps.get(mapId) : this.getCurrentMap();
    if (map && overlay) {
      map.remove(overlay);
    }
  }

  /**
   * 获取所有地图 ID
   */
  getAllMapIds(): string[] {
    return Array.from(this.maps.keys());
  }

  /**
   * 检查地图是否存在
   */
  hasMap(mapId: string): boolean {
    return this.maps.has(mapId);
  }
}

// 导出单例
export const mapManager = MapManager.getInstance();
