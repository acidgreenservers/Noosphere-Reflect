# Active Context

## Current Focus
- **Governance Enhancement**: Added high-priority GOVERNANCE RULES section to all main agent files
- **Memory Bank Integration**: Established mandatory Memory Bank updates on all changes (success & failure)
- **Quality Assurance**: Implemented user approval requirement for all git commits
- **Developer Engagement**: Enabled proactive challenge of user assumptions for better architecture
- **Stabilization & UX**: Refining the new "Collapsible" tagging system and verifying the Auto-Save persistence layer.

## Recent Changes

- **January 15, 2026 - GOVERNANCE RULES HARDENING** ⏳ PENDING COMMIT APPROVAL
  - **Status**: CODE CHANGES COMPLETE ✅ | GIT COMMIT PENDING USER APPROVAL ⏳
  - **Files Modified**:
    1. `CLAUDE.md` - Added 🔒 GOVERNANCE RULES section
    2. `GEMINI.md` - Added 🔒 GOVERNANCE RULES section
    3. `CLINE.md` - Added 🔒 GOVERNANCE RULES section
    4. `BLACKBOX.md` - Added 🔒 GOVERNANCE RULES section
    5. `agents/memory-bank/activeContext.md` - Updated with governance entry
  - **Changes Made**:
    - Rule 1: **Mandatory User Approval for Git Commits** - No commits without explicit "yes" approval
    - Rule 2: **Memory Bank Updates on Every Change** - Success and failure entries documented
    - Rule 3: **Challenge & Question Assumptions** - Agents empowered to propose better implementations
    - Rule 4: **Single Governance Section** - High-priority rules at top of every agent file
  - **Commit Status**:
    - Files staged: 5 files ready
    - Commit message drafted and proposed to user
    - User responded "not yet" - commit held pending further approval
    - All changes preserved in git staging area
  - **Rationale**: Creates transparency, prevents accidental commits, builds learning path through failures, enables proactive problem-solving
  - **Next Steps**: Awaiting user approval to execute commit, or modifications to commit message

- **January 15, 2026 - Basic Converter Auto-Save & Layout Optimization**:
  - **Auto-Save Core**: Eliminated the manual "Save Session" button by implementing a debounced persistence layer that syncs all configuration and metadata changes automatically.
  - **Collapsible Support**: Standardized the `<collapsible>` tag across the app, replacing the internal manual "Wrap Thought" tool with a premium "Collapsible" tool for custom organized sections.
  - **Layout Reordering**: Moved the "Chat Content" input block below "Metadata" to create a logical "Setup -> Input -> Attachments" workflow.
  - **Centralized Persistence**: Unified save logic in `BasicConverter.tsx` (message edits, artifact attachments, form changes) into a single, reliable `handleSaveChat` function.
  - **ID Capture**: Implemented automatic capturing of the database ID after the first conversion/archive to prevent duplicate session spam during the same session.
- **January 14, 2026 - Basic Converter UX Overhaul**:
  - **Layout Redesign**: Transformed BasicConverter from a cramped side-by-side view to a spacious, step-based single-column workflow with full-width preview.
  - **Import Guide**: Added "Import Method Guide" to educate users on Extension vs Console vs File methods.
  - **Parser Mode Selector**: Replaced button grid with rich, responsive grid cards featuring icons, descriptions, and "TLDR" tips.
  - **Artifact System**: Fixed artifact linking in HTML/Preview by prioritizing message-level artifacts over metadata matching.
  - **Context-Aware Links**: Implemented conditional link behavior: Script-based Blob downloads for Preview (bypassing sandbox limits), navigable relative paths for Export.
  - **Metadata Handling**: Fixed "link bleeding" where old metadata would persist into new chats by enforcing clean state on conversion.
  - **Preview Security**: Updated iframe sandbox policy to allow external links (`allow-popups`) and downloads (`allow-downloads`, `allow-scripts`) while maintaining safety.
  - **Metadata Auto-Enrichment**: Implemented `enrichMetadata` utility to auto-detect title, model, and tags from parsed content.
  - **In-App Documentation**: Created `DocsModal` to render markdown scraper docs directly within the UI.
  - **Visual Polish**: Aligned styling with the app's premium glassmorphism aesthetic (gradients, glows, backdrop-blur).
- **January 14, 2026 - Archive Hub UX Tweak**:
  - **Interaction Swap**: Changed Chat Card click to open Preview modal (Reader Mode) by default.
  - **Edit Access**: Retasked the mini-button to "Edit Chat" for full converter access.
  - **Edit Access**: Retasked the mini-button to "Edit Chat" for full converter access.
  - **Duplicate Logic**: Updated import collision strategy to iteratively rename old sessions (`Old Copy`, `Old Copy - 1`, etc.).
- **January 14, 2026 - Basic Converter Enhancement**:
  - **Action Bar Relocation**: Moved "Upload File" and "Batch Import" to the sticky header for better accessibility.
  - **Thought Preservation**: New "Wrap Thought" tool for manual imports to preserve reasoning chains.
  - **UX Refinement**: "Justify-Between" layout for toolbar tools vs clear form actions.
