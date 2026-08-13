(function () {
    'use strict';

    /*
     * ============================================================
     * Noosphere Reflect — Mistral Vibe Native Exporter
     * ============================================================
     *
     * Native Slide-Over Drawer & Markdown Synthesizer for Mistral Vibe
     * (chat.mistral.ai).
     *
     * Features:
     *   - Integrated Top Bar Trigger: Sits natively right next to "New chat"
     *   - Native Mistral Vibe UI Theme (#161618 Dark Onyx, #ff5e00 Orange)
     *   - Automated Thought Expansion: Pre-expands "Thought for X s" 
     *     collapsibles to ensure 100% of reasoning process is archived
     *   - Recursive DOM-to-Markdown parser preserving full formatting
     *     (Headings, bold/italic, lists, pipe tables, code blocks)
     *   - Interactive turn accordion drawer with batch selection controls
     *   - Noosphere Reflect frontmatter metadata & signature footer lock
     *   - Dual export triggers: Copy to Clipboard or File Download
     *
     * Namespace: ns-vibe
     * ============================================================
     */

    const CONFIG = {
        SELECTORS: {
            USER_MESSAGE: '[data-message-author-role="user"]',
            USER_CONTENT: '.whitespace-pre-wrap',
            AI_MESSAGE: '[data-message-author-role="assistant"]',
            REASONING_CONTAINER: '[data-message-part-type="reasoning"]',
            ANSWER_CONTAINER: '[data-message-part-type="answer"]',
            CONVERSATION_TITLE: '.min-h-5\\.5.truncate, header h1, title',
            TOP_BAR: '[data-desktop-window-top-bar="true"]',
            NEW_CHAT_CONTAINER: '[data-desktop-window-top-bar="true"] div.ps-3',
            NOISE_ELEMENTS: 'button, svg, .copy-button, [aria-hidden="true"]'
        },

        THEME: {
            BG_CANVAS: '#161618',
            SURFACE_DARK: '#222226',
            SURFACE_HOVER: '#2c2c32',
            BORDER: '#323238',
            PRIMARY_ORANGE: '#ff5e00',
            PRIMARY_ORANGE_HOVER: '#e05300',
            TEXT_MAIN: '#f3f4f6',
            TEXT_MUTED: '#9ca3af'
        }
    };

    const STATE = {
        messages: [],
        selectedIds: new Set(),
        expandedId: null,
        exportFormat: 'markdown' // 'markdown' or 'json'
    };

    // ============================================================
    // Utilities
    // ============================================================

    const Utils = {
        createNotification(message, success = true) {
            const notification = document.createElement('div');
            notification.textContent = message;

            Object.assign(notification.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: success ? CONFIG.THEME.PRIMARY_ORANGE : '#dc2626',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '200000',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                transition: 'opacity 0.3s ease',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            });

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 2200);
        },

        cleanText(text) {
            return (text || '')
                .replace(/\u00a0/g, ' ')
                .replace(/[ \t]+\n/g, '\n')
                .replace(/\n[ \t]+/g, '\n')
                .replace(/[ \t]{2,}/g, ' ')
                .trim();
        },

        normalizeMarkdown(text) {
            return text
                .replace(/\n{3,}/g, '\n\n')
                .replace(/[ \t]+\n/g, '\n')
                .trim();
        },

        sanitizeFilename(text) {
            return (text || 'Mistral_Vibe_Session')
                .replace(/[<>:"/\\|?*]/g, '')
                .replace(/\s+/g, '_')
                .substring(0, 80);
        },

        getDateString() {
            const now = new Date();
            const pad = n => n.toString().padStart(2, '0');
            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        }
    };

    // ============================================================
    // Recursive HTML to Markdown Parser
    // ============================================================

    function renderNodeToMarkdown(node) {
        if (!node) return '';

        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        if (node.matches && node.matches(CONFIG.SELECTORS.NOISE_ELEMENTS)) {
            return '';
        }

        const tag = node.tagName.toLowerCase();

        const inner = () =>
            Array.from(node.childNodes)
                .map(renderNodeToMarkdown)
                .join('');

        switch (tag) {
            case 'h1': return `\n\n# ${Utils.cleanText(inner())}\n\n`;
            case 'h2': return `\n\n## ${Utils.cleanText(inner())}\n\n`;
            case 'h3': return `\n\n### ${Utils.cleanText(inner())}\n\n`;
            case 'h4': return `\n\n#### ${Utils.cleanText(inner())}\n\n`;
            case 'h5': return `\n\n##### ${Utils.cleanText(inner())}\n\n`;
            case 'h6': return `\n\n###### ${Utils.cleanText(inner())}\n\n`;

            case 'p': {
                const text = inner().trim();
                return text ? `\n\n${text}\n\n` : '';
            }

            case 'strong':
            case 'b': {
                const text = inner().trim();
                return text ? `**${text}**` : '';
            }

            case 'em':
            case 'i': {
                const text = inner().trim();
                return text ? `*${text}*` : '';
            }

            case 'code': {
                if (node.parentElement?.tagName.toLowerCase() === 'pre') {
                    return inner();
                }
                return `\`${inner().replace(/`/g, '\\`')}\``;
            }

            case 'pre': {
                const clone = node.cloneNode(true);
                clone.querySelectorAll('button, svg, .copy-button').forEach(n => n.remove());
                const lang = clone.getAttribute('data-lang') || clone.className.match(/lang-(\w+)/)?.[1] || '';
                const codeText = clone.textContent || '';
                return `\n\n\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n\n`;
            }

            case 'blockquote': {
                const text = Utils.cleanText(inner());
                return `\n\n> ${text.replace(/\n/g, '\n> ')}\n\n`;
            }

            case 'hr': return '\n\n---\n\n';
            case 'br': return '\n';

            case 'a': {
                const label = Utils.cleanText(inner());
                const href = node.getAttribute('href');
                return href ? `[${label || href}](${href})` : label;
            }

            case 'ul':
            case 'ol': {
                const isOrdered = tag === 'ol';
                const items = Array.from(node.children)
                    .filter(child => child.tagName.toLowerCase() === 'li')
                    .map((li, idx) => {
                        const liText = Utils.cleanText(renderNodeToMarkdown(li));
                        const prefix = isOrdered ? `${idx + 1}.` : '-';
                        return `${prefix} ${liText}`;
                    })
                    .filter(Boolean);

                return `\n\n${items.join('\n')}\n\n`;
            }

            case 'li': return inner().trim();

            case 'table': {
                const rows = Array.from(node.querySelectorAll('tr'));
                if (!rows.length) return '';

                const matrix = rows.map(row => {
                    const cells = Array.from(row.querySelectorAll('th, td'));
                    return cells.map(cell => Utils.cleanText(renderNodeToMarkdown(cell)));
                });

                const colCount = Math.max(...matrix.map(r => r.length), 0);
                if (!colCount) return '';

                const escapeCell = val => String(val || '').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();

                const normalized = matrix.map(r => {
                    const copy = r.slice();
                    while (copy.length < colCount) copy.push('');
                    return copy;
                });

                const header = normalized[0].map(escapeCell);
                const separator = new Array(colCount).fill('---');
                const output = [`| ${header.join(' | ')} |`, `| ${separator.join(' | ')} |`];

                for (let i = 1; i < normalized.length; i++) {
                    output.push(`| ${normalized[i].map(escapeCell).join(' | ')} |`);
                }

                return `\n\n${output.join('\n')}\n\n`;
            }

            default: return inner();
        }
    }

    function htmlToMarkdown(element) {
        if (!element) return '';
        const clone = element.cloneNode(true);
        clone.querySelectorAll(CONFIG.SELECTORS.NOISE_ELEMENTS).forEach(n => n.remove());
        return Utils.normalizeMarkdown(renderNodeToMarkdown(clone));
    }

    // ============================================================
    // Vibe DOM Scanner & Pre-Expansion
    // ============================================================

    function autoExpandThoughts() {
        const thoughtContainers = document.querySelectorAll('.-ms-10');
        thoughtContainers.forEach(container => {
            const reasoningEl = container.parentElement?.querySelector(CONFIG.SELECTORS.REASONING_CONTAINER);
            const isHidden = !reasoningEl || reasoningEl.offsetParent === null;

            if (isHidden) {
                const btn = container.querySelector('button');
                if (btn && btn.textContent.includes('Thought')) {
                    btn.click();
                }
            }
        });
    }

    function scanThreadMessages() {
        autoExpandThoughts();

        const elements = Array.from(document.querySelectorAll([
            CONFIG.SELECTORS.USER_MESSAGE,
            CONFIG.SELECTORS.AI_MESSAGE
        ].join(', ')));

        STATE.messages = elements.map((el, idx) => {
            const isUser = el.matches(CONFIG.SELECTORS.USER_MESSAGE);
            let text = '';
            let thoughts = '';

            if (isUser) {
                const contentEl = el.querySelector(CONFIG.SELECTORS.USER_CONTENT) || el;
                text = Utils.cleanText(contentEl.innerText || '');
            } else {
                const reasoningEl = el.querySelector(CONFIG.SELECTORS.REASONING_CONTAINER);
                if (reasoningEl) {
                    thoughts = htmlToMarkdown(reasoningEl);
                }

                const answerEl = el.querySelector(CONFIG.SELECTORS.ANSWER_CONTAINER) || el;
                text = htmlToMarkdown(answerEl);
            }

            const rawPreview = isUser ? text : Utils.cleanText(el.innerText);

            return {
                id: idx,
                role: isUser ? 'user' : 'ai',
                text,
                thoughts,
                preview: rawPreview.substring(0, 75) + '...',
                el
            };
        });

        if (STATE.selectedIds.size === 0) {
            STATE.messages.forEach(m => STATE.selectedIds.add(m.id));
        }
    }

    // ============================================================
    // Output Synthesis (Markdown & JSON)
    // ============================================================

    const ExportService = {
        getExportTitle() {
            const manualTitle = document.getElementById('ns-title-input')?.value?.trim();
            if (manualTitle) return manualTitle;

            const titleEl = document.querySelector(CONFIG.SELECTORS.CONVERSATION_TITLE);
            if (titleEl && titleEl.innerText) {
                return Utils.cleanText(titleEl.innerText).substring(0, 50);
            }

            const firstUserMsg = STATE.messages.find(m => m.role === 'user');
            if (firstUserMsg && firstUserMsg.text) {
                return Utils.cleanText(firstUserMsg.text).substring(0, 50);
            }

            return document.title || 'Mistral_Vibe_Chat';
        },

        buildFrontMatter() {
            const exportedAt = new Date().toLocaleString();
            const sourceUrl = window.location.href;
            const title = this.getExportTitle();

            const selected = STATE.messages.filter(m => STATE.selectedIds.has(m.id));
            const userCount = selected.filter(m => m.role === 'user').length;
            const aiCount = selected.filter(m => m.role === 'ai').length;

            let md = '';
            md += '---\n';
            md += `> **📝 Title:** ${title}\n>\n`;
            md += '> **🤖 Model:** Mistral Vibe\n>\n';
            md += `> **🌐 Exported:** ${exportedAt}\n>\n`;
            md += `> **🌐 Source:** [Mistral Vibe](${sourceUrl})\n>\n`;
            md += '> **🏷️ Tags:** Mistral, Vibe, AI-Chat, Noosphere\n>\n';
            md += `> **📊 Metadata:** ${selected.length} Selected Messages | ${userCount} User | ${aiCount} Mistral\n`;
            md += '---\n\n';

            md += `# ${title}\n\n---\n\n`;

            return md;
        },

        buildMarkdown() {
            let md = this.buildFrontMatter();

            STATE.messages.forEach(msg => {
                if (!STATE.selectedIds.has(msg.id)) return;

                if (msg.role === 'user') {
                    md += `#### Prompt - User 👤:\n\n${msg.text}\n\n---\n\n`;
                } else if (msg.role === 'ai') {
                    md += `#### Response - Mistral Vibe 🧠:\n\n`;

                    if (msg.thoughts) {
                        md += `<details>\n<summary><b>🧠 Thought Process</b></summary>\n\n> ${msg.thoughts.replace(/\n/g, '\n> ')}\n\n</details>\n\n`;
                    }

                    md += `${msg.text}\n\n---\n\n`;
                }
            });

            md += '###### Noosphere Reflect\n';
            md += '###### ***Meaning Through Memory***\n\n';
            md += '###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n';

            return Utils.normalizeMarkdown(md);
        },

        buildJSON() {
            const title = this.getExportTitle();
            const selected = STATE.messages.filter(m => STATE.selectedIds.has(m.id));

            return JSON.stringify({
                metadata: {
                    title,
                    exportedAt: new Date().toISOString(),
                    sourceUrl: window.location.href,
                    model: 'Mistral Vibe'
                },
                messages: selected.map(m => ({
                    role: m.role,
                    thoughts: m.thoughts || null,
                    content: m.text
                }))
            }, null, 2);
        },

        async executeCopy() {
            if (STATE.selectedIds.size === 0) {
                Utils.createNotification('⚠️ Select at least one message', false);
                return;
            }

            try {
                const content = STATE.exportFormat === 'json' ? this.buildJSON() : this.buildMarkdown();
                await navigator.clipboard.writeText(content);
                Utils.createNotification(`✅ Copied ${STATE.selectedIds.size} turns as ${STATE.exportFormat.toUpperCase()}!`);
            } catch (err) {
                console.error('[Noosphere Vibe]', err);
                Utils.createNotification('❌ Clipboard export failed', false);
            }
        },

        async executeDownload() {
            if (STATE.selectedIds.size === 0) {
                Utils.createNotification('⚠️ Select at least one message', false);
                return;
            }

            try {
                const isJson = STATE.exportFormat === 'json';
                const content = isJson ? this.buildJSON() : this.buildMarkdown();
                const title = this.getExportTitle();
                const ext = isJson ? 'json' : 'md';
                const mime = isJson ? 'application/json' : 'text/markdown';

                const filename = `${Utils.sanitizeFilename(title)}_${Utils.getDateString()}.${ext}`;
                const blob = new Blob([content], { type: `${mime};charset=utf-8` });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');

                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);

                Utils.createNotification(`✅ Saved ${filename}`);
            } catch (err) {
                console.error('[Noosphere Vibe]', err);
                Utils.createNotification('❌ Download failed', false);
            }
        }
    };

    // ============================================================
    // UI Construction (Native Header Injection + Drawer Theme)
    // ============================================================

    function injectStyles() {
        if (document.getElementById('noosphere-vibe-styles')) return;

        const style = document.createElement('style');
        style.id = 'noosphere-vibe-styles';
        style.textContent = `
            /* Native Top-Bar Trigger Button */
            .ns-vibe-header-btn {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                height: 28px !important;
                padding: 0 10px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                color: #f3f4f6 !important;
                background: rgba(255, 255, 255, 0.06) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                transition: all 0.15s ease !important;
                user-select: none !important;
                margin-left: 6px !important;
            }
            .ns-vibe-header-btn:hover {
                background: rgba(255, 255, 255, 0.12) !important;
                border-color: rgba(255, 255, 255, 0.2) !important;
            }

            /* Slide-over Drawer Backdrop */
            #ns-vibe-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
                z-index: 100001;
                display: none;
                opacity: 0;
                transition: opacity 0.25s ease;
            }
            #ns-vibe-overlay.active { display: block; opacity: 1; }

            /* Slide-over Panel */
            #ns-vibe-sidebar {
                position: fixed;
                top: 0; right: -380px;
                width: 380px;
                height: 100%;
                background: ${CONFIG.THEME.BG_CANVAS};
                border-left: 1px solid ${CONFIG.THEME.BORDER};
                color: ${CONFIG.THEME.TEXT_MAIN};
                z-index: 100002;
                transition: right 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                flex-direction: column;
                box-shadow: -10px 0 30px rgba(0,0,0,0.6);
                font-family: Inter, system-ui, -apple-system, sans-serif;
            }
            #ns-vibe-sidebar.active { right: 0; }

            .ns-sidebar-header {
                padding: 16px 20px 12px;
                background: ${CONFIG.THEME.SURFACE_DARK};
                border-bottom: 1px solid ${CONFIG.THEME.BORDER};
                display: flex;
                flex-direction: column;
                gap: 10px;
                flex-shrink: 0;
            }

            .ns-sidebar-title {
                font-size: 15px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0;
                color: ${CONFIG.THEME.TEXT_MAIN};
            }

            .ns-input-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .ns-label {
                font-size: 11px;
                font-weight: 600;
                color: ${CONFIG.THEME.TEXT_MUTED};
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .ns-input {
                width: 100%;
                background: ${CONFIG.THEME.BG_CANVAS};
                border: 1px solid ${CONFIG.THEME.BORDER};
                border-radius: 6px;
                padding: 8px 10px;
                color: white;
                font-size: 12px;
                outline: none;
                box-sizing: border-box;
            }
            .ns-input:focus { border-color: ${CONFIG.THEME.PRIMARY_ORANGE}; }

            .ns-batch-controls {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 6px;
            }

            .ns-batch-btn {
                padding: 6px;
                background: ${CONFIG.THEME.BG_CANVAS};
                border: 1px solid ${CONFIG.THEME.BORDER};
                border-radius: 6px;
                color: ${CONFIG.THEME.TEXT_MUTED};
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
                transition: all 0.15s ease;
            }
            .ns-batch-btn:hover { background: ${CONFIG.THEME.SURFACE_HOVER}; color: white; }

            .ns-msg-list {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .ns-msg-card {
                background: ${CONFIG.THEME.SURFACE_DARK} !important;
                border: 1px solid ${CONFIG.THEME.BORDER} !important;
                border-radius: 8px !important;
                overflow: hidden !important;
                flex-shrink: 0 !important;
                height: auto !important;
                min-height: 52px !important;
                max-height: none !important;
                transition: all 0.15s ease;
                box-sizing: border-box !important;
            }
            .ns-msg-card:hover {
                background: ${CONFIG.THEME.SURFACE_HOVER} !important;
                border-color: rgba(255,255,255,0.18) !important;
            }

            .ns-msg-item {
                display: flex !important;
                align-items: flex-start !important;
                padding: 10px 12px !important;
                gap: 12px !important;
                cursor: pointer !important;
                box-sizing: border-box !important;
                height: auto !important;
                min-height: 48px !important;
            }

            .ns-msg-check {
                appearance: none !important;
                -webkit-appearance: none !important;
                width: 18px !important;
                height: 18px !important;
                border: 2px solid ${CONFIG.THEME.PRIMARY_ORANGE} !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                background: rgba(0,0,0,0.3) !important;
                position: relative !important;
                flex-shrink: 0 !important;
                margin-top: 2px !important;
            }
            .ns-msg-check:checked {
                background: ${CONFIG.THEME.PRIMARY_ORANGE} !important;
            }
            .ns-msg-check:checked::after {
                content: '✓' !important;
                position: absolute !important;
                color: white !important;
                font-size: 12px !important;
                font-weight: bold !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
            }

            .ns-msg-content {
                flex: 1 !important;
                min-width: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 4px !important;
            }

            .ns-role-badge-group {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }

            .ns-role-badge {
                font-size: 9px !important;
                font-weight: 700 !important;
                text-transform: uppercase !important;
                padding: 2px 6px !important;
                border-radius: 4px !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
            }
            .ns-role-user { background: rgba(59, 130, 246, 0.25) !important; color: #93c5fd !important; }
            .ns-role-ai { background: rgba(255, 94, 0, 0.25) !important; color: #ffb88c !important; }

            .ns-msg-preview {
                font-size: 12px !important;
                line-height: 1.4 !important;
                color: ${CONFIG.THEME.TEXT_MUTED} !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                word-break: break-word !important;
            }

            .ns-msg-accordion {
                background: rgba(0, 0, 0, 0.3) !important;
                border-top: 1px solid ${CONFIG.THEME.BORDER} !important;
                padding: 10px 12px 12px 42px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
                font-size: 12px !important;
            }

            .ns-sidebar-footer {
                padding: 12px 16px;
                background: ${CONFIG.THEME.SURFACE_DARK};
                border-top: 1px solid ${CONFIG.THEME.BORDER};
                display: flex;
                align-items: center;
                gap: 6px;
                flex-shrink: 0;
            }

            .ns-btn {
                border: 1px solid ${CONFIG.THEME.BORDER};
                border-radius: 6px;
                padding: 8px 10px;
                background: ${CONFIG.THEME.BG_CANVAS};
                color: white;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
                text-align: center;
                transition: all 0.15s ease;
                white-space: nowrap;
            }
            .ns-btn:hover { background: ${CONFIG.THEME.SURFACE_HOVER}; }

            .ns-btn-cancel {
                background: rgba(239, 68, 68, 0.15);
                border-color: rgba(239, 68, 68, 0.3);
                color: #fca5a5;
                flex: 0.8;
            }
            .ns-btn-cancel:hover { background: rgba(239, 68, 68, 0.25); }

            .ns-format-select {
                flex: 1.2;
                background: ${CONFIG.THEME.BG_CANVAS};
                border: 1px solid ${CONFIG.THEME.BORDER};
                border-radius: 6px;
                color: white;
                padding: 8px 6px;
                outline: none;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
            }
            .ns-format-select option { background: #161618; color: white; }

            .ns-btn-copy { flex: 1; }

            .ns-btn-primary {
                flex: 1;
                background: ${CONFIG.THEME.PRIMARY_ORANGE};
                border-color: ${CONFIG.THEME.PRIMARY_ORANGE};
                color: white;
            }
            .ns-btn-primary:hover { background: ${CONFIG.THEME.PRIMARY_ORANGE_HOVER}; }
        `;
        document.head.appendChild(style);
    }

    function renderMessageList() {
        const listContainer = document.getElementById('ns-msg-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (STATE.messages.length === 0) {
            listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#9ca3af; font-size:12px;">No messages found in Mistral Vibe thread.</div>';
            return;
        }

        STATE.messages.forEach(msg => {
            const card = document.createElement('div');
            card.className = 'ns-msg-card';

            const item = document.createElement('div');
            item.className = 'ns-msg-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'ns-msg-check';
            checkbox.checked = STATE.selectedIds.has(msg.id);

            const content = document.createElement('div');
            content.className = 'ns-msg-content';

            const badgeGroup = document.createElement('div');
            badgeGroup.className = 'ns-role-badge-group';

            const badge = document.createElement('span');
            badge.className = `ns-role-badge ns-role-${msg.role}`;
            badge.textContent = msg.role === 'user' ? '👤 USER' : '🧠 MISTRAL VIBE';
            badgeGroup.appendChild(badge);

            if (msg.thoughts) {
                const thoughtBadge = document.createElement('span');
                thoughtBadge.style.fontSize = '9px';
                thoughtBadge.style.color = '#ffb88c';
                thoughtBadge.textContent = '🧠 Thought Captured';
                badgeGroup.appendChild(thoughtBadge);
            }

            const preview = document.createElement('div');
            preview.className = 'ns-msg-preview';
            preview.textContent = msg.preview || (msg.role === 'user' ? 'User Prompt' : 'Mistral Response');

            content.appendChild(badgeGroup);
            content.appendChild(preview);

            item.appendChild(checkbox);
            item.appendChild(content);

            card.appendChild(item);

            const isExpanded = STATE.expandedId === msg.id;

            if (isExpanded) {
                const accordion = document.createElement('div');
                accordion.className = 'ns-msg-accordion';

                if (msg.thoughts) {
                    const tHeader = document.createElement('div');
                    tHeader.style.fontWeight = '700';
                    tHeader.style.color = '#ffb88c';
                    tHeader.textContent = '🧠 Thought Process:';
                    accordion.appendChild(tHeader);

                    const tBody = document.createElement('div');
                    tBody.style.color = '#9ca3af';
                    tBody.style.fontStyle = 'italic';
                    tBody.style.maxHeight = '100px';
                    tBody.style.overflowY = 'auto';
                    tBody.textContent = msg.thoughts;
                    accordion.appendChild(tBody);
                }

                const fullText = document.createElement('div');
                fullText.style.color = '#e5e7eb';
                fullText.style.whiteSpace = 'pre-wrap';
                fullText.style.maxHeight = '200px';
                fullText.style.overflowY = 'auto';
                fullText.textContent = msg.text;
                accordion.appendChild(fullText);

                card.appendChild(accordion);
            }

            checkbox.onclick = (e) => {
                e.stopPropagation();
                if (STATE.selectedIds.has(msg.id)) {
                    STATE.selectedIds.delete(msg.id);
                    checkbox.checked = false;
                } else {
                    STATE.selectedIds.add(msg.id);
                    checkbox.checked = true;
                }
            };

            item.onclick = (e) => {
                e.stopPropagation();
                STATE.expandedId = isExpanded ? null : msg.id;
                renderMessageList();
            };

            listContainer.appendChild(card);
        });
    }

    function injectHeaderTrigger(openSidebarFn) {
        if (document.getElementById('ns-vibe-header-btn')) return;

        const newChatContainer = document.querySelector(CONFIG.SELECTORS.NEW_CHAT_CONTAINER);
        if (!newChatContainer) return;

        const triggerBtn = document.createElement('button');
        triggerBtn.id = 'ns-vibe-header-btn';
        triggerBtn.className = 'ns-vibe-header-btn';
        triggerBtn.innerHTML = `🔥 Export Chat`;
        triggerBtn.onclick = (e) => {
            e.stopPropagation();
            openSidebarFn();
        };

        newChatContainer.after(triggerBtn);
    }

    function createSidebarUI() {
        if (document.getElementById('ns-vibe-sidebar')) return;

        const overlay = document.createElement('div');
        overlay.id = 'ns-vibe-overlay';

        const sidebar = document.createElement('div');
        sidebar.id = 'ns-vibe-sidebar';
        sidebar.innerHTML = `
            <div class="ns-sidebar-header">
                <div class="ns-sidebar-title">🔥 Mistral Vibe Exporter</div>
                
                <div class="ns-input-group">
                    <span class="ns-label">Chat Title</span>
                    <input type="text" id="ns-title-input" class="ns-input" placeholder="Enter session title...">
                </div>

                <div class="ns-batch-controls">
                    <button class="ns-batch-btn" id="ns-batch-all">All</button>
                    <button class="ns-batch-btn" id="ns-batch-user">User</button>
                    <button class="ns-batch-btn" id="ns-batch-ai">AI</button>
                    <button class="ns-batch-btn" id="ns-batch-none">None</button>
                </div>
            </div>

            <div class="ns-msg-list" id="ns-msg-list"></div>

            <div class="ns-sidebar-footer">
                <button class="ns-btn ns-btn-cancel" id="ns-btn-cancel">Cancel</button>
                <select class="ns-format-select" id="ns-format-select">
                    <option value="markdown">Markdown (.md)</option>
                    <option value="json">JSON (.json)</option>
                </select>
                <button class="ns-btn ns-btn-copy" id="ns-btn-copy">📋 Copy</button>
                <button class="ns-btn ns-btn-primary" id="ns-btn-download">⬇️ Save</button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(sidebar);

        const openSidebar = () => {
            scanThreadMessages();
            renderMessageList();
            overlay.classList.add('active');
            sidebar.classList.add('active');
        };

        const closeSidebar = () => {
            overlay.classList.remove('active');
            sidebar.classList.remove('active');
        };

        // Inject into header bar
        injectHeaderTrigger(openSidebar);

        // Observer to re-inject button if Vibe top bar re-renders
        const headerObserver = new MutationObserver(() => {
            injectHeaderTrigger(openSidebar);
        });
        headerObserver.observe(document.body, { childList: true, subtree: true });

        overlay.onclick = closeSidebar;
        document.getElementById('ns-btn-cancel').onclick = closeSidebar;

        const setBatch = (type) => {
            STATE.selectedIds.clear();
            if (type === 'all') STATE.messages.forEach(m => STATE.selectedIds.add(m.id));
            if (type === 'user') STATE.messages.filter(m => m.role === 'user').forEach(m => STATE.selectedIds.add(m.id));
            if (type === 'ai') STATE.messages.filter(m => m.role === 'ai').forEach(m => STATE.selectedIds.add(m.id));
            renderMessageList();
        };

        document.getElementById('ns-batch-all').onclick = () => setBatch('all');
        document.getElementById('ns-batch-user').onclick = () => setBatch('user');
        document.getElementById('ns-batch-ai').onclick = () => setBatch('ai');
        document.getElementById('ns-batch-none').onclick = () => setBatch('none');

        document.getElementById('ns-format-select').onchange = (e) => {
            STATE.exportFormat = e.target.value;
        };

        document.getElementById('ns-btn-copy').onclick = () => ExportService.executeCopy();
        document.getElementById('ns-btn-download').onclick = () => ExportService.executeDownload();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeSidebar();
        });
    }

    function init() {
        console.log('🔥 Noosphere Reflect — Mistral Vibe Native Exporter Initialized');
        injectStyles();
        createSidebarUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
