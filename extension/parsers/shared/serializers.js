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
    const userName = 'User'; // Could be configurable
    const aiName = metadata?.model || 'AI';

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
    if (chatData.messages) {
        chatData.messages.forEach((message) => {
            const speakerName = message.type === 'prompt' ? userName : aiName;
            lines.push(`## ${speakerName}:\n`);

            // Convert thought blocks to markdown code blocks
            let content = message.content;
            // Replace <thought> tags with ```thought blocks
            content = content.replace(
                /<thought>([\s\S]*?)<\/thought>/g,
                '\n```thought\n$1\n```\n'
            );

            lines.push(content);
            lines.push('');
        });
    }

    // Footer
    lines.push('---\n');
    lines.push('# Noosphere Reflect');
    lines.push('*Meaning Through Memory*');

    return lines.join('\n');
}

// Export for module systems (if needed) or window global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { serializeAsJson, serializeAsMarkdown };
}
