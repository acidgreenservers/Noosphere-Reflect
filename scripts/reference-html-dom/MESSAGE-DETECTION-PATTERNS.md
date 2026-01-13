# AI Chat Platform Message Detection Patterns

This document provides consolidated detection patterns for extracting messages from various AI chat interfaces.

## Platform Comparison

### Claude (Anthropic)
**User Message Detection:**
- `data-testid="user-message"` - Primary selector
- Container: `class*="bg-bg-300"` - Light gray background
- Wrapper: `class*="rounded-xl"` - Rounded message bubble
- Text: `class*="whitespace-pre-wrap"` - Preserves formatting

**Claude Response Detection:**
- `data-testid="assistant-message"` - Primary selector
- Container: `class*="bg-bg-200"` - Slightly different background
- Thought blocks: `<details>`, `<summary>` or `<thought>` tags (collapsible)

**Copy Button:**
```html
<button aria-label="Copy message" class="flex gap-1 items-center">
  <svg class="lucide lucide-copy">...</svg>
</button>
```

---

### ChatGPT (OpenAI)
**User Message Detection:**
- Container: `class="user-message-bubble-color"` - User-specific styling
- Shape: `rounded-[18px]` - Specific border radius
- Max width: `max-w-[var(--user-chat-width,70%)]`
- Text container: `class="whitespace-pre-wrap"`

**Assistant Message Detection:**
- `data-message-author-role="assistant"`
- `data-message-id="*"` - Unique message ID
- `data-turn-id="*"` - Conversation turn ID
- Container: `class="text-message"`
- Model info: `data-message-model-slug="gpt-*"`

**Article Wrapper:**
- `data-turn="assistant"` or `data-turn="user"`
- `data-testid="conversation-turn-*"`
- Semantic: `<article>` tag with turn metadata

**Copy Button:**
```html
<button aria-label="Copy">
  <svg href="/cdn/assets/sprites-core-i9agxugi.svg#ce3544"></svg>
  Copy code
</button>
```

---

### LeChat (Mistral)
**User Message Detection:**
- Alignment: `class="ms-auto"` - Right-aligned (user)
- Container: `rounded-3xl` - Pill-shaped message
- Background: `bg-basic-gray-alpha-4` - Semi-transparent gray
- Direction: `dir="auto"`

**LeChat Response Detection:**
- Alignment: `class="me-auto"` or starts with icon
- Contains tool execution indicators
- Structured grid for complex outputs
- Tables with: `role="table"`, `role="columnheader"`, `role="cell"`

**File References:**
```html
<span class="mx-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-state-soft">
  <svg class="lucide lucide-file-text"></svg>
  <span>File Name</span>
</span>
```

**Copy Button:**
```html
<button aria-label="Copy to clipboard" class="bg-state-ghost text-default rounded-md h-8 w-8">
  <svg class="lucide lucide-copy"></svg>
</button>
```

---

### Gemini / AI Studio (Google)
**User Message Detection:**
- Container: `class="turn input ng-star-inserted"`
- Header: `class="turn-header"` with role="heading"
- Component: `<ms-console-turn>`
- Node wrapper: `<ms-cmark-node>`

**Gemini Response Detection:**
- Container: `class="turn output ng-star-inserted"`
- Model info: Header with duration and model name
- Thought blocks: `<ms-expandable-turn>` with lightbulb icon
- Component: `<ms-cmark-node>` with inline code support

**Expandable Thoughts:**
```html
<ms-expandable-turn>
  <div class="container outlined interactive expandable expanded">
    <div class="header">
      <span class="material-symbols-outlined">lightbulb</span>
      <span>Thought for X seconds</span>
      <span class="expand-icon">chevron_right</span>
    </div>
    <div class="content ng-star-inserted">
      <!-- Thought content -->
    </div>
  </div>
</ms-expandable-turn>
```

**Generated Files Table:**
```html
<ms-console-generation-table class="ng-star-inserted">
  <div class="generation-table">
    <ms-console-generation-table-row>
      <button class="gt-path">file-name.ext</button>
      <span class="material-symbols-outlined">check_circle</span>
    </ms-console-generation-table-row>
  </div>
</ms-console-generation-table>
```

**Copy Button:**
```html
<button aria-label="Copy table" class="bg-state-ghost rounded-md size-7">
  <svg class="lucide lucide-copy size-[18px]"></svg>
</button>
```

