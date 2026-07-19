# Jotai Notes

Jotai is an atomic state management library for React. An atom is a small unit of state, and components subscribe only to the atoms they read. This keeps updates focused: changing one atom only re-renders components whose atom graph depends on that value.

## Mental Model

An atom created with `atom()` is an immutable config object, not the value itself. The value lives in a Jotai store. A `Provider` creates a scoped store for its subtree; without a `Provider`, Jotai uses an implicit global store.

Use atoms for client-side state: form values, UI flags, caches, local optimistic data, derived values, and action coordination. Atom configs can live in shared modules. In Next.js App Router, components that use Jotai hooks or browser APIs must be Client Components; pass server-fetched initial data into them when needed.

### Single Source of Truth

"Single source of truth" means one authoritative owner for each fact, not that
all state must live in Jotai:

- The server/API owns persisted server data.
- The URL owns shareable navigation, filter, sort, and pagination state.
- Browser storage owns persisted client preferences.
- Jotai owns the current client working state, local optimistic state, and
  explicitly managed client caches.
- Derived atoms project existing state. Do not copy a derived value into a
  second writable atom unless an explicit synchronization boundary owns it.

Hydrating server data transfers an initial snapshot into a Jotai store. Decide
whether Jotai becomes the client authority after that point or whether later
server payloads must explicitly replace it. Do not leave both independently
writable.

## What Jotai Passes to Atom Functions

Jotai calls atom read and write functions for you. Components do not pass `get`, `set`, or `signal`.

```ts
const readAtom = atom((get) => {
  return get(sourceAtom);
});

const asyncReadAtom = atom(async (get, options) => {
  // options.signal is provided by Jotai.
});

const writeAtom = atom(null, (get, set, update, anotherArg) => {
  // update and anotherArg are passed to the setter from useSetAtom/useAtom.
});
```

Key arguments:

- `get(atom)`: reads another atom's current value. In read functions, `get` tracks dependencies. In write functions, `get` reads current values but is not dependency-tracked.
- `set(atom, valueOrUpdater)`: writes to another atom. It is available only in write functions.
- `update`: the argument passed by the component when it calls the setter. Write atoms can accept multiple arguments.
- `options.signal`: an `AbortSignal` passed by Jotai to async read functions. Pass it to `fetch` to cancel stale requests.
- `options.setSelf`: an advanced escape hatch available in read options. Prefer normal write atoms unless you are building atom utilities.

Example of how component calls map to write arguments:

```tsx
const save = useSetAtom(saveUserAtom);

save({ id: 1, name: "Ada" }, { optimistic: true });
```

```ts
const saveUserAtom = atom(
  null,
  (_get, set, update: User, options: { optimistic: boolean }) => {
    // update is { id: 1, name: "Ada" }
    // options is { optimistic: true }
    set(userAtom, update);
  },
);
```

## Installation

```bash
bun add jotai
```

Core imports:

```ts
import { atom, useAtom, useAtomValue, useSetAtom, Provider } from "jotai";
```

Helpers live in:

```ts
import { atomWithStorage, useHydrateAtoms } from "jotai/utils";
```

## Creating Atoms

### Primitive Atoms

Primitive atoms hold writable state directly.

```ts
import { atom } from "jotai";

export const countAtom = atom(0);
export const themeAtom = atom<"light" | "dark">("light");
export const userAtom = atom({ id: 1, name: "Ada" });
```

Use them like `useState`, but the state can be shared anywhere under the same store.

```tsx
"use client";

import { useAtom } from "jotai";
import { countAtom } from "./store";

export function Counter() {
  const [count, setCount] = useAtom(countAtom);

  return (
    <button onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </button>
  );
}
```

### Read-Only Derived Atoms

Read-only atoms compute values from other atoms. The `get` calls are tracked, so the atom recomputes when dependencies change.

```ts
const firstNameAtom = atom("Ada");
const lastNameAtom = atom("Lovelace");

export const fullNameAtom = atom((get) => {
  return `${get(firstNameAtom)} ${get(lastNameAtom)}`;
});
```

### Write-Only Action Atoms

