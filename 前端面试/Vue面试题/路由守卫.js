// 路由守卫
// 1. 全局守卫：在路由配置中定义，适用于所有路由的守卫。
// 2. 路由独享守卫：在路由配置中定义，只针对特定路由的守卫。
// 3. 组件内守卫：在组件内定义，适用于该组件的守卫。

// 全局守卫
router.beforeEach((to, from, next) => {
  // 在路由切换前执行的逻辑
  next();
});

// 路由独享守卫
const router = new VueRouter({
  routes: [
    {
      path: '/user/:id',
      component: User,
      beforeEnter: (to, from, next) => {
        // 在路由独享守卫中执行的逻辑
        next();
      }
    }
  ]
});

// 组件内守卫
const User = {
  beforeRouteEnter(to, from, next) {
    // 在组件内守卫中执行的逻辑
    next();
  }
};
beforeRouterUpdate(to, from, next) {
  // 在组件内守卫中执行的逻辑
  next();
}
beforeRouteLeave(to, from, next) {
  // 在组件内守卫中执行的逻辑
  next();
}

// 守卫执行顺序
// 1. 全局守卫
// 2. 路由独享守卫
// 3. 组件内守卫

// 实战建议:权限控制用beforeEach 数据预加载用beforeRouteEnter 离开确认用beforeRouteLeave