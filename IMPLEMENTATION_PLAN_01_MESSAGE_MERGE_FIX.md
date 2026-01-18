# Smart Import Merge with Message Deduplication

## Executive Summary

**Goal**: Implement intelligent message deduplication during import merges to prevent duplicate messages when re-importing the same chat.

**User's Vision**:
- User imports via file upload, Google Drive, or extension → Clean import if no conflict
- If title conflict detected → Attempt merge, but only add NEW messages
- If no new messages detected → Skip merge (no changes)
- Keep 'Copy Mode' as manual-only option in converter wizard (novel/edge case)

**Strategy**: Strict exact content matching with enforcement message: "If you edit files after export they may not import correctly. Only edit chats inside the application, not after export."

**Scope**: 5 files to create/modify, 3 critical merge points to update

---

## Current Problem

### Three Import Paths, All Naive Concatenation

**1. Extension Bridge Import** (ArchiveHub.tsx:193)
```typescript
const updatedMessages = [...existingMessages, ...newMessages]; // ❌ No deduplication
```

**2. BasicConverter In-Memory Merge** (BasicConverter.tsx:275)
```typescript
const updatedMessages = [...chatData.messages, ...newChatData.messages]; // ❌ No deduplication
```

**3. BasicConverter Database Merge** (BasicConverter.tsx:401)
```typescript
const updatedMessages = [...baseChatData.messages, ...data.messages]; // ❌ No deduplication
```

**Result**: Importing the same chat twice creates duplicate messages in the merged conversation.

---

## Proposed Solution

### Architecture: Message Deduplication Utility

```
Import Trigger (3 sources)
  ↓
Detect Title Collision
  ↓
Fetch Existing Session
  ↓
Deduplicate Messages (NEW!)
  ├─ Build hash set of existing messages
  ├─ Filter incoming messages to only new ones
  └─ Return: [...existing, ...newUnique]
  ↓
Merge Artifacts (already has ID deduplication ✅)
  ↓
Save Merged Session
```

### Deduplication Algorithm

**Hash Function** (exact content match):
```typescript
function hashMessage(msg: ChatMessage): string {
  // Normalize whitespace for consistent matching
  const normalized = msg.content.trim().replace(/\s+/g, ' ');

  // Hash = type + normalized content
  // Example: "prompt:What is AI?" or "response:AI is artificial intelligence."
  return `${msg.type}:${normalized}`;
}
```

**Deduplication Logic**:
```typescript
function deduplicateMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[]
): { messages: ChatMessage[], skipped: number } {
  // Build hash set of existing messages
  const existingHashes = new Set(
    existing.map(msg => hashMessage(msg))
  );

  // Filter incoming to only NEW messages
  const newMessages = incoming.filter(msg => {
    const hash = hashMessage(msg);
    return !existingHashes.has(hash);
  });

  // Statistics
  const skipped = incoming.length - newMessages.length;

  // Concatenate existing + new unique
  return {
    messages: [...existing, ...newMessages],
    skipped
  };
}
```

---

## Implementation Plan

### Step 1: Create Message Hash Utility

**File**: `src/utils/messageHash.ts` (NEW)

```typescript
import { ChatMessage } from '../types';

/**
 * Generate a stable hash for a chat message
 * Uses: type + normalized content (whitespace-collapsed)
 * Ignores: isEdited flag, artifacts
 */
export function hashMessage(msg: ChatMessage): string {
  const normalized = msg.content.trim().replace(/\s+/g, ' ');
  return `${msg.type}:${normalized}`;
}

/**
 * Check if two messages are duplicates
 */
export function areMessagesDuplicate(msg1: ChatMessage, msg2: ChatMessage): boolean {
  return hashMessage(msg1) === hashMessage(msg2);
}
```

**Why not use crypto.subtle for SHA-256?**
- Simple string concatenation is sufficient for deduplication
- Faster than crypto hashing
- No async operations needed
- Collision risk negligible for chat messages

---

### Step 2: Create Deduplication Function

**File**: `src/utils/messageDedupe.ts` (NEW)

