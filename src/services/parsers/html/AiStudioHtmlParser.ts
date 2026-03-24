import { ChatData, ChatMessageType, ChatMetadata } from '../../../types';
import { BaseParser } from '../BaseParser';
import { extractMarkdownFromHtml, validateMarkdownOutput } from '../ParserUtils';

export class AiStudioParser implements BaseParser {
    parse(html: string): ChatData {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const messages: any[] = [];

        // Selectors from MESSAGE-DETECTION-PATTERNS.md
        const SELECTORS = {
            TURN_INPUT: '.turn.input',
            TURN_OUTPUT: '.turn.output',
            CONSOLE_TURN: 'ms-console-turn',
            EXPANDABLE_THOUGHT: 'ms-expandable-turn',
            FILES_TABLE: 'ms-console-generation-table',
            MARKDOWN_NODE: 'ms-cmark-node'
        };

        // Strategy: Document-order traversal of console turns
        const turns = doc.querySelectorAll(`${SELECTORS.TURN_INPUT}, ${SELECTORS.TURN_OUTPUT}, ${SELECTORS.CONSOLE_TURN}`);

        turns.forEach((turn) => {
            const htmlTurn = turn as HTMLElement;
            const isInput = htmlTurn.classList.contains('input') ||
                htmlTurn.querySelector('.turn-header')?.textContent?.toLowerCase().includes('user');
            const isOutput = htmlTurn.classList.contains('output') ||
                htmlTurn.querySelector('.turn-header')?.textContent?.toLowerCase().includes('model');

            if (isInput) {
                // User query is often in ms-cmark-node or just plain text in turn content
                const contentEl = htmlTurn.querySelector(SELECTORS.MARKDOWN_NODE) || htmlTurn;
                const rawContent = extractMarkdownFromHtml(contentEl as HTMLElement);
                const content = validateMarkdownOutput(rawContent);
                if (content) {
                    messages.push({ type: ChatMessageType.Prompt, content: content.trim() });
                }
            } else if (isOutput) {
                let fullContent = '';

                // Extract expandable thoughts (lightbulb icon)
                const thoughts = htmlTurn.querySelectorAll(SELECTORS.EXPANDABLE_THOUGHT);
                thoughts.forEach(thought => {
                    const headerEl = thought.querySelector('.header, .turn-header, [role="heading"]');
                    const header = headerEl?.textContent?.trim() || 'Thought';
                    const content = thought.querySelector('.content, .collapsed-content');
                    if (content) {
                        const rawThoughtText = extractMarkdownFromHtml(content as HTMLElement);
                        const thoughtText = validateMarkdownOutput(rawThoughtText);
                        if (thoughtText) {
                            fullContent += `\n---\n<thoughts>\n\n> ⏱️ *${header}*\n\n${thoughtText}\n\n</thoughts>\n---\n\n`;
                        }
                    }
                    // Remove from turn content before main extraction
                    thought.remove();
                });

                // Extract generated files table
                const filesTable = htmlTurn.querySelector(SELECTORS.FILES_TABLE);
                if (filesTable) {
                    const files = Array.from(filesTable.querySelectorAll('.gt-path'))
                        .map(el => el.textContent?.trim())
                        .filter(Boolean);
                    if (files.length > 0) {
                        fullContent += `\n> 📦 **Generated Files**:\n> - ${files.join('\n> - ')}\n\n`;
                    }
                    filesTable.remove();
                }

                // Main response content
                const markdownNode = htmlTurn.querySelector(SELECTORS.MARKDOWN_NODE);
                const content = extractMarkdownFromHtml((markdownNode || htmlTurn) as HTMLElement);
                if (content) {
                    fullContent += content;
                }

                if (fullContent.trim()) {
                    messages.push({ type: ChatMessageType.Response, content: fullContent.trim() });
                }
            }
        });

        if (messages.length === 0) {
            // Fallback: try ms-chat-turn (used in some versions of AI Studio)
            const chatTurns = doc.querySelectorAll('ms-chat-turn');
            chatTurns.forEach(turn => {
                const userPrompt = turn.querySelector('.user-prompt-container');
                const modelPrompt = turn.querySelector('.model-prompt-container');
                const thoughtChunk = turn.querySelector('ms-thought-chunk');

                if (userPrompt) {
                    const content = extractMarkdownFromHtml(userPrompt as HTMLElement);
                    if (content) messages.push({ type: ChatMessageType.Prompt, content });
                }

                if (thoughtChunk) {
                    const content = extractMarkdownFromHtml(thoughtChunk as HTMLElement);
                    if (content) messages.push({ type: ChatMessageType.Response, content: `\n---\n<thoughts>\n\n${content}\n\n</thoughts>\n---\n` });
                }

                if (modelPrompt) {
                    const rawContent = extractMarkdownFromHtml(modelPrompt as HTMLElement);
                    const content = validateMarkdownOutput(rawContent);
                    if (content) {
                        // Check if last message was thought, merge if so
                        const last = messages[messages.length - 1];
                        if (last && last.type === ChatMessageType.Response && last.content.includes('<thoughts>')) {
                            last.content += `\n\n${content}`;
                        } else {
                            messages.push({ type: ChatMessageType.Response, content });
                        }
                    }
                }
            });
        }

        return { messages };
    }
}
