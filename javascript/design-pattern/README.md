# Design Patterns in JavaScript: OOP vs. Functional Approaches

Design patterns offer battle-tested solutions to common software design challenges. Understanding them helps in building flexible, reusable, and maintainable code. This guide covers the Gang of Four (GoF) Creational, Structural, and Behavioral patterns, plus common JavaScript-specific patterns, highlighting their implementation in JavaScript using both Object-Oriented Programming (OOP) and Functional paradigms, and noting the specific programming concepts employed.

## Creational Design Patterns

These patterns abstract the object instantiation process, making systems independent of how objects are created, composed, and represented.

**1. Factory Method**

- **OOP Concept:** Defines an interface (often an abstract class or method) for creating an object, but lets subclasses alter the type of objects that will be created. Leverages **Polymorphism** (subclasses provide specific implementations of the creation method) and **Abstraction** (hides the exact creation logic from the client).
- **Functional Concept:** Uses a higher-order function (the factory function) to create and return other functions or objects based on input parameters. Employs **Closures** to encapsulate logic and **Higher-Order Functions** as the core creation mechanism.
- **Use Case:** Creating objects without specifying the exact class.

- **OOP Approach:**

  ```javascript
  // Creator declares the factory method; subclasses decide which product to create
  class Greeter {
    createGreeting(name) {
      throw new Error("Subclass must implement createGreeting");
    }
    greet(name) {
      return this.createGreeting(name); // uses the factory method
    }
  }
  class EnglishGreeter extends Greeter {
    createGreeting(name) {
      return `Hello, ${name}!`;
    }
  }
  class SpanishGreeter extends Greeter {
    createGreeting(name) {
      return `¡Hola, ${name}!`;
    }
  }
  const greeter = new SpanishGreeter();
  console.log(greeter.greet("Alice")); // "¡Hola, Alice!"
  ```

- **Functional Approach:**
  ```javascript
  // Factory function returns the appropriate greeting function
  const greeters = {
    en: (name) => `Hello, ${name}!`,
    es: (name) => `¡Hola, ${name}!`,
  };
  const createGreeter = (lang) => greeters[lang] ?? greeters.en;
  const greetInSpanish = createGreeter("es");
  console.log(greetInSpanish("Alice")); // "¡Hola, Alice!"
  ```

**2. Abstract Factory**

- **OOP Concept:** Provides an interface for creating _families_ of related or dependent objects without specifying their concrete classes. Relies heavily on **Abstraction** (defining interfaces for factories and products) and **Polymorphism** (concrete factories implement the interfaces to create specific product families).
- **Functional Concept:** Uses factory functions that return objects containing other factory functions, creating families of related objects/functions. Leverages **Closures** to encapsulate theme-specific creation logic and **Higher-Order Functions** to produce the UI elements.
- **Use Case:** Creating families of related objects where the specific types aren't known upfront.

- **OOP Approach:**

  ```javascript
  // AbstractFactory interface (conceptual)
  class AbstractFactory {
    createButton() {
      /*...*/
    }
    createDialog() {
      /*...*/
    }
  }
  // Concrete Factories implementing the interface
  class DarkThemeFactory extends AbstractFactory {
    createButton() {
      return "Dark Button";
    }
    createDialog() {
      return "Dark Dialog";
    }
  }
  class LightThemeFactory extends AbstractFactory {
    createButton() {
      return "Light Button";
    }
    createDialog() {
      return "Light Dialog";
    }
  }
  // Client using a factory
  class UIFactory {
    constructor(theme) {
      this.themeFactory =
        theme === "dark" ? new DarkThemeFactory() : new LightThemeFactory();
    }
    createUI() {
      return {
        button: this.themeFactory.createButton(),
        dialog: this.themeFactory.createDialog(),
      };
    }
  }
  const uiFactory = new UIFactory("dark");
  const ui = uiFactory.createUI();
  console.log(ui.button); // "Dark Button"
  ```

- **Functional Approach:**
  ```javascript
  // Factory function creating theme-specific element factories
  const createTheme = (theme) => ({
    button: theme === "dark" ? () => "Dark Button" : () => "Light Button",
    dialog: theme === "dark" ? () => "Dark Dialog" : () => "Light Dialog",
  });
  const darkUI = createTheme("dark");
  console.log(darkUI.button()); // "Dark Button"
  ```

**3. Builder**

- **OOP Concept:** Separates object construction from its representation. Uses **Encapsulation** to hide the internal state during construction and provides step-by-step methods, often returning the builder itself (fluent interface) for chaining.
- **Functional Concept:** Employs **Closures** to maintain the state of the object being built across function calls and often uses **Function Chaining** or **Composition** to apply steps sequentially.
- **Use Case:** Constructing complex objects step-by-step.

- **OOP Approach:**

  ```javascript
  class UserBuilder {
    constructor(name) {
      this.user = { name };
      this.user.role = "user";
    }
    setRole(role) {
      this.user.role = role;
      return this;
    }
    build() {
      return this.user;
    }
  }
  const adminUser = new UserBuilder("Bob").setRole("admin").build();
  console.log(adminUser); // { name: 'Bob', role: 'admin' }
  ```

- **Functional Approach:**
  ```javascript
  // Builder function managing state via closure
  const buildUser = (name) => {
    let role = "user";
    const builder = {
      setRole: (r) => {
        role = r;
        return builder;
      }, // Chainable
      build: () => ({ name, role }),
    };
    return builder;
  };
  const user = buildUser("Bob").setRole("admin").build();
  ```

**4. Prototype**

