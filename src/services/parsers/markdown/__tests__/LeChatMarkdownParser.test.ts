import { describe, it, expect } from 'vitest';
import { LeChatMarkdownParser } from '../LeChatMarkdownParser';
import { ChatMessageType } from '../../../../types';

describe('LeChatMarkdownParser', () => {
    const parser = new LeChatMarkdownParser();

    it('should parse standard LeChat copy-paste format', () => {
        const input = `**User:** You
**Exported:** 2026-07-27

## User:
hello lechat!

## AI:
Hello there! How can I help?

## User:
Tell me a joke.

## AI:
Why did the chicken cross the road?`;

        const result = parser.parse(input);
        
        expect(result.metadata.model).toBe('LeChat');
        expect(result.messages).toHaveLength(4);
        
        expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
        expect(result.messages[0].content).toBe('hello lechat!');
        
        expect(result.messages[1].type).toBe(ChatMessageType.Response);
        expect(result.messages[1].content).toBe('Hello there! How can I help?');
    });

    it('should throw an error when no headers are found', () => {
        const input = `Just a plain text document without any headers.`;
        expect(() => parser.parse(input)).toThrow('No LeChat conversation turns detected.');
    });
});
