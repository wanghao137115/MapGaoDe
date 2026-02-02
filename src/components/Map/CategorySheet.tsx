import React from 'react';
import { Button, Select } from 'antd';
import type { CategoryKey, CategoryItem, DistrictKey, DistrictConfig } from '@/config/category.config';

type CategorySheetProps = {
  show: boolean;
  panelRef: React.RefObject<HTMLDivElement>;
  width: number;
  activeCategory: CategoryKey;
  categoryConfig: Record<CategoryKey, { label: string; emoji: string; keywords: string }>;
  districtConfig: DistrictConfig;
  activeDistrict: DistrictKey;
  setActiveDistrict: (district: DistrictKey) => void;
  activeStationTag: string | null;
  setActiveStationTag: (tag: string | null | ((prev: string | null) => string | null)) => void;
  districtPanelOpen: boolean;
  setDistrictPanelOpen: (open: boolean | ((v: boolean) => boolean)) => void;
  sortMode: 'recommend' | 'distance' | 'rating';
  setSortMode: (mode: 'recommend' | 'distance' | 'rating') => void;
  categoryItems: CategoryItem[];
  categoryLoading: boolean;
  categoryCollapsed: boolean;
  setCategoryCollapsed: (collapsed: boolean) => void;
  categoryDetailItem: CategoryItem | null;
  setCategoryDetailItem: (item: CategoryItem | null) => void;
  onItemClick: (item: CategoryItem) => void;
  onNavigateTo?: (item: CategoryItem) => void;
  onFetchCityTop20: (category: CategoryKey, district?: DistrictKey, stationTag?: string | null) => void;
  onApplySort: (items: CategoryItem[], mode: 'recommend' | 'distance' | 'rating') => CategoryItem[];
  onBuildMarkers: (items: CategoryItem[], category: CategoryKey) => any[];
  setMapCenter: (pos: { lng: number; lat: number }) => void;
  setZoom: (zoom: number) => void;
  setSearchMarkers: (markers: any[] | ((prev: any[]) => any[])) => void;
  suppressCollapseRef?: React.MutableRefObject<number>;
  onClose?: () => void;
};

