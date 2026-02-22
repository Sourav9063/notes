"use strict";

const fs = require("fs");

/**
 * 1. FAST I/O (Crucial Optimization for Codeforces)
 * Note: Remove this entire section for LeetCode.
 */
const buffer = fs.readFileSync(0);
let offset = 0;

function readNext() {
    while (offset < buffer.length && buffer[offset] <= 32) offset++;
    if (offset >= buffer.length) return null;
    let start = offset;
    while (offset < buffer.length && buffer[offset] > 32) offset++;
    return buffer.toString("utf8", start, offset);
}

function readInt() {
    while (offset < buffer.length && buffer[offset] <= 32) offset++;
    if (offset >= buffer.length) return null;
    let res = 0, sign = 1;
    if (buffer[offset] === 45) { sign = -1; offset++; } // '-' is 45 in ASCII
    while (offset < buffer.length && buffer[offset] > 32) {
        res = res * 10 + (buffer[offset] - 48);
        offset++;
    }
    return res * sign;
}

function readBigInt() {
    const word = readNext();
    return word ? BigInt(word) : null;
}

/**
 * 2. C++ STL EQUIVALENTS
 */

// --- O(1) Queue (Replaces std::queue) ---
class Queue {
    constructor() { this.q = []; this.head = 0; }
    push(x) { this.q.push(x); }
    pop() {
        if (this.empty()) return null;
        const res = this.q[this.head++];
        if (this.head * 2 >= this.q.length) {
            this.q = this.q.slice(this.head);
            this.head = 0;
        }
        return res;
    }
    front() { return this.empty() ? null : this.q[this.head]; }
    empty() { return this.head === this.q.length; }
    size() { return this.q.length - this.head; }
}

// --- Deque (Replaces std::deque) ---
class Deque {
    constructor() { this.frontArr = []; this.backArr = []; }
    push_back(val) { this.backArr.push(val); }
    push_front(val) { this.frontArr.push(val); }
    pop_back() { 
        if (this.backArr.length) return this.backArr.pop();
        return this.frontArr.shift(); // O(N) fallback, rare if balanced
    }
    pop_front() {
        if (this.frontArr.length) return this.frontArr.pop();
        let val = this.backArr[0];
        this.backArr.shift(); // O(N) fallback
        return val;
    }
    front() { return this.frontArr.length ? this.frontArr[this.frontArr.length - 1] : this.backArr[0]; }
    back() { return this.backArr.length ? this.backArr[this.backArr.length - 1] : this.frontArr[0]; }
    empty() { return this.frontArr.length === 0 && this.backArr.length === 0; }
    size() { return this.frontArr.length + this.backArr.length; }
}

// --- Priority Queue (Replaces std::priority_queue) ---
class PriorityQueue {
    constructor(comparator = (a, b) => a < b) { // Default: Min-Heap
        this.heap = [];
        this.comparator = comparator;
    }
    size() { return this.heap.length; }
    empty() { return this.heap.length === 0; }
    peek() { return this.heap[0]; }
    push(val) {
        this.heap.push(val);
        this.siftUp(this.size() - 1);
    }
    pop() {
        if (this.empty()) return null;
        const top = this.heap[0];
        const last = this.heap.pop();
        if (this.size() > 0) {
            this.heap[0] = last;
            this.siftDown(0);
        }
        return top;
    }
    siftUp(idx) {
        while (idx > 0) {
            let p = (idx - 1) >> 1;
            if (this.comparator(this.heap[idx], this.heap[p])) {
                [this.heap[idx], this.heap[p]] = [this.heap[p], this.heap[idx]];
                idx = p;
            } else break;
        }
    }
    siftDown(idx) {
        while (true) {
            let l = (idx << 1) + 1, r = (idx << 1) + 2, s = idx;
            if (l < this.size() && this.comparator(this.heap[l], this.heap[s])) s = l;
            if (r < this.size() && this.comparator(this.heap[r], this.heap[s])) s = r;
            if (s === idx) break;
            [this.heap[idx], this.heap[s]] = [this.heap[s], this.heap[idx]];
            idx = s;
        }
    }
}

// --- Binary Search (Replaces std::lower_bound & std::upper_bound) ---
const lowerBound = (arr, target) => {
    let l = 0, r = arr.length;
    while (l < r) {
        let mid = (l + r) >> 1;
        if (arr[mid] >= target) r = mid;
        else l = mid + 1;
    }
    return l;
};

const upperBound = (arr, target) => {
    let l = 0, r = arr.length;
    while (l < r) {
        let mid = (l + r) >> 1;
        if (arr[mid] > target) r = mid;
        else l = mid + 1;
    }
    return l;
};

// --- Disjoint Set Union (DSU) ---
class DSU {
    constructor(n) {
        this.parent = Array.from({ length: n + 1 }, (_, i) => i);
        this.size = new Array(n + 1).fill(1);
        this.components = n;
    }
    find(i) {
        if (this.parent[i] === i) return i;
        return this.parent[i] = this.find(this.parent[i]); 
    }
    union(i, j) {
        let rootI = this.find(i), rootJ = this.find(j);
        if (rootI !== rootJ) {
            if (this.size[rootI] < this.size[rootJ]) [rootI, rootJ] = [rootJ, rootI];
            this.parent[rootJ] = rootI;
            this.size[rootI] += this.size[rootJ];
            this.components--;
            return true;
        }
        return false;
    }
}

// --- Fenwick Tree / Binary Indexed Tree (1-indexed) ---
class BIT {
    constructor(n) { this.tree = new Array(n + 1).fill(0); }
    add(i, delta) {
        for (; i < this.tree.length; i += i & -i) this.tree[i] += delta;
    }
    query(i) {
        let sum = 0;
        for (; i > 0; i -= i & -i) sum += this.tree[i];
        return sum;
    }
    rangeQuery(l, r) { return this.query(r) - this.query(l - 1); }
}

/**
 * 3. UTILITIES & MATH
 */
// 2D Array Initialization
const make2D = (r, c, val = 0) => Array.from({ length: r }, () => new Array(c).fill(val));

// Safe Max/Min for large arrays (Avoids Maximum Call Stack Size Exceeded)
const arrayMax = (arr) => arr.reduce((a, b) => (a > b ? a : b));
const arrayMin = (arr) => arr.reduce((a, b) => (a < b ? a : b));

const gcd = (a, b) => b === 0n || b === 0 ? a : gcd(b, a % b);
const lcm = (a, b) => (a / gcd(a, b)) * b;

// Modular Exponentiation (base^exp % mod)
const power = (base, exp, mod) => {
    let res = 1n;
    base = BigInt(base) % BigInt(mod);
    exp = BigInt(exp);
    while (exp > 0n) {
        if (exp % 2n === 1n) res = (res * base) % BigInt(mod);
        base = (base * base) % BigInt(mod);
        exp /= 2n;
    }
    return res;
};

/**
 * 4. MAIN LOGIC
 */

// Solve function strictly handles the logic for a single test case
function solve(n, arr) {
    // Example logic: sum the array
    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += arr[i];
    }
    
    // Return the result to be printed
    return sum;
}

// Main function handles I/O and test case looping
function main() {
    const out = [];
    
    let t = readInt(); 
    if (t === null) return; // Exit if file is empty

    while (t-- > 0) {
        // 1. Read testcase inputs
        const n = readInt();
        
        const arr = new Array(n);
        for(let i = 0; i < n; i++) {
            arr[i] = readInt();
        }

        // 2. Call solve and store the result
        const result = solve(n, arr);
        out.push(result);
    }

    // 3. Flush output at once
    process.stdout.write(out.join("\n") + "\n");
}

main();
