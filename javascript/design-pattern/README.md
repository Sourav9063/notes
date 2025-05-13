# Exploring Design Patterns in JavaScript: OOP vs. Functional Approaches (Enhanced)

Design patterns offer battle-tested solutions to common software design challenges. Understanding them helps in building flexible, reusable, and maintainable code. This post delves into Creational, Structural, and Behavioral design patterns, highlighting their implementation in JavaScript using both Object-Oriented Programming (OOP) and Functional paradigms, and noting the specific programming concepts employed.

### Creational Design Patterns

These patterns abstract the object instantiation process, making systems independent of how objects are created, composed, and represented.

**1. Factory Method**

- **OOP Concept:** Defines an interface (often an abstract class or method) for creating an object, but lets subclasses alter the type of objects that will be created[cite: 13]. Leverages **Polymorphism** (subclasses provide specific implementations of the creation method) and **Abstraction** (hides the exact creation logic from the client).
- **Functional Concept:** Uses a higher-order function (the factory function) to create and return other functions or objects based on input parameters[cite: 19]. Employs **Closures** to encapsulate logic and **Higher-Order Functions** as the core creation mechanism.
- **Use Case:** Creating objects without specifying the exact class[cite: 14].

- **OOP Approach:**

  ```javascript
  // Abstracting the greeting logic based on language
  class Greeter {
    constructor(language) {
      this.language = language;
    } // [cite: 15]
    greet(name) {
      const greetings = { en: `Hello, ${name}!`, es: `¡Hola, ${name}!` }; // [cite: 16]
      return greetings[this.language] || `Hello, ${name}!`; // [cite: 17]
    }
  }
  const englishGreeter = new Greeter("en"); // [cite: 17]
  console.log(englishGreeter.greet("Alice")); // "Hello, Alice!" [cite: 18]
  ```

- **Functional Approach:**
  ```javascript
  // Using a function to generate the appropriate greeting function
  const createGreeter = (lang) =>
    ({
      // [cite: 19]
      en: (name) => `Hello, ${name}!`, // [cite: 19]
      es: (name) => `¡Hola, ${name}!`, // [cite: 19]
    }[lang]);
  const greetInSpanish = createGreeter("es"); // [cite: 20]
  console.log(greetInSpanish("Alice")); // "¡Hola, Alice!" [cite: 20]
  ```

**2. Abstract Factory**

