# Noosphere Reflect — Native Sidebar Exporters

Collection of native slide-over drawer scripts for exporting chat conversations from AI platforms with full Noosphere metadata, DESIGN.md-driven theming, and automatic dark/light theme detection.

## 📋 What's Here?

Three platform-specific exporter scripts, each featuring a native slide-over sidebar drawer with batch selection, interactive turn accordions, dual export formats (Markdown + JSON), and automatic theme switching that follows the host page's light/dark mode in real time.

| Script | Platform | Design System | Key Features |
|--------|----------|---------------|--------------|
| **`mistral-vibe.js`** | chat.mistral.ai | Warm cream/orange palette | Deep Research extraction, thought expansion, sunset-stripe branding |
| **`claude-export.js`** | claude.ai | Warm canvas/coral palette | Thinking blocks, Appearance radiogroup detection, Copernicus typography |
| **`copilot.js`** | copilot.microsoft.com | Fluent 2 alabaster/midnight | Deep Research, attachments, pill geometry, bento card shadows |

Each script ships with a corresponding `DESIGN.md` that defines its visual language — colors, typography, spacing, radii, shadows, and component specs — all token-driven and dual-theme ready.

---

## 🚀 Quick Start

### 30 Seconds to Export

1. Open chat on **Mistral Vibe**, **Claude**, or **Copilot**
2. Press `F12` → go to **Console** tab
3. Copy entire content of the appropriate script (`mistral-vibe.js`, `claude-export.js`, or `copilot.js`)
4. Paste into console, press Enter
5. An **Export** button appears in the platform's native header/top bar
6. Click **Export** → sidebar drawer slides in from the right
7. Select turns via checkboxes or batch controls (All / User / AI / None)
8. Choose format (Markdown or JSON) → click **Copy** or **Save**
9. Paste into Noosphere Reflect or save the downloaded file

**Keyboard Shortcut:**
- `Escape` → Close sidebar

---

## 🎨 Design System Architecture

Each script implements a `CONFIG.THEMES` object with `light` and `dark` palettes, and a `CONFIG.THEME` reference that gets swapped at runtime by the `ThemeManager`.

### Dual-Theme Token Structure

```javascript
CONFIG.THEMES = {
    light: {
        CANVAS: '#fff8e0',        // Page background
        SURFACE_CARD: '#ffffff',   // Card surfaces
        PRIMARY: '#fa520f',        // Brand accent
        INK: '#1f1f1f',            // Primary text
        // ... full token set
    },
    dark: {
        CANVAS: '#1c1c1e',
        SURFACE_CARD: '#151c2b',
        PRIMARY: '#fa520f',
        INK: '#f3f4f6',
        // ... full token set
    }
};
CONFIG.THEME = CONFIG.THEMES.light; // Swapped by ThemeManager
```

### Per-Script Design Languages

| Script | Light Canvas | Dark Canvas | Primary Accent | Typography | Button Radius | Card Radius |
|--------|-------------|------------|----------------|------------|---------------|-------------|
| `mistral-vibe.js` | `#fff8e0` cream | `#1c1c1e` dark gray | `#fa520f` orange | Inter | 8px (`rounded.md`) | 12px (`rounded.lg`) |
| `claude-export.js` | `#faf9f5` warm canvas | `#181715` dark | `#cc785c` coral | StyreneB / Copernicus | 8px | 12px |
| `copilot.js` | `#f8f5ee` alabaster | `#0b0f19` midnight | `#3b82f6` blue | Segoe UI Variable | 9999px (pill) | 24px (`rounded.xxl`) |

---

## 🔄 ThemeManager — Automatic Dark/Light Detection

All three scripts share a proven `ThemeManager` architecture that detects the host page's theme and switches the sidebar's palette in real time.

### Detection Strategy (Layered)

The detection layers signals from most reliable to least, ensuring correctness across SPAs that may use dark canvases even in light mode:

