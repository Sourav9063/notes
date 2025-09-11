## Basic Types & Variables

TypeScript introduces several new primitive types and a way to explicitly declare the type of a variable.

  * **Primitive Types**: `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, and `bigint`.
  * **`any`**: The "escape hatch." Use it when you don't know the type or need to opt-out of type-checking. Use it sparingly\!
  * **`unknown`**: A safer alternative to `any`. You can't perform any operations on an `unknown` variable until you narrow its type.

<!-- end list -->

```typescript
let myName: string = 'Alex';
let age: number = 30;
let isDev: boolean = true;
let anything: any = 'I can be anything!';
let unknownValue: unknown = 'I must be checked before use.';
```

The `unknown` type is particularly useful when dealing with data from external APIs, where the structure is not guaranteed.

-----

## Arrays & Tuples

Typed arrays and tuples add more structure to your data.

  * **Arrays**: Declare the type of elements inside the array.
      * `string[]` or `Array<string>`
  * **Tuples**: An array with a **fixed number of elements** at specific positions, each with a known type.

<!-- end list -->

```typescript
// Array
let names: string[] = ['Alice', 'Bob', 'Charlie'];

// Tuple
let user: [number, string, boolean] = [1, 'Alex', true];
// user = ['Alex', 1, true]; // Error: Incorrect types
```

-----

## Functions

Typing functions helps enforce correct parameter types and return values.

  * **Parameter Types**: Specify the expected type for each parameter.
  * **Return Type**: Declare the type of the value the function will return.
  * **Optional Parameters**: Use `?` to make a parameter optional.
  * **Default Parameters**: Assign a default value.
  * **Rest Parameters**: Use `...` for an unknown number of arguments.

<!-- end list -->

```typescript
function add(x: number, y: number): number {
  return x + y;
}

function greet(name: string, greeting?: string): string {
  if (greeting) {
    return `${greeting}, ${name}!`;
  }
  return `Hello, ${name}!`;
}

function printAllNames(firstName: string, ...restOfNames: string[]) {
  console.log(firstName, restOfNames);
}
```

-----

## Objects & Interfaces

This is where TypeScript's power truly shines. **Interfaces** and **Type Aliases** are used to define the structure of objects.

  * **Interfaces**: Define the **shape** of an object. They are great for defining public APIs and object contracts. They can be extended and implemented by classes.
  * **Type Aliases**: Create a new name for a type. They can be used for primitives, unions, tuples, and object shapes. Use them for complex type signatures.

<!-- end list -->

```typescript
interface User {
  readonly id: number; // Readonly property
  name: string;
  email?: string; // Optional property
}

type Point = {
  x: number;
  y: number;
};

let user1: User = {
  id: 1,
  name: 'Alex',
};

// user1.id = 2; // Error: Cannot assign to 'id' because it is a read-only property.
```

Use **interfaces** for object shape definitions, especially when a class needs to implement it. Use **type aliases** for complex types like union types or for creating a new name for a primitive type.

-----

## Classes

TypeScript extends JavaScript classes with type-checking and access modifiers.

  * **Access Modifiers**: `public`, `private`, `protected`.
      * `public`: Accessible from anywhere.
      * `private`: Accessible only within the class.
      * `protected`: Accessible within the class and its subclasses.
  * **Inheritance**: Classes can `extend` other classes.
  * **Constructor**: Can have typed parameters.

<!-- end list -->

```typescript
class Animal {
  constructor(private name: string) {}

  public makeSound(sound: string) {
    console.log(`${this.name} makes a ${sound}`);
  }
}

class Dog extends Animal {
  constructor(name: string, private breed: string) {
    super(name);
  }
  public makeSound(sound: string) {
    console.log(`${this.name} a ${this.breed} dog, says ${sound}`); // this.name is accessible due to protected
  }
}

let doggo = new Dog('Max', 'Golden Retriever');
doggo.makeSound('woof');
// console.log(doggo.name); // Error: Property 'name' is private
```

-----

## Union & Intersection Types

Combine types to create more flexible type definitions.

  * **Union Types**: A variable can be **one of several** types. Use the `|` operator.
  * **Intersection Types**: A variable must have **all the properties** of multiple types. Use the `&` operator.

<!-- end list -->

```typescript
// Union Type
function printId(id: number | string) {
  console.log('Your ID is: ' + id);
}
printId(101); // OK
printId('202'); // OK
// printId(true); // Error

// Intersection Type
interface A { a: string; }
interface B { b: number; }
type AB = A & B;

let intersection: AB = {
  a: 'hello',
  b: 42
};
```

Union types are fantastic for handling different data structures, such as a function that accepts either a `string` or a `number`.

-----

## Type Guards & Narrowing

This is the process of refining a type from a more general one to a more specific one.

  * **`typeof`**: Used to check for primitive types.
  * **`instanceof`**: Checks if an object is an instance of a class.
  * **Custom Type Guards**: Functions that return a boolean and have a special return type signature: `param is Type`.

<!-- end list -->

```typescript
// Type Guard with typeof
function padLeft(padding: number | string, input: string) {
  if (typeof padding === 'number') {
    return ' '.repeat(padding) + input;
  }
  return padding + input;
}

// Custom Type Guard
interface Fish { swim(): void; }
interface Bird { fly(): void; }

function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

function move(pet: Fish | Bird) {
  if (isFish(pet)) {
    pet.swim();
  } else {
    pet.fly();
  }
}
```

-----

## Generics

Generics are a powerful feature that allows you to create reusable components that can work with a variety of types. They are a way of making types into parameters.

  * **Generic Functions**: Define a type variable `T` that can be used within the function.
  * **Generic Interfaces/Classes**: Define a type variable on the interface or class itself.

<!-- end list -->

```typescript
// Generic Function
function identity<T>(arg: T): T {
  return arg;
}

