# Changelog

All notable changes to the AI Chat Archival System are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Planning for Sprint 6.4: Unified Search across all archives.

---

## [v0.5.8.5] - January 22, 2026

### Added
#### High-Fidelity Artifact Integration
- **Runtime Session Hydration**: Implemented intelligent message-to-artifact mapping in the Chat Preview, ensuring message-linked attachments are visible even in legacy or sync-restricted sessions.
- **Rich Visual Language (Scale & Glow Icons)**: Integrated the `getFileIcon` utility to replace generic emojis with context-aware, category-specific icons (🖼️, 🎥, 💻, 📝, 📄).
- **Interactive Conversation Bubbles**: Artifact cards in the chat stream now feature specific actions for viewing (Markdown) or downloading (General files), with rich metadata display.
- **Standardized Artifact Viewer**: Unified the preview experience by integrating the app-wide `ArtifactViewerModal` into the Archive Hub.

### Fixed
- **Artifact Visibility**: Resolved an issue where message-linked artifacts were not displaying correctly in the Archive Hub's jump list and conversation bubbles.
- **Type Safety**: Hardened the `ChatPreviewModal` state management with explicit `ConversationArtifact` typing.

---

## [v0.5.8.4] - January 22, 2026

### Added
#### Folder Management System
- **Hierarchical Organization**: Complete folder system for organizing chats, memories, and prompts with nested folder support.
- **Folder CRUD Operations**: Create, rename, move, and delete folders with full persistence in IndexedDB.
- **Breadcrumb Navigation**: Visual breadcrumb trail showing current folder path with clickable navigation.
- **Drag & Drop Organization**: Move items between folders with intuitive selection and batch operations.
- **Cross-Archive Folders**: Unified folder system working across Chat Archive, Memory Archive, and Prompt Archive.
- **Folder Statistics**: Real-time counts of items within folders and subfolders.
- **Visual Folder Cards**: Dedicated folder cards with distinct styling and action menus.
- **Move Selection Modal**: Batch move multiple items to different folders with confirmation dialog.
- **Database Schema Extension**: Added `folders` object store with parent-child relationships and type-specific organization.

#### Quick Add & Workspace UI
- **Archive Quick Add Modals**: Replaced inline entry forms with dedicated "Zero Scroll" popup overlay modals for Memory and Prompt archives.
- **Pillbox Style Triggers**: Added elegant, fully-rounded "Add New" buttons with standardized Scale & Glow feedback.
- **Zero Scroll Optimization**: Refined modal dimensions and internal padding to ensure the workspace fills the viewport with a consistent 25px screen gap.
- **Enhanced Working Surface**: Expanded textarea heights to `h-[45vh]` for an immersive writing experience within the archival modals.

---

## [v0.5.8.3] - January 21, 2026

### Added
#### Global Archive & Converter UI Polish
- **Create Blank Chat**: Added a new pink-themed "Blank Chat" option to the Content Import Wizard, allowing users to start new conversations from scratch.
- **Auto-Edit Entry**: Initiating a blank chat automatically opens the Review & Edit modal with Edit Mode pre-enabled for immediate manual entry.
- **Seamless Logo Integration**: Implemented a global CSS Luminance Masking system (`.logo-mask`) to achieve perfect logo transparency without the artifacts caused by previous blending hacks.
- **Global "Scale & Glow" System**: Implemented a comprehensive tactile feedback system across the entire application's navigation and utility areas.
- **Tactile Feedback**: Added `hover:scale-110` (utility) or `scale-105` (navigation) and `active:scale-95` to all header icons, archive links, and modal action buttons.
- **Dynamic Glow Highlights**: Added theme-aware hover backgrounds and glow effects for various action types (e.g., green for Sync, purple for Memories, blue for Prompts).
- **Standardized Accessibility**: Enforced consistent focus rings (`focus:ring-2`) and high-contrast active states for all interactive elements to ensure accessibility and professional polish.
- **Cross-Page UI Parity**: Synchronized the visual refinement system across `ArchiveHub`, `BasicConverter`, and all specialized preview modals.

#### Full Modular Refactor
- **Archive Hub Orchestration**: Completed the final integration of modular components (`ArchiveHeader`, `ArchiveSearchBar`, `ArchiveBatchActionBar`) into the main `ArchiveHub.tsx` orchestrator.
- **Preview Modal Refinement**: Unified title editing and metadata persistence across Chat, Memory, and Prompt previewers.
- **Component Domain Guarding**: Finalized relocation of core components to their respective domain directories (`src/archive/chats`, `src/components/converter`), eliminating dead logic paths.

