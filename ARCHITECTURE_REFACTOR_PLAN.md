# Architecture Refactor Plan: Noosphere Reflect
## Collaborative Implementation Roadmap

**Created**: January 17, 2026
**Status**: Planning Phase (Awaiting User Input)
**Scope**: Full modularization of monolithic services

---

## 📊 Executive Summary

The codebase currently has **~6,000 lines distributed across 4 monolithic files** that violate single responsibility principle. This plan proposes breaking them into **~50 focused modules** organized by domain.

**Expected Outcomes**:
- ✅ 90% reduction in file size (max 200 lines per file)
- ✅ Independent testability for each parser/exporter/component
- ✅ Platform-specific code changes won't cascade
- ✅ New platform support = mechanical task, not risky surgery
- ✅ Clear separation of concerns

---

## 🎯 Before We Start: User Input Needed

Following the **COMPARTMENTALIZATION_PROTOCOL**, I need to ask you 4 key questions:

### Question 1: **What's the Real Pain Point?**

Which of these resonates most?

**A) Cascading Failures**
- ❌ "Every time I fix a ChatGPT parser bug, I worry I've broken Claude"
- ✅ **Choose if**: You're afraid changes ripple unpredictably

**B) Difficulty Adding Platforms**
- ❌ "I wanted to add Perplexity support but got lost in converterService.ts"
- ✅ **Choose if**: You want to add more platforms easily in future

**C) Testability**
- ❌ "I can't write unit tests because parsers are mixed with exporters"
- ✅ **Choose if**: You want strong test coverage before shipping

**D) Code Navigation**
- ❌ "To understand BasicConverter, I have to read 1,644 lines"
- ✅ **Choose if**: You find yourself getting lost in the codebase

**E) Multiple Issues**
- ✅ **Choose if**: You feel 2+ of the above

---

### Question 2: **How Much Refactoring Bandwidth Do You Have?**

**Surgical (1-2 weeks, ~30 hours)**
- Extract JUST the parsers from converterService.ts
- Keep everything else as-is
- ROI: Fixes cascading parser failures, enables platform addition

**Moderate (2-4 weeks, ~60 hours)**
- Refactor service layer (converterService + storageService)
- Extract custom hooks from pages
- Fix circular dependencies
- ROI: Much cleaner architecture, enables testing

**Ambitious (Full Sprint, ~120 hours)**
- Everything above PLUS
- Modal context system
- Component refactoring
- Comprehensive test suite
- ROI: Codebase is enterprise-grade, ready to scale

---

### Question 3: **What's Your 6-Month Vision?**

Paint a picture of where you want the codebase to be:

**Vision A: Plugin Architecture**
- "Each AI platform (Claude, ChatGPT, Gemini) is its own self-contained plugin"
- "I can enable/disable platforms dynamically"
- "New platforms are added without touching core logic"

**Vision B: Layered by Responsibility**
- "Services are organized by domain: parsers/, exporters/, storage/"
- "Pages are thin UI shells that delegate to services/hooks"
- "Clear data flow: UI → hooks → services → storage"

**Vision C: Keep It Simple**
- "Just make large files smaller"
- "Keep it understandable by one person"
- "Don't over-engineer for hypothetical future"

---

### Question 4: **Trade-Off Preference**

When we face choices, what should we optimize for?

**A) Testability**
- "I want comprehensive unit tests, even if it means more files"
- Extract granularly, create detailed test suites

**B) Navigation/Readability**
- "I want to understand code by reading 2-3 files, not 10"
- Extract smartly, but not to extremes

**C) Implementation Speed**
- "Get it working, don't over-engineer"
- Extract only what's strictly necessary

---

## 📝 Waiting For Your Input...

Once you answer the 4 questions above, I'll provide:

1. **Concrete File Structure** (exact paths, file names, line counts)
2. **Phased Implementation Steps** (week-by-week breakdown)
3. **Progress Tracking** (checkpoints, testing strategy)
4. **Risk Mitigation** (circular dependencies, import cascades)

