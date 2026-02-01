import { ClaudeMarkdownSignal } from './ClaudeMarkdown';
import { GeminiMarkdownSignal } from './GeminiMarkdown';
import { GptMarkdownSignal } from './GptMarkdown';
import { KimiMarkdownSignal } from './KimiMarkdown';
import { GrokMarkdownSignal } from './GrokMarkdown';
import { LlamacoderMarkdownSignal } from './LlamacoderMarkdown';
import { AiStudioMarkdownSignal } from './AiStudioMarkdown';
import { LeChatMarkdownSignal } from './LeChatMarkdown';
import { NoosphereMarkdownSignal } from './NoosphereMarkdown';
import { GenericMarkdownSignal } from './GenericMarkdown';
import { ImportSignal } from './types';

export * from './types';

export const MARKDOWN_SIGNALS: ImportSignal[] = [
    ClaudeMarkdownSignal,
    GeminiMarkdownSignal,
    GptMarkdownSignal,
    KimiMarkdownSignal,
    GrokMarkdownSignal,
    LlamacoderMarkdownSignal,
    AiStudioMarkdownSignal,
    LeChatMarkdownSignal,
    NoosphereMarkdownSignal,
    GenericMarkdownSignal
];
