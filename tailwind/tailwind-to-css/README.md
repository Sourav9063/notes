# Tailwind CSS v4 → raw CSS

This reference explains the CSS produced conceptually by common Tailwind v4 utilities. Exact output can vary with theme tokens, variants, browser support transforms, and the Tailwind version.

The family map below covers every utility category in the current [official v4.3 documentation](https://tailwindcss.com/docs), including logical properties and the v4.3 additions documented in the [release notes](https://tailwindcss.com/blog/tailwindcss-v4-3). `<...>` means a theme value, bare value, modifier, CSS variable, or arbitrary value depending on the utility.

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

## Base styles

```css
@import "tailwindcss";
```

Conceptually, this imports Tailwind's theme variables, Preflight base layer, and utilities. Preflight applies `box-sizing: border-box`, removes default margins, resets borders to `0 solid`, and normalizes several browser defaults. It is not equivalent to one utility class and can affect third-party markup.

## Complete utility-family map

Use this as a property lookup. A single Tailwind family can emit more than one declaration, especially for shorthands, transforms, filters, rings, gradients, and responsive/state variants.

| Tailwind v4 family | Raw CSS property or concept |
| --- | --- |
| `aspect-*` | `aspect-ratio` |
| `columns-*` | `columns` |
| `break-before-*`, `break-after-*`, `break-inside-*` | `break-before`, `break-after`, `break-inside` |
| `box-decoration-*` | `box-decoration-break` |
| `box-border`, `box-content` | `box-sizing` |
| `block`, `inline`, `flex`, `grid`, `hidden`, and related display utilities | `display` |
| `float-*` | `float` |
| `clear-*` | `clear` |
| `isolate`, `isolation-auto` | `isolation` |
| `object-*` | `object-fit`, `object-position` |
| `overflow-*`, `overflow-x-*`, `overflow-y-*` | `overflow`, `overflow-x`, `overflow-y` |
| `overscroll-*`, `overscroll-x-*`, `overscroll-y-*` | `overscroll-behavior`, `overscroll-behavior-x`, `overscroll-behavior-y` |
| `static`, `fixed`, `absolute`, `relative`, `sticky` | `position` |
| `inset-*`, `inset-x-*`, `inset-y-*`, `inset-s-*`, `inset-e-*`, `inset-bs-*`, `inset-be-*`, `top-*`, `right-*`, `bottom-*`, `left-*` | `inset`, logical inset properties, `top`, `right`, `bottom`, `left` |
| `visible`, `invisible`, `collapse` | `visibility` |
| `z-*` | `z-index` |
| `@container`, `@container-size` | `container-type` and container-name |
| `basis-*` | `flex-basis` |
| `flex-row`, `flex-col`, and related forms | `flex-direction` |
| `flex-wrap`, `flex-nowrap`, `flex-wrap-reverse` | `flex-wrap` |
| `flex-*` | `flex` |
| `grow-*` | `flex-grow` |
| `shrink-*` | `flex-shrink` |
| `order-*` | `order` |
| `grid-cols-*`, `col-span-*`, `col-start-*`, `col-end-*` | `grid-template-columns`, `grid-column` |
| `grid-rows-*`, `row-span-*`, `row-start-*`, `row-end-*` | `grid-template-rows`, `grid-row` |
| `grid-flow-*` | `grid-auto-flow` |
| `auto-cols-*` | `grid-auto-columns` |
| `auto-rows-*` | `grid-auto-rows` |
| `gap-*`, `gap-x-*`, `gap-y-*` | `gap`, `column-gap`, `row-gap` |
| `justify-*` | `justify-content` |
| `justify-items-*`, `justify-self-*` | `justify-items`, `justify-self` |
| `content-normal`, `content-center`, and related alignment values | `align-content` |
| `items-*`, `self-*` | `align-items`, `align-self` |
| `place-content-*`, `place-items-*`, `place-self-*` | `place-content`, `place-items`, `place-self` |
| `p-*`, `px-*`, `py-*`, `ps-*`, `pe-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*` | `padding` and its physical/logical sides |
| `ps-*`, `pe-*`, `pbs-*`, `pbe-*` | `padding-inline-start`, `padding-inline-end`, `padding-block-start`, `padding-block-end` |
| `m-*`, `mx-*`, `my-*`, `ms-*`, `me-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*` | `margin` and its physical/logical sides |
| `ms-*`, `me-*`, `mbs-*`, `mbe-*` | `margin-inline-start`, `margin-inline-end`, `margin-block-start`, `margin-block-end` |
| `-m-*`, `-mx-*`, `-my-*`, and related forms | Negative margin values |
| `space-x-*`, `space-y-*` | Sibling combinator margins |
| `w-*`, `min-w-*`, `max-w-*` | `width`, `min-width`, `max-width` |
| `h-*`, `min-h-*`, `max-h-*` | `height`, `min-height`, `max-height` |
| `size-*` | Both `width` and `height` |
| `inline-*`, `min-inline-*`, `max-inline-*` | `inline-size`, `min-inline-size`, `max-inline-size` |
| `block-*`, `min-block-*`, `max-block-*` | `block-size`, `min-block-size`, `max-block-size` |
| `font-*` family utilities | `font-family` |
| `text-xs` … `text-9xl`, `text-[...]` | `font-size` and the configured line-height |
| `antialiased`, `subpixel-antialiased` | `-webkit-font-smoothing`, `-moz-osx-font-smoothing` |
| `italic`, `not-italic` | `font-style` |
| `font-*` weight utilities | `font-weight` |
| `font-stretch-*` | `font-stretch` |
| `normal-nums`, `tabular-nums`, `oldstyle-nums`, and related forms | `font-variant-numeric` |
| `font-features-*` | `font-feature-settings` |
| `tracking-*` | `letter-spacing` |
| `line-clamp-*` | `overflow`, `display`, `-webkit-box-orient`, and `-webkit-line-clamp` |
| `leading-*` or `text-size/leading` | `line-height` |
| `list-image-*`, `list-inside`, `list-outside`, `list-*` | `list-style-image`, `list-style-position`, `list-style-type` |
| `text-left`, `text-center`, `text-right`, and related forms | `text-align` |
| `text-<color>-<shade>` | `color` |
| `placeholder-<color>-<shade>` | `::placeholder { color: ... }` |
| `underline`, `overline`, `line-through`, `no-underline` | `text-decoration-line` |
| `decoration-*` color/style/thickness utilities | `text-decoration-color`, `text-decoration-style`, `text-decoration-thickness` |
| `underline-offset-*` | `text-underline-offset` |
| `uppercase`, `lowercase`, `capitalize`, `normal-case` | `text-transform` |
| `truncate`, `text-ellipsis`, `text-clip` | `overflow`, `text-overflow`, and often `white-space` |
| `text-wrap`, `text-nowrap`, `text-balance`, `text-pretty` | `text-wrap` |
| `indent-*` | `text-indent` |
| `tab-*` | `tab-size` |
| `align-*` | `vertical-align` |
| `whitespace-*` | `white-space` |
| `break-normal`, `break-words`, `break-all`, `break-keep`, `wrap-break-word` | `word-break`, `overflow-wrap` |
| `hyphens-*` | `hyphens` |
| `content-none`, `content-[...]`, `content-(--token)` | `content` |
| `bg-fixed`, `bg-local`, `bg-scroll` | `background-attachment` |
| `bg-clip-*` | `background-clip` |
| `bg-<color>-<shade>` | `background-color` |
| `from-*`, `via-*`, `to-*`, and stop-position utilities | Gradient custom properties and `background-image` |
| `bg-[url(...)]`, `bg-linear-*`, `bg-radial-*`, `bg-conic-*` | `background-image` |
| `bg-origin-*` | `background-origin` |
| `bg-center`, `bg-top`, `bg-right`, `bg-bottom`, `bg-left`, and related forms | `background-position` |
| `bg-repeat-*` | `background-repeat` |
| `bg-auto`, `bg-cover`, `bg-contain` | `background-size` |
| `rounded-*` | `border-radius` |
| `border-*` width/color/style utilities | `border-width`, `border-color`, `border-style` |
| `border-s-*`, `border-e-*`, `border-bs-*`, `border-be-*` | Logical border side properties |
| `divide-*` | Child-combinator borders and their width/color/style |
| `outline-*` | `outline-width`, `outline-color`, `outline-style`, `outline-offset` |
| `shadow-*` | `box-shadow` |
| `inset-shadow-*` | Inset `box-shadow` |
| `inset-ring-*` | Inset ring `box-shadow` |
| `ring-*`, `ring-inset`, `ring-offset-*` | Ring and ring-offset `box-shadow` layers |
| `text-shadow-*` | `text-shadow` |
| `opacity-*` | `opacity` |
| `mix-blend-*`, `bg-blend-*` | `mix-blend-mode`, `background-blend-mode` |
| `mask-clip-*`, `mask-composite-*`, `mask-[...]`, `mask-mode-*` | `mask-clip`, `mask-composite`, `mask-image`, `mask-mode` |
| `mask-origin-*`, `mask-position-*`, `mask-repeat-*`, `mask-size-*`, `mask-type-*` | Corresponding mask properties |
| `blur-*`, `brightness-*`, `contrast-*`, `drop-shadow-*`, `grayscale`, `hue-rotate-*`, `invert`, `saturate-*`, `sepia` | `filter` functions |
| `backdrop-blur-*`, `backdrop-brightness-*`, and related forms | `backdrop-filter` functions |
| `border-collapse`, `border-separate` | `border-collapse` |
| `border-spacing-*`, `border-spacing-x-*`, `border-spacing-y-*` | `border-spacing` and its axes |
| `table-auto`, `table-fixed` | `table-layout` |
| `caption-top`, `caption-bottom` | `caption-side` |
| `transition-*` | `transition-property` |
| `transition-normal`, `transition-discrete` | `transition-behavior` |
| `duration-*` | `transition-duration` |
| `ease-*` | `transition-timing-function` |
| `delay-*` | `transition-delay` |
| `animate-*` | `animation` |
| `backface-visible`, `backface-hidden` | `backface-visibility` |
| `perspective-*`, `perspective-origin-*` | `perspective`, `perspective-origin` |
| `rotate-*`, `scale-*`, `skew-*`, `translate-*` | Individual transform properties |
| `transform`, `transform-none`, `transform-flat`, `transform-3d` | `transform`, `transform-style` |
| `origin-*` | `transform-origin` |
| `zoom-*` | `zoom` |
| `accent-*` | `accent-color` |
| `appearance-none`, `appearance-auto` | `appearance` |
| `caret-*` | `caret-color` |
| `scheme-*` | `color-scheme` |
| `cursor-*` | `cursor` |
| `field-sizing-fixed`, `field-sizing-content` | `field-sizing` |
| `pointer-events-*` | `pointer-events` |
| `resize-*` | `resize` |
| `scroll-auto`, `scroll-smooth` | `scroll-behavior` |
| `scrollbar-thumb-*`, `scrollbar-track-*` | `scrollbar-color` |
| `scrollbar-auto`, `scrollbar-thin`, `scrollbar-none` | `scrollbar-width` |
| `scrollbar-gutter-*` | `scrollbar-gutter` |
| `scroll-m-*`, `scroll-p-*`, and logical variants | `scroll-margin`, `scroll-padding` |
| `snap-*` | `scroll-snap-align`, `scroll-snap-stop`, `scroll-snap-type` |
| `touch-*` | `touch-action` |
| `select-*` | `user-select` |
| `will-change-*` | `will-change` |
| `fill-*` | `fill` |
| `stroke-*` | `stroke`, `stroke-width` |
| `sr-only`, `not-sr-only` | Visually hidden/revealed accessibility styles |
| `forced-color-adjust-*` | `forced-color-adjust` |

For a concrete utility, inspect its generated CSS rather than assuming the family has only one declaration. For example, `line-clamp-3` and `truncate` intentionally bundle several declarations, while `bg-blue-500/50` uses a color mix for opacity.

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

### v4 CSS directives

| Directive | Raw CSS/build-time concept |
| --- | --- |
| `@import "tailwindcss"` | Import Tailwind's theme, Preflight, and utilities |
| `@theme { --color-brand: ... }` | Declare design tokens and expose matching utility values |
| `@theme inline { ... }` | Inline referenced theme variables into generated declarations |
| `@theme static { ... }` | Emit theme variables even when no utility references them |
| `@utility name { ... }` | Register a variant-aware custom utility |
| `@variant hover { ... }` | Apply an existing variant inside authored CSS |
| `@custom-variant name (...)` | Register a custom selector/media variant |
| `@apply ...` | Substitute existing utility declarations into authored CSS |
| `@reference "..."` | Load another stylesheet's theme/utilities for reference only |
| `@source "..."` | Register an extra source path for class detection |
| `@source not "..."` | Exclude a source path from class detection |
| `@source inline("...")` | Safelist classes using brace expansion |
| `@config "..."` | Load a legacy JavaScript config for compatibility |
| `@plugin "..."` | Load a legacy plugin for compatibility |

These directives are processed by Tailwind; they are not browser-native CSS. `@layer` itself remains a standard CSS cascade-layer feature.

### Theme namespaces

The namespace controls which utility or variant API a theme variable creates:

| Theme namespace | Main generated API |
| --- | --- |
| `--color-*` | Color utilities such as `bg-*`, `text-*`, `border-*`, `fill-*`, `stroke-*`, `accent-*`, and `caret-*` |
| `--font-*` | `font-*` family utilities |
| `--text-*` | `text-*` font-size utilities |
| `--font-weight-*` | `font-*` weight utilities |
| `--tracking-*` | `tracking-*` utilities |
| `--leading-*` | `leading-*` utilities |
| `--tab-size-*` | `tab-*` utilities |
| `--breakpoint-*` | Responsive breakpoint variants |
| `--container-*` | Container-query variants and `max-w-*` container sizes |
| `--spacing-*` | Spacing and sizing utilities |
| `--radius-*` | `rounded-*` utilities |
| `--shadow-*` | `shadow-*` utilities |
| `--inset-shadow-*` | `inset-shadow-*` utilities |
| `--drop-shadow-*` | `drop-shadow-*` utilities |
| `--blur-*` | `blur-*` utilities |
| `--perspective-*` | `perspective-*` utilities |
| `--zoom-*` | `zoom-*` utilities |
| `--aspect-*` | `aspect-*` utilities |
| `--ease-*` | `ease-*` transition timing utilities |
| `--animate-*` | `animate-*` utilities |

### Build-time functions

| Function | Conceptual result |
| --- | --- |
| `--alpha(var(--color-blue-500) / 50%)` | `color-mix(in oklab, var(--color-blue-500) 50%, transparent)` |
| `--spacing(4)` | `calc(var(--spacing) * 4)` |
| `--value(...)` | Resolve a functional `@utility` value from a theme, bare, or arbitrary candidate |
| `--modifier(...)` | Resolve a functional utility modifier such as an opacity or percentage suffix |
| `theme(spacing.12)` | Legacy theme lookup; deprecated in favor of CSS theme variables |

### Functional custom utilities (v4.3)

Functional utilities can resolve theme values, bare values, arbitrary values, and modifiers. `--default(...)` gives the bare class a fallback:

```css
@utility tab-* {
  tab-size: --value(integer, --default(4));
}
```

This produces the conceptual results `tab { tab-size: 4; }` and `tab-2 { tab-size: 2; }`. v4.3 also supports stacked and compound variants inside `@variant`, for example `@variant hover:focus { ... }` and `@variant hover, focus { ... }`.

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
