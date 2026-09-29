# 📘 TypeScript Complete Guide for JavaScript Developers

![TypeScript cheat sheet](Gemini_Generated_Image_tsn2rktsn2rktsn2.png)

> TypeScript = JavaScript + Types + Modern tooling + Safety + Scalability.
> Think of it as **JavaScript with a superpower suit**.

---

## 1. **Getting Started**

### Install & Run

```bash
# Install globally
npm install -g typescript

# Init tsconfig.json
tsc --init

# Compile
tsc index.ts
node index.js
```

Or run `.ts` files directly:

```bash
npx tsx index.ts   # tsx (esbuild-based), no type-check
node index.ts      # Node.js 22.18+ / 23.6+ strips erasable types natively
```

---

## 2. **Basic Types**

### Primitives

```ts
let isDone: boolean = true;
let age: number = 25;
let firstName: string = "Alice";

// Template strings
let message: string = `Hello, my name is ${firstName}`;
```

### Special Types

```ts
let notSure: any = 4;       // Avoid `any`, kills type safety
let nothing: null = null;
let u: undefined = undefined;
let v: void = undefined;    // usually for function return
let id: unknown = "test";   // safer alternative to any
```

### Never

```ts
function error(message: string): never {
  throw new Error(message);
}
```

---

## 3. **Arrays and Tuples**

```ts
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ["Alice", "Bob"];

// Tuples
let tuple: [string, number] = ["Age", 30];
tuple.push(40); // TS won’t prevent push, but careful!
```

---

## 4. **Enums**

```ts
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}

enum StatusCode {
  Success = 200,
  NotFound = 404,
  ServerError = 500
}

let response: StatusCode = StatusCode.Success;
```

⚡ **Tip**: `const enum` inlines values but breaks under `isolatedModules` (Vite, esbuild, Babel, Node type stripping). Many codebases prefer a union of literals or an `as const` object instead:

```ts
const Direction = { Up: "UP", Down: "DOWN" } as const;
type Direction = (typeof Direction)[keyof typeof Direction]; // "UP" | "DOWN"
```

---

## 5. **Type Aliases & Interfaces**

```ts
type Point = { x: number; y: number };
interface Person { name: string; age: number }

const john: Person = { name: "John", age: 30 };
```

👉 Difference:

* `type` can represent **primitives, unions, intersections, function signatures**.
* `interface` is extendable and great for **OOP patterns**.

---

## 6. **Union & Intersection Types**

```ts
type ID = string | number;
let userId: ID = "abc";

type Employee = { name: string } & { salary: number };
let emp: Employee = { name: "John", salary: 5000 };
```

---

## 7. **Functions**

### With Types

```ts
function add(a: number, b: number): number {
  return a + b;
}

const greet = (name: string): string => `Hello, ${name}`;
```

### Optional & Default Params

```ts
function log(message: string, userId?: string) {
  console.log(message, userId ?? "Anonymous");
}

function pow(base: number, exp: number = 2): number {
  return base ** exp;
}
```

### Rest Params

```ts
function sum(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}
```

---

## 8. **Objects & Type Inference**

```ts
let car = { brand: "Tesla", year: 2024 };
car.brand = "BMW"; // inferred as string
```

---

## 9. **Classes**

```ts
class Animal {
  constructor(public name: string) {}
  move(distance: number): void {
    console.log(`${this.name} moved ${distance}m`);
  }
}

class Dog extends Animal {
  bark() { console.log("Woof!"); }
}

const dog = new Dog("Buddy");
dog.bark();
dog.move(10);
```

### Access Modifiers

* `public` (default) – accessible everywhere
* `private` – only inside class
* `protected` – class + subclasses
* `readonly` – immutable after init

```ts
class User {
  private password: string;
  constructor(public username: string, password: string) {
    this.password = password;
  }
}
```

---

## 10. **Abstract Classes & Interfaces**

```ts
abstract class Shape {
  abstract area(): number;
}

class Circle extends Shape {
  constructor(public radius: number) { super(); }
  area() { return Math.PI * this.radius ** 2; }
}

interface Flyable {
  fly(): void;
}

class Bird implements Flyable {
  fly() { console.log("Flying..."); }
}
```