let output1 = identity<string>('myString'); // Explicit type
let output2 = identity(123); // Type inference

// Generic Interface
interface GenericIdentityFn<T> {
  (arg: T): T;
}

let myIdentity: GenericIdentityFn<number> = identity;
```

Generics are essential for creating flexible and type-safe data structures like stacks, queues, or a function that can operate on an array of any type.

-----

## Mapped & Conditional Types

These are advanced features for transforming existing types into new ones.

  * **Mapped Types**: Create new types by iterating over the properties of an existing type.
      * `keyof`: Creates a union of string literal types from an object's keys.
      * `in`: Iterates over the keys.
  * **Conditional Types**: Choose one of two types based on a condition.
      * `extends`: The `extends` keyword is used for the condition.
      * `infer`: Used to infer a type in the `extends` clause and use it in the true branch.

<!-- end list -->

```typescript
// Mapped Type
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

interface User {
  name: string;
  age: number;
}

type ReadonlyUser = Readonly<User>;
// ReadonlyUser will be { readonly name: string; readonly age: number; }

// Conditional Type
type IsString<T> = T extends string ? 'yes' : 'no';

type T1 = IsString<string>; // 'yes'
type T2 = IsString<number>; // 'no'
```

These advanced types are used in creating powerful utility types in popular libraries.

-----

## Advanced Niceties & Tricks

Here are some extra features and best practices to keep in mind.

  * **Enums**: Create a collection of named constants.

<!-- end list -->

```typescript
enum Direction {
  Up,
  Down,
  Left,
  Right,
}

let myDirection: Direction = Direction.Up;
```

  * **Type Assertions**: Use `as` to tell the compiler "trust me, I know better." Use with caution.

<!-- end list -->

```typescript
let someValue: unknown = 'this is a string';
let strLength: number = (someValue as string).length;
```

  * **Non-null Assertion Operator (`!`)**: Asserts that a value is not `null` or `undefined`. Use only when you are absolutely sure.

<!-- end list -->

```typescript
function printName(name: string | null) {
  console.log(name!.toUpperCase()); // The ! tells the compiler that name will not be null here
}
```

  * **`const` assertions**: A special kind of type assertion that tells the compiler to infer the narrowest possible type.

<!-- end list -->

```typescript
let arr = [1, 'hello'] as const;
// arr is of type readonly [1, 'hello']
```
## Deeper Dive: Interfaces vs. Type Aliases

This is a common point of confusion for JavaScript developers moving to TypeScript. Here's a more detailed breakdown:

| Feature | Interface | Type Alias |
|---|---|---|
| **Declaration** | `interface User { ... }` | `type User = { ... };` |
| **Extending** | Can be extended by other interfaces using `extends`. | Can be extended by other type aliases using `&` (intersection). |
| **Implementing** | A class can `implement` an interface. | A class **cannot** `implement` a type alias (for object shapes). |
| **Declaration Merging** | Can be declared multiple times, and their members will be merged. | Cannot be declared multiple times. |
| **Primitives & Unions** | **Cannot** be used for primitive types, union types, or tuples. | **Can** be used for all of these. |

**Use Case Examples:**

  * **When to use `interface`**:
      * Defining the shape of an object that will be used as a contract for a class.
      * When you might need to extend the type later via declaration merging (e.g., for library augmentation).
    <!-- end list -->
    ```typescript
    // Library A
    interface MyLibraryConfig {
      theme: string;
    }

    // Your application code
    // You can augment the library's interface
    interface MyLibraryConfig {
      darkMode: boolean;
    }
    ```
  * **When to use `type`**:
      * For defining a union or intersection type.
      * For giving a new name to a primitive type.
      * For creating a tuple type.
    <!-- end list -->
    ```typescript
    type ID = string | number;
    type Point = [number, number];
    type Result = 'success' | 'failure';
    ```

**Recommendation:** For defining object shapes, a good rule of thumb is to use **interfaces** unless you need a specific feature that only type aliases provide (like unions or mapped types).

-----

## Mapped Types: More Examples and Built-ins

Mapped types are a cornerstone of advanced TypeScript. They allow you to create new types from old types by transforming each property. TypeScript provides several built-in mapped types for common use cases.

  * **`Partial<T>`**: Makes all properties of `T` optional.
  * **`Readonly<T>`**: Makes all properties of `T` `readonly`.
  * **`Pick<T, K>`**: Constructs a type by picking a set of properties `K` from `T`.
  * **`Omit<T, K>`**: Constructs a type by omitting a set of properties `K` from `T`.
  * **`Record<K, T>`**: Constructs an object type with properties whose keys are `K` and values are `T`.

**Code Example:**

```typescript
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

// Partial
type PartialTodo = Partial<Todo>;
// { title?: string; description?: string; completed?: boolean; }

// Pick
type TodoPreview = Pick<Todo, 'title' | 'completed'>;
// { title: string; completed: boolean; }

// Omit
type TodoNoDescription = Omit<Todo, 'description'>;
// { title: string; completed: boolean; }

// Record
type TodoStatus = 'pending' | 'completed';
type Todos = Record<TodoStatus, Todo[]>;
// { pending: Todo[]; completed: Todo[]; }
```

**Use Case:** These utility types are extremely useful for creating flexible function parameters or API payloads. For example, a function that updates a user might only need a subset of the user's properties, which you can represent with `Partial<User>`.

-----

## Conditional Types: `infer` Keyword Deep Dive

The `infer` keyword is a special part of conditional types. It lets you extract a type from another type within the `extends` clause.

**Code Example:**

```typescript
// Extracts the return type of a function
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

