# Complete Reference HTML DOM Guide

## 📊 What's in This Directory

### New Clean Reference Files (Created Jan 12, 2026)

These are **cleaned, minimal, well-commented** DOM references extracted from the raw console scraper data:

| File | Size | Platform | Content |
|------|------|----------|---------|
| `claude-console-dom.html` | ~4KB | Claude | Message containers, thought blocks, copy buttons |
| `chatgpt-console-dom.html` | ~5KB | ChatGPT | Turn-based structure, article wrapper, model info |
| `lechat-console-dom.html` | ~8KB | LeChat (Mistral) | User/AI messages, tables, tool execution |
| `gemini-aistudio-console-dom.html` | ~8KB | Gemini | Angular components, expandable thoughts, file tables |
| `grok-console-dom.html` | ~9KB | Grok (xAI) | Code execution, media rendering, container queries |
| `universal-copy-buttons.html` | ~8KB | All Platforms | Copy button implementations across all platforms |
| `MESSAGE-DETECTION-PATTERNS.md` | ~8KB | Reference | Platform comparison & detection strategies |
| `README.md` | ~8KB | Documentation | Quick reference & usage guide |
| `REFERENCE-GUIDE.md` | This file | Index | Complete directory guide |

### Legacy Full DOM Captures (Pre-existing)

These are **large, complete HTML exports** from actual chat sessions—useful for deep analysis but harder to scan:

| File | Size | Platform | Notes |
|------|------|----------|-------|
| `chatgpt-dom.html` | 245KB | ChatGPT | Full conversation with all styling |
| `gemini-dom.html` | 456KB | Gemini | Largest file—entire session DOM |
| `gemini-scrollback-loading-dom.html` | 15KB | Gemini | Scroll/loading state examples |
| `gemini-sidebar.html` | 12KB | Gemini | Sidebar navigation DOM |
| `claude-codeblock-dom.html` | 7KB | Claude | Code block specific |
| `claude-codeblock-larger-dom.html` | 38KB | Claude | Larger code example |
| `claude-single-user-response-with-artifact-dom.html` | 18KB | Claude | Claude artifacts |
| `copilot-chat-dom.html` | 59KB | Copilot | Microsoft Copilot interface |
| `copilot-codeblock-dom.html` | 3KB | Copilot | Copilot code block |

---

## 🎯 Which Files to Use When?

### If you're implementing a scraper:
✅ Use the **clean reference files** (`claude-console-dom.html`, `chatgpt-console-dom.html`, etc.)
- They highlight key selectors
- Include attribute explanations
- Show minimal, clear examples
- Have inline comments for detection patterns

### If you're debugging scraper issues:
✅ Check `MESSAGE-DETECTION-PATTERNS.md` first
- Platform comparison table
- Universal detection strategies
- Implementation guidelines
- Copy button locations

### If you need to update a scraper for platform changes:
✅ Use the **legacy full DOM files** for deep inspection
- See how content is nested in real scenarios
- Check for class name variations
- Verify selector robustness
- Test against actual session structure

### If you're learning the architecture:
✅ Follow this sequence:
1. `README.md` (quick reference)
2. Platform-specific clean file (e.g., `grok-console-dom.html`)
3. `MESSAGE-DETECTION-PATTERNS.md` (strategy overview)
4. `universal-copy-buttons.html` (UI patterns)

---

## 📋 File Purposes at a Glance

### Clean Reference Files (Jan 12 Creation)

```
claude-console-dom.html
├── Chat title button pattern
├── Human prompt message structure
├── AI response message structure
├── Thought block detection (details/summary or <thought> tags)
└── Message action buttons (copy, retry, edit)

chatgpt-console-dom.html
├── Model selector button
├── User message bubble (user-message-bubble-color class)
├── Assistant response container
├── Turn-based structure (data-turn-id, data-turn)
├── Article wrapper for full turn
└── Code block with copy button

lechat-console-dom.html
├── User message (right-aligned with ms-auto)
├── File reference badges
├── Copy buttons (text and icon variations)
├── Code block with language detection
├── Structured grid/table for tool output
└── Tool execution indicators

gemini-aistudio-console-dom.html
├── Angular component markers (_ngcontent-ng-*)
├── User input container (turn input)
├── AI response container (turn output)
├── Expandable thought blocks (lightbulb icon)
├── Generated files table (check icons)
├── Checkpoint/restoration UI
└── Material Design icons (material-symbols-outlined)

grok-console-dom.html
├── Markdown wrapper for all content
├── Embedded thought blocks (non-collapsible <thought> tags)
├── Code execution buttons (Run + Copy)
├── Code syntax highlighting (Shiki theme)
├── Table with sticky headers and container queries
├── Image rendering with aspect-ratio CSS
├── Canvas elements for charts
└── Knowledge cluster suggestion buttons

universal-copy-buttons.html
├── Claude button pattern
├── ChatGPT button with href-based SVG
├── LeChat button variations (text + icon)
├── Grok button with execution controls
├── Gemini button (minimal icon only)
└── Universal pattern explanation with Lucide icons
```

### Documentation Files

```
MESSAGE-DETECTION-PATTERNS.md
├── Platform Comparison Table
├── Claude Detection (data-testid patterns)
├── ChatGPT Detection (turn ID structure)
├── LeChat Detection (alignment classes)
├── Gemini Detection (Angular components)
├── Grok Detection (markdown wrapper)
├── Universal Copy Button Patterns
├── Text Preservation (whitespace-pre-wrap)
├── Thought/Process Detection
└── Implementation Guidelines

README.md
├── File Directory (quick lookup)
├── Quick Reference by Task
│   ├── Finding User Messages
│   ├── Finding AI Responses
│   ├── Finding Copy Buttons
│   └── Finding Thought Blocks
├── Detection Strategy (4-step process)
├── Documentation Breakdown (file-by-file)
├── Usage Examples (code snippets)
├── Maintenance Checklist
└── Learning Path
```