---

## 11. **Generics**

```ts
function identity<T>(value: T): T {
  return value;
}

let num = identity<number>(42);
let str = identity("hello"); // type inferred
```

### Generic Interfaces & Classes

```ts
interface Box<T> {
  value: T;
}

class Stack<T> {
  private items: T[] = [];
  push(item: T) { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
}
```

### Constraints

```ts
function logLength<T extends { length: number }>(item: T): void {
  console.log(item.length);
}
logLength("Hello");
```

---

## 12. **Utility Types**

```ts
type Person = { name: string; age: number; email?: string };

type ReadOnlyPerson = Readonly<Person>;
type PartialPerson = Partial<Person>;
type RequiredPerson = Required<Person>;
type PickPerson = Pick<Person, "name" | "email">;
type OmitPerson = Omit<Person, "age">;
```

---

## 13. **Advanced Types**

### Type Guards

```ts
function isString(value: unknown): value is string {
  return typeof value === "string";
}

let val: unknown = "hello";
if (isString(val)) {
  console.log(val.toUpperCase());
}
```

### Discriminated Unions

```ts
type Circle = { kind: "circle"; radius: number };
type Square = { kind: "square"; side: number };
type Shape = Circle | Square;

function area(shape: Shape) {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.side ** 2;
  }
}
```

---

## 14. **Modules & Namespaces**

### ES Modules

```ts
// math.ts
export function add(a: number, b: number) { return a + b; }
export const PI = 3.14;

// index.ts
import { add, PI } from "./math";
console.log(add(2, 3), PI);
```

### Namespaces (rarely used)

```ts
namespace Utils {
  export function log(msg: string) { console.log(msg); }
}
Utils.log("Hello");
```

---

## 15. **Decorators**

```ts
function Logger(constructor: Function) {
  console.log(`Class created: ${constructor.name}`);
}

@Logger
class MyService {}
```

⚡ TypeScript 5.0+ supports standard (TC39) decorators with no flag; their signature is `(value, context)`. Frameworks like **NestJS** and **Angular** still use legacy decorators via `"experimentalDecorators": true`. The one-argument `Logger` above works with both.

---

## 16. **Tips & Tricks**

* Use **strict mode** in `tsconfig.json` → safer types.
* Prefer `unknown` over `any`.
* Use `as const` for literal narrowing:

  ```ts
  let directions = ["up", "down"] as const;
  type Direction = typeof directions[number]; // "up" | "down"
  ```
* Use `satisfies` operator for type-safe objects:

  ```ts
  const settings = {
    theme: "dark",
    version: 1
  } satisfies { theme: "dark" | "light"; version: number };
  ```

---

# 📘 TypeScript Deep Dive (Part 2)

---

## 17. **Mapped Types**

Mapped types let you transform existing types.

```ts
type Person = {
  name: string;
  age: number;
  email?: string;
};

// Make all properties optional
type PartialPerson = {
  [K in keyof Person]?: Person[K];
};

// Equivalent to:
type Partial<T> = { [K in keyof T]?: T[K] };
```

Useful with generics:

```ts
type Nullable<T> = { [K in keyof T]: T[K] | null };

type NullablePerson = Nullable<Person>;
```

---

## 18. **Conditional Types**

Conditional logic at type level.

```ts
type IsString<T> = T extends string ? "yes" : "no";

type A = IsString<string>; // "yes"
type B = IsString<number>; // "no"
```

### Use Case: Extracting Types

```ts
type ElementType<T> = T extends (infer U)[] ? U : T;

type Str = ElementType<string[]>; // string
type Num = ElementType<number>;   // number
```

---

## 19. **Infer Keyword**

`infer` captures a type inside conditionals.

```ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function greet(name: string) { return `Hello ${name}`; }
type GreetReturn = ReturnType<typeof greet>; // string
```

---

## 20. **Template Literal Types**

```ts
type Event = "click" | "scroll" | "mousemove";
type EventHandler = `on${Capitalize<Event>}`;

const handler: EventHandler = "onClick";
```

👉 Useful for building **string-based APIs** safely.

