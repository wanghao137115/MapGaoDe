/**
 * WebGIS 功能演示页面
 * 集成热力图、空间分析、GeoJSON 加载等 WebGIS 能力
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Switch,
  Slider,
  Select,
  Divider,
  Typography,
  Table,
  Tag,
  Statistic,
  message,
  Upload,
  Tabs,
  Collapse,
} from 'antd';
import {
  HeatMapOutlined,
  EnvironmentOutlined,
  AimOutlined,
  UploadOutlined,
  DownloadOutlined,
  ClearOutlined,
  FireOutlined,
  GlobalOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import MapContainer from '@/components/Map/MapContainer';
import HeatmapLayer from '@/components/Map/HeatmapLayer';
import GeoJSONLayer, {
  generateStoreGeoJSON,
  generateRegionGeoJSON,
  generateRouteGeoJSON,
} from '@/components/Map/GeoJSONLayer';
import SpatialAnalysis from '@/components/Map/SpatialAnalysis';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { MapPosition } from '@/types';
import type { GeoJSONData, GeoJSONFeature } from '@/components/Map/GeoJSONLayer';
import type { AnalysisResult } from '@/components/Map/SpatialAnalysis';
import {
  calculateDistance,
  calculateArea,
  isPointInPolygon,
  formatDistance,
  formatArea,
} from '@/services/gis';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

type HeatmapDataType = 'stores' | 'orders' | 'users' | 'custom';
type GeoJSONRenderMode = 'points' | 'regions' | 'routes';

// 预设数据源配置
const PRESET_DATA_SOURCES: Record<HeatmapDataType, { count: number; name: string }> = {
  stores: { count: 200, name: '门店分布' },
  orders: { count: 500, name: '订单密度' },
  users: { count: 300, name: '用户分布' },
  custom: { count: 0, name: '自定义' },
};

const WebGISDemo: React.FC = () => {
  // 地图相关
  const [mapCenter, setMapCenter] = useState<MapPosition>({
    lng: 116.3974,
    lat: 39.9093,
  });
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [mapInstance, setMapInstance] = useState<AMap.Map | null>(null);

  // 热力图状态
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [heatmapRadius, setHeatmapRadius] = useState<number>(30);
  const [heatmapDataType, setHeatmapDataType] = useState<HeatmapDataType>('stores');
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [heatmapMax, setHeatmapMax] = useState<number>(100);

  // GeoJSON 状态
  const [showGeoJSON, setShowGeoJSON] = useState<boolean>(false);
  const [geoJSONData, setGeoJSONData] = useState<GeoJSONData | null>(null);
  const [geoJSONRenderMode, setGeoJSONRenderMode] = useState<GeoJSONRenderMode>('points');
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);

  // 空间分析状态
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisMarkers, setAnalysisMarkers] = useState<MapPosition[]>([]);

  // 地理定位
  const { position: userPosition, loading: locationLoading } = useGeolocation();

  // 地图加载完成回调
  const handleMapLoad = useCallback((map: AMap.Map) => {
    setMapInstance(map);
    message.success('地图加载完成');
  }, []);

  // 切换到用户位置
  const handleLocate = useCallback(() => {
    if (userPosition) {
      setMapCenter(userPosition);
      setMapZoom(15);
      message.success('已定位到您当前位置');
    } else {
      message.warning('无法获取位置信息');
    }
  }, [userPosition]);

  // 生成热力图数据
  const generateHeatmapData = useCallback(
    (type: HeatmapDataType) => {
      const center = mapCenter;
      const config = PRESET_DATA_SOURCES[type];
      const data: any[] = [];

      if (config.count === 0) {
        return data;
      }

      for (let i = 0; i < config.count; i++) {
        // 随机生成位置（围绕中心点）
        const lng = center.lng + (Math.random() - 0.5) * 0.15;
        const lat = center.lat + (Math.random() - 0.5) * 0.15;

        // 随机生成权重（模拟密度）
        const count = Math.random() * heatmapMax;

        data.push({ lng, lat, count });
      }

      return data;
    },
    [mapCenter, heatmapMax]
  );

  // 切换热力图数据源
  const handleDataSourceChange = useCallback((type: HeatmapDataType) => {
    setHeatmapDataType(type);
    const data = generateHeatmapData(type);
    setHeatmapData(data);
    message.success(`已加载 ${PRESET_DATA_SOURCES[type].name} 数据`);
  }, [generateHeatmapData]);

  // 切换热力图显示
  const handleHeatmapToggle = useCallback(
    (checked: boolean) => {
      setShowHeatmap(checked);

      if (checked && heatmapData.length === 0) {
        const data = generateHeatmapData(heatmapDataType);
        setHeatmapData(data);
      }

      message.info(checked ? '热力图已开启' : '热力图已关闭');
    },
    [heatmapData, heatmapDataType, generateHeatmapData]
  );

  // 加载 GeoJSON 示例数据
  const handleLoadGeoJSONExample = useCallback(
    (mode: GeoJSONRenderMode) => {
      let data: GeoJSONData;

      switch (mode) {
        case 'points':
          data = generateStoreGeoJSON(mapCenter, 50);
          break;
        case 'regions':
          data = generateRegionGeoJSON(mapCenter, 0.03);
          break;
        case 'routes':
          data = generateRouteGeoJSON(
            { lng: mapCenter.lng - 0.05, lat: mapCenter.lat - 0.03 },
            { lng: mapCenter.lng + 0.05, lat: mapCenter.lat + 0.03 },
            8
          );
          break;
        default:
          data = generateStoreGeoJSON(mapCenter, 50);
      }

      setGeoJSONData(data);
      setShowGeoJSON(true);
      message.success(`已加载 ${mode === 'points' ? '门店' : mode === 'regions' ? '区域' : '路线'} 示例数据`);
    },
    [mapCenter]
  );

  // 处理 GeoJSON 文件上传
  const handleGeoJSONUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          const data = JSON.parse(content as string);

          if (data.type === 'FeatureCollection' || data.type === 'Feature') {
            if (data.type === 'Feature') {
              setGeoJSONData({ type: 'FeatureCollection', features: [data] });
            } else {
              setGeoJSONData(data);
            }
            setShowGeoJSON(true);
            message.success(`成功加载 GeoJSON，包含 ${data.features?.length || 1} 个要素`);
          } else {
            message.error('无效的 GeoJSON 格式');
          }
        } catch (error) {
          message.error('文件解析失败');
        }
      };
      reader.readAsText(file);
      return false; // 阻止默认上传
    },
    []
  );

  // GeoJSON 要素点击
  const handleFeatureClick = useCallback(
    (feature: GeoJSONFeature, position: MapPosition) => {
      setSelectedFeature(feature);
      setMapCenter(position);
      setMapZoom(15);
    },
    []
  );

  // 导出 GeoJSON
  const handleExportGeoJSON = useCallback(() => {
    if (!geoJSONData) {
      message.warning('没有可导出的数据');
      return;
    }

    const blob = new Blob([JSON.stringify(geoJSONData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geojson-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('GeoJSON 已导出');
  }, [geoJSONData]);

  // 清除所有
  const handleClearAll = useCallback(() => {
    setShowHeatmap(false);
    setShowGeoJSON(false);
    setGeoJSONData(null);
    setSelectedFeature(null);
    setAnalysisResult(null);
    setHeatmapData([]);
    message.success('已清除所有图层');
  }, []);

  // 初始化：加载默认热力图数据
  useEffect(() => {
    const data = generateHeatmapData('stores');
    setHeatmapData(data);
  }, []);

  // 更新分析标记点
  useEffect(() => {
    // 模拟门店位置
    const markers: MapPosition[] = [];
    for (let i = 0; i < 30; i++) {
      markers.push({
        lng: mapCenter.lng + (Math.random() - 0.5) * 0.1,
        lat: mapCenter.lat + (Math.random() - 0.5) * 0.1,
      });
    }
    setAnalysisMarkers(markers);
  }, [mapCenter]);

  return (
    <div style={{ padding: 20 }}>
      <Row gutter={16}>
        {/* 左侧工具面板 */}
        <Col span={7}>
          <Tabs
            defaultActiveKey="heatmap"
            items={[
              {
                key: 'heatmap',
                label: (
                  <span>
                    <FireOutlined />
                    热力图
                  </span>
                ),
                children: (
                  <Card size="small">
                    <div style={{ marginBottom: 16 }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text>开启热力图</Text>
                        <Switch checked={showHeatmap} onChange={handleHeatmapToggle} />
                      </Space>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        数据源
                      </Text>
                      <Select
                        value={heatmapDataType}
                        onChange={handleDataSourceChange}
                        style={{ width: '100%', marginTop: 4 }}
                        disabled={!showHeatmap}
                      >
                        <Option value="stores">门店分布 (200点)</Option>
                        <Option value="orders">订单密度 (500点)</Option>
                        <Option value="users">用户分布 (300点)</Option>
                      </Select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        热力半径: {heatmapRadius} px
                      </Text>
                      <Slider
                        min={10}
                        max={60}
                        value={heatmapRadius}
                        onChange={setHeatmapRadius}
                        disabled={!showHeatmap}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        最大权重值: {heatmapMax}
                      </Text>
                      <Slider
                        min={10}
                        max={200}
                        value={heatmapMax}
                        onChange={setHeatmapMax}
                        disabled={!showHeatmap}
                      />
                    </div>

                    <div style={{ padding: 8, background: '#fff7e6', borderRadius: 4 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        说明：热力图通过颜色深浅表示数据密度，橙红色表示高密度区域
                      </Text>
                    </div>
                  </Card>
                ),
              },
              {
                key: 'geojson',
                label: (
                  <span>
                    <GlobalOutlined />
                    GeoJSON
                  </span>
                ),
                children: (
                  <Card size="small">
                    <div style={{ marginBottom: 16 }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text>显示矢量数据</Text>
                        <Switch checked={showGeoJSON} onChange={setShowGeoJSON} />
                      </Space>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        加载示例数据
                      </Text>
                      <Space style={{ width: '100%', marginTop: 4 }} direction="vertical">
                        <Button
                          size="small"
                          block
                          icon={<EnvironmentOutlined />}
                          onClick={() => handleLoadGeoJSONExample('points')}
                        >
                          加载门店点数据
                        </Button>
                        <Button
                          size="small"
                          block
                          icon={<GlobalOutlined />}
                          onClick={() => handleLoadGeoJSONExample('regions')}
                        >
                          加载区域数据
                        </Button>
                        <Button
                          size="small"
                          block
                          icon={<LineChartOutlined />}
                          onClick={() => handleLoadGeoJSONExample('routes')}
                        >
                          加载路线数据
                        </Button>
                      </Space>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        上传 GeoJSON 文件
                      </Text>
                      <Upload
                        accept=".json,.geojson"
                        beforeUpload={handleGeoJSONUpload}
                        showUploadList={false}
                      >
                        <Button size="small" icon={<UploadOutlined />} block style={{ marginTop: 4 }}>
                          选择文件
                        </Button>
                      </Upload>
                    </div>

                    {geoJSONData && (
                      <>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            已加载 {geoJSONData.features?.length || 0} 个要素
                          </Text>
                        </div>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={handleExportGeoJSON}
                          block
                        >
                          导出 GeoJSON
                        </Button>
                      </>
                    )}
                  </Card>
                ),
              },
            ]}
          />

          {/* 空间分析组件 */}
          <div style={{ marginTop: 16 }}>
            <SpatialAnalysis
              map={mapInstance}
              markers={analysisMarkers}
              onAnalysisComplete={setAnalysisResult}
            />
          </div>

          {/* 清除按钮 */}
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={handleClearAll}
            block
            danger
            style={{ marginTop: 16 }}
          >
            清除所有图层
          </Button>
        </Col>

        {/* 右侧地图区域 */}
        <Col span={17}>
          <Card
            title={
              <Space>
                <HeatMapOutlined />
                <span>WebGIS 功能演示</span>
              </Space>
            }
            extra={
              <Space>
                <Button
                  size="small"
                  icon={<AimOutlined />}
                  onClick={handleLocate}
                  loading={locationLoading}
                >
                  定位
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {mapCenter.lng.toFixed(4)}, {mapCenter.lat.toFixed(4)}
                </Text>
              </Space>
            }
          >
            <div style={{ position: 'relative', width: '100%', height: '650px' }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                controls={{ scale: true, toolBar: true, mapType: true }}
                onCenterChange={setMapCenter}
                onZoomChange={setMapZoom}
                onLoad={handleMapLoad}
                style={{ width: '100%', height: '100%' }}
              >
                {/* 热力图层 */}
                <HeatmapLayer
                  map={mapInstance}
                  data={heatmapData}
                  visible={showHeatmap}
                  radius={heatmapRadius}
                  max={heatmapMax}
                />

                {/* GeoJSON 图层 */}
                <GeoJSONLayer
                  map={mapInstance}
                  data={geoJSONData}
                  visible={showGeoJSON}
                  onFeatureClick={handleFeatureClick}
                />
              </MapContainer>

              {/* 图层状态指示器 */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(255,255,255,0.95)',
                  padding: 8,
                  borderRadius: 4,
                  fontSize: 12,
                  zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <Tag color={showHeatmap ? 'orange' : 'default'}>
                    热力图 {showHeatmap ? 'ON' : 'OFF'}
                  </Tag>
                </div>
                <div>
                  <Tag color={showGeoJSON ? 'blue' : 'default'}>
                    GeoJSON {showGeoJSON ? 'ON' : 'OFF'}
                  </Tag>
                </div>
              </div>
            </div>
          </Card>

          {/* 分析结果展示 */}
          {(analysisResult || selectedFeature) && (
            <Card size="small" style={{ marginTop: 16 }}>
              <Tabs
                size="small"
                items={
                  analysisResult
                    ? [
                        {
                          key: 'analysis',
                          label: '分析结果',
                          children: (
                            <div>
                              <Tag color="blue">{analysisResult.type}</Tag>
                              <Text style={{ marginLeft: 8 }}>
                                {new Date(analysisResult.timestamp).toLocaleTimeString()}
                              </Text>
                              <Divider style={{ margin: '12px 0' }} />
                              {analysisResult.type === 'buffer' && (
                                <Row gutter={16}>
                                  <Col span={8}>
                                    <Statistic
                                      title="覆盖面积"
                                      value={analysisResult.data.area}
                                      suffix="m²"
                                      valueStyle={{ fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col span={8}>
                                    <Statistic
                                      title="周长"
                                      value={analysisResult.data.perimeter}
                                      suffix="m"
                                      valueStyle={{ fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col span={8}>
                                    <Statistic
                                      title="范围内点数"
                                      value={analysisResult.data.pointsInRange?.length || 0}
                                      valueStyle={{ fontSize: 16 }}
                                    />
                                  </Col>
                                </Row>
                              )}
                              {analysisResult.type === 'distance' && (
                                <Statistic
                                  title="总距离"
                                  value={analysisResult.data.totalDistance}
                                  suffix="m"
                                  valueStyle={{ fontSize: 16 }}
                                />
                              )}
                              {analysisResult.type === 'area' && (
                                <Row gutter={16}>
                                  <Col span={8}>
                                    <Statistic
                                      title="面积"
                                      value={analysisResult.data.area}
                                      suffix="m²"
                                      valueStyle={{ fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col span={8}>
                                    <Statistic
                                      title="周长"
                                      value={analysisResult.data.perimeter}
                                      suffix="m"
                                      valueStyle={{ fontSize: 16 }}
                                    />
                                  </Col>
                                </Row>
                              )}
                            </div>
                          ),
                        },
                      ]
                    : []
                }
              />
            </Card>
          )}

          {/* 选中的 GeoJSON 要素 */}
          {selectedFeature && (
            <Card size="small" style={{ marginTop: 16 }}>
              <Title level={5}>选中要素详情</Title>
              <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                {JSON.stringify(selectedFeature, null, 2)}
              </pre>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default WebGISDemo;
