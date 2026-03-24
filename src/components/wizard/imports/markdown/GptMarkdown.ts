import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const GptMarkdownSignal: ImportSignal = {
    id: 'gpt-md',
    name: 'ChatGPT',
    icon: '🤖',
    mode: ParserMode.ThirdPartyMarkdown,
    description: 'Universal markdown exports from ChatGPT (GPT-4o/o1).',
    detect: (content: string) => {
        return content.includes('Powered by [ChatGPT Exporter]');
    }
};
