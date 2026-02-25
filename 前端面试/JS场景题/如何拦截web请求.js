// 使用ajax库进行拦截
function createInterceptor(ajax) {
    const originalSend = ajax.send;
    ajax.send = function(...args) {
        console.log('Intercepted AJAX request:', args);
        return originalSend.apply(this, args);
    };
}

// 使用示例
const ajax = new XMLHttpRequest();
createInterceptor(ajax);