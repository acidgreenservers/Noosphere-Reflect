import { ChatData, ChatMessage, ChatMessageType, ChatTheme, ThemeClasses, ParserMode, ChatMetadata, SavedChatSession, ConversationManifest, ConversationArtifact, Memory } from '../types';
import { escapeHtml, sanitizeUrl, validateLanguage, sanitizeFilename, neutralizeDangerousExtension } from '../utils/securityUtils';
import JSZip from 'jszip';
import { storageService } from './storageService';
import { ParserFactory } from './parsers/ParserFactory';
import { themeRegistry } from '../components/exports/themes';
import { exportService, FilePackager, MemoryExportService, MarkdownProcessor } from '../components/exports/services';

/**
 * Checks if a string is valid JSON.
 * @param text The string to check.
 * @returns True if the string is valid JSON, false otherwise.
 */
export const isJson = (text: string): boolean => {
  try {
    JSON.parse(text);
    return true;
  } catch (e) {
    return false;
  }
};


/**
 * Parse JSON that was exported from this app.
 * Preserves all metadata: title, model, date, tags, author, sourceUrl.
 * This enables users to re-import their exported chat archives with full fidelity.
 */
const parseExportedJson = (exportedData: any): ChatData => {
  const messages: ChatMessage[] = exportedData.messages || [];
  const metadata = exportedData.metadata || {};

  // Validate messages array exists
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Exported JSON must contain a messages array');
  }

  // Validate each message has required fields
  for (const msg of messages) {
    if (!msg.type || !msg.content) {
      throw new Error('Each message must have type and content');
    }
    if (!['prompt', 'response'].includes(msg.type.toLowerCase())) {
      throw new Error(`Invalid message type: ${msg.type}. Must be 'prompt' or 'response'.`);
    }
  }

  return {
    messages: messages.map(msg => ({
      type: msg.type.toLowerCase() as ChatMessageType,
      content: msg.content,
      isEdited: msg.isEdited || false
    })),
    metadata: {
      title: metadata.title || 'Imported Chat',
      model: metadata.model || 'Unknown Model',
      date: metadata.date || new Date().toISOString(),
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      author: metadata.author,
      sourceUrl: metadata.sourceUrl
    }
  };
};


/**
 * Shared DOM utilities have been moved to src/services/parsers/ParserUtils.ts
 */

/**
 * Parses raw input (Markdown or JSON) into structured ChatData.
 * Delegated to modular parsers via ParserFactory.
 * @param input The raw chat content string.
 * @param fileType (Legacy) Kept for signature compatibility.
 * @param mode The parsing mode.
 * @param apiKey Optional API key for AI mode.
 * @returns A ChatData object.
 */
export const parseChat = async (input: string, fileType: 'markdown' | 'json' | 'auto', mode: ParserMode, apiKey?: string): Promise<ChatData> => {
  const parser = ParserFactory.getParser(mode);
  if (parser) {
    return parser.parse(input);
  }

  // Fallback for auto-detection if no mode is selected or if Basic is used (factory handles Basic)
  throw new Error(`Unsupported parser mode: ${mode}`);
};

/**
 * Specialized parser for Llamacoder HTML exports.
 * Extracts messages from the specific DOM structure used by Llamacoder.
 */

/**
 * Platform-specific HTML parsers have been moved to src/services/parsers/
 */

/**
 * Helper to convert complex HTML (like Llamacoder prose) back to Markdown-ish content.
 * Focuses on preserving code blocks and basic formatting.
 */

/**
 * applyInlineFormatting remains here as it's used by the JSON/Markdown basic parsers
 * to prepare content for the dashboard UI.
 */


/**
 * Helper to apply inline markdown conversion to a given text.
 * @param text The text to apply inline formatting to.
 * @returns The HTML string with inline formatting.
 */
