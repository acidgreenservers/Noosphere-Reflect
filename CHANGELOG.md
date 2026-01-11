# Changelog

All notable changes to the AI Chat Archival System are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Planning for Sprint 6.2: Archive Hub Polish (Conversation Card Redesign)
- Planning for Sprint 5.1: Extension Reliability (Toast Queue)

---

## [v0.5.3] - January 10, 2026

### Added

#### Full Database Export
- **One-Click Backup**: New "Export Database" button in Settings Modal.
- **Comprehensive Dump**: Exports all sessions, settings, and memories into a single JSON file.
- **Data Portability**: Ensures complete user data sovereignty and backup capability.
- **Schema**:
  ```json
  {
    "sessions": [...],
    "settings": {...},
    "memories": [...],
    "version": 5,
    "exportedAt": "ISO-8601"
  }
  ```

#### Extension UI Hardening
- **Fixed Button Locations**: Platform-specific positioning for all services (Gemini, Claude, ChatGPT, Grok, LeChat, Llamacoder, AI Studio).
- **Z-Index Stabilization**: Ensures export buttons remain visible above platform UIs (`z-index: 999999`).
- **Style Isolation**: Prevents platform CSS from interfering with extension UI.
- **Platform Specifics**:
  - **Gemini**: Bottom-right (`bottom: 85px`, `right: 195px`)
  - **Claude**: Bottom-right (`bottom: 65px`, `right: 330px`)
  - **ChatGPT**: Bottom-right (`bottom: 46px`, `right: 210px`)
  - **AI Studio**: Top-left absolute positioning relative to header
  - **Grok**: Bottom-right (`bottom: 44px`, `right: 200px`)
  - **LeChat**: Bottom-right (`bottom: 85px`, `right: 210px`)

### Fixed

- **UI flicker**: Stabilized extension button injection on SPA navigation.
- **Button overlap**: Adjusted positioning to avoid covering chat input or send buttons.

---

## [v0.5.2] - January 9, 2026

### Added

#### Kimi AI Integration
- **Full Platform Support**: Capture chats from Kimi (kimi.moonshot.cn)
- **Dual Parser Modes**:
  - `Kimi HTML`: Comprehensive DOM-based extraction
  - `Kimi Share`: Robust text parser for Kimi's native "Share Copy" feature
- **Extension Features**:
  - Export buttons injected into Kimi interface
  - Auto-title extraction
  - Matches Noosphere Reflect's "Purple" platform theme
- **Web App Updates**:
  - `parseKimiHtml` and `parseKimiShareCopy` added to converter service
  - Basic Converter supports both Kimi modes in dropdown

#### Archive Hub Improvements
- **Export Status Indicator**: Visual "Status" button (Purple=Exported, Red=Not Exported) to track progress per session.

---

## [v0.5.1] - January 9, 2026

### Added

#### Dual Artifact System
- **Message-Level Artifacts**: Attach files to individual messages via "📎 Attach" buttons
  - New `artifacts?: ConversationArtifact[]` field in `ChatMessage` interface
  - Per-message artifact upload and management
  - Visual artifact cards displayed below message content
  - `handleAttachToMessage()` and `handleRemoveMessageArtifact()` handlers in BasicConverter
- **Session-Level Artifacts**: Existing system for general file attachments
  - Uploaded via "Manage Artifacts" modal
  - Stored in `ChatMetadata.artifacts`
  - Not linked to specific messages
- **Unified Export Logic**:
  - Collects artifacts from both `metadata.artifacts` AND `msg.artifacts`
  - Automatic deduplication by artifact ID (prevents duplicates)
  - Updated `generateDirectoryExport()` and `generateDirectoryExportWithPicker()`
  - All artifacts included in ZIP/Directory exports
- **Enhanced ArtifactManager Modal**:
  - Grouped display: "📎 Session Artifacts" and "💬 Message Artifacts" sections
  - Message context labels showing which message artifacts are attached to
  - Unified deletion interface for both artifact types
  - Total count displays combined artifacts from both sources
- **Storage Service Enhancement**:
  - New `removeMessageArtifact(sessionId, messageIndex, artifactId)` method
  - Targets specific message's artifacts array for deletion
  - Targets specific message's artifacts array for deletion
  - Maintains data integrity during removal operations

#### Kimi AI Integration
- **Full Platform Support**: Capture chats from Kimi (kimi.moonshot.cn)
- **Dual Parser Modes**:
  - `Kimi HTML`: Comprehensive DOM-based extraction
  - `Kimi Share`: Robust text parser for Kimi's native "Share Copy" feature
