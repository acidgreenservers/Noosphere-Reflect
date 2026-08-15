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
     *   - Integrated Top Bar Trigger: Sits natively next to "New chat" as "Export Chat"
     *   - Dual Deep Research Extraction: Explicitly separates Block 1
     *     (Research Stepper & Execution Plan) from Block 2 (Final Report
     *     & Sources Favicon Bar)
     *   - Native Mistral Vibe UI Theme (DESIGN.md warm palette) with
     *     automatic light / dark theme detection and live switching
     *   - Automated Thought Expansion: Pre-expands "Thought for X s"
     *     collapsibles to ensure 100% of reasoning process is archived
     *   - Recursive DOM-to-Markdown parser preserving full formatting
     *     (Headings, bold/italic, lists, pipe tables, code blocks)
     *   - Interactive turn accordion drawer with batch selection controls
     *   - Noosphere Reflect frontmatter metadata & signature footer lock
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

            // Deep Research Specific Selectors
            RESEARCH_STEPPER_FORM: 'form.shadow-card, form.border-default',
            RESEARCH_STEPS_HEADER: '.group\\/steps-header',

            CONVERSATION_TITLE: '.min-h-5\\.5.truncate, header h1, title',
            TOP_BAR: '[data-desktop-window-top-bar="true"]',
            RIGHT_ACTION_CONTAINER: '[data-desktop-window-top-bar="true"] > div:last-child',
            NOISE_ELEMENTS: 'button, svg, .copy-button, [aria-hidden="true"]'
        },

        THEMES: {
            light: {
                CANVAS: '#ffffff',
                SURFACE: '#fafafa',
                SURFACE_CREAM: '#fff8e0',
                SURFACE_CREAM_SOFT: '#fffaeb',
                CREAM: '#fff8e0',
                CREAM_DEEPER: '#fff0c2',
                BEIGE_DEEP: '#e6d5a8',
                PRIMARY: '#fa520f',
                PRIMARY_DEEP: '#cc3a05',
                INK: '#1f1f1f',
                INK_TINT: '#3d3d3d',
                CHARCOAL: '#2c2c2c',
                SLATE: '#4a4a4a',
                STEEL: '#6a6a6a',
                STONE: '#8a8a8a',
                MUTED: '#a8a8a8',
                HAIRLINE: '#e5e5e5',
                HAIRLINE_SOFT: '#ededed',
                HAIRLINE_STRONG: '#c7c7c7',
                SUNSHINE_500: '#ffb83e',
                SUNSHINE_700: '#ffa110',
                YELLOW_SATURATED: '#ffd900',
                ON_PRIMARY: '#ffffff',
                ON_CREAM: '#1f1f1f',
                ON_DARK: '#ffffff',
                ON_DARK_MUTED: '#a8a8a8',
                LINK: '#fa520f'
            },
            dark: {
                CANVAS: '#1c1c1e',
                SURFACE: '#161618',
                SURFACE_CREAM: '#1a1a1c',
                SURFACE_CREAM_SOFT: '#1f1f22',
                CREAM: '#1f1f1f',
                CREAM_DEEPER: '#2c2c2e',
                BEIGE_DEEP: '#2c2c2e',
                PRIMARY: '#fa520f',
                PRIMARY_DEEP: '#cc3a05',
                INK: '#f3f4f6',
                INK_TINT: '#e5e7eb',
                CHARCOAL: '#d1d5db',
                SLATE: '#9ca3af',
                STEEL: '#6b7280',
                STONE: '#4b5563',
                MUTED: '#6b7280',
                HAIRLINE: '#374151',
                HAIRLINE_SOFT: '#1f2937',
                HAIRLINE_STRONG: '#4b5563',
                SUNSHINE_500: '#ffb83e',
                SUNSHINE_700: '#ffa110',
                YELLOW_SATURATED: '#ffd900',
                ON_PRIMARY: '#ffffff',
                ON_CREAM: '#f3f4f6',
                ON_DARK: '#ffffff',
                ON_DARK_MUTED: '#9ca3af',
                LINK: '#fb923c'
            }
        }
    };

    // Active theme reference — swapped by ThemeManager
    CONFIG.THEME = CONFIG.THEMES.light;

    const STATE = {
        messages: [],
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
            const html = document.documentElement;
            const htmlTheme = html.getAttribute('data-theme');
            if (htmlTheme === 'dark' || html.classList.contains('dark')) return 'dark';
            if (htmlTheme === 'light' || html.classList.contains('light')) return 'light';

            const body = document.body;
            if (body) {
                const bodyTheme = body.getAttribute('data-theme');
                if (bodyTheme === 'dark' || body.classList.contains('dark')) return 'dark';
                if (bodyTheme === 'light' || body.classList.contains('light')) return 'light';
            }

            // Heuristic: inspect the top-bar background colour
            const topBar = document.querySelector(CONFIG.SELECTORS.TOP_BAR);
            if (topBar) {
                const bg = getComputedStyle(topBar).backgroundColor;
                const rgb = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (rgb) {
                    const avg = (parseInt(rgb[1], 10) + parseInt(rgb[2], 10) + parseInt(rgb[3], 10)) / 3;
                    if (avg < 80) return 'dark';
                    if (avg > 200) return 'light';
                }
            }

            if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
            return 'light';
        },

        apply(themeName) {
            if (STATE.currentTheme === themeName) return;
            STATE.currentTheme = themeName;
            CONFIG.THEME = CONFIG.THEMES[themeName];

            // Remove old stylesheet and re-inject with new palette
            const oldStyle = document.getElementById('noosphere-vibe-styles');
            if (oldStyle) oldStyle.remove();
            injectStyles();

            // Re-render message cards so inline styles pick up new palette
            renderMessageList();
        },

        init() {
            this.apply(this.detect());

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
                background: success ? CONFIG.THEME.PRIMARY : '#dc2626',
                color: '#ffffff',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '200000',
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '1.30',
                boxShadow: 'rgba(0, 0, 0, 0.12) 0px 16px 48px -8px',
                transition: 'opacity 0.3s ease',
                fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif'
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
    // Vibe DOM Extractors & Deep Research Distinguishers
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

    // Explicitly Extracts Block 1: The Research Stepper Form (<form>)
    function extractResearchStepperForm(el) {
        const formEl = el.querySelector(CONFIG.SELECTORS.RESEARCH_STEPPER_FORM);
        if (!formEl) return null;

        const mainSteps = [];
        formEl.querySelectorAll('[style*="step-"][style*="-content"]').forEach(stepContent => {
            const titleEl = stepContent.querySelector('span.font-medium');
            const subItems = Array.from(stepContent.querySelectorAll('p')).map(p => Utils.cleanText(p.innerText)).filter(Boolean);

            if (titleEl) {
                mainSteps.push({
                    title: Utils.cleanText(titleEl.innerText),
                    items: subItems
                });
            }
        });

        return mainSteps.length > 0 ? mainSteps : null;
    }

    // Explicitly Extracts Block 2: The Completed Report Body + Discovered Sources
    function extractResearchReportBody(el) {
        const answerEl = el.querySelector(CONFIG.SELECTORS.ANSWER_CONTAINER) || el;
        const reportTitle = Utils.cleanText(answerEl.querySelector('h1, h2')?.innerText || 'Research Report');
        const reportMarkdown = htmlToMarkdown(answerEl);

        const sources = [];
        answerEl.querySelectorAll('a[href]').forEach(a => {
            const href = a.getAttribute('href');
            const label = Utils.cleanText(a.innerText || href);
            if (href && !href.startsWith('#')) {
                sources.push({ label, href });
            }
        });

        const sourcesCountText = Utils.cleanText(el.querySelector('.ticker-view')?.innerText || '');

        return {
            title: reportTitle,
            sourcesCountText,
            sources,
            reportMarkdown
        };
    }

    function scanThreadMessages() {
        autoExpandThoughts();

        const elements = Array.from(document.querySelectorAll([
            CONFIG.SELECTORS.USER_MESSAGE,
            CONFIG.SELECTORS.AI_MESSAGE
        ].join(', ')));

        STATE.messages = elements.map((el, idx) => {
            const isUser = el.matches(CONFIG.SELECTORS.USER_MESSAGE);
            let role = isUser ? 'user' : 'ai';
            let text = '';
            let thoughts = '';
            let stepperPlan = null;
            let reportData = null;

            if (isUser) {
                const contentEl = el.querySelector(CONFIG.SELECTORS.USER_CONTENT) || el;
                text = Utils.cleanText(contentEl.innerText || '');
            } else {
                stepperPlan = extractResearchStepperForm(el);
                const hasStepsHeader = !!el.querySelector(CONFIG.SELECTORS.RESEARCH_STEPS_HEADER);

                if (stepperPlan || hasStepsHeader) {
                    role = 'research';
                    reportData = extractResearchReportBody(el);
                    text = reportData.reportMarkdown;
                } else {
                    const reasoningEl = el.querySelector(CONFIG.SELECTORS.REASONING_CONTAINER);
                    if (reasoningEl) {
                        thoughts = htmlToMarkdown(reasoningEl);
                    }

                    const answerEl = el.querySelector(CONFIG.SELECTORS.ANSWER_CONTAINER) || el;
                    text = htmlToMarkdown(answerEl);
                }
            }

            const rawPreview = isUser
                ? text
                : (reportData ? reportData.title : Utils.cleanText(el.innerText));

            return {
                id: idx,
                role,
                text,
                thoughts,
                stepperPlan,
                reportData,
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
            const researchCount = selected.filter(m => m.role === 'research').length;

            let md = '';
            md += '---\n';
            md += `> **📝 Title:** ${title}\n>\n`;
            md += '> **🤖 Model:** Mistral Vibe\n>\n';
            md += `> **🌐 Exported:** ${exportedAt}\n>\n`;
            md += `> **🌐 Source:** [Mistral Vibe](${sourceUrl})\n>\n`;
            md += '> **🏷️ Tags:** Mistral, Vibe, AI-Chat, Deep-Research, Noosphere\n>\n';
            md += `> **📊 Metadata:** ${selected.length} Selected Messages | ${userCount} User | ${aiCount} Mistral | ${researchCount} Deep Research\n`;
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
                } else if (msg.role === 'research') {
                    md += `#### Response - Deep Research 🔬:\n\n`;

                    // Output Block 1: Research Stepper Plan if captured
                    if (msg.stepperPlan && msg.stepperPlan.length > 0) {
                        md += `<details>\n<summary><b>📋 Research Execution Plan & Stepper</b></summary>\n\n`;
                        msg.stepperPlan.forEach(step => {
                            md += `**${step.title}**\n`;
                            if (step.items.length > 0) {
                                step.items.forEach(item => {
                                    md += `- ${item}\n`;
                                });
                            }
                            md += '\n';
                        });
                        md += '</details>\n\n';
                    }

                    // Output Block 2: Full Research Report
                    md += `${msg.text}\n\n`;

                    // Discovered Sources
                    if (msg.reportData && msg.reportData.sources.length > 0) {
                        md += `<details>\n<summary><b>📚 Discovered Research Sources (${msg.reportData.sources.length})</b></summary>\n\n`;
                        msg.reportData.sources.forEach(s => {
                            md += `- [${s.label}](${s.href})\n`;
                        });
                        md += '\n</details>\n\n';
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
                    model: 'Mistral Vibe'
                },
                messages: selected.map(m => ({
                    role: m.role,
                    thoughts: m.thoughts || null,
                    stepperPlan: m.stepperPlan || null,
                    reportData: m.reportData || null,
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

        const T = CONFIG.THEME;
        const style = document.createElement('style');
        style.id = 'noosphere-vibe-styles';
        style.textContent = `
            .ns-vibe-header-btn {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif !important;
                width: 36px !important;
                height: 36px !important;
                padding: 0 !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                color: ${T.STEEL} !important;
                background: transparent !important;
                border: none !important;
                transition: all 0.15s ease !important;
                user-select: none !important;
            }
            .ns-vibe-header-btn:hover {
                background: ${T.HAIRLINE_SOFT} !important;
            }
            .ns-vibe-header-btn:active {
                transform: scale(98.5%) !important;
            }
            .ns-vibe-header-btn svg {
                width: 18px !important;
                height: 18px !important;
                stroke: currentColor !important;
                fill: none !important;
            }

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

            #ns-vibe-sidebar {
                position: fixed;
                top: 0; right: -380px;
                width: 380px;
                height: 100%;
                background: ${T.SURFACE_CREAM};
                border-left: 1px solid ${T.BEIGE_DEEP};
                color: ${T.INK};
                z-index: 100002;
                transition: right 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                flex-direction: column;
                box-shadow: -10px 0 30px rgba(0,0,0,0.1);
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
            }
            #ns-vibe-sidebar.active { right: 0; }

            .ns-sidebar-header {
                padding: 20px 24px 16px;
                background: ${T.CREAM};
                border-bottom: 1px solid ${T.BEIGE_DEEP};
                display: flex;
                flex-direction: column;
                gap: 12px;
                flex-shrink: 0;
            }

            .ns-sidebar-title {
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
                font-size: 18px;
                font-weight: 500;
                line-height: 1.40;
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0;
                color: ${T.INK};
            }

            .ns-input-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .ns-label {
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
                font-size: 11px;
                font-weight: 600;
                line-height: 1.40;
                color: ${T.STEEL};
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .ns-input {
                width: 100%;
                background: ${T.CANVAS};
                border: 1px solid ${T.HAIRLINE_STRONG};
                border-radius: 8px;
                padding: 8px 12px;
                color: ${T.INK};
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
                font-size: 14px;
                font-weight: 400;
                line-height: 1.55;
                outline: none;
                box-sizing: border-box;
                height: 44px;
            }
            .ns-input:focus {
                border: 2px solid ${T.PRIMARY};
            }

            .ns-batch-controls {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }

            .ns-batch-btn {
                padding: 8px;
                background: ${T.CANVAS};
                border: 1px solid ${T.HAIRLINE};
                border-radius: 8px;
                color: ${T.STEEL};
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
                font-size: 13px;
                font-weight: 500;
                line-height: 1.40;
                cursor: pointer;
                text-align: center;
                transition: all 0.15s ease;
            }
            .ns-batch-btn:hover {
                background: ${T.SURFACE_CREAM_SOFT};
                color: ${T.INK};
                border-color: ${T.BEIGE_DEEP};
            }

            .ns-msg-list {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .ns-msg-card {
                background: ${T.CANVAS} !important;
                border: 1px solid ${T.HAIRLINE_SOFT} !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                flex-shrink: 0 !important;
                height: auto !important;
                min-height: 52px !important;
                max-height: none !important;
                transition: all 0.15s ease;
                box-sizing: border-box !important;
                box-shadow: rgba(0, 0, 0, 0.04) 0px 1px 2px 0px;
            }
            .ns-msg-card:hover {
                box-shadow: rgba(0, 0, 0, 0.04) 0px 4px 12px 0px !important;
                border-color: ${T.HAIRLINE} !important;
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
                border: 2px solid ${T.PRIMARY} !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                background: ${T.CANVAS} !important;
                position: relative !important;
                flex-shrink: 0 !important;
                margin-top: 2px !important;
            }
            .ns-msg-check:checked {
                background: ${T.PRIMARY} !important;
            }
            .ns-msg-check:checked::after {
                content: '✓' !important;
                position: absolute !important;
                color: ${T.ON_PRIMARY} !important;
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
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
                font-size: 11px !important;
                font-weight: 600 !important;
                line-height: 1.40 !important;
                text-transform: uppercase !important;
                padding: 4px 10px !important;
                border-radius: 9999px !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
            }
            .ns-role-user {
                background: ${T.HAIRLINE_SOFT} !important;
                color: ${T.SLATE} !important;
            }
            .ns-role-ai {
                background: rgba(250, 82, 15, 0.12) !important;
                color: ${T.PRIMARY} !important;
            }
            .ns-role-research {
                background: rgba(255, 184, 62, 0.20) !important;
                color: ${T.SUNSHINE_700} !important;
            }

            .ns-msg-preview {
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
                font-size: 14px !important;
                font-weight: 400 !important;
                line-height: 1.50 !important;
                color: ${T.STEEL} !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                word-break: break-word !important;
            }

            .ns-msg-accordion {
                background: ${T.SURFACE} !important;
                border-top: 1px solid ${T.HAIRLINE_SOFT} !important;
                padding: 12px 16px 16px 46px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
                font-size: 14px !important;
                font-weight: 400 !important;
                line-height: 1.55 !important;
            }

            .ns-sidebar-footer {
                padding: 12px 16px;
                background: ${T.CREAM};
                border-top: 1px solid ${T.BEIGE_DEEP};
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }

            .ns-btn {
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
                font-size: 14px;
                font-weight: 500;
                line-height: 1.30;
                border-radius: 8px;
                padding: 10px 16px;
                cursor: pointer;
                text-align: center;
                transition: all 0.15s ease;
                white-space: nowrap;
                border: none;
                outline: none;
            }

            .ns-btn-cancel {
                background: rgba(220, 38, 38, 0.10);
                border: 1px solid rgba(220, 38, 38, 0.30);
                color: #dc2626;
                flex: 0.8;
            }
            .ns-btn-cancel:hover {
                background: rgba(220, 38, 38, 0.20);
                border-color: rgba(220, 38, 38, 0.40);
            }

            .ns-format-select {
                flex: 1.2;
                background: ${T.CANVAS};
                border: 1px solid ${T.HAIRLINE_STRONG};
                border-radius: 8px;
                color: ${T.INK};
                padding: 8px 10px;
                outline: none;
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
                font-size: 14px;
                font-weight: 500;
                line-height: 1.30;
                cursor: pointer;
                text-align: center;
            }
            .ns-format-select option {
                background: ${T.CANVAS};
                color: ${T.INK};
            }

            .ns-btn-copy {
                flex: 1;
                background: transparent;
                border: 1px solid ${T.HAIRLINE_STRONG};
                color: ${T.INK};
            }
            .ns-btn-copy:hover {
                background: ${T.HAIRLINE_SOFT};
            }

        `;
        document.head.appendChild(style);
    }

    function renderMessageList() {
        const listContainer = document.getElementById('ns-msg-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (STATE.messages.length === 0) {
            listContainer.innerHTML = `<div style="padding:24px; text-align:center; color:${CONFIG.THEME.STEEL}; font-family:Inter,ui-sans-serif,system-ui,sans-serif; font-size:14px; font-weight:400; line-height:1.55;">No messages found in Mistral Vibe thread.</div>`;
            return;
        }

        const roleConfig = {
            user: { icon: '👤', label: 'USER' },
            ai: { icon: '🧠', label: 'MISTRAL VIBE' },
            research: { icon: '🔬', label: 'DEEP RESEARCH' }
        };

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

            const roleMeta = roleConfig[msg.role] || { icon: '💬', label: msg.role.toUpperCase() };

            const badgeGroup = document.createElement('div');
            badgeGroup.className = 'ns-role-badge-group';

            const badge = document.createElement('span');
            badge.className = `ns-role-badge ns-role-${msg.role}`;
            badge.textContent = `${roleMeta.icon} ${roleMeta.label}`;
            badgeGroup.appendChild(badge);

            if (msg.thoughts) {
                const thoughtBadge = document.createElement('span');
                thoughtBadge.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
                thoughtBadge.style.fontSize = '11px';
                thoughtBadge.style.fontWeight = '500';
                thoughtBadge.style.color = CONFIG.THEME.PRIMARY;
                thoughtBadge.textContent = '🧠 Thought Captured';
                badgeGroup.appendChild(thoughtBadge);
            }

            if (msg.stepperPlan) {
                const planBadge = document.createElement('span');
                planBadge.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
                planBadge.style.fontSize = '11px';
                planBadge.style.fontWeight = '500';
                planBadge.style.color = CONFIG.THEME.SUNSHINE_700;
                planBadge.textContent = `📋 ${msg.stepperPlan.length} Steps`;
                badgeGroup.appendChild(planBadge);
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

                // Render Thoughts if present
                if (msg.thoughts) {
                    const tHeader = document.createElement('div');
                    tHeader.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
                    tHeader.style.fontSize = '14px';
                    tHeader.style.fontWight = '500';
                    tHeader.style.lineHeight = '1.30';
                    tHeader.style.color = CONFIG.THEME.PRIMARY;
                    tHeader.textContent = '🧠 Thought Process:';
                    accordion.appendChild(tHeader);

                    const tBody = document.createElement('div');
                    tBody.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
                    tBody.style.fontSize = '14px';
                    tBody.style.fontWeight = '400';
                    tBody.style.lineHeight = '1.55';
                    tBody.style.color = CONFIG.THEME.STEEL;
                    tBody.style.fontStyle = 'italic';
                    tBody.style.maxHeight = '100px';
                    tBody.style.overflowY = 'auto';
                    tBody.textContent = msg.thoughts;
                    accordion.appendChild(tBody);
                }

                // Render Block 1: Research Execution Stepper
                if (msg.stepperPlan && msg.stepperPlan.length > 0) {
                    const sHeader = document.createElement('div');
                    sHeader.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
                    sHeader.style.fontSize = '14px';
                    sHeader.style.fontWeight = '500';
                    sHeader.style.lineHeight = '1.30';
                    sHeader.style.color = CONFIG.THEME.SUNSHINE_700;
                    sHeader.textContent = `📋 Research Execution Stepper (${msg.stepperPlan.length} Phases):`;
                    accordion.appendChild(sHeader);

                    msg.stepperPlan.forEach(step => {
                        const stepEl = document.createElement('div');
                        stepEl.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
                        stepEl.style.fontSize = '14px';
                        stepEl.style.fontWeight = '500';
                        stepEl.style.lineHeight = '1.30';
                        stepEl.style.color = CONFIG.THEME.INK;
                        stepEl.textContent = `• ${step.title}`;
                        accordion.appendChild(stepEl);

                        step.items.forEach(itemText => {
                            const subItem = document.createElement('div');
                            subItem.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
                            subItem.style.fontSize = '14px';
                            subItem.style.fontWeight = '400';
                            subItem.style.lineHeight = '1.55';
                            subItem.style.color = CONFIG.THEME.STEEL;
                            subItem.style.paddingLeft = '12px';
                            subItem.textContent = `-> ${itemText}`;
                            accordion.appendChild(subItem);
                        });
                    });
                }

                // Render Block 2: Discovered Sources
                if (msg.reportData && msg.reportData.sources.length > 0) {
                    const srcHeader = document.createElement('div');
                    srcHeader.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
                    srcHeader.style.fontSize = '14px';
                    srcHeader.style.fontWeight = '500';
                    srcHeader.style.lineHeight = '1.30';
                    srcHeader.style.color = CONFIG.THEME.INK;
                    srcHeader.textContent = `📚 Research Sources (${msg.reportData.sources.length}):`;
                    accordion.appendChild(srcHeader);

                    msg.reportData.sources.slice(0, 8).forEach(src => {
                        const linkEl = document.createElement('a');
                        linkEl.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
                        linkEl.style.fontSize = '14px';
                        linkEl.style.fontWeight = '400';
                        linkEl.style.lineHeight = '1.55';
                        linkEl.style.color = CONFIG.THEME.LINK;
                        linkEl.style.textDecoration = 'none';
                        linkEl.href = src.href;
                        linkEl.target = '_blank';
                        linkEl.textContent = `🔗 ${src.label}`;
                        accordion.appendChild(linkEl);
                    });
                }

                // Render Full Report Markdown Text
                const fullText = document.createElement('div');
                fullText.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
                fullText.style.fontSize = '14px';
                fullText.style.fontWeight = '400';
                fullText.style.lineHeight = '1.55';
                fullText.style.color = CONFIG.THEME.INK_TINT;
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

        const rightContainer = document.querySelector(CONFIG.SELECTORS.RIGHT_ACTION_CONTAINER);
        if (!rightContainer) return;

        const triggerBtn = document.createElement('button');
        triggerBtn.id = 'ns-vibe-header-btn';
        triggerBtn.className = 'ns-vibe-header-btn';
        triggerBtn.setAttribute('aria-label', 'Export Chat');
        triggerBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke-miterlimit="10" stroke-linecap="square"><path d="M12 3V15" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="square" fill="none"/><path d="M4 18L4 20L20 20L20 18" stroke="currentColor" stroke-width="2" stroke-linecap="square" fill="none"/></svg>`;
        triggerBtn.onclick = (e) => {
            e.stopPropagation();
            openSidebarFn();
        };

        // Insert as first child (to the left of the star icon)
        rightContainer.prepend(triggerBtn);
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
            if (type === 'user') STATE.messages.filter(m => m.role === 'user').forEach(m => STATE.selectedIds.add(m.id));
            if (type === 'ai') STATE.messages.filter(m => m.role === 'ai' || m.role === 'research').forEach(m => STATE.selectedIds.add(m.id));
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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeSidebar();
        });
    }

    function init() {
        console.log('🔥 Noosphere Reflect — Mistral Vibe Native Exporter Initialized');
        ThemeManager.init(); // Detects theme, sets CONFIG.THEME, injects styles
        createSidebarUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
