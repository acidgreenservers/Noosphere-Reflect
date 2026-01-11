/**
 * AI Studio HTML Parser for Extension
 * Extracts chat messages from Google AI Studio console HTML exports.
 *
 * Real DOM Structure (verified from aistudio.google.com/apps):
 * - Turns: .turn-container > .turn (with .input or .output classes)
 * - Headers: .turn-header containing speaker name
 * - Thinking: <ms-expandable-turn> with "Thought for X seconds"
 * - Content: <ms-console-turn> > <ms-cmark-node> > span.ng-star-inserted
 */

/**
 * Parse AI Studio HTML and extract messages
 * @param {Document} doc - Parsed HTML document
 * @returns {Array<{type: string, content: string}>} - Array of messages
 */
function parseAiStudioHtml(doc) {
  const messages = [];

  // Get the container that holds turns and dividers
  const container = doc.querySelector('.turn-container');
  if (!container) return messages;

  // Iterate over direct children to handle interleaving of turns and dividers
  // Note: we need to handle text nodes or comments if they exist, but usually Array.from(children) is safer
  const children = Array.from(container.children);

  let dividerSeenSinceLastOutput = false;

  children.forEach(node => {
    // 1. Handle Dividers
    if (node.tagName.toLowerCase() === 'mat-divider') {
      dividerSeenSinceLastOutput = true;
      return;
    }

    // 2. Handle Turn Headers (Signals new AI turn)
    // User says: "ALWAYS at the end of a user message RIGHT BEFORE the ai reply"
    if (node.classList.contains('turn-header')) {
      // Ideally we could seal the previous message here if it was open, but our logic
      // pushes messages immediately, only merging if type happens to be response again.
      // However, a header DEFINITELY means a NEW response starts content-wise.
      // So we should force a break.
      // We can simulate this by ensuring we don't merge with the previous one.
      // Setting dividerSeenSinceLastOutput = true effectively prevents merging.
      dividerSeenSinceLastOutput = true;
      return;
    }

    // Process only Turns
    if (!node.classList.contains('turn')) return;

    const isInput = node.classList.contains('input');
    const isOutput = node.classList.contains('output');

    if (isInput) {
      // User prompts are distinct - extract and push
      const contentElement = node.querySelector('ms-console-turn ms-cmark-node');
      if (contentElement) {
        const content = extractMarkdownFromHtml(contentElement);
        if (content && content.trim()) {
          messages.push({
            type: 'prompt',
            content: content.trim()
          });
        }
      }
      // Reset divider flag after input (though mostly relevant for output merging)
      dividerSeenSinceLastOutput = false;

    } else if (isOutput) {
      // Extract content from this output block
      let blockContent = '';

      // 1. Capture Thought Block
      const thinkingBlock = node.querySelector('ms-expandable-turn');
      if (thinkingBlock) {
        let thinkingContent = '';
        const expandedContent = thinkingBlock.querySelector('.expanded-thoughts');
        if (expandedContent) {
          thinkingContent = extractMarkdownFromHtml(expandedContent);
        } else {
          const collapsedContent = thinkingBlock.querySelector('.collapsed-content');
          if (collapsedContent) {
            thinkingContent = extractMarkdownFromHtml(collapsedContent);
          }
        }
        if (thinkingContent && thinkingContent.trim()) {
          blockContent += `<thought>\n${thinkingContent.trim()}\n</thought>\n\n`;
        }
      }

      // 2. Capture Main Response Content
      const contentElement = node.querySelector('ms-console-turn ms-cmark-node');
      if (contentElement) {
        const content = extractMarkdownFromHtml(contentElement);
        if (content && content.trim()) {
          blockContent += content.trim();
        }
      }

      // 3. Capture Code Canvas / File Generation Table
      const generationTables = node.querySelectorAll('ms-console-generation-table');
      if (generationTables.length > 0) {
        blockContent += '\n\n### Generated Files\n';
        generationTables.forEach(table => {
          const rows = table.querySelectorAll('ms-console-generation-table-row');
          rows.forEach(row => {
            const fileNameBtn = row.querySelector('.gt-path');
            const icon = row.querySelector('.gt-icon .material-symbols-outlined');
            if (fileNameBtn) {
              const fileName = fileNameBtn.textContent.trim();
              const status = icon ? icon.textContent.trim() : '';
              const statusEmoji = status === 'check_circle' ? '✅' : (status === 'error' ? '❌' : '📄');
              blockContent += `- ${statusEmoji} **${fileName}**\n`;
            }
          });
        });
      }

      // 4. Capture Code Canvas / File Explorer (Tree)
      const fileTrees = node.querySelectorAll('mat-tree');
      if (fileTrees.length > 0) {
        blockContent += '\n\n### File Explorer\n';
        fileTrees.forEach(tree => {
          const nodes = tree.querySelectorAll('.mat-tree-node');
          nodes.forEach(treeNode => {
            const nameEl = treeNode.querySelector('.node-name');
            if (nameEl) {
              const name = nameEl.textContent.trim();
              const level = parseInt(treeNode.getAttribute('aria-level') || '1', 10);
              const indent = '  '.repeat(level - 1);
              const isFolder = treeNode.classList.contains('folder-node');
              const icon = isFolder ? 'WD' : '📄';
              blockContent += `${indent}- ${icon} ${name}\n`;
            }
          });
        });
      }

      // 5. Capture Error Messages
      const errors = node.querySelectorAll('.error-contents');
      if (errors.length > 0) {
        errors.forEach(err => {
          const errText = err.textContent.trim();
          blockContent += `\n\n> [!WARNING] Error\n> ${errText}\n`;
        });
      }

      // 6. Capture Checkpoints/Snapshots
      if (node.querySelector('.snapshot-container')) {
        blockContent += `\n\n> [!NOTE] Checkpoint Created\n`;
      }

      // 7. Capture Suggestion Chips
      const suggestions = node.querySelectorAll('button[data-test-id="suggestion-chip"]');
      if (suggestions.length > 0) {
        blockContent += '\n\n**Suggested Replies:**\n';
        suggestions.forEach(btn => {
          blockContent += `- ${btn.textContent.trim()}\n`;
        });
      }

      // MERGE LOGIC: Check if we should merge with previous response
      if (blockContent.trim()) {
        const lastMsg = messages[messages.length - 1];

        // Merge IF: 
        // 1. Last message exists AND is 'response'
        // 2. AND we have NOT seen a divider/header since last output (which would force separation)
        if (lastMsg && lastMsg.type === 'response' && !dividerSeenSinceLastOutput) {
          lastMsg.content += '\n\n' + blockContent.trim();
        } else {
          // Otherwise start new response
          messages.push({
            type: 'response',
            content: blockContent.trim()
          });
        }
      }

      // Reset divider flag after processing an output
      dividerSeenSinceLastOutput = false;
    }
  });

  return messages;
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseAiStudioHtml };
}
