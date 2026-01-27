// src/pages/MapTools.tsx
// 地图工具页面 - 提供绘制、测距、面积测量、截图、分享等功能

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  message,
  Tooltip,
  Divider,
  Alert,
  Typography,
  Modal,
  Input,
  Form,
} from 'antd';
import {
  EnvironmentOutlined,
  EditOutlined,
  AimOutlined,
  ScissorOutlined,
  ShareAltOutlined,
  ClearOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';

import MapContainer from '@/components/Map/MapContainer';
import MarkerLayer from '@/components/Map/MarkerLayer';
import DrawingLayer from '@/components/Map/DrawingLayer';
import MeasurementLayer from '@/components/Map/MeasurementLayer';
import PlaceSearch from '@/components/Map/PlaceSearch';
import { useGeolocation } from '@/hooks/useGeolocation';

import type { MapPosition } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 工具类型枚举
enum ToolType {
  NONE = 'none',
  DRAW_CIRCLE = 'draw_circle',
  DRAW_POLYGON = 'draw_polygon',
  MEASURE_DISTANCE = 'measure_distance',
  MEASURE_AREA = 'measure_area',
}

// 绘制对象接口
interface DrawingObject {
  id: string;
  type: 'circle' | 'polygon';
  positions: MapPosition[];
  radius?: number;
  area?: number;
  perimeter?: number;
}

// 测量结果接口
interface MeasurementResult {
  id: string;
  type: 'distance' | 'area';
  value: number;
  unit: string;
  positions: MapPosition[];
}

const MapTools: React.FC = () => {
  // 获取用户当前位置
  const { position: userPosition, loading: locationLoading, error: locationError } = useGeolocation();

  // 当前地图中心点和缩放级别（默认为用户位置）
  const [mapCenter, setMapCenter] = useState<MapPosition>(
    userPosition || { lng: 116.4074, lat: 39.9093 }
  );
  const [mapZoom, setMapZoom] = useState<number>(12);

  // 工具状态
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.NONE);

  // 绘制对象状态
  const [drawingObjects, setDrawingObjects] = useState<DrawingObject[]>([]);

  // 测量结果状态
  const [measurements, setMeasurements] = useState<MeasurementResult[]>([]);

  // 截图相关状态
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [screenshotData, setScreenshotData] = useState<string>('');

  // 分享相关状态
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');

  // 搜索结果标记
  const [searchMarkers, setSearchMarkers] = useState<any[]>([]);
  // 确认的地点标记（星号）
  const [confirmedPlaceMarker, setConfirmedPlaceMarker] = useState<any>(null);

  // 当获取到用户位置时，更新地图中心点
  useEffect(() => {
    if (userPosition) {
      setMapCenter(userPosition);
      setMapZoom(15); // 用户位置时放大显示
    }
  }, [userPosition]);

  // 处理工具切换
  const handleToolChange = useCallback((tool: ToolType) => {
    if (activeTool === tool) {
      setActiveTool(ToolType.NONE);
    } else {
      setActiveTool(tool);
    }
  }, [activeTool]);

  // 处理绘制完成
  const handleDrawingComplete = useCallback((object: DrawingObject) => {
    setDrawingObjects(prev => [...prev, object]);
    setActiveTool(ToolType.NONE);

    if (object.type === 'polygon' && object.area) {
      message.success(`绘制完成！面积约为 ${object.area.toFixed(2)} 平方米`);
    } else if (object.type === 'circle' && object.radius) {
      message.success(`绘制完成！半径约为 ${object.radius.toFixed(0)} 米`);
    }
  }, []);

  // 处理测量完成
  const handleMeasurementComplete = useCallback((result: MeasurementResult) => {
    setMeasurements(prev => [...prev, result]);

    if (result.type === 'distance') {
      message.success(`测量完成！距离约为 ${result.value.toFixed(2)} ${result.unit}`);
    } else if (result.type === 'area') {
      message.success(`测量完成！面积约为 ${result.value.toFixed(2)} ${result.unit}`);
    }
  }, []);

  // 清除所有绘制对象
  const handleClearDrawings = useCallback(() => {
    // 清除已完成的绘制对象和测量结果
    setDrawingObjects([]);
    setMeasurements([]);
    setSearchMarkers([]); // 清除搜索标记
    setConfirmedPlaceMarker(null); // 清除确认的地点标记

    // 清除地图上的所有覆盖物（包括临时覆盖物）
    try {
      const map = (window as any).currentMap;
      if (map && typeof map.clearMap === 'function') {
        map.clearMap();
      } else if (map && map.getAllOverlays) {
        // 如果有getAllOverlays方法，清除所有覆盖物
        const overlays = map.getAllOverlays();
        overlays.forEach((overlay: any) => {
          try {
            map.remove(overlay);
          } catch (error) {
            console.warn('清除覆盖物时出错:', error);
          }
        });
      }
    } catch (error) {
      console.warn('清除地图覆盖物时出错:', error);
    }

    message.success('已清除所有绘制、测量和搜索结果');
  }, []);

  // 处理截图
  const handleScreenshot = useCallback(async () => {
    try {
      const map = (window as any).currentMap;
      if (!map) {
        message.error('地图未加载完成');
        return;
      }

      // 尝试获取地图截图（高德地图API可能不支持直接截图）
      // 这里模拟截图功能
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // 绘制简单的地图占位图
        ctx.fillStyle = '#f0f2f5';
        ctx.fillRect(0, 0, 800, 600);

        ctx.fillStyle = '#1890ff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('地图截图', 400, 300);
        ctx.font = '16px Arial';
        ctx.fillText(`中心点: ${mapCenter.lng.toFixed(4)}, ${mapCenter.lat.toFixed(4)}`, 400, 340);
        ctx.fillText(`缩放级别: ${mapZoom}`, 400, 360);

        const dataUrl = canvas.toDataURL('image/png');
        setScreenshotData(dataUrl);
        setShowScreenshotModal(true);
      }
    } catch (error) {
      message.error('截图功能暂不可用（需要浏览器支持）');
      console.error('Screenshot error:', error);
    }
  }, [mapCenter, mapZoom]);

  // 处理分享
  const handleShare = useCallback(() => {
    // 生成基于当前位置的分享链接
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/map?lng=${mapCenter.lng}&lat=${mapCenter.lat}&zoom=${mapZoom}`;
    setShareLink(shareUrl);
    setShowShareModal(true);
  }, [mapCenter, mapZoom]);

  // 复制分享链接
  const handleCopyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      message.success('分享链接已复制到剪贴板');
    } catch (error) {
      message.error('复制失败，请手动复制链接');
    }
  }, [shareLink]);

  // 处理地点选择（点击搜索结果）
  const handlePlaceSelect = useCallback((place: any) => {
    // 只设置选中状态，不立即跳转地图
    // 用户可以通过回车确认来跳转
  }, []);

  // 处理地点确认（回车确定）
  const handlePlaceConfirm = useCallback((place: any) => {
    console.log('MapTools: handlePlaceConfirm called with place:', place);
    console.log('MapTools: setting map center to:', place.location);

    // 设置地图中心点为确认的地点
    setMapCenter(place.location);
    setMapZoom(16); // 放大显示

    // 清除之前的搜索标记和确认标记
    setSearchMarkers([]);
    setConfirmedPlaceMarker(null);

    // 添加星号标记作为确认地点
    const starMarker = {
      id: `confirmed-${place.id}`,
      type: 'confirmed_place' as const,
      title: `📍 ${place.name}`,
      position: place.location,
      createdAt: new Date(),
      updatedAt: new Date(),
      data: {
        address: place.address,
        phone: place.tel,
        description: place.tag || place.type,
        isConfirmedPlace: true // 标记这是一个确认的地点
      }
    };

    console.log('MapTools: setting confirmed place marker:', starMarker);
    setConfirmedPlaceMarker(starMarker);
    message.success(`已锁定地点: ${place.name}`);
  }, []);

  // 工具按钮配置
  const toolButtons = [
    {
      key: ToolType.DRAW_CIRCLE,
      icon: <EnvironmentOutlined />,
      title: '绘制圆形区域',
      description: '点击地图绘制圆形覆盖区域'
    },
    {
      key: ToolType.DRAW_POLYGON,
      icon: <EditOutlined />,
      title: '绘制多边形区域',
      description: '连续点击绘制多边形区域'
    },
    {
      key: ToolType.MEASURE_DISTANCE,
      icon: <AimOutlined />,
      title: '测量距离',
      description: '点击测量两点间的距离'
    },
    {
      key: ToolType.MEASURE_AREA,
      icon: <EnvironmentOutlined />,
      title: '测量面积',
      description: '绘制区域测量面积'
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={16}>
        {/* 左侧工具面板 */}
        <Col span={6}>
          {/* 地点搜索 */}
          <Card style={{ marginBottom: '16px' }}>
            <PlaceSearch
              placeholder="搜索地点、地址、POI..."
              city="北京"
              onPlaceSelect={handlePlaceSelect}
              onPlaceConfirm={handlePlaceConfirm}
              style={{ marginBottom: 0 }}
            />
          </Card>

          <Card title="地图工具" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {toolButtons.map(button => (
                <Tooltip key={button.key} title={button.description}>
                  <Button
                    type={activeTool === button.key ? 'primary' : 'default'}
                    icon={button.icon}
                    onClick={() => handleToolChange(button.key)}
                    block
                    style={{ textAlign: 'left' }}
                  >
                    {button.title}
                  </Button>
                </Tooltip>
              ))}

              <Divider />

              <Button
                icon={<ClearOutlined />}
                onClick={handleClearDrawings}
                block
                danger
              >
                清除所有
              </Button>
            </Space>
          </Card>

          {/* 绘制对象列表 */}
          {drawingObjects.length > 0 && (
            <Card title={`绘制对象 (${drawingObjects.length})`} style={{ marginBottom: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {drawingObjects.map(obj => (
                  <div key={obj.id} style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                    <Text strong>
                      {obj.type === 'circle' ? '圆形' : '多边形'} #{obj.id.slice(-4)}
                    </Text>
                    {obj.area && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        面积: {obj.area.toFixed(2)} m²
                      </div>
                    )}
                    {obj.radius && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        半径: {obj.radius.toFixed(0)} m
                      </div>
                    )}
                  </div>
                ))}
              </Space>
            </Card>
          )}

          {/* 测量结果列表 */}
          {measurements.length > 0 && (
            <Card title={`测量结果 (${measurements.length})`}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {measurements.map(measurement => (
                  <div key={measurement.id} style={{ padding: '8px', background: '#f0f9ff', borderRadius: '4px' }}>
                    <Text strong>
                      {measurement.type === 'distance' ? '距离' : '面积'} #{measurement.id.slice(-4)}
                    </Text>
                    <div style={{ fontSize: '14px', color: '#1890ff' }}>
                      {measurement.value.toFixed(2)} {measurement.unit}
                    </div>
                  </div>
                ))}
              </Space>
            </Card>
          )}

          {/* 其他工具 */}
          <Card title="其他功能" style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                icon={<ScissorOutlined />}
                onClick={handleScreenshot}
                block
              >
                地图截图
              </Button>

              <Button
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                block
              >
                生成分享链接
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 右侧地图区域 */}
        <Col span={18}>
          <Card title="地图工具演示" style={{ height: '700px' }}>
            <div style={{ position: 'relative', width: '100%', height: '620px' }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                controls={{ scale: true, toolBar: true, mapType: true }}
                onCenterChange={setMapCenter}
                onZoomChange={setMapZoom}
                style={{ width: '100%', height: '100%' }}
              >
                {/* 搜索结果标记 */}
                {searchMarkers.length > 0 && (
                  <MarkerLayer
                    markers={searchMarkers}
                    onMarkerClick={(marker) => {
                      message.info(`${marker.title} - ${marker.data?.address || '暂无地址信息'}`);
                    }}
                  />
                )}

                {/* 确认的地点标记（星号） */}
                {confirmedPlaceMarker && (
                  <MarkerLayer
                    markers={[confirmedPlaceMarker]}
                    onMarkerClick={(marker) => {
                      message.info(`${marker.title} - ${marker.data?.address || '暂无地址信息'}`);
                    }}
                  />
                )}
                {/* 绘制层 */}
                <DrawingLayer
                  activeTool={activeTool}
                  drawingObjects={drawingObjects}
                  onDrawingComplete={handleDrawingComplete}
                />

                {/* 测量层 */}
                <MeasurementLayer
                  activeTool={activeTool}
                  measurements={measurements}
                  onMeasurementComplete={handleMeasurementComplete}
                />
              </MapContainer>

              {/* 活动工具提示 */}
              {activeTool !== ToolType.NONE && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(24, 144, 255, 0.9)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  zIndex: 1000
                }}>
                  {toolButtons.find(btn => btn.key === activeTool)?.description}
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => setActiveTool(ToolType.NONE)}
                    style={{ color: 'white', marginLeft: '8px' }}
                  />
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 截图预览模态框 */}
      <Modal
        title="地图截图"
        open={showScreenshotModal}
        onCancel={() => setShowScreenshotModal(false)}
        width={900}
        footer={[
          <Button key="download" type="primary">
            下载图片
          </Button>,
          <Button key="close" onClick={() => setShowScreenshotModal(false)}>
            关闭
          </Button>
        ]}
      >
        {screenshotData && (
          <div style={{ textAlign: 'center' }}>
            <img
              src={screenshotData}
              alt="地图截图"
              style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #d9d9d9' }}
            />
          </div>
        )}
        <Alert
          message="截图功能说明"
          description="当前为模拟截图功能。实际应用中需要集成专业的地图截图服务或使用浏览器截图API。"
          type="info"
          style={{ marginTop: '16px' }}
        />
      </Modal>

      {/* 分享链接模态框 */}
      <Modal
        title="分享地图"
        open={showShareModal}
        onCancel={() => setShowShareModal(false)}
        footer={[
          <Button key="copy" type="primary" onClick={handleCopyShareLink}>
            复制链接
          </Button>,
          <Button key="close" onClick={() => setShowShareModal(false)}>
            关闭
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>当前地图位置分享链接：</Text>
          <Input.TextArea
            value={shareLink}
            readOnly
            rows={3}
            style={{ resize: 'none' }}
          />
          <Text type="secondary">
            此链接包含当前地图的中心点坐标和缩放级别，分享给他人后可直接跳转到相同位置。
          </Text>
        </Space>
      </Modal>
    </div>
  );
};

export default MapTools;
