/**
 * Noosphere Reflect - Gemini Scraper
 * 
 * Instructions:
 * 1. Open a chat in Gemini (gemini.google.com).
 * 2. Open Developer Tools (F12 or Ctrl+Shift+I).
 * 3. Paste this entire script into the Console and press Enter.
 * 4. A "Copy Chat JSON" button will appear in the bottom-right corner.
 * 5. Click it to copy the chat history to your clipboard.
 * 6. Paste the JSON into Noosphere Reflect's "Basic Converter" (Batch Import or Paste)
 */

(function() {
    'use strict';

    const CONFIG = {
        BUTTON_ID: 'noosphere-copy-btn',
        SELECTORS: {
            // Updated Gemini Selectors (Jan 2026)
            TURN_CONTAINER: '.conversation-container',
            USER_QUERY: '.user-query .query-text, [data-test-id="user-query"]',
            MODEL_RESPONSE: '.model-response .message-content, [data-test-id="model-response"]',
            THOUGHT_CONTAINER: '.model-thoughts, .thoughts-container',
            TITLE: '.conversation-title, title'
        }
    };

    // --- core logic ---

    function extractChatData() {
        const messages = [];
        const turns = document.querySelectorAll(CONFIG.SELECTORS.TURN_CONTAINER);

        turns.forEach(turn => {
            // 1. User Message
            const userEl = turn.querySelector(CONFIG.SELECTORS.USER_QUERY);
            if (userEl) {
                const text = userEl.innerText || userEl.textContent;
                if (text.trim()) {
                    messages.push({
                        type: 'prompt',
                        content: text.trim(),
                        isEdited: false
                    });
                }
            }

            // 2. Model Message (Response + Thoughts)
            const modelEl = turn.querySelector(CONFIG.SELECTORS.MODEL_RESPONSE);
            const thoughtEl = turn.querySelector(CONFIG.SELECTORS.THOUGHT_CONTAINER);
            
            if (modelEl || thoughtEl) {
                let fullContent = '';

                // Handle Thoughts
                if (thoughtEl) {
                    const thoughtText = thoughtEl.innerText || thoughtEl.textContent;
                    if (thoughtText.trim()) {
                        fullContent += `<thought>\n${thoughtText.trim()}\n</thought>\n\n`;
                    }
                }

                // Handle Response
                if (modelEl) {
                    const responseText = modelEl.innerText || modelEl.textContent;
                    if (responseText.trim()) {
                        fullContent += responseText.trim();
                    }
                }

                if (fullContent.trim()) {
                    messages.push({
                        type: 'response',
                        content: fullContent.trim(),
                        isEdited: false
                    });
                }
            }
        });

        // Metadata
        const titleEl = document.querySelector(CONFIG.SELECTORS.TITLE);
        const title = titleEl ? titleEl.innerText.trim() : document.title.replace(' - Gemini', '').trim();

        return {
            messages: messages,
            metadata: {
                title: title || 'Gemini Export',
                model: 'Gemini', // Default assumption
                date: new Date().toISOString(),
                tags: ['gemini', 'export'],
                sourceUrl: window.location.href
            },
            exportedBy: {
                tool: 'Noosphere Reflect',
                version: 'Manual Scraper v1.0'
            }
        };
    }

    async function copyToClipboard() {
        const btn = document.getElementById(CONFIG.BUTTON_ID);
        const originalText = btn.textContent;
        
        try {
            btn.textContent = '⏳ Scrapping...';
            btn.style.cursor = 'wait';

            // Scroll to bottom to ensure lazy-loaded messages are rendered? 
            // Actually, manual scrapers rely on what's DOM-present. 
            // Basic version: scrape what you see.
            
            const chatData = extractChatData();
            
            if (chatData.messages.length === 0) {
                throw new Error('No messages found. Scroll up to load history if needed.');
            }

            const jsonString = JSON.stringify(chatData, null, 2);
            await navigator.clipboard.writeText(jsonString);

            btn.textContent = '✅ Copied!';
            btn.style.background = '#10b981'; // Green
            console.log(`[Noosphere] Copied ${chatData.messages.length} messages.`);

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#8b5cf6'; // Purple
            }, 3000);

        } catch (err) {
            console.error('[Noosphere] Export failed:', err);
            btn.textContent = '❌ Error';
            btn.style.background = '#ef4444'; // Red
            alert('Failed to export: ' + err.message);
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#8b5cf6';
            }, 3000);
        } finally {
            btn.style.cursor = 'pointer';
        }
    }

    // --- ui injection ---

    function createButton() {
        // Remove existing button if any
        const existing = document.getElementById(CONFIG.BUTTON_ID);
        if (existing) existing.remove();

        const btn = document.createElement('button');
        btn.id = CONFIG.BUTTON_ID;
        btn.textContent = 'Copy Chat JSON';
        
        // Noosphere Purple Styling
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '99999',
            padding: '12px 20px',
            background: '#8b5cf6', // Violet-500
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
        });

        btn.onmouseover = () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
        };
        btn.onmouseout = () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
        };

        btn.onclick = copyToClipboard;
        document.body.appendChild(btn);
        
        console.log('[Noosphere] Gemini Scraper loaded. Button injected.');
    }

    // Initialize
    createButton();

})();
