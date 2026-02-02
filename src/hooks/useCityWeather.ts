import { useState, useEffect, useCallback, useMemo } from 'react';
import { ALL_CITIES, searchCities, type CityData } from '@/data/cities';

const HOT_CITY_NAMES = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '武汉', '西安'];

const PROVINCE_CODE_MAP: Record<string, string> = {
  '11': '北京', '12': '天津', '13': '河北', '14': '山西', '15': '内蒙古',
  '21': '辽宁', '22': '吉林', '23': '黑龙江',
  '31': '上海', '32': '江苏', '33': '浙江', '34': '安徽', '35': '福建', '36': '江西', '37': '山东',
  '41': '河南', '42': '湖北', '43': '湖南', '44': '广东', '45': '广西', '46': '海南',
  '50': '重庆', '51': '四川', '52': '贵州', '53': '云南', '54': '西藏',
  '61': '陕西', '62': '甘肃', '63': '青海', '64': '宁夏', '65': '新疆',
};

type ProvinceGroup = {
  code: string;
  name: string;
  cities: CityData[];
};

export const useCityWeather = (initialCity: string = '深圳') => {
  const [currentCity, setCurrentCity] = useState<string>(initialCity);
  const [currentCityAdcode, setCurrentCityAdcode] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherInfo, setWeatherInfo] = useState<any | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [activeLetter, setActiveLetter] = useState<string>('S');

  // 天气图标映射
  const getWeatherIcon = useCallback((desc?: string) => {
    if (!desc) return '☀️';
    if (desc.includes('晴')) return '☀️';
    if (desc.includes('多云') || desc.includes('阴')) return '⛅';
    if (desc.includes('雨')) return '🌧️';
    if (desc.includes('雪')) return '❄️';
    if (desc.includes('雾') || desc.includes('霾')) return '🌫️';
    return '☀️';
  }, []);

  // 根据 adcode 请求天气信息
  const fetchWeatherForAdcode = useCallback(async (adcode: string | null) => {
    if (!adcode) return;
    const key = import.meta.env.VITE_AMAP_KEY || '49bfb83db90187047c48ccc2e711ea32';
    setWeatherLoading(true);
    try {
      const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${adcode}&extensions=base`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.lives && data.lives.length > 0) {
        setWeatherInfo(data.lives[0]);
      } else {
        setWeatherInfo(null);
        console.warn('天气接口未返回数据', data);
      }
    } catch (e) {
      console.warn('获取天气失败', e);
      setWeatherInfo(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // 初始化当前城市的 adcode
  useEffect(() => {
    if (currentCityAdcode) return;
    const found = ALL_CITIES.find(
      (c) =>
        c.name === currentCity ||
        c.name.replace(/市$/, '') === currentCity ||
        currentCity.includes(c.name.replace(/市$/, '')),
    );
    if (found) {
      setCurrentCityAdcode(found.adcode);
    }
  }, [currentCity, currentCityAdcode]);

  // 当用户选择新的城市 adcode 时，加载天气
  useEffect(() => {
    if (currentCityAdcode) {
      fetchWeatherForAdcode(currentCityAdcode);
    }
  }, [currentCityAdcode, fetchWeatherForAdcode]);

  // 城市搜索结果
  const citySearchResults = useMemo(() => {
    const q = citySearchQuery.trim();
    if (!q) return [];
    return searchCities(q);
  }, [citySearchQuery]);

  // 热门城市列表
  const hotCities = useMemo(
    () =>
      HOT_CITY_NAMES.map((name) =>
        ALL_CITIES.find(
          (c) =>
            c.name === name ||
            c.name.replace(/市$/, '') === name ||
            name.includes(c.name.replace(/市$/, '')),
        ),
      ).filter(Boolean) as CityData[],
    [],
  );

  // 省份分组
  const provinceGroups = useMemo<ProvinceGroup[]>(() => {
    const groups: ProvinceGroup[] = [];
    Object.entries(PROVINCE_CODE_MAP).forEach(([code, name]) => {
      const cities = ALL_CITIES.filter((c) => c.adcode.startsWith(code));
      if (cities.length > 0) {
        groups.push({ code, name, cities });
      }
    });
    return groups;
  }, []);

  return {
    currentCity,
    setCurrentCity,
    currentCityAdcode,
    setCurrentCityAdcode,
    weatherLoading,
    weatherInfo,
    getWeatherIcon,
    citySearchQuery,
    setCitySearchQuery,
    citySearchResults,
    activeLetter,
    setActiveLetter,
    hotCities,
    provinceGroups,
    fetchWeatherForAdcode,
  };
};
