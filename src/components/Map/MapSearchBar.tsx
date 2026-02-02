import React from 'react';
import { Button } from 'antd';
import PlaceSearch from '@/components/Map/PlaceSearch';
import type { SearchHistoryItem } from '@/hooks/useSearchHistory';

type CategoryKey = 'food' | 'hotel' | 'poi' | 'neigh';

type MapSearchBarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  historyVisible: boolean;
  setHistoryVisible: (visible: boolean) => void;
  searchHistory: SearchHistoryItem[];
  onHistoryClick: (item: SearchHistoryItem) => void;
  onClearHistory: () => void;
  onRemoveHistoryItem: (id: string) => void;
  onPlaceSelect: (place: any) => void;
  onPlaceConfirm: (place: any) => void;
  showRoutePanel: boolean;
  setShowRoutePanel: (show: boolean) => void;
  onCategoryTrigger: (category: CategoryKey) => void;
  showCategorySheet: boolean;
  width?: number;
};

const MapSearchBar: React.FC<MapSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  historyVisible,
  setHistoryVisible,
  searchHistory,
  onHistoryClick,
  onClearHistory,
  onRemoveHistoryItem,
  onPlaceSelect,
  onPlaceConfirm,
  showRoutePanel,
  setShowRoutePanel,
  onCategoryTrigger,
  showCategorySheet,
  width = 500,
}) => {
  const CATEGORY_CONFIG: Record<CategoryKey, { label: string; emoji: string; keywords: string }> = {
    food: { label: '美食', emoji: '🍽️', keywords: '美食' },
    hotel: { label: '酒店', emoji: '🏨', keywords: '酒店' },
    poi: { label: '景点', emoji: '🏛️', keywords: '景点' },
    neigh: { label: '小区', emoji: '🏘️', keywords: '小区' },
  };

  return (
    <div
      style={{ width }}
      tabIndex={-1}
      onMouseDown={() => {
        if (!searchQuery.trim()) setHistoryVisible(true);
      }}
      onClickCapture={() => {
        if (!searchQuery.trim()) setHistoryVisible(true);
        if (showRoutePanel) {
          setShowRoutePanel((v) => !v);
        }
      }}
      onFocusCapture={() => {
        if (!searchQuery.trim()) setHistoryVisible(true);
      }}
      onBlur={() => setTimeout(() => setHistoryVisible(false), 150)}
    >
      <PlaceSearch
        style={{ width: '100%' }}
        value={searchQuery}
        onValueChange={(v) => {
          setSearchQuery(v);
          if (v.trim()) setHistoryVisible(false);
        }}
        onPlaceSelect={onPlaceSelect}
        onPlaceConfirm={onPlaceConfirm}
      />

      {/* 历史与分类下拉 - 始终渲染，通过样式控制展开收起以实现动画 */}
      {!showCategorySheet && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            width,
            background: '#fff',
            borderRadius: 6,
            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
            zIndex: 1300,
            maxHeight: historyVisible ? 320 : 0,
            opacity: historyVisible ? 1 : 0,
            transform: historyVisible ? 'translateY(0)' : 'translateY(-4px)',
            transition: 'max-height 240ms ease, opacity 180ms ease, transform 180ms ease',
            overflow: 'hidden',
            pointerEvents: historyVisible ? 'auto' : 'none',
          }}
        >
          <div style={{ padding: historyVisible ? 8 : 0 }}>
            {/* 顶部四个分类图标 */}
            <div style={{ display: 'flex', gap: 8, padding: '6px 4px', marginBottom: 6 }}>
              {([
                { key: 'hotel' as CategoryKey, label: '酒店', emoji: '🏨' },
                { key: 'food' as CategoryKey, label: '美食', emoji: '🍽️' },
                { key: 'poi' as CategoryKey, label: '景点', emoji: '🏛️' },
                { key: 'neigh' as CategoryKey, label: '小区', emoji: '🏘️' },
              ]).map((c) => (
                <div
                  key={c.key}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onCategoryTrigger(c.key)}
                  style={{
                    flex: '1 1 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: 6,
                    cursor: 'pointer',
                    borderRadius: 10,
                    background: '#fafafa',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: '#fff',
                      border: '1px solid #eee',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    <span>{c.emoji}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#333' }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* 搜索记录标题与清空 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 6px' }}>
              <div style={{ fontWeight: 600 }}>搜索记录</div>
              <Button size="small" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClearHistory(); }}>清空</Button>
            </div>

            {/* 历史列表（可为空） */}
            <div style={{ maxHeight: 180, overflow: 'auto' }}>
              {(searchHistory && searchHistory.length > 0) ? (
                (searchHistory || []).map((h) => (
                  <div
                    key={h.id}
                    onMouseDown={(e) => { e.preventDefault(); onHistoryClick(h); }}
                    style={{ padding: '8px 6px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontSize: 13 }}>{h.name}</div>
                      {h.address && <div style={{ fontSize: 12, color: '#888' }}>{h.address}</div>}
                    </div>
                    <Button
                      size="small"
                      danger
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onRemoveHistoryItem(h.id); }}
                      style={{ marginLeft: 8 }}
                    >
                      ×
                    </Button>
                  </div>
                ))
              ) : (
                <div style={{ padding: '8px 6px', color: '#888' }}>暂无搜索记录</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSearchBar;
