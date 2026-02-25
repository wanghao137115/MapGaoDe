// 为什么需要bind函数:在JS函数中，this指向会随着调用方式改变。回调函数，时间监听器中this丢失是常见问题。bind提供了在函数调用前，强制指定this的能力

// 手写bind函数

Function.prototype.myBind = function(thisArg,...args) {
    const originalFunc = this;

    // 检查调用是函数
    if(typeof originalFunc !== 'function') {
        throw new Error('Function.prototype.myBind - 只能绑定函数');
    }
    // 返回一个新函数
    const boundFunc = function(...args2) {
        const totalArgs = args.concat(args2);
        if(this instanceof boundFunc) {
            // 当boundFunc 作为构造函数时，this指向新创建的对象
            // bind时的thisArg失效，需要将 originalFunc 作为构造函数调用
            const instance = new originalFunc(...totalArgs);
            return instance;
        } else {
            // 当boundFunc 作为普通函数调用时，this指向thisArg
            return originalFunc.apply(thisArg, totalArgs);
        }
    }
    return boundFunc;
}

// 注意事项:1.bind函数会返回一个新函数，这个新函数会继承原函数的属性和方法
// 2.bind函数会创建一个新函数，这个新函数会绑定原函数和thisArg
// 3.bind后的函数再new时，thisArg失效，this指向新创建的对象，bind无法改变第一次bind确定的this和参数

// thisArg不同值的处理:1.null或undefined时，this指向全局对象
// 2.基本类型值会被包装为对象
// 3.对象时，this指向该对象
// 4.函数时，this指向该函数
// 5.数组时，this指向该数组
// 6.字符串时，this指向该字符串
// 7.符号时，this指向该符号
// 8.布尔值时，this指向该布尔值
// 9.数字时，this指向该数字
// 10.空值时，this指向全局对象