1. **Explicit attributes** — `data-theme="dark"` or `.dark` class on `<html>` / `<body>`
2. **Text color luminance** — Checks computed text color on user messages (light text → dark mode, dark text → light mode). This is the SPA-safe signal that avoids false positives from dark canvas backgrounds.
3. **Background luminance** — Falls back to checking message bubble / container background colors
4. **`prefers-color-scheme`** — OS-level media query as last resort

### Live Switching

- **500ms poll** — Lightweight interval checks for theme changes without observing the entire dynamic DOM
- **`MutationObserver`** — Watches `data-theme` and `class` attributes on `<html>` and `<body>` for immediate detection
- **Runtime re-injection** — On theme change, removes the old `<style>` element and re-injects CSS with the new palette (template literals bake in colors at injection time)
- **Re-render** — Calls `renderMessageList()` so inline accordion styles pick up the new palette

### Initialization Pattern

```javascript
const STATE = {
    currentTheme: null  // Must be null so first apply() always fires
};

// In init():
ThemeManager.init();      // Detect + inject styles FIRST
createSidebarUI();        // Then build the drawer with correct theme
```

---

## 🧩 Shared Architecture

### Recursive DOM-to-Markdown Parser

All scripts use the same recursive `renderNodeToMarkdown()` parser that walks the DOM tree and produces clean Markdown:

- **Headings** (h1–h6) → `#` syntax
- **Bold/italic** → `**bold**` / `*italic*`
- **Code blocks** → Fenced with language detection (`data-lang` attribute)
- **Blockquotes** → `>` prefix
- **Lists** (ordered/unordered) → `1.` / `-` syntax
- **Tables** → Pipe table format with header separator
- **Links** → `[label](href)` format
- **Noise stripping** — Removes buttons, SVGs, copy buttons, and `aria-hidden` elements before parsing

### Noosphere Reflect Frontmatter

Every export includes structured metadata:

```markdown
---
> **📝 Title:** Chat Title
> **🤖 Model:** Mistral Vibe / Claude / Microsoft Copilot
> **🌐 Exported:** 2026-08-15 10:30:00 AM
> **🌐 Source:** [Platform](https://...)
> **🏷️ Tags:** Platform, AI-Chat, Noosphere
> **📊 Metadata:** 12 Selected Messages | 6 User | 6 AI
---

# Chat Title
---

#### Prompt - User 👤:
...

#### Response - AI 🧠:
...

###### Noosphere Reflect
###### ***Meaning Through Memory***
###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***
```

### Native Header Trigger Injection

Each script injects an **Export** button into the platform's native UI:

| Script | Injection Point | Button Style |
|--------|-----------------|--------------|
| `mistral-vibe.js` | After "New chat" in top bar | Orange `button-primary` (8px rounded) |
| `claude-export.js` | In `+` menu above "Add files" | Menu item with download icon |
| `copilot.js` | Beside "Invite" in top bar flex row | Dark solid pill (`rounded.full`) |

A `MutationObserver` watches for DOM changes and re-injects the trigger if the platform re-renders its header.

---

## 📋 Per-Script Features

### `mistral-vibe.js` — Mistral Vibe Exporter

- **Platform:** chat.mistral.ai
- **Design:** Warm cream surfaces (`#fff8e0`), saturated orange primary (`#fa520f`), Inter typography, 8px buttons, 12px cards, beige-deep borders
- **Deep Research Extraction:** Separates Block 1 (Research Stepper & Execution Plan) from Block 2 (Final Report & Sources)
- **Thought Expansion:** Pre-expands "Thought for X s" collapsibles to archive 100% of reasoning
- **Theme Detection:** `data-theme`/`class` on html/body, top-bar background luminance, `prefers-color-scheme`
- **Role Badges:** User (neutral gray), Mistral Vibe (orange), Deep Research (sunshine yellow)

### `claude-export.js` — Claude Exporter

- **Platform:** claude.ai
- **Design:** Warm canvas (`#faf9f5`), coral primary (`#cc785c`), StyreneB/Copernicus typography, 8px buttons, 12px cards
- **Thinking Blocks:** Auto-expands all thinking collapsibles, extracts summary + full reasoning content
- **Theme Detection:** Appearance `radiogroup` checked radio (`auto`/`light`/`dark`), text-color luminance (SPA-safe), background luminance, `prefers-color-scheme`
- **Menu Injection:** Adds "Export Chat" item with download icon to the `+` menu
- **Role Badges:** User (warm surface), Claude (coral)

