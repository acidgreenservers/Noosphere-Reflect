# Fix List — Race Condition & State Coherence Audit

## HIGH Severity

### H1. Double-send stomps — no in-flight guard
**File:** `UnifiedChatInterface.tsx:593–642`
**Pattern:** Closure-stale `messages` on rapid double-submit
**Fix:** Add `useRef<boolean>` in-flight guard to `handleSendMessage`. Second click while first is in-flight is silently dropped.

### H2. Optimistic update, no rollback on failure
**File:** `UnifiedChatInterface.tsx:653–703`
**Pattern:** `handleEditMessage` / `handleDeleteMessage` optimistically update React state, then `await saveSession`. If save fails, UI is permanently out of sync with DB. Toast says "success" regardless.
**Fix:** Save pre-mutation state snapshot. Restore on catch.

### H3. Send message no try/catch — silent data loss
**File:** `UnifiedChatInterface.tsx:631–642`
**Pattern:** `handleSendMessage` has no try/catch around `saveSession`. If it throws, input is cleared, `loadSession()` reloads old state — message silently lost.
**Fix:** Wrap in try/catch. Revert optimistic state. Show error toast.

### H4. SessionStore mutates caller's object in place
**File:** `SessionStore.ts:64–149`
**Pattern:** `save(session)` mutates `normalizedTitle`, `exportStatus`, `metadata.exportStatus` on the caller's object. Two concurrent saves sharing the same ref can corrupt each other.
**Fix:** Deep-clone the session object before mutating inside `save()`.

---

## MEDIUM Severity

### M1. Concurrent `setSession` overwrite
**File:** `UnifiedChatInterface.tsx:1025–1038`
**Pattern:** `handleModelChange` builds `updated` from closure-captured `session`, then `setSession(updated)`. If a send is in-flight, the last `setSession` wins — potentially reverting the other operation's changes.
**Fix:** Re-read fresh session from DB before saving, or use a queue.

### M2. `exportCount` read from stale closure
**File:** `UnifiedChatInterface.tsx:942–946`
**Pattern:** `currentCount` read from closure-captured `session`, not from DB. Concurrent export operations can reset the count.
**Fix:** Read `exportCount` from fresh DB state, or use `updateExportStatus` that does the increment server-side (IndexedDB-side).

### M3. Concurrent artifact removal — transaction isolation gap
**File:** `UnifiedChatInterface.tsx:1104–1132` + `storageService.ts`
**Pattern:** Two concurrent `handleRemoveArtifact` calls can each read the session, remove their artifact, and save — the first's removal can be lost if both transactions read before either commits.
**Fix:** Add a sequence number or lock to `storageService.attachArtifact` / `removeArtifact` to prevent concurrent read-write-read.

---

## LOW Severity

### L1. `chatSaved` fires before React state committed
**File:** `UnifiedChatInterface.tsx` (multiple: 634, 854, 947, 1057, 1078, 1101)
**Pattern:** Sidebar reads from DB (correct) but main view shows stale React state until next render. Brief inconsistency window.
**Fix:** No action needed — data is consistent, only render timing differs.

### L2. `isSaving` stuck `true` on throw
**File:** `UnifiedChatInterface.tsx:599, 639`
**Pattern:** No try/finally around `setIsSaving(false)`. If save throws, send button remains disabled.
**Fix:** Wrap in try/finally to ensure `setIsSaving(false)` always runs.

### L3. `FileReader.onload` after unmount
**File:** `UnifiedChatInterface.tsx:1003–1022`
**Pattern:** `FileReader` fires `onload` asynchronously. If component unmounts before that, `setAttachedFiles` runs on unmounted component.
**Fix:** Use `useRef` flag to check mounted state, or abort the reader on unmount.

### L4. Benign `setInputValue` functional updater
**File:** `UnifiedChatInterface.tsx:967`
**Pattern:** Correctly uses functional updater form. No actual bug.
**Fix:** None needed.