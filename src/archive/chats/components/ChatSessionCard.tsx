import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedChatSessionMetadata, SavedChatSession } from '../types';
import { getChatSessionById } from '../services/chatStorage';
import { formatRelativeDate } from '../../../utils/dateUtils';

interface ChatSessionCardProps {
    session: SavedChatSessionMetadata;
    isSelectionMode?: boolean;
    isSelected: boolean;
    onSelect: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onPreview: (session: SavedChatSession) => void;
    onManageArtifacts: (session: SavedChatSession) => void;
    getModelBadgeColor: (model: string | undefined) => string;
    viewMode?: 'grid' | 'list';
    onExport: (session: SavedChatSessionMetadata, format: 'html' | 'markdown' | 'json' | 'text', toClipboard?: boolean) => void;
    onMoveToProject?: () => void;
}

export function ChatSessionCard({
    session,
    isSelectionMode = false,
    isSelected,
    onSelect,
    onDelete,
    onPreview,
    onManageArtifacts,
    getModelBadgeColor,
    viewMode = 'grid',
    onExport,
    onMoveToProject
}: ChatSessionCardProps) {
    const navigate = useNavigate();
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

    const handleCardClick = async () => {
        try {
            const full = await getChatSessionById(session.id);
            if (full) onPreview(full);
        } catch (e) {
            console.error('Failed to load session', e);
        }
    };

    const handleArtifactsClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMenuOpen(false);
        try {
            const full = await getChatSessionById(session.id);
            if (full) onManageArtifacts(full);
        } catch (err) {
            console.error('Failed to load session for artifacts', err);
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMenuOpen(false);
        navigate(`/converter?load=${session.id}`);
    };

    const artifactCount = session.metadata?.artifacts?.length || 0;
    const formattedDate = formatRelativeDate(session.metadata?.date || session.date);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', session.id);
    };

    const renderMenu = () => (
        <div 
            ref={menuRef}
            className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={handleEditClick}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
            >
                <span>✏️</span> Edit Chat
            </button>
            {artifactCount > 0 && (
                <button
                    onClick={handleArtifactsClick}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2 border-t border-gray-800"
                >
                    <span>📎</span> Manage Artifacts ({artifactCount})
                </button>
            )}
            
            {onMoveToProject && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onMoveToProject();
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
                            <button onClick={(e) => { e.stopPropagation(); onExport(session, 'text', true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Text</button>
                            <button onClick={(e) => { e.stopPropagation(); onExport(session, 'markdown', true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Markdown</button>
                        </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onExport(session, 'text'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Plain Text</button>
                    <button onClick={(e) => { e.stopPropagation(); onExport(session, 'markdown'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📝 Markdown</button>
                    <button onClick={(e) => { e.stopPropagation(); onExport(session, 'html'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">🌐 HTML</button>
                    <button onClick={(e) => { e.stopPropagation(); onExport(session, 'json'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 hover:text-white">📊 JSON</button>
                </div>
            </div>

            <button
                onClick={(e) => {
                    setIsMenuOpen(false);
                    onDelete(session.id, e);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2 border-t border-gray-800"
            >
                <span>🗑️</span> Delete Chat
            </button>
        </div>
    );

    if (viewMode === 'list') {
        return (
            <div
                draggable
                onDragStart={handleDragStart}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all border-b border-transparent hover:bg-white/5 relative ${
                    isSelected ? 'bg-green-900/20' : ''
                }`}
            >
                <div className="flex items-center gap-4 min-w-0">
                    {isSelectionMode && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(session.id, e);
                            }}
                            className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0 ${
                                isSelected
                                    ? 'bg-green-500 border-green-500 text-[#0e1511]'
                                    : 'border-gray-500 hover:border-green-400 text-transparent'
                            }`}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    )}
                    
                    <div className="flex flex-col min-w-0">
                        <span 
                            onClick={handleCardClick}
                            className="text-sm font-semibold text-gray-200 truncate hover:text-green-300 transition-colors cursor-pointer hover:underline"
                        >
                            {session.metadata?.title || session.chatTitle || 'Untitled Chat'}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                            <span className="opacity-80">{session.metadata?.model || session.aiName}</span>
                            {session.metadata?.tags && session.metadata.tags.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="truncate max-w-[200px]">{session.metadata.tags.join(', ')}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 pl-4 relative">
                    {session.exportStatus === 'modified' && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded" title={`Exported ${session.metadata?.exportCount || 1} time(s)`}>
                            Modified
                        </span>
                    )}
                    {session.exportStatus === 'exported' && (
                        <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded" title={`Exported ${session.metadata?.exportCount || 1} time(s)`}>
                            Exported
                        </span>
                    )}
                    {artifactCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                            {artifactCount} Artifacts
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

    // Grid View
    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className={`group relative border rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:z-10 flex flex-col h-[160px]
                ${isSelected
                    ? 'bg-green-900/20 border-green-500/50 shadow-green-900/10 shadow-lg shadow-green-500/20 ring-2 ring-green-500/50'
                    : 'bg-gray-800/30 hover:bg-gray-800/50 border-white/5 hover:border-green-500/30 hover:shadow-green-900/10 hover:shadow-lg hover:shadow-green-500/20'
                }`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                    {session.metadata?.model && (
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getModelBadgeColor(session.metadata.model)}`}>
                            {session.metadata.model.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('-')}
                        </span>
                    )}
                </div>
                
                {isSelectionMode && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelect(session.id, e);
                        }}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-all hover:scale-110 active:scale-95
                            ${isSelected
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'bg-gray-900/50 border-gray-600 hover:border-green-400 text-transparent'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Title & Preview */}
            <div className="mb-2">
                <h3 
                    onClick={handleCardClick}
                    className="font-semibold text-base line-clamp-2 text-gray-100 hover:text-green-400 transition-colors cursor-pointer hover:underline"
                >
                    {session.metadata?.title || session.chatTitle || 'Untitled Chat'}
                </h3>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2 overflow-hidden h-[20px]">
                {(session.metadata?.tags || []).map((tag, i) => (
                    <span key={i} className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full whitespace-nowrap">
                        #{tag}
                    </span>
                ))}
                {(!session.metadata?.tags || session.metadata.tags.length === 0) && (
                    <span className="text-[10px] text-gray-600 italic">No tags</span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                    {session.exportStatus === 'modified' && (
                        <span className="text-[10px] text-amber-400/80" title={`Modified since export (${session.metadata?.exportCount || 1} exports)`}>📝 Modified</span>
                    )}
                    {session.exportStatus === 'exported' && (
                        <span className="text-[10px] text-purple-400/80" title={`Exported (${session.metadata?.exportCount || 1} exports)`}>📤 Exported</span>
                    )}
                    {artifactCount > 0 && (
                        <span className="text-[10px] text-blue-400/80" title="Has Artifacts">📎 {artifactCount}</span>
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
