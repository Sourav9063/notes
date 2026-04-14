# 500 Technical Interview Questions & Answers (Part 3)

**Questions 501–1000 | Sourav Ahmed — Full-Stack Engineer**

---

## Section 21: Vue.js & Nuxt.js (Q501–Q530)

### Q501. What is the Vue 3 Composition API and how does it differ from Options API?

```js
// Options API
export default {
  data() { return { count: 0 } },
  methods: { increment() { this.count++ } },
  computed: { doubled() { return this.count * 2 } },
}

// Composition API
import { ref, computed } from "vue";

export default {
  setup() {
    const count = ref(0);
    const doubled = computed(() => count.value * 2);
    const increment = () => count.value++;
    return { count, doubled, increment };
  }
}

// <script setup> (syntactic sugar — preferred)
<script setup>
import { ref, computed } from "vue";
const count = ref(0);
const doubled = computed(() => count.value * 2);
const increment = () => count.value++;
</script>
```

Composition API enables better logic reuse (composables), TypeScript support, and code organization by feature rather than option type.

### Q502. What is the difference between `ref` and `reactive`?

```js
import { ref, reactive } from "vue";

// ref — wraps any value, access via .value
const count = ref(0);
count.value++;       // need .value in JS
// In template: {{ count }} — auto-unwrapped

// reactive — deep reactive proxy for objects, no .value needed
const state = reactive({ count: 0, user: { name: "Sourav" } });
state.count++;       // direct access
state.user.name = "Ahmed"; // deep reactive

// Gotcha: destructuring reactive loses reactivity
const { count: c } = state;    // ❌ c is NOT reactive
const { count: c2 } = toRefs(state); // ✅ c2 is reactive ref
```

### Q503. How does Vue's reactivity system work internally?

Vue 3 uses JavaScript `Proxy` (Vue 2 used `Object.defineProperty`).

```js
// Simplified reactive implementation
function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key);      // Record which effect depends on this property
      return Reflect.get(obj, key, receiver);
    },
    set(obj, key, value, receiver) {
      const result = Reflect.set(obj, key, value, receiver);
      trigger(obj, key);    // Re-run all effects that depend on this property
      return result;
    }
  });
}
```

Key advantage over Vue 2: detects property addition/deletion, works with Maps/Sets, better performance.

### Q504. What are Vue composables?

```js
// composables/useCounter.js
import { ref, computed } from "vue";

export function useCounter(initial = 0) {
  const count = ref(initial);
  const doubled = computed(() => count.value * 2);
  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => (count.value = initial);
  return { count, doubled, increment, decrement, reset };
}

// composables/useFetch.js
export function useFetch(url) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(true);

  const fetchData = async () => {
    loading.value = true;
    try {
      const res = await fetch(url.value || url);
      data.value = await res.json();
    } catch (e) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  };

  watchEffect(() => fetchData()); // Re-fetch if url is reactive and changes
  return { data, error, loading, refetch: fetchData };
}
```

### Q505. How does Nuxt.js server-side rendering work?

```
Request → Nuxt Server → Vue renders on server → HTML + payload sent to client
                                                → Client hydrates → SPA behavior
```

```ts
// pages/users/[id].vue
<script setup>
const route = useRoute();

// Runs on server during SSR, cached and serialized in payload
const { data: user } = await useFetch(`/api/users/${route.params.id}`);
</script>

<template>
  <div>
    <h1>{{ user.name }}</h1>
    <p>{{ user.email }}</p>
  </div>
</template>
```

### Q506. What is `useFetch` vs `useAsyncData` in Nuxt 3?

```ts
// useFetch — wrapper around useAsyncData + $fetch
const { data, pending, error, refresh } = await useFetch("/api/users");

// useAsyncData — more control, custom fetching logic
const { data } = await useAsyncData("users", () => {
  return $fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
});

// Key behavior: both deduplicate requests, serialize on server, hydrate on client
// useFetch auto-generates a key; useAsyncData requires explicit key
```

### Q507. How do Vue directives work?

```vue
<template>
  <!-- Built-in directives -->
  <p v-if="isVisible">Shown conditionally</p>
  <p v-show="isVisible">Toggle display CSS</p>
  <ul>
    <li v-for="item in items" :key="item.id">{{ item.name }}</li>
  </ul>
  <input v-model="search" />
  <button @click="submit">Submit</button>
  <div v-html="rawHtml"></div>

  <!-- Custom directive -->
  <input v-focus />
</template>

<script setup>
// Custom directive
const vFocus = {
  mounted(el) { el.focus(); },
};
</script>
```

### Q508. What is `provide`/`inject` in Vue?

```js
// Parent component — provide data
import { provide, ref } from "vue";

const theme = ref("dark");
provide("theme", theme);           // Reactive
provide("toggleTheme", () => {
  theme.value = theme.value === "dark" ? "light" : "dark";
});

// Deep child component — inject data (no prop drilling)
import { inject } from "vue";

const theme = inject("theme");             // ref("dark")
const toggleTheme = inject("toggleTheme"); // function
const fallback = inject("missing", "default-value"); // with default
```

### Q509. How does Vue Router work with Nuxt?

```
pages/
  index.vue          → /
  about.vue          → /about
  users/
    index.vue        → /users
    [id].vue         → /users/:id
  [...slug].vue      → catch-all route
```

```ts
// Programmatic navigation
const router = useRouter();
router.push("/users/123");
router.push({ name: "users-id", params: { id: "123" } });

// Route middleware
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useAuth();
  if (!user.value && to.path !== "/login") {
    return navigateTo("/login");
  }
});
```

### Q510. What are Vue watchers?

```js
import { ref, watch, watchEffect } from "vue";

const query = ref("");
const filters = reactive({ status: "all", sort: "date" });

// Watch specific source
watch(query, (newVal, oldVal) => {
  console.log(`Query changed: ${oldVal} → ${newVal}`);
  fetchResults(newVal);
}, { debounce: 300 }); // Nuxt has built-in debounce option

// Watch reactive object (deep by default)
watch(filters, (newFilters) => {
  fetchResults(query.value, newFilters);
});

// watchEffect — auto-tracks dependencies
watchEffect(() => {
  // Re-runs whenever query.value or filters.status changes
  console.log(`Searching: ${query.value} with status: ${filters.status}`);
});
```

### Q511. What is Nuxt's `useState` composable?

```ts
// SSR-safe shared state — survives hydration
const useCounter = () => useState<number>("counter", () => 0);

// In any component
const counter = useCounter();
counter.value++;

// Unlike ref(), useState is:
// 1. Serialized from server to client (survives SSR)
// 2. Shared across components (singleton per key)
// 3. SSR-safe (no hydration mismatch)
```

### Q512. How do Nuxt server routes/API work?

```ts
// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const user = await db.query("SELECT * FROM users WHERE id = $1", [id]);

  if (!user) {
    throw createError({ statusCode: 404, message: "User not found" });
  }

  return user;
});

// server/api/users.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const user = await db.insert("users", body);
  return user;
});
```

### Q513. What is `<Teleport>` in Vue?

```vue
<template>
  <button @click="showModal = true">Open Modal</button>

  <!-- Renders inside #modal-root, not inside this component's DOM -->
  <Teleport to="#modal-root">
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h2>Modal Content</h2>
        <button @click="showModal = false">Close</button>
      </div>
    </div>
  </Teleport>
</template>
```

### Q514. How does `v-model` work with custom components?

```vue
<!-- Parent -->
<CustomInput v-model="search" v-model:title="pageTitle" />

<!-- CustomInput.vue -->
<script setup>
const model = defineModel();          // v-model
const title = defineModel("title");   // v-model:title
</script>

<template>
  <input :value="model" @input="model = $event.target.value" />
  <input :value="title" @input="title = $event.target.value" />
</template>
```

### Q515. What are Vue transition and animation hooks?

```vue
<Transition
  @before-enter="onBeforeEnter"
  @enter="onEnter"
  @after-enter="onAfterEnter"
  @leave="onLeave"
>
  <div v-if="show" class="box">Animated</div>
</Transition>

<style>
.v-enter-active, .v-leave-active { transition: opacity 0.3s ease; }
.v-enter-from, .v-leave-to { opacity: 0; }
</style>
```

### Q516. How do you handle global error handling in Nuxt?

```ts
// plugins/error-handler.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error("Vue error:", error, info);
    // Send to error tracking service
  };

  nuxtApp.hook("vue:error", (error) => {
    console.error("Nuxt error hook:", error);
  });
});

// error.vue — global error page
<script setup>
const error = useError();
const handleClear = () => clearError({ redirect: "/" });
</script>
```

### Q517. What is Pinia (Vue state management)?

```ts
// stores/cart.ts
import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>([]);

  const total = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.qty, 0)
  );

  function addItem(item: CartItem) {
    const existing = items.value.find(i => i.id === item.id);
    if (existing) existing.qty++;
    else items.value.push({ ...item, qty: 1 });
  }

  function removeItem(id: string) {
    items.value = items.value.filter(i => i.id !== id);
  }

  return { items, total, addItem, removeItem };
});

// In component
const cart = useCartStore();
cart.addItem({ id: "1", name: "Phone", price: 999 });
```

### Q518. How does Nuxt auto-imports work?

```ts
// Nuxt auto-imports from:
// - vue (ref, computed, watch, etc.)
// - nuxt (useFetch, useRouter, definePageMeta, etc.)
// - composables/ directory
// - utils/ directory
// - server/utils/ for server routes

// No import needed:
const count = ref(0);                   // from vue
const { data } = await useFetch("/api"); // from nuxt
const user = useAuth();                  // from composables/useAuth.ts
```

### Q519. What is `<KeepAlive>` in Vue?

```vue
<template>
  <KeepAlive :include="['UserList', 'Dashboard']" :max="5">
    <component :is="currentTab" />
  </KeepAlive>
</template>

<script setup>
// Component state is preserved when switching tabs
// Without KeepAlive, component is destroyed and recreated
// Hooks: onActivated(), onDeactivated()

onActivated(() => {
  console.log("Component re-activated, refresh data");
});
</script>
```

### Q520. How do you implement SSR-safe code in Nuxt?

```ts
// Check environment
if (import.meta.client) {
  // Only runs on client — safe for window, document, localStorage
  window.addEventListener("scroll", handler);
}

if (import.meta.server) {
  // Only runs on server — safe for DB access, secrets
}

// Or use lifecycle hooks
onMounted(() => {
  // Only runs on client — DOM is available
  const width = window.innerWidth;
});

// Or use <ClientOnly>
<template>
  <ClientOnly>
    <BrowserOnlyChart />
    <template #fallback>
      <p>Loading chart...</p>
    </template>
  </ClientOnly>
</template>
```

### Q521-Q525. Vue/Nuxt Quick-fire

**Q521. What is `toRefs` and `toRef`?**
```js
const state = reactive({ a: 1, b: 2 });
const { a, b } = toRefs(state);  // Each is a ref linked to state
const c = toRef(state, "a");     // Single ref linked to state.a
```

**Q522. What are Vue slots?**
```vue
<!-- Parent -->
<Card>
  <template #header><h2>Title</h2></template>
  <template #default>Body content</template>
  <template #footer="{ close }"><button @click="close">Close</button></template>
</Card>

<!-- Card.vue -->
<template>
  <div>
    <slot name="header" />
    <slot />
    <slot name="footer" :close="closeCard" />
  </div>
</template>
```

**Q523. What is `shallowRef` and when to use it?**
```js
const list = shallowRef([1, 2, 3]);
list.value.push(4);        // ❌ won't trigger reactivity (shallow)
list.value = [...list.value, 4]; // ✅ replacing the whole value triggers
```
Use for large objects where deep reactivity is unnecessary (performance optimization).

**Q524. What is `definePageMeta` in Nuxt?**
```ts
definePageMeta({
  layout: "admin",
  middleware: ["auth"],
  title: "Dashboard",
  keepalive: true,
});
```

**Q525. How does Nuxt's `$fetch` differ from `useFetch`?**
`$fetch` is a plain fetch wrapper (like axios). `useFetch` wraps `$fetch` with SSR deduplication, caching, and reactive state. Use `$fetch` in event handlers; use `useFetch` in setup.

### Q526-Q530. Advanced Vue/Nuxt

**Q526. What are async components in Vue?**
```js
const AsyncModal = defineAsyncComponent({
  loader: () => import("./Modal.vue"),
  loadingComponent: LoadingSpinner,
  delay: 200,
  errorComponent: ErrorDisplay,
  timeout: 3000,
});
```

**Q527. How do you implement i18n in Nuxt?**
```ts
// nuxt.config.ts
modules: ["@nuxtjs/i18n"],
i18n: {
  locales: [{ code: "en", file: "en.json" }, { code: "bn", file: "bn.json" }],
  defaultLocale: "en",
}

// In component
const { t, locale } = useI18n();
// {{ t('welcome') }}
```

**Q528. What is `useHead` in Nuxt?**
```ts
useHead({
  title: "Dashboard - Pathao",
  meta: [{ name: "description", content: "Campaign management dashboard" }],
  script: [{ src: "https://analytics.example.com/script.js", defer: true }],
});
```

**Q529. How do you handle form validation in Vue?**
Use VeeValidate + Zod:
```vue
<script setup>
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

const schema = toTypedSchema(z.object({
  email: z.string().email(),
  password: z.string().min(8),
}));

const { handleSubmit, errors } = useForm({ validationSchema: schema });
const onSubmit = handleSubmit((values) => { /* values is typed */ });
</script>
```

**Q530. What is Nuxt's rendering modes?**
```ts
// nuxt.config.ts
routeRules: {
  "/":           { prerender: true },     // SSG — build time
  "/dashboard":  { ssr: true },           // SSR — every request
  "/settings":   { ssr: false },          // CSR — client only
  "/blog/**":    { swr: 3600 },           // ISR — stale-while-revalidate
  "/api/**":     { cors: true },          // API routes
}
```

---

## Section 22: Node.js Internals (Q531–Q555)

### Q531. Explain the Node.js architecture.

```
JavaScript Code
      ↓
   V8 Engine (compiles JS to machine code)
      ↓
   Node.js Bindings (C++ bridge)
      ↓
   libuv (event loop, async I/O, thread pool)
      ↓
   OS Kernel (epoll/kqueue/IOCP)
```

Node.js is single-threaded for JS execution but uses libuv's thread pool (default 4 threads) for file I/O, DNS lookups, and CPU-intensive operations.

### Q532. Explain the Node.js event loop phases.

```
   ┌───────────────────────────┐
┌─>│           timers          │ ← setTimeout, setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │ ← I/O callbacks deferred to next loop
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │ ← internal use
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │ ← retrieve new I/O events
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │ ← setImmediate
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │      close callbacks      │ ← socket.on('close')
│  └─────────────┬─────────────┘
│                 │
│  process.nextTick → microtask queue (runs between EVERY phase)
└─────────────────┘
```

### Q533. What is the difference between `process.nextTick` and `setImmediate`?

```js
setImmediate(() => console.log("setImmediate"));
process.nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("promise"));
console.log("sync");

// Output: sync, nextTick, promise, setImmediate
// nextTick runs before promises, both before setImmediate
```

`process.nextTick` runs before any I/O or timers (microtask-like). `setImmediate` runs in the check phase of the event loop.

