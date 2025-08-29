## Core JavaScript Concepts

-----

#### 1\. What is JavaScript?

JavaScript is a high-level programming language primarily used to make web pages interactive. It can run in the browser to manipulate the webpage's content (the DOM), handle events like clicks, and communicate with servers. It can also be used on the server-side with Node.js.

#### 2\. What are the primitive data types in JavaScript?

There are seven primitive data types:

  * **String**: Text, like `"hello"`.
  * **Number**: Numeric values, like `100` or `3.14`.
  * **Boolean**: `true` or `false`.
  * **Undefined**: A variable that has been declared but not assigned a value.
  * **Null**: Represents the intentional absence of any object value. It's a "nothing" value.
  * **BigInt**: For numbers larger than the standard `Number` type can hold.
  * **Symbol**: A unique and immutable value, often used as an object property key.

#### 3\. What is the difference between `null` and `undefined`?

  * **`undefined`** means a variable has been declared, but no value has been assigned to it yet. It's the default state.
  * **`null`** is an assignment value. You can assign `null` to a variable to intentionally represent "no value."

<!-- end list -->

```javascript
let a;
console.log(a); // undefined

let b = null;
console.log(b); // null
```

#### 4\. What's the difference between `==` and `===`?

  * **`==` (Loose Equality)**: Compares two values for equality *after* converting both values to a common type (type coercion).
  * **`===` (Strict Equality)**: Compares two values for equality *without* type coercion. It checks both the value and the type.

**It's almost always better to use `===`** to avoid unexpected bugs.

```javascript
console.log(5 == "5");   // true (string "5" is converted to number 5)
console.log(5 === "5");  // false (number is not the same type as string)
console.log(true == 1);  // true
console.log(true === 1); // false
```

#### 5\. Explain `var`, `let`, and `const`.

  * **`var`**: The old way. It's **function-scoped**. Variables declared with `var` are hoisted to the top of their function. You can re-declare and update `var` variables.
  * **`let`**: The modern way. It's **block-scoped** (anything inside `{ }`). You can update a `let` variable, but you cannot re-declare it in the same scope.
  * **`const`**: Also **block-scoped**. You must assign a value when you declare it. You **cannot** update or re-declare it. For objects and arrays, this means the reference cannot change, but the contents *can* be modified.

<!-- end list -->

```javascript
// var (function-scoped)
function varTest() {
  var x = 1;
  if (true) {
    var x = 2; // same variable!
    console.log(x); // 2
  }
  console.log(x); // 2
}

// let (block-scoped)
function letTest() {
  let y = 1;
  if (true) {
    let y = 2; // different variable
    console.log(y); // 2
  }
  console.log(y); // 1
}

const person = { name: "Alice" };
person.name = "Bob"; // This is allowed
// person = { name: "Charlie" }; // This will throw an error
```

#### 6\. What is scope?

Scope determines the accessibility (visibility) of variables.

  * **Global Scope**: Variables declared outside any function are in the global scope and can be accessed from anywhere.
  * **Function Scope**: Variables declared inside a function are only accessible within that function.
  * **Block Scope**: Variables declared with `let` and `const` inside a block (`{...}`) are only accessible within that block.

#### 7\. What is hoisting?

Hoisting is JavaScript's default behavior of moving all declarations to the top of the current scope before code execution.

  * `var` declarations are hoisted and initialized with `undefined`.
  * `let` and `const` declarations are hoisted but are not initialized. Accessing them before declaration results in a `ReferenceError`. This is known as the "Temporal Dead Zone."
  * Function declarations are also hoisted completely.

<!-- end list -->

```javascript
console.log(myVar); // undefined (due to hoisting)
var myVar = 5;

// console.log(myLet); // ReferenceError: Cannot access 'myLet' before initialization
let myLet = 10;
```

#### 8\. What is a closure?

A closure is a function that remembers the variables from the scope where it was created, even if it's executed in a different scope. In simple terms, a function bundled together with its "lexical environment" (the variables around it).

Closures are useful for creating private variables and data encapsulation.

```javascript
function createCounter() {
  let count = 0; // This variable is "closed over"

  return function() {
    count++;
    console.log(count);
  };
}

const myCounter = createCounter(); // myCounter is now a function that remembers 'count'
myCounter(); // 1
myCounter(); // 2
myCounter(); // 3
```

#### 9\. What are falsy values in JavaScript?

A falsy value is a value that is considered `false` when encountered in a boolean context (like an `if` statement).
There are six falsy values:

1.  `false`
2.  `0` (the number zero)
3.  `""` (an empty string)
4.  `null`
5.  `undefined`
6.  `NaN` (Not-a-Number)

Everything else is "truthy."

#### 10\. What is an IIFE (Immediately Invoked Function Expression)?

An IIFE is a function that is executed right after it is created. It's a common pattern to avoid polluting the global scope.

```javascript
(function() {
  var message = "Hello from inside the IIFE!";
  console.log(message); // This variable is private to the IIFE
})();
// message is not accessible here
```

#### 11\. What is the `this` keyword?

The `this` keyword refers to the **object it belongs to**. Its value depends on how a function is called.

  * **In a method**: `this` refers to the owner object.
  * **Alone (global scope)**: `this` refers to the global object (`window` in a browser).
  * **In a function (default)**: `this` is `undefined` in strict mode, otherwise the global object.
  * **In an event**: `this` refers to the element that received the event.
  * **With `call()`, `apply()`, `bind()`**: `this` can be set to any object.
  * **In an arrow function**: `this` is lexically bound; it takes the `this` value of its parent scope.

<!-- end list -->

