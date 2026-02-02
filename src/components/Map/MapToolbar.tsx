import React from 'react';
import { Card, Button, Checkbox, Slider } from 'antd';
import { FullscreenOutlined, GlobalOutlined, CarOutlined, RadarChartOutlined, AimOutlined } from '@ant-design/icons';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

type MapToolbarProps = {
  zoom: number;
  setZoom: (zoom: number) => void;
  showSatelliteMode: boolean;
  showSatelliteRoads: boolean;
  setShowSatelliteRoads: (show: boolean) => void;
  showTraffic: boolean;
  measureMode: boolean;
  showSubwayModal: boolean;
  trafficPanelVisible: boolean;
  trafficMode: 'realtime' | 'forecast';
  trafficWeekday: number;
  trafficHour: number;
  onToggleSatellite: () => void;
  onToggleTraffic: () => void;
  onToggleMeasureMode: () => void;
  onToggleSubwayModal: () => void;
  onToggleFullscreen: () => void;
  onSetTrafficMode: (mode: 'realtime' | 'forecast') => void;
  onSetTrafficWeekday: (day: number) => void;
  onSetTrafficHour: (hour: number) => void;
};

const MapToolbar: React.FC<MapToolbarProps> = ({
  zoom,
  setZoom,
  showSatelliteMode,
  showSatelliteRoads,
  setShowSatelliteRoads,
  showTraffic,
  measureMode,
  showSubwayModal,
  trafficPanelVisible,
  trafficMode,
  trafficWeekday,
  trafficHour,
  onToggleSatellite,
  onToggleTraffic,
  onToggleMeasureMode,
  onToggleSubwayModal,
  onToggleFullscreen,
  onSetTrafficMode,
  onSetTrafficWeekday,
  onSetTrafficHour,
}) => {
  return (
    <>
      {/* 卫星模式下的路网选择浮层（只在卫星模式显示） */}
      {showSatelliteMode && (
        <div style={{ position: 'absolute', right: 12, top: 64, zIndex: 1201 }}>
          <Card size="small" style={{ borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: '8px' }}>
            <Checkbox checked={showSatelliteRoads} onChange={(e) => setShowSatelliteRoads(e.target.checked)}>
              显示路网
            </Checkbox>
          </Card>
        </div>
      )}

      {/* 右上：功能区（固定） */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: 12,
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 10,
        }}
      >
        <Card size="small" style={{ borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
          {/* 横向工具条样式，图标 + 文本，竖直分隔线 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '6px 8px',
              background: 'transparent',
            }}
          >
            {/* 缩放按钮 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button size="small" onClick={() => setZoom(Math.max(3, zoom - 1))}>
                -
              </Button>
              <span style={{ minWidth: 36, textAlign: 'center', fontWeight: 'bold', color: '#1890ff' }}>
                {zoom}
              </span>
              <Button size="small" onClick={() => setZoom(Math.min(18, zoom + 1))}>
                +
              </Button>
            </div>

            <div style={{ width: 1, height: 20, background: '#e6e6e6' }} />

            {/* 卫星 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button type={showSatelliteMode ? 'primary' : 'default'} size="small" onClick={onToggleSatellite} icon={<RadarChartOutlined />}>
                <span style={{ fontSize: 12 }}>卫星</span>
              </Button>
            </div>

            <div style={{ width: 1, height: 20, background: '#e6e6e6' }} />

            {/* 路况 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button size="small" type={showTraffic ? 'primary' : 'default'} onClick={onToggleTraffic} icon={<CarOutlined />}>
                <span style={{ fontSize: 12 }}>路况</span>
              </Button>
            </div>

            <div style={{ width: 1, height: 20, background: '#e6e6e6' }} />

            {/* 测距 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button size="small" type={measureMode ? 'primary' : 'default'} onClick={onToggleMeasureMode} icon={<AimOutlined />}>
                测距
              </Button>
            </div>

            <div style={{ width: 1, height: 20, background: '#e6e6e6' }} />

            {/* 地铁 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button size="small" type={showSubwayModal ? 'primary' : 'default'} onClick={onToggleSubwayModal} icon={<GlobalOutlined />}>
                地铁
              </Button>
            </div>

            <div style={{ width: 1, height: 20, background: '#e6e6e6' }} />

            {/* 全屏 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button size="small" onClick={onToggleFullscreen} icon={<FullscreenOutlined />}>
                全屏
              </Button>
            </div>
          </div>
        </Card>

        {/* 路况实时/预测面板 */}
        {trafficPanelVisible && (
          <Card
            size="small"
            style={{
              width: 280,
              borderRadius: 8,
              boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
              padding: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <Button
                type={trafficMode === 'realtime' ? 'primary' : 'default'}
                size="small"
                style={{ marginRight: 4 }}
                onClick={() => onSetTrafficMode('realtime')}
              >
                实时
              </Button>
              <Button
                type={trafficMode === 'forecast' ? 'primary' : 'default'}
                size="small"
                onClick={() => onSetTrafficMode('forecast')}
              >
                预测
              </Button>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: '#888' }}>
                畅通
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 4,
                    background: '#00aa00',
                    borderRadius: 2,
                    margin: '0 4px',
                  }}
                />
                缓行
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 4,
                    background: '#ffcc00',
                    borderRadius: 2,
                    margin: '0 4px',
                  }}
                />
                拥堵
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 4,
                    background: '#ff0000',
                    borderRadius: 2,
                    marginLeft: 4,
                  }}
                />
              </span>
            </div>

            {trafficMode === 'realtime' ? (
              <div style={{ fontSize: 12, color: '#555' }}>当前显示为实时路况</div>
            ) : (
              <>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  预测时间：
                  <span style={{ fontWeight: 500 }}>
                    星期{WEEK_LABELS[trafficWeekday]} {trafficHour.toString().padStart(2, '0')}:00
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  {WEEK_LABELS.map((label, idx) => {
                    const isToday = idx === new Date().getDay();
                    const isActive = idx === trafficWeekday;
                    return (
                      <span
                        key={idx}
                        style={{
                          padding: '2px 4px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          color: isActive ? '#1890ff' : '#555',
                          background: isActive ? 'rgba(24,144,255,0.08)' : 'transparent',
                        }}
                        onClick={() => onSetTrafficWeekday(idx)}
                      >
                        {label}
                        {isToday && ' (今天)'}
                      </span>
                    );
                  })}
                </div>
                <div style={{ fontSize: 12, marginBottom: 2 }}>时间</div>
                <Slider
                  min={0}
                  max={23}
                  step={1}
                  value={trafficHour}
                  onChange={(val) => {
                    if (typeof val === 'number') {
                      onSetTrafficHour(val);
                    }
                  }}
                  marks={{
                    0: '00',
                    6: '06',
                    12: '12',
                    18: '18',
                    24: '24',
                  }}
                />
              </>
            )}
          </Card>
        )}
      </div>
    </>
  );
};

export default React.memo(MapToolbar);
