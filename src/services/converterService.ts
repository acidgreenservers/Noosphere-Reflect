import { ChatData, ChatMessage, ChatMessageType, ChatTheme, ThemeClasses, ParserMode, ChatMetadata, SavedChatSession, ConversationManifest, ConversationArtifact, Memory } from '../types';
import { escapeHtml, sanitizeUrl, validateLanguage, sanitizeFilename, neutralizeDangerousExtension } from '../utils/securityUtils';
import JSZip from 'jszip';
import { storageService } from './storageService';
import { ParserFactory } from './parsers/ParserFactory';

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
  // 1. Escape HTML FIRST (prevents XSS)
  // We escape & first to avoid double-escaping entities later
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

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
  const selectedThemeClasses = themeMap[theme];
  const {
    htmlClass,
    bodyBg,
    bodyText,
    containerBg,
    titleText,
    promptBg,
    responseBg,
    blockquoteBorder,
    codeBg,
    codeText,
  } = selectedThemeClasses;

  const enableThoughts = [ParserMode.ClaudeHtml, ParserMode.LeChatHtml, ParserMode.LlamacoderHtml, ParserMode.ChatGptHtml, ParserMode.GeminiHtml].includes(parserMode);

  const previewScript = isPreview ? `
    <script>
      function downloadArtifact(e) {
        e.preventDefault();
        const link = e.currentTarget;
        const b64 = link.getAttribute('data-b64');
        const mime = link.getAttribute('data-mime');
        const filename = link.getAttribute('download');
        
        try {
            const byteCharacters = atob(b64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {type: mime});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error('Download failed', err);
            alert('Download failed: ' + err.message);
        }
      }
    </script>
  ` : '';

  const chatMessagesHtml = chatData.messages
    .map((message, index) => {
      const isPrompt = message.type === ChatMessageType.Prompt;

      // GEMINI-SPECIFIC: Check if this is a thought block (wrapped in <thought> tags)
      const thoughtMatch = message.content.match(/<thought>([\s\S]*?)<\/thought>/);
      const isGeminiThought = parserMode === ParserMode.GeminiHtml && thoughtMatch;

      // For Gemini thoughts, extract and render as a special chat bubble
      if (isGeminiThought) {
        const thoughtContent = thoughtMatch[1].trim();
        const thoughtHtml = convertMarkdownToHtml(thoughtContent, false);

        return `
        <div class="flex justify-start mb-4 w-full" data-message-index="${index}">
          <div class="max-w-xl md:max-w-2xl lg:max-w-3xl rounded-xl p-4 shadow-lg bg-purple-900 text-gray-200 break-words w-auto border-l-4 border-purple-500">
            <div class="flex items-center gap-2 mb-2">
              <p class="font-semibold text-sm opacity-80">💭 Thought</p>
            </div>
            <div class="markdown-content text-sm italic">${thoughtHtml}</div>
          </div>
        </div>
        `;
      }

      // Regular message rendering
      const bgColor = isPrompt ? promptBg : responseBg;
      const justify = isPrompt ? 'justify-end' : 'justify-start';
      const speakerName = isPrompt ? userName : aiName; // Use custom names
      const messageNumber = index + 1; // Message numbering starts at 1
      const headerType = isPrompt ? 'Prompt' : 'Response';

      // For Gemini responses with thoughts: strip the <thought> tags before rendering
      // so the response only shows the main content (thought is shown separately above)
      let contentToRender = message.content;
      if (parserMode === ParserMode.GeminiHtml) {
        contentToRender = contentToRender.replace(/<thought>[\s\S]*?<\/thought>\s*/g, '').trim();
      }

      // Apply theme-specific classes to code blocks and blockquotes generated by convertMarkdownToHtml
      const contentHtml = convertMarkdownToHtml(contentToRender, enableThoughts)
        .replace(/<pre class="p-2 bg-gray-900 rounded-md my-2 overflow-x-auto">/g, `<pre class="p-2 ${codeBg} rounded-md my-2 overflow-x-auto">`)
        .replace(/<code class="language-/g, `<code class="${codeText} language-`) // For fenced code blocks
        .replace(/<code class="inline-code">/g, `<code class="${codeBg} ${codeText} px-1 py-0.5 rounded text-sm">`) // For inline code
        .replace(/<blockquote class="border-l-4 border-gray-500 pl-4 italic my-2">/g, `<blockquote class="border-l-4 ${blockquoteBorder} pl-4 italic text-gray-300 my-2">`)
        // Apply theme-specific classes to the collapsible thought block (only if present)
        .replace(/<details class="markdown-thought-block my-4">/g, `<details class="markdown-thought-block my-4">`) // Base details tag
        .replace(/<summary class="markdown-thought-summary/g, `<summary class="markdown-thought-summary bg-gray-600 text-gray-200 hover:bg-gray-500 active:bg-gray-700`) // Summary
        .replace(/<div class="markdown-thought-content/g, `<div class="markdown-thought-content bg-gray-700 text-gray-100 border-gray-600`); // Content div

      // Check for artifacts linked to this message
      // Prefer direct message artifacts, fall back to metadata index matching (legacy)
      const linkedArtifacts = message.artifacts || metadata?.artifacts?.filter(
        artifact => artifact.insertedAfterMessageIndex === index
      ) || [];

      // Generate artifact HTML if any are linked
      const artifactsHtml = linkedArtifacts.length > 0 ? `
        <div class="mt-4 pt-3 border-t border-gray-600">
          <p class="text-xs text-gray-400 mb-2">📎 Attached Files:</p>
          ${linkedArtifacts.map(artifact => {
        const isImage = artifact.mimeType.startsWith('image/');

        // Context-aware linking:
        // Preview: Use Data URI + download attribute (Force download)
        // Export: Use relative path (Navigate)
        const href = isPreview
          ? `javascript:void(0)`
          : `artifacts/${escapeHtml(artifact.fileName)}`;

        const downloadAttr = isPreview ? `download="${escapeHtml(artifact.fileName)}"` : '';
        const targetAttr = isPreview ? '' : 'target="_blank"';

        // In preview, we use a script (onclick) to handle the download via Blob URL
        // because direct navigation to Data URIs or even target="_blank" is often blocked by sandbox/browser security.
        const dataAttrs = isPreview ? `data-b64="${artifact.fileData}" data-mime="${artifact.mimeType}" onclick="downloadArtifact(event)"` : '';

        if (isImage) {
          return `
                <div class="mb-2">
                  <a href="${href}" ${downloadAttr} ${targetAttr} ${dataAttrs} class="text-blue-400 hover:underline text-sm">
                    ${escapeHtml(artifact.fileName)}
                  </a>
                  <img src="${isPreview ? `data:${artifact.mimeType};base64,${artifact.fileData}` : `artifacts/${escapeHtml(artifact.fileName)}`}" alt="${escapeHtml(artifact.fileName)}" class="mt-2 max-w-full rounded border border-gray-600" style="max-height: 300px;" />
                </div>
              `;
        } else {
          return `
                <div class="mb-1">
                  <a href="${href}" ${downloadAttr} ${targetAttr} ${dataAttrs} class="text-blue-400 hover:underline text-sm flex items-center gap-2">
                    <span>📄</span>
                    <span>${escapeHtml(artifact.fileName)}</span>
                    <span class="text-xs text-gray-500">(${(artifact.fileSize / 1024).toFixed(1)} KB)</span>
                  </a>
                </div>
              `;
        }
      }).join('')}
        </div>
      ` : '';

      return `
        <div class="flex ${justify} mb-4 w-full" data-message-index="${index}">
          <div class="max-w-xl md:max-w-2xl lg:max-w-3xl rounded-xl p-4 shadow-lg ${bgColor} text-white break-words w-auto">
            <div class="flex items-center gap-2 mb-2">
              <p class="font-semibold text-sm opacity-80">${headerType} - ${escapeHtml(speakerName)}</p>
            </div>
            <div class="markdown-content">${contentHtml}</div>
            ${artifactsHtml}
          </div>
        </div>
      `;
    })
    .join('');

  const scrollbarTrack = htmlClass === 'dark' ? '#1a202c' : '#e2e8f0'; // Darker track for dark, lighter for light
  const scrollbarThumb = htmlClass === 'dark' ? '#4a5568' : '#cbd5e0'; // Gray thumb for dark, lighter gray for light
  const scrollbarThumbHover = htmlClass === 'dark' ? '#6b7280' : '#a0aec0'; // Lighter gray on hover

  return `<!DOCTYPE html>
<html lang="en" class="${htmlClass}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <!-- Tailwind CSS CDN for offline viewing -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style type="text/tailwindcss">
      @layer base {
        body {
          @apply ${bodyBg} ${bodyText} font-sans leading-relaxed;
        }
        strong {
            @apply font-bold;
        }
        em {
            @apply italic;
        }
        a {
            @apply text-blue-400 hover:underline;
        }
        code { /* Default for pre > code */
            @apply ${codeBg} ${codeText} px-1 py-0.5 rounded text-sm;
        }
        code.inline-code { /* Specific for inline code */
            @apply ${codeBg} ${codeText} px-1 py-0.5 rounded text-sm;
        }
        pre > code { /* For code blocks */
            @apply block p-2 ${codeBg} rounded-md overflow-x-auto ${codeText};
        }
        blockquote {
            @apply border-l-4 ${blockquoteBorder} pl-4 italic text-gray-300 my-2;
        }
        .markdown-content ul, .markdown-content ol {
            @apply list-inside ml-4 my-2;
        }
        .markdown-content ul {
            @apply list-disc;
        }
        .markdown-content ol {
            @apply list-decimal;
        }
        .markdown-content li {
            @apply mb-1;
        }
        .markdown-content table {
            @apply min-w-full divide-y divide-gray-700 my-4 table-auto border-collapse;
        }
        .markdown-content thead {
            @apply bg-gray-700;
        }
        .markdown-content th, .markdown-content td {
            @apply px-3 py-2 text-sm text-gray-100 border border-gray-600;
        }
        .markdown-content th {
            @apply text-xs font-medium text-gray-200 uppercase tracking-wider text-left;
        }
        .markdown-content tbody tr:nth-child(odd) {
            @apply bg-gray-800;
        }
        .markdown-content tbody tr:nth-child(even) {
            @apply bg-gray-700;
        }
        
        /* Thought Block Styles (dependent on parser mode) */
        .markdown-content .markdown-thought-summary {
            @apply bg-gray-600 text-gray-200 hover:bg-gray-500 active:bg-gray-700 transition-colors;
        }
        .markdown-content .markdown-thought-content {
            @apply bg-gray-700 text-gray-100 border-gray-600;
        }
        .markdown-thought-block summary::marker {
            content: '► '; /* Custom marker for collapsed state */
            @apply text-gray-400;
        }
        .markdown-thought-block[open] summary::marker {
            content: '▼ '; /* Custom marker for expanded state */
        }
        
        /* New Markdown Element Styles */
        .markdown-content h1 { @apply text-3xl font-extrabold mt-6 mb-4 text-blue-300; }
        .markdown-content h2 { @apply text-2xl font-bold mt-5 mb-3 text-blue-200; }
        .markdown-content h3 { @apply text-xl font-semibold mt-4 mb-2 text-blue-100; }
        .markdown-content h4 { @apply text-lg font-medium mt-3 mb-2; }
        .markdown-content h5 { @apply text-base font-medium mt-2 mb-1; }
        .markdown-content h6 { @apply text-sm font-medium mt-2 mb-1; }

        .markdown-content hr {
            @apply my-6 border-t-2 border-gray-600;
        }

        .markdown-content img.responsive-image {
            @apply max-w-full h-auto rounded-md my-2;
        }
        .markdown-content p {
            /* Default paragraph spacing, Tailwind's default applies some margin */
            @apply my-2;
        }
      }
      /* Custom scrollbar styles based on theme */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: ${scrollbarTrack};
      }
      ::-webkit-scrollbar-thumb {
        background: ${scrollbarThumb};
        border-radius: 4px;
      }
    </style>
    <!-- MathJax for rendering equations -->
    <script>
      window.MathJax = {
        tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
        svg: { fontCache: 'global' },
        startup: {
            typeset: false // We will typeset manually if needed, or rely on auto - auto is default actually
        }
      };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script>
    function copyToClipboard(btn) {
      const container = btn.parentElement;
      const pre = container.querySelector('pre');
      const code = pre.innerText;
      navigator.clipboard.writeText(code).then(() => {
         const originalText = btn.innerText;
         btn.innerText = 'Copied!';
         setTimeout(() => { btn.innerText = originalText; }, 2000);
      }).catch(err => {
         console.error('Failed to copy:', err);
         btn.innerText = 'Error';
      });
    }
    </script>
</head>
<body class="p-8">
    <div class="max-w-4xl mx-auto my-8 p-6 ${containerBg} rounded-lg shadow-xl">
        <h1 class="text-4xl font-extrabold text-center ${titleText} mb-4">${escapeHtml(title)}</h1>

        <!-- Metadata Section -->
        <div class="text-center text-sm ${bodyText} opacity-70 mb-8 space-y-1">
            ${metadata?.model ? `<div><strong>Model:</strong> ${escapeHtml(metadata.model)}</div>` : ''}
            ${metadata?.date ? `<div><strong>Date:</strong> ${escapeHtml(new Date(metadata.date).toLocaleString())}</div>` : ''}
            ${metadata?.sourceUrl ? (() => {
      const safeUrl = sanitizeUrl(metadata.sourceUrl);
      return safeUrl ? `<div><strong>Source:</strong> <a href="${escapeHtml(safeUrl)}" class="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">${escapeHtml(safeUrl)}</a></div>` : '';
    })() : ''}
            ${metadata?.tags && metadata.tags.length > 0 ? `<div><strong>Tags:</strong> ${metadata.tags.map(tag => escapeHtml(tag)).join(', ')}</div>` : ''}
        </div>

        <div class="space-y-4 flex flex-col w-full">
            ${chatMessagesHtml}
        </div>

        ${includeFooter ? `
        <!-- Noosphere Footer -->
        <div class="text-center text-xs ${bodyText} opacity-50 mt-16 pt-8 border-t border-gray-700">
            <p class="mt-8"><strong>Noosphere Reflect</strong></p>
            <p class="text-xs italic">${'Preserving Meaning Through Memory'}</p>
        </div>
        ` : ''}
    </div>

    ${previewScript}
</body>
</html>`;
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
  const lines: string[] = [];

  // Header section
  lines.push(`# ${title}\n`);

  if (metadata) {
    if (metadata.model) lines.push(`**Model:** ${metadata.model}`);
    if (metadata.date) lines.push(`**Date:** ${new Date(metadata.date).toLocaleString()}`);
    if (metadata.sourceUrl) lines.push(`**Source:** [${metadata.sourceUrl}](${metadata.sourceUrl})`);
    if (metadata.tags && metadata.tags.length > 0) lines.push(`**Tags:** ${metadata.tags.join(', ')}`);
    if (lines.length > 1) lines.push('');
    lines.push('---\n');
  }

  // Messages
  chatData.messages.forEach((message, index) => {
    const messageNumber = index + 1;
    const speakerName = message.type === ChatMessageType.Prompt ? userName : aiName;
    const headerType = message.type === ChatMessageType.Prompt ? 'Prompt' : 'Response';
    lines.push(`## ${headerType} - ${speakerName}\n`);

    // Convert thought blocks to collapsible details
    let content = message.content;
    content = content.replace(
      /\<thought\>([\s\S]*?)\<\/thought\>/g,
      '\n```thought\n$1\n```\n'
    );

    lines.push(content);

    // Check for artifacts linked to this message
    // Prefer direct message artifacts, fall back to metadata index matching (legacy)
    const linkedArtifacts = message.artifacts || metadata?.artifacts?.filter(
      artifact => artifact.insertedAfterMessageIndex === index
    ) || [];

    if (linkedArtifacts.length > 0) {
      lines.push('\n**📎 Attached Files:**\n');
      linkedArtifacts.forEach(artifact => {
        const artifactPath = `artifacts/${artifact.fileName}`;
        const fileSize = (artifact.fileSize / 1024).toFixed(1);
        lines.push(`- [${artifact.fileName}](${artifactPath}) (${fileSize} KB)`);
      });
    }

    lines.push('');
  });

  // Footer
  lines.push('---\n');
  lines.push('# Noosphere Reflect');
  lines.push('*Meaning Through Memory*');

  return lines.join('\n');
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
  const exportData = {
    exportedBy: {
      tool: 'Noosphere Reflect',
      tagline: 'Meaning Through Memory'
    },
    metadata: metadata || chatData.metadata || {
      title: 'Untitled Chat',
      model: '',
      date: new Date().toISOString(),
      tags: []
    },
    messages: chatData.messages
  };

  return JSON.stringify(exportData, null, 2);
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
  const artifacts = session.metadata?.artifacts || [];

  const manifest: ConversationManifest = {
    version: "1.0",
    conversationId: session.id,
    title: session.metadata?.title || session.chatTitle,
    exportedAt: new Date().toISOString(),
    artifacts: artifacts.map(artifact => {
      const safeName = neutralizeDangerousExtension(sanitizeFilename(artifact.fileName));
      return {
        fileName: safeName,
        filePath: `artifacts/${safeName}`,
        fileSize: artifact.fileSize,
        mimeType: artifact.mimeType,
        description: artifact.description
      };
    }),
    exportedBy: {
      tool: "Noosphere Reflect",
      version: version
    }
  };

  return JSON.stringify(manifest, null, 2);
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
  const files: Record<string, string | Blob> = {};

  // Collect artifacts from BOTH sources
  const allArtifacts: ConversationArtifact[] = [
    // Session-level (unlinked)
    ...(session.metadata?.artifacts || []),

    // Message-level (linked)
    ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
  ];

  // Remove duplicates by ID
  const uniqueArtifacts = Array.from(
    new Map(allArtifacts.map(a => [a.id, a])).values()
  );

  // Generate conversation file
  if (format === 'html') {
    files['conversation.html'] = generateHtml(
      session.chatData!,
      session.metadata?.title || session.chatTitle,
      session.selectedTheme,
      session.userName,
      session.aiName,
      session.parserMode,
      session.metadata
    );
  } else if (format === 'markdown') {
    files['conversation.md'] = generateMarkdown(
      session.chatData!,
      session.metadata?.title || session.chatTitle,
      session.userName,
      session.aiName,
      session.metadata
    );
  } else {
    files['conversation.json'] = generateJson(session.chatData!, session.metadata);
  }

  // Generate manifest if artifacts exist
  if (uniqueArtifacts.length > 0) {
    files['manifest.json'] = generateManifest(session);

    // Add artifact files (decode base64 → blob)
    uniqueArtifacts.forEach(artifact => {
      const safeName = neutralizeDangerousExtension(sanitizeFilename(artifact.fileName));
      const binaryString = atob(artifact.fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: artifact.mimeType });
      files[`artifacts/${safeName}`] = blob;
    });
  }

  return files;
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
      version: '0.5.8'
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
  const zip = new JSZip();
  const files = generateDirectoryExport(session, format);

  // Generate folder name with service prefix: [Service] - title
  const serviceName = session.aiName || 'AI';
  const title = session.metadata?.title || session.chatTitle;
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const folderName = `[${serviceName}] - ${sanitizedTitle}`;

  const folder = zip.folder(folderName)!;

  // Add all files to ZIP
  for (const [filename, content] of Object.entries(files)) {
    if (content instanceof Blob) {
      folder.file(filename, content);
    } else {
      folder.file(filename, content);
    }
  }

  // Generate export metadata
  const metadata = generateExportMetadata([session]);
  folder.file('export-metadata.json', JSON.stringify(metadata, null, 2));

  return await zip.generateAsync({ type: 'blob' });
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
  const zip = new JSZip();

  for (const session of sessions) {
    const files = generateDirectoryExport(session, format);

    // Generate folder name with service prefix: [Service] - title
    const serviceName = session.aiName || 'AI';
    const title = session.metadata?.title || session.chatTitle;
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const folderName = `[${serviceName}] - ${sanitizedTitle}`;

    const folder = zip.folder(folderName)!;

    // Add all files to folder
    for (const [filename, content] of Object.entries(files)) {
      if (content instanceof Blob) {
        folder.file(filename, content);
      } else {
        folder.file(filename, content);
      }
    }

    // Add individual chat metadata to this folder
    const chatMetadata = generateExportMetadata([session]);
    folder.file('export-metadata.json', JSON.stringify(chatMetadata, null, 2));
  }

  // Generate batch export metadata at root
  const metadata = generateExportMetadata(sessions);
  zip.file('export-metadata.json', JSON.stringify(metadata, null, 2));

  return await zip.generateAsync({ type: 'blob' });
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
  try {
    // Check if File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      alert('⚠️ Directory export is not supported in this browser. Please use Chrome, Edge, or Opera.');
      return;
    }

    // Ask user to select a directory
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads'
    });

    const theme = session.selectedTheme || ChatTheme.DarkDefault;
    const userName = session.userName || 'User';
    const aiName = session.aiName || 'AI';
    const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

    // Get app settings for filename casing
    const appSettings = await storageService.getSettings();

    // Generate folder name with AI name prefix: [AIName] - title (matching ArchiveHub convention)
    const sanitizedTitle = sanitizeFilename(
      session.metadata?.title || session.chatTitle,
      appSettings.fileNamingCase
    );
    const baseFilename = `[${aiName}] - ${sanitizedTitle}`;

    // Create a subdirectory for the chat export
    const chatDirHandle = await dirHandle.getDirectoryHandle(baseFilename, { create: true });

    // Generate conversation content
    let content: string;
    let extension: string;

    if (format === 'html') {
      content = generateHtml(
        session.chatData!,
        title,
        theme,
        userName,
        aiName,
        session.parserMode,
        session.metadata
      );
      extension = 'html';
    } else if (format === 'markdown') {
      content = generateMarkdown(
        session.chatData!,
        title,
        userName,
        aiName,
        session.metadata
      );
      extension = 'md';
    } else {
      content = generateJson(session.chatData!, session.metadata);
      extension = 'json';
    }

    // Write conversation file to selected directory
    const fileHandle = await chatDirHandle.getFileHandle(`${baseFilename}.${extension}`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();

    // Collect artifacts from BOTH sources
    const allArtifacts: ConversationArtifact[] = [
      // Session-level (unlinked)
      ...(session.metadata?.artifacts || []),

      // Message-level (linked)
      ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
    ];

    // Remove duplicates by ID
    const uniqueArtifacts = Array.from(
      new Map(allArtifacts.map(a => [a.id, a])).values()
    );

    // Create artifacts subdirectory and write artifacts
    if (uniqueArtifacts.length > 0) {
      const artifactsDir = await chatDirHandle.getDirectoryHandle('artifacts', { create: true });

      for (const artifact of uniqueArtifacts) {
        const artifactHandle = await artifactsDir.getFileHandle(artifact.fileName, { create: true });
        const artifactWritable = await artifactHandle.createWritable();

        const binaryData = Uint8Array.from(atob(artifact.fileData), c => c.charCodeAt(0));
        await artifactWritable.write(binaryData);
        await artifactWritable.close();
      }
    }

    alert(`✅ Exported to directory:\n- ${baseFilename}/\n  - ${baseFilename}.${extension}\n  - artifacts/ (${uniqueArtifacts.length} files)`);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // User cancelled the directory picker, do nothing.
      return;
    }
    console.error('Directory export failed:', error);
    alert('❌ Directory export failed. Check console for details.');
  }
};

