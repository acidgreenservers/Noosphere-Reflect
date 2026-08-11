import { ChatData, ChatMetadata, ChatMessageType } from '../../../types';
import { ExportGenerator } from './ExportService';

export class TextGenerator implements ExportGenerator {
  /**
   * Generates a plain text string representing a chat conversation.
   */
  generateText(
    chatData: ChatData,
    title?: string,
    userName: string = 'User',
    aiName: string = 'AI',
    metadata?: ChatMetadata
  ): string {
    const lines: string[] = [];

    // Title & Metadata
    if (title) {
      lines.push(title);
      lines.push('='.repeat(title.length));
      lines.push('');
    }

    if (metadata) {
      if (metadata.date) {
        lines.push(`Date: ${new Date(metadata.date).toLocaleString()}`);
      }
      if (metadata.model) {
        lines.push(`Model: ${metadata.model}`);
      }
      lines.push('');
    }

    // Messages
    const { messages } = chatData;
    for (const msg of messages) {
      const isPrompt = msg.type === ChatMessageType.Prompt;
      const senderName = isPrompt ? userName : aiName;
      lines.push(`${senderName}:`);

      // Extract thoughts
      let thoughts: string | null = msg.thought || null;
      let content = msg.content || '';

      const thoughtRegex = /(?:<thoughts>|<thought>)\s*([\s\S]*?)\s*(?:<\/thoughts>|<\/thought>)/i;
      const match = content.match(thoughtRegex);
      if (match) {
        const extracted = match[1].trim();
        if (extracted) {
          thoughts = thoughts ? thoughts.trim() + '\n\n' + extracted : extracted;
        }
        content = content.replace(match[0], '').trim();
      }

      const stripMarkdown = (raw: string) => {
        let text = raw || '';
        // Remove code blocks
        text = text.replace(/```[\s\S]*?```/g, (m) => {
            return m.replace(/```(.*)\n/g, '').replace(/```/g, '');
        });
        // Remove inline code, bold, italic
        text = text.replace(/`([^`]+)`/g, '$1');
        text = text.replace(/\*\*(.*?)\*\*/g, '$1');
        text = text.replace(/__(.*?)__/g, '$1');
        text = text.replace(/\*(.*?)\*/g, '$1');
        text = text.replace(/_(.*?)_/g, '$1');
        // Convert headers to plain text
        text = text.replace(/^#+\s+(.*)$/gm, '$1');
        return text.trim();
      };

      if (!isPrompt && thoughts) {
        lines.push('[Thought Process]');
        lines.push(stripMarkdown(thoughts));
        lines.push('');
        lines.push('[Response]');
        lines.push(stripMarkdown(content));
      } else {
        lines.push(stripMarkdown(content));
      }

      lines.push('');
      lines.push('-'.repeat(40));
      lines.push('');
    }

    return lines.join('\n');
  }

  // Implementation of the ExportGenerator interface
  async generate(
    chatData: ChatData,
    title?: string,
    _theme?: any,
    userName: string = 'User',
    aiName: string = 'AI',
    _parserMode?: any,
    metadata?: ChatMetadata,
    _standalone?: boolean,
    _addThemePicker?: boolean,
    _style?: any
  ): Promise<string> {
    return this.generateText(chatData, title, userName, aiName, metadata);
  }
}

export const textGenerator = new TextGenerator();
