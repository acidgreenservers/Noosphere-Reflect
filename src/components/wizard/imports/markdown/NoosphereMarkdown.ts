import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const NoosphereMarkdownSignal: ImportSignal = {
    id: 'noosphere-md',
    name: 'Noosphere Reflect',
    icon: '✨',
    mode: ParserMode.NoosphereMarkdown,
    description: 'Native high-fidelity Markdown exports from Noosphere scrapers.',
    detect: (content: string) => {
        return content.includes('###### Noosphere Reflect') ||
            content.includes('#### Prompt - ') ||
            content.includes('## Title:');
    }
};

/**
 * Noosphere Reflect Markdown parser (UI bridge)
 * The actual parsing logic is centralized in NoosphereMarkdownParser.ts
 */
export const parseNoosphereMarkdown = (content: string): { messages: any[], metadata: any } => {
    // This is a bridge for the wizard UI if needed
    // However, the wizard mostly uses the centralized parseChat service
    return { messages: [], metadata: {} };
};
