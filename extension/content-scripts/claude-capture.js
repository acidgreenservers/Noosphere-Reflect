/**
 * Content script for Claude.ai
 * Captures conversations and sends to extension bridge
 * Dependencies loaded by manifest: types.js, markdown-extractor.js, claude-parser.js, bridge-storage.js
 */

// Listen for capture trigger from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_CHAT') {
    captureClaudeChat()
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
  sendResponse({ success: false, error: error.message });
  chrome.runtime.sendMessage({ action: 'CAPTURE_ERROR', error: error.message });
  showNotification(`Error: ${error.message}`, 'error');
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
    showNotification(`✅ Copied as ${format.toUpperCase()}!`);
    sendResponse({ success: true });
  } catch (error) {
    handleError(error, sendResponse);
  }
}

async function extractSessionData() {
  const htmlContent = document.documentElement.outerHTML;
  const chatData = parseClaudeHtml(htmlContent);
  const title = extractPageTitle() || 'Claude Conversation';
  const timestamp = new Date().toISOString();
  const userName = await getUsernameFromWebApp();

  return new SavedChatSession({
    id: generateSessionId(),
    name: title,
    date: timestamp,
    inputContent: htmlContent,
    chatTitle: title,
    userName: userName,
    aiName: 'Claude',
    selectedTheme: ChatTheme.DarkDefault,
    parserMode: ParserMode.ClaudeHtml,
    chatData: chatData,
    metadata: new ChatMetadata(title, 'Claude', timestamp, [], '', window.location.href)
  });
}

async function captureClaudeChat() {
  const session = await extractSessionData();
  const title = session.name;

  if (await isStorageQuotaWarning()) {
    showNotification('⚠️ Storage nearly full! Consider exporting as JSON.', 'warning');
  }

  try {
    const result = await saveToBridge(session);
    showNotification(`✅ Chat archived! (${formatBytes(result.size)})`);
    return { success: true, title: title };
  } catch (error) {
    if (error.message.includes('too large')) {
      showNotification('Chat too large. Exporting as JSON...', 'info');
      throw error;
    }
    throw error;
  }
}

function extractPageTitle() {
  // Claude.ai uses a button with data-testid for the chat title
  // DOM structure: <button data-testid="chat-title-button"><div class="min-w-0 flex-1"><div class="truncate font-base-bold">Title</div></div></button>
  const selectors = [
    'button[data-testid="chat-title-button"]',  // Primary: specific button element
    'button[data-testid="chat-title-button"] .truncate', // Alternative: target the truncate inside
    'div.font-base-bold',           // Secondary: font-weight class
    'h1',                           // Fallback
    'div[aria-label*="Chat title"]' // Final fallback
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent?.trim()) {
      const text = el.textContent.trim();
      if (text !== 'New chat' && text.length > 0) {
        return text.substring(0, 100); // Cap at 100 chars
      }
    }
  }

  return null;
}

function showNotification(message, type = 'success') {
  const toast = document.createElement('div');

  const colors = {
    success: { bg: '#10A37F', text: 'white' },
    error: { bg: '#EF4444', text: 'white' },
    warning: { bg: '#F59E0B', text: 'white' },
    info: { bg: '#3B82F6', text: 'white' }
  };

  const color = colors[type] || colors.info;

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color.bg};
    color: ${color.text};
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    max-width: 400px;
    word-wrap: break-word;
  `;

  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease-out';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

console.log('Claude.ai content script loaded');
