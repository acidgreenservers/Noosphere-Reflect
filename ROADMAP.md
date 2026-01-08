# Noosphere Reflect: Development Roadmap

## ✅ Phase 1: Foundation & Metadata (Completed - v0.0.1+)
**Goal:** Establish the core archival capability, allowing users to save, organize, and retrieve chat sessions with rich metadata.

**Status:** COMPLETE ✅

*   [x] **Archive Hub**: Centralized dashboard to browse saved sessions
*   [x] **Metadata Engine**: Schema for `ChatMetadata` (Title, Model, Date, Tags)
*   [x] **Persistence**: IndexedDB implementation for saving/loading sessions
*   [x] **Basic Import**: Support for markdown/text exports from Claude, OpenAI, Perplexity
*   [x] **Theming System**: Premium glassmorphism UI with multiple theme options

---

## ✅ Phase 2: Batch Operations & Storage (Completed - v0.0.6)
**Goal:** Empower users to manage multiple chats efficiently with robust backend infrastructure.

**Status:** COMPLETE ✅

*   [x] **Batch Operations**:
    *   Multi-select interface in Archive Hub
    *   Batch Export (1 Chat = 1 File) for archiving
    *   Batch Delete with confirmation
*   [x] **Infrastructure**:
    *   IndexedDB migration from localStorage with v1 → v2 schema upgrade
    *   Session auto-recovery and persistence
*   [x] **Export Formats**:
    *   HTML with Noosphere Reflect branding
    *   Markdown (.md) format
    *   JSON format with metadata

---

## ✅ Phase 3: Platform-Specific Parsing & Global Settings (Completed - v0.0.8+)
**Goal:** Reliable extraction from each platform with consistent user experience.

**Status:** COMPLETE ✅

*   [x] **Platform-Specific Parsers**:
    *   Claude HTML parser with title extraction
    *   LeChat HTML parser with metadata extraction
    *   Llamacoder HTML parser
    *   ChatGPT HTML parser (v0.1.0)
*   [x] **Title Extraction**: DOM-based selectors for automatic title detection
*   [x] **Global Settings System**:
    *   AppSettings with defaultUserName
    *   SettingsModal component in Archive Hub
    *   IndexedDB settings persistence
    *   Per-session username overrides
*   [x] **UI Refinements**:
    *   Attribution footer (export-only)
    *   Floating action bar with upward dropdown
    *   Error handling with toast notifications

---

## ✅ Phase 4: Chrome Extension & ChatGPT Support (Completed - v0.1.0)
**Goal:** One-click archiving from browser with cross-platform support.

**Status:** COMPLETE ✅

**Noosphere Reflect Bridge Extension**:
*   [x] **Architecture**:
    *   Service worker background script for event handling
    *   Content scripts for Claude, ChatGPT, LeChat, Llamacoder
    *   Platform-specific HTML parsers (vanilla JS)
    *   Extension bridge storage via IndexedDB
*   [x] **Data Flow**:
    *   DOM extraction with surgical selectors
    *   Message passing via chrome.runtime
    *   Persistent session storage in chrome.storage.local
*   [x] **Features**:
    *   Right-click context menu capture
    *   Automatic title extraction
    *   Global username setting sync
    *   Toast notifications for feedback
*   [x] **Platform Support**:
    *   Claude (claude.ai)
    *   ChatGPT (chatgpt.com, chat.openai.com)
    *   LeChat (chat.mistral.ai)
    *   Llamacoder (llamacoder.together.ai)

---

## 🚧 Phase 5: Advanced Context Composition (Planned)
**Goal:** Enable sophisticated chat merging and message curation.

**Planned Features**:
*   **Full Session Merge**: Combine multiple chats → Single unified timeline
*   **Granular Selection**: "Surgical Merge" for selecting specific messages
*   **Conflict Resolution**: Handle overlapping timestamps and author continuity
*   **Message Reordering**: Drag-and-drop message arrangement
*   **Context Optimization**: Auto-trim conversations by token count

---

## 🔮 Phase 6: Enhanced Export & Cloud (Future)
**Goal:** Expand export capabilities and add optional cloud synchronization.

**Planned Features**:
*   **Export Formats**:
    *   PDF with styled formatting
    *   DOCX (Microsoft Word)
    *   EPUB for e-readers
    *   API for custom formats
*   **Cloud Sync** (Optional):
    *   End-to-end encrypted cloud backup
    *   Cross-device synchronization
    *   Web-based archive access
*   **Collaboration**:
    *   Share specific chats or sessions
    *   Permission management
    *   Comment/annotation system

---

## 🎯 Phase 7: Platform Expansion (Future)
**Goal:** Support additional AI platforms and chat services.

**Candidate Platforms**:
*   Perplexity AI
*   HuggingChat
*   Custom chat interfaces (via JSON import)

---

## 🔗 Future Implementation Upon User/Project Readiness: Extension Auto-Capture for Artifacts

**Status:** Foundation Complete in v0.3.2 - Next Phase: Extension Integration (Not a numbered phase - flexible timing)

**Phase 1 (COMPLETE - v0.3.2)**: Core Artifact Management System
- ✅ Web app artifact upload/download/management
- ✅ Type-safe artifact storage (ConversationArtifact, ConversationManifest)
- ✅ IndexedDB v4 migration with artifact support
- ✅ ZIP export with artifact bundling
- ✅ Message numbering for artifact reference
- ✅ Filename sanitization and security hardening

**Phase 2 (PLANNED)**: Extension Auto-Capture Integration

**Scope:** Eliminate manual artifact upload by automatically detecting and capturing artifacts (images, code files, documents) during conversation capture via the Chrome Extension.

