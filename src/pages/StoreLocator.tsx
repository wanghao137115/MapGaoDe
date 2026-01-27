import React, { useState, useCallback, useMemo,useEffect  } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Input,
  Button,
  Space,
  Tag,
  List,
  Avatar,
  Badge,
  message,
} from 'antd';
import {
  EnvironmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';

import MapContainer from '@/components/Map/MapContainer';
import MarkerLayer from '@/components/Map/MarkerLayer';
import ServiceAreaLayer from '@/components/Map/ServiceAreaLayer';
import PlaceSearch from '@/components/Map/PlaceSearch';
import InfoWindow from '@/components/UI/InfoWindow';
import LocationErrorAlert from '@/components/UI/LocationErrorAlert';
import { useGeolocation } from '@/hooks/useGeolocation';

import type { MapPosition, Marker } from '@/types';

// 门店状态枚举
enum StoreStatus {
  OPEN = 'open',       // 营业中
  CLOSED = 'closed',   // 已关闭
  BREAK = 'break',     // 休息中
}

// 门店类型枚举
enum StoreType {
  SUPERMARKET = 'supermarket',   // 超市
  RESTAURANT = 'restaurant',     // 餐厅
  PHARMACY = 'pharmacy',         // 药店
  BANK = 'bank',                 // 银行
  OTHER = 'other',               // 其他
}

// 门店信息接口定义
interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: StoreType;
  status: StoreStatus;
  position: MapPosition;
  businessHours: string; // 营业时间
  rating: number;       // 评分
  distance?: number;    // 距离（公里）
  serviceRadius: number; // 服务半径（米）
  description?: string;  // 门店描述
}

