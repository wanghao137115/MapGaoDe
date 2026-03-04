// src/services/map/__tests__/MapManager.test.ts
// MapManager 单元测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MapManager, mapManager } from '../MapManager';

describe('MapManager', () => {
  // 重置单例状态
  beforeEach(() => {
    // 清除所有地图实例
    mapManager.destroyAll();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mapManager.destroyAll();
  });

  describe('单例模式', () => {
    it('getInstance 应该返回同一个实例', () => {
      const instance1 = MapManager.getInstance();
      const instance2 = MapManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('导出的 mapManager 应该是单例', () => {
      const instance = MapManager.getInstance();
      expect(mapManager).toBe(instance);
    });
  });

  describe('createMap - 创建地图', () => {
    it('应该在 AMap 未加载时返回 null', () => {
      const originalAMap = (window as any).AMap;
      (window as any).AMap = undefined;

      const container = document.createElement('div');
      const result = mapManager.createMap(container, { center: [116.397428, 39.90923], zoom: 12 }, 'test');

      expect(result).toBeNull();
      (window as any).AMap = originalAMap;
    });

    it('应该成功创建地图实例', () => {
      const container = document.createElement('div');
      const result = mapManager.createMap(container, {
        center: [116.397428, 39.90923],
        zoom: 12,
      }, 'test-map');

      expect(result).not.toBeNull();
      expect(window.AMap.Map).toHaveBeenCalledWith(container, expect.objectContaining({
        center: [116.397428, 39.90923],
        zoom: 12,
        viewMode: '2D',
      }));
    });

    it('应该设置当前地图 ID', () => {
      const container = document.createElement('div');
      mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'new-map');

      expect(mapManager.getCurrentMapId()).toBe('new-map');
    });

    it('如果地图已存在，应该先销毁再创建', () => {
      const container = document.createElement('div');

      // 第一次创建
      mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'dup-map');
      const firstMap = mapManager.getMap('dup-map');

      // 第二次创建同一个 ID
      mapManager.createMap(container, { center: [1, 1], zoom: 12 }, 'dup-map');
      const secondMap = mapManager.getMap('dup-map');

      // destroy 应该被调用（第一次创建的地图被销毁）
      expect(firstMap?.destroy).toHaveBeenCalled();
    });
  });

  describe('getMap / getCurrentMap - 获取地图', () => {
    it('getMap 应该返回指定 ID 的地图', () => {
      const container = document.createElement('div');
      mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'specific-id');

      const map = mapManager.getMap('specific-id');
      expect(map).not.toBeNull();
    });

    it('getMap 对于不存在的 ID 应该返回 null', () => {
      const map = mapManager.getMap('non-existent');
      expect(map).toBeNull();
    });

    it('getCurrentMap 应该返回当前活动的地图', () => {
      const container = document.createElement('div');
      mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'current-test');

      const current = mapManager.getCurrentMap();
      expect(current).not.toBeNull();
    });
  });

  describe('setCurrentMap - 设置当前地图', () => {
    it('应该切换当前地图', () => {
      const container = document.createElement('div');

      mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'map-a');
      mapManager.createMap(container, { center: [1, 1], zoom: 12 }, 'map-b');

      // 当前应该是 map-b
      expect(mapManager.getCurrentMapId()).toBe('map-b');

      // 切换到 map-a
      mapManager.setCurrentMap('map-a');
      expect(mapManager.getCurrentMapId()).toBe('map-a');
    });

    it('设置不存在的地图 ID 应该无效', () => {
      const container = document.createElement('div');
      mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'existing');

      const before = mapManager.getCurrentMapId();
      mapManager.setCurrentMap('non-existing');
      const after = mapManager.getCurrentMapId();

      expect(after).toBe(before);
    });
  });

  describe('destroyMap - 销毁地图', () => {
    it('应该正确销毁指定地图', () => {
      const container = document.createElement('div');
      mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'to-destroy');

      const map = mapManager.getMap('to-destroy');
      mapManager.destroyMap('to-destroy');

      expect(map.destroy).toHaveBeenCalled();
      expect(mapManager.getMap('to-destroy')).toBeNull();
    });

    it('销毁不存在的地图应该没有影响', () => {
      expect(() => {
        mapManager.destroyMap('non-existent');
      }).not.toThrow();
    });
  });

  describe('destroyAll - 销毁所有', () => {
    it('应该销毁所有地图实例', () => {
      const container = document.createElement('div');

      mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'map-1');
      mapManager.createMap(container, { center: [1, 1], zoom: 12 }, 'map-2');

      mapManager.destroyAll();

      expect(mapManager.getMap('map-1')).toBeNull();
      expect(mapManager.getMap('map-2')).toBeNull();
      expect(mapManager.getAllMapIds()).toHaveLength(0);
    });
  });

  describe('辅助方法', () => {
    it('getAllMapIds 应该返回所有地图 ID', () => {
      const container = document.createElement('div');

      mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'id-1');
      mapManager.createMap(container, { center: [1, 1], zoom: 12 }, 'id-2');

      const ids = mapManager.getAllMapIds();
      expect(ids).toContain('id-1');
      expect(ids).toContain('id-2');
    });

    it('hasMap 应该正确检查地图是否存在', () => {
      const container = document.createElement('div');

      mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'exists');

      expect(mapManager.hasMap('exists')).toBe(true);
      expect(mapManager.hasMap('not-exists')).toBe(false);
    });
  });

  describe('setCenter / setZoom - 地图操作', () => {
    it('setCenter 应该设置地图中心点', () => {
      const container = document.createElement('div');
      const map = mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'center-test');

      mapManager.setCenter('center-test', { lng: 116.397428, lat: 39.90923 });

      expect(map.setCenter).toHaveBeenCalledWith([116.397428, 39.90923]);
    });

    it('setZoom 应该设置地图缩放级别', () => {
      const container = document.createElement('div');
      const map = mapManager.createMap(container, { center: [0, 0], zoom: 10 }, 'zoom-test');

      mapManager.setZoom('zoom-test', 15);

      expect(map.setZoom).toHaveBeenCalledWith(15);
    });
  });
});
