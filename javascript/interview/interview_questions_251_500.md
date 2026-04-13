# 250 Technical Interview Questions & Answers (Part 2)

**Questions 251–500 | Sourav Ahmed — Full-Stack Engineer**

---

## Section 11: Advanced JavaScript Patterns (Q251–Q280)

### Q251. Implement `Promise.all` from scratch.

```js
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;

    if (promises.length === 0) return resolve([]);

    promises.forEach((p, i) => {
      Promise.resolve(p)
        .then(value => {
          results[i] = value;
          completed++;
          if (completed === promises.length) resolve(results);
        })
        .catch(reject);
    });
  });
}

// Test
promiseAll([
  Promise.resolve(1),
  new Promise(r => setTimeout(() => r(2), 100)),
  Promise.resolve(3),
]).then(console.log); // [1, 2, 3]
```

### Q252. Implement `Promise.race` from scratch.

```js
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    for (const p of promises) {
      Promise.resolve(p).then(resolve).catch(reject);
    }
  });
}
```

### Q253. Implement a deep equality check.

```js
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => deepEqual(a[key], b[key]));
  }

  return false;
}

deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }); // true
deepEqual({ a: 1 }, { a: "1" }); // false
```

### Q254. Implement `Array.prototype.reduce` from scratch.

```js
Array.prototype.myReduce = function (callback, initialValue) {
  let accumulator = initialValue;
  let startIndex = 0;

  if (accumulator === undefined) {
    if (this.length === 0) throw new TypeError("Reduce of empty array with no initial value");
    accumulator = this[0];
    startIndex = 1;
  }

  for (let i = startIndex; i < this.length; i++) {
    accumulator = callback(accumulator, this[i], i, this);
  }

  return accumulator;
};

[1, 2, 3, 4].myReduce((acc, val) => acc + val, 0); // 10
```

### Q255. What is the publish-subscribe pattern in JavaScript?

```js
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(listener);
    return () => this.off(event, listener); // return unsubscribe
  }

  off(event, listener) {
    const listeners = this.events.get(event);
    if (listeners) {
      this.events.set(event, listeners.filter(l => l !== listener));
    }
  }

  emit(event, ...args) {
    const listeners = this.events.get(event) || [];
    listeners.forEach(listener => listener(...args));
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

const bus = new EventEmitter();
const unsub = bus.on("order", (data) => console.log("Order:", data));
bus.emit("order", { id: 1 }); // "Order: { id: 1 }"
unsub(); // unsubscribe
```

### Q256. Implement a retry mechanism with exponential backoff in JS.

```js
async function retry(fn, { maxRetries = 3, baseDelay = 1000, maxDelay = 30000 } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Usage
const data = await retry(() => fetch("/api/unstable-endpoint").then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}));
```

### Q257. What is the iterator and iterable protocol?

```js
// Custom iterable
class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;
    return {
      next() {
        if (current <= end) {
          return { value: current++, done: false };
        }
        return { done: true };
      }
    };
  }
}

for (const n of new Range(1, 5)) console.log(n); // 1 2 3 4 5
console.log([...new Range(3, 7)]);                // [3, 4, 5, 6, 7]
```

### Q258. Implement `Function.prototype.bind` from scratch.

```js
Function.prototype.myBind = function (context, ...boundArgs) {
  const fn = this;
  return function (...callArgs) {
    return fn.apply(context, [...boundArgs, ...callArgs]);
  };
};

function greet(greeting, name) {
  return `${greeting}, ${name}! I'm ${this.role}`;
}

const devGreet = greet.myBind({ role: "engineer" }, "Hello");
devGreet("Sourav"); // "Hello, Sourav! I'm engineer"
```

### Q259. What is the object observer pattern?

```js
function createReactive(target, onChange) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const oldValue = obj[prop];
      obj[prop] = value;
      if (oldValue !== value) {
        onChange(prop, value, oldValue);
      }
      return true;
    },
    deleteProperty(obj, prop) {
      const oldValue = obj[prop];
      delete obj[prop];
      onChange(prop, undefined, oldValue);
      return true;
    }
  });
}

const state = createReactive({ count: 0 }, (prop, newVal, oldVal) => {
  console.log(`${prop}: ${oldVal} → ${newVal}`);
});

state.count = 5; // "count: 0 → 5"
```

### Q260. Implement a concurrent task queue with concurrency limit.

```js
class TaskQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this._run();
    });
  }

  _run() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();
      this.running++;
      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.running--;
          this._run();
        });
    }
  }
}

const queue = new TaskQueue(2);
const delay = (ms, val) => new Promise(r => setTimeout(() => r(val), ms));

queue.add(() => delay(1000, "a")).then(console.log);
queue.add(() => delay(500, "b")).then(console.log);
queue.add(() => delay(300, "c")).then(console.log);
// Output: b, c, a (limited to 2 concurrent)
```

### Q261. Explain the `FinalizationRegistry` and weak references.

```js
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`Object ${heldValue} was garbage collected`);
  // Clean up external resources: close connection, remove cache entry, etc.
});

let obj = { data: "important" };
registry.register(obj, "myObject");

obj = null; // Now eligible for GC → callback fires eventually
```

Use case: cleaning up WebSocket connections or file handles when objects are GC'd.

### Q262. Implement `flatMap` from scratch.

```js
Array.prototype.myFlatMap = function (callback) {
  return this.reduce((acc, val, i, arr) => {
    const result = callback(val, i, arr);
    return acc.concat(result);
  }, []);
};

const sentences = ["Hello World", "Good Morning"];
sentences.myFlatMap(s => s.split(" "));
// ["Hello", "World", "Good", "Morning"]
```

### Q263. What is `SharedArrayBuffer` and `Atomics`?

```js
// Shared memory between main thread and worker
const buffer = new SharedArrayBuffer(1024);
const view = new Int32Array(buffer);

// Worker thread
// const view = new Int32Array(sharedBuffer);
Atomics.add(view, 0, 5);          // Atomic addition
Atomics.compareExchange(view, 0, 5, 10); // CAS operation
Atomics.wait(view, 0, 10);        // Block until value changes
Atomics.notify(view, 0, 1);       // Wake one waiting thread
```

Use case: high-performance parallel computation without message passing overhead.

### Q264. Implement a simple state machine.

```js
function createMachine(config) {
  let currentState = config.initial;

  return {
    get state() { return currentState; },
    send(event) {
      const stateConfig = config.states[currentState];
      const transition = stateConfig?.on?.[event];
      if (transition) {
        const prevState = currentState;
        currentState = transition;
        config.onTransition?.(prevState, currentState, event);
      }
      return currentState;
    }
  };
}

const orderMachine = createMachine({
  initial: "idle",
  states: {
    idle:       { on: { PLACE: "pending" } },
    pending:    { on: { CONFIRM: "confirmed", CANCEL: "cancelled" } },
    confirmed:  { on: { DELIVER: "delivered", CANCEL: "cancelled" } },
    delivered:  { on: { COMPLETE: "completed" } },
    cancelled:  {},
    completed:  {},
  },
  onTransition: (from, to, event) =>
    console.log(`${from} → ${to} (${event})`)
});

orderMachine.send("PLACE");    // idle → pending
orderMachine.send("CONFIRM");  // pending → confirmed
orderMachine.send("DELIVER");  // confirmed → delivered
```

### Q265. What are `structuredClone` limitations and alternatives?

```js
// structuredClone CANNOT clone:
// - Functions
// - DOM nodes
// - Symbols
// - Property descriptors (getters/setters)
// - Prototype chain

const obj = {
  fn: () => {},
  get computed() { return 42; }
};

// structuredClone(obj); // ❌ DataCloneError (function)

// Alternative: custom deep clone
function deepClone(obj, seen = new WeakMap()) {
  if (obj === null || typeof obj !== "object") return obj;
  if (seen.has(obj)) return seen.get(obj); // Handle circular refs

  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (obj instanceof Map) {
    const map = new Map();
    seen.set(obj, map);
    obj.forEach((v, k) => map.set(deepClone(k, seen), deepClone(v, seen)));
    return map;
  }

  const clone = Array.isArray(obj) ? [] : {};
  seen.set(obj, clone);
  for (const key of Reflect.ownKeys(obj)) {
    clone[key] = deepClone(obj[key], seen);
  }
  return clone;
}
```

### Q266. Implement a throttled async queue (process one at a time).

```js
function createAsyncQueue() {
  let pending = Promise.resolve();

  return function enqueue(fn) {
    return new Promise((resolve, reject) => {
      pending = pending
        .then(() => fn())
        .then(resolve)
        .catch(reject);
    });
  };
}

const enqueue = createAsyncQueue();
enqueue(() => fetch("/api/1").then(r => r.json())).then(console.log);
enqueue(() => fetch("/api/2").then(r => r.json())).then(console.log);
// Executes sequentially, not concurrently
```

### Q267. What is `queueMicrotask` and when to use it?

```js
console.log("1");
queueMicrotask(() => console.log("2")); // microtask
setTimeout(() => console.log("3"), 0);  // macrotask
Promise.resolve().then(() => console.log("4")); // microtask
console.log("5");

// Output: 1, 5, 2, 4, 3
```

`queueMicrotask` schedules a callback in the microtask queue — same priority as Promise callbacks, runs before any macrotasks (setTimeout, I/O).

### Q268. Implement a pipe/compose function.

```js
const pipe = (...fns) => (input) => fns.reduce((acc, fn) => fn(acc), input);
const compose = (...fns) => (input) => fns.reduceRight((acc, fn) => fn(acc), input);

const processUser = pipe(
  (name) => name.trim(),
  (name) => name.toLowerCase(),
  (name) => `@${name}`,
  (handle) => ({ handle, createdAt: new Date() })
);

processUser("  Sourav  ");
// { handle: "@sourav", createdAt: Date }
```

### Q269. What is the module pattern vs revealing module pattern?

```js
// Module pattern (IIFE)
const Counter = (() => {
  let count = 0; // private
  return {
    increment: () => ++count,
    getCount: () => count,
  };
})();

// Revealing module pattern
const UserModule = (() => {
  let users = [];

  function addUser(name) { users.push({ name, id: users.length + 1 }); }
  function getUsers() { return [...users]; }
  function findUser(id) { return users.find(u => u.id === id); }

  return { addUser, getUsers, findUser }; // reveal only public API
})();
```

### Q270. Implement `Object.assign` from scratch.

```js
function objectAssign(target, ...sources) {
  if (target == null) throw new TypeError("Cannot convert undefined or null to object");
  const to = Object(target);

  for (const source of sources) {
    if (source == null) continue;
    for (const key of [...Object.keys(source), ...Object.getOwnPropertySymbols(source)]) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        to[key] = source[key];
      }
    }
  }
  return to;
}
```

### Q271. What is the difference between `for...of` and `for...in`?

```js
const arr = ["a", "b", "c"];
arr.custom = "x";

for (const val of arr) console.log(val);   // "a", "b", "c" — iterates VALUES (iterable)
for (const key in arr) console.log(key);   // "0", "1", "2", "custom" — iterates KEYS (enumerable)

const obj = { x: 1, y: 2 };
// for (const v of obj) {} // ❌ TypeError — objects are not iterable
for (const k in obj) console.log(k);       // "x", "y"
```

### Q272. Implement a simple dependency injection container.

```js
class Container {
  constructor() {
    this.services = new Map();
  }

  register(name, factory, singleton = true) {
    this.services.set(name, { factory, singleton, instance: null });
  }

