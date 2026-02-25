// 什么是长任务
// 长任务是指在主线程中执行时间较长的任务，通常超过50毫秒。长任务会导致页面卡顿、响应迟钝，影响用户体验。
// 规定 60FPS , 每帧的时间应该小于16.7毫秒

// 优化建议：
// 1. 将长任务拆分为多个小任务，使用requestIdleCallback或setTimeout将其分发到空闲时间执行。
// 2. 避免在主线程中执行大量计算密集型任务，可以使用Web Worker将其移到后台线程。
// 3. 对于动画和过渡效果，尽量使用CSS动画代替JavaScript动画，利用GPU加速提高性能。
// 4. 使用性能分析工具（如Chrome DevTools）监测和优化长任务，找出瓶颈并进行针对性优化。


// 任务分片
function splitTask(task, chunkSize) {
  const totalChunks = Math.ceil(task.length / chunkSize);
  let currentChunk = 0;

  function processChunk() {
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, task.length);
    const chunk = task.slice(start, end);

    // 处理当前块
    process(chunk);

    currentChunk++;
    if (currentChunk < totalChunks) {
      // 继续处理下一个块
      requestIdleCallback(processChunk);
    }
  }

  // 开始处理
  requestIdleCallback(processChunk);
}


// 