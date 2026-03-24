# Refactor Scan Protocol
## Systematic Codebase Analysis for Compartmentalization Opportunities

**Version**: 1.0
**Purpose**: Identify files that violate single responsibility principle, are difficult to navigate, or cause cascading failures when modified.

**When to Use**:
- At project kickoff (understand current state)
- After major feature addition (check if new debt introduced)
- Quarterly architecture review (track health over time)
- Before major refactoring (validate scope)

---

## 🔍 The Scan Matrix

This protocol uses three lenses to identify refactoring candidates:

### Lens 1: **File Size & Complexity**
*"How hard is this to understand?"*

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| **Lines of Code** | < 300 | 300-800 | > 800 |
| **Number of Exports** | 1-3 | 4-7 | 8+ |
| **Concerns/Responsibilities** | 1 | 2 | 3+ |
| **Top-level Functions** | 3-5 | 6-10 | 11+ |

**Example (Green)**:
```typescript
// src/utils/sanitizeUrl.ts - 50 lines, 1 export, 1 concern
export function sanitizeUrl(url: string): string | null {
  // Implementation
}
```

**Example (Red)**:
```typescript
// src/services/converterService.ts - 2,929 lines, 40+ exports, 14 concerns
export const parseChat = () => { /* ... */ }
export const generateHtml = () => { /* ... */ }
export const parseClaudeHtml = () => { /* ... */ }
export const parseGeminiHtml = () => { /* ... */ }
// ... and many more
```

---

### Lens 2: **Coupling & Cascading Risk**
*"How many things break if I change this file?"*

| Signal | Risk Level | What It Means |
|--------|-----------|--------------|
| **Imports in 1-2 files** | 🟢 LOW | Few dependencies; safe to change |
| **Imports in 5-10 files** | 🟡 MEDIUM | Moderate impact; coordinate changes |
| **Imports in 11+ files** | 🔴 HIGH | High cascading risk; refactor candidate |
| **Circular imports** | 🔴 CRITICAL | Blocks optimization; urgent refactor |
| **Mixed concerns** (e.g., parsing + storage + export) | 🔴 HIGH | Changes to one concern affect others |

**Example (Low Risk)**:
```
src/utils/escapeHtml.ts
  ↑ imports
  └── src/services/converterService.ts (1 file uses it)
```
*Safe to modify; low cascading risk*

**Example (High Risk)**:
```
src/services/converterService.ts
  ↑ imports
  ├── src/pages/ArchiveHub.tsx
  ├── src/pages/BasicConverter.tsx
  ├── src/components/ExportDropdown.tsx
  ├── src/components/MemoryArchive.tsx
  ├── src/components/PromptArchive.tsx
  ├── src/hooks/useExportOrchestration.ts
  ├── src/utils/exportUtils.ts
  ├── src/services/storageService.ts (circular!)
  └── ... (10+ total)
```
*Change to parseChat logic can break 10+ files*

---

### Lens 3: **State Explosion & Hook Interdependence**
*"Is this component/hook manageable?"*

| Signal | Count | Risk Level | Action |
|--------|-------|-----------|--------|
| **useState hooks** | < 5 | 🟢 GREEN | Manageable |
| **useState hooks** | 5-10 | 🟡 YELLOW | Getting complex |
| **useState hooks** | 11-15 | 🔴 RED | Refactor soon |
| **useState hooks** | 15+ | 🔴 CRITICAL | Refactor now |
| **useEffect hooks** | < 3 | 🟢 GREEN | Good |
| **useEffect hooks** | 3-5 | 🟡 YELLOW | Watch for interdependence |
| **useEffect hooks** | 6+ | 🔴 RED | Likely has circular dependencies |

**Example (Green)**:
```typescript
// src/components/ChatPreview.tsx - 150 lines
export const ChatPreview: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null);

  // One responsibility: preview a single chat
  // 2 state variables = manageable

  return <div>{/* ... */}</div>;
};
```