### `copilot.js` — Copilot Exporter

- **Platform:** copilot.microsoft.com
- **Design:** Fluent 2 dual-theme — Light alabaster (`#f8f5ee`) / Dark midnight (`#0b0f19`), Segoe UI Variable, pill buttons (`rounded.full`), bento cards (`rounded.xxl` / 24px), full elevation system
- **Deep Research:** Extracts report title, markdown body, and discovered sources
- **Attachments:** Captures image attachments from user and AI messages
- **Theme Detection:** `data-theme`/`class`, text-color luminance, background luminance, `prefers-color-scheme`
- **Role Badges:** User (blue accent), Copilot (pill neutral)

---

## 📄 Export Formats

### Markdown

```markdown
---
> **📝 Title:** Chat Title
> **🤖 Model:** Claude
> **🌐 Exported:** Aug 15, 2026
> **🌐 Source:** [Claude](https://claude.ai/...)
> **🏷️ Tags:** Claude, AI-Chat, Noosphere, Anthropic
> **📊 Metadata:** 8 Selected Messages | 4 User | 4 Claude
---

# Chat Title
---

#### Prompt - User 👤:
Your message here

---

#### Response - Claude 🧠:
<details>
<summary><b>🧠 Thinking: Claude's reasoning</b></summary>
> Reasoning content here
</details>

AI response here

---

###### Noosphere Reflect
###### ***Meaning Through Memory***

###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***
```

### JSON

```json
{
  "metadata": {
    "title": "Chat Title",
    "exportedAt": "2026-08-15T17:30:00.000Z",
    "sourceUrl": "https://...",
    "model": "Claude"
  },
  "messages": [
    {
      "role": "user",
      "thinking": null,
      "content": "Your message here"
    },
    {
      "role": "assistant",
      "thinking": {
        "summary": "Claude's reasoning",
        "content": "Reasoning content here"
      },
      "content": "AI response here"
    }
  ]
}
```

Both formats include full Noosphere metadata for seamless import.

---

## 📱 Supported Platforms

| Platform | Script | Hostname | Theme Toggle Method |
|----------|--------|----------|---------------------|
| Mistral Vibe | `mistral-vibe.js` | chat.mistral.ai | `data-theme` / `class` on html/body |
| Claude | `claude-export.js` | claude.ai | Appearance radiogroup (System/Light/Dark) |
| Copilot | `copilot.js` | copilot.microsoft.com | `data-theme` / `class` on html/body |

---

## 📊 File List

```
html-projects/
├── mistral-vibe.js ......... Mistral Vibe exporter (warm cream/orange, 8px/12px radii)
├── claude-export.js ........ Claude exporter (warm canvas/coral, thinking blocks)
├── copilot.js .............. Copilot exporter (Fluent 2 dual-theme, pill geometry)
├── DESIGN.md ............... Design system specification (per-script)
└── README.md ............... This file
```

---

## 🔧 Usage

### Exporting a Conversation

1. **Inject** — Paste the script into the browser console (F12)
2. **Open** — Click the Export button in the platform's header
3. **Select** — Use checkboxes or batch controls (All/User/AI/None) to choose turns
4. **Title** — Enter a custom title in the Chat Title input (optional)
5. **Format** — Select Markdown (.md) or JSON (.json) from the dropdown
6. **Export** — Click **📋 Copy** for clipboard or **⬇️ Save** for file download

### Batch Selection

| Button | Action |
|--------|--------|
| **All** | Select every message |
| **User** | Select only user prompts |
| **AI** | Select only AI responses (including Deep Research) |
| **None** | Deselect all |

### Accordion Expansion

Click any message card to expand an accordion showing the full message text, thinking blocks (Claude), research stepper plans (Mistral Vibe), and discovered sources. Click again to collapse.

---

