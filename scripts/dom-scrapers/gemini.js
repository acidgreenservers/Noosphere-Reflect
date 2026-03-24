/**
 * Gemini Chat Exporter - Gemini content script
 * Exports Gemini chat conversations to Markdown with LaTeX preservation
 */

(function () {
  'use strict';

  // ============================================================================
  // CONSTANTS
  // ============================================================================
  const CONFIG = {
    CHECKBOX_CLASS: 'ns-checkbox', // Use the new checkbox class

    SELECTORS: {
      CHAT_CONTAINER: '[data-test-id="chat-history-container"]',
      CONVERSATION_TURN: 'div.conversation-container',
      USER_QUERY: 'user-query',
      MODEL_RESPONSE: 'model-response',
      COPY_BUTTON: 'button[data-test-id="copy-button"]',
      CONVERSATION_TITLE: '.conversation-title'
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
      BUTTON_PRIMARY: '#1a73e8',
      BUTTON_HOVER: '#1765c1',
      DARK_BG: '#111',
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
        .replace(/[\\/:*?"<>|.]/g, '')
        .replace(/\s+/g, '_')
        .replace(/^_+|_+$/g, '');
    },

    getDateString() {
      const d = new Date();
      const pad = n => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    },

    removeCitations(text) {
      return text
        .replace(/\[cite_start\]/g, '')
        .replace(/\[cite:[\d,\s]+\]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    },

    createNotification(message) {
      const popup = document.createElement('div');
      Object.assign(popup.style, {
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: '99999',
        background: '#333',
        color: '#fff',
        padding: '10px 18px',
        borderRadius: '8px',
        fontSize: '1em',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        opacity: '0.95',
        pointerEvents: 'none'
      });
      popup.textContent = message;
      document.body.appendChild(popup);
      setTimeout(() => popup.remove(), CONFIG.TIMING.POPUP_DURATION);
      return popup;
    }
  };

  // ============================================================================
  // UI AND CHECKBOX FUNCTIONS - PORTED FROM NEURAL CONSOLE
  // ============================================================================
  function injectStyles() {
    const styleId = 'noosphere-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        :root { --ns-green: #10b981; --ns-purple: #8b5cf6; --ns-amber: #f59e0b; --ns-bg: rgba(17, 24, 39, 0.7); --ns-border: rgba(255, 255, 255, 0.1); }
        .ns-orb { position: fixed; bottom: 25px; right: 25px; width: 56px; height: 56px; background: linear-gradient(135deg, var(--ns-green), var(--ns-purple)); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 100000; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 2px solid rgba(255, 255, 255, 0.2); }
        .ns-orb:hover { transform: scale(1.1) rotate(5deg); }
        .ns-orb svg { width: 28px; height: 28px; fill: white; }
        .ns-console { position: fixed; bottom: 95px; right: 25px; width: 340px; background: var(--ns-bg); backdrop-filter: blur(20px) saturate(180%); border: 1px solid var(--ns-border); border-radius: 28px; z-index: 99999; overflow: hidden; display: none; flex-direction: column; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); color: white; font-family: 'Inter', system-ui, sans-serif; }
        .ns-console-header { padding: 24px 24px 16px; background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent); }
        .ns-console-title { font-size: 20px; font-weight: 800; background: linear-gradient(to right, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }
        .ns-console-subtitle { font-size: 12px; color: rgba(255, 255, 255, 0.5); font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
        .ns-console-tabs { display: flex; padding: 0 16px; gap: 8px; margin-bottom: 16px; }
        .ns-tab { padding: 8px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); border: 1px solid transparent; }
        .ns-tab.active { background: rgba(16, 185, 129, 0.15); color: var(--ns-green); border: 1px solid rgba(16, 185, 129, 0.3); }
        .ns-console-content { padding: 0 20px 24px; display: flex; flex-direction: column; gap: 10px; }
        .ns-btn { width: 100%; padding: 12px 18px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--ns-border); border-radius: 16px; color: white; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.2s; }
        .ns-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); transform: translateX(4px); }
        .ns-btn svg { width: 18px; height: 18px; opacity: 0.7; }
        .ns-btn-primary { background: linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1)); border-color: rgba(16, 185, 129, 0.3); color: var(--ns-green); }
        .ns-btn-primary:hover { background: rgba(16, 185, 129, 0.25); border-color: var(--ns-green); }
        .ns-input-group { background: rgba(0, 0, 0, 0.2); padding: 16px; border-radius: 20px; border: 1px solid var(--ns-border); }
        .ns-label { font-size: 11px; text-transform: uppercase; color: rgba(255, 255, 255, 0.4); margin-bottom: 8px; display: block; }
        .ns-input { width: 100%; background: transparent; border: none; color: white; font-size: 15px; outline: none; padding: 4px 0; }
        .ns-select { width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--ns-border); border-radius: 12px; color: white; padding: 10px; outline: none; font-size: 13px; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.7)' d='M6 9L1 4h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 12px; padding-right: 30px; cursor: pointer; }
        .ns-select:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); }
        .ns-select option { background: var(--ns-bg); color: white; padding: 8px; }
        .ns-checkbox { appearance: none; width: 20px; height: 20px; border: 2px solid var(--ns-green); border-radius: 6px; cursor: pointer; background: rgba(0,0,0,0.3); transition: all 0.2s; position: relative; }
        .ns-checkbox:checked { background: var(--ns-green); box-shadow: 0 0 10px var(--ns-green); }
        .ns-checkbox:checked::after { content: '✓'; position: absolute; color: white; font-size: 14px; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        .ns-bulk-controls { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 12px; }
        .ns-bulk-btn { padding: 6px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--ns-border); border-radius: 8px; color: rgba(255, 255, 255, 0.7); font-size: 11px; font-weight: 600; cursor: pointer; text-align: center; transition: all 0.2s; }
        .ns-bulk-btn:hover { background: rgba(255, 255, 255, 0.1); color: white; }
    `;
    document.head.appendChild(style);
  }

  function createMenu() {
    // Use safe DOM construction instead of innerHTML to comply with Trusted Types CSP
    const ce = (tag, className, children, options) => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (children) children.forEach(child => child && el.appendChild(child));
        if (options) Object.keys(options).forEach(key => {
            if (key === 'style') {
                Object.assign(el.style, options.style);
            } else {
                el[key] = options[key];
            }
        });
        return el;
    };

    const orb = ce('div', 'ns-orb');
    const orbSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    orbSvg.setAttribute('viewBox', '0 0 24 24');
    const orbPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    orbPath.setAttribute('d', 'M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2zm0,18c-3.31,0-6-2.69-6-6,0-1.01,.25-1.97,.7-2.8l1.46,1.46c-.11,.43-.16,.88-.16,1.34,0,2.21,1.79,4,4,4s4-1.79,4-4-1.79-4-4-4c-.46,0-.91,.05-1.34,.16l-1.46-1.46c.83-.45,1.79-.7,2.8-.7,3.31,0,6,2.69,6,6s-2.69,6-6,6z');
    orbSvg.appendChild(orbPath);
    orb.appendChild(orbSvg);
    document.body.appendChild(orb);

    const createButton = (id, text, isPrimary = false) => {
        const btn = ce('button', `ns-btn${isPrimary ? ' ns-btn-primary' : ''}`);
        btn.id = id;
        if (id === 'ns-dl-md') {
            const dlSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            dlSvg.setAttribute('viewBox', '0 0 24 24');
            dlSvg.setAttribute('fill', 'none');
            dlSvg.setAttribute('stroke', 'currentColor');
            dlSvg.setAttribute('stroke-width', '2');
            const dlPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            dlPath.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12');
            dlSvg.appendChild(dlPath);
            btn.appendChild(dlSvg);
            btn.appendChild(document.createTextNode(text));
        } else {
            btn.textContent = text;
        }
        return btn;
    };

    const createTab = (text, target, isActive = false) => {
        const tab = ce('div', `ns-tab${isActive ? ' active' : ''}`);
        tab.textContent = text;
        tab.dataset.target = target;
        return tab;
    };

    const createInputGroup = (label, inputId, placeholder) => {
        const labelEl = ce('span', 'ns-label');
        labelEl.textContent = label;
        const inputEl = ce('input', 'ns-input');
        inputEl.id = inputId;
        inputEl.type = 'text';
        inputEl.placeholder = placeholder;
        return ce('div', 'ns-input-group', [labelEl, inputEl]);
    };

    const createSelectGroup = (label, selectId, options) => {
        const labelEl = ce('span', 'ns-label');
        labelEl.textContent = label;
        const selectEl = ce('select', 'ns-select');
        selectEl.id = selectId;
        options.forEach(opt => {
            const optionEl = ce('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.text;
            selectEl.appendChild(optionEl);
        });
        const wrapper = ce('div');
        wrapper.style.padding = '0 4px';
        wrapper.append(labelEl, selectEl);
        return wrapper;
    };

    const consoleEl = ce('div', 'ns-console', [
        ce('div', 'ns-console-header', [
            ce('div', 'ns-console-subtitle', [document.createTextNode('Neural Interface')]),
            ce('div', 'ns-console-title', [document.createTextNode('Noosphere Reflect')])
        ]),
        ce('div', 'ns-console-tabs', [
            createTab('Export', 'ns-pane-export', true),
            createTab('Configuration', 'ns-pane-config')
        ]),
        ce('div', 'ns-console-content', [
            ce('div', 'ns-bulk-controls', [
                Object.assign(ce('div', 'ns-bulk-btn', [document.createTextNode('All')]), { id: 'ns-select-all' }),
                Object.assign(ce('div', 'ns-bulk-btn', [document.createTextNode('User')]), { id: 'ns-select-user' }),
                Object.assign(ce('div', 'ns-bulk-btn', [document.createTextNode('AI')]), { id: 'ns-select-ai' }),
                Object.assign(ce('div', 'ns-bulk-btn', [document.createTextNode('None')]), { id: 'ns-select-none' })
            ]),
            ce('div', null, [
                createButton('ns-copy-md', 'Copy MD'),
                createButton('ns-copy-json', 'Copy JSON')
            ], { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }),
            createButton('ns-dl-md', 'Download .MD', true)
        ], { id: 'ns-pane-export' }),
        ce('div', 'ns-console-content', [
            createInputGroup('Chat Title', 'ns-manual-title', 'e.g. Gemini Code Analysis'),
            createInputGroup('Filename Prefix', 'ns-custom-name', 'Gemini_Export'),
            createSelectGroup('Naming Segment', 'ns-naming-format', [
                { value: 'kebab-case', text: 'kebab-case' }, { value: 'snake_case', text: 'snake_case' },
                { value: 'PascalCase', text: 'PascalCase' }, { value: 'camelCase', text: 'camelCase' }
            ])
        ], { id: 'ns-pane-config', style: { display: 'none' } })
    ]);
    
    document.body.appendChild(consoleEl);

    orb.onclick = () => { consoleEl.style.display = consoleEl.style.display === 'flex' ? 'none' : 'flex'; };
    consoleEl.querySelectorAll('.ns-tab').forEach(tab => {
        tab.onclick = () => {
            consoleEl.querySelectorAll('.ns-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            consoleEl.querySelectorAll('.ns-console-content').forEach(c => { c.style.display = c.id === tab.dataset.target ? 'flex' : 'none'; });
        };
    });
  }

  function injectCheckboxes() {
    const createCheckbox = (type, container) => {
        if (container.querySelector('.ns-checkbox')) return;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'ns-checkbox';
        checkbox.dataset.type = type;
        checkbox.checked = true;
        Object.assign(checkbox.style, { position: 'absolute', right: '28px', top: '8px', zIndex: '10000', transform: 'scale(1.2)' });
        container.style.position = 'relative';
        container.appendChild(checkbox);
    };
    document.querySelectorAll(CONFIG.SELECTORS.CONVERSATION_TURN).forEach(turn => {
        const userQueryElem = turn.querySelector(CONFIG.SELECTORS.USER_QUERY);
        if (userQueryElem) createCheckbox('user', userQueryElem);
        const modelRespElem = turn.querySelector(CONFIG.SELECTORS.MODEL_RESPONSE);
        if (modelRespElem) createCheckbox('assistant', modelRespElem);
    });
  }

  function setupObserver() {
      const observer = new MutationObserver(() => {
          injectCheckboxes();
      });
      observer.observe(document.body, { childList: true, subtree: true });
  }

  // ============================================================================
  // EXPORT SERVICE
  // ============================================================================
  class ExportService {
    constructor(checkboxManager) {
      this.checkboxManager = checkboxManager;
    }

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
    }

    async scrollToLoadAll() {
      const scrollContainer = document.querySelector(CONFIG.SELECTORS.CHAT_CONTAINER);
      if (!scrollContainer) {
        throw new Error('Could not find chat history container. Are you on a Gemini chat page?');
      }

      let stableScrolls = 0;
      let scrollAttempts = 0;
      let lastScrollTop = null;

      while (stableScrolls < CONFIG.TIMING.MAX_STABLE_SCROLLS &&
        scrollAttempts < CONFIG.TIMING.MAX_SCROLL_ATTEMPTS) {
        const currentTurnCount = document.querySelectorAll(CONFIG.SELECTORS.CONVERSATION_TURN).length;
        scrollContainer.scrollTop = 0;
        await Utils.sleep(CONFIG.TIMING.SCROLL_DELAY);

        const scrollTop = scrollContainer.scrollTop;
        const newTurnCount = document.querySelectorAll(CONFIG.SELECTORS.CONVERSATION_TURN).length;

        if (newTurnCount === currentTurnCount && (lastScrollTop === scrollTop || scrollTop === 0)) {
          stableScrolls++;
        } else {
          stableScrolls = 0;
        }

        lastScrollTop = scrollTop;
        scrollAttempts++;
      }
    }

    async copyModelResponse(turn, copyBtn) {
      try {
        await navigator.clipboard.writeText('');
      } catch (e) {
        // Ignore clipboard clear errors
      }

      let attempts = 0;
      let clipboardText = '';

      while (attempts < CONFIG.TIMING.MAX_CLIPBOARD_ATTEMPTS) {
        const modelRespElem = turn.querySelector(CONFIG.SELECTORS.MODEL_RESPONSE);
        if (modelRespElem) {
          modelRespElem.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        }

        await Utils.sleep(CONFIG.TIMING.CLIPBOARD_CLEAR_DELAY);
        copyBtn.click();
        await Utils.sleep(CONFIG.TIMING.CLIPBOARD_READ_DELAY);

        clipboardText = await navigator.clipboard.readText();
        if (clipboardText) break;
        attempts++;
      }

      return clipboardText;
    }

    getConversationTitle() {
      const titleCard = document.querySelector(CONFIG.SELECTORS.CONVERSATION_TITLE);
      return titleCard ? titleCard.textContent.trim() : '';
    }

    generateFilename(customFilename, conversationTitle) {
      // Priority: custom > conversation title > page title > timestamp
      if (customFilename && customFilename.trim()) {
        let base = customFilename.trim().replace(/\.[^/.]+$/, '');
        base = base.replace(/[^a-zA-Z0-9_\-]/g, '_');
        return base || `gemini_chat_export_${Utils.getDateString()}`;
      }

      // Try conversation title first
      if (conversationTitle) {
        const safeTitle = Utils.sanitizeFilename(conversationTitle);
        if (safeTitle) return `${safeTitle}_${Utils.getDateString()}`;
      }

      // Fallback to page title
      const pageTitle = document.querySelector('title')?.textContent.trim();
      if (pageTitle) {
        const safeTitle = Utils.sanitizeFilename(pageTitle);
        if (safeTitle) return `${safeTitle}_${Utils.getDateString()}`;
      }

      // Final fallback
      return `gemini_chat_export_${Utils.getDateString()}`;
    }

    async buildMarkdown(turns, conversationTitle) {
      const now = new Date();
      const dateStr = now.toLocaleString();
      const sourceUrl = window.location.href;

      let userCount = 0;
      let aiCount = 0;
      let selectedTurns = [];

      turns.forEach((turn) => {
        const userQueryElem = turn.querySelector(CONFIG.SELECTORS.USER_QUERY);
        const modelRespElem = turn.querySelector(CONFIG.SELECTORS.MODEL_RESPONSE);

        let turnSelected = false;
        if (userQueryElem && userQueryElem.querySelector(`.ns-checkbox`)?.checked) {
          userCount++;
          turnSelected = true;
        }
        if (modelRespElem && modelRespElem.querySelector(`.ns-checkbox`)?.checked) {
          aiCount++;
          turnSelected = true;
        }
        if (turnSelected) selectedTurns.push(turn);
      });

      const totalMessages = userCount + aiCount;
      const exchanges = selectedTurns.length;

      let markdown = `---
