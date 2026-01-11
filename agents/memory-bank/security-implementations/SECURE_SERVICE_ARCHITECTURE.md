# Secure Service Architecture

**Context**: `converterService.ts`, `storageService.ts`
**Goal**: Logic isolation, input validation, and "Escape First" processing.

## 1. The "Escape First" Strategy (HTML Generation)
This is the **Golden Rule** of Noosphere Reflect's security.
When converting Markdown to HTML, we **must** escape HTML entities *before* applying any formatting.

```typescript
// src/services/converterService.ts

const applyInlineFormatting = (text: string): string => {
  // 1. ESCAPE FIRST. This neutralizes <script> -> &lt;script&gt;
  let escaped = escapeHtml(text); 
  
  // 2. Apply Formatting to the SAFE string
  // Note: We use regex to wrap safe content in tags
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  return escaped;
};
```

## 2. Input Validation Gates
Services should not assume inputs are valid, even if the UI validated them. Re-validate at the service boundary.

```typescript
// Example: Saving a Memory
async saveMemory(memory: Memory): Promise<void> {
    // Service-level validation
    if (!memory.content || memory.content.length > MAX_MEMORY_SIZE) {
        throw new Error('Memory content too large');
    }
    // Proceed to storage...
}
```

## 3. Filename Sanitization
When generating files for export (HTML, JSON, ZIP), never use user-provided titles directly as filenames.

```typescript
import { sanitizeFilename } from '../utils/securityUtils';

// ❌ Bad
const filename = `${session.title}.html`; // "hack/../../config" -> Path Traversal

// ✅ Good
const safeTitle = sanitizeFilename(session.title);
const filename = `${safeTitle}.html`;
```

## 4. URL Sanitization
Any user-provided URL (e.g., in `[link](url)` or `metadata.sourceUrl`) must be checked against the allow-list.

```typescript
import { sanitizeUrl } from '../utils/securityUtils';

const safeUrl = sanitizeUrl(rawUrl);
if (safeUrl) {
    html += `<a href="${safeUrl}">...</a>`;
} else {
    // If unsafe (javascript:...), render as plain text or skip
    html += `<span>[Unsafe Link]</span>`;
}
```

## 5. Separation of Concerns
*   **`storageService`**: Only handles IndexedDB. No HTML generation.
*   **`converterService`**: Only handles Parsing/Generation. No Storage side effects.
*   **`securityUtils`**: Pure functions. No side effects.

This makes auditing specific behaviors (like "where do we parse HTML?") strictly scoped to one file.
