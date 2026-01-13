# HTML DOM Reference Library

This directory contains clean, well-documented HTML DOM structure examples extracted from AI chat platform console scrapers. These references are essential for maintaining and extending the extension's content extraction capabilities.

## 📋 File Directory

### Platform-Specific DOM References

| File | Platform | Purpose |
|------|----------|---------|
| `claude-console-dom.html` | Claude (Anthropic) | Claude chat interface DOM patterns |
| `chatgpt-console-dom.html` | ChatGPT (OpenAI) | ChatGPT chat interface with turn IDs |
| `lechat-console-dom.html` | LeChat (Mistral) | LeChat DOM with grid/table examples |
| `gemini-aistudio-console-dom.html` | Gemini (Google) | AI Studio interface with Angular components |
| `grok-console-dom.html` | Grok (xAI) | Grok with code execution and media |

### Universal Reference Files

| File | Purpose |
|------|---------|
| `universal-copy-buttons.html` | All copy button implementations across platforms |
| `MESSAGE-DETECTION-PATTERNS.md` | Consolidated detection strategies and patterns |
| `README.md` | This file - documentation index |

---

## 🎯 Quick Reference by Task

### Finding User Message Patterns

**Claude:**
```html
<div data-testid="user-message" class="...bg-bg-300...rounded-xl...">
```

**ChatGPT:**
```html
<div class="user-message-bubble-color corner-superellipse/1.1 rounded-[18px]">
```

**LeChat:**
```html
<div class="ms-auto flex rounded-3xl bg-basic-gray-alpha-4 ...">
```

**Gemini:**
```html
<div class="turn input ng-star-inserted">
  <div class="turn-header">User</div>
  <ms-console-turn>...</ms-console-turn>
</div>
```

**Grok:**
```html
<div class="relative response-content-markdown markdown ...">
  <p dir="auto">user message text</p>
</div>
```

---

### Finding AI Response Patterns

**Claude:**
```html
<div data-testid="assistant-message" class="...bg-bg-200...">
```

**ChatGPT:**
```html
<article data-turn="assistant" data-turn-id="..." data-testid="conversation-turn-*">
```

**LeChat:**
```html
<div class="flex flex-col pb-6"><!-- Content with me-auto alignment or icon --></div>
```

**Gemini:**
```html
<div class="turn output ng-star-inserted">
  <div class="turn-header">Gemini 2.5 Pro</div>
  <ms-console-turn>...</ms-console-turn>
</div>
```

**Grok:**
```html
<div class="relative response-content-markdown markdown ...">
  <p dir="auto">response text</p>
</div>
```

---

### Finding Copy Buttons

All platforms use similar button patterns. See `universal-copy-buttons.html` for complete examples.

**Universal Pattern:**
```html
<button type="button" aria-label="Copy [type]">
  <svg class="lucide lucide-copy">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
  </svg>
</button>
```

**Locations where copy buttons appear:**
1. Above user prompts (hover state - especially LeChat)
2. Inside code block headers
3. Next to table/grid components
4. As standalone message action buttons

---

### Finding Thought Blocks

**Claude:**
```html
<details class="group">
  <summary>Thinking...</summary>
  <div class="mt-2 pl-4">thought content</div>
</details>
```

**Gemini:**
```html
<ms-expandable-turn>
  <div class="header">
    <span class="material-symbols-outlined">lightbulb</span>
    <span>Thought for X seconds</span>
  </div>
  <div class="content">thought content</div>
</ms-expandable-turn>
```

**Grok:**
```html
<thought>
Raw thought content as embedded text, not collapsible
</thought>
```

---

## 🔍 Detection Strategy

### Step 1: Platform Identification
Use unique selectors to identify which platform you're scraping:

- **Claude**: `data-testid="chat-title-button"`, `data-testid="user-message"`
- **ChatGPT**: `data-turn-id`, `corner-superellipse/1.1`, `user-message-bubble-color`
- **LeChat**: `bg-basic-gray-alpha-4`, `rounded-3xl`, `ms-auto`
- **Gemini**: `ng-star-inserted`, `<ms-console-turn>`, `class="turn input"`
- **Grok**: `response-content-markdown markdown`, Lucide icon classes

