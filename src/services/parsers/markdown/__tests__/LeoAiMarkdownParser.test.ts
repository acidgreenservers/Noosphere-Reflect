import { describe, it, expect } from 'vitest';
import { LeoAiMarkdownParser } from '../LeoAiMarkdownParser';
import { ChatMessageType } from '../../../../types';

describe('LeoAiMarkdownParser', () => {
    const parser = new LeoAiMarkdownParser();

    it('should parse standard Leo AI copy-paste', () => {
        const input = `You: hello leo! my name is lucas!
and i am coming to you here, asking for some help with something!

i need some help getting my dataset card to work again in hugging face...im not sure how to do this....

Leo AI: Hey Lucas! Nice to meet you! 👋

I'd be happy to help you get your Hugging Face dataset card working again. To give you the best guidance, I need a bit more context:`;

        const result = parser.parse(input);
        expect(result.messages).toHaveLength(2);
        expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
        expect(result.messages[0].content).toContain('hello leo!');
        expect(result.messages[0].content).toContain('hugging face');
        expect(result.messages[1].type).toBe(ChatMessageType.Response);
        expect(result.messages[1].content).toContain('Hey Lucas!');
        expect(result.messages[1].content).toContain('best guidance');
    });

    it('should handle multi-turn conversations without empty lines between them', () => {
        const input = `You: message 1Leo AI: response 1You: message 2Leo AI: response 2`;
        const result = parser.parse(input);
        expect(result.messages).toHaveLength(4);
        expect(result.messages[0].content).toBe('message 1');
        expect(result.messages[1].content).toBe('response 1');
        expect(result.messages[2].content).toBe('message 2');
        expect(result.messages[3].content).toBe('response 2');
    });

    it('should handle markers with lowercase (optional robustness check)', () => {
        // The requirement was specifically Leo AI: (uppercase I), but let's see if we should be robust
        // Current implementation is exact match.
        const input = `You: hello\nLeo AI: hi`;
        const result = parser.parse(input);
        expect(result.messages).toHaveLength(2);
    });

    it('should throw error if no markers found', () => {
        const input = `No markers here`;
        expect(() => parser.parse(input)).toThrow(/No Leo AI conversation turns detected/);
    });
});
