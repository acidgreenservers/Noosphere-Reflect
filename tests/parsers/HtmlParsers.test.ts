import { describe, it, expect } from 'vitest';
import { ParserFactory } from '../../src/services/parsers/ParserFactory';
import { ParserMode, ChatMessageType } from '../../src/types';

describe('HTML Parsers Suite', () => {
    const testParser = (mode: ParserMode, input: string, expectedTurns: number) => {
        const parser = ParserFactory.getParser(mode);
        if (!parser) throw new Error(`Parser not found for mode: ${mode}`);
        const result = parser.parse(input);
        expect(result.messages).toHaveLength(expectedTurns);
        return result;
    };

    it('should parse ChatGPT HTML', () => {
        const input = `
            <article data-turn-id="1" data-turn="user">
                <div class="whitespace-pre-wrap">Hello</div>
            </article>
            <article data-turn-id="2" data-turn="assistant">
                <div data-message-author-role="assistant" class="markdown prose">Hi</div>
            </article>
        `;
        testParser(ParserMode.ChatGptHtml, input, 2);
    });

    it('should parse Claude HTML', () => {
        const input = `
            <div data-testid="user-message">Hello</div>
            <div class="font-claude-response">Hi</div>
        `;
        testParser(ParserMode.ClaudeHtml, input, 2);
    });

    it('should parse Gemini HTML', () => {
        const input = `
            <div class="query-text">Hello</div>
            <message-content>
                <div class="markdown">Hi</div>
            </message-content>
        `;
        testParser(ParserMode.GeminiHtml, input, 2);
    });

    it('should parse AI Studio HTML with thoughts', () => {
        const input = `
            <div class="turn input">
                <div class="turn-header">User</div>
                <ms-cmark-node><p>Hello</p></ms-cmark-node>
            </div>
            <div class="turn output">
                <div class="turn-header">Model</div>
                <ms-expandable-turn class="expanded">
                    <div class="header">Thinking...</div>
                    <div class="content"><p>Thoughts</p></div>
                </ms-expandable-turn>
                <ms-cmark-node><p>Hi</p></ms-cmark-node>
            </div>
        `;
        const result = testParser(ParserMode.AiStudioHtml, input, 2);
        expect(result.messages[1].content).toContain('<thoughts>');
    });

    it('should parse LeChat HTML', () => {
        const input = `
            <div class="ms-auto">
                <div class="markdown">Hello</div>
            </div>
            <div class="me-auto">
                <div class="markdown">Hi</div>
            </div>
        `;
        testParser(ParserMode.LeChatHtml, input, 2);
    });
});
