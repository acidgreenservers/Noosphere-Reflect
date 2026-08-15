---
version: 1.0.0
name: Ask-Brave-design-analysis
description: Ask Brave (and Brave Search AI) is defined by a stealth, high-contrast dark aesthetic focused on privacy, deep research synthesis, and rapid search-to-answer transitions. The system pairs deep neutral charcoal-blacks ({colors.canvas}, {colors.surface-sidebar}) with soft translucent slate card fills ({colors.surface-card}), accented by Brave's signature saturated red-orange ({colors.brand-orange}) and electric cobalt blue ({colors.accent-blue}). The interface emphasizes clean geometric shapes, pill-styled utility controls, nested thread trees in the sidebar, and structured metric badges for reasoning telemetry (Deep Research status, URLs analyzed, queries issued).

colors:
  # Canvas & Base Surfaces
  canvas: "#141517"
  canvas-subtle: "#18191c"
  surface-sidebar: "#101114"
  surface-card: "#1e2025"
  surface-card-subtle: "#181a1e"
  surface-drawer: "#181a1f"
  surface-input: "#272a30"
  surface-input-focused: "#2f333b"
  surface-pill: "#2a2d35"
  surface-pill-hover: "#343842"
  
  # Brand & Interactive Accents
  brand-orange: "#fb542b"
  brand-orange-deep: "#de3e16"
  accent-blue: "#4c6ef5"
  accent-blue-subtle: "rgba(76, 110, 245, 0.18)"
  accent-blue-pill: "#2b3452"
  accent-purple-pill: "#352e4d"
  button-primary-light: "#cbd5e1"
  button-primary-light-active: "#ffffff"

  # Typography & Foreground
  text-primary: "#f1f3f5"
  text-secondary: "#a0a6b1"
  text-muted: "#6c727e"
  text-dim: "#4e5460"
  on-brand: "#ffffff"
  on-pill-light: "#0f172a"
  link: "#748ffc"

  # Borders & Dividers
  border-hairline: "rgba(255, 255, 255, 0.05)"
  border-subtle: "rgba(255, 255, 255, 0.09)"
  border-strong: "rgba(255, 255, 255, 0.16)"
  border-focus: "#4c6ef5"

typography:
  hero-headline:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.3px
  section-header:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
  heading-thread:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.40
  stat-number:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.20
  body-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.60
  body-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.50
  body-sm-medium:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.45
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.40
  micro:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.35

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 20px
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
  hero: 72px

components:
  # Navigation & Shell
  sidebar-container:
    backgroundColor: "{colors.surface-sidebar}"
    borderRight: "1px solid {colors.border-hairline}"
    padding: "{spacing.md}"
    width: "250px"
  sidebar-new-chat-btn:
    backgroundColor: "{colors.surface-pill}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-sm-medium}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    border: "1px solid {colors.border-subtle}"
  sidebar-nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"
  sidebar-subitem:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    typography: "{typography.caption}"
    padding: "4px 8px"
  top-category-link:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-sm-medium}"
    padding: "4px 10px"
  top-category-link-active:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-sm-medium}"
    borderBottom: "2px solid {colors.brand-orange}"

  # Search & Prompt Inputs
  search-box-home:
    backgroundColor: "{colors.surface-input}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
    border: "1px solid {colors.border-subtle}"
    height: 48px
  chat-input-pill:
    backgroundColor: "{colors.surface-input}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px solid {colors.border-subtle}"
  input-action-circle:
    backgroundColor: "{colors.surface-pill}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.full}"
    padding: "6px"
  input-submit-btn:
    backgroundColor: "{colors.surface-pill-hover}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.full}"
    padding: "6px"
  scope-pill-telescope:
    backgroundColor: "{colors.accent-purple-pill}"
    textColor: "{colors.accent-blue}"
    rounded: "{rounded.full}"
    padding: "4px 8px"

  # Deep Research & Cards
  deep-research-panel:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.border-subtle}"
  metric-cell:
    backgroundColor: "transparent"
    borderRight: "1px solid {colors.border-hairline}"
    padding: "{spacing.xs} {spacing.sm}"
  metric-number:
    typography: "{typography.stat-number}"
    textColor: "{colors.text-primary}"
  metric-label:
    typography: "{typography.micro}"
    textColor: "{colors.text-muted}"

  # Settings Drawer & Toggles
  settings-drawer:
    backgroundColor: "{colors.surface-drawer}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.xl}"
    border: "1px solid {colors.border-subtle}"
    width: "360px"
    shadow: "0 12px 40px rgba(0, 0, 0, 0.45)"
  settings-row:
    backgroundColor: "transparent"
    padding: "{spacing.sm} 0"
    borderBottom: "1px solid {colors.border-hairline}"
  select-pill:
    backgroundColor: "{colors.surface-pill}"
    textColor: "{colors.text-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
    border: "1px solid {colors.border-subtle}"
  pill-segmented-theme:
    backgroundColor: "{colors.surface-pill}"
    rounded: "{rounded.full}"
    padding: "2px"
  toggle-switch-on:
    backgroundColor: "{colors.brand-orange}"
    rounded: "{rounded.full}"
  toggle-switch-off:
    backgroundColor: "{colors.surface-pill}"
    rounded: "{rounded.full}"
  button-drawer-all:
    backgroundColor: "{colors.button-primary-light}"
    textColor: "{colors.on-pill-light}"
    typography: "{typography.body-sm-medium}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