### Q534. How does the `cluster` module work?

```js
import cluster from "cluster";
import os from "os";
import http from "http";

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary ${process.pid} forking ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting`);
    cluster.fork();
  });
} else {
  http.createServer((req, res) => {
    res.end(`Hello from worker ${process.pid}`);
  }).listen(8080);
}
```

### Q535. What are Node.js Streams?

```js
import { createReadStream, createWriteStream } from "fs";
import { pipeline, Transform } from "stream";

// Transform stream: uppercase each chunk
const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

// Pipeline: file → transform → output (handles errors and backpressure)
pipeline(
  createReadStream("input.txt"),
  upperCase,
  createWriteStream("output.txt"),
  (err) => {
    if (err) console.error("Pipeline failed:", err);
    else console.log("Pipeline succeeded");
  }
);
```

Stream types: Readable, Writable, Duplex (both), Transform (modify data).

### Q536. What is `worker_threads` in Node.js?

```js
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

if (isMainThread) {
  const worker = new Worker(new URL(import.meta.url), {
    workerData: { numbers: [1, 2, 3, 4, 5] }
  });

  worker.on("message", (result) => console.log("Sum:", result));
  worker.on("error", console.error);
} else {
  const sum = workerData.numbers.reduce((a, b) => a + b, 0);
  parentPort.postMessage(sum);
}
```

Unlike `cluster` (separate processes), `worker_threads` share memory via `SharedArrayBuffer`.

### Q537. How does `Buffer` work in Node.js?

```js
// Create buffers
const buf1 = Buffer.alloc(10);              // 10 zero-filled bytes
const buf2 = Buffer.from("Hello");          // from string
const buf3 = Buffer.from([0x48, 0x69]);     // from bytes

// Operations
buf2.toString("utf-8");     // "Hello"
buf2.toString("base64");    // "SGVsbG8="
buf2.length;                // 5 (bytes, not characters)
Buffer.concat([buf2, buf3]); // combine

// Important: Buffers are fixed-size, allocated outside V8 heap
// Used for: binary data, file I/O, network protocols, crypto
```

### Q538. What is `EventEmitter` in Node.js?

```js
import { EventEmitter } from "events";

class OrderService extends EventEmitter {
  async createOrder(data) {
    const order = await db.insert("orders", data);
    this.emit("order:created", order);
    return order;
  }
}

const service = new OrderService();
service.on("order:created", (order) => sendConfirmationEmail(order));
service.on("order:created", (order) => updateInventory(order));
service.on("order:created", (order) => trackAnalytics(order));

// Error handling — MUST listen for 'error' event
service.on("error", (err) => console.error("Order error:", err));
```

### Q539. How do you handle memory leaks in Node.js?

```js
// Common leak patterns:
// 1. Growing arrays/maps without cleanup
// 2. Event listeners not removed
// 3. Closures holding large objects
// 4. Global variables accumulating data

// Detection
process.memoryUsage(); // { rss, heapTotal, heapUsed, external }

// Profiling
// node --inspect app.js → Chrome DevTools → Memory tab
// Take heap snapshots, compare for retained objects

// Prevention
emitter.removeAllListeners("event");   // Clean up listeners
setInterval(() => cache.clear(), 3600000); // Periodic cache cleanup
const weakCache = new WeakMap();        // Let GC collect keys
```

### Q540. What is `AbortController` in Node.js?

```js
const controller = new AbortController();

// Cancel fetch
const res = await fetch(url, { signal: controller.signal });

// Cancel setTimeout
const timeout = setTimeout(() => {}, 5000);
controller.signal.addEventListener("abort", () => clearTimeout(timeout));

// Cancel EventEmitter listener
const ee = new EventEmitter();
ee.on("data", handler, { signal: controller.signal });

// Cancel everything
controller.abort();
```

### Q541-Q545. Node.js Quick-fire

**Q541. What is `package.json` `type: "module"`?**
Enables ES module syntax (import/export) in `.js` files. Without it, Node.js uses CommonJS (require/module.exports) by default.

**Q542. What is the `crypto` module?**
```js
import { createHash, randomBytes, createCipheriv } from "crypto";
const hash = createHash("sha256").update("password").digest("hex");
const token = randomBytes(32).toString("hex");
```

**Q543. What is `libuv` thread pool size?**
Default 4 threads. Set via `UV_THREADPOOL_SIZE` env variable (max 1024). Used for: file I/O, DNS lookups, crypto, zlib.

**Q544. What is `perf_hooks`?**
```js
import { performance, PerformanceObserver } from "perf_hooks";
performance.mark("start");
await heavyOperation();
performance.mark("end");
performance.measure("heavy", "start", "end");
```

**Q545. What is the `vm` module?**
```js
import vm from "vm";
const sandbox = { x: 1 };
vm.createContext(sandbox);
vm.runInContext("x += 40", sandbox);
console.log(sandbox.x); // 41
```
Runs code in isolated context. Used for: sandboxed execution, template engines.

### Q546-Q555. More Node.js

**Q546. What is `AsyncLocalStorage`?**
```js
import { AsyncLocalStorage } from "async_hooks";
const als = new AsyncLocalStorage();

function middleware(req, res, next) {
  als.run({ requestId: crypto.randomUUID(), userId: req.user?.id }, () => {
    next();
  });
}

// Anywhere in the call chain:
function logQuery(sql) {
  const store = als.getStore();
  console.log(`[${store.requestId}] Query: ${sql}`);
}
```

**Q547. How does `fs.watch` vs `chokidar` compare?**
`fs.watch` is built-in but unreliable (platform-dependent, doesn't report filenames on some OS). `chokidar` wraps it with: polling fallback, glob support, debouncing, and cross-platform consistency.

**Q548. What is `Readable.from` for creating streams from iterables?**
```js
import { Readable } from "stream";
const stream = Readable.from(["hello", " ", "world"]);
stream.on("data", (chunk) => process.stdout.write(chunk));
```

**Q549. What are diagnostic channels in Node.js?**
```js
import dc from "diagnostics_channel";
const channel = dc.channel("http.request");
channel.subscribe(({ request }) => {
  console.log(`${request.method} ${request.url}`);
});
```

**Q550. How does `import.meta` work in Node.js ESM?**
```js
import.meta.url;       // file:///path/to/module.js
import.meta.dirname;   // /path/to (Node 21+)
import.meta.filename;  // /path/to/module.js
import.meta.resolve("./other.js"); // resolve relative path
```

**Q551. What is `structuredClone` availability in Node.js?**
Available since Node 17. Deep clones objects including Date, Map, Set, ArrayBuffer, Error. Cannot clone functions, DOM nodes, Proxy.

**Q552. How do you handle uncaught exceptions in Node.js?**
```js
process.on("uncaughtException", (err) => {
  console.error("Uncaught:", err);
  process.exit(1); // Exit — state may be corrupted
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  // In Node 15+, this also crashes the process
});
```

**Q553. What is HTTP/2 in Node.js?**
```js
import http2 from "http2";
const server = http2.createSecureServer({ key, cert });
server.on("stream", (stream, headers) => {
  stream.respond({ ":status": 200 });
  stream.end("Hello HTTP/2");
});
```

**Q554. What is `node:test` (built-in test runner)?**
```js
import { describe, it } from "node:test";
import assert from "node:assert";

describe("math", () => {
  it("adds", () => assert.strictEqual(1 + 2, 3));
  it("async", async () => {
    const result = await fetchData();
    assert.ok(result.length > 0);
  });
});
```

**Q555. What is `corepack` in Node.js?**
Manages package manager versions (pnpm, yarn) per project. Ensures everyone uses the same version.
```json
{ "packageManager": "pnpm@9.0.0" }
```
```bash
corepack enable
```

---

## Section 23: CSS, Tailwind & Web Fundamentals (Q556–Q580)

### Q556. Explain CSS specificity.

```
Specificity hierarchy (highest to lowest):
1. !important                     — ∞
2. Inline styles (style="")       — 1,0,0,0
3. ID selectors (#id)             — 0,1,0,0
4. Class, attribute, pseudo-class — 0,0,1,0
5. Element, pseudo-element        — 0,0,0,1
6. Universal (*)                  — 0,0,0,0

Examples:
#nav .link:hover  → 0,1,2,0
div.card > p      → 0,0,1,2
.btn.btn-primary  → 0,0,2,0
```

### Q557. What is CSS Grid vs Flexbox?

```css
/* Flexbox — 1D layout (row OR column) */
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

/* Grid — 2D layout (rows AND columns) */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
}

