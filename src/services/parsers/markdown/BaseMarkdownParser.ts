import { BaseParser } from '../BaseParser';
import { ChatData, ChatMessage, ChatMessageType, ChatMetadata } from '../../../types';

/**
 * BaseMarkdownParser provides core logic for parsing standard 
 * Noosphere-exporter markdown formats (## Prompt: / ## Response:).
 */
export abstract class BaseMarkdownParser implements BaseParser {
    abstract parse(input: string): ChatData;

    protected extractMetadata(input: string): ChatMetadata {
        const metadata: ChatMetadata = {
            title: 'Markdown Conversation',
            model: 'AI Assistant',
            date: new Date().toISOString(),
            tags: ['imported', '3rd-party']
        };

        const titleMatch = input.match(/^#\s+(.+)/m);
        const modelMatch = input.match(/(?:\*\*|#\s*)?Model(?:\*\*|:)\s*(.+)/i) ||
            input.match(/(?:\*\*|#\s*)?AI(?:\*\*|:)\s*(.+)/i);
        const userMatch = input.match(/(?:\*\*|#\s*)?User(?:\*\*|:)\s*(.+)/i);
        const dateMatch = input.match(/(?:\*\*|#\s*)?Date(?:\*\*|:)\s*(.+)/i) ||
            input.match(/(?:\*\*|#\s*)?Created(?:\*\*|:)\s*(.+)/i) ||
            input.match(/(?:\*\*|#\s*)?Exported(?:\*\*|:)\s*(.+)/i);
        const linkMatch = input.match(/(?:\*\*|#\s*)?Link(?:\*\*|:)\s*(.+)/i) ||
            input.match(/(?:\*\*|#\s*)?Source(?:\*\*|:)\s*(.+)/i);

        if (titleMatch) metadata.title = titleMatch[1].trim();
        if (modelMatch) metadata.model = modelMatch[1].trim();
        if (userMatch) metadata.author = userMatch[1].trim();
        if (dateMatch) metadata.date = dateMatch[1].trim();
        if (linkMatch) metadata.sourceUrl = linkMatch[1].trim();

        if (metadata.model && metadata.model !== 'AI Assistant') {
            metadata.tags?.push(metadata.model.toLowerCase());
        }

        return metadata;
    }

    protected parseStandardTurns(input: string): ChatMessage[] {
        const messages: ChatMessage[] = [];
        // Support common headers used across platforms
        const headerPattern = /##\s+(Prompt|User|Human|Question|Me|Response|AI|Assistant|Model|Answer|Gemini|Claude|GPT|Grok):/gi;
        const matches = Array.from(input.matchAll(headerPattern));

        if (matches.length === 0) return [];

        for (let i = 0; i < matches.length; i++) {
            const headerType = matches[i][1].toLowerCase();
            const contentStart = matches[i].index! + matches[i][0].length;
            const contentEnd = (i + 1 < matches.length) ? matches[i + 1].index : input.length;

            let rawContent = input.substring(contentStart, contentEnd).trim();

            // Shared Thought Detection Logic
            let thoughts: string | undefined;
            // Support both XML tags and markdown blocks
            const xmlMatch = rawContent.match(/<thoughts>([\s\S]*?)<\/thoughts>/i);
            const mdMatch = rawContent.match(/```thought\n([\s\S]*?)```/i);

            if (xmlMatch) {
                thoughts = xmlMatch[1].trim();
                rawContent = rawContent.replace(xmlMatch[0], '').trim();
            } else if (mdMatch) {
                thoughts = mdMatch[1].trim();
                rawContent = rawContent.replace(mdMatch[0], '').trim();
            }

            const isPrompt = ['prompt', 'user', 'human', 'question', 'me'].includes(headerType);

            // Standard Noosphere thought formatting for responses
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
