// 所有数组去重的方法

// 1. 使用 Set
function uniqueArray1(arr) {
    return [...new Set(arr)];
}

// 2. filter + indexOf 有特殊情况：NaN不等于自身，会无法筛选掉
function uniqueArray2(arr) {
    return arr.filter((item, index) => arr.indexOf(item) === index);
}
// 改进
function uniqueArray2Update(arr){
    const result = [];
    arr.forEach(item => {
        if (!result.includes(item)) {
            result.push(item);
        }
    });
    return result;
}

// 3. reduce
function uniqueArray3(arr) {
    return arr.reduce((acc, item) => {
        if (!acc.includes(item)) {
            acc.push(item);
        }
        return acc;
    }, []);
}

// 4. forEach
function uniqueArray4(arr) {
    const result = [];
    arr.forEach(item => {
        if (!result.includes(item)) {
            result.push(item);
        }
    });
    return result;
}

// 5. sort + filter
function uniqueArray5(arr) {
    arr.sort();
    return arr.filter((item, index) => item !== arr[index - 1]);
}

// 6. Map + filter：处理单个字段
function uniqueArray6(arr) {
    const map = new Map();
    return arr.filter(item => {
        if (!map.has(item[key])) {
            map.set(item[key], true);
            return true;
        }
        return false;
    });
}

// 针对整个对象去重
function uniqueArray7(arr) {
    const map = new Map();
    return arr.filter(item => {
        const key = JSON.stringify(item);
        if (!map.has(key)) {
            map.set(key, true);
            return true;
        }
        return false;
    });
}


// 大结合，Set做基础，Map处理对象,理解NaN的坑
function uniqueArray(arr) {
    // 使用Map作为基础数据结构，可以处理对象和NaN
    const map = new Map();
    const result = [];
    
    for (const item of arr) {
        // 处理NaN的特殊情况
        if (typeof item === 'number' && isNaN(item)) {
            // 检查是否已经有NaN存在
            if (!result.some(existingItem => typeof existingItem === 'number' && isNaN(existingItem))) {
                result.push(item);
            }
        } 
        // 处理对象：使用JSON.stringify作为key（注意：这种方法有局限性）
        else if (typeof item === 'object' && item !== null) {
            const key = JSON.stringify(item);
            if (!map.has(key)) {
                map.set(key, true);
                result.push(item);
            }
        }
        // 处理基本类型
        else {
            if (!map.has(item)) {
                map.set(item, true);
                result.push(item);
            }
        }
    }
    
    return result;
}