const applyInlineFormatting = (text: string): string => {
  // 1. Escape HTML FIRST (prevents XSS) using centralized security utility
  let escaped = escapeHtml(text);

  // 2. Apply formatting to the already-escaped text

  // Convert inline code (single backticks)
  // Note: codeContent is already escaped by step 1, so we just wrap it.
  escaped = escaped.replace(/`([^`]+)`/g, (match, codeContent) => {
    return `<code class="inline-code">${codeContent}</code>`;
  });

  // Convert bold (**text** or __text__)
  escaped = escaped.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
  // Convert italic (*text* or _text_)
  escaped = escaped.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
  // Convert images ( ![alt text](url) ) - MUST BE BEFORE links
  escaped = escaped.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, (match, alt, url) => {
    const safeUrl = sanitizeUrl(url);
    return safeUrl ? `<img src="${safeUrl}" alt="${alt}" class="responsive-image inline-block my-1" />` : '';
  });
  // Convert links ([text](url))
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    const safeUrl = sanitizeUrl(url);
    return safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${text}</a>` : text;
  });

  // Convert LeChat context badges ([!BADGE:text])
  // Note: This must be AFTER link conversion to avoid conflicts
  escaped = escaped.replace(/\[!BADGE:([^\]]+)\]/g, (match, badgeText) => {
    return `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30 mx-0.5">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
        <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
        <path d="M10 9H8"></path>
        <path d="M16 13H8"></path>
        <path d="M16 17H8"></path>
      </svg>
      <span>${badgeText}</span>
    </span>`;
  });

  return escaped;
};

// Helper for parsing a list block (supports basic nesting)
interface ListParseResult {
  html: string;
  newIndex: number;
}
const parseListBlock = (lines: string[], startIndex: number): ListParseResult => {
  const listHtml: string[] = [];
  const listStack: Array<{ type: 'ul' | 'ol'; indent: number }> = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    const listItemMatch = line.match(/^(\s*)([*-+]|\d+\.)\s+(.*)/);
    // This regex ensures we only consider a line a list item if it starts with *, -, +, or 1. etc.
    // It also captures the leading whitespace for indent calculation.

    if (listItemMatch) {
      const indent = listItemMatch[1].length;
      const marker = listItemMatch[2];
      const content = listItemMatch[3];
      const type: 'ul' | 'ol' = marker.match(/^\d+\./) ? 'ol' : 'ul';

      // Check if we need to close existing lists due to decreasing indent or change of list type
      while (listStack.length > 0 &&
        (indent <= listStack[listStack.length - 1].indent || type !== listStack[listStack.length - 1].type)) {
        listHtml.push(`</li></${listStack.pop()!.type}>`);
      }

      // Open new list if it's the first item or indent increased
      if (listStack.length === 0 || indent > listStack[listStack.length - 1].indent) {
        listHtml.push(`<${type}>`);
        listStack.push({ type, indent });
      } else { // Same list type, same indent - just close previous <li> and open new one
        listHtml.push(`</li>`);
      }

      // Add the list item
      listHtml.push(`<li>${applyInlineFormatting(content)}`);
      i++;
    } else if (listStack.length > 0 && line.trim() === '') {
      // Empty line within a list item context, treat as a break if no subsequent list item
      // For now, just absorb, a more advanced parser would handle continued text
      listHtml.push('<br/>'); // Add a line break for empty lines within a list
      i++;
    }
    else {
      // Not a list item or empty line within a list, so end of the list block
      break;
    }
  }

  // Close any remaining open lists and list items
  while (listStack.length > 0) {
    listHtml.push(`</li></${listStack.pop()!.type}>`);
  }

  return { html: listHtml.join('\n'), newIndex: i };
};

// Helper for parsing a table block
interface TableParseResult {
  html: string;
  newIndex: number;
}
const parseTableBlock = (lines: string[], startIndex: number): TableParseResult => {
  const tableLines: string[] = [];
  let i = startIndex;

  // Collect all table-like lines (starting with '|')
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    tableLines.push(lines[i]);
    i++;
  }

  if (tableLines.length < 2) { // Need at least header and separator
    return { html: '', newIndex: startIndex };
  }

  const headerLine = tableLines[0];
  const separatorLine = tableLines[1];

  const headerCells = headerLine.split('|').slice(1, -1).map(s => s.trim());
  const alignments = separatorLine.split('|').slice(1, -1).map(s => {
    const trimmed = s.trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    return 'left'; // Default
  });

  let tableHtml = '<table class="min-w-full divide-y divide-gray-700 my-4 table-auto">';
  tableHtml += '<thead class="bg-gray-700"><tr>';
  headerCells.forEach((cell, idx) => {
    const alignStyle = alignments[idx] !== 'left' ? `text-align: ${alignments[idx]};` : '';
    tableHtml += `<th class="px-3 py-2 text-${alignments[idx]} text-xs font-medium text-gray-200 uppercase tracking-wider" style="${alignStyle}">${applyInlineFormatting(cell)}</th>`;
  });
  tableHtml += '</tr></thead>';
  tableHtml += '<tbody class="bg-gray-800 divide-y divide-gray-700">';

  for (let rowIdx = 2; rowIdx < tableLines.length; rowIdx++) {
    const rowCells = tableLines[rowIdx].split('|').slice(1, -1).map(s => s.trim());
    tableHtml += '<tr>';
    rowCells.forEach((cell, idx) => {
      const alignStyle = alignments[idx] !== 'left' ? `text-align: ${alignments[idx]};` : '';
      tableHtml += `<td class="px-3 py-2 whitespace-normal text-sm text-gray-100" style="${alignStyle}">${applyInlineFormatting(cell)}</td>`;
    });
    tableHtml += '</tr>';
  }

  tableHtml += '</tbody></table>';

  return { html: tableHtml, newIndex: i };
};


