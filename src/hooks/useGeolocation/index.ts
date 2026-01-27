// useGeolocation Hook 占位文件
// 后续在此封装浏览器地理位置获取逻辑
import { useState, useCallback } from 'react';
import type { MapPosition } from '@/types';

interface GeolocationState {
    position: MapPosition | null; //定位成功的坐标
    loading:boolean; //是否正在定位中
    error:string | null; //定位失败的错误信息
}


interface GeolocationHook extends GeolocationState {
    getCurrentPosition: () => void; //手动触发定位的方法
}

export const useGeolocation = (): GeolocationHook => {
    const [position, setPosition] = useState<MapPosition | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 成功获取定位的回调函数
    const handleSuccess = useCallback((pos: GeolocationPosition) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        setLoading(false);
        setError(null);
    }, []);

    // 获取定位失败的回调函数
    const handleError = useCallback((err: GeolocationPositionError) => {
        let errorMessage = '定位失败';
        
        // 根据不同的错误代码给出相应的提示
        switch (err.code) {
            case err.PERMISSION_DENIED:
            errorMessage = '用户拒绝了定位权限';
            break;
            case err.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用';
            break;
            case err.TIMEOUT:
            errorMessage = '获取位置超时';
            break;
            default:
            errorMessage = '未知定位错误';
        }
        
        setError(errorMessage);
        setLoading(false);
    }, []);

    // 手动触发定位的方法
    const getCurrentPosition = useCallback(() => {
        // 检查浏览器是否支持地理定位
        if (!navigator.geolocation) {
            console.error('❌ 浏览器不支持地理定位');
            setError('您的浏览器不支持地理定位功能');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        // 调用浏览器的地理定位API
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError,{
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
        });
    },[handleSuccess,handleError]);


    return {
        position,
        loading,
        error,
        getCurrentPosition,
    }
}