### Fixed
- **Drive Import Filtering**: Resolved UI clutter where `export-metadata.json` files were intermittently appearing as "Unsupported Format" in the Google Drive import wizard.
- **Layout Shift Detection**: Fixed minor layout jumps in the Archive Hub header during component hydrations.
- **Missing Theme Types**: Resolved TypeScript lint errors regarding missing legacy theme definitions in the Basic Converter.

---

## [v0.5.8.2] - January 20, 2026

### Added
#### Basic Converter & Archive Hub Refactor
- **Modular Architecture**: Split monolithic `BasicConverter.tsx` into 5 specialized components (`ConverterHeader`, `ConverterPreview`, `ConverterSidebar`, `ConverterSetup`, `ConverterReviewManage`).
- **Domain-Driven Organization**: Moved `ArchiveHub` to `src/archive/chats/pages/` and `BasicConverter` to `src/components/converter/pages/` to align with feature modules.
- **Page Orchestrator Pattern**: Refactored pages to handle state/logic only, delegating rendering to pure UI components.
- **Deep Linking Fixes**: Resolved complex relative import paths and dynamic imports across the new directory structure.

#### Theme Architecture Refactor & Export System Consolidation
- **Decoupled Color/Style Architecture**: Separated ChatTheme (color palettes) from ChatStyle (layout renderers) with new type definitions and ConfigurationModal updates.
- **4 Platform-Specific Theme Renderers**: High-fidelity layout implementations based on official DOM references for ChatGPT, Gemini, Grok, and LeChat with BaseThemeRenderer for shared logic.
- **Export System Consolidation**: Unified feature folder structure with all export components moved to `src/components/exports/` and refactored import paths.
- **Google Drive Client Secret Support**: Complete OAuth token exchange implementation with enhanced error handling and environment configuration updates.
- **Gemini Extension Enhancements**: Conversation preloading with mutex guards, DOM polling for stable message detection, and progress toast notifications.
- **Surgical Message Insertion**: Inline "↑ Insert" and "↓ Insert" buttons in ReviewEditModal with auto-inheritance and auto-renumbering functionality.
- **Markdown Firewall Security**: XSS prevention system blocking dangerous tags, event handlers, and malicious URLs across all platform imports.
- **Parser Modularization**: Clean architecture with ParserFactory pattern, 8 dedicated platform parsers, and comprehensive test suite reducing converterService.ts complexity by ~1200 lines.
- **ContentImportWizard Navigation**: Fixed modal back button with proper step history tracking and state reset functionality.
- **Environment Configuration**: Updated CSP policies for OAuth endpoints and deployment settings.

### Fixed
- **Deep Import Resolution**: Fixed `ReferenceError` and dynamic import failures caused by file relocation.
- **Export Component Imports**: Updated all import statements following the consolidation into `src/components/exports/` feature folder.
- **Theme Registry Integration**: Fixed exportService.generate() calls to support updated ChatStyle argument signatures.
- **Extension Mutex Guards**: Prevented concurrent preload operations with proper isPreloading boolean flags and user feedback.

---

## [v0.5.8.1] - January 18, 2026

### Added
#### Modular Parser Infrastructure & Strict Standards
- **Parser Factory Architecture**: Fully modularized parsing engine for enhanced maintainability and platform-specific tuning.
- **Strict Noosphere Standard**: Formalized requirement for high-fidelity native exports with atomic validation (Strict Markdown/JSON).
- **Enhanced 3rd-Party Flexibility**: Restored and improved parser for legacy formats and custom chat headers (e.g., `## Name:`).
- **Markdown Firewall**: Tiered security system integrated across all parser modules for sanitized Markdown extraction.
- **Import Wizard 2.0**: Guided workflow with distinct "Noosphere Standard" vs "3rd Party" parsing paths.
- **Smart Detection**: Enhanced `importDetector.ts` to automatically categorize 3rd-party chats by structure.
- **Technical Polish**: Centralized parsing utilities (`ParserUtils.ts`) and comprehensive unit test verification.
- **Google Drive Sync Refinements**: Partitioned API handling and improved backup reliability.

### Fixed
- **ChatGPT Casing**: Fixed internal version reference casing for ChatGPT parser.
- **Regex Robustness**: Improved name detection in `ThirdPartyParser` to handle names with spaces and optional colons.

---

## [v0.5.8] - January 16, 2026