- **Extension Features**:
  - Export buttons injected into Kimi interface
  - Auto-title extraction
  - Matches Noosphere Reflect's "Purple" platform theme
- **Web App Updates**:
  - `parseKimiHtml` and `parseKimiShareCopy` added to converter service
  - Basic Converter supports both Kimi modes in dropdown

#### Archive Hub Improvements
- **Export Status Indicator**: Visual "Status" button (Purple=Exported, Red=Not Exported) to track progress per session.
- **Artifact Badge Fix**: Badge now appears for sessions with ANY artifacts (session OR message-level)
- **Accurate Counting**: Badge displays total count from both artifact sources
- **Visibility Logic**: Updated conditional rendering to check both `metadata.artifacts` and `msg.artifacts`

---

## [v0.5.0] - January 8, 2026

### Added

#### Visual & Brand Overhaul
- **Landing Page Redesign** (`Home.tsx`):
  - Full-screen hero section with "Noosphere Reflect" branding
  - Dual CTA buttons (Get Started / View Archive)
  - Feature showcase grid (4 cards with hover effects)
  - Philosophy section explaining the "Noosphere" concept
  - Support section with links and resources
- **Platform-Specific Theming**:
  - Official brand colors for all 6 supported platforms
  - Claude: 🟠 Orange/Terracotta (`bg-orange-900/40`, `text-orange-200`)
  - ChatGPT: 🟢 Emerald Green (`bg-emerald-900/40`, `text-emerald-200`)
  - Gemini: 🔵 Blue (`bg-blue-900/40`, `text-blue-200`)
  - LeChat: 🟡 Amber (`bg-amber-900/40`, `text-amber-200`)
  - Grok: ⚫ Black (`bg-black`, `text-white`)
  - Llamacoder: ⚪ White (`bg-white`, `text-black`)
- **Archive Hub Badges**: Color-coded platform badges for instant visual recognition
- **Memory Card Styling**: Consistent theming across Memory Archive
- **Extension UI Polish**: Updated Grok export button to White/Black for dark mode visibility

#### Development Experience
- **Dev Container** (`.devcontainer/devcontainer.json`):
  - Standardized development environment
  - Consistent dependencies across team
  - VS Code integration

---

## [v0.4.0] - January 7, 2026

### Added

#### Memory Archive MVP
- **Dedicated Dashboard** (`/memory-archive` route):
  - Separate system for storing isolated AI thoughts and snippets
  - Distinct from full chat sessions
  - Grid-based visualization with rich metadata
- **Data Model**:
  - `Memory` and `MemoryMetadata` interfaces in `types.ts`
  - IndexedDB v5 schema with `memories` object store
  - Efficient indexes for AI model and tags
- **UI Components**:
  - `MemoryInput.tsx`: Quick-add area for new memories
  - `MemoryList.tsx`: Grid-based memory visualization
  - `MemoryCard.tsx`: Individual memory display with metadata
  - `MemoryEditor.tsx`: Modal-based editing interface
- **Export Capabilities**:
  - `generateMemoryHtml()`: Styled HTML export
  - `generateMemoryMarkdown()`: Clean markdown export
  - `generateMemoryJson()`: Structured JSON export
- **Rich Metadata**:
  - AI Model tracking
  - Tag system for organization
  - Word count statistics
  - Creation date timestamps
- **Search & Filter**: Find memories by AI model or tags

#### Database Migration
- **IndexedDB v4 → v5**: Added `memories` object store
- **Automatic Migration**: Zero data loss, transparent to users
- **Backward Compatibility**: Existing sessions remain fully functional

### Security
- **XSS Prevention**: Applied same "Escape First" strategy to memory inputs
- **Input Validation**: Metadata constraints enforced
- **Secure Exports**: All memory exports use hardened `converterService` logic

---

## [v0.3.2] - January 7, 2026

### Added

#### Artifact Management System
- **Artifact Upload/Download**: Full upload, download, and removal capabilities for chat session attachments
- **ConversationArtifact Interface**: Type-safe artifact storage with metadata (fileName, mimeType, fileSize, description, uploadedAt, hash, messageIndex)
- **ConversationManifest Interface**: Manifest generation for artifact tracking during export with version info and tool signature
- **ArtifactManager Component**: Dedicated React component for artifact UI (upload, link, remove operations)
- **IndexedDB v4 Migration**: Automatic database upgrade to support `artifacts` array in `ChatMetadata`
- **Web App Integration**:
  - ArtifactManager integrated into BasicConverter for inline artifact management
  - ArtifactManager integrated into ArchiveHub for chat session artifact management
  - Backward compatible with existing sessions (artifacts array initialized automatically)

