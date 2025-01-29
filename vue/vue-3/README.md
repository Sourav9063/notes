
# Vue 3 Composition API Cheatsheet

---

## Setup Function
- Core entry point for Composition API logic
- Replaces Options API lifecycle (created, mounted, etc.)
- Automatically exposes returned values to template
```vue
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
```

---

## Reactivity Core

### ref()
- Creates reactive primitive/value reference
- Requires `.value` access in JS
- Auto-unwraps in templates
```javascript
const count = ref(0)
count.value++
```

### reactive()
- Creates reactive object (nested properties included)
- No `.value` needed for access
- Avoid destructuring (use toRefs)
```javascript
const state = reactive({ count: 0 })
state.count++
```

### computed()
- Creates cached derived value
- Automatically tracks dependencies
```javascript
const double = computed(() => count.value * 2)
```

---

## Watch & React

### watch()
- Explicit dependency watching
- Deep watching available via `{ deep: true }`
```javascript
watch(count, (newVal) => {
  console.log('Count changed:', newVal)
})
```

### watchEffect()
- Immediate reactive dependency tracker
- Automatic cleanup on component unmount
```javascript
watchEffect(() => {
  console.log('Count:', count.value)
})
```

---

## Lifecycle Hooks
- Prefixed with `on` (e.g., `onMounted`)
- Used directly in setup function
```javascript
import { onMounted } from 'vue'
onMounted(() => {
  console.log('Component mounted')
})
```

---

## Composables
- Reusable stateful logic functions
- Convention: start with `use*` naming
```javascript
// useCounter.js
export function useCounter(initial = 0) {
  const count = ref(initial)
  const increment = () => count.value++
  return { count, increment }
}
```

---

### State Management
- **Purpose**: Manage state across components using composables.
- **Usage**:
  ```javascript
  import { ref } from 'vue';
  export function useCounter() {
    const count = ref(0);
    const increment = () => count.value++;
    return { count, increment };
  }
  ```

### Custom Hooks
- **Purpose**: Create reusable hooks for common tasks.
- **Usage**:
  ```javascript
  import { onMounted, onUnmounted } from 'vue';
  export function useMousePosition() {
    const x = ref(0);
    const y = ref(0);
    const update = (e) => {
      x.value = e.pageX;
      y.value = e.pageY;
    };
    onMounted(() => window.addEventListener('mousemove', update));
    onUnmounted(() => window.removeEventListener('mousemove', update));
    return { x, y };
  }
  ```

## State Management

### Pinia (Official)
- Preferred state management solution
```javascript
// store/counter.js
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++
    }
  }
})

// Component usage
const store = useCounterStore()
store.increment()
```

### Vuex 4
- Legacy state management
```javascript
import { useStore } from 'vuex'
const store = useStore()
store.commit('increment')
```

---

## Component Communication

### defineProps()
- Type-safe prop declaration
```javascript
const props = defineProps({
  title: { type: String, required: true }
})
```

### defineEmits()
- Event emission with validation
```javascript
const emit = defineEmits(['update', 'delete'])
emit('update', newValue)
```

### provide/inject
- Cross-component dependency injection
```javascript
// Provider
provide('api-key', '123-456')

// Consumer
const apiKey = inject('api-key')
```

---

## Advanced Reactivity

### toRefs()
- Maintain reactivity when destructuring
```javascript
const state = reactive({ x: 0, y: 0 })
const { x, y } = toRefs(state)
```

### shallowRef()
- Non-recursive reactivity
- Optimize performance for large objects
```javascript
const largeObj = shallowRef({ /* big data */ })
```

### customRef()
- Create custom ref with validation
```javascript
function useDebouncedRef(value, delay = 200) {
  return customRef((track, trigger) => ({
    get() { track(); return value },
    set(newVal) {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        value = newVal
        trigger()
      }, delay)
    }
  }))
}
```

---

## Template Refs
- Access DOM elements directly
```vue
<template>
  <input ref="inputRef">
</template>

<script setup>
const inputRef = ref(null)
onMounted(() => inputRef.value.focus())
</script>
```

---

## SSR Considerations

### useSSRContext()
- Access SSR context in setup
```javascript
import { useSSRContext } from 'vue'
const ctx = useSSRContext()
ctx.head += '<meta name="description" content="...">'
```

---

## Suspense Integration
- Async component handling
```javascript
// Parent component
<Suspense>
  <template #default> <AsyncComponent /> </template>
  <template #fallback> Loading... </template>
</Suspense>

// Async setup
async function setup() {
  const data = await fetchData()
  return { data }
}
```

---

## Effect Scope
- Group effects for cleanup
```javascript
const scope = effectScope()
scope.run(() => {
  watchEffect(() => console.log(count.value))
})
scope.stop() // Cleanup all effects
```

---

## TypeScript Support
- Full type inference
```typescript
interface User {
  id: number
  name: string
}

const user = ref<User>({ id: 1, name: 'John' })
```

---

## Custom Directives
- Reusable template behavior
```javascript
const vFocus = {
  mounted: (el) => el.focus()
}

// Usage
<input v-focus>
```
