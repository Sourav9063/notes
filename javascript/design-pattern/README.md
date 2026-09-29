# Design Patterns in JavaScript: OOP vs. Functional Approaches

Design patterns offer battle-tested solutions to common software design challenges. Understanding them helps in building flexible, reusable, and maintainable code. This guide covers the Gang of Four (GoF) Creational, Structural, and Behavioral patterns, plus common JavaScript-specific patterns, highlighting their implementation in JavaScript using both Object-Oriented Programming (OOP) and Functional paradigms, and noting the specific programming concepts employed.

Each pattern lists its concept and use cases, a detailed OOP and functional example, a minimal example pair, and (collapsed) alternative examples. See the [Pattern Catalog](catalog.md) for one-line definitions and code sketches of 100 further patterns and pattern combinations.


## Creational Design Patterns

These patterns abstract the object instantiation process, making systems independent of how objects are created, composed, and represented.

### Singleton

- **Concept:** Ensures a class has only one instance and provides a single, global point of access to it. This is useful when exactly one object is needed to coordinate actions across the system.
- **Use Case:** Managing shared resources like logging services, database connection pools, or application-wide configuration.
- **Details:** The constructor is typically controlled (made private conceptually or by convention in JS) to prevent direct instantiation outside the class logic, forcing use of a static `getInstance` method.
- **Real-world Use Case:** Managing shared resources like a logging service, a database connection pool, or application-wide configuration settings where multiple instances would cause conflicts or inconsistencies.
- **OOP Concept:** Ensures a class has only one instance and provides a global access point. Uses **Encapsulation** to hide the constructor and control instance creation, often employing a static property to hold the single instance.
- **Functional Concept:** Achieved using **Closures** and the **Module Pattern** to create and hold a single instance within a private scope, exposing an accessor function.
- **When to use:** Managing shared resources like loggers or configuration.

#### Detailed example

- **OOP Approach:**

  ```javascript
  class Logger {
    static _instance = null;

    static getInstance() {
      if (Logger._instance === null) {
        Logger._instance = new Logger();
        // Initialize instance properties if needed
        Logger._instance.logs = [];
      }
      return Logger._instance;
    }

    // Private constructor simulation (convention)
    constructor() {
      if (Logger._instance) {
        // Optional: prevent direct instantiation after singleton exists
        // throw new Error("Use Logger.getInstance() to get the single instance.");
      }
      // Initial setup can go here if needed ONCE
    }

    log(message) {
      const timestamp = new Date().toISOString();
      this.logs.push({ message, timestamp });
      console.log(`LOG [${timestamp}]: ${message}`);
    }

    getLogs() {
      return this.logs;
    }
  }

  const logger1 = Logger.getInstance();
  const logger2 = Logger.getInstance();

  console.log(logger1 === logger2); // true
  logger1.log("Singleton test message.");
  ```

---

- **Functional Approach:**

  - **Concept:** Achieved using closures and module patterns to create and hold a single instance within a private scope.
  - **Example:**

    ```javascript
    // Functional Singleton using a closure (Module Pattern)
    const createLoggerSingleton = () => {
      let instance; // Private instance store

      // Logger implementation details (can be an object literal)
      const loggerImplementation = {
        logs: [],
        log(message) {
          const timestamp = new Date().toISOString();
          this.logs.push({ message, timestamp });
          console.log(`LOG [${timestamp}]: ${message}`);
        },
        getLogs() {
          return this.logs;
        },
      };

      // The function to get the singleton instance
      return {
        getInstance: () => {
          if (!instance) {
            instance = loggerImplementation;
          }
          return instance;
        },
      };
    };

    const loggerSingleton = createLoggerSingleton();
    const loggerFunc1 = loggerSingleton.getInstance();
    const loggerFunc2 = loggerSingleton.getInstance();

    console.log(loggerFunc1 === loggerFunc2); // true
    loggerFunc1.log("Functional singleton message.");
    console.log(loggerFunc2.getLogs().length); // 1
    ```

#### Minimal example

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

#### More notes

- **Concept:** Ensures only one instance exists and provides global access.
- **Functional Approach:** Achieved using closures and module patterns to create a single instance held in a private scope.

### Factory / Factory Method

- **Concept:** Provides an interface for creating objects but lets subclasses (or the factory itself) decide which class/object to instantiate/create. Decouples client from creation logic.
- **Use Case:** Creating different UI elements, user objects based on roles, or parsers based on file formats.
- **Details:** Simplifies object creation, especially when the exact type needed depends on runtime conditions or configuration. Variations include Simple Factory, Factory Method, and Abstract Factory.
- **Real-world Use Case:** Creating different types of UI elements (e.g., buttons, inputs) based on configuration, instantiating user objects based on roles (`AdminUser`, `GuestUser`), or selecting parsers based on file formats (`JSONParser`, `XMLParser`).
- **OOP Concept:** Defines an interface (often an abstract class or method) for creating an object, but lets subclasses alter the type of objects that will be created. Leverages **Polymorphism** (subclasses provide specific implementations of the creation method) and **Abstraction** (hides the exact creation logic from the client).
- **Functional Concept:** Uses a higher-order function (the factory function) to create and return other functions or objects based on input parameters. Employs **Closures** to encapsulate logic and **Higher-Order Functions** as the core creation mechanism.
- **When to use:** Creating objects without specifying the exact class.

#### Detailed example

- **OOP Approach (Simple Factory):**

  ```javascript
  // Base class (optional, but good practice)
  class Animal {
    constructor(name) {
      this.name = name;
    }
    speak() {
      throw new Error("Subclass must implement speak method.");
    }
  }
  class Dog extends Animal {
    speak() {
      console.log(`${this.name} says Woof!`);
    }
  }
  class Cat extends Animal {
    speak() {
      console.log(`${this.name} says Meow!`);
    }
  }

  // The Factory function/class
  class AnimalFactory {
    createAnimal(type, name) {
      switch (type.toLowerCase()) {
        case "dog":
          return new Dog(name);
        case "cat":
          return new Cat(name);
        default:
          throw new Error("Invalid animal type specified");
      }
    }
  }

  const factory = new AnimalFactory();
  const dog = factory.createAnimal("dog", "Buddy");
  dog.speak(); // Output: Buddy says Woof!
  ```

---

- **Functional Approach:**

  - **Concept:** A higher-order function acts as the factory, returning different functions or configured objects.
  - **Example:**

    ```javascript
    // Functional Factory: Returns different *functions* based on type
    const createGreeter = (language) => {
      switch (language.toLowerCase()) {
        case "english":
          return (name) => `Hello, ${name}!`;
        case "spanish":
          return (name) => `Hola, ${name}!`;
        default:
          return (name) => `Hi there, ${name}!`;
      }
    };

    const greetInEnglish = createGreeter("english");
    console.log(greetInEnglish("Alice")); // Output: Hello, Alice!

    // Can also return configured objects
    const createApiConfig = (env) => {
      const base = { timeout: 5000 };
      return env === "production"
        ? { ...base, url: "https://api.prod.com", retries: 3 }
        : { ...base, url: "https://api.dev.com", retries: 1 };
    };
    const prodConfig = createApiConfig("production");
    console.log(prodConfig.url); // Output: https://api.prod.com
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Creator`, `ConcreteCreator`, `Product`</summary>

- **Concept:** Defines an interface for creating an object, but lets subclasses alter the type of objects that will be created.
- **Use Case:** Creating objects in a super class but allowing subclasses to alter the type of created objects.

- **OOP Approach:**

  ```javascript
  // Creator
  class Creator {
    factoryMethod() {
      return new Product();
    }
  }

  // ConcreteCreator
  class ConcreteCreator extends Creator {
    factoryMethod() {
      return new ConcreteProduct();
    }
  }

  // Product
  class Product {
    operation() {
      return "Product operation";
    }
  }

  // ConcreteProduct
  class ConcreteProduct extends Product {
    operation() {
      return "ConcreteProduct operation";
    }
  }

  // Usage
  const creator = new ConcreteCreator();
  const product = creator.factoryMethod();
  console.log(product.operation()); // ConcreteProduct operation
  ```

- **Functional Approach:**

  - **Concept:** Uses functions to create objects.
  - **Example:**

    ```javascript
    // Factory Function
    const createProduct = () => ({
      operation: () => "Product operation",
    });

    // Usage
    const product = createProduct();
    console.log(product.operation()); // Product operation
    ```

</details>

<details>
<summary>Variant: `Greeter`, `greetings`, `englishGreeter`</summary>

- **Concept:** Defines an interface for creating objects, but allows subclasses to alter the type of objects that will be created.
- **Use Case:** Creating objects without specifying the exact class of object that will be created.

- **OOP Approach:**

  ```javascript
  class Greeter {
    constructor(language) {
      this.language = language;
    }

    greet(name) {
      const greetings = {
        en: `Hello, ${name}!`,
        es: `¡Hola, ${name}!`,
      };
      return greetings[this.language] || `Hello, ${name}!`;
    }
  }

  const englishGreeter = new Greeter("en");
  console.log(englishGreeter.greet("Alice")); // "Hello, Alice!"
  ```

- **Functional Approach:**
  - **Concept:** Uses a factory function to create objects based on input parameters.
  - **Example:**
    ```javascript
    const createGreeter = (lang) =>
      ({
        en: (name) => `Hello, ${name}!`,
        es: (name) => `¡Hola, ${name}!`,
      }[lang]);
    const greet = createGreeter("es")("Alice"); // "¡Hola, Alice!"
    ```

</details>

<details>
<summary>Variant: `createGreeter`, `greetInEnglish`, `greetInSpanish`</summary>

- **Concept:** Creates objects without specifying the exact class, decoupling client from creation logic.
- **OOP Approach:** (As previously shown, using classes and a factory function/method).
- **Functional Approach:** A simple higher-order function acts as the factory, returning different functions or objects based on input.

  ```javascript
  // Functional Factory: Returns different *functions* based on type
  const createGreeter = (language) => {
    switch (language.toLowerCase()) {
      case "english":
        return (name) => `Hello, ${name}!`;
      case "spanish":
        return (name) => `Hola, ${name}!`;
      default:
        return (name) => `Hi there, ${name}!`; // Default greeter
    }
  };

  const greetInEnglish = createGreeter("english");
  const greetInSpanish = createGreeter("spanish");

  console.log(greetInEnglish("Alice")); // Output: Hello, Alice!
  console.log(greetInSpanish("Bob")); // Output: Hola, Bob!

  // Can also return objects if needed
  const createConfig = (env) => {
    const baseConfig = { port: 8080 };
    if (env === "production") {
      return { ...baseConfig, logLevel: "warn", useHttps: true };
    } else {
      return { ...baseConfig, logLevel: "debug", useHttps: false };
    }
  };
  const devConfig = createConfig("development");
  console.log(devConfig.logLevel); // Output: debug
  ```

</details>

<details>
<summary>Variant: `Animal`, `Dog`, `Cat`</summary>

- **Concept:** Provides an interface for creating objects but lets subclasses (or the factory method itself) decide which class to instantiate. It decouples the client code from the specific classes it needs to create.
- **Example (Simple Factory):**

  ```javascript
  // Base class (optional, but good practice)
  class Animal {
    constructor(name) {
      this.name = name;
    }
    speak() {
      throw new Error("Subclass must implement speak method.");
    }
  }

  class Dog extends Animal {
    speak() {
      console.log(`${this.name} says Woof!`);
    }
  }
  class Cat extends Animal {
    speak() {
      console.log(`${this.name} says Meow!`);
    }
  }

  // The Factory function
  function createAnimal(type, name) {
    switch (type.toLowerCase()) {
      case "dog":
        return new Dog(name); //
      case "cat":
        return new Cat(name); //
      default:
        throw new Error("Invalid animal type specified"); //
    }
  }

  const dog = createAnimal("dog", "Buddy");
  const cat = createAnimal("cat", "Whiskers");
  dog.speak(); // Output: Buddy says Woof!
  cat.speak(); // Output: Whiskers says Meow!
  ```

</details>

<details>
<summary>Variant: `createGreeter`, `greet`</summary>

_Creates objects based on input._

```javascript
const createGreeter = (lang) =>
  ({
    en: (name) => `Hello, ${name}!`,
    es: (name) => `Hola, ${name}!`,
  }[lang]);
const greet = createGreeter("es")("Alice"); // "Hola, Alice!"
```

</details>

### Abstract Factory

- **Concept:** Provides an interface for creating families of related or dependent objects without specifying their concrete classes. Deals with creating _sets_ of related objects.
- **Use Case:** Creating UI components for different operating systems (Windows buttons/menus vs. Mac buttons/menus), swapping database implementations (SQL factory vs. NoSQL factory), managing different themes in an application.
- **OOP Concept:** Provides an interface for creating _families_ of related or dependent objects without specifying their concrete classes. Relies heavily on **Abstraction** (defining interfaces for factories and products) and **Polymorphism** (concrete factories implement the interfaces to create specific product families).
- **Functional Concept:** Uses factory functions that return objects containing other factory functions, creating families of related objects/functions. Leverages **Closures** to encapsulate theme-specific creation logic and **Higher-Order Functions** to produce the UI elements.
- **When to use:** Creating families of related objects where the specific types aren't known upfront.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Abstract Product Interfaces
  class Button {
    render() {}
  }
  class Checkbox {
    render() {}
  }

  // Concrete Products for Theme A
  class ButtonA extends Button {
    render() {
      console.log("Rendering Button - Theme A");
    }
  }
  class CheckboxA extends Checkbox {
    render() {
      console.log("Rendering Checkbox - Theme A");
    }
  }

  // Concrete Products for Theme B
  class ButtonB extends Button {
    render() {
      console.log("Rendering Button -- Theme B --");
    }
  }
  class CheckboxB extends Checkbox {
    render() {
      console.log("Rendering Checkbox -- Theme B --");
    }
  }

  // Abstract Factory Interface
  class UIFactory {
    createButton() {}
    createCheckbox() {}
  }

  // Concrete Factories
  class FactoryA extends UIFactory {
    createButton() {
      return new ButtonA();
    }
    createCheckbox() {
      return new CheckboxA();
    }
  }
  class FactoryB extends UIFactory {
    createButton() {
      return new ButtonB();
    }
    createCheckbox() {
      return new CheckboxB();
    }
  }

  // Client code uses a factory to create a family of related objects
  const createUI = (factory) => {
    const button = factory.createButton();
    const checkbox = factory.createCheckbox();
    button.render();
    checkbox.render();
  };

  console.log("--- Using Factory A (Theme A) ---");
  const factoryA = new FactoryA();
  createUI(factoryA);

  console.log("\n--- Using Factory B (Theme B) ---");
  const factoryB = new FactoryB();
  createUI(factoryB);
  ```

---

- **Functional Approach:**

  - **Concept:** Use configuration objects or higher-order functions that return sets of related functions or configured objects based on a theme/type parameter.
  - **Example:**

    ```javascript
    // Functions representing "products" for Theme A
    const renderButtonA = () => "Button (Theme A)";
    const renderCheckboxA = () => "Checkbox (Theme A)";

    // Functions representing "products" for Theme B
    const renderButtonB = () => "Button -- Theme B --";
    const renderCheckboxB = () => "Checkbox -- Theme B --";

    // Functional Factory: Returns an object containing related creation functions
    const getUIComponentCreators = (theme) => {
      switch (theme.toLowerCase()) {
        case "a":
          return {
            createButton: renderButtonA,
            createCheckbox: renderCheckboxA,
          };
        case "b":
          return {
            createButton: renderButtonB,
            createCheckbox: renderCheckboxB,
          };
        default:
          throw new Error(`Unknown theme: ${theme}`);
      }
    };

    // Client code uses the creators returned by the factory
    const buildFunctionalUI = (theme) => {
      const creators = getUIComponentCreators(theme);
      const button = creators.createButton();
      const checkbox = creators.createCheckbox();
      console.log(`Rendering: ${button}, ${checkbox}`);
    };

    console.log("--- Func Using Theme A ---");
    buildFunctionalUI("a"); // Output: Rendering: Button (Theme A), Checkbox (Theme A)

    console.log("\n--- Func Using Theme B ---");
    buildFunctionalUI("b"); // Output: Rendering: Button -- Theme B --, Checkbox -- Theme B --
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `AbstractFactory`, `ConcreteFactory1`, `ConcreteFactory2`</summary>

**Concept:** Provides an interface for creating families of related or dependent objects without specifying their concrete classes.

**Use Case:** Creating families of related products without specifying their concrete classes.


**OOP Approach:**

```javascript
// AbstractFactory
class AbstractFactory {
  createProductA() {
    throw new Error("createProductA() must be implemented");
  }

  createProductB() {
    throw new Error("createProductB() must be implemented");
  }
}

// ConcreteFactory1
class ConcreteFactory1 extends AbstractFactory {
  createProductA() {
    return new ProductA1();
  }

  createProductB() {
    return new ProductB1();
  }
}

// ConcreteFactory2
class ConcreteFactory2 extends AbstractFactory {
  createProductA() {
    return new ProductA2();
  }

  createProductB() {
    return new ProductB2();
  }
}

// AbstractProductA
class AbstractProductA {
  operationA() {
    throw new Error("operationA() must be implemented");
  }
}

// AbstractProductB
class AbstractProductB {
  operationB() {
    throw new Error("operationB() must be implemented");
  }
}

// ConcreteProductA1
class ProductA1 extends AbstractProductA {
  operationA() {
    return "ProductA1 operationA";
  }
}

// ConcreteProductA2
class ProductA2 extends AbstractProductA {
  operationA() {
    return "ProductA2 operationA";
  }
}

// ConcreteProductB1
class ProductB1 extends AbstractProductB {
  operationB() {
    return "ProductB1 operationB";
  }
}

// ConcreteProductB2
class ProductB2 extends AbstractProductB {
  operationB() {
    return "ProductB2 operationB";
  }
}

// Usage
const factory1 = new ConcreteFactory1();
const productA1 = factory1.createProductA();
const productB1 = factory1.createProductB();
console.log(productA1.operationA()); // ProductA1 operationA
console.log(productB1.operationB()); // ProductB1 operationB
```


**Functional Approach:**

```javascript
// Factory Functions
const createFactory1 = () => ({
  createProductA: () => ({ operationA: () => "ProductA1 operationA" }),
  createProductB: () => ({ operationB: () => "ProductB1 operationB" }),
});

const createFactory2 = () => ({
  createProductA: () => ({ operationA: () => "ProductA2 operationA" }),
  createProductB: () => ({ operationB: () => "ProductB2 operationB" }),
});

// Usage
const factory1 = createFactory1();
const productA1 = factory1.createProductA();
const productB1 = factory1.createProductB();
console.log(productA1.operationA()); // ProductA1 operationA
console.log(productB1.operationB()); // ProductB1 operationB
```

</details>

<details>
<summary>Variant: `DarkTheme`, `LightTheme`, `UIFactory`</summary>

- **Concept:** Provides an interface for creating families of related or dependent objects without specifying their concrete classes.
- **Use Case:** Creating families of related objects without specifying their concrete classes.

- **OOP Approach:**

  ```javascript
  class DarkTheme {
    createButton() {
      return "Dark Button";
    }

    createDialog() {
      return "Dark Dialog";
    }
  }

  class LightTheme {
    createButton() {
      return "Light Button";
    }

    createDialog() {
      return "Light Dialog";
    }
  }

  class UIFactory {
    constructor(theme) {
      this.theme = theme;
    }

    createUI() {
      if (this.theme === "dark") {
        return new DarkTheme();
      } else {
        return new LightTheme();
      }
    }
  }

  const uiFactory = new UIFactory("dark");
  const ui = uiFactory.createUI();
  console.log(ui.createButton()); // "Dark Button"
  ```

- **Functional Approach:**
  - **Concept:** Uses factory functions to create related objects.
  - **Example:**
    ```javascript
    const createTheme = (theme) => ({
      button: theme === "dark" ? () => "Dark Button" : () => "Light Button",
      dialog: theme === "dark" ? () => "Dark Dialog" : () => "Light Dialog",
    });
    const darkUI = createTheme("dark");
    ```

</details>

### Builder

