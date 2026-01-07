# Release Notes: v0.3.0

**Release Date**: January 7, 2026

## Major Features & Security Hardening

### 💾 JSON Import Failsafe (January 6, 2026 - Session 2)
**Purpose**: Provide users with a safe export/re-import path before IndexedDB v3 security upgrade.

**Features**:
- **Noosphere Reflect Format Detection**: Automatically recognizes exported JSON by signature (`exportedBy.tool`)
- **Full Metadata Preservation**:
  - All fields imported: Title, Model, Date, Tags, Author, SourceUrl
  - Form fields auto-populated from imported metadata
  - No data loss during re-import
- **Batch Import UI**:
  - Upload multiple JSON files at once
  - Success/failure count with file names
  - Green success banner for visual feedback
  - Clear error messages for troubleshooting
- **Backward Compatible**: Still accepts legacy JSON formats (simple message arrays)
- **Integration**: Works seamlessly with existing duplicate detection

**Files Modified**:
- `src/services/converterService.ts`: Added `parseExportedJson()` function (lines 71-110)
- `src/pages/BasicConverter.tsx`: Added `handleBatchImport()` (lines 175-224), auto-population logic (lines 243-259), batch UI (lines 653-663)

### 🛡️ XSS Prevention & Input Validation (January 7, 2026)
**Purpose**: Comprehensive security hardening against XSS attacks and resource exhaustion vulnerabilities.

**Features Implemented**:
- **HTML Entity Escaping**: All user inputs (titles, speaker names, metadata) properly escaped using centralized `escapeHtml()` utility
- **URL Protocol Validation**: Blocks dangerous protocols (javascript:, data:, vbscript:, file:, about:) in markdown links and image sources via `sanitizeUrl()`
- **Code Block Language Sanitization**: Language identifiers validated via `validateLanguage()` to prevent attribute injection
- **File Size Validation**: Maximum 10MB per file, 100MB per batch to prevent memory exhaustion
- **Metadata Input Limits**: Title (200 chars), tags (50 chars, max 20), model (100 chars) with validation alerts
- **iframe Sandbox Hardening**: Removed `allow-same-origin` and `allow-popups` from iframe sandbox attribute, retaining only `allow-scripts`
- **Batch Import Validation**: Maximum 50 files per batch with total size checking

**Files Created**:
- `src/utils/securityUtils.ts` (NEW - 206 lines): Centralized security utilities with escapeHtml(), sanitizeUrl(), validateLanguage(), validateFileSize(), validateBatchImport(), validateTag(), and INPUT_LIMITS constant

**Files Modified**:
- `src/services/converterService.ts`: Fixed 7 XSS vulnerabilities in markdown processing, speaker names, title rendering, and metadata display
- `src/pages/BasicConverter.tsx`: Added file size and batch import validation with clear error messaging
- `src/components/MetadataEditor.tsx`: Enhanced tag validation with count/length limits and user feedback
- `src/components/GeneratedHtmlDisplay.tsx`: Hardened iframe sandbox attribute to improve security posture

**Testing**: All TypeScript builds succeed with 0 errors; security payloads verified to be blocked or escaped correctly.

### 🔒 Security Roadmap: Database Migration v2 → v3
**Status**: Detailed plan ready in `SECURITY-ROADMAP.md`

**Planned Fixes**:
1. **CVE-001 (Critical)**: TOCTOU Race Condition
   - Fix: Implement unique index on `normalizedTitle`
   - Performance: O(n) scan → O(log n) lookup
   - Atomicity: Database-level constraint enforcement

2. **CVE-002 (High)**: Unicode Normalization Bypass
   - Fix: NFKC normalization + zero-width character removal
   - Coverage: Handles NFC/NFD equivalence, homoglyphs, zero-width spaces

3. **CVE-003 (High)**: O(n) Performance Degradation
   - Fix: Replace `getAllSessions()` scan with index lookup
   - Impact: 10,000 sessions go from 1s+ to <10ms

**Implementation Ready**:
- `src/utils/textNormalization.ts` (utility design complete)
- Updated `storageService.ts` (migration logic designed)
- Updated `types.ts` (schema changes planned)
- Testing checklist with 20+ test cases included

**Next Steps**:
1. Create `textNormalization.ts` utility
2. Increment `DB_VERSION` to 3
3. Implement migration with automatic backfill
4. Test with 1,000+ sessions
5. Deploy with zero downtime

---

# Release Notes: v0.2.0

**Release Date**: January 6, 2026

## Major Updates

### 🔌 Chrome Extension v0.2.0
The Noosphere Reflect Bridge Extension has been significantly upgraded.

**New Features**:
- **Gemini Support**: Full capture support for `gemini.google.com`.
- **Copy to Clipboard**: New context menu options to "Copy Chat as Markdown" and "Copy Chat as JSON" directly from the page, instantly.
- **Universal Support**: All features now work across 5 platforms: Claude, ChatGPT, LeChat, Llamacoder, and Gemini.

### 🧠 Enhanced Thought Process Handling
- **Gemini Thoughts**: The parser now intelligently detects and preserves "Thought Process" blocks from Gemini models.
- **Collapsible UI**: Thought blocks are rendered as collapsible `<details>` sections in the HTML export, keeping the UI clean while preserving context.
- **Markdown Blocks**: Thoughts are exported as ` ```thought ` code blocks in Markdown, ensuring they are clearly annotated.

### 🛠️ Technical Improvements
- **Shared Serializers**: Implementation of a unified `serializers.js` library for consistent data export across the extension.
- **Updated Manifest**: Extension updated to v0.2.0 with expanded permissions for Gemini.

---

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
