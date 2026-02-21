import { useEffect, useRef, useCallback } from 'react';

/** Web Worker 消息类型 */
export type WorkerMessageType =
  | 'CALCULATE_DISTANCE'
  | 'CALCULATE_TOTAL_DISTANCE'
  | 'OPTIMIZE_ROUTE'
  | 'CALCULATE_ETA'
  | 'BATCH_CALCULATE';

/** Worker 消息载荷 */
export interface WorkerPayload {
  lng1?: number;
  lat1?: number;
  lng2?: number;
  lat2?: number;
  points?: Array<{ lng: number; lat: number; id?: string }>;
  startPoint?: { lng: number; lat: number };
  currentPos?: { lng: number; lat: number };
  targetPos?: { lng: number; lat: number };
  speedMps?: number;
  pairs?: Array<{ lng1: number; lat1: number; lng2: number; lat2: number }>;
}

/** Worker 响应 */
export interface WorkerResponse {
  success: boolean;
  result?: any;
  error?: string;
  id: string;
}

/**
 * Web Worker Hook - 用于在 React 中使用 Web Worker 处理计算密集型任务
 * 
 * @example
 * const { calculateDistance, calculateTotalDistance } = useWorker();
 * 
 * // 计算两点距离
 * const distance = await calculateDistance(116.3974, 39.9093, 116.4874, 39.9093);
 */
export function useWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbacksRef = useRef<Map<string, (result: any) => void>>(
    new Map()
  );
  const idRef = useRef(0);

  useEffect(() => {
    // 创建 Worker
    workerRef.current = new Worker(
      new URL('../workers/calculation.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // 监听 Worker 消息
    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { success, result, error, id } = e.data;
      const callback = pendingCallbacksRef.current.get(id);

      if (callback) {
        if (success) {
          callback(result);
        } else {
          console.error('Worker error:', error);
          callback(null);
        }
        pendingCallbacksRef.current.delete(id);
      }
    };

    // 清理
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  /** 发送消息到 Worker 并返回 Promise */
  const postMessage = useCallback(
    (type: WorkerMessageType, payload: WorkerPayload): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const id = `msg_${++idRef.current}`;
        pendingCallbacksRef.current.set(id, resolve);

        workerRef.current.postMessage({ type, payload, id });

        // 超时处理
        setTimeout(() => {
          if (pendingCallbacksRef.current.has(id)) {
            pendingCallbacksRef.current.delete(id);
            reject(new Error('Worker message timeout'));
          }
        }, 10000);
      });
    },
    []
  );

  /** 计算两点之间的距离（米） */
  const calculateDistance = useCallback(
    (lng1: number, lat1: number, lng2: number, lat2: number) => {
      return postMessage('CALCULATE_DISTANCE', { lng1, lat1, lng2, lat2 });
    },
    [postMessage]
  );

  /** 计算轨迹总长度（米） */
  const calculateTotalDistance = useCallback(
    (points: Array<{ lng: number; lat: number }>) => {
      return postMessage('CALCULATE_TOTAL_DISTANCE', { points });
    },
    [postMessage]
  );

  /** 优化路径（最近邻算法） */
  const optimizeRoute = useCallback(
    (
      points: Array<{ lng: number; lat: number; id?: string }>,
      startPoint: { lng: number; lat: number }
    ) => {
      return postMessage('OPTIMIZE_ROUTE', { points, startPoint });
    },
    [postMessage]
  );

  /** 计算 ETA（预计到达时间，秒） */
  const calculateETA = useCallback(
    (
      currentPos: { lng: number; lat: number },
      targetPos: { lng: number; lat: number },
      speedMps: number
    ) => {
      return postMessage('CALCULATE_ETA', {
        currentPos,
        targetPos,
        speedMps,
      });
    },
    [postMessage]
  );

  /** 批量计算距离 */
  const batchCalculate = useCallback(
    (
      pairs: Array<{ lng1: number; lat1: number; lng2: number; lat2: number }>
    ) => {
      return postMessage('BATCH_CALCULATE', { pairs });
    },
    [postMessage]
  );

  return {
    calculateDistance,
    calculateTotalDistance,
    optimizeRoute,
    calculateETA,
    batchCalculate,
  };
}

export default useWorker;
