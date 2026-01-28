/**
 * UI Injector - Selection buttons and upward-rolling export menu
 * Injects near the chat input bar on supported AI platforms
 * 
 * Features:
 * - Selection buttons: All / User Only / AI Only
 * - Upward-rolling export menu: Import to App, Export JSON, Export Markdown
 * - Checkbox injection for message selection
 * - Pre-capture auto-expand for thinking blocks
 */

(function () {
  'use strict';

  // Early check: Ensure chrome.runtime is available
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('UI Injector: chrome.runtime not available, skipping initialization');
    return;
  }

  // ============================================================================
  // PLATFORM DETECTION & CONFIGURATION
  // ============================================================================
  const PLATFORMS = {
    gemini: {
      name: 'Gemini',
      match: () => window.location.hostname.includes('gemini.google.com'),
      inputSelector: 'rich-textarea, [aria-label*="prompt"], textarea',
      messageSelector: 'div.conversation-container',
      userSelector: 'user-query',
      aiSelector: 'model-response',
      expandSelector: 'button mat-icon[fonticon="expand_more"]',
      expandText: null, // Check for icon presence
      color: '#4285F4'
    },
    claude: {
      name: 'Claude',
      match: () => window.location.hostname.includes('claude.ai'),
      inputSelector: '[data-testid="chat-input"], [data-testid="chat-input-ssr"], textarea',
      messageSelector: '[data-test-render-count]',
      userSelector: '[data-testid="user-message"]',
      aiSelector: '.font-claude-response',
      expandSelector: '[data-test-render-count] .border-border-300.rounded-lg button',
      expandText: null, // Always try to expand
      color: '#D97757'
    },
    chatgpt: {
      name: 'ChatGPT',
      match: () => window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('chat.openai.com'),
      inputSelector: '#prompt-textarea, textarea[data-id="root"]',
      messageSelector: '[data-message-author-role]',
      userSelector: '[data-message-author-role="user"]',
      aiSelector: '[data-message-author-role="assistant"]',
      expandSelector: null,
      color: '#10A37F'
    },
    grok: {
      name: 'Grok',
      match: () => window.location.hostname.includes('grok.com'),
      inputSelector: 'textarea',
      messageSelector: '.response-content-markdown',
      userSelector: null, // Uses alternating pattern
      aiSelector: null,
      expandSelector: null,
      color: '#FFFFFF',
      textColor: '#000000'
    },
    kimi: {
      name: 'Kimi',
      match: () => window.location.hostname.includes('kimi.moonshot.cn'),
      inputSelector: '.chat-editor-action',
      messageSelector: '.chat-content-item',
      userSelector: '.chat-content-item-user',
      aiSelector: '.chat-content-item-assistant',
      expandSelector: null,
      color: '#6366F1', // Kimi brand purple
      textColor: '#FFFFFF'
    },
    lechat: {
      name: 'Le Chat',
      match: () => window.location.hostname.includes('chat.mistral.ai'),
      inputSelector: 'textarea',
      messageSelector: '[data-message-id]',
      userSelector: '[data-message-author-role="user"]',
      aiSelector: '[data-message-author-role="assistant"]',
      expandSelector: null,
      color: '#FF7000'
    },
    llamacoder: {
      name: 'Llamacoder',
      match: () => window.location.hostname.includes('llamacoder.together.ai'),
      inputSelector: 'textarea',
      messageSelector: '.mx-auto.flex.w-full.max-w-prose.flex-col > *',
      userSelector: '.whitespace-pre-wrap.rounded.bg-white',
      aiSelector: '.prose',
      expandSelector: null,
      color: '#FFFFFF',
      textColor: '#000000'
    },
    aistudio: {
      name: 'Google AI Studio',
      match: () => window.location.hostname.includes('aistudio.google.com'),
      inputSelector: '.turn.input',
      messageSelector: '.turn-container .turn',
      userSelector: '.turn.input',
      aiSelector: '.turn.output',
      expandSelector: null,
      color: '#4285F4', // Google Blue
      textColor: '#FFFFFF',
      menuDirection: 'down', // Menu rolls downward
      customPosition: {
        position: 'absolute',
        top: '8px',
        left: '200px',
        bottom: 'auto',
        right: 'auto'
      }
    }
  };

  // Detect current platform
  function detectPlatform() {
    for (const [key, config] of Object.entries(PLATFORMS)) {
      if (config.match()) {
        return { key, ...config };
      }
    }
    return null;
  }

  const platform = detectPlatform();
  if (!platform) {
    console.log('UI Injector: No supported platform detected');
    return;
  }

  // ============================================================================
  // UI CONFIGURATION OVERRIDES
  // ============================================================================
  // Custom positioning and behavior for export button on specific platforms
  // anchorSelector: Place the button inside a specific UI element (relative locus)
  // parentSelector: Fallback parent if anchor is not found
  const UI_OVERRIDES = {
    // Google AI Studio
    aistudio: {
      parentSelector: 'header, [role="banner"], body',
      anchorSelector: '.header-right-container', // Native header right section
      menuDirection: 'down',
      style: {
        position: 'absolute',
        top: '12px',
        right: '180px',
        bottom: 'auto',
        left: 'auto',
        zIndex: '9999'
      }
    },
    // Claude.ai - Anchor near the paperclip/upload button row
    claude: {
      anchorSelector: 'div.flex.items-center.gap-2:has(button[aria-label="Upload files"]), fieldset .flex.items-center.gap-2',
      parentSelector: 'body',
      menuDirection: 'up',
      style: {
        position: 'relative',
        marginRight: '8px',
        marginBottom: '4px',
        zIndex: '999'
      },
      // Fixed fallback if anchor not found
      fixedStyle: {
        position: 'fixed !important',
        bottom: '65px !important',
        right: '330px !important',
        zIndex: '999999 !important'
      }
    },
    // Gemini - Anchor inside the rich-textarea container
    gemini: {
      anchorSelector: '.input-area-container .right-container, .input-area-container',
      parentSelector: 'body',
      menuDirection: 'up',
      style: {
        position: 'absolute',
        bottom: '12px',
        right: '160px',
        zIndex: '999'
      },
      fixedStyle: {
        position: 'fixed !important',
        bottom: '85px !important',
        right: '195px !important',
        zIndex: '999999 !important'
      }
    },
    // ChatGPT - Anchor inside the button row of the form
    chatgpt: {
      anchorSelector: 'div.flex.w-full.items-center.justify-between, form .flex.items-center.gap-2',
      parentSelector: 'body',
      menuDirection: 'up',
      style: {
        position: 'relative',
        marginRight: '8px',
        zIndex: '999'
      },
      fixedStyle: {
        position: 'fixed !important',
        bottom: '46px !important',
        right: '210px !important',
        zIndex: '999999 !important'
      }
    },
    // Grok - Anchor next to the send button
    grok: {
      anchorSelector: 'div.flex.items-center.gap-3:has(button[aria-label="Grok something"]), .relative.w-full:has(textarea) .flex.items-center',
      parentSelector: 'body',
      menuDirection: 'up',
      style: {
        position: 'relative',
        marginRight: '12px',
        zIndex: '999'
      },
      fixedStyle: {
        position: 'fixed !important',
        bottom: '44px !important',
        right: '200px !important',
        zIndex: '999999 !important'
      }
    },
    // Le Chat
    lechat: {
      anchorSelector: 'form .flex.items-center.justify-between',
      parentSelector: 'body',
      menuDirection: 'up',
      style: {
        position: 'absolute',
        bottom: '12px',
        right: '180px',
        zIndex: '999'
      },
      fixedStyle: {
        position: 'fixed !important',
        bottom: '85px !important',
        right: '210px !important',
        zIndex: '999999 !important'
      }
    },
    // Llamacoder
    llamacoder: {
      anchorSelector: 'header .flex.items-center.gap-2',
      parentSelector: 'body',
      menuDirection: 'down',
      style: {
        position: 'relative',
        marginRight: '10px',
        zIndex: '999'
      },
      fixedStyle: {
        position: 'fixed !important',
        bottom: 'auto !important',
        right: 'auto !important',
        left: '285px',
        top: '12px',
        zIndex: '999999 !important'
      }
    }
  };

  // ============================================================================
  // STYLES
  // ============================================================================
  const STYLES = `
    .nr-export-container {
      z-index: 99999;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .nr-export-container.nr-fixed {
      position: fixed;
      top: 12px;
      left: 200px;
    }

    .nr-export-btn {
      background: ${platform.color};
      color: ${platform.textColor || 'white'};
      border: ${platform.textColor === '#000000' ? '1px solid #e5e5e5' : 'none'};
      padding: 0 12px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      height: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .nr-export-btn:hover {
      transform: scale(1.1);
      filter: brightness(1.1);
      box-shadow: 0 0 15px ${platform.color}40, 0 4px 12px rgba(0,0,0,0.2);
      outline: 2px solid ${platform.color};
      outline-offset: 2px;
    }

    .nr-export-btn.nr-loading {
      opacity: 0.7;
      cursor: wait;
      pointer-events: none;
    }

    .nr-export-menu {
      position: absolute;
      bottom: 100%;
      right: 0;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      margin-bottom: 8px;
      min-width: 200px;
      overflow: hidden;
      transform: translateY(10px) scaleY(0);
      transform-origin: bottom;
      opacity: 0;
      transition: transform 0.2s ease, opacity 0.2s ease;
      pointer-events: none;
    }

    .nr-export-menu.open {
      transform: translateY(0) scaleY(1);
      opacity: 1;
      pointer-events: auto;
    }

    /* Downward menu variant (for AI Studio) */
    .nr-export-menu.menu-down {
      bottom: auto;
      top: 100%;
      margin-top: 8px;
      margin-bottom: 0;
      transform: translateY(-10px) scaleY(0);
      transform-origin: top;
    }

    .nr-export-menu.menu-down.open {
      transform: translateY(0) scaleY(1);
    }

    .nr-menu-section {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .nr-menu-section:last-child {
      border-bottom: none;
    }

    .nr-menu-label {
      padding: 4px 16px;
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      font-weight: 600;
    }

    .nr-menu-item {
      padding: 10px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #333;
      transition: background 0.15s;
    }

    .nr-menu-item:hover {
      background: #f5f5f5;
    }

    .nr-menu-item.active {
      background: #e8f4fd;
      color: ${platform.color};
    }

    .nr-selection-group {
      display: flex;
      gap: 4px;
      padding: 8px 12px;
    }

    .nr-selection-btn {
      padding: 6px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s;
    }

    .nr-selection-btn.active {
      background: ${platform.color};
      color: ${platform.textColor || 'white'};
      border-color: ${platform.color};
    }

    .nr-checkbox {
      position: absolute;
      left: -28px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: ${platform.color};
      z-index: 100;
    }

    @media (prefers-color-scheme: dark) {
      .nr-export-menu {
        background: #1a1a1a;
        border: 1px solid #333;
      }
      .nr-menu-item {
        color: #eee;
      }
      .nr-menu-item:hover {
        background: #2a2a2a;
      }
      .nr-selection-btn {
        background: #2a2a2a;
        border-color: #444;
        color: #eee;
      }
      .nr-menu-section {
        border-color: #333;
      }
    }
  `;

  // ============================================================================
  // UI STATE
  // ============================================================================
  let menuOpen = false;
  let selectionMode = 'all'; // 'all' | 'none' | 'user' | 'ai'

  function getMenuDirection() {
    const overrideConfig = UI_OVERRIDES[platform?.key];
    if (overrideConfig && overrideConfig.menuDirection) {
      return overrideConfig.menuDirection;
    }
    if (platform && platform.menuDirection) {
      return platform.menuDirection;
    }
    return 'up';
  }

  // ============================================================================
  // CHECKBOX MANAGEMENT
  // ============================================================================
  function injectCheckboxes() {
    const messages = document.querySelectorAll(platform.messageSelector);

    messages.forEach((msg, index) => {
      // Mark as message container for the parser
      msg.classList.add('nr-message-container');

      if (msg.querySelector('.nr-checkbox')) return;

      // Determine message type
      let type = 'unknown';
      if (platform.userSelector && msg.querySelector(platform.userSelector)) {
        type = 'user';
      } else if (platform.aiSelector && msg.querySelector(platform.aiSelector)) {
        type = 'ai';
      } else if (platform.userSelector && msg.matches(platform.userSelector)) {
        type = 'user';
      } else if (platform.aiSelector && msg.matches(platform.aiSelector)) {
        type = 'ai';
      } else {
        // Fallback: alternating pattern
        type = index % 2 === 0 ? 'user' : 'ai';
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'nr-checkbox';
      checkbox.checked = true;
      checkbox.setAttribute('checked', 'checked'); // Sync for outerHTML capture
      checkbox.dataset.type = type;
      checkbox.dataset.index = index;

      // Listen for changes to sync attribute (needed for static HTML parsing)
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          checkbox.setAttribute('checked', 'checked');
        } else {
          checkbox.removeAttribute('checked');
        }
      });

      msg.style.position = 'relative';
      msg.appendChild(checkbox);
    });

    applySelection(selectionMode);
  }

  function removeCheckboxes() {
    document.querySelectorAll('.nr-checkbox').forEach(cb => cb.remove());
  }

  function applySelection(mode) {
    selectionMode = mode;
    document.querySelectorAll('.nr-checkbox').forEach(cb => {
      switch (mode) {
        case 'all':
          cb.checked = true;
          cb.setAttribute('checked', 'checked');
          break;
        case 'none':
          cb.checked = false;
          cb.removeAttribute('checked');
          break;
        case 'user':
          cb.checked = cb.dataset.type === 'user';
          if (cb.checked) cb.setAttribute('checked', 'checked');
          else cb.removeAttribute('checked');
          break;
        case 'ai':
          cb.checked = cb.dataset.type === 'ai';
          if (cb.checked) cb.setAttribute('checked', 'checked');
          else cb.removeAttribute('checked');
          break;
      }
    });

    // Update button states
    document.querySelectorAll('.nr-selection-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  function updateButtonLoading(isLoading) {
    const btn = document.querySelector('.nr-export-btn');
    if (btn) {
      btn.classList.toggle('nr-loading', isLoading);
      if (isLoading) {
        btn.innerHTML = '⏳ Processing...';
      } else {
        const arrow = getMenuDirection() === 'down' ? '▼' : '▲';
        btn.innerHTML = menuOpen ? '✕ Close' : `📋 Export ${arrow}`;
      }
    }
  }

  // ============================================================================
  // AUTO-EXPAND THINKING
  // ============================================================================
  async function expandThinking() {
    if (!platform.expandSelector) return 0;

    const buttons = document.querySelectorAll(platform.expandSelector);
    let expanded = 0;

    buttons.forEach(element => {
      // Element might be icon or button depending on selector
      let btn = element;
      if (element.tagName === 'MAT-ICON') {
        btn = element.closest('button');
      }

      if (btn) {
        // Check if needs expansion
        const shouldExpand = platform.expandText
          ? btn.textContent?.includes(platform.expandText)
          : true;

        if (shouldExpand) {
          btn.click();
          expanded++;
        }
      }
    });

    if (expanded > 0) {
      await new Promise(r => setTimeout(r, 500));
    }

    return expanded;
  }

  // ============================================================================
  // EXPORT ACTIONS
  // ============================================================================
  async function handleExport(action) {
    // Expand thinking first
    const expanded = await expandThinking();
    if (expanded > 0) {
      console.log(`UI Injector: Expanded ${expanded} nodes`);
    }

    updateButtonLoading(true);

    // Map action to message type
    const messageActions = {
      'import': 'CAPTURE_CHAT',
      'import-copy': 'CAPTURE_CHAT_COPY',
      'json': 'COPY_JSON',
      'markdown': 'COPY_MARKDOWN'
    };

    const messageType = messageActions[action];
    if (!messageType) return;

    // Send message to background script, which will relay to content script
    // Background script uses chrome.tabs.sendMessage to send back to this content script
    try {
      // Check if chrome.runtime is available
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        console.error('UI Injector: chrome.runtime not available');
        window.ToastManager.show('❌ Extension not loaded properly', 'error');
        updateButtonLoading(false);
        return;
      }

      chrome.runtime.sendMessage({
        action: 'TRIGGER_CAPTURE',
        captureAction: messageType
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          window.ToastManager.show('❌ Export failed', 'error');
          return;
        }

        if (response?.success) {
          const messages = {
            'import': '✅ Imported to App!',
            'json': '✅ Copied as JSON!',
            'markdown': '✅ Copied as Markdown!'
          };
          window.ToastManager.show(messages[action] || '✅ Success!');
        } else {
          window.ToastManager.show(`❌ ${response?.error || 'Unknown error'}`, 'error');
        }
      });
    } catch (error) {
      console.error('UI Injector: Export error:', error);
      window.ToastManager.show('❌ Export failed', 'error');
    } finally {
      updateButtonLoading(false);
    }

    closeMenu();
  }

  // ============================================================================
  // PRELOAD HANDLER (Gemini-specific)
  // ============================================================================
  let isPreloading = false;

  async function handlePreload() {
    // Prevent multiple simultaneous preloads
    if (isPreloading) {
      window.ToastManager.show('⏳ Preload already in progress...', 'info');
      return;
    }

    isPreloading = true;
    updateButtonLoading(true);
    window.ToastManager.show('⬆️ Starting to pre-load conversation...', 'info');

    try {
      // Call the scrollToTopAndLoadAll function from gemini-capture.js
      if (typeof scrollToTopAndLoadAll === 'function') {
        await scrollToTopAndLoadAll();
        window.ToastManager.show('✅ Conversation pre-loaded! Ready to export.', 'success');
      } else {
        throw new Error('Pre-load function not available');
      }
    } catch (error) {
      console.error('UI Injector: Pre-load error:', error);
      window.ToastManager.show(`❌ Pre-load failed: ${error.message}`, 'error');
    } finally {
      isPreloading = false;
      updateButtonLoading(false);
      closeMenu();
    }
  }


  // ============================================================================
  // MENU MANAGEMENT
  // ============================================================================
  function toggleMenu() {
    menuOpen = !menuOpen;
    const menu = document.querySelector('.nr-export-menu');
    const btn = document.querySelector('.nr-export-btn');

    if (menu) {
      menu.classList.toggle('open', menuOpen);
    }

    if (btn) {
      btn.classList.toggle('nr-active', menuOpen);
    }

    if (menuOpen) {
      injectCheckboxes();
      btn.innerHTML = '✕ Close';
    } else {
      const direction = getMenuDirection();
      const arrow = direction === 'up' ? '▲' : '▼';
      btn.innerHTML = `📋 Export ${arrow}`;
    }
  }

  function closeMenu() {
    if (menuOpen) {
      toggleMenu();
    }
  }

  // ============================================================================
  // UI INJECTION
  // ============================================================================
  function injectUI() {
    // Remove existing
    document.querySelector('.nr-export-container')?.remove();

    // Add styles
    if (!document.querySelector('#nr-export-styles')) {
      const style = document.createElement('style');
      style.id = 'nr-export-styles';
      style.textContent = STYLES;
      document.head.appendChild(style);
    }

    // Create container
    const container = document.createElement('div');
    container.className = 'nr-export-container';

    // Apply custom positioning if specified (platform-specific overrides)
    if (platform.customPosition) {
      Object.assign(container.style, platform.customPosition);
    }

    // Determine menu direction class and arrow
    const overrideConfig = UI_OVERRIDES[platform.key];
    const direction = getMenuDirection();
    const menuDirectionClass = direction === 'up' ? '' : 'menu-down';
    const arrow = direction === 'up' ? '▲' : '▼';

    // Build menu HTML (no user input, safe for innerHTML)
    let menuHTML = `
      <div class="nr-export-menu ${menuDirectionClass}">
        <div class="nr-menu-section">
          <div class="nr-menu-label">Select Messages</div>
          <div class="nr-selection-group">
            <button class="nr-selection-btn active" data-mode="all">All</button>
            <button class="nr-selection-btn" data-mode="user">👤 User</button>
            <button class="nr-selection-btn" data-mode="ai">🤖 AI</button>
            <button class="nr-selection-btn" data-mode="none">None</button>
          </div>
        </div>`;

    // Add Gemini-specific pre-load section
    if (platform.key === 'gemini') {
      menuHTML += `
        <div class="nr-menu-section">
          <div class="nr-menu-label">Gemini Tools</div>
          <div class="nr-menu-item" data-action="preload-conversation">
            ⬆️ Pre-load Full Conversation
          </div>
        </div>`;
    }

    menuHTML += `
        <div class="nr-menu-section">
          <div class="nr-menu-label">Export</div>
          <div class="nr-menu-item" data-action="import">
            📥 Import to App (Merge)
          </div>
          <div class="nr-menu-item" data-action="import-copy">
            ✨ Import as New (Copy)
          </div>
          <div class="nr-menu-item" data-action="markdown">
            📋 Copy as Markdown
          </div>
          <div class="nr-menu-item" data-action="json">
            📋 Copy as JSON
          </div>
          <div class="nr-menu-item" data-action="clear-selectors" style="color: #d93025; margin-top: 4px; border-top: 1px solid #eee; padding-top: 12px;">
            ✕ Remove Selectors
          </div>
        </div>
      </div>
      <button class="nr-export-btn">📋 Export ${arrow}</button>
    `;

    container.innerHTML = menuHTML;


    // Apply positioning logic
    if (overrideConfig) {
      console.log(`UI Injector: Applying optimized locus positioning for ${platform.name}`);

      // 1. Try Anchor First (Native Locus)
      let parent = null;
      let isAnchored = false;

      if (overrideConfig.anchorSelector) {
        parent = document.querySelector(overrideConfig.anchorSelector);
        if (parent) {
          isAnchored = true;
          console.log('UI Injector: Found native anchor locus');
        }
      }

      // 2. Fallback to Parent Selector or Body
      if (!parent) {
        if (overrideConfig.parentSelector && overrideConfig.parentSelector !== 'body') {
          parent = document.querySelector(overrideConfig.parentSelector);
        }
        parent = parent || document.body;
      }

      // 3. Apply classes
      container.className = 'nr-export-container';
      if (isAnchored) {
        container.classList.add('nr-anchored');
      } else if (overrideConfig.className) {
        container.classList.add(overrideConfig.className);
      }

      // 4. Apply Styles
      const finalStyle = isAnchored ? overrideConfig.style : (overrideConfig.fixedStyle || overrideConfig.style);
      if (finalStyle) {
        // Convert style object to string for setAttribute to handle !important
        const styleString = Object.entries(finalStyle)
          .map(([k, v]) => {
            // Convert camelCase to kebap-case (e.g. zIndex -> z-index)
            const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${key}: ${v}`;
          })
          .join('; ');

        container.setAttribute('style', styleString);
      }

      // Extra: Ensure parent is relative for absolute positioning
      if (isAnchored || (overrideConfig.parentSelector && overrideConfig.parentSelector !== 'body')) {
        const currentPos = window.getComputedStyle(parent).position;
        if (currentPos === 'static') {
          parent.style.position = 'relative';
        }
      }

      parent.appendChild(container);
    } else {
      // Default positioning (others) fallback
      container.classList.add('nr-fixed');
      document.body.appendChild(container);
    }

    // Event handlers
    container.querySelector('.nr-export-btn').addEventListener('click', toggleMenu);

    container.querySelectorAll('.nr-selection-btn').forEach(btn => {
      btn.addEventListener('click', () => applySelection(btn.dataset.mode));
    });

    container.querySelectorAll('.nr-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        if (item.dataset.action === 'clear-selectors') {
          removeCheckboxes();
          closeMenu();
        } else if (item.dataset.action === 'preload-conversation') {
          handlePreload();
        } else {
          handleExport(item.dataset.action);
        }
      });
    });

    // Close menu on click outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target) && menuOpen) {
        closeMenu();
      }
    });

    console.log(`UI Injector: ${platform.name} UI loaded`);
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  // ============================================================================
  // OBSERVERS & PERSISTENCE
  // ============================================================================

  function ensureUI() {
    const currentPlatform = detectPlatform();
    if (!currentPlatform) return;

    const existing = document.querySelector('.nr-export-container');
    if (!existing) {
      console.log(`UI Injector: UI missing on ${currentPlatform.name}, re-injecting...`);
      injectUI();
    }
  }

  // Hook into History API to detect SPA navigation instantly
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    setTimeout(ensureUI, 500);
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    setTimeout(ensureUI, 500);
  };

  window.addEventListener('popstate', () => setTimeout(ensureUI, 500));

  // Fallback Watchdog: Check every 2 seconds to ensure UI hasn't been wiped by app re-renders
  const watchdog = setInterval(ensureUI, 2000);

  // Initial Injection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureUI);
  } else {
    ensureUI();
  }

  // Also clean up on extension unload if possible (though content scripts are mostly static)
  window.addEventListener('unload', () => clearInterval(watchdog));

})();