- **January 14, 2026 - Performance Optimization**:
  - **Lightweight Loading**: `ArchiveHub` now loads metadata only (Omit `inputContent`/`chatData`), reducing memory usage by ~95%.
  - **On-Demand Fetching**: Full session data is fetched DB-side only when previewing, exporting, or editing.
  - **Streamed Indexing**: Search indexer processes sessions sequentially with main-thread yielding to prevent UI freezes.
- **Interaction Alignment**:
  - **Memory & Prompt Archives**: Updated card click to open Preview modal (Reader Mode).
  - **Edit Button**: Retasked mini-button to "Edit" for opening the editor.
- **January 13, 2026 - Artifact UI Sync & Preview Fixes**:
  - **Preview Modal**: Made artifacts in preview modals clickable and downloadable (Base64 -> Blob conversion).
  - **UI Hydration Logic**: Implemented "Message Artifact Hydration" in `loadSession` and `handleConvert`.
    - **Problem**: Sessions saved with global metadata links but missing message-level links (legacy/stale data) showed no UI badges.
    - **Fix**: On load, system automatically backfills message `artifacts` arrays from `metadata.artifacts` using `insertedAfterMessageIndex`.
  - **State Synchronization**: Updated `BasicConverter` to immediately regenerate HTML previews and persist to storage upon artifact uploads or link changes, ensuring WYSIWYG consistency.

- **January 13, 2026 - Prompt Archive Feature Implementation**:
  - **New Data Model**: Added `Prompt` interface and `PromptMetadata` to `types.ts` with category field instead of AI model.
  - **IndexedDB v6 Migration**: Extended storage service with new `prompts` object store, indexes on `createdAt` and `tags`.
  - **Storage Methods**: Implemented `savePrompt()`, `getAllPrompts()`, `getPromptById()`, `updatePrompt()`, `deletePrompt()` following exact pattern as Memory methods.
  - **PromptArchive Page**: Full-featured CRUD dashboard (`src/pages/PromptArchive.tsx`) with search, filtering, category selection, tags, batch export/delete.
  - **Component Reusability Pattern**: Extended MemoryInput, MemoryList, MemoryCard, MemoryPreviewModal with `isPromptArchive` boolean flag to support both Memory and Prompt types without code duplication.
  - **Visual Cohesion - Landing Page (`Home.tsx`)**:
    - Updated grid from 2-column to 3-column layout for three archive cards
    - Archives card: Green gradient with green shimmer effect on hover
    - Memory Archive card: Purple gradient with purple shimmer effect on hover (changed from green)
    - Prompt Archive card: Blue/cyan gradient with blue shimmer effect on hover
    - All cards maintain consistent styling: rounded-3xl, glassmorphism, scale-105 on hover
  - **Visual Cohesion - Archive Hub (`ArchiveHub.tsx`)**:
    - Memory Archive button changed from green-400 to purple-400 with purple-900/50 icon background
    - Added new Prompt Archive button with blue-400 text and blue shimmer effect on icon
    - Both buttons positioned between main archive navigation and settings
  - **Dynamic Component Coloring**:
    - MemoryCard: Uses `accentColor` variable (blue for Prompts, purple for Memories)
    - Applied to: selected state backgrounds, borders, shadows, checkbox states, preview button colors
    - Fallback pattern for mixed types: `(memory as any).aiModel || (memory as any).metadata?.category || 'General'`
  - **Category Dropdown**: Prompt input supports fixed categories (General, Coding, Writing, Analysis, Research, Creative, Other) instead of dynamic AI Model dropdown.
  - **Error Handling**: Added try/catch blocks in `loadPrompts()` and `handleSavePrompt()` with user-facing alerts for storage failures.
  - **Routing**: Added `/prompt-archive` route in `App.tsx` mapped to PromptArchive component.
  - **Production Build**: All changes compile cleanly with successful build (4.64s, 664 KB JS bundle).

- **January 12, 2026 - Search Enhancement Fixes**:
  - **Advanced Search Improvements**:
    - Implemented smart model filtering with category mapping (ChatGPT→gpt/openai, Gemini→gemini/google, Claude→claude/anthropic, LeChat→lechat/mistral)
    - Added "Other" category for non-mainstream AI models
    - Fixed deep navigation by adding `id="message-${idx}"` to message containers in BasicConverter
    - Added model badges to search results for visual confirmation
    - Fixed button nesting error and filter toggle event bubbling in SearchInterface
    - Added `Thought = 'thought'` to ChatMessageType enum for proper type support
  - **Search Index Migration**:
    - Implemented forced re-indexing for sessions indexed before model field support
    - Added automatic schema migration on first load after update
    - Sessions indexed before Jan 11, 2026 21:00 UTC are automatically re-indexed
  - **Export System Refinement**:
    - Updated BasicConverter exports to use `[AIName] - chatname.ext` naming format
    - Replaced directory picker API with simple blob downloads for single-file exports
    - Matched ArchiveHub's naming convention across all export methods
    - Integrated user's configured filename casing preferences (kebab-case, snake_case, etc.)

