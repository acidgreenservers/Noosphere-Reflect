import { BaseParser } from './BaseParser';
import { ChatData, ChatMessage, ChatMessageType, ChatMetadata } from '../../types';
import { isJson } from './ParserUtils';

/**
 * ThirdPartyParser handles a wide variety of 3rd-party and legacy formats.
 * It is designed to be "best-effort" and flexible.
 */
export class ThirdPartyParser implements BaseParser {
    parse(input: string): ChatData {
        if (isJson(input)) {
            return this.parseJson(input);
        }
        return this.parseMarkdown(input);
    }

    private parseJson(input: string): ChatData {
        try {
            const parsed = JSON.parse(input);
            const messagesArray = Array.isArray(parsed) ? parsed : (parsed.messages || []);

            if (!Array.isArray(messagesArray) || messagesArray.length === 0) {
                throw new Error('Invalid JSON structure for 3rd-party export.');
            }

            const messages: ChatMessage[] = messagesArray.map((msg: any) => {
                const type = (msg.type || msg.role || '').toString().toLowerCase();
                const content = (msg.content || msg.text || msg.body || '').toString();

                let messageType = ChatMessageType.Response;
                if (['prompt', 'user', 'human', 'input'].includes(type)) {
                    messageType = ChatMessageType.Prompt;
                }

                return {
                    type: messageType,
                    content: content
                };
            }).filter(msg => msg.content !== '');

            return { messages };
        } catch (e: any) {
            throw new Error(`Failed to parse 3rd-party JSON: ${e.message}`);
        }
    }

    private parseMarkdown(input: string): ChatData {
        const lines = input.split('\n');
        const messages: ChatMessage[] = [];
        let currentMessage: ChatMessage | null = null;
        let metadata: ChatMetadata | undefined;

        let i = 0;
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            const titleMatch = firstLine.match(/^#\s+(.+)/);
            if (titleMatch) {
                metadata = {
                    title: titleMatch[1].trim(),
                    model: '',
                    date: new Date().toISOString(),
                    tags: []
                };
                i++;
            }
        }

        for (; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Flexible regex: "## Name:" or "## Name"
            // Captures names with spaces if followed by a colon, or single-word names without.
            // Priority: "## Word:" > "## Multiple Words:" > "## User"
            const headerMatch = trimmedLine.match(/^##\s+([^:\n]+):?\s*(.*)/);

            if (headerMatch) {
                const rawLabel = headerMatch[1].trim();
                const inlineContent = headerMatch[2].trim();

                if (currentMessage) messages.push(currentMessage);

                const labelLower = rawLabel.toLowerCase();
                let type = ChatMessageType.Response;

                const promptKeywords = ['prompt', 'user', 'human', 'input', 'me', 'question'];
                const responseKeywords = ['response', 'ai', 'assistant', 'model', 'bot', 'answer'];

                if (promptKeywords.some(k => labelLower.includes(k))) {
                    type = ChatMessageType.Prompt;
                } else if (responseKeywords.some(k => labelLower.includes(k))) {
                    type = ChatMessageType.Response;
                } else {
                    if (messages.length === 0) {
                        type = ChatMessageType.Prompt;
                    } else {
                        const lastType = messages[messages.length - 1].type;
                        type = lastType === ChatMessageType.Prompt ? ChatMessageType.Response : ChatMessageType.Prompt;
                    }
                }

                currentMessage = { type, content: inlineContent };
            } else {
                if (currentMessage) {
                    currentMessage.content += (currentMessage.content === '' ? '' : '\n') + line;
                }
            }
        }

        if (currentMessage) messages.push(currentMessage);

        const validMessages = messages.map(msg => ({
            ...msg,
            content: msg.content.trim()
        })).filter(msg => msg.content !== '');

        if (validMessages.length === 0) {
            throw new Error('No valid 3rd-party messages detected. Ensure messages start with "## Name:" headers.');
        }

        return { messages: validMessages, metadata };
    }
}
