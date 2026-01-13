/**
 * Noosphere Reflect - ChatGPT Native Copy Button Scraper
 *
 * Platform-specific approach: Optimized for ChatGPT.com
 * Intercepts native "Copy" buttons to collect messages with Noosphere metadata.
 *
 * Instructions:
 * 1. Open a chat on ChatGPT.com
 * 2. Open Developer Tools (F12 or Ctrl+Shift+I)
 * 3. Paste this entire script into Console and press Enter
 * 4. A "Noosphere" menu will appear in bottom-right corner
 * 5. Click individual message copy buttons - they'll auto-collect with metadata
 * 6. Or use the menu to export in JSON or Markdown format
 */

(function() {
    'use strict';

    const CONFIG = {
        MENU_ID: 'noosphere-menu',
        COLLECTOR_ID: 'noosphere-collector-status',
        PLATFORM_NAME: 'ChatGPT',
        PLATFORM_ID: 'chatgpt',
        PLATFORM_COLOR: '#10a37f',
        SELECTORS: {
            userMsg: '[data-message-author-role="user"]',
            aiMsg: '[data-message-author-role="assistant"]',
            copyBtn: 'button[aria-label*="Copy"], button[aria-label*="copy"]',
            title: 'title'
        }
    };

    let collectedMessages = [];

    /**
     * Extract text from a message element, preserving structure
     */
    function extractMessageText(element) {
        if (!element) return '';

        let text = element.innerText || element.textContent;

        // Clean up common artifacts
        text = text.replace(/^\s*Copy\s*$/gm, ''); // Remove copy button text
        text = text.replace(/^\s*Edit\s*$/gm, ''); // Remove edit button text
        text = text.replace(/^\s*Retry\s*$/gm, ''); // Remove retry button text
        text = text.replace(/^\s*Regenerate\s*$/gm, ''); // Remove regenerate button text
        text = text.replace(/^\s*[\d:]+\s*$/gm, ''); // Remove timestamps

        return text.trim();
    }

    /**
     * Create a message object with Noosphere metadata
     */
    function createMessageWithMetadata(type, content, timestamp = null) {
        return {
            type: type, // 'prompt' or 'response'
            content: content,
            timestamp: timestamp || new Date().toISOString(),
            isEdited: false,
            platform: CONFIG.PLATFORM_ID,
            // Noosphere format markers for export
            noosphereMarker: type === 'prompt' ? '## Prompt:' : '## Response:'
        };
    }

    /**
     * Extract thoughts from message if present (Claude/Gemini pattern)
     */
    function extractThoughts(content) {
        const thoughtMatch = content.match(/<thought>([\s\S]*?)<\/thought>/i);
        if (thoughtMatch) {
            return {
                thoughts: thoughtMatch[1].trim(),
                contentWithoutThoughts: content.replace(/<thought>[\s\S]*?<\/thought>/i, '').trim()
            };
        }
        return {
            thoughts: null,
            contentWithoutThoughts: content
        };
    }

    /**
     * Extract all messages currently visible on page
     */
    function extractAllMessages() {
        const messages = [];
        const userElements = document.querySelectorAll(CONFIG.SELECTORS.userMsg);
        const aiElements = document.querySelectorAll(CONFIG.SELECTORS.aiMsg);

        // Add user messages
        userElements.forEach(el => {
            const text = extractMessageText(el);
            if (text) {
                messages.push(createMessageWithMetadata('prompt', text));
            }
        });

        // Add AI messages
        aiElements.forEach(el => {
            const text = extractMessageText(el);
            if (text) {
                messages.push(createMessageWithMetadata('response', text));
            }
        });

        return messages;
    }

    /**
     * Get page title/metadata
     */
    function getPageMetadata() {
        const titleEl = document.querySelector(CONFIG.SELECTORS.title);
        const title = titleEl ? titleEl.innerText : 'ChatGPT Conversation';

        return {
            title: title.replace(` - ${CONFIG.PLATFORM_NAME}`, '').trim() || 'ChatGPT Conversation',
            model: CONFIG.PLATFORM_NAME,
            date: new Date().toISOString(),
            tags: [CONFIG.PLATFORM_ID, 'export', 'noosphere'],
            sourceUrl: window.location.href,
            platform: CONFIG.PLATFORM_ID
        };
    }

    /**
     * Convert messages to JSON format with Noosphere metadata markers
     */
    function exportAsJSON(messages = null) {
        const msgs = messages || collectedMessages || extractAllMessages();
        const metadata = getPageMetadata();

        // Format messages with Noosphere markers
        const formattedMessages = msgs.map(msg => ({
            type: msg.type,
            // Noosphere metadata markers (## Prompt: or ## Response:)
            marker: msg.noosphereMarker,
            content: msg.content,
            timestamp: msg.timestamp,
            isEdited: msg.isEdited,
            platform: msg.platform
        }));

        const chatData = {
            messages: formattedMessages,
            metadata: metadata,
            exportedBy: {
                tool: 'Noosphere Reflect',
                version: 'ChatGPT Native Scraper v2.0',
                method: 'native-copy-button-intercept',
                noosphereMetadata: {
                    userMarker: '## Prompt:',
                    aiMarker: '## Response:',
                    thoughtMarker: '<thought>',
                    thoughtMarkerEnd: '</thought>'
                }
            }
        };

        return JSON.stringify(chatData, null, 2);
    }

    /**
     * Convert messages to Markdown format with Noosphere metadata markers
     */
    function exportAsMarkdown(messages = null) {
        const msgs = messages || collectedMessages || extractAllMessages();
        const metadata = getPageMetadata();

        let markdown = '';

        // Header
        markdown += `# ${metadata.title}\n\n`;
        markdown += `**Platform:** ${metadata.model} | **Date:** ${new Date(metadata.date).toLocaleString()}\n`;
        markdown += `**Source:** [${metadata.sourceUrl}](${metadata.sourceUrl})\n`;
        markdown += `**Tags:** ${metadata.tags.join(', ')}\n\n`;
        markdown += '---\n\n';

        // Messages with Noosphere metadata markers
        msgs.forEach((msg) => {
            // Use Noosphere metadata markers: ## Prompt: or ## Response:
            markdown += `${msg.noosphereMarker}\n`;

            // Handle thoughts if present (Claude/Gemini pattern)
            const thoughtData = extractThoughts(msg.content);

            if (thoughtData.thoughts) {
                // Format with thought block
                markdown += `<thought>\n${thoughtData.thoughts}\n</thought>\n\n`;
                markdown += `${thoughtData.contentWithoutThoughts}\n`;
            } else {
                // No thoughts, just content
                markdown += `${msg.content}\n`;
            }

            markdown += '\n---\n\n';
        });

        // Attribution footer (Noosphere standard)
        markdown += `*Exported by Noosphere Reflect - ChatGPT Native Scraper v2.0*\n`;
        markdown += `*Platform: ${metadata.platform} | Tool Version: Native*\n`;

        return markdown;
    }

    /**
     * Copy to clipboard and show feedback
     */
    async function copyToClipboard(content, format = 'json') {
        try {
            await navigator.clipboard.writeText(content);
            showStatus(`✅ Copied ${collectedMessages.length} messages as ${format.toUpperCase()}!`, 'success');
            return true;
        } catch (err) {
            showStatus(`❌ Copy failed: ${err.message}`, 'error');
            console.error('[Noosphere] Clipboard error:', err);
            return false;
        }
    }

    /**
     * Show status message
     */
    function showStatus(message, type = 'info') {
        let status = document.getElementById(CONFIG.COLLECTOR_ID);

        if (!status) {
            status = document.createElement('div');
            status.id = CONFIG.COLLECTOR_ID;
            document.body.appendChild(status);
        }

        status.textContent = message;
        status.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            z-index: 99998;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease;
        `;

        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    /**
     * Create menu UI
     */
    function createMenu() {
        const existing = document.getElementById(CONFIG.MENU_ID);
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.id = CONFIG.MENU_ID;
        menu.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            font-family: system-ui, sans-serif;
        `;

        // Main button
        const mainBtn = document.createElement('button');
        mainBtn.textContent = '📋 Noosphere';
        mainBtn.style.cssText = `
            display: block;
            width: 140px;
            padding: 12px 16px;
            background: ${CONFIG.PLATFORM_COLOR};
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.2s ease;
            margin-bottom: 10px;
        `;

        mainBtn.onmouseover = () => {
            mainBtn.style.transform = 'translateY(-2px)';
            mainBtn.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        };
        mainBtn.onmouseout = () => {
            mainBtn.style.transform = 'translateY(0)';
            mainBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        };

        // Menu items container
        const items = document.createElement('div');
        items.id = `${CONFIG.MENU_ID}-items`;
        items.style.cssText = `
            display: none;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 10px;
        `;

        // Menu item styles
        const itemStyle = `
            display: block;
            width: 140px;
            padding: 10px 16px;
            background: white;
            color: #333;
            border: 2px solid ${CONFIG.PLATFORM_COLOR};
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
        `;

        // Copy All JSON
        const copyJsonBtn = document.createElement('button');
        copyJsonBtn.textContent = '📄 Copy as JSON';
        copyJsonBtn.style.cssText = itemStyle;
        copyJsonBtn.onclick = async () => {
            const json = exportAsJSON();
            await copyToClipboard(json, 'json');
        };

        // Copy All Markdown
        const copyMdBtn = document.createElement('button');
        copyMdBtn.textContent = '📝 Copy as MD';
        copyMdBtn.style.cssText = itemStyle;
        copyMdBtn.onclick = async () => {
            const md = exportAsMarkdown();
            await copyToClipboard(md, 'markdown');
        };

        // Collect Messages
        const collectBtn = document.createElement('button');
        collectBtn.textContent = '🔗 Collect from Page';
        collectBtn.style.cssText = itemStyle;
        collectBtn.onclick = () => {
            collectedMessages = extractAllMessages();
            showStatus(`📦 Collected ${collectedMessages.length} messages!`, 'info');
        };

        // Help
        const helpBtn = document.createElement('button');
        helpBtn.textContent = '❓ Help';
        helpBtn.style.cssText = itemStyle;
        helpBtn.onclick = () => {
            alert(`Noosphere Reflect - ${CONFIG.PLATFORM_NAME} Scraper\n\n` +
                `How to use:\n` +
                `1. Click individual message copy buttons - they auto-collect\n` +
                `2. Or use "Collect from Page" to grab all visible messages\n` +
                `3. Export as JSON or Markdown\n` +
                `4. Import into Noosphere Reflect\n\n` +
                `Messages collected: ${collectedMessages.length}\n\n` +
                `Keyboard shortcuts:\n` +
                `• Ctrl+Shift+E = Export all as JSON\n` +
                `• Ctrl+Shift+M = Export all as Markdown`);
        };

        items.appendChild(copyJsonBtn);
        items.appendChild(copyMdBtn);
        items.appendChild(collectBtn);
        items.appendChild(helpBtn);

        // Toggle
        mainBtn.onclick = () => {
            const isVisible = items.style.display !== 'none';
            items.style.display = isVisible ? 'none' : 'flex';
            mainBtn.style.background = isVisible ? CONFIG.PLATFORM_COLOR : '#6366f1';
        };

        menu.appendChild(mainBtn);
        menu.appendChild(items);
        document.body.appendChild(menu);
    }

    /**
     * Intercept native copy buttons
     */
    function interceptNativeCopyButtons() {
        document.addEventListener('click', function(e) {
            const target = e.target.closest('button');

            // Check if this is a copy button
            if (target && target.textContent.toLowerCase().includes('copy')) {
                // Get the message container (walk up DOM)
                let messageContainer = target.closest(CONFIG.SELECTORS.userMsg) ||
                                     target.closest(CONFIG.SELECTORS.aiMsg);

                if (messageContainer) {
                    const text = extractMessageText(messageContainer);

                    if (text) {
                        // Determine if user or AI
                        const isUser = messageContainer.matches(CONFIG.SELECTORS.userMsg);

                        const msg = createMessageWithMetadata(isUser ? 'prompt' : 'response', text);
                        collectedMessages.push(msg);

                        showStatus(`📌 Collected: ${msg.type} (${collectedMessages.length} total)`, 'info');

                        console.log('[Noosphere] Native button intercepted:', msg);
                    }
                }
            }
        }, true); // Capture phase to intercept early
    }

    /**
     * Initialize scraper
     */
    function init() {
        console.log(`[Noosphere] Initializing on ${CONFIG.PLATFORM_NAME}`);

        createMenu();
        interceptNativeCopyButtons();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+E = Export all as JSON
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                const json = exportAsJSON();
                copyToClipboard(json, 'json');
            }

            // Ctrl+Shift+M = Export all as Markdown
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                const md = exportAsMarkdown();
                copyToClipboard(md, 'markdown');
            }
        });

        showStatus('✨ ChatGPT Native Scraper ready!', 'success');
        console.log('[Noosphere] Keyboard shortcuts: Ctrl+Shift+E (JSON), Ctrl+Shift+M (MD)');
    }

    // Start!
    init();

})();
