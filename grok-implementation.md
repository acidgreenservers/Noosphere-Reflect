Grok AI Integration - Implementation Plan
Problem Statement
Noosphere Reflect currently supports 5 AI platforms (ChatGPT, Gemini, Claude, LeChat, Llamacoder) but lacks support for Grok, xAI's conversational AI platform. Users cannot capture, archive, or convert Grok conversations using the web app or Chrome extension.

Key Requirements
Web App: Add Grok parser mode and UI button
Chrome Extension: Full context menu support (Copy as Markdown, Copy as JSON, Save to Archive)
Parser Logic: Extract Grok-specific elements (thought blocks, code, tables, images, canvas)
Export Parity: HTML, Markdown, and JSON exports must work correctly
No Regressions: Existing platform support must remain intact
Grok HTML Structure Analysis
Based on 
grok-console-scraper.md
, Grok uses the following structure:

User Messages
<div class="relative response-content-markdown markdown ...">
  <p dir="auto" class="break-words" style="white-space: pre-wrap;">
    USER MESSAGE TEXT
  </p>
</div>
Grok Responses
<div class="relative response-content-markdown markdown ...">
  &lt;thought&gt;
  INTERNAL THOUGHT PROCESS (escaped HTML)
  &lt;/thought&gt;
  <p dir="auto" class="break-words last:mb-0" style="white-space: pre-wrap;">
    RESPONSE TEXT
  </p>
</div>
Code Blocks
<div dir="auto" class="not-prose">
  <div class="relative not-prose @container/code-block ...">
    <div class="border ... rounded-xl">
      <div class="flex ... rounded-t-xl bg-black">
        <span class="font-mono text-xs text-secondary">Python</span>
      </div>
      <div class="shiki ...">
        <pre class="shiki slack-dark" tabindex="0">
          <code>CODE CONTENT</code>
        </pre>
      </div>
    </div>
  </div>
</div>
Tables
<table dir="auto" class="w-fit min-w-[calc(var(--content-width)-13px)] ...">
  <thead class="sticky ...">
    <tr class="border-primary/10">
      <th class="break-words" data-col-size="md">HEADER</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-primary/10">
      <td class="break-words" data-col-size="md">CELL</td>
    </tr>
  </tbody>
</table>
Images
<img class="object-cover relative z-[200] w-full m-0" 
     alt="" 
     src="https://assets.grok.com/users/.../image.jpg" 
     style="aspect-ratio: 0.671233 / 1;">
Canvas (Charts)
<canvas id="xai_chart" width="755" height="425" 
        style="display: block; box-sizing: border-box; height: 425px; width: 755px;">
</canvas>
Proposed Changes
Web App Components
1. [MODIFY] 
types.ts
Location: ParserMode enum (around line 30)

Add Grok to the parser mode enumeration:

export enum ParserMode {
  Basic = 'basic',
  ChatGPT = 'chatgpt',
  Gemini = 'gemini',
  Claude = 'claude',
  LlamaCoder = 'llamacoder',
  LeChat = 'lechat',
  Grok = 'grok',  // NEW
}
2. [MODIFY] 
converterService.ts
Location: After 
parseGeminiHtml
 function (around line 1660)

Implement the Grok HTML parser:

/**
 * Specialized parser for Grok (xAI) HTML exports.
 * Extracts messages from the specific DOM structure used by Grok.
 * Handles thought blocks, code blocks, tables, images, and canvas elements.
 */
