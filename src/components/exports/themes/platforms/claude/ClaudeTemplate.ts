import { escapeHtml, sanitizeUrl } from '@/utils/securityUtils';
import { INTERACTIVE_SCRIPTS } from '@/components/exports/services/ClientScripts';
import { getClaudeHeadContent } from './ClaudeStyles';
import { ChatMetadata } from '@/types';

export function getClaudeBaseHtml(title: string, userName: string, aiName: string, chatMessagesHtml: string, metadata?: ChatMetadata, includeFooter: boolean = true): string {
    const safeUrl = metadata?.sourceUrl ? sanitizeUrl(metadata.sourceUrl) : '';
    
    const modelHtml = metadata?.model ? `Model: <span class="text-stone-300 font-medium">${escapeHtml(metadata.model)}</span> <span class="mx-1">•</span> ` : '';
    const dateHtml = metadata?.date ? `Date: <span class="text-stone-300">${escapeHtml(new Date(metadata.date).toLocaleString())}</span> <span class="mx-1">•</span> ` : '';
    const tagsHtml = metadata?.tags && metadata.tags.length > 0 ? `Tags: <span class="text-stone-300">${metadata.tags.map(tag => escapeHtml(tag)).join(', ')}</span> <span class="mx-1">•</span> ` : '';
    const linkHtml = safeUrl ? `<a href="${safeUrl}" target="_blank" class="underline hover:text-stone-200">Source Link</a>` : '';

    const footerHtml = includeFooter ? `
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
        ` : '';

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    ${getClaudeHeadContent(escapeHtml(title))}
</head>
<body class="bg-claude-bg text-claude-text font-sans antialiased min-h-screen flex flex-col justify-between selection:bg-stone-700 selection:text-white">

    <!-- Top Header -->
    <header class="sticky top-0 z-30 bg-claude-header/90 backdrop-blur-md border-b border-claude-border/40 px-4 py-3 sm:px-6 transition-colors">
        <div class="max-w-5xl mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-3 truncate pr-4">
                <span class="text-xs sm:text-sm font-normal text-claude-muted truncate tracking-tight">
                    ${escapeHtml(title)}
                </span>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-claude-badge text-claude-text border border-claude-border/50">
                    Exported by <span class="font-semibold text-white ml-1">${escapeHtml(userName)}</span>
                </span>
            </div>
        </div>
    </header>

    <!-- Main Content Stream Container -->
    <main class="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 pt-6 pb-12">
        <!-- Metadata Context Banner -->
        <div class="mb-6 rounded-xl bg-[#222222]/80 border border-claude-border/50 p-3 sm:p-3.5 text-xs text-stone-400 flex items-center justify-between shadow-sm">
            <div class="flex items-start sm:items-center space-x-2.5">
                <i data-lucide="info" class="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5 sm:mt-0"></i>
                <div class="leading-normal space-y-1">
                    <p>
                        This is an exported conversation between <span class="text-stone-200 font-medium">${escapeHtml(userName)}</span> &amp;
                        <span class="text-stone-200 font-medium">${escapeHtml(aiName)}</span>.
                    </p>
                    <p class="text-stone-500">
                        ${modelHtml}
                        ${dateHtml}
                        ${tagsHtml}
                        ${linkHtml}
                    </p>
                </div>
            </div>
            <span class="text-[10px] uppercase tracking-wider text-stone-500 font-mono hidden sm:inline-block pl-2 flex-shrink-0">Noosphere Reflect</span>
        </div>

        ${chatMessagesHtml}

        ${footerHtml}
    </main>

    <!-- Scripts for Interactivity -->
    ${INTERACTIVE_SCRIPTS}
</body>
</html>`;
}

export function getClaudeUserMessageHtml(index: number, contentHtml: string, dateStr: string): string {
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

export function getClaudeAiMessageHtml(index: number, contentHtml: string): string {
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

export function getClaudeThoughtBlockHtml(thoughtHtml: string, summary: string, idSuffix: string): string {
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