- **Concept:** Separates the construction of a complex object from its representation, allowing the same construction process to create different representations. Useful for objects with many optional parameters or configurations.
- **Use Case:** Building complex configuration objects, constructing database queries, creating complex UI components with many options.
- **OOP Concept:** Separates object construction from its representation. Uses **Encapsulation** to hide the internal state during construction and provides step-by-step methods, often returning the builder itself (fluent interface) for chaining.
- **Functional Concept:** Employs **Closures** to maintain the state of the object being built across function calls and often uses **Function Chaining** or **Composition** to apply steps sequentially.
- **When to use:** Constructing complex objects step-by-step.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // The complex object we want to build
  class HttpClient {
    constructor(builder) {
      this.method = builder.method || "GET";
      this.url = builder.url;
      this.headers = builder.headers || {};
      this.body = builder.body || null;
      this.timeout = builder.timeout || 10000;
    }
    // Method to execute request (simplified)
    execute() {
      console.log(
        `Executing ${this.method} request to ${this.url} with timeout ${this.timeout}`,
      );
      // ... actual fetch logic ...
    }
  }

  // The Builder class
  class HttpClientBuilder {
    constructor(url) {
      // Required parameter
      this.url = url;
    }
    setMethod(method) {
      this.method = method;
      return this;
    } // Return this for chaining
    setHeaders(headers) {
      this.headers = headers;
      return this;
    }
    setBody(body) {
      this.body = body;
      return this;
    }
    setTimeout(timeout) {
      this.timeout = timeout;
      return this;
    }

    build() {
      // Creates the final object
      return new HttpClient(this);
    }
  }

  // Client uses the builder
  const client = new HttpClientBuilder("/api/users")
    .setMethod("POST")
    .setHeaders({
      "Content-Type": "application/json",
      Authorization: "Bearer xyz",
    })
    .setBody(JSON.stringify({ name: "Alice" }))
    .setTimeout(5000)
    .build();

  client.execute();
  // Output: Executing POST request to /api/users with timeout 5000
  ```

---

- **Functional Approach:**

  - **Concept:** Can be approximated using functions that progressively build up a configuration object, often leveraging function composition or currying. Less formal than the OOP Builder class structure.
  - **Example:**

    ```javascript
    // Base configuration function
    const createBaseConfig = (url) => ({
      url,
      method: "GET",
      headers: {},
      timeout: 10000,
    });

    // Functions to add/modify configuration properties (return new object)
    const withMethod = (method) => (config) => ({ ...config, method });
    const withHeaders = (headers) => (config) => ({
      ...config,
      headers: { ...config.headers, ...headers },
    });
    const withTimeout = (timeout) => (config) => ({ ...config, timeout });
    const withBody = (body) => (config) => ({ ...config, body });

    // Helper for function composition (pipe)
    const pipe =
      (...fns) =>
      (initialValue) =>
        fns.reduce((acc, fn) => fn(acc), initialValue);

    // Build configuration functionally
    const buildClientConfig = pipe(
      withMethod("POST"),
      withHeaders({ "Content-Type": "application/json" }),
      withHeaders({ Authorization: "Bearer xyz" }), // Headers merge
      withBody(JSON.stringify({ name: "Bob" })),
      withTimeout(3000),
    );

    const functionalConfig = buildClientConfig(createBaseConfig("/api/data"));

    console.log(functionalConfig);
    /* Output:
     {
       url: '/api/data',
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         Authorization: 'Bearer xyz'
       },
       timeout: 3000,
       body: '{"name":"Bob"}'
     }
    */
    // A separate function would consume this config object to make the request
    ```

#### Minimal example

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

#### More notes

- **Concept:** Uses a builder function to construct objects step by step.

#### Alternative examples

<details>
<summary>Variant: `Builder`, `Product`, `builder`</summary>

- **Concept:** Separates the construction of a complex object from its representation, allowing the same construction process to create different representations.
- **Use Case:** Constructing complex objects like a meal with multiple courses or a document with various sections.

- **OOP Approach:**

  ```javascript
  // Builder
  class Builder {
    constructor() {
      this.product = new Product();
    }

    buildPart1() {
      this.product.part1 = "Part1";
    }

    buildPart2() {
      this.product.part2 = "Part2";
    }

    getResult() {
      return this.product;
    }
  }

  // Product
  class Product {
    constructor() {
      this.part1 = "";
      this.part2 = "";
    }
  }

  // Usage
  const builder = new Builder();
  builder.buildPart1();
  builder.buildPart2();
  const product = builder.getResult();
  console.log(product); // Product { part1: 'Part1', part2: 'Part2' }
  ```

- **Functional Approach:**

  - **Concept:** Uses functions to build parts and assemble them.
  - **Example:**

    ```javascript
    // Builder Function
    const createBuilder = () => {
      let product = {};
      return {
        buildPart1: () => {
          product.part1 = "Part1";
        },
        buildPart2: () => {
          product.part2 = "Part2";
        },
        getResult: () => product,
      };
    };

    // Usage
    const builder = createBuilder();
    builder.buildPart1();
    builder.buildPart2();
    const product = builder.getResult();
    console.log(product); // { part1: 'Part1', part2: 'Part2' }
    ```

</details>

### Prototype

- **Concept:** Specifies the kinds of objects to create using a prototypical instance, and creates new objects by copying (cloning) this prototype.
- **Use Case:** When object creation is expensive (e.g., involves database calls, complex setup), or when you want to create variations of an object easily without going through a complex constructor or factory process. JavaScript's prototypal inheritance is related but this pattern focuses on explicit cloning.
- **OOP Concept:** Specifies the kinds of objects to create using a prototypical instance and creates new objects by copying (cloning) this prototype. Relies on **Inheritance** (often implicitly via JavaScript's prototype chain) and the ability to copy an existing object's state. **Encapsulation** protects the original object.
- **Functional Concept:** Achieves cloning using object spread syntax (`...`) or `Object.assign()` to create new objects with copied properties. Emphasizes **Immutability** by creating new instances instead of modifying the original.
- **When to use:** Cloning objects, especially when instantiation is expensive.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Prototype Interface/Base Class (with a clone method)
  class ShapePrototype {
    constructor(color) {
      this.color = color;
    }
    clone() {
      throw new Error("Subclass must implement clone.");
    }
    display() {}
  }

  // Concrete Prototypes
  class Rectangle extends ShapePrototype {
    constructor(width, height, color) {
      super(color);
      this.width = width;
      this.height = height;
      console.log(
        `Creating Rectangle prototype (${width}x${height}, ${color})`,
      );
    }
    clone() {
      // Create a new object by copying properties
      // For complex objects, might need deep cloning
      console.log(
        `Cloning Rectangle (${this.width}x${this.height}, ${this.color})`,
      );
      return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
      // Or using structuredClone for deep copy in modern JS:
      // return structuredClone(this); // note: result is a plain object, class prototype/methods are lost
    }
    display() {
      console.log(
        `Rectangle: ${this.width}x${this.height}, Color: ${this.color}`,
      );
    }
  }

  // Client uses prototypes to create new objects
  const redRectPrototype = new Rectangle(10, 5, "Red"); // Create initial prototype

  // Clone the prototype to create new instances
  const rect1 = redRectPrototype.clone();
  rect1.width = 12; // Modify the clone

  const rect2 = redRectPrototype.clone();
  rect2.color = "Blue"; // Modify the clone

  redRectPrototype.display(); // Original prototype
  rect1.display(); // Modified clone 1
  rect2.display(); // Modified clone 2
  ```

---

- **Functional Approach:**

  - **Concept:** Focus on creating new state objects based on existing ones, typically using object spread syntax (`...`) or functions that merge properties onto a base template object. Explicit `clone` methods are less common.
  - **Example:**

    ```javascript
    // Define a "prototype" or template object
    const baseButtonConfig = {
      text: "Click Me",
      padding: 10,
      color: "blue",
      onClick: () => console.log("Button clicked!"),
    };

    // Function to create variations by merging with the base
    const createButtonVariant = (overrides) => {
      console.log("Creating button variant with overrides:", overrides);
      // Use spread syntax to "clone" and override
      return { ...baseButtonConfig, ...overrides };
    };

    // Create new button configurations based on the prototype/template
    const submitButtonConfig = createButtonVariant({
      text: "Submit",
      color: "green",
      onClick: () => console.log("Submitting form..."),
    });

    const cancelButtonConfig = createButtonVariant({
      text: "Cancel",
      color: "red",
      onClick: () => console.log("Cancelling..."),
    });

    // Simulate rendering/using the configs
    console.log("Submit Button:", submitButtonConfig);
    submitButtonConfig.onClick();

    console.log("Cancel Button:", cancelButtonConfig);
    cancelButtonConfig.onClick();

    console.log("Base Button:", baseButtonConfig); // Base remains unchanged
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Prototype`, `ConcretePrototype`, `prototype`</summary>

- **Concept:** Specifies the kind of objects to create using a prototypical instance, and create new objects by copying this prototype.
- **Use Case:** Creating objects based on a template of an existing object through cloning.

- **OOP Approach:**

  ```javascript
  // Prototype
  class Prototype {
    clone() {
      return Object.create(this);
    }
  }

  // Concrete Prototype
  class ConcretePrototype extends Prototype {
    constructor(name) {
      super();
      this.name = name;
    }
  }

  // Usage
  const prototype = new ConcretePrototype("Prototype1");
  const clone = prototype.clone();
  console.log(clone.name); // Prototype1
  ```

- **Functional Approach:**

  - **Concept:** Uses functions to create objects and clone them.
  - **Example:**

    ```javascript
    // Prototype Function
    const createPrototype = (name) => ({ name });

    // Clone Function
    const clonePrototype = (proto) => ({ ...proto });

    // Usage
    const prototype = createPrototype("Prototype1");
    const clone = clonePrototype(prototype);
    console.log(clone.name); // Prototype1
    ```

</details>

<details>
<summary>Variant: `Config`, `defaultConfig`, `darkConfig`</summary>

- **Concept:** Specifies the kinds of objects to create using a prototypical instance, and create new objects by copying this prototype.
- **Use Case:** Cloning objects to create new instances.

- **OOP Approach:**

  ```javascript
  class Config {
    constructor(theme = "light") {
      this.theme = theme;
    }

    clone() {
      return new Config(this.theme);
    }
  }

  const defaultConfig = new Config();
  const darkConfig = defaultConfig.clone();
  darkConfig.theme = "dark";
  console.log(darkConfig.theme); // "dark"
  ```

- **Functional Approach:**
  - **Concept:** Uses object spread or `Object.assign()` to clone objects.
  - **Example:**
    ```javascript
    const baseConfig = { theme: "light" };
    const createDarkConfig = () => ({ ...baseConfig, theme: "dark" });
    ```

</details>

---

## Structural Design Patterns

These patterns deal with assembling objects and classes into larger structures, maintaining flexibility and efficiency.

### Adapter

- **Concept:** Allows objects with incompatible interfaces to work together by acting as a bridge or wrapper.
- **Use Case:** Integrating third-party libraries, legacy code, or different subsystems with incompatible APIs.
- **Details:** Useful for integrating third-party libraries, legacy code, or different subsystems that weren't designed to work together directly.
- **Real-world Use Case:** Making a new logging library conform to an older `logMessage(str)` interface used throughout your app, adapting a third-party API response structure to match your application's data model, or making different database drivers usable through a single data access layer interface.
- **OOP Concept:** Converts the interface of a class into another interface clients expect. Uses **Composition** (holding an instance of the adaptee) or **Inheritance** (inheriting from the target and adaptee - less common in JS) and **Encapsulation** to wrap the adaptee. **Polymorphism** allows the adapter to be used where the target is expected.
- **Functional Concept:** Wraps one function with another function that translates the arguments or return values to match the required interface. Leverages **Higher-Order Functions** (the adapter function takes/returns functions) and **Closures**.
- **When to use:** Making incompatible interfaces work together.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Existing interface expected by client
  class OldPaymentProcessor {
    process(amount) {
      console.log(`Processing $${amount} via Old System.`);
    }
  }
  // New service with a different interface
  class NewPaymentGateway {
    submitPayment(details) {
      console.log(
        `Submitting ${details.currency}${details.value} via New Gateway.`,
      );
    }
  }

  // Adapter
  class PaymentAdapter extends OldPaymentProcessor {
    constructor(newGateway) {
      super();
      this.gateway = newGateway;
    }
    process(amount) {
      // Adapt the old call to the new interface
      this.gateway.submitPayment({ value: amount, currency: "USD" });
    }
  }

  // Client code
  const processor = new PaymentAdapter(new NewPaymentGateway());
  processor.process(100); // Output: Submitting USD100 via New Gateway.
  ```

---

- **Functional Approach:**

  - **Concept:** A wrapper function adapts arguments or return values between incompatible function signatures.
  - **Example:**

    ```javascript
    // Client expects: (message: string) => void
    const displayNotification = (notifyFn) => notifyFn("Operation Successful!");

    // Service function signature: (options: { text: string, level: string }) => boolean
    const sendAlert = (options) => {
      console.log(`ALERT [${options.level}]: ${options.text}`);
      return true;
    };

    // Functional Adapter
    const alertAdapter = (message) => {
      // Adapt the simple message to the options object
      return sendAlert({ text: message, level: "info" });
    };

    displayNotification(alertAdapter);
    // Output: ALERT [info]: Operation Successful!
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `OldLogger`, `NewLogger`, `LoggerAdapter`</summary>

- **Concept:** Allows objects with incompatible interfaces to work together. It acts as a bridge, converting the interface of one object into an interface expected by the client.
- **Example:**

  ```javascript
  // Existing interface expected by client
  class OldLogger {
    logMessage(text) {
      console.log(`OLD LOG: ${text}`);
    }
  }

  // New library with a different interface
  class NewLogger {
    writeLog(level, message) {
      console.log(`NEW LOG [${level}]: ${message}`);
    }
  }

  // Adapter
  class LoggerAdapter extends OldLogger {
    constructor(newLoggerInstance) {
      super();
      this.newLogger = newLoggerInstance;
    }

    logMessage(text) {
      // Adapt the old call to the new interface
      this.newLogger.writeLog("INFO", text);
    }
  }

  // Client code expects OldLogger interface
  function clientCode(loggerInstance) {
    loggerInstance.logMessage("This message should be logged.");
  }

  const newLogger = new NewLogger();
  const adaptedLogger = new LoggerAdapter(newLogger);

  clientCode(adaptedLogger); // Output: NEW LOG [INFO]: This message should be logged.
  ```

  _(Note: The Duck/Turkey example is also a classic illustration)._

</details>

<details>
<summary>Variant: `Target`, `Adaptee`, `Adapter`</summary>

**Concept:** Allows incompatible interfaces to work together by providing a wrapper that translates one interface into another.

**Use Case:** Integrating a new system with an existing one that has a different interface.

**OOP Approach:**

```javascript
// Target
class Target {
  request() {
    return "Target: The default behavior.";
  }
}

// Adaptee
class Adaptee {
  specificRequest() {
    return ".eetpadA eht fo roivaheb si tahT";
  }
}

// Adapter
class Adapter extends Target {
  constructor(adaptee) {
    super();
    this.adaptee = adaptee;
  }

  request() {
    return `Adapter: (TRANSLATED) ${this.adaptee
      .specificRequest()
      .split("")
      .reverse()
      .join("")}`;
  }
}

// Usage
const adaptee = new Adaptee();
const adapter = new Adapter(adaptee);
console.log(adapter.request()); // Adapter: (TRANSLATED) That is the behavior of Adapter.
```

**Functional Approach:**

```javascript
// Adaptee
const specificRequest = () => ".eetpadA eht fo roivaheb si tahT";

// Adapter Function
const adapter = (specificRequest) => () =>
  `Adapter: (TRANSLATED) ${specificRequest().split("").reverse().join("")}`;

// Usage
const adaptedRequest = adapter(specificRequest);
console.log(adaptedRequest()); // Adapter: (TRANSLATED) That is the behavior of Adapter.
```

</details>

<details>
<summary>Variant: `OldSystem`, `NewSystem`, `Adapter`</summary>

- **Concept:** Converts one interface to another expected by the client.
- **Use Case:** Allowing incompatible interfaces to work together.

- **OOP Approach:**

  ```javascript
  class OldSystem {
    request() {
      return "Old system response";
    }
  }

  class NewSystem {
    specificRequest() {
      return "New system response";
    }
  }

  class Adapter {
    constructor(newSystem) {
      this.newSystem = newSystem;
    }

    request() {
      return this.newSystem.specificRequest();
    }
  }

  const newSystem = new NewSystem();
  const adapter = new Adapter(newSystem);
  console.log(adapter.request()); // "New system response"
  ```

- **Functional Approach:**
  - **Concept:** Wraps the new system's function to match the old system's interface.
  - **Example:**
    ```javascript
    const oldToNewAPI = (oldFn) => (args) => oldFn(args.x, args.y);
    ```

</details>

<details>
<summary>Variant: `clientProcessor`, `data`, `serviceAction`</summary>

- **Concept:** Allows incompatible interfaces to work together.
- **OOP Approach:** (As previously shown, using wrapper classes).
- **Functional Approach:** A simple wrapper function adapts the arguments or return value of one function to match the signature expected by the client.

  ```javascript
  // Client expects a function that takes one argument: (data)
  const clientProcessor = (processFn) => {
    const data = { value: 42, user: "guest" };
    console.log("Client processing result:", processFn(data));
  };

  // Service function has a different signature: (value, options)
  const serviceAction = (value, options) => {
    console.log(
      `Service action called with value=${value}, user=${options.user}`,
    );
    return value * (options.isAdmin ? 10 : 2);
  };

  // Functional Adapter
  const serviceAdapter = (data) => {
    // Adapt the single 'data' object to the two arguments needed by serviceAction
    const options = { user: data.user, isAdmin: data.user === "admin" };
    return serviceAction(data.value, options);
  };

  // Client uses the adapter function
  clientProcessor(serviceAdapter);
  // Output:
  // Service action called with value=42, user=guest
  // Client processing result: 84
  ```

</details>

### Bridge

- **Concept:** Decouples an abstraction from its implementation so the two can vary independently. Uses composition over inheritance to connect the abstraction and implementation.
- **Use Case:** Supporting multiple platforms or APIs for a high-level abstraction (e.g., a generic `RemoteControl` working with different `Device` implementations like TV, Radio), separating UI components from underlying drawing APIs. Avoids combinatorial explosion of subclasses.
- **OOP Concept:** Decouples an abstraction from its implementation so they can vary independently. Uses **Abstraction** (for both the main abstraction and the implementor interface) and **Composition** (the abstraction holds a reference to an implementor object). **Polymorphism** allows swapping different implementations.
- **Functional Concept:** Separates concerns using **Higher-Order Functions**. The main function (abstraction) takes an implementation function as an argument. **Closures** can maintain state if needed.
- **When to use:** When abstraction and implementation should evolve independently.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Implementation Interface (the "Implementor")
  class DrawingAPI {
    drawCircle(x, y, radius) {}
  }

  // Concrete Implementations
  class DrawingAPI1 extends DrawingAPI {
    drawCircle(x, y, radius) {
      console.log(`APIv1: Drawing circle at (${x},${y}) radius ${radius}`);
    }
  }
  class DrawingAPI2 extends DrawingAPI {
    drawCircle(x, y, radius) {
      console.log(`API_v2 -> draw_circle(${x}, ${y}, ${radius})`);
    }
  }

  // Abstraction Interface/Base Class
  class Shape {
    constructor(drawingAPI) {
      this.drawingAPI = drawingAPI; // Holds reference to the implementation
    }
    draw() {} // High-level operation
    resize(factor) {} // Another high-level op
  }

  // Refined Abstraction
  class CircleShape extends Shape {
    constructor(x, y, radius, drawingAPI) {
      super(drawingAPI);
      this.x = x;
      this.y = y;
      this.radius = radius;
    }
    draw() {
      // Delegates drawing to the implementation API
      this.drawingAPI.drawCircle(this.x, this.y, this.radius);
    }
    resize(factor) {
      this.radius *= factor;
    }
  }

  // Usage - Combine different abstractions with different implementations
  console.log("--- Circle with API v1 ---");
  const circle1 = new CircleShape(1, 2, 3, new DrawingAPI1());
  circle1.draw();

  console.log("\n--- Circle with API v2 ---");
  const circle2 = new CircleShape(5, 6, 7, new DrawingAPI2());
  circle2.draw();
  circle2.resize(2);
  circle2.draw(); // Radius is now 14
  ```

---

- **Functional Approach:**

  - **Concept:** Pass the implementation (specific functions) as arguments to the abstraction function. The abstraction function uses these passed-in functions to perform its work.
  - **Example:**

    ```javascript
    // Implementation functions (Implementors)
    const drawCircleAPI1 = (x, y, radius) =>
      `APIv1 Circle: (${x},${y}) r${radius}`;
    const drawCircleAPI2 = (x, y, radius) =>
      `API_v2 Circle -> (${x}, ${y}, ${radius})`;

    // Abstraction function: Takes implementation function and shape data
    const createCircleRenderer = (drawApi) => {
      return (circleData) => {
        // circleData holds state {x, y, radius}
        console.log("Func Drawing Circle...");
        // Call the passed-in drawing implementation
        const result = drawApi(circleData.x, circleData.y, circleData.radius);
        console.log(result);
        return result; // Return result if needed
      };
    };

    // Function to modify shape data (returns new state)
    const resizeCircle = (circleData, factor) => {
      return { ...circleData, radius: circleData.radius * factor };
    };

    // Usage: Combine abstraction with different implementations
    let circleState = { x: 10, y: 20, radius: 5 };

    console.log("--- Func Circle with API v1 ---");
    const renderWithAPI1 = createCircleRenderer(drawCircleAPI1);
    renderWithAPI1(circleState); // Output: APIv1 Circle: (10,20) r5

    console.log("\n--- Func Circle with API v2 ---");
    const renderWithAPI2 = createCircleRenderer(drawCircleAPI2);
    circleState = resizeCircle(circleState, 3); // Update state immutably
    renderWithAPI2(circleState); // Output: API_v2 Circle -> (10, 20, 15)
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Renderer`, `VectorRenderer`, `RasterRenderer`</summary>

- **Concept:** Decouples abstraction from implementation, allowing them to vary independently.
- **Use Case:** Designing systems where abstractions and their implementations can evolve independently.

- **OOP Approach:**

  ```javascript
  class Renderer {
    renderCircle(radius) {
      throw "renderCircle not implemented";
    }
  }

  class VectorRenderer extends Renderer {
    renderCircle(radius) {
      console.log(`Drawing a circle with radius ${radius}`);
    }
  }

  class RasterRenderer extends Renderer {
    renderCircle(radius) {
      console.log(`Drawing pixels for a circle with radius ${radius}`);
    }
  }

  class Shape {
    constructor(renderer) {
      this.renderer = renderer;
    }

    draw() {
      throw "draw not implemented";
    }
  }

  class Circle extends Shape {
    constructor(renderer, radius) {
      super(renderer);
      this.radius = radius;
    }

    draw() {
      this.renderer.renderCircle(this.radius);
    }
  }

  const vectorRenderer = new VectorRenderer();
  const rasterRenderer = new RasterRenderer();

  const circle1 = new Circle(vectorRenderer, 5);
  const circle2 = new Circle(rasterRenderer, 10);

  circle1.draw();
  circle2.draw();
  ```

- **Functional Approach:**

  - **Concept:** Uses higher-order functions to separate abstraction from implementation.
  - **Example:**

    ```javascript
    const createRenderer = (draw) => (shape) => draw(shape);

    const vectorRenderer = (shape) =>
      console.log(`Drawing a circle with radius ${shape.radius}`);
    const rasterRenderer = (shape) =>
      console.log(`Drawing pixels for a circle with radius ${shape.radius}`);

    const createCircle = (renderer, radius) => ({
      draw: () => renderer({ radius }),
    });

    const circle1 = createCircle(vectorRenderer, 5);
    const circle2 = createCircle(rasterRenderer, 10);

    circle1.draw();
    circle2.draw();
    ```

</details>

### Composite

- **Concept:** Composes objects into tree structures, allowing clients to treat individual objects (Leaves) and compositions (Nodes) uniformly.
- **Use Case:** Representing UI hierarchies, organizational structures, file systems.
- **Details:** Defines a common interface for both individual objects (Leaves) and composite objects (Nodes/Composites). Composite objects typically hold collections of child components (which can be Leaves or other Composites). Operations are often delegated down the tree.
- **Real-world Use Case:** Representing UI hierarchies (a window contains panels, which contain buttons and text fields); modeling organizational structures (departments contain teams, teams contain employees); file systems (directories contain files and other directories).
- **OOP Concept:** Composes objects into tree structures representing part-whole hierarchies. Uses **Abstraction** (a common interface for both leaf and composite objects) and **Polymorphism** (clients treat individual and composite objects uniformly through the common interface). **Recursion** is often used in operations on composites.
- **Functional Concept:** Represents hierarchies using nested data structures (like arrays or objects). Operations often involve **Recursion** and **Higher-Order Functions** (like `map` or `reduce`) to traverse the structure.
- **When to use:** Treating individual objects and compositions uniformly.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Component Interface (abstract class or just convention)
  class FileSystemNode {
    constructor(name) {
      this.name = name;
    }
    getSize() {
      throw new Error("Subclass must implement getSize.");
    }
    // Other common methods like display(indent) could go here
  }

  // Leaf
  class File extends FileSystemNode {
    constructor(name, size) {
      super(name);
      this.size = size;
    }
    getSize() {
      return this.size;
    }
  }

  // Composite
  class Directory extends FileSystemNode {
    constructor(name) {
      super(name);
      this.children = [];
    }
    add(node) {
      this.children.push(node);
    }
    remove(node) {
      /* remove logic */
    }
    getSize() {
      // Calculate size by summing sizes of children
      return this.children.reduce((total, child) => total + child.getSize(), 0);
    }
  }

  // Usage
  const file1 = new File("a.txt", 10);
  const file2 = new File("b.doc", 25);
  const subDir = new Directory("sub");
  subDir.add(new File("c.js", 50));
  const rootDir = new Directory("root");
  rootDir.add(file1);
  rootDir.add(file2);
  rootDir.add(subDir);

  console.log(`Size of file1: ${file1.getSize()}`); // Output: 10
  console.log(`Size of subDir: ${subDir.getSize()}`); // Output: 50
  console.log(`Size of rootDir: ${rootDir.getSize()}`); // Output: 85 (10 + 25 + 50)
  ```

