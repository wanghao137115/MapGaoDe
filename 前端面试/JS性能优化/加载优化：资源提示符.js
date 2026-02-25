// 什么是资源提示符：是link标签 rel属性的值，用于告诉浏览器未来即将发生的资源的处理策略，提前做准备
// 好处：1.提高网页的首屏加载性能 2.减少DNS,TCP,TLS等连接的延迟 3.预加载关键或预测性资源

// 判断：时机：是现在要用还是未来要用  深度：解析域名->建立连接->下载资源  我们要提前到哪一步

// dns-prefetch  rel = "dns-prefetch"  仅提前解析DNS，不建立连接。使用场景：非关键的第三方资源（脚本，插件）作为preconnect的降级方案

// preconnect <link rel="preconnect" crossorigin>  完成 DNS+TCP+TLS， 全流程建立连接 时机：字体库，核心API，CDN静态资源库，控制数量<=6


// preload  <link rel="proload" href="font.woff2" as="font" crossorigin> 直接下载关键资源（最高优先级）下载后暂不执行 提前触发关键资源的加载
// 场景场景：CSS定义的字体文件 背景图或LCP图片 首屏必需的动态脚本

// prefetch <link ref="prefetch"> 页面加载完后有空加载，优化“下一个页面 加载体验 场景：提前加载下一页的 JS/CSS SPA路由，用户行为预测形 预加载