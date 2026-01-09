/**
 * Le Chat Scraper - Minimal dual-purpose DOM extraction
 * Usage: Paste in browser console or use as extension module
 */

const LECHAT_SCRAPER = {
    platform: 'lechat',

    SELECTORS: {
        // Message containers
        MESSAGE_CONTAINER: '[data-message-id]',

        // User message
        USER_MESSAGE: '[data-message-author-role="user"]',
        USER_CONTENT: '.whitespace-pre-wrap',

        // Assistant message
        ASSISTANT_MESSAGE: '[data-message-author-role="assistant"]',

        // Thinking/Reasoning process
        THINKING_CONTAINER: '[data-message-part-type="reasoning"]',

        // Response content
        RESPONSE_CONTENT: '[data-message-part-type="answer"]',

        // Code blocks
        CODE_BLOCK: '[data-testid="code-block"]',
        CODE_LANGUAGE: 'span.text-xs',
        CODE_CONTENT: 'code',

        // Title
        TITLE: '.min-h-5\\.5.truncate'
    },

    /**
     * Le Chat thinking sections are typically already expanded
     * No expansion needed
     */
    async expandThinking() {
        console.log('ℹ️ Le Chat reasoning blocks are typically visible - no expansion needed');
        return 0;
    },

    /**
     * Get conversation title
     */
    getTitle(doc = document) {
        const el = doc.querySelector(this.SELECTORS.TITLE);
        return el?.textContent?.trim() || doc.title || 'LeChat_Conversation';
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
        const allMessages = doc.querySelectorAll(this.SELECTORS.MESSAGE_CONTAINER);

        allMessages.forEach(msg => {
            // User message
            if (msg.matches(this.SELECTORS.USER_MESSAGE) || msg.querySelector(this.SELECTORS.USER_MESSAGE)) {
                const content = msg.querySelector(this.SELECTORS.USER_CONTENT);
                if (content) {
                    messages.push({
                        type: 'prompt',
                        content: content.textContent?.trim() || ''
                    });
                }
            }

            // Assistant message
            if (msg.matches(this.SELECTORS.ASSISTANT_MESSAGE) || msg.querySelector(this.SELECTORS.ASSISTANT_MESSAGE)) {
                // Extract thinking process
                const thinkingEl = msg.querySelector(this.SELECTORS.THINKING_CONTAINER);
                if (thinkingEl) {
                    messages.push({
                        type: 'thinking',
                        content: this.extractContent(thinkingEl)
                    });
                }

                // Extract main response
                const responseEl = msg.querySelector(this.SELECTORS.RESPONSE_CONTENT);
                if (responseEl) {
                    messages.push({
                        type: 'response',
                        content: this.extractContent(responseEl)
                    });
                }
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
                md += `<details>\n<summary>💭 Reasoning Process</summary>\n\n${msg.content}\n\n</details>\n\n`;
            } else if (msg.type === 'response') {
                md += `## 🟠 Le Chat\n\n${msg.content}\n\n---\n\n`;
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
                source: 'Le Chat Scraper',
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
    LECHAT_SCRAPER.run().then(result => {
        console.log('Result:', result);
        navigator.clipboard.writeText(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
        console.log('✅ Copied to clipboard!');
    });
}
