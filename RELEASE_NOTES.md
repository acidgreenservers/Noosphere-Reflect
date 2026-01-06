# Release Notes: v0.1.0

**Release Date**: January 5, 2026

## Major Features

### 🔌 Chrome Extension - Noosphere Reflect Bridge
Capture AI conversations directly from your browser into the archive hub.

**Supported Platforms**:
- Claude (claude.ai)
- ChatGPT (chatgpt.com, chat.openai.com)
- LeChat (chat.mistral.ai)
- Llamacoder (llamacoder.together.ai)

**Features**:
- Right-click context menu to capture conversations
- Automatic title extraction from chat UIs
- Global username setting synchronized across imports
- Session persistence via IndexedDB bridge
- Toast notifications for capture success/errors
- Automatic metadata capture (model, date, title)

### 🌐 ChatGPT HTML Export Support
Added native support for ChatGPT HTML exports in the converter.

**Parser Capabilities**:
- Detect ChatGPT HTML export format
- Extract user/assistant message pairs
- Preserve markdown formatting
- Parse conversation titles
- Support both chatgpt.com and chat.openai.com

### ⚙️ Global Username Settings
Set a default username that applies to all imported chats.

**Features**:
- Persistent settings stored in IndexedDB
- Settings modal in Archive Hub
- Override per-session basis
- Synchronized with Chrome Extension
- Backward compatible with existing sessions

### 🎨 UI/UX Improvements

**Floating Action Bar**:
- Batch operations (select, export, delete)
- Dropdown opens upward with proper arrow
- Only visible when items are selected

**Attribution Footer**:
- Hidden in preview mode
- Shown in exports only
- Professional styling with bold title and italic tagline

**Archive Hub**:
- Search and filter sessions
- Metadata editing
- Batch export to HTML
- Settings button in header

## Technical Improvements

### Storage Layer
- IndexedDB v2 schema with backward compatibility
- Settings object store for global configuration
- Automatic migration from localStorage (v1 → v2)

### Parser Architecture
- Modular HTML parsers for each platform
- Consistent markdown extraction
- Separate converters for basic/AI/HTML modes

### Extension Architecture
- Service worker background script
- Platform-specific content scripts
- Shared parsing utilities
- Bridge storage for session persistence
- Settings sync utility for configuration

## Bug Fixes

- Fixed title extraction with platform-specific DOM selectors
- Fixed markdown extraction from HTML elements
- Fixed floating action bar dropdown direction
- Fixed ChatGPT parser element cloning error

## Breaking Changes

None. All existing sessions remain compatible.

## Migration Guide

### From v0.0.0

1. **IndexedDB Upgrade**: Automatic (v1 → v2)
   - Settings store is created on first load
   - Existing sessions are preserved
   - No manual action required

2. **Extension Installation**:
   - Follow [Extension Installation Guide](extension/README.md)
   - Grant permissions for target sites
   - Configure global username in Archive Hub → Settings

3. **ChatGPT Support**:
   - Export conversation as HTML from ChatGPT
   - Use "Import" → "ChatGPT HTML" in converter
   - Or use browser extension right-click menu

## Known Limitations

- Extension settings are separate from web app settings (uses chrome.storage.sync)
- Llamacoder title must be entered manually (no extraction available)
- Web app ↔ Extension sync requires manual push via extension button

## Future Enhancements (Roadmap)

- Bidirectional web app ↔ Extension settings sync
- Support for additional AI platforms
- Advanced artifact reconstruction
- Full session merging capabilities
- Scheduled auto-capture

## Testing Checklist

✅ IndexedDB v1 → v2 migration
✅ Global username settings persistence
✅ Extension capture (Claude, ChatGPT, LeChat, Llamacoder)
✅ ChatGPT HTML export parsing
✅ Title extraction for all platforms
✅ Floating action bar functionality
✅ Attribution footer display
✅ Production build succeeds

## Files Changed

- **New Files**: 17 extension files + SettingsModal component
- **Modified Files**: Types, Storage Service, Converter Service, Archive Hub, Basic Converter
- **Total**: 27 files changed, 2,361 lines added

## Build Information

```
dist/index.html           1.10 kB (gzip: 0.62 kB)
dist/assets/index.css   104.52 kB (gzip: 17.17 kB)
dist/assets/index.js    311.02 kB (gzip: 94.98 kB)
```

## Support

For issues or questions:
1. Check the [Extension README](extension/README.md)
2. Review [CLAUDE.md](CLAUDE.md) for architecture details
3. See [ROADMAP.md](ROADMAP.md) for future plans

---

**Contributors**: Claude AI (Haiku 4.5)
**Repository**: [AI-Chat-HTML-Converter](https://github.com/yourusername/AI-Chat-HTML-Converter)