- **OOP Concept:** Specifies the kinds of objects to create using a prototypical instance and creates new objects by copying (cloning) this prototype. Relies on **Inheritance** (often implicitly via JavaScript's prototype chain) and the ability to copy an existing object's state. **Encapsulation** protects the original object.
- **Functional Concept:** Achieves cloning using object spread syntax (`...`) or `Object.assign()` to create new objects with copied properties. Emphasizes **Immutability** by creating new instances instead of modifying the original.
- **Use Case:** Cloning objects, especially when instantiation is expensive.

- **OOP Approach:**

  ```javascript
  class Config {
    constructor(theme = "light") {
      this.theme = theme;
    }
    clone() {
      return new Config(
        this.theme,
      ); /* Or Object.create(this) for prototype inheritance */
    }
  }
  const defaultConfig = new Config();
  const darkConfig = defaultConfig.clone();
  darkConfig.theme = "dark";
  console.log(darkConfig.theme); // "dark"
  console.log(defaultConfig.theme); // "light"
  ```

- **Functional Approach:**
  ```javascript
  // Simple object as prototype
  const baseConfig = { theme: "light" };
  // Cloning using object spread
  const createDarkConfig = (proto) => ({ ...proto, theme: "dark" });
  const darkConfig = createDarkConfig(baseConfig);
  console.log(darkConfig.theme); // "dark"
  console.log(baseConfig.theme); // "light"
  ```

**5. Singleton**

- **OOP Concept:** Ensures a class has only one instance and provides a global access point. Uses **Encapsulation** to hide the constructor and control instance creation, often employing a static property to hold the single instance.
- **Functional Concept:** Achieved using **Closures** and the **Module Pattern** to create and hold a single instance within a private scope, exposing an accessor function.
- **Use Case:** Managing shared resources like loggers or configuration.

- **OOP Approach:**

  ```javascript
  class Logger {
    constructor() {
      if (Logger.instance) {
        return Logger.instance;
      }
      this.logs = [];
      Logger.instance = this;
    }
    log(message) {
      this.logs.push(message);
      console.log(message);
    }
  }
  const logger1 = new Logger();
  const logger2 = new Logger();
  console.log(logger1 === logger2); // true
  ```

- **Functional Approach:**
  ```javascript
  // Using closure to hold the single instance
  const createLogger = () => {
    let instance;
    return () => {
      if (!instance)
        instance = {
          logs: [],
          log: function (msg) {
            this.logs.push(msg);
            console.log(msg);
          },
        };
      return instance;
    };
  };
  const getLogger = createLogger();
  const loggerA = getLogger();
  const loggerB = getLogger();
  console.log(loggerA === loggerB); // true
  ```

- **Idiomatic JavaScript:** an ES module is evaluated once, so exporting an instance is already a singleton:
  ```javascript
  // logger.js
  export const logger = { logs: [], log(msg) { this.logs.push(msg); console.log(msg); } };
  ```

## Structural Design Patterns

These patterns deal with assembling objects and classes into larger structures, maintaining flexibility and efficiency.

**1. Adapter**

- **OOP Concept:** Converts the interface of a class into another interface clients expect. Uses **Composition** (holding an instance of the adaptee) or **Inheritance** (inheriting from the target and adaptee - less common in JS) and **Encapsulation** to wrap the adaptee. **Polymorphism** allows the adapter to be used where the target is expected.
- **Functional Concept:** Wraps one function with another function that translates the arguments or return values to match the required interface. Leverages **Higher-Order Functions** (the adapter function takes/returns functions) and **Closures**.
- **Use Case:** Making incompatible interfaces work together.

- **OOP Approach:**

  ```javascript
  // Target: the interface the client already uses
  class LegacyLogger {
    log(message) {
      console.log(message);
    }
  }
  // Adaptee: a new library with an incompatible interface
  class CloudLogger {
    write({ level, text }) {
      console.log(`[${level}] ${text}`);
    }
  }
  // Adapter: exposes the target interface, delegates to the adaptee
  class CloudLoggerAdapter {
    constructor(cloudLogger) {
      this.cloudLogger = cloudLogger;
    }
    log(message) {
      this.cloudLogger.write({ level: "info", text: message });
    }
  }
  // Client code keeps calling log()
  const logger = new CloudLoggerAdapter(new CloudLogger());
  logger.log("Server started"); // [info] Server started
  ```

- **Functional Approach:**
  ```javascript
  // Adaptee: takes an options object
  const fetchUser = ({ id, includePosts }) => ({ id, posts: includePosts ? [] : undefined });
  // Adapter: exposes the (id) => user signature the client expects
  const adaptFetchUser = (fn) => (id) => fn({ id, includePosts: false });
  const getUser = adaptFetchUser(fetchUser);
  console.log(getUser(42)); // { id: 42, posts: undefined }
  ```

**2. Bridge**

- **OOP Concept:** Decouples an abstraction from its implementation so they can vary independently. Uses **Abstraction** (for both the main abstraction and the implementor interface) and **Composition** (the abstraction holds a reference to an implementor object). **Polymorphism** allows swapping different implementations.
- **Functional Concept:** Separates concerns using **Higher-Order Functions**. The main function (abstraction) takes an implementation function as an argument. **Closures** can maintain state if needed.
- **Use Case:** When abstraction and implementation should evolve independently.

- **OOP Approach:**

  ```javascript
  // Implementor Interface
  class Renderer {
    renderCircle(radius) {
      /*...*/
    }
  }
  // Concrete Implementors
  class VectorRenderer extends Renderer {
    renderCircle(radius) {
      console.log(`Vector: Circle radius ${radius}`);
    }
  }
  class RasterRenderer extends Renderer {
    renderCircle(radius) {
      console.log(`Raster: Circle radius ${radius}`);
    }
  }
  // Abstraction
  class Shape {
    constructor(renderer) {
      this.renderer = renderer;
    }
    draw() {
      /*...*/
    }
  }
  // Refined Abstraction
  class Circle extends Shape {
    constructor(renderer, radius) {
      super(renderer);
      this.radius = radius;
    }
    draw() {
      this.renderer.renderCircle(this.radius);
    }
  }
  // Usage
  const circle1 = new Circle(new VectorRenderer(), 5);
  const circle2 = new Circle(new RasterRenderer(), 10);
  circle1.draw();
  circle2.draw();
  ```

- **Functional Approach:**
  ```javascript
  // Implementation functions
  const vectorRenderFn = (shape) =>
    console.log(`Vector: Circle radius ${shape.radius}`);
  const rasterRenderFn = (shape) =>
    console.log(`Raster: Circle radius ${shape.radius}`);
  // Abstraction function taking implementation as argument
  const createCircle = (rendererFn, radius) => ({
    draw: () => rendererFn({ radius }),
  });
  // Usage
  const circle1 = createCircle(vectorRenderFn, 5);
  const circle2 = createCircle(rasterRenderFn, 10);
  circle1.draw();
  circle2.draw();
  ```

**3. Composite**

- **OOP Concept:** Composes objects into tree structures representing part-whole hierarchies. Uses **Abstraction** (a common interface for both leaf and composite objects) and **Polymorphism** (clients treat individual and composite objects uniformly through the common interface). **Recursion** is often used in operations on composites.
- **Functional Concept:** Represents hierarchies using nested data structures (like arrays or objects). Operations often involve **Recursion** and **Higher-Order Functions** (like `map` or `reduce`) to traverse the structure.
- **Use Case:** Treating individual objects and compositions uniformly.

- **OOP Approach:**

  ```javascript
  // Component Interface
  class Component {
    constructor(name) {
      this.name = name;
    }
    operation() {
      /*...*/
    }
  }
  // Leaf
  class Leaf extends Component {
    operation() {
      return `Leaf: ${this.name}`;
    }
  }
  // Composite
  class Composite extends Component {
    constructor(name) {
      super(name);
      this.children = [];
    }
    add(child) {
      this.children.push(child);
    }
    operation() {
      return `Composite: ${this.name} [${this.children
        .map((child) => child.operation())
        .join(", ")}]`;
    }
  }
  // Usage
  const leaf1 = new Leaf("L1");
  const composite = new Composite("C1");
  composite.add(leaf1);
  console.log(composite.operation()); // Composite: C1 [Leaf: L1]
  ```

- **Functional Approach:**
  ```javascript
  // Factory for components (can differentiate type if needed)
  const createLeaf = (name) => ({
    type: "leaf",
    name,
    operation: () => `Leaf: ${name}`,
  });
  const createComposite = (name) => {
    const children = [];
    return {
      type: "composite",
      name,
      add: (child) => children.push(child),
      operation: () =>
        `Composite: ${name} [${children
          .map((child) => child.operation())
          .join(", ")}]`,
    };
  };
  // Usage
  const leaf1 = createLeaf("L1");
  const composite = createComposite("C1");
  composite.add(leaf1);
  console.log(composite.operation()); // Composite: C1 [Leaf: L1]
  ```

**4. Decorator**

- **OOP Concept:** Attaches additional responsibilities to an object dynamically. Uses **Composition** (the decorator wraps the component) and adheres to the same interface as the component (**Abstraction**, **Polymorphism**) allowing for transparent wrapping.
- **Functional Concept:** Achieved using **Higher-Order Functions** that take a function (or object) and return an enhanced version of it. **Closures** maintain access to the original function/object.
- **Use Case:** Extending functionality without subclassing.

- **OOP Approach:**

  ```javascript
  // Component Interface
  class Greeter {
    greet() {
      console.log("Hello!");
    }
  }
  // Decorator adhering to the same interface
  class DecoratedGreeter {
    constructor(greeter) {
      this.greeter = greeter;
    }
    greet() {
      this.greeter.greet();
      console.log("How are you?");
    }
  }
  // Usage
  const greeter = new Greeter();
  const decoratedGreeter = new DecoratedGreeter(greeter);
  decoratedGreeter.greet();
  ```

- **Functional Approach:**
  ```javascript
  // Base function/object
  const createComponent = () => ({
    operation: () => "Component: Basic operation",
  });
  // Decorator function (Higher-Order Function)
  const createDecorator = (component) => ({
    operation: () => `Decorator: Enhanced (${component.operation()})`,
  });
  // Usage
  const component = createComponent();
  const decorated = createDecorator(component);
  console.log(decorated.operation()); // Decorator: Enhanced (Component: Basic operation)
  ```

**5. Facade**

- **OOP Concept:** Provides a simplified, unified interface to a complex subsystem. Uses **Encapsulation** to hide the subsystem's complexity and **Composition** to manage the subsystem components.
- **Functional Concept:** A simple function that orchestrates calls to several other functions, hiding the underlying complexity. Relies on **Function Composition** implicitly.
- **Use Case:** Making a complex subsystem easier to use.

- **OOP Approach:**

  ```javascript
  // Complex subsystem classes
  class SubsystemA {
    operationA() {
      console.log("SubA Op");
    }
  }
  class SubsystemB {
    operationB() {
      console.log("SubB Op");
    }
  }
  // Facade simplifying access
  class Facade {
    constructor() {
      this.subA = new SubsystemA();
      this.subB = new SubsystemB();
    }
    operation() {
      this.subA.operationA();
      this.subB.operationB();
    }
  }
  // Usage
  const facade = new Facade();
  facade.operation(); // SubA Op, SubB Op
  ```

- **Functional Approach:**
  ```javascript
  // Subsystem functions
  const operationA = () => "SubA Op";
  const operationB = () => "SubB Op";
  // Facade function
  const simplifiedOperation = () => `${operationA()} & ${operationB()}`;
  // Usage
  console.log(simplifiedOperation()); // SubA Op & SubB Op
  ```

**6. Flyweight**

- **OOP Concept:** Reduces memory usage by sharing common (intrinsic) state between multiple objects, while unique (extrinsic) state is passed externally. Uses a factory (**Abstraction**, **Encapsulation**) to manage shared flyweight objects. **Composition** is used if flyweights reference other objects.
- **Functional Concept:** Uses **Closures** within a factory function to cache and reuse shared state objects/data structures. Emphasizes **Immutability** for the shared state.
- **Use Case:** Managing large numbers of similar objects efficiently.

- **OOP Approach:**

  ```javascript
  // Flyweight object storing intrinsic state
  class Character {
    constructor(font, color) {
      this.font = font;
      this.color = color;
    }
    render(position /* extrinsic */) {
      console.log(`Char ${this.font}/${this.color} at ${position}`);
    }
  }
  // Flyweight Factory managing shared instances
  class CharacterFactory {
    constructor() {
      this.chars = new Map();
    }
    getCharacter(font, color) {
      const key = `${font}-${color}`;
      if (!this.chars.has(key)) {
        this.chars.set(key, new Character(font, color));
      }
      return this.chars.get(key);
    }
  }
  // Usage
  const factory = new CharacterFactory();
  const char1 = factory.getCharacter("Arial", "Red");
  const char2 = factory.getCharacter("Arial", "Red");
  console.log(char1 === char2); // true
  ```

- **Functional Approach:**
  ```javascript
  // Flyweight factory using closure for cache
  const createCharacterFactory = () => {
    const chars = new Map();
    return (font, color) => {
      const key = `${font}-${color}`;
      if (!chars.has(key)) {
        chars.set(key, { font, color });
      }
      return chars.get(key);
    };
  };
  // Usage
  const getCharacter = createCharacterFactory();
  const char1 = getCharacter("Arial", "Red");
  const char2 = getCharacter("Arial", "Red");
  console.log(char1 === char2); // true
  ```

**7. Proxy**

- **OOP Concept:** Provides a surrogate or placeholder to control access to another object. Uses **Composition** (proxy holds a reference to the real subject) and implements the same interface (**Abstraction**, **Polymorphism**) to be interchangeable with the real subject. **Encapsulation** hides the real subject.
- **Functional Concept:** A function wraps another function (or object access), intercepting calls to add behavior (like access control or logging). Leverages **Higher-Order Functions** and **Closures**.
- **Use Case:** Controlling access, lazy loading, logging.

- **OOP Approach:**

  ```javascript
  // Subject Interface (conceptual)
  class Subject {
    request() {
      /*...*/
    }
  }
  // Real Subject
  class RealSubject extends Subject {
    request() {
      console.log("Real request");
    }
  }
  // Proxy implementing the same interface
  class SubjectProxy extends Subject {
    constructor(realSubject) {
      super();
      this.realSubject = realSubject;
    }
    request() {
      console.log("Proxy: Checking access...");
      this.realSubject.request();
    }
  }
  // Usage
  const real = new RealSubject();
  const proxy = new SubjectProxy(real); // do not name a class "Proxy": it shadows the built-in
  proxy.request();
  ```

- **Functional Approach:**
  ```javascript
  // Real object/function
  const target = { data: "secret data", name: "target" };
  // Proxy function controlling access
  const createAccessProxy = (tgt) => ({
    get: (prop) => {
      if (prop === "data") {
        console.log("Access denied to data");
        return undefined;
      }
      return tgt[prop];
    },
  });
  const proxy = createAccessProxy(target);
  console.log(proxy.get("name")); // target
  console.log(proxy.get("data")); // Access denied to data, undefined
  ```

- **Built-in `Proxy`:** JavaScript has native proxies that intercept property access transparently:
  ```javascript
  const guarded = new Proxy(target, {
    get(tgt, prop, receiver) {
      if (prop === "data") return undefined; // access control
      return Reflect.get(tgt, prop, receiver);
    },
  });
  console.log(guarded.name); // target
  console.log(guarded.data); // undefined
  ```

## Behavioral Design Patterns

These patterns manage algorithms, relationships, and responsibilities between objects.

**1. Chain of Responsibility**

- **OOP Concept:** Avoids coupling sender and receiver by passing requests along a chain of handlers. Uses **Composition** (handlers link to the next) and **Polymorphism** (handlers share a common interface). **Abstraction** defines the handler interface.
- **Functional Concept:** Implemented as a linked list or **recursive** structure of functions. Each function decides to handle the request or pass it to the next function. Relies on **Higher-Order Functions** (passing the next handler) and **Closures**.
- **Use Case:** Decoupling request handlers.

- **OOP Approach:**

  ```javascript
  // Handler Interface
  class Handler {
    setNext(handler) {
      this.next = handler;
      return handler;
    }
    handle(request) {
      if (this.next) {
        this.next.handle(request);
      }
    }
  }
  // Concrete Handlers
  class HandlerA extends Handler {
    handle(request) {
      if (request === "A") console.log("A handled");
      else super.handle(request);
    }
  }
  class HandlerB extends Handler {
    handle(request) {
      if (request === "B") console.log("B handled");
      else super.handle(request);
    }
  }
  // Usage
  const hA = new HandlerA();
  const hB = new HandlerB();
  hA.setNext(hB);
  hA.handle("B"); // B handled
  ```

- **Functional Approach:**
  ```javascript
  // Handler factory using closure for 'next'
  const createHandler = (canHandleFn, handlerName) => {
    let next = null;
    return {
      setNext: (h) => (next = h),
      handle: (req) => {
        if (canHandleFn(req)) console.log(`${handlerName} handled`);
        else if (next) next.handle(req);
      },
    };
  };
  // Usage
  const hA = createHandler((req) => req === "A", "A");
  const hB = createHandler((req) => req === "B", "B");
  hA.setNext(hB);
  hA.handle("B"); // B handled
  ```

**2. Command**

- **OOP Concept:** Encapsulates a request as an object. Uses **Abstraction** (command interface) and **Polymorphism** (concrete commands implement the interface). **Encapsulation** bundles the action and its receiver.
- **Functional Concept:** Represents commands as functions, often **Closures** capturing necessary context. **Higher-Order Functions** can act as invokers.
- **Use Case:** Queuing requests, logging, undo/redo.

- **OOP Approach:**

  ```javascript
  // Command Interface
  class Command {
    execute() {
      /*...*/
    }
  }
  // Receiver
  class Light {
    turnOn() {
      console.log("ON");
    }
  }
  // Concrete Command
  class LightOnCommand extends Command {
    constructor(light) {
      super();
      this.light = light;
    }
    execute() {
      this.light.turnOn();
    }
  }
  // Invoker
  class Remote {
    submit(cmd) {
      cmd.execute();
    }
  }
  // Usage
  const light = new Light();
  const cmd = new LightOnCommand(light);
  const remote = new Remote();
  remote.submit(cmd); // ON
  ```

- **Functional Approach:**
  ```javascript
  // Receiver
  const light = {
    turnOn: () => console.log("ON"),
    turnOff: () => console.log("OFF"),
  };
  // Command functions (closures)
  const turnOnCmd = (l) => () => l.turnOn();
  const turnOffCmd = (l) => () => l.turnOff();
  // Invoker function
  const remote = (cmdFn) => cmdFn();
  // Usage
  remote(turnOnCmd(light)); // ON
  ```

**3. Iterator**

- **OOP Concept:** Provides sequential access to elements of an aggregate object without exposing its internal structure. Uses **Abstraction** (iterator interface) and **Encapsulation** (hides collection internals and iteration state).
- **Functional Concept:** Often implemented using **Closures** to maintain iteration state or **Generators** (in languages that support them like JS). **Higher-Order Functions** (`map`, `filter`, `reduce`) provide alternative ways to process collections.
- **Use Case:** Uniform traversal of collections.

- **OOP Approach:**

  ```javascript
  // Iterator providing standard interface
  class Iterator {
    constructor(coll) {
      this.coll = coll;
      this.idx = 0;
    }
    next() {
      return this.idx < this.coll.length
        ? { value: this.coll[this.idx++], done: false }
        : { done: true };
    }
  }
  // Usage
  const iter = new Iterator([1, 2]);
  console.log(iter.next().value); // 1
  ```

- **Functional Approach:**
  ```javascript
  // Iterator factory using closure for state
  const createIterator = (coll) => {
    let idx = 0;
    return () =>
      idx < coll.length ? { value: coll[idx++], done: false } : { done: true };
  };
  // Usage
  const iterFn = createIterator([1, 2]);
  console.log(iterFn().value); // 1
  ```
- **Idiomatic JavaScript:** implement `Symbol.iterator` (often with a generator, `function*`) so the object works with `for...of`, spread, and destructuring:
  ```javascript
  class Range {
    constructor(start, end) {
      this.start = start;
      this.end = end;
    }
    *[Symbol.iterator]() {
      for (let i = this.start; i <= this.end; i++) yield i;
    }
  }
  console.log([...new Range(1, 3)]); // [1, 2, 3]
  ```

**4. Mediator**

- **OOP Concept:** Defines an object (mediator) that encapsulates how a set of objects (colleagues) interact. Promotes loose coupling. Uses **Abstraction** (mediator/colleague interfaces) and **Encapsulation** (mediator hides interaction logic).
- **Functional Concept:** A central function or module manages communication, often using an event bus or message passing mechanism. Leverages **Closures** and **Higher-Order Functions** for callbacks/listeners.
- **Use Case:** Simplifying complex communication between objects.

- **OOP Approach:**

  ```javascript
  // Mediator managing colleagues
  class Mediator {
    constructor() {
      this.colleagues = [];
    }
    add(c) {
      this.colleagues.push(c);
    }
    send(msg, sender) {
      this.colleagues.forEach((c) => {
        if (c !== sender) c.receive(msg);
      });
    }
  }
  // Colleague interacting via mediator
  class Colleague {
    constructor(med) {
      this.mediator = med;
      med.add(this);
    }
    send(msg) {
      this.mediator.send(msg, this);
    }
    receive(msg) {
      console.log(`Received: ${msg}`);
    }
  }
  // Usage
  const med = new Mediator();
  const c1 = new Colleague(med);
  const c2 = new Colleague(med);
  c1.send("Hi!"); // Received: Hi!
  ```

- **Functional Approach:**
  ```javascript
  // Mediator factory
  const createMediator = () => {
    const colleagues = [];
    return {
      add: (c) => colleagues.push(c),
      send: (msg, sender) =>
        colleagues.forEach((c) => {
          if (c !== sender) c.receive(msg);
        }),
    };
  };
  // Colleague factory
  const createColleague = (med, name) => {
    const self = {
      name,
      receive: (msg) => console.log(`${name} got: ${msg}`),
      send: (msg) => med.send(msg, self),
    };
    med.add(self);
    return self;
  };
  // Usage
  const med = createMediator();
  const c1 = createColleague(med, "C1");
  const c2 = createColleague(med, "C2");
  c1.send("Yo!"); // C2 got: Yo!
  ```

**5. Memento**

- **OOP Concept:** Captures and externalizes an object's internal state without violating **Encapsulation**. Uses three roles: Originator (object with state), Memento (stores state), Caretaker (manages mementos).
- **Functional Concept:** Uses **Closures** to capture state. The "memento" is often a function that, when called, returns the captured state. Emphasizes **Immutability** if the state itself is immutable.
- **Use Case:** Undo/redo, saving state.

- **OOP Approach:**

  ```javascript
  // Memento storing state
  class Memento {
    constructor(state) {
      this.state = state;
    }
    getState() {
      return this.state;
    }
  }
  // Originator creating/restoring mementos
  class Originator {
    constructor(state) {
      this.state = state;
    }
    setState(s) {
      this.state = s;
    }
    save() {
      return new Memento(this.state);
    }
    restore(m) {
      this.state = m.getState();
    }
  }
  // Caretaker managing mementos
  class Caretaker {
    constructor() {
      this.mementos = [];
    }
    add(m) {
      this.mementos.push(m);
    }
    get(i) {
      return this.mementos[i];
    }
  }
  // Usage
  const org = new Originator("S1");
  const care = new Caretaker();
  care.add(org.save());
  org.setState("S2");
  org.restore(care.get(0));
  console.log(org.state); // S1
  ```

- **Functional Approach:**
  ```javascript
  // Memento function (closure)
  const createMemento = (state) => () => state;
  // Originator factory
  const originator = (initialState) => {
    let state = initialState;
    return {
      setState: (s) => (state = s),
      save: () => createMemento(state),
      restore: (m) => (state = m()),
      getState: () => state,
    };
  };
  // Usage
  const care = [];
  const org = originator("S1");
  care.push(org.save());
  org.setState("S2");
  org.restore(care[0]);
  console.log(org.getState()); // S1
  ```

**6. Observer**

- **OOP Concept:** Defines a one-to-many dependency where objects (observers) subscribe to an object (subject) and get notified of state changes. Uses **Abstraction** (subject/observer interfaces) and **Polymorphism**. The subject maintains a list of observers (**Composition**).
- **Functional Concept:** Implemented using callbacks or event emitters. The subject is a function/object that maintains a list of callback functions (**Closures**) and invokes them on state change. **Higher-Order Functions** are used for subscription.
- **Use Case:** Event handling, UI updates.

- **OOP Approach:**

  ```javascript
  // Subject maintaining observers
  class Subject {
    constructor() {
      this.obs = [];
    }
    add(o) {
      this.obs.push(o);
    }
    notify(data) {
      this.obs.forEach((o) => o.update(data));
    }
  }
  // Observer interface
  class Observer {
    update(data) {
      console.log(`Got: ${data}`);
    }
  }
  // Usage
  const sub = new Subject();
  const ob1 = new Observer();
  sub.add(ob1);
  sub.notify("Update!"); // Got: Update!
  ```

- **Functional Approach:**
  ```javascript
  // Observer factory
  const createObserver = (cb) => ({ update: cb });
  // Subject factory
  const createSubject = () => {
    const cbs = [];
    return {
      add: (o) => cbs.push(o.update),
      notify: (data) => cbs.forEach((cb) => cb(data)),
    };
  };
  // Usage
  const sub = createSubject();
  const ob1 = createObserver((d) => console.log(`Obs1: ${d}`));
  sub.add(ob1);
  sub.notify("Event!"); // Obs1: Event!
  ```

**7. State**

- **OOP Concept:** Allows an object to alter behavior when its internal state changes. Uses **Composition** (context holds a state object) and **Polymorphism** (different state classes implement the same interface). **Abstraction** defines the state interface. **Encapsulation** hides state transitions.
- **Functional Concept:** Represents state as data and behavior as **Pure Functions** that take state and input, returning new state. State transitions are explicit function calls returning new state data. **Closures** can manage state within a context object/function.
- **Use Case:** Implementing state machines.

- **OOP Approach:**

  ```javascript
  // State Interface
  class State {
    handle(ctx) {
      /*...*/
    }
  }
  // Concrete States
  class StateA extends State {
    handle(ctx) {
      console.log("State A -> B");
      ctx.setState(new StateB());
    }
  }
  class StateB extends State {
    handle(ctx) {
      console.log("State B -> A");
      ctx.setState(new StateA());
    }
  }
  // Context managing state
  class Context {
    constructor() {
      this.state = new StateA();
    }
    setState(s) {
      this.state = s;
    }
    request() {
      this.state.handle(this);
    }
  }
  // Usage
  const ctx = new Context();
  ctx.request();
  ctx.request(); // State A -> B, State B -> A
  ```

- **Functional Approach:**
  ```javascript
  // State factory
  const createState = (handleFn) => ({ handle: handleFn });
  // Define states (mutual recursion needs care)
  let stateA, stateB;
  stateA = createState((ctx) => {
    console.log("A->B");
    ctx.state = stateB;
  });
  stateB = createState((ctx) => {
    console.log("B->A");
    ctx.state = stateA;
  });
  // Context object
  const context = {
    state: stateA,
    setState: function (s) {
      this.state = s;
    },
  };
  context.state.handle(context);
  context.state.handle(context); // A->B, B->A
  ```

**8. Strategy**

- **OOP Concept:** Defines a family of algorithms, encapsulates each, and makes them interchangeable. Uses **Abstraction** (strategy interface), **Polymorphism** (concrete strategies implement the interface), and **Composition** (context holds a strategy object).
- **Functional Concept:** Algorithms are represented by functions. The context takes the strategy function as an argument. Relies on **Higher-Order Functions**.
- **Use Case:** Selecting algorithms at runtime.

- **OOP Approach:**

  ```javascript
  // Strategy Interface
  class PaymentStrategy {
    pay(amt) {
      /*...*/
    }
  }
  // Concrete Strategies
  class CreditCard extends PaymentStrategy {
    pay(amt) {
      console.log(`CC Pay: ${amt}`);
    }
  }
  class PayPal extends PaymentStrategy {
    pay(amt) {
      console.log(`PayPal Pay: ${amt}`);
    }
  }
  // Context using a strategy
  class Cart {
    constructor(strat) {
      this.strat = strat;
    }
    checkout(amt) {
      this.strat.pay(amt);
    }
  }
  // Usage
  const cart = new Cart(new CreditCard());
  cart.checkout(100); // CC Pay: 100
  ```

- **Functional Approach:**
  ```javascript
  // Strategy functions
  const creditCardPay = (amt) => console.log(`CC Pay: ${amt}`);
  const payPalPay = (amt) => console.log(`PayPal Pay: ${amt}`);
  // Context function taking strategy function
  const checkout = (payFn, amt) => payFn(amt);
  // Usage
  checkout(creditCardPay, 100); // CC Pay: 100
  ```

**9. Template Method**

- **OOP Concept:** Defines an algorithm's skeleton in a method, deferring steps to subclasses. Relies on **Inheritance** and **Abstraction** (abstract methods for variant steps). **Polymorphism** allows subclasses to provide specific step implementations. **Encapsulation** protects the template method structure.
- **Functional Concept:** Can be simulated using **Higher-Order Functions**. A main function takes other functions as arguments for the variable steps, composing the overall algorithm. **Closures** can manage shared state if needed.
- **Use Case:** Defining a fixed algorithm structure while allowing customization of specific steps.

- **OOP Approach:**
  ```javascript
  class ReportGenerator {
    generate() {
      // Template Method
      this.gatherData();
      this.formatData();
      this.outputReport();
    }
    gatherData() {
      console.log("Gathering generic data...");
    } // Default/Invariant
    formatData() {
      throw new Error("Subclass must implement formatData");
    } // Abstract
    outputReport() {
      throw new Error("Subclass must implement outputReport");
    } // Abstract
  }
  class PDFReport extends ReportGenerator {
    formatData() {
      console.log("Formatting for PDF...");
    }
    outputReport() {
      console.log("Outputting PDF...");
    }
  }
  new PDFReport().generate();
  ```
- **Functional Approach:**
  ```javascript
  const generateReport = (formatterFn, outputFn) => {
    const gatherData = () => "Generic Data"; // Invariant step
    const data = gatherData();
    const formatted = formatterFn(data); // Variable step
    outputFn(formatted); // Variable step
  };
  const formatForPDF = (data) => `PDF Format: ${data}`;
  const outputPDF = (formatted) => console.log(`Outputting: ${formatted}`);
  generateReport(formatForPDF, outputPDF);
  ```

**10. Visitor**

- **OOP Concept:** Represents an operation to be performed on elements of an object structure without changing element classes. Uses **Polymorphism** (visitor methods are called based on element type - often via double dispatch `element.accept(visitor)` which calls `visitor.visitElement(this)`) and **Abstraction** (visitor/element interfaces).
- **Functional Concept:** Uses **Pattern Matching** or conditional logic within a visitor function to apply different operations based on the data structure's type/shape. Relies on **Higher-Order Functions** if the visitor itself is passed around.
- **Use Case:** Adding operations to complex structures (e.g., ASTs) without modifying them.

- **OOP Approach:**

  ```javascript
  // Visitor Interface
  class Visitor {
    visitA(el) {
      /*...*/
    }
    visitB(el) {
      /*...*/
    }
  }
  // Element Interface
  class Element {
    accept(v) {
      /*...*/
    }
  }
  // Concrete Elements using double dispatch
  class ElementA extends Element {
    accept(v) {
      v.visitA(this);
    }
  }
  class ElementB extends Element {
    accept(v) {
      v.visitB(this);
    }
  }
  // Concrete Visitor
  class ConcreteVisitor extends Visitor {
    visitA(el) {
      console.log("Visit A");
    }
    visitB(el) {
      console.log("Visit B");
    }
  }
  // Usage
  const elements = [new ElementA(), new ElementB()];
  const visitor = new ConcreteVisitor();
  elements.forEach((el) => el.accept(visitor)); // Visit A, Visit B
  ```

- **Functional Approach:**
  ```javascript
  // Visitor function handling different types
  const visit = (element) => {
    switch (element.type) {
      case "A":
        console.log("Visit A");
        break;
      case "B":
        console.log("Visit B");
        break;
      default:
        console.log("Unknown");
    }
  };
  // Usage
  const elements = [{ type: "A" }, { type: "B" }];
  elements.forEach(visit); // Visit A, Visit B - Assumes type property
  ```

## Additional Patterns

These are not among the 23 GoF patterns (Interpreter, the remaining GoF pattern, is omitted here) but are common in JavaScript codebases.

**1. Module / Revealing Module**

- **Concept:** Uses closures (often IIFEs) to create private scope and expose only a public API. Essential before ES modules; ES modules (`import`/`export`) now provide file-level encapsulation natively, and classes offer `#private` fields.
- **Use Case:** Encapsulating private state, avoiding global namespace pollution.

- **Functional Approach:**
  ```javascript
  const createCounter = (initialValue = 0) => {
    let count = initialValue; // private via closure
    const log = (message) => console.log(`Counter [${initialValue}]: ${message}`); // private

    const increment = () => {
      count++;
      log(`Incremented to ${count}`);
    };
    const decrement = () => {
      count--;
      log(`Decremented to ${count}`);
    };

    // Reveal the public API
    return { increment, decrement, value: () => count };
  };

  const counterA = createCounter();
  const counterB = createCounter(100);
  counterA.increment(); // Counter [0]: Incremented to 1
  counterB.decrement(); // Counter [100]: Decremented to 99
  console.log(counterA.value()); // 1
  ```

- **OOP Equivalent (`#private` fields):**
  ```javascript
  class Counter {
    #count = 0;
    increment() {
      return ++this.#count;
    }
    get value() {
      return this.#count;
    }
  }
  ```

**2. Dependency Injection (DI) / Inversion of Control (IoC)**

- **Concept:** Instead of an object creating its dependencies, they are provided from outside (manual wiring or a container). DI is the common technique for achieving IoC. It improves loose coupling and testability.
- **Use Case:** Swapping implementations (for example, mocks in tests); frameworks such as Angular and NestJS.

- **OOP Approach (Constructor Injection):**
  ```javascript
  class NotificationService {
    send(message) {
      console.log(`Sending: ${message}`);
    }
  }

  class OrderProcessor {
    constructor(notifier) {
      if (!notifier) throw new Error("notifier is required");
      this.notifier = notifier;
    }
    processOrder(orderId) {
      this.notifier.send(`Order ${orderId} processed.`);
    }
  }

  new OrderProcessor(new NotificationService()).processOrder("A123");

  // In tests, inject a mock
  const mock = { send: (message) => console.log(`MOCK: ${message}`) };
  new OrderProcessor(mock).processOrder("B456");
  ```

- **Functional Approach:**
  ```javascript
  // Dependency baked in via closure (partial application)
  const createOrderProcessor = (notify) => (orderId) => notify(`Order ${orderId} processed.`);

  const processOrder = createOrderProcessor((msg) => console.log(`Sending: ${msg}`));
  processOrder("C789");
  ```

**3. Null Object**

- **Concept:** Return a safe, do-nothing object that implements the expected interface instead of `null`, so callers do not need null checks.
- **Use Case:** Guest users, no-op loggers, default strategies.

- **OOP Approach:**
  ```javascript
  class User {
    constructor(name, permissions = []) {
      this.name = name;
      this.permissions = permissions;
    }
    hasAccess(resource) {
      return this.permissions.includes(resource);
    }
  }

  class GuestUser extends User {
    constructor() {
      super("Guest");
    }
    hasAccess() {
      return false;
    }
  }

  const getUser = (id) => (id === 1 ? new User("Alice", ["dashboard"]) : new GuestUser());

  console.log(getUser(1).hasAccess("dashboard")); // true
  console.log(getUser(99).name, getUser(99).hasAccess("dashboard")); // Guest false
  ```

- **Functional Approach:**
  ```javascript
  const guestUser = Object.freeze({ name: "Guest", permissions: [] });
  const noopLogger = { log: () => {} };

  const findUser = (id) => (id === 1 ? { name: "Bob", permissions: ["profile"] } : guestUser);
  const canAccess = (user, resource) => user.permissions.includes(resource); // no null checks

  console.log(canAccess(findUser(100), "profile")); // false
  ```

**4. Specification (Filtering with Flexibility)**

Tired of scattering your data filtering and selection logic throughout your codebase? Do tangled `if` statements and duplicated validation rules make your head spin? Enter the Specification pattern, a powerful design pattern that brings order and reusability to your filtering woes in JavaScript, whether you favor Object-Oriented Programming (OOP) or a more Functional Programming (FP) style.

At its core, the Specification pattern is about decoupling the criteria for selecting an object from the object itself and the action being performed on it. It allows you to define business rules or filtering conditions as standalone, reusable units called "specifications." These specifications can then be combined using logical operators (AND, OR, NOT) to create more complex criteria, leading to cleaner, more maintainable, and highly flexible code.

Let's explore how you can implement and leverage this pattern in JavaScript using both OOP and Functional approaches.

#### The Specification Pattern in OOP

In an OOP context, specifications are typically represented as objects with a method that checks if a given candidate object satisfies the specification. This method commonly named `isSatisfiedBy`.

Here's a basic outline of an OOP-based Specification pattern implementation:

```javascript
class Specification {
  isSatisfiedBy(candidate) {
    throw new Error("This method must be implemented");
  }

  and(other) {
    return new AndSpecification(this, other);
  }

  or(other) {
    return new OrSpecification(this, other);
  }

  not() {
    return new NotSpecification(this);
  }
}

class AndSpecification extends Specification {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }

  isSatisfiedBy(candidate) {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification extends Specification {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }

  isSatisfiedBy(candidate) {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification extends Specification {
  constructor(wrapped) {
    super();
    this.wrapped = wrapped;
  }

  isSatisfiedBy(candidate) {
    return !this.wrapped.isSatisfiedBy(candidate);
  }
}

// Example Simple Specifications:
class IsAdultSpecification extends Specification {
  isSatisfiedBy(person) {
    return person.age >= 18;
  }
}

class HasDrivingLicenseSpecification extends Specification {
  isSatisfiedBy(person) {
    return person.hasDrivingLicense === true;
  }
}

class IsStudentSpecification extends Specification {
    isSatisfiedBy(person) {
        return person.isStudent === true;
    }
}

// Example Complex Combinations:
const isAdult = new IsAdultSpecification();
const hasLicense = new HasDrivingLicenseSpecification();
const isStudent = new IsStudentSpecification();

// Combination 1: Is an adult AND has a driving license
const isAdultWithLicense = isAdult.and(hasLicense);

// Combination 2: Is an adult AND (has a driving license OR is a student)
const isAdultWithLicenseOrStudent = isAdult.and(hasLicense.or(isStudent));

// Combination 3: Is NOT an adult AND is a student (i.e., a minor student)
const isMinorStudent = isAdult.not().and(isStudent);

const person1 = { age: 20, hasDrivingLicense: true, isStudent: false }; // Adult with license, not student
const person2 = { age: 16, hasDrivingLicense: false, isStudent: true };  // Minor without license, student
const person3 = { age: 25, hasDrivingLicense: false, isStudent: true };  // Adult without license, student
const person4 = { age: 17, hasDrivingLicense: true, isStudent: false };  // Minor with license, not student
const person5 = { age: 22, hasDrivingLicense: false, isStudent: false }; // Adult without license, not student

console.log("--- isAdultWithLicense ---");
console.log("Person 1 satisfied:", isAdultWithLicense.isSatisfiedBy(person1)); // true
console.log("Person 2 satisfied:", isAdultWithLicense.isSatisfiedBy(person2)); // false
console.log("Person 3 satisfied:", isAdultWithLicense.isSatisfiedBy(person3)); // false
console.log("Person 4 satisfied:", isAdultWithLicense.isSatisfiedBy(person4)); // false
console.log("Person 5 satisfied:", isAdultWithLicense.isSatisfiedBy(person5)); // false

console.log("\n--- isAdultWithLicenseOrStudent ---");
console.log("Person 1 satisfied:", isAdultWithLicenseOrStudent.isSatisfiedBy(person1)); // true (adult, has license)
console.log("Person 2 satisfied:", isAdultWithLicenseOrStudent.isSatisfiedBy(person2)); // false (minor)
console.log("Person 3 satisfied:", isAdultWithLicenseOrStudent.isSatisfiedBy(person3)); // true (adult, student)
console.log("Person 4 satisfied:", isAdultWithLicenseOrStudent.isSatisfiedBy(person4)); // false (minor)
console.log("Person 5 satisfied:", isAdultWithLicenseOrStudent.isSatisfiedBy(person5)); // false (adult, neither license nor student)

console.log("\n--- isMinorStudent ---");
console.log("Person 1 satisfied:", isMinorStudent.isSatisfiedBy(person1)); // false
console.log("Person 2 satisfied:", isMinorStudent.isSatisfiedBy(person2)); // true
console.log("Person 3 satisfied:", isMinorStudent.isSatisfiedBy(person3)); // false
console.log("Person 4 satisfied:", isMinorStudent.isSatisfiedBy(person4)); // false
console.log("Person 5 satisfied:", isMinorStudent.isSatisfiedBy(person5)); // false
```

In this OOP example, by creating instances of simple specifications (`IsAdultSpecification`, `HasDrivingLicenseSpecification`, `IsStudentSpecification`) and using the `and`, `or`, and `not` methods provided by the base `Specification` class (which return the composite specification objects), we can build complex filtering rules in a clear, chainable, and object-oriented manner.

#### The Specification Pattern with a Functional Approach

The Specification pattern fits beautifully within a functional programming paradigm as well. In this approach, specifications can be represented simply as functions that take a candidate object and return a boolean value (`true` if the candidate satisfies the specification, `false` otherwise). Combining specifications then involves using higher-order functions.

Here's how you might implement the Specification pattern functionally in JavaScript:

```javascript
// Base Specification Function Type
// type SpecificationFn<T> = (candidate: T) => boolean;

// Combinator Functions: Higher-order functions to combine specification functions
const and = (spec1, spec2) => (candidate) =>
  spec1(candidate) && spec2(candidate);

const or = (spec1, spec2) => (candidate) =>
  spec1(candidate) || spec2(candidate);

const not = (spec) => (candidate) =>
  !spec(candidate);

// Example Simple Specification Functions:
const isAdult = (person) => person.age >= 18;
const hasDrivingLicense = (person) => person.hasDrivingLicense === true;
const isStudent = (person) => person.isStudent === true;

// Example Complex Combinations:
// Combination 1: Is an adult AND has a driving license
const isAdultWithLicense = and(isAdult, hasDrivingLicense);

// Combination 2: Is an adult AND (has a driving license OR is a student)
const isAdultWithLicenseOrStudent = and(isAdult, or(hasDrivingLicense, isStudent));

// Combination 3: Is NOT an adult AND is a student (i.e., a minor student)
const isMinorStudent = and(not(isAdult), isStudent);

const person1 = { age: 20, hasDrivingLicense: true, isStudent: false }; // Adult with license, not student
const person2 = { age: 16, hasDrivingLicense: false, isStudent: true };  // Minor without license, student
const person3 = { age: 25, hasDrivingLicense: false, isStudent: true };  // Adult without license, student
const person4 = { age: 17, hasDrivingLicense: true, isStudent: false };  // Minor with license, not student
const person5 = { age: 22, hasDrivingLicense: false, isStudent: false }; // Adult without license, not student

console.log("--- isAdultWithLicense ---");
console.log("Person 1 satisfied:", isAdultWithLicense(person1)); // true
console.log("Person 2 satisfied:", isAdultWithLicense(person2)); // false
console.log("Person 3 satisfied:", isAdultWithLicense(person3)); // false
console.log("Person 4 satisfied:", isAdultWithLicense(person4)); // false
console.log("Person 5 satisfied:", isAdultWithLicense(person5)); // false

console.log("\n--- isAdultWithLicenseOrStudent ---");
console.log("Person 1 satisfied:", isAdultWithLicenseOrStudent(person1)); // true (adult, has license)
console.log("Person 2 satisfied:", isAdultWithLicenseOrStudent(person2)); // false (minor)
console.log("Person 3 satisfied:", isAdultWithLicenseOrStudent(person3)); // true (adult, student)
console.log("Person 4 satisfied:", isAdultWithLicenseOrStudent(person4)); // false (minor)
console.log("Person 5 satisfied:", isAdultWithLicenseOrStudent(person5)); // false (adult, neither license nor student)

console.log("\n--- isMinorStudent ---");
console.log("Person 1 satisfied:", isMinorStudent(person1)); // false
console.log("Person 2 satisfied:", isMinorStudent(person2)); // true
console.log("Person 3 satisfied:", isMinorStudent(person3)); // false
console.log("Person 4 satisfied:", isMinorStudent(person4)); // false
console.log("Person 5 satisfied:", isMinorStudent(person5)); // false
```

In the functional approach, `isAdult`, `hasDrivingLicense`, and `isStudent` are simple functions. The `and`, `or`, and `not` functions are higher-order functions that take specification functions as arguments and return a *new* specification function representing the combined logic. This allows for building complex criteria by composing these functions, offering a concise and often more readable way to express the filtering rules in a functional style.

#### Comparing the Approaches

Both OOP and functional approaches to the Specification pattern in JavaScript achieve the same goal of decoupling filtering logic. However, they offer different flavors:

* **OOP:** Provides a more structured and explicit way to define specifications through classes and inheritance. This can be beneficial in larger codebases or when working with developers more familiar with OOP principles. The method chaining (`.and().or()`) can also lead to very readable composition.

* **Functional:** Offers a more concise and often more flexible way to define and combine specifications using functions and higher-order functions. This aligns well with a functional programming style and can lead to highly reusable utility functions for combining specifications.

The choice between the two approaches often comes down to team preference, project style guidelines, and the complexity of the specifications you need to define.

#### Benefits of the Specification Pattern

Regardless of the implementation style, the Specification pattern offers several significant benefits:

* **Improved Readability:** Business rules are clearly defined in dedicated specification units, making the code easier to understand.
* **Enhanced Maintainability:** Changes to filtering logic are isolated within the relevant specifications, reducing the risk of introducing bugs in other parts of the codebase.
* **Increased Reusability:** Specifications can be reused across different parts of your application, avoiding code duplication.
* **Easier Testing:** Each specification can be tested in isolation, simplifying the testing process.
* **Flexibility:** Complex filtering criteria can be easily built by combining simpler specifications using logical operators.
* **Decoupling:** The logic for selecting objects is separated from the objects themselves and the operations that use the selection, leading to a more modular design.

#### Conclusion

The Specification pattern is a valuable tool in your JavaScript development arsenal for managing filtering and selection logic effectively. Whether you prefer the structured approach of OOP or the concise nature of functional programming, implementing the Specification pattern will lead to cleaner, more maintainable, and more flexible code. By isolating your business rules and making them first-class citizens, you empower yourself to build more robust and adaptable applications. Consider incorporating this pattern into your next project and experience the difference it can make.
