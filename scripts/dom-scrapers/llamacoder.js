/**
 * Llamacoder Chat Exporter - Llamacoder content script
 * Exports Llamacoder chat conversations to Markdown
 */

(function () {
    'use strict';

    // ============================================================================
    // CONSTANTS
    // ============================================================================
    const CONFIG = {
        BUTTON_ID: 'llamacoder-export-btn',
        DROPDOWN_ID: 'llamacoder-export-dropdown',
        FILENAME_INPUT_ID: 'llamacoder-filename-input',
        SELECT_DROPDOWN_ID: 'llamacoder-select-dropdown',
        CHECKBOX_CLASS: 'llamacoder-export-checkbox',
        EXPORT_MODE_NAME: 'llamacoder-export-mode',
        NAMING_FORMAT_ID: 'llamacoder-naming-format',

        SELECTORS: {
            // Main chat container
            CHAT_CONTAINER: '.mx-auto.flex.w-full.max-w-prose.flex-col',

            // User message
            USER_MESSAGE: '.whitespace-pre-wrap.rounded.bg-white',

            // AI response
            AI_RESPONSE: '.prose',

            // Code blocks
            CODE_BLOCK: 'pre code',

            // Title
            CONVERSATION_TITLE: 'p.italic.text-gray-500',

            // File badges
            FILE_BADGE: 'span.text-gray-700'
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
            BUTTON_PRIMARY: '#6366f1', // Llamacoder purple
            BUTTON_HOVER: '#4f46e5',
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
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
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

        // Convert element to markdown, preserving code blocks
        getMarkdownFromElement(element) {
            if (!element) return '';
            const clone = element.cloneNode(true);

            // Replace code blocks with markdown
            clone.querySelectorAll('pre code').forEach(block => {
                let lang = '';
                block.classList.forEach(cls => {
                    if (cls.startsWith('language-')) lang = cls.replace('language-', '');
                });
                const codeText = block.innerText;
                block.closest('pre').replaceWith(`\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`);
            });

            // Replace inline code
            clone.querySelectorAll('code').forEach(inline => {
                const text = inline.innerText;
                if (!text.startsWith('```')) {
                    inline.replaceWith(`\`${text}\``);
                }
            });

            // Handle file name badges
            clone.querySelectorAll(CONFIG.SELECTORS.FILE_BADGE).forEach(span => {
                const parent = span.parentElement;
                if (parent && parent.classList.contains('text-sm')) {
                    const fileName = span.innerText.trim();
                    if (fileName && (fileName.includes('.') || fileName.includes('/'))) {
                        parent.replaceWith(document.createTextNode(`\n\n**📄 File: ${fileName}**\n`));
                    }
                }
            });

            // Remove buttons and SVGs
            clone.querySelectorAll('button, svg').forEach(el => el.remove());

            return clone.innerText.trim();
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
                top: '10px',
                zIndex: '100'
            });
            container.style.position = 'relative';
            container.appendChild(checkbox);
            return checkbox;
        },

        injectCheckboxes() {
            const chatContainer = document.querySelector(CONFIG.SELECTORS.CHAT_CONTAINER);
            if (!chatContainer) return;

            for (const child of chatContainer.children) {
                if (child.querySelector(`.${CONFIG.CHECKBOX_CLASS}`)) continue;

                const userBubble = child.querySelector(CONFIG.SELECTORS.USER_MESSAGE);
                if (userBubble) {
                    this.createCheckbox('user', child);
                    continue;
                }

                const aiProse = child.querySelector(CONFIG.SELECTORS.AI_RESPONSE);
                if (aiProse) {
                    this.createCheckbox('assistant', child);
                }
            }
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
              <option value="assistant">Llamacoder Only</option>
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
          
          <button id="llamacoder-export-run" style="background: ${CONFIG.STYLES.BUTTON_PRIMARY}; color: white; 
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
            const titleEl = document.querySelector(CONFIG.SELECTORS.CONVERSATION_TITLE);
            return titleEl?.textContent?.trim() || 'Llamacoder_Chat';
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

        buildMarkdown(conversationTitle) {
            const now = new Date();
            const dateStr = now.toLocaleString();
            const sourceUrl = window.location.href;

            const chatContainer = document.querySelector(CONFIG.SELECTORS.CHAT_CONTAINER);
            if (!chatContainer) return '';

            let userCount = 0;
            let aiCount = 0;
            let selectedItems = [];

            for (const child of chatContainer.children) {
                const checkbox = child.querySelector(`.${CONFIG.CHECKBOX_CLASS}`);
                if (checkbox && !checkbox.checked) continue;

                const userBubble = child.querySelector(CONFIG.SELECTORS.USER_MESSAGE);
                const aiProse = child.querySelector(CONFIG.SELECTORS.AI_RESPONSE);

                if (userBubble || aiProse) {
                    selectedItems.push(child);
                    if (userBubble) userCount++;
                    if (aiProse) aiCount++;
                }
            }

            const totalMessages = userCount + aiCount;
            const exchanges = selectedItems.length;

            let markdown = `---
> **🤖 Model:** Llamacoder (Meta-Llama)
>
> **🌐 Date:** ${dateStr}
>
> **🌐 Source:** [Llamacoder](${sourceUrl})
>
> **🏷️ Tags:** Llamacoder, Meta, Llama, AI-Chat, Noosphere
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

            selectedItems.forEach((child, index) => {
                const userBubble = child.querySelector(CONFIG.SELECTORS.USER_MESSAGE);
                const aiProse = child.querySelector(CONFIG.SELECTORS.AI_RESPONSE);

                if (userBubble) {
                    markdown += `#### Prompt - User 👤:\n\n`;
                    markdown += `${userBubble.innerText.trim()}\n\n`;
                } else if (aiProse) {
                    markdown += `#### Response - Model 🤖:\n\n`;
                    markdown += `${Utils.getMarkdownFromElement(child)}\n\n`;
                }

                if (index < selectedItems.length - 1) {
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
            const chatContainer = document.querySelector(CONFIG.SELECTORS.CHAT_CONTAINER);
            if (!chatContainer || !chatContainer.children.length) {
                Utils.createNotification('❌ No messages found');
                return;
            }

            const conversationTitle = this.getConversationTitle();
            const markdown = this.buildMarkdown(conversationTitle);
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
            if (e.target.id === 'llamacoder-export-run') {
                const customFilename = document.getElementById(CONFIG.FILENAME_INPUT_ID)?.value;
                const namingFormat = document.getElementById(CONFIG.NAMING_FORMAT_ID)?.value || 'kebab-case';
                const exportMode = document.querySelector(`input[name="${CONFIG.EXPORT_MODE_NAME}"]:checked`)?.value || 'clipboard';

                const chatContainer = document.querySelector(CONFIG.SELECTORS.CHAT_CONTAINER);
                if (!chatContainer) {
                    Utils.createNotification('❌ Chat container not found');
                    return;
                }

                const turns = Array.from(chatContainer.children).filter(child => {
                    const cb = child.querySelector(`.${CONFIG.CHECKBOX_CLASS}`);
                    return cb && cb.checked;
                });

                if (!turns.length) {
                    Utils.createNotification('❌ No messages selected');
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

        console.log('Llamacoder Chat Exporter initialized');
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
