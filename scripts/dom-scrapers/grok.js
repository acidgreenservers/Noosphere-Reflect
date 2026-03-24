/**
 * Grok Chat Exporter - Grok content script
 * Exports Grok chat conversations to Markdown with thinking process preservation
 */

(function () {
    'use strict';

    // ============================================================================
    // CONSTANTS
    // ============================================================================
    const CONFIG = {
        BUTTON_ID: 'grok-export-btn',
        DROPDOWN_ID: 'grok-export-dropdown',
        FILENAME_INPUT_ID: 'grok-filename-input',
        SELECT_DROPDOWN_ID: 'grok-select-dropdown',
        CHECKBOX_CLASS: 'grok-export-checkbox',
        EXPORT_MODE_NAME: 'grok-export-mode',
        NAMING_FORMAT_ID: 'grok-naming-format',

        SELECTORS: {
            // Response content (both user and Grok use same class)
            RESPONSE_CONTENT: '.response-content-markdown',

            // User prompts - identified by context (first in message group or has user avatar)
            USER_MESSAGE: '.response-content-markdown',

            // Grok response - contains thought tags
            GROK_RESPONSE: '.response-content-markdown',

            // Code blocks
            CODE_BLOCK: '[data-testid="code-block"]',
            CODE_LANGUAGE: '.font-mono.text-xs',
            CODE_CONTENT: 'pre code',

            // Tables
            TABLE: 'table',

            // Images
            IMAGE: 'img.object-cover',

            // Copy button
            COPY_BUTTON: 'button[aria-label="Copy"]',

            // Title (from page title)
            CONVERSATION_TITLE: 'title'
        },

        TIMING: {
            SCROLL_DELAY: 2000,
            CLIPBOARD_CLEAR_DELAY: 200,
            CLIPBOARD_READ_DELAY: 300,
            MOUSEOVER_DELAY: 500,
            POPUP_DURATION: 900,
            MAX_SCROLL_ATTEMPTS: 60,
            MAX_STABLE_SCROLLS: 4,
            MAX_CLIPBOARD_ATTEMPTS: 10
        },

        STYLES: {
            BUTTON_PRIMARY: '#1a1a1a', // Grok dark
            BUTTON_HOVER: '#333333',
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
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
                transition: 'opacity 0.3s ease'
            });
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, CONFIG.TIMING.POPUP_DURATION);
        },

        // Grok specific: Extract thinking content from text containing <thought> tags
        extractThinking(text) {
            const thoughtMatch = text.match(/<thought>([\s\S]*?)<\/thought>/);
            if (thoughtMatch) {
                return {
                    thinking: thoughtMatch[1].trim(),
                    response: text.replace(/<thought>[\s\S]*?<\/thought>/, '').trim()
                };
            }
            return { thinking: null, response: text };
        }
    };

    // ============================================================================
    // CHECKBOX MANAGER
    // ============================================================================
    const CheckboxManager = {
        createCheckbox(type, container) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = CONFIG.CHECKBOX_CLASS;
            checkbox.checked = true;
            checkbox.dataset.type = type;
            Object.assign(checkbox.style, {
                cursor: 'pointer',
                width: '18px',
                height: '18px',
                position: 'absolute',
                left: '-25px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: '100'
            });
            container.style.position = 'relative';
            container.appendChild(checkbox);
            return checkbox;
        },

        injectCheckboxes() {
            const messages = document.querySelectorAll(CONFIG.SELECTORS.RESPONSE_CONTENT);
            messages.forEach((msg, index) => {
                if (msg.querySelector(`.${CONFIG.CHECKBOX_CLASS}`)) return;

                // Determine if user or assistant based on content
                const text = msg.textContent || '';
                const hasThought = text.includes('<thought>') || text.includes('</thought>');
                const type = hasThought ? 'assistant' : (index % 2 === 0 ? 'user' : 'assistant');

                this.createCheckbox(type, msg);
            });
        },

        removeAll() {
            document.querySelectorAll(`.${CONFIG.CHECKBOX_CLASS}`).forEach(cb => cb.remove());
        },

        hasAnyChecked() {
            return [...document.querySelectorAll(`.${CONFIG.CHECKBOX_CLASS}`)].some(cb => cb.checked);
        }
    };

    // ============================================================================
    // SELECTION MANAGER
    // ============================================================================
    const SelectionManager = {
        lastSelection: 'all',

        applySelection(value) {
            this.lastSelection = value;
            const checkboxes = document.querySelectorAll(`.${CONFIG.CHECKBOX_CLASS}`);
            checkboxes.forEach(cb => {
                switch (value) {
                    case 'all':
                        cb.checked = true;
                        break;
                    case 'none':
                        cb.checked = false;
                        break;
                    case 'user':
                        cb.checked = cb.dataset.type === 'user';
                        break;
                    case 'assistant':
                        cb.checked = cb.dataset.type === 'assistant';
                        break;
                }
            });
        },

        reset() {
            const dropdown = document.getElementById(CONFIG.SELECT_DROPDOWN_ID);
            if (dropdown) dropdown.value = 'all';
            this.lastSelection = 'all';
        },

        reapplyIfNeeded() {
            if (this.lastSelection !== 'all') {
                this.applySelection(this.lastSelection);
            }
        }
    };

    // ============================================================================
    // UI BUILDER
    // ============================================================================
    const UIBuilder = {
        getInputStyles(isDark) {
            return `padding: 8px; border-radius: 6px; border: 1px solid ${isDark ? CONFIG.STYLES.DARK_BORDER : CONFIG.STYLES.LIGHT_BORDER}; 
              background: ${isDark ? CONFIG.STYLES.DARK_BG : CONFIG.STYLES.LIGHT_BG}; 
              color: ${isDark ? CONFIG.STYLES.DARK_TEXT : CONFIG.STYLES.LIGHT_TEXT}; font-size: 14px;`;
        },

        createDropdownHTML() {
            const isDark = Utils.isDarkMode();
            const inputStyles = this.getInputStyles(isDark);

            return `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <label style="display: flex; align-items: center; gap: 8px;">
            <span style="min-width: 70px; font-size: 13px;">Filename:</span>
            <input type="text" id="${CONFIG.FILENAME_INPUT_ID}" placeholder="custom_filename" 
                   style="${inputStyles} flex: 1;" />
          </label>
          
          <label style="display: flex; align-items: center; gap: 8px;">
            <span style="min-width: 70px; font-size: 13px;">Select:</span>
            <select id="${CONFIG.SELECT_DROPDOWN_ID}" style="${inputStyles} flex: 1;">
              <option value="all">All Messages</option>
              <option value="none">None</option>
              <option value="user">User Only</option>
              <option value="assistant">Grok Only</option>
            </select>
          </label>
          
          <label style="display: flex; align-items: center; gap: 8px;">
            <span style="min-width: 70px; font-size: 13px;">Format:</span>
            <select id="${CONFIG.NAMING_FORMAT_ID}" style="${inputStyles} flex: 1;">
              <option value="kebab-case">kebab-case</option>
              <option value="Kebab-Case">Kebab-Case</option>
              <option value="snake_case">snake_case</option>
              <option value="Snake_Case">Snake_Case</option>
              <option value="PascalCase">PascalCase</option>
              <option value="camelCase">camelCase</option>
            </select>
          </label>

          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 5px;">
            <label style="font-size: 13px; display: flex; align-items: center; gap: 4px;">
              <input type="radio" name="${CONFIG.EXPORT_MODE_NAME}" value="clipboard" checked /> Clipboard
            </label>
            <label style="font-size: 13px; display: flex; align-items: center; gap: 4px;">
              <input type="radio" name="${CONFIG.EXPORT_MODE_NAME}" value="file" /> File
            </label>
          </div>
          
          <button id="grok-export-run" style="background: ${CONFIG.STYLES.BUTTON_PRIMARY}; color: white; 
                  border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; 
                  margin-top: 5px;">
            Export
          </button>
        </div>
      `;
        },

        createButton() {
            const button = document.createElement('button');
            button.id = CONFIG.BUTTON_ID;
            button.innerHTML = '📋 Export';
            Object.assign(button.style, {
                position: 'fixed',
                top: '10px',
                right: '10px',
                zIndex: '9999',
                background: CONFIG.STYLES.BUTTON_PRIMARY,
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'background 0.2s'
            });
            button.addEventListener('mouseenter', () => button.style.background = CONFIG.STYLES.BUTTON_HOVER);
            button.addEventListener('mouseleave', () => button.style.background = CONFIG.STYLES.BUTTON_PRIMARY);
            return button;
        },

        createDropdown() {
            const isDark = Utils.isDarkMode();
            const dropdown = document.createElement('div');
            dropdown.id = CONFIG.DROPDOWN_ID;
            Object.assign(dropdown.style, {
                position: 'fixed',
                top: '50px',
                right: '10px',
                zIndex: '9998',
                background: isDark ? CONFIG.STYLES.DARK_BG : CONFIG.STYLES.LIGHT_BG,
                color: isDark ? CONFIG.STYLES.DARK_TEXT : CONFIG.STYLES.LIGHT_TEXT,
                border: `1px solid ${isDark ? CONFIG.STYLES.DARK_BORDER : CONFIG.STYLES.LIGHT_BORDER}`,
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                display: 'none',
                minWidth: '280px'
            });
            dropdown.innerHTML = this.createDropdownHTML();
            return dropdown;
        }
    };

    // ============================================================================
    // EXPORT SERVICE
    // ============================================================================
    const ExportService = {
        getConversationTitle() {
            // Grok uses page title
            const title = document.title || 'Grok_Chat';
            return title.replace(' - Grok', '').trim();
        },

        generateFilename(customFilename, conversationTitle, format = 'kebab-case') {
            const dateStr = Utils.getDateString();
            const baseName = customFilename?.trim() || conversationTitle;

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

            return `${formattedName}_${dateStr}.md`;
        },

        buildMarkdown(messages, conversationTitle) {
            const now = new Date();
            const dateStr = now.toLocaleString();
            const sourceUrl = window.location.href;

            let userCount = 0;
            let aiCount = 0;
            let selectedMessages = [];

            messages.forEach((msg, index) => {
                const checkbox = msg.querySelector(`.${CONFIG.CHECKBOX_CLASS}`);
                if (checkbox && !checkbox.checked) return;

                selectedMessages.push(msg);
                const text = msg.textContent || '';
                const hasThought = text.includes('<thought>') || text.includes('</thought>');
                const type = hasThought ? 'assistant' : (index % 2 === 0 ? 'user' : 'assistant');

                if (type === 'user') userCount++;
                else aiCount++;
            });

            const totalMessages = userCount + aiCount;
            const exchanges = selectedMessages.length;

            let markdown = `---
> **🤖 Model:** Grok
>
> **🌐 Date:** ${dateStr}
>
> **🌐 Source:** [Grok Chat](${sourceUrl})
>
> **🏷️ Tags:** Grok, AI-Chat, Noosphere
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
>> **Total Artifacts:** 0
---

## Title:

> ${conversationTitle}

--- 

`;

            selectedMessages.forEach((msg, index) => {
                const text = msg.textContent.trim();
                const { thinking, response } = Utils.extractThinking(text);
                const checkbox = msg.querySelector(`.${CONFIG.CHECKBOX_CLASS}`);
                const isAssistant = thinking !== null || checkbox?.dataset.type === 'assistant';

                if (isAssistant) {
                    markdown += `#### Response - Model 🤖:\n\n`;

                    if (thinking) {
                        markdown += "```\nThoughts:\n";
                        markdown += `${thinking}\n`;
                        markdown += "```\n\n";
                    }

                    markdown += `${response}\n\n`;
                } else {
                    markdown += `#### Prompt - User 👤:\n\n`;
                    markdown += `${response}\n\n`;
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

        exportToClipboard(markdown) {
            navigator.clipboard.writeText(markdown).then(() => {
                Utils.createNotification('✅ Copied to clipboard!');
            }).catch(err => {
                console.error('Clipboard error:', err);
                Utils.createNotification('❌ Clipboard failed');
            });
        },

        exportToFile(markdown, filename) {
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            Utils.createNotification(`✅ Downloaded ${filename}`);
        },

        execute(exportMode, customFilename) {
            const messages = document.querySelectorAll(CONFIG.SELECTORS.RESPONSE_CONTENT);
            if (!messages.length) {
                Utils.createNotification('❌ No messages found');
                return;
            }

            const conversationTitle = this.getConversationTitle();
            const markdown = this.buildMarkdown(messages, conversationTitle);
            const filename = this.generateFilename(customFilename, conversationTitle);

            if (exportMode === 'clipboard') {
                this.exportToClipboard(markdown);
            } else {
                this.exportToFile(markdown, filename);
            }
        }
    };

    // ============================================================================
    // MAIN INITIALIZATION
    // ============================================================================
    function init() {
        // Remove existing UI if present
        document.getElementById(CONFIG.BUTTON_ID)?.remove();
        document.getElementById(CONFIG.DROPDOWN_ID)?.remove();

        const button = UIBuilder.createButton();
        const dropdown = UIBuilder.createDropdown();
        document.body.appendChild(button);
        document.body.appendChild(dropdown);

        let dropdownVisible = false;

        button.addEventListener('click', () => {
            dropdownVisible = !dropdownVisible;
            dropdown.style.display = dropdownVisible ? 'block' : 'none';
            if (dropdownVisible) {
                CheckboxManager.injectCheckboxes();
            } else {
                CheckboxManager.removeAll();
            }
        });

        // Selection dropdown handler
        dropdown.addEventListener('change', (e) => {
            if (e.target.id === CONFIG.SELECT_DROPDOWN_ID) {
                SelectionManager.applySelection(e.target.value);
            }
        });

        // Export button handler
        dropdown.addEventListener('click', (e) => {
            if (e.target.id === 'grok-export-run') {
                const customFilename = document.getElementById(CONFIG.FILENAME_INPUT_ID)?.value;
                const namingFormat = document.getElementById(CONFIG.NAMING_FORMAT_ID)?.value || 'kebab-case';
                const exportMode = document.querySelector(`input[name="${CONFIG.EXPORT_MODE_NAME}"]:checked`)?.value || 'clipboard';

                const turns = document.querySelectorAll(CONFIG.SELECTORS.RESPONSE_CONTENT);
                if (!turns.length) {
                    Utils.createNotification('❌ No messages found');
                    return;
                }

                const conversationTitle = ExportService.getConversationTitle();
                const markdown = ExportService.buildMarkdown(turns, conversationTitle);
                const filename = ExportService.generateFilename(customFilename, conversationTitle, namingFormat);

                if (exportMode === 'clipboard') {
                    ExportService.exportToClipboard(markdown);
                } else {
                    ExportService.exportToFile(markdown, filename);
                }
            }
        });

        console.log('Grok Chat Exporter initialized');
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
