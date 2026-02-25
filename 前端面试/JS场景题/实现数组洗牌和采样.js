// 面试题：手写一个数组洗牌，保证每个元素等概率
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 数组随机采样，抽取k个不重复元素
function sampleArray(arr, k) {
    const result = [...arr]
    if (k > result.length) throw new Error("Sample size exceeds result array length");
    for(let i = 0;i< k ;i++){
        const j = i + Math.floor(Math.random() * (result.length - i));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return shuffled.slice(0, k);
}