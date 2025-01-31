# Tailwind CSS Ultimate Utilities & Variants Cheatsheet

---

## 📐 **Layout**
| Category       | Utilities                          | Example Classes                  |
|----------------|------------------------------------|-----------------------------------|
| Display        | `block, inline, flex, grid, hidden`| `hidden md:flex`                 |
| Positioning    | `static, fixed, absolute, relative`| `absolute top-4 right-0`         |
| Flexbox        | `flex-row, flex-col, justify-*, items-*` | `justify-between items-center` |
| Grid           | `grid-cols-*, grid-rows-*, gap-*` | `grid-cols-3 gap-4`             |
| Z-Index        | `z-0` to `z-50`                   | `z-10`                          |
| Overflow       | `overflow-auto, overflow-hidden`  | `overflow-x-scroll`              |

---

## ↔️ **Spacing**
| Type          | Utilities                          | Example                   |
|---------------|------------------------------------|---------------------------|
| Margin        | `m-* -mx-* mt-*` (0-96, auto)     | `mt-4 mx-auto`            |
| Padding       | `p-* px-* pt-*` (0-96)            | `px-6 py-3`               |
| Space Between | `space-x-*, space-y-*` (0-96)     | `space-y-4`               |

---

## 🖋 **Typography**
| Property       | Utilities                          | Example                     |
|----------------|------------------------------------|-----------------------------|
| Font Size      | `text-xs` to `text-9xl`           | `text-lg`                   |
| Font Weight    | `font-thin` to `font-black`        | `font-bold`                 |
| Text Align     | `text-left, text-center, text-right` | `md:text-center`          |
| Text Color     | `text-{color}-{shade}`             | `text-slate-700 dark:text-white` |
| Line Height    | `leading-*` (3-10, none, tight)    | `leading-relaxed`           |

---

## 🎨 **Colors & Backgrounds**
| Category       | Utilities                          | Example                     |
|----------------|------------------------------------|-----------------------------|
| BG Color       | `bg-{color}-{shade}`               | `bg-blue-600/50` (opacity)  |
| Gradient       | `bg-gradient-{direction}`          | `bg-gradient-to-r from-cyan-500` |
| Border Color   | `border-{color}-{shade}`           | `border-emerald-400`        |

---

## 📏 **Sizing**
| Property       | Utilities                          | Example                     |
|----------------|------------------------------------|-----------------------------|
| Width          | `w-*` (0-96, auto, screen, full)  | `w-32 md:w-1/2`            |
| Height         | `h-*` (0-96, screen, full)        | `h-screen`                 |
| Min/Max        | `min-w-*, max-w-*`                | `max-w-7xl`                |

---

## 🌀 **Effects**
| Category       | Utilities                          | Example                     |
|----------------|------------------------------------|-----------------------------|
| Shadow         | `shadow-{size}`                   | `shadow-xl hover:shadow-2xl`|
| Opacity        | `opacity-*` (0-100)               | `opacity-75`               |
| Blend Mode     | `mix-blend-*`                     | `mix-blend-multiply`       |

---

## 🎭 **Transitions & Animation**
| Category       | Utilities                          | Example                     |
|----------------|------------------------------------|-----------------------------|
| Transition     | `transition-{property} duration-*` | `transition-colors duration-300` |
| Animation      | `animate-{type}`                  | `animate-spin`              |
| Transform      | `rotate-*, scale-*, translate-*`  | `hover:scale-105`           |

---

## 🛠 **Borders**
| Property       | Utilities                          | Example                     |
|----------------|------------------------------------|-----------------------------|
| Border Width   | `border-*` (0-8)                  | `border-2`                 |
| Border Radius  | `rounded-{size}`                  | `rounded-full`             |
| Border Style   | `border-dashed, border-dotted`    | `border-dotted`            |

---

## 🌓 **Variants**
### 1. **Responsive**
```html
<button class="text-sm md:text-base lg:text-lg">
```

### 2. **State**
```html
<button class="bg-blue-500 hover:bg-blue-600 focus:ring-2 active:scale-95 disabled:opacity-50">
```

### 3. **Dark Mode**
```html
<div class="bg-white dark:bg-slate-800">
```

### 4. **Pseudo-elements**
```html
<p class="first:mt-0 last:mb-0 odd:bg-gray-100">
```

### 5. **Group States**
```html
<div class="group">
  <p class="group-hover:text-blue-500">
```

### 6. **Media Queries**
```html
<div class="motion-reduce:transition-none">
```

### 7. **Print Styles**
```html
<div class="print:hidden">
```

---

## ⚡ **Custom Utilities**
```html
<div class="bg-[#1da1f2] w-[calc(100%-2rem)] hover:[transform:rotate(3deg)]">
```

---

## 📦 **Important Utilities**
| Category       | Key Utilities                     |
|----------------|-----------------------------------|
| Layout         | `container, aspect-video`         |
| Interaction    | `cursor-pointer, select-none`     |
| Visibility     | `invisible, sr-only`              |
| SVG            | `fill-current, stroke-2`          |
| Tables         | `border-collapse, table-fixed`    |
| Columns        | `columns-2, break-inside-avoid`   |

---

**Scale Reference**:  
- `1` = 0.25rem (4px)  
- `4` = 1rem (16px)  
- Full scale: 0, 0.5, 1-12 (increments of 1), 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96  

**Color Palette**:  
Slate, Gray, Zinc, Neutral, Stone, Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia, Pink, Rose (50-900 shades)  

[Tip] Use `@apply` in CSS for component extraction:
```css
.card {
  @apply p-6 bg-white rounded-lg shadow-md;
}
```