#### Message Numbering
- **HTML Export Numbering**: Added message sequence numbers (#1, #2, #3) to all HTML exports for easy reference
- **Markdown Export Numbering**: Added message numbering format `[#1]` in Markdown exports
- **BasicConverter Preview**: Message numbering displayed in real-time preview for consistency
- **Consistent Numbering**: All export formats maintain identical message indexing

#### Export Enhancements
- **ZIP Export Support**: Bundle chat sessions with artifacts into self-contained ZIP files with directory structure
- **Batch ZIP Exports**: Multiple chats exported as ZIP archive with per-session subdirectories
- **Directory Exports**: Single chat exports as directory with main chat + artifacts folder
- **Manifest Generation**: Automatic `manifest.json` creation in exports for artifact tracking
- **Export Structure**:
  ```
  chat-export.zip
  ├── manifest.json (artifact metadata and versioning)
  ├── conversation.html (numbered messages, styled)
  ├── conversation.md (numbered messages)
  ├── artifacts/
  │   ├── screenshot.png
  │   ├── code.js
  │   └── document.pdf
  ```

#### UI/UX Improvements
- **Artifact Badges**: Made artifact badges clickable in ArchiveHub (previously hidden on hover)
- **Add Artifacts Button**: New "+ Add Artifacts" button for chats without artifacts in ArchiveHub
- **Manage Artifacts Button**: "📎 Manage Artifacts" button in BasicConverter page for easy access
- **Metadata Editor Modal**: Moved metadata editor to modal dialog in generator page
- **Inline Metadata Editing**: Added inline metadata editor for quick edits without opening full modal

### Fixed

#### Security Hardening
- **Filename Sanitization**: Implemented `sanitizeFilename()` to prevent path traversal attacks (removes `../`, `..\`, and invalid filesystem characters)
- **Dangerous Extension Neutralization**: Implemented `neutralizeDangerousExtension()` to mitigate XSS risks
  - Dangerous extensions converted to `.txt`: `.html`, `.svg`, `.exe`, `.bat`, `.cmd`, `.sh`, `.app`, `.deb`
  - Code extensions preserved for syntax highlighting: `.js`, `.py`, `.ts`, `.jsx`, `.tsx`, `.java`, `.cpp`, `.go`, `.rs`
- **Defense-in-Depth**: Security applied at both upload and export layers
- **Malicious Filename Blocks**: Prevents extraction attacks and script injection via filename vectors
- **Memory Bank Security Protocol**:
  - **Adversary Auditor Workflow**: Established "3-Eyes Verification" (Developer, AI, Adversary)
  - **Security Registry**: Added `memory-bank/security-audits.md` for persistent vulnerability tracking
  - **Output Standardization**: Adversary audits now follow standardized implementation walkthrough format
  - **Unified Registry**: Consolidated security audits and remediation logs in a dedicated memory bank file
  - **Registry Pruning**: Policy established for 500-line audit history retention

### Technical Details

#### New Dependencies
- **jszip ^3.10.1**: Added for ZIP file creation and export functionality

#### Type System Extensions
- `ConversationArtifact` interface for type-safe artifact handling
- `ConversationManifest` interface for export manifest structure
- Extended `ChatMetadata` with `artifacts?: ConversationArtifact[]` field

#### Database Migration
- **DB_VERSION**: Incremented to 4 (IndexedDB v3 → v4)
- **Backward Compatibility**: Automatic backfill of `artifacts` array for existing sessions via migration cursor
- **Migration Performance**: Uses `openCursor()` for memory-efficient processing of large datasets

#### Files Modified
- `src/types.ts` - Added ConversationArtifact, ConversationManifest interfaces
- `src/services/storageService.ts` - Added v4 migration with artifact initialization
- `src/services/converterService.ts` - Added message numbering in HTML/Markdown exports, manifest generation
- `src/components/ArtifactManager.tsx` - New component for artifact UI
- `src/pages/BasicConverter.tsx` - Integrated ArtifactManager, added numbering to preview
- `src/pages/ArchiveHub.tsx` - Artifact badge improvements, "+ Add Artifacts" button
- `src/utils/securityUtils.ts` - Added `sanitizeFilename()`, `neutralizeDangerousExtension()`
- `package.json` - Added jszip dependency, version bump to 0.3.2

### Security Considerations

- **Path Traversal Prevention**: All filenames sanitized before ZIP creation
- **XSS Prevention**: Extension neutralization prevents `.html`, `.svg` files from executing in browser
- **Filename Validation**: Only alphanumeric, `-`, `_`, and `.` allowed in export filenames
- **Archive Integrity**: Manifest.json ensures artifact integrity tracking for future verification

### Migration Guide

**v0.3.1 → v0.3.2**:
1. Automatic IndexedDB upgrade (v3 → v4) with zero data loss
2. Existing sessions automatically populated with empty `artifacts` array
3. Install jszip dependency (`npm install jszip@^3.10.1`)
4. New artifact management features available immediately
5. Export formats gain message numbering automatically

---

## [v0.3.1] - January 7, 2026

### Added

#### UI/UX Enhancements
- **New Favicon**: "Noosphere Reflect" purple gradient sphere with network node design
  - Updated `public/favicon.svg`
  - Updated `index.html` to reference new SVG
- **Archive Hub Logo**: Replaced generic icon with inline SVG of the new logo
  - Consistent branding across browser tab and application header

### Fixed

#### Database Security & Performance (IndexedDB v3)
- **Critical Data Loss Prevention**: Refactored `saveSession` to handle duplicate titles securely
  - Old behavior: Silent overwrite (Risk of data loss)
  - New behavior: Atomic detection via `ConstraintError` -> Auto-rename with `(Copy YYYY-MM-DD...)` timestamp
- **Migration Optimization**: Refactored `onupgradeneeded` backfill logic
  - Replaced `store.getAll()` (memory spike risk) with `store.openCursor()`
  - Ensures safe migration even with large datasets (50MB+ history)

---

## [v0.3.0] - January 7, 2026

### Added

#### Security Hardening (XSS Prevention & Input Validation)
- **Centralized Security Utilities** (`src/utils/securityUtils.ts`):
  - `escapeHtml()` - HTML entity escaping for all user inputs
  - `sanitizeUrl()` - URL protocol validation (blocks javascript:, data:, vbscript:, file:, about:)
  - `validateLanguage()` - Language identifier validation for code blocks
  - `validateFileSize()` - File size limit enforcement (max 10MB per file, 100MB batch)
  - `validateBatchImport()` - Batch operation validation
  - `validateTag()` - Tag validation with alphanumeric requirements
  - `INPUT_LIMITS` - Centralized input constraint constants
- **XSS Vulnerability Fixes**:
  - Fixed unescaped titles in HTML `<title>` and `<h1>` tags
  - Fixed unescaped speaker names (usernames in chat messages)
  - Fixed unescaped metadata (model, sourceUrl, tags)
  - Fixed URL protocol injection in markdown links and image sources
  - Fixed language attribute injection in code blocks
  - Hardened iframe sandbox (removed `allow-same-origin` and `allow-popups`)
- **Input Validation Enhancements**:
  - File upload size validation with clear error messages
  - Batch import file count and total size limits
  - Metadata input length limits (title: 200 chars, tags: 50 chars/20 max, model: 100 chars)
  - Tag validation with user feedback alerts
  - Form input maxLength attributes for frontend enforcement
- **Security Testing**: All XSS payloads verified to be blocked or properly escaped

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

### Fixed

#### XSS Prevention & Input Validation
- ✅ **7 XSS Vulnerabilities Fixed**:
  - Unescaped titles in HTML document structure
  - Unescaped speaker/user names in chat messages
  - Unescaped metadata fields (model, sourceUrl, tags)
  - URL protocol injection in markdown links and images
  - Language attribute injection in code block fences
- ✅ **Resource Exhaustion Prevention**: File size and batch operation limits
- ✅ **Input Sanitization**: All user inputs validated and escaped before rendering

#### Planned Database Security Fixes (v0.4.0)
- **CVE-001 (Critical)**: TOCTOU Race Condition - Ready for implementation
  - Solution: Unique index on `normalizedTitle` for atomic duplicate detection
  - See: `SECURITY-ROADMAP.md`
- **CVE-002 (High)**: Unicode Normalization Bypass - Ready for implementation
  - Solution: NFKC normalization + zero-width character removal
- **CVE-003 (High)**: O(n) Performance Degradation - Ready for implementation
  - Solution: O(log n) index-based lookup to replace full table scans

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

**Last Updated**: January 9, 2026 | **Current Version**: v0.5.1
