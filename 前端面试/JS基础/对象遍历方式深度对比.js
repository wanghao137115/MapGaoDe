// 1.for in 和 Object.keys() 的区别
// 属性的形态 :1.位置不同(自有属性,原型链属性) 2.可见性不同(可枚举,不可枚举) 3.类型不同(字符串,symbol)
const sym = Symbol('demo');

const proto = {
    protoProp:'proto value'
}

const obj = Object.create(proto);
obj.ownProp = 'own value';
obj[sym] = 'sym value';

Object.defineProperty(obj, 'nonEnumProp', {
    value: 'nonEnum value',
    enumerable: false
});

// ['ownProp','protoProp']
// 容易出错,会输出所有可以枚举的属性,包括原型链上的属性
for (const key in obj) {
    console.log(key);
}
// 正确 ['ownProp']
for(let key in obj){
    if(Object.prototype.hasOwnProperty.call(obj, key)){
        console.log(key);
    }
}

// Object.keys() ['ownProp'],只返回可枚举字符串属性
Object.keys(obj).forEach(key => {
    console.log(key);
});

// 如果需要不可枚举属性,可以使用Object.getOwnPropertyNames()
Object.getOwnPropertyNames(obj).forEach(key => {
    console.log(key);
});

// 如果需要所有属性,可以使用Object.getOwnPropertyDescriptors()
Object.getOwnPropertyDescriptors(obj).forEach(key => {
    console.log(key);
});

// 返回自身的全部Symbol属性
Object.getOwnPropertySymbols(obj).forEach(key => {
    console.log(key);
});

// 最终方案:Reflect.ownKeys(),包含所有类型的属性
Reflect.ownKeys(obj).forEach(key => {
    console.log(key);
});

// 相当于
Object.keys(obj).concat(Object.getOwnPropertySymbols(obj));
console.log(keys);

// 相当于
Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj));
console.log(names);

// for...in 可以获取自身属性,原型链,可枚举,获取不了symbol属性
// Object.keys() 可以获取自身属性,可枚举字符串属性,获取不了symbol属性,获取不了原型链
// Object.getOwnPropertyNames() 可以获取自身属性,不可枚举属性,获取不了symbol属性,获取不了原型链
// Object.getOwnPropertySymbols() 可以获取自身属性,symbol属性,获取不了原型链
// Reflect.ownKeys() 可以获取自身属性,所有属性,获取不了原型链   

// 2.如何选择最适合你业务场景的遍历方法
// Reflect.ownKeys()有多强大

// 性能考量:for...in > Object.keys() > Object.getOwnPropertyNames() > Object.getOwnPropertySymbols() > Reflect.ownKeys()
// 总结:日常开发中,优先使用Reflect.ownKeys(),如果需要获取不可枚举属性,使用Object.getOwnPropertyNames(),如果需要获取symbol属性,使用Object.getOwnPropertySymbols()
// 必须警惕for...in的陷阱,因为它会遍历原型链上的属性,要配合hasOwnProperty()使用,如果需要获取自身属性,使用Object.keys()
// 克隆对象时,Reflect.ownKeys()是最佳选择,因为它会返回所有属性,包括不可枚举属性,symbol属性