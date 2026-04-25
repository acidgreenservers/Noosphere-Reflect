/**
 * OpenClaw Chat Exporter - Noosphere Reflect
 * v1.0 - DOM Scraper Edition
 *
 * Scrapes OpenClaw chat conversations with metadata preservation.
 */

(function () {
    'use strict';

    // ============================================================================
    // CONSTANTS
    // ============================================================================
    const CONFIG = {
        CHECKBOX_CLASS: 'ns-checkbox',

        SELECTORS: {
            // Chat messages
            USER_MESSAGE: '.chat-group.user',
            AI_MESSAGE: '.chat-group.assistant',
            MESSAGE_CONTAINER: '.chat-group',

            // Text content
            CHAT_TEXT: '.chat-text',

            // Metadata
            SENDER_NAME: '.chat-sender-name',
            TIMESTAMP: '.chat-group-timestamp',
            MODEL_NAME: '.msg-meta__model',
            TOKENS_UP: '.msg-meta__tokens',
            CACHE_INFO: '.msg-meta__cache',
            CTX_INFO: '.msg-meta__ctx',
            MSG_META: '.msg-meta',

            // UI artifacts to strip
            CHAT_BUBBLE_ACTIONS: '.chat-bubble-actions',
            CHAT_GROUP_FOOTER: '.chat-group-footer',
            CHAT_AVATAR: '.chat-avatar',
            CHAT_DELETE_WRAP: '.chat-delete-wrap',
            CHAT_TTS_BTN: '.chat-tts-btn',

            // Chat container
            CHAT_CONTAINER: '.chat-container, .chat-messages, main',

            // Title
            CONVERSATION_TITLE: 'title'
        },

        TIMING: {
            SCROLL_DELAY: 1500,
            CLIPBOARD_CLEAR_DELAY: 200,
            CLIPBOARD_READ_DELAY: 300,
            POPUP_DURATION: 900,
            MAX_SCROLL_ATTEMPTS: 40,
            MAX_STABLE_SCROLLS: 3
        },

        STYLES: {
            BUTTON_PRIMARY: '#ff6b35', // OpenClaw orange
            BUTTON_HOVER: '#e55a2b',
            DARK_BG: '#1a1a1a',
            DARK_TEXT: '#fff',
            DARK_BORDER: '#444',
            LIGHT_BG: '#fff',
            LIGHT_TEXT: '#222',
            LIGHT_BORDER: '#ccc'
        }
    };

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    const Utils = {
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        isDarkMode() {
            return document.documentElement.classList.contains('dark');
        },

        sanitizeFilename(text) {
            return text
                .replace(/[<>:"\/\\|?*]/g, '')
                .replace(/\s+/g, '_')
                .substring(0, 50);
        },

        getDateString() {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        },

        createNotification(message) {
            const notification = document.createElement('div');
            notification.textContent = message;
            Object.assign(notification.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: CONFIG.STYLES.BUTTON_PRIMARY,
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '10000',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'opacity 0.3s ease',
                maxWidth: '300px',
                wordWrap: 'break-word'
            });
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, CONFIG.TIMING.POPUP_DURATION);
        }
    };

    // ============================================================================
    // STYLES
    // ============================================================================
    function injectStyles() {
        const styleId = 'noosphere-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            :root {
                --ns-green: ${CONFIG.STYLES.BUTTON_PRIMARY};
                --ns-purple: ${CONFIG.STYLES.BUTTON_HOVER};
                --ns-amber: #f59e0b;
                --ns-bg: rgba(17, 24, 39, 0.7);
                --ns-border: rgba(255, 255, 255, 0.1);
                --ns-glow: 0 0 20px ${CONFIG.STYLES.BUTTON_PRIMARY}40;
            }
            .ns-orb {
                position: fixed; top: 215px; right: 16px; width: 40px; height: 40px;
                background: linear-gradient(135deg, var(--ns-green), var(--ns-purple));
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                cursor: pointer; z-index: 100000; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            .ns-orb:hover { transform: scale(1.1) rotate(5deg); box-shadow: var(--ns-glow); }
            .ns-orb svg { width: 20px; height: 20px; fill: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
            .ns-console {
                position: fixed; top: 243px; right: 16px; width: 340px;
                background: var(--ns-bg); backdrop-filter: blur(20px) saturate(180%);
                border: 1px solid var(--ns-border); border-radius: 28px; z-index: 99999;
                overflow: hidden; display: none; flex-direction: column;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); color: white;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
            }
            .ns-console-header { padding: 24px 24px 16px; background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent); }
            .ns-console-title {
                font-size: 20px; font-weight: 800; letter-spacing: -0.02em;
                background: linear-gradient(to right, #fff, rgba(255,255,255,0.7));
                -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px;
            }
            .ns-console-subtitle { font-size: 12px; color: rgba(255, 255, 255, 0.5); font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
            .ns-console-tabs { display: flex; padding: 0 16px; gap: 8px; margin-bottom: 16px; }
            .ns-tab {
                padding: 8px 16px; border-radius: 12px; font-size: 13px; font-weight: 600;
                cursor: pointer; transition: all 0.2s; background: rgba(255, 255, 255, 0.05);
                color: rgba(255, 255, 255, 0.6); border: 1px solid transparent;
            }
            .ns-tab.active { background: ${CONFIG.STYLES.BUTTON_PRIMARY}20; color: var(--ns-green); border: 1px solid ${CONFIG.STYLES.BUTTON_PRIMARY}40; }
            .ns-console-content { padding: 0 20px 24px; display: flex; flex-direction: column; gap: 10px; }
            .ns-btn {
                width: 100%; padding: 12px 18px; background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--ns-border); border-radius: 16px; color: white;
                font-size: 14px; font-weight: 600; cursor: pointer; display: flex;
                align-items: center; gap: 12px; transition: all 0.2s;
            }
            .ns-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); transform: translateX(4px); }
            .ns-btn svg { width: 18px; height: 18px; opacity: 0.7; }
            .ns-btn-primary {
                background: linear-gradient(to right, ${CONFIG.STYLES.BUTTON_PRIMARY}30, ${CONFIG.STYLES.BUTTON_PRIMARY}15);
                border-color: ${CONFIG.STYLES.BUTTON_PRIMARY}40; color: var(--ns-green);
            }
            .ns-btn-primary:hover { background: ${CONFIG.STYLES.BUTTON_PRIMARY}35; border-color: var(--ns-green); }
            .ns-input-group { background: rgba(0, 0, 0, 0.2); padding: 16px; border-radius: 20px; border: 1px solid var(--ns-border); }
            .ns-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.4); margin-bottom: 8px; display: block; }
            .ns-input { width: 100%; background: transparent; border: none; color: white; font-size: 15px; outline: none; padding: 4px 0; }
            .ns-select {
                width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--ns-border);
                border-radius: 12px; color: white; padding: 10px; outline: none; font-size: 13px;
                appearance: none; -webkit-appearance: none; -moz-appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.7)' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat; background-position: right 12px center;
                background-size: 12px; padding-right: 30px; cursor: pointer; transition: all 0.2s;
            }
            .ns-select:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); }
            .ns-select option { background: var(--ns-bg); color: white; padding: 8px; }
            /* Checkbox Styles */
            .ns-checkbox-container { z-index: 1000; display: flex; align-items: center; justify-content: center; }
            .ns-checkbox {
                appearance: none; width: 20px; height: 20px; border: 2px solid var(--ns-green);
                border-radius: 6px; cursor: pointer; background: rgba(0,0,0,0.3);
                transition: all 0.2s; position: relative; z-index: 1001;
            }
            .ns-checkbox:checked { background: var(--ns-green); box-shadow: 0 0 10px var(--ns-green); }
            .ns-checkbox:checked::after {
                content: '✓'; position: absolute; color: white; font-size: 14px;
                top: 50%; left: 50%; transform: translate(-50%, -50%);
            }
            .ns-bulk-controls { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 12px; }
            .ns-bulk-btn {
                padding: 6px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--ns-border);
                border-radius: 8px; color: rgba(255, 255, 255, 0.7); font-size: 11px;
                font-weight: 600; cursor: pointer; text-align: center; transition: all 0.2s;
            }
            .ns-bulk-btn:hover { background: rgba(255, 255, 255, 0.1); color: white; }

            /* OpenClaw Specific Overrides */
            .chat-group { position: relative; }
            .chat-group.user .ns-checkbox { position: absolute; right: 25px; top: 12px; }
            .chat-group.assistant .ns-checkbox { position: absolute; left: 10px; top: 42px; }
        `;
        document.head.appendChild(style);
    }

    // ============================================================================
    // MENU CREATION
    // ============================================================================
    function createMenu() {
        const orb = document.createElement('div');
        orb.className = 'ns-orb';
        orb.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2zm0,18c-3.31,0-6-2.69-6-6,0-1.01,.25-1.97,.7-2.8l1.46,1.46c-.11,.43-.16,.88-.16,1.34,0,2.21,1.79,4,4,4s4-1.79,4-4-1.79-4-4-4c-.46,0-.91,.05-1.34,.16l-1.46-1.46c.83-.45,1.79-.7,2.8-.7,3.31,0,6,2.69,6,6s-2.69,6-6,6z"/></svg>`;
        document.body.appendChild(orb);

        const consoleEl = document.createElement('div');
        consoleEl.className = 'ns-console';
        consoleEl.innerHTML = `
            <div class="ns-console-header">
                <div class="ns-console-subtitle">Neural Interface</div>
                <div class="ns-console-title">Noosphere Reflect</div>
            </div>
            <div class="ns-console-tabs">
                <div class="ns-tab active" data-target="ns-pane-export">Export</div>
                <div class="ns-tab" data-target="ns-pane-config">Configuration</div>
            </div>
            <div class="ns-console-content" id="ns-pane-export">
                <div class="ns-bulk-controls">
                    <div class="ns-bulk-btn" id="ns-select-all">All</div>
                    <div class="ns-bulk-btn" id="ns-select-user">User</div>
                    <div class="ns-bulk-btn" id="ns-select-ai">AI</div>
                    <div class="ns-bulk-btn" id="ns-select-none">None</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button class="ns-btn" id="ns-copy-md">Copy MD</button>
                    <button class="ns-btn" id="ns-copy-json">Copy JSON</button>
                </div>
                <button class="ns-btn ns-btn-primary" id="ns-dl-md">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    Download .MD
                </button>
                <div class="ns-stats" id="ns-stats" style="font-size: 11px; color: #888; text-align: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">0 messages selected</div>
            </div>
            <div class="ns-console-content" id="ns-pane-config" style="display: none;">
                <div class="ns-input-group">
                    <span class="ns-label">Chat Title</span>
                    <input type="text" class="ns-input" id="ns-manual-title" placeholder="e.g. OpenClaw Research Session">
                </div>
                <div class="ns-input-group">
                    <span class="ns-label">Filename Prefix</span>
                    <input type="text" class="ns-input" id="ns-custom-name" placeholder="OpenClaw_Export">
                </div>
                <div style="padding: 0 4px;">
                    <span class="ns-label">Naming Segment</span>
                    <select class="ns-select" id="ns-naming-format">
                        <option value="kebab-case">kebab-case</option>
                        <option value="snake_case">snake_case</option>
                        <option value="PascalCase">PascalCase</option>
                        <option value="camelCase">camelCase</option>
                    </select>
                </div>
            </div>
        `;
        document.body.appendChild(consoleEl);

        orb.onclick = () => {
            const isVisible = consoleEl.style.display === 'flex';
            consoleEl.style.display = isVisible ? 'none' : 'flex';
        };

        consoleEl.querySelectorAll('.ns-tab').forEach(tab => {
            tab.onclick = () => {
                consoleEl.querySelectorAll('.ns-tab').forEach(t => t.classList.remove('active'));
                consoleEl.querySelectorAll('.ns-console-content').forEach(c => c.style.display = 'none');
                tab.classList.add('active');
                document.getElementById(tab.dataset.target).style.display = 'flex';
            };
        });

        document.getElementById('ns-copy-md').addEventListener('click', () => ExportService.exportToClipboard('markdown'));
        document.getElementById('ns-copy-json').addEventListener('click', () => ExportService.exportToClipboard('json'));
        document.getElementById('ns-dl-md').addEventListener('click', () => ExportService.exportToFile('markdown'));
    }

    // ============================================================================
    // CHECKBOX INJECTION
    // ============================================================================
    function injectCheckboxes() {
        const messages = document.querySelectorAll(`${CONFIG.SELECTORS.USER_MESSAGE}, ${CONFIG.SELECTORS.AI_MESSAGE}`);
        messages.forEach(msg => {
            if (msg.querySelector(`.${CONFIG.CHECKBOX_CLASS}`)) return;

            msg.style.position = 'relative';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = CONFIG.CHECKBOX_CLASS;
            checkbox.dataset.messageId = Math.random().toString(36).substr(2, 9);
            checkbox.addEventListener('change', updateStats);
            msg.appendChild(checkbox);
        });
    }

    function updateStats() {
        const checked = document.querySelectorAll(`.${CONFIG.CHECKBOX_CLASS}:checked`);
        const stats = document.getElementById('ns-stats');
        if (stats) {
            stats.textContent = `${checked.length} message${checked.length !== 1 ? 's' : ''} selected`;
        }
    }

    function setupObserver() {
        const targetSelector = `${CONFIG.SELECTORS.USER_MESSAGE}, ${CONFIG.SELECTORS.AI_MESSAGE}`;
        const observer = new MutationObserver((mutations) => {
            let shouldInject = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.matches?.(targetSelector) ||
                                node.querySelector?.(targetSelector)) {
                                shouldInject = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldInject) break;
            }
            if (shouldInject) {
                setTimeout(injectCheckboxes, 500);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ============================================================================
    // TEXT EXTRACTION
    // ============================================================================
    function extractUserText(element) {
        const textEl = element.querySelector(CONFIG.SELECTORS.CHAT_TEXT);
        if (!textEl) return '';
        return textEl.innerText.trim();
    }

    function extractAIText(element) {
        const textEl = element.querySelector(CONFIG.SELECTORS.CHAT_TEXT);
        if (!textEl) return '';

        // Clone to avoid modifying live DOM
        const clone = textEl.cloneNode(true);

        // Remove any UI artifacts that might be inside chat-text
        clone.querySelectorAll('button, svg, .chat-bubble-actions').forEach(el => el.remove());

        return clone.innerText.trim();
    }

    // ============================================================================
    // METADATA EXTRACTION
    // ============================================================================
    function extractMetadata(element) {
        const metadata = {};

        const senderEl = element.querySelector(CONFIG.SELECTORS.SENDER_NAME);
        if (senderEl) metadata.sender = senderEl.textContent.trim();

        const timestampEl = element.querySelector(CONFIG.SELECTORS.TIMESTAMP);
        if (timestampEl) metadata.timestamp = timestampEl.textContent.trim();

        const modelEl = element.querySelector(CONFIG.SELECTORS.MODEL_NAME);
        if (modelEl) metadata.model = modelEl.textContent.trim();

        // Extract token counts
        const tokenEls = element.querySelectorAll(CONFIG.SELECTORS.TOKENS_UP);
        if (tokenEls.length > 0) {
            metadata.tokens = Array.from(tokenEls).map(el => el.textContent.trim()).join(' ');
        }

        const cacheEl = element.querySelector(CONFIG.SELECTORS.CACHE_INFO);
        if (cacheEl) metadata.cache = cacheEl.textContent.trim();

        const ctxEl = element.querySelector(CONFIG.SELECTORS.CTX_INFO);
        if (ctxEl) metadata.ctx = ctxEl.textContent.trim();

        return metadata;
    }

    // ============================================================================
    // EXPORT SERVICE
    // ============================================================================
    const ExportService = {
        getSelectedMessages() {
            const checked = document.querySelectorAll(`.${CONFIG.CHECKBOX_CLASS}:checked`);
            const messages = [];

            checked.forEach(checkbox => {
                const msgEl = checkbox.closest(CONFIG.SELECTORS.MESSAGE_CONTAINER);
                if (!msgEl) return;

                const isUser = msgEl.classList.contains('user');
                const isAI = msgEl.classList.contains('assistant');

                if (!isUser && !isAI) return;

                const text = isUser ? extractUserText(msgEl) : extractAIText(msgEl);
                if (!text) return;

                const metadata = extractMetadata(msgEl);

                messages.push({
                    type: isUser ? 'prompt' : 'response',
                    role: isUser ? 'user' : 'assistant',
                    content: text,
                    metadata: metadata
                });
            });

            return messages;
        },

        getConversationTitle() {
            const titleEl = document.querySelector(CONFIG.SELECTORS.CONVERSATION_TITLE);
            return titleEl ? titleEl.textContent.trim() : 'OpenClaw Chat';
        },

        buildMarkdown(messages) {
            const title = this.getConversationTitle();
            const now = new Date();
            const dateStr = now.toLocaleString();
            const url = window.location.href;

            // Collect unique models from metadata
            const models = [...new Set(messages
                .map(m => m.metadata?.model)
                .filter(Boolean))];

            // Build metadata block
            let md = `# ${title}\n\n`;
            md += `> **🤖 Model:** ${models.join(', ') || 'OpenClaw'}\n`;
            md += `> **🌐 Date:** ${dateStr}\n`;
            md += `> **🌐 Source:** ${url}\n`;
            md += `> **🏷️ Tags:** openclaw, export\n`;
            md += `> **📂 Artifacts:** ${messages.length} messages\n`;
            md += `> **📊 Metadata:**\n`;

            messages.forEach((msg, idx) => {
                const meta = msg.metadata || {};
                if (meta.model || meta.tokens || meta.cache || meta.ctx) {
                    md += `>   ${idx + 1}. ${msg.role}${meta.model ? ` [${meta.model}]` : ''}`;
                    if (meta.tokens) md += ` | ${meta.tokens}`;
                    if (meta.cache) md += ` | ${meta.cache}`;
                    if (meta.ctx) md += ` | ${meta.ctx}`;
                    md += '\n';
                }
            });

            md += '\n---\n\n';

            // Messages
            messages.forEach(msg => {
                const meta = msg.metadata || {};
                const senderLabel = msg.type === 'prompt' ? 'User' : 'OpenClaw';
                const emoji = msg.type === 'prompt' ? '👤' : '🤖';

                md += `#### ${msg.type === 'prompt' ? 'Prompt' : 'Response'} - ${senderLabel} ${emoji}:\n\n`;
                md += msg.content;
                md += '\n\n---\n\n';
            });

            // Footer
            md += `###### Noosphere Reflect\n`;
            md += `###### ***Meaning Through Memory***\n`;
            md += `###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n`;

            return md;
        },

        buildJSON(messages) {
            const title = this.getConversationTitle();
            const now = new Date();
            const url = window.location.href;

            // Collect unique models
            const models = [...new Set(messages
                .map(m => m.metadata?.model)
                .filter(Boolean))];

            const data = {
                messages: messages.map(msg => ({
                    type: msg.type,
                    role: msg.role,
                    content: msg.content,
                    metadata: msg.metadata
                })),
                metadata: {
                    title: title,
                    platform: 'OpenClaw',
                    date: now.toISOString(),
                    source: url,
                    tags: ['openclaw', 'export'],
                    models: models,
                    messageCount: messages.length
                },
                exportedBy: {
                    tool: 'Noosphere Reflect - OpenClaw DOM Scraper',
                    version: '1.0',
                    timestamp: now.toISOString()
                }
            };

            return JSON.stringify(data, null, 2);
        },

        async exportToClipboard(format) {
            const messages = this.getSelectedMessages();
            if (messages.length === 0) {
                Utils.createNotification('⚠️ No messages selected!');
                return;
            }

            const content = format === 'json'
                ? this.buildJSON(messages)
                : this.buildMarkdown(messages);

            try {
                await navigator.clipboard.writeText(content);
                Utils.createNotification(`✅ ${messages.length} messages copied as ${format.toUpperCase()}!`);
            } catch (err) {
                console.error('[Noosphere] Clipboard failed:', err);
                Utils.createNotification('❌ Clipboard failed. Try downloading instead.');
            }
        },

        exportToFile(format) {
            const messages = this.getSelectedMessages();
            if (messages.length === 0) {
                Utils.createNotification('⚠️ No messages selected!');
                return;
            }

            const content = format === 'json'
                ? this.buildJSON(messages)
                : this.buildMarkdown(messages);

            const title = this.getConversationTitle();
            const safeTitle = Utils.sanitizeFilename(title);
            const ext = format === 'json' ? 'json' : 'md';
            const filename = `openclaw_${safeTitle}_${Utils.getDateString()}.${ext}`;

            const blob = new Blob([content], {
                type: format === 'json' ? 'application/json' : 'text/markdown'
            });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Utils.createNotification(`💾 Downloaded ${filename}`);
        },

        execute(format, method) {
            if (method === 'clipboard') {
                this.exportToClipboard(format);
            } else {
                this.exportToFile(format);
            }
        }
    };

    // ============================================================================
    // BULK CONTROLS
    // ============================================================================
    function setupBulkControls() {
        const bulkSelect = (type) => {
            const checkboxes = document.querySelectorAll(`.${CONFIG.CHECKBOX_CLASS}`);
            checkboxes.forEach(cb => {
                const msgEl = cb.closest(CONFIG.SELECTORS.MESSAGE_CONTAINER);
                if (!msgEl) return;

                switch (type) {
                    case 'all':
                        cb.checked = true;
                        break;
                    case 'none':
                        cb.checked = false;
                        break;
                    case 'user':
                        cb.checked = msgEl.classList.contains('user');
                        break;
                    case 'ai':
                        cb.checked = msgEl.classList.contains('assistant');
                        break;
                }
            });
            updateStats();
        };

        document.getElementById('ns-select-all').onclick = () => bulkSelect('all');
        document.getElementById('ns-select-user').onclick = () => bulkSelect('user');
        document.getElementById('ns-select-ai').onclick = () => bulkSelect('ai');
        document.getElementById('ns-select-none').onclick = () => bulkSelect('none');
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    function init() {
        injectStyles();
        createMenu();
        injectCheckboxes();
        setupObserver();
        setupBulkControls();

        console.log('[Noosphere] Neural Console is live on OpenClaw.');
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
