---
name: Noosphere Reflect
colors:
  surface: '#1a0a00'
  surface-dim: '#1a0a00'
  surface-bright: '#451a03'
  surface-container-lowest: '#120700'
  surface-container-low: '#220e00'
  surface-container: '#2d1500'
  surface-container-high: '#3d1c02'
  surface-container-highest: '#451a03'
  on-surface: '#fff5eb'
  on-surface-variant: '#fed7aa'
  inverse-surface: '#fff5eb'
  inverse-on-surface: '#2d1500'
  outline: '#7c2d12'
  outline-variant: '#451a03'
  surface-tint: '#f97316'
  primary: '#f97316'
  on-primary: '#1a0a00'
  primary-container: '#ea580c'
  on-primary-container: '#fff5eb'
  inverse-primary: '#c2410c'
  secondary: '#10b981'
  on-secondary: '#022c22'
  secondary-container: '#059669'
  on-secondary-container: '#ecfdf5'
  tertiary: '#a855f7'
  on-tertiary: '#3b0764'
  tertiary-container: '#7e22ce'
  on-tertiary-container: '#faf5ff'
  error: '#ef4444'
  on-error: '#450a0a'
  error-container: '#991b1b'
  on-error-container: '#fee2e2'
  primary-fixed: '#ffedd5'
  primary-fixed-dim: '#f97316'
  on-primary-fixed: '#451a03'
  on-primary-fixed-variant: '#7c2d12'
  secondary-fixed: '#d1fae5'
  secondary-fixed-dim: '#10b981'
  on-secondary-fixed: '#064e3b'
  on-secondary-fixed-variant: '#047857'
  tertiary-fixed: '#f3e8ff'
  tertiary-fixed-dim: '#a855f7'
  on-tertiary-fixed: '#581c87'
  on-tertiary-fixed-variant: '#6b21a8'
  background: '#1a0a00'
  on-background: '#fff5eb'
  surface-variant: '#451a03'
typography:
  display-lg:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '2.0'
  body-md:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.75'
  label-md:
    fontFamily: Fira Code, Consolas, monospace
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is centered around the concept of a **"Neural Console & Digital Sanctuary"**—a high-security, locally sovereign archive for multi-platform AI conversations, memories, prompts, skills, and workflows. The visual narrative balances the crisp utility of a developer console with the organic warmth of human reflection under the core tagline: *"Preserve Meaning Through Memory"*.

The style is defined as **Warm Dark Amber Minimalism with Glassmorphic Purple Waterfalls & Emerald Accents**. It utilizes deep coffee-obsidian layering to create a focused reading space, while high-contrast typography ensures that captured chats remain the central asset. The interface conveys data sovereignty, local persistence, and technological clarity.

## Colors

The color palette for this design system is rooted in "Deep Burnt Coffee & Amber" depths (`#1a0a00`). The dark background eliminates eye strain during extended chat review while providing a richer tone than generic charcoal or black.

*   **Primary (Luminescent Amber/Orange - `#f97316`):** Used for primary CTAs, active tab highlights, and parser action controls. It conveys energy and operational clarity.
*   **Secondary (Emerald Sovereignty - `#10b981`):** Applied to scrollbars, text selections, success badges, and indicators for 100% local IndexedDB storage. It represents data sovereignty and security.
*   **Tertiary (Purple Waterfall - `#a855f7`):** Dedicated to model reasoning blocks (`ChatMessageType.Thought`), collapsible system logic, and AI process streams.
*   **Neutral Palette:** Deep warm brown-black tones (`#2d1500`, `#451a03`) manage surface hierarchy and subtle borders (`#7c2d12`).

## Typography

This design system utilizes standard system sans fonts (`Inter`, `system-ui`) for clean, highly legible UI navigation and long-form reader modes (`.reader-prose` at `1.05rem` with a `2.0` line height).

To emphasize the archival and technical nature of the application, **Fira Code** and **Consolas** are introduced for code snippets, JSON manifests, tags, and timestamps (`label-md`). Headlines feature tight negative letter-spacing for crisp visual impact.

## Layout & Spacing

The layout philosophy follows a **Modular Grid & Bridge Pipeline Architecture**. By utilizing a base 4px unit, spacing rhythm remains consistent across all archive views.

*   **Grid:** A fluid 12-column grid on desktop (max-width 1440px) that collapses smoothly to a 4-column layout on mobile devices.
*   **Gutters:** Fixed at 24px matching card radiuses to maintain clean visual pockets.
*   **Rhythm:** Vertical spacing between major section blocks is kept spacious (40px+) to prevent the archive lattice from feeling dense.

## Elevation & Depth

Hierarchy in the design system is conveyed through **Tonal Surface Elevation** and **Backdrop Blurs**.

1.  **Level 0 (Base Canvas):** Deep burnt coffee `#1a0a00`.
2.  **Level 1 (Cards & Containers):** `#2d1500` with a 1px border (`#7c2d12`).
3.  **Level 2 (Modals & Purple Waterfall Blocks):** `#451a03` elevated container or `bg-purple-500/5` with `backdrop-blur-md` and a soft purple glow (`shadow-purple-500/10`).

## Shapes

The shape language is defined by **Tactile Pill Controls & Rounded Containers**. Corner radiuses for primary archive containers range between 12px and 24px (`rounded-2xl`).

Interactive controls, tags, and status badges utilize fully pill-shaped geometry (`rounded-full`) to contrast against the structural grid of the archive cards. Buttons feature micro-scaling (`scale-[1.005]` or `scale-105`) and glow transitions.

## Components

### Buttons
Primary buttons use a solid Orange fill (`#f97316`) with dark coffee text (`#1a0a00`). Secondary controls feature a ghost outline style with subtle hover borders (`#7c2d12` $\to$ `#f97316`).

### Cards
Cards are the primary unit of the archive lattice. They feature:
*   `16px` to `24px` corner radiuses (`rounded-2xl`).
*   Subtle 1px border (`#7c2d12`).
*   Internal padding of 24px (`p-6`).
*   Header area for metadata using `Fira Code` / `Consolas` (`label-md`).

### Chips & Tags
Tags for categories (#AI-Chat, #Claude, #Memory, #Workflow) use `rounded-full` pill styling with a recessed surface color. Upon hover or selection, they glow with orange or emerald accents.

### Input Fields
Search and parser input fields use recessed dark surfaces (`#2d1500`) with a 1px amber outline (`#7c2d12`) that illuminates on focus.

### Purple Waterfall Thought Blocks
Collapsible model reasoning blocks (`.markdown-thought-block`) feature:
*   Border: `border border-purple-500/30`.
*   Summary header gradient: `from-purple-700/40 via-purple-900/40 to-transparent`.
*   Smooth slide-down animation (`slideDown 0.4s ease-out`).

### Dracula Code Blocks
Syntax-highlighted code blocks (`.hljs`) use the Dracula palette (`#282a36` background) with purple, pink, green, and cyan token highlighting.
