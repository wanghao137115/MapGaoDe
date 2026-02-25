/* 
    浅拷贝：1.创建一个新对象 2.将原对象的属性值复制到新对象 3.如果属性值是引用类型，则复制引用地址
    深拷贝：1.创建一个新对象 2.将原对象的属性值复制到新对象 3.如果属性值是引用类型，则递归复制属性值

    浅拷贝实现1：Object.assign({},obj) ，扩展运算符 {...obj} 

    深拷贝的实现：1.递归复制 
                2.JSON.parse(JSON.stringify(obj))缺陷：忽略undefined,function,symbol,bigInt等类型,Date对象变成字符串，无法处理循环引用
                3.structuredClone(obj) 缺陷：无法拷贝函数，无法拷贝Error对象/DOM节点  现代化方法，首选
                4.lodash.cloneDeep(obj) 缺陷：性能较差，不推荐使用

    手写深拷贝思路分析：1.处理边界：如果是NULL或者非object类型，直接返回
                      2.处理循环引用：用WeakMap存储已拷贝过的对象，避免死循环
                      3.创建新容器：判断是数组还是对象，创建对应的空容器[]或{}
                      4.递归拷贝：遍历原始对象属性，递归调用deepClone赋值给新容器

    为什么要拷贝：1.避免意外的副作用，不污染数据。2.实现状态的不可变性，React/vue核心机制 3.隔离数据：创建完全独立的数据快照                  
*/

function deepClone(obj,hash = new WeakMap()){
    if(obj !== null||typeof obj !== 'object') return obj;
    let newObj = Array.isArray(obj)?[]:{}
    hash.set(obj,newObj)
    for(let key in obj){
        if(Object.prototype.hasOwnProperty.call(obj,key)){
            newObj[key] = deepClone(obj[key],hash)
        }
    }
    return newObj
}