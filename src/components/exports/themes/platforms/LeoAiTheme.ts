import { ChatData, ChatMessage, ChatTheme, ChatMetadata, ParserMode } from '../../../../types';
import { PlatformThemeClasses, ThemeRenderer } from '../base/ThemeTypes';
import { escapeHtml, sanitizeUrl } from '../../../../utils/securityUtils';

/**
 * Leo AI Theme - Brave Leo Assistant inspired styling
 * Custom layout and colors (Orange and Blue)
 */
export class LeoAiThemeRenderer implements ThemeRenderer {
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
    isPreview: boolean = false
  ): string {
    const chatMessagesHtml = chatData.messages
      .map((message, index) => this.generateMessageHtml(message, index, userName, aiName, parserMode))
      .join('');

    return `<!DOCTYPE html>
<html lang="en" class="${this.classes.htmlClass}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style type="text/tailwindcss">
      ${this.getStyles()}

      .leo-user-message {
        background: #fdf2f0;
        border: 1px solid #ff9e80;
        border-radius: 1.25rem 1.25rem 0 1.25rem;
        padding: 1.25rem;
        margin: 0.75rem 0;
        max-width: 85%;
        margin-left: auto;
        margin-right: 0;
        color: #1a1a1a;
        box-shadow: 0 2px 4px rgba(255, 158, 128, 0.1);
      }

      .leo-assistant-message {
        background: #f0f4f8;
        border: 1px solid #80a8ff;
        border-radius: 1.25rem 1.25rem 1.25rem 0;
        padding: 1.25rem;
        margin: 0.75rem 0;
        max-width: 85%;
        margin-left: 0;
        margin-right: auto;
        color: #1a1a1a;
        box-shadow: 0 2px 4px rgba(128, 168, 255, 0.1);
      }

      .leo-message-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
        display: block;
      }

      .leo-user-label { color: #d84315; }
      .leo-assistant-label { color: #1565c0; }
    </style>
    <script>
    function copyToClipboard(btn) {
      const container = btn.parentElement;
      const pre = container.querySelector('pre');
      const code = pre.innerText;
      navigator.clipboard.writeText(code).then(() => {
         const originalText = btn.innerText;
         btn.innerText = 'Copied!';
         setTimeout(() => { btn.innerText = originalText; }, 2000);
      }).catch(err => {
         console.error('Failed to copy:', err);
         btn.innerText = 'Error';
      });
    }
    </script>
</head>
<body class="${this.classes.bodyBg} p-8">
    <div class="max-w-4xl mx-auto my-8">
        <h1 class="text-4xl font-black text-center text-orange-600 mb-8 tracking-tighter">${escapeHtml(title)}</h1>

        <!-- Metadata Section (Noosphere Reflect Format) -->
        <div class="text-center text-sm text-gray-500 mb-12 space-y-2 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
            ${metadata?.model ? `<div class="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold mr-2">🤖 ${escapeHtml(metadata.model)}</div>` : ''}
            ${metadata?.date ? `<div class="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">📅 ${escapeHtml(new Date(metadata.date).toLocaleString())}</div>` : ''}

            <div class="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
              ${metadata?.sourceUrl ? (() => {
        const safeUrl = sanitizeUrl(metadata.sourceUrl);
        return safeUrl ? `<div><strong class="text-gray-400">🌐 Source:</strong> <a href="${escapeHtml(safeUrl)}" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">${escapeHtml(safeUrl)}</a></div>` : '';
      })() : ''}
              ${metadata?.tags && metadata.tags.length > 0 ? `<div><strong class="text-gray-400">🏷️ Tags:</strong> ${metadata.tags.map(tag => `<span class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px] ml-1 uppercase font-bold">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
            </div>
        </div>

        <div class="space-y-4 flex flex-col w-full">
            ${chatMessagesHtml}
        </div>

        ${includeFooter ? `
        <div class="text-center mt-20 pt-10 border-t border-gray-100">
            <p class="text-orange-600 font-black tracking-widest uppercase text-lg">Noosphere Reflect</p>
            <p class="text-gray-400 text-xs italic font-medium tracking-tight mt-1">Meaning Through Memory</p>
            <div class="mt-6">
               <a href="https://acidgreenservers.github.io/Noosphere-Reflect/" class="inline-block px-6 py-2 bg-orange-600 text-white text-xs font-bold rounded-full hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">PRESERVE YOUR MEANING</a>
            </div>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
  }

  generateMessageHtml(
    message: ChatMessage,
    index: number,
    userName: string,
    aiName: string,
    parserMode: ParserMode
  ): string {
    const isPrompt = message.type === 'prompt';
    const messageClasses = isPrompt
      ? 'leo-user-message'
      : 'leo-assistant-message';

    const label = isPrompt ? userName : aiName;
    const labelClass = isPrompt ? 'leo-user-label' : 'leo-assistant-label';

    const contentHtml = this.convertMarkdownToHtml(message.content);

    return `
      <div class="flex ${isPrompt ? 'justify-end' : 'justify-start'} mb-6 w-full" data-message-index="${index}">
        <div class="${messageClasses}">
          <span class="leo-message-label ${labelClass}">${escapeHtml(label)}</span>
          <div class="markdown-content">${contentHtml}</div>
        </div>
      </div>
    `;
  }

  getStyles(): string {
    return `
      @layer base {
        body {
          @apply bg-white text-gray-900 font-sans leading-relaxed;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .markdown-content p {
          margin: 0.75rem 0;
          line-height: 1.7;
        }

        .markdown-content code {
          background: rgba(0, 0, 0, 0.05);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.9em;
        }

        .markdown-content pre {
          background: #1e293b;
          color: #f8fafc;
          border-radius: 0.75rem;
          padding: 1.25rem;
          margin: 1.25rem 0;
          overflow-x: auto;
          position: relative;
        }

        .markdown-content pre code {
          background: transparent;
          padding: 0;
          color: inherit;
          font-size: 0.85rem;
        }

        .markdown-content blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1rem;
          color: #64748b;
          font-style: italic;
          margin: 1rem 0;
        }

        .markdown-content ul, .markdown-content ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }

        .markdown-content ul { list-style-type: disc; }
        .markdown-content ol { list-style-type: decimal; }

        .markdown-content li { margin: 0.375rem 0; }
      }
    `;
  }

  private convertMarkdownToHtml(markdown: string): string {
    // Basic markdown conversion
    let html = markdown
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'plaintext';
      return `<div class="relative group my-4">
        <pre><code class="language-${language}">${code}</code></pre>
        <button onclick="copyToClipboard(this)" class="absolute top-2 right-2 p-1.5 text-[10px] font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-all focus:outline-none">COPY</button>
      </div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const safeUrl = sanitizeUrl(url);
      return safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline font-medium">${text}</a>` : text;
    });

    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    // Paragraphs
    html = html.replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<div') || match.startsWith('<pre') || match.startsWith('<br') || match.startsWith('<ul') || match.startsWith('<ol') || match.startsWith('<li') || match.startsWith('<blockquote')) {
        return match;
      }
      return `<p>${match}</p>`;
    });

    return html;
  }
}

export const LeoAiThemeClasses: PlatformThemeClasses = {
  htmlClass: 'light',
  bodyBg: 'bg-white',
  bodyText: 'text-gray-900',
  containerBg: 'bg-transparent',
  titleText: 'text-orange-600',
  platformStyles: '',
  getUserMessageClasses: () => 'leo-user-message',
  getAssistantMessageClasses: () => 'leo-assistant-message',
  thoughtBlockClasses: '',
  codeBlockClasses: '',
  copyButtonClasses: '',
};

export const LeoAiThemeRendererInstance = new LeoAiThemeRenderer(LeoAiThemeClasses);
