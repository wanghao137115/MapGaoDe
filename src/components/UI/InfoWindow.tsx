// src/components/UI/InfoWindow.tsx

// 导入React核心库和hooks
import React, { useState, useEffect } from 'react';
// 导入Ant Design组件：Card卡片、Button按钮、Space间距、Typography文字、Divider分割线、Drawer抽屉
import { Card, Button, Space, Typography, Divider, Drawer } from 'antd';
// 导入Ant Design图标：环境定位、电话、关闭、全局网站、时钟
import { EnvironmentOutlined, PhoneOutlined, CloseOutlined, GlobalOutlined, ClockCircleOutlined } from '@ant-design/icons';
// 导入Marker类型定义
import type { Marker } from '@/types';

// 从Typography中解构出Text和Title组件，用于显示文本和标题
const { Text, Title } = Typography;

// 定义函数：根据标记类型获取对应的显示信息（图标、标签、颜色）
const getMarkerInfo = (marker: Marker) => {
  // 定义不同标记类型的显示配置
  const typeInfo = {
    store: { icon: '🏪', label: '门店', color: '#1890ff' },      // 门店：蓝色
    warehouse: { icon: '🏭', label: '仓库', color: '#f5222d' },  // 仓库：红色
    vehicle: { icon: '🚛', label: '车辆', color: '#fa8c16' },    // 车辆：橙色
    user: { icon: '👤', label: '用户', color: '#52c41a' },       // 用户：绿色
  };

  // 返回对应类型的配置，如果找不到则返回默认配置
  return typeInfo[marker.type] || { icon: '📍', label: '标记', color: '#666' };
};

// 自定义Hook：检测当前是否为移动设备
const useIsMobile = () => {
  // 使用useState管理移动设备状态
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 定义检测移动设备的函数
    const checkIsMobile = () => {
      // 屏幕宽度小于768px认为是移动设备
      setIsMobile(window.innerWidth < 768);
    };

    // 立即执行一次检测
    checkIsMobile();
    // 监听窗口resize事件，实时更新设备类型
    window.addEventListener('resize', checkIsMobile);
    // 返回清理函数，组件卸载时移除事件监听器
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []); // 空依赖数组，只在组件挂载时执行

  // 返回是否为移动设备的布尔值
  return isMobile;
};

// 定义InfoWindow组件的props接口
interface InfoWindowProps {
    marker: Marker | null;  // 要显示的标记对象，可能为null
    visible: boolean;  // 弹窗是否可见
    onClose: () => void;  // 关闭弹窗的回调函数
    onAction?: (action: string, marker: Marker) => void;  // 操作按钮点击的回调函数
}

