import React, { useState, useRef, useEffect } from 'react';
import { Memory } from '../types';
import { formatRelativeDate } from '../../../utils/dateUtils';

interface Props {
    memory: Memory;
    viewMode?: 'list' | 'grid';
    isSelectionMode?: boolean;
    onEdit: (memory: Memory) => void;
    onDelete: (id: string) => void;
    onExport: (memory: Memory, format: 'html' | 'markdown' | 'json' | 'text', toClipboard?: boolean) => void;
    onMoveToProject?: (memory: Memory) => void;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
}

export default function MemoryCard({ memory, viewMode = 'grid', isSelectionMode = false, onEdit, onDelete, onExport, onMoveToProject, isSelected, onToggleSelect }: Props) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const formattedDate = formatRelativeDate(memory.createdAt);

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

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', memory.id);
    };

    const renderMenu = () => (
        <div 
            ref={menuRef}
            className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={(e) => {
                    setIsMenuOpen(false);
                    e.stopPropagation();
                    onEdit(memory);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2 rounded-t-lg"
            >
                <span>✏️</span> Edit Memory
            </button>
            {onMoveToProject && (
                <button
                    onClick={(e) => {
                        setIsMenuOpen(false);
                        e.stopPropagation();
                        onMoveToProject(memory);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2 border-t border-gray-800"
                >
                    <span>📁</span> Move to Project
                </button>
            )}
            {/* Export Menu */}
            <div className="relative group/export border-t border-gray-800">
                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex justify-between items-center">
                    <div className="flex items-center gap-2"><span>📤</span> Export</div>
                    <span className="text-[10px]">◀</span>
                </button>
                <div className="absolute right-full top-0 mr-1 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-opacity duration-150 py-1 text-sm">
                    {/* Clipboard Submenu */}
                    <div className="relative group/clipboard">
                        <button className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors flex justify-between items-center">
                            <span>📋 Clipboard</span>
                            <span className="text-[10px]">◀</span>
                        </button>
                        <div className="absolute right-full top-0 mr-1 w-32 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover/clipboard:opacity-100 group-hover/clipboard:visible transition-opacity duration-150 py-1">
                            <button onClick={(e) => { e.stopPropagation(); onExport(memory, 'text', true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Text</button>
                            <button onClick={(e) => { e.stopPropagation(); onExport(memory, 'markdown', true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Markdown</button>
                        </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onExport(memory, 'text'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Plain Text</button>
                    <button onClick={(e) => { e.stopPropagation(); onExport(memory, 'markdown'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Markdown</button>
                    <button onClick={(e) => { e.stopPropagation(); onExport(memory, 'html'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">🌐 HTML</button>
                    <button onClick={(e) => { e.stopPropagation(); onExport(memory, 'json'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📊 JSON</button>
                </div>
            </div>


            <button
                onClick={(e) => {
                    setIsMenuOpen(false);
                    e.stopPropagation();
                    onDelete(memory.id);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2 border-t border-gray-800 rounded-b-lg"
            >
                <span>🗑️</span> Delete Memory
            </button>
        </div>
    );

    if (viewMode === 'list') {
        return (
            <div
                onClick={() => onEdit(memory)}
                draggable
                onDragStart={handleDragStart}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer border-b border-transparent hover:bg-white/5 relative ${
                    isSelected ? 'bg-purple-900/20' : ''
                }`}
            >
                <div className="flex items-center gap-4 min-w-0">
                    {isSelectionMode && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelect(memory.id);
                            }}
                            className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0 ${
                                isSelected
                                    ? 'bg-purple-500 border-purple-500 text-white'
                                    : 'border-gray-500 hover:border-purple-400 text-transparent'
                            }`}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    )}
                    
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-gray-200 truncate group-hover:text-purple-300 transition-colors">
                            {memory.metadata.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                            <span className="opacity-80">{memory.aiModel}</span>
                            {memory.tags.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="truncate max-w-[200px]">{memory.tags.join(', ')}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 pl-4 relative">
                    {memory.projectId && (
                        <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded font-bold" title="In a project">
                            Project
                        </span>
                    )}
                    {memory.metadata.exportStatus === 'modified' && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded" title={`Exported ${memory.metadata.exportCount || 1} time(s)`}>
                            Modified
                        </span>
                    )}
                    {memory.metadata.exportStatus === 'exported' && (
                        <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded" title={`Exported ${memory.metadata.exportCount || 1} time(s)`}>
                            Exported
                        </span>
                    )}

                    <div className="w-24 flex justify-end items-center relative">
                        <span className="text-xs text-gray-500 group-hover:opacity-0 transition-opacity absolute right-0">
                            {formattedDate}
                        </span>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 flex items-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                            >
                                ⋮
                            </button>
                            {isMenuOpen && renderMenu()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => onEdit(memory)}
            draggable
            onDragStart={handleDragStart}
            className={`group relative border rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] hover:z-10 active:scale-95 cursor-pointer flex flex-col h-[280px]
            ${isSelected
                    ? 'bg-purple-900/20 border-purple-500/50 shadow-lg shadow-purple-900/10 shadow-purple-500/20 ring-2 ring-purple-500/50 scale-[1.03]'
                    : 'bg-[#122622]/40 hover:bg-[#122622]/60 border-green-500/10 hover:border-purple-500/30 hover:shadow-purple-900/10 hover:shadow-purple-500/20 hover:shadow-lg'
                }`}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-3 gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-200 truncate group-hover:text-purple-300 transition-colors">
                        {memory.metadata.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded border ${getModelColor(memory.aiModel)}`}>
                            {memory.aiModel}
                        </span>
                        {memory.projectId && (
                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded text-[10px] font-bold" title="In a project">
                                Project
                            </span>
                        )}
                    </div>
                </div>

                {isSelectionMode && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleSelect(memory.id);
                        }}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-all hover:scale-110 active:scale-95
                            ${isSelected
                                ? 'bg-purple-500 border-purple-500 text-white opacity-100'
                                : 'bg-[#09100c]/50 border-gray-600 hover:border-purple-400 text-transparent opacity-100'
                            }`}
                        title={isSelected ? "Deselect this memory" : "Select this memory"}
                        aria-label={isSelected ? "Deselect this memory" : "Select this memory"}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="text-sm text-gray-300 font-mono whitespace-pre-wrap mb-4 bg-[#09100c]/30 border border-green-500/5 rounded p-3 flex-1 overflow-hidden relative">
                {previewContent}
                {memory.content.length > 300 && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#122622]/80 to-transparent pointer-events-none" />
                )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-2 overflow-hidden h-[24px]">
                {memory.tags.length > 0 ? memory.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-[#09100c]/50 rounded text-xs text-gray-400 border border-green-500/10 whitespace-nowrap">
                        #{tag}
                    </span>
                )) : (
                    <span className="text-[10px] text-gray-600 italic px-2 py-1">No tags</span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                    {memory.metadata.exportStatus === 'modified' && (
                        <span className="text-[10px] text-amber-400/80" title={`Modified since export (${memory.metadata.exportCount || 1} exports)`}>📝 Modified</span>
                    )}
                    {memory.metadata.exportStatus === 'exported' && (
                        <span className="text-[10px] text-purple-400/80" title={`Exported (${memory.metadata.exportCount || 1} exports)`}>📤 Exported</span>
                    )}
                    {memory.metadata.wordCount > 0 && (
                        <span className="text-[10px] text-gray-500" title="Word count">
                            {memory.metadata.wordCount} words
                        </span>
                    )}
                </div>
                
                <div className="flex justify-end items-center relative w-32 h-6">
                    <div className="absolute right-0 text-xs text-gray-500 group-hover:opacity-0 transition-opacity flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formattedDate}
                    </div>
                    
                    <div className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            className="p-1 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                        >
                            ⋮
                        </button>
                        {isMenuOpen && renderMenu()}
                    </div>
                </div>
            </div>
        </div>
    );
}
