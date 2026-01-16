# Client Data Fetching Guide

This guide details the evolution of data fetching in React Client Components, contrasting the Traditional (`useEffect`) approach with the Modern (`use` hook) paradigm, specifically within the Next.js App Router context.

---

## Part 1: Fetch (window.fetch)

### 1. Traditional
**`useEffect` + `useState`**

#### When this should be used
*   Legacy React codebases.
*   When you need absolute manual control over the request lifecycle (e.g., complex abort logic, fine-grained progress tracking) without using Suspense.
*   When you cannot use the `use` hook (older React versions).

#### How it works
You manually manage three states: `data`, `loading`, and `error`. The fetch is triggered inside `useEffect` on mount or when dependencies change.

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
    // 1. AbortController to cancel stale requests
    const controller = new AbortController();
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        }

        const data = await res.json();
        setUser(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // 2. Cleanup function
    return () => controller.abort();
  }, [userId]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Failed: {error.message}</div>;
  if (!user) return null;

  return <div>Hello, {user.name}</div>;
}
```

#### Danger / Attention
*   **Race Conditions:** If `userId` changes rapidly, an earlier request might resolve *after* a later one, showing stale data. You must implement cleanup (like the `AbortController` above).
*   **Waterfalls:** If nested components all fetch in `useEffect`, they will fetch sequentially (Fetch-on-Render), slowing down the page.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| Familiar to most React developers. | High boilerplate (state + effect + cleanup). |
| No need for `<Suspense>` boundaries. | "Fetch-on-render" causes waterfalls. |
| | Manual error handling is verbose. |

---

### 2. Modern
**The `use` Hook (Paradigm Overview)**

#### When this should be used
*   React 19 / Next.js 15+ Client Components.
*   When you want to leverage **Suspense** for loading states and **Error Boundaries** for error handling.
*   To adopt a "Declarative" coding style (telling React *what* you need, not *how* to get it).

#### How it works
The `use` API unwraps a Promise. If the Promise is pending, it **suspends** the component (shows the nearest `<Suspense>` fallback). If rejected, it throws (caught by Error Boundary).

```tsx
// Conceptual usage
import { use } from "react";

// Note: usage requires a stable promise (see patterns below)
const data = use(somePromise);
```

#### Danger / Attention
*   **Infinite Loops:** You cannot simply pass `fetch()` directly into `use()` inside a component body. `fetch()` returns a *new* Promise on every render, causing React to re-suspend endlessly.
*   **Must be stable:** The Promise passed to `use` must be created outside the render cycle or memoized (covered in patterns below).

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| drastically reduces boilerplate code. | Requires understanding of Promise stability. |
| Integrates natively with Suspense/Streaming. | "Naive" usage leads to infinite loops. |
| Eliminates `if (loading)` checks in UI logic. | |

---

### 3. Use with Passing Promise
**RSC -> Client Pattern**

#### When this should be used
*   **Initial Page Load:** When data requirements are known at the route level (e.g., fetching a user based on URL params).
*   To avoid **Client-Side Waterfalls**.

#### How it works
The **Server Component** initiates the fetch but *does not await it*. It passes the Promise to the Client Component. The Client Component unwraps it with `use()`.

```tsx
// Server Component (page.tsx)
import ClientComponent from "./client-component";

export default function Page({ params }) {
  // Start fetch, do NOT await
  const dataPromise = fetch(`https://api.com/users/${params.id}`).then(r => r.json());
  
  return (
    <Suspense fallback={<Skeleton />}>
      <ClientComponent dataPromise={dataPromise} />
    </Suspense>
  );
}

// Client Component
"use client";
import { use } from "react";

