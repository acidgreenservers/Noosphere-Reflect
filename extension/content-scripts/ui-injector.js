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
      expandSelector: '.border-border-300.rounded-lg button',
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
  const UI_OVERRIDES = {
    // Google AI Studio
    aistudio: {
      parentSelector: 'header, [role="banner"], body',
      menuDirection: 'down',
      style: {
        position: 'absolute',
        top: '14px',
        left: '150px',
        bottom: 'auto',
        right: 'auto'
      },
      className: 'nr-fixed'
    },
    // Claude.ai
    claude: {
      parentSelector: 'body',
      menuDirection: 'up',
      style: {
        position: 'fixed !important',
        bottom: '65px !important',
        right: '330px !important',
        left: 'auto !important',
        top: 'auto !important',
        zIndex: '999999 !important'
      },
      // No 'nr-fixed' class needed as we use custom fixed positioning
      className: ''
    },
    // Gemini
    gemini: {
      parentSelector: 'body',
      menuDirection: 'up',
      style: {
        position: 'fixed !important',
        bottom: '85px !important',
        right: '195px !important',
        left: 'auto !important',
        top: 'auto !important',
        zIndex: '999999 !important'
      },
      className: ''
    },
    // ChatGPT
    chatgpt: {
      parentSelector: 'body',
      menuDirection: 'up',
      style: {
        position: 'fixed !important',
        bottom: '46px !important',
        right: '210px !important',
        left: 'auto !important',
        top: 'auto !important',
        zIndex: '999999 !important'
      },
      className: ''
    },
    // Grok
    grok: {
      parentSelector: 'body',
      menuDirection: 'up',
      style: {
        position: 'fixed !important',
        bottom: '44px !important',
        right: '200px !important',
        left: 'auto !important',
        top: 'auto !important',
        zIndex: '999999 !important'
      },
      className: ''
    },
    // Le Chat
    lechat: {
      parentSelector: 'body',
      menuDirection: 'up',
      style: {
        position: 'fixed !important',
        bottom: '85px !important',
        right: '210px !important',
        left: 'auto !important',
        top: 'auto !important',
        zIndex: '999999 !important'
      },
      className: ''
    },
    // Llamacoder
    llamacoder: {
      parentSelector: 'body',
      menuDirection: 'down',
      style: {
        position: 'fixed !important',
        bottom: 'auto !important',
        right: 'auto !important',
        left: '285px',
        top: '12px',
        zIndex: '999999 !important'
      },
      className: ''
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
      transform: translateY(-1px);
      filter: brightness(1.05);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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
  let checkboxesVisible = false;
  let selectionMode = 'all'; // 'all' | 'none' | 'user' | 'ai'

  // ============================================================================
  // CHECKBOX MANAGEMENT
  // ============================================================================
  function injectCheckboxes() {
    const messages = document.querySelectorAll(platform.messageSelector);

    messages.forEach((msg, index) => {
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
      checkbox.dataset.type = type;
      checkbox.dataset.index = index;

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
          break;
        case 'none':
          cb.checked = false;
          break;
        case 'user':
          cb.checked = cb.dataset.type === 'user';
          break;
        case 'ai':
          cb.checked = cb.dataset.type === 'ai';
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
        const arrow = platform.menuDirection === 'down' ? '▼' : '▲';
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
  // MENU MANAGEMENT
  // ============================================================================
  function toggleMenu() {
    menuOpen = !menuOpen;
    const menu = document.querySelector('.nr-export-menu');
    const btn = document.querySelector('.nr-export-btn');

    if (menu) {
      menu.classList.toggle('open', menuOpen);
    }

    if (menuOpen) {
      checkboxesVisible = true;
      injectCheckboxes();
      btn.innerHTML = '✕ Close';
    } else {
      checkboxesVisible = false;
      removeCheckboxes();
      // Use correct arrow based on menu direction
      const arrow = platform.menuDirection === 'down' ? '▼' : '▲';
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
    // Priority: UI_OVERRIDES > PLATFORMS > Default (up)
    const overrideConfig = UI_OVERRIDES[platform.key];
    const platformConfig = platform;

    // Default to 'up' unless specified otherwise
    let direction = 'up';
    if (overrideConfig && overrideConfig.menuDirection) {
      direction = overrideConfig.menuDirection;
    } else if (platformConfig.menuDirection) {
      direction = platformConfig.menuDirection;
    }

    const menuDirectionClass = direction === 'up' ? '' : 'menu-down';
    const arrow = direction === 'up' ? '▲' : '▼';

    container.innerHTML = `
      <div class="nr-export-menu ${menuDirectionClass}">
        <div class="nr-menu-section">
          <div class="nr-menu-label">Select Messages</div>
          <div class="nr-selection-group">
            <button class="nr-selection-btn active" data-mode="all">All</button>
            <button class="nr-selection-btn" data-mode="user">👤 User</button>
            <button class="nr-selection-btn" data-mode="ai">🤖 AI</button>
            <button class="nr-selection-btn" data-mode="none">None</button>
          </div>
        </div>
        <div class="nr-menu-section">
          <div class="nr-menu-label">Export</div>
          <div class="nr-menu-item" data-action="import">
            📥 Import to App
          </div>
          <div class="nr-menu-item" data-action="markdown">
            📋 Copy as Markdown
          </div>
          <div class="nr-menu-item" data-action="json">
            📋 Copy as JSON
          </div>
        </div>
      </div>
      <button class="nr-export-btn">📋 Export ${arrow}</button>
    `;


    // Apply positioning logic
    if (overrideConfig) {
      console.log(`UI Injector: Applying custom positioning for ${platform.name}`);

      // 1. Find parent
      let parent = document.body;
      if (overrideConfig.parentSelector && overrideConfig.parentSelector !== 'body') {
        const found = document.querySelector(overrideConfig.parentSelector);
        if (found) parent = found;
      }

      // 2. Apply classes
      container.className = 'nr-export-container';
      if (overrideConfig.className) {
        container.classList.add(overrideConfig.className);
      }

      // 3. Apply styles
      if (overrideConfig.style) {
        // Convert style object to string for setAttribute to handle !important
        const styleString = Object.entries(overrideConfig.style)
          .map(([k, v]) => {
            // Convert camelCase to kebap-case (e.g. zIndex -> z-index)
            const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${key}: ${v}`;
          })
          .join('; ');

        container.setAttribute('style', styleString);
      }

      // Extra: Handle AI Studio specific parent relative positioning
      if (platform.key === 'aistudio' && parent !== document.body) {
        parent.style.position = parent.style.position === 'static' ? 'relative' : parent.style.position;
      }

      parent.appendChild(container);
    } else {
      // Default positioning (others)
      container.classList.add('nr-fixed');
      document.body.appendChild(container);
    }

    // Event handlers
    container.querySelector('.nr-export-btn').addEventListener('click', toggleMenu);

    container.querySelectorAll('.nr-selection-btn').forEach(btn => {
      btn.addEventListener('click', () => applySelection(btn.dataset.mode));
    });

    container.querySelectorAll('.nr-menu-item').forEach(item => {
      item.addEventListener('click', () => handleExport(item.dataset.action));
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