parseGrokHtml(input: string): ChatData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  const messages: ChatMessage[] = [];
  // Grok uses div.response-content-markdown for both user and AI messages
  const messageContainers = doc.querySelectorAll('div.response-content-markdown');
  messageContainers.forEach((container, index) => {
    const htmlContent = container.innerHTML;
    
    // Check if this is a Grok response (contains thought blocks or is after user message)
    const hasThought = htmlContent.includes('&lt;thought&gt;');
    const isUser = index % 2 === 0 && !hasThought;
    let content = '';
    if (hasThought) {
      // Extract and wrap thought process
      const thoughtMatch = htmlContent.match(/&lt;thought&gt;([\s\S]*?)&lt;\/thought&gt;/);
      if (thoughtMatch) {
        const thoughtContent = thoughtMatch[1].trim();
        content += `<thought>\n${escapeHtml(thoughtContent)}\n</thought>\n\n`;
      }
    }
    // Extract main content from <p> tags
    const paragraphs = container.querySelectorAll('p.break-words');
    paragraphs.forEach(p => {
      const text = p.textContent?.trim() || '';
      if (text) {
        content += text + '\n\n';
      }
    });
    // Extract code blocks
    const codeBlocks = container.querySelectorAll('div.not-prose pre code');
    codeBlocks.forEach(code => {
      const languageSpan = code.closest('div.not-prose')?.querySelector('span.font-mono');
      const language = languageSpan?.textContent?.trim() || 'plaintext';
      const codeContent = code.textContent || '';
      content += `\`\`\`${validateLanguage(language)}\n${codeContent}\n\`\`\`\n\n`;
    });
    // Extract tables
    const tables = container.querySelectorAll('table');
    tables.forEach(table => {
      content += this.extractTableMarkdown(table) + '\n\n';
    });
    // Extract images
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || 'Image';
      if (src) {
        content += `![${escapeHtml(alt)}](${sanitizeUrl(src)})\n\n`;
      }
    });
    // Extract canvas elements (charts)
    const canvases = container.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const id = canvas.getAttribute('id') || 'chart';
      content += `[Chart: ${escapeHtml(id)}]\n\n`;
    });
    // Extract Knowledge Cluster Prompts (suggested follow-up questions)
    // These appear as buttons, typically at the end of AI responses
    const clusterPrompts = container.querySelectorAll('button');
    const prompts: string[] = [];
    clusterPrompts.forEach(button => {
      const text = button.textContent?.trim() || '';
      // Filter out UI buttons (Copy, Run, etc.) - cluster prompts are longer
      if (text.length > 20 && !text.includes('Copy') && !text.includes('Run')) {
        prompts.push(text);
      }
    });
    if (prompts.length > 0) {
      content += '\n**Suggested follow-up questions:**\n';
      prompts.forEach(prompt => {
        content += `- ${escapeHtml(prompt)}\n`;
      });
      content += '\n';
    }
    if (content.trim()) {
      messages.push({
        type: isUser ? ChatMessageType.User : ChatMessageType.AI,
        content: content.trim()
      });
    }
  });
  return { messages };
}
/**
 * Helper to extract markdown table from HTML table element.
 */
private extractTableMarkdown(table: Element): string {
  const rows: string[] = [];
  
  // Extract headers
  const headers = Array.from(table.querySelectorAll('thead th'))
    .map(th => th.textContent?.trim() || '');
  
  if (headers.length > 0) {
    rows.push('| ' + headers.join(' | ') + ' |');
    rows.push('| ' + headers.map(() => '---').join(' | ') + ' |');
  }
  
  // Extract body rows
  const bodyRows = table.querySelectorAll('tbody tr');
  bodyRows.forEach(tr => {
    const cells = Array.from(tr.querySelectorAll('td'))
      .map(td => td.textContent?.trim() || '');
    if (cells.length > 0) {
      rows.push('| ' + cells.join(' | ') + ' |');
    }
  });
  
  return rows.join('\n');
}
Location: Update 
parseChat
 function (around line 200)

Add Grok case to the parser mode switch:

case ParserMode.Grok:
  return this.parseGrokHtml(input);
3. [MODIFY] 
BasicConverter.tsx
Location: Parser mode selector buttons (around line 600-700)

Add Grok button to the UI:

<button
  onClick={() => setParserMode(ParserMode.Grok)}
  className={`px-4 py-2 rounded-lg transition-colors ${
    parserMode === ParserMode.Grok
      ? 'bg-blue-600 text-white'
      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
  }`}
>
  Grok
</button>
Chrome Extension Components
4. [NEW] 
grok-capture.js
Content script for capturing Grok conversations:

// Grok Capture Content Script
// Captures conversation data from grok.com
(function() {
  'use strict';
  // Detect if we're on a Grok conversation page
  function isGrokConversation() {
    return window.location.hostname.includes('grok.com') && 
           window.location.pathname.startsWith('/c/');
  }
  // Extract conversation title
  function getConversationTitle() {
    const titleElement = document.querySelector('title');
    if (titleElement) {
      const title = titleElement.textContent.replace(' - Grok', '').trim();
      return title || 'Grok Conversation';
    }
    return 'Grok Conversation';
  }
  // Capture full conversation HTML
  function captureConversation() {
    const messageContainers = document.querySelectorAll('div.response-content-markdown');
    
    if (messageContainers.length === 0) {
      return null;
    }
    let html = '';
    messageContainers.forEach(container => {
      html += container.outerHTML + '\n\n';
    });
    return {
      title: getConversationTitle(),
      html: html,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }
  // Listen for messages from service worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'captureGrok') {
      const data = captureConversation();
      sendResponse(data);
    }
    return true;
  });
  console.log('Grok capture script loaded');
})();
5. [NEW] 
grok-parser.js
Vanilla JS parser for Grok (mirrors web app logic):

