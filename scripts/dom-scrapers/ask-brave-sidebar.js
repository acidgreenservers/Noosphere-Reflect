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
     *   - Interactive Accordion Sidebar: Click turns to expand/collapse
     *     and scroll full message text, Deep Research stats, and Augments inline.
     *   - Automated Deep Research Positioning: Places Deep Research outputs
     *     deterministically after User Prompt 1 & before AI Response 1.
     *   - Augment & Research Count Badges (`📎 N AUGMENTS`, `🔬 RESEARCH`).
     *   - Custom Chat Title input & batch selection controls.
     *   - Full recursive DOM-to-Markdown parser preserving formatting.
     *   - Automatic extraction of Sidebar Rounds / TOC into collapsible accordions.
     *   - Polished Footer Layout: Cancel | Format Select | Copy | Save.
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

        UI: {
            ORB_RIGHT: 25,
            ORB_BOTTOM: 25
        },

        THEME: {
            PRIMARY: '#fb542b',
            PRIMARY_HOVER: '#e04a22',
            PURPLE: '#8b5cf6',
            BG_GLASS: 'rgba(17, 24, 39, 0.95)',
            BORDER: 'rgba(255, 255, 255, 0.12)'
        }
    };

    const STATE = {
        messages: [],
        selectedIds: new Set(),
        expandedId: null, // Single-expanded turn focus
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
                background: success ? CONFIG.THEME.PRIMARY : '#dc2626',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '200000',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                transition: 'opacity 0.3s ease',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
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
    // UI Construction & Interactive Accordion Renderer
    // ============================================================

    function injectStyles() {
        if (document.getElementById('noosphere-brave-sidebar-styles')) return;

        const style = document.createElement('style');
        style.id = 'noosphere-brave-sidebar-styles';
        style.textContent = `
            .ns-orb {
                position: fixed;
                bottom: ${CONFIG.UI.ORB_BOTTOM}px;
                right: ${CONFIG.UI.ORB_RIGHT}px;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, ${CONFIG.THEME.PRIMARY}, ${CONFIG.THEME.PURPLE});
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 100000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.35);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                border: 2px solid rgba(255,255,255,0.2);
                color: white;
                user-select: none;
                font-size: 24px;
            }

            .ns-orb:hover {
                transform: scale(1.1) rotate(5deg);
                box-shadow: 0 6px 25px rgba(251,84,43,0.4);
            }

            #ns-sidebar-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.4);
                backdrop-filter: blur(4px);
                z-index: 100001;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            #ns-sidebar-overlay.active { display: block; opacity: 1; }

            #ns-sidebar {
                position: fixed;
                top: 0; right: -380px;
                width: 380px;
                height: 100%;
                background: ${CONFIG.THEME.BG_GLASS};
                backdrop-filter: blur(20px);
                border-left: 1px solid ${CONFIG.THEME.BORDER};
                color: white;
                z-index: 100002;
                transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                flex-direction: column;
                box-shadow: -10px 0 30px rgba(0,0,0,0.5);
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            #ns-sidebar.active { right: 0; }

            .ns-sidebar-header {
                padding: 18px 20px 14px;
                background: rgba(255,255,255,0.03);
                border-bottom: 1px solid ${CONFIG.THEME.BORDER};
                display: flex;
                flex-direction: column;
                gap: 12px;
                flex-shrink: 0;
            }

            .ns-sidebar-title {
                font-size: 16px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0;
            }

            .ns-input-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .ns-label {
                font-size: 11px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.6);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .ns-input {
                width: 100%;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                padding: 8px 10px;
                color: white;
                font-size: 12px;
                outline: none;
                box-sizing: border-box;
            }
            .ns-input:focus { border-color: ${CONFIG.THEME.PRIMARY}; }

            .ns-batch-controls {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 6px;
            }

            .ns-batch-btn {
                padding: 5px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid ${CONFIG.THEME.BORDER};
                border-radius: 6px;
                color: rgba(255, 255, 255, 0.7);
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s ease;
            }
            .ns-batch-btn:hover { background: rgba(255, 255, 255, 0.12); color: white; }

            .ns-msg-list {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .ns-msg-card {
                background: rgba(255, 255, 255, 0.03) !important;
                border: 1px solid rgba(255, 255, 255, 0.06) !important;
                border-radius: 8px !important;
                overflow: hidden !important;
                flex-shrink: 0 !important;
                height: auto !important;
                min-height: 52px !important;
                max-height: none !important;
                transition: all 0.2s ease;
                box-sizing: border-box !important;
            }
            .ns-msg-card:hover {
                border-color: rgba(255, 255, 255, 0.18) !important;
                background: rgba(255, 255, 255, 0.06) !important;
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
                border: 2px solid ${CONFIG.THEME.PRIMARY} !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                background: rgba(0,0,0,0.3) !important;
                position: relative !important;
                flex-shrink: 0 !important;
                margin-top: 2px !important;
            }
            .ns-msg-check:checked {
                background: ${CONFIG.THEME.PRIMARY} !important;
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
            .ns-role-ai { background: rgba(251, 84, 43, 0.25) !important; color: #fca5a5 !important; }
            .ns-role-augment { background: rgba(139, 92, 246, 0.25) !important; color: #c4b5fd !important; }
            .ns-role-research { background: rgba(16, 185, 129, 0.25) !important; color: #6ee7b7 !important; }

            .ns-aug-badge {
                font-size: 9px !important;
                font-weight: 700 !important;
                padding: 1px 6px !important;
                border-radius: 4px !important;
                background: rgba(139, 92, 246, 0.2) !important;
                border: 1px solid rgba(139, 92, 246, 0.3) !important;
                color: #c4b5fd !important;
            }

            .ns-msg-preview {
                font-size: 12px !important;
                line-height: 1.4 !important;
                color: rgba(255, 255, 255, 0.7) !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                word-break: break-word !important;
            }

            /* Scrollable Accordion Content */
            .ns-msg-accordion {
                background: rgba(0, 0, 0, 0.3) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
                padding: 10px 12px 12px 42px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                font-size: 12px !important;
            }

            .ns-msg-fulltext {
                color: #e5e7eb;
                white-space: pre-wrap;
                max-height: 220px;
                overflow-y: auto;
                line-height: 1.4;
                font-size: 12px;
                padding-right: 4px;
            }

            .ns-aug-card-link {
                color: #93c5fd;
                text-decoration: none;
                display: block;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .ns-aug-card-link:hover { text-decoration: underline; }

            .ns-aug-desc {
                color: rgba(255, 255, 255, 0.5);
                font-size: 10px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .ns-sidebar-footer {
                padding: 14px 16px;
                background: rgba(255,255,255,0.03);
                border-top: 1px solid ${CONFIG.THEME.BORDER};
                display: flex;
                align-items: center;
                gap: 6px;
                flex-shrink: 0;
            }

            .ns-btn {
                border: 1px solid ${CONFIG.THEME.BORDER};
                border-radius: 8px;
                padding: 8px 10px;
                background: rgba(255,255,255,0.05);
                color: white;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
                text-align: center;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            .ns-btn:hover { background: rgba(255,255,255,0.12); }

            .ns-btn-cancel {
                background: rgba(239, 68, 68, 0.15);
                border-color: rgba(239, 68, 68, 0.3);
                color: #fca5a5;
                flex: 0.8;
            }
            .ns-btn-cancel:hover { background: rgba(239, 68, 68, 0.25); }

            .ns-format-select {
                flex: 1.2;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid ${CONFIG.THEME.BORDER};
                border-radius: 8px;
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
                background: rgba(251, 84, 43, 0.2);
                border-color: rgba(251, 84, 43, 0.35);
                color: ${CONFIG.THEME.PRIMARY};
            }
            .ns-btn-primary:hover { background: rgba(251, 84, 43, 0.3); }
        `;
        document.head.appendChild(style);
    }

    function renderMessageList() {
        const listContainer = document.getElementById('ns-msg-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (STATE.messages.length === 0) {
            listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:rgba(255,255,255,0.5); font-size:12px;">No chat turns found.</div>';
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

            // Scrollable Accordion Container
            if (isExpanded) {
                const accordion = document.createElement('div');
                accordion.className = 'ns-msg-accordion';

                // Render Full Scrollable Message Content
                if (msg.text) {
                    const fullText = document.createElement('div');
                    fullText.className = 'ns-msg-fulltext';
                    fullText.textContent = msg.text;
                    accordion.appendChild(fullText);
                }

                // Render Augments
                if (totalAugLinks > 0 || (msg.augments && msg.augments.length > 0)) {
                    msg.augments.forEach(aug => {
                        if (aug.searchQuery) {
                            const qLabel = document.createElement('div');
                            qLabel.style.fontWeight = '700';
                            qLabel.style.color = 'rgba(255,255,255,0.8)';
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

                // Render Deep Research Data
                if (msg.role === 'research' && msg.research) {
                    const res = msg.research;

                    if (Object.keys(res.stats).length > 0) {
                        const statsHeader = document.createElement('div');
                        statsHeader.style.fontWeight = '700';
                        statsHeader.style.color = '#6ee7b7';
                        statsHeader.textContent = '📊 Research Stats: ' + Object.entries(res.stats).map(([k, v]) => `${v} ${k}`).join(' | ');
                        accordion.appendChild(statsHeader);
                    }

                    if (res.queries.length > 0) {
                        const qHeader = document.createElement('div');
                        qHeader.style.fontWeight = '700';
                        qHeader.style.color = 'rgba(255,255,255,0.8)';
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
                        sHeader.style.fontWeight = '700';
                        sHeader.style.color = 'rgba(255,255,255,0.8)';
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

    function createSidebarUI() {
        if (document.getElementById('ns-orb-brave')) return;

        const orb = document.createElement('div');
        orb.id = 'ns-orb-brave';
        orb.className = 'ns-orb';
        orb.title = 'Noosphere Reflect Exporter';
        orb.textContent = '🦁';
        document.body.appendChild(orb);

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

        orb.onclick = (e) => { e.stopPropagation(); openSidebar(); };
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
        document.getElementById('ns-btn-download').onclick = () => ExportService.executeDownload();
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
