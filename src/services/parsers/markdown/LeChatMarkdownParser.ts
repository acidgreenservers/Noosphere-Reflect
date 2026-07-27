import { BaseMarkdownParser } from './BaseMarkdownParser';
import { ChatData } from '../../../types';

export class LeChatMarkdownParser extends BaseMarkdownParser {
    parse(input: string): ChatData {
        const metadata = this.extractMetadata(input);
        metadata.model = 'LeChat';
        const messages = this.parseStandardTurns(input);
        if (messages.length === 0) throw new Error('No LeChat conversation turns detected.');
        return { messages, metadata };
    }
}
