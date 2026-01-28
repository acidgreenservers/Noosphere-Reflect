# Release Documentation v0.5.8.6
**Release Date**: January 27, 2026 (Staged)
**Status**: Pre-Release

## 🚀 Overview
Version 0.5.8.6 represents a major architectural evolution with a complete **Modular Parser System**, **4-Step Import Wizard**, and comprehensive **Gemini Enhancements**. This release focuses on parsing robustness, import flexibility, and extension reliability while fixing critical bugs in folder management and message insertion.

## ✨ New Features & Improvements

### 1. Modular Parser Architecture (January 25, 2026)
- **Format-First Directory Structure**: Complete refactoring of `src/services/parsers/` into modular subdirectories:
  - `html/`: Platform-specific HTML parsers (8 parsers: Claude, ChatGPT, Gemini, Grok, LeChat, Kimi, Llamacoder, AI Studio)
  - `markdown/`: Specialized markdown parsers (7 parsers with shared `BaseMarkdownParser`)
  - `json/`: JSON import handlers
- **Specialized Markdown Parsers**: Dedicated parsers for each platform:
  - `GeminiMarkdownParser`: Blockquote thought extraction with nested quote support
  - `ClaudeMarkdownParser`: Artifact reference detection and metadata parsing
  - `ChatGptMarkdownParser`: Code block and tool usage preservation
  - `GrokMarkdownParser`: Platform-specific formatting and thought handling
  - `LeChatMarkdownParser`: Table and structured content support
  - `AiStudioMarkdownParser`: Google AI Studio format compatibility
- **BaseMarkdownParser**: Shared foundation providing:
  - Unified metadata extraction (title, model, date, author)
  - Standardized turn parsing with role detection
  - Consistent whitespace and formatting rules
  - Security-first markdown processing
- **ParserFactory Routing**: Enhanced factory pattern with format-aware parser selection
- **Type Safety**: Full TypeScript interfaces for all parser modes and configurations

### 2. 4-Step Import Wizard Overhaul (January 25, 2026)
- **Step 1 - Method Selection**: Choose import method (Paste, Upload, Extension Info, Blank Chat)
- **Step 2 - Format Selection**: Select data format (Markdown, HTML, JSON) with visual format cards
- **Step 3 - Platform Selection**: Filtered platform list based on selected format compatibility
- **Step 4 - Content Input**: Final paste/upload with real-time verification
- **Extension Guidance Step**: Dedicated informational page with:
  - Extension setup instructions
  - Download links for Chrome Web Store
  - Platform compatibility matrix
  - Visual setup guide
- **Smart Navigation**: Wizard remembers previous steps for easy back navigation
- **Format Filtering**: Only shows platforms that support the selected format
- **Visual Redesign**: Modern card-based UI with icons and descriptions

### 3. Gemini Enhancements (January 25, 2026)
- **Thought Extraction System**:
  - Blockquote detection for `> Thinking:` patterns
  - Support for single (`>`) and double (`>>`) nested quotes
  - Automatic conversion to `<thoughts>` tags for UI collapsibility
- **Standardized Formatting**:
  - Consistent whitespace padding: `<thoughts>\n\n[Content]\n\n</thoughts>`
  - Applied across all parsers (Gemini, Claude, AI Studio, Base)
  - Improved visual consistency in exports and previews
- **Footer Cleanup**: Automatic removal of "Powered by Gemini Exporter" attribution
- **Extension Reliability Manager** (`reliability-manager.js`):
  - Web Worker-based heartbeat system
  - Unthrottled timers bypassing Chrome's background tab throttling
  - Focus spoofing via MAIN world script injection
  - Overrides `document.hidden`, `visibilityState`, and `document.hasFocus()`
  - Blocks visibility-related events to trick Gemini into continuous operation
- **Double Vision Fix**:
  - Eliminated duplicate message rendering in exports
  - Ghost-buster logic removes screen-reader-only and aria-hidden elements
  - Turn-centric extraction prevents child elements from becoming independent messages

### 4. Import & Parsing Improvements (January 25, 2026)
- **Generic Markdown Support**:
  - New "Paste Markdown Export" top-level option in wizard
  - Universal metadata detection engine with flexible regex patterns
  - Handles both `**Model:**` and `# Model:` header styles
  - Supports generic `## Prompt` and `## Response` turn patterns
- **Import Reference Library** (`agents/memory-bank/import-references/`):
  - `gemini-export.md`: Metabolic Architecture conversation (gold standard)
  - `gpt-export.md`: Recursive Consciousness Loop discussion
  - `kimi-export.md`: Relation Zero encounter
  - `claude-export.md`: Claude conversation reference
  - `grok-export.md`: Grok platform reference
