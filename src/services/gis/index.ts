/**
 * GIS 空间分析服务
 * 基于 Turf.js 实现地理空间分析能力
 * 支持：缓冲区分析、距离测量、面积计算、空间查询、GeoJSON处理
 */

import * as turf from '@turf/turf';
import type { MapPosition } from '@/types';

// 类型定义
export interface BufferAnalysisResult {
  polygon: GeoJSON.Feature<GeoJSON.Polygon>;
  area: number; // 平方米
  perimeter: number; // 米
}

export interface DistanceResult {
  distance: number; // 米
  distanceKm: number; // 公里
}

export interface AreaResult {
  area: number; // 平方米
  areaKm2: number; // 平方公里
  areaHectare: number; // 公顷
}

export interface CentroidResult {
  position: MapPosition;
  isInside: boolean;
}

export interface SpatialQueryResult {
  isInside: boolean;
  nearestFeature?: GeoJSON.Feature;
  distanceToNearest?: number;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSON.Feature[];
}

/**
 * 将 MapPosition 数组转换为 GeoJSON 坐标数组
 */
export const positionsToCoords = (positions: MapPosition[]): number[][] => {
  return positions.map((p) => [p.lng, p.lat]);
};

/**
 * 将 GeoJSON 坐标数组转换为 MapPosition
 */
export const coordsToPosition = (coord: number[]): MapPosition => {
  return { lng: coord[0], lat: coord[1] };
};

/**
 * 创建点要素
 */
export const createPoint = (position: MapPosition): GeoJSON.Feature<GeoJSON.Point> => {
  return turf.point([position.lng, position.lat]);
};

/**
 * 创建多边形要素
 */
export const createPolygon = (positions: MapPosition[]): GeoJSON.Feature<GeoJSON.Polygon> => {
  const coords = positionsToCoords(positions);
  // 闭合多边形（首尾相连）
  if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
    coords.push([...coords[0]]);
  }
  return turf.polygon([coords]);
};

/**
 * 创建线要素
 */
export const createLineString = (positions: MapPosition[]): GeoJSON.Feature<GeoJSON.LineString> => {
  return turf.lineString(positionsToCoords(positions));
};

/**
 * 缓冲区分析
 * @param center 中心点
 * @param radiusKm 半径（公里）
 * @returns 缓冲区多边形及其属性
 */
export const createBuffer = (
  center: MapPosition,
  radiusKm: number
): BufferAnalysisResult => {
  const point = createPoint(center);
  const buffered = turf.buffer(point, radiusKm, { units: 'kilometers' });

  if (!buffered || buffered.geometry.type !== 'Polygon') {
    throw new Error('缓冲区生成失败');
  }

  const area = turf.area(buffered);
  const perimeter = turf.length(turf.polygonToLine(buffered), { units: 'meters' });

  return {
    polygon: buffered as GeoJSON.Feature<GeoJSON.Polygon>,
    area,
    perimeter,
  };
};

/**
 * 计算两点间距离
 * @param from 起点
 * @param to 终点
 * @returns 距离信息
 */
export const calculateDistance = (
  from: MapPosition,
  to: MapPosition
): DistanceResult => {
  const fromPoint = createPoint(from);
  const toPoint = createPoint(to);
  const distance = turf.distance(fromPoint, toPoint, { units: 'meters' });

  return {
    distance,
    distanceKm: distance / 1000,
  };
};

/**
 * 计算多边形面积
 * @param positions 多边形顶点
 * @returns 面积信息
 */
export const calculateArea = (positions: MapPosition[]): AreaResult => {
  if (positions.length < 3) {
    throw new Error('多边形至少需要3个顶点');
  }

  const polygon = createPolygon(positions);
  const area = turf.area(polygon);

  return {
    area,
    areaKm2: area / 1000000,
    areaHectare: area / 10000,
  };
};

/**
 * 计算多边形周长
 * @param positions 多边形顶点
 * @returns 周长（米）
 */
