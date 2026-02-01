import { ChatData, ChatMessageType, ChatMetadata } from '../../../types';
import { BaseParser } from '../BaseParser';
import { extractMarkdownFromHtml, validateMarkdownOutput } from '../ParserUtils';

export class LlamacoderParser implements BaseParser {
    parse(html: string): ChatData {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const messages: any[] = [];

        // Selectors from scripts/platforms/llamacoder.js
        const SELECTORS = {
            PROSE: '.prose',
            USER_WRAPPER: 'div.flex-col.items-end',
            AI_WRAPPER: 'div.flex-col.items-start'
        };

        // Strategy: Look for high-level flex containers that separate user/ai
        const allDivs = Array.from(doc.querySelectorAll('div.flex-col'));
        const messageContainers = allDivs.filter(div => {
            return div.classList.contains('items-end') || div.classList.contains('items-start');
        });

        messageContainers.forEach(container => {
            const isUser = container.classList.contains('items-end');
            const prose = container.querySelector(SELECTORS.PROSE);
            const contentEl = prose || container;

            const rawContent = extractMarkdownFromHtml(contentEl as HTMLElement);
            const content = validateMarkdownOutput(rawContent);
            if (content && content.trim()) {
                messages.push({
                    type: isUser ? ChatMessageType.Prompt : ChatMessageType.Response,
                    content: content.trim()
                });
            }
        });

        if (messages.length === 0) {
            // Fallback Strategy: Just find all prose blocks
            const proseBlocks = doc.querySelectorAll(SELECTORS.PROSE);
            proseBlocks.forEach((prose, index) => {
                const rawContent = extractMarkdownFromHtml(prose as HTMLElement);
                const content = validateMarkdownOutput(rawContent);
                if (content && content.trim()) {
                    // Assume alternating if no alignment found
                    messages.push({
                        type: index % 2 === 0 ? ChatMessageType.Prompt : ChatMessageType.Response,
                        content: content.trim()
                    });
                }
            });
        }

        return { messages };
    }
}
