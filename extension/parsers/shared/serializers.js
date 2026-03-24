/**
 * Serializers for converting ChatData to display formats
 * Shared between all extension content scripts
 */

/**
 * Serializes chat data to a JSON string
 * @param {ChatData} chatData 
 * @returns {string} Pretty-printed JSON
 */
function serializeAsJson(chatData) {
    return JSON.stringify(chatData, null, 2);
}

/**
 * Serializes chat data to a Markdown string
 * Mirrors the logic in converterService.ts
 * @param {ChatData} chatData 
 * @param {ChatMetadata} metadata 
 * @returns {string} Markdown content
 */
function serializeAsMarkdown(chatData, metadata = null) {
    const lines = [];
    const title = metadata?.title || 'AI Chat Export';
    const dateStr = metadata?.date ? new Date(metadata.date).toLocaleString() : new Date().toLocaleString();
    const sourceUrl = metadata?.sourceUrl || '';
    const model = metadata?.model || 'AI';
    const tags = metadata?.tags ? metadata.tags.join(', ') : '';

    // Calculate stats
    const messages = chatData.messages || [];
    const totalMessages = messages.length;
    const userMessages = messages.filter(m => m.type === 'prompt').length;
    const aiMessages = messages.filter(m => m.type === 'response').length;
    // Approximation: Exchanges = User Messages (assuming pairs)
    const totalExchanges = userMessages;
    // Artifacts count not easily available in current chatData structure, defaulting to 0 or N/A

    // 1. Metadata Header (Blockquote style)
    lines.push('---');
    lines.push(`> **Model:** ${model}`);
    lines.push('>');
    lines.push(`> **Date:** ${dateStr}`);
    lines.push('>');
    if (sourceUrl) {
        lines.push(`> **Source:** [Source](${sourceUrl})`);
        lines.push('>');
    }
    if (tags) {
        lines.push(`> **Tags:** ${tags}`);
        lines.push('>');
    }
    // lines.push(`> **Artifacts:** [Source](URL)`); // Placeholder as we don't track artifacts yet
    // lines.push('>');
    lines.push('> **Metadata:**');
    lines.push(`>> Total Exchanges: ${totalExchanges}`);
    lines.push('>>');
    lines.push(`>> Total Chat Messages: ${totalMessages}`);
    lines.push('>>');
    lines.push(`>> Total User Messages: ${userMessages}`);
    lines.push('>>');
    lines.push(`>> Total AI Messages: ${aiMessages}`);
    lines.push('---');
    lines.push('');

    // 2. Title
    lines.push('## Title:');
    lines.push('');
    lines.push(`> ${title}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // 3. Messages
    messages.forEach((message) => {
        const isUser = message.type === 'prompt';
        // Header
        if (isUser) {
            lines.push('#### Prompt - User:');
        } else {
            lines.push(`#### Response - ${model}:`);
        }
        lines.push('');

        // Content
        let content = message.content;

        // Ensure content is treated as string
        if (typeof content !== 'string') {
            content = String(content);
        }

        // If it's a model response, handle nested thought blocks if present (legacy support)
        // But our parser now gives clean Markdown, so we just push it.
        // We'll indent the content slightly for better readability if desired, 
        // but the template shows standard text (except for thoughts which are blockquoted).

        // The template shows User Prompt as plain text, Response as plain text (with thoughts blockquoted).

        // Handle specific blockquote formatting for response if needed? 
        // No, parser handles it.

        lines.push(content);
        lines.push('');

        // Exchange Separator (#)
        // Strictly added AFTER a Model Response to separate this exchange from the next Prompt
        if (!isUser && message !== messages[messages.length - 1]) {
            lines.push('#');
            lines.push('');
        }
    });

    // 4. Footer
    lines.push('---');
    lines.push('');
    lines.push('###### Noosphere Reflect');
    lines.push('###### ***Meaning Through Memory***');
    lines.push('');
    lines.push('###### ***[Preserve Your Meaning](https://acidgreenservers.github.io/Noosphere-Reflect/)***');

    return lines.join('\n');
}

// Export for module systems (if needed) or window global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { serializeAsJson, serializeAsMarkdown };
}
