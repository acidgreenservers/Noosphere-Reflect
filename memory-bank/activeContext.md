# Active Context

## Current Focus
- **Grok Integration**: Completed implementation of Grok parser, UI integration, and Chrome extension support.
- **Security Audit**: Completed audit of Grok integration, fixing a double-escaping bug in `converterService.ts` and adding explicit sanitization to the extension parser.
- **Export Enhancement**: 
    - Added directory export support to the "Basic Converter" (single file) view using the File System Access API.
    - **Refined ArchiveHub directory export** to create a named subdirectory for each exported chat (e.g., `ExportFolder/ChatTitle/`) instead of dumping files directly into the root.

## Recent Changes
- **`src/services/converterService.ts`**:
    - Implemented `parseGrokHtml` with `decodeHtmlEntities` helper.
    - Added `extractTableMarkdown` helper.
    - Added `generateDirectoryExportWithPicker` to enable directory exports from the basic converter.
- **`src/components/ExportDropdown.tsx`**: Updated to use `generateDirectoryExportWithPicker` for all single-file exports.
- **`src/pages/BasicConverter.tsx`**: Updated to pass full session data to `ExportDropdown`.
- **`src/pages/ArchiveHub.tsx`**: Updated `handleSingleExport` to create a dedicated subdirectory for chat exports when using the directory picker.
- **`extension/parsers/grok-parser.js`**: Hardened with `sanitizeUrl` and `decodeHtmlEntities`.
- **`CURRENT_SECURITY_AUDIT.md`**: Documented findings and fixes for the Grok integration audit.

## Active Decisions
- **Directory Export**: We opted to use the File System Access API for single file exports in the Basic Converter to allow saving artifacts alongside the chat file in a clean directory structure.
- **Export Organization**: Hub exports now enforce a clean folder structure (`Chat Name/`) to prevent cluttering user directories when exporting individual chats.
- **Sanitization**: We chose to decode HTML entities when extracting from `innerHTML` and *not* escape them again before storage, relying on the renderer's `applyInlineFormatting` to handle escaping safely.

## Next Steps
- **Phase 5**: Context Composition (merging multiple chats).
- **IndexedDB v3**: Atomic duplicate detection (refinement).