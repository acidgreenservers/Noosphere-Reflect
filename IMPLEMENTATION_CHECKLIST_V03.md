# v0.3.0 Implementation Checklist
## IndexedDB Security Upgrade (v2 → v3)

**Status**: READY FOR IMPLEMENTATION
**Prerequisites**: SECURITY-ROADMAP.md reviewed
**Estimated Duration**: 2-3 hours including testing
**Start Date**: January 7-8, 2026 (Next Session)

---

## Phase 1: Unicode Normalization Utility

### Task 1.1: Create File
**File**: `/home/dietpi/Documents/VSCodium/GitHub/AI-Chat-HTML-Converter/src/utils/textNormalization.ts`

**Checklist**:
- [ ] Create new file at path above
- [ ] Copy `normalizeTitle()` function from SECURITY-ROADMAP.md Phase 1
- [ ] Copy `validateTitle()` function from SECURITY-ROADMAP.md Phase 1
- [ ] Add JSDoc comments above each function
- [ ] Verify TypeScript compilation with `npm run build`

**Code Source**: SECURITY-ROADMAP.md lines 92-138

**Validation**:
```bash
npm run build
# Should produce: 52 modules transformed (was 51), 0 errors
```

---

## Phase 2: Update Type Definitions

### Task 2.1: Update SavedChatSession Interface
**File**: `/home/dietpi/Documents/VSCodium/GitHub/AI-Chat-HTML-Converter/src/types.ts`

**Changes**:
- [ ] Find `interface SavedChatSession`
- [ ] Locate the last property before closing brace
- [ ] Add new optional property: `normalizedTitle?: string;`
- [ ] Position comment: `// NEW: normalized title for indexing and duplicate detection`

**Verification**: TypeScript should compile without errors

---

## Phase 3: Database Migration Logic

### Task 3.1: Update DB_VERSION
**File**: `src/services/storageService.ts` (Line 4)

**Changes**:
- [ ] Find line: `const DB_VERSION = 2;`
- [ ] Change to: `const DB_VERSION = 3;`

### Task 3.2: Import textNormalization
**File**: `src/services/storageService.ts` (Top imports)

**Changes**:
- [ ] Add import: `import { normalizeTitle } from '../utils/textNormalization';`
- [ ] Place near other utility imports

### Task 3.3: Update getDB() Method
**File**: `src/services/storageService.ts` (Lines 11-41)

**Changes**:
- [ ] Locate `request.onupgradeneeded = (event) => {`
- [ ] Find the v1→v2 migration block
- [ ] After v1→v2 block, add v2→v3 block from SECURITY-ROADMAP.md Phase 2 (lines 179-210)
- [ ] Include:
  - Unique index creation on `normalizedTitle`
  - Defensive check: `if (!store.indexNames.contains('normalizedTitle'))`
  - Backfill loop for existing sessions
  - Error handling with try-catch

**Key Points**:
- [ ] Keep existing v0→v1 and v1→v2 code intact
- [ ] Only add new v2→v3 block
- [ ] Test with existing database before clearing

### Task 3.4: Verification
```bash
npm run build
# Check: 52-53 modules, 0 errors
# Check: No TypeScript errors
```

---

## Phase 4: Refactor saveSession() Method

### Task 4.1: Replace Current Implementation
**File**: `src/services/storageService.ts` (Replace lines 67-103)

**Checklist**:
- [ ] Select entire current `saveSession()` method (from `async saveSession` to closing brace)
- [ ] Delete existing code
- [ ] Paste new implementation from SECURITY-ROADMAP.md Phase 4 (lines 264-345)

**New Method Features**:
- [ ] Title validation using `normalizeTitle()`
- [ ] `normalizedTitle` assignment: `session.normalizedTitle = normalizeTitle(title)`
- [ ] Secure ID generation: `session.id = crypto.randomUUID()`
- [ ] Single transaction for check+write atomicity
- [ ] ConstraintError handling for duplicate detection
- [ ] Index lookup using: `store.index('normalizedTitle')`
- [ ] Reuse existing ID on duplicate: `session.id = existingSession.id`

### Task 4.2: Error Handling
Verify method handles:
- [ ] Missing title (logs warning, generates UUID)
- [ ] Invalid title (throws error from `normalizeTitle()`)
- [ ] ConstraintError (graceful overwrite with index lookup)
- [ ] Other errors (proper rejection)

### Task 4.3: Verification
```bash
npm run build
# Check: 0 TypeScript errors
# Check: saveSession() compiles successfully
```

