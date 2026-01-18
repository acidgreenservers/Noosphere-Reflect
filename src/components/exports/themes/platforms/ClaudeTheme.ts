import { ChatData, ChatMessage, ChatTheme, ChatMetadata, ParserMode } from '../../../../types';
import { PlatformThemeClasses, ThemeRenderer } from '../base/ThemeTypes';
import { escapeHtml, sanitizeUrl } from '../../../../utils/securityUtils';

/**
 * Claude Theme - Exact replication of Claude's chat interface styling
 * Based on DOM reference: scripts/reference-html-dom/claude-console-dom.html
 */
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
    isPreview: boolean = false
  ): string {
    const previewScript = isPreview ? `
    <script>
      function downloadArtifact(e) {
        e.preventDefault();
        const link = e.currentTarget;
        const b64 = link.getAttribute('data-b64');
        const mime = link.getAttribute('data-mime');
        const filename = link.getAttribute('download');

        try {
            const byteCharacters = atob(b64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {type: mime});
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error('Download failed', err);
            alert('Download failed: ' + err.message);
        }
      }
    </script>
  ` : '';

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

      /* Claude-specific styles */
      .claude-user-message {
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        border-radius: 1rem;
        padding: 1rem 1.25rem;
        margin: 0.5rem 0;
        max-width: 85%;
        margin-left: auto;
        margin-right: 0;
        color: #111827;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      .claude-assistant-message {
        background: ${this.classes.bodyBg};
        border-radius: 1rem;
        padding: 1rem 1.25rem;
        margin: 0.5rem 0;
        max-width: 85%;
        margin-left: 0;
        margin-right: auto;
        color: ${this.classes.bodyText};
        border: 1px solid #374151;
      }

      .claude-thought-block {
        background: #1f2937;
        border: 1px solid #374151;
        border-radius: 0.5rem;
        margin: 1rem 0;
        overflow: hidden;
      }

      .claude-thought-summary {
        background: #111827;
        padding: 0.75rem 1rem;
        cursor: pointer;
        border-bottom: 1px solid #374151;
        font-weight: 600;
        color: #e5e7eb;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .claude-thought-summary:hover {
        background: #1a202c;
      }

      .claude-thought-content {
        padding: 1rem;
        color: #d1d5db;
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .claude-thought-block summary::marker {
        content: '▶';
        color: #6b7280;
        font-size: 0.75rem;
      }

      .claude-thought-block[open] summary::marker {
        content: '▼';
      }
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
        <h1 class="text-4xl font-extrabold text-center text-blue-400 mb-8">${escapeHtml(title)}</h1>

        <!-- Metadata Section -->
        <div class="text-center text-sm text-gray-400 mb-8 space-y-1">
            ${metadata?.model ? `<div><strong>Model:</strong> ${escapeHtml(metadata.model)}</div>` : ''}
            ${metadata?.date ? `<div><strong>Date:</strong> ${escapeHtml(new Date(metadata.date).toLocaleString())}</div>` : ''}
            ${metadata?.sourceUrl ? (() => {
      const safeUrl = sanitizeUrl(metadata.sourceUrl);
      return safeUrl ? `<div><strong>Source:</strong> <a href="${escapeHtml(safeUrl)}" class="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">${escapeHtml(safeUrl)}</a></div>` : '';
    })() : ''}
            ${metadata?.tags && metadata.tags.length > 0 ? `<div><strong>Tags:</strong> ${metadata.tags.map(tag => escapeHtml(tag)).join(', ')}</div>` : ''}
        </div>

        <div class="space-y-2 flex flex-col w-full">
            ${chatMessagesHtml}
        </div>

        ${includeFooter ? `
        <div class="text-center text-xs text-gray-500 opacity-50 mt-16 pt-8 border-t border-gray-700">
            <p class="mt-8"><strong>Noosphere Reflect</strong></p>
            <p class="text-xs italic">Preserving Meaning Through Memory</p>
        </div>
        ` : ''}
    </div>

    ${previewScript}
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
      ? this.classes.getUserMessageClasses(message, index)
      : this.classes.getAssistantMessageClasses(message, index);

    // Handle thought blocks for Claude
    if (!isPrompt && parserMode === ParserMode.ClaudeHtml && message.content.includes('<thought>')) {
      const parts = message.content.split(/(<thought>[\s\S]*?<\/thought>)/);
      const contentHtml = parts.map(part => {
        if (part.startsWith('<thought>') && part.endsWith('</thought>')) {
          const thoughtContent = part.replace(/<\/?thought>/g, '').trim();
          return this.generateThoughtBlockHtml(thoughtContent);
        }
        return this.convertMarkdownToHtml(part, true);
      }).join('');

      return `
        <div class="flex justify-start mb-4 w-full" data-message-index="${index}">
          <div class="${messageClasses}">
            <div class="markdown-content">${contentHtml}</div>
          </div>
        </div>
      `;
    }

    // Regular message
    const contentHtml = this.convertMarkdownToHtml(message.content, parserMode === ParserMode.ClaudeHtml);

    return `
      <div class="flex ${isPrompt ? 'justify-end' : 'justify-start'} mb-4 w-full" data-message-index="${index}">
        <div class="${messageClasses}">
          <div class="markdown-content">${contentHtml}</div>
        </div>
      </div>
    `;
  }

  generateThoughtBlockHtml(content: string): string {
    const thoughtHtml = this.convertMarkdownToHtml(content, false);

    return `
      <details class="claude-thought-block my-4">
        <summary class="claude-thought-summary">
          <span>💭</span>
          <span>Thinking...</span>
        </summary>
        <div class="claude-thought-content">
          ${thoughtHtml}
        </div>
      </details>
    `;
  }

  getStyles(): string {
    return `
      @layer base {
        body {
          @apply ${this.classes.bodyBg} ${this.classes.bodyText} font-sans leading-relaxed;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        /* Claude-specific typography */
        .markdown-content p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .markdown-content code.inline-code {
          background: rgba(0, 0, 0, 0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 0.875em;
        }

        .markdown-content pre {
          background: #1e1e1e;
          border: 1px solid #374151;
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .markdown-content pre code {
          background: transparent;
          padding: 0;
          border-radius: 0;
        }
      }
    `;
  }

  private convertMarkdownToHtml(markdown: string, enableThoughts: boolean): string {
    // Simple markdown conversion for Claude theme
    // Bold
    let html = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Code blocks
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'plaintext';
      return `<div class="relative group my-2">
        <pre><code class="language-${language}">${code.replace(/</g, '<').replace(/>/g, '>')}</code></pre>
        <button onclick="copyToClipboard(this)" class="absolute top-2 right-2 p-1.5 text-xs font-medium text-gray-200 bg-gray-700/80 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none z-10">Copy</button>
      </div>`;
    });

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const safeUrl = sanitizeUrl(url);
      return safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${text}</a>` : text;
    });

    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    // Paragraphs
    html = html.replace(/^(.+)$/gm, '<p>$1</p>');
    html = html.replace(/<p><br\/><\/p>/g, '');

    return html;
  }
}

// Claude theme classes - exact replication of Claude's visual design
export const ClaudeThemeClasses: PlatformThemeClasses = {
  // Base HTML structure
  htmlClass: 'dark',
  bodyBg: 'bg-gray-50', // Claude uses a light background
  bodyText: 'text-gray-900',
  containerBg: 'bg-transparent',
  titleText: 'text-blue-600',

  // Platform-specific CSS
  platformStyles: '',

  // Message styling functions - Claude's exact appearance
  getUserMessageClasses: () => 'claude-user-message',
  getAssistantMessageClasses: () => 'claude-assistant-message',

  // Special elements
  thoughtBlockClasses: 'claude-thought-block',
  codeBlockClasses: 'claude-code-block',
  copyButtonClasses: 'claude-copy-button',
};

// Claude theme renderer instance
export const ClaudeThemeRendererInstance = new ClaudeThemeRenderer(ClaudeThemeClasses);
