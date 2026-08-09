import { BaseMarkdownParser } from './BaseMarkdownParser';
import { ChatData, ChatMessage, ChatMessageType } from '../../../types';
import { extractAllThoughts } from '../ParserUtils';

export class ClaudeMarkdownParser extends BaseMarkdownParser {
    parse(input: string): ChatData {
        const metadata = this.extractMetadata(input);

        // Always set model to Claude for Claude imports
        metadata.model = 'Claude';

        // Strip 3rd party metadata
        let cleanInput = this.stripMetadata(input);

        // Convert 4+ backtick blocks to 3, wrap plaintext in collapsible
        cleanInput = this.convertFourBacktickBlocks(cleanInput);

        // Wrap blockquote reference blocks in collapsible
        cleanInput = this.wrapBlockquoteReferences(cleanInput);

        const messages = this.parseClaudeTurns(cleanInput);

        if (messages.length === 0) {
            throw new Error('No Claude conversation turns detected. Ensure "## Prompt:" headers are present.');
        }

        return { messages, metadata };
    }

    /**
     * Strip 3rd party metadata from Claude exports
     * Removes:
     * - Header block: **User:**, **Created:**, **Updated:**, **Exported:**, **Link:**
     * - Footer: ---\nPowered by [Claude Exporter]
     */
    private stripMetadata(input: string): string {
        let result = input;

        // Remove header metadata block (lines starting with **)
        result = result.replace(/^\*\*[^*]+\*\*[^\n]*\n/gm, '');

        // Remove Exported by footer
        result = result.replace(/---\s*\nExported by \[Claude Exporter\][^\n]*/g, '');

        // Clean up extra whitespace
        result = result.replace(/\n{3,}/g, '\n\n').trim();

        return result;
    }

    /**
     * Convert 4+ backtick blocks to 3 backticks
     * Plaintext blocks get wrapped in <collapsible> tags
     * Robust detection handles format variations:
     * - Content on same line as opening backticks
     * - Content on new line after opening backticks
     * - Extra spaces/tabs before content
     * - Different line endings
     */
    private convertFourBacktickBlocks(input: string): string {
        // Match blocks with 4 or more backticks - robust pattern for format variations
        return input.replace(/````([^`\n]*)\s*\n?([\s\S]*?)````\n?/g, (match, lang, content) => {
            const language = lang.trim();
            const isPlaintext = language === 'plaintext';

            if (isPlaintext) {
                // Wrap in collapsible tags with 3 backticks
                return `<collapsible title="Thought Process">\n\`\`\`plaintext\n${content}\`\`\`\n</collapsible>\n`;
            } else {
                // Just convert to 3 backticks
                return `\`\`\`${language}\n${content}\`\`\`\n`;
            }
        });
    }

    /**
     * Wrap blockquote reference blocks in collapsible tags
     * Detects blocks where all lines start with > and contain links [text](url)
     */
    private wrapBlockquoteReferences(input: string): string {
        const lines = input.split('\n');
        const result: string[] = [];
        let inBlockquote = false;
        let blockquoteLines: string[] = [];
        let hasLinks = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Check if this is a blockquote line (starts with >)
            if (trimmed.startsWith('>')) {
                if (!inBlockquote) {
                    inBlockquote = true;
                    blockquoteLines = [];
                    hasLinks = false;
                }
                // Remove > prefix and collect content
                const content = trimmed.replace(/^>\s?/, '');
                blockquoteLines.push(content);
                // Check for links
                if (content.match(/\[([^\]]+)\]\(([^)]+)\)/)) {
                    hasLinks = true;
                }
            } else {
                // End of blockquote block
                if (inBlockquote) {
                    if (hasLinks && blockquoteLines.length > 0) {
                        // Wrap in collapsible tags
                        result.push('<collapsible>');
                        result.push(...blockquoteLines);
                        result.push('</collapsible>');
                    } else {
                        // Keep as regular blockquote
                        result.push(...blockquoteLines.map(l => `> ${l}`));
                    }
                    inBlockquote = false;
                    blockquoteLines = [];
                    hasLinks = false;
                }
                result.push(line);
            }
        }

        // Handle blockquote at end of input
        if (inBlockquote) {
            if (hasLinks && blockquoteLines.length > 0) {
                result.push('<collapsible>');
                result.push(...blockquoteLines);
                result.push('</collapsible>');
            } else {
                result.push(...blockquoteLines.map(l => `> ${l}`));
            }
        }

        return result.join('\n');
    }

    /**
     * Claude-specific turn parser with exchange tracking
     * Handles:
     * - ## User: (user messages)
     * - ## Assistant: (AI responses)
     * - ````plaintext (4 backticks) for thought blocks
     * - Exchange tracking to ensure proper alternation
     * - Nested ## headers within content (not treated as boundaries)
     */
    private parseClaudeTurns(input: string): ChatMessage[] {
        const messages: ChatMessage[] = [];
        
        // Strict Claude header pattern - only ## User: or ## Assistant:
        const headerPattern = /^##\s+(User|Assistant):\s*$/gm;
        const matches = Array.from(input.matchAll(headerPattern));

        if (matches.length === 0) return [];

        let expectedType: 'user' | 'assistant' = 'user'; // Claude always starts with user prompt

        for (let i = 0; i < matches.length; i++) {
            const headerType = matches[i][1].toLowerCase();
            const contentStart = matches[i].index! + matches[i][0].length;
            const contentEnd = (i + 1 < matches.length) ? matches[i + 1].index : input.length;

            let rawContent = input.substring(contentStart, contentEnd).trim();

            // Validate exchange alternation
            const isPrompt = headerType === 'user';
            if (isPrompt !== (expectedType === 'user')) {
                // Skip invalid exchange (e.g., two users in a row)
                continue;
            }

            // Extract thought blocks using the robust helper if it's an assistant response
            let thoughts: string | undefined;
            let finalContent = rawContent;

            if (!isPrompt) {
                const extraction = extractAllThoughts(rawContent);
                thoughts = extraction.thought;
                finalContent = extraction.content;
            }

            messages.push({
                type: isPrompt ? ChatMessageType.Prompt : ChatMessageType.Response,
                content: finalContent,
                thought: thoughts
            });

            // Toggle expected type for next exchange
            expectedType = isPrompt ? 'assistant' : 'user';
        }

        return messages;
    }
}
