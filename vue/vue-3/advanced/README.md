# Vue.js Advanced Features Cheatsheet

This cheatsheet covers advanced Vue.js concepts to enhance your application's reusability, extensibility, and maintainability.

---

## 1. Custom Directives (`v-`)

Extend Vue's core functionality by adding custom behavior to DOM elements.

### Basic Usage

```html
<template>
  <input v-focus />
  <div v-color-text="'blue'">This text will be blue.</div>
</template>

<script setup>
import { onMounted } from 'vue';

// Local directive definition
const vFocus = {
  mounted: (el) => el.focus()
};

// Local directive with a value
const vColorText = {
  mounted: (el, binding) => {
    el.style.color = binding.value;
  },
  updated: (el, binding) => {
    el.style.color = binding.value; // Update if value changes
  }
};
</script>
```

### Global Registration (in `main.js`/`main.ts`)

```javascript
// main.js or main.ts
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

app.directive('my-highlight', {
  mounted(el, binding) {
    el.style.backgroundColor = binding.value || 'yellow';
  },
  updated(el, binding) {
    el.style.backgroundColor = binding.value || 'yellow';
  }
});

app.mount('#app');
```

Then in any component:

```html
<template>
  <div v-my-highlight="'red'">Highlighted text</div>
</template>
```

### Directive Hooks

| Hook      | Description                                                                 | Arguments (`el`, `binding`, `vnode`, `prevVnode`)                                                                                                                                                                                                                             |
| :-------- | :-------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `created` | Before element's attributes/event listeners are applied.                    | `el`, `binding`, `vnode`, `prevVnode`                                                                                                                                                                                                                       |
| `beforeMount` | Before element is inserted into the DOM.                                  | `el`, `binding`, `vnode`, `prevVnode`                                                                                                                                                                                                                       |
| `mounted` | After element is inserted into the DOM. (Most common for direct DOM access) | `el`, `binding`, `vnode`, `prevVnode`                                                                                                                                                                                                                       |
| `beforeUpdate` | Before the component's VNode is updated.                                    | `el`, `binding` (new value), `vnode` (new VNode), `prevVnode` (old VNode)                                                                                                                                                                                               |
| `updated` | After the component and its children have updated.                          | `el`, `binding` (new value), `vnode` (new VNode), `prevVnode` (old VNode)                                                                                                                                                                                               |
| `beforeUnmount` | Before the element is removed from the DOM.                                 | `el`, `binding`, `vnode`, `prevVnode`                                                                                                                                                                                                                       |
| `unmounted` | After the element is removed from the DOM. (Clean up side effects here)     | `el`, `binding`, `vnode`, `prevVnode`                                                                                                                                                                                                                       |

### `binding` Object Properties

| Property   | Description                                            |
| :--------- | :----------------------------------------------------- |
| `value`    | The value passed to the directive (e.g., `'red'` in `v-my-highlight="'red'"`). |
| `oldValue` | The previous `value` (available in `updated`, `beforeUpdate`). |
| `arg`      | The argument passed to the directive (e.g., `'foo'` in `v-on:foo.bar="baz"`). |
| `modifiers`| An object containing modifiers (e.g., `{ bar: true }` in `v-on:foo.bar="baz"`). |
| `instance` | The component instance the directive is bound to.      |
| `dir`      | The directive definition object.                       |

---

## 2. Plugins (`app.use()`)

Add global-level functionality to your Vue application.

### Defining a Plugin

A plugin is an object with an `install` method or just a function.

```javascript
// plugins/MyAnalyticsPlugin.js
export default {
  install(app, options) {
    // 1. Add a global property
    app.config.globalProperties.$trackEvent = (eventName, payload) => {
      console.log(`Tracking event: ${eventName}`, payload);
      // Actual analytics API call here
    };

    // 2. Register a global component
    app.component('AnalyticsButton', {
      props: ['eventName'],
      template: `<button @click="$trackEvent(eventName)">{{ eventName }}</button>`
    });

    // 3. Provide something for the Composition API (more common in Vue 3)
    app.provide('analyticsOptions', options);
  }
};
```

