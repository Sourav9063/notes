# Pinia State Management Ultimate Cheatsheet

---

## 🏪 Core Store Definition

### defineStore()
- **Purpose**: Create a reusable state container
- **Syntax**: Options API vs Composition API styles
- **Best Practice**: Name stores with `use` prefix and `Store` suffix

```javascript
// Options API Style
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    }
  }
})

// Composition API Style
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)
  
  function login(email, password) {
    // Async logic
  }
  
  return { user, isLoggedIn, login }
})
```

---

## 📦 Store Usage in Components

### Basic Access
- **Auto-import**: Stores are available after initial declaration
- **Reactivity**: Full Vue reactivity system integration

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()
</script>

<template>
  <div>{{ counterStore.count }}</div>
  <button @click="counterStore.increment()">+</button>
</template>
```

### Reactive Destructuring
- **Use**: `storeToRefs` to maintain reactivity
- **Avoid**: Direct destructuring which breaks reactivity

```javascript
import { storeToRefs } from 'pinia'

const counterStore = useCounterStore()
const { count, double } = storeToRefs(counterStore) // Reactive
const { increment } = counterStore // Methods stay intact
```

---

## 🗄️ State Management

### State Definition
- **Type Safety**: Works best with TypeScript
- **Initialization**: Always use factory function

```typescript
state: () => ({
  items: [] as Item[],
  loading: false,
  error: null as string | null
})
```

### State Mutations
- **Direct**: `store.property = value`
- **Batch**: Use `$patch` for multiple changes
- **Reset**: `$reset()` returns to initial state

```javascript
// Single mutation
userStore.name = 'John'

// Multiple mutations
userStore.$patch({
  name: 'John',
  age: 30
})

// Functional patch
userStore.$patch((state) => {
  state.history.push(newEntry)
  state.modified = true
})

// Reset state
userStore.$reset()
```

---

## 🧮 Getters

### Derived State
- **Caching**: Automatic memoization
- **Params**: Accept arguments via returned function

```javascript
getters: {
  // Basic getter
  total: (state) => state.items.reduce((sum, item) => sum + item.price, 0),
  
  // Parameterized getter
  getById: (state) => (id) => state.items.find(item => item.id === id)
}
```

---

## 🎯 Actions

### Async Operations
- **Full Support**: Async/await works out of the box
- **Error Handling**: Use try/catch blocks

```javascript
actions: {
  async fetchUser(id) {
    try {
      this.loading = true
      const response = await api.get(`/users/${id}`)
      this.user = response.data
    } catch (error) {
      this.error = error.message
    } finally {
      this.loading = false
    }
  }
}
```

---

## 🔌 Plugins

### Custom Plugins
- **Use Cases**: Persistence, logging, authorization
- **Structure**: Function receiving context object

```javascript
// Persistent storage plugin
const persistencePlugin = ({ store }) => {
  const key = `pinia-${store.$id}`
  
  // Hydrate state
  const savedState = localStorage.getItem(key)
  if (savedState) {
    store.$patch(JSON.parse(savedState))
  }

  // Save on change
  store.$subscribe((mutation, state) => {
    localStorage.setItem(key, JSON.stringify(state))
  })
}

// Usage
const pinia = createPinia()
pinia.use(persistencePlugin)
```

---

## 🔍 Debugging & DevTools

### DevTools Integration
- **Time Travel**: Action history tracking
- **State Inspection**: Direct state modification

```javascript
// Enable strict mode for development
const pinia = createPinia()
pinia.use(devtoolsPlugin)
```

### Subscriptions
- **Global**: Watch all store changes
- **Local**: Per-store subscriptions

```javascript
// Global subscription
pinia.subscribe(({ storeId, type }) => {
  console.log(`Store ${storeId} triggered ${type}`)
})

// Local subscription
userStore.$subscribe((mutation, state) => {
  console.log('User state changed:', mutation.type)
})
```

---

## ⚡ Advanced Patterns

### Shared Stores
- **Singleton Pattern**: Auto-instantiated when used
- **Cross-Component**: Access same instance everywhere

```javascript
// In component A
const settings = useSettingsStore()

// In component B - same instance
const sameSettings = useSettingsStore()
```

### Action Subscriptions
- **Tracking**: Monitor action execution

```javascript
userStore.$onAction(({ name, after, onError }) => {
  console.log(`Action ${name} started`)

  after((result) => {
    console.log(`Action ${name} succeeded`)
  })

  onError((error) => {
    console.warn(`Action ${name} failed`, error)
  })
})
```

---

## 🛠️ TypeScript Integration

### Typed Stores
```typescript
interface UserState {
  name: string
  email: string
  age: number
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    name: '',
    email: '',
    age: 0
  }),
  // ...getters and actions
})
```

### Typed Getters/Actions
```typescript
getters: {
  formattedUser(): string {
    return `${this.name} <${this.email}>` // Auto-completion works
  }
},

actions: {
  async updateUser(payload: Partial<UserState>): Promise<void> {
    // Type-safe payload
  }
}
```

---

## 🧪 Testing Stores

### Unit Testing
```javascript
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '@/stores/counter'

describe('Counter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('increments count', () => {
    const store = useCounterStore()
    store.increment()
    expect(store.count).toBe(1)
  })
})
```

### Mocking Stores
```javascript
vi.mock('@/stores/user', () => ({
  useUserStore: () => ({
    user: { id: 1, name: 'Test User' },
    isLoggedIn: true,
    login: vi.fn()
  })
}))
```

---

## 🌐 SSR Support

### Hydration
```javascript
// Server-side
const pinia = createPinia()
app.use(pinia)

// After rendering
const initialState = pinia.state.value

// Client-side
const pinia = createPinia()
pinia.state.value = initialState
app.use(pinia)
```

---

## 🚀 Performance Tips

1. **Selective Loading**: Load stores only when needed
2. **Shallow Refs**: Use `shallowRef` for large datasets
3. **Batch Updates**: Prefer `$patch` over individual mutations
4. **Memoization**: Leverage getters for computed values
5. **Cleanup**: Remove unused subscriptions

---

[Pro Tip] Combine Pinia with Vue DevTools for powerful state inspection and time-travel debugging!

```javascript
// Enable strict mode for development
const pinia = createPinia()
pinia.use(devtoolsPlugin)
```
