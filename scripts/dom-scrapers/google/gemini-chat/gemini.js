(function () {
    'use strict';

    /*
     * ============================================================
     * Noosphere Reflect — Google Gemini Native Exporter
     * ============================================================
     * Native Menu Injection & Markdown Synthesizer for Google Gemini
     * (gemini.google.com).
     *
     * Features:
     *   - Integrated Menu Trigger: Adds "Export Chat" under "Share
     *     Conversation" in the conversation actions menu
     *   - Lazy-Load Collection: Auto-scrolls up to trigger loading of
     *     older messages before scanning, ensuring 100% coverage
     *   - Recursive DOM-to-Markdown parser preserving full formatting
     *   - Interactive turn accordion drawer with batch selection controls
     *   - Gemini Material 3 dual-theme (clean alabaster / onyx)
     *   - Automatic theme detection & live switching with the page
     *   - Noosphere Reflect frontmatter metadata & signature footer
     *
     * Namespace: ns-gemini
     * ============================================================
     */

    const CONFIG = {
        SELECTORS: {
            USER_MESSAGE: '[data-test-id="luminous-collapsed-bubble"]',
            USER_TEXT: '.query-text',
            USER_TEXT_LINE: '.query-text-line',
            AI_MESSAGE: 'model-response',
            AI_CONTENT: '.markdown.markdown-main-panel',
            MENU_TRIGGER: 'conversation-actions-icon gem-icon-button',
            MENU_CONTAINER: 'conversation-action-menu',
            MENU_POPOVER: 'gem-popover',
            CONVERSATION_TITLE: 'conversation-header-title, .conversation-title, header h1',
            NOISE_ELEMENTS: 'button, svg, .copy-button, [aria-hidden="true"], .model-response-label-announcer'
        },

        THEMES: {
            light: {
                CANVAS: '#ffffff',
                CANVAS_SUBTLE: '#f8fafd',
                SURFACE_SIDEBAR: '#f0f4f9',
                SURFACE_PILL: '#e9eef6',
                SURFACE_PILL_ACTIVE: '#d3e3fd',
                SURFACE_CARD: '#ffffff',
                SURFACE_CARD_SUBTLE: '#f0f4f9',
                SURFACE_INPUT: '#ffffff',
                SURFACE_MENU: '#ffffff',
                SURFACE_MENU_HOVER: '#eef2f8',
                BRAND_BLUE: '#1a73e8',
                BRAND_BLUE_ACCENT: '#4285f4',
                BRAND_BLUE_PILL: '#0b57d0',
                BRAND_PURPLE_ACCENT: '#a855f7',
                GLOW_BLUE: 'radial-gradient(circle, rgba(195, 225, 255, 0.45) 0%, rgba(255, 255, 255, 0) 70%)',
                TEXT_PRIMARY: '#1f1f1f',
                TEXT_SECONDARY: '#444746',
                TEXT_MUTED: '#727775',
                TEXT_DIM: '#8e918f',
                ON_ACCENT: '#ffffff',
                BORDER_HAIRLINE: 'rgba(0, 0, 0, 0.06)',
                BORDER_SUBTLE: 'rgba(0, 0, 0, 0.12)',
                BORDER_MENU: 'rgba(0, 0, 0, 0.08)',
                SHADOW_FLOATING: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
                SHADOW_MENU: '0 8px 30px rgba(0, 0, 0, 0.12)'
            },
            dark: {
                CANVAS: '#131314',
                CANVAS_SUBTLE: '#18191b',
                SURFACE_SIDEBAR: '#1e1f20',
                SURFACE_PILL: '#282a2c',
                SURFACE_PILL_ACTIVE: '#37393b',
                SURFACE_CARD: '#1e1f20',
                SURFACE_CARD_SUBTLE: '#282a2c',
                SURFACE_INPUT: '#1e1f20',
                SURFACE_MENU: '#1e1f20',
                SURFACE_MENU_HOVER: '#2d2f31',
                BRAND_BLUE: '#1a73e8',
                BRAND_BLUE_ACCENT: '#4285f4',
                BRAND_BLUE_PILL: '#0b57d0',
                BRAND_PURPLE_ACCENT: '#a855f7',
                GLOW_BLUE: 'radial-gradient(circle, rgba(26, 44, 76, 0.55) 0%, rgba(19, 19, 20, 0) 70%)',
                TEXT_PRIMARY: '#e3e3e3',
                TEXT_SECONDARY: '#c4c7c5',
                TEXT_MUTED: '#8e918f',
                TEXT_DIM: '#5e5e5e',
                ON_ACCENT: '#ffffff',
                BORDER_HAIRLINE: 'rgba(255, 255, 255, 0.06)',
                BORDER_SUBTLE: 'rgba(255, 255, 255, 0.12)',
                BORDER_MENU: 'rgba(255, 255, 255, 0.08)',
                SHADOW_FLOATING: '0 4px 24px rgba(0, 0, 0, 0.40)',
                SHADOW_MENU: '0 8px 32px rgba(0, 0, 0, 0.50)'
            }
        }
    };

    CONFIG.THEME = CONFIG.THEMES.light;

    const STATE = {
        messages: [],
        selectedIds: new Set(),
        expandedId: null,
        exportFormat: 'markdown',
        currentTheme: null
    };

    const ThemeManager = {
        detect() {
            const html = document.documentElement;
            const htmlTheme = html.getAttribute('data-theme');
            if (htmlTheme === 'dark' || html.classList.contains('dark')) return 'dark';
            if (htmlTheme === 'light' || html.classList.contains('light')) return 'light';
            if (document.body) {
                const bodyTheme = document.body.getAttribute('data-theme');
                if (bodyTheme === 'dark' || document.body.classList.contains('dark')) return 'dark';
                if (bodyTheme === 'light' || document.body.classList.contains('light')) return 'light';
            }
            const getTextLum = (el) => {
                if (!el) return null;
                const color = window.getComputedStyle(el).color;
                if (!color) return null;
                const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (!rgb) return null;
                return (parseInt(rgb[1], 10) + parseInt(rgb[2], 10) + parseInt(rgb[3], 10)) / 3;
            };
            const userMsgText = document.querySelector('.query-text, .query-text-line');
            const textLum = getTextLum(userMsgText);
            if (textLum !== null) return textLum > 200 ? 'dark' : 'light';
            const getBgLum = (el) => {
                if (!el) return null;
                const bg = window.getComputedStyle(el).backgroundColor;
                if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return null;
                const rgb = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (!rgb) return null;
                return (parseInt(rgb[1], 10) + parseInt(rgb[2], 10) + parseInt(rgb[3], 10)) / 3;
            };
            const appContainers = [document.querySelector('model-response'), document.querySelector('main'), document.body];
            for (const container of appContainers) {
                const lum = getBgLum(container);
                if (lum !== null) return lum < 128 ? 'dark' : 'light';
            }
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
            return 'light';
        },
        apply(themeName) {
            if (STATE.currentTheme === themeName) return;
            STATE.currentTheme = themeName;
            CONFIG.THEME = CONFIG.THEMES[themeName];
            const oldStyle = document.getElementById('noosphere-gemini-styles');
            if (oldStyle) oldStyle.remove();
            injectStyles();
            renderMessageList();
        },
        init() {
            this.apply(this.detect());
            this._pollInterval = setInterval(() => {
                const detected = this.detect();
                if (detected !== STATE.currentTheme) this.apply(detected);
            }, 500);
            const observer = new MutationObserver(() => {
                const detected = this.detect();
                if (detected !== STATE.currentTheme) this.apply(detected);
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
            if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] });
        }
    };

    const Utils = {
        createNotification(message, success = true) {
            const notification = document.createElement('div');
            notification.textContent = message;
            Object.assign(notification.style, {
                position: 'fixed', top: '20px', right: '20px',
                background: success ? CONFIG.THEME.BRAND_BLUE : '#dc2626',
                color: CONFIG.THEME.ON_ACCENT, padding: '10px 20px',
                borderRadius: '9999px', zIndex: '200000',
                fontSize: '14px', fontWeight: '500', lineHeight: '1.50',
                fontFamily: '"Google Sans Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxShadow: CONFIG.THEME.SHADOW_MENU, transition: 'opacity 0.3s ease'
            });
            document.body.appendChild(notification);
            setTimeout(() => { notification.style.opacity = '0'; setTimeout(() => notification.remove(), 300); }, 2200);
        },
        cleanText(text) { return (text || '').replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/[ \t]{2,}/g, ' ').trim(); },
        normalizeMarkdown(text) { return text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim(); },
        sanitizeFilename(text) { return (text || 'Gemini_Chat').replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_').substring(0, 80); },
        getDateString() { const now = new Date(); const pad = n => n.toString().padStart(2, '0'); return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`; }
    };

    function renderNodeToMarkdown(node) {
        if (!node) return '';
        if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
        if (node.nodeType !== Node.ELEMENT_NODE) return '';
        if (node.matches && node.matches(CONFIG.SELECTORS.NOISE_ELEMENTS)) return '';
        const tag = node.tagName.toLowerCase();
        const inner = () => Array.from(node.childNodes).map(renderNodeToMarkdown).join('');
        switch (tag) {
            case 'h1': return `\n\n# ${Utils.cleanText(inner())}\n\n`;
            case 'h2': return `\n\n## ${Utils.cleanText(inner())}\n\n`;
            case 'h3': return `\n\n### ${Utils.cleanText(inner())}\n\n`;
            case 'h4': return `\n\n#### ${Utils.cleanText(inner())}\n\n`;
            case 'h5': return `\n\n##### ${Utils.cleanText(inner())}\n\n`;
            case 'h6': return `\n\n###### ${Utils.cleanText(inner())}\n\n`;
            case 'p': { const text = inner().trim(); return text ? `\n\n${text}\n\n` : ''; }
            case 'strong': case 'b': { const text = inner().trim(); return text ? `**${text}**` : ''; }
            case 'em': case 'i': { const text = inner().trim(); return text ? `*${text}*` : ''; }
            case 'code': { if (node.parentElement?.tagName.toLowerCase() === 'pre') return inner(); return `\`${inner().replace(/`/g, '\\`')}\``; }
            case 'pre': { const clone = node.cloneNode(true); clone.querySelectorAll('button, svg, .copy-button').forEach(n => n.remove()); const lang = clone.getAttribute('data-lang') || clone.className.match(/lang-(\w+)/)?.[1] || ''; const codeText = clone.textContent || ''; return `\n\n\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n\n`; }
            case 'blockquote': { const text = Utils.cleanText(inner()); return `\n\n> ${text.replace(/\n/g, '\n> ')}\n\n`; }
            case 'hr': return '\n\n---\n\n';
            case 'br': return '\n';
            case 'a': { const label = Utils.cleanText(inner()); const href = node.getAttribute('href'); return href ? `[${label || href}](${href})` : label; }
            case 'ul': case 'ol': { const isOrdered = tag === 'ol'; const items = Array.from(node.children).filter(child => child.tagName.toLowerCase() === 'li').map((li, idx) => { const liText = Utils.cleanText(renderNodeToMarkdown(li)); const prefix = isOrdered ? `${idx + 1}.` : '-'; return `${prefix} ${liText}`; }).filter(Boolean); return `\n\n${items.join('\n')}\n\n`; }
            case 'li': return inner().trim();
            case 'table': { const rows = Array.from(node.querySelectorAll('tr')); if (!rows.length) return ''; const matrix = rows.map(row => { const cells = Array.from(row.querySelectorAll('th, td')); return cells.map(cell => Utils.cleanText(renderNodeToMarkdown(cell))); }); const colCount = Math.max(...matrix.map(r => r.length), 0); if (!colCount) return ''; const escapeCell = val => String(val || '').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim(); const normalized = matrix.map(r => { const copy = r.slice(); while (copy.length < colCount) copy.push(''); return copy; }); const header = normalized[0].map(escapeCell); const separator = new Array(colCount).fill('---'); const output = [`| ${header.join(' | ')} |`, `| ${separator.join(' | ')} |`]; for (let i = 1; i < normalized.length; i++) output.push(`| ${normalized[i].map(escapeCell).join(' | ')} |`); return `\n\n${output.join('\n')}\n\n`; }
            default: return inner();
        }
    }

    function htmlToMarkdown(element) {
        if (!element) return '';
        const clone = element.cloneNode(true);
        clone.querySelectorAll(CONFIG.SELECTORS.NOISE_ELEMENTS).forEach(n => n.remove());
        return Utils.normalizeMarkdown(renderNodeToMarkdown(clone));
    }

    function extractUserMessage(container) {
        const textEl = container.querySelector(CONFIG.SELECTORS.USER_TEXT) || container;
        const lines = Array.from(textEl.querySelectorAll(CONFIG.SELECTORS.USER_TEXT_LINE));
        if (lines.length > 0) return Utils.cleanText(lines.map(l => l.innerText).join('\n'));
        return Utils.cleanText(textEl.innerText || '');
    }

    function extractAIMessage(container) {
        const contentEl = container.querySelector(CONFIG.SELECTORS.AI_CONTENT) || container;
        return htmlToMarkdown(contentEl);
    }

    function scanThreadMessages() {
        STATE.messages = [];
        const userMessages = Array.from(document.querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE));
        const aiMessages = Array.from(document.querySelectorAll(CONFIG.SELECTORS.AI_MESSAGE));
        const allElements = [];
        userMessages.forEach(el => { const text = extractUserMessage(el); if (text) allElements.push({ type: 'user', el, order: el.getBoundingClientRect().top, text, preview: text.substring(0, 70) + (text.length > 70 ? '...' : '') }); });
        aiMessages.forEach(el => { const text = extractAIMessage(el); const rawText = Utils.cleanText(el.innerText || ''); if (rawText) allElements.push({ type: 'ai', el, order: el.getBoundingClientRect().top, text, preview: rawText.substring(0, 70) + (rawText.length > 70 ? '...' : '') }); });
        allElements.sort((a, b) => a.order - b.order);
        STATE.messages = allElements.map((item, idx) => ({ id: idx, role: item.type, text: item.text, preview: item.preview, el: item.el }));
        if (STATE.selectedIds.size === 0) STATE.messages.forEach(m => STATE.selectedIds.add(m.id));
    }

    async function collectAllMessages() {
        const scrollContainer = document.querySelector('main') || document.scrollingElement || document.documentElement;
        let previousCount = -1; let stableRounds = 0;
        for (let i = 0; i < 30; i++) {
            const currentCount = document.querySelectorAll([CONFIG.SELECTORS.USER_MESSAGE, CONFIG.SELECTORS.AI_MESSAGE].join(', ')).length;
            if (currentCount === previousCount) { stableRounds++; if (stableRounds >= 3) break; } else { stableRounds = 0; previousCount = currentCount; }
            scrollContainer.scrollTop = 0;
            await new Promise(resolve => setTimeout(resolve, 600));
        }
        scanThreadMessages();
    }

    const ExportService = {
        getExportTitle() {
            const manualTitle = document.getElementById('ns-gemini-title')?.value?.trim();
            if (manualTitle) return manualTitle;
            const titleEl = document.querySelector(CONFIG.SELECTORS.CONVERSATION_TITLE);
            if (titleEl && titleEl.innerText) return Utils.cleanText(titleEl.innerText).substring(0, 50);
            const firstUserMsg = STATE.messages.find(m => m.role === 'user');
            if (firstUserMsg && firstUserMsg.text) return Utils.cleanText(firstUserMsg.text).substring(0, 50);
            return document.title || 'Gemini_Chat';
        },
        buildMarkdown() {
            const title = this.getExportTitle(); const sourceUrl = window.location.href; const exportedAt = new Date().toLocaleString();
            const selected = STATE.messages.filter(m => STATE.selectedIds.has(m.id));
            const userCount = selected.filter(m => m.role === 'user').length; const aiCount = selected.filter(m => m.role === 'ai').length;
            let md = '';
            md += '---\n'; md += `> **\u{1F4DD} Title:** ${title}\n>\n`; md += '> **\u{1F916} Model:** Google Gemini\n>\n';
            md += `> **\u{1F310} Exported:** ${exportedAt}\n>\n`; md += `> **\u{1F310} Source:** [Google Gemini](${sourceUrl})\n>\n`;
            md += '> **\u{1F3F7}\uFE0F Tags:** Gemini, AI-Chat, Noosphere, Google\n>\n';
            md += `> **\u{1F4CA} Metadata:** ${selected.length} Selected Messages | ${userCount} User | ${aiCount} Gemini\n`;
            md += '---\n\n'; md += `# ${title}\n\n---\n\n`;
            selected.forEach(msg => {
                if (msg.role === 'user') md += `#### Prompt - User \u{1F464}:\n\n${msg.text}\n\n---\n\n`;
                else if (msg.role === 'ai') md += `#### Response - Gemini \u2728:\n\n${msg.text}\n\n---\n\n`;
            });
            md += '###### Noosphere Reflect\n'; md += '###### ***Meaning Through Memory***\n\n'; md += '###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n';
            return Utils.normalizeMarkdown(md);
        },
        buildJSON() {
            const title = this.getExportTitle(); const selected = STATE.messages.filter(m => STATE.selectedIds.has(m.id));
            return JSON.stringify({ metadata: { title, exportedAt: new Date().toISOString(), sourceUrl: window.location.href, model: 'Google Gemini' }, messages: selected.map(m => ({ role: m.role, content: m.text })) }, null, 2);
        },
        async executeCopy() {
            if (STATE.selectedIds.size === 0) { Utils.createNotification('\u26A0\uFE0F Select at least one message', false); return; }
            try { const content = STATE.exportFormat === 'json' ? this.buildJSON() : this.buildMarkdown(); await navigator.clipboard.writeText(content); Utils.createNotification(`\u2705 Copied ${STATE.selectedIds.size} turns as ${STATE.exportFormat.toUpperCase()}!`); }
            catch (err) { console.error('[Noosphere Gemini]', err); Utils.createNotification('\u274C Clipboard export failed', false); }
        }
    };

    function injectStyles() {
        if (document.getElementById('noosphere-gemini-styles')) return;
        const T = CONFIG.THEME;
        const style = document.createElement('style');
        style.id = 'noosphere-gemini-styles';
        style.textContent = `
            .ns-gemini-header-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 36px !important; height: 36px !important; padding: 0 !important; border-radius: 50% !important; cursor: pointer !important; color: ${T.TEXT_SECONDARY} !important; background: transparent !important; border: none !important; transition: all 0.15s ease !important; user-select: none !important; flex-shrink: 0 !important; }
            .ns-gemini-header-btn:hover { background: ${T.SURFACE_MENU_HOVER} !important; }
            .ns-gemini-header-btn:active { transform: scale(96%) !important; }
            .ns-gemini-header-btn svg { width: 20px !important; height: 20px !important; stroke: currentColor !important; fill: none !important; }
            #ns-gemini-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); z-index: 100001; display: none; opacity: 0; transition: opacity 0.25s ease; }
            #ns-gemini-overlay.active { display: block; opacity: 1; }
            #ns-gemini-sidebar { position: fixed; top: 0; right: -400px; width: 400px; height: 100%; background: ${T.CANVAS}; border-left: 1px solid ${T.BORDER_HAIRLINE}; color: ${T.TEXT_PRIMARY}; z-index: 100002; transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; box-shadow: ${T.SHADOW_MENU}; font-family: "Google Sans Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            #ns-gemini-sidebar.active { right: 0; }
            .ns-gemini-header { padding: 20px 24px 16px; background: ${T.SURFACE_SIDEBAR}; border-bottom: 1px solid ${T.BORDER_HAIRLINE}; display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; }
            .ns-gemini-title { font-family: "Google Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 22px; font-weight: 400; line-height: 1.35; display: flex; align-items: center; gap: 8px; margin: 0; color: ${T.TEXT_PRIMARY}; }
            .ns-gemini-input-group { display: flex; flex-direction: column; gap: 6px; }
            .ns-gemini-label { font-family: "Google Sans Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; font-weight: 400; line-height: 1.40; color: ${T.TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.4px; }
            .ns-gemini-input { width: 100%; background: ${T.SURFACE_INPUT}; border: 1px solid ${T.BORDER_SUBTLE}; border-radius: 28px; padding: 10px 16px; color: ${T.TEXT_PRIMARY}; font-family: "Google Sans Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; font-weight: 400; line-height: 1.50; outline: none; box-sizing: border-box; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
            .ns-gemini-input:focus { border-color: ${T.BRAND_BLUE}; box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.15); }
            .ns-gemini-batch { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
            .ns-gemini-batch-btn { padding: 8px; background: ${T.SURFACE_PILL}; border: 1px solid ${T.BORDER_SUBTLE}; border-radius: 9999px; color: ${T.TEXT_SECONDARY}; font-family: "Google Sans Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; font-weight: 500; line-height: 1.45; cursor: pointer; text-align: center; transition: all 0.15s ease; }
            .ns-gemini-batch-btn:hover { background: ${T.SURFACE_PILL_ACTIVE}; color: ${T.TEXT_PRIMARY}; }
            .ns-gemini-msg-list { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
            .ns-gemini-msg-card { background: ${T.SURFACE_CARD_SUBTLE} !important; border: 1px solid ${T.BORDER_HAIRLINE} !important; border-radius: 20px !important; overflow: hidden !important; flex-shrink: 0 !important; height: auto !important; min-height: 52px !important; max-height: none !important; transition: all 0.15s ease; box-sizing: border-box !important; }
            .ns-gemini-msg-card:hover { border-color: ${T.BORDER_SUBTLE} !important; box-shadow: ${T.SHADOW_FLOATING} !important; }
            .ns-gemini-msg-item { display: flex !important; align-items: flex-start !important; padding: 12px 16px !important; gap: 12px !important; cursor: pointer !important; box-sizing: border-box !important; height: auto !important; min-height: 48px !important; }
            .ns-gemini-check { appearance: none !important; -webkit-appearance: none !important; width: 18px !important; height: 18px !important; border: 2px solid ${T.BRAND_BLUE} !important; border-radius: 4px !important; cursor: pointer !important; background: ${T.SURFACE_CARD} !important; position: relative !important; flex-shrink: 0 !important; margin-top: 2px !important; transition: all 0.15s ease !important; }
            .ns-gemini-check:checked { background: ${T.BRAND_BLUE} !important; }
            .ns-gemini-check:checked::after { content: '\u2713' !important; position: absolute !important; color: ${T.ON_ACCENT} !important; font-size: 12px !important; font-weight: bold !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; }
            .ns-gemini-msg-content { flex: 1 !important; min-width: 0 !important; display: flex !important; flex-direction: column !important; gap: 4px !important; }
            .ns-gemini-role-badge { display: inline-flex !important; align-items: center !important; gap: 4px !important; font-family: "Google Sans Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10px !important; font-weight: 600 !important; line-height: 1.20 !important; letter-spacing: 0.4px !important; text-transform: uppercase !important; padding: 3px 8px !important; border-radius: 9999px !important; }
            .ns-gemini-role-user { background: ${T.SURFACE_PILL_ACTIVE} !important; color: ${T.BRAND_BLUE_PILL} !important; }
            .ns-gemini-role-ai { background: rgba(26, 115, 232, 0.15) !important; color: ${T.BRAND_BLUE} !important; }
            .ns-gemini-msg-preview { font-family: "Google Sans Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px !important; font-weight: 400 !important; line-height: 1.45 !important; color: ${T.TEXT_SECONDARY} !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; word-break: break-word !important; }
            .ns-gemini-accordion { background: ${T.SURFACE_CARD_SUBTLE} !important; border-top: 1px solid ${T.BORDER_HAIRLINE} !important; padding: 12px 16px 16px 46px !important; display: flex !important; flex-direction: column !important; gap: 8px !important; font-family: "Google Sans Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px !important; font-weight: 400 !important; line-height: 1.45 !important; }
            .ns-gemini-accordion-content { color: ${T.TEXT_SECONDARY} !important; white-space: pre-wrap !important; max-height: 220px !important; overflow-y: auto !important; line-height: 1.45 !important; }
            .ns-gemini-footer { padding: 16px 20px; background: ${T.SURFACE_SIDEBAR}; border-top: 1px solid ${T.BORDER_HAIRLINE}; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
            .ns-gemini-btn { font-family: "Google Sans Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; font-weight: 500; line-height: 1.45; border-radius: 9999px; padding: 10px 16px; cursor: pointer; text-align: center; transition: all 0.15s ease; white-space: nowrap; border: none; outline: none; }
            .ns-gemini-btn-cancel { background: transparent; border: 1px solid ${T.BORDER_SUBTLE}; color: ${T.TEXT_SECONDARY}; flex: 0.8; }
            .ns-gemini-btn-cancel:hover { background: ${T.SURFACE_PILL}; color: ${T.TEXT_PRIMARY}; }
            .ns-gemini-format-select { flex: 1.2; background: ${T.SURFACE_INPUT}; border: 1px solid ${T.BORDER_SUBTLE}; border-radius: 9999px; color: ${T.TEXT_PRIMARY}; padding: 10px 10px; outline: none; font-family: "Google Sans Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; font-weight: 400; line-height: 1.40; cursor: pointer; text-align: center; }
            .ns-gemini-format-select option { background: ${T.SURFACE_CARD}; color: ${T.TEXT_PRIMARY}; }
            .ns-gemini-btn-copy { flex: 1; background: ${T.BRAND_BLUE}; color: ${T.ON_ACCENT}; }
            .ns-gemini-btn-copy:hover { background: ${T.BRAND_BLUE_PILL}; }
        `;
        document.head.appendChild(style);
    }

    function renderMessageList() {
        const listContainer = document.getElementById('ns-gemini-msg-list');
        if (!listContainer) return;
        while (listContainer.firstChild) { listContainer.removeChild(listContainer.firstChild); }
        if (STATE.messages.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = `padding:24px; text-align:center; color:${CONFIG.THEME.TEXT_MUTED}; font-family:'Google Sans Text',system-ui,sans-serif; font-size:13px; font-weight:400; line-height:1.45;`;
            emptyMsg.textContent = 'No messages found in this conversation.';
            listContainer.appendChild(emptyMsg);
            return;
        }
        STATE.messages.forEach(msg => {
            const card = document.createElement('div'); card.className = 'ns-gemini-msg-card';
            const item = document.createElement('div'); item.className = 'ns-gemini-msg-item';
            const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'ns-gemini-check'; checkbox.checked = STATE.selectedIds.has(msg.id);
            const content = document.createElement('div'); content.className = 'ns-gemini-msg-content';
            const badge = document.createElement('span'); badge.className = `ns-gemini-role-badge ns-gemini-role-${msg.role}`; badge.textContent = msg.role === 'user' ? '\u{1F464} USER' : '\u2728 GEMINI'; content.appendChild(badge);
            const preview = document.createElement('div'); preview.className = 'ns-gemini-msg-preview'; preview.textContent = msg.preview || (msg.role === 'user' ? 'User Prompt' : 'Gemini Response'); content.appendChild(preview);
            item.appendChild(checkbox); item.appendChild(content); card.appendChild(item);
            const isExpanded = STATE.expandedId === msg.id;
            if (isExpanded) { const accordion = document.createElement('div'); accordion.className = 'ns-gemini-accordion'; const fullText = document.createElement('div'); fullText.className = 'ns-gemini-accordion-content'; fullText.textContent = msg.text; accordion.appendChild(fullText); card.appendChild(accordion); }
            checkbox.onclick = (e) => { e.stopPropagation(); if (STATE.selectedIds.has(msg.id)) { STATE.selectedIds.delete(msg.id); checkbox.checked = false; } else { STATE.selectedIds.add(msg.id); checkbox.checked = true; } };
            item.onclick = (e) => { e.stopPropagation(); STATE.expandedId = isExpanded ? null : msg.id; renderMessageList(); };
            listContainer.appendChild(card);
        });
    }

    function injectHeaderTrigger(openSidebarFn) {
        if (document.getElementById('ns-gemini-header-btn')) return;

        const menuIcon = document.querySelector('conversation-actions-icon');
        if (!menuIcon) return;

        const triggerBtn = document.createElement('button');
        triggerBtn.id = 'ns-gemini-header-btn';
        triggerBtn.className = 'ns-gemini-header-btn';
        triggerBtn.setAttribute('aria-label', 'Export Chat');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '24'); svg.setAttribute('height', '24'); svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('stroke-width', '2'); svg.setAttribute('stroke-miterlimit', '10'); svg.setAttribute('stroke-linecap', 'square');
        const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p1.setAttribute('d', 'M12 3V15'); p1.setAttribute('stroke', 'currentColor'); p1.setAttribute('stroke-width', '2'); p1.setAttribute('fill', 'none');
        const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p2.setAttribute('d', 'M7 10L12 15L17 10'); p2.setAttribute('stroke', 'currentColor'); p2.setAttribute('stroke-width', '2'); p2.setAttribute('stroke-linecap', 'square'); p2.setAttribute('fill', 'none');
        const p3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p3.setAttribute('d', 'M4 18L4 20L20 20L20 18'); p3.setAttribute('stroke', 'currentColor'); p3.setAttribute('stroke-width', '2'); p3.setAttribute('stroke-linecap', 'square'); p3.setAttribute('fill', 'none');
        svg.appendChild(p1); svg.appendChild(p2); svg.appendChild(p3);
        triggerBtn.appendChild(svg);
        triggerBtn.onclick = (e) => { e.stopPropagation(); openSidebarFn(); };

        // Insert before the 3-dot menu (to the left)
        menuIcon.parentNode.insertBefore(triggerBtn, menuIcon);
    }

    function createSidebarUI() {
        if (document.getElementById('ns-gemini-sidebar')) return;
        const overlay = document.createElement('div'); overlay.id = 'ns-gemini-overlay';
        const sidebar = document.createElement('div'); sidebar.id = 'ns-gemini-sidebar';

        // Build header
        const header = document.createElement('div'); header.className = 'ns-gemini-header';
        const title = document.createElement('div'); title.className = 'ns-gemini-title'; title.textContent = '\u2728 Gemini Exporter';
        header.appendChild(title);
        const inputGroup = document.createElement('div'); inputGroup.className = 'ns-gemini-input-group';
        const label = document.createElement('span'); label.className = 'ns-gemini-label'; label.textContent = 'Chat Title';
        const input = document.createElement('input'); input.type = 'text'; input.id = 'ns-gemini-title'; input.className = 'ns-gemini-input'; input.placeholder = 'Enter session title...';
        inputGroup.appendChild(label); inputGroup.appendChild(input); header.appendChild(inputGroup);
        const batch = document.createElement('div'); batch.className = 'ns-gemini-batch';
        ['All', 'User', 'AI', 'None'].forEach(text => {
            const btn = document.createElement('button'); btn.className = 'ns-gemini-batch-btn'; btn.id = `ns-gemini-batch-${text.toLowerCase()}`; btn.textContent = text;
            batch.appendChild(btn);
        });
        header.appendChild(batch);

        // Build message list
        const msgList = document.createElement('div'); msgList.className = 'ns-gemini-msg-list'; msgList.id = 'ns-gemini-msg-list';

        // Build footer
        const footer = document.createElement('div'); footer.className = 'ns-gemini-footer';
        const cancelBtn = document.createElement('button'); cancelBtn.className = 'ns-gemini-btn ns-gemini-btn-cancel'; cancelBtn.id = 'ns-gemini-cancel'; cancelBtn.textContent = 'Cancel';
        const formatSelect = document.createElement('select'); formatSelect.className = 'ns-gemini-format-select'; formatSelect.id = 'ns-gemini-format';
        const mdOption = document.createElement('option'); mdOption.value = 'markdown'; mdOption.textContent = 'Markdown (.md)';
        const jsonOption = document.createElement('option'); jsonOption.value = 'json'; jsonOption.textContent = 'JSON (.json)';
        formatSelect.appendChild(mdOption); formatSelect.appendChild(jsonOption);
        const copyBtn = document.createElement('button'); copyBtn.className = 'ns-gemini-btn ns-gemini-btn-copy'; copyBtn.id = 'ns-gemini-copy'; copyBtn.textContent = '\u{1F4CB} Copy';
        footer.appendChild(cancelBtn); footer.appendChild(formatSelect); footer.appendChild(copyBtn);

        // Assemble sidebar
        sidebar.appendChild(header); sidebar.appendChild(msgList); sidebar.appendChild(footer);
        document.body.appendChild(overlay); document.body.appendChild(sidebar);
        const openSidebar = async () => { await collectAllMessages(); renderMessageList(); overlay.classList.add('active'); sidebar.classList.add('active'); };
        const closeSidebar = () => { overlay.classList.remove('active'); sidebar.classList.remove('active'); };
        injectHeaderTrigger(openSidebar);
        const headerObserver = new MutationObserver(() => { injectHeaderTrigger(openSidebar); });
        headerObserver.observe(document.body, { childList: true, subtree: true, attributes: false });
        overlay.onclick = closeSidebar;
        document.getElementById('ns-gemini-cancel').onclick = closeSidebar;
        const setBatch = (type) => { STATE.selectedIds.clear(); if (type === 'all') STATE.messages.forEach(m => STATE.selectedIds.add(m.id)); if (type === 'user') STATE.messages.filter(m => m.role === 'user').forEach(m => STATE.selectedIds.add(m.id)); if (type === 'ai') STATE.messages.filter(m => m.role === 'ai').forEach(m => STATE.selectedIds.add(m.id)); renderMessageList(); };
        document.getElementById('ns-gemini-batch-all').onclick = () => setBatch('all');
        document.getElementById('ns-gemini-batch-user').onclick = () => setBatch('user');
        document.getElementById('ns-gemini-batch-ai').onclick = () => setBatch('ai');
        document.getElementById('ns-gemini-batch-none').onclick = () => setBatch('none');
        document.getElementById('ns-gemini-format').onchange = (e) => { STATE.exportFormat = e.target.value; };
        document.getElementById('ns-gemini-copy').onclick = () => ExportService.executeCopy();
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });
    }

    function init() {
        console.log('\u2728 Noosphere Reflect \u2014 Google Gemini Native Exporter Initialized');
        ThemeManager.init();
        createSidebarUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