function greeting(name: string): string {
  return `Hello, ${name}`;
}

type GreetingResult = ReturnType<typeof greeting>; // string
type NumberResult = ReturnType<() => number>; // number
```

The `infer R` part tells TypeScript to "infer" the type of the function's return value and assign it to a new type variable `R`. If the condition is met, the type becomes `R`; otherwise, it's `any`.

This is the magic behind powerful utility types in the TypeScript standard library.

-----

## Decorators

Decorators are a proposed feature for JavaScript (currently a Stage 3 proposal) that TypeScript implements. They are special kinds of declarations that can be attached to classes, methods, properties, or parameters.

  * **Use Case:** Commonly used in frameworks for meta-programming, like adding extra functionality to classes without changing their code.

To use decorators, you need to enable the `experimentalDecorators` flag in your `tsconfig.json`.

```json
{
  "compilerOptions": {
    "target": "ES5",
    "experimentalDecorators": true
  }
}
```

**Code Example:**

```typescript
// A simple decorator
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
  greet() {
    return 'Hello, ' + this.greeting;
  }
}

// sealed ensures that Greeter cannot be extended or have new properties added
```

Decorators are a more advanced topic and are not used in day-to-day coding as frequently as other features, but they are crucial for understanding frameworks like Angular and NestJS.

-----

## Type `never`

The `never` type represents the type of values that **never occur**.

  * It is a subtype of every type.
  * A function that never returns (e.g., an infinite loop or a function that always throws an error) has a return type of `never`.
  * It's useful for ensuring exhaustive checking in conditional logic.

**Code Example:**

```typescript
// The function never returns
function error(message: string): never {
  throw new Error(message);
}

// Exhaustive check
type Status = 'success' | 'failure';

function handleStatus(status: Status): number {
  switch (status) {
    case 'success':
      return 1;
    case 'failure':
      return 0;
    default:
      // This part of the code should never be reached
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
  }
}
```

If you were to add a new `'pending'` status to the `Status` type but forget to handle it in the `switch` statement, the compiler would give you an error on `_exhaustiveCheck` because `status` would no longer be of type `never`. This is a powerful safety net.

## Template Literal Types

Introduced in TypeScript 4.1, Template Literal Types allow you to create new string literal types based on existing ones. They work just like JavaScript's template literals, but at the type level.

**Use Case:** This is incredibly useful for building types that represent complex string patterns, like API endpoints, CSS class names, or event names.

**Code Example:**

```typescript
type Direction = 'left' | 'right' | 'up' | 'down';
type MoveEvent = `move${Capitalize<Direction>}`;
// type MoveEvent = "moveLeft" | "moveRight" | "moveUp" | "moveDown"

type CSSUnit = 'px' | 'em' | 'rem' | 'vh' | 'vw';
type Padding = `padding-${CSSUnit}`;
// type Padding = "padding-px" | "padding-em" | "padding-rem" | "padding-vh" | "padding-vw"
```

You can use `Capitalize<T>`, `Uncapitalize<T>`, `Uppercase<T>`, and `Lowercase<T>` to perform string transformations.

-----

## Polymorphic `this`

The `this` type refers to the type of the instance of the class it is in. It's a placeholder type that resolves to the concrete class type at runtime.

**Use Case:** This is the key to creating fluent APIs (method chaining), where each method returns the instance of the class it was called on. This pattern is common in builders, loggers, or ORMs.

**Code Example:**

```typescript
class Calculator {
  protected value: number = 0;

  add(operand: number): this {
    this.value += operand;
    return this;
  }

  multiply(operand: number): this {
    this.value *= operand;
    return this;
  }

  getValue(): number {
    return this.value;
  }
}

class ScientificCalculator extends Calculator {
  sin(): this {
    this.value = Math.sin(this.value);
    return this;
  }
}

let calc = new ScientificCalculator();
// This works perfectly due to polymorphic 'this'
let result = calc.add(10).multiply(2).sin().getValue();
```

Without `this` as the return type, the methods would return a `Calculator` instance, and you wouldn't be able to call `sin()` on the chained result.

-----

## Discriminated Unions

This is a powerful pattern for modeling a finite set of states or different types of objects with a shared, literal-typed property.

  * **The Discriminant:** A single literal property (`kind`, `type`, `status`, etc.) that is common to all types in the union.
  * **The Union:** The set of different types that can be discriminated.
  * **Exhaustive Checking:** Combining this pattern with a `switch` statement and the `never` type ensures you've handled every possible case.

**Use Case:** This is the gold standard for handling different kinds of messages or events in an application, where each event has a different payload but a common `type` field.

**Code Example:**

```typescript
interface Square {
  kind: 'square';
  size: number;
}

interface Rectangle {
  kind: 'rectangle';
  width: number;
  height: number;
}

interface Circle {
  kind: 'circle';
  radius: number;
}

type Shape = Square | Rectangle | Circle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'square':
      return shape.size * shape.size;
    case 'rectangle':
      return shape.width * shape.height;
    case 'circle':
      return Math.PI * shape.radius ** 2;
    default:
      // This is the exhaustive check with the 'never' type
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

Notice how in each `case`, TypeScript automatically narrows the type of `shape` based on the `kind` property. This provides flawless type-safety.

-----

## Recursive Types

Recursive types are types that refer to themselves. They are most commonly used to define data structures that can contain nested instances of the same type, such as trees or linked lists.

