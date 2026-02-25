// IIFE立即执行函数：定义并立即执行一个函数，不需要手动调用
// 作用：创建一个独立的作用域，避免变量污染全局作用域
// 格式：函数表达式 + 函数调用
(function(){})()

// 隔离作用域
(function(){
    var a = 1;
    console.log(a);
})();
console.log(a);
// 输出1
// 输出undefined

// 循环中捕获变量
for(var i = 0; i < 3; i++){
    (function(index){
        // index通过闭包保存了每次循环的i值
        setTimeout(function(){
            console.log(index);
        }, 1000);
    })(i);
}

// 会隐式的返回undefined