---

- **Functional Approach:**

  - **Concept:** Define functions that operate recursively on hierarchical data structures (like nested objects or arrays).
  - **Example:** (Using the same data structure as before)

    ```javascript
    const fileSystemData = {
      name: "root",
      type: "directory",
      children: [
        { name: "a.txt", type: "file", size: 10 },
        { name: "b.doc", type: "file", size: 25 },
        {
          name: "sub",
          type: "directory",
          children: [{ name: "c.js", type: "file", size: 50 }],
        },
      ],
    };

    // Function to calculate total size (same as before)
    const calculateTotalSize = (node) => {
      if (node.type === "file") return node.size;
      if (node.type === "directory") {
        return node.children.reduce(
          (total, child) => total + calculateTotalSize(child),
          0,
        );
      }
      return 0;
    };

    // Function to display structure
    const displayNode = (node, indent = 0) => {
      const prefix = " ".repeat(indent * 2);
      console.log(
        `${prefix}${node.type === "directory" ? "+" : "-"} ${node.name} ${
          node.type === "file" ? `(${node.size}b)` : ""
        }`,
      );
      if (node.type === "directory") {
        node.children.forEach((child) => displayNode(child, indent + 1));
      }
    };

    console.log(`Total size: ${calculateTotalSize(fileSystemData)}`); // Output: 85
    displayNode(fileSystemData);
    /* Output:
       + root
         - a.txt (10b)
         - b.doc (25b)
         + sub
           - c.js (50b)
    */
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Graphic`, `Circle`, `CompositeGraphic`</summary>

- **Concept:** Allows you to compose objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions of objects uniformly.
- **Example:**

  ```javascript
  // Component Interface (abstract class or just convention)
  class Graphic {
    draw() {
      throw new Error("Subclass must implement draw method.");
    }
    // Common methods like add/remove might go here, throwing errors in Leaf
  }

  // Leaf
  class Circle extends Graphic {
    constructor(id) {
      super();
      this.id = id;
    }
    draw() {
      console.log(`Drawing Circle: ${this.id}`);
    }
  }

  // Composite
  class CompositeGraphic extends Graphic {
    constructor(id) {
      super();
      this.id = id;
      this.children = [];
    }
    add(graphic) {
      this.children.push(graphic);
    }
    remove(graphic) {
      /* Implementation to remove */
    }
    draw() {
      console.log(`Drawing Composite: ${this.id}`);
      this.children.forEach((child) => child.draw());
    }
  }

  const circle1 = new Circle(1);
  const circle2 = new Circle(2);
  const group1 = new CompositeGraphic("Group1");
  group1.add(circle1);
  group1.add(circle2);

  const circle3 = new Circle(3);
  const mainGroup = new CompositeGraphic("Main");
  mainGroup.add(group1);
  mainGroup.add(circle3);

  mainGroup.draw();
  /* Output:
     Drawing Composite: Main
     Drawing Composite: Group1
     Drawing Circle: 1
     Drawing Circle: 2
     Drawing Circle: 3
  */
  ```

  _(Note: The provided exampleuses `components()` method, `draw()` or `render()` is more typical for illustration)._

</details>

<details>
<summary>Variant: `fileSystem`, `calculateTotalSize`, `totalSize`</summary>

- **Concept:** Treats individual objects and compositions uniformly through a common interface.
- **OOP Approach:** (As previously shown, using base class/interface with Leaf and Composite classes).
- **Functional Approach:** Less direct mapping. Often involves defining functions that operate recursively on data structures (like trees or nested arrays) that represent the hierarchy. Functional programming favors processing data structures over mimicking object hierarchies.

  ```javascript
  // Represent hierarchy with nested data (e.g., objects or arrays)
  const fileSystem = {
    name: "root",
    type: "directory",
    children: [
      { name: "file1.txt", type: "file", size: 100 },
      {
        name: "subdir",
        type: "directory",
        children: [
          { name: "file2.txt", type: "file", size: 200 },
          { name: "notes.md", type: "file", size: 50 },
        ],
      },
      { name: "config.json", type: "file", size: 75 },
    ],
  };

  // Function to operate uniformly on the structure (e.g., calculate total size)
  const calculateTotalSize = (node) => {
    if (node.type === "file") {
      return node.size;
    }
    if (node.type === "directory") {
      // Recursively calculate size of children and sum them up
      return node.children.reduce(
        (total, child) => total + calculateTotalSize(child),
        0,
      );
    }
    return 0; // Should not happen with valid data
  };

  const totalSize = calculateTotalSize(fileSystem);
  console.log(`Total size: ${totalSize}`); // Output: Total size: 425

  // Another function: Find files by name (demonstrating uniform operation)
  const findFiles = (node, fileName) => {
    let found = [];
    if (node.type === "file" && node.name === fileName) {
      found.push(node);
    } else if (node.type === "directory") {
      node.children.forEach((child) => {
        found = found.concat(findFiles(child, fileName));
      });
    }
    return found;
  };
  console.log(findFiles(fileSystem, "file2.txt")); // Output: [ { name: 'file2.txt', type: 'file', size: 200 } ]
  ```

</details>

<details>
<summary>Variant: `Component`, `Leaf`, `Composite`</summary>

- **Concept:** Composes objects into tree structures to represent part-whole hierarchies.
- **Use Case:** Treating individual objects and composites uniformly.

- **OOP Approach:**

  ```javascript
  class Component {
    operation() {
      throw "Must be implemented";
    }
  }

  class Leaf extends Component {
    operation() {
      console.log("Leaf operation");
    }
  }

  class Composite extends Component {
    constructor() {
      super();
      this.children = [];
    }

    add(child) {
      this.children.push(child);
    }

    operation() {
      this.children.forEach((child) => child.operation());
    }
  }

  const leaf1 = new Leaf();
  const leaf2 = new Leaf();
  const composite = new Composite();
  composite.add(leaf1);
  composite.add(leaf2);
  composite.operation();
  ```

- **Functional Approach:**
  - **Concept:** Uses recursive functions to handle part-whole hierarchies.
  - **Example:**
    ```javascript
    const renderComponent = (comp) =>
      Array.isArray(comp) ? comp.map(renderComponent) : comp.render();
    ```

</details>

<details>
<summary>Variant: `Component`, `Leaf`, `Composite`</summary>

**Concept:** Composes objects into tree structures to represent part-whole hierarchies.

**Use Case:** Representing hierarchies like file systems or organizational structures.

**OOP Approach:**

```javascript
// Component
class Component {
  constructor(name) {
    this.name = name;
  }

  operation() {
    throw new Error("operation() must be implemented");
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
const leaf1 = new Leaf("Leaf1");
const leaf2 = new Leaf("Leaf2");
const composite = new Composite("Composite1");
composite.add(leaf1);
composite.add(leaf2);
console.log(composite.operation()); // Composite: Composite1 [Leaf: Leaf1, Leaf: Leaf2]
```

**Functional Approach:**

```javascript
// Component
const createComponent = (name) => ({
  name,
  operation: () => `Component: ${name}`,
});

// Leaf
const createLeaf = (name) => ({
  ...createComponent(name),
  operation: () => `Leaf: ${name}`,
});

// Composite
const createComposite = (name) => {
  const children = [];
  return {
    ...createComponent(name),
    add: (child) => children.push(child),
    operation: () =>
      `Composite: ${name} [${children
        .map((child) => child.operation())
        .join(", ")}]`,
  };
};

// Usage
const leaf1 = createLeaf("Leaf1");
const leaf2 = createLeaf("Leaf2");
const composite = createComposite("Composite1");
composite.add(leaf1);
composite.add(leaf2);
console.log(composite.operation()); // Composite: Composite1 [Leaf: Leaf1, Leaf: Leaf2]
```

</details>

### Decorator

- **Concept:** Attaches additional responsibilities or behaviors to an object or function dynamically.
- **Use Case:** Adding logging, timing, caching, or access control to functions/methods; enhancing UI components.
- **Details:** Wraps an object within another object (the decorator) that has the same interface but adds functionality before or after delegating to the wrapped object. Multiple decorators can be stacked.
- **Real-world Use Case:** Adding logging, timing, or access control to function calls or methods without modifying the original code; dynamically adding features like caching to data requests; enhancing UI components with borders, scrollbars, or special effects.
- **OOP Concept:** Attaches additional responsibilities to an object dynamically. Uses **Composition** (the decorator wraps the component) and adheres to the same interface as the component (**Abstraction**, **Polymorphism**) allowing for transparent wrapping.
- **Functional Concept:** Achieved using **Higher-Order Functions** that take a function (or object) and return an enhanced version of it. **Closures** maintain access to the original function/object.
- **When to use:** Extending functionality without subclassing.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Component Interface
  class Coffee {
    cost() {
      return 5;
    }
    description() {
      return "Coffee";
    }
  }

  // Concrete Component
  class SimpleCoffee extends Coffee {}

  // Decorator Base Class
  class CoffeeDecorator extends Coffee {
    constructor(coffee) {
      super();
      this.decoratedCoffee = coffee;
    }
    cost() {
      return this.decoratedCoffee.cost();
    }
    description() {
      return this.decoratedCoffee.description();
    }
  }

  // Concrete Decorators
  class WithMilk extends CoffeeDecorator {
    cost() {
      return super.cost() + 1;
    }
    description() {
      return super.description() + ", Milk";
    }
  }
  class WithSugar extends CoffeeDecorator {
    cost() {
      return super.cost() + 0.5;
    }
    description() {
      return super.description() + ", Sugar";
    }
  }

  // Usage
  let myCoffee = new SimpleCoffee();
  console.log(`${myCoffee.description()} cost: $${myCoffee.cost()}`); // Coffee cost: $5
  myCoffee = new WithMilk(myCoffee);
  console.log(`${myCoffee.description()} cost: $${myCoffee.cost()}`); // Coffee, Milk cost: $6
  myCoffee = new WithSugar(myCoffee);
  console.log(`${myCoffee.description()} cost: $${myCoffee.cost()}`); // Coffee, Milk, Sugar cost: $6.5
  ```

---

- **Functional Approach:**

  - **Concept:** Higher-order functions naturally implement decorators by wrapping existing functions.
  - **Example:**

    ```javascript
    // Original function
    const fetchUser = (userId) => {
      console.log(`Fetching user ${userId}...`);
      return { id: userId, name: "Alice" };
    };

    // Decorator: Adds caching
    const withCache = (fn, cache = new Map()) => {
      return (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
          console.log(`Cache hit for key: ${key}`);
          return cache.get(key);
        } else {
          console.log(`Cache miss for key: ${key}`);
          const result = fn(...args);
          cache.set(key, result);
          return result;
        }
      };
    };

    // Decorator: Adds Logging
    const withSimpleLogging = (fn) => {
      return (...args) => {
        console.log(`Calling function ${fn.name}...`);
        return fn(...args);
      };
    };

    // Apply decorators
    const loggedFetchUser = withSimpleLogging(fetchUser);
    const cachedLoggedFetchUser = withCache(loggedFetchUser);

    cachedLoggedFetchUser(1); // Cache miss -> Calling function fetchUser... -> Fetching...
    cachedLoggedFetchUser(1); // Cache hit
    cachedLoggedFetchUser(2); // Cache miss -> Calling function fetchUser... -> Fetching...
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `fetchData`, `withLogging`, `start`</summary>

- **Concept:** Attaches additional responsibilities or behaviors to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.
- **Example (Function Decorator):**

  ```javascript
  // Original function
  function fetchData(url) {
    console.log(`Fetching data from ${url}...`);
    // Imagine network request here
    return { data: "Sample data" };
  }

  // Decorator function to add logging
  function withLogging(fn) {
    return function (...args) {
      console.log(`Calling function: ${fn.name} with arguments:`, args);
      const start = Date.now();
      const result = fn.apply(this, args);
      const duration = Date.now() - start;
      console.log(
        `Function ${fn.name} finished in ${duration}ms. Result:`,
        result,
      );
      return result;
    };
  }

  // Decorate the original function
  const fetchDataWithLogging = withLogging(fetchData);

  fetchDataWithLogging("api/users");
  /* Output:
     Calling function: fetchData with arguments: [ 'api/users' ]
     Fetching data from api/users...
     Function fetchData finished in Xms. Result: { data: 'Sample data' }
  */
  ```

  _(Note: The Coffee example illustrates adding state, while function decorators are more common for adding behavior)._

</details>

<details>
<summary>Variant: `add`, `withLogging`, `result`</summary>

- **Concept:** Dynamically adds behavior to an object or function.
- **OOP Approach:** (As previously shown, using wrapper classes).
- **Functional Approach:** Higher-order functions are the natural way to implement decorators. They take a function as input, add behavior, and return a new function.

  ```javascript
  // Original function
  const add = (a, b) => a + b;

  // Decorator: Logs arguments and result
  const withLogging = (fn) => {
    return (...args) => {
      console.log(`Calling ${fn.name || "function"} with args:`, args);
      const result = fn(...args);
      console.log(`Result: ${result}`);
      return result;
    };
  };

  // Decorator: Checks if arguments are numbers
  const withTypeCheck = (fn) => {
    return (...args) => {
      if (args.some((arg) => typeof arg !== "number")) {
        throw new Error("All arguments must be numbers.");
      }
      return fn(...args);
    };
  };

  // Apply decorators (function composition)
  const loggedAdd = withLogging(add);
  const checkedLoggedAdd = withTypeCheck(loggedAdd);
  // Or compose directly: const composedAdd = withTypeCheck(withLogging(add));

  checkedLoggedAdd(5, 3);
  // Output:
  // Calling add with args: [ 5, 3 ]
  // Result: 8

  try {
    checkedLoggedAdd(5, "a");
  } catch (e) {
    console.error(e.message); // Output: All arguments must be numbers.
  }
  ```

</details>

<details>
<summary>Variant: `Component`, `Decorator`, `component`</summary>

**Concept:** Adds behavior to an object dynamically without affecting other objects of the same class.

**Use Case:** Enhancing functionalities of objects in a flexible and reusable way.

**OOP Approach:**

```javascript
// Component
class Component {
  operation() {
    return "Component: Basic operation";
  }
}

// Decorator
class Decorator {
  constructor(component) {
    this.component = component;
  }

  operation() {
    return `Decorator: Enhanced (${this.component.operation()})`;
  }
}

// Usage
const component = new Component();
const decorated = new Decorator(component);
console.log(decorated.operation()); // Decorator: Enhanced (Component: Basic operation)
```

**Functional Approach:**

```javascript
// Component
const createComponent = () => ({
  operation: () => "Component: Basic operation",
});

// Decorator Function
const createDecorator = (component) => ({
  operation: () => `Decorator: Enhanced (${component.operation()})`,
});

// Usage
const component = createComponent();
const decorated = createDecorator(component);
console.log(decorated.operation()); // Decorator: Enhanced (Component: Basic operation)
```

</details>

<details>
<summary>Variant: `Greeter`, `DecoratedGreeter`, `greeter`</summary>

- **Concept:** Adds behavior to an object dynamically.
- **Use Case:** Extending functionalities without modifying existing code.

- **OOP Approach:**

  ```javascript
  class Greeter {
    greet() {
      console.log("Hello!");
    }
  }

  class DecoratedGreeter {
    constructor(greeter) {
      this.greeter = greeter;
    }

    greet() {
      this.greeter.greet();
      console.log("How are you?");
    }
  }

  const greeter = new Greeter();
  const decoratedGreeter = new DecoratedGreeter(greeter);
  decoratedGreeter.greet();
  ```

- **Functional Approach:**
  - **Concept:** Higher-order functions that add behavior.
  - **Example:**
    ```javascript
    const withLogging =
      (fn) =>
      (...args) => {
        console.log(`Calling ${fn.name}`);
        return fn(...args);
      };
    ```

</details>

### Facade

- **Concept:** Provides a simplified, unified interface to a complex subsystem.
- **Use Case:** Simplifying interaction with complex libraries, frameworks, or sets of related services.
- **Details:** Instead of interacting with multiple classes or functions within a subsystem, the client interacts only with the Facade object. The Facade delegates calls to the appropriate parts of the subsystem.
- **Real-world Use Case:** Creating a simple API for a complex library (e.g., a `startVideoConference()` method that handles camera setup, microphone access, network connection, and UI rendering behind the scenes); simplifying interaction with browser APIs (like abstracting DOM manipulation or `Workspace` calls); providing a single entry point for a set of related services.
- **OOP Concept:** Provides a simplified, unified interface to a complex subsystem. Uses **Encapsulation** to hide the subsystem's complexity and **Composition** to manage the subsystem components.
- **Functional Concept:** A simple function that orchestrates calls to several other functions, hiding the underlying complexity. Relies on **Function Composition** implicitly.
- **When to use:** Making a complex subsystem easier to use.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Complex subsystem parts
  class AuthSystem {
    authenticate(token) {
      console.log("Authenticated.");
      return { userId: "u1" };
    }
  }
  class ProfileSystem {
    getProfile(userId) {
      console.log("Fetched profile.");
      return { name: "Alice" };
    }
  }
  class SettingsSystem {
    getSettings(userId) {
      console.log("Fetched settings.");
      return { theme: "dark" };
    }
  }

  // Facade Class
  class UserSessionFacade {
    constructor() {
      this.auth = new AuthSystem();
      this.profile = new ProfileSystem();
      this.settings = new SettingsSystem();
    }

    getUserData(token) {
      console.log("--- Facade: Getting User Data ---");
      const authInfo = this.auth.authenticate(token);
      if (!authInfo) return null;
      const profileData = this.profile.getProfile(authInfo.userId);
      const settingsData = this.settings.getSettings(authInfo.userId);
      console.log("--- Facade: Done ---");
      return { ...authInfo, ...profileData, ...settingsData };
    }
  }

  // Client uses the facade
  const session = new UserSessionFacade();
  const userData = session.getUserData("validToken");
  console.log("User Data:", userData);
  ```

---

- **Functional Approach:**

  - **Concept:** A single function orchestrates calls to several other "subsystem" functions, hiding the complexity.
  - **Example:**

    ```javascript
    // "Subsystem" functions
    const authenticateUser = (token) => {
      console.log("Func: Authenticated.");
      return { userId: "u2" };
    };
    const fetchUserProfile = (userId) => {
      console.log("Func: Fetched profile.");
      return { name: "Bob" };
    };
    const fetchUserSettings = (userId) => {
      console.log("Func: Fetched settings.");
      return { theme: "light" };
    };

    // Functional Facade
    const getUserSessionData = (token) => {
      console.log("--- Func Facade: Getting User Data ---");
      const authInfo = authenticateUser(token);
      if (!authInfo) return null;
      // Could use Promise.all for async operations here
      const profileData = fetchUserProfile(authInfo.userId);
      const settingsData = fetchUserSettings(authInfo.userId);
      console.log("--- Func Facade: Done ---");
      return { ...authInfo, ...profileData, ...settingsData };
    };

    // Client uses the facade function
    const functionalUserData = getUserSessionData("anotherToken");
    console.log("Functional User Data:", functionalUserData);
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `AudioSetup`, `VideoSetup`, `NetworkConnection`</summary>

- **Concept:** Provides a simplified, unified interface to a more complex subsystem. It hides the system's complexities and makes it easier to use.
- **Example:**

  ```javascript
  // Complex subsystem parts
  class AudioSetup {
    configureMic() {
      console.log("Mic configured.");
    }
  }
  class VideoSetup {
    configureCamera() {
      console.log("Camera configured.");
    }
  }
  class NetworkConnection {
    connect() {
      console.log("Network connected.");
    }
  }
  class UIManager {
    renderInterface() {
      console.log("UI rendered.");
    }
  }

  // Facade
  class ConferenceFacade {
    constructor() {
      this.audio = new AudioSetup();
      this.video = new VideoSetup();
      this.network = new NetworkConnection();
      this.ui = new UIManager();
    }

    start() {
      console.log("Starting conference...");
      this.audio.configureMic();
      this.video.configureCamera();
      this.network.connect();
      this.ui.renderInterface();
      console.log("Conference started.");
    }
  }

  // Client uses the simple facade
  const conference = new ConferenceFacade();
  conference.start();
  /* Output:
     Starting conference...
     Mic configured.
     Camera configured.
     Network connected.
     UI rendered.
     Conference started.
  */
  ```

  _(Note: The Coffee example is too simple to fully convey the benefit of hiding complexity)._

