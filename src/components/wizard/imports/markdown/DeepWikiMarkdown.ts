import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const DeepWikiMarkdownSignal: ImportSignal = {
    id: 'deepwiki-md',
    name: 'DeepWiki',
    icon: '📚',
    mode: ParserMode.DeepWikiMarkdown,
    description: 'High-fidelity Markdown exports from Devin DeepWiki.',
    detect: (content: string) => {
        return content.includes('DeepWiki') ||
            content.includes('## Q1\n') ||
            content.includes('### Answer\n');
    }
};
