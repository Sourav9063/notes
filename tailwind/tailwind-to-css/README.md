# Tailwind CSS v4 → raw CSS

This reference explains the CSS produced conceptually by common Tailwind v4 utilities. Exact output can vary with theme tokens, variants, browser support transforms, and the Tailwind version.

## Core mappings

| Tailwind v4 | Raw CSS concept |
| --- | --- |
| `block` | `display: block;` |
| `flex` | `display: flex;` |
| `grid` | `display: grid;` |
| `hidden` | `display: none;` |
| `relative` | `position: relative;` |
| `absolute` | `position: absolute;` |
| `sticky` | `position: sticky;` |
| `m-4` | `margin: calc(var(--spacing) * 4);` |
| `mx-auto` | `margin-inline: auto;` |
| `p-6` | `padding: calc(var(--spacing) * 6);` |
| `gap-4` | `gap: calc(var(--spacing) * 4);` |
| `w-full` | `width: 100%;` |
| `max-w-7xl` | `max-width: var(--container-7xl);` |
| `h-screen` | `height: 100vh;` |
| `grid-cols-3` | `grid-template-columns: repeat(3, minmax(0, 1fr));` |
| `items-center` | `align-items: center;` |
| `justify-between` | `justify-content: space-between;` |
| `text-center` | `text-align: center;` |
| `font-bold` | `font-weight: 700;` |
| `uppercase` | `text-transform: uppercase;` |
| `rounded-lg` | `border-radius: var(--radius-lg);` |
| `border-2` | `border-width: 2px;` |
| `border-dashed` | `border-style: dashed;` |
| `shadow-lg` | `box-shadow: var(--shadow-lg);` |
| `opacity-75` | `opacity: 75%;` |
| `transition-colors` | `transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, outline-color;` |
| `duration-300` | `transition-duration: 300ms;` |
| `hover:scale-105` | A hover rule using `scale: 105%;` |

Values such as `--spacing`, `--color-blue-500`, `--text-base`, `--radius-lg`, and `--shadow-lg` come from Tailwind's generated theme variables. They are not fixed literals if the theme is customized.

## Spacing and sizing

v4 spacing utilities use the theme spacing variable:

```html
<div class="p-4 md:p-6 w-[37rem]">
  Content
</div>
```

Conceptually:

```css
.p-4 {
  padding: calc(var(--spacing) * 4);
}

@media (width >= 48rem) {
  .md\:p-6 {
    padding: calc(var(--spacing) * 6);
  }
}

.w-\[37rem\] {
  width: 37rem;
}
```

`--spacing` defaults to a quarter rem, but it can be changed with `@theme`. v4 also supports dynamic values such as `grid-cols-15` and one-off arbitrary values without extending a JavaScript config.

## Colors and opacity

```html
<div class="bg-blue-500/50 text-white border border-slate-200">
  Card
</div>
```

Conceptually:

```css
.bg-blue-500\/50 {
  background-color: color-mix(in oklab, var(--color-blue-500) 50%, transparent);
}

.text-white {
  color: var(--color-white);
}

.border-slate-200 {
  border-color: var(--color-slate-200);
}
```

Use slash opacity modifiers. The v3 `bg-opacity-*`, `text-opacity-*`, `border-opacity-*`, `divide-opacity-*`, `ring-opacity-*`, and `placeholder-opacity-*` utilities are removed.

Use `--alpha()` in authored CSS when applying opacity to a theme variable:

```css
.muted {
  color: --alpha(var(--color-gray-950) / 60%);
}
```

## Typography

```html
<h1 class="text-2xl/8 font-semibold tracking-tight text-slate-900">
  Heading
</h1>
```

Conceptually:

```css
h1 {
  font-size: var(--text-2xl);
  line-height: calc(var(--spacing) * 8);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  color: var(--color-slate-900);
}
```