---

### Grok (xAI)
**User Message Detection:**
- Container: `class="relative response-content-markdown markdown"`
- Direction: `dir="auto"`
- Node: `node="[object Object]"` (React dev attribute)
- Text preservation: `style="white-space: pre-wrap;"`

**Grok Response Detection:**
- Same markdown wrapper as user
- Thought blocks: `<thought>...</thought>` tags (embedded, not collapsible)
- Code blocks with execution buttons
- Tables with sticky headers
- Images with aspect-ratio CSS

**Code Block with Execution:**
```html
<div class="not-prose @container/code-block">
  <div class="border rounded-xl">
    <div class="flex items-center rounded-t-xl bg-black">
      <span class="font-mono text-xs">Language</span>
    </div>
    <div class="absolute bottom-1 right-1 flex gap-0.5">
      <button aria-label="Run">
        <svg class="lucide lucide-play"></svg>
      </button>
      <button aria-label="Copy">
        <svg></svg>
      </button>
    </div>
    <code class="language-*">content</code>
  </div>
</div>
```

**Table Detection:**
- `dir="auto"` on table
- `class="w-fit min-w-[calc(...)]"`
- `data-col-size="md"`, `"lg"` attributes
- Sticky headers with CSS variables
- Adjacent sibling styling: `[&_div+div]:!mt-0`

---

## Universal Detection Patterns

### Message Container Structure
```
Container (aligned)
├── Header/Model Info (optional)
├── Content Wrapper
│   ├── Markdown/Formatted Text
│   └── Code Blocks / Tables / Media
└── Action Buttons
    ├── Copy
    ├── Edit (user message)
    └── Retry (AI message)
```

### Copy Button Universal Attributes
- Always a `<button type="button">` element
- `aria-label="Copy [type]"` - Accessibility
- Lucide icon: `<svg class="lucide lucide-copy">`
  - Fallback: Platform-specific SVG with `use` element
- Hover state: `hover:bg-*` or `hover:text-*`
- Size: `h-8`, `h-6`, `size-7` patterns
- Optional text label (hidden on small screens)

### Text Preservation Patterns
- `class="whitespace-pre-wrap"` - Preserves line breaks and spaces
- `style="white-space: pre-wrap;"` - Inline style equivalent
- `[p,div]:whitespace-pre-line` - Tailwind pseudo-class variant
- Important for code and formatted content

### Thought/Process Detection
1. **Claude**: `<details>`, `<summary>` tags or `<thought>` wrappers
2. **Gemini**: `<ms-expandable-turn>` with lightbulb icon + "Thought for X seconds"
3. **Grok**: `<thought>...</thought>` embedded inline text
4. **ChatGPT**: No explicit thought blocks (handled differently)
5. **LeChat**: Tool execution indicators with icons

---

## Implementation Guidelines

### For Scrapers:
1. **Identify platform** by unique selectors:
   - Claude: `data-testid="user-message"`
   - ChatGPT: `data-turn-id`, `corner-superellipse/1.1`
   - LeChat: `bg-basic-gray-alpha-4`, `rounded-3xl`
   - Gemini: `ng-star-inserted`, `<ms-console-turn>`
   - Grok: `response-content-markdown markdown`, Lucide icons

2. **Extract messages** in conversation order (top to bottom)

3. **Preserve formatting**:
   - Extract text content with whitespace
   - Keep markdown syntax intact
   - Preserve code block language identifiers
   - Capture table structure

4. **Detect and handle special content**:
   - Thought blocks / expandable sections
   - Code blocks (with language detection)
   - Tables (detect headers and rows)
   - Images (capture URLs and alt text)
   - Links (preserve href and text)

5. **Copy buttons** appear in:
   - Above user prompts (hover state on LeChat)
   - Inside code block headers (all platforms)
   - As standalone action buttons (varies by platform)

---

## File References

- `claude-console-dom.html` - Claude-specific DOM examples
- `chatgpt-console-dom.html` - ChatGPT DOM examples with article structure
- `lechat-console-dom.html` - LeChat DOM with grid/table examples
- `gemini-aistudio-console-dom.html` - Gemini with Angular components and thought blocks
- `grok-console-dom.html` - Grok with code execution and container queries
- `universal-copy-buttons.html` - All copy button implementations
