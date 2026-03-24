/**
 * Detects which AI chat platform the user is currently on
 */

export function detectPlatform() {
  const hostname = window.location.hostname;

  if (hostname.includes('claude.ai')) return 'claude';
  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) return 'chatgpt';
  if (hostname.includes('chat.mistral.ai')) return 'lechat';
  if (hostname.includes('llamacoder.together.ai')) return 'llamacoder';

  return 'unknown';
}

/**
 * Get metadata about a detected platform
 */
export function getPlatformMetadata(platform) {
  const metadata = {
    claude: { model: 'Claude', icon: '🤖', color: '#CC785C', parser: 'claude-html' },
    chatgpt: { model: 'ChatGPT', icon: '🟢', color: '#10A37F', parser: 'chatgpt-html' },
    lechat: { model: 'Mistral LeChat', icon: '🦙', color: '#FF6B6B', parser: 'lechat-html' },
    llamacoder: { model: 'Llamacoder', icon: '🦙', color: '#FFD93D', parser: 'llamacoder-html' },
    unknown: { model: 'Unknown', icon: '❓', color: '#999999', parser: 'basic' }
  };

  return metadata[platform] || metadata.unknown;
}