  resolve(name) {
    const service = this.services.get(name);
    if (!service) throw new Error(`Service "${name}" not registered`);

    if (service.singleton) {
      if (!service.instance) service.instance = service.factory(this);
      return service.instance;
    }
    return service.factory(this);
  }
}

const container = new Container();
container.register("config", () => ({ dbUrl: "postgres://..." }));
container.register("db", (c) => new Database(c.resolve("config").dbUrl));
container.register("userService", (c) => new UserService(c.resolve("db")));

const userService = container.resolve("userService");
```

### Q273. What is tree shaking and how does it work?

Tree shaking eliminates dead (unused) code from bundles. It relies on ES module static analysis.

```js
// utils.js
export function used() { return "I'm included"; }
export function unused() { return "I'm removed"; }

// app.js
import { used } from "./utils"; // only `used` is bundled
```

Requirements: ES modules (not CommonJS), static imports, no side effects. Mark packages as side-effect-free in `package.json`: `"sideEffects": false`.

### Q274. Implement an async `map` with concurrency control.

```js
async function asyncMap(items, fn, concurrency = 3) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

// Process 100 URLs, 5 at a time
const results = await asyncMap(urls, url => fetch(url).then(r => r.json()), 5);
```

### Q275. What are Web Workers and when to use them?

```js
// main.js
const worker = new Worker("worker.js");
worker.postMessage({ data: largeArray, operation: "sort" });
worker.onmessage = (e) => {
  console.log("Sorted:", e.data);
};

// worker.js
self.onmessage = (e) => {
  const { data, operation } = e.data;
  if (operation === "sort") {
    const sorted = data.sort((a, b) => a - b); // Heavy computation off main thread
    self.postMessage(sorted);
  }
};
```

Use when: heavy computation (parsing large files, image processing, crypto), keeping UI responsive. Cannot access DOM.

### Q276. What is `Object.fromEntries` and practical uses?

```js
// Convert Map to object
const map = new Map([["name", "Sourav"], ["role", "engineer"]]);
const obj = Object.fromEntries(map); // { name: "Sourav", role: "engineer" }

// Transform object
const original = { a: 1, b: 2, c: 3 };
const doubled = Object.fromEntries(
  Object.entries(original).map(([k, v]) => [k, v * 2])
);
// { a: 2, b: 4, c: 6 }

// Parse URL search params
const params = new URLSearchParams("name=Sourav&city=Dhaka");
const parsed = Object.fromEntries(params); // { name: "Sourav", city: "Dhaka" }
```

### Q277. Implement a simple observable (RxJS-like).

```js
class Observable {
  constructor(subscribe) {
    this._subscribe = subscribe;
  }

  subscribe(observer) {
    const normalizedObserver = typeof observer === "function"
      ? { next: observer, error: () => {}, complete: () => {} }
      : observer;
    return this._subscribe(normalizedObserver);
  }

  pipe(...operators) {
    return operators.reduce((obs, op) => op(obs), this);
  }

  static from(iterable) {
    return new Observable(observer => {
      for (const item of iterable) observer.next(item);
      observer.complete();
    });
  }
}

// Operators
function map(fn) {
  return (source) => new Observable(observer => {
    source.subscribe({
      next: (val) => observer.next(fn(val)),
      error: (err) => observer.error(err),
      complete: () => observer.complete(),
    });
  });
}

function filter(predicate) {
  return (source) => new Observable(observer => {
    source.subscribe({
      next: (val) => predicate(val) && observer.next(val),
      error: (err) => observer.error(err),
      complete: () => observer.complete(),
    });
  });
}

Observable.from([1, 2, 3, 4, 5])
  .pipe(filter(x => x % 2 === 0), map(x => x * 10))
  .subscribe(console.log); // 20, 40
```

### Q278. What is `Error.cause` chaining?

```js
async function fetchUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    throw new Error(`Failed to fetch user ${id}`, { cause: err });
  }
}

try {
  await fetchUser(42);
} catch (err) {
  console.log(err.message);       // "Failed to fetch user 42"
  console.log(err.cause.message); // "HTTP 404" — original error preserved
}
```

### Q279. Implement `Array.prototype.flat` from scratch.

```js
Array.prototype.myFlat = function (depth = 1) {
  if (depth <= 0) return this.slice();

  return this.reduce((acc, val) => {
    if (Array.isArray(val)) {
      return acc.concat(val.myFlat(depth - 1));
    }
    return acc.concat(val);
  }, []);
};

[1, [2, [3, [4]]]].myFlat();    // [1, 2, [3, [4]]]
[1, [2, [3, [4]]]].myFlat(2);   // [1, 2, 3, [4]]
[1, [2, [3, [4]]]].myFlat(Infinity); // [1, 2, 3, 4]
```

### Q280. What is the `using` declaration (Explicit Resource Management)?

```js
// TC39 Stage 3 — Disposable resources
class DatabaseConnection {
  constructor() { console.log("Connected"); }

  [Symbol.dispose]() {
    console.log("Disconnected"); // Auto cleanup
  }
}

function query() {
  using conn = new DatabaseConnection();
  // Use conn...
  // conn[Symbol.dispose]() called automatically when scope exits
}

// Async version
class FileHandle {
  async [Symbol.asyncDispose]() {
    await this.flush();
    await this.close();
  }
}

async function process() {
  await using file = await openFile("data.csv");
  // file is auto-disposed when block exits
}
```

---

## Section 12: Advanced TypeScript (Q281–Q305)

### Q281. Implement a type-safe event emitter.

```ts
type EventMap = {
  "user:login": { userId: string; timestamp: number };
  "order:placed": { orderId: string; amount: number };
  "error": Error;
};

class TypedEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<string, Set<Function>>();

  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void) {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set());
    }
    this.listeners.get(event as string)!.add(listener);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]) {
    this.listeners.get(event as string)?.forEach(fn => fn(data));
  }
}

const emitter = new TypedEmitter<EventMap>();
emitter.on("user:login", (data) => {
  console.log(data.userId);   // ✅ fully typed
});
// emitter.emit("user:login", { wrong: true }); // ❌ type error
```

### Q282. What are branded types / opaque types?

```ts
type Brand<T, B> = T & { __brand: B };

type USD = Brand<number, "USD">;
type EUR = Brand<number, "EUR">;
type UserId = Brand<string, "UserId">;

function charge(amount: USD) { /* ... */ }

const usd = 100 as USD;
const eur = 100 as EUR;

charge(usd); // ✅
// charge(eur); // ❌ Type 'EUR' is not assignable to type 'USD'
// charge(100); // ❌ Type 'number' is not assignable to type 'USD'
```

### Q283. Implement a type-safe builder pattern.

```ts
class QueryBuilder<Selected extends string = never> {
  private parts: Record<string, any> = {};

  select<F extends string>(fields: F[]): QueryBuilder<Selected | F> {
    this.parts.select = fields;
    return this as any;
  }

  where(condition: Partial<Record<Selected, any>>) {
    this.parts.where = condition;
    return this;
  }

  build() {
    return this.parts;
  }
}

new QueryBuilder()
  .select(["name", "email", "age"])
  .where({ name: "Sourav", email: "x" })  // ✅ only selected fields allowed
  // .where({ unknown: 1 })               // ❌ error
  .build();
```

### Q284. What are declaration merging and module augmentation?

```ts
// Declaration merging — extend existing interfaces
declare module "express" {
  interface Request {
    user?: { id: string; role: string };
    requestId: string;
  }
}

// Now req.user and req.requestId are available everywhere
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  next();
});

// Interface merging
interface Window {
  analytics: { track: (event: string) => void };
}
window.analytics.track("page_view"); // ✅
```

### Q285. Explain `NoInfer` utility type (TS 5.4+).

```ts
// Without NoInfer — T is inferred from both parameters
function createState<T>(initial: T, validate: (val: T) => boolean) {
  return { value: initial, validate };
}
createState("hello", (val) => val === 123); // ❌ No error! T is string | number

// With NoInfer — T is only inferred from `initial`
function createState2<T>(initial: T, validate: (val: NoInfer<T>) => boolean) {
  return { value: initial, validate };
}
createState2("hello", (val) => val === 123); // ✅ Error: number not assignable to string
```

### Q286. Implement a type-safe path accessor.

```ts
type PathKeys<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? PathKeys<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

type PathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T ? PathValue<T[K], Rest> : never
    : P extends keyof T ? T[P] : never;

interface User {
  name: string;
  address: { city: string; zip: number };
}

type UserPaths = PathKeys<User>;
// "name" | "address" | "address.city" | "address.zip"

function get<T, P extends PathKeys<T>>(obj: T, path: P): PathValue<T, P> {
  return path.split(".").reduce((o: any, k) => o?.[k], obj) as any;
}

const user: User = { name: "Sourav", address: { city: "Dhaka", zip: 1000 } };
const city = get(user, "address.city"); // type: string, value: "Dhaka"
```

### Q287. What is the `const` type parameter (TS 5.0+)?

```ts
// Without const — array type widens
function routes<T extends readonly string[]>(paths: T) { return paths; }
const r1 = routes(["home", "about"]); // string[]

// With const — preserves literal types
function routes2<const T extends readonly string[]>(paths: T) { return paths; }
const r2 = routes2(["home", "about"]); // readonly ["home", "about"]
```

### Q288. Implement recursive `Partial` and `Required` for nested objects.

```ts
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : DeepPartial<T[K]>
    : T[K];
};

type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object
    ? T[K] extends Array<infer U>
      ? Array<DeepRequired<U>>
      : DeepRequired<T[K]>
    : T[K];
};

interface Config {
  db?: { host?: string; port?: number; ssl?: { cert?: string } };
}

type FullConfig = DeepRequired<Config>;
// { db: { host: string; port: number; ssl: { cert: string } } }
```

### Q289. What is `using` assertion in TypeScript (disposable)?

```ts
// TypeScript 5.2+
interface Disposable {
  [Symbol.dispose](): void;
}

function getConnection(): Disposable {
  const conn = { id: Math.random() };
  console.log(`Opened ${conn.id}`);
  return {
    [Symbol.dispose]() {
      console.log(`Closed ${conn.id}`);
    }
  };
}

function main() {
  using conn = getConnection(); // Auto-disposed at end of scope
  // Do work with conn...
} // conn[Symbol.dispose]() called here
```

### Q290. Implement a type-safe Result type (no exceptions).

```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

function parseJSON<T>(json: string): Result<T, SyntaxError> {
  try {
    return ok(JSON.parse(json));
  } catch (e) {
    return err(e as SyntaxError);
  }
}

const result = parseJSON<{ name: string }>('{"name":"Sourav"}');
if (result.ok) {
  console.log(result.value.name); // ✅ fully typed
} else {
  console.error(result.error.message); // ✅ SyntaxError
}
```

### Q291. What are variadic tuple types?

```ts
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
type R = Concat<[1, 2], [3, 4]>; // [1, 2, 3, 4]

// Type-safe curry
type Curry<Args extends unknown[], Return> =
  Args extends [infer First, ...infer Rest]
    ? (arg: First) => Curry<Rest, Return>
    : Return;

type CurriedAdd = Curry<[number, number, number], number>;
// (arg: number) => (arg: number) => (arg: number) => number
```

### Q292. Explain covariance and contravariance in function types.

```ts
type Animal = { name: string };
type Dog = { name: string; bark: () => void };

// Return type is COVARIANT (Dog extends Animal)
type ProducerAnimal = () => Animal;
type ProducerDog = () => Dog;
const pa: ProducerAnimal = (() => ({ name: "Rex", bark() {} })) satisfies ProducerDog; // ✅

