import { describe, it, expect } from 'vitest';
import { ChatGptParser } from '../ChatGptParser';
import { ClaudeParser } from '../ClaudeParser';
import { GeminiParser } from '../GeminiParser';
import { AiStudioParser } from '../AiStudioParser';
import { GrokParser } from '../GrokParser';
import { LeChatParser } from '../LeChatParser';
import { KimiParser } from '../KimiParser';
import { LlamacoderParser } from '../LlamacoderParser';
import { ParserFactory } from '../ParserFactory';
import { ChatMessageType, ParserMode } from '../../../types';
import { extractMarkdownFromHtml, validateMarkdownOutput } from '../ParserUtils';
import { NoosphereParser } from '../NoosphereParser';
import { ThirdPartyParser } from '../ThirdPartyParser';

describe('AI Chat Parsers - Robustness Suite', () => {
  describe('ChatGptParser (Realistic)', () => {
    const parser = new ChatGptParser();

    it('should parse real-world ChatGPT console DOM', () => {
      const html = `
        <article data-turn-id="1" data-turn="user">
          <div class="user-message-bubble-color px-4 py-1.5">
            <div class="whitespace-pre-wrap">hello gpt</div>
          </div>
        </article>
        <article data-turn-id="2" data-turn="assistant">
          <div data-message-author-role="assistant" class="markdown prose">
            <p>Hello! 👋 How can I help you?</p>
          </div>
        </article>
      `;

      const result = parser.parse(html);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].content).toBe('hello gpt');
      expect(result.messages[1].content).toContain('Hello! 👋');
    });
  });

  describe('AiStudioParser (Realistic)', () => {
    const parser = new AiStudioParser();

    it('should parse real-world AI Studio turns with thoughts', () => {
      const html = `
        <div class="turn input">
          <div class="turn-header">User</div>
          <ms-console-turn><ms-cmark-node><p>I want to make an agent.</p></ms-cmark-node></ms-console-turn>
        </div>
        <div class="turn output">
          <div class="turn-header">Gemini 2.5 Pro</div>
          <ms-expandable-turn class="expanded">
            <div class="header"><div class="title">Thought for 7 seconds</div></div>
            <div class="content"><div class="expanded-thoughts"><p><strong>Initializing Project Setup</strong></p></div></div>
          </ms-expandable-turn>
          <ms-console-turn><ms-cmark-node><p>I'll help you build that.</p></ms-cmark-node></ms-console-turn>
          <ms-console-generation-table>
             <mat-row class="gt-path">metadata.json</mat-row>
             <mat-row class="gt-path">index.html</mat-row>
          </ms-console-generation-table>
        </div>
      `;

      const result = parser.parse(html);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
      expect(result.messages[1].type).toBe(ChatMessageType.Response);
      expect(result.messages[1].content).toContain('<thoughts>');
      expect(result.messages[1].content).toContain('Initializing Project Setup');
      expect(result.messages[1].content).toContain('📦 **Generated Files**');
      expect(result.messages[1].content).toContain('metadata.json');
    });
  });

  describe('KimiParser', () => {
    const parser = new KimiParser();
    it('should parse Kimi HTML', () => {
      const html = `
         <div class="chat-content-item chat-content-item-user">
           <div class="user-content">Hello Kimi</div>
         </div>
         <div class="chat-content-item chat-content-item-assistant">
           <div class="thinking-container"><div class="markdown">I am searching...</div></div>
           <div class="markdown-container"><div class="markdown">Hi! I am Kimi.</div></div>
         </div>
       `;
      const result = parser.parse(html);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[1].content).toContain('<thoughts>');
      expect(result.messages[1].content).toContain('Kimi');
    });
  });

  describe('LlamacoderParser', () => {
    const parser = new LlamacoderParser();
    it('should parse Llamacoder alternating prose', () => {
      const html = `
        <div class="flex-col items-end">
          <div class="prose">What is React?</div>
        </div>
        <div class="flex-col items-start">
          <div class="prose">React is a library.</div>
        </div>
      `;
      const result = parser.parse(html);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
      expect(result.messages[1].type).toBe(ChatMessageType.Response);
    });
  });

  describe('NoosphereParser (Strict)', () => {
    const parser = new NoosphereParser();

    it('should parse strict Noosphere headers', () => {
      const input = `# My Chat\n\n## Prompt - Lucas\nHello there\n\n## Response - Noosphere\nHi Lucas!`;
      const result = parser.parse(input);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
      expect(result.messages[0].content).toBe('Hello there');
      expect(result.metadata?.title).toBe('My Chat');
    });

    it('should throw for legacy formats', () => {
      const input = `## Prompt: legacy content`;
      expect(() => parser.parse(input)).toThrow(/No valid Noosphere Standard messages/);
    });
  });

  describe('ThirdPartyParser (Flexible)', () => {
    const parser = new ThirdPartyParser();

    it('should parse flexible name-based headers', () => {
      const input = `## Lucas: Hello\n## AI: Hi there\n## Arbitrary: Middle message`;
      const result = parser.parse(input);
      expect(result.messages).toHaveLength(3);
      expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
      expect(result.messages[0].content).toBe('Hello');
      expect(result.messages[1].type).toBe(ChatMessageType.Response);
      expect(result.messages[2].type).toBe(ChatMessageType.Prompt); // Alternating fallback
    });

    it('should parse legacy ## User: headers', () => {
      const input = `## User: test\n## Response: back`;
      const result = parser.parse(input);
      expect(result.messages[0].type).toBe(ChatMessageType.Prompt);
    });

    it('should parse raw JSON arrays', () => {
      const json = JSON.stringify([
        { type: 'prompt', content: 'hello' },
        { type: 'response', content: 'world' }
      ]);
      const result = parser.parse(json);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].content).toBe('hello');
    });
  });

  describe('Security Validation', () => {
    it('should throw error for dangerous content', () => {
      const dangerous = 'Hello! <script>alert("xss")</script>';
      expect(() => validateMarkdownOutput(dangerous)).toThrow(/Dangerous content/);

      const iframe = 'Check this: <iframe src="evil.com"></iframe>';
      expect(() => validateMarkdownOutput(iframe)).toThrow(/Dangerous content/);

      const event = 'Click me: <img src=x onerror=alert(1)>';
      expect(() => validateMarkdownOutput(event)).toThrow(/Dangerous content/);
    });

    it('should escape HTML tags but allow <thoughts>', () => {
      const mixed = 'Hello <tag> but keep <thoughts>process</thoughts>';
      const result = validateMarkdownOutput(mixed);
      expect(result).toContain('&lt;tag&gt;');
      expect(result).toContain('<thoughts>process</thoughts>');
    });

    it('should throw for suspicious entities', () => {
      // Our validator throws if it contains '<script'
      expect(() => validateMarkdownOutput('Some <script')).toThrow();
    });
  });
});
