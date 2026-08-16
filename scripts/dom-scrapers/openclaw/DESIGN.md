---
version: 1.0.0
name: OpenClaw-Control-UI-design-analysis
description: OpenClaw Control is an autonomous AI agent orchestration and telemetry dashboard. Built around a dense, high-utility developer layout, it provides real-time gateway metrics, multi-node instance clustering, deep context-window tracking, and interactive agent messaging. The interface is anchored by a high-contrast lobster-red brand signature ({colors.brand-lobster}), clean rounded rectangular containers ({rounded.lg}), high-density data chips, and structured metric tiles across both light and dark themes.

colors:
  # Light Theme (Clean Neutral & Off-White)
  light-canvas: "#f4f5f7"
  light-canvas-subtle: "#ebedf0"
  light-surface-sidebar: "#ffffff"
  light-surface-card: "#ffffff"
  light-surface-card-subtle: "#f8f9fa"
  light-surface-input: "#ffffff"
  light-surface-pill: "#f1f3f5"
  light-surface-pill-hover: "#e9ecef"
  light-surface-active-item: "#feeae8"
  light-user-bubble: "#feeae8"
  light-agent-bubble: "#ffffff"
  
  # Dark Theme (Stealth Charcoal & Elevated Onyx)
  dark-canvas: "#111317"
  dark-canvas-subtle: "#16181d"
  dark-surface-sidebar: "#16181d"
  dark-surface-card: "#1b1e24"
  dark-surface-card-subtle: "#16181d"
  dark-surface-input: "#1b1e24"
  dark-surface-pill: "#22262e"
  dark-surface-pill-hover: "#2a2f3a"
  dark-surface-active-item: "#2a1b1d"
  dark-user-bubble: "#2a1b1d"
  dark-agent-bubble: "#1b1e24"

  # Brand & Primary Accents
  brand-lobster: "#e03131"
  brand-lobster-hover: "#c92a2a"
  brand-lobster-subtle: "rgba(224, 49, 49, 0.12)"
  status-online: "#2b8a3e"
  status-online-dot: "#40c057"
  status-error: "#e03131"

  # Light Theme Typography & Borders
  light-text-primary: "#1a1d20"
  light-text-secondary: "#495057"
  light-text-muted: "#868e96"
  light-text-dim: "#adb5bd"
  light-border-hairline: "rgba(0, 0, 0, 0.06)"
  light-border-subtle: "#e9ecef"
  light-border-strong: "#ced4da"

  # Dark Theme Typography & Borders
  dark-text-primary: "#f1f3f5"
  dark-text-secondary: "#a6adb9"
  dark-text-muted: "#6c7482"
  dark-text-dim: "#495057"
  dark-border-hairline: "rgba(255, 255, 255, 0.06)"
  dark-border-subtle: "rgba(255, 255, 255, 0.10)"
  dark-border-strong: "rgba(255, 255, 255, 0.18)"

typography:
  view-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.30
    letterSpacing: -0.3px
  section-header:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.40
  nav-group-label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.30
    letterSpacing: 0.8px
  metric-val-lg:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: 26px
    fontWeight: 700
    lineHeight: 1.20
  body-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
  body-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  body-sm-medium:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.45
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.40
  code-mono:
    fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.40

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  section: 48px

components:
  # Navigation & App Rail
  sidebar-container:
    width: "240px"
    padding: "{spacing.sm}"
  sidebar-nav-item:
    typography: "{typography.body-sm-medium}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  sidebar-nav-item-active-light:
    backgroundColor: "{colors.light-surface-active-item}"
    textColor: "{colors.brand-lobster}"
    border: "1px solid rgba(224, 49, 49, 0.25)"
  sidebar-nav-item-active-dark:
    backgroundColor: "{colors.dark-surface-active-item}"
    textColor: "{colors.brand-lobster}"
    border: "1px solid rgba(224, 49, 49, 0.35)"
  button-new-session:
    typography: "{typography.body-sm-medium}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    border: "1px solid {colors.brand-lobster-subtle}"

  # Top Bar & Header
  top-header-bar:
    padding: "{spacing.sm} {spacing.xl}"
    height: "52px"
  breadcrumbs-trail:
    typography: "{typography.body-sm-medium}"
  quick-search-input:
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    width: "220px"
  theme-mode-segmented:
    rounded: "{rounded.md}"
    padding: "2px"

  # Metric Cards & Dashboard
  metric-tile:
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  metric-tile-light:
    backgroundColor: "{colors.light-surface-card}"
    border: "1px solid {colors.light-border-subtle}"
  metric-tile-dark:
    backgroundColor: "{colors.dark-surface-card}"
    border: "1px solid {colors.dark-border-subtle}"
  section-container-light:
    backgroundColor: "{colors.light-surface-card}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.light-border-subtle}"
    padding: "{spacing.xl}"
  section-container-dark:
    backgroundColor: "{colors.dark-surface-card}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.dark-border-subtle}"
    padding: "{spacing.xl}"

  # Chat Stream & Floating Footer Dock
  chat-dock-container:
    rounded: "{rounded.lg}"
    padding: "{spacing.sm} {spacing.md}"
  context-progress-bar:
    rounded: "{rounded.pill}"
    height: "6px"
  agent-chat-bubble:
    rounded: "{rounded.lg}"
    padding: "{spacing.sm} {spacing.md}"
    typography: "{typography.body-md}"
  user-chat-bubble:
    rounded: "{rounded.lg}"
    padding: "{spacing.sm} {spacing.md}"
    typography: "{typography.body-md}"
  badge-chip:
    typography: "{typography.code-mono}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