### Installing a Plugin (in `main.js`/`main.ts`)

```javascript
// main.js or main.ts
import { createApp } from 'vue';
import App from './App.vue';
import MyAnalyticsPlugin from './plugins/MyAnalyticsPlugin';

const app = createApp(App);

// Install with options
app.use(MyAnalyticsPlugin, { appName: 'My Awesome App', apiKey: 'abc123xyz' });

app.mount('#app');
```

### Using Plugin Functionality

```html
<template>
  <div>
    <button @click="$trackEvent('user_click', { button: 'Submit' })">Submit</button>

    <AnalyticsButton event-name="Checkout" />

    <p>App Name from plugin: {{ analyticsInfo.appName }}</p>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const analyticsInfo = inject('analyticsOptions');
</script>
```

---

## 3. Provide / Inject (Dependency Injection)

Pass data down from a parent component to deeply nested children without prop drilling.

### Basic Usage

```html
<template>
  <div>
    <button @click="incrementCount">Increment Global Count</button>
    <ChildComponent />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue';
import ChildComponent from './ChildComponent.vue';

const globalCount = ref(0);

const incrementCount = () => {
  globalCount.value++;
};

// Provide a reactive value and a method
provide('appCount', globalCount);
provide('incrementAppCount', incrementCount);
</script>
```

```html
<template>
  <div>
    <p>Global Count: {{ count }}</p>
    <button @click="incrementLocal">Increment via Inject</button>
    <GrandchildComponent />
  </div>
</template>

<script setup>
import { inject } from 'vue';
import GrandchildComponent from './GrandchildComponent.vue';

// Inject the provided values
const count = inject('appCount');
const incrementLocal = inject('incrementAppCount');
</script>
```

```html
<template>
  <div>
    <p>Grandchild sees count: {{ count }}</p>
    <button @click="incrementGrandchild">Increment via Inject</button>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const count = inject('appCount');
const incrementGrandchild = inject('incrementAppCount');
</script>
```

### Providing Non-Reactive Values

```javascript
provide('staticMessage', 'This is a static message.');
```

### Injecting with a Default Value

```javascript
// If 'someKey' is not provided by an ancestor, defaultValue will be used.
const injectedValue = inject('someKey', 'defaultValue');
```

### Injecting with a Factory Function for Default

Useful for complex default values that might be reactive or expensive to compute.

```javascript
const injectedValue = inject('anotherKey', () => {
  return ref('Lazy default');
});
```

---

## 4. Slots (Content Distribution)

Compose components by distributing content from parent to child components.

### Basic Slot

```html
<template>
  <button class="my-button">
    <slot /> </button>
</template>
```

```html
<MyButton>
  Click Me!
</MyButton>
```

### Named Slots

Allow parents to place content in specific areas of the child.

```html
<template>
  <div class="card">
    <header>
      <slot name="header">
        <h3>Default Header</h3>
      </slot>
    </header>
    <main>
      <slot>
        <p>Default Content</p>
      </slot>
    </main>
    <footer>
      <slot name="footer" :year="2025">
        <p>Default Footer</p>
      </slot>
    </footer>
  </div>
</template>
```

```html
<Card>
  <template #header>
    <h1>My Custom Card Title</h1>
  </template>
  <p>This is the main card content.</p>
  <template #footer="{ year }">
    <p>&copy; {{ year }} - All Rights Reserved.</p>
  </template>
</Card>
```

### Scoped Slots

Allow the child component to provide data to the parent for the slot content.

```html
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <slot :item="item" :index="item.id" anotherProp="valueFromChild">
        {{ item.name }} </slot>
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue';

const items = ref([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' },
]);
</script>
```

```html
<ItemList>
  <template #default="slotProps">
    <strong>{{ slotProps.index }}.</strong> {{ slotProps.item.name.toUpperCase() }} ({{ slotProps.anotherProp }})
  </template>
</ItemList>
```

---

## 5. Teleport

Render a component's content in a different part of the DOM, outside its parent's element.

### Basic Usage

