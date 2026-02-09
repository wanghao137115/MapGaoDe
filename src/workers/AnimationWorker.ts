/**
 * Animation Worker - 车辆轨迹平滑动画
 *
 * 功能：
 * 1. 基于三次贝塞尔曲线的位置插值
 * 2. requestAnimationFrame 动画帧调度
 * 3. 缓动函数实现自然加减速
 *
 * 使用方法：
 * const animator = new AnimationWorker();
 * animator.postMessage({
 *   type: 'START_ANIMATION',
 *   vehicleId: 'vehicle_1',
 *   from: { lng: 116.0, lat: 39.0 },
 *   to: { lng: 116.1, lat: 39.1 },
 *   duration: 1000,
 * });
 * animator.onmessage = (e) => {
 *   const { vehicleId, position } = e.data;
 *   // 更新车辆位置
 * };
 */

import type { MapPosition } from '@/types';

// ==================== 类型定义 ====================

/** 动画消息：开始动画 */
interface StartAnimationMessage {
  type: 'START_ANIMATION';
  vehicleId: string;
  from: MapPosition;
  to: MapPosition;
  duration: number;  // 毫秒
  easing?: EasingType;
}

/** 动画消息：停止动画 */
interface StopAnimationMessage {
  type: 'STOP_ANIMATION';
  vehicleId: string;
}

/** 动画消息：更新动画目标（连续动画用） */
interface UpdateTargetMessage {
  type: 'UPDATE_ANIMATION_TARGET';
  vehicleId: string;
  to: MapPosition;
  duration?: number;  // 可选，保留原时长
}

/** 动画消息：批量更新车辆位置 */
interface BatchUpdateMessage {
  type: 'BATCH_UPDATE';
  vehicles: Array<{
    vehicleId: string;
    from: MapPosition;
    to: MapPosition;
    duration: number;
    easing?: EasingType;
  }>;
}

/** 动画帧消息 */
interface AnimationFrameMessage {
  type: 'ANIMATION_FRAME';
  vehicleId: string;
  position: MapPosition;
  progress: number;  // 0 ~ 1
}

/** 动画结束消息 */
interface AnimationEndMessage {
  type: 'ANIMATION_END';
  vehicleId: string;
  finalPosition: MapPosition;
}

/** 缓动函数类型 */
type EasingType = 
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic';

// ==================== 缓动函数 ====================

/** 线性 */
function linear(t: number): number {
  return t;
}

/** 二次缓入：加速 */
function easeInQuad(t: number): number {
  return t * t;
}

/** 二次缓出：减速 */
function easeOutQuad(t: number): number {
  return t * (2 - t);
}

/** 二次缓入缓出：先加速后减速 */
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/** 三次缓入：更明显的加速 */
function easeInCubic(t: number): number {
  return t * t * t;
}

/** 三次缓出：更明显的减速 */
function easeOutCubic(t: number): number {
  return (--t) * t * t + 1;
}

/** 三次缓入缓出：更平滑 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

/** 缓动函数映射 */
const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
};

// ==================== 贝塞尔曲线 ====================

/**
 * 检查是否是有效的经纬度
 */
function isValidPosition(pos: MapPosition, vehicleId?: string): boolean {
  if (!pos || typeof pos !== 'object') {
    if (vehicleId) {
      console.warn('[AnimationWorker] 位置为 null/undefined:', vehicleId);
    }
    return false;
  }
  const lng = pos.lng;
  const lat = pos.lat;
  if (
    typeof lng !== 'number' ||
    typeof lat !== 'number' ||
    Number.isNaN(lng) ||
    Number.isNaN(lat)
  ) {
    if (vehicleId) {
      console.warn('[AnimationWorker] 位置包含 NaN:', vehicleId, { lng, lat });
    }
    return false;
  }
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    if (vehicleId) {
      console.warn('[AnimationWorker] 位置不是有限数:', vehicleId, { lng, lat });
    }
    return false;
  }
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    if (vehicleId) {
      console.warn('[AnimationWorker] 位置超出范围:', vehicleId, { lng, lat });
    }
    return false;
  }
  return true;
}

