// requestAnimationFrame与requestIdleCallback
// 核心区别
// 1. requestAnimationFrame用于动画帧的请求，浏览器会在下次重绘之前调用回调函数，适合用于需要高帧率的动画场景。优先级高，在下一帧渲染前执行
// 2. requestIdleCallback用于在浏览器空闲时执行任务，适合用于非紧急的后台任务，如数据预加载、缓存更新等。优先级低，浏览器空闲时执行