import { ChatData, ChatMessage, ChatMessageType, ChatTheme, ThemeClasses, ParserMode, ChatMetadata, SavedChatSession, ConversationManifest, ConversationArtifact, Memory } from '../types';
import { escapeHtml, sanitizeUrl, validateLanguage, sanitizeFilename, neutralizeDangerousExtension } from '../utils/securityUtils';
import JSZip from 'jszip';
import { storageService } from './storageService';

/**
 * Checks if a string is valid JSON.
 * @param text The string to check.
 * @returns True if the string is valid JSON, false otherwise.
 */
export const isJson = (text: string): boolean => {
  try {
    JSON.parse(text);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Parses chat content using Gemini AI for intelligent structure detection.
 */
const parseChatWithAI = async (input: string, apiKey: string): Promise<ChatData> => {
  if (!apiKey) {
    throw new Error('Gemini API Key is required for AI Mode. Please check your .env file or configuration.');
  }

  const prompt = `
    You are an expert chat log parser. Your task is to analyze the following unstructured or semi-structured text and convert it into a strictly valid JSON object.
    
    The JSON object MUST have a single property "messages" which is an array of objects.
    Each message object MUST have:
    - "type": either "prompt" (for user) or "response" (for AI).
    - "content": the raw strings content of the turn.
    
    CRITICAL INSTRUCTIONS:
    1. Identify the speakers distinctively. User turns usually start with "## Prompt:", "User:", or simple text questions. AI turns usually start with "## Response:", "Model:", or "AI:".
    2. PRESERVE ALL CONTENT, including code blocks, markdown tables, and specifically "Thought process" blocks (often wrapped in \`\`\`plaintext or <thought> tags).
    3. Do NOT summarize. Copy the content exactly as it appears for each turn.
    4. If the text is already JSON, just validate and return it.
    
    Input Text:
    ${input.substring(0, 30000)} // Truncate to avoid context window limits if massive
    `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonString) throw new Error('No content returned from AI');

    const parsed = JSON.parse(jsonString);
    return parsed as ChatData;

  } catch (error: any) {
    throw new Error(`AI Parsing Failed: ${error.message}`);
  }
};

/**
 * Parse JSON that was exported from this app.
 * Preserves all metadata: title, model, date, tags, author, sourceUrl.
 * This enables users to re-import their exported chat archives with full fidelity.
 */
const parseExportedJson = (exportedData: any): ChatData => {
  const messages: ChatMessage[] = exportedData.messages || [];
  const metadata = exportedData.metadata || {};

  // Validate messages array exists
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Exported JSON must contain a messages array');
  }

  // Validate each message has required fields
  for (const msg of messages) {
    if (!msg.type || !msg.content) {
      throw new Error('Each message must have type and content');
    }
    if (!['prompt', 'response'].includes(msg.type.toLowerCase())) {
      throw new Error(`Invalid message type: ${msg.type}. Must be 'prompt' or 'response'.`);
    }
  }

  return {
    messages: messages.map(msg => ({
      type: msg.type.toLowerCase() as ChatMessageType,
      content: msg.content,
      isEdited: msg.isEdited || false
    })),
    metadata: {
      title: metadata.title || 'Imported Chat',
      model: metadata.model || 'Unknown Model',
      date: metadata.date || new Date().toISOString(),
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      author: metadata.author,
      sourceUrl: metadata.sourceUrl
    }
  };
};

/**
 * Grok HTML Parser
 * Parses Grok chat HTML exports into structured ChatData.
 */
const parseGrokHtml = (input: string): ChatData => {
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

    // Handle thought blocks separately
    if (hasThought) {
      // Extract and wrap thought process
      const thoughtMatch = htmlContent.match(/&lt;thought&gt;([\s\S]*?)&lt;\/thought&gt;/);
      if (thoughtMatch) {
        // Decode entities because innerHTML gives us &lt; for <
        const encodedThought = thoughtMatch[1].trim();
        const thoughtContent = decodeHtmlEntities(encodedThought);
        content += `\n---\n<thought>\n${thoughtContent}\n</thought>\n---\n\n`;
      }
    }

    // Use extractMarkdownFromHtml to get all content comprehensively
    // This handles headings, lists, paragraphs, code blocks, tables, images, etc.
    const markdownContent = extractMarkdownFromHtml(container as HTMLElement);

    // Append the extracted markdown (thought block is already added above if present)
    if (markdownContent.trim()) {
      content += markdownContent;
    }

    if (content.trim()) {
      messages.push({
        type: isUser ? ChatMessageType.Prompt : ChatMessageType.Response,
        content: content.trim()
      });
    }
  });

  if (messages.length === 0) {
    throw new Error('No Grok-style messages found in the provided HTML. Please ensure you pasted the full conversation HTML.');
  }

  return { messages };
};

/**
 * Parses raw input (Markdown or JSON) into structured ChatData.
 * It detects messages starting with "## Prompt:", "## Response:", or "## User:".
 * @param input The raw chat content string.
 * @param fileType The explicit type of the input ('markdown' or 'json'), or 'auto' to detect.
 * @param mode The parsing mode (Basic or AI).
 * @param apiKey Optional API key for AI mode.
 * @returns A ChatData object.
 * @throws Error if parsing fails or input format is invalid.
 */
export const parseChat = async (input: string, fileType: 'markdown' | 'json' | 'auto', mode: ParserMode, apiKey?: string): Promise<ChatData> => {
  if (mode === ParserMode.AI) {
    return parseChatWithAI(input, apiKey || '');
  }

  if (mode === ParserMode.LlamacoderHtml) {
    return parseLlamacoderHtml(input);
  }

  if (mode === ParserMode.ClaudeHtml) {
    return parseClaudeHtml(input);
  }

  if (mode === ParserMode.LeChatHtml) {
    return parseLeChatHtml(input);
  }

  if (mode === ParserMode.ChatGptHtml) {
    return parseChatGptHtml(input);
  }

  if (mode === ParserMode.GeminiHtml) {
    return parseGeminiHtml(input);
  }

  if (mode === ParserMode.AiStudioHtml) {
    return parseAiStudioHtml(input);
  }

  if (mode === ParserMode.KimiHtml) {
    return parseKimiHtml(input);
  }

  if (mode === ParserMode.KimiShareCopy) {
    return parseKimiShareCopy(input);
  }

  if (mode === ParserMode.GrokHtml) {
    return parseGrokHtml(input);
  }

  // Basic Mode (Regex / JSON Detection)
  let detectedType: 'markdown' | 'json';

  if (fileType === 'auto') {
    detectedType = isJson(input) ? 'json' : 'markdown';
  } else {
    detectedType = fileType;
  }

  if (detectedType === 'json') {
    try {
      const parsed = JSON.parse(input);

      // Check if this is an exported JSON format from Noosphere Reflect
      if (parsed.exportedBy && parsed.exportedBy.tool === 'Noosphere Reflect') {
        return parseExportedJson(parsed);
      }

      if (!Array.isArray(parsed) && !parsed.messages) {
        throw new Error('Invalid JSON structure. Expected an array or an object with a "messages" array.');
      }
      const messagesArray = Array.isArray(parsed) ? parsed : parsed.messages;

      const chatMessages: ChatMessage[] = messagesArray.map((msg: any) => {
        if (!msg.type || !msg.content) {
          throw new Error('Each message in JSON must have "type" and "content" properties.');
        }
        const type = msg.type.toLowerCase();
        if (type !== ChatMessageType.Prompt && type !== ChatMessageType.Response) {
          throw new Error(`Invalid message type: ${msg.type}. Must be 'prompt' or 'response'.`);
        }
        return {
          type: type as ChatMessageType,
          content: `${msg.content}`,
        };
      });
      return { messages: chatMessages };
    } catch (e: any) {
      throw new Error(`Failed to parse JSON chat: ${e.message}`);
    }
  } else { // Markdown parsing
    const lines = input.split('\n');
    const messages: ChatMessage[] = [];
    let currentMessage: ChatMessage | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('## Prompt:')) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          type: ChatMessageType.Prompt,
          content: trimmedLine.substring('## Prompt:'.length).trim(),
        };
      } else if (trimmedLine.startsWith('## Response:')) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          type: ChatMessageType.Response,
          content: trimmedLine.substring('## Response:'.length).trim(),
        };
      } else if (trimmedLine.startsWith('## User:')) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          type: ChatMessageType.Prompt,
          content: trimmedLine.substring('## User:'.length).trim(),
        };
      } else {
        if (currentMessage) {
          currentMessage.content += `\n${line}`;
        }
      }
    }
    if (currentMessage) {
      messages.push(currentMessage);
    }

    if (messages.length === 0) {
      throw new Error('No chat messages found. Ensure messages start with "## Prompt:", "## User:", or "## Response:".');
    }

    return { messages };
  }
};

/**
 * Specialized parser for Llamacoder HTML exports.
 * Extracts messages from the specific DOM structure used by Llamacoder.
 */
const parseLlamacoderHtml = (htmlContent: string): ChatData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const messages: ChatMessage[] = [];

  // Look for the main chat container
  const container = doc.querySelector('.mx-auto.flex.w-full.max-w-prose.flex-col');

  if (!container) {
    // Fallback: try to find all prose and user bubbles regardless of container
    const allUserBubbles = Array.from(doc.querySelectorAll('.whitespace-pre-wrap.rounded.bg-white'));
    const allAiProse = Array.from(doc.querySelectorAll('.prose'));

    // This is tricky without a container to preserve order. 
    // Usually they are siblings in the same parent.
    const sections = Array.from(doc.querySelectorAll('.whitespace-pre-wrap.rounded.bg-white, .prose'));

    sections.forEach(el => {
      const isUser = el.classList.contains('whitespace-pre-wrap');
      messages.push({
        type: isUser ? ChatMessageType.Prompt : ChatMessageType.Response,
        content: isUser ? (el as HTMLElement).innerText.trim() : extractMarkdownFromHtml(el as HTMLElement)
      });
    });
  } else {
    // Iterate through children to preserve order
    for (const child of Array.from(container.children)) {
      const userBubble = child.querySelector('.whitespace-pre-wrap.rounded.bg-white');
      const aiProse = child.querySelector('.prose');

      if (userBubble) {
        messages.push({
          type: ChatMessageType.Prompt,
          content: (userBubble as HTMLElement).innerText.trim()
        });
      } else if (aiProse || child.classList.contains('prose') || child.querySelector('[class*="prose"]')) {
        // If it's an AI turn, the entire child might contain multiple blocks (prose + badges)
        messages.push({
          type: ChatMessageType.Response,
          content: extractMarkdownFromHtml(child as HTMLElement)
        });
      }
    }
  }

  if (messages.length === 0) {
    throw new Error('No Llamacoder-style messages found in the provided HTML. Please ensure you pasted the full page source or at least the chat container.');
  }

  return { messages };
};

/**
 * Specialized parser for Claude HTML content.
 */
const parseClaudeHtml = (input: string): ChatData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  const messages: ChatMessage[] = [];

  // Claude's structure can be nested, so we'll look for the primary message containers
  // but ensure we don't get duplicates if we traverse too deeply.
  const visited = new Set<Element>();

  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    if (visited.has(el)) return;
    const htmlEl = el as HTMLElement;

    // Skip Sidebar / Nav / Menus / STARRED content
    if (htmlEl.closest('nav, .sidebar, [role="navigation"], .starred-list, h3[aria-hidden="true"]')) {
      visited.add(el);
      return;
    }

    // User Message
    if (htmlEl.getAttribute('data-testid') === 'user-message' || htmlEl.classList.contains('font-user-message')) {
      const content = extractMarkdownFromHtml(htmlEl);
      if (content) {
        messages.push({ type: ChatMessageType.Prompt, content });
        // Mark children as visited to avoid double-parsing
        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
      }
    }

    // AI Message
    // Claude often Uses font-claude-response as the main wrapper for the whole turn content
    if (htmlEl.classList.contains('font-claude-response')) {
      // Check if it's already inside another response we processed
      let parent = htmlEl.parentElement;
      let isNested = false;
      while (parent) {
        if (parent.classList.contains('font-claude-response')) {
          isNested = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (isNested) return;

      const content = extractMarkdownFromHtml(htmlEl);
      if (content) {
        messages.push({ type: ChatMessageType.Response, content });
        // Mark children as visited
        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
      }
    }
  });

  if (messages.length === 0) {
    // Fallback search for simpler structures if the heavy ones failed
    const prompts = doc.querySelectorAll('.font-user-message, [data-testid="user-message"]');
    const responses = doc.querySelectorAll('.font-claude-response');

    if (prompts.length > 0 || responses.length > 0) {
      // If we found them but they weren't caught in the main loop for some reason
      // this fallback might help, but the main loop above is document-order aware.
    }
  }


  return { messages };
};

