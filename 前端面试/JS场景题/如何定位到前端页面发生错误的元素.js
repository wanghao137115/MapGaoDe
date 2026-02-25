// 方法1：浏览器开发工具
// 方法2：元素检查器
// 方法3：事件监听器

// 错误监控和上报
// 全局错误捕获
window.onerror = function(message, source, lineno, colno, error) {
    // 发送错误信息到服务器
    // 参数分别表示：错误信息，脚本来源，行号，列号，错误对象
    console.error('Error captured:', { message, source, lineno, colno, error });
    reportError({ message, source, lineno, colno, error });
    return true; // 阻止默认错误处理
};


// promise错误捕获
window.addEventListener('unhandledrejection', function(event) {
    // 发送错误信息到服务器
    console.error('Promise rejected:', { reason: event.reason });
    reportError({ reason: event.reason });
});