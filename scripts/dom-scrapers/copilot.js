(function () {
    'use strict';

    /*
     * ============================================================
     * Noosphere Reflect — Microsoft Copilot Native Exporter
     * ============================================================
     *
     * Native Slide-Over Drawer & Markdown Synthesizer for Microsoft 
     * Copilot (copilot.microsoft.com).
     *
     * Features:
     *   - Copilot Fluent Dark UI Theme (#0e121a Midnight, #0078d4 Blue)
     *   - Un-squished Flexbox Cards (`flex-shrink: 0`) with two-line previews
     *   - Recursive DOM-to-Markdown parser preserving formatting
     *     (Headings, bold/italic, lists, pipe tables, code blocks, links)
     *   - Automatic extraction of Deep Research reports & attachments
     *   - Noosphere Reflect frontmatter metadata & signature footer lock
     *   - Interactive turn accordion drawer with batch filtering
     *   - Dual export triggers: Copy to Clipboard or File Download
     *
     * Namespace: ns-copilot
     * ============================================================
     */

    const CONFIG = {
        SELECTORS: {
            USER_MESSAGE: '.group\\/user-message',
            USER_CONTENT: '[data-content="user-message"]',
            AI_MESSAGE: '.group\\/ai-message',
            AI_MESSAGE_ITEM: '.group\\/ai-message-item',
            DEEP_RESEARCH: '.group\\/ai-message-item.pt-9, [data-content="deep-research"]',
            ATTACHMENT_IMG: '.h-small-attachment img, img[alt*="attachment"]',
            NOISE_ELEMENTS: 'button, svg, .copy-button, .sr-only, [aria-hidden="true"]'
        },

        UI: {
            ORB_RIGHT: 24,
            ORB_BOTTOM: 24
        },

        THEME: {
            BG_DARK: '#0e121a',
            SURFACE_DARK: '#17202e',
            SURFACE_HOVER: '#232d42',
            BORDER: '#2c384e',
            PRIMARY_BLUE: '#0078d4',
            PRIMARY_BLUE_HOVER: '#0084f6',
            ACCENT_PURPLE: '#a970ff',
            TEXT_MAIN: '#f3f4f6',
            TEXT_MUTED: '#9ca3af'
        }
    };

    const STATE = {
        messages: [],
        deepResearchReports: [],
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
                background: success ? CONFIG.THEME.PRIMARY_BLUE : '#dc2626',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '200000',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                transition: 'opacity 0.3s ease',
                fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
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
            return (text || 'Copilot_Chat_Session')
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
    // HTML to Markdown Recursive Parser
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
    // Copilot DOM Extractors
    // ============================================================

    function extractAttachments(element) {
        return Array.from(element.querySelectorAll(CONFIG.SELECTORS.ATTACHMENT_IMG)).map(img => ({
            src: img.src,
            alt: img.alt || 'Attachment'
        }));
    }

    function getUserMessages() {
        return Array.from(document.querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE)).map(el => {
            const textEl = el.querySelector(CONFIG.SELECTORS.USER_CONTENT) || el;
            const text = Utils.cleanText(textEl.innerText || '');
            return {
                type: 'user',
                el,
                text,
                attachments: extractAttachments(el)
            };
        });
    }

    function getAiMessages() {
        return Array.from(document.querySelectorAll(CONFIG.SELECTORS.AI_MESSAGE)).map(el => {
            const markdown = htmlToMarkdown(el);
            const plainText = Utils.cleanText(el.innerText || '');
            return {
                type: 'ai',
                el,
                markdown,
                plainText,
                attachments: extractAttachments(el)
            };
        });
    }

    function getDeepResearchReports() {
        return Array.from(document.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH)).map(el => {
            const title = Utils.cleanText(el.querySelector('.text-3xl, h1, h2')?.innerText || 'Copilot Deep Research Report');
            const markdown = htmlToMarkdown(el);
            const sources = Array.from(el.querySelectorAll('.sr-only span.block, a[href]')).map(s => {
                const label = Utils.cleanText(s.innerText || s.getAttribute('href') || '');
                const href = s.getAttribute('href') || '';
                return { label, href };
            }).filter(s => s.label);

            return {
                type: 'deep-research',
                el,
                title,
                markdown,
                sources
            };
        });
    }

    function scanThreadMessages() {
        const users = getUserMessages();
        const ais = getAiMessages();
        STATE.deepResearchReports = getDeepResearchReports();

        const combined = [...users, ...ais];

        combined.sort((a, b) => {
            if (!a.el || !b.el) return 0;
            return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });

        STATE.messages = combined.map((msg, idx) => {
            const rawPreview = Utils.cleanText(msg.type === 'user' ? msg.text : msg.plainText);
            return {
                id: idx,
                type: msg.type,
                text: msg.type === 'user' ? msg.text : msg.markdown,
                preview: rawPreview || (msg.type === 'user' ? 'User Prompt' : 'Copilot Response'),
                attachments: msg.attachments,
                el: msg.el
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

            const firstUserMsg = STATE.messages.find(m => m.type === 'user');
            if (firstUserMsg && firstUserMsg.text) {
                return Utils.cleanText(firstUserMsg.text).substring(0, 50);
            }

            return document.title || 'Copilot_Chat_Session';
        },

        buildFrontMatter() {
            const exportedAt = new Date().toLocaleString();
            const sourceUrl = window.location.href;
            const title = this.getExportTitle();

            const selected = STATE.messages.filter(m => STATE.selectedIds.has(m.id));
            const userCount = selected.filter(m => m.type === 'user').length;
            const aiCount = selected.filter(m => m.type === 'ai').length;
            const totalAttachments = selected.reduce((n, m) => n + m.attachments.length, 0);

            let md = '';
            md += '---\n';
            md += `> **📝 Title:** ${title}\n>\n`;
            md += '> **🤖 Model:** Microsoft Copilot\n>\n';
            md += `> **🌐 Exported:** ${exportedAt}\n>\n`;
            md += `> **🌐 Source:** [Microsoft Copilot](${sourceUrl})\n>\n`;
            md += '> **🏷️ Tags:** Copilot, AI-Chat, Noosphere, Microsoft\n>\n';
            md += `> **📊 Metadata:** ${selected.length} Selected Messages | ${userCount} User | ${aiCount} Copilot | ${totalAttachments} Attachments\n`;
            md += '---\n\n';

            md += `# ${title}\n\n---\n\n`;

            return md;
        },

        buildMarkdown() {
            let md = this.buildFrontMatter();

            if (STATE.deepResearchReports.length > 0) {
                STATE.deepResearchReports.forEach(report => {
                    md += `#### Response - Deep Research 🔬:\n\n`;
                    md += `${report.markdown}\n\n`;

                    if (report.sources.length > 0) {
                        md += `<details>\n<summary><b>📚 Deep Research Sources (${report.sources.length})</b></summary>\n\n`;
                        report.sources.forEach(s => {
                            md += `- [${s.label}](${s.href || '#'}).\n`;
                        });
                        md += '\n</details>\n\n';
                    }

                    md += '---\n\n';
                });
            }

            STATE.messages.forEach(msg => {
                if (!STATE.selectedIds.has(msg.id)) return;

                if (msg.type === 'user') {
                    md += `#### Prompt - User 👤:\n\n${msg.text}\n\n`;

                    if (msg.attachments.length > 0) {
                        md += `**📎 Attachments:**\n`;
                        msg.attachments.forEach(att => {
                            md += `- ![${att.alt}](${att.src})\n`;
                        });
                        md += '\n';
                    }

                    md += '---\n\n';
                } else if (msg.type === 'ai') {
                    md += `#### Response - Copilot 🤖:\n\n${msg.text}\n\n`;

                    if (msg.attachments.length > 0) {
                        md += `**📎 Attachments:**\n`;
                        msg.attachments.forEach(att => {
                            md += `- ![${att.alt}](${att.src})\n`;
                        });
                        md += '\n';
                    }

                    md += '---\n\n';
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
                    model: 'Microsoft Copilot'
                },
                deepResearch: STATE.deepResearchReports,
                messages: selected.map(m => ({
                    type: m.type,
                    content: m.text,
                    attachments: m.attachments
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
                Utils.createNotification(`✅ Copied ${STATE.selectedIds.size} items as ${STATE.exportFormat.toUpperCase()}!`);
            } catch (err) {
                console.error('[Noosphere Copilot]', err);
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
                console.error('[Noosphere Copilot]', err);
                Utils.createNotification('❌ Download failed', false);
            }
        }
    };

    // ============================================================
    // UI Construction (Copilot Native Theme & Layout Fixes)
    // ============================================================

    function injectStyles() {
        if (document.getElementById('noosphere-copilot-styles')) return;

        const style = document.createElement('style');
        style.id = 'noosphere-copilot-styles';
        style.textContent = `
            .ns-copilot-orb {
                position: fixed;
                bottom: ${CONFIG.UI.ORB_BOTTOM}px;
                right: ${CONFIG.UI.ORB_RIGHT}px;
                padding: 10px 18px;
                background: ${CONFIG.THEME.PRIMARY_BLUE};
                border-radius: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                z-index: 100000;
                box-shadow: 0 4px 16px rgba(0,0,0,0.35);
                transition: background 0.2s ease, transform 0.2s ease;
                border: 1px solid rgba(255,255,255,0.15);
                color: white;
                font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
                font-size: 13px;
                font-weight: 600;
                user-select: none;
            }

            .ns-copilot-orb:hover {
                background: ${CONFIG.THEME.PRIMARY_BLUE_HOVER};
                transform: translateY(-2px);
            }

            #ns-copilot-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(4px);
                z-index: 100001;
                display: none;
                opacity: 0;
                transition: opacity 0.25s ease;
            }
            #ns-copilot-overlay.active { display: block; opacity: 1; }

            #ns-copilot-sidebar {
                position: fixed;
                top: 0; right: -380px;
                width: 380px;
                height: 100%;
                background: ${CONFIG.THEME.BG_DARK};
                border-left: 1px solid ${CONFIG.THEME.BORDER};
                color: ${CONFIG.THEME.TEXT_MAIN};
                z-index: 100002;
                transition: right 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                flex-direction: column;
                box-shadow: -10px 0 30px rgba(0,0,0,0.5);
                font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            }
            #ns-copilot-sidebar.active { right: 0; }

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
                font-weight: 600;
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
                background: ${CONFIG.THEME.BG_DARK};
                border: 1px solid ${CONFIG.THEME.BORDER};
                border-radius: 6px;
                padding: 8px 10px;
                color: white;
                font-size: 12px;
                outline: none;
                box-sizing: border-box;
            }
            .ns-input:focus { border-color: ${CONFIG.THEME.PRIMARY_BLUE}; }

            .ns-batch-controls {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 6px;
            }

            .ns-batch-btn {
                padding: 6px;
                background: ${CONFIG.THEME.BG_DARK};
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
                border: 2px solid ${CONFIG.THEME.PRIMARY_BLUE} !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                background: rgba(0,0,0,0.3) !important;
                position: relative !important;
                flex-shrink: 0 !important;
                margin-top: 2px !important;
            }
            .ns-msg-check:checked {
                background: ${CONFIG.THEME.PRIMARY_BLUE} !important;
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
            .ns-role-user { background: rgba(0, 120, 212, 0.3) !important; color: #93c5fd !important; }
            .ns-role-ai { background: rgba(169, 112, 255, 0.3) !important; color: #d8b4fe !important; }

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
                background: ${CONFIG.THEME.BG_DARK};
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
                background: ${CONFIG.THEME.BG_DARK};
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
            .ns-format-select option { background: #111827; color: white; }

            .ns-btn-copy { flex: 1; }

            .ns-btn-primary {
                flex: 1;
                background: ${CONFIG.THEME.PRIMARY_BLUE};
                border-color: ${CONFIG.THEME.PRIMARY_BLUE};
                color: white;
            }
            .ns-btn-primary:hover { background: ${CONFIG.THEME.PRIMARY_BLUE_HOVER}; }
        `;
        document.head.appendChild(style);
    }

    function renderMessageList() {
        const listContainer = document.getElementById('ns-msg-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (STATE.messages.length === 0) {
            listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#9ca3af; font-size:12px;">No messages found in Copilot thread.</div>';
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
            badge.className = `ns-role-badge ns-role-${msg.type}`;
            badge.textContent = msg.type === 'user' ? '👤 USER' : '🤖 COPILOT';
            badgeGroup.appendChild(badge);

            if (msg.attachments.length > 0) {
                const attBadge = document.createElement('span');
                attBadge.style.fontSize = '9px';
                attBadge.style.color = '#9ca3af';
                attBadge.textContent = `🖼️ ${msg.attachments.length} attachment(s)`;
                badgeGroup.appendChild(attBadge);
            }

            const preview = document.createElement('div');
            preview.className = 'ns-msg-preview';
            preview.textContent = msg.preview || (msg.type === 'user' ? 'User Prompt' : 'Copilot Response');

            content.appendChild(badgeGroup);
            content.appendChild(preview);

            item.appendChild(checkbox);
            item.appendChild(content);

            card.appendChild(item);

            const isExpanded = STATE.expandedId === msg.id;

            if (isExpanded) {
                const accordion = document.createElement('div');
                accordion.className = 'ns-msg-accordion';

                const fullText = document.createElement('div');
                fullText.style.color = '#e5e7eb';
                fullText.style.whiteSpace = 'pre-wrap';
                fullText.style.maxHeight = '220px';
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

    function createSidebarUI() {
        if (document.getElementById('ns-orb-copilot')) return;

        const orb = document.createElement('div');
        orb.id = 'ns-orb-copilot';
        orb.className = 'ns-copilot-orb';
        orb.innerHTML = `✨ Select`;
        document.body.appendChild(orb);

        const overlay = document.createElement('div');
        overlay.id = 'ns-copilot-overlay';

        const sidebar = document.createElement('div');
        sidebar.id = 'ns-copilot-sidebar';
        sidebar.innerHTML = `
            <div class="ns-sidebar-header">
                <div class="ns-sidebar-title">✨ Copilot Exporter</div>
                
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
            orb.style.display = 'none';
        };

        const closeSidebar = () => {
            overlay.classList.remove('active');
            sidebar.classList.remove('active');
            orb.style.display = 'flex';
        };

        orb.onclick = (e) => { e.stopPropagation(); openSidebar(); };
        overlay.onclick = closeSidebar;
        document.getElementById('ns-btn-cancel').onclick = closeSidebar;

        const setBatch = (type) => {
            STATE.selectedIds.clear();
            if (type === 'all') STATE.messages.forEach(m => STATE.selectedIds.add(m.id));
            if (type === 'user') STATE.messages.filter(m => m.type === 'user').forEach(m => STATE.selectedIds.add(m.id));
            if (type === 'ai') STATE.messages.filter(m => m.type === 'ai').forEach(m => STATE.selectedIds.add(m.id));
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
        console.log('✨ Noosphere Reflect — Microsoft Copilot Native Exporter Initialized');
        injectStyles();
        createSidebarUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
