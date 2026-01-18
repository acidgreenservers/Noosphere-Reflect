import { ChatData, ChatMetadata } from '../../../types';

/**
 * JSON Generator class - handles JSON export generation
 */
export class JsonGenerator {
  /**
   * Generates a JSON representation of a chat session.
   * @param chatData The parsed chat data with messages and metadata
   * @param metadata Optional metadata to include in the output
   * @returns A JSON string containing the exported data
   */
  generateJson(
    chatData: ChatData,
    metadata?: ChatMetadata
  ): string {
    const exportData = {
      exportedBy: {
        tool: 'Noosphere Reflect',
        tagline: 'Meaning Through Memory'
      },
      metadata: metadata || chatData.metadata || {
        title: 'Untitled Chat',
        model: '',
        date: new Date().toISOString(),
        tags: []
      },
      messages: chatData.messages
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Export singleton instance
export const jsonGenerator = new JsonGenerator();