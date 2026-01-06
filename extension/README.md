# Noosphere Reflect Bridge - Chrome Extension

**Status**: MVP Phase 1 ✅ (Claude, LeChat, Llamacoder)
**Phase 2 Pending**: ChatGPT parser implementation

## Overview

Noosphere Reflect Bridge is a Chrome Extension that captures AI chat conversations directly from your browser and archives them in Noosphere Reflect with zero effort.

Simply right-click on any Claude, LeChat, or Llamacoder chat and select **"Archive Chat to Noosphere Reflect"** - your conversation is automatically:
- ✅ Extracted from the webpage
- ✅ Parsed into a structured format
- ✅ Imported into your Archive Hub
- ✅ Searchable and taggable

## Installation (Development)

### 1. Load Extension in Chrome

```bash
1. Open chrome://extensions/ in Chrome
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the /extension directory
```

### 2. Open Noosphere Reflect Web App

```bash
npm run dev
# Access at http://localhost:3000
```

## Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| Claude.ai | ✅ Active | Full support with thought process preservation |
| LeChat (Mistral) | ✅ Active | Handles reasoning and answer parts |
| Llamacoder | ✅ Active | Preserves code blocks and prose formatting |
| ChatGPT | ⏳ Phase 2 | Requires DOM research |

## How It Works

### Architecture

```
User's Chat Page
    ↓ (right-click → "Archive Chat")
Extension Content Script
    ↓ (extracts HTML)
Platform-Specific Parser (Claude/LeChat/Llamacoder)
    ↓ (parses to ChatData)
Storage Bridge (chrome.storage.local)
    ↓ (saves session)
Web App ArchiveHub
    ↓ (on page load checks bridge)
Auto-imports session to IndexedDB
```

### Data Flow

1. **Capture**: User right-clicks on chat page
2. **Extract**: Extension extracts `document.documentElement.outerHTML`
3. **Parse**: Uses platform-specific parser to extract messages
4. **Store**: Saves to `chrome.storage.local` (10MB quota)
5. **Import**: Web app detects session and auto-imports
6. **Archive**: Session appears in Archive Hub immediately

## Extension Files

```
extension/
├── manifest.json                          # Extension configuration
├── background/
│   └── service-worker.js                  # Context menu handler
├── content-scripts/
│   ├── claude-capture.js                  # Claude.ai capture logic
│   ├── lechat-capture.js                  # LeChat capture logic
│   ├── llamacoder-capture.js              # Llamacoder capture logic
│   ├── chatgpt-capture.js                 # ChatGPT placeholder
│   └── shared/
│       └── platform-detector.js           # Auto-detects platform
├── parsers/
│   ├── claude-parser.js                   # Claude HTML → ChatData
│   ├── lechat-parser.js                   # LeChat HTML → ChatData
│   ├── llamacoder-parser.js               # Llamacoder HTML → ChatData
│   ├── chatgpt-parser.js                  # ChatGPT (future)
│   └── shared/
│       ├── markdown-extractor.js          # Core HTML → Markdown converter
│       └── types.js                       # TypeScript-like types in JS
├── storage/
│   └── bridge-storage.js                  # chrome.storage.local wrapper
├── popup/                                 # Optional popup UI (future)
└── icons/                                 # Extension icons (placeholder)
```

## Testing

### Test: Claude.ai Capture

1. Open https://claude.ai in Chrome
2. Start or open an existing conversation (3+ messages)
3. Right-click anywhere on the page
4. Select "Archive Chat to Noosphere Reflect"
5. See green notification: ✅ Chat archived!
6. Open http://localhost:3000 (web app)
7. Session automatically appears in Archive Hub
8. Verify metadata (model, date, message count)

### Test: LeChat Capture

1. Open https://chat.mistral.ai in Chrome
2. Start conversation (2-3 messages minimum)
3. Right-click → "Archive Chat to Noosphere Reflect"
4. See red notification: ✅ Chat archived!
5. Check Archive Hub - session appears with "Mistral LeChat" label
6. Verify thought/reasoning blocks are wrapped in `<thought>` tags

### Test: Llamacoder Capture

1. Open https://llamacoder.together.ai in Chrome
2. Create conversation with code blocks
3. Right-click → "Archive Chat to Noosphere Reflect"
4. See yellow notification: ✅ Chat archived!
5. Verify code blocks are preserved as markdown fenced blocks

