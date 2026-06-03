# nextjs-toploader Routing & API Call Knowledge

## Package

Installed package:
```json
"nextjs-toploader": "^3.9.17"
```

Package wraps `nprogress`. Use it for visible progress during:
- App Router navigation from Client Components
- server action mutations without page navigation
- client-side API/fetch calls
- mixed flows where mutation succeeds, then route changes

## Root Setup

`src/app/layout.tsx` mounts loader once inside `<body>`.

```tsx
import NextTopLoader from "nextjs-toploader";

<NextTopLoader
  color="var(--primary)"
  height={2}
  showSpinner={false}
  shadow={false}
/>
```

Rules:
- mount once in root layout
- keep before app providers/children so route transitions can render bar globally
- no loader component needed per page
- do not use `PagesTopLoader`; repo uses App Router

Useful props:
- `color`: loader color
- `height`: px height
- `showSpinner`: spinner visibility
- `shadow`: glow shadow, `false` disables
- `zIndex`: default `1600`; increase only if header/modals cover bar
- `showForHashAnchor`: set `false` if hash-only links should not show progress

## Routing Pattern

For programmatic navigation from Client Components, import router from `nextjs-toploader/app`, not `next/navigation`.

```tsx
"use client";

import { useRouter } from "nextjs-toploader/app";

export function SomeClientComponent() {
  const router = useRouter();

  function goToSuggestion() {
    router.push("/suggestion");
  }

  return <button onClick={goToSuggestion}>Open</button>;
}
```

Supported methods match Next App Router:
- `router.push(href, options?)`
- `router.replace(href, options?)`
- `router.back()`
- `router.forward()`
- `router.refresh()`
- `router.prefetch(href, options?)`

Repo examples:
- `src/hooks/use-query-state.ts`
- `src/components/header.tsx`
- `src/components/guards/login-redirect.tsx`
- `src/app/(auth)/login/_component/login.tsx`

## Import Rule

Use this when navigation should show top loader:
```ts
import { useRouter } from "nextjs-toploader/app";
```

Use this only when reading route state:
```ts
import { usePathname, useSearchParams } from "next/navigation";
```

Common mixed pattern:
```tsx
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
```

Reason: `nextjs-toploader/app` only replaces `useRouter`. It does not replace `usePathname`, `useSearchParams`, `redirect`, or `notFound`.

## Server Component Redirects

Server Components, guards, services, and actions cannot use `useRouter`.

Use Next server APIs:
```ts
import { redirect } from "next/navigation";

redirect("/login");
```

Loader applies to client-side navigations. Server redirects happen during render/request lifecycle and do not need manual top loader code.

## Link Navigation

Normal `<Link />` navigation works with mounted `<NextTopLoader />`.

```tsx
import Link from "next/link";

<Link href="/suggestion">Suggestion</Link>
```

Use `useRouter` from `nextjs-toploader/app` only when navigation happens from code after click, mutation, condition, or effect.

## URL Search Params

Repo uses `useQueryState` in `src/hooks/use-query-state.ts`.

It uses:
```ts
import { useRouter } from "nextjs-toploader/app";
```

Default behavior:
- `replace: true`
- `scroll: false`
- `shallow: false`

Pattern:
```tsx
const [page, setPage] = useQueryState("page", "1");
setPage("2");
```

When `shallow: false`, hook calls `router.replace()` or `router.push()`, so top loader appears and Server Components can re-fetch from new `searchParams`.

When `shallow: true`, hook uses `window.history.replaceState()` directly. No top loader appears and no server re-fetch happens. Use only for client-only URL state.

## Server Action Mutation Pattern

Server action calls do not automatically trigger top loader because no route navigation necessarily happens.

Use `useTopLoader()` in Client Component or hook:
```tsx
"use client";

import { useTopLoader } from "nextjs-toploader";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateSomethingAction } from "@/action/something";

export function StatusSelect() {
  const topLoader = useTopLoader();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      topLoader.start();
      try {
        const result = await updateSomethingAction(value);

        if (!result.success) {
          toast.error(result.error ?? "Update failed");
          return;
        }

        toast.success("Updated");
      } finally {
        topLoader.done();
      }
    });
  }

  return null;
}
```

Rules:
- call `topLoader.start()` immediately before async mutation
- call `topLoader.done()` in `finally`
- keep separate pending UI with `useTransition`, `useState`, or form status
- action returns `{ success, data } | { success, error }`; handle both branches before route changes

Repo examples:
- `src/app/(mapsense)/anomaly/_component/anomaly-status-select.tsx`
- `src/app/(mapsense)/(suggestion)/suggestion/review/_component/suggestion-status-select.tsx`
- `src/app/(mapsense)/(suggestion)/suggestion/_component/use-suggestion-submit.ts`

