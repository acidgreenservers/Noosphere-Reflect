import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const LeChatMarkdownSignal: ImportSignal = {
    id: 'lechat-md',
    name: 'LeChat',
    icon: '🌊',
    mode: ParserMode.ThirdPartyMarkdown,
    description: 'Markdown exports from Mistral AI LeChat.',
    detect: (content: string) => {
        return content.includes('Powered by [LeChat Exporter]');
    }
};
