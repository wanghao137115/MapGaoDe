// 为什么需要响应式
// 1. 提高开发效率：响应式可以自动追踪依赖，减少手动更新 DOM 的工作量。
// 2. 代码简洁：通过数据驱动视图，减少了模板与逻辑的耦合。
// 3. 更好的用户体验：响应式可以实现更流畅的交互，及时更新视图。

// 手动更新 DOM 的方式
// 1. 通过 DOM API 手动操作元素，例如 document.getElementById()、element.innerHTML 等。
// 2. 需要手动维护状态与视图的一致性，容易出错。
// 3. 难以应对复杂的交互逻辑，代码可读性差。

// 响应式系统Proxy可以自动更新数据

// Proxy的拦截行为
// 1. get：拦截对象属性的读取操作，可以用于收集依赖。深层级的数据也可以被监听到。一次性收集。
// 2. set：拦截对象属性的设置操作，可以用于触发视图更新。
// 3. has：拦截属性的查询操作，可以用于实现 v-if、v-for 等指令的逻辑。
const state = {count : 0}
const p = new Proxy(state, {
    get(target, prop) {
        // 收集依赖
        return Reflect.get(target, prop);
    },
    set(target, prop, value) {
        // 触发视图更新
        return Reflect.set(target, prop, value);
    }
});

// defineProperty:拦截属性,新增属性/删除属性，数组下标，都不清楚，必须要使用vue.set/vue.delete。只对已有属性进行监听，新增属性/删除属性，数组下标，都不清楚，必须要使用vue.set/vue.delete。每个属性都要getter,setter性能太差
Object.defineProperty(state, 'count', {
    get() {
        // 收集依赖
        return count;
    },
    set(value) {
        // 触发视图更新
        count = value;
    }
});

// 总结：Proxy:拦截的是对象的行为。defineProperty:拦截的是属性的行为。 两者都不会自动更新视图。都需要依赖收集和手动触发更新。