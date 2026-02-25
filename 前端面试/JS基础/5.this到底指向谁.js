// 显示绑定：通过特定方法强制指定this,方法bind,apply,call
// call(thisArg,arg1,....) 立即调用函数，this指向thisArg 参数逐个传递
// applay(thisArg,[arr]) 立即调用函数，this指向thisArg 参数以数组的形式传递
// bind(thisArg) 不立即调用，返回一个this被永久绑定的新函数

// new关键字做了什么，1.创建一个全新对象{} 2.新对象的原型链接到构造函数的prototype 3.新对象被绑定为函数调用的this 4.隐式返回this
// 例子
function Person(name){
    // 1.this = {} 隐式
    this.name = name
    // 2.return this 隐式
}

const alice = new Person('boy')

// 箭头函数 没有自己的this绑定，this由定义时所在的此法作用域决定，一旦绑定不可被call/apply/bind 修改this指向
// 箭头函数的this捕获的是定义时的环境，而非调用时
// 绑定规则优先级  1.new绑定>2.显示绑定（apply/bind/call）>3.隐式绑定（对象方法调用）>4.默认绑定（全局或undefined）
const Timer = {
    seconds:0,
    start() {
        setTimeout(function(){
            console.log(this.seconds)
        },1000)
    }
}
Timer.start();

// setTimeout中的函数是独立调用，会丢失上下文，即触发默认绑定，this指向为window，window上没有seconds,故报错
// 显示绑定 setTimeout(function(){}.bind(this),1000) 或  setTimeout(()=>{},1000) 会绑定start的this