## Mutation Then Navigate

When mutation succeeds then navigation happens, finish mutation loader before route navigation.

```tsx
const topLoader = useTopLoader();
const router = useRouter();

async function handleDelete() {
  topLoader.start();
  try {
    const result = await deleteSuggestionAction(id);

    if (!result.success) {
      toast.error(result.error ?? "Delete failed");
      return;
    }

    toast.success("Deleted");
    topLoader.done();
    router.replace("/suggestion");
  } catch {
    toast.error("Delete failed");
  } finally {
    topLoader.done();
  }
}
```

Reason:
- manual loader covers server action/API call
- router loader covers resulting page transition
- `done()` is safe to call more than once

Repo examples:
- `src/app/(auth)/login/_component/login.tsx`
- `src/app/(mapsense)/(suggestion)/suggestion/_component/delete-suggestion-button.tsx`

## Client API Call Pattern

For direct client-side `fetch()` or API route calls, use same manual loader pattern.

```tsx
"use client";

import { useTopLoader } from "nextjs-toploader";
import { useState } from "react";

export function SyncButton() {
  const topLoader = useTopLoader();
  const [isPending, setIsPending] = useState(false);

  async function sync() {
    setIsPending(true);
    topLoader.start();

    try {
      const response = await fetch("/api/v1/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      return payload;
    } finally {
      topLoader.done();
      setIsPending(false);
    }
  }

  return (
    <button type="button" onClick={sync} disabled={isPending}>
      {isPending ? "Syncing..." : "Sync"}
    </button>
  );
}
```

Rules:
- top loader is visual progress only; still disable controls during pending state
- parse response as `unknown`, validate or narrow before use
- use `finally` so loader stops on success, error, and thrown exception
- show toast/error UI in `catch` or after typed result handling

## Server-Side API Calls

Server Components and services should not use `useTopLoader()`.

For server-side fetch via `apiRequest` or `backendApiRoutes`:
- no top loader needed inside server code
- UI should show `<Suspense fallback={<Skeleton />}>` for server-rendered fetch latency
- client navigation to URL triggers loader when route changes
- client mutation triggering revalidation should manually start/done loader around action call

Repo rules still apply:
- `apiRequest` GET uses 5 min revalidation + `GLOBAL_CACHE_TAG`
- mutations use `revalidate: 0`
- `revalidatePath` belongs in action, not service
- `clearGlobalCache()` invalidates cached GETs

## Forms

For custom submit handlers:
```tsx
const topLoader = useTopLoader();

async function onSubmit(values: FormValues) {
  topLoader.start();
  try {
    const result = await action(values);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push("/next");
  } finally {
    topLoader.done();
  }
}
```

For native `<form action={serverAction}>`, top loader does not start automatically. Prefer client wrapper with `useTransition()` when visual route-style progress is required.

## Login Flow Pattern

Login flow combines auth action, local storage, role redirect.

Current pattern:
```tsx
topLoader.start();
try {
  const result = await handleAuth(formData);
  if (!result.success) {
    setError(result.error);
    topLoader.done();
    return;
  }

  localStorage.setItem("user", JSON.stringify({ user: result.data.user }));
  topLoader.done();
  router.push(targetRoute);
} catch {
  topLoader.done();
  setError("Google sign-in failed. Try again.");
}
```

Keep this order:
1. start loader before `handleAuth`
2. stop loader on auth failure before showing error
3. persist user after success
4. stop manual loader before `router.push`
5. let router push start route transition loader

## Avoid

- importing `useRouter` from `next/navigation` for programmatic client navigation that should show loader
- calling `useTopLoader()` in Server Components
- leaving loader open outside `finally`
- using top loader as only pending state for buttons/forms
- using `window.history.replaceState()` for state that Server Components must read
- adding another `<NextTopLoader />` below route groups or pages

## Quick Decision Table

| Work | Use |
|---|---|
| `<Link href="/x" />` | mounted `<NextTopLoader />` handles it |
| client `router.push/replace/back` | `useRouter` from `nextjs-toploader/app` |
| read pathname/search params | `next/navigation` |
| Server Component redirect | `redirect()` from `next/navigation` |
| server action without navigation | `useTopLoader().start()` + `done()` |
| fetch/API call from Client Component | `useTopLoader().start()` + `done()` |
| Server Component fetch | Suspense fallback, no top loader hook |
| URL state causing server re-fetch | `useQueryState(..., { shallow: false })` |
| client-only URL state | `useQueryState(..., { shallow: true })` |