/* Grid areas for complex layouts */
.dashboard {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 250px 1fr;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
```

### Q558. What is the CSS box model?

```
┌─────────────── margin ───────────────┐
│  ┌─────────── border ──────────────┐ │
│  │  ┌──────── padding ──────────┐  │ │
│  │  │                           │  │ │
│  │  │        content            │  │ │
│  │  │    (width × height)       │  │ │
│  │  │                           │  │ │
│  │  └───────────────────────────┘  │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘

/* box-sizing changes which box "width" refers to */
* { box-sizing: border-box; } /* width includes padding + border */
```

### Q559. What are CSS custom properties (variables)?

```css
:root {
  --color-primary: #2563eb;
  --color-bg: #ffffff;
  --spacing-md: 1rem;
  --radius: 0.5rem;
}

[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-bg: #0f172a;
}

.card {
  background: var(--color-bg);
  padding: var(--spacing-md);
  border-radius: var(--radius);
  border: 1px solid var(--color-primary);
}
```

### Q560. How does `position` work in CSS?

```css
.static    { position: static; }    /* Default — normal flow */
.relative  { position: relative; top: 10px; } /* Offset from normal position */
.absolute  { position: absolute; top: 0; right: 0; } /* Relative to nearest positioned ancestor */
.fixed     { position: fixed; bottom: 0; }    /* Relative to viewport */
.sticky    { position: sticky; top: 0; }       /* Scrolls then sticks */
```

### Q561. What are Tailwind CSS utility patterns?

```html
<!-- Responsive -->
<div class="w-full md:w-1/2 lg:w-1/3">

<!-- State variants -->
<button class="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50">

<!-- Dark mode -->
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">

<!-- Group hover -->
<div class="group">
  <span class="group-hover:text-blue-500">Hover parent</span>
</div>

<!-- Arbitrary values -->
<div class="top-[117px] grid-cols-[1fr_2fr_1fr] bg-[#1da1f2]">

<!-- Container queries -->
<div class="@container">
  <div class="@lg:flex @lg:gap-4">
</div>
```

### Q562. What is CSS `contain` and content-visibility?

```css
.card {
  contain: layout style paint; /* Isolate this element's rendering */
  content-visibility: auto;    /* Skip rendering offscreen elements */
  contain-intrinsic-size: 200px 300px; /* Placeholder size */
}
```

`content-visibility: auto` can dramatically improve scroll performance for long lists by not rendering offscreen items.

### Q563. What are CSS animations vs transitions?

```css
/* Transition — between two states */
.btn {
  transition: background-color 0.3s ease, transform 0.2s ease;
}
.btn:hover {
  background-color: #2563eb;
  transform: scale(1.05);
}

/* Animation — multi-step, repeatable */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.loading {
  animation: pulse 2s ease-in-out infinite;
}
```

### Q564. What is the `z-index` stacking context?

A new stacking context is created by: `position` with `z-index`, `opacity < 1`, `transform`, `filter`, `will-change`. `z-index` only competes within the same stacking context.

### Q565. What are CSS logical properties?

```css
/* Physical (not RTL-safe) */
.box { margin-left: 1rem; padding-right: 2rem; }

/* Logical (RTL-safe) */
.box {
  margin-inline-start: 1rem;
  padding-inline-end: 2rem;
  border-block-end: 1px solid gray;  /* bottom in LTR */
}
```

### Q566-Q570. Web Fundamentals

**Q566. What is the Critical Rendering Path?**
HTML parsing → DOM → CSSOM → Render Tree → Layout → Paint → Composite. Optimize: minimize critical CSS, defer non-critical JS, preload fonts.

**Q567. What is `<picture>` element and responsive images?**
```html
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="Hero" loading="lazy" decoding="async"
       sizes="(max-width: 768px) 100vw, 50vw"
       srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1200.jpg 1200w" />
</picture>
```

**Q568. What is `prefers-reduced-motion`?**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Q569. What is the `<dialog>` element?**
```html
<dialog id="modal">
  <h2>Confirm</h2>
  <button onclick="this.closest('dialog').close('confirmed')">Yes</button>
</dialog>
<button onclick="document.getElementById('modal').showModal()">Open</button>
```
Native modal with backdrop, focus trapping, and escape-to-close.

**Q570. What are CSS container queries?**
```css
.card-container { container-type: inline-size; }

@container (min-width: 400px) {
  .card { display: flex; gap: 1rem; }
}
```
Style based on parent container size, not viewport — better for reusable components.

### Q571-Q580. More CSS/Web

**Q571. What is `clamp()` in CSS?**
```css
.title { font-size: clamp(1.5rem, 4vw, 3rem); } /* min, preferred, max */
.container { width: clamp(300px, 90%, 1200px); }
```

**Q572. What are CSS layers (`@layer`)?**
```css
@layer base, components, utilities;
@layer base { h1 { font-size: 2rem; } }
@layer components { .btn { padding: 0.5rem 1rem; } }
@layer utilities { .mt-4 { margin-top: 1rem; } }
/* Later layers override earlier ones regardless of specificity */
```

**Q573. What is `aspect-ratio` CSS property?**
```css
.video { aspect-ratio: 16 / 9; width: 100%; }
.avatar { aspect-ratio: 1; border-radius: 50%; }
```

**Q574. What is `:has()` selector?**
```css
.card:has(img) { grid-template-rows: auto 1fr; }
.form:has(:invalid) .submit-btn { opacity: 0.5; pointer-events: none; }
/* Parent selector — style parent based on children */
```

**Q575. What is `scroll-snap`?**
```css
.carousel { scroll-snap-type: x mandatory; overflow-x: scroll; }
.slide { scroll-snap-align: center; }
```

**Q576. What is `will-change`?**
```css
.animated { will-change: transform, opacity; }
/* Hint to browser to optimize — use sparingly, remove when done */
```

**Q577. What is `@supports` (feature queries)?**
```css
@supports (display: grid) { .layout { display: grid; } }
@supports not (backdrop-filter: blur()) { .modal { background: rgba(0,0,0,0.8); } }
```

**Q578. What is `accent-color`?**
```css
:root { accent-color: #2563eb; }
/* Styles native form controls: checkboxes, radios, range sliders, progress */
```

**Q579. What are view transitions?**
```css
::view-transition-old(main) { animation: fade-out 0.3s; }
::view-transition-new(main) { animation: fade-in 0.3s; }
.hero { view-transition-name: hero; }
```

**Q580. What is subgrid?**
```css
.grid { display: grid; grid-template-columns: 1fr 2fr 1fr; }
.grid-item { display: grid; grid-template-columns: subgrid; grid-column: span 3; }
/* Child aligns to parent's column tracks */
```

---

## Section 24: Git & Version Control (Q581–Q600)

### Q581. What is `git rebase` vs `git merge`?

```bash
# Merge — creates merge commit, preserves history
git checkout main
git merge feature-branch
# History: A-B-C-M (M = merge commit)

# Rebase — replays commits on top of target, linear history
git checkout feature-branch
git rebase main
# History: A-B-C-D-E (linear)

# Interactive rebase — squash, edit, reorder commits
git rebase -i HEAD~3
```

Use merge for shared branches (main). Use rebase for local feature branches before merging.

### Q582. How do you resolve merge conflicts?

```bash
git merge feature-branch
# CONFLICT in file.ts

# Edit file — resolve between markers
<<<<<<< HEAD
const port = 3000;
=======
const port = 8080;
>>>>>>> feature-branch

# After resolving:
git add file.ts
git merge --continue
```

### Q583. What is `git bisect`?

```bash
git bisect start
git bisect bad           # current commit is broken
git bisect good v1.2.0   # this commit was working

# Git checks out middle commit — test it
git bisect good  # or bad

# Repeat until bug-introducing commit is found
# Automate:
git bisect run npm test
```

### Q584. What is `git stash`?

```bash
git stash                    # Save working changes
git stash push -m "WIP auth" # Named stash
git stash list               # List stashes
git stash pop                # Apply and remove latest
git stash apply stash@{2}    # Apply specific stash
git stash drop stash@{0}     # Delete stash
```

### Q585. What is `git cherry-pick`?

```bash
git cherry-pick abc123       # Apply specific commit to current branch
git cherry-pick abc123..def456  # Range of commits
git cherry-pick --no-commit abc123  # Stage changes without committing
```

### Q586-Q590. Git Quick-fire

**Q586. What is `git reflog`?**
Records all HEAD movements. Useful for recovering lost commits after reset/rebase.
```bash
git reflog
git checkout HEAD@{5}  # Go back to specific state
```

**Q587. What is `git worktree`?**
```bash
git worktree add ../hotfix hotfix-branch
# Work on hotfix in separate directory without stashing
```

**Q588. What is a good commit message format?**
```
feat(auth): add JWT refresh token rotation

- Implement refresh token endpoint
- Add token family tracking for reuse detection
- Set 7-day rotation window

Closes #423
```
Convention: `type(scope): description` (Conventional Commits).

**Q589. What is `git blame` and `git log --follow`?**
```bash
git blame file.ts           # Who changed each line
git log --follow file.ts    # History including renames
git log -p -S "searchTerm"  # Find when term was added/removed
```

**Q590. What is `.gitattributes`?**
```
*.go text eol=lf
*.xlsx binary
*.lock linguist-generated
```

### Q591-Q600. Advanced Git

**Q591. What is `git filter-branch` / `git filter-repo`?**
Rewrite history: remove large files, change author info, split repositories. Prefer `git filter-repo` (faster, safer).

**Q592. What is a Git hook?**
```bash
# .husky/pre-commit
#!/bin/sh
npx lint-staged

# .husky/commit-msg
npx commitlint --edit $1
```

**Q593. How does `git gc` work?**
Garbage collection: packs loose objects, removes unreachable objects. Runs automatically; `git gc --aggressive` for deep cleanup.

**Q594. What is `git submodule` vs `git subtree`?**
Submodule: pointer to another repo's commit (separate history). Subtree: merges external repo into subdirectory (single history). Subtree is simpler for most cases.

**Q595. What is `git sparse-checkout`?**
```bash
git sparse-checkout init --cone
git sparse-checkout set packages/frontend
# Only checks out specified directories — useful for monorepos
```

**Q596. What is signed commits?**
```bash
git config user.signingkey <GPG-KEY-ID>
git commit -S -m "Verified commit"
git log --show-signature
```

**Q597. What is `git rerere` (Reuse Recorded Resolution)?**
```bash
git config rerere.enabled true
# Git remembers how you resolved conflicts and auto-applies them next time
```

**Q598. How do you squash commits?**
```bash
git rebase -i HEAD~4
# Change "pick" to "squash" for commits to combine
# Or: git merge --squash feature-branch
```

**Q599. What is `git shortlog`?**
```bash
git shortlog -sn --no-merges  # Commit count by author
```

**Q600. What is a merge strategy?**
```bash
git merge -s ours hotfix     # Keep our version entirely
git merge -X theirs feature  # Prefer their changes on conflicts
git merge --no-ff feature    # Always create merge commit
```

---

## Section 25: Design Patterns (Q601–Q635)

### Q601. What is the Singleton pattern?

```ts
class Database {
  private static instance: Database;
  private constructor() { /* connect */ }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

// Go version using sync.Once (Q100)
```

### Q602. What is the Factory pattern?

```ts
interface Notification {
  send(message: string): void;
}

class EmailNotification implements Notification {
  send(msg: string) { console.log(`Email: ${msg}`); }
}

class PushNotification implements Notification {
  send(msg: string) { console.log(`Push: ${msg}`); }
}

class SMSNotification implements Notification {
  send(msg: string) { console.log(`SMS: ${msg}`); }
}

function createNotification(type: "email" | "push" | "sms"): Notification {
  switch (type) {
    case "email": return new EmailNotification();
    case "push":  return new PushNotification();
    case "sms":   return new SMSNotification();
  }
}
```

### Q603. What is the Strategy pattern?

```ts
interface PricingStrategy {
  calculate(basePrice: number): number;
}

class RegularPricing implements PricingStrategy {
  calculate(price: number) { return price; }
}

class PremiumPricing implements PricingStrategy {
  calculate(price: number) { return price * 0.8; } // 20% discount
}

class BulkPricing implements PricingStrategy {
  calculate(price: number) { return price * 0.6; }
}

class Order {
  constructor(private strategy: PricingStrategy) {}
  setStrategy(s: PricingStrategy) { this.strategy = s; }
  getTotal(price: number) { return this.strategy.calculate(price); }
}
```

### Q604. What is the Observer pattern?

```ts
interface Observer<T> { update(data: T): void; }

class Subject<T> {
  private observers: Set<Observer<T>> = new Set();

  subscribe(observer: Observer<T>) { this.observers.add(observer); }
  unsubscribe(observer: Observer<T>) { this.observers.delete(observer); }
  notify(data: T) {
    this.observers.forEach(o => o.update(data));
  }
}

// Usage
const priceTracker = new Subject<number>();
priceTracker.subscribe({ update: (price) => console.log(`Dashboard: $${price}`) });
priceTracker.subscribe({ update: (price) => { if (price < 100) sendAlert(); } });
priceTracker.notify(95); // Both observers notified
```

### Q605. What is the Adapter pattern?

```ts
// Legacy system returns XML
interface LegacyAPI { getXMLData(): string; }

// New system expects JSON
interface ModernAPI { getJSONData(): object; }

class XMLtoJSONAdapter implements ModernAPI {
  constructor(private legacy: LegacyAPI) {}

  getJSONData(): object {
    const xml = this.legacy.getXMLData();
    return parseXMLtoJSON(xml); // Convert format
  }
}
```

### Q606. What is the Decorator pattern?

```ts
interface Logger { log(message: string): void; }

class ConsoleLogger implements Logger {
  log(message: string) { console.log(message); }
}

class TimestampDecorator implements Logger {
  constructor(private inner: Logger) {}
  log(message: string) {
    this.inner.log(`[${new Date().toISOString()}] ${message}`);
  }
}

class PrefixDecorator implements Logger {
  constructor(private inner: Logger, private prefix: string) {}
  log(message: string) { this.inner.log(`${this.prefix}: ${message}`); }
}

// Stack decorators
const logger = new TimestampDecorator(
  new PrefixDecorator(new ConsoleLogger(), "APP")
);
logger.log("Server started"); // [2024-...] APP: Server started
```

### Q607. What is the Repository pattern?

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

class PostgresUserRepository implements UserRepository {
  async findById(id: string) {
    const row = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    return row ? this.toDomain(row) : null;
  }
  // ...
}

class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();
  async findById(id: string) { return this.users.get(id) ?? null; }
  // ... perfect for testing
}
```

### Q608. What is the Command pattern?

```ts
interface Command {
  execute(): void;
  undo(): void;
}

class AddItemCommand implements Command {
  constructor(private cart: Cart, private item: Item) {}
  execute() { this.cart.add(this.item); }
  undo() { this.cart.remove(this.item.id); }
}

class CommandHistory {
  private history: Command[] = [];
  
  execute(cmd: Command) {
    cmd.execute();
    this.history.push(cmd);
  }
  
  undo() {
    const cmd = this.history.pop();
    cmd?.undo();
  }
}
```

### Q609-Q615. More Patterns

**Q609. What is the Builder pattern?**
```ts
class QueryBuilder {
  private query: Partial<Query> = {};
  select(fields: string[]) { this.query.fields = fields; return this; }
  where(condition: string) { this.query.conditions = [...(this.query.conditions || []), condition]; return this; }
  limit(n: number) { this.query.limit = n; return this; }
  build(): Query { return this.query as Query; }
}

new QueryBuilder().select(["name"]).where("active = true").limit(10).build();
```

**Q610. What is the Proxy pattern (structural)?**
```ts
class CachedAPI {
  private cache = new Map<string, { data: any; expiry: number }>();
  constructor(private api: RealAPI) {}

  async get(url: string) {
    const cached = this.cache.get(url);
    if (cached && cached.expiry > Date.now()) return cached.data;
    const data = await this.api.get(url);
    this.cache.set(url, { data, expiry: Date.now() + 60000 });
    return data;
  }
}
```

**Q611. What is the Chain of Responsibility pattern?**
```ts
abstract class Handler {
  protected next?: Handler;
  setNext(handler: Handler) { this.next = handler; return handler; }
  handle(request: Request): Response | null {
    return this.next ? this.next.handle(request) : null;
  }
}

class AuthHandler extends Handler {
  handle(req: Request) {
    if (!req.headers.authorization) return { status: 401, body: "Unauthorized" };
    return super.handle(req);
  }
}

class RateLimitHandler extends Handler {
  handle(req: Request) {
    if (isRateLimited(req.ip)) return { status: 429, body: "Too many requests" };
    return super.handle(req);
  }
}

// Chain: Auth → RateLimit → Handler
const auth = new AuthHandler();
auth.setNext(new RateLimitHandler()).setNext(new BusinessHandler());
```

**Q612. What is the Mediator pattern?**
Central coordinator that manages communication between objects, reducing direct coupling. Chat rooms, event dispatchers, and Redux stores are mediators.

**Q613. What is the Template Method pattern?**
```ts
abstract class DataExporter {
  export() {
    const data = this.fetchData();
    const formatted = this.format(data);
    this.save(formatted);
  }
  abstract fetchData(): any[];
  abstract format(data: any[]): string;
  save(content: string) { fs.writeFileSync("export.dat", content); }
}

class CSVExporter extends DataExporter {
  fetchData() { return db.query("SELECT * FROM users"); }
  format(data: any[]) { return data.map(r => Object.values(r).join(",")).join("\n"); }
}
```

**Q614. What is the Flyweight pattern?**
Share common state between many objects to save memory. Example: text editor sharing font/style objects across characters.

**Q615. What is the State pattern?**
```ts
interface OrderState {
  confirm(order: Order): void;
  ship(order: Order): void;
  cancel(order: Order): void;
}

class PendingState implements OrderState {
  confirm(order: Order) { order.setState(new ConfirmedState()); }
  ship(order: Order) { throw new Error("Cannot ship pending order"); }
  cancel(order: Order) { order.setState(new CancelledState()); }
}
```

### Q616-Q635. SOLID & Architecture Principles

**Q616. What is the Single Responsibility Principle?**
A class should have one reason to change. Split `UserService` into `UserAuthService`, `UserProfileService`, `UserNotificationService`.

**Q617. What is the Open/Closed Principle?**
Open for extension, closed for modification. Use interfaces and polymorphism instead of modifying existing code.

**Q618. What is the Liskov Substitution Principle?**
Subtypes must be substitutable for their base types without altering correctness. If `Rectangle` has `setWidth`/`setHeight`, `Square` cannot inherit from it (violates LSP).

**Q619. What is the Interface Segregation Principle?**
```ts
// ❌ Fat interface
interface Worker { work(): void; eat(): void; sleep(): void; }

// ✅ Segregated
interface Workable { work(): void; }
interface Feedable { eat(): void; }
// Robot implements Workable but not Feedable
```

**Q620. What is the Dependency Inversion Principle?**
High-level modules should not depend on low-level modules; both should depend on abstractions.
```ts
// ❌ Direct dependency
class OrderService { private db = new PostgresDB(); }

// ✅ Depend on abstraction
class OrderService { constructor(private db: Database) {} }
```

**Q621. What is Domain-Driven Design (DDD)?**
Model software around business domains. Key concepts: entities, value objects, aggregates, domain events, bounded contexts, ubiquitous language.

**Q622. What is Clean Architecture?**
```
Entities (innermost) → Use Cases → Interface Adapters → Frameworks (outermost)
```
Dependencies point inward. Business logic doesn't depend on frameworks, databases, or UI.

**Q623. What is the Hexagonal Architecture (Ports & Adapters)?**
```
[HTTP Adapter] → [Port: UserService] ← [PostgresAdapter]
[CLI Adapter]  → [Port: UserService] ← [InMemoryAdapter]
```
Core business logic defines ports (interfaces). Adapters implement them for specific technologies.

**Q624. What is CQRS in practice?**
```ts
// Command (write) model — normalized, validates business rules
class CreateOrderCommand { constructor(public items: Item[], public userId: string) {} }

// Query (read) model — denormalized, optimized for reads
interface OrderView { id: string; userName: string; itemCount: number; total: number; }
```

**Q625. What is event storming?**
Workshop technique: stakeholders place orange sticky notes (domain events) on a timeline, identify commands (blue), aggregates (yellow), and policies (lilac).

**Q626. What is the YAGNI principle?**
"You Aren't Gonna Need It." Don't add functionality until it's needed. Prevents over-engineering.

**Q627. What is the DRY principle and when is it wrong?**
"Don't Repeat Yourself." But premature abstraction is worse than duplication. Prefer duplication over the wrong abstraction (AHA — Avoid Hasty Abstractions).

**Q628. What is KISS (Keep It Simple)?**
Choose the simplest solution that works. Complexity should be justified by real requirements, not hypothetical future needs.

**Q629. What is the Law of Demeter?**
A method should only talk to its immediate friends, not chain through objects: `a.getB().getC().doThing()` → `a.doThing()`.

**Q630. What is composition over inheritance?**
```ts
// ❌ Inheritance — rigid hierarchy
class Animal { move() {} }
class FlyingAnimal extends Animal { fly() {} }
class SwimmingFlyingAnimal extends ??? // problem!

// ✅ Composition — flexible
const withFlying = (base) => ({ ...base, fly() {} });
const withSwimming = (base) => ({ ...base, swim() {} });
const duck = withSwimming(withFlying({ name: "Duck" }));
```

**Q631. What is the Strangler Fig pattern in detail?**
Wrap the legacy system. New features go to the new system. Gradually route more traffic to new system. Remove legacy when empty.

**Q632. What is the Anti-Corruption Layer?**
Translation layer between your domain and external/legacy systems. Prevents external models from polluting your codebase.

**Q633. What is the Specification pattern?**
```ts
interface Spec<T> { isSatisfiedBy(item: T): boolean; }

class ActiveUserSpec implements Spec<User> {
  isSatisfiedBy(user: User) { return user.status === "active"; }
}

class PremiumUserSpec implements Spec<User> {
  isSatisfiedBy(user: User) { return user.plan === "premium"; }
}

class AndSpec<T> implements Spec<T> {
  constructor(private a: Spec<T>, private b: Spec<T>) {}
  isSatisfiedBy(item: T) { return this.a.isSatisfiedBy(item) && this.b.isSatisfiedBy(item); }
}
```

**Q634. What is eventual consistency and how to handle it in UI?**
Show optimistic updates, indicate "syncing" state, handle conflicts with last-write-wins or user-driven resolution, use polling or WebSocket for convergence notification.

**Q635. What is the Saga pattern in detail?**
Orchestration saga: central coordinator manages steps. Choreography saga: each service publishes events and reacts to others. Choose orchestration for complex flows, choreography for simple ones.

---

## Section 26: Linux & Shell Scripting (Q636–Q660)

### Q636. Essential Linux commands for developers.

```bash
# File operations
find . -name "*.go" -type f | xargs grep "TODO"
grep -rn "pattern" --include="*.ts" src/
sed -i 's/old/new/g' file.txt
awk '{print $1, $3}' data.csv

# Process management
ps aux | grep node
kill -9 <PID>
lsof -i :8080              # What's using port 8080?
top / htop                  # Resource monitoring

# Disk and memory
df -h                       # Disk usage
du -sh /var/log/*           # Directory sizes
free -h                     # Memory usage

# Network
curl -X POST -H "Content-Type: application/json" -d '{"key":"val"}' http://localhost:8080/api
netstat -tulnp | grep 5432  # PostgreSQL listening?
ss -tulnp                   # Modern netstat alternative
```

### Q637. How do you write a shell script?

```bash
#!/bin/bash
set -euo pipefail  # Exit on error, unset var, pipe failure

readonly APP_NAME="pathao-api"
readonly LOG_FILE="/var/log/${APP_NAME}.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

deploy() {
  local version="${1:?Version required}"
  log "Deploying ${APP_NAME} v${version}"

  docker build -t "${APP_NAME}:${version}" . || { log "Build failed"; exit 1; }
  docker stop "${APP_NAME}" 2>/dev/null || true
  docker run -d --name "${APP_NAME}" -p 8080:8080 "${APP_NAME}:${version}"

  log "Deployed successfully"
}

deploy "$@"
```

### Q638. What is `jq` for JSON processing?

```bash
# Parse JSON response
curl -s https://api.example.com/users | jq '.data[] | {name: .name, email: .email}'

# Filter
echo '{"users":[{"name":"Sourav","active":true},{"name":"Test","active":false}]}' |
  jq '.users[] | select(.active == true) | .name'
# "Sourav"

# Transform
cat data.json | jq '[.items[] | {id, title: .name, price: (.cost * 1.1)}]'
```

### Q639. How do you use `cron` jobs?

```bash
# crontab -e
# ┌───────────── minute (0-59)
# │ ┌───────────── hour (0-23)
# │ │ ┌───────────── day of month (1-31)
# │ │ │ ┌───────────── month (1-12)
# │ │ │ │ ┌───────────── day of week (0-6, Sun=0)
# │ │ │ │ │

  0 2 * * *   /scripts/backup.sh          # Daily at 2 AM
  */5 * * * * /scripts/health-check.sh     # Every 5 minutes
  0 9 * * 1   /scripts/weekly-report.sh    # Monday at 9 AM
```

### Q640. What is `systemd` service management?

```ini
# /etc/systemd/system/api.service
[Unit]
Description=Pathao API Server
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/api
ExecStart=/opt/api/server
Restart=always
RestartSec=5
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl start api
sudo systemctl enable api    # Start on boot
sudo journalctl -u api -f   # Stream logs
```

### Q641-Q660. Linux Quick-fire

**Q641. What is `xargs`?**
```bash
find . -name "*.log" -mtime +30 | xargs rm -f
echo "a b c" | xargs -n1 echo  # Process one at a time
```

**Q642. What is `tmux`/`screen`?**
Terminal multiplexer: persistent sessions, split panes. `tmux new -s dev`, `Ctrl-b %` split, `Ctrl-b d` detach.

**Q643. What are file permissions?**
```bash
chmod 755 script.sh    # rwxr-xr-x (owner: rwx, group: rx, others: rx)
chmod u+x script.sh    # Add execute for owner
chown deploy:deploy /opt/api  # Change owner
```

**Q644. What is `rsync`?**
```bash
rsync -avz --progress ./dist/ server:/var/www/app/
# Incremental file sync — only transfers changed bytes
```

**Q645. What is piping and redirection?**
```bash
command > file.txt      # Redirect stdout
command 2> error.txt    # Redirect stderr
command &> both.txt     # Redirect both
command1 | command2     # Pipe stdout to stdin
command | tee file.txt  # Both display and save
```

**Q646. What is `ssh` key-based authentication?**
```bash
ssh-keygen -t ed25519 -C "sourav@pathao"
ssh-copy-id user@server
# Now passwordless login
```

**Q647. What is `awk` useful for?**
```bash
# Sum a column
awk '{sum += $3} END {print sum}' data.txt
# Filter lines
awk -F',' '$2 > 100 {print $1, $2}' sales.csv
```

**Q648. What is `watch`?**
```bash
watch -n 2 'docker ps'   # Refresh every 2 seconds
watch -d 'df -h'          # Highlight changes
```

**Q649. How do you check disk I/O?**
```bash
iostat -x 1          # Extended I/O stats every second
iotop                # Top-like for I/O
```

**Q650. What is `strace`?**
```bash
strace -p <PID>      # Trace system calls of running process
strace -e network ./server  # Only network-related calls
```

**Q651. How do you find large files?**
```bash
find / -type f -size +100M -exec ls -lh {} + 2>/dev/null | sort -k5 -h
du -a /var | sort -rn | head -20
```

**Q652. What is `nohup`?**
```bash
nohup ./server &     # Continue running after terminal closes
disown               # Remove from shell's job table
```

**Q653. What is `/proc` filesystem?**
Virtual filesystem exposing kernel/process info.
```bash
cat /proc/cpuinfo    # CPU details
cat /proc/meminfo    # Memory details
cat /proc/<PID>/status  # Process info
```

**Q654. What is `iptables`/`nftables`?**
Linux firewall for packet filtering, NAT, port forwarding.
```bash
iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/8 -j ACCEPT
```

**Q655. What is `ulimit`?**
```bash
ulimit -n          # Max open files (default often 1024)
ulimit -n 65535    # Increase for high-connection servers
```

**Q656. What is `envsubst`?**
```bash
export DB_HOST=localhost
envsubst < config.template.yaml > config.yaml
# Replaces ${DB_HOST} in template with actual value
```

**Q657. What is a swap file?**
Virtual memory on disk used when RAM is full. Check: `swapon --show`, create: `fallocate -l 2G /swapfile`.

**Q658. What is `tar` vs `zip`?**
```bash
tar -czf archive.tar.gz directory/    # Create gzip compressed
tar -xzf archive.tar.gz               # Extract
zip -r archive.zip directory/         # Create zip
```

**Q659. What is `alias` and `.bashrc`?**
```bash
# ~/.bashrc
alias ll='ls -la'
alias gs='git status'
alias dc='docker compose'
export PATH="$HOME/.local/bin:$PATH"
```

**Q660. What is `curl` vs `wget`?**
`curl`: transfers data, supports many protocols, outputs to stdout. `wget`: downloads files, supports recursive downloads, resumes interrupted transfers.

---

## Section 27: Networking & Protocols (Q661–Q690)

### Q661. How does TCP three-way handshake work?

```
Client → SYN → Server
Client ← SYN-ACK ← Server
Client → ACK → Server
(Connection established)

Teardown (four-way):
Client → FIN → Server
Client ← ACK ← Server
Client ← FIN ← Server
Client → ACK → Server
```

### Q662. What is TCP vs UDP?

**TCP**: connection-oriented, reliable delivery, ordered, flow/congestion control. Use for: HTTP, SSH, database connections.

**UDP**: connectionless, unreliable, unordered, no flow control. Use for: video streaming, gaming, DNS, VoIP.

### Q663. How does HTTPS/TLS work?

```
1. Client → ClientHello (supported cipher suites, TLS version)
2. Server → ServerHello + Certificate (public key)
3. Client verifies certificate chain
4. Client → Encrypted pre-master secret (using server's public key)
5. Both derive session keys from pre-master secret
6. Symmetric encryption begins (AES) — much faster than asymmetric
```

### Q664. What is HTTP keep-alive and connection pooling?

```
Without keep-alive:
Request 1: [TCP handshake] → [Request/Response] → [TCP close]
Request 2: [TCP handshake] → [Request/Response] → [TCP close]

With keep-alive (HTTP/1.1 default):
[TCP handshake] → [Request 1/Response 1] → [Request 2/Response 2] → ... → [TCP close]
```

Reduces latency by reusing TCP connections. HTTP/2 goes further with multiplexing — multiple requests over one connection concurrently.

### Q665. What is a WebSocket vs HTTP long polling vs SSE?

| Feature | WebSocket | Long Polling | SSE |
|---------|-----------|-------------|-----|
| Direction | Bidirectional | Bidirectional (simulated) | Server → Client |
| Protocol | WS/WSS | HTTP | HTTP |
| Overhead | Low (after handshake) | High (repeated HTTP) | Low |
| Connection | Persistent | Repeated | Persistent |
| Use case | Chat, gaming, live tracking | Fallback | Notifications, feeds |

### Q666. What is gRPC and Protocol Buffers?

```protobuf
// user.proto
syntax = "proto3";
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListRequest) returns (stream User);  // server streaming
}
message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

Binary serialization, HTTP/2, code generation, streaming support. 10x smaller than JSON, 100x faster to serialize.

### Q667. What is DNS resolution step by step?

```
Browser → Local DNS Cache → OS DNS Cache → Router Cache
→ ISP Recursive Resolver → Root Name Server (.com, .org)
→ TLD Name Server (for .com)
→ Authoritative Name Server (returns IP)
→ Response cached at each level (TTL)
```

### Q668. What are HTTP caching headers?

```
Cache-Control: public, max-age=31536000     # CDN + browser cache for 1 year
Cache-Control: private, no-cache             # Must revalidate, no CDN
Cache-Control: no-store                      # Never cache

ETag: "abc123"                               # Version identifier
Last-Modified: Wed, 01 Jan 2024 00:00:00 GMT
Vary: Accept-Encoding, Authorization         # Cache varies by these headers
```

### Q669. What is MQTT protocol?

Lightweight publish-subscribe messaging protocol for IoT and mobile devices. Used for real-time driver location in ride-hailing apps.

```
Driver App → MQTT Broker → Topic: driver/123/location
                         → Subscribers: rider app, ops dashboard
```

QoS levels: 0 (at most once), 1 (at least once), 2 (exactly once).

### Q670. What are HTTP request methods and their properties?

| Method | Safe | Idempotent | Cacheable | Body |
|--------|------|-----------|----------|------|
| GET | Yes | Yes | Yes | No |
| POST | No | No | Rarely | Yes |
| PUT | No | Yes | No | Yes |
| PATCH | No | No | No | Yes |
| DELETE | No | Yes | No | Optional |
| HEAD | Yes | Yes | Yes | No |
| OPTIONS | Yes | Yes | No | No |

### Q671-Q690. Networking Quick-fire

**Q671. What is NAT (Network Address Translation)?**
Maps private IPs to public IPs. Allows multiple devices to share one public IP.

**Q672. What is a reverse proxy vs load balancer?**
Reverse proxy: single server frontend (SSL, caching, compression). Load balancer: distributes across multiple servers. Often combined (Nginx does both).

**Q673. What is OSI model?**
7 layers: Physical → Data Link → Network → Transport → Session → Presentation → Application. TCP/IP simplifies to 4: Link → Internet → Transport → Application.

**Q674. What is CORS preflight?**
Browser sends OPTIONS request before cross-origin requests with custom headers or non-simple methods. Server responds with allowed origins/methods/headers.

**Q675. What is a CDN edge server?**
Caches content at geographic locations near users. Reduces latency from ~200ms (cross-continent) to ~20ms (local edge).

**Q676. What is `traceroute`?**
```bash
traceroute google.com
# Shows each network hop between you and destination, with latency
```

**Q677. What is TCP congestion control?**
Algorithms (Cubic, BBR) that adjust sending rate to avoid network congestion. Slow start → congestion avoidance → fast recovery.

**Q678. What is a socket?**
Endpoint for communication: IP address + port number. Types: stream (TCP), datagram (UDP).

**Q679. What is SNI (Server Name Indication)?**
TLS extension that sends hostname during handshake, allowing multiple SSL sites on one IP address.

**Q680. What is HTTP/3 and QUIC?**
HTTP/3 runs over QUIC (UDP-based). Benefits: 0-RTT connection, no head-of-line blocking, built-in encryption, connection migration (survives IP changes).

**Q681. What is mTLS (mutual TLS)?**
Both client and server present certificates. Used in service meshes for zero-trust networking between microservices.

**Q682. What is a webhook retry strategy?**
Exponential backoff: 1min, 5min, 30min, 2hr, 24hr. Include HMAC signature for verification. Store delivery attempts. Dead letter after max retries.

**Q683. What is IP whitelisting vs API keys?**
IP whitelist: restrict by source IP (simple, inflexible). API keys: token-based (flexible, revocable, rate-limitable). Use both for critical systems.

**Q684. What is `ping` vs `telnet` vs `nc` (netcat)?**
```bash
ping server.com          # ICMP echo — is host reachable?
telnet server.com 5432   # TCP connection test to specific port
nc -zv server.com 5432   # Port scan, no connection
```

**Q685. What is BGP (Border Gateway Protocol)?**
Routes traffic between autonomous systems (ISPs, cloud providers). BGP misconfiguration can cause internet outages.

**Q686. What is a proxy server?**
Intermediary between client and server. Forward proxy: hides client identity. Reverse proxy: hides server identity. Transparent proxy: intercepting without client configuration.

**Q687. What is WebRTC?**
Peer-to-peer real-time communication (video, audio, data). Uses STUN/TURN servers for NAT traversal. No server relay needed for media.

**Q688. What is server push in HTTP/2?**
Server proactively sends resources it predicts the client will need (e.g., CSS when HTML is requested). Being deprecated in favor of Early Hints (103).

**Q689. What is a circuit breaker at the network level?**
When a downstream service is failing, stop sending requests (open circuit). Periodically test (half-open). Resume when healthy (closed).

**Q690. What is rate limiting at network layer vs application layer?**
Network: iptables, cloud WAF — blocks by IP/connection. Application: Redis counters — blocks by user/API key. Use both for defense in depth.

---

## Section 28: ElectronJS & Cross-Platform (Q691–Q710)

### Q691. What is Electron's architecture?

```
┌─────────────────────────────────────┐
│           Main Process              │
│  (Node.js — file system, OS APIs)   │
│         ↕ IPC (Inter-Process)       │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ Renderer 1   │  │ Renderer 2   │ │
│  │ (Chromium)   │  │ (Chromium)   │ │
│  │ HTML/CSS/JS  │  │ HTML/CSS/JS  │ │
│  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
```

Main process: creates windows, accesses OS. Renderer processes: web pages (sandboxed).

### Q692. How does IPC (Inter-Process Communication) work in Electron?

```js
// Main process
ipcMain.handle("read-file", async (event, path) => {
  return await fs.readFile(path, "utf-8");
});

// Renderer process (via preload script)
const content = await window.electronAPI.readFile("/path/to/file");

// preload.js (bridge)
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  readFile: (path) => ipcRenderer.invoke("read-file", path),
});
```

### Q693. What is `contextBridge` and why is it important?

```js
// ❌ Dangerous: exposes full Node.js to renderer
// webPreferences: { nodeIntegration: true }

// ✅ Safe: expose only specific APIs
contextBridge.exposeInMainWorld("api", {
  getVersion: () => process.versions.electron,
  saveFile: (data) => ipcRenderer.invoke("save-file", data),
  // Cannot expose: fs, child_process, etc.
});
```

### Q694-Q700. Electron Quick-fire

**Q694. How do you handle auto-updates in Electron?**
Use `electron-updater`: check for updates on startup, download in background, prompt user to restart. `autoUpdater.checkForUpdatesAndNotify()`.

**Q695. How do you handle deep linking in Electron?**
Register protocol handler: `app.setAsDefaultProtocolClient("myapp")`. Handle `myapp://path` URLs to open specific views.

**Q696. How do you optimize Electron app size?**
Use `electron-builder` with ASAR packaging, exclude dev dependencies, lazy-load heavy modules, use Electron Forge.

**Q697. What is Electron's `BrowserWindow` options?**
```js
const win = new BrowserWindow({
  width: 1200, height: 800,
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
});
```

**Q698. How do you persist data in Electron?**
`electron-store` (JSON file), SQLite (via `better-sqlite3`), IndexedDB (in renderer), or connect to a backend API.

**Q699. How do you handle notifications in Electron?**
```js
new Notification({ title: "New Message", body: "You have a new order" }).show();
// Or use web Notification API in renderer
```

**Q700. What are the security best practices for Electron?**
Disable `nodeIntegration`, enable `contextIsolation` and `sandbox`, use `contextBridge`, validate IPC inputs, load only HTTPS content, CSP headers.

### Q701-Q710. Cross-Platform

**Q701. What is Tauri and how does it compare to Electron?**
Tauri uses the OS's native webview (not Chromium), Rust backend. Much smaller bundle size (~600KB vs ~150MB). Trade-off: less consistent rendering across platforms.

**Q702. What is a PWA (Progressive Web App)?**
Web app with offline support, install-ability, push notifications. Uses service workers and manifest.json.

**Q703. What is a service worker lifecycle?**
Install → Activate → Fetch (intercept network requests). `self.addEventListener("fetch", (e) => e.respondWith(caches.match(e.request)))`.

**Q704. What is the Web App Manifest?**
```json
{
  "name": "Pathao Dashboard",
  "short_name": "Dashboard",
  "start_url": "/dashboard",
  "display": "standalone",
  "theme_color": "#2563eb",
  "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
}
```

**Q705. What is IndexedDB?**
Browser-side NoSQL database for offline data storage. Supports indexes, transactions, and large data. Used by PWAs.

**Q706. What is React Native architecture?**
JS thread (business logic) ↔ Bridge (JSON messages) ↔ Native thread (UI rendering). New Architecture (Fabric) eliminates the bridge with JSI for direct communication.

**Q707. What is Flutter's rendering approach?**
Flutter doesn't use native UI components. It has its own rendering engine (Skia/Impeller) that draws every pixel. Consistent look across platforms.

**Q708. What is Capacitor vs Cordova?**
Both wrap web apps in native container. Capacitor: modern, maintained by Ionic, better plugin ecosystem. Cordova: legacy, being phased out.

**Q709. What is Expo for React Native?**
Managed workflow with pre-configured build tooling, OTA updates, push notifications. Simplifies React Native development but limits native module access.

**Q710. What are web platform APIs for mobile-like features?**
Geolocation API, Vibration API, Notification API, Share API, Camera/Mic via `getUserMedia`, Bluetooth via Web Bluetooth, NFC via Web NFC.

---

## Section 29: Data Processing & Pipelines (Q711–Q740)

### Q711. How do you parse and validate large XLSX files in production?

```go
import "github.com/xuri/excelize/v2"

func processXLSX(filePath string) error {
    f, err := excelize.OpenFile(filePath)
    if err != nil { return fmt.Errorf("open: %w", err) }
    defer f.Close()

    rows, err := f.Rows("Sheet1")
    if err != nil { return err }

    var batch []Record
    lineNum := 0

    for rows.Next() {
        lineNum++
        cols, _ := rows.Columns()
        
        record, err := validateRow(cols, lineNum)
        if err != nil {
            errorReport = append(errorReport, RowError{Line: lineNum, Error: err})
            continue
        }

        batch = append(batch, record)
        if len(batch) >= 1000 {
            if err := bulkInsert(batch); err != nil { return err }
            batch = batch[:0]
        }
    }

    if len(batch) > 0 { return bulkInsert(batch) }
    return nil
}
```

### Q712. How do you handle CSV processing in Node.js?

```js
import { createReadStream } from "fs";
import { parse } from "csv-parse";

const parser = createReadStream("data.csv").pipe(
  parse({ columns: true, skip_empty_lines: true, trim: true })
);

let batch = [];
for await (const record of parser) {
  batch.push(transformRecord(record));
  if (batch.length >= 1000) {
    await insertBatch(batch);
    batch = [];
  }
}
if (batch.length) await insertBatch(batch);
```

### Q713. What is ETL (Extract, Transform, Load)?

```
Extract → Transform → Load

Example: Campaign analytics pipeline
1. Extract: Pull raw events from Kafka/BigQuery
2. Transform: Aggregate by campaign_id, calculate metrics
3. Load: Write to PostgreSQL materialized view / Redis cache

// Go worker
func etlPipeline(ctx context.Context) error {
    events, err := extractFromBigQuery(ctx, "SELECT * FROM events WHERE date = CURRENT_DATE")
    if err != nil { return err }

    metrics := transform(events) // group, aggregate, compute rates

    return loadToPostgres(ctx, metrics) // bulk upsert
}
```

### Q714. How does BigQuery work?

BigQuery is Google's serverless data warehouse. Column-oriented storage, massively parallel query execution.

```sql
-- Query petabytes in seconds
SELECT
  campaign_id,
  COUNT(*) as impressions,
  COUNTIF(clicked) as clicks,
  COUNTIF(converted) as conversions,
  SAFE_DIVIDE(COUNTIF(clicked), COUNT(*)) as ctr
FROM `project.dataset.events`
WHERE DATE(timestamp) BETWEEN '2024-01-01' AND '2024-03-31'
GROUP BY campaign_id
ORDER BY impressions DESC
LIMIT 100;
```

### Q715. What is stream processing vs batch processing?

**Batch**: process accumulated data periodically (hourly/daily). Use for: reports, ML training, data migration.

**Stream**: process data in real-time as it arrives. Use for: alerting, live dashboards, fraud detection.

```
Batch: Source → Store → Scheduled Job → Process → Output
Stream: Source → Kafka → Consumer (real-time) → Output
```

### Q716-Q720. Data Pipeline Quick-fire

**Q716. What is an idempotent consumer?**
Processing the same message twice produces the same result. Use: deduplication keys, upserts instead of inserts, versioned updates.

**Q717. What is backpressure in data pipelines?**
When consumers can't keep up with producers. Handle by: buffering (bounded), dropping (acceptable data loss), throttling producers.

**Q718. What is data partitioning in Kafka?**
Messages are distributed across partitions by key. Same key → same partition → ordered. More partitions → higher parallelism.

**Q719. What is exactly-once semantics?**
Guarantee each message is processed exactly once. Achieved via: idempotent producers, transactional consumers, atomic writes.

**Q720. What is a dead letter queue (DLQ) in data pipelines?**
Messages that fail processing after max retries are moved to a DLQ for manual inspection, debugging, and replay.

### Q721-Q740. More Data Topics

**Q721. What is data validation strategy for bulk uploads?**
1. Schema validation (column types, required fields)
2. Business rule validation (ranges, uniqueness, references)
3. Row-level error collection (don't stop on first error)
4. Generate error report with row numbers
5. Support partial imports (valid rows imported, errors reported)

**Q722. What is the fan-out pattern in data processing?**
One message triggers processing in multiple consumers. Example: order event → inventory service + notification service + analytics service.

**Q723. What is event replay?**
Re-process historical events from an event log (Kafka). Useful for: fixing bugs, building new read models, data migration.

**Q724. What is data deduplication?**
Prevent duplicate records from: retried API calls, message replay, concurrent submissions. Solutions: unique constraints, idempotency keys, content hashing.

**Q725. What is a data lake vs data lakehouse?**
Data lake: raw storage (S3). Lakehouse: combines lake flexibility with warehouse query performance (Delta Lake, Apache Iceberg).

**Q726. What is CDC (Change Data Capture)?**
Capture database changes as events. Tools: Debezium reads PostgreSQL WAL → publishes to Kafka → consumers react to changes.

**Q727. What is data masking/anonymization?**
```sql
-- Mask PII for analytics
SELECT
  md5(email) as email_hash,
  CONCAT(LEFT(phone, 3), '****', RIGHT(phone, 2)) as masked_phone,
  age_group,
  city
FROM users;
```

**Q728. What is a materialized view refresh strategy?**
Full refresh: rebuild entirely (simple, slow). Incremental: update only changed data (complex, fast). Concurrent: refresh without locking reads.

**Q729. What is time-series data handling?**
```sql
-- TimescaleDB (PostgreSQL extension) or ClickHouse
CREATE TABLE metrics (
  time TIMESTAMPTZ NOT NULL,
  device_id TEXT,
  value DOUBLE PRECISION
);
SELECT time_bucket('1 hour', time) AS hour, AVG(value)
FROM metrics GROUP BY hour ORDER BY hour;
```

**Q730. What is data reconciliation?**
Compare data between systems to find discrepancies. Run daily: compare source counts, checksums, and key records between databases/services.

**Q731. How do you handle file processing errors gracefully?**
```ts
interface ProcessingResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: { row: number; field: string; message: string }[];
}
```
Return structured error reports, support downloading error CSVs, allow re-upload of corrected files.

**Q732. What is Apache Kafka's architecture?**
Producers → Topics (partitioned, replicated) → Consumer Groups. Brokers store messages durably. Zookeeper (or KRaft) manages cluster state.

**Q733. What is Kafka Connect?**
Pre-built connectors to stream data between Kafka and external systems (PostgreSQL, S3, Elasticsearch) without custom code.

**Q734. What is schema registry?**
Central store for message schemas (Avro, Protobuf). Ensures producers and consumers agree on data format. Schema evolution rules prevent breaking changes.

**Q735. What is a data quality framework?**
Define expectations (not null, unique, within range), validate automatically, alert on failures, track quality metrics over time. Tools: Great Expectations, dbt tests.

**Q736. What is incremental data loading?**
Only process new or changed data since last run. Track with: timestamps (`WHERE updated_at > last_run`), change flags, CDC.

**Q737. What is a slowly changing dimension (SCD)?**
How to handle historical changes in dimension tables. Type 1: overwrite. Type 2: add new row with date range. Type 3: add columns for old/new values.

**Q738. What is data lineage?**
Track where data comes from, how it's transformed, and where it goes. Essential for debugging, compliance, and impact analysis.

**Q739. What is a DAG (Directed Acyclic Graph) in data pipelines?**
Tasks with dependencies: A → B → C, A → D. Tools like Airflow define pipelines as DAGs. No cycles allowed.

**Q740. What is real-time analytics architecture?**
```
Events → Kafka → Flink/Spark Streaming → ClickHouse/Druid → Dashboard (WebSocket)
         ↓
      S3 (raw) → Spark Batch → BigQuery → BI Reports
```

---

## Section 30: Advanced Algorithms & Problem Solving (Q741–Q780)

### Q741. Implement Dijkstra's shortest path algorithm.

```js
function dijkstra(graph, start) {
  const distances = {};
  const visited = new Set();
  const pq = new MinPriorityQueue();

  for (const node in graph) distances[node] = Infinity;
  distances[start] = 0;
  pq.enqueue(start, 0);

  while (!pq.isEmpty()) {
    const { element: current } = pq.dequeue();
    if (visited.has(current)) continue;
    visited.add(current);

    for (const [neighbor, weight] of graph[current]) {
      const newDist = distances[current] + weight;
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        pq.enqueue(neighbor, newDist);
      }
    }
  }
  return distances;
}
```

### Q742. Implement a rate limiter using sliding window.

```js
class SlidingWindowRateLimiter {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map(); // userId → timestamps[]
  }

  isAllowed(userId) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(userId)) this.requests.set(userId, []);
    const timestamps = this.requests.get(userId);

    // Remove expired
    while (timestamps.length && timestamps[0] < windowStart) timestamps.shift();

    if (timestamps.length >= this.maxRequests) return false;

    timestamps.push(now);
    return true;
  }
}
```

### Q743. Solve: Longest Increasing Subsequence.

```js
function lengthOfLIS(nums) {
  const tails = []; // tails[i] = smallest tail of IS of length i+1

  for (const num of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < num) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = num;
  }

  return tails.length; // O(n log n)
}
```

### Q744. Implement a Bloom Filter.

```js
class BloomFilter {
  constructor(size = 1000) {
    this.bits = new Uint8Array(size);
    this.size = size;
  }

  _hashes(value) {
    const str = String(value);
    const h1 = this._hash(str, 31);
    const h2 = this._hash(str, 37);
    const h3 = this._hash(str, 41);
    return [h1 % this.size, h2 % this.size, h3 % this.size];
  }

  _hash(str, seed) {
    let hash = 0;
    for (const ch of str) hash = (hash * seed + ch.charCodeAt(0)) >>> 0;
    return hash;
  }

  add(value) {
    for (const i of this._hashes(value)) this.bits[i] = 1;
  }

  mightContain(value) {
    return this._hashes(value).every(i => this.bits[i] === 1);
  }
}
```

### Q745. Solve: Serialize and deserialize a binary tree.

```js
function serialize(root) {
  if (!root) return "null";
  return `${root.val},${serialize(root.left)},${serialize(root.right)}`;
}

function deserialize(data) {
  const nodes = data.split(",");
  let idx = 0;

  function build() {
    if (nodes[idx] === "null") { idx++; return null; }
    const node = { val: parseInt(nodes[idx++]), left: null, right: null };
    node.left = build();
    node.right = build();
    return node;
  }

  return build();
}
```

### Q746. Implement a consistent hashing ring.

```js
class ConsistentHash {
  constructor(replicas = 150) {
    this.replicas = replicas;
    this.ring = new Map(); // hash → node
    this.sortedKeys = [];
  }

  _hash(key) {
    let hash = 0;
    for (const ch of key) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
    return Math.abs(hash);
  }

  addNode(node) {
    for (let i = 0; i < this.replicas; i++) {
      const hash = this._hash(`${node}:${i}`);
      this.ring.set(hash, node);
      this.sortedKeys.push(hash);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  getNode(key) {
    const hash = this._hash(key);
    for (const ringHash of this.sortedKeys) {
      if (hash <= ringHash) return this.ring.get(ringHash);
    }
    return this.ring.get(this.sortedKeys[0]); // wrap around
  }
}
```

### Q747. Solve: Merge K sorted lists.

```js
function mergeKLists(lists) {
  const heap = new MinHeap();

  for (let i = 0; i < lists.length; i++) {
    if (lists[i]) heap.push({ val: lists[i].val, node: lists[i] });
  }

  const dummy = { next: null };
  let current = dummy;

  while (heap.size > 0) {
    const { node } = heap.pop();
    current.next = node;
    current = current.next;
    if (node.next) heap.push({ val: node.next.val, node: node.next });
  }

  return dummy.next; // O(N log K)
}
```

### Q748. Implement Union-Find (Disjoint Set).

```js
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }

  find(x) {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]); // path compression
    return this.parent[x];
  }

  union(x, y) {
    const px = this.find(x), py = this.find(y);
    if (px === py) return false;
    if (this.rank[px] < this.rank[py]) this.parent[px] = py;
    else if (this.rank[px] > this.rank[py]) this.parent[py] = px;
    else { this.parent[py] = px; this.rank[px]++; }
    return true;
  }
}
```

### Q749. Solve: Minimum window substring.

```js
function minWindow(s, t) {
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);

  let have = 0, required = need.size;
  let left = 0, minLen = Infinity, minStart = 0;
  const window = new Map();

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    window.set(c, (window.get(c) || 0) + 1);
    if (need.has(c) && window.get(c) === need.get(c)) have++;

    while (have === required) {
      if (right - left + 1 < minLen) {
        minLen = right - left + 1;
        minStart = left;
      }
      const lc = s[left];
      window.set(lc, window.get(lc) - 1);
      if (need.has(lc) && window.get(lc) < need.get(lc)) have--;
      left++;
    }
  }

  return minLen === Infinity ? "" : s.substring(minStart, minStart + minLen);
}
```

### Q750. Solve: Number of islands (BFS/DFS on grid).

```js
function numIslands(grid) {
  let count = 0;
  const rows = grid.length, cols = grid[0].length;

  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] === "0") return;
    grid[r][c] = "0"; // mark visited
    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "1") { count++; dfs(r, c); }
    }
  }
  return count;
}
```

### Q751-Q760. Algorithm Quick-fire

**Q751. Implement quick sort.**
```js
function quickSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) return arr;
  const pivot = arr[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) { [arr[i], arr[j]] = [arr[j], arr[i]]; i++; }
  }
  [arr[i], arr[hi]] = [arr[hi], arr[i]];
  quickSort(arr, lo, i - 1);
  quickSort(arr, i + 1, hi);
  return arr;
}
```

**Q752. Solve: Valid Sudoku.**
```js
function isValidSudoku(board) {
  const seen = new Set();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val === ".") continue;
      const row = `r${r}:${val}`, col = `c${c}:${val}`;
      const box = `b${Math.floor(r/3)},${Math.floor(c/3)}:${val}`;
      if (seen.has(row) || seen.has(col) || seen.has(box)) return false;
      seen.add(row); seen.add(col); seen.add(box);
    }
  }
  return true;
}
```

**Q753. What is dynamic programming?**
Break a problem into overlapping subproblems, store results to avoid recomputation. Two approaches: top-down (memoization) and bottom-up (tabulation).

**Q754. Solve: Coin change (minimum coins).**
```js
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i) dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

**Q755. What is a sliding window technique?**
Maintain a window of elements and slide it across data. Used for: max sum subarray of size k, longest substring without repeating characters.

**Q756. Solve: Group anagrams.**
```js
function groupAnagrams(strs) {
  const map = new Map();
  for (const s of strs) {
    const key = [...s].sort().join("");
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return [...map.values()];
}
```

**Q757. What is backtracking?**
Try all possibilities, abandon ("backtrack") when a partial solution violates constraints. Used for: N-Queens, Sudoku solver, permutations.

**Q758. Solve: Implement a trie with wildcard search.**
```js
search(word, node = this.root, i = 0) {
  if (i === word.length) return node.isEnd;
  if (word[i] === ".") {
    return Object.values(node.children).some(child => this.search(word, child, i + 1));
  }
  if (!node.children[word[i]]) return false;
  return this.search(word, node.children[word[i]], i + 1);
}
```

**Q759. What is a monotonic stack?**
Stack that maintains elements in increasing or decreasing order. Used for: next greater element, largest rectangle in histogram.

**Q760. Solve: Maximum profit from stock (one transaction).**
```js
function maxProfit(prices) {
  let minPrice = Infinity, maxProfit = 0;
  for (const price of prices) {
    minPrice = Math.min(minPrice, price);
    maxProfit = Math.max(maxProfit, price - minPrice);
  }
  return maxProfit;
}
```

### Q761-Q780. More Algorithms

**Q761. Solve: Clone a graph.**
```js
function cloneGraph(node, visited = new Map()) {
  if (!node) return null;
  if (visited.has(node)) return visited.get(node);
  const clone = { val: node.val, neighbors: [] };
  visited.set(node, clone);
  clone.neighbors = node.neighbors.map(n => cloneGraph(n, visited));
  return clone;
}
```

**Q762. What is A* pathfinding?**
Like Dijkstra but with a heuristic (estimated distance to goal). `f(n) = g(n) + h(n)`. More efficient for point-to-point shortest path.

**Q763. Solve: Rotated sorted array search.**
```js
function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (target >= nums[lo] && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (target > nums[mid] && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}
```

**Q764. What is a segment tree?**
Tree for range queries (sum, min, max) with O(log n) updates. Used when array values change frequently and you need range aggregations.

**Q765. Solve: Trapping rain water.**
```js
function trap(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left++];
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right--];
    }
  }
  return water;
}
```

**Q766. What is memoization vs tabulation?**
Memoization: top-down, recursive, lazy (only computes needed subproblems). Tabulation: bottom-up, iterative, eager (computes all subproblems).

**Q767. Solve: Word break problem.**
```js
function wordBreak(s, wordDict) {
  const words = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.substring(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[s.length];
}
```

**Q768. What is bit manipulation?**
```js
n & 1        // Check if odd
n >> 1       // Divide by 2
n << 1       // Multiply by 2
n & (n - 1)  // Remove lowest set bit
n ^ n        // Always 0 (find single number: XOR all elements)
```

**Q769. Solve: LRU Cache with O(1) operations (doubly linked list + hash map).**
Production LRU uses a doubly linked list for O(1) remove/add-to-head, and a hash map for O(1) key lookup.

**Q770. What is Rabin-Karp string matching?**
Rolling hash for substring matching. Compute hash of pattern and rolling hash of each window in text. O(n+m) average case.

**Q771. Solve: Median of two sorted arrays (O(log(min(m,n)))).**
Binary search on the shorter array to find the partition point where left halves ≤ right halves.

**Q772. What is the KMP algorithm?**
Knuth-Morris-Pratt string matching. Precomputes a failure function to skip unnecessary comparisons. O(n+m) worst case.

**Q773. Solve: Longest common subsequence.**
```js
function lcs(s1, s2) {
  const dp = Array.from({ length: s1.length + 1 }, () => new Array(s2.length + 1).fill(0));
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      dp[i][j] = s1[i-1] === s2[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[s1.length][s2.length];
}
```

**Q774. What is a graph represented as adjacency list vs matrix?**
List: `{ A: ["B","C"], B: ["A"] }` — space O(V+E), good for sparse graphs. Matrix: 2D array — space O(V²), good for dense graphs and edge-existence checks.

**Q775. Solve: Course schedule (cycle detection in DAG).**
```js
function canFinish(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { graph[b].push(a); inDegree[a]++; }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (inDegree[i] === 0) queue.push(i);
  let count = 0;
  while (queue.length) {
    const node = queue.shift();
    count++;
    for (const next of graph[node]) {
      if (--inDegree[next] === 0) queue.push(next);
    }
  }
  return count === numCourses;
}
```

**Q776. What is Floyd-Warshall algorithm?**
All-pairs shortest path. O(V³). Good for small dense graphs.

**Q777. What is Bellman-Ford algorithm?**
Single-source shortest path that handles negative edges. O(V·E). Detects negative cycles.

**Q778. Solve: Implement a skip list.**
Probabilistic data structure with O(log n) search, insert, delete. Uses multiple linked list levels with random promotion.

**Q779. What is the traveling salesman problem?**
Find the shortest route visiting all cities exactly once. NP-hard. Exact: O(n!). DP: O(n²·2ⁿ). Practical: approximation algorithms, heuristics.

**Q780. Solve: Find median from data stream.**
```js
class MedianFinder {
  constructor() {
    this.maxHeap = new MaxHeap(); // left half
    this.minHeap = new MinHeap(); // right half
  }
  addNum(num) {
    this.maxHeap.push(num);
    this.minHeap.push(this.maxHeap.pop());
    if (this.minHeap.size > this.maxHeap.size) {
      this.maxHeap.push(this.minHeap.pop());
    }
  }
  findMedian() {
    if (this.maxHeap.size > this.minHeap.size) return this.maxHeap.peek();
    return (this.maxHeap.peek() + this.minHeap.peek()) / 2;
  }
}
```

---

## Section 31: Accessibility & Internationalization (Q781–Q800)

### Q781. What are ARIA roles and when to use them?

```html
<!-- Use semantic HTML first — ARIA is a fallback -->
<nav aria-label="Main navigation">
  <button aria-expanded="false" aria-controls="menu">Menu</button>
  <ul id="menu" role="menu" hidden>
    <li role="menuitem"><a href="/home">Home</a></li>
  </ul>
</nav>

<div role="alert" aria-live="assertive">Form submitted successfully!</div>

<!-- Custom component needing ARIA -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel1">Tab 1</button>
</div>
<div role="tabpanel" id="panel1">Content</div>
```

### Q782. How do you handle keyboard navigation?

```tsx
function Dropdown({ items }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (activeIndex >= 0) selectItem(items[activeIndex]);
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div role="listbox" tabIndex={0} onKeyDown={handleKeyDown}>
      {items.map((item, i) => (
        <div role="option" aria-selected={i === activeIndex} key={item.id}>
          {item.label}
        </div>
      ))}
    </div>
  );
}
```

### Q783. What is focus management in SPAs?

After route changes, programmatically move focus to the main content or heading. Otherwise screen readers stay at the top.

```tsx
function RouteAnnouncer() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [pathname]);

  return <div ref={ref} tabIndex={-1} aria-live="polite" className="sr-only" />;
}
```

### Q784. What is WCAG compliance levels?

**A**: minimum (alt text, keyboard access, captions).
**AA**: standard target (color contrast 4.5:1, resize to 200%, consistent navigation).
**AAA**: enhanced (contrast 7:1, sign language, no timing).

### Q785-Q790. Accessibility Quick-fire

**Q785. What is a skip link?**
```html
<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>
```

**Q786. What is `aria-live`?**
Announces dynamic content changes to screen readers. `polite` waits for user idle; `assertive` interrupts immediately.

**Q787. How do you test accessibility?**
axe-core (automated), Lighthouse, screen reader testing (VoiceOver, NVDA), keyboard-only navigation, color contrast checkers.

**Q788. What is the `prefers-color-scheme` media query?**
```css
@media (prefers-color-scheme: dark) { body { background: #000; color: #fff; } }
```

**Q789. What is `sr-only` class?**
```css
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); border: 0;
}
/* Visually hidden but readable by screen readers */
```

**Q790. What is semantic HTML and why does it matter?**
Use `<nav>`, `<main>`, `<article>`, `<aside>`, `<header>`, `<footer>` instead of `<div>`. Provides meaning to assistive technologies, improves SEO.

### Q791-Q800. Internationalization

**Q791. What is i18n vs l10n?**
**i18n** (internationalization): designing software to support multiple languages. **l10n** (localization): adapting for specific locale (translating content, formatting dates/numbers).

**Q792. How do you handle RTL (Right-to-Left) languages?**
```html
<html dir="auto" lang="ar">
```
Use CSS logical properties (`margin-inline-start` not `margin-left`), test with Arabic/Hebrew, mirror layouts.

**Q793. How do you handle date/time across timezones?**
Store in UTC, display in user's timezone. Use `Intl.DateTimeFormat` or libraries like `date-fns-tz`.
```ts
new Intl.DateTimeFormat("bn-BD", { timeZone: "Asia/Dhaka", dateStyle: "full" }).format(date);
```

**Q794. What is Unicode and UTF-8?**
Unicode assigns numbers to every character. UTF-8 encodes those numbers as 1-4 bytes. ASCII is a subset. Bengali requires 3 bytes per character in UTF-8.

**Q795. How do you handle pluralization?**
```ts
const rtf = new Intl.PluralRules("en");
rtf.select(0); // "other" → "0 items"
rtf.select(1); // "one"   → "1 item"
rtf.select(5); // "other" → "5 items"
```

**Q796. What is ICU message format?**
```
{count, plural,
  =0 {No messages}
  one {# message}
  other {# messages}
}
```

**Q797. How do you handle currency formatting?**
```ts
new Intl.NumberFormat("bn-BD", { style: "currency", currency: "BDT" }).format(1500);
// "১,৫০০.০০৳"
```

**Q798. What is locale-aware sorting?**
```ts
const collator = new Intl.Collator("bn", { sensitivity: "base" });
names.sort(collator.compare); // Sorts Bengali text correctly
```

**Q799. How do you handle phone number formatting?**
Use `libphonenumber-js`:
```ts
parsePhoneNumber("+8801760725654", "BD").formatInternational();
// "+880 1760-725654"
```

**Q800. What is content negotiation for i18n?**
```
Accept-Language: bn-BD, en;q=0.9
```
Server responds with Bengali content if available, falls back to English.

---

## Section 32: Regex & Text Processing (Q801–Q815)

### Q801. Essential regex patterns for developers.

```js
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phone = /^\+?[1-9]\d{1,14}$/;          // E.164 format
const url = /^https?:\/\/.+/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
```

### Q802. What are regex groups and backreferences?

```js
// Named groups
const dateRegex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = "2024-03-15".match(dateRegex);
console.log(match.groups.year); // "2024"

// Backreference — match repeated words
const duplicates = /\b(\w+)\s+\1\b/gi;
"the the quick brown fox fox".match(duplicates); // ["the the", "fox fox"]

// Lookahead / Lookbehind
const password = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$]).{8,}$/;
// Requires: uppercase, digit, special char, min 8 chars
```

### Q803. What are regex flags?

```js
/pattern/g    // global — find all matches
/pattern/i    // case-insensitive
/pattern/m    // multiline — ^ and $ match line boundaries
/pattern/s    // dotAll — . matches newlines
/pattern/u    // unicode — proper Unicode support
/pattern/d    // indices — include match positions
```

### Q804-Q815. Regex Quick-fire

**Q804.** Replace template variables: `"Hello {{name}}, you have {{count}} messages".replace(/\{\{(\w+)\}\}/g, (_, key) => data[key])`

**Q805.** Extract numbers: `"price: $42.99, qty: 3".match(/\d+\.?\d*/g)` → `["42.99", "3"]`

**Q806.** Validate password strength: check length, uppercase, lowercase, digit, special character with lookaheads.

**Q807.** Strip HTML tags: `html.replace(/<[^>]*>/g, "")` — basic; use a proper parser for production.

**Q808.** Match balanced parentheses: not possible with standard regex — use a stack-based parser.

**Q809.** `\b` matches word boundary (between `\w` and `\W`). Useful for whole-word matching: `/\bword\b/`.

**Q810.** Lazy vs greedy: `.*?` (lazy, shortest match) vs `.*` (greedy, longest match).

**Q811.** Match markdown links: `/\[([^\]]+)\]\(([^)]+)\)/g` extracts text and URL.

**Q812.** `String.prototype.matchAll` returns an iterator of all matches with groups.

**Q813.** Validate JSON key: `/^[a-zA-Z_][a-zA-Z0-9_]*$/`

**Q814.** Split camelCase: `"camelCaseToWords".replace(/([A-Z])/g, " $1").trim()`

**Q815.** Named capture groups with `replaceAll`: `"2024-03-15".replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/, "$<d>/$<m>/$<y>")` → `"15/03/2024"`

---

## Section 33: Search & Elasticsearch (Q816–Q835)

### Q816. What is Elasticsearch and when to use it?

Full-text search engine built on Apache Lucene. Use for: product search, log aggregation, analytics, autocomplete. Not a primary database — use alongside PostgreSQL.

### Q817. Basic Elasticsearch operations.

```json
// Index a document
PUT /users/_doc/1
{ "name": "Sourav Ahmed", "city": "Dhaka", "skills": ["Go", "TypeScript"] }

