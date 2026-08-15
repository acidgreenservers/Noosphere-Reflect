(function () {
    'use strict';

    /*
     * ============================================================
     * Noosphere Reflect — Claude Chat Exporter
     * ============================================================
     *
     * Native Menu Injection & Markdown Synthesizer for Claude
     * (claude.ai).
     *
     * Features:
     *   - Integrated '+' Menu Trigger: Adds "Export Chat" option 
     *     with matching icon above "Add files or photos"
     *   - Automated Thinking Expansion: Pre-expands all thinking 
     *     blocks to ensure 100% of reasoning process is archived
     *   - Recursive DOM-to-Markdown parser preserving full formatting
     *     (Headings, bold/italic, lists, pipe tables, code blocks)
     *   - Interactive turn accordion drawer with batch selection controls
     *   - Claude warm-canvas editorial theme (cream + coral)
     *   - Noosphere Reflect frontmatter metadata & signature footer
     *
     * Namespace: ns-claude
     * ============================================================
     */

    const CONFIG = {
        SELECTORS: {
            // Message Containers
            USER_MESSAGE: '[data-testid="user-message"]',
            USER_MESSAGE_TEXT: 'p.whitespace-pre-wrap',
            
            // Assistant Message Containers
            ASSISTANT_ROW: '.group\\/message-row',
            ASSISTANT_CONTENT: '.font-claude-response',
            ASSISTANT_MARKDOWN: '.standard-markdown',
            ASSISTANT_PARAGRAPH: 'p.font-claude-response-body',
            ASSISTANT_TIMESTAMP: 'time[datetime]',
            MESSAGE_ACTIONS: '[data-cds="MessageActions"]',
            
            // Thinking Block Containers
            THINKING_CONTAINER: '.row-start-1.col-start-1',
            THINKING_BUTTON: 'button[aria-expanded]',
            THINKING_SUMMARY: 'span.truncate.font-base',
            THINKING_PANEL: '[data-cds="Collapsible"]',
            THINKING_STEPS: '[data-timeline-text]',
            THINKING_CONTENT: '.standard-markdown',
            
            // Menu Injection
            PLUS_MENU: '[data-cds="Menu"]',
            PLUS_MENU_FIRST_ITEM: '[role="menuitem"]',
            
            // Conversation Title
            CONVERSATION_TITLE: 'header h1, title',
            
            // UI Chrome to Strip
            NOISE_ELEMENTS: '[data-cds="MessageActions"], [data-cds="Icon"], svg, .sr-only'
        },

        // Claude Design Tokens (from DESIGN.md)
        THEME: {
            CANVAS: '#faf9f5',
            SURFACE_SOFT: '#f5f0e8',
            SURFACE_CARD: '#efe9de',
            SURFACE_DARK: '#181715',
            SURFACE_DARK_ELEVATED: '#252320',
            SURFACE_DARK_SOFT: '#1f1d1a',
            HAIRLINE: '#e6dfd8',
            PRIMARY_CORAL: '#cc785c',
            PRIMARY_CORAL_ACTIVE: '#a9583e',
            PRIMARY_CORAL_DISABLED: '#e6dfd8',
            INK: '#141413',
            BODY: '#3d3d3a',
            BODY_STRONG: '#252523',
            MUTED: '#6c6a64',
            MUTED_SOFT: 'A#8e8b82',
            ON_PRIMARY: '#ffffff',
            ON_DARK: '#faf9f5',
            ON_DARK_SOFT: '#a09d96',
            ACCENT_TEAL: '#5db8a6',
            SUCCESS: '#5db872',
            ERROR: '#c64545'
        }
    };

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
                background: success ? CONFIG.THEME.PRIMARY_CORAL : CONFIG.THEME.ERROR,
                color: CONFIG.THEME.ON_PRIMARY,
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '200000',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'StyreneB, Inter, system-ui, -apple-system, sans-serif',
                boxShadow: '0 4px 12px rgba(20, 20, 19, 0.15)',
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
            return (text || 'Claude_Chat')
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
                clone.querySelectorAll('button, svg, .copy-button, [data-cds]').forEach(n => n.remove());
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
    // Auto-Expand Thinking Blocks
    // ============================================================

    async function autoExpandThinkingBlocks() {
        const thinkingButtons = document.querySelectorAll(
            `${CONFIG.SELECTORS.THINKING_CONTAINER} ${CONFIG.SELECTORS.THINKING_BUTTON}`
        );
        
        let expanded = 0;
        
        thinkingButtons.forEach(btn => {
            if (btn.getAttribute('aria-expanded') === 'false') {
                btn.click();
                expanded++;
            }
        });
        
        if (expanded > 0) {
            // Wait for content to render
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        return expanded;
    }

    // ============================================================
    // Claude DOM Extractors
    // ============================================================

    function extractUserMessage(container) {
        const textEl = container.querySelector(CONFIG.SELECTORS.USER_MESSAGE_TEXT) || container;
        return Utils.cleanText(textEl.innerText || '');
    }

    function extractAssistantMessage(container) {
        const contentEl = container.querySelector(CONFIG.SELECTORS.ASSISTANT_CONTENT);
        
        // Get timestamp if available
        const timeEl = container.querySelector(CONFIG.SELECTORS.ASSISTANT_TIMESTAMP);
        const timestamp = timeEl?.getAttribute('datetime') || '';
        
        if (!contentEl) {
            return { content: '', timestamp };
        }
        
        // Extract main content
        const markdownEl = contentEl.querySelector(CONFIG.SELECTORS.ASSISTANT_MARKDOWN) || contentEl;
        const content = htmlToMarkdown(markdownEl);
        
        return { content, timestamp };
    }

    function extractThinkingBlock(container) {
        // Get summary
        const summaryEl = container.querySelector(CONFIG.SELECTORS.THINKING_SUMMARY);
        const summary = summaryEl ? Utils.cleanText(summaryEl.innerText) : '';
        
        // Get full thinking content
        const panel = container.querySelector(CONFIG.SELECTORS.THINKING_PANEL);
        if (!panel) return { summary, content: '' };
        
        // Extract all thinking steps
        const steps = panel.querySelectorAll(CONFIG.SELECTORS.THINKING_STEPS);
        let fullContent = '';
        
        steps.forEach(step => {
            const markdownEl = step.querySelector(CONFIG.SELECTORS.THINKING_CONTENT);
            if (markdownEl) {
                const stepText = htmlToMarkdown(markdownEl);
                if (stepText && stepText !== 'Done') {
                    fullContent += stepText + '\n\n';
                }
            }
        });
        
        return { summary, content: fullContent.trim() };
    }

    function scanConversation() {
        STATE.messages = [];
        
        // Find all message elements
        const userMessages = Array.from(document.querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE));
        const assistantRows = Array.from(document.querySelectorAll(CONFIG.SELECTORS.ASSISTANT_ROW));
        const thinkingBlocks = Array.from(document.querySelectorAll(CONFIG.SELECTORS.THINKING_CONTAINER));
        
        // Build ordered list of all elements with their positions
        const allElements = [];
        
        userMessages.forEach(el => {
            const text = extractUserMessage(el);
            if (text) {
                allElements.push({
                    type: 'user',
                    el,
                    order: el.getBoundingClientRect().top,
                    text,
                    preview: text.substring(0, 75) + (text.length > 75 ? '...' : '')
                });
            }
        });
        
        assistantRows.forEach(el => {
            const { content, timestamp } = extractAssistantMessage(el);
            // Only add if there's actual content
            if (content && content.trim().length > 0) {
                allElements.push({
                    type: 'assistant',
                    el,
                    order: el.getBoundingClientRect().top,
                    text: content,
                    timestamp,
                    preview: content.substring(0, 75).replace(/\n/g, ' ') + (content.length > 75 ? '...' : ''),
                    thinking: null
                });
            }
        });
        
        // Sort by vertical position
        allElements.sort((a, b) => a.order - b.order);
        
        // Associate thinking blocks with nearest preceding assistant message
        thinkingBlocks.forEach(thinkingEl => {
            const thinkingData = extractThinkingBlock(thinkingEl);
            if (!thinkingData.content) return;
            
            const thinkingRect = thinkingEl.getBoundingClientRect();
            let closestAssistant = null;
            let minDistance = Infinity;
            
            allElements.forEach(msg => {
                if (msg.type === 'assistant') {
                    const distance = Math.abs(msg.el.getBoundingClientRect().top - thinkingRect.top);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestAssistant = msg;
                    }
                }
            });
            
            if (closestAssistant) {
                closestAssistant.thinking = thinkingData;
            }
        });
        
        // Assign IDs and add to state
        allElements.forEach((item, idx) => {
            STATE.messages.push({
                id: idx,
                role: item.type,
                text: item.text,
                thinking: item.thinking || null,
                timestamp: item.timestamp || '',
                preview: item.preview
            });
        });
        
        // Select all by default
        if (STATE.selectedIds.size === 0) {
            STATE.messages.forEach(m => STATE.selectedIds.add(m.id));
        }
    }

    // ============================================================
    // Export Service & Document Synthesis
    // ============================================================

    const ExportService = {
        getExportTitle() {
            const manualTitle = document.getElementById('ns-claude-title')?.value?.trim();
            if (manualTitle) return manualTitle;

            const titleEl = document.querySelector(CONFIG.SELECTORS.CONVERSATION_TITLE);
            if (titleEl && titleEl.innerText) {
                return Utils.cleanText(titleEl.innerText).substring(0, 50);
            }

            const firstUserMsg = STATE.messages.find(m => m.role === 'user');
            if (firstUserMsg && firstUserMsg.text) {
                return Utils.cleanText(firstUserMsg.text).substring(0, 50);
            }

            return document.title || 'Claude_Chat';
        },

        buildMarkdown() {
            const title = this.getExportTitle();
            const sourceUrl = window.location.href;
            const exportedAt = new Date().toLocaleString();

            const selected = STATE.messages.filter(m => STATE.selectedIds.has(m.id));
            const userCount = selected.filter(m => m.role === 'user').length;
            const aiCount = selected.filter(m => m.role === 'assistant').length;

            let md = '';
            
            // Frontmatter
            md += '---\n';
            md += `> **📝 Title:** ${title}\n>\n`;
            md += '> **🤖 Model:** Claude\n>\n';
            md += `> **🌐 Exported:** ${exportedAt}\n>\n`;
            md += `> **🌐 Source:** [Claude](${sourceUrl})\n>\n`;
            md += '> **🏷️ Tags:** Claude, AI-Chat, Noosphere, Anthropic\n>\n';
            md += `> **📊 Metadata:** ${selected.length} Selected Messages | ${userCount} User | ${aiCount} Claude\n`;
            md += '---\n\n';

            md += `# ${title}\n\n`;
            md += '---\n\n';

            selected.forEach(msg => {
                if (msg.role === 'user') {
                    md += `#### Prompt - User 👤:\n\n${msg.text}\n\n---\n\n`;
                } else if (msg.role === 'assistant') {
                    md += `#### Response - Claude 🧠:\n\n`;

                    // Include thinking if captured
                    if (msg.thinking && msg.thinking.content) {
                        md += `<details>\n<summary><b>🧠 Thinking: ${msg.thinking.summary || 'Claude\'s reasoning'}</b></summary>\n\n`;
                        md += msg.thinking.content.replace(/\n/g, '\n> ');
                        md += '\n\n</details>\n\n';
                    }

                    md += `${msg.text}\n\n---\n\n`;
                }
            });

            // Footer
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
                    model: 'Claude'
                },
                messages: selected.map(m => ({
                    role: m.role,
                    thinking: m.thinking || null,
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
                const format = document.getElementById('ns-claude-format')?.value || 'markdown';
                const content = format === 'json' ? this.buildJSON() : this.buildMarkdown();
                await navigator.clipboard.writeText(content);
                Utils.createNotification(`✅ Copied ${STATE.selectedIds.size} turns as ${format.toUpperCase()}!`);
            } catch (err) {
                console.error('[Noosphere Claude]', err);
                Utils.createNotification('❌ Clipboard export failed', false);
            }
        },

        async executeDownload() {
            if (STATE.selectedIds.size === 0) {
                Utils.createNotification('⚠️ Select at least one message', false);
                return;
            }

            try {
                const format = document.getElementById('ns-claude-format')?.value || 'markdown';
                const isJson = format === 'json';
                const content = isJson ? this.buildJSON() : this.buildMarkdown();
                const title = this.getExportTitle();
                const ext = isJson ? 'json' : 'md';
                const mime = isJson ? 'application/json' : 'text/markdown';
                const filename = `${Utils.sanitizeFilename(title)}_Claude_${Utils.getDateString()}.${ext}`;

                const blob = new Blob([content], { type: `${mime};charset=utf-8` });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');

                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);

                Utils.createNotification(`✅ Downloaded: ${filename}`);
            } catch (err) {
                console.error('[Noosphere Claude]', err);
                Utils.createNotification('❌ Download failed', false);
            }
        }
    };

    // ============================================================
    // UI Construction (Claude Warm Canvas Theme)
    // ============================================================

    // ============================================================
    // Theme Manager — Auto-detect & live-switch light / dark
    // ============================================================

    const ThemeManager = {
        detect() {
            // 1. Appearance radiogroup (most reliable when settings panel is open)
            const radioGroup = document.querySelector('[data-cds="SegmentedControl"][aria-label="Appearance"]');
            if (radioGroup) {
                const checkedRadio = radioGroup.querySelector('input[type="radio"]:checked');
                if (checkedRadio) {
                    const val = checkedRadio.value;
                    if (val === 'dark') return 'dark';
                    if (val === 'light') return 'light';
                    // 'auto' — fall through to UI background check
                }
                // Fallback: visual span elements
                const checkedSpan = radioGroup.querySelector('span[role="radio"][aria-checked="true"]');
                if (checkedSpan) {
                    const label = checkedSpan.getAttribute('aria-label');
                    if (label === 'Dark') return 'dark';
                    if (label === 'Light') return 'light';
                }
            }

            // 2. Claude UI text-color check — more reliable than background in SPAs
            //    because body/main may be dark in both modes (dark canvas with light bubbles)
            const getTextColorLuminance = (el) => {
                if (!el) return null;
                const color = window.getComputedStyle(el).color;
                if (!color) return null;
                const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (!rgb) return null;
                const avg = (parseInt(rgb[1], 10) + parseInt(rgb[2], 10) + parseInt(rgb[3], 10)) / 3;
                return avg;
            };

            // Check user message text color
            const userMsgText = document.querySelector('[data-testid="user-message"] p, [data-testid="user-message"]');
            const textLum = getTextColorLuminance(userMsgText);
            if (textLum !== null) {
                // Light text (avg > 200) → dark mode. Dark text (avg < 100) → light mode.
                return textLum > 200 ? 'dark' : 'light';
            }

            // 3. Claude UI background luminance — sample actual chat message backgrounds
            const luminanceFromEl = (el) => {
                if (!el) return null;
                const bg = window.getComputedStyle(el).backgroundColor;
                if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return null;
                const rgb = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (!rgb) return null;
                const avg = (parseInt(rgb[1], 10) + parseInt(rgb[2], 10) + parseInt(rgb[3], 10)) / 3;
                return avg;
            };

            // Try user message bubble background
            const userMsg = document.querySelector('[data-testid="user-message"]');
            const userLum = luminanceFromEl(userMsg);
            if (userLum !== null) {
                return userLum < 128 ? 'dark' : 'light';
            }

            // Try assistant message row background
            const assistantRow = document.querySelector('.group\\/message-row');
            const assistantLum = luminanceFromEl(assistantRow);
            if (assistantLum !== null) {
                return assistantLum < 128 ? 'dark' : 'light';
            }

            // Try common app root containers
            const appContainers = [
                document.getElementById('root'),
                document.getElementById('__next'),
                document.getElementById('app'),
                document.querySelector('.h-full.w-full'),
                document.querySelector('[data-testid="chat-container"]'),
                document.querySelector('main'),
                document.body
            ];
            for (const container of appContainers) {
                const lum = luminanceFromEl(container);
                if (lum !== null) {
                    return lum < 128 ? 'dark' : 'light';
                }
            }

            // 4. data-theme / class on html/body
            const html = document.documentElement;
            if (html.classList.contains('dark')) return 'dark';
            if (html.classList.contains('light')) return 'light';
            if (html.getAttribute('data-theme') === 'dark') return 'dark';
            if (html.getAttribute('data-theme') === 'light') return 'light';

            if (document.body) {
                if (document.body.classList.contains('dark')) return 'dark';
                if (document.body.classList.contains('light')) return 'light';
                if (document.body.getAttribute('data-theme') === 'dark') return 'dark';
                if (document.body.getAttribute('data-theme') === 'light') return 'light';
            }

            // 5. prefers-color-scheme (absolute last resort)
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
            return 'light';
        },

        apply(themeName) {
            if (STATE.currentTheme === themeName) return;
            STATE.currentTheme = themeName;

            // Remove old stylesheet and re-inject with new palette
            const oldStyle = document.getElementById('noosphere-claude-styles');
            if (oldStyle) oldStyle.remove();
            injectStyles();

            // Re-render message cards so inline styles pick up new palette
            renderMessageList();
        },

        init() {
            const initial = this.detect();
            console.log('[Noosphere Claude] Initial theme detected:', initial);
            this.apply(initial);

            // Poll every 500ms — lightweight and catches theme changes without
            // needing to observe the entire dynamic chat DOM
            this._pollInterval = setInterval(() => {
                const detected = this.detect();
                if (detected !== STATE.currentTheme) {
                    console.log('[Noosphere Claude] Theme changed:', detected);
                    this.apply(detected);
                }
            }, 500);

            // Also watch html element for explicit data-theme/class changes
            const observer = new MutationObserver(() => {
                const detected = this.detect();
                if (detected !== STATE.currentTheme) {
                    console.log('[Noosphere Claude] Theme changed via observer:', detected);
                    this.apply(detected);
                }
            });
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme', 'class']
            });
        }
    };

    function getThemeColors() {
        const isDark = STATE.currentTheme === 'dark';
        return {
            bg: isDark ? CONFIG.THEME.SURFACE_DARK : CONFIG.THEME.CANVAS,
            bgElevated: isDark ? CONFIG.THEME.SURFACE_DARK_ELEVATED : CONFIG.THEME.SURFACE_CARD,
            bgSoft: isDark ? CONFIG.THEME.SURFACE_DARK_SOFT : CONFIG.THEME.SURFACE_SOFT,
            text: isDark ? CONFIG.THEME.ON_DARK : CONFIG.THEME.INK,
            textMuted: isDark ? CONFIG.THEME.ON_DARK_SOFT : CONFIG.THEME.MUTED,
            border: isDark ? '#323238' : CONFIG.THEME.HAIRLINE,
            inputBg: isDark ? CONFIG.THEME.SURFACE_DARK_ELEVATED : CONFIG.THEME.CANVAS,
            cardBg: isDark ? CONFIG.THEME.SURFACE_DARK_ELEVATED : CONFIG.THEME.CANVAS,
            cardHover: isDark ? '#2c2c32' : CONFIG.THEME.SURFACE_CARD
        };
    }

    function injectStyles() {
        if (document.getElementById('noosphere-claude-styles')) return;

        const t = getThemeColors();
        const style = document.createElement('style');
        style.id = 'noosphere-claude-styles';
        style.textContent = `
            /* Export Chat Menu Item */
            .ns-claude-menu-item {
                display: flex !important;
                align-items: center !important;
                width: 100% !important;
                gap: 8px !important;
                padding: 8px 10px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-family: StyreneB, Inter, system-ui, sans-serif !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                transition: background-color 0.15s ease !important;
            }
            .ns-claude-menu-item:hover,
            .ns-claude-menu-item[data-highlighted] {
                background: ${t.bg === CONFIG.THEME.SURFACE_DARK ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'} !important;
            }
            .ns-claude-menu-separator {
                height: 1px !important;
                background: ${t.border} !important;
                margin: 4px 8px !important;
            }

            /* Sidebar Overlay */
            #ns-claude-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 100001;
                display: none;
                opacity: 0;
                transition: opacity 0.25s ease;
            }
            #ns-claude-overlay.active { display: block; opacity: 1; }

            /* Slide-over Sidebar */
            #ns-claude-sidebar {
                position: fixed;
                top: 0; right: -400px;
                width: 400px;
                height: 100%;
                background: ${t.bg};
                border-left: 1px solid ${t.border};
                color: ${t.text};
                z-index: 100002;
                transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                flex-direction: column;
                box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
                font-family: StyreneB, Inter, system-ui, -apple-system, sans-serif;
            }
            #ns-claude-sidebar.active { right: 0; }

            /* Sidebar Header */
            .ns-claude-header {
                padding: 20px 24px 16px;
                background: ${t.bg};
                border-bottom: 1px solid ${t.border};
                display: flex;
                flex-direction: column;
                gap: 12px;
                flex-shrink: 0;
            }
            .ns-claude-title {
                font-family: Copernicus, Tiempos Headline, serif !important;
                font-size: 24px !important;
                font-weight: 400 !important;
                letter-spacing: -0.5px !important;
                color: ${t.text} !important;
                margin: 0 !important;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .ns-claude-subtitle {
                font-size: 13px !important;
                color: ${t.textMuted} !important;
                margin: 0 !important;
            }

            /* Input Group */
            .ns-claude-input-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .ns-claude-label {
                font-size: 11px !important;
                font-weight: 600 !important;
                color: ${t.textMuted} !important;
                text-transform: uppercase !important;
                letter-spacing: 1px !important;
            }
            .ns-claude-input {
                width: 100%;
                background: ${t.inputBg} !important;
                border: 1px solid ${t.border} !important;
                border-radius: 8px !important;
                padding: 10px 14px !important;
                color: ${t.text} !important;
                font-size: 14px !important;
                font-family: StyreneB, Inter, system-ui, sans-serif !important;
                outline: none !important;
                box-sizing: border-box !important;
                transition: border-color 0.15s ease !important;
            }
            .ns-claude-input:focus {
                border-color: ${CONFIG.THEME.PRIMARY_CORAL} !important;
                box-shadow: 0 0 0 3px rgba(204, 120, 92, 0.15) !important;
            }

            /* Batch Controls */
            .ns-claude-batch {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 6px;
            }
            .ns-claude-batch-btn {
                padding: 8px !important;
                background: ${t.inputBg} !important;
                border: 1px solid ${t.border} !important;
                border-radius: 8px !important;
                color: ${t.textMuted} !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                text-align: center !important;
                transition: all 0.15s ease !important;
                font-family: StyreneB, Inter, system-ui, sans-serif !important;
            }
            .ns-claude-batch-btn:hover {
                background: ${t.cardHover} !important;
                color: ${t.text} !important;
                border-color: ${CONFIG.THEME.PRIMARY_CORAL} !important;
            }

            /* Message List */
            .ns-claude-msg-list {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .ns-claude-msg-list::-webkit-scrollbar {
                width: 6px;
            }
            .ns-claude-msg-list::-webkit-scrollbar-track {
                background: transparent;
            }
            .ns-claude-msg-list::-webkit-scrollbar-thumb {
                background: ${t.border};
                border-radius: 3px;
            }

            /* Message Card */
            .ns-claude-msg-card {
                background: ${t.cardBg} !important;
                border: 1px solid ${t.border} !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                flex-shrink: 0 !important;
                transition: all 0.15s ease !important;
            }
            .ns-claude-msg-card:hover {
                border-color: ${CONFIG.THEME.PRIMARY_CORAL} !important;
                box-shadow: 0 2px 8px rgba(204, 120, 92, 0.15) !important;
            }
            .ns-claude-msg-item {
                display: flex !important;
                align-items: flex-start !important;
                padding: 12px 14px !important;
                gap: 12px !important;
                cursor: pointer !important;
            }

            /* Checkbox */
            .ns-claude-check {
                appearance: none !important;
                -webkit-appearance: none !important;
                width: 18px !important;
                height: 18px !important;
                border: 2px solid ${CONFIG.THEME.PRIMARY_CORAL} !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                background: ${t.cardBg} !important;
                position: relative !important;
                flex-shrink: 0 !important;
                margin-top: 2px !important;
                transition: all 0.15s ease !important;
            }
            .ns-claude-check:checked {
                background: ${CONFIG.THEME.PRIMARY_CORAL} !important;
            }
            .ns-claude-check:checked::after {
                content: '✓' !important;
                position: absolute !important;
                color: ${CONFIG.THEME.ON_PRIMARY} !important;
                font-size: 12px !important;
                font-weight: bold !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
            }

            /* Message Content */
            .ns-claude-msg-content {
                flex: 1 !important;
                min-width: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
            }
            .ns-claude-role-badge {
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
                font-size: 10px !important;
                font-weight: 700 !important;
                text-transform: uppercase !important;
                padding: 3px 8px !important;
                border-radius: 9999px !important;
                letter-spacing: 0.5px !important;
            }
            .ns-claude-role-user {
                background: ${t.bg === CONFIG.THEME.SURFACE_DARK ? 'rgba(255,255,255,0.1)' : CONFIG.THEME.SURFACE_CARD} !important;
                color: ${t.text} !important;
            }
            .ns-claude-role-assistant {
                background: rgba(204, 120, 92, 0.2) !important;
                color: ${CONFIG.THEME.PRIMARY_CORAL} !important;
            }
            .ns-claude-thinking-badge {
                font-size: 10px !important;
                color: ${CONFIG.THEME.ACCENT_TEAL} !important;
                margin-left: 6px !important;
            }
            .ns-claude-msg-preview {
                font-size: 13px !important;
                line-height: 1.5 !important;
                color: ${t.textMuted} !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                word-break: break-word !important;
            }

            /* Accordion */
            .ns-claude-accordion {
                background: ${t.bgSoft} !important;
                border-top: 1px solid ${t.border} !important;
                padding: 12px 14px 14px 44px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                font-size: 13px !important;
            }
            .ns-claude-accordion-thinking {
                color: ${t.textMuted} !important;
                font-style: italic !important;
                max-height: 120px !important;
                overflow-y: auto !important;
                line-height: 1.5 !important;
            }
            .ns-claude-accordion-content {
                color: ${t.textMuted} !important;
                white-space: pre-wrap !important;
                max-height: 200px !important;
                overflow-y: auto !important;
                line-height: 1.5 !important;
            }

            /* Sidebar Footer */
            .ns-claude-footer {
                padding: 16px 20px;
                background: ${t.bg};
                border-top: 1px solid ${t.border};
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }
            .ns-claude-btn {
                border: 1px solid ${t.border};
                border-radius: 8px;
                padding: 10px 14px;
                background: ${t.inputBg};
                color: ${t.text};
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                text-align: center;
                transition: all 0.15s ease;
                white-space: nowrap;
                font-family: StyreneB, Inter, system-ui, sans-serif;
            }
            .ns-claude-btn:hover {
                background: ${t.cardHover};
                border-color: ${CONFIG.THEME.PRIMARY_CORAL};
            }
            .ns-claude-btn-cancel {
                background: rgba(198, 69, 69, 0.15);
                border-color: rgba(198, 69, 69, 0.4);
                color: ${CONFIG.THEME.ERROR};
                flex: 0.8;
            }
            .ns-claude-btn-cancel:hover {
                background: rgba(198, 69, 69, 0.25);
            }
            .ns-claude-format-select {
                flex: 1.2;
                background: ${t.inputBg};
                border: 1px solid ${t.border};
                border-radius: 8px;
                color: ${t.text};
                padding: 10px 8px;
                outline: none;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                text-align: center;
                font-family: StyreneB, Inter, system-ui, sans-serif;
            }
            .ns-claude-format-select option {
                background: ${t.bg};
                color: ${t.text};
            }
            .ns-claude-btn-copy { flex: 1; }
            .ns-claude-btn-primary {
                flex: 1;
                background: ${CONFIG.THEME.PRIMARY_CORAL};
                border-color: ${CONFIG.THEME.PRIMARY_CORAL};
                color: ${CONFIG.THEME.ON_PRIMARY};
            }
            .ns-claude-btn-primary:hover {
                background: ${CONFIG.THEME.PRIMARY_CORAL_ACTIVE};
                border-color: ${CONFIG.THEME.PRIMARY_CORAL_ACTIVE};
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================================
    // Menu Injection
    // ============================================================

    function injectExportMenuItem() {
        if (document.getElementById('ns-claude-menu-item')) return;

        const menu = document.querySelector(CONFIG.SELECTORS.PLUS_MENU);
        if (!menu) return;

        const firstItem = menu.querySelector(CONFIG.SELECTORS.PLUS_MENU_FIRST_ITEM);
        if (!firstItem) return;

        // Create separator
        const separator = document.createElement('div');
        separator.setAttribute('data-orientation', 'horizontal');
        separator.setAttribute('role', 'separator');
        separator.className = 'ns-claude-menu-separator';

        // Create Export Chat menu item
        const exportItem = document.createElement('div');
        exportItem.id = 'ns-claude-menu-item';
        exportItem.setAttribute('role', 'menuitem');
        exportItem.className = 'ns-claude-menu-item';
        exportItem.tabIndex = -1;
        
        // Build icon wrapper
        const iconSpan = document.createElement('span');
        iconSpan.className = 'flex size-icon shrink-0 items-center justify-center';
        const iconDiv = document.createElement('div');
        iconDiv.style.cssText = 'width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;';
        
        // Create SVG icon
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '20');
        svg.setAttribute('height', '20');
        svg.setAttribute('viewBox', '0 0 20 20');
        svg.setAttribute('fill', 'currentColor');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.flexShrink = '0';
        
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('fill-rule', 'evenodd');
        path1.setAttribute('clip-rule', 'evenodd');
        path1.setAttribute('d', 'M10 2a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V3a1 1 0 011-1z');
        
        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path2.setAttribute('fill-rule', 'evenodd');
        path2.setAttribute('clip-rule', 'evenodd');
        path2.setAttribute('d', 'M3 15a1 1 0 011 1v1h12v-1a1 1 0 112 0v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 011-1z');
        
        svg.appendChild(path1);
        svg.appendChild(path2);
        iconDiv.appendChild(svg);
        iconSpan.appendChild(iconDiv);
        
        // Build text wrapper
        const textSpan = document.createElement('span');
        textSpan.className = 'min-w-0 flex-1 truncate';
        const textInner = document.createElement('span');
        textInner.className = 'block truncate';
        textInner.textContent = 'Export Chat';
        textSpan.appendChild(textInner);
        
        exportItem.appendChild(iconSpan);
        exportItem.appendChild(textSpan);

        // Insert separator first, then export item
        menu.insertBefore(separator, firstItem);
        menu.insertBefore(exportItem, separator);

        // Add click handler
        exportItem.onclick = (e) => {
            e.stopPropagation();
            openSidebar();
        };
    }

    // ============================================================
    // Sidebar UI
    // ============================================================

    function renderMessageList() {
        const listContainer = document.getElementById('ns-claude-msg-list');
        if (!listContainer) return;
        
        // Clear container using DOM API (TrustedHTML compatible)
        while (listContainer.firstChild) {
            listContainer.removeChild(listContainer.firstChild);
        }

        if (STATE.messages.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'padding:20px; text-align:center; color:#6c6a64; font-size:13px;';
            emptyMsg.textContent = 'No messages found in this conversation.';
            listContainer.appendChild(emptyMsg);
            return;
        }

        STATE.messages.forEach(msg => {
            const card = document.createElement('div');
            card.className = 'ns-claude-msg-card';

            const item = document.createElement('div');
            item.className = 'ns-claude-msg-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'ns-claude-check';
            checkbox.checked = STATE.selectedIds.has(msg.id);

            const content = document.createElement('div');
            content.className = 'ns-claude-msg-content';

            const badgeGroup = document.createElement('div');
            badgeGroup.style.display = 'flex';
            badgeGroup.style.alignItems = 'center';
            badgeGroup.style.gap = '6px';

            const badge = document.createElement('span');
            badge.className = `ns-claude-role-badge ns-claude-role-${msg.role}`;
            badge.textContent = msg.role === 'user' ? '👤 USER' : '🧠 CLAUDE';
            badgeGroup.appendChild(badge);

            if (msg.thinking && msg.thinking.content) {
                const thoughtBadge = document.createElement('span');
                thoughtBadge.className = 'ns-claude-thinking-badge';
                thoughtBadge.textContent = '🧠 Thinking captured';
                badgeGroup.appendChild(thoughtBadge);
            }

            const preview = document.createElement('div');
            preview.className = 'ns-claude-msg-preview';
            preview.textContent = msg.preview || (msg.role === 'user' ? 'User Prompt' : 'Claude Response');

            content.appendChild(badgeGroup);
            content.appendChild(preview);

            item.appendChild(checkbox);
            item.appendChild(content);

            card.appendChild(item);

            // Accordion for expanded view
            const isExpanded = STATE.expandedId === msg.id;
            if (isExpanded) {
                const accordion = document.createElement('div');
                accordion.className = 'ns-claude-accordion';

                if (msg.thinking && msg.thinking.content) {
                    const tHeader = document.createElement('div');
                    tHeader.style.fontWeight = '600';
                    tHeader.style.color = CONFIG.THEME.ACCENT_TEAL;
                    tHeader.textContent = `🧠 Thinking: ${msg.thinking.summary || 'Claude\'s reasoning'}`;
                    accordion.appendChild(tHeader);

                    const tBody = document.createElement('div');
                    tBody.className = 'ns-claude-accordion-thinking';
                    tBody.textContent = msg.thinking.content;
                    accordion.appendChild(tBody);
                }

                const fullText = document.createElement('div');
                fullText.className = 'ns-claude-accordion-content';
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

    async function openSidebar() {
        // Auto-expand thinking blocks first
        await autoExpandThinkingBlocks();
        
        // Scan the conversation
        scanConversation();
        renderMessageList();
        
        // Open sidebar
        const overlay = document.getElementById('ns-claude-overlay');
        const sidebar = document.getElementById('ns-claude-sidebar');
        overlay.classList.add('active');
        sidebar.classList.add('active');
        STATE.sidebarOpen = true;
    }

    function closeSidebar() {
        const overlay = document.getElementById('ns-claude-overlay');
        const sidebar = document.getElementById('ns-claude-sidebar');
        overlay.classList.remove('active');
        sidebar.classList.remove('active');
        STATE.sidebarOpen = false;
    }

    function createSidebarUI() {
        if (document.getElementById('ns-claude-sidebar')) return;

        const overlay = document.createElement('div');
        overlay.id = 'ns-claude-overlay';

        const sidebar = document.createElement('div');
        sidebar.id = 'ns-claude-sidebar';

        // Build header
        const header = document.createElement('div');
        header.className = 'ns-claude-header';

        const title = document.createElement('h2');
        title.className = 'ns-claude-title';
        const titleIcon = document.createElement('span');
        titleIcon.style.fontSize = '20px';
        titleIcon.textContent = '🦁';
        const titleText = document.createTextNode(' Claude Exporter');
        title.appendChild(titleIcon);
        title.appendChild(titleText);

        const subtitle = document.createElement('p');
        subtitle.className = 'ns-claude-subtitle';
        subtitle.textContent = 'Noosphere Reflect — Meaning Through Memory';

        const inputGroup = document.createElement('div');
        inputGroup.className = 'ns-claude-input-group';
        const label = document.createElement('span');
        label.className = 'ns-claude-label';
        label.textContent = 'Chat Title';
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'ns-claude-title';
        input.className = 'ns-claude-input';
        input.placeholder = 'Enter session title...';
        inputGroup.appendChild(label);
        inputGroup.appendChild(input);

        const batch = document.createElement('div');
        batch.className = 'ns-claude-batch';
        ['All', 'User', 'Claude', 'None'].forEach(text => {
            const btn = document.createElement('button');
            btn.className = 'ns-claude-batch-btn';
            btn.id = `ns-claude-batch-${text.toLowerCase()}`;
            btn.textContent = text;
            batch.appendChild(btn);
        });

        header.appendChild(title);
        header.appendChild(subtitle);
        header.appendChild(inputGroup);
        header.appendChild(batch);

        // Build message list
        const msgList = document.createElement('div');
        msgList.className = 'ns-claude-msg-list';
        msgList.id = 'ns-claude-msg-list';

        // Build footer
        const footer = document.createElement('div');
        footer.className = 'ns-claude-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'ns-claude-btn ns-claude-btn-cancel';
        cancelBtn.id = 'ns-claude-cancel';
        cancelBtn.textContent = 'Cancel';

        const formatSelect = document.createElement('select');
        formatSelect.className = 'ns-claude-format-select';
        formatSelect.id = 'ns-claude-format';
        
        const mdOption = document.createElement('option');
        mdOption.value = 'markdown';
        mdOption.textContent = 'Markdown (.md)';
        formatSelect.appendChild(mdOption);
        
        const jsonOption = document.createElement('option');
        jsonOption.value = 'json';
        jsonOption.textContent = 'JSON (.json)';
        formatSelect.appendChild(jsonOption);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'ns-claude-btn ns-claude-btn-copy';
        copyBtn.id = 'ns-claude-copy';
        copyBtn.textContent = '📋 Copy';

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'ns-claude-btn ns-claude-btn-primary';
        downloadBtn.id = 'ns-claude-download';
        downloadBtn.textContent = '⬇️ Save';

        footer.appendChild(cancelBtn);
        footer.appendChild(formatSelect);
        footer.appendChild(copyBtn);
        footer.appendChild(downloadBtn);

        // Assemble sidebar
        sidebar.appendChild(header);
        sidebar.appendChild(msgList);
        sidebar.appendChild(footer);

        document.body.appendChild(overlay);
        document.body.appendChild(sidebar);

        // Event handlers
        overlay.onclick = closeSidebar;
        document.getElementById('ns-claude-cancel').onclick = closeSidebar;

        const setBatch = (type) => {
            STATE.selectedIds.clear();
            if (type === 'all') STATE.messages.forEach(m => STATE.selectedIds.add(m.id));
            if (type === 'user') STATE.messages.filter(m => m.role === 'user').forEach(m => STATE.selectedIds.add(m.id));
            if (type === 'ai') STATE.messages.filter(m => m.role === 'assistant').forEach(m => STATE.selectedIds.add(m.id));
            renderMessageList();
        };

        document.getElementById('ns-claude-batch-all').onclick = () => setBatch('all');
        document.getElementById('ns-claude-batch-user').onclick = () => setBatch('user');
        document.getElementById('ns-claude-batch-claude').onclick = () => setBatch('ai');
        document.getElementById('ns-claude-batch-none').onclick = () => setBatch('none');

        document.getElementById('ns-claude-copy').onclick = () => ExportService.executeCopy();
        document.getElementById('ns-claude-download').onclick = () => ExportService.executeDownload();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && STATE.sidebarOpen) closeSidebar();
        });
    }

    // ============================================================
    // Observer for Menu Re-injection
    // ============================================================

    function setupMenuObserver() {
        const observer = new MutationObserver(() => {
            const menu = document.querySelector(CONFIG.SELECTORS.PLUS_MENU);
            if (menu && !document.getElementById('ns-claude-menu-item')) {
                injectExportMenuItem();
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ============================================================
    // Initialization
    // ============================================================

    function init() {
        console.log('🦁 Noosphere Reflect — Claude Chat Exporter Initialized');
        ThemeManager.init(); // Detects theme, sets STATE.currentTheme, injects styles
        createSidebarUI();
        injectExportMenuItem();
        setupMenuObserver();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
