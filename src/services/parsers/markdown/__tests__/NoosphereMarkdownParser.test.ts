import { describe, it, expect } from 'vitest';
import { NoosphereMarkdownParser } from '../NoosphereMarkdownParser';
import { ChatMessageType } from '../../../../types';

describe('NoosphereMarkdownParser', () => {
    const parser = new NoosphereMarkdownParser();

    it('should parse standard Noosphere Reflect markdown export', () => {
        const input = `## Title:
> Test Conversation

> **🤖 Model:** Noosphere v1
> **🌐 Date:** 2026-07-27

---

#### Prompt:

hello noosphere!

#### Response:

Hello there! How can I help you today?

#### Prompt:

Tell me a joke.

#### Response:

Why did the chicken cross the road?`;

        const result = parser.parse(input);
        
        expect(result.metadata.title).toBe('Test Conversation');
        expect(result.metadata.model).toBe('Noosphere v1');
        expect(result.messages).toHaveLength(4);
        
        expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
        expect(result.messages[0].content).toBe('hello noosphere!');
        
        expect(result.messages[1].type).toBe(ChatMessageType.Response);
        expect(result.messages[1].content).toBe('Hello there! How can I help you today?');
    });

    it('should fallback to standard turns if Noosphere specific ones fail', () => {
        // Fallback uses ## User: and ## Assistant:
        const input = `## Title:
> Fallback test

## User:
hello

## Assistant:
hi there!`;

        const result = parser.parse(input);
        
        expect(result.metadata.title).toBe('Fallback test');
        expect(result.messages).toHaveLength(2);
        expect(result.messages[0].content).toBe('hello');
        expect(result.messages[1].content).toBe('hi there!');
    });

    it('should throw an error when no headers are found', () => {
        const input = `Just a plain text document without any headers.`;
        expect(() => parser.parse(input)).toThrow('No valid Noosphere Reflect conversation turns detected.');
    });
});
