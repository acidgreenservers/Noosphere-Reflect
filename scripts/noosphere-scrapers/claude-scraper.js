/**
 * Noosphere Reflect - Claude Scraper
 * 
 * Instructions:
 * 1. Open a chat in Claude (claude.ai).
 * 2. Open Developer Tools (F12 or Ctrl+Shift+I).
 * 3. Paste this entire script into the Console and press Enter.
 * 4. A "Copy Chat JSON" button will appear.
 */

(function() {
    'use strict';

    const CONFIG = {
        BUTTON_ID: 'noosphere-copy-btn',
        SELECTORS: {
            // Claude Selectors (Jan 2026)
            // Use broader selectors to catch containers
            TURN_CONTAINER: '.flex.flex-col.gap-2', // Generic wrapper often used
            USER_MSG: '.font-user-message, [data-testid="user-message"]',
            AI_MSG: '.font-claude-message, [data-testid="claude-message"]',
            TITLE: 'title'
        }
    };

    function extractChatData() {
        const messages = [];
        
        // Claude DOM is often a flat list or groups. 
        // Best strategy: Select ALL message nodes in order.
        
        const allNodes = Array.from(document.querySelectorAll(`${CONFIG.SELECTORS.USER_MSG}, ${CONFIG.SELECTORS.AI_MSG}`));

        allNodes.forEach(node => {
            const isUser = node.matches(CONFIG.SELECTORS.USER_MSG);
            const text = node.innerText || node.textContent;
            
            if (text.trim()) {
                messages.push({
                    type: isUser ? 'prompt' : 'response',
                    content: text.trim(),
                    isEdited: false
                });
            }
        });

        const title = document.title.replace(' - Claude', '').trim();

        return {
            messages: messages,
            metadata: {
                title: title || 'Claude Export',
                model: 'Claude',
                date: new Date().toISOString(),
                tags: ['claude', 'export'],
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
                throw new Error('No messages found. Ensure chat is loaded.');
            }

            const jsonString = JSON.stringify(chatData, null, 2);
            await navigator.clipboard.writeText(jsonString);

            btn.textContent = '✅ Copied!';
            btn.style.background = '#d97757'; // Claude Orange-ish
            console.log(`[Noosphere] Copied ${chatData.messages.length} messages.`);

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#8b5cf6'; // Back to Purple
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
