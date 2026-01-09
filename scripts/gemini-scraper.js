/**
 * Gemini Scraper - Minimal dual-purpose DOM extraction
 * Usage: Paste in browser console or use as extension module
 */

const GEMINI_SCRAPER = {
    platform: 'gemini',

    SELECTORS: {
        // Conversation containers
        CONVERSATION_TURN: 'div.conversation-container',

        // User messages
        USER_QUERY: '.query-text',

        // Thinking/Thought process
        THOUGHTS_CONTAINER: '.thoughts-container',
        EXPAND_BUTTON: 'button mat-icon[fonticon="expand_more"]',
        THOUGHTS_CONTENT: '[data-test-id="thoughts-content"] .markdown',

        // Model response
        RESPONSE: 'model-response .markdown, .model-response-text .markdown',

        // Code blocks
        CODE_BLOCK: 'code-block',
        CODE_LANGUAGE: '.code-block-decoration span',
        CODE_CONTENT: '[data-test-id="code-content"]',

        // Title
        TITLE: '.conversation-title',

        // Copy button
        COPY_BUTTON: '[data-test-id="copy-button"]'
    },

    /**
     * Auto-expand all collapsed thinking blocks
     * @returns {Promise<number>} Number of blocks expanded
     */
    async expandThinking() {
        const buttons = document.querySelectorAll(this.SELECTORS.EXPAND_BUTTON);
        let expanded = 0;

        buttons.forEach(icon => {
            // Icon selector finds the mat-icon, need to click parent button
            const btn = icon.closest('button');
            if (btn) {
                btn.click();
                expanded++;
            }
        });

        // Wait for DOM to update
        if (expanded > 0) {
            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`✅ Expanded ${expanded} thinking blocks`);
        return expanded;
    },

    /**
     * Get conversation title
     */
    getTitle(doc = document) {
        const el = doc.querySelector(this.SELECTORS.TITLE);
        return el?.textContent?.trim() || 'Gemini_Chat';
    },

    /**
     * Extract code block with language
     */
    extractCodeBlock(codeBlock) {
        const langEl = codeBlock.querySelector(this.SELECTORS.CODE_LANGUAGE);
        const codeEl = codeBlock.querySelector(this.SELECTORS.CODE_CONTENT);
        const lang = langEl?.textContent?.trim()?.toLowerCase() || '';
        const code = codeEl?.textContent || '';
        return { lang, code };
    },

    /**
     * Extract text content, handling code blocks
     */
    extractContent(element) {
        if (!element) return '';

        const clone = element.cloneNode(true);

        // Handle code blocks
        clone.querySelectorAll(this.SELECTORS.CODE_BLOCK).forEach(block => {
            const { lang, code } = this.extractCodeBlock(block);
            block.replaceWith(`\n\`\`\`${lang}\n${code}\n\`\`\`\n`);
        });

        // Remove buttons and SVGs
        clone.querySelectorAll('button, svg, mat-icon').forEach(el => el.remove());

        return clone.textContent?.trim() || '';
    },

    /**
     * Extract all messages from the conversation
     * @returns {Array<{type: 'prompt'|'response'|'thinking', content: string}>}
     */
    extractMessages(doc = document) {
        const messages = [];
        const turns = doc.querySelectorAll(this.SELECTORS.CONVERSATION_TURN);

        turns.forEach(turn => {
            // User query
            const userQuery = turn.querySelector(this.SELECTORS.USER_QUERY);
            if (userQuery) {
                messages.push({
                    type: 'prompt',
                    content: userQuery.textContent?.trim() || ''
                });
            }

            // Thinking content (if expanded)
            const thoughtsContent = turn.querySelector(this.SELECTORS.THOUGHTS_CONTENT);
            if (thoughtsContent) {
                const content = this.extractContent(thoughtsContent);
                if (content) {
                    messages.push({
                        type: 'thinking',
                        content: content
                    });
                }
            }

            // Model response
            const response = turn.querySelector(this.SELECTORS.RESPONSE);
            if (response) {
                messages.push({
                    type: 'response',
                    content: this.extractContent(response)
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
                md += `## ✨ Gemini\n\n${msg.content}\n\n---\n\n`;
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
                source: 'Gemini Scraper',
                date: new Date().toISOString(),
                title: title
            },
            messages: messages
        };
    },

    /**
     * Full export flow: expand -> extract -> format
     */
    async run(format = 'markdown') {
        await this.expandThinking();
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
    GEMINI_SCRAPER.run().then(result => {
        console.log('Result:', result);
        navigator.clipboard.writeText(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
        console.log('✅ Copied to clipboard!');
    });
}
