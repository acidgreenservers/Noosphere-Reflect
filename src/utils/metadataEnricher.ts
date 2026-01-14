
import { ChatData, ChatMetadata, ParserMode, ChatMessageType } from '../types';

/**
 * Enriches chat metadata with auto-detected values.
 * 
 * 1. Detects model name from ParserMode
 * 2. Generates title from first message if missing
 * 3. Ensures tags include the model name
 * 4. Sets default date to now if missing
 */
export const enrichMetadata = (data: ChatData, mode: ParserMode): ChatMetadata => {
    const newMetadata: ChatMetadata = {
        title: data.metadata?.title || '',
        model: data.metadata?.model || '',
        date: data.metadata?.date || new Date().toISOString(),
        tags: [...(data.metadata?.tags || [])],
        artifacts: data.metadata?.artifacts || [],
        author: data.metadata?.author,
        sourceUrl: data.metadata?.sourceUrl,
        exportStatus: data.metadata?.exportStatus
    };

    // 1. Detect Model from ParserMode if not present
    if (!newMetadata.model) {
        newMetadata.model = getModelFromMode(mode);
    }

    // 2. Detect Title from first message if not present
    if (!newMetadata.title) {
        // Try to find the first prompt or response
        const firstMessage = data.messages.find(m => m.type === ChatMessageType.Prompt);
        const fallbackMessage = data.messages[0];

        const sourceMsg = firstMessage || fallbackMessage;

        if (sourceMsg) {
            // Clean up content to find a good title candidate
            // Remove markdown headers if present
            const cleanContent = sourceMsg.content.replace(/^#+\s+/g, '').trim();

            // Take first line or up to 60 chars
            let candidate = cleanContent.split('\n')[0].substring(0, 60).trim();

            // Remove typical "Prompt:" prefixes if they exist (legacy format)
            candidate = candidate.replace(/^(Prompt|User|Human):/i, '').trim();

            if (candidate.length > 0) {
                if (candidate.length === 60) candidate += '...';
                newMetadata.title = candidate;
            }
        }

        if (!newMetadata.title) {
            newMetadata.title = 'Untitled Chat Export';
        }
    }

    // 3. Ensure Tags exist and include model
    if (newMetadata.model) {
        const modelTag = newMetadata.model.toLowerCase().replace(/\s+/g, '-');
        if (!newMetadata.tags.includes(modelTag)) {
            newMetadata.tags.push(modelTag);
        }
    }

    return newMetadata;
};

const getModelFromMode = (mode: ParserMode): string => {
    switch (mode) {
        case ParserMode.ClaudeHtml: return 'Claude';
        case ParserMode.ChatGptHtml: return 'ChatGPT';
        case ParserMode.GeminiHtml: return 'Gemini';
        case ParserMode.LeChatHtml: return 'LeChat';
        case ParserMode.GrokHtml: return 'Grok';
        case ParserMode.LlamacoderHtml: return 'Llamacoder';
        case ParserMode.AiStudioHtml: return 'AI Studio';
        case ParserMode.KimiHtml: return 'Kimi';
        case ParserMode.KimiShareCopy: return 'Kimi';
        case ParserMode.Basic: return 'AI Assistant';
        default: return 'AI Assistant';
    }
}