</details>

<details>
<summary>Variant: `setupAudio`, `setupVideo`, `connectNetwork`</summary>

- **Concept:** Provides a simplified interface to a complex subsystem.
- **OOP Approach:** (As previously shown, using a Facade class).
- **Functional Approach:** A single function orchestrates calls to several other functions, hiding the underlying complexity.

  ```javascript
  // "Subsystem" functions
  const setupAudio = () => {
    console.log("Audio ready.");
    return true;
  };
  const setupVideo = () => {
    console.log("Video ready.");
    return true;
  };
  const connectNetwork = (server) => {
    console.log(`Connected to ${server}.`);
    return "connectionId123";
  };
  const displayUI = (connId) =>
    console.log(`UI displayed for connection ${connId}.`);

  // Functional Facade
  const startConference = (server) => {
    console.log("--- Starting Conference ---");
    const audioOk = setupAudio();
    const videoOk = setupVideo();
    if (audioOk && videoOk) {
      const connectionId = connectNetwork(server);
      if (connectionId) {
        displayUI(connectionId);
        console.log("--- Conference Started Successfully ---");
        return true;
      }
    }
    console.error("--- Conference Start Failed ---");
    return false;
  };

  // Client uses the simple facade function
  startConference("conf.example.com");
  // Output:
  // --- Starting Conference ---
  // Audio ready.
  // Video ready.
  // Connected to conf.example.com.
  // UI displayed for connection connectionId123.
  // --- Conference Started Successfully ---
  ```

</details>

<details>
<summary>Variant: `SubsystemA`, `SubsystemB`, `Facade`</summary>

- **Concept:** Provides a simplified interface to a complex subsystem.
- **Use Case:** Making a subsystem easier to use.

- **OOP Approach:**

  ```javascript
  class SubsystemA {
    operationA() {
      console.log("SubsystemA operation");
    }
  }

  class SubsystemB {
    operationB() {
      console.log("SubsystemB operation");
    }
  }

  class Facade {
    constructor() {
      this.subsystemA = new SubsystemA();
      this.subsystemB = new SubsystemB();
    }

    operation() {
      this.subsystemA.operationA();
      this.subsystemB.operationB();
    }
  }

  const facade = new Facade();
  facade.operation();
  ```

- **Functional Approach:**
  - **Concept:** Combines multiple functions into a single function.
  - **Example:**
    ```javascript
    const createPaymentFacade = () => ({
      process: (amount) => validate(amount) && chargeCard(amount),
    });
    ```

</details>

<details>
<summary>Variant: `SubsystemA`, `SubsystemB`, `Facade`</summary>

**Concept:** Provides a simplified interface to a complex subsystem.

**Use Case:** Simplifying interactions with complex libraries or frameworks.

**OOP Approach:**

```javascript
// SubsystemA
class SubsystemA {
  operationA() {
    return "SubsystemA: Operation A";
  }
}

// SubsystemB
class SubsystemB {
  operationB() {
    return "SubsystemB: Operation B";
  }
}

// Facade
class Facade {
  constructor() {
    this.subsystemA = new SubsystemA();
    this.subsystemB = new SubsystemB();
  }

  simplifiedOperation() {
    return `${this.subsystemA.operationA()} and ${this.subsystemB.operationB()}`;
  }
}

// Usage
const facade = new Facade();
console.log(facade.simplifiedOperation()); // SubsystemA: Operation A and SubsystemB: Operation B
```

**Functional Approach:**

```javascript
// Subsystem Functions
const operationA = () => "SubsystemA: Operation A";
const operationB = () => "SubsystemB: Operation B";

// Facade Function
const simplifiedOperation = () => `${operationA()} and ${operationB()}`;

// Usage
console.log(simplifiedOperation()); // SubsystemA: Operation A and SubsystemB: Operation B
```

</details>

### Flyweight

- **Concept:** Minimizes memory usage by sharing as much data as possible with other similar objects. It separates intrinsic (shared, immutable) state from extrinsic (unique, context-dependent) state.
- **Use Case:** Rendering huge numbers of similar objects (e.g., characters in a text editor, trees in a game), managing shared resources like network connections where the core connection can be reused.
- **OOP Concept:** Reduces memory usage by sharing common (intrinsic) state between multiple objects, while unique (extrinsic) state is passed externally. Uses a factory (**Abstraction**, **Encapsulation**) to manage shared flyweight objects. **Composition** is used if flyweights reference other objects.
- **Functional Concept:** Uses **Closures** within a factory function to cache and reuse shared state objects/data structures. Emphasizes **Immutability** for the shared state.
- **When to use:** Managing large numbers of similar objects efficiently.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Flyweight: Represents the shared (intrinsic) state
  class CharacterStyle {
    constructor(font, size, color) {
      this.font = font;
      this.size = size;
      this.color = color;
      console.log(`Creating Style: ${font}, ${size}pt, ${color}`); // Show when created
    }
    // Display method would use extrinsic state (position)
    display(char, x, y) {
      console.log(
        `Drawing '${char}' at (${x},${y}) with style [${this.font}, ${this.size}pt, ${this.color}]`,
      );
    }
  }

  // Flyweight Factory: Manages and shares flyweight instances
  class StyleFactory {
    constructor() {
      this.styles = {};
    }

    getStyle(font, size, color) {
      const key = `${font}-${size}-${color}`;
      if (!this.styles[key]) {
        this.styles[key] = new CharacterStyle(font, size, color);
      } else {
        console.log(`Reusing Style: ${font}, ${size}pt, ${color}`);
      }
      return this.styles[key];
    }

    getStylesCount() {
      return Object.keys(this.styles).length;
    }
  }

  // Client uses the factory
  const factory = new StyleFactory();

  const style1 = factory.getStyle("Arial", 12, "Black"); // Created
  const style2 = factory.getStyle("Times New Roman", 10, "Blue"); // Created
  const style3 = factory.getStyle("Arial", 12, "Black"); // Reused

  console.log(`Total styles created: ${factory.getStylesCount()}`); // Output: 2

  // Simulate drawing characters (extrinsic state: char, x, y)
  style1.display("H", 10, 20);
  style2.display("e", 20, 20);
  style3.display("l", 30, 20); // Uses reused style1 object
  style1.display("l", 40, 20);
  style2.display("o", 50, 20);
  ```

---

- **Functional Approach:**

  - **Concept:** More challenging to map directly. Focuses on memoization or caching functions that compute or retrieve shared data based on intrinsic state, while extrinsic state is passed as arguments.
  - **Example (using memoization for shared data retrieval):**

    ```javascript
    // Function to get potentially expensive shared data (e.g., icon data)
    const getIconData = (iconName) => {
      console.log(`Generating data for icon: ${iconName}`);
      // Simulate fetching/generating large data
      return `ICON_DATA_FOR_${iconName.toUpperCase()}`;
    };

    // Memoization function (simple version)
    const memoize = (fn) => {
      const cache = new Map();
      return (...args) => {
        const key = JSON.stringify(args);
        if (!cache.has(key)) {
          cache.set(key, fn(...args));
        } else {
          console.log(`Memoization hit for: ${key}`);
        }
        return cache.get(key);
      };
    };

    // Memoized function acts like the flyweight factory/cache
    const getMemoizedIconData = memoize(getIconData);

    // Client rendering function uses memoized getter for intrinsic state
    const renderIcon = (iconName, x, y) => {
      // Extrinsic state: x, y
      const iconData = getMemoizedIconData(iconName); // Gets shared data
      console.log(`Rendering icon at (${x},${y}) using data: ${iconData}`);
    };

    renderIcon("user", 10, 10); // Generates data
    renderIcon("settings", 20, 10); // Generates data
    renderIcon("user", 30, 10); // Memoization hit
    renderIcon("settings", 40, 10); // Memoization hit
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Character`, `CharacterFactory`, `key`</summary>

- **Concept:** Reduces memory usage by sharing common parts of state between multiple objects, instead of storing all data in each instance.
- **Use Case:** Managing large numbers of similar objects, such as characters in a text editor or tiles in a game map.

- **OOP Approach:**

  ```javascript
  class Character {
    constructor(font, color) {
      this.font = font;
      this.color = color;
    }

    render(position) {
      console.log(
        `Rendering character at ${position} with font ${this.font} and color ${this.color}`,
      );
    }
  }

  class CharacterFactory {
    constructor() {
      this.characters = new Map();
    }

    getCharacter(font, color) {
      const key = `${font}-${color}`;
      if (!this.characters.has(key)) {
        this.characters.set(key, new Character(font, color));
      }
      return this.characters.get(key);
    }
  }

  const factory = new CharacterFactory();
  const char1 = factory.getCharacter("Arial", "red");
  const char2 = factory.getCharacter("Arial", "red");
  console.log(char1 === char2); // true
  ```

- **Functional Approach:**

  - **Concept:** Uses closures and shared data to minimize memory usage.
  - **Example:**

    ```javascript
    const createCharacterFactory = () => {
      const characters = new Map();
      return (font, color) => {
        const key = `${font}-${color}`;
        if (!characters.has(key)) {
          characters.set(key, { font, color });
        }
        return characters.get(key);
      };
    };

    const getCharacter = createCharacterFactory();
    const char1 = getCharacter("Arial", "red");
    const char2 = getCharacter("Arial", "red");
    console.log(char1 === char2); // true
    ```

</details>

<details>
<summary>Variant: `Flyweight`, `FlyweightFactory`</summary>

**Concept:** Reduces the number of objects created by sharing common data among similar objects.

**Use Case:** Optimizing memory usage when dealing with large numbers of similar objects.

**OOP Approach:**

```javascript
// Flyweight
class Flyweight {
  constructor(sharedState) {
    this.sharedState = sharedState;
  }

  operation(uniqueState) {
    return `Flyweight: Shared(${this.sharedState}), Unique(${uniqueState})`;
  }
}

// Flyweight Factory
class FlyweightFactory {
  constructor() {
    this.flyweights = {};
  }

  getFlyweight(sharedState) {
    if (!this.flyweights[sharedState]) {
      this.flyweights[sharedState] = new Flyweight(sharedState);
    }
    return this.flyweights[sharedState];
  }
}

// Usage
const factory = new FlyweightFactory();
const fw1 = factory.getFlyweight("Arial-12");
const fw2 = factory.getFlyweight("Arial-12");
console.log(fw1 === fw2); // true
console.log(fw1.operation("x=10")); // Flyweight: Shared(Arial-12), Unique(x=10)
```

</details>

<details>
<summary>Variant: `createFlyweight`</summary>

_Shares reusable state._

```javascript
const createFlyweight = (sharedState) => (uniqueState) => ({
  ...sharedState,
  ...uniqueState,
});
```

</details>

### Proxy

- **Concept:** Provides a surrogate or placeholder to control access to another object/function.
- **Use Case:** Implementing access control, caching, lazy loading, logging interactions.
- **Details:** The proxy object intercepts requests intended for the real object (the "subject"). It can perform actions like access control, caching, lazy loading, or logging before or instead of forwarding the request to the subject. JavaScript's native `Proxy` object is powerful for this.
- **Real-world Use Case:** Implementing access control (checking permissions before calling a method), caching results of expensive operations (cache proxy), lazy initialization of objects (virtual proxy), or logging interactions with an object.
- **OOP Concept:** Provides a surrogate or placeholder to control access to another object. Uses **Composition** (proxy holds a reference to the real subject) and implements the same interface (**Abstraction**, **Polymorphism**) to be interchangeable with the real subject. **Encapsulation** hides the real subject.
- **Functional Concept:** A function wraps another function (or object access), intercepting calls to add behavior (like access control or logging). Leverages **Higher-Order Functions** and **Closures**.
- **When to use:** Controlling access, lazy loading, logging.

#### Detailed example

- **OOP Approach (Native JS Proxy):**

  ```javascript
  const user = { name: "Bob", role: "user", sensitiveData: "abc" };

  const userProxy = new Proxy(user, {
    get(target, prop) {
      console.log(`Attempting to read property "${prop}"`);
      if (prop === "sensitiveData" && target.role !== "admin") {
        console.error(`Access denied to "${prop}" for role "${target.role}"`);
        return undefined;
      }
      return Reflect.get(target, prop);
    },
    set(target, prop, value) {
      console.log(`Attempting to set property "${prop}" to "${value}"`);
      if (prop === "role" && value !== "admin" && target.role === "admin") {
        console.warn("Cannot downgrade admin role.");
        return false; // Prevent setting
      }
      return Reflect.set(target, prop, value); // Allow setting
    },
  });

  console.log(userProxy.name); // Reads name
  console.log(userProxy.sensitiveData); // Denied
  userProxy.role = "guest"; // Allowed
  // userProxy.role = 'admin'; // This would work if allowed by logic
  ```

---

- **Functional Approach:**

  - **Concept:** Wrap functions to intercept calls, controlling access or adding behavior before delegation. Simpler than native Proxy, often focused on function calls rather than object properties.
  - **Example:**

    ```javascript
    // Function requiring admin privileges
    const performAdminAction = (action) =>
      console.log(`Performing admin action: ${action}`);

    // Functional Proxy for Role Check
    const createAdminProxy = (userRole, adminFn) => {
      return (...args) => {
        if (userRole === "admin") {
          console.log("Admin access verified.");
          return adminFn(...args);
        } else {
          console.error("Permission denied: Admin role required.");
          // return null or throw error
        }
      };
    };

    let currentUserRole = "user";
    const adminActionProxy = createAdminProxy(
      currentUserRole,
      performAdminAction,
    );

    adminActionProxy("delete logs"); // Error: Permission denied...

    // Simulate role change
    currentUserRole = "admin";
    const adminActionProxyNowAdmin = createAdminProxy(
      currentUserRole,
      performAdminAction,
    );
    adminActionProxyNowAdmin("delete logs");
    // Output:
    // Admin access verified.
    // Performing admin action: delete logs
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `getSecretData`, `createAccessControlledGetter`, `getMySecretData`</summary>

- **Concept:** Controls access to another object/function.
- **OOP Approach:** (As previously shown, using classes or native `Proxy`).
- **Functional Approach:** While JavaScript's native `Proxy` is object-oriented, you can achieve _some_ proxy-like behavior (like access control or logging) by wrapping functions, similar to decorators, but focused specifically on controlling access or interaction.

  ```javascript
  // Sensitive function
  const getSecretData = (userId) => {
    // Pretend to fetch data based on userId
    return `Secret data for user ${userId}`;
  };

  // Functional Proxy for access control
  const createAccessControlledGetter = (allowedUserId, fn) => {
    return (requestingUserId) => {
      if (requestingUserId === allowedUserId) {
        console.log(`Access granted for user ${requestingUserId}`);
        return fn(requestingUserId);
      } else {
        console.error(`Access denied for user ${requestingUserId}`);
        return null; // Or throw error
      }
    };
  };

  const getMySecretData = createAccessControlledGetter(
    "user123",
    getSecretData,
  );

  console.log(getMySecretData("user123"));
  // Output:
  // Access granted for user user123
  // Secret data for user user123

  console.log(getMySecretData("user456"));
  // Output:
  // Access denied for user user456
  // null
  ```

  _(Note: This is simpler than the native Proxy and lacks features like trapping property access on objects)._

</details>

<details>
<summary>Variant: `sensitiveData`, `dataProxy`</summary>

- **Concept:** Provides a surrogate or placeholder for another object to control access to it.
- **Example (Using native JS Proxy for Access Control):**

  ```javascript
  const sensitiveData = {
    password: "123",
    userData: { name: "Admin", level: "high" },
  };

  const dataProxy = new Proxy(sensitiveData, {
    get(target, prop) {
      if (prop === "password") {
        console.error("Access denied: Cannot read password directly.");
        return undefined; // Or throw an error
      }
      return Reflect.get(target, prop); // Allow access to other properties
    },
    set(target, prop, value) {
      if (prop === "userData" && value.level !== "high") {
        console.warn("Warning: Attempting to lower admin level.");
      }
      return Reflect.set(target, prop, value); // Allow setting
    },
  });

  console.log(dataProxy.userData.name); // Output: Admin
  console.log(dataProxy.password); // Output: Access denied... undefined
  dataProxy.userData = { name: "Admin", level: "medium" }; // Output: Warning...
  ```

  _(Note: The provided LoggerProxy exampledemonstrates interception but less control than a typical proxy)._

</details>

<details>
<summary>Variant: `RealSubject`, `Proxy`, `realSubject`</summary>

- **Concept:** Provides a surrogate or placeholder for another object.
- **Use Case:** Controlling access to the original object.

- **OOP Approach:**

  ```javascript
  class RealSubject {
    request() {
      console.log("RealSubject request");
    }
  }

  class Proxy {
    constructor(realSubject) {
      this.realSubject = realSubject;
    }

    request() {
      console.log("Proxy request");
      this.realSubject.request();
    }
  }

  const realSubject = new RealSubject();
  const proxy = new Proxy(realSubject);
  proxy.request();
  ```

- **Functional Approach:**
  - **Concept:** Wraps the original function to control access.
  - **Example:**
    ```javascript
    const createProxy = (target) => ({
      get: (prop) => (prop === "secret" ? undefined : target[prop]),
    });
    ```

</details>

---

## Behavioral Design Patterns

These patterns manage algorithms, relationships, and responsibilities between objects.

### Chain of Responsibility

- **Concept:** Passes a request along a chain of handlers. Each handler decides either to process the request or to pass it to the next handler in the chain. Decouples sender from receiver(s).
- **Use Case:** Processing pipelines (e.g., middleware in web frameworks), event bubbling in UIs, handling tiered approval processes, filtering requests.
- **OOP Concept:** Avoids coupling sender and receiver by passing requests along a chain of handlers. Uses **Composition** (handlers link to the next) and **Polymorphism** (handlers share a common interface). **Abstraction** defines the handler interface.
- **Functional Concept:** Implemented as a linked list or **recursive** structure of functions. Each function decides to handle the request or pass it to the next function. Relies on **Higher-Order Functions** (passing the next handler) and **Closures**.
- **When to use:** Decoupling request handlers.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Handler base class/interface
  class RequestHandler {
    constructor() {
      this.nextHandler = null;
    }
    setNext(handler) {
      this.nextHandler = handler;
      return handler;
    } // Allow chaining setup
    handle(request) {
      if (this.canHandle(request)) {
        this.process(request);
      } else if (this.nextHandler) {
        console.log(
          `${this.constructor.name} cannot handle, passing to next...`,
        );
        this.nextHandler.handle(request);
      } else {
        console.log("End of chain: Request unhandled.", request);
      }
    }
    // Methods to be implemented by subclasses
    canHandle(request) {
      throw new Error("Implement canHandle!");
    }
    process(request) {
      throw new Error("Implement process!");
    }
  }

  // Concrete Handlers
  class LoggerHandler extends RequestHandler {
    canHandle(request) {
      return true;
    } // Always logs
    process(request) {
      console.log(
        `LOG: Request received - ID ${request.id}, Type ${request.type}`,
      );
      /* Doesn't stop chain */ if (this.nextHandler)
        this.nextHandler.handle(request);
    }
  }
  class AuthHandler extends RequestHandler {
    canHandle(request) {
      return request.type === "secure";
    }
    process(request) {
      if (request.token === "valid") {
        console.log(`AUTH: Authorized request ${request.id}.`);
        if (this.nextHandler) this.nextHandler.handle(request);
      } else {
        console.error(
          `AUTH: Unauthorized request ${request.id}!`,
        ); /* Stop chain */
      }
    }
  }
  class DataHandler extends RequestHandler {
    canHandle(request) {
      return request.type === "data" || request.type === "secure";
    } // Handles both after auth
    process(request) {
      console.log(
        `DATA: Processing data for request ${request.id}. Payload: ${request.payload}`,
      ); /* End chain for this example */
    }
  }

  // Setup the chain: Logger -> Auth -> Data
  const logger = new LoggerHandler();
  const auth = new AuthHandler();
  const data = new DataHandler();
  logger.setNext(auth).setNext(data); // Chain them

  // Process requests
  console.log("--- Processing Secure Request (Valid) ---");
  logger.handle({
    id: 1,
    type: "secure",
    token: "valid",
    payload: "Secret Info",
  });
  console.log("\n--- Processing Secure Request (Invalid) ---");
  logger.handle({
    id: 2,
    type: "secure",
    token: "invalid",
    payload: "More Info",
  });
  console.log("\n--- Processing Data Request ---");
  logger.handle({ id: 3, type: "data", payload: "Public Info" });
  console.log("\n--- Processing Unknown Request ---");
  logger.handle({ id: 4, type: "unknown" });
  ```

---

- **Functional Approach:**

  - **Concept:** Represent the chain as an array or composition of functions. Each function takes the request and a `next` function as arguments. It either handles the request or calls `next(request)`. Middleware patterns in frameworks like Express.js are often functional examples.
  - **Example (Middleware Style):**

    ```javascript
    // Handler Functions (request, next) => void
    const loggerMiddleware = (req, next) => {
      console.log(`FUNC LOG: Request ID ${req.id}, Type ${req.type}`);
      next(req); // Always call next
    };

    const authMiddleware = (req, next) => {
      if (req.type === "secure") {
        if (req.token === "valid") {
          console.log(`FUNC AUTH: Authorized request ${req.id}.`);
          next(req); // Call next only if authorized
        } else {
          console.error(`FUNC AUTH: Unauthorized request ${req.id}!`);
          // Don't call next to stop the chain
        }
      } else {
        next(req); // Pass non-secure requests through
      }
    };

    const dataProcessorMiddleware = (req, next) => {
      if (req.type === "data" || req.type === "secure") {
        // Assumes secure requests were authed
        console.log(
          `FUNC DATA: Processing data for request ${req.id}. Payload: ${req.payload}`,
        );
        // This is the final handler in this example, so no 'next()' call
      } else {
        next(req); // Pass if not data/secure (though might be stopped by auth earlier)
      }
    };

    const unhandledMiddleware = (req, next) => {
      console.log("End of chain: Request unhandled.", req);
    };

    // Chain runner function
    const runChain = (request, middlewares) => {
      let index = -1;
      const dispatch = (i, currentRequest) => {
        if (i <= index)
          return Promise.reject(new Error("next() called multiple times")); // Prevent calling next multiple times synchronously
        index = i;
        const fn = middlewares[i];
        if (!fn) return Promise.resolve(); // End of chain

        try {
          // Call the middleware, passing the request and a function to call the *next* middleware
          return Promise.resolve(
            fn(currentRequest, (nextRequest = currentRequest) =>
              dispatch(i + 1, nextRequest),
            ),
          );
        } catch (err) {
          return Promise.reject(err);
        }
      };
      return dispatch(0, request).catch((err) =>
        console.error("Chain error:", err),
      );
    };

    // Define the chain
    const middlewareChain = [
      loggerMiddleware,
      authMiddleware,
      dataProcessorMiddleware,
      unhandledMiddleware,
    ];

    // Process requests
    console.log("--- Processing Secure Request (Valid) ---");
    runChain(
      { id: 1, type: "secure", token: "valid", payload: "Secret Info" },
      middlewareChain,
    );
    console.log("\n--- Processing Secure Request (Invalid) ---");
    runChain(
      { id: 2, type: "secure", token: "invalid", payload: "More Info" },
      middlewareChain,
    );
    console.log("\n--- Processing Data Request ---");
    runChain({ id: 3, type: "data", payload: "Public Info" }, middlewareChain);
    console.log("\n--- Processing Unknown Request ---");
    runChain({ id: 4, type: "unknown" }, middlewareChain);
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Handler`, `ConcreteHandlerA`, `ConcreteHandlerB`</summary>

- **Concept:** Allows a request to be passed along a chain of handlers, where each handler decides either to process the request or to pass it along to the next handler in the chain.
- **Use Case:** Implementing event handling systems, logging frameworks, or processing pipelines where multiple handlers can process a request.

- **OOP Approach:**

  ```javascript
  // Handler
  class Handler {
    constructor() {
      this.nextHandler = null;
    }

    setNext(handler) {
      this.nextHandler = handler;
      return handler;
    }

    handle(request) {
      if (this.nextHandler) {
        this.nextHandler.handle(request);
      }
    }
  }

  // Concrete Handlers
  class ConcreteHandlerA extends Handler {
    handle(request) {
      if (request === "A") {
        console.log("Handled by ConcreteHandlerA");
      } else {
        super.handle(request);
      }
    }
  }

  class ConcreteHandlerB extends Handler {
    handle(request) {
      if (request === "B") {
        console.log("Handled by ConcreteHandlerB");
      } else {
        super.handle(request);
      }
    }
  }

  // Usage
  const handlerA = new ConcreteHandlerA();
  const handlerB = new ConcreteHandlerB();
  handlerA.setNext(handlerB);
  handlerA.handle("A"); // Handled by ConcreteHandlerA
  handlerA.handle("B"); // Handled by ConcreteHandlerB
  ```

- **Functional Approach:**

  - **Concept:** Functions are used to create handlers that can process requests or pass them along to the next handler.
  - **Example:**

    ```javascript
    // Handler Function
    const createHandler = (process) => {
      let nextHandler = null;
      const setNext = (handler) => {
        nextHandler = handler;
        return handler;
      };
      const handle = (request) => {
        if (process(request)) {
          console.log(`Handled by ${process.name}`);
        } else if (nextHandler) {
          nextHandler.handle(request);
        }
      };
      return { setNext, handle };
    };

    // Usage
    const handlerA = createHandler((request) => request === "A");
    const handlerB = createHandler((request) => request === "B");
    handlerA.setNext(handlerB);
    handlerA.handle("A"); // Handled by handlerA
    handlerA.handle("B"); // Handled by handlerB
    ```

</details>

<details>
<summary>Variant: `chain`, `run`</summary>

_Processes via middleware chain._

```javascript
const chain = [
  (req, next) => {
    console.log("Step 1");
    next(req);
  },
];
const run = (req) =>
  chain.reduceRight(
    (next, fn) => () => fn(req, next),
    () => {},
  )();