---

## 🗺️ Preview: What The Architecture Could Look Like

### Current State (Monolithic)
```
src/
├── services/
│   ├── converterService.ts (2,929 lines) ← Monolith
│   ├── storageService.ts (930 lines) ← Monolith
│   └── ...
├── pages/
│   ├── ArchiveHub.tsx (1,729 lines) ← State explosion
│   ├── BasicConverter.tsx (1,644 lines) ← State explosion
│   └── ...
└── components/
    ├── SettingsModal.tsx (720 lines) ← Bloated
    ├── GoogleDriveImportModal.tsx (483 lines) ← Mixed concerns
    └── ... (14 modals total)
```

### Proposed State (Modular - Option B: Balanced)
```
src/
├── services/
│   ├── converterService.ts (200 lines) ← Dispatcher only
│   ├── parsers/
│   │   ├── ParserFactory.ts
│   │   ├── claude/
│   │   │   ├── parseClaudeHtml.ts
│   │   │   └── claudeUtils.ts
│   │   ├── gemini/
│   │   │   ├── parseGeminiHtml.ts
│   │   │   └── geminiUtils.ts
│   │   ├── chatgpt/
│   │   ├── lechat/
│   │   ├── grok/
│   │   ├── llamacoder/
│   │   ├── aistudio/
│   │   ├── kimi/
│   │   └── utils/
│   │       ├── extractMarkdownFromHtml.ts
│   │       └── htmlParserBase.ts
│   │
│   ├── exporters/
│   │   ├── exporterFactory.ts
│   │   ├── htmlExporter.ts (just generateHtml)
│   │   ├── markdownExporter.ts (just generateMarkdown)
│   │   ├── jsonExporter.ts (just generateJson)
│   │   ├── zipExporter.ts (batch operations)
│   │   └── directoryExporter.ts (File System Access API)
│   │
│   ├── storage/
│   │   ├── storageFactory.ts
│   │   ├── sessionStorage.ts (CRUD for sessions)
│   │   ├── settingsStorage.ts (CRUD for settings)
│   │   ├── memoryStorage.ts (CRUD for memories)
│   │   ├── promptStorage.ts (CRUD for prompts)
│   │   └── migrations/
│   │       ├── v1ToV2.ts
│   │       ├── v2ToV3.ts
│   │       └── v3ToV6.ts
│   │
│   └── ... (other services)
│
├── hooks/
│   ├── useSessionManagement.ts (extracted from ArchiveHub)
│   ├── useExportOrchestration.ts (extracted from ArchiveHub)
│   ├── useGoogleDriveSync.ts (extracted from ArchiveHub)
│   ├── useExtensionBridge.ts (extracted from ArchiveHub)
│   ├── useSearchIntegration.ts (extracted from ArchiveHub)
│   ├── useConverterState.ts (extracted from BasicConverter)
│   ├── useMessageEditing.ts (extracted from BasicConverter)
│   └── useArtifactHandling.ts (extracted from BasicConverter)
│
├── pages/
│   ├── ArchiveHub.tsx (~300 lines) ← Just UI + hooks
│   ├── BasicConverter.tsx (~400 lines) ← Just UI + hooks
│   └── ...
│
└── components/
    ├── SettingsPanel.tsx (settings only)
    ├── GoogleDrivePanel.tsx (Drive integration only)
    ├── DatabasePanel.tsx (import/export only)
    └── modals/
        ├── ChatPreviewModal.tsx
        ├── ExportModal.tsx
        └── ... (lazyloaded)
```

---

## 🏗️ Phased Roadmap (Subject to Change Based on Your Input)

### Phase 1: Parser Modularity (Week 1-2)
**Surgical extraction that fixes the biggest pain point**

```
Create: src/services/parsers/
├── ParserFactory.ts (dispatcher)
├── claude/
├── gemini/
├── chatgpt/
├── lechat/
├── grok/
├── llamacoder/
├── aistudio/
├── kimi/
└── utils/

Files to modify:
- converterService.ts (reduce to dispatcher + basic mode parsing)
- types.ts (add ParserMode → implementation mapping)
- All pages/components that import parseChat (change import path)

Effort: ~20 hours
Outcome: Platform-specific parsers can now be changed independently
```

