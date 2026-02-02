import React from 'react';
import { Button, Select, Slider, message } from 'antd';
import {
  EnvironmentOutlined,
  CarOutlined,
  GlobalOutlined,
  AimOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import PlaceSearch from '@/components/Map/PlaceSearch';
import type { RoutePlanningParams } from '@/components/Map/RoutePlanningForm';
import { RouteStrategy, RouteServiceStatus } from '@/types';

type LatLng = { lng: number; lat: number };

type Waypoint = { id: string; name: string; location?: LatLng };

type RoutePanelProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  routeMode: 'driving' | 'walking' | 'transit' | 'riding' | 'electric';
  setRouteMode: (mode: 'driving' | 'walking' | 'transit' | 'riding' | 'electric') => void;
  originText: string;
  setOriginText: (text: string) => void;
  destText: string;
  setDestText: (text: string) => void;
  originLocation: LatLng | null;
  setOriginLocation: (loc: LatLng | null) => void;
  destLocation: LatLng | null;
  setDestLocation: (loc: LatLng | null) => void;
  waypoints: Waypoint[];
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
  // 搜索下拉
  routePanelSearchResults: any[];
  setRoutePanelSearchResults: (results: any[]) => void;
  routePanelSearchVisible: boolean;
  setRoutePanelSearchVisible: (visible: boolean) => void;
  routePanelSearchTarget: 'origin' | 'dest' | 'waypoint' | null;
  setRoutePanelSearchTarget: (target: 'origin' | 'dest' | 'waypoint' | null) => void;
  routePanelTargetRef: React.MutableRefObject<'origin' | 'dest' | 'waypoint' | null>;
  routePanelWaypointIdRef: React.MutableRefObject<string | null>;
  // 规划结果
  routeResult: any;
  routeParams: RoutePlanningParams | null;
  routeStrategyTab: 'recommend' | 'avoidCongestion';
  setRouteStrategyTab: (tab: 'recommend' | 'avoidCongestion') => void;
  routePlanIndex: number;
  setRoutePlanIndex: (index: number) => void;
  expandedPlanIndex: number | null;
  setExpandedPlanIndex: (index: number | null) => void;
  // 行为
  handlePlanRoute: (params: RoutePlanningParams) => Promise<any>;
  addRouteHistory: (item: any) => void;
  routeHistory: any[];
  removeRouteHistoryItem: (id: string) => void;
  setMapCenter: (pos: LatLng) => void;
  setZoom: (zoom: number) => void;
};

