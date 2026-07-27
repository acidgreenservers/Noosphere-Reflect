import { describe, it, expect } from 'vitest';
import { ClaudeMarkdownParser } from '../ClaudeMarkdownParser';
import { ChatMessageType } from '../../../../types';

describe('ClaudeMarkdownParser', () => {
    const parser = new ClaudeMarkdownParser();

    it('should parse standard Claude copy-paste format', () => {
        const input = `**User:** You
**Model:** Claude 3.5 Sonnet
**Exported:** 2026-07-27

## User:
hello claude!

## Assistant:
Hello there! How can I help?

## User:
Tell me a joke.

## Assistant:
Why did the chicken cross the road?`;

        const result = parser.parse(input);
        
        expect(result.metadata.model).toBe('Claude');
        expect(result.messages).toHaveLength(4);
        
        expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
        expect(result.messages[0].content).toBe('hello claude!');
        
        expect(result.messages[1].type).toBe(ChatMessageType.Response);
        expect(result.messages[1].content).toBe('Hello there! How can I help?');
        
        expect(result.messages[2].type).toBe(ChatMessageType.Prompt);
        expect(result.messages[2].content).toBe('Tell me a joke.');
    });

    it('should extract thought blocks into collapsible', () => {
        const input = `## User:
think about this.

## Assistant:
\`\`\`\`plaintext
thinking...
\`\`\`\`
Here is the answer.`;
        const result = parser.parse(input);
        
        expect(result.messages).toHaveLength(2);
        expect(result.messages[1].content).toContain('<collapsible title="Thought Process">');
        expect(result.messages[1].content).toContain('thinking...');
        expect(result.messages[1].content).toContain('Here is the answer.');
    });

    it('should throw an error when no headers are found', () => {
        const input = `Just a plain text document without any headers.`;
        expect(() => parser.parse(input)).toThrow('No Claude conversation turns detected.');
    });
});
