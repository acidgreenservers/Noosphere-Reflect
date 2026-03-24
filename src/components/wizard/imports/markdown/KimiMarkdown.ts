import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const KimiMarkdownSignal: ImportSignal = {
    id: 'kimi-md',
    name: 'Kimi AI',
    icon: '🌙',
    mode: ParserMode.ThirdPartyMarkdown,
    description: 'Markdown exports from Moonshot AI (Kimi).',
    detect: (content: string) => {
        // Kimi uses a unique format with "User:" and "Kimi:" labels
        // No footer signature like the others
        return content.includes('\nKimi:') && content.includes('\nUser:');
    }
};