- **Noosphere Export Standard** (`agents/memory-bank/noosphere-export-standard/`):
  - Universal export templates for single and batch exports
  - Platform-specific templates (Gemini)
  - Export metadata schemas with version tracking
  - Standardized directory structures for batch exports
- **Enhanced Third-Party Parser**:
  - Improved detection for legacy and custom chat headers
  - Better handling of non-standard formatting
  - Robust name detection with spaces and optional colons

### 5. Basic Converter Workflow Improvements (January 25, 2026)
- **Manual Save System**:
  - Removed auto-save to eliminate UI flicker
  - Added prominent green "Save to Local Archive" button
  - Integrated with `isConverting` state for loading feedback
  - Success messaging and error handling
- **Creative Entry Component** (`CreativeEntry.tsx`):
  - New UI component for enhanced content creation
  - Streamlined input interface
  - Integrated with wizard workflow
- **Markdown Attachment Modal** (`CreateMarkdownAttachmentModal.tsx`):
  - Dedicated modal for creating markdown files
  - Live preview and syntax highlighting
  - Direct attachment to messages or sessions
  - File metadata management

### 6. Extension Improvements (January 23-25, 2026)
- **Locus Positioning System** (`ui-injector.js`):
  - Anchor-based button positioning using `anchorSelector`
  - Relative/absolute positioning that moves with platform UI
  - Smart proximity recovery with high-z-index fallback
  - Platform-specific anchor points (Claude form container, ChatGPT action row)
- **Claude Capture Refinement**:
  - Narrowed `expandSelector` from `.border-border-300.rounded-lg button` to `[data-test-render-count] .border-border-300.rounded-lg button`
  - Prevents accidental clicks on global UI elements (Documents button)
  - Targets only message container buttons
- **Reliability Manager Integration**:
  - Unthrottled timers during intensive scroll-to-load phases
  - Blob-based worker survives background transitions
  - DOM alignment verification for script injection

### 7. Bug Fixes & Polish (January 22-23, 2026)
- **Folder Persistence Fix**:
  - Added `folderId` to `getAllSessionsMetadata` return objects
  - Fixed folder assignment failures in Archive Hub
  - Proper filtering logic for folder views
- **Message Insertion Logic**:
  - Refactored `dropdownOpen` from string to object `{ index, type }`
  - Fixed ref collision in `.map` loop using delegation-based click detection
  - Verified splice indices for start, middle, and end insertions
- **Artifact Linkage Enhancements**:
  - Direct search strategy for filenames with spaces
  - State synchronization between message-level and global artifacts
  - Instant persistence to IndexedDB
- **Archive Navigation Polish**:
  - Cross-archive navigation pills (Memories ↔ Prompts)
  - Rounded-full pillbox styling for all search bars
  - Conditional 'X' clear buttons
  - Unified "Scale & Glow" feedback system

## 🛠️ Technical Details
- **Parser Architecture**: Modular directory structure with format-based organization
- **Type System**: Full TypeScript coverage for all parser modes and configurations
- **Extension Security**: MAIN world script injection for focus spoofing
- **State Management**: Improved dropdown and ref handling in modals
- **Database Schema**: Enhanced metadata objects with `folderId` support
- **Worker Pattern**: Blob-based Web Worker for unthrottled background operations

## 📦 Migration Notes
- **Parser Imports**: Update any direct parser imports to use new directory structure
- **Wizard Integration**: Existing import flows automatically use new 4-step wizard
- **Extension Update**: Users should update extension to latest version for reliability improvements
- **Zero Breaking Changes**: All existing functionality preserved with enhanced capabilities

## 🎨 Visual Enhancements
- **Wizard UI**: Modern card-based design with icons and descriptions
- **Pillbox Styling**: Consistent rounded-full design across all archives
- **Clear Actions**: Responsive 'X' buttons for quick search clearing
- **Cross-Navigation**: Color-coded pills for instant archive switching
- **Loading States**: Visual feedback for save operations and imports

## 🔍 Testing & Verification
- **Import References**: Gold standard exports for regression testing
- **Parser Coverage**: Comprehensive test suite for all 15+ parsers
- **Extension Reliability**: Verified unthrottled operation in background tabs
- **Folder Operations**: Confirmed proper persistence and filtering
- **Message Insertion**: Tested all insertion points (above, below, start, end)

---
*Preserving Meaning Through Memory.*
