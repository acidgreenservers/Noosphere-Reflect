// ChatSessionCard Component
// Extracted from ArchiveHub.tsx for reusable session display

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedChatSessionMetadata, SavedChatSession } from '../types';
import { getChatSessionById } from '../services/chatStorage';

interface ChatSessionCardProps {
    session: SavedChatSessionMetadata;
    isSelected: boolean;
    onSelect: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onStatusToggle: (session: SavedChatSessionMetadata, e: React.MouseEvent) => void;
    onPreview: (session: SavedChatSession) => void;
    onManageArtifacts: (session: SavedChatSession) => void;
    getModelBadgeColor: (model: string | undefined) => string;
    viewMode?: 'grid' | 'list';
}

export function ChatSessionCard({
    session,
    isSelected,
    onSelect,
    onDelete,
    onStatusToggle,
    onPreview,
    onManageArtifacts,
    getModelBadgeColor,
    viewMode = 'grid'
}: ChatSessionCardProps) {
    const navigate = useNavigate();

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
        navigate(`/converter?load=${session.id}`);
    };

    const artifactCount = session.metadata?.artifacts?.length || 0;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', session.id);
    };

    const formattedDate = new Date(session.metadata?.date || session.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    if (viewMode === 'list') {
        return (
            <div
                draggable
                onDragStart={handleDragStart}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all border-b border-transparent hover:bg-white/5 ${
                    isSelected ? 'bg-green-900/20' : ''
                }`}
            >
                <div className="flex items-center gap-4 min-w-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(session.id, e);
                        }}
                        className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0 ${
                            isSelected
                                ? 'bg-green-500 border-green-500 text-[#0e1511]'
                                : 'border-gray-500 group-hover:border-green-400 text-transparent'
                        }`}
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                    
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

                <div className="flex items-center gap-4 shrink-0 pl-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusToggle(session, e);
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                                session.exportStatus === 'exported'
                                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                                    : 'bg-red-500/20 border-red-500/50 text-red-400'
                            }`}
                            title={session.exportStatus === 'exported' ? 'Exported' : 'Not Exported'}
                        >
                            <span className="text-[10px]">{session.exportStatus === 'exported' ? '📤' : '📥'}</span>
                        </button>
                        
                        {artifactCount > 0 && (
                            <button
                                onClick={handleArtifactsClick}
                                className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-500/50 hover:bg-blue-500/40 transition-colors"
                                title="Manage Artifacts"
                            >
                                {artifactCount}
                            </button>
                        )}
                    </div>
                    
                    <span className="text-xs text-gray-500 w-24 text-right">{formattedDate}</span>
                    
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(session.id, e);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity"
                        title="Delete chat"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className={`group relative border rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:z-10 block
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
                <div className="flex items-center gap-2">
                    {/* Export Status Toggle */}
                    <button
                        onClick={(e) => onStatusToggle(session, e)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all hover:scale-110 active:scale-95 text-xs ${session.exportStatus === 'exported'
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                            : 'bg-red-500/20 border-red-500/50 text-red-400'
                            }`}
                        title={`Export Status: ${session.exportStatus === 'exported' ? 'Exported' : 'Not Exported'} (Click to toggle)`}
                        aria-label={`Toggle Export Status: Currently ${session.exportStatus === 'exported' ? 'Exported' : 'Not Exported'}`}
                    >
                        {session.exportStatus === 'exported' ? '📤' : '📥'}
                    </button>

                    {/* Artifacts Button */}
                    {artifactCount > 0 ? (
                        <button
                            onClick={handleArtifactsClick}
                            className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-500/50 hover:bg-blue-500/40 hover:scale-110 transition-all active:scale-95"
                            title={`Manage ${artifactCount} Artifact${artifactCount === 1 ? '' : 's'}`}
                        >
                            {artifactCount}
                        </button>
                    ) : (
                        <div className="w-7 h-7" /> 
                    )}
                </div>
            </div>

            {/* Title & Preview */}
            <div className="mb-3">
                <h3 
                    onClick={handleCardClick}
                    className="font-semibold text-base mb-1 truncate text-gray-100 hover:text-green-400 transition-colors cursor-pointer hover:underline"
                >
                    {session.metadata?.title || session.chatTitle || 'Untitled Chat'}
                </h3>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                {(session.metadata?.tags || []).map((tag, i) => (
                    <span key={i} className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                        #{tag}
                    </span>
                ))}
                {(!session.metadata?.tags || session.metadata.tags.length === 0) && (
                    <span className="text-xs text-gray-600 italic">No tags</span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(session.metadata?.date || session.date).toLocaleDateString()}
                    </div>
                    {session.exportStatus === 'exported' && (
                        <span className="px-2 py-0.5 bg-green-900/40 text-green-300 border border-green-700/50 rounded text-xs flex items-center gap-1 w-fit">
                            ✓ Exported
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleEditClick}
                        className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded hover:bg-purple-500/20 hover:border-purple-500/40 transition-all hover:scale-110 active:scale-95"
                        title="Edit conversation content"
                        aria-label="Edit chat"
                    >
                        Edit Chat
                    </button>
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
                        title={isSelected ? "Deselect this chat" : "Select this chat"}
                        aria-label={isSelected ? "Deselect this chat" : "Select this chat"}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