```typescript
import { ChatMessage } from '../types';
import { hashMessage } from './messageHash';

export interface DeduplicationResult {
  messages: ChatMessage[];
  skipped: number;
  hasNewMessages: boolean;
}

/**
 * Deduplicate incoming messages against existing messages
 * Returns only NEW messages that don't already exist
 *
 * @param existing - Messages already in the session
 * @param incoming - Messages from the import source
 * @returns Deduplicated messages + statistics
 */
export function deduplicateMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[]
): DeduplicationResult {
  // Build hash set of existing messages
  const existingHashes = new Set(
    existing.map(msg => hashMessage(msg))
  );

  // Filter incoming to only NEW messages
  const newMessages = incoming.filter(msg => {
    const hash = hashMessage(msg);
    return !existingHashes.has(hash);
  });

  const skipped = incoming.length - newMessages.length;
  const hasNewMessages = newMessages.length > 0;

  console.log(`📊 Deduplication: ${incoming.length} incoming, ${skipped} duplicates, ${newMessages.length} new`);

  return {
    messages: [...existing, ...newMessages],
    skipped,
    hasNewMessages
  };
}
```

---

### Step 3: Update Extension Bridge Merge (ArchiveHub.tsx)

**Location**: Lines 187-229

**Current Code**:
```typescript
// Merge Messages
const existingMessages = existingSession.chatData?.messages || [];
const newMessages = session.chatData?.messages || [];
const updatedMessages = [...existingMessages, ...newMessages]; // ❌
```

**Updated Code**:
```typescript
import { deduplicateMessages } from '../utils/messageDedupe';

// Merge Messages with deduplication
const existingMessages = existingSession.chatData?.messages || [];
const newMessages = session.chatData?.messages || [];
const { messages: updatedMessages, skipped, hasNewMessages } = deduplicateMessages(
  existingMessages,
  newMessages
);

// Skip merge if no new messages
if (!hasNewMessages && skipped > 0) {
  console.log(`⏭️ Skipping merge: All ${skipped} messages already exist in session`);
  return; // Don't save, exit early
}
```

**Add to Merge Stats Console Log** (line 188):
```typescript
console.log(`🔄 Merging content into existing session: ${existingSession.name} (${skipped} duplicates skipped)`);
```

---

### Step 4: Update BasicConverter In-Memory Merge

**Location**: `src/pages/BasicConverter.tsx` lines 261-299

**Current Code** (mergeChatData helper, line 275):
```typescript
const updatedMessages = [...chatData.messages, ...newChatData.messages]; // ❌
```

**Updated Code**:
```typescript
import { deduplicateMessages } from '../utils/messageDedupe';

const { messages: updatedMessages, skipped, hasNewMessages } = deduplicateMessages(
  chatData.messages,
  newChatData.messages
);

// Skip merge if no new messages
if (!hasNewMessages && skipped > 0) {
  console.log(`⏭️ Skipping merge: All ${skipped} messages already exist`);
  return chatData; // Return original, no changes
}

console.log(`✅ Merged ${newChatData.messages.length - skipped} new messages (${skipped} duplicates skipped)`);
```

---

### Step 5: Update BasicConverter Database Merge

**Location**: `src/pages/BasicConverter.tsx` lines 369-450

**Current Code** (line 401):
```typescript
const updatedMessages = [...baseChatData.messages, ...data.messages]; // ❌
```

**Updated Code**:
```typescript
import { deduplicateMessages } from '../utils/messageDedupe';

const { messages: updatedMessages, skipped, hasNewMessages } = deduplicateMessages(
  baseChatData.messages,
  data.messages
);

// Skip merge if no new messages
if (!hasNewMessages && skipped > 0) {
  console.log(`⏭️ Skipping merge: All ${skipped} messages already exist in "${existingSession.name}"`);

  // Show user notification (optional - can add toast notification here)
  alert(`No new messages to merge. All ${skipped} messages already exist in this chat.`);

  return; // Don't proceed with merge
}

console.log(`✅ Merging into "${existingSession.name}": ${data.messages.length - skipped} new messages, ${skipped} duplicates skipped`);
```

---

### Step 6: Add User Guidance (Optional but Recommended)

**Location**: Multiple import UIs

**Add Warning Message** (when user is about to import):

**BasicConverter.tsx** (in file upload UI or paste area):
```tsx
<p className="text-xs text-yellow-500 italic mt-2">
  ⚠️ Only edit chats inside the application. Files edited after export may not import correctly.
</p>
```

**GoogleDriveImportModal.tsx** (in modal description):
```tsx
<p className="text-xs text-gray-500 mt-2">
  Note: Duplicate messages are automatically skipped during merge. Only edit chats in the app, not after export.
</p>
```

---

## Files to Create/Modify

### New Files
1. **src/utils/messageHash.ts** (NEW)
   - `hashMessage(msg)` - Generate stable content hash
   - `areMessagesDuplicate(msg1, msg2)` - Check if duplicates

2. **src/utils/messageDedupe.ts** (NEW)
   - `deduplicateMessages(existing, incoming)` - Main deduplication logic
   - Returns: `{ messages, skipped, hasNewMessages }`