- **OOP Concept:** Provides an interface for creating _families_ of related or dependent objects without specifying their concrete classes[cite: 36]. Relies heavily on **Abstraction** (defining interfaces for factories and products) and **Polymorphism** (concrete factories implement the interfaces to create specific product families).
- **Functional Concept:** Uses factory functions that return objects containing other factory functions, creating families of related objects/functions[cite: 47]. Leverages **Closures** to encapsulate theme-specific creation logic and **Higher-Order Functions** to produce the UI elements.
- **Use Case:** Creating families of related objects where the specific types aren't known upfront[cite: 37].

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
  } // [cite: 38, 39]
  class LightThemeFactory extends AbstractFactory {
    createButton() {
      return "Light Button";
    }
    createDialog() {
      return "Light Dialog";
    }
  } // [cite: 40, 41]
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
  } // [cite: 42, 43, 44]
  const uiFactory = new UIFactory("dark"); // [cite: 45]
  const ui = uiFactory.createUI(); // [cite: 46]
  console.log(ui.button); // "Dark Button" [cite: 46]
  ```

- **Functional Approach:**
  ```javascript
  // Factory function creating theme-specific element factories
  const createTheme = (theme) => ({
    // [cite: 47]
    button: theme === "dark" ? () => "Dark Button" : () => "Light Button", // [cite: 47]
    dialog: theme === "dark" ? () => "Dark Dialog" : () => "Light Dialog", // [cite: 47]
  });
  const darkUI = createTheme("dark"); // [cite: 48]
  console.log(darkUI.button()); // "Dark Button"
  ```

**3. Builder**

- **OOP Concept:** Separates object construction from its representation[cite: 21]. Uses **Encapsulation** to hide the internal state during construction and provides step-by-step methods, often returning the builder itself (fluent interface) for chaining.
- **Functional Concept:** Employs **Closures** to maintain the state of the object being built across function calls and often uses **Function Chaining** or **Composition** to apply steps sequentially[cite: 26].
- **Use Case:** Constructing complex objects step-by-step[cite: 21].

- **OOP Approach:**

  ```javascript
  class UserBuilder {
    constructor(name) {
      this.user = { name };
      this.user.role = "user";
    } // [cite: 21, 22]
    setRole(role) {
      this.user.role = role;
      return this;
    } // [cite: 22, 23]
    build() {
      return this.user;
    } // [cite: 23]
  }
  const adminUser = new UserBuilder("Bob").setRole("admin").build(); // [cite: 24]
  console.log(adminUser); // { name: 'Bob', role: 'admin' } [cite: 25]
  ```

- **Functional Approach:**
  ```javascript
  // Builder function managing state via closure
  const buildUser = (name) => {
    // [cite: 26]
    let role = "user"; // [cite: 26]
    const builder = {
      // [cite: 27]
      setRole: (r) => {
        role = r;
        return builder;
      }, // Chainable [cite: 27, 28]
      build: () => ({ name, role }), // [cite: 28]
    };
    return builder; // [cite: 28]
  };
  const user = buildUser("Bob").setRole("admin").build(); // [cite: 29]
  ```

**4. Prototype**

- **OOP Concept:** Specifies the kinds of objects to create using a prototypical instance and creates new objects by copying (cloning) this prototype[cite: 30]. Relies on **Inheritance** (often implicitly via JavaScript's prototype chain) and the ability to copy an existing object's state. **Encapsulation** protects the original object.
- **Functional Concept:** Achieves cloning using object spread syntax (`...`) or `Object.assign()` to create new objects with copied properties[cite: 34]. Emphasizes **Immutability** by creating new instances instead of modifying the original.
- **Use Case:** Cloning objects, especially when instantiation is expensive[cite: 30].

- **OOP Approach:**

  ```javascript
  class Config {
    constructor(theme = "light") {
      this.theme = theme;
    } // [cite: 30]
    clone() {
      return new Config(
        this.theme,
      ); /* Or Object.create(this) for prototype inheritance */
    } // [cite: 31]
  }
  const defaultConfig = new Config(); // [cite: 32]
  const darkConfig = defaultConfig.clone();
  darkConfig.theme = "dark"; // [cite: 32]
  console.log(darkConfig.theme); // "dark" [cite: 33]
  console.log(defaultConfig.theme); // "light"
  ```

- **Functional Approach:**
  ```javascript
  // Simple object as prototype
  const baseConfig = { theme: "light" }; // [cite: 34]
  // Cloning using object spread
  const createDarkConfig = (proto) => ({ ...proto, theme: "dark" }); // [cite: 35]
  const darkConfig = createDarkConfig(baseConfig); // [cite: 35]
  console.log(darkConfig.theme); // "dark"
  console.log(baseConfig.theme); // "light"
  ```

**5. Singleton**

- **OOP Concept:** Ensures a class has only one instance and provides a global access point[cite: 2]. Uses **Encapsulation** to hide the constructor and control instance creation, often employing a static property to hold the single instance.
- **Functional Concept:** Achieved using **Closures** and the **Module Pattern** to create and hold a single instance within a private scope, exposing an accessor function[cite: 8].
- **Use Case:** Managing shared resources like loggers or configuration[cite: 3].

- **OOP Approach:**

  ```javascript
  class Logger {
    constructor() {
      if (Logger.instance) {
        return Logger.instance;
      }
      this.logs = [];
      Logger.instance = this;
    } // [cite: 4, 5]
    log(message) {
      this.logs.push(message);
      console.log(message);
    } // [cite: 6]
  }
  const logger1 = new Logger();
  const logger2 = new Logger(); // [cite: 7]
  console.log(logger1 === logger2); // true [cite: 8]
  ```

- **Functional Approach:**
  ```javascript
  // Using closure to hold the single instance
  const createLogger = () => {
    // [cite: 9]
    let instance; // [cite: 9]
    return () => {
      // [cite: 10]
      if (!instance)
        instance = {
          logs: [],
          log: function (msg) {
            this.logs.push(msg);
            console.log(msg);
          },
        }; // [cite: 10]
      return instance; // [cite: 11]
    };
  };
  const getLogger = createLogger(); // [cite: 11]
  const loggerA = getLogger();
  const loggerB = getLogger(); // [cite: 11]
  console.log(loggerA === loggerB); // true [cite: 11]
  ```

### Structural Design Patterns

These patterns deal with assembling objects and classes into larger structures, maintaining flexibility and efficiency.

**1. Adapter**

- **OOP Concept:** Converts the interface of a class into another interface clients expect[cite: 66]. Uses **Composition** (holding an instance of the adaptee) or **Inheritance** (inheriting from the target and adaptee - less common in JS) and **Encapsulation** to wrap the adaptee. **Polymorphism** allows the adapter to be used where the target is expected.
- **Functional Concept:** Wraps one function with another function that translates the arguments or return values to match the required interface[cite: 73]. Leverages **Higher-Order Functions** (the adapter function takes/returns functions) and **Closures**.
- **Use Case:** Making incompatible interfaces work together[cite: 67].

- **OOP Approach:**

  ```javascript
  // Adaptee with an incompatible interface
  class OldSystem {
    request() {
      return "Old system response";
    }
  } // [cite: 67]
  // New system with the desired interface (conceptual target)
  class NewSystem {
    specificRequest() {
      return "New system response";
    }
  } // [cite: 68]
  // Adapter wrapping the NewSystem to match OldSystem's expected interface
  class Adapter {
    constructor(newSystem) {
      this.newSystem = newSystem;
    }
    request() {
      return this.newSystem.specificRequest();
    }
  } // [cite: 69, 70]
  const newSystem = new NewSystem(); // [cite: 71]
  const adapter = new Adapter(newSystem); // [cite: 71]
  console.log(adapter.request()); // "New system response" [cite: 71]
  ```

- **Functional Approach:**
  ```javascript
  // Adaptee function
  const specificRequest = () => ".eetpadA eht fo roivaheb si tahT"; // [cite: 444]
  // Adapter function transforming the interface
  const adapter = (specificReqFn) => () =>
    `Adapter: (TRANSLATED) ${specificReqFn().split("").reverse().join("")}`; // [cite: 445]
  const adaptedRequest = adapter(specificRequest); // [cite: 445]
  console.log(adaptedRequest()); // Adapter: (TRANSLATED) That is the behavior of Adapter. [cite: 446]
  ```

**2. Bridge**

- **OOP Concept:** Decouples an abstraction from its implementation so they can vary independently[cite: 122]. Uses **Abstraction** (for both the main abstraction and the implementor interface) and **Composition** (the abstraction holds a reference to an implementor object). **Polymorphism** allows swapping different implementations.
- **Functional Concept:** Separates concerns using **Higher-Order Functions**. The main function (abstraction) takes an implementation function as an argument[cite: 134]. **Closures** can maintain state if needed.
- **Use Case:** When abstraction and implementation should evolve independently[cite: 123].

- **OOP Approach:**

  ```javascript
  // Implementor Interface
  class Renderer {
    renderCircle(radius) {
      /*...*/
    }
  } // [cite: 124]
  // Concrete Implementors
  class VectorRenderer extends Renderer {
    renderCircle(radius) {
      console.log(`Vector: Circle radius ${radius}`);
    }
  } // [cite: 125]
  class RasterRenderer extends Renderer {
    renderCircle(radius) {
      console.log(`Raster: Circle radius ${radius}`);
    }
  } // [cite: 126]
  // Abstraction
  class Shape {
    constructor(renderer) {
      this.renderer = renderer;
    }
    draw() {
      /*...*/
    }
  } // [cite: 127, 128]
  // Refined Abstraction
  class Circle extends Shape {
    constructor(renderer, radius) {
      super(renderer);
      this.radius = radius;
    }
    draw() {
      this.renderer.renderCircle(this.radius);
    }
  } // [cite: 129, 130]
  // Usage
  const circle1 = new Circle(new VectorRenderer(), 5); // [cite: 131, 132]
  const circle2 = new Circle(new RasterRenderer(), 10); // [cite: 131, 132]
  circle1.draw();
  circle2.draw(); // [cite: 132]
  ```

- **Functional Approach:**
  ```javascript
  // Implementation functions
  const vectorRenderFn = (shape) =>
    console.log(`Vector: Circle radius ${shape.radius}`); // [cite: 135]
  const rasterRenderFn = (shape) =>
    console.log(`Raster: Circle radius ${shape.radius}`); // [cite: 136]
  // Abstraction function taking implementation as argument
  const createCircle = (rendererFn, radius) => ({
    draw: () => rendererFn({ radius }),
  }); // [cite: 137]
  // Usage
  const circle1 = createCircle(vectorRenderFn, 5); // [cite: 138]
  const circle2 = createCircle(rasterRenderFn, 10); // [cite: 138]
  circle1.draw();
  circle2.draw(); // [cite: 138]
  ```

**3. Composite**

- **OOP Concept:** Composes objects into tree structures representing part-whole hierarchies[cite: 96, 447]. Uses **Abstraction** (a common interface for both leaf and composite objects) and **Polymorphism** (clients treat individual and composite objects uniformly through the common interface). **Recursion** is often used in operations on composites.
- **Functional Concept:** Represents hierarchies using nested data structures (like arrays or objects)[cite: 104]. Operations often involve **Recursion** and **Higher-Order Functions** (like `map` or `reduce`) to traverse the structure[cite: 104, 105].
- **Use Case:** Treating individual objects and compositions uniformly[cite: 97, 448].

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
  } // [cite: 97, 449]
  // Leaf
  class Leaf extends Component {
    operation() {
      return `Leaf: ${this.name}`;
    }
  } // [cite: 98, 451]
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
  } // [cite: 99, 100, 101, 452, 453]
  // Usage
  const leaf1 = new Leaf("L1");
  const composite = new Composite("C1");
  composite.add(leaf1); // [cite: 102, 454]
  console.log(composite.operation()); // Composite: C1 [Leaf: L1] [cite: 454]
  ```

