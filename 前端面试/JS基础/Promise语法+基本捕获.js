// Promise是什么：Promise 是一种用于表示异步操作的最终完成（或失败）及其结果值的对象。它可以让我们以更清晰的方式处理异步操作，避免回调地狱（callback hell）。
// 为什么需要Promise：在JavaScript中，异步操作非常常见，例如网络请求、文件读取等。传统的回调函数方式会导致代码难以阅读和维护，而Promise提供了一种更优雅的方式来处理这些异步操作，使得代码更加清晰和易于理解。
// Promise的状态：Promise有三种状态：pending（进行中）、fulfilled（已完成）和rejected（已拒绝）。初始状态为pending，当异步操作成功时，状态变为fulfilled，并返回结果；当异步操作失败时，状态变为rejected，并返回错误信息。
//  实例化Promise,传入一个参数executor
const myPromise = new Promise((resolve, reject) => {
    // 异步操作
    const success = true; // 模拟成功或失败
    if (success) {
        resolve("操作成功");
    } else {
        reject("操作失败");
    }
});
// Progress实例方法,then,catch,finally
myPromise
    .then(result => {
        console.log(result);
    })
    .catch(error => {
        console.error(error);
    })
    .finally(() => {
        console.log("Promise已处理完毕");
    });
// .then() 处理Promise成功或失败的结果，onFulfilled和onRejected,成功返回value,失败返回reason
// 实例方法catch,用于处理Promise的拒绝状态
// .finally() 无论Promise的结果如何，都会执行的回调,不接受任何参数，执行清理工作，如隐藏loading
// 如果Promise rejected了，但是没有对应的onRejected处理函数，Promise会被认为是未处理的拒绝状态,导致进程崩溃 处理方法: 在Promise链中添加onRejected处理函数,.catch
// 如果throw new Error("错误信息")，会被Promise捕获到，并进入catch
// 手写一个Promise
class MyPromise {
    constructor(executor) {
        this.state = "pending";
        this.value = undefined;
        this.reason = undefined;
        this.onFulfilledCallbacks = [];
        this.onRejectedCallbacks = [];

        const resolve = (value) => {
            if (this.state === "pending") {
                this.state = "fulfilled";
                this.value = value;
                this.onFulfilledCallbacks.forEach(callback => callback(value));
            }
        };

        const reject = (reason) => {
            if (this.state === "pending") {
                this.state = "rejected";
                this.reason = reason;
                this.onRejectedCallbacks.forEach(callback => callback(reason));
            }
        };

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    then(onFulfilled, onRejected) {
        return new MyPromise((resolve, reject) => {
            const handleFulfilled = () => {
                try {
                    const result = onFulfilled(this.value);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            const handleRejected = () => {
                try {
                    const result = onRejected(this.reason);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            if (this.state === "fulfilled") {
                handleFulfilled();
            } else if (this.state === "rejected") {
                handleRejected();
            } else {
                this.onFulfilledCallbacks.push(handleFulfilled);
                this.onRejectedCallbacks.push(handleRejected);
            }
        });
    }

    catch(onRejected) {
        return this.then(null, onRejected);
    }

    finally(callback) {
        return this.then(
            value => {
                callback();
                return value;
            },
            reason => {
                callback();
                throw reason;
            }
        );
    }
}

// 在原型上手写Promise
MyPromise.prototype.then = function(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
        const handleFulfilled = () => {
            try {
                const result = onFulfilled(this.value);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };

        const handleRejected = () => {
            try {
                const result = onRejected(this.reason);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };

        if (this.state === "fulfilled") {
            handleFulfilled();
        } else if (this.state === "rejected") {
            handleRejected();
        } else {
            this.onFulfilledCallbacks.push(handleFulfilled);
            this.onRejectedCallbacks.push(handleRejected);
        }
    });
};

MyPromise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
};

MyPromise.prototype.finally = function(callback) {
    return this.then(
        value => {
            callback();
            return value;
        },
        reason => {
            callback();
            throw reason;
        }
    );
};
