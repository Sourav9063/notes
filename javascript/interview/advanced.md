## 1\. The Event Loop and Asynchronous JavaScript

### 1\. What's the difference between a microtask and a macrotask?

A **microtask** is a short function that runs after the currently executing script finishes and before the browser renders the page. A **macrotask** (or simply "task") is a larger piece of work, like a `setTimeout` callback or a user event, that is handled in a later turn of the event loop. The microtask queue is always processed completely before the event loop considers the next macrotask.

  - **Microtasks**: `Promise.then()`, `queueMicrotask()`, `MutationObserver`
  - **Macrotasks**: `setTimeout()`, `setInterval()`, I/O, UI rendering

<!-- end list -->

```javascript
console.log('1: Script Start');

setTimeout(() => {
  console.log('5: setTimeout (Macrotask)');
}, 0);

Promise.resolve().then(() => {
  console.log('3: Promise (Microtask)');
});

queueMicrotask(() => {
  console.log('4: queueMicrotask (Microtask)');
});

console.log('2: Script End');

// Order of execution:
// 1: Script Start
// 2: Script End
// 3: Promise (Microtask)
// 4: queueMicrotask (Microtask)
// 5: setTimeout (Macrotask)
```

### 2\. Can a `Promise` resolve synchronously?

No. A `Promise` is inherently asynchronous. Even if a promise is resolved immediately, its `.then()` or `.catch()` callbacks are always placed in the **microtask queue** and executed on the next "tick" of the event loop, never in the current one.

```javascript
const p = new Promise((resolve) => {
  console.log('A: Promise constructor');
  resolve('Success!');
});

console.log('B: After promise creation');

p.then((value) => {
  console.log(`D: Resolved with: ${value}`);
});

console.log('C: End of script');

// Output:
// A: Promise constructor
// B: After promise creation
// C: End of script
// D: Resolved with: Success!
```

### 3\. Implement an `async` function using only generators and promises.

`async/await` is syntactic sugar over generators and promises. A generator can be paused (`yield`) and resumed. We can create a function that takes a generator, runs it, and for each yielded promise, waits for it to resolve before feeding the result back into the generator.

```javascript
function asyncGeneratorRunner(generatorFunc) {
  const generator = generatorFunc();

  function run(arg) {
    const result = generator.next(arg);
    if (result.done) {
      return Promise.resolve(result.value);
    }
    // Ensure the yielded value is a promise
    return Promise.resolve(result.value).then(
      (res) => run(res), // on success, continue generator
      (err) => generator.throw(err) // on error, throw into generator
    );
  }

  return run();
}

// Example usage:
const myAsyncFunc = asyncGeneratorRunner(function* () {
  console.log('Fetching user...');
  const user = yield new Promise(res => setTimeout(() => res({ name: 'Alice' }), 1000));
  console.log('User:', user.name);
  const posts = yield new Promise(res => setTimeout(() => res(['Post 1', 'Post 2']), 500));
  console.log('Posts:', posts.length);
  return 'Done!';
});

myAsyncFunc.then(console.log);
```

### 4\. What is `process.nextTick` in Node.js and how does it relate to the event loop?

`process.nextTick` is specific to Node.js. It creates a callback that's executed at the **very beginning of the next event loop tick**, before any other operations like I/O events or timers. Its queue is processed *before* the microtask queue. This means `nextTick` callbacks will always run before `Promise.then` callbacks. It's used for urgent actions that must happen before the event loop continues.

```javascript
// This code should be run in a Node.js environment
console.log('start');

setTimeout(() => {
  console.log('setTimeout'); // Macrotask
}, 0);

Promise.resolve().then(() => {
  console.log('promise'); // Microtask
});

process.nextTick(() => {
  console.log('nextTick'); // Runs before microtasks
});

console.log('end');

// Output:
// start
// end
// nextTick
// promise
// setTimeout
```

### 5\. What happens if you recursively call a function with `queueMicrotask`?

Recursively calling a function with `queueMicrotask` will block the event loop from ever reaching the next macrotask or rendering phase. The microtask queue must be empty before the event loop can proceed. This can freeze the browser tab, as UI updates (macrotasks) will be starved.

```javascript
let count = 0;

function infiniteMicrotask() {
  console.log(`Microtask call: ${++count}`);
  queueMicrotask(infiniteMicrotask); // Schedule another microtask immediately
}

// Kick it off
infiniteMicrotask();

// This will be scheduled but will likely never run because
// the microtask queue never gets empty.
setTimeout(() => console.log('This will never be logged!'), 0);
```

### 6\. Implement a `sleep` function using promises.

A `sleep` function pauses execution for a specified duration. Using `async/await` makes it look synchronous and easy to read. It's essentially a promise-based wrapper around `setTimeout`.

```javascript
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runProcess() {
  console.log('Starting process...');
  await sleep(2000); // Pauses execution for 2 seconds
  console.log('Process finished after 2 seconds.');
}

runProcess();
```

### 7\. What is "callback hell" and how do promises and async/await solve it?

**Callback hell** (or the "pyramid of doom") is a pattern of nested callbacks that becomes hard to read and maintain, especially with complex error handling.

**Promises** solve this by allowing you to chain `.then()` calls, flattening the pyramid. **`async/await`** provides an even cleaner, synchronous-looking syntax on top of promises, making the code extremely readable.

```javascript
// Callback Hell
getUser(id, (err, user) => {
  if (err) throw err;
  getPosts(user.id, (err, posts) => {
    if (err) throw err;
    getComments(posts[0].id, (err, comments) => {
      if (err) throw err;
      console.log(comments);
    });
  });
});

// Promises
getUser(id)
  .then(user => getPosts(user.id))
  .then(posts => getComments(posts[0].id))
  .then(comments => console.log(comments))
  .catch(err => console.error(err));

// Async/Await
async function showComments(id) {
  try {
    const user = await getUser(id);
    const posts = await getPosts(user.id);
    const comments = await getComments(posts[0].id);
    console.log(comments);
  } catch (err) {
    console.error(err);
  }
}
```

### 8\. Explain the concept of "top-level await" and its use case.

**Top-level await** allows you to use the `await` keyword outside of an `async` function, at the top level of a module. This is useful for initializing applications, fetching configuration data, or loading dependencies before the rest of the module's code executes.

```javascript
// 📁 config.js
// This module exports a promise that resolves with the configuration.
const configPromise = fetch('/api/config').then(res => res.json());
export default await configPromise; // Await at the top level

// 📁 main.js
// The import will "wait" until the config is loaded.
import config from './config.js';

console.log(`App started with theme: ${config.theme}`);
```

### 9\. How would you handle a race condition between two async operations?

A race condition occurs when the outcome of operations depends on their unpredictable completion order. `Promise.race()` is perfect for this. It settles (resolves or rejects) as soon as the first promise in the iterable settles. A common use case is implementing a timeout for a network request.

```javascript
function fetchWithTimeout(url, timeout) {
  const fetchPromise = fetch(url);

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );

  // Race the fetch against the timeout
  return Promise.race([fetchPromise, timeoutPromise]);
}

fetchWithTimeout('https://api.example.com/data', 5000)
  .then(response => response.json())
  .then(data => console.log('Data received:', data))
  .catch(error => console.error('Error:', error.message)); // Catches timeout or network error
```

### 10\. Can you modify a `Promise` after it has settled?

No. A core principle of Promises is that they are **immutable** once settled. A promise can only transition from "pending" to either "fulfilled" or "rejected" once. After that, its state and value cannot be changed. This immutability ensures predictable and reliable asynchronous flows.

```javascript
const myPromise = new Promise((resolve) => {
  resolve('First value');
});

myPromise.then((value) => {
  console.log(value); // Logs "First value"
  // You can't change the promise's settled value here.
  // It will always be "First value".
});

// Chaining creates a *new* promise, it doesn't modify the original one.
const newPromise = myPromise.then(() => {
  return 'Second value'; // This is the resolved value of newPromise
});
```

-----

## 2\. Browser Internals and Networking

### 11\. Explain the Critical Rendering Path.

The **Critical Rendering Path** is the sequence of steps a browser takes to convert HTML, CSS, and JavaScript into pixels on the screen. Optimizing this path is key to fast page loads. The main steps are:

1.  **DOM Construction**: The browser parses HTML into the Document Object Model (DOM).
2.  **CSSOM Construction**: The browser parses CSS into the CSS Object Model (CSSOM).
3.  **Render Tree**: The DOM and CSSOM are combined into a Render Tree, which contains only the nodes necessary to render the page (e.g., `display: none` elements are excluded).
4.  **Layout (or Reflow)**: The browser calculates the size and position of each object in the render tree.
5.  **Paint**: The browser draws the pixels for each element onto layers.
6.  **Composite**: The layers are drawn to the screen in the correct order.

### 12\. What's the difference between `defer` and `async` attributes on a `<script>` tag?

Both attributes allow the browser to download a script without blocking HTML parsing. The key difference is when the script executes.

  * **`async`**: The script is executed as soon as it's downloaded, which can be at any point during HTML parsing. This can interrupt parsing. The order of execution for multiple `async` scripts is not guaranteed.
  * **`defer`**: The script is executed only after the HTML parsing is complete, but before the `DOMContentLoaded` event. `defer` scripts are guaranteed to execute in the order they appear in the HTML.

<!-- end list -->

```html
<script async src="analytics.js"></script>

<script defer src="main-app.js"></script>
```

### 13\. How does HTTP/2 improve performance over HTTP/1.1?

HTTP/2 introduces several key improvements:

  * **Multiplexing**: Allows multiple requests and responses to be sent in parallel over a single TCP connection, eliminating the "head-of-line blocking" problem of HTTP/1.1.
  * **Server Push**: A server can send resources to the client before the client explicitly requests them (e.g., sending `style.css` along with `index.html`).
  * **Header Compression (HPACK)**: Reduces the overhead of HTTP headers by compressing them.
  * **Binary Protocol**: More efficient and less error-prone to parse than the text-based HTTP/1.1.

### 14\. What is a CORS preflight request?

A **preflight request** is an `OPTIONS` request that a browser sends to a server to check if the actual `CORS` (Cross-Origin Resource Sharing) request is safe to send. It's automatically triggered for "non-simple" requests, such as those using methods other than `GET`, `HEAD`, or `POST`, or those with custom headers. The server responds with headers like `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers` to indicate whether the actual request is permitted.

### 15\. What are `Layout`, `Paint`, and `Composite` in the rendering process?

  * **Layout (or Reflow)**: This is the phase where the browser calculates the geometry of elements—their size and position on the page. A layout is triggered when you change properties that affect an element's geometry, like `width`, `height`, `margin`, or `font-size`. It can be computationally expensive.
  * **Paint**: In this phase, the browser fills in the pixels for each element. It involves drawing text, colors, images, borders, and shadows. This happens on multiple layers.
  * **Composite**: This is the final phase where the browser combines all the painted layers into a single image to be displayed on the screen. Operations that only affect compositing, like `transform: translate()` or `opacity`, are very cheap because they don't trigger layout or paint and can often be handled by the GPU.

