import UnifiedGridCard from '../../../components/UnifiedGridCard';
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
        <UnifiedGridCard
            title={session.metadata?.title || session.chatTitle || 'Untitled Chat'}
            icon="💬"
            color="green"
            metadataLine={<>
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formattedDate}
                    </span>
                </>}
            badges={[
                ...(session.metadata?.model ? [{ text: session.metadata.model, colorClass: getModelBadgeColor(session.metadata.model) }] : []),
                ...(artifactCount > 0 ? [{ text: `${artifactCount} Artifacts`, colorClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' }] : []),
                ...(session.projectId ? [{ text: 'Project', colorClass: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' }] : [])
            ]}
            isSelected={isSelected}
            isSelectionMode={isSelectionMode}
            onToggleSelect={(e) => {
                e.stopPropagation();
                onSelect(session.id, e);
            }}
            onClick={handleCardClick}
            onMenuClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
            }}
            menuElement={isMenuOpen && renderMenu()}
            draggable
            onDragStart={handleDragStart}
        />
    );
}
