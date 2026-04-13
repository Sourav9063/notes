# 250 Technical Interview Questions & Answers

**Tailored for: Sourav Ahmed — Full-Stack Engineer (JS/TS, Go, React, Next.js, PostgreSQL, Redis, Docker, AI/ML)**

---

## Section 1: JavaScript Core (Q1–Q30)

### Q1. What is the difference between `var`, `let`, and `const`?

`var` is function-scoped and hoisted. `let` and `const` are block-scoped. `const` prevents reassignment but doesn't make objects immutable.

```js
var a = 1;    // function-scoped, hoisted
let b = 2;    // block-scoped
const c = 3;  // block-scoped, no reassignment

const obj = { x: 1 };
obj.x = 2;       // ✅ allowed — mutation, not reassignment
// obj = {};      // ❌ TypeError
```

### Q2. Explain closures with a practical example.

A closure is a function that retains access to its lexical scope even after the outer function returns.

```js
function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    getCount: () => count,
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log(counter.getCount()); // 2
```

### Q3. What is the event loop? Explain microtasks vs macrotasks.

The event loop processes the call stack, then drains all **microtasks** (Promises, `queueMicrotask`, `MutationObserver`), then runs one **macrotask** (setTimeout, setInterval, I/O).

```js
console.log("1");

setTimeout(() => console.log("2"), 0);   // macrotask

Promise.resolve().then(() => console.log("3")); // microtask

console.log("4");

// Output: 1, 4, 3, 2
```

### Q4. Explain prototypal inheritance.

Every JS object has an internal `[[Prototype]]` link. Property lookups walk this chain.

```js
const animal = { speak() { return `${this.name} makes a sound`; } };
const dog = Object.create(animal);
dog.name = "Rex";
console.log(dog.speak()); // "Rex makes a sound"
console.log(dog.hasOwnProperty('speak')); // false — inherited
```

### Q5. What are Promises? Compare with async/await.

Promises represent eventual completion/failure of an async operation. `async/await` is syntactic sugar over Promises.

```js
// Promise chain
fetch('/api/data')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// async/await equivalent
async function getData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
```

### Q6. What is `this` in JavaScript? How does it behave in arrow functions?

`this` depends on how a function is called. Arrow functions capture `this` from the enclosing lexical scope.

```js
const obj = {
  name: "Sourav",
  greet() { return this.name; },             // "Sourav"
  greetArrow: () => this.name,               // undefined (inherits outer `this`)
  delayed() {
    setTimeout(() => console.log(this.name), 100); // "Sourav" — arrow captures obj's `this`
  }
};
```

### Q7. Explain `call`, `apply`, and `bind`.

All three set the `this` context. `call` takes args individually, `apply` takes an array, `bind` returns a new function.

```js
function greet(greeting, punct) {
  return `${greeting}, ${this.name}${punct}`;
}

const user = { name: "Sourav" };

greet.call(user, "Hello", "!");   // "Hello, Sourav!"
greet.apply(user, ["Hi", "."]);   // "Hi, Sourav."
const bound = greet.bind(user, "Hey");
bound("?");                        // "Hey, Sourav?"
```

### Q8. What is debouncing and throttling?

**Debounce**: delays execution until after a pause in events.
**Throttle**: limits execution to at most once per interval.

```js
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function throttle(fn, limit) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}
```

### Q9. What are generators and how do they differ from async/await?

Generators produce a sequence of values lazily via `yield`. They pause and resume execution.

```js
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
console.log(fib.next().value); // 0
console.log(fib.next().value); // 1
console.log(fib.next().value); // 1
console.log(fib.next().value); // 2
```

### Q10. Explain `WeakMap` and `WeakRef`. When would you use them?

`WeakMap` holds weak references to keys (objects only), allowing garbage collection. `WeakRef` holds a weak reference to a single object.

```js
// WeakMap — useful for private data / caching without memory leaks
const cache = new WeakMap();

function process(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = /* expensive computation */ obj.value * 2;
  cache.set(obj, result);
  return result;
}

let data = { value: 42 };
process(data);  // cached
data = null;    // entry in WeakMap is GC-eligible
```

### Q11. What is the Temporal Dead Zone (TDZ)?

The TDZ is the period between entering a scope and the variable's declaration where `let`/`const` variables exist but cannot be accessed.

```js
{
  // TDZ starts
  // console.log(x); // ReferenceError
  let x = 10;       // TDZ ends
  console.log(x);   // 10
}
```

### Q12. Explain `Symbol` and its use cases.

Symbols are unique, immutable identifiers useful for object property keys that won't collide.

```js
const id = Symbol("id");
const user = { [id]: 123, name: "Sourav" };

console.log(user[id]);             // 123
console.log(Object.keys(user));    // ["name"] — Symbol keys are not enumerable
console.log(JSON.stringify(user)); // '{"name":"Sourav"}' — Symbols excluded

// Well-known Symbols
class MyArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}
console.log([] instanceof MyArray); // true
```

### Q13. What is the difference between `==` and `===`?

`==` performs type coercion before comparison, `===` checks value and type strictly.

```js
console.log(0 == "");     // true  (both coerced to 0)
console.log(0 === "");    // false (different types)
console.log(null == undefined);  // true
console.log(null === undefined); // false
```

### Q14. How does `Promise.all`, `Promise.allSettled`, `Promise.race`, `Promise.any` differ?

```js
const p1 = Promise.resolve(1);
const p2 = Promise.reject("err");
const p3 = Promise.resolve(3);

// all — rejects if ANY rejects
Promise.all([p1, p2, p3]).catch(e => e);        // "err"

// allSettled — waits for all, never rejects
Promise.allSettled([p1, p2, p3]);
// [{status:"fulfilled",value:1}, {status:"rejected",reason:"err"}, {status:"fulfilled",value:3}]

// race — first to settle (fulfill or reject)
Promise.race([p1, p2]);   // 1 (p1 resolves first synchronously)

// any — first to FULFILL (ignores rejections)
Promise.any([p2, p3]);    // 3
```

### Q15. Explain the module system: CommonJS vs ES Modules.

```js
// CommonJS (Node.js default)
const fs = require('fs');
module.exports = { myFunc };

// ES Modules
import fs from 'fs';
export const myFunc = () => {};
export default myFunc;
```

Key differences: CJS is synchronous, loaded at runtime. ESM is asynchronous, statically analyzed, supports tree-shaking.

### Q16. What is `structuredClone` and how does it compare to spread/JSON methods?

```js
const original = { a: 1, nested: { b: 2 }, date: new Date(), set: new Set([1, 2]) };

// Spread — shallow copy only
const shallow = { ...original };
shallow.nested.b = 99;
console.log(original.nested.b); // 99 — mutated!

// JSON — deep but loses Date, Set, Map, undefined, functions
const jsonCopy = JSON.parse(JSON.stringify(original));

// structuredClone — deep copy, preserves most types
const deep = structuredClone(original);
deep.nested.b = 99;
console.log(original.nested.b); // 2 — safe
```

### Q17. Explain the `Proxy` object with a practical example.

```js
const validator = {
  set(target, prop, value) {
    if (prop === "age" && (typeof value !== "number" || value < 0)) {
      throw new TypeError("Age must be a positive number");
    }
    target[prop] = value;
    return true;
  },
  get(target, prop) {
    return prop in target ? target[prop] : `Property ${prop} not found`;
  }
};

const user = new Proxy({}, validator);
user.age = 25;       // ✅
// user.age = -5;    // ❌ TypeError
console.log(user.foo); // "Property foo not found"
```

### Q18. What is `Object.freeze` vs `Object.seal`?

```js
const frozen = Object.freeze({ a: 1, nested: { b: 2 } });
// frozen.a = 2;       // silently fails (or throws in strict mode)
frozen.nested.b = 99;  // ✅ works — freeze is shallow!

const sealed = Object.seal({ a: 1 });
sealed.a = 2;           // ✅ can modify existing
// sealed.b = 3;        // ❌ can't add new properties
// delete sealed.a;     // ❌ can't delete
```

### Q19. Explain event delegation.

Event delegation leverages event bubbling to handle events on a parent rather than each child.

```js
document.getElementById("list").addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    console.log("Clicked:", e.target.textContent);
  }
});
// Works for dynamically added <li> elements too
```

### Q20. What is a `Map` vs a plain object?

```js
const map = new Map();
map.set(1, "number key");
map.set({}, "object key");
map.set("a", "string key");

console.log(map.size);          // 3
console.log([...map.keys()]);   // [1, {}, "a"]

// Advantages over objects:
// - Any type as key (not just strings/symbols)
// - Maintains insertion order
// - O(1) .size property
// - No prototype pollution risk
// - Better performance for frequent add/delete
```

### Q21. What is currying?

```js
const curry = (fn) => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
};

const add = curry((a, b, c) => a + b + c);
console.log(add(1)(2)(3));   // 6
console.log(add(1, 2)(3));   // 6
console.log(add(1)(2, 3));   // 6
```

### Q22. Explain `requestAnimationFrame` vs `setTimeout`.

`requestAnimationFrame` syncs with the browser's repaint cycle (~60fps). `setTimeout` fires at a minimum delay and isn't frame-synced.

```js
// Smooth animation with rAF
function animate(timestamp) {
  element.style.transform = `translateX(${timestamp / 10}px)`;
  if (timestamp < 3000) requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

### Q23. What is tail call optimization?

TCO allows recursive functions in tail position to reuse the current stack frame, preventing stack overflow. Only supported in Safari (strict mode).

```js
// Not tail-recursive
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // multiplication happens after recursion
}

// Tail-recursive
function factorialTCO(n, acc = 1) {
  if (n <= 1) return acc;
  return factorialTCO(n - 1, n * acc); // nothing after the call
}
```

### Q24. Explain `Intl` API for internationalization.

```js
const num = 1234567.89;
console.log(new Intl.NumberFormat('bn-BD').format(num)); // "১২,৩৪,৫৬৭.৮৯"
console.log(new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD'
}).format(num)); // "$1,234,567.89"

const date = new Date();
console.log(new Intl.DateTimeFormat('bn-BD', {
  dateStyle: 'full'
}).format(date));

// Relative time
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
console.log(rtf.format(-1, 'day')); // "yesterday"
```

### Q25. What are tagged template literals?

```js
function sql(strings, ...values) {
  // Sanitize interpolated values
  const sanitized = values.map(v =>
    typeof v === 'string' ? v.replace(/'/g, "''") : v
  );
  return strings.reduce((result, str, i) =>
    `${result}${str}${sanitized[i] ?? ''}`, ''
  );
}

const name = "O'Brien";
const query = sql`SELECT * FROM users WHERE name = '${name}'`;
// "SELECT * FROM users WHERE name = 'O''Brien'"
```

### Q26. What is optional chaining and nullish coalescing?

```js
const user = { address: { city: "Dhaka" }, settings: { theme: 0 } };

// Optional chaining — short-circuits to undefined
console.log(user?.address?.city);     // "Dhaka"
console.log(user?.contact?.phone);    // undefined (no error)

// Nullish coalescing — only null/undefined trigger fallback
console.log(user.settings.theme ?? "default"); // 0  (not "default"!)
console.log(user.settings.theme || "default"); // "default" (0 is falsy)
```

### Q27. How does garbage collection work in V8?

V8 uses a **generational** approach: a **minor GC (Scavenger)** for short-lived objects in the "young generation" (using semi-space copying), and a **major GC (Mark-Sweep-Compact)** for long-lived objects in the "old generation." Objects surviving two minor GCs are promoted to the old generation.

### Q28. What is the difference between `Object.keys`, `Object.values`, `Object.entries`, and `for...in`?

```js
const obj = { a: 1, b: 2 };
Object.defineProperty(obj, 'c', { value: 3, enumerable: false });
const parent = { d: 4 };
Object.setPrototypeOf(obj, parent);

Object.keys(obj);    // ["a", "b"] — own enumerable
Object.values(obj);  // [1, 2]
Object.entries(obj); // [["a", 1], ["b", 2]]

for (let key in obj) console.log(key); // "a", "b", "d" — includes inherited
```

### Q29. What is `AbortController` and how do you cancel async operations?

```js
const controller = new AbortController();

async function fetchData() {
  try {
    const res = await fetch('/api/data', { signal: controller.signal });
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') console.log('Request cancelled');
    else throw err;
  }
}

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);
```

### Q30. Explain the `Reflect` API and its relationship with `Proxy`.

`Reflect` provides methods that mirror `Proxy` trap operations, giving a clean way to perform default behavior inside traps.

```js
const handler = {
  get(target, prop, receiver) {
    console.log(`Accessing: ${prop}`);
    return Reflect.get(target, prop, receiver); // default behavior
  },
  set(target, prop, value, receiver) {
    console.log(`Setting: ${prop} = ${value}`);
    return Reflect.set(target, prop, value, receiver);
  }
};

