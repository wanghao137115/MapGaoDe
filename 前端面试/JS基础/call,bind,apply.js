// call,bind,apply都是Function.prototype上的方法
// 作用：控制函数运行时的this指向
// 如何控制函数运行时的this指向


// call,apply,bind区别
// call方法 call(this,arg1,arg2,arg3...) 立即执行函数，参数逐个传入
// thisArg为null或undefined时，this指向全局对象,基本类型值会被包装
// 手写call方法
Function.prototype.myCall = function(thisArg, ...args) {
    thisArg = thisArg || window;
    thisArg.fn = this;
    const result = thisArg.fn(...args);
    delete thisArg.fn;
    return result;
}
// 例子
const obj = {
    name: 'obj',
    say: function(){
        console.log(this.name);
    }
}
obj.say.myCall(null);



// apply方法 apply(this,[arg1,arg2,arg3...]) 立即执行函数，参数以数组形式传入
// 手写apply方法
Function.prototype.myApply = function(thisArg, args) {
    thisArg = thisArg || window;
    thisArg.fn = this;
    const result = thisArg.fn(...args);
    delete thisArg.fn;
    return result;
}

// 例子
const obj1 = {
    name: 'obj',
    say: function(){
        console.log(this.name);
    }
}
obj1.say.myApply(null, [1, 2, 3]);

// bind方法 bind(this,arg1,arg2,arg3...) 返回一个新函数，需要手动调用
// bind返回值，是原函数的拷贝，this和部分参数已经预先设置
// 如果把bind创建的新对象new,原来的thisArg会被忽略，this指向新对象
// 手写bind方法
Function.prototype.myBind = function(thisArg, ...args) {
    const fn = this;
    return function(...args2) {
        return fn.apply(thisArg, args.concat(args2));
    }
}
// 例子
const obj2 = {
    name: 'obj',
    say: function(){
        console.log(this.name);
    }
}
obj2.say.myBind(null, 1, 2, 3)();
// 区别：call和apply是立即执行的，bind是返回一个新函数，需要手动调用
