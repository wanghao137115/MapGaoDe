import React from 'react';
import { Input, Select, Space, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { Marker } from '@/types';

const { Option } = Select;

interface MarkerSearchProps {
  onSearch: (query: string) => void;
  onFilter: (types: Marker['type'][]) => void;
  onClear: () => void;
}

const MarkerSearch: React.FC<MarkerSearchProps> = ({
    onSearch,
    onFilter,
    onClear,
  }) => {
    // 使用useState管理搜索查询字符串
    const [searchQuery, setSearchQuery] = React.useState('');
    // 使用useState管理选中的类型数组
    const [selectedTypes, setSelectedTypes] = React.useState<Marker['type'][]>([]);
    // 处理搜索输入变化的函数
    const handleSearch = (value: string) => {
        setSearchQuery(value);  // 更新本地状态
        onSearch(value);        // 调用父组件回调
    };


    // 处理清除所有筛选的函数
    const handleClear = () => {
        setSearchQuery('');      // 清空搜索查询
        setSelectedTypes([]);    // 清空类型筛选
        onClear();               // 调用父组件清除回调
    };

    // 返回组件JSX
    return (
        <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
            {/* 搜索输入框 */}
            <Input
            placeholder="搜索标记名称..."  // 占位符文本
            prefix={<SearchOutlined />}     // 前缀图标
            value={searchQuery}             // 绑定值
            onChange={(e) => handleSearch(e.target.value)}  // 变化回调
            allowClear                        // 允许清空
            />

            {/* 类型筛选和清除按钮区域 */}
            <Space>
            {/* 类型多选下拉框 */}
            <Select
                mode="multiple"           // 多选模式
                placeholder="按类型筛选"   // 占位符
                style={{ minWidth: 200 }} // 最小宽度
                value={selectedTypes}     // 绑定选中值
                onChange={(value: Marker['type'][]) => {
                  setSelectedTypes(value);  // 直接更新本地状态
                  onFilter(value);          // 直接调用父组件回调
                }}  // 变化回调
                allowClear                // 允许清空
            >
                <Option value="store">🏪 门店</Option>
                <Option value="warehouse">🏭 仓库</Option>
                <Option value="vehicle">🚛 车辆</Option>
                <Option value="user">👤 用户</Option>
            </Select>

            {/* 清除筛选按钮 */}
            <Button 
                icon={<ClearOutlined />}  // 清除图标
                onClick={handleClear}     // 点击回调
                // 当没有搜索查询且没有选中类型时禁用按钮
                disabled={!searchQuery && selectedTypes.length === 0}
            >
                清除筛选
            </Button>
            </Space>
        </Space>
        </div>
    );

  }

  // 导出组件
export default MarkerSearch;