const proxy = new Proxy({ name: "Sourav" }, handler);
proxy.name;         // logs "Accessing: name", returns "Sourav"
proxy.age = 25;     // logs "Setting: age = 25"
```

---

## Section 2: TypeScript (Q31–Q50)

### Q31. What is the difference between `interface` and `type`?

```ts
// Interface — extendable, declaration merging
interface User {
  name: string;
}
interface User {  // merges
  age: number;
}

// Type — more flexible (unions, intersections, mapped types)
type Result = Success | Failure;
type Readonly<T> = { readonly [K in keyof T]: T[K] };
```

Interfaces support declaration merging and `extends`; types support unions, primitives, and mapped types.

### Q32. Explain generics with constraints.

```ts
interface HasLength { length: number; }

function logLength<T extends HasLength>(item: T): T {
  console.log(item.length);
  return item;
}

logLength("hello");    // 5
logLength([1, 2, 3]);  // 3
// logLength(42);       // ❌ number has no .length
```

### Q33. What are conditional types?

```ts
type IsString<T> = T extends string ? "yes" : "no";

type A = IsString<string>;  // "yes"
type B = IsString<number>;  // "no"

// Practical: extract return type
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;
type R = ReturnOf<(x: number) => string>; // string
```

### Q34. Explain `keyof`, `typeof`, and indexed access types.

```ts
const config = { host: "localhost", port: 3000 } as const;

type Config = typeof config;             // { readonly host: "localhost"; readonly port: 3000 }
type ConfigKeys = keyof Config;          // "host" | "port"
type HostType = Config["host"];          // "localhost"
```

### Q35. What are mapped types?

```ts
type Optional<T> = { [K in keyof T]?: T[K] };
type ReadonlyDeep<T> = {
  readonly [K in keyof T]: T[K] extends object ? ReadonlyDeep<T[K]> : T[K];
};

interface User { name: string; address: { city: string } };
type ReadonlyUser = ReadonlyDeep<User>;
// { readonly name: string; readonly address: { readonly city: string } }
```

### Q36. What is Zod and why use it with TypeScript?

Zod provides runtime validation with automatic TypeScript type inference, bridging the gap between runtime data and compile-time types.

```ts
import { z } from "zod";

const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

type User = z.infer<typeof UserSchema>;
// { name: string; email: string; age?: number }

// Runtime validation
const result = UserSchema.safeParse({ name: "", email: "bad" });
if (!result.success) {
  console.log(result.error.issues);
  // [{ path: ["name"], message: "String must contain at least 1 character(s)" }, ...]
}
```

### Q37. Explain discriminated unions.

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":    return Math.PI * shape.radius ** 2;
    case "rectangle": return shape.width * shape.height;
  }
}
```

### Q38. What is the `satisfies` operator?

```ts
type Colors = Record<string, string | string[]>;

const palette = {
  red: "#ff0000",
  green: ["#00ff00", "#008000"],
} satisfies Colors;

// Type is preserved — NOT widened to Colors
palette.red.toUpperCase();     // ✅ TS knows it's string
palette.green.map(c => c);     // ✅ TS knows it's string[]
```

### Q39. What are template literal types?

```ts
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
type Route = `/api/${string}`;
type Endpoint = `${HTTPMethod} ${Route}`;

const e1: Endpoint = "GET /api/users";     // ✅
// const e2: Endpoint = "PATCH /api/users"; // ❌

// Intrinsic string manipulation
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }
```

### Q40. What is `never` and when do you use it?

```ts
// Exhaustive checking
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

type Animal = "cat" | "dog" | "fish";
function move(animal: Animal) {
  switch (animal) {
    case "cat": return "walk";
    case "dog": return "run";
    case "fish": return "swim";
    default: return assertNever(animal); // TS error if a case is missing
  }
}
```

### Q41. What are utility types? List important ones.

```ts
interface User { id: number; name: string; email: string; role: string }

type PartialUser   = Partial<User>;          // all optional
type RequiredUser  = Required<PartialUser>;  // all required
type UserPreview   = Pick<User, "id" | "name">;
type UserInput     = Omit<User, "id">;
type ReadonlyUser  = Readonly<User>;
type UserRecord    = Record<string, User>;
type NonNullName   = NonNullable<string | null>; // string
type Params        = Parameters<(a: string, b: number) => void>; // [string, number]
type Ret           = ReturnType<() => boolean>; // boolean
```

### Q42. How do you generate types from an OpenAPI spec?

Using tools like `openapi-typescript` to auto-generate types:

```bash
npx openapi-typescript https://api.example.com/openapi.json -o ./types/api.ts
```

```ts
import type { paths } from "./types/api";

type GetUsersResponse = paths["/users"]["get"]["responses"]["200"]["content"]["application/json"];
// Fully typed API response, auto-synced with backend schema
```

This pairs with your Dashboard Foundation work using OpenAPI-driven type generation.

### Q43. What are declaration files (`.d.ts`)?

Declaration files provide type information for JavaScript code without implementations.

```ts
// types/analytics.d.ts
declare module "analytics" {
  export function track(event: string, data?: Record<string, unknown>): void;
  export function identify(userId: string): void;
}
```

### Q44. Explain `as const` assertions.

```ts
// Without as const — type is string[]
const routes = ["/home", "/about", "/contact"];

// With as const — type is readonly ["/home", "/about", "/contact"]
const routes2 = ["/home", "/about", "/contact"] as const;

type Route = (typeof routes2)[number]; // "/home" | "/about" | "/contact"
```

### Q45. What is variance in TypeScript (covariance, contravariance)?

```ts
class Animal { name = ""; }
class Dog extends Animal { bark() {} }

// Covariant — subtypes accepted where supertypes expected (return types)
type Producer<T> = () => T;
const produceDog: Producer<Dog> = () => new Dog();
const produceAnimal: Producer<Animal> = produceDog; // ✅

// Contravariant — supertypes accepted where subtypes expected (parameter types)
type Consumer<T> = (item: T) => void;
const consumeAnimal: Consumer<Animal> = (a) => console.log(a.name);
const consumeDog: Consumer<Dog> = consumeAnimal; // ✅
```

### Q46. Explain type guards and type narrowing.

```ts
interface Circle { kind: "circle"; radius: number }
interface Square { kind: "square"; side: number }
type Shape = Circle | Square;

// Custom type guard
function isCircle(shape: Shape): shape is Circle {
  return shape.kind === "circle";
}

function area(shape: Shape) {
  if (isCircle(shape)) {
    return Math.PI * shape.radius ** 2; // TS knows it's Circle
  }
  return shape.side ** 2; // TS knows it's Square
}
```

### Q47. What is the `infer` keyword?

```ts
// Extract element type from array
type ElementType<T> = T extends (infer U)[] ? U : never;
type A = ElementType<string[]>; // string

// Extract promise value
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;
type B = Awaited<Promise<Promise<number>>>; // number

// Extract function first arg
type FirstArg<T> = T extends (first: infer F, ...args: any[]) => any ? F : never;
type C = FirstArg<(name: string, age: number) => void>; // string
```

### Q48. How do you type a generic React component with forwardRef?

```tsx
interface InputProps<T> {
  value: T;
  onChange: (val: T) => void;
  label: string;
}

const Input = forwardRef(<T,>(
  props: InputProps<T>,
  ref: React.ForwardedRef<HTMLInputElement>
) => (
  <input ref={ref} onChange={(e) => props.onChange(e.target.value as T)} />
));
```

### Q49. Explain `Record` vs `Map` in TypeScript.

```ts
// Record — plain object with typed keys and values
const scores: Record<string, number> = { alice: 95, bob: 87 };

// Map — real Map with any key type
const cache = new Map<symbol, { data: unknown; expiry: number }>();
const key = Symbol("user");
cache.set(key, { data: { name: "Sourav" }, expiry: Date.now() + 3600 });
```

Use `Record` for simple string-keyed objects. Use `Map` when you need non-string keys, ordered iteration, or frequent add/delete.

### Q50. How do you handle strict null checks in TypeScript?

```ts
// tsconfig.json: "strictNullChecks": true

function getUser(id: number): User | null {
  return db.find(u => u.id === id) ?? null;
}

const user = getUser(1);
// user.name;           // ❌ Object is possibly null
user?.name;             // ✅ optional chaining
user!.name;             // ⚠️ non-null assertion (risky)

if (user) {
  user.name;            // ✅ narrowed to User
}
```

---

## Section 3: React & Next.js (Q51–Q85)

### Q51. Explain the React component lifecycle with Hooks equivalents.

```tsx
function MyComponent() {
  // componentDidMount + componentDidUpdate
  useEffect(() => {
    console.log("mounted or updated");
    return () => console.log("cleanup / componentWillUnmount");
  }, []); // empty deps = mount only

  // componentDidUpdate for specific value
  useEffect(() => { /* runs when count changes */ }, [count]);

  // shouldComponentUpdate equivalent
  // Use React.memo() wrapper
}

export default React.memo(MyComponent);
```

### Q52. What is the difference between `useMemo` and `useCallback`?

```tsx
function SearchResults({ query, data }: Props) {
  // useMemo — memoizes a computed VALUE
  const filtered = useMemo(
    () => data.filter(item => item.name.includes(query)),
    [query, data]
  );

  // useCallback — memoizes a FUNCTION reference
  const handleClick = useCallback(
    (id: string) => console.log(id, query),
    [query]
  );

  return filtered.map(item => (
    <Item key={item.id} onClick={handleClick} data={item} />
  ));
}
```

### Q53. Explain React Server Components (RSC) in Next.js App Router.

Server Components run only on the server — they can directly access databases, read files, and aren't sent as JS to the client.

```tsx
// app/users/page.tsx — Server Component by default
import { db } from "@/lib/db";

export default async function UsersPage() {
  const users = await db.query("SELECT * FROM users"); // Direct DB access
  return <UserList users={users} />;
}

// components/SearchBar.tsx — Client Component
"use client";
import { useState } from "react";

export function SearchBar() {
  const [query, setQuery] = useState(""); // Needs browser APIs
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### Q54. How does Next.js App Router caching work?

Next.js has four caching layers:

1. **Request Memoization** — deduplicates identical `fetch` calls within a single render
2. **Data Cache** — persists `fetch` results across requests on the server
3. **Full Route Cache** — caches rendered HTML and RSC payload at build time
4. **Router Cache** — client-side cache of visited routes

```tsx
// Opt out of caching
fetch('/api/data', { cache: 'no-store' });

// Revalidate every 60 seconds
fetch('/api/data', { next: { revalidate: 60 } });

// On-demand revalidation
import { revalidatePath, revalidateTag } from "next/cache";
revalidatePath("/dashboard");
revalidateTag("users");
```

### Q55. Explain `useReducer` with a complex state example.

```tsx
type State = { items: Item[]; loading: boolean; error: string | null };
type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Item[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "DELETE_ITEM"; id: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":   return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS": return { ...state, loading: false, items: action.payload };
    case "FETCH_ERROR":   return { ...state, loading: false, error: action.error };
    case "DELETE_ITEM":   return { ...state, items: state.items.filter(i => i.id !== action.id) };
  }
}

