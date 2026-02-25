// 1. 组件渲染错误（模板错误）
// 2. 事件处理错误（用户交互）
// 3. 异步操作错误（API调用）

// 处理方式
// 1. 使用errorCaptured钩子捕获子组件的错误
// 2. 使用全局错误处理器处理未捕获的错误
// 3. 在API调用中使用try-catch捕获错误

// 代码示例
async fetchData() {
  try {
    const response = await axios.get('/api/data');
    this.data = response.data;
  } catch (error) {
    console.error('API调用错误:', error);
  }
}

errorCaptured(err, vm, info) {
  console.error('捕获到错误:', err);
  // 处理错误
}
