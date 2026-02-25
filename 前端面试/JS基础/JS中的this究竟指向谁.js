// this是运行时绑定的，在函数被调用时才确定
// 四条规则：
// 1.默认绑定：全局作用域下，this指向全局对象，严格模式下，this指向undefined
// 2.隐式绑定：函数作为对象的一个方法被调用，指向调用该方法的对象本身
// 隐式丢失：将对象方法赋值给一个新变量后独立调用，导致this指向丢失，退回默认绑定
// 例子
const obj = {
    name: 'obj',
    say: function(){
        console.log(this.name);
    }
}
obj.say(); // obj
const say = obj.say;
say(); // undefined
// 3.显式绑定：函数调用时，函数被一个对象拥有或包含，this指向该对象