/**
 * Converts a markdown string to basic HTML.
 * Supports bold, italic, links, blockquotes, inline code, code blocks, lists (unordered/ordered, basic nesting), and tables.
 * @param markdown The markdown string to convert.
 * @param enableThoughts Whether to render collapsible thinking blocks.
 * @returns The HTML string.
 */
const convertMarkdownToHtml = (markdown: string, enableThoughts: boolean): string => {
  // Pre-process: Ensure thought and collapsible tags are on their own lines for detection
  if (enableThoughts) {
    markdown = markdown
      .replace(/<thought>/g, '\n<thought>\n')
      .replace(/<\/thought>/g, '\n</thought>\n')
      .replace(/<collapsible>/g, '\n<collapsible>\n')
      .replace(/<\/collapsible>/g, '\n</collapsible>\n');
  }

  const lines = markdown.split('\n');
  const htmlOutput: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 0. Collapsible blocks (four backticks, <thought>, or <collapsible> tags) - Highest precedence
    if (trimmedLine.startsWith('````') || trimmedLine.startsWith('<thought>') || trimmedLine.startsWith('<collapsible>')) {
      let blockContent = '';
      let j = i + 1;
      const isThought = trimmedLine.startsWith('<thought>');
      const isCollapsible = trimmedLine.startsWith('<collapsible>');

      const endMarker = isThought ? '</thought>' : (isCollapsible ? '</collapsible>' : '````');
      const blockTitle = isCollapsible ? 'Collapsible Section' : 'Thought process';
      const blockClass = isCollapsible ? 'markdown-collapsible-block' : 'markdown-thought-block';
      const summaryClass = isCollapsible ? 'markdown-collapsible-summary' : 'markdown-thought-summary';

      while (j < lines.length && !lines[j].trim().startsWith(endMarker)) {
        blockContent += lines[j] + '\n';
        j++;
      }

      if (j < lines.length) {
        // Handle text appearing on the same line after the end marker
        const closingLine = lines[j].trim();
        const markerIndex = closingLine.indexOf(endMarker);
        const tailContent = closingLine.substring(markerIndex + endMarker.length).trim();
        if (tailContent) {
          if (j + 1 < lines.length) {
            lines[j + 1] = tailContent + '\n' + lines[j + 1];
          } else {
            lines.push(tailContent);
          }
        }
        j++;
      }

      // Split content by paragraphs
      const innerHtml = blockContent.trim().split(/\n\s*\n/).map(p => {
        return `<p>${applyInlineFormatting(p).replace(/\n/g, '<br/>')}</p>`;
      }).join('');

      htmlOutput.push(`
            <details class="${blockClass} my-4">
              <summary class="${summaryClass} cursor-pointer p-2 rounded-md flex items-center justify-between text-lg font-semibold">
                ${blockTitle}: <span class="text-xs ml-2 opacity-70">(Click to expand/collapse)</span>
              </summary>
              <div class="markdown-thought-content p-3 border rounded-b-md">
                ${innerHtml}
              </div>
            </details>
        `);
      i = j;
      continue;
    }

    // 1. Code Blocks (three backticks)
    if (trimmedLine.startsWith('```')) {
      const startTag = trimmedLine;
      const lang = startTag.length > 3 ? startTag.substring(3) : '';

      // Special handling for ```thought blocks to render them uniquely
      if (lang === 'thought') {
        let blockContent = '';
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          blockContent += lines[j] + '\n';
          j++;
        }
        if (j < lines.length) j++; // Move past the closing ```

        // Split content by double newlines for paragraphs within the block
        const thoughtParagraphs = blockContent.trim().split(/\n\s*\n/).map(p => {
          return `<p>${applyInlineFormatting(p).replace(/\n/g, '<br/>')}</p>`;
        }).join('');

        htmlOutput.push(`
            <details class="markdown-thought-block my-4">
              <summary class="markdown-thought-summary cursor-pointer p-2 rounded-md flex items-center justify-between text-lg font-semibold">
                Thought process: <span class="text-xs ml-2 opacity-70">(Click to expand/collapse)</span>
              </summary>
              <div class="markdown-thought-content p-3 border rounded-b-md">
                ${thoughtParagraphs}
              </div>
            </details>
        `);
        i = j;
        continue;
      }

      // Standard Code Blocks
      const languageClass = lang ? `language-${validateLanguage(lang)}` : 'language-plaintext';
      let codeBlockContent = '';
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith('```')) {
        codeBlockContent += lines[j] + '\n';
        j++;
      }
      if (j < lines.length) j++; // Move past the closing ```

      const preHtml = `<pre class="p-2 bg-gray-900 rounded-md my-2 overflow-x-auto"><code class="${languageClass}">${codeBlockContent.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;

      htmlOutput.push(`
            <div class="relative group my-2">
                <button 
                    onclick="copyToClipboard(this)" 
                    class="absolute top-2 right-2 p-1.5 text-xs font-medium text-gray-200 bg-gray-700/80 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none z-10"
                    title="Copy code"
                >
                    Copy
                </button>
                ${preHtml}
            </div>
      `);
      i = j;
      continue;
    }

    // 2. Tables
    // Check if the current line starts a table (must contain '|' and not be a list item/blockquote, etc.)
    // And has a separator line below it.
    if (trimmedLine.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().match(/^\|?:?-+:?\|/)) {
      const tableResult = parseTableBlock(lines, i);
      if (tableResult.html) {
        htmlOutput.push(tableResult.html);
        i = tableResult.newIndex;
        continue;
      }
    }

    // 3. Horizontal Rules
    const hrMatch = trimmedLine.match(/^\s*((\*{3,})|(-){3,}|(_){3,})\s*$/);
    if (hrMatch) {
      htmlOutput.push('<hr class="my-6 border-gray-600" />');
      i++;
      continue;
    }

    // 4. Headings
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingContent = applyInlineFormatting(headingMatch[2].trim());
      htmlOutput.push(`<h${level}>${headingContent}</h${level}>`);
      i++;
      continue;
    }

    // 5. Lists (Unordered and Ordered)
    const listItemMatch = trimmedLine.match(/^(\s*)([*-+]|\d+\.)\s+(.*)/);
    if (listItemMatch) {
      const listResult = parseListBlock(lines, i);
      htmlOutput.push(listResult.html);
      i = listResult.newIndex;
      continue;
    }

    // 6. Blockquotes
    if (trimmedLine.startsWith('>') && !trimmedLine.match(/^>\s*$/)) { // Handle empty blockquotes gracefully
      let blockquoteContent = '';
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('>')) {
        // Remove the '>' and any leading/trailing space immediately after
        const contentLine = lines[j].trim().substring(1).trim();
        blockquoteContent += contentLine + '\n';
        j++;
      }
      // Apply inline formatting and handle potential paragraph breaks within a blockquote
      // Split by empty lines to create paragraphs within the blockquote
      const blockquoteParagraphs = blockquoteContent.trim().split(/\n\s*\n/).map(p => {
        // Replace remaining single newlines with <br/> within each paragraph
        return `<p>${applyInlineFormatting(p).replace(/\n/g, '<br/>')}</p>`;
      }).join('');
      htmlOutput.push(`<blockquote class="border-l-4 border-gray-500 pl-4 italic my-2">${blockquoteParagraphs}</blockquote>`);
      i = j;
      continue;
    }

    // 6.5 Horizontal Rules
    if (trimmedLine.match(/^\s*((\*{3,})|(-){3,}|(_){3,})\s*$/)) {
      htmlOutput.push('<hr class="my-6 border-t border-[var(--border)]" />');
      i++;
      continue;
    }

    // 7. Paragraphs (or other non-block content)
    if (trimmedLine.length > 0) {
      // Collect consecutive non-empty lines into a single paragraph
      let paragraphContent = line;
      let j = i + 1;
      while (j < lines.length && lines[j].trim().length > 0
        // Ensure we don't accidentally consume lines belonging to other block types
        && !lines[j].trim().startsWith('## ') // Not a new chat turn
        && !lines[j].trim().startsWith('```') // Not a code block
        && !lines[j].trim().startsWith('````') // Not a thought block
        && !lines[j].trim().startsWith('|')   // Not a table
        && !lines[j].trim().match(/^(\s*)([*-+]|\d+\.)\s+(.*)/) // Not a list item
        && !lines[j].trim().startsWith('>') // Not a blockquote
        && !lines[j].trim().match(/^(#{1,6})\s+(.*)$/) // Not a heading
        && !lines[j].trim().match(/^\s*((\*{3,})|(-){3,}|(_){3,})\s*$/) // Not a horizontal rule
      ) {
        paragraphContent += '\n' + lines[j];
        j++;
      }
      htmlOutput.push(`<p>${applyInlineFormatting(paragraphContent).replace(/\n/g, '<br/>')}</p>`);
      i = j;
      continue;
    } else {
      // Skip empty lines to allow block element margins to handle spacing
    }
    i++;
  }

  return htmlOutput.join('\n');
};

