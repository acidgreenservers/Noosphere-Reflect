/**
 * Content script for Llamacoder
 * Captures conversations and sends to extension bridge
 * Dependencies loaded by manifest: types.js, markdown-extractor.js, llamacoder-parser.js, bridge-storage.js
 */

// Listen for capture trigger from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_CHAT') {
    captureLlamacoderChat()
      .then(result => {
        sendResponse({ success: true, title: result.title });
        chrome.runtime.sendMessage({
          action: 'CAPTURE_SUCCESS',
          title: result.title
        });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
        chrome.runtime.sendMessage({
          action: 'CAPTURE_ERROR',
          error: error.message
        });
        showNotification(`Error: ${error.message}`, 'error');
      });
    return true;
  }
});

async function captureLlamacoderChat() {
  // 1. Extract full HTML
  const htmlContent = document.documentElement.outerHTML;

  // 2. Parse using Llamacoder parser
  const chatData = parseLlamacoderHtml(htmlContent);

  // 3. Extract metadata from page
  const title = extractPageTitle() || 'Llamacoder Conversation';
  const timestamp = new Date().toISOString();

  // 4. Get username from settings (extension storage)
  const userName = await getUsernameFromWebApp();

  // 5. Create session object
  const session = new SavedChatSession({
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
    metadata: new ChatMetadata(
      title,
      'Llamacoder',
      timestamp,
      [],
      '',
      window.location.href
    )
  });

  // 5. Check storage quota
  if (await isStorageQuotaWarning()) {
    showNotification('⚠️ Storage nearly full! Consider exporting as JSON.', 'warning');
  }

  // 6. Save to chrome.storage.local bridge
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
  // Llamacoder titles are typically entered manually by the user
  // Instead of trying to extract from DOM, we return a default
  // Users can edit the title in ArchiveHub after import if needed
  return null;
}

function showNotification(message, type = 'success') {
  const toast = document.createElement('div');

  const colors = {
    success: { bg: '#FFD93D', text: '#333' },
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

console.log('Llamacoder content script loaded');
