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
 * Converts HTML elements to markdown-like text
 * @param {HTMLElement} element - Element to extract from
 * @returns {string} Extracted markdown text
 */
function extractMarkdownFromHtml(element) {
  // Clone to avoid modifying original
  const clone = element.cloneNode(true);

  // Handle code blocks first (pre > code)
  clone.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    const lang = code?.className.match(/language-(\w+)/)?.[1] || '';
    const codeText = pre.innerText.trim();
    const mdBlock = `\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`;
    pre.replaceWith(document.createTextNode(mdBlock));
  });

  // Handle inline code
  clone.querySelectorAll('code').forEach(code => {
    if (code.parentElement?.tagName !== 'PRE') {
      const text = code.innerText.trim();
      code.replaceWith(document.createTextNode(` \`${text}\` `));
    }
  });

  // Handle bold
  clone.querySelectorAll('b, strong').forEach(el => {
    el.replaceWith(document.createTextNode(`**${el.textContent}**`));
  });

  // Handle italic
  clone.querySelectorAll('i, em').forEach(el => {
    el.replaceWith(document.createTextNode(`*${el.textContent}*`));
  });

  // Handle links
  clone.querySelectorAll('a').forEach(el => {
    const anchor = el;
    const text = anchor.innerText.trim() || anchor.href;
    if (text && anchor.href) {
      anchor.replaceWith(document.createTextNode(`[${text}](${anchor.href})`));
    }
  });

  // Clean up buttons and other UI elements
  clone.querySelectorAll('button, svg, [aria-label*="Copy"], [aria-label*="Edit"]').forEach(el => {
    if (clone.contains(el)) {
      el.remove();
    }
  });

  // Handle thought blocks (Gemini specific)
  clone.querySelectorAll('.model-thoughts, .thoughts-container').forEach(el => {
    const thoughtText = el.innerText.trim();
    if (thoughtText) {
      el.replaceWith(document.createTextNode(`\n<thought>\n${thoughtText}\n</thought>\n`));
    }
  });

  // Get final text and clean extra newlines
  return clone.innerText.replace(/\n{3,}/g, '\n\n').trim();
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
    const isAssistantResponse = htmlEl.classList.contains('response-container') ||
      htmlEl.classList.contains('message-content') ||
      htmlEl.classList.contains('structured-content-container');

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

    // Extract thought/reasoning blocks
    if (htmlEl.classList.contains('model-thoughts') || htmlEl.classList.contains('thoughts-container')) {
      const thoughtContent = extractMarkdownFromHtml(htmlEl);
      if (thoughtContent && thoughtContent.trim().length > 0) {
        const wrappedContent = `\n<thought>\n${thoughtContent.trim()}\n</thought>\n`;
        messages.push(new ChatMessage(ChatMessageType.Response, wrappedContent));
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
