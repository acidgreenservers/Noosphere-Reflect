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
}

export function ChatSessionCard({
    session,
    isSelected,
    onSelect,
    onDelete,
    onStatusToggle,
    onPreview,
    onManageArtifacts,
    getModelBadgeColor
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

    return (
        <div
            onClick={handleCardClick}
            draggable
            onDragStart={handleDragStart}
            className={`group relative border rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:scale-110 active:scale-95 block cursor-pointer
                ${isSelected
                    ? 'bg-green-900/20 border-green-500/50 shadow-green-900/10 shadow-lg shadow-green-500/20 ring-2 ring-green-500/50 scale-105'
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all hover:scale-110 ${session.exportStatus === 'exported'
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                            : 'bg-red-500/20 border-red-500/50 text-red-400'
                            }`}
                        title={`Export Status: ${session.exportStatus === 'exported' ? 'Exported' : 'Not Exported'} (Click to toggle)`}
                    >
                        {session.exportStatus === 'exported' ? '📤' : '📥'}
                    </button>

                    {/* Artifacts Button */}
                    {artifactCount > 0 ? (
                        <button
                            onClick={handleArtifactsClick}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-medium transition-colors hover:scale-105 shadow-lg shadow-emerald-500/50"
                            title="Manage artifacts for this chat"
                        >
                            <span>📎</span>
                            <span>{artifactCount}</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleArtifactsClick}
                            className="text-xs px-3 py-1 rounded-full bg-gray-700/50 hover:bg-emerald-600/50 text-gray-300 hover:text-white transition-colors font-medium hover:scale-105"
                            title="Add artifacts to this chat"
                        >
                            + Add Artifacts
                        </button>
                    )}

                    {/* Delete Button */}
                    <button
                        onClick={(e) => onDelete(session.id, e)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-100 mb-2 line-clamp-2 group-hover:text-green-300 transition-colors">
                {session.metadata?.title || session.chatTitle || session.name || 'Untitled Chat'}
            </h3>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
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
                        className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded hover:bg-purple-500/20 hover:border-purple-500/40 transition-all"
                        title="Edit conversation content"
                    >
                        Edit Chat
                    </button>
                    <button
                        onClick={(e) => onSelect(session.id, e)}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-all hover:scale-110
                            ${isSelected
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'bg-gray-900/50 border-gray-600 hover:border-green-400 text-transparent'
                            }`}
                        title={isSelected ? "Deselect this chat" : "Select this chat"}
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
