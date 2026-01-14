# Quick Start - Noosphere Native Scraper

## 30-Second Setup

### Step 1: Copy the Script
Get the content of `universal-native-scraper.js`

### Step 2: Paste into Console
1. Open your AI chat (Claude, ChatGPT, Gemini, LeChat, Grok)
2. Press `F12` (or `Ctrl+Shift+I` on Linux)
3. Go to **Console** tab
4. Paste the entire script
5. Press **Enter**

### Step 3: Menu Appears
Look for **"📋 Noosphere"** button in bottom-right corner

### Step 4: Collect Messages
**Option A (Interactive):**
- Click native "Copy" buttons on messages
- Script auto-collects in background

**Option B (Bulk):**
- Click menu → "🔗 Collect from Page"
- Gets all visible messages at once

### Step 5: Export
Click menu → Choose format:
- **📄 Copy as JSON** - Import to Noosphere Reflect
- **📝 Copy as MD** - Markdown for documentation

### Step 6: Paste Anywhere
The exported text is already in clipboard!

---

## Features at a Glance

| Feature | Shortcut/Command |
|---------|-----------------|
| Export JSON | `Ctrl+Shift+E` or Menu → 📄 |
| Export Markdown | `Ctrl+Shift+M` or Menu → 📝 |
| Collect All | Menu → 🔗 Collect from Page |
| Help | Menu → ❓ Help |
| Toggle Menu | Click 📋 Noosphere button |

---

## What Gets Exported

### JSON Format
```json
{
  "messages": [
    {
      "type": "prompt",
      "content": "Your message here",
      "timestamp": "2026-01-12T22:30:00Z",
      "isEdited": false,
      "platform": "claude"
    },
    {
      "type": "response",
      "content": "AI response here",
      "timestamp": "2026-01-12T22:30:05Z",
      "isEdited": false,
      "platform": "claude"
    }
  ],
  "metadata": {
    "title": "Chat Title",
    "model": "Claude",
    "date": "2026-01-12T22:36:00Z",
    "tags": ["claude", "export"],
    "sourceUrl": "https://claude.ai/chat/...",
    "platform": "claude"
  },
  "exportedBy": {
    "tool": "Noosphere Reflect",
    "version": "Universal Native Scraper v2.0",
    "method": "native-copy-button-intercept"
  }
}
```

### Markdown Format
```markdown
# Chat Title
**Platform:** Claude | **Date:** Jan 12, 2026
**Source:** [https://claude.ai/chat/...](...)

---

## 👤 User
Your message here

---

## 🤖 Assistant
AI response here

---

*Exported by Noosphere Reflect - Universal Native Scraper v2.0*
```

---

## Supported Platforms

✅ **Claude** - claude.ai
✅ **ChatGPT** - chatgpt.com
✅ **Gemini** - gemini.google.com
✅ **LeChat** - chat.mistral.ai
✅ **Grok** - grok.com / x.com

---

## Common Issues & Fixes

### "No messages found"
- Refresh the page and load conversation
- Scroll up to load earlier messages
- Try "Collect from Page" from menu

### "Copy button not working"
- Native button might have changed
- Use "Collect from Page" as fallback
- Check browser console (F12 → Console)

### "Exported text includes button labels"
- Auto-cleaned in extraction
- Manual cleanup may be needed
- Report if happening consistently

### "Wrong platform detected"
- Script auto-detects from hostname and DOM
- Falls back gracefully
- Try "Collect from Page" with generic selectors

---

## Next: Import to Noosphere Reflect

Once you have JSON or Markdown exported:

### Option 1: Basic Converter (Paste)
1. Go to Noosphere Reflect
2. Click "Basic Converter"
3. Paste JSON or Markdown
4. Process & export

### Option 2: Batch Import
1. Go to Archive Hub
2. Click "Batch Import"
3. Paste JSON file
4. Select multiple files
5. Import all at once

### Option 3: Manual Entry
1. Copy JSON
2. Manually enter in Noosphere Reflect UI
3. Customize metadata if needed

---

## Tips & Tricks

**Tip 1: Selective Collection**
- Click individual "Copy" buttons
- Only the messages you want are collected
- Perfect for extracting specific parts of conversation

**Tip 2: Combine Multiple Exports**
- Run script in multiple chat windows
- Export each separately
- Manually combine JSONs later
- Or use Batch Import feature

**Tip 3: Markdown for Sharing**
- Export as Markdown
- Perfect for GitHub gists
- Easy to share in documentation
- Human-readable format

**Tip 4: Keep Source URL**
- Exported JSON includes sourceUrl
- Can trace back to original conversation
- Useful for archiving

**Tip 5: Keyboard Shortcuts**
- After messages collected
- `Ctrl+Shift+E` exports as JSON instantly
- `Ctrl+Shift+M` exports as Markdown instantly
- No menu clicks needed

---

## Troubleshooting Console

If something goes wrong, check the browser console for error messages:

```javascript
// Look for lines starting with [Noosphere]
[Noosphere] Initializing on Claude
[Noosphere] Native button intercepted: {type: 'prompt', ...}
[Noosphere] Copied 5 messages as JSON!
```

**Common Console Outputs:**
- ✅ `[Noosphere] Initializing on [Platform]` - Script loaded
- ✅ `[Noosphere] Native button intercepted` - Message collected
- ❌ `[Noosphere] Platform not detected` - Auto-detection failed
- ❌ `[Noosphere] Copy failed: ...` - Clipboard error

---

## Advanced Usage

### Export to File
```javascript
// In console, after exporting:
const blob = new Blob([jsonString], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'chat-export.json';
a.click();
```

### Combine Multiple Exports
```javascript
// JavaScript to merge JSON exports
const combined = {
  messages: [
    ...export1.messages,
    ...export2.messages,
    ...export3.messages
  ],
  metadata: export1.metadata,
  exportedBy: {
    tool: 'Noosphere Reflect',
    version: 'Universal Native Scraper v2.0',
    method: 'manual-merge'
  }
};
```

### Validate JSON
```javascript
// In console:
try {
  JSON.parse(copiedText);
  console.log('✅ Valid JSON');
} catch(e) {
  console.error('❌ Invalid JSON:', e);
}
```

---

## When to Use Which Format

### Use JSON When:
- Importing to Noosphere Reflect
- Batch processing multiple chats
- Archiving with full metadata
- Automated workflows

### Use Markdown When:
- Sharing in documentation
- Creating GitHub gists
- Human-readable transcripts
- Blog posts or articles
- Print-friendly format

---

## Report Issues

If you find bugs or improvements:

1. **Document the issue:**
   - What platform?
   - What went wrong?
   - Console error messages?

2. **File an issue with:**
   - Browser & version
   - Platform URL
   - Steps to reproduce
   - Expected vs actual behavior

3. **Include:**
   - Screenshot if relevant
   - Console output
   - Chat platform name

---

## More Information

- **Full Documentation:** `NATIVE-BUTTON-STRATEGY.md`
- **Strategy Comparison:** `SCRAPER-STRATEGIES.md`
- **DOM Reference:** `/reference-html-dom/`

---

## What's Next?

✅ **Just getting started?**
- Follow the 30-second setup above
- Test on one platform
- Export and import

🚀 **Ready for more?**
- Read `NATIVE-BUTTON-STRATEGY.md` for deep dive
- Check `SCRAPER-STRATEGIES.md` for comparison
- Explore browser extension integration

🤝 **Want to contribute?**
- Report issues you find
- Suggest improvements
- Help test on new platforms

---

**Version:** 2.0 (Universal Native)
**Last Updated:** January 12, 2026
**Status:** ✅ Ready to use
