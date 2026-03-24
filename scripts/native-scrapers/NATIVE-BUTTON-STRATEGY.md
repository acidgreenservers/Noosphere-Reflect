# Noosphere Reflect - Native Copy Button Strategy

## Overview

This document explains the **native copy button interception approach** for scraping chat messages with automatic metadata attachment.

### Philosophy: "Use Native First"

Rather than reinventing message extraction, we:
1. **Detect native copy buttons** that platforms already provide
2. **Intercept their click events** to capture message context
3. **Append Noosphere metadata** to collected messages
4. **Support multiple export formats** (JSON, Markdown)
5. **Maintain full platform compatibility** as UI changes

---

## Architecture

### Two-Part System

#### Part 1: Interactive Collection
- Menu button injects into page (bottom-right corner)
- Intercepts clicks on native copy buttons
- Auto-collects message text + metadata
- Provides "Collect from Page" fallback for bulk operations

#### Part 2: Smart Export
- **JSON Export**: Full Noosphere format with all metadata
- **Markdown Export**: Human-readable chat transcript
- **Copy-to-Clipboard**: One-click to clipboard integration

---

## How It Works

### Detection Phase
```
Script loads → Detect platform (Claude/ChatGPT/Gemini/LeChat/Grok)
           ↓
Use platform-specific selectors to find messages
           ↓
Build platform config with correct DOM queries
```

### Interception Phase
```
User clicks native "Copy" button on a message
           ↓
Script captures the event (capture phase)
           ↓
Walks DOM up to find message container
           ↓
Extracts text + determines role (user/AI)
           ↓
Creates message object with Noosphere metadata
           ↓
Stores in collectedMessages array
           ↓
Shows collection status feedback
```

### Export Phase
```
User selects export format (JSON/Markdown)
           ↓
Script formats collected messages
           ↓
Appends full Noosphere metadata:
  - Title
  - Model/Platform
  - Date
  - Tags
  - Source URL
  - Export info (tool, version, method)
           ↓
Copies to clipboard
           ↓
Shows success feedback
```

---

## File: `universal-native-scraper.js`

### Key Features

#### 1. Platform Detection
```javascript
// Automatic detection by hostname or DOM markers
claude.ai         → 'claude'
chatgpt.com       → 'chatgpt'
gemini.google.com → 'gemini'
lechat.mistral.ai → 'lechat'
grok.ai / x.com   → 'grok'
```

#### 2. Message Collection
- Intercepts copy button clicks
- Extracts message text (cleans up UI artifacts)
- Determines if message is user prompt or AI response
- Creates metadata-rich message objects
- Maintains chronological order

#### 3. Native Copy Button Interception
```javascript
// Listen for clicks on any button with "copy" in text
document.addEventListener('click', function(e) {
    const target = e.target.closest('button');

    if (target && target.textContent.toLowerCase().includes('copy')) {
        // Find parent message container
        // Extract text
        // Determine role (user/AI)
        // Add to collectedMessages
    }
}, true); // Capture phase intercepts early
```

#### 4. Text Extraction & Cleanup
```javascript
function extractMessageText(element) {
    let text = element.innerText || element.textContent;

    // Remove UI artifacts
    text = text.replace(/^\s*Copy\s*$/gm, '');      // Copy button
    text = text.replace(/^\s*Edit\s*$/gm, '');      // Edit button
    text = text.replace(/^\s*Retry\s*$/gm, '');     // Retry button
    text = text.replace(/^\s*[\d:]+\s*$/gm, '');    // Timestamps

    return text.trim();
}
```

#### 5. Format Export Functions

##### JSON Export
```javascript
function exportAsJSON(messages = null) {
    return {
        messages: messages || collectedMessages,
        metadata: {
            title: 'Chat Title',
            model: 'Claude',
            date: '2026-01-12T...',
            tags: ['claude', 'export', 'noosphere'],
            sourceUrl: 'https://...',
            platform: 'claude'
        },
        exportedBy: {
            tool: 'Noosphere Reflect',
            version: 'Universal Native Scraper v2.0',
            method: 'native-copy-button-intercept'
        }
    };
}
```

**Use Case:** Import directly into Noosphere Reflect converters

##### Markdown Export
```javascript
function exportAsMarkdown(messages = null) {
    // Header with metadata
    // ---
    // For each message:
    //   ## 👤 User | ## 🤖 Assistant
    //   [message content]
    //   ---
    // Footer
}
```

**Use Case:** Share as GitHub gist, Markdown files, documentation

#### 6. User Interface

**Menu Button** (fixed bottom-right)
- Main "📋 Noosphere" button
- Expands on click to show options

**Menu Options**
- 📄 Copy as JSON - Export all collected messages
- 📝 Copy as MD - Export as Markdown
- 🔗 Collect from Page - Bulk collect all visible messages
- ❓ Help - Show instructions

**Status Messages**
- ✨ Ready state
- 📌 Message collected feedback
- 📦 Bulk collection summary
- ✅ Successful export
- ❌ Error messages

#### 7. Keyboard Shortcuts
```
Ctrl+Shift+E  → Export all as JSON
Ctrl+Shift+M  → Export all as Markdown
```

---

## Platform-Specific Selectors

### Claude
```javascript
userMsg:  '[data-testid="user-message"]'
aiMsg:    '[data-testid="assistant-message"]'
copyBtn:  'button[aria-label*="Copy"]'
```

### ChatGPT
```javascript
userMsg:  '[data-message-author-role="user"]'
aiMsg:    '[data-message-author-role="assistant"]'
copyBtn:  'button[aria-label*="Copy"]'
```

