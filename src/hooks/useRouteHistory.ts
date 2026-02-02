import { useState, useEffect, useCallback } from 'react';

export type RouteHistoryItem = {
  id: string;
  originText: string;
  destText: string;
  originLocation?: { lng: number; lat: number };
  destLocation?: { lng: number; lat: number };
  mode?: 'driving' | 'walking' | 'transit' | 'riding' | 'electric';
  updatedAt?: number;
};

const ROUTE_HISTORY_KEY = 'route_search_history_v1';

export const useRouteHistory = () => {
  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>([]);

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

  const addRouteHistory = useCallback((item: RouteHistoryItem) => {
    // 检查起点和终点是否有效
    if (!item.originText?.trim() || !item.destText?.trim()) {
      return;
    }
    setRouteHistory((prev: RouteHistoryItem[]) => {
      // Normalize compare: prefer coordinates if available, fallback to texts
      const isSame = (a: RouteHistoryItem, b: RouteHistoryItem) => {
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

  return {
    routeHistory,
    addRouteHistory,
    removeRouteHistoryItem,
  };
};
