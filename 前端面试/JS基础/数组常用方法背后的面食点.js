// map,filter,reduce
// 迭代方法：forEach,map,filter,reduce
// 修改原数组:splice,push,pop,shift,unshift,sort,reverse
// 返回新数组:slice,concat,join,split,toString,toLocaleString
// map怎么用,转换数组，创建新数组
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(number => number * 2);
console.log(doubled);

// filter怎么用,过滤数组，创建新数组
const evenNumbers = numbers.filter(number => number % 2 === 0);
console.log(evenNumbers);

// reduce怎么用,累加数组，创建新数组,返回单个汇总值,accumulator是累加器(负责存储上次回调的值)，currentValue是当前值
const sum = numbers.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
console.log(sum);

// splice怎么用,修改原数组，返回被删除的元素,原地修改数组（增删改）
const removed = numbers.splice(2, 1);
console.log(removed);
console.log(numbers);

// 在2的位置删除0个元素，插入10
numbers.splice(2, 0, 10);
console.log(numbers);
// 在2的位置删除1个元素，插入10
numbers.splice(2, 1, 10);
console.log(numbers);
// 在2的位置删除1个元素，插入10
numbers.splice(2, 1, 10);
console.log(numbers);
// 在2的位置删除1个元素，插入10
numbers.splice(2, 1, 10);
console.log(numbers);

// map和forEach的区别,map返回新数组，forEach返回undefined

// reduce提供初始值和不提供初始值的区别,提供初始值时，累加器从初始值开始，不提供初始值时，累加器从数组的第一个元素开始
const sum2 = numbers.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
console.log(sum2);
const sum1 = numbers.reduce((accumulator, currentValue) => accumulator + currentValue);
console.log(sum1);

// reduce不提供初始值，如果是空数组，会报错，所以一般会提供初始值

// splice vs slice
// splice返回被删除的元素，slice返回新数组