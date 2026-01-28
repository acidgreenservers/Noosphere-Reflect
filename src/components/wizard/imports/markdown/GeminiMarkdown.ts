import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const GeminiMarkdownSignal: ImportSignal = {
    id: 'gemini-md',
    name: 'Gemini',
    icon: '✨',
    mode: ParserMode.ThirdPartyMarkdown,
    description: 'Universal markdown with deep thinking blocks from Google Gemini.',
    detect: (content: string) => {
        return content.includes('Powered by [Gemini Exporter]');
    }
};