- **v0.5.4 Release (In Progress)**:
  - **Vortex Brand Overhaul**: 
    - Replaced legacy brain/memory logo with premium "Vortex" abstract icon (emerald green & deep electric purple)
    - Applied `mix-blend-screen` CSS effect for seamless logo blending into dark backgrounds
    - Updated all page headers with purple-infused gradients (green → purple → emerald)
    - Consistent branding across Home, Archive Hub, Basic Converter, Memory Archive, and Changelog
  - **TypeScript Environment Setup**:
    - Created `tsconfig.json` and `tsconfig.node.json` for proper React + Vite configuration
    - Added `vite-env.d.ts` for image asset type declarations
    - Installed `@types/react` and `@types/react-dom` packages
    - Resolved 400+ TypeScript lint errors related to JSX and React.FC
  - **Features Page**:
    - Created comprehensive `/features` route showcasing all archival capabilities
    - Interactive visual mockups for Archive System, Artifact Management, Memory Archive, and Multi-Format Export
    - Premium design with glassmorphism effects and hover animations
    - Updated home page "Explore Features" button to link to new page
  - **Database Import/Export Enhancement**:
    - Added `importDatabase()` method to storage service for complete data restoration
    - Reorganized Settings modal header with Export (green) and Import (purple) buttons
    - Both buttons positioned in right corner of modal header for intuitive access
    - Import triggers automatic page reload to reflect imported data
    - Removed redundant Export button from modal footer

- **v0.5.3 Release**:
  - **Full Database Export**: Added a "Export Database" button in Settings that dumps all sessions, memories, and settings to a JSON file.
  - **Extension UI Hardening**: Fixed export button locations with precise pixel positioning and Z-index overrides for all 7 platforms.
  - **Platform Specifics**: Tailored CSS injection for Gemini, Claude, ChatGPT, AI Studio, Grok, LeChat, and Llamacoder.
  - **Context Menu Cleanup**: Removed redundant right-click "Copy as Markdown/JSON" menus since export buttons provide this functionality.

- **Artifact Auto-Matching System (COMPLETED)**:
  - **Shared linking Utility**: `artifactLinking.ts` standardizes matching logic across all UI points.
  - **Performance Optimization**: O(M+A) complexity using Map-based lookups to prevent UI freeze.
  - **Two-Way Linking**:
    - **Synchronized Deletion**: Deleting from pool removes from all messages (clean slate).
    - **Safe Unlinking**: Deleting from message only removes the link (safety first).
  - **Deduplication**: Prevents duplicate uploads via filename + size checks.
  - **User Feedback**: Toast notifications for successful auto-matches.

- **UI Overhaul & Feature Expansion (COMPLETED)**:
  - **Reader Mode**: Implemented "Preview" modal for Chats and Memories with dark-themed, rendered Markdown view.
  - **Inline Editing**: Added robust "Edit Mode" to previews and Memory Archive cards, allowing seamless content updates without context switching.
  - **Artifact Manager 2.0**: Completely redesigned as a full-screen, split-pane modal for better usability on large datasets.
  - **Re-Download**: Added capability to download artifacts back from the browser storage (Base64 -> Blob).
  - **Visual Consistency**: Unified "Glow" effects (Green/Purple) across all inputs and forms.

- **Implementation Protocol Updates**: Added comprehensive documentation for the Artifact Auto-Matching System to the technical handbook.

## Active Decisions
- **Agent-Based Execution**: All significant changes must now be performed by the appropriate specialist agent according to their protocol.
- **Security-First Approach**: All new features must maintain existing XSS prevention and input validation standards.
- **User Experience Priority**: Features should enhance workflows without adding complexity or confusion.
- **Documentation Standards**: All major features must be documented in the Implementation Protocol handbook.

## Technical Priorities
1. **Extension Reliability**: Ensure consistent button injection across platform updates
2. **Performance Optimization**: Monitor and optimize parsing and storage operations
3. **User Feedback Integration**: Improve success/error messaging throughout the application
4. **Testing Coverage**: Expand automated testing for critical user workflows

## Known Issues & Blockers
- **Extension Position Updates**: May need adjustments as AI platforms update their UIs
- **Storage Quota Management**: Large conversations with many artifacts may approach browser limits
- **Cross-Platform Compatibility**: Testing needed on different browser environments

## Next Steps
1. **Security Audit**: Run `/security-adversary` to validate the new Sandboxed Preview security posture.
2. **Handbook Updates**: Document the "Blob Script" sandbox bypass pattern in the Implementation Protocol.
3. **Performance Monitoring**: Add metrics for parsing speed and memory usage.
4. **Feature Requests**: Evaluate user feedback for prioritization.