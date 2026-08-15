---
version: 1.0.0
name: Microsoft-Copilot-design-analysis
description: Microsoft Copilot features a dual-theme design system rooted in Microsoft's Fluent 2 design language. The system alternates between a warm, editorial cream/parchment light theme and a deep midnight-slate dark theme. Both themes center around a floating, highly rounded conversational input container, complemented by modular bento cards for proactive discovery, pill-based navigation tabs, soft ambient shadows, and a persistent left rail sidebar. Segoe UI Variable ensures crisp typographic hierarchy across both modes.

colors:
  # Light Theme (Warm Alabaster / Cream)
  light-canvas: "#f8f5ee"
  light-canvas-subtle: "#f3efe6"
  light-surface-sidebar: "#f5f1e8"
  light-surface-card: "#ffffff"
  light-surface-card-elevated: "#ffffff"
  light-surface-card-warm: "#f5eee2"
  light-surface-input: "#ffffff"
  light-surface-pill: "#eee8dc"
  light-surface-pill-active: "#1e1e1e"
  light-surface-user-bubble: "#ede7da"
  light-surface-button-dark: "#1c1d1f"
  
  # Dark Theme (Midnight Slate)
  dark-canvas: "#0b0f19"
  dark-canvas-subtle: "#0e1320"
  dark-surface-sidebar: "#0d121c"
  dark-surface-card: "#151c2b"
  dark-surface-card-elevated: "#1a2336"
  dark-surface-input: "#161d2d"
  dark-surface-pill: "#1c2537"
  dark-surface-pill-active: "#25334d"
  dark-surface-user-bubble: "#1e283d"
  dark-surface-button-dark: "#25334d"

  # Shared Brand Accents & Semantic
  accent-blue: "#3b82f6"
  accent-blue-deep: "#1d4ed8"
  accent-blue-subtle: "rgba(59, 130, 246, 0.15)"
  accent-sparkle: "#f59e0b"
  accent-sky: "#9cbef5"

  # Light Theme Text & Borders
  light-text-primary: "#1c1c1e"
  light-text-secondary: "#4a4c52"
  light-text-muted: "#71747d"
  light-text-dim: "#9aa0a6"
  light-on-accent: "#ffffff"
  light-border-hairline: "rgba(0, 0, 0, 0.05)"
  light-border-subtle: "rgba(0, 0, 0, 0.08)"
  light-border-strong: "rgba(0, 0, 0, 0.14)"

  # Dark Theme Text & Borders
  dark-text-primary: "#f8fafc"
  dark-text-secondary: "#94a3b8"
  dark-text-muted: "#64748b"
  dark-text-dim: "#475569"
  dark-on-accent: "#ffffff"
  dark-border-hairline: "rgba(255, 255, 255, 0.06)"
  dark-border-subtle: "rgba(255, 255, 255, 0.10)"
  dark-border-strong: "rgba(255, 255, 255, 0.16)"

  # Badges & Status
  status-preview-bg-light: "rgba(0, 0, 0, 0.06)"
  status-preview-text-light: "#475569"
  status-preview-bg-dark: "rgba(255, 255, 255, 0.12)"
  status-preview-text-dark: "#e2e8f0"

typography:
  hero-greeting:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 26px
    fontWeight: 600
    lineHeight: 1.30
    letterSpacing: -0.2px
  section-title:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.35
  heading-card:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.40
  stat-large:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.10
  body-lg:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
  body-md-medium:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.50
  body-sm:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  body-sm-medium:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.45
  caption:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.40
  caption-medium:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.40
  badge-micro:
    fontFamily: "Segoe UI Variable, Segoe UI, -apple-system, sans-serif"
    fontSize: 10px
    fontWeight: 700
    lineHeight: 1.20
    letterSpacing: 0.5px

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 40px
  section: 48px
  hero: 80px

