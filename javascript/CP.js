"use strict";

const fs = require("fs");

/**
 * 1. FAST I/O (Crucial Optimization)
 * Avoids String.split() which causes MLE/TLE on huge inputs.
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
// Array.shift() is O(N). This array-based queue is amortized O(1).
class Queue {
    constructor() { this.q = []; this.head = 0; }
    push(x) { this.q.push(x); }
    pop() {
        if (this.empty()) return null;
        const res = this.q[this.head++];
        // Free up memory if the head moves too far forward
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
// Returns the index of the first element >= target
const lowerBound = (arr, target) => {
    let l = 0, r = arr.length;
    while (l < r) {
        let mid = (l + r) >> 1;
        if (arr[mid] >= target) r = mid;
        else l = mid + 1;
    }
    return l;
};

// Returns the index of the first element > target
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
 * 3. MATH UTILITIES
 */
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
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
function solve() {
    const out = [];
    
    // --- LOGIC START ---
    let t = readInt(); 
    if (t === null) return; // Exit if file is empty

    while (t-- > 0) {
        // Example reading variables:
        // const n = readInt();
        // const m = readInt();
        
        // Example array building:
        // const arr = new Array(n);
        // for(let i=0; i<n; i++) arr[i] = readInt();

        // Push output
        // out.push(result);
    }

    // Flush output at once
    process.stdout.write(out.join("\n") + "\n");
}

solve();
