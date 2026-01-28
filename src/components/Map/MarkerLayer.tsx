import React, { useEffect, useRef, useState, memo } from "react";
import type { Marker } from "@/types";

interface MarkerLayerProps {
    markers: Marker[];
    onMarkerClick?: (marker: Marker) => void;
  onMarkerDragEnd?: (
    marker: Marker,
    newPosition: { lng: number; lat: number },
  ) => void;
}

const MarkerLayer: React.FC<MarkerLayerProps> = ({
    markers,
    onMarkerClick,
    onMarkerDragEnd,
  }) => {
    const markersRef = useRef<{ [key: string]: any }>({});
  const [mapReady, setMapReady] = useState(false);

  // 监听地图实例变化
  useEffect(() => {
    const checkMapReady = () => {
      if ((window as any).currentMap && (window as any).AMap) {
        setMapReady(true);
      } else {
        setMapReady(false);
      }
    };

    // 立即检查一次
    checkMapReady();

    // 设置定时器定期检查（直到地图就绪）
    const interval = setInterval(checkMapReady, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 只有当地图就绪时才渲染标记
    if (!mapReady) {
        return;
    }

        const AMap = (window as any).AMap;
        const map = (window as any).currentMap;

    console.log('MarkerLayer: 收到标记', markers.length, '个');
    markers.forEach(marker => console.log('MarkerLayer: 标记类型:', marker.type, '标题:', marker.title));

    // 获取现有的标记ID
    const existingIds = new Set(Object.keys(markersRef.current));
    const newIds = new Set(markers.map(m => m.id));

    // 找出需要删除的标记
    const toDelete = [...existingIds].filter(id => !newIds.has(id));
    // 找出需要添加的标记
    const toAdd = markers.filter(marker => !existingIds.has(marker.id));
    // 找出可能需要更新的标记
    const toUpdate = markers.filter(marker => existingIds.has(marker.id));

    // 删除不需要的标记
    toDelete.forEach(id => {
      const marker = markersRef.current[id];
      if (marker && map && typeof map.remove === 'function') {
        try {
          map.remove(marker);
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
        delete markersRef.current[id];
      }
    });

    // 添加新标记
    toAdd.forEach((marker) => {
      const icon = getMarkerIcon(marker, AMap);
      const mapMarker = createMapMarker(marker, icon, AMap, onMarkerClick, onMarkerDragEnd);
      map.add(mapMarker);
      markersRef.current[marker.id] = mapMarker;
    });

    // 更新现有标记（主要是图标变化）
    toUpdate.forEach((marker) => {
      const existingMarker = markersRef.current[marker.id];
      if (existingMarker) {
        // 检查类型是否改变
        const currentIcon = existingMarker.getIcon();
        const newIcon = getMarkerIcon(marker, AMap);

        // 如果图标不同，更新图标
        if (JSON.stringify(currentIcon?.image) !== JSON.stringify(newIcon?.image)) {
          existingMarker.setIcon(newIcon);
        }

        // 检查位置是否改变
        const currentPos = existingMarker.getPosition();
        const newPos = [marker.position.lng, marker.position.lat];
        if (currentPos[0] !== newPos[0] || currentPos[1] !== newPos[1]) {
          existingMarker.setPosition(newPos);
        }

        // 更新标题
        existingMarker.setTitle(marker.title);

        // 更新 label（可视化文字）
        try {
          const labelText = marker?.data?.labelText;
          if (labelText) {
            existingMarker.setLabel({
              direction: 'top',
              offset: new AMap.Pixel(0, -28),
              content: `<div style="
                padding: 2px 6px;
                background: rgba(0,0,0,0.72);
                color: #fff;
                border-radius: 10px;
                font-size: 12px;
                line-height: 18px;
                white-space: nowrap;
                box-shadow: 0 6px 14px rgba(0,0,0,0.18);
              ">${String(labelText).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`,
            });
          } else {
            // 取消 label
            existingMarker.setLabel(null);
          }
        } catch (e) {
          // ignore
        }
      }
    });

    // 清理函数：组件卸载时移除所有标记
    return () => {
        const currentMap = (window as any).currentMap;
        Object.values(markersRef.current).forEach((marker: any) => {
            if (marker && currentMap && typeof currentMap.remove === 'function') {
                try {
                    currentMap.remove(marker);
                } catch (error) {
                    console.warn('Error removing marker on cleanup:', error);
                }
            }
        });
        markersRef.current = {};
    };
  }, [markers, onMarkerClick, onMarkerDragEnd, mapReady]);

  // 辅助函数：获取标记图标
  const getMarkerIcon = (marker: Marker, AMap: any) => {
    // 如果标记有自定义图标，使用自定义图标
    if (marker.icon) {
      return new AMap.Icon({
        image: marker.icon,
        size: new AMap.Size(19, 31),
        imageSize: new AMap.Size(19, 31),
      });
    }

    // 否则根据类型使用默认图标
    switch (marker.type) {
      case "store":
        return new AMap.Icon({
          image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
          size: new AMap.Size(19, 31),
          imageSize: new AMap.Size(19, 31),
        });
      case "warehouse":
        return new AMap.Icon({
          image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png",
          size: new AMap.Size(19, 31),
          imageSize: new AMap.Size(19, 31),
        });
      case "vehicle":
        return new AMap.Icon({
          image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png",
          size: new AMap.Size(19, 31),
          imageSize: new AMap.Size(19, 31),
        });
      case "confirmed_place":
        // 为确认的地点使用特殊的星号样式
        return new AMap.Icon({
          image: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#1890ff" stroke="white" stroke-width="2"/>
              <text x="16" y="22" text-anchor="middle" fill="white" font-size="20" font-weight="bold">★</text>
            </svg>
          `),
          size: new AMap.Size(32, 32),
          imageSize: new AMap.Size(32, 32),
        });
      default:
        return new AMap.Icon({
          image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_bs.png",
          size: new AMap.Size(19, 31),
          imageSize: new AMap.Size(19, 31),
        });
    }
  };

  // 辅助函数：创建地图标记
  const createMapMarker = (marker: any, icon: any, AMap: any, onMarkerClick: any, onMarkerDragEnd: any) => {
            const mapMarker = new AMap.Marker({
                position: [marker.position.lng, marker.position.lat],
                title: marker.title,
                icon: icon,
      draggable: true,
      cursor: "pointer",
            });

    // 可选：显示可视化文字标签（用于分类详情选中态等）
    const labelText = marker?.data?.labelText;
    if (labelText) {
      try {
        mapMarker.setLabel({
          direction: 'top',
          offset: new AMap.Pixel(0, -28),
          content: `<div style="
            padding: 2px 6px;
            background: rgba(0,0,0,0.72);
            color: #fff;
            border-radius: 10px;
            font-size: 12px;
            line-height: 18px;
            white-space: nowrap;
            box-shadow: 0 6px 14px rgba(0,0,0,0.18);
          ">${String(labelText).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`,
        });
      } catch (e) {
        // ignore
      }
    }

    mapMarker.on("click", (e: any) => {
                onMarkerClick?.(marker);
            });

    mapMarker.on("dragend", (e: any) => {
                const { lng, lat } = e.lnglat;
                const newPosition = { lng, lat };
                onMarkerDragEnd?.(marker, newPosition);
            });

    return mapMarker;
  };
    // MarkerLayer 不渲染任何DOM元素，只负责管理标记
    return null;
};

// 使用React.memo进行性能优化
const MemoizedMarkerLayer = memo(MarkerLayer);
MemoizedMarkerLayer.displayName = 'MarkerLayer';

export default MemoizedMarkerLayer;
