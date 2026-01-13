/**
 * Noosphere Reflect - Universal Native Copy Button Scraper
 *
 * Advanced approach: Intercepts & enhances native "Copy" buttons across all platforms
 * to collect message context and append Noosphere Reflect metadata.
 *
 * Supports: Claude, ChatGPT, Gemini, LeChat, Grok, and more
 * Formats: JSON, Markdown, Markdown + JSON
 *
 * Instructions:
 * 1. Open a chat in any supported AI platform
 * 2. Open Developer Tools (F12 or Ctrl+Shift+I)
 * 3. Paste this entire script into Console and press Enter
 * 4. A "Noosphere Collect" menu will appear in bottom-right corner
 * 5. Click individual message copy buttons - they'll auto-collect with metadata
 * 6. Or use the menu to "Copy All Chats" in your preferred format
 */

(function() {
    'use strict';

    const CONFIG = {
        MENU_ID: 'noosphere-menu',
        COLLECTOR_ID: 'noosphere-collector-status',
        STORAGE_KEY: 'noosphere_collected_messages',
        PLATFORMS: {
            claude: {
                name: 'Claude',
                selectors: {
                    userMsg: '[data-testid="user-message"]',
                    aiMsg: '[data-testid="assistant-message"], [data-testid="claude-message"]',
                    copyBtn: 'button[aria-label*="Copy"], button[aria-label*="copy"]',
                    title: 'title'
                },
                color: '#8b5cf6'
            },
            chatgpt: {
                name: 'ChatGPT',
                selectors: {
                    userMsg: '[data-message-author-role="user"]',
                    aiMsg: '[data-message-author-role="assistant"]',
                    copyBtn: 'button[aria-label*="Copy"], button[aria-label*="copy"]',
                    title: 'title'
                },
                color: '#10a37f'
            },
            gemini: {
                name: 'Gemini',
                selectors: {
                    userMsg: '.turn.input, [class*="user-query"]',
                    aiMsg: '.turn.output, [class*="model-response"]',
                    copyBtn: 'button[aria-label*="Copy"], button svg.lucide-copy, .lucide-copy',
                    title: '.conversation-title, title'
                },
                color: '#10b981'
            },
            lechat: {
                name: 'LeChat',
                selectors: {
                    userMsg: '.ms-auto[class*="rounded"]',
                    aiMsg: '[class*="flex"][class*="flex-col"]',
                    copyBtn: 'button[aria-label*="Copy"], button svg.lucide-copy',
                    title: 'title'
                },
                color: '#3b82f6'
            },
            grok: {
                name: 'Grok',
                selectors: {
                    userMsg: '.response-content-markdown',
                    aiMsg: '.response-content-markdown',
                    copyBtn: 'button[aria-label*="Copy"], button svg.lucide-copy',
                    title: 'title'
                },
                color: '#ec4899'
            }
        }
    };

    let collectedMessages = [];
    let currentPlatform = null;

    /**
     * Detect which platform we're on
     */
    function detectPlatform() {
        const url = window.location.hostname;

        if (url.includes('claude')) return 'claude';
        if (url.includes('chatgpt')) return 'chatgpt';
        if (url.includes('gemini')) return 'gemini';
        if (url.includes('lechat')) return 'lechat';
        if (url.includes('grok') || url.includes('x.com')) return 'grok';

        // Fallback: try to detect by DOM markers
        if (document.querySelector('[data-testid="user-message"]')) return 'claude';
        if (document.querySelector('[data-message-author-role="user"]')) return 'chatgpt';
        if (document.querySelector('[class*="turn input"]')) return 'gemini';
        if (document.querySelector('[class*="ms-auto"]')) return 'lechat';
        if (document.querySelector('.response-content-markdown')) return 'grok';

        return null;
    }

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
            platform: currentPlatform,
            // Noosphere format markers for export
            noosphereMarker: type === 'prompt' ? '## Prompt:' : '## Response:'
        };
    }

    /**
     * Format message with Noosphere metadata markers for export
     */
    function formatMessageWithNoosphereMarkers(message) {
        let formatted = `${message.noosphereMarker}\n${message.content}`;
        return formatted;
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
        const platform = CONFIG.PLATFORMS[currentPlatform];
        if (!platform) return [];

        const messages = [];
        const userElements = document.querySelectorAll(platform.selectors.userMsg);
        const aiElements = document.querySelectorAll(platform.selectors.aiMsg);

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
        const titleEl = document.querySelector('title');
        const title = titleEl ? titleEl.innerText : 'Chat Export';

        return {
            title: title.replace(` - ${CONFIG.PLATFORMS[currentPlatform].name}`, '').trim() || 'Chat Export',
            model: CONFIG.PLATFORMS[currentPlatform].name,
            date: new Date().toISOString(),
            tags: [currentPlatform, 'export', 'noosphere'],
            sourceUrl: window.location.href,
            platform: currentPlatform
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
                version: 'Universal Native Scraper v2.0',
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
        markdown += `*Exported by Noosphere Reflect - Universal Native Scraper v2.0*\n`;
        markdown += `*Platform: ${metadata.platform} | Tool Version: Universal Native*\n`;

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

        const platform = CONFIG.PLATFORMS[currentPlatform];
        const menuColor = platform ? platform.color : '#8b5cf6';

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
            background: ${menuColor};
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
            border: 2px solid ${menuColor};
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
            alert(`Noosphere Reflect - Native Copy Scraper\n\n` +
                `Detected Platform: ${CONFIG.PLATFORMS[currentPlatform].name}\n\n` +
                `How to use:\n` +
                `1. Click individual message copy buttons - they auto-collect\n` +
                `2. Or use "Collect from Page" to grab all visible messages\n` +
                `3. Export as JSON or Markdown\n` +
                `4. Import into Noosphere Reflect or any converter\n\n` +
                `Messages collected: ${collectedMessages.length}`);
        };

        items.appendChild(copyJsonBtn);
        items.appendChild(copyMdBtn);
        items.appendChild(collectBtn);
        items.appendChild(helpBtn);

        // Toggle
        mainBtn.onclick = () => {
            const isVisible = items.style.display !== 'none';
            items.style.display = isVisible ? 'none' : 'flex';
            mainBtn.style.background = isVisible ? menuColor : '#6366f1';
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
                let messageContainer = target.closest('[data-testid*="message"], [class*="message"], [class*="turn"], [class*="response"]');

                if (messageContainer) {
                    const text = extractMessageText(messageContainer);

                    if (text) {
                        // Determine if user or AI
                        const isUser = messageContainer.querySelector('[data-testid="user-message"]') ||
                                     messageContainer.matches('[data-message-author-role="user"]') ||
                                     messageContainer.classList.toString().includes('user') ||
                                     messageContainer.classList.toString().includes('prompt');

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
        currentPlatform = detectPlatform();

        if (!currentPlatform) {
            console.warn('[Noosphere] Platform not detected. Using generic selectors.');
            currentPlatform = 'claude'; // Fallback
        }

        console.log(`[Noosphere] Initializing on ${CONFIG.PLATFORMS[currentPlatform].name}`);

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

        showStatus('✨ Noosphere Native Scraper ready!', 'success');
        console.log('[Noosphere] Keyboard shortcuts: Ctrl+Shift+E (JSON), Ctrl+Shift+M (MD)');
    }

    // Start!
    init();

})();