function ItemList() {
  const [state, dispatch] = useReducer(reducer, { items: [], loading: false, error: null });
  // dispatch({ type: "FETCH_START" });
}
```

### Q56. What are React Suspense and Streaming SSR?

```tsx
import { Suspense } from "react";

// Server component with slow data
async function Comments() {
  const comments = await fetchComments(); // slow API
  return <CommentList comments={comments} />;
}

// Page streams immediately, Suspense fills in later
export default function PostPage() {
  return (
    <article>
      <PostContent />
      <Suspense fallback={<p>Loading comments...</p>}>
        <Comments />
      </Suspense>
    </article>
  );
}
```

### Q57. How do Next.js Server Actions work?

```tsx
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  await db.insert("posts", { title });
  revalidatePath("/posts");
}

// app/posts/new/page.tsx
import { createPost } from "../actions";

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Q58. Explain React Context performance issues and solutions.

```tsx
// ❌ Problem: all consumers re-render on ANY state change
const AppContext = createContext({ user: null, theme: "light", locale: "en" });

// ✅ Solution 1: Split contexts
const UserContext = createContext(null);
const ThemeContext = createContext("light");

// ✅ Solution 2: Memoize the value
function Provider({ children }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ✅ Solution 3: Use selector pattern (libraries like use-context-selector)
```

### Q59. What is the `useTransition` hook?

```tsx
function TabContainer() {
  const [tab, setTab] = useState("home");
  const [isPending, startTransition] = useTransition();

  function selectTab(nextTab: string) {
    startTransition(() => {
      setTab(nextTab); // Low priority — won't block UI
    });
  }

  return (
    <>
      <TabButton onClick={() => selectTab("posts")} />
      {isPending && <Spinner />}
      <TabContent tab={tab} />
    </>
  );
}
```

### Q60. How do you implement optimistic updates in a UI?

```tsx
import { useOptimistic } from "react";

function MessageList({ messages, sendMessage }) {
  const [optimisticMsgs, addOptimistic] = useOptimistic(
    messages,
    (state, newMsg: string) => [...state, { text: newMsg, sending: true }]
  );

  async function handleSubmit(formData: FormData) {
    const text = formData.get("message") as string;
    addOptimistic(text);          // Instantly show in UI
    await sendMessage(text);       // Actually send to server
  }

  return (
    <>
      {optimisticMsgs.map((msg, i) => (
        <p key={i} style={{ opacity: msg.sending ? 0.5 : 1 }}>{msg.text}</p>
      ))}
      <form action={handleSubmit}>
        <input name="message" />
      </form>
    </>
  );
}
```

### Q61. How does Next.js middleware work?

```ts
// middleware.ts (project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token");

  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Add custom header
  const response = NextResponse.next();
  response.headers.set("x-request-id", crypto.randomUUID());
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
```

### Q62. What is React's reconciliation algorithm (Fiber)?

React Fiber is the reconciliation engine that enables incremental rendering. It works by creating a tree of "fiber nodes" representing each component. During reconciliation, it compares the new tree with the current tree (diffing), and schedules updates in priority lanes (urgent vs deferred). Fiber can pause, resume, and abort rendering work, enabling features like `useTransition` and Suspense.

Key optimization: React uses the `key` prop to match elements between renders, avoiding unnecessary DOM destruction/recreation.

### Q63. Explain Next.js ISR (Incremental Static Regeneration).

```tsx
// app/products/[id]/page.tsx
export const revalidate = 3600; // revalidate every hour

export async function generateStaticParams() {
  const products = await getTopProducts();
  return products.map(p => ({ id: p.id }));
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  return <ProductDetail product={product} />;
}
```

Pages are statically generated at build time but regenerated in the background after the revalidation period.

### Q64. How do you implement RBAC in a Next.js app?

```tsx
// lib/auth.ts
type Role = "admin" | "editor" | "viewer";

const permissions: Record<Role, string[]> = {
  admin:  ["read", "write", "delete", "manage_users"],
  editor: ["read", "write"],
  viewer: ["read"],
};

export function hasPermission(role: Role, action: string): boolean {
  return permissions[role]?.includes(action) ?? false;
}

// middleware.ts
export function middleware(req: NextRequest) {
  const user = verifyToken(req.cookies.get("token")?.value);
  const path = req.nextUrl.pathname;

  if (path.startsWith("/admin") && user?.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  return NextResponse.next();
}
```

### Q65. What are React error boundaries?

```tsx
"use client";
import { Component, ReactNode } from "react";

class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Caught by boundary:", error, info.componentStack);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// In Next.js App Router, use error.tsx
// app/dashboard/error.tsx
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <button onClick={reset}>Try again</button>;
}
```

### Q66. How do you handle forms in React with validation?

```tsx
"use client";
import { useActionState } from "react";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

async function submitForm(prevState: any, formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  await registerUser(parsed.data);
  return { success: true };
}

export default function RegisterForm() {
  const [state, action, pending] = useActionState(submitForm, null);

  return (
    <form action={action}>
      <input name="email" />
      {state?.errors?.email && <span>{state.errors.email[0]}</span>}
      <input name="password" type="password" />
      {state?.errors?.password && <span>{state.errors.password[0]}</span>}
      <button disabled={pending}>{pending ? "Submitting..." : "Register"}</button>
    </form>
  );
}
```

### Q67. What is `React.lazy` and code splitting in Next.js?

```tsx
import dynamic from "next/dynamic";

// Next.js dynamic import — loads only when rendered
const HeavyChart = dynamic(() => import("@/components/Chart"), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // client-only — no SSR for browser APIs like canvas
});

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart />
    </div>
  );
}
```

### Q68. How do you handle parallel routes in Next.js?

```
app/
  layout.tsx
  @analytics/page.tsx   ← slot 1
  @feed/page.tsx         ← slot 2
  page.tsx               ← main
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  analytics,
  feed,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  feed: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <aside>{analytics}</aside>
      <main>{feed}</main>
    </div>
  );
}
```

Parallel routes render multiple pages simultaneously in the same layout, useful for dashboards and modals.

### Q69. What are custom hooks? Write a `useFetch` hook.

```tsx
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(err => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}
```

### Q70. Explain `useRef` — when to use it over state?

```tsx
function StopWatch() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const renderCount = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [seconds, setSeconds] = useState(0);

  renderCount.current++; // Doesn't trigger re-render

  const start = () => {
    intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  };
  const stop = () => clearInterval(intervalRef.current!);
  const focusInput = () => inputRef.current?.focus();

  return <input ref={inputRef} />;
}
```

Use `useRef` for values that persist across renders but don't need to trigger re-renders (timers, DOM references, previous values).

### Q71. How does `next/image` optimize images?

```tsx
import Image from "next/image";

export default function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
      priority              // Preloads for LCP
      placeholder="blur"    // Shows blurred placeholder
      blurDataURL="data:image/..."
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}
```

It automatically: resizes and serves WebP/AVIF, lazy loads (unless `priority`), prevents CLS with width/height, serves via CDN with caching headers.

### Q72. What is `useImperativeHandle`?

```tsx
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { if (inputRef.current) inputRef.current.value = ""; },
    getValue: () => inputRef.current?.value ?? "",
  }));

  return <input ref={inputRef} />;
});

// Parent
function Parent() {
  const ref = useRef(null);
  return (
    <>
      <FancyInput ref={ref} />
      <button onClick={() => ref.current.focus()}>Focus</button>
    </>
  );
}
```

### Q73. Explain route groups in Next.js App Router.

```
app/
  (marketing)/
    page.tsx          → /
    about/page.tsx    → /about
    layout.tsx        → shared marketing layout
  (dashboard)/
    settings/page.tsx → /settings
    layout.tsx        → shared dashboard layout (with sidebar)
```

Parenthesized folders organize routes without affecting URL structure.

### Q74. How do you implement infinite scroll with React?

```tsx
function InfiniteList() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPage(p => p + 1);
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchItems(page).then(newItems =>
      setItems(prev => [...prev, ...newItems])
    );
  }, [page]);

  return (
    <>
      {items.map(item => <Card key={item.id} {...item} />)}
      <div ref={loaderRef}>Loading...</div>
    </>
  );
}
```

### Q75. What is the Virtual DOM and how does React's diffing algorithm work?

The Virtual DOM is an in-memory representation of the real DOM. When state changes, React creates a new virtual tree, **diffs** it against the previous one using these heuristics:

1. **Different types** → destroy old tree, build new
2. **Same type DOM elements** → update only changed attributes
3. **Same type components** → update props, recurse into children
4. **Lists with keys** → match children by key to minimize moves/recreations

### Q76. How do you handle WebSocket connections in React?

```tsx
function useWebSocket(url: string) {
  const [messages, setMessages] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      setMessages(prev => [...prev, event.data]);
    };

    ws.onclose = () => {
      // Reconnect after 3 seconds
      setTimeout(() => { wsRef.current = new WebSocket(url); }, 3000);
    };

    return () => ws.close();
  }, [url]);

  const send = useCallback((msg: string) => {
    wsRef.current?.send(msg);
  }, []);

  return { messages, send };
}
```

### Q77. What is React's `useSyncExternalStore`?

```tsx
// Subscribe to an external store (e.g., browser APIs)
function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    },
    () => navigator.onLine,         // client snapshot
    () => true                       // server snapshot
  );
}
```

### Q78. How does `next/font` work?

```tsx
import { Inter, Noto_Sans_Bengali } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const bangla = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["400", "700"] });

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.className} ${bangla.className}`}>
      <body>{children}</body>
    </html>
  );
}
```

Self-hosts fonts at build time — zero layout shift, no external requests to Google.

### Q79. What are intercepting routes in Next.js?

```
app/
  feed/
    page.tsx
    @modal/
      (..)photo/[id]/page.tsx    ← intercepts, shows modal
  photo/[id]/
    page.tsx                      ← full page (direct navigation)
```

Intercepting routes show a different UI (like a modal) when navigating via client-side, but show the full page on hard refresh/direct URL access.

### Q80. How do you manage global state without Redux?

```tsx
// Using Zustand — lightweight store
import { create } from "zustand";

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  total: () => number;
}

const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}));

// Usage in component
function Cart() {
  const items = useCartStore(state => state.items); // auto re-renders on change
  const addItem = useCartStore(state => state.addItem);
}
```

### Q81. What is `generateMetadata` in Next.js?

```tsx
import type { Metadata } from "next";

// Static
export const metadata: Metadata = { title: "Home", description: "Welcome" };

// Dynamic
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.id);
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: [product.imageUrl] },
  };
}
```

### Q82. How do you test React components?

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}

test("increments counter", async () => {
  render(<Counter />);
  expect(screen.getByTestId("count")).toHaveTextContent("0");
  fireEvent.click(screen.getByText("Increment"));
  expect(screen.getByTestId("count")).toHaveTextContent("1");
});
```

### Q83. What is the `use` hook in React 19?

```tsx
import { use } from "react";

// Can unwrap promises and contexts in render
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // suspends until resolved
  return <h1>{user.name}</h1>;
}

// Also works with context
function Theme() {
  const theme = use(ThemeContext); // equivalent to useContext(ThemeContext)
  return <div className={theme} />;
}
```

### Q84. How does prefetching work in Next.js `Link`?

```tsx
import Link from "next/link";

// Prefetches by default in production (viewport intersection)
<Link href="/dashboard">Dashboard</Link>

// Disable prefetch
<Link href="/heavy-page" prefetch={false}>Heavy Page</Link>
```

Next.js automatically prefetches linked pages when `<Link>` enters the viewport, splitting the prefetch into the shared layout (full) and page segment (partial, 30s cache).

### Q85. How do you implement a compound component pattern?