/**
 * Specialized parser for LeChat (Mistral) HTML content.
 */
const parseLeChatHtml = (input: string): ChatData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  const messages: ChatMessage[] = [];

  // LeChat structure:
  // User messages: <div class="... ms-auto ... bg-basic-gray-alpha-4 ..."> or data-message-author-role="user"
  // AI messages: data-message-author-role="assistant"
  //   > Reasoning: data-message-part-type="reasoning"
  //   > Answer: data-message-part-type="answer"

  const visited = new Set<Element>();

  // Pre-extract thinking time indicators for later use
  // Structure: animated spans spelling out "Thought for Xs"
  let pendingThinkingTime = '';
  const thinkingContainers = doc.querySelectorAll('.flex.items-center.gap-3, .shrink-0');
  thinkingContainers.forEach(container => {
    const text = (container as HTMLElement).innerText?.replace(/\s+/g, ' ').trim();
    if (text && /Thought\s*for\s*\d+s/.test(text)) {
      const timeMatch = text.match(/(\d+s)/);
      if (timeMatch) {
        pendingThinkingTime = `> ⏱️ *Thought for ${timeMatch[1]}*\n\n`;
      }
    }
  });

  // Process all likely message containers in document order
  // LeChat messages are usually top-level siblings in a container, but finding them via attributes is safer
  const allElements = doc.querySelectorAll('*');

  allElements.forEach(el => {
    if (visited.has(el)) return;
    const htmlEl = el as HTMLElement;

    // User Message
    // LeChat user bubbles often have 'ms-auto' for right alignment and a specific bg
    // Or explicit role attribute if available
    const isUserRole = htmlEl.getAttribute('data-message-author-role') === 'user';
    const isUserStyle = htmlEl.classList.contains('ms-auto') && htmlEl.classList.contains('bg-basic-gray-alpha-4');

    if (isUserRole || isUserStyle) {
      // Avoid capturing the wrapper if we already captured inner parts, 
      // but usually the wrapper IS the bubble.
      // We need to find the text content. User text is often in a span with whitespace-pre-wrap
      const contentEl = htmlEl.querySelector('.whitespace-pre-wrap') as HTMLElement || htmlEl;
      let content = extractMarkdownFromHtml(contentEl);

      // Extract timestamp for user messages
      const timestampEl = htmlEl.closest('[data-message-id]')?.querySelector('.text-sm.text-hint');
      const timestamp = timestampEl?.textContent?.trim();
      if (timestamp && !timestamp.includes('Copy')) {
        content += `\n\n*[${timestamp}]*`;
      }

      if (content) {
        messages.push({ type: ChatMessageType.Prompt, content });
        // Mark children as visited
        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
        visited.add(htmlEl);
      }
    }

    // AI Message
    if (htmlEl.getAttribute('data-message-author-role') === 'assistant') {
      let fullContent = '';

      // AI messages can have multiple parts: reasoning and answer
      // We look for them inside this container
      const parts = htmlEl.querySelectorAll('[data-message-part-type]');

      if (parts.length > 0) {
        parts.forEach(part => {
          const type = part.getAttribute('data-message-part-type');
          // For now, we trust extractMarkdownFromHtml to clean up, but we might need specific handling
          // for the reasoning block to ensure it's wrapped in <thought> if not handled yet.

          let partContent = extractMarkdownFromHtml(part as HTMLElement);

          if (type === 'reasoning') {
            // Wrap in thought tag if strictly identified as reasoning
            // remove any existing thought tags to avoid double wrapping if extractMarkdown does it
            partContent = partContent.replace(/<\/?thought>/g, '');
            // Prepend thinking time if we captured it
            const thinkingPrefix = pendingThinkingTime;
            pendingThinkingTime = ''; // Use only once
            partContent = `\n${thinkingPrefix}<thought>\n${partContent}\n</thought>\n`;
          }

          fullContent += partContent + '\n\n';
        });
      } else {
        // Fallback if no specific parts found
        fullContent = extractMarkdownFromHtml(htmlEl);
      }

      // Extract timestamp for AI messages
      const timestampEl = htmlEl.closest('[data-message-id]')?.querySelector('.text-sm.text-hint');
      const timestamp = timestampEl?.textContent?.trim();
      if (timestamp && !timestamp.includes('Copy') && fullContent.trim()) {
        fullContent = fullContent.trim() + `\n\n*[${timestamp}]*`;
      }

      if (fullContent.trim()) {
        messages.push({ type: ChatMessageType.Response, content: fullContent.trim() });
        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
        visited.add(htmlEl);
      }
    }
  });

  if (messages.length === 0) {
    throw new Error('No LeChat messages found. Please ensure you copied the full conversation HTML.');
  }

  return { messages };
};

/**
 * Helper to convert complex HTML (like Llamacoder prose) back to Markdown-ish content.
 * Focuses on preserving code blocks and basic formatting.
 */
