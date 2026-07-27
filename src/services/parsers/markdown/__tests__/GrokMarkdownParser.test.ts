import { describe, it, expect } from 'vitest';
import { GrokMarkdownParser } from '../GrokMarkdownParser';
import { ChatMessageType } from '../../../../types';

describe('GrokMarkdownParser', () => {
    const parser = new GrokMarkdownParser();

    it('should parse standard Grok copy-paste format', () => {
        const input = `**User:** You
**Model:** Grok 1.5
**Exported:** 2026-07-27

## Prompt:
hello grok!

## Response:
Hello there! I am Grok. How can I help?

## Prompt:
Tell me a joke.

## Response:
Why did the chicken cross the road?`;

        const result = parser.parse(input);
        
        expect(result.metadata.model).toBe('Grok');
        expect(result.messages).toHaveLength(4);
        
        expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
        expect(result.messages[0].content).toBe('hello grok!');
        
        expect(result.messages[1].type).toBe(ChatMessageType.Response);
        expect(result.messages[1].content).toBe('Hello there! I am Grok. How can I help?');
    });

    it('should throw an error when no headers are found', () => {
        const input = `Just a plain text document without any headers.`;
        expect(() => parser.parse(input)).toThrow('No Grok conversation turns detected.');
    });
});
