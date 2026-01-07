# Changelog

All notable changes to the AI Chat Archival System are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added (v0.3.0 Roadmap - In Progress)

#### JSON Import Failsafe (January 6, 2026 - Session 2)
- **Noosphere Reflect Format Detection**: Auto-detects exported JSON by signature field (`exportedBy.tool`)
- **Full Metadata Preservation**: Imports all fields:
  - Title, Model, Date, Tags
  - Author, SourceUrl
  - All message content with types and isEdited flags
- **Auto-Population**: Form fields automatically filled when importing JSON with metadata
  - Chat title field populated from `metadata.title`
  - Model, date, and tags propagated to session metadata
- **Batch Import UI**:
  - Upload multiple JSON files at once
  - Displays success/failure count with file names
  - Clear error messages for failed imports
  - Green success banner showing imported metadata
- **Backward Compatibility**: Still accepts legacy JSON formats (simple message arrays)
- **Converter Service Enhancement**:
  - New `parseExportedJson()` function in `converterService.ts` (lines 71-110)
  - JSON detection logic updated to recognize Noosphere Reflect exports (lines 160-163)
  - Preserves all metadata fields during re-import

### Fixed (v0.3.0 Roadmap - Security Audit Planning)

#### Security Vulnerabilities Identified (v0.3.0 - Ready for Implementation)
- **CVE-001 (Critical)**: TOCTOU Race Condition
  - Location: `src/services/storageService.ts:saveSession()`
  - Issue: Duplicate check and write happen in separate transactions
  - Solution: Implement unique index on `normalizedTitle` (database-level atomic constraint)
  - Status: Implementation plan in `SECURITY-ROADMAP.md`

- **CVE-002 (High)**: Unicode Normalization Bypass
  - Location: `src/services/storageService.ts:findSessionByTitle()`
  - Issue: Simple `.toLowerCase()` insufficient for Unicode equivalence
  - Attack Vectors: Different Unicode representations (NFC vs NFD), homoglyphs, zero-width characters
  - Solution: Implement NFKC normalization + zero-width character removal
  - Status: Implementation plan in `SECURITY-ROADMAP.md`

- **CVE-003 (High)**: O(n) Performance Degradation
  - Location: `src/services/storageService.ts:findSessionByTitle()`
  - Issue: `getAllSessions()` fetches entire database on every save
  - Impact: 1,000 sessions = 100ms lookup; 10,000 sessions = 1s+ (app freeze)
  - Solution: Replace with O(log n) index-based lookup
  - Status: Implementation plan in `SECURITY-ROADMAP.md`

- **CVE-004 to CVE-008 (Medium/Low)**: Additional security issues identified
  - Status: Deferred to future releases; documented in `SECURITY-ROADMAP.md`

### Documentation

#### New Files
- **SECURITY-ROADMAP.md** (January 6, 2026):
  - Comprehensive security audit results with 8 CVEs identified
  - Complete implementation plan for IndexedDB v2 → v3 migration
  - Unicode normalization utility design (NFKC + zero-width removal)
  - Unique index strategy for atomic duplicate prevention
  - Database migration logic with automatic backfill
  - Testing checklist with 20+ test cases
  - Rollback plan and edge case handling
  - Ready-to-implement code snippets for all changes
  - Success criteria and post-implementation checklist

#### Updated Files
- **memory-bank/progress.md**:
  - Added Session 2 work (Jan 6 - Import Feature & Security Audit)
  - Updated next actions with security upgrade priority
  - Updated code metrics and file structure

- **memory-bank/activeContext.md**:
  - Added Import Functionality section (v0.2.0 + Import Feature status)
  - Added Security Audit & Planning section with detailed vulnerability list
  - Updated Next Steps with IndexedDB v3 priority
  - Added implementation insights for import workflow

---

## [v0.2.0] - January 6, 2026

### Added

#### Chrome Extension Enhancements
- **Gemini Support** (NEW):
  - Full capture capability from `gemini.google.com`
  - `extension/parsers/gemini-parser.js` - DOM-based parsing
  - `extension/content-scripts/gemini-capture.js` - Capture integration
  - Automatic detection and preservation of Gemini thought processes
  - Thought blocks extracted and wrapped in `<thought>` tags

- **Clipboard Features** (NEW):
  - "Copy Chat as Markdown" context menu option
  - "Copy Chat as JSON" context menu option
  - Shared `serializers.js` library for consistent data export
  - Direct write to system clipboard with toast confirmation
  - Available across all 5 supported platforms