---

## Overview

OpenClaw Control UI is a specialized dashboard and conversational interface designed for monitoring, orchestrating, and interacting with self-hosted AI agent nodes.

The design features a high-density, utility-first layout optimized for live system observability. It combines rich tabular metadata, telemetry tiles, and gateway handshake readouts with an interactive conversational workspace. The visual identity is anchored by OpenClaw's signature lobster-red accent ({colors.brand-lobster}), monospaced system telemetry badges, and clean rounded-rectangular card enclosures ({rounded.lg}).

**Key Characteristics:**
- **Dual High-Contrast Themes**: Crisp white/gray surface layers in Light mode; stealth charcoal/onyx elevations in Dark mode
- **Brand Identity**: Signature lobster red ({colors.brand-lobster}) used for brand icons, active view highlights, node badges, and action triggers
- **High-Density Sidebar**: Multi-grouped rail navigation (`CONTROL`, `CHAT`, `AGENT`, `RECENTS`) with integrated active node picker dropdowns and version status pills
- **Developer-Centric Telemetry**: Built-in context-window utilization meters (`28.3k / 1M`), live node presence rows, gateway WebSocket diagnostics, and cost/error trackers
- **Modular Data Cards**: Segmented `{rounded.lg}` (12px) container panels organizing settings, gateway access forms, and grid-based usage statistics

## Colors

### Surface & Canvas Tokens

| Role | Light Theme | Dark Theme | Use Case |
|---|---|---|---|
| **Canvas** | `{colors.light-canvas}` (`#f4f5f7`) | `{colors.dark-canvas}` (`#111317`) | Main application background |
| **Sidebar Rail** | `{colors.light-surface-sidebar}` (`#ffffff`) | `{colors.dark-surface-sidebar}` (`#16181d`) | Left vertical navigation rail |
| **Card Surface** | `{colors.light-surface-card}` (`#ffffff`) | `{colors.dark-surface-card}` (`#1b1e24`) | Dashboard containers, metric tiles |
| **Card Sub-surface**| `{colors.light-surface-card-subtle}` (`#f8f9fa`)| `{colors.dark-surface-card-subtle}` (`#16181d`)| Inner table strips, code wrappers |
| **Input Fill** | `{colors.light-surface-input}` (`#ffffff`) | `{colors.dark-surface-input}` (`#1b1e24`) | Text inputs, dropdown selectors |
| **Active Nav Fill** | `{colors.light-surface-active-item}` (`#feeae8`)| `{colors.dark-surface-active-item}` (`#2a1b1d`)| Active sidebar route highlight |
| **Pill Neutral** | `{colors.light-surface-pill}` (`#f1f3f5`) | `{colors.dark-surface-pill}` (`#22262e`) | Chip tags, secondary buttons |
| **User Bubble** | `{colors.light-user-bubble}` (`#feeae8`) | `{colors.dark-user-bubble}` (`#2a1b1d`) | Outgoing user chat bubbles |
| **Agent Bubble** | `{colors.light-agent-bubble}` (`#ffffff`) | `{colors.dark-agent-bubble}` (`#1b1e24`) | Incoming agent chat bubbles |

