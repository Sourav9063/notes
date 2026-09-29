## 1\. Modern JS & TypeScript Nuances

### 1\. What is the difference between `WeakMap` and `Map`?

A **`WeakMap`** is a collection where keys must be objects, and the references to these keys are held "weakly." This means that if an object used as a key has no other references in the program, it can be garbage collected. A regular **`Map`** holds "strong" references, preventing its keys from being garbage collected as long as they exist in the map.

**Use `WeakMap` for caching or metadata that should be cleared automatically when an object is no longer in use.**

```javascript
let user = { name: 'Alice' };
const strongMap = new Map();
strongMap.set(user, 'metadata');

const weakMap = new WeakMap();
weakMap.set(user, 'cached data');

// Now, if we remove the only strong reference to 'user'
user = null;

// The 'user' object in strongMap will NOT be garbage collected.
// The 'user' object in weakMap IS eligible for garbage collection, freeing up memory.
console.log(strongMap.size); // 1
// We can't check weakMap.size, but the memory is now freeable.
```

### 2\. How does the `??` (Nullish Coalescing) operator differ from `||` (Logical OR)?

The logical OR `||` operator returns the right-hand side operand if the left-hand side is any **falsy** value (`false`, `0`, `''`, `null`, `undefined`, `NaN`).

The nullish coalescing `??` operator is stricter: it only returns the right-hand side operand if the left-hand side is **`null` or `undefined`**. This is useful for accepting "falsy" values like `0` or empty strings as valid inputs.

```javascript
const config = {
  speed: 0,
  retries: null,
  name: ''
};

// Using || can lead to unexpected results with 0 or empty strings
const animationSpeed = config.speed || 50; // 50 (Incorrect, we wanted 0)
const appName = config.name || 'Default App'; // 'Default App' (Incorrect)

// Using ?? gives the intended behavior
const animationSpeedCorrect = config.speed ?? 50; // 0 (Correct)
const retriesCount = config.retries ?? 3; // 3 (Correct)
const appNameCorrect = config.name ?? 'Default App'; // '' (Correct)

console.log(`Speed: ${animationSpeedCorrect}, Retries: ${retriesCount}, Name: ${appNameCorrect}`);
```

### 3\. Explain the Temporal Dead Zone (TDZ).

The **Temporal Dead Zone (TDZ)** is a behavior in JavaScript that occurs when you try to access a variable declared with `let` or `const` before it is initialized. The period from the start of the block until the declaration is encountered is the TDZ for that variable. Accessing it in this zone results in a `ReferenceError`.

This prevents bugs that were common with `var` hoisting, where a variable could be accessed before its declaration and would return `undefined`.

```javascript
function checkTDZ() {
  // console.log(myVar); // 💀 ReferenceError: Cannot access 'myVar' before initialization
  // ^ This is the TDZ for myVar

  let myVar = 10; // Initialization happens here, TDZ ends

  console.log(myVar); // 10 (This is fine)
}

checkTDZ();
```

### 4\. What's the difference between `interface` and `type` in TypeScript?

Both `interface` and `type` can be used to define the shape of an object. However, there are key differences:

  * **Declaration Merging**: `interface`s can be defined multiple times and their definitions will be merged. `type` aliases cannot.
  * **Extensibility**: `interface`s can be extended using `extends`. `type` aliases can achieve similar results using intersections (`&`).
  * **Use Case**: Use `interface` for defining the shape of objects or classes. Use `type` for creating aliases for primitive types, unions, tuples, or more complex combinations.

<!-- end list -->

```typescript
// Declaration Merging (Interfaces only)
interface User {
  name: string;
}
interface User {
  age: number;
}
const user: User = { name: 'Bob', age: 30 }; // Works!

// Type alias with intersection
type Point = { x: number };
type ThreeDPoint = Point & { y: number; z: number; };

// Type alias for a union
type Status = 'success' | 'error' | 'pending';
```

### 5\. What are TypeScript generics and why are they useful?

