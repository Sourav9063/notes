# React Context Factory & Composer

A lightweight, type-safe utility for eliminating boilerplate when working with React Context. This library provides a unified factory for static data, simple state, and complex reducers, along with a composer to solve "Provider Wrapper Hell."

## 🛠 Features

* **Zero Boilerplate:** No more manual `null` checks or `createContext` repetition.
* **Built-in Safety:** Automatic error handling if a hook is used outside its provider.
* **Three Flavors:** Support for Static Data, `useState`, and `useReducer`.
* **Clean Architecture:** Flatten your component tree with `ProviderComposer`.

---

## 🚀 The Factory (`context-factory.ts`)

```typescript
import {
  type Dispatch,
  type ReactNode,
  type Reducer,
  createContext as reactCreateContext,
  useContext as reactUseContext,
  type SetStateAction,
  useMemo,
  useReducer,
  useState,
} from "react";

export interface CreateContextOptions {
  name?: string;
  errorMessage?: string;
}

// --- Internal Helper ---
function createBaseContext<T>(name: string, errorMessage: string) {
  const Context = reactCreateContext<T | null>(null);
  Context.displayName = name;

  const useCtx = () => {
    const context = reactUseContext(Context);
    if (context === null) throw new Error(errorMessage);
    return context;
  };

  return { Context, useCtx };
}

/** 1. Data Context: For sharing static data or values managed by a parent. */
export function createDataContext<T>(options: CreateContextOptions = {}) {
  const {
    name = "DataContext",
    errorMessage = `use${name} must be used within a ${name}Provider`,
  } = options;
  const { Context, useCtx } = createBaseContext<T>(name, errorMessage);

  const Provider = ({ children, value }: { children: ReactNode; value: T }) => (
    <Context.Provider value={value}>{children}</Context.Provider>
  );

  return [Provider, useCtx] as const;
}

/** 2. State Context: Manages simple state internally via useState. */
export function createStateContext<T>(options: CreateContextOptions = {}) {
  const {
    name = "StateContext",
    errorMessage = `use${name} must be used within a ${name}Provider`,
  } = options;
  const { Context, useCtx } = createBaseContext<[T, Dispatch<SetStateAction<T>>]>(
    name,
    errorMessage
  );

  const Provider = ({ children, value }: { children: ReactNode; value: T }) => {
    const [state, setState] = useState(value);
    const memoizedValue = useMemo(
      () => [state, setState] as [T, Dispatch<SetStateAction<T>>],
      [state]
    );
    return <Context.Provider value={memoizedValue}>{children}</Context.Provider>;
  };

  return [Provider, useCtx] as const;
}

/** 3. Reducer Context: Manages complex state internally via useReducer. */
export function createReducerContext<S, A>(
  reducer: Reducer<S, A>,
  options: CreateContextOptions = {}
) {
  const {
    name = "ReducerContext",
    errorMessage = `use${name} must be used within a ${name}Provider`,
  } = options;
  const { Context, useCtx } = createBaseContext<[S, Dispatch<A>]>(name, errorMessage);

  const Provider = ({ children, value }: { children: ReactNode; value: S }) => {
    const [state, dispatch] = useReducer(reducer, value);
    const memoizedValue = useMemo(() => [state, dispatch] as [S, Dispatch<A>], [state]);

    return <Context.Provider value={memoizedValue}>{children}</Context.Provider>;
  };

  return [Provider, useCtx] as const;
}

// --- Provider Composer ---
interface ProviderPair {
  provider: React.JSXElementConstructor<any>;
  props: Record<string, any>;
}

export const ProviderComposer = ({ providers, children }: { providers: ProviderPair[]; children: ReactNode }) => {
  return (
    <>
      {providers.reduceRight((acc, { provider: Provider, props }) => {
        return <Provider {...props}>{acc}</Provider>;
      }, children)}
    </>
  );
};

```

---

## 📖 Usage Examples

### 1. Simple State Context

Use this for independent values like UI toggles or themes.

```tsx
export const [ThemeProvider, useTheme] = createStateContext<"light" | "dark">({
  name: "Theme",
});

// usage
const [theme, setTheme] = useTheme();

```

### 2. Complex Reducer Context

Use this for business logic where the next state depends on the previous one.

```tsx
type State = { count: number };
type Action = { type: "increment" } | { type: "decrement" };

function counterReducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment": return { count: state.count + 1 };
    case "decrement": return { count: state.count - 1 };
  }
}

export const [CounterProvider, useCounter] = createReducerContext(counterReducer, {
  name: "Counter",
});

```

### 3. Combining Everything (The Composer)

Stop the "Wrapper Pyramid" in your `App.tsx`.

```tsx
import { ProviderComposer } from "./context-factory";

const providers = [
  { provider: ThemeProvider, props: { value: "dark" } },
  { provider: CounterProvider, props: { value: { count: 0 } } },
  { provider: AuthProvider, props: { value: null } },
];

export default function App() {
  return (
    <ProviderComposer providers={providers}>
      <YourAppContent />
    </ProviderComposer>
  );
}

```

---

## ⚠️ Important Note on State

In `createStateContext` and `createReducerContext`, the `value` prop passed to the Provider is used for **initialization only**.

If the parent component re-renders and passes a new `value` prop, the internal state **will not** update automatically. This is standard behavior for `useState` and `useReducer`. If you need the context to react to parent changes, use `createDataContext` instead.
