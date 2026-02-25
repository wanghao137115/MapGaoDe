// 闭包是一个函数，记住了创建它的外部环境（作用域）
// 作用：数据封装，私有变量，保持状态，记住外部环境,延迟执行，事件处理，异步回调
// 如何形成闭包：当一个内部函数，被暴露到词法作用域之外，闭包就形成了
function Greet(greeting){
    return function(name){
        console.log(greeting+','+name+"!")
    }
}

const syHello = Greet('Hello')

syHello('Alic')

// 打印 Hello,Alic !


// 循环中的异步问题
for (var index = 0; index < 5; index++) {
    setTimeout(()=>{
        console.log(index)
    },index*100)
    
}

// 会一直打印5，存在异步问题

// 解决方法1，立即执行函数
for (var index = 0; index < 5; index++) {
    (function(index){
        setTimeout(()=>{
            console.log(index)
        },index*100)
    })(index)
}
// 立即执行函数每次迭代都创建新的作用域

// 方法2 使用 let 

// 注意内存开销，引用的外部变量会一直保存在内存，直到闭包被回收
// 捕获的是引用，记住的是变量本身，变量值改变，闭包内访问的也会改变(除非使用立即执行函数或let创建新变量)
// 基于词法作用域，判断依据是定义位置，与执行位置无关

// 总结：能访问到已销魂的外部作用域的变量