---

## Overview

Ask Brave (alongside Brave Search AI) represents an information-first, privacy-grounded conversational interface. Its design balances the ultra-clean utility of search engines with deep, structured synthesis panels for complex research tasks.

The visual signature is defined by near-black charcoal surfaces ({colors.canvas}, {colors.surface-sidebar}), Brave's distinctive brand orange ({colors.brand-orange}), and high-contrast pill geometry. The workspace layout adapts seamlessly between an empty-state search/question launcher, a conversational thread view with multi-step nested sidebars, and a slide-over Quick Settings panel.

**Key Characteristics:**
- Deep matte charcoal backdrop ({colors.canvas}) with subtle grain and faint ambient background waves
- Brave Orange ({colors.brand-orange}) reserved for brand mark icons and primary active toggle states
- Pill-shaped search bars and action buttons with high corner curvature (`{rounded.full}`)
- "Deep Research" card container aggregating live execution telemetry (URLs analyzed, queries issued, elapsed time)
- Hierarchical conversation navigation featuring collapsed and expanded tree nodes in the sidebar
- Floating Quick Settings drawer with dark segmented controls and high-contrast action triggers

## Colors

### Canvas & Base Surfaces
- **Canvas** ({colors.canvas}): Main dark workspace (`#141517`).
- **Canvas Subtle** ({colors.canvas-subtle}): Secondary surface tone for nested panels (`#18191c`).
- **Surface Sidebar** ({colors.surface-sidebar}): Left rail navigation panel (`#101114`).
- **Surface Card** ({colors.surface-card}): Standard card background for research panels and widgets (`#1e2025`).
- **Surface Card Subtle** ({colors.surface-card-subtle}): Embedded code and inner quote containers (`#181a1e`).
- **Surface Drawer** ({colors.surface-drawer}): Slide-over Quick Settings surface (`#181a1f`).
- **Surface Input** ({colors.surface-input}): Search bars and conversational input fields (`#272a30`).
- **Surface Input Focused** ({colors.surface-input-focused}): Focused prompt box fill (`#2f333b`).
- **Surface Pill** ({colors.surface-pill}): Inactive selector pills, buttons, and switches (`#2a2d35`).
- **Surface Pill Hover** ({colors.surface-pill-hover}): Elevated interactive chip states (`#343842`).

### Brand & Interactive Accents
- **Brand Orange** ({colors.brand-orange}): Primary Brave brand lion color and active toggle highlight (`#fb542b`).
- **Brand Orange Deep** ({colors.brand-orange-deep}): Pressed/active orange accent (`#de3e16`).
- **Accent Blue** ({colors.accent-blue}): Research links and prompt telescope scope tools (`#4c6ef5`).
- **Accent Blue Subtle** ({colors.accent-blue-subtle}): Soft glow backing for active search controls.
- **Button Primary Light** ({colors.button-primary-light}): Light slate-white button pill used for "All settings →" CTA (`#cbd5e1`).