```

</details>

### Command

- **Concept:** Encapsulates a request as an object (or function), decoupling the invoker from the receiver and enabling queuing, logging, undo, etc.
- **Use Case:** Undo/redo functionality, task queuing, UI action handling, transaction management.
- **Details:** Decouples the object that invokes an operation (Invoker) from the object that knows how to perform it (Receiver). The Command object binds together a receiver and an action.
- **Real-world Use Case:** Implementing undo/redo functionality in editors, queuing tasks (like API calls or animations), handling UI actions (button clicks map to command objects), managing transactions.
- **OOP Concept:** Encapsulates a request as an object. Uses **Abstraction** (command interface) and **Polymorphism** (concrete commands implement the interface). **Encapsulation** bundles the action and its receiver.
- **Functional Concept:** Represents commands as functions, often **Closures** capturing necessary context. **Higher-Order Functions** can act as invokers.
- **When to use:** Queuing requests, logging, undo/redo.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Receiver
  class Calculator {
    constructor() {
      this.value = 0;
    }
    add(x) {
      this.value += x;
    }
    subtract(x) {
      this.value -= x;
    }
  }
  // Command Interface
  class Command {
    execute() {}
    undo() {}
  }
  // Concrete Commands
  class AddCommand extends Command {
    constructor(calc, val) {
      super();
      this.calc = calc;
      this.val = val;
    }
    execute() {
      this.calc.add(this.val);
    }
    undo() {
      this.calc.subtract(this.val);
    }
  }
  class SubtractCommand extends Command {
    constructor(calc, val) {
      super();
      this.calc = calc;
      this.val = val;
    }
    execute() {
      this.calc.subtract(this.val);
    }
    undo() {
      this.calc.add(this.val);
    }
  }
  // Invoker (with history for undo)
  class CalcInvoker {
    constructor() {
      this.history = [];
      this.calculator = new Calculator();
    }
    executeCommand(cmd) {
      cmd.execute();
      this.history.push(cmd);
      this.log();
    }
    undoLast() {
      const cmd = this.history.pop();
      if (cmd) cmd.undo();
      this.log();
    }
    log() {
      console.log(`Current Value: ${this.calculator.value}`);
    }
  }

  // Usage
  const invoker = new CalcInvoker();
  invoker.executeCommand(new AddCommand(invoker.calculator, 10)); // Value: 10
  invoker.executeCommand(new AddCommand(invoker.calculator, 5)); // Value: 15
  invoker.undoLast(); // Value: 10
  invoker.undoLast(); // Value: 0
  ```

---

- **Functional Approach:**

  - **Concept:** Represent commands as functions, often closures capturing context. Undo can be handled by returning an "undo" function.
  - **Example:**

    ```javascript
    // Receiver state (simple object)
    let counter = { value: 0 };

    // Command function creator (returns execute and undo functions)
    const createCounterCommand = (action, val) => {
      let executed = false;
      return {
        execute: () => {
          if (action === "add") counter.value += val;
          if (action === "subtract") counter.value -= val;
          executed = true;
          console.log(`Executed ${action}(${val}). Current: ${counter.value}`);
        },
        undo: () => {
          if (!executed) return; // Can only undo if executed
          if (action === "add") counter.value -= val; // Reverse action
          if (action === "subtract") counter.value += val;
          console.log(`Undid ${action}(${val}). Current: ${counter.value}`);
          executed = false; // Mark as undone
        },
      };
    };

    // Invoker state and functions
    const commandHistory = [];
    const execute = (command) => {
      command.execute();
      commandHistory.push(command);
    };
    const undo = () => {
      const cmd = commandHistory.pop();
      if (cmd) cmd.undo();
    };

    // Usage
    execute(createCounterCommand("add", 5)); // Executed add(5). Current: 5
    execute(createCounterCommand("subtract", 2)); // Executed subtract(2). Current: 3
    undo(); // Undid subtract(2). Current: 5
    undo(); // Undid add(5). Current: 0
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Light`, `Command`, `TurnOnLightCommand`</summary>

- **Concept:** Encapsulates a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations.
- **Example:**

  ```javascript
  // Receiver (the object that performs the actual work)
  class Light {
    turnOn() {
      console.log("Light is ON");
    }
    turnOff() {
      console.log("Light is OFF");
    }
  }

  // Command Interface (abstract class or convention)
  class Command {
    //
    execute() {
      throw new Error("Subclass must implement execute.");
    }
    // Optional: undo() method
  }

  // Concrete Commands
  class TurnOnLightCommand extends Command {
    //
    constructor(light) {
      super();
      this.light = light;
    }
    execute() {
      this.light.turnOn();
    }
    // undo() { this.light.turnOff(); }
  }
  class TurnOffLightCommand extends Command {
    constructor(light) {
      super();
      this.light = light;
    }
    execute() {
      this.light.turnOff();
    }
    // undo() { this.light.turnOn(); }
  }

  // Invoker (stores and executes commands)
  class RemoteControl {
    constructor() {
      this.command = null;
    }
    setCommand(command) {
      this.command = command;
    }
    pressButton() {
      if (this.command) {
        this.command.execute();
      } else {
        console.log("No command set.");
      }
    }
    // Optional: pressUndo() { if (this.command) this.command.undo(); }
  }

  // Client setup
  const livingRoomLight = new Light();
  const turnOn = new TurnOnLightCommand(livingRoomLight);
  const turnOff = new TurnOffLightCommand(livingRoomLight);

  const remote = new RemoteControl();

  remote.setCommand(turnOn);
  remote.pressButton(); // Output: Light is ON

  remote.setCommand(turnOff);
  remote.pressButton(); // Output: Light is OFF
  ```

</details>

<details>
<summary>Variant: `turnLightOn`, `turnLightOff`, `setThermostat`</summary>

- **Concept:** Encapsulates a request as an object (or function).
- **OOP Approach:** (As previously shown, using Command classes).
- **Functional Approach:** Represent commands simply as functions (often closures that capture necessary context).

  ```javascript
  // Receiver functions (representing the actions)
  const turnLightOn = (location) => console.log(`${location} light is ON`);
  const turnLightOff = (location) => console.log(`${location} light is OFF`);
  const setThermostat = (temp) => console.log(`Thermostat set to ${temp}C`);

  // Create command functions (closures capturing context)
  const createCommand = (action, ...args) => {
    return () => action(...args); // Return a zero-argument function that executes the action
  };

  // Create specific command functions
  const livingRoomLightOnCmd = createCommand(turnLightOn, "Living Room");
  const livingRoomLightOffCmd = createCommand(turnLightOff, "Living Room");
  const setHeatingCmd = createCommand(setThermostat, 22);

  // Invoker function (executes a command function)
  const executeCommand = (commandFn) => {
    console.log("Executing command...");
    commandFn();
  };

  // Execute commands
  executeCommand(livingRoomLightOnCmd); // Output: Executing command... -> Living Room light is ON
  executeCommand(setHeatingCmd); // Output: Executing command... -> Thermostat set to 22C
  executeCommand(livingRoomLightOffCmd); // Output: Executing command... -> Living Room light is OFF
  ```

</details>

<details>
<summary>Variant: `Command`, `LightOnCommand`, `Light`</summary>

- **Concept:** Encapsulates a request as an object, thereby allowing for parameterization of clients with queues, requests, and operations.
- **Use Case:** Implementing undo/redo functionality, queuing tasks, or logging changes in an application.

- **OOP Approach:**

  ```javascript
  // Command Interface
  class Command {
    execute() {
      throw new Error("execute() must be implemented");
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

  // Receiver
  class Light {
    turnOn() {
      console.log("Light is ON");
    }

    turnOff() {
      console.log("Light is OFF");
    }
  }

  // Invoker
  class RemoteControl {
    submit(command) {
      command.execute();
    }
  }

  // Usage
  const light = new Light();
  const lightOn = new LightOnCommand(light);
  const remote = new RemoteControl();
  remote.submit(lightOn); // Light is ON
  ```

- **Functional Approach:**

  - **Concept:** Functions are used to represent commands, and higher-order functions manage the execution flow.
  - **Example:**

    ```javascript
    // Command Functions
    const turnOn = (light) => () => light.turnOn();
    const turnOff = (light) => () => light.turnOff();

    // Receiver
    const light = {
      turnOn: () => console.log("Light is ON"),
      turnOff: () => console.log("Light is OFF"),
    };

    // Invoker
    const remoteControl = (command) => command();

    // Usage
    remoteControl(turnOn(light)); // Light is ON
    remoteControl(turnOff(light)); // Light is OFF
    ```

</details>

<details>
<summary>Variant: `createCommand`, `cmd`</summary>

_Encapsulates actions._

```javascript
const createCommand = (execute, undo) => ({ execute, undo });
const cmd = createCommand(
  () => console.log("Done"),
  () => console.log("Undone"),
);
```

</details>

### Iterator

- **Concept:** Provides sequential access to elements of a collection without exposing its underlying structure.
- **Use Case:** Iterating over custom data structures, providing different traversal methods, enabling `for...of` loops.
- **Details:** Decouples the traversal logic from the collection itself. Multiple iterators can traverse the same collection independently. Defines a standard interface for iteration (e.g., `hasNext()`, `next()`). JavaScript's built-in iterables (`for...of`, spread syntax, `Array.prototype.values()`, etc.) implement this pattern natively for many objects.
- **Real-world Use Case:** Iterating over custom data structures (trees, graphs, lists), providing different ways to traverse a collection (e.g., forward, backward, depth-first, breadth-first), enabling the `for...of` loop and spread syntax for custom objects.
- **OOP Concept:** Provides sequential access to elements of an aggregate object without exposing its internal structure. Uses **Abstraction** (iterator interface) and **Encapsulation** (hides collection internals and iteration state).
- **Functional Concept:** Often implemented using **Closures** to maintain iteration state or **Generators** (in languages that support them like JS). **Higher-Order Functions** (`map`, `filter`, `reduce`) provide alternative ways to process collections.
- **When to use:** Uniform traversal of collections.

#### Detailed example

- **OOP Approach:**

  ```javascript
  class SimpleList {
    constructor() {
      this.items = [];
    }
    add(item) {
      this.items.push(item);
    }
    // Create an iterator object
    createIterator() {
      return new ListIterator(this);
    }
  }
  // Iterator class
  class ListIterator {
    constructor(list) {
      this.list = list;
      this.index = 0;
    }
    hasNext() {
      return this.index < this.list.items.length;
    }
    next() {
      return this.hasNext() ? this.list.items[this.index++] : undefined;
    }
  }

  // Usage
  const list = new SimpleList();
  list.add("A");
  list.add("B");
  list.add("C");
  const iterator = list.createIterator();
  while (iterator.hasNext()) {
    console.log(iterator.next());
  } // A, B, C
  ```

---

- **Functional Approach (Generators / Iterables):**

  - **Concept:** Use JavaScript's built-in iteration protocols (`Symbol.iterator`) and generators (`function*`) for custom iteration. Higher-order array methods (`map`, `filter`, `reduce`) are used for processing.
  - **Example:**

    ```javascript
    // Using built-in iterable protocol
    class WordCollection {
      constructor(str) {
        this.words = str.match(/\b(\w+)\b/g) || [];
      }
      // Make iterable
      [Symbol.iterator]() {
        let index = 0;
        const words = this.words;
        return {
          next: () => ({ value: words[index++], done: index > words.length }),
        };
      }
    }

    const sentence = new WordCollection("This is a test sentence.");
    for (const word of sentence) {
      console.log(word);
    } // This, is, a, test, sentence

    // Using a Generator
    function* countDown(start) {
      console.log("Countdown started!");
      for (let i = start; i >= 0; i--) {
        yield i;
      }
      console.log("Countdown finished!");
    }
    for (const num of countDown(3)) {
      console.log(num);
    } // 3, 2, 1, 0
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Iterator`, `collection`, `iterator`</summary>

- **Concept:** Provides a way to access the elements of an aggregate object sequentially without exposing its underlying representation.
- **Use Case:** Traversing a collection of objects, such as arrays or lists, without exposing their internal structure.

- **OOP Approach:**

  ```javascript
  // Iterator
  class Iterator {
    constructor(collection) {
      this.collection = collection;
      this.index = 0;
    }

    next() {
      if (this.index < this.collection.length) {
        return { value: this.collection[this.index++], done: false };
      }
      return { done: true };
    }
  }

  // Usage
  const collection = [1, 2, 3];
  const iterator = new Iterator(collection);
  let result = iterator.next();
  while (!result.done) {
    console.log(result.value);
    result = iterator.next();
  }
  ```

- **Functional Approach:**

  - **Concept:** Functions are used to create iterators that can traverse collections.
  - **Example:**

    ```javascript
    // Iterator Function
    const createIterator = (collection) => {
      let index = 0;
      return () => {
        if (index < collection.length) {
          return { value: collection[index++], done: false };
        }
        return { done: true };
      };
    };

    // Usage
    const collection = [1, 2, 3];
    const iterator = createIterator(collection);
    let result = iterator();
    while (!result.done) {
      console.log(result.value);
      result = iterator();
    }
    ```

</details>

<details>
<summary>Variant: `NumberCollection`, `index`, `items`</summary>

- **Concept:** Provides a way to access the elements of an aggregate object (collection) sequentially without exposing its underlying representation.
- **Example (Custom Iterator for a simple collection):**

  ```javascript
  class NumberCollection {
    constructor() {
      this.items = [];
    }
    add(item) {
      this.items.push(item);
    }

    // Make the collection iterable using the Iterator pattern
    [Symbol.iterator]() {
      let index = 0;
      const items = this.items;
      return {
        next: () => {
          if (index < items.length) {
            return { value: items[index++], done: false };
          } else {
            return { value: undefined, done: true };
          }
        },
      };
    }
  }

  const collection = new NumberCollection();
  collection.add(10);
  collection.add(20);
  collection.add(30);

  // Use the iterator implicitly with for...of
  console.log("Using for...of:");
  for (const item of collection) {
    console.log(item);
  }
  // Output: 10, 20, 30

  // Use the iterator explicitly
  console.log("\nUsing explicit iterator:");
  const iterator = collection[Symbol.iterator]();
  console.log(iterator.next()); // { value: 10, done: false }
  console.log(iterator.next()); // { value: 20, done: false }
  console.log(iterator.next()); // { value: 30, done: false }
  console.log(iterator.next()); // { value: undefined, done: true }
  ```

  _(Note: The provided examples are too abstract; using `Symbol.iterator` is the standard JS way)._

</details>

<details>
<summary>Variant: `numbers`, `processedNumbers`, `range`</summary>

- **Concept:** Provides sequential access to elements without exposing underlying structure.
- **OOP Approach:** (As previously shown, often using classes with `next`, `hasNext`).
- **Functional Approach:** JavaScript's built-in iteration protocols (`Symbol.iterator`) and higher-order functions like `map`, `filter`, `reduce` on arrays are the idiomatic functional ways to process collections. Generators (`function*`) are also a powerful functional tool for creating custom iterators.

  ```javascript
  // Using built-in iteration on an Array
  const numbers = [1, 2, 3, 4, 5];
  console.log("Using map/filter:");
  const processedNumbers = numbers
    .filter((n) => n % 2 === 0) // Keep even numbers
    .map((n) => n * 10); // Multiply by 10
  console.log(processedNumbers); // Output: [ 20, 40 ]

  // Using a Generator function for custom iteration
  function* range(start, end, step = 1) {
    console.log("Generator started.");
    for (let i = start; i <= end; i += step) {
      yield i; // Pauses execution and yields a value
    }
    console.log("Generator finished.");
  }

  console.log("\nUsing generator:");
  const numberGenerator = range(1, 5, 2); // Create the generator iterator

  // Use with for...of
  for (const num of numberGenerator) {
    console.log(num);
  }
  // Output:
  // Generator started.
  // 1
  // 3
  // 5
  // Generator finished.

  // Or manually
  // console.log(numberGenerator.next()); // { value: 1, done: false }
  // console.log(numberGenerator.next()); // { value: 3, done: false }
  // ...
  ```

</details>

<details>
<summary>Variant: `createIterator`, `index`</summary>

_Traverses collections._

```javascript
const createIterator = (arr) => {
  let index = 0;
  return { next: () => (index < arr.length ? arr[index++] : null) };
};
```

</details>

### Mediator

