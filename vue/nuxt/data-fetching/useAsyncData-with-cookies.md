# Nuxt `useAsyncData` with auth tokens: cookies vs `localStorage`

A common SSR issue in Nuxt: `localStorage` is a browser-only feature, and it doesn't exist in the server environment where `useAsyncData` first runs during server-side rendering (SSR). Reading the token from it inside the `useAsyncData` handler therefore throws on the server.

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

The cookie is available on both server and client. During SSR, a plain `$fetch` does **not** forward the incoming request's cookies, so use `useRequestFetch()` (call it in `setup`, not inside the handler):

```vue
<script setup>
const requestFetch = useRequestFetch(); // forwards request headers (incl. cookie) during SSR

const { data, error } = await useAsyncData('some-data', () =>
  requestFetch('/api/protected-data')
);
</script>
```

`useFetch('/api/protected-data')` does this automatically for relative URLs. For an external API, forward headers explicitly with `useRequestHeaders(['cookie'])`, also called in `setup`.

On the server, the API route reads the cookie (e.g. `getCookie(event, 'auth-token')`) to verify the user.

A cookie written by `useCookie` in the browser is readable by JavaScript. For stronger XSS protection, have the login API set an `httpOnly`, `secure`, `sameSite` cookie instead.

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
    if (import.meta.client) {
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
  - `import.meta.client` (formerly `process.client`) provides an extra layer of safety to ensure the code that accesses `localStorage` only executes in a browser environment.
  - `lazy: true` is recommended to prevent the page from blocking while waiting for the data. You can use the `pending` state to show a loading indicator to the user.
