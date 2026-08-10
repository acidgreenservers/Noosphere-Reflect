(function () {
    'use strict';

    const CONFIG = {
        SELECTORS: {
            TITLE: 'h2.cover-title',
            META_SOURCES: '.cover-subtitle-source-count',
            META_DATE: '.cover-subtitle-date',
            INTRO: 'div.summary-content p',

            USER_MESSAGE: 'chat-message .from-user-container',
            AI_MESSAGE: 'chat-message .to-user-container',
            AI_CONTENT: '.message-text-content',

            // Thinking chain structure
            THINKING_CHAIN: 'thinking-chain-view',
            THINKING_HEADER: '.thinking-chain__header',
            THINKING_CONTENT: '.thinking-chain__content',
            THINKING_ITEM: '.thinking-chain__item',
            THINKING_TITLE: '.thought-block__title',
            THINKING_BODY: '.thought-block__body',
            THINKING_PARAGRAPH: '.paragraph.normal',

            // Artifact structure
            ARTIFACT_VIEWER: 'artifact-viewer',
            ARTIFACT_TITLE: 'input.artifact-title',
            ARTIFACT_CONTENT: '.text-file-markdown-wrapper'
        },

        TIMING: {
            POPUP_DURATION: 2000,

            // Time to allow Angular/NotebookLM to render an expanded chain
            THINKING_RENDER_DELAY: 75,

            // Maximum time to wait for a chain to finish rendering
            THINKING_TIMEOUT: 3000,

            // Small pause between expansion operations
            THINKING_EXPANSION_DELAY: 25
        }
    };


    // ============================================================
    // UTILITIES
    // ============================================================

    const Utils = {

        createNotification(message) {
            const notification = document.createElement('div');

            notification.textContent = message;

            Object.assign(notification.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: '#10b981',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '10000',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'opacity 0.3s ease',
                fontFamily: 'system-ui'
            });

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.opacity = '0';

                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, CONFIG.TIMING.POPUP_DURATION);
        },


        sanitizeFilename(text) {
            return text
                .replace(/[<>:"/\\|?*]/g, '')
                .replace(/\s+/g, '_')
                .substring(0, 50);
        },


        getDateString() {
            const now = new Date();

            const pad = n =>
                n.toString().padStart(2, '0');

            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        },


        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },


        waitForCondition(condition, timeout = 3000, interval = 25) {
            return new Promise(resolve => {

                const start = Date.now();

                const check = () => {

                    let result = false;

                    try {
                        result = condition();
                    } catch (_) {
                        result = false;
                    }

                    if (result) {
                        resolve(true);
                        return;
                    }

                    if (Date.now() - start >= timeout) {
                        resolve(false);
                        return;
                    }

                    setTimeout(check, interval);
                };

                check();
            });
        }

    };


    // ============================================================
    // STYLES
    // ============================================================

    function injectStyles() {

        if (document.getElementById('noosphere-styles-gn')) {
            return;
        }

        const style = document.createElement('style');

        style.id = 'noosphere-styles-gn';

        style.textContent = `
            .ns-orb {
                position: fixed;
                bottom: 25px;
                right: 25px;
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
                transition: all 0.3s ease;
                border: 2px solid rgba(255,255,255,0.2);
                font-size: 24px;
                font-weight: bold;
                color: white;
            }

            .ns-orb:hover {
                transform: scale(1.1);
            }

            .ns-console {
                position: fixed;
                bottom: 95px;
                right: 25px;
                width: 320px;
                background: rgba(17, 24, 39, 0.9);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                z-index: 99999;
                overflow: hidden;
                display: none;
                flex-direction: column;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                color: white;
                font-family: system-ui;
            }

            .ns-console-header {
                padding: 16px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .ns-console-title {
                font-size: 16px;
                font-weight: 700;
                margin: 0;
            }

            .ns-console-content {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .ns-bulk-controls {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
                margin-bottom: 8px;
            }

            .ns-bulk-btn {
                padding: 6px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 6px;
                color: rgba(255,255,255,0.7);
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .ns-bulk-btn:hover {
                background: rgba(255,255,255,0.1);
                color: white;
            }

            .ns-btn {
                width: 100%;
                padding: 10px 12px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                color: white;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .ns-btn:hover {
                background: rgba(255,255,255,0.1);
            }

            .ns-btn-primary {
                background: rgba(16, 185, 129, 0.2);
                border-color: rgba(16, 185, 129, 0.3);
                color: #10b981;
            }

            .ns-btn-primary:hover {
                background: rgba(16, 185, 129, 0.3);
            }

            .ns-btn-artifact {
                background: rgba(139, 92, 246, 0.15);
                border-color: rgba(139, 92, 246, 0.35);
                color: #c4b5fd;
            }

            .ns-btn-artifact:hover {
                background: rgba(139, 92, 246, 0.25);
            }

            .ns-btn-thinking {
                background: rgba(59, 130, 246, 0.15);
                border-color: rgba(59, 130, 246, 0.35);
                color: #93c5fd;
            }

            .ns-btn-thinking:hover {
                background: rgba(59, 130, 246, 0.25);
            }

            .ns-checkbox {
                appearance: none;
                width: 18px;
                height: 18px;
                border: 2px solid #10b981;
                border-radius: 4px;
                cursor: pointer;
                background: rgba(0,0,0,0.3);
                transition: all 0.2s;
                position: relative;
            }

            .ns-checkbox:checked {
                background: #10b981;
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

            .ns-exporting {
                opacity: 0.6;
                pointer-events: none;
            }
        `;

        document.head.appendChild(style);
    }


    // ============================================================
    // MENU
    // ============================================================

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


        const artifactCopyBtn = document.createElement('button');

        artifactCopyBtn.className = 'ns-btn ns-btn-artifact';
        artifactCopyBtn.id = 'ns-copy-artifact';
        artifactCopyBtn.textContent = '🧩 Copy Open Artifact';

        content.appendChild(artifactCopyBtn);


        const artifactDlBtn = document.createElement('button');

        artifactDlBtn.className = 'ns-btn ns-btn-artifact';
        artifactDlBtn.id = 'ns-dl-artifact';
        artifactDlBtn.textContent = '🧩 Download Open Artifact';

        content.appendChild(artifactDlBtn);


        consoleEl.appendChild(content);

        document.body.appendChild(consoleEl);


        orb.onclick = (e) => {

            e.stopPropagation();

            consoleEl.style.display =
                consoleEl.style.display === 'flex'
                    ? 'none'
                    : 'flex';
        };


        document.addEventListener('click', (e) => {

            if (
                !orb.contains(e.target) &&
                !consoleEl.contains(e.target)
            ) {
                consoleEl.style.display = 'none';
            }
        });
    }


    // ============================================================
    // MESSAGE CHECKBOXES
    // ============================================================

    function injectCheckboxes() {

        const createCheckbox = (type, container) => {

            if (container.querySelector('.ns-checkbox')) {
                return;
            }

            const checkbox = document.createElement('input');

            checkbox.type = 'checkbox';
            checkbox.className = 'ns-checkbox';
            checkbox.dataset.type = type;
            checkbox.checked = true;

            checkbox.style.position = 'absolute';
            checkbox.style.left = '-30px';
            checkbox.style.top = '8px';

            container.style.position = 'relative';

            container.prepend(checkbox);
        };


        document
            .querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE)
            .forEach(el => {
                createCheckbox('user', el);
            });


        document
            .querySelectorAll(CONFIG.SELECTORS.AI_MESSAGE)
            .forEach(el => {
                createCheckbox('assistant', el);
            });
    }


    function setupObserver() {

        const observer = new MutationObserver(() => {
            injectCheckboxes();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }


    // ============================================================
    // MARKDOWN PARSER
    // ============================================================

    function parseNode(node) {

        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }


        if (node.nodeType === Node.ELEMENT_NODE) {

            const tag = node.tagName.toLowerCase();


            const inner = () =>
                Array.from(node.childNodes)
                    .map(parseNode)
                    .join('');


            if (tag === 'b' || tag === 'strong') {
                return `**${inner()}**`;
            }


            if (tag === 'i' || tag === 'em') {
                return `*${inner()}*`;
            }


            if (tag === 'p') {
                return '\n\n' + inner();
            }


            if (tag === 'br') {
                return '\n';
            }


            return inner();
        }


        return '';
    }


    // ============================================================
    // HTML → MARKDOWN
    // ============================================================

    function htmlToMarkdown(root) {

        if (!root) {
            return '';
        }


        const clean = root.cloneNode(true);


        clean.querySelectorAll(
            'button, mat-icon, [role="button"], [aria-hidden="true"]'
        ).forEach(n => n.remove());


        const render = (node) => {

            if (node.nodeType === Node.TEXT_NODE) {

                return node.textContent
                    .replace(/\u00a0/g, ' ');
            }


            if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }


            const tag = node.tagName.toLowerCase();


            const inner = () =>
                Array.from(node.childNodes)
                    .map(render)
                    .join('');


            if (/^h[1-6]$/.test(tag)) {

                const level =
                    Number(tag.substring(1));

                return `\n\n${'#'.repeat(level)} ${inner().trim()}\n\n`;
            }


            if (tag === 'br') {
                return '\n';
            }


            if (tag === 'strong' || tag === 'b') {

                const value = inner().trim();

                return value
                    ? `**${value}**`
                    : '';
            }


            if (tag === 'em' || tag === 'i') {

                const value = inner().trim();

                return value
                    ? `*${value}*`
                    : '';
            }


            if (
                tag === 'del' ||
                tag === 's' ||
                tag === 'strike'
            ) {

                const value = inner().trim();

                return value
                    ? `~~${value}~~`
                    : '';
            }


            if (
                tag === 'code' &&
                node.parentElement?.tagName.toLowerCase() !== 'pre'
            ) {

                return `\`${node.textContent
                    .replace(/\u00a0/g, ' ')
                    .trim()}\``;
            }


            if (tag === 'pre') {

                const code =
                    node.querySelector('code');

                const value =
                    (code
                        ? code.textContent
                        : node.textContent
                    )
                        .replace(/\u00a0/g, ' ')
                        .replace(/\n+$/, '');


                return `\n\n\`\`\`\n${value}\n\`\`\`\n\n`;
            }


            if (tag === 'hr') {
                return '\n\n---\n\n';
            }


            if (tag === 'a') {

                const label =
                    inner().trim();

                const href =
                    node.getAttribute('href') || '';


                return href
                    ? `[${label || href}](${href})`
                    : label;
            }


            if (tag === 'img') {

                const alt =
                    node.getAttribute('alt') || '';

                const src =
                    node.getAttribute('src') || '';


                return src
                    ? `![${alt}](${src})`
                    : '';
            }


            if (tag === 'ul' || tag === 'ol') {

                const ordered =
                    tag === 'ol';


                const items =
                    Array.from(node.children)
                        .filter(child =>
                            child.tagName.toLowerCase() === 'li'
                        )
                        .map((li, index) => {

                            const body =
                                Array.from(li.childNodes)
                                    .map(render)
                                    .join('')
                                    .trim();


                            return `${
                                ordered
                                    ? `${index + 1}.`
                                    : '-'
                            } ${body}`;
                        });


                return `\n\n${items.join('\n')}\n\n`;
            }


            if (tag === 'li') {
                return inner();
            }


            if (tag === 'blockquote') {

                const value =
                    inner().trim();


                return `\n\n${value
                    .split('\n')
                    .map(line =>
                        `> ${line}`.trimEnd()
                    )
                    .join('\n')
                }\n\n`;
            }


            if (
                tag === 'p' ||
                tag === 'div' ||
                tag === 'section' ||
                tag === 'article'
            ) {

                const value =
                    inner().trim();


                return value
                    ? `\n\n${value}\n\n`
                    : '';
            }


            return inner();
        };


        return render(clean)

            // Remove NotebookLM-style numeric citation markers.
            // Examples:
            // [4]
            // [3, 13]
            // [3, 62]
            //
            // Markdown links such as [text](url) are untouched.
            .replace(/\s*\[\d+(?:,\s*\d+)*\]/g, '')

            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n[ \t]+/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }


    // ============================================================
    // THINKING CHAIN
    // ============================================================

    async function expandThinkingChains(root = document) {

        const chains =
            Array.from(
                root.querySelectorAll(
                    CONFIG.SELECTORS.THINKING_CHAIN
                )
            );


        if (!chains.length) {
            return;
        }


        for (const chain of chains) {

            const header =
                chain.querySelector(
                    CONFIG.SELECTORS.THINKING_HEADER
                );


            if (!header) {
                continue;
            }


            const expanded =
                header.getAttribute('aria-expanded') === 'true';


            // Already open — leave it alone.
            if (expanded) {
                continue;
            }


            // This is the actual interactive element.
            header.click();


            // Wait until NotebookLM updates aria-expanded.
            await Utils.waitForCondition(
                () =>
                    header.getAttribute('aria-expanded') === 'true',
                CONFIG.TIMING.THINKING_TIMEOUT
            );


            // Give Angular a moment to render the actual thought nodes.
            await Utils.sleep(
                CONFIG.TIMING.THINKING_RENDER_DELAY
            );
        }


        // Final render pass.
        await Utils.waitForCondition(
            () => {

                return chains.every(chain => {

                    const header =
                        chain.querySelector(
                            CONFIG.SELECTORS.THINKING_HEADER
                        );


                    if (
                        header &&
                        header.getAttribute('aria-expanded') !== 'true'
                    ) {
                        return false;
                    }


                    const content =
                        chain.querySelector(
                            CONFIG.SELECTORS.THINKING_CONTENT
                        );


                    return !!content;
                });
            },

            CONFIG.TIMING.THINKING_TIMEOUT
        );
    }


    function extractThinkingChain(chain) {

        if (!chain) {
            return '';
        }


        const items =
            Array.from(
                chain.querySelectorAll(
                    CONFIG.SELECTORS.THINKING_ITEM
                )
            );


        if (!items.length) {
            return '';
        }


        const thoughts = [];


        for (const item of items) {

            const titleEl =
                item.querySelector(
                    CONFIG.SELECTORS.THINKING_TITLE
                );


            const bodyEl =
                item.querySelector(
                    CONFIG.SELECTORS.THINKING_BODY
                );


            const title =
                titleEl?.textContent
                    ?.replace(/\s+/g, ' ')
                    ?.trim() || '';


            if (!bodyEl && !title) {
                continue;
            }


            let body = '';


            // NotebookLM uses div.paragraph.normal
            // for the actual thought text.
            const paragraphs =
                bodyEl
                    ? Array.from(
                        bodyEl.querySelectorAll(
                            CONFIG.SELECTORS.THINKING_PARAGRAPH
                        )
                    )
                    : [];


            if (paragraphs.length) {

                body =
                    paragraphs
                        .map(p =>
                            parseNode(p)
                                .replace(/\s+/g, ' ')
                                .trim()
                        )
                        .filter(Boolean)
                        .join('\n\n');

            } else if (bodyEl) {

                body =
                    bodyEl.textContent
                        .replace(/\s+/g, ' ')
                        .trim();
            }


            // Some thought blocks are event-only,
            // such as "Created artifact in Studio".
            if (title && body) {

                thoughts.push({
                    title,
                    body
                });

            } else if (title) {

                thoughts.push({
                    title,
                    body: ''
                });
            }
        }


        if (!thoughts.length) {
            return '';
        }


        return thoughts
            .map(thought => {

                const lines = [];


                if (thought.title) {
                    lines.push(
                        `**${thought.title}**`
                    );
                }


                if (thought.body) {

                    if (thought.title) {
                        lines.push('');
                    }

                    lines.push(thought.body);
                }


                return lines.join('\n');
            })
            .join('\n\n');
    }


    function thinkingToMarkdown(thinkingText) {

        if (!thinkingText) {
            return '';
        }


        /*
         * Convert the thought blocks into a real Markdown
         * blockquote while preserving paragraph spacing.
         *
         * Example:
         *
         * # Thinking
         *
         * > **Analyzing the Request**
         * >
         * > First thought.
         * >
         * > **Developing the Quiz**
         * >
         * > Second thought.
         */


        const lines =
            thinkingText.split('\n');


        const quoted =
            lines
                .map(line => {

                    if (line.trim() === '') {
                        return '>';
                    }

                    return `> ${line}`;
                })
                .join('\n');


        return `# Thinking\n\n${quoted}`;
    }


    function extractThinkingForMessage(messageElement) {

        if (!messageElement) {
            return '';
        }


        const chains =
            Array.from(
                messageElement.querySelectorAll(
                    CONFIG.SELECTORS.THINKING_CHAIN
                )
            );


        if (!chains.length) {
            return '';
        }


        const extracted =
            chains
                .map(extractThinkingChain)
                .filter(Boolean)
                .join('\n\n');


        return thinkingToMarkdown(extracted);
    }


    // ============================================================
    // USER MESSAGE
    // ============================================================

    function extractUserMessage(element) {

        if (!element) {
            return '';
        }


        const clone =
            element.cloneNode(true);


        // Remove our injected checkbox.
        clone
            .querySelectorAll('.ns-checkbox')
            .forEach(n => n.remove());


        return parseNode(clone)
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }


    // ============================================================
    // AI MESSAGE
    // ============================================================

    function extractAIMessage(element) {

        if (!element) {
            return '';
        }


        const contentDiv =
            element.querySelector(
                CONFIG.SELECTORS.AI_CONTENT
            );


        if (!contentDiv) {
            return '';
        }


        const clone =
            contentDiv.cloneNode(true);


        // Remove UI/citation chrome.
        clone
            .querySelectorAll(
                '[class*="citation"], .citation-marker, button, [role="img"], mat-icon'
            )
            .forEach(n => n.remove());


        const paragraphs =
            clone.querySelectorAll(
                'div.paragraph'
            );


        if (paragraphs.length > 0) {

            return Array.from(paragraphs)
                .map(p =>
                    parseNode(p).trim()
                )
                .filter(Boolean)
                .join('\n\n')

                // Scrub NotebookLM numeric citations.
                .replace(/\s*\[\d+(?:,\s*\d+)*\]/g, '');
        }


        return parseNode(clone)
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s*\[\d+(?:,\s*\d+)*\]/g, '')
            .trim();
    }


    // ============================================================
    // ARTIFACT
    // ============================================================

    function getOpenArtifact() {

        const viewer =
            document.querySelector(
                CONFIG.SELECTORS.ARTIFACT_VIEWER
            );


        if (!viewer) {
            return null;
        }


        const titleInput =
            viewer.querySelector(
                CONFIG.SELECTORS.ARTIFACT_TITLE
            );


        const content =
            viewer.querySelector(
                CONFIG.SELECTORS.ARTIFACT_CONTENT
            );


        if (!content) {
            return null;
        }


        return {
            title:
                titleInput?.value?.trim()
                || 'artifact',

            content
        };
    }


    function extractOpenArtifact() {

        const artifact =
            getOpenArtifact();


        if (!artifact) {
            return null;
        }


        return {
            title: artifact.title,

            markdown:
                htmlToMarkdown(
                    artifact.content
                )
        };
    }


    // ============================================================
    // EXPORT SERVICE
    // ============================================================

    const ExportService = {


        getConversationTitle() {

            const titleEl =
                document.querySelector(
                    CONFIG.SELECTORS.TITLE
                );


            return titleEl?.innerText.trim()
                || 'Google_Notebook_Chat';
        },


        /*
         * This MUST be async now.
         *
         * Thinking chains need to be opened before
         * their full DOM contents exist.
         */
        async buildMarkdown() {

            // ----------------------------------------------------
            // STEP 1 — OPEN ALL THINKING CHAINS
            // ----------------------------------------------------

            await expandThinkingChains();


            // ----------------------------------------------------
            // STEP 2 — BASIC METADATA
            // ----------------------------------------------------

            const title =
                this.getConversationTitle();


            const sources =
                document
                    .querySelector(
                        CONFIG.SELECTORS.META_SOURCES
                    )
                    ?.innerText.trim()
                || '';


            const date =
                document
                    .querySelector(
                        CONFIG.SELECTORS.META_DATE
                    )
                    ?.innerText.trim()
                || '';


            const introEl =
                document.querySelector(
                    CONFIG.SELECTORS.INTRO
                );


            const intro =
                introEl
                    ? parseNode(introEl)
                    : '';


            const sourceUrl =
                window.location.href;


            const exportedAt =
                new Date().toLocaleString();


            // ----------------------------------------------------
            // STEP 3 — USER MESSAGES
            // ----------------------------------------------------

            const userMessages =
                Array.from(
                    document.querySelectorAll(
                        CONFIG.SELECTORS.USER_MESSAGE
                    )
                )
                    .filter(el =>
                        el.querySelector(
                            '.ns-checkbox'
                        )?.checked
                    )
                    .map(extractUserMessage)
                    .filter(Boolean);


            // ----------------------------------------------------
            // STEP 4 — AI MESSAGE OBJECTS
            //
            // Keep thinking + response together so the
            // export preserves the conversation structure.
            // ----------------------------------------------------

            const aiMessages =
                Array.from(
                    document.querySelectorAll(
                        CONFIG.SELECTORS.AI_MESSAGE
                    )
                )
                    .filter(el =>
                        el.querySelector(
                            '.ns-checkbox'
                        )?.checked
                    )
                    .map(el => ({

                        thinking:
                            extractThinkingForMessage(el),

                        response:
                            extractAIMessage(el)

                    }))
                    .filter(item =>
                        item.thinking ||
                        item.response
                    );


            const userCount =
                userMessages.length;


            const aiCount =
                aiMessages.length;


            const exchanges =
                Math.min(
                    userCount,
                    aiCount
                );


            // ----------------------------------------------------
            // STEP 5 — HEADER
            // ----------------------------------------------------

            let md =
                `---\n`;


            md +=
                `> **🤖 Model:** Google NotebookLM\n>\n`;


            md +=
                `> **🌐 Date:** ${exportedAt}\n>\n`;


            md +=
                `> **🌐 Source:** [Google NotebookLM](${sourceUrl})\n>\n`;


            md +=
                `> **🏷️ Tags:** NotebookLM, AI-Chat, Noosphere\n>\n`;


            md +=
                `> **📂 Artifacts:** [Internal](${sourceUrl})\n>\n`;


            md +=
                `> **📊 Metadata:**\n`;


            md +=
                `>> **Total Exchanges:** ${exchanges}\n>>\n`;


            md +=
                `>> **Total User Messages:** ${userCount}\n>>\n`;


            md +=
                `>> **Total AI Messages:** ${aiCount}\n`;


            if (sources) {

                md +=
                    `>>\n>> **📚 Notebook Sources:** ${sources}\n`;
            }


            if (date) {

                md +=
                    `>>\n>> **📅 Notebook Date:** ${date}\n`;
            }


            md +=
                `---\n\n`;


            // ----------------------------------------------------
            // STEP 6 — TITLE
            // ----------------------------------------------------

            md +=
                `# ${title}\n\n`;


            if (intro) {

                md +=
                    `${intro.trim()}\n\n---\n\n`;
            }


            // ----------------------------------------------------
            // STEP 7 — CONVERSATION
            // ----------------------------------------------------

            const maxLen =
                Math.max(
                    userCount,
                    aiCount
                );


            for (
                let i = 0;
                i < maxLen;
                i++
            ) {

                if (userMessages[i]) {

                    md +=
                        `#### Prompt - User 👤:\n\n`;

                    md +=
                        `${userMessages[i]}\n\n`;
                }


                if (aiMessages[i]) {

                    const thinking =
                        aiMessages[i].thinking;


                    const response =
                        aiMessages[i].response;


                    md +=
                        `#### Response - NotebookLM 🤖:\n\n`;


                    // Thinking appears immediately before
                    // the corresponding response.
                    if (thinking) {

                        md +=
                            `${thinking}\n\n`;
                    }


                    if (response) {

                        md +=
                            `${response}\n\n`;
                    }
                }


                if (i < maxLen - 1) {

                    md +=
                        `---\n\n`;
                }
            }


            // ----------------------------------------------------
            // FOOTER
            // ----------------------------------------------------

            md +=
                `\n---\n\n`;


            md +=
                `###### Noosphere Reflect\n`;


            md +=
                `###### ***Meaning Through Memory***\n\n`;


            md +=
                `###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n`;


            return md;
        },


        // --------------------------------------------------------
        // CLIPBOARD
        // --------------------------------------------------------

        async exportToClipboard(content) {

            try {

                await navigator.clipboard.writeText(
                    content
                );


                Utils.createNotification(
                    '✅ Copied Markdown + Thoughts to clipboard'
                );

            } catch (error) {

                console.error(
                    'Noosphere clipboard error:',
                    error
                );


                Utils.createNotification(
                    '❌ Clipboard write failed — try Download instead'
                );
            }
        },


        // --------------------------------------------------------
        // FILE
        // --------------------------------------------------------

        exportToFile(content) {

            const title =
                this.getConversationTitle();


            const filename =
                `${Utils.sanitizeFilename(title)}_${Utils.getDateString()}.md`;


            const blob =
                new Blob(
                    [content],
                    {
                        type: 'text/markdown'
                    }
                );


            const url =
                URL.createObjectURL(blob);


            const a =
                document.createElement('a');


            a.href = url;
            a.download = filename;


            document.body.appendChild(a);

            a.click();

            a.remove();


            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);


            Utils.createNotification(
                `✅ Downloaded: ${filename}`
            );
        },


        // --------------------------------------------------------
        // ARTIFACT EXPORT
        // --------------------------------------------------------

        executeArtifact(mode) {

            const artifact =
                extractOpenArtifact();


            if (!artifact) {

                Utils.createNotification(
                    '❌ No open artifact found'
                );

                return;
            }


            if (!artifact.markdown) {

                Utils.createNotification(
                    '❌ Open artifact contains no readable Markdown'
                );

                return;
            }


            if (mode === 'clipboard') {

                this.exportToClipboard(
                    artifact.markdown
                );

                return;
            }


            const filename =
                `${Utils.sanitizeFilename(artifact.title)}_${Utils.getDateString()}.md`;


            const blob =
                new Blob(
                    [artifact.markdown],
                    {
                        type: 'text/markdown'
                    }
                );


            const url =
                URL.createObjectURL(blob);


            const a =
                document.createElement('a');


            a.href = url;
            a.download = filename;


            document.body.appendChild(a);

            a.click();

            a.remove();


            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);


            Utils.createNotification(
                `✅ Downloaded: ${filename}`
            );
        },


        // --------------------------------------------------------
        // CONVERSATION EXPORT
        // --------------------------------------------------------

        async execute(mode) {

            const userCount =
                document.querySelectorAll(
                    CONFIG.SELECTORS.USER_MESSAGE
                ).length;


            const aiCount =
                document.querySelectorAll(
                    CONFIG.SELECTORS.AI_MESSAGE
                ).length;


            if (!userCount && !aiCount) {

                Utils.createNotification(
                    '❌ No messages found — check selectors'
                );

                return;
            }


            const copyBtn =
                document.getElementById(
                    'ns-copy-md'
                );


            const dlBtn =
                document.getElementById(
                    'ns-dl-md'
                );


            // Prevent double-click exports while
            // the thinking chains are opening.
            copyBtn?.classList.add(
                'ns-exporting'
            );

            dlBtn?.classList.add(
                'ns-exporting'
            );


            try {

                Utils.createNotification(
                    '🧠 Opening thinking chains...'
                );


                const content =
                    await this.buildMarkdown();


                if (mode === 'clipboard') {

                    await this.exportToClipboard(
                        content
                    );

                } else {

                    this.exportToFile(
                        content
                    );
                }

            } catch (error) {

                console.error(
                    'Noosphere export error:',
                    error
                );


                Utils.createNotification(
                    '❌ Export failed — see console'
                );

            } finally {

                copyBtn?.classList.remove(
                    'ns-exporting'
                );

                dlBtn?.classList.remove(
                    'ns-exporting'
                );
            }
        }
    };


    // ============================================================
    // INITIALIZATION
    // ============================================================

    function init() {

        console.log(
            '🚀 Noosphere Reflect Exporter ready'
        );


        injectStyles();

        createMenu();

        injectCheckboxes();

        setupObserver();


        // --------------------------------------------------------
        // Conversation exports
        // --------------------------------------------------------

        document
            .getElementById('ns-copy-md')
            .onclick =
            () =>
                ExportService.execute(
                    'clipboard'
                );


        document
            .getElementById('ns-dl-md')
            .onclick =
            () =>
                ExportService.execute(
                    'file'
                );


        // --------------------------------------------------------
        // Artifact exports
        // --------------------------------------------------------

        document
            .getElementById('ns-copy-artifact')
            .onclick =
            () =>
                ExportService.executeArtifact(
                    'clipboard'
                );


        document
            .getElementById('ns-dl-artifact')
            .onclick =
            () =>
                ExportService.executeArtifact(
                    'file'
                );


        // --------------------------------------------------------
        // Bulk selection
        // --------------------------------------------------------

        const bulkSelect = (type) => {

            document
                .querySelectorAll('.ns-checkbox')
                .forEach(cb => {

                    cb.checked =
                        type === 'all' ||

                        (
                            type === 'user' &&
                            cb.dataset.type === 'user'
                        ) ||

                        (
                            type === 'ai' &&
                            cb.dataset.type === 'assistant'
                        );
                });
        };


        document
            .getElementById('ns-select-all')
            .onclick =
            () =>
                bulkSelect('all');


        document
            .getElementById('ns-select-user')
            .onclick =
            () =>
                bulkSelect('user');


        document
            .getElementById('ns-select-ai')
            .onclick =
            () =>
                bulkSelect('ai');


        document
            .getElementById('ns-select-none')
            .onclick =
            () =>
                bulkSelect('none');
    }


    // ============================================================
    // START
    // ============================================================

    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            init
        );

    } else {

        init();
    }

})();
