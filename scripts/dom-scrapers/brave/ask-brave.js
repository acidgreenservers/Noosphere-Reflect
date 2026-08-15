(function () {
    'use strict';

    /*
     * ============================================================
     * Noosphere Reflect — Ask Brave Search AI Interactive Exporter
     * ============================================================
     *
     * Interactive Userscript & Console Exporter for Ask Brave Chat
     * (search.brave.com/ask).
     *
     * Features:
     *   - Integrated Native Header Trigger: Compact pill (🦁 Export) sitting
     *     natively beside Share with zero layout overlap
     *   - Interactive Accordion Sidebar: Click turns to expand/collapse
     *     and scroll full message text, Deep Research stats, and Augments inline.
     *   - Automated Deep Research Positioning: Places Deep Research outputs
     *     deterministically after User Prompt 1 & before AI Response 1.
     *   - Augment & Research Count Badges (`📎 N AUGMENTS`, `🔬 RESEARCH`).
     *   - Custom Chat Title input & batch selection controls.
     *   - Full recursive DOM-to-Markdown parser preserving formatting.
     *   - Automatic extraction of Sidebar Rounds / TOC into collapsible accordions.
     *   - Polished Footer Layout: Cancel | Format Select | Copy | Save.
     *   - DESIGN.md stealth dark aesthetic (charcoal-black + Brave orange).
     *
     * Namespace: ns-brave-sidebar
     * ============================================================
     */

    const CONFIG = {
        SELECTORS: {
            USER_MESSAGE: '.message.user',
            USER_BUBBLE: '.user-bubble',
            AI_MESSAGE: '.message.assistant.llm-output',
            AUGMENT_MESSAGE: '.message.augment',
            RESEARCH_MESSAGE: '.message.research',

            TOC_SECTION: 'a.sidebar-history-toc-section',
            HEADER_BUTTONS_CONTAINER: '.ask-center-header-buttons',
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

            NOISE_ELEMENTS: 'button.inline-citation, div.copy-button, svg, .user-message-actions'
        },

        // Ask Brave Design Tokens (from DESIGN.md — stealth dark aesthetic)
        THEME: {
            CANVAS: '#141517',
            CANVAS_SUBTLE: '#18191c',
            SURFACE_SIDEBAR: '#101114',
            SURFACE_CARD: '#1e2025',
            SURFACE_CARD_SUBTLE: '#181a1e',
            SURFACE_DRAWER: '#181a1f',
            SURFACE_INPUT: '#272a30',
            SURFACE_INPUT_FOCUSED: '#2f333b',
            SURFACE_PILL: '#2a2d35',
            SURFACE_PILL_HOVER: '#343842',
            BRAND_ORANGE: '#fb542b',
            BRAND_ORANGE_DEEP: '#de3e16',
            ACCENT_BLUE: '#4c6ef5',
            ACCENT_BLUE_SUBTLE: 'rgba(76, 110, 245, 0.18)',
            ACCENT_BLUE_PILL: '#2b3452',
            ACCENT_PURPLE_PILL: '#352e4d',
            BUTTON_PRIMARY_LIGHT: '#cbd5e1',
            BUTTON_PRIMARY_LIGHT_ACTIVE: '#ffffff',
            TEXT_PRIMARY: '#f1f3f5',
            TEXT_SECONDARY: '#a0a6b1',
            TEXT_MUTED: '#6c727e',
            TEXT_DIM: '#4e5460',
            ON_BRAND: '#ffffff',
            ON_PILL_LIGHT: '#0f172a',
            LINK: '#748ffc',
            BORDER_HAIRLINE: 'rgba(255, 255, 255, 0.05)',
            BORDER_SUBTLE: 'rgba(255, 255, 255, 0.09)',
            BORDER_STRONG: 'rgba(255, 255, 255, 0.16)',
            BORDER_FOCUS: '#4c6ef5',
            SHADOW_CARD: '0 4px 16px rgba(0, 0, 0, 0.25)',
            SHADOW_FLOATING: '0 8px 30px rgba(0, 0, 0, 0.40)',
            SHADOW_DRAWER: '0 12px 40px rgba(0, 0, 0, 0.50)'
        }
    };

    const STATE = {
        messages: [],
        selectedIds: new Set(),
        expandedId: null,
        exportFormat: 'markdown'
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
                background: success ? CONFIG.THEME.BRAND_ORANGE : '#dc2626',
                color: CONFIG.THEME.ON_BRAND,
                padding: '10px 20px',
                borderRadius: '9999px',
                zIndex: '200000',
                fontSize: '13px',
                fontWeight: '500',
                lineHeight: '1.45',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxShadow: CONFIG.THEME.SHADOW_FLOATING,
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

    function renderNodeToMarkdown(node) {
        if (!node) return '';

        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        if (node.matches(CONFIG.SELECTORS.NOISE_ELEMENTS)) {
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
                clone.querySelectorAll('div.copy-button, button, svg').forEach(n => n.remove());
                const lang = clone.getAttribute('data-lang') || '';
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
    // DOM Extractors
    // ============================================================

    const Extractors = {
        extractSidebarRounds() {
            const sections = Array.from(document.querySelectorAll(CONFIG.SELECTORS.TOC_SECTION));
            if (!sections.length) return [];

            return sections.map(sec => {
                const titleAttr = sec.getAttribute('title');
                const textSpan = sec.querySelector('span');
                const label = titleAttr || Utils.cleanText(textSpan?.innerText || sec.innerText || '');
                const href = sec.getAttribute('href') || '';
                return { label, href };
            }).filter(s => s.label);
        },

        extractUserMessage(container) {
            const bubble = container.querySelector(CONFIG.SELECTORS.USER_BUBBLE) || container;
            return Utils.cleanText(bubble.innerText || '');
        },

        extractAIMessage(container) {
            return htmlToMarkdown(container);
        },

        extractAugmentCards(container) {
            const cards = Array.from(container.querySelectorAll(CONFIG.SELECTORS.ENRICHMENT_CARD_ITEM));
            const queryEl = container.querySelector(CONFIG.SELECTORS.ENRICHMENT_FOOTER_QUERY);
            const searchQuery = Utils.cleanText(queryEl?.innerText || '');

            const links = cards.map(card => {
                const href = card.getAttribute('href') || '';
                const titleEl = card.querySelector(CONFIG.SELECTORS.ENRICHMENT_CARD_TITLE);
                const descEl = card.querySelector(CONFIG.SELECTORS.ENRICHMENT_CARD_DESC);

                const title = Utils.cleanText(titleEl?.innerText || href);
                const desc = Utils.cleanText(descEl?.innerText || '');

                if (!href) return null;
                return { href, title, desc };
            }).filter(Boolean);

            return { searchQuery, links };
        },

        extractDeepResearch(container) {
            const panel = container.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_CONTAINER) || container;

            const stats = {};
            panel.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_STATS_ITEM).forEach(item => {
                const val = item.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_STATS_VALUE)?.innerText?.trim();
                const label = item.querySelector('.long-label, .short-label, .deep-research-stats-item-label')?.innerText?.trim();
                if (val && label) stats[label] = val;
            });

            const answers = [];
            panel.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_ANSWER_CONTENT).forEach(ans => {
                const md = htmlToMarkdown(ans);
                if (md) answers.push(md);
            });

            const queries = [];
            panel.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_QUERIES + ' ' + CONFIG.SELECTORS.DEEP_RESEARCH_QUERY).forEach(q => {
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
        STATE.messages = [];

        const elements = Array.from(document.querySelectorAll([
            CONFIG.SELECTORS.USER_MESSAGE,
            CONFIG.SELECTORS.AI_MESSAGE,
            CONFIG.SELECTORS.AUGMENT_MESSAGE,
            CONFIG.SELECTORS.RESEARCH_MESSAGE
        ].join(', ')));

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
                        element: el,
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
                        element: el,
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
                            element: el,
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
                    element: el,
                    augments: [],
                    research: resData
                });
            }
        });

        if (STATE.selectedIds.size === 0) {
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

            const firstUserMsg = document.querySelector(CONFIG.SELECTORS.USER_BUBBLE);
            if (firstUserMsg) {
                return Utils.cleanText(firstUserMsg.innerText).substring(0, 50);
            }

            return document.title || 'Brave_Search_AI_Chat';
        },

        getOrderedSelectedMessages() {
            const selected = STATE.messages.filter(m => STATE.selectedIds.has(m.id));
            const researchMsgs = selected.filter(m => m.role === 'research');

            if (researchMsgs.length === 0) return selected;

            const nonResearch = selected.filter(m => m.role !== 'research');
            const firstUserIdx = nonResearch.findIndex(m => m.role === 'user');

            const reordered = [];
            if (firstUserIdx !== -1) {
                reordered.push(...nonResearch.slice(0, firstUserIdx + 1));
                reordered.push(...researchMsgs);
                reordered.push(...nonResearch.slice(firstUserIdx + 1));
            } else {
                const firstAiIdx = nonResearch.findIndex(m => m.role === 'ai');
                if (firstAiIdx !== -1) {
                    reordered.push(...nonResearch.slice(0, firstAiIdx));
                    reordered.push(...researchMsgs);
                    reordered.push(...nonResearch.slice(firstAiIdx));
                } else {
                    reordered.push(...researchMsgs, ...nonResearch);
                }
            }

            return reordered;
        },

        buildMarkdown() {
            const chatTitle = this.getChatTitle();
            const sourceUrl = window.location.href;
            const exportedAt = new Date().toLocaleString();
            const rounds = Extractors.extractSidebarRounds();
            const orderedMessages = this.getOrderedSelectedMessages();

            let md = '';

            md += '---\n';
            md += '> **🤖 Model:** Brave Search AI\n>\n';
            md += `> **🌐 Exported:** ${exportedAt}\n>\n`;
            md += `> **🌐 Source:** [Brave Search AI](${sourceUrl})\n>\n`;
            md += '> **🏷️ Tags:** Brave, AI-Chat, Noosphere, Search\n';
            md += '---\n\n';

            md += `# ${chatTitle}\n\n`;

            if (rounds.length > 0) {
                md += '<details>\n';
                md += '<summary><b>🔄 Conversation Rounds / TOC</b></summary>\n\n';
                rounds.forEach((round, idx) => {
                    md += `${idx + 1}. **${round.label}**\n`;
                });
                md += '\n</details>\n\n';
            }

            md += '---\n\n';

            orderedMessages.forEach(msg => {
                const el = msg.element;

                if (msg.role === 'user') {
                    const userText = Extractors.extractUserMessage(el);
                    md += `#### Prompt - User 👤:\n\n${userText}\n\n---\n\n`;
                }
                else if (msg.role === 'ai') {
                    const aiMd = Extractors.extractAIMessage(el);
                    md += `#### Response - Brave Search AI 🤖:\n\n${aiMd}\n\n`;

                    if (msg.augments && msg.augments.length > 0) {
                        msg.augments.forEach(augData => {
                            md += `<details>\n<summary><b>📎 Search References ${augData.searchQuery ? `("${augData.searchQuery}")` : ''}</b></summary>\n\n`;
                            augData.links.forEach(link => {
                                md += `- [${link.title}](${link.href}) ${link.desc ? `— *${link.desc}*` : ''}\n`;
                            });
                            md += '\n</details>\n\n';
                        });
                    }

                    md += '---\n\n';
                }
                else if (msg.role === 'augment') {
                    const augmentData = Extractors.extractAugmentCards(el);
                    if (augmentData.links.length > 0) {
                        md += `<details>\n<summary><b>📎 Search References ${augmentData.searchQuery ? `("${augmentData.searchQuery}")` : ''}</b></summary>\n\n`;
                        augmentData.links.forEach(link => {
                            md += `- [${link.title}](${link.href}) ${link.desc ? `— *${link.desc}*` : ''}\n`;
                        });
                        md += '\n</details>\n\n---\n\n';
                    }
                }
                else if (msg.role === 'research') {
                    const research = Extractors.extractDeepResearch(el);
                    md += `#### Response - Deep Research 🤖:\n\n`;

                    if (Object.keys(research.stats).length > 0) {
                        md += `**📊 Research Stats:** `;
                        md += Object.entries(research.stats).map(([k, v]) => `${v} ${k}`).join(' | ');
                        md += '\n\n';
                    }

                    if (research.answers.length > 0) {
                        md += `${research.answers.join('\n\n')}\n\n`;
                    }

                    if (research.sources.length > 0) {
                        md += `<details>\n<summary><b>📚 Deep Research Sources (${research.sources.length})</b></summary>\n\n`;
                        research.sources.forEach(s => {
                            md += `- [${s.label}](${s.href})\n`;
                        });
                        md += '\n</details>\n\n';
                    }

                    if (research.progress) {
                        md += `*${research.progress}*\n\n`;
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
            const chatTitle = this.getChatTitle();
            const rounds = Extractors.extractSidebarRounds();
            const orderedMessages = this.getOrderedSelectedMessages();

            const exportedMessages = orderedMessages.map(m => {
                if (m.role === 'user') {
                    return { role: 'user', content: Extractors.extractUserMessage(m.element) };
                }
                if (m.role === 'ai') {
                    return { role: 'assistant', content: Extractors.extractAIMessage(m.element), augments: m.augments };
                }
                if (m.role === 'augment') {
                    return { role: 'augment', data: Extractors.extractAugmentCards(m.element) };
                }
                if (m.role === 'research') {
                    return { role: 'research', data: Extractors.extractDeepResearch(m.element) };
                }
                return null;
            }).filter(Boolean);

            return JSON.stringify({
                metadata: {
                    title: chatTitle,
                    exportedAt: new Date().toISOString(),
                    sourceUrl: window.location.href,
                    tocRounds: rounds
                },
                messages: exportedMessages
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
                const title = this.getChatTitle();
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

        const T = CONFIG.THEME;
        const style = document.createElement('style');
        style.id = 'noosphere-brave-sidebar-styles';
        style.textContent = `
            /* Native Header Pill Trigger */
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
                color: ${T.TEXT_PRIMARY} !important;
                background: ${T.SURFACE_PILL} !important;
                border: 1px solid ${T.BORDER_SUBTLE} !important;
                transition: all 0.15s ease !important;
                user-select: none !important;
                margin-left: 8px !important;
                margin-right: 8px !important;
                flex-shrink: 0 !important;
                white-space: nowrap !important;
            }
            .ns-brave-header-btn:hover {
                background: ${T.SURFACE_PILL_HOVER} !important;
                border-color: ${T.BORDER_STRONG} !important;
            }
            .ns-brave-header-btn:active {
                transform: scale(98.5%) !important;
            }

            #ns-sidebar-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5);
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
                background: ${T.SURFACE_DRAWER};
                border-left: 1px solid ${T.BORDER_SUBTLE};
                color: ${T.TEXT_PRIMARY};
                z-index: 100002;
                transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                flex-direction: column;
                box-shadow: ${T.SHADOW_DRAWER};
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            #ns-sidebar.active { right: 0; }

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
                font-family: Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 18px;
                font-weight: 600;
                line-height: 1.35;
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
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 11px;
                font-weight: 400;
                line-height: 1.35;
                color: ${T.TEXT_MUTED};
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .ns-input {
                width: 100%;
                background: ${T.SURFACE_INPUT};
                border: 1px solid ${T.BORDER_SUBTLE};
                border-radius: 20px;
                padding: 10px 14px;
                color: ${T.TEXT_PRIMARY};
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 15px;
                font-weight: 400;
                line-height: 1.60;
                outline: none;
                box-sizing: border-box;
                transition: border-color 0.15s ease, background 0.15s ease;
            }
            .ns-input:focus {
                background: ${T.SURFACE_INPUT_FOCUSED};
                border-color: ${T.BORDER_FOCUS};
            }

            .ns-batch-controls {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }

            .ns-batch-btn {
                padding: 8px;
                background: ${T.SURFACE_PILL};
                border: 1px solid ${T.BORDER_SUBTLE};
                border-radius: 9999px;
                color: ${T.TEXT_SECONDARY};
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 13px;
                font-weight: 500;
                line-height: 1.45;
                cursor: pointer;
                text-align: center;
                transition: all 0.15s ease;
            }
            .ns-batch-btn:hover {
                background: ${T.SURFACE_PILL_HOVER};
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
                border-radius: 16px !important;
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
                border: 2px solid ${T.BRAND_ORANGE} !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                background: ${T.SURFACE_CARD} !important;
                position: relative !important;
                flex-shrink: 0 !important;
                margin-top: 2px !important;
                transition: all 0.15s ease !important;
            }
            .ns-msg-check:checked {
                background: ${T.BRAND_ORANGE} !important;
            }
            .ns-msg-check:checked::after {
                content: '✓' !important;
                position: absolute !important;
                color: ${T.ON_BRAND} !important;
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
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 11px !important;
                font-weight: 400;
                line-height: 1.35;
                text-transform: uppercase !important;
                padding: 4px 8px !important;
                border-radius: 4px !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
            }
            .ns-role-user {
                background: ${T.ACCENT_BLUE_SUBTLE} !important;
                color: ${T.ACCENT_BLUE} !important;
            }
            .ns-role-ai {
                background: rgba(251, 84, 43, 0.18) !important;
                color: ${T.BRAND_ORANGE} !important;
            }
            .ns-role-augment {
                background: ${T.ACCENT_PURPLE_PILL} !important;
                color: #a78bfa !important;
            }
            .ns-role-research {
                background: rgba(16, 185, 129, 0.18) !important;
                color: #6ee7b7 !important;
            }

            .ns-aug-badge {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 11px !important;
                font-weight: 400;
                line-height: 1.35;
                padding: 4px 8px !important;
                border-radius: 4px !important;
                background: ${T.ACCENT_PURPLE_PILL} !important;
                color: #a78bfa !important;
            }

            .ns-msg-preview {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 13px !important;
                font-weight: 400 !important;
                line-height: 1.50 !important;
                color: ${T.TEXT_SECONDARY} !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                word-break: break-word !important;
            }

            /* Scrollable Accordion Content */
            .ns-msg-accordion {
                background: ${T.SURFACE_CARD_SUBTLE} !important;
                border-top: 1px solid ${T.BORDER_HAIRLINE} !important;
                padding: 12px 16px 16px 46px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 13px !important;
                font-weight: 400 !important;
                line-height: 1.50 !important;
            }

            .ns-msg-fulltext {
                color: ${T.TEXT_PRIMARY};
                white-space: pre-wrap;
                max-height: 220px;
                overflow-y: auto;
                line-height: 1.50;
                font-size: 13px;
                padding-right: 4px;
            }

            .ns-aug-card-link {
                color: ${T.LINK};
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
                color: ${T.TEXT_MUTED};
                font-size: 12px;
                line-height: 1.40;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
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
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 12px;
                font-weight: 400;
                line-height: 1.40;
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

        `;
        document.head.appendChild(style);
    }

    function renderMessageList() {
        const listContainer = document.getElementById('ns-msg-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (STATE.messages.length === 0) {
            listContainer.innerHTML = `<div style="padding:24px; text-align:center; color:${CONFIG.THEME.TEXT_MUTED}; font-family:-apple-system,system-ui,sans-serif; font-size:13px; font-weight:400; line-height:1.50;">No chat turns found.</div>`;
            return;
        }

        const roleConfig = {
            user: { icon: '👤', label: 'USER' },
            ai: { icon: '🦁', label: 'ASK BRAVE' },
            augment: { icon: '📎', label: 'AUGMENT' },
            research: { icon: '🔬', label: 'RESEARCH' }
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

            const totalAugLinks = msg.augments ? msg.augments.reduce((acc, a) => acc + a.links.length, 0) : 0;
            if (totalAugLinks > 0) {
                const augBadge = document.createElement('span');
                augBadge.className = 'ns-aug-badge';
                augBadge.textContent = `📎 ${totalAugLinks} AUGMENT${totalAugLinks > 1 ? 'S' : ''}`;
                badgeGroup.appendChild(augBadge);
            }

            const preview = document.createElement('div');
            preview.className = 'ns-msg-preview';
            preview.textContent = msg.preview || (msg.role === 'user' ? 'User Prompt' : 'Brave Response');

            content.appendChild(badgeGroup);
            content.appendChild(preview);

            item.appendChild(checkbox);
            item.appendChild(content);

            card.appendChild(item);

            const isExpanded = STATE.expandedId === msg.id;

            if (isExpanded) {
                const accordion = document.createElement('div');
                accordion.className = 'ns-msg-accordion';

                if (msg.text) {
                    const fullText = document.createElement('div');
                    fullText.className = 'ns-msg-fulltext';
                    fullText.textContent = msg.text;
                    accordion.appendChild(fullText);
                }

                if (totalAugLinks > 0 || (msg.augments && msg.augments.length > 0)) {
                    msg.augments.forEach(aug => {
                        if (aug.searchQuery) {
                            const qLabel = document.createElement('div');
                            qLabel.style.fontFamily = '-apple-system, system-ui, sans-serif';
                            qLabel.style.fontSize = '13px';
                            qLabel.style.fontWeight = '600';
                            qLabel.style.lineHeight = '1.40';
                            qLabel.style.color = CONFIG.THEME.TEXT_PRIMARY;
                            qLabel.textContent = `Search Query: "${aug.searchQuery}"`;
                            accordion.appendChild(qLabel);
                        }

                        aug.links.forEach(link => {
                            const linkEl = document.createElement('a');
                            linkEl.className = 'ns-aug-card-link';
                            linkEl.href = link.href;
                            linkEl.target = '_blank';
                            linkEl.textContent = `🔗 ${link.title}`;

                            accordion.appendChild(linkEl);

                            if (link.desc) {
                                const descEl = document.createElement('div');
                                descEl.className = 'ns-aug-desc';
                                descEl.textContent = link.desc;
                                accordion.appendChild(descEl);
                            }
                        });
                    });
                }

                if (msg.role === 'research' && msg.research) {
                    const res = msg.research;

                    if (Object.keys(res.stats).length > 0) {
                        const statsHeader = document.createElement('div');
                        statsHeader.style.fontFamily = '-apple-system, system-ui, sans-serif';
                        statsHeader.style.fontSize = '13px';
                        statsHeader.style.fontWeight = '600';
                        statsHeader.style.lineHeight = '1.20';
                        statsHeader.style.color = '#6ee7b7';
                        statsHeader.textContent = '📊 Research Stats: ' + Object.entries(res.stats).map(([k, v]) => `${v} ${k}`).join(' | ');
                        accordion.appendChild(statsHeader);
                    }

                    if (res.queries.length > 0) {
                        const qHeader = document.createElement('div');
                        qHeader.style.fontFamily = '-apple-system, system-ui, sans-serif';
                        qHeader.style.fontSize = '13px';
                        qHeader.style.fontWeight = '600';
                        qHeader.style.lineHeight = '1.40';
                        qHeader.style.color = CONFIG.THEME.TEXT_PRIMARY;
                        qHeader.textContent = `📋 Queries Issued (${res.queries.length}):`;
                        accordion.appendChild(qHeader);

                        res.queries.forEach(q => {
                            const qItem = document.createElement('div');
                            qItem.className = 'ns-aug-desc';
                            qItem.textContent = `> ${q}`;
                            accordion.appendChild(qItem);
                        });
                    }

                    if (res.sources.length > 0) {
                        const sHeader = document.createElement('div');
                        sHeader.style.fontFamily = '-apple-system, system-ui, sans-serif';
                        sHeader.style.fontSize = '13px';
                        sHeader.style.fontWeight = '600';
                        sHeader.style.lineHeight = '1.40';
                        sHeader.style.color = CONFIG.THEME.TEXT_PRIMARY;
                        sHeader.textContent = `📚 Examined Sources (${res.sources.length}):`;
                        accordion.appendChild(sHeader);

                        res.sources.slice(0, 10).forEach(src => {
                            const linkEl = document.createElement('a');
                            linkEl.className = 'ns-aug-card-link';
                            linkEl.href = src.href;
                            linkEl.target = '_blank';
                            linkEl.textContent = `🔗 ${src.label}`;
                            accordion.appendChild(linkEl);
                        });

                        if (res.sources.length > 10) {
                            const moreLabel = document.createElement('div');
                            moreLabel.className = 'ns-aug-desc';
                            moreLabel.textContent = `...and ${res.sources.length - 10} more sources`;
                            accordion.appendChild(moreLabel);
                        }
                    }
                }

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
        if (document.getElementById('ns-brave-header-btn')) return;

        const container = document.querySelector(CONFIG.SELECTORS.HEADER_BUTTONS_CONTAINER);
        if (!container) return;

        const triggerBtn = document.createElement('button');
        triggerBtn.id = 'ns-brave-header-btn';
        triggerBtn.type = 'button';
        triggerBtn.className = 'ns-brave-header-btn';
        triggerBtn.title = 'Noosphere Reflect Exporter';
        triggerBtn.innerHTML = `🦁 Export`;
        triggerBtn.onclick = (e) => {
            e.stopPropagation();
            openSidebarFn();
        };

        const shareBtn = container.querySelector(CONFIG.SELECTORS.SHARE_BUTTON);
        if (shareBtn) {
            container.insertBefore(triggerBtn, shareBtn);
        } else {
            container.prepend(triggerBtn);
        }
    }

    function createSidebarUI() {
        if (document.getElementById('ns-sidebar')) return;

        const overlay = document.createElement('div');
        overlay.id = 'ns-sidebar-overlay';

        const sidebar = document.createElement('div');
        sidebar.id = 'ns-sidebar';
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