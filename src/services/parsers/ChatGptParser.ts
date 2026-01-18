import { ChatData, ChatMessageType, ChatMetadata } from '../../types';
import { BaseParser } from './BaseParser';
import { extractMarkdownFromHtml, validateMarkdownOutput } from './ParserUtils';

export class ChatGptParser implements BaseParser {
    parse(html: string): ChatData {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const messages: any[] = [];

        // Selectors from scripts/chatgpt.js and existing converterService
        const SELECTORS = {
            CONVERSATION_TURN: 'article[data-testid^="conversation-turn-"], article[data-turn-id]',
            USER_HEADING: 'h5.sr-only',
            MODEL_HEADING: 'h6.sr-only',
            THREAD_TITLE: 'main h1',
            USER_BUBBLE: '.user-message-bubble-color',
            ASSISTANT_CONTENT: '[data-message-author-role="assistant"]'
        };

        // Extract Title
        const titleEl = doc.querySelector(SELECTORS.THREAD_TITLE);
        const title = titleEl?.textContent?.trim();

        // Strategy 1: Find articles (turns)
        const turns = doc.querySelectorAll(SELECTORS.CONVERSATION_TURN);

        if (turns.length > 0) {
            turns.forEach((turn) => {
                const htmlTurn = turn as HTMLElement;
                const role = htmlTurn.getAttribute('data-turn') ||
                    (htmlTurn.querySelector(SELECTORS.USER_HEADING) ? 'user' :
                        htmlTurn.querySelector(SELECTORS.MODEL_HEADING) ? 'assistant' : null);

                if (role === 'user') {
                    const bubble = htmlTurn.querySelector(SELECTORS.USER_BUBBLE) as HTMLElement;
                    const nextAfterHeading = htmlTurn.querySelector(SELECTORS.USER_HEADING)?.nextElementSibling as HTMLElement;
                    const contentEl = bubble || nextAfterHeading || htmlTurn;

                    const rawContent = extractMarkdownFromHtml(contentEl);
                    const content = validateMarkdownOutput(rawContent);
                    if (content) {
                        messages.push({ type: ChatMessageType.Prompt, content });
                    }
                } else if (role === 'assistant') {
                    const assistantContent = htmlTurn.querySelector(SELECTORS.ASSISTANT_CONTENT) as HTMLElement;
                    const nextAfterHeading = htmlTurn.querySelector(SELECTORS.MODEL_HEADING)?.nextElementSibling as HTMLElement;
                    const contentEl = assistantContent || nextAfterHeading || htmlTurn;

                    const rawContent = extractMarkdownFromHtml(contentEl);
                    const content = validateMarkdownOutput(rawContent);
                    if (content) {
                        messages.push({ type: ChatMessageType.Response, content });
                    }
                }
            });
        } else {
            // Fallback Strategy: Look for messages directly
            const allElements = doc.querySelectorAll('*');
            const visited = new Set<Element>();

            allElements.forEach(el => {
                if (visited.has(el)) return;
                const htmlEl = el as HTMLElement;

                if (htmlEl.getAttribute('data-message-author-role') === 'user' || htmlEl.classList.contains('user-message-bubble-color')) {
                    const rawContent = extractMarkdownFromHtml(htmlEl);
                    const content = validateMarkdownOutput(rawContent);
                    if (content) {
                        messages.push({ type: ChatMessageType.Prompt, content: content.trim() });
                        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
                    }
                } else if (htmlEl.getAttribute('data-message-author-role') === 'assistant') {
                    const rawContent = extractMarkdownFromHtml(htmlEl);
                    const content = validateMarkdownOutput(rawContent);
                    if (content) {
                        messages.push({ type: ChatMessageType.Response, content: content.trim() });
                        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
                    }
                }
            });
        }

        const metadata: ChatMetadata | undefined = title ? {
            title,
            model: 'ChatGPT',
            date: new Date().toISOString(),
            tags: []
        } : undefined;

        return { messages, metadata };
    }
}