### 16\. What's the difference between the DOM and the Virtual DOM?

  * **DOM (Document Object Model)**: A tree-like representation of an HTML document. Direct manipulations of the DOM are slow because they can trigger expensive layout and paint operations.
  * **Virtual DOM (VDOM)**: A lightweight, in-memory representation of the DOM. When state changes in a framework like React, a new VDOM tree is created. This new tree is then compared ("diffed") with the previous VDOM tree. The framework calculates the most efficient batch of updates needed to bring the real DOM in line with the new VDOM, minimizing direct DOM manipulations.

### 17\. How can you optimize asset delivery for a website?

1.  **Minification**: Remove unnecessary characters (whitespace, comments) from HTML, CSS, and JS files.
2.  **Compression**: Use Gzip or Brotli compression on the server to reduce file sizes.
3.  **Caching**: Use `Cache-Control` headers to instruct the browser to cache assets, reducing requests on subsequent visits.
4.  **Content Delivery Network (CDN)**: Distribute assets across geographically diverse servers so users can download them from a server closer to them.
5.  **Code Splitting**: Break down large JavaScript bundles into smaller chunks that can be loaded on demand.

### 18\. What is `tree shaking`?

**Tree shaking** is a process in modern JavaScript bundlers (like Webpack or Rollup) that eliminates dead (unused) code. It relies on the static structure of ES6 modules (`import` and `export`). By analyzing the module dependencies, the bundler can determine which exports are not being used by any part of the application and exclude them from the final bundle, resulting in a smaller file size.

```javascript
// 📁 utils.js
export function sayHello() { /* ... */ } // This will be included
export function sayGoodbye() { /* ... */ } // This will be "shaken out" if not used

// 📁 main.js
import { sayHello } from './utils.js';
sayHello();

// When bundled, sayGoodbye will be removed from the final output.
```

### 19\. What is the difference between `localStorage` and `sessionStorage`?

Both are browser storage mechanisms, but they differ in their lifespan and scope:

  * **`localStorage`**: Persists data even after the browser is closed and reopened. The data has no expiration time. The scope is per origin (protocol, host, and port).
  * **`sessionStorage`**: Persists data only for the duration of the page session. The data is cleared when the tab or browser is closed. The scope is limited to the browser tab that created it.

<!-- end list -->

```javascript
// Stays until cleared manually
localStorage.setItem('theme', 'dark');

// Cleared when the tab is closed
sessionStorage.setItem('sessionID', '123xyz');
```

### 20\. How would you diagnose a memory leak in a web application?

A memory leak is when a piece of memory that is no longer needed is not released. You can use the Chrome DevTools **Memory** panel:

1.  **Heap Snapshot**: Take a snapshot of the memory heap. Perform some actions in your app that you suspect are causing the leak, then take another snapshot. Compare the two snapshots to see which objects have been created and not garbage collected.
2.  **Allocation Timeline**: Record memory allocations over time. This helps you identify the functions that are allocating memory that isn't being freed. Look for repeating patterns of blue bars (new allocations) that don't get cleared (turn gray).

A common cause in JavaScript is a lingering reference to a DOM element that has been removed from the page, often due to closures.

-----

## 3\. Debounce and Throttle

### 21\. Implement a `debounce` function from scratch.

**Debounce** groups a burst of events into a single one. It waits for a certain amount of time to pass without the event being triggered before executing the function. It's perfect for search input fields.

```javascript
function debounce(func, delay) {
  let timeoutId;

  return function(...args) {
    // `this` refers to the context in which the debounced function was called
    const context = this;

    // Clear the previous timeout if the event fires again
    clearTimeout(timeoutId);

    // Set a new timeout
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

// Example: A search input handler
const handleSearch = (query) => console.log(`Searching for: ${query}`);
const debouncedSearch = debounce(handleSearch, 500);

// In an event listener:
// searchInput.addEventListener('keyup', (e) => debouncedSearch(e.target.value));
```

### 22\. Implement a `throttle` function from scratch.

**Throttle** ensures that a function is executed at most once every specified period. It's ideal for events that fire rapidly, like scrolling or resizing the window, to prevent performance issues.

```javascript
function throttle(func, limit) {
  let inThrottle = false;
  let lastArgs;
  let lastThis;

  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        // If there was a call during the throttle period, execute it now
        if (lastArgs) {
          func.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, limit);
    } else {
      // Save the latest arguments to be used after the throttle period
      lastArgs = args;
      lastThis = context;
    }
  };
}

// Example: A window scroll handler
const handleScroll = () => console.log('User is scrolling...');
const throttledScroll = throttle(handleScroll, 1000);

// window.addEventListener('scroll', throttledScroll);
```

### 23\. What are the "leading" and "trailing" options for debounce?

  * **Trailing (default)**: The function is executed *after* the wait period has passed since the last invocation. This is the standard implementation.
  * **Leading**: The function is executed *immediately* on the first invocation, but subsequent calls are ignored until after the wait period has passed.

<!-- end list -->

```javascript
function debounce(func, delay, { leading = false } = {}) {
  let timeoutId;

  return function(...args) {
    const context = this;
    const isInvoked = leading && !timeoutId;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      // If not leading, invoke at the end of the timeout
      if (!leading) {
        func.apply(context, args);
      }
      // Reset timeoutId to allow the next leading call
      timeoutId = null;
    }, delay);

    if (isInvoked) {
      func.apply(context, args);
    }
  };
}

// Example
const sayHi = () => console.log('Hi!');
const leadingDebounce = debounce(sayHi, 1000, { leading: true });
// Call leadingDebounce() -> 'Hi!' is logged immediately.
// Any more calls within 1 sec are ignored.
```

### 24\. How would you use `requestAnimationFrame` to implement throttling?

Using `requestAnimationFrame` for throttling is highly efficient for UI updates like scroll or resize handlers because it ensures your function runs right before the browser's next paint. This synchronizes your updates with the browser's rendering cycle, leading to smoother animations and less "jank."

```javascript
function throttleWithRAF(func) {
  let isTicking = false;

  return function(...args) {
    const context = this;
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        func.apply(context, args);
        isTicking = false;
      });
      isTicking = true;
    }
  };
}

// Example: Update an element's position on scroll
const onScroll = () => {
  /* update element position */
};
const throttledOnScroll = throttleWithRAF(onScroll);
window.addEventListener('scroll', throttledOnScroll);
```

### 25\. Can you implement a `cancel` method for your debounce function?

Adding a `cancel` method allows you to explicitly prevent a pending debounced function from executing. This is useful if, for example, a component unmounts before the debounced function has a chance to run.

```javascript
function debounce(func, delay) {
  let timeoutId;

  const debounced = function(...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };

  // Add the cancel method
  debounced.cancel = function() {
    clearTimeout(timeoutId);
    timeoutId = null;
  };

  return debounced;
}

// Example
const logMessage = () => console.log("Executing...");
const debouncedLog = debounce(logMessage, 2000);

debouncedLog(); // Schedule the log
console.log("Cancelling...");
debouncedLog.cancel(); // "Executing..." will never be logged.
```

### 26\. When would you choose debounce over throttle?

  * **Choose Debounce** when you only care about the final state after a series of events. The classic example is a search bar's autocomplete feature. You don't want to send an API request for every keystroke, only after the user has stopped typing.
  * **Choose Throttle** when you want to handle an event continuously but at a controlled rate. The classic example is handling scroll events. You want to react to the user scrolling but not overwhelm the browser by running a function hundreds of times per second.

### 27\. What is a potential issue with using debounce/throttle on a React component method?

A common pitfall is redefining the debounced/throttled function on every render. This breaks the internal timer mechanism because a new `timeoutId` or `inThrottle` flag is created each time. To fix this, you should memoize the function using `useCallback` (or `useMemo`).

```javascript
import { useCallback } from 'react';

// Incorrect: a new debounced function is created on every render
const MyComponent = () => {
  const handleChange = debounce(() => { console.log('Handling change...'); }, 500);
  return <input onChange={handleChange} />;
};

// Correct: useCallback ensures the debounced function is stable across renders
const MyCorrectComponent = () => {
  const handleChange = useCallback(
    debounce((value) => { console.log(`Searching for: ${value}`); }, 500),
    [] // Empty dependency array means the function is created only once
  );
  return <input onChange={(e) => handleChange(e.target.value)} />;
};
```

### 28\. How does `this` context work within a debounced function?

