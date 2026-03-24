/**
 * Content script for localhost:3000 (web app)
 * Bridges chrome.storage.local to the web app via window messaging
 */

// Listen for messages from the web app
window.addEventListener('message', async (event) => {
  // Only accept messages from the web app itself
  if (event.source !== window) return;

  if (event.data.type === 'NOOSPHERE_CHECK_BRIDGE') {
    try {
      const result = await chrome.storage.local.get([
        'noosphere_bridge_data',
        'noosphere_bridge_flag'
      ]);

      // Send data back to web app
      window.postMessage({
        type: 'NOOSPHERE_BRIDGE_RESPONSE',
        data: {
          noosphere_bridge_data: result.noosphere_bridge_data,
          noosphere_bridge_flag: result.noosphere_bridge_flag
        }
      }, '*');
    } catch (error) {
      console.error('Failed to read bridge data:', error);
      window.postMessage({
        type: 'NOOSPHERE_BRIDGE_ERROR',
        error: error.message
      }, '*');
    }
  }

  if (event.data.type === 'NOOSPHERE_CLEAR_BRIDGE') {
    try {
      await chrome.storage.local.remove([
        'noosphere_bridge_data',
        'noosphere_bridge_flag'
      ]);

      window.postMessage({
        type: 'NOOSPHERE_BRIDGE_CLEARED'
      }, '*');
    } catch (error) {
      console.error('Failed to clear bridge:', error);
      window.postMessage({
        type: 'NOOSPHERE_CLEAR_ERROR',
        error: error.message
      }, '*');
    }
  }
});

console.log('Noosphere Bridge content script loaded for localhost');