// Grok Parser - Vanilla JS version for Chrome Extension
// Mirrors the logic in converterService.ts
function parseGrokHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const messages = [];
  const messageContainers = doc.querySelectorAll('div.response-content-markdown');
  messageContainers.forEach((container, index) => {
    const htmlContent = container.innerHTML;
    const hasThought = htmlContent.includes('&lt;thought&gt;');
    const isUser = index % 2 === 0 && !hasThought;
    let content = '';
    // Extract thought blocks
    if (hasThought) {
      const thoughtMatch = htmlContent.match(/&lt;thought&gt;([\s\S]*?)&lt;\/thought&gt;/);
      if (thoughtMatch) {
        content += `<thought>\n${thoughtMatch[1].trim()}\n</thought>\n\n`;
      }
    }
    // Extract paragraphs
    const paragraphs = container.querySelectorAll('p.break-words');
    paragraphs.forEach(p => {
      const text = p.textContent?.trim() || '';
      if (text) content += text + '\n\n';
    });
    // Extract code blocks
    const codeBlocks = container.querySelectorAll('div.not-prose pre code');
    codeBlocks.forEach(code => {
      const languageSpan = code.closest('div.not-prose')?.querySelector('span.font-mono');
      const language = languageSpan?.textContent?.trim() || 'plaintext';
      content += `\`\`\`${language}\n${code.textContent}\n\`\`\`\n\n`;
    });
    // Extract tables
    const tables = container.querySelectorAll('table');
    tables.forEach(table => {
      content += extractTableMarkdown(table) + '\n\n';
    });
    // Extract images
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || 'Image';
      if (src) content += `![${alt}](${src})\n\n`;
    });
    // Extract canvas
    const canvases = container.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const id = canvas.getAttribute('id') || 'chart';
      content += `[Chart: ${id}]\n\n`;
    });
    // Extract Knowledge Cluster Prompts (suggested follow-up questions)
    const clusterPrompts = container.querySelectorAll('button');
    const prompts = [];
    clusterPrompts.forEach(button => {
      const text = button.textContent?.trim() || '';
      // Filter out UI buttons - cluster prompts are longer
      if (text.length > 20 && !text.includes('Copy') && !text.includes('Run')) {
        prompts.push(text);
      }
    });
    if (prompts.length > 0) {
      content += '\n**Suggested follow-up questions:**\n';
      prompts.forEach(prompt => {
        content += `- ${prompt}\n`;
      });
      content += '\n';
    }
    if (content.trim()) {
      messages.push({
        type: isUser ? 'user' : 'ai',
        content: content.trim()
      });
    }
  });
  return { messages };
}
function extractTableMarkdown(table) {
  const rows = [];
  
  const headers = Array.from(table.querySelectorAll('thead th'))
    .map(th => th.textContent?.trim() || '');
  
  if (headers.length > 0) {
    rows.push('| ' + headers.join(' | ') + ' |');
    rows.push('| ' + headers.map(() => '---').join(' | ') + ' |');
  }
  
  const bodyRows = table.querySelectorAll('tbody tr');
  bodyRows.forEach(tr => {
    const cells = Array.from(tr.querySelectorAll('td'))
      .map(td => td.textContent?.trim() || '');
    if (cells.length > 0) {
      rows.push('| ' + cells.join(' | ') + ' |');
    }
  });
  
  return rows.join('\n');
}
6. [MODIFY] 
manifest.json
Changes:

Add Grok host permissions
Add Grok content script
{
  "host_permissions": [
    "*://*.openai.com/*",
    "*://*.google.com/*",
    "*://*.anthropic.com/*",
    "*://*.mistral.ai/*",
    "*://llamacoder.io/*",
    "*://grok.com/*"  // NEW
  ],
  "content_scripts": [
    {
      "matches": [
        "*://*.openai.com/*",
        "*://*.google.com/*",
        "*://*.anthropic.com/*",
        "*://*.mistral.ai/*",
        "*://llamacoder.io/*",
        "*://grok.com/*"  // NEW
      ],
      "js": [
        "chatgpt-capture.js",
        "gemini-capture.js",
        "claude-capture.js",
        "lechat-capture.js",
        "llamacoder-capture.js",
        "grok-capture.js"  // NEW
      ]
    }
  ]
}
7. [MODIFY] 
service-worker.js
Location: Context menu creation (around line 20-50)

