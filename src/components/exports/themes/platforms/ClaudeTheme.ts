import { ChatData, ChatMessage, ChatTheme, ChatMetadata, ParserMode } from '../../../../types';
import { PlatformThemeClasses, ThemeRenderer } from '../base/ThemeTypes';
import { escapeHtml, sanitizeUrl } from '../../../../utils/securityUtils';

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

    const safeUrl = metadata?.sourceUrl ? sanitizeUrl(metadata.sourceUrl) : '';

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        claude: {
                            bg: '#1b1b1b',
                            header: '#1b1b1b',
                            card: '#242424',
                            cardHover: '#2a2a2a',
                            border: '#333333',
                            text: '#e3e2e0',
                            muted: '#8e8d8a',
                            codeBg: '#141414',
                            badge: '#2d2d2d',
                            button: '#ffffff',
                            buttonText: '#1b1b1b'
                        }
                    },
                    fontFamily: {
                        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
                        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
                        mono: ['Consolas', 'Monaco', '"Andale Mono"', '"Ubuntu Mono"', 'monospace']
                    }
                }
            }
        }
    </script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        /* Custom scrollbar matching Claude dark UI */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #1b1b1b;
        }

        ::-webkit-scrollbar-thumb {
            background: #333333;
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #444444;
        }

        /* Editorial typography refinements */
        .claude-prose {
            font-family: Georgia, Cambria, "Times New Roman", Times, serif;
            font-size: 1.0625rem;
            line-height: 1.7;
            color: #e3e2e0;
            letter-spacing: -0.011em;
            word-break: break-word;
            overflow-wrap: break-word;
        }

        .claude-prose p {
            margin-bottom: 1.35em;
        }

        .claude-prose pre {
            background: #141414;
            border: 1px solid #333333;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1.5rem 0;
            overflow-x: auto;
            font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            color: #e3e2e0;
        }

        .claude-prose code.inline-code {
            background: rgba(255, 255, 255, 0.1);
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
            font-size: 0.875em;
        }

        /* Smooth expand/collapse transition for user prompt bubble */
        .expandable-content {
            transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
    </style>
</head>

<body
    class="bg-claude-bg text-claude-text font-sans antialiased min-h-screen flex flex-col justify-between selection:bg-stone-700 selection:text-white">

    <!-- Top Header -->
    <header
        class="sticky top-0 z-30 bg-claude-header/90 backdrop-blur-md border-b border-claude-border/40 px-4 py-3 sm:px-6 transition-colors">
        <div class="max-w-5xl mx-auto flex items-center justify-between">
            <!-- Left: Conversation Title -->
            <div class="flex items-center space-x-3 truncate pr-4">
                <span class="text-xs sm:text-sm font-normal text-claude-muted truncate tracking-tight">
                    ${escapeHtml(title)}
                </span>
            </div>

            <!-- Right: Export Tag Badge -->
            <div class="flex items-center space-x-2 flex-shrink-0">
                <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-claude-badge text-claude-text border border-claude-border/50">
                    Exported by <span class="font-semibold text-white ml-1">${escapeHtml(userName)}</span>
                </span>
            </div>
        </div>
    </header>

    <!-- Main Content Stream Container -->
    <main class="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 pt-6 pb-12">

        <!-- Metadata Context Banner -->
        <div
            class="mb-6 rounded-xl bg-[#222222]/80 border border-claude-border/50 p-3 sm:p-3.5 text-xs text-stone-400 flex items-center justify-between shadow-sm">
            <div class="flex items-start sm:items-center space-x-2.5">
                <i data-lucide="info" class="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5 sm:mt-0"></i>
                <div class="leading-normal space-y-1">
                    <p>
                        This is an exported conversation between <span class="text-stone-200 font-medium">${escapeHtml(userName)}</span> &amp;
                        <span class="text-stone-200 font-medium">${escapeHtml(aiName)}</span>.
                    </p>
                    <p class="text-stone-500">
                        ${metadata?.model ? `Model: <span class="text-stone-300 font-medium">${escapeHtml(metadata.model)}</span> <span class="mx-1">•</span> ` : ''}
                        ${metadata?.date ? `Date: <span class="text-stone-300">${escapeHtml(new Date(metadata.date).toLocaleString())}</span> <span class="mx-1">•</span> ` : ''}
                        ${metadata?.tags && metadata.tags.length > 0 ? `Tags: <span class="text-stone-300">${metadata.tags.map(tag => escapeHtml(tag)).join(', ')}</span> <span class="mx-1">•</span> ` : ''}
                        ${safeUrl ? `<a href="${safeUrl}" target="_blank" class="underline hover:text-stone-200">Source Link</a>` : ''}
                    </p>
                </div>
            </div>
            <span
                class="text-[10px] uppercase tracking-wider text-stone-500 font-mono hidden sm:inline-block pl-2 flex-shrink-0">Noosphere
                Reflect</span>
        </div>

        ${chatMessagesHtml}

        ${includeFooter ? `
        <!-- End of Chat Anchor Button -->
        <div class="mt-16 pt-8 border-t border-claude-border/40 flex flex-col items-center justify-center space-y-3">
            <a href="https://github.com/acidgreenservers/Noosphere-Reflect" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-claude-buttonText font-medium text-sm hover:bg-stone-200 transition-all shadow-lg hover:shadow-xl group transform hover:-translate-y-0.5">
                <span>View on Noosphere Reflect</span>
                <i data-lucide="arrow-up-right"
                    class="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"></i>
            </a>
            <p class="text-xs text-claude-muted font-mono">
                Archived with Noosphere Reflect Engine
            </p>
        </div>
        ` : ''}

    </main>

    <!-- Scripts for Interactivity -->
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });

        function toggleUserMessage(index) {
            const container = document.getElementById('userTextContainer_' + index);
            const btnText = document.getElementById('toggleUserText_' + index);
            const overlay = document.getElementById('gradientOverlay_' + index);

            if (!container) return;

            if (container.classList.contains('max-h-[140px]')) {
                container.classList.remove('max-h-[140px]');
                container.classList.add('max-h-[10000px]');
                if (overlay) overlay.classList.add('opacity-0');
                if (btnText) btnText.innerText = 'Show less';
            } else {
                container.classList.remove('max-h-[10000px]');
                container.classList.add('max-h-[140px]');
                if (overlay) overlay.classList.remove('opacity-0');
                if (btnText) btnText.innerText = 'Show more';
            }
        }
        
        function toggleThoughtBlock(index) {
            const container = document.getElementById('thoughtContent_' + index);
            const checkIcon = document.getElementById('thoughtCheck_' + index);
            const chevron = document.getElementById('thoughtChevron_' + index);
            
            if (!container) return;
            
            const isClosed = container.classList.contains('max-h-[0px]');
            
            if (isClosed) {
                container.classList.remove('max-h-[0px]', 'opacity-0', 'mb-0');
                container.classList.add('max-h-[10000px]', 'opacity-100', 'mb-4');
                if (checkIcon) checkIcon.classList.remove('hidden');
                if (chevron) {
                    chevron.classList.remove('rotate-0');
                    chevron.classList.add('rotate-90');
                }
            } else {
                container.classList.remove('max-h-[10000px]', 'opacity-100', 'mb-4');
                container.classList.add('max-h-[0px]', 'opacity-0', 'mb-0');
                if (checkIcon) checkIcon.classList.add('hidden');
                if (chevron) {
                    chevron.classList.remove('rotate-90');
                    chevron.classList.add('rotate-0');
                }
            }
        }

        function triggerCopyFeedback(iconContainerId, sizeClass) {
            const container = document.getElementById(iconContainerId);
            if (!container) return;
            
            const originalHtml = container.innerHTML;

            container.innerHTML = \`<i data-lucide="check" class="\${sizeClass} text-stone-300"></i>\`;
            if (window.lucide) lucide.createIcons();

            setTimeout(() => {
                container.innerHTML = originalHtml;
                if (window.lucide) lucide.createIcons();
            }, 2000);
        }

        function copyPromptText(index) {
            const container = document.getElementById('userTextContainer_' + index);
            if (!container) return;
            const promptContent = container.innerText;
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = promptContent;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextArea);

            triggerCopyFeedback('userCopyIcon_' + index, 'w-3.5 h-3.5');
        }

        function copyMessageText(index) {
            const container = document.getElementById('aiMessageBody_' + index);
            if (!container) return;
            const text = container.innerText;
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = text;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextArea);

            triggerCopyFeedback('msgCopyIcon_' + index, 'w-4 h-4');
        }
        
        function copyCodeBlock(btn) {
            const pre = btn.nextElementSibling;
            if (pre) {
                const text = pre.innerText;
                const tempTextArea = document.createElement('textarea');
                tempTextArea.value = text;
                document.body.appendChild(tempTextArea);
                tempTextArea.select();
                document.execCommand('copy');
                document.body.removeChild(tempTextArea);
                
                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                setTimeout(() => { btn.innerText = originalText; }, 2000);
            }
        }
    </script>
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

    if (isPrompt) {
      const contentHtml = this.convertMarkdownToHtml(message.content, false);
      const dateStr = message.timestamp ? new Date(message.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
      
      return `
        <!-- User Message Bubble -->
        <div class="mb-8 relative">
            <div id="userBubble_${index}" class="bg-[#242424] border border-[#333333] rounded-2xl overflow-hidden p-4 sm:p-5 font-mono text-xs sm:text-sm text-stone-300 relative break-words">
                <div id="userTextContainer_${index}" class="expandable-content max-h-[140px] overflow-hidden whitespace-pre-wrap leading-relaxed" style="word-break: break-word;">${contentHtml}</div>
                <div id="gradientOverlay_${index}" class="absolute bottom-10 left-0 right-0 h-16 bg-gradient-to-t from-[#242424] via-[#242424]/80 to-transparent pointer-events-none transition-opacity duration-300"></div>
                <div class="mt-3 pt-2 flex items-center justify-between">
                    <button id="toggleUserBtn_${index}" onclick="toggleUserMessage(${index})" class="text-xs font-sans text-stone-400 hover:text-stone-200 transition-colors flex items-center space-x-1 font-medium focus:outline-none">
                        <span id="toggleUserText_${index}">Show more</span>
                    </button>
                </div>
            </div>
            <div class="mt-2 flex items-center justify-end space-x-2.5 text-xs text-stone-500 font-mono px-1">
                ${dateStr ? `<span>${dateStr}</span>` : ''}
                <button onclick="copyPromptText(${index})" class="hover:text-stone-300 transition-colors relative group" title="Copy prompt text">
                    <span id="userCopyIcon_${index}" class="inline-flex items-center justify-center">
                        <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                    </span>
                </button>
            </div>
        </div>
      `;
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

    return `
        <!-- AI Message -->
        <article id="aiMessageBody_${index}" class="claude-prose space-y-4">
            ${contentHtml}
        </article>
        
        <div class="mt-8 mb-8 flex items-center space-x-3 text-claude-muted border-b border-claude-border/20 pb-8">
            <button onclick="copyMessageText(${index})" class="p-1.5 rounded-md hover:bg-stone-800 hover:text-stone-200 transition-colors group relative" title="Copy response">
                <span id="msgCopyIcon_${index}" class="inline-flex items-center justify-center">
                    <i data-lucide="copy" class="w-4 h-4"></i>
                </span>
            </button>
        </div>
    `;
  }

  generateThoughtBlockHtml(content: string, messageIndex: number, thoughtIndex: number): string {
    const idSuffix = `${messageIndex}_${thoughtIndex}`;
    
    // Extract summary if present, otherwise use default
    let summary = "Thought process";
    let body = content;
    
    const lines = content.split('\n');
    if (lines.length > 1 && lines[0].length > 0 && lines[0].length < 100 && !lines[0].includes(' ')) {
      // It's probably just a word, ignore
    } else if (lines.length > 1 && lines[0].length > 0 && lines[0].length < 150) {
      summary = lines[0].trim();
      body = lines.slice(1).join('\n').trim();
    }
    
    const thoughtHtml = this.convertMarkdownToHtml(body, false);

    return `
        <div class="my-6 max-w-[85%] text-[0.95rem] font-sans">
            <!-- Thought Header -->
            <button onclick="toggleThoughtBlock('${idSuffix}')" class="flex items-center space-x-2 text-stone-400 hover:text-stone-300 transition-colors focus:outline-none w-full text-left">
                <i data-lucide="chevron-right" id="thoughtChevron_${idSuffix}" class="w-4 h-4 transition-transform duration-200 transform rotate-0"></i>
                <span class="font-medium">${escapeHtml(summary)}</span>
            </button>
            
            <!-- Collapsible Thought Body -->
            <div id="thoughtContent_${idSuffix}" class="expandable-content max-h-[0px] opacity-0 overflow-hidden ml-6 pl-4 border-l-2 border-[#333333] mt-3">
                <div class="flex items-start space-x-3 text-stone-400 mb-3">
                    <i data-lucide="clock" class="w-4 h-4 mt-1 flex-shrink-0"></i>
                    <div class="text-[0.9rem] leading-relaxed">${thoughtHtml}</div>
                </div>
                <div id="thoughtCheck_${idSuffix}" class="hidden flex items-center space-x-2 text-stone-500 mt-4 text-xs font-medium uppercase tracking-wider">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    <span>Done</span>
                </div>
            </div>
        </div>
    `;
  }

  getStyles(): string {
      return ''; // Styles moved to <style> tag in generateHtml
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
      return safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${text}</a>` : text;
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

export const ClaudeThemeClasses: PlatformThemeClasses = {
  htmlClass: 'dark',
  bodyBg: 'bg-[#1b1b1b]',
  bodyText: 'text-[#e3e2e0]',
  containerBg: 'bg-transparent',
  titleText: 'text-stone-300',
  platformStyles: '',
  getUserMessageClasses: () => '',
  getAssistantMessageClasses: () => '',
  thoughtBlockClasses: '',
  codeBlockClasses: '',
  copyButtonClasses: '',
};

export const ClaudeThemeRendererInstance = new ClaudeThemeRenderer(ClaudeThemeClasses);