export default function ClientComponent({ dataPromise }) {
  const data = use(dataPromise); // Suspends here if pending
  return <div>{data.name}</div>;
}
```

#### Danger / Attention
*   **Do not await in RSC:** If you `await` in the Server Component, you block the entire UI from rendering until the fetch finishes. Pass the Promise to let the UI stream immediately.
*   **Serialization:** The Promise result must be serializable (JSON).

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| **Best Performance:** Fetch starts on server immediately. | Prop drilling promises can be awkward deeper in the tree. |
| No client-side network roundtrip delay. | Tightly couples Client Component to Server parent. |
| Zero "Fetch-on-Render" waterfall. | |

---

### 4. Use with `useMemo`
**Client-Side Interactivity**

#### When this should be used
*   **User Interaction:** When data depends on client state (search input, filters, button clicks) that isn't in the URL.
*   When a component is self-contained and cannot receive props from a Server Component.

#### How it works
You use `useMemo` to ensure the Promise is created *only when dependencies change*. This prevents the "new Promise every render" infinite loop.

```tsx
"use client";
import { use, useMemo, useState } from "react";

const fetchData = async (query) => {
  const res = await fetch(`/api/search?q=${query}`);
  return res.json();
};

export default function Search({ query }) {
  // Create promise ONLY when 'query' changes
  const dataPromise = useMemo(() => fetchData(query), [query]);

  // Unwrap
  const results = use(dataPromise);

  return <div>Results: {results.length}</div>;
}
```

#### Danger / Attention
*   **Dependency Array:** If you miss a dependency in `useMemo`, the data won't update. If you omit `useMemo`, you crash the browser with an infinite loop.
*   **Error Handling:** Must be wrapped in an `<ErrorBoundary>` because `use` throws errors instead of returning them.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| Handles dynamic client interactions cleanly. | Slower than "Passing Promise" (Client -> Server -> Client). |
| Keeps fetching logic co-located with UI. | Requires strict `useMemo` discipline. |

---

## Part 2: Server Action

### 1. Traditional
**Calling Action in `useEffect`**

#### When this should be used
*   When integrating Server Actions into older components.
*   When you want to show a loading spinner *without* Suspense (e.g., using a local `isPending` state).

#### How it works
Treat the Server Action exactly like an async function. Call it inside `useEffect`.

> **Note on `useTransition`**: You do **not** need `useTransition` here. `useTransition` is primarily for UI updates (like form submissions or navigation) where you want to keep the old UI visible while waiting. In `useEffect` (fetch-on-mount), we typically *want* to show a loading state immediately, so manual `useState` (`isPending`) is the correct approach.

```tsx
"use client";

import { useState, useEffect } from "react";
import { getUserAction } from "@/actions/user"; // Assume this is a Server Action

export default function ServerActionProfile({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsPending(true);
      try {
        // Direct call to Server Action
        const result = await getUserAction(userId);
        if (isMounted) setData(result);
      } catch (err) {
        if (isMounted) setError("Failed to load user");
      } finally {
        if (isMounted) setIsPending(false);
      }
    };

    load();

    return () => { isMounted = false; };
  }, [userId]);

  if (isPending) return <div>Loading Action...</div>;
  if (error) return <div>{error}</div>;

  return <div>User: {data.name}</div>;
}
```

#### Danger / Attention
*   **Waterfalls:** Like standard fetch, this only starts after the component mounts (Fetch-on-Render).
*   **Security:** Remember Server Actions are public API endpoints. Ensure proper authorization checks inside the action.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| Simple transition from REST API calls. | "Fetch-on-render" waterfall. |
| Manual control over loading state. | Verbose state management. |

---

### 2. Modern
**The `use` Paradigm**

#### When this should be used
*   To treat Server Actions as **Resources** rather than just Event Handlers.
*   To use Suspense for loading states while fetching data via Server Actions.

#### How it works
Server Actions return a Promise. The `use` hook can unwrap this Promise just like a standard `fetch` Promise.

```tsx
// Conceptual
import { use } from "react";
import { myAction } from "@/actions";

// Usage requires stability (see patterns below)
const data = use(myActionPromise);
```

#### Danger / Attention
*   **Execution Timing:** Server Actions run on the server. If you call them imprudently in render, you might inadvertently trigger multiple server executions if not memoized.
*   **Context:** Server Actions have access to headers/cookies, making them powerful data fetchers.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| Type-safe by default (shared types). | Infinite loops if not memoized (same as fetch). |
| No API route boilerplate needed. | |

---

### 3. Use with Passing Promise
**RSC -> Client Pattern**

#### When this should be used
*   **Preferred Method** for passing initial data to Client Components.
*   When you want end-to-end type safety from DB to Client without an API layer.

#### How it works
The Server Component invokes the Server Action (which returns a Promise) and passes that Promise to the Client.

```tsx
// Server Component
import { getCohortAction } from "@/actions/cohort";
import ClientList from "./client-list";

