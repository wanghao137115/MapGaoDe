# 城市生活服务地图平台 - 项目介绍

## 项目概况

基于高德地图 JS API + Web 服务接口，提供城市切换、地点搜索/历史、分类榜单（美食/酒店/景点/小区）、"在此区域搜索"、POI 列表与详情、地图标记与标签、路线规划与路线方案展示等功能。

## 技术架构

- **前端框架**: React + TypeScript
- **构建工具**: Vite
- **UI 组件库**: Ant Design
- **地图服务**: 高德地图 JS API / Web Service API
- **状态管理**: Zustand
- **性能监控**: 阿里云 ARMS
- **错误监控**: 阿里云 ARMS

## 核心功能

### 1. 地图能力集成
- 封装地图容器与标记层，支持多类型标记渲染、拖拽更新、选中高亮与信息展示
- 扩展标记文字标签能力，支持智能避让算法
- 通过智能节流配置优化海量标记渲染（`INTERACTION_PAUSE_MS = 800ms`，`NORMAL_THROTTLE_MS = 500ms`）

### 2. 搜索体验
- 地点搜索与历史记录（本地缓存）
- 四大分类入口（美食/酒店/景点/小区）与推荐榜单
- 防抖搜索优化（500ms）
- 搜索结果实时统计

### 3. 智能筛选与排序
- 「全城/区域/地铁站」三级筛选
- 基于地图可视范围 + 缩放等级动态计算搜索半径
- 「在此区域搜索」边界兜底逻辑

### 4. 路线规划
- 支持驾车、步行、公交、骑行、电动车多种出行方式
- 路线历史记录管理
- 路线方案展示与切换

### 5. 物流追踪
- 实时车辆位置更新
- 轨迹回放功能
- 任务状态管理

## 自定义 Hooks

本项目封装了多个自定义 Hook，用于复用业务逻辑和提升开发效率：

| Hook | 文件位置 | 用途 | 为什么需要自定义 Hook |
|------|----------|------|----------------------|
| `usePerformance` | `src/hooks/usePerformance.ts` | 性能监控 | 封装性能监控逻辑，提供 start/stop/measure 等方法 |
| `useWorker` | `src/hooks/useWorker.ts` | Web Worker 通信 | 将计算密集型任务放到 Worker 线程，避免阻塞主线程 |
| `useMapTools` | `src/hooks/useMapTools.ts` | 地图工具状态 | 封装地图交互状态（路况、测距、卫星图等） |
| `useGeolocation` | `src/hooks/useGeolocation/index.ts` | 浏览器定位 | 封装浏览器 Geolocation API |
| `useSearchHistory` | `src/hooks/useSearchHistory.ts` | 搜索历史 | 封装 localStorage 读写，分离数据管理逻辑 |
| `useRoutePlanning` | `src/hooks/useRoutePlanning.ts` | 路线规划 | 封装路线规划业务逻辑 |
| `useRouteHistory` | `src/hooks/useRouteHistory.ts` | 路线历史 | 管理路线规划历史记录 |
| `useCityWeather` | `src/hooks/useCityWeather.ts` | 城市天气 | 封装天气查询逻辑 |
| `useUsageStats` | `src/hooks/useUsageStats.ts` | 使用统计 | 收集真实的使用数据，用于性能分析 |

## 性能优化实践

### 1. 渲染优化
- `React.memo` 缓存组件避免不必要的重渲染
- `useMemo` / `useCallback` 缓存计算结果和函数
- `useDeferredValue` 延迟非关键状态更新

### 2. 网络优化
- 防抖/节流优化搜索请求
- Web Worker 处理计算密集型任务

### 3. 监控与分析
- 阿里云 ARMS 实时监控
- Web Vitals (FCP, LCP) 性能指标
- 自定义使用统计收集真实数据

## 真实统计数据

> 以下数据通过项目内置的 `useUsageStats` Hook 收集统计
> 
> 在浏览器控制台执行 `window.getUsageStats()` 查看当前会话数据

### 搜索统计
- 总搜索次数
- 缓存命中次数与命中率
- 平均响应时间

### 标记渲染
- 渲染次数
- 平均渲染时间

### 用户行为
- 页面浏览次数
- 累计停留时长
- 分类点击分布
- POI 详情点击转化

### 首屏性能
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)

### 路线规划
- 总规划次数
- 成功次数与成功率

---

**查看统计数据**: 在浏览器控制台执行 `window.getUsageStats()` 可查看当前会话的真实使用数据。
