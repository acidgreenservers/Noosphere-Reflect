/**
 * Claude Chat Exporter - Claude content script
 * Exports Claude chat conversations to Markdown with thought process preservation
 */

(function () {
    'use strict';

    // ============================================================================
    // CONSTANTS
    // ============================================================================
    const CONFIG = {
        CHECKBOX_CLASS: 'ns-checkbox',

        SELECTORS: {
            // Chat container
            CHAT_CONTAINER: '[data-testid="chat-messages"]',

            // Message turns
            CONVERSATION_TURN: '[data-test-render-count]',
            USER_MESSAGE: '[data-testid="user-message"]',

            // Claude response
            CLAUDE_RESPONSE: '.font-claude-response',

            // Thought process
            THOUGHT_CONTAINER: '.border-border-300.rounded-lg',
            THOUGHT_CONTENT: '.standard-markdown',

            // UI elements
            COPY_BUTTON: '[data-testid="action-bar-copy"]',
            CONVERSATION_TITLE: '[data-testid="chat-title-button"] .truncate',

            // Artifacts
            ARTIFACT_CONTAINER: '[data-testid="artifact-container"]'
        },

        TIMING: {
            SCROLL_DELAY: 2000,
            CLIPBOARD_CLEAR_DELAY: 200,
            CLIPBOARD_READ_DELAY: 300,
            MOUSEOVER_DELAY: 500,
            POPUP_DURATION: 900,
            MAX_SCROLL_ATTEMPTS: 60,
            MAX_STABLE_SCROLLS: 4,
            MAX_CLIPBOARD_ATTEMPTS: 10
        },

        STYLES: {
            BUTTON_PRIMARY: '#c76f3b', // Claude orange
            BUTTON_HOVER: '#a55f2f',
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
                .replace(/[<>:"/\\|?*]/g, '')
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
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'opacity 0.3s ease'
            });
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, CONFIG.TIMING.POPUP_DURATION);
        }
    };

    // UI AND CHECKBOX FUNCTIONS - PORTED FROM NEURAL CONSOLE
    // ============================================================================

    function injectStyles() {
        const styleId = 'noosphere-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            :root {
                --ns-green: #10b981;
                --ns-purple: #8b5cf6;
                --ns-amber: #f59e0b;
                --ns-bg: rgba(17, 24, 39, 0.7);
                --ns-border: rgba(255, 255, 255, 0.1);
                --ns-glow: 0 0 20px rgba(16, 185, 129, 0.3);
            }
            .ns-orb {
                position: fixed; bottom: 25px; right: 25px; width: 56px; height: 56px;
                background: linear-gradient(135deg, var(--ns-green), var(--ns-purple));
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                cursor: pointer; z-index: 100000; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            .ns-orb:hover { transform: scale(1.1) rotate(5deg); box-shadow: var(--ns-glow); }
            .ns-orb svg { width: 28px; height: 28px; fill: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
            .ns-console {
                position: fixed; bottom: 95px; right: 25px; width: 340px;
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
            .ns-tab.active { background: rgba(16, 185, 129, 0.15); color: var(--ns-green); border: 1px solid rgba(16, 185, 129, 0.3); }
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
                background: linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
                border-color: rgba(16, 185, 129, 0.3); color: var(--ns-green);
            }
            .ns-btn-primary:hover { background: rgba(16, 185, 129, 0.25); border-color: var(--ns-green); }
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
                transition: all 0.2s; position: relative;
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

            /* Claude Specific Overrides */
            .user-message-container .ns-checkbox-container { position: absolute; left: -30px; top: 12px; }
            .claude-response-container .ns-checkbox-container { position: absolute; left: -30px; top: 12px; }
        `;
        document.head.appendChild(style);
    }

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
            </div>
            <div class="ns-console-content" id="ns-pane-config" style="display: none;">
                <div class="ns-input-group">
                    <span class="ns-label">Chat Title</span>
                    <input type="text" class="ns-input" id="ns-manual-title" placeholder="e.g. Brainstorming Session">
                </div>
                <div class="ns-input-group">
                    <span class="ns-label">Filename Prefix</span>
                    <input type="text" class="ns-input" id="ns-custom-name" placeholder="Claude_Export">
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
                tab.classList.add('active');
                const target = tab.dataset.target;
                consoleEl.querySelectorAll('.ns-console-content').forEach(c => {
                    c.style.display = c.id === target ? 'flex' : 'none';
                });
            };
        });
    }

    function injectCheckboxes() {
        const createCheckbox = (type, container) => {
            if (container.querySelector('.ns-checkbox-container')) return;
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'ns-checkbox-container';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'ns-checkbox';
            checkbox.dataset.type = type;
            checkbox.checked = true;
            checkboxContainer.appendChild(checkbox);
            container.style.position = 'relative';
            container.prepend(checkboxContainer);
        };

        const turns = document.querySelectorAll(CONFIG.SELECTORS.CONVERSATION_TURN);
        turns.forEach(turn => {
            const userMsg = turn.querySelector(CONFIG.SELECTORS.USER_MESSAGE);
            const claudeResponse = turn.querySelector(CONFIG.SELECTORS.CLAUDE_RESPONSE);

            if (userMsg) {
                const target = userMsg.closest('.group') || userMsg;
                target.classList.add('user-message-container');
                createCheckbox('user', target);
            }
            if (claudeResponse) {
                const target = claudeResponse.closest('.group') || claudeResponse;
                target.classList.add('claude-response-container');
                createCheckbox('assistant', target);
            }
        });
    }

    function setupObserver() {
        const observer = new MutationObserver(() => {
            injectCheckboxes();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ============================================================================
    // EXPORT SERVICE
    // ============================================================================
    const ExportService = {
        getConversationTitle() {
            const manualTitle = document.getElementById('ns-manual-title')?.value;
            if (manualTitle?.trim()) return manualTitle.trim();

            const titleEl = document.querySelector(CONFIG.SELECTORS.CONVERSATION_TITLE);
            return titleEl?.textContent?.trim() || document.title || 'Claude_Conversation';
        },

        generateFilename(customFilename, conversationTitle, format = 'kebab-case') {
            const dateStr = Utils.getDateString();
            const baseName = customFilename?.trim() || conversationTitle;

            // Apply formatting
            let name = baseName.replace(/[<>:"/\\|?*.]/g, '').trim();
            let formattedName = '';

            switch (format) {
                case 'kebab-case':
                    formattedName = name.replace(/[\s_]+/g, '-').replace(/-+/g, '-').toLowerCase();
                    break;
                case 'Kebab-Case':
                    formattedName = name.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
                    break;
                case 'snake_case':
                    formattedName = name.replace(/[\s-]+/g, '_').replace(/_+/g, '_').toLowerCase();
                    break;
                case 'Snake_Case':
                    formattedName = name.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('_');
                    break;
                case 'PascalCase':
                    formattedName = name.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
                    break;
                case 'camelCase':
                    formattedName = name.split(/[\s_-]+/).map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
                    break;
                default:
                    formattedName = name.replace(/\s+/g, '_').toLowerCase();
            }

            return `${formattedName}_${dateStr}.md`;
        },

        buildMarkdown(conversationTitle) {
            const now = new Date();
            const dateStr = now.toLocaleString();
            const sourceUrl = window.location.href;

            const turns = document.querySelectorAll(CONFIG.SELECTORS.CONVERSATION_TURN);
            let userCount = 0;
            let aiCount = 0;
            let artifactCount = 0;
            let selectedMessages = [];

            turns.forEach((turn) => {
                const checkboxes = turn.querySelectorAll('.ns-checkbox');
                checkboxes.forEach(cb => {
                    if (!cb.checked) return;

                    const container = cb.closest('.user-message-container, .claude-response-container');
                    if (container) {
                        selectedMessages.push({
                            type: cb.dataset.type,
                            element: container,
                            hasArtifact: !!container.querySelector(CONFIG.SELECTORS.ARTIFACT_CONTAINER)
                        });

                        if (cb.dataset.type === 'user') userCount++;
                        if (cb.dataset.type === 'assistant') aiCount++;
                        if (container.querySelector(CONFIG.SELECTORS.ARTIFACT_CONTAINER)) artifactCount++;
                    }
                });
            });

            const totalMessages = userCount + aiCount;
            const exchanges = selectedMessages.length;

            let markdown = `---
> **🤖 Model:** Claude
>
> **🌐 Date:** ${dateStr}
>
> **🌐 Source:** [Claude Chat](${sourceUrl})
>
> **🏷️ Tags:** Claude, AI-Chat, Noosphere
>
> **📂 Artifacts:** [Internal](${sourceUrl})
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
>> **Total Artifacts:** ${artifactCount}
---

## Title:

> ${conversationTitle}

--- 

`;

            selectedMessages.forEach((msg, index) => {
                if (msg.type === 'user') {
                    const content = msg.element.querySelector(CONFIG.SELECTORS.USER_MESSAGE);
                    markdown += `#### Prompt - User 👤:\n\n`;
                    markdown += `${content?.textContent?.trim() || ''}\n\n`;
                }

                if (msg.type === 'assistant') {
                    markdown += `#### Response - Model 🤖:\n\n`;

                    // Extract thinking process if present (Claude uses specific containers for thoughts often)
                    const thoughtContainer = msg.element.querySelector(CONFIG.SELECTORS.THOUGHT_CONTAINER);
                    if (thoughtContainer) {
                        const thoughtContent = thoughtContainer.querySelector(CONFIG.SELECTORS.THOUGHT_CONTENT);
                        if (thoughtContent) {
                            markdown += "```\nThoughts:\n";
                            markdown += `${thoughtContent.textContent?.trim() || ''}\n`;
                            markdown += "```\n\n";
                        }
                    }

                    // Extract main response
                    const claudeResponse = msg.element.querySelector(CONFIG.SELECTORS.CLAUDE_RESPONSE);
                    if (claudeResponse) {
                        // Exclude thought process from main response if it's nested
                        const responseContent = claudeResponse.querySelector('.standard-markdown:not(.border-border-300 *)');
                        if (responseContent) {
                            markdown += `${responseContent.textContent?.trim() || ''}\n\n`;
                        } else {
                            markdown += `${claudeResponse.textContent?.trim() || ''}\n\n`;
                        }
                    }
                }

                if (index < selectedMessages.length - 1) {
                    markdown += `---\n\n`;
                }
            });

            markdown += `\n---\n\n`;
            markdown += `###### Noosphere Reflect\n`;
            markdown += `###### ***Meaning Through Memory***\n\n`;
            markdown += `###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n`;

            return markdown;
        },

        exportToClipboard(markdown) {
            navigator.clipboard.writeText(markdown).then(() => {
                Utils.createNotification('✅ Copied to clipboard!');
            }).catch(err => {
                console.error('Clipboard error:', err);
                Utils.createNotification('❌ Clipboard failed');
            });
        },

        exportToFile(markdown, filename) {
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            Utils.createNotification(`✅ Downloaded ${filename}`);
        },

        execute(exportMode, customFilename) {
            const turns = document.querySelectorAll(CONFIG.SELECTORS.CONVERSATION_TURN);
            if (!turns.length) {
                Utils.createNotification('❌ No messages found');
                return;
            }

            const conversationTitle = this.getConversationTitle();
            const markdown = this.buildMarkdown(conversationTitle);
            const namingFormat = document.getElementById('ns-naming-format')?.value || 'kebab-case';
            const filename = this.generateFilename(customFilename, conversationTitle, namingFormat);

            if (exportMode === 'clipboard') {
                this.exportToClipboard(markdown);
            } else {
                this.exportToFile(markdown, filename);
            }
        }
    };

    // ============================================================================
    // MAIN INITIALIZATION
    // ============================================================================
    function init() {
        console.log('[Noosphere] Initializing Claude Exporter with Neural Console...');

        // Ensure no old UI is present
        document.getElementById('claude-export-btn')?.remove();
        document.getElementById('claude-export-dropdown')?.remove();

        injectStyles();
        createMenu();
        injectCheckboxes();
        setupObserver();

        // Connect UI buttons to ExportService
        document.getElementById('ns-copy-md').onclick = () => {
            const customFilename = document.getElementById('ns-custom-name')?.value;
            ExportService.execute('clipboard', customFilename);
        };

        document.getElementById('ns-dl-md').onclick = () => {
            const customFilename = document.getElementById('ns-custom-name')?.value;
            ExportService.execute('file', customFilename);
        };

        document.getElementById('ns-copy-json').onclick = () => {
            const customFilename = document.getElementById('ns-custom-name')?.value;
            Utils.createNotification('JSON export not yet implemented. Copying Markdown instead.');
            ExportService.execute('clipboard', customFilename);
        };

        // Bulk selection logic
        const bulkSelect = (type) => {
            document.querySelectorAll('.ns-checkbox').forEach(cb => {
                let shouldBeChecked = false;
                if (type === 'all') shouldBeChecked = true;
                if (type === 'none') shouldBeChecked = false;
                if (type === 'user' && cb.dataset.type === 'user') shouldBeChecked = true;
                if (type === 'ai' && cb.dataset.type === 'assistant') shouldBeChecked = true;
                cb.checked = shouldBeChecked;
            });
        };

        document.getElementById('ns-select-all').onclick = () => bulkSelect('all');
        document.getElementById('ns-select-user').onclick = () => bulkSelect('user');
        document.getElementById('ns-select-ai').onclick = () => bulkSelect('ai');
        document.getElementById('ns-select-none').onclick = () => bulkSelect('none');

        console.log('[Noosphere] Neural Console is live on Claude.');
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