```tsx
const TabsContext = createContext<{ active: string; setActive: (v: string) => void } | null>(null);

function Tabs({ children, defaultValue }: { children: ReactNode; defaultValue: string }) {
  const [active, setActive] = useState(defaultValue);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

function TabList({ children }: { children: ReactNode }) {
  return <div role="tablist">{children}</div>;
}

function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { active, setActive } = use(TabsContext)!;
  return <button role="tab" aria-selected={active === value} onClick={() => setActive(value)}>{children}</button>;
}

function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { active } = use(TabsContext)!;
  return active === value ? <div role="tabpanel">{children}</div> : null;
}

// Usage
<Tabs defaultValue="tab1">
  <TabList>
    <Tab value="tab1">Overview</Tab>
    <Tab value="tab2">Analytics</Tab>
  </TabList>
  <TabPanel value="tab1">Overview content</TabPanel>
  <TabPanel value="tab2">Analytics content</TabPanel>
</Tabs>
```

---

## Section 4: Go / Golang (Q86–Q115)

### Q86. What are goroutines and how do they differ from threads?

Goroutines are lightweight, user-space threads managed by the Go runtime. They start with ~2KB stack (grows dynamically) vs OS threads with ~1MB. The Go scheduler multiplexes goroutines onto OS threads (M:N scheduling).

```go
func main() {
    for i := 0; i < 1000; i++ {
        go func(n int) {
            fmt.Println(n)
        }(i)
    }
    time.Sleep(time.Second) // Wait for goroutines
}
```

### Q87. Explain channels and their types.

```go
// Unbuffered — blocks until sender and receiver are both ready
ch := make(chan int)

// Buffered — blocks only when buffer is full
bch := make(chan int, 10)

// Directional channels
func producer(out chan<- int) { out <- 42 }    // send-only
func consumer(in <-chan int)  { val := <-in }  // receive-only

// Close and range
close(ch)
for val := range ch { /* reads until closed */ }
```

### Q88. What is the `select` statement?

```go
func multiplex(ch1, ch2 <-chan string, quit <-chan struct{}) {
    for {
        select {
        case msg := <-ch1:
            fmt.Println("ch1:", msg)
        case msg := <-ch2:
            fmt.Println("ch2:", msg)
        case <-quit:
            fmt.Println("shutting down")
            return
        case <-time.After(5 * time.Second):
            fmt.Println("timeout")
            return
        }
    }
}
```

`select` blocks until one case is ready. If multiple are ready, one is chosen randomly.

### Q89. How do you handle errors in Go?

```go
// Standard error handling
func readFile(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("readFile %s: %w", path, err) // wrap with %w
    }
    return data, nil
}

// Custom errors
type NotFoundError struct {
    Resource string
    ID       string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s %s not found", e.Resource, e.ID)
}

// Check error type
if errors.Is(err, os.ErrNotExist) { /* ... */ }
var nfe *NotFoundError
if errors.As(err, &nfe) { /* use nfe.Resource */ }
```

### Q90. What are interfaces in Go?

```go
type Writer interface {
    Write(p []byte) (n int, err error)
}

// Implicit implementation — no "implements" keyword
type FileWriter struct{ path string }

func (fw FileWriter) Write(p []byte) (int, error) {
    return os.WriteFile(fw.path, p, 0644), nil // simplified
}

// Empty interface accepts anything
func printAny(v interface{}) { fmt.Println(v) }
// Go 1.18+: func printAny(v any) { fmt.Println(v) }
```

### Q91. Explain Go generics.

```go
// Generic function
func Filter[T any](slice []T, predicate func(T) bool) []T {
    var result []T
    for _, v := range slice {
        if predicate(v) {
            result = append(result, v)
        }
    }
    return result
}

// With constraints
type Number interface { ~int | ~float64 }

func Sum[T Number](nums []T) T {
    var total T
    for _, n := range nums {
        total += n
    }
    return total
}

Sum([]int{1, 2, 3})       // 6
Sum([]float64{1.5, 2.5})  // 4.0
```

### Q92. What is `context` in Go and why is it important?

```go
func handleRequest(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    result, err := fetchFromDB(ctx)
    if err != nil {
        if ctx.Err() == context.DeadlineExceeded {
            http.Error(w, "Request timed out", http.StatusGatewayTimeout)
            return
        }
    }
}

func fetchFromDB(ctx context.Context) (string, error) {
    select {
    case <-ctx.Done():
        return "", ctx.Err()
    case result := <-queryDB():
        return result, nil
    }
}
```

Context carries deadlines, cancellation signals, and request-scoped values across API boundaries.

### Q93. How does `defer` work?

```go
func processFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close() // Runs when function returns, in LIFO order

    // Multiple defers: last-in, first-out
    defer fmt.Println("first")  // prints second
    defer fmt.Println("second") // prints first

    // Args evaluated immediately
    x := 10
    defer fmt.Println(x) // prints 10, even if x changes later
    x = 20

    return nil
}
```

### Q94. Explain the `sync` package — Mutex, RWMutex, WaitGroup.

```go
type SafeCounter struct {
    mu sync.RWMutex
    v  map[string]int
}

func (c *SafeCounter) Inc(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.v[key]++
}

func (c *SafeCounter) Get(key string) int {
    c.mu.RLock() // Multiple readers allowed
    defer c.mu.RUnlock()
    return c.v[key]
}

// WaitGroup
func main() {
    var wg sync.WaitGroup
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go func(n int) {
            defer wg.Done()
            fmt.Println(n)
        }(i)
    }
    wg.Wait() // Block until all goroutines complete
}
```

### Q95. What is a Go struct and embedding?

```go
type Base struct {
    ID        int
    CreatedAt time.Time
}

type User struct {
    Base          // Embedded — User "inherits" ID, CreatedAt
    Name  string
    Email string
}

func main() {
    u := User{Base: Base{ID: 1, CreatedAt: time.Now()}, Name: "Sourav"}
    fmt.Println(u.ID)        // Access promoted field directly
    fmt.Println(u.CreatedAt) // Works because Base is embedded
}
```

### Q96. How do you write HTTP handlers in Go?

```go
func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("GET /api/users/{id}", getUser)
    mux.HandleFunc("POST /api/users", createUser)

    // Middleware
    handler := loggingMiddleware(mux)
    log.Fatal(http.ListenAndServe(":8080", handler))
}

func getUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id") // Go 1.22+
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"id": id})
}

func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}
```

### Q97. Explain slices vs arrays in Go.

```go
// Array — fixed size, value type
arr := [3]int{1, 2, 3}

// Slice — dynamic, reference to underlying array
slice := []int{1, 2, 3}
slice = append(slice, 4) // May allocate new backing array

// Slice internals: pointer, length, capacity
s := make([]int, 3, 10)
fmt.Println(len(s), cap(s)) // 3, 10

// Gotcha: slicing shares the backing array
a := []int{1, 2, 3, 4, 5}
b := a[1:3]    // [2, 3] — shares memory with a
b[0] = 99
fmt.Println(a) // [1, 99, 3, 4, 5] — a is modified!

// Fix: use full slice expression
c := a[1:3:3]  // cap = 3-1 = 2, so append won't modify a
```

### Q98. What is the `init` function?

```go
var db *sql.DB

func init() {
    // Runs automatically before main()
    // Each file can have multiple init() functions
    var err error
    db, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))
    if err != nil {
        log.Fatal(err)
    }
}
```

`init` runs once per package when the package is imported, after all variable declarations. Execution order: imports → package-level vars → init() → main().

### Q99. How does Go's garbage collector work?

Go uses a **concurrent, tri-color mark-and-sweep** GC. Three colors: white (unreachable), gray (reachable, children not scanned), black (reachable, children scanned). It runs concurrently with application goroutines using a **write barrier** to maintain consistency. The GC aims for low latency (<1ms pauses) rather than maximum throughput.

### Q100. What is `sync.Once`?

```go
var (
    instance *Database
    once     sync.Once
)

func GetDB() *Database {
    once.Do(func() {
        // Guaranteed to execute exactly once, even with concurrent calls
        instance = &Database{conn: connect()}
    })
    return instance
}
```

### Q101. How do you implement a worker pool in Go?

```go
func workerPool(jobs <-chan int, results chan<- int, numWorkers int) {
    var wg sync.WaitGroup
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            for job := range jobs {
                results <- process(job)
            }
        }(i)
    }
    go func() {
        wg.Wait()
        close(results)
    }()
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    workerPool(jobs, results, 5)

    for i := 0; i < 50; i++ { jobs <- i }
    close(jobs)

    for r := range results { fmt.Println(r) }
}
```

### Q102. What is the difference between value and pointer receivers?

```go
type Point struct{ X, Y float64 }

// Value receiver — operates on a copy
func (p Point) Distance() float64 {
    return math.Sqrt(p.X*p.X + p.Y*p.Y)
}

// Pointer receiver — modifies the original
func (p *Point) Scale(factor float64) {
    p.X *= factor
    p.Y *= factor
}
```

Rule of thumb: use pointer receivers if the method mutates the receiver, or the struct is large.

### Q103. How do you write tests in Go?

```go
// math_test.go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 2, 3, 5},
        {"negative", -1, -2, -3},
        {"zero", 0, 0, 0},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d, want %d", tt.a, tt.b, result, tt.expected)
            }
        })
    }
}

// Benchmark
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(1, 2)
    }
}
```

### Q104. How does `json.Marshal` and struct tags work?

```go
type User struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email,omitempty"`
    Password  string    `json:"-"` // never serialized
    CreatedAt time.Time `json:"created_at"`
}

user := User{ID: 1, Name: "Sourav"}
data, _ := json.Marshal(user)
// {"id":1,"name":"Sourav","created_at":"0001-01-01T00:00:00Z"}
// email omitted (omitempty + zero value), password excluded
```

### Q105. What is a Go map and how do you handle concurrent access?

```go
// Regular map — NOT safe for concurrent access
m := map[string]int{"a": 1}

// sync.Map — safe for concurrent access
var sm sync.Map
sm.Store("key", 42)
val, ok := sm.Load("key")
sm.Range(func(key, value any) bool {
    fmt.Println(key, value)
    return true // continue iteration
})
```

### Q106. How do you implement graceful shutdown?

```go
func main() {
    srv := &http.Server{Addr: ":8080", Handler: mux}

    go func() {
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatal(err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("forced shutdown:", err)
    }
    log.Println("server exited gracefully")
}
```

### Q107. What is the `io.Reader`/`io.Writer` interface pattern?

```go
// io.Reader and io.Writer are fundamental Go interfaces
type Reader interface { Read(p []byte) (n int, err error) }
type Writer interface { Write(p []byte) (n int, err error) }

// Composable: file → gzip → base64 → network
func compressAndSend(src io.Reader, dst io.Writer) error {
    gzWriter := gzip.NewWriter(dst)
    defer gzWriter.Close()
    _, err := io.Copy(gzWriter, src) // streams, doesn't load all into memory
    return err
}
```

### Q108. How do you use `go generate`?

```go
//go:generate stringer -type=Color
type Color int

const (
    Red Color = iota
    Green
    Blue
)

// Run: go generate ./...
// Generates color_string.go with func (c Color) String() string
```

### Q109. Explain Go modules and versioning.

```bash
go mod init github.com/sourav/myapp  # Initialize module
go get github.com/lib/pq@v1.10.9    # Add dependency
go mod tidy                           # Clean unused deps
go mod vendor                         # Copy deps locally
```

```go
// go.mod
module github.com/sourav/myapp

go 1.22

require (
    github.com/lib/pq v1.10.9
    golang.org/x/sync v0.6.0
)
```

### Q110. What is the `errgroup` package?

```go
import "golang.org/x/sync/errgroup"

func fetchAll(ctx context.Context, urls []string) ([]string, error) {
    g, ctx := errgroup.WithContext(ctx)
    results := make([]string, len(urls))

    for i, url := range urls {
        i, url := i, url // capture loop vars
        g.Go(func() error {
            body, err := fetch(ctx, url)
            if err != nil { return err }
            results[i] = body
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err // returns first error, cancels context for others
    }
    return results, nil
}
```

### Q111. How do you implement middleware chaining in Go?

```go
type Middleware func(http.Handler) http.Handler

func Chain(handler http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        handler = middlewares[i](handler)
    }
    return handler
}

func CORS(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        next.ServeHTTP(w, r)
    })
}

