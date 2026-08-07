# Tailwind CSS v4 reference

This folder targets Tailwind CSS v4.x. It covers installation, CSS-first configuration, utility-to-CSS mappings, and the v3 → v4 migration checklist.

Official references:

- [Installation](https://tailwindcss.com/docs/installation)
- [Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [Functions and directives](https://tailwindcss.com/docs/functions-and-directives)
- [Theme variables](https://tailwindcss.com/docs/theme)
- [Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Compatibility](https://tailwindcss.com/docs/compatibility)

## Install

Use one integration path. Do not install the v3 PostCSS plugin setup alongside a v4 integration.

### Vite

The first-party Vite plugin is the recommended path for Vite-based frameworks.

```bash
npm install tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [tailwindcss()],
})
```

```css
/* src/style.css */
@import "tailwindcss";
```

### PostCSS

Use this when the framework expects PostCSS instead of a Vite plugin.

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

```js
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

```css
@import "tailwindcss";
```

In v4, Tailwind bundles imports and handles vendor prefixing. `postcss-import` and `autoprefixer` are normally no longer needed for the Tailwind pipeline.

### CLI

The CLI moved to its own package.

```bash
npm install tailwindcss @tailwindcss/cli
```

```css
/* src/input.css */
@import "tailwindcss";
```

```bash
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
```

### Play CDN

Useful for prototypes and documentation examples only. It is not intended for production.

```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

## What changed in v4

- Import Tailwind with `@import "tailwindcss"`; `@tailwind base`, `@tailwind components`, and `@tailwind utilities` are removed.
- Vite uses `@tailwindcss/vite`; PostCSS uses `@tailwindcss/postcss`; the CLI uses `@tailwindcss/cli`.
- Configuration is CSS-first. Put design tokens in `@theme` instead of starting with `tailwind.config.js`.
- Source detection is automatic. Tailwind uses project heuristics and ignores `.gitignore` paths, `node_modules`, binaries, CSS files, and lockfiles.
- Use `@source` for extra or excluded paths and `@source inline()` for safelisting.
- Theme values are emitted as CSS variables and can be used directly with `var(--color-blue-500)`, `var(--text-base)`, and similar variables.
- v4 uses modern CSS and requires Chrome 111+, Safari 16.4+, or Firefox 128+ for core functionality.
- CSS preprocessors such as Sass, Less, and Stylus are not supported as part of the v4 workflow.

## CSS-first configuration

```css
@import "tailwindcss";

@theme {
  --font-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 120rem;
  --color-brand-500: oklch(0.72 0.14 240);
  --ease-snappy: cubic-bezier(0.2, 0, 0, 1);
}
```

Theme namespaces create utilities. The example adds `font-display`, `3xl:*`, `bg-brand-500`, `text-brand-500`, and `ease-snappy`.

Use `@theme inline` when a theme token references another CSS variable whose value must be resolved at the usage site:

```css
:root {
  --brand: oklch(0.72 0.14 240);
}

@theme inline {
  --color-brand: var(--brand);
}
```

Use the generated variables in ordinary CSS when that is clearer than `@apply`:

```css
@layer components {
  .prose a {
    color: var(--color-blue-600);
  }
}
```

## Source detection

Tailwind scans source files as plain text. Class names must exist in complete form; it cannot understand string interpolation.

```tsx
const colors = {
  blue: "bg-blue-600 hover:bg-blue-500 text-white",
  red: "bg-red-600 hover:bg-red-500 text-white",
}
```

Do not construct `bg-${color}-600` dynamically. Map values to complete class names instead.

Register sources relative to the stylesheet when automatic detection cannot find them:

```css
@import "tailwindcss";
@source "../node_modules/@acme/ui";
@source not "../src/legacy";
```

Set an explicit scan base path or disable automatic detection when needed:

```css
@import "tailwindcss" source("../src");

/* Or register every source explicitly. */
@import "tailwindcss" source(none);
@source "../admin";
@source "../shared";
```

Safelist utilities with brace expansion:

```css
@source inline("{hover:,focus:,}underline");
@source inline("{hover:,}bg-red-{50,{100..900..100},950}");
```

## v4 directives

| Directive | Use |
| --- | --- |
| `@import` | Import Tailwind and other CSS files. |
| `@theme` | Define design tokens that generate utilities and CSS variables. |
| `@source` | Add, remove, or safelist scanned sources. |
| `@utility` | Register a custom utility that participates in variants. |
| `@variant` | Apply an existing variant inside custom CSS. |
| `@custom-variant` | Define a project-specific variant. |
| `@apply` | Inline existing utilities into custom CSS. |
| `@reference` | Make theme, utilities, and variants available to a separately bundled stylesheet without emitting duplicate CSS. |
| `@config` | Load a legacy JavaScript config explicitly; compatibility only. |
| `@plugin` | Load a legacy JavaScript plugin; compatibility only. |

```css
@import "tailwindcss";

@utility tab-4 {
  tab-size: 4;
}

@custom-variant theme-midnight (&:where([data-theme="midnight"] *));

.card {
  @variant dark {
    background: black;
  }
}
```

For Vue, Svelte, Astro style blocks, and CSS modules, reference the main stylesheet before using `@apply` or `@variant`:

```css
@reference "../../app.css";

.button {
  @apply rounded-lg px-4 py-2 font-semibold;
}
```

`theme()` still works for compatibility but is deprecated. Prefer CSS theme variables. If a legacy config must remain, load it with `@config`; `corePlugins`, `safelist`, and `separator` from that config are not supported in v4.

## v3 → v4 migration checklist

Run the official tool first in a new branch when Node.js 20+ is available:

```bash
npx @tailwindcss/upgrade
```

Review the generated diff and test the rendered UI. The tool does not replace visual review.

### Build and configuration

| v3 | v4 |
| --- | --- |
| `@tailwind base;` / `components;` / `utilities;` | `@import "tailwindcss";` |
| `tailwindcss` as the PostCSS plugin | `@tailwindcss/postcss` |
| PostCSS + `autoprefixer` boilerplate | Tailwind v4 handles imports and prefixing |
| Tailwind CLI from `tailwindcss` | `@tailwindcss/cli` |
| `content` array in `tailwind.config.js` | Automatic detection; use `@source` for exceptions |
| JavaScript theme customization | `@theme` in CSS |
| Custom utility inside `@layer utilities` | `@utility name { ... }` |

### Removed or renamed utilities

| v3 | v4 |
| --- | --- |
| `bg-opacity-*` | `bg-black/50` or another color opacity modifier |
| `text-opacity-*` | `text-black/50` or another color opacity modifier |
| `border-opacity-*` | `border-black/50` or another color opacity modifier |
| `divide-opacity-*` | `divide-black/50` or another color opacity modifier |
| `ring-opacity-*` | `ring-black/50` or another color opacity modifier |
| `placeholder-opacity-*` | `placeholder-black/50` or another color opacity modifier |
| `flex-shrink-*` | `shrink-*` |
| `flex-grow-*` | `grow-*` |
| `overflow-ellipsis` | `text-ellipsis` |
| `decoration-slice` | `box-decoration-slice` |
| `decoration-clone` | `box-decoration-clone` |
| `shadow-sm` | `shadow-xs` when the old visual value is required |
| `shadow` | `shadow-sm` when the old bare shadow is required |
| `drop-shadow-sm` | `drop-shadow-xs` when the old visual value is required |
| `drop-shadow` | `drop-shadow-sm` when the old bare value is required |
| `blur-sm` | `blur-xs` when the old visual value is required |
| `blur` | `blur-sm` when the old bare value is required |
| `backdrop-blur-sm` | `backdrop-blur-xs` when the old visual value is required |
| `backdrop-blur` | `backdrop-blur-sm` when the old bare value is required |
| `rounded-sm` | `rounded-xs` when the old visual value is required |
| `rounded` | `rounded-sm` when the old bare value is required |
| `outline-none` used as an accessible hidden outline | `outline-hidden`; v4 `outline-none` means no outline |
| `ring` expecting a 3px blue ring | `ring-3 ring-blue-500` |

The v4 gradient API uses names such as `bg-linear-to-r`, `bg-radial`, and `bg-conic-180`. v4 also preserves gradient stops when a variant overrides one stop; use `via-none` when a variant must remove a middle stop.

### Behavioral changes to check

- `space-x-*` and `space-y-*` use a different selector. Prefer `flex` or `grid` with `gap-*` when child margins or inline elements make the result sensitive.
- `divide-x-*` and `divide-y-*` use a different selector and apply the border on the opposite side. Review custom child borders and spacing.
- Bare `border` and `divide-*` colors default to `currentColor`, not configured `gray-200`. Specify the color explicitly when needed.
- Bare `ring` is 1px and defaults to `currentColor`, not a 3px blue ring.
- Preflight uses current text color at 50% for placeholders, buttons use `cursor: default`, dialog margins are reset, and the `hidden` attribute takes priority over display utilities.
- Prefixes are variant-like and move to the front: `tw:flex tw:bg-red-500 tw:hover:bg-red-600`.
- Put the important marker at the end: `flex! hover:bg-red-600!`. The old placement remains only for compatibility.
- Stacked variants now apply left to right. Reverse order-sensitive v3 stacks such as `first:*:pt-0` → `*:first:pt-0`.
- CSS variables in arbitrary values use parentheses: `bg-(--brand-color)`, not `bg-[--brand-color]`.
- In arbitrary `grid-cols-*`, `grid-rows-*`, and `object-*` values, use underscores for spaces: `grid-cols-[max-content_auto]`.
- `hover:` only applies when the primary input supports hover. Override it with `@custom-variant hover (&:hover)` only when the old behavior is intentional.
- `rotate-*`, `scale-*`, and `translate-*` use individual CSS properties. Replace `transform-none` resets with the matching `scale-none`, `rotate-none`, or `translate-none` reset.
- If a custom transition includes `transform`, use individual properties such as `transition-[opacity,scale]`.
- `container` no longer has v3 `center` and `padding` config options. Customize it with `@utility container`.
- `corePlugins` is not supported.
- `resolveConfig` is removed. Read generated theme variables from CSS, or use `getComputedStyle(document.documentElement)` when JavaScript needs a resolved value.

## Raw CSS comparison

The [utility cheat sheet](./cheat-sheet/README.md) lists common v4 utilities. The [Tailwind-to-CSS reference](./tailwind-to-css/README.md) explains how v4 theme variables, opacity modifiers, variants, and arbitrary values map to CSS.

## Linting and verification

Tailwind v4 has no official `tailwind-lint` command in the core installation docs. Verify through the project’s real build and browser output:

```bash
npm run build
```

Also check for stale migration syntax:

```bash
rg -n '@tailwind|bg-opacity-|text-opacity-|border-opacity-|divide-opacity-|ring-opacity-|placeholder-opacity-|flex-shrink-|flex-grow-|overflow-ellipsis|tailwind.config|theme\(' .
```

Some matches are valid compatibility examples or historical notes; review each match instead of applying a blind replacement.
