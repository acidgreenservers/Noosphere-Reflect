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

        generateFilename(customFilename, conversationTitle) {
            const dateStr = Utils.getDateString();
            const baseName = customFilename?.trim() || Utils.sanitizeFilename(conversationTitle);
            return `${baseName}_${dateStr}.md`;
        },

        buildMarkdown(conversationTitle) {
            let markdown = `# ${conversationTitle}\n\n`;
            markdown += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

            const chatContainer = document.querySelector(CONFIG.SELECTORS.CHAT_CONTAINER);
            if (!chatContainer) return markdown;

            for (const child of chatContainer.children) {
                const checkbox = child.querySelector(`.${CONFIG.CHECKBOX_CLASS}`);
                if (checkbox && !checkbox.checked) continue;

                const userBubble = child.querySelector(CONFIG.SELECTORS.USER_MESSAGE);
                if (userBubble) {
                    markdown += `## 👤 User\n\n`;
                    markdown += `${userBubble.innerText.trim()}\n\n`;
                    markdown += `---\n\n`;
                    continue;
                }

                const aiProse = child.querySelector(CONFIG.SELECTORS.AI_RESPONSE);
                if (aiProse) {
                    markdown += `## 🤖 Llamacoder\n\n`;
                    markdown += `${Utils.getMarkdownFromElement(child)}\n\n`;
                    markdown += `---\n\n`;
                }
            }

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
                const exportMode = document.querySelector(`input[name="${CONFIG.EXPORT_MODE_NAME}"]:checked`)?.value || 'clipboard';
                ExportService.execute(exportMode, customFilename);
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
