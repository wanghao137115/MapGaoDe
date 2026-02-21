/**
 * 压力测试工具
 * 用于测试前端在高负载场景下的性能表现
 * 
 * 使用方法：
 * 1. 在开发环境打开 /stress-test 路由
 * 2. 选择测试场景并开始测试
 * 3. 查看性能指标和分析结果
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, Button, Select, Space, Statistic, Row, Col, Progress, Table, Tag, message } from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  ThunderboltOutlined, 
  RocketOutlined,
  DashboardOutlined,
  WarningOutlined 
} from '@ant-design/icons';

const { Option } = Select;

// 测试场景配置
interface TestScenario {
  id: string;
  name: string;
  description: string;
  vehicleCount: number;
  markerCount: number;
  trackPointCount: number;
  updateFrequency: number; // ms
}

// 性能指标
interface PerformanceMetrics {
  fps: number;
  memory: number;
  renderTime: number;
  droppedFrames: number;
  timestamp: number;
}

// 测试结果
interface TestResult {
  id: string;
  scenario: string;
  duration: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  avgRenderTime: number;
  peakMemory: number;
  droppedFrames: number;
  score: 'excellent' | 'good' | 'fair' | 'poor';
}

const SCENARIOS: TestScenario[] = [
  { 
    id: 'light', 
    name: '轻度负载', 
    description: '10辆车 + 100个标记点', 
    vehicleCount: 10, 
    markerCount: 100, 
    trackPointCount: 500,
    updateFrequency: 100 
  },
  { 
    id: 'medium', 
    name: '中度负载', 
    description: '50辆车 + 500个标记点', 
    vehicleCount: 50, 
    markerCount: 500, 
    trackPointCount: 2000,
    updateFrequency: 50 
  },
  { 
    id: 'heavy', 
    name: '重度负载', 
    description: '100辆车 + 1000个标记点', 
    vehicleCount: 100, 
    markerCount: 1000, 
    trackPointCount: 5000,
    updateFrequency: 30 
  },
  { 
    id: 'extreme', 
    name: '极端负载', 
    description: '200辆车 + 2000个标记点', 
    vehicleCount: 200, 
    markerCount: 2000, 
    trackPointCount: 10000,
    updateFrequency: 16 
  },
];

// 模拟生成车辆数据
function generateVehicles(count: number): any[] {
  const vehicles = [];
  const baseLng = 116.397428;
  const baseLat = 39.90923;
  
  for (let i = 0; i < count; i++) {
    vehicles.push({
      id: `vehicle-${i}`,
      licensePlate: `京A${String(i).padStart(5, '0')}`,
      position: {
        lng: baseLng + (Math.random() - 0.5) * 0.1,
        lat: baseLat + (Math.random() - 0.5) * 0.1,
      },
      status: 'IN_TRANSIT',
      speed: 30 + Math.random() * 30,
    });
  }
  return vehicles;
}

// 模拟生成标记点
function generateMarkers(count: number): any[] {
  const markers = [];
  const baseLng = 116.397428;
  const baseLat = 39.90923;
  
  for (let i = 0; i < count; i++) {
    markers.push({
      id: `marker-${i}`,
      position: {
        lng: baseLng + (Math.random() - 0.5) * 0.2,
        lat: baseLat + (Math.random() - 0.5) * 0.2,
      },
      title: `标记点 ${i}`,
    });
  }
  return markers;
}

// 模拟生成轨迹点
function generateTrackPoints(count: number): any[] {
  const points = [];
  const baseLng = 116.397428;
  const baseLat = 39.90923;
  let currentLng = baseLng;
  let currentLat = baseLat;
  
  for (let i = 0; i < count; i++) {
    currentLng += (Math.random() - 0.5) * 0.001;
    currentLat += (Math.random() - 0.5) * 0.001;
    points.push({
      position: { lng: currentLng, lat: currentLat },
      timestamp: new Date(Date.now() - (count - i) * 1000),
      speed: 20 + Math.random() * 40,
    });
  }
  return points;
}

export const StressTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario>(SCENARIOS[1]);
  const [duration, setDuration] = useState(10); // 测试持续时间（秒）
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testProgress, setTestProgress] = useState(0);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const testStartTimeRef = useRef<number>(0);
  const droppedFramesRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  
  // FPS 计算
  const calculateFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    frameCountRef.current++;
    
    if (delta >= 1000) {
      fpsRef.current = Math.round((frameCountRef.current * 1000) / delta);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      
      // 检测掉帧
      const frameDelta = now - lastFrameTimeRef.current;
      if (frameDelta > 32) { // 超过 32ms 一帧视为掉帧
        droppedFramesRef.current++;
      }
      lastFrameTimeRef.current = now;
      
      return true;
    }
    return false;
  }, []);

  // 获取内存使用情况
  const getMemory = useCallback((): number => {
    if ((performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }, []);

  // 运行单个测试周期
  const runTestCycle = useCallback(() => {
    const startTime = performance.now();
    
    // 模拟数据更新（触发 React 渲染）
    const vehicles = generateVehicles(selectedScenario.vehicleCount);
    const markers = generateMarkers(selectedScenario.markerCount);
    const trackPoints = generateTrackPoints(selectedScenario.trackPointCount);
    
    // 强制更新触发重渲染
    setCurrentMetrics({
      fps: fpsRef.current,
      memory: getMemory(),
      renderTime: performance.now() - startTime,
      droppedFrames: droppedFramesRef.current,
      timestamp: Date.now(),
    });
    
    // 计算测试进度
    const elapsed = (Date.now() - testStartTimeRef.current) / 1000;
    const progress = Math.min((elapsed / duration) * 100, 100);
    setTestProgress(progress);
    
    if (elapsed < duration) {
      // 继续测试
      setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(runTestCycle);
      }, selectedScenario.updateFrequency);
    } else {
      // 测试结束
      finishTest();
    }
  }, [selectedScenario, duration, getMemory]);

  // 开始测试
  const startTest = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setMetricsHistory([]);
    setCurrentMetrics(null);
    setTestProgress(0);
    droppedFramesRef.current = 0;
    frameCountRef.current = 0;
    fpsRef.current = 0;
    testStartTimeRef.current = Date.now();
    lastTimeRef.current = performance.now();
    lastFrameTimeRef.current = performance.now();
    
    message.info('压力测试开始...');
    
    // 启动 FPS 计算循环
    const fpsLoop = () => {
      if (calculateFPS()) {
        setCurrentMetrics(prev => prev ? { ...prev, fps: fpsRef.current } : null);
      }
      if (isRunning) {
        requestAnimationFrame(fpsLoop);
      }
    };
    fpsLoop();
    
    // 启动测试循环
    runTestCycle();
  }, [isRunning, calculateFPS, runTestCycle]);

  // 结束测试
  const finishTest = useCallback(() => {
    setIsRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // 计算测试结果
    const avgFps = metricsHistory.length > 0 
      ? Math.round(metricsHistory.reduce((sum, m) => sum + m.fps, 0) / metricsHistory.length)
      : fpsRef.current;
    const minFps = metricsHistory.length > 0 
      ? Math.min(...metricsHistory.map(m => m.fps))
      : fpsRef.current;
    const maxFps = metricsHistory.length > 0 
      ? Math.max(...metricsHistory.map(m => m.fps))
      : fpsRef.current;
    const avgRenderTime = metricsHistory.length > 0 
      ? Math.round(metricsHistory.reduce((sum, m) => sum + m.renderTime, 0) / metricsHistory.length)
      : 0;
    const peakMemory = Math.max(...metricsHistory.map(m => m.memory), getMemory());
    
    // 评分
    let score: 'excellent' | 'good' | 'fair' | 'poor';
    if (avgFps >= 55 && droppedFramesRef.current < 10) {
      score = 'excellent';
    } else if (avgFps >= 40 && droppedFramesRef.current < 30) {
      score = 'good';
    } else if (avgFps >= 25) {
      score = 'fair';
    } else {
      score = 'poor';
    }
    
    const result: TestResult = {
      id: `test-${Date.now()}`,
      scenario: selectedScenario.name,
      duration,
      avgFps,
      minFps,
      maxFps,
      avgRenderTime,
      peakMemory,
      droppedFrames: droppedFramesRef.current,
      score,
    };
    
    setTestResults(prev => [result, ...prev].slice(0, 10));
    message.success(`压力测试完成！评分: ${score}`);
  }, [metricsHistory, selectedScenario, duration, getMemory]);

  // 停止测试
  const stopTest = useCallback(() => {
    setIsRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    message.warning('测试已手动停止');
  }, []);

  // 记录指标历史
  useEffect(() => {
    if (currentMetrics) {
      setMetricsHistory(prev => [...prev.slice(-60), currentMetrics]);
    }
  }, [currentMetrics]);

  // 清理
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 表格列配置
  const columns = [
    { title: '场景', dataIndex: 'scenario', key: 'scenario' },
    { title: '时长(s)', dataIndex: 'duration', key: 'duration' },
    { title: '平均FPS', dataIndex: 'avgFps', key: 'avgFps', render: (v: number) => <Tag color={v >= 50 ? 'green' : v >= 30 ? 'orange' : 'red'}>{v}</Tag> },
    { title: '最低FPS', dataIndex: 'minFps', key: 'minFps' },
    { title: '最高FPS', dataIndex: 'maxFps', key: 'maxFps' },
    { title: '掉帧数', dataIndex: 'droppedFrames', key: 'droppedFrames', render: (v: number) => <Tag color={v < 10 ? 'green' : v < 30 ? 'orange' : 'red'}>{v}</Tag> },
    { title: '峰值内存(MB)', dataIndex: 'peakMemory', key: 'peakMemory' },
    { title: '评分', dataIndex: 'score', key: 'score', render: (v: string) => {
      const colors = { excellent: 'green', good: 'blue', fair: 'orange', poor: 'red' };
      return <Tag color={colors[v as keyof typeof colors]}>{v}</Tag>;
    }},
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <h1><ThunderboltOutlined /> 压力测试工具</h1>
      
      <Row gutter={16}>
        {/* 配置面板 */}
        <Col span={6}>
          <Card title="测试配置" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>测试场景：</label>
                <Select 
                  value={selectedScenario.id} 
                  onChange={(v) => setSelectedScenario(SCENARIOS.find(s => s.id === v)!)}
                  style={{ width: '100%' }}
                  disabled={isRunning}
                >
                  {SCENARIOS.map(s => (
                    <Option key={s.id} value={s.id}>
                      {s.name} - {s.description}
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <label>测试时长（秒）：</label>
                <Select 
                  value={duration} 
                  onChange={setDuration}
                  style={{ width: '100%' }}
                  disabled={isRunning}
                >
                  <Option value={5}>5秒</Option>
                  <Option value={10}>10秒</Option>
                  <Option value={30}>30秒</Option>
                  <Option value={60}>60秒</Option>
                </Select>
              </div>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                onClick={startTest}
                loading={isRunning}
                block
              >
                开始测试
              </Button>
              <Button 
                danger 
                icon={<StopOutlined />} 
                onClick={stopTest}
                disabled={!isRunning}
                block
              >
                停止
              </Button>
            </Space>
          </Card>
          
          {/* 场景说明 */}
          <Card title="场景详情">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic title="车辆数量" value={selectedScenario.vehicleCount} prefix={<RocketOutlined />} />
              <Statistic title="标记点数量" value={selectedScenario.markerCount} prefix={<DashboardOutlined />} />
              <Statistic title="轨迹点数量" value={selectedScenario.trackPointCount} />
              <Statistic title="更新频率" value={selectedScenario.updateFrequency} suffix="ms" />
            </Space>
          </Card>
        </Col>
        
        {/* 实时指标 */}
        <Col span={18}>
          <Card 
            title="实时性能指标" 
            extra={isRunning && <Progress percent={Math.round(testProgress)} size="small" style={{ width: 200 }} />}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic 
                  title="当前 FPS" 
                  value={currentMetrics?.fps || 0} 
                  valueStyle={{ color: (currentMetrics?.fps || 0) >= 50 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="内存使用 (MB)" 
                  value={currentMetrics?.memory || 0} 
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="渲染耗时 (ms)" 
                  value={currentMetrics?.renderTime || 0} 
                  valueStyle={{ color: (currentMetrics?.renderTime || 0) > 16 ? '#cf1322' : '#3f8600' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="掉帧数" 
                  value={currentMetrics?.droppedFrames || 0} 
                  valueStyle={{ color: (currentMetrics?.droppedFrames || 0) > 20 ? '#cf1322' : '#3f8600' }}
                />
              </Col>
            </Row>
            
            {/* FPS 图表（简易版） */}
            <div style={{ marginTop: 24, height: 200, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              {metricsHistory.slice(-60).map((m, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: Math.min((m.fps / 60) * 100, 100),
                    background: m.fps >= 50 ? '#52c41a' : m.fps >= 30 ? '#faad14' : '#f5222d',
                    minWidth: 2,
                  }}
                  title={`FPS: ${m.fps}`}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 8, color: '#999' }}>
              FPS 趋势（最近60次采样）
            </div>
          </Card>
          
          {/* 测试结果 */}
          <Card title="测试历史记录" style={{ marginTop: 16 }}>
            {testResults.length > 0 ? (
              <Table 
                dataSource={testResults} 
                columns={columns} 
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
                <WarningOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>暂无测试记录，请开始测试</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StressTest;