- **Functional Approach:**
  ```javascript
  // Factory for components (can differentiate type if needed)
  const createLeaf = (name) => ({
    type: "leaf",
    name,
    operation: () => `Leaf: ${name}`,
  }); // [cite: 456]
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
  }; // [cite: 457, 458]
  // Usage
  const leaf1 = createLeaf("L1");
  const composite = createComposite("C1");
  composite.add(leaf1); // [cite: 459]
  console.log(composite.operation()); // Composite: C1 [Leaf: L1] [cite: 459]
  ```

**4. Decorator**

- **OOP Concept:** Attaches additional responsibilities to an object dynamically[cite: 74, 460]. Uses **Composition** (the decorator wraps the component) and adheres to the same interface as the component (**Abstraction**, **Polymorphism**) allowing for transparent wrapping.
- **Functional Concept:** Achieved using **Higher-Order Functions** that take a function (or object) and return an enhanced version of it[cite: 79, 466]. **Closures** maintain access to the original function/object.
- **Use Case:** Extending functionality without subclassing[cite: 74, 461].

- **OOP Approach:**

  ```javascript
  // Component Interface
  class Greeter {
    greet() {
      console.log("Hello!");
    }
  } // [cite: 75]
  // Decorator adhering to the same interface
  class DecoratedGreeter {
    constructor(greeter) {
      this.greeter = greeter;
    }
    greet() {
      this.greeter.greet();
      console.log("How are you?");
    }
  } // [cite: 76, 77]
  // Usage
  const greeter = new Greeter(); // [cite: 78]
  const decoratedGreeter = new DecoratedGreeter(greeter);
  decoratedGreeter.greet(); // [cite: 78]
  ```

