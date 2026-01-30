// 获取用户地理位置的自定义Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MapPosition, GeolocationErrorType } from '@/types';

interface GeolocationState {
  position: MapPosition | null;
  loading: boolean;
  error: GeolocationErrorType | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  useCache?: boolean; // 是否使用缓存
  cacheKey?: string; // 缓存键名
}

// 缓存键名常量
const CACHE_KEY = 'map_gaode_user_position';
const CACHE_TIMESTAMP_KEY = 'map_gaode_user_position_timestamp';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 缓存有效期：7天

// 从缓存读取位置
const getCachedPosition = (cacheKey: string): MapPosition | null => {
  try {
    const cached = localStorage.getItem(cacheKey);
    const timestamp = localStorage.getItem(`${cacheKey}_timestamp`);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      // 如果缓存未过期，返回缓存的位置
      if (age < CACHE_MAX_AGE) {
        const position = JSON.parse(cached);
        console.log('📍 [位置缓存] 使用缓存的位置:', position, '缓存年龄:', Math.round(age / 1000 / 60), '分钟');
        return position;
      } else {
        console.log('📍 [位置缓存] 缓存已过期，清除缓存');
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(`${cacheKey}_timestamp`);
      }
    }
  } catch (error) {
    console.error('📍 [位置缓存] 读取缓存失败:', error);
  }
  return null;
};

// 保存位置到缓存
const saveCachedPosition = (cacheKey: string, position: MapPosition) => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(position));
    localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
    console.log('📍 [位置缓存] 已保存位置到缓存:', position);
  } catch (error) {
    console.error('📍 [位置缓存] 保存缓存失败:', error);
  }
};

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5分钟
    watchPosition = false,
    useCache = true, // 默认使用缓存
    cacheKey = CACHE_KEY
  } = options;

  // 初始化时尝试从缓存读取位置（使用 useMemo 避免每次渲染都重新计算）
  const cachedPosition = useMemo(() => {
    return useCache ? getCachedPosition(cacheKey) : null;
  }, [useCache, cacheKey]);

  const [state, setState] = useState<GeolocationState>({
    position: cachedPosition, // 如果有缓存，先使用缓存
    loading: !cachedPosition, // 如果有缓存，不需要loading
    error: null
  });

  const updatePosition = useCallback((position: GeolocationPosition) => {
    const newPosition: MapPosition = {
      lng: position.coords.longitude,
      lat: position.coords.latitude
    };
    
    // 保存到缓存
    if (useCache) {
      saveCachedPosition(cacheKey, newPosition);
    }
    
    setState({
      position: newPosition,
      loading: false,
      error: null
    });
  }, [useCache, cacheKey]);

  // 辅助函数：生成错误类型（不更新 state）
  const createErrorType = useCallback((error: GeolocationPositionError): GeolocationErrorType => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return {
          code: error.PERMISSION_DENIED,
          message: '定位失败',
          description: '您已拒绝位置访问请求',
          solution: '请在浏览器设置中允许位置访问，或点击下方按钮重新尝试'
        };
      case error.POSITION_UNAVAILABLE:
        return {
          code: error.POSITION_UNAVAILABLE,
          message: '位置信息不可用',
          description: '无法获取您的位置信息',
          solution: '请检查GPS或网络连接是否正常'
        };
      case error.TIMEOUT:
        return {
          code: error.TIMEOUT,
          message: '获取位置超时',
          description: '定位请求超时',
          solution: '请稍后重试，或确保网络连接正常'
        };
      default:
        return {
          code: error.code,
          message: '未知位置错误',
          description: error.message || '发生未知错误',
          solution: '请刷新页面后重试'
        };
    }
  }, []);

  const handleError = useCallback((error: GeolocationPositionError): GeolocationErrorType => {
    const errorType = createErrorType(error);
    setState(prev => ({
      ...prev,
      loading: false,
      error: errorType
    }));
    return errorType;
  }, [createErrorType]);

  const getCurrentPosition = useCallback((silent = false) => {
    // 检查浏览器是否支持地理定位
    const isSupported = navigator.geolocation !== undefined;

    if (!isSupported) {
      const errorType: GeolocationErrorType = {
        code: -1,
        message: '浏览器不支持地理定位',
        description: '您的浏览器不支持地理位置功能',
        solution: '请使用现代浏览器（如Chrome、Firefox、Edge、Safari）'
      };
      setState(prev => ({
        ...prev,
        position: prev.position || null, // 如果有缓存位置，保持缓存
        loading: false,
        error: prev.position ? null : errorType // 如果有缓存位置，不显示错误
      }));
      return;
    }

    // 如果不是静默模式，显示 loading
    if (!silent) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    navigator.geolocation.getCurrentPosition(
      updatePosition,
      (error) => {
        // 如果获取位置失败，但有缓存位置，不显示错误
        setState(prev => {
          if (prev.position) {
            // 有缓存位置，静默失败，保持使用缓存
            console.log('📍 [位置缓存] 获取新位置失败，继续使用缓存位置');
            return { ...prev, loading: false };
          } else {
            // 没有缓存位置，显示错误
            const errorType = createErrorType(error);
            return {
              ...prev,
              loading: false,
              error: errorType
            };
          }
        });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, updatePosition, createErrorType]);

  useEffect(() => {
    // 如果有缓存位置，先使用缓存，然后尝试获取新位置（后台静默更新）
    // 如果没有缓存，立即获取位置
    if (cachedPosition) {
      // 有缓存时，在后台静默更新位置（不显示loading）
      console.log('📍 [位置缓存] 使用缓存位置，后台静默更新位置...');
      getCurrentPosition(true); // 静默模式，不显示 loading
    } else {
      // 没有缓存时，立即获取位置
      getCurrentPosition(false); // 非静默模式，显示 loading
    }

    let watchId: number | null = null;

    if (watchPosition) {
      watchId = navigator.geolocation.watchPosition(
        updatePosition,
        handleError,
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      );
    }

    // 清理函数
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchPosition, getCurrentPosition, updatePosition, handleError, cachedPosition]);

  return {
    ...state,
    refetch: getCurrentPosition
  };
};