### Typography & Text
- **Text Primary** ({colors.text-primary}): Hero copy ("Al-powered answers. No AI profiling."), markdown headings, user prompts (`#f1f3f5`).
- **Text Secondary** ({colors.text-secondary}): Assistant markdown body text, category nav labels (`#a0a6b1`).
- **Text Muted** ({colors.text-muted}): Telemetry labels, placeholders, input hint text (`#6c727e`).
- **Text Dim** ({colors.text-dim}): Sub-item thread navigation, footer copyright/legal links (`#4e5460`).
- **Link** ({colors.link}): Inline citation chips and source anchors (`#748ffc`).

### Borders
- **Border Hairline** ({colors.border-hairline}): `rgba(255, 255, 255, 0.05)` for table and sidebar divisions.
- **Border Subtle** ({colors.border-subtle}): `rgba(255, 255, 255, 0.09)` for card outlines and input borders.
- **Border Strong** ({colors.border-strong}): `rgba(255, 255, 255, 0.16)` for hover and focus rings.

## Typography

### Font Family
- **Headings & Brand**: `Poppins`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`.
- **Interface & Markdown**: `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.hero-headline}` | 28px | 600 | 1.25 | -0.3px | Center landing statement ("AI-powered answers...") |
| `{typography.section-header}` | 18px | 600 | 1.35 | 0 | Executive summary headers, drawer titles |
| `{typography.heading-thread}` | 16px | 600 | 1.40 | 0 | Subheadings in research reports, tool titles |
| `{typography.stat-number}` | 18px | 600 | 1.20 | 0 | Metric numerical readouts ("540", "9", "4m 56s") |
| `{typography.body-md}` | 15px | 400 | 1.60 | 0 | Main assistant synthesis paragraphs, input prompts |
| `{typography.body-sm}` | 13px | 400 | 1.50 | 0 | Sidebar thread titles, settings descriptions |
| `{typography.body-sm-medium}` | 13px | 500 | 1.45 | 0 | Category nav tabs (Ask, All, Images), buttons |
| `{typography.caption}` | 12px | 400 | 1.40 | 0 | Sub-tree outline items, footer legal text |
| `{typography.micro}` | 11px | 400 | 1.35 | 0 | Telemetry labels ("URLs analyzed", "Elapsed") |

## Layout

### Spacing System
- **Base unit**: 4px
- **Tokens**: `{spacing.xxs}` (4px) · `{spacing.xs}` (8px) · `{spacing.sm}` (12px) · `{spacing.md}` (16px) · `{spacing.lg}` (20px) · `{spacing.xl}` (24px) · `{spacing.xxl}` (32px) · `{spacing.section}` (48px) · `{spacing.hero}` (72px)
- **Max Container Width**: Chat conversation stream column constrained to ~740px centered; standard search landing centered at ~680px.

### Structure & Grids
- **Left Sidebar**: 250px fixed rail for session trees and settings triggers.
- **Top Header**: Simple horizontal row with brand icon left and category links (Ask, All, Images, News, Videos, Maps, Goggles) top-center.
- **Floating Input**: Centered prompt box floating at the bottom with 20px viewport clearance.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (flat) | No shadow; `{colors.border-hairline}` | Sidebar rail, main conversation stream |
| 1 (card) | `0 4px 16px rgba(0, 0, 0, 0.25)` | Deep Research panel, metrics card |
| 2 (floating) | `0 8px 30px rgba(0, 0, 0, 0.40)` | Floating prompt bar, model switcher |
| 3 (drawer) | `0 12px 40px rgba(0, 0, 0, 0.50)` | Quick Settings slide-over panel |

## Shapes & Radii

| Token | Value | Applied To |
|---|---|---|
| `{rounded.xs}` | 4px | Citation pills, status markers |
| `{rounded.sm}` | 6px | Sidebar session item hover highlights |
| `{rounded.md}` | 8px | "New conversation" button, toggle handles |
| `{rounded.lg}` | 12px | Internal modal containers, inline image cards |
| `{rounded.xl}` | 16px | Deep Research telemetry card |
| `{rounded.xxl}` | 20px | Chat input container, Quick Settings drawer container |
| `{rounded.full}` | 9999px | Search bars, dropdown pills, theme switchers, action triggers |

## Components

### Navigation & Sidebar

**`sidebar-container`**
- Background `{colors.surface-sidebar}`, width 250px, border-right `1px solid {colors.border-hairline}`.
- Top: Brave Lion logo + wordmark.
- Header CTA: `sidebar-new-chat-btn` ("+ New conversation") with subtle border and icon.
- Thread List: Tree hierarchy with expandable parent questions (`{typography.body-sm}`) and nested section milestones (`{typography.caption}`).
- Bottom: Pinned "⚙ Settings" trigger link.

**`top-category-link` + `top-category-link-active`**
- Inactive: Background transparent, text `{colors.text-secondary}`.
- Active: Text `{colors.text-primary}`, bottom indicator line in `{colors.brand-orange}` (2px solid).

### Search & Prompt Bars

**`search-box-home`** — Standard Brave Search launcher.
- Background `{colors.surface-input}`, text `{colors.text-primary}`, rounded `{rounded.full}`, padding `10px 16px`.
- Left: (+) icon; Center: placeholder; Right: microphone icon + search trigger pill button (`button-ask`).

**`chat-input-pill`** — Conversational stream prompt input.
- Background `{colors.surface-input}`, border `1px solid {colors.border-subtle}`, rounded `{rounded.xxl}`, padding `{spacing.sm} {spacing.md}`.
- Controls: Image attachment icon, purple telescope pill (`scope-pill-telescope`), voice input, and circular send arrow.

### Deep Research & Synthesis

**`deep-research-panel`**
- Background `{colors.surface-card}`, border `1px solid {colors.border-subtle}`, rounded `{rounded.xl}`, padding `{spacing.lg}`.
- Top Row: "✓ Deep Research" title + expand window icon button.
- Metric Grid: 3-column split with vertical hairlines displaying URLs analyzed, queries issued, and elapsed time.
- Bottom Drawer: "Answer outline" with collapsible "Show more" toggle.

### Settings Drawer

**`settings-drawer`**
- Background `{colors.surface-drawer}`, rounded `{rounded.xxl}`, border `1px solid {colors.border-subtle}`, width 360px.
- Features:
  - Language and Region select pills (`select-pill`) with chevron right.
  - Theme segment control (`pill-segmented-theme`) with Sun / Moon / System icons.
  - Native toggle switches (`toggle-switch-on` in `{colors.brand-orange}`).
  - High-contrast bottom CTA button (`button-drawer-all`) in `{colors.button-primary-light}`.

## Do's and Don'ts

### Do
- Use dark charcoal backgrounds (`#141517`) with ultra-fine border overlays rather than pure pitch black
- Anchor key brand interactions (toggles, active search filters) with Brave Orange (`#fb542b`)
- Display telemetry statistics (URLs analyzed, queries, time elapsed) inside structured metric cells with vertical dividers
- Structure nested conversation history in the sidebar as an expandable tree to reflect deep inquiry sessions

### Don't
- Don't use heavy solid borders; stick to alpha hairlines (`rgba(255, 255, 255, 0.05–0.09)`)
- Don't round search input bars with square or low-radius corners; use `{rounded.full}` for search bars and `{rounded.xxl}` for multi-line inputs
- Don't display AI response text in bubble containers; render markdown answers directly onto the canvas for optimal reading flow

## Responsive Behavior

| Breakpoint | Width | Behavior |
|---|---|---|
| **Mobile** | < 768px | Sidebar collapses into a sliding hamburger drawer. Top search category bar scrolls horizontally. Prompt box spans full width minus 16px padding. |
| **Tablet** | 768 – 1024px | Sidebar collapses to icon-only rail or drawer overlay. Research metric grid retains 3-column split. |
| **Desktop** | > 1024px | Full 250px sidebar tree visible. Main conversation stream locked to ~740px max-width. Quick Settings opens as an absolute floating drawer on the right. |