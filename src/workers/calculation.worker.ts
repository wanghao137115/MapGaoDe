/**
 * Web Worker for handling computationally intensive tasks
 * This runs in a separate thread to avoid blocking the main UI thread
 */

// 计算两点之间的距离（米）
function calculateDistance(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number
): number {
  const R = 6371000; // 地球半径（米）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// 计算轨迹总长度（米）
function calculateTotalDistance(
  points: Array<{ lng: number; lat: number }>
): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += calculateDistance(
      points[i - 1].lng,
      points[i - 1].lat,
      points[i].lng,
      points[i].lat
    );
  }
  return total;
}

// 简单的路径优化（最近邻算法）
function optimizeRoute(
  points: Array<{ lng: number; lat: number; id?: string }>,
  startPoint: { lng: number; lat: number }
): Array<{ lng: number; lat: number; id?: string }> {
  if (points.length <= 2) return points;

  const result: Array<{ lng: number; lat: number; id?: string }> = [];
  const remaining = [...points];
  let current = startPoint;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistance(
        current.lng,
        current.lat,
        remaining[i].lng,
        remaining[i].lat
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    current = remaining[nearestIdx];
    result.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return result;
}

// 计算 ETA（预计到达时间）
function calculateETA(
  currentPos: { lng: number; lat: number },
  targetPos: { lng: number; lat: number },
  speedMps: number // 米/秒
): number {
  const distance = calculateDistance(
    currentPos.lng,
    currentPos.lat,
    targetPos.lng,
    targetPos.lat
  );
  return distance / speedMps; // 返回秒数
}

// 消息处理
self.onmessage = (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  try {
    let result: any;

    switch (type) {
      case 'CALCULATE_DISTANCE':
        result = calculateDistance(
          payload.lng1,
          payload.lat1,
          payload.lng2,
          payload.lat2
        );
        break;

      case 'CALCULATE_TOTAL_DISTANCE':
        result = calculateTotalDistance(payload.points);
        break;

      case 'OPTIMIZE_ROUTE':
        result = optimizeRoute(payload.points, payload.startPoint);
        break;

      case 'CALCULATE_ETA':
        result = calculateETA(
          payload.currentPos,
          payload.targetPos,
          payload.speedMps
        );
        break;

      case 'BATCH_CALCULATE':
        // 批量计算多个点对之间的距离
        result = payload.pairs.map((pair: any) =>
          calculateDistance(pair.lng1, pair.lat1, pair.lng2, pair.lat2)
        );
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    self.postMessage({ success: true, result, id });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      id,
    });
  }
};

export {};
