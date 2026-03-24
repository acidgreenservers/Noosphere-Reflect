import React, { useRef, useState } from 'react';
import { ParserMode } from '../types';

interface ChatContentModalProps {
    inputContent: string;
    parserMode: ParserMode;
    onInputContentChange: (content: string) => void;
    onConvert: () => void;
    isConverting: boolean;
    onClose: () => void;
}

export const ChatContentModal: React.FC<ChatContentModalProps> = ({
    inputContent,
    parserMode,
    onInputContentChange,
    onConvert,
    isConverting,
    onClose
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleInsertCollapsible = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        if (start === end) {
            // No selection: just insert tags
            const newText = text.substring(0, start) + "<collapsible></collapsible>" + text.substring(end);
            onInputContentChange(newText);
            // Move cursor inside tags
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + 13, start + 13);
            }, 0);
        } else {
            // Wrap selection
            const selectedText = text.substring(start, end);
            const newText = text.substring(0, start) + `<collapsible>${selectedText}</collapsible>` + text.substring(end);
            onInputContentChange(newText);
            // Keep selection around text inside tags
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + 13, end + 13);
            }, 0);
        }
    };

    const getParserModeDisplay = () => {
        switch (parserMode) {
            case ParserMode.LlamacoderHtml: return 'Llamacoder';
            case ParserMode.ClaudeHtml: return 'Claude';
            case ParserMode.LeChatHtml: return 'LeChat';
            case ParserMode.ChatGptHtml: return 'ChatGPT';
            case ParserMode.GeminiHtml: return 'Gemini';
            case ParserMode.AiStudioHtml: return 'AI Studio';
            case ParserMode.KimiHtml: return 'Kimi';
            default: return 'Basic';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 sm:p-6 lg:p-10">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full h-full max-w-7xl border border-gray-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0 bg-gray-900">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                            <span className="text-2xl">💬</span>
                            Chat Content Input
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Paste or type your chat conversation here</span>
                            <span>•</span>
                            <span>{getParserModeDisplay()} Mode</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-lg border border-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
                    {/* Sidebar Toggle Button (Floating) */}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gray-800 border border-gray-700 p-1.5 rounded-r-lg text-gray-400 hover:text-white shadow-xl transition-all duration-300 hidden lg:block ${isSidebarCollapsed ? 'translate-x-0' : 'translate-x-80'}`}
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Left Sidebar: Tools & Options */}
                    <div className={`w-full lg:w-80 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0 z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:-ml-80 opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        {/* Quick Actions */}
                        <div className="p-4 border-b border-gray-800">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => onInputContentChange('')}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 rounded-lg transition-colors"
                                >
                                    Clear Content
                                </button>
                                <button
                                    onClick={handleInsertCollapsible}
                                    className="w-full text-left px-3 py-2 text-sm text-purple-400 hover:bg-purple-900/30 hover:text-purple-300 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    Add Collapsible
                                </button>
                            </div>
                        </div>

                        {/* Input Options */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mb-3">
                                Input Types
                            </h3>
                            <div className="space-y-1">
                                <div className="px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                                    📄 Plain Text
                                </div>
                                <div className="px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                                    🔗 HTML Source
                                </div>
                                <div className="px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                                    📋 JSON Data
                                </div>
                                <div className="px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                                    📝 Markdown
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Text Input Area */}
                    <div className="flex-1 overflow-hidden flex flex-col bg-gray-900">
                        <div className="flex-1 p-4 lg:p-8 overflow-hidden flex flex-col">
                            <div className="flex-1 bg-gray-800/40 backdrop-blur border border-gray-700 rounded-2xl shadow-lg overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-gray-700 bg-gray-900/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500/70"></div>
                                            <span className="text-sm font-mono text-gray-400">chat-input.txt</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {inputContent.length} characters
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 p-6 overflow-hidden">
                                    <textarea
                                        ref={textareaRef}
                                        value={inputContent}
                                        onChange={(e) => onInputContentChange(e.target.value)}
                                        placeholder={parserMode === ParserMode.LlamacoderHtml
                                            ? "Paste raw HTML source from Llamacoder here..."
                                            : parserMode === ParserMode.ClaudeHtml
                                                ? "Paste full HTML source from Claude chat here..."
                                                : parserMode === ParserMode.LeChatHtml
                                                    ? "Paste full HTML source from LeChat (Mistral) known as 'le-chat-layout'..."
                                                    : parserMode === ParserMode.ChatGptHtml
                                                        ? "Paste full HTML source from ChatGPT here..."
                                                        : parserMode === ParserMode.GeminiHtml
                                                            ? "Paste full HTML source from Google Gemini here..."
                                                            : parserMode === ParserMode.AiStudioHtml
                                                                ? "Paste full HTML source from Google AI Studio here..."
                                                                : parserMode === ParserMode.KimiHtml
                                                                    ? "Paste full HTML source from Kimi AI here..."
                                                                    : "Paste your chat here (Markdown or JSON)..."}
                                        className="w-full h-full bg-gray-900/50 border border-gray-600 rounded-lg p-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none"
                                    />

                                    <div className="mt-4 text-center">
                                        <p className="text-xs text-gray-500">
                                            <span className="text-purple-400 font-medium">Tip:</span> Use "Collapsible" to manually organize sections or preserve thinking chains. {parserMode === ParserMode.Basic ? 'Basic Mode is a fallback.' : `${getParserModeDisplay()} mode detected.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Convert Button */}
                        <div className="p-6 border-t border-gray-800 bg-gray-900/30 shrink-0">
                            <button
                                onClick={onConvert}
                                disabled={isConverting || !inputContent.trim()}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 relative ${
                                    isConverting || !inputContent.trim()
                                        ? 'bg-gray-600 cursor-not-allowed opacity-75'
                                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/25'
                                }`}
                            >
                                {isConverting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2 text-lg">
                                        ⚡ Archive Chat
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};