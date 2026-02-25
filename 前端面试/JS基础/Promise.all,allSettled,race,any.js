// Promise中的四个静态方法,分别是all,allSettled,race和any
// 1. Promise.all()：用于将多个Promise实例包装成一个新的Promise实例，
//    只有当所有Promise都成功时，新的Promise才会成功，并返回一个包含所有成功结果的数组；
//    如果有一个Promise失败，则新的Promise立即失败，并返回失败的原因。
//
// 2. Promise.allSettled()：类似于Promise.all()，但不管各个Promise的结果如何，
//    最终都会返回一个包含每个Promise结果的数组，结果对象包含status和value或reason。
//
// 3. Promise.race()：用于竞争多个Promise实例，
//    只要有一个Promise成功或失败，新的Promise就会立即返回该Promise的结果。
//
// 4. Promise.any()：用于处理多个Promise实例，
//    只要有一个Promise成功，新的Promise就会返回该Promise的结果；
//    如果所有Promise都失败，则返回一个AggregateError，包含所有失败的原因。