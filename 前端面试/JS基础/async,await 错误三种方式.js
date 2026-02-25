// 如何捕获 await抛出的错误
// 方法一: try...catch
async function execute() {
    try {
        const result = await delayPromise(1000);
        console.log(result);
    } catch (error) {
        console.error(error);
    }
}
// 方法二: .catch()
async function execute() {
    const result = await delayPromise(1000).catch(error => {
        console.error(error);
    });
}
// 方法三: 对单个await Promise使用.catch()
async function execute() {
    const result = await delayPromise(1000).catch(error => {
        console.error(error);
    });
}