/**
 * Grok HTML Parser for Extension
 * Extracts conversation data from Grok (xAI) HTML exports
 * Dependencies: types.js, markdown-extractor.js (loaded before this script)
 */

/**
 * Helper to decode HTML entities in a string.
 * Used when content is extracted from innerHTML but needs to be stored as raw text.
 */
function decodeHtmlEntities(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc.documentElement.textContent || text;
}

/**
 * Validates and sanitizes URLs to prevent javascript:, data:, and other dangerous protocols.
 * Mirrors securityUtils.ts logic but in vanilla JS.
 * 
 * @param {string} url - URL string to validate
 * @returns {string} Sanitized URL or empty string if invalid
 */
function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') {
        return '';
    }

    const trimmed = url.trim();

    // Block dangerous protocols
    const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
    if (dangerousProtocols.test(trimmed)) {
        return '';
    }

    // Allow only safe protocols (http, https, mailto)
    const safeProtocolPattern = /^(https?|mailto):/i;

    // If it has a protocol, verify it's safe
    if (trimmed.includes(':')) {
        if (!safeProtocolPattern.test(trimmed)) {
            return '';
        }
    }

    return trimmed;
}

/**
 * Helper to extract markdown table from HTML table element
 * @param {Element} table - HTML table element
 * @returns {string} Markdown table string
 */
function extractTableMarkdown(table) {
    const rows = [];

    // Extract headers
    const headers = Array.from(table.querySelectorAll('thead th'))
        .map(th => th.textContent?.trim() || '');

    if (headers.length > 0) {
        rows.push('| ' + headers.join(' | ') + ' |');
        rows.push('| ' + headers.map(() => '---').join(' | ') + ' |');
    }

    // Extract body rows
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td'))
            .map(td => td.textContent?.trim() || '');
        if (cells.length > 0) {
            rows.push('| ' + cells.join(' | ') + ' |');
        }
    });

    return rows.join('\n');
}

/**
 * Parses Grok HTML and extracts messages
 * @param {string} html - Raw HTML string from Grok
 * @returns {ChatData} Extracted conversation data
 */
function parseGrokHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const messages = [];

    // Grok uses div.response-content-markdown for both user and AI messages
    const messageContainers = doc.querySelectorAll('div.response-content-markdown');

    messageContainers.forEach((container, index) => {
        const htmlContent = container.innerHTML;

        // Check if this is a Grok response (contains thought blocks or is after user message)
        const hasThought = htmlContent.includes('&lt;thought&gt;');
        const isUser = index % 2 === 0 && !hasThought;

        let content = '';

        if (hasThought) {
            // Extract and wrap thought process
            const thoughtMatch = htmlContent.match(/&lt;thought&gt;([\s\S]*?)&lt;\/thought&gt;/);
            if (thoughtMatch) {
                // Decode entities because innerHTML gives us &lt; for <
                const encodedThought = thoughtMatch[1].trim();
                const thoughtContent = decodeHtmlEntities(encodedThought);
                content += `<thought>\n${thoughtContent}\n</thought>\n\n`;
            }
        }

        // Extract main content from <p> tags
        const paragraphs = container.querySelectorAll('p.break-words');
        paragraphs.forEach(p => {
            const text = p.textContent?.trim() || '';
            if (text) {
                content += text + '\n\n';
            }
        });

        // Extract code blocks
        const codeBlocks = container.querySelectorAll('div.not-prose pre code');
        codeBlocks.forEach(code => {
            const languageSpan = code.closest('div.not-prose')?.querySelector('span.font-mono');
            const language = languageSpan?.textContent?.trim() || 'plaintext';
            const codeContent = code.textContent || '';
            content += `\
\
```${language}\n${codeContent}\n\
\
```\
\
\
`;
        });

        // Extract tables
        const tables = container.querySelectorAll('table');
        tables.forEach(table => {
            content += extractTableMarkdown(table) + '\n\n';
        });

        // Extract images
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src') || '';
            const alt = img.getAttribute('alt') || 'Image';
            if (src) {
                content += `![${alt}](${sanitizeUrl(src)})\n\n`;
            }
        });

        // Extract canvas elements (charts)
        const canvases = container.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            const id = canvas.getAttribute('id') || 'chart';
            content += `[Chart: ${id}]\n\n`;
        });

        // Extract Knowledge Cluster Prompts (suggested follow-up questions)
        const clusterPrompts = container.querySelectorAll('button');
        const prompts = [];
        clusterPrompts.forEach(button => {
            const text = button.textContent?.trim() || '';
            // Filter out UI buttons - cluster prompts are longer
            if (text.length > 20 && !text.includes('Copy') && !text.includes('Run')) {
                prompts.push(text);
            }
        });
        if (prompts.length > 0) {
            content += '\n**Suggested follow-up questions:**\n';
            prompts.forEach(prompt => {
                content += `- ${prompt}\n`;
            });
            content += '\n';
        }

        if (content.trim()) {
            messages.push(
                new ChatMessage(
                    isUser ? ChatMessageType.Prompt : ChatMessageType.Response,
                    content.trim()
                )
            );
        }
    });

    if (messages.length === 0) {
        throw new Error('No Grok-style messages found in the provided HTML. Please ensure you pasted the full conversation HTML.');
    }

    return new ChatData(messages);
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseGrokHtml, extractTableMarkdown };
}