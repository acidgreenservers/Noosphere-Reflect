# Implementation Plan: Claude Artifact & Attachment Capture

## Overview
**Feature/Task Name**: Automated Capture of Claude Artifacts and Attachments
**Complexity**: 8/10 (Requires binary data handling, async fetching within content script context, and storage optimization)
**Estimated Changes**: 3 files, ~150 lines of code

---

## Problem Statement

Currently, the extension captures the *text representation* of artifacts (e.g., "📦 **Artifact: Analysis.csv**") but fails to capture the actual file content.
- **Pain Point**: Users lose the actual data/images associated with their chats when archiving. The text placeholder is insufficient for data preservation.
- **Goal**: When a user clicks "Capture" in the extension, the system should identify, download (fetch), and store the actual binary content of images and file attachments alongside the text chat.

---

## Proposed Solution

### Strategy
Enhance the `claude-capture.js` and `claude-parser.js` to perform a "Deep Capture":
1.  **Detection**: During the DOM traversal in `parseClaudeHtml`, identify elements representing downloadable files or images.
2.  **Extraction**: Extract the source URL (often a signed AWS/GCP URL or internal blob/API link).
3.  **Fetching**: In `claude-capture.js`, asynchronously fetch these resources as Blobs and convert them to Base64 strings.
4.  **Storage**: Populate the `artifacts` array in `ChatMetadata` (defined in `src/types.ts`) with this data.

### Key Design Decisions
1.  **Storage Mechanism**: Base64 String in IndexedDB.
    - **Rationale**: Keeps the architecture simple (single JSON object) and portable (easy export/import). `SavedChatSession` already supports this via the defined `ConversationArtifact` interface.
    - **Trade-off**: Increases storage size significantly. We will enforce a size limit (e.g., 5MB per file) to prevent hitting browser quotas too quickly.

2.  **Async Processing**: Two-pass approach.
    - **Pass 1 (Sync)**: Parse DOM to get text and *locations/URLs* of artifacts.
    - **Pass 2 (Async)**: Iterate through identified artifacts and fetch their content.
    - **Rationale**: `DOMParser` is synchronous. Fetching is asynchronous. Separating them prevents complex async logic inside the parser loop.

---

## Proposed Changes

### File 1: `extension/parsers/claude-parser.js`

#### Change 1: Update `parseClaudeHtml` to return artifacts
**Location**: `parseClaudeHtml` function
**Proposed Change**:
Modify the function signature or return type to include `artifacts`.
Scan for specific attachment selectors (images, file cards) during message processing.

```javascript
// Pseudo-code
function parseClaudeHtml(input) {
  // ... existing setup ...
  const artifacts = [];
  
  allElements.forEach(el => {
    // ... existing message detection ...
    
    // DETECT ATTACHMENTS (New Logic)
    // 1. Images
    el.querySelectorAll('img:not([aria-hidden="true"])').forEach(img => {
       artifacts.push({
         type: 'image',
         url: img.src,
         messageIndex: messages.length - 1, // Link to current message
         fileName: 'image.png' // derived from src or random
       });
    });
    
    // 2. File Cards (Downloadable files)
    el.querySelectorAll('[data-test-id="file-attachment"]').forEach(fileCard => {
       // extract url and name
       artifacts.push({ type: 'file', ... });
    });
  });
  
  return { chatData: new ChatData(messages), detectedArtifacts: artifacts };
}
```

---

### File 2: `extension/content-scripts/claude-capture.js`

#### Change 1: Implement `processArtifacts` and integrate into `extractSessionData`
**Location**: New function & `extractSessionData`
**Proposed Change**:
Add logic to fetch the URLs extracted by the parser.

