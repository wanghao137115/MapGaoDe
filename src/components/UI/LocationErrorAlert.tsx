// 定位错误提示组件
import React from 'react';
import { Alert, Button, Space, Typography } from 'antd';
import { EnvironmentOutlined, ReloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { GeolocationErrorType } from '@/types';

const { Text, Paragraph } = Typography;

interface LocationErrorAlertProps {
  error: GeolocationErrorType | null | string;
  onRetry?: () => void;
  onManualInput?: () => void;
}

// 判断是否为 GeolocationErrorType 类型
const isGeolocationError = (error: GeolocationErrorType | null | string): error is GeolocationErrorType => {
  return error !== null && typeof error === 'object' && 'code' in error;
};

// 定位错误提示组件
const LocationErrorAlert: React.FC<LocationErrorAlertProps> = ({
  error,
  onRetry,
  onManualInput
}) => {
  // 如果没有错误，不显示
  if (!error) return null;

  // 如果是旧版字符串错误，转换为新格式
  const errorInfo = isGeolocationError(error)
    ? error
    : {
        code: -1,
        message: '定位失败',
        description: error,
        solution: '请刷新页面后重试'
      };

  // 根据错误类型显示不同的提示
  const getAlertProps = () => {
    switch (errorInfo.code) {
      case 1: // PERMISSION_DENIED
        return {
          type: 'warning' as const,
          icon: <EnvironmentOutlined />,
          title: '需要位置权限',
          help: '请在浏览器设置中允许访问您的位置',
        };
      case 2: // POSITION_UNAVAILABLE
        return {
          type: 'error' as const,
          icon: <EnvironmentOutlined />,
          title: '位置信息不可用',
          help: '请检查GPS和网络连接是否正常',
        };
      case 3: // TIMEOUT
        return {
          type: 'warning' as const,
          icon: <EnvironmentOutlined />,
          title: '获取位置超时',
          help: '网络连接可能不稳定，请稍后重试',
        };
      case -1: // 浏览器不支持
        return {
          type: 'error' as const,
          icon: <QuestionCircleOutlined />,
          title: '浏览器不支持',
          help: '请使用现代浏览器（Chrome、Firefox、Edge、Safari）',
        };
      default:
        return {
          type: 'error' as const,
          icon: <EnvironmentOutlined />,
          title: '定位失败',
          help: errorInfo.description || '发生未知错误',
        };
    }
  };

  const alertProps = getAlertProps();

  return (
    <Alert
      type={alertProps.type}
      icon={alertProps.icon}
      style={{ marginBottom: 16 }}
      description={
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {/* 错误描述 */}
          <div>
            <Text strong>{alertProps.title}</Text>
            <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
              {alertProps.help}
            </Paragraph>
          </div>

          {/* 解决方案 */}
          {errorInfo.solution && (
            <div style={{ background: '#f5f5f5', padding: '8px 12px', borderRadius: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                💡 {errorInfo.solution}
              </Text>
            </div>
          )}

          {/* 操作按钮 */}
          <Space>
            {onRetry && (
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={onRetry}
                size="small"
              >
                重新定位
              </Button>
            )}
            {onManualInput && (
              <Button
                icon={<EnvironmentOutlined />}
                onClick={onManualInput}
                size="small"
              >
                手动输入
              </Button>
            )}
          </Space>
        </Space>
      }
    />
  );
};

export default LocationErrorAlert;
