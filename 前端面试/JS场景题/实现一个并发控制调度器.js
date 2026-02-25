// 实现一个并发控制调度器,使用Promise
class Scheduler {
    constructor(concurrency) {
        this.concurrency = concurrency;
        this.queue = [];
        this.running = 0;
    }

    add(promiseFn) {
        this.queue.push(promiseFn);
        this.run();
    }

    run() {
        while (this.running < this.concurrency && this.queue.length) {
            const promiseFn = this.queue.shift();
            this.running++;
            promiseFn().finally(() => {
                this.running--;
                this.run();
            });
        }
    }
}
