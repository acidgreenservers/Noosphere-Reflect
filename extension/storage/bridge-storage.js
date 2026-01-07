/**
 * Storage bridge for communicating between extension and web app
 * Uses chrome.storage.local to pass session data to the web app for auto-import
 */

const BRIDGE_DATA_KEY = 'noosphere_bridge_data';
const BRIDGE_FLAG_KEY = 'noosphere_bridge_flag';
const QUOTA_BYTES_WARNING = 7_000_000; // 7MB - warn if approaching 10MB limit

/**
 * Save a session to the extension bridge for web app import
 */
async function saveToBridge(session) {
  try {
    // Check if session is too large (> 5MB)
    const sessionJson = JSON.stringify(session);
    const sizeInBytes = new Blob([sessionJson]).size;

    if (sizeInBytes > 5_000_000) {
      // Session is too large - should be downloaded as JSON instead
      throw new Error(`Session too large (${(sizeInBytes / 1_000_000).toFixed(1)}MB). Please export as JSON instead.`);
    }

    // Get existing pending sessions (if any)
    const result = await chrome.storage.local.get([BRIDGE_DATA_KEY, BRIDGE_FLAG_KEY]);
    const existingData = result[BRIDGE_DATA_KEY] || [];

    // Convert single session to array format (backward compatibility)
    const sessionQueue = Array.isArray(existingData) ? existingData : (existingData ? [existingData] : []);

    // Append new session to queue
    sessionQueue.push(session);

    // Save updated queue
    await chrome.storage.local.set({
      [BRIDGE_DATA_KEY]: sessionQueue,  // Array of sessions
      [BRIDGE_FLAG_KEY]: {
        count: sessionQueue.length,
        lastSessionId: session.id,
        timestamp: Date.now(),
        pending: true
      }
    });

    return { success: true, size: sizeInBytes, queueLength: sessionQueue.length };
  } catch (error) {
    console.error('Failed to save to bridge:', error);
    throw error;
  }
}

/**
 * Check if there's pending data in the bridge
 */
async function getPendingData() {
  try {
    const result = await chrome.storage.local.get([BRIDGE_DATA_KEY, BRIDGE_FLAG_KEY]);

    if (result[BRIDGE_FLAG_KEY]?.pending && result[BRIDGE_DATA_KEY]) {
      const data = result[BRIDGE_DATA_KEY];
      // Return array (normalize legacy single-session format)
      return Array.isArray(data) ? data : [data];
    }

    return [];  // Return empty array instead of null
  } catch (error) {
    console.error('Failed to get bridge data:', error);
    return [];
  }
}

/**
 * Clear the bridge after successful import
 */
async function clearBridge() {
  try {
    await chrome.storage.local.remove([BRIDGE_DATA_KEY, BRIDGE_FLAG_KEY]);
    return true;
  } catch (error) {
    console.error('Failed to clear bridge:', error);
    throw error;
  }
}

/**
 * Get current storage usage in bytes
 */
async function getStorageUsage() {
  try {
    const result = await chrome.storage.local.getBytesInUse();
    return result;
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return null;
  }
}

/**
 * Check if we're approaching storage quota limit
 */
async function isStorageQuotaWarning() {
  try {
    const usage = await getStorageUsage();
    return usage && usage > QUOTA_BYTES_WARNING;
  } catch (error) {
    return false;
  }
}

/**
 * Format bytes for display
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
