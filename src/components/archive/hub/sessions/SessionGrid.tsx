import React, { useState, useMemo } from 'react';
import { SavedChatSessionMetadata, SavedChatSession } from '../../../types';
import { SessionCard } from './SessionCard';
import { SessionFilters } from './SessionFilters';
import { SelectionControls } from '../selection/SelectionControls';

interface SessionGridProps {
    sessions: SavedChatSessionMetadata[];
    selectedIds: Set<string>;
    isLoading: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
    onDeleteSession: (id: string, e: React.MouseEvent) => void;
    onStatusToggle: (session: SavedChatSessionMetadata, e: React.MouseEvent) => void;
    onManageArtifacts: (session: SavedChatSession) => Promise<void>;
    onEditChat: (sessionId: string) => void;
    onToggleSelection: (id: string, e: React.MouseEvent) => void;
    onToggleAll?: (ids: string[]) => void;
    onPreviewSession: (session: SavedChatSession) => void;
}

export const SessionGrid: React.FC<SessionGridProps> = ({
    sessions,
    selectedIds,
    isLoading,
    isRefreshing,
    onRefresh,
    onDeleteSession,
    onStatusToggle,
    onManageArtifacts,
    onEditChat,
    onToggleSelection,
    onPreviewSession,
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSessions = useMemo(() => {
        if (!searchTerm.trim()) return sessions;

        const searchLower = searchTerm.toLowerCase();
        return sessions.filter(session => {
            const title = (session.metadata?.title || session.chatTitle || session.name).toLowerCase();
            const tags = session.metadata?.tags?.join(' ').toLowerCase() || '';
            return title.includes(searchLower) || tags.includes(searchLower);
        });
    }, [sessions, searchTerm]);

    const areAllSelected = filteredSessions.length > 0 && filteredSessions.every(s => selectedIds.has(s.id));

    const handleSelectAll = () => {
        // This will be handled by parent component
        // For now, we'll emit an event or use a callback
        const newSelected = new Set(selectedIds);
        if (areAllSelected) {
            // Deselect visible sessions
            filteredSessions.forEach(s => newSelected.delete(s.id));
        } else {
            // Select all visible sessions
            filteredSessions.forEach(s => newSelected.add(s.id));
        }
        // This logic will be moved to parent component in the next phase
        console.log('Select all toggled:', newSelected);
    };

    if (isLoading) {
        return (
            <div className="col-span-full py-20 text-center">
                <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Archiving system initialization...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <SessionFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onRefresh={onRefresh}
                    isRefreshing={isRefreshing}
                />

                <SelectionControls
                    filteredSessionIds={filteredSessions.map(s => s.id)}
                    selectedIds={selectedIds}
                    onToggleAll={onToggleAll || handleSelectAll}
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSessions.length > 0 ? (
                    filteredSessions.map(session => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            isSelected={selectedIds.has(session.id)}
                            onClick={async () => {
                                // Fetch full session for preview
                                try {
                                    const { storageService } = await import('../../../services/storageService');
                                    const full = await storageService.getSessionById(session.id);
                                    if (full) onPreviewSession(full);
                                } catch (e) {
                                    console.error('Failed to load session for preview', e);
                                }
                            }}
                            onDelete={onDeleteSession}
                            onStatusToggle={onStatusToggle}
                            onManageArtifacts={onManageArtifacts}
                            onEditChat={onEditChat}
                            onToggleSelection={onToggleSelection}
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
                        <p className="text-sm opacity-60">
                            {searchTerm ? 'Try adjusting your search terms.' : 'Import a new chat or search for something else.'}
                        </p>
                        {!searchTerm && (
                            <a href="/converter" className="inline-block mt-4 text-green-400 hover:text-green-300">
                                Go to Converter
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};