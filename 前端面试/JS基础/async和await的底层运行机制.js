// async和await是什么
// async和await是基于Promise的语法糖，用于简化异步操作的写法，使其更像同步代码。
// async函数：返回一个Promise对象，内部可以使用await关键字
// await关键字：用于等待一个Promise对象的结果，暂停async函数的执行，直到Promise状态改变
// 核心作用：暂停async函数执行，等待Promise的结果

// 为什么要使用async/await
// 1. 代码可读性更强：async/await使异步代码看起来像同步代码，减少了回调地狱的嵌套。
// 2. 错误处理更简单：可以使用try/catch捕获错误，而不需要在每个then中添加catch。
// 3. 更好的调试体验：async/await可以更容易地进行单步调试，查看每一步的执行结果。

// await只是暂停async函数的执行，等待Promise的结果,不是阻塞整个线程

// 如何实现并发, 可以使用Promise.all()方法,最后await数组