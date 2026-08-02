import { ChatData, ChatMessage, ChatTheme, ChatMetadata, ParserMode } from '../../../../../types';
import { PlatformThemeClasses, ThemeRenderer } from '../../base/ThemeTypes';
import { MarkdownProcessor } from '../../../services/MarkdownProcessor';
import {
    getClaudeBaseHtml,
    getClaudeUserMessageHtml,
    getClaudeAiMessageHtml,
    getClaudeThoughtBlockHtml
} from './ClaudeTemplate';

export class ClaudeThemeRenderer implements ThemeRenderer {
  private classes: PlatformThemeClasses;

  constructor(classes: PlatformThemeClasses) {
    this.classes = classes;
  }

  generateHtml(
    chatData: ChatData,
    title: string,
    userName: string,
    aiName: string,
    parserMode: ParserMode,
    metadata?: ChatMetadata,
    includeFooter: boolean = true,
    isPreview: boolean = false,
    blobUrlMap?: Record<string, string>
  ): string {
    const chatMessagesHtml = chatData.messages
      .map((message, index) => this.generateMessageHtml(message, index, userName, aiName, parserMode))
      .join('');

    return getClaudeBaseHtml(title, userName, aiName, chatMessagesHtml, metadata, includeFooter);
  }

  generateMessageHtml(
    message: ChatMessage,
    index: number,
    userName: string,
    aiName: string,
    parserMode: ParserMode
  ): string {
    const isPrompt = message.type === 'prompt';

    if (isPrompt) {
      const contentHtml = this.convertMarkdownToHtml(message.content, false);
      const dateStr = message.timestamp ? new Date(message.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
      return getClaudeUserMessageHtml(index, contentHtml, dateStr);
    }

    // AI Message
    let contentHtml = '';
    let thoughtCount = 0;
    
    if (message.content.includes('<thoughts>')) {
      const parts = message.content.split(/(<thoughts>[\s\S]*?<\/thoughts>|<thought>[\s\S]*?<\/thought>)/);
      contentHtml = parts.map(part => {
        if ((part.startsWith('<thoughts>') && part.endsWith('</thoughts>')) || (part.startsWith('<thought>') && part.endsWith('</thought>'))) {
          const thoughtContent = part.replace(/<\/?thoughts?>/g, '').trim();
          thoughtCount++;
          return this.generateThoughtBlockHtml(thoughtContent, index, thoughtCount);
        }
        return this.convertMarkdownToHtml(part, true);
      }).join('');
    } else {
      contentHtml = this.convertMarkdownToHtml(message.content, true);
    }

    return getClaudeAiMessageHtml(index, contentHtml);
  }

  generateThoughtBlockHtml(content: string, messageIndex: number, thoughtIndex: number): string {
    const idSuffix = `${messageIndex}_${thoughtIndex}`;
    
    // Extract summary if present, otherwise use default
    let summary = "Thought process";
    let body = content;
    
    const lines = content.split('\\n');
    if (lines.length > 1 && lines[0].length > 0 && lines[0].length < 100 && !lines[0].includes(' ')) {
      // It's probably just a word, ignore
    } else if (lines.length > 1 && lines[0].length > 0 && lines[0].length < 150) {
      summary = lines[0].trim();
      body = lines.slice(1).join('\\n').trim();
    }
    
    const thoughtHtml = this.convertMarkdownToHtml(body, false);
    return getClaudeThoughtBlockHtml(thoughtHtml, summary, idSuffix);
  }

  getStyles(): string {
      return ''; // Styles moved to ClaudeStyles and injected via getClaudeHeadContent
  }

  private convertMarkdownToHtml(markdown: string, enableThoughts: boolean): string {
    if (!markdown) return '';
    return MarkdownProcessor.convertMarkdownToHtml(markdown, enableThoughts).replace(/copyToClipboard\(/g, 'copyCodeBlock(');
  }
}
