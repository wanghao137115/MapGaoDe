// 获取用户地理位置的自定义Hook
import { useState, useEffect, useCallback } from 'react';
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
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5分钟
    watchPosition = false
  } = options;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: true,
    error: null
  });

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState({
      position: {
        lng: position.coords.longitude,
        lat: position.coords.latitude
      },
      loading: false,
      error: null
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError): GeolocationErrorType => {
    let errorType: GeolocationErrorType = {
      code: error.code,
      message: ''
    };

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorType = {
          code: error.PERMISSION_DENIED,
          message: '定位失败',
          description: '您已拒绝位置访问请求',
          solution: '请在浏览器设置中允许位置访问，或点击下方按钮重新尝试'
        };
        break;
      case error.POSITION_UNAVAILABLE:
        errorType = {
          code: error.POSITION_UNAVAILABLE,
          message: '位置信息不可用',
          description: '无法获取您的位置信息',
          solution: '请检查GPS或网络连接是否正常'
        };
        break;
      case error.TIMEOUT:
        errorType = {
          code: error.TIMEOUT,
          message: '获取位置超时',
          description: '定位请求超时',
          solution: '请稍后重试，或确保网络连接正常'
        };
        break;
      default:
        errorType = {
          code: error.code,
          message: '未知位置错误',
          description: error.message || '发生未知错误',
          solution: '请刷新页面后重试'
        };
        break;
    }

    setState(prev => ({
      ...prev,
      loading: false,
      error: errorType
    }));

    return errorType;
  }, []);

  const getCurrentPosition = useCallback(() => {
    // 检查浏览器是否支持地理定位
    const isSupported = navigator.geolocation !== undefined;

    if (!isSupported) {
      const errorType: GeolocationErrorType = {
        code: -1,
        message: '浏览器不支持地理定位',
        description: '您的浏览器不支持地理位置功能',
        solution: '请使用现代浏览器（如Chrome、Firefox、Edge、Safari）'
      };
      setState({
        position: null,
        loading: false,
        error: errorType
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      updatePosition,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, updatePosition, handleError]);

  useEffect(() => {
    // 初始获取位置
    getCurrentPosition();

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
  }, [watchPosition, getCurrentPosition, updatePosition, handleError]);

  return {
    ...state,
    refetch: getCurrentPosition
  };
};
