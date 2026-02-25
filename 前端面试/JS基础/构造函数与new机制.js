// 为什么需要构造函数:构造函数是一种特殊类型的函数，用于创建和初始化对象。通过构造函数，可以创建多个具有相同属性和方法的对象实例，从而实现代码的复用和组织。

// API与用法
function Person(name, age) {
    this.name = name;
    this.age = age;
}

Person.prototype.sayHello = function() {
    console.log(`你好，我是${this.name}，今年${this.age}岁。`);
};

const person1 = new Person('Alice', 30);
const person2 = new Person('Bob', 25);

// new运算符的机制
// 1. 创建一个新对象
// 2. 将新对象的__proto__指向构造函数的prototype
// 3. 执行构造函数，this指向新对象
// 4. 返回新对象（如果构造函数没有返回其他对象）
// 5. 如果构造函数返回一个对象，则返回该对象,如果显示返回原始值，则返回新对象