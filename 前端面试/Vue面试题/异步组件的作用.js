// 异步组件的作用和原理
// 作用：异步组件可以实现按需加载，减少首屏加载时间，提高应用性能。
// 原理：通过动态导入（import()）语法，将组件分割成独立的代码块，只有在需要时才加载对应的组件。

// 写法
import { defineAsyncComponent } from 'vue'
import LoadingComponent from './components/Loading.vue'
import ErrorComponent from './components/Error.vue'

const AsyncComponent = defineAsyncComponent({
  // 加载函数（必须）
  loader: () => import('./components/HeavyComponent.vue'),
  
  // 加载过程中显示的组件
  loadingComponent: LoadingComponent,
  
  // 加载失败时显示的组件
  errorComponent: ErrorComponent,
  
  // 延迟显示 loading 组件的时间（毫秒）。默认：200
  // 防止快速加载成功时的闪烁
  delay: 200,
  
  // 超时时间（毫秒）。默认：Infinity
  // 超过这个时间会显示错误组件
  timeout: 3000,
  
  // 是否可重试。默认：false
  retry: true,
  
  // 定义组件是否可挂起。默认：true
  suspensible: false,
  
  /**
   * 错误、重试、结束处理函数
   * @param {Error} error - 错误对象
   * @param {Function} retry - 重试函数
   * @param {Function} fail - 失败结束函数
   * @param {number} attempts - 尝试次数
   */
  onError(error, retry, fail, attempts) {
    if (error.message.includes('fetch') && attempts <= 3) {
      // 如果是网络错误且尝试次数小于3，则重试
      retry()
    } else {
      // 其他情况则失败
      fail()
    }
  }
})