# Implementation & Architecture Protocol

**Protocol ID:** OP-IMP-001
**Version:** 1.0.0
**Last Updated:** January 10, 2026

## 1. Scope & Purpose
This protocol documents the mandatory implementation details, architectural patterns, and "field-tested" solutions for the Noosphere Reflect codebase. It serves as the authoritative guide for all developers (Human and AI) to ensure consistency, security, and stability across the Web App and Chrome Extension.

## 2. Security Mandates

### 2.1. Data Import Hygiene ("The Import Trap")
When implementing data ingestion features (e.g., "Import Database"):
1.  **Strict Schema Validation**: **NEVER** dump `JSON.parse` results directly into IndexedDB. Use a validator (e.g., Zod) to verify every field.
2.  **Chunked Processing**: Do not load files >50MB into memory at once. Implement streaming or chunked processing.
3.  **Re-Sanitization**: Treat imported HTML content as "untrusted" even if it comes from a "database backup". Re-run the sanitization pipeline to prevent dormant XSS payloads.

### 2.2. The "Double-Escape" Prevention
1.  **Context**: Browsers return HTML entities (e.g., `&lt;`) when accessing `innerHTML`.
2.  **Rule**: **NEVER** call `escapeHtml()` immediately on extracted content.
3.  **Pattern**:
    ```javascript
    const raw = element.innerHTML;
    const decoded = decodeHtmlEntities(raw); // First
    const escaped = escapeHtml(decoded);     // Second
    ```

## 3. Chrome Extension Architecture

### 3.1. UI Injection Anchors
Positioning the "Export" button requires platform-specific strategies. Use these approved "Anchors":

#### Type A: The "Top Anchor" (Complex layouts like Google AI Studio)
*   **Target**: Header or Banner elements.
*   **Positioning**: Absolute, Top Left (Relative to parent).
*   **CSS Spec**:
    ```javascript
    {
      position: 'absolute',
      top: '14px',
      left: '150px', // Offset from logo
      bottom: 'auto',
      right: 'auto'
    }
    ```

#### Type B: The "Bottom Anchor" (Standard Chat UIs)
*   **Target**: `body` (Fixed positioning).
*   **Positioning**: Fixed, Bottom Right.
*   **CSS Spec**:
    ```javascript
    {
      position: 'fixed !important',
      bottom: '{PLATFORM_SPECIFIC_PX} !important',
      right: '{PLATFORM_SPECIFIC_PX} !important',
      zIndex: '999999 !important'
    }
    ```
*   **Approved Offsets**:
    *   **Claude**: `bottom: 65px`, `right: 330px`
    *   **Gemini**: `bottom: 85px`, `right: 195px`
    *   **ChatGPT**: `bottom: 46px`, `right: 210px`
    *   **Grok**: `bottom: 44px`, `right: 200px`
    *   **LeChat**: `bottom: 85px`, `right: 210px`

### 3.2. Injector Lifecycle
1.  **SPA Navigation**: Must hook `history.pushState`, `history.replaceState`, and `window.onpopstate`.
2.  **Watchdog**: A 2-second interval timer is mandatory to recover from Host App re-renders that wipe the DOM.

## 4. DOM Parsing & Extraction

### 4.1. The "Thought Bleed" (Gemini/Reasoning Models)
*   **Problem**: Internal chain-of-thought leaking into the user response.
*   **Protocol**:
    1.  **Identify**: Locate `.model-thoughts`, `.thoughts-container`, or `[data-test-id="thoughts-content"]`.
    2.  **Destructive Read**: Extract thought content -> Wrap in `<thought>` tags -> **REMOVE** the element from DOM (`el.remove()`) -> Parse remaining content.
    3.  **Isolation**: Never trust `innerText` of the parent container; it often concatenates thoughts and answers.

### 4.2. DOM State Synchronization
*   **Problem**: `node.cloneNode(true)` does not copy dynamic property states like `checkbox.checked`.
*   **Protocol**:
    ```javascript
    // Force attribute sync on change
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) checkbox.setAttribute('checked', 'checked');
      else checkbox.removeAttribute('checked');
    });
    ```

## 5. Storage (IndexedDB)

### 5.1. Schema Management
*   **Versioning**: All changes to the DB structure must increment `DB_VERSION`.
*   **Backfilling**: `onupgradeneeded` **MUST** iterate existing records to backfill new fields (e.g., `normalizedTitle`, `artifacts`). Do not make fields optional just to avoid backfilling.

### 5.2. Constraint Handling
*   **Unique Constraints**: `normalizedTitle` must be unique.
*   **Conflict Resolution**: On `ConstraintError`, the **OLD** session must be renamed (appended timestamp) to preserve history, allowing the **NEW** session to take the canonical name.

## 6. UI Component Standards

### 6.1. Z-Index Layering
*   **Extension UI**: `z-[999999]` (Nuclear)
*   **Modals**: `z-50`
*   **Backdrops**: `z-40`
*   **Standard Content**: `z-0` to `z-10`

### 6.2. Interaction States
*   **Async Operations**: Buttons must enter a disabled `loading` state immediately.
*   **Feedback**: Use `ToastManager` for success/failure feedback (do not rely on `console.log`).

## 7. Release Artifacts
1.  **Manifest**: `version` in `manifest.json` must match `package.json`.
2.  **Key**: `extension.pem` must be preserved (not committed) to maintain the Extension ID.
3.  **Verification**: Drag-and-drop `.crx` into `chrome://extensions` is the mandatory final test.
