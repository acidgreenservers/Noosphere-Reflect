import { ChatData, ChatMessageType, ChatMetadata } from '../../types';
import { BaseParser } from './BaseParser';
import { extractMarkdownFromHtml, decodeHtmlEntities, validateMarkdownOutput } from './ParserUtils';

export class GrokParser implements BaseParser {
    parse(html: string): ChatData {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const messages: any[] = [];

        // Selectors from scripts/grok.js and MESSAGE-DETECTION-PATTERNS.md
        const SELECTORS = {
            MARKDOWN_CONTAINER: 'div.response-content-markdown',
            USER_WRAPPER: 'div[dir="auto"]'
        };

        const containers = doc.querySelectorAll(
            SELECTORS.MARKDOWN_CONTAINER + ', .grok-response, .user-message'
        );

        containers.forEach((container, index) => {
            const htmlContent = container.innerHTML;

            // Grok uses the same class for both user and AI
            // Usually user is even indices (0, 2, ...) if starting from first message
            // But we can also check for thoughts to identify response
            const hasThought = htmlContent.includes('&lt;thought&gt;') || htmlContent.includes('<thought>');
            const isUser = index % 2 === 0 && !hasThought;

            let content = '';

            // Handle thought blocks (Grok specific embedded tags)
            if (hasThought) {
                const thoughtMatch = htmlContent.match(/(?:&lt;|<)thought(?:&gt;|>)([\s\S]*?)(?:&lt;|<)\/thought(?:&gt;|>)/);
                if (thoughtMatch) {
                    const encodedThought = thoughtMatch[1].trim();
                    const thoughtContent = decodeHtmlEntities(encodedThought);
                    content += `\n---\n<thought>\n${thoughtContent}\n</thought>\n---\n\n`;

                    // Clean up the thought tags from the container to avoid double-extraction
                    container.querySelectorAll('*').forEach(el => {
                        if (el.innerHTML.includes('&lt;thought&gt;') || el.innerHTML.includes('<thought>')) {
                            el.innerHTML = el.innerHTML.replace(/(?:&lt;|<)thought(?:&gt;|>)([\s\S]*?)(?:&lt;|<)\/thought(?:&gt;|>)/, '');
                        }
                    });
                }
            }

            const markdownContent = extractMarkdownFromHtml(container as HTMLElement);
            if (markdownContent.trim()) {
                content += markdownContent;
            }

            if (content.trim()) {
                messages.push({
                    type: isUser ? ChatMessageType.Prompt : ChatMessageType.Response,
                    content: content.trim()
                });
            }
        });

        return { messages };
    }
}