// Parameter type is CONTRAVARIANT
type ConsumerAnimal = (a: Animal) => void;
type ConsumerDog = (d: Dog) => void;
const cd: ConsumerDog = ((a: Animal) => console.log(a.name)) satisfies ConsumerAnimal; // ✅
```

### Q293. How do you type middleware patterns?

```ts
type Context = { req: Request; res: Response; user?: User };
type Next = () => Promise<void>;
type Middleware = (ctx: Context, next: Next) => Promise<void>;

function compose(middlewares: Middleware[]): Middleware {
  return async (ctx, next) => {
    let index = -1;

    async function dispatch(i: number): Promise<void> {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      const fn = i === middlewares.length ? next : middlewares[i];
      if (fn) await fn(ctx, () => dispatch(i + 1));
    }

    return dispatch(0);
  };
}
```

### Q294. What are assertion functions in TypeScript?

```ts
function assertDefined<T>(value: T | null | undefined, msg?: string): asserts value is T {
  if (value == null) throw new Error(msg ?? "Value is null or undefined");
}

function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") throw new TypeError("Expected string");
}

const input: string | null = getInput();
assertDefined(input, "Input required");
input.toUpperCase(); // ✅ TS knows input is string (not null)
```

### Q295. Implement a type-safe API client with generics.

```ts
interface APIRoutes {
  "GET /users": { response: User[]; query: { limit?: number } };
  "GET /users/:id": { response: User; params: { id: string } };
  "POST /users": { response: User; body: { name: string; email: string } };
  "PUT /users/:id": { response: User; params: { id: string }; body: Partial<User> };
}

type ExtractMethod<T extends string> = T extends `${infer M} ${string}` ? M : never;
type ExtractPath<T extends string> = T extends `${string} ${infer P}` ? P : never;

async function api<R extends keyof APIRoutes>(
  route: R,
  options?: Omit<APIRoutes[R], "response">
): Promise<APIRoutes[R]["response"]> {
  // Implementation: parse method/path, substitute params, fetch
  const [method, path] = (route as string).split(" ");
  const res = await fetch(path, { method, body: JSON.stringify((options as any)?.body) });
  return res.json();
}

const users = await api("GET /users", { query: { limit: 10 } }); // User[]
const user = await api("POST /users", { body: { name: "Sourav", email: "s@t.com" } }); // User
```

### Q296-Q300. TypeScript Quick-fire

**Q296. What is `Extract` and `Exclude`?**
```ts
type Events = "click" | "scroll" | "mousemove" | "keydown";
type MouseEvents = Extract<Events, "click" | "scroll" | "mousemove">; // "click" | "scroll" | "mousemove"
type NonMouseEvents = Exclude<Events, "click" | "scroll" | "mousemove">; // "keydown"
```

**Q297. What is `Awaited<T>`?**
```ts
type A = Awaited<Promise<string>>; // string
type B = Awaited<Promise<Promise<number>>>; // number — unwraps nested Promises
```

**Q298. What is `PropertyKey` type?**
```ts
type PropertyKey = string | number | symbol; // All valid object key types
```

**Q299. What is `abstract` in TypeScript?**
```ts
abstract class Shape {
  abstract area(): number; // Must be implemented by subclasses
  perimeter?(): number;    // Optional override
  describe() { return `Area: ${this.area()}`; } // Shared implementation
}

class Circle extends Shape {
  constructor(private radius: number) { super(); }
  area() { return Math.PI * this.radius ** 2; }
}
```

**Q300. What are string enum vs const enum?**
```ts
// String enum — exists at runtime
enum Direction { Up = "UP", Down = "DOWN" }

// Const enum — inlined at compile time (no runtime object)
const enum Status { Active = "ACTIVE", Inactive = "INACTIVE" }

const s: Status = Status.Active; // Compiles to: const s = "ACTIVE"
```

### Q301-Q305. More Advanced TypeScript

**Q301. What is the `import type` syntax?**
```ts
import type { User } from "./models"; // Erased at compile time
import { type User, createUser } from "./models"; // Mixed import
```
Prevents the import from being included in emitted JS if only used for types.

**Q302. Implement a `Prettify` utility type.**
```ts
type Prettify<T> = { [K in keyof T]: T[K] } & {};

// Flattens intersections for better IntelliSense
type Ugly = { a: string } & { b: number } & { c: boolean };
type Pretty = Prettify<Ugly>;
// Hover shows: { a: string; b: number; c: boolean }
```

**Q303. What are index signatures vs `Record`?**
```ts
// Index signature — allows any string key
interface FlexObj { [key: string]: number }

// Record — same thing as utility
type FlexObj2 = Record<string, number>;

// Key difference: index signatures allow extra properties
interface Strict { name: string; [key: string]: string }
```

**Q304. What is `ReadonlyArray<T>` vs `readonly T[]`?**
```ts
const a: ReadonlyArray<number> = [1, 2, 3];
const b: readonly number[] = [1, 2, 3]; // Same thing

// a.push(4); // ❌ Property 'push' does not exist
// a[0] = 5;  // ❌ Index signature only permits reading
```

**Q305. What are `@ts-expect-error` and `@ts-ignore`?**
```ts
// @ts-ignore — suppresses error on next line (even if no error exists)
// @ts-expect-error — suppresses error BUT errors if there's no error to suppress
// Prefer @ts-expect-error — it fails when the fix is applied, so you don't forget stale suppressions

// @ts-expect-error — testing that something IS a type error
const x: number = "hello"; // ✅ suppressed, expected
```

---

## Section 13: Advanced React Patterns (Q306–Q330)

### Q306. Implement a generic data table component.

```tsx
interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  sortable?: boolean;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
}: {
  data: T[];
  columns: Column<T>[];
}) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const val = a[sortKey] > b[sortKey] ? 1 : -1;
      return sortDir === "asc" ? val : -val;
    });
  }, [data, sortKey, sortDir]);

  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)} onClick={() => {
              if (col.sortable) {
                setSortKey(col.key);
                setSortDir(d => d === "asc" ? "desc" : "asc");
              }
            }}>
              {col.header} {sortKey === col.key && (sortDir === "asc" ? "↑" : "↓")}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={String(col.key)}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Q307. What is the render prop pattern?

```tsx
interface MousePosition { x: number; y: number }

function MouseTracker({ render }: { render: (pos: MousePosition) => ReactNode }) {
  const [pos, setPos] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return <>{render(pos)}</>;
}

// Usage
<MouseTracker render={({ x, y }) => <p>Mouse at {x}, {y}</p>} />
```

### Q308. Implement a polymorphic component (`as` prop).

```tsx
type PolymorphicProps<E extends React.ElementType, P = {}> = P & {
  as?: E;
} & Omit<React.ComponentPropsWithoutRef<E>, keyof P | "as">;

function Box<E extends React.ElementType = "div">({
  as,
  children,
  ...props
}: PolymorphicProps<E>) {
  const Component = as || "div";
  return <Component {...props}>{children}</Component>;
}

// Usage
<Box>Default div</Box>
<Box as="section" id="hero">Section tag</Box>
<Box as="a" href="/about">Link tag</Box>
<Box as={Link} to="/about">React Router Link</Box>
```

### Q309. How do you implement virtualized lists?

```tsx
function VirtualList({ items, itemHeight, containerHeight }: Props) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: "auto" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map((item, i) => (
          <div
            key={startIndex + i}
            style={{
              position: "absolute",
              top: (startIndex + i) * itemHeight,
              height: itemHeight,
              width: "100%",
            }}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Q310. Explain the HOC (Higher-Order Component) pattern.

```tsx
function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();

    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;

    return <WrappedComponent {...props} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);
```

### Q311. What is `flushSync` and when to use it?

```tsx
import { flushSync } from "react-dom";

function handleClick() {
  // Normally React batches these — one re-render
  setCount(c => c + 1);
  setFlag(f => !f);

  // Force synchronous update
  flushSync(() => {
    setCount(c => c + 1);
  });
  // DOM is updated here
  console.log(document.getElementById("count")!.textContent); // reflects new count

  flushSync(() => {
    setFlag(f => !f);
  });
  // Another DOM update here
}
```

Use sparingly — for cases where you need to read the DOM immediately after a state update (e.g., scroll position, measurements).

### Q312. Implement a custom `useLocalStorage` hook (for non-artifact contexts).

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue] as const;
}

// Usage
const [theme, setTheme] = useLocalStorage("theme", "dark");
```

### Q313. What is React's `useDeferredValue`?

```tsx
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  const results = useMemo(
    () => heavyFilter(allItems, deferredQuery),
    [deferredQuery]
  );

  return (
    <div style={{ opacity: isStale ? 0.5 : 1 }}>
      {results.map(item => <Result key={item.id} {...item} />)}
    </div>
  );
}
```

`useDeferredValue` lets React defer updating a value during urgent updates (like typing), keeping the UI responsive.

### Q314. How do you implement a portal?

```tsx
function Modal({ children, isOpen }: { children: ReactNode; isOpen: boolean }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
      </div>
    </div>,
    document.getElementById("modal-root")! // Renders outside React tree
  );
}
```

Portals render children into a different DOM node while maintaining React's event bubbling and context.

