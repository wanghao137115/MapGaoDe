// 核心问题：JS代码在底层是如何被“理解”和“执行”的？
// 1.执行上下文：代码执行的“环境”是什么
// 执行上下文是代码执行的“环境”，它是一个抽象的概念，它决定了代码的执行顺序和变量的访问权限，包含变量环境，词法环境，this
// 作用域链是变量是如何实现跨层级访问的，规则从内向外逐级向上，它是一个链式结构，包含了当前执行上下文，父级执行上下文，父级父级执行上下文，直到全局执行上下文
// 执行上下文有两种，全局执行上下文和函数执行上下文，全局执行上下文是在代码执行前创建的，函数执行上下文是在函数调用时创建的
// 如何管理：栈结构，先进后出，后进先出，即调用栈
// 例子
function first(){
    console.log('first');
    second();
    console.log('first end');
}
function second(){
    console.log('second');
    third();
    console.log('second end');
}
function third(){
    console.log('third');
}
first();

// 调用栈：[first,second,third] => [second,third] => [third] => []
// 执行顺序：first => second => third => second end => first end
// 变量访问权限：first => second => third => second end => first end
// 变量访问权限：first => second => third => second end => first end  


// 作用链的形成：函数的作用域在定义时就已确定，与在哪里调用无关
// JS作用域的核心原则: 作用域链在函数定义时决定,不是调用时
// 性能影响：查找时间长：作用域链越长，查找时间越长
// 内存消耗大：作用域链越长，内存消耗越大
// 优化：闭包，函数嵌套，减少作用域链的长度
// 内存占用：闭包会占用内存，函数嵌套会占用内存

// 2.作用域链：变量是如何实现跨层级访问的