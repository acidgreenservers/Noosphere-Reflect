import { ChatData, ChatMessage, ChatTheme, ChatMetadata, ParserMode } from '../../../../types';
import { PlatformThemeClasses, ThemeRenderer } from '../base/ThemeTypes';
import { escapeHtml, sanitizeUrl } from '../../../../utils/securityUtils';
import { MarkdownProcessor } from '../../services/MarkdownProcessor';

/**
 * Grok Theme - Replication of xAI Grok's chat interface styling
 * Based on DOM reference: scripts/reference-html-dom/grok-console-dom.html
 */
export class GrokThemeRenderer implements ThemeRenderer {
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
        <h1 class="text-2xl font-bold text-center text-white mb-8">${escapeHtml(title)}</h1>

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
        <div class="text-center text-xs text-gray-500 opacity-50 mt-16 pt-8 border-t border-neutral-800">
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

        // Handle thought blocks for Grok
        if (!isPrompt && message.content.includes('<thoughts>')) {
            const parts = message.content.split(/(<thoughts>[\s\S]*?<\/thought>)/);
            const contentHtml = parts.map(part => {
                if (part.startsWith('<thoughts>') && part.endsWith('</thoughts>')) {
                    const thoughtContent = part.replace(/<\/?thought>/g, '').trim();
                    return this.generateThoughtBlockHtml(thoughtContent);
                }
                return MarkdownProcessor.convertMarkdownToHtml(part, true);
            }).join('');

            return `
        <div class="${messageClasses}" data-message-index="${index}">
          <div class="response-content-markdown markdown">${contentHtml}</div>
        </div>
      `;
        }

        const contentHtml = MarkdownProcessor.convertMarkdownToHtml(message.content, !isPrompt);

        return `
      <div class="${messageClasses}" data-message-index="${index}">
        <div class="response-content-markdown markdown" dir="auto">
          ${contentHtml}
        </div>
      </div>
    `;
    }

    generateThoughtBlockHtml(content: string): string {
        const thoughtHtml = MarkdownProcessor.convertMarkdownToHtml(content, false);

        return `
      <details class="grok-thought-block my-4">
        <summary class="grok-thought-summary">
          <span>💭</span>
          <span>Thinking...</span>
        </summary>
        <div class="grok-thought-content">
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
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .response-content-markdown p {
          margin: 0.5rem 0;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .response-content-markdown code.inline-code {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, monospace;
          font-size: 0.875em;
        }

        .response-content-markdown pre {
          background: #000;
          border: 1px solid #3f3f3f;
          border-radius: 0.75rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
        }

        /* Grok thought block styling */
        .grok-thought-block {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid #374151;
          border-radius: 0.75rem;
          margin: 1rem 0;
          overflow: hidden;
        }

        .grok-thought-summary {
          background: #0f0f23;
          padding: 0.75rem 1rem;
          cursor: pointer;
          font-weight: 600;
          color: #a78bfa;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .grok-thought-content {
          padding: 1rem;
          color: #c4b5fd;
          font-size: 0.875rem;
          line-height: 1.6;
          font-style: italic;
        }

        /* Grok user message styling */
        .grok-user-message {
          background: #1e1e2e;
          border-radius: 0.75rem;
          padding: 1rem;
          margin: 0.5rem 0;
          max-width: 80%;
          margin-left: auto;
        }

        /* Grok assistant message styling */
        .grok-assistant-message {
          padding: 1rem 0;
          margin: 0.5rem 0;
        }
      }
    `;
    }
}

// Grok theme classes - replication of xAI Grok's visual design
export const GrokThemeClasses: PlatformThemeClasses = {
    htmlClass: 'dark',
    bodyBg: 'bg-[#0a0a0a]', // Grok's dark background
    bodyText: 'text-gray-200',
    containerBg: 'bg-transparent',
    titleText: 'text-white',

    platformStyles: '',

    getUserMessageClasses: () => 'grok-user-message',
    getAssistantMessageClasses: () => 'grok-assistant-message',

    thoughtBlockClasses: 'grok-thought-block',
    codeBlockClasses: 'grok-code-block',
    copyButtonClasses: 'grok-copy-button',
};

export const GrokThemeRendererInstance = new GrokThemeRenderer(GrokThemeClasses);
