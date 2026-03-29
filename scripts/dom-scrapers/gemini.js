/**

 * Gemini Chat Exporter - Noosphere Reflect

 * Updated for current Gemini DOM (2026)

 * Text-only export. Images must be manually downloaded and uploaded to Artifacts.

 */



(function () {

  'use strict';



  // ============================================================================

  // CONSTANTS

  // ============================================================================

  const CONFIG = {

    CHECKBOX_CLASS: 'ns-checkbox',



    SELECTORS: {

      CHAT_CONTAINER:        'infinite-scroller.chat-history',

      CONVERSATION_TURN:     'div.conversation-container',

      USER_QUERY:            'user-query',

      MODEL_RESPONSE:        'model-response',

      USER_QUERY_LINES:      '.query-text-line',

      RESPONSE_MARKDOWN:     'structured-content-container.model-response-text',

      THOUGHTS_CONTAINER:    '.thoughts-content',

      THOUGHTS_EXPANDED:     '.thoughts-content-expanded',

      THOUGHTS_TOGGLE_BTN:   'button[data-test-id="thoughts-header-button"]',

      CONVERSATION_TITLE:    '.conversation-title-container',

      TIMESTAMP:             '.sg-message-timestamp span',

    },



    TIMING: {

      SCROLL_DELAY:          2000,

      MOUSEOVER_DELAY:       500,

      POPUP_DURATION:        900,

      EXPAND_DELAY:          700,

      MAX_SCROLL_ATTEMPTS:   60,

      MAX_STABLE_SCROLLS:    4,

    },



    STYLES: {

      BUTTON_PRIMARY: '#1a73e8',

      BUTTON_HOVER:   '#1765c1',

    }

  };



  // ============================================================================

  // UTILITY FUNCTIONS

  // ============================================================================

  const Utils = {

    sleep(ms) {

      return new Promise(resolve => setTimeout(resolve, ms));

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

        position: 'fixed', top: '24px', right: '24px', zIndex: '99999',

        background: '#333', color: '#fff', padding: '10px 18px',

        borderRadius: '8px', fontSize: '1em',

        boxShadow: '0 2px 12px rgba(0,0,0,0.12)', opacity: '0.95',

        pointerEvents: 'none'

      });

      popup.textContent = message;

      document.body.appendChild(popup);

      setTimeout(() => popup.remove(), CONFIG.TIMING.POPUP_DURATION);

    }

  };









  // ============================================================================

  // DOM EXTRACTION HELPERS

  // ============================================================================



  /**

   * Extract user message text cleanly using .query-text-line elements,

   * which avoids the "You said" label entirely.

   */

  function extractUserText(userQueryElem) {

    const lines = Array.from(

      userQueryElem.querySelectorAll(CONFIG.SELECTORS.USER_QUERY_LINES)

    );

    if (lines.length > 0) {

      return lines.map(l => l.innerText.trim()).filter(l => l.length > 0).join('\n\n');

    }

    // Fallback

    const qc = userQueryElem.querySelector('.query-content');

    if (qc) return qc.innerText.replace(/^You said[\s\S]{0,4}/, '').trim();

    return userQueryElem.innerText.replace(/^You said[\s\S]{0,4}/, '').trim();

  }



  /**

   * Expand and extract thinking block text.

   * HARD BOUNDARY: must output in ```\nThoughts:\n...\n``` format.

   */

  async function extractThoughts(modelRespElem) {

    const thoughtsContainer = modelRespElem.querySelector(CONFIG.SELECTORS.THOUGHTS_CONTAINER);

    if (!thoughtsContainer) return null;



    const isExpanded = thoughtsContainer.classList.contains('thoughts-content-expanded');

    if (!isExpanded) {

      const toggleBtn = modelRespElem.querySelector(CONFIG.SELECTORS.THOUGHTS_TOGGLE_BTN);

      if (toggleBtn) {

        toggleBtn.click();

        await Utils.sleep(CONFIG.TIMING.EXPAND_DELAY);

      }

    }



    const thoughtMarkdown = thoughtsContainer.querySelector('.markdown');

    if (thoughtMarkdown) return thoughtMarkdown.innerText.trim();



    // Fallback

    const raw = thoughtsContainer.innerText || thoughtsContainer.textContent;

    return raw.replace(/^Show thinking.*?\n/, '').trim() || null;

  }



  /**

   * Extract the actual model response text (NOT thoughts).

   * Lives in structured-content-container.model-response-text

   */

  function extractResponseText(modelRespElem) {

    const scc = modelRespElem.querySelector(CONFIG.SELECTORS.RESPONSE_MARKDOWN);

    if (!scc) return null;

    const markdown = scc.querySelector('.markdown');

    return markdown ? markdown.innerText.trim() : scc.innerText.trim();

  }



  /**

   * Get conversation title.

   */

  function getConversationTitle() {

    const el = document.querySelector(CONFIG.SELECTORS.CONVERSATION_TITLE);

    if (el) return el.textContent.trim();

    return document.title.replace(' - Gemini', '').trim() || 'Gemini Conversation';

  }



  // ============================================================================

  // UI INJECTION

  // ============================================================================

  function injectStyles() {

    const styleId = 'noosphere-styles';

    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');

    style.id = styleId;

    style.textContent = `

      :root { --ns-green: #10b981; --ns-purple: #8b5cf6; --ns-bg: rgba(17, 24, 39, 0.7); --ns-border: rgba(255, 255, 255, 0.1); }

      .ns-orb { position: fixed; bottom: 25px; right: 25px; width: 56px; height: 56px; background: linear-gradient(135deg, var(--ns-green), var(--ns-purple)); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 100000; box-shadow: 0 4px 20px rgba(0,0,0,0.3); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 2px solid rgba(255,255,255,0.2); }

      .ns-orb:hover { transform: scale(1.1) rotate(5deg); }

      .ns-orb svg { width: 28px; height: 28px; fill: white; }

      .ns-console { position: fixed; bottom: 95px; right: 25px; width: 340px; background: var(--ns-bg); backdrop-filter: blur(20px) saturate(180%); border: 1px solid var(--ns-border); border-radius: 28px; z-index: 99999; overflow: hidden; display: none; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.5); color: white; font-family: 'Inter', system-ui, sans-serif; }

      .ns-console-header { padding: 24px 24px 16px; background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent); }

      .ns-console-title { font-size: 20px; font-weight: 800; background: linear-gradient(to right, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }

      .ns-console-subtitle { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }

      .ns-console-tabs { display: flex; padding: 0 16px; gap: 8px; margin-bottom: 16px; }

      .ns-tab { padding: 8px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border: 1px solid transparent; }

      .ns-tab.active { background: rgba(16,185,129,0.15); color: var(--ns-green); border: 1px solid rgba(16,185,129,0.3); }

      .ns-console-content { padding: 0 20px 24px; display: flex; flex-direction: column; gap: 10px; }

      .ns-btn { width: 100%; padding: 12px 18px; background: rgba(255,255,255,0.05); border: 1px solid var(--ns-border); border-radius: 16px; color: white; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.2s; }

      .ns-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); transform: translateX(4px); }

      .ns-btn svg { width: 18px; height: 18px; opacity: 0.7; }

      .ns-btn-primary { background: linear-gradient(to right, rgba(16,185,129,0.2), rgba(16,185,129,0.1)); border-color: rgba(16,185,129,0.3); color: var(--ns-green); }

      .ns-btn-primary:hover { background: rgba(16,185,129,0.25); border-color: var(--ns-green); }

      .ns-input-group { background: rgba(0,0,0,0.2); padding: 16px; border-radius: 20px; border: 1px solid var(--ns-border); }

      .ns-label { font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 8px; display: block; }

      .ns-input { width: 100%; background: transparent; border: none; color: white; font-size: 15px; outline: none; padding: 4px 0; }

      .ns-select { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--ns-border); border-radius: 12px; color: white; padding: 10px; outline: none; font-size: 13px; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.7)' d='M6 9L1 4h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 12px; padding-right: 30px; cursor: pointer; }

      .ns-select option { background: var(--ns-bg); color: white; }

      .ns-checkbox { appearance: none; width: 20px; height: 20px; border: 2px solid var(--ns-green); border-radius: 6px; cursor: pointer; background: rgba(0,0,0,0.3); transition: all 0.2s; position: relative; }

      .ns-checkbox:checked { background: var(--ns-green); box-shadow: 0 0 10px var(--ns-green); }

      .ns-checkbox:checked::after { content: '✓'; position: absolute; color: white; font-size: 14px; top: 50%; left: 50%; transform: translate(-50%,-50%); }

      .ns-bulk-controls { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 12px; }

      .ns-bulk-btn { padding: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--ns-border); border-radius: 8px; color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 600; cursor: pointer; text-align: center; transition: all 0.2s; }

      .ns-bulk-btn:hover { background: rgba(255,255,255,0.1); color: white; }

    `;

    document.head.appendChild(style);

  }



  function createMenu() {

    const ce = (tag, className, children, options) => {

      const el = document.createElement(tag);

      if (className) el.className = className;

      if (children) children.forEach(child => child && el.appendChild(child));

      if (options) Object.keys(options).forEach(key => {

        if (key === 'style') Object.assign(el.style, options.style);

        else el[key] = options[key];

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

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');

        svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        path.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12');

        svg.appendChild(path); btn.appendChild(svg);

        btn.appendChild(document.createTextNode(text));

      } else { btn.textContent = text; }

      return btn;

    };



    const createTab = (text, target, isActive = false) => {

      const tab = ce('div', `ns-tab${isActive ? ' active' : ''}`);

      tab.textContent = text; tab.dataset.target = target; return tab;

    };



    const createInputGroup = (label, inputId, placeholder) => {

      const labelEl = ce('span', 'ns-label'); labelEl.textContent = label;

      const inputEl = ce('input', 'ns-input');

      inputEl.id = inputId; inputEl.type = 'text'; inputEl.placeholder = placeholder;

      return ce('div', 'ns-input-group', [labelEl, inputEl]);

    };



    const createSelectGroup = (label, selectId, options) => {

      const labelEl = ce('span', 'ns-label'); labelEl.textContent = label;

      const selectEl = ce('select', 'ns-select'); selectEl.id = selectId;

      options.forEach(opt => {

        const o = ce('option'); o.value = opt.value; o.textContent = opt.text;

        selectEl.appendChild(o);

      });

      const wrapper = ce('div'); wrapper.style.padding = '0 4px';

      wrapper.append(labelEl, selectEl); return wrapper;

    };



    const consoleEl = ce('div', 'ns-console', [

      ce('div', 'ns-console-header', [

        ce('div', 'ns-console-subtitle', [document.createTextNode('Neural Interface')]),

        ce('div', 'ns-console-title',    [document.createTextNode('Noosphere Reflect')])

      ]),

      ce('div', 'ns-console-tabs', [

        createTab('Export', 'ns-pane-export', true),

        createTab('Configuration', 'ns-pane-config')

      ]),

      ce('div', 'ns-console-content', [

        ce('div', 'ns-bulk-controls', [

          Object.assign(ce('div', 'ns-bulk-btn', [document.createTextNode('All')]),  { id: 'ns-select-all' }),

          Object.assign(ce('div', 'ns-bulk-btn', [document.createTextNode('User')]), { id: 'ns-select-user' }),

          Object.assign(ce('div', 'ns-bulk-btn', [document.createTextNode('AI')]),   { id: 'ns-select-ai' }),

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



    orb.onclick = () => {

      consoleEl.style.display = consoleEl.style.display === 'flex' ? 'none' : 'flex';

    };

    consoleEl.querySelectorAll('.ns-tab').forEach(tab => {

      tab.onclick = () => {

        consoleEl.querySelectorAll('.ns-tab').forEach(t => t.classList.remove('active'));

        tab.classList.add('active');

        consoleEl.querySelectorAll('.ns-console-content').forEach(c => {

          c.style.display = c.id === tab.dataset.target ? 'flex' : 'none';

        });

      };

    });

  }



  function injectCheckboxes() {

    const createCheckbox = (type, container) => {

      if (container.querySelector('.ns-checkbox')) return;

      const cb = document.createElement('input');

      cb.type = 'checkbox';

      cb.className = 'ns-checkbox';

      cb.dataset.type = type;

      cb.checked = true;



      // Different positioning for user vs AI messages

      if (type === 'user') {

        // USER MESSAGES: right side

        Object.assign(cb.style, {

          position: 'absolute', right: '8px', top: '8px', zIndex: '10000', transform: 'scale(1.2)'

        });

      } else {

        // AI MESSAGES: left side, positioned below the Gemini logo (~16px)

        Object.assign(cb.style, {

          position: 'absolute', left: '8px', top: '208px', zIndex: '10000', transform: 'scale(1.2)'

        });

      }



      container.style.position = 'relative';

      container.appendChild(cb);

    };

    document.querySelectorAll(CONFIG.SELECTORS.CONVERSATION_TURN).forEach(turn => {

      const uq = turn.querySelector(CONFIG.SELECTORS.USER_QUERY);

      if (uq) createCheckbox('user', uq);

      const mr = turn.querySelector(CONFIG.SELECTORS.MODEL_RESPONSE);

      if (mr) createCheckbox('assistant', mr);

    });

  }



  function setupObserver() {

    const observer = new MutationObserver(() => injectCheckboxes());

    observer.observe(document.body, { childList: true, subtree: true });

  }



  // ============================================================================

  // EXPORT SERVICE

  // ============================================================================

  class ExportService {



    generateFilename(customFilename, conversationTitle, format = 'kebab-case') {

      const dateStr = Utils.getDateString();

      const baseName = customFilename?.trim() || conversationTitle;

      let name = baseName.replace(/[<>:"/\\|?*.]/g, '').trim();

      let formatted = '';

      switch (format) {

        case 'kebab-case': formatted = name.replace(/[\s_]+/g, '-').replace(/-+/g, '-').toLowerCase(); break;

        case 'snake_case': formatted = name.replace(/[\s-]+/g, '_').replace(/_+/g, '_').toLowerCase(); break;

        case 'PascalCase': formatted = name.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(''); break;

        case 'camelCase':  formatted = name.split(/[\s_-]+/).map((w,i) => i===0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(''); break;

        default:           formatted = name.replace(/\s+/g, '_').toLowerCase();

      }

      return `${formatted}_${dateStr}.md`;

    }



    async scrollToLoadAll() {

      const scroller = document.querySelector(CONFIG.SELECTORS.CHAT_CONTAINER);

      if (!scroller) throw new Error('Could not find chat history container.');

      let stable = 0, attempts = 0, lastCount = null;

      while (stable < CONFIG.TIMING.MAX_STABLE_SCROLLS && attempts < CONFIG.TIMING.MAX_SCROLL_ATTEMPTS) {

        const count = document.querySelectorAll(CONFIG.SELECTORS.CONVERSATION_TURN).length;

        scroller.scrollTop = 0;

        await Utils.sleep(CONFIG.TIMING.SCROLL_DELAY);

        const newCount = document.querySelectorAll(CONFIG.SELECTORS.CONVERSATION_TURN).length;

        stable = (newCount === count && newCount === lastCount) ? stable + 1 : 0;

        lastCount = newCount;

        attempts++;

      }

    }






    async buildMarkdown(selectedTurns, conversationTitle) {

      const dateStr  = new Date().toLocaleString();

      const sourceUrl = window.location.href;



      let userCount = 0, aiCount = 0;

      selectedTurns.forEach(turn => {

        if (turn.querySelector(`${CONFIG.SELECTORS.USER_QUERY} .${CONFIG.CHECKBOX_CLASS}`)?.checked) userCount++;

        if (turn.querySelector(`${CONFIG.SELECTORS.MODEL_RESPONSE} .${CONFIG.CHECKBOX_CLASS}`)?.checked) aiCount++;

      });



      // ── HARD BOUNDARY: exact Noosphere Reflect header format ────────────────

      let md = `---

> 🤖 Model: Gemini

>

> 🌐 Date: ${dateStr}

>

> 🌐 Source: [Gemini Chat](${sourceUrl})

>

> 🏷️ Tags: Gemini, AI-Chat, Noosphere

>

> 📂 Artifacts: [Internal](${sourceUrl})

>

> 📊 Metadata:

>> Total Exchanges: ${selectedTurns.length}

>>

>> Total Chat Messages: ${userCount + aiCount}

>>

>> Total User Messages: ${userCount}

>>

>> Total AI Messages: ${aiCount}

>>

>> Total Artifacts: ${ImageCache.keys().length}

---



## Title:



> ${conversationTitle || 'Gemini Conversation'}



--- 



`;



      for (let i = 0; i < selectedTurns.length; i++) {

        const turn = selectedTurns[i];

        Utils.createNotification(`📝 Building turn ${i + 1} of ${selectedTurns.length}...`);



        // ── USER MESSAGE ────────────────────────────────────────────────────

        const uq = turn.querySelector(CONFIG.SELECTORS.USER_QUERY);

        if (uq && uq.querySelector(`.${CONFIG.CHECKBOX_CLASS}`)?.checked) {

          const text = extractUserText(uq);

          md += `#### Prompt - User 👤:\n\n${text}\n\n`;

        }



        // ── MODEL RESPONSE ──────────────────────────────────────────────────

        const mr = turn.querySelector(CONFIG.SELECTORS.MODEL_RESPONSE);

        if (mr && mr.querySelector(`.${CONFIG.CHECKBOX_CLASS}`)?.checked) {

          md += `#### Response - Model 🤖:\n\n`;



          // ── HARD BOUNDARY: thinking block format ─────────────────────────

          const thoughts = await extractThoughts(mr);

          if (thoughts) {

            md += "```\nThoughts:\n";

            md += `${thoughts}\n`;

            md += "```\n\n";

          }



          // ── Response text ─────────────────────────────────────────────────

          const responseText = extractResponseText(mr);

          if (responseText) {

            md += `${Utils.removeCitations(responseText)}\n\n`;

          } else {

            md += `[Note: Could not extract response text for turn ${i + 1}.]\n\n`;

          }

        }



        if (i < selectedTurns.length - 1) md += '---\n\n';

      }



      // ── HARD BOUNDARY: exact Noosphere Reflect footer format ────────────────

      md += `\n---\n\n`;

      md += `###### Noosphere Reflect\n`;

      md += `###### ***Meaning Through Memory***\n\n`;

      md += `###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n`;



      return md;

    }



    async exportToClipboard(markdown) {

      await navigator.clipboard.writeText(markdown);

      alert('Conversation copied to clipboard!');

    }



    async exportToFile(markdown, filename) {

      const blob = new Blob([markdown], { type: 'text/markdown' });

      const url  = URL.createObjectURL(blob);

      const a    = document.createElement('a');

      a.href = url; a.download = filename;

      document.body.appendChild(a); a.click();

      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);

    }



    async execute(exportMode, customFilename, namingFormat = 'kebab-case') {

      try {

        Utils.createNotification('🔄 Loading all messages...');

        await this.scrollToLoadAll();



        const turns = Array.from(document.querySelectorAll(CONFIG.SELECTORS.CONVERSATION_TURN));

        injectCheckboxes();



        if (!document.querySelector('.ns-checkbox:checked')) {

          Utils.createNotification('Please select at least one message to export.');

          return;

        }



        // Collect selected turns

        const selectedTurns = turns.filter(turn => {

          const uqCb = turn.querySelector(`${CONFIG.SELECTORS.USER_QUERY} .${CONFIG.CHECKBOX_CLASS}`);

          const mrCb = turn.querySelector(`${CONFIG.SELECTORS.MODEL_RESPONSE} .${CONFIG.CHECKBOX_CLASS}`);

          return uqCb?.checked || mrCb?.checked;

        });



        // Build markdown

        Utils.createNotification('📝 Building markdown...');

        const conversationTitle = getConversationTitle();

        const markdown = await this.buildMarkdown(selectedTurns, conversationTitle);



        // Export

        if (exportMode === 'clipboard') {

          await this.exportToClipboard(markdown);

        } else {

          const filename = this.generateFilename(customFilename, conversationTitle, namingFormat);

          await this.exportToFile(markdown, filename);

        }



      } catch (error) {

        console.error('[Noosphere] Export error:', error);

        alert(`Export failed: ${error.message}`);

      }

    }

  }



  // ============================================================================

  // INITIALIZATION

  // ============================================================================

  function init() {

    console.log('[Noosphere] Initializing Gemini Exporter...');

    const exportService = new ExportService();



    injectStyles();

    createMenu();

    injectCheckboxes();

    setupObserver();



    document.getElementById('ns-copy-md').onclick = async () => {

      const namingFormat = document.getElementById('ns-naming-format')?.value || 'kebab-case';

      await exportService.execute('clipboard', '', namingFormat);

    };

    document.getElementById('ns-dl-md').onclick = async () => {

      const customFilename = document.getElementById('ns-custom-name')?.value;

      const namingFormat   = document.getElementById('ns-naming-format')?.value || 'kebab-case';

      await exportService.execute('file', customFilename, namingFormat);

    };

    document.getElementById('ns-copy-json').onclick = () => {

      Utils.createNotification('JSON export not yet implemented for Gemini.');

    };



    const bulkSelect = (type) => {

      document.querySelectorAll('.ns-checkbox').forEach(cb => {

        cb.checked = type === 'all'  ? true

                   : type === 'none' ? false

                   : type === 'user' ? cb.dataset.type === 'user'

                   : type === 'ai'   ? cb.dataset.type === 'assistant'

                   : cb.checked;

      });

    };

    document.getElementById('ns-select-all').onclick  = () => bulkSelect('all');

    document.getElementById('ns-select-user').onclick = () => bulkSelect('user');

    document.getElementById('ns-select-ai').onclick   = () => bulkSelect('ai');

    document.getElementById('ns-select-none').onclick = () => bulkSelect('none');



    console.log('[Noosphere] Gemini Neural Console is live.');

  }



  init();



})();