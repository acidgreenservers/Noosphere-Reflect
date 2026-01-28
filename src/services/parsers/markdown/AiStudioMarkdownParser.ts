import { BaseMarkdownParser } from './BaseMarkdownParser';
import { ChatData } from '../../../types';

export class AiStudioMarkdownParser extends BaseMarkdownParser {
    parse(input: string): ChatData {
        const metadata = this.extractMetadata(input);
        if (metadata.model === 'AI Assistant') metadata.model = 'AI Studio';
        const messages = this.parseStandardTurns(input);
        if (messages.length === 0) throw new Error('No AI Studio conversation turns detected.');
        return { messages, metadata };
    }
}
