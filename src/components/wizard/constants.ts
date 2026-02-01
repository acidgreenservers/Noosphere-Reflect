import { ParserMode } from '../../types';
import { PlatformOption } from './types';

export const PLATFORM_OPTIONS: PlatformOption[] = [
    // Markdown Options
    {
        mode: ParserMode.ClaudeMarkdown,
        label: 'Claude',
        description: 'Anthropic Claude Markdown exports',
        icon: '🎭',
        color: 'from-orange-600 to-red-600',
        category: 'Claude',
        format: 'markdown'
    },
    {
        mode: ParserMode.GeminiMarkdown,
        label: 'Gemini',
        description: 'Google Gemini Markdown exports',
        icon: '✨',
        color: 'from-blue-600 to-purple-600',
        category: 'Gemini',
        format: 'markdown'
    },
    {
        mode: ParserMode.ChatGptMarkdown,
        label: 'ChatGPT',
        description: 'OpenAI ChatGPT Markdown exports',
        icon: '🤖',
        color: 'from-teal-600 to-emerald-600',
        category: 'ChatGPT',
        format: 'markdown'
    },
    {
        mode: ParserMode.GrokMarkdown,
        label: 'Grok',
        description: 'xAI Grok Markdown exports',
        icon: '🚀',
        color: 'from-gray-700 to-black',
        category: 'Grok',
        format: 'markdown'
    },
    {
        mode: ParserMode.KimiMarkdown,
        label: 'Kimi',
        description: 'Moonshot AI Kimi Markdown exports',
        icon: '🌙',
        color: 'from-purple-600 to-indigo-600',
        category: 'Kimi',
        format: 'markdown'
    },
    {
        mode: ParserMode.LeChatMarkdown,
        label: 'LeChat',
        description: 'Mistral AI LeChat Markdown exports',
        icon: '🌊',
        color: 'from-yellow-600 to-amber-600',
        category: 'LeChat',
        format: 'markdown'
    },
    {
        mode: ParserMode.ThirdPartyMarkdown,
        label: 'Other / Generic',
        description: 'Generic AI Chat Markdown (Auto-detects Metadata)',
        icon: '📜',
        color: 'from-cyan-600 to-blue-700',
        category: 'Generic',
        format: 'markdown'
    },

    // HTML Options
    {
        mode: ParserMode.ClaudeHtml,
        label: 'Claude',
        description: 'Anthropic Claude HTML exports with thought processes',
        icon: '🧠',
        color: 'from-orange-600 to-red-600',
        category: 'Claude',
        format: 'html'
    },
    {
        mode: ParserMode.GeminiHtml,
        label: 'Gemini',
        description: 'Google Gemini HTML exports with thinking blocks',
        icon: '✨',
        color: 'from-blue-600 to-purple-600',
        category: 'Gemini',
        format: 'html'
    },
    {
        mode: ParserMode.ChatGptHtml,
        label: 'ChatGPT',
        description: 'OpenAI ChatGPT conversation exports',
        icon: '🤖',
        color: 'from-teal-600 to-emerald-600',
        category: 'ChatGPT',
        format: 'html'
    },
    {
        mode: ParserMode.LeChatHtml,
        label: 'LeChat',
        description: 'Mistral AI LeChat HTML exports',
        icon: '🌊',
        color: 'from-yellow-600 to-amber-600',
        category: 'LeChat',
        format: 'html'
    },
    {
        mode: ParserMode.GrokHtml,
        label: 'Grok',
        description: 'xAI Grok conversation exports',
        icon: '🚀',
        color: 'from-gray-700 to-black',
        category: 'Grok',
        format: 'html'
    },

    // JSON Options
    {
        mode: ParserMode.ThirdPartyJson,
        label: 'Generic JSON',
        description: 'Standard JSON conversation data.',
        icon: '📦',
        color: 'from-purple-500 to-pink-600',
        category: 'Generic',
        format: 'json'
    },
    {
        mode: ParserMode.Basic,
        label: 'Noosphere Standard',
        description: 'Strict Noosphere Standard JSON',
        icon: '📄',
        color: 'from-blue-500 to-indigo-600',
        category: 'Native',
        format: 'json'
    },

    // Noosphere Options
    {
        mode: ParserMode.NoosphereMarkdown,
        label: 'Noosphere Reflect',
        description: 'Native high-fidelity Markdown from Noosphere scrapers.',
        icon: '✨',
        color: 'from-amber-400 to-orange-600',
        category: 'Native',
        format: 'noosphere'
    }
];
