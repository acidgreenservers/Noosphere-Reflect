/**
 * Content script for LeChat (chat.mistral.ai)
 * Captures conversations and sends to extension bridge
 * Dependencies loaded by manifest: types.js, markdown-extractor.js, lechat-parser.js, bridge-storage.js
 */

// Listen for capture trigger from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_CHAT' || request.action === 'CAPTURE_CHAT_COPY') {
    const importType = request.action === 'CAPTURE_CHAT_COPY' ? 'copy' : 'merge';
    captureLeChatChat(importType)
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
  const chatData = parseLeChatHtml(htmlContent);
  const title = extractPageTitle() || 'LeChat Conversation';
  const timestamp = new Date().toISOString();
  const userName = await getUsernameFromWebApp();

  const metadata = new ChatMetadata(title, 'Mistral LeChat', timestamp, [], '', window.location.href);
  metadata.importType = importType;

  return new SavedChatSession({
    id: generateSessionId(),
    name: title,
    date: timestamp,
    inputContent: htmlContent,
    chatTitle: title,
    userName: userName,
    aiName: 'Mistral',
    selectedTheme: ChatTheme.DarkDefault,
    parserMode: ParserMode.LeChatHtml,
    chatData: chatData,
    metadata: metadata
  });
}

async function captureLeChatChat(importType = 'merge') {
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
  // LeChat uses specific block layout classes for title
  // DOM structure: <div class="block min-h-5.5 w-full flex-1 ... font-[450]">Title</div>
  const selectors = [
    'div.block.min-h-5\\.5',        // Primary: block with min-height-5.5
    'div.font-\\[450\\]',            // Secondary: custom font-weight class
    'h1',                           // Fallback
    'div[aria-label*="Conversation"]' // Final fallback
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent?.trim()) {
      const text = el.textContent.trim();
      if (text.length > 0 && text !== 'New chat') {
        return text.substring(0, 100);
      }
    }
  }

  return null;
}


function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

console.log('LeChat content script loaded');
