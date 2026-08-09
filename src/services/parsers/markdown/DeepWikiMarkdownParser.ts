import { BaseMarkdownParser } from './BaseMarkdownParser';
import { ChatData, ChatMessage, ChatMessageType, ChatMetadata } from '../../../types';

/**
 * DeepWikiMarkdownParser handles DeepWiki exported threads/files.
 */
export class DeepWikiMarkdownParser extends BaseMarkdownParser {
    parse(input: string): ChatData {
        const metadata = this.extractDeepWikiMetadata(input);
        const messages = this.parseDeepWikiTurns(input);

        if (messages.length === 0) {
            // Fallback to standard turns if specialized fails
            const fallbackMessages = this.parseStandardTurns(input);
            if (fallbackMessages.length === 0) {
                throw new Error('No valid DeepWiki conversation turns detected. Ensure "## Q1" or "### Answer" headings are present.');
            }
            return { messages: fallbackMessages, metadata };
        }

        return { messages, metadata };
    }

    private extractDeepWikiMetadata(input: string): ChatMetadata {
        const metadata: ChatMetadata = {
            title: 'DeepWiki Thread',
            model: 'DeepWiki',
            date: new Date().toISOString(),
            tags: ['deepwiki', 'devin']
        };

        // 1. Title detection from H1 header
        const h1Match = input.match(/^#\s+(.+)/m);
        if (h1Match) {
            metadata.title = h1Match[1].trim();
        }

        return metadata;
    }

    private parseDeepWikiTurns(input: string): ChatMessage[] {
        const messages: ChatMessage[] = [];

        // Match either "## Q[number]" or "### Answer"
        const headerPattern = /^(##\s+Q\d+|###\s+Answer)\b/gimu;

        const matches = Array.from(input.matchAll(headerPattern));
        if (matches.length === 0) return [];

        for (let i = 0; i < matches.length; i++) {
            const headerType = matches[i][1].toLowerCase();
            const contentStart = matches[i].index! + matches[i][0].length;
            const contentEnd = (i + 1 < matches.length)
                ? matches[i + 1].index
                : input.search(/\n---\n\n###### Noosphere Reflect/);

            let rawContent = input.substring(contentStart, contentEnd === -1 ? input.length : contentEnd).trim();

            // Detect thoughts if any (standard format)
            let thoughts: string | undefined;
            const thoughtMatch = rawContent.match(/```\nThoughts:\n([\s\S]*?)```/im) ||
                rawContent.match(/```thought\n([\s\S]*?)```/im) ||
                rawContent.match(/<thoughts>([\s\S]*?)<\/thoughts>/im);

            if (thoughtMatch) {
                thoughts = thoughtMatch[1].trim();
                rawContent = rawContent.replace(thoughtMatch[0], '').trim();
            }

            const isPrompt = headerType.startsWith('## q');

            let finalContent = rawContent;
            if (!isPrompt && thoughts) {
                finalContent = `<thoughts>\n\n${thoughts}\n\n</thoughts>\n\n${rawContent}`;
            }

            messages.push({
                type: isPrompt ? ChatMessageType.Prompt : ChatMessageType.Response,
                content: finalContent
            });
        }

        return messages;
    }
}
