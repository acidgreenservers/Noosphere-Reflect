import React from 'react';
import { Memory } from '../types';

interface Props {
    memory: Memory;
    onEdit: (memory: Memory) => void;
    onDelete: (id: string) => void;
    onExport: (memory: Memory, format: 'html' | 'markdown' | 'json') => void;
    onStatusToggle: (memory: Memory, e: React.MouseEvent) => void;
    onPreview: (memory: Memory) => void; // New prop
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    isPromptArchive?: boolean;
}

export default function MemoryCard({ memory, onEdit, onDelete, onExport, onStatusToggle, onPreview, isSelected, onToggleSelect, isPromptArchive = false }: Props) {
    const formattedDate = new Date(memory.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const handleStatusToggleLocal = async (e: React.MouseEvent) => {
        onStatusToggle(memory, e);
    };

    // Truncate content for preview (first 300 chars)
    const previewContent = memory.content.length > 300
        ? memory.content.substring(0, 300) + '...'
        : memory.content;

    const getModelColor = (model: string) => {
        switch (model.toLowerCase()) {
            case 'claude': return 'bg-orange-900/40 text-orange-200 border-orange-700/50';
            case 'gemini': return 'bg-blue-900/40 text-blue-200 border-blue-700/50';
            case 'chatgpt': return 'bg-emerald-900/40 text-emerald-200 border-emerald-700/50';
            case 'lechat': return 'bg-amber-900/40 text-amber-200 border-amber-700/50';
            case 'grok': return 'bg-black text-white border-white/20';
            case 'llamacoder': return 'bg-white text-black border-gray-200 font-medium';
            default: return 'bg-gray-800 text-gray-300 border-gray-600';
        }
    };

    const accentColor = isPromptArchive ? 'blue' : 'purple';
    const selectedBg = isPromptArchive ? 'bg-blue-900/20' : 'bg-purple-900/20';
    const selectedBorder = isPromptArchive ? 'border-blue-500/50' : 'border-purple-500/50';
    const selectedShadow = isPromptArchive ? 'shadow-blue-900/10 shadow-blue-500/20' : 'shadow-purple-900/10 shadow-purple-500/20';
    const hoverBorder = isPromptArchive ? 'hover:border-blue-500/30' : 'hover:border-purple-500/30';
    const hoverShadow = isPromptArchive ? 'hover:shadow-blue-900/10 hover:shadow-blue-500/20' : 'hover:shadow-purple-900/10 hover:shadow-purple-500/20';

    return (
        <div
            onClick={() => onEdit(memory)}
            className={`group relative border rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:scale-105 cursor-pointer
            ${isSelected
                ? `${selectedBg} ${selectedBorder} shadow-lg ${selectedShadow}`
                : `bg-gray-800/30 hover:bg-gray-800/50 border-gray-700/50 ${hoverBorder} ${hoverShadow} hover:shadow-lg`
            }`}>
            {/* Selection Checkbox & Preview - Hub Style */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onPreview(memory);
                    }}
                    className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider ${
                        isPromptArchive
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40'
                    } rounded transition-all`}
                    title={`Preview ${isPromptArchive ? 'prompt' : 'memory'} content`}
                >
                    Preview
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleSelect(memory.id);
                    }}
                    className={`w-6 h-6 rounded border flex items-center justify-center transition-all
                        ${isSelected
                            ? isPromptArchive
                                ? 'bg-blue-500 border-blue-500 text-white opacity-100'
                                : 'bg-purple-500 border-purple-500 text-white opacity-100'
                            : isPromptArchive
                                ? 'bg-gray-900/50 border-gray-600 hover:border-blue-400 text-transparent opacity-100'
                                : 'bg-gray-900/50 border-gray-600 hover:border-purple-400 text-transparent opacity-100'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            </div>

            <div className="flex justify-between items-start mb-3 gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-200 truncate group-hover:text-purple-300 transition-colors">
                        {memory.metadata.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded border ${getModelColor((memory as any).aiModel || (memory as any).metadata?.category || 'General')}`}>
                            {(memory as any).aiModel || (memory as any).metadata?.category || 'General'}
                        </span>
                        <span>•</span>
                        <span title={memory.createdAt}>{formattedDate}</span>
                        {memory.metadata.wordCount > 0 && (
                            <>
                                <span>•</span>
                                <span>{memory.metadata.wordCount} words</span>
                            </>
                        )}
                        {/* Export Status Badge */}
                        {memory.metadata.exportStatus === 'exported' && (
                            <>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-green-900/40 text-green-300 border border-green-700/50 rounded flex items-center gap-1">
                                    ✓ Exported
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    {/* Export Status Toggle Button */}
                    <button
                        onClick={handleStatusToggleLocal}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all hover:scale-110 ${memory.metadata.exportStatus === 'exported'
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                            : 'bg-red-500/20 border-red-500/50 text-red-400'
                            }`}
                        title={`Export Status: ${memory.metadata.exportStatus === 'exported' ? 'Exported' : 'Not Exported'} (Click to toggle)`}
                    >
                        {memory.metadata.exportStatus === 'exported' ? '📤' : '📥'}
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