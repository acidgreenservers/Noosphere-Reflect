import { escapeHtml } from './securityUtils';

/**
 * Basic Markdown to HTML converter for preview mode.
 * Handles common formatting without heavy external dependencies.
 * Extended to support artifact references.
 */
export function renderMarkdownToHtml(text: string, onArtifactClick?: (artifactId: string) => void): string {
    if (!text) return '';

    // 1. Escape HTML first (security)
    let html = escapeHtml(text);

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

    // 4. Handle artifact references (before regular links/images)
    const artifactRefs: string[] = [];
    html = html.replace(/!\[([^\]]+)\]\((artifact-[^)]+)\)/g, (match, alt, artifactId) => {
        // Image artifact reference
        const index = artifactRefs.length;
        artifactRefs.push(`<button onclick="window.handleArtifactClick && window.handleArtifactClick('${artifactId}')" class="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 hover:text-purple-200 rounded-lg border border-purple-700/50 hover:border-purple-600/50 transition-all cursor-pointer text-sm" title="View artifact: ${alt}">🖼️ ${alt}</button>`);
        return `__ARTIFACT_REF_${index}__`;
    });

    html = html.replace(/\[([^\]]+)\]\((artifact-[^)]+)\)/g, (match, text, artifactId) => {
        // Regular artifact reference
        const index = artifactRefs.length;
        artifactRefs.push(`<button onclick="window.handleArtifactClick && window.handleArtifactClick('${artifactId}')" class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 hover:text-blue-200 rounded-lg border border-blue-700/50 hover:border-blue-600/50 transition-all cursor-pointer text-sm" title="View artifact: ${text}">📄 ${text}</button>`);
        return `__ARTIFACT_REF_${index}__`;
    });

    // 5. Basic Formatting
    html = html
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') // Bold
        .replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>') // Italic
        .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-3 border border-gray-700 shadow-md"/>') // Images (non-artifact)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 hover:underline transition-colors">$1</a>') // Links (non-artifact)
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-3 border-b border-gray-700 pb-2">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-100 mt-5 mb-2">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium text-gray-200 mt-4 mb-2">$1</h3>')
        .replace(/^\s*-\s+(.*$)/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>') // List items
        .replace(/^\s*\d+\.\s+(.*$)/gm, '<li class="ml-4 list-decimal text-gray-300">$1</li>') // Numbered list
        .replace(/\n/g, '<br/>'); // Line breaks

    // 6. Thought & Collapsible Support (Handling the escaped tags <thought> and <collapsible>)
    // Process thoughts - Handle both raw and escaped tags for robustness
    html = html.replace(/(?:<thought>|&lt;thought&gt;)([\s\S]*?)(?:<\/thought>|&lt;\/thought&gt;)/g, (match, content) => {
        return `
            <details class="markdown-thought-block my-4 group/thought">
                <summary class="markdown-thought-summary cursor-pointer p-2 rounded-md flex items-center justify-between text-lg font-semibold group-hover/thought:text-purple-300">
                    <span class="flex items-center gap-2">🧠 Thought Process</span>
                    <span class="text-xs opacity-70 group-open:hidden uppercase tracking-widest bg-purple-500/10 px-2 py-1 rounded">Click to expand</span>
                </summary>
                <div class="markdown-thought-content p-4 bg-gray-950/20 backdrop-blur-sm border-t border-purple-500/20">
                    ${content.trim()}
                </div>
            </details>
        `;
    });

    // Process collapsible - Handle both raw and escaped tags for robustness
    html = html.replace(/(?:<collapsible>|&lt;collapsible&gt;)([\s\S]*?)(?:<\/collapsible>|&lt;\/collapsible&gt;)/g, (match, content) => {
        return `
            <details class="markdown-collapsible-block my-4 group/collapsible">
                <summary class="markdown-collapsible-summary cursor-pointer p-2 rounded-md flex items-center justify-between text-lg font-semibold group-hover/collapsible:text-purple-300">
                    <span class="flex items-center gap-2">📂 Detailed View</span>
                    <span class="text-xs opacity-70 group-open:hidden uppercase tracking-widest bg-purple-500/10 px-2 py-1 rounded">Click to expand</span>
                </summary>
                <div class="markdown-thought-content p-4 bg-gray-950/20 backdrop-blur-sm border-t border-purple-500/20">
                    ${content.trim()}
                </div>
            </details>
        `;
    });

    // 7. Restore artifact references, code blocks, and inline code
    html = html.replace(/__ARTIFACT_REF_(\d+)__/g, (match, index) => artifactRefs[parseInt(index)]);
    html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => codeBlocks[parseInt(index)]);
    html = html.replace(/__INLINE_CODE_(\d+)__/g, (match, index) => inlineCode[parseInt(index)]);

    return html;
}