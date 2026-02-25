// 依赖追踪机制：
// 1. 收集依赖：在 getter 中收集依赖，记录当前的 watcher。
// 2. 触发更新：在 setter 中触发更新，通知所有依赖的 watcher。

// 核心思路：副作用函数effect：
// 1. 收集依赖：在 effect 中执行用户的 getter 函数，收集依赖（track）。
// 2. 派发更新：当数据变化时，触发 effect 中的函数重新执行，更新视图（trigger）。

// 什么时候会开始收集依赖：在某个副作用执行期间，如果读取了响应式数据，就把这个副作用记录到数据对应的依赖集合里。
// 什么时候会触发更新：在某个副作用执行期间，如果修改了响应式数据，就会触发所有依赖的更新。

// 追踪依赖的实现 Step1 初始化两个关键变量
let activeEffect = null; //当前正在执行的副作用函数
const bucket = new WeakMap(); //收集依赖

// Step2 定义副作用函数effect，临时把fn标记为当前活跃副作用，执行fn,触发track,收集完成后清空activeEffect
function effect(fn) {
    const effectFn = () => {
        // 执行用户的副作用函数
        activeEffect = effectFn;
        fn();
        activeEffect = null;
    };
    // 将副作用函数添加到依赖收集
    bucket.set(effectFn, []);
    return effectFn;
}

// Step3 定义track函数，收集依赖
function track(effectFn) {
    if (!activeEffect) return;
    // 获取当前依赖的副作用函数集合
    let deps = bucket.get(effectFn);
    if (!deps) {
        deps = new Set();
        bucket.set(effectFn, deps);
    }
    deps.add(activeEffect);
}

// Step4 定义trigger函数，触发更新
function trigger(effectFn) {
    const deps = bucket.get(effectFn);
    if (deps) {
        deps.forEach(fn => fn());
    }
}