**Use Case:** Ideal for representing hierarchical data like file systems, organizational charts, or comments in a forum.

**Code Example:**

```typescript
// A simple tree node
interface TreeNode<T> {
  value: T;
  children?: TreeNode<T>[];
}

const fileSystem: TreeNode<string> = {
  value: '/',
  children: [
    {
      value: 'documents',
      children: [
        { value: 'report.pdf' },
        { value: 'photo.jpg' }
      ]
    },
    { value: 'downloads' }
  ]
};
```

TypeScript's type system is smart enough to handle this self-referencing structure, providing type-safety as you navigate the tree.

-----

## Type `const` assertions

We touched on this briefly, but it's worth a second look. The `as const` assertion tells the compiler to infer the narrowest possible type for a value.

**Use Case:** Useful for creating immutable data structures or when you want to use a set of strings or numbers as literal types.

**Code Example:**

```typescript
// Without `as const`
let colors = ['red', 'green', 'blue'];
// The type is `string[]`

// With `as const`
let colorsAsConst = ['red', 'green', 'blue'] as const;
// The type is `readonly ["red", "green", "blue"]`

// Now you can use the literal types directly
function printColor(color: typeof colorsAsConst[number]) {
  console.log(color);
}
printColor('red'); // OK
// printColor('yellow'); // Error: "yellow" is not in the type
```

`typeof colorsAsConst[number]` is a nifty trick to get the union of the literal types in the array (`"red" | "green" | "blue"`).

## Index Signatures

An index signature allows you to define the type of properties on an object without knowing their names in advance. This is essential for dictionaries or hash maps.

**Use Case:** Ideal for objects where you know the key and value types, but the number and names of the keys are dynamic (e.g., an object representing user settings or a cache).

**Code Example:**

```typescript
interface StringDictionary {
  [key: string]: string;
}

let myDictionary: StringDictionary = {};
myDictionary['language'] = 'en';
myDictionary['country'] = 'US';
// myDictionary[123] = 'error'; // Error: Numeric keys are not assignable to a string index signature.

interface UserSettings {
  [key: string]: string | number | boolean;
}

let settings: UserSettings = {
  theme: 'dark',
  fontSize: 14,
  receiveNotifications: true,
};
```

The key type must be `string`, `number`, `symbol`, or a template literal type. The value can be any type.

-----

## The `in` Operator for Type Narrowing

We've discussed `typeof` and `instanceof` as type guards. The `in` operator is another powerful tool for narrowing types, especially when dealing with union types of objects.

**Use Case:** When you have a union of objects and you need to check for the existence of a specific property to determine the object's type.

**Code Example:**

```typescript
interface A {
  x: number;
}

interface B {
  y: string;
}

type AorB = A | B;

function doSomething(obj: AorB) {
  if ('x' in obj) {
    // TypeScript knows obj is of type A here
    console.log(obj.x);
  } else {
    // TypeScript knows obj is of type B here
    console.log(obj.y);
  }
}
```

This is a cleaner and more direct way to handle discriminated unions without a shared discriminant property.

-----

## Indexed Access Types (`[]`)

You can use a literal type or a union of literal types to look up the type of a property on another type. This is like a type-level property accessor.

**Use Case:** When you need to create a new type that consists of the value type of a specific property from an existing type.

**Code Example:**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type UserID = User['id']; // type UserID = number
type UserName = User['name']; // type UserName = string

// You can also use a union of keys to get a union of value types
type UserData = User['id' | 'name']; // type UserData = number | string
```

This is a powerful tool when combined with `keyof` to dynamically access types based on a type's keys.

-----

## Function Overloads

Function overloads allow you to declare multiple function signatures for a single function implementation. This provides better type information to consumers of the function without creating multiple functions.

**Use Case:** When a function can accept different types of arguments and return different types of values based on the inputs.

**Code Example:**

```typescript
// Overload signatures (what consumers see)
function add(a: number, b: number): number;
function add(a: string, b: string): string;
function add(a: string, b: number): string;
function add(a: number, b: string): string;

// The single implementation signature (what developers write)
function add(a: any, b: any): any {
  if (typeof a === 'string' || typeof b === 'string') {
    return a.toString() + b.toString();
  }
  return a + b;
}

let result1 = add(10, 20); // number
let result2 = add('Hello', 'World'); // string
let result3 = add(5, 'apples'); // string
// let result4 = add(true, false); // Error: No overload matches this call.
```

This ensures type-safe usage while keeping the implementation concise. The overloads provide a clear contract for the function's behavior.

-----

## Type `void` vs. `undefined`

This is a subtle but important distinction.

  * **`void`**: The return type of a function that does not have a `return` statement, or a `return` statement with no value. It means the function's return value should be ignored.
  * **`undefined`**: The type of the value `undefined`. A function can explicitly return `undefined`.

**Use Case:** The most significant difference is in callbacks. A function returning `void` can be used where a function returning `undefined` is expected, but not the other way around. This allows for a `void` function to be used without causing a problem.

**Code Example:**

```typescript
function noReturn(): void {
  // no return statement
}

function returnUndefined(): undefined {
  return undefined;
}

let a: void = noReturn();
let b: undefined = returnUndefined();

// This is an error because 'void' cannot be assigned to 'undefined'
// let c: undefined = noReturn(); 

