// 手写一个EventEmitter
// 数据结构设计：使用Map:为什么用set自动去重，避免重复订阅。为什么用Map：O(1)的时间复杂度
class EventEmitter {
    private events: Map<string, Set<Function>>;

    constructor() {
        this.events = new Map();
    }

    on(event: string, listener: Function) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event)!.add(listener);
    }

    off(event: string, listener: Function) {
        if (!this.events.has(event)) return;
        if (listener) {
            this.events.get(event)?.delete(listener);
        }else{
            this.events.delete(event);
        }
    }

    emit(event: string, ...args: any[]) {
        if (!this.events.has(event)) return;
        this.events.get(event)?.forEach(listener => {
            listener(...args);
        });
    }

    once(event: string, listener: Function) {
        const onceListener = (...args: any[]) => {
            listener(...args);
            this.off(event, onceListener);
        };
        this.on(event, onceListener);
    }
}