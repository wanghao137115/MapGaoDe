/* 
    三个核心问题：1.typeof null 返回 object
                2.如何准确判断一个值是否是数组
                3.掌握JS类型检查的终极武器

    七种原始类型:number,string,boolean,null,undefined,symbol,bigInt
    一种引用类型:object (Array,Function)

    typeof的两大陷阱：
        1.typeof null 返回 object 历史遗留BUG，因为JS的最初版本中，null被认为是对象的占位符，所以typeof null返回object
        2.无法具体区分对象类型 如typeof [1,2,3] 返回 object,typeof function(){} 返回 function,typeof {} 返回 object，无法区分数组和对象
    typeof的好处：如果一个变量没有被声明过，typeof会返回undefined，而不是报错
    
    如何判断一个值是否是数组
        Array.isArray(arr) 返回true或false
        arr instanceof Array 返回true或false
        Array.prototype.isPrototypeOf(arr) 返回true或false
        Array.prototype.constructor === Array 返回true或false
        Array.prototype.toString.call(arr) 返回[object Array]
        Array.prototype.constructor.name === 'Array' 返回true或false
        Array.prototype.constructor.toString() === '[object Array]' 返回true或false
        Array.prototype.constructor.toString() === '[object Array]' 返回true或false
*/