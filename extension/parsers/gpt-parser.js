/**
 * ChatGPT (OpenAI) HTML Parser
 * Extracts conversation data from ChatGPT.com HTML exports
 * Dependencies: types.js, markdown-extractor.js (loaded by manifest)
 */

/**
 * Parse ChatGPT HTML and extract conversation messages
 * @param {string} html - Full page HTML from ChatGPT
 * @returns {ChatData} Structured chat data with messages
 */
function parseChatGptHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const messages = [];

  // Find all conversation turns (each turn is an article with data-turn-id)
  const turns = doc.querySelectorAll('article[data-turn-id]');

  turns.forEach((turn) => {
    const role = turn.getAttribute('data-turn');

    if (role === 'user') {
      // Extract user message from bubble
      const messageBubble = turn.querySelector('.user-message-bubble-color');
      if (messageBubble) {
        const content = extractMarkdownFromHtml(messageBubble);
        if (content) {
          messages.push(new ChatMessage(ChatMessageType.Prompt, content));
        }
      }
    } else if (role === 'assistant') {
      // Extract assistant message from markdown prose
      const messageDiv = turn.querySelector('[data-message-author-role="assistant"]');
      if (messageDiv) {
        const content = extractMarkdownFromHtml(messageDiv);
        if (content) {
          messages.push(new ChatMessage(ChatMessageType.Response, content));
        }
      }
    }
  });

  return new ChatData(messages);
}
