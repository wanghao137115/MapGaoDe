// 使用 fetch 发起跨域请求
```‌前端设置‌：

在发起跨域请求时，需要设置 withCredentials 为 true。
对于 fetch 请求，可以设置 credentials: 'include'。
对于 axios 请求，可以设置 withCredentials: true。
‌后端设置‌：

响应头中必须包含 Access-Control-Allow-Credentials: true。
Access-Control-Allow-Origin 必须指定具体的域名，不能使用通配符 *。
如果使用 fetch，需要确保响应头中包含 Access-Control-Allow-Origin 和 Access-Control-Allow-Credentials。
‌Cookie 设置‌：

Cookie 的 SameSite 属性必须设置为 None，并且 Secure 属性必须为 true（必须在 HTTPS 环境下）。
Cookie 的 domain 属性需要设置为允许跨域访问的域名。

```
fetch('https://api.example.com/data', {
  credentials: 'include' // 携带 Cookie
})
.then(response => response.json())
.then(data => console.log(data));

// 使用 axios 发起跨域请求
axios.defaults.withCredentials = true;
axios.get('https://api.example.com/data')
  .then(response => console.log(response.data));


// 后端响应头设置示例 (Node.js + Express)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://your-website.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});


// 设置 Cookie 时的注意事项
document.cookie = "name=value; domain=.example.com; secure; samesite=None";