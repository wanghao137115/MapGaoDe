import { useState, useRef, useCallback } from 'react';
import { useMapStore } from '@/stores/map.store';

export const useMapTools = () => {
  const { mapType, setMapType } = useMapStore();
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [showSubway, setShowSubway] = useState<boolean>(false);
  const [showSubwayModal, setShowSubwayModal] = useState<boolean>(false);
  const [showSatelliteMode, setShowSatelliteMode] = useState<boolean>(false);
  const [showSatelliteRoads, setShowSatelliteRoads] = useState<boolean>(false);
  const [trafficPanelVisible, setTrafficPanelVisible] = useState<boolean>(false);
  const [trafficMode, setTrafficMode] = useState<'realtime' | 'forecast'>('realtime');
  const [trafficWeekday, setTrafficWeekday] = useState<number>(new Date().getDay());
  const [trafficHour, setTrafficHour] = useState<number>(new Date().getHours());
  const prevMapTypeRef = useRef<'normal' | 'satellite' | '3d'>('normal');

  const toggleSatelliteMode = useCallback(() => {
    const map = (window as any).currentMap;
    if (!showSatelliteMode) {
      prevMapTypeRef.current = mapType || 'normal';
      setShowSatelliteMode(true);
      setShowSatelliteRoads(false);
      setMapType('satellite');
    } else {
      setShowSatelliteMode(false);
      setShowSatelliteRoads(false);
      setMapType(prevMapTypeRef.current || 'normal');
      try {
        if (map && map.__roadLayer && typeof map.remove === 'function') {
          map.remove(map.__roadLayer);
          delete map.__roadLayer;
        }
      } catch (e) {
        console.warn('清理路网覆盖失败:', e);
      }
    }
  }, [showSatelliteMode, mapType, setMapType]);

  const toggleTraffic = useCallback(() => {
    const newValue = !showTraffic;
    setShowTraffic(newValue);
    setTrafficPanelVisible(newValue);
  }, [showTraffic]);

  const toggleMeasureMode = useCallback(() => {
    setMeasureMode((prev) => !prev);
  }, []);

  const toggleSubwayModal = useCallback(() => {
    setShowSubwayModal((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  return {
    showTraffic,
    measureMode,
    showSubway,
    showSubwayModal,
    showSatelliteMode,
    showSatelliteRoads,
    trafficPanelVisible,
    trafficMode,
    trafficWeekday,
    trafficHour,
    prevMapTypeRef,
    setShowTraffic,
    setMeasureMode,
    setShowSubway,
    setShowSubwayModal,
    setShowSatelliteMode,
    setShowSatelliteRoads,
    setTrafficPanelVisible,
    setTrafficMode,
    setTrafficWeekday,
    setTrafficHour,
    toggleSatelliteMode,
    toggleTraffic,
    toggleMeasureMode,
    toggleSubwayModal,
    toggleFullscreen,
  };
};
