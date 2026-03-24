# Noosphere Reflect - Console Scraper Scripts

Collection of console scripts for exporting chat conversations from AI platforms with full Noosphere metadata.

## 📋 What's Here?

### New Universal Approach ✨

**`universal-native-scraper.js`** (Works Everywhere)
- Works on ALL platforms (Claude, ChatGPT, Gemini, LeChat, Grok)
- Uses native copy buttons (robust to UI changes)
- Interactive menu + keyboard shortcuts
- Export formats: JSON & Markdown
- Automatic platform detection

### Individual Platform Native Scripts ✨ (NEW v2.1)

**`claude-native-scraper.js`** - Claude-optimized native copy button scraper
**`chatgpt-native-scraper.js`** - ChatGPT-optimized native copy button scraper
**`gemini-native-scraper.js`** - Gemini-optimized native copy button scraper (with thinking blocks)
**`lechat-native-scraper.js`** - LeChat-optimized native copy button scraper
**`grok-native-scraper.js`** - Grok-optimized native copy button scraper

**Why individual scripts?** For maximum granularity when platforms are stubborn. Each script has:
- Platform-specific hardcoded selectors (no detection overhead)
- Full Noosphere metadata integration
- Interactive menu + keyboard shortcuts
- Both JSON & Markdown export
- Streamlined code for reliability

Use these when you need guaranteed compatibility with a specific platform.

### Legacy Platform-Specific Scripts

**`claude-scraper.js`** - Fast Claude-only extraction (DOM-based)
**`chatgpt-scraper.js`** - Fast ChatGPT-only extraction (DOM-based)
**`gemini-scraper.js`** - Fast Gemini-only extraction (DOM-based)

Use these for quick, automatic collection if you prefer direct DOM extraction.

**Documentation:**
- `QUICKSTART.md` - 30-second setup guide
- `NATIVE-BUTTON-STRATEGY.md` - Full technical details
- `SCRAPER-STRATEGIES.md` - Comparison of all approaches

---

## 🚀 Quick Start

### 30 Seconds to Export

1. Open chat in Claude, ChatGPT, Gemini, LeChat, or Grok
2. Press `F12` → go to **Console** tab
3. Copy entire content of `universal-native-scraper.js`
4. Paste into console, press Enter
5. Menu appears bottom-right (📋 Noosphere)
6. Click copy buttons or use menu options
7. Export as JSON or Markdown
8. Paste into Noosphere Reflect

**Keyboard Shortcuts:**
- `Ctrl+Shift+E` → Export all as JSON
- `Ctrl+Shift+M` → Export all as Markdown

👉 See `QUICKSTART.md` for details

---

## 🎯 Which Script to Use?

| Need | Script | Why |
|------|--------|-----|
| **All platforms, one script** | `universal-native-scraper.js` | Auto-detects, works everywhere |
| **Maximum platform compatibility** | `[platform]-native-scraper.js` | Hardcoded selectors, no detection |
| **Fast export, JSON only** | `[platform]-scraper.js` (legacy) | Direct DOM extraction |
| **Markdown export** | `universal-native-scraper.js` or `-native-` | Built-in format |
| **User controls collection** | `universal-native-scraper.js` or `-native-` | Interactive menus |
| **Automatic bulk grab** | `[platform]-scraper.js` (legacy) | One-click export |
| **Specific platform guaranteed** | `[platform]-native-scraper.js` | No multi-platform overhead |

---

## 📊 Comparison

### Universal Native (`universal-native-scraper.js`)
```
✅ One script for all platforms
✅ Interactive menu system
✅ JSON + Markdown export
✅ Intercepts native copy buttons
✅ Auto platform detection
⚠️ Requires user interaction
⚠️ Multi-platform detection overhead
```

### Individual Platform Native (NEW v2.1) (`[platform]-native-scraper.js`)
```
✅ Platform-specific optimization
✅ Interactive menu system
✅ JSON + Markdown export
✅ Intercepts native copy buttons
✅ Hardcoded selectors (no detection)
✅ Streamlined for reliability
⚠️ Requires separate script per platform
⚠️ Requires user interaction
```

### Platform-Specific Legacy (`[platform]-scraper.js`)
```
✅ Very fast (direct DOM query)
✅ Automatic collection
✅ Simple one-button export
⚠️ Need separate script per platform
⚠️ Breaks if DOM changes
⚠️ Legacy approach
```

---

## 📄 Export Formats