// This works because 'undefined' can be assigned to 'void'
let d: void = returnUndefined(); 
```

In a `forEach` loop, for instance, the callback is expected to have a `void` return type, so it's fine if the function returns `undefined`, `string`, or anything else; TypeScript will just ignore it. This is a deliberate design choice for flexibility.

These concepts are less about the syntax and more about the philosophy of writing robust, reusable, and type-safe code. They are what allow TypeScript to scale from a simple script to a massive enterprise application.

## `tsconfig.json` Explained

The `tsconfig.json` file is a configuration file for the TypeScript compiler (`tsc`). It's at the heart of any TypeScript project and provides a way to:

  * Specify root files and the output directory.
  * Control the strictness of type-checking.
  * Configure how modules are resolved.
  * Enable or disable experimental features.
  * Set up a project's type definitions.

Here are some of the most important options you'll encounter:

-----

### Strictness Flags 🚩

These are your primary tools for ensuring code quality. Enabling them forces you to write safer, more robust code.

  * `"strict": true`: This is the master switch. It enables a set of other strictness flags. For a new project, you should **always** start with this.
  * `"noImplicitAny": true`: Throws an error whenever a variable is inferred to have the `any` type, but an explicit type isn't provided. This forces you to be deliberate about using `any` and to type your code properly.
  * `"strictNullChecks": true`: My personal favorite. This flag means that `null` and `undefined` are no longer valid values for any type unless you explicitly allow them with a union type (e.g., `string | null`). This eliminates a vast number of runtime errors.
  * `"strictFunctionTypes": true`: Checks that function parameters are compatible in a more rigorous way, preventing subtle bugs with function assignments.
  * `"strictBindCallApply": true`: Ensures that the `bind`, `call`, and `apply` methods of functions are used correctly with their arguments.

-----

### Module & Target Flags 🎯

These flags are essential for making TypeScript work with modern JavaScript ecosystems.

  * `"target": "es2020"`: This specifies the ECMAScript version that the code will be compiled to. A modern target like `"es2020"` or `"esnext"` allows the compiler to output less code, as it can rely on more recent language features that are already supported by runtimes.
  * `"module": "esnext"`: This defines the module system to use in the compiled output. `"esnext"` is a good choice for modern applications, as it uses ES Modules, which are standard for web development and supported by tools like Webpack and Vite.
  * `"esModuleInterop": true`: This is a crucial compatibility flag. It helps with interoperability between ES modules and CommonJS modules, particularly when you're importing a CommonJS module into an ES module project.
  * `"resolveJsonModule": true`: Allows you to import JSON files directly into your TypeScript code, treating them as modules with a default export.

-----

### Path & File Inclusion 📂

These options control which files the compiler processes.

  * `"include": ["src/**/*"]`: An array of glob patterns that tells the compiler which files to include in the compilation. This is the most common way to define your source files.
  * `"exclude": ["node_modules", "dist"]`: An array of glob patterns for files that should be excluded from the compilation. `node_modules` is almost always excluded for performance reasons.
  * `"outDir": "dist"`: Specifies the output directory for the compiled JavaScript files. This keeps your source code and compiled code separate.
  * `"baseUrl": "./src"`: This option, combined with `"paths"`, allows you to create module aliases for cleaner imports.

-----

### Example `tsconfig.json`

Here's a well-configured `tsconfig.json` for a modern web project:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "esnext",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@utils/*": ["src/utils/*"],
      "@components/*": ["src/components/*"]
    }
  },
  "include": ["src"]
}
```

This configuration provides a great starting point for most projects, balancing strictness with developer convenience.

## The `tsc` CLI

While the `tsconfig.json` file handles all the configuration, you'll still interact with the TypeScript compiler via the Command Line Interface (CLI).

  * `tsc`: Runs the compiler with the `tsconfig.json` file in the current directory.
  * `tsc --watch`: Runs the compiler in watch mode. It will recompile your code automatically whenever you save a file. This is what you'll use most of the time during development.
  * `tsc --noEmit`: A useful flag for checking your code for type errors without generating any output files. This is great for CI/CD pipelines.

Mastering the `tsconfig.json` is a vital skill. It's the central nervous system of your TypeScript project, and a well-configured file can save you countless hours of debugging and refactoring down the line.

### Type Declaration Files (`.d.ts`)

A key concept is the **type declaration file**, which has a `.d.ts` extension. These files contain only type information and no implementation code. They are essential for two main reasons:

  * **Type-checking JavaScript Libraries**: When you use a JavaScript library that doesn't have a `.d.ts` file, TypeScript can't provide type-checking or autocompletion. The community-driven **DefinitelyTyped** project provides a vast repository of `.d.ts` files for popular JS libraries, which you can install with `@types/` packages (e.g., `npm install @types/react`).
  * **Declaring an API**: When you publish your own TypeScript library, you compile your `.ts` files to `.js` and generate corresponding `.d.ts` files. This allows other TypeScript users to get full type-checking and editor support for your library.

-----

### Module Resolution 📦

This is the process by which TypeScript resolves an `import` statement to a file on disk. The `tsconfig.json` file's `moduleResolution` option is critical here.

  * `"node"`: The traditional method, which mimics how Node.js resolves `require()` statements. It's still the default and widely used.
  * `"node16"`/`"nodenext"`: These are more modern strategies that align with Node.js's native ESM (ECMAScript Module) resolution rules, which are stricter and require file extensions. This is the future for Node.js development.
  * `"bundler"`: This option is designed for use with modern bundlers like Vite, Webpack, or Rollup. It understands their more flexible import resolution logic, including `package.json`'s `exports` and `imports` fields.

Knowing which one to use is crucial for avoiding frustrating "Cannot find module" errors. For most modern web projects using a bundler, `moduleResolution: "bundler"` is the correct choice.

-----

### Utility Types and Advanced Generics 🛠️

