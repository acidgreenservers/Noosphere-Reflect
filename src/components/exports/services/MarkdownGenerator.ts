import { ChatData, ChatMessage, ChatMessageType, ChatMetadata } from '../../../types';
import { escapeHtml } from '../../../utils/securityUtils';

/**
 * Markdown Generator class - handles Markdown export generation
 */
export class MarkdownGenerator {
  /**
   * Generates a Markdown representation of a chat session.
   * @param chatData The parsed chat data with messages and metadata
   * @param title The title of the chat
   * @param userName Custom name for user messages
   * @param aiName Custom name for AI messages
   * @param metadata Optional metadata to include in the output
   * @returns A string containing the markdown content
   */
  generateMarkdown(
    chatData: ChatData,
    title: string = 'AI Chat Export',
    userName: string = 'User',
    aiName: string = 'AI',
    metadata?: ChatMetadata
  ): string {
    const lines: string[] = [];

    // Header section
    lines.push(`# ${title}\n`);

    if (metadata) {
      if (metadata.model) lines.push(`**Model:** ${metadata.model}`);
      if (metadata.date) lines.push(`**Date:** ${new Date(metadata.date).toLocaleString()}`);
      if (metadata.sourceUrl) lines.push(`**Source:** [${metadata.sourceUrl}](${metadata.sourceUrl})`);
      if (metadata.tags && metadata.tags.length > 0) lines.push(`**Tags:** ${metadata.tags.join(', ')}`);
      if (lines.length > 1) lines.push('');
      lines.push('---\n');
    }

    // Messages
    chatData.messages.forEach((message, index) => {
      const messageNumber = index + 1;
      const speakerName = message.type === ChatMessageType.Prompt ? userName : aiName;
      const headerType = message.type === ChatMessageType.Prompt ? 'Prompt' : 'Response';
      lines.push(`## ${headerType} - ${speakerName}\n`);

      // Convert thought blocks to collapsible details
      let content = message.content;
      content = content.replace(
        /\<thought\>([\s\S]*?)\<\/thought\>/g,
        '\n```thought\n$1\n```\n'
      );

      lines.push(content);

      // Check for artifacts linked to this message
      // Prefer direct message artifacts, fall back to metadata index matching (legacy)
      const linkedArtifacts = message.artifacts || metadata?.artifacts?.filter(
        artifact => artifact.insertedAfterMessageIndex === index
      ) || [];

      if (linkedArtifacts.length > 0) {
        lines.push('\n**📎 Attached Files:**\n');
        linkedArtifacts.forEach(artifact => {
          const artifactPath = `artifacts/${artifact.fileName}`;
          const fileSize = (artifact.fileSize / 1024).toFixed(1);
          lines.push(`- [${artifact.fileName}](${artifactPath}) (${fileSize} KB)`);
        });
      }

      lines.push('');
    });

    // Footer
    lines.push('---\n');
    lines.push('# Noosphere Reflect');
    lines.push('*Meaning Through Memory*');

    return lines.join('\n');
  }
}

// Export singleton instance
export const markdownGenerator = new MarkdownGenerator();