### Added
#### Google Drive Export with Format Options
- **Unified Export Flow**: Both local and Google Drive exports now share same format/package selection interface.
- **Format Selection**: Export as HTML, Markdown, or JSON to Google Drive.
- **Package Types**: Single File, Directory, or ZIP options for individual exports.
- **All Archives Supported**: Chat, Memory, and Prompt archives can export to Google Drive.
- **Smart Destination Modal**: Choose export destination (Local or Drive) with authentication awareness.
- **Enhanced ExportModal**: Shows visual indicator when uploading to Drive ("☁️ Export will be uploaded to Google Drive").
- **Batch Support**: Export multiple items in chosen format to Drive in one action.
- **Success Feedback**: Clear alerts confirming count of items exported: "✅ Exported 5 chats to Google Drive".

#### Artifact Viewer Enhancements
- **Markdown Preview Modal**: View markdown files inline with full-screen modal and syntax highlighting.
- **Smart File Routing**: Markdown files open in viewer, other formats download directly.
- **Artifact Indicators**: 📎 emoji shows in message lists for quick scanning of attachments.
- **Quick Download**: Download buttons for markdown files with easy access.

#### Artifact Manager Improvements
- **Clean Separation**: Global Files and Message Attachments now properly separated (no duplicates).
- **Dual-Filter Architecture**: Unattached vs attached artifacts completely separated in UI.
- **Visual Distinction**: Purple tags show "Attached to Message #X" for attached artifacts.
- **Review Modal Sidebar**: New Message List section with click-to-jump navigation and artifact indicators.

---

## [v0.5.7] - January 15, 2026

### Added
#### Complete BasicConverter UI Revolution
- **Content Import Wizard**: Replaced raw text input with a guided 3-step workflow (Method Selection -> Input -> Verification).
- **Modal-First Architecture**: Entire BasicConverter redesigned around modal interactions
- **Dual Add Buttons**: Split "Add Message" in Editor into distinct "Add AI" and "Add User" buttons.
- **Smart Content Manager**: Single dynamic action button ("Start Import" vs "Merge Messages") based on state.
- **3-Row Interactive Layout**:
  - **Preview Row**: Reader Mode, Raw Preview, Download buttons in clean grid
  - **Chat Setup Row**: Configuration, Metadata, Chat Content modals in organized layout
  - **Review Row**: Message editing, File attachments management with dedicated modals
- **4 New Modal Components**:
  - **ConfigurationModal**: Full-screen settings with collapsible sidebar navigation
  - **MetadataModal**: Rich tag editing with quick actions and metadata organization
  - **ChatContentModal**: Large input area with collapsible tools and parser hints
  - **ReviewEditModal**: Interactive message editor with editing toggle and stats sidebar
- **Consistent Design Language**: All modals follow ChatPreviewModal pattern with collapsible sidebars
- **Color-Coded Sections**: Blue (Config), Purple (Metadata), Emerald (Content), Orange (Review), Red (Attachments)
- **Responsive Grid Layouts**: Stacked on mobile, 3-column on desktop
- **Full-Height Box Design**: Proper content distribution and visual consistency

#### Enhanced User Experience
- **Direct Modal Access**: No more scrolling - each major function opens in dedicated modal space
- **Progressive Disclosure**: Clean overview with detailed modals for deep work
- **Visual Hierarchy**: Clear section separation with distinct color themes
- **Interactive Elements**: Hover effects and smooth transitions throughout
- **Contextual Sidebars**: Each modal provides relevant tools and navigation

### Technical Implementation
- **Modal State Management**: Comprehensive state handling for 5 modal types
- **Component Architecture**: New modal components following established patterns
- **Layout Optimization**: Grid-based responsive design with proper spacing
- **Build Compatibility**: All changes compile successfully with existing codebase
- **Type Safety**: Full TypeScript integration with existing interfaces

### UI/UX Improvements
- **Reduced Cognitive Load**: Organized workflow eliminates interface clutter
- **Faster Task Completion**: Direct access to functions reduces navigation time
- **Professional Appearance**: Clean, modern interface with consistent styling
- **Accessibility**: Proper modal patterns with keyboard navigation support
- **Mobile Optimization**: Responsive design works seamlessly across devices

---

## [v0.5.6] - January 14, 2026

### Added

#### Basic Converter UX Overhaul
- **Reader Mode Integration**: Added "Reader Mode" button to the Basic Converter, enabling distraction-free reading, search, and inline editing via the unified preview modal.
- **Auto-Save Core**: Eliminated the manual "Save Session" button by implementing a debounced persistence layer that syncs all configuration and metadata changes automatically.
- **Collapsible Support**: Standardized the `<collapsible>` tag across the app, replacing the internal manual "Wrap Thought" tool with a premium "Collapsible" tool for custom organized sections.
- **Layout Reordering**: Moved the "Chat Content" input block below "Metadata" to create a logical "Setup -> Input -> Attachments" workflow.
- **Layout Redesign**: Complete transformation from cramped side-by-side view to a spacious, step-based workflow.
- **Import Guide**: Interactive guide explaining Extension vs Console vs File import methods.
- **Parser Mode Grid**: Rich grid selector with icons and "TLDR" tips for each platform parser.
- **Documentation Integration**: Console scraper docs accessible directly via modal within the tool.
- **Auto-Enrichment**: Logic to auto-extract titles, models, and tags from imported content (Basic Mode).

