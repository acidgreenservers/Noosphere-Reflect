Phase 4: Chrome Extension Bridge
Create a dedicated Chrome Extension to bridge the gap between AI chat interfaces (Claude, ChatGPT) and the ArchiveHub. This enables one-click archiving without manual copy-pasting.

[Goal Description]
Establish a direct communication pipeline between the browser's active tab (displaying the AI chat) and the Archive Hub application.

User Review Required
Architecture Choice: chrome.storage.local vs. postMessage vs. URL params.
Recommendation: chrome.storage.local shared between the Content Script and the Extension Popup/Options Page (where ArchiveHub will eventually reside or connect to).
Alternative: Content Script -> chrome.runtime.sendMessage -> Background Script -> Open ArchiveHub Tab with data payload (if size permits) or save to IndexedDB.
Proposed Architecture
1. The "Bridge" Extension
A lightweight Chrome Extension with three main components:

Manifest V3: Secure, modern extension manifest.
Content Scripts:
claude-bridge.js: Injects "Archive" buttons into Claude's UI.
chatgpt-bridge.js: Injects "Archive" buttons into ChatGPT's UI.
Background Service Worker: Handles the actual data transfer and tab opening.
2. Communication Protocol
Trigger: User clicks "Archive This Chat" (injected button) on claude.ai.
Scrape: Content script uses our converterService logic (ported to the extension) to scrape the DOM.
Payload: Constructs a 
ChatData
 object.
Transfer:
Content Script sends message ARCHIVE_CHAT to Background Script.
Background Script saves payload to chrome.storage.local (staging area).
Background Script opens archive-hub.html (the hosted or local version of our app).
Ingest:
Archive Hub (on load) checks for "incoming" data from the extension (if running as a page within the extension) OR listens for a window message if opened as a popup.
Better approach for decoupled app: The Extension is the wrapper. The Archive Hub React App is built into the extension's options.html or a dedicated tab.
Implementation Steps
Step 1: Extension Scaffold
Initialize manifest.json (V3).
Set up build process (Vite can build extensions too, or just copy scripts).
Step 2: Port Parsing Logic
Extract 
parseClaudeHtml
 and 
parseChatWithAI
 from 
converterService.ts
 into a shared library or standalone script usable by the content script.
Ensure no React dependencies are in the pure parsing logic.
Step 3: Inject UI
Write claude-bridge.js to observe DOM changes (MutationObserver).
Inject a subtle "Archive" icon button next to the chat header or message row.
Step 4: Data Hand-off
Implement the chrome.runtime messaging flow.
Update 
ArchiveHub
 to accept an "incoming mode" where it reads from the extension storage (if feasible) or a postMessage event.
Verification Plan
Manual Verification
Load Unpacked: Load the extension in Chrome Developer Mode.
Visit Claude: Go to a claude.ai chat.
Test Injection: Verify the "Archive" button appears.
Test Transfer: Click "Archive". Verify ArchiveHub opens and the chat appears in the "Import" or "Saved" list.