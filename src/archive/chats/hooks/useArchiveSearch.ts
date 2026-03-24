// useArchiveSearch Hook
// Extracted from ArchiveHub.tsx for search initialization and indexing

import { useEffect, useCallback, useState } from 'react';
import { SavedChatSessionMetadata } from '../types';
import { searchService } from '../../../services/searchService';
import { storageService } from '../../../services/storageService';

export interface UseArchiveSearchReturn {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    isSearchIndexing: boolean;
    filterSessions: (sessions: SavedChatSessionMetadata[]) => SavedChatSessionMetadata[];
}

export function useArchiveSearch(sessions: SavedChatSessionMetadata[]): UseArchiveSearchReturn {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchIndexing, setIsSearchIndexing] = useState(false);

    // Initialize search and index sessions
    useEffect(() => {
        if (sessions.length === 0) return;

        let cancelled = false;
        const initSearch = async () => {
            setIsSearchIndexing(true);
            try {
                await searchService.init();
                // Index all sessions - Streamed to avoid OOM
                // We fetch full sessions one by one so the GC can clean them up
                for (const sessionMeta of sessions) {
                    if (cancelled) break;
                    try {
                        const fullSession = await storageService.getSessionById(sessionMeta.id);
                        if (fullSession) {
                            await searchService.indexSession(fullSession);
                        }
                        // Small delay to yield to main thread and allow GC
                        await new Promise(resolve => setTimeout(resolve, 10));
                    } catch (err) {
                        console.warn(`Failed to index session ${sessionMeta.id}`, err);
                    }
                }
            } catch (error) {
                console.error('Failed to initialize search:', error);
            } finally {
                if (!cancelled) setIsSearchIndexing(false);
            }
        };

        initSearch();
        return () => { cancelled = true; };
    }, [sessions]);

    // Filter sessions by search term
    const filterSessions = useCallback((allSessions: SavedChatSessionMetadata[]) => {
        if (!searchTerm.trim()) return allSessions;

        const searchLower = searchTerm.toLowerCase();
        return allSessions.filter(session => {
            const title = (session.metadata?.title || session.chatTitle || session.name).toLowerCase();
            const tags = session.metadata?.tags?.join(' ').toLowerCase() || '';
            return title.includes(searchLower) || tags.includes(searchLower);
        });
    }, [searchTerm]);

    return {
        searchTerm,
        setSearchTerm,
        isSearchIndexing,
        filterSessions
    };
}
