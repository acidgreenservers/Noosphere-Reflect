/**
 * Claude Scraper - Minimal dual-purpose DOM extraction
 * Usage: Paste in browser console or use as extension module
 */

const CLAUDE_SCRAPER = {
    platform: 'claude',

    SELECTORS: {
        // Title
        TITLE: '[data-testid="chat-title-button"] .truncate',

        // Message containers
        MESSAGE_TURN: '[data-test-render-count]',

        // User messages
        USER_MESSAGE: '[data-testid="user-message"]',

        // Claude response content
        CLAUDE_RESPONSE: '.font-claude-response',

        // Thought process container (the expandable box)
        THOUGHT_CONTAINER: '.border-border-300.rounded-lg',
        THOUGHT_BUTTON: '.border-border-300.rounded-lg button',
        THOUGHT_CONTENT: '.border-border-300.rounded-lg .standard-markdown',

        // Main response text (outside thought container)
        RESPONSE_CONTENT: '.standard-markdown',

        // Code blocks
        CODE_BLOCK: 'pre',
        CODE_LANGUAGE: '.text-text-500.font-small',

        // Copy button
        COPY_BUTTON: '[data-testid="action-bar-copy"]'
    },

    /**
     * Auto-expand all collapsed thought process sections
     * @returns {Promise<number>} Number of sections expanded
     */
    async expandThinking() {
        const containers = document.querySelectorAll(this.SELECTORS.THOUGHT_CONTAINER);
        let expanded = 0;

        containers.forEach(container => {
            // Check if container is collapsed (has height limit or hidden content)
            const button = container.querySelector('button');
            if (button && container.querySelector('[style*="height: auto"]') === null) {
                button.click();
                expanded++;
            }
        });

        // Wait for DOM to update
        if (expanded > 0) {
            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`✅ Expanded ${expanded} thought sections`);
        return expanded;
    },

    /**
     * Get conversation title
     */
    getTitle(doc = document) {
        const el = doc.querySelector(this.SELECTORS.TITLE);
        return el?.textContent?.trim() || 'Claude_Chat';
    },

    /**
     * Extract text content from element, handling code blocks
     */
    extractContent(element) {
        if (!element) return '';

        const clone = element.cloneNode(true);

        // Handle code blocks
        clone.querySelectorAll('pre code').forEach(code => {
            const pre = code.closest('pre');
            const langEl = pre?.previousElementSibling?.querySelector('.text-text-500');
            const lang = langEl?.textContent?.trim()?.toLowerCase() || '';
            pre.replaceWith(`\n\`\`\`${lang}\n${code.textContent}\n\`\`\`\n`);
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
        const turns = doc.querySelectorAll(this.SELECTORS.MESSAGE_TURN);

        turns.forEach(turn => {
            // User message
            const userMsg = turn.querySelector(this.SELECTORS.USER_MESSAGE);
            if (userMsg) {
                messages.push({
                    type: 'prompt',
                    content: userMsg.textContent?.trim() || ''
                });
            }

            // Claude response (may contain thought process)
            const claudeResponse = turn.querySelector(this.SELECTORS.CLAUDE_RESPONSE);
            if (claudeResponse) {
                // Extract thought process if present
                const thoughtContainer = claudeResponse.querySelector(this.SELECTORS.THOUGHT_CONTAINER);
                if (thoughtContainer) {
                    const thoughtContent = thoughtContainer.querySelector(this.SELECTORS.THOUGHT_CONTENT);
                    if (thoughtContent) {
                        messages.push({
                            type: 'thinking',
                            content: this.extractContent(thoughtContent)
                        });
                    }
                }

                // Extract main response (outside thought container)
                const mainMarkdowns = claudeResponse.querySelectorAll(':scope > div > .standard-markdown');
                mainMarkdowns.forEach(md => {
                    // Skip if inside thought container
                    if (!md.closest(this.SELECTORS.THOUGHT_CONTAINER)) {
                        const content = this.extractContent(md);
                        if (content) {
                            messages.push({
                                type: 'response',
                                content: content
                            });
                        }
                    }
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
                md += `<details>\n<summary>💭 Thought Process</summary>\n\n${msg.content}\n\n</details>\n\n`;
            } else if (msg.type === 'response') {
                md += `## 🧡 Claude\n\n${msg.content}\n\n---\n\n`;
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
                source: 'Claude Scraper',
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
    CLAUDE_SCRAPER.run().then(result => {
        console.log('Result:', result);
        navigator.clipboard.writeText(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
        console.log('✅ Copied to clipboard!');
    });
}