```javascript
async function extractSessionData() {
  const htmlContent = document.documentElement.outerHTML;
  
  // 1. Parse DOM to get text and artifact placeholders
  const { chatData, detectedArtifacts } = parseClaudeHtml(htmlContent);
  
  // 2. Fetch binary data for artifacts
  const processedArtifacts = await processArtifacts(detectedArtifacts);
  
  // 3. Attach to metadata
  const metadata = new ChatMetadata(...);
  metadata.artifacts = processedArtifacts;
  
  return new SavedChatSession({
    // ...
    metadata: metadata
  });
}

async function processArtifacts(candidates) {
  window.ToastManager.show(`Downloading ${candidates.length} attachments...`, 'info');
  
  const results = [];
  for (const item of candidates) {
    try {
      // Fetch blob
      const response = await fetch(item.url);
      const blob = await response.blob();
      
      // Check size limit (e.g. 5MB)
      if (blob.size > 5 * 1024 * 1024) continue;
      
      // Convert to Base64
      const base64 = await blobToBase64(blob);
      
      results.push({
        id: crypto.randomUUID(),
        fileName: item.fileName,
        fileSize: blob.size,
        mimeType: blob.type,
        fileData: base64,
        insertedAfterMessageIndex: item.messageIndex
      });
    } catch (e) {
      console.warn('Failed to capture artifact', e);
    }
  }
  return results;
}
```

---

### File 3: `extension/lib/markdown-extractor.js` (Optional)

#### Change 1: Refine Artifact Markdown
**Location**: `extractMarkdownFromHtml`
**Rationale**: Ensure the markdown extraction doesn't produce weird duplicate text for the elements we are capturing as binary.

---

## Verification Plan

### Manual Testing Steps
1.  **Test Case**: Capture Image Attachment
    - **Setup**: Open a Claude chat with an uploaded image.
    - **Action**: Click extension "Capture".
    - **Expected Result**: Success toast. Open ArchiveHub -> Chat -> Verify "Attached Files" section shows the image thumbnail/link.
2.  **Test Case**: Capture PDF Attachment
    - **Setup**: Open a Claude chat where Claude generated or analyzed a PDF/CSV.
    - **Action**: Click extension "Capture".
    - **Expected Result**: Verify the file is listed in ArchiveHub and can be downloaded/opened.
3.  **Test Case**: Size Limit
    - **Setup**: Upload a large (>10MB) file to Claude.
    - **Action**: Capture.
    - **Expected Result**: File is skipped (or warning logged), capture succeeds for text.

---

## Rollback Plan

**If implementation fails**:
1.  Revert changes to `claude-capture.js` and `claude-parser.js`.
2.  The `ChatData` structure changes are additive (optional `artifacts` field), so no database migration rollback is needed.

---

## Implementation Notes

### Potential Risks
1.  **Risk**: CORS / Auth on Fetch
    - **Mitigation**: Content scripts usually share the cookie jar. If Claude uses signed URLs with strict CORS, `fetch` might fail. We will wrap in try/catch and fallback to just capturing the link text.
2.  **Risk**: Storage Quota
    - **Mitigation**: Base64 inflates size by 33%. We must implement strict per-file limits (5MB) and possibly a total session limit warning.

### Security Considerations
- **Sanitization**: We are storing binary data. When rendering in `ArchiveHub`, we must ensure proper MIME types are set and potentially force download (`Content-Disposition`) for non-image types to prevent Executable/HTML execution.
- **Input Validation**: `validateFileSize` should be applied to these blobs too.

---

## Timeline
**Estimated Duration**: 3 Hours

**Phases**:
1.  **Phase 1**: DOM Inspection & Parser Update (Identify selectors) - 1h
2.  **Phase 2**: Async Fetching Logic (Content Script) - 1h
3.  **Phase 3**: Verification & UI Check - 1h


# USER COMMENTS
Maybe we should just try to auto link uploaded artifacts to the matched links in the chat?

User exports chat to hub > downloads all attachments from service manually
uploads all artifacts to the chat > generator intelligently matches the maes of the uploads to the text names in the chat, and automatically links them, the same way they get links currently when the user attaches them to a message.