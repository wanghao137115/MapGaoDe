// Vue的diff算法
// 1. 比较新旧虚拟节点，找出变化
// 2. 通过patch方法更新真实DOM
// 3. 采用双端比较算法，提高性能

// diff算法原理:同层节点比较，不跨层级比较，双端优化算法，时间复杂度O(n)

// patch过程 创建：新节点不存在 删除：旧的节点存在 更新：新旧节点不同 移动：通过key优化

// patch代码

function patch(oldVnode, newVnode) {
  if (!oldVnode) {
    // 创建新节点
    createElement(newVnode);
  } else if (!newVnode) {
    // 删除旧节点
    removeElement(oldVnode);
  } else if (oldVnode.tag !== newVnode.tag) {
    // 更新节点
    updateElement(oldVnode, newVnode);
  } else {
    // 移动节点
    moveElement(oldVnode, newVnode);
  }
}

// key的作用
// 1. 唯一标识：在同一层级中，key可以唯一标识一个节点，便于diff算法快速找到对应节点。
// 2. 提高性能：通过key，diff算法可以跳过不必要的比较，直接定位到需要更新的节点，减少时间复杂度。
// 3. 解决问题：key可以解决一些特殊情况，比如同级节点的移动、插入等操作，避免错误的DOM更新。