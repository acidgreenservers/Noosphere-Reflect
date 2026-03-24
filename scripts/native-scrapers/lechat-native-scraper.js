/**
 * Noosphere Reflect - LeChat Native Copy Button Scraper
 * v2.2.1 - "Neural Interface" Edition
 *
 * Platform-specific approach: Optimized for chat.mistral.ai (LeChat)
 * Intercepts native "Copy" buttons to collect messages with Noosphere metadata.
 * Handles Mistral-specific DOM structure with flexbox layouts.
 */

(function () {
    'use strict';

    const CONFIG = {
        MENU_ID: 'noosphere-menu',
        COLLECTOR_ID: 'noosphere-collector-status',
        PLATFORM_NAME: 'LeChat',
        PLATFORM_ID: 'lechat',
        PLATFORM_COLOR: '#3b82f6',
        SELECTORS: {
            message: '[data-message-id], div.ms-auto, div.me-auto',
            userMsg: '[data-message-author-role="user"], div.ms-auto',
            aiMsg: '[data-message-author-role="assistant"], div.me-auto',
            content: '[data-message-part-type="answer"], [data-message-part-type="reasoning"], .whitespace-pre-wrap, .select-text',
            copyBtn: 'button[aria-label*="copy"], button svg.lucide-copy',
            title: '.min-h-5\\.5.truncate, .truncate.text-sm.leading-5\\.5, title'
        }
    };

    let collectedMessages = [];
    let isCollecting = false;
    let collectionQueue = [];
    let currentCollectionIndex = 0;

    /**
     * Programmatically clicks the native copy button and retrieves content from the clipboard.
     * This is the new, non-scraping method for data collection.
     */
    async function getTextFromNativeCopy(element) {
        if (!element) return '';

        const copyButton = element.querySelector(CONFIG.SELECTORS.copyBtn);
        if (!copyButton) {
            console.warn('[Noosphere] No native copy button found for a selected message.');
            return `[Noosphere Error: Could not find copy button for this message.]`;
        }

        // Temporarily override clipboard to prevent native pop-ups and capture data
        try {
            // Get the text by simulating a click and reading from the clipboard
            copyButton.click(); // This should trigger the site's own copy mechanism
            
            // A brief delay may be needed for the clipboard to update
            await new Promise(resolve => setTimeout(resolve, 100));

            const text = await navigator.clipboard.readText();
            return text.trim();
        } catch (err) {
            console.error('[Noosphere] Clipboard API error:', err);
            // The user will be guided by the UI button, so a disruptive alert is no longer needed.
            showStatus('❌ Clipboard permission denied.', 'error');
            return `[Noosphere Error: Clipboard permission was denied. Please use the 'Grant Access' button.]`;
        }
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
     * Helper to detect if a message block belongs to the AI (LeChat)
     */
    function isAssistantMessage(el) {
        // 1. Check native data attributes
        if (el.matches(CONFIG.SELECTORS.aiMsg) || el.closest('[data-message-author-role="assistant"]')) return true;

        // 2. Check for the specific LeChat AI icon path provided by the user
        const aiPath = 'M13.3715 16.358H16.1144V13.6486H13.3712L13.3715 16.358H10.6283V13.6486H7.88568V16.358H10.6283V19.0676H2.3999V16.358H5.14279V5.52002H7.88568V8.22963H10.6286V10.939H13.3715V8.22963H16.1144V5.52002H18.8572V16.358H21.5999V19.0676H13.3715V16.358Z';
        
        // Fix invalid selector - check each separately
        let container = el.closest('[data-message-id]');
        if (!container) container = el.closest('.group/message');
        
        if (container) {
            const icon = container.querySelector(`path[d="${aiPath}"]`);
            if (icon) return true;
        }

        // 3. Fallback to class-based layout detection
        return el.classList.contains('me-auto');
    }

    /**
     * Sync collected messages from the DOM based on checkbox state
     */
    /**
     * Sync collected messages from the DOM based on checkbox state using the clipboard method.
     * This is now an async function.
     */
    function startCollection() {
        collectedMessages = [];
        collectionQueue = Array.from(document.querySelectorAll('.ns-checkbox:checked'))
            .map(cb => cb.closest(CONFIG.SELECTORS.message))
            .filter(el => el);

        if (collectionQueue.length === 0) {
            showStatus('No messages selected to start collection.', 'error');
            return;
        }

        isCollecting = true;
        currentCollectionIndex = 0;
        
        // Instead of a global listener, we will hijack the specific copy buttons.
        hijackCopyButtons();

        highlightNextMessage();
    }

    function highlightNextMessage() {
        // Remove highlight from previous element
        document.querySelectorAll('.ns-collection-highlight').forEach(el => {
            el.classList.remove('ns-collection-highlight');
        });

        if (currentCollectionIndex >= collectionQueue.length) {
            finishCollection();
            return;
        }

        const el = collectionQueue[currentCollectionIndex];
        el.classList.add('ns-collection-highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        showStatus(`Now Copy Message ${currentCollectionIndex + 1} of ${collectionQueue.length}`, 'info');
    }

    // This function is no longer an event handler, but a direct callback.
    async function advanceCollection() {
        if (!isCollecting) return;

        // A small delay to ensure the clipboard has been written to.
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const text = await navigator.clipboard.readText();
            const el = collectionQueue[currentCollectionIndex];
            const isAI = isAssistantMessage(el);

            collectedMessages.push(createMessageWithMetadata(isAI ? 'response' : 'prompt', text));
            
            currentCollectionIndex++;
            highlightNextMessage();

        } catch (err) {
            console.error('[Noosphere] Error reading clipboard during collection:', err);
            showStatus('❌ Error reading clipboard.', 'error');
            finishCollection();
        }
    }

    function finishCollection() {
        isCollecting = false;
        restoreCopyButtons(); // Restore the original functionality
        document.querySelectorAll('.ns-collection-highlight').forEach(el => {
            el.classList.remove('ns-collection-highlight');
        });
        showStatus(`✅ Collection complete! ${collectedMessages.length} messages saved.`, 'success');
    }

    // --- Button Hijacking Functions ---
    const hijackedButtons = new Map();

    function hijackCopyButtons() {
        collectionQueue.forEach(el => {
            const copyButton = el.querySelector(CONFIG.SELECTORS.copyBtn);
            if (copyButton) {
                // Store the original click event listener if it exists
                const originalOnClick = copyButton.onclick;
                hijackedButtons.set(copyButton, originalOnClick);

                // Override the click listener
                copyButton.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Call the original listener first to perform the copy
                    if (originalOnClick) {
                        originalOnClick.call(copyButton, e);
                    } else {
                        // If no onclick, we have to assume a different event mechanism.
                        // This is a fallback, but the onclick hijack is more reliable.
                        console.warn('[Noosphere] No original .onclick found. Relying on default behavior.');
                    }
                    
                    // Now, advance our collection process
                    advanceCollection();
                };
            }
        });
    }

    function restoreCopyButtons() {
        hijackedButtons.forEach((originalOnClick, button) => {
            button.onclick = originalOnClick;
        });
        hijackedButtons.clear();
    }

    /**
     * Get page title/metadata
     */
    function getPageMetadata() {
        const manualTitle = localStorage.getItem('noosphere_manual_title');
        let title = manualTitle || 'LeChat Conversation';

        return {
            title: title,
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
    function exportAsJSON() {
        // This function now uses the pre-collected messages.
        if (collectedMessages.length === 0) {
            showStatus('No messages collected yet. Click "Collect Messages" first.', 'error');
            return null;
        }
        const metadata = getPageMetadata();

        const formattedMessages = collectedMessages.map(msg => ({
            type: msg.type,
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
                version: 'LeChat Native Scraper v2.2',
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
     * Generate a formatted filename with custom name support
     */
    function generateFilename(conversationTitle, format = 'kebab-case', extension = 'md') {
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

        // Check for custom file name first
        const customName = localStorage.getItem('noosphere_custom_filename');
        if (customName) {
            // Use custom name with date suffix
            return `${customName}_${dateStr}.${extension}`;
        }

        const baseName = conversationTitle || 'LeChat_Chat';

        // Apply formatting
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

        return `${formattedName}_${dateStr}.${extension}`;
    }

    /**
     * Trigger file download
     */
    function downloadFile(content, filename, type = 'text/markdown') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        showStatus(`💾 Downloaded ${filename}`, 'success');
    }

    /**
     * Convert messages to Markdown format with Noosphere metadata markers
     */
    function exportAsMarkdown() {
        // This function now uses the pre-collected messages.
        if (collectedMessages.length === 0) {
            showStatus('No messages collected yet. Click "Collect Messages" first.', 'error');
            return null;
        }
        const metadata = getPageMetadata();
        const dateStr = new Date().toLocaleString();

        let userCount = collectedMessages.filter(m => m.type === 'prompt').length;
        let aiCount = collectedMessages.filter(m => m.type === 'response').length;
        let totalMessages = collectedMessages.length;
        let exchanges = Math.ceil(totalMessages / 2);

        let markdown = `---
> **🤖 Model:** ${metadata.model}
>
> **🌐 Date:** ${dateStr}
>
> **🌐 Source:** [${metadata.model} Chat](${metadata.sourceUrl})
>
> **🏷️ Tags:** ${metadata.tags.join(', ')}
>
> **📂 Artifacts:** [Internal](${metadata.sourceUrl})
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
>> **Total Artifacts:** 0
---

## Title:

> ${metadata.title}

---

`;

        collectedMessages.forEach((msg, index) => {
            if (msg.type === 'prompt') {
                markdown += `#### Prompt - User 👤:\n\n`;
            } else {
                markdown += `#### Response - LeChat 🤖:\n\n`;
            }
            
            markdown += `${msg.content}\n\n`;

            if (index < msgs.length - 1) {
                markdown += '---\n\n';
            }
        });

        markdown += `\n---\n\n###### Noosphere Reflect\n###### ***Meaning Through Memory***\n\n###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n`;

        return markdown;
    }

    /**
     * Copy to clipboard and show feedback
     */
    async function copyToClipboard(content, format = 'json', count) {
        if (content === null) return;
        try {
            await navigator.clipboard.writeText(content);
            showStatus(`✅ Copied ${count} messages as ${format.toUpperCase()}!`, 'success');
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
    /**
     * Inject custom styles for the Noosphere Console
     */
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

            @keyframes ns-pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }

            @keyframes ns-halo {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes ns-slide-up {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @keyframes ns-reveal {
                from { clip-path: circle(0% at bottom right); }
                to { clip-path: circle(150% at bottom right); }
            }

            .ns-orb {
                position: fixed;
                bottom: 25px;
                right: 25px;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, var(--ns-green), var(--ns-purple));
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 100000;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                border: 2px solid rgba(255, 255, 255, 0.2);
            }

            .ns-orb:hover {
                transform: scale(1.1) rotate(5deg);
                box-shadow: var(--ns-glow);
            }

            .ns-orb svg {
                width: 28px;
                height: 28px;
                fill: white;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            }

            .ns-orb::before {
                content: '';
                position: absolute;
                inset: -6px;
                border: 2px solid var(--ns-green);
                border-radius: 50%;
                opacity: 0.5;
                animation: ns-pulse 2s infinite;
            }

            .ns-console {
                position: fixed;
                bottom: 95px;
                right: 25px;
                width: 340px;
                background: var(--ns-bg);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border: 1px solid var(--ns-border);
                border-radius: 28px;
                z-index: 99999;
                overflow: hidden;
                display: none;
                flex-direction: column;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                color: white;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                animation: ns-reveal 0.5s ease-out;
            }

            .ns-console-header {
                padding: 24px 24px 16px;
                background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent);
            }

            .ns-console-title {
                font-size: 20px;
                font-weight: 800;
                letter-spacing: -0.02em;
                background: linear-gradient(to right, #fff, rgba(255,255,255,0.7));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 4px;
            }

            .ns-console-subtitle {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.5);
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.1em;
            }

            .ns-console-tabs {
                display: flex;
                padding: 0 16px;
                gap: 8px;
                margin-bottom: 16px;
            }

            .ns-tab {
                padding: 8px 16px;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                background: rgba(255, 255, 255, 0.05);
                color: rgba(255, 255, 255, 0.6);
                border: 1px solid transparent;
            }

            .ns-tab.active {
                background: rgba(16, 185, 129, 0.15);
                color: var(--ns-green);
                border: 1px solid rgba(16, 185, 129, 0.3);
            }

            .ns-console-content {
                padding: 0 20px 24px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .ns-btn {
                width: 100%;
                padding: 12px 18px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--ns-border);
                border-radius: 16px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.2s;
                animation: ns-slide-up 0.4s ease forwards;
            }

            .ns-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.2);
                transform: translateX(4px);
            }

            .ns-btn svg { width: 18px; height: 18px; opacity: 0.7; }

            .ns-btn-primary {
                background: linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
                border-color: rgba(16, 185, 129, 0.3);
                color: var(--ns-green);
            }

            .ns-btn-primary:hover {
                background: rgba(16, 185, 129, 0.25);
                border-color: var(--ns-green);
            }

            .ns-input-group {
                background: rgba(0, 0, 0, 0.2);
                padding: 16px;
                border-radius: 20px;
                border: 1px solid var(--ns-border);
            }

            .ns-label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: rgba(255, 255, 255, 0.4);
                margin-bottom: 8px;
                display: block;
            }

            .ns-input {
                width: 100%;
                background: transparent;
                border: none;
                color: white;
                font-size: 15px;
                outline: none;
                padding: 4px 0;
            }

            .ns-select {
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--ns-border);
                border-radius: 12px;
                color: white;
                padding: 10px;
                outline: none;
                font-size: 13px;
                /* Dark theme consistent styling */
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.7)' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 12px center;
                background-size: 12px;
                padding-right: 30px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .ns-select:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.2);
            }

            .ns-select:focus {
                background: rgba(255, 255, 255, 0.1);
                border-color: var(--ns-green);
                box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
            }

            /* Dropdown options styling */
            .ns-select option {
                background: var(--ns-bg);
                color: white;
                padding: 8px;
            }

            .ns-select option:hover {
                background: rgba(16, 185, 129, 0.15);
            }

            .ns-status {
                position: fixed;
                bottom: 30px;
                right: 100px;
                padding: 12px 24px;
                background: var(--ns-bg);
                backdrop-filter: blur(15px);
                border: 1px solid var(--ns-border);
                border-radius: 20px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                z-index: 100001;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: ns-slide-up 0.3s ease;
            }

            .ns-status::before {
                content: '';
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--status-color, var(--ns-green));
                box-shadow: 0 0 10px var(--status-color, var(--ns-green));
            }

            /* Checkbox Styles */
            .ns-checkbox-container {
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Positioning for bubble-relative checkboxes (User) */
            .ms-auto .ns-checkbox-container {
                position: absolute;
                top: 10px;
                left: -35px;
            }

            /* Positioning for icon-relative checkboxes (AI) */
            .flex-col .ns-checkbox-container {
                margin-bottom: 6px;
            }

            .ns-checkbox {
                appearance: none;
                width: 20px;
                height: 20px;
                border: 2px solid var(--ns-green);
                border-radius: 6px;
                cursor: pointer;
                background: rgba(0,0,0,0.3);
                transition: all 0.2s;
                position: relative;
            }

            .ns-checkbox:checked {
                background: var(--ns-green);
                box-shadow: 0 0 10px var(--ns-green);
            }

            .ns-checkbox:checked::after {
                content: '✓';
                position: absolute;
                color: white;
                font-size: 14px;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            .ns-message-selected {
                outline: 2px solid var(--ns-green) !important;
                background: rgba(16, 185, 129, 0.05) !important;
            }

            .ns-collection-highlight {
                outline: 3px dashed var(--ns-amber) !important;
                background: rgba(245, 158, 11, 0.1) !important;
                box-shadow: 0 0 25px rgba(245, 158, 11, 0.3);
            }

            .ns-bulk-controls {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
                margin-bottom: 12px;
            }

            .ns-bulk-btn {
                padding: 6px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--ns-border);
                border-radius: 8px;
                color: rgba(255, 255, 255, 0.7);
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s;
            }

            .ns-bulk-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Copy to clipboard and show feedback
     */
    async function copyToClipboard(content, format = 'json') {
        try {
            await navigator.clipboard.writeText(content);
            showStatus(`Copied session as ${format.toUpperCase()}`, 'success');
            return true;
        } catch (err) {
            showStatus('Copy failed', 'error');
            console.error('[Noosphere] Clipboard error:', err);
            return false;
        }
    }

    /**
     * Show premium status message
     */
    function showStatus(message, type = 'info') {
        let status = document.getElementById(CONFIG.COLLECTOR_ID);
        if (status) status.remove();

        status = document.createElement('div');
        status.id = CONFIG.COLLECTOR_ID;
        status.className = 'ns-status';
        status.textContent = message;

        const color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
        status.style.setProperty('--status-color', color);

        document.body.appendChild(status);

        setTimeout(() => {
            status.style.opacity = '0';
            status.style.transform = 'translateY(10px)';
            setTimeout(() => status.remove(), 300);
        }, 3000);
    }

    /**
     * Create the Noosphere Console UI
     */
    function createMenu() {
        injectStyles();

        const existingOrb = document.querySelector('.ns-orb');
        const existingConsole = document.querySelector('.ns-console');
        if (existingOrb) existingOrb.remove();
        if (existingConsole) existingConsole.remove();

        // Create Orb
        const orb = document.createElement('div');
        orb.className = 'ns-orb';
        orb.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2zm0,18c-3.31,0-6-2.69-6-6,0-1.01,.25-1.97,.7-2.8l1.46,1.46c-.11,.43-.16,.88-.16,1.34,0,2.21,1.79,4,4,4s4-1.79,4-4-1.79-4-4-4c-.46,0-.91,.05-1.34,.16l-1.46-1.46c.83-.45,1.79-.7,2.8-.7,3.31,0,6,2.69,6,6s-2.69,6-6,6z"/>
            </svg>
        `;
        document.body.appendChild(orb);

        // Create Console
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
                <div style="padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 16px; font-size: 12px; line-height: 1.4; color: rgba(255,255,255,0.7); margin-bottom: 8px;">
                    ⚡ <b>Neural Sync:</b> Use checkboxes to select messages manually, or click any native "Copy" button to auto-select.
                </div>
                <div style="font-size: 11px; text-align: center; opacity: 0.6; padding: 4px 0; margin-bottom: 4px;">
                    📋 Clipboard access will be requested on first export.
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button class="ns-btn" id="ns-copy-md">Copy MD</button>
                    <button class="ns-btn" id="ns-copy-json">Copy JSON</button>
                </div>
                <button class="ns-btn ns-btn-primary" id="ns-start-collection">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15V3m0 12l-4-4m4 4l4-4M3 17h18a2 2 0 0 1 2 2v2H1v-2a2 2 0 0 1 2-2z"/></svg>
                    Start Guided Collection
                </button>
                <button class="ns-btn" id="ns-dl-md" style="margin-top: 8px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    Download .MD
                </button>
                <button class="ns-btn" id="ns-help" style="opacity: 0.5; margin-top: 8px; justify-content: center; border: none;">
                    Documentation & Help
                </button>
            </div>
            <div class="ns-console-content" id="ns-pane-config" style="display: none;">
                <div class="ns-input-group">
                    <span class="ns-label">Chat Title</span>
                    <input type="text" class="ns-input" id="ns-manual-title" placeholder="e.g. Brainstorming Session">
                </div>
                <div class="ns-input-group">
                    <span class="ns-label">Filename Prefix</span>
                    <input type="text" class="ns-input" id="ns-custom-name" placeholder="LeChat_Export">
                </div>
                <div style="padding: 0 4px;">
                    <span class="ns-label">Naming Segment</span>
                    <select class="ns-select" id="ns-naming">
                        <option value="kebab-case">kebab-case</option>
                        <option value="snake_case">snake_case</option>
                        <option value="PascalCase">PascalCase</option>
                        <option value="camelCase">camelCase</option>
                    </select>
                </div>
                <div style="font-size: 11px; opacity: 0.4; line-height: 1.4; padding: 4px;">
                    Neural markers: ## Prompt, ## Response. Standardized for Noosphere Reflect v2.2.
                </div>
            </div>
        `;
        document.body.appendChild(consoleEl);

        // Toggle Logic
        orb.onclick = () => {
            const isVisible = consoleEl.style.display === 'flex';
            consoleEl.style.display = isVisible ? 'none' : 'flex';
            orb.style.transform = isVisible ? 'scale(1)' : 'scale(0.9) rotate(-15deg)';
            orb.style.background = isVisible ? '' : 'linear-gradient(135deg, var(--ns-purple), var(--ns-green))';
        };

        // Tab Logic
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

        // Setup Manual Title
        const titleInput = document.getElementById('ns-manual-title');
        titleInput.value = localStorage.getItem('noosphere_manual_title') || '';
        titleInput.oninput = () => localStorage.setItem('noosphere_manual_title', titleInput.value.trim());

        // Setup Custom Name
        const nameInput = document.getElementById('ns-custom-name');
        nameInput.value = localStorage.getItem('noosphere_custom_filename') || '';
        nameInput.oninput = () => localStorage.setItem('noosphere_custom_filename', nameInput.value.trim());

        // Event Handlers (ns-collect removed per request - purely button-driven now)

        // Enhanced Bulk Selection with comprehensive debugging
        const setupBulkSelection = () => {
            console.log('[Noosphere] Setting up bulk selection buttons...');
            
            // Find buttons with detailed logging
            const allBtn = document.getElementById('ns-select-all');
            const userBtn = document.getElementById('ns-select-user');
            const aiBtn = document.getElementById('ns-select-ai');
            const noneBtn = document.getElementById('ns-select-none');
            
            console.log('[Noosphere] Button elements found:');
            console.log('- All button:', allBtn);
            console.log('- User button:', userBtn);
            console.log('- AI button:', aiBtn);
            console.log('- None button:', noneBtn);
            
            if (!allBtn || !userBtn || !aiBtn || !noneBtn) {
                console.error('[Noosphere] ❌ BULK SELECTION BUTTONS NOT FOUND!');
                console.error('[Noosphere] This may be a timing issue - DOM not ready when setup was called');
                return false;
            }
            
            // Test basic click functionality first
            const testClick = (btn, type) => {
                console.log(`[Noosphere] Testing ${type} button click...`);
                try {
                    bulkSelect(type);
                    console.log(`[Noosphere] ✅ ${type} button click successful`);
                } catch (error) {
                    console.error(`[Noosphere] ❌ ${type} button error:`, error);
                }
            };
            
            // Enhanced bulk selection with detailed logging
            const bulkSelect = (type) => {
                console.log(`[Noosphere] === BULK SELECT ${type.toUpperCase()} ===`);
                console.log(`[Noosphere] Bulk selection triggered: ${type}`);
                
                const messages = document.querySelectorAll(CONFIG.SELECTORS.message);
                console.log(`[Noosphere] Found ${messages.length} total messages`);
                
                let processedCount = 0;
                let checkedCount = 0;
                let skippedCount = 0;

                messages.forEach((msg, index) => {
                    console.log(`[Noosphere] Processing message ${index + 1}/${messages.length}`);
                    const cb = msg.querySelector('.ns-checkbox');
                    
                    if (!cb) {
                        console.log(`[Noosphere] Message ${index + 1}: No checkbox found`);
                        skippedCount++;
                        return;
                    }

                    const isAI = isAssistantMessage(msg);
                    const isUser = !isAI;
                    
                    console.log(`[Noosphere] Message ${index + 1}: isAI=${isAI}, isUser=${isUser}`);

                    let state = false;
                    if (type === 'all') state = true;
                    if (type === 'user' && isUser) state = true;
                    if (type === 'ai' && isAI) state = true;
                    if (type === 'none') state = false;

                    console.log(`[Noosphere] Message ${index + 1}: Setting checkbox to ${state}`);

                    cb.checked = state;
                    if (state) {
                        msg.classList.add('ns-message-selected');
                        checkedCount++;
                        console.log(`[Noosphere] Message ${index + 1}: ✅ Selected`);
                    } else {
                        msg.classList.remove('ns-message-selected');
                        console.log(`[Noosphere] Message ${index + 1}: ❌ Deselected`);
                    }
                    processedCount++;
                });

                const finalCount = syncFromSelection().length;
                console.log(`[Noosphere] Bulk ${type} summary:`);
                console.log(`  - Total messages: ${messages.length}`);
                console.log(`  - Processed: ${processedCount}`);
                console.log(`  - Skipped (no checkbox): ${skippedCount}`);
                console.log(`  - Checked: ${checkedCount}`);
                console.log(`  - Final selection count: ${finalCount}`);
                
                let statusMessage = '';
                switch(type) {
                    case 'all': statusMessage = `✅ Selected all ${finalCount} messages`; break;
                    case 'user': statusMessage = `✅ Selected ${finalCount} user messages`; break;
                    case 'ai': statusMessage = `✅ Selected ${finalCount} AI messages`; break;
                    case 'none': statusMessage = `✅ Cleared selection (0 messages)`; break;
                }
                showStatus(statusMessage, 'success');
                
                console.log(`[Noosphere] === BULK SELECT ${type.toUpperCase()} COMPLETE ===`);
            };
            
            // Attach event handlers with error handling
            try {
                allBtn.onclick = (e) => {
                    console.log('[Noosphere] All button clicked!');
                    bulkSelect('all');
                };
                
                userBtn.onclick = (e) => {
                    console.log('[Noosphere] User button clicked!');
                    bulkSelect('user');
                };
                
                aiBtn.onclick = (e) => {
                    console.log('[Noosphere] AI button clicked!');
                    bulkSelect('ai');
                };
                
                noneBtn.onclick = (e) => {
                    console.log('[Noosphere] None button clicked!');
                    bulkSelect('none');
                };
                
                console.log('[Noosphere] ✅ Bulk selection buttons successfully attached!');
                
                // Test one button to verify functionality
                setTimeout(() => {
                    console.log('[Noosphere] Testing bulk selection with "all"...');
                    bulkSelect('all');
                }, 1000);
                
                return true;
                
            } catch (error) {
                console.error('[Noosphere] ❌ Error attaching bulk selection handlers:', error);
                return false;
            }
        };

        // Try to setup bulk selection, with retry if DOM not ready
        let setupSuccess = setupBulkSelection();
        if (!setupSuccess) {
            console.warn('[Noosphere] Initial setup failed, retrying in 2 seconds...');
            setTimeout(() => {
                console.log('[Noosphere] Retrying bulk selection setup...');
                setupBulkSelection();
            }, 2000);
        }

        document.getElementById('ns-start-collection').onclick = startCollection;

        document.getElementById('ns-copy-md').onclick = () => {
            const md = exportAsMarkdown();
            if (md) copyToClipboard(md, 'md', collectedMessages.length);
        };
        document.getElementById('ns-copy-json').onclick = () => {
            const json = exportAsJSON();
            if (json) copyToClipboard(json, 'json', collectedMessages.length);
        };

        document.getElementById('ns-dl-md').onclick = () => {
            const md = exportAsMarkdown();
            if (md) {
                const metadata = getPageMetadata();
                const naming = document.getElementById('ns-naming').value;
                const filename = generateFilename(metadata.title, naming, 'md');
                downloadFile(md, filename, 'text/markdown');
            }
        };

        document.getElementById('ns-help').onclick = () => {
            alert(`Noosphere Reflect - ${CONFIG.PLATFORM_NAME} Scraper v2.2.1\n\nNeural Selection enabled. Click native copy buttons or use checkboxes to refine your export.\n\nShortcuts:\nCtrl+Shift+M: Copy MD\nCtrl+Shift+E: Copy JSON`);
        };
    }

    /**
     * Intercept native copy buttons
     */
    function interceptNativeCopyButtons() {
        document.addEventListener('click', function (e) {
            const target = e.target.closest('button');
            if (!target) return;

            if (target.matches(CONFIG.SELECTORS.copyBtn) || target.closest(CONFIG.SELECTORS.copyBtn)) {
                // Find the highest relevant container (the wrapper) to ensure we find the correct checkbox
                let anchor = target.closest('[data-message-id], .group/message') || target.closest(CONFIG.SELECTORS.message);

                if (anchor) {
                    // Skip sidebar and navigation elements
                    if (anchor.closest('[data-sidebar], .sidebar, aside, nav')) return;

                    // Auto-select via checkbox - look for the bubble checkbox within this message block
                    const cb = anchor.querySelector('.ns-checkbox') || anchor.classList.contains('ns-checkbox') && anchor;
                    if (cb) {
                        cb.checked = true;
                        const bubble = cb.closest(CONFIG.SELECTORS.message);
                        if (bubble) bubble.classList.add('ns-message-selected');
                    }

                    const count = syncFromSelection().length;
                    showStatus(`Segment Captured (${count} total)`, 'info');
                    console.log('[Noosphere] Neural intercept successful');
                }
            }
        }, true);
    }

    /**
     * Inject checkboxes into all messages - STRICTLY only 2 locations
     */
    function injectCheckboxes() {
        // 1. AI messages: ONLY beside the AI icon in the main container
        const aiMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
        aiMessages.forEach(aiMsg => {
            if (aiMsg.closest('[data-sidebar], .sidebar, aside, nav')) return;
            
            // Find the main icon container (the one with .relative.flex.flex-col.items-center.gap-4)
            const mainIconContainer = aiMsg.querySelector('.relative.flex.flex-col.items-center.gap-4');
            if (!mainIconContainer) return;
            
            // Skip if checkbox already exists
            if (mainIconContainer.querySelector('.ns-checkbox-container')) return;
            
            // Verify this container has the AI icon with the specific path
            const aiIcon = mainIconContainer.querySelector('path[d="M13.3715 16.358H16.1144V13.6486H13.3712L13.3715 16.358H10.6283V13.6486H7.88568V16.358H10.6283V19.0676H2.3999V16.358H5.14279V5.52002H7.88568V8.22963H10.6286V10.939H13.3715V8.22963H16.1144V5.52002H18.8572V16.358H21.5999V19.0676H13.3715V16.358Z"]');
            if (!aiIcon) return;

            const container = document.createElement('div');
            container.className = 'ns-checkbox-container';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'ns-checkbox';
            cb.onclick = (e) => {
                e.stopPropagation();
                const bubble = aiMsg.querySelector('div.me-auto');
                if (cb.checked) bubble?.classList.add('ns-message-selected');
                else bubble?.classList.remove('ns-message-selected');
                showStatus(`Syncing: ${syncFromSelection().length} selected`, 'info');
            };

            container.appendChild(cb);
            mainIconContainer.prepend(container);
        });

        // 2. User messages: ONLY in div.ms-auto with the specific structure
        const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
        userMessages.forEach(userMsg => {
            if (userMsg.closest('[data-sidebar], .sidebar, aside, nav')) return;
            
            // Find the message bubble (div.ms-auto)
            const userBubble = userMsg.querySelector('div.ms-auto');
            if (!userBubble) return;
            
            // Skip if checkbox already exists
            if (userBubble.querySelector('.ns-checkbox-container')) return;
            
            // Skip metadata logs
            if (userBubble.classList.contains('min-h-8')) return;

            // Ensure it has the expected structure (flex container with specific classes)
            const hasExpectedStructure = userBubble.classList.contains('flex') &&
                                       userBubble.classList.contains('w-fit') &&
                                       userBubble.classList.contains('max-w-full');
            if (!hasExpectedStructure) return;

            userBubble.style.position = 'relative';

            const container = document.createElement('div');
            container.className = 'ns-checkbox-container';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'ns-checkbox';
            cb.onclick = (e) => {
                e.stopPropagation();
                if (cb.checked) userBubble.classList.add('ns-message-selected');
                else userBubble.classList.remove('ns-message-selected');
                showStatus(`Syncing: ${syncFromSelection().length} selected`, 'info');
            };

            container.appendChild(cb);
            userBubble.prepend(container);
        });
    }

    /**
     * Setup MutationObserver for new messages
     */
    function setupObserver() {
        const observer = new MutationObserver(() => {
            injectCheckboxes();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Initialize scraper
     */
    function init() {
        console.log(`[Noosphere] Neural Interface Initializing on ${CONFIG.PLATFORM_NAME}`);
        createMenu();
        injectCheckboxes();
        setupObserver();
        interceptNativeCopyButtons();

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') { // JSON
                e.preventDefault();
                document.getElementById('ns-copy-json').click();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'M') { // Markdown
                e.preventDefault();
                document.getElementById('ns-copy-md').click();
            }
        });

        showStatus('Neural Interface Ready', 'success');
    }

    // Start!
    init();

})();