components:
  # Navigation & App Shell
  sidebar-container:
    backgroundColor: "{colors.light-surface-sidebar}"
    borderRight: "1px solid {colors.light-border-hairline}"
    padding: "{spacing.md}"
    width: "260px"
  sidebar-nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.light-text-secondary}"
    typography: "{typography.body-md-medium}"
    rounded: "{rounded.md}"
    padding: "{spacing.xs} {spacing.sm}"
  sidebar-nav-item-active:
    backgroundColor: "{colors.light-surface-pill}"
    textColor: "{colors.light-text-primary}"
    typography: "{typography.body-md-medium}"
    rounded: "{rounded.md}"
    padding: "{spacing.xs} {spacing.sm}"

  # Conversational Input Bar
  chat-input-container-light:
    backgroundColor: "{colors.light-surface-input}"
    border: "1px solid {colors.light-border-subtle}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.sm} {spacing.md}"
    shadow: "0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)"
  chat-input-container-dark:
    backgroundColor: "{colors.dark-surface-input}"
    border: "1px solid {colors.dark-border-subtle}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.sm} {spacing.md}"
    shadow: "0 8px 32px rgba(0, 0, 0, 0.35)"
  chat-input-textarea:
    backgroundColor: "transparent"
    textColor: "{colors.light-text-primary}"
    typography: "{typography.body-md}"
    padding: "{spacing.xs} 0"
  model-selector-pill:
    backgroundColor: "{colors.light-surface-pill}"
    textColor: "{colors.light-text-primary}"
    typography: "{typography.caption-medium}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
    border: "1px solid {colors.light-border-subtle}"
  icon-button-subtle:
    backgroundColor: "{colors.light-surface-pill}"
    textColor: "{colors.light-text-secondary}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"

  # Buttons & Pills
  button-primary-dark:
    backgroundColor: "{colors.light-surface-button-dark}"
    textColor: "{colors.light-on-accent}"
    typography: "{typography.body-sm-medium}"
    rounded: "{rounded.full}"
    padding: "8px 18px"
  button-secondary-pill:
    backgroundColor: "{colors.light-surface-card}"
    textColor: "{colors.light-text-primary}"
    typography: "{typography.body-sm-medium}"
    rounded: "{rounded.full}"
    padding: "8px 18px"
    border: "1px solid {colors.light-border-subtle}"
  button-sparkle:
    backgroundColor: "transparent"
    textColor: "{colors.light-text-primary}"
    typography: "{typography.body-sm-medium}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
    border: "1px solid {colors.light-border-subtle}"

  # Cards & Bento Layouts
  bento-card-light:
    backgroundColor: "{colors.light-surface-card}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.xl}"
    border: "1px solid {colors.light-border-hairline}"
    shadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
  bento-card-dark:
    backgroundColor: "{colors.dark-surface-card}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.xl}"
    border: "1px solid {colors.dark-border-hairline}"
    shadow: "0 4px 12px rgba(0, 0, 0, 0.20)"
  weather-card-light:
    backgroundColor: "{colors.accent-sky}"
    textColor: "{colors.light-text-primary}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.lg}"

  # Chat Stream & Messages
  user-chat-bubble-light:
    backgroundColor: "{colors.light-surface-user-bubble}"
    textColor: "{colors.light-text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.sm} {spacing.lg}"
    border: "1px solid {colors.light-border-hairline}"
  user-chat-bubble-dark:
    backgroundColor: "{colors.dark-surface-user-bubble}"
    textColor: "{colors.dark-text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.sm} {spacing.lg}"
    border: "1px solid {colors.dark-border-hairline}"
  research-report-card:
    backgroundColor: "{colors.light-surface-card}"
    border: "1px solid {colors.light-border-subtle}"
    rounded: "{rounded.xl}"
    padding: "{spacing.md}"
    shadow: "0 6px 24px rgba(0, 0, 0, 0.06)"

  # Badges & Tabs
  preview-badge:
    backgroundColor: "{colors.status-preview-bg-light}"
    textColor: "{colors.status-preview-text-light}"
    typography: "{typography.badge-micro}"
    rounded: "{rounded.xs}"
    padding: "2px 6px"
  tab-pill:
    backgroundColor: "transparent"
    textColor: "{colors.light-text-secondary}"
    typography: "{typography.body-sm-medium}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
  tab-pill-active:
    backgroundColor: "{colors.light-surface-pill}"
    textColor: "{colors.light-text-primary}"
    typography: "{typography.body-sm-medium}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
    border: "1px solid {colors.light-border-subtle}"
