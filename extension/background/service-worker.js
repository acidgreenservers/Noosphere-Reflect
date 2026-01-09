/**
 * Background service worker for Noosphere Reflect Bridge
 * Handles context menu creation and message routing
 */

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  // Copy as Markdown
  chrome.contextMenus.create({
    id: 'noosphere-copy-markdown',
    title: 'Copy Chat as Markdown',
    contexts: ['page'],
    documentUrlPatterns: [
      'https://claude.ai/*',
      'https://chatgpt.com/*',
      'https://chat.openai.com/*',
      'https://chat.mistral.ai/*',
      'https://llamacoder.together.ai/*',
      'https://gemini.google.com/*',
      'https://aistudio.google.com/*'
    ]
  });

  // Copy as JSON
  chrome.contextMenus.create({
    id: 'noosphere-copy-json',
    title: 'Copy Chat as JSON',
    contexts: ['page'],
    documentUrlPatterns: [
      'https://claude.ai/*',
      'https://chatgpt.com/*',
      'https://chat.openai.com/*',
      'https://chat.mistral.ai/*',
      'https://llamacoder.together.ai/*',
      'https://gemini.google.com/*',
      'https://aistudio.google.com/*'
    ]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  let action = '';

  switch (info.menuItemId) {
    case 'noosphere-copy-markdown':
      action = 'COPY_MARKDOWN';
      break;
    case 'noosphere-copy-json':
      action = 'COPY_JSON';
      break;
  }

  if (action) {
    // Send message to content script to capture the chat
    chrome.tabs.sendMessage(tab.id, {
      action: action
    }).catch(error => {
      console.error('Failed to send message to content script:', error);
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle UI injector trigger requests
  if (request.action === 'TRIGGER_CAPTURE' && sender.tab) {
    // Relay the capture action to the content script in the same tab
    chrome.tabs.sendMessage(sender.tab.id, {
      action: request.captureAction
    }).then(response => {
      sendResponse(response);
    }).catch(error => {
      console.error('Failed to relay message to content script:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }

  // Handle capture success/error notifications
  if (request.action === 'CAPTURE_SUCCESS') {
    console.log(`✅ Chat captured: ${request.title}`);
  } else if (request.action === 'CAPTURE_ERROR') {
    console.error(`❌ Capture failed: ${request.error}`);
  }
});

console.log('Noosphere Reflect Bridge background worker loaded');
