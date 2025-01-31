# Tailwind CSS Cheatsheet

---

## 📐 **Layout**
| Category       | Utilities                          | Example Classes                    | Corresponding CSS                 |
|----------------|------------------------------------|-------------------------------------|-----------------------------------|
| Display        | `block, inline, flex, grid, hidden, inline-flex, inline-block, inline-grid, flow-root` | `hidden md:flex`                   | `display: none;` (hidden), `display: flex;` (md:flex) |
| Positioning    | `static, fixed, absolute, relative, sticky` | `absolute top-4 right-0`           | `position: absolute; top: 1rem; right: 0;` |
| Flexbox        | `flex-row, flex-col, flex-wrap, justify-*, items-*, content-*, flex-grow-*, flex-shrink-*, order-*` | `justify-between items-center`    | `justify-content: space-between; align-items: center;` |
| Grid           | `grid-cols-*, grid-rows-*, gap-*, col-span-*, row-span-*, auto-cols-*, auto-rows-*, place-content-*, place-items-*` | `grid-cols-3 gap-4 col-span-2`   | `grid-template-columns: repeat(3, 1fr); gap: 1rem; grid-column: span 2 / span 2;` |
| Z-Index        | `z-0` to `z-50`                   | `z-10`                              | `z-index: 10;`                    |
| Overflow       | `overflow-auto, overflow-hidden, overflow-x-auto, overflow-y-auto, overscroll-contain, overscroll-x-contain, overscroll-y-contain, overscroll-auto` | `overflow-x-scroll`               | `overflow-x: scroll;`            |
| Box Sizing     | `box-border, box-content`         | `box-border`                        | `box-sizing: border-box;`         |
| Container      | `container`                       | `container mx-auto`                 | `max-width: 100%; margin-left: auto; margin-right: auto;` |

---

## ↔️ **Spacing**
| Type          | Utilities                          | Example                     | Corresponding CSS                 |
|---------------|------------------------------------|-----------------------------|-----------------------------------|
| Margin        | `m-* -mx-* mt-* -my-* mb-* ml-* mr-*` (0-96, auto) | `mt-4 mx-auto`              | `margin-top: 1rem; margin-left: auto; margin-right: auto;` |
| Padding       | `p-* px-* pt-* pb-* pl-* pr-* py-*` (0-96) | `px-6 py-3`                 | `padding-left: 1.5rem; padding-right: 1.5rem; padding-top: 0.75rem; padding-bottom: 0.75rem;` |
| Space Between | `space-x-*, space-y-*` (0-96)     | `space-y-4`                 | `margin-top: 1rem; margin-bottom: 1rem;` (vertical spacing) |
| Negative Margin | `-m-* -mx-* -my-* -mt-* -mr-* -mb-* -ml-*` (0-96) | `-mt-4 -mx-2`             | `margin-top: -1rem; margin-left: -0.5rem; margin-right: -0.5rem;` |
| Gap           | `gap-* gap-x-* gap-y-*`           | `gap-4 gap-x-6`             | `gap: 1rem; gap-inline: 1.5rem;` |

---

