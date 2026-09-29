# Client Data Fetching Guide

This guide compares data fetching in React Client Components: the traditional imperative approach (`useEffect` + `useState`) and the declarative React 19 approach (`use()` + `<Suspense>` + Error Boundary), in the Next.js App Router.

---

## The Core Rule of `use()`

`use(promise)` unwraps a Promise during render:

- **Pending:** the component suspends and the nearest `<Suspense>` fallback shows.
- **Rejected:** the error is thrown to the nearest Error Boundary.
- **Resolved:** `use()` returns the value.

The Promise must be **cached (stable across renders)**. React discards all state and memoized values of a component that suspends before its first commit, so a promise created during that component's render (even inside `useMemo`) is recreated on every retry, and the component suspends forever. React logs: _"A component was suspended by an uncached promise"_.

Valid sources of a stable promise:

1. **Created in a Server Component** and passed as a prop (recommended).
2. **Created in an already-mounted parent** (event handler or state) and passed down.
3. **Cached outside React** (module-level cache keyed by arguments).
4. **A Suspense-enabled library** (TanStack Query `useSuspenseQuery`, SWR with `suspense: true`, Relay).

---

## Part 1: Fetch (`window.fetch`)

### 1. Traditional: `useEffect` + `useState`

#### When to use
- Legacy React codebases or React < 19.
- When you need manual control over the request lifecycle (custom abort logic, progress tracking) without Suspense.

#### How it works
You manually manage `data`, `loading`, and `error`. The fetch runs inside `useEffect` on mount and when dependencies change.

```tsx
"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
}

export default function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // AbortController cancels the stale request when userId changes or on unmount
    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setUser(await res.json());
      } catch (err) {
        if (controller.signal.aborted) return; // stale request, ignore
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        // An aborted request must not clear the loading state of the newer request
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [userId]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Failed: {error.message}</div>;
  if (!user) return null;

  return <div>Hello, {user.name}</div>;
}
```

#### Danger / Attention
- **Race conditions:** if `userId` changes quickly, an older response can overwrite a newer one. Always clean up (abort or an `ignore` flag).
- **Waterfalls:** the fetch starts only after the component mounts (fetch-on-render). Nested components that each fetch in `useEffect` run sequentially.
- **Strict Mode:** in development, effects run twice on mount; the cleanup must make that harmless.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| Familiar to most React developers. | High boilerplate (state + effect + cleanup). |
| No `<Suspense>` boundaries needed. | Fetch-on-render causes waterfalls. |
| | Manual loading and error handling. |

---

### 2. Modern: the `use()` Paradigm

#### When to use
- React 19 / Next.js 15+ Client Components.
- When you want **Suspense** to handle loading and **Error Boundaries** to handle errors.
- To write declarative code: say *what* data you need, not *how* to track its state.

#### Anatomy
1. **Error Boundary:** catches rejections.
2. **Suspense Boundary:** shows the loading fallback.
3. **`use()`:** unwraps the data.

```tsx
import { use } from "react";

// dataPromise must be stable (see "The Core Rule of use()")
const data = use(dataPromise);
```

#### Danger / Attention
- **Never** call `use(fetch(...))` directly in the component body: `fetch()` returns a new Promise every render.
- `use()` throws on rejection, so an Error Boundary is required.
- `use()` can be called conditionally (unlike other hooks), but only during render.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| Much less boilerplate. | Requires understanding promise stability. |
| Integrates natively with Suspense and streaming. | Naive usage suspends forever. |
| No `if (loading)` checks in UI logic. | Needs Error Boundaries. |

---

### 3. Passing a Promise from a Server Component (RSC → Client)

#### When to use
- **Initial page load:** data requirements are known at the route level (for example, from URL params).
- To avoid client-side waterfalls.

#### How it works
The Server Component starts the fetch but **does not await it**, then passes the Promise to the Client Component, which unwraps it with `use()`.