---

## Overview

Microsoft Copilot features a comprehensive dual-mode visual experience built on Microsoft's Fluent 2 design language. 

- **Light Mode**: Replaces stark stark-white surfaces with a warm, editorial alabaster/cream canvas ({colors.light-canvas}), pairing soft beige containers ({colors.light-surface-user-bubble}) with crisp pure-white elevated cards ({colors.light-surface-input}, {colors.light-surface-card}) and subtle warm drop shadows.
- **Dark Mode**: Employs a midnight-slate background ({colors.dark-canvas}) paired with charcoal-blue surface elevations ({colors.dark-surface-card}) and luminescent hairline borders.

Both modes share an identical spatial and structural architecture: a floating, pill-squircle conversational input container docked at bottom center, modular bento grids for proactive discovery, pill-based navigation tabs, and a persistent left rail sidebar.

**Key Characteristics:**
- **Dual Themes**: Warm cream/alabaster in Light Mode; midnight navy/slate in Dark Mode
- **Floating Input Squircle**: High-radius container (`{rounded.xxl}` / 24px) floating over the bottom workspace with distinct ambient drop shadow
- **Continuous Pill Geometry**: Action triggers, tabs, model switches, and status pills universally leverage `{rounded.full}`
- **Bento Discovery Architecture**: Dynamic asymmetric grids hosting ambient media, weather widgets, and audio recaps ("Copilot Daily")
- **Typographic Cohesion**: Single typeface family (`Segoe UI Variable`) carrying the entire UI through disciplined weight and scale steps

## Colors

### Surface & Background Tokens

| Role | Light Theme | Dark Theme | Use Case |
|---|---|---|---|
| **Canvas** | `{colors.light-canvas}` (`#f8f5ee`) | `{colors.dark-canvas}` (`#0b0f19`) | Main viewport background |
| **Canvas Subtle** | `{colors.light-canvas-subtle}` (`#f3efe6`) | `{colors.dark-canvas-subtle}` (`#0e1320`) | Secondary background fill |
| **Sidebar** | `{colors.light-surface-sidebar}` (`#f5f1e8`) | `{colors.dark-surface-sidebar}` (`#0d121c`) | Left rail navigation background |
| **Card Base** | `{colors.light-surface-card}` (`#ffffff`) | `{colors.dark-surface-card}` (`#151c2b`) | Standard bento containers, report cards |
| **Card Elevated** | `{colors.light-surface-card-elevated}` (`#ffffff`) | `{colors.dark-surface-card-elevated}` (`#1a2336`) | Popovers, dropdown menus, modals |
| **Floating Input** | `{colors.light-surface-input}` (`#ffffff`) | `{colors.dark-surface-input}` (`#161d2d`) | Docked conversation textarea container |
| **Pill Neutral** | `{colors.light-surface-pill}` (`#eee8dc`) | `{colors.dark-surface-pill}` (`#1c2537`) | Inactive pill tabs, button backgrounds |
| **Pill Active** | `{colors.light-surface-pill-active}` (`#1e1e1e`) | `{colors.dark-surface-pill-active}` (`#25334d`) | Selected tabs, primary pill actions |
| **User Bubble** | `{colors.light-surface-user-bubble}` (`#ede7da`) | `{colors.dark-surface-user-bubble}` (`#1e283d`) | User prompt message bubbles |

### Typography & Text Tokens

| Role | Light Theme | Dark Theme | Use Case |
|---|---|---|---|
| **Text Primary** | `{colors.light-text-primary}` (`#1c1c1e`) | `{colors.dark-text-primary}` (`#f8fafc`) | Headings, user prompts, high-emphasis text |
| **Text Secondary** | `{colors.light-text-secondary}` (`#4a4c52`) | `{colors.dark-text-secondary}` (`#94a3b8`) | Assistant answers, unselected nav labels |
| **Text Muted** | `{colors.light-text-muted}` (`#71747d`) | `{colors.dark-text-muted}` (`#64748b`) | Timestamps, metadata, placeholders |
| **Text Dim** | `{colors.light-text-dim}` (`#9aa0a6`) | `{colors.dark-text-dim}` (`#475569`) | Legal disclaimers, low-contrast icons |

