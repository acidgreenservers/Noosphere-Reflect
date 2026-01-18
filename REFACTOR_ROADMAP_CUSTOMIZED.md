# Customized Refactor Roadmap
## Based on Your Priorities: Cascading Failures + Navigation + Ambitious Scope

**User Input Summary**:
- 🎯 **Pain Point**: Cascading failures (changes ripple unexpectedly)
- ⏰ **Timeline**: Ambitious/Full sprint (~120 hours)
- 🏗️ **Vision**: Keep it simple (understandable by one person)
- 🧭 **Priority**: Navigation (understand code reading 2-3 files)

---

## 🎯 The Core Problem You're Solving

> "Every time I fix a ChatGPT parser bug or add a feature to one domain, I'm terrified I've broken something else in an unrelated part of the codebase."

**Why this happens**:
- converterService.ts mixes 11 parsers + export logic + markdown formatting
- ArchiveHub has 21 useState hooks with complex interactions
- Changes cascade: fix parser → re-index search → update modal state → bug somewhere else
- Large files = hard to understand what changed and what it affects

**What we're fixing**:
1. **Isolation**: Each parser lives alone; changes here don't touch Claude
2. **Clear Boundaries**: Each service has one job; exporter doesn't care about storage
3. **Navigability**: Developer reads 2-3 focused files, not 2,900 lines
4. **Reduced Coupling**: Import only what you need; circular dependencies broken

---

## 📋 Phased Implementation (Full Sprint, ~8 weeks)

### Phase 1: Parser Isolation (Week 1-2, ~25 hours)

**Goal**: Fix the biggest cascading failure point

**Current State**:
```
converterService.ts (2,929 lines)
├── parseClaudeHtml (150 lines) ← Fix one, worry about breaking others
├── parseGeminiHtml (150 lines)
├── parseChatGptHtml (50 lines)
├── parseLeChatHtml (500+ lines)
├── parseGrokHtml (600+ lines)
├── parseLlamacoderHtml (50 lines)
├── parseAiStudioHtml (70 lines)
├── parseKimiHtml & parseKimiShareCopy (70 lines)
└── ... (export logic, markdown formatting, etc.)
```

**Future State**:
```
src/services/parsers/
├── ParserFactory.ts (50 lines - dispatcher)
├── claude/
│   ├── parseClaudeHtml.ts (150 lines)
│   └── claudeUtils.ts (30 lines)
├── gemini/
│   ├── parseGeminiHtml.ts (150 lines)
│   └── geminiUtils.ts (40 lines)
├── chatgpt/
│   ├── parseChatGptHtml.ts (50 lines)
│   └── chatgptUtils.ts (10 lines)
├── lechat/
│   ├── parseLeChatHtml.ts (500 lines - keep together, domain-specific)
│   └── lechatUtils.ts (50 lines)
├── grok/
│   ├── parseGrokHtml.ts (600 lines)
│   └── grokUtils.ts (50 lines)
├── llamacoder/
├── aistudio/
├── kimi/
└── utils/
    ├── extractMarkdownFromHtml.ts (80 lines - shared by ALL)
    └── htmlParserBase.ts (40 lines - common patterns)
```

**Key Decision**: Simple structure
- Each platform gets a folder (claude/, gemini/, etc.)
- Shared utils in utils/ folder
- ParserFactory dispatches based on ParserMode enum
- ✅ When you fix Gemini, you look in gemini/ folder only

**Files to Create**: 18 new files
**Files to Modify**: converterService.ts, types.ts, all pages importing parseChat

**Implementation Steps**:
1. Create `src/services/parsers/` directory structure
2. Move each parser to its own file
3. Create ParserFactory.ts that dispatches to the right parser
4. Move shared utilities to utils/
5. Update converterService.ts to use ParserFactory
6. Update all import statements across the app
7. Test each parser independently

**Test Strategy**:
- Each parser gets 2-3 test cases (basic input, edge case, error case)
- Reference HTML from `/scripts/reference-html-dom/` used as test data