### Modified Files
3. **src/pages/ArchiveHub.tsx**
   - Line 1: Add import for `deduplicateMessages`
   - Lines 187-194: Replace naive concatenation with deduplication
   - Add early return if no new messages

4. **src/pages/BasicConverter.tsx**
   - Line 1: Add import for `deduplicateMessages`
   - Line 275: Update in-memory merge with deduplication
   - Line 401: Update database merge with deduplication
   - Add early returns and user notifications for skipped merges

5. **src/components/GoogleDriveImportModal.tsx** (Optional)
   - Add user guidance message about editing exports

---

## Edge Cases & Handling

### 1. Empty Messages
```typescript
// Example: User sends empty prompt
{ type: 'prompt', content: '' }

// Hash: "prompt:"
// Treated as unique message (valid use case)
```

### 2. Whitespace Variations
```typescript
// Message 1: "What is AI?"
// Message 2: "What  is   AI?" (extra spaces)

// After normalization: Both → "What is AI?"
// Hash: "prompt:What is AI?"
// Result: Correctly identified as duplicate ✅
```

### 3. Different `isEdited` Flags
```typescript
// Message 1: { type: 'prompt', content: 'Hello', isEdited: false }
// Message 2: { type: 'prompt', content: 'Hello', isEdited: true }

// Hash ignores isEdited flag
// Result: Treated as duplicate ✅
// Keeps first occurrence (preserves original edit state)
```

### 4. Messages with Different Artifacts
```typescript
// Message 1: { type: 'response', content: 'Here is a file', artifacts: [file1] }
// Message 2: { type: 'response', content: 'Here is a file', artifacts: [file2] }

// Hash ignores artifacts
// Result: Treated as duplicate ✅
// Artifact deduplication handles artifact conflicts separately (already implemented)
```

### 5. All Messages Are Duplicates
```typescript
// User re-imports exact same export
// skipped = 10, hasNewMessages = false

// Action: Early return, no merge performed
// Console: "⏭️ Skipping merge: All 10 messages already exist"
```

### 6. Partial Duplicates
```typescript
// 10 incoming messages: 5 duplicates, 5 new
// skipped = 5, hasNewMessages = true

// Action: Merge proceeds with only 5 new messages
// Console: "✅ Merged 5 new messages (5 duplicates skipped)"
```

---

## Testing Checklist

### Deduplication Tests
- [ ] Import same export twice → 2nd import skips all messages
- [ ] Import export with extra messages → Only new messages added
- [ ] Import export with whitespace variations → Correctly detected as duplicates
- [ ] Import empty chat → No errors, empty merge
- [ ] Import chat with edited messages → Dedupe ignores `isEdited` flag

### User Flow Tests
- [ ] File upload import → Deduplication works
- [ ] Google Drive import → Deduplication works
- [ ] Extension capture → Deduplication works
- [ ] BasicConverter paste → Deduplication works
- [ ] Batch import (multiple files) → Each file deduplicated correctly

### Edge Case Tests
- [ ] All duplicates → Merge skipped with clear message
- [ ] Partial duplicates → Only new messages merged
- [ ] Messages with artifacts → Hash ignores artifacts
- [ ] Empty messages → Handled correctly
- [ ] Very long messages → Hash generation doesn't fail

---

## Success Criteria

✅ All three import paths use deduplication
✅ Exact content matching (strict enforcement)
✅ Skip merge if no new messages detected
✅ Console logs show deduplication statistics
✅ No TypeScript errors or build failures
✅ User guidance added to prevent manual edits
✅ Copy Mode remains manual-only in converter wizard
✅ Backward compatible (old imports still work)

---

## Implementation Notes

**Why not add `contentHash` field to ChatMessage type?**
- Not necessary for this implementation
- Hashing on-the-fly is fast enough
- Avoids schema migration complexity
- Keep it simple (YAGNI principle)

**Why simple string concatenation instead of crypto hash?**
- Sufficient for deduplication purposes
- No collision risk with chat message content
- Faster than SHA-256 (no async, no buffer conversion)
- Easier to debug (readable hash values)

**Why ignore `isEdited` flag in deduplication?**
- Content is what matters for duplicates
- Edit flag is metadata, not message identity
- Prevents false negatives (same message, different edit state)
- User can manually re-edit after merge if needed

**Why skip merge instead of showing error?**
- Better UX: Silent skip vs. error dialog
- Console log provides visibility for debugging
- No data loss (original session unchanged)
- User can still force copy if they want duplicate
