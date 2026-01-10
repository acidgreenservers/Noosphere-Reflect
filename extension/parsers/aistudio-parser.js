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

  // Get all turns (both input and output)
  const turns = doc.querySelectorAll('.turn-container .turn');

  turns.forEach(turn => {
    const isInput = turn.classList.contains('input');
    const isOutput = turn.classList.contains('output');

    if (isInput) {
      // Extract user prompt
      const contentElement = turn.querySelector('ms-console-turn ms-cmark-node');
      if (contentElement) {
        const content = extractMarkdownFromHtml(contentElement);
        if (content && content.trim()) {
          messages.push({
            type: 'prompt',
            content: content.trim()
          });
        }
      }
    } else if (isOutput) {
      // Check for thinking block first
      const thinkingBlock = turn.querySelector('ms-expandable-turn');
      let thinkingContent = '';

      if (thinkingBlock) {
        // Extract thinking content from collapsed-content div
        const collapsedContent = thinkingBlock.querySelector('.collapsed-content');
        if (collapsedContent) {
          const thinking = extractMarkdownFromHtml(collapsedContent);
          if (thinking && thinking.trim()) {
            thinkingContent = thinking.trim();
          }
        }
      }

      // Extract main response content
      const contentElement = turn.querySelector('ms-console-turn ms-cmark-node');
      if (contentElement) {
        const content = extractMarkdownFromHtml(contentElement);
        if (content && content.trim()) {
          // Combine thinking + response
          let fullResponse = '';
          if (thinkingContent) {
            fullResponse = `<thought>\n${thinkingContent}\n</thought>\n\n`;
          }
          fullResponse += content.trim();

          messages.push({
            type: 'response',
            content: fullResponse
          });
        }
      }
    }
  });

  return messages;
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseAiStudioHtml };
}