**Why This First**: Fixes your biggest pain (cascading parser failures) with minimal risk

---

### Phase 2: Export Consolidation (Week 2-3, ~20 hours)

**Goal**: Eliminate duplicate export logic scattered across 5 files

**Current Duplication**:
```
ExportDropdown.tsx: export format selection + blob generation
BasicConverter.tsx: same logic repeated
ArchiveHub.tsx: batch export, different code style
MemoryArchive.tsx: duplicate helpers
PromptArchive.tsx: duplicate helpers
```

**Future State**:
```
src/services/exporters/
├── exporterFactory.ts (dispatcher)
├── htmlExporter.ts (just generateHtml)
├── markdownExporter.ts (just generateMarkdown)
├── jsonExporter.ts (just generateJson)
├── zipExporter.ts (batch ZIP operations)
└── directoryExporter.ts (File System Access API)

src/utils/
├── exportUtils.ts (shared helpers)
│   ├── generateFilename()
│   ├── createBlob()
│   └── downloadFile()
└── formatters.ts (format-specific helpers)
```

**Key Decision**: Simple, no factory pattern overhead
- exporterFactory just picks the right exporter
- Each exporter exports `generate()` function
- Shared utils collected in exportUtils.ts
- ✅ Consistent export behavior everywhere

**Files to Create**: 6 new files
**Files to Modify**: converterService.ts, ArchiveHub.tsx, BasicConverter.tsx, ExportDropdown.tsx, MemoryArchive.tsx, PromptArchive.tsx, GoogleDriveImportModal.tsx

**Implementation Steps**:
1. Create exporter files in new directory
2. Move generateHtml, generateMarkdown, generateJson to appropriate exporters
3. Extract common filename/blob logic to exportUtils.ts
4. Create exporterFactory dispatcher
5. Update all files that call export functions
6. Remove duplicate code from pages/components

**Why This Phase**: Fixes cascading in a different way—changes to export format cascade to 5 places. Consolidating eliminates the problem.

---

### Phase 3: Storage Decoupling (Week 3-4, ~18 hours)

**Goal**: Break circular dependency, separate concerns (session ≠ settings ≠ memory ≠ prompt)

**Current State**:
```
storageService.ts (930 lines)
├── Session CRUD (getAllSessions, saveSession, etc.)
├── Settings CRUD (getSettings, saveSettings)
├── Memory CRUD (getMemory, saveMemory, etc.)
├── Prompt CRUD (getPrompt, savePrompt, etc.)
├── Migration logic (v1-v6 upgrade)
└── Circular import: imports parseChat from converterService

converterService.ts
└── Imports storageService for... (what exactly?)
```

**Future State**:
```
src/services/storage/
├── database.ts (low-level IndexedDB operations)
├── sessionStorage.ts (session CRUD only)
├── settingsStorage.ts (settings CRUD only)
├── memoryStorage.ts (memory CRUD only)
├── promptStorage.ts (prompt CRUD only)
├── migrations/
│   ├── v1ToV2.ts
│   ├── v2ToV3.ts
│   └── v3ToV6.ts
└── storageFactory.ts (returns specific storage)

// No circular import! converterService doesn't need storageService directly
// Each page/component imports what it needs:
import { sessionStorage } from '../../services/storage/sessionStorage';
```

**Key Decision**: Keep it simple
- No complex factories or interfaces
- Each storage type is its own file
- Page imports specific storage (not the whole storageService monolith)
- Breaks circular dependency immediately

**Files to Create**: 6 new files (sessionStorage, settingsStorage, memoryStorage, promptStorage, database.ts, migrations reorganized)
**Files to Modify**: storageService.ts (becomes facade or gets deleted), converterService.ts (no longer imports storageService), all pages/components

**Implementation Steps**:
1. Extract database.ts for low-level operations
2. Extract sessionStorage.ts with all session methods
3. Extract settingsStorage.ts with all settings methods
4. Extract memoryStorage.ts with all memory methods
5. Extract promptStorage.ts with all prompt methods
6. Move migrations to migrations/ folder
7. Update all imports across the app
8. Delete or deprecate storageService.ts (or make it a simple facade)