---

## Phase 5: Remove Obsolete Code

### Task 5.1: Delete findSessionByTitle()
**File**: `src/services/storageService.ts`

**Checklist**:
- [ ] Find method: `async findSessionByTitle(title: string): Promise<SavedChatSession | null> {`
- [ ] Delete entire method (approximately lines 105-127)
- [ ] Search entire codebase for calls to `findSessionByTitle()`
- [ ] Verify NO remaining calls (use IDE search: `findSessionByTitle`)

**Verification**:
```bash
npm run build
# Check: 0 compilation errors (no "cannot find name findSessionByTitle" errors)
```

### Task 5.2: Check for References
```bash
grep -r "findSessionByTitle" src/
# Should return: (no results)
```

---

## Phase 6: Add Optional Utility (If Needed)

### Task 6.1: Add Lookup Helper
**File**: `src/services/storageService.ts`

**Optional**: Add `findSessionByNormalizedTitle()` if other code needs to lookup by title

**Source**: SECURITY-ROADMAP.md Phase 6 (lines 384-402)

**Note**: Not required if `saveSession()` is the only place that needs title lookup

---

## Phase 7: Testing

### Test 7.1: Build Verification
```bash
npm run build
# Expected: ✓ 52-53 modules, 0 errors, 0 warnings
```

**Checklist**:
- [ ] Build completes without errors
- [ ] No TypeScript errors in console
- [ ] dist/ folder updated
- [ ] index.js file created

### Test 7.2: Manual Testing (Browser)

**Test 7.2.1: Single Session Save**
- [ ] Open app in browser
- [ ] Navigate to BasicConverter
- [ ] Paste sample chat content
- [ ] Enter title: "Test Session"
- [ ] Click Convert, then Save Chat
- [ ] Verify: Session appears in Saved Sessions
- [ ] Check browser console: Should log `✅ Saved session: "Test Session"`

**Test 7.2.2: Unicode Handling**
- [ ] Create session with title: `"Café (NFC)"` (U+00E9)
- [ ] Create another session with title: `"Café (NFD)"` (U+0065 U+0301)
- [ ] Save both
- [ ] Verify: Only ONE session exists (second overwrites first)
- [ ] Check normalized titles are identical in IndexedDB

**Test 7.2.3: Zero-Width Character**
- [ ] Create session with title: `"Test Session"`
- [ ] Create another with title: `"Test​ Session"` (contains U+200B between words)
- [ ] Save both
- [ ] Verify: Only ONE session exists (duplicates detected)

**Test 7.2.4: Duplicate Detection**
- [ ] Create session: "My Chat Export"
- [ ] Save it
- [ ] Try saving another session with same title
- [ ] Verify: Second save overwrites first (same ID)
- [ ] Check ArchiveHub: Only one session with that title

**Test 7.2.5: Import Feature (Verify Still Works)**
- [ ] Export one session as JSON
- [ ] Import it back using batch import
- [ ] Verify: Metadata auto-populated
- [ ] Verify: No duplicate sessions created

### Test 7.3: Edge Case Testing

**Test 7.3.1: Empty Title**
- [ ] Create session without title
- [ ] Save it
- [ ] Verify: No error, UUID generated, session saved
- [ ] Check console: Warning logged about missing title

**Test 7.3.2: Very Long Title**
- [ ] Create title: `"A" * 501` (600 characters)
- [ ] Try to save
- [ ] Verify: Error thrown: "Title exceeds maximum length"
- [ ] Verify: Session NOT saved

**Test 7.3.3: Rapid Saves (Race Condition Test)**
```javascript
// In browser console:
const sessions = [
  { title: "Test", content: "..." },
  { title: "Test", content: "..." },
  { title: "Test", content: "..." }
];

// Import converterService and storageService
// Create 3 sessions with same title rapidly
Promise.all([
  storageService.saveSession({...}),
  storageService.saveSession({...}),
  storageService.saveSession({...})
]);

// Then check: ArchiveHub should show only 1 session
```

**Verify**: Only 1 session exists (race condition fixed)

### Test 7.4: Database Migration Test

