# How To Enable Vertical Drag Scroll

## `src/helper/hooks/useDragScroll.js`

Replace current hook with this axis-aware version. Default stays horizontal, so existing `useDragScroll()` calls keep working.

```js
import { useEffect, useRef } from "react";

export function useDragScroll({ axis = "x" } = {}) {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const isVertical = axis === "y";
    const activeClassName = isVertical
      ? "dragScrollYActive"
      : "dragScrollXActive";
    const dragMultiplier = 1.15;
    const minDragDistance = 4;
    const momentumFriction = 0.96;
    const minMomentumVelocity = 0.02;

    let isDragging = false;
    let startPointer = 0;
    let startCrossPointer = 0;
    let startScrollPosition = 0;
    let targetScrollPosition = 0;
    let lastPointer = 0;
    let lastMoveTime = 0;
    let velocity = 0;
    let animationFrame = null;
    let momentumFrame = null;
    let didDrag = false;
    let isPrimaryTouchDrag = false;
    let shouldSuppressNextClick = false;
    let clickSuppressTimeout = null;

    const getPointerPosition = (eventOrTouch) =>
      isVertical ? eventOrTouch.clientY : eventOrTouch.clientX;

    const getCrossPointerPosition = (eventOrTouch) =>
      isVertical ? eventOrTouch.clientX : eventOrTouch.clientY;

    const getScrollPosition = () =>
      isVertical ? el.scrollTop : el.scrollLeft;

    const setScrollPositionNow = (nextScrollPosition) => {
      if (isVertical) {
        el.scrollTop = nextScrollPosition;
      } else {
        el.scrollLeft = nextScrollPosition;
      }
    };

    const cancelAnimation = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const cancelMomentum = () => {
      if (momentumFrame) {
        cancelAnimationFrame(momentumFrame);
        momentumFrame = null;
      }
    };

    const setScrollPosition = (nextScrollPosition) => {
      targetScrollPosition = nextScrollPosition;
      if (animationFrame) return;

      animationFrame = requestAnimationFrame(() => {
        setScrollPositionNow(targetScrollPosition);
        animationFrame = null;
      });
    };

    const startDrag = (eventOrTouch) => {
      const pointer = getPointerPosition(eventOrTouch);
      const crossPointer = getCrossPointerPosition(eventOrTouch);

      cancelMomentum();
      cancelAnimation();
      isDragging = true;
      startPointer = pointer;
      startCrossPointer = crossPointer;
      startScrollPosition = getScrollPosition();
      targetScrollPosition = getScrollPosition();
      lastPointer = pointer;
      lastMoveTime = performance.now();
      velocity = 0;
      didDrag = false;
      isPrimaryTouchDrag = false;
      el.classList.add(activeClassName);
    };

    const moveDrag = (eventOrTouch) => {
      const pointer = getPointerPosition(eventOrTouch);
      const now = performance.now();
      const deltaPointer = pointer - startPointer;
      const elapsed = now - lastMoveTime;

      if (elapsed > 0) {
        velocity = ((lastPointer - pointer) * dragMultiplier) / elapsed;
      }

      lastPointer = pointer;
      lastMoveTime = now;
      setScrollPosition(startScrollPosition - deltaPointer * dragMultiplier);
    };

    const runMomentum = () => {
      if (Math.abs(velocity) < minMomentumVelocity) {
        momentumFrame = null;
        return;
      }

      setScrollPositionNow(getScrollPosition() + velocity * 16);
      velocity *= momentumFriction;
      momentumFrame = requestAnimationFrame(runMomentum);
    };

    const resetClickSuppressor = () => {
      shouldSuppressNextClick = false;
      if (clickSuppressTimeout) {
        clearTimeout(clickSuppressTimeout);
        clickSuppressTimeout = null;
      }
    };

    const suppressNextRowClick = () => {
      resetClickSuppressor();
      shouldSuppressNextClick = true;
      clickSuppressTimeout = setTimeout(resetClickSuppressor, 250);
    };

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;

      startDrag(event);
    };

    const handleMouseMove = (event) => {
      if (!isDragging) return;

      const deltaPointer = getPointerPosition(event) - startPointer;
      if (Math.abs(deltaPointer) > minDragDistance) {
        didDrag = true;
        event.preventDefault();
      }
      moveDrag(event);
    };

    const handleTouchStart = (event) => {
      if (event.touches.length !== 1) return;

      startDrag(event.touches[0]);
    };

    const handleTouchMove = (event) => {
      if (!isDragging || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const deltaPointer = getPointerPosition(touch) - startPointer;
      const deltaCrossPointer =
        getCrossPointerPosition(touch) - startCrossPointer;

      if (
        !isPrimaryTouchDrag &&
        Math.abs(deltaCrossPointer) > Math.abs(deltaPointer)
      ) {
        return;
      }

      if (Math.abs(deltaPointer) > minDragDistance) {
        didDrag = true;
        isPrimaryTouchDrag = true;
        event.preventDefault();
      }

      if (isPrimaryTouchDrag) {
        moveDrag(touch);
      }
    };

    const stopDragging = () => {
      if (!isDragging) return;

      isDragging = false;
      el.classList.remove(activeClassName);

      if (didDrag) {
        suppressNextRowClick();
        runMomentum();
      }
    };

    const handleClick = (event) => {
      if (!shouldSuppressNextClick) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      didDrag = false;
      resetClickSuppressor();
    };

    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", stopDragging);
    window.addEventListener("touchcancel", stopDragging);
    el.addEventListener("click", handleClick, true);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDragging);
      window.removeEventListener("touchcancel", stopDragging);
      el.removeEventListener("click", handleClick, true);
      cancelAnimation();
      cancelMomentum();
      resetClickSuppressor();
    };
  }, [axis]);

  return elRef;
}
```

## `src/app/globals.css`

Keep current horizontal classes and add vertical classes beside them.

```css
.dragScrollX {
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
}

.dragScrollXActive {
  cursor: grabbing;
}

.dragScrollY {
  cursor: grab;
  touch-action: pan-x;
  user-select: none;
}

.dragScrollYActive {
  cursor: grabbing;
}
```

## How To Use Horizontal

Current usage does not need change.

```jsx
import { useDragScroll } from "@/helper/hooks/useDragScroll";

export default function HorizontalList({ items }) {
  const ref = useDragScroll();

  return (
    <div className="hoverScrollbarX dragScrollX" ref={ref}>
      {items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}
```

Horizontal container CSS must allow horizontal overflow.

```css
.cards {
  display: flex;
  overflow-x: auto;
}
```

## How To Use Vertical

Use `axis: "y"` and `dragScrollY`.

```jsx
import { useDragScroll } from "@/helper/hooks/useDragScroll";

export default function VerticalList({ items }) {
  const ref = useDragScroll({ axis: "y" });

  return (
    <div className="dragScrollY" ref={ref}>
      {items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}
```

Vertical container CSS must allow vertical overflow.

```css
.list {
  max-height: 480px;
  overflow-y: auto;
}
```

## Notes

- `useDragScroll()` means horizontal.
- `useDragScroll({ axis: "x" })` means horizontal.
- `useDragScroll({ axis: "y" })` means vertical.
- `dragScrollX` uses `touch-action: pan-y` so page vertical touch scroll still works.
- `dragScrollY` uses `touch-action: pan-x` so horizontal touch gestures still work.
- Click suppression stays same for both axes.
- Native wheel already scrolls vertical containers; `useHorizontalScroll.js` is not needed for vertical drag scroll.
