import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const GrokMarkdownSignal: ImportSignal = {
    id: 'grok-md',
    name: 'Grok',
    icon: '🚀',
    mode: ParserMode.ThirdPartyMarkdown,
    description: 'Markdown exports from xAI Grok.',
    detect: (content: string) => {
        return content.includes('Powered by [Grok Exporter]');
    }
};