---

## 21. **Keyof & Lookup Types**

```ts
type Person = { name: string; age: number };

type Keys = keyof Person;   // "name" | "age"
type NameType = Person["name"]; // string
```

⚡ Use for generic function constraints:

```ts
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const p = { name: "John", age: 30 };
let name = getValue(p, "name"); // string
```

---

## 22. **Index Signatures**

```ts
interface Dictionary {
  [key: string]: string;
}

let translations: Dictionary = {
  hello: "Hola",
  goodbye: "Adiós"
};
```

---

## 23. **Type Narrowing (Control Flow)**

TypeScript narrows types using control flow:

```ts
function printId(id: string | number) {
  if (typeof id === "string") {
    console.log(id.toUpperCase());
  } else {
    console.log(id.toFixed(2));
  }
}
```

---

## 24. **Advanced Utility Types**

* `Record<K, T>` – object with fixed keys
* `NonNullable<T>` – remove null/undefined
* `Extract<T, U>` – keep union members of `T` assignable to `U`
* `Exclude<T, U>` – remove union members of `T` assignable to `U`

```ts
type Roles = "admin" | "user" | "guest";

type RolePermissions = Record<Roles, string[]>;
// { admin: string[], user: string[], guest: string[] }

type NotNull = NonNullable<string | null | undefined>; // string
```

---

## 25. **Type Assertion & Casting**

```ts
let input = document.querySelector("input") as HTMLInputElement;
input.value = "Hello";

// Non-null assertion
let btn = document.getElementById("btn")!;
btn.innerHTML = "Click";
```

⚠️ Use cautiously, type assertions **override safety**.

---

## 26. **Readonly vs Const**

```ts
type Config = {
  readonly port: number;
};

const config: Config = { port: 3000 };
// config.port = 4000 ❌ error
```

`readonly` applies at type level,
`const` applies at variable binding.

---

## 27. **Function Overloads**

```ts
function reverse(s: string): string;
function reverse<T>(arr: T[]): T[];
function reverse(value: any): any {
  if (typeof value === "string") return value.split("").reverse().join("");
  return value.slice().reverse();
}

reverse("hello"); // "olleh"
reverse([1, 2, 3]); // [3,2,1]
```

---

## 28. **Asynchronous Code in TS**

```ts
async function fetchData(url: string): Promise<string> {
  const res = await fetch(url);
  return res.text();
}
```

Type inference works with `Promise<T>`.

---

## 29. **Declaration Merging**

TypeScript merges multiple declarations with the same name.

```ts
interface User {
  id: number;
}
interface User {
  name: string;
}

const u: User = { id: 1, name: "Alice" };
```

---

## 30. **Ambient Declarations (d.ts)**

For third-party JS libraries without types:

```ts
// globals.d.ts
declare module "legacy-lib" {
  export function legacyFn(x: string): void;
}
```

Or global vars:

```ts
declare const APP_VERSION: string;
```

---

## 31. **tsconfig.json Tips**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

* `strict` = MUST HAVE ✅
* `skipLibCheck` improves build time
* `esModuleInterop` allows `import express from "express"`

---

## 32. **Design Patterns in TS**

### Singleton

```ts
class Singleton {
  private static instance: Singleton;
  private constructor() {}
  static getInstance() {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}
```

### Factory

```ts
interface Shape { draw(): void; }
class Circle implements Shape { draw() { console.log("Circle"); } }
class Square implements Shape { draw() { console.log("Square"); } }

class ShapeFactory {
  static create(type: "circle" | "square"): Shape {
    if (type === "circle") return new Circle();
    return new Square();
  }
}
```

---

## 33. **When to Use Type vs Interface**

* Use **interface** for **objects/classes** (extendable, OOP-style).
* Use **type** for **union, intersection, primitives, mapped types**.

Example:

```ts
interface A { x: number }
interface B extends A { y: number }

type Shape = Circle | Square; // union = must use type
```

---

## 34. **Practical Tips from Experience**

* Always enable **strict mode**
* Use **type guards** for runtime safety
* Prefer **composition** of types (`&`) over massive interfaces
* Use `unknown` instead of `any` for safer APIs
* Split types into `types.ts` for **cleaner architecture**
* Use `satisfies` to validate configs at compile-time