Add Grok detection and handling:

// Detect platform
function detectPlatform(url) {
  if (url.includes('grok.com')) return 'grok';
  if (url.includes('openai.com')) return 'chatgpt';
  // ... existing platforms
}
// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const platform = detectPlatform(tab.url);
  
  if (platform === 'grok') {
    chrome.tabs.sendMessage(tab.id, { action: 'captureGrok' }, (response) => {
      if (response) {
        handleGrokAction(info.menuItemId, response);
      }
    });
  }
  // ... existing platform handlers
});
function handleGrokAction(action, data) {
  const parsed = parseGrokHtml(data.html);
  
  if (action === 'copy-as-markdown') {
    const markdown = generateMarkdown(parsed, data.title);
    copyToClipboard(markdown);
  } else if (action === 'copy-as-json') {
    const json = JSON.stringify(parsed, null, 2);
    copyToClipboard(json);
  } else if (action === 'save-to-archive') {
    saveToIndexedDB({
      title: data.title,
      url: data.url,
      timestamp: data.timestamp,
      platform: 'grok',
      data: parsed
    });
  }
}
Verification Plan
Automated Tests
Unit Tests (if test suite exists):

npm test -- converterService.test.ts
Test parseGrokHtml() with sample HTML
Verify thought block extraction
Verify table parsing
Verify code block preservation
Build Verification:

npm run build
Ensure no TypeScript errors
Verify extension builds correctly
Manual Testing
Web App Testing
Parser Mode Selection:

Open BasicConverter
Verify "Grok" button appears
Click Grok button → verify it becomes active
HTML Import:

Copy content from 
grok-console-scraper.md
Paste into input area
Select "Grok" mode
Click "Convert"
Expected: Messages parsed correctly with thought blocks
Thought Block Rendering:

Verify <thought> blocks render as collapsible sections
Verify thought content is properly escaped
Code Block Preservation:

Verify Python code block renders with syntax highlighting
Verify language label is preserved
Table Rendering:

Verify table structure is preserved
Verify headers and cells render correctly
Image Handling:

Verify image URLs are sanitized
Verify alt text is preserved
Export Testing:

Export as HTML → verify structure
Export as Markdown → verify formatting
Export as JSON → verify data integrity
Chrome Extension Testing
Installation:

Load unpacked extension
Navigate to grok.com
Verify extension icon is active
Context Menu:

Right-click on Grok conversation
Verify 3 options appear:
Copy as Markdown
Copy as JSON
Save to Archive
Copy as Markdown:

Select option
Paste into text editor
Expected: Proper markdown formatting with thought blocks
Copy as JSON:

Select option
Paste into JSON validator
Expected: Valid JSON with message array
Save to Archive:

Select option
Open ArchiveHub
Expected: Conversation appears with "Grok" label
Regression Testing
Test all existing platforms to ensure no breakage:

 ChatGPT parsing still works
 Gemini parsing still works
 Claude parsing still works
 LeChat parsing still works
 Llamacoder parsing still works
Rollback Plan
If critical issues arise:

Revert Web App Changes:

git revert <commit-hash>
npm run build
Revert Extension Changes:

Remove Grok files from extension directory
Restore original 
manifest.json
 and service-worker.js
Reload extension
Database Cleanup (if needed):

Grok sessions stored in IndexedDB can be manually deleted via ArchiveHub
Success Criteria
✅ ParserMode.Grok enum added
✅ parseGrokHtml() function implemented
✅ Grok button appears in BasicConverter UI
✅ Chrome extension captures Grok conversations
✅ All 3 context menu options work (Markdown, JSON, Archive)
✅ Thought blocks render correctly
✅ Code blocks preserve syntax highlighting
✅ Tables render in markdown format
✅ Images and canvas elements handled
✅ HTML/Markdown/JSON exports work correctly
✅ No regressions in existing platform support
✅ Build succeeds without errors
Implementation Notes
Design Decisions
Thought Block Handling: Using same <thought> tag format as Claude for consistency
Message Detection: Using index-based detection (even = user, odd = AI) with thought block override
Canvas Handling: Representing as [Chart: id] placeholder since canvas content can't be serialized
Table Extraction: Converting HTML tables to markdown tables for portability
Potential Challenges
Dynamic Content: Grok may load messages dynamically; capture script should wait for full page load
Thought Block Escaping: HTML entities (&lt;, &gt;) need proper unescaping
Code Block Language Detection: Language label is in separate span; requires DOM traversal
Future Enhancements
Real-time conversation sync
Enhanced canvas chart preservation (non-API approach)