**Example (Red)**:
```typescript
// src/pages/ArchiveHub.tsx - 1,729 lines
export const ArchiveHub: React.FC = () => {
  const [sessions, setSessions] = useState<SavedChatSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json'>('html');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGoogleDriveImportOpen, setIsGoogleDriveImportOpen] = useState(false);
  const [isChatPreviewOpen, setIsChatPreviewOpen] = useState(false);
  const [isArtifactManagerOpen, setIsArtifactManagerOpen] = useState(false);
  // ... and 11 more useState hooks

  // Multiple responsibilities: 21 total
  // State interdependence: search affects session display affects export modal, etc.
  // Change one => affects 5 others

  return <div>{/* ... */}</div>;
};
```

---

## 🛠️ The Scan Protocol: Step-by-Step

### Step 1: Gather Metrics (10 minutes)

Run this analysis on your codebase:

```bash
# Count lines in each service
wc -l src/services/*.ts

# Count lines in each page
wc -l src/pages/*.tsx

# Count lines in each component
wc -l src/components/*.tsx

# List all exports from a file
grep "^export " src/services/converterService.ts | wc -l

# Count useState hooks in a component
grep "useState" src/pages/ArchiveHub.tsx | wc -l

# Count useEffect hooks in a component
grep "useEffect" src/pages/ArchiveHub.tsx | wc -l
```

### Step 2: Identify Imports (15 minutes)

For each "Red" file, count how many files import it:

```bash
# Find all files importing from converterService
grep -r "from.*converterService" src/ | wc -l

# Find all files importing from storageService
grep -r "from.*storageService" src/ | wc -l

# Find circular imports
grep -A5 "^import.*converterService" src/services/storageService.ts
grep -A5 "^import.*storageService" src/services/converterService.ts
```

### Step 3: Analyze Concerns (20 minutes)

For each Red/Yellow file, list the distinct concerns:

**Example: converterService.ts**
```
1. Parsing Layer
   - parseExportedJson
   - parseClaudeHtml
   - parseGeminiHtml
   - parseChatGptHtml
   - parseLeChatHtml
   - parseGrokHtml
   - parseLlamacoderHtml
   - parseAiStudioHtml
   - parseKimiHtml
   - parseKimiShareCopy

2. Export Generation
   - generateHtml
   - generateMarkdown
   - generateJson
   - generateZipExport
   - generateBatchZipExport
   - generateDirectoryExportWithPicker

3. Memory Export
   - generateMemoryHtml
   - generateMemoryMarkdown
   - generateMemoryJson
   - generateMemoryBatchZipExport
   - generateMemoryBatchDirectoryExport
   - generateMemoryBatchDirectoryExportWithPicker

4. Formatting Helpers
   - applyInlineFormatting
   - convertMarkdownToHtml
   - parseListBlock
   - parseTableBlock

5. Theme Management
   - themeMap constant

6. Utility Functions
   - isJson

Total: 6 distinct concerns mixed in one file
```

### Step 4: Risk Assessment (15 minutes)

For each candidate, assess:

```
FILE: src/services/converterService.ts
┌─────────────────────────────────────┐
│ COMPLEXITY METRICS                  │
├─────────────────────────────────────┤
│ Lines of Code: 2,929            │ 🔴 CRITICAL
│ Export Count: 40+               │ 🔴 CRITICAL
│ Concerns: 6                     │ 🔴 CRITICAL
│ Top-level Functions: 15+        │ 🔴 CRITICAL
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ COUPLING METRICS                    │
├─────────────────────────────────────┤
│ Files Importing: 11+            │ 🔴 CRITICAL
│ Circular Dependencies: YES      │ 🔴 CRITICAL
│ Concern Isolation: POOR         │ 🔴 CRITICAL
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ RISK ASSESSMENT                     │
├─────────────────────────────────────┤
│ Change Risk: VERY HIGH
│ Testing Difficulty: VERY HIGH
│ Reusability: LOW
│ Maintainability: POOR
│ Platform Addition: RISKY
│
│ OVERALL RISK: 🔴 CRITICAL
│ PRIORITY: P0 (Fix Before 1.0)
└─────────────────────────────────────┘

BREAKDOWN:
- Parser changes cascade through 5 pages
- Export changes cascade through 5 files
- Circular import with storageService blocks optimization
- Mixed concerns prevent independent testing
- New platform support requires diving into 2,900 line file

REFACTORING CANDIDATE: YES
SCOPE: Phase 1 (Parser Extraction) + Phase 2 (Export Extraction)
```

