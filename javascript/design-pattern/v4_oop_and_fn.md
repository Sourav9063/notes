Design patterns, including both Object-Oriented Programming (OOP) and functional approaches, along with their concepts, use cases, and code examples:

---

### **1. Singleton Pattern**

- **Concept:** Ensures a class has only one instance and provides a single, global point of access to it.
- **Use Case:** Managing shared resources like logging services, database connection pools, or application-wide configuration.

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
  - **Concept:** Achieved using closures and module patterns to create and hold a single instance within a private scope.
  - **Example:**
    ```javascript
    const createLogger = () => {
      let instance;
      return () => {
        if (!instance) instance = { logs: [], log: (msg) => console.log(msg) };
        return instance;
      };
    };
    const getLogger = createLogger();
    const loggerA = getLogger();
    const loggerB = getLogger();
    console.log(loggerA === loggerB); // true
    ```

---

### **2. Factory Pattern**

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

---

### **3. Builder Pattern**

- **Concept:** Separates the construction of a complex object from its representation, allowing the same construction process to create different representations.
- **Use Case:** Constructing complex objects step by step.

- **OOP Approach:**

  ```javascript
  class UserBuilder {
    constructor(name) {
      this.user = { name };
      this.user.role = "user"; // default role
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
  - **Concept:** Uses a builder function to construct objects step by step.
  - **Example:**
    ```javascript
    const buildUser = (name) => {
      let role = "user";
      return {
        setRole: (r) => {
          role = r;
          return this;
        },
        build: () => ({ name, role }),
      };
    };
    const user = buildUser("Bob").setRole("admin").build();
    ```

---

### **4. Prototype Pattern**

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

---

### **5. Abstract Factory Pattern**

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

---

Certainly! Continuing from where we left off:

---

### **6. Dependency Injection**

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

---

### **7. Null Object Pattern**

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

---

### **8. Adapter Pattern**

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

---

### **9. Decorator Pattern**

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

---

### **10. Proxy Pattern**

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

---

### **11. Facade Pattern**

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

---

### **12. Composite Pattern**

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

---

### **13. Flyweight Pattern**

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

---

### **14. Bridge Pattern**

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

---

### **15. Module Pattern**

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

---

### **16. Observer Pattern**

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

---

Certainly! Let's continue with the **Strategy Pattern**, providing both Object-Oriented Programming (OOP) and Functional Programming (FP) approaches.

---

### **17. Strategy Pattern**

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

---

### **18. Command Pattern**

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

---

### **19. Iterator Pattern**

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

---

### **20. Mediator Pattern**

- **Concept:** Defines an object that encapsulates how a set of objects interact, promoting loose coupling by keeping objects from referring to each other explicitly.
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
        send: Certainly! Let's continue with the **Strategy Pattern**, providing both Object-Oriented Programming (OOP) and Functional Programming (FP) approaches.
    ```

---

### **17. Strategy Pattern**

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

---

### **18. Command Pattern**

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

---

### **19. Iterator Pattern**

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

---

Certainly! Let's continue with the **Mediator Pattern** and proceed with the remaining design patterns:

---

### **20. Mediator Pattern**

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

---

### **21. Chain of Responsibility Pattern**

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

---

### **22. State Pattern**

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

Certainly! Let's continue with the **State Pattern** and proceed with the remaining design patterns:

---

### **23. State Pattern**

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

---

### **24. Visitor Pattern**

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

---

### **25. Memento Pattern**

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

---

Certainly! Let's continue with the **Prototype Pattern** and proceed with the remaining design patterns:

---

### **26. Prototype Pattern**

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

---

### **27. Builder Pattern**

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

---

### **28. Factory Method Pattern**

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

---

### **29. Abstract Factory Pattern**

**Concept:** Provides an interface for creating families of related or dependent objects without specifying their concrete classes.

**Use Case:** Creating families of related products without specifying their concrete classes.

---

#### **OOP Approach:**

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

---

#### **Functional Approach:**

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

---

### **30. Adapter Pattern**

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

---

### **31. Composite Pattern**

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

---

### **32. Decorator Pattern**

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

---

### **33. Facade Pattern**

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

---

### **34. Flyweight Pattern**

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

  getFlyweight(shared
```