#### Security & Downloads
- **Sandboxed Preview Upgrade**: Enhanced iframe security policy allowing safe artifact downloads via injected Blob scripts.
- **Context-Aware Links**: Intelligent switching between Blob downloads (Preview) and relative paths (Export).
- **Metadata Handling**: Fixed "link bleeding" issues by enforcing clean state on conversion.

#### Performance & Polish
- **Archive Hub Optimization**: 95% memory reduction by loading metadata only for the list view.
- **Background Indexing**: Streamed search indexing prevents UI freezes on large libraries.
- **Interaction Alignment**: "Preview" (Reader Mode) is now the default action for all cards (Chats, Memories, Prompts).
- **Duplicate Handling**: Iterative renaming `(Old Copy - N)` for import collisions.

---

## [v0.5.5] - January 12, 2026

### Added

#### Two-Way Artifact Linking (Added Jan 12, 2026)
- **Auto-Matching System**: Uploaded files automatically scan messages for filename references and link contextually.
- **Smart Deletion Policy**:
  - Global Delete: Removes from pool + all messages (Complete Cleanup).
  - Message Delete: Unlinks from specific message only (Safety First).
- **Deduplication**: Robust checking prevents duplicate uploads (Filename + Size).
- **Shared Utility**: `artifactLinking.ts` standardizes logic across entire application.

---

## [v0.5.4] - January 11, 2026
- **User Settings System**: New persistent settings in IndexedDB (via `SettingsModal`).
- **6 Casing Options**: `kebab-case`, `Kebab-Case`, `snake_case`, `Snake_Case`, `PascalCase`, `camelCase`.
- **Visual UI**:
  - Live preview examples updating in real-time.
  - Capitalization toggle switches.
  - "Apply" logic integrated into `sanitizeFilename` for all exports.

#### Memory Archive Enhancements
- **Batch Operations**:
  - Multi-select memories via checkboxes or "Select All".
  - Bulk Export (HTML/Markdown/JSON) or Delete.
  - Floating Action Bar (glassmorphism style) for managing selection.
- **Export Status Tracking**:
  - New `exportStatus` field in database.
  - Visual "✓ Exported" badges (Green) on memory cards.
  - Automatically updates status upon successful export.
- **Visual Overhaul**:
  - Matched Archive Hub's premium design language.
  - Purple-themed glassmorphism for selected cards.
  - Rounded-3xl card styling and hover animations.
  - Custom checkbox styling (dark rounded box, purple fill).

---

#### Advanced Search Enhancements (Added Jan 12, 2026)
- **Smart Model Filtering**: Category mapping (ChatGPT→gpt/openai, Gemini→gemini/google, etc.) with "Other" category.
- **Deep Navigation**: Click search results to scroll to specific messages with purple highlight.
- **Model Badges**: Visual confirmation of AI model in search results.
- **Index Migration**: Automatic re-indexing for schema updates.
- **Artifact UI Hydration & Preview Integration**:
  - **Preview Downloads**: artifacts in "Reader Mode" are now clickable and downloadable.
  - **Hydration Logic**: Auto-syncs message badges from global metadata on session load (fixes legacy sessions).
  - **State Sync**: Instant persistence and preview regeneration for all artifact operations.

## [v0.5.5] - January 12-13, 2026

### Added

#### Reader Mode & Edit Overhaul
- **Preview Modals**: Full-screen "Reader Mode" for Chats and Memories with dark theme and markdown rendering.
- **Inline Editing**: Toggle "Edit Mode" directly from the preview to fix typos or update content without context switching.
- **Artifact Manager 2.0**: Redesigned as a full-screen, split-pane modal for better usability. Added "Re-Download" capability.
- **Memory Card Interaction**: Click cards to auto-scroll and populate the edit form. Removed cluttered action buttons.
- **Visual Polish**: Unified "Glow" effects and button styling across the entire application.

#### Functional Enhancements (Artifacts & Search)
- **Two-Way Artifact Linking**: Auto-matching of files to message text and synchronized deletion.
- **Advanced Search**: Smart model filtering (category mapping) and deep navigation highlighting.
- **Unified Exports**: `[AIName] - chatname.ext` naming convention standardized.
- **Simple Downloads**: Replaced complex directory picker with simple blob downloads for single files.

