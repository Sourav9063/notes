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
  const { Context, useCtx } = createBaseContext<
    [T, Dispatch<SetStateAction<T>>]
  >(name, errorMessage);

  const Provider = ({ children, value }: { children: ReactNode; value: T }) => {
    const [state, setState] = useState(value);
    const memoizedValue = useMemo(
      () => [state, setState] as [T, Dispatch<SetStateAction<T>>],
      [state],
    );
    return (
      <Context.Provider value={memoizedValue}>{children}</Context.Provider>
    );
  };

  return [Provider, useCtx] as const;
}

/** 3. Reducer Context: Manages complex state internally via useReducer. */
export function createReducerContext<S, A>(
  reducer: Reducer<S, A>,
  options: CreateContextOptions = {},
) {
  const {
    name = "ReducerContext",
    errorMessage = `use${name} must be used within a ${name}Provider`,
  } = options;
  const { Context, useCtx } = createBaseContext<[S, Dispatch<A>]>(
    name,
    errorMessage,
  );

  const Provider = ({ children, value }: { children: ReactNode; value: S }) => {
    const [state, dispatch] = useReducer(reducer, value);
    const memoizedValue = useMemo(
      () => [state, dispatch] as [S, Dispatch<A>],
      [state],
    );

    return (
      <Context.Provider value={memoizedValue}>{children}</Context.Provider>
    );
  };

  return [Provider, useCtx] as const;
}

// --- Provider Composer ---
interface ProviderPair {
  provider: React.JSXElementConstructor<any>;
  props: Record<string, any>;
}

export const ProviderComposer = ({
  providers,
  children,
}: {
  providers: ProviderPair[];
  children: ReactNode;
}) => {
  return (
    <>
      {providers.reduceRight((acc, { provider: Provider, props }) => {
        return <Provider {...props}>{acc}</Provider>;
      }, children)}
    </>
  );
};
