/**
 * Content script for Google Gemini (gemini.google.com)
 * Captures conversations and sends to extension bridge
 * Dependencies loaded by manifest: types.js, markdown-extractor.js, gemini-parser.js, bridge-storage.js, settings-sync.js
 */

// Listen for capture trigger from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_CHAT' || request.action === 'CAPTURE_CHAT_COPY') {
    const importType = request.action === 'CAPTURE_CHAT_COPY' ? 'copy' : 'merge';
    captureGeminiChat(importType)
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
 * Auto-scroll to top and wait for all content to load
 * Handles Gemini's lazy-loading by scrolling up and allowing DOM to render
 */
/**
 * Robustly load all messages by scrolling and waiting for DOM stability
 * Handles Gemini's lazy-loading with multiple attempts and checks
 */
async function scrollToTopAndLoadAll() {
  console.log('🔄 Loading all messages by scrolling...');
  window.ToastManager.show('📜 Loading full conversation...', 'info');

  const scrollContainer = document.querySelector('[data-test-id="chat-history-container"]') ||
    document.querySelector('.chat-history') ||
    document.querySelector('infinite-scroller') ||
    document.querySelector('main');

  if (!scrollContainer) {
    console.warn('[Gemini Capture] Could not find scroll container, proceeding with visible content');
    return;
  }

  let lastMessageCount = 0;
  let currentMessageCount = 0;
  let noChangeCount = 0;
  const maxScrollAttempts = 30;
  let scrollAttempts = 0;

  while (scrollAttempts < maxScrollAttempts) {
    // Count current messages
    const allMessages = document.querySelectorAll('.query-text, .message-content');
    currentMessageCount = allMessages.length;

    // Log progress periodically
    if (scrollAttempts % 5 === 0) {
      console.log(`[Gemini Capture] Scroll attempt ${scrollAttempts + 1}: Found ${currentMessageCount} messages`);
    }

    // If no new messages loaded after several attempts, we're likely done
    if (currentMessageCount === lastMessageCount) {
      noChangeCount++;
      if (noChangeCount >= 3) {
        console.log('✅ No new messages loading, conversation fully loaded');
        break;
      }
    } else {
      noChangeCount = 0;
      lastMessageCount = currentMessageCount;
    }

    // Scroll to top to trigger older messages loading
    scrollContainer.scrollTop = 0;

    // Wait for content to load - using ReliabilityManager for unthrottled background execution
    await window.ReliabilityManager.sleep(800);

    // Force tiny scroll if stuck at 0 to re-trigger observers
    if (scrollContainer.scrollTop === 0) {
      scrollContainer.scrollTop = 10;
      await window.ReliabilityManager.sleep(200);
      scrollContainer.scrollTop = 0;
    }

    scrollAttempts++;
  }

  console.log(`✅ Finished loading. Total attempts: ${scrollAttempts}, Final message count: ${currentMessageCount}`);
  window.ToastManager.show(`✅ Loaded ${currentMessageCount} messages!`, 'success');

  // Scroll back to bottom to show latest messages
  scrollContainer.scrollTo({
    top: scrollContainer.scrollHeight,
    behavior: 'auto'
  });

  // Final wait for DOM to stabilize
  await window.ReliabilityManager.sleep(1000);
}

async function extractSessionData(importType = 'merge') {
  // 0. Scroll to top and load all content
  await scrollToTopAndLoadAll();

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
  const metadata = new ChatMetadata(
    title,
    'Gemini',
    timestamp,
    [],
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
    aiName: 'Gemini',
    selectedTheme: ChatTheme.DarkDefault,
    parserMode: ParserMode.GeminiHtml,
    chatData: chatData,
    metadata: metadata
  });
}

async function captureGeminiChat(importType = 'merge') {
  // Enable focus spoofing and reliability engine
  window.ReliabilityManager.enableSpoofing();

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


function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

console.log('Gemini content script loaded');