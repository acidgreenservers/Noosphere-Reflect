/**
 * Background service worker for Noosphere Reflect Bridge
 * Handles context menu creation and message routing
 */

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'noosphere-archive-chat',
    title: 'Archive Chat to Noosphere Reflect',
    contexts: ['page'],
    documentUrlPatterns: [
      'https://claude.ai/*',
      'https://chatgpt.com/*',
      'https://chat.openai.com/*',
      'https://chat.mistral.ai/*',
      'https://llamacoder.together.ai/*'
    ]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'noosphere-archive-chat') {
    // Send message to content script to capture the chat
    chrome.tabs.sendMessage(tab.id, {
      action: 'CAPTURE_CHAT'
    }).catch(error => {
      console.error('Failed to send message to content script:', error);
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_SUCCESS') {
    console.log(`✅ Chat captured: ${request.title}`);
  } else if (request.action === 'CAPTURE_ERROR') {
    console.error(`❌ Capture failed: ${request.error}`);
  }
});

console.log('Noosphere Reflect Bridge background worker loaded');
