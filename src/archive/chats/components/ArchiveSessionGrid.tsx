// ArchiveSessionGrid Component
// Extracted from ArchiveHub.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { SavedChatSessionMetadata, SavedChatSession } from '../../../types';
import { ChatSessionCard } from './ChatSessionCard';

export interface ArchiveSessionGridProps {
    sessions: SavedChatSessionMetadata[];
    selectedIds: Set<string>;
    isLoading: boolean;
    onSelect: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onStatusToggle: (session: SavedChatSessionMetadata, e: React.MouseEvent) => void;
    onPreview: (session: SavedChatSession) => void;
    onManageArtifacts: (session: SavedChatSession) => void;
    getModelBadgeColor: (model: string | undefined) => string;
}

export const ArchiveSessionGrid: React.FC<ArchiveSessionGridProps> = ({
    sessions,
    selectedIds,
    isLoading,
    onSelect,
    onDelete,
    onStatusToggle,
    onPreview,
    onManageArtifacts,
    getModelBadgeColor
}) => {

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
                <div className="col-span-full py-20 text-center">
                    <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Archiving system initialization...</p>
                </div>
            ) : sessions.length > 0 ? (
                sessions.map(session => (
                    <ChatSessionCard
                        key={session.id}
                        session={session}
                        isSelected={selectedIds.has(session.id)}
                        onSelect={onSelect}
                        onDelete={onDelete}
                        onStatusToggle={onStatusToggle}
                        onPreview={onPreview}
                        onManageArtifacts={onManageArtifacts}
                        getModelBadgeColor={getModelBadgeColor}
                    />

                ))
            ) : (
                <div className="col-span-full py-20 text-center text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gray-800/50 border border-white/5 flex items-center justify-center">
                        <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <p className="text-lg font-medium mb-1">No archives found</p>
                    <p className="text-sm opacity-60">Import a new chat or search for something else.</p>
                    <Link to="/converter" className="inline-block mt-4 text-green-400 hover:text-green-300">
                        Go to Converter
                    </Link>
                </div>
            )}
        </div>
    );
};
