import { BaseMarkdownParser } from './BaseMarkdownParser';
import { ChatData } from '../../../types';

export class KimiMarkdownParser extends BaseMarkdownParser {
    parse(input: string): ChatData {
        const metadata = this.extractMetadata(input);

        // Set default model if not detected
        if (metadata.model === 'AI Assistant') {
            metadata.model = 'Kimi';
        }

        const messages = this.parseStandardTurns(input);

        if (messages.length === 0) {
            throw new Error('No Kimi conversation turns detected.');
        }

        return { messages, metadata };
    }
}