// Search
GET /users/_search
{
  "query": {
    "bool": {
      "must": [{ "match": { "name": "Sourav" } }],
      "filter": [{ "term": { "city": "dhaka" } }]
    }
  },
  "sort": [{ "_score": "desc" }],
  "size": 10
}
```

### Q818. What is an inverted index?

```
Document 1: "the quick brown fox"
Document 2: "the lazy brown dog"

Inverted index:
"the"   → [1, 2]
"quick" → [1]
"brown" → [1, 2]
"fox"   → [1]
"lazy"  → [2]
"dog"   → [2]
```

Maps terms to document IDs — enables fast full-text search.

### Q819. What are Elasticsearch analyzers?

```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "bengali_analyzer": {
          "type": "custom",
          "tokenizer": "icu_tokenizer",
          "filter": ["lowercase", "bengali_stop", "bengali_stemmer"]
        }
      }
    }
  }
}
```

Analyzers process text: character filters → tokenizer → token filters. Standard analyzer: lowercase + word tokenization.

### Q820-Q835. Search Quick-fire

**Q820. What is relevance scoring (TF-IDF, BM25)?**
BM25 (default): considers term frequency, inverse document frequency, and field length. Higher score = more relevant.

**Q821. What is a mapping in Elasticsearch?**
Schema definition for fields: types (text, keyword, integer, date), analyzers, whether to index.

**Q822. What is fuzzy search?**
Matches similar terms (handles typos). `"query": {"fuzzy": {"name": {"value": "sourav", "fuzziness": 2}}}`.

**Q823. What is an Elasticsearch aggregation?**
```json
{ "aggs": { "by_city": { "terms": { "field": "city.keyword" } } } }
```
Like SQL GROUP BY — used for analytics, faceted search.

**Q824. What is Elasticsearch index lifecycle management (ILM)?**
Automatically manage index lifecycle: hot (write+read) → warm (read-only) → cold (infrequent access) → delete.

**Q825. What is a search template?**
Reusable parameterized queries stored in Elasticsearch. Separates query logic from application code.

**Q826. What is Elasticsearch percolator?**
Reverse search: store queries, then match incoming documents against them. Used for: alerts, saved searches.

**Q827. What is vector search in Elasticsearch?**
Store embeddings, find similar vectors with `knn` search. Used for semantic search, recommendations.

**Q828. What is Elasticsearch reindexing strategy?**
Create new index with updated mapping → `_reindex` API copies data → swap alias to new index → delete old index. Zero downtime.

**Q829. What is multi-field mapping?**
```json
{ "name": { "type": "text", "fields": { "keyword": { "type": "keyword" } } } }
```
Same field indexed multiple ways: `name` for full-text search, `name.keyword` for exact match/sorting.

**Q830. What is Elasticsearch snapshot and restore?**
Backup indices to S3/GCS. `PUT /_snapshot/repo/snap1`. Restore specific indices after data loss.

**Q831. What is search-as-you-type?**
```json
{ "name": { "type": "search_as_you_type" } }
```
Auto-generates n-gram subfields for instant autocomplete.

**Q832. What is highlight in Elasticsearch?**
Returns matching terms wrapped in tags for displaying in search results with highlighted keywords.

**Q833. What is Elasticsearch cluster health?**
Green: all shards allocated. Yellow: primary OK, replicas not allocated. Red: some primaries not allocated.

**Q834. What is a shard and replica?**
Shard: horizontal partition of an index. Replica: copy of a shard for fault tolerance and read throughput.

**Q835. When NOT to use Elasticsearch?**
Primary datastore (no transactions), small datasets (PostgreSQL full-text is simpler), frequent updates (expensive re-indexing), strict consistency requirements.

---

## Section 34: Browser Internals & Web APIs (Q836–Q860)

### Q836. How does the browser render a page?

```
1. Parse HTML → DOM tree
2. Parse CSS → CSSOM tree
3. Combine → Render tree (visible elements only)
4. Layout — calculate positions and sizes
5. Paint — draw pixels (layers)
6. Composite — combine layers on GPU
```

### Q837. What is the browser's same-origin policy?

Two URLs have the same origin if they share the same protocol, host, and port. Cross-origin requests are blocked unless CORS headers allow them.

### Q838. What is the Performance API?

```js
// Measure custom timing
performance.mark("api-start");
await fetchData();
performance.mark("api-end");
performance.measure("api-call", "api-start", "api-end");

