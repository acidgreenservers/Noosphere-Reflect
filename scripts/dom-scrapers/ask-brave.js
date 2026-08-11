(function () {
    'use strict';

    /*
     * ============================================================
     * Noosphere Reflect — Brave Search AI Chat Exporter
     * ============================================================
     *
     * Standalone scraper and Markdown synthesizer for Brave Search 
     * AI Chat (search.brave.com/ask).
     *
     * Features:
     *   - Reconstructs full report/chat body preserving formatting
     *     (Headings, bold/italic, lists, tables, inline code, pre blocks)
     *   - Strips UI noise (code block copy buttons, citation icons)
     *   - Extracts Sidebar Rounds / TOC into a collapsible accordion
     *     at the top of the chat
     *   - Extracts Web & Discussion Augment carousels into structured
     *     Markdown reference links
     *   - Complete Deep Research panel extraction
     *   - Manual Chat Title & Filename configuration in UI
     *
     * Namespace: ns- (Brave Edition)
     * ============================================================
     */

    const CONFIG = {
        SELECTORS: {
            // Chat Message Containers
            USER_MESSAGE: '.message.user',
            USER_BUBBLE: '.user-bubble',
            AI_MESSAGE: '.message.assistant.llm-output',
            AUGMENT_MESSAGE: '.message.augment',
            RESEARCH_MESSAGE: '.message.research',

            // Sidebar Rounds / TOC Selectors
            TOC_ROUND: '.sidebar-history-toc-round',
            TOC_SECTION: 'a.sidebar-history-toc-section',

            // Augment Card Selectors
            ENRICHMENT_CARD_ITEM: 'a.enrichment-card-item',
            ENRICHMENT_CARD_TITLE: '.desktop-small-semibold',
            ENRICHMENT_CARD_SITE: '.enrichment-card-site',
            ENRICHMENT_CARD_DESC: '.enrichment-card-description',
            ENRICHMENT_FOOTER_QUERY: '.enrichment-footer-query',

            // Deep Research Panel Selectors
            DEEP_RESEARCH_CONTAINER: '.deep-research.noscrollbar',
            DEEP_RESEARCH_STATS_ITEM: '.deep-research-stats-item',
            DEEP_RESEARCH_STATS_VALUE: '.deep-research-stats-item-value',
            DEEP_RESEARCH_STATS_LABEL: '.deep-research-stats-item-label',
            DEEP_RESEARCH_ITERATION: '.deep-research-iteration-content',
            DEEP_RESEARCH_QUERIES: '.deep-research-queries',
            DEEP_RESEARCH_THINKING: '.deep-research-thinking',
            DEEP_RESEARCH_QUERY: '.deep-research-query',
            DEEP_RESEARCH_SOURCE_CHIP: '.deep-research-source-chip[href]',
            DEEP_RESEARCH_ANSWER_HEADER: '.deep-research-answer-header',
            DEEP_RESEARCH_ANSWER_CONTENT: '.deep-research-answer-content',
            DEEP_RESEARCH_BLINDSPOTS: '.deep-research-blindspots-content',
            DEEP_RESEARCH_PROGRESS: '.deep-research-progress',

            // UI Chrome to Strip
            NOISE_ELEMENTS: 'button.inline-citation, div.copy-button, svg, .user-message-actions'
        },

        UI: {
            ORB_RIGHT: 25,
            ORB_BOTTOM: 25,
            CONSOLE_RIGHT: 25,
            CONSOLE_BOTTOM: 95,
            POPUP_DURATION: 2000
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
                background: success ? '#fb542b' : '#dc2626',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '100001',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'opacity 0.3s ease',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            });

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, CONFIG.UI.POPUP_DURATION);
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

        // Ignore UI chrome noise
        if (node.matches(CONFIG.SELECTORS.NOISE_ELEMENTS)) {
            return '';
        }

        const tag = node.tagName.toLowerCase();

        const inner = () =>
            Array.from(node.childNodes)
                .map(renderNodeToMarkdown)
                .join('');

        switch (tag) {
            case 'h1':
                return `\n\n# ${Utils.cleanText(inner())}\n\n`;
            case 'h2':
                return `\n\n## ${Utils.cleanText(inner())}\n\n`;
            case 'h3':
                return `\n\n### ${Utils.cleanText(inner())}\n\n`;
            case 'h4':
                return `\n\n#### ${Utils.cleanText(inner())}\n\n`;
            case 'h5':
                return `\n\n##### ${Utils.cleanText(inner())}\n\n`;
            case 'h6':
                return `\n\n###### ${Utils.cleanText(inner())}\n\n`;

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

            case 'hr':
                return '\n\n---\n\n';

            case 'br':
                return '\n';

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

            case 'li':
                return inner().trim();

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

            default:
                return inner();
        }
    }

    function htmlToMarkdown(element) {
        if (!element) return '';
        const clone = element.cloneNode(true);
        clone.querySelectorAll(CONFIG.SELECTORS.NOISE_ELEMENTS).forEach(n => n.remove());
        return Utils.normalizeMarkdown(renderNodeToMarkdown(clone));
    }

    // ============================================================
    // Extraction Modules
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

            // Stats
            const stats = {};
            panel.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_STATS_ITEM).forEach(item => {
                const val = item.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_STATS_VALUE)?.innerText?.trim();
                const label = item.querySelector('.long-label, .short-label, .deep-research-stats-item-label')?.innerText?.trim();
                if (val && label) stats[label] = val;
            });

            // Iterations & Answers
            const answers = [];
            panel.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_ANSWER_CONTENT).forEach(ans => {
                const md = htmlToMarkdown(ans);
                if (md) answers.push(md);
            });

            // Queries
            const queries = [];
            panel.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_QUERIES + ' ' + CONFIG.SELECTORS.DEEP_RESEARCH_QUERY).forEach(q => {
                const text = Utils.cleanText(q.querySelector('span')?.innerText || q.innerText || '');
                if (text) queries.push(text);
            });

            // Sources
            const sources = [];
            panel.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_SOURCE_CHIP).forEach(chip => {
                const href = chip.getAttribute('href');
                const label = Utils.cleanText(chip.innerText || href);
                if (href) sources.push({ href, label });
            });

            // Progress
            const progress = Utils.cleanText(panel.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_PROGRESS)?.innerText || '');

            return { stats, answers, queries, sources, progress };
        }
    };

    // ============================================================
    // Export Service & Document Synthesis
    // ============================================================

    const ExportService = {
        getChatTitle() {
            const manualTitle = document.getElementById('ns-chat-title')?.value?.trim();
            if (manualTitle) return manualTitle;

            const firstUserMsg = document.querySelector(CONFIG.SELECTORS.USER_BUBBLE);
            if (firstUserMsg) {
                return Utils.cleanText(firstUserMsg.innerText).substring(0, 50);
            }

            return document.title || 'Brave_Search_AI_Chat';
        },

        buildMarkdown() {
            const chatTitle = this.getChatTitle();
            const sourceUrl = window.location.href;
            const exportedAt = new Date().toLocaleString();

            const rounds = Extractors.extractSidebarRounds();

            const allElements = Array.from(document.querySelectorAll([
                CONFIG.SELECTORS.USER_MESSAGE,
                CONFIG.SELECTORS.AI_MESSAGE,
                CONFIG.SELECTORS.AUGMENT_MESSAGE,
                CONFIG.SELECTORS.RESEARCH_MESSAGE
            ].join(', ')));

            let userCount = 0;
            let aiCount = 0;
            let md = '';

            // Metadata Frontmatter
            md += '---\n';
            md += '> **🤖 Model:** Brave Search AI\n>\n';
            md += `> **🌐 Exported:** ${exportedAt}\n>\n`;
            md += `> **🌐 Source:** [Brave Search AI](${sourceUrl})\n>\n`;
            md += '> **🏷️ Tags:** Brave, AI-Chat, Noosphere, Search\n';
            md += '---\n\n';

            md += `# ${chatTitle}\n\n`;

            // Collapsible Sidebar Rounds / Table of Contents
            if (rounds.length > 0) {
                md += '<details>\n';
                md += '<summary><b>🔄 Conversation Rounds / TOC</b></summary>\n\n';
                rounds.forEach((round, idx) => {
                    md += `${idx + 1}. **${round.label}**\n`;
                });
                md += '\n</details>\n\n';
            }

            md += '---\n\n';

            allElements.forEach(el => {
                // Checkbox state
                const cb = el.querySelector('.ns-checkbox');
                if (cb && !cb.checked) return;

                if (el.matches(CONFIG.SELECTORS.USER_MESSAGE)) {
                    userCount++;
                    const userText = Extractors.extractUserMessage(el);
                    md += `#### Prompt - User 👤:\n\n${userText}\n\n---\n\n`;
                }

                else if (el.matches(CONFIG.SELECTORS.AI_MESSAGE)) {
                    aiCount++;
                    const aiMd = Extractors.extractAIMessage(el);
                    md += `#### Response - Brave Search AI 🤖:\n\n${aiMd}\n\n---\n\n`;
                }

                else if (el.matches(CONFIG.SELECTORS.AUGMENT_MESSAGE)) {
                    const augmentData = Extractors.extractAugmentCards(el);
                    if (augmentData.links.length > 0) {
                        md += `<details>\n<summary><b>📎 Search References ${augmentData.searchQuery ? `("${augmentData.searchQuery}")` : ''}</b></summary>\n\n`;
                        augmentData.links.forEach(link => {
                            md += `- [${link.title}](${link.href}) ${link.desc ? `— *${link.desc}*` : ''}\n`;
                        });
                        md += '\n</details>\n\n---\n\n';
                    }
                }

                else if (el.matches(CONFIG.SELECTORS.RESEARCH_MESSAGE)) {
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

            // Footer
            md += '###### Noosphere Reflect\n';
            md += '###### ***Meaning Through Memory***\n\n';
            md += '###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n';

            return Utils.normalizeMarkdown(md);
        },

        async exportToClipboard() {
            try {
                const md = this.buildMarkdown();
                await navigator.clipboard.writeText(md);
                Utils.createNotification('✅ Copied Markdown to clipboard!');
            } catch (err) {
                console.error('[Noosphere Brave]', err);
                Utils.createNotification('❌ Clipboard export failed', false);
            }
        },

        async exportToFile() {
            try {
                const md = this.buildMarkdown();
                const title = this.getChatTitle();
                const filename = `${Utils.sanitizeFilename(title)}_Brave_Chat_${Utils.getDateString()}.md`;

                const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
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
                console.error('[Noosphere Brave]', err);
                Utils.createNotification('❌ Download failed', false);
            }
        }
    };

    // ============================================================
    // UI Construction & Observers
    // ============================================================

    function injectStyles() {
        if (document.getElementById('noosphere-brave-styles')) return;

        const style = document.createElement('style');
        style.id = 'noosphere-brave-styles';
        style.textContent = `
            .ns-orb {
                position: fixed;
                bottom: ${CONFIG.UI.ORB_BOTTOM}px;
                right: ${CONFIG.UI.ORB_RIGHT}px;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #fb542b, #8b5cf6);
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
                font-size: 22px;
            }

            .ns-orb:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(251,84,43,0.4);
            }

            .ns-console {
                position: fixed;
                bottom: ${CONFIG.UI.CONSOLE_BOTTOM}px;
                right: ${CONFIG.UI.CONSOLE_RIGHT}px;
                width: 340px;
                background: rgba(17, 24, 39, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 16px;
                z-index: 99999;
                overflow: hidden;
                display: none;
                flex-direction: column;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                color: white;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            .ns-console-header {
                padding: 16px 18px;
                border-bottom: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.03);
            }

            .ns-console-title {
                font-size: 15px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .ns-console-subtitle {
                margin-top: 4px;
                color: rgba(255,255,255,0.55);
                font-size: 11px;
            }

            .ns-console-content {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 10px;
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

            .ns-input:focus {
                border-color: #fb542b;
            }

            .ns-bulk-controls {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
            }

            .ns-bulk-btn {
                padding: 6px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 6px;
                color: rgba(255, 255, 255, 0.7);
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s ease;
            }

            .ns-bulk-btn:hover {
                background: rgba(255, 255, 255, 0.12);
                color: white;
            }

            .ns-btn {
                width: 100%;
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 8px;
                padding: 9px 12px;
                background: rgba(255,255,255,0.05);
                color: white;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                text-align: center;
                transition: all 0.2s ease;
            }

            .ns-btn:hover {
                background: rgba(255,255,255,0.12);
                border-color: rgba(255,255,255,0.25);
            }

            .ns-btn-primary {
                background: rgba(251, 84, 43, 0.2);
                border-color: rgba(251, 84, 43, 0.35);
                color: #fb542b;
            }

            .ns-btn-primary:hover {
                background: rgba(251, 84, 43, 0.3);
            }

            .ns-checkbox {
                appearance: none;
                width: 18px;
                height: 18px;
                border: 2px solid #fb542b;
                border-radius: 4px;
                cursor: pointer;
                background: rgba(0,0,0,0.3);
                transition: all 0.2s ease;
                position: relative;
            }

            .ns-checkbox:checked {
                background: #fb542b;
            }

            .ns-checkbox:checked::after {
                content: '✓';
                position: absolute;
                color: white;
                font-size: 12px;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
        `;
        document.head.appendChild(style);
    }

    function createMenu() {
        if (document.getElementById('ns-orb-brave')) return;

        const orb = document.createElement('div');
        orb.id = 'ns-orb-brave';
        orb.className = 'ns-orb';
        orb.title = 'Noosphere Reflect — Brave Exporter';
        orb.textContent = '🦁';
        document.body.appendChild(orb);

        const consoleEl = document.createElement('div');
        consoleEl.id = 'ns-console-brave';
        consoleEl.className = 'ns-console';

        // Header
        const header = document.createElement('div');
        header.className = 'ns-console-header';
        
        const title = document.createElement('div');
        title.className = 'ns-console-title';
        title.textContent = '🦁 Ask Brave Exporter';

        const subtitle = document.createElement('div');
        subtitle.className = 'ns-console-subtitle';
        subtitle.textContent = 'Noosphere Reflect — Meaning Through Memory';

        header.appendChild(title);
        header.appendChild(subtitle);
        consoleEl.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.className = 'ns-console-content';

        // Custom Title Input
        const titleGroup = document.createElement('div');
        titleGroup.className = 'ns-input-group';
        
        const titleLabel = document.createElement('label');
        titleLabel.className = 'ns-label';
        titleLabel.textContent = 'Chat Title';

        const titleInput = document.createElement('input');
        titleInput.id = 'ns-chat-title';
        titleInput.className = 'ns-input';
        titleInput.type = 'text';
        titleInput.placeholder = 'e.g. Brave Search DOM Scraping Session';

        titleGroup.appendChild(titleLabel);
        titleGroup.appendChild(titleInput);
        content.appendChild(titleGroup);

        // Bulk Selection Controls
        const bulkGroup = document.createElement('div');
        bulkGroup.className = 'ns-bulk-controls';

        ['All', 'User', 'AI', 'None'].forEach(label => {
            const btn = document.createElement('div');
            btn.className = 'ns-bulk-btn';
            btn.textContent = label;
            btn.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.ns-checkbox').forEach(cb => {
                    const type = cb.dataset.type;
                    if (label === 'All') cb.checked = true;
                    if (label === 'None') cb.checked = false;
                    if (label === 'User') cb.checked = (type === 'user');
                    if (label === 'AI') cb.checked = (type === 'assistant' || type === 'research');
                });
            };
            bulkGroup.appendChild(btn);
        });
        content.appendChild(bulkGroup);

        // Copy Button
        const btnCopy = document.createElement('button');
        btnCopy.className = 'ns-btn';
        btnCopy.textContent = '📋 Copy Markdown';
        btnCopy.onclick = (e) => { e.stopPropagation(); ExportService.exportToClipboard(); };
        content.appendChild(btnCopy);

        // Download Button
        const btnDownload = document.createElement('button');
        btnDownload.className = 'ns-btn ns-btn-primary';
        btnDownload.textContent = '⬇️ Download .md';
        btnDownload.onclick = (e) => { e.stopPropagation(); ExportService.exportToFile(); };
        content.appendChild(btnDownload);

        consoleEl.appendChild(content);
        document.body.appendChild(consoleEl);

        orb.onclick = (e) => {
            e.stopPropagation();
            const isOpen = consoleEl.style.display === 'flex';
            consoleEl.style.display = isOpen ? 'none' : 'flex';
        };

        document.addEventListener('click', (e) => {
            if (!orb.contains(e.target) && !consoleEl.contains(e.target)) {
                consoleEl.style.display = 'none';
            }
        });
    }

    function injectCheckboxes() {
        const createCheckbox = (type, container) => {
            if (container.querySelector('.ns-checkbox')) return;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'ns-checkbox';
            checkbox.dataset.type = type;
            checkbox.checked = true;

            checkbox.style.position = 'absolute';
            checkbox.style.top = '12px';
            checkbox.style.zIndex = '100';
            checkbox.style.left = '-28px';

            container.style.position = 'relative';
            container.prepend(checkbox);
        };

        document.querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE).forEach(el => createCheckbox('user', el));
        document.querySelectorAll(CONFIG.SELECTORS.AI_MESSAGE).forEach(el => createCheckbox('assistant', el));
        document.querySelectorAll(CONFIG.SELECTORS.RESEARCH_MESSAGE).forEach(el => createCheckbox('research', el));
    }

    function setupObserver() {
        const observer = new MutationObserver(() => {
            injectCheckboxes();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        console.log('🦁 Noosphere Reflect — Brave Search AI Exporter Initialized');
        injectStyles();
        createMenu();
        injectCheckboxes();
        setupObserver();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
