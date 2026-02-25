// LRU:最近最少使用缓存策略
// 应用场景：浏览器缓存、数据库缓存、API请求缓存等
// 时间复杂度要求：get和set操作的时间复杂度均为O(1)
// 数据结构选择：哈希表 + 双向链表 哈希表：插入，查找，删除，无法维护访问顺序
// 双向链表：维护访问顺序，快速删除最久未使用的节点

class ListNode {
    key: number;
    value: any;
    prev: ListNode | null;
    next: ListNode | null;

    constructor(key: number = 0, value: number = 0) {
        this.key = key;
        this.value = value;
        this.prev = null;
        this.next = null;
    }


}


class LRUCache {
    private capacity: number;
    private cache: Map<number, ListNode>;
    private head: ListNode;
    private tail: ListNode;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.cache = new Map();
        this.head = new ListNode();
        this.tail = new ListNode();
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    private removeNode(node: ListNode) {
        node.prev!.next = node.next;
        node.next!.prev = node.prev;
    }

    private addNodeToHead(node: ListNode) {
        node.next = this.head.next;
        node.prev = this.head;
        this.head.next!.prev = node;
        this.head.next = node;
    }

    get(key: number): any {
        const node = this.cache.get(key);
        if (!node) return null;

        this.removeNode(node);
        this.addNodeToHead(node);
        return node.value;
    }

    set(key: number, value: any) {
        const node = this.cache.get(key);
        if (node) {
            this.removeNode(node);
        } else if (this.cache.size === this.capacity) {
            const lru = this.tail.prev!;
            this.removeNode(lru);
            this.cache.delete(lru.key);
        }

        const newNode = new ListNode(key, value);
        this.addNodeToHead(newNode);
        this.cache.set(key, newNode);
    }
}