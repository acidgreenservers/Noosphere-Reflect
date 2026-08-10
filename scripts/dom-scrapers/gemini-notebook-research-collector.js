(function () {
    'use strict';

    /*
     * ============================================================
     * Noosphere Reflect — NotebookLM Deep Research Exporter
     * ============================================================
     *
     * Standalone scraper and Markdown synthesizer for Gemini / 
     * NotebookLM Deep Research Reports.
     *
     * Features:
     *   - Reconstructs full report body (Headings, Code, KaTeX math,
     *     Tables, Lists, Horizontal rules)
     *   - Makes in-text article references collapsible at the end of 
     *     the report body
     *   - Automated tab switching to extract both "Cited in Report" 
     *     and "Not cited" source panels
     *   - Recovers target source URLs from favicon requests
     *   - Formats collapsible dual-column comparison table & bibliography
     *   - Programmatic click guard prevents menu closing on tab switches
     *
     * Namespace: nrdr-
     * ============================================================
     */

    const CONFIG = {
        SELECTORS: {
            ORIGINAL_QUERY: '.original-query-text',
            REPORT_HEADER: '.deep-research-report-header-text',
            REPORT_TITLE: '#report-title, .deep-research-report-header-text-title',
            REPORT_SUBTITLE: '.deep-research-report-header-text-subtitle',
            REPORT_CONTAINER: 'labs-tailwind-doc-viewer.deep-research-report-text element-list-renderer',
            
            // Tab Selectors
            TAB_BUTTONS: 'div[role="tab"]',
            TAB_LABEL_TEXT: '.deep-research-sources-tab-label-text',
            
            // Source Card Selectors
            SOURCES_LIST: '.sources-list',
            SOURCE_CONTAINER: '.source-container',
            SOURCE_TITLE: '.source-text-header-title',
            SOURCE_SUBTITLE: '.source-text-subtitle',
            SOURCE_FAVICON: 'img.favicon-icon'
        },

        UI: {
            ORB_RIGHT: 95,
            ORB_BOTTOM: 25,
            CONSOLE_RIGHT: 95,
            CONSOLE_BOTTOM: 95,
            POPUP_DURATION: 2500
        }
    };

    // Cache state for sources
    const State = {
        citedSources: null,
        notCitedSources: null,
        isProgrammaticClick: false // Guard flag to prevent click-outside menu closure
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
                background: success ? '#10b981' : '#dc2626',
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

        sanitizeFilename(text) {
            return (text || 'NotebookLM_Deep_Research')
                .replace(/[<>:"/\\|?*]/g, '')
                .replace(/\s+/g, '_')
                .substring(0, 80);
        },

        getDateString() {
            const now = new Date();
            const pad = n => n.toString().padStart(2, '0');
            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // ============================================================
    // DOM → Markdown Renderer
    // ============================================================

    function renderInline(node) {
        if (!node) return '';

        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const tag = node.tagName.toLowerCase();

        // Handle KaTeX Math spans cleanly
        if (node.classList.contains('katex')) {
            const mathText = node.innerText || node.textContent || '';
            return mathText.trim();
        }

        const inner = () =>
            Array.from(node.childNodes)
                .map(renderInline)
                .join('');

        switch (tag) {
            case 'strong':
            case 'b': {
                const val = inner().trim();
                return val ? `**${val}**` : '';
            }
            case 'em':
            case 'i': {
                const val = inner().trim();
                return val ? `*${val}*` : '';
            }
            case 'code':
                return `\`${inner().replace(/`/g, '\\`')}\``;
            case 'br':
                return '\n';
            case 'a': {
                const text = Utils.cleanText(inner());
                const href = node.getAttribute('href');
                return href ? `[${text || href}](${href})` : text;
            }
            case 'del':
            case 's':
                return `~~${inner()}~~`;
            default:
                return inner();
        }
    }

    function extractParagraph(paragraph) {
        if (!paragraph) return '';

        const classList = paragraph.classList;
        let text = Utils.cleanText(renderInline(paragraph));

        if (!text) return '';

        if (classList.contains('heading1')) return `# ${text}`;
        if (classList.contains('heading2')) return `## ${text}`;
        if (classList.contains('heading3')) return `### ${text}`;
        if (classList.contains('heading4')) return `#### ${text}`;

        return text;
    }

    function extractCodeBlock(codeBlock) {
        if (!codeBlock) return '';
        const pre = codeBlock.querySelector('pre');
        const code = pre?.querySelector('code');
        const text = code ? code.textContent : (pre ? pre.textContent : codeBlock.textContent);

        return `\`\`\`\n${(text || '').trim()}\n\`\`\``;
    }

    function extractTable(table) {
        if (!table) return '';
        const rows = Array.from(table.querySelectorAll('tr'));
        if (!rows.length) return '';

        const matrix = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            return cells.map(cell => {
                const paragraphs = Array.from(cell.querySelectorAll('div.paragraph'));
                if (paragraphs.length) {
                    return paragraphs.map(p => Utils.cleanText(renderInline(p))).filter(Boolean).join(' ');
                }
                return Utils.cleanText(cell.innerText || '');
            });
        });

        const columnCount = Math.max(...matrix.map(r => r.length), 0);
        if (!columnCount) return '';

        const escapeCell = val => String(val || '').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();

        const normalized = matrix.map(row => {
            const copy = row.slice();
            while (copy.length < columnCount) copy.push('');
            return copy;
        });

        const header = normalized[0].map(escapeCell);
        const separator = new Array(columnCount).fill('---');
        const output = [`| ${header.join(' | ')} |`, `| ${separator.join(' | ')} |`];

        for (let i = 1; i < normalized.length; i++) {
            output.push(`| ${normalized[i].map(escapeCell).join(' | ')} |`);
        }

        return output.join('\n');
    }

    function extractList(listEl) {
        if (!listEl) return '';
        const tag = listEl.tagName.toLowerCase();
        const isOrdered = tag === 'ol';
        
        const items = Array.from(listEl.children)
            .filter(child => child.tagName.toLowerCase() === 'labs-tailwind-structural-element-view-v2')
            .map((item, idx) => {
                const li = item.querySelector('li.paragraph.list-item');
                const text = li ? Utils.cleanText(renderInline(li)) : '';
                const prefix = isOrdered ? `${idx + 1}.` : '-';
                return `${prefix} ${text}`;
            })
            .filter(Boolean);

        return items.join('\n');
    }

    function renderStructuralElement(structuralElement) {
        if (!structuralElement) return '';

        const table = structuralElement.querySelector(':scope > table-element-view table');
        if (table) return extractTable(table);

        const codeBlock = structuralElement.querySelector(':scope > code-block-element-view');
        if (codeBlock) return extractCodeBlock(codeBlock);

        const hr = structuralElement.querySelector(':scope > hr.horizontal-rule');
        if (hr) return '---';

        const paragraph = structuralElement.querySelector(':scope > paragraph-element-view > div.paragraph');
        if (paragraph) return extractParagraph(paragraph);

        const fallback = structuralElement.querySelector('div.paragraph');
        if (fallback) return extractParagraph(fallback);

        return '';
    }

    // ============================================================
    // Report Scraper
    // ============================================================

    const ReportExtractor = {
        getOriginalQuery() {
            const el = document.querySelector(CONFIG.SELECTORS.ORIGINAL_QUERY);
            return Utils.cleanText(el?.innerText || '');
        },

        getTitle() {
            const el = document.querySelector(CONFIG.SELECTORS.REPORT_TITLE);
            return Utils.cleanText(el?.innerText || '') || 'NotebookLM Deep Research Report';
        },

        getSourceCountSubtitle() {
            const el = document.querySelector(CONFIG.SELECTORS.REPORT_SUBTITLE);
            return Utils.cleanText(el?.innerText || '');
        },

        extractReportMarkdown() {
            const container = document.querySelector(CONFIG.SELECTORS.REPORT_CONTAINER);
            if (!container) return { body: '', references: '' };

            const bodyBlocks = [];
            let inlineReferences = '';

            Array.from(container.children).forEach(child => {
                const tag = child.tagName.toLowerCase();

                if (tag === 'labs-tailwind-structural-element-view-v2') {
                    const block = renderStructuralElement(child);
                    if (block) bodyBlocks.push(block);
                } else if (tag === 'ol') {
                    // Top-level <ol> at the end of the report is the inline references list
                    inlineReferences = extractList(child);
                } else if (tag === 'ul') {
                    const listBlock = extractList(child);
                    if (listBlock) bodyBlocks.push(listBlock);
                }
            });

            // Strip trailing horizontal rule ('---') if it was right before the reference list
            while (bodyBlocks.length && bodyBlocks[bodyBlocks.length - 1] === '---') {
                bodyBlocks.pop();
            }

            return {
                body: Utils.normalizeMarkdown(bodyBlocks.join('\n\n')),
                references: inlineReferences.trim()
            };
        }
    };

    // ============================================================
    // Source Scraper & Tab Automation
    // ============================================================

    const SourceExtractor = {
        extractUrlFromFavicon(card) {
            const favicon = card.querySelector(CONFIG.SELECTORS.SOURCE_FAVICON);
            if (!favicon) return '';

            try {
                const src = favicon.getAttribute('src') || '';
                if (!src) return '';

                const parsed = new URL(src, window.location.href);
                const domain = parsed.searchParams.get('domain');
                return domain ? decodeURIComponent(domain) : '';
            } catch (e) {
                return '';
            }
        },

        scrapeCurrentVisibleSources() {
            const cards = Array.from(document.querySelectorAll(CONFIG.SELECTORS.SOURCE_CONTAINER));

            return cards.map((card, idx) => {
                const titleEl = card.querySelector(CONFIG.SELECTORS.SOURCE_TITLE);
                const subtitleEl = card.querySelector(CONFIG.SELECTORS.SOURCE_SUBTITLE);

                const title = Utils.cleanText(titleEl?.innerText || '');
                const description = Utils.cleanText(subtitleEl?.innerText || '');
                const url = this.extractUrlFromFavicon(card);

                return {
                    index: idx + 1,
                    title: title || `Source ${idx + 1}`,
                    description,
                    url
                };
            }).filter(s => s.title || s.url);
        },

        async switchTabAndScrape(targetTabName) {
            const tabs = Array.from(document.querySelectorAll(CONFIG.SELECTORS.TAB_BUTTONS));
            
            const targetTab = tabs.find(tab => {
                const label = tab.querySelector(CONFIG.SELECTORS.TAB_LABEL_TEXT);
                return label && label.textContent.toLowerCase().includes(targetTabName.toLowerCase());
            });

            if (!targetTab) {
                throw new Error(`Tab "${targetTabName}" not found in DOM`);
            }

            // Click the tab if not already active
            if (targetTab.getAttribute('aria-selected') !== 'true') {
                State.isProgrammaticClick = true; // Shield document click-outside listener
                targetTab.click();
                await Utils.sleep(400); // Allow Angular state update
                State.isProgrammaticClick = false;
            }

            return this.scrapeCurrentVisibleSources();
        }
    };

    // ============================================================
    // Export Service & Markdown Assembly
    // ============================================================

    const ExportService = {
        async collectTab(type) {
            const label = type === 'cited' ? 'Cited in Report' : 'Not cited';
            Utils.createNotification(`Fetching ${label}...`);

            try {
                const sources = await SourceExtractor.switchTabAndScrape(type === 'cited' ? 'cited' : 'not cited');
                
                if (type === 'cited') {
                    State.citedSources = sources;
                } else {
                    State.notCitedSources = sources;
                }

                Utils.createNotification(`✅ Saved ${sources.length} ${label} sources!`);
                return sources;
            } catch (err) {
                console.error('[Noosphere Deep Research]', err);
                Utils.createNotification(`❌ Failed to collect ${label}`, false);
                return [];
            }
        },

        async buildMarkdown() {
            // Auto-collect if user didn't manually click collect buttons
            if (!State.citedSources) {
                await this.collectTab('cited');
            }
            if (!State.notCitedSources) {
                await this.collectTab('notCited');
            }

            const title = ReportExtractor.getTitle();
            const query = ReportExtractor.getOriginalQuery();
            const scope = ReportExtractor.getSourceCountSubtitle();
            const { body: reportBody, references: articleReferences } = ReportExtractor.extractReportMarkdown();

            const cited = State.citedSources || [];
            const notCited = State.notCitedSources || [];
            const exportedAt = new Date().toLocaleString();
            const sourceUrl = window.location.href;

            let md = '';

            // Metadata Frontmatter
            md += '---\n';
            md += '> **🤖 Model:** Google NotebookLM Deep Research\n>\n';
            md += `> **🌐 Exported:** ${exportedAt}\n>\n`;
            md += `> **🌐 Source:** [Google NotebookLM](${sourceUrl})\n>\n`;
            md += '> **🏷️ Tags:** NotebookLM, Deep Research, Synthesis, Citations\n>\n';
            if (scope) md += `> **📚 Research Scope:** ${scope}\n>\n`;
            md += `> **📊 Sources Total:** ${cited.length} Cited | ${notCited.length} Not Cited\n`;
            md += '---\n\n';

            // Title
            md += `# ${title}\n\n`;

            // Original Query
            if (query) {
                md += '## Deep Research Query\n\n';
                md += `> ${query}\n\n`;
                md += '---\n\n';
            }

            // Synthesis Body
            md += '## Deep Research Synthesis\n\n';
            md += reportBody ? `${reportBody}\n\n` : '> ⚠️ Report body could not be extracted.\n\n';

            // Collapsible Section 1: In-Text Article References List
            if (articleReferences) {
                md += '---\n\n';
                md += '<details>\n';
                md += '<summary><b>🔗 In-Text Article References List</b></summary>\n\n';
                md += `${articleReferences}\n\n`;
                md += '</details>\n\n';
            }

            md += '---\n\n';

            // Collapsible Section 2: Dual Column Comparison Table
            md += '<details>\n';
            md += '<summary><b>📊 Sources Citation Index (Dual-Column Table)</b></summary>\n\n';

            const maxRows = Math.max(cited.length, notCited.length);
            
            if (maxRows > 0) {
                md += '| Cited in Report | Not Cited |\n';
                md += '|---|---|\n';

                for (let i = 0; i < maxRows; i++) {
                    const c = cited[i];
                    const nc = notCited[i];

                    const cCell = c 
                        ? `**[${c.index}] ${c.title.replace(/\|/g, '\\|')}**${c.url ? `<br>[${c.url}](${c.url})` : ''}` 
                        : '';
                    const ncCell = nc 
                        ? `**${nc.title.replace(/\|/g, '\\|')}**${nc.url ? `<br>[${nc.url}](${nc.url})` : ''}` 
                        : '';

                    md += `| ${cCell} | ${ncCell} |\n`;
                }

                md += '\n</details>\n\n';

                // Collapsible Section 3: Detailed Bibliography
                md += '<details>\n';
                md += '<summary><b>📚 Detailed Bibliography & Snippets</b></summary>\n\n';

                if (cited.length) {
                    md += '#### Cited Sources\n\n';
                    cited.forEach(s => {
                        md += `**[${s.index}] ${s.title}**\n`;
                        if (s.url) md += `- **URL:** [${s.url}](${s.url})\n`;
                        if (s.description) md += `- **Snippet:** ${s.description}\n`;
                        md += '\n';
                    });
                }

                if (notCited.length) {
                    md += '#### Discovered (Not Cited) Sources\n\n';
                    notCited.forEach(s => {
                        md += `* **${s.title}**\n`;
                        if (s.url) md += `  - **URL:** [${s.url}](${s.url})\n`;
                        if (s.description) md += `  - **Snippet:** ${s.description}\n`;
                        md += '\n';
                    });
                }

                md += '</details>\n\n';
            } else {
                md += '> No source cards extracted.\n\n</details>\n\n';
            }

            // Footer
            md += '---\n\n';
            md += '###### Noosphere Reflect\n';
            md += '###### ***Meaning Through Memory***\n\n';
            md += '###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n';

            return Utils.normalizeMarkdown(md);
        },

        async exportToClipboard() {
            try {
                const content = await this.buildMarkdown();
                await navigator.clipboard.writeText(content);
                Utils.createNotification('✅ Deep Research report copied to clipboard!');
            } catch (err) {
                console.error('[Noosphere Deep Research]', err);
                Utils.createNotification('❌ Clipboard failed — try Download instead', false);
            }
        },

        async exportToFile() {
            try {
                const content = await this.buildMarkdown();
                const title = ReportExtractor.getTitle();
                const filename = `${Utils.sanitizeFilename(title)}_Deep_Research_${Utils.getDateString()}.md`;

                const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
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
                console.error('[Noosphere Deep Research]', err);
                Utils.createNotification('❌ File export failed', false);
            }
        }
    };

    // ============================================================
    // UI Construction
    // ============================================================

    function injectStyles() {
        if (document.getElementById('noosphere-deep-research-styles')) return;

        const style = document.createElement('style');
        style.id = 'noosphere-deep-research-styles';
        style.textContent = `
            .nrdr-orb {
                position: fixed;
                bottom: ${CONFIG.UI.ORB_BOTTOM}px;
                right: ${CONFIG.UI.ORB_RIGHT}px;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #10b981, #8b5cf6);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 100000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                border: 2px solid rgba(255,255,255,0.2);
                color: white;
                user-select: none;
            }

            .nrdr-orb:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(0,0,0,0.4);
            }

            .nrdr-orb-icon {
                width: 24px;
                height: 24px;
                position: relative;
                display: block;
            }

            .nrdr-orb-icon::before {
                content: '';
                position: absolute;
                width: 12px;
                height: 12px;
                border: 3px solid white;
                border-radius: 50%;
                left: 1px;
                top: 1px;
                box-sizing: border-box;
            }

            .nrdr-orb-icon::after {
                content: '';
                position: absolute;
                width: 10px;
                height: 3px;
                background: white;
                border-radius: 3px;
                transform: rotate(45deg);
                transform-origin: left center;
                left: 12px;
                top: 14px;
            }

            .nrdr-console {
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

            .nrdr-console-header {
                padding: 16px 18px;
                border-bottom: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.03);
            }

            .nrdr-console-title {
                font-size: 15px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .nrdr-console-subtitle {
                margin-top: 4px;
                color: rgba(255,255,255,0.55);
                font-size: 11px;
            }

            .nrdr-console-content {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .nrdr-status {
                padding: 8px 12px;
                border-radius: 8px;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.08);
                font-size: 11px;
                line-height: 1.4;
                color: rgba(255,255,255,0.7);
            }

            .nrdr-btn {
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

            .nrdr-btn:hover {
                background: rgba(255,255,255,0.12);
                border-color: rgba(255,255,255,0.25);
            }

            .nrdr-btn-collect {
                background: rgba(139, 92, 246, 0.2);
                border-color: rgba(139, 92, 246, 0.35);
                color: #c4b5fd;
            }

            .nrdr-btn-collect:hover {
                background: rgba(139, 92, 246, 0.3);
            }

            .nrdr-btn-primary {
                background: rgba(16, 185, 129, 0.2);
                border-color: rgba(16, 185, 129, 0.35);
                color: #10b981;
            }

            .nrdr-btn-primary:hover {
                background: rgba(16, 185, 129, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    function createMenu() {
        if (document.getElementById('nrdr-orb')) return;

        const orb = document.createElement('div');
        orb.id = 'nrdr-orb';
        orb.className = 'nrdr-orb';
        orb.title = 'Noosphere Deep Research Exporter';

        const icon = document.createElement('span');
        icon.className = 'nrdr-orb-icon';
        orb.appendChild(icon);
        document.body.appendChild(orb);

        const consoleEl = document.createElement('div');
        consoleEl.id = 'nrdr-console';
        consoleEl.className = 'nrdr-console';

        // Header
        const header = document.createElement('div');
        header.className = 'nrdr-console-header';
        
        const title = document.createElement('div');
        title.className = 'nrdr-console-title';
        title.textContent = '🔎 Deep Research Exporter';

        const subtitle = document.createElement('div');
        subtitle.className = 'nrdr-console-subtitle';
        subtitle.textContent = 'Extract synthesis, citations & dual-tab sources';

        header.appendChild(title);
        header.appendChild(subtitle);
        consoleEl.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.className = 'nrdr-console-content';

        const status = document.createElement('div');
        status.id = 'nrdr-status';
        status.className = 'nrdr-status';
        content.appendChild(status);

        // Helper handler to prevent menu auto-closing on async collection
        const handleCollect = (e, type) => {
            e.preventDefault();
            e.stopPropagation();
            ExportService.collectTab(type).then(updateStatus);
        };

        // Collect Cited
        const btnCited = document.createElement('button');
        btnCited.className = 'nrdr-btn nrdr-btn-collect';
        btnCited.textContent = '📥 Collect Cited Sources';
        btnCited.onclick = (e) => handleCollect(e, 'cited');
        content.appendChild(btnCited);

        // Collect Not Cited
        const btnNotCited = document.createElement('button');
        btnNotCited.className = 'nrdr-btn nrdr-btn-collect';
        btnNotCited.textContent = '📥 Collect Not Cited Sources';
        btnNotCited.onclick = (e) => handleCollect(e, 'notCited');
        content.appendChild(btnNotCited);

        // Copy
        const btnCopy = document.createElement('button');
        btnCopy.className = 'nrdr-btn';
        btnCopy.textContent = '📋 Copy Full Report Markdown';
        btnCopy.onclick = (e) => { e.stopPropagation(); ExportService.exportToClipboard(); };
        content.appendChild(btnCopy);

        // Download
        const btnDownload = document.createElement('button');
        btnDownload.className = 'nrdr-btn nrdr-btn-primary';
        btnDownload.textContent = '⬇️ Download .md';
        btnDownload.onclick = (e) => { e.stopPropagation(); ExportService.exportToFile(); };
        content.appendChild(btnDownload);

        consoleEl.appendChild(content);
        document.body.appendChild(consoleEl);

        function updateStatus() {
            const hasReport = !!document.querySelector(CONFIG.SELECTORS.REPORT_CONTAINER);
            const citedCount = State.citedSources ? State.citedSources.length : 'Uncached';
            const notCitedCount = State.notCitedSources ? State.notCitedSources.length : 'Uncached';

            if (hasReport) {
                status.textContent = `✓ Report Detected\nCited: ${citedCount} | Not Cited: ${notCitedCount}`;
            } else {
                status.textContent = '⚠️ Open a Deep Research report first';
            }
        }

        orb.onclick = (e) => {
            e.stopPropagation();
            const isOpen = consoleEl.style.display === 'flex';
            consoleEl.style.display = isOpen ? 'none' : 'flex';
            if (!isOpen) updateStatus();
        };

        // Click-outside listener (guarded against programmatic tab switching)
        document.addEventListener('click', (e) => {
            if (State.isProgrammaticClick) return;
            if (!orb.contains(e.target) && !consoleEl.contains(e.target)) {
                consoleEl.style.display = 'none';
            }
        });
    }

    function init() {
        console.log('🔎 Noosphere Reflect Deep Research Exporter Initialized');
        injectStyles();
        createMenu();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