func RateLimit(next http.Handler) http.Handler {
    limiter := rate.NewLimiter(10, 30)
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if !limiter.Allow() {
            http.Error(w, "Too many requests", 429)
            return
        }
        next.ServeHTTP(w, r)
    })
}

// Usage
handler := Chain(mux, CORS, RateLimit, Logging)
```

### Q112. What is `reflect` in Go?

```go
func inspect(v any) {
    t := reflect.TypeOf(v)
    val := reflect.ValueOf(v)

    fmt.Println("Type:", t.Name())
    fmt.Println("Kind:", t.Kind())

    if t.Kind() == reflect.Struct {
        for i := 0; i < t.NumField(); i++ {
            field := t.Field(i)
            fmt.Printf("  %s: %v (tag: %s)\n",
                field.Name,
                val.Field(i).Interface(),
                field.Tag.Get("json"))
        }
    }
}
```

Use reflect sparingly — it's slow and loses type safety. Common uses: JSON marshaling, ORM mapping, dependency injection.

### Q113. How do you implement retry with exponential backoff?

```go
func retry(ctx context.Context, maxRetries int, fn func() error) error {
    var err error
    for i := 0; i < maxRetries; i++ {
        if err = fn(); err == nil {
            return nil
        }

        backoff := time.Duration(1<<uint(i)) * 100 * time.Millisecond
        jitter := time.Duration(rand.Int63n(int64(backoff / 2)))
        wait := backoff + jitter

        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(wait):
        }
    }
    return fmt.Errorf("after %d retries: %w", maxRetries, err)
}
```

### Q114. What are Go build tags?

```go
//go:build integration
// +build integration

package db_test

func TestDatabaseIntegration(t *testing.T) {
    // Only runs with: go test -tags=integration ./...
}
```

### Q115. Explain the `slog` structured logging package.

```go
import "log/slog"

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    }))

    logger.Info("request handled",
        slog.String("method", "GET"),
        slog.String("path", "/api/users"),
        slog.Int("status", 200),
        slog.Duration("latency", 42*time.Millisecond),
    )
    // {"time":"2024-...","level":"INFO","msg":"request handled","method":"GET",...}
}
```

---

## Section 5: Databases — PostgreSQL, MongoDB, Redis (Q116–Q150)

### Q116. Explain PostgreSQL indexes: B-tree, GIN, GiST.

**B-tree** (default): equality and range queries. **GIN**: full-text search, JSONB containment, arrays. **GiST**: geometric data, nearest-neighbor, range types.

```sql
CREATE INDEX idx_users_email ON users(email);                  -- B-tree
CREATE INDEX idx_users_data ON users USING gin(metadata);       -- GIN for JSONB
CREATE INDEX idx_locations ON locations USING gist(coordinates); -- GiST for geometry
```

### Q117. What are PostgreSQL transactions and isolation levels?

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

COMMIT; -- or ROLLBACK
```

Isolation levels: **READ UNCOMMITTED** → **READ COMMITTED** (PG default) → **REPEATABLE READ** → **SERIALIZABLE**. Higher isolation = less concurrency anomalies but more potential for serialization failures.

### Q118. What is the N+1 query problem and how do you solve it?

```sql
-- ❌ N+1: 1 query for posts + N queries for authors
SELECT * FROM posts;
-- For each post: SELECT * FROM users WHERE id = post.author_id;

-- ✅ Join
SELECT p.*, u.name AS author_name
FROM posts p
JOIN users u ON p.author_id = u.id;

-- ✅ Batch loading
SELECT * FROM users WHERE id IN (1, 2, 3, 4, 5);
```

### Q119. Explain PostgreSQL JSONB operations.

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL
);

-- Insert
INSERT INTO products (data) VALUES ('{"name": "Phone", "specs": {"ram": 8, "storage": 128}}');

-- Query nested field
SELECT data->'specs'->>'ram' AS ram FROM products;

-- Filter with containment
SELECT * FROM products WHERE data @> '{"specs": {"ram": 8}}';

-- Update nested value
UPDATE products SET data = jsonb_set(data, '{specs,ram}', '16');

-- GIN index for fast lookups
CREATE INDEX idx_product_data ON products USING gin(data);
```

### Q120. What is `EXPLAIN ANALYZE` and how do you read query plans?

```sql
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.name
ORDER BY order_count DESC;

-- Key things to look for:
-- Seq Scan → missing index (consider adding one)
-- Hash Join vs Nested Loop → join strategy
-- Sort → check if index could eliminate sort
-- actual time= → real execution time
-- rows= → estimated vs actual row counts (large difference = stale stats)
```

### Q121. Explain database normalization (1NF through 3NF).

**1NF**: All columns contain atomic values, no repeating groups.
**2NF**: 1NF + no partial dependencies on composite keys.
**3NF**: 2NF + no transitive dependencies (non-key → non-key).

```sql
-- ❌ Not 3NF
CREATE TABLE orders (
  id INT, customer_name TEXT, customer_city TEXT, total DECIMAL
);
-- customer_city depends on customer_name, not on order id

-- ✅ 3NF
CREATE TABLE customers (id INT PRIMARY KEY, name TEXT, city TEXT);
CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT REFERENCES customers(id), total DECIMAL);
```

### Q122. What are CTEs (Common Table Expressions)?

```sql
-- Recursive CTE: find all subordinates of a manager
WITH RECURSIVE subordinates AS (
  SELECT id, name, manager_id FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.name, e.manager_id
  FROM employees e
  INNER JOIN subordinates s ON e.manager_id = s.id
)
SELECT * FROM subordinates;
```

### Q123. How do window functions work?

```sql
SELECT
  name,
  department,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank,
  SUM(salary) OVER (PARTITION BY department) AS dept_total,
  salary::float / SUM(salary) OVER (PARTITION BY department) * 100 AS pct_of_dept,
  LAG(salary) OVER (ORDER BY salary) AS prev_salary
FROM employees;
```

### Q124. Explain PostgreSQL partitioning.

```sql
CREATE TABLE events (
  id BIGSERIAL,
  created_at TIMESTAMP NOT NULL,
  data JSONB
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2024_q1 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE events_2024_q2 PARTITION OF events
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Queries automatically prune irrelevant partitions
SELECT * FROM events WHERE created_at >= '2024-02-01'; -- only scans events_2024_q1
```

### Q125. What is MongoDB aggregation pipeline?

```js
db.orders.aggregate([
  { $match: { status: "completed", createdAt: { $gte: ISODate("2024-01-01") } } },
  { $unwind: "$items" },
  { $group: {
      _id: "$items.category",
      totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      avgOrderValue: { $avg: "$items.price" },
      count: { $sum: 1 }
  }},
  { $sort: { totalRevenue: -1 } },
  { $limit: 10 }
]);
```

### Q126. When would you use MongoDB over PostgreSQL?

Use **MongoDB** when: schema evolves rapidly, document-oriented data, horizontal scaling is priority, flexible querying on nested structures.

Use **PostgreSQL** when: strong consistency and ACID transactions needed, complex joins, relational data, advanced SQL features (window functions, CTEs, full-text search).

### Q127. What are Redis data structures and their use cases?

```bash
# String — caching, counters
SET user:1:name "Sourav"
INCR page:views

# Hash — object storage
HSET user:1 name "Sourav" email "sourav@gmail.com"
HGETALL user:1

# List — queues, recent items
LPUSH notifications "new_order"
RPOP notifications

# Set — unique collections, tags
SADD post:1:tags "golang" "redis"
SINTER post:1:tags post:2:tags  # intersection

# Sorted Set — leaderboards, priority queues
ZADD leaderboard 100 "player1" 85 "player2"
ZREVRANGE leaderboard 0 9 WITHSCORES  # top 10

# Stream — event streaming
XADD events * type "order" amount 50
```

### Q128. How does Redis pub/sub work?

```bash
# Subscriber
SUBSCRIBE notifications

# Publisher
PUBLISH notifications '{"type":"order","id":123}'
```

```go
// Go implementation
sub := rdb.Subscribe(ctx, "notifications")
for msg := range sub.Channel() {
    fmt.Println("Received:", msg.Payload)
}
```

Limitations: messages are fire-and-forget (no persistence), no consumer groups. For durability, use Redis Streams.

### Q129. Explain Redis caching strategies.

```go
func GetUser(ctx context.Context, id string) (*User, error) {
    // Cache-aside (Lazy Loading)
    cached, err := redis.Get(ctx, "user:"+id).Result()
    if err == nil {
        var user User
        json.Unmarshal([]byte(cached), &user)
        return &user, nil
    }

    user, err := db.GetUser(ctx, id)
    if err != nil { return nil, err }

    data, _ := json.Marshal(user)
    redis.Set(ctx, "user:"+id, data, 15*time.Minute) // TTL
    return user, nil
}

// Write-through: update cache on every write
func UpdateUser(ctx context.Context, user *User) error {
    if err := db.Update(ctx, user); err != nil { return err }
    data, _ := json.Marshal(user)
    return redis.Set(ctx, "user:"+user.ID, data, 15*time.Minute).Err()
}
```

### Q130. What is database connection pooling?

```go
db, err := sql.Open("postgres", connStr)
db.SetMaxOpenConns(25)        // Max simultaneous connections
db.SetMaxIdleConns(10)        // Keep idle connections ready
db.SetConnMaxLifetime(5 * time.Minute)
db.SetConnMaxIdleTime(1 * time.Minute)
```

Connection pooling reuses database connections instead of creating new ones per request. This reduces latency and prevents exhausting database connection limits.

### Q131. What are PostgreSQL triggers?

```sql
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_modtime
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
```

### Q132. Explain database migrations strategy.

```sql
-- migrations/001_create_users.up.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- migrations/001_create_users.down.sql
DROP TABLE users;
```

```bash
# Using golang-migrate
migrate -path ./migrations -database "postgres://..." up
migrate -path ./migrations -database "postgres://..." down 1
```

Always: make migrations idempotent, test rollbacks, never modify applied migrations, use sequential numbering.

### Q133. What is Redis rate limiting?

```go
func RateLimit(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
    pipe := rdb.Pipeline()
    now := time.Now().UnixMilli()

    // Sliding window with sorted set
    pipe.ZRemRangeByScore(ctx, key, "0", fmt.Sprintf("%d", now-window.Milliseconds()))
    pipe.ZAdd(ctx, key, redis.Z{Score: float64(now), Member: now})
    countCmd := pipe.ZCard(ctx, key)
    pipe.Expire(ctx, key, window)

    _, err := pipe.Exec(ctx)
    if err != nil { return false, err }

    return countCmd.Val() <= int64(limit), nil
}
```

### Q134. Explain PostgreSQL materialized views.

```sql
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT
  date_trunc('month', created_at) AS month,
  product_id,
  SUM(amount) AS total,
  COUNT(*) AS order_count
FROM orders
GROUP BY month, product_id;

-- Refresh (blocks reads during refresh)
REFRESH MATERIALIZED VIEW monthly_sales;

-- Concurrent refresh (doesn't block reads, requires unique index)
CREATE UNIQUE INDEX idx_monthly_sales ON monthly_sales(month, product_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;
```

### Q135. What is optimistic vs pessimistic locking?

```sql
-- Pessimistic: lock rows until transaction completes
BEGIN;
SELECT * FROM inventory WHERE product_id = 1 FOR UPDATE;
UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;
COMMIT;

-- Optimistic: check version on update
UPDATE inventory
SET quantity = quantity - 1, version = version + 1
WHERE product_id = 1 AND version = 5;
-- If affected rows = 0, someone else modified it → retry
```

### Q136. How do you handle full-text search in PostgreSQL?

```sql
ALTER TABLE articles ADD COLUMN search_vector tsvector;

UPDATE articles SET search_vector =
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('english', body), 'B');

CREATE INDEX idx_articles_search ON articles USING gin(search_vector);

-- Query
SELECT title, ts_rank(search_vector, query) AS rank
FROM articles, to_tsquery('english', 'golang & microservices') AS query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

### Q137. What is Redis distributed locking (Redlock)?

```go
func AcquireLock(ctx context.Context, key string, ttl time.Duration) (bool, error) {
    lockKey := "lock:" + key
    token := uuid.New().String()

    ok, err := rdb.SetNX(ctx, lockKey, token, ttl).Result()
    if err != nil || !ok { return false, err }

    return true, nil // Return token to release later
}

func ReleaseLock(ctx context.Context, key, token string) error {
    // Lua script ensures atomic check-and-delete
    script := `
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        end
        return 0
    `
    return rdb.Eval(ctx, script, []string{"lock:" + key}, token).Err()
}
```

### Q138. Explain MongoDB indexes and their types.

```js
// Single field
db.users.createIndex({ email: 1 });

// Compound
db.orders.createIndex({ userId: 1, createdAt: -1 });

// Text index for search
db.articles.createIndex({ title: "text", body: "text" });

// TTL index — auto-delete after expiry
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// Partial index — only index matching documents
db.orders.createIndex(
  { status: 1 },
  { partialFilterExpression: { status: "pending" } }
);
```

### Q139. What is a database deadlock and how do you prevent it?

A deadlock occurs when two transactions each hold a lock the other needs.

```sql
-- Transaction A: locks row 1, then tries row 2
-- Transaction B: locks row 2, then tries row 1
-- → Deadlock!

-- Prevention strategies:
-- 1. Always access tables/rows in consistent order
-- 2. Keep transactions short
-- 3. Use lock timeouts
SET lock_timeout = '5s';
-- 4. Use NOWAIT
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;
```

### Q140. How do you design a schema for a campaign management system?

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'push', 'sms')),
  status TEXT DEFAULT 'draft',
  target_audience JSONB,  -- flexible targeting rules
  schedule TSTZRANGE,      -- start-end range
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_metrics (
  campaign_id UUID REFERENCES campaigns(id),
  date DATE,
  sent INT DEFAULT 0,
  delivered INT DEFAULT 0,
  opened INT DEFAULT 0,
  clicked INT DEFAULT 0,
  PRIMARY KEY (campaign_id, date)
);

