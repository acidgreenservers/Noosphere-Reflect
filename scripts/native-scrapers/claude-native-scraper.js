/**
 * Noosphere Reflect - Claude Native Copy Button Scraper
 * v2.2 - "Neural Interface" Edition
 *
 * Platform-specific approach: Optimized for Claude.ai
 * Intercepts native "Copy" buttons to collect messages with Noosphere metadata.
 */

(function () {
    'use strict';

    const CONFIG = {
        MENU_ID: 'noosphere-console',
        STATUS_ID: 'noosphere-status-pill',
        STYLE_ID: 'noosphere-neural-styles',
        PLATFORM_NAME: 'Claude',
        PLATFORM_ID: 'claude',
        PLATFORM_COLOR: '#8b5cf6', // Claude Purple
        SELECTORS: {
            userMsg: '[data-testid="user-message"]',
            aiMsg: '.font-claude-response',
            copyBtn: 'button[aria-label*="Copy"], button[aria-label*="copy"]',
            title: 'title',
            // Thought block selectors
            thoughtBlock: '[class*="overflow-hidden"][class*="transition-[max-height]"]',
            thoughtMarkdown: '.standard-markdown',
            thoughtHeader: 'button.group\\/status',
            thoughtContainer: '.flex-col.font-ui'
        }
    };

    let collectedMessages = [];
    let capturedClipboardContent = null; // Temp storage for intercepted clipboard
    let isInterceptingClipboard = false;
    let thoughtSegmentsCaptured = 0; // Track thought block captures

    /**
     * Extract text from a message element, preserving structure
     */
    function extractMessageText(element) {
        if (!element) return '';

        // Clone to avoid modifying the live DOM
        const clone = element.cloneNode(true);

        // 1. Remove UI Artifacts (Buttons, Icons, etc.)
        clone.querySelectorAll('button, [aria-label*="copy"], [aria-label*="Copy"], .lucide-copy').forEach(el => el.remove());

        // 2. Get content
        let text = clone.innerText || clone.textContent;

        // 3. Final cleanup of common artifacts
        text = text.replace(/^\s*Copy\s*$/gm, '');
        text = text.replace(/^\s*Edit\s*$/gm, '');
        text = text.replace(/^\s*Retry\s*$/gm, '');
        text = text.replace(/^\s*Regenerate\s*$/gm, '');
        text = text.replace(/^\s*[\d:]+\s*$/gm, '');

        return text.trim();
    }

    /**
     * Create a message object with Noosphere metadata
     */
    function createMessageWithMetadata(type, content, timestamp = null) {
        return {
            type: type, // 'prompt' or 'response'
            content: content,
            timestamp: timestamp || new Date().toISOString(),
            isEdited: false,
            platform: CONFIG.PLATFORM_ID,
            // Noosphere format markers for export
            noosphereMarker: type === 'prompt' ? '## Prompt:' : '## Response:'
        };
    }

    /**
     * Extract thoughts from message if present (Claude pattern)
     */
    function extractThoughts(content) {
        const thoughtMatch = content.match(/<thought>([\s\S]*?)<\/thought>/i);
        if (thoughtMatch) {
            return {
                thoughts: thoughtMatch[1].trim(),
                contentWithoutThoughts: content.replace(thoughtMatch[0], '').trim()
            };
        }
        return { thoughts: null, contentWithoutThoughts: content };
    }

    /**
     * Extract thought blocks from DOM with max-height fix
     * The thought blocks use [style*="max-height"] selector
     */
    function extractThoughtBlocksFromDOM(element) {
        if (!element) return null;

        // Go up 4 levels from the copy button to the message container
        let container = element;
        for (let i = 0; i < 4; i++) {
            container = container?.parentElement;
        }
        if (!container) return null;

        // Find the thought block by its style attribute (max-height: 200px when collapsed)
        const thoughtBlock = container.querySelector('[style*="max-height"]');
        if (!thoughtBlock) return null;

        // Expand it
        const originalMaxHeight = thoughtBlock.style.maxHeight;
        thoughtBlock.style.maxHeight = 'none';
        void thoughtBlock.offsetHeight;

        const fullText = thoughtBlock.innerText?.trim();

        // Restore
        thoughtBlock.style.maxHeight = originalMaxHeight;

        if (!fullText || fullText.length < 10) return null;

        return { title: 'Thinking Process', content: fullText };
    }

    /**
     * Intercept clipboard API to capture Claude's perfect markdown output
     * Claude uses clipboard.write() with ClipboardItem, NOT clipboard.writeText()
     */
    function setupClipboardIntercept() {
        const originalWrite = navigator.clipboard.write.bind(navigator.clipboard);
        
        navigator.clipboard.write = async function(data) {
            if (isInterceptingClipboard && data) {
                try {
                    // Claude uses ClipboardItem with text/plain
                    for (const item of data) {
                        if (item.types.includes('text/plain')) {
                            const blob = await item.getType('text/plain');
                            const text = await blob.text();
                            capturedClipboardContent = text;
                            console.log('[Noosphere] Intercepted via clipboard.write:', text.substring(0, 100));
                            break;
                        }
                        // Also try text/html for rich markdown
                        if (item.types.includes('text/html')) {
                            const blob = await item.getType('text/html');
                            const text = await blob.text();
                            console.log('[Noosphere] Also has text/html:', text.substring(0, 100));
                        }
                    }
                } catch (err) {
                    console.log('[Noosphere] Intercept read error:', err);
                }
            }
            return originalWrite(data);
        };
    }

    /**
     * Click a copy button and capture the clipboard content
     */
    async function captureMessageViaClipboard(copyButton) {
        return new Promise((resolve) => {
            capturedClipboardContent = null;
            isInterceptingClipboard = true;
            
            // Click the copy button
            copyButton.click();
            
            // Wait for clipboard to be written
            setTimeout(() => {
                isInterceptingClipboard = false;
                resolve(capturedClipboardContent);
            }, 500);
        });
    }

    /**
     * Get whether "Include Thought Sections" is enabled
     */
    function getIncludeThoughts() {
        const checkbox = document.getElementById('ns-include-thoughts');
        return checkbox ? checkbox.checked : false;
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
            timestamp: msg.timestamp,
            isEdited: msg.isEdited,
            platform: msg.platform
        }));

        const chatData = {
            messages: formattedMessages,
            metadata: metadata,
            exportedBy: {
                tool: 'Noosphere Reflect',
                version: 'Claude Native Scraper v2.2',
                method: 'native-copy-button-intercept',
                noosphereMetadata: {
                    userMarker: '## Prompt:',
                    aiMarker: '## Response:',
                    thoughtMarker: '<thought>',
                    thoughtMarkerEnd: '</thought>'
                }
            }
        };

        return JSON.stringify(chatData, null, 2);
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

        const baseName = conversationTitle || 'Claude_Chat';
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
        let exchanges = Math.ceil(totalMessages / 2);

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
>> **Total Artifacts:** 0
---

