import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const AiStudioMarkdownSignal: ImportSignal = {
    id: 'aistudio-md',
    name: 'AI Studio',
    icon: '🔬',
    mode: ParserMode.ThirdPartyMarkdown,
    description: 'Markdown exports from Google AI Studio.',
    detect: (content: string) => {
        return content.includes('Powered by [AI Studio Exporter]');
    }
};