### Step 2: Extract Messages in Order
1. Traverse DOM tree top-to-bottom
2. For each message container, extract:
   - Role (user/assistant)
   - Timestamp (if available)
   - Content with formatting preserved
   - Any embedded components (code blocks, tables, images)

### Step 3: Handle Special Content
- **Code blocks**: Extract language identifier and content
- **Tables**: Preserve row/column structure
- **Images**: Capture `src` and `alt` attributes
- **Thoughts**: Detect and preserve as collapsible or inline
- **Links**: Extract `href` and anchor text

### Step 4: Extract Copy Buttons
- Locate buttons with `aria-label="Copy*"` or `lucide lucide-copy` SVG
- Record position relative to content
- Extract button classes for styling consistency

---

## 📝 Documentation Breakdown

### `claude-console-dom.html`
- Chat title button styling
- Human prompt message container
- AI response with optional thought blocks
- Message action buttons (copy, retry, edit)
- Key attributes for detection

### `chatgpt-console-dom.html`
- Model selector button
- User message bubble with specific border-radius
- AI response container with article wrapper
- Turn-based message structure
- Code block rendering

### `lechat-console-dom.html`
- User message with right alignment (`ms-auto`)
- File reference badges
- Copy buttons at message level
- Code block with syntax highlighting
- Structured grid for tool output

### `gemini-aistudio-console-dom.html`
- Angular component structure (`_ngcontent-ng-*`)
- User/AI message containers with semantic roles
- Expandable thought blocks with lightbulb icon
- Generated files table with icons
- Material Design components

### `grok-console-dom.html`
- Markdown wrapper for all content
- Embedded thought blocks (non-collapsible)
- Code execution buttons (Run + Copy)
- Table with container queries and sticky headers
- Image rendering with aspect-ratio CSS
- Knowledge cluster suggestion buttons

### `universal-copy-buttons.html`
- Copy button for all platforms
- Lucide icon SVG definitions
- Tailwind class patterns
- Size and state variations
- Accessibility attributes

### `MESSAGE-DETECTION-PATTERNS.md`
- Consolidated detection patterns
- Platform comparison table
- Message container structure
- Copy button universal attributes
- Implementation guidelines
- File references

---

## 🛠️ Usage Examples

### In Extension Content Scripts
```javascript
// Detect platform
const platform = detectPlatform();

// Get detection patterns
const patterns = getPatternsFor(platform);

// Extract messages
const messages = document.querySelectorAll(patterns.messageSelector);

messages.forEach(msg => {
  const content = extractContent(msg, patterns);
  const copyBtn = findCopyButton(msg);
  // Process...
});
```

### In Scraper Testing
```javascript
// Load reference DOM
const reference = document.querySelector('[data-testid="user-message"]');

// Compare with scraped content
const scraped = scrapeUserMessage();

console.assert(
  scraped.role === 'user',
  'Message role extraction failed'
);
```

---

## ✅ Maintenance Checklist

When updating scrapers:

- [ ] Compare scraped DOM with reference files
- [ ] Verify all key attributes are present
- [ ] Check for platform-specific class name changes
- [ ] Update reference files if platform UI changes
- [ ] Test copy button detection
- [ ] Verify thought block detection (where applicable)
- [ ] Check code block language identification
- [ ] Test table/grid preservation

---

## 🔗 Related Files

- **Extension Content Scripts**: `/extension/content-scripts/`
- **HTML Parsers**: `/extension/parsers/`
- **DOM Samples (raw)**: `/html-doms/` (source markdown files)
- **Converter Service**: `/src/services/converterService.ts` (consumer of these patterns)

---

## 📚 Additional Resources

- **MESSAGE-DETECTION-PATTERNS.md** - Deep dive into detection strategies
- **Platform-specific files** - Detailed DOM examples with comments
- **universal-copy-buttons.html** - All button variations in one place

---

## 🎓 Learning Path

1. Start with `MESSAGE-DETECTION-PATTERNS.md` for overview
2. Review platform-specific files for your target platform
3. Check `universal-copy-buttons.html` for UI element patterns
4. Use references when implementing or debugging scrapers
5. Update files when platforms change

---

Last Updated: 2026-01-12
