# 📘 TypeScript Complete Guide for JavaScript Developers

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

Or use **ts-node** for direct execution:

```bash
npm install -g ts-node
ts-node index.ts
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

⚡ **Tip**: Prefer `const enum` for performance (inlines values).

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

## 15. **Decorators (Experimental)**

```ts
function Logger(constructor: Function) {
  console.log(`Class created: ${constructor.name}`);
}

@Logger
class MyService {}
```

⚡ Used in frameworks like **NestJS**.

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
* `Extract<T, U>` – intersection types
* `Exclude<T, U>` – difference types

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

# 🎯 Final Thoughts

TypeScript isn’t just “typed JavaScript.”
It’s **a design-time safety net, a documentation tool, and a scalability enabler.**

* Functions → safer & predictable
* Objects & Classes → clean architecture
* Advanced Types → powerful abstractions
* Real-world integrations (Express, React, Prisma) → robust apps

---

