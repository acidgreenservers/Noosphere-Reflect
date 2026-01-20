import React from 'react';
import { SavedChatSession, ParserMode } from '../../../types';

interface ConverterSidebarProps {
    sessions: SavedChatSession[];
    visible: boolean;
    onLoadSession: (session: SavedChatSession) => void;
    onDeleteSession: (id: string) => void;
}

/**
 * Sidebar showing saved sessions.
 * Renders only when `visible` is true.
 */
export const ConverterSidebar: React.FC<ConverterSidebarProps> = ({
    sessions,
    visible,
    onLoadSession,
    onDeleteSession
}) => {
    if (!visible) return null;

    const getParserLabel = (mode?: ParserMode): string => {
        switch (mode) {
            case ParserMode.LlamacoderHtml: return 'Llamacoder';
            case ParserMode.ClaudeHtml: return 'Claude';
            case ParserMode.LeChatHtml: return 'LeChat';
            default: return 'Basic';
        }
    };

    return (
        <aside className="w-full lg:w-80 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 h-fit animate-fade-in-down sticky top-24 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col shrink-0">
            <h2 className="font-semibold text-lg mb-4 text-white flex justify-between items-center">
                Saved Sessions
                <span className="text-xs font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full">
                    {sessions.length}
                </span>
            </h2>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {sessions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No saved sessions yet.</p>
                ) : (
                    sessions.map(session => (
                        <div
                            key={session.id}
                            className="p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-green-500/50 transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-medium text-sm text-gray-200 truncate pr-2">
                                    {session.name}
                                </p>
                                <span className="text-[10px] uppercase tracking-wider text-green-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20">
                                    {getParserLabel(session.parserMode)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                {new Date(session.date).toLocaleDateString()}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onLoadSession(session)}
                                    className="flex-1 text-xs py-1.5 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                                >
                                    Load
                                </button>
                                <button
                                    onClick={() => onDeleteSession(session.id)}
                                    className="px-2 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-200 rounded transition-colors text-xs"
                                >
                                    Del
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
};

export default ConverterSidebar;