/**
 * 限制数值在合理范围内
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 计算贝塞尔控制点（带限制）
 */
function calculateControlPoints(from: MapPosition, to: MapPosition): {
  cp1: MapPosition;
  cp2: MapPosition;
} {
  // 计算方向向量
  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;

  // 控制点偏移量（限制最大偏移，防止贝塞尔曲线过度弯曲）
  const maxOffset = 0.1; // 最大 0.1 度
  const factor = Math.min(0.3, maxOffset / Math.max(Math.abs(dx), Math.abs(dy), 0.0001));

  // p1: 起点偏向终点的方向
  const cp1: MapPosition = {
    lng: from.lng + dx * factor,
    lat: from.lat + dy * factor,
  };

  // p2: 终点偏向起点的方向
  const cp2: MapPosition = {
    lng: to.lng - dx * factor,
    lat: to.lat - dy * factor,
  };

  return { cp1, cp2 };
}

/**
 * 安全的贝塞尔曲线插值（带 NaN 检查）
 */
function cubicBezier(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  // 确保输入是有效数字
  if (
    !Number.isFinite(p0) ||
    !Number.isFinite(p1) ||
    !Number.isFinite(p2) ||
    !Number.isFinite(p3) ||
    !Number.isFinite(t)
  ) {
    return p3; // 降级到终点
  }

  const u = 1 - t;
  const result =
    u * u * u * p0 +
    3 * u * u * t * p1 +
    3 * u * t * t * p2 +
    t * t * t * p3;

  // 限制结果在合理范围内
  const lngBound = 180;
  const latBound = 90;

  if (p0 >= -lngBound && p0 <= lngBound) {
    return clamp(result, -lngBound, lngBound);
  }
  if (p0 >= -latBound && p0 <= latBound) {
    return clamp(result, -latBound, latBound);
  }

  return Number.isFinite(result) ? result : p3;
}

/**
 * 贝塞尔曲线位置插值（带安全检查）
 */
function interpolatePosition(
  from: MapPosition,
  to: MapPosition,
  t: number,
  easing: EasingType = 'easeInOutQuad'
): MapPosition {
  // 验证输入
  if (!isValidPosition(from) || !isValidPosition(to)) {
    console.warn('[AnimationWorker] interpolatePosition 无效位置:', { from, to });
    return to; // 降级到终点
  }

  // 限制 t 在 [0, 1] 范围内
  const clampedT = clamp(t, 0, 1);

  // 应用缓动函数
  const easedT = EASING_FUNCTIONS[easing](clampedT);

  // 计算控制点
  const { cp1, cp2 } = calculateControlPoints(from, to);

  // 贝塞尔曲线插值
  return {
    lng: cubicBezier(from.lng, cp1.lng, cp2.lng, to.lng, easedT),
    lat: cubicBezier(from.lat, cp1.lat, cp2.lat, to.lat, easedT),
  };
}

// ==================== 动画状态管理 ====================

interface ActiveAnimation {
  vehicleId: string;
  from: MapPosition;
  to: MapPosition;
  duration: number;
  easing: EasingType;
  startTime: number;
  requestId: number;
}

// 正在进行的动画
const activeAnimations = new Map<string, ActiveAnimation>();

// ==================== 动画帧调度 ====================

/**
 * 执行单帧动画
 */
function tick(
  vehicleId: string,
  currentTime: number,
  sendFrame: (msg: AnimationFrameMessage) => void,
  sendEnd: (msg: AnimationEndMessage) => void
): void {
  const animation = activeAnimations.get(vehicleId);
  if (!animation) return;
  
  const { from, to, duration, easing, startTime } = animation;
  
  // 计算进度
  const elapsed = currentTime - startTime;
  let progress = elapsed / duration;
  
  if (progress >= 1) {
    // 动画结束
    progress = 1;
    const finalPosition = interpolatePosition(from, to, progress, easing);
    
    sendEnd({
      type: 'ANIMATION_END',
      vehicleId,
      finalPosition,
    });
    
    // 清理动画状态
    if (animation.requestId) {
      cancelAnimationFrame(animation.requestId);
    }
    activeAnimations.delete(vehicleId);
    return;
  }
  
  // 计算当前位置
  const position = interpolatePosition(from, to, progress, easing);
  
  // 发送帧数据
  sendFrame({
    type: 'ANIMATION_FRAME',
    vehicleId,
    position,
    progress,
  });
  
  // 继续下一帧
  animation.requestId = requestAnimationFrame((time) => {
    tick(vehicleId, time, sendFrame, sendEnd);
  });
}