### Q315. Implement a `useDebounce` hook.

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) fetchResults(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### Q316. What is the slot pattern in React?

```tsx
interface CardProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

function Card({ header, footer, children }: CardProps) {
  return (
    <div className="card">
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

// Usage
<Card
  header={<h2>Campaign Stats</h2>}
  footer={<button>Export</button>}
>
  <p>Content here</p>
</Card>
```

### Q317. How do you profile React performance?

```tsx
import { Profiler } from "react";

function onRender(id, phase, actualDuration, baseDuration) {
  console.log(`${id} [${phase}] actual=${actualDuration}ms base=${baseDuration}ms`);
}

<Profiler id="Dashboard" onRender={onRender}>
  <Dashboard />
</Profiler>
```

Other tools: React DevTools Profiler, `React.memo` for preventing unnecessary renders, `why-did-you-render` library.

### Q318. Implement a custom `useMediaQuery` hook.

```tsx
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Usage
function Layout() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
```

### Q319. What is the controller/uncontrolled component pattern?

```tsx
// Controlled — React owns the state
function ControlledInput() {
  const [value, setValue] = useState("");
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}

// Uncontrolled — DOM owns the state
function UncontrolledInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = () => console.log(inputRef.current?.value);
  return <input ref={inputRef} defaultValue="" />;
}

// Flexible component supporting both modes
function FlexInput({ value, defaultValue, onChange }: Props) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");

  const actualValue = isControlled ? value : internal;
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(e.target.value);
    onChange?.(e.target.value);
  };

  return <input value={actualValue} onChange={handleChange} />;
}
```

### Q320. How do you handle URL state management in Next.js?

```tsx
"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

function Filters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      <select
        value={searchParams.get("status") ?? "all"}
        onChange={(e) => setFilter("status", e.target.value)}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
}
```

### Q321-Q325. React Quick-fire

**Q321. What is `React.Children` API?**
```tsx
React.Children.map(children, (child) => {
  if (React.isValidElement(child)) {
    return React.cloneElement(child, { className: "styled" });
  }
  return child;
});
React.Children.count(children);
React.Children.toArray(children);
```

**Q322. What is `useId`?**
```tsx
function FormField({ label }: { label: string }) {
  const id = useId(); // Generates stable, unique ID across server/client
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  );
}
```

**Q323. What is a layout effect vs a regular effect?**
`useLayoutEffect` fires synchronously after DOM mutations but before the browser paints. Use for: measuring DOM elements, preventing visual flicker. `useEffect` fires asynchronously after paint.

**Q324. What is strict mode?**
React Strict Mode double-invokes render, effects (mount → unmount → mount), and reducers in development to surface side effects and impure renders.

**Q325. What is `key` prop and why is it important?**
`key` helps React identify which items in a list changed, were added, or removed. Using stable, unique keys prevents unnecessary re-renders and DOM recreation. Never use array index as key if the list can reorder.

### Q326-Q330. More React Patterns

**Q326. Implement a `useClickOutside` hook.**
```tsx
function useClickOutside(ref: RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}
```

**Q327. What is a hydration mismatch and how to debug it?**
Occurs when server-rendered HTML differs from client render. Common causes: `Date.now()`, `Math.random()`, browser-only APIs. Fix: use `useEffect` for client-only values, `suppressHydrationWarning`, or dynamic imports with `ssr: false`.

**Q328. What is a React Server Function?**
Functions marked with `"use server"` that can be called from client components. They run on the server and can directly access databases, file systems, and secrets.

**Q329. How does React batching work?**
React 18+ batches all state updates by default (even inside setTimeout, promises, and event handlers). Multiple setState calls in the same synchronous block result in a single re-render.

**Q330. What is `startViewTransition` with React?**
```tsx
function navigate(url: string) {
  if (!document.startViewTransition) {
    router.push(url);
    return;
  }
  document.startViewTransition(() => {
    flushSync(() => router.push(url));
  });
}
```
Enables smooth CSS-powered transitions between page states.

---

## Section 14: Advanced Go Patterns (Q331–Q355)

### Q331. Implement a generic repository pattern.

```go
type Repository[T any] struct {
    db    *sql.DB
    table string
}

func NewRepository[T any](db *sql.DB, table string) *Repository[T] {
    return &Repository[T]{db: db, table: table}
}

func (r *Repository[T]) FindByID(ctx context.Context, id int) (*T, error) {
    query := fmt.Sprintf("SELECT * FROM %s WHERE id = $1", r.table)
    row := r.db.QueryRowContext(ctx, query, id)

    var result T
    if err := scanStruct(row, &result); err != nil {
        return nil, fmt.Errorf("FindByID %d: %w", id, err)
    }
    return &result, nil
}

func (r *Repository[T]) FindAll(ctx context.Context, limit, offset int) ([]T, error) {
    query := fmt.Sprintf("SELECT * FROM %s LIMIT $1 OFFSET $2", r.table)
    rows, err := r.db.QueryContext(ctx, query, limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    return scanRows[T](rows)
}

// Usage
userRepo := NewRepository[User](db, "users")
user, err := userRepo.FindByID(ctx, 1)
```

### Q332. Implement the functional options pattern.

```go
type Server struct {
    port    int
    host    string
    timeout time.Duration
    tls     bool
}

type Option func(*Server)

func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}

func WithHost(host string) Option {
    return func(s *Server) { s.host = host }
}

func WithTimeout(d time.Duration) Option {
    return func(s *Server) { s.timeout = d }
}

func WithTLS() Option {
    return func(s *Server) { s.tls = true }
}

func NewServer(opts ...Option) *Server {
    s := &Server{
        port:    8080,
        host:    "0.0.0.0",
        timeout: 30 * time.Second,
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

srv := NewServer(WithPort(9090), WithTLS(), WithTimeout(60*time.Second))
```

### Q333. How do you implement graceful degradation with circuit breakers?

```go
type State int

const (
    Closed   State = iota // normal operation
    Open                   // failing, reject calls
    HalfOpen               // testing recovery
)

type CircuitBreaker struct {
    mu            sync.Mutex
    state         State
    failCount     int
    successCount  int
    maxFails      int
    cooldown      time.Duration
    lastFailTime  time.Time
    halfOpenMax   int
}

func (cb *CircuitBreaker) Call(fn func() error) error {
    cb.mu.Lock()
    
    switch cb.state {
    case Open:
        if time.Since(cb.lastFailTime) > cb.cooldown {
            cb.state = HalfOpen
            cb.successCount = 0
        } else {
            cb.mu.Unlock()
            return ErrCircuitOpen
        }
    }
    cb.mu.Unlock()

    err := fn()

    cb.mu.Lock()
    defer cb.mu.Unlock()

    if err != nil {
        cb.failCount++
        cb.lastFailTime = time.Now()
        if cb.failCount >= cb.maxFails {
            cb.state = Open
        }
        return err
    }

    if cb.state == HalfOpen {
        cb.successCount++
        if cb.successCount >= cb.halfOpenMax {
            cb.state = Closed
            cb.failCount = 0
        }
    } else {
        cb.failCount = 0
    }
    return nil
}
```

### Q334. Implement a fan-out/fan-in pattern.

```go
func fanOut(ctx context.Context, input <-chan int, numWorkers int) []<-chan int {
    channels := make([]<-chan int, numWorkers)
    for i := 0; i < numWorkers; i++ {
        channels[i] = worker(ctx, input)
    }
    return channels
}

func worker(ctx context.Context, input <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for val := range input {
            select {
            case out <- process(val):
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

func fanIn(ctx context.Context, channels ...<-chan int) <-chan int {
    merged := make(chan int)
    var wg sync.WaitGroup
    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for val := range c {
                select {
                case merged <- val:
                case <-ctx.Done():
                    return
                }
            }
        }(ch)
    }
    go func() {
        wg.Wait()
        close(merged)
    }()
    return merged
}
```

### Q335. How do you implement middleware with generics?

```go
type Handler[Req, Res any] func(ctx context.Context, req Req) (Res, error)
type Middleware[Req, Res any] func(Handler[Req, Res]) Handler[Req, Res]

func WithLogging[Req, Res any]() Middleware[Req, Res] {
    return func(next Handler[Req, Res]) Handler[Req, Res] {
        return func(ctx context.Context, req Req) (Res, error) {
            start := time.Now()
            res, err := next(ctx, req)
            slog.Info("handled",
                "duration", time.Since(start),
                "error", err,
            )
            return res, err
        }
    }
}

func WithValidation[Req interface{ Validate() error }, Res any]() Middleware[Req, Res] {
    return func(next Handler[Req, Res]) Handler[Req, Res] {
        return func(ctx context.Context, req Req) (Res, error) {
            if err := req.Validate(); err != nil {
                var zero Res
                return zero, fmt.Errorf("validation: %w", err)
            }
            return next(ctx, req)
        }
    }
}
```

### Q336. What is the semaphore pattern in Go?

```go
type Semaphore struct {
    ch chan struct{}
}

func NewSemaphore(max int) *Semaphore {
    return &Semaphore{ch: make(chan struct{}, max)}
}

func (s *Semaphore) Acquire(ctx context.Context) error {
    select {
    case s.ch <- struct{}{}:
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}

func (s *Semaphore) Release() {
    <-s.ch
}

// Usage: limit concurrent DB connections
sem := NewSemaphore(10)
for _, task := range tasks {
    go func(t Task) {
        sem.Acquire(ctx)
        defer sem.Release()
        processTask(t)
    }(task)
}
```

### Q337. How do you implement a rate limiter in Go?

```go
import "golang.org/x/time/rate"

// Token bucket: 10 requests/sec, burst of 30
limiter := rate.NewLimiter(10, 30)

func rateLimitMiddleware(limiter *rate.Limiter) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if !limiter.Allow() {
                w.Header().Set("Retry-After", "1")
                http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

// Per-IP rate limiting
type IPRateLimiter struct {
    mu       sync.Mutex
    limiters map[string]*rate.Limiter
    rate     rate.Limit
    burst    int
}

func (rl *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
    rl.mu.Lock()
    defer rl.mu.Unlock()
    if l, ok := rl.limiters[ip]; ok { return l }
    l := rate.NewLimiter(rl.rate, rl.burst)
    rl.limiters[ip] = l
    return l
}
```

### Q338. Implement a pub/sub system in Go.

```go
type Broker struct {
    mu          sync.RWMutex
    subscribers map[string][]chan []byte
}

func NewBroker() *Broker {
    return &Broker{subscribers: make(map[string][]chan []byte)}
}

func (b *Broker) Subscribe(topic string) <-chan []byte {
    b.mu.Lock()
    defer b.mu.Unlock()
    ch := make(chan []byte, 100) // buffered
    b.subscribers[topic] = append(b.subscribers[topic], ch)
    return ch
}

func (b *Broker) Publish(topic string, msg []byte) {
    b.mu.RLock()
    defer b.mu.RUnlock()
    for _, ch := range b.subscribers[topic] {
        select {
        case ch <- msg:
        default: // drop if subscriber is slow
        }
    }
}

func (b *Broker) Unsubscribe(topic string, ch <-chan []byte) {
    b.mu.Lock()
    defer b.mu.Unlock()
    subs := b.subscribers[topic]
    for i, s := range subs {
        if s == ch {
            b.subscribers[topic] = append(subs[:i], subs[i+1:]...)
            close(s)
            return
        }
    }
}
```

### Q339. How do you write table-driven tests with subtests?

```go
func TestParseAmount(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    float64
        wantErr bool
    }{
        {"valid integer", "100", 100.0, false},
        {"valid decimal", "99.99", 99.99, false},
        {"with currency", "$50", 50.0, false},
        {"empty string", "", 0, true},
        {"invalid", "abc", 0, true},
        {"negative", "-10", -10.0, false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel() // Run subtests concurrently
            got, err := ParseAmount(tt.input)
            if (err != nil) != tt.wantErr {
                t.Fatalf("ParseAmount(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
            }
            if !tt.wantErr && got != tt.want {
                t.Errorf("ParseAmount(%q) = %v, want %v", tt.input, got, tt.want)
            }
        })
    }
}
```

### Q340. What is the pipeline pattern in Go?

```go
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums { out <- n }
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in { out <- n * n }
    }()
    return out
}

func filter(in <-chan int, predicate func(int) bool) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            if predicate(n) { out <- n }
        }
    }()
    return out
}

// Pipeline: generate → square → filter even
ch := filter(square(generate(1, 2, 3, 4, 5)), func(n int) bool { return n%2 == 0 })
for v := range ch { fmt.Println(v) } // 4, 16
```

### Q341-Q345. Go Quick-fire

**Q341. What is `sync.Pool`?**
```go
var bufPool = sync.Pool{
    New: func() any { return new(bytes.Buffer) },
}

func process() {
    buf := bufPool.Get().(*bytes.Buffer)
    defer func() { buf.Reset(); bufPool.Put(buf) }()
    buf.WriteString("hello")
}
```
Reduces GC pressure by reusing objects. Not a cache — objects can be collected anytime.

**Q342. What is the difference between `panic` and `os.Exit`?**
`panic` unwinds the stack, runs deferred functions, and can be recovered. `os.Exit` terminates immediately — no defers, no cleanup.

**Q343. What is `go vet` and static analysis?**
`go vet` checks for suspicious constructs (printf format mismatches, unreachable code, mutex copy). `staticcheck` and `golangci-lint` add deeper analysis.

**Q344. What is `go:embed`?**
```go
import "embed"

//go:embed templates/*
var templates embed.FS

//go:embed version.txt
var version string
```
Embeds files into the binary at compile time.

**Q345. How does Go handle memory alignment?**
Go aligns struct fields to their natural boundaries. Field ordering affects struct size due to padding. Use `unsafe.Sizeof` and `unsafe.Alignof` to inspect.
```go
type Bad struct {  a bool; b int64; c bool }  // 24 bytes
type Good struct { b int64; a bool; c bool }  // 16 bytes
```

---

## Section 15: API Design & GraphQL (Q346–Q370)

### Q346. What are REST API design best practices?

```
GET    /api/v1/users          — List users
GET    /api/v1/users/:id      — Get single user
POST   /api/v1/users          — Create user
PUT    /api/v1/users/:id      — Full update
PATCH  /api/v1/users/:id      — Partial update
DELETE /api/v1/users/:id      — Delete user

GET    /api/v1/users/:id/orders   — Nested resources
GET    /api/v1/users?status=active&sort=-created_at&page=2&limit=20
```

Best practices: use nouns (not verbs), plural resources, proper HTTP methods, status codes, pagination, versioning, HATEOAS links.

### Q347. What are proper HTTP status codes?

```
200 OK              — Success
201 Created         — Resource created (return Location header)
204 No Content      — Success with no body (DELETE)
301 Moved           — Permanent redirect
304 Not Modified    — Cache hit

400 Bad Request     — Invalid input
401 Unauthorized    — Not authenticated
403 Forbidden       — Authenticated but not authorized
404 Not Found       — Resource doesn't exist
409 Conflict        — Resource state conflict
422 Unprocessable   — Validation error
429 Too Many Reqs   — Rate limited

500 Internal Error  — Server bug
502 Bad Gateway     — Upstream failure
503 Unavailable     — Overloaded/maintenance
504 Gateway Timeout — Upstream timeout
```

### Q348. What is GraphQL and how does it differ from REST?

```graphql
# Schema
type User {
  id: ID!
  name: String!
  email: String!
  orders(limit: Int = 10): [Order!]!
}

type Query {
  user(id: ID!): User
  users(filter: UserFilter): [User!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
}

# Client query — ask for exactly what you need
query {
  user(id: "123") {
    name
    orders(limit: 5) {
      id
      total
    }
  }
}
```

**REST**: multiple endpoints, over/under-fetching, simpler caching. **GraphQL**: single endpoint, precise data fetching, complex on server.

### Q349. How do you implement pagination?

```ts
// Offset-based (simple, has issues with large offsets)
GET /api/users?page=3&limit=20

// Cursor-based (consistent, better for real-time data)
GET /api/users?cursor=eyJpZCI6MTAwfQ&limit=20

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    cursor: string | null;
    hasMore: boolean;
  };
}

// Implementation
async function getUsers(cursor?: string, limit = 20) {
  const decoded = cursor ? JSON.parse(atob(cursor)) : null;
  const users = await db.query(
    `SELECT * FROM users WHERE id > $1 ORDER BY id LIMIT $2`,
    [decoded?.id ?? 0, limit + 1]
  );

  const hasMore = users.length > limit;
  const data = users.slice(0, limit);
  const nextCursor = hasMore
    ? btoa(JSON.stringify({ id: data[data.length - 1].id }))
    : null;

  return { data, meta: { cursor: nextCursor, hasMore } };
}
```

### Q350. What is API versioning? Compare strategies.

```
1. URL path:     /api/v1/users, /api/v2/users
2. Query param:  /api/users?version=2
3. Header:       Accept: application/vnd.api+json; version=2
4. Content type: Accept: application/vnd.company.v2+json
```

URL path versioning is most common and clearest. Header-based is more RESTful but harder to test/discover.

### Q351. How do you handle API errors consistently?

```ts
// Consistent error response format
interface APIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    requestId: string;
  };
}

// Express error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers["x-request-id"] as string;

  if (err instanceof ValidationError) {
    return res.status(422).json({
      error: { code: "VALIDATION_ERROR", message: err.message, details: err.fields, requestId }
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: err.message, requestId }
    });
  }

  // Unexpected error — don't leak internals
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong", requestId }
  });
});
```

### Q352. What is HATEOAS?

```json
{
  "id": 123,
  "name": "Sourav",
  "email": "sourav@test.com",
  "_links": {
    "self": { "href": "/api/users/123" },
    "orders": { "href": "/api/users/123/orders" },
    "update": { "href": "/api/users/123", "method": "PATCH" },
    "delete": { "href": "/api/users/123", "method": "DELETE" }
  }
}
```

HATEOAS (Hypermedia As The Engine Of Application State) includes navigation links in responses, making APIs self-documenting and discoverable.

### Q353. How do you handle file uploads in APIs?

```go
func uploadHandler(w http.ResponseWriter, r *http.Request) {
    // Limit upload size (10MB)
    r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

    if err := r.ParseMultipartForm(10 << 20); err != nil {
        http.Error(w, "File too large", http.StatusRequestEntityTooLarge)
        return
    }

    file, header, err := r.FormFile("file")
    if err != nil {
        http.Error(w, "Invalid file", http.StatusBadRequest)
        return
    }
    defer file.Close()

    // Validate content type
    buf := make([]byte, 512)
    file.Read(buf)
    contentType := http.DetectContentType(buf)
    if contentType != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" {
        http.Error(w, "Only XLSX files allowed", http.StatusBadRequest)
        return
    }
    file.Seek(0, 0)

    // Save or process
    dst, _ := os.Create(filepath.Join("uploads", header.Filename))
    defer dst.Close()
    io.Copy(dst, file)
}
```

### Q354. What is ETag and conditional requests?

```go
func getUser(w http.ResponseWriter, r *http.Request) {
    user := fetchUser(r.PathValue("id"))
    etag := fmt.Sprintf(`"%x"`, md5.Sum([]byte(user.UpdatedAt.String())))

    w.Header().Set("ETag", etag)

    // Check if client has current version
    if r.Header.Get("If-None-Match") == etag {
        w.WriteHeader(http.StatusNotModified) // 304
        return
    }

    json.NewEncoder(w).Encode(user)
}
```

ETags enable conditional requests — clients send `If-None-Match` and get `304 Not Modified` if the resource hasn't changed, saving bandwidth.

### Q355. What is GraphQL N+1 and how to solve with DataLoader?

```js
// ❌ N+1 Problem: resolve each user's orders individually
const resolvers = {
  User: {
    orders: (user) => db.query("SELECT * FROM orders WHERE user_id = ?", user.id)
    // Called N times for N users
  }
};

// ✅ DataLoader: batches into one query
const orderLoader = new DataLoader(async (userIds) => {
  const orders = await db.query(
    "SELECT * FROM orders WHERE user_id IN (?)",
    [userIds]
  );
  // Group by user_id and return in same order as userIds
  return userIds.map(id => orders.filter(o => o.userId === id));
});

const resolvers = {
  User: {
    orders: (user) => orderLoader.load(user.id) // Batched automatically
  }
};
```

### Q356-Q360. API Quick-fire

**Q356. What is content negotiation?**
Server selects response format based on client's `Accept` header. `Accept: application/json` → JSON, `Accept: text/csv` → CSV.

**Q357. What is API throttling vs rate limiting?**
Rate limiting: hard cap (429 after limit). Throttling: gradually slows responses as limit approaches (progressive degradation).

**Q358. What are WebHooks?**
HTTP callbacks triggered by events. Your system POSTs to a subscriber's URL when something happens (e.g., payment received). Include: signature verification, retry logic, idempotency keys.

**Q359. What is OpenAPI (Swagger)?**
Machine-readable API specification format. Enables: auto-generated docs, client SDKs, type generation, contract testing.

**Q360. What is gRPC and when to use it over REST?**
Binary protocol (Protocol Buffers) over HTTP/2. Lower latency, streaming support, strong typing. Use for: internal microservice communication, high-performance APIs. REST better for: public APIs, browser clients.

### Q361-Q365. More API Design

**Q361. How do you design idempotent APIs?**
GET, PUT, DELETE are naturally idempotent. For POST: accept `Idempotency-Key` header, store result, return same response on retry.

**Q362. What is API gateway pattern?**
Single entry point that handles: authentication, rate limiting, request routing, load balancing, response caching, protocol translation.

**Q363. What is response compression?**
```go
import "github.com/klauspost/compress/gzhttp"

handler = gzhttp.GzipHandler(handler) // Auto gzip for Accept-Encoding: gzip
```
Reduces payload size by 70-90% for JSON/text.

**Q364. How do you handle long-running API operations?**
Return `202 Accepted` with a job ID. Client polls `/api/jobs/{id}` for status. Or use WebSocket/SSE for push notifications.
```json
{ "jobId": "abc123", "status": "processing", "progress": 45, "statusUrl": "/api/jobs/abc123" }
```

**Q365. What is request validation middleware?**
```ts
import { z } from "zod";

function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data; // typed and validated
    next();
  };
}

app.post("/api/users", validate(CreateUserSchema), createUser);
```

### Q366-Q370. GraphQL Deep Dive

**Q366. What are GraphQL subscriptions?**
```graphql
subscription {
  orderUpdated(orderId: "123") {
    status
    updatedAt
  }
}
```
Real-time updates over WebSocket. Server pushes data when events occur.

**Q367. What is the GraphQL schema-first vs code-first approach?**
Schema-first: write `.graphql` files, generate resolvers. Code-first: define schema in code (e.g., Nexus, TypeGraphQL), generate SDL.

**Q368. What are GraphQL directives?**
```graphql
query GetUser($withOrders: Boolean!) {
  user(id: "1") {
    name
    email
    orders @include(if: $withOrders) { id, total }
  }
}
```

**Q369. How do you handle authentication in GraphQL?**
Pass token in HTTP headers, verify in context middleware, check permissions in resolvers or directives.

**Q370. What is query complexity analysis?**
Assign cost to fields, reject queries exceeding max complexity. Prevents abusive deeply nested queries.

---

## Section 16: Testing & Quality (Q371–Q395)

### Q371. What is the testing pyramid?

```
        /\        E2E Tests (few, slow, expensive)
       /  \       - Cypress, Playwright
      /----\
     /      \     Integration Tests (moderate)
    /        \    - API tests, DB tests
   /----------\
  /            \  Unit Tests (many, fast, cheap)
 /              \ - Jest, Go testing, Vitest
/________________\
```

### Q372. How do you mock dependencies in Go tests?

```go
// Define interface
type UserStore interface {
    GetByID(ctx context.Context, id string) (*User, error)
    Create(ctx context.Context, user *User) error
}

// Mock implementation
type MockUserStore struct {
    users map[string]*User
    err   error
}

func (m *MockUserStore) GetByID(ctx context.Context, id string) (*User, error) {
    if m.err != nil { return nil, m.err }
    return m.users[id], nil
}

// Test
func TestGetUser(t *testing.T) {
    store := &MockUserStore{
        users: map[string]*User{"1": {ID: "1", Name: "Sourav"}},
    }
    handler := NewUserHandler(store)

    req := httptest.NewRequest("GET", "/users/1", nil)
    rec := httptest.NewRecorder()
    handler.GetUser(rec, req)

    assert.Equal(t, 200, rec.Code)
}
```

### Q373. How do you test React components with MSW (Mock Service Worker)?

```ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.get("/api/users", () => {
    return HttpResponse.json([
      { id: 1, name: "Sourav" },
      { id: 2, name: "Ahmed" },
    ]);
  }),
  http.post("/api/users", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("displays users", async () => {
  render(<UserList />);
  await waitFor(() => {
    expect(screen.getByText("Sourav")).toBeInTheDocument();
  });
});
```

### Q374. What is snapshot testing?

```tsx
test("renders correctly", () => {
  const { container } = render(<Button variant="primary">Click me</Button>);
  expect(container).toMatchSnapshot();
  // First run: creates .snap file
  // Subsequent: compares against snapshot, fails if different
});

// Inline snapshot
test("renders correctly", () => {
  const { container } = render(<Badge>New</Badge>);
  expect(container.innerHTML).toMatchInlineSnapshot(
    `"<span class=\"badge\">New</span>"`
  );
});
```

### Q375. How do you test async code?

```ts
// Jest/Vitest
test("fetches user data", async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe("Sourav");
});

// Testing rejected promises
test("handles not found", async () => {
  await expect(fetchUser(999)).rejects.toThrow("Not found");
});

// Testing timers
test("debounced search", () => {
  jest.useFakeTimers();
  const handler = jest.fn();
  const debouncedHandler = debounce(handler, 300);

  debouncedHandler("query");
  debouncedHandler("quer");
  debouncedHandler("que");

  expect(handler).not.toHaveBeenCalled();
  jest.advanceTimersByTime(300);
  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler).toHaveBeenCalledWith("que");
});
```

### Q376. What is property-based testing?

```ts
import fc from "fast-check";

test("sort is idempotent", () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const doubleSorted = [...sorted].sort((a, b) => a - b);
      expect(sorted).toEqual(doubleSorted);
    })
  );
});

test("JSON.parse(JSON.stringify(x)) roundtrips", () => {
  fc.assert(
    fc.property(fc.jsonValue(), (value) => {
      expect(JSON.parse(JSON.stringify(value))).toEqual(value);
    })
  );
});
```

Property-based testing generates hundreds of random inputs to find edge cases you wouldn't think of.

### Q377. How do you write E2E tests with Playwright?

```ts
import { test, expect } from "@playwright/test";

test("user can create a campaign", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "admin@test.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL("/dashboard");

  await page.click("text=New Campaign");
  await page.fill('[name="title"]', "Summer Sale");
  await page.selectOption('[name="type"]', "push");
  await page.click("text=Create");

  await expect(page.locator(".toast")).toContainText("Campaign created");
});
```

### Q378. What is test-driven development (TDD)?

**Red → Green → Refactor** cycle:
1. Write a failing test
2. Write minimum code to pass
3. Refactor while keeping tests green

```go
// 1. Red — write test first
func TestParseCSV(t *testing.T) {
    result, err := ParseCSV("name,age\nSourav,25")
    assert.NoError(t, err)
    assert.Equal(t, []Row{{Name: "Sourav", Age: 25}}, result)
}

// 2. Green — make it pass
func ParseCSV(input string) ([]Row, error) {
    // Implementation...
}

// 3. Refactor — improve code, tests still pass
```

### Q379. How do you test database queries?

```go
func TestCreateUser(t *testing.T) {
    // Use testcontainers for real DB in CI
    ctx := context.Background()
    pg, err := postgres.Run(ctx, "postgres:16-alpine")
    require.NoError(t, err)
    defer pg.Terminate(ctx)

    connStr, _ := pg.ConnectionString(ctx, "sslmode=disable")
    db, _ := sql.Open("postgres", connStr)

    // Run migrations
    migrate(db)

    // Test
    repo := NewUserRepo(db)
    user, err := repo.Create(ctx, &User{Name: "Sourav", Email: "s@test.com"})
    assert.NoError(t, err)
    assert.NotEmpty(t, user.ID)

    // Verify
    found, err := repo.GetByID(ctx, user.ID)
    assert.NoError(t, err)
    assert.Equal(t, "Sourav", found.Name)
}
```

### Q380. What is code coverage and its limitations?

```bash
# Go
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# JavaScript
npx vitest --coverage
```

Coverage measures lines/branches executed during tests. Limitations: 100% coverage doesn't mean bug-free — it doesn't test edge cases, race conditions, or integration issues. Aim for meaningful tests, not coverage numbers.

### Q381-Q385. Testing Quick-fire

**Q381. What is the Arrange-Act-Assert pattern?**
```ts
test("adds item to cart", () => {
  // Arrange
  const cart = new Cart();
  const item = { id: "1", name: "Phone", price: 999 };
  // Act
  cart.add(item);
  // Assert
  expect(cart.items).toHaveLength(1);
  expect(cart.total).toBe(999);
});
```

**Q382. What is a test fixture?**
Predefined data/state used across tests. Setup in `beforeEach` or factory functions.

**Q383. What are test doubles (stub, mock, spy, fake)?**
**Stub**: returns predetermined data. **Mock**: verifies interactions. **Spy**: wraps real implementation, records calls. **Fake**: simplified working implementation (e.g., in-memory DB).

**Q384. What is contract testing?**
Verify that services agree on API interfaces. Consumer-driven contracts (Pact): consumer defines expectations, provider verifies against them.

**Q385. What is load testing?**
```bash
# k6 example
k6 run --vus 100 --duration 30s script.js
```
Simulate real-world traffic to find performance bottlenecks, max throughput, and breaking points.

### Q386-Q390. Quality & Practices

**Q386. What is ESLint and how do you configure it?**
```json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**Q387. What is Prettier and why separate from ESLint?**
Prettier handles formatting (indentation, line width, quotes). ESLint handles code quality (unused vars, error patterns). They complement each other.

**Q388. What is pre-commit hooks with Husky?**
```json
// package.json
{ "lint-staged": { "*.{ts,tsx}": ["eslint --fix", "prettier --write"] } }
```
```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

**Q389. What is semantic versioning (SemVer)?**
`MAJOR.MINOR.PATCH` — 2.4.1 → breaking.feature.fix. `^2.4.1` = compatible with 2.x.x. `~2.4.1` = compatible with 2.4.x.

**Q390. What is trunk-based development?**
Developers commit directly to main (or short-lived branches merged quickly). Feature flags control unreleased features. Contrast: Gitflow with long-lived branches.

### Q391-Q395. More Testing

**Q391. How do you test WebSocket connections?**
```ts
test("receives real-time updates", async () => {
  const ws = new WebSocket("ws://localhost:3001");
  const messages: string[] = [];

  ws.onmessage = (e) => messages.push(e.data);
  await waitForOpen(ws);

  ws.send(JSON.stringify({ type: "subscribe", channel: "orders" }));
  await waitFor(() => expect(messages).toContainEqual(expect.stringContaining("subscribed")));
});
```

**Q392. What is mutation testing?**
Tools (Stryker, go-mutesting) modify your code (mutants) and check if tests catch the changes. Surviving mutants indicate weak tests.

**Q393. How do you test error boundaries?**
```tsx
test("renders fallback on error", () => {
  const ThrowingComponent = () => { throw new Error("Boom"); };
  const spy = jest.spyOn(console, "error").mockImplementation();

  render(
    <ErrorBoundary fallback={<p>Something went wrong</p>}>
      <ThrowingComponent />
    </ErrorBoundary>
  );

  expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  spy.mockRestore();
});
```

**Q394. What is chaos engineering?**
Deliberately inject failures (kill services, add latency, corrupt data) to test system resilience. Tools: Chaos Monkey, LitmusChaos.

**Q395. How do you benchmark Go functions?**
```go
func BenchmarkJSONMarshal(b *testing.B) {
    user := User{ID: 1, Name: "Sourav", Email: "s@t.com"}
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        json.Marshal(user)
    }
}
// go test -bench=. -benchmem
// BenchmarkJSONMarshal-8   5000000   240 ns/op   128 B/op   2 allocs/op
```

---

## Section 17: Performance & Optimization (Q396–Q420)

### Q396. What are Core Web Vitals?

**LCP** (Largest Contentful Paint): < 2.5s. Largest visible element loads.
**INP** (Interaction to Next Paint): < 200ms. Time from user input to visual response.
**CLS** (Cumulative Layout Shift): < 0.1. How much content shifts unexpectedly.

### Q397. How do you optimize Next.js bundle size?

```tsx
// 1. Dynamic imports
const HeavyComponent = dynamic(() => import("./Heavy"), { ssr: false });

// 2. Analyze bundle
// next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: true });

// 3. Tree-shake imports
import { pick } from "lodash-es"; // NOT: import _ from "lodash"

// 4. Code split routes (automatic with App Router)
// 5. Externalize large dependencies
// 6. Use next/image for images
// 7. Lazy load below-fold content
```

### Q398. How do you optimize PostgreSQL queries?

```sql
-- 1. Use EXPLAIN ANALYZE
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT ...;

-- 2. Add appropriate indexes
CREATE INDEX CONCURRENTLY idx_orders_user_status
ON orders(user_id, status) WHERE status = 'active';

-- 3. Use partial indexes
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;

-- 4. Batch inserts
INSERT INTO events (type, data) VALUES
  ('click', '{}'), ('view', '{}'), ('purchase', '{}');

-- 5. Use connection pooling (PgBouncer)
-- 6. VACUUM and ANALYZE regularly
-- 7. Partition large tables
```

### Q399. What is memoization in React and when does it hurt?

```tsx
// ✅ Good: expensive computation
const sorted = useMemo(() => items.sort((a, b) => a.rank - b.rank), [items]);

// ❌ Bad: trivial computation — memo overhead > saved work
const doubled = useMemo(() => count * 2, [count]);

// ✅ Good: preventing child re-renders
const MemoChild = React.memo(({ data }: Props) => <ExpensiveTree data={data} />);

// ❌ Bad: memoizing everything "just in case"
// React.memo has comparison cost; if props change often, it's wasted
```

### Q400. How do you optimize Go microservice performance?

```go
// 1. Profile
import _ "net/http/pprof"
// go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

// 2. Reduce allocations
var bufPool = sync.Pool{New: func() any { return new(bytes.Buffer) }}

// 3. Use efficient serialization
// json → encoding/json → easyjson → protobuf (fastest)

// 4. Batch database operations
tx, _ := db.Begin()
stmt, _ := tx.Prepare("INSERT INTO events (type, data) VALUES ($1, $2)")
for _, e := range events {
    stmt.Exec(e.Type, e.Data)
}
tx.Commit()

// 5. Connection pooling
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(10)
```

### Q401-Q405. Performance Quick-fire

**Q401. What is lazy loading?**
Defer loading resources until needed. Images: `loading="lazy"`. Components: `React.lazy()`. Routes: dynamic imports.

**Q402. What is a service worker?**
Proxy between browser and network. Enables: offline support, background sync, push notifications, cache strategies (cache-first, network-first, stale-while-revalidate).

**Q403. What is HTTP/2 and why does it matter?**
Multiplexing (multiple requests over one connection), header compression, server push. Eliminates need for: sprite sheets, domain sharding, concatenated bundles.

**Q404. What is database query caching?**
Cache frequent queries in Redis. Invalidate on writes. Patterns: read-through, write-through, write-behind.

**Q405. What is image optimization strategy?**
Use WebP/AVIF formats, responsive srcset, lazy loading, blur placeholder, CDN delivery, proper dimensions. `next/image` handles all of this.

### Q406-Q420. More Performance

**Q406. What is SSR vs SSG vs ISR vs CSR?**
**SSR**: render on each request (dynamic data). **SSG**: render at build time (static). **ISR**: static with periodic revalidation. **CSR**: render in browser (SPA). Choose based on data freshness needs.

**Q407. How do you optimize Redis memory usage?**
Use appropriate data structures, set TTLs, compress values, use Redis Streams instead of Lists for queues, enable `maxmemory-policy allkeys-lru`.

**Q408. What is prefetching?**
Load resources before they're needed. DNS prefetch, link prefetch, preload critical resources.
```html
<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin />
<link rel="prefetch" href="/next-page.js" />
```

**Q409. How do you handle memory leaks in JavaScript?**
Common sources: forgotten event listeners, closures holding references, timers not cleared, detached DOM nodes. Debug with Chrome DevTools Memory tab, heap snapshots.

**Q410. What is connection pooling and why is it important?**
Reuse existing database connections instead of creating new ones per request. Reduces TCP handshake overhead, authentication cost, and prevents exhausting connection limits.

**Q411. What is server-side rendering performance optimization?**
Stream HTML with Suspense, cache rendered pages, use React Server Components (zero client JS), preload data in parallel, avoid waterfalls.

**Q412. How do you optimize WebSocket connections at scale?**
Binary messages (protobuf) instead of JSON, message compression (permessage-deflate), connection heartbeats, fan-out through pub/sub (Redis), horizontal scaling with sticky sessions or shared state.

**Q413. What is a CDN and how does it improve performance?**
Caches content at edge locations worldwide. Reduces latency (geographic proximity), offloads origin server, handles DDoS absorption. Use for: static assets, API responses with cache headers.

**Q414. How do you optimize Docker container startup time?**
Small base images (alpine, distroless), multi-stage builds, minimize layers, use init systems (tini), health check with readiness probes, pre-warm connection pools.

**Q415. What is request coalescing / deduplication?**
Multiple identical concurrent requests are collapsed into one. The response is shared across all waiters.
```go
var group singleflight.Group

func getData(key string) (any, error) {
    val, err, _ := group.Do(key, func() (any, error) {
        return fetchFromDB(key)
    })
    return val, err
}
```

**Q416. What is streaming rendering?**
Send HTML progressively as it's generated, not waiting for the full page. Users see content earlier. Next.js App Router + Suspense enables this automatically.

**Q417. How do you profile frontend performance?**
Chrome DevTools: Performance tab (flame chart, main thread activity), Lighthouse (CWV audit), Network tab (waterfall), Coverage tab (unused JS/CSS).

**Q418. What is efficient pagination for large datasets?**
Keyset/cursor pagination instead of OFFSET (which scans skipped rows). Use indexed columns for cursors.
```sql
-- ❌ Slow for large offsets
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000;
-- ✅ Fast regardless of position
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 20;
```

**Q419. What is edge computing?**
Run code closer to users at CDN edge locations. Examples: Vercel Edge Functions, Cloudflare Workers. Best for: authentication, A/B testing, personalization, geolocation routing.

**Q420. How do you monitor application performance?**
APM tools (Datadog, New Relic): track request latency, error rates, throughput. Custom metrics: histogram for response times, counter for errors, gauge for queue depth. Alerting on SLOs.

---

## Section 18: Advanced System Design (Q421–Q450)

### Q421. Design a real-time collaborative editing system.

**Architecture**: Clients connect via WebSocket → Operations transformed using OT (Operational Transformation) or CRDT → Broadcast to all connected clients → Persist document state periodically.

**Key components**: Operation log (append-only), document state store, presence service (who's editing), cursor tracking, undo/redo stack per user.

**Trade-offs**: OT requires a central server (simpler correctness), CRDTs are peer-to-peer capable but more complex.

### Q422. Design a distributed task scheduler.

```
Task Submission → Queue (Redis/Kafka) → Scheduler → Worker Pool → Result Store

Components:
- Task registry: cron expressions, one-time schedules
- Leader election: only one scheduler active (using Redis lock)
- Worker pool: pull from queue, report heartbeat
- Dead letter queue: failed tasks after max retries
- Dashboard: task status, history, manual retry
```

### Q423. Design a feature flag system.

```ts
interface FeatureFlag {
  key: string;
  enabled: boolean;
  rules: Rule[]; // percentage rollout, user segments, geography
  defaultValue: boolean;
}

function evaluateFlag(flag: FeatureFlag, context: UserContext): boolean {
  if (!flag.enabled) return flag.defaultValue;

  for (const rule of flag.rules) {
    if (matchesRule(rule, context)) {
      if (rule.type === "percentage") {
        const hash = murmurhash(context.userId + flag.key);
        return (hash % 100) < rule.percentage;
      }
      return rule.value;
    }
  }
  return flag.defaultValue;
}
```

### Q424. Design a search autocomplete system.

```
User types → Debounce (200ms) → API call → Trie/prefix lookup → Ranked results

Storage: Trie in Redis using sorted sets
ZADD autocomplete:en "0" "path"
ZADD autocomplete:en "0" "patha"
ZADD autocomplete:en "0" "pathao"
ZRANGEBYLEX autocomplete:en "[path" "[path\xff" LIMIT 0 10

Ranking: frequency, recency, personalization
Caching: CDN cache popular prefixes, client-side cache recent queries
```

### Q425. Design a payment processing system.

```
Order Service → Payment Service → Payment Gateway (Stripe/SSL)
                    ↓
              Transaction Log (append-only)
                    ↓
              Reconciliation Service (daily batch)

Key principles:
- Idempotency keys for every payment request
- Double-entry bookkeeping
- Saga pattern: Reserve → Charge → Confirm (or Compensate)
- PCI DSS compliance: never store raw card data
- Webhook handlers for async payment notifications
- Retry with exponential backoff for gateway failures
```

### Q426. Design a content delivery pipeline.

```
Author creates content → CMS → Validation → Transform pipeline → CDN
                                               ↓
                                    [Resize images, minify, compress]
                                               ↓
                                    Push to edge locations
                                               ↓
                                    Invalidation on update
```

### Q427. How would you migrate a monolith to microservices?

1. **Identify bounded contexts** — map domain boundaries
2. **Strangler fig pattern** — route new features to new services
3. **Extract read path first** — easier, lower risk
4. **Shared database → own database** — eventually separate
5. **Event-driven communication** — decouple services
6. **API gateway** — unified entry point
7. **Observability first** — tracing, logging, metrics before splitting

### Q428. Design a multi-tenant SaaS architecture.

```
Strategies:
1. Shared DB, shared schema (tenant_id column) — cheapest
2. Shared DB, separate schemas — moderate isolation
3. Separate databases per tenant — strongest isolation, most expensive

Example: shared schema
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT,
  created_at TIMESTAMPTZ
);

-- Row-level security
CREATE POLICY tenant_isolation ON campaigns
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### Q429. Design a distributed configuration management system.

```
Config Store (etcd/Consul) → Watch for changes → Push to services
                                                       ↓
                                               Hot reload (no restart)

Features:
- Hierarchical config: global → environment → service → instance
- Encryption for secrets
- Version history and rollback
- Validation before deployment
- Audit log
```

### Q430. Design an event sourcing system.

```go
type Event struct {
    ID        uuid.UUID
    Type      string
    AggID     string
    Data      json.RawMessage
    Version   int
    Timestamp time.Time
}

type EventStore interface {
    Append(ctx context.Context, aggID string, events []Event, expectedVersion int) error
    Load(ctx context.Context, aggID string) ([]Event, error)
}

// Rebuild state from events
func (a *Account) Apply(events []Event) {
    for _, e := range events {
        switch e.Type {
        case "AccountOpened":
            a.Status = "active"
        case "MoneyDeposited":
            var data DepositData
            json.Unmarshal(e.Data, &data)
            a.Balance += data.Amount
        case "MoneyWithdrawn":
            var data WithdrawData
            json.Unmarshal(e.Data, &data)
            a.Balance -= data.Amount
        }
        a.Version = e.Version
    }
}
```

### Q431-Q435. System Design Quick-fire

**Q431. What is a write-ahead log (WAL)?**
Append changes to a log before applying to main storage. Ensures durability and crash recovery. Used by PostgreSQL, Kafka.

**Q432. What is consistent hashing?**
Distributes data across nodes with minimal redistribution when nodes are added/removed. Used by: Redis Cluster, CDNs, load balancers.

**Q433. What is the Raft consensus algorithm?**
Leader election + log replication for distributed systems. Simpler than Paxos. Used by etcd, CockroachDB.

**Q434. What is data lake vs data warehouse?**
Data lake: raw, unstructured data (S3, HDFS). Data warehouse: structured, processed data (BigQuery, Redshift). Lakes are flexible; warehouses are fast for queries.

**Q435. What is a bloom filter?**
Probabilistic data structure: "definitely not in set" or "probably in set". Space-efficient for membership testing. Used by: databases (skip disk reads), CDNs, spell checkers.

### Q436-Q440. Architecture Deep Dive

**Q436. Design a cron job management system.**
Scheduler with leader election → Job queue → Workers with heartbeat → Result storage → Retry/DLQ → Dashboard with logs.

**Q437. How do you handle data migration with zero downtime?**
1. Add new column/table (backward compatible)
2. Dual-write to old and new
3. Backfill historical data
4. Verify consistency
5. Switch reads to new
6. Stop writes to old
7. Clean up

**Q438. Design a rate-limited email sending system.**
Queue emails → Rate limiter (per provider limits) → Connection pool to SMTP → Retry with backoff → Bounce handling → Analytics.

**Q439. What is the outbox pattern?**
Store events in an "outbox" table alongside business data in the same transaction. A separate process polls the outbox and publishes to the message broker. Guarantees at-least-once delivery without distributed transactions.

**Q440. Design a geofencing system.**
Store geofences as polygons in PostGIS → Driver location updates → Check `ST_Contains(fence, point)` → Trigger events when entering/exiting zones.

### Q441-Q450. Final System Design

**Q441. What is the sidecar proxy pattern (service mesh)?**
Every service gets a proxy sidecar (Envoy/Istio) handling: mTLS, load balancing, retries, circuit breaking, observability. Application code stays simple.

**Q442. Design an A/B testing platform.**
Assign users to variants (hash-based), track events, compute statistical significance, visualize results, auto-detect regressions.

**Q443. What is Command Query Separation (CQS) vs CQRS?**
CQS: methods either change state (command) or return data (query), never both. CQRS: separate models/stores for reads and writes.

**Q444. Design a distributed tracing system.**
Inject trace ID at entry → Propagate through headers → Each service logs spans → Collector aggregates → Query by trace ID → Visualize request flow.

**Q445. What is the saga pattern for compensating transactions?**
```
Choreography: each service publishes events, next service reacts
Orchestration: central coordinator directs the saga steps

Example: Order Saga (Orchestrator)
1. CreateOrder → "pending"
2. ReserveInventory → success/fail
3. ProcessPayment → success/fail
4. ConfirmOrder → "confirmed"

On failure at step 3:
3c. RefundPayment
2c. ReleaseInventory
1c. CancelOrder
```

**Q446. Design a webhook delivery system.**
Receive event → Persist to queue → Retry worker (exponential backoff, max attempts) → Signature verification → Delivery logging → Dead letter queue → Dashboard.

**Q447. What is blue-green vs canary vs rolling deployment?**
Blue-green: instant switch between environments. Canary: gradual traffic shift (1% → 10% → 50% → 100%). Rolling: replace instances one by one.

**Q448. Design a distributed rate limiter.**
Central Redis with Lua scripts for atomic operations. Sliding window algorithm. Sync across instances via shared state. Fallback to local limiting if Redis is down.

**Q449. What is the bulkhead pattern?**
Isolate failures by partitioning resources. Separate thread pools/connection pools per service dependency. If one dependency fails, others continue working.

**Q450. Design a health dashboard for microservices.**
Each service exposes `/health` → Aggregator polls all services → Store time-series data (Prometheus) → Visualize (Grafana) → Alert on degradation (PagerDuty).

---

## Section 19: Cloud, DevOps & Infrastructure (Q451–Q475)

### Q451. What is infrastructure as code? Compare Terraform vs Pulumi.

```hcl
# Terraform (HCL)
resource "aws_s3_bucket" "uploads" {
  bucket = "pathao-uploads"
  
  versioning {
    enabled = true
  }
}
```

```ts
// Pulumi (TypeScript)
const bucket = new aws.s3.Bucket("uploads", {
  versioning: { enabled: true },
});
```

Terraform: mature ecosystem, HCL language. Pulumi: real programming languages, better for complex logic.

### Q452. What is Kubernetes and its core concepts?

```yaml
# Pod — smallest deployable unit
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: app
      image: pathao/api:v1.2
      ports:
        - containerPort: 8080
      resources:
        requests: { cpu: "100m", memory: "128Mi" }
        limits: { cpu: "500m", memory: "512Mi" }

# Deployment — manages Pod replicas
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
```

Key concepts: Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, HPA (autoscaling).

### Q453. What is AWS S3 and presigned URLs?

```go
func generatePresignedURL(bucket, key string) (string, error) {
    client := s3.NewFromConfig(cfg)
    presigner := s3.NewPresignClient(client)

    req, err := presigner.PresignPutObject(context.TODO(), &s3.PutObjectInput{
        Bucket:      aws.String(bucket),
        Key:         aws.String(key),
        ContentType: aws.String("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    }, s3.WithPresignExpires(15*time.Minute))

    return req.URL, err
}
```

Client uploads directly to S3 using the presigned URL — no file passes through your server.

### Q454. What is CI/CD pipeline design?

```yaml
# GitHub Actions
name: Deploy
on: push: branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    steps:
      - run: docker build -t app:${{ github.sha }} .
      - run: docker push registry/app:${{ github.sha }}

  deploy:
    needs: build
    steps:
      - run: kubectl set image deployment/app app=registry/app:${{ github.sha }}
```

### Q455. What is AWS Lambda and serverless?

```go
func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    body := fmt.Sprintf("Hello from Lambda! Path: %s", event.Path)
    return events.APIGatewayProxyResponse{
        StatusCode: 200,
        Body:       body,
    }, nil
}

func main() {
    lambda.Start(handler)
}
```

Pros: no server management, pay per execution, auto-scaling. Cons: cold starts, execution time limits, vendor lock-in.

### Q456-Q460. Cloud Quick-fire

**Q456. What is a message broker (Kafka vs RabbitMQ)?**
Kafka: high throughput, durable log, replay. RabbitMQ: flexible routing, lower latency, traditional queue. Use Kafka for event streaming, RabbitMQ for task queues.

**Q457. What is object storage vs block storage vs file storage?**
Object (S3): unstructured blobs, HTTP API. Block (EBS): volumes attached to instances, like hard drives. File (EFS): shared filesystem, NFS.

**Q458. What is auto-scaling?**
Automatically adjust compute capacity based on metrics (CPU, memory, request count). Horizontal: add/remove instances. Vertical: resize instances.

**Q459. What is a VPC?**
Virtual Private Cloud: isolated network in the cloud. Subnets, route tables, security groups, NAT gateways. Public subnets for load balancers, private subnets for databases.

**Q460. What is DNS and how does it work?**
Domain Name System resolves names to IPs. Flow: browser cache → OS cache → recursive resolver → root → TLD → authoritative. Record types: A (IP), CNAME (alias), MX (mail), TXT (verification).

### Q461-Q475. More Infrastructure

**Q461. What is Prometheus and Grafana?**
Prometheus: time-series database that scrapes metrics endpoints. Grafana: visualization dashboards. Together they provide monitoring and alerting.

**Q462. What is ELK stack?**
Elasticsearch (search/analytics), Logstash (log pipeline), Kibana (visualization). Alternative: Grafana Loki + Promtail.

**Q463. What is a load balancer (L4 vs L7)?**
L4: operates on TCP/UDP (faster, less flexible). L7: operates on HTTP (content-based routing, SSL termination, header inspection).

**Q464. What is container registry?**
Store and distribute Docker images. Examples: Docker Hub, AWS ECR, GitHub Container Registry. Tag images with git SHA for traceability.

**Q465. What is secrets management?**
Store, rotate, and control access to secrets. Tools: AWS Secrets Manager, HashiCorp Vault, Doppler. Never commit secrets to code.

**Q466. What is a reverse proxy vs forward proxy?**
Forward: client → proxy → internet (client anonymity). Reverse: internet → proxy → server (server protection, load balancing).

**Q467. What is SSL/TLS termination?**
Load balancer handles HTTPS encryption/decryption. Backend servers communicate over HTTP (faster). Simplifies certificate management.

**Q468. What is GitOps?**
Infrastructure/deployment state stored in Git. Changes are made via pull requests. Tools (ArgoCD, Flux) sync cluster state with Git.

**Q469. What is observability vs monitoring?**
Monitoring: predefined dashboards for known failure modes. Observability: ability to understand system behavior from external outputs (logs, metrics, traces) — debug unknown unknowns.

**Q470. What is a service mesh?**
Infrastructure layer for service-to-service communication. Handles: mTLS, traffic management, observability, fault injection. Examples: Istio, Linkerd.

**Q471. What is database replication?**
Copy data across multiple servers. Primary-replica: writes to primary, reads from replicas. Multi-primary: writes anywhere (conflict resolution needed).

**Q472. What is a caching layer architecture?**
```
Client → CDN (static assets)
Client → App Server → Redis (hot data cache) → PostgreSQL (source of truth)
```
Cache-aside, read-through, write-through, write-behind patterns.

**Q473. What is immutable infrastructure?**
Never modify running servers. Deploy new servers with updated config, switch traffic, destroy old ones. Benefits: reproducibility, no configuration drift.

**Q474. What is a dead letter queue?**
Queue for messages that fail processing after max retries. Enables: debugging, manual retry, alerting on failures without blocking the main queue.

**Q475. What is cost optimization in cloud?**
Right-size instances, use spot/preemptible instances, reserved instances for steady workloads, auto-scaling, storage tiering (S3 Glacier), delete unused resources, set billing alerts.

---

## Section 20: Behavioral & Scenario-Based Technical (Q476–Q500)

### Q476. How do you handle a production incident?

1. **Detect**: alerts fire, users report issues
2. **Triage**: assess severity, assemble team
3. **Mitigate**: quick fix to restore service (rollback, feature flag, scale up)
4. **Diagnose**: find root cause using logs, metrics, traces
5. **Fix**: implement proper solution
6. **Post-mortem**: blameless review, document learnings, improve systems

### Q477. How do you approach a greenfield project?

1. Understand requirements and constraints
2. Define data models and API contracts
3. Choose tech stack based on team skills and requirements
4. Set up CI/CD, linting, testing from day one
5. Build core features iteratively (MVP first)
6. Implement monitoring and observability early
7. Document architecture decisions (ADRs)

### Q478. How do you handle technical debt?

Track it visually (tech debt board), quantify impact (developer time lost, incident frequency), prioritize alongside features, allocate regular time (20% rule or dedicated sprints), make it visible to stakeholders.

### Q479. How do you estimate project timelines?

Break into small tasks (< 1 day), add buffer for unknowns (1.5-2x), account for testing/code review, communicate uncertainty ("2-3 weeks, not 2 weeks"), track velocity over time for better estimates.

### Q480. How do you debug a performance issue in production?

1. Check metrics dashboard — which metric degraded? When?
2. Correlate with deployments, traffic changes, or infrastructure events
3. Check slow query logs, APM traces
4. Profile the specific bottleneck (CPU, memory, I/O, network)
5. Reproduce locally if possible
6. Fix and monitor

### Q481. How do you handle a disagreement about technical approach?

Listen fully, understand the trade-offs of each approach, propose a time-boxed prototype/benchmark if stakes are high, defer to the person closest to the problem, document the decision and rationale (ADR).

### Q482. Describe a time you improved developer experience.

Example: "At Pathao, I built the Dashboard Foundation with OpenAPI-driven type generation and Zod validation. This eliminated manual type syncing between frontend and backend, reduced bugs from API contract mismatches, and cut new dashboard development time significantly."

### Q483. How do you make a build vs buy decision?

Consider: core competency (build), time-to-market (buy), customization needs, long-term cost, vendor lock-in risk, maintenance burden, team expertise.

### Q484. How would you reduce a 5-second API response to under 500ms?

1. Profile to find the bottleneck
2. Add database indexes on slow queries
3. Implement caching (Redis) for repeated reads
4. Optimize N+1 queries (batch/join)
5. Parallelize independent operations
6. Denormalize if read-heavy
7. Move heavy work to background jobs
8. Add CDN for static responses

### Q485. How do you ensure code quality in a team?

Automated linting, required code reviews, CI/CD with tests, shared coding standards, pair programming for complex features, regular refactoring sprints, knowledge sharing sessions.

### Q486. How do you handle a dependency with a critical vulnerability?

1. Assess impact (is it exploitable in your context?)
2. Check for patches/updates
3. If no patch: find alternative library or implement workaround
4. Deploy fix with urgency proportional to risk
5. Add dependency scanning to CI (Snyk, Dependabot)

### Q487. How do you design for failure?

Assume everything fails: retry with backoff, circuit breakers, fallback responses, graceful degradation, bulkheads, health checks, chaos testing. Design so no single failure takes down the system.

### Q488. How do you handle data inconsistency between services?

Event-driven architecture with idempotent consumers. Saga pattern for distributed transactions. Reconciliation jobs to detect and fix drift. Monitoring for inconsistency alerts.

### Q489. How do you mentor junior developers?

Pair programming, code review with explanations (not just fixes), assign stretch tasks with support, create documentation, share context on "why" not just "how", celebrate their wins.

### Q490. How do you handle scope creep?

Document requirements clearly upfront, use timeboxes, push back with data ("adding X delays Y by 2 weeks"), suggest phased delivery, separate "must have" from "nice to have."

### Q491. How do you decide between monorepo vs polyrepo?

Monorepo: shared tooling, atomic changes across packages, easier refactoring. Polyrepo: independent deployment, clearer ownership, simpler CI per repo. Choose based on team size and coupling.

### Q492. How do you handle database schema changes in production?

Expand-and-contract pattern: add new column → dual-write → backfill → switch reads → drop old column. Never make breaking changes in one step.

### Q493. How do you approach learning a new technology?

Build something small, read official docs (not just tutorials), understand the "why" behind design decisions, compare with what you know, contribute to open source.

### Q494. How do you handle conflicting priorities?

Communicate trade-offs clearly, get stakeholder alignment, use frameworks like RICE (Reach, Impact, Confidence, Effort), propose alternatives, be transparent about constraints.

### Q495. Describe your most challenging bug and how you solved it.

Structure: context → investigation process → root cause → fix → prevention. Show systematic debugging (reproduce → hypothesize → test → verify).

### Q496. How do you handle tech stack disagreements in a team?

Evaluate objectively (performance benchmarks, ecosystem, hiring pool, team expertise), prototype both approaches if time allows, make a decision and commit, document the rationale.

### Q497. How would you approach building a cross-platform mobile app?

Options: React Native (JS skills reusable), Flutter (Dart, performant), native (Swift/Kotlin, best UX). Choose based on: team skills, performance requirements, platform-specific features needed.

### Q498. How do you ensure accessibility in web applications?

Semantic HTML, ARIA labels, keyboard navigation, color contrast (WCAG AA), screen reader testing, focus management, alt text for images, form labels.

### Q499. How do you stay current with technology?

Follow key blogs (Anthropic, Vercel, Go Blog), read source code, build side projects, participate in communities, attend meetups/conferences, read papers for foundational knowledge.

### Q500. What questions do YOU ask in an interview?

- "What does the first 90 days look like?"
- "What's the team's biggest technical challenge right now?"
- "How are architectural decisions made?"
- "What does the deployment process look like?"
- "How does the team handle incidents?"
- "What's the code review culture like?"

---

*That's 500 questions total! With your experience at Pathao (real-time systems, maps, campaigns, gamification) and ShellBeeHaken (diverse SaaS), you have real-world stories for every category. Connect theory to your projects in every answer.* 🚀