## Title:

> ${metadata.title}

--- 

`;

        msgs.forEach((msg, index) => {
            if (msg.type === 'prompt') {
                markdown += `#### Prompt - User 👤:\n\n`;
            } else {
                markdown += `#### Response - Claude 🤖:\n\n`;
            }

            const thoughtData = extractThoughts(msg.content);
            if (thoughtData.thoughts) {
                markdown += "```\nThoughts:\n";
                markdown += `${thoughtData.thoughts}\n`;
                markdown += "```\n\n";
                markdown += `${thoughtData.contentWithoutThoughts}\n\n`;
            } else {
                markdown += `${msg.content}\n\n`;
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
     * Extract all messages currently visible on page in order
     */
    function extractAllMessages() {
        const elements = document.querySelectorAll(`${CONFIG.SELECTORS.userMsg}, ${CONFIG.SELECTORS.aiMsg}`);
        const messages = [];
        elements.forEach(el => {
            const isUser = el.matches(CONFIG.SELECTORS.userMsg);
            const text = extractMessageText(el);
            if (text) messages.push(createMessageWithMetadata(isUser ? 'prompt' : 'response', text));
        });
        return messages;
    }

    /**
     * Get page metadata for Noosphere export
     */
    function getPageMetadata() {
        return {
            title: document.title || 'Claude Chat',
            model: 'Claude',
            sourceUrl: window.location.href,
            tags: ['Claude', 'AI-Chat', 'Noosphere'],
            timestamp: new Date().toISOString(),
            platform: CONFIG.PLATFORM_ID
        };
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
                    <input type="text" class="ns-input" id="ns-custom-name" placeholder="Claude_Export">
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
                <div class="ns-config-group" style="margin-top: 14px;">
                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                        <input type="checkbox" id="ns-include-thoughts" style="width: 20px; height: 20px; accent-color: var(--ns-primary);" />
                        <div>
                            <div style="font-weight: 700; font-size: 14px;">Include Thought Sections</div>
                            <div style="font-size: 11px; opacity: 0.5; margin-top: 2px;">
                                Extracts full thinking blocks from DOM (max-height fix)
                            </div>
                        </div>
                    </label>
                </div>
                <div style="font-size: 11px; opacity: 0.4; line-height: 1.4; padding: 4px;">
                    Neural markers: ## Prompt, ## Response. Standardized for Noosphere Reflect v2.2.
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
            alert(`Noosphere Reflect - ${CONFIG.PLATFORM_NAME} Scraper v2.2\n\nNeural Capture enabled. Keyboard shortcuts:\nCtrl+Shift+M: Copy MD\nCtrl+Shift+E: Copy JSON`);
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
        // Setup clipboard intercept for perfect markdown capture
        setupClipboardIntercept();
        
        document.addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const label = (btn.getAttribute('aria-label') || '').toLowerCase();
            const text = (btn.innerText || '').toLowerCase();

            if (label.includes('copy') || text.includes('copy')) {
                const container = btn.closest(CONFIG.SELECTORS.userMsg) || btn.closest(CONFIG.SELECTORS.aiMsg);
                if (container) {
                    const isUser = container.matches(CONFIG.SELECTORS.userMsg);
                    
                    // HYBRID APPROACH:
                    // 1. Capture perfect markdown from clipboard (tables, formatting)
                    // 2. Optionally extract thought blocks from DOM (when enabled)
                    
                    let finalContent = '';
                    let thoughtBlock = null;
                    
                    // If Include Thought Sections is enabled, extract thoughts from DOM FIRST
                    // Pass the button itself - extractThoughtBlocksFromDOM goes up 4 levels to find container
                    if (getIncludeThoughts() && !isUser) {
                        thoughtBlock = extractThoughtBlocksFromDOM(btn);
                    }
                    
                    // Capture via clipboard intercept (perfect markdown)
                    const clipboardContent = await captureMessageViaClipboard(btn);
                    
                    if (clipboardContent) {
                        // Use clipboard content (has perfect markdown, tables)
                        finalContent = clipboardContent;
                        
                        // Prepend thought block if extracted
                        if (thoughtBlock && thoughtBlock.content) {
                            finalContent = `<thought>\n${thoughtBlock.title}\n\n${thoughtBlock.content}\n</thought>\n\n${finalContent}`;
                            thoughtSegmentsCaptured++;
                            console.log('[Noosphere] Thought block prepended to clipboard:', thoughtBlock.title);
                        }
                        
                        collectedMessages.push(createMessageWithMetadata(isUser ? 'prompt' : 'response', finalContent));
                        
                        // Show combined status with thought count if enabled
                        if (getIncludeThoughts() && thoughtSegmentsCaptured > 0) {
                            showStatus(`⚡ ${collectedMessages.length} Neuro | 💭 ${thoughtSegmentsCaptured} Thoughts`, 'success');
                        } else {
                            showStatus(`⚡ Captured (${collectedMessages.length}) [Clipboard]`, 'success');
                        }
                    } else {
                        // Fallback to DOM extraction if clipboard failed
                        const content = extractMessageText(container);
                        if (content) {
                            // Prepend thought block if extracted
                            let fallbackContent = content;
                            if (thoughtBlock && thoughtBlock.content) {
                                fallbackContent = `<thought>\n${thoughtBlock.title}\n\n${thoughtBlock.content}\n</thought>\n\n${content}`;
                                thoughtSegmentsCaptured++;
                                console.log('[Noosphere] Thought block prepended to fallback:', thoughtBlock.title);
                            }
                            
                            collectedMessages.push(createMessageWithMetadata(isUser ? 'prompt' : 'response', fallbackContent));
                            
                            // Show combined status with thought count if enabled
                            if (getIncludeThoughts() && thoughtSegmentsCaptured > 0) {
                                showStatus(`⚡ ${collectedMessages.length} Neuro | 💭 ${thoughtSegmentsCaptured} Thoughts`, 'info');
                            } else {
                                showStatus(`Captured (${collectedMessages.length}) [DOM]`, 'info');
                            }
                        }
                    }
                }
            }
        }, true);
    }

    init();
})();
