// Vue自定义属性 el指令绑定的元素，binding指令对象，vnode虚拟节点
// 指令定义:
// 全局定义
Vue.directive('my-directive', {
  bind(el, binding, vnode) {
    // 指令逻辑
  }
});

// 局部定义
export default {
  directives: {
    'my-directive': {
      bind(el, binding, vnode) {
        // 指令逻辑
      }
    }
  }
};

// 动态传值 updated binding.value获取最新值

// 使用场景：权限控制按钮，复杂动画效果，第三方库集成