```ts
const config = {
  env: "production",
  retries: 3
} satisfies { env: "production" | "dev"; retries: number };
```

---

# 📘 TypeScript Deep Dive (Part 3 – Real-World Applications)

---

## 35. **TypeScript in Functions & APIs**

### Example: Strongly Typed API Response

```ts
// Define a reusable API response type
type ApiResponse<T> = {
  status: number;
  data: T;
  error?: string;
};

// User type
interface User {
  id: number;
  name: string;
  email: string;
}

// Example API function
async function fetchUser(id: number): Promise<ApiResponse<User>> {
  try {
    const res = await fetch(`/api/users/${id}`);
    // fetch does not throw on 4xx/5xx, so check res.ok in real code.
    // res.json() returns any: this annotation is trust, not validation.
    const data: User = await res.json();
    return { status: res.status, data };
  } catch (err) {
    return { status: 500, data: {} as User, error: "Failed to fetch" };
  }
}
```

---

## 36. **TypeScript in Objects**

```ts
type Product = {
  id: number;
  name: string;
  price: number;
  discount?: number;
};

// Utility function
function calculateFinalPrice(p: Product): number {
  return p.price - (p.discount ?? 0);
}

const book: Product = { id: 1, name: "TS Guide", price: 100, discount: 10 };
console.log(calculateFinalPrice(book)); // 90
```

---

## 37. **TypeScript in Classes (OOP Example)**

```ts
abstract class Vehicle {
  constructor(public brand: string, public speed: number) {}
  abstract move(): void;
}

class Car extends Vehicle {
  move() { console.log(`${this.brand} drives at ${this.speed} km/h`); }
}

class Bike extends Vehicle {
  move() { console.log(`${this.brand} cycles at ${this.speed} km/h`); }
}

const bmw = new Car("BMW", 200);
const trek = new Bike("Trek", 30);

bmw.move();
trek.move();
```

---

## 38. **Express.js + TypeScript (Backend Example)**

```ts
import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

interface User {
  id: number;
  name: string;
}

let users: User[] = [{ id: 1, name: "Alice" }];

app.get("/users", (req: Request, res: Response<User[]>) => {
  res.json(users);
});

app.post("/users", (req: Request<{}, {}, User>, res: Response<User>) => {
  const newUser = req.body;
  users.push(newUser);
  res.status(201).json(newUser);
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

👉 Here, TypeScript ensures:

* Request & Response types are **strongly typed**
* No wrong object structure is sent back

---

## 39. **React + TypeScript (Frontend Example)**

### Props & State

```tsx
import { useState } from "react";

type CounterProps = { initial?: number };

export default function Counter({ initial = 0 }: CounterProps) {
  const [count, setCount] = useState<number>(initial);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

---

### Context API

```tsx
import React, { createContext, useContext } from "react";

interface AuthContextType {
  user: string | null;
  login: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<string | null>(null);

  return (
    <AuthContext.Provider value={{ user, login: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
```

---

## 40. **TypeScript + Database (Prisma ORM Example)**

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: { name: "Alice", email: "alice@example.com" },
  });
  console.log(user);
}

main().catch(console.error);
```

⚡ Prisma auto-generates **TypeScript types** from schema.

---

## 41. **Advanced Patterns in Real Projects**

### 1. **Discriminated Unions for API Responses**

```ts
type Success<T> = { status: "success"; data: T };
type Failure = { status: "error"; message: string };
type ApiResult<T> = Success<T> | Failure;

function handleResult<T>(res: ApiResult<T>) {
  if (res.status === "success") console.log(res.data);
  else console.error(res.message);
}
```

### 2. **Generics in Repositories**

```ts
interface Repository<T> {
  getAll(): T[];
  getById(id: number): T | undefined;
}

class MemoryRepo<T extends { id: number }> implements Repository<T> {
  private items: T[] = [];
  getAll() { return this.items; }
  getById(id: number) { return this.items.find(i => i.id === id); }
}
```

---

## 42. **Error Handling with Type Safety**

```ts
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function parseJSON<T>(input: string): Result<T> {
  try {
    return { ok: true, value: JSON.parse(input) as T };
  } catch (err) {
    return { ok: false, error: "Invalid JSON" };
  }
}

