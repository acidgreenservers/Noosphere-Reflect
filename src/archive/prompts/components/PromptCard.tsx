import React, { useState, useRef, useEffect } from 'react';
import { Prompt } from '../types';
import { formatRelativeDate } from '../../../utils/dateUtils';

interface Props {
    prompt: Prompt;
    viewMode?: 'list' | 'grid';
    isSelectionMode?: boolean;
    onEdit: (prompt: Prompt) => void;
    onDelete: (id: string) => void;
    onExport: (prompt: Prompt, format: 'html' | 'markdown' | 'json' | 'text', toClipboard?: boolean) => void;
    onMoveToProject?: (prompt: Prompt) => void;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
}

export default function PromptCard({ prompt, viewMode = 'grid', isSelectionMode = false, onEdit, onDelete, onExport, onMoveToProject, isSelected, onToggleSelect }: Props) {
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

    const formattedDate = formatRelativeDate(prompt.createdAt);

    const previewContent = prompt.content.length > 300
        ? prompt.content.substring(0, 300) + '...'
        : prompt.content;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', prompt.id);
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
                    onEdit(prompt);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
            >
                <span>✏️</span> Edit Prompt
            </button>
            {onMoveToProject && (
                <button
                    onClick={(e) => {
                        setIsMenuOpen(false);
                        e.stopPropagation();
                        onMoveToProject(prompt);
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
                            <button onClick={(e) => { e.stopPropagation(); onExport(prompt, 'text', true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Text</button>
                            <button onClick={(e) => { e.stopPropagation(); onExport(prompt, 'markdown', true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Markdown</button>
                        </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onExport(prompt, 'text'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Plain Text</button>
                    <button onClick={(e) => { e.stopPropagation(); onExport(prompt, 'markdown'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Markdown</button>
                    <button onClick={(e) => { e.stopPropagation(); onExport(prompt, 'html'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">🌐 HTML</button>
                    <button onClick={(e) => { e.stopPropagation(); onExport(prompt, 'json'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📊 JSON</button>
                </div>
            </div>

            <button
                onClick={(e) => {
                    setIsMenuOpen(false);
                    e.stopPropagation();
                    onDelete(prompt.id);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2 border-t border-gray-800"
            >
                <span>🗑️</span> Delete Prompt
            </button>
        </div>
    );

    if (viewMode === 'list') {
        return (
            <div
                onClick={() => onEdit(prompt)}
                draggable
                onDragStart={handleDragStart}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer border-b border-transparent hover:bg-white/5 relative ${
                    isSelected ? 'bg-blue-900/20' : ''
                }`}
            >
                <div className="flex items-center gap-4 min-w-0">
                    {isSelectionMode && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelect(prompt.id);
                            }}
                            className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0 ${
                                isSelected
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'border-gray-500 hover:border-blue-400 text-transparent'
                            }`}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    )}
                    
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-gray-200 truncate group-hover:text-blue-300 transition-colors">
                            {prompt.metadata.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                            <span className="opacity-80 text-blue-400">{prompt.category}</span>
                            {prompt.tags.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="truncate max-w-[200px]">{prompt.tags.join(', ')}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 pl-4 relative">
                    {prompt.projectId && (
                        <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded font-bold" title="In a project">
                            Project
                        </span>
                    )}
                    {prompt.metadata.exportStatus === 'modified' && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded" title={`Exported ${prompt.metadata.exportCount || 1} time(s)`}>
                            Modified
                        </span>
                    )}
                    {prompt.metadata.exportStatus === 'exported' && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded" title={`Exported ${prompt.metadata.exportCount || 1} time(s)`}>
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
            onClick={() => onEdit(prompt)}
            draggable
            onDragStart={handleDragStart}
            className={`group relative border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] hover:z-10 active:scale-95 cursor-pointer flex flex-col h-[240px]
            ${isSelected
                    ? 'bg-blue-900/10 border-blue-500/50 shadow-lg shadow-blue-900/10 shadow-blue-500/20 ring-1 ring-blue-500/50 scale-[1.03]'
                    : 'bg-[#122622]/20 hover:bg-[#122622]/40 border-gray-600/10 hover:border-blue-500/30 hover:shadow-blue-900/5 hover:shadow-blue-500/10 hover:shadow-lg'
                }`}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-3 gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-200 truncate group-hover:text-blue-300 transition-colors">
                        {prompt.metadata.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded border bg-blue-900/40 text-blue-200 border-blue-700/50`}>
                            {prompt.category}
                        </span>
                        {prompt.projectId && (
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
                            onToggleSelect(prompt.id);
                        }}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-all hover:scale-110 active:scale-95
                            ${isSelected
                                ? 'bg-blue-500 border-blue-500 text-white opacity-100'
                                : 'bg-[#09100c]/50 border-gray-600 hover:border-blue-400 text-transparent opacity-100'
                            }`}
                        title={isSelected ? "Deselect this prompt" : "Select this prompt"}
                        aria-label={isSelected ? "Deselect this prompt" : "Select this prompt"}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="text-sm text-gray-400 font-mono whitespace-pre-wrap mb-4 flex-1 overflow-hidden relative">
                {previewContent}
                {prompt.content.length > 300 && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0e1511] to-transparent pointer-events-none" />
                )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-2 overflow-hidden h-[24px]">
                {prompt.tags.length > 0 ? prompt.tags.map((tag, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-gray-500/5 rounded text-[10px] text-gray-500 border border-gray-500/10 whitespace-nowrap">
                        #{tag}
                    </span>
                )) : (
                    <span className="text-[10px] text-gray-600 italic px-2 py-1">No tags</span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                    {prompt.metadata.exportStatus === 'modified' && (
                        <span className="text-[10px] text-amber-400/80" title={`Modified since export (${prompt.metadata.exportCount || 1} exports)`}>📝 Modified</span>
                    )}
                    {prompt.metadata.exportStatus === 'exported' && (
                        <span className="text-[10px] text-blue-400/80" title={`Exported (${prompt.metadata.exportCount || 1} exports)`}>📤 Exported</span>
                    )}
                    {prompt.metadata.wordCount > 0 && (
                        <span className="text-[10px] text-gray-500" title="Word count">
                            {prompt.metadata.wordCount} words
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
