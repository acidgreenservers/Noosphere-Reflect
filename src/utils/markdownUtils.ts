/**
 * Basic Markdown to HTML converter for preview mode.
 * Handles common formatting without heavy external dependencies.
 */
export function renderMarkdownToHtml(text: string): string {
    if (!text) return '';

    // 1. Escape HTML first (security)
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 2. Extract code blocks to prevent formatting inside them
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        codeBlocks.push(`<pre class="bg-gray-950 p-3 rounded-lg border border-gray-800 my-3 overflow-x-auto"><code class="text-sm font-mono text-gray-300 block">${code}</code></pre>`);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 3. Extract inline code
    const inlineCode: string[] = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
        inlineCode.push(`<code class="bg-gray-800 px-1.5 py-0.5 rounded text-purple-300 font-mono text-sm border border-gray-700">${code}</code>`);
        return `__INLINE_CODE_${inlineCode.length - 1}__`;
    });

    // 4. Basic Formatting
    html = html
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') // Bold
        .replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>') // Italic
        .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-3 border border-gray-700 shadow-md"/>') // Images
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 hover:underline transition-colors">$1</a>') // Links
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-3 border-b border-gray-700 pb-2">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-100 mt-5 mb-2">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium text-gray-200 mt-4 mb-2">$1</h3>')
        .replace(/^\s*-\s+(.*$)/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>') // List items
        .replace(/^\s*\d+\.\s+(.*$)/gm, '<li class="ml-4 list-decimal text-gray-300">$1</li>') // Numbered list
        .replace(/\n/g, '<br/>'); // Line breaks

    // 5. Thought & Collapsible Support (Handling the escaped tags &lt;thought&gt; and &lt;collapsible&gt;)
    // Process thoughts
    html = html.replace(/&lt;thought&gt;([\s\S]*?)&lt;\/thought&gt;/g, (match, content) => {
        return `
            <details class="markdown-thought-block my-4">
                <summary class="markdown-thought-summary cursor-pointer p-2 rounded-md flex items-center justify-between text-lg font-semibold">
                    Thought process: <span class="text-xs ml-2 opacity-70">(Click to expand)</span>
                </summary>
                <div class="markdown-thought-content p-3 border rounded-b-md">
                    ${content.trim()}
                </div>
            </details>
        `;
    });

    // Process collapsible
    html = html.replace(/&lt;collapsible&gt;([\s\S]*?)&lt;\/collapsible&gt;/g, (match, content) => {
        return `
            <details class="markdown-collapsible-block my-4">
                <summary class="markdown-collapsible-summary cursor-pointer p-2 rounded-md flex items-center justify-between text-lg font-semibold">
                    Collapsible Section: <span class="text-xs ml-2 opacity-70">(Click to expand)</span>
                </summary>
                <div class="markdown-thought-content p-3 border rounded-b-md">
                    ${content.trim()}
                </div>
            </details>
        `;
    });

    // 6. Restore code blocks
    html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => codeBlocks[parseInt(index)]);
    html = html.replace(/__INLINE_CODE_(\d+)__/g, (match, index) => inlineCode[parseInt(index)]);

    return html;
}