> **🤖 Model:** Gemini
>
> **🌐 Date:** ${dateStr}
>
> **🌐 Source:** [Gemini Chat](${sourceUrl})
>
> **🏷️ Tags:** Gemini, AI-Chat, Noosphere
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
>> **Total Artifacts:** 0
---

## Title:

> ${conversationTitle || 'Gemini Conversation'}

--- 

`;

      for (let i = 0; i < selectedTurns.length; i++) {
        const turn = selectedTurns[i];
        Utils.createNotification(`Processing message ${i + 1} of ${selectedTurns.length}...`);

        // User message
        const userQueryElem = turn.querySelector(CONFIG.SELECTORS.USER_QUERY);
        if (userQueryElem) {
          const cb = userQueryElem.querySelector(`.${CONFIG.CHECKBOX_CLASS}`);
          if (cb?.checked) {
            const userQuery = userQueryElem.textContent.trim();
            markdown += `#### Prompt - User 👤:\n\n${userQuery}\n\n`;
          }
        }

        // Model response
        const modelRespElem = turn.querySelector(CONFIG.SELECTORS.MODEL_RESPONSE);
        if (modelRespElem) {
          const cb = modelRespElem.querySelector(`.${CONFIG.CHECKBOX_CLASS}`);
          if (cb?.checked) {
            modelRespElem.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            await Utils.sleep(CONFIG.TIMING.MOUSEOVER_DELAY);

            const copyBtn = turn.querySelector(CONFIG.SELECTORS.COPY_BUTTON);
            if (copyBtn) {
              const clipboardText = await this.copyModelResponse(turn, copyBtn);

              if (clipboardText) {
                const modelResponse = Utils.removeCitations(clipboardText);
                markdown += `#### Response - Model 🤖:\n\n`;

                // Detection for thinking blocks inside gemini clipboard text
                const thoughtMatch = modelResponse.match(/<thought>([\s\S]*?)<\/thought>/i);
                if (thoughtMatch) {
                  markdown += "```\nThoughts:\n";
                  markdown += `${thoughtMatch[1].trim()}\n`;
                  markdown += "```\n\n";
                  markdown += `${modelResponse.replace(/<thought>[\s\S]*?<\/thought>/i, '').trim()}\n\n`;
                } else {
                  markdown += `${modelResponse}\n\n`;
                }
              } else {
                markdown += `#### Response - Model 🤖:\n\n[Note: Could not copy model response. Please manually copy and paste this response from message ${i + 1}.]\n\n`;
              }
            } else {
              markdown += `#### Response - Model 🤖:\n\n[Note: Copy button not found. Please check the chat UI.]\n\n`;
            }
          }
        }

        if (i < selectedTurns.length - 1) {
          markdown += '---\n\n';
        }
      }

      markdown += `\n---\n\n`;
      markdown += `###### Noosphere Reflect\n`;
      markdown += `###### ***Meaning Through Memory***\n\n`;
      markdown += `###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n`;

      return markdown;
    }

    async exportToClipboard(markdown) {
      await navigator.clipboard.writeText(markdown);
      alert('Conversation copied to clipboard!');
    }

    async exportToFile(markdown, filename) {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = `${filename}.md`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    }

    async execute(exportMode, customFilename, namingFormat = 'kebab-case') {
      try {
        // Load all messages
        await this.scrollToLoadAll();

        // Get all turns and inject checkboxes
        const turns = Array.from(document.querySelectorAll(CONFIG.SELECTORS.CONVERSATION_TURN));
        injectCheckboxes();

        // Check if any messages selected
        if (!document.querySelector('.ns-checkbox:checked')) {
            Utils.createNotification('Please select at least one message to export.');
            return;
        }

        // Get title and build markdown
        const conversationTitle = this.getConversationTitle();
        const markdown = await this.buildMarkdown(turns, conversationTitle);

        // Export based on mode
        if (exportMode === 'clipboard') {
          await this.exportToClipboard(markdown);
        } else {
          const filename = this.generateFilename(customFilename, conversationTitle, namingFormat);
          await this.exportToFile(markdown, filename);
        }

      } catch (error) {
        console.error('Export error:', error);
        alert(`Export failed: ${error.message}`);
      }
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  function init() {
    console.log('[Noosphere] Initializing Gemini Exporter with Neural Console...');
    // The ExportService in gemini.js doesn't need the checkbox manager passed in.
    const exportService = new ExportService();

    injectStyles();
    createMenu();
    injectCheckboxes();
    setupObserver();

    // ** THIS IS THE CRITICAL RE-WIRING STEP **
    document.getElementById('ns-copy-md').onclick = async () => {
        const namingFormat = document.getElementById('ns-naming-format')?.value || 'kebab-case';
        await exportService.execute('clipboard', '', namingFormat);
    };
    
    document.getElementById('ns-dl-md').onclick = async () => {
        const customFilename = document.getElementById('ns-custom-name')?.value;
        const namingFormat = document.getElementById('ns-naming-format')?.value || 'kebab-case';
        await exportService.execute('file', customFilename, namingFormat);
    };
    
    document.getElementById('ns-copy-json').onclick = () => {
         Utils.createNotification('JSON export not yet implemented for Gemini.');
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

    console.log('[Noosphere] Gemini Neural Console is live.');
  }

  init();

})();