```javascript
const person = {
  name: "John",
  greet: function() {
    console.log("Hello, " + this.name); // 'this' refers to the 'person' object
  }
};
person.greet(); // "Hello, John"
```

#### 12\. What are `call`, `apply`, and `bind`?

These methods are used to set the `this` value for a function.

  * **`call(thisArg, arg1, arg2, ...)`**: Invokes the function immediately, with a given `this` value and arguments provided individually.
  * **`apply(thisArg, [argsArray])`**: Invokes the function immediately, with a given `this` value and arguments provided as an array.
  * **`bind(thisArg)`**: **Returns a new function**, with the `this` value permanently bound to `thisArg`. The new function can be called later.

<!-- end list -->

```javascript
function sayHello(greeting, punctuation) {
  console.log(greeting + ", " + this.name + punctuation);
}

const user = { name: "Alice" };

sayHello.call(user, "Hi", "!");    // Hi, Alice!
sayHello.apply(user, ["Hello", "."]); // Hello, Alice.

const greetAlice = sayHello.bind(user);
greetAlice("Good morning", "..."); // Good morning, Alice...
```

#### 13\. What is prototypal inheritance?

Every JavaScript object has a private property called `[[Prototype]]` (often accessed via `__proto__`) which is a link to another object. When you try to access a property of an object, if the property isn't found on the object itself, JavaScript looks up the prototype chain until it finds the property or reaches `null`. This is how JavaScript implements inheritance.

```javascript
let animal = {
  eats: true
};

let rabbit = {
  jumps: true
};

rabbit.__proto__ = animal; // Set rabbit's prototype to animal

console.log(rabbit.eats);   // true (found on the prototype)
console.log(rabbit.jumps);  // true (found on the rabbit object itself)
```