The `this` context depends on how the debounced function is called. A good implementation (like the one in question \#21) uses `func.apply(context, args)` to preserve the original `this` context from where the throttled/debounced function was invoked. This ensures it behaves just like the original function would.

```javascript
const myObject = {
  name: 'My Object',
  handleClick: function() {
    console.log(`Clicked on ${this.name}`);
  }
};

const debouncedClick = debounce(myObject.handleClick, 500);

// If we call it like this, `this` will be `myObject` inside the handler.
// myObject.debouncedClick = debouncedClick;
// myObject.debouncedClick();

// Or more commonly, when using event listeners:
// button.addEventListener('click', debouncedClick.bind(myObject));
```

### 29\. Can you implement throttling that guarantees execution on the trailing edge?

The simple throttle implementation might "swallow" the very last event if it occurs during the cooldown period. A more robust implementation ensures that the last event is always processed after the timeout.

```javascript
function throttle(func, limit) {
  let timeoutId;
  let lastArgs;
  let shouldCall = true;

  return function(...args) {
    lastArgs = args;
    if (shouldCall) {
      func.apply(this, lastArgs);
      shouldCall = false;
      setTimeout(() => {
        shouldCall = true;
        if (lastArgs) { // If there was a call during the cooldown
          func.apply(this, lastArgs);
        }
      }, limit);
    }
  };
}
```

### 30\. How would you test a debounce function?

You need to use fake timers (provided by testing libraries like Jest or Vitest) to control the passage of time. This allows you to test the asynchronous behavior deterministically without waiting for actual delays.

```javascript
// Using Jest's fake timers
describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should call the function only once after the delay', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 1000);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    // At this point, mockFn should not have been called
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward time by 1000ms
    jest.runAllTimers();

    // Now the function should have been called exactly once
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

-----

## 4\. React's Reconciliation and Virtual DOM

### 31\. What is the role of React Fiber?

**React Fiber** is a complete reimplementation of React's core reconciliation algorithm. Its main goal is to enable incremental rendering: the ability to split rendering work into chunks and spread it out over multiple frames. This helps prevent blocking the main thread for long periods, leading to a more responsive UI, especially for complex applications. It also enables features like suspense and concurrent rendering.

### 32\. What is the "diffing algorithm" and what are its main heuristics?

The diffing algorithm is how React compares the new Virtual DOM tree with the old one to find the minimum number of changes needed for the real DOM. It uses a few key heuristics for performance:

1.  **Different Element Types**: If the root elements have different types (e.g., `<div>` vs `<span>`), React will tear down the old tree and build a new one from scratch.
2.  **Same Element Types**: If the root elements have the same type, React will compare their attributes, update only the ones that changed, and then recursively diff their children.
3.  **Keys for Lists**: When rendering a list of elements, the `key` attribute is crucial. It gives each element a stable identity. Without keys, React might perform unnecessary mutations. With keys, it can efficiently reorder, add, or remove elements.

### 33\. When does a React component re-render?

A component re-renders if:

1.  Its **state changes** (via `useState` or `this.setState`).
2.  Its **props change**.
3.  Its **parent component re-renders**.
4.  A **context it consumes changes**.
5.  It's forced to update via a `forceUpdate()` call (this is rare and generally discouraged).

### 34\. What problem does the `key` prop solve?

The `key` prop helps React identify which items in a list have changed, been added, or been removed. Without keys, React would compare list items based on their index. This can be inefficient and lead to bugs, especially if the list can be reordered or filtered. Using a unique and stable identifier (like an item's ID from a database) as a key allows React to correctly track each item across renders.

```javascript
// Bad: Using index as a key can cause issues with reordering/deleting.
items.map((item, index) => <li key={index}>{item.text}</li>);

// Good: Using a stable, unique ID.
items.map((item) => <li key={item.id}>{item.text}</li>);
```

### 35\. Explain the difference between reconciliation and rendering.

  * **Rendering**: The process of a component being called to produce a description of the UI (a set of React elements). This happens when state or props change. It doesn't mean anything has been drawn to the screen yet.
  * **Reconciliation**: The process of comparing the new rendered output (Virtual DOM) with the previous one (the "diffing" part).
  * **Commit**: The final phase where React applies the changes calculated during reconciliation to the actual DOM.

So, a re-render triggers reconciliation, which results in a commit.

### 36\. How does React's `useEffect` dependency array work?

The dependency array tells `useEffect` when to re-run the effect function.

  * **No array (`useEffect(() => {...})`)**: The effect runs after *every* render.
  * **Empty array (`useEffect(() => {...}, [])`)**: The effect runs only *once*, after the initial render (similar to `componentDidMount`).
  * **Array with values (`useEffect(() => {...}, [propA, stateB])`)**: The effect runs after the initial render, and then again only if any of the values in the array have changed between renders. React uses an `Object.is()` comparison to check for changes.

### 37\. What are React Fragments and why are they useful?

A **React Fragment** (`<>...</>` or `<React.Fragment>...</React.Fragment>`) lets you group a list of children without adding an extra node to the DOM. This is useful because:

1.  It avoids unnecessary `<div>` wrappers, keeping the DOM cleaner and potentially avoiding CSS styling issues.
2.  Some DOM structures are invalid with extra wrappers (e.g., returning multiple `<td>` elements from a component inside a `<tr>`).

<!-- end list -->

```javascript
function TableRow() {
  // Without a fragment, you'd need a wrapper div, which is invalid inside a <tr>
  return (
    <>
      <td>Data 1</td>
      <td>Data 2</td>
    </>
  );
}
```

### 38\. Can you force a React component to re-render without changing state or props?

Yes, you can use the `forceUpdate` method in class components, but it's strongly discouraged as it breaks from the declarative model of React. In functional components, there's no direct equivalent. A common "hack" is to use a state setter with a new object or counter, but this is also an anti-pattern. The correct approach is to structure your components so they re-render naturally based on state and props.

```javascript
// Functional component "hack" - AVOID THIS
const [_, forceUpdate] = useReducer(x => x + 1, 0);

// Class component - AVOID THIS
class MyComponent extends React.Component {
  handleClick = () => {
    this.forceUpdate();
  };
}
```

### 39\. What is the difference between `element` and `component` in React?

  * An **element** is a plain JavaScript object that describes what you want to see on the screen. It's a lightweight description of a DOM node or a component instance (e.g., `<MyComponent />` gets transpiled to `React.createElement(MyComponent)`). Elements are immutable.
  * A **component** is a function or a class that optionally accepts props and returns a React element. It's like a blueprint or a template.

`const element = <Welcome name="Sara" />;`
`function Welcome(props) { return <h1>Hello, {props.name}</h1>; }`

Here, `Welcome` is the component, and `element` is the element created from it.

### 40\. How does React handle events?

React uses a system called **Synthetic Events**. It's a cross-browser wrapper around the browser's native event system. This provides a consistent API for events across all browsers. React doesn't attach event listeners to individual DOM nodes. Instead, it uses **event delegation**, attaching a single event listener for each event type at the root of the document. When an event fires, React figures out which component it came from and dispatches a synthetic event to it.

-----

## 5\. Closures and Scope

### 41\. What is a closure? Give a practical example beyond loops.

A **closure** is a function that remembers the environment (the "lexical scope") in which it was created. This means it has access to variables from its outer (enclosing) function, even after the outer function has finished executing.

A practical use case is creating private variables and methods.

```javascript
function createCounter() {
  let count = 0; // 'count' is a private variable, protected by the closure

  return {
    increment: function() {
      count++;
    },
    decrement: function() {
      count--;
    },
    getValue: function() {
      return count;
    }
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log(counter.getValue()); // 2
console.log(counter.count); // undefined - cannot access 'count' directly
```

### 42\. Explain the classic `setTimeout` in a loop problem and two ways to solve it.

The problem is that by the time the `setTimeout` callbacks execute, the loop has already finished, and the loop variable (`var i`) will hold its final value.

**The Problem:**

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i); // Logs 3, 3, 3
  }, 100);
}
```

**Solution 1: Using `let`**
`let` creates a new binding for `i` in each loop iteration (block scope).

```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i); // Logs 0, 1, 2
  }, 100);
}
```

**Solution 2: Using a Closure (IIFE)**
Wrap the `setTimeout` in an Immediately Invoked Function Expression (IIFE) to create a new scope for each iteration, capturing the value of `i`.

```javascript
for (var i = 0; i < 3; i++) {
  (function(j) { // j is a new variable for each iteration
    setTimeout(function() {
      console.log(j); // Logs 0, 1, 2
    }, 100);
  })(i); // Pass the current value of i
}
```

### 43\. What is lexical scoping?

**Lexical scoping** (also called static scoping) means that the scope of a variable is determined by its position in the source code at the time of writing, not at runtime. An inner function has access to the scope of its parent functions. This is the mechanism that makes closures possible in JavaScript.

```javascript
const x = 'global';

function outer() {
  const x = 'outer';
  function inner() {
    // 'inner' first looks for 'x' in its own scope. Not found.
    // It then looks in its lexical parent's scope ('outer'). Found.
    console.log(x);
  }
  inner();
}

outer(); // Logs 'outer'
```

### 44\. How can closures cause memory leaks?

A memory leak can occur if a closure holds a reference to a variable or DOM element that is no longer needed. The garbage collector cannot free the memory because the closure is still maintaining a reference to it. This is common with event listeners on DOM elements that are later removed from the page.

```javascript
function attachListener() {
  const largeData = new Array(1e6).join('*'); // Some large data
  const element = document.getElementById('myButton');

  // This closure holds a reference to 'largeData'
  element.addEventListener('click', function onClick() {
    console.log('Button clicked');
    // Even if 'largeData' is only needed once, it stays in memory
    // as long as the event listener exists.
  });
  
  // If 'element' is removed from the DOM without removing the listener,
  // the closure (and 'largeData') will be leaked.
}
```

**Solution**: Always remove event listeners when the component unmounts or the element is destroyed.

### 45\. Implement a function `createCache` that uses a closure for caching.

This function will take another function as an argument and return a new function that caches its results. The cache is stored in a variable that is part of the closure.

```javascript
function createCache(func) {
  const cache = {}; // The cache is stored in the closure

  return function(...args) {
    const key = JSON.stringify(args);
    if (cache[key]) {
      console.log('Fetching from cache...');
      return cache[key];
    } else {
      console.log('Calculating result...');
      const result = func(...args);
      cache[key] = result;
      return result;
    }
  };
}

// Example:
const slowAdd = (a, b) => {
  // Simulate a slow operation
  for (let i = 0; i < 1e8; i++) {}
  return a + b;
};

const cachedAdd = createCache(slowAdd);

console.log(cachedAdd(5, 10)); // Calculating result... 15
console.log(cachedAdd(5, 10)); // Fetching from cache... 15
console.log(cachedAdd(2, 3));  // Calculating result... 5
```

### 46\. What is the difference between Block Scope, Function Scope, and Global Scope?

  * **Global Scope**: Variables declared outside of any function are in the global scope and are accessible from anywhere in the program.
  * **Function Scope**: Variables declared with `var` inside a function are accessible anywhere within that function, but not outside of it.
  * **Block Scope**: Variables declared with `let` and `const` inside a block (e.g., `{...}`, `for` loop, `if` statement) are only accessible within that block.

<!-- end list -->

```javascript
var globalVar = "I'm global"; // Global scope

function myFunction() {
  var functionVar = "I'm in a function"; // Function scope
  if (true) {
    let blockVar = "I'm in a block"; // Block scope
    console.log(blockVar); // Accessible
  }
  // console.log(blockVar); // ReferenceError: blockVar is not defined
}
```

### 47\. Explain what an IIFE (Immediately Invoked Function Expression) is and why it's used.

An **IIFE** is a function that is defined and executed immediately. It's a common pattern for creating a new scope to avoid polluting the global namespace and to create private variables.

```javascript
(function() {
  // All variables and functions inside here are private
  var privateVar = "I am private";
  
  function privateFunction() {
    console.log("This is also private");
  }

  // You can choose to expose certain parts to the global scope
  window.myApp = {
    doSomething: function() {
      privateFunction();
      console.log(privateVar);
    }
  };
})();

// console.log(privateVar); // Error: privateVar is not defined
myApp.doSomething(); // Works
```

### 48\. What is the Module Pattern in JavaScript?

The Module Pattern uses closures (often with an IIFE) to create modules with private and public members. It's a way to encapsulate and organize code before ES6 modules were introduced.

```javascript
const MyModule = (function() {
  // Private members
  let _privateCounter = 0;

  function _privateMethod() {
    return `Private counter is ${_privateCounter}`;
  }

  // Public API (returned object)
  return {
    increment: function() {
      _privateCounter++;
    },
    getCounter: function() {
      return _privateMethod();
    }
  };
})();

MyModule.increment();
console.log(MyModule.getCounter()); // "Private counter is 1"
// console.log(MyModule._privateCounter); // undefined
```

### 49\. Implement a function that can only be called once.

This is a classic use of closures to maintain state (`hasBeenCalled`).

```javascript
function once(func) {
  let hasBeenCalled = false;
  let result;

  return function(...args) {
    if (!hasBeenCalled) {
      hasBeenCalled = true;
      result = func.apply(this, args);
      return result;
    }
    return result; // Return the cached result on subsequent calls
  };
}

// Example
const payBill = (amount) => console.log(`Bill paid for $${amount}`);
const payOnce = once(payBill);

payOnce(100); // "Bill paid for $100"
payOnce(100); // (nothing happens)
payOnce(200); // (nothing happens)
```

### 50\. What is currying? Implement a simple `curry` function.

**Currying** is the technique of transforming a function that takes multiple arguments into a sequence of functions that each take a single argument. A closure is used to remember the arguments passed in previous calls.

```javascript
function curry(fn) {
  // Return a function that will collect arguments
  return function curried(...args) {
    // If we have enough arguments, call the original function
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      // Otherwise, return a new function that waits for the rest
      return function(...args2) {
        return curried.apply(this, args.concat(args2));
      };
    }
  };
}

// Example
function sum(a, b, c) {
  return a + b + c;
}

const curriedSum = curry(sum);

console.log(curriedSum(1)(2)(3)); // 6
console.log(curriedSum(1, 2)(3)); // 6
const add5 = curriedSum(5);
console.log(add5(2)(3)); // 10
```

-----

## 6\. `call`, `apply`, `bind`, and `this`

### 51\. What's the core difference between `call`, `apply`, and `bind`?

All three functions are used to set the `this` context for a function invocation.

  * **`.call(thisArg, arg1, arg2, ...)`**: Invokes the function immediately, with `this` set to `thisArg`. Arguments are passed in as a list.
  * **`.apply(thisArg, [arg1, arg2, ...])`**: Invokes the function immediately, with `this` set to `thisArg`. Arguments are passed in as an array.
  * **`.bind(thisArg, arg1, arg2, ...)`**: Does **not** invoke the function immediately. It returns a **new function** with `this` permanently bound to `thisArg`. Any provided arguments are "partially applied."

<!-- end list -->

```javascript
const person = { name: 'Alice' };

function greet(greeting, punctuation) {
  console.log(`${greeting}, my name is ${this.name}${punctuation}`);
}

greet.call(person, 'Hello', '!');     // Hello, my name is Alice!
greet.apply(person, ['Hi', '.']);      // Hi, my name is Alice.

const greetAlice = greet.bind(person, 'Yo');
greetAlice('?'); // Yo, my name is Alice?
```

### 52\. How does the `this` keyword behave in an arrow function?

Arrow functions do **not** have their own `this` context. Instead, they inherit `this` from their parent's lexical scope (the scope where they were defined). This is a major difference from regular functions, whose `this` value is determined by how they are called.

```javascript
const myObject = {
  name: 'My Object',
  regularMethod: function() {
    console.log(this.name); // 'My Object'
    setTimeout(() => {
      // Arrow function inherits `this` from regularMethod
      console.log(`Async: ${this.name}`); // 'My Object'
    }, 100);
  },
  arrowMethod: () => {
    // Arrow function inherits `this` from the global scope (or `undefined` in strict mode)
    console.log(this.name); // undefined
  }
};

myObject.regularMethod();
// myObject.arrowMethod(); // Would log undefined
```

### 53\. Implement your own `bind` function.

You can create a polyfill for `.bind()` by returning a function that uses `.apply()` to set the context and pass the arguments.

```javascript
Function.prototype.myBind = function(context, ...boundArgs) {
  const originalFunc = this; // The function to be bound

  return function(...callArgs) {
    // Combine arguments from bind time and call time
    const allArgs = [...boundArgs, ...callArgs];

    // Use apply to set the 'this' context and pass all arguments
    return originalFunc.apply(context, allArgs);
  };
};

// Example
const person = { name: 'Bob' };
function introduce(greeting) {
  return `${greeting}, I'm ${this.name}.`;
}

const introduceBob = introduce.myBind(person, 'Hey there');
console.log(introduceBob()); // "Hey there, I'm Bob."
```

### 54\. What is the order of precedence for determining `this`?

1.  **`new` binding**: When a function is called with `new`, `this` is the newly created object.
2.  **Explicit binding**: When using `.call()`, `.apply()`, or `.bind()`, `this` is the object passed as the first argument.
3.  **Implicit binding**: When a function is called as a method of an object (`obj.myMethod()`), `this` is the object itself (`obj`).
4.  **Default binding**: If none of the above rules apply, `this` is the global object (`window` in browsers) or `undefined` in strict mode.

Arrow functions are an exception; they always use lexical scoping for `this`.

### 55\. What does "partial application" mean in the context of `bind`?

**Partial application** is the process of fixing a number of arguments to a function, producing another function of smaller arity (fewer arguments). `.bind()` can do this by accepting arguments after the `this` context.

```javascript
function multiply(a, b) {
  return a * b;
}

// Create a new function `double` where the first argument `a` is always 2.
// `this` is null because it's not used in the `multiply` function.
const double = multiply.bind(null, 2);

console.log(double(5));  // 10 (equivalent to multiply(2, 5))
console.log(double(10)); // 20 (equivalent to multiply(2, 10))
```

### 56\. Can you change the `this` context of a bound function?

No. Once a function has been bound using `.bind()`, its `this` context is permanently set. Even if you try to use `.call()` or `.apply()` on the bound function, you cannot override the original `this` context.

```javascript
const module1 = { x: 42, getX: function() { return this.x; } };
const module2 = { x: 84 };

const boundGetX = module1.getX.bind(module1);
console.log(boundGetX()); // 42

// Trying to change the context with .call() fails
console.log(boundGetX.call(module2)); // Still 42, not 84
```

### 57\. What happens when you use the `new` keyword on a bound function?

When `new` is used on a bound function, the `this` binding created by `.bind()` is ignored. The `new` keyword takes precedence, and `this` will refer to the newly created instance object. However, any arguments that were partially applied using `.bind()` are still passed to the constructor.

```javascript
function Person(name) {
  this.name = name;
}

const BoundPerson = Person.bind({ name: 'IGNORED' }, 'Bob');

const bob = new BoundPerson();

console.log(bob.name); // "Bob"
// The { name: 'IGNORED' } context was ignored because of `new`.
// The 'Bob' argument was still used.
```

### 58\. How would you use `call` or `apply` for "function borrowing"?

You can "borrow" a method from one object and use it on another, as long as the second object has a compatible structure. This is common for borrowing array methods to use on `arguments` or a `NodeList`.

```javascript
function logAllArguments() {
  // 'arguments' is an array-like object, but not a real array.
  // It doesn't have a .forEach method.

  // We can borrow Array.prototype.forEach and use it on 'arguments'.
  Array.prototype.forEach.call(arguments, (item) => {
    console.log(item);
  });
}

logAllArguments('a', 'b', 'c'); // Logs 'a', 'b', 'c'
```

### 59\. Explain prototypal inheritance in JavaScript.

**Prototypal inheritance** is a fundamental concept in JavaScript where objects can inherit properties and methods from other objects. Each object has a private property (accessible via `Object.getPrototypeOf()` or the legacy `__proto__`) which holds a link to another object called its **prototype**. When you try to access a property on an object, if it's not found, the JavaScript engine looks up the prototype chain until it finds the property or reaches the end of the chain (`null`).

```javascript
const animal = {
  speak: function() {
    console.log(`${this.name} makes a noise.`);
  }
};

const dog = Object.create(animal); // dog's prototype is the 'animal' object
dog.name = 'Rex';

dog.speak(); // "Rex makes a noise." (speak is inherited from animal)
```

### 60\. How does the `class` syntax relate to prototypal inheritance?

The `class` syntax introduced in ES6 is primarily **syntactic sugar** over JavaScript's existing prototypal inheritance model. It provides a cleaner, more familiar syntax for creating constructor functions and managing the prototype chain, but underneath it all, it still works the same way.

```javascript
// Class syntax
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    console.log(`${this.name} makes a noise.`);
  }
}