// 定义InfoWindow组件，是一个React函数组件
const InfoWindow: React.FC<InfoWindowProps> = ({
  marker,    // 解构props中的marker属性
  visible,   // 解构props中的visible属性
  onClose,   // 解构props中的onClose回调
  onAction,  // 解构props中的onAction回调
}) => {
  // 如果marker为null，直接返回null
  if (!marker) return null;

  // 调用自定义Hook获取是否为移动设备
  const isMobile = useIsMobile();

  // 调用函数获取当前标记的显示信息
  const markerInfo = getMarkerInfo(marker);

  // 定义桌面端弹窗组件
  const DesktopWindow = () => (
    // 外层div，绝对定位在地图右上角
    <div
      style={{
        position: 'absolute',  // 绝对定位
        top: 10,              // 距离顶部10px
        right: 10,            // 距离右侧10px
        width: 320,           // 固定宽度320px
        zIndex: 1000,         // 高层级，确保在地图上方
        // 根据visible状态应用不同的动画
        animation: visible ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-in',
      }}
    >
      {/* Antd Card组件作为弹窗主体 */}
      <Card
        size="small"  // 小尺寸card
        // 标题区域：显示标记图标和类型标签
        title={
          <Space>
            <span style={{ fontSize: '18px' }}>{markerInfo.icon}</span>  {/* 标记图标 */}
            <Text strong style={{ color: markerInfo.color }}>          {/* 类型标签，带颜色 */}
              {markerInfo.label}
            </Text>
          </Space>
        }
        // 右侧额外区域：关闭按钮
        extra={
          <Button
            type="text"      // 文本类型，无背景色
            size="small"     // 小尺寸
            icon={<CloseOutlined />}  // 关闭图标
            onClick={onClose}         // 点击关闭弹窗
          />
        }
        // 使用新的styles API设置body样式
        styles={{ body: { padding: '16px' } }}
      >
        {/* 调用内容组件，传入必要的props */}
        <WindowContent marker={marker} markerInfo={markerInfo} onAction={onAction} />
      </Card>
    </div>
  );

  // 定义移动端抽屉组件
  const MobileDrawer = () => (
    // 使用Antd Drawer组件，底部弹出样式
    <Drawer
      // 标题区域：显示标记图标和类型标签
      title={
        <Space>
          <span style={{ fontSize: '18px' }}>{markerInfo.icon}</span>
          <Text strong style={{ color: markerInfo.color }}>
            {markerInfo.label}
          </Text>
        </Space>
      }
      placement="bottom"  // 从底部弹出
      onClose={onClose}   // 关闭回调
      open={visible}      // 是否打开（Antd 5.x使用open代替visible）
      height="auto"       // 高度自适应内容
      style={{ maxHeight: '70vh' }}  // 最大高度为屏幕高度的70%
    >
      {/* 抽屉内容容器，添加内边距 */}
      <div style={{ padding: '8px 0' }}>
        <WindowContent marker={marker} markerInfo={markerInfo} onAction={onAction} />
      </div>
    </Drawer>
  );

  // 定义弹窗内容组件（被桌面和移动端复用）
  const WindowContent = ({ marker, markerInfo, onAction }: any) => (
    <>
      {/* 标记标题区域 */}
      <Title level={4} style={{ marginBottom: 12 }}>
        {marker.title}  {/* 显示标记的标题 */}
      </Title>

      {/* 位置和详细信息区域 */}
      <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
        {/* 基础位置信息：经纬度坐标 */}
        <div>
          <EnvironmentOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          <Text>
            {marker.position.lat.toFixed(6)}, {marker.position.lng.toFixed(6)}
          </Text>
        </div>

        {/* 详细地址信息（如果存在） */}
        {marker.data?.address && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            📍 {marker.data.address}
          </div>
        )}

        {/* 联系电话信息（如果存在） */}
        {marker.data?.phone && (
          <div>
            <PhoneOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            <Text>{marker.data.phone}</Text>
          </div>
        )}

        {/* 网站链接信息（如果存在） */}
        {marker.data?.website && (
          <div>
            <GlobalOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            {/* 网站链接，点击在新标签页打开 */}
            <a href={marker.data.website} target="_blank" rel="noopener noreferrer">
              {marker.data.website}
            </a>
          </div>
        )}

        {/* 描述信息（如果存在） */}
        {marker.data?.description && (
          <div style={{ marginTop: 8 }}>
            <Text strong style={{ fontSize: '12px', color: '#666' }}>
              描述：
            </Text>
            <div style={{ marginTop: 4, fontSize: '14px' }}>
              {marker.data.description}
            </div>
          </div>
        )}

        {/* 门店特殊信息 */}
        {marker.type === 'store' && (
          <>
            {/* 营业时间 */}
            {marker.data?.businessHours && (
              <div>
                <ClockCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                <Text>营业时间: {marker.data.businessHours}</Text>
              </div>
            )}

            {/* 评分 */}
            {marker.data?.rating && (
              <div>
                <span style={{ color: '#faad14', marginRight: 8 }}>⭐</span>
                <Text>评分: {marker.data.rating}</Text>
              </div>
            )}

            {/* 服务范围 */}
            {marker.data?.serviceRadius && marker.data.serviceRadius > 0 && (
              <div>
                <EnvironmentOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                <Text>服务范围: {marker.data.serviceRadius}米</Text>
              </div>
            )}

            {/* 门店描述 */}
            {marker.data?.description && (
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>
                  简介：
                </Text>
                <div style={{ marginTop: 4, fontSize: '14px' }}>
                  {marker.data.description}
                </div>
              </div>
            )}

            {/* 门店类型和状态标签 */}
            <div style={{ marginTop: 8 }}>
              {marker.data?.storeType && (
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  backgroundColor: '#e6f7ff',
                  color: '#1890ff',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginRight: '8px'
                }}>
                  {marker.data.storeType === 'supermarket' ? '超市' :
                   marker.data.storeType === 'restaurant' ? '餐厅' :
                   marker.data.storeType === 'pharmacy' ? '药店' :
                   marker.data.storeType === 'bank' ? '银行' : '其他'}
                </span>
              )}

              {marker.data?.status && (
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  backgroundColor:
                    marker.data.status === 'open' ? '#f6ffed' :
                    marker.data.status === 'closed' ? '#fff2f0' :
                    marker.data.status === 'break' ? '#fff7e6' : '#f5f5f5',
                  color:
                    marker.data.status === 'open' ? '#52c41a' :
                    marker.data.status === 'closed' ? '#ff4d4f' :
                    marker.data.status === 'break' ? '#faad14' : '#666',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {marker.data.status === 'open' ? '营业中' :
                   marker.data.status === 'closed' ? '已关闭' :
                   marker.data.status === 'break' ? '休息中' : '未知'}
                </span>
              )}
            </div>
          </>
        )}
      </Space>

      {/* 分割线 */}
      <Divider style={{ margin: '16px 0' }} />

      {/* 操作按钮区域 */}
      <Space size="middle" wrap>  {/* wrap允许按钮换行 */}
        {/* 导航按钮 - 始终显示 */}
        <Button
          type="primary"  // 主按钮样式
          icon={<EnvironmentOutlined />}
          onClick={() => onAction?.('navigate', marker)}  // 点击触发导航操作
          size={isMobile ? 'large' : 'middle'}  // 移动端大按钮，桌面端中等按钮
        >
          导航到这里
        </Button>

        {/* 拨打电话按钮 - 仅在有电话时显示 */}
        {marker.data?.phone && (
          <Button
            icon={<PhoneOutlined />}
            onClick={() => onAction?.('call', marker)}  // 点击触发拨打电话操作
            size={isMobile ? 'large' : 'middle'}
          >
            拨打电话
          </Button>
        )}

        {/* 访问网站按钮 - 仅在有网站时显示 */}
        {marker.data?.website && (
          <Button
            icon={<GlobalOutlined />}
            onClick={() => onAction?.('website', marker)}  // 点击触发访问网站操作
            size={isMobile ? 'large' : 'middle'}
          >
            访问网站
          </Button>
        )}
      </Space>

      {/* 时间信息区域 */}
      <div style={{ marginTop: 16, fontSize: '12px', color: '#999', textAlign: 'right' }}>
        创建时间: {marker.createdAt.toLocaleString()}  {/* 显示标记创建时间 */}
      </div>
    </>
  );

  // 根据设备类型渲染不同的弹窗组件，如果不可见则返回null
  if (!visible) return null;
  return isMobile ? <MobileDrawer /> : <DesktopWindow />;
};

// 定义CSS动画样式字符串
const styles = `
  @keyframes slideInRight {  // 从右侧滑入动画
    from {
      transform: translateX(100%);  // 起始位置：在右侧100%位置
      opacity: 0;                   // 起始透明度：完全透明
    }
    to {
      transform: translateX(0);     // 结束位置：正常位置
      opacity: 1;                   // 结束透明度：完全不透明
    }
  }

  @keyframes slideOutRight {  // 向右侧滑出动画
    from {
      transform: translateX(0);     // 起始位置：正常位置
      opacity: 1;                   // 起始透明度：完全不透明
    }
    to {
      transform: translateX(100%);  // 结束位置：向右移出100%
      opacity: 0;                   // 结束透明度：完全透明
    }
  }
`;

// 在客户端环境（浏览器）中注入CSS样式
if (typeof document !== 'undefined') {
  // 创建style元素
  const styleSheet = document.createElement('style');
  // 设置样式内容
  styleSheet.textContent = styles;
  // 将样式元素添加到head中
  document.head.appendChild(styleSheet);
}

// 导出InfoWindow组件
export default InfoWindow;