- **Functional Approach:**
  ```javascript
  // Base function/object
  const createComponent = () => ({
    operation: () => "Component: Basic operation",
  }); // [cite: 465]
  // Decorator function (Higher-Order Function)
  const createDecorator = (component) => ({
    operation: () => `Decorator: Enhanced (${component.operation()})`,
  }); // [cite: 466]
  // Usage
  const component = createComponent(); // [cite: 466]
  const decorated = createDecorator(component);
  console.log(decorated.operation()); // Decorator: Enhanced (Component: Basic operation) [cite: 467]
  ```

**5. Facade**

- **OOP Concept:** Provides a simplified, unified interface to a complex subsystem[cite: 88, 468]. Uses **Encapsulation** to hide the subsystem's complexity and **Composition** to manage the subsystem components.
- **Functional Concept:** A simple function that orchestrates calls to several other functions, hiding the underlying complexity[cite: 95, 474]. Relies on **Function Composition** implicitly.
- **Use Case:** Making a complex subsystem easier to use[cite: 89, 468].

- **OOP Approach:**

  ```javascript
  // Complex subsystem classes
  class SubsystemA {
    operationA() {
      console.log("SubA Op");
    }
  } // [cite: 89]
  class SubsystemB {
    operationB() {
      console.log("SubB Op");
    }
  } // [cite: 90]
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
  } // [cite: 91, 92, 93]
  // Usage
  const facade = new Facade();
  facade.operation(); // SubA Op, SubB Op [cite: 93]
  ```

- **Functional Approach:**
  ```javascript
  // Subsystem functions
  const operationA = () => "SubA Op"; // [cite: 473]
  const operationB = () => "SubB Op"; // [cite: 474]
  // Facade function
  const simplifiedOperation = () => `${operationA()} & ${operationB()}`; // [cite: 474]
  // Usage
  console.log(simplifiedOperation()); // SubA Op & SubB Op [cite: 475]
  ```

**6. Flyweight**

- **OOP Concept:** Reduces memory usage by sharing common (intrinsic) state between multiple objects, while unique (extrinsic) state is passed externally[cite: 106, 475]. Uses a factory (**Abstraction**, **Encapsulation**) to manage shared flyweight objects. **Composition** is used if flyweights reference other objects.
- **Functional Concept:** Uses **Closures** within a factory function to cache and reuse shared state objects/data structures[cite: 116]. Emphasizes **Immutability** for the shared state.
- **Use Case:** Managing large numbers of similar objects efficiently[cite: 107, 476].

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
  } // [cite: 108, 109]
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
  } // [cite: 110, 111, 112, 113]
  // Usage
  const factory = new CharacterFactory();
  const char1 = factory.getCharacter("Arial", "Red");
  const char2 = factory.getCharacter("Arial", "Red"); // [cite: 114]
  console.log(char1 === char2); // true [cite: 115]
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
  }; // [cite: 116, 117, 118, 119]
  // Usage
  const getCharacter = createCharacterFactory();
  const char1 = getCharacter("Arial", "Red");
  const char2 = getCharacter("Arial", "Red"); // [cite: 119, 120]
  console.log(char1 === char2); // true [cite: 120]
  ```

**7. Proxy**

- **OOP Concept:** Provides a surrogate or placeholder to control access to another object[cite: 81]. Uses **Composition** (proxy holds a reference to the real subject) and implements the same interface (**Abstraction**, **Polymorphism**) to be interchangeable with the real subject. **Encapsulation** hides the real subject.
- **Functional Concept:** A function wraps another function (or object access), intercepting calls to add behavior (like access control or logging)[cite: 87]. Leverages **Higher-Order Functions** and **Closures**.
- **Use Case:** Controlling access, lazy loading, logging[cite: 82].

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
  } // [cite: 82]
  // Proxy implementing the same interface
  class Proxy extends Subject {
    constructor(realSubject) {
      super();
      this.realSubject = realSubject;
    }
    request() {
      console.log("Proxy: Checking access...");
      this.realSubject.request();
    }
  } // [cite: 83, 84]
  // Usage
  const real = new RealSubject();
  const proxy = new Proxy(real);
  proxy.request(); // [cite: 85]
  ```

- **Functional Approach:**
  ```javascript
  // Real object/function
  const target = { data: "secret data", name: "target" }; // [cite: 87]
  // Proxy function controlling access
  const createAccessProxy = (tgt) => ({
    get: (prop) => {
      if (prop === "data") {
        console.log("Access denied to data");
        return undefined;
      }
      return tgt[prop];
    },
  }); // [cite: 87]
  const proxy = createAccessProxy(target); // [cite: 87]
  console.log(proxy.get("name")); // target
  console.log(proxy.get("data")); // Access denied to data, undefined
  ```

### Behavioral Design Patterns

These patterns manage algorithms, relationships, and responsibilities between objects.

**1. Chain of Responsibility**