/**
 * Generates HTML export for a memory
 */
export const generateMemoryHtml = (
  memory: Memory,
  theme: ChatTheme = ChatTheme.DarkDefault
): string => {
  // Use themeMap from this file scope (lines 535-649)
  // Since it's not exported, we need to ensure we can access it or duplicate necessary parts.
  // Actually, themeMap IS defined in this file (line 535).
  const themeClasses = themeMap[theme] || themeMap[ChatTheme.DarkDefault];
  const formattedDate = new Date(memory.createdAt).toLocaleString();

  return `<!DOCTYPE html>
<html lang="en" class="${themeClasses.htmlClass}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(memory.metadata.title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="${themeClasses.bodyBg} ${themeClasses.bodyText} p-8">
  <div class="max-w-4xl mx-auto ${themeClasses.containerBg} rounded-xl p-8 shadow-2xl">
    <h1 class="${themeClasses.titleText} text-3xl font-bold mb-4">
      ${escapeHtml(memory.metadata.title)}
    </h1>
    <div class="text-sm text-gray-400 mb-6">
      <p><strong>AI Model:</strong> ${escapeHtml(memory.aiModel)}</p>
      <p><strong>Created:</strong> ${formattedDate}</p>
      <p><strong>Tags:</strong> ${memory.tags.map(t => escapeHtml(t)).join(', ')}</p>
    </div>
    <div class="prose prose-invert max-w-none">
      ${convertMarkdownToHtml(memory.content, false)}
    </div>
    
    <!-- Noosphere Footer -->
    <div class="text-center text-xs ${themeClasses.bodyText} opacity-50 mt-16 pt-8 border-t border-gray-700">
      <p class="mt-8"><strong>Noosphere Reflect</strong></p>
      <p class="text-xs italic">Preserving Meaning Through Memory</p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Generates Markdown export for a memory
 */
export const generateMemoryMarkdown = (memory: Memory): string => {
  const formattedDate = new Date(memory.createdAt).toLocaleString();

  return `# ${memory.metadata.title}

**AI Model:** ${memory.aiModel}  
**Created:** ${formattedDate}  
**Tags:** ${memory.tags.join(', ')}

---

${memory.content}

---

*Exported from Noosphere Reflect Memory Archive*
`;
};

/**
 * Generates JSON export for a memory
 */
export const generateMemoryJson = (memory: Memory): string => {
  return JSON.stringify(memory, null, 2);
};

/**
 * Helper: Generate simplified export metadata for memories (no artifacts)
 */
const generateMemoryExportMetadata = (memories: Memory[]) => {
  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    type: 'memory-archive',
    count: memories.length,
    memories: memories.map(m => ({
      id: m.id,
      title: m.metadata.title,
      aiModel: m.aiModel,
      createdAt: m.createdAt,
      tags: m.tags
    }))
  };
};

/**
 * Helper: Handle filename collisions by appending incrementing counters
 */
const deduplicateFilename = (filename: string, existingFilenames: Set<string>): string => {
  if (!existingFilenames.has(filename)) {
    return filename;
  }

  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const base = parts.join('.');

  let counter = 1;
  let newFilename = ext ? `${base}_${counter}.${ext}` : `${base}_${counter}`;

  while (existingFilenames.has(newFilename)) {
    counter++;
    newFilename = ext ? `${base}_${counter}.${ext}` : `${base}_${counter}`;
  }

  return newFilename;
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
  const zip = new JSZip();
  const usedFilenames = new Set<string>();

  for (const memory of memories) {
    let content: string;
    let extension: string;

    // Generate content based on format
    if (format === 'html') {
      content = generateMemoryHtml(memory);
      extension = 'html';
    } else if (format === 'markdown') {
      content = generateMemoryMarkdown(memory);
      extension = 'md';
    } else {
      content = generateMemoryJson(memory);
      extension = 'json';
    }

    // Sanitize filename with case format
    const sanitizedTitle = sanitizeFilename(memory.metadata.title, caseFormat);
    let filename = `${sanitizedTitle}.${extension}`;

    // Handle collisions
    filename = deduplicateFilename(filename, usedFilenames);
    usedFilenames.add(filename);

    // Add file to ZIP
    zip.file(filename, content);
  }

  // Add batch export metadata at root
  const metadata = generateMemoryExportMetadata(memories);
  zip.file('export-metadata.json', JSON.stringify(metadata, null, 2));

  return await zip.generateAsync({ type: 'blob' });
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
  const files: Record<string, string> = {};
  const usedFilenames = new Set<string>();

  for (const memory of memories) {
    let content: string;
    let extension: string;

    // Generate content based on format
    if (format === 'html') {
      content = generateMemoryHtml(memory);
      extension = 'html';
    } else if (format === 'markdown') {
      content = generateMemoryMarkdown(memory);
      extension = 'md';
    } else {
      content = generateMemoryJson(memory);
      extension = 'json';
    }

    // Sanitize filename with case format
    const sanitizedTitle = sanitizeFilename(memory.metadata.title, caseFormat);
    let filename = `${sanitizedTitle}.${extension}`;

    // Handle collisions
    filename = deduplicateFilename(filename, usedFilenames);
    usedFilenames.add(filename);

    files[filename] = content;
  }

  // Add metadata
  const metadata = generateMemoryExportMetadata(memories);
  files['export-metadata.json'] = JSON.stringify(metadata, null, 2);

  return files;
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
  // Check if File System Access API is supported
  if (!('showDirectoryPicker' in window)) {
    throw new Error('Directory export is not supported in this browser. Please use Chrome, Edge, or Opera, or select ZIP export instead.');
  }

  // Ask user to select a directory
  const rootDirHandle = await (window as any).showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'downloads'
  });

  // Generate timestamp-datestamp for directory name
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2026-01-11T10-30-45
  const dirName = `Noosphere-Memories-${timestamp}`;

  // Create subdirectory
  const memoryDirHandle = await rootDirHandle.getDirectoryHandle(dirName, { create: true });

  // Generate all files
  const files = generateMemoryBatchDirectoryExport(memories, format, caseFormat);

  // Write each file
  for (const [filename, content] of Object.entries(files)) {
    const fileHandle = await memoryDirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }
};
