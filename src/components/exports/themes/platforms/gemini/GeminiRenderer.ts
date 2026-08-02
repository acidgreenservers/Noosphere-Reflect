import { ChatData, ChatMessage, ChatTheme, ChatMetadata, ParserMode } from '../../../../../types';
import { PlatformThemeClasses, ThemeRenderer } from '../../base/ThemeTypes';
import { sanitizeUrl } from '../../../../../utils/securityUtils';
import {
    getGeminiBaseHtml,
    getGeminiUserMessageHtml,
    getGeminiAiMessageHtml,
    getGeminiThoughtBlockHtml
} from './GeminiTemplate';

export class GeminiThemeRenderer implements ThemeRenderer {
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

    return getGeminiBaseHtml(title, userName, aiName, chatMessagesHtml, metadata, includeFooter);
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
      return getGeminiUserMessageHtml(index, contentHtml);
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

    return getGeminiAiMessageHtml(index, contentHtml);
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
    return getGeminiThoughtBlockHtml(thoughtHtml, summary, idSuffix);
  }

  getStyles(): string {
      return ''; // Styles moved to GeminiStyles and injected via getGeminiHeadContent
  }

  private convertMarkdownToHtml(markdown: string, enableThoughts: boolean): string {
    if (!markdown) return '';
    let html = markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    // Code blocks
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'plaintext';
      return `<div class="relative group my-2">
        <button onclick="copyCodeBlock(this)" class="absolute top-2 right-2 p-1.5 text-xs font-medium text-gray-200 bg-gray-700/80 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none z-10">Copy</button>
        <pre><code class="language-${language}">${code}</code></pre>
      </div>`;
    });
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const safeUrl = sanitizeUrl(url);
      return safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-gemini-accent hover:underline">${text}</a>` : text;
    });

    // Paragraphs - preserving newlines appropriately
    html = html.split('\n\n').map(p => {
        if (p.trim() === '') return '';
        if (p.startsWith('<div') || p.startsWith('<pre')) return p; // Don't wrap divs or pres
        return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');

    return html;
  }
}