- **Concept:** Centralizes communication between objects (Colleagues) via a Mediator object, promoting loose coupling.
- **Use Case:** Chat applications, coordinating UI elements, complex form logic, air traffic control.
- **Details:** Colleagues communicate only with the Mediator, which then coordinates the interactions among them. This centralizes complex communication logic.
- **Real-world Use Case:** Chat applications (Mediator is the chat room, users are Colleagues), coordinating UI elements (e.g., enabling/disabling buttons based on input field state), complex form logic where changes in one field affect others, air traffic control systems.
- **OOP Concept:** Defines an object (mediator) that encapsulates how a set of objects (colleagues) interact. Promotes loose coupling. Uses **Abstraction** (mediator/colleague interfaces) and **Encapsulation** (mediator hides interaction logic).
- **Functional Concept:** A central function or module manages communication, often using an event bus or message passing mechanism. Leverages **Closures** and **Higher-Order Functions** for callbacks/listeners.
- **When to use:** Simplifying complex communication between objects.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Mediator Interface/Class
  class TrafficControlMediator {
    register(airplane) {}
    sendSignal(fromPlane, signal) {}
  }
  // Concrete Mediator
  class AirportControlTower extends TrafficControlMediator {
    constructor() {
      super();
      this.airplanes = new Set();
    }
    register(airplane) {
      this.airplanes.add(airplane);
      airplane.setMediator(this);
      console.log(`${airplane.name} registered.`);
    }
    sendSignal(fromPlane, signal) {
      console.log(
        `Tower received '${signal}' from ${fromPlane.name}. Relaying...`,
      );
      this.airplanes.forEach((plane) => {
        if (plane !== fromPlane) plane.receiveSignal(fromPlane.name, signal);
      });
    }
  }
  // Colleague Interface/Class
  class Airplane {
    constructor(name) {
      this.name = name;
      this.mediator = null;
    }
    setMediator(mediator) {
      this.mediator = mediator;
    }
    send(signal) {
      console.log(`${this.name} sending '${signal}'.`);
      this.mediator.sendSignal(this, signal);
    }
    receiveSignal(from, signal) {
      console.log(`${this.name} received '${signal}' from ${from}.`);
    }
  }

  // Usage
  const tower = new AirportControlTower();
  const plane1 = new Airplane("Flight 101");
  const plane2 = new Airplane("Flight 202");
  tower.register(plane1);
  tower.register(plane2);
  plane1.send("Requesting landing.");
  plane2.send("Holding pattern.");
  ```

---

- **Functional Approach (Pub/Sub or Event Bus):**

  - **Concept:** Use a central event bus where components (colleagues) publish messages/events identified by topics, and other components subscribe to topics to receive relevant messages.
  - **Example:**

    ```javascript
    const createEventBus = () => {
      const subscriptions = {}; // topic -> Set of callbacks
      return {
        subscribe: (topic, callback) => {
          (subscriptions[topic] ??= new Set()).add(callback);
          return () => subscriptions[topic].delete(callback); // unsubscribe
        },
        publish: (topic, data) =>
          subscriptions[topic]?.forEach((callback) => callback(data)),
      };
    };

    const eventBus = createEventBus();

    // Colleague A (e.g., Input field)
    const inputField = (id) => {
      const publishChange = (value) => {
        console.log(`Input ${id} changed to: ${value}`);
        eventBus.publish("input.changed", { id, value });
      };
      return { publishChange };
    };

    // Colleague B (e.g., Submit button)
    const submitButton = (buttonId) => {
      let enabled = false;
      const onInputChange = (data) => {
        // Enable button only if input 'email' has value
        if (data.id === "email" && data.value) {
          if (!enabled) {
            console.log(`Button ${buttonId}: Enabling.`);
            enabled = true;
          }
        } else if (data.id === "email" && !data.value) {
          if (enabled) {
            console.log(`Button ${buttonId}: Disabling.`);
            enabled = false;
          }
        }
      };
      eventBus.subscribe("input.changed", onInputChange);
      console.log(`Button ${buttonId} initialized.`);
    };

    // Setup
    const emailInput = inputField("email");
    const mainSubmit = submitButton("mainSubmit");

    // Interaction
    emailInput.publishChange("test"); // Button enables
    emailInput.publishChange("test@example.com"); // Button remains enabled
    emailInput.publishChange(""); // Button disables
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Mediator`, `Colleague`, `mediator`</summary>

- **Concept:** Defines an object that encapsulates how a set of objects interact, promoting loose coupling by keeping objects from referring to each other explicitly. This allows their interaction to be varied independently.
- **Use Case:** Implementing chat systems, event handling systems, or workflows where multiple components need to communicate without knowing each other's details.

- **OOP Approach:**

  ```javascript
  // Mediator
  class Mediator {
    constructor() {
      this.colleagues = [];
    }

    addColleague(colleague) {
      this.colleagues.push(colleague);
    }

    send(message, sender) {
      this.colleagues.forEach((colleague) => {
        if (colleague !== sender) {
          colleague.receive(message);
        }
      });
    }
  }

  // Colleague
  class Colleague {
    constructor(mediator) {
      this.mediator = mediator;
      this.mediator.addColleague(this);
    }

    send(message) {
      this.mediator.send(message, this);
    }

    receive(message) {
      console.log(`Received: ${message}`);
    }
  }

  // Usage
  const mediator = new Mediator();
  const colleague1 = new Colleague(mediator);
  const colleague2 = new Colleague(mediator);
  colleague1.send("Hello, Colleague2!"); // Received: Hello, Colleague2!
  ```

- **Functional Approach:**

  - **Concept:** Functions manage communication between components, allowing for dynamic interaction.
  - **Example:**

    ```javascript
    // Mediator Function
    const createMediator = () => {
      const colleagues = [];
      return {
        addColleague: (colleague) => colleagues.push(colleague),
        send: (message, sender) => {
          colleagues.forEach((colleague) => {
            if (colleague !== sender) {
              colleague.receive(message);
            }
          });
        },
      };
    };

    // Colleague Function
    const createColleague = (mediator) => {
      const receive = (message) => console.log(`Received: ${message}`);
      mediator.addColleague({
        send: (msg) => mediator.send(msg, { receive }),
        receive,
      });
    };

    // Usage
    const mediator = createMediator();
    createColleague(mediator);
    createColleague(mediator);
    mediator.addColleague({
      send: (msg) =>
        mediator.send(msg, {
          receive: (msg) => console.log(`Received: ${msg}`),
        }),
      receive: (msg) => console.log(`Received: ${msg}`),
    });
    mediator.send("Hello, Colleague2!", {
      receive: (msg) => console.log(`Received: ${msg}`),
    });
    ```

</details>

<details>
<summary>Variant: `ChatMediator`, `ChatRoom`, `User`</summary>

- **Concept:** Defines an object (the Mediator) that encapsulates how a set of objects (Colleagues) interact. It promotes loose coupling by keeping colleagues from referring to each other explicitly.
- **Example:**

  ```javascript
  // Mediator Interface (optional, could be concrete class directly)
  class ChatMediator {
    sendMessage(user, message) {
      throw new Error("Subclass must implement.");
    }
    addUser(user) {
      throw new Error("Subclass must implement.");
    }
  }

  // Concrete Mediator
  class ChatRoom extends ChatMediator {
    constructor() {
      super();
      this.users = [];
    }
    addUser(user) {
      this.users.push(user);
      user.setMediator(this); // Link user back to mediator
    }
    sendMessage(sender, message) {
      console.log(`[${sender.name} -> Room]: ${message}`);
      this.users.forEach((user) => {
        if (user !== sender) {
          // Don't send back to sender
          user.receive(sender.name, message);
        }
      });
    }
  }

  // Colleague Interface (optional, convention)
  class User {
    //
    constructor(name) {
      this.name = name;
      this.mediator = null;
    }
    setMediator(mediator) {
      this.mediator = mediator;
    }
    send(message) {
      //
      if (this.mediator) {
        this.mediator.sendMessage(this, message);
      }
    }
    receive(from, message) {
      console.log(`[${this.name} <- ${from}]: ${message}`);
    }
  }

  // Client usage
  const chatRoom = new ChatRoom(); //

  const user1 = new User("Alice"); //
  const user2 = new User("Bob"); //
  const user3 = new User("Charlie");

  chatRoom.addUser(user1);
  chatRoom.addUser(user2);
  chatRoom.addUser(user3);

  user1.send("Hello everyone!");
  // Output:
  // [Alice -> Room]: Hello everyone!
  // [Bob <- Alice]: Hello everyone!
  // [Charlie <- Alice]: Hello everyone!

  user2.send("Hi Alice!");
  // Output:
  // [Bob -> Room]: Hi Alice!
  // [Alice <- Bob]: Hi Alice!
  // [Charlie <- Bob]: Hi Alice!
  ```

</details>

<details>
<summary>Variant: `createEventBus`, `subscriptions`, `subscribe`</summary>

- **Concept:** Centralizes communication between objects (Colleagues).
- **OOP Approach:** (As previously shown, using Mediator and Colleague classes).
- **Functional Approach:** Can be modeled using an event bus or pub/sub system (similar to the functional Observer). Colleagues publish events/messages, and the mediator/bus routes them to subscribed colleagues (callback functions). The core idea is decoupling direct function calls.

  ```javascript
  // Simple Pub/Sub implementation (functional Mediator)
  const createEventBus = () => {
    const subscriptions = {}; // topic -> Set of callbacks

    const subscribe = (topic, callback) => {
      if (!subscriptions[topic]) {
        subscriptions[topic] = new Set();
      }
      subscriptions[topic].add(callback);
      console.log(`Subscribed to topic: ${topic}`);
      // Return unsubscribe function
      return () => {
        if (subscriptions[topic]) {
          subscriptions[topic].delete(callback);
          console.log(`Unsubscribed from topic: ${topic}`);
        }
      };
    };

    const publish = (topic, data) => {
      if (subscriptions[topic]) {
        console.log(`Publishing to topic: ${topic}`, data);
        subscriptions[topic].forEach((callback) => {
          try {
            callback(data);
          } catch (e) {
            console.error(e);
          }
        });
      } else {
        console.log(`No subscribers for topic: ${topic}`);
      }
    };

    return { subscribe, publish };
  };

  // Colleagues (represented by functions interacting via the bus)
  const eventBus = createEventBus();

  const colleagueA = (data) => {
    console.log(`Colleague A received:`, data);
    if (data.value > 5) {
      eventBus.publish("colleagueA.processed", { result: data.value * 2 });
    }
  };

  const colleagueB = (data) => {
    console.log(`Colleague B received processed data:`, data);
  };

  // Subscriptions
  eventBus.subscribe("data.updated", colleagueA);
  const unsubB = eventBus.subscribe("colleagueA.processed", colleagueB);

  // Interaction
  eventBus.publish("data.updated", { value: 10, source: "sensor" });
  // Output:
  // Subscribed to topic: data.updated
  // Subscribed to topic: colleagueA.processed
  // Publishing to topic: data.updated { value: 10, source: 'sensor' }
  // Colleague A received: { value: 10, source: 'sensor' }
  // Publishing to topic: colleagueA.processed { result: 20 }
  // Colleague B received processed data: { result: 20 }

  unsubB(); // Colleague B unsubscribes

  eventBus.publish("data.updated", { value: 3, source: "manual" });
  // Output:
  // Unsubscribed from topic: colleagueA.processed
  // Publishing to topic: data.updated { value: 3, source: 'manual' }
  // Colleague A received: { value: 3, source: 'manual' }
  // No subscribers for topic: colleagueA.processed // B won't receive anything now
  ```

</details>

<details>
<summary>Variant: `createChatRoom`</summary>

_Centralizes communication._

```javascript
const createChatRoom = () => ({
  users: [],
  send(msg, sender) {
    this.users.forEach((u) => u !== sender && u.receive(msg));
  },
});
```

</details>

### Memento

- **Concept:** Captures and externalizes an object's internal state (a "memento") so the object can be restored to this state later, without violating encapsulation.
- **Use Case:** Implementing undo/redo functionality, saving checkpoints in wizards or long processes.
- **OOP Concept:** Captures and externalizes an object's internal state without violating **Encapsulation**. Uses three roles: Originator (object with state), Memento (stores state), Caretaker (manages mementos).
- **Functional Concept:** Uses **Closures** to capture state. The "memento" is often a function that, when called, returns the captured state. Emphasizes **Immutability** if the state itself is immutable.
- **When to use:** Undo/redo, saving state.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Memento: Stores the state
  class EditorMemento {
    constructor(content) {
      this.content = content;
    }
    getContent() {
      return this.content;
    }
  }

  // Originator: Creates mementos and restores state from them
  class TextEditor {
    constructor() {
      this.content = "";
    }
    setContent(content) {
      this.content = content;
      console.log(`Content set: "${this.content}"`);
    }
    getContent() {
      return this.content;
    }
    // Creates a memento containing a snapshot of its current state
    save() {
      console.log("Saving state...");
      return new EditorMemento(this.content);
    }
    // Restores its state from a memento object
    restore(memento) {
      this.content = memento.getContent();
      console.log(`State restored to: "${this.content}"`);
    }
  }

  // Caretaker: Holds mementos, doesn't inspect them
  class History {
    constructor() {
      this.mementos = [];
    }
    addMemento(memento) {
      this.mementos.push(memento);
    }
    getMemento(index) {
      return this.mementos[index];
    }
    getLastMemento() {
      return this.mementos.pop();
    }
  }

  // Usage
  const editor = new TextEditor();
  const history = new History();

  editor.setContent("Version 1");
  history.addMemento(editor.save()); // Save V1

  editor.setContent("Version 2");
  history.addMemento(editor.save()); // Save V2

  editor.setContent("Version 3"); // Current state is V3

  // Undo (restore last saved state)
  const mementoV2 = history.getLastMemento();
  if (mementoV2) editor.restore(mementoV2); // Restores to V2

  // Undo again
  const mementoV1 = history.getLastMemento();
  if (mementoV1) editor.restore(mementoV1); // Restores to V1
  ```

---

- **Functional Approach:**

  - **Concept:** Focus on managing state immutably. Each "save" creates a new version of the state data. The history is simply a collection (e.g., an array) of these immutable state snapshots. Restoring means switching back to a previous state snapshot from the history.
  - **Example (Immutable State History):**

    ```javascript
    // Function to update state immutably
    const updateEditorState = (currentState, newContent) => {
      console.log(`Updating content to: "${newContent}"`);
      // Return a new state object instead of mutating
      return { ...currentState, content: newContent, timestamp: Date.now() };
    };

    // History management
    let history = [];
    let currentState = { content: "", timestamp: null }; // Initial state

    // Save current state to history
    const saveState = (stateToSave) => {
      console.log("Saving state...");
      history.push(stateToSave);
    };

    // Function to undo
    const undoState = () => {
      if (history.length > 1) {
        // Keep the initial state; pop the latest saved snapshot
        const previousState = history.pop();
        console.log(
          `Restoring state from ${new Date(
            previousState.timestamp,
          ).toLocaleTimeString()}: "${previousState.content}"`,
        );
        return previousState;
      }
      console.log("Nothing to undo.");
      return history[0] || { content: "", timestamp: null }; // Return initial or last known state
    };

    // Usage
    saveState(currentState); // Save initial empty state

    currentState = updateEditorState(currentState, "Functional V1");
    saveState(currentState);

    currentState = updateEditorState(currentState, "Functional V2");
    saveState(currentState);

    currentState = updateEditorState(currentState, "Functional V3");
    // Don't save V3 yet

    console.log("Current:", currentState.content); // Functional V3

    // Undo
    currentState = undoState(); // Restores V2
    console.log("Current after undo:", currentState.content); // Functional V2

    // Undo again
    currentState = undoState(); // Restores V1
    console.log("Current after undo:", currentState.content); // Functional V1
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Memento`, `Originator`, `Caretaker`</summary>

- **Concept:** Captures and externalizes an object's internal state without violating encapsulation, allowing the object to be restored to this state later.
- **Use Case:** Implementing undo functionality in applications, such as text editors or graphic design tools.

- **OOP Approach:**

  ```javascript
  // Memento
  class Memento {
    constructor(state) {
      this.state = state;
    }

    getState() {
      return this.state;
    }
  }

  // Originator
  class Originator {
    constructor(state) {
      this.state = state;
    }

    setState(state) {
      this.state = state;
    }

    saveStateToMemento() {
      return new Memento(this.state);
    }

    getStateFromMemento(memento) {
      this.state = memento.getState();
    }
  }

  // Caretaker
  class Caretaker {
    constructor() {
      this.mementoList = [];
    }

    add(memento) {
      this.mementoList.push(memento);
    }

    get(index) {
      return this.mementoList[index];
    }
  }

  // Usage
  const originator = new Originator("State1");
  const caretaker = new Caretaker();

  caretaker.add(originator.saveStateToMemento());
  originator.setState("State2");
  caretaker.add(originator.saveStateToMemento());

  console.log(originator.state); // State2
  originator.getStateFromMemento(caretaker.get(0));
  console.log(originator.state); // State1
  ```

- **Functional Approach:**

  - **Concept:** Uses closures to capture and restore state.
  - **Example:**

    ```javascript
    // Memento Function
    const createMemento = (state) => () => state;

    // Usage
    const originator = (state) => {
      let currentState = state;
      return {
        setState: (state) => {
          currentState = state;
        },
        saveStateToMemento: () => createMemento(currentState),
        getStateFromMemento: (memento) => {
          currentState = memento();
        },
      };
    };

    const caretaker = [];
    const originatorInstance = originator("State1");
    caretaker.push(originatorInstance.saveStateToMemento());
    originatorInstance.setState("State2");
    caretaker.push(originatorInstance.saveStateToMemento());

    console.log(originatorInstance.state); // State2
    originatorInstance.getStateFromMemento(caretaker[0]);
    console.log(originatorInstance.state); // State1
    ```

</details>

<details>
<summary>Variant: `createEditor`, `content`</summary>

_Saves/restores state._

```javascript
const createEditor = () => {
  let content = "";
  return {
    save: () => content,
    restore: (saved) => {
      content = saved;
    },
  };
};
```

</details>

### Observer

- **Concept:** Notifies dependents (Observers) automatically when a subject's state changes, promoting loose coupling.
- **Use Case:** Event handling (DOM), state management (Redux, Vuex), notification systems.
- **Details:** Promotes loose coupling. The Subject only knows its Observers through a common interface and doesn't need details about their concrete classes. Observers register/unregister themselves with the Subject.
- **Real-world Use Case:** Event handling in user interfaces (DOM listeners), state management libraries (React Context, Redux, Vuex), implementing notification systems, stock tickers updating subscribed charts/displays.
- **OOP Concept:** Defines a one-to-many dependency where objects (observers) subscribe to an object (subject) and get notified of state changes. Uses **Abstraction** (subject/observer interfaces) and **Polymorphism**. The subject maintains a list of observers (**Composition**).
- **Functional Concept:** Implemented using callbacks or event emitters. The subject is a function/object that maintains a list of callback functions (**Closures**) and invokes them on state change. **Higher-Order Functions** are used for subscription.
- **When to use:** Event handling, UI updates.

#### Detailed example

- **OOP Approach:**

  ```javascript
  class Subject {
    constructor() {
      this.observers = [];
    }
    attach(observer) {
      if (!this.observers.includes(observer)) this.observers.push(observer);
    }
    detach(observer) {
      this.observers = this.observers.filter((obs) => obs !== observer);
    }
    notify(data) {
      this.observers.forEach((obs) => obs.update(data));
    }
    // Method that causes state change
    updateData(newData) {
      console.log(`Subject: Data updated to "${newData}"`);
      this.notify(newData);
    }
  }
  // Observer Interface/Base
  class Observer {
    update(data) {
      throw new Error("Subclass must implement update.");
    }
  }
  // Concrete Observers
  class DataDisplay extends Observer {
    update(data) {
      console.log(`Display: Showing data - ${data}`);
    }
  }
  class DataLogger extends Observer {
    update(data) {
      console.log(`Logger: Logging data - ${data}`);
    }
  }

  // Usage
  const subject = new Subject();
  const display = new DataDisplay();
  const logger = new DataLogger();
  subject.attach(display);
  subject.attach(logger);
  subject.updateData("Hello");
  subject.detach(display);
  subject.updateData("World");
  ```

---

- **Functional Approach (Event Emitter / Pub/Sub):**

  - **Concept:** A subject maintains a list of callback functions and invokes them when state changes.
  - **Example:**

    ```javascript
    const createSubject = () => {
      const observers = new Set();
      const subscribe = (callback) => {
        observers.add(callback);
        return () => observers.delete(callback);
      };
      const notify = (data) => observers.forEach((cb) => cb(data));
      let state = null;
      const setState = (newState) => {
        state = newState;
        console.log(`State set to: ${state}`);
        notify(state);
      };
      const getState = () => state;
      return { subscribe, setState, getState };
    };

    // Observer callbacks
    const displayCallback = (data) => console.log(`Func Display: ${data}`);
    const loggerCallback = (data) => console.log(`Func Logger: ${data}`);

    const subjectFunc = createSubject();
    const unsubDisplay = subjectFunc.subscribe(displayCallback);
    const unsubLogger = subjectFunc.subscribe(loggerCallback);

    subjectFunc.setState("First Update");
    unsubDisplay(); // Unsubscribe display
    subjectFunc.setState("Second Update");
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Subject`, `index`, `Observer`</summary>

- **Concept:** Defines a one-to-many dependency between objects. When one object (the Subject/Observable) changes state, all its dependents (Observers) are notified and updated automatically.
- **Example:**

  ```javascript
  class Subject {
    constructor() {
      this.observers = []; // Initialize the observers array
    }

    attach(observer) {
      if (!this.observers.includes(observer)) {
        // Avoid duplicates
        this.observers.push(observer); //
      }
    }

    detach(observer) {
      const index = this.observers.indexOf(observer);
      if (index !== -1) {
        this.observers.splice(index, 1); //
      }
    }

    notifyObservers(data) {
      // Pass relevant data with notification
      console.log("Subject: Notifying observers...");
      this.observers.forEach((observer) => observer.update(data)); //
    }

    // Example method that changes state and notifies
    changeState(newState) {
      console.log(`Subject: State changed to ${newState}`);
      this.notifyObservers(newState);
    }
  }

  // Interface for observers
  class Observer {
    update(data) {
      //
      throw new Error("Observer subclass must implement update method.");
    }
  }

  // Concrete Observers
  class ConcreteObserverA extends Observer {
    update(data) {
      console.log(`Observer A: Received update - ${data}`);
    }
  }
  class ConcreteObserverB extends Observer {
    update(data) {
      console.log(`Observer B: Received update - ${data}`);
    }
  }

  const subject = new Subject();
  const observer1 = new ConcreteObserverA(); //
  const observer2 = new ConcreteObserverB(); //

  subject.attach(observer1); //
  subject.attach(observer2); //

  subject.changeState("New State 1");
  /* Output:
     Subject: State changed to New State 1
     Subject: Notifying observers...
     Observer A: Received update - New State 1
     Observer B: Received update - New State 1
  */

  subject.detach(observer1);
  subject.changeState("New State 2");
  /* Output:
     Subject: State changed to New State 2
     Subject: Notifying observers...
     Observer B: Received update - New State 2
  */
  ```

</details>

<details>
<summary>Variant: `Subject`, `Observer`, `subject`</summary>

- **Concept:** Defines a one-to-many dependency between objects, where a change in one object notifies all its dependents.
- **Use Case:** Implementing event handling systems or subscription-based notifications.

- **OOP Approach:**

  ```javascript
  class Subject {
    constructor() {
      this.observers = [];
    }

    addObserver(observer) {
      this.observers.push(observer);
    }

    removeObserver(observer) {
      this.observers = this.observers.filter((obs) => obs !== observer);
    }

    notifyObservers(data) {
      this.observers.forEach((observer) => observer.update(data));
    }
  }

  class Observer {
    update(data) {
      console.log(`Received data: ${data}`);
    }
  }

  const subject = new Subject();
  const observer1 = new Observer();
  const observer2 = new Observer();

  subject.addObserver(observer1);
  subject.addObserver(observer2);

  subject.notifyObservers("Hello Observers!");
  ```

- **Functional Approach:**

  - **Concept:** Uses functions to manage subscriptions and notifications.
  - **Example:**

    ```javascript
    const createObserver = (callback) => ({ update: callback });

    const createSubject = () => {
      const observers = [];
      return {
        addObserver: (observer) => observers.push(observer),
        removeObserver: (observer) => {
          const index = observers.indexOf(observer);
          if (index !== -1) observers.splice(index, 1);
        },
        notifyObservers: (data) =>
          observers.forEach((observer) => observer.update(data)),
      };
    };

    const subject = createSubject();
    const observer1 = createObserver((data) =>
      console.log(`Observer 1: ${data}`),
    );
    const observer2 = createObserver((data) =>
      console.log(`Observer 2: ${data}`),
    );

    subject.addObserver(observer1);
    subject.addObserver(observer2);

    subject.notifyObservers("Hello Observers!");
    ```

