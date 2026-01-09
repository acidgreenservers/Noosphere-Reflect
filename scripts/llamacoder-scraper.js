/**
 * Llamacoder Scraper - Minimal dual-purpose DOM extraction
 * Usage: Paste in browser console or use as extension module
 */

const LLAMACODER_SCRAPER = {
    platform: 'llamacoder',

    SELECTORS: {
        // Main chat container
        CHAT_CONTAINER: '.mx-auto.flex.w-full.max-w-prose.flex-col',

        // User message
        USER_MESSAGE: '.whitespace-pre-wrap.rounded.bg-white',

        // AI response
        AI_RESPONSE: '.prose',

        // Code blocks
        CODE_BLOCK: 'pre code',

        // Title
        TITLE: 'p.italic.text-gray-500',

        // File badges
        FILE_BADGE: 'span.text-gray-700'
    },

    /**
     * Llamacoder doesn't have expandable sections
     */
    async expandThinking() {
        console.log('ℹ️ Llamacoder has no expandable sections');
        return 0;
    },

    /**
     * Get conversation title
     */
    getTitle(doc = document) {
        const el = doc.querySelector(this.SELECTORS.TITLE);
        return el?.textContent?.trim() || 'Llamacoder_Chat';
    },

    /**
     * Extract content from element, converting to markdown
     */
    extractContent(element) {
        if (!element) return '';

        const clone = element.cloneNode(true);

        // Handle code blocks
        clone.querySelectorAll('pre code').forEach(block => {
            let lang = '';
            block.classList.forEach(cls => {
                if (cls.startsWith('language-')) lang = cls.replace('language-', '');
            });
            const codeText = block.innerText;
            block.closest('pre').replaceWith(`\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`);
        });

        // Handle inline code
        clone.querySelectorAll('code').forEach(inline => {
            const text = inline.innerText;
            if (!text.startsWith('```')) {
                inline.replaceWith(`\`${text}\``);
            }
        });

        // Handle file badges
        clone.querySelectorAll(this.SELECTORS.FILE_BADGE).forEach(span => {
            const parent = span.parentElement;
            if (parent && parent.classList.contains('text-sm')) {
                const fileName = span.innerText.trim();
                if (fileName && (fileName.includes('.') || fileName.includes('/'))) {
                    parent.replaceWith(document.createTextNode(`\n\n**📄 File: ${fileName}**\n`));
                }
            }
        });

        // Remove buttons and SVGs
        clone.querySelectorAll('button, svg').forEach(el => el.remove());

        return clone.innerText?.trim() || '';
    },

    /**
     * Extract all messages from the conversation
     * @returns {Array<{type: 'prompt'|'response', content: string}>}
     */
    extractMessages(doc = document) {
        const messages = [];
        const chatContainer = doc.querySelector(this.SELECTORS.CHAT_CONTAINER);

        if (!chatContainer) return messages;

        for (const child of chatContainer.children) {
            // User message
            const userBubble = child.querySelector(this.SELECTORS.USER_MESSAGE);
            if (userBubble) {
                messages.push({
                    type: 'prompt',
                    content: userBubble.innerText?.trim() || ''
                });
                continue;
            }

            // AI response
            const aiProse = child.querySelector(this.SELECTORS.AI_RESPONSE);
            if (aiProse || child.classList.contains('prose')) {
                messages.push({
                    type: 'response',
                    content: this.extractContent(child)
                });
            }
        }

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
            } else if (msg.type === 'response') {
                md += `## 🦙 Llamacoder\n\n${msg.content}\n\n---\n\n`;
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
                source: 'Llamacoder Scraper',
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
    LLAMACODER_SCRAPER.run().then(result => {
        console.log('Result:', result);
        navigator.clipboard.writeText(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
        console.log('✅ Copied to clipboard!');
    });
}