**Why This Phase**: Breaks cascading dependency chain. Fixes the root cause of why changes cascade unexpectedly.

---

### Phase 4: Page State Extraction (Week 4-5, ~25 hours)

**Goal**: Shrink ArchiveHub (1,729 → 300 lines) and BasicConverter (1,644 → 400 lines)

**Problem**:
```
ArchiveHub.tsx: 21 useState hooks managing:
├── Sessions
├── Search indexing
├── Export state
├── Google Drive sync
├── Extension bridge
├── 8 different modals
└── Settings

Result: 3,000+ lines of interdependent state
→ Change one hook → affects 5 others → bug somewhere
```

**Solution**: Custom hooks that encapsulate related state

**Future State**:
```
src/hooks/
├── useSessionManagement.ts
│   ├── sessions state
│   ├── loadSessions()
│   ├── deleteSession()
│   ├── updateSession()
│   └── renameSession()
│
├── useExportOrchestration.ts
│   ├── exportFormat state
│   ├── handleExport()
│   ├── handleBatchExport()
│   └── generateFilename()
│
├── useGoogleDriveSync.ts
│   ├── driveAuth state
│   ├── checkAuth()
│   ├── exportToDrive()
│   └── importFromDrive()
│
├── useExtensionBridge.ts
│   ├── extensionSessions buffer
│   ├── checkBridge()
│   ├── handleSessionImported() (with deduplication)
│   └── mergeWithExisting()
│
├── useSearchIntegration.ts
│   ├── searchResults state
│   ├── initSearch()
│   ├── handleSearch()
│   └── handleResultClick()
│
├── useSessionMetadata.ts
│   ├── metadata editing
│   ├── editTitle()
│   ├── editTags()
│   └── enrichMetadata()
│
├── useConverterState.ts (from BasicConverter)
│   ├── parsedChat state
│   ├── handleConvert()
│   ├── handleVerify()
│   └── preview state
│
└── useArtifactHandling.ts (from BasicConverter)
    ├── artifacts array
    ├── uploadArtifact()
    ├── deleteArtifact()
    └── linkArtifact()
```

**Key Decision**: Keep hooks simple and focused
- Each hook handles ONE concern
- Hooks can call other hooks (composition)
- Pages become just UI + hook calls
- ✅ Change in useExportOrchestration doesn't affect useSessionManagement

**Files to Create**: 9 new hook files
**Files to Modify**: ArchiveHub.tsx (shrink to 300 lines), BasicConverter.tsx (shrink to 400 lines)

**Implementation Steps**:
1. Create each custom hook file
2. Extract related state + functions from pages
3. Replace inline state/functions in pages with hook calls
4. Update ArchiveHub.tsx to be mostly UI rendering
5. Update BasicConverter.tsx to be mostly UI rendering
6. Test that hooks work independently

**Why This Phase**: Reduces state interdependence. Changes to one domain (export) won't affect another (search).

---

### Phase 5: Modal State Management (Week 5-6, ~15 hours)

**Goal**: Centralize 8 modal states into single context

**Current Problem**:
```
ArchiveHub.tsx has:
├── isSettingsModalOpen + setIsSettingsModalOpen
├── isExportModalOpen + setIsExportModalOpen
├── isExportDestinationModalOpen + setIsExportDestinationModalOpen
├── isArtifactManagerOpen + setIsArtifactManagerOpen
├── isChatPreviewOpen + setIsChatPreviewOpen
├── isGoogleDriveImportOpen + setIsGoogleDriveImportOpen
└── ... + handlers for each

Each modal adds 2-3 lines. Each handler couples to other state.
Adding a 9th modal = painful refactor.
```

**Solution**: Modal Context

**Future State**:
```
src/contexts/ModalContext.tsx
├── modalState: { [modalName]: open/closed + props }
├── openModal(name, props)
├── closeModal(name)
└── closeAllModals()

src/hooks/useModal.ts
├── Simple API for any component to use

// ArchiveHub.tsx becomes:
const { modals, openModal, closeModal } = useModal();

// Render:
{modals.settings && <SettingsModal onClose={() => closeModal('settings')} />}
```