// 门店定位页面组件
const StoreLocator: React.FC = () => {
  // 获取用户当前位置
  const {
    position: userPosition,
    loading: locationLoading,
    error: locationError,
    refetch: refetchLocation
  } = useGeolocation();

  // 地图中心点状态 - 跟随用户位置动态调整
  const [mapCenter, setMapCenter] = useState<MapPosition>(
    userPosition || { lng: 116.4074, lat: 39.9093 }
  );
  const [mapZoom, setMapZoom] = useState<number>(12);

  // 门店数据状态
  const [stores] = useState<Store[]>([
    {
      id: 's001',
      name: '华润万家超市',
      address: '北京市朝阳区建国门外大街1号',
      phone: '010-12345678',
      type: StoreType.SUPERMARKET,
      status: StoreStatus.OPEN,
      position: { lng: 116.4074, lat: 39.9093 },
      businessHours: '08:00-22:00',
      rating: 4.2,
      serviceRadius: 1000, // 1公里服务范围
      description: '大型综合超市，提供新鲜蔬果、日用品、食品饮料等各类商品'
    },
    {
      id: 's002',
      name: '麦当劳餐厅',
      address: '北京市朝阳区建国门北大街8号',
      phone: '010-87654321',
      type: StoreType.RESTAURANT,
      status: StoreStatus.OPEN,
      position: { lng: 116.4174, lat: 39.9193 },
      businessHours: '07:00-23:00',
      rating: 4.5,
      serviceRadius: 500, // 500米外卖范围
      description: '全球知名快餐连锁，提供汉堡、薯条、可乐等经典美式快餐'
    },
    {
      id: 's003',
      name: '国大药房',
      address: '北京市朝阳区建国路88号',
      phone: '010-11223344',
      type: StoreType.PHARMACY,
      status: StoreStatus.OPEN,
      position: { lng: 116.3874, lat: 39.9293 },
      businessHours: '09:00-21:00',
      rating: 4.0,
      serviceRadius: 2000, // 2公里配送范围
      description: '专业连锁药店，提供各类药品、保健品、医疗器械和健康咨询服务'
    },
    {
      id: 's004',
      name: '中国银行',
      address: '北京市朝阳区建国门外大街2号',
      phone: '010-55667788',
      type: StoreType.BANK,
      status: StoreStatus.BREAK,
      position: { lng: 116.3974, lat: 39.9393 },
      businessHours: '09:00-17:00',
      rating: 3.8,
      serviceRadius: 0, // 银行无服务范围概念
      description: '国有商业银行，提供存款、贷款、转账汇款等全方位金融服务'
    },
    {
      id: 's005',
      name: '星巴克咖啡',
      address: '北京市朝阳区建国路甲1号',
      phone: '010-99887766',
      type: StoreType.OTHER,
      status: StoreStatus.CLOSED,
      position: { lng: 116.4274, lat: 39.9493 },
      businessHours: '07:00-22:00',
      rating: 4.3,
      serviceRadius: 300, // 300米咖啡配送范围
      description: '全球知名咖啡连锁品牌，提供优质咖啡、茶饮和轻食'
    },
  ]);

  // UI状态
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  // 筛选状态
  const [searchText, setSearchText] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<StoreType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<StoreStatus | 'all'>('all');

  // 搜索结果标记
  const [searchMarkers, setSearchMarkers] = useState<any[]>([]);
  // 确认的地点标记（星号）
  const [confirmedPlaceMarker, setConfirmedPlaceMarker] = useState<any>(null);

  // 当获取到用户位置时，更新地图中心点
  useEffect(() => {
    if (userPosition) {
      setMapCenter(userPosition);
      setMapZoom(14); // 门店定位时适当放大
    }
  }, [userPosition]);

  // 处理地点选择（点击搜索结果）
  const handlePlaceSelect = useCallback((place: any) => {
    // 只设置选中状态，不立即跳转地图
    // 用户可以通过回车确认来跳转
  }, []);

  // 处理地点确认（回车确定）
  const handlePlaceConfirm = useCallback((place: any) => {
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

    setConfirmedPlaceMarker(starMarker);
    message.success(`已锁定门店位置: ${place.name}`);
  }, []);

  // 获取门店状态信息
  const getStoreStatusInfo = (status: StoreStatus) => {
    switch (status) {
      case StoreStatus.OPEN:
        return { color: 'green', text: '营业中' };
      case StoreStatus.CLOSED:
        return { color: 'red', text: '已关闭' };
      case StoreStatus.BREAK:
        return { color: 'orange', text: '休息中' };
      default:
        return { color: 'default', text: '未知' };
    }
  };

  // 获取门店类型信息
  const getStoreTypeInfo = (type: StoreType) => {
    switch (type) {
      case StoreType.SUPERMARKET:
        return { text: '超市', icon: '🏪' };
      case StoreType.RESTAURANT:
        return { text: '餐厅', icon: '🍽️' };
      case StoreType.PHARMACY:
        return { text: '药店', icon: '💊' };
      case StoreType.BANK:
        return { text: '银行', icon: '🏦' };
      case StoreType.OTHER:
        return { text: '其他', icon: '🏢' };
      default:
        return { text: '未知', icon: '📍' };
    }
  };

  // 筛选后的门店列表
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           store.address.toLowerCase().includes(searchText.toLowerCase());
      const matchesType = selectedType === 'all' || store.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || store.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [stores, searchText, selectedType, selectedStatus]);

  // 处理门店点击
  const handleStoreClick = useCallback((store: Store) => {
    setSelectedStore(store);
    setShowInfoWindow(true);
  }, []);

  // 处理标记点击
  const handleMarkerClick = useCallback((marker: Marker) => {
    const store = stores.find(s => s.id === marker.id);
    if (store) {
      handleStoreClick(store);
    }
  }, [stores, handleStoreClick]);

  // 渲染门店列表项
  const renderStoreItem = (store: Store) => {
    const statusInfo = getStoreStatusInfo(store.status);
    const typeInfo = getStoreTypeInfo(store.type);

    return (
      <List.Item
        key={store.id}
        style={{
          cursor: 'pointer',
          padding: '12px',
          border: selectedStore?.id === store.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
          borderRadius: '8px',
          marginBottom: '8px'
        }}
        onClick={() => handleStoreClick(store)}
      >
        <List.Item.Meta
          avatar={
            <Avatar
              size="large"
              style={{
                backgroundColor: statusInfo.color === 'green' ? '#52c41a' :
                                statusInfo.color === 'red' ? '#ff4d4f' :
                                statusInfo.color === 'orange' ? '#faad14' : '#d9d9d9'
              }}
            >
              {typeInfo.icon}
            </Avatar>
          }
          title={
            <Space>
              <span>{store.name}</span>
              <Badge status={statusInfo.color as any} text={statusInfo.text} />
            </Space>
          }
          description={
            <div>
              <div style={{ marginBottom: '4px' }}>
                <EnvironmentOutlined style={{ marginRight: '4px' }} />
                {store.address}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size="small">
                  <PhoneOutlined />
                  <span>{store.phone}</span>
                </Space>
                <Space size="small">
                  <ClockCircleOutlined />
                  <span>{store.businessHours}</span>
                </Space>
              </div>
              <div style={{ marginTop: '4px' }}>
                <Tag color="blue">{typeInfo.text}</Tag>
                <span style={{ marginLeft: '8px', color: '#faad14' }}>
                  ⭐ {store.rating}
                </span>
                {store.serviceRadius > 0 && (
                  <span style={{ marginLeft: '8px', color: '#1890ff', fontSize: '12px' }}>
                    📍 {store.serviceRadius}米服务范围
                  </span>
                )}
              </div>
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={16}>
        {/* 左侧筛选和列表面板 */}
        <Col span={8}>
          {/* 地点搜索 */}
          <Card style={{ marginBottom: '16px' }}>
            <PlaceSearch
              placeholder="搜索地点、商圈、地址..."
              city="北京"
              onPlaceSelect={handlePlaceSelect}
              onPlaceConfirm={handlePlaceConfirm}
              style={{ marginBottom: 0 }}
            />
          </Card>

          {/* 筛选条件 */}
          <Card title="门店筛选" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="搜索门店名称或地址"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              <Select
                placeholder="选择门店类型"
                style={{ width: '100%' }}
                value={selectedType}
                onChange={(value) => setSelectedType(value)}
              >
                <Select.Option value="all">全部类型</Select.Option>
                <Select.Option value={StoreType.SUPERMARKET}>超市</Select.Option>
                <Select.Option value={StoreType.RESTAURANT}>餐厅</Select.Option>
                <Select.Option value={StoreType.PHARMACY}>药店</Select.Option>
                <Select.Option value={StoreType.BANK}>银行</Select.Option>
                <Select.Option value={StoreType.OTHER}>其他</Select.Option>
              </Select>

              <Select
                placeholder="选择营业状态"
                style={{ width: '100%' }}
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value)}
              >
                <Select.Option value="all">全部状态</Select.Option>
                <Select.Option value={StoreStatus.OPEN}>营业中</Select.Option>
                <Select.Option value={StoreStatus.BREAK}>休息中</Select.Option>
                <Select.Option value={StoreStatus.CLOSED}>已关闭</Select.Option>
              </Select>

              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText('');
                  setSelectedType('all');
                  setSelectedStatus('all');
                  message.success('已清除所有筛选条件');
                }}
                block
              >
                清除筛选
              </Button>
            </Space>
          </Card>

          {/* 门店列表 */}
          <Card title={`门店列表 (${filteredStores.length})`} style={{ height: '600px' }}>
            <List
              dataSource={filteredStores}
              renderItem={renderStoreItem}
              style={{ height: '520px', overflow: 'auto' }}
            />
          </Card>
        </Col>

        {/* 右侧地图区域 */}
        <Col span={16}>
          <Card title="门店地图" style={{ height: '700px' }}>
            {/* 定位错误提示 */}
            <LocationErrorAlert
              error={locationError}
              onRetry={refetchLocation}
              onManualInput={() => message.info('手动输入功能开发中')}
            />
            <div style={{ position: 'relative', width: '100%', height: '620px' }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                controls={{ scale: true, toolBar: true, mapType: true }}
                style={{ width: '100%', height: '100%' }}
              >
                {/* 门店服务范围层 */}
                <ServiceAreaLayer
                  serviceAreas={filteredStores
                    .filter(store => store.serviceRadius > 0) // 只显示有服务范围的门店
                    .map(store => ({
                      id: store.id,
                      center: store.position,
                      radius: store.serviceRadius,
                      fillColor: store.status === StoreStatus.OPEN ? '#52c41a' :
                                store.status === StoreStatus.BREAK ? '#faad14' : '#ff4d4f',
                      strokeColor: store.status === StoreStatus.OPEN ? '#389e0d' :
                                 store.status === StoreStatus.BREAK ? '#d48806' : '#cf1322',
                      visible: true
                    }))}
                />

                {/* 门店标记层 */}
                <MarkerLayer
                  markers={filteredStores.map(store => {
                    const statusInfo = getStoreStatusInfo(store.status);
                    const typeInfo = getStoreTypeInfo(store.type);

                    return {
                      id: store.id,
                      type: 'store' as const,
                      title: `${store.name} - ${typeInfo.text}`,
                      position: store.position,
                      icon: statusInfo.color === 'green' ? 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png' :
                           statusInfo.color === 'red' ? 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png' :
                           'https://webapi.amap.com/theme/v1.3/markers/n/mark_y.png',
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      data: {
                        status: store.status === StoreStatus.OPEN ? 'active' :
                               store.status === StoreStatus.CLOSED ? 'inactive' : 'inactive',
                        rating: store.rating,
                        businessHours: store.businessHours,
                        storeType: store.type,
                        phone: store.phone,
                        address: store.address,
                        serviceRadius: store.serviceRadius,
                        description: store.description
                      }
                    };
                  })}
                  onMarkerClick={handleMarkerClick}
                />

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
              </MapContainer>

              {/* 门店信息弹窗 */}
              {showInfoWindow && selectedStore && (
                <InfoWindow
                  marker={{
                    id: selectedStore.id,
                    type: 'store',
                    title: selectedStore.name,
                    position: selectedStore.position,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    data: {
                      address: selectedStore.address,
                      phone: selectedStore.phone,
                      businessHours: selectedStore.businessHours,
                      rating: selectedStore.rating,
                      status: selectedStore.status === StoreStatus.OPEN ? 'active' :
                             selectedStore.status === StoreStatus.CLOSED ? 'inactive' : 'inactive',
                      storeType: selectedStore.type
                    }
                  }}
                  visible={showInfoWindow}
                  onClose={() => setShowInfoWindow(false)}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StoreLocator;