const extractMarkdownFromHtml = (element: HTMLElement): string => {
  const clone = element.cloneNode(true) as HTMLElement;

  // 1. Handle Code Blocks
  // Standard PRE > CODE
  clone.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    const lang = code?.className.match(/language-(\w+)/)?.[1] || '';
    const codeText = (pre.innerText || pre.textContent || '').trim();
    const mdBlock = `\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`;
    pre.replaceWith(document.createTextNode(mdBlock));
  });

  // LeChat specific "Code Block" (div[data-testid="code-block"] containing code)
  clone.querySelectorAll('div[data-testid="code-block"]').forEach(div => {
    const code = div.querySelector('code');
    if (code) {
      const lang = code.className.match(/language-(\w+)/)?.[1] || '';
      const codeText = code.innerText.trim();
      const mdBlock = `\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`;
      div.replaceWith(document.createTextNode(mdBlock));
    }
  });

  // Claude specific code blocks (div with code-block__code class)
  clone.querySelectorAll('.code-block__code').forEach(el => {
    const code = el.querySelector('code');
    const container = (el as HTMLElement).closest('.flex-col');
    const langEl = container?.querySelector('.font-mono, .p-3.pb-0');
    const lang = langEl?.textContent?.trim() || '';
    const codeText = code ? code.innerText.trim() : (el as HTMLElement).innerText.trim();
    if (codeText) {
      const mdBlock = `\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`;
      // If we have a container with a language label, replace the whole thing
      if (container && (container.querySelector('.font-mono') || container.querySelector('.p-3.pb-0'))) {
        container.replaceWith(document.createTextNode(mdBlock));
      } else {
        el.replaceWith(document.createTextNode(mdBlock));
      }
    }
  });

  // 2. Handle Inline Code
  clone.querySelectorAll('code').forEach(code => {
    if (code.parentElement?.tagName !== 'PRE') {
      const text = (code.innerText || code.textContent || '').trim();
      code.replaceWith(document.createTextNode(` \`${text}\` `));
    }
  });

  // 3. Handle File Name Badges (Llamacoder specific)
  clone.querySelectorAll('span.text-gray-700').forEach(el => {
    const span = el as HTMLElement;
    const parent = span.parentElement as HTMLElement;
    if (parent && (parent.classList.contains('text-sm') || (parent.innerText || parent.textContent || '').includes(span.innerText || span.textContent || ''))) {
      const fileName = (span.innerText || span.textContent || '').trim();
      if (fileName && (fileName.includes('.') || fileName.includes('/'))) {
        parent.replaceWith(document.createTextNode(`\n\n**📄 File: ${fileName}**\n`));
      }
    }
  });

  // 4. Handle Gemini "Thinking" blocks
  // Remove these from the response since they're extracted separately
  clone.querySelectorAll('.thoughts-container, model-thoughts').forEach(thinkingBlock => {
    thinkingBlock.remove();
  });

  // 5. Handle Claude "Thought Process" blocks
  // These are often in a container with a button saying "Thought process"
  clone.querySelectorAll('button').forEach(btn => {
    const btnText = (btn.innerText || btn.textContent || '').toLowerCase();
    if (btnText.includes('thought process') || btnText.includes('extra thought')) {
      // Find the primary container for this thinking block
      // Find the primary container for this thinking block
      // We look for the specific wrapper class combination seen in Claude exports
      const container = btn.closest('.border-border-300.rounded-lg');
      if (container) {
        // We look for the HIDDEN content area specifically to avoid catching the button label
        // Claude's thought content is usually in a div that follows the button or is deep in a sibling div.
        const thoughtContentEl = container.querySelector('.font-claude-response, .standard-markdown');

        if (thoughtContentEl) {
          const thoughtText = ((thoughtContentEl as HTMLElement).innerText || (thoughtContentEl as HTMLElement).textContent || '').trim();
          // Verify we aren't just capturing the button text again
          if (thoughtText && !thoughtText.toLowerCase().includes('thought process') && !thoughtText.toLowerCase().includes('viewed memory')) {
            // Replace the ENTIRE container with the thought tag
            container.replaceWith(document.createTextNode(`\n\n---\n<thought>\n${thoughtText}\n</thought>\n---\n\n`));
            return;
          }
        }
      }
    }

    // Handle Claude "Viewed memory edits" or other tool-like buttons
    if (btnText.includes('viewed memory edits') || btnText.includes('used ') || btnText.includes('results') || btnText.includes('presented')) {
      const parent = btn.closest('.border-border-300, .rounded-lg, .flex-col');
      if (parent) {
        const results = Array.from(parent.querySelectorAll('.text-text-000, .text-text-200, .line-clamp-1'))
          .map(el => ((el as HTMLElement).innerText || (el as HTMLElement).textContent || '').trim())
          .filter(txt => txt && !txt.toLowerCase().includes('viewed') && !txt.toLowerCase().includes('presented'));

        const resultsMd = results.length > 0 ? `\n> ${results.join('\n> ')}` : '';
        const actionTitle = btn.innerText.trim() || 'Tool Action';
        btn.replaceWith(document.createTextNode(`\n\n> 🛠️ **${actionTitle}**${resultsMd}\n\n`));
        // Remove the container elements we processed
        parent.querySelectorAll('*').forEach(c => { if (c !== btn && (document.contains(c) || clone.contains(c))) (c as HTMLElement).remove() });
      }
    }
  });

  // Handle Claude Action Steps (Creating..., Running...)
  clone.querySelectorAll('.text-text-200, .text-text-100').forEach(el => {
    const parent = el.closest('.flex-row.min-h-\\[2\\.125rem\\], .hover\\:bg-bg-200');
    if (parent) {
      const text = (el as HTMLElement).innerText.trim();
      const subTextEl = parent.querySelector('.text-xs');
      const subText = subTextEl ? ` [${(subTextEl as HTMLElement).innerText.trim()}]` : '';
      const triggerWords = ['creating', 'running', 'reading', 'analyzing', 'executing', 'presented'];
      if (triggerWords.some(word => text.toLowerCase().startsWith(word))) {
        parent.replaceWith(document.createTextNode(`\n> ⚙️ **Action**: ${text}${subText}\n`));
      }
    }
  });

  // 5. Handle Claude "Artifacts" (Previews)
  clone.querySelectorAll('.artifact-block-cell, [aria-label*="Preview"]').forEach(art => {
    const title = art.querySelector('.line-clamp-1')?.innerHTML.trim() || 'Artifact';
    const subtitle = (art.querySelector('.text-xs.line-clamp-1') as HTMLElement)?.innerText.trim() || '';
    art.replaceWith(document.createTextNode(`\n\n> 📦 **Artifact: ${title}**\n> ${subtitle}\n\n`));
  });

  // 6. Handle LeChat "Context" badges (e.g. Personal Library)
  // Usually in a span with 'bg-state-soft' and 'rounded-full'
  // Preserve as special markdown format: [!BADGE:text]
  clone.querySelectorAll('.bg-state-soft.rounded-full').forEach(badge => {
    const text = (badge as HTMLElement).innerText.trim();
    if (text) {
      badge.replaceWith(document.createTextNode(`[!BADGE:${text}]`));
    }
  });

  // 7. Handle LeChat Rich Tables (Structured Data Grids)
  // These use ARIA roles instead of standard table elements
  clone.querySelectorAll('.rich-table, [role="table"]').forEach(richTable => {
    const container = richTable.closest('.rounded-card-md, .border.border-default.bg-card');
    const titleEl = container?.querySelector('.rich-table-title-bar .text-base, .border-b .text-base');
    const title = titleEl?.textContent?.trim() || 'Data Table';

    const headers = Array.from(richTable.querySelectorAll('[role="columnheader"]'))
      .map(h => (h as HTMLElement).textContent?.trim()?.replace(/\n/g, ' ') || '');

    const cells = Array.from(richTable.querySelectorAll('[role="cell"]'))
      .map(c => (c as HTMLElement).textContent?.trim()?.replace(/\n/g, ' ') || '');

    if (headers.length > 0 && cells.length > 0) {
      const colCount = headers.length;
      let mdTable = `\n\n### 📊 ${title}\n\n`;

      // Header row
      mdTable += `| ${headers.join(' | ')} |\n`;
      mdTable += `| ${headers.map(() => '---').join(' | ')} |\n`;

      // Data rows
      for (let i = 0; i < cells.length; i += colCount) {
        const row = cells.slice(i, i + colCount);
        if (row.length === colCount) {
          mdTable += `| ${row.join(' | ')} |\n`;
        }
      }

      mdTable += '\n';
      const replaceTarget = container || richTable;
      replaceTarget.replaceWith(document.createTextNode(mdTable));
    }
  });

  // 8. Handle LeChat File Attachments
  // File preview cards with badges (JSON, PDF, etc.)
  clone.querySelectorAll('.max-w-2xs').forEach(wrapper => {
    const card = wrapper.querySelector('.rounded-md.bg-muted, .relative.rounded-md');
    if (card) {
      const badge = card.querySelector('[class*="bg-badge-"], .bg-badge-emerald, .bg-badge-cyan');
      const badgeText = badge?.textContent?.trim() || 'FILE';
      const filename = card.querySelector('.line-clamp-2, p.font-medium')?.textContent?.trim();

      if (filename) {
        const fileType = badgeText.toUpperCase();
        const icon = fileType === 'JSON' ? '📋' :
          fileType === 'PDF' ? '📄' :
            fileType === 'IMAGE' ? '🖼️' : '📎';

        wrapper.replaceWith(document.createTextNode(`\n> ${icon} **Attachment**: ${filename} (${fileType})\n`));
      }
    }
  });

  // 9. Handle LeChat Tool Events (Improved icon-based detection)
  // Look for wrench icon (lucide-wrench) for tool executions
  clone.querySelectorAll('.lucide-wrench, [class*="lucide-wrench"]').forEach(icon => {
    const container = icon.closest('.w-full.overflow-hidden, .flex.w-full.flex-col, .pb-6');
    if (container) {
      // Look for tool name/description
      const toolTexts = Array.from(container.querySelectorAll('.text-md.font-medium.text-subtle'))
        .map(el => (el as HTMLElement).textContent?.trim())
        .filter(t => t && t !== 'Tool' && t !== 'executed');

      const toolName = toolTexts.length > 0 ? toolTexts.join(' ') : 'Tool Executed';
      container.replaceWith(document.createTextNode(`\n> 🔧 **${toolName}**\n`));
    }
  });

  // 10. Handle LeChat Library Search Events
  // Look for library icon (lucide-library) for library searches
  clone.querySelectorAll('.lucide-library, [class*="lucide-library"]').forEach(icon => {
    const container = icon.closest('.w-full.overflow-hidden, .flex.w-full.flex-col, .pb-6');
    if (container) {
      const queryEl = container.querySelector('.text-medium, button .text-medium, .wrap-break-word');
      const query = queryEl?.textContent?.trim() || '';

      const searchText = query ? `Searched Libraries: "${query}"` : 'Searched Libraries';
      container.replaceWith(document.createTextNode(`\n> 📚 **${searchText}**\n`));
    }
  });

  // Fallback text-based detection for Tool/Libraries (if icons not found)
  clone.querySelectorAll('.text-md.font-medium.text-subtle').forEach(el => {
    const text = el.textContent?.trim();
    if (text === 'Tool') {
      const container = el.closest('.w-full.overflow-hidden');
      if (container && document.contains(container)) {
        container.replaceWith(document.createTextNode('\n> 🔧 **Tool Executed**\n'));
      }
    }
    if (text === 'Searched') {
      const container = el.closest('.w-full.overflow-hidden');
      if (container && document.contains(container)) {
        const queryEl = container.querySelector('.text-medium');
        const query = queryEl ? queryEl.textContent?.trim() : '';
        container.replaceWith(document.createTextNode(`\n> 📚 **Searched Libraries**: ${query}\n`));
      }
    }
  });

  // 11. Handle LeChat Follow-up Questions
  // These are interactive spans with data-question attributes
  const followupQuestions: string[] = [];
  clone.querySelectorAll('.followup-block, [data-question]').forEach((block, index) => {
    const question = block.getAttribute('data-question');
    const text = (block as HTMLElement).textContent?.trim();

    if (question && text) {
      const refNum = index + 1;
      followupQuestions.push(`[^${refNum}]: ${question}`);
      block.replaceWith(document.createTextNode(`${text}[^${refNum}]`));
    }
  });


  // 8. Handle Basic HTML Formatting to Markdown
  // Bold
  clone.querySelectorAll('b, strong').forEach(el => {
    el.replaceWith(document.createTextNode(`**${el.textContent}**`));
  });
  // Italic
  clone.querySelectorAll('i, em').forEach(el => {
    el.replaceWith(document.createTextNode(`*${el.textContent}*`));
  });
  // Links
  clone.querySelectorAll('a').forEach(el => {
    const anchor = el as HTMLAnchorElement;
    const text = anchor.innerText.trim() || anchor.href;
    if (text && anchor.href) {
      anchor.replaceWith(document.createTextNode(`[${text}](${anchor.href})`));
    }
  });
  // Headings
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag, idx) => {
    clone.querySelectorAll(tag).forEach(el => {
      const hashes = '#'.repeat(idx + 1);
      el.replaceWith(document.createTextNode(`\n${hashes} ${el.textContent}\n`));
    });
  });

  // 9. Handle Lists
  clone.querySelectorAll('ul, ol').forEach(list => {
    const isOrdered = list.tagName.toLowerCase() === 'ol';
    const children = Array.from(list.children);
    let mdList = '\n';
    children.forEach((li, idx) => {
      if (li.tagName.toLowerCase() === 'li') {
        const marker = isOrdered ? `${idx + 1}.` : '*';
        // We use simple replacing here; nested lists might need recursion but this suffices for single-level
        // For correct nesting, we'd need to check ancestors.
        // But innerText will flatten it anyway. Let's prepend newline to ensure separation.
        mdList += `${marker} ${(li as HTMLElement).innerText?.trim() || (li as HTMLElement).textContent?.trim() || ''}\n`;
      }
    });
    mdList += '\n';
    list.replaceWith(document.createTextNode(mdList));
  });

  // 10. Handle Tables
  clone.querySelectorAll('table').forEach(table => {
    let mdTable = '\n';
    const rows = Array.from(table.querySelectorAll('tr'));

    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const cellTexts = cells.map(c => ((c as HTMLElement).innerText || (c as HTMLElement).textContent || '').trim().replace(/\n/g, ' ')); // Single line cells

      if (cellTexts.length > 0) {
        mdTable += `| ${cellTexts.join(' | ')} |\n`;
      }

      // Add separator after header
      if (rowIndex === 0 && row.querySelector('th')) {
        const separators = cells.map(() => '---');
        mdTable += `| ${separators.join(' | ')} |\n`;
      }
    });
    mdTable += '\n';
    table.replaceWith(document.createTextNode(mdTable));
  });

  // 11. Clean up extra buttons/SVGs (like "Copy" buttons, "Retry", "Show more", "Edit", "Delete")
  clone.querySelectorAll('button, svg, [aria-label*="Copy"], [aria-label*="Retry"], [aria-label*="Edit"], [aria-label*="Delete"], [data-testid*="action-bar"]').forEach(el => {
    // Keep internal text if relevant, but usually these are just UI noise
    // Exception: If we just turned it into a Markdown block (like Tool Executed), don't delete it again if it's new text node... 
    // but here we are iterating elements.
    if (document.contains(el) || clone.contains(el)) {
      el.remove();
    }
  });


  // Final cleanup of resulting text
  let finalText = clone.innerText || clone.textContent || '';

  // Append follow-up question footnotes if any were collected
  if (followupQuestions.length > 0) {
    finalText += `\n\n---\n**Follow-up Questions:**\n${followupQuestions.join('\n')}`;
  }

  return finalText.replace(/\n{3,}/g, '\n\n').trim();
};

const doc = () => document;


/**
 * Helper to apply inline markdown conversion to a given text.
 * @param text The text to apply inline formatting to.
 * @returns The HTML string with inline formatting.
 */
const applyInlineFormatting = (text: string): string => {
  // 1. Escape HTML FIRST (prevents XSS)
  // We escape & first to avoid double-escaping entities later
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // 2. Apply formatting to the already-escaped text

  // Convert inline code (single backticks)
  // Note: codeContent is already escaped by step 1, so we just wrap it.
  escaped = escaped.replace(/`([^`]+)`/g, (match, codeContent) => {
    return `<code class="inline-code">${codeContent}</code>`;
  });

  // Convert bold (**text** or __text__)
  escaped = escaped.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
  // Convert italic (*text* or _text_)
  escaped = escaped.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
  // Convert images ( ![alt text](url) ) - MUST BE BEFORE links
  escaped = escaped.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, (match, alt, url) => {
    const safeUrl = sanitizeUrl(url);
    return safeUrl ? `<img src="${safeUrl}" alt="${alt}" class="responsive-image inline-block my-1" />` : '';
  });
  // Convert links ([text](url))
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    const safeUrl = sanitizeUrl(url);
    return safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${text}</a>` : text;
  });

  // Convert LeChat context badges ([!BADGE:text])
  // Note: This must be AFTER link conversion to avoid conflicts
  escaped = escaped.replace(/\[!BADGE:([^\]]+)\]/g, (match, badgeText) => {
    return `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30 mx-0.5">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
        <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
        <path d="M10 9H8"></path>
        <path d="M16 13H8"></path>
        <path d="M16 17H8"></path>
      </svg>
      <span>${badgeText}</span>
    </span>`;
  });

  return escaped;
};

// Helper for parsing a list block (supports basic nesting)
interface ListParseResult {
  html: string;
  newIndex: number;
}
const parseListBlock = (lines: string[], startIndex: number): ListParseResult => {
  const listHtml: string[] = [];
  const listStack: Array<{ type: 'ul' | 'ol'; indent: number }> = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    const listItemMatch = line.match(/^(\s*)([*-+]|\d+\.)\s+(.*)/);
    // This regex ensures we only consider a line a list item if it starts with *, -, +, or 1. etc.
    // It also captures the leading whitespace for indent calculation.

    if (listItemMatch) {
      const indent = listItemMatch[1].length;
      const marker = listItemMatch[2];
      const content = listItemMatch[3];
      const type: 'ul' | 'ol' = marker.match(/^\d+\./) ? 'ol' : 'ul';

      // Check if we need to close existing lists due to decreasing indent or change of list type
      while (listStack.length > 0 &&
        (indent <= listStack[listStack.length - 1].indent || type !== listStack[listStack.length - 1].type)) {
        listHtml.push(`</li></${listStack.pop()!.type}>`);
      }

      // Open new list if it's the first item or indent increased
      if (listStack.length === 0 || indent > listStack[listStack.length - 1].indent) {
        listHtml.push(`<${type}>`);
        listStack.push({ type, indent });
      } else { // Same list type, same indent - just close previous <li> and open new one
        listHtml.push(`</li>`);
      }

      // Add the list item
      listHtml.push(`<li>${applyInlineFormatting(content)}`);
      i++;
    } else if (listStack.length > 0 && line.trim() === '') {
      // Empty line within a list item context, treat as a break if no subsequent list item
      // For now, just absorb, a more advanced parser would handle continued text
      listHtml.push('<br/>'); // Add a line break for empty lines within a list
      i++;
    }
    else {
      // Not a list item or empty line within a list, so end of the list block
      break;
    }
  }

  // Close any remaining open lists and list items
  while (listStack.length > 0) {
    listHtml.push(`</li></${listStack.pop()!.type}>`);
  }

  return { html: listHtml.join('\n'), newIndex: i };
};

