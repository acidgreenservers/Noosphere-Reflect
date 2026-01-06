/**
 * Converts HTML elements to Markdown format
 * Handles code blocks, thought processes, tables, lists, and basic formatting
 *
 * @param {HTMLElement} element - The HTML element to convert to Markdown
 * @returns {string} - Markdown-formatted text
 */
function extractMarkdownFromHtml(element) {
  const clone = element.cloneNode(true);

  // 1. Handle Code Blocks
  // Standard PRE > CODE
  clone.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    const langMatch = code?.className.match(/language-(\w+)/);
    const lang = langMatch ? langMatch[1] : '';
    const codeText = pre.innerText.trim();
    const mdBlock = `\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`;
    pre.replaceWith(document.createTextNode(mdBlock));
  });

  // LeChat specific "Code Block" (div[data-testid="code-block"] containing code)
  clone.querySelectorAll('div[data-testid="code-block"]').forEach(div => {
    const code = div.querySelector('code');
    if (code) {
      const langMatch = code.className.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : '';
      const codeText = code.innerText.trim();
      const mdBlock = `\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`;
      div.replaceWith(document.createTextNode(mdBlock));
    }
  });

  // Claude specific code blocks (div with code-block__code class)
  clone.querySelectorAll('.code-block__code').forEach(el => {
    const code = el.querySelector('code');
    const container = el.closest('.flex-col');
    const langEl = container?.querySelector('.font-mono, .p-3.pb-0');
    const lang = langEl?.textContent?.trim() || '';
    const codeText = code ? code.innerText.trim() : el.innerText.trim();
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
    const parent = el.parentElement;
    if (parent && (parent.classList.contains('text-sm') || parent.innerText?.includes(el.innerText))) {
      const fileName = el.innerText.trim();
      if (fileName && (fileName.includes('.') || fileName.includes('/'))) {
        parent.replaceWith(document.createTextNode(`\n\n**📄 File: ${fileName}**\n`));
      }
    }
  });

  // 4. Handle Claude "Thought Process" blocks
  clone.querySelectorAll('button').forEach(btn => {
    const btnText = btn.innerText.toLowerCase();
    if (btnText.includes('thought process') || btnText.includes('extra thought')) {
      const container = btn.closest('.border-border-300.rounded-lg');
      if (container) {
        const thoughtContentEl = container.querySelector('.font-claude-response, .standard-markdown');

        if (thoughtContentEl) {
          const thoughtText = thoughtContentEl.innerText.trim();
          if (thoughtText && !thoughtText.toLowerCase().includes('thought process') && !thoughtText.toLowerCase().includes('viewed memory')) {
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
          .map(el => el.innerText.trim())
          .filter(txt => txt && !txt.toLowerCase().includes('viewed') && !txt.toLowerCase().includes('presented'));

        const resultsMd = results.length > 0 ? `\n> ${results.join('\n> ')}` : '';
        const actionTitle = btn.innerText.trim() || 'Tool Action';
        btn.replaceWith(document.createTextNode(`\n\n> 🛠️ **${actionTitle}**${resultsMd}\n\n`));
        parent.querySelectorAll('*').forEach(c => {
          if (c !== btn && (document.contains(c) || clone.contains(c))) c.remove();
        });
      }
    }
  });

  // Handle Claude Action Steps (Creating..., Running...)
  clone.querySelectorAll('.text-text-200, .text-text-100').forEach(el => {
    const parent = el.closest('.flex-row.min-h-\\[2\\.125rem\\], .hover\\:bg-bg-200');
    if (parent) {
      const text = el.innerText.trim();
      const subTextEl = parent.querySelector('.text-xs');
      const subText = subTextEl ? ` [${subTextEl.innerText.trim()}]` : '';
      const triggerWords = ['creating', 'running', 'reading', 'analyzing', 'executing', 'presented'];
      if (triggerWords.some(word => text.toLowerCase().startsWith(word))) {
        parent.replaceWith(document.createTextNode(`\n> ⚙️ **Action**: ${text}${subText}\n`));
      }
    }
  });

  // 5. Handle Claude "Artifacts" (Previews)
  clone.querySelectorAll('.artifact-block-cell, [aria-label*="Preview"]').forEach(art => {
    const title = art.querySelector('.line-clamp-1')?.innerHTML.trim() || 'Artifact';
    const subtitle = art.querySelector('.text-xs.line-clamp-1')?.innerText.trim() || '';
    art.replaceWith(document.createTextNode(`\n\n> 📦 **Artifact: ${title}**\n> ${subtitle}\n\n`));
  });

  // 6. Handle LeChat "Context" badges
  clone.querySelectorAll('.bg-state-soft.rounded-full').forEach(badge => {
    const text = badge.innerText.trim();
    if (text) {
      badge.replaceWith(document.createTextNode(`\n> 📎 **Context: ${text}**\n`));
    }
  });

  // 7. Handle LeChat "Tool Executed"
  clone.querySelectorAll('.text-md.font-medium.text-subtle').forEach(el => {
    const text = el.textContent?.trim();
    if (text === 'Tool') {
      const container = el.closest('.w-full.overflow-hidden');
      if (container) {
        container.replaceWith(document.createTextNode('\n> 🛠️ **Tool Executed**\n'));
      }
    }
    if (text === 'Searched') {
      const container = el.closest('.w-full.overflow-hidden');
      if (container) {
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
    const text = el.innerText.trim() || el.href;
    if (text && el.href) {
      el.replaceWith(document.createTextNode(`[${text}](${el.href})`));
    }
  });
  // Headings
  const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  headingTags.forEach((tag, idx) => {
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
        mdList += `${marker} ${li.innerText.trim()}\n`;
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
      const cellTexts = cells.map(c => c.innerText.trim().replace(/\n/g, ' '));

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

  // 11. Clean up extra buttons/SVGs
  clone.querySelectorAll('button, svg, [aria-label*="Copy"], [aria-label*="Retry"], [aria-label*="Edit"], [aria-label*="Delete"], [data-testid*="action-bar"]').forEach(el => {
    if (document.contains(el) || clone.contains(el)) {
      el.remove();
    }
  });

  // Final cleanup of resulting text
  return clone.innerText.replace(/\n{3,}/g, '\n\n').trim();
}
