/**
 * useUsageStats Hook
 * 收集真实的使用统计数据，用于项目描述中的数据支撑
 * 
 * 统计指标：
 * - 搜索相关（搜索次数、缓存命中、响应时间）
 * - 标记渲染性能
 * - 用户行为（停留时长、点击转化）
 * - 首屏性能 (FCP, LCP)
 * - 路线规划
 */
import { useCallback, useEffect, useRef } from 'react';

export interface UsageStats {
  // 搜索相关
  searchCount: number;
  searchCacheHits: number;
  searchAvgResponseTime: number;
  
  // 标记渲染
  markerRenderCount: number;
  markerTotalRenderTime: number;
  
  // 用户行为
  pageViewCount: number;
  pageStayDuration: number;
  categoryClickCount: Record<string, number>;
  poiDetailClickCount: number;
  
  // 首屏性能
  fcp: number | null;
  lcp: number | null;
  
  // 路线规划
  routePlanCount: number;
  routePlanSuccessCount: number;
}

const STATS_KEY = 'map_usage_stats_v1';
const PAGE_START_TIME = Date.now();

// 获取默认统计数据
function getDefaultStats(): UsageStats {
  return {
    searchCount: 0,
    searchCacheHits: 0,
    searchAvgResponseTime: 0,
    markerRenderCount: 0,
    markerTotalRenderTime: 0,
    pageViewCount: 1,
    pageStayDuration: 0,
    categoryClickCount: {},
    poiDetailClickCount: 0,
    fcp: null,
    lcp: null,
    routePlanCount: 0,
    routePlanSuccessCount: 0,
  };
}

// 获取存储的统计数据
function getStoredStats(): UsageStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const stats = JSON.parse(raw);
      // 每天重置部分统计
      const storedDate = stats.date;
      const today = new Date().toDateString();
      if (storedDate !== today) {
        return {
          ...getDefaultStats(),
          pageViewCount: (stats.pageViewCount || 0) + 1,
          date: today,
        };
      }
      return stats;
    }
  } catch (e) {
    // ignore
  }
  return getDefaultStats();
}

// 保存统计数据
function saveStats(stats: UsageStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify({ ...stats, date: new Date().toDateString() }));
  } catch (e) {
    // ignore
  }
}

// 监听 Web Vitals 数据（从 monitoring.tsx 广播）
function setupWebVitalsListener(callback: (name: string, value: number) => void) {
  // 监听 custom event 从 monitoring.tsx
  const handler = (e: CustomEvent) => {
    callback(e.detail.name, e.detail.value);
    // 同时更新 localStorage（供 globalUsageStats 读取）
    const stats = getStoredStats();
    const name = e.detail.name;
    const value = e.detail.value;
    if (name === 'FCP' || name === 'LCP') {
      saveStats({
        ...stats,
        [name.toLowerCase()]: value,
      });
    }
  };
  window.addEventListener('web-vitals', handler as EventListener);
  return () => window.removeEventListener('web-vitals', handler as EventListener);
}