</details>

<details>
<summary>Variant: `createSubject`, `state`, `observers`</summary>

- **Concept:** Notifies dependents (Observers) automatically when a subject's state changes.
- **OOP Approach:** (As previously shown, using Subject and Observer classes).
- **Functional Approach:** Often implemented using callbacks or event emitter patterns. A subject maintains a list of callback functions and invokes them when its state changes.

  ```javascript
  // Functional Subject (Event Emitter style)
  const createSubject = () => {
    let state = null;
    const observers = new Set(); // Use a Set to avoid duplicate callbacks

    const subscribe = (callback) => {
      observers.add(callback);
      console.log("Observer subscribed.");
      // Return an unsubscribe function
      return () => {
        observers.delete(callback);
        console.log("Observer unsubscribed.");
      };
    };

    const notify = (data) => {
      console.log("Notifying observers...");
      observers.forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error("Error in observer callback:", err);
        }
      });
    };

    const setState = (newState) => {
      console.log(`State changing to: ${newState}`);
      state = newState;
      notify(state); // Notify observers about the new state
    };

    const getState = () => state;

    return { subscribe, setState, getState };
  };

  // Observer functions (callbacks)
  const observerCallback1 = (data) =>
    console.log(`Observer 1 received: ${data}`);
  const observerCallback2 = (data) =>
    console.log(`Observer 2 received: ${data.toUpperCase()}`);

  // Usage
  const subject = createSubject();

  const unsubscribe1 = subject.subscribe(observerCallback1);
  const unsubscribe2 = subject.subscribe(observerCallback2);

  subject.setState("Initial State");
  // Output:
  // Observer subscribed.
  // Observer subscribed.
  // State changing to: Initial State
  // Notifying observers...
  // Observer 1 received: Initial State
  // Observer 2 received: INITIAL STATE

  unsubscribe1(); // Unsubscribe observer 1

  subject.setState("Second State");
  // Output:
  // Observer unsubscribed.
  // State changing to: Second State
  // Notifying observers...
  // Observer 2 received: SECOND STATE
  ```

</details>

<details>
<summary>Variant: `createEventBus`, `listeners`</summary>

_Pub/Sub event system._

```javascript
const createEventBus = () => {
  const listeners = {};
  return {
    subscribe: (event, fn) =>
      (listeners[event] = [...(listeners[event] || []), fn]),
    emit: (event, data) =>
      (listeners[event] || []).forEach((fn) => fn(data)),
  };
};
```

</details>

### State

- **Concept:** Allows an object to alter its behavior when its internal state changes. The object appears to change its class. Encapsulates state-specific behavior into separate State objects.
- **Use Case:** Modeling states in games (e.g., Standing, Walking, Jumping), workflow processes (Draft, Review, Approved), managing connections (Connecting, Connected, Disconnected).
- **OOP Concept:** Allows an object to alter behavior when its internal state changes. Uses **Composition** (context holds a state object) and **Polymorphism** (different state classes implement the same interface). **Abstraction** defines the state interface. **Encapsulation** hides state transitions.
- **Functional Concept:** Represents state as data and behavior as **Pure Functions** that take state and input, returning new state. State transitions are explicit function calls returning new state data. **Closures** can manage state within a context object/function.
- **When to use:** Implementing state machines.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Context Class
  class TrafficLight {
    constructor() {
      this.state = new RedLightState(this); // Initial state
      console.log("Traffic Light initialized to RED.");
    }
    setState(newState) {
      console.log(
        `Changing state from ${this.state.constructor.name} to ${newState.constructor.name}`,
      );
      this.state = newState;
    }
    // Delegate actions to the current state
    requestChange() {
      this.state.handleChange();
    }
    getCurrentColor() {
      return this.state.color;
    }
  }

  // State Interface/Base Class
  class LightState {
    constructor(light) {
      this.light = light;
      this.color = "Unknown";
    }
    handleChange() {
      throw new Error("Subclass must implement handleChange.");
    }
  }

  // Concrete States
  class RedLightState extends LightState {
    constructor(light) {
      super(light);
      this.color = "Red";
    }
    handleChange() {
      this.light.setState(new GreenLightState(this.light));
    }
  }
  class YellowLightState extends LightState {
    constructor(light) {
      super(light);
      this.color = "Yellow";
    }
    handleChange() {
      this.light.setState(new RedLightState(this.light));
    }
  }
  class GreenLightState extends LightState {
    constructor(light) {
      super(light);
      this.color = "Green";
    }
    handleChange() {
      this.light.setState(new YellowLightState(this.light));
    }
  }

  // Usage
  const light = new TrafficLight();
  console.log(`Current color: ${light.getCurrentColor()}`); // Red
  light.requestChange(); // Changes to Green
  console.log(`Current color: ${light.getCurrentColor()}`); // Green
  light.requestChange(); // Changes to Yellow
  console.log(`Current color: ${light.getCurrentColor()}`); // Yellow
  light.requestChange(); // Changes to Red
  console.log(`Current color: ${light.getCurrentColor()}`); // Red
  ```

---

- **Functional Approach:**

  - **Concept:** Represent states as data (e.g., strings, objects) and use functions (like reducers in state management) to handle transitions and determine behavior based on the current state value. Less about encapsulating behavior _within_ state objects, more about functions _reacting_ to state values.
  - **Example (Simple State Machine):**

    ```javascript
    // Define states as constants
    const STATES = { RED: "RED", YELLOW: "YELLOW", GREEN: "GREEN" };

    // Transition function (determines next state)
    const transition = (currentState) => {
      switch (currentState) {
        case STATES.RED:
          return STATES.GREEN;
        case STATES.GREEN:
          return STATES.YELLOW;
        case STATES.YELLOW:
          return STATES.RED;
        default:
          return STATES.RED; // Default/initial
      }
    };

    // Function to get behavior based on state
    const getColor = (currentState) => currentState; // Simple example
    const canGo = (currentState) => currentState === STATES.GREEN;

    // Simulate the light
    let currentLightState = STATES.RED;
    console.log(
      `Initial State: ${getColor(currentLightState)}, Can Go? ${canGo(
        currentLightState,
      )}`,
    );

    currentLightState = transition(currentLightState);
    console.log(
      `Next State: ${getColor(currentLightState)}, Can Go? ${canGo(
        currentLightState,
      )}`,
    );

    currentLightState = transition(currentLightState);
    console.log(
      `Next State: ${getColor(currentLightState)}, Can Go? ${canGo(
        currentLightState,
      )}`,
    );

    currentLightState = transition(currentLightState);
    console.log(
      `Next State: ${getColor(currentLightState)}, Can Go? ${canGo(
        currentLightState,
      )}`,
    );
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `State`, `ConcreteStateA`, `ConcreteStateB`</summary>

- **Concept:** Allows an object to alter its behavior when its internal state changes, appearing as if the object changed its class.
- **Use Case:** Implementing finite state machines, such as a vending machine or a traffic light system.

- **OOP Approach:**

  ```javascript
  // State Interface
  class State {
    handle(context) {
      throw new Error("handle() must be implemented");
    }
  }

  // Concrete States
  class ConcreteStateA extends State {
    handle(context) {
      console.log("Handling in ConcreteStateA");
      context.setState(new ConcreteStateB());
    }
  }

  class ConcreteStateB extends State {
    handle(context) {
      console.log("Handling in ConcreteStateB");
      context.setState(new ConcreteStateA());
    }
  }

  // Context
  class Context {
    constructor() {
      this.state = new ConcreteStateA();
    }

    setState(state) {
      this.state = state;
    }

    request() {
      this.state.handle(this);
    }
  }

  // Usage
  const context = new Context();
  context.request(); // Handling in ConcreteStateA
  context.request(); // Handling in ConcreteStateB
  ```

- **Functional Approach:**

  - **Concept:** Uses functions to represent states and transitions between them.
  - **Example:**

    ```javascript
    // State Function
    const createState = (handle) => ({ handle });

    // Usage
    const stateA = createState((context) => {
      console.log("Handling in stateA");
      context.setState(stateB);
    });
    const stateB = createState((context) => {
      console.log("Handling in stateB");
      context.setState(stateA);
    });
    const context = {
      setState: (state) => (context.state = state),
      state: stateA,
    };
    context.state.handle(context); // Handling in stateA
    context.state.handle(context); // Handling in stateB
    ```

</details>

<details>
<summary>Variant: `createLight`</summary>

_Changes behavior with state._

```javascript
const createLight = () => ({
  state: "red",
  change() {
    this.state = this.state === "red" ? "green" : "red";
  },
});
```

</details>

### Strategy

- **Concept:** Defines a family of algorithms, encapsulates each, and makes them interchangeable at runtime.
- **Use Case:** Implementing different payment methods, sorting algorithms, validation rules, compression techniques.
- **Details:** Allows selecting an algorithm or behavior at runtime. The client holds a reference to a strategy object and delegates the algorithmic task to it.
- **Real-world Use Case:** Implementing different payment processing methods (Credit Card, PayPal, Bank Transfer), choosing sorting algorithms based on data characteristics, applying different validation rules based on user input context, selecting different data compression or caching strategies.
- **OOP Concept:** Defines a family of algorithms, encapsulates each, and makes them interchangeable. Uses **Abstraction** (strategy interface), **Polymorphism** (concrete strategies implement the interface), and **Composition** (context holds a strategy object).
- **Functional Concept:** Algorithms are represented by functions. The context takes the strategy function as an argument. Relies on **Higher-Order Functions**.
- **When to use:** Selecting algorithms at runtime.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Strategy Interface
  class ValidationStrategy {
    validate(value) {
      throw new Error("Implement!");
    }
  }
  // Concrete Strategies
  class NotEmpty extends ValidationStrategy {
    validate(value) {
      return value !== null && value !== undefined && value !== "";
    }
  }
  class IsEmail extends ValidationStrategy {
    validate(value) {
      return /\S+@\S+\.\S+/.test(value);
    }
  }
  class MinLength extends ValidationStrategy {
    constructor(min) {
      super();
      this.min = min;
    }
    validate(value) {
      return typeof value === "string" && value.length >= this.min;
    }
  }

  // Context
  class InputField {
    constructor(strategy) {
      this.strategy = strategy;
    }
    setStrategy(strategy) {
      this.strategy = strategy;
    }
    isValid(value) {
      return this.strategy.validate(value);
    }
  }

  // Usage
  const emailField = new InputField(new IsEmail());
  console.log(
    `'test@a.com' is valid email? ${emailField.isValid("test@a.com")}`,
  ); // true
  console.log(`'test' is valid email? ${emailField.isValid("test")}`); // false

  const nameField = new InputField(new MinLength(3));
  console.log(`'Al' is valid name (min 3)? ${nameField.isValid("Al")}`); // false
  console.log(`'Alice' is valid name (min 3)? ${nameField.isValid("Alice")}`); // true
  ```

---

- **Functional Approach:**

  - **Concept:** Pass the algorithm (strategy) directly as a function argument.
  - **Example:**

    ```javascript
    // Context function accepting a strategy function
    const validateInput = (value, validationFn) => {
      const result = validationFn(value);
      console.log(`Value "${value}" validation result: ${result}`);
      return result;
    };

    // Strategy functions
    const isNotEmpty = (val) => val !== null && val !== undefined && val !== "";
    const isValidEmail = (val) => /\S+@\S+\.\S+/.test(val);
    const createMinLengthValidator = (min) => (val) =>
      typeof val === "string" && val.length >= min;

    // Usage
    validateInput("hello@world.com", isValidEmail); // true
    validateInput("", isNotEmpty); // false
    validateInput("Bob", createMinLengthValidator(5)); // false
    validateInput("Charlie", createMinLengthValidator(5)); // true
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `ShippingStrategy`, `StandardShipping`, `ExpressShipping`</summary>

- **Concept:** Defines a family of algorithms, encapsulates each one, and makes them interchangeable. Strategy lets the algorithm vary independently from the clients that use it.
- **Example:**

  ```javascript
  // Strategy Interface (abstract class or convention)
  class ShippingStrategy {
    calculate(orderWeight) {
      throw new Error("Subclass must implement calculate.");
    }
  }

  // Concrete Strategies
  class StandardShipping extends ShippingStrategy {
    calculate(orderWeight) {
      return orderWeight * 1.5;
    } // $1.5 per kg
  }
  class ExpressShipping extends ShippingStrategy {
    calculate(orderWeight) {
      return orderWeight * 3.0;
    } // $3.0 per kg
  }
  class FreeShipping extends ShippingStrategy {
    calculate(orderWeight) {
      return 0;
    } // Free
  }

  // Context (the object that uses a strategy)
  class ShoppingCart {
    constructor() {
      this.weight = 0;
      this.shippingStrategy = new StandardShipping(); // Default strategy
    }
    setWeight(weight) {
      this.weight = weight;
    }
    setShippingStrategy(strategy) {
      this.shippingStrategy = strategy;
    }
    calculateShippingCost() {
      return this.shippingStrategy.calculate(this.weight);
    }
  }

  const cart = new ShoppingCart();
  cart.setWeight(5); // 5 kg

  console.log("Standard Shipping Cost:", cart.calculateShippingCost()); // Output: 7.5

  cart.setShippingStrategy(new ExpressShipping());
  console.log("Express Shipping Cost:", cart.calculateShippingCost()); // Output: 15

  cart.setShippingStrategy(new FreeShipping());
  console.log("Free Shipping Cost:", cart.calculateShippingCost()); // Output: 0
  ```

  _(Note: The Payment Strategy example is also a good illustration)._

</details>

<details>
<summary>Variant: `PaymentStrategy`, `CreditCardPayment`, `PayPalPayment`</summary>

- **Concept:** Defines a family of algorithms, encapsulates each one, and makes them interchangeable. This allows the algorithm to be selected at runtime without altering the client code.
- **Use Case:** Implementing different sorting strategies, payment methods, or compression algorithms where the client can choose the desired behavior dynamically.

- **OOP Approach:**

  ```javascript
  // Strategy Interface
  class PaymentStrategy {
    pay(amount) {
      throw new Error("pay() must be implemented");
    }
  }

  // Concrete Strategies
  class CreditCardPayment extends PaymentStrategy {
    pay(amount) {
      console.log(`Paid ${amount} using Credit Card`);
    }
  }

  class PayPalPayment extends PaymentStrategy {
    pay(amount) {
      console.log(`Paid ${amount} using PayPal`);
    }
  }

  // Context
  class ShoppingCart {
    constructor(paymentStrategy) {
      this.paymentStrategy = paymentStrategy;
    }

    checkout(amount) {
      this.paymentStrategy.pay(amount);
    }
  }

  // Usage
  const cart = new ShoppingCart(new CreditCardPayment());
  cart.checkout(100); // Paid 100 using Credit Card
  ```

- **Functional Approach:**

  - **Concept:** Achieved by passing different functions (strategies) as arguments to a higher-order function, allowing dynamic selection of behavior.
  - **Example:**

    ```javascript
    // Strategy Functions
    const creditCardPayment = (amount) =>
      console.log(`Paid ${amount} using Credit Card`);
    const payPalPayment = (amount) =>
      console.log(`Paid ${amount} using PayPal`);

    // Context Function
    const checkout = (paymentStrategy, amount) => paymentStrategy(amount);

    // Usage
    checkout(creditCardPayment, 100); // Paid 100 using Credit Card
    checkout(payPalPayment, 200); // Paid 200 using PayPal
    ```

</details>

<details>
<summary>Variant: `calculatePrice`, `discount`, `noDiscount`</summary>

- **Concept:** Defines a family of algorithms and makes them interchangeable.
- **OOP Approach:** (As previously shown, using Strategy classes).
- **Functional Approach:** Pass the algorithm (strategy) directly as a function argument.

  ```javascript
  // Context function that accepts a strategy function
  const calculatePrice = (basePrice, discountStrategy) => {
    const discount = discountStrategy(basePrice);
    console.log(`Applying discount: ${discount}`);
    return basePrice - discount;
  };

  // Strategy functions
  const noDiscount = (price) => 0;
  const tenPercentDiscount = (price) => price * 0.1;
  const fixedDiscount = (price) => (price > 50 ? 10 : 5); // $10 off if > $50, else $5

  // Using the strategies
  const itemPrice = 60;

  console.log(
    "Final Price (No Discount):",
    calculatePrice(itemPrice, noDiscount),
  );
  // Output: Applying discount: 0 -> Final Price: 60

  console.log(
    "Final Price (10% Off):",
    calculatePrice(itemPrice, tenPercentDiscount),
  );
  // Output: Applying discount: 6 -> Final Price: 54

  console.log(
    "Final Price (Fixed Discount):",
    calculatePrice(itemPrice, fixedDiscount),
  );
  // Output: Applying discount: 10 -> Final Price: 50

  console.log(
    "Final Price (Fixed Discount < 50):",
    calculatePrice(40, fixedDiscount),
  );
  // Output: Applying discount: 5 -> Final Price: 35
  ```

</details>

<details>
<summary>Variant: `strategies`, `execute`</summary>

_Interchangeable algorithms._

```javascript
const strategies = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
};
const execute = (strategy, a, b) => strategies[strategy](a, b);
```

</details>

### Template Method

- **Concept:** Defines the skeleton of an algorithm in a base class operation, deferring some steps to subclasses. Lets subclasses redefine certain steps of an algorithm without changing the algorithm's structure.
- **Use Case:** Creating frameworks where overall algorithm flow is fixed but specific implementations differ (e.g., data processing pipelines, report generation, build processes).
- **OOP Concept:** Defines an algorithm's skeleton in a method, deferring steps to subclasses. Relies on **Inheritance** and **Abstraction** (abstract methods for variant steps). **Polymorphism** allows subclasses to provide specific step implementations. **Encapsulation** protects the template method structure.
- **Functional Concept:** Can be simulated using **Higher-Order Functions**. A main function takes other functions as arguments for the variable steps, composing the overall algorithm. **Closures** can manage shared state if needed.
- **When to use:** Defining a fixed algorithm structure while allowing customization of specific steps.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Abstract Base Class
  class DataProcessor {
    // The template method - defines the overall algorithm
    processData(source) {
      const data = this.loadData(source); // Step 1 (implemented by subclass)
      const processed = this.parseData(data); // Step 2 (implemented by subclass)
      this.hookBeforeSave(); // Step 3 (optional hook)
      this.saveData(processed); // Step 4 (implemented by subclass)
      console.log("Data processing complete.");
    }

    // Abstract methods (or default implementations) to be overridden
    loadData(source) {
      throw new Error("Subclass must implement loadData.");
    }
    parseData(data) {
      throw new Error("Subclass must implement parseData.");
    }
    saveData(data) {
      throw new Error("Subclass must implement saveData.");
    }

    // Hook method (optional, provides default behavior)
    hookBeforeSave() {
      console.log("Executing hook before saving...");
    }
  }

  // Concrete Subclass 1: CSV Processor
  class CsvProcessor extends DataProcessor {
    loadData(source) {
      console.log(`Loading CSV from ${source}`);
      return "csv_col1,csv_col2";
    }
    parseData(data) {
      console.log("Parsing CSV data");
      return data.split(",");
    }
    saveData(data) {
      console.log("Saving CSV data:", data);
    }
  }

  // Concrete Subclass 2: JSON Processor
  class JsonProcessor extends DataProcessor {
    loadData(source) {
      console.log(`Loading JSON from ${source}`);
      return '{"key": "value"}';
    }
    parseData(data) {
      console.log("Parsing JSON data");
      return JSON.parse(data);
    }
    saveData(data) {
      console.log("Saving JSON data:", data);
    }
    // Override the hook
    hookBeforeSave() {
      console.log("JSON Processor: Special pre-save action.");
    }
  }

  // Usage
  console.log("--- Processing CSV ---");
  const csvProcessor = new CsvProcessor();
  csvProcessor.processData("file.csv");

  console.log("\n--- Processing JSON ---");
  const jsonProcessor = new JsonProcessor();
  jsonProcessor.processData("data.json");
  ```

---

- **Functional Approach:**

  - **Concept:** Pass functions representing the variable steps of the algorithm as arguments to a higher-order function that defines the overall structure.
  - **Example:**

    ```javascript
    // Higher-order function defining the template/skeleton
    const createDataProcessor = (config) => {
      // Default implementations (can be overridden by config)
      const defaults = {
        hookBeforeSave: () => console.log("Executing hook before saving..."),
      };
      // Merge defaults with provided config
      const steps = { ...defaults, ...config };

      // Check for required steps
      if (!steps.loadData || !steps.parseData || !steps.saveData) {
        throw new Error("Missing required processing steps in config.");
      }

      // The processing function using configured steps
      return (source) => {
        const data = steps.loadData(source);
        const processed = steps.parseData(data);
        steps.hookBeforeSave();
        steps.saveData(processed);
        console.log("Functional Data processing complete.");
      };
    };

    // Define step functions for CSV processing
    const csvConfig = {
      loadData: (source) => {
        console.log(`Func Loading CSV from ${source}`);
        return "csv_col1,csv_col2";
      },
      parseData: (data) => {
        console.log("Func Parsing CSV data");
        return data.split(",");
      },
      saveData: (data) => {
        console.log("Func Saving CSV data:", data);
      },
    };

    // Define step functions for JSON processing
    const jsonConfig = {
      loadData: (source) => {
        console.log(`Func Loading JSON from ${source}`);
        return '{"key": "value"}';
      },
      parseData: (data) => {
        console.log("Func Parsing JSON data");
        return JSON.parse(data);
      },
      saveData: (data) => {
        console.log("Func Saving JSON data:", data);
      },
      hookBeforeSave: () => {
        console.log("Func JSON Processor: Special pre-save action.");
      }, // Override hook
    };

    // Create processor functions
    const processCsv = createDataProcessor(csvConfig);
    const processJson = createDataProcessor(jsonConfig);

    // Usage
    console.log("--- Func Processing CSV ---");
    processCsv("file.csv");

    console.log("\n--- Func Processing JSON ---");
    processJson("data.json");
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `buildProcess`</summary>

