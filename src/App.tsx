import React from 'react';
import { Layout, Menu } from 'antd';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  EnvironmentOutlined,
  CarOutlined,
  ShopOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import MapPlayground from '@/pages/MapPlayground';
import LogisticsTracking from '@/pages/LogisticsTracking';
import StoreLocator from '@/pages/StoreLocator';
import MapTools from '@/pages/MapTools';

const { Header, Sider, Content } = Layout;

const useSelectedKey = () => {
  const location = useLocation();

  if (location.pathname.startsWith('/logistics')) return 'logistics';
  if (location.pathname.startsWith('/stores')) return 'stores';
  if (location.pathname.startsWith('/tools')) return 'tools';
  return 'map';
};

// 根组件当前仅作为布局占位，后续会接入路由和具体业务页面
const App: React.FC = () => {
  const selectedKey = useSelectedKey();

  const menuItems = [
    {
      key: 'map',
      icon: <EnvironmentOutlined />,
      label: <Link to="/map">基础地图演示</Link>,
    },
    {
      key: 'logistics',
      icon: <CarOutlined />,
      label: <Link to="/logistics">物流追踪</Link>,
    },
    {
      key: 'stores',
      icon: <ShopOutlined />,
      label: <Link to="/stores">门店定位</Link>,
    },
    {
      key: 'tools',
      icon: <ToolOutlined />,
      label: <Link to="/tools">地图工具</Link>,
    },
  ];
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint='lg' collapsedWidth='0'>
        <div 
            style={{
              height: 48,
              margin: 16,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
            }}>
          智能地图平台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        {/* <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 18 }}>React 智能地图应用平台</h1>
        </Header> */}

        <Content style={{  background: '#fff'}}>
          <Routes>
            {/* 默认跳到基础地图页 */}
            <Route path="/" element={<Navigate to="/" replace />} />
            <Route path="/map" element={<MapPlayground />} />
            <Route path="/logistics" element={<LogisticsTracking />} />
            <Route path="/stores" element={<StoreLocator />} />
            <Route path="/tools" element={<MapTools />} />
            {/* 简单 404 占位 */}
            <Route path="*" element={<div>页面不存在</div>} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

// 直接导出 App 组件：
export default App;