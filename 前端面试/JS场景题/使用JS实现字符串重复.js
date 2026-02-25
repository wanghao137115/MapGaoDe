// 1.repeat
const str = 'hello'
const repeat = str.repeat(3)
console.log(repeat) // hellohellohello

// array join
function repeatJoin(str,times){
    return new Array(times + 1).join(str)
}

// 循环拼接

// Array.fill join