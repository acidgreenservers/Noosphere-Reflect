/**
 * LLAMACODER CHAT SCRAPER
 * -----------------------
 * Directions:
 * 1. Open your Llamacoder chat in the browser.
 * 2. Open Developer Tools (F12 or Right Click -> Inspect).
 * 3. Go to the "Console" tab.
 * 4. Paste the entire script below and hit Enter.
 * 5. A JSON file will be downloaded automatically.
 * 6. Import this JSON file into the AI Chat HTML Converter.
 */

(function scrapeLlamacoder() {
    console.log('🤖 Starting Llamacoder Scrape...');

    // --- 1. Scrape Title ---
    // Tries to find the chat title in the top header area
    const titleEl = document.querySelector('p.italic.text-gray-500');
    const title = titleEl ? titleEl.innerText.trim() : 'Llamacoder Chat Export';

    // --- 2. Helper: Text Cleaner ---
    // Tries to preserve code blocks by replacing pre/code tags with markdown backticks
    function getMarkdownFromElement(element) {
        if (!element) return '';
        const clone = element.cloneNode(true);

        // Replace code blocks (<pre><code>...) with ``` ... ```
        clone.querySelectorAll('pre code').forEach(block => {
            // Try to determine language from class (e.g., "language-typescript")
            let lang = '';
            block.classList.forEach(cls => {
                if (cls.startsWith('language-')) lang = cls.replace('language-', '');
            });

            const codeHtml = block.innerHTML;
            // Simple entity decode for basic chars
            const codeText = block.innerText;

            block.closest('pre').replaceWith(`\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`);
        });

        // Replace inline code (<code>...) with `...`
        clone.querySelectorAll('code').forEach(inline => {
            const text = inline.innerText;
            // Avoid double wrapping if we already handled it in prev step (though querySelectorAll shouldn't hit removed nodes)
            if (!text.startsWith('```')) {
                inline.replaceWith(`\`${text}\``);
            }
        });

        // Handle File Name Badges (Llamacoder specific)
        clone.querySelectorAll('span.text-gray-700').forEach(span => {
            const parent = span.parentElement;
            if (parent && (parent.classList.contains('text-sm') || parent.innerText.includes(span.innerText))) {
                const fileName = span.innerText.trim();
                if (fileName && (fileName.includes('.') || fileName.includes('/'))) {
                    parent.replaceWith(document.createTextNode(`\n\n**📄 File: ${fileName}**\n`));
                }
            }
        });

        // Clean up buttons/SVGs
        clone.querySelectorAll('button, svg').forEach(el => el.remove());

        return clone.innerText.trim();
    }

    // --- 3. Scrape Messages ---
    const messages = [];

    // The main container typically holds the conversation
    // We look for the container that has the max-width prose class
    const containers = document.querySelectorAll('.mx-auto.flex.w-full.max-w-prose.flex-col');
    const chatContainer = containers.length > 0 ? containers[0] : null;

    if (!chatContainer) {
        console.error('❌ Could not find the main chat container. The DOM structure might have changed.');
        alert('Error: Could not find chat messages.');
        return;
    }

    // Iterate through direct children of the message list
    for (const child of chatContainer.children) {
        // A. Check for USER Message
        // Looking for the specific white bubble class: whitespace-pre-wrap rounded bg-white
        const userBubble = child.querySelector('.whitespace-pre-wrap.rounded.bg-white');
        if (userBubble) {
            messages.push({
                type: 'prompt', // Matches ChatMessageType.Prompt
                content: userBubble.innerText.trim()
            });
            continue;
        }

        // B. Check for AI Message
        // Looking for the .prose class which contains the markdown-rendered result
        const aiProse = child.querySelector('.prose');
        if (aiProse || child.classList.contains('prose') || child.querySelector('[class*="prose"]')) {
            // Include badges in the AI response scrape
            messages.push({
                type: 'response', // Matches ChatMessageType.Response
                content: getMarkdownFromElement(child)
            });
            continue;
        }
    }

    console.log(`✅ Scraped ${messages.length} messages.`);

    // --- 4. Export to JSON ---
    const exportData = {
        meta: {
            source: 'Llamacoder Scraper',
            date: new Date().toISOString(),
            title: title
        },
        messages: messages
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitize filename
    const filename = title.slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${filename}_llamacoder_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);

})();