**Vision:**
Enable one-click archival of complete conversations **with all generated artifacts included**, removing the need for manual file download + re-upload workflow. Transforms Noosphere Reflect from a chat-only archiver to a **complete knowledge preservation system**.

**Technical Approach:**

1. **Platform-Specific Artifact Detection:**
   - **Claude**: Extract images from `.artifact-image` DOM elements
   - **Gemini**: Detect files in `.file-attachment` containers and thinking blocks
   - **ChatGPT**: Find downloadable code blocks and attachments
   - **LeChat & Llamacoder**: Platform-specific attachment extraction

2. **Artifact Download Module** (`extension/utils/artifact-downloader.js`):
   ```javascript
   async function downloadArtifact(url, filename) {
     const response = await fetch(url);
     const blob = await response.blob();
     return new Promise((resolve, reject) => {
       const reader = new FileReader();
       reader.onload = () => {
         const base64 = reader.result.split(',')[1];
         resolve({
           fileName: filename,
           fileSize: blob.size,
           mimeType: blob.type,
           fileData: base64
         });
       };
       reader.onerror = reject;
       reader.readAsDataURL(blob);
     });
   }
   ```

3. **Integration into Parsers:**
   - Modify `parsers/claude-parser.js` → detect and include artifacts
   - Modify `parsers/shared/types.js` → add `artifacts` field to session type
   - Modify `storage/bridge-storage.js` → store artifacts alongside conversation

4. **Extension Capture Flow:**
   ```
   1. User right-clicks "Capture to Noosphere Reflect"
   2. Extension extracts conversation content
   3. Extension detects embedded artifacts automatically
   4. Extension downloads artifacts as base64
   5. Conversation + artifacts sent together to web app
   6. Web app stores complete package with manifest
   7. User exports with everything included (zero manual steps)
   ```

**Implementation Conditions** (When User & Project Are Ready):
- ✅ Core artifact storage and manifest system is stable & tested (v0.3.2: COMPLETE)
- ✅ IndexedDB artifact storage patterns validated in production usage (v0.3.2: COMPLETE)
- ✅ Artifact upload/download workflows tested (v0.3.2: COMPLETE)
- ⏳ Extension permissions for artifact download acceptance
- ⏳ User confirms need/timing for extension enhancement

**Benefits:**
- Zero-click artifact archival (currently requires manual upload in v0.3.2)
- Complete conversation preservation (images, code, documents)
- Automatic manifest generation (ready in v0.3.2)
- Seamless user experience

**Decision Timeline:**
- Both user and AI can propose implementation readiness
- Mutual agreement required before work begins
- No forced timeline - flexible based on project needs & priorities

---

## 📊 Development Timeline

| Phase | Version | Status | Start | Completion |
|-------|---------|--------|-------|------------|
| Phase 1 | v0.0.1-0.0.3 | ✅ Complete | Dec 2025 | Jan 2, 2026 |
| Phase 2 | v0.0.4-0.0.6 | ✅ Complete | Jan 2 | Jan 4, 2026 |
| Phase 3 | v0.0.7-0.0.8 | ✅ Complete | Jan 4 | Jan 5, 2026 |
| Phase 4 | v0.1.0-0.2.0 | ✅ Complete | Jan 5 | Jan 6, 2026 |
| Phase 4 Extended | v0.3.0-0.3.2 | ✅ Complete | Jan 6 | Jan 7, 2026 |
| Phase 5 | v0.4.0+ | 🚧 Planned | TBD | TBD |
| Phase 6 | v0.5.0+ | 🔮 Future | TBD | TBD |
| Phase 7 | v0.6.0+ | 🔮 Future | TBD | TBD |

---

## 🎓 Architecture Decisions

### Why IndexedDB?
- Browser storage: Unlimited quota (typically 50MB+)
- Transactional: Atomic operations for data safety
- Structured: Query-able, indexed storage
- Migration: Can upgrade schema with onupgradeneeded

### Why Chrome Extension?
- No server infrastructure needed
- User data stays local and private
- Direct DOM access for reliable scraping
- One-click convenience vs manual copy-paste

### Why Dual Parsing?
- **Basic**: Fast, regex-based, good for clean exports
- **AI**: Intelligent, handles messy/unstructured text
- **Platform-Specific**: Direct HTML parsing for accuracy

### Why Global Settings?
- Consistency: Same username across all imports
- Override: Per-session customization when needed
- Sync: Bridge between web app and extension

---

## 🎯 Key Metrics

**Phase 4 Achievements (v0.1.0)**:
- 4 platforms supported
- 17 new extension files
- 100% backward compatible (IndexedDB v1 → v2)
- 0 compilation errors
- ~2,400 lines of code added

**Code Quality**:
- TypeScript strict mode
- React 19 with functional components
- Tailwind CSS v4 for styling
- ESM modules throughout
- Service worker architecture

**User Experience**:
- One-click capture via context menu
- Automatic title extraction
- Global settings with UI
- Toast notifications for feedback
- Offline-ready exports

---

## 🚀 Next Priorities

**Immediate (v0.2.0)**:
1. Full session merging implementation
2. Message-level curation UI
3. Export quality improvements
4. Bug fixes and performance optimization

**Short-term (v0.3.0)**:
1. PDF/DOCX export
2. Additional platform support
3. Cloud sync option
4. Enhanced search and filtering

**Long-term**:
1. Web-based archive access
2. Collaboration features
3. AI-powered summarization
4. API for integrations

---

## 📝 Notes

- All phases are designed to be non-breaking
- Users can opt-in to new features
- Legacy data is automatically migrated
- Code is organized for extensibility
- Documentation is comprehensive and up-to-date
