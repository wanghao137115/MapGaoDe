// http缓存核心：复用资源，减少延迟，节省带宽
```
HTTP缓存机制是Web性能优化中非常重要的一部分，它通过复用已获取的资源，显著减少网络延迟，降低服务器负载。

下面从几个核心概念来全面介绍HTTP缓存机制。

1. 核心概念
HTTP缓存机制主要分为两大类：

强缓存：浏览器在请求资源时，会先检查本地缓存。如果资源未过期（仍在保质期内），则直接从缓存中读取，不会发送任何请求到服务器。

协商缓存：当强缓存失效后，浏览器会携带缓存资源的标识向服务器发起请求，由服务器判断资源是否真的被修改。

如果资源未修改，服务器返回 304 Not Modified，浏览器继续使用本地缓存。

如果资源已修改，服务器返回 200 OK 和新资源，浏览器更新缓存。

2. 强缓存：由过期时间控制
强缓存主要依靠以下两个HTTP响应头字段来控制。

Expires (HTTP/1.0)
值：一个绝对的GMT时间字符串，例如 Expires: Wed, 21 Oct 2024 07:28:00 GMT。

工作原理：在这个时间之前，强缓存生效。

缺点：依赖于客户端本地时间。如果用户修改了系统时间，缓存就可能失效或出错。

Cache-Control (HTTP/1.1)
这是目前主流的强缓存控制方式，优先级高于 Expires。它是一个相对时间，更精确。

常用指令如下：

max-age=秒：例如 Cache-Control: max-age=3600，表示资源在获取后的3600秒内都是新鲜的，可以直接从缓存读取。

public：表明响应可以被任何缓存区缓存，包括代理服务器。

private：表明响应只能被用户的浏览器缓存，中间代理服务器不能缓存。

no-cache：强制进行协商缓存。它会将请求发送给服务器进行验证，无论本地缓存是否过期。

no-store：完全禁止缓存。每次请求都必须向服务器索取完整资源。

3. 协商缓存：由资源标识控制
当强缓存过期后，浏览器需要与服务器“协商”一下，确认资源是否真的发生了变化。

协商缓存通过两对请求头/响应头来实现。

第一对：基于最后修改时间
响应头 Last-Modified：服务器在返回资源时，会带上这个头，告诉浏览器资源的最后修改时间。

请求头 If-Modified-Since：当强缓存过期，浏览器发起协商请求时，会带上这个头，其值就是上次服务器返回的 Last-Modified 时间。

工作流程：

服务器收到请求，比较 If-Modified-Since 的时间和资源的最后修改时间。

如果时间一致，说明资源没变，返回 304 Not Modified。

如果时间不一致，说明资源变了，返回 200 OK 和新资源，并更新 Last-Modified。

缺点：

如果文件在短时间内被修改后又改回原状，但修改时间变了，导致不必要的重新下载。

时间的精度只到秒，对于毫秒级的变化无法感知。

第二对：基于文件指纹 (推荐)
响应头 ETag：服务器为资源生成的一个唯一标识符（通常是文件内容的哈希值，如 ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"）。只要内容变了，这个值就会变。

请求头 If-None-Match：当强缓存过期，浏览器发起协商请求时，会带上这个头，其值就是上次服务器返回的 ETag。

工作流程：

服务器收到请求，比较 If-None-Match 的值和当前资源的 ETag。

如果相同，说明内容没变，返回 304 Not Modified。

如果不同，说明内容变了，返回 200 OK 和新资源，并更新 ETag。

优先级： ETag 的优先级高于 Last-Modified。如果两者都启用，服务器会优先验证 ETag。

4. 完整流程图示
下面是一个完整的浏览器缓存决策流程图：



5. 不同位置的缓存
浏览器缓存 (私有缓存)：专门为单个用户服务，包含后退、前进等操作时也会读取的缓存。

代理缓存 (共享缓存)：部署在服务器和用户之间，如反向代理、CDN网关，可以缓存资源服务多个用户。

6. 实际场景中的应用策略
不常变的资源（如logo、图片）：

设置 Cache-Control: max-age=31536000 (一年)。

配合文件名哈希化（如 logo.a1b2c3.png）。当文件内容改变时，文件名变了，相当于一个新的请求，旧的缓存不受影响。

经常变的资源（如HTML页面）：

设置 Cache-Control: no-cache，确保每次访问都去服务器验证资源是否更新。

敏感信息（如用户信息接口）：

设置 Cache-Control: no-store，完全禁止缓存。

总的来说，HTTP缓存机制通过强缓存减少请求次数，通过协商缓存减少响应体大小，两者结合，共同提升Web应用的加载速度和用户体验。



Service Worker 是浏览器在后台独立于网页运行的脚本，它打开了通往丰富离线体验、定期后台同步以及推送通知等特性的大门。从缓存和网络请求的角度来看，它相当于一种位于浏览器内核中的 programmable network proxy（可编程网络代理），让你能够完全控制网络请求的处理方式。

以下是关于 Service Worker 的全面介绍，并特别强调它与传统 HTTP 缓存机制的关系与区别。

1. 核心概念与特性
独立线程：它运行在独立的线程中，不会阻塞页面的 JavaScript 执行。

无 DOM 访问权限：它无法直接操作页面的 DOM，但可以通过 postMessage 与页面通信。

可编程缓存：它提供了 CacheStorage API，让你可以精细地控制如何缓存请求和响应。

生命周期独立：一旦安装激活，即使关闭了网页，它也可以在后台运行（例如处理推送通知）。

必须 HTTPS：出于安全原因，Service Worker 只能在 localhost 或部署在 HTTPS 的站点上运行，以防止中间人攻击篡改脚本。

2. 生命周期
理解 Service Worker 的生命周期是掌握它的关键。主要分为三个阶段：

注册：网页的 JavaScript 告知浏览器下载并解析 Service Worker 文件。

安装：新版本的 Service Worker 首次被下载。通常在这里执行缓存静态资源（预缓存）的操作。如果缓存失败，安装过程也会失败，Worker 不会激活。

激活：旧版本的 Worker 不再控制任何客户端后，新 Worker 激活。通常在这里清理旧的缓存数据。

空闲/终止：为了节省内存，Service Worker 在空闲时会休眠。再次有事件触发（如网络请求）时会重新启动。

更新：浏览器后台线程会定期检查 Service Worker 文件是否有字节差异。若有变化，就会安装新版本并进入等待激活状态（直到旧页面全部关闭）。

3. 核心事件
Service Worker 主要通过监听事件来工作，最核心的是以下三个：

install 事件：

触发时机：Service Worker 第一次被注册时，或新版本首次下载成功后触发。

主要用途：预缓存关键静态资源（如 HTML 骨架、CSS、JS、Logo），填充缓存。

技巧：调用 event.waitUntil() 延长安装过程，直到缓存操作完成；如果 Promise 失败，安装失败，Worker 不会激活。

activate 事件：

触发时机：安装成功且旧版本不再控制客户端后触发。

主要用途：清理旧版本的缓存（例如删除老版本的 API 响应），接管所有客户端的控制权。

技巧：调用 clients.claim() 可以让新激活的 Worker 立即控制所有已打开的页面，而无需刷新页面。

fetch 事件：

触发时机：在 Service Worker 作用域范围内的页面发起的任何 HTTP 请求（包括页面本身、CSS、JS、图片、API 等）。

主要用途：拦截网络请求。在这里可以决定：从缓存返回、去网络请求、或者组合两者。

这是 PWA（渐进式 Web 应用） 实现离线访问的核心。

4. 缓存策略（请求处理模式）
结合 fetch 事件，你可以实现各种缓存策略。这里列举几种常见模式：

策略 1：Cache First (缓存优先)
适用于本地体积较大、不常变化的静态资源（如 Logo、框架库）。

javascript
// 伪代码逻辑
event.respondWith(
  caches.match(event.request).then(function(response) {
    // 有缓存就返回缓存，没有就去网络获取并存入缓存
    return response || fetch(event.request).then(function(networkResponse) {
      caches.open('v1').then(function(cache) {
        cache.put(event.request, networkResponse.clone());
      });
      return networkResponse;
    });
  })
);
策略 2：Network First (网络优先)
适用于对数据实时性要求较高，但允许离线降级的场景（如新闻列表、API 请求）。

javascript
// 伪代码逻辑
event.respondWith(
  fetch(event.request) // 先去网络
    .then(function(networkResponse) {
      // 网络成功则更新缓存并返回新数据
      caches.open('dynamic').then(cache => cache.put(event.request, networkResponse.clone()));
      return networkResponse;
    })
    .catch(function() {
      // 网络失败（如离线），则从缓存读取
      return caches.match(event.request);
    })
);
策略 3：Stale-While-Revalidate (滞后再验证)
适用于对即时性要求不高、可以稍微延迟更新的资源。这是提升性能的利器。

javascript
// 伪代码逻辑
event.respondWith(
  caches.match(event.request).then(function(cachedResponse) {
    // 不管有没有缓存，都发起一个网络请求去获取最新资源
    var fetchPromise = fetch(event.request).then(function(networkResponse) {
      // 获取成功后更新缓存（供下次使用）
      caches.open('dynamic').put(event.request, networkResponse.clone());
      return networkResponse;
    });

    // 立即返回缓存（如果存在），否则等待网络请求的结果
    return cachedResponse || fetchPromise;
  })
);
解释：用户瞬间看到的是旧缓存，但后台默默更新了缓存，下次访问就是新的。

策略 4：Cache Only / Network Only
分别只使用缓存或只使用网络，通常用于特定场景。

5. Service Worker 缓存 vs. 传统 HTTP 缓存
虽然两者可以协同工作，但它们处于不同的层次：

特性	HTTP 缓存 (浏览器缓存)	Service Worker 缓存
控制者	服务器 (通过 Response Headers)	开发者 (通过 JavaScript)
缓存位置	浏览器磁盘缓存 (Disk Cache)	独立的 CacheStorage (可枚举、可编程)
决定逻辑	基于 max-age、ETag 等标准协议	完全自定义 (通过 fetch 事件写逻辑)
离线支持	有限 (仅缓存未过期的资源)	完全可控 (可构建完整的离线 Web App)
网络请求	强缓存未命中时发送请求	可以完全拦截，选择不发送请求
更新粒度	文件级别，由服务器决定	可精细控制版本 (如 v1, v2 缓存空间)
一个请求的完整流程通常是：
Service Worker 拦截 (fetch 事件) 
→
→ 决定是否读取 CacheStorage 
→
→ 若决定去网络 
→
→ 浏览器发起 HTTP 请求 
→
→ 命中 HTTP 缓存 (Disk Cache) 
→
→ 最终返回。

6. 示例代码框架
这是一个基础的 Service Worker 脚本示例：

javascript
// sw.js
const CACHE_NAME = 'my-site-cache-v1';
const urlsToCache = ['/', '/styles/main.css', '/script/main.js'];

// 安装阶段：预缓存
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即接管所有页面
  );
});

// 拦截请求：采用缓存优先策略
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // 命中缓存则返回，否则发起网络请求
      return response || fetch(event.request);
    })
  );
});
7. 总结
Service Worker 是一种更强大的缓存/代理机制，它不受传统 HTTP 缓存过期时间的限制。

核心价值在于让网页“脱离”服务器，即使在没有网络连接的情况下，也能加载页面甚至操作部分功能。

它是 PWA 的基石，使得 Web 应用能够提供类似 Native App 的体验。
```