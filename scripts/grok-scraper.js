/**
 * Grok Scraper - Minimal dual-purpose DOM extraction
 * Usage: Paste in browser console or use as extension module
 * 
 * Note: Grok embeds thinking content as <thought> tags directly in the response HTML
 */

const GROK_SCRAPER = {
    platform: 'grok',

    SELECTORS: {
        // Response content (both user and Grok use same class)
        RESPONSE_CONTENT: '.response-content-markdown',

        // Code blocks
        CODE_BLOCK: '[data-testid="code-block"]',
        CODE_LANGUAGE: '.font-mono.text-xs',
        CODE_CONTENT: 'pre code',

        // Tables
        TABLE: 'table',

        // Images
        IMAGE: 'img.object-cover',

        // Copy button
        COPY_BUTTON: 'button[aria-label="Copy"]',

        // Title (from page title)
        TITLE: 'title'
    },

    /**
     * Grok doesn't have collapsible thinking - thoughts are inline as <thought> tags
     * No expansion needed
     */
    async expandThinking() {
        console.log('ℹ️ Grok uses inline <thought> tags - no expansion needed');
        return 0;
    },

    /**
     * Get conversation title
     */
    getTitle(doc = document) {
        return (doc.title || 'Grok_Chat').replace(' - Grok', '').trim();
    },

    /**
     * Extract thinking content from text containing <thought> tags
     */
    extractThinking(text) {
        const thoughtMatch = text.match(/<thought>([\s\S]*?)<\/thought>/);
        if (thoughtMatch) {
            return {
                thinking: thoughtMatch[1].trim(),
                response: text.replace(/<thought>[\s\S]*?<\/thought>/, '').trim()
            };
        }
        return { thinking: null, response: text };
    },

    /**
     * Extract content from element, handling code blocks
     */
    extractContent(element) {
        if (!element) return '';

        const clone = element.cloneNode(true);

        // Handle code blocks
        clone.querySelectorAll(this.SELECTORS.CODE_BLOCK).forEach(block => {
            const langEl = block.querySelector(this.SELECTORS.CODE_LANGUAGE);
            const codeEl = block.querySelector(this.SELECTORS.CODE_CONTENT);
            const lang = langEl?.textContent?.trim()?.toLowerCase() || '';
            const code = codeEl?.textContent || '';
            block.replaceWith(`\n\`\`\`${lang}\n${code}\n\`\`\`\n`);
        });

        // Remove buttons and SVGs
        clone.querySelectorAll('button, svg').forEach(el => el.remove());

        return clone.textContent?.trim() || '';
    },

    /**
     * Extract all messages from the conversation
     * @returns {Array<{type: 'prompt'|'response'|'thinking', content: string}>}
     */
    extractMessages(doc = document) {
        const messages = [];
        const blocks = doc.querySelectorAll(this.SELECTORS.RESPONSE_CONTENT);

        blocks.forEach((block, index) => {
            const text = this.extractContent(block);
            const { thinking, response } = this.extractThinking(text);

            // Determine if user or assistant based on content
            const hasThought = thinking !== null;
            const isAssistant = hasThought || index % 2 === 1; // Alternating pattern fallback

            if (isAssistant) {
                if (thinking) {
                    messages.push({
                        type: 'thinking',
                        content: thinking
                    });
                }
                messages.push({
                    type: 'response',
                    content: response
                });
            } else {
                messages.push({
                    type: 'prompt',
                    content: text
                });
            }
        });

        return messages;
    },

    /**
     * Export as Markdown
     */
    toMarkdown(messages, title) {
        let md = `# ${title}\n\n`;
        md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

        messages.forEach(msg => {
            if (msg.type === 'prompt') {
                md += `## 👤 User\n\n${msg.content}\n\n---\n\n`;
            } else if (msg.type === 'thinking') {
                md += `<details>\n<summary>💭 Thinking Process</summary>\n\n${msg.content}\n\n</details>\n\n`;
            } else if (msg.type === 'response') {
                md += `## 🤖 Grok\n\n${msg.content}\n\n---\n\n`;
            }
        });

        return md;
    },

    /**
     * Export as JSON
     */
    toJSON(messages, title) {
        return {
            meta: {
                source: 'Grok Scraper',
                date: new Date().toISOString(),
                title: title
            },
            messages: messages
        };
    },

    /**
     * Full export flow: extract -> format
     */
    async run(format = 'markdown') {
        const title = this.getTitle();
        const messages = this.extractMessages();

        console.log(`📋 Extracted ${messages.length} messages`);

        if (format === 'json') {
            return this.toJSON(messages, title);
        }
        return this.toMarkdown(messages, title);
    }
};

// Auto-run if pasted in console
if (typeof window !== 'undefined') {
    GROK_SCRAPER.run().then(result => {
        console.log('Result:', result);
        navigator.clipboard.writeText(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
        console.log('✅ Copied to clipboard!');
    });
}
