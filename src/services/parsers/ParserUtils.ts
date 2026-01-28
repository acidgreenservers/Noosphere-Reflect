import { ChatData, ChatMessage, ChatMessageType, ChatMetadata } from '../../types';
import { validateFileSize, escapeHtml } from '../../utils/securityUtils';

/**
 * Decodes HTML entities in a string.
 */
export const decodeHtmlEntities = (text: string): string => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
};

/**
 * Helper: Check if an HTML element is nested inside a Gemini thinking block.
 * Uses two-phase detection because DOMParser doesn't properly nest custom elements.
 */
export const isInsideThinkingBlock = (element: HTMLElement): boolean => {
    let parent = element.parentElement;
    while (parent) {
        if (
            parent.tagName.toLowerCase() === 'model-thoughts' ||
            parent.classList.contains('thoughts-container')
        ) {
            return true;
        }
        parent = parent.parentElement;
    }
    return false;
};

/**
 * Helper to convert complex HTML (like Llamacoder prose) back to Markdown-ish content.
 * Focuses on preserving code blocks and basic formatting.
 *
 * SECURITY: This function processes untrusted HTML content and must validate input
 * to prevent XSS attacks and resource exhaustion.
 */
export const extractMarkdownFromHtml = (element: HTMLElement): string => {
    // SECURITY: Input validation before DOM processing
    if (!element || !(element instanceof HTMLElement)) {
        throw new Error('Invalid input: element must be a valid HTMLElement');
    }

    // SECURITY: Size limit to prevent resource exhaustion (max 10MB HTML content)
    const htmlContent = element.outerHTML || '';
    const sizeValidation = validateFileSize(htmlContent.length, 10); // 10MB limit
    if (!sizeValidation.valid) {
        throw new Error(`HTML content too large: ${sizeValidation.error}`);
    }

    // SECURITY: Additional sanitization - remove dangerous elements before processing
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove script tags and event handlers that could execute
    clone.querySelectorAll('script, iframe, object, embed').forEach(el => el.remove());

    // Remove event handler attributes
    const elementsWithEvents = clone.querySelectorAll('*');
    elementsWithEvents.forEach(el => {
        const element = el as HTMLElement;
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                element.removeAttribute(attr.name);
            }
        });
    });

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

    // 4. Handle Gemini/AI Studio "Thinking" blocks
    // Remove these from the response since they're extracted separately
    clone.querySelectorAll('.thoughts-container, model-thoughts, ms-expandable-turn').forEach(thinkingBlock => {
        thinkingBlock.remove();
    });

    // 5. Handle Claude "Thought Process" blocks
    // These are often in a container with a button saying "Thought process"
    clone.querySelectorAll('button').forEach(btn => {
        const btnText = (btn.innerText || btn.textContent || '').toLowerCase();
        if (btnText.includes('thought process') || btnText.includes('extra thought')) {
            // Find the primary container for this thinking block
            const container = btn.closest('.border-border-300.rounded-lg');
            if (container) {
                // We look for the HIDDEN content area specifically to avoid catching the button label
                const thoughtContentEl = container.querySelector('.font-claude-response, .standard-markdown');

                if (thoughtContentEl) {
                    const thoughtText = ((thoughtContentEl as HTMLElement).innerText || (thoughtContentEl as HTMLElement).textContent || '').trim();
                    // Verify we aren't just capturing the button text again
                    if (thoughtText && !thoughtText.toLowerCase().includes('thought process') && !thoughtText.toLowerCase().includes('viewed memory')) {
                        // Replace the ENTIRE container with the thought tag
                        container.replaceWith(document.createTextNode(`\n\n---\n<thoughts>\n\n${thoughtText}\n\n</thoughts>\n---\n\n`));
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
        const title = art.querySelector('.line-clamp-1')?.innerHTML?.trim() || 'Artifact';
        const subtitle = (art.querySelector('.text-xs.line-clamp-1') as HTMLElement)?.innerText?.trim() || '';
        art.replaceWith(document.createTextNode(`\n\n> 📦 **Artifact: ${title}**\n> ${subtitle}\n\n`));
    });

    // 6. Handle LeChat "Context" badges (e.g. Personal Library)
    clone.querySelectorAll('.bg-state-soft.rounded-full').forEach(badge => {
        const text = (badge as HTMLElement).innerText.trim();
        if (text) {
            badge.replaceWith(document.createTextNode(`[!BADGE:${text}]`));
        }
    });

    // 7. Handle LeChat Rich Tables (Structured Data Grids)
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

    // 9. Handle LeChat Tool Events
    clone.querySelectorAll('.lucide-wrench, [class*="lucide-wrench"]').forEach(icon => {
        const container = icon.closest('.w-full.overflow-hidden, .flex.w-full.flex-col, .pb-6');
        if (container) {
            const toolTexts = Array.from(container.querySelectorAll('.text-md.font-medium.text-subtle'))
                .map(el => (el as HTMLElement).textContent?.trim())
                .filter(t => t && t !== 'Tool' && t !== 'executed');

            const toolName = toolTexts.length > 0 ? toolTexts.join(' ') : 'Tool Executed';
            container.replaceWith(document.createTextNode(`\n> 🔧 **${toolName}**\n`));
        }
    });

    // 10. Handle LeChat Library Search Events
    clone.querySelectorAll('.lucide-library, [class*="lucide-library"]').forEach(icon => {
        const container = icon.closest('.w-full.overflow-hidden, .flex.w-full.flex-col, .pb-6');
        if (container) {
            const queryEl = container.querySelector('.text-medium, button .text-medium, .wrap-break-word');
            const query = queryEl?.textContent?.trim() || '';

            const searchText = query ? `Searched Libraries: "${query}"` : 'Searched Libraries';
            container.replaceWith(document.createTextNode(`\n> 📚 **${searchText}**\n`));
        }
    });

    // Fallback text-based detection for Tool/Libraries
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
    clone.querySelectorAll('b, strong').forEach(el => {
        el.replaceWith(document.createTextNode(`**${el.textContent}**`));
    });
    clone.querySelectorAll('i, em').forEach(el => {
        el.replaceWith(document.createTextNode(`*${el.textContent}*`));
    });
    clone.querySelectorAll('a').forEach(el => {
        const anchor = el as HTMLAnchorElement;
        const text = anchor.innerText.trim() || anchor.href;
        if (text && anchor.href) {
            anchor.replaceWith(document.createTextNode(`[${text}](${anchor.href})`));
        }
    });
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
            const cellTexts = cells.map(c => ((c as HTMLElement).innerText || (c as HTMLElement).textContent || '').trim().replace(/\n/g, ' '));

            if (cellTexts.length > 0) {
                mdTable += `| ${cellTexts.join(' | ')} |\n`;
            }

            if (rowIndex === 0 && row.querySelector('th')) {
                const separators = cells.map(() => '---');
                mdTable += `| ${separators.join(' | ')} |\n`;
            }
        });
        mdTable += '\n';
        table.replaceWith(document.createTextNode(mdTable));
    });

    // 11. Handle Paragraphs explicitly to ensure separation
    clone.querySelectorAll('p').forEach(p => {
        // replaceWith text node of content surrounded by newlines
        p.replaceWith(document.createTextNode(`\n\n${(p as HTMLElement).innerText || (p as HTMLElement).textContent || ''}\n\n`));
    });

    // 12. Clean up extra buttons/SVGs
    clone.querySelectorAll('button, svg, [aria-label*="Copy"], [aria-label*="Retry"], [aria-label*="Edit"], [aria-label*="Delete"], [data-testid*="action-bar"]').forEach(el => {
        if (document.contains(el) || clone.contains(el)) {
            el.remove();
        }
    });

    // Final cleanup of resulting text
    let finalText = clone.innerText || clone.textContent || '';

    if (followupQuestions.length > 0) {
        finalText += `\n\n---\n**Follow-up Questions:**\n${followupQuestions.join('\n')}`;
    }

    return finalText.replace(/\n{3,}/g, '\n\n').trim();
};

