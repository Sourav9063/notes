## Key Functional Patterns & Techniques in JavaScript

Functional programming emphasizes pure functions, immutability, function composition, and avoiding side effects. Here are some core patterns and techniques used in functional JavaScript:

**1. Higher-Order Functions (HOFs)**

- **Concept:** Functions that operate on other functions, either by taking them as arguments or by returning them (or both). This is fundamental to many functional patterns.
- **Use Case:** Abstracting behavior, creating reusable function modifiers (like decorators), enabling strategies, callbacks, and more. Many built-in Array methods (`map`, `filter`, `reduce`) are HOFs.
- **Relation to OOP Patterns:** Enables functional implementations of Decorator, Strategy, Template Method, Factory (returning functions), Command (passing functions).
- **Example:**

  ```javascript
  // 1. Takes a function as an argument (e.g., a basic filter)
  const filterArray = (arr, predicateFn) => {
    const result = [];
    for (const item of arr) {
      if (predicateFn(item)) {
        result.push(item);
      }
    }
    return result;
  };
  const isEven = (num) => num % 2 === 0;
  console.log("Filtered Evens:", filterArray([1, 2, 3, 4, 5], isEven)); // Output: [ 2, 4 ]

  // 2. Returns a function (e.g., creates a multiplier function)
  const createMultiplier = (factor) => {
    // Returns a new function that remembers 'factor' (closure)
    return (number) => number * factor;
  };
  const double = createMultiplier(2);
  const triple = createMultiplier(3);
  console.log("Double 5:", double(5)); // Output: 10
  console.log("Triple 5:", triple(5)); // Output: 15

  // 3. Both (e.g., a simple function decorator)
  const withLogging = (fn) => {
    return (...args) => {
      console.log(`Calling ${fn.name || "function"}...`);
      const result = fn(...args);
      console.log(`Result was: ${result}`);
      return result;
    };
  };
  const add = (a, b) => a + b;
  const loggedAdd = withLogging(add);
  loggedAdd(3, 4);
  ```

**2. Function Composition**

- **Concept:** The process of combining two or more functions to produce a new function or perform some computation. The output of one function becomes the input of the next.
- **Use Case:** Building complex operations from smaller, reusable pure functions. Improves readability and maintainability by breaking down logic.
- **Example:**

  ```javascript
  const pipe =
    (...fns) =>
    (initialValue) =>
      fns.reduce((acc, fn) => fn(acc), initialValue);
  // Or using manual composition for two functions:
  // const compose = (f, g) => (x) => f(g(x));

  const trim = (str) => str.trim();
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const addGreeting = (str) => `Hello, ${str}!`;

  // Compose the functions to create a transformation pipeline
  const formatNameAndGreet = pipe(trim, capitalize, addGreeting);

  const nameInput = "  alice  ";
  console.log(formatNameAndGreet(nameInput)); // Output: Hello, Alice!
  ```

**3. Closures / Module Pattern**

- **Concept:** A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment). It gives you access to an outer function's scope from an inner function, even after the outer function has finished executing. This is the core mechanism behind data encapsulation and the Module Pattern in functional JS.
- **Use Case:** Creating private state and functions, implementing the Module Pattern, enabling techniques like currying and partial application, maintaining state in functional components (like React hooks).
- **Relation to OOP Patterns:** Provides encapsulation similar to private members in classes; enables functional Singleton implementations.
- **Example (Module Pattern):**

  ```javascript
  const createCounter = (initialValue = 0) => {
    let count = initialValue; // Private state captured by closure

    // Public API returned as an object literal
    return {
      increment: () => {
        count++;
        console.log(`Count is now ${count}`);
      },
      decrement: () => {
        count--;
        console.log(`Count is now ${count}`);
      },
      getValue: () => count,
    };
  };

  const counter1 = createCounter();
  counter1.increment(); // Count is now 1
  counter1.increment(); // Count is now 2
  // console.log(counter1.count); // Error: count is not accessible (private)

  const counter2 = createCounter(10);
  counter2.decrement(); // Count is now 9
  console.log(counter1.getValue()); // 2
  console.log(counter2.getValue()); // 9 (independent state)
  ```

