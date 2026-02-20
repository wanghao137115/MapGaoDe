项目搭建

我是按照职责分层和可复用性两个原则来设计的：
> 1. 分层清晰：pages 是业务入口，components 是 UI 单元，hooks 是逻辑复用，stores 是状态管理。依赖方向是单向的，避免循环依赖。
> 2. 便于维护：当我需要修改"地图标记"功能时，直接去 components/Map/MarkerLayer.tsx，不需要在多个页面目录下查找。
> 3. 促进复用：比如 useGeolocation 这个 Hook，既可以用于物流追踪，也可以用于门店定位，一次开发多处使用。
> 4. TypeScript 友好：所有类型集中在 types/ 目录，IDE 提示和类型检查更高效。

这个物流追踪系统是基于 Vite + React 18 + TypeScript 搭建的。我从零开始初始化项目，配置了 Vite、ESLint、TypeScript 等基础工具链。
> 地图集成：通过动态加载高德地图 JS API v2.0，创建了 MapContainer 组件管理地图实例，使用 window.currentMap 全局变量让其他组件访问地图。
> 状态管理：使用 Zustand 管理车辆、任务等状态，避免了 Redux 的繁琐配置。
> 性能优化：使用 Web Workers 处理大量标记点的计算，配合 React.memo、useCallback 等减少不必要的渲染。
> 最近：刚集成了 Sentry 监控体系，用于收集生产环境的错误和性能数据，方便线上问题排查。

src/
├── components/          # 【UI 层】可复用的组件
├── pages/              # 【页面层】业务页面
├── hooks/              # 【逻辑层】可复用的业务逻辑
├── stores/             # 【状态层】全局状态管理
├── services/           # 【服务层】外部接口封装
├── types/              # 【类型层】TypeScript 类型定义
├── utils/              # 【工具层】纯函数工具
├── config/             # 【配置层】静态配置
├── workers/            # 【计算层】Web Worker
└── styles/             # 【样式层】全局样式

为什么要这样分层？
┌─────────────────────────────────────────────────────────────────┐│                    项目分层架构                                  │├─────────────────────────────────────────────────────────────────┤│                                                                 ││   ┌─────────────┐                                               ││   │   pages     │   页面层：组装组件、调用 hooks、处理交互      ││   └──────┬──────┘                                               ││          │ 组合                                                 ││   ┌──────▼──────┐                                               ││   │ components  │   组件层：UI 展示、props 接收                ││   └──────┬──────┘                                               ││          │ 调用                                                 ││   ┌──────▼──────┐                                               ││   │   hooks     │   Hooks 层：业务逻辑、数据处理               ││   └──────┬──────┘                                               ││          │ 使用                                                 ││   ┌──────▼──────┐                                               ││   │   stores    │   状态层：跨组件共享的数据                    ││   └──────┬──────┘                                               ││          │ 请求                                                 ││   ┌──────▼──────┐                                               ││   │  services   │   服务层：API 请求、第三方服务                ││   └─────────────┘                                               ││                                                                 │└─────────────────────────────────────────────────────────────────┘


7.性能提升

防抖和节流
    建议增加的防抖/节流场景：
    场景	建议	类型
    地图拖动/缩放	减少渲染频率	节流
    窗口 resize	防止频繁触发	防抖
    API 请求按钮	防止重复提交	防抖
    滚动事件	懒加载/无限滚动	节流
    输入搜索	已有，已覆盖	防抖






10.出问题了，怎么收集问题

 1. 自动化监控：集成了阿里云 ARMS，可以实时捕获 JS 错误、Promise 异常、API 慢请求等
> 2. 性能监控：监控 LCP、FCP、CLS 等 Web Vitals 指标
> 3. 分级日志：根据错误级别使用 console.error/warn/log，开发环境输出详细日志，生产环境精简



11.做压力测试，测试性能

1. 前端负载测试
在项目中实现了压力测试页面，模拟高并发场景：
测试场景：模拟 10~200 辆车同时移动、几千个标记点同时渲染
监控指标：FPS、内存占用、渲染耗时、掉帧数
评分系统：根据平均 FPS 和掉帧数给出 excellent/good/fair/poor 评分
// 核心实现思路// 1. 模拟大量数据生成const vehicles = generateVehicles(200); // 200辆车// 2. 定时更新触发重渲染setInterval(() => {  setVehicles(updatePositions(vehicles));}, 16); // 60fps// 3. 监控 FPS 和性能指标const fps = calculateFPS();const memory = performance.memory?.usedJSHeapSize;
2. 浏览器性能工具
Chrome DevTools Performance：录制页面操作，分析 FPS 曲线、CPU 使用率
Chrome DevTools Lighthouse：一键生成性能报告（LCP、FCP、CLS、TBT）
React DevTools Profiler：分析组件渲染性能，找出卡顿组件
3. 线上监控
阿里云 ARMS：实时监控 Web Vitals 指标，自动捕获 JS 错误
Sentry：错误追踪和性能监控

功能回归验证（冒烟测试）

上线完成后，立即在生产环境走一遍核心主流程（如登录、注册、下单、支付），确保基本功能可用。

性能监控

加载速度： 观察 FP（首次绘制）、FCP（首次内容绘制）、LCP（最大内容绘制）等核心 Web 指标是否有异常波动。

资源错误： 检查是否有 JS、CSS 文件加载 404。

错误监控

JS 报错： 通过 Sentry、FrontJS 或阿里云 ARMS 等平台，监控生产环境 JavaScript 执行报错。

Promise 异常： 确保有全局捕获未处理的 Promise 拒绝。

用户体验监控

白屏检测： 是否有部分用户出现白屏？（通常由于某段 JS 语法不兼容导致后续渲染中断）。

接口成功率： 观察前端请求后端的成功率是否在 99.9% 以上。