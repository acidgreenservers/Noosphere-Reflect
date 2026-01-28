import { BaseMarkdownParser } from './BaseMarkdownParser';
import { ChatData } from '../../../types';

export class GrokMarkdownParser extends BaseMarkdownParser {
    parse(input: string): ChatData {
        const metadata = this.extractMetadata(input);
        if (metadata.model === 'AI Assistant') metadata.model = 'Grok';
        const messages = this.parseStandardTurns(input);
        if (messages.length === 0) throw new Error('No Grok conversation turns detected.');
        return { messages, metadata };
    }
}