## 🔒 Privacy & Security

- **No data sent to external servers** — All processing is local
- **No persistent storage** — Session-only collection
- **User control** — You choose which messages to export
- **Metadata preservation** — Source URL, timestamp, and model info attached
- **Clipboard or file** — No data written to disk unless you explicitly download
- **Open source** — Code is transparent and auditable

---

## 🛠️ Technical Details

### How It Works

1. **ThemeManager** detects the page's current theme and injects the correct CSS palette
2. **Header trigger** is injected into the platform's native UI via DOM manipulation
3. **MutationObserver** re-injects the trigger if the platform re-renders its header
4. On click, the **sidebar drawer** slides in from the right with a backdrop overlay
5. **DOM extraction** scans the conversation for user messages, AI responses, thinking blocks, and Deep Research reports
6. **Recursive parser** converts the DOM tree to clean Markdown
7. **Export service** builds the frontmatter metadata and assembles the final document
8. **Copy** writes to clipboard; **Save** triggers a browser file download

### Theme Switching Flow

```
User toggles page theme
        │
        ▼
MutationObserver / 500ms poll fires
        │
        ▼
ThemeManager.detect() → 'dark' (or 'light')
        │
        ▼
ThemeManager.apply('dark')
        │
        ├── Remove old <style> element
        ├── Set CONFIG.THEME = CONFIG.THEMES.dark
        ├── injectStyles() — re-inject CSS with dark palette
        └── renderMessageList() — re-render cards with new inline styles
```

---

## 🐛 Troubleshooting

### Sidebar not appearing?
1. Check browser console (F12 → Console) for errors
2. Verify the script loaded — look for the initialization log message
3. Ensure the platform's header has rendered (some SPAs load asynchronously)
4. The `MutationObserver` will re-inject the trigger when the header appears

### Theme not switching?
1. Check console for `[Noosphere]` theme detection logs
2. The 500ms poll should catch changes within half a second
3. If stuck in dark mode, the page may use a dark canvas in both modes — text-color luminance detection handles this
4. Try refreshing the page and re-injecting the script

### Export failed?
1. Ensure messages are loaded and visible on the page
2. Select at least one message before exporting
3. Check clipboard permissions for Copy
4. Check browser download settings for Save

---

## 🎯 Use Cases

### Archiving Conversations
- Regular exports to Markdown or JSON
- Import to Noosphere Reflect
- Build a personal knowledge base
- Search & organize by tags and metadata

### Documentation
- Export as Markdown for readability
- Share on GitHub gists or blog posts
- Create reference documentation
- Preserve AI reasoning chains (thinking blocks, Deep Research)

### Data Analysis
- JSON export with structured metadata
- Process with scripts or pipelines
- Analyze conversation patterns
- Track model responses over time

### Sharing
- Markdown for human-readable sharing
- JSON for programmatic import/processing
- Both preserve full context with source URLs
- Noosphere Reflect frontmatter for provenance

---

## 📝 License

MIT License — Use freely in your projects.

---

## ✨ Current State (v3.0)

- ✅ **Native sidebar drawer UI** — Slide-over drawer with batch selection and accordion
- ✅ **DESIGN.md-driven theming** — Each script has a full design system spec
- ✅ **Automatic dark/light detection** — ThemeManager with layered detection strategy
- ✅ **Live theme switching** — Sidebar follows page theme in real time
- ✅ **Deep Research extraction** — Mistral Vibe & Copilot research report parsing
- ✅ **Thinking block expansion** — Claude reasoning chain preservation
- ✅ **Dual export formats** — Markdown + JSON with Noosphere metadata
- ✅ **File download** — Direct browser downloads (no clipboard limits)
- ✅ **Recursive DOM-to-Markdown parser** — Full formatting preservation
- ✅ **Native header trigger injection** — Export button in platform UI
- ✅ **SPA-safe theme detection** — Text-color luminance avoids canvas false positives

---

**Status:** ✅ Ready for Production
**Last Updated:** August 15, 2026
**Version:** 3.0 (Native Sidebar Exporters with DESIGN.md Theming)