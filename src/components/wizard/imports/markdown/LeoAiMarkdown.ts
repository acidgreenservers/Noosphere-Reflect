import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const LeoAiMarkdownSignal: ImportSignal = {
    id: 'leo-ai-md',
    name: 'Leo AI',
    icon: '🦁',
    mode: ParserMode.LeoAiMarkdown,
    description: 'Brave Leo Assistant chat copy-paste.',
    detect: (content: string) => {
        // Detect based on the presence of both markers
        return content.includes('You: ') && content.includes('Leo AI: ');
    }
};
