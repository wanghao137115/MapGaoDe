// 原型,原型链
// 原型是JavaScript对象的一种机制，它允许对象继承另一个对象的属性和方法。
// 每个JavaScript对象都有一个内部属性[[Prototype]]，指向它的原型对象。
// 原型链是由多个对象通过[[Prototype]]连接而成的链式结构，当访问一个对象的属性时，JavaScript会先查找该对象自身的属性，如果找不到，就会沿着原型链向上查找，直到找到该属性或到达原型链的顶端（通常是Object.prototype）。
// 为什么需要原型和原型链: 通过原型和原型链，可以实现属性和方法的共享，从而节省内存并提高性能。

// 原型的方法: Object.getPrototypeOf() 和 Object.setPrototypeOf(),Object.create():创建一个新对象,并将其原型指向指定对象。

// 属性的查找顺序:1.自身找属性 2.沿Prototype链查找 3.直到找到属性 或 到达原型链终点 4.找不到返回undefined