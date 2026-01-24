import React from 'react';
import { Prompt } from '../types';

interface Props {
    prompt: Prompt;
    onEdit: (prompt: Prompt) => void;
    onDelete: (id: string) => void;
    onExport: (prompt: Prompt, format: 'html' | 'markdown' | 'json') => void;
    onStatusToggle: (prompt: Prompt, e: React.MouseEvent) => void;
    onPreview: (prompt: Prompt) => void;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
}

export default function PromptCard({ prompt, onEdit, onDelete, onExport, onStatusToggle, onPreview, isSelected, onToggleSelect }: Props) {
    const formattedDate = new Date(prompt.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const handleStatusToggleLocal = async (e: React.MouseEvent) => {
        onStatusToggle(prompt, e);
    };

    const previewContent = prompt.content.length > 300
        ? prompt.content.substring(0, 300) + '...'
        : prompt.content;

    const getCategoryColor = (category: string) => {
        switch (category?.toLowerCase()) {
            case 'coding': return 'bg-emerald-900/40 text-emerald-200 border-emerald-700/50';
            case 'writing': return 'bg-amber-900/40 text-amber-200 border-amber-700/50';
            case 'analysis': return 'bg-purple-900/40 text-purple-200 border-purple-700/50';
            case 'research': return 'bg-cyan-900/40 text-cyan-200 border-cyan-700/50';
            case 'creative': return 'bg-pink-900/40 text-pink-200 border-pink-700/50';
            default: return 'bg-gray-800 text-gray-300 border-gray-600';
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', prompt.id);
    };

    return (
        <div
            onClick={() => onPreview(prompt)}
            draggable
            onDragStart={handleDragStart}
            className={`group relative border rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer
            ${isSelected
                    ? 'bg-blue-900/20 border-blue-500/50 shadow-lg shadow-blue-900/10 shadow-blue-500/20 ring-2 ring-blue-500/50 scale-105'
                    : 'bg-gray-800/30 hover:bg-gray-800/50 border-gray-700/50 hover:border-blue-500/30 hover:shadow-blue-900/10 hover:shadow-blue-500/20 hover:shadow-lg'
                }`}>
            {/* Selection Checkbox & Edit Button */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit(prompt);
                    }}
                    className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 rounded transition-all"
                    title="Edit prompt content"
                >
                    Edit
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleSelect(prompt.id);
                    }}
                    className={`w-6 h-6 rounded border flex items-center justify-center transition-all
                        ${isSelected
                            ? 'bg-blue-500 border-blue-500 text-white opacity-100'
                            : 'bg-gray-900/50 border-gray-600 hover:border-blue-400 text-transparent opacity-100'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            </div>

            <div className="flex justify-between items-start mb-3 gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-200 truncate group-hover:text-blue-300 transition-colors">
                        {prompt.metadata.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded border ${getCategoryColor(prompt.metadata.category || 'General')}`}>
                            {prompt.metadata.category || 'General'}
                        </span>
                        <span>•</span>
                        <span title={prompt.createdAt}>{formattedDate}</span>
                        {prompt.metadata.wordCount > 0 && (
                            <>
                                <span>•</span>
                                <span>{prompt.metadata.wordCount} words</span>
                            </>
                        )}
                        {prompt.metadata.exportStatus === 'exported' && (
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
                    <button
                        onClick={handleStatusToggleLocal}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all hover:scale-110 ${prompt.metadata.exportStatus === 'exported'
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                            : 'bg-red-500/20 border-red-500/50 text-red-400'
                            }`}
                        title={`Export Status: ${prompt.metadata.exportStatus === 'exported' ? 'Exported' : 'Not Exported'} (Click to toggle)`}
                    >
                        {prompt.metadata.exportStatus === 'exported' ? '📤' : '📥'}
                    </button>
                </div>
            </div>

            <div className="text-sm text-gray-300 font-mono whitespace-pre-wrap mb-4 bg-gray-900/30 rounded p-3 max-h-48 overflow-hidden">
                {previewContent}
                {prompt.content.length > 300 && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900/80 to-transparent pointer-events-none" />
                )}
            </div>

            {prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {prompt.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-400 border border-gray-700">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
