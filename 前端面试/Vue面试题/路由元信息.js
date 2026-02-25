// 路由元信息是什么:
// 路由元信息是指与路由相关的附加信息，可以在路由配置中通过meta字段定义。
// 例如，可以在meta中定义权限、标题、描述等信息。

// 使用方法
const routes = [
  {
    path: '/user/:id',
    component: User,
    meta: {
      requiresAuth: true,
      title: '用户详情'
    }
  }
];

// 访问路由元信息
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // 需要权限验证
  }
  document.title = to.meta.title || '默认标题';
  next();
});

// 组件中访问路由元信息
const User = {
  created() {
    const { requiresAuth, title } = this.$route.meta;
    if (requiresAuth) {
      // 需要权限验证
    }
    document.title = title || '默认标题';
  }
}; 