Write-only atoms perform updates. Conventionally, the read value is `null`.

```ts
const countAtom = atom(0);

export const incrementAtom = atom(null, (get, set, amount: number = 1) => {
  set(countAtom, get(countAtom) + amount);
});
```

Use `useSetAtom` when a component only writes:

```tsx
const increment = useSetAtom(incrementAtom);
return <button onClick={() => increment(5)}>+5</button>;
```

### Read-Write Derived Atoms

Read-write atoms expose a computed value and a custom setter.

```ts
const centsAtom = atom(1299);

export const dollarsAtom = atom(
  (get) => get(centsAtom) / 100,
  (_get, set, dollars: number) => {
    set(centsAtom, Math.round(dollars * 100));
  },
);
```

### Async Read Atoms

An atom read function can return a promise. Components reading it should be inside `Suspense`, or you can wrap it with `loadable`.

Use a checked, validated fetch boundary. `fetch` does not reject for HTTP 4xx or
5xx responses, and decoded JSON is untrusted input.

```ts
async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  parse: (value: unknown) => T,
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const value: unknown = await response.json();
  return parse(value);
}
```

In real code, `parse` should normally be a schema parser such as
`userSchema.parse`, not a type assertion.

```ts
const userIdAtom = atom(1);

export const userAtom = atom(async (get, { signal }) => {
  const id = get(userIdAtom);
  return fetchJson(`/api/users/${id}`, { signal }, userSchema.parse);
});
```

Jotai passes `{ signal }` into the async read function. The component does not pass it. When `userIdAtom` changes before the request finishes, Jotai aborts the previous signal before starting the next read.

```tsx
<Suspense fallback={<p>Loading...</p>}>
  <UserProfile />
</Suspense>
```

### Async Write Atoms

Write functions can also be async. This is useful for user-triggered fetches, mutations, and caches.

Important: an async write atom does not suspend the component just because the write function is awaiting. Suspense is triggered by reading a promise from render, usually through an async read atom or by throwing a stored in-flight promise from a read atom. If a button action should show Suspense, store the promise in an atom that the UI reads.

```ts
type Post = { id: number; title: string };

type CacheEntry<T> =
  | { status: "pending"; request: Promise<T> }
  | { status: "success"; data: T }
  | { status: "error"; error: unknown };

const postIdAtom = atom(1);
const postCacheAtom = atom<Record<number, CacheEntry<Post>>>({});

export const selectPostAtom = atom(null, async (get, set, id: number) => {
  const cached = get(postCacheAtom)[id];

  if (cached?.status === "success") {
    set(postIdAtom, id);
    return cached.data;
  }

  if (cached?.status === "pending") {
    set(postIdAtom, id);
    return cached.request;
  }

  const request = fetchJson(`/api/posts/${id}`, undefined, postSchema.parse);
  set(postCacheAtom, (cache) => ({
    ...cache,
    [id]: { status: "pending", request },
  }));
  set(postIdAtom, id);

  try {
    const post = await request;
    set(postCacheAtom, (cache) =>
      cache[id]?.status === "pending" &&
      cache[id].request === request
        ? { ...cache, [id]: { status: "success", data: post } }
        : cache,
    );
    return post;
  } catch (error) {
    set(postCacheAtom, (cache) =>
      cache[id]?.status === "pending" &&
      cache[id].request === request
        ? { ...cache, [id]: { status: "error", error } }
        : cache,
    );
    throw error;
  }
});
```

The error entry permits a later `selectPostAtom` call to retry. Comparing the
stored request before settling prevents an older request from overwriting a
newer cache entry.

The returned `post` is returned to the caller of the setter:

```tsx
const selectPost = useSetAtom(selectPostAtom);
const post = await selectPost(2);
```

It is not readable state unless you also store it with `set`.
Because this async setter can reject, an event handler that calls it must
`await`/catch it or deliberately pass the returned Promise to another error
handling boundary. Suspense handling a stored request does not automatically
handle the separate Promise returned to the event caller.

### Async Read-Write Atoms

Read-write atoms can be async on the read side, the write side, or both. Use this shape when one atom should expose async data and also define a custom async update API.

