// 事件循环：因为JS是单线程的，所以需要事件循环来管理异步任务的执行顺序
// 什么是事件循环：事件循环是JavaScript的执行机制，它是一种单线程的执行模型，它负责管理异步任务的执行顺序，它是一种循环机制，它负责管理异步任务的执行顺序，它是一种循环机制，它负责管理异步任务的执行顺序

// 事件循环的执行顺序：同步代码->异步代码->微任务->宏任务
// 同步代码：按照顺序执行，遇到异步代码时，将异步代码放入异步队列中，放入栈中执行
// 异步代码：遇到异步代码时，将异步代码放入异步队列中，等待执行
// 微任务：在当前事件循环中执行，执行顺序按照先进先出原则，队列
// 宏任务：在下一个事件循环中执行，执行顺序按照先进先出原则，队列
// 示例
console.log('start');
setTimeout(() => {
    console.log('setTimeout');
}, 0);
Promise.resolve().then(() => {
    console.log('Promise');
});
console.log('end');

// 核心组成：1.调用栈 2.堆 3.任务队列 4.事件循环

// 任务分类：宏任务：setTimeout,setInterval,setImmediate（Node.js）,UI渲染,DOM事件，I/0操作，requestAnimationFrame,MessageChannel,PostMessage,WebSocket
// 任务分类：微任务：Promise.then,Promise.catch,Promise.finally,MutationObserver,process.nextTick（Node.js）


// 单流流程：1.执行同步代码知道调用栈被清空 2.执行所有微任务：清空微任务队列 3.执行一个宏任务：执行宏任务队列中的一个任务 4.重复执行2和3，直到宏任务队列为空


// Node.js中事件循环：1.执行同步代码知道调用栈被清空 2.执行所有微任务：清空微任务队列 3.执行一个宏任务：执行宏任务队列中的一个任务 4.重复执行2和3，直到宏任务队列为空
// process.nextTick：在当前事件循环中执行，执行顺序按照先进先出原则，队列