// Define theme classes
const themeMap: Record<ChatTheme, ThemeClasses> = {
  [ChatTheme.DarkDefault]: {
    htmlClass: 'dark',
    bodyBg: 'bg-gray-900',
    bodyText: 'text-gray-100',
    containerBg: 'bg-gray-800',
    titleText: 'text-blue-400',
    promptBg: 'bg-blue-700',
    responseBg: 'bg-gray-700',
    blockquoteBorder: 'border-gray-500',
    codeBg: 'bg-gray-800',
    codeText: 'text-yellow-300',
  },
  [ChatTheme.LightDefault]: {
    htmlClass: '',
    bodyBg: 'bg-gray-50',
    bodyText: 'text-gray-900',
    containerBg: 'bg-white',
    titleText: 'text-blue-600',
    promptBg: 'bg-blue-200',
    responseBg: 'bg-gray-200',
    blockquoteBorder: 'border-gray-400',
    codeBg: 'bg-gray-100',
    codeText: 'text-purple-700',
  },
  [ChatTheme.DarkGreen]: {
    htmlClass: 'dark',
    bodyBg: 'bg-gray-900',
    bodyText: 'text-gray-100',
    containerBg: 'bg-gray-800',
    titleText: 'text-green-400',
    promptBg: 'bg-green-700',
    responseBg: 'bg-gray-700',
    blockquoteBorder: 'border-gray-500',
    codeBg: 'bg-gray-800',
    codeText: 'text-yellow-300',
  },
  [ChatTheme.DarkPurple]: {
    htmlClass: 'dark',
    bodyBg: 'bg-gray-900',
    bodyText: 'text-gray-100',
    containerBg: 'bg-gray-800',
    titleText: 'text-purple-400',
    promptBg: 'bg-purple-700',
    responseBg: 'bg-gray-700',
    blockquoteBorder: 'border-gray-500',
    codeBg: 'bg-gray-800',
    codeText: 'text-yellow-300',
  },
  [ChatTheme.Claude]: {
    htmlClass: 'dark',
    bodyBg: 'bg-gray-900',
    bodyText: 'text-gray-100',
    containerBg: 'bg-gray-800',
    titleText: 'text-blue-400',
    promptBg: 'bg-blue-700',
    responseBg: 'bg-gray-700',
    blockquoteBorder: 'border-gray-500',
    codeBg: 'bg-gray-800',
    codeText: 'text-yellow-300',
  },
};