**4. Immutability**

- **Concept:** Not strictly a pattern, but a core principle. Data, once created, should not be changed. Operations that seem to modify data should instead return new data structures with the changes applied.
- **Use Case:** Preventing unintended side effects, simplifying state management (especially in complex applications like UIs with frameworks like React/Redux), enabling easier debugging and reasoning about state changes, facilitating features like undo/redo (Memento).
- **Example:**

  ```javascript
  // Mutable approach (avoid in FP)
  const userMut = { name: "Alice", roles: ["editor"] };
  // userMut.roles.push("admin"); // Modifies the original object

  // Immutable approach
  const userImmut = { name: "Bob", roles: ["viewer"] };

  // Create a *new* object with the added role
  const userWithAdmin = {
    ...userImmut, // Copy existing properties
    roles: [...userImmut.roles, "admin"], // Create a new roles array
  };

  console.log("Original User:", userImmut); // Output: { name: 'Bob', roles: [ 'viewer' ] }
  console.log("Updated User:", userWithAdmin); // Output: { name: 'Bob', roles: [ 'viewer', 'admin' ] }

  // Example with array methods that return new arrays
  const numbers = [1, 2, 3, 4];
  const doubled = numbers.map((n) => n * 2); // .map returns a new array
  const evens = numbers.filter((n) => n % 2 === 0); // .filter returns a new array

  console.log("Original Numbers:", numbers); // [ 1, 2, 3, 4 ]
  console.log("Doubled:", doubled); // [ 2, 4, 6, 8 ]
  console.log("Evens:", evens); // [ 2, 4 ]
  ```

**5. Currying & Partial Application**

- **Concept:** Techniques for transforming functions:
  - **Currying:** Transforms a function that takes multiple arguments into a sequence of functions that each take a single argument.
  - **Partial Application:** Creates a new function by fixing (pre-filling) some of the arguments of an existing function.
- **Use Case:** Creating specialized functions from more general ones, improving code reuse, making function composition easier.
- **Example:**

  ```javascript
  // General function
  const add = (a, b, c) => a + b + c;

  // --- Partial Application ---
  // Create a function that always adds 10 as the first argument
  const add10 = (b, c) => add(10, b, c);
  console.log("Partial Application (add10):", add10(5, 3)); // Output: 18

  // --- Currying (manual example) ---
  const curryAdd = (a) => {
    return (b) => {
      return (c) => {
        return a + b + c;
      };
    };
  };
  const curriedAdd = curryAdd(10); // Fix 'a' to 10
  const curriedAdd10and5 = curriedAdd(5); // Fix 'b' to 5
  const result = curriedAdd10and5(3); // Provide final argument 'c' = 3
  console.log("Currying Result:", result); // Output: 18

  // Usage: Creating specialized logging functions
  const log = (level, message) =>
    console.log(`[${level.toUpperCase()}]: ${message}`);
  const logError = (message) => log("error", message); // Partially applied
  const logWarn = (message) => log("warn", message); // Partially applied

  logError("Something went wrong!");
  logWarn("Potential issue detected.");
  ```

**6. Pure Functions**