```ts
type User = { id: number; name: string };

const userIdAtom = atom(1);

export const editableUserAtom = atom(
  async (get, { signal }): Promise<User> => {
    const id = get(userIdAtom);
    return fetchJson(`/api/users/${id}`, { signal }, userSchema.parse);
  },
  async (_get, set, update: { id: number; name?: string }) => {
    if (update.name) {
      const response = await fetch(`/api/users/${update.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: update.name }),
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    set(userIdAtom, update.id);
  },
);
```

Use it with `useAtom` when a component needs both the loaded value and the custom setter:

```tsx
"use client";

import { Suspense } from "react";
import { useAtom } from "jotai";
import { editableUserAtom } from "./store";

function EditableUser() {
  const [user, updateUser] = useAtom(editableUserAtom);

  return (
    <section>
      <h2>{user.name}</h2>
      <button onClick={() => updateUser({ id: user.id, name: "Grace" })}>
        Rename
      </button>
      <button onClick={() => updateUser({ id: user.id + 1 })}>
        Next user
      </button>
    </section>
  );
}

export function EditableUserWithSuspense() {
  return (
    <Suspense fallback={<p>Loading user...</p>}>
      <EditableUser />
    </Suspense>
  );
}
```

`signal` is an `AbortSignal` passed by Jotai to async read functions. It is not passed from `useAtom`. Jotai creates it so stale async reads can be aborted before a new read starts, such as when `userIdAtom` changes while a previous fetch is still pending.

```ts
export const userAtom = atom(async (get, { signal }) => {
  const id = get(userIdAtom);
  return fetchJson(`/api/users/${id}`, { signal }, userSchema.parse);
});
```

Pass `signal` to `fetch` so the browser can cancel obsolete requests. If the async work does not support aborting, you can ignore `signal`, but the stale promise may still finish in the background.

The read function still derives or loads a value. The write function performs mutations with `set`. Avoid writing to other atoms from the read function; keep side effects in write atoms, event handlers, or framework data-loading boundaries.

### Atom Shape Summary

```ts
atom(initialValue);                    // primitive writable atom
atom((get) => value);                  // read-only derived atom
atom(null, (get, set, arg) => result); // write-only action atom
atom(
  (get) => value,
  (get, set, arg) => result,
);                                     // read-write derived atom

atom(async (get) => value);                  // async read atom
atom(null, async (get, set, arg) => result); // async write atom
atom(
  async (get) => value,
  async (get, set, arg) => result,
);                                           // async read-write atom
```

## Reading and Writing in Components

Use the smallest hook that matches the component's job.

```tsx
const [value, setValue] = useAtom(valueAtom); // read and write
const value = useAtomValue(valueAtom);        // read only
const setValue = useSetAtom(valueAtom);       // write only
```

Prefer `useAtomValue` and `useSetAtom` when possible. It makes intent clearer and can avoid subscribing components to values they do not render.

## Composition Patterns

### Derived State

```ts
const todosAtom = atom([
  { id: 1, text: "Ship", done: false },
  { id: 2, text: "Review", done: true },
]);

const completedTodosAtom = atom((get) => {
  return get(todosAtom).filter((todo) => todo.done);
});
```

### Action Atoms for Business Logic

Keep state transitions in atoms instead of spreading logic across components.

```ts
const addTodoAtom = atom(null, (_get, set, text: string) => {
  set(todosAtom, (todos) => [
    ...todos,
    { id: Date.now(), text, done: false },
  ]);
});
```

### Atoms in Atoms

You can store atom configs inside another atom for dynamic state graphs.

```ts
const todoAtomsAtom = atom([atom("first task"), atom("second task")]);

