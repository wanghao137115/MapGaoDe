// 标记点相关 Zustand store 占位文件
// 后续在此管理 Marker 列表、筛选条件等状态

import { create } from 'zustand';
import type { Marker, MapPosition } from '@/types';


interface MarkersState {
    markers: Marker[];

    // Actions
    setMarkers: (markers: Marker[]) => void;
    addMarker: (marker: Omit<Marker, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateMarker: (id: string, updates: Partial<Marker>) => void;
    removeMarker: (id: string) => void;
}


export const useMarkersStore = create<MarkersState>((set, get) => ({
    markers: [],
    
    setMarkers: (markers) => set({ markers }),
    
    addMarker: (markerData) => {
      const newMarker: Marker = {
        ...markerData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => ({
        markers: [...state.markers, newMarker]
      }));
    },
    
    updateMarker: (id, updates) => {
      set((state) => ({
        markers: state.markers.map(marker => 
          marker.id === id 
            ? { ...marker, ...updates, updatedAt: new Date() }
            : marker
        )
      }));
    },
    
    removeMarker: (id) => {
      set((state) => ({
        markers: state.markers.filter(marker => marker.id !== id)
      }));
    },
  }));