### Accent & Feedback Tokens
- **Accent Blue** ({colors.accent-blue}): `#3b82f6` — Active selection indicators, focused input borders.
- **Accent Sparkle** ({colors.accent-sparkle}): `#f59e0b` — Gold Copilot generation spark ("✨").
- **Accent Sky** ({colors.accent-sky}): `#9cbef5` — Light mode weather widget backdrop.

## Typography

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Family | Use |
|---|---|---|---|---|---|---|
| `{typography.hero-greeting}` | 26px | 600 | 1.30 | -0.2px | Segoe UI Variable | Home greeting ("Hi lucas, what should we dive into today?") |
| `{typography.section-title}` | 22px | 600 | 1.35 | 0 | Segoe UI Variable | Feed titles ("Let's discover what's new", "Stories to explore") |
| `{typography.heading-card}` | 18px | 600 | 1.40 | 0 | Segoe UI Variable | Bento titles ("Copilot Daily", Report Titles) |
| `{typography.stat-large}` | 32px | 500 | 1.10 | 0 | Segoe UI Variable | Weather temp ("64°", "65°") |
| `{typography.body-lg}` | 16px | 400 | 1.55 | 0 | Segoe UI Variable | Assistant response body prose |
| `{typography.body-md}` | 14px | 400 | 1.50 | 0 | Segoe UI Variable | User chat prompts, input field text |
| `{typography.body-md-medium}` | 14px | 500 | 1.50 | 0 | Segoe UI Variable | Left nav links, card CTA labels |
| `{typography.body-sm}` | 13px | 400 | 1.45 | 0 | Segoe UI Variable | Bento descriptions, secondary metadata |
| `{typography.body-sm-medium}` | 13px | 500 | 1.45 | 0 | Segoe UI Variable | Action pills, model switcher label |
| `{typography.caption}` | 12px | 400 | 1.40 | 0 | Segoe UI Variable | Footer disclaimers, message timestamps |
| `{typography.caption-medium}` | 12px | 500 | 1.40 | 0 | Segoe UI Variable | Dropdown selector labels ("Smart ⌵") |
| `{typography.badge-micro}` | 10px | 700 | 1.20 | 0.5px | Segoe UI Variable | "PREVIEW" tags |

## Elevation & Depth

### Shadows & Layering

| Level | Light Theme Treatment | Dark Theme Treatment | Use Case |
|---|---|---|---|
| **0 (Flat)** | None; `{colors.light-border-hairline}` | None; `{colors.dark-border-hairline}` | Sidebar rail, background canvas |
| **1 (Card)** | `0 4px 20px rgba(0, 0, 0, 0.04)` | `0 4px 12px rgba(0, 0, 0, 0.20)` | Bento cards, weather tile, report cards |
| **2 (Floating)** | `0 10px 30px rgba(0, 0, 0, 0.08)` | `0 8px 32px rgba(0, 0, 0, 0.35)` | Floating chat input bar |
| **3 (Modal)** | `0 16px 48px rgba(0, 0, 0, 0.12)` | `0 16px 48px rgba(0, 0, 0, 0.50)` | Media viewer popovers, dialog overlays |

## Shapes & Radii

| Token | Value | Applied To |
|---|---|---|
| `{rounded.xs}` | 4px | "PREVIEW" badge labels |
| `{rounded.md}` | 8px | Sidebar navigation selection highlights |
| `{rounded.lg}` | 12px | Report hero images, embedded card media thumbnails |
| `{rounded.xl}` | 16px | Small bento widgets, structured report cards |
| `{rounded.xxl}` | 24px | Large bento cards, user prompt bubbles, floating input bar |
| `{rounded.full}` | 9999px | Filter tabs, action buttons, model selectors, icon buttons |

## Components

### Navigation & Rail

