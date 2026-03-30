import { BaseMarkdownParser } from './BaseMarkdownParser';
import { ChatData, ChatMessage, ChatMessageType } from '../../../types';

export class GeminiMarkdownParser extends BaseMarkdownParser {
    parse(input: string): ChatData {
        const metadata = this.extractMetadata(input);

        // Always set model to Gemini for Gemini imports
        metadata.model = 'Gemini';

        // Strip 3rd party metadata
        let cleanInput = this.stripMetadata(input);

        // Convert > Thinking: blocks to <collapsible> tags
        cleanInput = this.convertThinkingBlocks(cleanInput);

        // Wrap blockquote reference blocks in collapsible
        cleanInput = this.wrapBlockquoteReferences(cleanInput);

        const messages = this.parseGeminiTurns(cleanInput);

        if (messages.length === 0) {
            throw new Error('No Gemini conversation turns detected. Ensure "## Prompt:" headers are present.');
        }

        return { messages, metadata };
    }

    /**
     * Strip 3rd party metadata from Gemini exports
     * Removes:
     * - Header block: **User:**, **Exported:**, **Link:**
     * - Footer: ---\nPowered by [Gemini Exporter]
     */
    private stripMetadata(input: string): string {
        let result = input;

        // Remove header metadata block (lines starting with **)
        result = result.replace(/^\*\*[^*]+\*\*[^\n]*\n/gm, '');

        // Remove Powered by footer
        result = result.replace(/---\s*\nPowered by \[Gemini Exporter\][^\n]*/g, '');

        // Clean up extra whitespace
        result = result.replace(/\n{3,}/g, '\n\n').trim();

        return result;
    }

    /**
     * Convert > Thinking: blockquote blocks to <collapsible> tags
     * Handles single and nested > prefixes (>, > >)
     * Handles empty > lines as blank lines
     * Adds blank line after <collapsible> for proper spacing
     */
    private convertThinkingBlocks(input: string): string {
        const lines = input.split('\n');
        const result: string[] = [];
        let inThinkingBlock = false;
        let thinkingContent: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Check if this starts a thinking block
            if (trimmed.match(/^>\s*Thinking:/i)) {
                inThinkingBlock = true;
                thinkingContent = [];
                // Remove the > Thinking: prefix and add content
                const content = trimmed.replace(/^>\s*Thinking:\s*/i, '');
                if (content) thinkingContent.push(content);
                continue;
            }

            // If we're in a thinking block, collect > lines
            if (inThinkingBlock) {
                if (trimmed.startsWith('>')) {
                    // Handle empty > lines (just > or > > with no content)
                    if (trimmed === '>' || trimmed === '> >') {
                        thinkingContent.push('');
                    } else {
                        // Remove > or > > prefix and collect content
                        // Handle both single > and nested > > prefixes
                        const content = trimmed
                            .replace(/^>\s*>\s?/, '')  // Remove > > prefix
                            .replace(/^>\s?/, '')      // Remove single > prefix
                            .trim();
                        if (content) {
                            thinkingContent.push(content);
                        } else {
                            // Empty line with just > prefix
                            thinkingContent.push('');
                        }
                    }
                } else {
                    // End of thinking block (line doesn't start with >)
                    if (thinkingContent.length > 0) {
                        result.push('<collapsible>');
                        result.push(...thinkingContent);
                        result.push('</collapsible>');
                    }
                    inThinkingBlock = false;
                    thinkingContent = [];
                    result.push(line);
                }
            } else {
                result.push(line);
            }
        }

        // Handle thinking block at end of input
        if (inThinkingBlock && thinkingContent.length > 0) {
            result.push('<collapsible>');
            result.push(...thinkingContent);
            result.push('</collapsible>');
        }

        return result.join('\n');
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
     * Gemini-specific turn parser with exchange tracking
     * Handles:
     * - ## Prompt: (user messages)
     * - ## Response: (AI responses)
     * - Exchange tracking to ensure proper alternation
     */
    private parseGeminiTurns(input: string): ChatMessage[] {
        const messages: ChatMessage[] = [];

        // Strict Gemini header pattern - only ## Prompt: or ## Response:
        const headerPattern = /^##\s+(Prompt|Response):\s*$/gm;
        const matches = Array.from(input.matchAll(headerPattern));

        if (matches.length === 0) return [];

        let expectedType: 'prompt' | 'response' = 'prompt'; // Gemini always starts with user prompt

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

            // Build final content (thinking blocks already converted to <collapsible>)
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
