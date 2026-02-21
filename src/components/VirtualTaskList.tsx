import React, { useCallback, memo } from 'react';
import type { DeliveryTask, Vehicle, DeliveryStatus, DeliveryPriority } from '../types';
import { Card, Row, Tag, Space } from 'antd';

/** 获取配送状态信息 */
function getDeliveryStatusInfo(status: DeliveryStatus) {
  switch (status) {
    case DeliveryStatus.PENDING:
      return { text: '待分配', color: 'default' };
    case DeliveryStatus.ASSIGNED:
      return { text: '已分配', color: 'blue' };
    case DeliveryStatus.IN_TRANSIT:
      return { text: '运输中', color: 'orange' };
    case DeliveryStatus.DELIVERED:
      return { text: '已送达', color: 'green' };
    case DeliveryStatus.CANCELLED:
      return { text: '已取消', color: 'red' };
    default:
      return { text: '未知', color: 'default' };
  }
}

/** 单个任务卡片 - 使用 memo 优化 */
const TaskCard = memo<{
  task: DeliveryTask;
  vehicle?: Vehicle;
  isSelected: boolean;
  onClick: () => void;
}>(({ task, vehicle, isSelected, onClick }) => {
  const statusInfo = getDeliveryStatusInfo(task.status);

  return (
    <Card
      size="small"
      style={{
        marginBottom: 8,
        cursor: 'pointer',
        border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
        backgroundColor: isSelected ? '#f0f9ff' : '#fff',
        transition: 'border-color 0.2s, background-color 0.2s',
      }}
      onClick={onClick}
    >
      <Row align="middle" gutter={8}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <strong>订单：{task.orderId}</strong>
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
            <Tag color={task.priority === DeliveryPriority.URGENT ? 'red' : 'default'}>
              {task.priority === DeliveryPriority.URGENT ? '加急' : '普通'}
            </Tag>
          </Space>
          <div style={{ fontSize: '12px', color: '#666' }}>
            客户：{task.customerName} | 车辆：{vehicle?.licensePlate || '未分配'}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            预计送达：{task.estimatedArrival.toLocaleTimeString()}
          </div>
        </Space>
      </Row>
    </Card>
  );
});

TaskCard.displayName = 'TaskCard';

export interface TaskListProps {
  /** 任务列表 */
  tasks: DeliveryTask[];
  /** 车辆列表 */
  vehicles: Vehicle[];
  /** 选中的任务时间线ID */
  selectedTaskTimeline?: string | null;
  /** 任务点击回调 */
  onTaskClick?: (task: DeliveryTask) => void;
}

/**
 * 优化任务列表组件 - 使用 React.memo 和 useMemo 提升性能
 * 适用于任务数量不是特别多的场景（< 500条）
 */
export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  vehicles,
  selectedTaskTimeline,
  onTaskClick,
}) => {
  // 使用 useMemo 缓存车辆映射，避免每次渲染都创建
  const vehicleMap = React.useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles.forEach(v => map.set(v.id, v));
    return map;
  }, [vehicles]);

  // 使用 useMemo 缓存任务项的渲染
  const taskItems = React.useMemo(() => {
    return tasks.map(task => ({
      task,
      vehicle: vehicleMap.get(task.vehicleId || ''),
      isSelected: selectedTaskTimeline === task.id,
    }));
  }, [tasks, vehicleMap, selectedTaskTimeline]);

  if (tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
        暂无任务，点击车辆卡片上的"派送"按钮创建任务
      </div>
    );
  }

  return (
    <div style={{ 
      overflowY: 'auto', 
      overflowX: 'hidden',
      maxHeight: '100%',
      paddingRight: 4,
    }}>
      {taskItems.map(({ task, vehicle, isSelected }) => (
        <TaskCard
          key={task.id}
          task={task}
          vehicle={vehicle}
          isSelected={isSelected}
          onClick={() => onTaskClick?.(task)}
        />
      ))}
    </div>
  );
};

export default TaskList;