const RoutePanel: React.FC<RoutePanelProps> = ({
  show,
  setShow,
  routeMode,
  setRouteMode,
  originText,
  setOriginText,
  destText,
  setDestText,
  originLocation,
  setOriginLocation,
  destLocation,
  setDestLocation,
  waypoints,
  setWaypoints,
  routePanelSearchResults,
  setRoutePanelSearchResults,
  routePanelSearchVisible,
  setRoutePanelSearchVisible,
  routePanelSearchTarget,
  setRoutePanelSearchTarget,
  routePanelTargetRef,
  routePanelWaypointIdRef,
  routeResult,
  routeParams,
  routeStrategyTab,
  setRouteStrategyTab,
  routePlanIndex,
  setRoutePlanIndex,
  expandedPlanIndex,
  setExpandedPlanIndex,
  handlePlanRoute,
  addRouteHistory,
  routeHistory,
  removeRouteHistoryItem,
  setMapCenter,
  setZoom,
}) => {
  return (
    <div style={{ display: 'inline-block', marginLeft: 8 }}>
      <Button
        size="small"
        onClick={() => setShow(!show)}
        icon={<EnvironmentOutlined />}
      >
        路线
      </Button>

      {/* 路线面板 */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 64,
          width: 420,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          zIndex: 1400,
          overflow: 'hidden',
          transition: 'opacity 200ms ease, transform 200ms ease',
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(-6px)',
          pointerEvents: show ? 'auto' : 'none',
        }}
      >
        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Button
              size="small"
              type={routeMode === 'driving' ? 'primary' : 'default'}
              onClick={() => setRouteMode('driving')}
              icon={<CarOutlined />}
            >
              驾车
            </Button>
            <Button
              size="small"
              type={routeMode === 'transit' ? 'primary' : 'default'}
              onClick={() => setRouteMode('transit')}
              icon={<GlobalOutlined />}
            >
              公交
            </Button>
            <Button
              size="small"
              type={routeMode === 'riding' ? 'primary' : 'default'}
              onClick={() => setRouteMode('riding')}
              icon={<AimOutlined />}
            >
              骑行
            </Button>
            <Button
              size="small"
              type={routeMode === 'electric' ? 'primary' : 'default'}
              onClick={() => setRouteMode('electric')}
              icon={<AimOutlined />}
            >
              电动车
            </Button>
            <div style={{ flex: 1 }} />
            <Button size="small" onClick={() => setShow(false)}>
              ×
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <PlaceSearch
                placeholder="我的位置"
                value={originText}
                onValueChange={(v: string) => setOriginText(v)}
                suppressDropdown
                onResultsChange={(results: any[], visible: boolean) => {
                  if (visible) {
                    routePanelTargetRef.current = 'origin';
                    setRoutePanelSearchTarget('origin');
                    setRoutePanelSearchResults(results || []);
                    setRoutePanelSearchVisible(true);
                  } else {
                    if (routePanelTargetRef.current === 'origin') {
                      setRoutePanelSearchResults([]);
                      setRoutePanelSearchVisible(false);
                      routePanelTargetRef.current = null;
                      setRoutePanelSearchTarget(null);
                    }
                  }
                }}
                onPlaceSelect={(place: any) => {
                  setOriginText(place.name);
                  setOriginLocation(place.location);
                  setRoutePanelSearchVisible(false);
                }}
                onPlaceConfirm={(place: any) => {
                  setOriginText(place.name);
                  setOriginLocation(place.location);
                  setRoutePanelSearchVisible(false);
                }}
              />
            </div>
            <Button
              size="small"
              onClick={() => {
                const ot = originText;
                const dt = destText;
                const ol = originLocation;
                const dl = destLocation;
                setOriginText(dt);
                setDestText(ot);
                setOriginLocation(dl);
                setDestLocation(ol);
              }}
            >
              ↕
            </Button>
            <div style={{ flex: 1 }}>
              <PlaceSearch
                placeholder="终点 请输入终点"
                value={destText}
                onValueChange={(v: string) => setDestText(v)}
                suppressDropdown
                onResultsChange={(results: any[], visible: boolean) => {
                  if (visible) {
                    routePanelTargetRef.current = 'dest';
                    setRoutePanelSearchTarget('dest');
                    setRoutePanelSearchResults(results || []);
                    setRoutePanelSearchVisible(true);
                  } else {
                    if (routePanelTargetRef.current === 'dest') {
                      setRoutePanelSearchResults([]);
                      setRoutePanelSearchVisible(false);
                      routePanelTargetRef.current = null;
                      setRoutePanelSearchTarget(null);
                    }
                  }
                }}
                onPlaceSelect={(place: any) => {
                  setDestText(place.name);
                  setDestLocation(place.location);
                  setRoutePanelSearchVisible(false);
                }}
                onPlaceConfirm={(place: any) => {
                  setDestText(place.name);
                  setDestLocation(place.location);
                  setRoutePanelSearchVisible(false);
                }}
              />
            </div>
            <Button
              size="small"
              onClick={() => {
                const id = `wp-${Date.now()}`;
                setWaypoints((prev) => [...prev, { id, name: '', location: undefined }]);
              }}
            >
              +
            </Button>
          </div>

          {/* 途经点列表 */}
          {waypoints.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {waypoints.map((w) => (
                <div
                  key={w.id}
                  style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}
                >
                  <PlaceSearch
                    placeholder="请输入途径点"
                    value={w.name || ''}
                    onValueChange={(v: string) => {
                      setWaypoints((prev) =>
                        prev.map((p) => (p.id === w.id ? { ...p, name: v } : p)),
                      );
                    }}
                    suppressDropdown
                    onResultsChange={(results: any[], visible: boolean) => {
                      if (visible) {
                        routePanelTargetRef.current = 'waypoint';
                        routePanelWaypointIdRef.current = w.id;
                        setRoutePanelSearchTarget('waypoint');
                        setRoutePanelSearchResults(results || []);
                        setRoutePanelSearchVisible(true);
                      } else {
                        if (
                          routePanelTargetRef.current === 'waypoint' &&
                          routePanelWaypointIdRef.current === w.id
                        ) {
                          setRoutePanelSearchResults([]);
                          setRoutePanelSearchVisible(false);
                          routePanelTargetRef.current = null;
                          routePanelWaypointIdRef.current = null;
                          setRoutePanelSearchTarget(null);
                        }
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    size="small"
                    danger
                    onClick={() =>
                      setWaypoints((prev) => prev.filter((p) => p.id !== w.id))
                    }
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => setShow(false)}>
              取消
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={async () => {
                if (!originLocation || !destLocation) {
                  message.warning('请先通过搜索选择起点与终点以获得坐标信息');
                  return;
                }
                const validWaypoints = waypoints
                  .filter((w) => w.location)
                  .map((w) => w.location!) as LatLng[];
                const params: RoutePlanningParams = {
                  origin: originLocation,
                  destination: destLocation,
                  mode: routeMode,
                  waypoints: validWaypoints.length > 0 ? validWaypoints : undefined,
                  strategy:
                    routeMode === 'driving'
                      ? routeStrategyTab === 'avoidCongestion'
                        ? RouteStrategy.AVOID_CONGESTION
                        : RouteStrategy.FASTEST
                      : undefined,
                } as any;
                await handlePlanRoute(params);
                addRouteHistory({
                  id: `${originText}=>${destText}`.replace(/\s+/g, ''),
                  originText,
                  destText,
                  originLocation,
                  destLocation,
                  mode: routeMode,
                });
              }}
            >
              {routeMode === 'driving'
                ? '开车去'
                : routeMode === 'transit'
                ? '公交去'
                : routeMode === 'riding'
                ? '骑行去'
                : routeMode === 'electric'
                ? '电动车去'
                : '步行去'}
            </Button>
          </div>

          {/* 路线搜索记录 / 推荐方案面板 */}
          <div style={{ marginTop: 12 }}>
            {routeResult &&
            routeResult.status === RouteServiceStatus.SUCCESS &&
            routeResult.data &&
            !routePanelSearchVisible ? (
              <div>
                {(() => {
                  const plans = (routeResult.data as any).plans as any[] | undefined;
                  const selected =
                    plans && plans.length > 0
                      ? plans[routePlanIndex] || plans[0]
                      : routeResult.data;
                  const steps = (selected as any)?.steps || [];

                  const makeViaText = (allSteps: any[]) => {
                    if (!allSteps || allSteps.length === 0) return '若干道路';
                    return (
                      allSteps
                        .slice(0, 3)
                        .map((s) => (s.instruction || '').toString().trim())
                        .filter(Boolean)
                        .join('、') || '若干道路'
                    );
                  };

                  return (
                    <>
                      {routeMode === 'driving' && (
                        <div
                          style={{
                            display: 'flex',
                            borderBottom: '1px solid #f0f0f0',
                            marginBottom: 8,
                          }}
                        >
                          {[
                            {
                              key: 'recommend' as const,
                              label: '推荐方案',
                              strategy: RouteStrategy.FASTEST,
                            },
                            {
                              key: 'avoidCongestion' as const,
                              label: '避免拥堵',
                              strategy: RouteStrategy.AVOID_CONGESTION,
                            },
                          ].map((tab) => (
                            <div
                              key={tab.key}
                              onClick={async () => {
                                if (routeStrategyTab === tab.key) return;
                                setRouteStrategyTab(tab.key);
                                setRoutePlanIndex(0);
                                setExpandedPlanIndex(null);
                                if (originLocation && destLocation) {
                                  const params: RoutePlanningParams = {
                                    origin: originLocation,
                                    destination: destLocation,
                                    mode: 'driving',
                                    strategy: tab.strategy,
                                  } as any;
                                  await handlePlanRoute(params);
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: 13,
                                color:
                                  routeStrategyTab === tab.key ? '#1890ff' : '#666',
                                borderBottom:
                                  routeStrategyTab === tab.key
                                    ? '2px solid #1890ff'
                                    : '2px solid transparent',
                                fontWeight: routeStrategyTab === tab.key ? 600 : 400,
                              }}
                            >
                              {tab.label}
                            </div>
                          ))}
                          <div style={{ flex: 1 }} />
                        </div>
                      )}

                      <div style={{ maxHeight: 220, overflow: 'auto' }}>
                        {(plans && plans.length > 0 ? plans : [selected]).map(
                          (plan: any, idx: number) => {
                            const expanded = expandedPlanIndex === idx;
                            const isActive = routePlanIndex === idx;
                            const planSteps = plan?.steps || [];
                            return (
                              <div
                                key={idx}
                                style={{
                                  borderBottom: '1px solid #f0f0f0',
                                  padding: '8px 2px',
                                  background: isActive ? '#f6fbff' : 'transparent',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <div
                                    style={{ cursor: 'pointer', flex: 1 }}
                                    onClick={() => {
                                      setRoutePlanIndex(idx);
                                    }}
                                  >
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                                      约
                                      {Math.max(
                                        1,
                                        Math.round(((plan?.duration || 0) as number) / 60),
                                      )}
                                      分钟
                                      <span style={{ margin: '0 8px', color: '#999' }}>
                                        {(((plan?.distance || 0) as number) / 1000).toFixed(
                                          1,
                                        )}
                                        公里
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: '#999',
                                        marginTop: 2,
                                      }}
                                    >
                                      途经：{makeViaText(planSteps)}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      color: '#999',
                                      paddingRight: 4,
                                      cursor: 'pointer',
                                    }}
                                    onClick={() =>
                                      setExpandedPlanIndex((v) => (v === idx ? null : idx))
                                    }
                                  >
                                    {expanded ? <UpOutlined /> : <DownOutlined />}
                                  </div>
                                </div>

                                {expanded && (
                                  <div
                                    style={{
                                      marginTop: 8,
                                      borderTop: '1px solid #f5f5f5',
                                      paddingTop: 8,
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        marginBottom: 6,
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 24,
                                          textAlign: 'center',
                                          color: '#1890ff',
                                          fontSize: 12,
                                        }}
                                      >
                                        起
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div
                                          style={{ fontSize: 13, fontWeight: 500 }}
                                        >
                                          从 {originText || '起点'} 出发
                                        </div>
                                      </div>
                                    </div>

                                    {planSteps.map((step: any, sIdx: number) => (
                                      <div
                                        key={sIdx}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          marginBottom: 6,
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 24,
                                            textAlign: 'center',
                                            color: '#52c41a',
                                            fontSize: 12,
                                          }}
                                        >
                                          ●
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 13 }}>
                                            {step.instruction}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              color: '#999',
                                              marginTop: 2,
                                            }}
                                          >
                                            {(
                                              ((step.distance || 0) as number) /
                                              1000
                                            ).toFixed(1)}
                                            公里
                                          </div>
                                        </div>
                                      </div>
                                    ))}

                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        marginTop: 4,
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 24,
                                          textAlign: 'center',
                                          color: '#ff4d4f',
                                          fontSize: 12,
                                        }}
                                      >
                                        终
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div
                                          style={{ fontSize: 13, fontWeight: 500 }}
                                        >
                                          到达终点 {destText || '终点'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  {routePanelSearchVisible ? '搜索结果' : '路线搜索记录'}
                </div>
                <div style={{ maxHeight: 160, overflow: 'auto' }}>
                  {routePanelSearchVisible ? (
                    (routePanelSearchResults || []).length > 0 ? (
                      (routePanelSearchResults || []).map((p: any) => (
                        <div
                          key={p.id}
                          style={{
                            padding: '8px 6px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (routePanelSearchTarget === 'origin') {
                              setOriginText(p.name);
                              setOriginLocation(p.location);
                            } else if (
                              routePanelSearchTarget === 'waypoint' &&
                              routePanelWaypointIdRef.current
                            ) {
                              setWaypoints((prev) =>
                                prev.map((wp) =>
                                  wp.id === routePanelWaypointIdRef.current
                                    ? { ...wp, name: p.name, location: p.location }
                                    : wp,
                                ),
                              );
                            } else {
                              setDestText(p.name);
                              setDestLocation(p.location);
                            }
                            setRoutePanelSearchVisible(false);
                          }}
                        >
                          <div style={{ fontSize: 13 }}>{p.name}</div>
                          {p.address && (
                            <div style={{ fontSize: 12, color: '#888' }}>
                              {p.address}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#888', padding: 6 }}>无匹配结果</div>
                    )
                  ) : routeHistory && routeHistory.length > 0 ? (
                    routeHistory.map((r: any) => (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 4px',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <div
                          style={{ cursor: 'pointer', flex: 1 }}
                          onMouseDown={async () => {
                            if (r.originLocation && r.destLocation) {
                              setOriginLocation(r.originLocation);
                              setDestLocation(r.destLocation);
                              setOriginText(r.originText || '');
                              setDestText(r.destText || '');
                              setMapCenter(r.originLocation);
                              setZoom(13);

                              const res = await handlePlanRoute({
                                origin: r.originLocation,
                                destination: r.destLocation,
                                mode: routeMode,
                              } as any);
                              if (res && res.status !== RouteServiceStatus.SUCCESS) {
                                const errCode = res.error?.code || res.error?.message;
                                if (
                                  errCode === 'OVER_DIRECTION_RANGE' &&
                                  routeMode !== 'driving'
                                ) {
                                  message.warning(
                                    '当前出行方式超出可行范围，尝试使用驾车规划...',
                                  );
                                  const fallback = await handlePlanRoute({
                                    origin: r.originLocation,
                                    destination: r.destLocation,
                                    mode: 'driving',
                                  } as any);
                                  if (
                                    fallback &&
                                    fallback.status === RouteServiceStatus.SUCCESS
                                  ) {
                                    setRouteMode('driving');
                                    addRouteHistory({
                                      id: `${r.originText}=>${r.destText}`.replace(
                                        /\s+/g,
                                        '',
                                      ),
                                      originText: r.originText,
                                      destText: r.destText,
                                      originLocation: r.originLocation,
                                      destLocation: r.destLocation,
                                      mode: 'driving',
                                    });
                                    message.success('驾车规划成功（已回退）');
                                  } else {
                                    message.error(
                                      `规划失败: ${
                                        fallback?.error?.message ||
                                        fallback?.error?.code ||
                                        '未知错误'
                                      }`,
                                    );
                                  }
                                } else {
                                  message.error(
                                    `规划失败: ${
                                      res.error?.message ||
                                      res.error?.code ||
                                      '未知错误'
                                    }`,
                                  );
                                }
                              }
                            }
                          }}
                        >
                          {(r.originText || '起点')} → {(r.destText || '终点')}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button
                            size="small"
                            danger
                            onClick={() => removeRouteHistoryItem(r.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#888' }}>暂无路线记录</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(RoutePanel);

