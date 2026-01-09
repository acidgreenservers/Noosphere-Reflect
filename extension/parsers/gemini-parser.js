/**
 * Gemini HTML Parser for Extension
 * Extracts conversation data from Google Gemini HTML exports
 */

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
  const visited = new Set();

  // Find all elements and process them in document order
  const allElements = doc.querySelectorAll('*');

  allElements.forEach(el => {
    if (visited.has(el)) return;
    const htmlEl = el;

    // Skip navigation and UI elements
    if (htmlEl.closest('.sidebar, nav, [role="navigation"]')) {
      return;
    }

    // User message patterns
    const isUserQuery = htmlEl.classList.contains('query-text') ||
      (htmlEl.getAttribute('role') === 'heading' && htmlEl.getAttribute('aria-level') === '2');

    // Assistant message patterns
    // CRITICAL: Skip message-content that's inside thinking blocks
    // Check multiple patterns because DOMParser may not properly nest custom elements
    let isInsideThinking = false;

    // Direct ancestor check
    if (htmlEl.closest('.thoughts-container, .model-thoughts, model-thoughts')) {
      isInsideThinking = true;
    }

    // Fallback: Check if any ancestor has data-test-id="model-thoughts" attribute
    // (more specific than checking text content which could match elsewhere)
    if (!isInsideThinking) {
      let parent = htmlEl.parentElement;
      while (parent && !isInsideThinking) {
        if (parent.getAttribute && (
          parent.getAttribute('data-test-id') === 'model-thoughts' ||
          parent.classList.contains('thoughts-content')
        )) {
          isInsideThinking = true;
        }
        parent = parent.parentElement;
      }
    }

    const isAssistantResponse = !isInsideThinking && (
      htmlEl.classList.contains('response-container') ||
      htmlEl.classList.contains('message-content') ||
      htmlEl.classList.contains('structured-content-container')
    );

    // Extract user message
    if (isUserQuery) {
      const content = extractMarkdownFromHtml(htmlEl);
      if (content && content.trim().length > 0) {
        messages.push(new ChatMessage(ChatMessageType.Prompt, content.trim()));
        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
        visited.add(htmlEl);
      }
    }

    // Extract assistant message
    if (isAssistantResponse) {
      const content = extractMarkdownFromHtml(htmlEl);
      if (content && content.trim().length > 0) {
        messages.push(new ChatMessage(ChatMessageType.Response, content.trim()));
        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
        visited.add(htmlEl);
      }
    }

    // Extract thought/reasoning blocks (DESTRUCTIVE READ PATTERN)
    if (htmlEl.classList.contains('model-thoughts') || htmlEl.classList.contains('thoughts-container')) {
      // CRITICAL: Gemini has TWO elements with class "thoughts-content":
      // 1. Outer wrapper (includes "Show thinking" button)
      // 2. Inner content div with data-test-id="thoughts-content" (actual content)
      // We must target the inner one using the data-test-id attribute
      const contentEl = htmlEl.querySelector('[data-test-id="thoughts-content"]') ||
        htmlEl.querySelector('.thoughts-content[data-test-id]') ||
        htmlEl;

      const thoughtContent = extractMarkdownFromHtml(contentEl);
      if (thoughtContent && thoughtContent.trim().length > 0) {
        const wrappedContent = `\n<thought>\n${thoughtContent.trim()}\n</thought>\n`;
        messages.push(new ChatMessage(ChatMessageType.Response, wrappedContent));

        // DESTRUCTIVE READ: Remove the thinking element immediately to prevent bleed
        // into subsequent response extraction
        htmlEl.remove();

        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
        visited.add(htmlEl);
      }
    }
  });

  return new ChatData(messages);
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseGeminiHtml, extractGeminiTitle };
}
