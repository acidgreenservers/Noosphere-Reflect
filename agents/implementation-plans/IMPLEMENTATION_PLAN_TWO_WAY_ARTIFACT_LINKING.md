# Implementation Plan: Two-Way Artifact Linking System

## Overview
**Feature/Task Name**: Enhanced Dynamic Artifact Linking
**Goal**: Automatic two-way synchronization between session artifacts and message attachments with smart auto-matching and referential integrity.
**Complexity**: 6/10 (State synchronization logic is key)
**Estimated Timeline**: 3-5 days

---

## Problem Statement

**Current Limitations**:
1.  **Disconnected Uploads**: Artifacts uploaded to the session pool are not automatically linked to relevant messages, even if the filename matches.
2.  **Manual Labor**: Users must manually find and attach files to specific messages.
3.  **Orphaned Data**: Deleting an artifact from the session pool does not consistently remove it from message attachments.

**Desired Behavior**:
- **Auto-Matching**: When a file is uploaded, the system should scan chat messages for matching filenames and automatically attach the artifact.
- **Two-Way Sync (Safety-First)**:
    - **Pool Deletion**: Deleting from the global pool REMOVES it from all messages (cleanup).
    - **Message Deletion**: Deleting from a message ONLY removes the link (safety).

---

## Proposed Solution

### 1. New Shared Utility: `src/utils/artifactLinking.ts`

We will create a centralized utility to handle the complex matching and state update logic, ensuring consistency between `BasicConverter` and `ArtifactManager`.

```typescript
// Proposed Interface
export interface AutoMatchResult {
    updatedArtifacts: ConversationArtifact[];
    updatedMessages: ChatMessage[];
    matchCount: number;
    matches: string[]; // e.g. "image.png -> Message #3"
}

export const processArtifactUpload = (
    newArtifacts: ConversationArtifact[],
    currentArtifacts: ConversationArtifact[],
    currentMessages: ChatMessage[]
): AutoMatchResult => {
    // Logic (Optimized O(N)):
    // 1. Build a Map of { "filename": [msgIndex1, msgIndex2] } by scanning valid text in currentMessages ONCE.
    // 2. Iterate newArtifacts:
    //    - Lookup artifact.fileName in the Map.
    //    - If found:
    //      - Add to message.artifacts for each index.
    //      - Set artifact.insertedAfterMessageIndex.
    //      - Add to global artifacts list.
    // 3. Return updated states.
}

export const processGlobalArtifactRemoval = (
    artifactId: string,
    currentArtifacts: ConversationArtifact[],
    currentMessages: ChatMessage[]
): { updatedArtifacts: ConversationArtifact[], updatedMessages: ChatMessage[] } => {
    // Logic:
    // 1. Filter out from currentArtifacts
    // 2. Map over currentMessages and filter out from msg.artifacts
    // 3. Return updated states
}
```

### 2. Integration Points

#### A. `BasicConverter.tsx` (Main Page)
- **Sanitization Fix (COMPLETED)**: Filename sanitization is now enforced in `handleArtifactUpload` and `handleMessageArtifactUpload` using the `securityUtils` pipeline.
- **Upload**: Update `handleArtifactUpload` to use `processArtifactUpload`.
    - **Performance Requirement**: Use a `Map<FileName, MessageIndex[]>` for lookups to maintain $O(M+A)$ complexity (Messages + Artifacts) and prevent UI lockup on large chats.
- **Benefit**: Dragging a file onto the main chat area will now instantly link it to the correct message if mentioned.
- **Deletion**: Update `handleRemoveArtifact` to use `processGlobalArtifactRemoval`.
    - **Benefit**: Ensures no "ghost" attachments remain in messages after a file is deleted from the sidebar.

#### B. `ArtifactManager.tsx` (Modal)
- **Upload**: Refactor `handleFileSelect` to use `processArtifactUpload`.
    - **Benefit**: Consistent behavior with the main page.
- **Deletion**:
    - **Global Tab**: Uses `processGlobalArtifactRemoval`.
    - **Message Tab**: Uses simple local removal (unlink only).

### 3. Deletion Logic Specification

> [!IMPORTANT]
> **Safety-First Deletion Policy**

| Action | Source | Result | Reasoning |
| :--- | :--- | :--- | :--- |
| **Delete Artifact** | **Global Pool** | 🗑️ **Deleted Everywhere** | Implies user wants to remove the file entirely from the session. |
| **Delete Artifact** | **Message Attachment** | 🔗 **Unlinked Only** | Implies user just wants to detach it from this specific context. File remains in Global Pool. |

---

## Verification Plan

### Automated/Manual Validation Steps

1.  **Auto-Matching Test**
    - [ ] Create a chat with text: "Here is the screenshot: error_log.png".
    - [ ] Upload `error_log.png` via the main converter page.
    - [ ] **Expectation**:
        - File appears in "Attached Files".
        - The message text "Here is the screenshot..." shows an attachment indicator.
        - Toast notification confirms "Auto-matched to Message #1".

2.  **Global Deletion Test**
    - [ ] Delete `error_log.png` from the "Saved Sessions" sidebar (or attached files list).
    - [ ] **Expectation**:
        - File removed from sidebar.
        - Attachment indicator REMOVED from the message.

3.  **Message Unlink Test**
    - [ ] Identify a message with `graph.svg` attached.
    - [ ] Click "Remove" on the attachment *within the message bubble*.
    - [ ] **Expectation**:
        - Attachment removed from message.
        - File **REMAINS** in the "Attached Files" sidebar.

4.  **Persistence Test**
    - [ ] Save the session after auto-matching.
    - [ ] Reload the page/session.
    - [ ] **Expectation**: Links preserve correctly across formatting/storage cycles.

---

## Future Considerations
- **Deduplication**: If the user uploads the same file twice, should we detect content hash? (For now: filename + size check).
- **Renaming**: If a user renames an artifact in the pool, should we update the link? (Out of scope for this iteration).