const addTodoAtom = atom(null, (get, set, text: string) => {
  set(todoAtomsAtom, [...get(todoAtomsAtom), atom(text)]);
});
```

This is powerful, but keep references stable. If you create atoms during render, wrap them with `useMemo` or `useRef`.

```tsx
const itemAtom = useMemo(() => atom(item), [item]);
```

### Atom Creator Functions

Atom creators are plain functions that return atoms. Use them when several features share the same atom pattern.

```ts
function createToggleAtom(initialValue = false) {
  const baseAtom = atom(initialValue);
  const toggleAtom = atom(null, (get, set) => {
    set(baseAtom, !get(baseAtom));
  });

  return { baseAtom, toggleAtom };
}
```

## Async, Suspense, and Loading

Jotai async atoms integrate with React Suspense. If a read atom returns or throws a pending promise, React shows the nearest `Suspense` fallback.

### Loading with Suspense

Use Suspense when the component can wait for atom data before rendering.

```ts
const postIdAtom = atom(1);

const postAtom = atom(async (get, { signal }) => {
  const id = get(postIdAtom);
  return fetchJson(`/api/posts/${id}`, { signal }, postSchema.parse);
});
```

```tsx
"use client";

import { Suspense } from "react";
import { useAtomValue } from "jotai";
import { ErrorBoundary } from "react-error-boundary";

function PostTitle() {
  const post = useAtomValue(postAtom);
  return <h1>{post.title}</h1>;
}

export function PostScreen() {
  return (
    <ErrorBoundary fallback={<p>Could not load post.</p>}>
      <Suspense fallback={<p>Loading post...</p>}>
        <PostTitle />
      </Suspense>
    </ErrorBoundary>
  );
}
```

When `postAtom` returns a pending promise, `PostTitle` pauses and the fallback renders.

For manual loading states without Suspense, use `loadable`:

```ts
import { loadable } from "jotai/utils";

const userLoadableAtom = loadable(userAtom);
```

```tsx
const user = useAtomValue(userLoadableAtom);

if (user.state === "loading") return <p>Loading...</p>;
if (user.state === "hasError") return <p>Failed</p>;
return <p>{user.data.name}</p>; // state === "hasData"
```

`loadable` is useful when you want local loading/error branches instead of a Suspense boundary.

Use `unwrap` when you want to derive from an async atom but provide a synchronous fallback:

```ts
import { unwrap } from "jotai/utils";

const safeUserAtom = unwrap(userAtom, () => ({ id: 0, name: "Loading" }));
const safeUserNameAtom = atom((get) => get(safeUserAtom).name);
```

For rejected promises, Suspense handles only loading. Use an error boundary for errors, or use `loadable` if you want to render error state manually inside the component. An error boundary also needs a reset/retry path; resetting without invalidating or replacing a rejected cached request will throw the same error again.

### Loading from User Actions

An async write alone does not trigger Suspense. To show a Suspense fallback from a button click, put the promise somewhere a read atom can see it.

```ts
type Post = { id: number; title: string };

const selectedPostIdAtom = atom(1);
const cacheAtom = atom<Record<number, CacheEntry<Post>>>({});

const selectPostAtom = atom(null, (get, set, id: number) => {
  const cached = get(cacheAtom)[id];

  if (cached?.status === "success" || cached?.status === "pending") {
    set(selectedPostIdAtom, id);
    return;
  }

  const request = fetchJson(`/api/posts/${id}`, undefined, postSchema.parse);
  set(cacheAtom, (cache) => ({
    ...cache,
    [id]: { status: "pending", request },
  }));
  set(selectedPostIdAtom, id);

  void request.then(
    (post) =>
      set(cacheAtom, (cache) =>
        cache[id]?.status === "pending" &&
        cache[id].request === request
          ? { ...cache, [id]: { status: "success", data: post } }
          : cache,
      ),
    (error: unknown) =>
      set(cacheAtom, (cache) =>
        cache[id]?.status === "pending" &&
        cache[id].request === request
          ? { ...cache, [id]: { status: "error", error } }
          : cache,
      ),
  );
});

