/**
 * Import Detector: Identify file source (Noosphere vs 3rd-party) and chat structure
 *
 * Constraints:
 * - Noosphere exports: Must have `## Prompt:` / `## Response:` + 'Noosphere Reflect' attribution
 * - 3rd-party chats: Must have `## Prompt:` / `## Response:` but NO Noosphere attribution
 * - Platform HTML: Claude/ChatGPT/Gemini HTML with platform-specific markers
 */

import { ParserMode } from '../types';

export interface ImportDetectionResult {
  isSupported: boolean;        // Can we import this file?
  source: 'noosphere' | '3rd-party' | 'platform-html' | 'unsupported';
  platform?: string;           // For platform HTML (Claude, ChatGPT, etc.)
  hasMetadata: boolean;        // True if full metadata available
  structure: {
    hasPromptResponse: boolean;
    hasNoosphereAttribution: boolean;
  };
  error?: string;             // Reason if unsupported
}

/**
 * Detect if content is a Noosphere Reflect exported chat
 * Requires: `## Prompt:` / `## Response:` headers AND 'Noosphere Reflect' phrase
 */
export const isNoosphereExport = (content: string): boolean => {
  const hasStructure = hasChatStructure(content);
  const hasAttribution = content.includes('Noosphere Reflect');
  return hasStructure && hasAttribution;
};

/**
 * Detect if content has standardized chat structure
 * Requires: `## Prompt:` and `## Response:` section headers
 */
export const hasChatStructure = (content: string): boolean => {
  // Check for specialized Noosphere/Legacy headers
  const promptMatch = content.includes('## Prompt') || content.includes('## User') || content.includes('## Human');
  const responseMatch = content.includes('## Response') || content.includes('## AI') || content.includes('## Assistant');

  // Also check for user's flexible name format: ## Name:
  const flexibleMatch = /##\s+[^:\n]+:/.test(content);

  return (promptMatch && responseMatch) || flexibleMatch;
};

/**
 * Detect platform from HTML content markers
 * Returns ParserMode enum value if detected
 */
export const detectPlatformFromHTML = (content: string): ParserMode | null => {
  // Gemini detection
  if (content.includes('model-response') || content.includes('user-query') || content.includes('gemini.google.com')) {
    return ParserMode.GeminiHtml;
  }

  // LeChat (Mistral) detection
  if (content.includes('bg-basic-gray-alpha-4') || content.includes('data-message-author-role')) {
    return ParserMode.LeChatHtml;
  }

  // Claude detection
  if (content.includes('font-claude-response')) {
    return ParserMode.ClaudeHtml;
  }

  // ChatGPT detection
  if (content.includes('[data-turn]') || content.includes('data-message-id')) {
    return ParserMode.ChatGptHtml;
  }

  return null;
};

/**
 * Main detection function: Analyze file content and determine source
 * Returns detailed detection result with source type and support status
 */
export const detectImportSource = (content: string, filename?: string): ImportDetectionResult => {
  // Try platform HTML first (detected by content markers, no filename pattern required)
  const platformMode = detectPlatformFromHTML(content);
  if (platformMode) {
    const platformName = platformMode.toString().replace('Html', '').replace('ParserMode.', '');
    return {
      isSupported: true,
      source: 'platform-html',
      platform: platformName,
      hasMetadata: true,
      structure: {
        hasPromptResponse: false,
        hasNoosphereAttribution: false
      }
    };
  }

  // Check for chat structure (Prompt/Response headers)
  const hasStructure = hasChatStructure(content);

  if (!hasStructure) {
    return {
      isSupported: false,
      source: 'unsupported',
      hasMetadata: false,
      structure: {
        hasPromptResponse: false,
        hasNoosphereAttribution: false
      },
      error: 'File does not contain standardized chat structure (missing "## Prompt:" and "## Response:" headers)'
    };
  }

  // Check for Noosphere attribution
  const hasNoosphereAttribution = content.includes('Noosphere Reflect');

  if (hasNoosphereAttribution) {
    return {
      isSupported: true,
      source: 'noosphere',
      hasMetadata: true,
      structure: {
        hasPromptResponse: true,
        hasNoosphereAttribution: true
      }
    };
  }

  // Has structure but no Noosphere attribution = 3rd-party
  return {
    isSupported: true,
    source: '3rd-party',
    hasMetadata: false,
    structure: {
      hasPromptResponse: true,
      hasNoosphereAttribution: false
    }
  };
};

/**
 * Extract metadata specifically from Noosphere Reflect exports
 * Only works if file is confirmed to be Noosphere export
 */
export const extractNoosphereMetadata = (content: string) => {
  const metadata: any = {};

  // Extract title from first line or "Title:" field
  const titleMatch = content.match(/^#\s+(.+?)$/m) || content.match(/^Title:\s*(.+?)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Extract model/AI service
  const modelMatch = content.match(/^Model:\s*(.+?)$/m) || content.match(/AI:\s*(.+?)$/m);
  if (modelMatch) {
    metadata.model = modelMatch[1].trim();
  }

  // Extract date
  const dateMatch = content.match(/^Date:\s*(.+?)$/m);
  if (dateMatch) {
    metadata.date = dateMatch[1].trim();
  }

  // Extract tags
  const tagsMatch = content.match(/^Tags:\s*(.+?)$/m);
  if (tagsMatch) {
    metadata.tags = tagsMatch[1].split(',').map((t: string) => t.trim());
  }

  // Extract author
  const authorMatch = content.match(/^Author:\s*(.+?)$/m);
  if (authorMatch) {
    metadata.author = authorMatch[1].trim();
  }

  // Extract source URL
  const sourceMatch = content.match(/^Source:\s*(.+?)$/m);
  if (sourceMatch) {
    metadata.sourceUrl = sourceMatch[1].trim();
  }

  return metadata;
};

/**
 * Create a human-readable label for the detected source
 */
export const getSourceLabel = (result: ImportDetectionResult): string => {
  switch (result.source) {
    case 'noosphere':
      return '✨ Noosphere Export';
    case '3rd-party':
      return '📄 3rd-Party Chat';
    case 'platform-html':
      return `🔵 ${result.platform} HTML`;
    case 'unsupported':
      return '❌ Unsupported Format';
    default:
      return 'Unknown';
  }
};

/**
 * Create a human-readable description of why import failed (if applicable)
 */
export const getSourceDescription = (result: ImportDetectionResult): string => {
  if (!result.isSupported) {
    return result.error || 'File format not supported';
  }

  switch (result.source) {
    case 'noosphere':
      return 'Noosphere export - full metadata will be preserved';
    case '3rd-party':
      return '3rd-party chat - metadata will be auto-detected';
    case 'platform-html':
      return `${result.platform} HTML export - platform will be detected`;
    default:
      return '';
  }
};