### Brand & Status Accents
- **Brand Lobster** ({colors.brand-lobster}): `#e03131` — Primary brand color, logo icon, active navigation markers, and view title highlight.
- **Brand Lobster Hover** ({colors.brand-lobster-hover}): `#c92a2a` — Active/pressed button states.
- **Status Online** ({colors.status-online}): `#2b8a3e` / `#40c057` — Gateway handshake "OK" indicator and bottom-left connection dot.
- **Status Error** ({colors.status-error}): `#e03131` — Error rate tracking and disconnected telemetry warnings.

### Typography & Text Tokens

| Role | Light Theme | Dark Theme | Use Case |
|---|---|---|---|
| **Text Primary** | `{colors.light-text-primary}` (`#1a1d20`) | `{colors.dark-text-primary}` (`#f1f3f5`) | Headings, metric readouts, prompt text |
| **Text Secondary** | `{colors.light-text-secondary}` (`#495057`) | `{colors.dark-text-secondary}` (`#a6adb9`) | Body prose, breadcrumb links, sub-labels |
| **Text Muted** | `{colors.light-text-muted}` (`#868e96`) | `{colors.dark-text-muted}` (`#6c7482`) | Timestamps, metadata, placeholder text |
| **Text Dim** | `{colors.light-text-dim}` (`#adb5bd`) | `{colors.dark-text-dim}` (`#495057`) | Group headers (`CONTROL`, `AGENT`) |

## Typography

### Font Family
- **Interface & Metrics**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif`
- **Code & Diagnostics**: `SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace`

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.view-title}` | 22px | 700 | 1.30 | -0.3px | Page headlines ("Overview", "Instances", "Usage") |
| `{typography.metric-val-lg}` | 26px | 700 | 1.20 | 0 | Metric numbers ("$0.00", "0.00%", "8m", "OK") |
| `{typography.section-header}` | 14px | 600 | 1.40 | 0 | Card section titles ("Gateway Access", "Filters") |
| `{typography.body-md}` | 14px | 400 | 1.50 | 0 | Chat message text, input values |
| `{typography.body-sm-medium}` | 13px | 500 | 1.45 | 0 | Sidebar routes, button labels, breadcrumb path |
| `{typography.body-sm}` | 13px | 400 | 1.45 | 0 | Card descriptions, metadata descriptions |
| `{typography.caption}` | 12px | 400 | 1.40 | 0 | Chat timestamps, sub-item session keys |
| `{typography.nav-group-label}` | 11px | 700 | 1.30 | 0.8px | Uppercase sidebar section labels (`CONTROL`) |
| `{typography.code-mono}` | 12px | 500 | 1.40 | 0 | Node IDs, gateway keys, filter queries, version |

## Layout

### Spacing System
- **Base unit**: 4px
- **Tokens**: `{spacing.xxs}` (4px) · `{spacing.xs}` (8px) · `{spacing.sm}` (12px) · `{spacing.md}` (16px) · `{spacing.lg}` (20px) · `{spacing.xl}` (24px) · `{spacing.xxl}` (32px) · `{spacing.section}` (48px)

### Structure & Grids
- **Sidebar Rail**: 240px fixed left panel with section dividers and sticky footer status bar.
- **Top Header Bar**: 52px height spanning from the right of the sidebar, hosting breadcrumbs left and global search/theme toggle right.
- **Main Viewport**: Fluid scrollable workspace hosting 4-column metric grids (Usage/Overview) or a full-width chat stream with pinned bottom input dock.
- **Metric Grids**: `grid-template-columns: repeat(4, 1fr)` on desktop, adapting to 2-column or stacked layouts.

## Elevation & Depth

| Level | Light Theme | Dark Theme | Use Case |
|---|---|---|---|
| **0 (Flat)** | None; `{colors.light-border-subtle}` | None; `{colors.dark-border-subtle}` | Main canvas, sidebar rail |
| **1 (Card)** | `0 1px 3px rgba(0, 0, 0, 0.05)` | `0 1px 3px rgba(0, 0, 0, 0.30)` | Dashboard cards, metric tiles |
| **2 (Docked)** | `0 4px 16px rgba(0, 0, 0, 0.06)` | `0 4px 20px rgba(0, 0, 0, 0.40)` | Bottom floating chat bar, dropdown popovers |

## Shapes & Radii Scale