class Dog extends Animal {
  speak() {
    console.log(`${this.name} barks.`);
  }
}

const d = new Dog('Milo');
d.speak(); // "Milo barks."

// This is roughly equivalent to the pre-ES6 prototypal pattern.
```

-----

## 7\. React Performance Optimization

### 61\. What is the difference between `useMemo` and `useCallback`?

Both are hooks used for performance optimization.

  * **`useMemo`**: Memoizes a **value**. It re-runs a function and returns its result, but only when one of its dependencies has changed. It's useful for avoiding expensive calculations on every render.
  * **`useCallback`**: Memoizes a **function**. It returns the same function instance between renders as long as its dependencies haven't changed. This is crucial when passing callbacks to optimized child components that rely on reference equality to prevent unnecessary re-renders (e.g., a child wrapped in `React.memo`).

`useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

```javascript
const MyComponent = ({ items }) => {
  // useMemo for an expensive calculation
  const sortedItems = useMemo(() => {
    console.log('Sorting items...');
    return [...items].sort();
  }, [items]);

  // useCallback to prevent child component re-render
  const handleClick = useCallback(() => {
    console.log('Button clicked!');
  }, []);

  return <OptimizedChildComponent onClick={handleClick} data={sortedItems} />;
};
```

### 62\. How does `React.memo` work?

`React.memo` is a higher-order component (HOC) that memoizes a component. It performs a shallow comparison of the component's previous and new props. If the props are the same, React will skip re-rendering the component and reuse the last rendered result. It's a performance optimization for functional components, similar to `PureComponent` for class components.

```javascript
const MyComponent = (props) => {
  /* renders something using props */
};

// This component will only re-render if its props change.
const MemoizedComponent = React.memo(MyComponent);
```

### 63\. You have a long list of items to render. How would you prevent performance issues?

The best solution is **windowing** or **virtualization**. This technique involves rendering only the small subset of items that are currently visible in the viewport. As the user scrolls, the items that scroll out of view are replaced by the new ones scrolling in. This keeps the number of DOM nodes low, preventing performance bottlenecks. Libraries like `react-window` and `react-virtualized` are excellent for this.

### 64\. What are `useTransition` and `useDeferredValue`?

These are concurrent features in React 18 that help keep the UI responsive during heavy state updates.

  * **`useTransition`**: Lets you mark a state update as a "transition," which tells React that it's a non-urgent update. This allows React to keep the UI responsive (e.g., handling user input) while rendering the new state in the background.
  * **`useDeferredValue`**: Lets you defer re-rendering a non-urgent part of the UI. It's similar to debouncing but is better integrated with React's rendering lifecycle. It tells React that it's okay to render an older version of a value while the new value is being prepared.

<!-- end list -->

```javascript
// useTransition example
const [isPending, startTransition] = useTransition();
const [filter, setFilter] = useState('');

const handleFilterChange = (e) => {
  // The input update is urgent
  setFilter(e.target.value);
  // The list update is a non-urgent transition
  startTransition(() => {
    setFilteredList(getFilteredItems(e.target.value));
  });
};
```

### 65\. When should you *not* use `useMemo`?

You should not use `useMemo` for every calculation. There is an overhead to using it (memory cost for storing the value and comparison cost for dependencies). Only use it when:

1.  The calculation is **demonstrably expensive** (e.g., complex data filtering/sorting, heavy computations).
2.  The function has **referential stability**, meaning it returns the same result for the same inputs.
3.  The dependencies don't change on every render, otherwise, the memoization provides no benefit.

Overusing `useMemo` can sometimes make performance worse.

### 66\. How does code splitting improve React app performance?

**Code splitting** is the practice of breaking up your application's JavaScript bundle into smaller chunks that can be loaded on demand. This improves initial load performance because the user only has to download the code needed for the initial route, rather than the entire application. React provides `React.lazy` and `Suspense` to make code splitting easy.

