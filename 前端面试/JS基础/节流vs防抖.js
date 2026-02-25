// 节流vs防抖
// 节流：在一定时间内，只执行一次函数,控制事件的触发频率，周期性执行
// 实现原理：使用时间戳或定时器，记录上次执行时间，如果时间间隔小于一定时间，则不执行，否则执行
// 场景:滚动事件，窗口大小调整事件，鼠标移动事件
function throttle(fn, delay) {
    let lastTime = 0;
    return function(...args) {
        const now = Date.now();
        const context = this;
        if (now - lastTime >= delay) {
            lastTime = now;
            return fn.apply(context, args);
        }
    }
}
const sayHello = throttle(() => console.log('Hello'), 1000);
sayHello();
sayHello();
setTimeout(sayHello, 1000);
setTimeout(sayHello, 1000);



// 防抖：在一定时间内，只执行一次函数,控制坚决的触发时机，事件触发后，延迟执行回调函数，如果在延迟时间内，事件再次触发，则重新计时
// 实现原理：使用定时器，记录上次执行时间，如果时间间隔小于一定时间，则不执行，否则执行
// 场景：搜索框输入事件，窗口大小调整事件，鼠标移动事件,输入框输入事件
function debounce(fn, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(context, args), delay);
    }
}
const sayHello1 = debounce(() => console.log('Hello'), 1000);
sayHello1();
sayHello1();
setTimeout(sayHello1, 1000);
setTimeout(sayHello1, 1000);


// 为什么要优化目标
// 1.减少事件处理器的调用次数，提高性能 2.降低CPU负载，提高页面性能 3.减轻服务器压力 4.提升用户体验