**Generics** are a way to create reusable components (functions, classes, or interfaces) that can work over a variety of types rather than a single one. They allow you to define a placeholder for a type that will be specified when the component is used.

This provides type safety without sacrificing flexibility.

```typescript
// Without generics, you might use 'any', which loses type safety
function getFirstElement_any(arr: any[]): any {
  return arr[0];
}

// With generics, we capture the type of the array element
function getFirstElement<T>(arr: T[]): T {
  return arr[0];
}

const numbers = [1, 2, 3];
const firstNumber = getFirstElement(numbers); // Type of 'firstNumber' is inferred as 'number'

const strings = ["a", "b", "c"];
const firstString = getFirstElement(strings); // Type of 'firstString' is inferred as 'string'
```

### 6\. Explain JavaScript's private class fields (`#`).

Private class fields, denoted by a `#` prefix, are properties or methods that are only accessible from within the class they are defined in. This provides true encapsulation, preventing outside code from accidentally (or intentionally) modifying internal state.

```javascript
class BankAccount {
  // #balance is a private field
  #balance = 0;

  deposit(amount) {
    if (amount > 0) {
      this.#balance += amount;
      this.#logTransaction('deposit', amount);
    }
  }

  // #logTransaction is a private method
  #logTransaction(type, amount) {
    console.log(`Transaction: ${type} of ${amount}. New balance: ${this.#balance}`);
  }
}

const account = new BankAccount();
account.deposit(100); // Works, logs the transaction

// console.log(account.#balance); // 💀 SyntaxError: Private field '#balance' must be declared in an enclosing class
// account.#logTransaction(); // 💀 SyntaxError
```

### 7\. What problem does optional chaining (`?.`) solve?

**Optional chaining (`?.`)** provides a way to safely access nested object properties without having to write long chains of `&&` checks. If any link in the chain is `null` or `undefined`, the expression short-circuits and returns `undefined` instead of throwing a `TypeError`.

```javascript
const user = {
  name: 'Alice',
  // address is missing
  // address: {
  //   street: '123 Main St'
  // }
};

// Before optional chaining
const street_old = user && user.address && user.address.street;
console.log(street_old); // undefined

// With optional chaining
const street_new = user?.address?.street;
console.log(street_new); // undefined (but much cleaner and safer)
```

### 8\. What is "structural typing" in TypeScript?

TypeScript uses **structural typing** (also known as "duck typing"). This means that if two objects have the same "shape" (the same properties with the same types), they are considered compatible, regardless of their explicit class or interface declaration. It's about what they *have*, not who they *are*.

```typescript
interface Point {
  x: number;
  y: number;
}

class Vector {
  constructor(public x: number, public y: number) {}
}

function logPoint(p: Point) {
  console.log(`x: ${p.x}, y: ${p.y}`);
}

const myVector = new Vector(10, 20);

// This works because the Vector instance has the same structure as the Point interface.
logPoint(myVector);
```

### 9\. Explain the `BigInt` type in JavaScript.

**`BigInt`** is a primitive type in JavaScript used to represent whole numbers larger than `2^53 - 1` (`Number.MAX_SAFE_INTEGER`), which is the largest number JavaScript can reliably represent with the `Number` type. `BigInt`s are created by appending `n` to the end of an integer or by calling the `BigInt()` constructor.

```javascript
const maxSafeInt = Number.MAX_SAFE_INTEGER;
console.log(maxSafeInt); // 9007199254740991

const largeNumber = maxSafeInt + 2; // Loses precision
console.log(largeNumber); // 9007199254740992 (Incorrect!)

const largeBigInt = BigInt(maxSafeInt) + 2n; // `n` denotes a BigInt
console.log(largeBigInt.toString()); // "9007199254740993" (Correct!)