const measure = performance.getEntriesByName("api-call")[0];
console.log(`API took ${measure.duration}ms`);

// Navigation timing
const nav = performance.getEntriesByType("navigation")[0];
console.log(`DOM interactive: ${nav.domInteractive}ms`);
console.log(`First byte: ${nav.responseStart - nav.requestStart}ms`);
```

### Q839. What is `requestIdleCallback`?

```js
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    processTask(tasks.pop());
  }
  if (tasks.length > 0) requestIdleCallback(processNext);
});
```

Runs callback during browser idle periods — perfect for non-urgent work (analytics, preloading).

### Q840. What is the `Intersection Observer` API?

```js
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.src = entry.target.dataset.src; // Lazy load
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "100px" }
);

document.querySelectorAll("img[data-src]").forEach(img => observer.observe(img));
```

### Q841-Q860. Browser/Web API Quick-fire

**Q841. What is the Resize Observer?**
```js
const observer = new ResizeObserver(entries => {
  entries.forEach(e => console.log(e.contentRect.width, e.contentRect.height));
});
observer.observe(element);
```

**Q842. What is the Mutation Observer?**
Watches DOM changes: child additions/removals, attribute changes, text content changes.

**Q843. What is the Broadcast Channel API?**
```js
const channel = new BroadcastChannel("auth");
channel.postMessage({ type: "logout" }); // All tabs receive this
```

**Q844. What is the `navigator.sendBeacon`?**
```js
window.addEventListener("unload", () => {
  navigator.sendBeacon("/analytics", JSON.stringify(data));
  // Guaranteed to send even during page unload
});
```

**Q845. What is the Web Crypto API?**
```js
const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
```

**Q846. What is the `structuredClone` browser support?**
All modern browsers. Deep clones including Date, Map, Set, ArrayBuffer, Error, RegExp.

**Q847. What is `document.startViewTransition`?**
Smooth animated transitions between DOM states (page navigation, element changes).

**Q848. What is the File System Access API?**
```js
const handle = await window.showOpenFilePicker();
const file = await handle[0].getFile();
```

**Q849. What is the `Clipboard` API?**
```js
await navigator.clipboard.writeText("Copied!");
const text = await navigator.clipboard.readText();
```

**Q850. What is `PerformanceObserver`?**
```js
new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => console.log(entry.name, entry.duration));
}).observe({ type: "measure" });
```

**Q851. What is `scheduler.postTask`?**
Priority-based task scheduling: `"user-blocking"`, `"user-visible"`, `"background"`.

**Q852. What is the `Paint` API (Houdini)?**
Custom CSS painting with JavaScript. Define paint worklets for complex backgrounds, borders.

**Q853. What is the `CompressionStream` API?**
```js
const compressed = blob.stream().pipeThrough(new CompressionStream("gzip"));
```

**Q854. What is memory pressure detection?**
```js
navigator.deviceMemory;        // RAM in GB (approximate)
navigator.hardwareConcurrency; // CPU cores
// Adapt: serve lower-res images, reduce animations on low-end devices
```

**Q855. What is the `Navigation` API?**
Modern replacement for `popstate`/`hashchange`. `navigation.addEventListener("navigate", (e) => { ... })`.

**Q856. What is WASM (WebAssembly)?**
Binary instruction format for near-native performance in browsers. Compile C/C++/Rust to WASM. Use for: image processing, games, crypto, scientific computing.

**Q857. What is `import maps`?**
```html
<script type="importmap">
{ "imports": { "lodash": "https://cdn.skypack.dev/lodash" } }
</script>
<script type="module">
import _ from "lodash";
</script>
```

**Q858. What is the `Trusted Types` API?**
Prevent DOM XSS by requiring trusted types for dangerous sinks (`innerHTML`, `eval`).

**Q859. What is the `Storage` API quotas?**
```js
const estimate = await navigator.storage.estimate();
console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
```

**Q860. What is speculative loading (`<script type="speculationrules">`)?**
```html
<script type="speculationrules">
{ "prerender": [{ "where": { "href_matches": "/product/*" } }] }
</script>
```

---

## Section 35: AI/ML & LLM Integration (Q861–Q900)

### Q861. How do you build an LLM-powered feature for production?

```ts
async function aiSummarize(document: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: `Summarize:\n${document}` }],
    }),
  });

  const data = await response.json();
  return data.content[0].text;
}
```

Production concerns: rate limiting, caching identical prompts, timeout handling, fallback models, cost monitoring, output validation.

### Q862. What is prompt engineering?

```ts
// Bad prompt
"Tell me about the data"