export const calculatePerimeter = (positions: MapPosition[]): number => {
  if (positions.length < 3) {
    throw new Error('多边形至少需要3个顶点');
  }

  const polygon = createPolygon(positions);
  const line = turf.polygonToLine(polygon);

  return turf.length(line, { units: 'meters' });
};

/**
 * 计算几何中心（质心）
 * @param positions 多边形顶点
 * @returns 质心位置
 */
export const calculateCentroid = (positions: MapPosition[]): CentroidResult => {
  if (positions.length < 3) {
    throw new Error('多边形至少需要3个顶点');
  }

  const polygon = createPolygon(positions);
  const centroid = turf.centroid(polygon);
  const [lng, lat] = centroid.geometry.coordinates;

  // 判断质心是否在多边形内
  const isInside = turf.booleanPointInPolygon(
    turf.point([lng, lat]),
    polygon
  );

  return {
    position: { lng, lat },
    isInside,
  };
};

/**
 * 点是否在多边形内
 * @param point 待判断点
 * @param polygonPoints 多边形顶点
 * @returns 是否在多边形内
 */
export const isPointInPolygon = (
  point: MapPosition,
  polygonPoints: MapPosition[]
): boolean => {
  if (polygonPoints.length < 3) {
    return false;
  }

  const polygon = createPolygon(polygonPoints);
  const pt = createPoint(point);

  return turf.booleanPointInPolygon(pt, polygon);
};

/**
 * 点是否在圆内（基于缓冲区）
 * @param point 待判断点
 * @param center 圆心
 * @param radiusKm 半径（公里）
 * @returns 是否在圆内
 */
export const isPointInCircle = (
  point: MapPosition,
  center: MapPosition,
  radiusKm: number
): boolean => {
  const buffer = createBuffer(center, radiusKm);
  const pt = createPoint(point);

  return turf.booleanPointInPolygon(pt, buffer.polygon);
};

/**
 * 计算点到线/路径的最短距离
 * @param point 点
 * @param linePoints 线上的点数组
 * @returns 最短距离（米）
 */
export const distanceToLine = (
  point: MapPosition,
  linePoints: MapPosition[]
): number => {
  if (linePoints.length < 2) {
    return 0;
  }

  const pt = createPoint(point);
  const line = createLineString(linePoints);

  return turf.pointToLineDistance(pt, line, { units: 'meters' });
};

/**
 * 找到最近的点
 * @param point 参考点
 * @param targets 目标点数组
 * @returns 最近的点和距离
 */
export const findNearest = (
  point: MapPosition,
  targets: MapPosition[]
): { target: MapPosition; distance: number } | null => {
  if (targets.length === 0) return null;

  const pt = createPoint(point);
  const targetPoints = targets.map((t) => createPoint(t));

  let nearestPoint: MapPosition = targets[0];
  let minDistance = Infinity;

  for (const target of targetPoints) {
    const distance = turf.distance(pt, target, { units: 'meters' });
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = coordsToPosition(target.geometry.coordinates);
    }
  }

  return { target: nearestPoint, distance: minDistance };
};

/**
 * 找到线上的最近点
 * @param point 参考点
 * @param linePoints 线上的点数组
 * @returns 最近点和距离
 */
export const findNearestOnLine = (
  point: MapPosition,
  linePoints: MapPosition[]
): { position: MapPosition; distance: number } => {
  if (linePoints.length < 2) {
    return { position: point, distance: 0 };
  }

  const pt = createPoint(point);
  const line = createLineString(linePoints);
  const nearestPoint = turf.nearestPointOnLine(line, pt);

  const [lng, lat] = nearestPoint.geometry.coordinates;
  const distance = turf.distance(pt, nearestPoint, { units: 'meters' });

  return {
    position: { lng, lat },
    distance,
  };
};

/**
 * 获取边界框
 * @param positions 点数组
 * @returns 边界框 [minLng, minLat, maxLng, maxLat]
 */
export const getBoundingBox = (
  positions: MapPosition[]
): [number, number, number, number] => {
  if (positions.length === 0) {
    return [0, 0, 0, 0];
  }

  const points = positions.map((p) => createPoint(p));
  const fc = turf.featureCollection(points);

  return turf.bbox(fc) as [number, number, number, number];
};