#### Enhanced Thought Process Handling
- **Gemini Thought Extraction**: Automatic detection of `.model-thoughts` elements
- **Collapsible HTML**: Thoughts rendered as `<details>` blocks in HTML exports
- **Markdown Format**: Exported as ` ```thought ` code blocks for clarity
- **Full Preservation**: Thinking processes never lost or summarized

### Technical Improvements

- **Unified Serialization**: New `extension/parsers/shared/serializers.js` shared library
- **Manifest Update**: Extended to v0.2.0 with Gemini domain permissions
- **Platform Parity**: All 5 platforms (Claude, ChatGPT, LeChat, Llamacoder, Gemini) support:
  - Capture to Archive
  - Copy as Markdown
  - Copy as JSON

### Build Information

```
dist/index.html           1.10 kB (gzip: 0.62 kB)
dist/assets/index.css   104.52 kB (gzip: 17.17 kB)
dist/assets/index.js    311.02 kB (gzip: 94.98 kB)
51 modules transformed, 0 errors
```

### Supported Platforms (v0.2.0)

| Platform | Capture | Parse | Title | HTML Paste | Copy |
|----------|---------|-------|-------|------------|------|
| Claude | ✅ | ✅ | ✅ | ✅ | ✅ |
| ChatGPT | ✅ | ✅ | ✅ | ✅ | ✅ |
| LeChat | ✅ | ✅ | ✅ | ✅ | ✅ |
| Llamacoder | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Gemini | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## [v0.1.0] - January 5, 2026

### Added

#### Chrome Extension - Noosphere Reflect Bridge
- **Manifest V3** configuration with platform permissions
- **Service Worker** (`background/service-worker.js`):
  - Unified context menu handler
  - Platform detection and routing
  - Toast notification system
  - Storage quota monitoring

- **Content Scripts** (5 platforms):
  - `claude-capture.js` - Claude.ai scraping
  - `chatgpt-capture.js` - ChatGPT/OpenAI capture
  - `lechat-capture.js` - LeChat/Mistral capture
  - `llamacoder-capture.js` - Llamacoder capture
  - Auto-title extraction for each platform
  - Automatic session persistence via IndexedDB bridge

- **Platform-Specific Parsers** (vanilla JS):
  - `claude-parser.js` - DOM-based parsing for claude.ai
  - `gpt-parser.js` - ChatGPT HTML structure parsing
  - `lechat-parser.js` - Mistral LeChat parsing
  - `llamacoder-parser.js` - Llamacoder interface parsing
  - Consistent markdown extraction across platforms

- **Shared Utilities**:
  - `shared/types.js` - Type definitions for extension
  - `shared/markdown-extractor.js` - Unified markdown extraction logic
  - `storage/bridge-storage.js` - IndexedDB bridge for persistence
  - `storage/settings-sync.js` - Chrome.storage.sync integration

#### Global Username Settings (v0.1.0)
- **Settings Storage**:
  - New `settings` object store in IndexedDB v2
  - Global username configuration across all imports
  - Per-session override capability
  - Extension synchronization via `chrome.storage.sync`

- **UI Components**:
  - New `SettingsModal.tsx` component
  - Settings button in Archive Hub header
  - Configuration persistence across sessions

#### ChatGPT HTML Export Support
- **Web App Parser**: `parseChatGptHtml()` in `converterService.ts`
- **Reliable DOM Selectors**: Using `[data-turn]` attributes for message detection
- **Basic Converter Integration**: Radio button UI for ChatGPT HTML selection
- **Metadata Extraction**: Title, date (partial), user/assistant pairs

#### Database Schema Upgrade
- **IndexedDB v1 → v2 Migration**:
  - Automatic migration on first load
  - Settings object store creation
  - Backward compatible (no data loss)
  - Zero-downtime migration

### Fixed

- Fixed title extraction with platform-specific DOM selectors
- Fixed markdown extraction from HTML elements
- Fixed floating action bar dropdown direction (opens upward)
- Fixed ChatGPT parser element cloning error
- Fixed attribution footer display (hidden in preview, shown in export)

### Breaking Changes

None. All existing sessions remain compatible.

### Files Changed (v0.1.0)

**New Files**:
- 17 extension files (manifest, service worker, 5 content scripts, 5 parsers, 3 utilities)
- `src/components/SettingsModal.tsx`

**Modified Files**:
- `src/types.ts` - Added `ParserMode.ChatGptHtml`, Settings types
- `src/services/storageService.ts` - Added v2 schema migration, settings store
- `src/services/converterService.ts` - Added `parseChatGptHtml()`
- `src/pages/ArchiveHub.tsx` - Settings button, floating action bar refinements
- `src/pages/BasicConverter.tsx` - ChatGPT HTML radio button option
- `package.json` - Version bump to v0.1.0

**Total**: 27 files changed, 2,361 lines added

---

## [v0.0.8] - January 4, 2026

### Added

- Floating Action Bar with batch operations (select, export, delete)
- Attribution footer for professional exports
- Markdown and JSON batch export options
- Session count in Archive Hub header

### Fixed

- Dropdown arrow direction (upward from action bar)
- Footer visibility in preview vs export modes
- Proper metadata preservation during export

---

## [v0.0.7] - January 3, 2026

### Added

- Global username settings system
- SettingsModal component
- Chrome extension foundation (v0.0.1)
- Platform-specific HTML parsers (Claude, LeChat, Llamacoder)
- Automatic title extraction from chat interfaces

### Technical Improvements

- Modular parser architecture
- Platform-specific DOM selector patterns
- Markdown extraction utilities

---

## [v0.0.6] - January 2, 2026

### Added

- Batch export functionality (HTML, Markdown, JSON)
- Session search and filtering
- Metadata editing UI
- Metadata manager component

### Fixed

- Session persistence across browser reloads
- Metadata synchronization with session data

---

## [v0.0.5] - January 1, 2026

### Added

- Multi-session archive hub dashboard
- Batch selection UI
- Session deletion functionality
- Import/export workflow

### Technical Improvements

- IndexedDB wrapper service
- Session lifecycle management
- Storage quota awareness

---

## [v0.0.4] - December 31, 2025

### Added

- IndexedDB v1 schema with sessions store
- Migration from localStorage (legacy)
- Persistent session storage

### Fixed

- Data loss prevention during migration
- Backward compatibility with old data format

---

## [v0.0.3] - December 30, 2025

### Added

- Theme system (Dark/Light/Green/Purple)
- Thought block detection and collapsing (`<thought>` tags)
- Collapsible `<details>` rendering for thoughts
- Premium glassmorphism UI design

### Technical Improvements

- Tailwind CSS v4 theming system
- CSS-in-JS for dynamic theme switching
- Semantic HTML for accessibility

---

## [v0.0.2] - December 29, 2025

### Added

- Metadata module (Title, Date, Model, Tags, Author, SourceUrl)
- ChatData and ChatMessage type definitions
- ParserMode enum for different parsing strategies
- Metadata preservation in exports

---

## [v0.0.1] - December 28, 2025

### Added

- React 19 + TypeScript 5.8 + Vite 6.2 + Tailwind CSS v4 setup
- Archive Hub dashboard (main page)
- Basic and AI parsing modes
- HTML generation with inline Tailwind styles
- Offline-capable standalone HTML exports
- Google Gemini 2.0 Flash API integration (AI mode)
- Custom storage service for IndexedDB
- Response streaming for long-running AI tasks

### Technical Details

- HashRouter for client-side routing
- Self-contained HTML files (no external dependencies)
- Theme-aware styling with metadata headers
- Responsive design with mobile support

---

## Versioning Strategy

**v0.x.y**: Active development phase
- **x** increments for major features (new platforms, architecture changes)
- **y** increments for improvements, bug fixes, and security patches

**v1.0.0**: When feature-complete with:
- 5+ AI platforms supported
- Advanced session merging
- Cloud synchronization (optional)
- Comprehensive test coverage

---

## Migration Guides

### v0.0 → v0.1.0
1. Automatic IndexedDB upgrade (v1 → v2)
2. Install Chrome Extension (manual, optional)
3. Configure global username in Settings modal

### v0.1.0 → v0.2.0
1. Automatic extension upgrade to v0.2.0
2. New clipboard features available via context menu
3. Gemini support enabled

### v0.2.0 → v0.3.0 (Coming Next)
1. Import your sessions as JSON (new failsafe feature)
2. Automatic database upgrade (v2 → v3) with security fixes
3. Faster duplicate detection (O(log n) instead of O(n))

---

**Last Updated**: January 6, 2026 | **Current Version**: v0.2.0 + Import Feature (unreleased)