- **OOP Concept:** Avoids coupling sender and receiver by passing requests along a chain of handlers[cite: 292]. Uses **Composition** (handlers link to the next) and **Polymorphism** (handlers share a common interface). **Abstraction** defines the handler interface.
- **Functional Concept:** Implemented as a linked list or **recursive** structure of functions. Each function decides to handle the request or pass it to the next function[cite: 304]. Relies on **Higher-Order Functions** (passing the next handler) and **Closures**.
- **Use Case:** Decoupling request handlers[cite: 293].

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
  } // [cite: 294, 295, 296]
  // Concrete Handlers
  class HandlerA extends Handler {
    handle(request) {
      if (request === "A") console.log("A handled");
      else super.handle(request);
    }
  } // [cite: 297, 298]
  class HandlerB extends Handler {
    handle(request) {
      if (request === "B") console.log("B handled");
      else super.handle(request);
    }
  } // [cite: 299, 300]
  // Usage
  const hA = new HandlerA();
  const hB = new HandlerB();
  hA.setNext(hB);
  hA.handle("B"); // B handled [cite: 301, 302]
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
  }; // [cite: 304, 305, 306, 307]
  // Usage
  const hA = createHandler((req) => req === "A", "A");
  const hB = createHandler((req) => req === "B", "B");
  hA.setNext(hB);
  hA.handle("B"); // B handled [cite: 309, 310, 311, 312]
  ```

**2. Command**

- **OOP Concept:** Encapsulates a request as an object[cite: 181, 241]. Uses **Abstraction** (command interface) and **Polymorphism** (concrete commands implement the interface). **Encapsulation** bundles the action and its receiver.
- **Functional Concept:** Represents commands as functions, often **Closures** capturing necessary context[cite: 192, 252]. **Higher-Order Functions** can act as invokers.
- **Use Case:** Queuing requests, logging, undo/redo[cite: 182, 242].

- **OOP Approach:**

  ```javascript
  // Command Interface
  class Command {
    execute() {
      /*...*/
    }
  } // [cite: 183]
  // Receiver
  class Light {
    turnOn() {
      console.log("ON");
    }
  } // [cite: 186]
  // Concrete Command
  class LightOnCommand extends Command {
    constructor(light) {
      super();
      this.light = light;
    }
    execute() {
      this.light.turnOn();
    }
  } // [cite: 184, 185]
  // Invoker
  class Remote {
    submit(cmd) {
      cmd.execute();
    }
  } // [cite: 188]
  // Usage
  const light = new Light();
  const cmd = new LightOnCommand(light);
  const remote = new Remote();
  remote.submit(cmd); // ON [cite: 189, 190]
  ```

- **Functional Approach:**
  ```javascript
  // Receiver
  const light = {
    turnOn: () => console.log("ON"),
    turnOff: () => console.log("OFF"),
  }; // [cite: 193]
  // Command functions (closures)
  const turnOnCmd = (l) => () => l.turnOn(); // [cite: 192]
  const turnOffCmd = (l) => () => l.turnOff(); // [cite: 193]
  // Invoker function
  const remote = (cmdFn) => cmdFn(); // [cite: 194]
  // Usage
  remote(turnOnCmd(light)); // ON [cite: 195]
  ```

**3. Iterator**

- **OOP Concept:** Provides sequential access to elements of an aggregate object without exposing its internal structure[cite: 198, 258]. Uses **Abstraction** (iterator interface) and **Encapsulation** (hides collection internals and iteration state).
- **Functional Concept:** Often implemented using **Closures** to maintain iteration state or **Generators** (in languages that support them like JS)[cite: 206]. **Higher-Order Functions** (`map`, `filter`, `reduce`) provide alternative ways to process collections.
- **Use Case:** Uniform traversal of collections[cite: 199, 259].

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
  } // [cite: 200, 201, 202]
  // Usage
  const iter = new Iterator([1, 2]);
  console.log(iter.next().value); // 1 [cite: 203, 204]
  ```

- **Functional Approach:**
  ```javascript
  // Iterator factory using closure for state
  const createIterator = (coll) => {
    let idx = 0;
    return () =>
      idx < coll.length ? { value: coll[idx++], done: false } : { done: true };
  }; // [cite: 206, 207, 208]
  // Usage
  const iterFn = createIterator([1, 2]);
  console.log(iterFn().value); // 1 [cite: 209, 210]
  ```
  _(Note: JavaScript's built-in iterators/generators (`Symbol.iterator`, `function_`) are idiomatic)\*

**4. Mediator**

- **OOP Concept:** Defines an object (mediator) that encapsulates how a set of objects (colleagues) interact[cite: 212, 272]. Promotes loose coupling. Uses **Abstraction** (mediator/colleague interfaces) and **Encapsulation** (mediator hides interaction logic).
- **Functional Concept:** A central function or module manages communication, often using an event bus or message passing mechanism[cite: 283]. Leverages **Closures** and **Higher-Order Functions** for callbacks/listeners.
- **Use Case:** Simplifying complex communication between objects[cite: 213, 273].

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
  } // [cite: 214, 215, 216]
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
  } // [cite: 217, 218, 219]
  // Usage
  const med = new Mediator();
  const c1 = new Colleague(med);
  const c2 = new Colleague(med);
  c1.send("Hi!"); // Received: Hi! [cite: 220, 221]
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
  }; // [cite: 223, 224, 284, 286]
  // Colleague factory
  const createColleague = (med, name) => {
    const self = {
      name,
      receive: (msg) => console.log(`${name} got: ${msg}`),
      send: (msg) => med.send(msg, self),
    };
    med.add(self);
    return self;
  }; // [cite: 287, 288]
  // Usage
  const med = createMediator();
  const c1 = createColleague(med, "C1");
  const c2 = createColleague(med, "C2");
  c1.send("Yo!"); // C2 got: Yo! [cite: 289, 290, 291]
  ```

**5. Memento**

- **OOP Concept:** Captures and externalizes an object's internal state without violating **Encapsulation**[cite: 361]. Uses three roles: Originator (object with state), Memento (stores state), Caretaker (manages mementos).
- **Functional Concept:** Uses **Closures** to capture state. The "memento" is often a function that, when called, returns the captured state[cite: 375]. Emphasizes **Immutability** if the state itself is immutable.
- **Use Case:** Undo/redo, saving state[cite: 362].

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
  } // [cite: 363, 364]
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
  } // [cite: 365, 366, 367, 368]
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
  } // [cite: 369, 370, 371]
  // Usage
  const org = new Originator("S1");
  const care = new Caretaker();
  care.add(org.save());
  org.setState("S2");
  org.restore(care.get(0));
  console.log(org.state); // S1 [cite: 372, 373]
  ```