// Helper for parsing a table block
interface TableParseResult {
  html: string;
  newIndex: number;
}
const parseTableBlock = (lines: string[], startIndex: number): TableParseResult => {
  const tableLines: string[] = [];
  let i = startIndex;

  // Collect all table-like lines (starting with '|')
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    tableLines.push(lines[i]);
    i++;
  }

  if (tableLines.length < 2) { // Need at least header and separator
    return { html: '', newIndex: startIndex };
  }

  const headerLine = tableLines[0];
  const separatorLine = tableLines[1];

  const headerCells = headerLine.split('|').slice(1, -1).map(s => s.trim());
  const alignments = separatorLine.split('|').slice(1, -1).map(s => {
    const trimmed = s.trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    return 'left'; // Default
  });

  let tableHtml = '<table class="min-w-full divide-y divide-gray-700 my-4 table-auto">';
  tableHtml += '<thead class="bg-gray-700"><tr>';
  headerCells.forEach((cell, idx) => {
    const alignStyle = alignments[idx] !== 'left' ? `text-align: ${alignments[idx]};` : '';
    tableHtml += `<th class="px-3 py-2 text-${alignments[idx]} text-xs font-medium text-gray-200 uppercase tracking-wider" style="${alignStyle}">${applyInlineFormatting(cell)}</th>`;
  });
  tableHtml += '</tr></thead>';
  tableHtml += '<tbody class="bg-gray-800 divide-y divide-gray-700">';

  for (let rowIdx = 2; rowIdx < tableLines.length; rowIdx++) {
    const rowCells = tableLines[rowIdx].split('|').slice(1, -1).map(s => s.trim());
    tableHtml += '<tr>';
    rowCells.forEach((cell, idx) => {
      const alignStyle = alignments[idx] !== 'left' ? `text-align: ${alignments[idx]};` : '';
      tableHtml += `<td class="px-3 py-2 whitespace-normal text-sm text-gray-100" style="${alignStyle}">${applyInlineFormatting(cell)}</td>`;
    });
    tableHtml += '</tr>';
  }

  tableHtml += '</tbody></table>';

  return { html: tableHtml, newIndex: i };
};


/**
 * Converts a markdown string to basic HTML.
 * Supports bold, italic, links, blockquotes, inline code, code blocks, lists (unordered/ordered, basic nesting), and tables.
 * @param markdown The markdown string to convert.
 * @param enableThoughts Whether to render collapsible thinking blocks.
 * @returns The HTML string.
 */
const convertMarkdownToHtml = (markdown: string, enableThoughts: boolean): string => {
  // Pre-process: Ensure thought tags are on their own lines for detection
  if (enableThoughts) {
    markdown = markdown
      .replace(/<thought>/g, '\n<thought>\n')
      .replace(/<\/thought>/g, '\n</thought>\n');
  }

  const lines = markdown.split('\n');
  const htmlOutput: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 0. Collapsible "Thought process" blocks (four backticks OR <thought> tags) - Highest precedence
    if (trimmedLine.startsWith('````') || trimmedLine.startsWith('<thought>')) {
      let blockContent = '';
      let j = i + 1;
      const isTag = trimmedLine.startsWith('<thought>');
      const endMarker = isTag ? '</thought>' : '````';

      while (j < lines.length && !lines[j].trim().startsWith(endMarker)) {
        blockContent += lines[j] + '\n';
        j++;
      }

      if (j < lines.length) {
        // Handle text appearing on the same line after the end marker
        const closingLine = lines[j].trim();
        const markerIndex = closingLine.indexOf(endMarker);
        const tailContent = closingLine.substring(markerIndex + endMarker.length).trim();
        if (tailContent) {
          // Push tail content to the next lines or handle it
          // For simplicity, we'll replace the closing line in the array if it has tail content
          // but we are already past it in terms of j.
          // Actually, we'll just prepend it to the next line if it exists, or push a new line.
          if (j + 1 < lines.length) {
            lines[j + 1] = tailContent + '\n' + lines[j + 1];
          } else {
            lines.push(tailContent);
          }
        }
        j++;
      }

      // Split content by double newlines for paragraphs within the block
      const thoughtParagraphs = blockContent.trim().split(/\n\s*\n/).map(p => {
        return `<p>${applyInlineFormatting(p).replace(/\n/g, '<br/>')}</p>`;
      }).join('');

      htmlOutput.push(`
            <details class="markdown-thought-block my-4">
              <summary class="markdown-thought-summary cursor-pointer p-2 rounded-md flex items-center justify-between text-lg font-semibold">
                Thought process: <span class="text-xs ml-2 opacity-70">(Click to expand/collapse)</span>
              </summary>
              <div class="markdown-thought-content p-3 border rounded-b-md">
                ${thoughtParagraphs}
              </div>
            </details>
        `);
      i = j;
      continue;
    }

    // 1. Code Blocks (three backticks)
    if (trimmedLine.startsWith('```')) {
      const startTag = trimmedLine;
      const lang = startTag.length > 3 ? startTag.substring(3) : '';

      // Special handling for ```thought blocks to render them uniquely
      if (lang === 'thought') {
        let blockContent = '';
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          blockContent += lines[j] + '\n';
          j++;
        }
        if (j < lines.length) j++; // Move past the closing ```

        // Split content by double newlines for paragraphs within the block
        const thoughtParagraphs = blockContent.trim().split(/\n\s*\n/).map(p => {
          return `<p>${applyInlineFormatting(p).replace(/\n/g, '<br/>')}</p>`;
        }).join('');

        htmlOutput.push(`
            <details class="markdown-thought-block my-4">
              <summary class="markdown-thought-summary cursor-pointer p-2 rounded-md flex items-center justify-between text-lg font-semibold">
                Thought process: <span class="text-xs ml-2 opacity-70">(Click to expand/collapse)</span>
              </summary>
              <div class="markdown-thought-content p-3 border rounded-b-md">
                ${thoughtParagraphs}
              </div>
            </details>
        `);
        i = j;
        continue;
      }

      // Standard Code Blocks
      const languageClass = lang ? `language-${validateLanguage(lang)}` : 'language-plaintext';
      let codeBlockContent = '';
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith('```')) {
        codeBlockContent += lines[j] + '\n';
        j++;
      }
      if (j < lines.length) j++; // Move past the closing ```

      const preHtml = `<pre class="p-2 bg-gray-900 rounded-md my-2 overflow-x-auto"><code class="${languageClass}">${codeBlockContent.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;

      htmlOutput.push(`
            <div class="relative group my-2">
                <button 
                    onclick="copyToClipboard(this)" 
                    class="absolute top-2 right-2 p-1.5 text-xs font-medium text-gray-200 bg-gray-700/80 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none z-10"
                    title="Copy code"
                >
                    Copy
                </button>
                ${preHtml}
            </div>
      `);
      i = j;
      continue;
    }

    // 2. Tables
    // Check if the current line starts a table (must contain '|' and not be a list item/blockquote, etc.)
    // And has a separator line below it.
    if (trimmedLine.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().match(/^\|?:?-+:?\|/)) {
      const tableResult = parseTableBlock(lines, i);
      if (tableResult.html) {
        htmlOutput.push(tableResult.html);
        i = tableResult.newIndex;
        continue;
      }
    }

    // 3. Horizontal Rules
    const hrMatch = trimmedLine.match(/^\s*((\*{3,})|(-){3,}|(_){3,})\s*$/);
    if (hrMatch) {
      htmlOutput.push('<hr class="my-6 border-gray-600" />');
      i++;
      continue;
    }

    // 4. Headings
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingContent = applyInlineFormatting(headingMatch[2].trim());
      htmlOutput.push(`<h${level}>${headingContent}</h${level}>`);
      i++;
      continue;
    }

    // 5. Lists (Unordered and Ordered)
    const listItemMatch = trimmedLine.match(/^(\s*)([*-+]|\d+\.)\s+(.*)/);
    if (listItemMatch) {
      const listResult = parseListBlock(lines, i);
      htmlOutput.push(listResult.html);
      i = listResult.newIndex;
      continue;
    }

    // 6. Blockquotes
    if (trimmedLine.startsWith('>') && !trimmedLine.match(/^>\s*$/)) { // Handle empty blockquotes gracefully
      let blockquoteContent = '';
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('>')) {
        // Remove the '>' and any leading/trailing space immediately after
        const contentLine = lines[j].trim().substring(1).trim();
        blockquoteContent += contentLine + '\n';
        j++;
      }
      // Apply inline formatting and handle potential paragraph breaks within a blockquote
      // Split by empty lines to create paragraphs within the blockquote
      const blockquoteParagraphs = blockquoteContent.trim().split(/\n\s*\n/).map(p => {
        // Replace remaining single newlines with <br/> within each paragraph
        return `<p>${applyInlineFormatting(p).replace(/\n/g, '<br/>')}</p>`;
      }).join('');
      htmlOutput.push(`<blockquote class="border-l-4 border-gray-500 pl-4 italic my-2">${blockquoteParagraphs}</blockquote>`);
      i = j;
      continue;
    }

    // 6.5 Horizontal Rules
    if (trimmedLine.match(/^\s*((\*{3,})|(-){3,}|(_){3,})\s*$/)) {
      htmlOutput.push('<hr class="my-6 border-t border-[var(--border)]" />');
      i++;
      continue;
    }

    // 7. Paragraphs (or other non-block content)
    if (trimmedLine.length > 0) {
      // Collect consecutive non-empty lines into a single paragraph
      let paragraphContent = line;
      let j = i + 1;
      while (j < lines.length && lines[j].trim().length > 0
        // Ensure we don't accidentally consume lines belonging to other block types
        && !lines[j].trim().startsWith('## ') // Not a new chat turn
        && !lines[j].trim().startsWith('```') // Not a code block
        && !lines[j].trim().startsWith('````') // Not a thought block
        && !lines[j].trim().startsWith('|')   // Not a table
        && !lines[j].trim().match(/^(\s*)([*-+]|\d+\.)\s+(.*)/) // Not a list item
        && !lines[j].trim().startsWith('>') // Not a blockquote
        && !lines[j].trim().match(/^(#{1,6})\s+(.*)$/) // Not a heading
        && !lines[j].trim().match(/^\s*((\*{3,})|(-){3,}|(_){3,})\s*$/) // Not a horizontal rule
      ) {
        paragraphContent += '\n' + lines[j];
        j++;
      }
      htmlOutput.push(`<p>${applyInlineFormatting(paragraphContent).replace(/\n/g, '<br/>')}</p>`);
      i = j;
      continue;
    } else {
      // Skip empty lines to allow block element margins to handle spacing
    }
    i++;
  }

  return htmlOutput.join('\n');
};

// Define theme classes
const themeMap: Record<ChatTheme, ThemeClasses> = {
  [ChatTheme.DarkDefault]: {
    htmlClass: 'dark',
    bodyBg: 'bg-gray-900',
    bodyText: 'text-gray-100',
    containerBg: 'bg-gray-800',
    titleText: 'text-blue-400',
    promptBg: 'bg-blue-700',
    responseBg: 'bg-gray-700',
    blockquoteBorder: 'border-gray-500',
    codeBg: 'bg-gray-800',
    codeText: 'text-yellow-300',
  },
  [ChatTheme.LightDefault]: {
    htmlClass: '',
    bodyBg: 'bg-gray-50',
    bodyText: 'text-gray-900',
    containerBg: 'bg-white',
    titleText: 'text-blue-600',
    promptBg: 'bg-blue-200',
    responseBg: 'bg-gray-200',
    blockquoteBorder: 'border-gray-400',
    codeBg: 'bg-gray-100',
    codeText: 'text-purple-700',
  },
  [ChatTheme.DarkGreen]: {
    htmlClass: 'dark',
    bodyBg: 'bg-gray-900',
    bodyText: 'text-gray-100',
    containerBg: 'bg-gray-800',
    titleText: 'text-green-400',
    promptBg: 'bg-green-700',
    responseBg: 'bg-gray-700',
    blockquoteBorder: 'border-gray-500',
    codeBg: 'bg-gray-800',
    codeText: 'text-yellow-300',
  },
  [ChatTheme.DarkPurple]: {
    htmlClass: 'dark',
    bodyBg: 'bg-gray-900',
    bodyText: 'text-gray-100',
    containerBg: 'bg-gray-800',
    titleText: 'text-purple-400',
    promptBg: 'bg-purple-700',
    responseBg: 'bg-gray-700',
    blockquoteBorder: 'border-gray-500',
    codeBg: 'bg-gray-800',
    codeText: 'text-yellow-300',
  },
};

