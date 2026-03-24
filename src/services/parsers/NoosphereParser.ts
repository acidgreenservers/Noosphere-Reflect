import { BaseParser } from './BaseParser';
import { ChatData, ChatMessage, ChatMessageType, ChatMetadata } from '../../types';
import { isJson, parseExportedJson } from './ParserUtils';

/**
 * NoosphereParser strictly handles the official Noosphere Standard format.
 * - Markdown: Headers must match ^## Prompt - [Name]
 * - JSON: Handles Noosphere Reflect official JSON exports.
 */
export class NoosphereParser implements BaseParser {
    parse(input: string): ChatData {
        // Handle JSON exports
        if (isJson(input)) {
            const parsed = JSON.parse(input);
            if (parsed.exportedBy && parsed.exportedBy.tool === 'Noosphere Reflect') {
                return parseExportedJson(parsed);
            }
            throw new Error('Not an official Noosphere JSON export. Use "3rd Party Exports" mode.');
        }

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

            const promptMatch = trimmedLine.match(/^## Prompt\s*-\s*(.*)/);
            const responseMatch = trimmedLine.match(/^## Response\s*-\s*(.*)/);

            if (promptMatch) {
                if (currentMessage) messages.push(currentMessage);
                currentMessage = { type: ChatMessageType.Prompt, content: '' };
            } else if (responseMatch) {
                if (currentMessage) messages.push(currentMessage);
                currentMessage = { type: ChatMessageType.Response, content: '' };
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
            throw new Error('No valid Noosphere Standard messages found. Use "## Prompt - [Name]" headers.');
        }

        return { messages: validMessages, metadata };
    }
}