const res = parseJSON<{ name: string }>('{"name":"Alice"}');
if (res.ok) console.log(res.value.name);
```

---

## 43. **TypeScript with Testing (Jest Example)**

```ts
function add(a: number, b: number): number {
  return a + b;
}

test("add works", () => {
  expect(add(2, 3)).toBe(5);
});
```

TypeScript ensures only valid input is tested.

---

## 44. **Tips for Large-Scale Projects**

* Split types into `types/` folder (`User.ts`, `Api.ts`, etc.)
* Use `index.ts` to re-export modules cleanly
* Use `tsc --noEmit` in CI to **type-check only**
* Combine `eslint + prettier + tsconfig` for consistency
* Use **path aliases** (`@/utils`, `@/types`) in `tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

# 📘 TypeScript Deep Dive (Part 4 – Advanced Type System)

---

## 45. **Interfaces vs Type Aliases (Deeper Dive)**

This is a common point of confusion for JavaScript developers moving to TypeScript. Here's a more detailed breakdown:

| Feature | Interface | Type Alias |
|---|---|---|
| **Declaration** | `interface User { ... }` | `type User = { ... };` |
| **Extending** | Can be extended by other interfaces using `extends`. | Can be extended by other type aliases using `&` (intersection). |
| **Implementing** | A class can `implement` an interface. | A class can `implement` an object-shaped type alias, but not a union type. |
| **Declaration Merging** | Can be declared multiple times, and their members will be merged. | Cannot be declared multiple times. |
| **Primitives & Unions** | **Cannot** be used for primitive types, union types, or tuples. | **Can** be used for all of these. |

**Use Case Examples:**

  * **When to use `interface`**:
      * Defining the shape of an object that will be used as a contract for a class.
      * When you might need to extend the type later via declaration merging (e.g., for library augmentation).
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
        ```typescript
    type ID = string | number;
    type Point = [number, number];
    type Result = 'success' | 'failure';
    ```

**Recommendation:** For defining object shapes, a good rule of thumb is to use **interfaces** unless you need a specific feature that only type aliases provide (like unions or mapped types).

---

## 46. **The `never` Type and Exhaustive Checks**

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

---

## 47. **Polymorphic `this`**

The `this` type refers to the type of the instance of the class it is in. It's a placeholder type that resolves to the concrete subclass type at each call site (types are erased at runtime).

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

---

## 48. **Recursive Types**

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

---

## 49. **The `in` Operator for Narrowing**

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

---

## 50. **`void` vs `undefined`**

This is a subtle but important distinction.

  * **`void`**: The return type of a function that does not have a `return` statement, or a `return` statement with no value. It means the function's return value should be ignored.
  * **`undefined`**: The type of the value `undefined`. A function can explicitly return `undefined`.

**Use Case:** The most significant difference is in callbacks. A function type that returns `void` accepts functions that return anything (`() => string` is assignable to `() => void`); the result is just ignored. A function type that returns `undefined` only accepts functions that return `undefined`.

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

---

## 51. **tsconfig.json Explained**

The `tsconfig.json` file is a configuration file for the TypeScript compiler (`tsc`). It's at the heart of any TypeScript project and provides a way to:

  * Specify root files and the output directory.
  * Control the strictness of type-checking.
  * Configure how modules are resolved.
  * Enable or disable experimental features.
  * Set up a project's type definitions.

Here are some of the most important options you'll encounter:

---

### Strictness Flags 🚩

These are your primary tools for ensuring code quality. Enabling them forces you to write safer, more robust code.

  * `"strict": true`: This is the master switch. It enables a set of other strictness flags. For a new project, you should **always** start with this.
  * `"noImplicitAny": true`: Throws an error whenever a variable is inferred to have the `any` type, but an explicit type isn't provided. This forces you to be deliberate about using `any` and to type your code properly.
  * `"strictNullChecks": true`: My personal favorite. This flag means that `null` and `undefined` are no longer valid values for any type unless you explicitly allow them with a union type (e.g., `string | null`). This eliminates a vast number of runtime errors.
  * `"strictFunctionTypes": true`: Checks that function parameters are compatible in a more rigorous way, preventing subtle bugs with function assignments.
  * `"strictBindCallApply": true`: Ensures that the `bind`, `call`, and `apply` methods of functions are used correctly with their arguments.