/**
 * Generates a standalone HTML file content from ChatData.
 * @param chatData The structured chat data.
 * @param title The title for the generated HTML file.
 * @param theme The chosen theme for the HTML output.
 * @param userName Custom name for the user in the output.
 * @param aiName Custom name for the AI in the output.
 * @param parserMode The parser mode used (affects structure/collapsibility)
 * @returns A string containing the full HTML content.
 */
export const generateHtml = (
  chatData: ChatData,
  title: string = 'AI Chat Export',
  theme: ChatTheme = ChatTheme.DarkDefault,
  userName: string = 'User',
  aiName: string = 'AI',
  parserMode: ParserMode = ParserMode.Basic,
  metadata?: ChatMetadata,
  includeFooter: boolean = true,
  isPreview: boolean = false
): string => {
  return exportService.generate('html', chatData, title, theme, userName, aiName, parserMode, metadata, includeFooter, isPreview);
};

/**
 * Generates a Markdown representation of a chat session.
 * @param chatData The parsed chat data with messages and metadata
 * @param title The title of the chat
 * @param userName Custom name for user messages
 * @param aiName Custom name for AI messages
 * @param metadata Optional metadata to include in the output
 * @returns A string containing the markdown content
 */
export const generateMarkdown = (
  chatData: ChatData,
  title: string = 'AI Chat Export',
  userName: string = 'User',
  aiName: string = 'AI',
  metadata?: ChatMetadata
): string => {
  return exportService.generate('markdown', chatData, title, undefined, userName, aiName, undefined, metadata);
};