### Phase 2: Exporter Modularity (Week 2-3)
**Break apart export logic that's duplicated 5+ places**

```
Create: src/services/exporters/
├── exporterFactory.ts
├── htmlExporter.ts
├── markdownExporter.ts
├── jsonExporter.ts
├── zipExporter.ts
└── directoryExporter.ts

New: src/utils/exportUtils.ts (shared helpers for all exporters)

Files to modify:
- converterService.ts (remove export functions, import from exporters/)
- ArchiveHub.tsx (use exporterFactory)
- BasicConverter.tsx (use exporterFactory)
- ExportDropdown.tsx (use exporterFactory)
- MemoryArchive.tsx (use exporterFactory)
- PromptArchive.tsx (use exporterFactory)

Effort: ~15 hours
Outcome: Consistent export behavior across the app, DRY principle applied
```

### Phase 3: Storage Modularity (Week 3)
**Decouple domain-specific storage from shared database layer**

```
Create: src/services/storage/
├── storageFactory.ts
├── sessionStorage.ts
├── settingsStorage.ts
├── memoryStorage.ts
├── promptStorage.ts
└── database.ts

Move existing migration logic from storageService.ts to:
src/services/storage/migrations/

Files to modify:
- storageService.ts (becomes a facade)
- converterService.ts (import sessionStorage not storageService)
- ArchiveHub.tsx (use sessionStorage directly)
- BasicConverter.tsx (use sessionStorage directly)

Effort: ~12 hours
Outcome: Can test session storage without loading memory storage; circular dependency broken
```

### Phase 4: Custom Hooks Extraction (Week 4)
**Shrink ArchiveHub and BasicConverter from 1,700+ lines to 300-400**

```
Create: src/hooks/
├── useSessionManagement.ts (from ArchiveHub)
├── useExportOrchestration.ts (from ArchiveHub)
├── useGoogleDriveSync.ts (from ArchiveHub)
├── useExtensionBridge.ts (from ArchiveHub)
├── useSearchIntegration.ts (from ArchiveHub)
├── useSessionMetadata.ts (from ArchiveHub)
├── useConverterState.ts (from BasicConverter)
├── useMessageEditing.ts (from BasicConverter)
└── useArtifactHandling.ts (from BasicConverter)

Files to modify:
- ArchiveHub.tsx (now ~300 lines, just UI + hook calls)
- BasicConverter.tsx (now ~400 lines, just UI + hook calls)

Effort: ~20 hours
Outcome: Pages become thin shells; business logic is testable
```

### Phase 5: Modal Context System (Week 5)
**Centralize 8 modal state variables into single context**

```
Create: src/contexts/ModalContext.tsx
src/hooks/useModal.ts
src/components/ModalRenderer.tsx

Refactor modal components:
- SettingsModal.tsx (~150 lines, just UI)
- ExportModal.tsx (~100 lines, just UI)
- ... (all modals become 100-150 lines)

Files to modify:
- ArchiveHub.tsx (use useModal hook)
- BasicConverter.tsx (use useModal hook)

Effort: ~15 hours
Outcome: Modals are managed consistently; pages are 20% shorter
```

### Phase 6: Component Refactoring (Week 6)
**Break down bloated components into composable pieces**

```
Split:
- SettingsModal.tsx → SettingsPanel + GoogleDrivePanel + DatabasePanel
- GoogleDriveImportModal.tsx → extract importService.ts + simpler UI
- ContentImportWizard.tsx → ImportWizard + steps/ + hooks/
- BasicConverter.tsx → BasicConverterPage + ChatPreviewPane + MetadataPanel + etc.

Effort: ~18 hours
Outcome: Components are <300 lines, independently testable
```

### Phase 7: Testing & Documentation (Week 7)
**Comprehensive test suite + README for each module**