- **Functional Approach:**
  ```javascript
  // Memento function (closure)
  const createMemento = (state) => () => state; // [cite: 375]
  // Originator factory
  const originator = (initialState) => {
    let state = initialState;
    return {
      setState: (s) => (state = s),
      save: () => createMemento(state),
      restore: (m) => (state = m()),
      getState: () => state,
    };
  }; // [cite: 376, 377, 378]
  // Usage
  const care = [];
  const org = originator("S1");
  care.push(org.save());
  org.setState("S2");
  org.restore(care[0]);
  console.log(org.getState()); // S1 [cite: 379, 380]
  ```

**6. Observer**

- **OOP Concept:** Defines a one-to-many dependency where objects (observers) subscribe to an object (subject) and get notified of state changes[cite: 150]. Uses **Abstraction** (subject/observer interfaces) and **Polymorphism**. The subject maintains a list of observers (**Composition**).
- **Functional Concept:** Implemented using callbacks or event emitters[cite: 159]. The subject is a function/object that maintains a list of callback functions (**Closures**) and invokes them on state change. **Higher-Order Functions** are used for subscription.
- **Use Case:** Event handling, UI updates[cite: 151].

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
  } // [cite: 152, 153, 155]
  // Observer interface
  class Observer {
    update(data) {
      console.log(`Got: ${data}`);
    }
  } // [cite: 156]
  // Usage
  const sub = new Subject();
  const ob1 = new Observer();
  sub.add(ob1);
  sub.notify("Update!"); // Got: Update! [cite: 157]
  ```

- **Functional Approach:**
  ```javascript
  // Observer factory
  const createObserver = (cb) => ({ update: cb }); // [cite: 159]
  // Subject factory
  const createSubject = () => {
    const cbs = [];
    return {
      add: (o) => cbs.push(o.update),
      notify: (data) => cbs.forEach((cb) => cb(data)),
    };
  }; // [cite: 160, 161, 162]
  // Usage
  const sub = createSubject();
  const ob1 = createObserver((d) => console.log(`Obs1: ${d}`));
  sub.add(ob1);
  sub.notify("Event!"); // Obs1: Event! [cite: 163]
  ```

**7. State**

- **OOP Concept:** Allows an object to alter behavior when its internal state changes[cite: 313, 330]. Uses **Composition** (context holds a state object) and **Polymorphism** (different state classes implement the same interface). **Abstraction** defines the state interface. **Encapsulation** hides state transitions.
- **Functional Concept:** Represents state as data and behavior as **Pure Functions** that take state and input, returning new state[cite: 323, 340]. State transitions are explicit function calls returning new state data. **Closures** can manage state within a context object/function.
- **Use Case:** Implementing state machines[cite: 314, 331].

- **OOP Approach:**

  ```javascript
  // State Interface
  class State {
    handle(ctx) {
      /*...*/
    }
  } // [cite: 315]
  // Concrete States
  class StateA extends State {
    handle(ctx) {
      console.log("State A -> B");
      ctx.setState(new StateB());
    }
  } // [cite: 316]
  class StateB extends State {
    handle(ctx) {
      console.log("State B -> A");
      ctx.setState(new StateA());
    }
  } // [cite: 317]
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
  } // [cite: 318, 319, 320]
  // Usage
  const ctx = new Context();
  ctx.request();
  ctx.request(); // State A -> B, State B -> A [cite: 321, 322]
  ```

- **Functional Approach:**
  ```javascript
  // State factory
  const createState = (handleFn) => ({ handle: handleFn }); // [cite: 323]
  // Define states (mutual recursion needs care)
  let stateA, stateB;
  stateA = createState((ctx) => {
    console.log("A->B");
    ctx.state = stateB;
  });
  stateB = createState((ctx) => {
    console.log("B->A");
    ctx.state = stateA;
  }); // [cite: 324, 325]
  // Context object
  const context = {
    state: stateA,
    setState: function (s) {
      this.state = s;
    },
  }; // [cite: 326]
  context.state.handle(context);
  context.state.handle(context); // A->B, B->A [cite: 326, 327]
  ```

**8. Strategy**

- **OOP Concept:** Defines a family of algorithms, encapsulates each, and makes them interchangeable[cite: 166, 226]. Uses **Abstraction** (strategy interface), **Polymorphism** (concrete strategies implement the interface), and **Composition** (context holds a strategy object).
- **Functional Concept:** Algorithms are represented by functions. The context takes the strategy function as an argument[cite: 176, 236]. Relies on **Higher-Order Functions**.
- **Use Case:** Selecting algorithms at runtime[cite: 167, 168, 227, 228].

- **OOP Approach:**

  ```javascript
  // Strategy Interface
  class PaymentStrategy {
    pay(amt) {
      /*...*/
    }
  } // [cite: 169]
  // Concrete Strategies
  class CreditCard extends PaymentStrategy {
    pay(amt) {
      console.log(`CC Pay: ${amt}`);
    }
  } // [cite: 170]
  class PayPal extends PaymentStrategy {
    pay(amt) {
      console.log(`PayPal Pay: ${amt}`);
    }
  } // [cite: 171]
  // Context using a strategy
  class Cart {
    constructor(strat) {
      this.strat = strat;
    }
    checkout(amt) {
      this.strat.pay(amt);
    }
  } // [cite: 172, 173]
  // Usage
  const cart = new Cart(new CreditCard());
  cart.checkout(100); // CC Pay: 100 [cite: 174]
  ```

- **Functional Approach:**
  ```javascript
  // Strategy functions
  const creditCardPay = (amt) => console.log(`CC Pay: ${amt}`); // [cite: 176]
  const payPalPay = (amt) => console.log(`PayPal Pay: ${amt}`); // [cite: 177]
  // Context function taking strategy function
  const checkout = (payFn, amt) => payFn(amt); // [cite: 177]
  // Usage
  checkout(creditCardPay, 100); // CC Pay: 100 [cite: 178]
  ```

**9. Template Method**

- **OOP Concept:** Defines an algorithm's skeleton in a method, deferring steps to subclasses. Relies on **Inheritance** and **Abstraction** (abstract methods for variant steps). **Polymorphism** allows subclasses to provide specific step implementations. **Encapsulation** protects the template method structure.
- **Functional Concept:** Can be simulated using **Higher-Order Functions**. A main function takes other functions as arguments for the variable steps, composing the overall algorithm. **Closures** can manage shared state if needed.
- **Use Case:** Defining a fixed algorithm structure while allowing customization of specific steps.

_(Note: Examples are illustrative as they weren't in the provided doc)_

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

- **OOP Concept:** Represents an operation to be performed on elements of an object structure without changing element classes[cite: 346]. Uses **Polymorphism** (visitor methods are called based on element type - often via double dispatch `element.accept(visitor)` which calls `visitor.visitElement(this)`) and **Abstraction** (visitor/element interfaces).
- **Functional Concept:** Uses **Pattern Matching** or conditional logic within a visitor function to apply different operations based on the data structure's type/shape[cite: 357]. Relies on **Higher-Order Functions** if the visitor itself is passed around.
- **Use Case:** Adding operations to complex structures (e.g., ASTs) without modifying them[cite: 347].

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
  } // [cite: 348, 349]
  // Element Interface
  class Element {
    accept(v) {
      /*...*/
    }
  } // [cite: 352]
  // Concrete Elements using double dispatch
  class ElementA extends Element {
    accept(v) {
      v.visitA(this);
    }
  } // [cite: 353]
  class ElementB extends Element {
    accept(v) {
      v.visitB(this);
    }
  } // [cite: 354]
  // Concrete Visitor
  class ConcreteVisitor extends Visitor {
    visitA(el) {
      console.log("Visit A");
    }
    visitB(el) {
      console.log("Visit B");
    }
  } // [cite: 350, 351]
  // Usage
  const elements = [new ElementA(), new ElementB()];
  const visitor = new ConcreteVisitor();
  elements.forEach((el) => el.accept(visitor)); // Visit A, Visit B [cite: 355]
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
  }; // [cite: 357] - Simplified example
  // Usage
  const elements = [{ type: "A" }, { type: "B" }];
  elements.forEach(visit); // Visit A, Visit B [cite: 358, 359] - Assumes type property
  ```



