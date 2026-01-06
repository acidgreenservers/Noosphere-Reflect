/**
 * Content script for Google Gemini (gemini.google.com)
 * Captures conversations and sends to extension bridge
 * Dependencies loaded by manifest: types.js, markdown-extractor.js, gemini-parser.js, bridge-storage.js, settings-sync.js
 */

// Listen for capture trigger from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_CHAT') {
    captureGeminiChat()
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
    return true; // Keep channel open for async
  }
});

async function captureGeminiChat() {
  // 1. Extract full HTML
  const htmlContent = document.documentElement.outerHTML;

  // 2. Parse using Gemini parser
  const chatData = parseGeminiHtml(htmlContent);

  // 3. Extract metadata from page
  const title = extractPageTitle() || 'Gemini Conversation';
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
    aiName: 'Gemini',
    selectedTheme: ChatTheme.DarkDefault,
    parserMode: ParserMode.GeminiHtml,
    chatData: chatData,
    metadata: new ChatMetadata(
      title,
      'Gemini',
      timestamp,
      [],
      '',
      window.location.href
    )
  });

  // 6. Check storage quota
  if (await isStorageQuotaWarning()) {
    showNotification('⚠️ Storage nearly full! Consider exporting as JSON.', 'warning');
  }

  // 7. Save to chrome.storage.local bridge
  try {
    const result = await saveToBridge(session);
    showNotification(`✅ Chat archived! (${formatBytes(result.size)})`);
    return { success: true, title: title };
  } catch (error) {
    if (error.message.includes('too large')) {
      showNotification('Chat too large. Exporting as JSON...', 'info');
      // TODO: Trigger JSON download instead
      throw error;
    }
    throw error;
  }
}

function extractPageTitle() {
  // Gemini conversation title is usually in: span.conversation-title
  const selectors = [
    'span.conversation-title',          // Primary: conversation title span
    'button[aria-label*="Conversation"]', // Secondary: conversation button
    'h1',                                 // Fallback: h1 element
    'div[aria-label*="Chat"]'             // Final fallback
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

console.log('Gemini content script loaded');