// You cannot mix Number and BigInt in operations
// const mixed = 10 + 10n; // 💀 TypeError
```

### 10\. What are TypeScript utility types like `Partial<T>`, `Required<T>`, and `Readonly<T>`?

Utility types are built-in generic types that help you transform other types.

  * **`Partial<T>`**: Constructs a type with all properties of `T` set to optional. Useful for creating objects for updates.
  * **`Required<T>`**: Constructs a type with all properties of `T` set to required.
  * **`Readonly<T>`**: Constructs a type where all properties of `T` are read-only and cannot be reassigned.

<!-- end list -->

```typescript
interface Todo {
  title: string;
  description?: string;
  completed: boolean;
}

// Partial: Useful for an update function
function updateTodo(todo: Todo, fieldsToUpdate: Partial<Todo>) {
  return { ...todo, ...fieldsToUpdate };
}

// Required: Make all properties mandatory
const completeTodo: Required<Todo> = {
  title: 'Finish report',
  description: 'Final draft',
  completed: true
};

// Readonly: Prevent modification
const frozenTodo: Readonly<Todo> = {
  title: 'Cannot be changed',
  completed: false
};
// frozenTodo.completed = true; // 💀 TypeError: Cannot assign to 'completed' because it is a read-only property.
```

-----

## 2\. Advanced Asynchronous Patterns

### 11\. How would you implement a task queue with concurrency control?

This involves creating a queue that processes a list of asynchronous tasks (promise-returning functions), but only runs a certain number of them in parallel at any given time.

```javascript
class TaskQueue {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.runNext();
    });
  }

  runNext() {
    if (this.running < this.concurrency && this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();
      this.running++;

      task()
        .then(resolve, reject)
        .finally(() => {
          this.running--;
          this.runNext();
        });
    }
  }
}

// Usage:
const queue = new TaskQueue(2); // Only 2 tasks run at once
const createTask = (id, delay) => () =>
  new Promise(res => {
    console.log(`Task ${id} started...`);
    setTimeout(() => {
      console.log(`Task ${id} finished.`);
      res(`Result ${id}`);
    }, delay);
  });