const selectedPostAtom = atom((get) => {
  const id = get(selectedPostIdAtom);
  const entry = get(cacheAtom)[id];

  if (!entry) return null;
  if (entry.status === "pending") throw entry.request;
  if (entry.status === "error") throw entry.error;
  return entry.data;
});
```

This pattern supports user-triggered loading with Suspense, retry, request
deduplication, and race-safe settlement. Keep the control that retries the load
outside the error boundary, or have the boundary reset handler start a new load
before resetting itself.

### Cache Ownership and Invalidation

A manual Jotai cache needs an explicit lifecycle:

- Define what invalidates entries after mutations.
- Define whether data is fresh forever, until explicit refresh, or for a TTL.
- Bound or clean up caches with unbounded keys.
- Clear user-specific entries on logout or identity changes.
- Keep the server/API authoritative; the Jotai cache is a client snapshot.

For request deduplication, retries, background refetching, stale times, garbage
collection, or mutation invalidation across many resources, prefer a dedicated
server-state solution such as `jotai-tanstack-query`. Use manual Promise caches
only when their smaller lifecycle is explicit and tested.

## Debugging

Atoms can have `debugLabel` for devtools and easier inspection.

```ts
const countAtom = atom(0);
countAtom.debugLabel = "countAtom";
```

Use labels for shared atoms and derived atoms that appear in debugging tools. The label does not affect runtime behavior.

## Provider and Store

`Provider` scopes atom values. Two Providers using the same atom configs have separate values.

```tsx
"use client";

import { Provider } from "jotai";

export function JotaiProvider({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}
```

Scope the Provider to the required state lifetime. A root Provider keeps atom
values alive across child-route navigation; a feature-scoped Provider resets
them when that feature subtree unmounts.

Jotai also exposes store APIs for advanced cases outside React.

```ts
import { createStore } from "jotai";

const store = createStore();
store.set(countAtom, 10);
console.log(store.get(countAtom));
```

## Atom Lifecycle

Atoms can define `onMount` for setup work that should run when the atom first gets a subscriber. It can return a cleanup function.

```ts
const onlineAtom = atom(false);

onlineAtom.onMount = (setOnline) => {
  const update = () => setOnline(navigator.onLine);

  update();
  window.addEventListener("online", update);
  window.addEventListener("offline", update);

  return () => {
    window.removeEventListener("online", update);
    window.removeEventListener("offline", update);
  };
};
```

Use `onMount` for subscriptions such as browser events, sockets, or external stores. In Next.js, this must only run in Client Components because it uses browser APIs.

## Next.js 16 App Router

Next.js App Router pages and layouts are Server Components by default. Jotai hooks are React client hooks, so components that call `useAtom`, `useAtomValue`, `useSetAtom`, or `useHydrateAtoms` must be Client Components.

### Provider Setup

Create a client provider:

```tsx
// components/Providers.tsx
"use client";

import { Provider } from "jotai";

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}
```

Use it from the server `app/layout.tsx`:

```tsx
// app/layout.tsx
import { Providers } from "../components/Providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Use a Provider in SSR to avoid request data leaking through a shared global store.

### Hydrating Server Data

Fetch on the server page, then hydrate atoms in a client component.

```tsx
// app/post/page.tsx
import PostClient from "./PostClient";
import { fetchPost } from "../../store";

export default async function PostPage() {
  const initialPost = await fetchPost(1);
  return <PostClient initialPost={initialPost} />;
}
```

```tsx
// app/post/PostClient.tsx
"use client";

import { useHydrateAtoms } from "jotai/utils";
import { postDataAtom } from "../../store";

export default function PostClient({ initialPost }: { initialPost: Post }) {
  useHydrateAtoms([[postDataAtom, initialPost]]);
  return <PostView />;
}
```

Notes:

- `useHydrateAtoms` is a client hook.
- An atom is normally hydrated once per store.
- Use server components for initial fetches when possible; use Jotai for interactive client state after hydration.
- For browser APIs such as `localStorage`, use Client Components only.

`useHydrateAtoms` initializes; it does not synchronize. If `initialPost`
changes while the same store remains mounted, `postDataAtom` will keep its
existing value. Choose one deliberate strategy:

- Treat Jotai as the client authority after the first hydration and update it
  through atom actions.
- Replace it explicitly when a newer server payload should win.
- Mount a new feature-scoped Provider/store when the resource identity changes.

Avoid `dangerouslyForceHydrate` as a normal synchronization mechanism; Jotai
warns that it can behave incorrectly with concurrent rendering.

### URL and Router State

