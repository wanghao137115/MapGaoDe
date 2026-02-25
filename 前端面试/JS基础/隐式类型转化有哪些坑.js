// 什么是隐式类型:运算或函数调用时，JS引擎自动，静默地转换操作数类型,不需要显式地调用类型转换函数

// 隐式转化发生在哪：算术运算符：+,-,*,/,%,**  关系运算符：<,>,<=,>=,==,===  逻辑运算符：&&,||,!  位运算符：&,|,^,~,<<,>>,>>>  赋值运算符：=,+=,-=,*=,/=,%=,**=  其他运算符：typeof,instanceof,in  

// 例子
console.log(true + true); // 2
console.log(true + false); // 1
console.log(false + false); // 0
console.log(true - true); // 0
console.log(true - false); // 1
console.log(false - false); // 0
console.log(true * true); // 1
console.log(true * false); // 0
console.log(false * false); // 0
console.log(true / true); // 1
console.log(true / false); // NaN
console.log(false / false); // NaN
console.log(1+null); // 1
console.log(1+undefined); // NaN
console.log(1+NaN); // NaN
console.log(1+Infinity); // Infinity
console.log(1+(-Infinity)); // -Infinity
console.log(1+Symbol('demo')); // TypeError: Cannot convert a Symbol value to a number
console.log(1+BigInt(1)); // 2n
console.log(1+BigInt(Infinity)); // Infinity
console.log(1+BigInt(-Infinity)); // -Infinity
console.log(1+BigInt(NaN)); // NaN
console.log(1+BigInt(Symbol('demo'))); // TypeError: Cannot convert a Symbol value to a bigint

//  == 的部分转换规则
null == undefined; // true
string == number; // 将string转换为number
boolean == any; // 将boolean转换为number
object == primitive; // 将object转换为primitive

// 注意null和除了undefined以外的任何值都不相等，包括0,false,''

console.log('1'==1); // true
console.log(true == 1); // true
console.log(null == undefined); // true

// [] == ![] 原理
// !逻辑非，！的优先级高于 == ，所以先执行 ![] ，[] 转换为 boolean 为 true，所以 ![] 为 false，false == false 为 true
// [] == false => [] == 0 => [].toString() == 0 => '' == 0 => 0 == 0 => true


// 对象与原始类型比较
// [10] == 10
// [10].toString() => '10'转换为 number 为 10，所以 [10] == 10 为 true
// {} == '[object Object]' => {}.toString() => '[object Object]'，所以 {} == '[object Object]' 为 true

// 始终优先使用 === 因为1.严格相等运算符 2.不进行类型装换 3.类型和值都形同时才返回true 4.从源头避免不确定性

// 在if,while,!exp中 
// false,0,null,undefined,NaN,'' 都会被转换为 false 其他值都会是true 包括 {},[]