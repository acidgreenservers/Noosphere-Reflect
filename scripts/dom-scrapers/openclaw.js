(function () {
    'use strict';

    /*
     * ============================================================
     * Noosphere Reflect — OpenClaw Chat Exporter (V2)
     * ============================================================
     *
     * Native Slide-Over Drawer & Markdown Synthesizer for OpenClaw Control.
     *
     * Features:
     *   - Integrated Header Trigger: Injected into the top header bar
     *   - Recursive DOM-to-Markdown parser preserving formatting
     *   - Interactive turn accordion drawer with batch filtering
     *   - OpenClaw Dual Theme (Light Canvas / Stealth Charcoal)
     *   - Automatic theme detection & live switching
     *   - Frontmatter metadata extraction (model, tokens, cache, ctx)
     *
     * Namespace: ns-openclaw
     * ============================================================
     */

    const CONFIG = {
        SELECTORS: {
            USER_MESSAGE: '.chat-group.user',
            AI_MESSAGE: '.chat-group.assistant',
            CHAT_TEXT: '.chat-text',
            TIMESTAMP: '.chat-group-timestamp',
            MODEL_NAME: '.msg-meta__model',
            TOKENS_UP: '.msg-meta__tokens',
            CACHE_INFO: '.msg-meta__cache',
            CTX_INFO: '.msg-meta__ctx',
            
            // Rail Injection
            HEADER_CONTAINER: '.chat-workspace-rail',
            
            // Conversation Title
            CONVERSATION_TITLE: 'title',
            
            // UI Chrome to Strip
            NOISE_ELEMENTS: '.chat-bubble-actions, .chat-group-footer, .chat-avatar, .chat-delete-wrap, .chat-tts-btn, button, svg, .sr-only'
        },

        // OpenClaw Design Tokens (from DESIGN.md)
        THEMES: {
            light: {
                CANVAS: '#f4f5f7',
                SURFACE_SIDEBAR: '#ffffff',
                SURFACE_CARD: '#ffffff',
                SURFACE_INPUT: '#ffffff',
                TEXT_PRIMARY: '#1a1d20',
                TEXT_MUTED: '#868e96',
                BORDER: '#e9ecef',
                HOVER: '#f1f3f5',
                USER_BUBBLE: '#feeae8',
                AGENT_BUBBLE: '#ffffff',
                BRAND_LOBSTER: '#e03131',
                BRAND_LOBSTER_HOVER: '#c92a2a',
                ON_BRAND: '#ffffff',
                ERROR: '#e03131'
            },
            dark: {
                CANVAS: '#111317',
                SURFACE_SIDEBAR: '#16181d',
                SURFACE_CARD: '#1b1e24',
                SURFACE_INPUT: '#1b1e24',
                TEXT_PRIMARY: '#f1f3f5',
                TEXT_MUTED: '#6c7482',
                BORDER: 'rgba(255, 255, 255, 0.10)',
                HOVER: '#22262e',
                USER_BUBBLE: '#2a1b1d',
                AGENT_BUBBLE: '#1b1e24',
                BRAND_LOBSTER: '#e03131',
                BRAND_LOBSTER_HOVER: '#c92a2a',
                ON_BRAND: '#ffffff',
                ERROR: '#e03131'
            }
        }
    };

    // Active theme reference — swapped by ThemeManager
    CONFIG.THEME = CONFIG.THEMES.light;

    const STATE = {
        messages: [],
        selectedIds: new Set(),
        expandedId: null,
        sidebarOpen: false,
        currentTheme: null
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
                background: success ? CONFIG.THEME.BRAND_LOBSTER : CONFIG.THEME.ERROR,
                color: CONFIG.THEME.ON_BRAND,
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '200000',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'opacity 0.3s ease'
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
            return (text || 'OpenClaw_Chat')
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

        // Ignore UI chrome noise
        if (node.matches && node.matches(CONFIG.SELECTORS.NOISE_ELEMENTS)) {
            return '';
        }

        const tag = node.tagName.toLowerCase();
        const inner = () => Array.from(node.childNodes).map(renderNodeToMarkdown).join('');

        switch (tag) {
            case 'h1': return `\n\n# ${Utils.cleanText(inner())}\n\n`;
            case 'h2': return `\n\n## ${Utils.cleanText(inner())}\n\n`;
            case 'h3': return `\n\n### ${Utils.cleanText(inner())}\n\n`;
            case 'h4': return `\n\n#### ${Utils.cleanText(inner())}\n\n`;
            case 'h5': return `\n\n##### ${Utils.cleanText(inner())}\n\n`;
            case 'h6': return `\n\n###### ${Utils.cleanText(inner())}\n\n`;
            case 'p': return `\n\n${inner().trim()}\n\n`;
            case 'strong': case 'b': return `**${inner().trim()}**`;
            case 'em': case 'i': return `*${inner().trim()}*`;
            case 'code': {
                if (node.parentElement?.tagName.toLowerCase() === 'pre') return inner();
                return `\`${inner().replace(/`/g, '\\`')}\``;
            }
            case 'pre': {
                const clone = node.cloneNode(true);
                clone.querySelectorAll(CONFIG.SELECTORS.NOISE_ELEMENTS).forEach(n => n.remove());
                const lang = clone.getAttribute('data-lang') || clone.className.match(/lang-(\w+)/)?.[1] || '';
                return `\n\n\`\`\`${lang}\n${(clone.textContent || '').trim()}\n\`\`\`\n\n`;
            }
            case 'blockquote': return `\n\n> ${Utils.cleanText(inner()).replace(/\n/g, '\n> ')}\n\n`;
            case 'hr': return '\n\n---\n\n';
            case 'br': return '\n';
            case 'a': {
                const label = Utils.cleanText(inner());
                const href = node.getAttribute('href');
                return href ? `[${label || href}](${href})` : label;
            }
            case 'ul': case 'ol': {
                const isOrdered = tag === 'ol';
                const items = Array.from(node.children)
                    .filter(child => child.tagName.toLowerCase() === 'li')
                    .map((li, idx) => `${isOrdered ? `${idx + 1}.` : '-'} ${Utils.cleanText(renderNodeToMarkdown(li))}`)
                    .filter(Boolean);
                return `\n\n${items.join('\n')}\n\n`;
            }
            case 'li': return inner().trim();
            case 'table': {
                const rows = Array.from(node.querySelectorAll('tr'));
                if (!rows.length) return '';
                const matrix = rows.map(row => Array.from(row.querySelectorAll('th, td')).map(cell => Utils.cleanText(renderNodeToMarkdown(cell))));
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
                for (let i = 1; i < normalized.length; i++) output.push(`| ${normalized[i].map(escapeCell).join(' | ')} |`);
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
    // DOM Extractors
    // ============================================================

    function extractMetadata(container) {
        const metadata = {};
        const timestampEl = container.querySelector(CONFIG.SELECTORS.TIMESTAMP);
        if (timestampEl) metadata.timestamp = timestampEl.textContent.trim();
        
        const modelEl = container.querySelector(CONFIG.SELECTORS.MODEL_NAME);
        if (modelEl) metadata.model = modelEl.textContent.trim();
        
        const tokenEls = container.querySelectorAll(CONFIG.SELECTORS.TOKENS_UP);
        if (tokenEls.length > 0) metadata.tokens = Array.from(tokenEls).map(el => el.textContent.trim()).join(' ');
        
        const cacheEl = container.querySelector(CONFIG.SELECTORS.CACHE_INFO);
        if (cacheEl) metadata.cache = cacheEl.textContent.trim();
        
        const ctxEl = container.querySelector(CONFIG.SELECTORS.CTX_INFO);
        if (ctxEl) metadata.ctx = ctxEl.textContent.trim();
        
        return metadata;
    }

    function scanConversation() {
        STATE.messages = [];
        
        const userContainers = Array.from(document.querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE));
        const aiContainers = Array.from(document.querySelectorAll(CONFIG.SELECTORS.AI_MESSAGE));
        
        const allElements = [];
        
        userContainers.forEach(el => {
            const textEl = el.querySelector(CONFIG.SELECTORS.CHAT_TEXT);
            if (textEl) {
                const content = htmlToMarkdown(textEl);
                if (content) {
                    allElements.push({
                        type: 'user', el, order: el.getBoundingClientRect().top,
                        text: content, metadata: extractMetadata(el),
                        preview: content.substring(0, 75).replace(/\n/g, ' ') + (content.length > 75 ? '...' : '')
                    });
                }
            }
        });
        
        aiContainers.forEach(el => {
            const textEl = el.querySelector(CONFIG.SELECTORS.CHAT_TEXT);
            if (textEl) {
                const content = htmlToMarkdown(textEl);
                if (content) {
                    allElements.push({
                        type: 'assistant', el, order: el.getBoundingClientRect().top,
                        text: content, metadata: extractMetadata(el),
                        preview: content.substring(0, 75).replace(/\n/g, ' ') + (content.length > 75 ? '...' : '')
                    });
                }
            }
        });
        
        allElements.sort((a, b) => a.order - b.order);
        
        allElements.forEach((item, idx) => {
            STATE.messages.push({
                id: idx, role: item.type, text: item.text, metadata: item.metadata, preview: item.preview
            });
        });
        
        if (STATE.selectedIds.size === 0) {
            STATE.messages.forEach(m => STATE.selectedIds.add(m.id));
        }
    }

    // ============================================================
    // Export Service & Document Synthesis
    // ============================================================

    const ExportService = {
        getExportTitle() {
            const manualTitle = document.getElementById('ns-openclaw-title')?.value?.trim();
            if (manualTitle) return manualTitle;
            const titleEl = document.querySelector(CONFIG.SELECTORS.CONVERSATION_TITLE);
            if (titleEl && titleEl.innerText) return Utils.cleanText(titleEl.innerText).substring(0, 50);
            return 'OpenClaw_Chat';
        },

        buildMarkdown() {
            const title = this.getExportTitle();
            const sourceUrl = window.location.href;
            const exportedAt = new Date().toLocaleString();
            const selected = STATE.messages.filter(m => STATE.selectedIds.has(m.id));
            const models = [...new Set(selected.map(m => m.metadata?.model).filter(Boolean))];

            let md = '---\n';
            md += `> **📝 Title:** ${title}\n>\n`;
            md += `> **🤖 Model:** ${models.join(', ') || 'OpenClaw'}\n>\n`;
            md += `> **🌐 Exported:** ${exportedAt}\n>\n`;
            md += `> **🌐 Source:** [OpenClaw Control](${sourceUrl})\n>\n`;
            md += '> **🏷️ Tags:** OpenClaw, AI-Chat, Agent, Noosphere\n>\n';
            md += `> **📊 Metadata:** ${selected.length} Selected Messages\n`;
            
            selected.forEach((msg, idx) => {
                const meta = msg.metadata || {};
                if (meta.model || meta.tokens || meta.cache || meta.ctx) {
                    md += `>   ${idx + 1}. ${msg.role}${meta.model ? ` [${meta.model}]` : ''}`;
                    if (meta.tokens) md += ` | ${meta.tokens}`;
                    if (meta.cache) md += ` | ${meta.cache}`;
                    if (meta.ctx) md += ` | ${meta.ctx}`;
                    md += '\n';
                }
            });
            md += '---\n\n';
            md += `# ${title}\n\n---\n\n`;

            selected.forEach(msg => {
                const senderLabel = msg.role === 'user' ? 'User' : 'OpenClaw Agent';
                const emoji = msg.role === 'user' ? '👤' : '🤖';
                md += `#### ${msg.role === 'user' ? 'Prompt' : 'Response'} - ${senderLabel} ${emoji}:\n\n`;
                md += `${msg.text}\n\n---\n\n`;
            });

            md += '###### Noosphere Reflect\n###### ***Meaning Through Memory***\n###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n';
            return Utils.normalizeMarkdown(md);
        },

        buildJSON() {
            const title = this.getExportTitle();
            const selected = STATE.messages.filter(m => STATE.selectedIds.has(m.id));
            const models = [...new Set(selected.map(m => m.metadata?.model).filter(Boolean))];
            
            return JSON.stringify({
                metadata: { title, exportedAt: new Date().toISOString(), sourceUrl: window.location.href, platform: 'OpenClaw', models },
                messages: selected.map(m => ({ role: m.role, content: m.text, metadata: m.metadata }))
            }, null, 2);
        },

        async executeCopy() {
            if (STATE.selectedIds.size === 0) return Utils.createNotification('⚠️ Select at least one message', false);
            try {
                const format = document.getElementById('ns-openclaw-format')?.value || 'markdown';
                await navigator.clipboard.writeText(format === 'json' ? this.buildJSON() : this.buildMarkdown());
                Utils.createNotification(`✅ Copied ${STATE.selectedIds.size} turns as ${format.toUpperCase()}!`);
            } catch (err) {
                console.error(err);
                Utils.createNotification('❌ Clipboard export failed', false);
            }
        },

        async executeDownload() {
            if (STATE.selectedIds.size === 0) return Utils.createNotification('⚠️ Select at least one message', false);
            try {
                const format = document.getElementById('ns-openclaw-format')?.value || 'markdown';
                const isJson = format === 'json';
                const content = isJson ? this.buildJSON() : this.buildMarkdown();
                const filename = `${Utils.sanitizeFilename(this.getExportTitle())}_OpenClaw_${Utils.getDateString()}.${isJson ? 'json' : 'md'}`;
                
                const blob = new Blob([content], { type: `${isJson ? 'application/json' : 'text/markdown'};charset=utf-8` });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename;
                document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                Utils.createNotification(`✅ Downloaded: ${filename}`);
            } catch (err) {
                console.error(err);
                Utils.createNotification('❌ Download failed', false);
            }
        }
    };

    // ============================================================
    // Theme Manager
    // ============================================================

    const ThemeManager = {
        detect() {
            // 1. Explicit data-theme / class / color-scheme on html or body
            const html = document.documentElement;
            const htmlTheme = html.getAttribute('data-theme') || html.getAttribute('data-mode') || html.getAttribute('color-scheme');
            if (htmlTheme === 'dark' || html.classList.contains('dark') || html.classList.contains('dark-theme')) return 'dark';
            if (htmlTheme === 'light' || html.classList.contains('light') || html.classList.contains('light-theme')) return 'light';

            if (document.body) {
                const bodyTheme = document.body.getAttribute('data-theme') || document.body.getAttribute('data-mode');
                if (bodyTheme === 'dark' || document.body.classList.contains('dark') || document.body.classList.contains('dark-theme')) return 'dark';
                if (bodyTheme === 'light' || document.body.classList.contains('light') || document.body.classList.contains('light-theme')) return 'light';
            }

            // 2. Sample computed background/text luminance of container elements
            const getBgLum = (el) => {
                if (!el) return null;
                const bg = window.getComputedStyle(el).backgroundColor;
                if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return null;
                const rgb = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (!rgb) return null;
                return (parseInt(rgb[1], 10) + parseInt(rgb[2], 10) + parseInt(rgb[3], 10)) / 3;
            };

            const getTextLum = (el) => {
                if (!el) return null;
                const color = window.getComputedStyle(el).color;
                if (!color) return null;
                const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (!rgb) return null;
                return (parseInt(rgb[1], 10) + parseInt(rgb[2], 10) + parseInt(rgb[3], 10)) / 3;
            };

            const sampleContainers = [
                document.querySelector('.chat-workspace-rail'),
                document.querySelector('.top-header-bar'),
                document.querySelector('.chat-container'),
                document.querySelector('main'),
                document.querySelector('#root'),
                document.querySelector('#app'),
                document.body
            ];

            for (const el of sampleContainers) {
                const bgLum = getBgLum(el);
                if (bgLum !== null) {
                    return bgLum < 128 ? 'dark' : 'light';
                }
                const textLum = getTextLum(el);
                if (textLum !== null) {
                    return textLum > 180 ? 'dark' : 'light';
                }
            }

            // 3. prefers-color-scheme fallback
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
            return 'light';
        },

        apply(themeName) {
            if (STATE.currentTheme === themeName) return;
            STATE.currentTheme = themeName;
            CONFIG.THEME = CONFIG.THEMES[themeName];

            const oldStyle = document.getElementById('ns-openclaw-styles');
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
                attributeFilter: ['data-theme', 'class', 'style', 'color-scheme']
            });

            if (document.body) {
                observer.observe(document.body, {
                    attributes: true,
                    attributeFilter: ['data-theme', 'class', 'style', 'color-scheme']
                });
            }
        }
    };

    function injectStyles() {
        if (document.getElementById('ns-openclaw-styles')) return;

        const T = CONFIG.THEME;
        const style = document.createElement('style');
        style.id = 'ns-openclaw-styles';
        style.textContent = `
            .ns-rail-trigger {
                color: ${T.BRAND_LOBSTER} !important;
                margin-top: 8px !important;
                cursor: pointer !important;
                opacity: 0.85 !important;
                transition: all 0.2s ease !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .ns-rail-trigger:hover {
                opacity: 1 !important;
                transform: scale(1.05) !important;
            }
            .ns-rail-trigger svg { 
                width: 24px !important; 
                height: 24px !important; 
                fill: none; 
                stroke: currentColor; 
                stroke-width: 2; 
            }
            .ns-expanded-trigger {
                color: ${T.BRAND_LOBSTER} !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                padding: 4px 6px !important;
            }
            .ns-expanded-trigger:hover {
                background: ${T.HOVER} !important;
            }
            .ns-expanded-trigger svg {
                width: 16px !important;
                height: 16px !important;
                fill: none;
                stroke: currentColor;
                stroke-width: 2;
            }
            
            #ns-overlay { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0,0,0,0.5) !important; backdrop-filter: blur(4px) !important; z-index: 100001 !important; display: none; opacity: 0; transition: opacity 0.25s ease !important; }
            #ns-overlay.active { display: block !important; opacity: 1 !important; }
            
            #ns-sidebar { position: fixed !important; top: 0 !important; right: -400px !important; width: 400px !important; height: 100% !important; background: ${T.SURFACE_SIDEBAR} !important; border-left: 1px solid ${T.BORDER} !important; color: ${T.TEXT_PRIMARY} !important; z-index: 100002 !important; transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; display: flex !important; flex-direction: column !important; box-shadow: -4px 0 24px rgba(0,0,0,0.15) !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; }
            #ns-sidebar.active { right: 0 !important; }
            
            .ns-header { padding: 20px 24px 16px !important; background: ${T.SURFACE_SIDEBAR} !important; border-bottom: 1px solid ${T.BORDER} !important; display: flex !important; flex-direction: column !important; gap: 12px !important; flex-shrink: 0 !important; }
            .ns-title { font-size: 20px !important; font-weight: 700 !important; letter-spacing: -0.3px !important; color: ${T.TEXT_PRIMARY} !important; margin: 0 !important; display: flex !important; align-items: center !important; gap: 8px !important; }
            .ns-title span { color: ${T.BRAND_LOBSTER} !important; }
            .ns-subtitle { font-size: 12px !important; color: ${T.TEXT_MUTED} !important; margin: 0 !important; }
            
            .ns-input-group { display: flex !important; flex-direction: column !important; gap: 6px !important; }
            .ns-label { font-size: 11px !important; font-weight: 700 !important; color: ${T.TEXT_MUTED} !important; text-transform: uppercase !important; letter-spacing: 0.8px !important; }
            .ns-input { width: 100% !important; background: ${T.SURFACE_INPUT} !important; border: 1px solid ${T.BORDER} !important; border-radius: 6px !important; padding: 8px 12px !important; color: ${T.TEXT_PRIMARY} !important; font-size: 13px !important; outline: none !important; box-sizing: border-box !important; transition: border-color 0.15s ease !important; }
            .ns-input:focus { border-color: ${T.BRAND_LOBSTER} !important; box-shadow: 0 0 0 3px rgba(224, 49, 49, 0.15) !important; }
            
            .ns-batch { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 6px !important; }
            .ns-batch-btn { padding: 6px !important; background: ${T.SURFACE_INPUT} !important; border: 1px solid ${T.BORDER} !important; border-radius: 6px !important; color: ${T.TEXT_MUTED} !important; font-size: 12px !important; font-weight: 600 !important; cursor: pointer !important; text-align: center !important; transition: all 0.15s ease !important; }
            .ns-batch-btn:hover { background: ${T.HOVER} !important; color: ${T.TEXT_PRIMARY} !important; border-color: ${T.BRAND_LOBSTER} !important; }
            
            .ns-msg-list { flex: 1 !important; overflow-y: auto !important; padding: 16px !important; display: flex !important; flex-direction: column !important; gap: 12px !important; background: ${T.CANVAS} !important; }
            .ns-msg-list::-webkit-scrollbar { width: 6px !important; }
            .ns-msg-list::-webkit-scrollbar-thumb { background: ${T.BORDER} !important; border-radius: 3px !important; }
            
            .ns-msg-card { background: ${T.SURFACE_CARD} !important; border: 1px solid ${T.BORDER} !important; border-radius: 12px !important; overflow: hidden !important; flex-shrink: 0 !important; transition: all 0.15s ease !important; }
            .ns-msg-card:hover { border-color: ${T.BRAND_LOBSTER} !important; box-shadow: 0 2px 8px rgba(224, 49, 49, 0.1) !important; }
            .ns-msg-item { display: flex !important; align-items: flex-start !important; padding: 12px 16px !important; gap: 12px !important; cursor: pointer !important; }
            
            .ns-check { appearance: none !important; -webkit-appearance: none !important; width: 16px !important; height: 16px !important; border: 2px solid ${T.BRAND_LOBSTER} !important; border-radius: 4px !important; cursor: pointer !important; background: ${T.SURFACE_CARD} !important; position: relative !important; flex-shrink: 0 !important; margin-top: 2px !important; transition: all 0.15s ease !important; }
            .ns-check:checked { background: ${T.BRAND_LOBSTER} !important; }
            .ns-check:checked::after { content: '✓' !important; position: absolute !important; color: white !important; font-size: 11px !important; font-weight: bold !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; }
            
            .ns-msg-content { flex: 1 !important; min-width: 0 !important; display: flex !important; flex-direction: column !important; gap: 4px !important; }
            .ns-role-badge { display: inline-flex !important; font-size: 10px !important; font-weight: 700 !important; padding: 2px 6px !important; border-radius: 4px !important; letter-spacing: 0.5px !important; font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
            .ns-role-user { background: ${T.USER_BUBBLE} !important; color: ${T.BRAND_LOBSTER} !important; border: 1px solid rgba(224,49,49,0.2) !important; }
            .ns-role-assistant { background: ${T.AGENT_BUBBLE} !important; color: ${T.TEXT_PRIMARY} !important; border: 1px solid ${T.BORDER} !important; }
            
            .ns-msg-preview { font-size: 13px !important; line-height: 1.45 !important; color: ${T.TEXT_MUTED} !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; word-break: break-word !important; }
            
            .ns-accordion { background: ${T.SURFACE_SIDEBAR} !important; border-top: 1px solid ${T.BORDER} !important; padding: 12px 16px !important; font-size: 13px !important; color: ${T.TEXT_PRIMARY} !important; white-space: pre-wrap !important; max-height: 250px !important; overflow-y: auto !important; line-height: 1.5 !important; }
            
            .ns-footer { padding: 16px 20px !important; background: ${T.SURFACE_SIDEBAR} !important; border-top: 1px solid ${T.BORDER} !important; display: flex !important; align-items: center !important; gap: 8px !important; flex-shrink: 0 !important; }
            .ns-btn { border: 1px solid ${T.BORDER} !important; border-radius: 6px !important; padding: 8px 14px !important; background: ${T.SURFACE_INPUT} !important; color: ${T.TEXT_PRIMARY} !important; cursor: pointer !important; font-size: 13px !important; font-weight: 500 !important; text-align: center !important; transition: all 0.15s ease !important; white-space: nowrap !important; }
            .ns-btn:hover { background: ${T.HOVER} !important; border-color: ${T.BRAND_LOBSTER} !important; }
            .ns-btn-cancel { background: rgba(224, 49, 49, 0.1) !important; border-color: rgba(224, 49, 49, 0.3) !important; color: ${T.BRAND_LOBSTER} !important; flex: 0.8 !important; }
            .ns-btn-cancel:hover { background: rgba(224, 49, 49, 0.2) !important; }
            .ns-format-select { flex: 1.2 !important; background: ${T.SURFACE_INPUT} !important; border: 1px solid ${T.BORDER} !important; border-radius: 6px !important; color: ${T.TEXT_PRIMARY} !important; padding: 8px !important; outline: none !important; font-size: 12px !important; cursor: pointer !important; text-align: center !important; }
            .ns-btn-copy { flex: 1 !important; background: ${T.BRAND_LOBSTER} !important; color: white !important; border: none !important; }
            .ns-btn-copy:hover { background: ${T.BRAND_LOBSTER_HOVER} !important; border-color: transparent !important; color: white !important; }
        `;
        document.head.appendChild(style);
    }

    // ============================================================
    // UI Construction
    // ============================================================

    function injectHeaderTrigger() {
        const rail = document.querySelector('.chat-workspace-rail');
        if (!rail) return;

        const isCollapsed = rail.classList.contains('chat-workspace-rail--collapsed');

        if (isCollapsed) {
            document.getElementById('ns-expanded-btn')?.remove();

            if (!document.getElementById('ns-rail-btn')) {
                const triggerBtn = document.createElement('span');
                triggerBtn.id = 'ns-rail-btn';
                triggerBtn.className = 'chat-workspace-rail__collapsed-icon ns-rail-trigger';
                triggerBtn.setAttribute('title', 'Export Session');
                triggerBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
                triggerBtn.onclick = (e) => { e.stopPropagation(); openSidebar(); };
                rail.appendChild(triggerBtn);
            }
        } else {
            document.getElementById('ns-rail-btn')?.remove();

            if (!document.getElementById('ns-expanded-btn')) {
                const actionsGroup = rail.querySelector('.chat-workspace-rail__actions');
                if (actionsGroup) {
                    const refreshBtn = actionsGroup.querySelector('.chat-workspace-rail__refresh');
                    const triggerBtn = document.createElement('button');
                    triggerBtn.id = 'ns-expanded-btn';
                    triggerBtn.className = 'btn btn--ghost btn--sm ns-expanded-trigger';
                    triggerBtn.type = 'button';
                    triggerBtn.setAttribute('title', 'Export Session');
                    triggerBtn.setAttribute('aria-label', 'Export Session');
                    triggerBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
                    triggerBtn.onclick = (e) => { e.stopPropagation(); openSidebar(); };

                    if (refreshBtn) {
                        actionsGroup.insertBefore(triggerBtn, refreshBtn);
                    } else {
                        actionsGroup.prepend(triggerBtn);
                    }
                }
            }
        }
    }

    function renderMessageList() {
        const listContainer = document.getElementById('ns-msg-list');
        if (!listContainer) return;
        while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild);

        if (STATE.messages.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'padding:20px; text-align:center; color:#868e96; font-size:13px;';
            emptyMsg.textContent = 'No messages found in this conversation.';
            listContainer.appendChild(emptyMsg);
            return;
        }

        STATE.messages.forEach(msg => {
            const card = document.createElement('div');
            card.className = 'ns-msg-card';

            const item = document.createElement('div');
            item.className = 'ns-msg-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'ns-check';
            checkbox.checked = STATE.selectedIds.has(msg.id);

            const content = document.createElement('div');
            content.className = 'ns-msg-content';

            const badge = document.createElement('span');
            badge.className = `ns-role-badge ns-role-${msg.role}`;
            badge.textContent = msg.role === 'user' ? 'USER' : 'AGENT';

            const preview = document.createElement('div');
            preview.className = 'ns-msg-preview';
            preview.textContent = msg.preview || 'No content';

            content.appendChild(badge);
            content.appendChild(preview);
            item.appendChild(checkbox);
            item.appendChild(content);
            card.appendChild(item);

            if (STATE.expandedId === msg.id) {
                const accordion = document.createElement('div');
                accordion.className = 'ns-accordion';
                accordion.textContent = msg.text;
                card.appendChild(accordion);
            }

            checkbox.onclick = (e) => {
                e.stopPropagation();
                if (STATE.selectedIds.has(msg.id)) { STATE.selectedIds.delete(msg.id); checkbox.checked = false; }
                else { STATE.selectedIds.add(msg.id); checkbox.checked = true; }
            };

            item.onclick = (e) => {
                e.stopPropagation();
                STATE.expandedId = STATE.expandedId === msg.id ? null : msg.id;
                renderMessageList();
            };

            listContainer.appendChild(card);
        });
    }

    function openSidebar() {
        scanConversation();
        renderMessageList();
        document.getElementById('ns-overlay').classList.add('active');
        document.getElementById('ns-sidebar').classList.add('active');
        STATE.sidebarOpen = true;
    }

    function closeSidebar() {
        document.getElementById('ns-overlay').classList.remove('active');
        document.getElementById('ns-sidebar').classList.remove('active');
        STATE.sidebarOpen = false;
    }

    function createSidebarUI() {
        if (document.getElementById('ns-sidebar')) return;

        const overlay = document.createElement('div'); overlay.id = 'ns-overlay';
        const sidebar = document.createElement('div'); sidebar.id = 'ns-sidebar';

        const header = document.createElement('div'); header.className = 'ns-header';
        header.innerHTML = `
            <h2 class="ns-title"><span>●</span> OpenClaw Exporter</h2>
            <p class="ns-subtitle">Noosphere Reflect Telemetry Export</p>
            <div class="ns-input-group">
                <span class="ns-label">Session Name</span>
                <input type="text" id="ns-openclaw-title" class="ns-input" placeholder="e.g. Agent Analysis 01">
            </div>
            <div class="ns-batch">
                <button class="ns-batch-btn" id="ns-batch-all">All</button>
                <button class="ns-batch-btn" id="ns-batch-user">User</button>
                <button class="ns-batch-btn" id="ns-batch-ai">Agent</button>
                <button class="ns-batch-btn" id="ns-batch-none">None</button>
            </div>
        `;

        const msgList = document.createElement('div'); msgList.className = 'ns-msg-list'; msgList.id = 'ns-msg-list';

        const footer = document.createElement('div'); footer.className = 'ns-footer';
        footer.innerHTML = `
            <button class="ns-btn ns-btn-cancel" id="ns-cancel">Cancel</button>
            <select class="ns-format-select" id="ns-openclaw-format">
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
            </select>
            <button class="ns-btn ns-btn-copy" id="ns-copy">Copy</button>
        `;

        sidebar.appendChild(header); sidebar.appendChild(msgList); sidebar.appendChild(footer);
        document.body.appendChild(overlay); document.body.appendChild(sidebar);

        overlay.onclick = closeSidebar;
        document.getElementById('ns-cancel').onclick = closeSidebar;
        document.getElementById('ns-copy').onclick = () => ExportService.executeCopy();

        const setBatch = (type) => {
            STATE.selectedIds.clear();
            if (type === 'all') STATE.messages.forEach(m => STATE.selectedIds.add(m.id));
            if (type === 'user') STATE.messages.filter(m => m.role === 'user').forEach(m => STATE.selectedIds.add(m.id));
            if (type === 'ai') STATE.messages.filter(m => m.role === 'assistant').forEach(m => STATE.selectedIds.add(m.id));
            renderMessageList();
        };

        document.getElementById('ns-batch-all').onclick = () => setBatch('all');
        document.getElementById('ns-batch-user').onclick = () => setBatch('user');
        document.getElementById('ns-batch-ai').onclick = () => setBatch('ai');
        document.getElementById('ns-batch-none').onclick = () => setBatch('none');
    }

    function setupObserver() {
        const observer = new MutationObserver(() => {
            injectHeaderTrigger();
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-expanded'] });
    }

    function init() {
        console.log('[Noosphere] OpenClaw Chat Exporter Initialized');
        ThemeManager.init();
        createSidebarUI();
        injectHeaderTrigger();
        setupObserver();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