---

## 📊 Current Codebase Scan Results

### 🔴 CRITICAL (Refactor Immediately)

#### 1. `src/services/converterService.ts`
```
Status: 🔴 CRITICAL
Lines: 2,929
Exports: 40+
Concerns: 6 (parsing, export, memory, formatting, theming, utils)
Imports: 11+
Circular: YES (↔ storageService)

Risk Breakdown:
- Parser changes → cascade to 5 files (ArchiveHub, BasicConverter, etc.)
- Export changes → cascade to 5 files
- Adding new parser → must dive into 2,900-line file
- Circular dependency blocks tree-shaking, optimization

Refactoring Path:
Phase 1 (25h): Extract parsers to src/services/parsers/
Phase 2 (20h): Extract exporters to src/services/exporters/
```

#### 2. `src/pages/ArchiveHub.tsx`
```
Status: 🔴 CRITICAL
Lines: 1,729
useState hooks: 21
useEffect hooks: 6+
Concerns: 11 (sessions, search, export, import, modals, auth, metadata, artifacts)

Risk Breakdown:
- 21 useState hooks = state interdependence
- Change one hook → affects 5 others
- 8 modal state variables scattered
- Search integration affects session display
- Google Drive import affects both sessions & modals

Refactoring Path:
Phase 4 (25h): Extract custom hooks (8 hooks from page)
Phase 5 (15h): Extract modal context (centralize 8 modal states)
Result: ~300 line page (down from 1,729)
```

#### 3. `src/pages/BasicConverter.tsx`
```
Status: 🔴 CRITICAL
Lines: 1,644
useState hooks: 29
useEffect hooks: 4+
Concerns: 8 (parsing, preview, metadata, artifacts, export, theming, wizards, modals)

Risk Breakdown:
- 29 useState hooks = high interdependence
- Parsing state couples to preview state couples to export state
- 6 modal types managed with scattered state
- Adding new modal requires understanding entire 1,644-line component

Refactoring Path:
Phase 4 (25h): Extract custom hooks (5 hooks from page)
Phase 5 (15h): Extract modal context
Phase 6 (22h): Break component into focused sub-components
Result: ~400 line page (down from 1,644)
```

### 🟡 MAJOR (Refactor This Sprint)

#### 4. `src/services/storageService.ts`
```
Status: 🟡 MAJOR
Lines: 930
Exports: 20+
Concerns: 5 (sessions, settings, memory, prompts, migrations)
Imports: 6+
Circular: YES (↔ converterService)

Issues:
- Session storage ≠ settings storage ≠ memory storage
- Can't test session independently without loading memory
- Migration logic (v1-v6) clutters the main class
- Circular import: converterService wants to call parseChat after saving

Refactoring Path:
Phase 3 (18h): Split into domain-specific modules
- sessionStorage.ts
- settingsStorage.ts
- memoryStorage.ts
- promptStorage.ts
- database.ts
- migrations/
Result: No circular dependency, testable modules
```

#### 5. `src/components/SettingsModal.tsx`
```
Status: 🟡 MAJOR
Lines: 720
Concerns: 3 (settings form, Google Drive backup, database import/export)

Issues:
- Settings form = 50 lines
- Google Drive backup = 200 lines
- Database import/export = 300 lines
- All mixed in one modal
- Hard to test individual features

Refactoring Path:
Phase 6 (8h): Split into 3 panels
- SettingsPanel.tsx (150 lines)
- GoogleDrivePanel.tsx (200 lines)
- DatabasePanel.tsx (150 lines)
```

