import { describe, it, expect } from 'vitest';
import { ParserFactory } from '../../src/services/parsers/ParserFactory';
import { ParserMode, ChatMessageType } from '../../src/types';

describe('Markdown Parsers Suite', () => {
    const testParser = (mode: ParserMode, input: string, expectedTurns: number) => {
        const parser = ParserFactory.getParser(mode);
        if (!parser) throw new Error(`Parser not found for mode: ${mode}`);
        const result = parser.parse(input);
        expect(result.messages).toHaveLength(expectedTurns);
        return result;
    };

    it('should parse Claude Markdown', () => {
        const input = `## Prompt:\nHello Claude\n## Response:\nHello User\n---\nPowered by [Claude Exporter]`;
        const result = testParser(ParserMode.ClaudeMarkdown, input, 2);
        expect(result.metadata?.model).toBe('Claude');
    });

    it('should parse ChatGPT Markdown', () => {
        const input = `## Prompt:\nHi GPT\n## Response:\nHello!`;
        testParser(ParserMode.ChatGptMarkdown, input, 2);
    });

    it('should parse Gemini Markdown', () => {
        const input = `## Prompt:\nHi Gemini\n## Response:\nHello!`;
        testParser(ParserMode.GeminiMarkdown, input, 2);
    });

    it('should parse Leo AI Markdown', () => {
        const input = `You: hello leo!\nLeo AI: Hello!`;
        const result = testParser(ParserMode.LeoAiMarkdown, input, 2);
        expect(result.metadata?.model).toBe('Leo AI');
    });

    it('should parse Grok Markdown', () => {
        const input = `## Prompt:\nHi Grok\n## Response:\nHello!`;
        testParser(ParserMode.GrokMarkdown, input, 2);
    });

    it('should parse LeChat Markdown', () => {
        const input = `## Prompt:\nHi LeChat\n## Response:\nHello!`;
        testParser(ParserMode.LeChatMarkdown, input, 2);
    });

    it('should parse Kimi Markdown', () => {
        const input = `## Prompt:\nHi Kimi\n## Response:\nHello!`;
        testParser(ParserMode.KimiMarkdown, input, 2);
    });

    it('should parse Noosphere Native Markdown', () => {
        const input = `## Title:

> My Cool Chat

> **🤖 Model:** Claude 3.5 Sonnet
> **🌐 Date:** 5/10/2026

#### Prompt - User 👤:
Hello Noosphere!

#### Response - Model 🤖:
Hi there!

---

###### Noosphere Reflect`;
        const result = testParser(ParserMode.NoosphereMarkdown, input, 2);
        expect(result.metadata?.title).toBe('My Cool Chat');
        expect(result.metadata?.model).toBe('Claude 3.5 Sonnet');
    });
});
