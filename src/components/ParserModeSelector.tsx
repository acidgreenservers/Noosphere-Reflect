
import React from 'react';
import { ParserMode } from '../types';

interface ParserModeSelectorProps {
    selectedMode: ParserMode;
    onSelectMode: (mode: ParserMode) => void;
    currentMethod: 'extension' | 'console' | 'file' | null;
}

interface ParserOption {
    mode: ParserMode;
    label: string;
    description: string;
    icon: string;
    color: string;
    tldr?: string;
}

export const ParserModeSelector: React.FC<ParserModeSelectorProps> = ({ selectedMode, onSelectMode, currentMethod }) => {

    const allOptions: ParserOption[] = [
        {
            mode: ParserMode.Basic,
            label: 'Noosphere Standard',
            description: 'Markdown/JSON',
            icon: '📄',
            color: 'from-blue-500 to-indigo-600',
            tldr: 'Strict Noosphere Standard format'
        },
        {
            mode: ParserMode.ThirdPartyMarkdown,
            label: '3rd Party Exports',
            description: 'Markdown/JSON (also accepts 3rd party imports)',
            icon: '📦',
            color: 'from-gray-600 to-gray-700',
            tldr: 'Supports legacy headers like ## User:'
        },
        {
            mode: ParserMode.ClaudeHtml,
            label: 'Claude',
            description: 'Optimized for Anthropic Claude exports and HTML.',
            icon: '🧠',
            color: 'from-orange-600 to-red-600',
            tldr: 'Supports Artifacts & Thought blocks'
        },
        {
            mode: ParserMode.ChatGptHtml,
            label: 'ChatGPT',
            description: 'For OpenAI ChatGPT conversation exports.',
            icon: '🤖',
            color: 'from-teal-600 to-emerald-600',
            tldr: 'Handles canvas & code blocks'
        },
        {
            mode: ParserMode.GeminiHtml,
            label: 'Gemini',
            description: 'For Google Gemini interactions.',
            icon: '✨',
            color: 'from-blue-600 to-purple-600',
            tldr: 'Supports thinking drafts'
        },
        {
            mode: ParserMode.LeChatHtml,
            label: 'LeChat (Mistral)',
            description: 'For Mistral AI LeChat exports.',
            icon: '🌊',
            color: 'from-yellow-600 to-amber-600'
        },
        {
            mode: ParserMode.GrokHtml,
            label: 'Grok',
            description: 'For xAI Grok conversations.',
            icon: '🚀',
            color: 'from-gray-700 to-black'
        },
        {
            mode: ParserMode.LlamacoderHtml,
            label: 'Llamacoder',
            description: 'Together AI Llamacoder.',
            icon: '🦙',
            color: 'from-blue-500 to-indigo-600'
        },
        {
            mode: ParserMode.AiStudioHtml,
            label: 'AI Studio',
            description: 'Google AI Studio exports.',
            icon: '🔬',
            color: 'from-blue-700 to-blue-900'
        },
        {
            mode: ParserMode.KimiHtml,
            label: 'Kimi AI',
            description: 'Moonshot AI Kimi.',
            icon: '🌙',
            color: 'from-indigo-600 to-purple-700'
        }
    ];

    // Filter options based on method if needed, but for now show all mostly
    // Maybe highlight recommended ones based on method? 
    // For now, simple horizontal scroll

    return (
        <div className="space-y-4 animate-fade-in-down animation-delay-100">
            <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
                2. Select Platform
                <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">Identify the source</span>
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {allOptions.map((option) => (
                    <button
                        key={option.mode}
                        onClick={() => onSelectMode(option.mode)}
                        className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2 relative overflow-hidden group h-full hover:-translate-y-1 ${selectedMode === option.mode
                            ? 'bg-gray-800 border-green-500 shadow-lg shadow-green-500/10 scale-[1.02]'
                            : 'bg-gray-800/40 border-gray-700 hover:border-gray-500 hover:bg-gray-800/80'
                            }`}
                    >
                        {/* Header Bg Gradient */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${option.color} opacity-80`} />

                        <div className="flex justify-between items-start w-full">
                            <div className={`w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                                {option.icon}
                            </div>
                            {selectedMode === option.mode && (
                                <div className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                                    ✓
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <h3 className={`font-bold text-sm ${selectedMode === option.mode ? 'text-white' : 'text-gray-200'}`}>
                                {option.label}
                            </h3>
                            <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight">
                                {option.description}
                            </p>
                        </div>

                        {option.tldr && (
                            <div className="mt-2 pt-2 border-t border-gray-700/50">
                                <p className="text-[9px] text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1">
                                    <span>💡</span> {option.tldr}
                                </p>
                            </div>
                        )}

                        {/* Hover Help Icon (Placeholder for future modal trigger) */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-gray-500 hover:text-white text-xs bg-gray-900/80 rounded-full w-5 h-5 flex items-center justify-center border border-gray-700">?</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Contextual Tip based on selection */}
            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-4">
                <div className="text-xl">ℹ️</div>
                <div className="space-y-1">
                    <p className="text-sm text-blue-200/90 font-medium">
                        {selectedMode === ParserMode.Basic
                            ? "Basic Mode is a fallback."
                            : `Selected: ${allOptions.find(o => o.mode === selectedMode)?.label}`
                        }
                    </p>
                    <p className="text-xs text-blue-300/60 leading-relaxed">
                        {selectedMode === ParserMode.Basic
                            ? "Use this if you have a simple Markdown file or if other parsers fail. Make sure to use standard header formats."
                            : `This parser is specifically tuned for ${allOptions.find(o => o.mode === selectedMode)?.label}'s HTML structure.`
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};
