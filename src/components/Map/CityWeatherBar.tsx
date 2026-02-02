import React, { useState } from 'react';
import { Button, Popover, Input } from 'antd';
import { CITIES_BY_LETTER, LETTERS, type CityData } from '@/data/cities';
import type { useCityWeather } from '@/hooks/useCityWeather';

type CityWeatherBarProps = {
  currentCity: string;
  weatherInfo: any;
  weatherLoading: boolean;
  getWeatherIcon: (desc?: string) => string;
  hotCities: CityData[];
  provinceGroups: Array<{ code: string; name: string; cities: CityData[] }>;
  citySearchQuery: string;
  setCitySearchQuery: (query: string) => void;
  citySearchResults: CityData[];
  activeLetter: string;
  setActiveLetter: (letter: string) => void;
  cityTab: 'city' | 'province';
  setCityTab: (tab: 'city' | 'province') => void;
  showCityDropdown: boolean;
  setShowCityDropdown: (show: boolean) => void;
  onCitySelect: (city: CityData) => void;
};

const CityWeatherBar: React.FC<CityWeatherBarProps> = ({
  currentCity,
  weatherInfo,
  weatherLoading,
  getWeatherIcon,
  hotCities,
  provinceGroups,
  citySearchQuery,
  setCitySearchQuery,
  citySearchResults,
  activeLetter,
  setActiveLetter,
  cityTab,
  setCityTab,
  showCityDropdown,
  setShowCityDropdown,
  onCitySelect,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Popover
        open={showCityDropdown}
        onOpenChange={setShowCityDropdown}
        trigger="click"
        placement="bottomLeft"
        arrow={false}
        overlayStyle={{ zIndex: 3000 }}
        align={{ offset: [0, 20] }}
        getPopupContainer={() => document.body}
        content={
          <div style={{ width: 560, padding: 12 }}>
            {/* 当前城市与热门城市 */}
            <div style={{ marginBottom: 8, fontSize: 13 }}>
              当前城市：
              <span style={{ color: '#1890ff', fontWeight: 600 }}>
                {currentCity}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#999' }}>热门城市：</span>
              {hotCities.map((city) => (
                <Button
                  key={`${city.adcode}-${city.name}`}
                  size="small"
                  type={
                    city.name.replace(/市$/, '') === currentCity ? 'primary' : 'default'
                  }
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onCitySelect(city);
                  }}
                >
                  {city.name.replace(/市$/, '')}
                </Button>
              ))}
            </div>

            {/* 顶部标签 + 搜索框 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="small"
                  type={cityTab === 'city' ? 'primary' : 'default'}
                  onClick={() => setCityTab('city')}
                >
                  按城市
                </Button>
                <Button
                  size="small"
                  type={cityTab === 'province' ? 'primary' : 'default'}
                  onClick={() => setCityTab('province')}
                >
                  按省份
                </Button>
              </div>
              <div style={{ width: 240 }}>
                <Input.Search
                  placeholder="输入城市名/拼音"
                  allowClear
                  size="small"
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  onSearch={(v) => setCitySearchQuery(v)}
                />
              </div>
            </div>

            {/* 列表区域 */}
            <div style={{ maxHeight: '60vh', overflow: 'auto', fontSize: 13 }}>
              {cityTab === 'city' ? (
                <>
                  {/* 字母索引 */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      padding: '4px 0',
                      borderTop: '1px solid #f0f0f0',
                      borderBottom: '1px solid #f0f0f0',
                      marginBottom: 8,
                    }}
                  >
                    {LETTERS.map((letter) => (
                      <Button
                        key={letter}
                        size="small"
                        type={activeLetter === letter ? 'primary' : 'text'}
                        style={{ padding: '0 6px', height: 22, lineHeight: '20px' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setActiveLetter(letter);
                          const section = document.getElementById(
                            `city-section-${letter}`,
                          );
                          if (section) {
                            section.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                          }
                        }}
                      >
                        {letter}
                      </Button>
                    ))}
                  </div>

                  {/* 城市列表（按字母） */}
                  {citySearchQuery.trim() ? (
                    citySearchResults.length > 0 ? (
                      citySearchResults.map((city) => (
                        <div
                          key={`${city.adcode}-${city.name}`}
                          style={{
                            padding: '6px 4px',
                            borderBottom: '1px solid #f5f5f5',
                            cursor: 'pointer',
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onCitySelect(city);
                          }}
                        >
                          <span style={{ marginRight: 8 }}>{city.name}</span>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {city.pinyin}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 8, color: '#999' }}>未找到匹配的城市</div>
                    )
                  ) : (
                    LETTERS.map((letter) => {
                      const list = CITIES_BY_LETTER[letter] || [];
                      if (!list.length) return null;
                      return (
                        <div
                          key={letter}
                          id={`city-section-${letter}`}
                          style={{
                            padding: '6px 0',
                            background:
                              letter === activeLetter
                                ? 'rgba(24,144,255,0.03)'
                                : 'transparent',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              marginBottom: 4,
                              color: '#1890ff',
                            }}
                          >
                            {letter}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 8,
                              paddingLeft: 4,
                            }}
                          >
                            {list.map((city, idx) => (
                              <span
                                key={`${city.adcode}-${city.name}-${idx}`}
                                style={{
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  padding: '2px 4px',
                                  borderRadius: 4,
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  onCitySelect(city);
                                }}
                              >
                                {city.name.replace(/市$/, '')}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              ) : (
                /* 按省份 */
                <>
                  {provinceGroups.map((pg) => (
                    <div
                      key={pg.code}
                      style={{
                        padding: '6px 0',
                        borderBottom: '1px solid #f5f5f5',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 4,
                          color: '#1890ff',
                        }}
                      >
                        {pg.name}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          paddingLeft: 4,
                        }}
                      >
                        {pg.cities.map((city, idx) => (
                          <span
                            key={`${pg.code}-${city.adcode}-${idx}`}
                            className="city-item"
                            style={{
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              padding: '2px 4px',
                              borderRadius: 4,
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onCitySelect(city);
                            }}
                          >
                            {city.name.replace(/市$/, '')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        }
      >
        <Button size="small">
          <span style={{ color: '#1890ff' }}>{currentCity}</span> ▾
        </Button>
      </Popover>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6, background: '#fff' }}>
        <div style={{ fontSize: 18 }}>{getWeatherIcon(weatherInfo?.weather)}</div>
        <div style={{ fontSize: 12, color: '#333' }}>
          <div style={{ fontWeight: 600 }}>
            {weatherInfo ? `${weatherInfo.temperature}°C` : (weatherLoading ? '加载中' : '--')}
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>{weatherInfo ? `${weatherInfo.weather}` : ''}</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CityWeatherBar);
