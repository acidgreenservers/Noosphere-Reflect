/**
 * Content script for Llamacoder
 * Captures conversations and sends to extension bridge
 * Dependencies loaded by manifest: types.js, markdown-extractor.js, llamacoder-parser.js, bridge-storage.js
 */

// Listen for capture trigger from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_CHAT' || request.action === 'CAPTURE_CHAT_COPY') {
    const importType = request.action === 'CAPTURE_CHAT_COPY' ? 'copy' : 'merge';
    captureLlamacoderChat(importType)
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

async function extractSessionData(importType = 'merge') {
  const htmlContent = document.documentElement.outerHTML;
  const chatData = parseLlamacoderHtml(htmlContent);
  const title = extractPageTitle() || 'Llamacoder Conversation';
  const timestamp = new Date().toISOString();
  const userName = await getUsernameFromWebApp();

  const metadata = new ChatMetadata(title, 'Llamacoder', timestamp, [], '', window.location.href);
  metadata.importType = importType;

  return new SavedChatSession({
    id: generateSessionId(),
    name: title,
    date: timestamp,
    inputContent: htmlContent,
    chatTitle: title,
    userName: userName,
    aiName: 'Assistant',
    selectedTheme: ChatTheme.DarkDefault,
    parserMode: ParserMode.LlamacoderHtml,
    chatData: chatData,
    metadata: metadata
  });
}

async function captureLlamacoderChat(importType = 'merge') {
  const session = await extractSessionData(importType);
  const title = session.name;

  if (await isStorageQuotaWarning()) {
    window.ToastManager.show('⚠️ Storage nearly full! Consider exporting as JSON.', 'warning');
  }

  try {
    const result = await saveToBridge(session);
    window.ToastManager.show(`✅ Chat archived! (${formatBytes(result.size)})`);
    return { success: true, title: title };
  } catch (error) {
    if (error.message.includes('too large')) {
      window.ToastManager.show('Chat too large. Exporting as JSON...', 'info');
      throw error;
    }
    throw error;
  }
}

function extractPageTitle() {
  // Llamacoder titles are typically entered manually by the user
  // Instead of trying to extract from DOM, we return a default
  // Users can edit the title in ArchiveHub after import if needed
  return null;
}


function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

console.log('Llamacoder content script loaded');
