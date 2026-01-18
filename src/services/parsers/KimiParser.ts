import { ChatData, ChatMessageType } from '../../types';
import { BaseParser } from './BaseParser';
import { extractMarkdownFromHtml, validateMarkdownOutput } from './ParserUtils';

export class KimiParser implements BaseParser {
    parse(input: string): ChatData {
        // Determine if it's HTML or plain text Share/Copy format
        if (input.trim().startsWith('<') || input.includes('class="chat-content-item')) {
            return this.parseHtml(input);
        } else {
            return this.parseShareCopy(input);
        }
    }

    private parseHtml(html: string): ChatData {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const messages: any[] = [];

        // Kimi structure: chat-content-item containers with user/assistant classes
        const segments = doc.querySelectorAll('.chat-content-item');

        segments.forEach(segment => {
            const isUser = segment.classList.contains('chat-content-item-user');
            const isAssistant = segment.classList.contains('chat-content-item-assistant');

            if (isUser) {
                const contentEl = segment.querySelector('.user-content');
                if (contentEl) {
                    const rawContent = extractMarkdownFromHtml(contentEl as HTMLElement);
                    const content = validateMarkdownOutput(rawContent);
                    if (content && content.trim()) {
                        messages.push({ type: ChatMessageType.Prompt, content: content.trim() });
                    }
                }
            } else if (isAssistant) {
                let thoughtContent = '';
                const thinkingContainer = segment.querySelector('.thinking-container .markdown');
                if (thinkingContainer) {
                    const rawThoughtText = extractMarkdownFromHtml(thinkingContainer as HTMLElement);
                    const thoughtText = validateMarkdownOutput(rawThoughtText);
                    if (thoughtText && thoughtText.trim()) {
                        thoughtContent = `\n---\n<thought>\n${thoughtText.trim()}\n</thought>\n---\n\n`;
                    }
                }

                const markdownEl = segment.querySelector('.markdown-container .markdown');
                let mainContent = '';
                if (markdownEl) {
                    const rawResponseText = extractMarkdownFromHtml(markdownEl as HTMLElement);
                    const responseText = validateMarkdownOutput(rawResponseText);
                    if (responseText && responseText.trim()) {
                        mainContent = responseText.trim();
                    }
                }

                const fullContent = (thoughtContent + mainContent).trim();
                if (fullContent) {
                    messages.push({ type: ChatMessageType.Response, content: fullContent });
                }
            }
        });

        if (messages.length === 0) {
            throw new Error('No Kimi-style messages found in the provided HTML.');
        }

        return { messages };
    }

    private parseShareCopy(input: string): ChatData {
        const messages: any[] = [];
        const lines = input.split('\n');
        let currentRole: 'user' | 'kimi' | null = null;
        let currentContent: string[] = [];

        const flushMessage = () => {
            if (currentRole && currentContent.length > 0) {
                const content = currentContent.join('\n').trim();
                if (content) {
                    // Plain text format - still run through validator for safety, 
                    // though it primarily targets HTML injection
                    const validatedContent = validateMarkdownOutput(content);
                    messages.push({
                        type: currentRole === 'user' ? ChatMessageType.Prompt : ChatMessageType.Response,
                        content: validatedContent
                    });
                }
                currentContent = [];
            }
        };

        for (const line of lines) {
            if (line.startsWith('User:')) {
                flushMessage();
                currentRole = 'user';
                const content = line.substring(5).trim();
                if (content) currentContent.push(content);
            } else if (line.startsWith('Kimi:')) {
                flushMessage();
                currentRole = 'kimi';
                const content = line.substring(5).trim();
                if (content) currentContent.push(content);
            } else if (currentRole) {
                currentContent.push(line);
            }
        }

        flushMessage();

        if (messages.length === 0) {
            throw new Error('No messages found in Kimi share copy format.');
        }

        return { messages };
    }
}