### Gemini
```javascript
userMsg:  '.turn.input'
aiMsg:    '.turn.output'
copyBtn:  'button svg.lucide-copy'
```

### LeChat (Mistral)
```javascript
userMsg:  '.ms-auto[class*="rounded"]'
aiMsg:    '[class*="flex"][class*="flex-col"]'
copyBtn:  'button[aria-label*="Copy"]'
```

### Grok
```javascript
userMsg:  '.response-content-markdown'
aiMsg:    '.response-content-markdown'
copyBtn:  'button svg.lucide-copy'
```

---

## Message Format

### Collected Message Object
```javascript
{
    type: 'prompt' | 'response',           // User or AI
    content: 'Message text...',            // Full message content
    timestamp: '2026-01-12T22:30:00Z',     // ISO timestamp
    isEdited: false,                       // Edited flag
    platform: 'claude'                     // Source platform
}
```

### Full Export Structure
```json
{
    "messages": [
        { "type": "prompt", "content": "...", ... },
        { "type": "response", "content": "...", ... },
        ...
    ],
    "metadata": {
        "title": "Chat Title",
        "model": "Claude",
        "date": "2026-01-12T...",
        "tags": ["claude", "export", "noosphere"],
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

---

## Advantages of Native Approach

### ✅ Robustness
- Uses platform's own UI elements (less likely to break)
- Automatic cleanup by innerText (handles HTML entities)
- Follows platform's message structure

### ✅ User Familiarity
- Leverages buttons users already know
- Minimal learning curve
- Natural workflow

### ✅ Flexibility
- Collect individual messages one-by-one
- Or collect entire page at once
- Choose export format per export

### ✅ Maintainability
- Falls back gracefully if platform changes
- Generic selectors handle variations
- Error messages guide troubleshooting

### ✅ Metadata Preservation
- Captures context (platform, timestamp, model)
- Links to source conversation
- Tracks export method

---

## Advantages Over Traditional Extraction

| Aspect | Traditional | Native Button |
|--------|-----------|---------------|
| **Robustness** | Breaks if DOM changes | Uses existing UI |
| **Text Quality** | Fragile regex parsing | Platform's `innerText` |
| **User Interaction** | Requires button click | Familiar interaction |
| **Context** | Manual metadata | Auto-detected |
| **Error Handling** | Silent failures | Clear feedback |
| **Maintenance** | Requires updates per change | Graceful degradation |

---

## Usage Guide

### For End Users

1. **Open any chat** in supported platform
2. **Open DevTools** (F12 or Ctrl+Shift+I)
3. **Paste script** into Console
4. **Click menu button** that appears
5. **Option A:** Click individual "Copy" buttons → auto-collects
6. **Option B:** Use "Collect from Page" for bulk grab
7. **Export** as JSON or Markdown
8. **Import** into Noosphere Reflect

### For Developers

The script can be extended to:
- Add more platforms (Perplexity, Copilot, Claude Desktop, etc.)
- Support additional export formats (CSV, YAML, etc.)
- Integrate with browser extensions
- Add filtering/search capabilities
- Create batch export workflows

---

## Future Improvements

### Short Term
- [ ] Add batch collection with pagination
- [ ] Support thought block extraction (Claude, Gemini)
- [ ] Add conversation merge capability
- [ ] Export to file download (not just clipboard)

### Medium Term
- [ ] Browser extension wrapper for auto-injection
- [ ] Persistent local storage of collections
- [ ] Filter by date/keyword
- [ ] Search across collections

### Long Term
- [ ] Integration with Noosphere Reflect UI
- [ ] Automatic background collection
- [ ] Sync with cloud storage
- [ ] Version control for collections

---

## Troubleshooting

### "No messages found"
- Ensure messages are loaded/visible on page
- Try scrolling to load more conversation history
- Check browser console for error messages

### "Copy button not detected"
- Platform may have updated UI
- Try "Collect from Page" as fallback
- Report issue with platform details

### "Exported text includes UI artifacts"
- Known issue with some platforms
- Manual cleanup often needed
- Improvements to extraction in progress

### "Wrong platform detected"
- Script attempts auto-detection
- Falls back to generic selectors
- May require manual selector updates

---

## Testing Checklist

- [ ] Claude: User messages collect correctly
- [ ] Claude: AI responses collect correctly
- [ ] Claude: Export JSON is valid
- [ ] Claude: Export Markdown is readable
- [ ] ChatGPT: Same checks as Claude
- [ ] Gemini: Same checks as Claude
- [ ] LeChat: Same checks as Claude
- [ ] Grok: Same checks as Claude
- [ ] Copy buttons still work normally
- [ ] Menu collapses/expands properly
- [ ] Keyboard shortcuts work
- [ ] Status messages appear/disappear
- [ ] Error handling shows messages

---

## Related Files

- `universal-native-scraper.js` - Main implementation
- `claude-scraper.js` - Legacy Claude-only version (reference)
- `chatgpt-scraper.js` - Legacy ChatGPT-only version (reference)
- `gemini-scraper.js` - Legacy Gemini-only version (reference)
- `/reference-html-dom/` - DOM patterns reference

---

## Feedback & Issues

If you encounter issues:
1. Check browser console (F12 → Console tab)
2. Look for [Noosphere] prefix in console logs
3. Note the platform and UI changes
4. Report with screenshot of error

---

**Last Updated:** January 12, 2026
**Version:** 2.0 (Universal Native)