#### 14\. What is the difference between an arrow function and a regular function?

  * **`this` binding**: Regular functions have their own `this` binding. Arrow functions do not; they inherit `this` from the parent scope (lexical `this`).
  * **`arguments` object**: Arrow functions do not have an `arguments` object. You can use rest parameters (`...args`) instead.
  * **Constructor**: Arrow functions cannot be used as constructors (i.e., you can't use `new` with them).
  * **Syntax**: Arrow functions have a shorter syntax.

<!-- end list -->

```javascript
// Regular function
function regularSum(a, b) {
  return a + b;
}

// Arrow function (implicit return)
const arrowSum = (a, b) => a + b;
```

#### 15\. What are Higher-Order Functions?

A higher-order function is a function that either:

1.  Takes one or more functions as arguments.
2.  Returns a function as its result.

Examples include `Array.prototype.map`, `Array.prototype.filter`, and `Array.prototype.reduce`.

```javascript
// 'filter' is a higher-order function because it takes a function as an argument
const numbers = [1, 2, 3, 4, 5];
const evens = numbers.filter(num => num % 2 === 0);
console.log(evens); // [2, 4]
```

#### 16\. What is the spread operator (`...`)?

The spread operator (`...`) allows an iterable (like an array or string) to be expanded in places where zero or more arguments or elements are expected.

```javascript
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]

const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 }; // { a: 1, b: 2, c: 3 }
```

#### 17\. What is the rest operator (`...`)?

The rest parameter syntax looks the same as the spread operator but is used in a different context. It collects multiple elements and "condenses" them into a single element (an array). It's always the last parameter in a function definition.

```javascript
function sum(...numbers) { // 'numbers' is an array of all arguments
  return numbers.reduce((total, num) => total + num, 0);
}

console.log(sum(1, 2, 3));    // 6
console.log(sum(10, 20, 30, 40)); // 100
```

#### 18\. What is object destructuring?

Destructuring is a convenient way to extract properties from an object (or elements from an array) and bind them to variables.

```javascript
const user = {
  firstName: "Jane",
  lastName: "Doe",
  age: 30
};

// Extracting properties into variables
const { firstName, age } = user;
console.log(firstName); // "Jane"
console.log(age);       // 30

// Can also rename variables
const { firstName: fName } = user;
console.log(fName); // "Jane"
```

#### 19\. What does "use strict" do?

`"use strict";` is a directive that enables "strict mode." It helps you write cleaner code by catching common mistakes and "unsafe" actions. For example:

  * It prevents the use of undeclared variables.
  * It makes `this` `undefined` in the global scope.
  * It throws an error on duplicate property names in an object.

#### 20\. How do you create an object in JavaScript?

There are several ways:

  * **Object Literal**: `const obj = { key: 'value' };`
  * **Constructor Function**: `function Person() { ... }; const p = new Person();`
  * **`Object.create()`**: `const obj = Object.create(prototypeObject);`
  * **ES6 Class**: `class Person { ... }; const p = new Person();`

## Functions & Objects

-----

#### 21\. Explain shallow copy vs. deep copy of an object.

  * **Shallow Copy**: Creates a new object, but if the original object contains nested objects, it only copies the *references* to those nested objects. Modifying a nested object in the copy will also modify it in the original.
  * **Deep Copy**: Creates a completely independent copy of the original object, including all nested objects. Changes to the copy will not affect the original.

<!-- end list -->

```javascript
const original = {
  a: 1,
  b: { c: 2 }
};

// Shallow copy
const shallow = { ...original };
shallow.b.c = 99;
console.log(original.b.c); // 99 (original was changed!)

// Deep copy (using JSON methods - has limitations)
const deep = JSON.parse(JSON.stringify(original));
original.b.c = 2; // Reset for demonstration
deep.b.c = 50;
console.log(original.b.c); // 2 (original is unaffected)
```

#### 22\. What are pure functions?

A pure function is a function that:

1.  Given the same input, will always return the same output.
2.  Has no side effects (e.g., it doesn't modify external state, log to the console, or make network requests).

Pure functions are predictable and easier to test.

```javascript
// Pure function
function add(a, b) {
  return a + b;
}

// Impure function (has a side effect)
let total = 0;
function addToTotal(num) {
  total += num;
  return total;
}
```

#### 23\. What is the difference between a function declaration and a function expression?

  * **Function Declaration**: Is hoisted. You can call it before it is defined in the code. It is defined with the `function` keyword followed by a name.
  * **Function Expression**: Is not hoisted. It's part of an assignment statement (`const`, `let`, `var`). It must be defined before it is called.

<!-- end list -->

```javascript
// Function Declaration
hoistedFunction(); // Works
function hoistedFunction() {
  console.log("I was hoisted!");
}

// Function Expression
// notHoisted(); // TypeError: notHoisted is not a function
const notHoisted = function() {
  console.log("I was not hoisted.");
};
notHoisted(); // Works
```

#### 24\. What are object getters and setters?

Getters and setters are special methods that provide read and write access to an object's properties.

  * A **getter** (`get`) is a method that gets the value of a specific property.
  * A **setter** (`set`) is a method that sets the value of a specific property.

They allow you to execute code when a property is accessed or modified.

```javascript
const user = {
  firstName: 'John',
  lastName: 'Doe',
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
  set fullName(value) {
    const parts = value.split(' ');
    this.firstName = parts[0];
    this.lastName = parts[1];
  }
};

console.log(user.fullName); // John Doe (uses the getter)

user.fullName = 'Jane Smith'; // uses the setter
console.log(user.firstName); // Jane
```

#### 25\. What is the `arguments` object?

The `arguments` object is an array-like object accessible inside regular functions that contains the values of the arguments passed to that function. It's "array-like" because it has a `length` property, but it doesn't have array methods like `map` or `forEach`.

**Note**: Arrow functions do not have their own `arguments` object.

```javascript
function demo() {
  console.log(arguments[0]); // first argument
  console.log(arguments.length); // number of arguments
}
demo('a', 'b', 'c'); // 'a', 3
```

#### 26\. How do you check if a property exists in an object?

There are a few ways:

  * **`in` operator**: Checks if a property exists on the object or its prototype chain. `('key' in object)`
  * **`hasOwnProperty()`**: Checks if a property exists on the object *itself* (not on its prototype chain). `(object.hasOwnProperty('key'))`
  * **Direct access**: Checking if the value is `undefined`. This can be unreliable if a property is explicitly set to `undefined`.

<!-- end list -->

```javascript
const person = { name: 'Alice' };
console.log('name' in person); // true
console.log(person.hasOwnProperty('name')); // true
console.log('toString' in person); // true (from prototype)
console.log(person.hasOwnProperty('toString')); // false
```

#### 27\. What do `JSON.stringify()` and `JSON.parse()` do?

  * **`JSON.stringify(object)`**: Converts a JavaScript object into a JSON string.
  * **`JSON.parse(string)`**: Parses a JSON string, constructing the JavaScript object or value described by the string.

This is commonly used for sending data to/from a web server.

```javascript
const user = { name: "Mike", age: 25 };

// Convert object to string
const jsonString = JSON.stringify(user);
console.log(jsonString); // '{"name":"Mike","age":25}'

// Convert string back to object
const userObject = JSON.parse(jsonString);
console.log(userObject.name); // Mike
```

#### 28\. What is optional chaining (`?.`)?

Optional chaining (`?.`) is a safe way to access nested object properties. It prevents errors if a property in the chain is `null` or `undefined`. Instead of throwing an error, the expression short-circuits and returns `undefined`.

```javascript
const user = {
  name: "Alice",
  address: {
    street: "123 Main St"
    // city is missing
  }
};

console.log(user.address.city?.toUpperCase()); // undefined (no error)
// console.log(user.address.city.toUpperCase()); // This would throw a TypeError
```

#### 29\. What is the nullish coalescing operator (`??`)?

The nullish coalescing operator (`??`) is a logical operator that returns its right-hand side operand when its left-hand side operand is `null` or `undefined`, and otherwise returns its left-hand side operand.

It's useful for providing default values.

```javascript
let user;
console.log(user ?? "Guest"); // "Guest" (because user is undefined)

let score = 0;
console.log(score ?? 100); // 0 (because 0 is not null or undefined)
console.log(score || 100); // 100 (because 0 is falsy, the OR operator moves on)
```

#### 30\. What is `Object.freeze()`?

`Object.freeze()` makes an object immutable. You cannot add new properties, change existing properties, or remove properties from a frozen object. It provides a shallow freeze.

```javascript
const obj = { prop: 42 };
Object.freeze(obj);
obj.prop = 33; // This fails silently in non-strict mode
console.log(obj.prop); // 42
```

## Arrays

-----

#### 31\. Explain `map`, `filter`, and `reduce`.

These are three powerful array methods.

  * **`map()`**: Creates a **new array** by transforming every element in an array, one by one. It applies a function to each element and returns a new array with the results. The new array will always have the same length as the original.
  * **`filter()`**: Creates a **new array** with all elements that pass a test (provided as a function). The new array can be shorter than the original.
  * **`reduce()`**: Executes a "reducer" function on each element of the array, resulting in a **single output value**. It's used to "reduce" an array to one value (e.g., sum all numbers).

<!-- end list -->

```javascript
const numbers = [1, 2, 3, 4, 5];

// map: double each number
const doubled = numbers.map(num => num * 2); // [2, 4, 6, 8, 10]

// filter: get only even numbers
const evens = numbers.filter(num => num % 2 === 0); // [2, 4]

// reduce: sum all numbers
const sum = numbers.reduce((accumulator, current) => accumulator + current, 0); // 15
```

#### 32\. What's the difference between `forEach` and `map`?

  * **Return Value**: `map()` returns a new array. `forEach()` returns `undefined`.
  * **Purpose**: `map()` is used for transforming data into a new array. `forEach()` is used for simply iterating over an array to perform an action (a "side effect") on each element, like logging it to the console.
  * **Chainability**: Since `map()` returns an array, you can chain other methods like `filter()` or `reduce()` after it. You can't chain after `forEach()`.

#### 33\. What is the difference between `slice` and `splice`?

  * **`slice(start, end)`**: Returns a **new array** containing a portion of the original array. It **does not modify** the original array.
  * **`splice(start, deleteCount, item1, ...)`**: **Changes the contents** of the original array by removing, replacing, or adding elements. It returns an array containing the deleted elements.

<!-- end list -->

```javascript
const fruits = ["Banana", "Orange", "Lemon", "Apple", "Mango"];

// slice - doesn't change original
const citrus = fruits.slice(1, 3); // ["Orange", "Lemon"]
console.log(fruits); // ["Banana", "Orange", "Lemon", "Apple", "Mango"]

// splice - changes original
const removed = fruits.splice(2, 2, "Kiwi", "Grape"); // Removes "Lemon", "Apple"
console.log(fruits); // ["Banana", "Orange", "Kiwi", "Grape", "Mango"]
console.log(removed); // ["Lemon", "Apple"]
```

#### 34\. How can you remove duplicates from an array?

A common and easy way is to use a `Set`. A `Set` is a data structure that only allows unique values.

```javascript
const numbers = [1, 2, 2, 3, 4, 4, 5];
const uniqueNumbers = [...new Set(numbers)];
console.log(uniqueNumbers); // [1, 2, 3, 4, 5]
```

#### 35\. How do you check if a value is an Array?

Use the `Array.isArray()` method. It's the most reliable way.

```javascript
console.log(Array.isArray([]));      // true
console.log(Array.isArray({}));     // false
console.log(Array.isArray("hello")); // false
```

#### 36\. How can you empty an array?

There are two common ways:

1.  Assign it to a new empty array: `arr = [];`. This is fast but only works if you don't have other references to the original array.
2.  Set its length to 0: `arr.length = 0;`. This modifies the original array and is often the safer choice.

<!-- end list -->

```javascript
let numbers = [1, 2, 3];
let otherRef = numbers;

// Method 1
// numbers = [];
// console.log(numbers); // []
// console.log(otherRef); // [1, 2, 3] (the other reference is not empty)

// Method 2 (safer)
numbers.length = 0;
console.log(numbers); // []
console.log(otherRef); // [] (the other reference is also empty)
```

#### 37\. What is the difference between `find` and `filter`?

  * **`filter()`**: Returns a **new array** containing *all* elements that match the condition.
  * **`find()`**: Returns the **first element** that matches the condition. If no element is found, it returns `undefined`.

#### 38\. What is the difference between `some` and `every`?

  * **`every()`**: Checks if **all** elements in an array pass a test. It returns `true` or `false`.
  * **`some()`**: Checks if **at least one** element in an array passes a test. It returns `true` or `false`.

<!-- end list -->

```javascript
const numbers = [1, 2, 3, 4, 5];
console.log(numbers.every(num => num > 0)); // true (all are > 0)
console.log(numbers.some(num => num > 4)); // true (5 is > 4)
```

#### 39\. How do you flatten a nested array?

You can use the `flat()` method. You can pass a number to specify how many levels deep you want to flatten.

```javascript
const nested = [1, 2, [3, 4, [5, 6]]];

// Flatten one level
console.log(nested.flat()); // [1, 2, 3, 4, [5, 6]]

// Flatten completely
console.log(nested.flat(Infinity)); // [1, 2, 3, 4, 5, 6]
```

#### 40\. What is an array-like object?

An array-like object is an object that has a `length` property and indexed properties (like `0`, `1`, `2`, etc.), but isn't a true array. Examples include the `arguments` object in a function or a `NodeList` returned from a DOM query. You can convert them to a real array using `Array.from()`.

```javascript
function showArgs() {
  console.log(arguments.length); // It has a length property
  // arguments.map(x => x); // This would fail, it's not a real array
  
  const argsArray = Array.from(arguments);
  argsArray.map(arg => console.log(arg)); // This works!
}
showArgs(1, 2, 3);
```

## Asynchronous JavaScript

-----

#### 41\. What is asynchronous JavaScript?

Synchronous code runs line by line, one at a time. Asynchronous code allows long-running tasks (like fetching data from a server or waiting for a timer) to run in the background without blocking the main thread. Once the task is finished, it executes its callback function. This keeps the user interface responsive.

#### 42\. What is a Callback?

A callback is a function passed as an argument to another function, which is then executed after some operation has been completed.

```javascript
function fetchData(callback) {
  setTimeout(() => { // Simulate a network request
    const data = { id: 1, name: "Data" };
    callback(data); // Execute the callback with the fetched data
  }, 1000);
}

fetchData(function(data) { // This is the callback function
  console.log("Data received:", data);
});
```

#### 43\. What is Callback Hell?

Callback Hell (or the "Pyramid of Doom") is a situation where you have multiple nested callbacks, making the code hard to read and maintain.

```javascript
// Pyramid of Doom
firstApiCall(function(result1) {
  secondApiCall(result1, function(result2) {
    thirdApiCall(result2, function(result3) {
      // ...and so on
    });
  });
});
```

Promises and `async/await` were introduced to solve this problem.

#### 44\. What is a Promise?

A Promise is an object representing the eventual completion (or failure) of an asynchronous operation. It allows you to handle the result or error once the operation is done. A Promise can be in one of three states:

  * **Pending**: The initial state; not yet fulfilled or rejected.
  * **Fulfilled**: The operation completed successfully.
  * **Rejected**: The operation failed.

You can handle these states using `.then()` for success and `.catch()` for failure.

```javascript
const myPromise = new Promise((resolve, reject) => {
  const success = true;
  setTimeout(() => {
    if (success) {
      resolve("The operation was successful!");
    } else {
      reject("The operation failed.");
    }
  }, 1000);
});

myPromise
  .then(result => console.log(result)) // Handles success
  .catch(error => console.log(error)); // Handles failure
```

#### 45\. What is `async/await`?

`async/await` is modern syntax built on top of Promises that makes asynchronous code look and behave more like synchronous code, making it much easier to read and write.

  * The **`async`** keyword is placed before a function to make it return a Promise.
  * The **`await`** keyword is used inside an `async` function to pause its execution and wait for a Promise to resolve before continuing.

<!-- end list -->

```javascript
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTasks() {
  try {
    console.log("Starting...");
    await delay(1000); // Pauses here for 1 second
    console.log("One second has passed.");
    await delay(1000); // Pauses here for another second
    console.log("Two seconds have passed.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

runTasks();
```

#### 46\. What is `Promise.all`?

`Promise.all` takes an array of promises and returns a single new promise. This new promise resolves when **all** of the input promises have resolved, returning an array of their results. If **any** of the input promises reject, `Promise.all` immediately rejects with the reason of the first one that rejected.

```javascript
const p1 = Promise.resolve("One");
const p2 = Promise.resolve("Two");
const p3 = new Promise(resolve => setTimeout(() => resolve("Three"), 1000));

Promise.all([p1, p2, p3]).then(values => {
  console.log(values); // ["One", "Two", "Three"]
});
```

#### 47\. What is `Promise.race`?

`Promise.race` takes an array of promises and returns a new promise that resolves or rejects as soon as **the first one** of the input promises resolves or rejects.

```javascript
const p1 = new Promise(resolve => setTimeout(() => resolve("I am fast!"), 500));
const p2 = new Promise(resolve => setTimeout(() => resolve("I am slow."), 2000));

Promise.race([p1, p2]).then(value => {
  console.log(value); // "I am fast!"
});
```

#### 48\. Explain the Event Loop.

The JavaScript engine has a single thread, meaning it can only do one thing at a time. The event loop is what allows JavaScript to perform non-blocking (asynchronous) operations.

1.  Code is executed from the **Call Stack**.
2.  When an async operation (like `setTimeout` or a `fetch` request) is encountered, it's handed off to a **Web API** in the browser.
3.  The Web API handles the operation. Once it's complete, it places the callback function into the **Callback Queue** (or Task Queue).
4.  The **Event Loop** constantly checks if the Call Stack is empty.
5.  If the Call Stack is empty, the Event Loop takes the first item from the Callback Queue and pushes it onto the Call Stack to be executed.

#### 49\. What is the difference between the Callback Queue and the Microtask Queue?

  * **Callback Queue (or Task Queue)**: Contains callbacks from events like `setTimeout`, `setInterval`, and I/O operations.
  * **Microtask Queue**: Contains callbacks from Promises (`.then()`, `.catch()`, `.finally()`) and other microtasks.

The **Microtask Queue has higher priority**. The Event Loop will execute all tasks in the Microtask Queue before moving on to the next task in the Callback Queue.

```javascript
console.log('Start');

setTimeout(() => {
  console.log('setTimeout callback (in Callback Queue)');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise .then callback (in Microtask Queue)');
});

console.log('End');

// Output order:
// Start
// End
// Promise .then callback (in Microtask Queue)
// setTimeout callback (in Callback Queue)
```

#### 50\. How does `setTimeout(fn, 0)` work?

Calling `setTimeout` with a delay of `0` doesn't execute the function immediately. Instead, it places the callback function (`fn`) into the Callback Queue to be executed on the next tick of the event loop, after the current synchronous code on the call stack has finished executing.

## ES6+ and Modern Features

-----

#### 51\. What are Template Literals?

Template literals are strings enclosed in backticks (`` ` ``) instead of single or double quotes. They allow for:

  * **Embedded expressions**: You can embed variables and expressions directly inside the string using `${expression}`.
  * **Multi-line strings**: You can create strings that span multiple lines without using `\n`.

<!-- end list -->

```javascript
const name = "World";
const greeting = `Hello, ${name}!
This is a multi-line string.`;
console.log(greeting);
```

#### 52\. What are JavaScript Modules?

Modules allow you to split your code into separate files. This makes your code more organized, reusable, and maintainable. You use the `export` keyword to make variables or functions available from a file and the `import` keyword to use them in another file.

```javascript
// a-file.js
export const myVar = "some value";
export function myFunction() { /* ... */ }

// another-file.js
import { myVar, myFunction } from './a-file.js';
```

#### 53\. Explain `for...of` vs. `for...in`.

  * **`for...in`**: Iterates over the **keys (property names)** of an object. It's generally used for objects, not arrays.
  * **`for...of`**: Iterates over the **values** of an iterable object (like an Array, String, Map, Set, etc.). It's the modern and preferred way to loop over arrays.

<!-- end list -->

```javascript
const arr = ['a', 'b', 'c'];
const obj = { x: 1, y: 2 };

// for...in (iterates over keys/indices)
for (const i in arr) {
  console.log(i); // 0, 1, 2 (the indices)
}
for (const key in obj) {
  console.log(key); // x, y
}

// for...of (iterates over values)
for (const val of arr) {
  console.log(val); // a, b, c
}
```

#### 54\. What is the difference between a `Map` and an `Object`?

  * **Keys**: `Map` keys can be of **any data type** (including objects and functions), while `Object` keys must be strings or symbols.
  * **Order**: `Map` remembers the original insertion order of its elements. `Object` keys are not guaranteed to be in any specific order (though modern engines often preserve it).
  * **Size**: You can easily get the size of a `Map` using the `.size` property. For an object, you have to manually count the keys.
  * **Performance**: `Map` is generally optimized for frequent additions and removals of key-value pairs.

#### 55\. What is a `Set`?

A `Set` is a collection of **unique values**. You can add or delete values from it, but it will never contain duplicates. It's useful for tasks like removing duplicate elements from an array.

```javascript
const mySet = new Set();
mySet.add(1);
mySet.add(5);
mySet.add(5); // This one is ignored
mySet.add("some text");

console.log(mySet); // Set(3) { 1, 5, 'some text' }
console.log(mySet.has(1)); // true
```

#### 56\. What are ES6 Classes?

Classes are "syntactic sugar" over JavaScript's existing prototype-based inheritance. They provide a cleaner and more familiar syntax for creating objects and dealing with inheritance, similar to other object-oriented languages.

```javascript
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

let d = new Dog('Mitzie');
d.speak(); // Mitzie barks.
```

#### 57\. What are default parameters?

Default parameters allow you to initialize a function parameter with a default value if no value or `undefined` is passed.

```javascript
function greet(name = "Guest") {
  console.log(`Hello, ${name}!`);
}

greet("Alice"); // Hello, Alice!
greet();        // Hello, Guest!
```

#### 58\. What is a Symbol?

A `Symbol` is a primitive data type that is always unique and immutable. They are often used as keys for object properties to avoid name collisions between different libraries or parts of a program.

```javascript
const id = Symbol('id');
const user = {
  name: 'John',
  [id]: 123 // Using a symbol as a property key
};

console.log(Object.keys(user)); // ['name'] - Symbol keys are not enumerated by default
console.log(user[id]); // 123
```

#### 59\. What are Generator functions?

A generator function (`function*`) can be paused and resumed. It returns a special `Generator` object. When you call the `.next()` method on the generator, it executes the function until it hits a `yield` keyword, then it pauses and returns the yielded value.

```javascript
function* numberGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = numberGenerator();
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2
console.log(gen.next().value); // 3
```

#### 60\. What is a WeakMap?

A `WeakMap` is similar to a `Map`, but its keys must be objects, and the references to these keys are held "weakly." This means that if there are no other references to an object used as a key, that object can be garbage collected. This is useful for preventing memory leaks.

## DOM & Browser APIs

-----

#### 61\. What is the DOM?

The DOM (Document Object Model) is a programming interface for web documents. It represents the page so that programs can change the document structure, style, and content. The browser creates a DOM tree from the HTML, and JavaScript can interact with this tree to manipulate the page.

#### 62\. What's the difference between `getElementById` and `querySelector`?

  * **`getElementById('id')`**: Selects a single element by its unique ID. It's very fast.
  * **`querySelector('selector')`**: Selects the **first** element that matches a specified CSS selector (e.g., `#id`, `.class`, `div > p`). It's more flexible but can be slightly slower.
  * **`querySelectorAll('selector')`**: Selects **all** elements that match a CSS selector and returns them as a `NodeList`.

#### 63\. Explain event bubbling and event capturing.

These are two phases of event propagation in the DOM.

  * **Capturing Phase**: The event travels from the outermost element (the `window`) down to the target element.
  * **Bubbling Phase**: The event "bubbles" up from the target element back up to the `window`.

By default, event handlers are executed in the bubbling phase. You can listen for an event in the capturing phase by setting the third argument of `addEventListener` to `true`.

#### 64\. What does `event.preventDefault()` do?

It prevents the default action of an event from happening. For example, it can stop a form from submitting when a button is clicked or prevent a link from navigating to a new page.

```javascript
const link = document.querySelector('a');
link.addEventListener('click', function(event) {
  event.preventDefault(); // Stops the link from navigating
  console.log("Link navigation prevented.");
});
```

#### 65\. What does `event.stopPropagation()` do?

It stops an event from propagating further up or down the DOM tree (i.e., it stops bubbling or capturing).

#### 66\. What is the difference between `localStorage` and `sessionStorage`?

Both are Web Storage APIs that allow you to store key/value pairs in the browser.

  * **`localStorage`**: Stores data with no expiration date. The data will persist even after the browser is closed and reopened.
  * **`sessionStorage`**: Stores data for one session only. The data is cleared when the browser tab is closed.

#### 67\. What are cookies?

Cookies are small pieces of data stored on the user's computer by the web browser. They are sent with every request to the server and are primarily used for:

  * **Session management** (logins)
  * **Personalization** (user preferences)
  * **Tracking** (analyzing user behavior)

Cookies have a size limit (around 4KB) and can have an expiration date.

#### 68\. What's the difference between `window` and `document`?

  * **`window`**: The global object in a browser. It represents the browser window or tab. All global JavaScript objects, functions, and variables automatically become members of the `window` object. `setTimeout` and `alert` are methods on the `window` object.
  * **`document`**: An object that represents the web page loaded in the browser. It's a property of the `window` object (`window.document`). You use it to access and manipulate the content of the page (the DOM).

#### 69\. How do you add or remove a class from an HTML element?

You use the `classList` property of the element.

  * `element.classList.add('className')`
  * `element.classList.remove('className')`
  * `element.classList.toggle('className')`
  * `element.classList.contains('className')`

<!-- end list -->

```javascript
const myDiv = document.getElementById('myDiv');
myDiv.classList.add('active');
myDiv.classList.remove('old-class');
```

#### 70\. What is the Same-Origin Policy?

The Same-Origin Policy is a critical security mechanism that restricts how a document or script loaded from one "origin" can interact with a resource from another "origin." An origin is defined by the scheme (protocol), host (domain), and port. This policy prevents malicious scripts on one page from obtaining sensitive data from another web page.

## More Questions

-----

#### 71\. What is type coercion?

Type coercion is the automatic or implicit conversion of values from one data type to another (such as strings to numbers). This happens when you use operators like `==` or the `+` operator with mixed types.

```javascript
console.log(1 + "2"); // "12" (number 1 is coerced to a string)
console.log("5" - 1); // 4 (string "5" is coerced to a number)
console.log(true + 1); // 2 (boolean true is coerced to number 1)
```

#### 72\. How does the `new` keyword work?

When you use the `new` keyword with a constructor function, it does four things:

1.  Creates a new, empty plain JavaScript object.
2.  Sets the `[[Prototype]]` of the new object to the constructor function's `prototype` object.
3.  Binds the `this` keyword to the newly created object and executes the constructor function's code.
4.  Returns the new object (unless the constructor function explicitly returns another object).

#### 73\. What is NaN? What is `isNaN()`?

`NaN` stands for "Not-a-Number." It's a special numeric value that results from an invalid or unrepresentable mathematical operation, like `0 / 0` or `Math.sqrt(-1)`.
A tricky thing about `NaN` is that it does not equal anything, not even itself (`NaN === NaN` is `false`).
To check if a value is `NaN`, you should use the global `isNaN()` function or the more reliable `Number.isNaN()`.

#### 74\. What is the difference between `Object.create()` and the `new` keyword?

  * **`new MyObject()`**: Creates a new object that inherits from `MyObject.prototype`.
  * **`Object.create(someObject)`**: Creates a new object where you explicitly specify the prototype (`someObject`). It gives you more direct control over the prototype chain.

#### 75\. How can you clone an object?

  * **Shallow Clone**: `const newObj = { ...oldObj };` or `const newObj = Object.assign({}, oldObj);`
  * **Deep Clone**: The most common way is `const newObj = JSON.parse(JSON.stringify(oldObj));`. However, this has limitations (it can't clone functions, `undefined`, or Symbols). For complex cases, a library like Lodash (`_.cloneDeep()`) is better.

#### 76\. What is memoization?

Memoization is an optimization technique used to speed up function calls by caching the results of expensive function calls and returning the cached result when the same inputs occur again.

```javascript
function memoizedFactorial() {
  const cache = {};
  return function(n) {
    if (n in cache) {
      return cache[n];
    }
    if (n === 0) {
      return 1;
    }
    const result = n * this(n - 1); // Recursive call to the memoized function
    cache[n] = result;
    return result;
  };
}
const factorial = memoizedFactorial();
console.log(factorial(5)); // Calculates and caches
console.log(factorial(5)); // Returns from cache
```

#### 77\. What is composition over inheritance?

It's a principle in object-oriented design that favors "composing" objects from smaller, independent objects (has-a relationship) over inheriting behavior from a base class (is-a relationship). Composition often leads to more flexible and reusable code.

#### 78\. What are first-class functions?

It means that functions are treated like any other variable. In JavaScript, functions can be:

  * Assigned to variables.
  * Passed as arguments to other functions.
  * Returned from other functions.

#### 79\. What is currying?

Currying is the process of transforming a function that takes multiple arguments into a sequence of functions that each take a single argument.

```javascript
// Non-curried function
const add = (a, b, c) => a + b + c;

// Curried function
const curriedAdd = (a) => (b) => (c) => a + b + c;

console.log(curriedAdd(1)(2)(3)); // 6
const add1 = curriedAdd(1);
console.log(add1(2)(3)); // 6
```

#### 80\. What is a "polyfill"?

A polyfill is a piece of code (usually JavaScript on the Web) used to provide modern functionality on older browsers that do not natively support it. For example, you could write a polyfill for `Array.prototype.flat()` so you can use it in a browser that doesn't have it built-in.

#### 81\. Explain what a static method is in a class.

A static method is a method that belongs to the class itself, not to an instance of the class. You call it directly on the class name, not on an object created from the class. They are often used for utility functions.

```javascript
class Car {
  static formatPrice(price) {
    return `$${price.toFixed(2)}`;
  }
}
console.log(Car.formatPrice(19999.5)); // $19999.50
```

#### 82\. What is the purpose of the `.then()` method on a Promise?

The `.then()` method is used to schedule a callback function to be executed when the Promise is fulfilled (resolved). It takes two optional arguments: a callback for success and a callback for failure. It returns a new Promise, which is why you can chain multiple `.then()` calls.

#### 83\. What is the `.catch()` method on a Promise?

The `.catch()` method is used to schedule a callback function to be executed when the Promise is rejected. It's syntactic sugar for `.then(null, rejectionCallback)`.

#### 84\. What is the `.finally()` method on a Promise?

The `.finally()` method schedules a callback to be executed when the promise is settled (either fulfilled or rejected). It's useful for cleanup code that should run regardless of the outcome, like hiding a loading spinner.

#### 85\. What is AJAX?

AJAX (Asynchronous JavaScript and XML) is a set of web development techniques that allows a web page to update portions of its content by exchanging data with a web server asynchronously, without reloading the entire page. The modern way to perform AJAX is using the `fetch()` API.

#### 86\. What is the Fetch API?

The Fetch API is a modern, promise-based interface for making network requests (like getting data from a server). It's a more powerful and flexible replacement for the older `XMLHttpRequest` object.

```javascript
fetch('https://api.example.com/data')
  .then(response => response.json()) // Parse the response as JSON
  .then(data => console.log(data))
  .catch(error => console.error('Error fetching data:', error));
```

#### 87\. What is a "side effect" in the context of functions?

A side effect is any way a function interacts with the outside world beyond returning a value. Examples include:

  * Modifying a global variable.
  * Changing the DOM.
  * Writing to the console (`console.log`).
  * Making a network request.

Pure functions have no side effects.

#### 88\. What is the `typeof` operator?

The `typeof` operator returns a string indicating the type of the unevaluated operand.

```javascript
typeof 42;         // "number"
typeof "hello";    // "string"
typeof true;       // "boolean"
typeof {};         // "object"
typeof [];         // "object" (arrays are objects)
typeof null;       // "object" (this is a long-standing bug)
typeof undefined;  // "undefined"
typeof function(){}; // "function"
```

#### 89\. What is the `instanceof` operator?

The `instanceof` operator tests to see if the `prototype` property of a constructor appears anywhere in the prototype chain of an object.

```javascript
class Car {}
const myCar = new Car();

console.log(myCar instanceof Car); // true
console.log([] instanceof Array);  // true
console.log([] instanceof Object); // true (arrays inherit from Object)
```

#### 90\. What is recursion?

Recursion is a technique where a function calls itself to solve a problem. A recursive function must have a base case (a condition to stop the recursion) to prevent an infinite loop.

```javascript
// A recursive function to calculate factorial
function factorial(n) {
  // Base case
  if (n === 0) {
    return 1;
  }
  // Recursive case
  return n * factorial(n - 1);
}
console.log(factorial(5)); // 120
```

#### 91\. What is debouncing?

Debouncing is a programming practice used to limit the rate at which a function gets called. It groups a sudden burst of events (like keystrokes or mouse movements) into a single one. The function is only called after a specified period of inactivity. It's useful for things like search bars that make API calls as you type.

#### 92\. What is throttling?

Throttling is another technique to limit function execution. It ensures that a function is called at most once in a specified time interval, no matter how many times the event fires. It's useful for events that fire rapidly, like scrolling or resizing a window.

#### 93\. What is a "temporal dead zone"?

The Temporal Dead Zone (TDZ) is the period between entering scope and where a `let` or `const` variable is declared. You cannot access the variable in the TDZ; doing so will cause a `ReferenceError`.

```javascript
function tdzExample() {
  // Start of TDZ for myVar
  // console.log(myVar); // ReferenceError
  let myVar = 10; // End of TDZ for myVar
  console.log(myVar); // 10
}
```

#### 94\. What is a JavaScript Proxy object?

A `Proxy` object is used to define custom behavior for fundamental operations (e.g., property lookup, assignment, enumeration, function invocation, etc.). It allows you to "trap" operations on an object and intercept them.

#### 95\. What does the `Array.from()` method do?

`Array.from()` creates a new, shallow-copied Array instance from an array-like or iterable object. This is a common way to convert things like a `NodeList` or the `arguments` object into a true array.

#### 96\. What is a Web Worker?

A Web Worker allows you to run a script in a background thread, separate from the main execution thread. This is useful for running long, computationally intensive tasks without freezing the user interface.

#### 97\. What is CORS?

CORS (Cross-Origin Resource Sharing) is a mechanism that uses additional HTTP headers to tell browsers to give a web application running at one origin, access to selected resources from a different origin. A web application executes a cross-origin HTTP request when it requests a resource that has a different origin (domain, protocol, or port) from its own.

#### 98\. How do you handle errors in `async/await`?

You use a standard `try...catch` block, just like you would with synchronous code.

```javascript
async function fetchData() {
  try {
    const response = await fetch('https://invalid-url.com');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Oops, something went wrong:", error);
  }
}
```

#### 99\. What are arrow function considerations for methods in objects?

Because arrow functions inherit `this` from their parent scope, they are often a poor choice for object methods. A regular function should be used if you need `this` to refer to the object itself.

```javascript
const counter = {
  count: 0,
  // This works as expected
  increment: function() {
    setInterval(() => {
      // 'this' here refers to the 'counter' object because
      // the arrow function inherits 'this' from 'increment'
      console.log(this.count++);
    }, 1000);
  },
  // This will NOT work
  // badIncrement: () => {
  //   // 'this' here refers to the global window object, not the counter
  //   console.log(this.count++); // Results in NaN
  // }
};

counter.increment();
```

#### 100\. What is Big O Notation and why is it useful?

Big O notation is used to describe the performance or complexity of an algorithm. It specifically describes the worst-case scenario and can be used to describe the execution time or space required by an algorithm as the input size grows. It's useful for comparing the efficiency of different solutions to a problem. For example, an algorithm with O(n) complexity (linear) is generally better than one with O(n²) complexity (quadratic) for large inputs.
