import { ChatData, ChatMessage, ChatMessageType, ChatTheme, ThemeClasses, ParserMode } from '../types';

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
      // but usually the wrapper IS the buble.
      // We need to find the text content. User text is often in a span with whitespace-pre-wrap
      const contentEl = htmlEl.querySelector('.whitespace-pre-wrap') as HTMLElement || htmlEl;
      const content = extractMarkdownFromHtml(contentEl);
      if (content) {
        messages.push({ type: ChatMessageType.Prompt, content });
        // Mark children as visited
        htmlEl.querySelectorAll('*').forEach(child => visited.add(child));
        visited.add(htmlEl);
      }
    }

    // LeChat "Thinking Process" Time Header (e.g. "Thought for 1s")
    // Structure: div with text "Thought", "for", "1s" in spans
    if (htmlEl.textContent?.includes('Thought') && htmlEl.textContent?.includes('for') && htmlEl.textContent?.match(/\d+s/)) {
      // This is likely the header. We can capture it as a system message or append it to the next thought block?
      // Or better, just format it nicely if it's not inside a reasoning block.
      // Actually, let's treat it as a small "System" note if it appears on its own.
      // It's often a sibling to the actual reasoning.
      const text = htmlEl.innerText.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
      if (text.startsWith('Thought for')) {
        // We can maybe just skip it if we handle it inside the reasoning block, 
        // but usually it's separate. Let's add it as a small italic line.
        // messages.push({ type: ChatMessageType.Response, content: `_<small>${text}</small>_` });
        // Actually, let's ignore it effectively to keep clean, OR prepend to next AI message?
        // LeChat logic below handles 'reasoning' parts. 
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
            partContent = `\n<thought>\n${partContent}\n</thought>\n`;
          }

          fullContent += partContent + '\n\n';
        });
      } else {
        // Fallback if no specific parts found
        fullContent = extractMarkdownFromHtml(htmlEl);
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
    const codeText = pre.innerText.trim();
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
      const text = code.innerText.trim();
      code.replaceWith(document.createTextNode(` \`${text}\` `));
    }
  });

  // 3. Handle File Name Badges (Llamacoder specific)
  clone.querySelectorAll('span.text-gray-700').forEach(el => {
    const span = el as HTMLElement;
    const parent = span.parentElement as HTMLElement;
    if (parent && (parent.classList.contains('text-sm') || parent.innerText?.includes(span.innerText))) {
      const fileName = span.innerText.trim();
      if (fileName && (fileName.includes('.') || fileName.includes('/'))) {
        parent.replaceWith(document.createTextNode(`\n\n**📄 File: ${fileName}**\n`));
      }
    }
  });

  // 4. Handle Claude "Thought Process" blocks
  // These are often in a container with a button saying "Thought process"
  clone.querySelectorAll('button').forEach(btn => {
    const btnText = btn.innerText.toLowerCase();
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
          const thoughtText = (thoughtContentEl as HTMLElement).innerText.trim();
          // Verify we aren't just capturing the button text again
          if (thoughtText && !thoughtText.toLowerCase().includes('thought process') && !thoughtText.toLowerCase().includes('viewed memory')) {
            // Replace the ENTIRE container with the thought tag
            container.replaceWith(document.createTextNode(`\n\n<thought>\n${thoughtText}\n</thought>\n\n`));
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
          .map(el => (el as HTMLElement).innerText.trim())
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
  clone.querySelectorAll('.bg-state-soft.rounded-full').forEach(badge => {
    const text = (badge as HTMLElement).innerText.trim();
    if (text) {
      badge.replaceWith(document.createTextNode(`\n> 📎 **Context: ${text}**\n`));
    }
  });

  // 7. Handle LeChat "Tool Executed"
  // Structure: div with text "Tool" and "executed" split. Often has a Wrench icon somewhere.
  // We can look for the container that has "Tool" and "executed" in text-subtle
  const toolExecutors = clone.querySelectorAll('.text-subtle');
  toolExecutors.forEach(el => {
    if (el.textContent?.trim() === 'Tool' || el.textContent?.trim() === 'executed') {
      // Find the main wrapper for this tool event interaction seems hard without a stable class.
      // However, the provided structure shows they are often in a container with 'text-muted'.
      // Let's look for the wrench icon SVG specifically as a marker if possible, or just text pattern.
    }
  });
  // Alternative: Replace specific repetitive structures found in LeChat logs
  // "Tool executed" often appears as text content.
  if (clone.innerText.includes('Tool') && clone.innerText.includes('executed')) {
    // This is too broad for the whole element, but let's try to target the visual rows
  }

  // Better approach for Tool/Libraries:
  // Look for the specific icons or the text-subtle wrappers.
  // LeChat specific: "Tool" "executed"
  // We can try to match the specific construct for Tools
  clone.querySelectorAll('.text-md.font-medium.text-subtle').forEach(el => {
    const text = el.textContent?.trim();
    if (text === 'Tool') {
      // Check sibling or next element for 'executed'
      // For now, let's just mark it.
      const container = el.closest('.w-full.overflow-hidden');
      if (container) {
        container.replaceWith(document.createTextNode('\n> 🛠️ **Tool Executed**\n'));
      }
    }
    if (text === 'Searched') {
      const container = el.closest('.w-full.overflow-hidden');
      if (container) {
        // Try to find the query content if possible, usually in a button/text-medium
        const queryEl = container.querySelector('.text-medium');
        const query = queryEl ? queryEl.textContent?.trim() : '';
        container.replaceWith(document.createTextNode(`\n> 📚 **Searched Libraries**: ${query}\n`));
      }
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
        mdList += `${marker} ${(li as HTMLElement).innerText.trim()}\n`;
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
      const cellTexts = cells.map(c => (c as HTMLElement).innerText.trim().replace(/\n/g, ' ')); // Single line cells

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


  // 5. Final cleanup of resulting text
  return clone.innerText.replace(/\n{3,}/g, '\n\n').trim();
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
  escaped = escaped.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="responsive-image inline-block my-1" />');
  // Convert links ([text](url))
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:underline">$1</a>');

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
      const languageClass = lang ? `language-${lang}` : 'language-plaintext';
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
  parserMode: ParserMode = ParserMode.Basic
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

  const enableThoughts = [ParserMode.AI, ParserMode.ClaudeHtml, ParserMode.LeChatHtml, ParserMode.LlamacoderHtml].includes(parserMode);

  const chatMessagesHtml = chatData.messages
    .map((message) => {
      const isPrompt = message.type === ChatMessageType.Prompt;
      const bgColor = isPrompt ? promptBg : responseBg;
      const justify = isPrompt ? 'justify-end' : 'justify-start';
      const speakerName = isPrompt ? userName : aiName; // Use custom names

      // Apply theme-specific classes to code blocks and blockquotes generated by convertMarkdownToHtml
      const contentHtml = convertMarkdownToHtml(message.content, enableThoughts)
        .replace(/<pre class="p-2 bg-gray-900 rounded-md my-2 overflow-x-auto">/g, `<pre class="p-2 ${codeBg} rounded-md my-2 overflow-x-auto">`)
        .replace(/<code class="language-/g, `<code class="${codeText} language-`) // For fenced code blocks
        .replace(/<code class="inline-code">/g, `<code class="${codeBg} ${codeText} px-1 py-0.5 rounded text-sm">`) // For inline code
        .replace(/<blockquote class="border-l-4 border-gray-500 pl-4 italic my-2">/g, `<blockquote class="border-l-4 ${blockquoteBorder} pl-4 italic text-gray-300 my-2">`)
        // Apply theme-specific classes to the collapsible thought block (only if present)
        .replace(/<details class="markdown-thought-block my-4">/g, `<details class="markdown-thought-block my-4">`) // Base details tag
        .replace(/<summary class="markdown-thought-summary/g, `<summary class="markdown-thought-summary bg-gray-600 text-gray-200 hover:bg-gray-500 active:bg-gray-700`) // Summary
        .replace(/<div class="markdown-thought-content/g, `<div class="markdown-thought-content bg-gray-700 text-gray-100 border-gray-600`); // Content div


      return `
        <div class="flex ${justify} mb-4 w-full">
          <div class="max-w-xl md:max-w-2xl lg:max-w-3xl rounded-xl p-4 shadow-lg ${bgColor} text-white break-words w-auto">
            <p class="font-semibold text-sm opacity-80 mb-1">${speakerName}</p>
            <div class="markdown-content">${contentHtml}</div>
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
    <title>${title}</title>
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
        <h1 class="text-4xl font-extrabold text-center ${titleText} mb-8">${title}</h1>
        <div class="space-y-4 flex flex-col w-full">
            ${chatMessagesHtml}
        </div>
    </div>
</body>
</html>`;
};