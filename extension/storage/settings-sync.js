/**
 * Settings sync for extension
 * Manages synchronization of global settings (like default username)
 * between the web app and Chrome Extension
 */

/**
 * Get username from extension's synced storage
 * Falls back to 'User' if no setting is found
 *
 * @returns {Promise<string>} Username setting or 'User' as default
 */
async function getUsernameFromWebApp() {
  try {
    const result = await chrome.storage.sync.get(['noosphere_default_username']);

    if (result.noosphere_default_username) {
      return result.noosphere_default_username;
    }

    return 'User'; // Default fallback
  } catch (error) {
    console.error('Failed to get username from settings:', error);
    return 'User';
  }
}

/**
 * Save username to extension's synced storage
 * This gets called when user changes the default username in ArchiveHub
 *
 * @param {string} username - The new default username
 * @returns {Promise<boolean>} Success status
 */
async function saveUsernameToSync(username) {
  try {
    await chrome.storage.sync.set({
      noosphere_default_username: username
    });
    console.log(`✓ Username saved to extension: ${username}`);
    return true;
  } catch (error) {
    console.error('Failed to save username to extension storage:', error);
    return false;
  }
}

/**
 * Clear all settings from synced storage
 * Useful for resetting to defaults
 *
 * @returns {Promise<boolean>} Success status
 */
async function clearSettingsFromSync() {
  try {
    await chrome.storage.sync.remove(['noosphere_default_username']);
    console.log('✓ Settings cleared from extension storage');
    return true;
  } catch (error) {
    console.error('Failed to clear settings:', error);
    return false;
  }
}