| Token | Value | Applied To |
|---|---|---|
| `{rounded.xs}` | 4px | Inline telemetry tags, code chips |
| `{rounded.sm}` | 6px | Form input controls, dropdown select boxes |
| `{rounded.md}` | 8px | Sidebar nav items, session buttons, search bar |
| `{rounded.lg}` | 12px | Metric tiles, main dashboard cards, chat bubbles |
| `{rounded.xl}` | 16px | Large outer containers, modal dialogs |
| `{rounded.pill}` | 9999px | Filter chips, node tags, context meters, version badge |

## Components

### Sidebar & Workspace Shell

**`sidebar-container`**
- Light: Background `{colors.light-surface-sidebar}`, right border `1px solid {colors.light-border-subtle}`.
- Dark: Background `{colors.dark-surface-sidebar}`, right border `1px solid {colors.dark-border-subtle}`.
- Top: Lobster brand logo + "CONTROL / OpenClaw" wordmark.
- Controls: "+ New session" button (`button-new-session`), active node switcher dropdown pill (`node-8ed2eff31f0c ⌵`).
- Navigation Groups: Pinned uppercase section headers (`RECENT`, `CHAT`, `CONTROL`, `AGENT`).
- Footer: Pinned app version status chip (`VERSION v2026.6.34` + green pulsing dot).

**`sidebar-nav-item`**
- Inactive: Background transparent, text `{colors.light-text-secondary}` / `{colors.dark-text-secondary}`.
- Active: Background `{colors.light-surface-active-item}` (light) / `{colors.dark-surface-active-item}` (dark), text `{colors.brand-lobster}`, left border highlight or rounded border accent.

### Metrics & Management Panels

**`metric-tile`**
- Structure: Metric label in `{typography.nav-group-label}` ({colors.light-text-dim}), primary numeric readout in `{typography.metric-val-lg}`, secondary description/sub-metric below in `{typography.caption}`.
- Appearance: Rounded `{rounded.lg}` with subtle border stroke.

**`connected-instance-card`**
- Background `{colors.light-surface-card}` / `{colors.dark-surface-card}`, rounded `{rounded.lg}`, padding `{spacing.md}`.
- Top: Instance name + node connection status + relative timestamp.
- Bottom: Array of pill badges (`badge-chip`) displaying runtime, OS (`linux 6.12.24-Unraid`), architecture (`x64`), and node version.

### Conversational Chat & Input Dock

**`chat-dock-container`**
- Positioned floating at the bottom center of the active chat view.
- Light: Background `{colors.light-surface-card}`, border `1px solid {colors.light-border-strong}`, shadow `{elevation.2}`.
- Dark: Background `{colors.dark-surface-card}`, border `1px solid {colors.dark-border-strong}`, shadow `{elevation.2}`.
- Top Bar: Context meter pill showing percentage and token count (`3% context used  28.3k / 1M`).
- Bottom Bar: Attach (+) icon, broadcast icon, settings gear, model selector pill (`deepseek/deepseek-v4-flas... ⌵`), and right send trigger.

**`user-chat-bubble` & `agent-chat-bubble`**
- User Bubble: Background `{colors.light-user-bubble}` (light) / `{colors.dark-user-bubble}` (dark), right-aligned with red avatar icon.
- Agent Bubble: Background `{colors.light-agent-bubble}` (light) / `{colors.dark-agent-bubble}` (dark), left-aligned with lobster avatar icon.
- Timestamp + Context Toggle link positioned below message bubble.

## Do's and Don'ts

### Do
- Use OpenClaw's lobster red (`#e03131`) for active route highlights, primary brand headers, and active filter states
- Structure complex metrics inside uniform 4-column `{rounded.lg}` (12px) grid cards
- Render system identifiers, node addresses, and filter expressions in `{typography.code-mono}`
- Display live context window capacity (`X% used  Xk / 1M`) directly inside the chat prompt dock

### Don't
- Don't use overly large (>16px) pill radii on metric containers; keep developer panels crisp and structured
- Don't omit node metadata chips (`OS`, `arch`, `version`) in instance lists
- Don't use pure black `#000000` in dark mode; maintain rich dark charcoal `#111317` with `#1b1e24` card fills

## Responsive Behavior

| Breakpoint | Width | Behavior |
|---|---|---|
| **Mobile** | < 768px | Sidebar collapses into a sliding navigation drawer. Top breadcrumbs truncate. Metric grids collapse to single-column vertical stacks. |
| **Tablet** | 768 – 1024px | Sidebar collapses to an icon rail (56px). Dashboard metric tiles render in a 2-column grid. |
| **Desktop** | > 1024px | Full 240px sidebar rail. 4-column metric grids across Overview and Usage screens. Persistent top header bar. |