import { ChatData, ChatMessageType, ChatTheme, ThemeClasses, ParserMode, ChatMetadata } from '../../../types';
import { escapeHtml, sanitizeUrl } from '../../../utils/securityUtils';
import { themeRegistry } from '../themes';
import { MarkdownProcessor } from './MarkdownProcessor';

// Define theme classes (moved from converterService.ts)
const themeMap: Record<ChatTheme, ThemeClasses> = {
  [ChatTheme.DarkDefault]: {
    htmlClass: 'dark',
    bodyBg: 'bg-gray-900',
    bodyText: 'text-gray-100',
    containerBg: 'bg-gray-800',
    titleText: 'text-blue-400',
    promptBg: 'bg-blue-700',
    responseBg: 'bg-gray-700',
    blockquoteBorder: 'border-gray-500',
    codeBg: 'bg-gray-800',
    codeText: 'text-yellow-300',
  },
  [ChatTheme.LightDefault]: {
    htmlClass: '',
    bodyBg: 'bg-gray-50',
    bodyText: 'text-gray-900',
    containerBg: 'bg-white',
    titleText: 'text-blue-600',
    promptBg: 'bg-blue-200',
    responseBg: 'bg-gray-200',
    blockquoteBorder: 'border-gray-400',
    codeBg: 'bg-gray-100',
    codeText: 'text-purple-700',
  },
  [ChatTheme.DarkGreen]: {
    htmlClass: 'dark',
    bodyBg: 'bg-gray-900',
    bodyText: 'text-gray-100',
    containerBg: 'bg-gray-800',
    titleText: 'text-green-400',
    promptBg: 'bg-green-700',
    responseBg: 'bg-gray-700',
    blockquoteBorder: 'border-gray-500',
    codeBg: 'bg-gray-800',
    codeText: 'text-yellow-300',
  },
  [ChatTheme.DarkPurple]: {
    htmlClass: 'dark',
    bodyBg: 'bg-gray-900',
    bodyText: 'text-gray-100',
    containerBg: 'bg-gray-800',
    titleText: 'text-purple-400',
    promptBg: 'bg-purple-700',
    responseBg: 'bg-gray-700',
    blockquoteBorder: 'border-gray-500',
    codeBg: 'bg-gray-800',
    codeText: 'text-yellow-300',
  },
  [ChatTheme.Claude]: {
    htmlClass: 'dark',
    bodyBg: 'bg-gray-900',
    bodyText: 'text-gray-100',
    containerBg: 'bg-gray-800',
    titleText: 'text-blue-400',
    promptBg: 'bg-blue-700',
    responseBg: 'bg-gray-700',
    blockquoteBorder: 'border-gray-500',
    codeBg: 'bg-gray-800',
    codeText: 'text-yellow-300',
  },
};

/**
 * Wrapper function to use consolidated MarkdownProcessor
 */
const convertMarkdownToHtml = (markdown: string, enableThoughts: boolean): string => {
  return MarkdownProcessor.convertMarkdownToHtml(markdown, enableThoughts);
};

/**
 * HTML Generator class - handles HTML export generation
 */