## 🖋 **Typography**
| Property       | Utilities                          | Example                     | Corresponding CSS                 |
|----------------|------------------------------------|-----------------------------|-----------------------------------|
| Font Size      | `text-xs` to `text-9xl`           | `text-lg`                   | `font-size: 1.125rem;`            |
| Font Weight    | `font-thin` to `font-black`        | `font-bold`                 | `font-weight: 700;`               |
| Text Align     | `text-left, text-center, text-right, text-justify` | `md:text-center`            | `text-align: center;`             |
| Text Color     | `text-{color}-{shade}`             | `text-slate-700 dark:text-white` | `color: #4a5568;` (light mode), `color: #ffffff;` (dark mode) |
| Line Height    | `leading-*` (3-10, none, tight, snug, normal, relaxed, loose) | `leading-relaxed`           | `line-height: 1.625;`             |
| Font Family    | `font-sans, font-serif, font-mono` | `font-sans`                 | `font-family: system-ui, sans-serif;` |
| Text Decoration| `underline, line-through, no-underline` | `underline`                | `text-decoration: underline;`    |
| Text Transform | `uppercase, lowercase, capitalize, normal-case` | `uppercase`                | `text-transform: uppercase;`     |
| Text Overflow  | `truncate, overflow-ellipsis, overflow-clip` | `truncate`                | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` |
| Whitespace     | `whitespace-normal, whitespace-no-wrap, whitespace-pre, whitespace-pre-line, whitespace-pre-wrap` | `whitespace-pre-wrap`    | `white-space: pre-wrap;`         |
| Word Break     | `break-normal, break-words, break-all, truncate` | `break-words`             | `word-break: break-word;`        |
| Letter Spacing | `tracking-*` (tighter, tight, normal, wide, wider, widest) | `tracking-wide`           | `letter-spacing: 0.05em;`        |

---

## 🎨 **Colors & Backgrounds**
| Category       | Utilities                          | Example                     | Corresponding CSS                 |
|----------------|------------------------------------|-----------------------------|-----------------------------------|
| BG Color       | `bg-{color}-{shade}`               | `bg-blue-600/50` (opacity)  | `background-color: rgba(37, 99, 235, 0.5);` |
| Gradient       | `bg-gradient-{direction}`          | `bg-gradient-to-r from-cyan-500 to-blue-500` | `background: linear-gradient(to right, #06b6d4, #3b82f6);` |
| Border Color   | `border-{color}-{shade}`           | `border-emerald-400`        | `border-color: #34d399;`         |
| Text Color     | `text-{color}-{shade}`             | `text-gray-800`             | `color: #2d3748;`                |
| Border Radius  | `rounded, rounded-{size}, rounded-full, rounded-t-*, rounded-r-*, rounded-b-*, rounded-l-*` | `rounded-full`              | `border-radius: 9999px;`         |
| Border Style   | `border-dashed, border-dotted, border-solid, border-double, border-none` | `border-dotted`            | `border-style: dotted;`          |
| BG Opacity     | `bg-opacity-*` (0-100)             | `bg-opacity-50`             | `background-color: rgba(37, 99, 235, 0.5);` |
| BG Image       | `bg-none, bg-gradient-to-t, bg-gradient-to-tr, bg-gradient-to-r, bg-gradient-to-br, bg-gradient-to-b, bg-gradient-to-bl, bg-gradient-to-l, bg-gradient-to-tl, bg-contain, bg-cover` | `bg-cover`                 | `background-size: cover;`        |

---

## 📏 **Sizing**
| Property       | Utilities                          | Example                     | Corresponding CSS                 |
|----------------|------------------------------------|-----------------------------|-----------------------------------|
| Width          | `w-*` (0-96, auto, screen, full, min, max, fit)   | `w-32 md:w-1/2`            | `width: 8rem;` (small screen), `width: 50%;` (medium screen) |
| Height         | `h-*` (0-96, screen, full, min, max, fit)         | `h-screen`                 | `height: 100vh;`                  |
| Min/Max Width  | `min-w-*, max-w-*`                 | `max-w-7xl`                | `max-width: 80rem;`               |
| Min/Max Height | `min-h-*, max-h-*`                 | `max-h-screen`             | `max-height: 100vh;`              |
| Aspect Ratio   | `aspect-w-*, aspect-h-*`           | `aspect-w-16 aspect-h-9`   | `aspect-ratio: 16 / 9;`           |
| Flex Basis     | `basis-*` (0-96)                   | `basis-1/2`                | `flex-basis: 50%;`                |
| Object Fit     |`object-contain, object-cover, object-fill, object-none, object-scale-down` | `object-cover`             | `object-fit: cover;`              |
| Object Position| `object-bottom, object-center, object-left, object-left-bottom, object-left-top, object-right, object-right-bottom, object-right-top, object-top` | `object-center`            | `object-position: center;`       |
| Max Width      | `max-w-*`                          | `max-w-7xl`                | `max-width: 80rem;`               |
| Max Height     | `max-h-*`                          | `max-h-screen`             | `max-height: 100vh;`              |

---

## 🌀 **Effects**
| Category       | Utilities                          | Example                     | Corresponding CSS                         |
|----------------|------------------------------------|-----------------------------|-------------------------------------------|
| Shadow         | `shadow-{size}`                    | `shadow-xl hover:shadow-2xl`| `box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);` (shadow-xl), `box-shadow: 0 0 25px rgba(0, 0, 0, 0.2);` (hover:shadow-2xl) |
| Opacity        | `opacity-*` (0-100)                | `opacity-75`                | `opacity: 0.75;`                          |
| Blend Mode     | `mix-blend-*`                      | `mix-blend-multiply`        | `mix-blend-mode: multiply;`               |
| Filter         | `filter, blur, brightness, contrast, grayscale, invert, saturate, sepia` | `filter blur-sm`            | `filter: blur(4px);`                      |
| Outline        | `outline-{color}-{width}`          | `outline-blue-500`          | `outline: 2px solid #3b82f6;`            |
| Drop Shadow    | `drop-shadow-*`                    | `drop-shadow-lg`            | `filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1));` |

---

## 🎭 **Transitions & Animation**
| Category       | Utilities                          | Example                     | Corresponding CSS                         |
|----------------|------------------------------------|-----------------------------|-------------------------------------------|
| Transition     | `transition-{property} duration-*` | `transition-colors duration-300` | `transition: all 0.3s;` (transition-colors) |
| Animation      | `animate-{type}`                   | `animate-spin`              | `animation: spin 1s linear infinite;`     |
| Transform      | `rotate-*, scale-*, translate-*`   | `hover:scale-105`           | `transform: scale(1.05);` (on hover)      |
| Transform Origin | `origin-top, origin-center`       | `origin-center`             | `transform-origin: center;`               |
| Transition Delay | `delay-*`                         | `delay-200`                 | `transition-delay: 200ms;`                |
| Timing Function | `ease-in, ease-out, ease-in-out`   | `ease-in`                   | `transition-timing-function: ease-in;`    |

---

## 🛠 **Borders**
| Property       | Utilities                          | Example                     | Corresponding CSS                         |
|----------------|------------------------------------|-----------------------------|-------------------------------------------|
| Border Width   | `border-*` (0-8)                   | `border-2`                  | `border-width: 2px;`                      |
| Border Radius  | `rounded-{size}`                   | `rounded-full`              | `border-radius: 9999px;`                  |
| Border Style   | `border-dashed, border-dotted`     | `border-dotted`             | `border-style: dotted;`                   |
| Border Color   | `border-{color}-{shade}`           | `border-emerald-400`        | `border-color: #34d399;`                  |
| Border Collapse| `border-collapse`                 | `border-collapse`           | `border-collapse: collapse;`              |

---

## 🅰️ **Typography**
| Property         | Utilities                              | Example                          | Corresponding CSS                          |
|------------------|----------------------------------------|----------------------------------|--------------------------------------------|
| Font Family      | `font-{family}`                        | `font-sans`                      | `font-family: sans-serif;`                 |
| Font Size        | `text-{size}`                          | `text-xl`                        | `font-size: 1.25rem;`                      |
| Font Weight      | `font-{weight}`                        | `font-bold`                      | `font-weight: 700;`                        |
| Line Height      | `leading-{size}`                       | `leading-relaxed`                | `line-height: 1.625;`                      |
| Letter Spacing   | `tracking-{size}`                      | `tracking-wide`                  | `letter-spacing: 0.05em;`                  |
| Text Color       | `text-{color}`                         | `text-blue-500`                  | `color: #3b82f6;`                          |
| Text Alignment   | `text-{align}`                         | `text-center`                    | `text-align: center;`                      |
| Text Transform   | `uppercase, lowercase, capitalize`     | `uppercase`                      | `text-transform: uppercase;`               |
| Text Decoration  | `underline, line-through, no-underline`| `underline`                      | `text-decoration: underline;`              |
| Word Break       | `break-normal, break-words, break-all` | `break-words`                    | `word-break: break-word;`                  |

---

## 🌈 **Colors**
| Property         | Utilities                              | Example                          | Corresponding CSS                          |
|------------------|----------------------------------------|----------------------------------|--------------------------------------------|
| Background Color | `bg-{color}-{shade}`                   | `bg-blue-500`                    | `background-color: #3b82f6;`               |
| Border Color     | `border-{color}-{shade}`               | `border-gray-300`                | `border-color: #d1d5db;`                   |
| Text Color       | `text-{color}-{shade}`                 | `text-red-600`                   | `color: #dc2626;`                          |
| Hover Color      | `hover:bg-{color}-{shade}`             | `hover:bg-gray-200`              | `hover: background-color: #e5e7eb;`        |
| Placeholder Color| `placeholder-{color}-{shade}`          | `placeholder-gray-500`           | `::placeholder { color: #6b7280; }`       |
| Border Focus     | `focus:border-{color}-{shade}`         | `focus:border-blue-500`          | `:focus { border-color: #3b82f6; }`        |

---

## 🎨 **Gradients**
| Property         | Utilities                              | Example                          | Corresponding CSS                          |
|------------------|----------------------------------------|----------------------------------|--------------------------------------------|
| Background Gradient | `bg-gradient-to-{direction} from-{color} via-{color} to-{color}` | `bg-gradient-to-r from-purple-500 via-pink-500 to-red-500` | `background: linear-gradient(to right, #6b46c1, #ec4899, #f43f5e);` |
| Gradient Stops   | `from-{color}, via-{color}, to-{color}` | `from-green-400 via-yellow-500 to-red-500` | `background: linear-gradient(to right, #10b981, #f59e0b, #ef4444);` |

---

## 🏞 **Object Positioning**
| Property         | Utilities                              | Example                          | Corresponding CSS                          |
|------------------|----------------------------------------|----------------------------------|--------------------------------------------|
| Object Fit       | `object-cover, object-contain`         | `object-contain`                 | `object-fit: contain;`                     |
| Object Position  | `object-center, object-top, object-left`| `object-center`                  | `object-position: center;`                 |

---

## 🔲 **Display & Visibility**
| Property         | Utilities                              | Example                          | Corresponding CSS                          |
|------------------|----------------------------------------|----------------------------------|--------------------------------------------|
| Display          | `block, inline, inline-block, flex, grid`| `inline-block`                   | `display: inline-block;`                   |
| Visibility       | `visible, invisible`                   | `invisible`                      | `visibility: hidden;`                      |
| Overflow         | `overflow-{x|y}-{visible|hidden|scroll}`| `overflow-x-auto`                | `overflow-x: auto;`                        |
| Positioning      | `static, relative, absolute, fixed`    | `absolute`                       | `position: absolute;`                      |
| Z-Index          | `z-{index}`                            | `z-10`                           | `z-index: 10;`                             |

---

## 🧩 **Flexbox & Grid**
| Property         | Utilities                              | Example                          | Corresponding CSS                          |
|------------------|----------------------------------------|----------------------------------|--------------------------------------------|
| Flex Direction   | `flex-row, flex-col`                   | `flex-col`                       | `flex-direction: column;`                  |
| Flex Wrap        | `flex-wrap, flex-nowrap, flex-wrap-reverse` | `flex-wrap`                      | `flex-wrap: wrap;`                         |
| Justify Content  | `justify-start, justify-center, justify-between` | `justify-between`                | `justify-content: space-between;`          |
| Align Items      | `items-start, items-center, items-end` | `items-center`                   | `align-items: center;`                     |
| Grid Template Columns | `grid-cols-{n}`                    | `grid-cols-3`                    | `grid-template-columns: repeat(3, 1fr);`   |
| Grid Template Rows    | `grid-rows-{n}`                   | `grid-rows-2`                    | `grid-template-rows: repeat(2, 1fr);`      |

---

## 🦴 **Transform**
| Property         | Utilities                              | Example                          | Corresponding CSS                          |
|------------------|----------------------------------------|----------------------------------|--------------------------------------------|
| Rotate           | `rotate-{deg}`                         | `rotate-45`                      | `transform: rotate(45deg);`                |
| Scale            | `scale-{value}`                        | `scale-105`                      | `transform: scale(1.05);`                  |
| Translate        | `translate-x-{value}, translate-y-{value}` | `translate-x-4`                  | `transform: translateX(1rem);`             |
| Skew             | `skew-x-{value}, skew-y-{value}`       | `skew-x-12`                      | `transform: skewX(12deg);`                 |

---

## 💡 **Visibility & Display**
| Property         | Utilities                              | Example                          | Corresponding CSS                          |
|------------------|----------------------------------------|----------------------------------|--------------------------------------------|
| Display          | `block, inline, inline-block, flex`    | `inline-block`                   | `display: inline-block;`                   |
| Visibility       | `visible, invisible`                   | `invisible`                      | `visibility: hidden;`                      |
| Overflow         | `overflow-{x|y}-{visible|hidden|scroll}`| `overflow-x-auto`                | `overflow-x: auto;`                        |

---

## ⚙️ **Custom Properties**
You can create and use custom properties with Tailwind as well. Here's how to use them:

```html
<div class="w-[calc(100%-2rem)] bg-[#1da1f2] hover:[transform:rotate(3deg)]">
```
**CSS:**
```css
div {
  width: calc(100% - 2rem); /* custom width */
  background-color: #1da1f2; /* custom background */
}

/* Hover effect */
div:hover {
  transform: rotate(3deg); /* custom rotate */
}
```

---

This expansion should help round out the essential Tailwind utilities with their corresponding CSS. Let me know if you’d like to dive deeper into any other area!

## 🌓 **Variants**

### 1. **Responsive**
```html
<button class="text-sm md:text-base lg:text-lg">
```
**CSS:**
```css
/* Default: */
font-size: 0.875rem; /* text-sm */

/* Medium screens and up (md): */
@media (min-width: 768px) {
  font-size: 1rem; /* text-base */
}

/* Large screens and up (lg): */
@media (min-width: 1024px) {
  font-size: 1.125rem; /* text-lg */
}
```

### 2. **State**
```html
<button class="bg-blue-500 hover:bg-blue-600 focus:ring-2 active:scale-95 disabled:opacity-50">
```
**CSS:**
```css
background-color: #3b82f6; /* bg-blue-500 */
  
/* Hover */
button:hover {
  background-color: #2563eb; /* hover:bg-blue-600 */
}

/* Focus */
button:focus {
  outline: 2px solid #3b82f6; /* focus:ring-2 */
}

/* Active */
button:active {
  transform: scale(0.95); /* active:scale-95 */
}

/* Disabled */
button:disabled {
  opacity: 0.5; /* disabled:opacity-50 */
}
```

### 3. **Dark Mode**
```html
<div class="bg-white dark:bg-slate-800">
```
**CSS:**
```css
/* Default */
background-color: #ffffff; /* bg-white */

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  background-color: #2d3748; /* dark:bg-slate-800 */
}
```

### 4. **Pseudo-elements**
```html
<p class="first:mt-0 last:mb-0 odd:bg-gray-100">
```
**CSS:**
```css
/* First-child */
p:first-child {
  margin-top: 0; /* first:mt-0 */
}

/* Last-child */
p:last-child {
  margin-bottom: 0; /* last:mb-0 */
}

/* Odd children */
p:nth-child(odd) {
  background-color: #f7fafc; /* odd:bg-gray-100 */
}
```

### 5. **Group States**
```html
<div class="group">
  <p class="group-hover:text-blue-500">
```
**CSS:**
```css
/* Group hover */
.group:hover .group-hover\:text-blue-500 {
  color: #3b82f6; /* group-hover:text-blue-500 */
}
```

### 6. **Media Queries**
```html
<div class="motion-reduce:transition-none">
```
**CSS:**
```css
@media (prefers-reduced-motion: reduce) {
  .motion-reduce\:transition-none {
    transition: none; /* motion-reduce:transition-none */
  }
}
```

### 7. **Print Styles**
```html
<div class="print:hidden">
```
**CSS:**
```css
@media print {
  .print\:hidden {
    display: none; /* print:hidden */
  }
}
```

---

## ⚡ **Custom Utilities**
```html
<div class="bg-[#1da1f2] w-[calc(100%-2rem)] hover:[transform:rotate(3deg)]">
```
**CSS:**
```css
/* Background color */
background-color: #1da1f2; /* bg-[#1da1f2] */

/* Width */
width: calc(100% - 2rem); /* w-[calc(100%-2rem)] */

/* Hover transform */
:hover {
  transform: rotate(3deg); /* hover:[transform:rotate(3deg)] */
}
```

---

## 📦 **Important Utilities**
| Category       | Key Utilities                     | Example |
|----------------|-----------------------------------|---------|
| Layout         | `container, aspect-video`         | `w-32 md:w-1/2` |
| Interaction    | `cursor-pointer, select-none`     | `cursor-pointer` |
| Visibility     | `invisible, sr-only`              | `sr-only` |
| SVG            | `fill-current, stroke-2`          | `fill-current` |
| Tables         | `border-collapse, table-fixed`    | `border-collapse` |
| Columns        | `columns-2, break-inside-avoid`   | `columns-2` |

---

## **Scale Reference**  
- `1` = 0.25rem (4px)  
- `4` = 1

rem (16px)  
- Full scale: 0, 0.5, 1-12 (increments of 1), 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96  

## **Color Palette**  
Slate, Gray, Zinc, Neutral, Stone, Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia, Pink, Rose (50-900 shades)  

[Tip] Use `@apply` in CSS for component extraction:
```css
.card {
  @apply p-6 bg-white rounded-lg shadow-md;
}
``` 

---
