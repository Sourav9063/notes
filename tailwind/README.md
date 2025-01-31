Here's a comprehensive comparison of Tailwind CSS classes with their equivalent CSS properties:

# Tailwind CSS ↔ Raw CSS Comparison Cheatsheet

## 📐 Layout & Structure

| Tailwind Class          | CSS Property                     | Example CSS Value                |
|-------------------------|----------------------------------|-----------------------------------|
| `flex`                  | `display`                        | `display: flex`                  |
| `hidden`                | `display`                        | `display: none`                  |
| `grid`                  | `display`                        | `display: grid`                  |
| `block`                 | `display`                        | `display: block`                 |
| `inline-block`          | `display`                        | `display: inline-block`          |
| `absolute`              | `position`                       | `position: absolute`             |
| `relative`              | `position`                       | `position: relative`             |
| `fixed`                 | `position`                       | `position: fixed`                |
| `sticky`                | `position`                       | `position: sticky`               |

## ↔️ Spacing

| Tailwind Class          | CSS Property                     | Example Value                    |
|-------------------------|----------------------------------|-----------------------------------|
| `m-4`                   | `margin`                         | `margin: 1rem`                   |
| `mx-auto`               | `margin-left/right`              | `margin-left: auto; margin-right: auto` |
| `p-6`                   | `padding`                        | `padding: 1.5rem`                |
| `space-x-4`             | Gap between elements             | `margin-right: 1rem` (on children) |
| `gap-4`                 | `gap`                            | `gap: 1rem`                      |

## 🖋 Typography

| Tailwind Class          | CSS Property                     | Example Value                    |
|-------------------------|----------------------------------|-----------------------------------|
| `text-center`           | `text-align`                     | `text-align: center`             |
| `font-bold`             | `font-weight`                    | `font-weight: 700`               |
| `text-lg`               | `font-size` + `line-height`      | `font-size: 1.125rem; line-height: 1.75rem` |
| `leading-relaxed`       | `line-height`                    | `line-height: 1.625`             |
| `uppercase`             | `text-transform`                 | `text-transform: uppercase`      |

## 🎨 Colors & Backgrounds

| Tailwind Class          | CSS Property                     | Example Value                    |
|-------------------------|----------------------------------|-----------------------------------|
| `bg-blue-500`           | `background-color`               | `background-color: #3b82f6`      |
| `text-white`            | `color`                          | `color: #ffffff`                 |
| `bg-opacity-50`         | `opacity` (background)           | `background-color: rgba(59, 130, 246, 0.5)` |
| `border-gray-200`       | `border-color`                   | `border-color: #e5e7eb`          |

## 📏 Sizing

| Tailwind Class          | CSS Property                     | Example Value                    |
|-------------------------|----------------------------------|-----------------------------------|
| `w-full`                | `width`                          | `width: 100%`                    |
| `h-screen`              | `height`                         | `height: 100vh`                  |
| `min-h-[200px]`         | `min-height`                     | `min-height: 200px`              |
| `max-w-7xl`             | `max-width`                      | `max-width: 80rem`               |

## 🌀 Flexbox & Grid

| Tailwind Class          | CSS Property                     | Example Value                    |
|-------------------------|----------------------------------|-----------------------------------|
| `flex-col`              | `flex-direction`                 | `flex-direction: column`         |
| `justify-between`       | `justify-content`                | `justify-content: space-between` |
| `items-center`          | `align-items`                    | `align-items: center`            |
| `grid-cols-3`           | `grid-template-columns`          | `grid-template-columns: repeat(3, minmax(0, 1fr))` |

## 🌓 Responsive Design

| Tailwind Class          | CSS Equivalent                   |
|-------------------------|----------------------------------|
| `md:text-center`        | `@media (min-width: 768px) { text-align: center }` |
| `lg:hover:bg-blue-500`  | `@media (min-width: 1024px) { &:hover { background-color: #3b82f6 } }` |

## 🎭 Pseudo-classes

| Tailwind Class          | CSS Equivalent                   |
|-------------------------|----------------------------------|
| `hover:bg-gray-100`     | `:hover { background-color: #f3f4f6 }` |
| `focus:ring-2`          | `:focus { box-shadow: 0 0 0 2px ... }` |
| `active:scale-95`       | `:active { transform: scale(0.95) }` |

## 🛠 Advanced Features

| Tailwind Class          | CSS Equivalent                   |
|-------------------------|----------------------------------|
| `transition-all`        | `transition-property: all`       |
| `duration-300`          | `transition-duration: 300ms`     |
| `animate-spin`          | `animation: spin 1s linear infinite` |
| `dark:bg-slate-800`     | `@media (prefers-color-scheme: dark) { background-color: #1e293b }` |
| `bg-[#1da1f2]`          | `background-color: #1da1f2`      |

## Key Differences to Remember:
1. **Naming Convention**: Tailwind uses utility-first naming (e.g., `p-4` = padding 1rem)
2. **Scale System**: Tailwind uses a 4-based scale (1 unit = 0.25rem)
   - `m-1` = 0.25rem (4px)
   - `m-4` = 1rem (16px)
3. **Responsive Design**: Tailwind uses mobile-first breakpoints
4. **Custom Values**: Use square brackets for arbitrary values (`w-[200px]`)
5. **CSS Variables**: Tailwind 3+ supports CSS variables: `bg-[var(--primary)]`

## Example Conversion:
```html
<!-- Tailwind -->
<div class="flex flex-col md:flex-row p-4 space-y-4 md:space-y-0 md:space-x-4 bg-gray-100 rounded-lg shadow-md transition-all hover:shadow-lg">
  
<!-- Equivalent CSS -->
<style>
.container {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.container:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .container {
    flex-direction: row;
    gap: 1rem;
  }
}
</style>
```

> **Tip**: Use Tailwind's `@apply` directive to create component classes from utilities:
> ```css
> .btn-primary {
>   @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600;
> }
> ```
