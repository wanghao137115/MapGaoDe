/**
 * 空间分析工具组件
 * 提供缓冲区分析、距离测量、面积测量、空间查询等 WebGIS 功能
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Card,
  Button,
  Space,
  Slider,
  InputNumber,
  Select,
  Divider,
  Typography,
  Table,
  Tag,
  Popover,
  Statistic,
  Row,
  Col,
  message,
} from 'antd';
import {
  AimOutlined,
  EnvironmentOutlined,
  RadiusUpleftOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  ClearOutlined,
  SearchOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import type { MapPosition } from '@/types';
import {
  calculateDistance,
  calculateArea,
  calculatePerimeter,
  calculateCentroid,
  isPointInPolygon,
  isPointInCircle,
  createBuffer,
  formatDistance,
  formatArea,
  generateCirclePoints,
  filterPointsInPolygon,
  filterPointsInCircle,
} from '@/services/gis';

const { Text, Paragraph } = Typography;

export type AnalysisMode = 'none' | 'buffer' | 'distance' | 'area' | 'spatialQuery';

export interface SpatialAnalysisProps {
  map: AMap.Map | null;
  markers?: MapPosition[];
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onOverlayAdd?: (overlay: any) => void;
  onOverlayRemove?: () => void;
}

export interface AnalysisResult {
  type: AnalysisMode;
  data: any;
  timestamp: Date;
}

// 分析工具类型
const TOOLS = [
  {
    key: 'buffer' as AnalysisMode,
    icon: <RadiusUpleftOutlined />,
    name: '缓冲区分析',
    description: '以点为中心生成指定半径的圆形服务区域',
  },
  {
    key: 'distance' as AnalysisMode,
    icon: <LineChartOutlined />,
    name: '距离测量',
    description: '测量两点或多点之间的总距离',
  },
  {
    key: 'area' as AnalysisMode,
    icon: <AreaChartOutlined />,
    name: '面积测量',
    description: '测量任意多边形的面积和周长',
  },
  {
    key: 'spatialQuery' as AnalysisMode,
    icon: <SearchOutlined />,
    name: '空间查询',
    description: '判断点是否在指定区域内',
  },
];

const SpatialAnalysis: React.FC<SpatialAnalysisProps> = ({
  map,
  markers = [],
  onAnalysisComplete,
  onOverlayAdd,
  onOverlayRemove,
}) => {
  // 状态
  const [activeTool, setActiveTool] = useState<AnalysisMode>('none');
  const [bufferRadius, setBufferRadius] = useState<number>(3); // 公里
  const [bufferCenter, setBufferCenter] = useState<MapPosition | null>(null);
  const [bufferResult, setBufferResult] = useState<any>(null);
  const [distancePoints, setDistancePoints] = useState<MapPosition[]>([]);
  const [areaPoints, setAreaPoints] = useState<MapPosition[]>([]);
  const [queryPoint, setQueryPoint] = useState<MapPosition | null>(null);
  const [queryRegion, setQueryRegion] = useState<MapPosition[]>([]);
  const [queryResult, setQueryResult] = useState<boolean | null>(null);
  const [overlayRef, setOverlayRef] = useState<any>(null);

  // 覆盖物引用
  const bufferOverlayRef = useRef<AMap.Circle | null>(null);
  const polygonOverlayRef = useRef<AMap.Polygon | null>(null);
  const polylineOverlayRef = useRef<AMap.Polyline | null>(null);
  const queryOverlayRef = useRef<AMap.Marker | null>(null);
  const markerOverlaysRef = useRef<AMap.Marker[]>([]);

  // 清除所有覆盖物
  const clearOverlays = useCallback(() => {
    if (!map) return;

    if (bufferOverlayRef.current) {
      map.remove(bufferOverlayRef.current);
      bufferOverlayRef.current = null;
    }

    if (polygonOverlayRef.current) {
      map.remove(polygonOverlayRef.current);
      polygonOverlayRef.current = null;
    }

    if (polylineOverlayRef.current) {
      map.remove(polylineOverlayRef.current);
      polylineOverlayRef.current = null;
    }

    if (queryOverlayRef.current) {
      map.remove(queryOverlayRef.current);
      queryOverlayRef.current = null;
    }

    markerOverlaysRef.current.forEach((m) => map.remove(m));
    markerOverlaysRef.current = [];

    setBufferResult(null);
    setDistancePoints([]);
    setAreaPoints([]);
    setQueryPoint(null);
    setQueryRegion([]);
    setQueryResult(null);
    onOverlayRemove?.();
  }, [map, onOverlayRemove]);

  // 切换工具
  const handleToolChange = useCallback(
    (tool: AnalysisMode) => {
      if (activeTool === tool) {
        setActiveTool('none');
        clearOverlays();
        return;
      }

      clearOverlays();
      setActiveTool(tool);

      // 设置地图点击事件
      if (tool !== 'none') {
        map?.setDefaultCursor('crosshair');
      } else {
        map?.setDefaultCursor('');
      }
    },
    [activeTool, clearOverlays, map]
  );

  // 地图点击处理
  useEffect(() => {
    if (!map || activeTool === 'none') return;

    const handleMapClick = (e: any) => {
      const position: MapPosition = { lng: e.lnglat.lng, lat: e.lnglat.lat };

      switch (activeTool) {
        case 'buffer':
          handleBufferClick(position);
          break;
        case 'distance':
          handleDistanceClick(position);
          break;
        case 'area':
          handleAreaClick(position);
          break;
        case 'spatialQuery':
          handleSpatialQueryClick(position);
          break;
      }
    };

    AMap.event.addListener(map, 'click', handleMapClick);

    return () => {
      AMap.event.removeListener(map, 'click', handleMapClick);
    };
  }, [map, activeTool]);

  // 缓冲区分析
  const handleBufferClick = useCallback(
    (position: MapPosition) => {
      if (!map) return;

      // 清除旧的
      if (bufferOverlayRef.current) {
        map.remove(bufferOverlayRef.current);
      }
      markerOverlaysRef.current.forEach((m) => map.remove(m));
      markerOverlaysRef.current = [];

      // 创建圆
      const circle = new AMap.Circle({
        center: new AMap.LngLat(position.lng, position.lat),
        radius: bufferRadius * 1000, // 转换为米
        strokeColor: '#1890ff',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#1890ff',
        fillOpacity: 0.2,
        zIndex: 50,
      });

      // 添加中心标记
      const centerMarker = new AMap.Marker({
        position: new AMap.LngLat(position.lng, position.lat),
        icon: new AMap.Icon({
          size: new AMap.Size(32, 32),
          image: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
          imageSize: new AMap.Size(32, 32),
        }),
        offset: new AMap.Pixel(-16, -32),
        zIndex: 51,
      });

      map.add([circle, centerMarker]);
      bufferOverlayRef.current = circle;
      markerOverlaysRef.current.push(centerMarker);
      setBufferCenter(position);

      // 执行分析
      const result = createBuffer(position, bufferRadius);
      setBufferResult(result);

      // 筛选在范围内的标记点
      const pointsInRange = markers.filter((m) =>
        isPointInCircle(m, position, bufferRadius)
      );

      // 添加范围内的标记点
      pointsInRange.forEach((m) => {
        const marker = new AMap.Marker({
          position: new AMap.LngLat(m.lng, m.lat),
          icon: new AMap.Icon({
            size: new AMap.Size(24, 24),
            image: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-near.png',
            imageSize: new AMap.Size(24, 24),
          }),
          offset: new AMap.Pixel(-12, -24),
          zIndex: 52,
        });
        map.add(marker);
        markerOverlaysRef.current.push(marker);
      });

      message.success(
        `服务范围: ${formatArea(result.area)}，范围内 ${pointsInRange.length} 个标记点`
      );

      onAnalysisComplete?.({
        type: 'buffer',
        data: { ...result, pointsInRange },
        timestamp: new Date(),
      });
    },
    [map, bufferRadius, markers, onAnalysisComplete]
  );

  // 距离测量
  const handleDistanceClick = useCallback(
    (position: MapPosition) => {
      if (!map) return;

      const newPoints = [...distancePoints, position];
      setDistancePoints(newPoints);

      // 添加标记
      const marker = new AMap.Marker({
        position: new AMap.LngLat(position.lng, position.lat),
        label: {
          content: `${newPoints.length}`,
          offset: new AMap.Pixel(-6, -6),
        },
        zIndex: 50,
      });
      map.add(marker);
      markerOverlaysRef.current.push(marker);

      // 绘制线
      if (newPoints.length >= 2) {
        if (polylineOverlayRef.current) {
          map.remove(polylineOverlayRef.current);
        }

        const path = newPoints.map(
          (p) => new AMap.LngLat(p.lng, p.lat)
        );
        const polyline = new AMap.Polyline({
          path,
          strokeColor: '#52c41a',
          strokeWeight: 3,
          strokeOpacity: 0.8,
          zIndex: 49,
        });

        map.add(polyline);
        polylineOverlayRef.current = polyline;

        // 计算总距离
        let totalDistance = 0;
        for (let i = 0; i < newPoints.length - 1; i++) {
          const dist = calculateDistance(newPoints[i], newPoints[i + 1]);
          totalDistance += dist.distance;
        }

        onAnalysisComplete?.({
          type: 'distance',
          data: { points: newPoints, totalDistance },
          timestamp: new Date(),
        });
      }
    },
    [map, distancePoints, onAnalysisComplete]
  );

  // 面积测量
  const handleAreaClick = useCallback(
    (position: MapPosition) => {
      if (!map) return;

      const newPoints = [...areaPoints, position];
      setAreaPoints(newPoints);

      // 添加标记
      const marker = new AMap.Marker({
        position: new AMap.LngLat(position.lng, position.lat),
        label: {
          content: `${newPoints.length}`,
          offset: new AMap.Pixel(-6, -6),
        },
        zIndex: 50,
      });
      map.add(marker);
      markerOverlaysRef.current.push(marker);

      // 绘制多边形
      if (newPoints.length >= 3) {
        if (polygonOverlayRef.current) {
          map.remove(polygonOverlayRef.current);
        }

        const path = newPoints.map(
          (p) => new AMap.LngLat(p.lng, p.lat)
        );
        const polygon = new AMap.Polygon({
          path,
          strokeColor: '#fa8c16',
          strokeWeight: 2,
          strokeOpacity: 0.8,
          fillColor: '#fa8c16',
          fillOpacity: 0.2,
          zIndex: 49,
        });

        map.add(polygon);
        polygonOverlayRef.current = polygon;

        // 计算面积和周长
        const area = calculateArea(newPoints);
        const perimeter = calculatePerimeter(newPoints);
        const centroid = calculateCentroid(newPoints);

        onAnalysisComplete?.({
          type: 'area',
          data: { ...area, perimeter, centroid, points: newPoints },
          timestamp: new Date(),
        });
      }
    },
    [map, areaPoints, onAnalysisComplete]
  );

  // 空间查询
  const handleSpatialQueryClick = useCallback(
    (position: MapPosition) => {
      if (!map) return;

      // 添加查询点标记
      if (queryOverlayRef.current) {
        map.remove(queryOverlayRef.current);
      }

      const marker = new AMap.Marker({
        position: new AMap.LngLat(position.lng, position.lat),
        icon: new AMap.Icon({
          size: new AMap.Size(32, 32),
          image: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
          imageSize: new AMap.Size(32, 32),
        }),
        offset: new AMap.Pixel(-16, -32),
        zIndex: 51,
      });

      map.add(marker);
      queryOverlayRef.current = marker;
      setQueryPoint(position);

      // 如果已有区域，执行查询
      if (queryRegion.length >= 3) {
        const isInside = isPointInPolygon(position, queryRegion);
        setQueryResult(isInside);

        // 更新区域样式
        if (polygonOverlayRef.current) {
          polygonOverlayRef.current.setOptions({
            fillColor: isInside ? '#52c41a' : '#f5222d',
          });
        }

        message.info(isInside ? '点在区域内 ✓' : '点在区域外 ✗');
      }
    },
    [map, queryRegion]
  );

  // 开始绘制区域
  const startDrawingRegion = useCallback(() => {
    if (!map) return;
    clearOverlays();
    setQueryRegion([]);
    setActiveTool('spatialQuery');
    message.info('点击地图绘制查询区域（至少3点），双击结束');
  }, [map, clearOverlays]);

  // 完成区域绘制
  const finishDrawingRegion = useCallback(() => {
    if (areaPoints.length >= 3) {
      setQueryRegion(areaPoints);
      setDistancePoints([]);
      setAreaPoints([]);
      setActiveTool('none');

      // 绘制查询区域
      if (polygonOverlayRef.current) {
        polygonOverlayRef.current.setOptions({
          fillColor: '#1890ff',
        });
      }

      message.success('区域绘制完成，点击区域内的点进行查询');
    } else {
      message.warning('请至少绘制3个点');
    }
  }, [areaPoints]);

  // 清除
  const handleClear = useCallback(() => {
    setActiveTool('none');
    clearOverlays();
    setBufferCenter(null);
    setBufferResult(null);
    message.success('已清除分析结果');
  }, [clearOverlays]);

  return (
    <Card
      title={
        <Space>
          <EnvironmentOutlined />
          <span>空间分析工具</span>
        </Space>
      }
      extra={
        <Button size="small" icon={<ClearOutlined />} onClick={handleClear}>
          清除
        </Button>
      }
      size="small"
    >
      {/* 工具选择 */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          选择分析工具后，点击地图执行分析：
        </Text>
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            {TOOLS.map((tool) => (
              <Button
                key={tool.key}
                type={activeTool === tool.key ? 'primary' : 'default'}
                icon={tool.icon}
                onClick={() => handleToolChange(tool.key)}
                size="small"
              >
                {tool.name}
              </Button>
            ))}
          </Space>
        </div>
      </div>

      {/* 缓冲区半径设置 */}
      {activeTool === 'buffer' && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            服务半径（公里）：
          </Text>
          <Row gutter={8} align="middle" style={{ marginTop: 4 }}>
            <Col span={16}>
              <Slider
                min={1}
                max={20}
                step={0.5}
                value={bufferRadius}
                onChange={setBufferRadius}
                marks={{ 1: '1km', 5: '5km', 10: '10km', 20: '20km' }}
              />
            </Col>
            <Col span={4}>
              <InputNumber
                min={0.5}
                max={50}
                step={0.5}
                value={bufferRadius}
                onChange={(v) => setBufferRadius(v || 1)}
                size="small"
                suffix="km"
              />
            </Col>
          </Row>
          <Text type="secondary" style={{ fontSize: 11 }}>
            当前设置: {bufferRadius} 公里 | 约{' '}
            {((bufferRadius * bufferRadius * Math.PI * 1000000) / 10000).toFixed(2)}{' '}
            公顷
          </Text>
        </div>
      )}

      {/* 距离测量说明 */}
      {activeTool === 'distance' && (
        <div style={{ marginBottom: 16, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <LineChartOutlined style={{ marginRight: 4 }} />
            距离测量：依次点击地图添加测量点，已添加 {distancePoints.length}{' '}
            个点
          </Text>
          {distancePoints.length >= 2 && (
            <div style={{ marginTop: 4 }}>
              <Text strong style={{ fontSize: 12 }}>
                总距离：{formatDistance(
                  distancePoints.reduce((sum, p, i) => {
                    if (i === 0) return 0;
                    return sum + calculateDistance(distancePoints[i - 1], p).distance;
                  }, 0)
                )}
              </Text>
            </div>
          )}
          <Button
            size="small"
            type="link"
            onClick={() => setDistancePoints([])}
            style={{ padding: 0, height: 'auto' }}
          >
            重置
          </Button>
        </div>
      )}

      {/* 面积测量说明 */}
      {activeTool === 'area' && (
        <div style={{ marginBottom: 16, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <AreaChartOutlined style={{ marginRight: 4 }} />
            面积测量：点击地图添加多边形顶点，已添加 {areaPoints.length}{' '}
            个点（至少3个）
          </Text>
          {areaPoints.length >= 3 && (
            <div style={{ marginTop: 4 }}>
              <Text strong style={{ fontSize: 12 }}>
                面积：{formatArea(calculateArea(areaPoints).area)} | 周长：{' '}
                {formatDistance(calculatePerimeter(areaPoints))}
              </Text>
            </div>
          )}
          <Button
            size="small"
            type="link"
            onClick={() => setAreaPoints([])}
            style={{ padding: 0, height: 'auto' }}
          >
            重置
          </Button>
        </div>
      )}

      {/* 空间查询说明 */}
      {activeTool === 'spatialQuery' && (
        <div style={{ marginBottom: 16, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <SearchOutlined style={{ marginRight: 4 }} />
            空间查询：先点击绘制区域，再点击查询点是否在区域内
          </Text>
          {queryRegion.length >= 3 && (
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                已绘制 {queryRegion.length} 个顶点的区域
              </Text>
            </div>
          )}
          {queryResult !== null && queryPoint && (
            <div style={{ marginTop: 4 }}>
              <Tag color={queryResult ? 'success' : 'error'}>
                {queryResult ? '点在区域内' : '点在区域外'}
              </Tag>
            </div>
          )}
        </div>
      )}

      <Divider style={{ margin: '12px 0' }} />

      {/* 分析结果 */}
      {bufferResult && (
        <div style={{ padding: 8, background: '#e6f7ff', borderRadius: 4 }}>
          <Text strong style={{ fontSize: 12 }}>
            缓冲区分析结果
          </Text>
          <Row gutter={12} style={{ marginTop: 8 }}>
            <Col span={12}>
              <Statistic
                title="覆盖面积"
                value={bufferResult.area}
                suffix="m²"
                valueStyle={{ fontSize: 14 }}
                precision={2}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="周长"
                value={bufferResult.perimeter}
                suffix="m"
                valueStyle={{ fontSize: 14 }}
                precision={2}
              />
            </Col>
          </Row>
        </div>
      )}

      {/* 帮助信息 */}
      <div style={{ marginTop: 12 }}>
        <Popover
          content={
            <div style={{ maxWidth: 280 }}>
              <Paragraph style={{ fontSize: 12 }}>
                <Text strong>缓冲区分析：</Text> 以选定点为中心，计算指定半径内的服务范围
              </Paragraph>
              <Paragraph style={{ fontSize: 12 }}>
                <Text strong>距离测量：</Text> 依次点击测量多点之间的累计距离
              </Paragraph>
              <Paragraph style={{ fontSize: 12 }}>
                <Text strong>面积测量：</Text> 点击构成多边形，自动计算面积和周长
              </Paragraph>
              <Paragraph style={{ fontSize: 12 }}>
                <Text strong>空间查询：</Text> 判断点是否在指定多边形区域内
              </Paragraph>
            </div>
          }
          title="工具说明"
          trigger="hover"
        >
          <Button size="small" type="text" icon={<QuestionCircleOutlined />}>
            帮助
          </Button>
        </Popover>
      </div>
    </Card>
  );
};

export default SpatialAnalysis;
