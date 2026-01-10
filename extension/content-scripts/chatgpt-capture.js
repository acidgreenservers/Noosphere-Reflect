/**
 * Content script for ChatGPT (chatgpt.com and chat.openai.com)
 * Captures conversations and sends to extension bridge
 * Dependencies loaded by manifest: types.js, markdown-extractor.js, gpt-parser.js, bridge-storage.js, settings-sync.js
 */

// Listen for capture trigger from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_CHAT') {
    captureChatGptChat()
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

async function extractSessionData() {
  const htmlContent = document.documentElement.outerHTML;
  const chatData = parseChatGptHtml(htmlContent);
  const title = extractPageTitle() || 'ChatGPT Conversation';
  const timestamp = new Date().toISOString();
  const userName = await getUsernameFromWebApp();

  return new SavedChatSession({
    id: generateSessionId(),
    name: title,
    date: timestamp,
    inputContent: htmlContent,
    chatTitle: title,
    userName: userName,
    aiName: 'ChatGPT',
    selectedTheme: ChatTheme.DarkDefault,
    parserMode: ParserMode.ChatGptHtml,
    chatData: chatData,
    metadata: new ChatMetadata(title, 'ChatGPT', timestamp, [], '', window.location.href)
  });
}

async function captureChatGptChat() {
  const session = await extractSessionData();
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
  // ChatGPT uses a button with data-testid="model-switcher-dropdown-button" for the title area
  // DOM structure: <button data-testid="model-switcher-dropdown-button">...<div>ChatGPT</div>...</button>
  const selectors = [
    'button[data-testid="model-switcher-dropdown-button"]',  // Primary: model switcher button
    'button[data-testid="model-switcher-dropdown-button"] > div',  // Secondary: div inside button
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

console.log('ChatGPT content script loaded');
