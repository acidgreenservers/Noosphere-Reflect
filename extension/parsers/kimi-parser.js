/**
 * Kimi AI HTML Parser for Chrome Extension
 * Extracts chat messages from Kimi's DOM structure
 * Supports thought process extraction with <thought> tags
 */

/**
 * Parse Kimi HTML and extract chat messages
 * @param {string} html - The HTML content to parse
 * @returns {ChatData} Parsed chat data with messages
 */
function parseKimiHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const messages = [];

    // Kimi structure: chat-content-item containers with user/assistant classes
    const segments = doc.querySelectorAll('.chat-content-item');

    segments.forEach(segment => {
        const isUser = segment.classList.contains('chat-content-item-user');
        const isAssistant = segment.classList.contains('chat-content-item-assistant');

        if (isUser) {
            // Extract user message from .user-content
            const contentEl = segment.querySelector('.user-content');
            if (contentEl) {
                const content = extractMarkdownFromHtml(contentEl);
                if (content && content.trim().length > 0) {
                    messages.push(
                        new ChatMessage(
                            ChatMessageType.Prompt,
                            content.trim()
                        )
                    );
                }
            }
        } else if (isAssistant) {
            // Check for thought process container first
            const thinkingContainer = segment.querySelector('.thinking-container .markdown');
            let thoughtContent = '';

            if (thinkingContainer) {
                const thoughtText = extractMarkdownFromHtml(thinkingContainer);
                if (thoughtText && thoughtText.trim().length > 0) {
                    // Wrap in thought tags
                    thoughtContent = `<thought>\n${thoughtText.trim()}\n</thought>\n\n`;
                }
            }

            // Get main response content from .markdown-container .markdown
            const markdownEl = segment.querySelector('.markdown-container .markdown');
            let mainContent = '';

            if (markdownEl) {
                const responseText = extractMarkdownFromHtml(markdownEl);
                if (responseText && responseText.trim().length > 0) {
                    mainContent = responseText.trim();
                }
            }

            // Combine thought + main content
            const fullContent = thoughtContent + mainContent;

            if (fullContent.trim()) {
                messages.push(
                    new ChatMessage(
                        ChatMessageType.Response,
                        fullContent.trim()
                    )
                );
            }
        }
    });

    if (messages.length === 0) {
        throw new Error('No Kimi-style messages found in the provided HTML. Please ensure you pasted the full conversation HTML.');
    }

    return new ChatData(messages);
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseKimiHtml };
}

// Confirm parser loaded
console.log('Kimi parser loaded. parseKimiHtml available:', typeof parseKimiHtml !== 'undefined');
