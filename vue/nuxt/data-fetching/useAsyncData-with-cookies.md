You're running into a common issue in Nuxt 3: `localStorage` is a browser-only feature, and it doesn't exist in the server environment where `useAsyncData` first runs during server-side rendering (SSR). This leads to an error when your async function tries to access `localStorage` to get the authentication token on the server.

Here's how to fix this, with the recommended approach first.

-----

## Recommended Solution: Use Cookies for Authentication Tokens

The most robust and recommended way to handle authentication with SSR is to store your authentication token in a cookie instead of `localStorage`. Cookies are sent with every request to the server, making the token available during the server-side rendering process.

### 1\. Storing the Token in a Cookie

When a user logs in, save the authentication token in a cookie. You can use the `useCookie` composable for this:

```vue
<script setup>
const token = useCookie('auth-token');

async function login() {
  // Your login logic to get the token
  const authToken = 'your-authentication-token';
  token.value = authToken;
}
</script>
```

### 2\. Accessing the Token in `useAsyncData`

Now, you can access the cookie on both the server and the client. You can then use the `useRequestHeaders` composable to pass the cookie to your API call within `useAsyncData`.

```vue
<script setup>
import { useRequestHeaders } from '#app';

const { data, error } = await useAsyncData('some-data', () => {
  const headers = useRequestHeaders(['cookie']);

  return $fetch('/api/protected-data', {
    headers: {
      // Forward the cookie to the API route
      ...headers,
    }
  });
});
</script>
```

On the server-side, your API route can now access the cookie from the request headers to verify the user's identity.

-----

## Alternative: Client-Side Only Fetching

If you must use `localStorage` and don't need the data to be fetched during SSR for this specific component, you can disable server-side fetching for that `useAsyncData` call by setting the `server` option to `false`.

### Using the `server: false` Option

This approach will cause the data to be fetched only on the client-side, where `localStorage` is available. This means the user might see a loading state initially.

```vue
<script setup>
const { data, pending, error } = useAsyncData(
  'some-data',
  () => {
    if (process.client) {
      const token = localStorage.getItem('auth-token');
      return $fetch('/api/protected-data', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  },
  {
    server: false,
    lazy: true // Use lazy to show a loading state while fetching on the client
  }
);
</script>
```

In this example:

  - `server: false` ensures that this `useAsyncData` call only runs on the client.
  - `process.client` provides an extra layer of safety to ensure the code that accesses `localStorage` only executes in a browser environment.
  - `lazy: true` is recommended to prevent the page from blocking while waiting for the data. You can use the `pending` state to show a loading indicator to the user.
