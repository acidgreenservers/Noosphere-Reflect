(function () {
    'use strict';

    const CONFIG = {
        SELECTORS: {
            TITLE: 'h2.cover-title',
            META_SOURCES: '.cover-subtitle-source-count',
            META_DATE: '.cover-subtitle-date',
            INTRO: 'div.summary-content p',
            // FIX: use container divs inside chat-message to discriminate turns
            USER_MESSAGE: 'chat-message .from-user-container',
            AI_MESSAGE:   'chat-message .to-user-container',
            AI_CONTENT:   '.message-text-content'
        },
        TIMING: { POPUP_DURATION: 2000 }   // bumped from 900ms — was too easy to miss
    };

    const Utils = {
        createNotification(message) {
            const notification = document.createElement('div');
            notification.textContent = message;
            Object.assign(notification.style, {
                position: 'fixed', top: '20px', right: '20px',
                background: '#10b981', color: 'white',
                padding: '12px 20px', borderRadius: '8px', zIndex: '10000',
                fontSize: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'opacity 0.3s ease', fontFamily: 'system-ui'
            });
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, CONFIG.TIMING.POPUP_DURATION);
        },
        sanitizeFilename(text) {
            return text.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_').substring(0, 50);
        },
        getDateString() {
            const now = new Date();
            const pad = n => n.toString().padStart(2, '0');
            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        }
    };

    function injectStyles() {
        if (document.getElementById('noosphere-styles-gn')) return;
        const style = document.createElement('style');
        style.id = 'noosphere-styles-gn';
        style.textContent = `
            .ns-orb {
                position: fixed; bottom: 25px; right: 25px; width: 56px; height: 56px;
                background: linear-gradient(135deg, #10b981, #8b5cf6);
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                cursor: pointer; z-index: 100000; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                transition: all 0.3s ease; border: 2px solid rgba(255,255,255,0.2);
                font-size: 24px; font-weight: bold; color: white;
            }
            .ns-orb:hover { transform: scale(1.1); }
            .ns-console {
                position: fixed; bottom: 95px; right: 25px; width: 320px;
                background: rgba(17, 24, 39, 0.9); backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
                z-index: 99999; overflow: hidden; display: none; flex-direction: column;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5); color: white;
                font-family: system-ui;
            }
            .ns-console-header { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .ns-console-title { font-size: 16px; font-weight: 700; margin: 0; }
            .ns-console-content { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
            .ns-bulk-controls { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 8px; }
            .ns-bulk-btn {
                padding: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                border-radius: 6px; color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 600;
                cursor: pointer; transition: all 0.2s;
            }
            .ns-bulk-btn:hover { background: rgba(255,255,255,0.1); color: white; }
            .ns-btn {
                width: 100%; padding: 10px 12px; background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;
                font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
            }
            .ns-btn:hover { background: rgba(255,255,255,0.1); }
            .ns-btn-primary {
                background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.3); color: #10b981;
            }
            .ns-btn-primary:hover { background: rgba(16, 185, 129, 0.3); }
            .ns-checkbox {
                appearance: none; width: 18px; height: 18px; border: 2px solid #10b981;
                border-radius: 4px; cursor: pointer; background: rgba(0,0,0,0.3);
                transition: all 0.2s; position: relative;
            }
            .ns-checkbox:checked { background: #10b981; }
            .ns-checkbox:checked::after {
                content: '✓'; position: absolute; color: white; font-size: 12px;
                top: 50%; left: 50%; transform: translate(-50%, -50%);
            }
        `;
        document.head.appendChild(style);
    }

    function createMenu() {
        const orb = document.createElement('div');
        orb.className = 'ns-orb';
        orb.textContent = '📋';
        document.body.appendChild(orb);

        const consoleEl = document.createElement('div');
        consoleEl.className = 'ns-console';

        const header = document.createElement('div');
        header.className = 'ns-console-header';
        const title = document.createElement('div');
        title.className = 'ns-console-title';
        title.textContent = 'Noosphere Reflect Export';
        header.appendChild(title);
        consoleEl.appendChild(header);

        const content = document.createElement('div');
        content.className = 'ns-console-content';

        const bulkControls = document.createElement('div');
        bulkControls.className = 'ns-bulk-controls';
        ['All', 'User', 'AI', 'None'].forEach(label => {
            const btn = document.createElement('div');
            btn.className = 'ns-bulk-btn';
            btn.id = `ns-select-${label.toLowerCase()}`;
            btn.textContent = label;
            bulkControls.appendChild(btn);
        });
        content.appendChild(bulkControls);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'ns-btn';
        copyBtn.id = 'ns-copy-md';
        copyBtn.textContent = '📋 Copy Markdown';
        content.appendChild(copyBtn);

        const dlBtn = document.createElement('button');
        dlBtn.className = 'ns-btn ns-btn-primary';
        dlBtn.id = 'ns-dl-md';
        dlBtn.textContent = '⬇️ Download .md';
        content.appendChild(dlBtn);

        consoleEl.appendChild(content);
        document.body.appendChild(consoleEl);

        orb.onclick = (e) => {
            e.stopPropagation();
            consoleEl.style.display = consoleEl.style.display === 'flex' ? 'none' : 'flex';
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
            // FIX: type is now passed correctly ('user' vs 'assistant') per container
            checkbox.dataset.type = type;
            checkbox.checked = true;
            checkbox.style.position = 'absolute';
            checkbox.style.left = '-30px';
            checkbox.style.top = '8px';
            container.style.position = 'relative';
            container.prepend(checkbox);
        };

        // FIX: correct selectors, correct type labels
        document.querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE).forEach(el => {
            createCheckbox('user', el);
        });
        document.querySelectorAll(CONFIG.SELECTORS.AI_MESSAGE).forEach(el => {
            createCheckbox('assistant', el);
        });
    }

    function setupObserver() {
        const observer = new MutationObserver(() => injectCheckboxes());
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // FIX: parseNode no longer recurses on the same node for b/strong/i/em
    function parseNode(node) {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            const inner = () => Array.from(node.childNodes).map(parseNode).join('');
            if (tag === 'b' || tag === 'strong') return `**${inner()}**`;
            if (tag === 'i' || tag === 'em') return `*${inner()}*`;
            if (tag === 'p') return '\n\n' + inner();
            return inner();
        }
        return '';
    }

    function extractUserMessage(element) {
        if (!element) return '';
        const clone = element.cloneNode(true);
        // Remove injected checkbox before parsing
        clone.querySelectorAll('.ns-checkbox').forEach(n => n.remove());
        return parseNode(clone).replace(/\n{3,}/g, '\n\n').trim();
    }

    function extractAIMessage(element) {
        if (!element) return '';
        const contentDiv = element.querySelector(CONFIG.SELECTORS.AI_CONTENT);
        if (!contentDiv) return '';
        const clone = contentDiv.cloneNode(true);

        // Strip citation markers, lock icons, and any non-text chrome
        clone.querySelectorAll('[class*="citation"], .citation-marker, button, [role="img"], mat-icon').forEach(n => n.remove());

        // NotebookLM AI uses div.paragraph.normal (Angular custom renderer),
        // not <p> tags — target those explicitly for paragraph separation
        const paragraphs = clone.querySelectorAll('div.paragraph');
        if (paragraphs.length > 0) {
            return Array.from(paragraphs)
                .map(p => parseNode(p).trim())
                .filter(Boolean)
                .join('\n\n');
        }

        // Fallback: plain parseNode walk if structure ever changes
        return parseNode(clone).replace(/\n{3,}/g, '\n\n').trim();
    }

    const ExportService = {
        getConversationTitle() {
            const titleEl = document.querySelector(CONFIG.SELECTORS.TITLE);
            return titleEl?.innerText.trim() || 'Google_Notebook_Chat';
        },

        buildMarkdown() {
            const title = this.getConversationTitle();
            const sources = document.querySelector(CONFIG.SELECTORS.META_SOURCES)?.innerText.trim() || '';
            const date = document.querySelector(CONFIG.SELECTORS.META_DATE)?.innerText.trim() || '';
            const introEl = document.querySelector(CONFIG.SELECTORS.INTRO);
            const intro = introEl ? parseNode(introEl) : '';
            const sourceUrl = window.location.href;
            const exportedAt = new Date().toLocaleString();

            const userMessages = Array.from(document.querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE))
                .filter(el => el.querySelector('.ns-checkbox')?.checked)
                .map(el => extractUserMessage(el))
                .filter(Boolean);

            const aiMessages = Array.from(document.querySelectorAll(CONFIG.SELECTORS.AI_MESSAGE))
                .filter(el => el.querySelector('.ns-checkbox')?.checked)
                .map(el => extractAIMessage(el))
                .filter(Boolean);

            const userCount = userMessages.length;
            const aiCount = aiMessages.length;
            const exchanges = Math.min(userCount, aiCount);

            let md = `---\n`;
            md += `> **🤖 Model:** Google NotebookLM\n>\n`;
            md += `> **🌐 Date:** ${exportedAt}\n>\n`;
            md += `> **🌐 Source:** [Google NotebookLM](${sourceUrl})\n>\n`;
            md += `> **🏷️ Tags:** NotebookLM, AI-Chat, Noosphere\n>\n`;
            md += `> **📂 Artifacts:** [Internal](${sourceUrl})\n>\n`;
            md += `> **📊 Metadata:**\n`;
            md += `>> **Total Exchanges:** ${exchanges}\n>>\n`;
            md += `>> **Total User Messages:** ${userCount}\n>>\n`;
            md += `>> **Total AI Messages:** ${aiCount}\n`;
            if (sources) md += `>>\n>> **📚 Notebook Sources:** ${sources}\n`;
            if (date)    md += `>>\n>> **📅 Notebook Date:** ${date}\n`;
            md += `---\n\n`;

            md += `# ${title}\n\n`;
            if (intro) md += `${intro.trim()}\n\n---\n\n`;

            const maxLen = Math.max(userCount, aiCount);
            for (let i = 0; i < maxLen; i++) {
                if (userMessages[i]) md += `#### Prompt - User 👤:\n\n${userMessages[i]}\n\n`;
                if (aiMessages[i])   md += `#### Response - NotebookLM 🤖:\n\n${aiMessages[i]}\n\n`;
                if (i < maxLen - 1)  md += `---\n\n`;
            }

            md += `\n---\n\n`;
            md += `###### Noosphere Reflect\n`;
            md += `###### ***Meaning Through Memory***\n\n`;
            md += `###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n`;

            return md;
        },

        exportToClipboard(content) {
            navigator.clipboard.writeText(content).then(() => {
                Utils.createNotification('✅ Copied to clipboard');
            }).catch(() => Utils.createNotification('❌ Clipboard write failed — try Download instead'));
        },

        exportToFile(content) {
            const title = this.getConversationTitle();
            const filename = `${Utils.sanitizeFilename(title)}_${Utils.getDateString()}.md`;
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            Utils.createNotification(`✅ Downloaded: ${filename}`);
        },

        execute(mode) {
            const userCount = document.querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE).length;
            const aiCount   = document.querySelectorAll(CONFIG.SELECTORS.AI_MESSAGE).length;
            if (!userCount && !aiCount) {
                Utils.createNotification('❌ No messages found — check selectors');
                return;
            }
            const content = this.buildMarkdown();
            mode === 'clipboard' ? this.exportToClipboard(content) : this.exportToFile(content);
        }
    };

    function init() {
        console.log('🚀 Noosphere Reflect Exporter ready');
        injectStyles();
        createMenu();
        injectCheckboxes();
        setupObserver();

        document.getElementById('ns-copy-md').onclick = () => ExportService.execute('clipboard');
        document.getElementById('ns-dl-md').onclick  = () => ExportService.execute('file');

        const bulkSelect = (type) => {
            document.querySelectorAll('.ns-checkbox').forEach(cb => {
                cb.checked = (
                    type === 'all' ||
                    (type === 'user'      && cb.dataset.type === 'user') ||
                    (type === 'ai'        && cb.dataset.type === 'assistant')
                );
            });
        };

        document.getElementById('ns-select-all').onclick  = () => bulkSelect('all');
        document.getElementById('ns-select-user').onclick = () => bulkSelect('user');
        document.getElementById('ns-select-ai').onclick   = () => bulkSelect('ai');
        document.getElementById('ns-select-none').onclick = () => bulkSelect('none');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