/**
 * 开始单个动画
 */
function startAnimation(
  msg: StartAnimationMessage,
  sendFrame: (msg: AnimationFrameMessage) => void,
  sendEnd: (msg: AnimationEndMessage) => void
): void {
  const { vehicleId, from, to, duration, easing = 'easeInOutQuad' } = msg;

  // 验证位置数据有效性
  if (!isValidPosition(from, vehicleId) || !isValidPosition(to, vehicleId)) {
    console.warn('[AnimationWorker] 无效的动画位置，跳过:', { vehicleId, from, to });
    // 直接发送结束消息，使用目标位置
    sendEnd({
      type: 'ANIMATION_END',
      vehicleId,
      finalPosition: isValidPosition(to) ? to : (isValidPosition(from) ? from : { lng: 0, lat: 0 }),
    });
    return;
  }

  // 验证持续时间
  if (!Number.isFinite(duration) || duration <= 0) {
    console.warn('[AnimationWorker] 无效的动画持续时间，使用默认值:', duration);
  }

  // 如果已有该车辆的动画，先停止
  stopAnimation(vehicleId);

  // 创建动画
  const animation: ActiveAnimation = {
    vehicleId,
    from,
    to,
    duration: Number.isFinite(duration) && duration > 0 ? duration : 1000,
    easing,
    startTime: performance.now(),
    requestId: 0,
  };

  activeAnimations.set(vehicleId, animation);

  // 开始动画帧调度
  tick(vehicleId, animation.startTime, sendFrame, sendEnd);
}

/**
 * 停止动画
 */
function stopAnimation(vehicleId: string): void {
  const animation = activeAnimations.get(vehicleId);
  if (animation && animation.requestId) {
    cancelAnimationFrame(animation.requestId);
  }
  activeAnimations.delete(vehicleId);
}

/**
 * 更新动画目标（连续动画核心逻辑）
 * 当收到新的 GPS 目标点时，保持动画连续性，从当前位置平滑过渡到新目标
 */
function updateAnimationTarget(
  msg: UpdateTargetMessage,
  sendFrame: (msg: AnimationFrameMessage) => void,
  sendEnd: (msg: AnimationEndMessage) => void
): void {
  const { vehicleId, to, duration } = msg;

  // 检查是否有正在进行的动画
  const existingAnimation = activeAnimations.get(vehicleId);
  if (!existingAnimation) {
    // 没有动画，直接开始新动画
    console.warn('[AnimationWorker] UPDATE_ANIMATION_TARGET 但无现有动画，转为 START');
    const startMsg: StartAnimationMessage = {
      type: 'START_ANIMATION',
      vehicleId,
      from: { lng: 0, lat: 0 },
      to,
      duration: duration || 800,
      easing: 'easeInOutCubic',
    };
    startAnimation(startMsg, sendFrame, sendEnd);
    return;
  }

  // 验证新目标位置
  if (!isValidPosition(to, vehicleId)) {
    console.warn('[AnimationWorker] UPDATE_ANIMATION_TARGET 无效目标位置，跳过:', { vehicleId, to });
    return;
  }

  // 验证现有动画的 from/to 是否有效
  if (!isValidPosition(existingAnimation.from, vehicleId) || !isValidPosition(existingAnimation.to, vehicleId)) {
    console.warn('[AnimationWorker] UPDATE_ANIMATION_TARGET 现有动画位置无效，重新开始');
    stopAnimation(vehicleId);
    const startMsg: StartAnimationMessage = {
      type: 'START_ANIMATION',
      vehicleId,
      from: existingAnimation.from,
      to,
      duration: duration || 800,
      easing: 'easeInOutCubic',
    };
    startAnimation(startMsg, sendFrame, sendEnd);
    return;
  }

  // 计算当前时间对应的位置（从原 from 到原 to 的中间位置）
  const currentTime = performance.now();
  const elapsed = currentTime - existingAnimation.startTime;
  const currentProgress = Math.min(elapsed / existingAnimation.duration, 0.999);
  const currentPosition = interpolatePosition(
    existingAnimation.from,
    existingAnimation.to,
    currentProgress,
    existingAnimation.easing
  );

  console.log(`[AnimationWorker] UPDATE: ${vehicleId}, 剩余进度: ${(currentProgress * 100).toFixed(1)}%, 中间点: ${currentPosition.lng.toFixed(6)},${currentPosition.lat.toFixed(6)}`);

  // 计算新动画的参数
  const newDuration = duration || existingAnimation.duration * (1 - currentProgress);
  const newEasing = existingAnimation.easing;

  // 停止当前动画
  stopAnimation(vehicleId);

  // 创建新动画，从当前位置到新目标
  const newAnimation: ActiveAnimation = {
    vehicleId,
    from: currentPosition,
    to,
    duration: Math.max(newDuration, 100),
    easing: newEasing,
    startTime: performance.now(),
    requestId: 0,
  };

  activeAnimations.set(vehicleId, newAnimation);

  // 立即执行第一帧
  tick(vehicleId, newAnimation.startTime, sendFrame, sendEnd);
}

