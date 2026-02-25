// 手写Promise.all
function myPromiseAll(promises) {
    return new Promise((resolve, reject) => {
        const results = [];
        let completed = 0;

        promises.forEach((promise, index) => {
            Promise.resolve(promise)
                .then(value => {
                    results[index] = value;
                    completed++;
                    if (completed === promises.length) {
                        resolve(results);
                    }
                })
                .catch(reject);
        });
    });
}

function myPromiseAllSettled(promises) {
    return new Promise((resolve) => {
        const results = [];
        let completed = 0;

        promises.forEach((promise, index) => {
            Promise.resolve(promise)
                .then(value => {
                    results[index] = { status: 'fulfilled', value };
                })
                .catch(reason => {
                    results[index] = { status: 'rejected', reason };
                })
                .finally(() => {
                    completed++;
                    if (completed === promises.length) {
                        resolve(results);
                    }
                });
        });
    });
}

// 手写Promise.race
function myPromiseRace(promises) {
    return new Promise((resolve, reject) => {
        promises.forEach((promise) => {
            Promise.resolve(promise)
                .then(resolve)
                .catch(reject);
        });
    });
}


// 手写Promise.any
function myPromiseAny(promises) {
    return new Promise((resolve, reject) => {
        const errors = [];
        let completed = 0;

        promises.forEach((promise) => {
            Promise.resolve(promise)
                .then(resolve)
                .catch((error) => {
                    errors.push(error);
                    completed++;
                    if (completed === promises.length) {
                        reject(new AggregateError(errors));
                    }
                });
        });
    });
}
