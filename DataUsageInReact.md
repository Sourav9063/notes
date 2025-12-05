# Using Data Attributes for State Styling in React

This guide explains the pattern of using HTML `data-*` attributes to manage UI states in React, a technique heavily used by libraries like Radix UI and Shadcn UI to handle animations and state-based styling.

## What is the Concept?

Instead of conditionally adding class names in JavaScript (e.g., `className={isOpen ? 'active' : ''}`), you apply a **data attribute** to the element representing its state.

**The Pattern:**
1.  **React (JS):** Sets a specific attribute (e.g., `data-state="open"`).
2.  **CSS/Tailwind:** "Listens" for that attribute to apply styles.

## 1. The "Old" Way vs. The Data Attribute Way

### The Class Name Approach (Standard)
You constantly manipulate strings in JavaScript.

```tsx
// React
<div className={`menu ${isOpen ? 'is-open' : 'is-closed'}`}>
  Content
</div>

// CSS
.menu.is-open { opacity: 1; }
.menu.is-closed { opacity: 0; }
```

### The Data Attribute Approach (Cleaner)
You simply output the state. CSS handles the logic.

```tsx
// React
<div className="menu" data-state={isOpen ? 'open' : 'closed'}>
  Content
</div>

// CSS
.menu[data-state='open'] { opacity: 1; }
.menu[data-state='closed'] { opacity: 0; }
```

---

## 2. How to Implement in React with Tailwind CSS

This is the specific syntax you saw in the codebase (`data-[state=open]:...`).

### Step 1: Set the Attribute in Component
Pass the boolean state as a string value to a custom `data-` attribute.

```tsx
import { useState } from 'react';

export function AccordionItem() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      // Define your custom attribute
      data-state={isOpen ? 'open' : 'closed'} 
      className="p-4 border rounded"
    >
      <button onClick={() => setIsOpen(!isOpen)}>
        Toggle
      </button>
      
      <div className="content mt-2">
        Hidden Content
      </div>
    </div>
  );
}
```

### Step 2: Style using Tailwind Modifiers

Use the square bracket syntax `data-[attribute=value]:class`.

```tsx
<div 
  data-state={isOpen ? 'open' : 'closed'}
  className="
    transition-all duration-200
    
    /* Default (Closed) Styles */
    opacity-50 bg-gray-100
    
    /* Open Styles */
    data-[state=open]:opacity-100
    data-[state=open]:bg-blue-50
    data-[state=open]:shadow-lg
  "
>
  {/* ... */}
</div>
```

---

## 3. Advanced: Targeting Children (Groups)

Sometimes you want the *parent's* state to affect a *child* element (e.g., rotating an arrow icon when an accordion opens).

**Parent:** Add the `group` class and the data attribute.
**Child:** Use `group-data-[...]`.

```tsx
<button 
  onClick={toggle} 
  data-state={isOpen ? 'open' : 'closed'} 
  className="group flex items-center gap-2" // Added 'group' here
>
  <span>Click me</span>
  
  {/* Child Icon */}
  <span className="
    transition-transform 
    group-data-[state=open]:rotate-180 
    group-data-[state=closed]:rotate-0
  ">
    ⬇️
  </span>
</button>
```

## 4. Why Use This Pattern?

1.  **Separation of Concerns:** JavaScript handles *logic* (what is the state?), CSS handles *visuals* (what does that state look like?).
2.  **Animation Libraries:** Tools like `framer-motion` or `tailwindcss-animate` allow you to define entrance/exit animations easily based on these attributes.
3.  **Debugging:** When inspecting the DOM in browser tools, you can clearly see `<div data-state="open">` which is often more readable than a soup of utility classes.
4.  **Accessibility:** While `data-*` attributes are for internal logic, they often mirror ARIA attributes (like `aria-expanded`), keeping your mental model of the component consistent.
