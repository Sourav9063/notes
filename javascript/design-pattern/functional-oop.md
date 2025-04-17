### **Creational Patterns**  
*(Object creation mechanisms using functions/closures)*

1. **Singleton Pattern**  
   *Ensures a single instance using closures.*  
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
   *Creates objects based on input.*  
   ```javascript
   const createGreeter = (lang) => ({
     en: (name) => `Hello, ${name}!`,
     es: (name) => `Hola, ${name}!`
   }[lang]);
   const greet = createGreeter('es')('Alice'); // "Hola, Alice!"
   ```

3. **Builder Pattern**  
   *Constructs objects step-by-step.*  
   ```javascript
   const buildUser = (name) => {
     let role = 'user';
     return {
       setRole: (r) => { role = r; return this; },
       build: () => ({ name, role })
     };
   };
   const user = buildUser('Bob').setRole('admin').build();
   ```

4. **Prototype Pattern**  
   *Clones objects immutably.*  
   ```javascript
   const baseConfig = { theme: 'light' };
   const createDarkConfig = () => ({ ...baseConfig, theme: 'dark' });
   ```

5. **Abstract Factory Pattern**  
   *Creates families of related objects.*  
   ```javascript
   const createTheme = (theme) => ({
     button: theme === 'dark' ? () => 'Dark Button' : () => 'Light Button',
     dialog: theme === 'dark' ? () => 'Dark Dialog' : () => 'Light Dialog'
   });
   const darkUI = createTheme('dark');
   ```

6. **Dependency Injection**  
   *Injects dependencies via functions.*  
   ```javascript
   const createService = (logger) => ({
     execute: () => logger.log('Service called')
   });
   const service = createService({ log: (msg) => console.log(msg) });
   ```

7. **Null Object Pattern**  
   *Provides default behavior.*  
   ```javascript
   const createUser = (name) => name ? { name } : { name: 'Guest', isGuest: true };
   ```

---

### **Structural Patterns**  
*(Object composition and relationships)*

8. **Adapter Pattern**  
   *Converts interfaces.*  
   ```javascript
   const oldToNewAPI = (oldFn) => (args) => oldFn(args.x, args.y);
   ```

9. **Decorator Pattern**  
   *Adds behavior dynamically.*  
   ```javascript
   const withLogging = (fn) => (...args) => {
     console.log(`Calling ${fn.name}`);
     return fn(...args);
   };
   ```

10. **Proxy Pattern**  
    *Controls access.*  
    ```javascript
    const createProxy = (target) => ({
      get: (prop) => prop === 'secret' ? undefined : target[prop]
    });
    ```

11. **Facade Pattern**  
    *Simplifies complex systems.*  
    ```javascript
    const createPaymentFacade = () => ({
      process: (amount) => validate(amount) && chargeCard(amount)
    });
    ```

12. **Composite Pattern**  
    *Treats individual and group objects uniformly.*  
    ```javascript
    const renderComponent = (comp) => Array.isArray(comp) 
      ? comp.map(renderComponent) 
      : comp.render();
    ```

13. **Flyweight Pattern**  
    *Shares reusable state.*  
    ```javascript
    const createFlyweight = (sharedState) => (uniqueState) => 
      ({ ...sharedState, ...uniqueState });
    ```

14. **Bridge Pattern**  
    *Decouples abstraction from implementation.*  
    ```javascript
    const createRenderer = (draw) => (shape) => draw(shape);
    ```

15. **Module Pattern**  
    *Encapsulates private state.*  
    ```javascript
    const counter = (() => {
      let count = 0;
      return { increment: () => count++, get: () => count };
    })();
    ```

---

### **Behavioral Patterns**  
*(Object interaction and workflows)*

16. **Observer Pattern**  
    *Pub/Sub event system.*  
    ```javascript
    const createEventBus = () => {
      const listeners = {};
      return {
        subscribe: (event, fn) => (listeners[event] = [...(listeners[event] || []), fn]),
        emit: (event, data) => (listeners[event] || []).forEach(fn => fn(data))
      };
    };
    ```

17. **Strategy Pattern**  
    *Interchangeable algorithms.*  
    ```javascript
    const strategies = {
      add: (a, b) => a + b,
      multiply: (a, b) => a * b
    };
    const execute = (strategy, a, b) => strategies[strategy](a, b);
    ```

18. **Command Pattern**  
    *Encapsulates actions.*  
    ```javascript
    const createCommand = (execute, undo) => ({ execute, undo });
    const cmd = createCommand(() => console.log('Done'), () => console.log('Undone'));
    ```

19. **Iterator Pattern**  
    *Traverses collections.*  
    ```javascript
    const createIterator = (arr) => {
      let index = 0;
      return { next: () => index < arr.length ? arr[index++] : null };
    };
    ```

20. **Mediator Pattern**  
    *Centralizes communication.*  
    ```javascript
    const createChatRoom = () => ({
      users: [],
      send: (msg, sender) => this.users.forEach(u => u !== sender && u.receive(msg))
    });
    ```

21. **State Pattern**  
    *Changes behavior with state.*  
    ```javascript
    const createLight = () => ({
      state: 'red',
      change() { this.state = this.state === 'red' ? 'green' : 'red'; }
    });
    ```

22. **Memento Pattern**  
    *Saves/restores state.*  
    ```javascript
    const createEditor = () => {
      let content = '';
      return { 
        save: () => content, 
        restore: (saved) => { content = saved; }
      };
    };
    ```

23. **Chain of Responsibility**  
    *Processes via middleware chain.*  
    ```javascript
    const chain = [ (req, next) => { console.log('Step 1'); next(req); } ];
    const run = (req) => chain.reduceRight((next, fn) => () => fn(req, next), () => {})();
    ```

24. **Template Method Pattern**  
    *Defines algorithm skeleton.*  
    ```javascript
    const buildProcess = (load, parse, save) => (source) => save(parse(load(source)));
    ```

25. **Visitor Pattern**  
    *Operates on object structures.*  
    ```javascript
    const traverse = (node, visitor) => {
      visitor(node);
      if (node.children) node.children.forEach(n => traverse(n, visitor));
    };
    ```

---

**Key Takeaways:**  
- **Functional OOP Hybrid:** Use closures and higher-order functions to encapsulate state and behavior.  
- **Immutability:** Avoid side effects by returning new objects.  
- **Composition:** Build complex systems by combining simple functions.  
- **Libraries:** Use Lodash/fp, Ramda, or RxJS for production-ready implementations.