The `text-size/line-height` shorthand is preferred when both values are set together. Exact generated line-height values depend on the selected theme token.

## Backgrounds and gradients

```html
<div class="bg-linear-to-r from-cyan-500 via-blue-500 to-indigo-600">
  Gradient
</div>
```

Conceptually:

```css
.gradient {
  background-image: linear-gradient(
    to right in oklab,
    var(--color-cyan-500),
    var(--color-blue-500),
    var(--color-indigo-600)
  );
}
```

Other v4 gradient APIs include `bg-linear-<angle>`, `bg-radial`, `bg-radial-[...]`, `bg-conic-<angle>`, stop positions such as `from-10%`, and interpolation modifiers such as `/oklch`.

## Variants

```html
<button class="bg-blue-600 hover:bg-blue-500 focus-visible:outline-2 md:px-6 print:hidden">
  Save
</button>
```

Conceptually:

```css
.button {
  background-color: var(--color-blue-600);
}

@media (hover: hover) {
  .button:hover {
    background-color: var(--color-blue-500);
  }
}

@media (width >= 48rem) {
  .button {
    padding-inline: calc(var(--spacing) * 6);
  }
}

@media print {
  .button {
    display: none;
  }
}
```

v4 uses mobile-first breakpoints: `sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem, and `2xl` 96rem by default. `hover:` is limited to devices whose primary input supports hover.

## CSS variables and arbitrary values

```html
<div class="bg-(--brand-color) w-[calc(100%-2rem)] hover:[transform:rotate(3deg)]">
  Custom value
</div>
```

Conceptually:

```css
.custom {
  background-color: var(--brand-color);
  width: calc(100% - 2rem);
}

.custom:hover {
  transform: rotate(3deg);
}
```

Use parentheses for CSS-variable shorthand: `bg-(--brand-color)`. Use underscores for spaces inside arbitrary values, for example `grid-cols-[max-content_auto]`.

## CSS-first customization

```css
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.72 0.14 240);
  --font-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 120rem;
}

@utility content-auto {
  content-visibility: auto;
}

@custom-variant theme-midnight (&:where([data-theme="midnight"] *));
```

`@theme` creates design tokens and the matching utilities. `@utility` creates a variant-aware utility. `@custom-variant` creates a new variant. `@layer base` and `@layer components` remain ordinary CSS cascade layers; use `@utility` when the class must behave like a Tailwind utility.

## Component CSS and `@apply`

```css
@reference "../../app.css";

.button {
  @apply rounded-lg px-4 py-2 font-semibold;
}
```

Use `@reference` in Vue/Svelte/Astro style blocks and CSS modules when the main stylesheet defines the theme or custom utilities. It loads definitions for reference without duplicating the compiled CSS. Sass, Less, and Stylus are not part of the v4 workflow.

## Source detection and safelisting

```css
@import "tailwindcss";
@source "../node_modules/@acme/ui";
@source not "../src/legacy";
@source inline("{hover:,focus:,}underline");
```

Tailwind scans source as plain text, so complete class names must exist in the files. Do not build `text-${color}-600` dynamically; map values to complete strings. Use `source(none)` on the import when every source must be explicitly registered.

## v3 → v4 quick replacements

| Old | v4 |
| --- | --- |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| `flex-shrink-*` | `shrink-*` |
| `flex-grow-*` | `grow-*` |
| `overflow-ellipsis` | `text-ellipsis` |
| `shadow-sm` (old appearance) | `shadow-xs` |
| `rounded-sm` (old appearance) | `rounded-xs` |
| `outline-none` (hidden but forced-colors friendly) | `outline-hidden` |
| `ring` (old 3px blue default) | `ring-3 ring-blue-500` |
| `bg-opacity-50` | `bg-black/50` or another color modifier |
| `bg-[--brand-color]` | `bg-(--brand-color)` |
| `grid-cols-[max-content,auto]` | `grid-cols-[max-content_auto]` |
