# Tailwind CSS v4 utility cheat sheet

Tailwind v4 generates only utilities it finds in source files. Values shown with `<...>` are patterns, not literal class names. For migration differences, see the [v3 → v4 checklist](../README.md#v3--v4-migration-checklist).

This index covers every utility family in the current [official v4.3 documentation](https://tailwindcss.com/docs). Grouped patterns include theme values, bare values, modifiers, CSS variables, and arbitrary values. See the [v4.3 release notes](https://tailwindcss.com/blog/tailwindcss-v4-3) for recently added families.

## Base styles

`@import "tailwindcss"` loads the theme, Preflight, and utility layers. Preflight resets common browser defaults, applies `box-sizing: border-box`, removes default margins, and makes the `border` utility produce a usable solid border.

## Layout

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Display | `block`, `inline`, `inline-block`, `flex`, `inline-flex`, `grid`, `inline-grid`, `flow-root`, `hidden` | `hidden md:flex` |
| Columns | `columns-*`, `columns-<n>`, `columns-3xs` … `columns-7xl` | `columns-2` |
| Breaks | `break-before-*`, `break-after-*`, `break-inside-*` | `break-inside-avoid` |
| Box decoration | `box-decoration-clone`, `box-decoration-slice` | `box-decoration-clone` |
| Float/clear | `float-right`, `float-left`, `float-start`, `float-end`, `float-none`; `clear-*` | `float-start clear-both` |
| Isolation | `isolate`, `isolation-auto` | `isolate` |
| Position | `static`, `fixed`, `absolute`, `relative`, `sticky` | `absolute top-4 right-0` |
| Inset | `inset-*`, `inset-x-*`, `inset-y-*`, `inset-s-*`, `inset-e-*`, `inset-bs-*`, `inset-be-*`, `top-*`, `right-*`, `bottom-*`, `left-*` | `inset-0` |
| Legacy logical inset | `start-*`, `end-*` still work but are deprecated in favor of `inset-s-*`, `inset-e-*` | `inset-s-0` |
| Z-index | `z-*` | `z-10` |
| Overflow | `overflow-*`, `overflow-x-*`, `overflow-y-*`, `overscroll-*` | `overflow-x-auto` |
| Visibility | `visible`, `invisible`, `collapse` | `invisible` |
| Box sizing | `box-border`, `box-content` | `box-border` |
| Container | `container` | `container mx-auto` |
| Container type | `@container`, `@container/{name}`, `@container-size`, `@container-size/{name}` | `@container-size` |

## Spacing

| CSS concern | v4 utilities | Example CSS |
| --- | --- | --- |
| Margin | `m-*`, `mx-*`, `my-*`, `ms-*`, `me-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*` | `margin-block: calc(var(--spacing) * 4)` for `my-4` |
| Padding | `p-*`, `px-*`, `py-*`, `ps-*`, `pe-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*` | `padding: calc(var(--spacing) * 6)` for `p-6` |
| Logical spacing | `ms-*`, `me-*`, `mbs-*`, `mbe-*`, `ps-*`, `pe-*`, `pbs-*`, `pbe-*` | `pbs-4 mbe-2` |
| Negative margin | `-m-*`, `-mx-*`, `-mt-*`, and related forms | `-mt-4` |
| Gap | `gap-*`, `gap-x-*`, `gap-y-*` | `gap: calc(var(--spacing) * 4)` |
| Sibling spacing | `space-x-*`, `space-y-*`, `space-x-reverse`, `space-y-reverse` | Prefer `gap-4` for flex/grid layouts |

The default scale is based on `--spacing` and is dynamic in v4; classes such as `p-17` can work without adding every value to a config. Use arbitrary values for one-offs: `p-[13px]`.

## Typography

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Font family | `font-sans`, `font-serif`, `font-mono`, `font-<token>` | `font-display` |
| Font size | `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl` … `text-9xl` | `text-lg/7` |
| Font rendering | `antialiased`, `subpixel-antialiased`, `italic`, `not-italic`, `font-stretch-*` | `antialiased italic` |
| Weight | `font-thin`, `font-extralight`, `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`, `font-extrabold`, `font-black` | `font-semibold` |
| Numeric variants | `normal-nums`, `ordinal`, `slashed-zero`, `lining-nums`, `oldstyle-nums`, `proportional-nums`, `tabular-nums`, `diagonal-fractions`, `stacked-fractions` | `tabular-nums` |
| OpenType features | `font-features-*`, `font-features-[...]`, `font-features-(--token)` | `font-features-["tnum"]` |
| Alignment | `text-left`, `text-center`, `text-right`, `text-justify`, `text-start`, `text-end` | `text-center` |
| Color | `text-<color>-<shade>`, `text-current`, `text-transparent` | `text-slate-700` |
| Placeholder color | `placeholder-<color>-<shade>`, `placeholder-current`, `placeholder-transparent` | `placeholder-slate-400` |
| Line height | `leading-*` or the `text-size/line-height` shorthand | `leading-relaxed` |
| Letter spacing | `tracking-tighter`, `tracking-tight`, `tracking-normal`, `tracking-wide`, `tracking-wider`, `tracking-widest` | `tracking-tight` |
| Decoration | `underline`, `overline`, `line-through`, `no-underline`, `decoration-*`, `underline-offset-*` | `underline decoration-2` |
| Transform | `uppercase`, `lowercase`, `capitalize`, `normal-case` | `uppercase` |
| Overflow | `truncate`, `text-ellipsis`, `text-clip` | `truncate` |
| Line clamp | `line-clamp-*`, `line-clamp-none`, `line-clamp-[...]` | `line-clamp-3` |
| Lists | `list-disc`, `list-decimal`, `list-none`, `list-inside`, `list-outside`, `list-image-[...]` | `list-inside list-disc` |
| Text wrapping | `text-wrap`, `text-nowrap`, `text-balance`, `text-pretty` | `text-pretty` |
| Text indent | `indent-*` | `indent-8` |
| Tab size | `tab-*`, `tab-[...]`, `tab-(--token)` | `tab-4` |
| Vertical align | `align-baseline`, `align-top`, `align-middle`, `align-bottom`, `align-text-top`, `align-text-bottom`, `align-sub`, `align-super` | `align-middle` |
| White space | `whitespace-normal`, `whitespace-nowrap`, `whitespace-pre`, `whitespace-pre-wrap`, `whitespace-break-spaces` | `whitespace-pre-wrap` |
| Word wrapping | `break-normal`, `break-words`, `break-all`, `break-keep`, `wrap-break-word` | `wrap-break-word` |
| Hyphens | `hyphens-none`, `hyphens-manual`, `hyphens-auto` | `hyphens-auto` |
| Generated content | `content-none`, `content-[...]`, `content-(--token)` with `before:`/`after:` | `before:content-['→']` |

## Colors and backgrounds

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Background color | `bg-<color>-<shade>`, `bg-current`, `bg-transparent` | `bg-blue-500` |
| Background attachment | `bg-fixed`, `bg-local`, `bg-scroll` | `bg-fixed` |
| Text color | `text-<color>-<shade>` | `text-white` |
| Opacity | Add `/0` through `/100`, or an arbitrary percentage | `bg-blue-500/50`, `text-black/[37%]` |
| Gradient | `bg-linear-to-*`, `bg-linear-<angle>`, `bg-radial`, `bg-conic-<angle>` | `bg-linear-to-r from-cyan-500 to-blue-500` |
| Gradient stops | `from-*`, `via-*`, `to-*` plus stop positions | `from-indigo-500 via-purple-500 to-pink-500` |
| Background image | `bg-[url(...)]`, `bg-(image:--token)` | `bg-[url(/hero.jpg)]` |
| Background origin | `bg-origin-border`, `bg-origin-padding`, `bg-origin-content` | `bg-origin-content` |
| Background size | `bg-auto`, `bg-cover`, `bg-contain` | `bg-cover` |
| Background position | `bg-center`, `bg-top`, `bg-bottom`, `bg-left`, `bg-right` | `bg-center` |
| Background repeat | `bg-repeat`, `bg-no-repeat`, `bg-repeat-x`, `bg-repeat-y` | `bg-no-repeat` |
| Background clip | `bg-clip-border`, `bg-clip-padding`, `bg-clip-content`, `bg-clip-text` | `bg-clip-text` |

The current default palette has shades `50` through `950`, including `slate`, `gray`, `zinc`, `neutral`, `stone`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `taupe`, `mauve`, `mist`, and `olive`.

## Sizing

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Width | `w-*`, `w-full`, `w-screen`, `w-min`, `w-max`, `w-fit`, fractions | `w-1/2 md:w-full` |
| Size | `size-*`, `size-full`, `size-min`, `size-max`, `size-fit`, fractions | `size-12` |
| Height | `h-*`, `h-full`, `h-screen`, `h-min`, `h-max`, `h-fit` | `h-screen` |
| Min/max width | `min-w-*`, `max-w-*` | `max-w-7xl` |
| Min/max height | `min-h-*`, `max-h-*` | `min-h-screen` |
| Aspect ratio | `aspect-auto`, `aspect-square`, `aspect-video`, `aspect-[...]` | `aspect-video` |
| Flex basis | `basis-*` | `basis-1/2` |
| Object fit | `object-contain`, `object-cover`, `object-fill`, `object-none`, `object-scale-down` | `object-cover` |
| Object position | `object-bottom`, `object-center`, `object-left`, and related forms | `object-center` |
| Logical inline size | `inline-*`, `min-inline-*`, `max-inline-*` | `inline-full max-inline-lg` |
| Logical block size | `block-*`, `min-block-*`, `max-block-*` | `block-64 max-block-screen` |

## Flexbox and grid

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Direction | `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse` | `flex-col` |
| Wrap | `flex-wrap`, `flex-nowrap`, `flex-wrap-reverse` | `flex-wrap` |
| Flex | `flex-1`, `flex-auto`, `flex-initial`, `flex-none`, `flex-[...]` | `flex-1` |
| Basis | `basis-*` | `basis-1/2` |
| Grow/shrink | `grow`, `grow-0`, `shrink`, `shrink-0` | `grow` |
| Order | `order-*`, `order-first`, `order-last`, `order-none` | `order-2` |
| Justify content | `justify-start`, `justify-center`, `justify-between`, `justify-around`, `justify-evenly`, `justify-stretch` | `justify-between` |
| Justify items/self | `justify-items-*`, `justify-self-*` | `justify-items-center` |
| Align content | `content-normal`, `content-center`, `content-start`, `content-end`, `content-between`, `content-around`, `content-evenly`, `content-baseline`, `content-stretch` | `content-center` |
| Align items | `items-start`, `items-center`, `items-end`, `items-baseline`, `items-stretch` | `items-center` |
| Align self | `self-auto`, `self-start`, `self-center`, `self-end`, `self-stretch` | `self-end` |
| Grid columns | `grid-cols-<n>`, `grid-cols-none`, `grid-cols-subgrid`, `grid-cols-[...]` | `grid grid-cols-3` |
| Grid rows | `grid-rows-<n>`, `grid-rows-none`, `grid-rows-subgrid`, `grid-rows-[...]` | `grid-rows-2` |
| Grid span/start/end | `col-span-*`, `col-start-*`, `col-end-*`, `row-span-*`, `row-start-*`, `row-end-*` | `col-span-2` |
| Auto placement | `auto-cols-*`, `auto-rows-*`, `grid-flow-*` | `auto-rows-min` |
| Placement | `place-content-*`, `place-items-*`, `place-self-*` | `place-items-center` |

## Borders, effects, and filters

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Border width | `border`, `border-0`, `border-2`, `border-4`, `border-8`, directional forms | `border-2` |
| Border color | `border-<color>-<shade>`, `border-current`, `border-transparent` | `border-slate-200` |
| Border style | `border-solid`, `border-dashed`, `border-dotted`, `border-double`, `border-hidden`, `border-none` | `border-dashed` |
| Radius | `rounded-xs`, `rounded-sm`, `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` | `rounded-lg` |
| Child dividers | `divide-x-*`, `divide-y-*`, `divide-<color>-*`, `divide-dashed` | `divide-y divide-slate-200` |
| Shadow | `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `shadow-inner`, `shadow-none` | `shadow-lg` |
| Inset shadow | `inset-shadow-*`, `inset-shadow-none` | `inset-shadow-sm` |
| Text shadow | `text-shadow-2xs`, `text-shadow-xs`, `text-shadow-sm`, `text-shadow-md`, `text-shadow-lg`, `text-shadow-none` | `text-shadow-sm` |
| Opacity | `opacity-*` | `opacity-75` |
| Outline | `outline`, `outline-2`, `outline-<color>-*`, `outline-dashed`, `outline-hidden`, `outline-none` | `focus:outline-2 focus:outline-blue-500` |
| Logical borders | `border-s-*`, `border-e-*`, `border-bs-*`, `border-be-*` | `border-bs-2` |
| Ring | `ring`, `ring-2`, `ring-3`, `ring-4`, `ring-<color>-*` | `focus:ring-2 focus:ring-blue-500` |
| Inset ring | `inset-ring`, `inset-ring-2`, `inset-ring-<color>-*` | `inset-ring-2` |
| Ring offset | `ring-offset-*`, `ring-offset-<color>-*` | `ring-2 ring-offset-2` |
| Blend | `mix-blend-*`, `bg-blend-*` | `mix-blend-multiply` |
| Filter | `blur-*`, `brightness-*`, `contrast-*`, `grayscale`, `invert`, `saturate-*`, `sepia`, `hue-rotate-*` | `blur-sm` |
| Drop shadow | `drop-shadow-xs`, `drop-shadow-sm`, `drop-shadow-md`, `drop-shadow-lg`, `drop-shadow-xl`, `drop-shadow-2xl`, `drop-shadow-none` | `drop-shadow-lg` |
| Mask | `mask-clip-*`, `mask-composite-*`, `mask-[...]`, `mask-linear-*`, `mask-radial-*`, `mask-conic-*`, `mask-mode-*`, `mask-origin-*`, `mask-position-*`, `mask-repeat-*`, `mask-size-*`, `mask-type-*` | `mask-linear-45 from-black to-transparent` |
| Backdrop filter | `backdrop-blur-*`, `backdrop-brightness-*`, `backdrop-contrast-*`, `backdrop-grayscale`, `backdrop-hue-rotate-*`, `backdrop-invert`, `backdrop-opacity-*`, `backdrop-saturate-*`, `backdrop-sepia` | `backdrop-blur-md` |

## Tables

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Border collapse | `border-collapse`, `border-separate` | `border-collapse` |
| Border spacing | `border-spacing-*`, `border-spacing-x-*`, `border-spacing-y-*` | `border-spacing-2` |
| Table layout | `table-auto`, `table-fixed` | `table-fixed` |
| Caption side | `caption-top`, `caption-bottom` | `caption-bottom` |

## Transitions, animation, and transforms

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Transition | `transition`, `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform`, `transition-none` | `transition-colors` |
| Transition behavior | `transition-normal`, `transition-discrete` | `transition-discrete` |
| Duration | `duration-<ms>` | `duration-300` |
| Delay | `delay-<ms>` | `delay-150` |
| Timing | `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-<token>` | `ease-out` |
| Animation | `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none`, `animate-[...]` | `animate-pulse` |
| Rotate | `rotate-*`, `rotate-x-*`, `rotate-y-*`, `rotate-z-*`, `rotate-none` | `hover:rotate-3` |
| Scale | `scale-*`, `scale-x-*`, `scale-y-*`, `scale-z-*`, `scale-none` | `hover:scale-105` |
| Translate | `translate-*`, `translate-x-*`, `translate-y-*`, `translate-z-*`, `translate-none` | `translate-x-4` |
| Skew | `skew-x-*`, `skew-y-*` | `skew-x-3` |
| Origin | `origin-center`, `origin-top`, and related forms | `origin-center` |
| 3D | `transform-3d`, `transform-flat`, `perspective-*`, `perspective-origin-*`, `backface-visible`, `backface-hidden` | `transform-3d` |
| Transform control | `transform`, `transform-none`, `transform-content`, `transform-border`, `transform-fill`, `transform-stroke`, `transform-view` | `transform` |
| Zoom | `zoom-*`, `zoom-[...]`, `zoom-(--token)` | `zoom-125` |

## Interactivity and accessibility

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Cursor | `cursor-auto`, `cursor-default`, `cursor-pointer`, `cursor-wait`, `cursor-text`, `cursor-move`, `cursor-not-allowed`, `cursor-<value>` | `cursor-pointer` |
| Accent color | `accent-inherit`, `accent-current`, `accent-transparent`, `accent-black`, `accent-white`, `accent-<color>-<shade>`, `accent-[...]` | `accent-blue-500` |
| Appearance | `appearance-none`, `appearance-auto` | `appearance-none` |
| Caret color | `caret-<color>-<shade>`, `caret-[...]`, `caret-(--token)` | `caret-blue-500` |
| Field sizing | `field-sizing-fixed`, `field-sizing-content` | `field-sizing-content` |
| Pointer events | `pointer-events-none`, `pointer-events-auto` | `pointer-events-none` |
| User select | `select-none`, `select-text`, `select-all`, `select-auto` | `select-none` |
| Resize | `resize-none`, `resize-y`, `resize-x`, `resize` | `resize-y` |
| Scroll behavior | `scroll-auto`, `scroll-smooth` | `scroll-smooth` |
| Scrollbars | `scrollbar-auto`, `scrollbar-thin`, `scrollbar-none`, `scrollbar-thumb-*`, `scrollbar-track-*` | `scrollbar-thin scrollbar-thumb-sky-700` |
| Scrollbar gutter | `scrollbar-gutter-auto`, `scrollbar-gutter-stable`, `scrollbar-gutter-both` | `scrollbar-gutter-stable` |
| Scroll margin/padding | `scroll-m-*`, `scroll-p-*`, logical `scroll-mbs-*`, `scroll-pbs-*`, and related forms | `scroll-mt-20 scroll-p-4` |
| Snap | `snap-none`, `snap-x`, `snap-y`, `snap-mandatory`, `snap-center`, and related forms | `snap-x snap-mandatory` |
| Touch action | `touch-auto`, `touch-none`, `touch-pan-x`, `touch-pan-y`, `touch-pinch-zoom`, and combinations | `touch-pan-y` |
| Will change | `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[...]` | `will-change-transform` |
| Color scheme | `scheme-normal`, `scheme-light`, `scheme-dark`, `scheme-light-dark` | `scheme-dark` |
| Screen reader | `sr-only`, `not-sr-only` | `sr-only` |
| SVG fill/stroke | `fill-*`, `stroke-*`, `stroke-<width>` | `fill-current stroke-2` |
| Forced colors | `forced-color-adjust-auto`, `forced-color-adjust-none`; `forced-colors:*` variant | `forced-color-adjust-none` |

## Variants

```html
<button class="text-sm md:text-base lg:text-lg">
  Responsive
</button>

<button class="bg-blue-600 hover:bg-blue-500 focus-visible:outline-2 disabled:opacity-50">
  State
</button>

<div class="group">
  <span class="group-hover:text-blue-500">Group state</span>
</div>

<div data-state="open" class="data-[state=open]:block data-[state=closed]:hidden">
  Data attribute
</div>

<div class="motion-reduce:transition-none print:hidden">
  Media variants
</div>
```

- Responsive variants are mobile-first: `sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem, `2xl` 96rem.
- Add custom breakpoints with `@theme { --breakpoint-3xl: 120rem; }`.
- Use `min-[...]:` and `max-[...]:` for one-off breakpoints.
- Use `@container` on a parent and `@sm:`, `@md:`, and related variants on children for container queries.
- `dark:` defaults to `prefers-color-scheme`. Override it with `@custom-variant dark (&:where(.dark, .dark *));` for class- or attribute-driven dark mode.
- Use `not-*`, `starting`, `aria-*`, `data-*`, `group-*`, `peer-*`, `has-*`, `in-*`, `supports-*`, `motion-*`, `contrast-*`, and `print` variants as needed.
- Use `forced-colors:*` for Windows High Contrast mode and `@starting-style`-based entry transitions with the `starting` variant.
- Structural variants include `first`, `last`, `only`, `odd`, `even`, `first-of-type`, `last-of-type`, `only-of-type`, `empty`, and `nth-*` forms.
- Form/state variants include `checked`, `indeterminate`, `default`, `required`, `valid`, `invalid`, `in-range`, `out-of-range`, `placeholder-shown`, `autofill`, `read-only`, `open`, `target`, and `visited`.
- Pseudo-element variants include `before`, `after`, `first-letter`, `first-line`, `marker`, `selection`, `file`, `placeholder`, and `backdrop`.
- Media variants include `portrait`, `landscape`, `motion-safe`, `motion-reduce`, `contrast-more`, `contrast-less`, `pointer-*`, `any-pointer-*`, `inverted-colors`, `noscript`, and `forced-colors`.
- In v4, `hover:` is wrapped in `@media (hover: hover)` for devices that support hover.

## Arbitrary and CSS-variable values

```html
<div class="w-[37rem] bg-[#1da1f2] p-[calc(100%-2rem)]">
  Arbitrary values
</div>

<div class="bg-(--brand-color) text-(--brand-text)">
  CSS variable shorthand
</div>

<div class="hover:[transform:rotate(3deg)]">
  Property-value utility
</div>
```

Use underscores where an arbitrary value needs spaces, for example `grid-cols-[max-content_auto]`.

## Source detection

Tailwind scans source as plain text, so complete class names must exist in source files. Register, exclude, or safelist sources from CSS:

```css
@import "tailwindcss" source(none);
@source "../node_modules/@acme/ui";
@source not "../src/legacy";
@source inline("{hover:,focus:,}underline");
```

Do not build class names dynamically such as `text-${color}-600`; map application values to complete class strings instead.

## Custom CSS

```css
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.72 0.14 240);
}

@utility content-auto {
  content-visibility: auto;
}

@custom-variant theme-midnight (&:where([data-theme="midnight"] *));

@layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}
```

Use `@apply` for small, deliberate integrations with third-party markup. In separately bundled component styles, add `@reference` to the main stylesheet first.

`@config` and `@plugin` remain available only for incremental v3 compatibility. Prefer CSS theme variables, `@utility`, and `@custom-variant` for new v4 code.

### Functional custom utilities (v4.3)

Use `--value(...)` and `--modifier(...)` to make a custom utility accept theme values, bare values, arbitrary values, or modifiers. `--default(...)` supplies a value for the bare utility:

```css
@utility tab-* {
  tab-size: --value(integer, --default(4));
}
```

`tab`, `tab-2`, and `tab-[12px]` can then share one utility family. See the [official v4.3 release notes](https://tailwindcss.com/blog/tailwindcss-v4-3#default-values-for-functional-utilities).

## v3 compatibility reminders

Do not copy these v3-only forms into new v4 code:

| Avoid | Use |
| --- | --- |
| `bg-opacity-50` | `bg-black/50` |
| `flex-shrink-0` | `shrink-0` |
| `flex-grow` | `grow` |
| `overflow-ellipsis` | `text-ellipsis` |
| `shadow-sm` when preserving the old v3 `shadow-sm` appearance | `shadow-xs` |
| `rounded-sm` when preserving the old v3 `rounded-sm` appearance | `rounded-xs` |
| `outline-none` for an accessibility-preserving hidden outline | `outline-hidden` |
| `ring` when a 3px blue ring is intended | `ring-3 ring-blue-500` |
| `theme()` for new theme access | CSS theme variables, `--spacing()`, or `--alpha()` |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` |
