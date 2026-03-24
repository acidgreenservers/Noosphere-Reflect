/**
 * [SUPPORT DROPPED]
 *
 * AI Studio export support was removed from the extension because browser security and Google AI Studio's UI protections
 * prevent reliable clipboard automation. Scripted clicks on the "Copy Markdown" button do not always update the clipboard
 * due to user gesture requirements and anti-automation measures. This results in frequent failures or duplicate content.
 *
 * If browser or AI Studio behavior changes in the future, support may be reconsidered.
 */
/**
 * AI Studio Chat Exporter - AI Studio content script
 * Injects export button and handles export for AI Studio chat.
 *
 * Features:
 * - Export all messages in an AI Studio chat conversation to Markdown.
 * - Ignores model "thinking" states.
 * - Uses mouse hover, clicks "More options", and "Copy Markdown" for model responses.
 * - Option to hide the export button via extension popup.
 * - Robust scroll-to-load and clipboard copy logic.
 *
 * Note: Selectors and xPaths should be updated as needed from full_chat.html reference.
 */

function addExportButton({ id, buttonText, position, exportHandler }) {
  let observer;
  function ensureBtn(shouldShow) {
    let btn = document.getElementById(id);
    if (!shouldShow) {
      if (btn) btn.style.display = 'none';
      return;
    }
    if (!btn) {
      btn = document.createElement('button');
      btn.id = id;
      btn.textContent = buttonText;
      btn.style.position = 'fixed';
      btn.style.top = position.top;
      btn.style.right = position.right;
      btn.style.zIndex = '9999';
      btn.style.padding = '8px 16px';
      btn.style.background = '#1a73e8';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '6px';
      btn.style.fontSize = '1em';
      btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = 'bold';
      btn.style.transition = 'background 0.2s';
      btn.onmouseenter = () => btn.style.background = '#1765c1';
      btn.onmouseleave = () => btn.style.background = '#1a73e8';
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Exporting...';
        try {
          await exportHandler();
        } finally {
          btn.disabled = false;
          btn.textContent = buttonText;
        }
      });
      document.body.appendChild(btn);
    } else {
      btn.style.display = '';
    }
  }
  function updateBtnFromStorage() {
    try {
      if (chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['hideExportBtn'], (result) => {
          ensureBtn(!result.hideExportBtn);
        });
      }
    } catch (e) {
      // Silently ignore extension context errors
    }
  }
  updateBtnFromStorage();
  observer = new MutationObserver(() => updateBtnFromStorage());
  observer.observe(document.body, { childList: true, subtree: true });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && 'hideExportBtn' in changes) {
      updateBtnFromStorage();
    }
  });
}

addExportButton({
  id: 'aistudio-export-btn',
  buttonText: 'Export Chat',
  position: { top: '80px', right: '20px' },
  exportHandler: aistudioExportMain
});

/**
 * Main export logic for AI Studio chat.
 * - Scrolls to load all messages.
 * - Extracts user and model messages.
 * - Ignores model "thinking" states.
 * - Uses mouse hover, "More options", and "Copy Markdown" for model responses.
 * - Downloads Markdown file.
 */
