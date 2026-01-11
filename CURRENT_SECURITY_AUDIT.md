# Security Audit Walkthrough: Extension Hardening & Backup

## Summary
**Overall Security Posture**: ✅ **SAFE**

The v0.5.3 release introduces a critical Data Sovereignty feature (Full Database Export) and hardens the Chrome Extension's UI injection and capture logic. The changes are local-first, utilize standard browser APIs, and include appropriate fallbacks.

## Audit Findings

### 1. Full Database Export (Backup)
*Files: `src/services/storageService.ts`, `src/components/SettingsModal.tsx`*

#### Vulnerability Check: Data Leakage
- **Analysis**: The `exportDatabase` function aggregates all local IndexedDB stores (`sessions`, `settings`, `memories`) into a single JSON object. This is triggered only by user action in the Settings modal.
- **Safety**: The data never leaves the client. It is blobbed and downloaded directly to the user's file system.
- **Status**: ✅ **Safe**

#### Vulnerability Check: Schema Integrity
- **Analysis**: The export includes `version: 5` and `exportedAt` metadata, ensuring future import logic can handle schema migrations if necessary.
- **Status**: ✅ **Safe**

### 2. Extension UI Hardening
*Files: `extension/content-scripts/ui-injector.js`*

#### Vulnerability Check: DOM Injection (XSS)
- **Analysis**: `innerHTML` is used in `updateButtonState` (Line 501, 530, 661).
- **Context**: The injected content is static text ("⏳ Processing...", "✕ Close", "📋 Export") combined with a directional arrow. The arrow direction is derived from `platform.menuDirection` or `UI_OVERRIDES`, which are hardcoded configurations within the extension bundle.
- **Status**: ✅ **Safe**

#### Vulnerability Check: Checkbox State Synchronization
- **Analysis**: The injector now explicitly calls `setAttribute('checked', 'checked')` when a checkbox is toggled.
- **Reasoning**: This is required because `cloneNode(true)` (used in parsers) does not preserve the dynamic `.checked` property state, only the HTML attribute. This ensures the "Export Selected" feature works correctly when parsing the DOM snapshot.
- **Status**: ✅ **Safe** (Logic fix, not a security flaw)

### 3. Markdown Extraction Logic
*Files: `extension/parsers/shared/markdown-extractor.js`*

#### Vulnerability Check: Content Omission
- **Analysis**: The `extractMarkdownFromHtml` function now checks for `.nr-checkbox` within a `.nr-message-container`.
- **Fallback**: If the checkbox does not exist (e.g., UI injector failed), the logic defaults to extracting the content. This "fail-open" approach ensures that if the UI is broken, the user can still capture the chat, rather than getting an empty file.
- **Status**: ✅ **Safe**

## Verification

### Build Verification
- **Build Status**: Pending (User to verify).
- **Manual Verification Needed**:
    1.  **Export Database**: Click the button, inspect the JSON. Ensure `memories` are included.
    2.  **Extension**:
        -   Open a chat (e.g., Claude).
        -   Uncheck one message.
        -   Click "Export".
        -   Verify the unchecked message is MISSING from the output.
        -   Verify the formatting of the remaining messages is intact.

## Security Notes
- **Future Consideration**: When implementing "Import Database", strict schema validation will be required to prevent malicious JSON files from corrupting the IndexedDB (e.g., prototype pollution or massive payloads).
