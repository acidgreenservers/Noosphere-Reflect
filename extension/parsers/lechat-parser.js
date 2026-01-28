/**
 * Specialized parser for LeChat (Mistral) HTML content
 * Dependencies: types.js, markdown-extractor.js (loaded by manifest)
 */

function parseLeChatHtml(input) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  const messages = [];

  // LeChat structure:
  // User messages: <div class="... ms-auto ... bg-basic-gray-alpha-4 ..."> or data-message-author-role="user"
  // AI messages: data-message-author-role="assistant"
  //   > Reasoning: data-message-part-type="reasoning"
  //   > Answer: data-message-part-type="answer"

  const visited = new Set();

  // Process all likely message containers in document order
  const allElements = doc.querySelectorAll('*');

  allElements.forEach(el => {
    if (visited.has(el)) return;

    // User Message
    // LeChat user bubbles often have 'ms-auto' for right alignment and a specific bg
    // Or explicit role attribute if available
    const isUserRole = el.getAttribute('data-message-author-role') === 'user';
    const isUserStyle = el.classList.contains('ms-auto') && el.classList.contains('bg-basic-gray-alpha-4');

    if (isUserRole || isUserStyle) {
      // Find the text content. User text is often in a span with whitespace-pre-wrap
      const contentEl = el.querySelector('.whitespace-pre-wrap') || el;
      const content = extractMarkdownFromHtml(contentEl);
      if (content) {
        messages.push(new ChatMessage(ChatMessageType.Prompt, content));
        // Mark children as visited
        el.querySelectorAll('*').forEach(child => visited.add(child));
        visited.add(el);
      }
    }

    // LeChat "Thinking Process" Time Header (e.g. "Thought for 1s")
    // We skip these for now as they're handled in reasoning blocks
    if (el.textContent?.includes('Thought') && el.textContent?.includes('for') && el.textContent?.match(/\d+s/)) {
      // Skip or handle minimally
    }

    // AI Message
    if (el.getAttribute('data-message-author-role') === 'assistant') {
      let fullContent = '';

      // AI messages can have multiple parts: reasoning and answer
      const parts = el.querySelectorAll('[data-message-part-type]');

      if (parts.length > 0) {
        parts.forEach(part => {
          const type = part.getAttribute('data-message-part-type');

          let partContent = extractMarkdownFromHtml(part);

          if (type === 'reasoning') {
            // Wrap in thought tag if strictly identified as reasoning
            // Remove any existing thought tags to avoid double wrapping
            partContent = partContent.replace(/<\/?thought>/g, '');
            partContent = `\n<thoughts>\n${partContent}\n</thoughts>\n`;
          }

          fullContent += partContent + '\n\n';
        });
      } else {
        // Fallback if no specific parts found
        fullContent = extractMarkdownFromHtml(el);
      }

      if (fullContent.trim()) {
        messages.push(new ChatMessage(ChatMessageType.Response, fullContent.trim()));
        el.querySelectorAll('*').forEach(child => visited.add(child));
        visited.add(el);
      }
    }
  });

  if (messages.length === 0) {
    throw new Error('No LeChat messages found. Please ensure you copied the full conversation HTML.');
  }

  return new ChatData(messages);
}
