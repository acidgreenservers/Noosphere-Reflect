import { ChatData, ChatMessage, ChatTheme, ChatMetadata, ParserMode } from '../../../../types';
import { PlatformThemeClasses, ThemeRenderer } from '../base/ThemeTypes';
import { escapeHtml, sanitizeUrl } from '../../../../utils/securityUtils';
import { MarkdownProcessor } from '../../services/MarkdownProcessor';

/**
 * LeChat Theme - Replication of Mistral's LeChat interface styling
 * Based on DOM reference: scripts/reference-html-dom/lechat-console-dom.html
 */
export class LeChatThemeRenderer implements ThemeRenderer {
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
        <h1 class="text-lg font-medium text-center text-teal-400 mb-8">${escapeHtml(title)}</h1>

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

        <div class="space-y-4 flex flex-col w-full">
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
            // User message - LeChat style pill on right
            return `
        <div class="flex justify-end w-full" data-message-index="${index}">
          <div class="${messageClasses}">
            <div class="whitespace-pre-wrap select-text">${contentHtml}</div>
          </div>
        </div>
      `;
        } else {
            // Assistant message - full width with icon
            return `
        <div class="${messageClasses}" data-message-index="${index}">
          <div class="flex w-full flex-col pb-4">
            <div class="markdown-content">${contentHtml}</div>
          </div>
        </div>
      `;
        }
    }

    generateThoughtBlockHtml(content: string): string {
        const thoughtHtml = MarkdownProcessor.convertMarkdownToHtml(content, false);

        return `
      <details class="lechat-thought-block my-4">
        <summary class="lechat-thought-summary">
          <span>💭</span>
          <span>Thinking...</span>
        </summary>
        <div class="lechat-thought-content">
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
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }

        .markdown-content p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .markdown-content code.inline-code {
          background: rgba(20, 184, 166, 0.2);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, monospace;
          font-size: 0.875em;
          color: #5eead4;
        }

        .markdown-content pre {
          background: #1a1a2e;
          border: 1px solid #374151;
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
        }

        /* LeChat user message styling */
        .lechat-user-message {
          background: rgba(75, 85, 99, 0.4);
          border-radius: 1.5rem;
          padding: 0.625rem 1.25rem;
          max-width: 80%;
        }

        /* LeChat assistant message styling */
        .lechat-assistant-message {
          padding: 0.5rem 0;
        }

        /* LeChat thought block styling */
        .lechat-thought-block {
          background: linear-gradient(135deg, #0f766e 0%, #134e4a 100%);
          border-radius: 0.5rem;
          margin: 1rem 0;
          overflow: hidden;
        }

        .lechat-thought-summary {
          background: #0d9488;
          padding: 0.75rem 1rem;
          cursor: pointer;
          font-weight: 500;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lechat-thought-content {
          padding: 1rem;
          color: #ccfbf1;
          font-size: 0.875rem;
          line-height: 1.6;
        }
      }
    `;
    }
}

// LeChat theme classes - replication of Mistral's LeChat visual design
export const LeChatThemeClasses: PlatformThemeClasses = {
    htmlClass: 'dark',
    bodyBg: 'bg-[#0f0f0f]', // LeChat's dark background
    bodyText: 'text-gray-200',
    containerBg: 'bg-transparent',
    titleText: 'text-teal-400',

    platformStyles: '',

    getUserMessageClasses: () => 'lechat-user-message',
    getAssistantMessageClasses: () => 'lechat-assistant-message',

    thoughtBlockClasses: 'lechat-thought-block',
    codeBlockClasses: 'lechat-code-block',
    copyButtonClasses: 'lechat-copy-button',
};

export const LeChatThemeRendererInstance = new LeChatThemeRenderer(LeChatThemeClasses);
