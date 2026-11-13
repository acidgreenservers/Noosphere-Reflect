(function () {
    'use strict';

    /*
     * ============================================================
     * Noosphere Reflect — Ask Brave Search AI Interactive Exporter
     * ============================================================
     */

    const CONFIG = {
        SELECTORS: {
            USER_MESSAGE: '.user-bubble',
            USER_BUBBLE_TEXT: '.user-bubble-text',
            AI_MESSAGE: '.message.assistant.llm-output',
            AUGMENT_MESSAGE: '.message.augment',
            RESEARCH_MESSAGE: '.message.research',

            TOC_SECTION: 'a.sidebar-history-toc-section',
            HEADER_BUTTONS_CONTAINER: '.ask-center-header-buttons',
            HEADER_TABS_NAV: 'nav.tabs',
            SHARE_BUTTON: 'button[aria-label="Share"], .header-button',

            ENRICHMENT_CARD_ITEM: 'a.enrichment-card-item',
            ENRICHMENT_CARD_TITLE: '.desktop-small-semibold',
            ENRICHMENT_CARD_DESC: '.enrichment-card-description',
            ENRICHMENT_FOOTER_QUERY: '.enrichment-footer-query',

            DEEP_RESEARCH_CONTAINER: '.deep-research.noscrollbar',
            DEEP_RESEARCH_STATS_ITEM: '.deep-research-stats-item',
            DEEP_RESEARCH_STATS_VALUE: '.deep-research-stats-item-value',
            DEEP_RESEARCH_STATS_LABEL: '.deep-research-stats-item-label',
            DEEP_RESEARCH_QUERIES: '.deep-research-queries',
            DEEP_RESEARCH_QUERY: '.deep-research-query',
            DEEP_RESEARCH_SOURCE_CHIP: '.deep-research-source-chip[href]',
            DEEP_RESEARCH_ANSWER_CONTENT: '.deep-research-answer-content',
            DEEP_RESEARCH_PROGRESS: '.deep-research-progress',

            NOISE_ELEMENTS: 'button.inline-citation, div.copy-button, .table-sticky, .table-tools, svg, .user-message-actions'
        },

        THEMES: {
            dark: {
                SURFACE_SIDEBAR: '#101114',
                SURFACE_CARD: '#1e2025',
                SURFACE_CARD_SUBTLE: '#181a1e',
                SURFACE_DRAWER: '#181a1f',
                SURFACE_INPUT: '#272a30',
                SURFACE_INPUT_FOCUSED: '#2f333b',
                SURFACE_PILL: '#2a2d35',
                SURFACE_PILL_HOVER: '#343842',
                BRAND_ORANGE: '#fb542b',
                ACCENT_BLUE: '#4c6ef5',
                ACCENT_BLUE_SUBTLE: 'rgba(76, 110, 245, 0.18)',
                ACCENT_PURPLE_PILL: '#352e4d',
                ACCENT_PURPLE_TEXT: '#a78bfa',
                ACCENT_GREEN_SUBTLE: 'rgba(16, 185, 129, 0.18)',
                ACCENT_GREEN_TEXT: '#6ee7b7',
                TEXT_PRIMARY: '#f1f3f5',
                TEXT_SECONDARY: '#a0a6b1',
                TEXT_MUTED: '#6c727e',
                ON_BRAND: '#ffffff',
                LINK: '#748ffc',
                BORDER_HAIRLINE: 'rgba(255, 255, 255, 0.06)',
                BORDER_SUBTLE: 'rgba(255, 255, 255, 0.10)',
                BORDER_STRONG: 'rgba(255, 255, 255, 0.18)',
                BORDER_FOCUS: '#4c6ef5',
                SHADOW_CARD: '0 4px 16px rgba(0, 0, 0, 0.25)',
                SHADOW_FLOATING: '0 8px 30px rgba(0, 0, 0, 0.40)',
                SHADOW_DRAWER: '0 12px 40px rgba(0, 0, 0, 0.50)'
            },
            light: {
                SURFACE_SIDEBAR: '#f8f9fa',
                SURFACE_CARD: '#ffffff',
                SURFACE_CARD_SUBTLE: '#f1f3f5',
                SURFACE_DRAWER: '#f8f9fa',
                SURFACE_INPUT: '#ffffff',
                SURFACE_INPUT_FOCUSED: '#ffffff',
                SURFACE_PILL: '#f1f3f5',
                SURFACE_PILL_HOVER: '#e9ecef',
                BRAND_ORANGE: '#fb542b',
                ACCENT_BLUE: '#3b5bdb',
                ACCENT_BLUE_SUBTLE: 'rgba(59, 91, 219, 0.10)',
                ACCENT_PURPLE_PILL: 'rgba(121, 80, 242, 0.10)',
                ACCENT_PURPLE_TEXT: '#6741d9',
                ACCENT_GREEN_SUBTLE: 'rgba(12, 166, 120, 0.10)',
                ACCENT_GREEN_TEXT: '#099268',
                TEXT_PRIMARY: '#1a1b1e',
                TEXT_SECONDARY: '#495057',
                TEXT_MUTED: '#868e96',
                ON_BRAND: '#ffffff',
                LINK: '#3b5bdb',
                BORDER_HAIRLINE: 'rgba(0, 0, 0, 0.06)',
                BORDER_SUBTLE: 'rgba(0, 0, 0, 0.12)',
                BORDER_STRONG: 'rgba(0, 0, 0, 0.22)',
                BORDER_FOCUS: '#3b5bdb',
                SHADOW_CARD: '0 2px 8px rgba(0, 0, 0, 0.06)',
                SHADOW_FLOATING: '0 8px 24px rgba(0, 0, 0, 0.12)',
                SHADOW_DRAWER: '-8px 0 32px rgba(0, 0, 0, 0.14)'
            }
        }
    };

    const STATE = {
        messages: [],
        selectedIds: new Set(),
        expandedId: null,
        exportFormat: 'markdown',
        lastUrl: '',
        activeTheme: 'dark'
    };

    // ============================================================
    // Theme Detection & Sync
    // ============================================================

    function detectPageTheme() {
        const root = document.documentElement;
        const body = document.body;

        const attr = [
            root.getAttribute('data-theme'),
            root.getAttribute('data-color-scheme'),
            body?.getAttribute('data-theme')
        ].filter(Boolean).join(' ').toLowerCase();

        if (attr.includes('light')) return 'light';
        if (attr.includes('dark')) return 'dark';

        const classes = `${root.className} ${body?.className || ''}`.toLowerCase();
        if (/\blight\b/.test(classes)) return 'light';
        if (/\bdark\b/.test(classes)) return 'dark';

        const colorScheme = getComputedStyle(root).colorScheme;
        if (colorScheme === 'light' || colorScheme === 'dark') return colorScheme;

        // Walk primary surfaces for the first opaque background color
        const surfaces = [body, root, document.querySelector('main'), document.querySelector(CONFIG.SELECTORS.HEADER_BUTTONS_CONTAINER)].filter(Boolean);
        for (const el of surfaces) {
            const rgba = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
            if (!rgba || rgba.length < 3) continue;
            if (rgba[3] !== undefined && parseFloat(rgba[3]) === 0) continue;
            const [r, g, b] = rgba.map(Number);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.5 ? 'light' : 'dark';
        }

        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    function syncTheme() {
        const mode = detectPageTheme();
        STATE.activeTheme = mode;
        const rootStyle = document.documentElement.style;

        Object.entries(CONFIG.THEMES[mode]).forEach(([key, val]) => {
            rootStyle.setProperty(`--ns-${key.toLowerCase().replace(/_/g, '-')}`, val);
        });

        const triggerBtn = document.getElementById('ns-brave-header-btn');
        const container = document.querySelector(CONFIG.SELECTORS.HEADER_BUTTONS_CONTAINER);
        const nativeBtn = container?.querySelector('button:not(#ns-brave-header-btn)');

        if (triggerBtn && nativeBtn) {
            const cs = getComputedStyle(nativeBtn);
            if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                triggerBtn.style.setProperty('background', cs.backgroundColor, 'important');
            }
            if (cs.color) triggerBtn.style.setProperty('color', cs.color, 'important');
            if (cs.borderColor) triggerBtn.style.setProperty('border-color', cs.borderColor, 'important');
        } else if (triggerBtn) {
            triggerBtn.style.removeProperty('background');
            triggerBtn.style.removeProperty('color');
            triggerBtn.style.removeProperty('border-color');
        }
    }

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
                background: success ? 'var(--ns-brand-orange, #fb542b)' : '#dc2626',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '9999px',
                zIndex: '200000',
                fontSize: '13px',
                fontWeight: '500',
                lineHeight: '1.45',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxShadow: 'var(--ns-shadow-floating)',
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
            return (text || 'Brave_Search_AI_Chat')
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

    function renderNodeToMarkdown(node, listDepth = 0) {
        if (!node) return '';
        if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        if (node.classList.contains('katex')) {
            const tex = node.querySelector('annotation[encoding="application/x-tex"]')?.textContent?.trim();
            if (tex) {
                return node.closest('.katex-display') ? `\n\n$$${tex}$$\n\n` : `$${tex}$`;
            }
        }

        const tag = node.tagName.toLowerCase();
        const inner = (depth = listDepth) =>
            Array.from(node.childNodes).map(child => renderNodeToMarkdown(child, depth)).join('');

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
                if (node.parentElement?.tagName.toLowerCase() === 'pre') return inner();
                return `\`${inner().replace(/`/g, '\\`')}\``;
            }

            case 'pre': {
                const lang = node.getAttribute('data-lang') || '';
                const codeText = node.textContent || '';
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
                const indent = '  '.repeat(listDepth);
                const items = Array.from(node.children)
                    .filter(child => child.tagName.toLowerCase() === 'li')
                    .map((li, idx) => {
                        const prefix = isOrdered ? `${idx + 1}.` : '-';
                        const raw = renderNodeToMarkdown(li, listDepth + 1)
                            .replace(/\n{2,}/g, '\n')
                            .trim();
                        return raw ? `${indent}${prefix} ${raw}` : '';
                    })
                    .filter(Boolean);

                const block = items.join('\n');
                return listDepth === 0 ? `\n\n${block}\n\n` : `\n${block}`;
            }

            case 'li': return inner(listDepth);

            case 'table': {
                const rows = Array.from(node.querySelectorAll('tr'));
                if (!rows.length) return '';

                const matrix = rows.map(row =>
                    Array.from(row.querySelectorAll('th, td')).map(cell =>
                        Utils.cleanText(renderNodeToMarkdown(cell))
                    )
                );

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
    // DOM Extractors
    // ============================================================

    const Extractors = {
        extractSidebarRounds() {
            return Array.from(document.querySelectorAll(CONFIG.SELECTORS.TOC_SECTION))
                .map(sec => ({
                    label: sec.getAttribute('title') || Utils.cleanText(sec.querySelector('span')?.innerText || sec.innerText || ''),
                    href: sec.getAttribute('href') || ''
                }))
                .filter(s => s.label);
        },

        extractUserMessage(container) {
            const textEl = container.querySelector(CONFIG.SELECTORS.USER_BUBBLE_TEXT) || container;
            return Utils.cleanText(textEl.innerText || textEl.textContent || '');
        },

        extractAIMessage(container) {
            return htmlToMarkdown(container);
        },

        extractAugmentCards(container) {
            const cards = Array.from(container.querySelectorAll(CONFIG.SELECTORS.ENRICHMENT_CARD_ITEM));
            const searchQuery = Utils.cleanText(container.querySelector(CONFIG.SELECTORS.ENRICHMENT_FOOTER_QUERY)?.innerText || '');

            const links = cards.map(card => {
                const href = card.getAttribute('href') || '';
                if (!href) return null;
                const title = Utils.cleanText(card.querySelector(CONFIG.SELECTORS.ENRICHMENT_CARD_TITLE)?.innerText || href);
                const desc = Utils.cleanText(card.querySelector(CONFIG.SELECTORS.ENRICHMENT_CARD_DESC)?.innerText || '');
                return { href, title, desc };
            }).filter(Boolean);

            return { searchQuery, links };
        },

        extractDeepResearch(container) {
            const panel = container.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_CONTAINER) || container;

            const stats = {};
            panel.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_STATS_ITEM).forEach(item => {
                const val = item.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_STATS_VALUE)?.innerText?.trim();
                const labelEl = item.querySelector('.long-label')
                    || item.querySelector('.short-label')
                    || item.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_STATS_LABEL);
                const label = labelEl?.innerText?.trim();
                if (val && label) stats[label] = val;
            });

            const answers = [];
            panel.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_ANSWER_CONTENT).forEach(ans => {
                const md = htmlToMarkdown(ans);
                if (md) answers.push(md);
            });

            const queries = [];
            panel.querySelectorAll(`${CONFIG.SELECTORS.DEEP_RESEARCH_QUERIES} ${CONFIG.SELECTORS.DEEP_RESEARCH_QUERY}`).forEach(q => {
                const text = Utils.cleanText(q.querySelector('span')?.innerText || q.innerText || '');
                if (text) queries.push(text);
            });

            const sources = [];
            panel.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_SOURCE_CHIP).forEach(chip => {
                const href = chip.getAttribute('href');
                const label = Utils.cleanText(chip.innerText || href);
                if (href) sources.push({ href, label });
            });

            const progress = Utils.cleanText(panel.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_PROGRESS)?.innerText || '');

            return { stats, answers, queries, sources, progress };
        }
    };

    // ============================================================
    // Message Scanner & Augment Attachment
    // ============================================================

    function scanThreadMessages() {
        const currentUrl = window.location.href;
        const urlChanged = STATE.lastUrl !== currentUrl;
        STATE.lastUrl = currentUrl;
        STATE.messages = [];

        const elements = Array.from(document.querySelectorAll([
            CONFIG.SELECTORS.USER_MESSAGE,
            CONFIG.SELECTORS.AI_MESSAGE,
            CONFIG.SELECTORS.AUGMENT_MESSAGE,
            CONFIG.SELECTORS.RESEARCH_MESSAGE
        ].join(', ')));

        if (elements.length === 0) {
            console.warn('[Noosphere Brave] 0 message containers matched current selectors:', CONFIG.SELECTORS);
        }

        let currentAIMessage = null;

        elements.forEach((el, index) => {
            if (el.matches(CONFIG.SELECTORS.USER_MESSAGE)) {
                currentAIMessage = null;
                const text = Extractors.extractUserMessage(el);
                if (text) {
                    STATE.messages.push({
                        id: index,
                        role: 'user',
                        text,
                        preview: text.substring(0, 70) + (text.length > 70 ? '...' : ''),
                        augments: [],
                        research: null
                    });
                }
            } else if (el.matches(CONFIG.SELECTORS.AI_MESSAGE)) {
                const mdText = Extractors.extractAIMessage(el);
                const rawText = Utils.cleanText(el.innerText);
                if (rawText) {
                    currentAIMessage = {
                        id: index,
                        role: 'ai',
                        text: mdText,
                        preview: rawText.substring(0, 70) + (rawText.length > 70 ? '...' : ''),
                        augments: [],
                        research: null
                    };
                    STATE.messages.push(currentAIMessage);
                }
            } else if (el.matches(CONFIG.SELECTORS.AUGMENT_MESSAGE)) {
                const augData = Extractors.extractAugmentCards(el);
                if (augData.links.length > 0) {
                    if (currentAIMessage) {
                        currentAIMessage.augments.push(augData);
                    } else {
                        STATE.messages.push({
                            id: index,
                            role: 'augment',
                            text: `Augment Search: ${augData.searchQuery}`,
                            preview: `Augment: ${augData.searchQuery || `${augData.links.length} sources`}`,
                            augments: [augData],
                            research: null
                        });
                    }
                }
            } else if (el.matches(CONFIG.SELECTORS.RESEARCH_MESSAGE)) {
                currentAIMessage = null;
                const resData = Extractors.extractDeepResearch(el);
                STATE.messages.push({
                    id: index,
                    role: 'research',
                    text: resData.answers.join('\n\n') || 'Deep Research Output',
                    preview: Object.keys(resData.stats).length > 0
                        ? Object.entries(resData.stats).map(([k, v]) => `${v} ${k}`).join(' | ')
                        : 'Deep Research Output',
                    augments: [],
                    research: resData
                });
            }
        });

        if (urlChanged || STATE.selectedIds.size === 0) {
            STATE.selectedIds.clear();
            STATE.expandedId = null;
            STATE.messages.forEach(m => STATE.selectedIds.add(m.id));
        }
    }

    // ============================================================
    // Synthesis & Output Builders
    // ============================================================

    const ExportService = {
        getChatTitle() {
            const manualTitle = document.getElementById('ns-sidebar-title-input')?.value?.trim();
            if (manualTitle) return manualTitle;

            const firstUser = STATE.messages.find(m => m.role === 'user');
            if (firstUser?.text) return firstUser.text.substring(0, 50);

            return document.title || 'Brave_Search_AI_Chat';
        },

        getOrderedSelectedMessages() {
            const selected = STATE.messages.filter(m => STATE.selectedIds.has(m.id));
            const researchMsgs = selected.filter(m => m.role === 'research');
            if (researchMsgs.length === 0) return selected;

            const nonResearch = selected.filter(m => m.role !== 'research');
            const firstUserIdx = nonResearch.findIndex(m => m.role === 'user');

            if (firstUserIdx !== -1) {
                return [
                    ...nonResearch.slice(0, firstUserIdx + 1),
                    ...researchMsgs,
                    ...nonResearch.slice(firstUserIdx + 1)
                ];
            }

            const firstAiIdx = nonResearch.findIndex(m => m.role === 'ai');
            if (firstAiIdx !== -1) {
                return [
                    ...nonResearch.slice(0, firstAiIdx),
                    ...researchMsgs,
                    ...nonResearch.slice(firstAiIdx)
                ];
            }

            return [...researchMsgs, ...nonResearch];
        },

        formatAugmentDetails(augData) {
            let block = `<details>\n<summary><b>📎 Search References ${augData.searchQuery ? `("${augData.searchQuery}")` : ''}</b></summary>\n\n`;
            augData.links.forEach(link => {
                block += `- [${link.title}](${link.href})${link.desc ? ` — *${link.desc}*` : ''}\n`;
            });
            return `${block}\n</details>\n\n`;
        },

        buildMarkdown() {
            const chatTitle = this.getChatTitle();
            const rounds = Extractors.extractSidebarRounds();
            const orderedMessages = this.getOrderedSelectedMessages();

            let md = [
                '---',
                '> **🤖 Model:** Brave Search AI',
                '>',
                `> **🌐 Exported:** ${new Date().toLocaleString()}`,
                '>',
                `> **🌐 Source:** [Brave Search AI](${window.location.href})`,
                '>',
                '> **🏷️ Tags:** Brave, AI-Chat, Noosphere, Search',
                '---',
                '',
                `# ${chatTitle}`,
                ''
            ].join('\n');

            if (rounds.length > 0) {
                md += '<details>\n<summary><b>🔄 Conversation Rounds / TOC</b></summary>\n\n';
                rounds.forEach((round, idx) => {
                    md += `${idx + 1}. **${round.label}**\n`;
                });
                md += '\n</details>\n\n';
            }

            md += '---\n\n';

            orderedMessages.forEach(msg => {
                if (msg.role === 'user') {
                    md += `#### Prompt - User 👤:\n\n${msg.text}\n\n---\n\n`;
                } else if (msg.role === 'ai') {
                    md += `#### Response - Brave Search AI 🤖:\n\n${msg.text}\n\n`;
                    (msg.augments || []).forEach(aug => { md += this.formatAugmentDetails(aug); });
                    md += '---\n\n';
                } else if (msg.role === 'augment') {
                    const aug = msg.augments?.[0];
                    if (aug?.links.length > 0) {
                        md += `${this.formatAugmentDetails(aug)}---\n\n`;
                    }
                } else if (msg.role === 'research' && msg.research) {
                    const res = msg.research;
                    md += `#### Response - Deep Research 🤖:\n\n`;

                    if (Object.keys(res.stats).length > 0) {
                        md += `**📊 Research Stats:** ${Object.entries(res.stats).map(([k, v]) => `${v} ${k}`).join(' | ')}\n\n`;
                    }
                    if (res.answers.length > 0) {
                        md += `${res.answers.join('\n\n')}\n\n`;
                    }
                    if (res.sources.length > 0) {
                        md += `<details>\n<summary><b>📚 Deep Research Sources (${res.sources.length})</b></summary>\n\n`;
                        res.sources.forEach(s => { md += `- [${s.label}](${s.href})\n`; });
                        md += '\n</details>\n\n';
                    }
                    if (res.progress) {
                        md += `*${res.progress}*\n\n`;
                    }
                    md += '---\n\n';
                }
            });

            md += '###### Noosphere Reflect\n###### ***Meaning Through Memory***\n\n###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n';
            return Utils.normalizeMarkdown(md);
        },

        buildJSON() {
            const orderedMessages = this.getOrderedSelectedMessages();

            const messages = orderedMessages.map(m => {
                if (m.role === 'user') return { role: 'user', content: m.text };
                if (m.role === 'ai') return { role: 'assistant', content: m.text, augments: m.augments };
                if (m.role === 'augment') return { role: 'augment', data: m.augments?.[0] || null };
                if (m.role === 'research') return { role: 'research', data: m.research };
                return null;
            }).filter(Boolean);

            return JSON.stringify({
                metadata: {
                    title: this.getChatTitle(),
                    exportedAt: new Date().toISOString(),
                    sourceUrl: window.location.href,
                    tocRounds: Extractors.extractSidebarRounds()
                },
                messages
            }, null, 2);
        },

        async executeCopy() {
            if (STATE.selectedIds.size === 0) {
                Utils.createNotification('⚠️ Please select at least one turn', false);
                return;
            }
            try {
                const content = STATE.exportFormat === 'json' ? this.buildJSON() : this.buildMarkdown();
                await navigator.clipboard.writeText(content);
                Utils.createNotification(`✅ Copied ${STATE.selectedIds.size} turns as ${STATE.exportFormat.toUpperCase()}!`);
            } catch (err) {
                console.error('[Noosphere Brave]', err);
                Utils.createNotification('❌ Clipboard export failed', false);
            }
        },

        async executeDownload() {
            if (STATE.selectedIds.size === 0) {
                Utils.createNotification('⚠️ Please select at least one turn', false);
                return;
            }
            try {
                const isJson = STATE.exportFormat === 'json';
                const content = isJson ? this.buildJSON() : this.buildMarkdown();
                const filename = `${Utils.sanitizeFilename(this.getChatTitle())}_${Utils.getDateString()}.${isJson ? 'json' : 'md'}`;
                const blob = new Blob([content], { type: `${isJson ? 'application/json' : 'text/markdown'};charset=utf-8` });
                const url = URL.createObjectURL(blob);
                const a = Object.assign(document.createElement('a'), { href: url, download: filename });

                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);

                Utils.createNotification(`✅ Downloaded ${filename}`);
            } catch (err) {
                console.error('[Noosphere Brave]', err);
                Utils.createNotification('❌ Download failed', false);
            }
        }
    };

    // ============================================================
    // UI Construction & Native Header Injection
    // ============================================================

    function injectStyles() {
        if (document.getElementById('noosphere-brave-sidebar-styles')) return;

        const style = document.createElement('style');
        style.id = 'noosphere-brave-sidebar-styles';
        style.textContent = `
            .ns-brave-header-btn {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                line-height: 1.45 !important;
                height: 36px !important;
                padding: 0 16px !important;
                gap: 6px !important;
                border-radius: 9999px !important;
                cursor: pointer !important;
                color: var(--ns-text-primary) !important;
                background: var(--ns-surface-pill) !important;
                border: 1px solid var(--ns-border-subtle) !important;
                transition: all 0.15s ease !important;
                user-select: none !important;
                margin: 0 8px !important;
                flex-shrink: 0 !important;
                white-space: nowrap !important;
            }
            .ns-brave-header-btn:hover {
                filter: brightness(0.95);
                border-color: var(--ns-border-strong) !important;
            }
            .ns-brave-header-btn:active {
                transform: scale(98.5%) !important;
            }

            #ns-sidebar-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.45);
                backdrop-filter: blur(6px);
                z-index: 100001;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            #ns-sidebar-overlay.active { display: block; opacity: 1; }

            #ns-sidebar {
                position: fixed;
                top: 0; right: -400px;
                width: 400px;
                height: 100%;
                background: var(--ns-surface-drawer);
                border-left: 1px solid var(--ns-border-subtle);
                color: var(--ns-text-primary);
                z-index: 100002;
                transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                flex-direction: column;
                box-shadow: var(--ns-shadow-drawer);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            #ns-sidebar.active { right: 0; }

            .ns-sidebar-header {
                padding: 20px 24px 16px;
                background: var(--ns-surface-sidebar);
                border-bottom: 1px solid var(--ns-border-hairline);
                display: flex;
                flex-direction: column;
                gap: 12px;
                flex-shrink: 0;
            }

            .ns-sidebar-title {
                font-family: Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 18px;
                font-weight: 600;
                line-height: 1.35;
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0;
                color: var(--ns-text-primary);
            }

            .ns-input-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .ns-label {
                font-size: 11px;
                line-height: 1.35;
                color: var(--ns-text-muted);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .ns-input {
                width: 100%;
                background: var(--ns-surface-input);
                border: 1px solid var(--ns-border-subtle);
                border-radius: 20px;
                padding: 10px 14px;
                color: var(--ns-text-primary);
                font-size: 15px;
                line-height: 1.60;
                outline: none;
                box-sizing: border-box;
                transition: border-color 0.15s ease, background 0.15s ease;
            }
            .ns-input:focus {
                background: var(--ns-surface-input-focused);
                border-color: var(--ns-border-focus);
            }

            .ns-batch-controls {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }

            .ns-batch-btn {
                padding: 8px;
                background: var(--ns-surface-pill);
                border: 1px solid var(--ns-border-subtle);
                border-radius: 9999px;
                color: var(--ns-text-secondary);
                font-size: 13px;
                font-weight: 500;
                line-height: 1.45;
                cursor: pointer;
                text-align: center;
                transition: all 0.15s ease;
            }
            .ns-batch-btn:hover {
                background: var(--ns-surface-pill-hover);
                color: var(--ns-text-primary);
                border-color: var(--ns-border-strong);
            }

            .ns-msg-list {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .ns-empty-state {
                padding: 24px;
                text-align: center;
                color: var(--ns-text-muted);
                font-size: 13px;
                line-height: 1.50;
            }

            .ns-msg-card {
                background: var(--ns-surface-card) !important;
                border: 1px solid var(--ns-border-hairline) !important;
                border-radius: 16px !important;
                overflow: hidden !important;
                flex-shrink: 0 !important;
                min-height: 52px !important;
                transition: all 0.15s ease;
                box-sizing: border-box !important;
                box-shadow: var(--ns-shadow-card);
            }
            .ns-msg-card:hover {
                border-color: var(--ns-border-subtle) !important;
                box-shadow: var(--ns-shadow-floating) !important;
            }

            .ns-msg-item {
                display: flex !important;
                align-items: flex-start !important;
                padding: 12px 16px !important;
                gap: 12px !important;
                cursor: pointer !important;
                box-sizing: border-box !important;
                min-height: 48px !important;
            }

            .ns-msg-check {
                appearance: none !important;
                -webkit-appearance: none !important;
                width: 18px !important;
                height: 18px !important;
                border: 2px solid var(--ns-brand-orange) !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                background: var(--ns-surface-card) !important;
                position: relative !important;
                flex-shrink: 0 !important;
                margin-top: 2px !important;
                transition: all 0.15s ease !important;
            }
            .ns-msg-check:checked {
                background: var(--ns-brand-orange) !important;
            }
            .ns-msg-check:checked::after {
                content: '✓' !important;
                position: absolute !important;
                color: var(--ns-on-brand) !important;
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
                font-size: 11px !important;
                line-height: 1.35;
                text-transform: uppercase !important;
                padding: 4px 8px !important;
                border-radius: 4px !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
            }
            .ns-role-user {
                background: var(--ns-accent-blue-subtle) !important;
                color: var(--ns-accent-blue) !important;
            }
            .ns-role-ai {
                background: rgba(251, 84, 43, 0.16) !important;
                color: var(--ns-brand-orange) !important;
            }
            .ns-role-augment {
                background: var(--ns-accent-purple-pill) !important;
                color: var(--ns-accent-purple-text) !important;
            }
            .ns-role-research {
                background: var(--ns-accent-green-subtle) !important;
                color: var(--ns-accent-green-text) !important;
            }

            .ns-aug-badge {
                font-size: 11px !important;
                line-height: 1.35;
                padding: 4px 8px !important;
                border-radius: 4px !important;
                background: var(--ns-accent-purple-pill) !important;
                color: var(--ns-accent-purple-text) !important;
            }

            .ns-msg-preview {
                font-size: 13px !important;
                line-height: 1.50 !important;
                color: var(--ns-text-secondary) !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                word-break: break-word !important;
            }

            .ns-msg-accordion {
                background: var(--ns-surface-card-subtle) !important;
                border-top: 1px solid var(--ns-border-hairline) !important;
                padding: 12px 16px 16px 46px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                font-size: 13px !important;
                line-height: 1.50 !important;
            }

            .ns-sec-header {
                font-size: 13px;
                font-weight: 600;
                line-height: 1.40;
                color: var(--ns-text-primary);
            }
            .ns-sec-header.is-research {
                color: var(--ns-accent-green-text);
            }

            .ns-msg-fulltext {
                color: var(--ns-text-primary);
                white-space: pre-wrap;
                max-height: 220px;
                overflow-y: auto;
                line-height: 1.50;
                font-size: 13px;
                padding-right: 4px;
            }

            .ns-aug-card-link {
                color: var(--ns-link);
                text-decoration: none;
                display: block;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 13px;
                line-height: 1.50;
            }
            .ns-aug-card-link:hover { text-decoration: underline; }

            .ns-aug-desc {
                color: var(--ns-text-muted);
                font-size: 12px;
                line-height: 1.40;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .ns-sidebar-footer {
                padding: 16px 20px;
                background: var(--ns-surface-sidebar);
                border-top: 1px solid var(--ns-border-hairline);
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }

            .ns-btn {
                font-size: 13px;
                font-weight: 500;
                line-height: 1.45;
                border-radius: 9999px;
                padding: 10px 14px;
                cursor: pointer;
                text-align: center;
                transition: all 0.15s ease;
                white-space: nowrap;
                border: none;
                outline: none;
            }

            .ns-btn-cancel {
                background: transparent;
                border: 1px solid var(--ns-border-subtle);
                color: var(--ns-text-secondary);
            }
            .ns-btn-cancel:hover {
                background: var(--ns-surface-pill);
                color: var(--ns-text-primary);
            }

            .ns-format-select {
                flex: 1;
                background: var(--ns-surface-input);
                border: 1px solid var(--ns-border-subtle);
                border-radius: 9999px;
                color: var(--ns-text-primary);
                padding: 10px 8px;
                outline: none;
                font-size: 12px;
                line-height: 1.40;
                cursor: pointer;
                text-align: center;
            }
            .ns-format-select option {
                background: var(--ns-surface-card);
                color: var(--ns-text-primary);
            }

            .ns-btn-copy {
                background: transparent;
                border: 1px solid var(--ns-border-subtle);
                color: var(--ns-text-primary);
            }
            .ns-btn-copy:hover {
                background: var(--ns-surface-pill);
            }

            .ns-btn-save {
                background: var(--ns-brand-orange);
                color: var(--ns-on-brand);
            }
            .ns-btn-save:hover {
                filter: brightness(1.08);
            }
        `;
        document.head.appendChild(style);
        syncTheme();
    }

    function el(tag, props = {}, children = []) {
        const node = document.createElement(tag);
        Object.entries(props).forEach(([k, v]) => {
            if (k === 'className') node.className = v;
            else if (k === 'textContent') node.textContent = v;
            else node.setAttribute(k, v);
        });
        children.forEach(c => c && node.appendChild(c));
        return node;
    }

    function renderMessageList() {
        const listContainer = document.getElementById('ns-msg-list');
        if (!listContainer) return;

        const prevScroll = listContainer.scrollTop;
        listContainer.innerHTML = '';

        if (STATE.messages.length === 0) {
            listContainer.appendChild(el('div', { className: 'ns-empty-state', textContent: 'No chat turns found.' }));
            return;
        }

        const roleConfig = {
            user: { icon: '👤', label: 'USER' },
            ai: { icon: '🦁', label: 'ASK BRAVE' },
            augment: { icon: '📎', label: 'AUGMENT' },
            research: { icon: '🔬', label: 'RESEARCH' }
        };

        STATE.messages.forEach(msg => {
            const roleMeta = roleConfig[msg.role] || { icon: '💬', label: msg.role.toUpperCase() };
            const totalAugLinks = msg.augments ? msg.augments.reduce((acc, a) => acc + a.links.length, 0) : 0;
            const isExpanded = STATE.expandedId === msg.id;

            const checkbox = el('input', { type: 'checkbox', className: 'ns-msg-check' });
            checkbox.checked = STATE.selectedIds.has(msg.id);

            const badgeGroup = el('div', { className: 'ns-role-badge-group' }, [
                el('span', { className: `ns-role-badge ns-role-${msg.role}`, textContent: `${roleMeta.icon} ${roleMeta.label}` }),
                totalAugLinks > 0
                    ? el('span', { className: 'ns-aug-badge', textContent: `📎 ${totalAugLinks} AUGMENT${totalAugLinks > 1 ? 'S' : ''}` })
                    : null
            ]);

            const item = el('div', { className: 'ns-msg-item' }, [
                checkbox,
                el('div', { className: 'ns-msg-content' }, [
                    badgeGroup,
                    el('div', { className: 'ns-msg-preview', textContent: msg.preview || (msg.role === 'user' ? 'User Prompt' : 'Brave Response') })
                ])
            ]);

            const card = el('div', { className: 'ns-msg-card' }, [item]);

            if (isExpanded) {
                const accordion = el('div', { className: 'ns-msg-accordion' });

                if (msg.text) {
                    accordion.appendChild(el('div', { className: 'ns-msg-fulltext', textContent: msg.text }));
                }

                (msg.augments || []).forEach(aug => {
                    if (aug.searchQuery) {
                        accordion.appendChild(el('div', { className: 'ns-sec-header', textContent: `Search Query: "${aug.searchQuery}"` }));
                    }
                    aug.links.forEach(link => {
                        accordion.appendChild(el('a', { className: 'ns-aug-card-link', href: link.href, target: '_blank', textContent: `🔗 ${link.title}` }));
                        if (link.desc) accordion.appendChild(el('div', { className: 'ns-aug-desc', textContent: link.desc }));
                    });
                });

                if (msg.role === 'research' && msg.research) {
                    const res = msg.research;
                    if (Object.keys(res.stats).length > 0) {
                        accordion.appendChild(el('div', {
                            className: 'ns-sec-header is-research',
                            textContent: '📊 Research Stats: ' + Object.entries(res.stats).map(([k, v]) => `${v} ${k}`).join(' | ')
                        }));
                    }
                    if (res.queries.length > 0) {
                        accordion.appendChild(el('div', { className: 'ns-sec-header', textContent: `📋 Queries Issued (${res.queries.length}):` }));
                        res.queries.forEach(q => accordion.appendChild(el('div', { className: 'ns-aug-desc', textContent: `> ${q}` })));
                    }
                    if (res.sources.length > 0) {
                        accordion.appendChild(el('div', { className: 'ns-sec-header', textContent: `📚 Examined Sources (${res.sources.length}):` }));
                        res.sources.slice(0, 10).forEach(src => {
                            accordion.appendChild(el('a', { className: 'ns-aug-card-link', href: src.href, target: '_blank', textContent: `🔗 ${src.label}` }));
                        });
                        if (res.sources.length > 10) {
                            accordion.appendChild(el('div', { className: 'ns-aug-desc', textContent: `...and ${res.sources.length - 10} more sources` }));
                        }
                    }
                }

                card.appendChild(accordion);
            }

            checkbox.onclick = (e) => {
                e.stopPropagation();
                if (STATE.selectedIds.has(msg.id)) STATE.selectedIds.delete(msg.id);
                else STATE.selectedIds.add(msg.id);
                checkbox.checked = STATE.selectedIds.has(msg.id);
            };

            item.onclick = (e) => {
                e.stopPropagation();
                STATE.expandedId = isExpanded ? null : msg.id;
                renderMessageList();
            };

            listContainer.appendChild(card);
        });

        listContainer.scrollTop = prevScroll;
    }

    function injectHeaderTrigger(openSidebarFn) {
        if (document.getElementById('ns-brave-header-btn')) return true;

        const container = document.querySelector(CONFIG.SELECTORS.HEADER_BUTTONS_CONTAINER);
        const navTabs = document.querySelector(CONFIG.SELECTORS.HEADER_TABS_NAV);
        const target = container || navTabs;
        if (!target) return false;

        const triggerBtn = el('button', {
            id: 'ns-brave-header-btn',
            type: 'button',
            className: 'ns-brave-header-btn',
            title: 'Noosphere Reflect Exporter',
            textContent: '🦁 Export'
        });
        triggerBtn.onclick = (e) => {
            e.stopPropagation();
            openSidebarFn();
        };

        if (container) {
            const shareBtn = container.querySelector(CONFIG.SELECTORS.SHARE_BUTTON);
            if (shareBtn) container.insertBefore(triggerBtn, shareBtn);
            else container.prepend(triggerBtn);
        } else {
            target.appendChild(triggerBtn);
        }

        syncTheme();
        return true;
    }

    function createSidebarUI() {
        if (document.getElementById('ns-sidebar')) return;

        const overlay = el('div', { id: 'ns-sidebar-overlay' });
        const sidebar = el('div', { id: 'ns-sidebar' });
        sidebar.innerHTML = `
            <div class="ns-sidebar-header">
                <div class="ns-sidebar-title">🦁 Ask Brave Exporter</div>
                <div class="ns-input-group">
                    <span class="ns-label">Chat Title</span>
                    <input type="text" id="ns-sidebar-title-input" class="ns-input" placeholder="e.g. Brave Search DOM Scraping Session">
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
                <button class="ns-btn ns-btn-save" id="ns-btn-save">💾 Save</button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(sidebar);

        const openSidebar = () => {
            syncTheme();
            scanThreadMessages();
            renderMessageList();
            overlay.classList.add('active');
            sidebar.classList.add('active');
        };

        const closeSidebar = () => {
            overlay.classList.remove('active');
            sidebar.classList.remove('active');
        };

        const watchHeaderMount = () => {
            if (injectHeaderTrigger(openSidebar)) return;
            const obs = new MutationObserver(() => {
                if (injectHeaderTrigger(openSidebar)) obs.disconnect();
            });
            obs.observe(document.body, { childList: true, subtree: true });
        };

        watchHeaderMount();

        // Re-check header mount on SvelteKit SPA navigations without observing every token stream
        ['pushState', 'replaceState'].forEach(fn => {
            const orig = history[fn];
            history[fn] = function (...args) {
                const res = orig.apply(this, args);
                setTimeout(watchHeaderMount, 100);
                return res;
            };
        });
        window.addEventListener('popstate', () => setTimeout(watchHeaderMount, 100));

        const themeObserver = new MutationObserver(() => syncTheme());
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-scheme', 'style'] });
        if (document.body) {
            themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
        }
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', syncTheme);

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
        document.getElementById('ns-btn-save').onclick = () => ExportService.executeDownload();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeSidebar();
        });
    }

    function init() {
        console.log('🦁 Noosphere Reflect — Ask Brave Search AI Interactive Exporter Initialized');
        injectStyles();
        createSidebarUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
