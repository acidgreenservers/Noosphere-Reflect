/**
 * Brave Search AI Chat Exporter - Noosphere Reflect
 * v1.0 - DOM Scraper Edition
 *
 * Scrapes Brave Search AI chat conversations with augment URL preservation.
 */

(function () {
    'use strict';

    // ============================================================================
    // CONSTANTS
    // ============================================================================
    const CONFIG = {
        CHECKBOX_CLASS: 'ns-checkbox',

        SELECTORS: {
            // Chat messages
            USER_MESSAGE: '.user-bubble',
            AI_MESSAGE: '.message.assistant.llm-output',
            AUGMENT_MESSAGE: '.message.augment',
            RESEARCH_MESSAGE: '.message.research',

            // Copy buttons (for native fallback detection)
            USER_COPY_BTN: '.user-message-action[aria-label="Copy"]',
            AI_COPY_BTN: '.tap-round-footer-action[aria-label="Copy"]',

            // Inline artifacts to strip from AI text
            INLINE_CITATION: 'button.inline-citation',

            // Augment URL extraction
            ENRICHMENT_FOOTER_QUERY: '.enrichment-footer-query',
            ENRICHMENT_CARD_ITEM: '.enrichment-card-item',
            ENRICHMENT_CARD_IMG: '.enrichment-card-item img',

            // Deep research panel
            DEEP_RESEARCH_CONTAINER: '.deep-research.noscrollbar',
            DEEP_RESEARCH_HEADER: '.deep-research-header',
            DEEP_RESEARCH_STATS: '.deep-research-stats',
            DEEP_RESEARCH_STATS_ITEM: '.deep-research-stats-item',
            DEEP_RESEARCH_STATS_VALUE: '.deep-research-stats-item-value',
            DEEP_RESEARCH_STATS_LABEL: '.deep-research-stats-item-label',

            // Deep research iteration blocks
            DEEP_RESEARCH_QUERIES: '.deep-research-queries',
            DEEP_RESEARCH_QUERY: '.deep-research-query',
            DEEP_RESEARCH_THINKING: '.deep-research-thinking',
            DEEP_RESEARCH_THINKING_INNER: '.deep-research-thinking-inner',
            DEEP_RESEARCH_ANSWER: '.deep-research-answer',
            DEEP_RESEARCH_BLINDSPOTS: '.deep-research-blindspots',
            DEEP_RESEARCH_BLINDSPOTS_CONTENT: '.deep-research-blindspots-content',
            DEEP_RESEARCH_PROGRESS: '.deep-research-progress',

            // Source chips within thinking blocks
            DEEP_RESEARCH_SOURCE_CHIP: '.deep-research-source-chip[href]',
            DEEP_RESEARCH_SOURCE_CHIP_BUTTON: '.deep-research-source-chip',
            DEEP_RESEARCH_FAVICON_IMG: '.deep-research-source-chip-favicon img',

            // Research content areas
            DEEP_RESEARCH_CONTENT: '.deep-research-content',
            DEEP_RESEARCH_ITERATION_CONTENT: '.deep-research-iteration-content',
            DEEP_RESEARCH_QUERIES_CONTENT: '.deep-research-queries-content',
            DEEP_RESEARCH_THINKING_CONTENT: '.deep-research-thinking-content',
            DEEP_RESEARCH_THINKING_INNER_WRAPPER: '.deep-research-thinking-inner-wrapper',
            DEEP_RESEARCH_ANSWER_CONTENT: '.deep-research-answer-content',
            DEEP_RESEARCH_BLINDSPOTS_CONTENT_WRAPPER: '.deep-research-blindspots-content-wrapper',

            // Chat container (for scrolling if needed)
            CHAT_CONTAINER: '.conversation-page, .chat-container, main',

            // Title
            CONVERSATION_TITLE: 'title'
        },

        TIMING: {
            SCROLL_DELAY: 1500,
            CLIPBOARD_CLEAR_DELAY: 200,
            CLIPBOARD_READ_DELAY: 300,
            POPUP_DURATION: 900,
            MAX_SCROLL_ATTEMPTS: 40,
            MAX_STABLE_SCROLLS: 3
        },

        STYLES: {
            BUTTON_PRIMARY: '#fb542b', // Brave orange
            BUTTON_HOVER: '#e04a22',
            DARK_BG: '#1a1a1a',
            DARK_TEXT: '#fff',
            DARK_BORDER: '#444',
            LIGHT_BG: '#fff',
            LIGHT_TEXT: '#222',
            LIGHT_BORDER: '#ccc'
        }
    };

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    const Utils = {
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        isDarkMode() {
            return document.documentElement.classList.contains('dark');
        },

        sanitizeFilename(text) {
            return text
                .replace(/[<>:"/\\|?*]/g, '')
                .replace(/\s+/g, '_')
                .substring(0, 50);
        },

        getDateString() {
            const now = new Date();
            const pad = n => n.toString().padStart(2, '0');
            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
        },

        createNotification(message) {
            const notification = document.createElement('div');
            notification.textContent = message;
            Object.assign(notification.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: CONFIG.STYLES.BUTTON_PRIMARY,
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '10000',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'opacity 0.3s ease',
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
            });
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, CONFIG.TIMING.POPUP_DURATION);
        }
    };

    // ============================================================================
    // UI AND CHECKBOX FUNCTIONS
    // ============================================================================

    function injectStyles() {
        const styleId = 'noosphere-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            :root {
                --ns-green: #10b981;
                --ns-purple: #8b5cf6;
                --ns-amber: #f59e0b;
                --ns-bg: rgba(17, 24, 39, 0.7);
                --ns-border: rgba(255, 255, 255, 0.1);
                --ns-glow: 0 0 20px rgba(16, 185, 129, 0.3);
            }
            .ns-orb {
                position: fixed; bottom: 25px; right: 25px; width: 56px; height: 56px;
                background: linear-gradient(135deg, var(--ns-green), var(--ns-purple));
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                cursor: pointer; z-index: 100000; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            .ns-orb:hover { transform: scale(1.1) rotate(5deg); box-shadow: var(--ns-glow); }
            .ns-orb svg { width: 28px; height: 28px; fill: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
            .ns-console {
                position: fixed; bottom: 95px; right: 25px; width: 340px;
                background: var(--ns-bg); backdrop-filter: blur(20px) saturate(180%);
                border: 1px solid var(--ns-border); border-radius: 28px; z-index: 99999;
                overflow: hidden; display: none; flex-direction: column;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); color: white;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
            }
            .ns-console-header { padding: 24px 24px 16px; background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent); }
            .ns-console-title {
                font-size: 20px; font-weight: 800; letter-spacing: -0.02em;
                background: linear-gradient(to right, #fff, rgba(255,255,255,0.7));
                -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px;
            }
            .ns-console-subtitle { font-size: 12px; color: rgba(255, 255, 255, 0.5); font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
            .ns-console-tabs { display: flex; padding: 0 16px; gap: 8px; margin-bottom: 16px; }
            .ns-tab {
                padding: 8px 16px; border-radius: 12px; font-size: 13px; font-weight: 600;
                cursor: pointer; transition: all 0.2s; background: rgba(255, 255, 255, 0.05);
                color: rgba(255, 255, 255, 0.6); border: 1px solid transparent;
            }
            .ns-tab.active { background: rgba(16, 185, 129, 0.15); color: var(--ns-green); border: 1px solid rgba(16, 185, 129, 0.3); }
            .ns-console-content { padding: 0 20px 24px; display: flex; flex-direction: column; gap: 10px; }
            .ns-btn {
                width: 100%; padding: 12px 18px; background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--ns-border); border-radius: 16px; color: white;
                font-size: 14px; font-weight: 600; cursor: pointer; display: flex;
                align-items: center; gap: 12px; transition: all 0.2s;
            }
            .ns-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); transform: translateX(4px); }
            .ns-btn svg { width: 18px; height: 18px; opacity: 0.7; }
            .ns-btn-primary {
                background: linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
                border-color: rgba(16, 185, 129, 0.3); color: var(--ns-green);
            }
            .ns-btn-primary:hover { background: rgba(16, 185, 129, 0.25); border-color: var(--ns-green); }
            .ns-input-group { background: rgba(0, 0, 0, 0.2); padding: 16px; border-radius: 20px; border: 1px solid var(--ns-border); }
            .ns-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.4); margin-bottom: 8px; display: block; }
            .ns-input { width: 100%; background: transparent; border: none; color: white; font-size: 15px; outline: none; padding: 4px 0; }
            .ns-select {
                width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--ns-border);
                border-radius: 12px; color: white; padding: 10px; outline: none; font-size: 13px;
                appearance: none; -webkit-appearance: none; -moz-appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.7)' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat; background-position: right 12px center;
                background-size: 12px; padding-right: 30px; cursor: pointer; transition: all 0.2s;
            }
            .ns-select:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); }
            .ns-select option { background: var(--ns-bg); color: white; padding: 8px; }
            /* Checkbox Styles */
            .ns-checkbox-container { z-index: 1000; display: flex; align-items: center; justify-content: center; }
            .ns-checkbox {
                appearance: none; width: 20px; height: 20px; border: 2px solid var(--ns-green);
                border-radius: 6px; cursor: pointer; background: rgba(0,0,0,0.3);
                transition: all 0.2s; position: relative;
            }
            .ns-checkbox:checked { background: var(--ns-green); box-shadow: 0 0 10px var(--ns-green); }
            .ns-checkbox:checked::after {
                content: '✓'; position: absolute; color: white; font-size: 14px;
                top: 50%; left: 50%; transform: translate(-50%, -50%);
            }
            .ns-bulk-controls { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 12px; }
            .ns-bulk-btn {
                padding: 6px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--ns-border);
                border-radius: 8px; color: rgba(255, 255, 255, 0.7); font-size: 11px;
                font-weight: 600; cursor: pointer; text-align: center; transition: all 0.2s;
            }
            .ns-bulk-btn:hover { background: rgba(255, 255, 255, 0.1); color: white; }

            /* Brave Specific Overrides */
            .user-message-container .ns-checkbox-container { position: absolute; right: -30px; top: 12px; }
            .ai-message-container .ns-checkbox-container { position: absolute; left: -30px; top: 12px; }
        `;
        document.head.appendChild(style);
    }

    function createMenu() {
        const orb = document.createElement('div');
        orb.className = 'ns-orb';
        orb.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2zm0,18c-3.31,0-6-2.69-6-6,0-1.01,.25-1.97,.7-2.8l1.46,1.46c-.11,.43-.16,.88-.16,1.34,0,2.21,1.79,4,4,4s4-1.79,4-4-1.79-4-4-4c-.46,0-.91,.05-1.34,.16l-1.46-1.46c.83-.45,1.79-.7,2.8-.7,3.31,0,6,2.69,6,6s-2.69,6-6,6z"/></svg>`;
        document.body.appendChild(orb);

        const consoleEl = document.createElement('div');
        consoleEl.className = 'ns-console';
        consoleEl.innerHTML = `
            <div class="ns-console-header">
                <div class="ns-console-subtitle">Neural Interface</div>
                <div class="ns-console-title">Noosphere Reflect</div>
            </div>
            <div class="ns-console-tabs">
                <div class="ns-tab active" data-target="ns-pane-export">Export</div>
                <div class="ns-tab" data-target="ns-pane-config">Configuration</div>
            </div>
            <div class="ns-console-content" id="ns-pane-export">
                <div class="ns-bulk-controls">
                    <div class="ns-bulk-btn" id="ns-select-all">All</div>
                    <div class="ns-bulk-btn" id="ns-select-user">User</div>
                    <div class="ns-bulk-btn" id="ns-select-ai">AI</div>
                    <div class="ns-bulk-btn" id="ns-select-none">None</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button class="ns-btn" id="ns-copy-md">Copy MD</button>
                    <button class="ns-btn" id="ns-copy-json">Copy JSON</button>
                </div>
                <button class="ns-btn ns-btn-primary" id="ns-dl-md">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    Download .MD
                </button>
            </div>
            <div class="ns-console-content" id="ns-pane-config" style="display: none;">
                <div class="ns-input-group">
                    <span class="ns-label">Chat Title</span>
                    <input type="text" class="ns-input" id="ns-manual-title" placeholder="e.g. Brave Research Session">
                </div>
                <div class="ns-input-group">
                    <span class="ns-label">Filename Prefix</span>
                    <input type="text" class="ns-input" id="ns-custom-name" placeholder="Brave_Export">
                </div>
                <div style="padding: 0 4px;">
                    <span class="ns-label">Naming Segment</span>
                    <select class="ns-select" id="ns-naming-format">
                        <option value="kebab-case">kebab-case</option>
                        <option value="snake_case">snake_case</option>
                        <option value="PascalCase">PascalCase</option>
                        <option value="camelCase">camelCase</option>
                    </select>
                </div>
            </div>
        `;
        document.body.appendChild(consoleEl);

        orb.onclick = () => {
            const isVisible = consoleEl.style.display === 'flex';
            consoleEl.style.display = isVisible ? 'none' : 'flex';
        };

        consoleEl.querySelectorAll('.ns-tab').forEach(tab => {
            tab.onclick = () => {
                consoleEl.querySelectorAll('.ns-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.target;
                consoleEl.querySelectorAll('.ns-console-content').forEach(c => {
                    c.style.display = c.id === target ? 'flex' : 'none';
                });
            };
        });
    }

    function injectCheckboxes() {
        const createCheckbox = (type, container) => {
            if (container.querySelector('.ns-checkbox-container')) return;
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'ns-checkbox-container';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'ns-checkbox';
            checkbox.dataset.type = type;
            checkbox.checked = true;
            checkboxContainer.appendChild(checkbox);
            container.style.position = 'relative';
            container.prepend(checkboxContainer);
        };

        // User messages
        document.querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE).forEach(el => {
            el.classList.add('user-message-container');
            createCheckbox('user', el);
        });

        // AI messages
        document.querySelectorAll(CONFIG.SELECTORS.AI_MESSAGE).forEach(el => {
            el.classList.add('ai-message-container');
            createCheckbox('assistant', el);
        });

        // Research messages (deep research panel — inline message type)
        document.querySelectorAll(CONFIG.SELECTORS.RESEARCH_MESSAGE).forEach(el => {
            el.classList.add('research-message-container');
            createCheckbox('research', el);
        });
    }

    function setupObserver() {
        const observer = new MutationObserver(() => {
            injectCheckboxes();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ============================================================================
    // TEXT EXTRACTION HELPERS
    // ============================================================================

    function extractUserText(element) {
        if (!element) return '';
        return element.innerText?.trim() || '';
    }

    function extractAIText(element) {
        if (!element) return '';
        // Clone to avoid modifying live DOM
        const clone = element.cloneNode(true);
        // Remove inline citation buttons
        clone.querySelectorAll(CONFIG.SELECTORS.INLINE_CITATION).forEach(el => el.remove());
        return clone.innerText?.trim() || '';
    }

    function extractAITextWithHeading(element) {
        if (!element) return { heading: '', text: '' };
        const clone = element.cloneNode(true);
        // Extract the heading (h2/h3 with class 'heading') before removing citations
        let heading = '';
        const headingEl = clone.querySelector('h2.heading, h3.heading');
        if (headingEl) {
            heading = headingEl.innerText?.trim() || '';
        }
        clone.querySelectorAll(CONFIG.SELECTORS.INLINE_CITATION).forEach(el => el.remove());
        const text = clone.innerText?.trim() || '';
        return { heading, text };
    }

    function extractAugmentUrls(augmentElement) {
        if (!augmentElement) return [];
        const urls = new Set();

        // Footer query links (search query URLs)
        augmentElement.querySelectorAll(CONFIG.SELECTORS.ENRICHMENT_FOOTER_QUERY).forEach(link => {
            if (link.href) {
                try {
                    const url = new URL(link.href, window.location.origin);
                    urls.add(url.href);
                } catch (_) {
                    urls.add(link.href);
                }
            }
        });

        // Any anchor tags within the augment
        augmentElement.querySelectorAll('a[href]').forEach(link => {
            if (link.href) {
                try {
                    const url = new URL(link.href, window.location.origin);
                    urls.add(url.href);
                } catch (_) {
                    urls.add(link.href);
                }
            }
        });

        // Image proxy URLs as reference markers
        augmentElement.querySelectorAll(CONFIG.SELECTORS.ENRICHMENT_CARD_IMG).forEach(img => {
            if (img.src) {
                urls.add(img.src);
            }
        });

        return Array.from(urls);
    }

    // ============================================================================
    // DEEP RESEARCH PANEL EXTRACTION
    // ============================================================================

    /**
     * Extracts the Brave Search Deep Research panel content faithfully.
     * Walks .deep-research-iteration-content blocks in DOM order
     * to preserve the full repeating pattern — no truncation.
     *
     * Verified DOM structure:
     *   .deep-research.noscrollbar
     *     ├── .deep-research-sticky (header + stats)
     *     └── .deep-research-content (or .deep-research-last-event)
     *           └── .deep-research-iteration-content × N
     *                 ├── .deep-research-queries
     *                 │     └── .deep-research-queries-content
     *                 │           └── .deep-research-query > span  (query text)
     *                 ├── .deep-research-thinking × N
     *                 │     └── .deep-research-thinking-content
     *                 │           ├── .deep-research-query > span  (query being thought)
     *                 │           └── .deep-research-thinking-inner-wrapper
     *                 │                 └── .deep-research-thinking-inner
     *                 │                       ├── .deep-research-query > span  (steps)
     *                 │                       └── .deep-research-thinking-relevant-sources
     *                 │                             ├── a.deep-research-source-chip[href]  (source links)
     *                 │                             └── button.deep-research-source-chip  ("+ N more")
     *                 ├── .deep-research-answer
     *                 │     ├── .deep-research-answer-header (label text)
     *                 │     └── .deep-research-answer-content.llm-output (rich HTML body)
     *                 ├── .deep-research-blindspots
     *                 │     └── .deep-research-blindspots-content-wrapper × N
     *                 │           └── .deep-research-blindspots-content
     *                 │                 └── .deep-research-query > span  (blindspot text)
     *                 └── .deep-research-progress ("Researched for ...")
     *
     * @returns {Object|null} { stats, iterations } or null if panel absent
     */
    function extractDeepResearchPanel() {
        const panel = document.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_CONTAINER);
        if (!panel) return null;

        // ------------------------------------------------------------------
        // 1. Stats bar
        // ------------------------------------------------------------------
        const stats = {};
        const statsItems = panel.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_STATS_ITEM);
        statsItems.forEach(item => {
            const valueEl = item.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_STATS_VALUE);
            const labelEl = item.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_STATS_LABEL);
            if (valueEl && labelEl) {
                const label = labelEl.innerText?.trim() || '';
                const value = valueEl.innerText?.trim() || '';
                const longLabel = labelEl.querySelector('.long-label');
                const key = longLabel ? longLabel.innerText?.trim() : label;
                if (key) stats[key] = value;
            }
        });
        const statsRaw = panel.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_STATS);
        const statsText = statsRaw ? statsRaw.innerText?.trim() : '';

        // ------------------------------------------------------------------
        // 2. Find iteration wrappers
        // ------------------------------------------------------------------
        // The iteration content lives inside the .deep-research-content area,
        // or directly in .deep-research-last-event for the final event.
        let iterationEls = panel.querySelectorAll(
            CONFIG.SELECTORS.DEEP_RESEARCH_ITERATION_CONTENT
        );

        // If none found via the standard wrapper, try .deep-research-last-event
        // which is the container for a single iteration's blocks
        if (iterationEls.length === 0) {
            const lastEvent = panel.querySelector('.deep-research-last-event');
            if (lastEvent) {
                // Wrap the last-event content in a synthetic wrapper for uniform processing
                const wrapper = document.createElement('div');
                wrapper.className = 'deep-research-iteration-content';
                // Move child blocks into the wrapper (clone to avoid mutating live DOM)
                const clone = lastEvent.cloneNode(true);
                while (clone.firstChild) {
                    wrapper.appendChild(clone.firstChild);
                }
                iterationEls = [wrapper];
            }
        }

        // Final fallback: use the .deep-research-content container itself
        if (iterationEls.length === 0) {
            const contentArea = panel.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_CONTENT);
            if (contentArea) {
                iterationEls = contentArea.children;
            }
        }

        const iterations = [];

        // Helper: extract query text from a .deep-research-query element
        function extractQueryText(queryEl) {
            // The text is in the first span.desktop-default-regular or span.desktop-small-regular
            const span = queryEl.querySelector('span.desktop-default-regular, span.desktop-small-regular');
            if (span) return span.innerText?.trim() || '';
            // Fallback: any span
            const anySpan = queryEl.querySelector('span');
            if (anySpan) return anySpan.innerText?.trim() || '';
            return queryEl.innerText?.trim() || '';
        }

        Array.from(iterationEls).forEach((iterEl) => {
            const iteration = {
                queries: [],
                thinking: [],
                answerHeader: null,
                answerHtml: null,
                answerText: null,
                blindspots: [],
                progress: null
            };

            // --- Queries ---
            iterEl.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_QUERIES).forEach(queriesBlock => {
                queriesBlock.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_QUERY).forEach(queryEl => {
                    const text = extractQueryText(queryEl);
                    if (text) iteration.queries.push(text);
                });
            });

            // --- Thinking blocks ---
            iterEl.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_THINKING).forEach(thinkingBlock => {
                const thinkingEntry = {
                    query: '',
                    steps: [],
                    sources: []
                };

                // Extract the query text at the top of this thinking block
                const contentWrapper = thinkingBlock.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_THINKING_CONTENT);
                if (contentWrapper) {
                    contentWrapper.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_QUERY).forEach(queryEl => {
                        const text = extractQueryText(queryEl);
                        if (text && !thinkingEntry.query) {
                            thinkingEntry.query = text;
                        }
                    });
                }

                // Extract steps and sources from the inner wrapper
                const innerWrapper = thinkingBlock.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_THINKING_INNER_WRAPPER);
                if (innerWrapper) {
                    // Steps: .deep-research-query > span text
                    innerWrapper.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_QUERY).forEach(stepEl => {
                        const text = extractQueryText(stepEl);
                        if (text) thinkingEntry.steps.push(text);
                    });

                    // Source chips: linked sources
                    innerWrapper.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_SOURCE_CHIP).forEach(chip => {
                        if (chip.href) {
                            thinkingEntry.sources.push({
                                url: chip.href,
                                label: chip.innerText?.trim() || chip.href
                            });
                        }
                    });

                    // "Show more" buttons (non-linked chips)
                    const moreBtns = innerWrapper.querySelectorAll(
                        CONFIG.SELECTORS.DEEP_RESEARCH_SOURCE_CHIP_BUTTON + ':not([href])'
                    );
                    moreBtns.forEach(btn => {
                        const text = btn.innerText?.trim();
                        if (text) thinkingEntry.sources.push({ url: null, label: text });
                    });
                }

                // Only add if it has meaningful content
                if (thinkingEntry.query || thinkingEntry.steps.length > 0 || thinkingEntry.sources.length > 0) {
                    iteration.thinking.push(thinkingEntry);
                }
            });

            // --- Answer blocks ---
            iterEl.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_ANSWER).forEach(answerBlock => {
                // Extract the header text (e.g. "Evaluating possible answer" or "Answer outline")
                const headerEl = answerBlock.querySelector('.deep-research-answer-header');
                if (headerEl) {
                    iteration.answerHeader = headerEl.innerText?.trim() || '';
                }

                // Extract the rich content if present
                const contentEl = answerBlock.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_ANSWER_CONTENT);
                if (contentEl) {
                    const clone = contentEl.cloneNode(true);
                    clone.querySelectorAll('svg, .table-sticky, .table-tools').forEach(el => el.remove());
                    iteration.answerHtml = clone.innerHTML?.trim() || null;
                    iteration.answerText = clone.innerText?.trim() || null;
                }
            });

            // --- Blindspots ---
            iterEl.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_BLINDSPOTS).forEach(bsBlock => {
                bsBlock.querySelectorAll(CONFIG.SELECTORS.DEEP_RESEARCH_BLINDSPOTS_CONTENT).forEach(bsContent => {
                    const queryEl = bsContent.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_QUERY);
                    if (queryEl) {
                        const text = extractQueryText(queryEl);
                        if (text) iteration.blindspots.push(text);
                    }
                });
            });

            // --- Progress ---
            const progressEl = iterEl.querySelector(CONFIG.SELECTORS.DEEP_RESEARCH_PROGRESS);
            if (progressEl) {
                iteration.progress = progressEl.innerText?.trim() || '';
            }

            const hasContent = iteration.queries.length > 0
                || iteration.thinking.length > 0
                || iteration.answerText
                || iteration.answerHeader
                || iteration.blindspots.length > 0
                || iteration.progress;
            if (hasContent) iterations.push(iteration);
        });

        return {
            stats,
            statsText,
            iterations
        };
    }

    // ============================================================================
    // EXPORT SERVICE
    // ============================================================================
    const ExportService = {
        getConversationTitle() {
            const manualTitle = document.getElementById('ns-manual-title')?.value;
            if (manualTitle?.trim()) return manualTitle.trim();

            const titleEl = document.querySelector(CONFIG.SELECTORS.CONVERSATION_TITLE);
            return titleEl?.textContent?.trim() || document.title || 'Brave_Search_Conversation';
        },

        generateFilename(customFilename, conversationTitle, format = 'kebab-case') {
            const dateStr = Utils.getDateString();
            const baseName = customFilename?.trim() || conversationTitle;

            let name = baseName.replace(/[<>:"/\\|?*.]/g, '').trim();
            let formattedName = '';

            switch (format) {
                case 'kebab-case':
                    formattedName = name.replace(/[\s_]+/g, '-').replace(/-+/g, '-').toLowerCase();
                    break;
                case 'Kebab-Case':
                    formattedName = name.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
                    break;
                case 'snake_case':
                    formattedName = name.replace(/[\s-]+/g, '_').replace(/_+/g, '_').toLowerCase();
                    break;
                case 'Snake_Case':
                    formattedName = name.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('_');
                    break;
                case 'PascalCase':
                    formattedName = name.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
                    break;
                case 'camelCase':
                    formattedName = name.split(/[\s_-]+/).map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
                    break;
                default:
                    formattedName = name.replace(/\s+/g, '_').toLowerCase();
            }

            return `${formattedName}_${dateStr}.md`;
        },

        buildMarkdown(conversationTitle) {
            const now = new Date();
            const dateStr = now.toLocaleString();
            const sourceUrl = window.location.href;

            // Gather all message elements in document order
            const allMessages = Array.from(document.querySelectorAll([
                CONFIG.SELECTORS.USER_MESSAGE,
                CONFIG.SELECTORS.AI_MESSAGE,
                CONFIG.SELECTORS.AUGMENT_MESSAGE,
                CONFIG.SELECTORS.RESEARCH_MESSAGE
            ].join(', ')));

            let userCount = 0;
            let aiCount = 0;
            let augmentCount = 0;
            let researchCount = 0;
            let selectedMessages = [];

            // First pass: collect selected messages and associate augments
            let lastAIMessage = null;

            allMessages.forEach(el => {
                if (el.matches(CONFIG.SELECTORS.USER_MESSAGE)) {
                    const cb = el.querySelector('.ns-checkbox');
                    if (cb && cb.checked) {
                        selectedMessages.push({
                            type: 'user',
                            element: el,
                            augmentUrls: []
                        });
                        userCount++;
                    }
                    lastAIMessage = null;
                } else if (el.matches(CONFIG.SELECTORS.AI_MESSAGE)) {
                    const cb = el.querySelector('.ns-checkbox');
                    if (cb && cb.checked) {
                        const msgObj = {
                            type: 'assistant',
                            element: el,
                            augmentUrls: []
                        };
                        selectedMessages.push(msgObj);
                        lastAIMessage = msgObj;
                        aiCount++;
                    } else {
                        lastAIMessage = null;
                    }
                } else if (el.matches(CONFIG.SELECTORS.AUGMENT_MESSAGE)) {
                    const urls = extractAugmentUrls(el);
                    if (urls.length > 0 && lastAIMessage) {
                        urls.forEach(u => lastAIMessage.augmentUrls.push(u));
                        augmentCount++;
                    }
                } else if (el.matches(CONFIG.SELECTORS.RESEARCH_MESSAGE)) {
                    const cb = el.querySelector('.ns-checkbox');
                    if (cb && cb.checked) {
                        selectedMessages.push({
                            type: 'research',
                            element: el,
                            augmentUrls: []
                        });
                        researchCount++;
                    }
                    // Don't break the augment chain — research doesn't consume AI context
                }
            });

            const totalMessages = userCount + aiCount;
            const exchanges = Math.min(userCount, aiCount);

            let markdown = `---
> **🤖 Model:** Brave Search AI
>
> **🌐 Date:** ${dateStr}
>
> **🌐 Source:** [Brave Search AI Chat](${sourceUrl})
>
> **🏷️ Tags:** Brave, AI-Chat, Noosphere
>
> **📂 Artifacts:** [Internal](${sourceUrl})
>
> **📊 Metadata:**
>> **Total Exchanges:** ${exchanges}
>>
>> **Total Chat Messages:** ${totalMessages}
>>
>> **Total User Messages:** ${userCount}
>>
>> **Total AI Messages:** ${aiCount}
>>
>> **Total Augments:** ${augmentCount}
>>
>> **Total Deep Research Messages:** ${researchCount}
---

## Title:

> ${conversationTitle}

--- 

`;

            let lastType = null;

            selectedMessages.forEach((msg, index) => {
                if (msg.type === 'user') {
                    const text = extractUserText(msg.element);
                    markdown += `#### Prompt - User 👤:\n\n`;
                    markdown += `${text}\n\n`;
                    lastType = 'user';
                }

                if (msg.type === 'assistant') {
                    // Open a new response block only when transitioning into assistant
                    const isNewResponse = (lastType !== 'assistant');
                    if (isNewResponse) {
                        markdown += `#### Response - Brave Search AI 🤖:\n\n`;
                    }

                    // Extract heading from the h2/h3 in this assistant message
                    const { heading, text } = extractAITextWithHeading(msg.element);

                    // Sub-header from the block's own heading (h2/h3)
                    if (heading) {
                        markdown += `##### ${heading}\n\n`;
                    }

                    markdown += `${text}\n\n`;

                    // Append augment URLs if present (inline after this sub-block)
                    if (msg.augmentUrls && msg.augmentUrls.length > 0) {
                        markdown += `**📎 Augment References:**\n\n`;
                        msg.augmentUrls.forEach(url => {
                            markdown += `- ${url}\n`;
                        });
                        markdown += `\n`;
                    }

                    lastType = 'assistant';
                }

                if (msg.type === 'research') {
                    const deepResearch = extractDeepResearchPanel();
                    if (deepResearch && deepResearch.iterations && deepResearch.iterations.length > 0) {
                        markdown += `#### 🔬 Deep Research Panel\n\n`;
                        markdown += `> *Brave Search AI Deep Research — separate research panel, not part of standard chat exchange.*\n\n`;

                        // Stats bar
                        if (deepResearch.stats && Object.keys(deepResearch.stats).length > 0) {
                            markdown += `**📊 Research Stats:** `;
                            const statEntries = Object.entries(deepResearch.stats);
                            statEntries.forEach(([key, value], idx) => {
                                markdown += `${value} ${key}`;
                                if (idx < statEntries.length - 1) markdown += ` | `;
                            });
                            markdown += `\n\n`;
                        }

                        // Each iteration
                        deepResearch.iterations.forEach((iteration, iterIndex) => {
                            if (deepResearch.iterations.length > 1) {
                                markdown += `##### Iteration ${iterIndex + 1} 🔍\n\n`;
                            }

                            // Queries
                            if (iteration.queries && iteration.queries.length > 0) {
                                markdown += `**📋 Search Queries**\n\n`;
                                iteration.queries.forEach((queryText) => {
                                    markdown += `> ${queryText}\n`;
                                });
                                markdown += `\n`;
                            }

                            // Thinking blocks
                            if (iteration.thinking && iteration.thinking.length > 0) {
                                iteration.thinking.forEach((thinkingEntry, thinkIdx) => {
                                    markdown += `**🧠 Reasoning Chain${iteration.thinking.length > 1 ? ` ${thinkIdx + 1}` : ''}**\n\n`;

                                    if (thinkingEntry.query) {
                                        markdown += `> ${thinkingEntry.query}\n`;
                                        markdown += `>\n`;
                                    }

                                    if (thinkingEntry.steps && thinkingEntry.steps.length > 0) {
                                        thinkingEntry.steps.forEach((step) => {
                                            markdown += `> ${step}\n`;
                                        });
                                        markdown += `\n`;
                                    }

                                    if (thinkingEntry.sources && thinkingEntry.sources.length > 0) {
                                        markdown += `  **Sources examined:**\n\n`;
                                        thinkingEntry.sources.forEach((source) => {
                                            if (source.url) {
                                                markdown += `  - [${source.label}](${source.url})\n`;
                                            } else {
                                                markdown += `  - ${source.label}\n`;
                                            }
                                        });
                                        markdown += `\n`;
                                    }
                                });
                            }

                            // Answer
                            if (iteration.answerText) {
                                markdown += `**📝 ${iteration.answerHeader || 'Answer'}**\n\n`;
                                // Use blockquote for the rich answer text
                                markdown += `> ${iteration.answerText.replace(/\n\n/g, '\n>\n> ').replace(/\n/g, '\n> ')}\n\n`;
                            } else if (iteration.answerHeader) {
                                markdown += `**${iteration.answerHeader}**\n\n`;
                            }

                            // Blindspots
                            if (iteration.blindspots && iteration.blindspots.length > 0) {
                                markdown += `**👁️ Blindspots Identified**\n\n`;
                                iteration.blindspots.forEach((bs) => {
                                    markdown += `- ${bs}\n`;
                                });
                                markdown += `\n`;
                            }

                            // Progress
                            if (iteration.progress) {
                                markdown += `**⏱️ Progress:** ${iteration.progress}\n\n`;
                            }

                            if (iterIndex < deepResearch.iterations.length - 1) {
                                markdown += `---\n\n`;
                            }
                        });
                    }
                    lastType = 'research';
                }

                if (index < selectedMessages.length - 1) {
                    markdown += `---\n\n`;
                }
            });

            markdown += `\n---\n\n`;
            markdown += `###### Noosphere Reflect\n`;
            markdown += `###### ***Meaning Through Memory***\n\n`;
            markdown += `###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n`;

            return markdown;
        },

        buildJSON(conversationTitle) {
            const now = new Date();
            const sourceUrl = window.location.href;

            const allMessages = Array.from(document.querySelectorAll([
                CONFIG.SELECTORS.USER_MESSAGE,
                CONFIG.SELECTORS.AI_MESSAGE,
                CONFIG.SELECTORS.AUGMENT_MESSAGE,
                CONFIG.SELECTORS.RESEARCH_MESSAGE
            ].join(', ')));

            const messages = [];
            let lastAIMessage = null;
            let userCount = 0;
            let aiCount = 0;

            allMessages.forEach(el => {
                if (el.matches(CONFIG.SELECTORS.USER_MESSAGE)) {
                    const cb = el.querySelector('.ns-checkbox');
                    if (cb && cb.checked) {
                        messages.push({
                            type: 'prompt',
                            content: extractUserText(el),
                            timestamp: new Date().toISOString(),
                            platform: 'brave'
                        });
                        userCount++;
                    }
                    lastAIMessage = null;
                } else if (el.matches(CONFIG.SELECTORS.AI_MESSAGE)) {
                    const cb = el.querySelector('.ns-checkbox');
                    if (cb && cb.checked) {
                        const msg = {
                            type: 'response',
                            content: extractAIText(el),
                            timestamp: new Date().toISOString(),
                            platform: 'brave',
                            augmentUrls: []
                        };
                        messages.push(msg);
                        lastAIMessage = msg;
                        aiCount++;
                    } else {
                        lastAIMessage = null;
                    }
                } else if (el.matches(CONFIG.SELECTORS.AUGMENT_MESSAGE)) {
                    const urls = extractAugmentUrls(el);
                    if (urls.length > 0 && lastAIMessage) {
                        urls.forEach(u => lastAIMessage.augmentUrls.push(u));
                    }
                } else if (el.matches(CONFIG.SELECTORS.RESEARCH_MESSAGE)) {
                    const cb = el.querySelector('.ns-checkbox');
                    if (cb && cb.checked) {
                        const deepResearch = extractDeepResearchPanel();
                        messages.push({
                            type: 'research',
                            content: deepResearch ? (deepResearch.answerText || '') : '',
                            stats: deepResearch ? deepResearch.stats : {},
                            iterations: deepResearch ? deepResearch.iterations : [],
                            platform: 'brave'
                        });
                    }
                }
            });

            // Check if any research messages exist in the collected messages
            const hasDeepResearch = messages.some(m => m.type === 'research');

            const chatData = {
                messages: messages,
                metadata: {
                    title: conversationTitle,
                    model: 'Brave Search AI',
                    date: now.toISOString(),
                    tags: ['Brave', 'AI-Chat', 'Noosphere'],
                    sourceUrl: sourceUrl,
                    platform: 'brave',
                    hasDeepResearch: hasDeepResearch
                },
                exportedBy: {
                    tool: 'Noosphere Reflect',
                    version: 'Brave DOM Scraper v1.0',
                    method: 'dom-extraction',
                    noosphereMetadata: {
                        userMarker: '#### Prompt - User 👤:',
                        aiMarker: '#### Response - Brave Search AI 🤖:',
                        augmentMarker: '📎 Augment References:',
                        deepResearchMarker: '#### 🔬 Deep Research Panel'
                    }
                }
            };

            return JSON.stringify(chatData, null, 2);
        },

        exportToClipboard(content) {
            navigator.clipboard.writeText(content).then(() => {
                Utils.createNotification('✅ Copied to clipboard!');
            }).catch(err => {
                console.error('Clipboard error:', err);
                Utils.createNotification('❌ Clipboard failed');
            });
        },

        exportToFile(content, filename, type = 'text/markdown') {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            Utils.createNotification(`✅ Downloaded ${filename}`);
        },

        execute(exportMode, format = 'md', customFilename) {
            const userMessages = document.querySelectorAll(CONFIG.SELECTORS.USER_MESSAGE);
            const aiMessages = document.querySelectorAll(CONFIG.SELECTORS.AI_MESSAGE);

            if (!userMessages.length && !aiMessages.length) {
                Utils.createNotification('❌ No messages found');
                return;
            }

            const conversationTitle = this.getConversationTitle();
            const namingFormat = document.getElementById('ns-naming-format')?.value || 'kebab-case';

            let content;
            let extension;
            let mimeType;

            if (format === 'json') {
                content = this.buildJSON(conversationTitle);
                extension = 'json';
                mimeType = 'application/json';
            } else {
                content = this.buildMarkdown(conversationTitle);
                extension = 'md';
                mimeType = 'text/markdown';
            }

            if (exportMode === 'clipboard') {
                this.exportToClipboard(content);
            } else {
                const filename = this.generateFilename(customFilename, conversationTitle, namingFormat).replace(/\.md$/, `.${extension}`);
                this.exportToFile(content, filename, mimeType);
            }
        }
    };

    // ============================================================================
    // MAIN INITIALIZATION
    // ============================================================================
    function init() {
        console.log('[Noosphere] Initializing Brave Search AI Exporter with Neural Console...');

        // Ensure no old UI is present
        document.getElementById('brave-export-btn')?.remove();
        document.getElementById('brave-export-dropdown')?.remove();

        injectStyles();
        createMenu();
        injectCheckboxes();
        setupObserver();

        // Connect UI buttons to ExportService
        document.getElementById('ns-copy-md').onclick = () => {
            ExportService.execute('clipboard', 'md');
        };

        document.getElementById('ns-copy-json').onclick = () => {
            ExportService.execute('clipboard', 'json');
        };

        document.getElementById('ns-dl-md').onclick = () => {
            const customFilename = document.getElementById('ns-custom-name')?.value;
            ExportService.execute('file', 'md', customFilename);
        };

        // Bulk selection logic
        const bulkSelect = (type) => {
            document.querySelectorAll('.ns-checkbox').forEach(cb => {
                let shouldBeChecked = false;
                if (type === 'all') shouldBeChecked = true;
                if (type === 'none') shouldBeChecked = false;
                if (type === 'user' && cb.dataset.type === 'user') shouldBeChecked = true;
                if (type === 'ai' && cb.dataset.type === 'assistant') shouldBeChecked = true;
                cb.checked = shouldBeChecked;
            });
        };

        document.getElementById('ns-select-all').onclick = () => bulkSelect('all');
        document.getElementById('ns-select-user').onclick = () => bulkSelect('user');
        document.getElementById('ns-select-ai').onclick = () => bulkSelect('ai');
        document.getElementById('ns-select-none').onclick = () => bulkSelect('none');

        console.log('[Noosphere] Neural Console is live on Brave Search AI.');
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