**Test 7.4.1: Upgrade from v2**
- [ ] Clear browser IndexedDB (DevTools → Application → Storage → IndexedDB → Delete)
- [ ] Downgrade DB_VERSION to 2 temporarily (test rollback scenario)
- [ ] Create/save 3 sessions with v2 code
- [ ] Restore DB_VERSION to 3
- [ ] Open app in browser
- [ ] Verify: v2→v3 migration runs
- [ ] Check console: `✅ Created unique index on normalizedTitle`
- [ ] Check console: Backfill messages (e.g., `🔄 Backfilled normalizedTitle for: My Chat`)
- [ ] Verify: All 3 sessions still exist and are unchanged
- [ ] Verify: Each session now has `normalizedTitle` field populated

**Test 7.4.2: Idempotent Migration**
- [ ] Reload app
- [ ] Verify: Migration doesn't run again (index already exists)
- [ ] Check console: No duplicate messages

### Test 7.5: Performance Test

**Test 7.5.1: Bulk Import (1,000 Sessions)**
- [ ] Generate 1,000 JSON export files (can be duplicates)
- [ ] Batch import all 1,000 files
- [ ] Measure time: `start = Date.now(); ... end = Date.now(); console.log(end - start)`
- [ ] Verify: Import completes in < 10 seconds
- [ ] Verify: ArchiveHub displays all imported sessions smoothly
- [ ] Verify: No UI freeze during import

**Test 7.5.2: Lookup Performance**
- [ ] With 1,000+ sessions in database
- [ ] Save a new session
- [ ] Measure `saveSession()` duration
- [ ] Verify: Save completes in < 50ms (even with 10,000 sessions)
- [ ] Compare to before: Should be 10x faster than O(n) scan

---

## Phase 8: Documentation Updates

### Task 8.1: Update CHANGELOG.md
**File**: `CHANGELOG.md`

**Checklist**:
- [ ] Move content from `[Unreleased]` section to new `[v0.3.0]` section
- [ ] Add date: January 7-8, 2026
- [ ] Update section header: `## [v0.3.0] - January 7, 2026`
- [ ] Add new `[Unreleased]` section at top
- [ ] Verify links and formatting

### Task 8.2: Update RELEASE_NOTES.md
**File**: `RELEASE_NOTES.md`

**Checklist**:
- [ ] Change header from `# Release Notes: v0.3.0 (Upcoming)` to `# Release Notes: v0.3.0`
- [ ] Update: `**Release Date**: January 6, 2026` to actual date
- [ ] Change status from `(In Development)` to complete ✅
- [ ] Add testing results summary

### Task 8.3: Update memory-bank/progress.md
**File**: `memory-bank/progress.md`

**Checklist**:
- [ ] Update `Current Release` from `v0.2.0` to `v0.3.0`
- [ ] Update `Last Updated` date to today
- [ ] Mark Phase 5 as complete in "🚧 Upcoming Phases"
- [ ] Add v0.3.0 details to "🔄 Recent Changes"

### Task 8.4: Update package.json
**File**: `package.json`

**Checklist**:
- [ ] Update `version` from `0.1.0` (or current) to `0.3.0`
- [ ] Verify other metadata is correct

---

## Phase 9: Final Verification

### Task 9.1: Complete Build & Test
```bash
# Clean build
rm -rf dist/
npm run build

# Check output
echo "Build Status:"
ls -lah dist/
echo ""
echo "Module count:"
grep "modules transformed" <build output>
```

**Checklist**:
- [ ] Build completes: `52-53 modules, 0 errors`
- [ ] dist/ folder contains: index.html, index.css, index.js
- [ ] No TypeScript errors or warnings
- [ ] No console warnings in browser

### Task 9.2: Browser Smoke Test
- [ ] Open `http://localhost:3000/AI-Chat-HTML-Converter/` (or `npm run preview`)
- [ ] ArchiveHub loads without errors
- [ ] Can create new sessions
- [ ] Can save sessions to IndexedDB
- [ ] Duplicate detection works (same title = overwrite)
- [ ] BasicConverter import feature works
- [ ] Batch import works
- [ ] All pages load correctly

### Task 9.3: GitHub Commit
```bash
git add .
git commit -m "feat: Implement IndexedDB v3 with Unicode normalization and unique index

- Add textNormalization.ts with NFKC normalization + zero-width removal
- Create unique index on normalizedTitle for atomic duplicate detection
- Replace O(n) findSessionByTitle with O(log n) index lookup
- Use crypto.randomUUID() for secure ID generation
- Migrate IndexedDB from v2 to v3 with automatic backfill
- Fix TOCTOU race condition in saveSession()

Fixes CVE-001 (Critical TOCTOU), CVE-002 (High Unicode bypass), CVE-003 (High O(n) perf)

Performance: 10,000 sessions now save in <50ms (was 1s+)
Breaking changes: None (backward compatible)
Testing: 20+ test cases passed"
```

