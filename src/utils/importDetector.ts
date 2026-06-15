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
  type: 'json' | 'markdown' | 'html' | 'unknown';
  platform?: string;           // For platform HTML (Claude, ChatGPT, etc.)
  hasMetadata: boolean;        // True if full metadata available
  structure: {
    hasPromptResponse: boolean;
    hasNoosphereAttribution: boolean;
  };
  error?: string;             // Reason if unsupported
}

/**
 * Validates that a JSON object is a genuine Noosphere Reflect export
 */
export const isValidReflectJson = (data: any): boolean => {
  try {
    return data?.exportedBy?.tool === 'Noosphere Reflect';
  } catch {
    return false;
  }
};

/**
 * Validates that a Markdown string is a genuine Noosphere Reflect export
 */
export const isValidReflectMarkdown = (content: string): boolean => {
  return content.includes('# Noosphere Reflect') ||
         content.includes('Noosphere Reflect\n*Meaning Through Memory*');
};

/**
 * Validates that an HTML string is a genuine Noosphere Reflect export
 */
export const isValidReflectHtml = (content: string): boolean => {
  return content.includes('<!-- Noosphere Footer -->') ||
         content.includes('<strong>Noosphere Reflect</strong>') ||
         content.includes('Preserving Meaning Through Memory');
};

/**
 * Detect if content has standardized chat structure
 * Requires: `## Prompt:` and `## Response:` section headers
 */
export const hasChatStructure = (content: string): boolean => {
  const promptMatch = content.includes('## Prompt') || content.includes('## User') || content.includes('## Human');
  const responseMatch = content.includes('## Response') || content.includes('## AI') || content.includes('## Assistant');
  const flexibleMatch = /##\s+[^:\n]+:/.test(content);

  return (promptMatch && responseMatch) || flexibleMatch;
};

/**
 * Detect platform from HTML content markers
 */
export const detectPlatformFromHTML = (content: string): ParserMode | null => {
  if (content.includes('model-response') || content.includes('user-query') || content.includes('gemini.google.com')) {
    return ParserMode.GeminiHtml;
  }
  if (content.includes('bg-basic-gray-alpha-4') || content.includes('data-message-author-role')) {
    return ParserMode.LeChatHtml;
  }
  if (content.includes('font-claude-response')) {
    return ParserMode.ClaudeHtml;
  }
  if (content.includes('[data-turn]') || content.includes('data-message-id')) {
    return ParserMode.ChatGptHtml;
  }
  return null;
};

/**
 * Main detection function: Analyze file content and determine source
 */
