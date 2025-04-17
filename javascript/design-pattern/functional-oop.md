### **Creational Patterns**

_(Object creation mechanisms using functions/closures)_

1. **Singleton Pattern**  
   _Ensures a single instance using closures._

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

2. **Factory Pattern**  
   _Creates objects based on input._

   ```javascript
   const createGreeter = (lang) =>
     ({
       en: (name) => `Hello, ${name}!`,
       es: (name) => `Hola, ${name}!`,
     }[lang]);
   const greet = createGreeter("es")("Alice"); // "Hola, Alice!"
   ```

3. **Builder Pattern**  
   _Constructs objects step-by-step._

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

4. **Prototype Pattern**  
   _Clones objects immutably._

   ```javascript
   const baseConfig = { theme: "light" };
   const createDarkConfig = () => ({ ...baseConfig, theme: "dark" });
   ```

5. **Abstract Factory Pattern**  
   _Creates families of related objects._

   ```javascript
   const createTheme = (theme) => ({
     button: theme === "dark" ? () => "Dark Button" : () => "Light Button",
     dialog: theme === "dark" ? () => "Dark Dialog" : () => "Light Dialog",
   });
   const darkUI = createTheme("dark");
   ```

6. **Dependency Injection**  
   _Injects dependencies via functions._

   ```javascript
   const createService = (logger) => ({
     execute: () => logger.log("Service called"),
   });
   const service = createService({ log: (msg) => console.log(msg) });
   ```

7. **Null Object Pattern**  
   _Provides default behavior._
   ```javascript
   const createUser = (name) =>
     name ? { name } : { name: "Guest", isGuest: true };
   ```

---

### **Structural Patterns**

_(Object composition and relationships)_

8. **Adapter Pattern**  
   _Converts interfaces._

   ```javascript
   const oldToNewAPI = (oldFn) => (args) => oldFn(args.x, args.y);
   ```

9. **Decorator Pattern**  
   _Adds behavior dynamically._

   ```javascript
   const withLogging =
     (fn) =>
     (...args) => {
       console.log(`Calling ${fn.name}`);
       return fn(...args);
     };
   ```

10. **Proxy Pattern**  
    _Controls access._

    ```javascript
    const createProxy = (target) => ({
      get: (prop) => (prop === "secret" ? undefined : target[prop]),
    });
    ```

11. **Facade Pattern**  
    _Simplifies complex systems._

    ```javascript
    const createPaymentFacade = () => ({
      process: (amount) => validate(amount) && chargeCard(amount),
    });
    ```

12. **Composite Pattern**  
    _Treats individual and group objects uniformly._

    ```javascript
    const renderComponent = (comp) =>
      Array.isArray(comp) ? comp.map(renderComponent) : comp.render();
    ```

13. **Flyweight Pattern**  
    _Shares reusable state._

    ```javascript
    const createFlyweight = (sharedState) => (uniqueState) => ({
      ...sharedState,
      ...uniqueState,
    });
    ```

14. **Bridge Pattern**  
    _Decouples abstraction from implementation._

    ```javascript
    const createRenderer = (draw) => (shape) => draw(shape);
    ```

15. **Module Pattern**  
    _Encapsulates private state._
    ```javascript
    const counter = (() => {
      let count = 0;
      return { increment: () => count++, get: () => count };
    })();
    ```

---

### **Behavioral Patterns**

_(Object interaction and workflows)_

16. **Observer Pattern**  
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

17. **Strategy Pattern**  
    _Interchangeable algorithms._

    ```javascript
    const strategies = {
      add: (a, b) => a + b,
      multiply: (a, b) => a * b,
    };
    const execute = (strategy, a, b) => strategies[strategy](a, b);
    ```

18. **Command Pattern**  
    _Encapsulates actions._

    ```javascript
    const createCommand = (execute, undo) => ({ execute, undo });
    const cmd = createCommand(
      () => console.log("Done"),
      () => console.log("Undone"),
    );
    ```

19. **Iterator Pattern**  
    _Traverses collections._

    ```javascript
    const createIterator = (arr) => {
      let index = 0;
      return { next: () => (index < arr.length ? arr[index++] : null) };
    };
    ```

20. **Mediator Pattern**  
    _Centralizes communication._

    ```javascript
    const createChatRoom = () => ({
      users: [],
      send: (msg, sender) =>
        this.users.forEach((u) => u !== sender && u.receive(msg)),
    });
    ```

21. **State Pattern**  
    _Changes behavior with state._

    ```javascript
    const createLight = () => ({
      state: "red",
      change() {
        this.state = this.state === "red" ? "green" : "red";
      },
    });
    ```

22. **Memento Pattern**  
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

23. **Chain of Responsibility**  
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

24. **Template Method Pattern**  
    _Defines algorithm skeleton._

    ```javascript
    const buildProcess = (load, parse, save) => (source) =>
      save(parse(load(source)));
    ```

25. **Visitor Pattern**  
    _Operates on object structures._
    ```javascript
    const traverse = (node, visitor) => {
      visitor(node);
      if (node.children) node.children.forEach((n) => traverse(n, visitor));
    };
    ```

---

**Key Takeaways:**

- **Functional OOP Hybrid:** Use closures and higher-order functions to encapsulate state and behavior.
- **Immutability:** Avoid side effects by returning new objects.
- **Composition:** Build complex systems by combining simple functions.
- **Libraries:** Use Lodash/fp, Ramda, or RxJS for production-ready implementations.
