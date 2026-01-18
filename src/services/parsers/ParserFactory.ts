import { ParserMode } from '../../types';
import { BaseParser } from './BaseParser';
import { ChatGptParser } from './ChatGptParser';
import { ClaudeParser } from './ClaudeParser';
import { GeminiParser } from './GeminiParser';
import { AiStudioParser } from './AiStudioParser';
import { GrokParser } from './GrokParser';
import { LeChatParser } from './LeChatParser';
import { LlamacoderParser } from './LlamacoderParser';
import { KimiParser } from './KimiParser';
import { NoosphereParser } from './NoosphereParser';
import { ThirdPartyParser } from './ThirdPartyParser';

export class ParserFactory {
    static getParser(mode: ParserMode): BaseParser | null {
        switch (mode) {
            case ParserMode.ChatGptHtml:
                return new ChatGptParser();
            case ParserMode.ClaudeHtml:
                return new ClaudeParser();
            case ParserMode.GeminiHtml:
                return new GeminiParser();
            case ParserMode.AiStudioHtml:
                return new AiStudioParser();
            case ParserMode.GrokHtml:
                return new GrokParser();
            case ParserMode.LeChatHtml:
                return new LeChatParser();
            case ParserMode.LlamacoderHtml:
                return new LlamacoderParser();
            case ParserMode.KimiHtml:
            case ParserMode.KimiShareCopy:
                return new KimiParser();
            case ParserMode.Basic:
                return new NoosphereParser();
            case ParserMode.ThirdPartyMarkdown:
            case ParserMode.ThirdPartyJson:
                return new ThirdPartyParser();
            default:
                return null;
        }
    }
}
