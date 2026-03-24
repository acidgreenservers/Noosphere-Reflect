import { ChatData, ChatMessageType, ChatMetadata } from '../../../types';
import { BaseParser } from '../BaseParser';
import { extractMarkdownFromHtml, isInsideThinkingBlock, validateMarkdownOutput } from '../ParserUtils';

export class GeminiParser implements BaseParser {
    parse(html: string): ChatData {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const messages: any[] = [];

        // Selectors from scripts/platforms/gemini.js and existing converterService
        const SELECTORS = {
            CHAT_CONTAINER: '[data-test-id="chat-history-container"]',
            CONVERSATION_TURN: 'div.conversation-container',
            USER_QUERY: 'user-query',
            MODEL_RESPONSE: 'model-response',
            CONVERSATION_TITLE: '.conversation-title',
            QUERY_TEXT: 'div.query-text, div[role="heading"][aria-level="2"]',
            THOUGHT_CONTAINERS: 'model-thoughts, .thoughts-container',
            MESSAGE_CONTENT: 'message-content'
        };

        // Extract Title
        const titleEl = doc.querySelector(SELECTORS.CONVERSATION_TITLE);
        const title = titleEl?.textContent?.trim();

        let currentTurn: { prompt?: string; thoughts?: string; response?: string } = {};

        const flushTurn = () => {
            if (currentTurn.prompt) {
                messages.push({ type: ChatMessageType.Prompt, content: currentTurn.prompt });
            }

            if (currentTurn.response || currentTurn.thoughts) {
                let fullContent = '';
                if (currentTurn.thoughts) {
                    let thoughtBody = currentTurn.thoughts.trim();

                    // Aggressively isolate bold headers in thoughts
                    // Wrap ALL bold blocks in newlines to ensure separation
                    thoughtBody = thoughtBody.replace(/(\*\*.*?\*\*)/g, '\n\n$1\n\n');

                    // Cleanup excessive newlines created by the above
                    thoughtBody = thoughtBody.replace(/\n{3,}/g, '\n\n');

                    // Double-Nested Formatting:
                    // > Thinking:
                    // > 
                    // > > Thinking:
                    // > > 
                    // > > [Content]
                    const nestedBody = thoughtBody.split('\n').map(line => {
                        const cleanLine = line.replace(/^(?:> ?)+/, '').trim();
                        return `> > ${cleanLine}`;
                    }).join('\n');

                    const formattedThoughts = `<thoughts>\n\n${nestedBody}\n\n</thoughts>\n\n`;
                    fullContent += formattedThoughts;
                }
                if (currentTurn.response) {
                    fullContent += currentTurn.response;
                }
                messages.push({ type: ChatMessageType.Response, content: fullContent.trim() });
            }
            currentTurn = {};
        };

        const allNodes = Array.from(doc.querySelectorAll(
            `${SELECTORS.QUERY_TEXT}, ${SELECTORS.THOUGHT_CONTAINERS}, ${SELECTORS.MESSAGE_CONTENT}`
        ));

        const processedNodes = new Set<Element>();

        allNodes.forEach((node) => {
            if (processedNodes.has(node)) return;
            const htmlEl = node as HTMLElement;

            // 1. Detect User Prompt
            if (htmlEl.classList.contains('query-text') || (htmlEl.getAttribute('role') === 'heading' && htmlEl.getAttribute('aria-level') === '2')) {
                if (currentTurn.prompt || currentTurn.response || currentTurn.thoughts) {
                    flushTurn();
                }
                const rawContent = extractMarkdownFromHtml(htmlEl);
                const content = validateMarkdownOutput(rawContent);
                if (content && content.trim()) {
                    currentTurn.prompt = content.trim();
                }
                processedNodes.add(node);
            }

            // 2. Detect Thinking
            else if (htmlEl.tagName.toLowerCase() === 'model-thoughts' || htmlEl.classList.contains('thoughts-container')) {
                const thinkingElements = htmlEl.querySelectorAll('message-content');
                if (thinkingElements.length > 0) {
                    thinkingElements.forEach((thinkingEl) => {
                        const rawContent = extractMarkdownFromHtml(thinkingEl as HTMLElement);
                        const content = validateMarkdownOutput(rawContent);
                        if (content && content.trim()) {
                            currentTurn.thoughts = (currentTurn.thoughts || '') + '\n\n' + content.trim();
                        }
                        processedNodes.add(thinkingEl);
                    });
                } else {
                    const fallbackThoughts = htmlEl.querySelector('[data-test-id="thoughts-content"] .markdown, .markdown');
                    if (fallbackThoughts) {
                        const rawContent = extractMarkdownFromHtml(fallbackThoughts as HTMLElement);
                        const content = validateMarkdownOutput(rawContent);
                        if (content && content.trim()) {
                            currentTurn.thoughts = (currentTurn.thoughts || '') + content.trim();
                        }
                    }
                }
                processedNodes.add(node);
            }

            // 3. Detect Response
            else if (htmlEl.tagName.toLowerCase() === 'message-content') {
                if (isInsideThinkingBlock(htmlEl)) {
                    processedNodes.add(node);
                    return;
                }
                const rawContent = extractMarkdownFromHtml(htmlEl);
                const content = validateMarkdownOutput(rawContent);
                if (content && content.trim()) {
                    currentTurn.response = (currentTurn.response || '') + content.trim();
                }
                processedNodes.add(node);
            }
        });

        flushTurn();

        const metadata: ChatMetadata | undefined = title ? {
            title,
            model: 'Gemini',
            date: new Date().toISOString(),
            tags: []
        } : undefined;

        return { messages, metadata };
    }
}
