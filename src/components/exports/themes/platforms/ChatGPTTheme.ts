import { ChatData, ChatMessage, ChatTheme, ChatMetadata, ParserMode } from '../../../../types';
import { PlatformThemeClasses, ThemeRenderer } from '../base/ThemeTypes';
import { escapeHtml, sanitizeUrl } from '../../../../utils/securityUtils';
import { MarkdownProcessor } from '../../services/MarkdownProcessor';

/**
 * ChatGPT Theme - Replication of ChatGPT's chat interface styling
 * Based on DOM reference: scripts/reference-html-dom/chatgpt-console-dom.html
 */
export class ChatGPTThemeRenderer implements ThemeRenderer {
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
    <div class="max-w-3xl mx-auto my-8">
        <h1 class="text-2xl font-semibold text-center text-gray-200 mb-8">${escapeHtml(title)}</h1>

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

        <div class="space-y-6 flex flex-col w-full">
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

        const contentHtml = MarkdownProcessor.convertMarkdownToHtml(message.content, !isPrompt);

        if (isPrompt) {
            // User message - ChatGPT style bubble on the right
            return `
        <div class="flex justify-end mb-4 w-full" data-message-index="${index}">
          <div class="${messageClasses}">
            <div class="whitespace-pre-wrap">${contentHtml}</div>
          </div>
        </div>
      `;
        } else {
            // Assistant message - full width with markdown styling
            return `
        <article class="w-full mb-6" data-message-index="${index}" data-turn="assistant">
          <div class="${messageClasses}">
            <div class="markdown prose dark:prose-invert w-full break-words">${contentHtml}</div>
          </div>
        </article>
      `;
        }
    }

    generateThoughtBlockHtml(content: string): string {
        const thoughtHtml = MarkdownProcessor.convertMarkdownToHtml(content, false);

        return `
      <details class="chatgpt-thought-block my-4">
        <summary class="chatgpt-thought-summary">
          <span>💭</span>
          <span>Thinking...</span>
        </summary>
        <div class="chatgpt-thought-content">
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
          font-family: Söhne, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;
        }

        /* ChatGPT-specific typography */
        .markdown-content p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .markdown-content code.inline-code {
          background: rgba(0, 0, 0, 0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: Söhne Mono, ui-monospace, monospace;
          font-size: 0.875em;
        }

        .markdown-content pre {
          background: #1e1e1e;
          border-radius: 1rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
          font-family: Söhne Mono, ui-monospace, monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .markdown-content pre code {
          background: transparent;
          padding: 0;
          border-radius: 0;
        }

        /* ChatGPT thought block styling */
        .chatgpt-thought-block {
          background: #2f2f2f;
          border: 1px solid #3f3f3f;
          border-radius: 0.75rem;
          margin: 1rem 0;
          overflow: hidden;
        }

        .chatgpt-thought-summary {
          background: #1f1f1f;
          padding: 0.75rem 1rem;
          cursor: pointer;
          font-weight: 600;
          color: #e5e5e5;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .chatgpt-thought-content {
          padding: 1rem;
          color: #d1d5db;
          font-size: 0.875rem;
          line-height: 1.5;
        }
      }
    `;
    }
}

// ChatGPT theme classes - replication of ChatGPT's visual design
export const ChatGPTThemeClasses: PlatformThemeClasses = {
    // Base HTML structure
    htmlClass: 'dark',
    bodyBg: 'bg-[#212121]', // ChatGPT's dark background
    bodyText: 'text-gray-200',
    containerBg: 'bg-transparent',
    titleText: 'text-gray-200',

    // Platform-specific CSS
    platformStyles: '',

    // Message styling functions - ChatGPT's exact appearance
    getUserMessageClasses: () => 'user-message-bubble-color rounded-[18px] px-4 py-2 max-w-[70%] bg-[#2f2f2f] text-gray-200',
    getAssistantMessageClasses: () => 'w-full',

    // Special elements
    thoughtBlockClasses: 'chatgpt-thought-block',
    codeBlockClasses: 'chatgpt-code-block',
    copyButtonClasses: 'chatgpt-copy-button',
};

// ChatGPT theme renderer instance
export const ChatGPTThemeRendererInstance = new ChatGPTThemeRenderer(ChatGPTThemeClasses);
