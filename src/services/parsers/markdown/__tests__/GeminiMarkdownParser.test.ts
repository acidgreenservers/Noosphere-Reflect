import { describe, it, expect } from 'vitest';
import { GeminiMarkdownParser } from '../GeminiMarkdownParser';
import { ChatMessageType } from '../../../../types';

describe('GeminiMarkdownParser', () => {
    const parser = new GeminiMarkdownParser();

    it('should parse standard Gemini copy-paste format', () => {
        const input = `**User:** You
**Model:** Gemini 1.5 Pro
**Exported:** 2026-07-27

## User:
hello gemini!

## Gemini:
Hello there! How can I help?

## User:
Tell me a joke.

## Gemini:
Why did the chicken cross the road?`;

        const result = parser.parse(input);
        
        expect(result.metadata.model).toBe('Gemini');
        expect(result.messages).toHaveLength(4);
        
        expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
        expect(result.messages[0].content).toBe('hello gemini!');
        
        expect(result.messages[1].type).toBe(ChatMessageType.Response);
        expect(result.messages[1].content).toBe('Hello there! How can I help?');
    });

    it('should extract thinking blocks into collapsible', () => {
        const input = `## User:
think about this.

## Gemini:
> Thinking:
> Here is my thought process...
> And some more thinking...

Here is the answer.`;
        const result = parser.parse(input);
        
        expect(result.messages).toHaveLength(2);
        expect(result.messages[1].content).toContain('<collapsible title="Thought Process">');
        expect(result.messages[1].content).toContain('Here is my thought process...');
        expect(result.messages[1].content).toContain('Here is the answer.');
    });

    it('should throw an error when no headers are found', () => {
        const input = `Just a plain text document without any headers.`;
        expect(() => parser.parse(input)).toThrow('No Gemini conversation turns detected.');
    });
});
