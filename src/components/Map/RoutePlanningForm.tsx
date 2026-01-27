// src/components/Map/RoutePlanningForm.tsx
// 路径规划表单组件 - 提供起点、终点输入和规划模式选择

import React, { useState } from 'react';
import { Form, Input, Button, Select, Space, Divider } from 'antd';
import { EnvironmentOutlined, SwapOutlined } from '@ant-design/icons';
import type { MapPosition } from '@/types';

// Select组件的Option子组件
const { Option } = Select;

// 表单组件的props接口定义
interface RoutePlanningFormProps {
  onPlanRoute: (params: RoutePlanningParams) => void;  // 规划路由的回调函数
  planning: boolean;  // 是否正在规划中（控制loading状态）
}

// 路径规划参数接口定义
export interface RoutePlanningParams {
  mode: 'driving' | 'walking';      // 规划模式：驾车或步行
  origin: MapPosition;               // 起点坐标
  destination: MapPosition;          // 终点坐标
  originName?: string;               // 起点名称（可选）
  destinationName?: string;          // 终点名称（可选）
  waypoints?: MapPosition[];         // 途径点坐标数组（可选）
}

// 主组件定义
const RoutePlanningForm: React.FC<RoutePlanningFormProps> = ({
  onPlanRoute,  // 规划回调函数
  planning      // 规划状态
}) => {
  // 使用Antd的Form Hook
  const [form] = Form.useForm();
  // 规划模式状态：驾车或步行
  const [mode, setMode] = useState<'driving' | 'walking'>('driving');

  // 预设常用位置数据 - 用户可以快速选择这些位置
  const presetLocations = [
    { name: '天安门', position: { lng: 116.3974, lat: 39.9093 } },
    { name: '故宫', position: { lng: 116.4039, lat: 39.9183 } },
    { name: '北京站', position: { lng: 116.4272, lat: 39.9047 } },
    { name: '首都机场', position: { lng: 116.5928, lat: 40.0719 } },
  ];

  // 处理表单提交的函数
  const handleSubmit = (values: any) => {
    // 解析坐标字符串的辅助函数
    const parsePosition = (coordStr: string): MapPosition | null => {
      // 如果输入为空，返回null
      if (!coordStr) return null;

      // 如果是预设位置名称，查找对应的坐标
      const preset = presetLocations.find(loc => loc.name === coordStr);
      if (preset) {
        return preset.position;
      }

      // 尝试解析经纬度坐标格式 (经度,纬度)
      const coords = coordStr.split(',').map(s => parseFloat(s.trim()));
      if (coords.length === 2 && coords.every(c => !isNaN(c))) {
        const position = { lng: coords[0], lat: coords[1] };
        return position;
      }
      
      // 解析失败
      console.warn(`⚠️ 坐标解析失败: ${coordStr}`); // 调试日志
      return null;
    };

    // 解析起点和终点坐标
    const origin = parsePosition(values.origin);
    const destination = parsePosition(values.destination);

    // 验证坐标是否有效
    if (!origin || !destination) {
      console.error('❌ 坐标解析失败，无法规划路径');
      return;
    }

    // 调用父组件的规划函数
    onPlanRoute({
      mode,                    // 规划模式
      origin,                  // 起点坐标
      destination,            // 终点坐标
      originName: values.origin,      // 起点名称
      destinationName: values.destination  // 终点名称
    });
  };

  // 交换起点和终点的函数
  const handleSwap = () => {
    // 获取当前表单值
    const currentValues = form.getFieldsValue();
    // 设置交换后的值
    form.setFieldsValue({
      origin: currentValues.destination,
      destination: currentValues.origin
    });
  };

  // 使用当前位置作为起点或终点的函数
  const handleUseCurrentLocation = (field: 'origin' | 'destination') => {
    // 检查浏览器是否支持地理定位
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // 成功获取位置
        (position) => {
          const { latitude, longitude } = position.coords;
          // 格式化为坐标字符串
          const coordStr = `${longitude.toFixed(6)},${latitude.toFixed(6)}`;

          // 设置到表单对应字段
          form.setFieldsValue({ [field]: coordStr });
        },
        // 获取位置失败
        (error) => {
          console.error('❌ 获取位置失败:', error);
          // 这里可以显示用户友好的错误提示
        }
      );
    } else {
      console.warn('⚠️ 浏览器不支持地理定位');
    }
  };

  // 渲染组件UI
  return (
    // Antd表单组件，垂直布局
    <Form
      form={form}           // 表单实例
      layout="vertical"     // 垂直布局
      onFinish={handleSubmit} // 提交处理函数
      initialValues={{      // 初始值
        origin: '天安门',
        destination: '故宫',
        mode: 'driving'
      }}
    >
      {/* 规划模式选择 */}
      <Form.Item label="规划模式">
        <Select 
          value={mode}        // 当前选中值
            onChange={(value) => {
              setMode(value);   // 更新本地状态
            }}
        >
          <Option value="driving">🚗 驾车</Option>
          <Option value="walking">🚶 步行</Option>
        </Select>
      </Form.Item>

      {/* 起点输入框 */}
      <Form.Item
        label="起点"
        name="origin"
        rules={[{ required: true, message: '请输入起点' }]} // 必填验证
      >
        <Input
          placeholder="输入位置名称或坐标 (经度,纬度)"
          suffix={  // 输入框后缀按钮
            <Button
              type="text"
              size="small"
              onClick={() => handleUseCurrentLocation('origin')}
              style={{ border: 'none', padding: 0 }}
              title="使用当前位置作为起点"
            >
              📍  {/* 位置图标 */}
            </Button>
          }
        />
      </Form.Item>

      {/* 交换起点终点按钮 */}
      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <Button
          type="text"
          icon={<SwapOutlined />}
          onClick={handleSwap}
          size="small"
          title="交换起点和终点"
        >
          交换起点终点
        </Button>
      </div>

      {/* 终点输入框 */}
      <Form.Item
        label="终点"
        name="destination"
        rules={[{ required: true, message: '请输入终点' }]} // 必填验证
      >
        <Input
          placeholder="输入位置名称或坐标 (经度,纬度)"
          suffix={  // 输入框后缀按钮
            <Button
              type="text"
              size="small"
              onClick={() => handleUseCurrentLocation('destination')}
              style={{ border: 'none', padding: 0 }}
              title="使用当前位置作为终点"
            >
              📍  {/* 位置图标 */}
            </Button>
          }
        />
      </Form.Item>

      {/* 分割线 */}
      <Divider style={{ margin: '16px 0' }} />

      {/* 常用位置快速选择区域 */}
      <div style={{ marginBottom: 16 }}>
        {/* 说明文字 */}
        <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
          常用位置：
        </div>
        {/* 位置按钮组 */}
        <Space wrap>  {/* wrap允许换行 */}
          {presetLocations.map(location => (
            <Button
              key={location.name}  // React key
              size="small"
            onClick={() => {
              // 获取当前表单值
              const currentValues = form.getFieldsValue();
              // 智能选择：优先填入空的字段
              if (!currentValues.origin) {
                form.setFieldsValue({ origin: location.name });
              } else if (!currentValues.destination) {
                form.setFieldsValue({ destination: location.name });
              } else {
                // 如果都有值，默认替换起点
                form.setFieldsValue({ origin: location.name });
              }
            }}
            >
              {location.name}  {/* 按钮文本 */}
            </Button>
          ))}
        </Space>
      </div>

      {/* 提交按钮 */}
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"  // 表单提交按钮
          loading={planning} // 显示loading状态
          block             // 宽度100%
          icon={<EnvironmentOutlined />}
        >
          {mode === 'driving' ? '开始驾车规划' : '开始步行规划'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RoutePlanningForm;