/**
 * 生成随机点（用于测试）
 * @param center 中心点
 * @param radiusKm 半径（公里）
 * @param count 数量
 * @returns 随机点数组
 */
export const generateRandomPoints = (
  center: MapPosition,
  radiusKm: number,
  count: number
): MapPosition[] => {
  const points: MapPosition[] = [];
  const centerPoint = turf.point([center.lng, center.lat]);

  for (let i = 0; i < count; i++) {
    const randomPoint = turf.randomPoint(1, {
      bbox: (turf.buffer(centerPoint, radiusKm, { units: 'kilometers' }) as any)
        ?.geometry?.coordinates?.[0] || [-0.1, -0.1, 0.1, 0.1],
    });

    const [lng, lat] = randomPoint.features[0].geometry.coordinates;
    points.push({ lng, lat });
  }

  return points;
};

/**
 * 生成圆形区域的点（用于绘制）
 * @param center 圆心
 * @param radiusKm 半径（公里）
 * @param pointsCount 点数量
 * @returns 圆周上的点数组
 */
export const generateCirclePoints = (
  center: MapPosition,
  radiusKm: number,
  pointsCount: number = 64
): MapPosition[] => {
  const circle = turf.circle([center.lng, center.lat], radiusKm, {
    units: 'kilometers',
    steps: pointsCount,
  });

  const coordinates = circle.geometry.coordinates[0];
  return coordinates.map((coord: number[]) => ({
    lng: coord[0],
    lat: coord[1],
  }));
};

/**
 * 测量工具：测量点到点的距离
 */
export const measureDistanceTool = (
  points: MapPosition[]
): { totalDistance: number; segmentDistances: number[] } => {
  if (points.length < 2) {
    return { totalDistance: 0, segmentDistances: [] };
  }

  const segmentDistances: number[] = [];
  let totalDistance = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dist = calculateDistance(points[i], points[i + 1]);
    segmentDistances.push(dist.distance);
    totalDistance += dist.distance;
  }

  return { totalDistance, segmentDistances };
};

/**
 * 测量工具：测量面积
 */
export const measureAreaTool = (positions: MapPosition[]): AreaResult => {
  return calculateArea(positions);
};

/**
 * 批量空间查询：筛选在多边形内的点
 */
export const filterPointsInPolygon = (
  points: MapPosition[],
  polygonPoints: MapPosition[]
): MapPosition[] => {
  return points.filter((point) => isPointInPolygon(point, polygonPoints));
};

/**
 * 批量空间查询：筛选在圆内的点
 */
export const filterPointsInCircle = (
  points: MapPosition[],
  center: MapPosition,
  radiusKm: number
): MapPosition[] => {
  return points.filter((point) => isPointInCircle(point, center, radiusKm));
};

/**
 * GeoJSON 导出
 */
export const exportToGeoJSON = (
  positions: MapPosition[],
  type: 'Point' | 'Polygon' | 'LineString'
): string => {
  let feature: GeoJSON.Feature;

  switch (type) {
    case 'Point':
      feature = createPoint(positions[0]);
      break;
    case 'Polygon':
      feature = createPolygon(positions);
      break;
    case 'LineString':
      feature = createLineString(positions);
      break;
    default:
      throw new Error('不支持的类型');
  }

  return JSON.stringify(feature, null, 2);
};

/**
 * 格式化和转换距离
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters.toFixed(2)} 米`;
  } else {
    return `${(meters / 1000).toFixed(2)} 公里`;
  }
};

/**
 * 格式化和转换面积
 */
export const formatArea = (squareMeters: number): string => {
  if (squareMeters < 10000) {
    return `${squareMeters.toFixed(2)} 平方米`;
  } else if (squareMeters < 1000000) {
    return `${(squareMeters / 10000).toFixed(2)} 公顷`;
  } else {
    return `${(squareMeters / 1000000).toFixed(2)} 平方公里`;
  }
};