/**
 * Validates markdown output from extractMarkdownFromHtml to ensure no HTML entities
 * or scripts remain that could cause XSS when rendered.
 *
 * SECURITY: This function ensures the "Markdown Firewall" pattern is maintained.
 *
 * @param markdown - The markdown string to validate
 * @returns The validated markdown string with any remaining HTML entities escaped
 * @throws Error if dangerous content is detected that cannot be safely neutralized
 */
export const validateMarkdownOutput = (markdown: string): string => {
    if (!markdown || typeof markdown !== 'string') {
        return '';
    }

    // SECURITY: Check for dangerous HTML tags that should not appear in markdown output
    const dangerousPatterns = [
        /<script[^>]*>[\s\S]*?<\/script>/gi,  // Script tags
        /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,  // Iframe tags
        /<object[^>]*>[\s\S]*?<\/object>/gi,  // Object tags
        /<embed[^>]*>/gi,                    // Embed tags
        /javascript:/gi,                     // JavaScript URLs
        /vbscript:/gi,                       // VBScript URLs
        /data:/gi,                          // Data URLs
        /on\w+\s*=/gi                       // Event handlers
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(markdown)) {
            throw new Error(`Dangerous content detected in markdown output: ${pattern.source}`);
        }
    }

    // SECURITY: Escape any remaining HTML entities that could be dangerous
    // Look for HTML tags that might have slipped through
    const htmlTagPattern = /<[^>]*>/g;
    if (htmlTagPattern.test(markdown)) {
        // If HTML tags are found, escape them to be safe
        markdown = markdown.replace(htmlTagPattern, (match) => {
            // Allow safe markdown-like tags (like <thoughts> which is used in the system)
            if (match === '<thoughts>' || match === '</thoughts>') {
                return match;
            }
            // Escape dangerous tags
            return escapeHtml(match);
        });
    }

    // SECURITY: Check for HTML entities that might represent dangerous characters
    // This is a final safety check
    const entityPattern = /&[#\w]+;/g;
    const suspiciousEntities = ['<script', '<iframe', '<object', 'javascript'];

    for (const entity of suspiciousEntities) {
        if (markdown.includes(entity)) {
            throw new Error(`Suspicious HTML entity detected: ${entity}`);
        }
    }

    return markdown;
};

/**
 * Checks if a string is valid JSON.
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
 * Parse JSON that was exported from this app.
 */
export const parseExportedJson = (exportedData: any): ChatData => {
    const messages: ChatMessage[] = exportedData.messages || [];
    const metadata = exportedData.metadata || {};

    if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('Exported JSON must contain a messages array');
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