### Test: Large Session Handling

1. Capture a very long conversation (500+ messages)
2. If session > 5MB:
   - See warning: ⚠️ Storage nearly full
   - Session should download as JSON instead
   - This triggers auto-download mechanism (future)

### Test: Storage Bridge Cleanup

1. Capture a session (verify it appears in Archive Hub)
2. Open DevTools → Application → Storage → Chrome Storage
3. Verify `noosphere_bridge_data` and `noosphere_bridge_flag` are **cleared**
4. This confirms successful import and cleanup

## Chrome Storage Quota

- **Total quota**: 10MB per extension
- **Warning threshold**: 7MB
- **Max session size**: 5MB (larger sessions auto-download as JSON)

## Future Enhancements (Phase 2+)

### ChatGPT Parser
- Requires manual DOM inspection of ChatGPT interface
- Research notes in: `extension/docs/chatgpt-dom-structure.md`

### Inline Buttons
- Add "Archive" button next to each message (floating button)
- Quick capture without right-click menu

### Extension Popup
- Show captured sessions
- Manual platform selection (if auto-detect fails)
- Storage usage indicator
- Failed captures log with retry

### Auto-Sync
- Background script polls for new messages every 30s
- Auto-capture when conversation updates
- User can enable/disable in popup settings

## Architecture Decisions

### Why chrome.storage.local Bridge?
- ✅ Extension and web app have isolated storage contexts
- ✅ 10MB quota sufficient for typical chats
- ✅ Clean separation of concerns
- ✅ No CSP (Content Security Policy) violations
- ✅ Reliable Chrome API

### Why Not Direct IndexedDB Write?
- ❌ Extensions can't directly access web app's IndexedDB
- ❌ Would require complex Content Security Policy bypasses
- ❌ Less secure than current approach

### Why Separate Content Scripts per Platform?
- ✅ Each platform has different DOM structure
- ✅ Specialized selectors for optimal parsing
- ✅ Easy to update platform-specific logic
- ✅ Cleaner code organization

## Troubleshooting

### "Extension not responding"
- Refresh the page
- Reload extension (chrome://extensions/)
- Check console for JS errors (F12 → Console)

### Session doesn't appear in Archive Hub
- Verify notification appeared (check top-right corner)
- Open DevTools → Console → look for ✅ or ❌ messages
- Check chrome://extensions/ → Noosphere Reflect Bridge → Errors

### Storage quota warning
- Your captured sessions total >7MB
- Export some sessions as JSON files
- Delete old sessions you don't need

## Development

### To Add Support for a New Platform

1. **Create DOM research document**
   ```
   extension/docs/[platform]-dom-structure.md
   ```

2. **Create parser**
   ```
   extension/parsers/[platform]-parser.js
   ```

3. **Create content script**
   ```
   extension/content-scripts/[platform]-capture.js
   ```

4. **Update manifest.json**
   - Add host permission: `https://[platform.com]/*`
   - Add content script for the host pattern

5. **Update platform-detector.js**
   - Add hostname detection logic

## Building for Distribution

### Chrome Web Store
```bash
# Future: Package extension for Chrome Web Store submission
# Requirements:
# - Icons (16x16, 48x48, 128x128)
# - Privacy Policy
# - Demo video
# - Detailed description
```

### GitHub Release
```bash
# Create release bundle
zip -r noosphere-reflect-bridge-v0.1.0.zip extension/ \
  -x "*.git*" "node_modules/*"

# Upload to GitHub Releases
gh release create v0.1.0 noosphere-reflect-bridge-v0.1.0.zip \
  --title "Extension MVP" \
  --notes "Initial release with Claude, LeChat, Llamacoder support"
```

## Version History

### v0.1.0 (MVP Phase 1)
- ✅ Claude.ai support
- ✅ LeChat support
- ✅ Llamacoder support
- ✅ Auto-detect platform
- ✅ Right-click context menu
- ✅ Automatic import to Archive Hub

### v0.2.0 (Phase 2 - Planned)
- ⏳ ChatGPT support
- ⏳ Extension popup UI
- ⏳ Storage usage indicator

## License

Part of Noosphere Reflect project