_Defines algorithm skeleton._

```javascript
const buildProcess = (load, parse, save) => (source) =>
  save(parse(load(source)));
```

</details>

### Visitor

- **Concept:** Represents an operation to be performed on the elements of an object structure (like a Composite). Visitor lets you define a new operation without changing the classes of the elements on which it operates. Achieves separation of concerns: structure vs. operations on structure.
- **Use Case:** Performing distinct and unrelated operations on a complex object structure (e.g., Abstract Syntax Tree, document object model) without cluttering the element classes. Examples: type checking, code generation, pretty printing on an AST.
- **OOP Concept:** Represents an operation to be performed on elements of an object structure without changing element classes. Uses **Polymorphism** (visitor methods are called based on element type - often via double dispatch `element.accept(visitor)` which calls `visitor.visitElement(this)`) and **Abstraction** (visitor/element interfaces).
- **Functional Concept:** Uses **Pattern Matching** or conditional logic within a visitor function to apply different operations based on the data structure's type/shape. Relies on **Higher-Order Functions** if the visitor itself is passed around.
- **When to use:** Adding operations to complex structures (e.g., ASTs) without modifying them.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Element Interface (objects that can be visited)
  class DocumentPart {
    accept(visitor) {}
  }

  // Concrete Elements
  class Paragraph extends DocumentPart {
    constructor(text) {
      super();
      this.text = text;
    }
    accept(visitor) {
      visitor.visitParagraph(this);
    } // Double dispatch
  }
  class Heading extends DocumentPart {
    constructor(text, level) {
      super();
      this.text = text;
      this.level = level;
    }
    accept(visitor) {
      visitor.visitHeading(this);
    } // Double dispatch
  }
  class Document extends DocumentPart {
    constructor(parts) {
      super();
      this.parts = parts;
    }
    accept(visitor) {
      visitor.visitDocumentStart(this);
      this.parts.forEach((part) => part.accept(visitor)); // Visit children
      visitor.visitDocumentEnd(this);
    }
  }

  // Visitor Interface
  class Visitor {
    visitParagraph(paragraph) {}
    visitHeading(heading) {}
    visitDocumentStart(doc) {}
    visitDocumentEnd(doc) {}
  }

  // Concrete Visitor 1: HTML Exporter
  class HtmlExporter extends Visitor {
    constructor() {
      super();
      this.output = "";
    }
    visitDocumentStart(doc) {
      this.output += "<html><body>\n";
    }
    visitParagraph(p) {
      this.output += `  <p>${p.text}</p>\n`;
    }
    visitHeading(h) {
      this.output += `  <h${h.level}>${h.text}</h${h.level}>\n`;
    }
    visitDocumentEnd(doc) {
      this.output += "</body></html>";
    }
    getHtml() {
      return this.output;
    }
  }

  // Concrete Visitor 2: Word Counter
  class WordCounter extends Visitor {
    constructor() {
      super();
      this.count = 0;
    }
    countWords(text) {
      return (text.match(/\b\w+\b/g) || []).length;
    }
    visitParagraph(p) {
      this.count += this.countWords(p.text);
    }
    visitHeading(h) {
      this.count += this.countWords(h.text);
    }
    getCount() {
      return this.count;
    }
  }

  // Usage
  const doc = new Document([
    new Heading("Chapter 1", 1),
    new Paragraph("This is the first paragraph."),
    new Heading("Section 1.1", 2),
    new Paragraph("Another paragraph here."),
  ]);

  // Use HTML Exporter Visitor
  const htmlExporter = new HtmlExporter();
  doc.accept(htmlExporter);
  console.log("--- HTML Output ---");
  console.log(htmlExporter.getHtml());

  // Use Word Counter Visitor
  const wordCounter = new WordCounter();
  doc.accept(wordCounter);
  console.log("\n--- Word Count ---");
  console.log(`Total words: ${wordCounter.getCount()}`); // Output: 13
  ```

---

- **Functional Approach:**

  - **Concept:** Less direct mapping. Often involves using functions like `map`, `filter`, `reduce` combined with pattern matching (e.g., `switch` statements or object lookups based on node `type`) to recursively traverse and process data structures. The "visitor" logic is contained within these traversal functions rather than separate visitor objects.
  - **Example (Processing a similar document structure):**

    ```javascript
    // Represent document structure as data
    const documentData = {
      type: "document",
      parts: [
        { type: "heading", level: 1, text: "Chapter 1 Func" },
        { type: "paragraph", text: "First functional paragraph." },
        { type: "heading", level: 2, text: "Section 1.1 Func" },
        { type: "paragraph", text: "More functional text here." },
      ],
    };

    // "Visitor" Logic 1: Generate Markdown
    const generateMarkdown = (node) => {
      switch (node.type) {
        case "document":
          // Recursively process parts and join results
          return node.parts.map(generateMarkdown).join("\n");
        case "heading":
          return `${"#".repeat(node.level)} ${node.text}`;
        case "paragraph":
          return node.text;
        default:
          return "";
      }
    };

    // "Visitor" Logic 2: Count words
    const countWords = (text) => (text.match(/\b\w+\b/g) || []).length;
    const countTotalWords = (node) => {
      switch (node.type) {
        case "document":
          // Recursively process parts and sum results
          return node.parts.reduce(
            (sum, part) => sum + countTotalWords(part),
            0,
          );
        case "heading": // Fallthrough
        case "paragraph":
          return countWords(node.text);
        default:
          return 0;
      }
    };

    // Usage
    console.log("--- Functional Markdown Output ---");
    console.log(generateMarkdown(documentData));

    console.log("\n--- Functional Word Count ---");
    console.log(`Total words: ${countTotalWords(documentData)}`); // Output: 14
    ```

#### Minimal example

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

#### Alternative examples

<details>
<summary>Variant: `Visitor`, `ConcreteVisitor`, `Element`</summary>

- **Concept:** Allows you to define new operations on elements of an object structure without changing the elements themselves.
- **Use Case:** Implementing operations on a set of objects with different interfaces, such as calculating taxes for different types of products.

- **OOP Approach:**

  ```javascript
  // Visitor Interface
  class Visitor {
    visitConcreteElementA(element) {
      throw new Error("visitConcreteElementA() must be implemented");
    }

    visitConcreteElementB(element) {
      throw new Error("visitConcreteElementB() must be implemented");
    }
  }

  // Concrete Visitor
  class ConcreteVisitor extends Visitor {
    visitConcreteElementA(element) {
      console.log("Visiting ConcreteElementA");
    }

    visitConcreteElementB(element) {
      console.log("Visiting ConcreteElementB");
    }
  }

  // Element Interface
  class Element {
    accept(visitor) {
      throw new Error("accept() must be implemented");
    }
  }

  // Concrete Elements
  class ConcreteElementA extends Element {
    accept(visitor) {
      visitor.visitConcreteElementA(this);
    }
  }

  class ConcreteElementB extends Element {
    accept(visitor) {
      visitor.visitConcreteElementB(this);
    }
  }

  // Usage
  const elements = [new ConcreteElementA(), new ConcreteElementB()];
  const visitor = new ConcreteVisitor();
  elements.forEach((element) => element.accept(visitor));
  ```

- **Functional Approach:**

  - **Concept:** Uses functions to represent operations that can be applied to different data structures.
  - **Example:**

    ```javascript
    // Visitor Function
    const createVisitor = (visitA, visitB) => ({
      visitConcreteElementA: visitA,
      visitConcreteElementB: visitB,
    });

    // Usage
    const visitor = createVisitor(
      () => console.log("Visiting ConcreteElementA"),
      () => console.log("Visiting ConcreteElementB"),
    );
    visitor.visitConcreteElementA(); // Visiting ConcreteElementA
    visitor.visitConcreteElementB(); // Visiting ConcreteElementB
    ```

</details>

<details>
<summary>Variant: `traverse`</summary>

_Operates on object structures._
```javascript
const traverse = (node, visitor) => {
  visitor(node);
  if (node.children) node.children.forEach((n) => traverse(n, visitor));
};
```

</details>

---

## Additional Patterns

These are not among the 23 GoF patterns (Interpreter, the remaining GoF pattern, is omitted here) but are common in JavaScript codebases.

### Module / Revealing Module

- **Concept:** Uses closures (often IIFEs) to create private scopes, encapsulating implementation details and exposing only a public API. Essential before ES6 modules.
- **Use Case:** Creating reusable components/libraries with private state/methods, organizing code, avoiding global namespace pollution.
- **Details:**
- **Real-world Use Case:** Creating reusable components or libraries with private state and methods (e.g., counters, configuration managers, service objects) without polluting the global scope. Essential for understanding older JavaScript codebases and libraries.
- **When to use:** Encapsulating private state, avoiding global namespace pollution.

#### Detailed example

- **(This pattern is inherently functional/closure-based in JavaScript)**

- **OOP Approach:** N/A (Classes provide encapsulation differently).
- **Functional Approach:**

  ```javascript
  const createCounter = (initialValue = 0) => {
    let count = initialValue; // Private variable via closure

    // Private function (optional)
    const log = (message) =>
      console.log(`Counter [${initialValue}]: ${message}`);

    // Public API functions defined within the closure
    const increment = () => {
      count++;
      log(`Incremented to ${count}`);
    };
    const decrement = () => {
      count--;
      log(`Decremented to ${count}`);
    };
    const getValue = () => count;

    // Reveal the public API (Revealing Module Pattern)
    return {
      increment,
      decrement,
      value: getValue, // Can rename for public API
    };
  };

  // Each call creates a separate module instance with its own private state
  const counterA = createCounter();
  const counterB = createCounter(100);

  counterA.increment(); // Counter [0]: Incremented to 1
  counterB.decrement(); // Counter [100]: Decremented to 99
  console.log(counterA.value()); // 1
  console.log(counterB.value()); // 99
  // count, log are not accessible outside
  ```

#### Minimal example

- **Concept:** Uses closures (often IIFEs) to create private scope and expose only a public API. Essential before ES modules; ES modules (`import`/`export`) now provide file-level encapsulation natively, and classes offer `#private` fields.

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

#### More notes

- **Concept:** Encapsulates private state/logic using closures.
- **OOP Approach:** N/A (This _is_ fundamentally a functional/closure-based pattern, though classes can achieve encapsulation differently).

#### Alternative examples

<details>
<summary>Variant: `counterModule`, `_count`, `_log`</summary>

- **Concept:** Uses closures (often via IIFEs - Immediately Invoked Function Expressions) to create private scopes, encapsulating implementation details and exposing only a public API. This was fundamental for organizing code and avoiding global namespace pollution before ES6 modules.
  - **Module Pattern:** Returns an object literal containing the public members.
  - **Revealing Module Pattern:** Defines all members privately and then returns an object literal containing only _references_ to the private members that should be public. Often considered cleaner.
- **Example (Revealing Module Pattern):**

  ```javascript
  const counterModule = (function () {
    let _count = 0; // Private variable

    // Private function
    function _log(message) {
      console.log(`Counter log: ${message}`);
    }

    // Public functions (defined privately)
    function increment() {
      _count++;
      _log(`Incremented to ${_count}`);
    }

    function decrement() {
      _count--;
      _log(`Decremented to ${_count}`);
    }

    function getCount() {
      return _count;
    }

    // Reveal public pointers to private functions/variables
    return {
      increment: increment,
      decrement: decrement,
      value: getCount, // Can rename public members
    };
  })(); // IIFE executes immediately

  console.log(counterModule.value()); // Output: 0
  counterModule.increment(); // Output: Counter log: Incremented to 1
  counterModule.increment(); // Output: Counter log: Incremented to 2
  console.log(counterModule.value()); // Output: 2
  // counterModule._count; // Undefined - private variable is inaccessible
  // counterModule._log("test"); // Error - private function is inaccessible
  ```

</details>

<details>
<summary>Variant: `Counter`, `counter`, `createCounter`</summary>

- **Concept:** Encapsulates private variables and functions within a closure, exposing only the necessary parts.
- **Use Case:** Creating modules with private state and public methods.

- **OOP Approach:**

  ```javascript
  class Counter {
    #count = 0;

    increment() {
      this.#count++;
      return this.#count;
    }

    getCount() {
      return this.#count;
    }
  }

  const counter = new Counter();
  console.log(counter.increment()); // 1
  console.log(counter.getCount()); // 1
  ```

- **Functional Approach:**

  - **Concept:** Uses closures to create private state and exposes public methods.
  - **Example:**

    ```javascript
    const createCounter = () => {
      let count = 0;
      return {
        increment: () => ++count,
        getCount: () => count,
      };
    };

    const counter = createCounter();
    console.log(counter.increment()); // 1
    console.log(counter.getCount()); // 1
    ```

</details>

<details>
<summary>Variant: `counter`, `count`</summary>

_Encapsulates private state._
```javascript
const counter = (() => {
  let count = 0;
  return { increment: () => count++, get: () => count };
})();
```

</details>

### Dependency Injection (DI) / Inversion of Control (IoC)

- **Concept:** IoC is a principle where the control over object creation and dependency linking is inverted; instead of an object creating its dependencies, the dependencies are provided (injected) from an external source (like a container or manual wiring). DI is a common technique to achieve IoC. This promotes loose coupling and improves testability.
- **Use Case:** Managing dependencies in complex applications, especially within frameworks (Angular, NestJS), facilitating unit testing by allowing mock dependencies to be injected, making components more reusable and configurable.
- **When to use:** Swapping implementations (for example, mocks in tests); frameworks such as Angular and NestJS.

#### Detailed example

- **OOP Approach (Constructor Injection):**

  ```javascript
  // Dependency (e.g., a service)
  class NotificationService {
    send(message) {
      console.log(`OOP Notifier: Sending notification - ${message}`);
    }
  }

  // Dependent Class (requires the dependency)
  class OrderProcessor {
    // Dependency is injected via the constructor
    constructor(notifier) {
      if (!notifier)
        throw new Error("NotificationService dependency is required.");
      this.notificationService = notifier;
    }

    processOrder(orderId) {
      console.log(`Processing order ${orderId}...`);
      // Uses the injected dependency
      this.notificationService.send(`Order ${orderId} processed successfully.`);
      console.log(`Order ${orderId} finished.`);
    }
  }

  // Wiring dependencies (could be done manually or by a DI container)
  const notifier = new NotificationService();
  const orderProcessor = new OrderProcessor(notifier);

  orderProcessor.processOrder("A123");

  // For testing, inject a mock:
  class MockNotifier {
    send(message) {
      console.log(`MOCK Notifier: Would send - ${message}`);
    }
  }
  const mockProcessor = new OrderProcessor(new MockNotifier());
  mockProcessor.processOrder("B456");
  ```

---

- **Functional Approach:**

  - **Concept:** Pass dependencies explicitly as arguments to functions, often using higher-order functions or currying to "inject" them.
  - **Example (Function Argument Injection):**

    ```javascript
    // Dependency function
    const sendNotificationFunc = (message) => {
      console.log(`FUNC Notifier: Sending notification - ${message}`);
    };

    // Dependent function (takes dependency as an argument)
    const processOrderFunc = (notifierFunc, orderId) => {
      console.log(`Func Processing order ${orderId}...`);
      // Uses the passed-in dependency function
      notifierFunc(`Order ${orderId} processed successfully.`);
      console.log(`Func Order ${orderId} finished.`);
    };

    // "Injecting" by passing the function
    processOrderFunc(sendNotificationFunc, "C789");

    // For testing, pass a mock function:
    const mockNotifierFunc = (message) =>
      console.log(`FUNC MOCK Notifier: Would send - ${message}`);
    processOrderFunc(mockNotifierFunc, "D012");

    // Alternative: Using a higher-order function for configuration
    const createOrderProcessorWithNotifier = (notifierFunc) => {
      // Returns a function with the dependency "baked in" via closure
      return (orderId) => {
        console.log(`Func (configured) Processing order ${orderId}...`);
        notifierFunc(`Order ${orderId} processed successfully.`);
        console.log(`Func (configured) Order ${orderId} finished.`);
      };
    };

    const configuredProcessor =
      createOrderProcessorWithNotifier(sendNotificationFunc);
    configuredProcessor("E345");
    ```

#### Minimal example

- **Concept:** Instead of an object creating its dependencies, they are provided from outside (manual wiring or a container). DI is the common technique for achieving IoC. It improves loose coupling and testability.

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

#### Alternative examples

<details>
<summary>Variant: `Service`, `Logger`, `logger`</summary>

- **Concept:** A technique where one object supplies the dependencies of another object.
- **Use Case:** Decoupling the creation of objects from their usage.

- **OOP Approach:**

  ```javascript
  class Service {
    constructor(logger) {
      this.logger = logger;
    }

    execute() {
      this.logger.log("Service called");
    }
  }

  class Logger {
    log(message) {
      console.log(message);
    }
  }

  const logger = new Logger();
  const service = new Service(logger);
  service.execute(); // "Service called"
  ```

- **Functional Approach:**
  - **Concept:** Passes dependencies as arguments to functions.
  - **Example:**
    ```javascript
    const createService = (logger) => ({
      execute: () => logger.log("Service called"),
    });
    const service = createService({ log: (msg) => console.log(msg) });
    ```

</details>

### Null Object

- **Concept:** Provides a default object that acts as a safe, do-nothing placeholder for an expected object when `null` or `undefined` might otherwise occur. This avoids conditional checks for null/undefined before calling methods.
- **Use Case:** Simplifying client code by providing a non-null default object (e.g., a default "Guest" user, a "No Operation" logger, a default strategy), preventing null reference errors.
- **When to use:** Guest users, no-op loggers, default strategies.

#### Detailed example

- **OOP Approach:**

  ```javascript
  // Interface / Base Class for the expected object
  class AbstractUser {
    constructor(name) {
      this.name = name;
    }
    hasAccess(resource) {
      return false;
    } // Default deny
    getName() {
      return this.name;
    }
  }

  // Real Object
  class RealUser extends AbstractUser {
    constructor(name, permissions) {
      super(name);
      this.permissions = permissions || [];
    }
    hasAccess(resource) {
      return this.permissions.includes(resource);
    }
  }

  // Null Object (implements the same interface, provides safe defaults)
  class GuestUser extends AbstractUser {
    constructor() {
      super("Guest");
    }
    // Overrides provide safe, do-nothing, or default behavior
    hasAccess(resource) {
      return false;
    } // Guests have no access
    getName() {
      return "Guest";
    }
  }

  // Client code that might receive a real user or a null object
  const getUser = (userId) => {
    if (userId === 1) return new RealUser("Alice", ["dashboard", "profile"]);
    // Instead of returning null, return the Null Object
    return new GuestUser();
  };

  const user1 = getUser(1);
  const user2 = getUser(99); // Gets GuestUser

  // Client code doesn't need null checks
  console.log(
    `User 1: ${user1.getName()}, Access Dashboard? ${user1.hasAccess(
      "dashboard",
    )}`,
  );
  console.log(
    `User 2: ${user2.getName()}, Access Dashboard? ${user2.hasAccess(
      "dashboard",
    )}`,
  );
  ```

---

- **Functional Approach:**

  - **Concept:** Define default functions or configuration objects that provide safe, no-op, or default behavior, and return these defaults instead of `null` or `undefined`.
  - **Example:**

    ```javascript
    // Functions representing user actions
    const canAccessResource = (user, resource) => {
      // Check if user and permissions exist before checking includes
      return user && user.permissions && user.permissions.includes(resource);
    };
    const getUserDisplayName = (user) => {
      return user ? user.name : "Guest"; // Default name if user is null/undefined
    };

    // "Null Object" equivalent - a default user object structure
    const guestUserObject = {
      name: "Guest",
      permissions: [], // Empty permissions provide safe default for checks
    };

    // Client code getting user data (might return null/undefined or the guest object)
    const findUserFunc = (userId) => {
      if (userId === 1) return { name: "Bob", permissions: ["profile"] };
      // Instead of returning null/undefined, return the default object
      return guestUserObject;
    };

    const userFunc1 = findUserFunc(1);
    const userFunc2 = findUserFunc(100); // Gets guestUserObject

    // Client code uses functions that handle potential "nullness" or defaults
    console.log(
      `User Func 1: ${getUserDisplayName(
        userFunc1,
      )}, Access Profile? ${canAccessResource(userFunc1, "profile")}`,
    );
    console.log(
      `User Func 2: ${getUserDisplayName(
        userFunc2,
      )}, Access Profile? ${canAccessResource(userFunc2, "profile")}`,
    );

    // Alternative: Return default *functions*
    const getGreeter = (userName) => {
      if (userName) {
        return () => console.log(`Hello, ${userName}!`);
      } else {
        // Return a "null" function that does nothing safely
        return () => console.log("Hello, Guest!"); // Or just () => {}
      }
    };

    const greetAlice = getGreeter("Alice");
    const greetGuest = getGreeter(null);

    greetAlice();
    greetGuest();
    ```

#### Minimal example

- **Concept:** Return a safe, do-nothing object that implements the expected interface instead of `null`, so callers do not need null checks.

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

#### Alternative examples

<details>
<summary>Variant: `User`, `user1`, `user2`</summary>

- **Concept:** Uses polymorphism to implement a default behavior.
- **Use Case:** Avoiding null references by providing a default object.

- **OOP Approach:**

  ```javascript
  class User {
    constructor(name) {
      this.name = name || "Guest";
    }

    greet() {
      console.log(`Hello, ${this.name}!`);
    }
  }

  const user1 = new User("Alice");
  const user2 = new User();
  user1.greet(); // "Hello, Alice!"
  user2.greet(); // "Hello, Guest!"
  ```

- **Functional Approach:**
  - **Concept:** Returns a default object when no value is provided.
  - **Example:**
    ```javascript
    const createUser = (name) => (name ? { name } : { name: "Guest" });
    ```

</details>

<details>
<summary>Variant: `createUser`</summary>

_Provides default behavior._
```javascript
const createUser = (name) =>
  name ? { name } : { name: "Guest", isGuest: true };
```

</details>

### Specification (Filtering with Flexibility)


#### Example

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

---

## Functional Key Takeaways

- **Functional OOP Hybrid:** Use closures and higher-order functions to encapsulate state and behavior.
- **Immutability:** Avoid side effects by returning new objects.
- **Composition:** Build complex systems by combining simple functions.
- **Libraries:** Use Lodash/fp, Ramda, or RxJS for production-ready implementations.
