---
name: create-action
description: Create a full 3-layer feature with types, repository, service, and server action following mapsense conventions. Use when user asks to build CRUD, actions, service/repository layers, or a new backend feature.
---

# Create Action

Create a full 3-layer feature for requested entity or workflow.

Request: `$ARGUMENTS`

## Layer Rules

### `src/types/<name>.ts` - all types

- Domain interfaces, `<Entity>Row` (DB cols), filter types, sort unions, Zod schemas + inferred TS types
- Never define types in action/service/repo files
- Service imports types from `@/types/`, never from `@/action/`

### `src/repository/<name>.ts`

- Import `query`, `withTransaction`, `handleDbError` from `@/lib/db`
- Import row/filter/sort types from `@/types/<name>`
- Parameterized SQL only - no logic
- Whitelist sorts via `ALLOWED_SORT_FIELDS` - blocks SQL injection
- `withTransaction` -> `try/catch` -> `handleDbError(error)`
- Inside `withTransaction` use `client.query()`, not module `query()`
- Return raw `<Entity>Row` - no mapping

### `src/services/<name>.ts`

- Import types from `@/types/<name>`, repo fns from `@/repository/<name>`
- Map rows -> domain via `mapRowTo<Entity>()`
- Validate via Zod `schema.safeParse()`
- Throw `AppError(status, msg)` for expected failures (400/403/404/409...)
- Wrap unexpected DB errors -> `handleDbError(error)`

### `src/action/<name>.ts`

- `"use server"` top
- Use `createAction` from `@/lib/create-action` - bundles auth + permission + `handleError`. No direct `handleViewPermission`/`handleEditPermission`/`handleError` calls.
- Gate by level:
  - `createAction.public(async (...args) => ...)` - no auth
  - `createAction.user(async (user, ...args) => ...)` - any logged-in
  - `createAction.reviewer(async (user, ...args) => ...)` - reviewer or admin
  - `createAction.admin(async (user, ...args) => ...)` - admin only
- Non-public callbacks get `user: AuthenticatedUser` first arg; prefix `_user` if unused. Public omits.
- Return auto-wrapped: `{ success: true, data: T } | { success: false, error: string }`. Throw `AppError`/`Error` inside to fail.
- Add `_prevState: FooState` after `user` only for `useActionState`. Query actions + `useTransition` use plain sigs.
- `FooState` (`success`, `data?`, `error?`, `fieldErrors?`) lives in `src/types/<name>.ts` only when `useActionState` needs it.
- Call services; call repo direct only for trivial reads with no mapping.
- `revalidatePath`/`revalidateTag` inside callback after mutations.
- API routes call services direct via `withApiHandler` - keep services free of action concerns (no perms, no revalidate).

Example:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/create-action";
import { getFoosFromDb, updateFooWorkflow } from "@/services/foo";

export const getFoos = createAction.reviewer(
  async (_user, limit = 50, offset = 0) => getFoosFromDb(limit, offset),
);

export const updateFoo = createAction.reviewer(
  async (user, id: number, patch: FooPatch) => {
    await updateFooWorkflow(id, patch, user);
    revalidatePath("/foo");
  },
);
```

## Output

Implement files directly. Note assumptions about columns/rules.