// Good prompt — specific, structured, constrained
const prompt = `Analyze the following campaign data and provide:
1. Top 3 performing campaigns by CTR
2. Campaigns with below-average conversion rates
3. Actionable recommendations

Data: ${JSON.stringify(campaignData)}

Respond in JSON format:
{ "top_campaigns": [...], "underperforming": [...], "recommendations": [...] }`;
```

### Q863. How do you handle structured output from LLMs?

```ts
import { z } from "zod";

const ResponseSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  score: z.number().min(0).max(1),
  summary: z.string().max(200),
  topics: z.array(z.string()),
});

async function analyzeFeedback(text: string) {
  const response = await callLLM(`Analyze this feedback and return JSON:
    ${text}
    Schema: { sentiment, score (0-1), summary, topics[] }`);

  const parsed = ResponseSchema.safeParse(JSON.parse(response));
  if (!parsed.success) throw new Error("Invalid LLM response");
  return parsed.data;
}
```

### Q864. What is function calling / tool use with LLMs?

```ts
const tools = [{
  name: "get_campaign_stats",
  description: "Get performance stats for a marketing campaign",
  input_schema: {
    type: "object",
    properties: {
      campaign_id: { type: "string" },
      date_range: { type: "string", enum: ["7d", "30d", "90d"] },
    },
    required: ["campaign_id"],
  },
}];

