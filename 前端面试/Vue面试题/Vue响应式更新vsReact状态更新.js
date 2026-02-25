// Vue响应式更新vsReact状态更新 
// 关键区别：
// 1. Vue是基于getter/setter的响应式原理，React是基于虚拟DOM的diff算法。
// 2. Vue在数据变化时会自动追踪依赖并更新视图，React则是通过setState手动触发更新。


// vue依赖收集：以微任务为单位进行调度。React:事件与异步任务中统一自动批处理，可用flushSync手动触发更新。