```tsx
// app/users/[id]/page.tsx (Server Component)
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import UserCard from "./user-card";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Next.js 15+: params is a Promise

  // Start the fetch, do NOT await it
  const userPromise = fetch(`https://api.example.com/users/${id}`).then((r) => r.json());

  return (
    <ErrorBoundary fallback={<p className="text-red-500">Could not load user.</p>}>
      <Suspense fallback={<Skeleton />}>
        <UserCard userPromise={userPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

```tsx
// app/users/[id]/user-card.tsx (Client Component)
"use client";

import { use } from "react";

interface User {
  name: string;
  email: string;
}

export default function UserCard({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // suspends while pending
  return (
    <div className="card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

#### Danger / Attention
- **Do not await the data in the RSC** if you want streaming: awaiting blocks this part of the tree until the fetch finishes.
- **Serialization:** the resolved value must be serializable by React (plain objects, arrays, primitives, `Date`, `Map`, `Set`, `BigInt`, typed arrays). Functions and class instances are not.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| **Best performance:** the fetch starts on the server immediately. | Passing promises deep in the tree is awkward. |
| No extra client network roundtrip. | Couples the Client Component to its server parent. |
| No fetch-on-render waterfall. | |

---

### 4. Client-Side Interactivity (data depends on client state)

#### When to use
- Data depends on client state that is not in the URL: search input, filters, button clicks.
- **Modals/overlays** showing details for an item that has no route.
- **Form previews** based on unsaved input.
- When you want to keep temporary UI state out of the URL.

#### How it works
Create the promise in the **already-mounted parent** (event handler or state) and pass it to the child that suspends. The parent never suspends, so its state keeps the promise stable.

```tsx
"use client";

import { use, useState, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Product {
  name: string;
  description: string;
  price: number;
}

const fetchProduct = (id: string): Promise<Product> =>
  fetch(`/api/products/${id}`).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

// Parent: owns the promise in state
export default function ProductInspector() {
  const [productPromise, setProductPromise] = useState<Promise<Product> | null>(null);

  return (
    <div className="p-6">
      <div className="mb-8 flex gap-4">
        <button onClick={() => setProductPromise(fetchProduct("1"))}>View Product A</button>
        <button onClick={() => setProductPromise(fetchProduct("2"))}>View Product B</button>
      </div>

      {productPromise && (
        <ErrorBoundary fallback={<p>Error loading product details.</p>}>
          <Suspense fallback={<p>Loading product data...</p>}>
            <ProductDetail productPromise={productPromise} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}

// Child: only unwraps
function ProductDetail({ productPromise }: { productPromise: Promise<Product> }) {
  const product = use(productPromise);
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-xl font-bold">{product.name}</h2>
      <p>{product.description}</p>
      <span className="text-green-600">${product.price}</span>
    </div>
  );
}
```

When the promise must be derived from a prop (for example, `query`), cache it outside React:

```tsx
const cache = new Map<string, Promise<Result[]>>();

function searchPromise(query: string) {
  if (!cache.has(query)) cache.set(query, fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json()));
  return cache.get(query)!;
}

function Results({ query }: { query: string }) {
  const results = use(searchPromise(query)); // same promise for the same query
  return <div>Results: {results.length}</div>;
}
```

For anything beyond simple cases (invalidation, refetching, cache eviction), use TanStack Query or SWR instead of a hand-written cache.

#### Why `useMemo` is not enough
`useMemo(() => fetchData(query), [query])` inside the component that calls `use()` looks right but fails: when the component suspends on its first render, React throws away its memoized values, so the retry creates a new promise and suspends again. Memoization only survives in components that have already committed.

#### Danger / Attention
- **Error handling:** wrap in an Error Boundary; `use()` throws rejections.
- **Debounce** text inputs so each keystroke does not start a request.
- **Refresh loss:** state is gone on reload; use the URL if the view must be shareable.
- **Transitions:** wrap the state update in `startTransition` to keep the old content visible instead of showing the fallback again.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| Handles client interactions declaratively. | Starts later than passing a promise from the server. |
| Keeps temporary UI state out of the URL. | Promise ownership must be designed deliberately. |

---

## Part 2: Server Actions

> Server Actions (Server Functions) are designed for **mutations**. They are sent as `POST` requests, are not cached, and Next.js runs them **one at a time per client**. For reads, prefer fetching in Server Components, a Route Handler, or a data library. The patterns below work, but know these limits.

### 1. Traditional: calling an Action in `useEffect`

#### When to use
- Integrating Server Actions into older components.
- Showing a loading state without Suspense.

#### How it works
Treat the Server Action as an async function and call it inside `useEffect`.

> **Note on `useTransition`:** you do not need `useTransition` for fetch-on-mount. `useTransition` keeps the old UI visible during an update (form submissions, navigation). On mount you usually want a loading state immediately, so local `isPending` state is appropriate.

```tsx
"use client";

import { useState, useEffect } from "react";
import { getUserAction } from "@/actions/user"; // a Server Action

export default function ServerActionProfile({ userId }: { userId: string }) {
  const [data, setData] = useState<{ name: string } | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setIsPending(true);
      setError(null);
      try {
        const result = await getUserAction(userId);
        if (!ignore) setData(result);
      } catch {
        if (!ignore) setError("Failed to load user");
      } finally {
        if (!ignore) setIsPending(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [userId]);

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!data) return null;

  return <div>User: {data.name}</div>;
}
```

#### Danger / Attention
- **Waterfalls:** starts only after mount (fetch-on-render).
- **Security:** Server Actions are public HTTP endpoints. Authenticate and authorize inside every action.
- **Sequential execution:** multiple actions from the same client queue behind each other.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| Simple transition from REST calls. | Fetch-on-render waterfall. |
| Manual control over loading state. | Verbose state management. |

---

### 2. Modern: the `use()` Paradigm

A Server Action returns a Promise, so `use()` can unwrap it like any other promise, under the same stability rule.

```tsx
import { use } from "react";

// actionPromise must be stable (created on the server or in a mounted parent)
const data = use(actionPromise);
```

#### Danger / Attention
- Calling an action during render without a stable promise triggers a new server execution on every retry.
- Server Actions can read cookies and headers, which makes them convenient for user-scoped reads.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| Type-safe end to end (shared types). | Same stability rule as fetch. |
| No API route boilerplate. | Not cached; sequential per client. |

---

### 3. Passing a Promise from a Server Component

#### When to use
- Passing initial data to Client Components with end-to-end type safety.

On the server, a Server Action is a plain async function: calling it from a Server Component does not create a network request. Calling the data function directly (without `"use server"`) is equivalent.

```tsx
// Server Component
import { Suspense } from "react";
import { getCohorts } from "@/data/cohort";
import ClientList from "./client-list";

export default function Page() {
  const cohortsPromise = getCohorts(); // do NOT await

  return (
    <Suspense fallback="Loading...">
      <ClientList cohortsPromise={cohortsPromise} />
    </Suspense>
  );
}
```

```tsx
// Client Component
"use client";

import { use } from "react";

export default function ClientList({ cohortsPromise }: { cohortsPromise: Promise<{ id: string; name: string }[]> }) {
  const cohorts = use(cohortsPromise);
  return (
    <ul>
      {cohorts.map((c) => (
        <li key={c.id}>{c.name}</li>
      ))}
    </ul>
  );
}
```

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| **Low latency:** the request starts on the server. | Couples client to server logic. |
| **Type safety:** automatic TypeScript inference. | Promise prop drilling. |

---

### 4. Client-Initiated Server Action Reads

#### When to use
- A Client Component reads data through a Server Action based on user input (search, "Load more").

Create the promise in an event handler of a mounted component, exactly as in Part 1, section 4:

```tsx
"use client";

import { use, useState, Suspense } from "react";
import { searchUsersAction } from "@/actions/user";

export default function UserSearch() {
  const [resultsPromise, setResultsPromise] = useState<ReturnType<typeof searchUsersAction> | null>(null);

  return (
    <form action={(formData) => setResultsPromise(searchUsersAction(String(formData.get("term"))))}>
      <input name="term" />
      <button type="submit">Search</button>
      {resultsPromise && (
        <Suspense fallback={<p>Searching...</p>}>
          <UserResults resultsPromise={resultsPromise} />
        </Suspense>
      )}
    </form>
  );
}

function UserResults({ resultsPromise }: { resultsPromise: Promise<{ count: number }> }) {
  const results = use(resultsPromise);
  return <div>Found {results.count} users</div>;
}
```

#### Danger / Attention
- Every new promise sends a `POST` request. Debounce text input.
- Without stable ownership, the action runs on every render and spams the server.

---

## Comparison

| Feature | Traditional (`useEffect`) | Modern (`use` + Suspense) |
| --- | --- | --- |
| **Code volume** | High (state + cleanup) | Low (unwrap data) |
| **Loading state** | Manual (`if (loading)`) | Declarative (`<Suspense>`) |
| **Error handling** | Manual (`try/catch` + state) | Declarative (`<ErrorBoundary>`) |
| **Start time** | After mount | On the server, or when the event fires |
| **Race conditions** | Manual (`AbortController` / ignore flag) | Each render reads the promise it was given, so stale results are not shown. The old request is not cancelled. |

---

## FAQ: Why pass a Promise instead of awaiting in the RSC?

**Q: I could await in the Server Component and pass the resolved value. Why pass a promise?**

**A:** Awaiting is fine and is the default way to write Server Components. Passing a promise solves one problem: **blocking**.

### The blocking way (`await`)

```tsx
export default async function Page() {
  // The server stops here for 2 seconds
  const data = await slowFetch();
  return <ClientComponent data={data} />;
}
```

- Without a `loading.tsx` or Suspense boundary above it, the user sees nothing until the fetch completes.
- **TTFB:** slow (fetch time + render time).

### The streaming way (pass a promise)

```tsx
export default function Page() {
  const dataPromise = slowFetch(); // starts, does not block

  return (
    <Suspense fallback={<Skeleton />}>
      <ClientComponent dataPromise={dataPromise} />
    </Suspense>
  );
}
```

- The shell (header, navigation, skeleton) is sent immediately; the data streams in when the promise resolves.
- **TTFB:** fast.

An async Server Component wrapped in `<Suspense>` (or a route `loading.tsx`) also streams. Passing a promise is useful when the data is consumed by a **Client Component**.

### Summary
- **Await** when the data is fast or must be in the initial HTML (for example, page title and metadata).
- **Pass a promise** when the data is slow and the UI shell should appear first.
- Use `useEffect` fetching only for legacy code or purely client-side synchronization.
