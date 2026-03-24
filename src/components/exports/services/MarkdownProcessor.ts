import { validateLanguage, escapeHtml, sanitizeUrl } from '../../../utils/securityUtils';

/**
 * Service for handling markdown processing and conversion utilities.
 * Extracted from converterService.ts to improve modularity and maintainability.
 */
export class MarkdownProcessor {
  /**
   * Helper to apply inline markdown conversion to a given text.
   * @param text The text to apply inline formatting to.
   * @returns The HTML string with inline formatting.
   */
  static applyInlineFormatting(text: string): string {
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
  }

  /**
   * Helper for parsing a list block (supports basic nesting)
   */
  static parseListBlock(lines: string[], startIndex: number): { html: string; newIndex: number } {
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
        listHtml.push(`<li>${this.applyInlineFormatting(content)}`);
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
  }

  /**
   * Helper for parsing a table block
   */
  static parseTableBlock(lines: string[], startIndex: number): { html: string; newIndex: number } {
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
      tableHtml += `<th class="px-3 py-2 text-${alignments[idx]} text-xs font-medium text-gray-200 uppercase tracking-wider" style="${alignStyle}">${this.applyInlineFormatting(cell)}</th>`;
    });
    tableHtml += '</tr></thead>';
    tableHtml += '<tbody class="bg-gray-800 divide-y divide-gray-700">';

    for (let rowIdx = 2; rowIdx < tableLines.length; rowIdx++) {
      const rowCells = tableLines[rowIdx].split('|').slice(1, -1).map(s => s.trim());
      tableHtml += '<tr>';
      rowCells.forEach((cell, idx) => {
        const alignStyle = alignments[idx] !== 'left' ? `text-align: ${alignments[idx]};` : '';
        tableHtml += `<td class="px-3 py-2 whitespace-normal text-sm text-gray-100" style="${alignStyle}">${this.applyInlineFormatting(cell)}</td>`;
      });
      tableHtml += '</tr>';
    }

    tableHtml += '</tbody></table>';

    return { html: tableHtml, newIndex: i };
  }

  /**
   * Converts a markdown string to basic HTML.
   * Supports bold, italic, links, blockquotes, inline code, code blocks, lists (unordered/ordered, basic nesting), and tables.
   * @param markdown The markdown string to convert.
   * @param enableThoughts Whether to render collapsible thinking blocks.
   * @returns The HTML string.
   */
  static convertMarkdownToHtml(markdown: string, enableThoughts: boolean): string {
    // Pre-process: Ensure thought and collapsible tags are on their own lines for detection
    if (enableThoughts) {
      markdown = markdown
        .replace(/<thoughts>/g, '\n<thoughts>\n')
        .replace(/<\/thought>/g, '\n</thoughts>\n')
        .replace(/<collapsible>/g, '\n<collapsible>\n')
        .replace(/<\/collapsible>/g, '\n</collapsible>\n');
    }

    const lines = markdown.split('\n');
    const htmlOutput: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // 0. Collapsible blocks (four backticks, <thoughts>, or <collapsible> tags) - Highest precedence
      if (trimmedLine.startsWith('````') || trimmedLine.startsWith('<thoughts>') || trimmedLine.startsWith('<collapsible>')) {
        let blockContent = '';
        let j = i + 1;
        const isThought = trimmedLine.startsWith('<thoughts>');
        const isCollapsible = trimmedLine.startsWith('<collapsible>');

        const endMarker = isThought ? '</thoughts>' : (isCollapsible ? '</collapsible>' : '````');
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
          return `<p>${this.applyInlineFormatting(p).replace(/\n/g, '<br/>')}</p>`;
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
            return `<p>${this.applyInlineFormatting(p).replace(/\n/g, '<br/>')}</p>`;
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

        const preHtml = `<pre class="p-2 bg-gray-900 rounded-md my-2 overflow-x-auto"><code class="${languageClass}">${codeBlockContent.trim().replace(/</g, '<').replace(/>/g, '>')}</code></pre>`;

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
        const tableResult = this.parseTableBlock(lines, i);
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
        const headingContent = this.applyInlineFormatting(headingMatch[2].trim());
        htmlOutput.push(`<h${level}>${headingContent}</h${level}>`);
        i++;
        continue;
      }

      // 5. Lists (Unordered and Ordered)
      const listItemMatch = trimmedLine.match(/^(\s*)([*-+]|\d+\.)\s+(.*)/);
      if (listItemMatch) {
        const listResult = this.parseListBlock(lines, i);
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

        // Check for Thought Block pattern (Thinking: ...)
        const thinkingMatch = blockquoteContent.trim().match(/^Thinking:\s*([\s\S]*)/i);

        if (thinkingMatch) {
          // Render as Collapsible Thought Block
          const thoughtBody = thinkingMatch[1].trim(); // Content after "Thinking:"

          // Split content by paragraphs
          const thoughtParagraphs = thoughtBody.split(/\n\s*\n/).map(p => {
            return `<p>${this.applyInlineFormatting(p).replace(/\n/g, '<br/>')}</p>`;
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
        } else {
          // Standard Blockquote
          // Apply inline formatting and handle potential paragraph breaks within a blockquote
          // Split by empty lines to create paragraphs within the blockquote
          const blockquoteParagraphs = blockquoteContent.trim().split(/\n\s*\n/).map(p => {
            // Replace remaining single newlines with <br/> within each paragraph
            return `<p>${this.applyInlineFormatting(p).replace(/\n/g, '<br/>')}</p>`;
          }).join('');
          htmlOutput.push(`<blockquote class="border-l-4 border-gray-500 pl-4 italic my-2">${blockquoteParagraphs}</blockquote>`);
        }

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
        htmlOutput.push(`<p>${this.applyInlineFormatting(paragraphContent).replace(/\n/g, '<br/>')}</p>`);
        i = j;
        continue;
      } else {
        // Skip empty lines to allow block element margins to handle spacing
      }
      i++;
    }

    return htmlOutput.join('\n');
  }
}
