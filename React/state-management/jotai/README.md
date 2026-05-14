# Jotai Notes

Jotai is an atomic state management library for React. An atom is a small unit of state, and components subscribe only to the atoms they read. This keeps updates focused: changing one atom only re-renders components whose atom graph depends on that value.

## Mental Model

An atom created with `atom()` is an immutable config object, not the value itself. The value lives in a Jotai store. A `Provider` creates a scoped store for its subtree; without a `Provider`, Jotai uses an implicit global store.

Use atoms for client-side state: form values, UI flags, caches, local optimistic data, derived values, and action coordination. In Next.js App Router, keep atoms in Client Components and pass server-fetched initial data into them when needed.

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

```ts
const userIdAtom = atom(1);

export const userAtom = atom(async (get, { signal }) => {
  const id = get(userIdAtom);
  const response = await fetch(`/api/users/${id}`, { signal });
  return response.json();
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

const postIdAtom = atom(1);
const postCacheAtom = atom<Record<number, Post | Promise<Post>>>({});

export const selectPostAtom = atom(null, async (get, set, id: number) => {
  const cached = get(postCacheAtom)[id];

  if (cached) {
    set(postIdAtom, id);
    return cached;
  }

  const request = fetch(`/api/posts/${id}`).then((res) => res.json());
  set(postCacheAtom, (cache) => ({ ...cache, [id]: request }));
  set(postIdAtom, id);

  const post = await request;
  set(postCacheAtom, (cache) => ({ ...cache, [id]: post }));
  return post;
});
```

The returned `post` is returned to the caller of the setter:

```tsx
const selectPost = useSetAtom(selectPostAtom);
const post = await selectPost(2);
```

It is not readable state unless you also store it with `set`.

### Async Read-Write Atoms

Read-write atoms can be async on the read side, the write side, or both. Use this shape when one atom should expose async data and also define a custom async update API.

```ts
type User = { id: number; name: string };

const userIdAtom = atom(1);

export const editableUserAtom = atom(
  async (get, { signal }): Promise<User> => {
    const id = get(userIdAtom);
    const response = await fetch(`/api/users/${id}`, { signal });
    return response.json();
  },
  async (_get, set, update: { id: number; name?: string }) => {
    if (update.name) {
      await fetch(`/api/users/${update.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: update.name }),
      });
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
  return fetch(`/api/users/${id}`, { signal }).then((res) => res.json());
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
  const response = await fetch(`/api/posts/${id}`, { signal });
  return response.json();
});
```

```tsx
"use client";

import { Suspense } from "react";
import { useAtomValue } from "jotai";

function PostTitle() {
  const post = useAtomValue(postAtom);
  return <h1>{post.title}</h1>;
}

export function PostScreen() {
  return (
    <Suspense fallback={<p>Loading post...</p>}>
      <PostTitle />
    </Suspense>
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

For rejected promises, Suspense handles only loading. Use an error boundary for errors, or use `loadable` if you want to render error state manually inside the component.

### Loading from User Actions

An async write alone does not trigger Suspense. To show a Suspense fallback from a button click, put the promise somewhere a read atom can see it.

```ts
type Post = { id: number; title: string };

const selectedPostIdAtom = atom(1);
const cacheAtom = atom<Record<number, Post | Promise<Post>>>({});

const selectPostAtom = atom(null, async (get, set, id: number) => {
  const cached = get(cacheAtom)[id];

  if (cached) {
    set(selectedPostIdAtom, id);
    return;
  }

  const request = fetch(`/api/posts/${id}`).then((res) => res.json());
  set(cacheAtom, (cache) => ({ ...cache, [id]: request }));
  set(selectedPostIdAtom, id);

  const post = await request;
  set(cacheAtom, (cache) => ({ ...cache, [id]: post }));
});

const selectedPostAtom = atom((get) => {
  const id = get(selectedPostIdAtom);
  const value = get(cacheAtom)[id];

  if (!value) return null;
  if ("then" in value) throw value;
  return value;
});
```

This is the pattern used by this repository's `/post` page.

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

### URL and Router State

Jotai state can be synced with the URL when the URL should preserve or share UI state, such as selected tabs, filters, pagination, map coordinates, or modal ids. Prefer Next.js route params and `searchParams` when the URL is the primary data source. Use URL-synced atoms when client interactions should update the URL without manually wiring every component to the router.

`atomWithHash` syncs one atom with `window.location.hash`.

```ts
import { atomWithHash } from "jotai/utils";

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
- `atomWithHash`: sync atom state with `window.location.hash`.
- `atomFamily`: parameterized atoms. It is deprecated in `jotai/utils`; prefer the `jotai-family` package for new code.
- `useAtomCallback`: read/write atoms from callbacks.
- `atomWithRefresh`: refresh async reads by triggering recomputation.

### Helper Examples

Persist with `atomWithStorage`:

```ts
import { atomWithStorage } from "jotai/utils";

const themeAtom = atomWithStorage<"light" | "dark">("theme", "light");
```

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
  atom(async () => {
    const response = await fetch(`/api/posts/${id}`);
    return response.json();
  }),
);
```

Use `atomWithRefresh` when an async atom needs explicit refetching:

```ts
import { atomWithRefresh } from "jotai/utils";

const currentUserAtom = atomWithRefresh(async () => {
  const response = await fetch("/api/me");
  return response.json();
});

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
- `jotai-cache`: caching helpers; this is listed as an extension package, not part of `jotai/utils`.

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

## Current Repo Pattern

This repository's `/post` page uses a good Jotai pattern for interactive data:

- `postId`: selected id.
- `postCache`: resolved posts or in-flight promises by id.
- `selectPost`: action atom that starts fetches and fills the cache.
- `postData`: read atom that returns cached data or throws a promise for Suspense.
- `useHydrateAtoms`: seeds the initial server-fetched post into the client store.

This keeps the first render server-assisted while later navigation stays client-side and cached.

## References

- Jotai docs: https://jotai.org/
- Core atom API: https://jotai.org/docs/core/atom
- Next.js guide: https://jotai.org/docs/guides/nextjs
- SSR hydration: https://jotai.org/docs/utilities/ssr
- Async utilities: https://jotai.org/docs/utilities/async
- Next.js App Router Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