**`sidebar-container`**
- Light: Background `{colors.light-surface-sidebar}`, border-right `1px solid {colors.light-border-hairline}`.
- Dark: Background `{colors.dark-surface-sidebar}`, border-right `1px solid {colors.dark-border-hairline}`.
- Width: 260px. Hosts navigation items, group headers, and bottom user profile card.

**`sidebar-nav-item`**
- Inactive: Transparent background, `{colors.light-text-secondary}` / `{colors.dark-text-secondary}`.
- Active: Background `{colors.light-surface-pill}` / `{colors.dark-surface-pill}`, text `{colors.light-text-primary}` / `{colors.dark-text-primary}`, rounded `{rounded.md}`.

### Chat & Conversational UI

**`chat-input-container`**
- Light: Background `{colors.light-surface-input}` (pure white), border `1px solid {colors.light-border-subtle}`, shadow `{elevation.2}`.
- Dark: Background `{colors.dark-surface-input}`, border `1px solid {colors.dark-border-subtle}`, shadow `{elevation.2}`.
- Shape: Rounded `{rounded.xxl}` (24px).
- Internal Controls: Contains (+) attach pill, model selector ("Smart ⌵"), input text field, and right-aligned microphone/waveform icon.

**`user-chat-bubble`**
- Light: Background `{colors.light-surface-user-bubble}` (warm cream-taupe), text `{colors.light-text-primary}`, border `1px solid {colors.light-border-hairline}`.
- Dark: Background `{colors.dark-surface-user-bubble}` (navy-slate), text `{colors.dark-text-primary}`, border `1px solid {colors.dark-border-hairline}`.
- Shape: Rounded `{rounded.xxl}` (24px). Self-aligned to right margin.

**`research-report-card`**
- Light: Background `{colors.light-surface-card}` (pure white), border `1px solid {colors.light-border-subtle}`.
- Dark: Background `{colors.dark-surface-card-elevated}`, border `1px solid {colors.dark-border-subtle}`.
- Layout: 16:9 thumbnail at top (`{rounded.lg}`), report title in `{typography.heading-card}`, bottom dual pill action buttons.

### Bento & Media Feeds

**`bento-card`**
- Light: Background `{colors.light-surface-card}` with soft shadow and subtle hairline border.
- Dark: Background `{colors.dark-surface-card}` with dark shadow and hairline border.
- Shape: Rounded `{rounded.xxl}` (24px), internal padding `{spacing.xl}`.

**`tab-pill` + `tab-pill-active`**
- Inactive: Transparent background, secondary text.
- Active (Light): Background `{colors.light-surface-pill}`, text `{colors.light-text-primary}`, border `1px solid {colors.light-border-subtle}`.
- Active (Dark): Background `{colors.dark-surface-pill-active}`, text `{colors.dark-text-primary}`, border `1px solid {colors.dark-border-subtle}`.

## Do's and Don'ts

### Do
- Use warm alabaster/cream (`#f8f5ee`) for Light Mode canvas rather than harsh pure white (`#ffffff`)
- Elevate Light Mode cards with pure white fills (`#ffffff`) over the cream background to create soft natural depth
- Maintain identical `{rounded.xxl}` (24px) corners on both Light and Dark mode containers
- Use dark solid fills (`#1c1d1f`) for primary pill buttons in Light Mode ("Create Image", "View summary", "Play now") to anchor visual weight

### Don't
- Don't use heavy, dark drop shadows in Light Mode; use wide, low-opacity ambient shadows (`rgba(0, 0, 0, 0.04)`)
- Don't use stark black `#000000` text on light surfaces; rely on soft off-black `{colors.light-text-primary}` (`#1c1c1e`)
- Don't alter layout geometry or spacing when switching themes; theme changes must be purely token-driven

## Responsive Behavior

| Breakpoint | Width | Behavior |
|---|---|---|
| **Mobile** | < 768px | Left rail collapses into slide-over drawer. Bento grid stacks 1-column. Floating input spans viewport width with 16px margins. |
| **Tablet** | 768 – 1024px | Rail collapses to 48px icon rail. Bento layouts render 2-column. |
| **Desktop** | > 1024px | Full 260px sidebar visible. Bento displays asymmetric multi-column grid. Main chat workspace locked to 768px max-width. |