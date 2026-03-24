import { ChatData, ChatMessage, ChatMessageType, ChatMetadata } from '../../../types';

/**
 * Markdown Generator class - handles Markdown export generation with layout support
 */
export class MarkdownGenerator {
  /**
   * Generates a Markdown representation of a chat session.
   * @param chatData The parsed chat data with messages and metadata
   * @param title The title of the chat
   * @param userName Custom name for user messages
   * @param aiName Custom name for AI messages
   * @param metadata Optional metadata to include in the output
   * @param layout Layout style: 'universal' (clean) or 'fancy' (collapsible)
   * @param includeMetadata Whether to include metadata header
   * @returns A string containing the markdown content
   */
  generateMarkdown(
    chatData: ChatData,
    title: string = 'AI Chat Export',
    userName: string = 'User',
    aiName: string = 'AI',
    metadata?: ChatMetadata,
    layout: 'universal' | 'fancy' = 'universal',
    includeMetadata: boolean = true
  ): string {
    const lines: string[] = [];

    // Metadata Header (blockquote format)
    if (includeMetadata && metadata) {
      lines.push('---');
      lines.push(`> **🤖 Model:** ${metadata.model || aiName}`);
      lines.push('>');
      lines.push(`> **📅 Date:** ${new Date(metadata.date).toLocaleString()}`);

      if (metadata.sourceUrl) {
        lines.push('>');
        lines.push(`> **🌐 Source:** [${metadata.sourceUrl}](${metadata.sourceUrl})`);
      }

      if (metadata.tags && metadata.tags.length > 0) {
        lines.push('>');
        lines.push(`> **🏷️ Tags:** ${metadata.tags.join(', ')}`);
      }

      // Artifact link (if directory export)
      const hasArtifacts = (metadata.artifacts && metadata.artifacts.length > 0) ||
        chatData.messages.some(m => m.artifacts && m.artifacts.length > 0);
      if (hasArtifacts) {
        lines.push('>');
        lines.push(`> **📂 Artifacts:** [View Artifacts](./artifacts/)`);
      }

      // Stats
      const totalMessages = chatData.messages.length;
      const userMessages = chatData.messages.filter(m => m.type === ChatMessageType.Prompt).length;
      const aiMessages = chatData.messages.filter(m => m.type === ChatMessageType.Response).length;

      // Count artifacts from both sources
      const sessionArtifacts = metadata.artifacts?.length || 0;
      const messageArtifacts = chatData.messages.reduce((count, msg) =>
        count + (msg.artifacts?.length || 0), 0) || 0;
      const totalArtifacts = sessionArtifacts + messageArtifacts;

      lines.push('>');
      lines.push(`> **📊 Metadata:**`);

      // Stats - all layouts now use multi-line with spacers
      lines.push(`>> **Total Exchanges:** ${userMessages}`);
      lines.push('>>');
      lines.push(`>> **Total Chat Messages:** ${totalMessages}`);
      lines.push('>>');
      lines.push(`>> **Total User Messages:** ${userMessages}`);
      lines.push('>>');
      lines.push(`>> **Total AI Messages:** ${aiMessages}`);
      lines.push('>>');
      lines.push(`>> **Total Artifacts:** ${totalArtifacts}`);

      lines.push('');
      lines.push('---');
      lines.push('');
    }

    // Title
    if (layout === 'fancy') {
      lines.push(`# **💬 ${title}**`);
      lines.push('');
      lines.push('---');
      lines.push('');
      lines.push('## **🗣️ Conversation**');
      lines.push('');
    } else {
      lines.push(`## Title:`);
      lines.push('');
      lines.push(`> ${title}`);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    // Messages
    chatData.messages.forEach((message, index) => {
      if (layout === 'fancy') {
        this.renderFancyMessage(message, userName, aiName, lines, index, chatData.messages.length);
      } else {
        this.renderUniversalMessage(message, userName, aiName, lines);
      }
    });

    // Footer
    lines.push('---');
    lines.push('');
    if (layout === 'fancy') {
      lines.push('### **🌌 Noosphere Reflect**');
      lines.push('*\"Meaning Through Memory\"*');
      lines.push('[**Preserve Your Meaning**](https://acidgreenservers.github.io/Noosphere-Reflect/)');
    } else {
      lines.push('###### Noosphere Reflect');
      lines.push('###### ***Meaning Through Memory***');
      lines.push('');
      lines.push('###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***.');
    }

    return lines.join('\n');
  }

  private renderUniversalMessage(
    message: ChatMessage,
    userName: string,
    aiName: string,
    lines: string[]
  ): void {
    const isPrompt = message.type === ChatMessageType.Prompt;
    const speakerName = isPrompt ? userName : aiName;
    const emoji = isPrompt ? '👤' : '🤖';
    const headerType = isPrompt ? 'Prompt' : 'Response';

    lines.push(`#### ${headerType} - ${speakerName} ${emoji}:`);
    lines.push('');

    // Extract thoughts if present
    const thoughtMatch = message.content.match(/<thoughts>\n\n([\s\S]*?)\n\n<\/thoughts>/);
    if (thoughtMatch && !isPrompt) {
      const thoughts = thoughtMatch[1];
      const contentWithoutThoughts = message.content.replace(thoughtMatch[0], '').trim();

      lines.push('```');
      lines.push('Thoughts:');
      lines.push(thoughts);
      lines.push('```');
      lines.push('');
      lines.push(contentWithoutThoughts);
    } else {
      lines.push(message.content);
    }

    // Artifacts
    const linkedArtifacts = message.artifacts || [];
    if (linkedArtifacts.length > 0) {
      lines.push('');
      lines.push('**📎 Attached Files:**');
      linkedArtifacts.forEach(artifact => {
        lines.push(`- [${artifact.fileName}](artifacts/${artifact.fileName})`);
      });
    }

    lines.push('');
    lines.push('');
  }

  private renderFancyMessage(
    message: ChatMessage,
    userName: string,
    aiName: string,
    lines: string[],
    index: number,
    totalMessages: number
  ): void {
    const isPrompt = message.type === ChatMessageType.Prompt;
    const emoji = isPrompt ? '👤' : '🤖';

    lines.push('<details open>');
    lines.push(`<summary><strong>${emoji} ${isPrompt ? 'User' : 'AI'} ${isPrompt ? 'Prompt' : 'Response'}</strong></summary>`);
    lines.push('');

    if (!isPrompt) {
      // Check for thoughts
      const thoughtMatch = message.content.match(/<thoughts>\n\n([\s\S]*?)\n\n<\/thoughts>/);
      if (thoughtMatch) {
        const thoughts = thoughtMatch[1];
        const contentWithoutThoughts = message.content.replace(thoughtMatch[0], '').trim();

        lines.push('<details>');
        lines.push('<summary><em>💭 Thought Process</em></summary>');
        lines.push('');
        lines.push(thoughts);
        lines.push('');
        lines.push('</details>');
        lines.push('');
        lines.push(contentWithoutThoughts);
      } else {
        lines.push(message.content);
      }
    } else {
      lines.push(message.content);
    }

    // Artifacts
    const linkedArtifacts = message.artifacts || [];
    if (linkedArtifacts.length > 0) {
      lines.push('');
      lines.push('**📎 Attached Files:**');
      linkedArtifacts.forEach(artifact => {
        lines.push(`- [${artifact.fileName}](artifacts/${artifact.fileName})`);
      });
    }

    lines.push('');
    lines.push('</details>');
    lines.push('');

    // Exchange separator (except after last message, and only after AI responses)
    if (index < totalMessages - 1 && !isPrompt) {
      const exchangeNum = Math.floor(index / 2) + 1;
      lines.push('---');
      lines.push('');
      lines.push(`# **🔄 Exchange #${exchangeNum}**`);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }
}

// Export singleton instance
export const markdownGenerator = new MarkdownGenerator();
