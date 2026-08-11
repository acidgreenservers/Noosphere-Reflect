import { describe, it, expect } from 'vitest';
import { GeminiNotebookMarkdownParser } from '../GeminiNotebookMarkdownParser';
import { ChatMessageType } from '../../../../types';

describe('GeminiNotebookMarkdownParser', () => {
    const parser = new GeminiNotebookMarkdownParser();

    it('should parse standard Gemini Notebook copy-paste format', () => {
        const input = `---
> **🤖 Model:** Google NotebookLM
>
> **🌐 Date:** 2026-08-09
>
> **🌐 Source:** [Google NotebookLM](https://notebooklm.google.com)
>
> **🏷️ Tags:** NotebookLM, AI-Chat, Noosphere
---

# My Great Notebook Chat

#### Prompt - User 👤:
What is the meaning of life?

#### Response - NotebookLM 🤖:
The meaning of life is 42.

#### Prompt - User 👤:
Is that the ultimate answer?

#### Response - NotebookLM 🤖:
Yes, but you need to understand the question first.`;

        const result = parser.parse(input);

        expect(result.metadata!.model).toBe('Gemini Notebook');
        expect(result.metadata!.title).toBe('My Great Notebook Chat');
        expect(result.metadata!.sourceUrl).toBe('https://notebooklm.google.com');
        expect(result.metadata!.tags).toContain('notebooklm');
        expect(result.metadata!.tags).toContain('ai-chat');
        expect(result.metadata!.tags).toContain('noosphere');

        expect(result.messages).toHaveLength(4);

        expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
        expect(result.messages[0].content).toBe('What is the meaning of life?');

        expect(result.messages[1].type).toBe(ChatMessageType.Response);
        expect(result.messages[1].content).toBe('The meaning of life is 42.');
    });

    it('should parse Gemini Notebook thoughts into native thought property', () => {
        const input = `---
# My Great Notebook Chat

#### Prompt - User 👤:
Explain quantum physics in one sentence.

#### Response - NotebookLM 🤖:
\`\`\`
Thoughts:
This is a complex topic. Needs to be extremely concise.
Let's use the wave-particle duality and probability concept.
\`\`\`
Quantum physics is the study of matter and energy at the most fundamental level, where things can behave like both particles and waves, and exist in multiple states at once until measured.`;

        const result = parser.parse(input);
        expect(result.messages).toHaveLength(2);
        expect(result.messages[1].type).toBe(ChatMessageType.Response);
        expect(result.messages[1].thought).toBe('This is a complex topic. Needs to be extremely concise.\nLet\'s use the wave-particle duality and probability concept.');
        expect(result.messages[1].content).toBe('Quantum physics is the study of matter and energy at the most fundamental level, where things can behave like both particles and waves, and exist in multiple states at once until measured.');
    });

    it('should fall back to standard headings if specialized headings are missing', () => {
        const input = `## User:
Hello

## Response:
World`;

        const result = parser.parse(input);
        expect(result.messages).toHaveLength(2);
        expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
        expect(result.messages[0].content).toBe('Hello');
        expect(result.messages[1].type).toBe(ChatMessageType.Response);
        expect(result.messages[1].content).toBe('World');
    });

    it('should throw an error when no headers of any kind are detected', () => {
        const input = `Just a plain text document with no conversational structure whatsoever.`;
        expect(() => parser.parse(input)).toThrow('No valid Gemini Notebook conversation turns detected.');
    });
});