---

### Module & Target Flags 🎯

These flags are essential for making TypeScript work with modern JavaScript ecosystems.

  * `"target": "es2020"`: This specifies the ECMAScript version that the code will be compiled to. A modern target like `"es2020"` or `"esnext"` allows the compiler to output less code, as it can rely on more recent language features that are already supported by runtimes.
  * `"module": "esnext"`: This defines the module system to use in the compiled output. `"esnext"` is a good choice for modern applications, as it uses ES Modules, which are standard for web development and supported by tools like Webpack and Vite.
  * `"esModuleInterop": true`: This is a crucial compatibility flag. It helps with interoperability between ES modules and CommonJS modules, particularly when you're importing a CommonJS module into an ES module project.
  * `"resolveJsonModule": true`: Allows you to import JSON files directly into your TypeScript code, treating them as modules with a default export.

---

### Path & File Inclusion 📂

These options control which files the compiler processes.

  * `"include": ["src/**/*"]`: An array of glob patterns that tells the compiler which files to include in the compilation. This is the most common way to define your source files.
  * `"exclude": ["node_modules", "dist"]`: An array of glob patterns for files that should be excluded from the compilation. `node_modules` is almost always excluded for performance reasons.
  * `"outDir": "dist"`: Specifies the output directory for the compiled JavaScript files. This keeps your source code and compiled code separate.
  * `"paths"`: Creates module aliases for cleaner imports (for example `@/*` → `./src/*`). The bundler or runtime must be configured with the same aliases.

---

### Example `tsconfig.json`

