"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import * as React from "react";

export interface QueryStateOptions {
  /**
   * Use router.replace() instead of router.push()
   * @default true
   */
  replace?: boolean;

  /**
   * Scroll to top after navigation
   * @default false
   */
  scroll?: boolean;

  /**
   * Update the URL without triggering a server re-fetch (client-only params)
   * Uses window.history.replaceState directly
   * @default false
   */
  shallow?: boolean;
}

/**
 * Hook for managing a single URL query parameter in Next.js App Router
 * Works similarly to useState but syncs with URL query parameters
 *
 * @param key - The query parameter key
 * @param defaultValue - Default value when query parameter is not present
 * @param options - Navigation options (replace, scroll)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [search, setSearch] = useQueryState("search", "");
 *   const [page, setPage] = useQueryState("page", "1");
 *   const [tab, setTab] = useQueryState<"items" | "category">("tab", "items");
 *
 *   // Get the query parameter value (typed)
 * // string
 *
 *   // Set the query parameter
 *   setSearch("hello");
 *
 *   // Remove the query parameter (set to null)
 *   setSearch(null);
 * }
 * ```
 */
// Global state for batching URL updates to prevent race conditions
let batchedParams: URLSearchParams | null = null;
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

export function useQueryState<T extends string = string>(
  key: string,
  defaultValue: T,
  options?: QueryStateOptions,
): [T, (value: T | null) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Optimistic local state for immediate UI feedback
  const [optimisticValue, setOptimisticValue] = React.useState<
    T | null | undefined
  >(undefined);

  // Sync optimistic state back to URL value once navigation settles
  const urlValue = (searchParams.get(key) as T) ?? defaultValue;

  // Last value this hook wrote to the URL. While a write is in flight the URL
  // can briefly report an older value (writes are batched on a timeout), so the
  // optimistic value must survive until our own write lands - otherwise fast
  // typing gets clobbered by a stale URL value and characters are dropped.
  const pendingValue = React.useRef<T | undefined>(undefined);
  const previousUrlValue = React.useRef(urlValue);
  React.useEffect(() => {
    if (previousUrlValue.current === urlValue) {
      return;
    }
    previousUrlValue.current = urlValue;

    if (
      pendingValue.current !== undefined &&
      pendingValue.current !== urlValue
    ) {
      // A newer write of ours is still in flight, this is an intermediate value
      return;
    }

    pendingValue.current = undefined;
    setOptimisticValue(undefined);
  }, [urlValue]);

  const value =
    optimisticValue !== undefined
      ? (optimisticValue ?? defaultValue)
      : urlValue;

  /**
   * Set the query parameter value
   */
  const setValue = React.useCallback(
    (newValue: T | null) => {
      const nextValue =
        newValue === null || newValue === "" ? defaultValue : newValue;

      if (nextValue === urlValue) {
        // URL will not change, so the sync effect never runs - settle now
        pendingValue.current = undefined;
        setOptimisticValue(undefined);
      } else {
        pendingValue.current = nextValue;
        setOptimisticValue(newValue);
      }

      if (!batchedParams) {
        const currentSearch =
          typeof window !== "undefined"
            ? window.location.search
            : searchParams.toString();
        batchedParams = new URLSearchParams(currentSearch);
      }

      if (newValue === null || newValue === undefined || newValue === "") {
        batchedParams.delete(key);
      } else {
        batchedParams.set(key, newValue);
      }

      const currentPathname = pathname;
      const currentRouter = router;
      const opts = {
        replace: options?.replace ?? true,
        scroll: options?.scroll ?? false,
        shallow: options?.shallow ?? false,
      };

      if (batchTimeout) {
        clearTimeout(batchTimeout);
      }

      batchTimeout = setTimeout(() => {
        if (batchedParams) {
          const queryString = batchedParams.toString();
          const url = queryString
            ? `${currentPathname}?${queryString}`
            : currentPathname;

          if (opts.shallow) {
            window.history.replaceState(null, "", url);
          } else if (opts.replace) {
            currentRouter.replace(url, { scroll: opts.scroll });
          } else {
            currentRouter.push(url, { scroll: opts.scroll });
          }

          batchedParams = null;
          batchTimeout = null;
        }
      }, 0);
    },
    [key, defaultValue, urlValue, pathname, router, searchParams, options],
  );

  return [value, setValue];
}
