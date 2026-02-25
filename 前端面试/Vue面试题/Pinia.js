// Pinia使用方法
const store = defineStore({
  id: 'main',
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++;
    }
  }
});


// 如果解构破坏响应式，使用storeToRefs,方法不能解构


// pinia最小可变点原则:只在必要时更新状态，避免不必要的重渲染
