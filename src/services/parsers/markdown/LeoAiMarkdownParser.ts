import { BaseMarkdownParser } from './BaseMarkdownParser';
import { ChatData, ChatMessage, ChatMessageType } from '../../../types';

export class LeoAiMarkdownParser extends BaseMarkdownParser {
    parse(input: string): ChatData {
        const metadata = this.extractMetadata(input);
        metadata.model = 'Leo AI';

        // Ensure Leo AI is in tags
        if (!metadata.tags.includes('leo ai')) {
            metadata.tags.push('leo ai');
        }

        const messages = this.parseLeoTurns(input);

        if (messages.length === 0) {
            throw new Error('No Leo AI conversation turns detected. Ensure "You: " and "Leo AI: " markers are present.');
        }

        return { messages, metadata };
    }

    /**
     * Leo-specific turn parser
     * Brave Leo copy-paste format:
     * You: [message]
     * Leo AI: [reply]
     *
     * Strategy:
     * We look for "You: " or "Leo AI: ".
     * To be robust, we accept them even without a preceding newline if necessary,
     * but we prefer them at the start of a line.
     */
    private parseLeoTurns(input: string): ChatMessage[] {
        const messages: ChatMessage[] = [];

        // Global search for markers
        const markerRegex = /(You: |Leo AI: )/g;
        const matches = Array.from(input.matchAll(markerRegex));

        if (matches.length === 0) return [];

        for (let i = 0; i < matches.length; i++) {
            const currentMatch = matches[i];
            const nextMatch = matches[i + 1];

            const marker = currentMatch[1];
            const type = marker === 'You: ' ? ChatMessageType.Prompt : ChatMessageType.Response;

            const contentStart = currentMatch.index! + marker.length;
            const contentEnd = nextMatch ? nextMatch.index : input.length;

            const content = input.substring(contentStart, contentEnd).trim();

            if (content) {
                messages.push({
                    type,
                    content
                });
            }
        }

        return messages;
    }
}
