# Version Reference Map - Noosphere Reflect

**Purpose**: Complete list of all files and locations where version numbers appear. Used by the Update Agent for atomic version bumping.

**Current Version**: 0.5.3

---

## 📋 Critical Version References

### 1. **package.json** (Web Application)
- **File Path**: `/package.json`
- **Line**: 4
- **Current Value**: `"version": "0.5.3"`
- **Pattern**: `"version": "X.X.X"`
- **Type**: Primary Source of Truth
- **Scope**: Controls web app version, used during build/export
- **Update Method**: Direct string replacement

**Example**:
```json
{
  "name": "noosphere-reflect",
  "private": true,
  "version": "0.5.3",  ← UPDATE HERE
  "type": "module",
```

---

### 2. **extension/manifest.json** (Chrome Extension)
- **File Path**: `/extension/manifest.json`
- **Line**: 4
- **Current Value**: `"version": "0.5.3"`
- **Pattern**: `"version": "X.X.X"`
- **Type**: Extension Version
- **Scope**: Controls extension version in Chrome Web Store
- **Update Method**: Direct string replacement

**Example**:
```json
{
  "manifest_version": 3,
  "name": "Noosphere Reflect Bridge",
  "version": "0.5.3",  ← UPDATE HERE
  "description": "Capture AI conversations...",
```

---

### 3. **src/pages/Changelog.tsx** (Frontend Release Notes)
- **File Path**: `/src/pages/Changelog.tsx`
- **Lines**: 8, 20, 32, 47 (and beyond for historical versions)
- **Current Latest Version**: `version: 'v0.5.3'` (line 8)
- **Pattern**: `version: 'vX.X.X'`
- **Type**: UI Changelog Display
- **Scope**: Displays release notes in the Changelog page
- **Update Method**: Add new entry at TOP of the `changes` array
- **Critical**: ADD NEW ENTRY - do NOT modify existing entries

**Example Structure** (always add at line 8, after the array opening):
```typescript
const changes: Release[] = [
    {
        version: 'v0.5.4',  ← NEW VERSION HERE
        date: 'Jan 10, 2026',  ← CURRENT DATE
        title: 'Feature Title',
        items: [
            'Change 1',
            'Change 2',
        ]
    },
    {
        version: 'v0.5.3',  ← EXISTING (unchanged)
        date: 'Jan 10, 2026',
        ...
```

---

### 4. **README.md** (Repository Version Badge)
- **File Path**: `/README.md`
- **Line**: 4
- **Current Value**: `![Version](https://img.shields.io/badge/version-0.5.1-green.svg)`
- **Pattern**: `version-X.X.X`
- **Type**: Shields.io Badge (visual indicator)
- **Scope**: Displays version badge on GitHub README
- **Update Method**: Direct string replacement of version number only
- **Note**: This may lag behind actual version (historical)

**Example**:
```markdown
![License: MIT](...)
![Version](https://img.shields.io/badge/version-0.5.3-green.svg)  ← UPDATE HERE
![Build Status](...)
```

---

### 5. **src/services/converterService.ts** (Export Metadata - Batch Export)
- **File Path**: `/src/services/converterService.ts`
- **Line**: 2278
- **Current Value**: `version: '0.5.3'`
- **Pattern**: `version: 'X.X.X'` (inside `generateBatchExport()` function)
- **Type**: Export Metadata
- **Scope**: Embedded in batch export JSON for multi-session exports
- **Update Method**: Direct string replacement

**Context**:
```typescript
return {
  exportDate: new Date().toISOString(),
  exportedBy: {
    tool: 'Noosphere Reflect',
    version: '0.5.3'  ← UPDATE HERE
  },
  chats: chatMetadata,
  ...
```

---

### 6. **src/pages/ArchiveHub.tsx** (Export Metadata - Single Session)
- **File Path**: `/src/pages/ArchiveHub.tsx`
- **Line**: 395
- **Current Value**: `version: '0.5.3'`
- **Pattern**: `version: 'X.X.X'` (inside `handleExportSession()` function)
- **Type**: Export Metadata
- **Scope**: Embedded in single session export JSON
- **Update Method**: Direct string replacement

**Context**:
```typescript
const exportMetadata = {
    exportDate: new Date().toISOString(),
    exportedBy: {
        tool: 'Noosphere Reflect',
        version: '0.5.3'  ← UPDATE HERE
    },
    chats: [{
        ...
```

---

### 7. **CHANGELOG.md** (Markdown Release History)
- **File Path**: `/CHANGELOG.md`
- **Lines**: 19 (latest release header), plus sections for previous versions
- **Current Value**: `## [v0.5.2] - January 9, 2026`
- **Pattern**: `## [vX.X.X] - Month Day, Year`
- **Type**: Semantic Versioning Documentation
- **Scope**: Permanent record of all releases with detailed notes
- **Update Method**: ADD NEW SECTION at TOP of file (after "## [Unreleased]")
- **Critical**: Must follow Keep a Changelog format