### JSON
```json
{
  "messages": [
    {"type": "prompt", "content": "...", "timestamp": "..."},
    {"type": "response", "content": "...", "timestamp": "..."}
  ],
  "metadata": {
    "title": "Chat Title",
    "model": "Claude",
    "date": "2026-01-12T...",
    "tags": ["claude", "export"],
    "sourceUrl": "https://...",
    "platform": "claude"
  },
  "exportedBy": {
    "tool": "Noosphere Reflect",
    "version": "Universal Native Scraper v2.0",
    "method": "native-copy-button-intercept"
  }
}
```

### Markdown
```markdown
# Chat Title
**Platform:** Claude | **Date:** Jan 12, 2026

---

## 👤 User
Your message here

---

## 🤖 Assistant  
AI response here

---

*Exported by Noosphere Reflect - Universal Native Scraper v2.0*
```

Both formats include full Noosphere metadata for seamless import.

---

## 🔧 Usage

### Method 1: Interactive Collection (Native)
1. Run `universal-native-scraper.js`
2. Click copy buttons naturally
3. Script collects in background
4. Export when ready

**Best for:** Selective messages, privacy-conscious users

### Method 2: Automatic Collection (Legacy)
1. Run platform-specific script
2. Gets all messages instantly
3. One-click export to clipboard

**Best for:** Quick exports, complete conversations

### Method 3: Bulk Collect (Native)
1. Run `universal-native-scraper.js`
2. Click "Collect from Page" menu option
3. All visible messages collected
4. Export format of choice

**Best for:** Mixed approach, flexibility

---

## 📱 Supported Platforms

| Platform | Hostname | Support |
|----------|----------|---------|
| Claude | claude.ai | ✅ Full |
| ChatGPT | chatgpt.com | ✅ Full |
| Gemini | gemini.google.com | ✅ Full |
| LeChat | chat.mistral.ai | ✅ Full |
| Grok | grok.com, x.com | ✅ Full |

Universal scraper auto-detects platform from URL and DOM markers.

---

## 🎨 Features

### Universal Native Scraper (`universal-native-scraper.js`)
- **Auto Platform Detection** - Works on any supported platform
- **Native Button Interception** - Uses platform's own UI
- **Interactive Menu** - Clean UI with options
- **Keyboard Shortcuts** - Quick export without menu
- **Multiple Export Formats** - JSON or Markdown
- **Status Feedback** - Visual feedback on actions
- **Graceful Fallbacks** - Handles DOM changes well
- **Full Metadata** - Attachs Noosphere export info

### Individual Platform Native Scripts (NEW v2.1)
- **Platform-Optimized Selectors** - Hardcoded for each platform
- **Native Button Interception** - Uses platform's own UI
- **Interactive Menu** - Clean UI with options
- **Keyboard Shortcuts** - Quick export without menu (Ctrl+Shift+E/M)
- **Multiple Export Formats** - JSON or Markdown
- **Streamlined Code** - No multi-platform detection overhead
- **Status Feedback** - Visual feedback on actions
- **Full Metadata** - Attachs Noosphere export info
- **Platform Brand Colors** - Claude purple, ChatGPT teal, Gemini green, LeChat blue, Grok pink

### Legacy Platform-Specific Scripts
- **Fast Extraction** - Direct DOM query
- **Automatic Collection** - Gets all messages
- **Simple Interface** - Single button export
- **JSON Output** - Noosphere-compatible format
- **Platform-Optimized** - Uses best selectors

---

## 🛠️ Technical Details

### How It Works (Universal Native)
1. Detects platform automatically
2. Injects interactive menu UI
3. Listens for clicks on native copy buttons
4. Intercepts events to capture message context
5. Stores collected messages with metadata
6. Exports in chosen format
7. Copies to clipboard

### How It Works (Platform-Specific)
1. Uses platform-specific CSS selectors
2. Queries DOM for all message elements
3. Extracts text via `innerText`
4. Creates Noosphere JSON structure
5. Copies to clipboard immediately

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `QUICKSTART.md` | 30-second setup, quick reference |
| `NATIVE-BUTTON-STRATEGY.md` | Full technical documentation |
| `SCRAPER-STRATEGIES.md` | Comparison & decision guide |
| `README.md` | This file - overview |

---

## 🐛 Troubleshooting

### Script not working?
1. Check browser console (F12 → Console)
2. Look for `[Noosphere]` messages
3. Verify messages are loaded on page
4. Try `Collect from Page` option

### Export failed?
1. Check browser console for errors
2. Ensure messages were collected
3. Try smaller batch
4. Verify clipboard permissions

### Wrong platform detected?
1. Universal script auto-detects
2. Falls back to generic selectors
3. "Collect from Page" works as fallback
4. Report if consistently failing

See `NATIVE-BUTTON-STRATEGY.md` for more troubleshooting.

---

## 🎯 Use Cases

