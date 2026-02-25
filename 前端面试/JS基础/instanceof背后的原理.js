// instanceof作用: 用于检测一个对象是否是另一个对象的实例
// 它为什么比typeof和.constructor更常用: instanceof可以正确识别对象的原型链，而typeof只能判断基本数据类型，.constructor只能判断对象的构造函数。
// instanceof的原理: 当使用instanceof运算符时，JavaScript会检查对象的原型链，看看是否存在一个对象的原型等于构造函数的prototype属性。如果找到了这样的对象，那么instanceof返回true，否则返回false。会沿着原型链向上查找，直到找到为止。
// 例如:
function simulatedInstanceOf(obj, constructor) {
    let proto = Object.getPrototypeOf(obj);
    while (proto) {
        if (proto === constructor.prototype) {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}

// 各种数据调用instanceOf
const str = 'heelo';
const arr = [];
const objString = new String('hello');
const Nul = null;
const Un = undefined;

console.log(str instanceof String); // false
console.log(arr instanceof Array); // true
console.log(objString instanceof String); // true
console.log(Nul instanceof Object); // false
console.log(Un instanceof Object); // false

// 不能检测原始类型,对包装对象new String('hello')除外