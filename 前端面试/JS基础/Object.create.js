// Object.create()作用: 创建一个新对象，使用现有对象作为新对象的原型,新对象的__proto__指向现有对象,基于原型链实现继承
// 更纯粹的原型继承: 通过Object.create()方法，可以实现更纯粹的原型继承，而不需要借助构造函数
// 创建无原型对象: Object.create(null),得到一个没有任何属性和方法的空对象
// 隔离父对象影响: 通过创建无原型对象，可以避免继承父对象的属性和方法，从而实现更好的封装性
// 语法: Object.create(proto, [propertiesObject]) 使用方法:proto是新对象的原型对象,propertiesObject是一个可选参数,包含要添加到新对象的属性和方法