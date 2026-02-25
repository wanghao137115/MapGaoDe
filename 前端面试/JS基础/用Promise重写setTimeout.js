// 实例
function delayPromise(delay){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(`延迟了${delay}毫秒`);
        }, delay);
    });
}

// 配合async/await使用
async function execute() {
    const result = await delayPromise(1000);
    console.log(result);
}

// 使用.then也可以实现
Promise.resolve()
    .then(() => delayPromise(1000))
    .then(() => delayPromise(1000))
    .then(result => console.log(result));

// delayPromise本身没有rejected状态,需要手动添加
function delayPromiseWithReject(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (delay > 2000) {
                reject(`延迟时间过长: ${delay}毫秒`);
            } else {
                resolve(`延迟了${delay}毫秒`);
            }
        }, delay);
    });
}

// delayPromise本身没有取消功能, 需要手动实现
function delayPromiseWithCancel(delay) {
    let cancel;
    const promise = new Promise((resolve, reject) => {
        cancel = () => reject(`延迟被取消: ${delay}毫秒`);
        setTimeout(() => {
            resolve(`延迟了${delay}毫秒`);
        }, delay);
    });
    promise.cancel = cancel;
    return promise;
}