/**
 * Noosphere Reflect - ChatGPT Scraper
 * 
 * Instructions:
 * 1. Open a chat in ChatGPT (chatgpt.com).
 * 2. Open Developer Tools (F12).
 * 3. Paste script into Console.
 * 4. Click "Copy Chat JSON".
 */

(function() {
    'use strict';

    const CONFIG = {
        BUTTON_ID: 'noosphere-copy-btn',
        SELECTORS: {
            TURN: '[data-testid^="conversation-turn-"]',
            USER_MSG: '[data-message-author-role="user"]',
            AI_MSG: '[data-message-author-role="assistant"]',
            TITLE: 'title'
        }
    };

    function extractChatData() {
        const messages = [];
        const turns = document.querySelectorAll(CONFIG.SELECTORS.TURN);

        turns.forEach(turn => {
            // Check for User
            const userEl = turn.querySelector(CONFIG.SELECTORS.USER_MSG);
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

            // Check for AI
            const aiEl = turn.querySelector(CONFIG.SELECTORS.AI_MSG);
            if (aiEl) {
                // ChatGPT sometimes puts the text in specific inner containers, but innerText usually grabs it all.
                // We might want to exclude "regenerate" buttons text if they appear.
                const text = aiEl.innerText || aiEl.textContent;
                if (text.trim()) {
                    messages.push({
                        type: 'response',
                        content: text.trim(),
                        isEdited: false
                    });
                }
            }
        });

        const title = document.title.replace('ChatGPT', '').trim();

        return {
            messages: messages,
            metadata: {
                title: title || 'ChatGPT Export',
                model: 'ChatGPT',
                date: new Date().toISOString(),
                tags: ['chatgpt', 'export'],
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
            
            const chatData = extractChatData();
            
            if (chatData.messages.length === 0) {
                throw new Error('No messages found. Try scrolling up.');
            }

            const jsonString = JSON.stringify(chatData, null, 2);
            await navigator.clipboard.writeText(jsonString);

            btn.textContent = '✅ Copied!';
            btn.style.background = '#10a37f'; // ChatGPT Green
            console.log(`[Noosphere] Copied ${chatData.messages.length} messages.`);

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#8b5cf6';
            }, 3000);

        } catch (err) {
            console.error('[Noosphere] Export failed:', err);
            btn.textContent = '❌ Error';
            alert(err.message);
        } finally {
            btn.style.cursor = 'pointer';
        }
    }

    function createButton() {
        const existing = document.getElementById(CONFIG.BUTTON_ID);
        if (existing) existing.remove();

        const btn = document.createElement('button');
        btn.id = CONFIG.BUTTON_ID;
        btn.textContent = 'Copy Chat JSON';
        
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '99999',
            padding: '12px 20px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
        });

        btn.onclick = copyToClipboard;
        document.body.appendChild(btn);
    }

    createButton();

})();
