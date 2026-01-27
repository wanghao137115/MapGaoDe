// src/components/Map/MarkerList.tsx

import React, { useState } from 'react';  // React核心库，用于创建组件
import { List, Button, Checkbox, Space, Typography, Modal, Form, Input, Select, message } from 'antd';  // Ant Design UI组件库
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';  // Ant Design图标库
import type { Marker } from '@/types';  // 导入Marker类型定义

const { Text } = Typography;  // 从Typography中解构出Text组件，用于显示文本
const { Option } = Select;    // 从Select中解构出Option组件，用于下拉选项

// 定义组件的props接口，描述组件接收的属性
interface MarkerListProps {
  markers: Marker[];  // 标记数组，包含所有要显示的标记
  selectedMarkerId?: string | null;  // 当前选中的标记ID
  onDeleteMarkers: (ids: string[]) => void;  // 删除标记的回调函数，接收要删除的标记ID数组
  onUpdateMarker: (id: string, updates: Partial<Marker>) => void;  // 更新标记的回调函数
  onAddMarker: (position: { lng: number; lat: number }) => void;   // 添加标记的回调函数（这里实际没用到）
}

// 定义标记列表组件，是一个React函数组件
const MarkerList: React.FC<MarkerListProps> = ({
  markers,          // 解构props中的markers属性
  selectedMarkerId, // 解构props中的selectedMarkerId
  onDeleteMarkers,  // 解构props中的onDeleteMarkers回调
  onUpdateMarker,   // 解构props中的onUpdateMarker回调
  onAddMarker,      // 解构props中的onAddMarker回调（未使用）
}) => {
  // 使用useState Hook管理选中的标记ID数组
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // 使用useState Hook管理当前正在编辑的标记
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  // 使用Form.useForm创建表单实例，用于编辑标记时管理表单状态
  const [editForm] = Form.useForm();

  // 处理全选/取消全选的函数
  const handleSelectAll = (checked: boolean) => {
    // 如果checked为true，选择所有标记；否则清空选择
    setSelectedIds(checked ? markers.map(m => m.id) : []);
  };

  // 处理单个标记选择的函数
  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => 
      // 如果checked为true，添加该ID到选中数组；否则从数组中移除
      checked ? [...prev, id] : prev.filter(item => item !== id)
    );
  };

  // 处理批量删除的函数
  const handleBatchDelete = () => {
    // 检查是否有选中的标记
    if (selectedIds.length === 0) {
      message.warning('请选择要删除的标记');  // 显示警告消息
      return;  // 提前返回，不执行删除
    }
    
    // 显示确认对话框
    Modal.confirm({
      title: '确认删除',  // 对话框标题
      content: `确定要删除选中的 ${selectedIds.length} 个标记吗？`,  // 对话框内容
      onOk: () => {  // 用户点击确定时的回调
        onDeleteMarkers(selectedIds);  // 调用父组件的删除函数
        setSelectedIds([]);  // 清空选中状态
        message.success('标记已删除');  // 显示成功消息
      },
    });
  };

  // 处理编辑标记的函数
  const handleEdit = (marker: Marker) => {
    setEditingMarker(marker);  // 设置当前编辑的标记
    // 设置表单的初始值
    editForm.setFieldsValue({
      title: marker.title,  // 设置标题字段
      type: marker.type,    // 设置类型字段
    });
  };

  // 处理保存编辑的函数（异步函数）
  const handleSaveEdit = async () => {
    try {
      // 验证表单字段并获取值
      const values = await editForm.validateFields();
      // 检查是否有正在编辑的标记
      if (editingMarker) {
        // 调用父组件的更新函数
        onUpdateMarker(editingMarker.id, {
          ...values,  // 展开表单值
          updatedAt: new Date(),  // 更新修改时间
        });
        setEditingMarker(null);  // 清除编辑状态
        message.success('标记已更新');  // 显示成功消息
      }
    } catch (error) {
      console.error('表单验证失败:', error);  // 记录错误日志
    }
  };

  // 处理取消编辑的函数
  const handleCancelEdit = () => {
    setEditingMarker(null);  // 清除编辑状态
    editForm.resetFields();  // 重置表单字段
  };

  // 根据标记类型返回显示名称的函数
  const getTypeDisplayName = (type: Marker['type']) => {
    // 定义类型映射对象
    const typeMap = {
      store: '🏪 门店',
      warehouse: '🏭 仓库', 
      vehicle: '🚛 车辆',
      user: '👤 用户',
    };
    // 返回对应的显示名称，如果找不到则返回原类型
    return typeMap[type] || type;
  };

  // 返回组件的JSX结构
  return (
    <div>
      {/* 操作栏区域 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          {/* 全选复选框 */}
          <Checkbox
            // 计算是否全选：选中数量等于总数量且总数量大于0
            checked={selectedIds.length === markers.length && markers.length > 0}
            // 计算是否半选：选中数量大于0且小于总数量
            indeterminate={selectedIds.length > 0 && selectedIds.length < markers.length}
            // 改变时的回调函数
            onChange={(e) => handleSelectAll(e.target.checked)}
          >
            {/* 显示选中状态文本 */}
            全选 ({selectedIds.length}/{markers.length})
          </Checkbox>
          
          {/* 批量删除按钮 */}
          <Button 
            danger  // 设置为危险样式（红色）
            disabled={selectedIds.length === 0}  // 没有选中时禁用
            onClick={handleBatchDelete}  // 点击时的回调
          >
            批量删除
          </Button>
        </Space>
      </div>

      {/* 标记列表 */}
      <List
        size="small"  // 设置列表项大小为small
        dataSource={markers}  // 设置数据源
        renderItem={(marker) => (  // 渲染每个列表项
          <List.Item
            // 根据是否选中设置背景色
            style={{
              backgroundColor: selectedMarkerId === marker.id ? '#e6f7ff' : 'transparent',
              border: selectedMarkerId === marker.id ? '1px solid #1890ff' : '1px solid #f0f0f0',
            }}
            // 定义操作按钮
            actions={[
              // 编辑按钮
              <Button
                key="edit"
                type="text"  // 文本类型，无背景色
                size="small"
                icon={<EditOutlined />}  // 编辑图标
                onClick={() => handleEdit(marker)}  // 点击回调
              />,
              // 删除按钮
              <Button
                key="delete"
                type="text"
                size="small"
                danger  // 危险样式
                icon={<DeleteOutlined />}  // 删除图标
                onClick={() => onDeleteMarkers([marker.id])}  // 单个删除
              />,
            ]}
          >
            <List.Item.Meta
              // 左侧头像区域（复选框）
              avatar={
                <Checkbox
                  checked={selectedIds.includes(marker.id)}  // 是否选中
                  onChange={(e) => handleSelect(marker.id, e.target.checked)}  // 改变回调
                />
              }
              // 标题区域
              title={
                <Space>
                  <Text strong>{marker.title}</Text> 
                  <Text type="secondary">{getTypeDisplayName(marker.type)}</Text> 
                </Space>
              }
              // 描述区域
              description={
                <div>
                  <div>经度: {marker.position.lng.toFixed(6)}</div> 
                  <div>纬度: {marker.position.lat.toFixed(6)}</div> 
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    创建时间: {marker.createdAt.toLocaleString()} 
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />

      {/* 编辑标记的弹窗 */}
      <Modal
        title="编辑标记"  // 弹窗标题
        open={!!editingMarker}  // 根据是否有编辑标记决定是否打开
        onOk={handleSaveEdit}  // 确定按钮回调
        onCancel={handleCancelEdit}  // 取消按钮回调
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="title"
            label="标记名称"
            rules={[{ required: true, message: '请输入标记名称' }]}
          >
            <Input placeholder="请输入标记名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="标记类型"
            rules={[{ required: true, message: '请选择标记类型' }]}
          >
            <Select placeholder="请选择标记类型">
              <Option value="store">🏪 门店</Option>
              <Option value="warehouse">🏭 仓库</Option>
              <Option value="vehicle">🚛 车辆</Option>
              <Option value="user">👤 用户</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// 导出组件
export default MarkerList;