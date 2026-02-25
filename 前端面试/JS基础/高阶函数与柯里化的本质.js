// 什么是高阶函数：一个函数接受函数作为参数或返回一个函数作为结果的函数
// 什么是柯里化：将一个接受多个参数的函数转换为一系列接受一个参数的函数的技术
// 为什么需要他们：柯里化：等待所有参数传入再执行，生成定制新函数

// 经典高阶函数举例
// map,filter,reduce
const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map(x => x * x);
console.log(squared);

// 柯里化举例
function curry(fn) {
    return function(a) {
        return function(b) {
            return fn(a, b);
        }
    }
}
const add = curry((a, b) => a + b);
console.log(add(1)(2));

// 缺点：性能开销，代码可读性降低，this的指向不直观，考虑使用箭头函数或bind

// 实现特定功能的HOF(once,debounce,throttle)
function once(fn) {
    let called = false;
    return function(...args) {
        if (!called) {
            called = true;
            return fn(...args);
        }
    }
}
const sayHello = once(() => console.log('Hello'));
sayHello();
sayHello();

function debounce(fn, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    }
}
const sayHello1 = debounce(() => console.log('Hello'), 1000);
sayHello1();
sayHello1();
setTimeout(sayHello1, 1000);
setTimeout(sayHello1, 1000);

function throttle(fn, delay) {
    let lastTime = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastTime >= delay) {
            lastTime = now;
            return fn(...args);
        }
    }
}
const sayHello2 = throttle(() => console.log('Hello'), 1000);
sayHello2();

// 实现一个通用的curry函数
function curry(fn) {
    return function(...args) {
        if (args.length >= fn.length) {
            return fn(...args);
        }
        return function(...args2) {
            return curry(fn)(...args, ...args2);
        }
    }
}
const add1 = curry((a, b) => a + b);
console.log(add1(1)(2));