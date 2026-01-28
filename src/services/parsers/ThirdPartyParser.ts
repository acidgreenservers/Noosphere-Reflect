import { BaseParser } from './BaseParser';
import { ChatData, ChatMessage, ChatMessageType, ChatMetadata } from '../../types';
import { isJson } from './ParserUtils';

/**
 * ThirdPartyParser handles a wide variety of 3rd-party and legacy formats.
 * It uses a flexible regex-based engine to detect Model, User, Title, and Date.
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
                if (['prompt', 'user', 'human', 'input', 'me', 'question'].includes(type)) {
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
        const messages: ChatMessage[] = [];
        const metadata: ChatMetadata = {
            title: 'Markdown Conversation',
            model: 'AI Assistant',
            date: new Date().toISOString(),
            tags: ['imported', '3rd-party']
        };

        // 1. Meta Detection Phase
        const modelMatch = input.match(/(?:\*\*|#\s*)?Model(?:\*\*|:)\s*(.+)/i);
        const userMatch = input.match(/(?:\*\*|#\s*)?User(?:\*\*|:)\s*(.+)/i);
        const dateMatch = input.match(/(?:\*\*|#\s*)?Date(?:\*\*|:)\s*(.+)/i) || input.match(/(?:\*\*|#\s*)?Created(?:\*\*|:)\s*(.+)/i);
        const titleMatch = input.match(/^#\s+(.+)/m);
        const linkMatch = input.match(/(?:\*\*|#\s*)?Link(?:\*\*|:)\s*(.+)/i) || input.match(/(?:\*\*|#\s*)?Source(?:\*\*|:)\s*(.+)/i);

        if (modelMatch) metadata.model = modelMatch[1].trim();
        if (userMatch) metadata.author = userMatch[1].trim();
        if (dateMatch) metadata.date = dateMatch[1].trim();
        if (titleMatch) metadata.title = titleMatch[1].trim();
        if (linkMatch) metadata.sourceUrl = linkMatch[1].trim();
        if (metadata.model) metadata.tags?.push(metadata.model.toLowerCase());

        // 2. Turn Parsing Phase (Flexible Headers)
        const headerPattern = /##\s+(Prompt|User|Human|Question|Me|Response|AI|Assistant|Model|Answer|Kimi|Claude|GPT|Gemini):/gi;
        const matches = Array.from(input.matchAll(headerPattern));

        if (matches.length > 0) {
            for (let i = 0; i < matches.length; i++) {
                const headerType = matches[i][1].toLowerCase();
                const contentStart = matches[i].index! + matches[i][0].length;
                const contentEnd = (i + 1 < matches.length) ? matches[i + 1].index : input.length;

                let rawContent = input.substring(contentStart, contentEnd).trim();
                let cleanContent = rawContent;

                // Extract thoughts/thinking blocks if present
                let thoughts: string | undefined;
                const thoughtsMatch = rawContent.match(/> Thinking:\s*\n\s*>[\s\S]*?\n(?=>|$)/i) ||
                    rawContent.match(/```\s*Thoughts:\n([\s\S]*?)```/i);

                if (thoughtsMatch) {
                    thoughts = thoughtsMatch[1] || thoughtsMatch[0].replace(/^>\s*/gm, '').replace('> Thinking:', '').trim();
                    cleanContent = rawContent.replace(thoughtsMatch[0], '').trim();
                }

                const isPrompt = ['prompt', 'user', 'human', 'question', 'me'].includes(headerType);

                // If it's a response and we have thoughts, prepend them in Noosphere standard format
                let finalContent = cleanContent;
                if (!isPrompt && thoughts) {
                    finalContent = `<thoughts>\n\n${thoughts}\n\n</thoughts>\n\n${cleanContent}`;
                }

                messages.push({
                    type: isPrompt ? ChatMessageType.Prompt : ChatMessageType.Response,
                    content: finalContent
                });
            }
        }

        // 3. Fallback: If no headers found, try to split by simple lines
        if (messages.length === 0) {
            const altPattern = /^(?:User|Assistant|Human|AI|Me):\s*(.+)/gm;
            let altMatch;
            while ((altMatch = altPattern.exec(input)) !== null) {
                const label = altMatch[0].split(':')[0].toLowerCase();
                const isPrompt = ['user', 'human', 'me'].some(k => label.includes(k));
                messages.push({
                    type: isPrompt ? ChatMessageType.Prompt : ChatMessageType.Response,
                    content: altMatch[1].trim()
                });
            }
        }

        const validMessages = messages.filter(msg => msg.content && msg.content.trim() !== '');

        console.log('[ThirdPartyParser] Valid messages:', validMessages.length);
        console.log('[ThirdPartyParser] Messages:', validMessages);

        if (validMessages.length === 0) {
            throw new Error('No valid conversation turns detected. Ensure headers like "## Prompt:" are present.');
        }

        return { messages: validMessages, metadata };
    }
}
