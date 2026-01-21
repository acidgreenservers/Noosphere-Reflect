import { ParserMode } from '../../types';
import { PlatformOption } from './types';

export const PLATFORM_OPTIONS: PlatformOption[] = [
    {
        mode: ParserMode.Basic,
        label: 'Noosphere Standard',
        description: 'Strict Noosphere Standard (Markdown/JSON)',
        icon: '📄',
        color: 'from-blue-500 to-indigo-600',
        category: 'Text & Markdown'
    },
    {
        mode: ParserMode.ThirdPartyMarkdown,
        label: '3rd Party Exports',
        description: 'Markdown/JSON (also accepts 3rd party imports)',
        icon: '📦',
        color: 'from-gray-600 to-gray-700',
        category: 'Text & Markdown'
    },
    {
        mode: ParserMode.ClaudeHtml,
        label: 'Claude',
        description: 'Anthropic Claude HTML exports with thought processes',
        icon: '🧠',
        color: 'from-orange-600 to-red-600',
        category: 'Claude'
    },
    {
        mode: ParserMode.GeminiHtml,
        label: 'Gemini',
        description: 'Google Gemini HTML exports with thinking blocks',
        icon: '✨',
        color: 'from-blue-600 to-purple-600',
        category: 'Gemini'
    },
    {
        mode: ParserMode.ChatGptHtml,
        label: 'ChatGPT',
        description: 'OpenAI ChatGPT conversation exports',
        icon: '🤖',
        color: 'from-teal-600 to-emerald-600',
        category: 'ChatGPT'
    },
    {
        mode: ParserMode.LeChatHtml,
        label: 'LeChat',
        description: 'Mistral AI LeChat HTML exports',
        icon: '🌊',
        color: 'from-yellow-600 to-amber-600',
        category: 'LeChat'
    },
    {
        mode: ParserMode.GrokHtml,
        label: 'Grok',
        description: 'xAI Grok conversation exports',
        icon: '🚀',
        color: 'from-gray-700 to-black',
        category: 'Grok'
    },
    {
        mode: ParserMode.LlamacoderHtml,
        label: 'Llamacoder',
        description: 'Together AI Llamacoder HTML exports',
        icon: '🦙',
        color: 'from-blue-500 to-indigo-600',
        category: 'Llamacoder'
    },
    {
        mode: ParserMode.AiStudioHtml,
        label: 'AI Studio',
        description: 'Google AI Studio console exports',
        icon: '🔬',
        color: 'from-blue-700 to-blue-900',
        category: 'AI Studio'
    },
    {
        mode: ParserMode.KimiHtml,
        label: 'Kimi AI',
        description: 'Moonshot AI Kimi HTML exports',
        icon: '🌙',
        color: 'from-indigo-600 to-purple-700',
        category: 'Kimi'
    }
];
