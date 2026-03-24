import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const ClaudeMarkdownSignal: ImportSignal = {
    id: 'claude-md',
    name: 'Claude',
    icon: '🎭',
    mode: ParserMode.ThirdPartyMarkdown,
    description: 'High-fidelity markdown from Claude.ai exports.',
    detect: (content: string) => {
        return content.includes('Powered by [Claude Exporter]');
    }
};