- **Concept:** A function is pure if:
  1.  Its return value is solely determined by its input values (no dependency on external state like global variables, time, random numbers).
  2.  It causes no observable side effects (doesn't modify external state, log to console, write to disk, make network requests).
- **Use Case:** Core building blocks in FP. Pure functions are predictable, testable, easier to reason about, and facilitate techniques like memoization and parallelization.
- **Example:**
  ```javascript
  // Pure function: Output depends only on input, no side effects
  const calculateArea = (radius) => Math.PI _ radius _ radius;

      // Impure function: Depends on external state (Date.now)
      const getTimestampedMessage = (message) => `${Date.now()}: ${message}`;

      // Impure function: Causes a side effect (console.log)
      const logMessage = (message) => console.log(message);

      // Impure function: Modifies external state
      let counter = 0;
      const incrementGlobalCounter = () => { counter++; return counter; };

      console.log("Area:", calculateArea(5)); // Always the same for input 5
      console.log("Area:", calculateArea(5)); // Still the same
      console.log("Timestamped:", getTimestampedMessage("Test")); // Different each time
      ```

  Okay, let's delve into a few more concepts and patterns commonly found in functional JavaScript programming, building upon the previous list.

**7. Memoization**

- **Concept:** An optimization technique where the results of expensive function calls are cached based on the inputs. If the same inputs occur again, the cached result is returned immediately, avoiding redundant computation. It's a specific application of caching, often implemented using closures.
- **Use Case:** Speeding up computationally intensive pure functions (like calculating Fibonacci numbers, complex data transformations), caching results from API calls or database queries based on their parameters (though side effects need careful handling).
- **Example:**

  ```javascript
  // Generic memoization HOF
  const memoize = (fn) => {
    const cache = new Map(); // Use a Map for better key handling
    return (...args) => {
      const key = JSON.stringify(args); // Simple key generation (watch out for object order issues)
      if (cache.has(key)) {
        console.log(`Memoization: Cache hit for key ${key}`);
        return cache.get(key);
      } else {
        console.log(`Memoization: Cache miss for key ${key}. Computing...`);
        const result = fn(...args);
        cache.set(key, result);
        return result;
      }
    };
  };

  // An expensive function (e.g., recursive Fibonacci - inefficiently written for demo)
  const slowFib = (n) => {
    if (n <= 1) return n;
    return slowFib(n - 1) + slowFib(n - 2);
  };

  const memoizedFib = memoize(slowFib);

  console.time("Fib 35 (Memoized)");
  console.log("Fib(35):", memoizedFib(35)); // Computes relatively quickly
  console.timeEnd("Fib 35 (Memoized)");

  console.time("Fib 35 (Memoized again)");
  console.log("Fib(35) again:", memoizedFib(35)); // Returns instantly from cache
  console.timeEnd("Fib 35 (Memoized again)");

  // Compare with non-memoized (would be very slow)
  // console.time("Fib 35 (Slow)");
  // console.log("Fib(35) slow:", slowFib(35)); // Takes significant time
  // console.timeEnd("Fib 35 (Slow)");
  ```

**8. Functor**

- **Concept:** A design pattern (originating from category theory) representing a "container" or "context" that holds a value and defines a `map` operation. The `map` operation applies a given function to the value(s) inside the container _without changing the container's structure_, returning a _new_ container of the same type holding the result(s). Arrays (`Array.prototype.map`), Promises (`Promise.prototype.then` acts like map), and Optionals/Maybes are common examples of Functors in practice.
- **Use Case:** Applying functions to values that might be wrapped in a context (like an array, a potentially missing value, an asynchronous operation), abstracting the process of applying a function over different data structures/contexts.
- **Example (Illustrating Array as a Functor):**

  ```javascript
  const numbers = [1, 2, 3];
  const addOne = (x) => x + 1;

  // Array's map applies 'addOne' to each value inside the array (container)
  // It returns a *new* array (container) with the results.
  const incrementedNumbers = numbers.map(addOne);

  console.log("Original Array:", numbers); // [ 1, 2, 3 ]
  console.log("Incremented Array:", incrementedNumbers); // [ 2, 3, 4 ]

  // Functor laws (informally):
  // 1. Identity: container.map(x => x) === container
  // 2. Composition: container.map(x => f(g(x))) === container.map(g).map(f)
  ```

- **Example (Custom Functor - Maybe/Optional):**

  ```javascript
  // Represents a value that might be null/undefined
  const Maybe = {
    // Wraps a potentially null value
    of: (value) => ({
      // The map operation: applies 'fn' only if value is not null/undefined
      map: (fn) =>
        value === null || value === undefined
          ? Maybe.of(null)
          : Maybe.of(fn(value)),
      // Helper to get the value out or return a default
      getOrElse: (defaultValue) =>
        value === null || value === undefined ? defaultValue : value,
      // For logging/inspection
      toString: () => `Maybe(${value})`,
    }),
  };

  const getNameLength = (user) =>
    Maybe.of(user) // Wrap user (might be null)
      .map((u) => u.name) // Get name (returns Maybe(null) if user is null)
      .map((name) => name.length) // Get length (returns Maybe(null) if name was null)
      .getOrElse(0); // Get length or default to 0

  const user1 = { name: "Alice" };
  const user2 = null;
  const user3 = { name: null };

  console.log(`User 1 Name Length: ${getNameLength(user1)}`); // Output: 5
  console.log(`User 2 Name Length: ${getNameLength(user2)}`); // Output: 0
  console.log(`User 3 Name Length: ${getNameLength(user3)}`); // Output: 0
  ```

**9. Monad**

- **Concept:** A more advanced pattern (also from category theory) that builds upon Functors. Monads provide a way to sequence computations, especially those that involve a context (like the `Maybe` example above, asynchronous operations via Promises, or operations that might fail via `Either`). They define a `flatMap` (or `chain`, `bind`) operation in addition to `map`. `flatMap` is similar to `map`, but it prevents nested contexts (e.g., `Maybe(Maybe(value))` becomes `Maybe(value)`). Promises (`.then` acts like `flatMap` when the callback returns another Promise) are the most common Monadic structure JS developers encounter daily.
- **Use Case:** Handling null/undefined values gracefully (Maybe/Optional), managing asynchronous operations sequentially (Promise), handling errors without exceptions (Either), managing state functionally.
- **Example (Promise as a Monad):**

  ```javascript
  const getUser = (userId) => {
    console.log(`Workspaceing user ${userId}...`);
    // Simulates an async API call returning a Promise (a Monad)
    return new Promise((resolve) =>
      setTimeout(() => resolve({ id: userId, name: `User_${userId}` }), 50),
    );
  };

  const getSettings = (user) => {
    console.log(`Workspaceing settings for ${user.name}...`);
    return new Promise((resolve) =>
      setTimeout(() => resolve({ userId: user.id, theme: "dark" }), 50),
    );
  };

  // Chaining asynchronous operations using .then (flatMap-like behavior)
  getUser(123)
    .then((user) => {
      // The function passed to .then returns a *new* Promise
      return getSettings(user);
    })
    .then((settings) => {
      // This .then receives the *resolved value* of the settings Promise, not a nested Promise
      console.log(`User settings received:`, settings);
    })
    .catch((error) => {
      console.error("An error occurred in the chain:", error);
    });

  // Without the flatMap/.then behavior, you might end up with Promise<Promise<Settings>>
  ```

- **Example (Custom Maybe Monad):**

  ```javascript
  // Extending our Maybe Functor to be a Monad
  const MaybeMonad = {
    of: (value) => ({
      map: (fn) =>
        value === null || value === undefined
          ? MaybeMonad.of(null)
          : MaybeMonad.of(fn(value)),

      // flatMap (or chain): applies 'fn' which MUST return another MaybeMonad
      flatMap: (fn) =>
        value === null || value === undefined ? MaybeMonad.of(null) : fn(value),

      getOrElse: (defaultValue) =>
        value === null || value === undefined ? defaultValue : value,
      toString: () => `MaybeMonad(${value})`,
    }),
  };

  // Function that might return a Maybe (e.g., safe property access)
  const getProp = (prop) => (obj) => MaybeMonad.of(obj ? obj[prop] : null);

  const user = { address: { street: "123 Main St" } };
  const userNoAddress = { name: "Bob" };

  // Chain operations that might fail (return MaybeMonad(null))
  const getStreet = (u) =>
    MaybeMonad.of(u) // Start with Maybe(user)
      .flatMap(getProp("address")) // Returns Maybe(address) or Maybe(null)
      .flatMap(getProp("street")); // Returns Maybe(street) or Maybe(null)

  console.log(`Street for user: ${getStreet(user).getOrElse("N/A")}`); // Output: 123 Main St
  console.log(
    `Street for userNoAddress: ${getStreet(userNoAddress).getOrElse("N/A")}`,
  ); // Output: N/A
  ```

  Certainly! Here are additional functional programming patterns and concepts relevant to JavaScript, expanding on the previous list:

---

**10. Either (Result) Monad**

- **Concept:** Represents a value that can be one of two possibilities: a successful result (`Right`) or an error (`Left`). Forces explicit handling of both success and error cases, avoiding `try/catch` blocks and encouraging error-forwarding in pipelines.
- **Use Case:** Functional error handling, composing operations that might fail (e.g., validation, API calls), building robust data processing pipelines.
- **Example:**

  ```javascript
  const Either = {
    Left: (value) => ({
      map: () => Either.Left(value), // Ignores mapping on Left
      catch: (fn) => fn(value), // Handle error
      isLeft: true,
    }),
    Right: (value) => ({
      map: (fn) => Either.Right(fn(value)),
      catch: () => Either.Right(value), // Ignores catch on Right
      isLeft: false,
    }),
  };

  // Example: Safe division (avoid division by zero)
  const safeDivide = (a, b) =>
    b === 0 ? Either.Left("Division by zero") : Either.Right(a / b);

  // Usage: Chaining with error handling
  safeDivide(10, 2)
    .map((result) => result * 3)
    .map((result) => `Result: ${result}`)
    .catch((error) => `Error: ${error}`); // "Result: 15"

  safeDivide(10, 0)
    .map((result) => result * 3) // Skipped
    .catch((error) => `Error: ${error}`); // "Error: Division by zero"
  ```

---

**11. Lenses**

- **Concept:** A functional pattern for accessing and immutably modifying deeply nested properties in objects. A lens combines a "getter" and a "setter" that returns a new object with the updated value.
- **Use Case:** Managing complex state immutably (common in Redux), updating deeply nested data without mutation.
- **Example (Using Ramda.js Library):**

  ```javascript
  import * as R from "ramda";

  const user = {
    profile: {
      name: "Alice",
      address: { city: "Paris" },
    },
  };

  // Create a lens to access user.profile.address.city
  const cityLens = R.lensPath(["profile", "address", "city"]);

  // Get the city
  console.log(R.view(cityLens, user)); // "Paris"

  // Set the city immutably
  const updatedUser = R.set(cityLens, "Berlin", user);
  console.log(updatedUser.profile.address.city); // "Berlin"
  console.log(user.profile.address.city); // "Paris" (original unchanged)
  ```

---

**12. Transducers**

- **Concept:** Efficient composable transformation pipelines that process collections (arrays, streams) in a single pass. Transducers decouple transformations (like `map`, `filter`) from the data structure itself.
- **Use Case:** Optimizing data processing pipelines (e.g., large datasets), reusing transformation logic across different data structures.
- **Example:**

  ```javascript
  // Using Ramda.js's transducer utils
  import * as R from "ramda";

  const numbers = [1, 2, 3, 4, 5];

  // Compose transformations into a transducer
  const transducer = R.compose(
    R.map((x) => x * 2), // Double
    R.filter((x) => x > 5), // Filter values >5
  );

  // Apply transducer to array (single iteration)
  const result = R.into([], transducer, numbers);
  console.log(result); // [6, 8, 10]

  // Works with other data structures (e.g., streams)
  ```

---

**13. Reactive Programming (Observables)**

- **Concept:** Treats data streams (events, async operations) as sequences that can be transformed using functional operators (`map`, `filter`, `merge`). Implemented via libraries like RxJS.
- **Use Case:** Handling complex async workflows (user interactions, WebSocket streams), event-driven architectures.
- **Example (RxJS):**

  ```javascript
  import { fromEvent, map, filter, throttleTime } from "rxjs";

  // Create a stream of mouse clicks
  const button = document.getElementById("myButton");
  const click$ = fromEvent(button, "click");

  // Transform the stream
  click$
    .pipe(
      throttleTime(1000), // Throttle to 1 click/second
      map((event) => ({ x: event.clientX, y: event.clientY })), // Extract coordinates
      filter((pos) => pos.x > 100), // Only allow clicks past x=100
    )
    .subscribe((pos) => {
      console.log("Valid click at:", pos);
    });
  ```

---

**14. Tail Call Optimization (TCO)**

- **Concept:** A compiler optimization where the last action of a function is a recursive call, reusing the current stack frame. While ES6 specifies TCO, most JS engines don’t fully implement it.
- **Use Case:** Avoiding stack overflow in deep recursion.
- **Example (Theoretical):**

  ```javascript
  // Non-TCO recursive factorial
  const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1)); // Stack grows with n

  // Tail-recursive factorial (requires TCO support)
  const factorialTail = (n, acc = 1) =>
    n <= 1 ? acc : factorialTail(n - 1, acc * n);

  console.log(factorialTail(5)); // 120 (Works in engines with TCO)
  ```

---

**15. Applicative Functors**

- **Concept:** Extend Functors by allowing functions within a context to be applied to values in the same context. Useful for combining multiple wrapped values (e.g., combining two `Maybe` values).
- **Use Case:** Validating multiple inputs where each might fail, combining async operations.
- **Example (Using Folktale's `Maybe`):**

  ```javascript
  import * as F from "folktale";

  const add = (a, b) => a + b;

  // Applicative application
  const maybeAdd = F.maybe.of(add.curry()); // Wrap the function
  const maybeA = F.maybe.of(2); // Wrap value 2
  const maybeB = F.maybe.of(3); // Wrap value 3

  const result = maybeA.ap(maybeB.ap(maybeAdd));
  console.log(result); // Maybe.Just(5)
  ```

---

**16. Generators & Lazy Sequences**

- **Concept:** Generate values on-demand using `function*` and `yield`, enabling lazy evaluation for memory efficiency with large/infinite datasets.
- **Use Case:** Processing large files line-by-line, infinite sequences (e.g., Fibonacci), custom iterators.
- **Example:**

  ```javascript
  // Infinite Fibonacci sequence
  function* fibonacci() {
    let [a, b] = [0, 1];
    while (true) {
      yield a;
      [a, b] = [b, a + b];
    }
  }

  const fibGen = fibonacci();
  console.log(Array.from({ length: 10 }, () => fibGen.next().value));
  // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
  ```

---

**17. Church Encoding**

- **Concept:** Representing data and operations using only functions (from lambda calculus). Demonstrates FP’s theoretical roots but less common in practical JS.
- **Example (Church Numerals):**

  ```javascript
  // Define numbers as functions
  const zero = (f) => (x) => x;
  const one = (f) => (x) => f(x);
  const two = (f) => (x) => f(f(x));

  // Convert to JS number
  const toNumber = (n) => n((x) => x + 1)(0);
  console.log(toNumber(two)); // 2

  // Church addition
  const add = (m) => (n) => (f) => (x) => n(f)(m(f)(x));
  console.log(toNumber(add(one)(two))); // 3
  ```

---

**Key Takeaways:**

- **Functional Patterns in JS:** While JS isn’t purely functional, these patterns enable writing declarative, side-effect-free code.
- **Libraries:** Leverage libraries like Ramda, Lodash/fp, RxJS, and Folktale for battle-tested implementations.
- **Balance:** Mix FP with other paradigms where appropriate (e.g., FP for data transformations, OOP for UI components).