# misc
## Filtering with Flexibility: The Specification Pattern in Javascript

Tired of scattering your data filtering and selection logic throughout your codebase? Do tangled `if` statements and duplicated validation rules make your head spin? Enter the Specification pattern, a powerful design pattern that brings order and reusability to your filtering woes in Javascript, whether you favor Object-Oriented Programming (OOP) or a more Functional Programming (FP) style.

At its core, the Specification pattern is about decoupling the criteria for selecting an object from the object itself and the action being performed on it. It allows you to define business rules or filtering conditions as standalone, reusable units called "specifications." These specifications can then be combined using logical operators (AND, OR, NOT) to create more complex criteria, leading to cleaner, more maintainable, and highly flexible code.

Let's explore how you can implement and leverage this pattern in Javascript using both OOP and Functional approaches.

### The Specification Pattern in OOP

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
console.log("Person 1 satisfied:", isAdultWithLicenseOrStudent.isSatisfiedBy(person1)); // true (Adult AND (License OR not Student))
console.log("Person 2 satisfied:", isAdultWithLicenseOrStudent.isSatisfiedBy(person2)); // false (Minor AND (not License OR Student))
console.log("Person 3 satisfied:", isAdultWithLicenseOrStudent.isSatisfiedBy(person3)); // true (Adult AND (not License OR Student))
console.log("Person 4 satisfied:", isAdultWithLicenseOrStudent.isSatisfiedBy(person4)); // false (Minor AND (License OR not Student))
console.log("Person 5 satisfied:", isAdultWithLicenseOrStudent.isSatisfiedBy(person5)); // false (Adult AND (not License OR not Student))