Jotai state can be synced with the URL when the URL should preserve or share UI state, such as selected tabs, filters, pagination, map coordinates, or modal ids. Prefer Next.js route params and `searchParams` when the URL is the primary data source. Use URL-synced atoms when client interactions should update the URL without manually wiring every component to the router.

`atomWithHash` syncs one atom with `window.location.hash`.

```ts
import { atomWithHash } from "jotai-location";

const tabAtom = atomWithHash("tab", "overview");
```

```tsx
"use client";

import { useAtom } from "jotai";

function Tabs() {
  const [tab, setTab] = useAtom(tabAtom);

  return (
    <nav>
      <button onClick={() => setTab("overview")}>Overview</button>
      <button onClick={() => setTab("settings")}>Settings</button>
      <p>Current tab: {tab}</p>
    </nav>
  );
}
```

This keeps state in a hash such as `#tab=settings`. Hash state is client-only, so use it from Client Components.

For full URL/location state, use the `jotai-location` extension. It provides atoms such as `atomWithLocation` for reading and writing `pathname`, `searchParams`, and hash-like location data.

```bash
bun add jotai-location
```

```ts
import { atomWithLocation } from "jotai-location";

const locationAtom = atomWithLocation();
```

```tsx
"use client";

import { useAtom } from "jotai";

function SearchFilter() {
  const [location, setLocation] = useAtom(locationAtom);
  const query = location.searchParams?.get("q") ?? "";

  return (
    <input
      value={query}
      onChange={(event) => {
        const searchParams = new URLSearchParams(location.searchParams);
        searchParams.set("q", event.target.value);

        setLocation((previous) => ({
          ...previous,
          searchParams,
        }));
      }}
    />
  );
}
```

Router-sync guidance:

- Use route segments for resource identity, such as `/posts/[id]`.
- Use search params for shareable filters, sorting, pagination, and query state.
- Use hash state for local UI state that should not trigger server navigation.
- In Next.js App Router, keep URL-synced atoms in Client Components and test browser back/forward behavior.
- Avoid duplicating the same state in both router APIs and Jotai unless one clearly derives from the other.
- Instantiate `atomWithLocation` only once for the application; multiple
  instances can diverge because each synchronizes with `window.location`.

## Important Helpers

### `jotai`

- `atom`: creates primitive, derived, read-write, or write-only atoms.
- `useAtom`: reads and writes an atom.
- `useAtomValue`: reads an atom.
- `useSetAtom`: writes to an atom without subscribing to its value.
- `Provider`: scopes a store.
- `createStore`, `getDefaultStore`: advanced store control outside React.

### `jotai/utils`

- `atomWithStorage`: persist state to `localStorage`, `sessionStorage`, or custom storage.
- `useHydrateAtoms`: hydrate atoms from SSR/server-provided initial values.
- `loadable`: convert async atom state into `{ state, data, error }`.
- `unwrap`: turn async atom reads into sync reads with a fallback.
- `atomWithReset`, `useResetAtom`, `RESET`: reset atoms to initial values.
- `atomWithDefault`: resettable atom whose default can depend on other atoms.
- `atomWithReducer`, `useReducerAtom`: reducer-style updates.
- `selectAtom`: subscribe to a selected slice; use when equality control is required.
- `splitAtom`: turn an array atom into per-item atoms.
- `atomFamily`: parameterized atoms. It is deprecated in `jotai/utils`; prefer the `jotai-family` package for new code.
- `useAtomCallback`: read/write atoms from callbacks.
- `atomWithRefresh`: refresh async reads by triggering recomputation.

### `jotai-location`

- `atomWithHash`: sync atom state with `window.location.hash`.
- `atomWithLocation`: sync one application-level atom with `window.location`.

### Helper Examples

Persist with `atomWithStorage`:

```ts
import { atomWithStorage } from "jotai/utils";

const themeAtom = atomWithStorage<"light" | "dark">("theme", "light");
```

Next.js can prerender Client Components, where browser storage is unavailable.
When supplying custom storage, resolve `window.localStorage` or
`window.sessionStorage` behind a client guard. If rendered output depends on the
stored value, use a client-only boundary or another deliberate hydration
strategy to prevent server/client markup mismatch.

