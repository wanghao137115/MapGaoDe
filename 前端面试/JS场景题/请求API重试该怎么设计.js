// 重试时机: 1. 网络错误 2. 服务器错误 3. 超时 404,401没有意义
// 重试策略：立即重试，还是等一会，等多久

function shouldRetry(error) {
    if (!error) return false;

    const { status } = error.response || {};
    // 1. 网络错误 2. 服务器错误 3. 超时
    return [408, 429, 500, 502, 503, 504].includes(status);
}

// 实现递增延迟策略
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const error = new Error('Network response was not ok');
                error.response = response;
                throw error;
            }
            return await response.json();
        } catch (error) {
            if (shouldRetry(error)) {
                attempt++;
                const delay = getRandomDelay(attempt, 100); // 递增延迟策略
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
}

// 避免多个客户端大量请求同时重试，造成雪崩，加入随机抖动
function getRandomDelay(baseDelay) {
    // 递增延迟
    const exponentialDelay = Math.pow(2, attempt) * baseDelay;
    // 加入随机抖动（例如 +-30%）
    const jitter = exponentialDelay * 0.3 * (Math.random() - 0.5);
    return exponentialDelay + jitter;
}
//好处：分散请求重试的时间，避免集中在某个时间点造成的压力峰值