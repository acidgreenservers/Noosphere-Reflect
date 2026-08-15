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
     *   - Integrated Header Trigger: Sits natively beside "Invite" as "Export"
     *     aligned horizontally in the top bar flex container
     *   - Copilot Fluent Dual Theme (Light Warm Alabaster / Dark Midnight)
     *   - Automatic theme detection & live switching with the page
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
            STICKY_HEADER: '[data-testid="sticky-header"]',
            INVITE_BUTTON: 'button[title="Invite"]',
            NOISE_ELEMENTS: 'button, svg, .copy-button, .sr-only, [aria-hidden="true"]'
        },

        THEMES: {
            light: {
                CANVAS: '#f8f5ee',
                SURFACE_SIDEBAR: '#f5f1e8',
                SURFACE_CARD: '#ffffff',
                SURFACE_CARD_ELEVATED: '#ffffff',
                SURFACE_INPUT: '#ffffff',
                SURFACE_PILL: '#eee8dc',
                SURFACE_PILL_ACTIVE: '#1e1e1e',
                SURFACE_USER_BUBBLE: '#ede7da',
                SURFACE_BUTTON_DARK: '#1c1d1f',
                ACCENT_BLUE: '#3b82f6',
                ACCENT_BLUE_DEEP: '#1d4ed8',
                ACCENT_BLUE_SUBTLE: 'rgba(59, 130, 246, 0.15)',
                ACCENT_SPARKLE: '#f59e0b',
                ACCENT_SKY: '#9cbef5',
                TEXT_PRIMARY: '#1c1c1e',
                TEXT_SECONDARY: '#4a4c52',
                TEXT_MUTED: '#71747d',
                TEXT_DIM: '#9aa0a6',
                ON_ACCENT: '#ffffff',
                BORDER_HAIRLINE: 'rgba(0, 0, 0, 0.05)',
                BORDER_SUBTLE: 'rgba(0, 0, 0, 0.08)',
                BORDER_STRONG: 'rgba(0, 0, 0, 0.14)',
                STATUS_PREVIEW_BG: 'rgba(0, 0, 0, 0.06)',
                STATUS_PREVIEW_TEXT: '#475569',
                SHADOW_CARD: '0 4px 20px rgba(0, 0, 0, 0.04)',
                SHADOW_FLOATING: '0 10px 30px rgba(0, 0, 0, 0.08)',
                SHADOW_MODAL: '0 16px 48px rgba(0, 0, 0, 0.12)'
            },
            dark: {
                CANVAS: '#0b0f19',
                SURFACE_SIDEBAR: '#0d121c',
                SURFACE_CARD: '#151c2b',
                SURFACE_CARD_ELEVATED: '#1a2336',
                SURFACE_INPUT: '#161d2d',
                SURFACE_PILL: '#1c2537',
                SURFACE_PILL_ACTIVE: '#25334d',
                SURFACE_USER_BUBBLE: '#1e283d',
                SURFACE_BUTTON_DARK: '#25334d',
                ACCENT_BLUE: '#3b82f6',
                ACCENT_BLUE_DEEP: '#1d4ed8',
                ACCENT_BLUE_SUBTLE: 'rgba(59, 130, 246, 0.25)',
                ACCENT_SPARKLE: '#f59e0b',
                ACCENT_SKY: '#9cbef5',
                TEXT_PRIMARY: '#f8fafc',
                TEXT_SECONDARY: '#94a3b8',
                TEXT_MUTED: '#64748b',
                TEXT_DIM: '#475569',
                ON_ACCENT: '#ffffff',
                BORDER_HAIRLINE: 'rgba(255, 255, 255, 0.06)',
                BORDER_SUBTLE: 'rgba(255, 255, 255, 0.10)',
                BORDER_STRONG: 'rgba(255, 255, 255, 0.16)',
                STATUS_PREVIEW_BG: 'rgba(255, 255, 255, 0.12)',
                STATUS_PREVIEW_TEXT: '#e2e8f0',
                SHADOW_CARD: '0 4px 12px rgba(0, 0, 0, 0.20)',
                SHADOW_FLOATING: '0 8px 32px rgba(0, 0, 0, 0.35)',
                SHADOW_MODAL: '0 16px 48px rgba(0, 0, 0, 0.50)'
            }
        }
    };

    // Active theme reference — swapped by ThemeManager
    CONFIG.THEME = CONFIG.THEMES.light;

    const STATE = {
        messages: [],
        deepResearchReports: [],
        selectedIds: new Set(),
        expandedId: null,
        exportFormat: 'markdown',
        currentTheme: null
    };

    // ============================================================
    // Theme Manager — Auto-detect & live-switch light / dark
    // ============================================================

    const ThemeManager = {
        detect() {
            // 1. Explicit data-theme / class on html or body
            const html = document.documentElement;
            const htmlTheme = html.getAttribute('data-theme');
            if (htmlTheme === 'dark' || html.classList.contains('dark')) return 'dark';
            if (htmlTheme === 'light' || html.classList.contains('light')) return 'light';

            if (document.body) {
                const bodyTheme = document.body.getAttribute('data-theme');
                if (bodyTheme === 'dark' || document.body.classList.contains('dark')) return 'dark';
                if (bodyTheme === 'light' || document.body.classList.contains('light')) return 'light';
            }

            // 2. Text color luminance on user message (SPA-safe)
            const getTextLum = (el) => {
                if (!el) return null;
                const color = window.getComputedStyle(el).color;
                if (!color) return null;
                const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (!rgb) return null;
                return (parseInt(rgb[1], 10) + parseInt(rgb[2], 10) + parseInt(rgb[3], 10)) / 3;
            };

            const userMsgText = document.querySelector('[data-content="user-message"] p, [data-content="user-message"]');
            const textLum = getTextLum(userMsgText);
            if (textLum !== null) {
                return textLum > 200 ? 'dark' : 'light';
            }

            // 3. Background luminance fallback
            const getBgLum = (el) => {
                if (!el) return null;
                const bg = window.getComputedStyle(el).backgroundColor;
                if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return null;
                const rgb = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (!rgb) return null;
                return (parseInt(rgb[1], 10) + parseInt(rgb[2], 10) + parseInt(rgb[3], 10)) / 3;
            };

            const userMsg = document.querySelector('.group\\/user-message');
            const userLum = getBgLum(userMsg);
            if (userLum !== null) {
                return userLum < 128 ? 'dark' : 'light';
            }

            const appContainers = [
                document.getElementById('root'),
                document.getElementById('__next'),
                document.querySelector('main'),
                document.body
            ];
            for (const container of appContainers) {
                const lum = getBgLum(container);
                if (lum !== null) {
                    return lum < 128 ? 'dark' : 'light';
                }
            }

            // 4. prefers-color-scheme
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
            return 'light';
        },

        apply(themeName) {
            if (STATE.currentTheme === themeName) return;
            STATE.currentTheme = themeName;
            CONFIG.THEME = CONFIG.THEMES[themeName];

            const oldStyle = document.getElementById('noosphere-copilot-styles');
            if (oldStyle) oldStyle.remove();
            injectStyles();

            renderMessageList();
        },

        init() {
            this.apply(this.detect());

            this._pollInterval = setInterval(() => {
                const detected = this.detect();
                if (detected !== STATE.currentTheme) {
                    this.apply(detected);
                }
            }, 500);

            const observer = new MutationObserver(() => {
                const detected = this.detect();
                if (detected !== STATE.currentTheme) {
                    this.apply(detected);
                }
            });
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme', 'class']
            });
            if (document.body) {
                observer.observe(document.body, {
                    attributes: true,
                    attributeFilter: ['data-theme', 'class']
                });
            }
        }
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
                background: success ? CONFIG.THEME.ACCENT_BLUE : '#dc2626',
                color: CONFIG.THEME.ON_ACCENT,
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '200000',
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '1.30',
                boxShadow: CONFIG.THEME.SHADOW_MODAL,
                transition: 'opacity 0.3s ease',
                fontFamily: '"Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
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
    // UI Construction (Copilot Header Injection & Drawer Theme)
    // ============================================================

    function injectStyles() {
        if (document.getElementById('noosphere-copilot-styles')) return;

        const T = CONFIG.THEME;
        const style = document.createElement('style');
        style.id = 'noosphere-copilot-styles';
        style.textContent = `
            /* Native Copilot Header Trigger Button */
            .ns-copilot-header-btn {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-family: "Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                line-height: 1.45 !important;
                min-height: 36px !important;
                padding: 0 18px !important;
                gap: 6px !important;
                border-radius: 9999px !important;
                cursor: pointer !important;
                color: ${T.ON_ACCENT} !important;
                background: ${T.SURFACE_BUTTON_DARK} !important;
                border: 1px solid ${T.SURFACE_BUTTON_DARK} !important;
                transition: all 0.15s ease !important;
                user-select: none !important;
                margin-right: 8px !important;
            }
            .ns-copilot-header-btn:hover {
                background: ${T.SURFACE_PILL_ACTIVE} !important;
                border-color: ${T.SURFACE_PILL_ACTIVE} !important;
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
                top: 0; right: -400px;
                width: 400px;
                height: 100%;
                background: ${T.CANVAS};
                border-left: 1px solid ${T.BORDER_HAIRLINE};
                color: ${T.TEXT_PRIMARY};
                z-index: 100002;
                transition: right 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                flex-direction: column;
                box-shadow: ${T.SHADOW_MODAL};
                font-family: "Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            }
            #ns-copilot-sidebar.active { right: 0; }

            .ns-sidebar-header {
                padding: 20px 24px 16px;
                background: ${T.SURFACE_SIDEBAR};
                border-bottom: 1px solid ${T.BORDER_HAIRLINE};
                display: flex;
                flex-direction: column;
                gap: 12px;
                flex-shrink: 0;
            }

            .ns-sidebar-title {
                font-family: "Segoe UI Variable", "Segoe UI", -apple-system, sans-serif;
                font-size: 18px;
                font-weight: 600;
                line-height: 1.40;
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0;
                color: ${T.TEXT_PRIMARY};
            }

            .ns-input-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .ns-label {
                font-family: "Segoe UI Variable", "Segoe UI", -apple-system, sans-serif;
                font-size: 11px;
                font-weight: 600;
                line-height: 1.40;
                color: ${T.TEXT_MUTED};
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .ns-input {
                width: 100%;
                background: ${T.SURFACE_INPUT};
                border: 1px solid ${T.BORDER_SUBTLE};
                border-radius: 24px;
                padding: 10px 14px;
                color: ${T.TEXT_PRIMARY};
                font-family: "Segoe UI Variable", "Segoe UI", -apple-system, sans-serif;
                font-size: 14px;
                font-weight: 400;
                line-height: 1.50;
                outline: none;
                box-sizing: border-box;
                transition: border-color 0.15s ease, box-shadow 0.15s ease;
            }
            .ns-input:focus {
                border-color: ${T.ACCENT_BLUE};
                box-shadow: 0 0 0 3px ${T.ACCENT_BLUE_SUBTLE};
            }

            .ns-batch-controls {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }

            .ns-batch-btn {
                padding: 8px;
                background: ${T.SURFACE_INPUT};
                border: 1px solid ${T.BORDER_SUBTLE};
                border-radius: 9999px;
                color: ${T.TEXT_MUTED};
                font-family: "Segoe UI Variable", "Segoe UI", -apple-system, sans-serif;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.45;
                cursor: pointer;
                text-align: center;
                transition: all 0.15s ease;
            }
            .ns-batch-btn:hover {
                background: ${T.SURFACE_PILL};
                color: ${T.TEXT_PRIMARY};
                border-color: ${T.BORDER_STRONG};
            }

            .ns-msg-list {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .ns-msg-card {
                background: ${T.SURFACE_CARD} !important;
                border: 1px solid ${T.BORDER_HAIRLINE} !important;
                border-radius: 24px !important;
                overflow: hidden !important;
                flex-shrink: 0 !important;
                height: auto !important;
                min-height: 52px !important;
                max-height: none !important;
                transition: all 0.15s ease;
                box-sizing: border-box !important;
                box-shadow: ${T.SHADOW_CARD};
            }
            .ns-msg-card:hover {
                border-color: ${T.BORDER_SUBTLE} !important;
                box-shadow: ${T.SHADOW_FLOATING} !important;
            }

            .ns-msg-item {
                display: flex !important;
                align-items: flex-start !important;
                padding: 12px 16px !important;
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
                border: 2px solid ${T.ACCENT_BLUE} !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                background: ${T.SURFACE_CARD} !important;
                position: relative !important;
                flex-shrink: 0 !important;
                margin-top: 2px !important;
                transition: all 0.15s ease !important;
            }
            .ns-msg-check:checked {
                background: ${T.ACCENT_BLUE} !important;
            }
            .ns-msg-check:checked::after {
                content: '✓' !important;
                position: absolute !important;
                color: ${T.ON_ACCENT} !important;
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
                font-family: "Segoe UI Variable", "Segoe UI", -apple-system, sans-serif;
                font-size: 10px !important;
                font-weight: 700 !important;
                line-height: 1.20 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                padding: 3px 8px !important;
                border-radius: 9999px !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
            }
            .ns-role-user {
                background: ${T.ACCENT_BLUE_SUBTLE} !important;
                color: ${T.ACCENT_BLUE} !important;
            }
            .ns-role-ai {
                background: ${T.SURFACE_PILL} !important;
                color: ${T.TEXT_SECONDARY} !important;
            }

            .ns-msg-preview {
                font-family: "Segoe UI Variable", "Segoe UI", -apple-system, sans-serif;
                font-size: 13px !important;
                font-weight: 400 !important;
                line-height: 1.45 !important;
                color: ${T.TEXT_MUTED} !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                word-break: break-word !important;
            }

            .ns-msg-accordion {
                background: ${T.SURFACE_PILL} !important;
                border-top: 1px solid ${T.BORDER_HAIRLINE} !important;
                padding: 12px 16px 16px 46px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                font-family: "Segoe UI Variable", "Segoe UI", -apple-system, sans-serif;
                font-size: 13px !important;
                font-weight: 400 !important;
                line-height: 1.45 !important;
            }

            .ns-sidebar-footer {
                padding: 16px 20px;
                background: ${T.SURFACE_SIDEBAR};
                border-top: 1px solid ${T.BORDER_HAIRLINE};
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }

            .ns-btn {
                font-family: "Segoe UI Variable", "Segoe UI", -apple-system, sans-serif;
                font-size: 13px;
                font-weight: 500;
                line-height: 1.45;
                border-radius: 9999px;
                padding: 10px 16px;
                cursor: pointer;
                text-align: center;
                transition: all 0.15s ease;
                white-space: nowrap;
                border: none;
                outline: none;
            }

            .ns-btn-cancel {
                background: transparent;
                border: 1px solid ${T.BORDER_SUBTLE};
                color: ${T.TEXT_SECONDARY};
                flex: 0.8;
            }
            .ns-btn-cancel:hover {
                background: ${T.SURFACE_PILL};
                color: ${T.TEXT_PRIMARY};
            }

            .ns-format-select {
                flex: 1.2;
                background: ${T.SURFACE_INPUT};
                border: 1px solid ${T.BORDER_SUBTLE};
                border-radius: 9999px;
                color: ${T.TEXT_PRIMARY};
                padding: 10px 10px;
                outline: none;
                font-family: "Segoe UI Variable", "Segoe UI", -apple-system, sans-serif;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.45;
                cursor: pointer;
                text-align: center;
            }
            .ns-format-select option {
                background: ${T.SURFACE_CARD};
                color: ${T.TEXT_PRIMARY};
            }

            .ns-btn-copy {
                flex: 1;
                background: transparent;
                border: 1px solid ${T.BORDER_SUBTLE};
                color: ${T.TEXT_PRIMARY};
            }
            .ns-btn-copy:hover {
                background: ${T.SURFACE_PILL};
            }

            .ns-btn-primary {
                flex: 1;
                background: ${T.SURFACE_BUTTON_DARK};
                border: 1px solid ${T.SURFACE_BUTTON_DARK};
                color: ${T.ON_ACCENT};
            }
            .ns-btn-primary:hover {
                background: ${T.SURFACE_PILL_ACTIVE};
                border-color: ${T.SURFACE_PILL_ACTIVE};
            }
        `;
        document.head.appendChild(style);
    }

    function renderMessageList() {
        const listContainer = document.getElementById('ns-msg-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (STATE.messages.length === 0) {
            listContainer.innerHTML = `<div style="padding:24px; text-align:center; color:${CONFIG.THEME.TEXT_MUTED}; font-family:'Segoe UI Variable',system-ui,sans-serif; font-size:13px; font-weight:400; line-height:1.45;">No messages found in Copilot thread.</div>`;
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
                attBadge.style.fontFamily = "'Segoe UI Variable',system-ui,sans-serif";
                attBadge.style.fontSize = '11px';
                attBadge.style.fontWeight = '500';
                attBadge.style.color = CONFIG.THEME.TEXT_DIM;
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
                fullText.style.fontFamily = "'Segoe UI Variable',system-ui,sans-serif";
                fullText.style.fontSize = '13px';
                fullText.style.fontWeight = '400';
                fullText.style.lineHeight = '1.45';
                fullText.style.color = CONFIG.THEME.TEXT_SECONDARY;
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

    function injectHeaderTrigger(openSidebarFn) {
        if (document.getElementById('ns-copilot-header-btn')) return;

        const inviteBtn = document.querySelector(CONFIG.SELECTORS.INVITE_BUTTON) || 
            Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim().includes('Invite'));

        if (!inviteBtn) return;

        const triggerBtn = document.createElement('button');
        triggerBtn.id = 'ns-copilot-header-btn';
        triggerBtn.className = 'ns-copilot-header-btn';
        triggerBtn.innerHTML = `✨ Export`;
        triggerBtn.onclick = (e) => {
            e.stopPropagation();
            openSidebarFn();
        };

        const flexRowContainer = inviteBtn.closest('.flex.items-center.gap-2') ||
                                 inviteBtn.closest('.flex.items-center') ||
                                 inviteBtn.parentElement;

        if (flexRowContainer) {
            flexRowContainer.prepend(triggerBtn);
        }
    }

    function createSidebarUI() {
        if (document.getElementById('ns-copilot-sidebar')) return;

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
        };

        const closeSidebar = () => {
            overlay.classList.remove('active');
            sidebar.classList.remove('active');
        };

        injectHeaderTrigger(openSidebar);

        const headerObserver = new MutationObserver(() => {
            injectHeaderTrigger(openSidebar);
        });
        headerObserver.observe(document.body, { childList: true, subtree: true });

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
        ThemeManager.init();
        createSidebarUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