-- Partition metrics by month for performance
```

### Q141-Q145. Quick-fire Database Questions

**Q141. What is VACUUM in PostgreSQL?**
VACUUM reclaims storage from dead tuples left by updates/deletes (MVCC). `VACUUM ANALYZE` also updates statistics. `AUTOVACUUM` runs automatically.

**Q142. What is the difference between `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`, `FULL OUTER JOIN`?**
INNER: rows matching in both tables. LEFT: all from left + matching right. RIGHT: all from right + matching left. FULL OUTER: all rows from both, NULL where no match.

**Q143. What is a covering index?**
An index that includes all columns needed by a query, allowing an "index-only scan" without accessing the table.
```sql
CREATE INDEX idx_orders_cover ON orders(customer_id) INCLUDE (total, created_at);
```

**Q144. What is Redis pipelining?**
Sending multiple commands at once without waiting for individual responses, reducing round trips.
```go
pipe := rdb.Pipeline()
pipe.Set(ctx, "a", 1, 0)
pipe.Set(ctx, "b", 2, 0)
pipe.Incr(ctx, "counter")
pipe.Exec(ctx) // One round trip
```

**Q145. What is `RETURNING` in PostgreSQL?**
```sql
INSERT INTO users (name, email) VALUES ('Sourav', 'sourav@test.com')
RETURNING id, created_at;
-- Returns the auto-generated id and timestamp without a second query
```

### Q146-Q150. More Database Questions

**Q146. What is a PostgreSQL extension?**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- Trigram similarity
CREATE EXTENSION IF NOT EXISTS "postgis";     -- Geospatial
```

**Q147. Explain MongoDB change streams.**
```js
const changeStream = db.collection('orders').watch([
  { $match: { operationType: { $in: ['insert', 'update'] } } }
]);
changeStream.on('change', (event) => {
  console.log('Change detected:', event.operationType, event.fullDocument);
});
```

**Q148. What is Redis Lua scripting?**
Lua scripts execute atomically on Redis server, eliminating race conditions.
```lua
-- Atomic check-and-set
local current = redis.call('GET', KEYS[1])
if current == ARGV[1] then
    redis.call('SET', KEYS[1], ARGV[2])
    return 1
end
return 0
```

**Q149. How do you implement soft deletes?**
```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_users_active ON users(id) WHERE deleted_at IS NULL;

-- "Delete"
UPDATE users SET deleted_at = NOW() WHERE id = 1;

-- Query only active
SELECT * FROM users WHERE deleted_at IS NULL;
```

**Q150. What are advisory locks in PostgreSQL?**
```sql
SELECT pg_advisory_lock(hashtext('import_job_123'));
-- Do exclusive work...
SELECT pg_advisory_unlock(hashtext('import_job_123'));
```

---

## Section 6: System Design & Architecture (Q151–Q180)

### Q151. How would you design a real-time ride tracking system (like Pathao)?

Key components:
- **Driver location ingestion**: WebSocket/MQTT connections from drivers, publishing location updates to a message broker (Kafka/Redis Streams)
- **Geospatial indexing**: Use Redis GeoHash or PostGIS to store and query nearby drivers efficiently (`GEOSEARCH`)
- **Matching engine**: Consumes ride requests, finds nearest available drivers, assigns optimally
- **Client updates**: WebSocket connections push driver location to riders at 1-2 second intervals
- **Data pipeline**: Stream locations to BigQuery/ClickHouse for analytics

### Q152. Explain microservices vs monolith trade-offs.

**Monolith**: simpler deployment, easier debugging, lower latency (no network calls), good for small teams. Risk: tight coupling, scaling entire app for one bottleneck.

**Microservices**: independent scaling/deployment, technology diversity, team autonomy. Cost: distributed system complexity (networking, data consistency, observability), operational overhead.

Start monolith, extract services when you identify clear bounded contexts with different scaling needs.

### Q153. What is event-driven architecture?

```
Producer → Event Broker (Kafka) → Consumer Groups

Order Service → "order.created" event → [Inventory Service, Notification Service, Analytics]
```

Benefits: loose coupling, scalability, auditability (event log). Challenges: eventual consistency, debugging event flows, ensuring idempotency.

### Q154. How do you design an API rate limiter?

Algorithms:
1. **Token bucket**: tokens refill at fixed rate, each request consumes a token
2. **Sliding window**: count requests in a rolling time window
3. **Fixed window counter**: simple but has boundary burst issues

```go
// Token bucket with Redis
func tokenBucket(ctx context.Context, key string, rate, capacity int) bool {
    script := `
        local tokens = tonumber(redis.call("get", KEYS[1]) or ARGV[2])
        local lastRefill = tonumber(redis.call("get", KEYS[2]) or ARGV[3])
        local now = tonumber(ARGV[3])
        local elapsed = now - lastRefill
        tokens = math.min(tonumber(ARGV[2]), tokens + elapsed * tonumber(ARGV[1]))
        if tokens >= 1 then
            tokens = tokens - 1
            redis.call("set", KEYS[1], tokens)
            redis.call("set", KEYS[2], now)
            return 1
        end
        return 0
    `
    // Execute atomically
}
```

### Q155. What is CQRS (Command Query Responsibility Segregation)?

Separate read and write models:
- **Command side**: handles writes, validates business rules, stores in normalized DB
- **Query side**: optimized read models (denormalized, materialized views, search indices)
- **Sync**: events propagate changes from write to read model

Useful for systems like your campaign platform where writes are complex but reads need to be fast and flexible.

### Q156. How would you design a notification system?

```
┌──────────────┐     ┌──────────┐     ┌───────────────┐
│ Event Source  │ ──→ │  Queue   │ ──→ │ Router/Fanout │
│ (API/Events) │     │ (Kafka)  │     │               │
└──────────────┘     └──────────┘     └───┬───┬───┬───┘
                                          │   │   │
                                    Push  SMS Email
                                    ┌──┐ ┌──┐ ┌──┐
                                    │WS│ │Tw│ │SG│
                                    └──┘ └──┘ └──┘
```

Key decisions: delivery guarantees (at-least-once), deduplication, user preferences, rate limiting per channel, retry with backoff, batching/digests.

### Q157. Explain the CAP theorem.

In a distributed system, you can guarantee at most two of:
- **Consistency**: every read returns the most recent write
- **Availability**: every request gets a response
- **Partition tolerance**: system works despite network partitions

Since network partitions are inevitable, the real choice is CP (consistency over availability, e.g., PostgreSQL) or AP (availability over consistency, e.g., Cassandra, DynamoDB).

### Q158. How would you design a URL shortener?

```
Write: POST /shorten {"url": "https://long.com/..."} → "https://short.ly/abc123"
Read:  GET /abc123 → 301 Redirect to original URL
```

- **ID generation**: Base62 encoding of auto-increment ID or random 6-7 char string
- **Storage**: Redis for hot lookups + PostgreSQL for persistence
- **Scaling**: Read-heavy → cache aggressively, shard by hash of short code
- **Analytics**: Log clicks asynchronously to event stream

### Q159. What is a circuit breaker pattern?

```go
type CircuitBreaker struct {
    failures    int
    threshold   int
    state       string // "closed", "open", "half-open"
    lastFailure time.Time
    cooldown    time.Duration
}

func (cb *CircuitBreaker) Execute(fn func() error) error {
    if cb.state == "open" {
        if time.Since(cb.lastFailure) > cb.cooldown {
            cb.state = "half-open"
        } else {
            return errors.New("circuit open")
        }
    }

    err := fn()
    if err != nil {
        cb.failures++
        cb.lastFailure = time.Now()
        if cb.failures >= cb.threshold { cb.state = "open" }
        return err
    }

    cb.failures = 0
    cb.state = "closed"
    return nil
}
```

### Q160. How do you handle distributed transactions?

**Saga pattern**: sequence of local transactions with compensating actions.

```
CreateOrder → ReserveInventory → ProcessPayment → ConfirmOrder
                                    ↓ (fails)
                               ReleaseInventory ← CancelOrder
```

**Two-phase commit (2PC)**: coordinator asks all participants to prepare, then commit. Strong consistency but blocking and slow.

Prefer sagas for microservices — better availability and resilience.

### Q161. Design a file upload system supporting XLSX bulk uploads.

```
Client → Presigned URL (S3) → Upload directly to S3
                                      ↓
                              S3 Event → Lambda/Worker
                                      ↓
                              Parse XLSX → Validate rows
                                      ↓
                              Batch insert to DB (chunks of 1000)
                                      ↓
                              Update status → Notify user via WebSocket
```

Key: chunked processing, progress tracking, error reports per row, idempotency keys to prevent duplicate processing.

### Q162. What is the difference between horizontal and vertical scaling?

**Vertical**: bigger machine (more CPU/RAM). Simple but has limits.
**Horizontal**: more machines behind a load balancer. Complex but virtually unlimited.

Stateless services scale horizontally easily. Stateful services (databases) need sharding, replication, or managed solutions.

### Q163. How would you design a gamification/mission system?

```sql
-- Mission definition
CREATE TABLE missions (
  id UUID PRIMARY KEY,
  name TEXT, type TEXT, -- "streak", "cumulative", "one-time"
  target_count INT,
  reward_type TEXT, reward_value INT
);

-- User progress (event-sourced)
CREATE TABLE mission_events (
  id BIGSERIAL, user_id INT, mission_id UUID,
  event_type TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized progress
CREATE TABLE mission_progress (
  user_id INT, mission_id UUID,
  current_count INT DEFAULT 0, completed BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, mission_id)
);
```

