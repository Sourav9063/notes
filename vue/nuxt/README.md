```markdown
# Nuxt 3 Comprehensive API Cheatsheet

---

## 🎛️ **Page & Layout APIs**

### `definePageMeta`
- **Purpose**: Configure page-specific metadata
- **Key Options**:
  - `middleware`: Route guards
  - `layout`: Custom layout
  - `validate`: Route validation
  - `keepalive`: Component caching

```vue
<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'track-analytics'],
  validate: async (route) => {
    return /^\d+$/.test(route.params.id)
  }
})
</script>
```

### Layout System
- **Directory**: `~/layouts`
- **Dynamic Layouts**:
```vue
<script setup>
setPageLayout('custom-layout')
</script>
```

---

## 🚦 **Middleware**

### Client-Side Middleware
- **Location**: `~/middleware/client.*.ts`
- **Enforcement**: Runs only on client
```typescript
// ~/middleware/client.analytics.ts
export default defineNuxtRouteMiddleware((to) => {
  if (process.client) {
    trackPageView(to.path)
  }
})
```

### Server Middleware
- **Location**: `~/middleware/server.*.ts`
- **Enforcement**: Runs on server
```typescript
// ~/middleware/server.auth.ts
export default defineNuxtRouteMiddleware((to) => {
  if (!isAuthenticated(to)) {
    return abortNavigation('Access denied')
  }
})
```

### Global Route Middleware
```typescript
// ~/middleware/global.ts
export default defineNuxtRouteMiddleware((to) => {
  console.log(`Navigating to: ${to.path}`)
})
```

---

## 🔄 **Composables**

### Routing
```javascript
const route = useRoute()
const router = useRouter()
router.push('/dashboard')
```

### Data Fetching
```javascript
const { data, pending } = useLazyFetch('/api/products', {
  transform: (products) => products.filter(p => p.inStock)
})
```

### State Management
```javascript
const counter = useState('global-counter', () => 0)
const cookie = useCookie('preferences', { maxAge: 60*60 })
```

### Server Context
```javascript
// Server-side only
const headers = useRequestHeaders(['cookie'])
const event = useRequestEvent()
```

---

## 🛠️ **Utility APIs**

### Error Handling
```javascript
throw createError({
  statusCode: 404,
  message: 'Page not found'
})

// Component usage
clearError()
```

### Navigation Control
```javascript
await navigateTo('/login', {
  redirectCode: 302,
  replace: true
})

// Prevent navigation
abortNavigation('Not allowed')
```

---

## 📡 **Server-Side APIs**

### Nitro Endpoints
```typescript
// ~/server/api/users/[id].ts
export default defineEventHandler(async (event) => {
  const id = event.context.params.id
  return await db.user.findUnique({ where: { id } })
})
```

### Server Utilities
```typescript
// ~/server/utils/auth.ts
export const validateSession = (event) => {
  const session = getCookie(event, 'session')
  return !!session
}
```

---

## 🔌 **Plugin APIs**

### Client Plugins
```typescript
// ~/plugins/toast.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('toast', (msg: string) => showToast(msg))
})
```

### Server Plugins
```typescript
// ~/plugins/db.server.ts
export default defineNuxtPlugin(() => {
  return { provide: { db: connectToDatabase() } }
})
```

---

## 🧩 **Component APIs**

### Async Components
```vue
<template>
  <LazyModal v-if="showModal" />
</template>
```

### Client-Only Components
```vue
<template>
  <ClientOnly>
    <ChartComponent />
  </ClientOnly>
</template>
```

---

## ⚙️ **Configuration APIs**

### `defineNuxtConfig`
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: { stripeKey: process.env.STRIPE_PK }
  },
  routeRules: {
    '/admin/**': { ssr: false }
  }
})
```

### Runtime Config
```javascript
const config = useRuntimeConfig()
console.log(config.public.stripeKey)
```

---

## 🛡️ **Security APIs**

### CSP Headers
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      meta: [{
        'http-equiv': 'Content-Security-Policy',
        content: 'default-src https:'
      }]
    }
  }
})
```

### Rate Limiting
```typescript
// ~/server/middleware/rate-limit.ts
export default defineEventHandler((event) => {
  const ip = event.node.req.socket.remoteAddress
  checkRateLimit(ip) // Implement your logic
})
```

---

## 🚀 **Deployment APIs**

### Nitro Hooks
```typescript
// ~/server/nitro.ts
export default defineNitroConfig({
  storage: {
    'redis': { driver: 'redis', url: process.env.REDIS_URL }
  }
})
```

### Prerendering
```bash
npx nuxi generate
# Outputs to ~/.output/public
```

---

## 🧪 **Testing APIs**

### Component Testing
```typescript
import { mount } from '@nuxt/test-utils'

test('renders correctly', async () => {
  const wrapper = await mount(MyComponent)
  expect(wrapper.html()).toContain('Hello')
})
```

### API Testing
```typescript
// ~/server/api/health.test.ts
describe('Health Check', () => {
  it('returns status', async () => {
    const res = await $fetch('/api/health')
    expect(res).toHaveProperty('status', 'OK')
  })
})
```

---

## 🔄 **Lifecycle Hooks**

### App Lifecycle
```typescript
// ~/plugins/init.ts
export default defineNuxtPlugin({
  name: 'app-init',
  setup(nuxtApp) {
    nuxtApp.hook('app:created', (vueApp) => {
      console.log('Vue app initialized')
    })
  }
})
```

### Page Transitions
```vue
<script setup>
definePageMeta({
  pageTransition: {
    name: 'fade',
    mode: 'out-in'
  }
})
</script>
```

---

[Tip] Use `nuxi typecheck` for TypeScript validation and `nuxi analyze` for bundle insights!
```bash
npx nuxi typecheck
npx nuxi analyze
```
---

## ⚡ Performance Optimizations

1. **Lazy Components**: `<LazyMyComponent />`
2. **Chunk Splitting**: `defineAsyncComponent`
3. **Caching**: `useCache` with SWR strategy
4. **Image Optimization**: `@nuxt/image-edge` module
5. **Preloading**: `usePreload` for critical assets

---

## 🌐 Internationalization

### `nuxt-i18n`
```typescript
// nuxt.config.ts
modules: [
  ['@nuxtjs/i18n', {
    locales: ['en', 'fr'],
    defaultLocale: 'en'
  }]
]

// Component usage
const { locale } = useI18n()
```

---

## 🔄 Real-Time Features

### WebSockets
```typescript
// ~/composables/useSocket.ts
export const useSocket = () => {
  const ws = new WebSocket('wss://api.example.com')
  const message = ref('')
  
  ws.onmessage = (event) => {
    message.value = event.data
  }
  
  return { message }
}
```

---

## 🎨 Styling

### CSS Modules
```vue
<template>
  <div :class="$style.container"></div>
</template>

<style module>
.container { padding: 1rem; }
</style>
```

### Tailwind Integration
```typescript
// nuxt.config.ts
modules: ['@nuxtjs/tailwindcss']
```

---

## 🛑 Security Best Practices

1. **CSP Headers**: Use `useHead` with `contentSecurityPolicy`
2. **Rate Limiting**: Implement in server middleware
3. **Sanitization**: Always sanitize user inputs
4. **Auth**: Use `@nuxtjs/auth-next` module
5. **CORS**: Configure in `server/middleware`

---

[Note] Always use `nuxi upgrade` to keep Nuxt and modules updated!

```bash
npx nuxi upgrade
```