// LLM decides when to call tools based on user query
// "How did summer-sale campaign perform last month?"
// → LLM calls get_campaign_stats({ campaign_id: "summer-sale", date_range: "30d" })
```

### Q865. What is RAG (Retrieval-Augmented Generation) architecture?

```
1. Ingest: Documents → Chunk (512 tokens) → Embed (text-embedding model) → Store in vector DB
2. Query: User question → Embed → Vector search → Top-K chunks → Inject into prompt → LLM generates answer

Vector DBs: Pinecone, Weaviate, pgvector, Qdrant
```

### Q866. What is vector similarity search?

```sql
-- pgvector (PostgreSQL extension)
CREATE EXTENSION vector;

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1536)  -- OpenAI embedding dimension
);

CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);

-- Find similar documents
SELECT content, 1 - (embedding <=> $1::vector) AS similarity
FROM documents
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

### Q867. How do you implement AI guardrails?

```ts
// Input guardrails
function sanitizeInput(input: string): string {
  // Remove prompt injection attempts
  const cleaned = input.replace(/ignore (previous|all) instructions/gi, "");
  // Limit length
  return cleaned.slice(0, 4000);
}

// Output guardrails
async function safeGenerate(prompt: string) {
  const response = await llm.generate(prompt);

  // Content filtering
  if (containsPII(response)) return "[Response filtered: contains PII]";
  if (containsHarmful(response)) return "[Response filtered]";

  // Schema validation
  const validated = schema.safeParse(response);
  if (!validated.success) return fallbackResponse;

  return validated.data;
}
```

### Q868. What is fine-tuning vs few-shot prompting vs RAG?

**Few-shot**: include examples in prompt. Best for format/style tasks.
**RAG**: retrieve relevant context at query time. Best for knowledge-intensive tasks.
**Fine-tuning**: train on custom data. Best for specialized domains, consistent style.

Cost: few-shot < RAG < fine-tuning. Flexibility: RAG > fine-tuning > few-shot.

### Q869. How do you evaluate LLM outputs?

```ts
// Automated evaluation
async function evaluateResponse(question: string, response: string, groundTruth: string) {
  return {
    relevance: await llmJudge(question, response, "Is this relevant? Score 1-5"),
    accuracy: cosineSimilarity(embed(response), embed(groundTruth)),
    coherence: await llmJudge(question, response, "Is this coherent? Score 1-5"),
    hallucination: await checkFactsAgainstSources(response, sources),
  };
}

// A/B testing in production
// Route 10% of traffic to new prompt version
// Compare: user satisfaction, task completion rate, response time
```

### Q870. What is streaming LLM responses?

```ts
async function* streamResponse(prompt: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ prompt, stream: true }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}

// React component
function ChatMessage() {
  const [text, setText] = useState("");
  useEffect(() => {
    (async () => {
      for await (const chunk of streamResponse(prompt)) {
        setText(prev => prev + chunk);
      }
    })();
  }, [prompt]);
}
```

### Q871-Q900. AI/ML Quick-fire

**Q871. What is embedding?**
Converting text/images to dense vectors where similar items are close together in vector space. Used for: semantic search, recommendations, clustering.

**Q872. What is cosine similarity?**
```js
function cosineSim(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB); // -1 to 1 (1 = identical)
}
```

**Q873. What is chunking in RAG?**
Split documents into overlapping chunks (e.g., 512 tokens with 50-token overlap). Strategies: fixed size, sentence boundary, semantic (paragraph/section).

**Q874. What is a temperature parameter?**
Controls randomness. 0 = deterministic (best for code, facts). 1 = creative (best for brainstorming). Higher = more random.

