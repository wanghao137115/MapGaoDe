// Vue怎么解决跨域
// 1. CORS：通过设置服务器的CORS头部，允许特定来源的请求。
// 2. 代理：使用开发环境中的代理配置，将请求转发到目标服务器。
// 3. JSONP：通过动态创建script标签，利用script标签不受跨域限制的特性，进行跨域请求。
// 4. iframe：通过嵌套iframe的方式，利用不同域之间的window.postMessage进行通信。
// 5. WebSocket：通过WebSocket建立持久连接，绕过同源限制，实现跨域通信。
// 6. Nginx反向代理：通过Nginx配置反向代理，将跨域请求转发到目标服务器。