export default function Page() {
  // Invoke action, get Promise. Do NOT await.
  const cohortPromise = getCohortAction(); 
  
  return (
    <Suspense fallback="Loading...">
      <ClientList promise={cohortPromise} />
    </Suspense>
  );
}

// Client Component
"use client";
import { use } from "react";

export default function ClientList({ promise }) {
  const cohorts = use(promise);
  return <ul>{cohorts.map(c => <li key={c.id}>{c.name}</li>)}</ul>;
}
```

#### Danger / Attention
*   **Security:** Ensure the Server Action is safe to be called (it usually is, but verify permissions).
*   **Serialization:** Return values must be serializable. Dates need to be strings or numbers.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| **Zero-Latency:** Request starts on server. | Tightly couples Client to Server logic. |
| **Type Safety:** Automatic TypeScript inference. | Promise prop drilling. |

---

### 4. Use with `useMemo`
**Client-Side Interactivity**

#### When this should be used
*   When a Client Component needs to fetch data via a Server Action based on user input (e.g., "Load More" button, Search).
*   Alternative to `useEffect` for fetching.

#### How it works
Wrap the Server Action call in `useMemo` to create a stable Promise.

```tsx
"use client";
import { use, useMemo } from "react";
import { searchUsersAction } from "@/actions/user";

export default function UserSearch({ term }) {
  // Memoize the execution of the server action
  const searchPromise = useMemo(() => searchUsersAction(term), [term]);

  const results = use(searchPromise);

  return <div>Found {results.count} users</div>;
}
```

#### Danger / Attention
*   **Network Requests:** Every time `term` changes, a POST request (Server Action) is sent to the server. Debouncing might be needed for text inputs.
*   **Stability:** Without `useMemo`, the Server Action would be called on *every* render, spamming the server.

#### Pros and Cons
| Pros | Cons |
| :--- | :--- |
| Cleanest syntax for client-initiated server logic. | Higher server load if dependencies change often. |
| Leverages Suspense automatically. | Requires explicit memoization. |

---

## 5. FAQ: Why pass a Promise vs `await` in RSC?

**Q: Why do I need to pass the promise and use the `use` hook? I could just wait in the Server Component then pass the resolved value.**

**A:** You absolutely **can** just `await` the data in the Server Component and pass the result. In fact, that is the default way most people write Server Components.

However, the "Pass Promise" pattern exists to solve a specific performance bottleneck called **Blocking**.

### 1. The "Blocking" Way (Standard `await`)
When you `await` in a Server Component, you pause the **entire** page rendering until that fetch finishes.

```tsx
// Server Component
export default async function Page() {
  // 🛑 The server STOPS here for 2 seconds
  const data = await slowFetch(); 
  
  // The user sees a white screen until the above finishes
  return <ClientComponent data={data} />;
}
```
*   **Result:** The user stares at a blank browser tab for 2 seconds, then the whole page pops in at once.
*   **Time to First Byte (TTFB):** Slow (2s + rendering time).

### 2. The "Streaming" Way (Pass Promise)
When you pass the promise, the Server Component renders **immediately**. It sends the HTML (including a loading skeleton) to the browser *while* the data is still fetching in the background.

```tsx
// Server Component
export default function Page() {
  // ✅ The server DOES NOT stop. It starts the fetch...
  const dataPromise = slowFetch();
  
  // ...and immediately sends this HTML to the user
  return (
    <Suspense fallback={<Skeleton />}>
      <ClientComponent promise={dataPromise} />
    </Suspense>
  );
}
```
*   **Result:** The user sees the header, footer, and a skeleton **instantly**. 2 seconds later, the skeleton is replaced by real data.
*   **Time to First Byte (TTFB):** Fast (Instant).

### Summary
*   **Use `await`** if the data is fast or critical for SEO (like the page title).
*   **Pass Promise** if the data is slow and you want the user to see the UI shell immediately (Streaming).
