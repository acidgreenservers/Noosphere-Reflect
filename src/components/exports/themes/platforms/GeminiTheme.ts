import { ChatData, ChatMessage, ChatTheme, ChatMetadata, ParserMode } from '../../../../types';
import { PlatformThemeClasses, ThemeRenderer } from '../base/ThemeTypes';
import { escapeHtml, sanitizeUrl } from '../../../../utils/securityUtils';
import { MarkdownProcessor } from '../../services/MarkdownProcessor';

/**
 * Gemini Theme - Replication of Google AI Studio (Gemini) interface styling
 * Based on DOM reference: scripts/reference-html-dom/gemini-aistudio-console-dom.html
 */
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
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
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
    <div class="max-w-4xl mx-auto my-8">
        <h1 class="text-2xl font-medium text-center text-blue-400 mb-8">${escapeHtml(title)}</h1>

        <!-- Metadata Section -->
        <div class="text-center text-sm text-gray-400 mb-8 space-y-1">
            ${metadata?.model ? `<div><strong>🤖 Model:</strong> ${escapeHtml(metadata.model)}</div>` : ''}
            ${metadata?.date ? `<div><strong>📅 Date:</strong> ${escapeHtml(new Date(metadata.date).toLocaleString())}</div>` : ''}
            ${metadata?.sourceUrl ? (() => {
        const safeUrl = sanitizeUrl(metadata.sourceUrl);
        return safeUrl ? `<div><strong>🌐 Source:</strong> <a href="${escapeHtml(safeUrl)}" class="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">${escapeHtml(safeUrl)}</a></div>` : '';
      })() : ''}
            ${metadata?.tags && metadata.tags.length > 0 ? `<div><strong>🏷️ Tags:</strong> ${metadata.tags.map(tag => escapeHtml(tag)).join(', ')}</div>` : ''}
        </div>

        <div class="space-y-0 flex flex-col w-full">
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

    // Handle thought blocks for Gemini
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
          <div class="turn-header">${aiName}</div>
          ${contentHtml}
        </div>
        <hr class="gemini-divider" />
      `;
    }

    const contentHtml = MarkdownProcessor.convertMarkdownToHtml(message.content, !isPrompt);
    const header = isPrompt ? userName : aiName;

    return `
      <div class="${messageClasses}" data-message-index="${index}">
        <div class="turn-header">${escapeHtml(header)}</div>
        <div class="turn-content">${contentHtml}</div>
      </div>
      <hr class="gemini-divider" />
    `;
  }

  generateThoughtBlockHtml(content: string): string {
    const thoughtHtml = MarkdownProcessor.convertMarkdownToHtml(content, false);

    return `
      <details class="gemini-thought-block my-4" open>
        <summary class="gemini-thought-summary">
          <span class="material-symbols-outlined" style="font-size: 20px;">lightbulb</span>
          <span>Thinking...</span>
          <span class="material-symbols-outlined chevron">chevron_right</span>
        </summary>
        <div class="gemini-thought-content">
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
          font-family: 'Google Sans', Roboto, Arial, sans-serif;
        }

        .turn-header {
          font-weight: 500;
          font-size: 0.875rem;
          color: #8ab4f8;
          margin-bottom: 0.5rem;
        }

        .turn-content p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .gemini-divider {
          border: none;
          border-top: 1px solid #3c4043;
          margin: 1rem 0;
        }

        /* Gemini thought block styling */
        .gemini-thought-block {
          background: linear-gradient(180deg, #1a237e 0%, #0d1421 100%);
          border: 1px solid #3949ab;
          border-radius: 0.5rem;
          margin: 1rem 0;
          overflow: hidden;
        }

        .gemini-thought-summary {
          background: #1a237e;
          padding: 0.75rem 1rem;
          cursor: pointer;
          font-weight: 500;
          color: #90caf9;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          list-style: none;
        }

        .gemini-thought-summary::-webkit-details-marker {
          display: none;
        }

        .gemini-thought-summary .chevron {
          margin-left: auto;
          transition: transform 0.2s;
        }

        .gemini-thought-block[open] .gemini-thought-summary .chevron {
          transform: rotate(90deg);
        }

        .gemini-thought-content {
          padding: 1rem;
          color: #b3e5fc;
          font-size: 0.875rem;
          line-height: 1.6;
        }

        /* User turn styling */
        .gemini-user-turn {
          padding: 1rem;
          background: #1e2936;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }

        /* Assistant turn styling */
        .gemini-assistant-turn {
          padding: 1rem;
          margin: 0.5rem 0;
        }

        .inline-code {
          background: rgba(66, 133, 244, 0.2);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Roboto Mono', monospace;
          font-size: 0.875em;
          color: #8ab4f8;
        }
      }
    `;
  }
}

// Gemini theme classes - replication of Google AI Studio visual design
export const GeminiThemeClasses: PlatformThemeClasses = {
  htmlClass: 'dark',
  bodyBg: 'bg-[#1e2936]', // Gemini's dark blue-gray background
  bodyText: 'text-gray-200',
  containerBg: 'bg-transparent',
  titleText: 'text-blue-400',

  platformStyles: '',

  getUserMessageClasses: () => 'gemini-user-turn',
  getAssistantMessageClasses: () => 'gemini-assistant-turn',

  thoughtBlockClasses: 'gemini-thought-block',
  codeBlockClasses: 'gemini-code-block',
  copyButtonClasses: 'gemini-copy-button',
};

export const GeminiThemeRendererInstance = new GeminiThemeRenderer(GeminiThemeClasses);
