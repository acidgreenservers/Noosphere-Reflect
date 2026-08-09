import { describe, it, expect } from 'vitest';
import { DeepWikiMarkdownParser } from '../DeepWikiMarkdownParser';
import { ChatMessageType } from '../../../../types';

describe('DeepWikiMarkdownParser', () => {
    const parser = new DeepWikiMarkdownParser();

    it('should parse standard DeepWiki copy-paste format', () => {
        const input = `# DeepWiki Q&A with Code Context for Repository: cline/cline
## Q1
hello devin! my name is lucas! and i would like to make a system prompt for Cline as a CLINE.md file

using high level concepts, and formatted using Cline Rules formatting standards.

Would you like to help me with this?
### Answer
Yes, I'd be happy to help you, Lucas! I can draft a \`CLINE.md\` file following Cline Rules conventions.

---

## What I understand you're asking for

You want a rules file...

## Q2
OK very awesome! nice to be working with you devin!

For starters let me answer your questions.
### Answer
Here's a draft \`CLINE.md\` following the Cline Rules structure...`;

        const result = parser.parse(input);

        expect(result.metadata!.model).toBe('DeepWiki');
        expect(result.metadata!.title).toBe('DeepWiki Q&A with Code Context for Repository: cline/cline');

        expect(result.messages).toHaveLength(4);

        expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
        expect(result.messages[0].content).toContain('hello devin! my name is lucas!');

        expect(result.messages[1].type).toBe(ChatMessageType.Response);
        expect(result.messages[1].content).toContain("Yes, I'd be happy to help you");

        expect(result.messages[2].type).toBe(ChatMessageType.Prompt);
        expect(result.messages[2].content).toContain('OK very awesome!');

        expect(result.messages[3].type).toBe(ChatMessageType.Response);
        expect(result.messages[3].content).toContain("Here's a draft `CLINE.md` following the Cline Rules");
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
        expect(() => parser.parse(input)).toThrow('No valid DeepWiki conversation turns detected.');
    });
});