We've covered the basics of utility types like `Partial` and `Pick`, but the full set is incredibly powerful. Here are a few more to have in your toolbox:

  * `Required<T>`: The inverse of `Partial<T>`, it makes all properties of a type `T` required.
  * `Readonly<T>`: Makes all properties of a type `T` read-only.
  * `Exclude<T, U>`: Constructs a type by excluding from `T` all properties that are assignable to `U`. This is useful for filtering union types.
  * `ReturnType<T>`: Extracts the return type of a function type `T`.
  * `Parameters<T>`: Extracts the parameter types of a function type `T` into a tuple.

These are not just for fun; they are the building blocks of other, even more complex types. For example, you can create a type for an API response that only contains the fields required for a specific view by using `Pick`.

-----

### Branded and Opaque Types ✨

This is a more advanced technique to prevent primitive obsession and ensure you're using the correct type in a function. Branded types are a form of "nominal typing" for TypeScript's structural type system.

**Use Case:** You have a `string` that represents a `UserId`, and another `string` that represents a `PostId`. You want to prevent a developer from accidentally passing a `PostId` to a function that expects a `UserId`.

**Code Example:**

```typescript
type Brand<T, U> = T & { __brand: U };
type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;

function getUser(id: UserId) {
  // ...
}

const userId = '123' as UserId;
const postId = 'abc' as PostId;

getUser(userId); // OK
// getUser(postId); // Error! Type 'Brand<string, "PostId">' is not assignable to type 'UserId'.
```

The `__brand` property is a phantom property that only exists at the type level and is erased during compilation, so it has no runtime overhead.

