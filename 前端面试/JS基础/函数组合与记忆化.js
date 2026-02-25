// 函数组合：提高可读性，增强可维护性，每个函数职责单一，修改和测试更方便
// compose函数：将多个函数组合成一个函数，从右到左依次执行
// pipe函数：将多个函数组合成一个函数，从左到右依次执行
// 函数记忆化：缓存函数结果，避免重复计算，提高性能
// memoize实现原理：使用一个对象缓存函数结果，如果函数被调用，则返回缓存的结果，否则计算结果并缓存
// 例子
function memoize(fn) {
    const cache = new Map();
    return function(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }else{
            const result = fn(...args);
            cache.set(key, result);
            return result;
        }
    }
}

// 举例，耗时的Fib函数,使用memoize优化
const memoizedFib = memoize(function(n) {
    if(n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
});

console.log(memoizedFib(10));
console.log(memoizedFib(10));