export const detectImportSource = (content: string, filename: string): ImportDetectionResult => {
  const extension = filename.toLowerCase().split('.').pop();
  const type: 'json' | 'markdown' | 'html' | 'unknown' =
    extension === 'json' ? 'json' :
    (extension === 'md' || extension === 'txt') ? 'markdown' :
    (extension === 'html' || extension === 'htm') ? 'html' : 'unknown';

  if (type === 'unknown') {
    return {
      isSupported: false,
      source: 'unsupported',
      type: 'unknown',
      hasMetadata: false,
      structure: { hasPromptResponse: false, hasNoosphereAttribution: false },
      error: `Unsupported file type: ${extension}`
    };
  }

  // 1. Check for Genuine Noosphere Export (any format)
  let isNoosphere = false;
  if (type === 'json') {
    try {
      isNoosphere = isValidReflectJson(JSON.parse(content));
    } catch {}
  } else if (type === 'markdown') {
    isNoosphere = isValidReflectMarkdown(content);
  } else if (type === 'html') {
    isNoosphere = isValidReflectHtml(content);
  }

  if (isNoosphere) {
    return {
      isSupported: true,
      source: 'noosphere',
      type,
      hasMetadata: true,
      structure: {
        hasPromptResponse: hasChatStructure(content),
        hasNoosphereAttribution: true
      }
    };
  }

  // 2. Check for Platform HTML
  if (type === 'html') {
    const platformMode = detectPlatformFromHTML(content);
    if (platformMode) {
      const platformName = platformMode.toString().replace('Html', '').replace('ParserMode.', '');
      return {
        isSupported: true,
        source: 'platform-html',
        type: 'html',
        platform: platformName,
        hasMetadata: true,
        structure: { hasPromptResponse: false, hasNoosphereAttribution: false }
      };
    }
    return {
      isSupported: false,
      source: 'unsupported',
      type: 'html',
      hasMetadata: false,
      structure: { hasPromptResponse: false, hasNoosphereAttribution: false },
      error: 'HTML file is not a recognized AI platform export or Noosphere export'
    };
  }

  // 3. Check for 3rd-Party Chat Structure (Markdown/JSON)
  const hasStructure = hasChatStructure(content);
  if (hasStructure) {
    return {
      isSupported: true,
      source: '3rd-party',
      type,
      hasMetadata: false,
      structure: {
        hasPromptResponse: true,
        hasNoosphereAttribution: false
      }
    };
  }

  // 4. Special case for JSON that might be a raw message list but not a full session
  if (type === 'json') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) || parsed.messages || parsed.chatData) {
        return {
          isSupported: true,
          source: '3rd-party',
          type: 'json',
          hasMetadata: false,
          structure: { hasPromptResponse: true, hasNoosphereAttribution: false }
        };
      }
    } catch {}
  }

  return {
    isSupported: false,
    source: 'unsupported',
    type,
    hasMetadata: false,
    structure: {
      hasPromptResponse: false,
      hasNoosphereAttribution: false
    },
    error: 'File does not contain standardized chat structure or recognized platform markers'
  };
};

/**
 * Extract metadata specifically from Noosphere Reflect exports
 */
export const extractNoosphereMetadata = (content: string) => {
  const metadata: any = {};
  const titleMatch = content.match(/^#\s+(.+?)$/m) || content.match(/^Title:\s*(.+?)$/m);
  if (titleMatch) metadata.title = titleMatch[1].trim();

  const modelMatch = content.match(/^Model:\s*(.+?)$/m) || content.match(/AI:\s*(.+?)$/m);
  if (modelMatch) metadata.model = modelMatch[1].trim();

  const dateMatch = content.match(/^Date:\s*(.+?)$/m);
  if (dateMatch) metadata.date = dateMatch[1].trim();

  const tagsMatch = content.match(/^Tags:\s*(.+?)$/m);
  if (tagsMatch) metadata.tags = tagsMatch[1].split(',').map((t: string) => t.trim());

  const authorMatch = content.match(/^Author:\s*(.+?)$/m);
  if (authorMatch) metadata.author = authorMatch[1].trim();

  const sourceMatch = content.match(/^Source:\s*(.+?)$/m);
  if (sourceMatch) metadata.sourceUrl = sourceMatch[1].trim();

  // Extract exportedBy specifically for Noosphere JSON exports
  // This is usually handled by the JSON parser but we can detect it here if needed
  if (content.includes('"exportedBy"') && content.includes('"tool": "Noosphere Reflect"')) {
    metadata.exportedBy = {
      tool: 'Noosphere Reflect',
      version: content.match(/"version":\s*"(.+?)"/)?.[1] || 'unknown'
    };
  }

  return metadata;
};

export const getSourceLabel = (result: ImportDetectionResult): string => {
  switch (result.source) {
    case 'noosphere': return '✨ Noosphere Export';
    case '3rd-party': return '📄 3rd-Party Chat';
    case 'platform-html': return `🔵 ${result.platform} HTML`;
    case 'unsupported': return '❌ Unsupported Format';
    default: return 'Unknown';
  }
};

export const getSourceDescription = (result: ImportDetectionResult): string => {
  if (!result.isSupported) return result.error || 'File format not supported';
  switch (result.source) {
    case 'noosphere': return 'Noosphere export - full metadata preserved';
    case '3rd-party': return '3rd-party chat - metadata auto-detected';
    case 'platform-html': return `${result.platform} HTML export - platform detected`;
    default: return '';
  }
};