/**
 * Platform-specific HTML parsers and shared utilities (extractMarkdownFromHtml, decodeHtmlEntities) 
 * have been moved to src/services/parsers/ for better modularity and maintainability.
 */



/**
 * Generates a JSON representation of a chat session.
 * @param chatData The parsed chat data with messages and metadata
 * @param metadata Optional metadata to include in the output
 * @returns A JSON string containing the exported data
 */
export const generateJson = (
  chatData: ChatData,
  metadata?: ChatMetadata
): string => {
  return exportService.generate('json', chatData, undefined, undefined, undefined, undefined, undefined, metadata);
};

/**
 * Generate manifest.json for a conversation with artifacts
 * @param session - The saved chat session
 * @param version - App version from package.json
 * @returns JSON string of manifest
 */
export const generateManifest = (
  session: SavedChatSession,
  version: string = '0.4.0'
): string => {
  return FilePackager.generateManifest(session, version);
};

/**
 * Create directory export structure with conversation + artifacts
 * @param session - The saved chat session
 * @param format - Export format (html, markdown, json)
 * @returns Object with files: { filename: content }
 */
export const generateDirectoryExport = (
  session: SavedChatSession,
  format: 'html' | 'markdown' | 'json'
): Record<string, string | Blob> => {
  const generateContent = (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => {
    if (format === 'html') {
      return generateHtml(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.selectedTheme,
        session.userName,
        session.aiName,
        session.parserMode,
        session.metadata
      );
    } else if (format === 'markdown') {
      return generateMarkdown(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.userName,
        session.aiName,
        session.metadata
      );
    } else {
      return generateJson(session.chatData!, session.metadata);
    }
  };

  return FilePackager.generateDirectoryExport(session, format, generateContent);
};

/**
 * Generate export metadata JSON
 * @param sessions - Array of sessions being exported
 * @returns Export metadata object
 */
const generateExportMetadata = (sessions: SavedChatSession[]) => {
  const chatMetadata = sessions.map(session => {
    const messageCount = session.chatData?.messages.length || 0;

    // Count artifacts from both sources
    const sessionArtifacts = session.metadata?.artifacts?.length || 0;
    const messageArtifacts = session.chatData?.messages.reduce((count, msg) =>
      count + (msg.artifacts?.length || 0), 0) || 0;
    const artifactCount = sessionArtifacts + messageArtifacts;

    return {
      filename: `[${session.aiName || 'AI'}] - ${(session.metadata?.title || session.chatTitle).replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
      originalTitle: session.metadata?.title || session.chatTitle,
      service: session.aiName || 'AI',
      exportDate: new Date().toISOString(),
      originalDate: session.metadata?.date || session.date,
      messageCount,
      artifactCount,
      tags: session.metadata?.tags || []
    };
  });

  return {
    exportDate: new Date().toISOString(),
    exportedBy: {
      tool: 'Noosphere Reflect',
      version: '0.5.8.3'
    }, chats: chatMetadata,
    summary: {
      totalChats: sessions.length,
      totalMessages: chatMetadata.reduce((sum, chat) => sum + chat.messageCount, 0),
      totalArtifacts: chatMetadata.reduce((sum, chat) => sum + chat.artifactCount, 0)
    }
  };
};



/**
 * Create ZIP archive from directory export
 * @param session - The saved chat session
 * @param format - Export format
 * @returns Blob of ZIP file
 */
export const generateZipExport = async (
  session: SavedChatSession,
  format: 'html' | 'markdown' | 'json'
): Promise<Blob> => {
  const generateContent = (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => {
    if (format === 'html') {
      return generateHtml(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.selectedTheme,
        session.userName,
        session.aiName,
        session.parserMode,
        session.metadata
      );
    } else if (format === 'markdown') {
      return generateMarkdown(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.userName,
        session.aiName,
        session.metadata
      );
    } else {
      return generateJson(session.chatData!, session.metadata);
    }
  };

  return FilePackager.generateZipExport(session, format, generateContent);
};

/**
 * Create batch ZIP export with multiple conversations
 * @param sessions - Array of sessions to export
 * @param format - Export format
 * @returns Blob of ZIP file
 */
export const generateBatchZipExport = async (
  sessions: SavedChatSession[],
  format: 'html' | 'markdown' | 'json'
): Promise<Blob> => {
  const generateContent = (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => {
    if (format === 'html') {
      return generateHtml(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.selectedTheme,
        session.userName,
        session.aiName,
        session.parserMode,
        session.metadata
      );
    } else if (format === 'markdown') {
      return generateMarkdown(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.userName,
        session.aiName,
        session.metadata
      );
    } else {
      return generateJson(session.chatData!, session.metadata);
    }
  };

  return FilePackager.generateBatchZipExport(sessions, format, generateContent);
};

/**
 * Triggers a directory export using the File System Access API.
 * Creates a conversation file and an `artifacts` subfolder if needed.
 * @param session - The session to export.
 * @param format - The export format for the main conversation file.
 */
export const generateDirectoryExportWithPicker = async (
  session: SavedChatSession,
  format: 'html' | 'markdown' | 'json'
) => {
  const generateContent = (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => {
    if (format === 'html') {
      return generateHtml(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.selectedTheme,
        session.userName,
        session.aiName,
        session.parserMode,
        session.metadata
      );
    } else if (format === 'markdown') {
      return generateMarkdown(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.userName,
        session.aiName,
        session.metadata
      );
    } else {
      return generateJson(session.chatData!, session.metadata);
    }
  };

  return FilePackager.generateDirectoryExportWithPicker(session, format, generateContent);
};

/**
 * Generates HTML export for a memory
 */
export const generateMemoryHtml = (
  memory: Memory,
  theme: ChatTheme = ChatTheme.DarkDefault
): string => {
  return MemoryExportService.generateMemoryHtml(memory, theme);
};

/**
 * Generates Markdown export for a memory
 */
export const generateMemoryMarkdown = (memory: Memory): string => {
  return MemoryExportService.generateMemoryMarkdown(memory);
};

/**
 * Generates JSON export for a memory
 */
export const generateMemoryJson = (memory: Memory): string => {
  return MemoryExportService.generateMemoryJson(memory);
};

/**
 * Create batch ZIP export with multiple memories
 * @param memories - Array of memories to export
 * @param format - Export format (html, markdown, json)
 * @param caseFormat - Filename case format from settings
 * @returns Blob of ZIP file
 */
export const generateMemoryBatchZipExport = async (
  memories: Memory[],
  format: 'html' | 'markdown' | 'json',
  caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
): Promise<Blob> => {
  return MemoryExportService.generateMemoryBatchZipExport(memories, format, caseFormat);
};

/**
 * Generate directory structure for batch memory export (for File System Access API)
 * @param memories - Array of memories to export
 * @param format - Export format
 * @param caseFormat - Filename case format from settings
 * @returns Object mapping filenames to content
 */
export const generateMemoryBatchDirectoryExport = (
  memories: Memory[],
  format: 'html' | 'markdown' | 'json',
  caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
): Record<string, string> => {
  return MemoryExportService.generateMemoryBatchDirectoryExport(memories, format, caseFormat);
};

/**
 * Batch export memories to directory using File System Access API
 * @param memories - Array of memories to export
 * @param format - Export format
 * @param caseFormat - Filename case format from settings
 */
export const generateMemoryBatchDirectoryExportWithPicker = async (
  memories: Memory[],
  format: 'html' | 'markdown' | 'json',
  caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
): Promise<void> => {
  return MemoryExportService.generateMemoryBatchDirectoryExportWithPicker(memories, format, caseFormat);
};
