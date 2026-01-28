import { MARKDOWN_SIGNALS, ImportSignal } from '../imports/markdown';
import { ParserMode } from '../../../types';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface DetectionResult {
    signal: ImportSignal | null;
    method: 'markdown' | 'json' | 'html' | 'auto';
    confidence: ConfidenceLevel;
    reason?: string;
}

/**
 * ULTRA-ROBUST detection using ONLY export structural markers.
 * 
 * Strategy:
 * 1. Check HEADER (first 300 chars) for URL pattern in **Link:** field
 * 2. Check FOOTER (last 100 chars) for "Powered by [X Exporter]" signature
 * 3. Verify BODY structure has "## Prompt:" and "## Response:" markers
 * 
 * We IGNORE all chat content to prevent false positives from user mentions.
 */
export const detectImportSignal = (content: string): DetectionResult => {
    if (!content || content.trim().length < 5) {
        return { signal: null, method: 'auto', confidence: 'low' };
    }

    // 1. Check for JSON structure first
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        return {
            signal: {
                id: 'json-auto',
                name: 'JSON Data',
                icon: '📦',
                mode: ParserMode.ThirdPartyJson,
                description: 'Structured JSON data detected.',
                detect: () => true
            },
            method: 'json',
            confidence: 'high',
            reason: 'JSON structure detected'
        };
    }

    // 2. Check for HTML structure
    if (content.trim().toLowerCase().startsWith('<!doctype html') || content.trim().toLowerCase().startsWith('<html')) {
        return {
            signal: {
                id: 'html-auto',
                name: 'HTML Source',
                icon: '🌐',
                mode: ParserMode.Basic,
                description: 'Raw HTML structure detected.',
                detect: () => true
            },
            method: 'html',
            confidence: 'high',
            reason: 'HTML document structure detected'
        };
    }

    // 3. STRUCTURAL MARKER DETECTION (Export Format Markers Only)
    const header = content.slice(0, 300);  // First 300 chars for metadata
    const footer = content.slice(-100);     // Last 100 chars for signature

    // Check for standard export structure markers
    const hasPromptResponseStructure = content.includes('## Prompt:') && content.includes('## Response:');

    if (!hasPromptResponseStructure) {
        // Not a standard markdown export format
        return { signal: null, method: 'auto', confidence: 'low' };
    }

    // Platform detection using URL pattern in header + footer signature
    const platformSignatures = [
        {
            id: 'gemini-md',
            urlPattern: 'gemini.google.com/gem/',
            footerPattern: 'Powered by [Gemini Exporter]',
            name: 'Gemini'
        },
        {
            id: 'claude-md',
            urlPattern: 'claude.ai/chat/',
            footerPattern: 'Powered by [Claude Exporter]',
            name: 'Claude'
        },
        {
            id: 'gpt-md',
            urlPattern: 'chatgpt.com/c/',
            footerPattern: 'Powered by [ChatGPT Exporter]',
            name: 'ChatGPT'
        },
        {
            id: 'grok-md',
            urlPattern: 'x.com/i/grok',
            footerPattern: 'Powered by [Grok Exporter]',
            name: 'Grok'
        },
        {
            id: 'lechat-md',
            urlPattern: 'mistral.ai/chat',
            footerPattern: 'Powered by [LeChat Exporter]',
            name: 'LeChat'
        },
        {
            id: 'llamacoder-md',
            urlPattern: 'llamacoder.together.ai',
            footerPattern: 'Powered by [Llamacoder Exporter]',
            name: 'Llamacoder'
        },
        {
            id: 'aistudio-md',
            urlPattern: 'aistudio.google.com',
            footerPattern: 'Powered by [AI Studio Exporter]',
            name: 'AI Studio'
        }
    ];

    // Check each platform
    for (const platform of platformSignatures) {
        const hasUrlPattern = header.includes(platform.urlPattern);
        const hasFooterSignature = footer.includes(platform.footerPattern);

        // BOTH must match for high confidence
        if (hasUrlPattern && hasFooterSignature) {
            const signal = MARKDOWN_SIGNALS.find(s => s.id === platform.id);
            if (signal) {
                return {
                    signal,
                    method: 'markdown',
                    confidence: 'high',
                    reason: `Export markers detected: URL pattern "${platform.urlPattern}" + footer signature`
                };
            }
        }

        // Only URL pattern (medium confidence - might be incomplete export)
        if (hasUrlPattern) {
            const signal = MARKDOWN_SIGNALS.find(s => s.id === platform.id);
            if (signal) {
                return {
                    signal,
                    method: 'markdown',
                    confidence: 'medium',
                    reason: `URL pattern detected: "${platform.urlPattern}" (footer signature missing)`
                };
            }
        }
    }

    // 4. Check for Kimi (uses different structure with User:/Kimi: labels)
    const kimiSignal = MARKDOWN_SIGNALS.find(s => s.id === 'kimi-md');
    if (kimiSignal && content.includes('\nKimi:') && content.includes('\nUser:')) {
        return {
            signal: kimiSignal,
            method: 'markdown',
            confidence: 'medium',
            reason: 'Kimi conversation structure detected (User:/Kimi: labels)'
        };
    }

    // 5. FALLBACK: Generic Markdown (has Prompt/Response structure but unknown platform)
    const genericSignal = MARKDOWN_SIGNALS.find(s => s.id === 'generic-md');
    if (genericSignal) {
        return {
            signal: genericSignal,
            method: 'markdown',
            confidence: 'low',
            reason: 'Generic markdown with Prompt/Response structure detected'
        };
    }

    return { signal: null, method: 'auto', confidence: 'low' };
};
