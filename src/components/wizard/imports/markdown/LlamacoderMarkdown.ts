import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const LlamacoderMarkdownSignal: ImportSignal = {
    id: 'llamacoder-md',
    name: 'Llamacoder',
    icon: '🦙',
    mode: ParserMode.ThirdPartyMarkdown,
    description: 'Markdown exports from Together AI Llamacoder.',
    detect: (content: string) => {
        return content.includes('Powered by [Llamacoder Exporter]');
    }
};
