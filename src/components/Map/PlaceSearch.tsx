// 地点搜索组件
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input, List, Spin, message, Space, Typography } from 'antd';
import { SearchOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { MapPosition } from '@/types';
import { globalUsageStats } from '@/hooks/useUsageStats';

const { Text } = Typography;

// 搜索结果接口
interface PlaceResult {
  id: string;
  name: string;
  address: string;
  location: MapPosition;
  tel?: string;
  tag?: string;
  type?: string;
}

interface PlaceSearchProps {
  /** 搜索框占位符 */
  placeholder?: string;
  /** 城市限制 */
  city?: string;
  /** 选择地点回调 */
  onPlaceSelect?: (place: PlaceResult) => void;
  /** 确认地点回调（回车确定） */
  onPlaceConfirm?: (place: PlaceResult) => void;
  /** 受控输入值（可选），若提供组件将表现为受控组件 */
  value?: string;
  /** 当输入值变化时回调（可选） */
  onValueChange?: (value: string) => void;
  /** 是否抑制组件内部渲染下拉（父组件将接管结果渲染） */
  suppressDropdown?: boolean;
  /** 当搜索结果或可见性变化时回调 */
  onResultsChange?: (results: PlaceResult[], visible: boolean) => void;
  /** 样式 */
  style?: React.CSSProperties;
}

const PlaceSearch: React.FC<PlaceSearchProps> = ({
  placeholder = "搜索地点...",
  city,
  onPlaceSelect,
  onPlaceConfirm,
  value,
  onValueChange,
  suppressDropdown = false,
  onResultsChange,
  style = {}
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null); // 当前选中的地点
  const searchTimeoutRef = useRef<number>();
  const inputRef = useRef<any>(null);

  // 搜索地点
  const searchPlaces = useCallback(async (keywords: string) => {
    if (!keywords.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const startTime = performance.now(); // 开始计时
    setLoading(true);
    try {
      const params = new URLSearchParams({
        key: import.meta.env.VITE_AMAP_SERVICE_KEY || '49bfb83db90187047c48ccc2e711ea32',
        keywords: keywords.trim(),
        offset: '10', // 返回结果数量
        page: '1',
        extensions: 'all'
      });

      if (city) {
        params.append('city', city);
      }

      const response = await fetch(`https://restapi.amap.com/v3/place/text?${params}`);
      const data = await response.json();

      // 记录搜索耗时
      const responseTime = Math.round(performance.now() - startTime);
      globalUsageStats.recordSearch(responseTime, false);

      if (data.status === '1' && data.pois && Array.isArray(data.pois)) {
        const results: PlaceResult[] = data.pois.map((poi: any) => ({
          id: poi.id,
          name: poi.name,
          address: poi.address || poi.cityname + poi.adname,
          location: {
            lng: parseFloat(poi.location.split(',')[0]),
            lat: parseFloat(poi.location.split(',')[1])
          },
          tel: poi.tel,
          tag: poi.tag,
          type: poi.type
        }));

        setSearchResults(results);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
        if (data.info !== 'OK') {
          message.warning(`搜索失败: ${data.info}`);
        }
      }
    } catch (error) {
      console.error('地点搜索失败:', error);
      message.error('搜索失败，请稍后重试');
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  }, [city]);

  // 防抖搜索
  const debouncedSearch = useCallback((keywords: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(keywords);
    }, 500); // 500ms 防抖
  }, [searchPlaces]);

  // 通知父组件结果变化（用于外部渲染结果到其他位置）
  useEffect(() => {
    try {
      // @ts-ignore
      onResultsChange?.(searchResults, showResults);
    } catch (e) {
      // ignore
    }
  }, [searchResults, showResults, onResultsChange]);

  // 输入变化处理
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (typeof onValueChange === 'function') {
      onValueChange(v);
    } else {
      setSearchText(v);
    }
    debouncedSearch(v);
  }, [debouncedSearch, onValueChange]);

  // 选择地点
  const handlePlaceSelect = useCallback((place: PlaceResult) => {
    setSelectedPlace(place);
    if (typeof onValueChange === 'function') {
      onValueChange(place.name);
    } else {
      setSearchText(place.name);
    }
    // 不关闭结果列表，让用户可以确认
    onPlaceSelect?.(place);
  }, [onPlaceSelect]);


  // 确认地点（回车或确定）
  const handlePlaceConfirm = useCallback(() => {
    console.log('PlaceSearch: handlePlaceConfirm called, selectedPlace:', selectedPlace);
    if (selectedPlace) {
      console.log('PlaceSearch: confirming place:', selectedPlace.name);
      setShowResults(false);
      onPlaceConfirm?.(selectedPlace);
      // 失去焦点
      inputRef.current?.blur();
    } else {
      console.log('PlaceSearch: no place selected');
    }
  }, [selectedPlace, onPlaceConfirm]);

  // 点击外部关闭结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 如果点击的是搜索结果项，不要关闭列表
      if (target.closest('.place-search-item')) {
        return;
      }

      if (inputRef.current && !inputRef.current.input?.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const inputValue = value !== undefined ? value : searchText;

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => (inputValue && setShowResults(true))}
        prefix={<SearchOutlined />}
        suffix={loading ? <Spin size="small" /> : null}
        style={{ width: '100%' }}
        allowClear
        onPressEnter={handlePlaceConfirm}
      />

      {/* 搜索结果列表（默认由组件渲染；当 suppressDropdown=true 时由父组件渲染到其他位置） */}
      {!suppressDropdown && showResults && searchResults.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '300px',
            overflow: 'auto'
          }}
        >
          <List
            size="small"
            dataSource={searchResults}
            renderItem={(place) => (
                <div
                  key={place.id}
                  className="place-search-item"
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: 'white'
                  }}
                  onClick={() => handlePlaceSelect(place)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <EnvironmentOutlined style={{ color: '#1890ff' }} />
                    <Text strong style={{ fontSize: '14px' }}>
                      {place.name}
                    </Text>
                    {place.tag && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {place.tag}
                      </Text>
                    )}
                  </Space>

                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    {place.address}
                  </Text>

                  {place.tel && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      📞 {place.tel}
                    </Text>
                  )}
                </Space>
                </div>
            )}
          />
        </div>
      )}

      {/* 无搜索结果提示 */}
      {!suppressDropdown && showResults && searchText && !loading && searchResults.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '12px 16px',
            zIndex: 1000,
            textAlign: 'center'
          }}
        >
          <Text type="secondary">未找到相关地点</Text>
        </div>
      )}
    </div>
  );
};

export default PlaceSearch;
