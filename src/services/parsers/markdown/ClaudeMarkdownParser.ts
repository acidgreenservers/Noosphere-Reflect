import { BaseMarkdownParser } from './BaseMarkdownParser';
import { ChatData } from '../../../types';

export class ClaudeMarkdownParser extends BaseMarkdownParser {
    parse(input: string): ChatData {
        const metadata = this.extractMetadata(input);

        // Ensure model is set if not detected
        if (metadata.model === 'AI Assistant') {
            metadata.model = 'Claude';
        }

        const messages = this.parseStandardTurns(input);

        if (messages.length === 0) {
            throw new Error('No Claude conversation turns detected. Ensure "## Prompt:" headers are present.');
        }

        return { messages, metadata };
    }
}