```html
<template>
  <button @click="showModal = true">Open Modal</button>

  <Teleport to="body">
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-content">
        <h2>My Modal</h2>
        <p>This modal content is rendered directly into the body!</p>
        <button @click="showModal = false">Close</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

const showModal = ref(false);
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
```

### `to` Attribute

* **String selector:** `to="body"`, `to="#app-modal-area"`
* **DOM Element:** Can be a reactive ref to a DOM element.

---

## 6. Suspense (Experimental)

Handle asynchronous setup logic in components and display a fallback while waiting.

### Basic Usage

```html
<template>
  <Suspense>
    <AsyncComponent />

    <template #fallback>
      <div>Loading Async Component...</div>
    </template>
  </Suspense>
</template>

<script setup>
import { defineAsyncComponent } from 'vue';

// Define an async component
const AsyncComponent = defineAsyncComponent(() =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve({
        template: '<div>Data loaded after 2 seconds!</div>'
      });
    }, 2000);
  })
);
</script>
```

### Error Handling

`Suspense` does not have an error handling hook itself. Errors propagate to the nearest Vue error boundary (e.g., using `onErrorCaptured`).

---

## 7. Transitions & TransitionGroup

Apply animation effects when elements or components are inserted, updated, or removed from the DOM.

### Single Element/Component Transition (`<Transition>`)

```html
<template>
  <button @click="show = !show">Toggle</button>
  <Transition name="fade">
    <p v-if="show">Hello World!</p>
  </Transition>
</template>

<script setup>
import { ref } from 'vue';
const show = ref(true);
</script>

<style>
/* 1. Declare transition states using `name` */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Optional: Additional classes for more complex transitions */
/* .fade-enter-to, .fade-leave-from { opacity: 1; } */
</style>
```

### List Transitions (`<TransitionGroup>`)

Requires a `key` attribute on children.

```html
<template>
  <button @click="shuffle">Shuffle</button>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item">{{ item }}</li>
  </TransitionGroup>
</template>

<script setup>
import { ref } from 'vue';

const items = ref([1, 2, 3, 4, 5]);

const shuffle = () => {
  items.value = items.value.sort(() => Math.random() - 0.5);
};
</script>

<style>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
/* Ensure leaving items take up space */
.list-leave-active {
  position: absolute;
}

/* For move transitions when order changes */
.list-move {
  transition: transform 0.5s ease;
}
</style>
```

---

## 8. Error Handling (`onErrorCaptured`)

Capture errors from descendant components.

```html
<template>
  <div>
    <ChildComponentWithError />
    <p v-if="error">An error occurred: {{ error.message }}</p>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue';
import ChildComponentWithError from './ChildComponentWithError.vue';

const error = ref(null);

onErrorCaptured((err, instance, info) => {
  error.value = err;
  console.error('Captured an error:', err, info, instance);
  // Return `false` to stop the error from propagating further up the component tree
  // return false;
});
</script>
```

```html
<template>
  <button @click="throwError">Throw Error</button>
</template>

<script setup>
const throwError = () => {
  throw new Error('Something went wrong in ChildComponentWithError!');
};
</script>
```

---

## 9. Global State Management (Pinia)

While not a Vue core feature, Pinia is the officially recommended state management library for Vue, offering a simple and type-safe way to manage global state.

### Installation

```bash
npm install pinia
# or
yarn add pinia
# or
pnpm add pinia
```

### Setup (in `main.js`/`main.ts`)

```javascript
// main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia); // Install Pinia as a Vue plugin
app.mount('#app');
```

### Defining a Store

```javascript
// stores/counter.js
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Eduardo',
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++;
    },
    async fetchUser(id) {
      // Simulate API call
      this.name = `User ${id}`;
    },
  },
});
```

### Using a Store in a Component

```html
<template>
  <div>
    <p>Count: {{ counter.count }}</p>
    <p>Double Count: {{ counter.doubleCount }}</p>
    <button @click="counter.increment()">Increment</button>
    <button @click="counter.fetchUser(123)">Fetch User</button>
  </div>
</template>

<script setup>
import { useCounterStore } from '../stores/counter';

const counter = useCounterStore();
</script>
```

---