console.log("\n--- isMinorStudent ---");
console.log("Person 1 satisfied:", isMinorStudent.isSatisfiedBy(person1)); // false (NOT Adult AND Student)
console.log("Person 2 satisfied:", isMinorStudent.isSatisfiedBy(person2)); // true (NOT Adult AND Student)
console.log("Person 3 satisfied:", isMinorStudent.isSatisfiedBy(person3)); // false (NOT Adult AND Student)
console.log("Person 4 satisfied:", isMinorStudent.isSatisfiedBy(person4)); // false (NOT Adult AND Student)
console.log("Person 5 satisfied:", isMinorStudent.isSatisfiedBy(person5)); // false (NOT Adult AND Student)
```

In this OOP example, by creating instances of simple specifications (`IsAdultSpecification`, `HasDrivingLicenseSpecification`, `IsStudentSpecification`) and using the `and`, `or`, and `not` methods provided by the base `Specification` class (which return the composite specification objects), we can build complex filtering rules in a clear, chainable, and object-oriented manner.

### The Specification Pattern with a Functional Approach

The Specification pattern fits beautifully within a functional programming paradigm as well. In this approach, specifications can be represented simply as functions that take a candidate object and return a boolean value (`true` if the candidate satisfies the specification, `false` otherwise). Combining specifications then involves using higher-order functions.

Here's how you might implement the Specification pattern functionally in Javascript:

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
console.log("Person 1 satisfied:", isAdultWithLicenseOrStudent(person1)); // true (Adult AND (License OR not Student))
console.log("Person 2 satisfied:", isAdultWithLicenseOrStudent(person2)); // false (Minor AND (not License OR Student))
console.log("Person 3 satisfied:", isAdultWithLicenseOrStudent(person3)); // true (Adult AND (not License OR Student))
console.log("Person 4 satisfied:", isAdultWithLicenseOrStudent(person4)); // false (Minor AND (License OR not Student))
console.log("Person 5 satisfied:", isAdultWithLicenseOrStudent(person5)); // false (Adult AND (not License OR not Student))

console.log("\n--- isMinorStudent ---");
console.log("Person 1 satisfied:", isMinorStudent(person1)); // false (NOT Adult AND Student)
console.log("Person 2 satisfied:", isMinorStudent(person2)); // true (NOT Adult AND Student)
console.log("Person 3 satisfied:", isMinorStudent(person3)); // false (NOT Adult AND Student)
console.log("Person 4 satisfied:", isMinorStudent(person4)); // false (NOT Adult AND Student)
console.log("Person 5 satisfied:", isMinorStudent(person5)); // false (NOT Adult AND Student)
```

In the functional approach, `isAdult`, `hasDrivingLicense`, and `isStudent` are simple functions. The `and`, `or`, and `not` functions are higher-order functions that take specification functions as arguments and return a *new* specification function representing the combined logic. This allows for building complex criteria by composing these functions, offering a concise and often more readable way to express the filtering rules in a functional style.

### Comparing the Approaches

Both OOP and functional approaches to the Specification pattern in Javascript achieve the same goal of decoupling filtering logic. However, they offer different flavors:

* **OOP:** Provides a more structured and explicit way to define specifications through classes and inheritance. This can be beneficial in larger codebases or when working with developers more familiar with OOP principles. The method chaining (`.and().or()`) can also lead to very readable composition.

* **Functional:** Offers a more concise and often more flexible way to define and combine specifications using functions and higher-order functions. This aligns well with a functional programming style and can lead to highly reusable utility functions for combining specifications.

The choice between the two approaches often comes down to team preference, project style guidelines, and the complexity of the specifications you need to define.

### Benefits of the Specification Pattern

Regardless of the implementation style, the Specification pattern offers several significant benefits:

* **Improved Readability:** Business rules are clearly defined in dedicated specification units, making the code easier to understand.
* **Enhanced Maintainability:** Changes to filtering logic are isolated within the relevant specifications, reducing the risk of introducing bugs in other parts of the codebase.
* **Increased Reusability:** Specifications can be reused across different parts of your application, avoiding code duplication.
* **Easier Testing:** Each specification can be tested in isolation, simplifying the testing process.
* **Flexibility:** Complex filtering criteria can be easily built by combining simpler specifications using logical operators.
* **Decoupling:** The logic for selecting objects is separated from the objects themselves and the operations that use the selection, leading to a more modular design.

### Conclusion

The Specification pattern is a valuable tool in your Javascript development arsenal for managing filtering and selection logic effectively. Whether you prefer the structured approach of OOP or the concise nature of functional programming, implementing the Specification pattern will lead to cleaner, more maintainable, and more flexible code. By isolating your business rules and making them first-class citizens, you empower yourself to build more robust and adaptable applications. Consider incorporating this pattern into your next project and experience the difference it can make.
