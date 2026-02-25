// 对静态资源加载失败的场景进行降级处理

// 对图片资源的降级处理
const img = document.createElement('img');
img.src = 'https://example.com/image.jpg';
img.onerror = function() {
    this.src = 'https://example.com/placeholder.jpg';
};
document.body.appendChild(img);

// js css
const script = document.createElement('script');
script.src = 'https://example.com/script.js';
script.onerror = function() {
    console.error('Script failed to load, applying fallback.');
    // 这里可以添加降级处理逻辑
};
document.body.appendChild(script);

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://example.com/styles.css';
link.onerror = function() {
    console.error('Stylesheet failed to load, applying fallback.');
    // 这里可以添加降级处理逻辑
};
document.head.appendChild(link);

// 静态资源多兜底，多个CDN源

// 全局错误监控
window.onerror = function(message, source, lineno, colno, error) {
    // 发送错误信息到服务器
    console.error('Error captured:', { message, source, lineno, colno, error });
    reportError({ message, source, lineno, colno, error });
    return true; // 阻止默认错误处理
};


// promise错误捕获，结合埋点统一上报
window.addEventListener('unhandledrejection', function(event) {
    // 发送错误信息到服务器
    console.error('Promise rejected:', { reason: event.reason });
    reportError({ reason: event.reason });
});

// js

function loadScript(src, fallback) {
    const script = document.createElement('script');
    script.src = src;
    script.onerror = function() {
        console.error('Script failed to load, applying fallback.');
        if (fallback) {
            const fallbackScript = document.createElement('script');
            fallbackScript.src = fallback;
            document.body.appendChild(fallbackScript);
        }
    };
    document.body.appendChild(script);
}

// 好处: 通过这种方式，可以实现对静态资源加载失败的自动兜底处理，提高用户体验和系统稳定性。
