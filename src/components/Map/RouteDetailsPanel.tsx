// src/components/Map/RouteDetailsPanel.tsx
// 路径规划结果详情展示组件

import React from 'react';
import { Card, Descriptions, List, Typography } from 'antd';
import { ClockCircleOutlined, DollarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { RouteResult, RouteStep } from '@/types';

// 从Typography中解构Text组件
const { Text } = Typography;

// 组件Props接口定义
interface RouteDetailsPanelProps {
  routeData: RouteResult;  // 路径规划结果数据
}

// 主组件定义
const RouteDetailsPanel: React.FC<RouteDetailsPanelProps> = ({ routeData }) => {

  // 格式化距离显示的辅助函数
  const formatDistance = (meters: number): string => {
    // 大于1000米时显示为公里
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;  // 保留一位小数
    }
    // 小于1000米时显示为米
    return `${meters}m`;
  };

  // 格式化时间显示的辅助函数
  const formatDuration = (seconds: number): string => {
    // 计算小时和分钟
    const hours = Math.floor(seconds / 3600);     // 整小时数
    const minutes = Math.floor((seconds % 3600) / 60);  // 剩余分钟数
    
    // 根据时长显示不同格式
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;  // 超过1小时
    }
    return `${minutes}分钟`;  // 少于1小时
  };

  // 格式化收费显示的辅助函数
  const formatToll = (toll?: number): string => {
    // 如果没有收费信息或收费为0，显示"免费"
    if (!toll || toll === 0) return '免费';
    // 显示具体金额
    return `¥${toll.toFixed(0)}`;  // 取整显示
  };

  // 渲染组件UI
  return (
    <div style={{ marginTop: 16 }}>
      {/* 路径概览卡片 */}
      <Card size="small" title="🗺️ 路径概览">
        {/* 使用Descriptions组件展示关键信息 */}
        <Descriptions size="small" column={1}>  {/* 小尺寸，一列显示 */}
          
          {/* 总距离信息 */}
          <Descriptions.Item 
            label={
              <><EnvironmentOutlined style={{ marginRight: 4 }} />总距离</>
            }
          >
            <Text strong style={{ color: '#1890ff' }}>
              {formatDistance(routeData.distance)}
            </Text>
          </Descriptions.Item>
          
          {/* 预计时间信息 */}
          <Descriptions.Item 
            label={
              <><ClockCircleOutlined style={{ marginRight: 4 }} />预计时间</>
            }
          >
            <Text strong style={{ color: '#52c41a' }}>
              {formatDuration(routeData.duration)}
            </Text>
          </Descriptions.Item>
          
          {/* 收费信息（仅驾车模式显示） */}
          {routeData.tolls !== undefined && (
            <Descriptions.Item 
              label={
                <><DollarOutlined style={{ marginRight: 4 }} />收费</>
              }
            >
              <Text strong style={{ color: '#fa8c16' }}>
                {formatToll(routeData.tolls)}
              </Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 详细步骤卡片（如果有步骤信息） */}
      {routeData.steps && routeData.steps.length > 0 && (
        <Card size="small" title="📋 详细步骤" style={{ marginTop: 16 }}>
          {/* 使用List组件展示步骤列表 */}
          <List
            size="small"  // 小尺寸
            dataSource={routeData.steps}  // 数据源
            renderItem={(step: RouteStep, index: number) => (
              <List.Item>  {/* 列表项 */}
                <div style={{ width: '100%' }}>
                  {/* 步骤标题和序号 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: 4 
                  }}>
                    <Text strong>
                      {index + 1}. {step.instruction}  {/* 步骤序号和说明 */}
                    </Text>
                  </div>
                  
                  {/* 步骤的距离和时间信息 */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 16,           // 元素间距
                    fontSize: '12px',  // 小字体
                    color: '#666'      // 灰色文字
                  }}>
                    <span>距离: {formatDistance(step.distance)}</span>
                    <span>时间: {formatDuration(step.duration)}</span>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default RouteDetailsPanel;