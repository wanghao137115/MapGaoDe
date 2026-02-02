/**
 * 分类搜索配置常量
 */

// 分类键类型
export type CategoryKey = 'food' | 'hotel' | 'poi' | 'neigh';

// 分类项类型
export type CategoryItem = {
  id: string;
  name: string;
  address?: string;
  tel?: string;
  location: { lng: number; lat: number };
  distance?: number;
  photoUrl: string;
  rating: number; // 1.0 - 5.0 (mock)
  cost: number; // per person (mock)
};

// 区域键类型
export type DistrictKey = 'all' | 'futian' | 'nanshan' | 'luohu' | 'baoan' | 'longgang' | 'longhua';

// 分类配置
export const CATEGORY_CONFIG: Record<CategoryKey, { label: string; emoji: string; keywords: string }> = {
  food: { label: '美食', emoji: '🍽️', keywords: '美食' },
  hotel: { label: '酒店', emoji: '🏨', keywords: '酒店' },
  poi: { label: '景点', emoji: '🏛️', keywords: '景点' },
  neigh: { label: '小区', emoji: '🏘️', keywords: '小区' },
};

// 区域配置类型
export type DistrictConfig = Record<
  Exclude<DistrictKey, 'all'>,
  { name: string; center: { lng: number; lat: number }; stations: string[] }
>;

// 区域配置
export const DISTRICT_CONFIG: DistrictConfig = {
  futian: {
    name: '福田区',
    center: { lng: 114.055, lat: 22.541 },
    stations: ['会展中心', '购物公园', '车公庙', '岗厦北'],
  },
  nanshan: {
    name: '南山区',
    center: { lng: 113.936, lat: 22.540 },
    stations: ['科技园', '深大', '后海', '高新园'],
  },
  luohu: {
    name: '罗湖区',
    center: { lng: 114.131, lat: 22.548 },
    stations: ['罗湖', '老街', '大剧院', '国贸'],
  },
  baoan: {
    name: '宝安区',
    center: { lng: 113.883, lat: 22.553 },
    stations: ['宝安中心', '西乡', '翻身', '宝体'],
  },
  longgang: {
    name: '龙岗区',
    center: { lng: 114.246, lat: 22.721 },
    stations: ['龙城广场', '南联', '吉祥', '双龙'],
  },
  longhua: {
    name: '龙华区',
    center: { lng: 114.044, lat: 22.696 },
    stations: ['深圳北站', '红山', '龙华', '清湖'],
  },
};

// 其他常量
export const CATEGORY_IMAGE_URL =
  'https://img.alicdn.com/i3/2207474112147/O1CN01ljnJS31RjNO9kIk0d_!!2207474112147-0-koubei.jpg?operate=merge&w=160&h=150&position=5';

export const DEFAULT_AMAP_SERVICE_KEY = '49bfb83db90187047c48ccc2e711ea32';

export const SEARCH_PANEL_WIDTH = 500;
