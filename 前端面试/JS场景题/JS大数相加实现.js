// JS数字精度限制：2的53次方 - 1，即9007199254740991 大于会丢失精度，存储数字的空间有限                                                                                                                                          
// JS大数相加实现
function addLargeNumbers(num1, num2) {
    // 反转字符串以便从低位开始相加
    let reversedNum1 = num1.split('').reverse().join('');
    let reversedNum2 = num2.split('').reverse().join('');

    let maxLength = Math.max(reversedNum1.length, reversedNum2.length);
    let carry = 0;
    let result = [];

    for (let i = 0; i < maxLength; i++) {
        let digit1 = parseInt(reversedNum1[i]) || 0;
        let digit2 = parseInt(reversedNum2[i]) || 0;

        let sum = digit1 + digit2 + carry;
        carry = Math.floor(sum / 10);
        result.push(sum % 10);
    }

    // 如果还有进位，添加到结果中
    if (carry) {
        result.push(carry);
    }

    // 反转结果并返回
    return result.reverse().join('');
}


function addBigNumber(a,b){
    let result = '';
    let carry = 0;

    let i = a.length - 1;
    let j = b.length - 1;

    while (i >= 0 || j >= 0 || carry) {
        let digitA = i >= 0 ? parseInt(a[i]) : 0;
        let digitB = j >= 0 ? parseInt(b[j]) : 0;

        let sum = digitA + digitB + carry;
        carry = Math.floor(sum / 10);
        result = (sum % 10) + result;

        i--;
        j--;
    }

    return result;
}