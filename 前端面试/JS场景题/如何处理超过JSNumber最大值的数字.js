// 怎么处理超过JS最大值Number的数字
function handleLargeNumber(num) {
    if (num > Number.MAX_SAFE_INTEGER) {
        // 使用字符串表示法
        return num.toString();
    }
    return num;
}