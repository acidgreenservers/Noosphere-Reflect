/**
 * Noosphere Reflect - Brave Search AI Native Copy Button Scraper
 * v1.0 - "Neural Interface" Edition
 *
 * Platform-specific approach: Optimized for search.brave.com AI chat
 * Intercepts native "Copy" buttons to collect messages with Noosphere metadata.
 */

(function () {
    'use strict';

    const CONFIG = {
        MENU_ID: 'noosphere-console',
        STATUS_ID: 'noosphere-status-pill',
        STYLE_ID: 'noosphere-neural-styles',
        PLATFORM_NAME: 'Brave Search AI',
        PLATFORM_ID: 'brave',
        PLATFORM_COLOR: '#fb542b', // Brave Orange
        SELECTORS: {
            userMsg: '.user-bubble',
            aiMsg: '.message.assistant.llm-output',
            augmentMsg: '.message.augment',
            userCopyBtn: '.user-message-action[aria-label="Copy"]',
            aiCopyBtn: '.tap-round-footer-action[aria-label="Copy"]',
            inlineCitation: 'button.inline-citation',
            enrichmentFooterQuery: '.enrichment-footer-query',
            enrichmentCardImg: '.enrichment-card-item img',
            title: 'title'
        }
    };

    let collectedMessages = [];

    /**
     * Extract text from a message element, preserving structure
     */
    function extractMessageText(element) {
        if (!element) return '';

        // Clone to avoid modifying the live DOM
        const clone = element.cloneNode(true);

        // 1. Remove UI Artifacts (Buttons, Icons, etc.)
        clone.querySelectorAll('button, [aria-label*="copy"], [aria-label*="Copy"], .lucide-copy').forEach(el => el.remove());

        // 2. Remove inline citations specifically for Brave AI messages
        clone.querySelectorAll(CONFIG.SELECTORS.inlineCitation).forEach(el => el.remove());

        // 3. Get content
        let text = clone.innerText || clone.textContent;

        // 4. Final cleanup of common artifacts
        text = text.replace(/^\s*Copy\s*$/gm, '');
        text = text.replace(/^\s*Edit\s*$/gm, '');
        text = text.replace(/^\s*Retry\s*$/gm, '');
        text = text.replace(/^\s*Regenerate\s*$/gm, '');
        text = text.replace(/^\s*[\d:]+\s*$/gm, '');

        return text.trim();
    }

    /**
     * Extract augment URLs from an augment element
     */
    function extractAugmentUrls(augmentElement) {
        if (!augmentElement) return [];
        const urls = new Set();

        // Footer query links
        augmentElement.querySelectorAll(CONFIG.SELECTORS.enrichmentFooterQuery).forEach(link => {
            if (link.href) {
                try { urls.add(new URL(link.href, window.location.origin).href); }
                catch (_) { urls.add(link.href); }
            }
        });

        // Any anchor tags
        augmentElement.querySelectorAll('a[href]').forEach(link => {
            if (link.href) {
                try { urls.add(new URL(link.href, window.location.origin).href); }
                catch (_) { urls.add(link.href); }
            }
        });

        // Image proxy URLs
        augmentElement.querySelectorAll(CONFIG.SELECTORS.enrichmentCardImg).forEach(img => {
            if (img.src) urls.add(img.src);
        });

        return Array.from(urls);
    }

    /**
     * Create a message object with Noosphere metadata
     */
    function createMessageWithMetadata(type, content, augmentUrls = [], timestamp = null) {
        return {
            type: type, // 'prompt' or 'response'
            content: content,
            augmentUrls: augmentUrls,
            timestamp: timestamp || new Date().toISOString(),
            isEdited: false,
            platform: CONFIG.PLATFORM_ID,
            // Noosphere format markers for export
            noosphereMarker: type === 'prompt' ? '## Prompt:' : '## Response:'
        };
    }

    /**
     * Convert messages to JSON format with Noosphere metadata markers
     */
    function exportAsJSON(messages = null) {
        const msgs = messages || collectedMessages || extractAllMessages();
        const metadata = getPageMetadata();

        const formattedMessages = msgs.map(msg => ({
            type: msg.type,
            content: msg.content,
            augmentUrls: msg.augmentUrls || [],
            timestamp: msg.timestamp,
            isEdited: msg.isEdited,
            platform: msg.platform
        }));

        const chatData = {
            messages: formattedMessages,
            metadata: metadata,
            exportedBy: {
                tool: 'Noosphere Reflect',
                version: 'Brave Native Scraper v1.0',
                method: 'native-copy-button-intercept',
                noosphereMetadata: {
                    userMarker: '## Prompt:',
                    aiMarker: '## Response:',
                    augmentMarker: '📎 Augment References:'
                }
            }
        };

        return JSON.stringify(chatData, null, 2);
    }

    /**
     * Get page metadata for Noosphere export
     */
    function getPageMetadata() {
        return {
            title: document.title || 'Brave Search AI Chat',
            model: CONFIG.PLATFORM_NAME,
            sourceUrl: window.location.href,
            tags: ['Brave', 'AI-Chat', 'Noosphere'],
            timestamp: new Date().toISOString(),
            platform: CONFIG.PLATFORM_ID
        };
    }

    /**
     * Generate a formatted filename with custom name support
     */
    function generateFilename(conversationTitle, format = 'kebab-case', extension = 'md') {
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

        // Check for custom prefix
        const customPrefix = localStorage.getItem('noosphere_custom_prefix');
        if (customPrefix) {
            return `${customPrefix}_${dateStr}.${extension}`;
        }

        const baseName = conversationTitle || 'Brave_Search_AI_Chat';
        let name = baseName.replace(/[<>:"/\\|?*.]/g, '').trim();
        let formattedName = '';

        switch (format) {
            case 'snake_case': formattedName = name.replace(/[-\s]+/g, '_').toLowerCase(); break;
            case 'camelCase': formattedName = name.replace(/[-\s]+(.)/g, (_, c) => c.toUpperCase()); break;
            default: formattedName = name.replace(/[\s_]+/g, '-').toLowerCase();
        }

        return `${formattedName}_${dateStr}.${extension}`;
    }

    /**
     * Trigger file download
     */
    function downloadFile(content, filename, type = 'text/markdown') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        showStatus(`💾 Downloaded ${filename}`, 'success');
    }

    /**
     * Convert messages to Markdown format with Noosphere metadata markers
     */
    function exportAsMarkdown(messages = null) {
        const msgs = messages || collectedMessages || extractAllMessages();
        const metadata = getPageMetadata();
        const dateStr = new Date().toLocaleString();

        let userCount = msgs.filter(m => m.type === 'prompt').length;
        let aiCount = msgs.filter(m => m.type === 'response').length;
        let totalMessages = msgs.length;
        let exchanges = Math.min(userCount, aiCount);
        let augmentCount = msgs.filter(m => m.augmentUrls && m.augmentUrls.length > 0).length;

        let markdown = `---
> **🤖 Model:** ${metadata.model}
>
> **🌐 Date:** ${dateStr}
>
> **🌐 Source:** [${metadata.model} Chat](${metadata.sourceUrl})
>
> **🏷️ Tags:** ${metadata.tags.join(', ')}
>
> **📂 Artifacts:** [Internal](${metadata.sourceUrl})
>
> **📊 Metadata:**
>> **Total Exchanges:** ${exchanges}
>>
>> **Total Chat Messages:** ${totalMessages}
>>
>> **Total User Messages:** ${userCount}
>>
>> **Total AI Messages:** ${aiCount}
>>
>> **Total Augments:** ${augmentCount}
---

## Title:

> ${metadata.title}

--- 

`;

        msgs.forEach((msg, index) => {
            if (msg.type === 'prompt') {
                markdown += `#### Prompt - User 👤:\n\n`;
            } else {
                markdown += `#### Response - Brave Search AI 🤖:\n\n`;
            }

            markdown += `${msg.content}\n\n`;

            // Append augment URLs if present
            if (msg.augmentUrls && msg.augmentUrls.length > 0) {
                markdown += `**📎 Augment References:**\n\n`;
                msg.augmentUrls.forEach(url => {
                    markdown += `- ${url}\n`;
                });
                markdown += `\n`;
            }

            if (index < msgs.length - 1) {
                markdown += '---\n\n';
            }
        });

        markdown += `\n---\n\n`;
        markdown += `###### Noosphere Reflect\n`;
        markdown += `###### ***Meaning Through Memory***\n\n`;
        markdown += `###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n`;

        return markdown;
    }

    /**
     * Extract all messages currently visible on page in order,
     * including augment URL association
     */
    function extractAllMessages() {
        const allElements = document.querySelectorAll([
            CONFIG.SELECTORS.userMsg,
            CONFIG.SELECTORS.aiMsg,
            CONFIG.SELECTORS.augmentMsg
        ].join(', '));

        const messages = [];
        let lastAIMessage = null;

        allElements.forEach(el => {
            if (el.matches(CONFIG.SELECTORS.userMsg)) {
                const text = extractMessageText(el);
                if (text) {
                    messages.push(createMessageWithMetadata('prompt', text));
                }
                lastAIMessage = null;
            } else if (el.matches(CONFIG.SELECTORS.aiMsg)) {
                const text = extractMessageText(el);
                if (text) {
                    const msg = createMessageWithMetadata('response', text, []);
                    messages.push(msg);
                    lastAIMessage = msg;
                } else {
                    lastAIMessage = null;
                }
            } else if (el.matches(CONFIG.SELECTORS.augmentMsg)) {
                const urls = extractAugmentUrls(el);
                if (urls.length > 0 && lastAIMessage) {
                    urls.forEach(u => lastAIMessage.augmentUrls.push(u));
                }
            }
        });

        return messages;
    }

    /**
     * Copy to clipboard and show feedback
     */
    async function copyToClipboard(content, format = 'json') {
        try {
            await navigator.clipboard.writeText(content);
            showStatus(`✅ Copied ${collectedMessages.length || 'chat'} as ${format.toUpperCase()}!`, 'success');
            return true;
        } catch (err) {
            showStatus(`❌ Copy failed`, 'error');
            return false;
        }
    }

    function injectStyles() {
        if (document.getElementById(CONFIG.STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = CONFIG.STYLE_ID;
        style.textContent = `
            :root {
                --ns-primary: ${CONFIG.PLATFORM_COLOR};
                --ns-green: #10b981;
                --ns-purple: #8b5cf6;
                --ns-bg: rgba(15, 23, 42, 0.9);
                --ns-border: rgba(255, 255, 255, 0.1);
            }

            @keyframes ns-reveal {
                from { clip-path: circle(0% at bottom right); opacity: 0; }
                to { clip-path: circle(150% at bottom right); opacity: 1; }
            }

            @keyframes ns-pulse {
                0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
                70% { box-shadow: 0 0 0 15px rgba(255,255,255,0); }
                100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
            }

            .ns-orb {
                position: fixed; bottom: 25px; right: 25px;
                width: 65px; height: 65px;
                background: linear-gradient(135deg, var(--ns-primary), var(--ns-purple));
                border-radius: 50%; z-index: 100000;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; border: 2px solid rgba(255,255,255,0.2);
                box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .ns-orb:hover { transform: scale(1.15) rotate(15deg); }
            .ns-orb::after {
                content: ''; position: absolute; inset: -4px;
                border: 2px solid var(--ns-primary); border-radius: 50%;
                animation: ns-pulse 3s infinite;
            }

            .ns-orb svg { width: 32px; height: 32px; fill: white; }

            .ns-console {
                position: fixed; bottom: 105px; right: 25px;
                width: 360px; background: var(--ns-bg);
                backdrop-filter: blur(30px) saturate(180%);
                -webkit-backdrop-filter: blur(30px) saturate(180%);
                border: 1px solid var(--ns-border); border-radius: 32px;
                box-shadow: 0 30px 70px rgba(0,0,0,0.6);
                z-index: 99999; display: none; flex-direction: column;
                color: white; font-family: 'Inter', system-ui, sans-serif;
                animation: ns-reveal 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                overflow: hidden;
            }

            .ns-header { padding: 26px 30px 18px; border-bottom: 1px solid var(--ns-border); }
            .ns-title { font-size: 24px; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 2px; }
            .ns-badge {
                display: inline-block; padding: 4px 12px; border-radius: 20px;
                background: rgba(255,255,255,0.1); font-size: 11px;
                text-transform: uppercase; letter-spacing: 0.12em; font-weight: 800;
            }

            .ns-tabs { display: flex; padding: 14px 24px; gap: 10px; }
            .ns-tab {
                flex: 1; padding: 10px; border-radius: 14px; text-align: center;
                font-size: 13px; font-weight: 700; cursor: pointer;
                background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.4);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .ns-tab.active { background: rgba(255,255,255,0.12); color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

            .ns-content { padding: 0 26px 30px; display: flex; flex-direction: column; gap: 14px; }
            .ns-btn {
                width: 100%; padding: 16px 20px; border-radius: 22px;
                background: rgba(255,255,255,0.06); border: 1px solid var(--ns-border);
                color: white; font-size: 15px; font-weight: 700; cursor: pointer;
                display: flex; align-items: center; justify-content: center; gap: 12px;
                transition: all 0.3s;
            }
            .ns-btn:hover { background: rgba(255,255,255,0.12); transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
            .ns-btn:active { transform: translateY(-1px); }
            .ns-btn-primary { background: var(--ns-primary); border: none; }
            .ns-btn-primary:hover { filter: brightness(1.25); box-shadow: 0 10px 25px var(--ns-primary); }

            .ns-status {
                position: fixed; bottom: 35px; right: 110px;
                padding: 14px 28px; background: var(--ns-bg);
                backdrop-filter: blur(25px); border-radius: 28px;
                border: 1px solid var(--ns-border); color: white;
                font-size: 15px; font-weight: 700; z-index: 100001;
                box-shadow: 0 12px 40px rgba(0,0,0,0.4);
                display: flex; align-items: center; gap: 12px;
                animation: ns-reveal 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .ns-status.success::before { background: var(--ns-green); box-shadow: 0 0 15px var(--ns-green); }
            .ns-status.info::before { background: var(--ns-primary); box-shadow: 0 0 15px var(--ns-primary); }
            .ns-status::before { content: ''; width: 12px; height: 12px; border-radius: 50%; shrink: 0; }

            .ns-config-group { background: rgba(0,0,0,0.3); padding: 20px; border-radius: 24px; border: 1px solid var(--ns-border); }
            .ns-label { font-size: 12px; opacity: 0.6; text-transform: uppercase; margin-bottom: 8px; font-weight: 800; letter-spacing: 0.05em; }
            .ns-input, .ns-select { 
                width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--ns-border); 
                color: white; outline: none; font-size: 16px; padding: 12px; border-radius: 12px;
            }
        `;
        document.head.appendChild(style);
    }

    function createConsole() {
        injectStyles();

        const orb = document.createElement('div');
        orb.className = 'ns-orb';
        orb.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="5"/></svg>`;
        document.body.appendChild(orb);

        const consoleEl = document.createElement('div');
        consoleEl.className = 'ns-console';
        consoleEl.innerHTML = `
            <div class="ns-header">
                <div class="ns-title">${CONFIG.PLATFORM_NAME} Console</div>
                <div class="ns-badge">Neural Link Enabled</div>
            </div>
            <div class="ns-tabs">
                <div class="ns-tab active" data-target="ns-pane-collect">Capture</div>
                <div class="ns-tab" data-target="ns-pane-config">Logic</div>
            </div>
            <div class="ns-content ns-console-content" id="ns-pane-collect">
                <button class="ns-btn ns-btn-primary" id="ns-collect">Deep Sync Conversation</button>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <button class="ns-btn" id="ns-copy-json">Copy JSON</button>
                    <button class="ns-btn" id="ns-copy-md">Copy MD</button>
                </div>
                <button class="ns-btn" id="ns-dl-md">💾 Download Final .MD</button>
                <button class="ns-btn" id="ns-help" style="opacity: 0.5; margin-top: 8px; justify-content: center; border: none;">
                    Documentation & Help
                </button>
            </div>
            <div class="ns-content ns-console-content" id="ns-pane-config" style="display: none;">
                <div class="ns-config-group">
                    <span class="ns-label">Custom Filename Prefix</span>
                    <input type="text" class="ns-input" id="ns-custom-name" placeholder="Brave_Export">
                </div>
                <div>
                    <span class="ns-label">Naming Segment</span>
                    <select class="ns-select" id="ns-naming">
                        <option value="kebab-case">kebab-case</option>
                        <option value="snake_case">snake_case</option>
                        <option value="PascalCase">PascalCase</option>
                        <option value="camelCase">camelCase</option>
                    </select>
                </div>
                <div style="font-size: 11px; opacity: 0.4; line-height: 1.4; padding: 4px;">
                    Neural markers: ## Prompt, ## Response. Standardized for Noosphere Reflect v1.0.
                </div>
            </div>
        `;
        document.body.appendChild(consoleEl);

        // UI Logic
        orb.onclick = () => {
            const open = consoleEl.style.display === 'flex';
            consoleEl.style.display = open ? 'none' : 'flex';
            orb.style.transform = open ? '' : 'scale(0.8) rotate(-45deg)';
        };

        consoleEl.querySelectorAll('.ns-tab').forEach(t => {
            t.onclick = () => {
                consoleEl.querySelectorAll('.ns-tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                const target = t.dataset.target;
                consoleEl.querySelectorAll('.ns-console-content').forEach(c => c.style.display = c.id === target ? 'flex' : 'none');
            };
        });

        // Prefix logic
        const nameInput = document.getElementById('ns-custom-name');
        nameInput.value = localStorage.getItem('noosphere_custom_prefix') || '';
        nameInput.oninput = () => localStorage.setItem('noosphere_custom_prefix', nameInput.value.trim());

        document.getElementById('ns-collect').onclick = async () => {
            const btn = document.getElementById('ns-collect');
            const original = btn.innerText;
            btn.innerText = '⚡ Synchronizing...';
            btn.disabled = true;

            window.scrollTo({ top: 0, behavior: 'smooth' });
            await new Promise(r => setTimeout(r, 2000));

            collectedMessages = extractAllMessages();
            showStatus(`Captured ${collectedMessages.length} neuro-segments`, 'success');
            btn.innerText = original;
            btn.disabled = false;
        };

        document.getElementById('ns-copy-json').onclick = () => copyToClipboard(exportAsJSON(), 'json');
        document.getElementById('ns-copy-md').onclick = () => copyToClipboard(exportAsMarkdown(), 'md');

        document.getElementById('ns-dl-md').onclick = () => {
            const md = exportAsMarkdown();
            const metadata = getPageMetadata();
            const naming = document.getElementById('ns-naming').value;
            const filename = generateFilename(metadata.title, naming, 'md');
            downloadFile(md, filename, 'text/markdown');
        };

        document.getElementById('ns-help').onclick = () => {
            alert(`Noosphere Reflect - ${CONFIG.PLATFORM_NAME} Scraper v1.0\n\nNeural Capture enabled. Keyboard shortcuts:\nCtrl+Shift+M: Copy MD\nCtrl+Shift+E: Copy JSON`);
        };
    }

    function showStatus(msg, type = 'info') {
        const s = document.createElement('div');
        s.className = `ns-status ${type}`;
        s.textContent = msg;
        document.body.appendChild(s);
        setTimeout(() => {
            s.style.opacity = '0';
            setTimeout(() => s.remove(), 400);
        }, 2500);
    }

    function init() {
        console.log(`[Noosphere] ${CONFIG.PLATFORM_NAME} Console Online.`);
        createConsole();

        interceptNativeCopyButtons();

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                copyToClipboard(exportAsJSON(), 'json');
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                copyToClipboard(exportAsMarkdown(), 'md');
            }
        });

        showStatus('Neural Link Established', 'success');
    }

    function interceptNativeCopyButtons() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const label = (btn.getAttribute('aria-label') || '').toLowerCase();
            const text = (btn.innerText || '').toLowerCase();

            // Check if this is a copy button
            const isUserCopy = btn.matches(CONFIG.SELECTORS.userCopyBtn) ||
                               (label.includes('copy') && btn.closest('.user-message-actions'));
            const isAICopy = btn.matches(CONFIG.SELECTORS.aiCopyBtn) ||
                             (label.includes('copy') && btn.classList.toString().includes('tap-round-footer-action'));

            if (!isUserCopy && !isAICopy) return;

            // Determine message container
            let container = null;
            let isUser = false;

            if (isUserCopy) {
                container = btn.closest('.user-message-actions')?.previousElementSibling ||
                           btn.closest('.user-bubble');
                isUser = true;
            } else {
                container = btn.closest('.message.assistant.llm-output') ||
                           btn.closest('.message')?.querySelector('.llm-output');
                isUser = false;
            }

            // Fallback: walk up DOM to find message container
            if (!container) {
                let walker = btn;
                for (let i = 0; i < 6; i++) {
                    walker = walker?.parentElement;
                    if (!walker) break;
                    if (walker.matches(CONFIG.SELECTORS.userMsg)) {
                        container = walker;
                        isUser = true;
                        break;
                    }
                    if (walker.matches(CONFIG.SELECTORS.aiMsg)) {
                        container = walker;
                        isUser = false;
                        break;
                    }
                }
            }

            if (!container) return;

            const content = extractMessageText(container);
            if (!content) return;

            // Check for augment following this AI message
            let augmentUrls = [];
            if (!isUser) {
                let sibling = container.nextElementSibling;
                while (sibling && sibling.matches(CONFIG.SELECTORS.augmentMsg)) {
                    const urls = extractAugmentUrls(sibling);
                    urls.forEach(u => augmentUrls.push(u));
                    sibling = sibling.nextElementSibling;
                }
            }

            collectedMessages.push(createMessageWithMetadata(
                isUser ? 'prompt' : 'response',
                content,
                augmentUrls
            ));

            showStatus(`⚡ Captured (${collectedMessages.length})`, 'success');
        }, true);
    }

    init();
})();
