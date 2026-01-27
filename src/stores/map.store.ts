// 地图相关 Zustand store 占位文件
// 后续在此管理地图中心点、缩放级别、地图类型等全局状态

import { create } from 'zustand';
import type { MapPosition } from '@/types';

interface MapState {
    // 地图状态
    center: MapPosition;
    zoom: number;
    mapType: 'normal' | 'satellite' | '3d';
    selectedMarkerId: string | null;
    
    // Actions
    setCenter: (center: MapPosition) => void;
    setZoom: (zoom: number) => void;
    setMapType: (mapType: 'normal' | 'satellite' | '3d') => void;
    setSelectedMarkerId: (id: string | null) => void;
  }

export const useMapStore = create<MapState>((set) => ({
    center: { lng: 116.3974, lat: 39.9093 },
    zoom: 10,
    mapType: 'normal',
    selectedMarkerId: null,
    setCenter: (center: MapPosition) => set({ center }),
    setZoom: (zoom: number) => set({ zoom }),
    setMapType: (mapType: 'normal' | 'satellite' | '3d') => set({ mapType }),
    setSelectedMarkerId: (id: string | null) => set({ selectedMarkerId: id }),
  }));