async function aistudioExportMain() {
  /**
   * Returns a YYYYMMDD_HHMMSS string for filenames.
   */
  function getDateString() {
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  const now = new Date();
  const dateStr = now.toLocaleString();
  const sourceUrl = window.location.href;

  // Select all chat turns (each <ms-chat-turn> element)
  const chatTurns = document.querySelectorAll('ms-chat-turn');
  const exchanges = Math.ceil(chatTurns.length / 3);
  const totalMessages = exchanges * 2; // Rough estimate since it's 3 elements per exchange

  let markdown = `---
> **🤖 Model:** AI Studio
>
> **🌐 Date:** ${dateStr}
>
> **🌐 Source:** [AI Studio](${sourceUrl})
>
> **🏷️ Tags:** AI-Studio, Google, AI-Chat, Noosphere
>
> **📂 Artifacts:** [Internal](${sourceUrl})
>
> **📊 Metadata:**
>> **Total Exchanges:** ${exchanges}
>>
>> **Total Chat Messages:** ${totalMessages}
>>
>> **Total User Messages:** ${exchanges}
>>
>> **Total AI Messages:** ${exchanges}
>> **Total Artifacts:** 0
---

## Title:

> AI Studio Conversation

--- 

`;

  /**
   * Removes AI Studio citation markers from text (similar to Gemini).
   * @param {string} text
   * @returns {string}
   */
  function removeCitations(text) {
    return text
      .replace(/\[cite_start\]/g, '')
      .replace(/\[cite:[\d,\s]+\]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  for (let i = 0; i < chatTurns.length; i += 3) {
    // User query
    let userQuery = '';
    const userPromptContainer = chatTurns[i]?.querySelector('.user-prompt-container[data-turn-role="User"]');
    if (userPromptContainer) {
      // Clear clipboard before copy
      try { await navigator.clipboard.writeText(''); } catch (e) { }
      let attempts = 0;
      let clipboardText = '';
      while (attempts < 10) {
        userPromptContainer.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        await sleep(300);
        const moreBtn = chatTurns[i].querySelector('button[aria-label="Open options"]');
        if (moreBtn) {
          moreBtn.click();
          await sleep(200);
          const copyMarkdownBtn = Array.from(document.querySelectorAll('button.copy-markdown-button, button')).find(b => b.textContent.trim().toLowerCase().includes('copy markdown'));
          if (copyMarkdownBtn) {
            copyMarkdownBtn.click();
            await sleep(200);
            clipboardText = await navigator.clipboard.readText();
            if (clipboardText) break;
          }
        }
        attempts++;
      }
      if (!clipboardText) {
        alert('Failed to copy content from the chat. Export aborted.');
        return;
      }
      try {
        userQuery = removeCitations(clipboardText);
      } catch (e) {
        userQuery = '';
      }
    }
    if (userQuery) {
      markdown += `#### Prompt - User 👤:\n\n${userQuery}\n\n`;
    }

    // Model thinking
    let thoughtText = '';
    const modelThinkingTurn = chatTurns[i + 1];
    if (modelThinkingTurn) {
      const modelPromptContainer = modelThinkingTurn.querySelector('.model-prompt-container[data-turn-role="Model"]');
      if (modelPromptContainer) {
        const thoughtChunk = modelPromptContainer.querySelector('ms-thought-chunk');
        if (thoughtChunk && thoughtChunk.textContent.trim()) {
          thoughtText = thoughtChunk.textContent.trim();
        }
      }
    }

    // Model response
    const modelResponseTurn = chatTurns[i + 2];
    if (modelResponseTurn) {
      const modelPromptContainer = modelResponseTurn.querySelector('.model-prompt-container[data-turn-role="Model"]');
      if (modelPromptContainer) {
        // Clear clipboard before copy
        try { await navigator.clipboard.writeText(''); } catch (e) { }
        let attempts = 0;
        let clipboardText = '';
        while (attempts < 10) {
          modelPromptContainer.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          await sleep(300);
          const moreBtn = modelResponseTurn.querySelector('button[aria-label="Open options"]');
          if (moreBtn) {
            moreBtn.click();
            await sleep(200);
            const copyMarkdownBtn = Array.from(document.querySelectorAll('button.copy-markdown-button, button')).find(b => b.textContent.trim().toLowerCase().includes('copy markdown'));
            if (copyMarkdownBtn) {
              await sleep(1500);
              copyMarkdownBtn.click();
              clipboardText = await navigator.clipboard.readText();
              await sleep(1500);
              if (clipboardText) break;
            }
          }
          attempts++;
        }
        if (!clipboardText) {
          alert('Failed to copy content from the chat. Export aborted.');
          return;
        }
        try {
          clipboardText = removeCitations(clipboardText);
          markdown += `#### Response - Model 🤖:\n\n`;
          if (thoughtText) {
            markdown += "```\nThoughts:\n";
            markdown += `${thoughtText}\n`;
            markdown += "```\n\n";
          }
          markdown += `${clipboardText}\n\n`;
        } catch (e) {
          markdown += '#### Response - Model 🤖:\n\n[Note: Could not read clipboard. Please check permissions.]\n\n';
        }
      } else {
        markdown += '#### Response - Model 🤖:\n\n[Note: Model response container not found.]\n\n';
      }
    }

    if (i + 3 < chatTurns.length) {
      markdown += '---\n\n';
    }
  }

  markdown += `\n---\n\n`;
  markdown += `###### Noosphere Reflect\n`;
  markdown += `###### ***Meaning Through Memory***\n\n`;
  markdown += `###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***\n`;

  const filename = `aistudio_chat_export_${getDateString()}.md`;

  // Download as Markdown file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
