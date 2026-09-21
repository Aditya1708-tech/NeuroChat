# NeuroChat — UI/UX Design System & Accessibility

> **Source**: Specification §14, §28, §29

---

## 1. Design Principles

1. **Light-First Default**: The primary theme is bright, calm, and legible (`data-theme="light"`). Dark mode is supported as an optional contrast alternative.
2. **Glow is Seasoning, Not the Meal**: Subtle glows appear only on focus states, primary CTAs, active items, and avatars. Text never sits directly on glow halos.
3. **Calm Density**: Generous spacing (4px base scale) and a focused color palette (Indigo primary, Violet secondary, Soft Lavender tint).
4. **Legibility**: Body text minimum 16px with 1.6 line height. Devanagari font fallbacks (`Noto Sans Devanagari`) loaded for natural Hindi rendering.

---

## 2. Core Tokens Summary

```css
:root {
  --color-indigo-500: #6366f1;
  --color-indigo-600: #4f46e5;
  --color-violet-500: #8b5cf6;
  --color-lavender-100: #ede9fe;
  --bg-page: #f8fafc;
  --surface: #ffffff;
  --surface-glass: rgba(255, 255, 255, 0.78);
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --touch-min: 44px;
}
```

---

## 3. Responsive Breakpoints

| Name | Viewport Width | Layout Behavior |
|---|---|---|
| **Mobile** | `< 640px` | Single column; sidebar collapses to off-canvas drawer; touch-friendly 44px+ buttons |
| **Tablet** | `640px – 1023px` | Single column with wider margins; drawer sidebar; two-column landing grids |
| **Laptop** | `1024px – 1439px`| Persistent 280px sidebar; centered 760px chat column |
| **Desktop**| `≥ 1440px` | Same structure with generous breathing room and capped max-width line lengths |

---

## 4. Accessibility & Standards (WCAG 2.1 AA)

- **Touch Targets**: All buttons, inputs, and interactive icons adhere to >= 44x44px touch targets.
- **Focus Rings**: Dual-layer visible outline (`var(--focus-ring)`).
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce` by setting animation durations to 0ms.
- **Color Contrast**: Normal text satisfies >= 4.5:1 contrast against surface backgrounds.
- **Screen Reader Support**: ARIA live regions announce typing statuses and error alerts.
