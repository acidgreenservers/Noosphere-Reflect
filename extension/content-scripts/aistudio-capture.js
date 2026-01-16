/**
 * Content script for Google AI Studio (aistudio.google.com)
 * Captures conversations and sends to extension bridge
 * Dependencies loaded by manifest: types.js, markdown-extractor.js, aistudio-parser.js, bridge-storage.js, settings-sync.js
 */

// Listen for capture trigger from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_CHAT' || request.action === 'CAPTURE_CHAT_COPY') {
    const importType = request.action === 'CAPTURE_CHAT_COPY' ? 'copy' : 'merge';
    captureAiStudioChat(importType)
      .then(result => {
        sendResponse({ success: true, title: result.title });
        chrome.runtime.sendMessage({ action: 'CAPTURE_SUCCESS', title: result.title });
      })
      .catch(error => handleError(error, sendResponse));
    return true;
  }

  if (request.action === 'COPY_MARKDOWN') {
    handleCopyAction('markdown', sendResponse);
    return true;
  }

  if (request.action === 'COPY_JSON') {
    handleCopyAction('json', sendResponse);
    return true;
  }
});

function handleError(error, sendResponse) {
  if (sendResponse) sendResponse({ success: false, error: error.message });
  chrome.runtime.sendMessage({ action: 'CAPTURE_ERROR', error: error.message });
  window.ToastManager.show(`Error: ${error.message}`, 'error');
}

async function handleCopyAction(format, sendResponse) {
  try {
    const session = await extractSessionData();
    let content = '';

    if (format === 'markdown') {
      content = serializeAsMarkdown(session.chatData, session.metadata);
    } else {
      content = serializeAsJson(session.chatData);
    }

    await navigator.clipboard.writeText(content);
    window.ToastManager.show(`✅ Copied as ${format.toUpperCase()}!`);
    sendResponse({ success: true });
  } catch (error) {
    handleError(error, sendResponse);
  }
}

/**
 * Expands all collapsed thought blocks to ensure content is captured.
 * Returns a promise that resolves when expansion is complete.
 */
async function expandAllThoughts() {
  const collapsedThoughts = document.querySelectorAll('ms-expandable-turn .container:not(.expanded) .header');

  if (collapsedThoughts.length === 0) return;

  console.log(`Expanding ${collapsedThoughts.length} thought blocks for capture...`);

  // Click all collapsed headers
  collapsedThoughts.forEach(header => header.click());

  // Wait for animations/DOM updates (1 second should be sufficient)
  return new Promise(resolve => setTimeout(resolve, 1000));
}

async function extractSessionData(importType = 'merge') {
  // 1. Expand all thoughts first
  await expandAllThoughts();

  // 2. Extract full HTML
  const htmlContent = document.documentElement.outerHTML;

  // 3. Parse using AI Studio parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const chatData = {
    messages: parseAiStudioHtml(doc)
  };

  // 3. Extract metadata from page
  const title = extractPageTitle() || 'AI Studio Chat';
  const timestamp = new Date().toISOString();

  // 4. Get username from settings (extension storage)
  const userName = await getUsernameFromWebApp();

  // 5. Create session object
  const metadata = new ChatMetadata(
    title,
    'Google AI Studio',
    timestamp,
    ['AI Studio'],
    '',
    window.location.href
  );
  metadata.importType = importType;

  return new SavedChatSession({
    id: generateSessionId(),
    name: title,
    date: timestamp,
    inputContent: htmlContent,
    chatTitle: title,
    userName: userName,
    aiName: 'Google AI Studio',
    selectedTheme: ChatTheme.DarkDefault,
    parserMode: ParserMode.AiStudioHtml,
    chatData: chatData,
    metadata: metadata
  });
}

async function captureAiStudioChat(importType = 'merge') {
  const session = await extractSessionData(importType);
  const title = session.name;

  // 6. Check storage quota
  if (await isStorageQuotaWarning()) {
    window.ToastManager.show('⚠️ Storage nearly full! Consider exporting as JSON.', 'warning');
  }

  // 7. Save to chrome.storage.local bridge
  try {
    const result = await saveToBridge(session);
    window.ToastManager.show(`✅ Chat archived! (${formatBytes(result.size)})`);
    return { success: true, title: title };
  } catch (error) {
    if (error.message.includes('too large')) {
      window.ToastManager.show('Chat too large. Exporting as JSON...', 'info');
      // TODO: Trigger JSON download instead
      throw error;
    }
    throw error;
  }
}

function extractPageTitle() {
  // AI Studio conversation title is usually in: document title or first message
  const docTitle = document.title;
  if (docTitle && docTitle !== 'AI Studio') {
    return docTitle.replace(' - AI Studio', '').trim();
  }

  // Fallback: Use first user message as title
  const userTurns = document.querySelectorAll('.turn-container .turn.input');
  if (userTurns.length > 0) {
    const firstUserTurn = userTurns[0];
    const contentElement = firstUserTurn.querySelector('ms-console-turn ms-cmark-node');
    if (contentElement) {
      const text = contentElement.textContent.trim();
      if (text) {
        return text.substring(0, 50) + (text.length > 50 ? '...' : '');
      }
    }
  }

  return 'AI Studio Chat';
}

function generateSessionId() {
  return 'aistudio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
