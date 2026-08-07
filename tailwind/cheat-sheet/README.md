# Tailwind CSS v4 utility cheat sheet

Tailwind v4 generates only utilities it finds in source files. Values shown with `<...>` are patterns, not literal class names. For migration differences, see the [v3 → v4 checklist](../README.md#v3--v4-migration-checklist).

## Layout

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Display | `block`, `inline`, `inline-block`, `flex`, `inline-flex`, `grid`, `inline-grid`, `flow-root`, `hidden` | `hidden md:flex` |
| Position | `static`, `fixed`, `absolute`, `relative`, `sticky` | `absolute top-4 right-0` |
| Inset | `inset-*`, `inset-x-*`, `inset-y-*`, `start-*`, `end-*`, `top-*`, `right-*`, `bottom-*`, `left-*` | `inset-0` |
| Z-index | `z-*` | `z-10` |
| Overflow | `overflow-*`, `overflow-x-*`, `overflow-y-*`, `overscroll-*` | `overflow-x-auto` |
| Visibility | `visible`, `invisible`, `collapse` | `invisible` |
| Box sizing | `box-border`, `box-content` | `box-border` |
| Container | `container` | `container mx-auto` |

## Spacing

| CSS concern | v4 utilities | Example CSS |
| --- | --- | --- |
| Margin | `m-*`, `mx-*`, `my-*`, `ms-*`, `me-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*` | `margin-block: calc(var(--spacing) * 4)` for `my-4` |
| Padding | `p-*`, `px-*`, `py-*`, `ps-*`, `pe-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*` | `padding: calc(var(--spacing) * 6)` for `p-6` |
| Negative margin | `-m-*`, `-mx-*`, `-mt-*`, and related forms | `-mt-4` |
| Gap | `gap-*`, `gap-x-*`, `gap-y-*` | `gap: calc(var(--spacing) * 4)` |
| Sibling spacing | `space-x-*`, `space-y-*`, `space-x-reverse`, `space-y-reverse` | Prefer `gap-4` for flex/grid layouts |

The default scale is based on `--spacing` and is dynamic in v4; classes such as `p-17` can work without adding every value to a config. Use arbitrary values for one-offs: `p-[13px]`.

## Typography

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Font family | `font-sans`, `font-serif`, `font-mono`, `font-<token>` | `font-display` |
| Font size | `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl` … `text-9xl` | `text-lg/7` |
| Weight | `font-thin`, `font-extralight`, `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`, `font-extrabold`, `font-black` | `font-semibold` |
| Alignment | `text-left`, `text-center`, `text-right`, `text-justify`, `text-start`, `text-end` | `text-center` |
| Color | `text-<color>-<shade>`, `text-current`, `text-transparent` | `text-slate-700` |
| Line height | `leading-*` or the `text-size/line-height` shorthand | `leading-relaxed` |
| Letter spacing | `tracking-tighter`, `tracking-tight`, `tracking-normal`, `tracking-wide`, `tracking-wider`, `tracking-widest` | `tracking-tight` |
| Decoration | `underline`, `overline`, `line-through`, `no-underline`, `decoration-*`, `underline-offset-*` | `underline decoration-2` |
| Transform | `uppercase`, `lowercase`, `capitalize`, `normal-case` | `uppercase` |
| Overflow | `truncate`, `text-ellipsis`, `text-clip` | `truncate` |
| White space | `whitespace-normal`, `whitespace-nowrap`, `whitespace-pre`, `whitespace-pre-wrap`, `whitespace-break-spaces` | `whitespace-pre-wrap` |
| Word wrapping | `break-normal`, `break-words`, `break-all`, `break-keep`, `wrap-break-word` | `wrap-break-word` |

## Colors and backgrounds

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Background color | `bg-<color>-<shade>`, `bg-current`, `bg-transparent` | `bg-blue-500` |
| Text color | `text-<color>-<shade>` | `text-white` |
| Opacity | Add `/0` through `/100`, or an arbitrary percentage | `bg-blue-500/50`, `text-black/[37%]` |
| Gradient | `bg-linear-to-*`, `bg-linear-<angle>`, `bg-radial`, `bg-conic-<angle>` | `bg-linear-to-r from-cyan-500 to-blue-500` |
| Gradient stops | `from-*`, `via-*`, `to-*` plus stop positions | `from-indigo-500 via-purple-500 to-pink-500` |
| Background image | `bg-[url(...)]`, `bg-(image:--token)` | `bg-[url(/hero.jpg)]` |
| Background size | `bg-auto`, `bg-cover`, `bg-contain` | `bg-cover` |
| Background position | `bg-center`, `bg-top`, `bg-bottom`, `bg-left`, `bg-right` | `bg-center` |
| Background repeat | `bg-repeat`, `bg-no-repeat`, `bg-repeat-x`, `bg-repeat-y` | `bg-no-repeat` |
| Background clip | `bg-clip-border`, `bg-clip-padding`, `bg-clip-content`, `bg-clip-text` | `bg-clip-text` |

The current default palette has shades `50` through `950`, including `slate`, `gray`, `zinc`, `neutral`, `stone`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `taupe`, `mauve`, `mist`, and `olive`.

## Sizing

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Width | `w-*`, `w-full`, `w-screen`, `w-min`, `w-max`, `w-fit`, fractions | `w-1/2 md:w-full` |
| Height | `h-*`, `h-full`, `h-screen`, `h-min`, `h-max`, `h-fit` | `h-screen` |
| Min/max width | `min-w-*`, `max-w-*` | `max-w-7xl` |
| Min/max height | `min-h-*`, `max-h-*` | `min-h-screen` |
| Aspect ratio | `aspect-auto`, `aspect-square`, `aspect-video`, `aspect-[...]` | `aspect-video` |
| Flex basis | `basis-*` | `basis-1/2` |
| Object fit | `object-contain`, `object-cover`, `object-fill`, `object-none`, `object-scale-down` | `object-cover` |
| Object position | `object-bottom`, `object-center`, `object-left`, and related forms | `object-center` |

## Flexbox and grid

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Direction | `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse` | `flex-col` |
| Wrap | `flex-wrap`, `flex-nowrap`, `flex-wrap-reverse` | `flex-wrap` |
| Grow/shrink | `grow`, `grow-0`, `shrink`, `shrink-0` | `grow` |
| Order | `order-*`, `order-first`, `order-last`, `order-none` | `order-2` |
| Justify | `justify-start`, `justify-center`, `justify-between`, `justify-around`, `justify-evenly`, `justify-stretch` | `justify-between` |
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
| Text shadow | `text-shadow-2xs`, `text-shadow-xs`, `text-shadow-sm`, `text-shadow-md`, `text-shadow-lg`, `text-shadow-none` | `text-shadow-sm` |
| Opacity | `opacity-*` | `opacity-75` |
| Outline | `outline`, `outline-2`, `outline-<color>-*`, `outline-dashed`, `outline-hidden`, `outline-none` | `focus:outline-2 focus:outline-blue-500` |
| Ring | `ring`, `ring-2`, `ring-3`, `ring-4`, `ring-<color>-*` | `focus:ring-2 focus:ring-blue-500` |
| Blend | `mix-blend-*`, `bg-blend-*` | `mix-blend-multiply` |
| Filter | `blur-*`, `brightness-*`, `contrast-*`, `grayscale`, `invert`, `saturate-*`, `sepia`, `hue-rotate-*` | `blur-sm` |
| Drop shadow | `drop-shadow-xs`, `drop-shadow-sm`, `drop-shadow-md`, `drop-shadow-lg`, `drop-shadow-xl`, `drop-shadow-2xl`, `drop-shadow-none` | `drop-shadow-lg` |

## Transitions, animation, and transforms

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Transition | `transition`, `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform`, `transition-none` | `transition-colors` |
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

## Interactivity and accessibility

| CSS concern | v4 utilities | Example |
| --- | --- | --- |
| Cursor | `cursor-auto`, `cursor-default`, `cursor-pointer`, `cursor-wait`, `cursor-text`, `cursor-move`, `cursor-not-allowed`, `cursor-<value>` | `cursor-pointer` |
| Pointer events | `pointer-events-none`, `pointer-events-auto` | `pointer-events-none` |
| User select | `select-none`, `select-text`, `select-all`, `select-auto` | `select-none` |
| Resize | `resize-none`, `resize-y`, `resize-x`, `resize` | `resize-y` |
| Scroll behavior | `scroll-auto`, `scroll-smooth` | `scroll-smooth` |
| Snap | `snap-none`, `snap-x`, `snap-y`, `snap-mandatory`, `snap-center`, and related forms | `snap-x snap-mandatory` |
| Color scheme | `scheme-normal`, `scheme-light`, `scheme-dark`, `scheme-light-dark` | `scheme-dark` |
| Screen reader | `sr-only`, `not-sr-only` | `sr-only` |
| SVG fill/stroke | `fill-*`, `stroke-*`, `stroke-<width>` | `fill-current stroke-2` |

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
| `@tailwind base/components/utilities` | `@import "tailwindcss"` |
