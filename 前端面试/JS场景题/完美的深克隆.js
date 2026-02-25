// 使用JSON.stringify和JSON.parse方法可以实现简单的深克隆，但它有一些限制，比如无法克隆函数、undefined、Symbol等特殊类型的数据，并且会丢失对象的原型链。

// 如果出现循环引用会导致，栈溢出。

// 手写完美的深克隆
function deepClone(obj, hash = new WeakMap()) {
    if (obj == null || typeof obj !== 'object') return obj;
    if (hash.has(obj)) return hash.get(obj);
    const clone = Array.isArray(obj) ? [] : {};
    hash.set(obj, clone);
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clone[key] = deepClone(obj[key], hash);
        }
    }
    return clone;
}

// 改进版
function deepClone2(obj, hash = new WeakMap()) {
    // 处理 null 和基本类型
    if (obj === null || typeof obj !== 'object') return obj;
    
    // 处理循环引用
    if (hash.has(obj)) return hash.get(obj);
    
    // 处理特殊对象类型
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof RegExp) return new RegExp(obj);
    if (obj instanceof Map) {
        const map = new Map();
        hash.set(obj, map);
        obj.forEach((value, key) => {
            map.set(deepClone(key, hash), deepClone(value, hash));
        });
        return map;
    }
    if (obj instanceof Set) {
        const set = new Set();
        hash.set(obj, set);
        obj.forEach(value => {
            set.add(deepClone(value, hash));
        });
        return set;
    }
    
    // 处理数组和普通对象
    const clone = Array.isArray(obj) ? [] : {};
    hash.set(obj, clone);
    
    // 复制所有属性（包括 Symbol 属性）
    Reflect.ownKeys(obj).forEach(key => {
        clone[key] = deepClone(obj[key], hash);
    });
    
    return clone;
}