**Key Decision**: Simple, not Redux-like
- Context is local to app, not global
- Modal names are strings (simpler than types)
- Each modal is responsible for its own render logic
- ✅ Adding 9th modal = add 1 entry to context, done

**Files to Create**: 3 new files (ModalContext.tsx, useModal.ts, ModalManager.tsx)
**Files to Modify**: ArchiveHub.tsx, BasicConverter.tsx, all modal components

**Implementation Steps**:
1. Create ModalContext
2. Create useModal hook
3. Update pages to use context
4. Remove individual modal state from pages
5. Update modal components to receive props from context

**Why This Phase**: Further reduces page line count and state interdependence.

---

### Phase 6: Component Refactoring (Week 6-7, ~22 hours)

**Goal**: Break down bloated components into composable pieces

**Current Bloat**:
```
SettingsModal.tsx (720 lines)
├── Settings form UI (50 lines)
├── Google Drive backup logic (200 lines)
├── Database import/export logic (300 lines)
└── Error handling/UI state (170 lines)

GoogleDriveImportModal.tsx (483 lines)
├── File listing (100 lines)
├── File selection (80 lines)
├── parseChat integration (100 lines)
├── Deduplication logic (50 lines)
├── Save to storage (50 lines)
└── UI state (100 lines)
```

**Solution**: Break into smaller, focused components

**Future State**:
```
src/components/
├── Settings/
│   ├── SettingsPanel.tsx (150 lines - just the form)
│   ├── GoogleDrivePanel.tsx (200 lines - backup/restore)
│   └── DatabasePanel.tsx (150 lines - import/export local DB)
│
├── Import/
│   ├── GoogleDriveImportModal.tsx (150 lines - file picker UI only)
│   ├── useGoogleDriveImport.ts (hook with logic)
│   └── ImportProgressBar.tsx (100 lines)
│
├── Converter/
│   ├── ChatPreviewPane.tsx (200 lines)
│   ├── MetadataPanel.tsx (150 lines)
│   ├── ArtifactPanel.tsx (150 lines)
│   ├── ExportPanel.tsx (150 lines)
│   └── ParserModeSelector.tsx (100 lines)
│
└── ... other components
```

**Key Decision**: Keep it simple, don't over-abstract
- Aim for 150-250 lines per component
- Extract business logic to hooks
- Keep component focused on UI rendering
- ✅ Easy to understand by reading one component + one hook

**Files to Create**: 8-10 new component files + 3-4 new hooks
**Files to Modify**: Remove old bloated components, update imports

**Implementation Steps**:
1. Identify cohesive chunks in each bloated component
2. Create new focused components
3. Extract logic to custom hooks
4. Update parent components to render new children
5. Test each new component in isolation

**Why This Phase**: Final push on navigation. Code becomes super readable.

---

### Phase 7: Type System Organization (Week 7, ~10 hours)

**Goal**: Centralize and organize all type definitions

**Current State**:
```
types.ts (164 lines)
├── Core types (ChatData, ChatMessage, etc.)
├── Parser types (ParserMode enum)
└── UI types (ChatTheme, ThemeClasses)

Scattered:
├── ListParseResult (defined in converterService.ts)
├── TableParseResult (defined in converterService.ts)
├── Component props (inline in .tsx files)
└── Service-specific types (scattered)
```

**Future State**:
```
src/types/
├── index.ts (re-exports everything)
├── chat.ts (ChatData, ChatMessage, ChatMetadata)
├── parser.ts (ParserMode, ParserResult, ListParseResult, TableParseResult)
├── storage.ts (SavedChatSession, AppSettings)
├── export.ts (ExportOptions, ExportResult)
├── ui.ts (ChatTheme, ThemeClasses, component props)
└── memory.ts (Memory, MemoryMetadata, etc.)
```