#### Prompt Archive System (Added Jan 13, 2026)
- **New Dedicated Page** (`/prompt-archive`): Full-featured CRUD dashboard for organizing reusable prompts.
- **Data Model**: New `Prompt` and `PromptMetadata` interfaces with category field instead of AI model.
- **Database**: IndexedDB v6 migration with `prompts` object store, indexes on `createdAt` and `tags`.
- **Storage Methods**: Five new methods following Memory pattern: `savePrompt()`, `getAllPrompts()`, `getPromptById()`, `updatePrompt()`, `deletePrompt()`.
- **Category Organization**: 7 fixed categories (General, Coding, Writing, Analysis, Research, Creative, Other).
- **Rich Metadata**: Word count, character count, creation/update timestamps for each prompt.
- **Full CRUD Operations**: Create new prompts with auto-generated titles, read/search, update metadata, delete single or batch.
- **Tag System**: Organize and filter prompts by custom tags.
- **Batch Operations**: Multi-select prompts to export (HTML/Markdown/JSON) or delete in bulk.
- **Component Reusability**: Extended MemoryInput, MemoryList, MemoryCard, MemoryPreviewModal with `isPromptArchive` flag pattern (zero code duplication).
- **Visual Cohesion**: Blue/cyan gradient theme for Prompt Archive card on landing page with shimmer effects.
- **Three-Archive System**: Unified color scheme: Archives (green) → Memories (purple) → Prompts (blue).
- **Error Handling**: Robust try/catch blocks in storage operations with user-facing alerts.
- **Routing**: New `/prompt-archive` route in App.tsx for seamless navigation.

## [v0.5.4] - January 11, 2026

### Added

#### Governance Framework & Multi-Agent System
- **Multi-Agent Specialist System**: Established 5 specialist agents (Builder, Auditor, Consolidator, Data Architect, Design Agent)
- **7 Core Protocols**:
  - AI_COLLABORATION_PROTOCOL: Role boundaries, handoff procedures, conflict resolution
  - CODING_STANDARDS_PROTOCOL: Code style, React patterns, security gates
  - DESIGN_SYSTEM_PROTOCOL: Noosphere Nexus visual standards
  - EXTENSION_BRIDGE_PROTOCOL: Chrome extension communication patterns
  - MEMORY_BANK_PROTOCOL: Context persistence across sessions
  - QA_TESTING_PROTOCOL: Security and regression testing procedures
  - RELEASE_PROTOCOL: Atomic version synchronization across 7 locations
- **6 Specialist Task Agents**: UPDATE_AGENT, SECURITY_ADVERSARY_AGENT, COMMIT_AGENT, PULL_REQUEST_AGENT, DATA_ARCHITECT_AGENT, DESIGN_AGENT
- **4 Planning Templates**: IMPLEMENTATION_PLAN_TEMPLATE, TASK_TEMPLATE, WALKTHROUGH_TEMPLATE, ANTIGRAVITY_PLANNING_GUIDE
- **Governance Documentation Suite**:
  - GOVERNANCE_QUICK_START.md: 5 practical development checklists
  - GOVERNANCE_REFERENCE.md: Comprehensive governance reference guide
  - GOVERNANCE_INDEX.md: Navigation hub for all governance docs
  - GOVERNANCE_SUMMARY.md: Master overview and integration guide
  - AGENT_ROSTER.md: Detailed agent personas and decision trees
- **Enhanced CLAUDE.md**: Added comprehensive references to all governance components

#### Extension Platform Expansion
- **AI Studio Support (aistudio.google.com)**: New platform parser with correct function references
- **Platform Count**: Now supporting 7+ AI platforms (Claude, ChatGPT, Gemini, LeChat, Grok, Llamacoder, AI Studio)

#### Parser Robustness
- **LeChat Parser Enhancements**: Improved support for rich tables, thought processes, and tool execution markers
- **Shared Markdown Extraction**: Unified markdown extraction logic across GPT, Claude, and general parsers
- **Thought Block Detection**: Improved Gemini and Grok thought block preservation

### Fixed

- **Extension Parser References**: Corrected function name references in aistudio-parser.js (extractMarkdown → extractMarkdownFromHtml)
- **Gemini Thought Content Bleed**: Resolved issue where Gemini thought blocks were appearing in chat content (two-phase ancestor detection)
- **Extension UI Consistency**: All platform export buttons now positioned consistently with proper z-index layering

#### Database Export & UI Hardening
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
