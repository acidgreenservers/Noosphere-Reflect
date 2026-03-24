/**
 * Specialized parser for Claude HTML content
 * Dependencies: types.js, markdown-extractor.js (loaded by manifest)
 */

function parseClaudeHtml(input) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  const messages = [];

  // Claude's structure can be nested, so we look for primary message containers
  // but ensure we don't get duplicates if we traverse too deeply
  const visited = new Set();

  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    if (visited.has(el)) return;

    // Skip Sidebar / Nav / Menus / STARRED content
    if (el.closest('nav, .sidebar, [role="navigation"], .starred-list, h3[aria-hidden="true"]')) {
      visited.add(el);
      return;
    }

    // User Message
    if (el.getAttribute('data-testid') === 'user-message' || el.classList.contains('font-user-message')) {
      const content = extractMarkdownFromHtml(el);
      if (content) {
        messages.push(new ChatMessage(ChatMessageType.Prompt, content));
        // Mark children as visited to avoid double-parsing
        el.querySelectorAll('*').forEach(child => visited.add(child));
      }
    }

    // AI Message
    // Claude uses font-claude-response as the main wrapper for the whole turn content
    if (el.classList.contains('font-claude-response')) {
      // Check if it's already inside another response we processed
      let parent = el.parentElement;
      let isNested = false;
      while (parent) {
        if (parent.classList.contains('font-claude-response')) {
          isNested = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (isNested) return;

      const content = extractMarkdownFromHtml(el);
      if (content) {
        messages.push(new ChatMessage(ChatMessageType.Response, content));
        // Mark children as visited
        el.querySelectorAll('*').forEach(child => visited.add(child));
      }
    }
  });

  if (messages.length === 0) {
    // Fallback search for simpler structures if the heavy ones failed
    const prompts = doc.querySelectorAll('.font-user-message, [data-testid="user-message"]');
    const responses = doc.querySelectorAll('.font-claude-response');

    if (prompts.length > 0 || responses.length > 0) {
      // If we found them but they weren't caught in the main loop for some reason
      // this fallback might help, but the main loop above is document-order aware.
    }
  }

  return new ChatData(messages);
}
