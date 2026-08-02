import { escapeHtml, sanitizeUrl } from '../../../../../utils/securityUtils';
import { getGeminiHeadContent } from './GeminiStyles';
import { ChatMetadata } from '../../../../../types';

export function getGeminiBaseHtml(title: string, userName: string, aiName: string, chatMessagesHtml: string, metadata?: ChatMetadata, includeFooter: boolean = true): string {
    const safeUrl = metadata?.sourceUrl ? sanitizeUrl(metadata.sourceUrl) : '';
    
    const safeUrlHtml = safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener"
                    class="hover:underline truncate max-w-md">
                    Source Link
                </a>
                <button onclick="copyPublicLink('${safeUrl}')"
                    class="p-1 text-gemini-subtle hover:text-white transition-colors relative group"
                    title="Copy public link">
                    <span id="linkCopyIcon" class="inline-flex items-center justify-center">
                        <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                    </span>
                </button>` : '';

    const dateHtml = metadata?.date ? `Date: <span class="text-gemini-muted font-medium">${escapeHtml(new Date(metadata.date).toLocaleString())}</span> •` : '';
    const modelHtml = metadata?.model ? `Model: <span class="text-gemini-muted font-medium">${escapeHtml(metadata.model)}</span>` : '';

    const footerHtml = includeFooter ? `
        <!-- End of Chat Anchor Button (Static CTA replacing floating bar) -->
        <div class="mt-16 pt-8 flex flex-col items-center justify-center space-y-4 border-t border-gemini-border/40">
            <a href="https://github.com/acidgreenservers/Noosphere-Reflect" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-gemini-buttonBg text-gemini-buttonText font-medium text-sm hover:bg-[#c2e7ff] transition-all shadow-md hover:shadow-lg group transform hover:-translate-y-0.5">
                <span>Continue on Noosphere Reflect</span>
                <i data-lucide="arrow-up-right"
                    class="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"></i>
            </a>

            <!-- Authentic Gemini Footer Disclaimer -->
            <p class="text-[11px] text-gemini-subtle text-center font-sans tracking-tight">
                Gemini may display inaccurate info, including about people, so double-check its responses.
            </p>
        </div>
        ` : '';

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    ${getGeminiHeadContent(escapeHtml(title))}
</head>
<body class="bg-gemini-bg text-gemini-text font-sans antialiased min-h-screen flex flex-col justify-between selection:bg-[#333537] selection:text-white">

    <!-- Top Header Navigation -->
    <header class="w-full px-4 py-3 sm:px-6 flex items-center justify-between border-b border-transparent">
        <div class="flex items-center space-x-2">
            <!-- Gemini Sparkle Four-Point Star Icon -->
            <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M12 0C12 6.62742 6.62742 12 0 12C6.62742 12 12 17.3726 12 24C12 17.3726 17.3726 12 24 12C17.3726 12 12 6.62742 12 0Z"
                    fill="url(#gemini-gradient)" />
                <defs>
                    <linearGradient id="gemini-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#4285F4" />
                        <stop offset="50%" stop-color="#9B51E0" />
                        <stop offset="100%" stop-color="#E91E63" />
                    </linearGradient>
                </defs>
            </svg>
            <span class="text-sm font-medium text-white tracking-wide">Gemini</span>
        </div>

        <!-- Export Badge Tag -->
        <div class="flex items-center space-x-2">
            <span
                class="text-xs text-gemini-subtle font-mono bg-gemini-card px-3 py-1 rounded-full border border-gemini-border/60">
                Archived via <span class="text-gemini-muted font-semibold">Noosphere Reflect</span>
            </span>
        </div>
    </header>

    <!-- Main Content Container -->
    <main class="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 pt-6 pb-16 flex flex-col justify-start">

        <!-- Conversation Main Title -->
        <h1 class="text-2xl sm:text-3xl font-normal text-white tracking-tight mb-2">
            ${escapeHtml(title)}
        </h1>

        <!-- Public Link and Export Metadata Bar -->
        <div class="mb-8 space-y-1">
            <div class="flex items-center space-x-2 text-xs sm:text-sm text-gemini-accent">
                ${safeUrlHtml}
            </div>

            <p class="text-[11px] sm:text-xs text-gemini-subtle font-sans">
                Exported by <span class="text-gemini-muted font-medium">${escapeHtml(userName)}</span> •
                ${dateHtml}
                ${modelHtml}
            </p>
        </div>

        ${chatMessagesHtml}

        ${footerHtml}

    </main>

    <!-- Scripts for Interactivity -->
    <script>
        // Initialize Lucide Icons
        document.addEventListener("DOMContentLoaded", () => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });

        // Toggle User Prompt Bubble Expansion
        function toggleUserPrompt(index) {
            const container = document.getElementById('userPromptText_' + index);
            const chevron = document.getElementById('toggleChevron_' + index);

            if (!container || !chevron) return;

            if (container.classList.contains('max-h-[110px]')) {
                container.classList.remove('max-h-[110px]');
                container.classList.add('max-h-[2500px]');
                chevron.style.transform = 'rotate(180deg)';
            } else {
                container.classList.remove('max-h-[2500px]');
                container.classList.add('max-h-[110px]');
                chevron.style.transform = 'rotate(0deg)';
            }
        }

        // Toggle Thought Block Expansion
        function toggleThoughtBlock(idSuffix) {
            const container = document.getElementById('thoughtContent_' + idSuffix);
            const checkIcon = document.getElementById('thoughtCheck_' + idSuffix);
            const chevron = document.getElementById('thoughtChevron_' + idSuffix);
            
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

        // Copy icon feedback animation helper
        function triggerCopyFeedback(iconContainerId, sizeClass = 'w-3.5 h-3.5') {
            const container = document.getElementById(iconContainerId);
            if (!container) return;

            container.innerHTML = \`<i data-lucide="check" class="\${sizeClass} text-green-400"></i>\`;
            if (window.lucide) lucide.createIcons();

            setTimeout(() => {
                container.innerHTML = \`<i data-lucide="copy" class="\${sizeClass}"></i>\`;
                if (window.lucide) lucide.createIcons();
            }, 2000);
        }

        // Copy Public Link
        function copyPublicLink(url) {
            const temp = document.createElement('textarea');
            temp.value = url;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);

            triggerCopyFeedback('linkCopyIcon', 'w-3.5 h-3.5');
        }

        // Copy Prompt Text
        function copyPromptText(index) {
            const container = document.getElementById('userPromptText_' + index);
            if (!container) return;
            const text = container.innerText;
            const temp = document.createElement('textarea');
            temp.value = text;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);

            triggerCopyFeedback('promptCopyIcon_' + index, 'w-3.5 h-3.5');
        }

        // Copy AI Response Text
        function copyResponseText(index) {
            const container = document.getElementById('aiMessageBody_' + index);
            if (!container) return;
            const text = container.innerText;
            const temp = document.createElement('textarea');
            temp.value = text;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);

            triggerCopyFeedback('responseCopyIcon_' + index, 'w-4 h-4');
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

export function getGeminiUserMessageHtml(index: number, contentHtml: string): string {
    // FIX: Added style="word-break: break-word;" to userPromptText to prevent wrapping issues that hit Claude styling
    return `
        <!-- User Prompt Bubble Section -->
        <section class="mb-10 w-full relative">
            <div id="userBubble_${index}"
                class="bg-gemini-card border border-gemini-border/80 rounded-2xl p-4 sm:p-5 text-sm sm:text-[15px] text-stone-200 relative group transition-colors">

                <!-- Inner Expandable Prompt Text -->
                <div id="userPromptText_${index}"
                    class="expandable-user-text max-h-[110px] overflow-hidden whitespace-pre-wrap leading-relaxed" style="word-break: break-word;">${contentHtml}</div>

                <!-- Collapse/Expand Bottom Control Pill inside Bubble -->
                <div class="mt-2 pt-2 flex items-center justify-end">
                    <button id="toggleUserBtn_${index}" onclick="toggleUserPrompt(${index})"
                        class="p-1 rounded-full bg-[#282a2c] hover:bg-[#333537] text-gemini-subtle hover:text-white transition-all focus:outline-none"
                        title="Expand / Collapse prompt">
                        <i id="toggleChevron_${index}" data-lucide="chevron-down"
                            class="w-4 h-4 transition-transform duration-300"></i>
                    </button>
                </div>
            </div>

            <!-- Copy Prompt Button Below User Message -->
            <div class="mt-2 flex items-center justify-end">
                <button onclick="copyPromptText(${index})"
                    class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs text-gemini-subtle hover:text-stone-200 hover:bg-gemini-card transition-colors group"
                    title="Copy prompt">
                    <span id="promptCopyIcon_${index}" class="inline-flex items-center justify-center">
                        <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-[11px] font-medium">Copy prompt</span>
                </button>
            </div>
        </section>
    `;
}

export function getGeminiAiMessageHtml(index: number, contentHtml: string): string {
    return `
        <!-- Gemini Response Section -->
        <article id="aiMessageBody_${index}" class="gemini-prose space-y-6 text-gemini-text text-sm sm:text-base leading-relaxed">
            ${contentHtml}
        </article>

        <!-- AI Response Action Bar -->
        <div class="mt-8 mb-8 flex items-center justify-between border-t border-gemini-border/40 pt-4 text-gemini-subtle">
            <div class="flex items-center space-x-2">
                <button onclick="copyResponseText(${index})"
                    class="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gemini-card hover:text-stone-200 transition-colors text-xs font-medium"
                    title="Copy response">
                    <span id="responseCopyIcon_${index}" class="inline-flex items-center justify-center">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                    </span>
                    <span>Copy</span>
                </button>
            </div>
        </div>
    `;
}

export function getGeminiThoughtBlockHtml(thoughtHtml: string, summary: string, idSuffix: string): string {
    return `
        <div class="my-6 max-w-[85%] text-[0.95rem] font-sans">
            <!-- Thought Header -->
            <button onclick="toggleThoughtBlock('${idSuffix}')" class="flex items-center space-x-2 text-gemini-subtle hover:text-white transition-colors focus:outline-none w-full text-left">
                <i data-lucide="chevron-right" id="thoughtChevron_${idSuffix}" class="w-4 h-4 transition-transform duration-200 transform rotate-0"></i>
                <span class="font-medium">${escapeHtml(summary)}</span>
            </button>
            
            <!-- Collapsible Thought Body -->
            <div id="thoughtContent_${idSuffix}" class="expandable-content max-h-[0px] opacity-0 overflow-hidden ml-6 pl-4 border-l-2 border-[#333537] mt-3">
                <div class="flex items-start space-x-3 text-gemini-subtle mb-3">
                    <i data-lucide="clock" class="w-4 h-4 mt-1 flex-shrink-0"></i>
                    <div class="text-[0.9rem] leading-relaxed">${thoughtHtml}</div>
                </div>
                <div id="thoughtCheck_${idSuffix}" class="hidden flex items-center space-x-2 text-[#a8c7fa] mt-4 text-xs font-medium uppercase tracking-wider">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    <span>Done</span>
                </div>
            </div>
        </div>
    `;
}
