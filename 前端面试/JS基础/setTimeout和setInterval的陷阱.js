// 为什么需要定时器：定时器是JavaScript中用于执行异步任务的机制，它允许我们在一定时间后执行代码，而不阻塞主线程

// 其中delay不是精确的，因为定时器是异步的，所以实际执行时间可能会有所延迟，实际执行受限：取决于事件循环，实际延迟>=指定延迟

// setInterval中如果里面有一个耗时任务，会导致无法在相同的间隔中执行任务，导致任务堆积，间隔失控，性能下降，行为异常
// 解决 使用递归的setTimeout来实现setInterval
// 示例
function setInterval(callback, delay) {
    let timer = null;
    function interval() {
        timer = setTimeout(() => {
            callback();
            interval();
        }, delay);
    }
    interval();
    return () => clearTimeout(timer);
}

// 问题：在非箭头函数回调中，this指向全局对象，而不是定义时的对象,无法访问期望的对象属性/方法
// 解决：使用箭头函数，this指向定义时的对象
// bind方法：返回一个新函数，新函数的this指向bind的第一个参数
// 示例
const obj = {
    name: 'obj',
    say: function(){
        console.log(this.name);
    }
}
obj.say.bind(null)();

// 取消定时器：使用id
// 示例
const id = setInterval(() => {
    console.log('tick');
}, 1000);
clearInterval(id);
