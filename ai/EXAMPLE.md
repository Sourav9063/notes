# Mapsense Agent Guide

Next.js 16 + React 19 app with Bun, Tailwind v4, shadcn/ui, Biome, PostgreSQL, Leaflet, and H3. Keep edits small, typed, and local-pattern aligned.

## Commands

`bun run dev`/`start` use port 8080. `bun run build` builds. `bun run lint` = `biome check`; `format` = `biome format --write`; `fix` = `biome check --write .`; `fix:unsafe` = `biome check --write --unsafe .`. `docker compose up -d` starts PostgreSQL 15 on 5432. `bunx --bun shadcn@latest add <component>` adds shadcn components.

## Architecture

3-layer backend:

- Repo: `src/repository/` = raw SQL + mapping only; no business logic; use `withTransaction` for multi-query writes.
- Service: `src/services/` = business logic + Zod validation; raise `AppError`; no transport/cache concerns.
- Transport: `src/action/` Server Actions and `src/app/api/v1/*/route.ts` REST routes.

Transport rules: Server Actions wrap `handleError()` and return `{ success, data } | { success, error }`; REST uses `withApiHandler` + `handleServiceResponse`; run `revalidatePath`/`clearGlobalCache()` in actions/routes, not services; DB errors become `AppError` via `handleDbError` in `src/lib/db.ts`.

## App Structure

Route groups: `src/app/(auth)` login/no auth; `src/app/(dashboard)` admin/user management; `src/app/(mapsense)` anomaly/suggestion map features; `src/app/api/v1` REST. Check feature-level docs before deep edits, e.g. `src/app/(mapsense)/(suggestion)/CLAUDE.md`.

Auth: JWT in `access_token` cookie; helpers in `src/action/permission.ts`; prefer `getUser()` from `src/action/user.ts` (`.permission.admin`, `.permission.reviewer`). Admin implies reviewer, so gate reviewer features with `user.permission.reviewer || user.permission.admin`. Use `handleReviewerPermission()` in reviewer/admin actions. Guards in `src/components/guards/` are Server Components: `AdminGuard`, `ReviewerGuard`, `UserGuard`; redirect to `/no-permission` or `/login`.

Config/constants: `src/config/index.ts` owns `MISSION_HOST`, `SETTINGS_HOST`, Anubis creds, JWT settings. `src/constants/` owns `appRoutes`, `PERMISSIONS`, `getPermisson()`, `GLOBAL_CACHE_TAG`. `clearGlobalCache()` invalidates cached GETs tagged with `GLOBAL_CACHE_TAG`. `backendApiRoutes` is server-only and prepends `MISSION_HOST`; `apiRequest` caches GET 5 min with `GLOBAL_CACHE_TAG`, mutations use `revalidate: 0`.

## UI And State

Use Server Components for data fetching; Client Components for interactivity, hooks, browser APIs, and Leaflet. Use `-client.tsx` when paired with server wrapper. Wrap data-fetching Server Components in `<Suspense fallback={<Skeleton />}>`. Put pagination/shareable filters in URL `searchParams` + `useQueryState`. Use `next/dynamic({ ssr: false })` only inside dedicated Client Component wrappers for Leaflet/client-only modules. Programmatic navigation uses `useRouter` from `nextjs-toploader/app`; non-navigation mutations call `useTopLoader().start()` before action and `done()` in `finally`. External images need `next.config.ts` `images.remotePatterns`; `lh3.googleusercontent.com` already configured.

Hooks/context: global hooks in `src/hooks/`; feature hooks beside route/component in `_component/`. Context factories in `src/lib/utils/context.tsx`: `createDataContext<T>`, `createStateContext<T>`, `createReducerContext<S,A>`, `ProviderComposer`. Map state uses `MapProvider`/`useMapData` from `src/app/(mapsense)/_component/map-data-provider.tsx`.

## Maps And Types

Maps use `react-leaflet` + `h3-js`. Generate GeoJSON dynamically; avoid new static `.geojson` files unless required. `generateAnomalyGeoJson` lives in `src/lib/utils/anomaly.ts`. GeoJSON coordinates are `[longitude, latitude]`; polygon rings must close. Leaflet often needs casts like `layer as L.Polyline` or `latlngs[0] as L.LatLng[]`. Verify geometry/type changes with `bun run build` and Biome.

TypeScript strict mode. No `any`; use `unknown` and narrow. Prefer Zod schemas in `src/types/` as validation/type source. Use `@/*` for `src/*`. Biome formats/lints. React Compiler enabled: keep components pure; avoid unnecessary memoization unless existing pattern/profiling justifies it.

## Working Rules

State assumptions when unclear; ask before choosing between meaningfully different behaviors. Build only requested behavior; no speculative options, abstractions, or configurability. Keep edits surgical; do not reformat/refactor unrelated code. Match local style. Remove unused code created by your change. Mention unrelated dead code/risks; do not delete unless asked. Define success criteria for multi-step work and verify with narrowest useful checks.

## Communication

Respond like smart caveman. Drop greetings, articles (a/an/the), filler (just/really). Technical substance/code stays 100% exact. Pattern: [thing] [action] [reason]. Fragments OK.
