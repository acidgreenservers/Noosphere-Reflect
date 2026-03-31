import { BaseMarkdownParser } from './BaseMarkdownParser';
import { ChatData, ChatMessage, ChatMessageType } from '../../../types';

export class GrokMarkdownParser extends BaseMarkdownParser {
    parse(input: string): ChatData {
        const metadata = this.extractMetadata(input);

        // Always set model to Grok for Grok imports
        metadata.model = 'Grok';

        // Strip 3rd party metadata
        let cleanInput = this.stripMetadata(input);

        // Convert ```markdown blocks to <collapsible> tags
        cleanInput = this.convertMarkdownCodeBlocks(cleanInput);

        // Wrap blockquote reference blocks in collapsible
        cleanInput = this.wrapBlockquoteReferences(cleanInput);

        const messages = this.parseGrokTurns(cleanInput);

        if (messages.length === 0) {
            throw new Error('No Grok conversation turns detected. Ensure "## Prompt:" headers are present.');
        }

        return { messages, metadata };
    }

    /**
     * Strip 3rd party metadata from Grok exports
     * Removes:
     * - Header block: **User:**, **Created:**, **Updated:**, **Exported:**
     * - Footer: ---\nPowered by [Grok Exporter]
     */
    private stripMetadata(input: string): string {
        let result = input;

        // Remove header metadata block (lines starting with **)
        result = result.replace(/^\*\*[^*]+\*\*[^\n]*\n/gm, '');

        // Remove Powered by footer
        result = result.replace(/---\s*\nPowered by \[Grok Exporter\][^\n]*/g, '');

        // Clean up extra whitespace
        result = result.replace(/\n{3,}/g, '\n\n').trim();

        return result;
    }

    /**
     * Convert ```markdown code blocks to <collapsible> tags
     * Handles Grok's artifact/fork format
     * Robust detection handles format variations
     */
    private convertMarkdownCodeBlocks(input: string): string {
        // Match ```markdown blocks - robust pattern for format variations
        return input.replace(/```markdown\s*\n?([\s\S]*?)```\n?/g, (match, content) => {
            const trimmedContent = content.trim();
            if (trimmedContent.length > 0) {
                return `<collapsible>\n${trimmedContent}\n</collapsible>\n`;
            }
            return match;
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
     * Grok-specific turn parser with exchange tracking
     * Handles:
     * - ## Prompt: (user messages)
     * - ## Response: (AI responses)
     * - Exchange tracking to ensure proper alternation
     */
    private parseGrokTurns(input: string): ChatMessage[] {
        const messages: ChatMessage[] = [];

        // Strict Grok header pattern - only ## Prompt: or ## Response:
        const headerPattern = /^##\s+(Prompt|Response):\s*$/gm;
        const matches = Array.from(input.matchAll(headerPattern));

        if (matches.length === 0) return [];

        let expectedType: 'prompt' | 'response' = 'prompt'; // Grok always starts with user prompt

        for (let i = 0; i < matches.length; i++) {
            const headerType = matches[i][1].toLowerCase();
            const contentStart = matches[i].index! + matches[i][0].length;
            const contentEnd = (i + 1 < matches.length) ? matches[i + 1].index : input.length;

            let rawContent = input.substring(contentStart, contentEnd).trim();

            // Validate exchange alternation
            const isPrompt = headerType === 'prompt';
            if (isPrompt !== (expectedType === 'prompt')) {
                // Skip invalid exchange (e.g., two prompts in a row)
                continue;
            }

            // Build final content (code blocks already converted to <collapsible>)
            const finalContent = rawContent;

            messages.push({
                type: isPrompt ? ChatMessageType.Prompt : ChatMessageType.Response,
                content: finalContent
            });

            // Toggle expected type for next exchange
            expectedType = isPrompt ? 'response' : 'prompt';
        }

        return messages;
    }
}
