// 数组扁平化实现
// Array.prototype.flat()方法会创建一个新的数组，所有子数组元素都被递归地拼接到该数组上。
// 一层嵌套：默认展开 二曾嵌套：默认只展开一层 需要指定深度 flat(number) 如果不知道层级 flat(Infinity)

// 1. 递归实现
Array.prototype.myFlat = function(depth = 1) {
    if (this == null) throw new TypeError('this is null or not defined');
    const O = Object(this);
    const len = O.length >>> 0;
    let result = [];
    for (let i = 0; i < len; i++) {
        if (i in O) {
            const item = O[i];
            if (Array.isArray(item) && depth > 0) {
                result = result.concat(item.myFlat(depth - 1));
            } else {
                result.push(item);
            }
        }
    }
    return result;
};

// 2.reduce实现
Array.prototype.myFlat = function(arr,depth = 1) {
    if(!Array.isArray(arr)) {
        throw new TypeError('Input must be an array');
    }
    return arr.reduce((acc, item) => {
        if(Array.isArray(item) && depth > 0) {
            return acc.concat(this.myFlat(item, depth - 1));
        } else {
            return acc.concat(item);
        }
    }, []);
};


