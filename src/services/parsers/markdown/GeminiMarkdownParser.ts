import { BaseMarkdownParser } from './BaseMarkdownParser';
import { ChatData, ChatMessageType } from '../../../types';

export class GeminiMarkdownParser extends BaseMarkdownParser {
    parse(input: string): ChatData {
        const metadata = this.extractMetadata(input);

        // Ensure model is set if not detected
        if (metadata.model === 'AI Assistant') {
            metadata.model = 'Gemini';
        }

        const messages = this.parseStandardTurns(input);

        // Post-process Gemini messages to extract blockquote-style thoughts
        const processedMessages = messages.map(msg => {
            if (msg.type === ChatMessageType.Response) {
                // Detect "> Thinking:" blockquotes (single or double nested)
                // We look for the start mark and capture everything until the first line that doesn't start with >
                const thinkingRegex = /^>\s*Thinking:[\s\S]*?(?=\n[^> ]|$)/m;
                const match = msg.content.match(thinkingRegex);

                if (match) {
                    const matchedBlock = match[0];

                    // Extract the core content within the blockquotes
                    const cleanThoughts = matchedBlock
                        .replace(/^>\s*Thinking:\s*/i, '') // Remove label
                        .replace(/^>\s*(?:>\s*)?/gm, '')    // Remove one or two levels of >
                        .trim();

                    let remainingContent = msg.content.replace(matchedBlock, '').trim();

                    // Strip "Powered by Gemini Exporter" footer if present
                    remainingContent = remainingContent.replace(/\s*---\s*Powered by \[Gemini Exporter\]\(.*?\)\s*$/i, '');

                    if (cleanThoughts) {
                        return {
                            ...msg,
                            content: `<thoughts>\n\n${cleanThoughts}\n\n</thoughts>\n\n${remainingContent}`
                        };
                    }
                }
            }
            return msg;
        });

        if (processedMessages.length === 0) {
            throw new Error('No Gemini conversation turns detected. Ensure "## Prompt:" headers are present.');
        }

        return { messages: processedMessages, metadata };
    }
}
