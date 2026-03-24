import { ChatData, ChatMessageType, ChatMetadata } from '../../../types';
import { BaseParser } from '../BaseParser';
import { extractMarkdownFromHtml, validateMarkdownOutput } from '../ParserUtils';

export class ClaudeParser implements BaseParser {
    parse(html: string): ChatData {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const messages: any[] = [];

        // Selectors from scripts/platforms/claude.js
        const SELECTORS = {
            CONVERSATION_TURN: '[data-test-render-count]',
            USER_MESSAGE: '[data-testid="user-message"]',
            CLAUDE_RESPONSE: '.font-claude-response',
            THOUGHT_CONTAINER: '.border-border-300.rounded-lg',
            THOUGHT_CONTENT: '.standard-markdown',
            CONVERSATION_TITLE: '[data-testid="chat-title-button"] .truncate'
        };

        // Extract Title if possible
        const titleEl = doc.querySelector(SELECTORS.CONVERSATION_TITLE);
        const title = titleEl?.textContent?.trim();

        // Strategy 1: Find turns via data-test-render-count
        const turns = doc.querySelectorAll(SELECTORS.CONVERSATION_TURN);

        if (turns.length > 0) {
            turns.forEach((turn) => {
                const userMsg = turn.querySelector(SELECTORS.USER_MESSAGE);
                const claudeResponse = turn.querySelector(SELECTORS.CLAUDE_RESPONSE);

                if (userMsg) {
                    const rawContent = extractMarkdownFromHtml(userMsg as HTMLElement);
                    const content = validateMarkdownOutput(rawContent);
                    if (content) {
                        messages.push({ type: ChatMessageType.Prompt, content });
                    }
                }

                if (claudeResponse) {
                    // Extract thought process if present (handled inside extractMarkdownFromHtml, 
                    // but we can also handle it explicitly here if we want more control)
                    const rawContent = extractMarkdownFromHtml(claudeResponse as HTMLElement);
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

                if (htmlEl.getAttribute('data-testid') === 'user-message' || htmlEl.classList.contains('font-user-message')) {
                    const rawContent = extractMarkdownFromHtml(htmlEl);
                    const content = validateMarkdownOutput(rawContent);
                    if (content) {
                        messages.push({ type: ChatMessageType.Prompt, content });
                        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
                    }
                } else if (htmlEl.classList.contains('font-claude-response')) {
                    // Prevent nested response capture
                    let parent = htmlEl.parentElement;
                    let isNested = false;
                    while (parent) {
                        if (parent.classList.contains('font-claude-response')) {
                            isNested = true;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                    if (isNested) return;

                    const rawContent = extractMarkdownFromHtml(htmlEl);
                    const content = validateMarkdownOutput(rawContent);
                    if (content) {
                        messages.push({ type: ChatMessageType.Response, content });
                        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
                    }
                }
            });
        }

        const metadata: ChatMetadata | undefined = title ? {
            title,
            model: 'Claude',
            date: new Date().toISOString(),
            tags: []
        } : undefined;

        return { messages, metadata };
    }
}
