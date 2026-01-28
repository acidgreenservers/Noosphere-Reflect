/**
 * Gemini HTML Parser for Extension
 * Extracts conversation data from Google Gemini HTML exports
 * Dependencies: types.js (loaded before this script)
 */

/**
 * Extracts title from Gemini page
 * @param {Document} doc - DOM document
 * @returns {string} Extracted title or 'Untitled'
 */
function extractGeminiTitle(doc) {
  // Gemini title is usually in: span.conversation-title
  const titleElement = doc.querySelector('span.conversation-title');
  if (titleElement) {
    return titleElement.textContent.trim();
  }

  // Fallback: check document title
  const docTitle = doc.querySelector('title');
  if (docTitle) {
    return docTitle.textContent.trim();
  }

  return 'Gemini Conversation';
}



/**
 * Parses Gemini HTML and extracts messages
 * @param {string} html - Raw HTML string from Gemini
 * @returns {ChatData} Extracted conversation data
 */
function parseGeminiHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const messages = [];

  // 1. GHOST-BUSTER: Clean DOM of all accessibility/hidden duplicates before processing
  const hiddenSelectors = [
    '.screen-reader-only',
    '.visually-hidden',
    '[aria-hidden="true"]',
    '.show-on-focus',
    'ms-conversation-actions',
    'ms-feedback-buttons',
    '.voice-input-container'
  ];
  doc.querySelectorAll(hiddenSelectors.join(',')).forEach(el => el.remove());

  // 2. Identify potential turn containers
  const allPotential = Array.from(doc.querySelectorAll('user-query, model-response, .query-text, .message-content, .model-response-text'));

  // 3. Filter for TOP-LEVEL turns only
  const turns = allPotential.filter(turn => {
    return !allPotential.some(other => other !== turn && other.contains(turn));
  });

  const processed = new Set();

  turns.forEach(turn => {
    if (processed.has(turn)) return;

    const tagName = turn.tagName.toLowerCase();
    const isUser = turn.classList.contains('query-text') || tagName === 'user-query' || (turn.getAttribute('role') === 'heading' && turn.getAttribute('aria-level') === '2');

    if (isUser) {
      // Prioritize the inner text container to avoid header duplicates
      const textEl = turn.querySelector('.query-text') || turn;
      let content = extractMarkdownFromHtml(textEl);
      if (content && content.trim()) {
        content = content.trim();
        const lines = content.split('\n\n');
        const uniqueLines = lines.filter((line, i) => line !== lines[i - 1]);
        messages.push(new ChatMessage(ChatMessageType.Prompt, uniqueLines.join('\n\n').trim()));
      }
      processed.add(turn);
      return;
    }

    const isResponse = tagName === 'model-response' || turn.classList.contains('message-content') || turn.classList.contains('model-response-text');

    if (isResponse) {
      const turnContainer = turn;
      let fullContent = "";

      // 1. Extract Thoughts
      const thoughts = turnContainer.querySelector('model-thoughts, .thoughts-container');
      if (thoughts) {
        // Target the actual markdown container inside thoughts if it exists
        const thoughtContentEl = thoughts.querySelector('.markdown') || thoughts.querySelector('[data-test-id="thoughts-content"]') || thoughts;
        let thoughtText = extractMarkdownFromHtml(thoughtContentEl);

        if (thoughtText && thoughtText.trim()) {
          thoughtText = thoughtText.trim()
            .replace(/^N\s+.*?\s+Custom Gem\s*/i, '')
            .replace(/(\*\*.*?\*\*)/g, '\n\n$1\n\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

          const nestedBody = thoughtText.split('\n').map(line => {
            const cleanLine = line.replace(/^(?:> ?)+/, '').trim();
            return `> > ${cleanLine}`;
          }).join('\n');

          fullContent += `\n> Thinking:\n> \n> > Thinking:\n> > \n${nestedBody}\n\n`;
        }
        processed.add(thoughts);
      }

      // 2. Extract Response (Prioritize the .markdown or .message-content blocks)
      const responseEl = turnContainer.querySelector('.markdown') ||
        turnContainer.querySelector('.message-content') ||
        turnContainer.querySelector('.model-response-text') ||
        turnContainer;

      const contentClone = responseEl.cloneNode(true);
      contentClone.querySelectorAll('model-thoughts, .thoughts-container, .screen-reader-only').forEach(t => t.remove());

      let responseText = extractMarkdownFromHtml(contentClone);
      if (responseText) {
        responseText = responseText.trim()
          .replace(/^N\s+.*?\s+Custom Gem\s*/i, '')
          .replace(/Analysis\s*Analysis/gi, 'Analysis')
          .trim();

        fullContent += responseText;
      }

      if (fullContent.trim()) {
        const finalContent = fullContent.trim();
        const lines = finalContent.split('\n\n');
        const uniqueLines = lines.filter((line, i) => line !== lines[i - 1]);
        messages.push(new ChatMessage(ChatMessageType.Response, uniqueLines.join('\n\n').trim()));
      }

      processed.add(turn);
    }
  });

  return new ChatData(messages);
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseGeminiHtml, extractGeminiTitle };
}
