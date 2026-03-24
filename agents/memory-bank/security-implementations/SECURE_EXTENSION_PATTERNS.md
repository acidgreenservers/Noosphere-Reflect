# Secure Extension Patterns

**Context**: Chrome Extension (Manifest V3)
**Goal**: Isolate untrusted content, minimize permissions, and prevent hijacking.

## 1. "Sanitize by Conversion" (The Bridge)
The extension reads raw, potentially dangerous DOM from external sites (Claude, ChatGPT).
**Rule**: We never send raw DOM to the background script or web app.
**Pattern**: Extract -> Convert to Markdown (Text) -> Send Text.

```javascript
// content-script.js
const rawDom = document.querySelector('.chat-content');
// ❌ Bad: sending HTML
// send({ content: rawDom.innerHTML });

// ✅ Good: Convert to text representation immediately
const markdown = extractMarkdown(rawDom); 
send({ content: markdown });
```

This ensures that even if the source page had a malicious script injected, it is neutralized into harmless text before it leaves the tab.

## 2. Permission Scoping (Manifest)
Follow the Principle of Least Privilege.

```json
// manifest.json
{
  "permissions": [
    "storage",      // For saving settings
    "contextMenus"  // For right-click
  ],
  "host_permissions": [
    "https://claude.ai/*",
    "https://chatgpt.com/*"
    // Only specific AI domains. NEVER <all_urls>
  ]
}
```

## 3. Message Passing Verification
Verify the source of messages in the bridge.

```javascript
// localhost-bridge.js
window.addEventListener('message', (event) => {
    // 1. Verify Origin
    if (event.origin !== window.location.origin) return;
    
    // 2. Verify Trusted Type
    if (event.data.type !== 'NOOSPHERE_CHECK_BRIDGE') return;
    
    // Proceed...
});
```

## 4. Content Security Policy (CSP)
The extension and the web app must define a strict CSP.

*   **Web App**: `default-src 'self';`
*   **Extension**: Manifest V3 enforces a strict CSP by default (no remote code execution).

## 5. Origin Isolation
The extension runs in a separate "world" from the page JavaScript (Content Script isolation).
*   Do not use `window.eval()` or inject `<script>` tags into the page to read variables.
*   Rely purely on DOM inspection (DOM Parser).
