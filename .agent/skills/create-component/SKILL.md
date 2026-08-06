---
name: create-component
description: Create a UI component, client component, or data provider following mapsense Next.js conventions. Use when user asks to build a server component, client component, provider, filter panel, table, form, map UI, or reusable UI.
---

# Create Component

Create requested UI component, client component, or data provider.

Request: `$ARGUMENTS`

## Component Types

### Server Component

- No `"use client"`; filename: `kebab-case.tsx`
- Fetches data via `@/action/`; passes to a Client Component if interactivity is needed
- On action error: inline `text-sm text-muted-foreground` message

### Client Component (`-client.tsx`)

- `"use client"` at top; filename ends in `-client.tsx`
- `useQueryState` from `@/hooks/use-query-state` for URL-synced state
- Fetch by internal `id`, not grouping keys (for example `hex_pair_id`)
- `next/dynamic` with `{ ssr: false }` for heavy imports such as Leaflet

### Data Provider (`<feature>-data-provider.tsx`)

- `"use client"` at top; factories from `@/lib/utils/context`
- `createDataContext<T>` - state owned by a parent hook; `createStateContext<T>` - self-contained
- Export Provider component and `use<Feature>Data` hook
- Co-locate under `src/app/(mapsense)/<feature>/_component/` or `src/components/providers/`

`createDataContext` pattern:

```tsx
"use client";

import { useCallback, useState } from "react";
import { createDataContext } from "@/lib/utils/context";
import type { MyEntity } from "@/types/my-entity";

export function useMyFeatureControl() {
  const [selected, setSelected] = useState<MyEntity | null>(null);
  const reset = useCallback(() => setSelected(null), []);
  return { selected, setSelected, reset };
}

export type UseMyFeatureControlReturn = ReturnType<typeof useMyFeatureControl>;

export const [MyFeatureData, useMyFeatureData] =
  createDataContext<UseMyFeatureControlReturn>({ name: "my-feature-data-provider" });

export function MyFeatureProvider({ children }: { children: React.ReactNode }) {
  const control = useMyFeatureControl();
  return <MyFeatureData value={control}>{children}</MyFeatureData>;
}
```

`createStateContext` pattern:

```tsx
"use client";

import { createStateContext } from "@/lib/utils/context";
import type { MyState } from "@/types/my-entity";

export const [MyStateProvider, useMyState] = createStateContext<MyState>({ name: "MyState" });
```

## Conventions

- No `any`; explicit prop interfaces; `@/*` -> `src/*` imports
- `cn()` from `@/lib/utils`; Shadcn primitives from `@/components/ui/`
- No comments unless logic is non-obvious; no speculative error handling

## Output

Implement file directly. Note assumptions.
