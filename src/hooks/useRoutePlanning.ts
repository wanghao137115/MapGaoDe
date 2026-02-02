import { useState, useCallback, useRef } from 'react';
import { message } from 'antd';
import { planDrivingRoute, planWalkingRoute, planTransitRoute, planRidingRoute, planElectricRoute } from '@/services/map';
import type { RouteServiceResult } from '@/types';
import { RouteServiceStatus, RouteStrategy } from '@/types';
import type { RoutePlanningParams } from '@/components/Map/RoutePlanningForm';

export const useRoutePlanning = () => {
  const [routeResult, setRouteResult] = useState<RouteServiceResult | null>(null);
  const [routePlanning, setRoutePlanning] = useState(false);
  const [routeParams, setRouteParams] = useState<RoutePlanningParams | null>(null);
  const [routeStrategyTab, setRouteStrategyTab] = useState<'recommend' | 'avoidCongestion'>('recommend');
  const [routePlanIndex, setRoutePlanIndex] = useState<number>(0);
  const [expandedPlanIndex, setExpandedPlanIndex] = useState<number | null>(null);

  const handlePlanRoute = useCallback(async (params: RoutePlanningParams): Promise<RouteServiceResult | null> => {
    setRoutePlanning(true);
    setRouteParams(params);

    try {
      let result: RouteServiceResult;
      switch (params.mode) {
        case 'driving':
          result = await planDrivingRoute(params.origin, params.destination, params.waypoints, params.strategy);
          break;
        case 'walking':
          result = await planWalkingRoute(params.origin, params.destination);
          break;
        case 'transit':
          result = await planTransitRoute(params.origin, params.destination);
          break;
        case 'riding':
          result = await planRidingRoute(params.origin, params.destination);
          break;
        case 'electric':
          result = await planElectricRoute(params.origin, params.destination);
          break;
        default:
          result = await planDrivingRoute(params.origin, params.destination, params.waypoints, params.strategy);
      }

      setRouteResult(result);

      if (result.status === RouteServiceStatus.SUCCESS) {
        const modeLabels = {
          driving: '🚗 驾车',
          walking: '🚶 步行',
          transit: '🚌 公交',
          riding: '🚴 骑行',
          electric: '🛵 电动车',
        };
        message.success(`${modeLabels[params.mode] || '出行'}规划成功！`);
      } else {
        console.warn('规划返回非成功状态', result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error(`规划过程中发生错误: ${errorMessage}`);
      return null;
    } finally {
      setRoutePlanning(false);
    }
  }, []);

  return {
    routeResult,
    setRouteResult,
    routePlanning,
    routeParams,
    routeStrategyTab,
    setRouteStrategyTab,
    routePlanIndex,
    setRoutePlanIndex,
    expandedPlanIndex,
    setExpandedPlanIndex,
    handlePlanRoute,
  };
};