export class HtmlGenerator {
  /**
   * Generates a standalone HTML file content from ChatData.
   * @param chatData The structured chat data.
   * @param title The title for the generated HTML file.
   * @param theme The chosen theme for the HTML output.
   * @param userName Custom name for the user in the output.
   * @param aiName Custom name for the AI in the output.
   * @param parserMode The parser mode used (affects structure/collapsibility)
   * @param metadata Optional metadata to include in the output
   * @param includeFooter Whether to include the footer
   * @param isPreview Whether this is for preview mode
   * @returns A string containing the full HTML content.
   */
  generateHtml(
    chatData: ChatData,
    title: string = 'AI Chat Export',
    theme: ChatTheme = ChatTheme.DarkDefault,
    userName: string = 'User',
    aiName: string = 'AI',
    parserMode: ParserMode = ParserMode.Basic,
    metadata?: ChatMetadata,
    includeFooter: boolean = true,
    isPreview: boolean = false
  ): string {
    // Check if this is a platform theme and delegate to the new theme system
    const platformTheme = themeRegistry.get(theme);
    if (platformTheme) {
      return platformTheme.renderer.generateHtml(
        chatData,
        title,
        userName,
        aiName,
        parserMode,
        metadata,
        includeFooter,
        isPreview
      );
    }

    // Fall back to legacy theme system for backward compatibility
    const selectedThemeClasses = themeMap[theme];
    const {
      htmlClass,
      bodyBg,
      bodyText,
      containerBg,
      titleText,
      promptBg,
      responseBg,
      blockquoteBorder,
      codeBg,
      codeText,
    } = selectedThemeClasses;

    const enableThoughts = [ParserMode.ClaudeHtml, ParserMode.LeChatHtml, ParserMode.LlamacoderHtml, ParserMode.ChatGptHtml, ParserMode.GeminiHtml].includes(parserMode);

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
      .map((message, index) => {
        const isPrompt = message.type === ChatMessageType.Prompt;

        // GEMINI-SPECIFIC: Check if this is a thought block (wrapped in <thoughts> tags)
        const thoughtMatch = message.content.match(/<thoughts>([\s\S]*?)<\/thought>/);
        const isGeminiThought = parserMode === ParserMode.GeminiHtml && thoughtMatch;

        // For Gemini thoughts, extract and render as a special chat bubble
        if (isGeminiThought) {
          const thoughtContent = thoughtMatch[1].trim();
          const thoughtHtml = convertMarkdownToHtml(thoughtContent, false);

          return `
          <div class="flex justify-start mb-4 w-full" data-message-index="${index}">
            <div class="max-w-xl md:max-w-2xl lg:max-w-3xl rounded-xl p-4 shadow-lg bg-purple-900 text-gray-200 break-words w-auto border-l-4 border-purple-500">
              <div class="flex items-center gap-2 mb-2">
                <p class="font-semibold text-sm opacity-80">💭 Thought</p>
              </div>
              <div class="markdown-content text-sm italic">${thoughtHtml}</div>
            </div>
          </div>
          `;
        }

        // Regular message rendering
        const bgColor = isPrompt ? promptBg : responseBg;
        const justify = isPrompt ? 'justify-end' : 'justify-start';
        const speakerName = isPrompt ? userName : aiName; // Use custom names
        const messageNumber = index + 1; // Message numbering starts at 1
        const headerType = isPrompt ? 'Prompt' : 'Response';

        // For Gemini responses with thoughts: strip the <thoughts> tags before rendering
        // so the response only shows the main content (thought is shown separately above)
        let contentToRender = message.content;
        if (parserMode === ParserMode.GeminiHtml) {
          contentToRender = contentToRender.replace(/<thoughts>[\s\S]*?<\/thought>\s*/g, '').trim();
        }

        // Apply theme-specific classes to code blocks and blockquotes generated by convertMarkdownToHtml
        const contentHtml = convertMarkdownToHtml(contentToRender, enableThoughts)
          .replace(/<pre class="p-2 bg-gray-900 rounded-md my-2 overflow-x-auto">/g, `<pre class="p-2 ${codeBg} rounded-md my-2 overflow-x-auto">`)
          .replace(/<code class="language-/g, `<code class="${codeText} language-`) // For fenced code blocks
          .replace(/<code class="inline-code">/g, `<code class="${codeBg} ${codeText} px-1 py-0.5 rounded text-sm">`) // For inline code
          .replace(/<blockquote class="border-l-4 border-gray-500 pl-4 italic my-2">/g, `<blockquote class="border-l-4 ${blockquoteBorder} pl-4 italic text-gray-300 my-2">`)
          // Apply theme-specific classes to the collapsible thought block (only if present)
          .replace(/<details class="markdown-thought-block my-4">/g, `<details class="markdown-thought-block my-4">`) // Base details tag
          .replace(/<summary class="markdown-thought-summary/g, `<summary class="markdown-thought-summary bg-gray-600 text-gray-200 hover:bg-gray-500 active:bg-gray-700`) // Summary
          .replace(/<div class="markdown-thought-content/g, `<div class="markdown-thought-content bg-gray-700 text-gray-100 border-gray-600`); // Content div

        // Check for artifacts linked to this message
        // Prefer direct message artifacts, fall back to metadata index matching (legacy)
        const linkedArtifacts = message.artifacts || metadata?.artifacts?.filter(
          artifact => artifact.insertedAfterMessageIndex === index
        ) || [];

        // Generate artifact HTML if any are linked
        const artifactsHtml = linkedArtifacts.length > 0 ? `
          <div class="mt-4 pt-3 border-t border-gray-600">
            <p class="text-xs text-gray-400 mb-2">📎 Attached Files:</p>
            ${linkedArtifacts.map(artifact => {
          const isImage = artifact.mimeType.startsWith('image/');

          // Context-aware linking:
          // Preview: Use Data URI + download attribute (Force download)
          // Export: Use relative path (Navigate)
          const href = isPreview
            ? `javascript:void(0)`
            : `artifacts/${escapeHtml(artifact.fileName)}`;

          const downloadAttr = isPreview ? `download="${escapeHtml(artifact.fileName)}"` : '';
          const targetAttr = isPreview ? '' : 'target="_blank"';

          // In preview, we use a script (onclick) to handle the download via Blob URL
          // because direct navigation to Data URIs or even target="_blank" is often blocked by sandbox/browser security.
          const dataAttrs = isPreview ? `data-b64="${artifact.fileData}" data-mime="${artifact.mimeType}" onclick="downloadArtifact(event)"` : '';

          if (isImage) {
            return `
                <div class="mb-2">
                  <a href="${href}" ${downloadAttr} ${targetAttr} ${dataAttrs} class="text-blue-400 hover:underline text-sm">
                    ${escapeHtml(artifact.fileName)}
                  </a>
                  <img src="${isPreview ? `data:${artifact.mimeType};base64,${artifact.fileData}` : `artifacts/${escapeHtml(artifact.fileName)}`}" alt="${escapeHtml(artifact.fileName)}" class="mt-2 max-w-full rounded border border-gray-600" style="max-height: 300px;" />
                </div>
              `;
          } else {
            return `
                <div class="mb-1">
                  <a href="${href}" ${downloadAttr} ${targetAttr} ${dataAttrs} class="text-blue-400 hover:underline text-sm flex items-center gap-2">
                    <span>📄</span>
                    <span>${escapeHtml(artifact.fileName)}</span>
                    <span class="text-xs text-gray-500">(${(artifact.fileSize / 1024).toFixed(1)} KB)</span>
                  </a>
                </div>
              `;
          }
        }).join('')}
          </div>
        ` : '';

        return `
          <div class="flex ${justify} mb-4 w-full" data-message-index="${index}">
            <div class="max-w-xl md:max-w-2xl lg:max-w-3xl rounded-xl p-4 shadow-lg ${bgColor} text-white break-words w-auto">
              <div class="flex items-center gap-2 mb-2">
                <p class="font-semibold text-sm opacity-80">${headerType} - ${escapeHtml(speakerName)}</p>
              </div>
              <div class="markdown-content">${contentHtml}</div>
              ${artifactsHtml}
            </div>
          </div>
        `;
      })
      .join('');

    const scrollbarTrack = htmlClass === 'dark' ? '#1a202c' : '#e2e8f0'; // Darker track for dark, lighter for light
    const scrollbarThumb = htmlClass === 'dark' ? '#4a5568' : '#cbd5e0'; // Gray thumb for dark, lighter gray for light
    const scrollbarThumbHover = htmlClass === 'dark' ? '#6b7280' : '#a0aec0'; // Lighter gray on hover

    return `<!DOCTYPE html>
<html lang="en" class="${htmlClass}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <!-- Tailwind CSS CDN for offline viewing -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style type="text/tailwindcss">
      @layer base {
        body {
          @apply ${bodyBg} ${bodyText} font-sans leading-relaxed;
        }
        strong {
            @apply font-bold;
        }
        em {
            @apply italic;
        }
        a {
            @apply text-blue-400 hover:underline;
        }
        code { /* Default for pre > code */
            @apply ${codeBg} ${codeText} px-1 py-0.5 rounded text-sm;
        }
        code.inline-code { /* Specific for inline code */
            @apply ${codeBg} ${codeText} px-1 py-0.5 rounded text-sm;
        }
        pre > code { /* For code blocks */
            @apply block p-2 ${codeBg} rounded-md overflow-x-auto ${codeText};
        }
        blockquote {
            @apply border-l-4 ${blockquoteBorder} pl-4 italic text-gray-300 my-2;
        }
        .markdown-content ul, .markdown-content ol {
            @apply list-inside ml-4 my-2;
        }
        .markdown-content ul {
            @apply list-disc;
        }
        .markdown-content ol {
            @apply list-decimal;
        }
        .markdown-content li {
            @apply mb-1;
        }
        .markdown-content table {
            @apply min-w-full divide-y divide-gray-700 my-4 table-auto border-collapse;
        }
        .markdown-content thead {
            @apply bg-gray-700;
        }
        .markdown-content th, .markdown-content td {
            @apply px-3 py-2 text-sm text-gray-100 border border-gray-600;
        }
        .markdown-content th {
            @apply text-xs font-medium text-gray-200 uppercase tracking-wider text-left;
        }
        .markdown-content tbody tr:nth-child(odd) {
            @apply bg-gray-800;
        }
        .markdown-content tbody tr:nth-child(even) {
            @apply bg-gray-700;
        }

        /* Thought Block Styles (dependent on parser mode) */
        .markdown-content .markdown-thought-summary {
            @apply bg-gray-600 text-gray-200 hover:bg-gray-500 active:bg-gray-700 transition-colors;
        }
        .markdown-content .markdown-thought-content {
            @apply bg-gray-700 text-gray-100 border-gray-600;
        }
        .markdown-thought-block summary::marker {
            content: '► '; /* Custom marker for collapsed state */
            @apply text-gray-400;
        }
        .markdown-thought-block[open] summary::marker {
            content: '▼ '; /* Custom marker for expanded state */
        }

        /* New Markdown Element Styles */
        .markdown-content h1 { @apply text-3xl font-extrabold mt-6 mb-4 text-blue-300; }
        .markdown-content h2 { @apply text-2xl font-bold mt-5 mb-3 text-blue-200; }
        .markdown-content h3 { @apply text-xl font-semibold mt-4 mb-2 text-blue-100; }
        .markdown-content h4 { @apply text-lg font-medium mt-3 mb-2; }
        .markdown-content h5 { @apply text-base font-medium mt-2 mb-1; }
        .markdown-content h6 { @apply text-sm font-medium mt-2 mb-1; }

        .markdown-content hr {
            @apply my-6 border-t-2 border-gray-600;
        }

        .markdown-content img.responsive-image {
            @apply max-w-full h-auto rounded-md my-2;
        }
        .markdown-content p {
            /* Default paragraph spacing, Tailwind's default applies some margin */
            @apply my-2;
        }
      }
      /* Custom scrollbar styles based on theme */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: ${scrollbarTrack};
      }
      ::-webkit-scrollbar-thumb {
        background: ${scrollbarThumb};
        border-radius: 4px;
      }
    </style>
    <!-- MathJax for rendering equations -->
    <script>
      window.MathJax = {
        tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
        svg: { fontCache: 'global' },
        startup: {
            typeset: false // We will typeset manually if needed, or rely on auto - auto is default actually
        }
      };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
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
<body class="p-8">
    <div class="max-w-4xl mx-auto my-8 p-6 ${containerBg} rounded-lg shadow-xl">
        <h1 class="text-4xl font-extrabold text-center ${titleText} mb-4">${escapeHtml(title)}</h1>

        <!-- Metadata Section -->
        <div class="text-center text-sm ${bodyText} opacity-70 mb-8 space-y-1">
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
        <!-- Noosphere Footer -->
        <div class="text-center text-xs ${bodyText} opacity-50 mt-16 pt-8 border-t border-gray-700">
            <p class="mt-8"><strong>Noosphere Reflect</strong></p>
            <p class="text-xs italic">${'Preserving Meaning Through Memory'}</p>
        </div>
        ` : ''}
    </div>

    ${previewScript}
</body>
</html>`;
  }
}

// Export singleton instance
export const htmlGenerator = new HtmlGenerator();