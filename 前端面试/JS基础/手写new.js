// 手写new
function myNew(constructor, ...args) {
    // 1. 创建一个新对象
    const obj = Object.create(constructor.prototype);
    // 2. 将新对象的__proto__指向构造函数的prototype
    // 3. 执行构造函数，this指向新对象
    const result = constructor.apply(obj, args);
    // 4. 返回新对象（如果构造函数没有返回其他对象）
    return result instanceof Object ? result : obj;
}

// 其他类型会被忽略