Here's a well-configured `tsconfig.json` for a modern web project:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true,
    "paths": {
      "@utils/*": ["./src/utils/*"],
      "@components/*": ["./src/components/*"]
    }
  },
  "include": ["src"]
}
```

This fits a bundled web app (Vite, Next.js): the bundler emits JavaScript, so `tsc` only type-checks (`noEmit`). `paths` no longer needs `baseUrl` (TypeScript 4.1+); `baseUrl` is deprecated in TypeScript 6.

---

## 52. **The `tsc` CLI and Declaration Files**

While the `tsconfig.json` file handles all the configuration, you'll still interact with the TypeScript compiler via the Command Line Interface (CLI).

  * `tsc`: Runs the compiler with the `tsconfig.json` file in the current directory.
  * `tsc --watch`: Runs the compiler in watch mode. It will recompile your code automatically whenever you save a file. This is what you'll use most of the time during development.
  * `tsc --noEmit`: A useful flag for checking your code for type errors without generating any output files. This is great for CI/CD pipelines.

Mastering the `tsconfig.json` is a vital skill. It's the central nervous system of your TypeScript project, and a well-configured file can save you countless hours of debugging and refactoring down the line.

### Type Declaration Files (`.d.ts`)

A key concept is the **type declaration file**, which has a `.d.ts` extension. These files contain only type information and no implementation code. They are essential for two main reasons:

  * **Type-checking JavaScript Libraries**: When you use a JavaScript library that doesn't have a `.d.ts` file, TypeScript can't provide type-checking or autocompletion. The community-driven **DefinitelyTyped** project provides a vast repository of `.d.ts` files for popular JS libraries, which you can install with `@types/` packages (e.g., `npm install @types/react`).
  * **Declaring an API**: When you publish your own TypeScript library, you compile your `.ts` files to `.js` and generate corresponding `.d.ts` files. This allows other TypeScript users to get full type-checking and editor support for your library.

---

### Module Resolution 📦

This is the process by which TypeScript resolves an `import` statement to a file on disk. The `tsconfig.json` file's `moduleResolution` option is critical here.

  * `"node10"` (formerly `"node"`): The legacy method, which mimics how Node.js resolves CommonJS `require()` calls. It ignores `package.json` `exports`; avoid it for new projects.
  * `"node16"`/`"nodenext"`: These are more modern strategies that align with Node.js's native ESM (ECMAScript Module) resolution rules, which are stricter and require file extensions. This is the future for Node.js development.
  * `"bundler"`: This option is designed for use with modern bundlers like Vite, Webpack, or Rollup. It understands their more flexible import resolution logic, including `package.json`'s `exports` and `imports` fields.

Knowing which one to use is crucial for avoiding frustrating "Cannot find module" errors. For most modern web projects using a bundler, `moduleResolution: "bundler"` is the correct choice.

---

## 53. **More Utility Types**

We've covered the basics of utility types like `Partial` and `Pick`, but the full set is incredibly powerful. Here are a few more to have in your toolbox:

  * `Required<T>`: The inverse of `Partial<T>`, it makes all properties of a type `T` required.
  * `Readonly<T>`: Makes all properties of a type `T` read-only.
  * `Exclude<T, U>`: Constructs a type by excluding from the union `T` all members that are assignable to `U`.
  * `Extract<T, U>`: The opposite: keeps only the members of `T` assignable to `U`.
  * `NonNullable<T>`: Removes `null` and `undefined`.
  * `Awaited<T>`: Unwraps a `Promise` type recursively (`Awaited<Promise<Promise<number>>>` is `number`).
  * `ReturnType<T>`: Extracts the return type of a function type `T`.
  * `Parameters<T>`: Extracts the parameter types of a function type `T` into a tuple.

These are not just for fun; they are the building blocks of other, even more complex types. For example, you can create a type for an API response that only contains the fields required for a specific view by using `Pick`.

---

## 54. **Branded (Nominal) Types**

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

---

## 55. **Immutability with `readonly` Arrays**

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

---

## 56. **Type-Safe Event Emitter**

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

---

## 57. **The `this` Parameter**

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

---

## 58. **Designing Type-Safe APIs with Overloads**

This is the culmination of many of the features we've discussed. A well-designed API in TypeScript uses the type system to prevent incorrect usage and provide great editor hints.

**Example: A `fetchData` function with varying return types.**

  * **Overloads**: Use overloads to define different signatures for the function.
  * **Generics**: Use a generic to define a type variable for the return type.

```typescript
// Overload Signatures (a literal parameter picks the return type)
function fetchData<T>(url: string): Promise<T>;
function fetchData(url: string, as: 'text'): Promise<string>;
function fetchData(url: string, as: 'buffer'): Promise<ArrayBuffer>;

// Implementation (not visible to callers)
async function fetchData(url: string, as?: 'text' | 'buffer'): Promise<unknown> {
  const res = await fetch(url);
  if (as === 'text') return res.text();
  if (as === 'buffer') return res.arrayBuffer();
  return res.json(); // Default: JSON (unvalidated, so T is a promise, not a guarantee)
}

// API Consumer's perspective (perfectly type-safe)
interface User {
  id: number;
  name: string;
}

// Returns Promise<User[]>
const users = fetchData<User[]>('https://api.example.com/users');

// Returns Promise<string>
const html = fetchData('https://example.com', 'text');
```

With this pattern, the user of your API gets compile-time guarantees about what the function will return, eliminating guesswork and the need for runtime type-checking.

This deeper level of design is where you move from just writing "typed JavaScript" to truly using TypeScript's type system as a powerful design tool. It's an investment that pays off immensely in the long run.

---

## 59. **Type Predicates and Assertion Functions**

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

**Assertion functions** are similar but for a slightly different use case. An `asserts condition` return type on a function tells the compiler that if the function returns without throwing an error, the `condition` must be true for the remainder of the scope.

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

---

## 60. **`infer` in Practice**

The `infer` keyword isn't just for `ReturnType`. It's a key part of more complex type transformations. You can use it to extract types from other types in a variety of ways.

**Use Case:** You have a function that accepts an array of strings, but you want to create a type for a function that accepts a single string from that array.

```typescript
const colors = ['red', 'green', 'blue'] as const;

