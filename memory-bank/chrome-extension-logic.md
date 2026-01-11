# Chrome Extension Architecture & Logic

## 1. Core Extraction Logic (Platform Agnostic)
The extraction logic is built on a "Parser" pattern. Each platform (Claude, Gemini, etc.) has a dedicated parser that normalizes the DOM into a standard format.

### Standardized Turn Structure
```javascript
{
    role: "user" | "model",
    content: "Raw HTML or Markdown content",
    thinking: "Hidden thought process (if available)",
    timestamp: "ISO String",
    artifacts: [] // Code snippets, images, files
}
```

## 2. UI Injector Architecture (`ui-injector.js`)
Instead of a simple "copy" button, the extension injects a robust control panel into the target AI platform's interface.

### Injection Strategy
- **Detection**: Identifies platform via `window.location.hostname`.
- **Positioning**: Uses fixed positioning with high z-index (`999999`) to float above native UIs.
- **Isolation**: Uses platform-specific CSS overrides (`UI_OVERRIDES`) to prevent style conflicts.

### Platform-Specific Overrides
| Platform | Position | Selector Strategy |
|----------|----------|-------------------|
| **Gemini** | Bottom-Right | `rich-textarea` |
| **Claude** | Bottom-Right | `[data-testid="chat-input"]` |
| **ChatGPT** | Bottom-Right | `#prompt-textarea` |
| **AI Studio** | Top-Left | `header` (Absolute) |
| **Grok** | Bottom-Right | `textarea` |
| **LeChat** | Bottom-Right | `textarea` |

### Features
1.  **Selection Buttons**: `All`, `User Only`, `AI Only`, `None`.
    - Injects hidden checkboxes (`.nr-checkbox`) into message containers for granular control.
2.  **Export Menu**: Upward/Downward rolling menu based on screen position.
    - **Import to App**: Sends data to the main Noosphere Reflect app.
    - **Copy as JSON**: Copies standardized JSON to clipboard.
    - **Copy as Markdown**: Copies formatted markdown to clipboard.
3.  **Auto-Expand**: Automatically clicks "Expand Thinking" buttons (e.g., on Gemini) before capture.

## 3. The Bridge (Localhost Communication)
To communicate with the Web App running on `localhost`:

1.  **Content Script**: Listens for `window.postMessage` events.
2.  **Background Script**: Manages the "Bridge Storage" (IndexedDB or `chrome.storage.local`).
3.  **Web App**: Polls for the bridge data or listens for injected events.

## 4. Security & Permissions
- **Manifest V3**: Strict permission scoping.
- **Host Permissions**: Explicitly listed for supported domains only.
- **Scripting API**: Used to inject CSS/JS only when necessary.