Architecture: Event listeners consume user actions → check against mission rules → update progress → trigger rewards.

### Q164. What is load balancing? Compare algorithms.

- **Round Robin**: distribute sequentially
- **Weighted Round Robin**: more traffic to beefier servers
- **Least Connections**: route to server with fewest active connections
- **IP Hash**: consistent routing for session affinity
- **Random**: surprisingly effective with large server pools

### Q165. How do you implement health checks?

```go
func healthHandler(w http.ResponseWriter, r *http.Request) {
    checks := map[string]string{}

    // DB check
    if err := db.PingContext(r.Context()); err != nil {
        checks["database"] = "unhealthy"
    } else {
        checks["database"] = "healthy"
    }

    // Redis check
    if err := rdb.Ping(r.Context()).Err(); err != nil {
        checks["redis"] = "unhealthy"
    } else {
        checks["redis"] = "healthy"
    }

    status := http.StatusOK
    for _, v := range checks {
        if v == "unhealthy" { status = http.StatusServiceUnavailable; break }
    }

    w.WriteHeader(status)
    json.NewEncoder(w).Encode(checks)
}
```

### Q166-Q170. Quick-fire System Design

**Q166. What is a message queue and when to use it?**
Decouple producers from consumers, buffer spikes, enable async processing. Use for: email sending, image processing, analytics events.

**Q167. What is database sharding?**
Splitting data across multiple database instances by a shard key (e.g., user_id % num_shards). Increases write throughput but complicates cross-shard queries.

**Q168. What is a CDN?**
Content Delivery Network caches static assets at edge locations worldwide, reducing latency. Use for images, JS/CSS, videos.

**Q169. What is back-pressure?**
When a system can't keep up with incoming data, it signals upstream to slow down. Implementations: bounded queues, rate limiting, reactive streams.

**Q170. What is eventual consistency?**
Replicas may temporarily diverge but will converge given enough time. Acceptable for: social feeds, analytics. Not for: financial transactions, inventory counts.

### Q171-Q175. Architecture Patterns

**Q171. What is the Strangler Fig pattern?**
Incrementally replace a legacy system by routing traffic to new services while keeping old ones running. Each new feature is built in the new system; old routes are deprecated over time.

**Q172. What is a sidecar pattern?**
Deploy a helper container alongside the main service container (in the same pod in K8s) for cross-cutting concerns: logging, monitoring, proxy, config management.

**Q173. What is the BFF (Backend for Frontend) pattern?**
Dedicated backend service per frontend type (mobile, web, admin) that aggregates and shapes data from microservices for that specific client's needs.

**Q174. What is blue-green deployment?**
Maintain two identical environments. Deploy to inactive (green), test, switch traffic from active (blue) to green. Instant rollback by switching back.

**Q175. What is canary deployment?**
Route a small percentage of traffic to the new version, monitor metrics, gradually increase traffic if healthy.

### Q176-Q180. More System Design

**Q176. Design a POI (Point of Interest) validation system.**
Users submit POIs → moderation queue with RBAC → validators review with map interface → approved POIs enter main database → periodic cross-validation against other sources.

**Q177. How would you design real-time analytics?**
Stream events to Kafka → process with consumers (aggregate in Redis/ClickHouse) → serve via API → display in dashboard with WebSocket updates.

**Q178. What is data locality and why does it matter?**
Store related data close together (same partition/shard). Reduces network hops and improves query performance. Example: co-locate user data with their orders.

**Q179. How do you handle idempotency in APIs?**
```go
func createOrder(w http.ResponseWriter, r *http.Request) {
    idempotencyKey := r.Header.Get("Idempotency-Key")
    cached, err := redis.Get(ctx, "idem:"+idempotencyKey)
    if err == nil {
        json.NewEncoder(w).Encode(cached) // Return cached response
        return
    }
    // Process order... then cache result with TTL
    redis.Set(ctx, "idem:"+idempotencyKey, result, 24*time.Hour)
}
```

**Q180. What is observability? The three pillars.**
1. **Logs**: structured event records (slog, ELK stack)
2. **Metrics**: numeric measurements over time (Prometheus, Grafana)
3. **Traces**: request flow across services (OpenTelemetry, Jaeger)

---

## Section 7: Docker & DevOps (Q181–Q195)

### Q181. Write a multi-stage Dockerfile for a Go app.

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# Runtime stage
FROM alpine:3.19
RUN apk --no-cache add ca-certificates
COPY --from=builder /server /server
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```

### Q182. What is Docker Compose and when to use it?

```yaml
version: "3.9"
services:
  app:
    build: .
    ports: ["8080:8080"]
    environment:
      DATABASE_URL: postgres://postgres:secret@db:5432/app
    depends_on:
      db: { condition: service_healthy }

  db:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD", "pg_isready"]
      interval: 5s

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
```

### Q183. What are Docker networking modes?

- **bridge** (default): containers on same bridge can communicate by service name
- **host**: container shares host's network stack (no isolation)
- **none**: no networking
- **overlay**: multi-host networking (Docker Swarm/K8s)

### Q184. How do you optimize Docker images?

1. Use multi-stage builds
2. Use slim/alpine base images
3. Order layers by change frequency (deps first, code last)
4. Use `.dockerignore` to exclude unnecessary files
5. Combine RUN commands to reduce layers
6. Don't install unnecessary packages

### Q185. What is a Docker volume vs bind mount?

```yaml
# Volume — managed by Docker, persistent, portable
volumes:
  - pgdata:/var/lib/postgresql/data

# Bind mount — maps host directory, good for development
volumes:
  - ./src:/app/src
```

### Q186-Q190. DevOps Quick-fire

**Q186. What is CI/CD?**
Continuous Integration: automatically build/test on every commit. Continuous Deployment: automatically deploy passing builds to production.

**Q187. What is infrastructure as code (IaC)?**
Define infrastructure in declarative config files (Terraform, Pulumi). Version-controlled, reproducible, auditable.

**Q188. What are environment variables best practices?**
Never commit secrets to code. Use `.env` files for local dev, secret managers (AWS SSM, Vault) for production. Validate required env vars at startup.

**Q189. What is a reverse proxy?**
Sits in front of servers, handling: SSL termination, load balancing, caching, compression, rate limiting. Examples: Nginx, Caddy, Traefik.

**Q190. What is Docker layer caching?**
Docker caches each layer. If a layer and all preceding layers haven't changed, Docker reuses the cache. Copy dependency files before source code to maximize cache hits.

### Q191-Q195. More DevOps

**Q191. How do you handle secrets in Docker?**
Use Docker secrets (Swarm), environment variables from secret managers, or mounted secret files. Never bake secrets into images.

**Q192. What is a health check in Docker?**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
```

**Q193. What is container orchestration?**
Managing deployment, scaling, and networking of containers. Kubernetes is the standard. Handles: auto-scaling, self-healing, rolling updates, service discovery.

**Q194. What is a Dockerfile ENTRYPOINT vs CMD?**
`ENTRYPOINT` sets the main executable (hard to override). `CMD` provides default arguments (easily overridden). Combine: `ENTRYPOINT ["./server"]` + `CMD ["--port=8080"]`.

**Q195. How do you debug a running container?**
```bash
docker exec -it <container> sh        # Shell into container
docker logs -f <container>              # Stream logs
docker stats <container>                # Resource usage
docker inspect <container>              # Full config/state
```

---

## Section 8: WebSocket & Real-Time Systems (Q196–Q210)

### Q196. How does the WebSocket protocol work?

WebSocket starts as an HTTP upgrade request, then switches to a full-duplex TCP connection.

```
Client: GET /ws HTTP/1.1
        Upgrade: websocket
        Connection: Upgrade
        Sec-WebSocket-Key: dGhlIHNhbXBsZS...

Server: HTTP/1.1 101 Switching Protocols
        Upgrade: websocket
        Sec-WebSocket-Accept: s3pPLMBiTxaQ9k...
```

After handshake, both sides can send messages freely without HTTP overhead.

### Q197. How does Socket.IO differ from raw WebSocket?

Socket.IO adds: automatic reconnection, fallback to long-polling, rooms/namespaces, acknowledgments, binary support, and multiplexing. It's not compatible with raw WebSocket clients.

```js
// Server
io.on("connection", (socket) => {
  socket.join("room:123");
  socket.to("room:123").emit("message", { text: "hello" });

  socket.on("typing", (data) => {
    socket.to("room:123").emit("typing", data);
  });
});
```

### Q198. How do you handle WebSocket scaling across multiple servers?

Use a **pub/sub** adapter (Redis adapter for Socket.IO):

```js
import { createAdapter } from "@socket.io/redis-adapter";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
// Now events are broadcast across all server instances via Redis
```

### Q199. What is optimistic concurrency in real-time systems?

Allow operations immediately on the client, then reconcile with the server. If conflict, roll back or merge.

```js
// Client sends update with version
socket.emit("update_order", { id: "123", status: "confirmed", version: 5 });

// Server checks version
socket.on("update_order", async (data) => {
  const current = await db.getOrder(data.id);
  if (current.version !== data.version) {
    socket.emit("conflict", { current, attempted: data });
    return;
  }
  await db.updateOrder(data.id, { ...data, version: data.version + 1 });
  io.to("order:" + data.id).emit("order_updated", data);
});
```

### Q200. What is Server-Sent Events (SSE) and when to use it over WebSocket?

SSE is unidirectional (server → client) over HTTP. Simpler than WebSocket when you only need server push.

```js
// Server (Node.js)
app.get("/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ time: new Date() })}\n\n`);
  }, 1000);

  req.on("close", () => clearInterval(interval));
});

// Client
const source = new EventSource("/events");
source.onmessage = (event) => console.log(JSON.parse(event.data));
```

### Q201-Q205. Real-Time Quick-fire

**Q201. What is long polling?**
Client sends request, server holds it open until data is available (or timeout), then client immediately re-requests. Fallback when WebSocket isn't available.

**Q202. How do you handle reconnection in WebSocket?**
Implement exponential backoff with jitter. Track message IDs to request missed messages on reconnect. Use a message buffer on the server.

**Q203. What is a heartbeat/ping-pong mechanism?**
Periodic messages to detect dead connections. WebSocket protocol has native ping/pong frames. If no pong received within timeout, close and reconnect.

**Q204. What is backpressure in real-time systems?**
When clients can't consume messages as fast as they're produced. Solutions: drop old messages, buffer with limits, throttle the producer, or use flow control.

**Q205. How do you authenticate WebSocket connections?**
Send auth token in the initial HTTP upgrade request (query param or cookie). Validate before completing handshake.

### Q206-Q210. Advanced Real-Time

**Q206. What is CRDT (Conflict-free Replicated Data Type)?**
Data structures that can be merged without conflicts. Useful for collaborative editing. Types: G-Counter, PN-Counter, LWW-Register, OR-Set.

**Q207. How does Pathao's real-time driver tracking likely work?**
Drivers send GPS coordinates via WebSocket/MQTT → ingested into message broker → geo-indexed in Redis/PostGIS → rider's app subscribes to driver updates → push via WebSocket at 1-2s intervals.

**Q208. What is message ordering in distributed systems?**
Ensure messages arrive in correct order. Solutions: sequence numbers, vector clocks, single-partition Kafka topics (ordered within partition).

**Q209. How do you load test WebSocket endpoints?**
Tools like `k6`, `Artillery`, or `ws` to simulate thousands of concurrent connections, measuring: connection time, message latency, throughput, memory per connection.

**Q210. What is the actor model for real-time systems?**
Each entity (user, room, game) is an "actor" with its own state and mailbox. Actors process messages sequentially, eliminating shared state concurrency issues.

---

## Section 9: Authentication & Security (Q211–Q220)

### Q211. How does JWT authentication work?

```go
// Create token
claims := jwt.MapClaims{
    "user_id": user.ID,
    "role":    user.Role,
    "exp":     time.Now().Add(15 * time.Minute).Unix(),
}
token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
signed, _ := token.SignedString([]byte(secretKey))

