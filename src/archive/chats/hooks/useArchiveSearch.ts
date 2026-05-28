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
                const startTime = performance.now();
                await searchService.init();

                // Batch indexing - Process in chunks to balance speed and memory
                const CHUNK_SIZE = 50;
                for (let i = 0; i < sessions.length; i += CHUNK_SIZE) {
                    if (cancelled) break;

                    const chunk = sessions.slice(i, i + CHUNK_SIZE);
                    const fullSessions = [];

                    for (const sessionMeta of chunk) {
                        try {
                            const fullSession = await storageService.getSessionById(sessionMeta.id);
                            if (fullSession) {
                                fullSessions.push(fullSession);
                            }
                        } catch (err) {
                            console.warn(`Failed to fetch session ${sessionMeta.id} for indexing`, err);
                        }
                    }

                    if (fullSessions.length > 0) {
                        await searchService.indexSessions(fullSessions);
                    }

                    // Yield to main thread
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
                const duration = performance.now() - startTime;
                console.log(`⚡ Search indexing completed in ${duration.toFixed(2)}ms for ${sessions.length} sessions`);
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
