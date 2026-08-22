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
            USER_MESSAGE: '[data-testid="user-message"], [data-message-author-role="user"], .font-user-message',
            USER_MESSAGE_TEXT: 'p.whitespace-pre-wrap, .whitespace-pre-wrap, p',
            
            // Assistant Message Containers
            ASSISTANT_ROW: '[data-message-author-role="assistant"], [data-testid="assistant-message"], .font-claude-response',
            ASSISTANT_CONTENT: '.font-claude-response, .standard-markdown, .prose',
            ASSISTANT_MARKDOWN: '.standard-markdown, .prose, .markdown-body',
            ASSISTANT_PARAGRAPH: 'p.font-claude-response-body, p',
            ASSISTANT_TIMESTAMP: 'time[datetime]',
            MESSAGE_ACTIONS: '[data-cds="MessageActions"]',
            
            // Thinking Block Containers
            THINKING_CONTAINER: '.row-start-1.col-start-1',
            THINKING_BUTTON: 'button[aria-expanded]',
            THINKING_SUMMARY: 'span.truncate.font-base',
            THINKING_PANEL: '[data-cds="Collapsible"]',
            THINKING_STEPS: '[data-timeline-text]',
            THINKING_CONTENT: '.standard-markdown',
            
            // Header Injection
            WIGGLE_ACTIONS_GROUP: '[data-testid="wiggle-controls-actions-group"]',
            
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
            MUTED_SOFT: '#8e8b82',
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
        currentTheme: null,
        isDirty: true
    };

    // ============================================================
    // Session Message Cache
    // ============================================================
    // Persists collected messages to sessionStorage per conversation,
    // so the sidebar doesn't need to re-walk the entire virtualized DOM
    // on every open/close cycle. Clears on page reload (sessionStorage).

    const MessageCache = {
        _key() {
            // Derive conversation-specific key from the URL path.
            // Claude URLs: /chat/<uuid> or /project/<uuid>/chat/<uuid>
            const path = window.location.pathname || 'unknown';
            const id = path.replace(/^\/+|\/+$/g, '').replace(/\//g, '_') || 'unknown';
            return `ns_claude_cache_${id}`;
        },

        load() {
            try {
                const raw = sessionStorage.getItem(this._key());
                if (!raw) return null;

                const parsed = JSON.parse(raw);
                // Validate shape
                if (!parsed || parsed.version !== 1) return null;
                if (parsed.url !== window.location.pathname) {
                    // Conversation changed (SPA navigation without reload)
                    sessionStorage.removeItem(this._key());
                    return null;
                }
                return parsed;
            } catch (e) {
                // Quota exceeded, corrupted data, or any other sessionStorage error
                return null;
            }
        },

        save() {
            try {
                const payload = {
                    version: 1,
                    url: window.location.pathname,
                    savedAt: Date.now(),
                    messages: STATE.messages.map(m => ({
                        id: m.id,
                        role: m.role,
                        text: m.text,
                        thinking: m.thinking || null,
                        timestamp: m.timestamp || '',
                        preview: m.preview || ''
                    })),
                    selectedIds: Array.from(STATE.selectedIds)
                };

                const serialized = JSON.stringify(payload);

                // Size guard: sessionStorage quota is ~5MB. If payload exceeds
                // 4MB (leaving headroom for other keys), don't cache rather than
                // throwing QuotaExceededError.
                if (serialized.length > 4 * 1024 * 1024) {
                    console.warn('[Noosphere Claude] Cache payload exceeds 4MB, skipping cache save');
                    return;
                }

                sessionStorage.setItem(this._key(), serialized);
            } catch (e) {
                // Silent degradation: cache is a perf optimization, never a hard dependency
                console.warn('[Noosphere Claude] Cache save failed', e);
            }
        },

        clear() {
            try {
                sessionStorage.removeItem(this._key());
            } catch (e) { /* ignore */ }
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
        return Utils.cleanText(textEl.innerText || container.innerText || '');
    }

    function extractAssistantMessage(container) {
        const contentEl = container.querySelector(CONFIG.SELECTORS.ASSISTANT_CONTENT) ||
                          container.querySelector(CONFIG.SELECTORS.ASSISTANT_MARKDOWN) ||
                          container;
        
        // Get timestamp if available
        const timeEl = container.querySelector(CONFIG.SELECTORS.ASSISTANT_TIMESTAMP);
        const timestamp = timeEl?.getAttribute('datetime') || '';
        
        const markdownEl = contentEl ? (contentEl.querySelector(CONFIG.SELECTORS.ASSISTANT_MARKDOWN) || contentEl) : container;
        let content = htmlToMarkdown(markdownEl);
        if (!content || !content.trim()) {
            content = htmlToMarkdown(container);
        }
        
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
        const oldLength = STATE.messages.length;
        const IS_CHROME_OR_MENU = (el) => {
            const noiseSelectors = [
                'header', 'nav', 'aside', // <--- Exclude all sidebars, profiles, rails
                '[data-testid*="profile"]', 
                '[data-testid*="menu"]', 
                '[data-testid*="account"]', 
                '[data-cds="Dropdown"]', 
                '#ns-claude-sidebar', 
                '#ns-claude-overlay'
            ].join(', ');
            return !!el.closest(noiseSelectors);
        };

        // 1. Find User Message Elements
        let userEls = Array.from(document.querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE))
            .filter(el => !IS_CHROME_OR_MENU(el));

        // 2. Find Assistant Message Elements
        let assistantEls = Array.from(document.querySelectorAll(CONFIG.SELECTORS.ASSISTANT_ROW))
            .filter(el => !IS_CHROME_OR_MENU(el));

        // Fallback to .font-claude-response if role containers are not present
        if (assistantEls.length === 0) {
            assistantEls = Array.from(document.querySelectorAll('.font-claude-response'))
                .filter(el => !IS_CHROME_OR_MENU(el));
        }

        // Helper: Strip out any nested child elements when a parent container was already matched
        const filterNested = (elements) => {
            return elements.filter((el, idx) => {
                return !elements.some((other, oIdx) => oIdx !== idx && other.contains(el));
            });
        };

        userEls = filterNested(userEls);
        assistantEls = filterNested(assistantEls);

        const allElements = [];

        userEls.forEach(el => {
            const text = extractUserMessage(el);
            if (text && text.trim().length > 0) {
                allElements.push({
                    type: 'user',
                    el,
                    text,
                    preview: text.substring(0, 75) + (text.length > 75 ? '...' : '')
                });
            }
        });

        assistantEls.forEach(el => {
            // Prevent overlap with user message elements
            if (userEls.some(uEl => uEl.contains(el) || el.contains(uEl))) return;

            const { content, timestamp } = extractAssistantMessage(el);

            // Directly inspect for inline or adjacent thinking block
            let thinkingData = null;
            const thinkingEl = el.querySelector(CONFIG.SELECTORS.THINKING_CONTAINER) ||
                               el.querySelector('[data-cds="Collapsible"]');
            if (thinkingEl) {
                const extracted = extractThinkingBlock(thinkingEl);
                if (extracted && extracted.content) {
                    thinkingData = extracted;
                }
            }

            if (content && content.trim().length > 0) {
                allElements.push({
                    type: 'assistant',
                    el,
                    text: content,
                    timestamp,
                    preview: content.substring(0, 75).replace(/\n/g, ' ') + (content.length > 75 ? '...' : ''),
                    thinking: thinkingData
                });
            }
        });

        // Sort strictly by DOM position (topological document tree order)
        allElements.sort((a, b) => {
            if (!a.el || !b.el) return 0;
            return (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
        });
        
        const newMessages = allElements.map(item => ({
            role: item.type,
            text: item.text,
            thinking: item.thinking || null,
            timestamp: item.timestamp || '',
            preview: item.preview
        }));

        if (STATE.messages.length === 0) {
            newMessages.forEach((msg, idx) => {
                msg.id = idx;
                STATE.messages.push(msg);
                STATE.selectedIds.add(msg.id);
            });
        } else if (newMessages.length > 0) {
            let matchIndexNew = -1;
            let matchIndexOld = -1;
            for (let i = 0; i < newMessages.length; i++) {
                const newMsg = newMessages[i];
                for (let j = 0; j < STATE.messages.length; j++) {
                    const oldMsg = STATE.messages[j];
                    if (newMsg.role === oldMsg.role && newMsg.text === oldMsg.text) {
                        matchIndexNew = i;
                        matchIndexOld = j;
                        break;
                    }
                }
                if (matchIndexNew !== -1) break;
            }

            let nextId = Math.max(...STATE.messages.map(m => m.id)) + 1;
            
            let matchNew = -1;
            let matchOld = -1;
            
            for (let i = 0; i < newMessages.length; i++) {
                const n = newMessages[i];
                for (let j = 0; j < STATE.messages.length; j++) {
                    const o = STATE.messages[j];
                    if (n.role === o.role && n.text === o.text) {
                        matchNew = i;
                        matchOld = j;
                        break;
                    }
                }
                if (matchNew !== -1) break;
            }
            
            if (matchNew === -1) {
                // No overlap found. Assume newer messages and append them.
                const toAdd = newMessages.filter(n => !STATE.messages.some(o => o.role === n.role && o.text === n.text));
                toAdd.forEach(msg => {
                    msg.id = nextId++;
                    STATE.selectedIds.add(msg.id);
                    STATE.messages.push(msg);
                });
            } else {
                // 1. Insert any new messages that appear BEFORE the anchor
                const before = newMessages.slice(0, matchNew).filter(n => !STATE.messages.some(o => o.role === n.role && o.text === n.text));
                before.forEach(msg => {
                    msg.id = nextId++;
                    STATE.selectedIds.add(msg.id);
                });
                if (before.length > 0) {
                    STATE.messages.splice(matchOld, 0, ...before);
                }
                
                // 2. Insert any new messages that appear AFTER the anchor
                let currentOldIndex = matchOld + before.length;
                
                for (let i = matchNew + 1; i < newMessages.length; i++) {
                    const newMsg = newMessages[i];
                    const existsIdx = STATE.messages.findIndex(o => o.role === newMsg.role && o.text === newMsg.text);
                    
                    if (existsIdx !== -1) {
                        // Message already captured. Backfill richer thinking content.
                        // Old messages can mount with their thinking blocks collapsed, so an
                        // earlier scan may have stored `thinking: null`. If we now have the
                        // full reasoning, update the existing record rather than dropping it.
                        const existing = STATE.messages[existsIdx];
                        if (existing && !existing.thinking && newMsg.thinking && newMsg.thinking.content) {
                            existing.thinking = newMsg.thinking;
                            STATE.isDirty = true;
                        }
                        // Backfill a timestamp that was missing on first mount.
                        if (existing && existing.timestamp !== newMsg.timestamp) {
                            existing.timestamp = newMsg.timestamp;
                            STATE.isDirty = true;
                        }
                        currentOldIndex = existsIdx;
                    } else {
                        newMsg.id = nextId++;
                        STATE.selectedIds.add(newMsg.id);
                        currentOldIndex++;
                        STATE.messages.splice(currentOldIndex, 0, newMsg);
                    }
                }
            }
        }
        
        if (STATE.messages.length !== oldLength) {
            STATE.isDirty = true;
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

            const sidebar = document.getElementById('ns-claude-sidebar');
            if (sidebar) {
                if (themeName === 'dark') sidebar.classList.add('ns-claude-dark-theme');
                else sidebar.classList.remove('ns-claude-dark-theme');
            }
            
            const trigger = document.getElementById('ns-claude-header-btn');
            if (trigger) {
                if (themeName === 'dark') trigger.classList.add('ns-claude-dark-theme');
                else trigger.classList.remove('ns-claude-dark-theme');
            }
        },

        init() {
            // First time init: inject the base styles with CSS variables
            injectStyles();

            const initial = this.detect();
            console.log('[Noosphere Claude] Initial theme detected:', initial);
            this.apply(initial);

            // Poll every 500ms
            this._pollInterval = setInterval(() => {
                const detected = this.detect();
                if (detected !== STATE.currentTheme) {
                    console.log('[Noosphere Claude] Theme changed:', detected);
                    this.apply(detected);
                }
            }, 500);

            // Also watch html element
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
        }
    };

    function injectStyles() {
        if (document.getElementById('noosphere-claude-styles')) return;

        const style = document.createElement('style');
        style.id = 'noosphere-claude-styles';
        style.textContent = `
            :root, #ns-claude-sidebar, #ns-claude-header-btn {
                --ns-bg: ${CONFIG.THEME.CANVAS};
                --ns-bg-elevated: ${CONFIG.THEME.SURFACE_CARD};
                --ns-bg-soft: ${CONFIG.THEME.SURFACE_SOFT};
                --ns-text: ${CONFIG.THEME.INK};
                --ns-text-muted: ${CONFIG.THEME.MUTED};
                --ns-border: ${CONFIG.THEME.HAIRLINE};
                --ns-input-bg: ${CONFIG.THEME.CANVAS};
                --ns-card-bg: ${CONFIG.THEME.CANVAS};
                --ns-card-hover: ${CONFIG.THEME.SURFACE_CARD};
                --ns-btn-hover-bg: rgba(0, 0, 0, 0.06);
                --ns-role-user-bg: ${CONFIG.THEME.SURFACE_CARD};
            }
            :root.ns-claude-dark-theme, 
            #ns-claude-sidebar.ns-claude-dark-theme, 
            #ns-claude-header-btn.ns-claude-dark-theme {
                --ns-bg: ${CONFIG.THEME.SURFACE_DARK};
                --ns-bg-elevated: ${CONFIG.THEME.SURFACE_DARK_ELEVATED};
                --ns-bg-soft: ${CONFIG.THEME.SURFACE_DARK_SOFT};
                --ns-text: ${CONFIG.THEME.ON_DARK};
                --ns-text-muted: ${CONFIG.THEME.ON_DARK_SOFT};
                --ns-border: #323238;
                --ns-input-bg: ${CONFIG.THEME.SURFACE_DARK_ELEVATED};
                --ns-card-bg: ${CONFIG.THEME.SURFACE_DARK_ELEVATED};
                --ns-card-hover: #2c2c32;
                --ns-btn-hover-bg: rgba(255, 255, 255, 0.08);
                --ns-role-user-bg: rgba(255,255,255,0.1);
            }

            /* Export Chat Header Button */
            .ns-claude-header-btn {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 36px !important;
                height: 36px !important;
                padding: 0 !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                color: var(--ns-text) !important;
                background: transparent !important;
                border: none !important;
                transition: all 0.15s ease !important;
                user-select: none !important;
                flex-shrink: 0 !important;
            }
            .ns-claude-header-btn:hover {
                background: var(--ns-btn-hover-bg) !important;
            }
            .ns-claude-header-btn:active {
                transform: scale(98.5%) !important;
            }
            .ns-claude-header-btn svg {
                width: 18px !important;
                height: 18px !important;
                stroke: currentColor !important;
                fill: none !important;
            }

            /* Rail Button Styling */
            .ns-claude-rail-btn {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 4px !important;
                color: var(--ns-text-muted) !important;
                background: transparent !important;
                border: none !important;
                cursor: pointer !important;
                transition: color 0.15s ease !important;
            }
            .ns-claude-rail-btn:hover {
                color: var(--ns-text) !important;
            }
            .ns-claude-rail-btn svg {
                width: 16px !important;
                height: 16px !important;
                stroke: currentColor !important;
                fill: none !important;
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
                background: var(--ns-bg);
                border-left: 1px solid var(--ns-border);
                color: var(--ns-text);
                z-index: 100002;
                transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                flex-direction: column;
                box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
                font-family: StyreneB, Inter, system-ui, -apple-system, sans-serif;
            }
            #ns-claude-sidebar.active { right: 0; }

            /* Sidebar Loading Overlay */
            #ns-claude-sidebar-loading {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: var(--ns-bg-soft);
                backdrop-filter: blur(4px);
                z-index: 100003;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 16px;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            #ns-claude-sidebar-loading.active {
                opacity: 1;
                pointer-events: all;
            }
            .ns-claude-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid var(--ns-border);
                border-top-color: ${CONFIG.THEME.PRIMARY_CORAL};
                border-radius: 50%;
                animation: ns-spin 1s linear infinite;
            }
            .ns-claude-loading-text {
                font-size: 13px;
                font-weight: 500;
                color: var(--ns-text-muted);
                font-family: StyreneB, Inter, system-ui, sans-serif;
            }
            @keyframes ns-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Sidebar Header */
            .ns-claude-header {
                padding: 20px 24px 16px;
                background: var(--ns-bg);
                border-bottom: 1px solid var(--ns-border);
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
                color: var(--ns-text) !important;
                margin: 0 !important;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .ns-claude-subtitle {
                font-size: 13px !important;
                color: var(--ns-text-muted) !important;
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
                color: var(--ns-text-muted) !important;
                text-transform: uppercase !important;
                letter-spacing: 1px !important;
            }
            .ns-claude-input {
                width: 100%;
                background: var(--ns-input-bg) !important;
                border: 1px solid var(--ns-border) !important;
                border-radius: 8px !important;
                padding: 10px 14px !important;
                color: var(--ns-text) !important;
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
                background: var(--ns-input-bg) !important;
                border: 1px solid var(--ns-border) !important;
                border-radius: 8px !important;
                color: var(--ns-text-muted) !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                text-align: center !important;
                transition: all 0.15s ease !important;
                font-family: StyreneB, Inter, system-ui, sans-serif !important;
            }
            .ns-claude-batch-btn:hover {
                background: var(--ns-card-hover) !important;
                color: var(--ns-text) !important;
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
                background: var(--ns-border);
                border-radius: 3px;
            }

            /* Message Card */
            .ns-claude-msg-card {
                background: var(--ns-card-bg) !important;
                border: 1px solid var(--ns-border) !important;
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
                background: var(--ns-card-bg) !important;
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
                background: var(--ns-role-user-bg) !important;
                color: var(--ns-text) !important;
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
                color: var(--ns-text-muted) !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                word-break: break-word !important;
            }

            /* Accordion */
            .ns-claude-accordion {
                background: var(--ns-bg-soft) !important;
                border-top: 1px solid var(--ns-border) !important;
                padding: 12px 14px 14px 44px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                font-size: 13px !important;
            }
            .ns-claude-accordion-thinking {
                color: var(--ns-text-muted) !important;
                font-style: italic !important;
                max-height: 120px !important;
                overflow-y: auto !important;
                line-height: 1.5 !important;
            }
            .ns-claude-accordion-content {
                color: var(--ns-text-muted) !important;
                white-space: pre-wrap !important;
                max-height: 200px !important;
                overflow-y: auto !important;
                line-height: 1.5 !important;
            }

            /* Sidebar Footer */
            .ns-claude-footer {
                padding: 16px 20px;
                background: var(--ns-bg);
                border-top: 1px solid var(--ns-border);
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }
            .ns-claude-btn {
                border: 1px solid var(--ns-border);
                border-radius: 8px;
                padding: 10px 14px;
                background: var(--ns-input-bg);
                color: var(--ns-text);
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                text-align: center;
                transition: all 0.15s ease;
                white-space: nowrap;
                font-family: StyreneB, Inter, system-ui, sans-serif;
            }
            .ns-claude-btn:hover {
                background: var(--ns-card-hover);
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
                background: var(--ns-input-bg);
                border: 1px solid var(--ns-border);
                border-radius: 8px;
                color: var(--ns-text);
                padding: 10px 8px;
                outline: none;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                text-align: center;
                font-family: StyreneB, Inter, system-ui, sans-serif;
            }
            .ns-claude-format-select option {
                background: var(--ns-bg);
                color: var(--ns-text);
            }
            .ns-claude-btn-copy { flex: 1; }
        `;
        document.head.appendChild(style);
    }

    // ============================================================
    // Header Trigger Injection
    // ============================================================

    function injectHeaderTrigger() {
        // Try the workspace rail first
        let targetGroup = document.querySelector('.chat-workspace-rail__actions');
        let isRail = !!targetGroup;
        
        // Fallback to the wiggle actions group
        if (!targetGroup) {
            targetGroup = document.querySelector(CONFIG.SELECTORS.WIGGLE_ACTIONS_GROUP);
        }

        if (!targetGroup) return;

        let triggerBtn = document.getElementById('ns-claude-header-btn');
        if (triggerBtn) {
            // Check if it's already in the right place
            if (triggerBtn.parentElement === targetGroup) return;
            // Otherwise remove it so we can re-inject
            triggerBtn.remove();
        }

        triggerBtn = document.createElement('button');
        triggerBtn.id = 'ns-claude-header-btn';
        
        // If in rail, match rail button styling, else match header styling
        if (isRail) {
            triggerBtn.className = 'btn btn--ghost btn--sm ns-claude-rail-btn';
        } else {
            triggerBtn.className = 'ns-claude-header-btn';
        }
        
        // Ensure theme class is applied correctly if initialized
        if (STATE.currentTheme === 'dark') {
            triggerBtn.classList.add('ns-claude-dark-theme');
        }
        
        triggerBtn.setAttribute('aria-label', 'Export Session');
        triggerBtn.title = 'Export Session';
        
        triggerBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke-miterlimit="10" stroke-linecap="square"><path d="M12 3V15" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="square" fill="none"/><path d="M4 18L4 20L20 20L20 18" stroke="currentColor" stroke-width="2" stroke-linecap="square" fill="none"/></svg>`;
        triggerBtn.onclick = (e) => {
            e.stopPropagation();
            openSidebar();
        };

        // Insert as first child
        targetGroup.prepend(triggerBtn);
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

    function getScrollContainer() {
        const msgEl = document.querySelector(CONFIG.SELECTORS.USER_MESSAGE) || document.querySelector(CONFIG.SELECTORS.ASSISTANT_ROW);
        if (!msgEl) return null;
        
        let parent = msgEl.parentElement;
        while (parent && parent !== document.body && parent !== document.documentElement) {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') {
                return parent;
            }
            parent = parent.parentElement;
        }
        return document.documentElement;
    }

    async function autoLoadAllMessages() {
        const loadingOverlay = document.getElementById('ns-claude-sidebar-loading');
        if (loadingOverlay) loadingOverlay.classList.add('active');

        // Render current state underneath the overlay
        renderMessageList();

        // Allow UI to render the overlay and list
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 50));

        const scrollContainer = getScrollContainer();
        if (!scrollContainer) {
            if (loadingOverlay) loadingOverlay.classList.remove('active');
            renderMessageList();
            STATE.isDirty = false;
            return;
        }

        const originalScrollTop = scrollContainer.scrollTop;
        let stuckCount = 0;
        let lastLength = STATE.messages.length;
        let lastObservedTop = scrollContainer.scrollTop;
        let firstIteration = true;

        while (true) {
            // Walk up toward the conversation start. We use a negative offset
            // from the current position so Claude's virtualizer mounts the
            // window *above* the one we just captured, letting us stitch it into
            // STATE.messages on the next iteration.
            const targetTop = Math.max(0, scrollContainer.scrollTop - scrollContainer.clientHeight * 0.9);
            scrollContainer.scrollTop = targetTop;
            
            // Wait for Claude to fetch and render the new window
            await new Promise(resolve => setTimeout(resolve, 600));

            // Read the position Claude actually settled on (not the value we wrote)
            const settledTop = scrollContainer.scrollTop;

            // Expand thinking blocks in the newly-mounted window so the extractor
            // can capture the full reasoning (older messages can mount collapsed).
            await autoExpandThinkingBlocks();

            // Run our scan to accumulate
            scanConversation();

            const grew = STATE.messages.length > lastLength;

            if (grew) {
                // Progress — keep walking up
                stuckCount = 0;
                lastLength = STATE.messages.length;
                lastObservedTop = settledTop;
                firstIteration = false;
                continue;
            }

            // No growth. Determine whether we're truly at the top or just stalled.
            const atVeryTop = settledTop <= 1;
            const noUpwardMove = settledTop >= lastObservedTop;

            if (atVeryTop || noUpwardMove) {
                stuckCount++;
                // Require several consecutive stalled-at-top checks before giving up,
                // so transient fetch/render pauses don't abort the walk prematurely.
                if (stuckCount >= 3) break;
            } else {
                // The container can still scroll further up; we're just mid-render.
                // Keep walking toward the top.
                stuckCount = 0;
                lastObservedTop = settledTop;
            }

            firstIteration = false;
        }

        // Restore scroll position
        scrollContainer.scrollTop = originalScrollTop;

        // Final render
        renderMessageList();
        STATE.isDirty = false;

        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }

    async function openSidebar() {
        // Auto-expand thinking blocks first
        await autoExpandThinkingBlocks();

        // Load cached messages (if any) so the sidebar renders instantly
        // and the walk only collects new messages / backfills thinking.
        const cached = MessageCache.load();
        if (cached && cached.messages && cached.messages.length > 0) {
            STATE.messages = cached.messages;
            STATE.selectedIds = new Set(cached.selectedIds || []);
        } else {
            // No cache: do an initial scan so the sidebar has something to show
            // while the walk runs in the background.
            scanConversation();
        }
        
        // Open sidebar visually immediately
        const overlay = document.getElementById('ns-claude-overlay');
        const sidebar = document.getElementById('ns-claude-sidebar');
        overlay.classList.add('active');
        sidebar.classList.add('active');
        STATE.sidebarOpen = true;

        // When a cache was loaded, skip the walk entirely — the cache already
        // has the full history. The MutationObserver (requestScan) will catch
        // any new messages the user adds while the sidebar is open.
        // Only run the walk on first-ever open (no cache).
        if (!cached) {
            await autoLoadAllMessages();
        } else {
            // Still render the list so the sidebar shows cached messages
            renderMessageList();
            STATE.isDirty = false;
        }

        // Save cache after the walk completes
        MessageCache.save();
    }

    function closeSidebar() {
        const overlay = document.getElementById('ns-claude-overlay');
        const sidebar = document.getElementById('ns-claude-sidebar');
        overlay.classList.remove('active');
        sidebar.classList.remove('active');
        STATE.sidebarOpen = false;

        // Save cache so reopen within this page session is near-instant
        MessageCache.save();
    }

    function createSidebarUI() {
        if (document.getElementById('ns-claude-sidebar')) return;

        const overlay = document.createElement('div');
        overlay.id = 'ns-claude-overlay';

        const sidebar = document.createElement('div');
        sidebar.id = 'ns-claude-sidebar';
        if (STATE.currentTheme === 'dark') {
            sidebar.classList.add('ns-claude-dark-theme');
        }

        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'ns-claude-sidebar-loading';
        loadingOverlay.innerHTML = `
            <div class="ns-claude-spinner"></div>
            <div class="ns-claude-loading-text">Loading full conversation...</div>
        `;
        sidebar.appendChild(loadingOverlay);

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

        footer.appendChild(cancelBtn);
        footer.appendChild(formatSelect);
        footer.appendChild(copyBtn);

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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && STATE.sidebarOpen) closeSidebar();
        });
    }

    // ============================================================
    // Observer for Menu Re-injection & Scroll Collection
    // ============================================================

    let scanTimeout = null;
    function requestScan() {
        if (scanTimeout) clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
            scanConversation();
            if (STATE.sidebarOpen && STATE.isDirty) {
                renderMessageList();
                STATE.isDirty = false;
            }
        }, 500);
    }

    function setupHeaderObserver() {
        const observer = new MutationObserver((mutations) => {
            // Ignore mutations that occur entirely within our own UI to prevent infinite loops
            const isOnlyOurUI = mutations.every(m => {
                let target = m.target;
                if (target.nodeType === Node.TEXT_NODE) target = target.parentNode;
                if (!target || !target.closest) return false;
                return target.closest('#ns-claude-sidebar') || target.closest('#ns-claude-overlay') || target.closest('#noosphere-claude-styles');
            });
            if (isOnlyOurUI) return;

            let targetGroup = document.querySelector('.chat-workspace-rail__actions') || document.querySelector(CONFIG.SELECTORS.WIGGLE_ACTIONS_GROUP);
            let btn = document.getElementById('ns-claude-header-btn');
            
            if (targetGroup && (!btn || btn.parentElement !== targetGroup)) {
                injectHeaderTrigger();
            }

            // Debounced scan to accumulate virtualized messages during scrolling
            requestScan();
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
        injectHeaderTrigger();
        setupHeaderObserver();

        // Clear cache on page unload so it doesn't persist across reloads.
        // sessionStorage normally clears on page reload, but some browsers
        // (or SPA behaviors) may preserve it. This ensures a clean slate
        // on every fresh page load.
        window.addEventListener('beforeunload', () => MessageCache.clear());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();