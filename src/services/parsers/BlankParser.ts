import { BaseParser } from './BaseParser';
import { ChatData, ChatMessageType } from '../../types';

/**
 * BlankParser creates an empty chat structure or a single empty message
 * to allow users to start a new chat from scratch.
 */
export class BlankParser implements BaseParser {
    parse(input: string): ChatData {
        // Create a basic shell with one empty message to ensure Review/Edit works
        return {
            messages: [],
            metadata: {
                title: 'New Blank Chat',
                model: 'Manual Entry',
                date: new Date().toISOString(),
                tags: []
            }
        };
    }
}
