import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const GenericMarkdownSignal: ImportSignal = {
    id: 'generic-md',
    name: 'Generic Markdown',
    icon: '📜',
    mode: ParserMode.ThirdPartyMarkdown,
    description: 'Standard markdown content from any 3rd party source.',
    detect: (content: string) => {
        // Fallback detector: if it has basic markdown headers or code blocks
        return content.includes('## ') || content.includes('```');
    }
};