#### 6. `src/components/GoogleDriveImportModal.tsx`
```
Status: 🟡 MAJOR
Lines: 483
Concerns: 4 (file listing, selection, parsing, deduplication, save)

Issues:
- Business logic mixed with UI
- Hard to test import logic without mocking component
- Parsing logic couples to modal state

Refactoring Path:
Phase 6 (12h): Extract logic to hook
- useGoogleDriveImport.ts (hook with business logic)
- GoogleDriveImportModal.tsx (UI only, ~150 lines)
```

#### 7. `src/components/ContentImportWizard.tsx`
```
Status: 🟡 MAJOR
Lines: 469
Concerns: 5 (state machine, input method, parser selection, upload, preview)

Issues:
- 4-step wizard state machine
- 3 input methods × 11 parsers = complex state space
- Hard to add new step without understanding entire flow

Refactoring Path:
Phase 6 (10h): Extract state machine
- useWizardState.ts (state machine)
- steps/ folder (InputMethodStep, PlatformStep, ContentStep, ReviewStep)
- ContentImportWizard.tsx (orchestrator, ~150 lines)
```

### 🟢 MODERATE (Monitor)

#### 8. `src/contexts/AuthContext.tsx` - 300 lines, 1 concern, 3 useState ✅
#### 9. `src/components/ReviewEditModal.tsx` - 280 lines, 1 concern ✅
#### 10. `src/components/ChatContentModal.tsx` - 260 lines, 1 concern ✅

---

## 📈 Metrics Dashboard

**Current State (Today)**:
```
Critical Files: 3 (converterService, ArchiveHub, BasicConverter)
Major Files: 4 (storageService, SettingsModal, GoogleDriveImportModal, ContentImportWizard)
Total Debt: ~6,700 lines in 7 files

Largest File: converterService.ts (2,929 lines)
Most Complex Page: ArchiveHub.tsx (21 useState, 1,729 lines)
Most Coupled Service: converterService.ts (11+ imports)

Circular Dependencies: 1 (converterService ↔ storageService)
Components with 15+ useState: 1 (ArchiveHub)
Components with 10+ useState: 2 (ArchiveHub, BasicConverter)

Test Coverage Impact: LOW (hard to test monolithic files)
New Feature Risk: HIGH (changes cascade unpredictably)
Platform Addition Risk: VERY HIGH (must modify converterService.ts)
```

**After Full Refactor (Projected)**:
```
Critical Files: 0
Major Files: 0
Total Debt: ~2,000 lines (split into 50+ focused modules)

Largest File: ~300 lines (after extraction)
Most Complex Page: ~300 lines (ArchiveHub after hook extraction)
Most Coupled Service: ~100 lines (single-concern service)

Circular Dependencies: 0
Components with 15+ useState: 0
Components with 10+ useState: 0

Test Coverage Impact: HIGH (easy to unit test)
New Feature Risk: LOW (isolated changes)
Platform Addition Risk: LOW (mechanical task)
```

---

## 🎯 Refactoring Roadmap (Based on Scan)

| Priority | Phase | Files | Hours | Impact |
|----------|-------|-------|-------|--------|
| P0 | Phase 1: Parsers | converterService.ts | 25 | Fixes cascading parser failures |
| P0 | Phase 2: Exporters | converterService.ts + 4 files | 20 | Eliminates duplication |
| P0 | Phase 3: Storage | storageService.ts | 18 | Breaks circular dependency |
| P1 | Phase 4: Hooks | ArchiveHub.tsx + BasicConverter.tsx | 25 | Shrinks pages by 80% |
| P1 | Phase 5: Modals | ArchiveHub.tsx + BasicConverter.tsx | 15 | Centralizes modal management |
| P2 | Phase 6: Components | 4 component files | 22 | Breaks bloated components |
| P2 | Phase 7: Types | types.ts | 10 | Improves organization |
| P3 | Phase 8: Tests | all new modules | 20 | Comprehensive coverage |

**Total Effort**: ~155 hours over 8 weeks

---

## 🔄 Re-Scan Frequency

**Recommended Schedule**:
- **Weekly**: Check converterService.ts line count (watch for new monoliths)
- **Monthly**: Full scan of critical files (track debt growth)
- **Quarterly**: Complete architectural review (inform roadmap)