queue.add(createTask(1, 1000));
queue.add(createTask(2, 500));
queue.add(createTask(3, 800)); // This will wait for task 2 to finish
queue.add(createTask(4, 300)); // This will wait for task 1 to finish
```

### 12\. What is an optimistic UI update?

An **optimistic UI update** is a pattern where you update the UI immediately, *assuming* an asynchronous operation (like an API call) will succeed, without waiting for the server's response. If the operation fails, you then roll back the UI to its previous state and show an error.

This makes the application feel much faster and more responsive to the user.

```javascript
// Simplified React example
function LikeButton({ initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [error, setError] = useState(null);

  const handleLike = async () => {
    const originalLikes = likes;
    setError(null);

    // 1. Optimistically update the UI
    setLikes(prevLikes => prevLikes + 1);

    try {
      // 2. Make the API call
      await api.likePost();
    } catch (err) {
      // 3. If it fails, roll back and show an error
      setError("Failed to like post.");
      setLikes(originalLikes);
    }
  };

  return <button onClick={handleLike}>Like ({likes})</button>;
}
```

### 13\. How does `Promise.prototype.finally()` work, and what happens if it throws an error?

The `.finally(callback)` block is executed when a promise is **settled** (either fulfilled or rejected). It's for cleanup code.

  * If the promise was fulfilled, `.finally()` runs, and the promise chain continues with the original fulfillment value.
  * If the promise was rejected, `.finally()` runs, and the promise chain continues with the original rejection reason.
  * **Crucially**: If the `.finally()` callback itself throws an error or returns a rejected promise, it **overrides** the original settlement. The new promise will be rejected with the reason from the `.finally()` block.

<!-- end list -->

```javascript
Promise.resolve('Success')
  .finally(() => {
    console.log('Finally block runs.');
    throw new Error('Error in finally!');
  })
  .then(val => console.log('This will not run.'))
  .catch(err => console.error(err.message)); // Catches 'Error in finally!'
```

### 14\. What are async generators and what problem do they solve?

An **async generator** (`async function*`) combines the capabilities of async/await and generators. It allows you to create a function that can `await` asynchronous operations and then `yield` a sequence of values over time.

This is perfect for handling asynchronous streams of data, like paginated API responses or data from a WebSocket, in a clean, pull-based manner using a `for await...of` loop.

```javascript
async function* getPaginatedUsers() {
  let url = '/api/users?page=1';
  while (url) {
    const response = await fetch(url);
    const data = await response.json();
    url = data.nextPageUrl;
    // Yield each user one by one
    for (const user of data.users) {
      yield user;
    }
  }
}

// Consumer code is incredibly clean
(async () => {
  for await (const user of getPaginatedUsers()) {
    console.log(`Processing user: ${user.name}`);
  }
})();
```

### 15\. Explain `Promise.any()` and its key difference from `Promise.race()`.

`Promise.any()` takes an array of promises and fulfills as soon as **any** of the promises in the array **fulfills**. It ignores all rejections. It only rejects if *all* of the promises reject, returning an `AggregateError` containing all the rejection reasons.

  * **`Promise.any()`**: Succeeds on the first success. Fails only if all fail.
  * **`Promise.race()`**: Settles on the first settlement (success or failure).

<!-- end list -->

```javascript
const p1 = new Promise((res, rej) => setTimeout(rej, 100, 'Fail 1'));
const p2 = new Promise((res, rej) => setTimeout(res, 200, 'Success 2'));
const p3 = new Promise((res, rej) => setTimeout(res, 300, 'Success 3'));

// any() will wait for p2 to succeed
Promise.any([p1, p2, p3])
  .then(val => console.log(`any() resolved with: ${val}`)); // 'Success 2'

// race() will settle with p1's failure
Promise.race([p1, p2, p3])
  .catch(err => console.log(`race() rejected with: ${err}`)); // 'Fail 1'
```

### 16\. What is "hydration" in the context of Server-Side Rendering (SSR)?

**Hydration** is the process of taking the static HTML rendered by a server and "breathing life" into it on the client-side by attaching JavaScript event listeners and state. After hydration, the page becomes a fully interactive Single-Page Application (SPA).

Frameworks like Next.js or Nuxt.js perform this step automatically, making the initial page load very fast (from the server-rendered HTML) while retaining the rich interactivity of a client-side app.

### 17\. How can you prevent race conditions when fetching data in a React `useEffect` hook?

A race condition occurs if a component triggers multiple data fetches, and the responses arrive out of order. For example, the user types "a", then "ab", but the response for "ab" arrives before the response for "a", showing stale results.

The solution is to use a cleanup function in `useEffect` to ignore the results of outdated requests.

```javascript
useEffect(() => {
  // Use AbortController for modern fetch, or a simple boolean flag
  let isCancelled = false;

  const fetchData = async () => {
    const response = await api.fetchData(query);
    // Only update state if this effect is still the active one
    if (!isCancelled) {
      setData(response.data);
    }
  };

  fetchData();

  // The cleanup function runs when the component re-renders or unmounts
  return () => {
    isCancelled = true; // Mark the previous request as cancelled
  };
}, [query]); // Re-run effect when the query changes
```

### 18\. What is the "Stale-While-Revalidate" caching strategy?

**Stale-While-Revalidate (SWR)** is a caching pattern that provides a great user experience.

1.  When data is requested, it first returns the **stale** (cached) data immediately.
2.  Then, in the background, it sends a **revalidation** request to the server to get fresh data.
3.  Once the fresh data arrives, it updates the cache and the UI.

This gives the user an instant response while ensuring the data is eventually consistent. Libraries like SWR and React Query are built on this principle.

### 19\. Implement a promise-based polling function.

Write a function that repeatedly calls an async function until a certain condition is met or a timeout is reached.

```javascript
async function poll(asyncFn, conditionFn, interval, timeout) {
  const startTime = Date.now();

  async function check() {
    if (Date.now() - startTime > timeout) {
      throw new Error('Polling timed out.');
    }

    const result = await asyncFn();
    if (conditionFn(result)) {
      return result; // Condition met, resolve the promise
    } else {
      // Condition not met, wait and try again
      await new Promise(res => setTimeout(res, interval));
      return check();
    }
  }
  return check();
}

// Usage: Poll a job status API
const getJobStatus = async () => fetch('/api/job/123').then(res => res.json());
const isJobComplete = (status) => status.state === 'COMPLETED';

poll(getJobStatus, isJobComplete, 2000, 30000)
  .then(finalStatus => console.log('Job completed!', finalStatus))
  .catch(console.error);
```

### 20\. How do signals (like in Solid.js or Preact) differ from React's `useState`?

**Signals** are a reactive primitive that hold a value. When a signal's value is updated, it automatically and precisely updates only the specific parts of the DOM that depend on it, without re-rendering entire components.

  * **`useState`**: An update triggers a re-render of the entire component. React then uses the Virtual DOM to figure out what changed. It's a "top-down" approach.
  * **Signals**: An update directly triggers a change in the final DOM node. It's a highly granular, "bottom-up" approach that avoids the overhead of component re-renders and VDOM diffing.

-----

## 3\. Browser APIs & Performance

### 21\. What is the Performance API and how can you use it to measure frontend performance?

The **Performance API** is a set of browser APIs that provide high-resolution timing data about your application. You can use it to precisely measure the duration of operations.

  * **`performance.mark()`**: Creates a named timestamp in the performance buffer.
  * **`performance.measure()`**: Measures the time between two marks.
  * **`performance.getEntriesByType()`**: Retrieves the collected marks and measures.

<!-- end list -->

```javascript
function doExpensiveWork() {
  performance.mark('work-start');
  // ... some long-running code ...
  for (let i = 0; i < 1e7; i++) {}
  performance.mark('work-end');

  // Measure the duration between the start and end marks
  performance.measure('My Expensive Work', 'work-start', 'work-end');

  // Get the measurement and log it
  const measures = performance.getEntriesByName('My Expensive Work');
  console.log(`Duration: ${measures[0].duration.toFixed(2)}ms`);
}

doExpensiveWork();
```

### 22\. How does the Intersection Observer API work, and what is it used for?

The **Intersection Observer API** provides a way to asynchronously observe changes in the intersection of a target element with an ancestor element or with the top-level document's viewport.

Instead of constantly checking an element's position on scroll (which is inefficient), you simply "observe" it, and the browser tells you when it becomes visible. It's highly performant and used for:

  * **Lazy loading** images or components.
  * Implementing **infinite scroll**.
  * Triggering animations when an element scrolls into view.

### 23\. What are Web Workers and when should you use them?

**Web Workers** are a way to run JavaScript in a background thread, separate from the main thread that handles the UI. This allows you to perform long-running or computationally intensive tasks without blocking the event loop and freezing the page.

Use a Web Worker for:

  * Processing large amounts of data (e.g., parsing a large file).
  * Complex mathematical calculations (e.g., image processing, cryptography).
  * Maintaining a persistent WebSocket connection.

<!-- end list -->

```javascript
// main.js
const worker = new Worker('worker.js');
worker.postMessage({ data: 'some heavy data' });
worker.onmessage = (e) => console.log(`Result from worker: ${e.data}`);

// worker.js
self.onmessage = (e) => {
  // Perform heavy computation here
  const result = e.data.data.toUpperCase();
  self.postMessage(result);
};
```

### 24\. What is `SharedArrayBuffer` and how does it relate to Web Workers?

Normally, when you send data to a Web Worker using `postMessage`, the data is **copied** (serialized and deserialized). This can be slow for large data sets.

**`SharedArrayBuffer`** is a raw binary data buffer that can be **shared** between the main thread and one or more Web Workers. No copying is involved; all threads have access to the same block of memory. This allows for extremely fast communication but requires careful synchronization using the **`Atomics`** API to prevent race conditions.

### 25\. Explain the concept of "layout thrashing".

**Layout thrashing** (or forced synchronous layout) is a major performance bottleneck that occurs when you interleave read and write operations on the DOM.

When you write to the DOM (e.g., change a style), the browser invalidates the layout and schedules a recalculation for later. If you then immediately *read* a geometric property (like `element.offsetWidth` or `getBoundingClientRect()`), you **force** the browser to perform the layout recalculation synchronously right then and there. If this happens repeatedly in a loop, you cause a series of forced reflows, which is very slow.

```javascript
// BAD: Causes layout thrashing
function resizeAllBoxes() {
  const boxes = document.querySelectorAll('.box');
  for (let i = 0; i < boxes.length; i++) {
    const width = container.offsetWidth; // READ
    boxes[i].style.width = width + 'px'; // WRITE (invalidates layout, then loops)
  }
}

// GOOD: Batch reads and writes
function resizeAllBoxesOptimized() {
  const boxes = document.querySelectorAll('.box');
  const width = container.offsetWidth; // 1. Read once
  for (let i = 0; i < boxes.length; i++) {
    boxes[i].style.width = width + 'px'; // 2. Write all at once
  }
}
```

### 26\. What is the `Broadcast Channel API`?

The **Broadcast Channel API** allows simple communication between different browser tabs, windows, iframes, or workers of the **same origin**. It provides a basic pub/sub mechanism. One tab can "broadcast" a message, and all other open tabs from the same origin that are listening to that channel will receive it.

This is useful for synchronizing state across tabs, like logging a user out of all open tabs at once.

```javascript
// Tab 1: Sending a message
const bc = new BroadcastChannel('app_channel');
bc.postMessage('User logged out!');

// Tab 2: Receiving the message
const bc = new BroadcastChannel('app_channel');
bc.onmessage = (event) => {
  console.log('Message received:', event.data);
  if (event.data === 'User logged out!') {
    // redirect to login page
  }
};
```

### 27\. How can you lazy load images using native browser features?

Modern browsers support native lazy loading for images and iframes without needing any JavaScript libraries. You just need to add the `loading="lazy"` attribute. The browser will then automatically defer the loading of off-screen images until the user scrolls near them.

```html
<img src="heavy-image.jpg" loading="lazy" alt="A lazy-loaded image">

<img src="hero-image.jpg" loading="eager" alt="An important hero image">
```

### 28\. What is the difference between `passive` and `capture` options in `addEventListener`?

These are options you can pass to `addEventListener` to modify its behavior.

  * **`capture: true`**: The event listener is executed during the **capture phase** of the event propagation (from the `window` down to the target), rather than the default **bubble phase** (from the target up to the `window`).
  * **`passive: true`**: This is a performance optimization for touch and wheel event listeners. It's a promise to the browser that you will **not** call `event.preventDefault()` inside the listener. This allows the browser to start scrolling immediately without waiting for your script to finish, resulting in a much smoother scrolling experience.

<!-- end list -->

```javascript
// This listener will not block scrolling
window.addEventListener('scroll', handleScroll, { passive: true });
```

### 29\. What is CSS containment (`contain` property)?

The CSS `contain` property is a powerful performance optimization. It allows you to tell the browser that an element's subtree is independent and isolated from the rest of the page. This lets the browser optimize rendering by skipping layout and paint calculations for that element if it's not on screen or if only its internal content changes.

```css
.isolated-widget {
  /*
    layout: The element's internal layout doesn't affect the outside.
    paint: Nothing outside this element can be affected by what's painted inside it.
  */
  contain: layout paint;
}
```

`contain: strict;` is a shortcut for `layout paint size`. It's great for virtualized lists or widgets.

### 30\. What is WebAssembly (Wasm) and when would it be used in a frontend application?

**WebAssembly** is a low-level, binary instruction format for a stack-based virtual machine. It's designed as a compilation target for high-level languages like C++, Rust, and Go, allowing you to run code written in those languages on the web at near-native speed.

It is **not** a replacement for JavaScript. It's a complement. You'd use Wasm for performance-critical parts of your application that JS is too slow for, such as:

  * 3D graphics rendering and gaming.
  * Video and audio editing/processing.
  * Cryptography and scientific simulations.

-----