### Task 9.4: Tag Release
```bash
git tag -a v0.3.0 -m "Release v0.3.0: Security fixes and import feature"
# Optionally: git push origin v0.3.0
```

---

## Phase 10: Post-Implementation

### Task 10.1: Mark Documentation Complete
- [ ] Update SECURITY-ROADMAP.md status: Add "✅ IMPLEMENTED on Jan 7, 2026"
- [ ] Update SESSION_SUMMARY_JAN6_SESSION2.md: Add link to implementation results
- [ ] Close this checklist: Mark all tasks complete

### Task 10.2: Plan Next Phase
- [ ] Review ROADMAP.md for Phase 5 (Advanced Context Composition)
- [ ] If time allows, begin planning session merging feature
- [ ] Or focus on Phase 6 (Enhanced Export - PDF, DOCX)

---

## Troubleshooting Guide

### Build Fails with "Cannot find module textNormalization"
**Solution**:
- [ ] Verify file created at: `src/utils/textNormalization.ts`
- [ ] Check import path in `storageService.ts`: `import { normalizeTitle } from '../utils/textNormalization';`
- [ ] File path should be relative from storageService location
- [ ] Run `npm run build` again

### TypeScript Error: "normalizedTitle does not exist"
**Solution**:
- [ ] Verify `src/types.ts` updated with `normalizedTitle?: string;`
- [ ] Check SavedChatSession interface includes new field
- [ ] Rebuild: `npm run build`

### Database Migration Not Running
**Solution**:
- [ ] Clear IndexedDB: DevTools → Application → Storage → IndexedDB → Right-click DB → Delete
- [ ] Reload app
- [ ] Check browser console for: `✅ Created unique index on normalizedTitle`
- [ ] If no message, migration already ran (v3 already exists)

### Constraint Error on Import
**Solution**:
- [ ] This is expected when importing duplicate titles
- [ ] Verify session was saved with original ID (overwrite happened)
- [ ] Check console log: `🔄 Duplicate detected: "..." - attempting overwrite`

### Sessions Not Appearing After Import
**Solution**:
- [ ] Check browser console for errors
- [ ] Verify `getAllSessions()` after import completes
- [ ] Try refreshing page (F5)
- [ ] Check IndexedDB in DevTools for sessions store

### Performance Still Slow
**Solution**:
- [ ] Verify `findSessionByTitle()` was deleted
- [ ] Confirm `saveSession()` is using new index-based logic
- [ ] Check console for O(n) scan pattern in logs
- [ ] Clear browser cache: DevTools → Application → Clear site data

---

## Rollback Instructions (If Needed)

### Immediate Rollback
```bash
# Undo last commit
git revert HEAD

# Or reset to before v0.3.0
git reset --hard HEAD~1

# Clear browser IndexedDB to force re-init
# DevTools → Application → Storage → IndexedDB → Delete
```

### Partial Rollback (Keep Import Feature, Revert DB Changes)
```bash
# Keep import feature, but:
git revert <commit-hash-of-db-changes>
# Restore DB_VERSION to 2
# Restore old saveSession() method
# Delete textNormalization.ts
```

### Data Recovery
If data is lost:
1. Check browser IndexedDB backups
2. Re-import from JSON exports (using import feature)
3. Ask user to provide exported JSON files

---

## Success Checklist (Final)

- [ ] Build succeeds with 0 errors
- [ ] All 20+ test cases pass
- [ ] Unicode normalization verified
- [ ] Race condition fixed (rapid saves only create 1 session)
- [ ] Performance improved (1000+ sessions save in <50ms)
- [ ] Migration completes without data loss
- [ ] Import feature still works
- [ ] All pages load correctly
- [ ] No TypeScript errors
- [ ] Commit message descriptive
- [ ] Version bumped to v0.3.0
- [ ] Documentation updated
- [ ] CHANGELOG.md current
- [ ] Ready for production deployment

---

## Session Completion

**Estimated Duration**: 2-3 hours
**Complexity**: Medium (straightforward from roadmap)
**Risk Level**: Low (backward compatible, includes rollback plan)
**User Impact**: Positive (faster saves, better duplicate detection, security fixes)

After completing this checklist, v0.3.0 is ready for production release.

---

**Checklist Generated**: January 6, 2026
**Implementation Target**: January 7-8, 2026
**Status**: READY FOR EXECUTION
