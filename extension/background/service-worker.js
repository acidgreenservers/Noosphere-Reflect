/**
 * Background service worker for Noosphere Reflect Bridge
 * Handles message routing for UI injector
 */

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