```
Create:
- src/services/parsers/test/
  ├── claude.test.ts
  ├── gemini.test.ts
  ├── chatgpt.test.ts
  └── ...

- src/hooks/__tests__/
  ├── useSessionManagement.test.ts
  ├── useExportOrchestration.test.ts
  └── ...

Create README.md in each new directory explaining:
- Purpose
- What files are in here
- How to add a new parser/exporter/hook
- Testing strategy
- Common pitfalls

Effort: ~20 hours
Outcome: Codebase is maintainable, onboarding docs clear
```

---

## 💡 Key Decisions Awaiting Your Input

### Decision 1: ParserFactory Pattern?

**Option A (Recommended)**: Factory pattern that dispatches based on ParserMode
```typescript
const parser = ParserFactory.getParser(mode);
const chatData = await parser.parse(input);
```
✅ Pro: Easy to add new parsers, clear interface
❌ Con: One more abstraction layer

**Option B**: Direct imports
```typescript
import { parseGeminiHtml } from './parsers/gemini/parseGeminiHtml';
const chatData = parseGeminiHtml(input);
```
✅ Pro: Simpler, fewer files
❌ Con: Import statements scattered throughout app

**Which do you prefer?** → Informs Phase 1 implementation

---

### Decision 2: Aggressive Module Splitting (Option B) or Conservative (Option A)?

**Option A (Conservative)**: Keep some utilities together
- src/services/parsers/ has one big utils.ts
- Fewer files, easier to navigate

**Option B (Balanced - Recommended)**: Maximize isolation
- src/services/parsers/utils/ has multiple utilities
- More files, but each parser is truly independent

**Option C (Aggressive)**: Maximum modularity
- src/services/parsers/gemini/ has its own utilities
- 15+ new files, but Gemini parser could be npm package

**Which matches your vision?** → Informs architecture depth

---

### Decision 3: Refactor Scope?

**Surgical (Quick Win)**: Phases 1-2 only (~35 hours)
- Fixes cascading parser failures
- No page/component changes
- Can ship new platform support easily

**Moderate (Solid Foundation)**: Phases 1-5 (~80 hours)
- Full service layer refactor
- Pages become thin shells
- Ready for significant new features

**Ambitious (Enterprise-Grade)**: Phases 1-7 (~120 hours)
- Everything modular
- Comprehensive test suite
- Production-ready architecture

**Which timeline works for you?** → Informs effort planning

---

## 🎯 Once You Answer, I'll Provide:

### Immediate (Stage 2 of COMPARTMENTALIZATION_PROTOCOL):
✅ Detailed breakdown answering all your questions
✅ Validation that proposed refactor solves your actual pain
✅ Revised roadmap based on your scope preference

### Then (Stage 3):
✅ Phase-by-phase implementation plan with exact file locations
✅ Test strategy for each phase
✅ Progress tracking (using TodoWrite)

### Finally (Execution):
✅ Create files in order
✅ Track imports that need updating
✅ Verify tests pass at each checkpoint
✅ Update Memory Bank as we learn

---

## 📌 What's NOT Changing

- ✅ React component structure (pages still route the same)
- ✅ Data types (ChatData, SavedChatSession, etc.)
- ✅ User-facing behavior (same UI, same features)
- ✅ Storage layer (IndexedDB works the same)
- ✅ External dependencies

This is **internal code organization only**—from user perspective, app works identically.

---

## 🚀 Ready to Move Forward?

Please answer the 4 key questions above:

1. **What's the real pain point?** (A/B/C/D/E)
2. **How much bandwidth do you have?** (Surgical/Moderate/Ambitious)
3. **What's your 6-month vision?** (Plugin/Layered/Simple)
4. **Trade-off preference?** (Testability/Navigation/Speed)

Once I have your answers, I'll create a **detailed, personalized refactor plan** with:
- Exact file structure (you'll see exactly where things go)
- Week-by-week implementation steps
- Before/after code examples
- Risk assessment for each phase

**Let's build something clean together.** 🏗️