```javascript
import React, { Suspense } from 'react';

// This component will be loaded in a separate chunk
const OtherComponent = React.lazy(() => import('./OtherComponent'));

function MyApp() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <OtherComponent />
      </Suspense>
    </div>
  );
}
```

### 67\. What's the difference between `PureComponent` and `React.memo`?

They serve the same purpose—preventing re-renders with the same props—but for different component types.

  * **`PureComponent`** is for **class components**. It implements `shouldComponentUpdate` with a shallow prop and state comparison.
  * **`React.memo`** is a Higher-Order Component for **functional components**.

### 68\. You have a parent component passing a function to a child component wrapped in `React.memo`. The child re-renders unnecessarily. Why?

The child re-renders because the parent is creating a **new function instance** on every render. Even though the function's code is the same, its reference is different. `React.memo` does a shallow comparison, sees a new function reference, and triggers a re-render.

**The Fix**: Wrap the function in the parent component with `useCallback` to ensure the same function reference is passed down as long as its dependencies don't change.

```javascript
// Problem
const Parent = () => {
  const [count, setCount] = useState(0);
  // A new function is created on every render
  const handleClick = () => console.log('clicked');
  return <MemoizedChild onClick={handleClick} />;
};

// Solution
const Parent = () => {
  const [count, setCount] = useState(0);
  // useCallback memoizes the function, preserving its reference
  const handleClick = useCallback(() => console.log('clicked'), []);
  return <MemoizedChild onClick={handleClick} />;
};
```

### 69\. How can you profile a React component to find performance bottlenecks?

You can use the **React DevTools Profiler**.

1.  Open the React DevTools in your browser and go to the "Profiler" tab.
2.  Click the record button to start profiling.
3.  Interact with your application to trigger the actions you want to analyze.
4.  Stop the profiler.
5.  The profiler will show you a "flame graph" chart, which visualizes how long each component took to render and why it rendered. This helps you identify components that are rendering too often or taking too long.

### 70\. What is "prop drilling" and how can it affect performance?

**Prop drilling** is the process of passing props down through multiple layers of nested components to get them to a deeply nested child that needs them. While not inherently bad, it can become cumbersome and can lead to performance issues if intermediate components are forced to re-render unnecessarily just because they are passing down a prop that has changed.

**Solution**: Use the **Context API** or a state management library (like Redux or Zustand) to provide data directly to the components that need it, bypassing the intermediate ones.

-----

## 8\. Advanced Promises and Async Patterns

### 71\. Implement `Promise.all()` from scratch.

`Promise.all(promises)` takes an array of promises and returns a new promise that resolves with an array of all the resolved values when *all* promises have resolved. It rejects as soon as *any* one of the promises rejects.

```javascript
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    const totalPromises = promises.length;

    if (totalPromises === 0) {
      resolve([]);
      return;
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise) // Handle non-promise values
        .then(value => {
          results[index] = value;
          completed++;
          if (completed === totalPromises) {
            resolve(results);
          }
        })
        .catch(error => {
          reject(error); // Reject immediately on any error
        });
    });
  });
}
```

### 72\. Implement `Promise.allSettled()` from scratch.

`Promise.allSettled(promises)` waits for *all* promises to settle (either fulfilled or rejected) and then resolves with an array of objects describing the outcome of each promise. It never rejects.

```javascript
function myPromiseAllSettled(promises) {
  return new Promise((resolve) => {
    const results = [];
    let settledCount = 0;
    const totalPromises = promises.length;

    if (totalPromises === 0) {
      resolve([]);
      return;
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          results[index] = { status: 'fulfilled', value };
        })
        .catch(reason => {
          results[index] = { status: 'rejected', reason };
        })
        .finally(() => {
          settledCount++;
          if (settledCount === totalPromises) {
            resolve(results);
          }
        });
    });
  });
}
```

### 73\. What is the difference between `Promise.all` and `Promise.allSettled`?

  * **`Promise.all`**: Uses a **"fail-fast"** strategy. If any promise in the array rejects, `Promise.all` immediately rejects with that single error, and you lose the results of any other promises that might have succeeded.
  * **`Promise.allSettled`**: **Never rejects**. It waits for every promise to complete, regardless of success or failure. It's useful when you need to know the outcome of every promise, even if some fail.

### 74\. What is the difference between `Promise.race` and `Promise.any`?

  * **`Promise.race`**: Settles as soon as the *first promise settles* (either resolves or rejects). If the first promise to settle is a rejection, `Promise.race` rejects.
  * **`Promise.any`**: Settles as soon as the *first promise fulfills (resolves)*. It ignores any promises that reject. It only rejects if *all* of the promises reject, and it rejects with an `AggregateError`.

<!-- end list -->

```javascript
const p1 = new Promise((res, rej) => setTimeout(rej, 100, 'reject 1'));
const p2 = new Promise((res) => setTimeout(res, 200, 'resolve 2'));

Promise.race([p1, p2]).catch(err => console.log('Race:', err));   // Race: reject 1
Promise.any([p1, p2]).then(val => console.log('Any:', val));      // Any: resolve 2
```

### 75\. Implement a promise-based retry mechanism.

Write a function that attempts to execute an async operation and retries it a specified number of times if it fails.

```javascript
function retry(asyncFn, retries = 3, delay = 50) {
  return new Promise((resolve, reject) => {
    const attempt = (currentTry) => {
      asyncFn()
        .then(resolve)
        .catch(error => {
          if (currentTry >= retries) {
            reject(error);
          } else {
            console.log(`Attempt ${currentTry} failed. Retrying...`);
            setTimeout(() => attempt(currentTry + 1), delay);
          }
        });
    };
    attempt(1);
  });
}

// Example:
let count = 0;
const mightFail = () => new Promise((resolve, reject) => {
  count++;
  if (count < 3) {
    reject(new Error('Failed!'));
  } else {
    resolve('Success!');
  }
});

retry(mightFail).then(console.log).catch(console.error);
```

### 76\. How do you create a `Promise` from scratch?

You can implement a basic `Promise` class to understand its internal state transitions (`pending`, `fulfilled`, `rejected`) and how it handles chaining callbacks.

```javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        this.onFulfilledCallbacks.forEach(cb => cb(this.value));
      }
    };

    const reject = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.reason = reason;
        this.onRejectedCallbacks.forEach(cb => cb(this.reason));
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    // Basic implementation for demonstration
    if (this.state === 'fulfilled') {
      onFulfilled(this.value);
    }
    if (this.state === 'rejected') {
      onRejected(this.reason);
    }
    if (this.state === 'pending') {
      this.onFulfilledCallbacks.push(onFulfilled);
      this.onRejectedCallbacks.push(onRejected);
    }
  }
}
```

### 77\. What is an async iterator and generator?

An **async generator** is a function (`async function*`) that can `yield` promises. An **async iterator** is the object returned by an async generator, which allows you to loop over asynchronous data sources using `for await...of`. This is incredibly useful for things like streaming data from an API.

```javascript
async function* fetchPaginatedData(url) {
  let nextUrl = url;
  while (nextUrl) {
    const response = await fetch(nextUrl);
    const data = await response.json();
    yield data.results; // Yield the chunk of data
    nextUrl = data.next; // Get the URL for the next page
  }
}

// Usage
(async () => {
  const dataStream = fetchPaginatedData('https://api.example.com/items');
  for await (const items of dataStream) {
    console.log('Received chunk of items:', items);
  }
})();
```

### 78\. How can you limit the concurrency of asynchronous operations?

You can create a "pool" or a queue that processes a limited number of promises at a time. This is useful for avoiding rate limits or overwhelming a server with requests.

```javascript
async function runWithConcurrency(tasks, limit) {
  const results = [];
  const executing = [];
  for (const task of tasks) {
    const p = task().then(result => {
      // When a task finishes, remove it from the executing array
      executing.splice(executing.indexOf(p), 1);
      return result;
    });
    results.push(p);
    executing.push(p);

    if (executing.length >= limit) {
      // Wait for one of the running tasks to finish before starting a new one
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

// Example
const tasks = [/* array of functions that return promises */];
// runWithConcurrency(tasks, 3); // Runs a max of 3 tasks at once
```

### 79\. What does the `.finally()` method on a Promise do?

The `.finally(callback)` method schedules a function to be called when the promise is settled (either fulfilled or rejected). It's useful for cleanup code that should run regardless of the outcome, like hiding a loading spinner. The `callback` does not receive any arguments.

```javascript
showLoadingSpinner();

fetchData()
  .then(data => console.log(data))
  .catch(err => console.error(err))
  .finally(() => {
    // This will always run, whether the fetch succeeded or failed.
    hideLoadingSpinner();
  });
```

### 80\. Can a `finally` block change the resolved value of a promise?

No, not directly. If the `finally` callback returns a value, it's ignored. The original settlement value is passed on to the next `.then()` or `.catch()`. However, if the `finally` callback throws an error or returns a rejected promise, it will override the original settlement and cause the promise chain to reject with that new reason.

-----

## 9\. State Management Architecture

### 81\. How would you implement a simple Redux-like store from scratch?

A simple Redux store has three main parts:

1.  **State**: A single object holding the application state.
2.  **Reducer**: A pure function that takes the current state and an action and returns a new state.
3.  **Store**: An object that holds the state, allows dispatching actions, and lets components subscribe to changes.

<!-- end list -->

```javascript
function createStore(reducer) {
  let state;
  let listeners = [];

  const getState = () => state;

  const dispatch = (action) => {
    state = reducer(state, action); // Update state
    listeners.forEach(listener => listener()); // Notify subscribers
  };

  const subscribe = (listener) => {
    listeners.push(listener);
    return function unsubscribe() { // Return an unsubscribe function
      listeners = listeners.filter(l => l !== listener);
    };
  };
  
  dispatch({}); // Initialize the state
  
  return { getState, dispatch, subscribe };
}

// Example Reducer
const counterReducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case 'INCREMENT': return { count: state.count + 1 };
    default: return state;
  }
};

const store = createStore(counterReducer);
store.subscribe(() => console.log(store.getState()));
store.dispatch({ type: 'INCREMENT' }); // { count: 1 }
```

### 82\. Explain the Observer design pattern.

The **Observer pattern** is a behavioral design pattern where an object, called the **subject**, maintains a list of its dependents, called **observers**, and notifies them automatically of any state changes. This is the core principle behind many state management and event-handling systems.

```javascript
class Subject {
  constructor() {
    this.observers = [];
  }
  subscribe(observer) {
    this.observers.push(observer);
  }
  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }
  notify(data) {
    this.observers.forEach(observer => observer.update(data));
  }
}

class Observer {
  update(data) {
    console.log(`Observer received data: ${data}`);
  }
}

const subject = new Subject();
const observer1 = new Observer();
const observer2 = new Observer();

subject.subscribe(observer1);
subject.subscribe(observer2);

subject.notify('Hello World!'); // Both observers will log the message.
```

### 83\. How would you implement a simple state management solution using React's Context and Hooks?

You can combine `useContext` and `useReducer` to create a scalable state management system without external libraries. The `useReducer` hook manages the state logic, and the `Context` provides that state and the `dispatch` function to any component in the tree that needs it.