const CategorySheet: React.FC<CategorySheetProps> = ({
  show,
  panelRef,
  width,
  activeCategory,
  categoryConfig,
  districtConfig,
  activeDistrict,
  setActiveDistrict,
  activeStationTag,
  setActiveStationTag,
  districtPanelOpen,
  setDistrictPanelOpen,
  sortMode,
  setSortMode,
  categoryItems,
  categoryLoading,
  categoryCollapsed,
  setCategoryCollapsed,
  categoryDetailItem,
  setCategoryDetailItem,
  onItemClick,
  onNavigateTo,
  onFetchCityTop20,
  onApplySort,
  onBuildMarkers,
  setMapCenter,
  setZoom,
  setSearchMarkers,
  suppressCollapseRef,
  onClose,
}) => {
  if (!show) return null;

  const handleDistrictClick = (district: DistrictKey) => {
    setActiveDistrict(district);
    setActiveStationTag(null);

    if (district === 'all') {
      // 传递新的区域参数，确保使用最新的区域信息
      onFetchCityTop20(activeCategory, district, null);
      return;
    }

    // 设置抑制时间窗口，防止程序性地图移动触发自动收起
    if (suppressCollapseRef) {
      suppressCollapseRef.current = Date.now() + 800;
    }
    
    const info = districtConfig[district as Exclude<DistrictKey, 'all'>];
    setMapCenter(info.center);
    setZoom(13);
    // 传递新的区域参数，确保使用最新的区域信息
    onFetchCityTop20(activeCategory, district, null);
  };

  const handleSortChange = (v: 'recommend' | 'distance' | 'rating') => {
    setSortMode(v);
    const sorted = onApplySort(categoryItems, v);
    setSearchMarkers(onBuildMarkers(sorted, activeCategory));
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setCategoryCollapsed(false);
      setDistrictPanelOpen(false);
      setCategoryDetailItem(null);
    }
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: 60,
        left: 0,
        width,
        background: '#fff',
        borderRadius: 6,
        boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
        zIndex: 1400,
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 收起态：提示条（hover 后展开） */}
      {categoryCollapsed && (
        <div
          style={{
            padding: '10px 12px',
            fontSize: 12,
            color: '#333',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
          onMouseEnter={() => setCategoryCollapsed(false)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setCategoryCollapsed(false)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{categoryConfig[activeCategory].label}</span>
            <span style={{ color: '#999' }}>
              {activeDistrict === 'all'
                ? '展开搜索结果'
                : `${districtConfig[activeDistrict as Exclude<DistrictKey, 'all'>].name}${activeStationTag ? ` · ${activeStationTag}` : ''} · 展开搜索结果`}
            </span>
          </div>
          <span style={{ color: '#1677ff', paddingRight: 50 }}>展开 ▾</span>
        </div>
      )}

      {/* 收起态：独立的关闭按钮 */}
      {categoryCollapsed && (
        <Button
          size="small"
          type="primary"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
          }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 50,
            height: 40,
            padding: 0,
            minWidth: 26,
            lineHeight: '26px',
            boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
          }}
        >
          ×
        </Button>
      )}

      {/* 展开态内容 */}
      {!categoryCollapsed && !categoryDetailItem && (
        <>
          {/* 顶部筛选条（相对定位：承载绝对定位的下滑块） */}
          <div style={{ position: 'relative', borderBottom: '1px solid #f0f0f0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 10px',
                fontSize: 12,
                color: '#333',
                background: '#fff',
              }}
            >
              {/* 全城筛选：点击展开区 + 地铁站分类 */}
              <div
                style={{
                  flex: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                onClick={() => {
                  setDistrictPanelOpen((v) => !v);
                }}
              >
                <span>
                  {activeDistrict === 'all'
                    ? '全城'
                    : districtConfig[activeDistrict as Exclude<DistrictKey, 'all'>].name}
                </span>
                <span>▾</span>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                {categoryConfig[activeCategory].label} ▾
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <Select
                  size="small"
                  value={sortMode}
                  onChange={handleSortChange}
                  options={[
                    { value: 'recommend', label: '推荐排序' },
                    { value: 'distance', label: '距离优先' },
                    { value: 'rating', label: '评分优先' },
                  ]}
                  style={{ width: 110 }}
                />
              </div>
            </div>

            {/* 绝对定位下滑块：左侧区 / 右侧地铁站 */}
            <div
              style={{
                position: 'absolute',
                top: 34,
                left: 0,
                right: 0,
                background: '#fff',
                borderBottom: '1px solid #f5f5f5',
                boxShadow: '0 10px 20px rgba(0,0,0,0.50)',
                maxHeight: districtPanelOpen ? 260 : 0,
                opacity: districtPanelOpen ? 1 : 0,
                transform: districtPanelOpen ? 'translateY(0)' : 'translateY(-6px)',
                transition: 'max-height 220ms ease, opacity 180ms ease, transform 180ms ease',
                pointerEvents: districtPanelOpen ? 'auto' : 'none',
                zIndex: 2,
              }}
            >
              <div style={{ display: 'flex', height: 260 }}>
                {/* 左侧：区域 */}
                <div
                  style={{
                    width: 120,
                    borderRight: '1px solid #f0f0f0',
                    overflow: 'auto',
                    padding: 6,
                    background: '#fafafa',
                  }}
                >
                  {([
                    { key: 'all' as DistrictKey, label: '附近' },
                    { key: 'futian' as DistrictKey, label: '福田区' },
                    { key: 'luohu' as DistrictKey, label: '罗湖区' },
                    { key: 'nanshan' as DistrictKey, label: '南山区' },
                    { key: 'baoan' as DistrictKey, label: '宝安区' },
                    { key: 'longgang' as DistrictKey, label: '龙岗区' },
                    { key: 'longhua' as DistrictKey, label: '龙华区' },
                  ]).map((d) => {
                    const active = activeDistrict === d.key;
                    return (
                      <div
                        key={d.key}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleDistrictClick(d.key)}
                        style={{
                          padding: '8px 8px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: active ? '#e6f4ff' : 'transparent',
                          color: active ? '#1677ff' : '#333',
                          fontSize: 12,
                        }}
                      >
                        {d.label}
                      </div>
                    );
                  })}
                </div>

                {/* 右侧：地铁站 */}
                <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
                  {activeDistrict === 'all' ? (
                    <div style={{ fontSize: 12, color: '#999', padding: '6px 0' }}>
                      选择左侧区域后可按地铁站筛选
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                      {districtConfig[activeDistrict as Exclude<DistrictKey, 'all'>].stations.map((s: string) => {
                        const active = activeStationTag === s;
                        return (
                          <div
                            key={s}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              const newTag = activeStationTag === s ? null : s;
                              setActiveStationTag(newTag);
                              // 传递新的地铁站标签参数，确保使用最新的标签信息
                              setTimeout(() => onFetchCityTop20(activeCategory, activeDistrict, newTag), 0);
                            }}
                            style={{
                              fontSize: 12,
                              padding: '6px 6px',
                              borderRadius: 6,
                              border: active ? '1px solid #52c41a' : '1px solid transparent',
                              background: active ? 'rgba(82,196,26,0.10)' : '#fff',
                              cursor: 'pointer',
                              color: '#333',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={s}
                          >
                            {s}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 列表 */}
          <div
            style={{
              overflow: 'auto',
              padding: '6px 10px 8px',
              paddingTop: districtPanelOpen ? 266 : 6,
            }}
          >
            {categoryLoading ? (
              <div style={{ padding: 8, fontSize: 13, color: '#666' }}>加载中...</div>
            ) : (
              categoryItems.map((it, idx) => (
                <div
                  key={it.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onItemClick(it);
                  }}
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding: '10px 0',
                    borderBottom: '1px solid #f5f5f5',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 18, color: '#666', fontSize: 12, marginTop: 2 }}>
                    {idx + 1}.
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#111',
                        marginBottom: 4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {it.name}
                    </div>

                    <div style={{ fontSize: 11, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#ff4d4f' }}>
                        {'★'.repeat(Math.max(1, Math.min(5, Math.round(it.rating))))}
                        <span style={{ color: '#ddd' }}>
                          {'★'.repeat(Math.max(0, 5 - Math.round(it.rating)))}
                        </span>
                      </span>
                      <span style={{ color: '#999' }}>人均: ¥{it.cost}</span>
                      {typeof it.distance === 'number' && (
                        <span style={{ color: '#999' }}>
                          {it.distance < 1000 ? `${it.distance}m` : `${(it.distance / 1000).toFixed(1)}km`}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}>
                      {it.address || '--'}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 8,
                      background: '#f5f5f5',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid #eee',
                    }}
                  >
                    <img
                      src={it.photoUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                </div>
              ))
            )}

            {!categoryLoading && categoryItems.length === 0 && (
              <div style={{ padding: 8, fontSize: 13, color: '#666' }}>暂无结果</div>
            )}
          </div>

          {/* 底部关闭行 */}
          <div style={{ padding: 6, borderTop: '1px solid #f0f0f0', textAlign: 'right' }}>
            <Button
              size="small"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClose}
            >
              关闭
            </Button>
          </div>
        </>
      )}

      {/* 详情态：替换列表，位置与弹窗一致 */}
      {categoryDetailItem && (
        <div style={{ position: 'relative', background: '#fff' }}>
          <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
            <img
              src={categoryDetailItem.photoUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <Button
              size="small"
              onClick={() => {
                setCategoryDetailItem(null);
                setSearchMarkers(
                  (prev: any[]) =>
                    (prev || []).map((m: any) => ({
                      ...m,
                      data: { ...(m.data || {}), labelText: undefined },
                    })),
                );
              }}
              style={{ position: 'absolute', top: 10, left: 10 }}
            >
              返回
            </Button>

            {onNavigateTo && (
              <Button
                type="primary"
                onClick={() => {
                  onNavigateTo(categoryDetailItem);
                  setCategoryDetailItem(null);
                  setCategoryCollapsed(false);
                }}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: 44,
                  width: 44,
                  borderRadius: 22,
                  padding: 0,
                  boxShadow: '0 10px 22px rgba(0,0,0,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  lineHeight: 1.1,
                }}
              >
                <div style={{ fontSize: 11 }}>到这去</div>
              </Button>
            )}
          </div>

          <div style={{ padding: '10px 12px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
              {categoryDetailItem.name}
            </div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
              {categoryDetailItem.address || '--'}
            </div>
            {categoryDetailItem.tel && (
              <div style={{ fontSize: 12, color: '#666' }}>{categoryDetailItem.tel}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CategorySheet);