### Archiving Conversations
- Regular exports to JSON
- Import to Noosphere Reflect
- Build personal knowledge base
- Search & organize by tags

### Documentation
- Export as Markdown
- Share on GitHub gists
- Use in blog posts
- Create reference docs

### Data Analysis
- JSON export with metadata
- Process with scripts
- Analyze conversation patterns
- Track model responses

### Sharing
- Markdown for readability
- JSON for import/processing
- Both preserve full context
- With source URL reference

---

## 🔒 Privacy & Security

- **No data sent to external servers** - All processing local
- **No persistent storage** - Session-only collection
- **User control** - You choose what's collected
- **Metadata preservation** - Know where data comes from
- **Clipboard only** - No files written locally
- **Open source** - Code is transparent

---

## 🚀 Advanced

### Combine Multiple Exports
```javascript
// Merge multiple JSON exports
const combined = {
  messages: [...export1.messages, ...export2.messages],
  metadata: export1.metadata,
  exportedBy: {...}
};
```

### Export to File
```javascript
// Save JSON to file
const blob = new Blob([json], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'chat-export.json';
a.click();
```

### Validate Export
```javascript
// Check JSON validity
try {
  JSON.parse(exportedText);
  console.log('✅ Valid JSON');
} catch(e) {
  console.error('❌ Invalid JSON:', e);
}
```

---

## 📊 File List

```
noosphere-scrapers/
├── universal-native-scraper.js ........... All platforms, native approach
│
├── INDIVIDUAL PLATFORM NATIVE SCRAPERS (NEW v2.1)
├── claude-native-scraper.js .............. Claude platform-specific
├── chatgpt-native-scraper.js ............. ChatGPT platform-specific
├── gemini-native-scraper.js .............. Gemini platform-specific
├── lechat-native-scraper.js .............. LeChat platform-specific
├── grok-native-scraper.js ................ Grok platform-specific
│
├── LEGACY PLATFORM-SPECIFIC SCRAPERS
├── claude-scraper.js ..................... Legacy Claude extraction
├── chatgpt-scraper.js .................... Legacy ChatGPT extraction
├── gemini-scraper.js ..................... Legacy Gemini extraction
│
├── DOCUMENTATION
├── QUICKSTART.md ......................... Quick reference guide
├── NATIVE-BUTTON-STRATEGY.md ............. Full technical docs
├── SCRAPER-STRATEGIES.md ................. Comparison guide
├── NOOSPHERE-METADATA-FORMAT.md .......... Metadata specification
├── EXPORT-FORMAT-EXAMPLES.md ............. Real-world examples
└── README.md ............................ This file
```

---

## 🤝 Contributing

Found an issue or have improvements?
1. Test on your platform
2. Document what happened
3. Note browser & platform info
4. Share findings

Interested in adding support for:
- New platforms (Perplexity, Copilot, etc.)
- New export formats (CSV, YAML, PDF)
- Browser extension integration
- Advanced features (filtering, merging)

---

## 📝 License

MIT License - Use freely in your projects

---

## 🎓 Learning Resources

- **DOM Reference:** `/reference-html-dom/` - Platform DOM patterns
- **Converter Service:** `/src/services/converterService.ts` - Import logic
- **Extension Code:** `/extension/` - Browser extension implementation

---

## ✨ What's New (v2.1)

- ✅ NEW: Individual platform-specific native scrapers
  - `claude-native-scraper.js` (Claude-optimized)
  - `chatgpt-native-scraper.js` (ChatGPT-optimized)
  - `gemini-native-scraper.js` (Gemini-optimized with thinking blocks)
  - `lechat-native-scraper.js` (LeChat-optimized)
  - `grok-native-scraper.js` (Grok-optimized)
- ✅ Hardcoded selectors for maximum reliability
- ✅ Platform brand color theming
- ✅ Same Noosphere metadata integration across all scripts
- ✅ Streamlined for better performance

## ✨ Previous Release (v2.0)

- ✅ Universal script for all platforms
- ✅ Native button interception (more robust)
- ✅ Markdown export support
- ✅ Interactive menu system
- ✅ Keyboard shortcuts
- ✅ Auto platform detection
- ✅ Better error handling
- ✅ Comprehensive documentation

---

## 📞 Support

**Quick Questions?** → See `QUICKSTART.md`
**Technical Details?** → See `NATIVE-BUTTON-STRATEGY.md`
**Comparing Approaches?** → See `SCRAPER-STRATEGIES.md`
**Issues?** → Check troubleshooting section

---

**Status:** ✅ Ready for Production
**Last Updated:** January 12, 2026
**Version:** 2.1 (Universal + Individual Platform Native Scrapers)