Reset state with `atomWithReset`:

```ts
import { RESET, atomWithReset } from "jotai/utils";

const draftAtom = atomWithReset("");
const clearDraftAtom = atom(null, (_get, set) => set(draftAtom, RESET));
```

Subscribe to a slice with `selectAtom`:

```ts
import { selectAtom } from "jotai/utils";

const profileAtom = atom({ id: 1, name: "Ada", role: "admin" });
const roleAtom = selectAtom(profileAtom, (profile) => profile.role);
```

Split list items into individual item atoms with `splitAtom`:

```ts
import { splitAtom } from "jotai/utils";

const todoListAtom = atom([
  { id: 1, text: "Write note" },
  { id: 2, text: "Review note" },
]);

const todoAtomsAtom = splitAtom(todoListAtom);
```

Create keyed atoms with an atom family package when each id needs its own atom:

```ts
import { atomFamily } from "jotai-family";

const postAtomFamily = atomFamily((id: number) =>
  atom(async (_get, { signal }) =>
    fetchJson(`/api/posts/${id}`, { signal }, postSchema.parse),
  ),
);
```

Use `atomWithRefresh` when an async atom needs explicit refetching:

```ts
import { atomWithRefresh } from "jotai/utils";

const currentUserAtom = atomWithRefresh(async (_get, { signal }) =>
  fetchJson("/api/me", { signal }, userSchema.parse),
);

const refreshUserAtom = atom(null, (_get, set) => set(currentUserAtom));
```

### Common Extensions

Jotai has separate packages for integrations:

- `jotai-immer`: write immutable updates with Immer.
- `jotai-tanstack-query`: integrate server-state caching with TanStack Query.
- `jotai-urql`, `jotai-relay`, `jotai-trpc`: data client integrations.
- `jotai-xstate`: connect atoms to state machines.
- `jotai-location`: URL/location atoms.
- `jotai-optics`: focus into nested state.
- `jotai-valtio`, `jotai-zustand`, `jotai-redux`: bridge other state libraries.
- `jotai-cache`: third-party caching helpers documented by Jotai; it is not part of `jotai/utils`.

## TypeScript Patterns

Primitive atom types are inferred:

```ts
const countAtom = atom(0); // PrimitiveAtom<number>
```

Use explicit types for object shapes and action args:

```ts
type User = { id: number; name: string };
type UserAction =
  | { type: "rename"; name: string }
  | { type: "clear" };

const userAtom = atom<User>({ id: 1, name: "Ada" });

const userActionAtom = atom(null, (get, set, action: UserAction) => {
  if (action.type === "rename") {
    set(userAtom, { ...get(userAtom), name: action.name });
  }

  if (action.type === "clear") {
    set(userAtom, { id: 0, name: "" });
  }
});
```

## Performance Rules

- Keep atoms small and focused.
- Use derived atoms instead of duplicating state.
- Use `useAtomValue` for read-only components and `useSetAtom` for buttons/actions.
- Keep atom references stable; avoid `useAtom(atom(...))` directly in render.
- For large objects, derive narrow atoms or use `selectAtom` when custom equality is needed.
- Use `splitAtom` for editable lists so each item can update independently.
- Do not store everything globally. Component-local `useState` is still fine for local-only state.

## Testing

Test atoms as state transitions and components as user behavior.

```ts
import { createStore } from "jotai";

const store = createStore();
store.set(countAtom, 1);
store.set(incrementAtom, 2);

expect(store.get(countAtom)).toBe(3);
```

For React tests, wrap components in `Provider` if they need isolated atom state.

## Pitfalls

- Provider-less mode can leak state across SSR requests. Use `Provider` in Next.js.
- `useHydrateAtoms` runs in client components and hydrates once per store.
- Async atoms suspend by default; wrap reads with `Suspense` or use `loadable`.
- A write atom's `get` is not dependency-tracked; it reads current values for the action.
- Atom configs need stable identity. Memoize dynamically created atoms.
- `atomWithStorage` reads browser storage on the client; avoid assuming the server knows the stored value.
- `atomFamily` can leak memory if you create unbounded params and never remove them.