```javascript
// 1. Create the Context
const StateContext = React.createContext();

// 2. Create the Provider Component
const StateProvider = ({ reducer, initialState, children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
};

// 3. Create a custom hook for easy access
const useStateValue = () => useContext(StateContext);

// 4. Usage in App
// <StateProvider initialState={initialState} reducer={reducer}>
//   <MyComponent />
// </StateProvider>

// 5. Usage in MyComponent
const MyComponent = () => {
  const { state, dispatch } = useStateValue();
  // ...
};
```

### 84\. What is the Pub/Sub (Publisher/Subscriber) pattern?

The **Pub/Sub pattern** is similar to the Observer pattern but is more decoupled. In Pub/Sub, publishers send messages to a central message broker or event bus on specific "topics" without knowing who the subscribers are. Subscribers register their interest in a topic and only receive messages for that topic. This decoupling allows publishers and subscribers to evolve independently.

```javascript
class PubSub {
  constructor() {
    this.topics = {};
  }
  subscribe(topic, callback) {
    if (!this.topics[topic]) this.topics[topic] = [];
    this.topics[topic].push(callback);
  }
  publish(topic, data) {
    if (!this.topics[topic]) return;
    this.topics[topic].forEach(callback => callback(data));
  }
}

const eventBus = new PubSub();
eventBus.subscribe('user:login', (user) => console.log(`${user.name} logged in.`));
eventBus.publish('user:login', { name: 'Alice' });
```

### 85\. How can you create a reactive state object using `Proxy`?

A `Proxy` object allows you to intercept and customize fundamental operations for an object (like getting or setting properties). You can use this to create a reactive system where you can automatically trigger updates whenever a property of a state object is changed. This is the core mechanism behind libraries like Vue.

```javascript
function createReactive(obj, onChange) {
  return new Proxy(obj, {
    set(target, property, value) {
      // Set the property on the original object
      target[property] = value;
      // Trigger the callback
      onChange();
      return true; // Indicate success
    }
  });
}

// Example usage
let state = { count: 0 };
const render = () => console.log(`Count is now: ${state.count}`);

const reactiveState = createReactive(state, render);

reactiveState.count = 1; // "Count is now: 1" is logged automatically
reactiveState.count = 2; // "Count is now: 2" is logged automatically
```

### 86\. What is a "selector" in the context of state management (like Redux)?

A **selector** is a pure function that takes the entire state object as an argument and returns a derived or computed piece of data from it. Selectors are useful for:

1.  **Decoupling**: Components don't need to know the shape of the global state tree.
2.  **Memoization**: Libraries like `reselect` can create memoized selectors that only recompute their value if the relevant part of the state has changed, which is a powerful performance optimization.

<!-- end list -->

```javascript
// Without a selector
const total = state.cart.items.reduce((sum, item) => sum + item.price, 0);

// With a selector
const getCartItems = state => state.cart.items;
const getCartTotal = createSelector( // From 'reselect' library
  [getCartItems],
  (items) => items.reduce((sum, item) => sum + item.price, 0)
);

// In component: const total = useSelector(getCartTotal);
```

### 87\. What are the pros and cons of global state vs. component state?

  * **Component State (`useState`)**
      * **Pros**: Simple, co-located with the component, easy to understand.
      * **Cons**: Can lead to "prop drilling" if state needs to be shared with distant components.
  * **Global State (Context, Redux, etc.)**
      * **Pros**: Accessible from anywhere, avoids prop drilling, provides a single source of truth.
      * **Cons**: Can add complexity and boilerplate, can cause performance issues if not managed carefully (e.g., components re-rendering because an unrelated part of the global state changed).

**Rule of thumb**: Keep state as local as possible. Only lift state up to a common ancestor or a global store when it truly needs to be shared.

### 88\. What is a finite state machine (FSM) and how can it be used for state management?

A **Finite State Machine** is a model where a system can be in only one of a finite number of "states" at any given time. It can transition from one state to another in response to an "event". FSMs are excellent for managing complex UI logic because they make invalid states impossible. For example, a data fetch can only be in one of these states: `idle`, `loading`, `success`, or `error`. You can't be in both `loading` and `error` at the same time. Libraries like XState help implement this pattern.

```javascript
// A simple state machine for a promise
const promiseMachine = {
  initial: 'idle',
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
    success: { on: { FETCH: 'loading' } },
    error: { on: { FETCH: 'loading' } },
  }
};
```

### 89\. How is Zustand different from Redux?

Zustand is a smaller, simpler state management library that is often seen as a modern alternative to Redux. Key differences:

  * **Boilerplate**: Zustand has almost no boilerplate. You create a store in a few lines of code.
  * **API**: It uses a simple hook-based API (`const count = useStore(state => state.count)`). You don't need `Provider` wrappers or `connect` HOCs.
  * **Immutability**: While Redux enforces immutability via reducers, Zustand allows you to mutate state directly within its actions by using Immer under the hood.

### 90\. Explain "atomic state" management (like Recoil or Jotai).

**Atomic state management** is a pattern where state is broken down into small, independent pieces called "atoms". Components can subscribe to individual atoms. When an atom's value changes, only the components that subscribe to that specific atom will re-render. This approach avoids the issue of a large, monolithic store causing widespread re-renders and provides a more granular and performant way to manage state.

-----

## 10\. System Design and Component Architecture

### 91\. Design a search autocomplete component: describe the components, state, and interactions.

**Components:**

  * `AutocompleteWrapper`: Manages state and API calls.
  * `SearchInput`: The actual `<input>` element.
  * `ResultsList`: A `<ul>` that displays the suggestions.
  * `ResultItem`: An `<li>` for a single suggestion.

**State Management (`useState`):**

  * `query` (string): The current value of the input field.
  * `suggestions` (array): The list of results from the API.
  * `isLoading` (boolean): To show a loading indicator.
  * `activeIndex` (number): To track the highlighted item for keyboard navigation.

**Interactions & Optimizations:**

1.  **User Input**: The `onChange` handler of `SearchInput` updates the `query` state.
2.  **Debouncing**: An effect (`useEffect`) listens for changes to `query`. It uses a **debounce** function to wait \~300ms after the user stops typing before making an API call.
3.  **API Call**: The debounced function fetches data based on the `query` and updates the `suggestions` and `isLoading` state.
4.  **Caching**: Implement a simple cache (e.g., a JavaScript `Map`) to store results for previous queries to avoid redundant API calls.
5.  **Keyboard Navigation**: An effect adds a `keydown` listener. It checks for `ArrowUp`, `ArrowDown`, and `Enter` keys to update the `activeIndex` and select an item.
6.  **Accessibility**:
      * Use `aria` attributes: `aria-autocomplete="list"`, `aria-controls` on the input linking to the list's ID.
      * The results list should have `role="listbox"`, and items should have `role="option"`.
      * `aria-selected` on the active item should be `true`.

### 92\. How would you design a reusable and accessible Modal component?

**Component Structure:**

  * A `Modal` component that takes `isOpen` (boolean) and `onClose` (function) props.
  * It uses a **React Portal** (`ReactDOM.createPortal`) to render its children into a dedicated DOM node outside the main React app root (e.g., directly inside `<body>`). This solves z-index and styling issues.

**Accessibility Features:**

1.  **Focus Management**:
      * When the modal opens, focus should be moved to the first focusable element inside it.
      * **Focus Trapping**: While the modal is open, the `Tab` key should cycle through focusable elements *only within the modal*. It should not be possible to tab to elements in the background.
2.  **Keyboard Interaction**: The `Escape` key should close the modal by calling `onClose`.
3.  **ARIA Roles**: The modal container should have `role="dialog"`, `aria-modal="true"`, and an `aria-labelledby` attribute pointing to the ID of the modal's title.
4.  **Background Content**: The rest of the page should be hidden from screen readers using `aria-hidden="true"`.

<!-- end list -->

```javascript
// Simplified example of using a portal
import ReactDOM from 'react-dom';

const Modal = ({ children }) => {
  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body // Render into the body
  );
};
```

### 93\. How would you implement an infinite scroll feature?

1.  **State**: Manage state for `items` (array), `page` (number), `isLoading` (boolean), and `hasMore` (boolean).
2.  **API Fetching**: Create an `async` function `fetchItems(page)` that fetches a new batch of data from the API. When data is received, append it to the `items` array, increment the `page` number, and update `hasMore` if the API indicates there's no more data.
3.  **Trigger**: Use the **Intersection Observer API**. Create a reference to a sentinel element (e.g., an empty `div`) at the bottom of the list. The observer's callback will be triggered when this element enters the viewport.
4.  **Implementation**:
      * Use `useEffect` to set up the Intersection Observer when the component mounts.
      * The observer's callback will check if `isLoading` is false and `hasMore` is true. If so, it calls `fetchItems`.
      * Make sure to clean up the observer in the `useEffect` return function.

### 94\. What are micro-frontends? Discuss one advantage and one disadvantage.

**Micro-frontends** is an architectural style where a web application is composed of small, independent frontend applications. Each "micro-frontend" can be developed, tested, and deployed independently by a separate team.

  * **Advantage: Independent Teams & Technology Stacks**. Teams can work autonomously on their part of the application. One team could use React, another Vue, and another Angular, all within the same larger application. This allows for faster, more focused development.
  * **Disadvantage: Operational Complexity**. Managing a micro-frontend architecture can be complex. You need to handle routing between different apps, maintain a consistent user experience (shared styles and components), manage shared state, and orchestrate the build and deployment pipeline for multiple independent projects.

### 95\. You are asked to build a feature flag system. How would you design it?

A feature flag (or feature toggle) system allows you to turn features on or off without deploying new code.

**Design:**

1.  **Configuration Source**: The flags can be stored in a JSON file, a database, or a third-party service (like LaunchDarkly). The config would map a feature name to a boolean (`true`/`false`) or a more complex rule (e.g., enable for 10% of users).
2.  **Provider Component**: Create a `FeatureFlagProvider` at the root of the app. It fetches the flag configuration and places it in a React Context.
3.  **Accessing Flags**:
      * **Hook**: Create a `useFeatureFlag('feature-name')` custom hook that reads from the context and returns whether the feature is enabled.
      * **Component**: Create a `<Feature name="my-feature">...</Feature>` component that only renders its children if the feature is enabled.
4.  **Dynamic Updates**: For a more advanced system, the provider could use WebSockets or polling to listen for real-time updates to the flag configuration, allowing you to toggle features without a page refresh.

### 96\. How would you handle internationalization (i18n) in a large React application?

1.  **Translation Files**: Store translations in JSON files, organized by language (e.g., `en.json`, `es.json`).
    ```json
    // en.json
    { "welcomeMessage": "Hello, {name}!" }
    ```
2.  **i18n Library**: Use a dedicated library like `react-i18next` (which builds on `i18next`). This library provides:
      * A **provider** (`I18nextProvider`) to load the translation files and make the i18n instance available via context.
      * A **hook** (`useTranslation`) to access the translation function (`t`) within components.
3.  **Usage**:
    ```javascript
    import { useTranslation } from 'react-i18next';

    function MyComponent() {
      const { t } = useTranslation();
      const name = "World";
      return <h1>{t('welcomeMessage', { name })}</h1>;
    }
    ```