**Q875. What is token count and context window?**
Token ≈ ¾ of a word. Models have max context (e.g., 200K tokens). Prompt + response must fit within the window.

**Q876. What is an AI agent?**
LLM that can plan, use tools, and iterate. Loop: observe → think → act → observe result → repeat until done.

**Q877. What is prompt caching?**
Cache LLM responses for identical prompts. Hash the prompt, store result with TTL. Reduces cost and latency.

**Q878. What is model quantization?**
Reduce model precision (FP32 → INT8) for faster inference and smaller size. Trade-off: slight accuracy loss.

**Q879. What is RLHF (Reinforcement Learning from Human Feedback)?**
Train LLMs to align with human preferences by having humans rank outputs, then training a reward model.

**Q880. What is a token budget?**
Set max tokens per request/user. Monitor: `cost = input_tokens × input_price + output_tokens × output_price`.

**Q881. What is multimodal AI?**
Models that process text, images, audio, and video. Example: analyzing a product image and generating descriptions.

**Q882. What is semantic search vs keyword search?**
Keyword: exact/fuzzy term matching. Semantic: understands meaning (e.g., "cheap flights" matches "budget airlines").

**Q883. What is hallucination in LLMs?**
Model generates plausible but incorrect information. Mitigate: RAG (ground in facts), structured output validation, source citation.

**Q884. How do you handle LLM rate limits?**
Queue requests, implement exponential backoff, use multiple API keys, cache responses, batch where possible.

**Q885. What is chain-of-thought prompting?**
Ask the model to think step by step. Improves accuracy on reasoning tasks.

**Q886. What is a system prompt?**
Initial instruction that sets the model's behavior, persona, and constraints for the entire conversation.

**Q887. What is tool/function calling architecture?**
LLM outputs structured tool call → app executes function → result fed back to LLM → LLM formulates final response.

**Q888. What is model distillation?**
Train a smaller model to mimic a larger one. Smaller model is faster and cheaper while retaining most capability.

**Q889. What is A/B testing for AI features?**
Compare model versions, prompt strategies, or temperature settings. Measure: task completion, user satisfaction, cost per query.

**Q890. What is responsible AI?**
Fairness (no bias), transparency (explainability), privacy (no data leakage), safety (harmful content prevention), accountability.

**Q891. What is an embedding database (vector store)?**
Specialized database for storing and querying high-dimensional vectors. Supports approximate nearest neighbor (ANN) search.

**Q892. What is LLM observability?**
Log: prompts, responses, latency, tokens, costs, errors. Trace multi-step agent workflows. Alert on quality degradation.

**Q893. What is context window management?**
When conversation exceeds context limit: summarize earlier messages, use sliding window, or retrieve relevant history from vector store.

**Q894. What is batch processing with LLMs?**
Send multiple prompts in parallel or as a batch. Reduces per-request overhead. Some APIs offer batch endpoints with lower pricing.

**Q895. What is model routing?**
Route queries to different models based on complexity. Simple queries → fast/cheap model. Complex → powerful model.

**Q896. What is AI-assisted code review?**
LLM analyzes diffs for: bugs, security issues, style violations, performance concerns. Not a replacement for human review.

**Q897. What is synthetic data generation?**
Use LLMs to generate realistic training data, test data, or sample content. Validate quality against real data distributions.

**Q898. What is Constitutional AI?**
Training approach where the model self-critiques and revises responses based on a set of principles (constitution).

**Q899. What is multi-turn conversation handling?**
Send full conversation history with each request. Manage context window by summarizing old messages. Track conversation state.

**Q900. How do you integrate AI into developer workflows?**
Code completion, automated testing, documentation generation, bug detection, code review, refactoring suggestions, natural language to SQL.

---

## Section 36: Behavioral & Career (Q901–Q950)

### Q901-Q950. Deep Behavioral Questions

**Q901. Tell me about a time you shipped a feature under tight deadlines.**
Use STAR: Situation (deadline/context), Task (what was needed), Action (what you did), Result (outcome + metrics).

**Q902. How do you prioritize when everything is urgent?**
Assess impact vs effort, communicate trade-offs to stakeholders, focus on unblocking others first, negotiate deadlines where possible.

**Q903. Describe a production outage you handled.**
Structure: how detected → triage steps → mitigation → root cause → fix → post-mortem → prevention measures.

**Q904. How do you handle working with legacy code?**
Write tests first (characterization tests), understand before changing, refactor incrementally, strangler fig for large systems.

**Q905. Tell me about a time you disagreed with your manager.**
Show: respect, data-driven argument, willingness to commit to the decision once made.

**Q906. How do you onboard to a new codebase?**
Read docs → run the app → trace a request end-to-end → read tests → make a small fix → ask questions → contribute.

**Q907. What's your approach to code reviews?**
Focus on: correctness, readability, edge cases, security. Be constructive. Approve with minor comments. Don't block on style preferences.

**Q908. How do you handle imposter syndrome?**
Acknowledge it's common, track accomplishments, seek feedback, compare yourself to past self (not others), teach others.

**Q909. Describe your ideal team culture.**
Psychological safety, ownership, constructive feedback, knowledge sharing, celebrating wins, blameless post-mortems.

**Q910. How do you manage technical debt at Pathao?**
Document it, quantify impact, allocate 20% time, propose during sprint planning, tie to business outcomes.

**Q911-Q920. More Behavioral**

**Q911.** How did you deliver the Year End Wrap without app updates? (Technical creativity under constraints)
**Q912.** Describe building the Dashboard Foundation. What were the key architectural decisions?
**Q913.** How did you handle cross-platform compatibility issues (iOS/Android)?
**Q914.** How do you ensure quality when moving fast?
**Q915.** Describe a time you had to learn a new technology quickly (Go at Pathao?).
**Q916.** How do you balance feature development with tech debt?
**Q917.** Tell me about your Flash VSCode extension — what motivated it?
**Q918.** How do you communicate technical decisions to non-technical stakeholders?
**Q919.** Describe your experience with the BdApps hackathon — what did you build?
**Q920.** How do you handle ambiguous requirements?

**Q921-Q930. Leadership & Growth**

**Q921.** How have you mentored teammates?
**Q922.** What's the biggest technical mistake you've made and what did you learn?
**Q923.** How do you decide between building vs buying?
**Q924.** Describe a time you improved a process (not just code).
**Q925.** How do you stay motivated on repetitive tasks?
**Q926.** What's your approach to documentation?
**Q927.** How do you handle context switching between projects?
**Q928.** Describe your promotion path from intern to SWE II at Pathao.
**Q929.** What would you do differently about a past project?
**Q930.** How do you approach cross-team collaboration?

**Q931-Q940. Scenario-Based**

**Q931.** You discover a security vulnerability in production. Walk me through your response.
**Q932.** A feature you shipped caused a 10% increase in API latency. How do you debug?
**Q933.** Two services have inconsistent data. How do you investigate and fix?
**Q934.** You need to process 10 million rows from an XLSX upload. Design the approach.
**Q935.** A junior developer's PR has significant issues. How do you provide feedback?
**Q936.** Stakeholders want a feature that conflicts with good architecture. What do you do?
**Q937.** Your database is at 90% capacity and growing. What's your plan?
**Q938.** A third-party API you depend on becomes unreliable. How do you handle it?
**Q939.** You need to sunset a feature used by 5% of users. What's your approach?
**Q940.** How would you redesign a system you built a year ago with what you know now?

**Q941-Q950. Big Picture**

**Q941.** Where do you see yourself in 3 years?
**Q942.** What technical trends excite you most?
**Q943.** How do you evaluate new technologies for adoption?
**Q944.** What's the most impactful feature you've built?
**Q945.** How do you balance perfectionism with pragmatism?
**Q946.** What makes a great engineering team?
**Q947.** How do you approach system reliability (SLOs, SLAs)?
**Q948.** What's your experience with Agile/Scrum?
**Q949.** How do you handle burnout?
**Q950.** What questions do you have for us? (Always prepare 3-5)

---

## Section 37: Miscellaneous & Edge Cases (Q951–Q1000)

### Q951-Q970. Tricky Conceptual Questions

**Q951. What happens when you type a URL in the browser?**
DNS lookup → TCP handshake → TLS handshake → HTTP request → Server processes → Response → Parse HTML → Load CSS/JS → Render.

**Q952. How does `JSON.stringify` handle special values?**
```js
JSON.stringify(undefined);     // undefined (not a string)
JSON.stringify(NaN);           // "null"
JSON.stringify(Infinity);      // "null"
JSON.stringify(new Date());    // "\"2024-01-01T...\"" (calls toJSON)
JSON.stringify({ fn: () => {} }); // "{}" (functions stripped)
JSON.stringify({ a: undefined }); // "{}" (undefined values stripped)
```

**Q953. What is the difference between authentication and authorization?**
Authentication: "Who are you?" (login, JWT). Authorization: "What can you do?" (RBAC, permissions).

**Q954. What is idempotency and why does it matter?**
Performing the same operation multiple times produces the same result. Critical for: payment processing, API retries, message consumers.

**Q955. What is the difference between concurrency and parallelism?**
Concurrency: dealing with many things at once (structure). Parallelism: doing many things at once (execution). Go has concurrency primitives; parallelism depends on hardware.

**Q956. What is a race condition?**
When behavior depends on timing of uncontrolled events. Fix with: mutexes, atomic operations, channels, database constraints.

**Q957. What is the CAP theorem simplified?**
Can't have all three: Consistency, Availability, Partition tolerance. Pick CP (bank) or AP (social feed). Partition tolerance is non-negotiable.

**Q958. What is the difference between encoding, encryption, and hashing?**
Encoding: format transformation (Base64) — reversible, no key. Encryption: confidentiality (AES) — reversible with key. Hashing: integrity (SHA-256) — irreversible.

**Q959. What is a memory leak vs memory bloat?**
Leak: memory that should be freed isn't (growing without bound). Bloat: using more memory than necessary (but controlled).

**Q960. What is TCP head-of-line blocking?**
If one packet is lost, all subsequent packets wait. HTTP/2 multiplexing still suffers over TCP. HTTP/3 (QUIC over UDP) solves this.

**Q961. What is zero-downtime deployment?**
Rolling updates, blue-green, canary. Key: backward-compatible database migrations, health checks, graceful connection draining.

**Q962. What is a goroutine leak?**
Goroutine that never terminates (blocked on channel, infinite loop). Detect with `runtime.NumGoroutine()`. Prevent with context cancellation.

**Q963. What is N+1 problem in GraphQL?**
Resolving nested fields triggers separate DB queries per parent. Fix with DataLoader (batching).

**Q964. What is the diamond problem?**
Multiple inheritance ambiguity. Go avoids with embedding + explicit method resolution. JS avoids with single prototype chain.

**Q965. What is tail latency (p99)?**
99th percentile response time. If p99 is 2s but median is 100ms, 1% of users wait 20x longer. Important for SLOs.

**Q966. What is the difference between `null` and `undefined` in JS?**
`undefined`: variable declared but not assigned. `null`: explicitly set to "no value". `typeof null === "object"` (historical bug).

**Q967. What is short-circuit evaluation?**
```js
const name = user?.name || "Anonymous";  // falsy check
const name = user?.name ?? "Anonymous";  // nullish check (better)
false || "fallback" // "fallback"
false ?? "fallback" // false (only null/undefined trigger ??)
```

**Q968. What is coercion in JavaScript?**
```js
"5" + 3    // "53" (string concatenation)
"5" - 3    // 2 (numeric subtraction)
!!"hello"  // true (double negation → boolean)
[] + []    // "" (empty string)
[] + {}    // "[object Object]"
{} + []    // 0 (block + unary plus)
```

**Q969. What is temporal coupling?**
When code depends on the order of method calls. Fix with: builder pattern, constructor initialization, immutable objects.

**Q970. What is the halting problem and why should developers care?**
It's impossible to write a program that determines if any program will halt. Practical implication: you can't write a perfect deadlock/infinite loop detector.

### Q971-Q1000. Final Lightning Round

**Q971.** What is WebAssembly System Interface (WASI)? — Run WASM outside browsers.
**Q972.** What is edge computing? — Run code at CDN edge locations, close to users.
**Q973.** What is a monorepo tool? — Turborepo, Nx, Bazel manage multi-package repos.
**Q974.** What is feature flagging best practice? — Default off, clean up after rollout, separate deploy from release.
**Q975.** What is chaos engineering? — Deliberately inject failures to test resilience.
**Q976.** What is observability-driven development? — Instrument first, then develop.
**Q977.** What is a service level objective (SLO)? — Target reliability: "99.9% of requests under 200ms."
**Q978.** What is error budget? — 100% - SLO = allowed downtime. When exhausted, freeze features, fix reliability.
**Q979.** What is a toil budget? — Track repetitive manual work, automate when it exceeds threshold.
**Q980.** What is platform engineering? — Build internal developer platforms to improve productivity.
**Q981.** What is FinOps? — Cloud financial management: track, optimize, forecast cloud spending.
**Q982.** What is shift-left testing? — Test earlier in development (unit tests > E2E tests).
**Q983.** What is progressive enhancement? — Build for basic browsers first, enhance for modern ones.
**Q984.** What is graceful degradation? — Full features for modern browsers, acceptable fallback for old ones.
**Q985.** What is technical writing as a skill? — ADRs, README files, API docs, runbooks, post-mortems.
**Q986.** What is pair programming? — Two developers, one keyboard. Driver types, navigator reviews.
**Q987.** What is mob programming? — Whole team, one screen. Knowledge sharing, alignment.
**Q988.** What is a blameless post-mortem? — Focus on systems not people. What happened, why, how to prevent.
**Q989.** What is Conway's Law? — System architecture mirrors organization communication structure.
**Q990.** What is Goodhart's Law? — When a measure becomes a target, it ceases to be a good measure (code coverage!).
**Q991.** What is Hyrum's Law? — Any observable behavior will be depended upon by someone.
**Q992.** What is the Pareto Principle in engineering? — 80% of bugs come from 20% of code. Focus effort there.
**Q993.** What is a runbook? — Step-by-step instructions for handling incidents. Essential for on-call.
**Q994.** What is GitOps? — Git as single source of truth for infrastructure and deployments.
**Q995.** What is developer experience (DX)? — How easy and pleasant it is to build and ship. Fast builds, clear docs, good tooling.
**Q996.** What is a spike in Agile? — Time-boxed research to reduce uncertainty before committing to implementation.
**Q997.** What is tech radar? — Categorize technologies: adopt, trial, assess, hold. Guides team decisions.
**Q998.** What is an Architecture Decision Record (ADR)? — Document: context, decision, consequences. Version-controlled.
**Q999.** What is the bus factor? — Number of people who could leave before the project stalls. Increase via knowledge sharing.
**Q1000.** What is your biggest strength as an engineer?
Frame it around your unique combination: full-stack depth (JS/TS + Go), real-time systems experience, 0-to-1 product delivery, AI integration, and open-source contributions. Back it with specific examples from Pathao and your projects.

---

*That's 1,000 questions. You've covered every angle — JavaScript internals, TypeScript wizardry, React/Next.js patterns, Vue/Nuxt (your Pathao stack), Go concurrency, databases, system design, algorithms, DevOps, AI/ML, and behavioral scenarios. You're ready.* 🚀
