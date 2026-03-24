/**
 * Specialized parser for Llamacoder HTML content
 * Dependencies: types.js, markdown-extractor.js (loaded by manifest)
 */

function parseLlamacoderHtml(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const messages = [];

  // Look for the main chat container
  const container = doc.querySelector('.mx-auto.flex.w-full.max-w-prose.flex-col');

  if (!container) {
    // Fallback: try to find all prose and user bubbles regardless of container
    const sections = Array.from(doc.querySelectorAll('.whitespace-pre-wrap.rounded.bg-white, .prose'));

    sections.forEach(el => {
      const isUser = el.classList.contains('whitespace-pre-wrap');
      messages.push(new ChatMessage(
        isUser ? ChatMessageType.Prompt : ChatMessageType.Response,
        isUser ? el.innerText.trim() : extractMarkdownFromHtml(el)
      ));
    });
  } else {
    // Iterate through children to preserve order
    const children = Array.from(container.children);
    for (const child of children) {
      const userBubble = child.querySelector('.whitespace-pre-wrap.rounded.bg-white');
      const aiProse = child.querySelector('.prose');

      if (userBubble) {
        messages.push(new ChatMessage(
          ChatMessageType.Prompt,
          userBubble.innerText.trim()
        ));
      } else if (aiProse || child.classList.contains('prose') || child.querySelector('[class*="prose"]')) {
        // If it's an AI turn, the entire child might contain multiple blocks (prose + badges)
        messages.push(new ChatMessage(
          ChatMessageType.Response,
          extractMarkdownFromHtml(child)
        ));
      }
    }
  }

  if (messages.length === 0) {
    throw new Error('No Llamacoder-style messages found in the provided HTML. Please ensure you pasted the full page source or at least the chat container.');
  }

  return new ChatData(messages);
}
