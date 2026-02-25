优化清单总结
加载优化
✅ 代码分割（React.lazy / Vue 异步组件）

✅ 路由懒加载

✅ 资源预加载（preload/prefetch）

✅ 图片懒加载

✅ 静态资源 CDN

运行时优化
✅ 虚拟列表（react-window / vue-virtual-scroller）

✅ 计算属性缓存（useMemo / computed）

✅ 避免不必要的渲染（React.memo / v-memo）

✅ 事件防抖/节流

✅ 函数引用缓存（useCallback）

感知优化
✅ 骨架屏

✅ 进度条

✅ 过渡动画

✅ 优先加载首屏内容

监控优化
✅ 性能指标监控

✅ 长任务检测

✅ 渲染耗时分析

✅ 错误上报

六、面试加分点
先测量，后优化：用 Lighthouse 或 Performance API 找到真正的瓶颈

了解浏览器工作原理：重排重绘、事件循环、帧的概念

权衡取舍：优化要投入产出比，不是所有地方都需要极致优化

关注 Web Vitals：LCP、FID、CLS 是核心指标

有案例支撑：可以说说自己项目中遇到的具体问题和优化方案