4.  **Language Detection**: The library can automatically detect the user's language from the browser settings or allow the user to switch languages manually.

### 97\. Design a theming system (light/dark mode) for a React app.

1.  **Theme Definition**: Create JavaScript objects that define the theme variables (colors, fonts, spacing) for light and dark modes.
    ```javascript
    const lightTheme = { background: '#FFF', text: '#000' };
    const darkTheme = { background: '#000', text: '#FFF' };
    ```
2.  **Theme Provider**: Create a `ThemeProvider` component that uses React Context. It will hold the current theme state (`'light'` or `'dark'`) and a function to toggle it.
3.  **Styling Method**:
      * **CSS-in-JS (e.g., Styled Components, Emotion)**: The `ThemeProvider` from the library passes the theme object down via context. Components can then access theme variables directly in their styles.
      * **CSS Variables**: The `ThemeProvider` can apply the theme by setting CSS variables on the root element (`:root`). Your regular CSS files can then use these variables (`var(--background-color)`). Toggling the theme just involves changing the values of these variables. This is often more performant.

### 98\. What are web components and how do they differ from React components?

**Web Components** are a set of browser-native APIs that allow you to create custom, reusable, and encapsulated HTML tags. They are built on three main technologies: Custom Elements, Shadow DOM, and HTML Templates.

**Differences:**

  * **Framework Agnostic vs. Framework Specific**: Web Components are a browser standard and work in any framework (or with no framework at all). React components only work within the React ecosystem.
  * **Encapsulation**: Web Components use the **Shadow DOM** to provide strong encapsulation for both styles and structure. CSS styles inside a web component won't leak out, and global styles won't leak in. React's style encapsulation is typically managed by conventions or tools (e.g., CSS Modules).
  * **API**: Web Components use an imperative, DOM-based API. React uses a declarative API where you describe the UI based on state.

### 99\. What is an "island" architecture for frontend development?

The **Islands Architecture** is a pattern for building websites that are primarily static HTML but contain small, isolated "islands" of dynamic interactivity. The base page is server-rendered as static, fast-loading HTML. JavaScript is then only shipped for the interactive components (the islands), which "hydrate" independently.

This contrasts with the Single-Page Application (SPA) model, where a large JavaScript bundle hydrates the entire page. Islands architecture leads to much better performance on initial load (Time to Interactive) because most of the page is non-interactive HTML/CSS. Frameworks like Astro are built on this concept.

### 100\. How would you design a plugin system for a JavaScript application?

A plugin system allows third-party developers to extend your application's functionality.

**Design:**

1.  **Core Application & Lifecycle Hooks**: The main application should expose a set of "hooks" or "lifecycle events" where plugins can inject logic (e.g., `beforeRender`, `onDataFetched`, `registerMenuItem`).
2.  **Plugin Manager**: A central manager responsible for loading, registering, and initializing plugins.
3.  **Plugin API**: A well-defined API that plugins must adhere to. A plugin would typically be an object or a function that returns an object with methods corresponding to the lifecycle hooks.
    ```javascript
    // Core App
    class App {
      constructor() {
        this.pluginManager = new PluginManager();
      }
      registerPlugin(plugin) {
        this.pluginManager.register(plugin, this); // Pass app instance to plugin
      }
      render() {
        this.pluginManager.runHook('beforeRender');
        // ... render logic
      }
    }

    // Example Plugin
    const MyPlugin = {
      name: 'LoggerPlugin',
      initialize(app) { /* ... */ },
      beforeRender() {
        console.log('App is about to render!');
      }
    };
    ```
4.  **Sandbox (Security)**: For untrusted plugins, you might run them in a sandboxed environment (like a Web Worker or an iframe) to limit their access to the main application and global objects.

## 1\. The Event Loop and Asynchronous JavaScript (Continued)

### 101\. What is `requestIdleCallback` and how does it differ from `setTimeout`?

**`requestIdleCallback`** is a browser API that queues a function to be called during a browser's idle periods. This is perfect for running low-priority, background tasks without interfering with high-priority work like animations or user input.

  * **`requestIdleCallback`**: The browser decides when to run the callback. It might be delayed significantly or not run at all if the browser is constantly busy. It's for **non-essential** work.
  * **`setTimeout(fn, 0)`**: The callback is guaranteed to run on the next macrotask queue. It's for work that needs to be done asynchronously but **as soon as possible**.

<!-- end list -->

```javascript
// Use for low-priority tasks like sending analytics
requestIdleCallback((deadline) => {
  // The deadline object tells you how much idle time you have left
  while (deadline.timeRemaining() > 0) {
    // do some work...
  }
  console.log('Idle callback executed.');
});

// Use for tasks that need to happen right after the current script
setTimeout(() => {
  console.log('setTimeout executed.');
}, 0);
```

### 102\. What are "async stack traces" and how do they help with debugging?

In the past, debugging asynchronous code was difficult because the call stack would be cleared between async operations. If an error occurred inside a `.then()` block, you wouldn't know what caused the promise to be initiated.

**Async stack traces** are a modern browser feature that "stitches together" the stack from different asynchronous parts. This gives you the full story of how an error occurred, making it much easier to debug promises and `async/await`.

```javascript
function main() {
  doAsyncTask();
}

function doAsyncTask() {
  Promise.resolve().then(() => {
    throw new Error("💥 Boom!");
  });
}

main();

// Modern Browser Console Output:
// Uncaught (in promise) Error: 💥 Boom!
//     at <anonymous>:10:11    // Error location
//     at async doAsyncTask   // Async context is preserved
//     at async main          // You can trace it back to the origin
```

### 103\. Explain what happens if a microtask continuously adds another microtask to the queue.

This is known as **microtask queue starvation**. The event loop must process all microtasks before it can move on to the next macrotask (like rendering or handling user input). If a microtask keeps adding new microtasks, the queue will never become empty. As a result, the browser's main thread will be completely blocked, freezing the UI and making the page unresponsive.

```javascript
function starve() {
  console.log('Microtask running...');
  Promise.resolve().then(starve); // Immediately queue another one
}

// This will freeze the tab.
starve();
```

### 104\. What is a "zombie timer"?

A zombie timer is a `setTimeout` or `setInterval` that continues to run in the background even after the component or object that created it has been destroyed. This can lead to memory leaks and unexpected errors when the timer's callback tries to access variables or elements that no longer exist.

**Solution**: Always clear your timers in a cleanup function. In React, this is done in the return function of `useEffect`.

```javascript
// In a React component
useEffect(() => {
  const timerId = setInterval(() => {
    console.log('Tick!');
    // If this component unmounts, this timer becomes a "zombie"
    // and might try to update state on an unmounted component.
  }, 1000);

  // The cleanup function
  return () => {
    clearInterval(timerId); // Prevents the zombie timer
    console.log('Timer cleared.');
  };
}, []);
```

### 105\. What is the difference between a Promise and an Observable?