## Interactive Cached Data Pattern

A useful Jotai pattern for interactive data uses:

- `postId`: selected id.
- `postCache`: resolved posts or in-flight promises by id.
- `selectPost`: action atom that starts fetches and fills the cache.
- `postData`: read atom that returns cached data or throws a promise for Suspense.
- `useHydrateAtoms`: seeds the initial server-fetched post into the client store.

This keeps the first render server-assisted while later navigation stays client-side and cached.

## Lazy Server Action Data In Client-Controlled UI

When data is needed only after a user opens a sheet or dialog, use a write atom
to call the Server Action and put its Promise in a cache atom. A
synchronous read atom throws the in-flight Promise to suspend the component.
The user event, not render, starts the request.

```ts
type ProfilesState =
  | { status: "idle" }
  | { status: "pending"; request: Promise<Profile[]> }
  | { status: "success"; data: Profile[] }
  | { status: "error"; error: unknown };

const profilesStateAtom = atom<ProfilesState>({ status: "idle" });

export const profilesAtom = atom((get) => {
  const state = get(profilesStateAtom);
  if (state.status === "pending") throw state.request;
  if (state.status === "error") throw state.error;
  if (state.status === "idle") return null;
  return state.data;
});

export const loadProfilesAtom = atom(null, (get, set) => {
  const current = get(profilesStateAtom);
  if (current.status === "pending" || current.status === "success") return;

  const request = getProfiles();
  set(profilesStateAtom, { status: "pending", request });

  void request.then(
    (profiles) =>
      set(profilesStateAtom, (state) =>
        state.status === "pending" && state.request === request
          ? { status: "success", data: profiles }
          : state,
      ),
    (error: unknown) =>
      set(profilesStateAtom, (state) =>
        state.status === "pending" && state.request === request
          ? { status: "error", error }
          : state,
      ),
  );
});

export const invalidateProfilesAtom = atom(null, (_get, set) => {
  set(profilesStateAtom, { status: "idle" });
});
```

Do not invoke a Server Action from an async atom read. Atom reads run as part of
render, while a Server Action dispatch can update Next.js Router state. This can
produce React's "Cannot update Router while rendering" warning. When a Route
Handler is unavailable, call the Server Action from a synchronous write atom
triggered by an event or effect. Throw only the stored Promise from a pure
synchronous read atom.

This is a narrow Next.js integration pattern, not the default fetch strategy.
Server Functions are designed primarily for mutations, and Next.js currently
dispatches client-side invocations one at a time. Prefer Server Components for
initial reads and Route Handlers plus async read atoms for ordinary client-side
or parallel data fetching.

Call the write atom from an event handler:

```tsx
const loadProfiles = useSetAtom(loadProfilesAtom);

<Button onClick={() => loadProfiles()}>View profiles</Button>;
```

Operational behavior:

- Opening the parent page does not fetch the data.
- The click handler starts the Server Action.
- Reading the stored Promise activates the nearest Suspense fallback.
- Rejection reaches the nearest error boundary.
- Resolved data replaces the Promise and prevents repeat requests.
- A rejected request becomes an error entry; calling `loadProfilesAtom` again
  starts a retry.
- Request identity checks prevent stale settlement from replacing a newer
  cache entry.
- `invalidateProfilesAtom` defines the explicit refetch boundary.
- A component that can read the idle state must handle `null`.

## References

- Jotai docs: https://jotai.org/
- Core atom API: https://jotai.org/docs/core/atom
- Next.js guide: https://jotai.org/docs/guides/nextjs
- SSR hydration: https://jotai.org/docs/utilities/ssr
- Async utilities: https://jotai.org/docs/utilities/async
- Async guide: https://jotai.org/docs/guides/async
- Jotai cache extension: https://jotai.org/docs/extensions/cache
- Jotai location extension: https://jotai.org/docs/extensions/location
- Atom family and deprecation: https://jotai.org/docs/utilities/family
- Next.js App Router Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js Server Functions: https://nextjs.org/docs/app/getting-started/mutating-data
