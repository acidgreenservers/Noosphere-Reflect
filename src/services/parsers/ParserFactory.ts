import { ParserMode } from '../../types';
import { BaseParser } from './BaseParser';

// HTML Parsers
import { ChatGptParser as ChatGptHtmlParser } from './html/ChatGptHtmlParser';
import { ClaudeParser as ClaudeHtmlParser } from './html/ClaudeHtmlParser';
import { GeminiParser as GeminiHtmlParser } from './html/GeminiHtmlParser';
import { AiStudioParser as AiStudioHtmlParser } from './html/AiStudioHtmlParser';
import { GrokParser as GrokHtmlParser } from './html/GrokHtmlParser';
import { LeChatParser as LeChatHtmlParser } from './html/LeChatHtmlParser';
import { LlamacoderParser as LlamacoderHtmlParser } from './html/LlamacoderHtmlParser';
import { KimiParser as KimiHtmlParser } from './html/KimiHtmlParser';

// Markdown Parsers
import { GeminiMarkdownParser } from './markdown/GeminiMarkdownParser';
import { ClaudeMarkdownParser } from './markdown/ClaudeMarkdownParser';
import { ChatGptMarkdownParser } from './markdown/ChatGptMarkdownParser';
import { GrokMarkdownParser } from './markdown/GrokMarkdownParser';
import { LeChatMarkdownParser } from './markdown/LeChatMarkdownParser';
import { AiStudioMarkdownParser } from './markdown/AiStudioMarkdownParser';
import { KimiMarkdownParser } from './markdown/KimiMarkdownParser';
import { NoosphereMarkdownParser } from './markdown/NoosphereMarkdownParser';

// Generic & Special
import { NoosphereParser } from './NoosphereParser';
import { ThirdPartyParser } from './ThirdPartyParser';
import { BlankParser } from './BlankParser';

export class ParserFactory {
    static getParser(mode: ParserMode): BaseParser | null {
        switch (mode) {
            // HTML Modes
            case ParserMode.ChatGptHtml:
                return new ChatGptHtmlParser();
            case ParserMode.ClaudeHtml:
                return new ClaudeHtmlParser();
            case ParserMode.GeminiHtml:
                return new GeminiHtmlParser();
            case ParserMode.AiStudioHtml:
                return new AiStudioHtmlParser();
            case ParserMode.GrokHtml:
                return new GrokHtmlParser();
            case ParserMode.LeChatHtml:
                return new LeChatHtmlParser();
            case ParserMode.LlamacoderHtml:
                return new LlamacoderHtmlParser();
            case ParserMode.KimiHtml:
            case ParserMode.KimiShareCopy:
                return new KimiHtmlParser();

            // Markdown Modes
            case ParserMode.GeminiMarkdown:
                return new GeminiMarkdownParser();
            case ParserMode.ClaudeMarkdown:
                return new ClaudeMarkdownParser();
            case ParserMode.ChatGptMarkdown:
                return new ChatGptMarkdownParser();
            case ParserMode.GrokMarkdown:
                return new GrokMarkdownParser();
            case ParserMode.LeChatMarkdown:
                return new LeChatMarkdownParser();
            case ParserMode.AiStudioMarkdown:
                return new AiStudioMarkdownParser();
            case ParserMode.KimiMarkdown:
                return new KimiMarkdownParser();
            case ParserMode.NoosphereMarkdown:
                return new NoosphereMarkdownParser();

            // Generic fallback for others
            case ParserMode.LlamacoderMarkdown:
            case ParserMode.ThirdPartyMarkdown:
                return new ThirdPartyParser();

            // Special
            case ParserMode.Basic:
                return new NoosphereParser();
            case ParserMode.ThirdPartyJson:
                return new ThirdPartyParser();
            case ParserMode.Blank:
                return new BlankParser();
            default:
                return null;
        }
    }
}
