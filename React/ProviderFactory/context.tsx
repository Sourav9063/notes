import {
  type Dispatch,
  type ReactNode,
  createContext as reactCreateContext,
  useContext as reactUseContext,
  type SetStateAction,
  useMemo,
  useState,
} from "react";

export interface CreateContextOptions {
  name?: string;
  errorMessage?: string;
}

// Shared internal helper
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

// 1. Data Context (Static)
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

// 2. State Context (Stateful)
export function createStateContext<T>(options: CreateContextOptions = {}) {
  const {
    name = "StateContext",
    errorMessage = `useStateContext must be used within a ${name}Provider`,
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