/**
 * Generates a standalone HTML file content from ChatData.
 * @param chatData The structured chat data.
 * @param title The title for the generated HTML file.
 * @param theme The chosen theme for the HTML output.
 * @param userName Custom name for the user in the output.
 * @param aiName Custom name for the AI in the output.
 * @param parserMode The parser mode used (affects structure/collapsibility)
 * @returns A string containing the full HTML content.
 */
export const generateHtml = (
  chatData: ChatData,
  title: string = 'AI Chat Export',
  theme: ChatTheme = ChatTheme.DarkDefault,
  userName: string = 'User',
  aiName: string = 'AI',
  parserMode: ParserMode = ParserMode.Basic,
  metadata?: ChatMetadata,
  includeFooter: boolean = true
): string => {
  const selectedThemeClasses = themeMap[theme];
  const {
    htmlClass,
    bodyBg,
    bodyText,
    containerBg,
    titleText,
    promptBg,
    responseBg,
    blockquoteBorder,
    codeBg,
    codeText,
  } = selectedThemeClasses;

  const enableThoughts = [ParserMode.AI, ParserMode.ClaudeHtml, ParserMode.LeChatHtml, ParserMode.LlamacoderHtml, ParserMode.ChatGptHtml, ParserMode.GeminiHtml].includes(parserMode);

  const chatMessagesHtml = chatData.messages
    .map((message, index) => {
      const isPrompt = message.type === ChatMessageType.Prompt;

      // GEMINI-SPECIFIC: Check if this is a thought block (wrapped in <thought> tags)
      const thoughtMatch = message.content.match(/<thought>([\s\S]*?)<\/thought>/);
      const isGeminiThought = parserMode === ParserMode.GeminiHtml && thoughtMatch;

      // For Gemini thoughts, extract and render as a special chat bubble
      if (isGeminiThought) {
        const thoughtContent = thoughtMatch[1].trim();
        const thoughtHtml = convertMarkdownToHtml(thoughtContent, false);

        return `
        <div class="flex justify-start mb-4 w-full" data-message-index="${index}">
          <div class="max-w-xl md:max-w-2xl lg:max-w-3xl rounded-xl p-4 shadow-lg bg-purple-900 text-gray-200 break-words w-auto border-l-4 border-purple-500">
            <div class="flex items-center gap-2 mb-2">
              <p class="font-semibold text-sm opacity-80">💭 Thought</p>
            </div>
            <div class="markdown-content text-sm italic">${thoughtHtml}</div>
          </div>
        </div>
        `;
      }

      // Regular message rendering
      const bgColor = isPrompt ? promptBg : responseBg;
      const justify = isPrompt ? 'justify-end' : 'justify-start';
      const speakerName = isPrompt ? userName : aiName; // Use custom names
      const messageNumber = index + 1; // Message numbering starts at 1

      // For Gemini responses with thoughts: strip the <thought> tags before rendering
      // so the response only shows the main content (thought is shown separately above)
      let contentToRender = message.content;
      if (parserMode === ParserMode.GeminiHtml) {
        contentToRender = contentToRender.replace(/<thought>[\s\S]*?<\/thought>\s*/g, '').trim();
      }

      // Apply theme-specific classes to code blocks and blockquotes generated by convertMarkdownToHtml
      const contentHtml = convertMarkdownToHtml(contentToRender, enableThoughts)
        .replace(/<pre class="p-2 bg-gray-900 rounded-md my-2 overflow-x-auto">/g, `<pre class="p-2 ${codeBg} rounded-md my-2 overflow-x-auto">`)
        .replace(/<code class="language-/g, `<code class="${codeText} language-`) // For fenced code blocks
        .replace(/<code class="inline-code">/g, `<code class="${codeBg} ${codeText} px-1 py-0.5 rounded text-sm">`) // For inline code
        .replace(/<blockquote class="border-l-4 border-gray-500 pl-4 italic my-2">/g, `<blockquote class="border-l-4 ${blockquoteBorder} pl-4 italic text-gray-300 my-2">`)
        // Apply theme-specific classes to the collapsible thought block (only if present)
        .replace(/<details class="markdown-thought-block my-4">/g, `<details class="markdown-thought-block my-4">`) // Base details tag
        .replace(/<summary class="markdown-thought-summary/g, `<summary class="markdown-thought-summary bg-gray-600 text-gray-200 hover:bg-gray-500 active:bg-gray-700`) // Summary
        .replace(/<div class="markdown-thought-content/g, `<div class="markdown-thought-content bg-gray-700 text-gray-100 border-gray-600`); // Content div

      // Check for artifacts linked to this message
      const linkedArtifacts = metadata?.artifacts?.filter(
        artifact => artifact.insertedAfterMessageIndex === index
      ) || [];

      // Generate artifact HTML if any are linked
      const artifactsHtml = linkedArtifacts.length > 0 ? `
        <div class="mt-4 pt-3 border-t border-gray-600">
          <p class="text-xs text-gray-400 mb-2">📎 Attached Files:</p>
          ${linkedArtifacts.map(artifact => {
        const isImage = artifact.mimeType.startsWith('image/');
        const artifactPath = `artifacts/${escapeHtml(artifact.fileName)}`;

        if (isImage) {
          return `
                <div class="mb-2">
                  <a href="${artifactPath}" target="_blank" class="text-blue-400 hover:underline text-sm">
                    ${escapeHtml(artifact.fileName)}
                  </a>
                  <img src="${artifactPath}" alt="${escapeHtml(artifact.fileName)}" class="mt-2 max-w-full rounded border border-gray-600" style="max-height: 300px;" />
                </div>
              `;
        } else {
          return `
                <div class="mb-1">
                  <a href="${artifactPath}" target="_blank" class="text-blue-400 hover:underline text-sm flex items-center gap-2">
                    <span>📄</span>
                    <span>${escapeHtml(artifact.fileName)}</span>
                    <span class="text-xs text-gray-500">(${(artifact.fileSize / 1024).toFixed(1)} KB)</span>
                  </a>
                </div>
              `;
        }
      }).join('')}
        </div>
      ` : '';

      return `
        <div class="flex ${justify} mb-4 w-full" data-message-index="${index}">
          <div class="max-w-xl md:max-w-2xl lg:max-w-3xl rounded-xl p-4 shadow-lg ${bgColor} text-white break-words w-auto">
            <div class="flex items-center gap-2 mb-2">
              <p class="font-semibold text-sm opacity-80">#${messageNumber} ${escapeHtml(speakerName)}</p>
            </div>
            <div class="markdown-content">${contentHtml}</div>
            ${artifactsHtml}
          </div>
        </div>
      `;
    })
    .join('');

  const scrollbarTrack = htmlClass === 'dark' ? '#1a202c' : '#e2e8f0'; // Darker track for dark, lighter for light
  const scrollbarThumb = htmlClass === 'dark' ? '#4a5568' : '#cbd5e0'; // Gray thumb for dark, lighter gray for light
  const scrollbarThumbHover = htmlClass === 'dark' ? '#6b7280' : '#a0aec0'; // Lighter gray on hover

  return `<!DOCTYPE html>
<html lang="en" class="${htmlClass}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <!-- Tailwind CSS CDN for offline viewing -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style type="text/tailwindcss">
      @layer base {
        body {
          @apply ${bodyBg} ${bodyText} font-sans leading-relaxed;
        }
        strong {
            @apply font-bold;
        }
        em {
            @apply italic;
        }
        a {
            @apply text-blue-400 hover:underline;
        }
        code { /* Default for pre > code */
            @apply ${codeBg} ${codeText} px-1 py-0.5 rounded text-sm;
        }
        code.inline-code { /* Specific for inline code */
            @apply ${codeBg} ${codeText} px-1 py-0.5 rounded text-sm;
        }
        pre > code { /* For code blocks */
            @apply block p-2 ${codeBg} rounded-md overflow-x-auto ${codeText};
        }
        blockquote {
            @apply border-l-4 ${blockquoteBorder} pl-4 italic text-gray-300 my-2;
        }
        .markdown-content ul, .markdown-content ol {
            @apply list-inside ml-4 my-2;
        }
        .markdown-content ul {
            @apply list-disc;
        }
        .markdown-content ol {
            @apply list-decimal;
        }
        .markdown-content li {
            @apply mb-1;
        }
        .markdown-content table {
            @apply min-w-full divide-y divide-gray-700 my-4 table-auto border-collapse;
        }
        .markdown-content thead {
            @apply bg-gray-700;
        }
        .markdown-content th, .markdown-content td {
            @apply px-3 py-2 text-sm text-gray-100 border border-gray-600;
        }
        .markdown-content th {
            @apply text-xs font-medium text-gray-200 uppercase tracking-wider text-left;
        }
        .markdown-content tbody tr:nth-child(odd) {
            @apply bg-gray-800;
        }
        .markdown-content tbody tr:nth-child(even) {
            @apply bg-gray-700;
        }
        
        /* Thought Block Styles (dependent on parser mode) */
        .markdown-content .markdown-thought-summary {
            @apply bg-gray-600 text-gray-200 hover:bg-gray-500 active:bg-gray-700 transition-colors;
        }
        .markdown-content .markdown-thought-content {
            @apply bg-gray-700 text-gray-100 border-gray-600;
        }
        .markdown-thought-block summary::marker {
            content: '► '; /* Custom marker for collapsed state */
            @apply text-gray-400;
        }
        .markdown-thought-block[open] summary::marker {
            content: '▼ '; /* Custom marker for expanded state */
        }
        
        /* New Markdown Element Styles */
        .markdown-content h1 { @apply text-3xl font-extrabold mt-6 mb-4 text-blue-300; }
        .markdown-content h2 { @apply text-2xl font-bold mt-5 mb-3 text-blue-200; }
        .markdown-content h3 { @apply text-xl font-semibold mt-4 mb-2 text-blue-100; }
        .markdown-content h4 { @apply text-lg font-medium mt-3 mb-2; }
        .markdown-content h5 { @apply text-base font-medium mt-2 mb-1; }
        .markdown-content h6 { @apply text-sm font-medium mt-2 mb-1; }

        .markdown-content hr {
            @apply my-6 border-t-2 border-gray-600;
        }

        .markdown-content img.responsive-image {
            @apply max-w-full h-auto rounded-md my-2;
        }
        .markdown-content p {
            /* Default paragraph spacing, Tailwind's default applies some margin */
            @apply my-2;
        }
      }
      /* Custom scrollbar styles based on theme */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: ${scrollbarTrack};
      }
      ::-webkit-scrollbar-thumb {
        background: ${scrollbarThumb};
        border-radius: 4px;
      }
    </style>
    <!-- MathJax for rendering equations -->
    <script>
      window.MathJax = {
        tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
        svg: { fontCache: 'global' },
        startup: {
            typeset: false // We will typeset manually if needed, or rely on auto - auto is default actually
        }
      };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script>
    function copyToClipboard(btn) {
      const container = btn.parentElement;
      const pre = container.querySelector('pre');
      const code = pre.innerText;
      navigator.clipboard.writeText(code).then(() => {
         const originalText = btn.innerText;
         btn.innerText = 'Copied!';
         setTimeout(() => { btn.innerText = originalText; }, 2000);
      }).catch(err => {
         console.error('Failed to copy:', err);
         btn.innerText = 'Error';
      });
    }
    </script>
</head>
<body class="p-8">
    <div class="max-w-4xl mx-auto my-8 p-6 ${containerBg} rounded-lg shadow-xl">
        <h1 class="text-4xl font-extrabold text-center ${titleText} mb-4">${escapeHtml(title)}</h1>

        <!-- Metadata Section -->
        <div class="text-center text-sm ${bodyText} opacity-70 mb-8 space-y-1">
            ${metadata?.model ? `<div><strong>Model:</strong> ${escapeHtml(metadata.model)}</div>` : ''}
            ${metadata?.date ? `<div><strong>Date:</strong> ${escapeHtml(new Date(metadata.date).toLocaleString())}</div>` : ''}
            ${metadata?.sourceUrl ? (() => {
      const safeUrl = sanitizeUrl(metadata.sourceUrl);
      return safeUrl ? `<div><strong>Source:</strong> <a href="${escapeHtml(safeUrl)}" class="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">${escapeHtml(safeUrl)}</a></div>` : '';
    })() : ''}
            ${metadata?.tags && metadata.tags.length > 0 ? `<div><strong>Tags:</strong> ${metadata.tags.map(tag => escapeHtml(tag)).join(', ')}</div>` : ''}
        </div>

        <div class="space-y-4 flex flex-col w-full">
            ${chatMessagesHtml}
        </div>

        ${includeFooter ? `
        <!-- Noosphere Footer -->
        <div class="text-center text-xs ${bodyText} opacity-50 mt-16 pt-8 border-t border-gray-700">
            <p class="mt-8"><strong>Noosphere Reflect</strong></p>
            <p class="text-xs italic">${'Preserving Meaning Through Memory'}</p>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
};

/**
 * Generates a Markdown representation of a chat session.
 * @param chatData The parsed chat data with messages and metadata
 * @param title The title of the chat
 * @param userName Custom name for user messages
 * @param aiName Custom name for AI messages
 * @param metadata Optional metadata to include in the output
 * @returns A string containing the markdown content
 */
export const generateMarkdown = (
  chatData: ChatData,
  title: string = 'AI Chat Export',
  userName: string = 'User',
  aiName: string = 'AI',
  metadata?: ChatMetadata
): string => {
  const lines: string[] = [];

  // Header section
  lines.push(`# ${title}\n`);

  if (metadata) {
    if (metadata.model) lines.push(`**Model:** ${metadata.model}`);
    if (metadata.date) lines.push(`**Date:** ${new Date(metadata.date).toLocaleString()}`);
    if (metadata.sourceUrl) lines.push(`**Source:** [${metadata.sourceUrl}](${metadata.sourceUrl})`);
    if (metadata.tags && metadata.tags.length > 0) lines.push(`**Tags:** ${metadata.tags.join(', ')}`);
    if (lines.length > 1) lines.push('');
    lines.push('---\n');
  }

  // Messages
  chatData.messages.forEach((message, index) => {
    const messageNumber = index + 1;
    const speakerName = message.type === ChatMessageType.Prompt ? userName : aiName;
    lines.push(`## #${messageNumber} ${speakerName}\n`);

    // Convert thought blocks to collapsible details
    let content = message.content;
    content = content.replace(
      /\<thought\>([\s\S]*?)\<\/thought\>/g,
      '\n```thought\n$1\n```\n'
    );

    lines.push(content);

    // Check for artifacts linked to this message
    const linkedArtifacts = metadata?.artifacts?.filter(
      artifact => artifact.insertedAfterMessageIndex === index
    ) || [];

    if (linkedArtifacts.length > 0) {
      lines.push('\n**📎 Attached Files:**\n');
      linkedArtifacts.forEach(artifact => {
        const artifactPath = `artifacts/${artifact.fileName}`;
        const fileSize = (artifact.fileSize / 1024).toFixed(1);
        lines.push(`- [${artifact.fileName}](${artifactPath}) (${fileSize} KB)`);
      });
    }

    lines.push('');
  });

  // Footer
  lines.push('---\n');
  lines.push('# Noosphere Reflect');
  lines.push('*Meaning Through Memory*');

  return lines.join('\n');
};

/**
 * Specialized parser for ChatGPT HTML exports.
 * Extracts messages from the specific DOM structure used by ChatGPT.
 */
const parseChatGptHtml = (input: string): ChatData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  const messages: ChatMessage[] = [];

  // Find all conversation turns (each turn is an article with data-turn-id)
  const turns = doc.querySelectorAll('article[data-turn-id]');

  turns.forEach((turn) => {
    const role = (turn as HTMLElement).getAttribute('data-turn');

    if (role === 'user') {
      // Extract user message from bubble
      const messageBubble = turn.querySelector('.user-message-bubble-color') as HTMLElement;
      if (messageBubble) {
        const content = extractMarkdownFromHtml(messageBubble);
        if (content) {
          messages.push({
            type: ChatMessageType.Prompt,
            content: content.trim()
          });
        }
      }
    } else if (role === 'assistant') {
      // Extract assistant message
      const messageDiv = turn.querySelector('[data-message-author-role="assistant"]') as HTMLElement;
      if (messageDiv) {
        const content = extractMarkdownFromHtml(messageDiv);
        if (content) {
          messages.push({
            type: ChatMessageType.Response,
            content: content.trim()
          });
        }
      }
    }
  });

  return { messages };
};

/**
 * Helper: Check if an HTML element is nested inside a Gemini thinking block.
 * Uses two-phase detection because DOMParser doesn't properly nest custom elements.
 *
 * @param element The HTML element to check
 * @returns true if element is inside a thinking block, false otherwise
 */
const isInsideThinkingBlock = (element: HTMLElement): boolean => {
  // Phase 1: Fast path - Try closest() selectors
  if (element.closest('.thoughts-container, .model-thoughts, model-thoughts')) {
    return true;
  }

  // Phase 2: Fallback - Manually walk parent chain
  // This handles cases where DOMParser breaks custom element nesting
  let parent = element.parentElement;
  while (parent) {
    // Check for thinking block markers
    // Safe casting to Element to access classList/getAttribute
    if (parent.getAttribute && (
      parent.getAttribute('data-test-id') === 'model-thoughts' ||
      parent.classList?.contains('thoughts-content') ||
      parent.classList?.contains('model-thoughts') ||
      parent.tagName.toLowerCase() === 'model-thoughts'
    )) {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
};

/**
 * Specialized parser for Google Gemini HTML exports.
 * Extracts messages from the specific DOM structure used by Gemini.
 * 
 * DOM Structure (from gemini-console-scraper.md):
 * - User Query: .conversation-container user-query .query-text
 * - Thinking: .thoughts-container model-thoughts [data-test-id="thoughts-content"] .markdown
 * - Response: model-response .message-content .markdown
 */
const parseGeminiHtml = (input: string): ChatData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  const messages: ChatMessage[] = [];

  // Strategy for Console Exports (Full Page HTML):
  // 1. Identify "Turns": User Query node -> Optional Thinking nodes -> Response node
  // 2. Thinking content is in <message-content id=""> (empty string)
  // 3. Response content is in <message-content id="message-content-id-r_...">
  // 4. Use DESTRUCTIVE READ on thinking to prevent bleed (it often sits inside containers that standard selectors might grab)

  // A. Handle Console Export Structure (e.g. from gemini-console-scraper.md)
  // We iterate through all relevant nodes in document order to reconstruct the flow.
  // The structure is flat-ish: headers, paragraphs, custom elements all mixed.

  // Select all potential signal nodes in order
  const allNodes = Array.from(doc.querySelectorAll(
    // User prompts
    'div.query-text, div[role="heading"][aria-level="2"], ' +
    // Thinking containers (or direct content)
    'model-thoughts, .thoughts-container, ' +
    // Message content (thinking OR response)
    'message-content'
  ));

  let currentTurn: { prompt?: string; thoughts?: string; response?: string } = {};

  const flushTurn = () => {
    if (currentTurn.prompt) {
      messages.push({ type: ChatMessageType.Prompt, content: currentTurn.prompt });
    }

    // Combine thoughts and response
    if (currentTurn.response || currentTurn.thoughts) {
      let fullContent = '';
      if (currentTurn.thoughts) {
        fullContent += `\n---\n<thought>\n${currentTurn.thoughts}\n</thought>\n---\n\n`;
      }
      if (currentTurn.response) {
        fullContent += currentTurn.response;
      }
      messages.push({ type: ChatMessageType.Response, content: fullContent.trim() });
    }
    currentTurn = {};
  };

  const processedNodes = new Set<Element>();

  allNodes.forEach((node) => {
    if (processedNodes.has(node)) return;

    // 1. Detect User Prompt
    if (node.classList.contains('query-text') || (node.getAttribute('role') === 'heading' && node.getAttribute('aria-level') === '2')) {
      // If we have a pending turn with content, flush it
      if (currentTurn.prompt || currentTurn.response || currentTurn.thoughts) {
        flushTurn();
      }

      const content = extractMarkdownFromHtml(node as HTMLElement);
      if (content && content.trim()) {
        currentTurn.prompt = content.trim();
      }
      processedNodes.add(node);
    }

    // 2. Detect Thinking (and destructively consume)
    // Structure: <model-thoughts> -> ... -> <message-content id="">
    else if (node.tagName.toLowerCase() === 'model-thoughts' || node.classList.contains('thoughts-container')) {
      // Look for ALL message-content elements inside (may be multiple)
      const thinkingElements = node.querySelectorAll('message-content');

      if (thinkingElements.length > 0) {
        thinkingElements.forEach((thinkingEl) => {
          const htmlEl = thinkingEl as HTMLElement;
          const content = extractMarkdownFromHtml(htmlEl);
          if (content && content.trim()) {
            currentTurn.thoughts = (currentTurn.thoughts || '') + '\n\n' + content.trim();
          }
          // CRITICAL: Mark as processed so step 3 skips it
          processedNodes.add(thinkingEl);
        });
      } else {
        // Fallback: Check for data-test-id="thoughts-content" or direct markdown
        const fallbackThoughts = node.querySelector('[data-test-id="thoughts-content"] .markdown, .markdown');
        if (fallbackThoughts) {
          const content = extractMarkdownFromHtml(fallbackThoughts as HTMLElement);
          if (content && content.trim()) {
            currentTurn.thoughts = (currentTurn.thoughts || '') + content.trim();
          }
        }
      }
      processedNodes.add(node);
    }

    // 3. Detect Response
    // Structure: <message-content id="message-content-id-r_...">
    else if (node.tagName.toLowerCase() === 'message-content') {
      const htmlEl = node as HTMLElement;

      // CRITICAL: Skip message-content that's inside thinking blocks
      // Check BEFORE attempting extraction to prevent bleed
      const isThinking = isInsideThinkingBlock(htmlEl);

      if (isThinking) {
        // This message-content is NESTED inside a thinking block
        // It will be handled by the thinking block processor (step 2)
        // Skip it here to prevent double-extraction
        processedNodes.add(node);
        return; // Skip to next node
      }

      const id = node.getAttribute('id') || '';

      // CASE A: It's a Response
      if (id.startsWith('message-content-id-r_')) {
        const content = extractMarkdownFromHtml(node as HTMLElement);
        if (content && content.trim()) {
          currentTurn.response = (currentTurn.response || '') + content.trim();
        }
        processedNodes.add(node);
      }
      // CASE B: It's a Thinking block (orphaned or direct sibling)
      // Only process if NOT already handled by step 2 (checked via processedNodes)
      else {
        const content = extractMarkdownFromHtml(node as HTMLElement);
        if (content && content.trim()) {
          // If we already have a response, this might be a new thinking block for the NEXT turn (rare but possible)
          // But usually, thinking comes before response.
          // If we have a response but no new prompt, it's weird. Append to thoughts of current turn?
          // Safest: Append to thoughts.
          currentTurn.thoughts = (currentTurn.thoughts || '') + content.trim();
        }
        processedNodes.add(node);
      }
    }
  });

  // Flush final turn
  flushTurn();

  // Fallback: If the new strategy found nothing (e.g. copying just a snippet), try the legacy loop
  if (messages.length === 0) {
    // Legacy Code (preserved for snippet parsing compatibility)
    const specificConversation = doc.querySelector('.conversation-container');
    if (specificConversation) {
      // ... (Existing legacy logic could go here if needed, but the new global strategy usually covers it)
    }
  }

  if (messages.length === 0) {
    throw new Error('No Gemini-style messages found in the provided HTML. Please ensure you pasted the full conversation HTML.');
  }

  return { messages };
};

/**
 * Specialized parser for Google AI Studio console HTML exports.
 * Extracts messages from the actual DOM structure used by AI Studio console interface.
 *
 * Real DOM Structure (verified from aistudio.google.com/apps):
 * - Turns: .turn-container > .turn (with .input or .output classes)
 * - Headers: .turn-header[role="heading"] containing speaker name text
 * - Thinking: <ms-expandable-turn> with "Thought for X seconds" text
 * - Content: <ms-console-turn> > <ms-cmark-node> > span.ng-star-inserted
 */
const parseAiStudioHtml = (input: string): ChatData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  const messages: ChatMessage[] = [];

  // Get all turns (both input and output)
  const turns = doc.querySelectorAll('.turn-container .turn');

  turns.forEach(turn => {
    const isInput = turn.classList.contains('input');
    const isOutput = turn.classList.contains('output');

    if (isInput) {
      // Extract user prompt
      const contentElement = turn.querySelector('ms-console-turn ms-cmark-node');
      if (contentElement) {
        const content = extractMarkdownFromHtml(contentElement as HTMLElement);
        if (content && content.trim()) {
          messages.push({
            type: ChatMessageType.Prompt,
            content: content.trim()
          });
        }
      }
    } else if (isOutput) {
      // Check for thinking block first
      const thinkingBlock = turn.querySelector('ms-expandable-turn');
      let thinkingContent = '';

      if (thinkingBlock) {
        // Extract thinking content from collapsed-content div
        const collapsedContent = thinkingBlock.querySelector('.collapsed-content');
        if (collapsedContent) {
          const thinking = extractMarkdownFromHtml(collapsedContent as HTMLElement);
          if (thinking && thinking.trim()) {
            thinkingContent = thinking.trim();
          }
        }
      }

      // Extract main response content
      const contentElement = turn.querySelector('ms-console-turn ms-cmark-node');
      if (contentElement) {
        const content = extractMarkdownFromHtml(contentElement as HTMLElement);
        if (content && content.trim()) {
          // Combine thinking + response if both exist
          let fullResponse = '';
          if (thinkingContent) {
            fullResponse = `<thought>\n${thinkingContent}\n</thought>\n\n`;
          }
          fullResponse += content.trim();

          messages.push({
            type: ChatMessageType.Response,
            content: fullResponse
          });
        }
      }
    }
  });

  if (messages.length === 0) {
    throw new Error('No AI Studio messages found in the provided HTML. Please ensure you pasted the full page source.');
  }

  return { messages };
};

/**
 * Specialized parser for Kimi AI HTML exports.
 * Extracts messages from the specific DOM structure used by Kimi.
 * Supports thought process extraction with <thought> tags.
 */
const parseKimiHtml = (input: string): ChatData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  const messages: ChatMessage[] = [];

  // Kimi structure: chat-content-item containers with user/assistant classes
  const segments = doc.querySelectorAll('.chat-content-item');

  segments.forEach(segment => {
    const isUser = segment.classList.contains('chat-content-item-user');
    const isAssistant = segment.classList.contains('chat-content-item-assistant');

    if (isUser) {
      // Extract user message from .user-content
      const contentEl = segment.querySelector('.user-content');
      if (contentEl) {
        const content = extractMarkdownFromHtml(contentEl as HTMLElement);
        if (content && content.trim().length > 0) {
          messages.push({
            type: ChatMessageType.Prompt,
            content: content.trim()
          });
        }
      }
    } else if (isAssistant) {
      // Check for thought process container first
      const thinkingContainer = segment.querySelector('.thinking-container .markdown');
      let thoughtContent = '';

      if (thinkingContainer) {
        const thoughtText = extractMarkdownFromHtml(thinkingContainer as HTMLElement);
        if (thoughtText && thoughtText.trim().length > 0) {
          // Wrap in thought tags if not already present
          thoughtContent = `<thought>\n${thoughtText.trim()}\n</thought>\n\n`;
        }
      }

      // Get main response content from .markdown-container .markdown
      const markdownEl = segment.querySelector('.markdown-container .markdown');
      let mainContent = '';

      if (markdownEl) {
        const responseText = extractMarkdownFromHtml(markdownEl as HTMLElement);
        if (responseText && responseText.trim().length > 0) {
          mainContent = responseText.trim();
        }
      }

      // Combine thought + main content
      const fullContent = thoughtContent + mainContent;

      if (fullContent.trim()) {
        messages.push({
          type: ChatMessageType.Response,
          content: fullContent.trim()
        });
      }
    }
  });

  if (messages.length === 0) {
    throw new Error('No Kimi-style messages found in the provided HTML. Please ensure you pasted the full conversation HTML.');
  }

  return { messages };
};

/**
 * Parser for Kimi's built-in Share/Copy format
 * Handles the plain text output from Kimi's share feature
 * Format: "User: <message>\nKimi: <response>"
 */
const parseKimiShareCopy = (input: string): ChatData => {
  const messages: ChatMessage[] = [];

  // Split by lines and parse User:/Kimi: labels
  const lines = input.split('\n');
  let currentRole: 'user' | 'kimi' | null = null;
  let currentContent: string[] = [];

  const flushMessage = () => {
    if (currentRole && currentContent.length > 0) {
      const content = currentContent.join('\n').trim();
      if (content) {
        messages.push({
          type: currentRole === 'user' ? ChatMessageType.Prompt : ChatMessageType.Response,
          content
        });
      }
      currentContent = [];
    }
  };

  for (const line of lines) {
    // Check if line starts with "User:" or "Kimi:"
    if (line.startsWith('User:')) {
      flushMessage();
      currentRole = 'user';
      // Add the content after "User:" (if any on same line)
      const content = line.substring(5).trim();
      if (content) {
        currentContent.push(content);
      }
    } else if (line.startsWith('Kimi:')) {
      flushMessage();
      currentRole = 'kimi';
      // Add the content after "Kimi:" (if any on same line)
      const content = line.substring(5).trim();
      if (content) {
        currentContent.push(content);
      }
    } else {
      // Continuation of current message
      currentContent.push(line);
    }
  }

  // Flush the last message
  flushMessage();

  if (messages.length === 0) {
    throw new Error('No messages found in Kimi share copy format. Please ensure you copied the conversation using Kimi\'s share feature.');
  }

  return { messages };
};

/**
 * Helper to decode HTML entities in a string.
 * Used when content is extracted from innerHTML but needs to be stored as raw text.
 */
const decodeHtmlEntities = (text: string): string => {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent || text;
};

/**
 * Specialized parser for Grok (xAI) HTML exports.
 * Extracts messages from the specific DOM structure used by Grok.
 * Handles thought blocks, code blocks, tables, images, canvas elements, and Knowledge Cluster Prompts.
 */


/**
 * Helper to extract markdown table from HTML table element.
 */
const extractTableMarkdown = (table: Element): string => {
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
};

/**
 * Generates a JSON representation of a chat session.
 * @param chatData The parsed chat data with messages and metadata
 * @param metadata Optional metadata to include in the output
 * @returns A JSON string containing the exported data
 */
export const generateJson = (
  chatData: ChatData,
  metadata?: ChatMetadata
): string => {
  const exportData = {
    exportedBy: {
      tool: 'Noosphere Reflect',
      tagline: 'Meaning Through Memory'
    },
    metadata: metadata || chatData.metadata || {
      title: 'Untitled Chat',
      model: '',
      date: new Date().toISOString(),
      tags: []
    },
    messages: chatData.messages
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Generate manifest.json for a conversation with artifacts
 * @param session - The saved chat session
 * @param version - App version from package.json
 * @returns JSON string of manifest
 */
export const generateManifest = (
  session: SavedChatSession,
  version: string = '0.4.0'
): string => {
  const artifacts = session.metadata?.artifacts || [];

  const manifest: ConversationManifest = {
    version: "1.0",
    conversationId: session.id,
    title: session.metadata?.title || session.chatTitle,
    exportedAt: new Date().toISOString(),
    artifacts: artifacts.map(artifact => {
      const safeName = neutralizeDangerousExtension(sanitizeFilename(artifact.fileName));
      return {
        fileName: safeName,
        filePath: `artifacts/${safeName}`,
        fileSize: artifact.fileSize,
        mimeType: artifact.mimeType,
        description: artifact.description
      };
    }),
    exportedBy: {
      tool: "Noosphere Reflect",
      version: version
    }
  };

  return JSON.stringify(manifest, null, 2);
};

/**
 * Create directory export structure with conversation + artifacts
 * @param session - The saved chat session
 * @param format - Export format (html, markdown, json)
 * @returns Object with files: { filename: content }
 */
export const generateDirectoryExport = (
  session: SavedChatSession,
  format: 'html' | 'markdown' | 'json'
): Record<string, string | Blob> => {
  const files: Record<string, string | Blob> = {};

  // Collect artifacts from BOTH sources
  const allArtifacts: ConversationArtifact[] = [
    // Session-level (unlinked)
    ...(session.metadata?.artifacts || []),

    // Message-level (linked)
    ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
  ];

  // Remove duplicates by ID
  const uniqueArtifacts = Array.from(
    new Map(allArtifacts.map(a => [a.id, a])).values()
  );

  // Generate conversation file
  if (format === 'html') {
    files['conversation.html'] = generateHtml(
      session.chatData!,
      session.metadata?.title || session.chatTitle,
      session.selectedTheme,
      session.userName,
      session.aiName,
      session.parserMode,
      session.metadata
    );
  } else if (format === 'markdown') {
    files['conversation.md'] = generateMarkdown(
      session.chatData!,
      session.metadata?.title || session.chatTitle,
      session.userName,
      session.aiName,
      session.metadata
    );
  } else {
    files['conversation.json'] = generateJson(session.chatData!, session.metadata);
  }

  // Generate manifest if artifacts exist
  if (uniqueArtifacts.length > 0) {
    files['manifest.json'] = generateManifest(session);

    // Add artifact files (decode base64 → blob)
    uniqueArtifacts.forEach(artifact => {
      const safeName = neutralizeDangerousExtension(sanitizeFilename(artifact.fileName));
      const binaryString = atob(artifact.fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: artifact.mimeType });
      files[`artifacts/${safeName}`] = blob;
    });
  }

  return files;
};

/**
 * Generate export metadata JSON
 * @param sessions - Array of sessions being exported
 * @returns Export metadata object
 */
const generateExportMetadata = (sessions: SavedChatSession[]) => {
  const chatMetadata = sessions.map(session => {
    const messageCount = session.chatData?.messages.length || 0;

    // Count artifacts from both sources
    const sessionArtifacts = session.metadata?.artifacts?.length || 0;
    const messageArtifacts = session.chatData?.messages.reduce((count, msg) =>
      count + (msg.artifacts?.length || 0), 0) || 0;
    const artifactCount = sessionArtifacts + messageArtifacts;

    return {
      filename: `[${session.aiName || 'AI'}] - ${(session.metadata?.title || session.chatTitle).replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
      originalTitle: session.metadata?.title || session.chatTitle,
      service: session.aiName || 'AI',
      exportDate: new Date().toISOString(),
      originalDate: session.metadata?.date || session.date,
      messageCount,
      artifactCount,
      tags: session.metadata?.tags || []
    };
  });

  return {
    exportDate: new Date().toISOString(),
    exportedBy: {
      tool: 'Noosphere Reflect',
                                  version: '0.5.5'    },
    chats: chatMetadata,
    summary: {
      totalChats: sessions.length,
      totalMessages: chatMetadata.reduce((sum, chat) => sum + chat.messageCount, 0),
      totalArtifacts: chatMetadata.reduce((sum, chat) => sum + chat.artifactCount, 0)
    }
  };
};



/**
 * Create ZIP archive from directory export
 * @param session - The saved chat session
 * @param format - Export format
 * @returns Blob of ZIP file
 */
export const generateZipExport = async (
  session: SavedChatSession,
  format: 'html' | 'markdown' | 'json'
): Promise<Blob> => {
  const zip = new JSZip();
  const files = generateDirectoryExport(session, format);

  // Generate folder name with service prefix: [Service] - title
  const serviceName = session.aiName || 'AI';
  const title = session.metadata?.title || session.chatTitle;
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const folderName = `[${serviceName}] - ${sanitizedTitle}`;

  const folder = zip.folder(folderName)!;

  // Add all files to ZIP
  for (const [filename, content] of Object.entries(files)) {
    if (content instanceof Blob) {
      folder.file(filename, content);
    } else {
      folder.file(filename, content);
    }
  }

  // Generate export metadata
  const metadata = generateExportMetadata([session]);
  folder.file('export-metadata.json', JSON.stringify(metadata, null, 2));

  return await zip.generateAsync({ type: 'blob' });
};

/**
 * Create batch ZIP export with multiple conversations
 * @param sessions - Array of sessions to export
 * @param format - Export format
 * @returns Blob of ZIP file
 */
export const generateBatchZipExport = async (
  sessions: SavedChatSession[],
  format: 'html' | 'markdown' | 'json'
): Promise<Blob> => {
  const zip = new JSZip();

  for (const session of sessions) {
    const files = generateDirectoryExport(session, format);

    // Generate folder name with service prefix: [Service] - title
    const serviceName = session.aiName || 'AI';
    const title = session.metadata?.title || session.chatTitle;
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const folderName = `[${serviceName}] - ${sanitizedTitle}`;

    const folder = zip.folder(folderName)!;

    // Add all files to folder
    for (const [filename, content] of Object.entries(files)) {
      if (content instanceof Blob) {
        folder.file(filename, content);
      } else {
        folder.file(filename, content);
      }
    }

    // Add individual chat metadata to this folder
    const chatMetadata = generateExportMetadata([session]);
    folder.file('export-metadata.json', JSON.stringify(chatMetadata, null, 2));
  }

  // Generate batch export metadata at root
  const metadata = generateExportMetadata(sessions);
  zip.file('export-metadata.json', JSON.stringify(metadata, null, 2));

  return await zip.generateAsync({ type: 'blob' });
};

/**
 * Triggers a directory export using the File System Access API.
 * Creates a conversation file and an `artifacts` subfolder if needed.
 * @param session - The session to export.
 * @param format - The export format for the main conversation file.
 */
export const generateDirectoryExportWithPicker = async (
  session: SavedChatSession,
  format: 'html' | 'markdown' | 'json'
) => {
  try {
    // Check if File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      alert('⚠️ Directory export is not supported in this browser. Please use Chrome, Edge, or Opera.');
      return;
    }

    // Ask user to select a directory
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads'
    });

    const theme = session.selectedTheme || ChatTheme.DarkDefault;
    const userName = session.userName || 'User';
    const aiName = session.aiName || 'AI';
    const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';
    
    // Get app settings for filename casing
    const appSettings = await storageService.getSettings();
    
    // Generate folder name with AI name prefix: [AIName] - title (matching ArchiveHub convention)
    const sanitizedTitle = sanitizeFilename(
        session.metadata?.title || session.chatTitle,
        appSettings.fileNamingCase
    );
    const baseFilename = `[${aiName}] - ${sanitizedTitle}`;

    // Create a subdirectory for the chat export
    const chatDirHandle = await dirHandle.getDirectoryHandle(baseFilename, { create: true });

    // Generate conversation content
    let content: string;
    let extension: string;

    if (format === 'html') {
      content = generateHtml(
        session.chatData!,
        title,
        theme,
        userName,
        aiName,
        session.parserMode,
        session.metadata
      );
      extension = 'html';
    } else if (format === 'markdown') {
      content = generateMarkdown(
        session.chatData!,
        title,
        userName,
        aiName,
        session.metadata
      );
      extension = 'md';
    } else {
      content = generateJson(session.chatData!, session.metadata);
      extension = 'json';
    }

    // Write conversation file to selected directory
    const fileHandle = await chatDirHandle.getFileHandle(`${baseFilename}.${extension}`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();

    // Collect artifacts from BOTH sources
    const allArtifacts: ConversationArtifact[] = [
      // Session-level (unlinked)
      ...(session.metadata?.artifacts || []),

      // Message-level (linked)
      ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
    ];

    // Remove duplicates by ID
    const uniqueArtifacts = Array.from(
      new Map(allArtifacts.map(a => [a.id, a])).values()
    );

    // Create artifacts subdirectory and write artifacts
    if (uniqueArtifacts.length > 0) {
      const artifactsDir = await chatDirHandle.getDirectoryHandle('artifacts', { create: true });

      for (const artifact of uniqueArtifacts) {
        const artifactHandle = await artifactsDir.getFileHandle(artifact.fileName, { create: true });
        const artifactWritable = await artifactHandle.createWritable();

        const binaryData = Uint8Array.from(atob(artifact.fileData), c => c.charCodeAt(0));
        await artifactWritable.write(binaryData);
        await artifactWritable.close();
      }
    }

    alert(`✅ Exported to directory:\n- ${baseFilename}/\n  - ${baseFilename}.${extension}\n  - artifacts/ (${uniqueArtifacts.length} files)`);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // User cancelled the directory picker, do nothing.
      return;
    }
    console.error('Directory export failed:', error);
    alert('❌ Directory export failed. Check console for details.');
  }
};

/**
 * Generates HTML export for a memory
 */
export const generateMemoryHtml = (
  memory: Memory,
  theme: ChatTheme = ChatTheme.DarkDefault
): string => {
  // Use themeMap from this file scope (lines 535-649)
  // Since it's not exported, we need to ensure we can access it or duplicate necessary parts.
  // Actually, themeMap IS defined in this file (line 535).
  const themeClasses = themeMap[theme] || themeMap[ChatTheme.DarkDefault];
  const formattedDate = new Date(memory.createdAt).toLocaleString();

  return `<!DOCTYPE html>
<html lang="en" class="${themeClasses.htmlClass}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(memory.metadata.title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="${themeClasses.bodyBg} ${themeClasses.bodyText} p-8">
  <div class="max-w-4xl mx-auto ${themeClasses.containerBg} rounded-xl p-8 shadow-2xl">
    <h1 class="${themeClasses.titleText} text-3xl font-bold mb-4">
      ${escapeHtml(memory.metadata.title)}
    </h1>
    <div class="text-sm text-gray-400 mb-6">
      <p><strong>AI Model:</strong> ${escapeHtml(memory.aiModel)}</p>
      <p><strong>Created:</strong> ${formattedDate}</p>
      <p><strong>Tags:</strong> ${memory.tags.map(t => escapeHtml(t)).join(', ')}</p>
    </div>
    <div class="prose prose-invert max-w-none">
      ${convertMarkdownToHtml(memory.content, false)}
    </div>
    
    <!-- Noosphere Footer -->
    <div class="text-center text-xs ${themeClasses.bodyText} opacity-50 mt-16 pt-8 border-t border-gray-700">
      <p class="mt-8"><strong>Noosphere Reflect</strong></p>
      <p class="text-xs italic">Preserving Meaning Through Memory</p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Generates Markdown export for a memory
 */
export const generateMemoryMarkdown = (memory: Memory): string => {
  const formattedDate = new Date(memory.createdAt).toLocaleString();

  return `# ${memory.metadata.title}

**AI Model:** ${memory.aiModel}  
**Created:** ${formattedDate}  
**Tags:** ${memory.tags.join(', ')}

---

${memory.content}

---

*Exported from Noosphere Reflect Memory Archive*
`;
};

/**
 * Generates JSON export for a memory
 */
export const generateMemoryJson = (memory: Memory): string => {
  return JSON.stringify(memory, null, 2);
};

/**
 * Helper: Generate simplified export metadata for memories (no artifacts)
 */
const generateMemoryExportMetadata = (memories: Memory[]) => {
  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    type: 'memory-archive',
    count: memories.length,
    memories: memories.map(m => ({
      id: m.id,
      title: m.metadata.title,
      aiModel: m.aiModel,
      createdAt: m.createdAt,
      tags: m.tags
    }))
  };
};

/**
 * Helper: Handle filename collisions by appending incrementing counters
 */
const deduplicateFilename = (filename: string, existingFilenames: Set<string>): string => {
  if (!existingFilenames.has(filename)) {
    return filename;
  }

  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const base = parts.join('.');

  let counter = 1;
  let newFilename = ext ? `${base}_${counter}.${ext}` : `${base}_${counter}`;

  while (existingFilenames.has(newFilename)) {
    counter++;
    newFilename = ext ? `${base}_${counter}.${ext}` : `${base}_${counter}`;
  }

  return newFilename;
};

/**
 * Create batch ZIP export with multiple memories
 * @param memories - Array of memories to export
 * @param format - Export format (html, markdown, json)
 * @param caseFormat - Filename case format from settings
 * @returns Blob of ZIP file
 */
export const generateMemoryBatchZipExport = async (
  memories: Memory[],
  format: 'html' | 'markdown' | 'json',
  caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
): Promise<Blob> => {
  const zip = new JSZip();
  const usedFilenames = new Set<string>();

  for (const memory of memories) {
    let content: string;
    let extension: string;

    // Generate content based on format
    if (format === 'html') {
      content = generateMemoryHtml(memory);
      extension = 'html';
    } else if (format === 'markdown') {
      content = generateMemoryMarkdown(memory);
      extension = 'md';
    } else {
      content = generateMemoryJson(memory);
      extension = 'json';
    }

    // Sanitize filename with case format
    const sanitizedTitle = sanitizeFilename(memory.metadata.title, caseFormat);
    let filename = `${sanitizedTitle}.${extension}`;

    // Handle collisions
    filename = deduplicateFilename(filename, usedFilenames);
    usedFilenames.add(filename);

    // Add file to ZIP
    zip.file(filename, content);
  }

  // Add batch export metadata at root
  const metadata = generateMemoryExportMetadata(memories);
  zip.file('export-metadata.json', JSON.stringify(metadata, null, 2));

  return await zip.generateAsync({ type: 'blob' });
};

/**
 * Generate directory structure for batch memory export (for File System Access API)
 * @param memories - Array of memories to export
 * @param format - Export format
 * @param caseFormat - Filename case format from settings
 * @returns Object mapping filenames to content
 */
export const generateMemoryBatchDirectoryExport = (
  memories: Memory[],
  format: 'html' | 'markdown' | 'json',
  caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
): Record<string, string> => {
  const files: Record<string, string> = {};
  const usedFilenames = new Set<string>();

  for (const memory of memories) {
    let content: string;
    let extension: string;

    // Generate content based on format
    if (format === 'html') {
      content = generateMemoryHtml(memory);
      extension = 'html';
    } else if (format === 'markdown') {
      content = generateMemoryMarkdown(memory);
      extension = 'md';
    } else {
      content = generateMemoryJson(memory);
      extension = 'json';
    }

    // Sanitize filename with case format
    const sanitizedTitle = sanitizeFilename(memory.metadata.title, caseFormat);
    let filename = `${sanitizedTitle}.${extension}`;

    // Handle collisions
    filename = deduplicateFilename(filename, usedFilenames);
    usedFilenames.add(filename);

    files[filename] = content;
  }

  // Add metadata
  const metadata = generateMemoryExportMetadata(memories);
  files['export-metadata.json'] = JSON.stringify(metadata, null, 2);

  return files;
};

/**
 * Batch export memories to directory using File System Access API
 * @param memories - Array of memories to export
 * @param format - Export format
 * @param caseFormat - Filename case format from settings
 */
export const generateMemoryBatchDirectoryExportWithPicker = async (
  memories: Memory[],
  format: 'html' | 'markdown' | 'json',
  caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
): Promise<void> => {
  // Check if File System Access API is supported
  if (!('showDirectoryPicker' in window)) {
    throw new Error('Directory export is not supported in this browser. Please use Chrome, Edge, or Opera, or select ZIP export instead.');
  }

  // Ask user to select a directory
  const rootDirHandle = await (window as any).showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'downloads'
  });

  // Generate timestamp-datestamp for directory name
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2026-01-11T10-30-45
  const dirName = `Noosphere-Memories-${timestamp}`;

  // Create subdirectory
  const memoryDirHandle = await rootDirHandle.getDirectoryHandle(dirName, { create: true });

  // Generate all files
  const files = generateMemoryBatchDirectoryExport(memories, format, caseFormat);

  // Write each file
  for (const [filename, content] of Object.entries(files)) {
    const fileHandle = await memoryDirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }
};