// 手写map函数
Array.prototype.myMap = function(callback,thisArg) {
    if(this == null) throw new TypeError('this is null or not defined');
    const O = Object(this);
    const len = O.length >>> 0;
    const result = new Array(len);
    for(let i = 0; i < len; i++) {
        // 只处理已存在的索引，跳过稀疏数组的空位
        if(i in O) {
            result[i] = callback.call(thisArg, O[i], i, O);
        }
    }
    return result;
};

// 手写一个reduce函数
Array.prototype.myReduce = function(callback, initialValue) {
    if (this == null) throw new TypeError('this is null or not defined');
    const O = Object(this);
    const len = O.length >>> 0;
    let k = 0;
    let accumulator;
    if(arguments.length >= 2) {
        accumulator = initialValue;
    } else {
        while(k < len && !(k in O)) {
            k++;
        }
        accumulator = k < len ? O[k++] : undefined;
    }
    while(k<len){
        if(k in O) {
            accumulator = callback(accumulator, O[k], k, O);
        }
        k++;
    }
    return accumulator;
};


// 手写一个filter函数
Array.prototype.myFilter = function(callback, thisArg) {
    if (this == null) throw new TypeError('this is null or not defined');
    const O = Object(this);
    const len = O.length >>> 0;
    const result = [];
    for (let i = 0; i < len; i++) {
        if (i in O) {
            if (callback.call(thisArg, O[i], i, O)) {
                result.push(O[i]);
            }
        }
    }
    return result;
};