/**
 * 批量更新：快速连续动画时使用
 */
function batchUpdate(
  msg: BatchUpdateMessage,
  sendFrame: (msg: AnimationFrameMessage) => void,
  sendEnd: (msg: AnimationEndMessage) => void
): void {
  const { vehicles } = msg;
  const now = performance.now();

  vehicles.forEach(({ vehicleId, from, to, duration, easing = 'easeInOutQuad' }) => {
    // 验证位置数据
    if (!isValidPosition(from, vehicleId) || !isValidPosition(to, vehicleId)) {
      console.warn('[AnimationWorker] batchUpdate 无效位置，跳过:', { vehicleId, from, to });
      sendEnd({
        type: 'ANIMATION_END',
        vehicleId,
        finalPosition: isValidPosition(to) ? to : (isValidPosition(from) ? from : { lng: 0, lat: 0 }),
      });
      return;
    }

    // 停止现有动画
    stopAnimation(vehicleId);

    // 创建新动画
    const animation: ActiveAnimation = {
      vehicleId,
      from,
      to,
      duration: Number.isFinite(duration) && duration > 0 ? duration : 1000,
      easing,
      startTime: now,
      requestId: 0,
    };

    activeAnimations.set(vehicleId, animation);

    // 开始动画（立即执行第一帧）
    tick(vehicleId, now, sendFrame, sendEnd);
  });
}

// ==================== Worker 消息处理 ====================

self.onmessage = (event: MessageEvent<StartAnimationMessage | StopAnimationMessage | UpdateTargetMessage | BatchUpdateMessage>) => {
  const msg = event.data;
  
  // 发送帧消息的包装器
  const sendFrame = (frameMsg: AnimationFrameMessage) => {
    self.postMessage(frameMsg);
  };
  
  // 发送结束消息的包装器
  const sendEnd = (endMsg: AnimationEndMessage) => {
    self.postMessage(endMsg);
  };
  
  switch (msg.type) {
    case 'START_ANIMATION':
      startAnimation(msg, sendFrame, sendEnd);
      break;

    case 'STOP_ANIMATION':
      stopAnimation(msg.vehicleId);
      self.postMessage({
        type: 'ANIMATION_END',
        vehicleId: msg.vehicleId,
        finalPosition: activeAnimations.get(msg.vehicleId)?.to || { lng: 0, lat: 0 },
      });
      break;

    case 'UPDATE_ANIMATION_TARGET':
      updateAnimationTarget(msg, sendFrame, sendEnd);
      break;

    case 'BATCH_UPDATE':
      batchUpdate(msg, sendFrame, sendEnd);
      break;
  }
};

export {};
