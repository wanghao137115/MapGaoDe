// JS中常见的继承方式和对比
// 1. 原型链继承 问题: 无法传递参数, 只能继承父类的属性和方法
// 举例
function Parent() {
    this.name = 'parent';
}
Parent.prototype.getName = function() {
    return this.name;
}
function Child() {
    this.age = 18;
}
Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;

// 2. 借用构造函数继承 问题: 无法继承父类原型上的方法,方法无法复用
function Child2() {
    Parent.call(this);
    this.age = 18;
}
// 3. 组合继承 问题: 需要调用两次父类构造函数, 造成不必要的开销,child.prototype上会多一份父级的属性和方法,浪费内存
function Child3() {
    Parent.call(this);
    this.age = 18;
}
Child3.prototype = Object.create(Parent.prototype);
Child3.prototype.constructor = Child3;

// 4. ES6 class 继承 机制: 使用extends关键字实现继承, 通过super关键字调用父类构造函数和方法 优点: 语法更清晰, 支持静态方法和属性, 可以使用super调用父类方法, 内置的继承机制, 不需要手动设置原型链 优点: 语法更简洁, 更易于理解和使用
class Child4 extends Parent {
    constructor() {
        super();
        this.age = 18;
    }
}
// 5.寄生继承 机制: 在一个函数内部创建一个对象, 以此对象为原型创建子类, 通过闭包实现私有变量
// 举例
function createChild5() {
    var child = Object.create(Parent.prototype);
    child.age = 18;
    return child;
}

// 6.寄生组合继承 机制: 结合寄生继承和组合继承的优点, 通过一个函数来继承父类, 通过闭包实现私有变量 优点: 可以实现私有变量的封装,解决性能问题,属性和方法都能正确继承,引用类型属性不再共享问题
// 举例
function createChild6() {
    var child = Object.create(Child.prototype);
    child.age = 18;
    return child;
}

// 7.原型式继承 机制: 通过一个对象来创建新对象, 新对象的原型指向父对象
// 举例
function createChild7() {
    var child = Object.create(Parent.prototype);
    child.age = 18;
    return child;
}

// 为什么需要继承: 通过继承，可以实现代码的重用，减少重复代码，提高代码的可维护性和可扩展性。构建层级结构: 通过继承，可以将共同的属性和方法提取到父类中，子类通过继承父类来获得这些属性和方法，从而实现代码的复用。多态: 通过继承，可以实现方法的重写和多态性，提高代码的灵活性和可扩展性。

