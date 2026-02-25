// 怎么判断点在canvas图形内
function isPointInPath(ctx, x, y) {
    return ctx.isPointInPath(x, y);
}

function isPointInStroke(ctx, x, y) {
    return ctx.isPointInStroke(x, y);
}

// 自定义几何检测算法
function isPointInRectangle(x, y, rect) {
    return (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
    );
}

function isPointInCircle(x, y, circle) {
    const dx = x - circle.x;
    const dy = y - circle.y;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
}