[A horrifically deep dive into TypeScript module resolution](https://www.youtube.com/watch?v=MEl2R7mEAP8) provides a detailed video explanation of how the TypeScript compiler resolves module imports.
http://googleusercontent.com/youtube_content/0

### Design Principles & Advanced Patterns

-----

### 1\. Immutability with `readonly` and `ReadonlyArray`

Immutability is a cornerstone of robust software design. It prevents unintended side effects by ensuring that data structures cannot be modified after they are created. TypeScript provides the tools to enforce this at the type level.

  * **`readonly` modifier**: Can be applied to a property of an interface or class.
  * **`ReadonlyArray<T>`**: A special type for arrays where elements cannot be added, removed, or changed. You can also use the shorthand `readonly T[]`.

**Use Case:** You are designing a function that should not modify its input array. Using a `readonly` array type makes this contract explicit and is enforced by the compiler.

```typescript
function printUsernames(users: readonly string[]) {
  // users.push('Eve'); // Error: Property 'push' does not exist on type 'readonly string[]'
  // users[0] = 'Alice'; // Error: Index signature in type 'readonly string[]' only permits reading.
  for (const user of users) {
    console.log(user);
  }
}

const userList = ['Alice', 'Bob'];
printUsernames(userList); // OK

userList.push('Charlie'); // The original array can still be modified outside the function
```

This is a small change with a huge impact on code safety, especially in large codebases where data can be shared across many functions.

-----

### 2\. Type-Safe Event Emitters and Dependency Injection

In many frameworks, you need a way for different parts of an application to communicate. TypeScript lets you create a fully type-safe event system.

  * **Discriminated Unions**: Define the different types of events that can be emitted.
  * **Generics**: Create a generic type for the event emitter itself, tying event names to their payload types.

**Use Case:** A component needs to emit a "login" or a "logout" event, each with a different payload.

```typescript
type AppEvents = {
  login: { userId: number; token: string; };
  logout: { reason: string; };
  userUpdate: { name: string; email: string; };
};

class EventEmitter<T extends Record<string, any>> {
  private listeners: { [K in keyof T]?: ((payload: T[K]) => void)[] } = {};

  on<K extends keyof T>(eventName: K, listener: (payload: T[K]) => void) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName]?.push(listener);
  }

  emit<K extends keyof T>(eventName: K, payload: T[K]) {
    this.listeners[eventName]?.forEach(listener => listener(payload));
  }
}

const eventBus = new EventEmitter<AppEvents>();

eventBus.on('login', (payload) => {
  // TypeScript knows payload is { userId: number; token: string; }
  console.log(`User ${payload.userId} logged in.`);
});

eventBus.emit('login', { userId: 123, token: 'abc' });
// eventBus.emit('logout', { userId: 456 }); // Error: Property 'userId' does not exist on type '{ reason: string; }'.
```

This pattern, when applied to **Dependency Injection**, ensures that components are injected with the correct, type-safe dependencies.

-----

### 3\. The `this` Parameter and Conditional Types

We've covered `this` typing, but a `this` **parameter** in a function signature is a powerful way to express a function's behavior.

**Use Case:** You have a mixin or utility function that should only be callable on an object that has a certain property or method.

```typescript
interface HasName {
  name: string;
}

// The 'this' parameter asserts that this function can only be called on an object that has the 'name' property.
function getGreeting(this: HasName, message: string): string {
  return `${message}, ${this.name}!`;
}

class User implements HasName {
  constructor(public name: string) {}
  greet(message: string) {
    // This works because `this` inside the method is a User, which has a 'name'
    return getGreeting.call(this, message);
  }
}

const user = new User('Alex');
console.log(user.greet('Hello')); // Output: "Hello, Alex!"

const simpleObject = { name: 'Bob' };
console.log(getGreeting.call(simpleObject, 'Hi')); // Output: "Hi, Bob!"

// const wrongObject = { id: 1 };
// getGreeting.call(wrongObject, 'Hello'); // Error: Type '{ id: number; }' is not assignable to type 'HasName'.
```

This is a more explicit and type-safe alternative to using type guards or checking for properties at runtime.

-----

### 4\. Designing Type-Safe APIs

This is the culmination of many of the features we've discussed. A well-designed API in TypeScript uses the type system to prevent incorrect usage and provide great editor hints.

**Example: A `fetchData` function with varying return types.**

  * **Overloads**: Use overloads to define different signatures for the function.
  * **Generics**: Use a generic to define a type variable for the return type.

<!-- end list -->

```typescript
// Overload Signatures
function fetchData<T>(url: string): Promise<T>;
function fetchData(url: string, asText: true): Promise<string>;
function fetchData(url: string, asBuffer: true): Promise<ArrayBuffer>;

// Implementation (this is where the logic lives)
function fetchData(url: string, asTextOrBuffer?: boolean): any {
  // A simplified example implementation
  return fetch(url).then(res => {
    if (asTextOrBuffer === true) {
      return res.text();
    }
    // Assume if not explicitly requested, it returns JSON
    return res.json();
  });
}

// API Consumer's perspective (perfectly type-safe)
interface User {
  id: number;
  name: string;
}

// Returns Promise<User[]>
const users = fetchData<User[]>('https://api.example.com/users');

// Returns Promise<string>
const html = fetchData('https://example.com', true);
```

With this pattern, the user of your API gets compile-time guarantees about what the function will return, eliminating guesswork and the need for runtime type-checking.

This deeper level of design is where you move from just writing "typed JavaScript" to truly using TypeScript's type system as a powerful design tool. It's an investment that pays off immensely in the long run.

-----

### Type Predicates and Assertions

We've discussed type guards like `typeof` and `in`, but you can create your own with **type predicates**. A function is a type predicate if its return type is a `type is type` expression. This tells the compiler that if the function returns `true`, then the variable is of a more specific type.

**Use Case:** You have a custom function that checks if an object is an instance of a specific interface.

```typescript
interface Animal {
  name: string;
}

interface Dog extends Animal {
  bark(): void;
}

function isDog(animal: Animal): animal is Dog {
  return (animal as Dog).bark !== undefined;
}

const animal: Animal = { name: 'Fido' };

if (isDog(animal)) {
  animal.bark(); // No error because the compiler now knows 'animal' is a 'Dog'
}
```

**Type Assertions** are similar but for a slightly different use case. An `asserts condition` return type on a function tells the compiler that if the function returns without throwing an error, the `condition` must be true for the remainder of the scope.

**Use Case:** You're writing a utility function that validates a parameter and throws an error if it's not valid.

```typescript
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== 'string') {
    throw new Error('Not a string!');
  }
}

function printUpperCase(val: unknown) {
  assertIsString(val);
  // After the assertion, TypeScript knows 'val' is a string.
  console.log(val.toUpperCase()); 
}

printUpperCase('hello'); // OK
// printUpperCase(123); // Throws an error at runtime, but the compiler trusts the assertion.
```

-----

### Literal and Narrowing-Aware Aliases

TypeScript's type inference is incredibly smart. It can often infer the narrowest possible type for a value, but you can also guide it. **Literal types** are not just for strings and numbers; they apply to boolean, enum, and `null` types too.

**Use Case:** You want to ensure an object's properties are treated as literal values, not broader types.

```typescript
const person = {
  name: 'Alex',
  age: 30,
} as const; // This is a 'const' assertion

// The type of `person` is now `{ readonly name: 'Alex'; readonly age: 30; }`

// This is the same as:
type PersonType = typeof person;
```

This is particularly useful when working with configuration objects or state management, where the specific values matter more than their general types.

-----

### `infer` and Mapped Types in Practice

The `infer` keyword isn't just for `ReturnType`. It's a key part of more complex type transformations. You can use it to extract types from other types in a variety of ways.

**Use Case:** You have a function that accepts an array of strings, but you want to create a type for a function that accepts a single string from that array.

```typescript
const colors = ['red', 'green', 'blue'] as const;

// This type extracts the type of a value in an array.
type ArrayElement<T> = T extends (infer E)[] ? E : never;

type Color = ArrayElement<typeof colors>; // type Color = "red" | "green" | "blue"

function printColor(color: Color) {
  console.log(color);
}

printColor('red'); // OK
// printColor('yellow'); // Error
```

This is the power of combining `infer` with conditional types and other utility types to create new types from existing ones. It's a form of **type-level programming**.

-----

### **Nominal vs. Structural Typing** 🏛️

TypeScript is a **structural type system**. This means that two types are considered compatible if they have the same shape, regardless of their name. This is a fundamental difference from **nominal type systems** (like Java or C\#), where two types are only compatible if they have the same name.

**Structural Typing in Action:**

```typescript
interface Point2D {
  x: number;
  y: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

const point2d: Point2D = { x: 1, y: 2 };
const point3d: Point3D = { x: 1, y: 2, z: 3 };

// This is valid in TypeScript! `point3d` is structurally compatible with `Point2D`
const anotherPoint2d: Point2D = point3d; 
```

While this can be convenient, it can also lead to subtle bugs. As we discussed earlier, **branded types** are a way to simulate nominal typing within a structural system to prevent these kinds of errors.

-----

### **The TypeScript Language Server** 🤖

The TypeScript compiler (`tsc`) is more than just a tool for generating `.js` files. It includes a **language server**, which is the component that powers your IDE's features. This is what provides:

  * **Autocompletion**
  * **Go-to-Definition**
  * **Refactoring**
  * **Error Highlighting**

When you type code, your editor sends it to the language server, which analyzes it and sends back responses. This is a separate process that runs in the background, making your development experience fast and seamless. The language server is what allows you to use TypeScript's powerful features without ever running a manual compile step.

-----

### **Compiler API** ⚙️

The TypeScript compiler API allows you to programmatically interact with the compiler itself. You can use it to:

  * **Parse code into an Abstract Syntax Tree (AST)**.
  * **Analyze types and symbols**.
  * **Create custom transpilers or code transformers**.

**Use Case:** A tool that automatically generates documentation from JSDoc comments. You can use the compiler API to parse the source code, find all the functions, and extract their types and comments to build the documentation.

**Example of the Compiler API:**

```typescript
import ts from 'typescript';

const sourceCode = `
  function greet(name: string) {
    console.log("Hello, " + name);
  }
`;

const sourceFile = ts.createSourceFile(
  'temp.ts',
  sourceCode,
  ts.ScriptTarget.ES2015,
  true
);

// This is the starting point for programmatically analyzing the code.
sourceFile.forEachChild(node => {
  if (ts.isFunctionDeclaration(node)) {
    console.log(`Found a function named: ${node.name?.getText()}`);
  }
});
```

This is the foundation for tools like **`ts-morph`** and **`Tsc-alias`**, which build on the compiler API to provide a more convenient way to manipulate code and types.

-----

### **`lib.d.ts` and Declaration Merging** 🧩

The global types you use every day (`Array`, `string`, `HTMLElement`, etc.) come from the **`lib.d.ts`** files. These files are part of the TypeScript installation and contain the type declarations for the JavaScript standard library and the DOM APIs.

**Declaration Merging** allows you to add new members to existing global types. This is most famously used when working with libraries that augment the global scope.

**Use Case:** You are building a library that adds a new method to the `Array` prototype. You can use declaration merging to add the type for this new method to the global `Array` interface.

```typescript
// global.d.ts
declare global {
  interface Array<T> {
    myCustomMethod(): T[];
  }
}

// Now you can call this method anywhere, and TypeScript will recognize it.
const arr = [1, 2, 3];
const result = arr.myCustomMethod(); // OK
```

This is a powerful but potentially dangerous feature, so it should be used with great care to avoid polluting the global namespace.

-----

### **Recursive Conditional Types** 🔄

This is the foundation of many advanced type manipulations. By combining conditional types with recursion, you can create types that operate on a sequence, much like a `for` or `while` loop at runtime.

**Use Case:** You want to create a type that removes the first element from a tuple type.

```typescript
type Tail<T extends any[]> = 
  T extends [any, ...infer Rest] ? Rest : never;

// Example
type Numbers = [1, 2, 3, 4];
type WithoutFirst = Tail<Numbers>; // type WithoutFirst = [2, 3, 4]
```

This is a simple recursive type. The `extends [any, ...infer Rest]` part checks if the tuple `T` has at least one element. If it does, it infers the rest of the tuple into the `Rest` type variable.

You can combine this with `Head` and other types to create a full suite of type-level array operations.

-----

### **Type-Level Union to Tuple Conversions** 🧩

This is a classic "hard problem" in the TypeScript type system. It involves converting a union type (like `'a' | 'b' | 'c'`) into a tuple type (like `['a', 'b', 'c']`). The order of the elements in the resulting tuple is not guaranteed, but this technique is crucial for some advanced patterns.

**Use Case:** You have a union of route names and you want to generate a tuple of all possible routes for type-safe routing.

```typescript
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type LastOf<T> =
  UnionToIntersection<T extends any ? () => T : never> extends () => (infer R) ? R : never;

type Push<T extends any[], V> = [...T, V];

type UnionToTuple<T, L = LastOf<T>> =
  [T] extends [never] ? [] : Push<UnionToTuple<Exclude<T, L>>, L>;

// Example
type Fruit = 'apple' | 'banana' | 'orange';
type FruitTuple = UnionToTuple<Fruit>; 
// type FruitTuple = ["apple", "banana", "orange"] (order may vary)
```

This looks complex because it is. It's a prime example of leveraging the more obscure rules of the type system to perform a complex transformation.

-----

### **`in` and `keyof` with Mapped Types for Filtering** 🧹

We've seen `keyof` and mapped types, but they can be combined to filter properties from an existing type based on a condition. This is how you implement types like `Pick` and `Omit` from scratch.

**Use Case:** You want to create a new type that only includes the string properties from another type.

```typescript
type FilterStringProps<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface User {
  id: number;
  name: string;
  email: string;
  isLoggedIn: boolean;
}

type StringProps = FilterStringProps<User>;
// type StringProps = {
//   name: string;
//   email: string;
// }
```

The `as` keyword in the mapped type is a **key remapping** feature. The `T[K] extends string ? K : never` is a conditional type that checks if the property value is a string. If it is, it keeps the key (`K`); otherwise, it re-maps it to `never`, effectively removing it from the resulting type.

-----

### **The `--declaration` and `--declarationMap` Flags** 🗺️

When building a library, you need to generate `.d.ts` files. The `--declaration` flag does this for you automatically. But what about debugging those `.d.ts` files? That's where `--declarationMap` comes in.

  * `--declarationMap`: Generates a `.d.ts.map` file alongside each `.d.ts` file. This map file contains a link back to the original `.ts` source file. This allows you to "Go to Definition" on a type in a library and land on the original source code, not just the `.d.ts` file.

This is an essential flag for making your library's developer experience excellent for other TypeScript users.

At this level, you're not just a consumer of types; you're a **type architect**. You are using the language's own rules to solve problems at compile time, leading to more robust and less error-prone code. This is the ultimate power of TypeScript.
