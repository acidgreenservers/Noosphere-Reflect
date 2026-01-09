import React, { useState, useRef, useEffect } from 'react';
import { Memory } from '../types';

interface Props {
    memory: Memory;
    onEdit: (memory: Memory) => void;
    onDelete: (id: string) => void;
    onExport: (memory: Memory, format: 'html' | 'markdown' | 'json') => void;
}

export default function MemoryCard({ memory, onEdit, onDelete, onExport }: Props) {
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const formattedDate = new Date(memory.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        };

        if (showExportMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showExportMenu]);

    const handleExportClick = (format: 'html' | 'markdown' | 'json') => {
        onExport(memory, format);
        setShowExportMenu(false);
    };

    // Truncate content for preview (first 300 chars)
    const previewContent = memory.content.length > 300
        ? memory.content.substring(0, 300) + '...'
        : memory.content;

    const getModelColor = (model: string) => {
        switch (model.toLowerCase()) {
            case 'claude': return 'bg-orange-900/40 text-orange-200 border-orange-700/50';
            case 'gemini': return 'bg-blue-900/40 text-blue-200 border-blue-700/50';
            case 'chatgpt': return 'bg-green-900/40 text-green-200 border-green-700/50';
            case 'lechat': return 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50';
            case 'grok': return 'bg-gray-800 text-gray-200 border-gray-600';
            default: return 'bg-gray-800 text-gray-300 border-gray-600';
        }
    };

    return (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600 transition-all shadow-lg hover:shadow-xl group relative">
            <div className="flex justify-between items-start mb-3 gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-200 truncate">
                        {memory.metadata.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <span className={`px-2 py-0.5 rounded border ${getModelColor(memory.aiModel)}`}>
                            {memory.aiModel}
                        </span>
                        <span>•</span>
                        <span title={memory.createdAt}>{formattedDate}</span>
                        {memory.metadata.wordCount > 0 && (
                            <>
                                <span>•</span>
                                <span>{memory.metadata.wordCount} words</span>
                            </>
                        )}
                    </div>
                </div>

                <div className={`flex items-center gap-1 transition-opacity ${showExportMenu ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                    <div className="relative" ref={exportMenuRef}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                            title="Export"
                        >
                            📥
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl py-1 w-32 z-50">
                                <button
                                    onClick={() => handleExportClick('html')}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-gray-300"
                                >
                                    HTML
                                </button>
                                <button
                                    onClick={() => handleExportClick('markdown')}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-gray-300"
                                >
                                    Markdown
                                </button>
                                <button
                                    onClick={() => handleExportClick('json')}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-gray-300"
                                >
                                    JSON
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onEdit(memory)}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-yellow-400 transition-colors"
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        onClick={() => onDelete(memory.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <div className="text-sm text-gray-300 font-mono whitespace-pre-wrap mb-4 bg-gray-900/30 rounded p-3 max-h-48 overflow-hidden">
                {previewContent}
                {memory.content.length > 300 && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900/80 to-transparent pointer-events-none" />
                )}
            </div>

            {memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {memory.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-400 border border-gray-700">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