Promises and Observables both handle asynchronous operations, but they have key differences.

  * **Promise**: Handles a **single event** (the eventual completion or failure). It is **not cancellable** (once created, it will run). Promises are eager (they start executing immediately).
  * **Observable**: Handles a **stream of multiple values** over time (like user clicks, WebSocket data, etc.). They are **cancellable** (you can unsubscribe to stop listening). Observables are lazy (they don't start emitting values until you subscribe).

<!-- end list -->

```javascript
// Observables are not native to JS, this is pseudo-code for a library like RxJS
import { Observable } from 'rxjs';

const myObservable = new Observable(subscriber => {
  subscriber.next(1); // Emits a value
  subscriber.next(2);
  setTimeout(() => {
    subscriber.next(3);
    subscriber.complete();
  }, 1000);
});

const subscription = myObservable.subscribe({
  next: x => console.log(x),
  complete: () => console.log('Done!')
});

// You can cancel it
// subscription.unsubscribe();
```

### 106\. How would you create a cancellable promise?

Native promises are not cancellable. However, you can wrap a promise to add cancellation logic. A common pattern is to use an `AbortController`, which is the same API used to cancel `fetch` requests.

```javascript
function makeCancellable(promise, signal) {
  return new Promise((resolve, reject) => {
    // If the signal is already aborted, reject immediately.
    if (signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }

    const onAbort = () => {
      // Clean up listeners
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort);

    promise.then(
      val => {
        signal.removeEventListener('abort', onAbort);
        resolve(val);
      },
      err => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      }
    );
  });
}

// Usage
const controller = new AbortController();
const { signal } = controller;

const longFetch = new Promise(res => setTimeout(() => res('Data!'), 5000));
const cancellableFetch = makeCancellable(longFetch, signal);

cancellableFetch
  .then(console.log)
  .catch(err => console.error(err.name)); // 'AbortError'

// After 1 second, cancel the operation
setTimeout(() => controller.abort(), 1000);
```

### 107\. What are the pros and cons of top-level `await`?

**Top-level `await`** allows you to use `await` outside of an `async` function, at the top level of an ES module.

  * **Pros**:

      * **Simplified Initialization**: Great for fetching configuration or dependencies before any other code in the module runs.
      * **Dynamic Dependencies**: Can be used to conditionally load modules.
      * **Cleaner Code**: Avoids wrapping initialization logic in an `async IIFE`.

  * **Cons**:

      * **Blocking Module Execution**: It can block the execution and instantiation of other modules that depend on it, potentially slowing down application startup if not used carefully.
      * **ES Modules Only**: It only works in ES modules, not in classic scripts.

### 108\. What is `setImmediate` in Node.js?

`setImmediate` is a Node.js-specific function that schedules a callback to run in the **check phase** of the event loop. This phase runs right after the poll phase (where I/O events are handled).

  * **`setTimeout(fn, 0)`**: Runs in the **timers phase**.
  * **`setImmediate(fn)`**: Runs in the **check phase**.

The order between them can be unpredictable if they are called from the main module, but when called from within an I/O callback, `setImmediate` is **always** executed before any `setTimeout`.

```javascript
// In a Node.js file
const fs = require('fs');

fs.readFile(__filename, () => {
  // This is an I/O callback
  setTimeout(() => console.log('setTimeout'), 0);
  setImmediate(() => console.log('setImmediate'));
});

// Output will always be:
// setImmediate
// setTimeout
```

### 109\. How does an `async` function implicitly handle errors?

When you write an `async` function, JavaScript implicitly wraps the entire body in a `try...catch` block. If any error is thrown inside the function (or from a promise that you `await`), it is caught, and the promise returned by the `async` function is **rejected** with that error.

```javascript
async function fetchData() {
  // This implicitly returns a promise
  throw new Error("Failed to fetch");
}

// Is roughly equivalent to:
function fetchDataEquivalent() {
  return new Promise((resolve, reject) => {
    try {
      // Your function body would be here...
      throw new Error("Failed to fetch");
    } catch (error) {
      reject(error);
    }
  });
}

fetchData().catch(err => console.log(err.message)); // "Failed to fetch"
```

### 110\. Can you explain "blocking the event loop"?

**Blocking the event loop** means executing a long-running, synchronous task on the main thread. Because JavaScript is single-threaded, while this task is running, the event loop is "blocked." It cannot process anything else—no user input (clicks, scrolls), no rendering updates, no `setTimeout` callbacks, nothing. This leads to a frozen and unresponsive webpage.

```javascript
function blockTheLoop() {
  console.log('Starting a long task...');
  // This is a synchronous, long-running operation
  const start = Date.now();
  while (Date.now() - start < 5000) {
    // Doing nothing for 5 seconds...
  }
  console.log('Task finished.');
}

// The UI will be frozen for 5 seconds when you call this.
blockTheLoop();
```

-----

## 2\. Browser Internals and Networking (Continued)

### 111\. What is the Shadow DOM?

The **Shadow DOM** is a browser technology that allows you to encapsulate a piece of the DOM. It creates a hidden, separate DOM tree attached to an element. Styles and scripts inside the Shadow DOM are isolated from the main document's DOM (the "Light DOM"). This is the foundation of Web Components and prevents CSS styles from leaking in or out.

### 112\. Explain the role of a Service Worker.

A **Service Worker** is a script that the browser runs in the background, separate from a web page. It acts as a programmable network proxy, allowing you to intercept and control how network requests from your application are handled.

Key use cases:

  * **Offline Support**: Caching assets and API responses to make the application work offline.
  * **Push Notifications**: Receiving push messages from a server, even when the app is not open.
  * **Background Sync**: Deferring actions until the user has a stable internet connection.

### 113\. What is the difference between WebSockets and Server-Sent Events (SSE)?

Both provide real-time updates from the server, but they are used for different scenarios.

  * **WebSockets**: Provide a **bi-directional**, full-duplex communication channel. Both the client and server can send messages to each other at any time. Ideal for applications like chat apps, online games, and collaborative editing.
  * **Server-Sent Events (SSE)**: Provide a **uni-directional** channel. Only the server can send data to the client. SSE is simpler to implement and uses standard HTTP. It's perfect for things like live stock tickers, news feeds, or notifications where the client only needs to receive updates.

### 114\. What is IndexedDB and when would you use it?

**IndexedDB** is a low-level, transactional database system built into the browser. It's a key-value store that allows you to store large amounts of structured data (including files/blobs) persistently on the client-side.

You would use it over `localStorage` when:

  * You need to store a **large amount of data** (localStorage is typically limited to 5-10MB).
  * You need to **query or index** the data for efficient lookups.
  * You need **transactional** support to ensure data integrity.
  * You need to store complex JavaScript objects without serializing them to strings.

### 115\. What is HTTP Strict Transport Security (HSTS)?

**HSTS** is a security policy mechanism that helps protect websites against protocol downgrade attacks and cookie hijacking. When a user visits a site with an HSTS header, the browser is instructed to *only* communicate with that site over HTTPS for a specified period. Any future attempts to access it using HTTP will be automatically converted to HTTPS by the browser.

### 116\. What's the difference between a "blocking" and "non-blocking" resource in the rendering path?

  * **Blocking Resource**: A resource that pauses the parsing of the HTML document. By default, `<script>` tags without `async` or `defer` and `<link rel="stylesheet">` tags are render-blocking. The browser must download, parse, and execute them before it can continue building the DOM and render the page.
  * **Non-Blocking Resource**: A resource that does not pause HTML parsing. Images (`<img>`), scripts with `async` or `defer`, and stylesheets loaded asynchronously do not block the initial render.

### 117\. How does a browser handle a DNS prefetch?

**DNS prefetching** is a performance optimization where the browser proactively performs DNS lookups for domains that the user might visit in the near future. You can hint to the browser to do this using a `<link>` tag. This reduces latency when the user eventually clicks a link to that domain because the IP address has already been resolved.

```html
<link rel="dns-prefetch" href="//assets.example.com">
```

### 118\. What is the `Same-Origin Policy` and why is it important?

The **Same-Origin Policy (SOP)** is a critical security mechanism in web browsers. It restricts how a document or script loaded from one "origin" can interact with a resource from another "origin". An origin is defined by the combination of protocol, hostname, and port.

The SOP prevents a malicious script on one page from obtaining sensitive data from another web page through DOM manipulation or by reading responses to network requests. **CORS** (Cross-Origin Resource Sharing) is the mechanism that allows servers to relax this policy in a controlled way.

### 119\. What is a "memory heap" and "call stack" in the context of the V8 JavaScript engine?

  * **Memory Heap**: This is an unstructured region of memory where objects are allocated. When you create objects, arrays, or functions in your code, they are stored in the heap. V8's garbage collector is responsible for cleaning up unused memory in the heap.
  * **Call Stack**: This is a data structure that keeps track of function calls in the program. When a function is called, a "frame" is pushed onto the stack. When the function returns, its frame is popped off. The call stack has a fixed size, and if you exceed it (e.g., with unterminated recursion), you get a "stack overflow" error.

### 120\. Can you explain the BFC (Block Formatting Context)?

A **Block Formatting Context (BFC)** is a part of a visual CSS rendering of a web page in which block-level elements are laid out. It's an isolated layout environment. Creating a new BFC can solve certain layout problems. For example:

  * It contains floating elements, preventing floats from "leaking" outside their container.
  * It prevents margins from collapsing between adjacent elements.

You can create a new BFC by setting properties like `overflow: hidden`, `display: flow-root`, or `position: absolute`.

-----

## 3\. Debounce, Throttle, and More (Continued)

### 121\. Implement a generic `memoize` higher-order function.

**Memoization** is an optimization technique where you cache the results of expensive function calls and return the cached result when the same inputs occur again.

```javascript
function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    // Create a key based on the arguments. JSON.stringify is a simple way.
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log('Returning from cache');
      return cache.get(key);
    }

    console.log('Computing new result');
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// Example
const fibonacci = (n) => {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

// Without memoization, fibonacci(40) is incredibly slow.
const memoizedFib = memoize((n) => {
  if (n < 2) return n;
  return memoizedFib(n - 1) + memoizedFib(n - 2); // Note the recursive call
});

// With memoization, it's nearly instant.
console.log(memoizedFib(40));
```

### 122\. How would you design a React hook `useDebounce` that returns a value?

Instead of returning a debounced function, this hook takes a value and returns a new version of that value only after a specified delay. This is very useful for triggering effects based on user input.

```javascript
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay has passed
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run effect only if value or delay changes

  return debouncedValue;
}

// Usage in a component
const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  // This will only update 500ms after the user stops typing
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    // This effect will run only with the debounced value
    if (debouncedSearchTerm) {
      // makeAPICall(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return <input onChange={e => setSearchTerm(e.target.value)} />;
};
```

### 123\. What are the memory implications of using memoize, debounce, or throttle?

These utilities rely on closures to store state (`cache`, `timeoutId`, etc.). If you create a memoized or debounced function with a very large closure (i.e., it captures large variables from its parent scope) or a memoize cache that grows indefinitely, it can lead to high memory consumption or memory leaks if not managed properly. For memoization, it's sometimes necessary to use a cache with a limited size (like an LRU cache) to prevent it from growing forever.

### 124\. How is `throttle` different from using `requestAnimationFrame` for scroll events?

  * **`throttle(fn, 100)`**: Guarantees that the function runs at most once every 100ms. This provides a consistent, predictable rate. It is time-based.
  * **`requestAnimationFrame(fn)`**: The browser executes the function just before the next repaint. The rate depends on the screen's refresh rate (typically \~60fps, or every \~16.7ms). This is ideal for visual updates because it perfectly syncs your work with the browser's rendering cycle, preventing visual "jank".

**Choose `requestAnimationFrame` for visual updates (like animations). Choose `throttle` for rate-limiting other tasks (like API calls).**

### 125\. What is the "trailing" option in a throttle implementation?

  * **Leading (default)**: The function is executed on the first call within a time window.
  * **Trailing**: The function is executed on the last call that occurred during the time window, after the delay has passed.

A robust `throttle` implementation often includes options for both. Enabling the trailing edge ensures that the very last event is always processed, which can be important.

```javascript
function throttle(func, delay, { leading = true, trailing = true } = {}) {
    // ... more complex implementation
}
```

### 126\. Can you debounce a promise-returning function?

Yes, but you need to handle the promise resolution carefully. A standard debounce implementation would just debounce the *creation* of the promise, not wait for its result. A more advanced version could manage the pending promise.

```javascript
function debouncePromise(fn, delay) {
  let timeoutId;
  let latestResolve;
  let latestReject;

  return function(...args) {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      latestResolve = resolve;
      latestReject = reject;

      timeoutId = setTimeout(() => {
        fn.apply(this, args).then(latestResolve, latestReject);
      }, delay);
    });
  };
}
```

### 127\. Why should you avoid using `Date.now()` inside a throttled function for animations?

Relying on `Date.now()` can lead to animations that are not perfectly smooth. The time between calls to a throttled function can vary slightly. `requestAnimationFrame`, on the other hand, provides a high-resolution timestamp as an argument to its callback. This timestamp is synchronized with the browser's rendering engine, allowing you to calculate the exact progress of an animation frame by frame, resulting in much smoother visuals.

### 128\. Implement a function that batches calls.

Instead of debouncing or throttling, sometimes you want to collect all calls that happen in a short period and process them together in a single batch.

```javascript
function createBatcher(processor, delay) {
  let batch = [];
  let timeoutId = null;

  return function(item) {
    batch.push(item);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      console.log(`Processing batch of ${batch.length} items.`);
      processor(batch);
      batch = []; // Reset the batch
      timeoutId = null;
    }, delay);
  };
}

// Example: Log multiple events in one go
const logBatch = createBatcher((events) => {
  // sendToAnalytics(events);
  console.log(events);
}, 500);

logBatch({ event: 'click', id: 1 });
logBatch({ event: 'hover', id: 2 });
logBatch({ event: 'scroll', id: 3 });
// After 500ms, it will log:
// "Processing batch of 3 items."
// [{ event: 'click', id: 1 }, { event: 'hover', id: 2 }, { event: 'scroll', id: 3 }]
```

### 129\. What is the difference between "debouncing" and "throttling" an API call?

  * **Debounce**: When a user is typing in a search bar, you would **debounce** the API call. You only want to make the call once the user has *stopped* typing for a moment. This saves a lot of unnecessary requests.
  * **Throttle**: If a user is dragging an element on a map to get updated data for the new viewport, you would **throttle** the API call. You want to provide live updates as they drag, but not overwhelm your server with hundreds of requests per second. Throttling to once every 200ms would be a good balance.

### 130\. How would you test a `throttle` function using fake timers?

Similar to testing debounce, you use fake timers to control time. You'll want to check that the function is called immediately (if leading is true) and that subsequent calls within the time limit are ignored.

```javascript
// Using Jest's fake timers
describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  test('should call the function immediately but only once per time limit', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 1000);

    throttledFn(); // Should be called immediately
    expect(mockFn).toHaveBeenCalledTimes(1);

    throttledFn(); // Should be ignored
    throttledFn(); // Should be ignored
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    throttledFn(); // Should be called again now
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
```