---

## 🔍 Quick Lookups

### "I need to find how Claude detects user messages"
→ Open `claude-console-dom.html`, search for `data-testid="user-message"`

### "What's the copy button pattern for ChatGPT?"
→ Open `universal-copy-buttons.html`, scroll to **CHATGPT COPY CODE BUTTON**

### "How do I detect thought blocks in Gemini?"
→ Open `MESSAGE-DETECTION-PATTERNS.md`, search for **"Thought/Process Detection"**

### "I need the full Gemini session to understand nesting"
→ Open `gemini-dom.html` (456KB legacy file)

### "Which platform uses what icon library?"
→ Open `MESSAGE-DETECTION-PATTERNS.md`, check **"Key Attributes to detect"** sections

### "How does LeChat handle tables?"
→ Open `lechat-console-dom.html`, search for **"TABLE RENDERING"**

---

## 📈 File Organization Strategy

### For Maintenance
New files created are focused, documented references. Legacy files remain for deep analysis.

**New Reference Files** are designed to:
- Answer "what is the pattern?" quickly
- Show minimal working examples
- Include explanatory comments
- Be easier to scan and update

**Legacy Files** serve as:
- Complete real-world examples
- Debugging deep DOM structures
- Testing selector robustness
- Understanding edge cases

### When Platforms Change
1. Check the corresponding clean reference file
2. Verify patterns against legacy file if needed
3. Update the clean reference with new findings
4. Document changes in comments

---

## 📚 Content Breakdown

### Platform Presence

| Platform | Clean Ref | Legacy Files | Total Coverage |
|----------|-----------|--------------|-----------------|
| Claude | ✅ | ✅✅✅ | Excellent |
| ChatGPT | ✅ | ✅ | Good |
| LeChat | ✅ | - | Good |
| Gemini | ✅ | ✅✅✅ | Excellent |
| Grok | ✅ | - | Good |
| Copilot | - | ✅✅ | Basic |
| Others | - | (scattered) | Minimal |

### Coverage by Topic

| Topic | Reference Files |
|-------|-----------------|
| **Message Detection** | All clean refs + MESSAGE-DETECTION-PATTERNS.md |
| **Copy Buttons** | universal-copy-buttons.html + all clean refs |
| **Thought Blocks** | Claude, Gemini, Grok clean refs + MESSAGE-DETECTION-PATTERNS.md |
| **Code Blocks** | grok-console-dom.html, legacy Claude files |
| **Tables/Grids** | lechat-console-dom.html, Grok file |
| **Images/Media** | grok-console-dom.html |
| **File References** | gemini-aistudio-console-dom.html, lechat file |

---

## ✨ Key Features of New References

### 1. **Minimal & Focused**
- Only essential markup, no bloat
- 3-9KB each (vs 15-456KB legacy files)
- Quick to scan and understand

### 2. **Well-Commented**
- Inline explanations of key attributes
- Section headers for quick navigation
- Bottom notes listing detection criteria

### 3. **Platform-Specific**
- Shows real patterns from each platform
- Highlights unique design choices
- Documents platform-specific components

### 4. **Copy Button Coverage**
- All button patterns in one file
- Universal structure explained
- Accessibility attributes documented

### 5. **Pattern Documentation**
- MESSAGE-DETECTION-PATTERNS.md breaks down strategies
- README.md provides quick lookup
- REFERENCE-GUIDE.md (this file) shows how to use them

---

## 🚀 Next Steps for Contributors

### To Maintain These Files
1. When a platform updates its UI, check the corresponding clean reference
2. Update the pattern if class names or structure changes
3. Update MESSAGE-DETECTION-PATTERNS.md with new insights
4. Keep legacy files for historical reference

### To Add New Platforms
1. Create a `{platform}-console-dom.html` file
2. Extract minimal, clean DOM examples
3. Add inline comments for detection patterns
4. Update MESSAGE-DETECTION-PATTERNS.md with new platform section
5. Update README.md quick reference tables

### To Use in Scrapers
1. Reference the appropriate clean DOM file
2. Cross-check against MESSAGE-DETECTION-PATTERNS.md
3. Test against the corresponding legacy file if needed
4. Document any discoveries in the clean reference comments

---

## 📞 References & Related Files

**In This Directory:**
- `claude-console-dom.html` - Claude patterns
- `chatgpt-console-dom.html` - ChatGPT patterns
- `lechat-console-dom.html` - LeChat patterns
- `gemini-aistudio-console-dom.html` - Gemini patterns
- `grok-console-dom.html` - Grok patterns
- `universal-copy-buttons.html` - All copy buttons
- `MESSAGE-DETECTION-PATTERNS.md` - Detection guide
- `README.md` - Quick reference

**Related Project Files:**
- `/extension/content-scripts/` - Uses these patterns
- `/extension/parsers/` - Implements detection
- `/html-doms/` - Source markdown files (raw scraped data)
- `/src/services/converterService.ts` - Consumer of patterns

---

## 📅 Version History

- **Jan 12, 2026**: Created clean reference files and documentation
  - New: `claude-console-dom.html`
  - New: `chatgpt-console-dom.html`
  - New: `lechat-console-dom.html`
  - New: `gemini-aistudio-console-dom.html`
  - New: `grok-console-dom.html`
  - New: `universal-copy-buttons.html`
  - New: `MESSAGE-DETECTION-PATTERNS.md`
  - New: `README.md`
  - New: `REFERENCE-GUIDE.md` (this file)

---

**Happy scraping! 🚀**
