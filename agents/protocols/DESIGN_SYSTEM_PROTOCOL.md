# DESIGN_SYSTEM_PROTOCOL.md

## 🎨 Noosphere Nexus Design System

**Philosophy**: "Preserving Meaning Through Memory."
**Visual Style**: Premium Glassmorphism, Deep Space Aesthetics, Biological/Neural Motifs.
**Core Palette**: Dark Mode Base + Green/Emerald (Life/Memory) + Purple (Intelligence/Noosphere).

---

## 1. Core Theme Tokens (Tailwind CSS)

### Backgrounds
*   **App Background**: `bg-gray-900`
*   **Panel/Card**: `bg-gray-800/50 backdrop-blur-md` or `bg-gray-800/30`
*   **Overlay**: `bg-black/50 backdrop-blur-sm` (Modals)

### Gradients
*   **Primary Brand**: `bg-gradient-to-r from-green-400 via-purple-400 to-emerald-500`
*   **Subtle Accent**: `bg-gradient-to-r from-green-900/20 via-emerald-900/20 to-green-900/20`

### Typography
*   **Font**: Sans-serif (`font-sans`).
*   **Headings**: `text-gray-100 font-bold`.
*   **Body**: `text-gray-300` or `text-gray-400` (secondary).
*   **Selection**: `selection:bg-green-500/30`.

---

## 2. Component Standards

### Buttons
**Primary Action** (Save, Export, Submit):
```tsx
<button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-green-500/20">
```

**Secondary Action** (Cancel, Close):
```tsx
<button className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors">
```

**Ghost/Icon Button**:
```tsx
<button className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
```

**Danger Action** (Delete):
```tsx
<button className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-1 rounded-lg transition-colors">
```

### Cards (Glassmorphism)
Used for Sessions, Memories, and Features.
```tsx
<div className="bg-gray-800/50 border border-white/5 rounded-3xl p-5 hover:border-green-500/30 hover:shadow-lg transition-all duration-300">
```

### Inputs
```tsx
<input className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all" />
```

---

## 3. Platform Identity System

Use these tokens for **Badges** and **Card Highlights** to distinguish AI sources.

| Platform | Color Theme | Tailwind Classes (Badge/Card) |
| :--- | :--- | :--- |
| **Claude** | 🟠 Orange | `bg-orange-900/40 text-orange-200 border-orange-700/50` |
| **ChatGPT** | 🟢 Emerald | `bg-emerald-900/40 text-emerald-200 border-emerald-700/50` |
| **Gemini** | 🔵 Blue | `bg-blue-900/40 text-blue-200 border-blue-700/50` |
| **LeChat** | 🟡 Amber | `bg-amber-900/40 text-amber-200 border-amber-700/50` |
| **Grok** | ⚫ Black | `bg-black text-white border-gray-700` |
| **Llamacoder** | ⚪ White | `bg-white text-black border-gray-200` |

### Helper Function Pattern
```typescript
const getModelBadgeColor = (model: string) => {
  if (model.includes('claude')) return 'bg-orange...';
  if (model.includes('gpt')) return 'bg-emerald...';
  // ...
};
```

---

## 4. Layout & Spacing

*   **Max Width**: `max-w-7xl mx-auto px-4` (Standard Page Container).
*   **Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` (Card Layouts).
*   **Section Spacing**: `py-8` or `my-8`.

## 5. Animation (Transition)

*   **Hover Effects**: `transition-all duration-300 hover:-translate-y-1`.
*   **Modals**: `backdrop-blur-sm animate-in fade-in zoom-in-95`.

## 6. Accessibility (A11y)

*   **Contrast**: Ensure text is `gray-400` or lighter on dark backgrounds.
*   **Focus States**: All interactive elements must have visible focus rings (`focus:ring-2`).
*   **Semantic HTML**: Use `<header>`, `<main>`, `<button>`, `<article>` tags appropriately.