**Triggers for Urgent Scan**:
- New file exceeds 500 lines
- File starts importing from 10+ places
- Component gets 10+ useState hooks
- New circular dependency detected

---

## 📝 Scan Template (Use This to Add to CLAUDE.md)

When running refactor scan:

```
REFACTOR SCAN CHECKLIST
┌────────────────────────────────────────┐
│ 1. Gather Metrics                      │
│   ☐ Run wc -l on all services         │
│   ☐ Count exports per service         │
│   ☐ Count useState/useEffect hooks    │
│   ☐ Document results in table         │
│                                        │
│ 2. Identify Concerns                   │
│   ☐ List all distinct concerns        │
│   ☐ Mark mixed/isolated concerns      │
│   ☐ Flag multi-concern files          │
│                                        │
│ 3. Analyze Coupling                    │
│   ☐ Run grep for imports              │
│   ☐ Count files importing each        │
│   ☐ Identify circular dependencies    │
│                                        │
│ 4. Risk Assessment                     │
│   ☐ Calculate risk score              │
│   ☐ Assign priority level             │
│   ☐ Determine refactoring phase       │
│                                        │
│ 5. Document Findings                   │
│   ☐ Update this document              │
│   ☐ Update Memory Bank                │
│   ☐ Share results with team           │
└────────────────────────────────────────┘

TIME REQUIRED: 1 hour
FREQUENCY: Monthly (or after major changes)
```

---

## 💡 How to Use This Protocol

### For Developers
- **Check before refactoring**: "Is the file I'm about to change in the Critical/Major list?"
- **Understand cascading risk**: "How many files import from this?"
- **Plan feature work**: "Should I refactor first or risk cascading changes?"

### For Project Leads
- **Prioritize refactoring**: "What's blocking new features?"
- **Track technical debt**: "Is the codebase getting healthier?"
- **Plan sprints**: "How much refactoring bandwidth do we need?"

### For New Team Members
- **Onboard quickly**: "Which files should I avoid modifying?"
- **Learn architecture**: "Why are these files organized this way?"
- **Find safe areas**: "Where can I make changes without breaking things?"

---

## 🚀 Integration with Other Protocols

This protocol **feeds into**:
- **COMPARTMENTALIZATION_PROTOCOL**: Identifies which files to refactor
- **REFACTOR_ROADMAP_CUSTOMIZED**: Organizes scan results into phases
- **CLAUDE.md**: Guides daily development decisions

**Update triggers**:
- Run scan after completing each refactoring phase
- Update Memory Bank with new debt baseline
- Adjust roadmap based on new findings

---

## 📌 Key Takeaways

1. **3 Lenses**: Size/Complexity, Coupling, State Management
2. **Red = Urgent**: Fix before it cascades further
3. **Circular Dependencies**: Block both refactoring and optimization
4. **State Explosion**: 15+ hooks = time to extract
5. **Monthly Reviews**: Catch debt early before it spreads

---

## Template: Running This Scan Right Now

```bash
# Quick metrics
wc -l src/services/*.ts src/pages/*.tsx src/components/*.tsx | sort -rn

# Coupling check
for file in converterService storageService; do
  echo "=== Files importing $file ==="
  grep -r "from.*$file" src/ | wc -l
done

# useState check
for file in src/pages/*.tsx; do
  count=$(grep -c "useState" "$file" || echo 0)
  echo "$file: $count hooks"
done

# Concern identification (manual)
# For each red file, list the distinct "jobs" it does
```

---

## Questions to Ask When Running Scan

1. **Size**: Are there files > 1000 lines that don't have to be?
2. **Coupling**: Are there files imported by 10+ other files?
3. **Concerns**: Does any file have 3+ distinct responsibilities?
4. **Hooks**: Do any components have 15+ useState hooks?
5. **Circular**: Are there any imports A → B and B → A?
6. **Testing**: Are monolithic files hard to unit test?
7. **Adding features**: Would extracting files make new features easier?

---

**Ready to scan your codebase?** Run the protocol and share results! 🔍