**Structure to Add** (insert after line 10):
```markdown
---

## [v0.5.4] - January 10, 2026

### Added

- Feature description 1
- Feature description 2

### Fixed

- Bug fix 1

### Changed

- Breaking change 1

---

## [v0.5.3] - January 10, 2026  ← EXISTING (unchanged)
...
```

---

## 📊 Update Checklist

When updating to a new version, the Update Agent MUST modify:

- [ ] `package.json` - line 4
- [ ] `extension/manifest.json` - line 4
- [ ] `src/pages/Changelog.tsx` - ADD NEW ENTRY at top of changes array (line 8)
- [ ] `README.md` - line 4 (version badge)
- [ ] `src/services/converterService.ts` - line 2278
- [ ] `src/pages/ArchiveHub.tsx` - line 395
- [ ] `CHANGELOG.md` - ADD NEW SECTION at top (after "Unreleased")

---

## 🚫 Files to IGNORE

These files may contain version-like strings but are NOT to be modified:
- `/node_modules/**` - Dependency versions (locked by package-lock.json)
- `/CLAUDE.md` - Project documentation (contains examples, not source of truth)
- `/GEMINI.md` - Protocol documentation
- `/memory-bank/**` - Context files (not user-facing)
- `/src/types.ts` - Type definitions mentioning "version" but for data structures
- Extension content scripts and parsers - DO NOT contain version refs
- All `.md` files in `.agents/` and `.templates/` - Documentation only

---

## 🔄 Version Synchronization Rules

### Semantic Versioning Standard
- **Major.Minor.Patch** format (e.g., v0.5.3)
- Version prefix `v` used in Changelog.tsx and CHANGELOG.md
- NO `v` prefix in package.json, manifest.json, converterService.ts, ArchiveHub.tsx

### Atomic Updates
All 7 locations MUST be updated in a single commit with message:
```
chore(release): bump version to vX.X.X
```

### Date Consistency
- Changelog.tsx: Use "Month Day, Year" (e.g., "Jan 10, 2026")
- CHANGELOG.md: Use same format

### No Partial Updates
- Never update only some locations
- Always verify all 7 files before committing
- Use grep to confirm: `grep -r "0.5.3" src/ package.json extension/`

---

## 🛠️ Update Agent Workflow

1. **User Trigger**: Provides target version (e.g., "0.5.4")
2. **Validate**: Confirm semantic versioning format
3. **Update All Files**:
   - Run global search for current version
   - Update each file using Edit tool
   - Verify no false positives (ignore node_modules, .agents/)
4. **Generate Commit Message**: Use semantic format
5. **Ask User**: "Ready to commit? (y/n)"
6. **Git Commit**: If approved, commit with semantic message
7. **Verification**: Report all modified files

---

## 📝 Example: Update from 0.5.3 → 0.5.4

**Target Files & Changes**:
```
1. package.json:4
   OLD: "version": "0.5.3"
   NEW: "version": "0.5.4"

2. extension/manifest.json:4
   OLD: "version": "0.5.3"
   NEW: "version": "0.5.4"

3. src/pages/Changelog.tsx:8 (ADD NEW ENTRY)
   ADD: {
       version: 'v0.5.4',
       date: 'Jan 10, 2026',
       title: 'Your Release Title',
       items: [...]
   }

4. README.md:4
   OLD: badge/version-0.5.1-green
   NEW: badge/version-0.5.4-green
   (Note: May be behind)

5. src/services/converterService.ts:2278
   OLD: version: '0.5.3'
   NEW: version: '0.5.4'

6. src/pages/ArchiveHub.tsx:395
   OLD: version: '0.5.3'
   NEW: version: '0.5.4'

7. CHANGELOG.md:19 (ADD NEW SECTION AFTER UNRELEASED)
   ADD: ## [v0.5.4] - January 10, 2026
```

**Commit Message**:
```
chore(release): bump version to v0.5.4

Updated version references across:
- package.json
- extension/manifest.json
- src/pages/Changelog.tsx
- README.md
- src/services/converterService.ts
- src/pages/ArchiveHub.tsx
- CHANGELOG.md
```

---

## ✅ Verification

After all updates, the Update Agent should run:
```bash
grep -r "0.5.3" src/ package.json extension/ 2>/dev/null | grep -v node_modules
```

Should return **ZERO** results if fully updated.

New version search should return ALL 7 locations:
```bash
grep -r "0.5.4" src/ package.json extension/ 2>/dev/null | grep -v node_modules
```

Should return **7 matches**.

---

**Last Updated**: January 10, 2026
**Version Map Created By**: Claude Code
**Status**: Ready for Update Agent integration