export function useUsageStats() {
  const statsRef = useRef<UsageStats>(getStoredStats());
  const searchTimesRef = useRef<number[]>([]);
  const stayIntervalRef = useRef<number | null>(null);

  // 初始化
  useEffect(() => {
    const stats = getStoredStats();
    statsRef.current = stats;
    saveStats(stats);
    
    // 页面停留计时
    stayIntervalRef.current = window.setInterval(() => {
      statsRef.current = {
        ...statsRef.current,
        pageStayDuration: (statsRef.current.pageStayDuration || 0) + 1,
      };
    }, 1000);

    // 监听 Web Vitals 数据
    const cleanupWebVitals = setupWebVitalsListener((name, value) => {
      if (name === 'FCP' || name === 'LCP') {
        statsRef.current = {
          ...statsRef.current,
          [name.toLowerCase()]: value,
        };
        // 同步更新 localStorage
        saveStats(statsRef.current);
        console.log('📊 [统计] 收到 Web Vitals:', name, value);
      }
    });

    // 页面卸载时保存
    const handleBeforeUnload = () => {
      saveStats(statsRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (stayIntervalRef.current) {
        clearInterval(stayIntervalRef.current);
      }
      cleanupWebVitals();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveStats(statsRef.current);
    };
  }, []);

  // 记录搜索
  const recordSearch = useCallback((responseTime: number, isCacheHit: boolean = false) => {
    const stats = statsRef.current;
    const newTimes = [...searchTimesRef.current, responseTime].slice(-50);
    searchTimesRef.current = newTimes;
    
    const avgTime = newTimes.length > 0 
      ? Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length)
      : 0;
    
    statsRef.current = {
      ...stats,
      searchCount: stats.searchCount + 1,
      searchCacheHits: isCacheHit ? stats.searchCacheHits + 1 : stats.searchCacheHits,
      searchAvgResponseTime: avgTime,
    };
    
    console.log('📊 [统计] 搜索记录:', {
      总搜索次数: statsRef.current.searchCount,
      缓存命中: statsRef.current.searchCacheHits,
      平均响应: `${statsRef.current.searchAvgResponseTime}ms`,
    });
  }, []);

  // 记录标记渲染时间
  const recordMarkerRender = useCallback((renderTime: number) => {
    const stats = statsRef.current;
    statsRef.current = {
      ...stats,
      markerRenderCount: stats.markerRenderCount + 1,
      markerTotalRenderTime: stats.markerTotalRenderTime + renderTime,
    };
    
    console.log('📊 [统计] 标记渲染:', {
      渲染次数: statsRef.current.markerRenderCount,
      平均渲染时间: `${Math.round(statsRef.current.markerTotalRenderTime / statsRef.current.markerRenderCount)}ms`,
    });
  }, []);

  // 记录分类点击
  const recordCategoryClick = useCallback((category: string) => {
    const stats = statsRef.current;
    statsRef.current = {
      ...stats,
      categoryClickCount: {
        ...stats.categoryClickCount,
        [category]: (stats.categoryClickCount[category] || 0) + 1,
      },
    };
    console.log('📊 [统计] 分类点击:', category);
  }, []);

  // 记录 POI 详情点击
  const recordPoiDetailClick = useCallback(() => {
    const stats = statsRef.current;
    statsRef.current = {
      ...stats,
      poiDetailClickCount: stats.poiDetailClickCount + 1,
    };
    console.log('📊 [统计] POI详情点击:', statsRef.current.poiDetailClickCount);
  }, []);

  // 记录路线规划
  const recordRoutePlan = useCallback((success: boolean = true) => {
    const stats = statsRef.current;
    statsRef.current = {
      ...stats,
      routePlanCount: stats.routePlanCount + 1,
      routePlanSuccessCount: success ? stats.routePlanSuccessCount + 1 : stats.routePlanSuccessCount,
    };
    console.log('📊 [统计] 路线规划:', {
      总次数: statsRef.current.routePlanCount,
      成功: statsRef.current.routePlanSuccessCount,
    });
  }, []);

  // 记录 Web Vitals
  const recordWebVitals = useCallback((fcp: number, lcp: number) => {
    statsRef.current = {
      ...statsRef.current,
      fcp: fcp || statsRef.current.fcp,
      lcp: lcp || statsRef.current.lcp,
    };
    console.log('📊 [统计] 首屏性能 - FCP:', fcp, 'LCP:', lcp);
  }, []);

  // 获取统计报告
  const getStatsReport = useCallback(() => {
    const stats = statsRef.current;
    const markerAvgTime = stats.markerRenderCount > 0
      ? Math.round(stats.markerTotalRenderTime / stats.markerRenderCount)
      : 0;
    const routeSuccessRate = stats.routePlanCount > 0
      ? Math.round((stats.routePlanSuccessCount / stats.routePlanCount) * 100)
      : 0;
    const cacheHitRate = stats.searchCount > 0
      ? Math.round((stats.searchCacheHits / stats.searchCount) * 100)
      : 0;

    return {
      搜索统计: {
        总搜索次数: stats.searchCount,
        缓存命中: stats.searchCacheHits,
        缓存命中率: `${cacheHitRate}%`,
        平均响应时间: `${stats.searchAvgResponseTime}ms`,
      },
      标记渲染: {
        渲染次数: stats.markerRenderCount,
        平均渲染时间: `${markerAvgTime}ms`,
      },
      用户行为: {
        页面浏览: stats.pageViewCount,
        停留时长: `${Math.floor(stats.pageStayDuration / 60)}分钟`,
        分类点击: stats.categoryClickCount,
        POI点击: stats.poiDetailClickCount,
      },
      首屏性能: {
        FCP: stats.fcp ? `${stats.fcp}ms` : '未记录',
        LCP: stats.lcp ? `${stats.lcp}ms` : '未记录',
      },
      路线规划: {
        总次数: stats.routePlanCount,
        成功: stats.routePlanSuccessCount,
        成功率: `${routeSuccessRate}%`,
      },
    };
  }, []);

  // 清除统计
  const clearStats = useCallback(() => {
    statsRef.current = getDefaultStats();
    searchTimesRef.current = [];
    localStorage.removeItem(STATS_KEY);
    console.log('📊 [统计] 已清除');
  }, []);

  return {
    recordSearch,
    recordMarkerRender,
    recordCategoryClick,
    recordPoiDetailClick,
    recordRoutePlan,
    recordWebVitals,
    getStatsReport,
    clearStats,
  };
}

// 全局统计函数（非组件环境）
export const globalUsageStats = {
  recordSearch: (responseTime: number, isCacheHit: boolean = false) => {
    const stats = getStoredStats();
    const newTimes = [...(stats.markerTotalRenderTime ? [responseTime] : []), responseTime].slice(-50);
    const avgTime = newTimes.length > 0 ? Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length) : 0;
    
    saveStats({
      ...stats,
      searchCount: stats.searchCount + 1,
      searchCacheHits: isCacheHit ? stats.searchCacheHits + 1 : stats.searchCacheHits,
      searchAvgResponseTime: avgTime,
    });
  },
  
  getReport: () => {
    const stats = getStoredStats();
    const markerAvgTime = stats.markerRenderCount > 0
      ? Math.round(stats.markerTotalRenderTime / stats.markerRenderCount)
      : 0;
    const routeSuccessRate = stats.routePlanCount > 0
      ? Math.round((stats.routePlanSuccessCount / stats.routePlanCount) * 100)
      : 0;
    const cacheHitRate = stats.searchCount > 0
      ? Math.round((stats.searchCacheHits / stats.searchCount) * 100)
      : 0;
    
    return {
      searchCount: stats.searchCount,
      searchCacheHits: stats.searchCacheHits,
      cacheHitRate: `${cacheHitRate}%`,
      searchAvgResponseTime: `${stats.searchAvgResponseTime}ms`,
      markerRenderCount: stats.markerRenderCount,
      markerAvgTime: `${markerAvgTime}ms`,
      routePlanCount: stats.routePlanCount,
      routeSuccessRate: `${routeSuccessRate}%`,
      pageStayDuration: stats.pageStayDuration,
      poiDetailClickCount: stats.poiDetailClickCount,
      fcp: stats.fcp ? `${stats.fcp}ms` : null,
      lcp: stats.lcp ? `${stats.lcp}ms` : null,
    };
  },
};

export default useUsageStats;
