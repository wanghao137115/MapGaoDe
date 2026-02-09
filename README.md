# React 智能地图应用平台

基于 React 18 + TypeScript + Vite + Ant Design 5 + 高德地图 JS API v2.0 构建的智能地图应用平台。

## ✨ 功能特性

### 🗺️ 基础地图功能
- 高德地图集成与动态加载
- 多种地图类型切换（普通/卫星/3D）
- 地图控件（缩放、比例尺、工具条、地图类型）
- 响应式设计，支持移动端

### 📍 标记管理系统
- 标记点增删改查（CRUD）
- 标记类型支持（门店/仓库/车辆/用户）
- 拖拽更新位置
- 搜索和筛选功能
- 聚合显示（MarkerCluster）

### 🚛 物流追踪系统
- 实时车辆位置监控
- 配送任务管理
- 车辆轨迹回放与实时显示
- 配送过程时间线
- 车辆状态管理（空闲/行驶中/配送中/维修中）

### 🏪 门店定位系统
- 门店信息展示
- 服务范围可视化（圆形覆盖物）
- 营业状态显示
- 门店筛选（城市/类型/状态）
- 智能信息弹窗

### 🛠️ 地图工具集
- 区域绘制（圆形/多边形）
- 距离测量
- 面积测量
- 地图截图
- 位置分享

### 🎨 用户体验
- 现代化UI设计（Ant Design 5）
- 实时数据更新
- 响应式布局
- 直观的操作反馈

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
npm install
```

### 环境配置
1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 获取高德地图 Key：
   - 访问 [高德地图开放平台](https://lbs.amap.com/)
   - 注册账号并创建应用
   - 获取 JS API Key

3. 配置环境变量：
```env
VITE_AMAP_KEY=your_amap_key_here
VITE_API_BASE=https://api.example.com
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 运行测试
```bash
npm run test
```

## 📁 项目结构

```
src/
├── components/          # 组件
│   ├── Map/            # 地图相关组件
│   │   ├── MapContainer.tsx      # 地图容器
│   │   ├── MarkerLayer.tsx       # 标记层
│   │   ├── RouteLayer.tsx        # 路径层
│   │   ├── DrawingLayer.tsx      # 绘制层
│   │   └── MeasurementLayer.tsx  # 测量层
│   └── UI/             # UI组件
│       └── InfoWindow.tsx        # 信息弹窗
├── pages/              # 页面组件
│   ├── MapPlayground.tsx         # 基础地图演示
│   ├── LogisticsTracking.tsx     # 物流追踪
│   ├── StoreLocator.tsx          # 门店定位
│   └── MapTools.tsx              # 地图工具
├── hooks/              # 自定义Hooks
│   └── useGeolocation.ts         # 地理定位Hook
├── services/           # 服务层
│   └── map/            # 地图服务
├── stores/             # 状态管理
├── types/              # 类型定义
├── utils/              # 工具函数
└── test/               # 测试相关
```

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design 5
- **地图服务**: 高德地图 JS API v2.0
- **状态管理**: Zustand
- **样式**: CSS Modules + Ant Design
- **测试**: Vitest + React Testing Library
- **代码质量**: ESLint + Prettier + Husky

## 📝 开发计划

本项目按20天开发计划完成，涵盖：
1. 项目初始化与基础配置
2. 路由与布局框架
3. 地图服务集成
4. 基础地图组件
5. 定位功能
6. 状态管理
7. 标记渲染
8. 标记CRUD与筛选
9. 信息弹窗系统
10. 路径规划服务
11. 路径规划UI
12. 聚合点功能
13. 物流追踪基础
14. 物流追踪轨迹与时间线
15. 门店定位基础
16. 门店定位高级功能
17. 地图工具集
18. 性能优化
19. 测试补齐
20. 文档整理

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式 : 18588974719

如有问题或建议，请通过以下方式联系：
- 项目Issues: [GitHub Issues](https://github.com/wanghao137115/MapGaoDe.git)
- 邮箱: wanghao1858897@qq.com

---

⭐ 如果这个项目对你有帮助，请给我们一个star！