// Verify token
parsed, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
    if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
        return nil, fmt.Errorf("unexpected signing method")
    }
    return []byte(secretKey), nil
})
```

### Q212. What is OAuth 2.0 flow?

```
1. Client → Auth Server: Authorization request
2. User authenticates and consents
3. Auth Server → Client: Authorization code
4. Client → Auth Server: Exchange code for access token
5. Client → Resource Server: Use access token
6. Refresh token flow for new access tokens without re-auth
```

### Q213. What is CSRF and how to prevent it?

Cross-Site Request Forgery: attacker tricks user's browser into making authenticated requests.

Prevention: SameSite cookies, CSRF tokens in forms, check `Origin`/`Referer` headers.

### Q214. What is XSS and how to prevent it?

Cross-Site Scripting: injecting malicious scripts.

Prevention: sanitize user input, escape output, use Content-Security-Policy headers, use `httpOnly` cookies, avoid `dangerouslySetInnerHTML`.

### Q215. What is CORS?

```go
func CORS(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "https://app.pathao.com")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
        w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
        w.Header().Set("Access-Control-Allow-Credentials", "true")

        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

### Q216-Q220. Security Quick-fire

**Q216. What is bcrypt and why use it for passwords?**
Bcrypt is an adaptive hash function with built-in salt and configurable work factor. Slow by design to resist brute-force attacks.

**Q217. What is the principle of least privilege?**
Grant the minimum permissions needed. RBAC enforces this: viewer can read, editor can write, admin can manage.

**Q218. What are HTTP security headers?**
`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`, `Referrer-Policy`.

**Q219. What is SQL injection and how to prevent it?**
```sql
-- ❌ Vulnerable
query := "SELECT * FROM users WHERE email = '" + email + "'"

-- ✅ Parameterized query
db.Query("SELECT * FROM users WHERE email = $1", email)
```

**Q220. What is rate limiting for security?**
Limit login attempts per IP/account (e.g., 5 attempts per 15 minutes). Use progressive delays or CAPTCHA after threshold.

---

## Section 10: Data Structures & Algorithms (Q221–Q240)

### Q221. Implement a hash map from scratch.

```js
class HashMap {
  constructor(size = 53) {
    this.buckets = new Array(size);
    this.size = size;
  }

  _hash(key) {
    let total = 0;
    for (let i = 0; i < Math.min(key.length, 100); i++) {
      total = (total * 31 + key.charCodeAt(i)) % this.size;
    }
    return total;
  }

  set(key, value) {
    const idx = this._hash(key);
    if (!this.buckets[idx]) this.buckets[idx] = [];
    const existing = this.buckets[idx].find(([k]) => k === key);
    if (existing) existing[1] = value;
    else this.buckets[idx].push([key, value]);
  }

  get(key) {
    const idx = this._hash(key);
    const pair = this.buckets[idx]?.find(([k]) => k === key);
    return pair ? pair[1] : undefined;
  }
}
```

### Q222. Implement BFS and DFS.

```js
function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const result = [];

  while (queue.length) {
    const node = queue.shift();
    result.push(node);
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return result;
}

function dfs(graph, start, visited = new Set()) {
  visited.add(start);
  const result = [start];
  for (const neighbor of graph[start]) {
    if (!visited.has(neighbor)) {
      result.push(...dfs(graph, neighbor, visited));
    }
  }
  return result;
}
```

### Q223. What is Big O notation? Common complexities.

```
O(1)       — Hash map lookup, array index access
O(log n)   — Binary search, balanced BST operations
O(n)       — Linear search, single loop
O(n log n) — Merge sort, heap sort
O(n²)      — Bubble sort, nested loops
O(2ⁿ)      — Recursive Fibonacci, power set
O(n!)      — Permutations
```

### Q224. Implement binary search.

```js
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1; // not found
}
```

### Q225. Implement a LRU Cache.

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map preserves insertion order
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value); // Move to end (most recent)
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      this.cache.delete(this.cache.keys().next().value); // Remove oldest
    }
  }
}
```

### Q226. Implement a Trie (prefix tree).

```js
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class Trie {
  constructor() { this.root = new TrieNode(); }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) node.children[char] = new TrieNode();
      node = node.children[char];
    }
    node.isEnd = true;
  }

  search(word) {
    const node = this._traverse(word);
    return node !== null && node.isEnd;
  }

  startsWith(prefix) {
    return this._traverse(prefix) !== null;
  }

  _traverse(str) {
    let node = this.root;
    for (const char of str) {
      if (!node.children[char]) return null;
      node = node.children[char];
    }
    return node;
  }
}
```

### Q227. Implement merge sort.

```js
function mergeSort(arr) {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }

  return [...result, ...left.slice(i), ...right.slice(j)];
}
```

### Q228. Two Sum — O(n) solution.

```js
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}
```

### Q229. Detect a cycle in a linked list.

```js
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

### Q230. Implement a min-heap / priority queue.

```js
class MinHeap {
  constructor() { this.heap = []; }

  push(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent] <= this.heap[i]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const length = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1, right = 2 * i + 2;
      if (left < length && this.heap[left] < this.heap[smallest]) smallest = left;
      if (right < length && this.heap[right] < this.heap[smallest]) smallest = right;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}
```

### Q231-Q240. Algorithm Quick-fire

**Q231. Reverse a linked list.**
```js
function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}
```

**Q232. Check if a string is a palindrome.**
```js
const isPalindrome = (s) => {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === [...clean].reverse().join("");
};
```

**Q233. Find the maximum subarray sum (Kadane's algorithm).**
```js
function maxSubArray(nums) {
  let maxSum = nums[0], currentSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}
```

**Q234. Check balanced parentheses.**
```js
function isValid(s) {
  const stack = [];
  const pairs = { ")": "(", "}": "{", "]": "[" };
  for (const char of s) {
    if ("({[".includes(char)) stack.push(char);
    else if (stack.pop() !== pairs[char]) return false;
  }
  return stack.length === 0;
}
```

**Q235. Find the first non-repeating character.**
```js
function firstUnique(s) {
  const freq = {};
  for (const c of s) freq[c] = (freq[c] || 0) + 1;
  for (const c of s) if (freq[c] === 1) return c;
  return null;
}
```

**Q236. Implement debounced search with a trie.**
Combine the trie from Q226 with the debounce from Q8 for autocomplete with prefix matching.

**Q237. Flatten a nested array.**
```js
function flatten(arr) {
  return arr.reduce((acc, val) =>
    acc.concat(Array.isArray(val) ? flatten(val) : val), []);
}
// Or: arr.flat(Infinity)
```

**Q238. Find the kth largest element.**
```js
function kthLargest(nums, k) {
  const heap = new MinHeap();
  for (const num of nums) {
    heap.push(num);
    if (heap.heap.length > k) heap.pop();
  }
  return heap.pop();
}
// O(n log k) — better than sorting O(n log n) for small k
```

**Q239. Implement memoization.**
```js
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const fib = memoize((n) => (n <= 1 ? n : fib(n - 1) + fib(n - 2)));
fib(50); // Instant — without memo this would be 2^50 calls
```

**Q240. Topological sort (for dependency resolution).**
```js
function topologicalSort(graph) {
  const visited = new Set(), result = [];

  function dfs(node) {
    if (visited.has(node)) return;
    visited.add(node);
    for (const dep of (graph[node] || [])) dfs(dep);
    result.push(node);
  }

  for (const node of Object.keys(graph)) dfs(node);
  return result.reverse();
}
```

---

## Section 10: AI/ML & NLP (Q241–Q250)

### Q241. What is TensorFlow Lite and how did you use it for obstacle detection?

TensorFlow Lite is a lightweight ML runtime for mobile/edge devices. It converts trained TF models to a compact `.tflite` format optimized for inference.

```java
// Android inference
Interpreter tflite = new Interpreter(loadModelFile("detect.tflite"));
float[][] input = preprocessImage(bitmap);
float[][] output = new float[1][NUM_CLASSES];
tflite.run(input, output);
```

### Q242. What is transfer learning?

Using a pre-trained model (e.g., MobileNet trained on ImageNet) as a starting point, then fine-tuning the last few layers on your specific dataset. Dramatically reduces training time and data requirements.

```python
base_model = tf.keras.applications.MobileNetV2(weights='imagenet', include_top=False)
base_model.trainable = False  # Freeze base layers

model = tf.keras.Sequential([
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dense(NUM_CLASSES, activation='softmax')
])
```

### Q243. What is IPA transcription and how did you approach it for Bengali?

IPA (International Phonetic Alphabet) maps speech sounds to symbols. For Bengali, you built a sequence-to-sequence model that takes Bengali text input and outputs IPA phonetic notation.

Key challenges: handling consonant clusters, vowel harmony, regional dialectal variations, and the many-to-many mapping between graphemes and phonemes.

### Q244. What is the difference between supervised, unsupervised, and reinforcement learning?

**Supervised**: labeled data (input → output pairs). Classification, regression.
**Unsupervised**: no labels. Clustering, dimensionality reduction.
**Reinforcement**: agent learns by interacting with environment, receiving rewards.

### Q245. What are embeddings in NLP?

Dense vector representations of words/sentences that capture semantic meaning. Similar words have similar vectors.

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')

embeddings = model.encode(["How are you?", "How do you do?", "The cat sat on the mat"])
# embeddings[0] and embeddings[1] will have high cosine similarity
```

### Q246. How do you integrate LLMs into production applications?

```ts
// API integration with streaming
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }]
  })
});

// Key production concerns:
// - Rate limiting and retry logic
// - Prompt caching for repeated patterns
// - Output validation (structured output with Zod)
// - Cost monitoring and token budgets
// - Fallback models for availability
// - Guardrails for content safety
```

### Q247. What is RAG (Retrieval-Augmented Generation)?

RAG combines retrieval and generation: query a vector database for relevant documents, inject them into the LLM prompt as context.

```
User Query → Embed → Vector Search → Top-K Documents → LLM Prompt + Context → Response
```

Benefits: reduces hallucination, keeps knowledge current without retraining, provides citations.

### Q248. What are attention mechanisms and transformers?

Attention allows the model to focus on relevant parts of the input. Self-attention computes relationships between all positions in a sequence.

The Transformer architecture (encoder-decoder with multi-head self-attention) is the foundation of modern LLMs. Key innovation: parallelizable (unlike RNNs), captures long-range dependencies.

### Q249. How do you evaluate ML models?

- **Classification**: accuracy, precision, recall, F1-score, AUC-ROC
- **Regression**: MSE, RMSE, MAE, R²
- **NLP**: BLEU (translation), ROUGE (summarization), perplexity (language models)
- **Object Detection**: mAP (mean Average Precision), IoU (Intersection over Union)

### Q250. What are AI guardrails and how do you implement them?

```ts
// Input guardrails
function validatePrompt(input: string): { safe: boolean; reason?: string } {
  const blockedPatterns = [/ignore previous instructions/i, /system prompt/i];
  for (const pattern of blockedPatterns) {
    if (pattern.test(input)) return { safe: false, reason: "Prompt injection detected" };
  }
  return { safe: true };
}

// Output guardrails
function validateResponse(output: string, schema: z.ZodSchema) {
  const parsed = schema.safeParse(JSON.parse(output));
  if (!parsed.success) return { valid: false, errors: parsed.error };
  return { valid: true, data: parsed.data };
}

// Content filtering, PII detection, toxicity scoring
// Rate limiting per user, cost caps per request
```

---

*Good luck with your interviews, Sourav! You have an impressive portfolio — make sure to connect each answer to your real-world experience at Pathao and ShellBeeHaken.* 🚀
