// 用户反映 页面卡顿或反映慢，因为不同的网络，设备，浏览器照成差异，可能在资源加载，渲染或交互延迟

// 问题根源：1.网络：WIFI vs 3G 2.设备性能：高配笔电 vs 低端手机 3.浏览器版本 4.地理位置不同CDN节点响应差异

// 解决在用户端收集数据。这正是RUM的核心思想

// RUM：真实用户监控：通过捕捉回传用户的性能指标，环境信息，异常日志。 目标：帮助开发者还原现场，定位瓶颈，验证优化效果

// 使用PerfomanceObserver采集性能数据

const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
        console.log(entry.name,entry.startTime,entry.duration)
    });
});

observer.observe({ entryTypes: ['xxx'] });

// 异常日志 JS执行错误 资源加载失败 Promise未处理异常
window.addEventListener('error',e => {
    reportError({type:'js-error',message:e.message})
})

window.addEventListener('unhandledrejection',e => {
    reportError({type:'promise-reject',reason:e.reason})
})






