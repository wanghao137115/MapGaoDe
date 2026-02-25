// 列出所有vue的钩子函数,并且列出作用
// 1. beforeCreate: 实例初始化之前调用，数据观测和事件配置之前。
// 2. created: 实例创建完成后调用，数据观测和事件配置已完成。
// 3. beforeMount: 在挂载开始之前调用，相关的 render 函数首次被调用。
// 4. mounted: 实例被挂载后调用，DOM 结构已被渲染。
// 5. beforeUpdate: 数据更新之前调用，发生在虚拟 DOM 重新渲染和打补丁之前。
// 6. updated: 数据更新之后调用，发生在虚拟 DOM 重新渲染和打补丁之后。
// 7. beforeDestroy: 实例销毁之前调用，相关的事件监听器被移除。
// 8. destroyed: 实例销毁之后调用，所有的事件监听器被移除。
// 9. activated: 被 keep-alive 组件激活时调用。
// 10. deactivated: 被 keep-alive 组件停用时调用。
// 11. beforeRouteEnter: 在路由进入之前调用，适合用于权限验证等。
// 12. beforeRouteLeave: 在路由离开之前调用，适合用于保存状态等。
// 13. beforeRouteUpdate: 在路由更新之前调用，适合用于处理路由参数变化等。
// 14. beforeEnter: 在路由进入之前调用，适合用于权限验证等。
// 15. beforeEach: 在路由切换之前调用，适合用于全局权限验证等。
