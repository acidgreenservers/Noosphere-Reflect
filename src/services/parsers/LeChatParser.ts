import { ChatData, ChatMessageType, ChatMetadata } from '../../types';
import { BaseParser } from './BaseParser';
import { extractMarkdownFromHtml, validateMarkdownOutput } from './ParserUtils';

export class LeChatParser implements BaseParser {
    parse(html: string): ChatData {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const messages: any[] = [];

        // Selectors from scripts/lechat.js and MESSAGE-DETECTION-PATTERNS.md
        const SELECTORS = {
            MESSAGE_ITEM: '.me-auto, .ms-auto, [data-message-author-role]',
            USER_ALIGNMENT: '.ms-auto',
            AI_ALIGNMENT: '.me-auto',
            REASONING_BLOCK: '[data-message-part-type="reasoning"]',
            ANSWER_BLOCK: '[data-message-part-type="answer"]',
            CONTEXT_BADGE: '.bg-state-soft.rounded-full'
        };

        // Strategy: Look for message containers (LeChat uses a flex-col list)
        // We'll iterate through all divs that look like message bubbles
        const messageContainers = Array.from(doc.querySelectorAll('div')).filter(el => {
            const cls = el.className;
            return cls.includes('ms-auto') || cls.includes('me-auto') || el.hasAttribute('data-message-author-role');
        });

        const processed = new Set<Element>();

        messageContainers.forEach(container => {
            if (processed.has(container)) return;

            const isUser = container.classList.contains('ms-auto') || container.getAttribute('data-message-author-role') === 'user';
            let content = '';

            // Extract reasoning (thought process)
            const reasoning = container.querySelector(SELECTORS.REASONING_BLOCK);
            if (reasoning) {
                const rawReasoningText = extractMarkdownFromHtml(reasoning as HTMLElement);
                const reasoningText = validateMarkdownOutput(rawReasoningText);
                if (reasoningText) {
                    content += `\n---\n<thought>\n${reasoningText}\n</thought>\n---\n\n`;
                }
            }

            // Extract answer/main content
            const answer = container.querySelector(SELECTORS.ANSWER_BLOCK) || container;
            const rawAnswerText = extractMarkdownFromHtml(answer as HTMLElement);
            const answerText = validateMarkdownOutput(rawAnswerText);
            if (answerText) {
                content += answerText;
            }

            if (content.trim()) {
                messages.push({
                    type: isUser ? ChatMessageType.Prompt : ChatMessageType.Response,
                    content: content.trim()
                });
            }

            // Mark children as processed
            container.querySelectorAll('*').forEach(child => processed.add(child));
            processed.add(container);
        });

        return { messages };
    }
}
