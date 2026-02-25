// 高阶函数 拦截
function createInterceptor(fn, onBefore, onAfter) {
    return function(...args) {
        if (onBefore) {
            onBefore(...args);
        }
        const result = fn(...args);
        if (onAfter) {
            onAfter(result);
        }
        return result;
    };
}

// proxy代理对象,拦截JS函数请求
function add(a, b) {
    return a + b;
}
const handler = {
    apply(target, thisArg, argumentList) {
        // 在这里可以添加拦截逻辑
        console.log('Function called with arguments:', argumentList);
        return target.apply(thisArg, argumentList);
    }
}

const proxiedAdd = new Proxy(add, handler);