// This type extracts the type of a value in an array.
type ArrayElement<T> = T extends readonly (infer E)[] ? E : never; // `readonly` so `as const` tuples match

type Color = ArrayElement<typeof colors>; // type Color = "red" | "green" | "blue"

function printColor(color: Color) {
  console.log(color);
}

printColor('red'); // OK
// printColor('yellow'); // Error
```

This is the power of combining `infer` with conditional types and other utility types to create new types from existing ones. It's a form of **type-level programming**.

---

## 61. **Structural vs Nominal Typing**

TypeScript is a **structural type system**. This means that two types are considered compatible if they have the same shape, regardless of their name. This is a fundamental difference from **nominal type systems** (like Java or C#), where two types are only compatible if they have the same name.

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

---

## 62. **Compiler API**

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

This is the foundation for tools like **`ts-morph`** and **`typescript-eslint`**, which build on the compiler API to provide a more convenient way to analyze and manipulate code and types.

---

## 63. **`lib.d.ts` and Global Augmentation**

The global types you use every day (`Array`, `string`, `HTMLElement`, etc.) come from the **`lib.d.ts`** files. These files are part of the TypeScript installation and contain the type declarations for the JavaScript standard library and the DOM APIs.

**Declaration Merging** allows you to add new members to existing global types. This is most famously used when working with libraries that augment the global scope.

**Use Case:** You are building a library that adds a new method to the `Array` prototype. You can use declaration merging to add the type for this new method to the global `Array` interface.

```typescript
// global.d.ts
export {}; // `declare global` is only allowed in a module

declare global {
  interface Array<T> {
    myCustomMethod(): T[];
  }
}

// app.ts: TypeScript now recognizes the method.
// It still needs a runtime implementation on Array.prototype.
const arr = [1, 2, 3];
const result = arr.myCustomMethod(); // OK
```

This is a powerful but potentially dangerous feature, so it should be used with great care to avoid polluting the global namespace.

---

## 64. **Recursive Conditional Types**

This is the foundation of many advanced type manipulations. By combining conditional types with recursion, you can create types that operate on a sequence, much like a `for` or `while` loop at runtime.

**Use Case:** You want to create a type that removes the first element from a tuple type.

```typescript
type Tail<T extends any[]> = 
  T extends [any, ...infer Rest] ? Rest : never;

// Example
type Numbers = [1, 2, 3, 4];
type WithoutFirst = Tail<Numbers>; // type WithoutFirst = [2, 3, 4]
```

`Tail` itself is not recursive: `extends [any, ...infer Rest]` checks that the tuple has at least one element and infers the rest into `Rest`. Recursion comes from a type referring to itself in a branch:

```typescript
type Reverse<T extends unknown[]> =
  T extends [infer Head, ...infer Rest] ? [...Reverse<Rest>, Head] : [];

type Reversed = Reverse<[1, 2, 3]>; // [3, 2, 1]
```

---

## 65. **Union to Tuple (Type-Level Trick)**

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

Union order is a compiler implementation detail, so avoid relying on this in production types.

This looks complex because it is. It's a prime example of leveraging the more obscure rules of the type system to perform a complex transformation.

---

## 66. **Filtering Keys with Key Remapping**

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

---

## 67. **`declaration` and `declarationMap`**

When building a library, you need to generate `.d.ts` files. The `--declaration` flag does this for you automatically. But what about debugging those `.d.ts` files? That's where `--declarationMap` comes in.

  * `--declaration`: Emits a `.d.ts` file next to each compiled `.js` file.
  * `--declarationMap`: Generates a `.d.ts.map` file alongside each `.d.ts` file. This map file contains a link back to the original `.ts` source file. This allows you to "Go to Definition" on a type in a library and land on the original source code, not just the `.d.ts` file.

This is an essential flag for making your library's developer experience excellent for other TypeScript users.

---

# 🎯 Final Thoughts

TypeScript isn’t just “typed JavaScript.”
It’s **a design-time safety net, a documentation tool, and a scalability enabler.**

* Functions → safer & predictable
* Objects & Classes → clean architecture
* Advanced Types → powerful abstractions
* Real-world integrations (Express, React, Prisma) → robust apps

---