**Key Decision**: Simple file-per-domain, single index.ts re-export
- Easier to find types
- Reduces circular import risk
- Clear separation

**Files to Create**: 7 type files
**Files to Modify**: All imports of types.ts

**Implementation Steps**:
1. Create types directory structure
2. Categorize existing types
3. Move types to appropriate files
4. Create index.ts that re-exports all
5. Update all imports

---

### Phase 8: Testing & Documentation (Week 7-8, ~20 hours)

**Goal**: Add tests for extracted modules, document patterns

**What to Test**:
```
Parser tests (1-2 per parser):
├── src/services/parsers/test/
│   ├── claude.test.ts
│   ├── gemini.test.ts
│   ├── chatgpt.test.ts
│   └── ... (one per parser)

Hook tests:
├── src/hooks/__tests__/
│   ├── useSessionManagement.test.ts
│   ├── useExportOrchestration.test.ts
│   └── ... (one per custom hook)

Component tests (light):
├── src/components/__tests__/
│   └── ... (1-2 key components)

Integration tests:
└── src/__tests__/integration/
    └── parser-to-export.integration.test.ts (full flow)
```

**Documentation**:
```
README.md in each new folder
├── src/services/parsers/README.md
│   ├── What's in this folder
│   ├── How to add a new parser
│   ├── Testing strategy
│   └── Reference to /scripts/reference-html-dom/
│
├── src/hooks/README.md
│   ├── Hook directory
│   ├── Composition patterns
│   └── Common mistakes
│
└── ARCHITECTURE.md (top-level)
    ├── High-level overview
    ├── Data flow diagram
    ├── Where to find things
    └── Common refactor tasks
```

**Implementation Steps**:
1. Create test files for each major module
2. Write tests using reference HTML from /scripts/reference-html-dom/
3. Create README files in each directory
4. Create top-level ARCHITECTURE.md
5. Verify all tests pass
6. Update CLAUDE.md with refactored structure

---

## 📊 Timeline Summary

| Phase | Week | Hours | Focus |
|-------|------|-------|-------|
| 1: Parsers | 1-2 | 25 | Fix cascading parser failures |
| 2: Exporters | 2-3 | 20 | Eliminate duplication |
| 3: Storage | 3-4 | 18 | Break circular dependency |
| 4: Page State | 4-5 | 25 | Shrink pages, extract logic |
| 5: Modals | 5-6 | 15 | Centralize modal management |
| 6: Components | 6-7 | 22 | Break down bloated components |
| 7: Types | 7 | 10 | Organize type system |
| 8: Tests & Docs | 7-8 | 20 | Comprehensive testing + guides |
| **TOTAL** | **8 weeks** | **155 hours** | — |

---

## 🎯 Success Metrics

After refactor:
- ✅ No files > 300 lines (except generateHtml which is inherently large)
- ✅ Parser changes don't affect exporters or storage
- ✅ Can understand a domain by reading 2-3 focused files
- ✅ 80%+ test coverage on critical paths (parsers, hooks, exporters)
- ✅ Adding new parser = 5 files, mechanical process
- ✅ Developer can find code by looking at folder structure, not grep-ing

---

## 🚀 Next Steps

1. **Review this plan**—Does the structure make sense given your codebase?
2. **Approval**: Say "yes" when you're ready to start
3. **Phase 1**: We begin with parser extraction
4. **Weekly checkpoints**: Each phase completes before next begins
5. **Memory Bank updates**: Track why we made each decision

---

## 💡 Key Principle Throughout

**Keep it simple. Understandable by one person.**

Every extracted file answers these questions:
- What does this do? (clear file/folder name)
- Why is it separate? (comment at top of file)
- How do I use it? (simple interface)
- Where's the test? (test file nearby)

You should be able to look at the folder structure and understand the codebase without reading implementation details.

---

## 🤔 Questions Before We Start?

- Does this structure match your vision?
- Any phases you want to reorder?
- Concerns about any specific extraction?
- Want to adjust timeline or scope?

**Ready to begin Phase 1?** Just give the signal! 🚀
