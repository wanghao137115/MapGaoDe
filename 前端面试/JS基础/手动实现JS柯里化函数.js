// 柯里化函数:将一个多参数函数转换为一系列单参数函数的过程,简单来说就是可以不用一次性接收很多个参数
// 作用：延迟执行，提前固定部分参数，生成新函数,提高函数可复用性，创建预设参数的新函数，避免重复编写，更好地组合函数，易于与其他函数串联，形成复杂逻辑流
// 结构
function curry(fn) {
    return function curried(...args) {
        // 判断逻辑
        if(args.length >= fn.length) {
            return fn(...args);
        }else{
            return function(...args2) {
                return curried.apply(this, args.concat(args2));
            };
        }
    }
}