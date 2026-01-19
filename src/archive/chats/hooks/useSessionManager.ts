// useSessionManager Hook
// Extracted from ArchiveHub.tsx for session CRUD and state management

import { useState, useEffect, useCallback } from 'react';
import { SavedChatSessionMetadata, SavedChatSession } from '../types';
import { storageService } from '../../../services/storageService';

export interface UseSessionManagerReturn {
    sessions: SavedChatSessionMetadata[];
    isLoading: boolean;
    isRefreshing: boolean;
    loadSessions: () => Promise<void>;
    refreshSessions: () => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    batchDeleteSessions: (ids: Set<string>) => Promise<void>;
    updateExportStatus: (id: string, status: 'exported' | 'not_exported') => Promise<void>;
    getSessionById: (id: string) => Promise<SavedChatSession | undefined>;
}

export function useSessionManager(): UseSessionManagerReturn {
    const [sessions, setSessions] = useState<SavedChatSessionMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadSessions = useCallback(async () => {
        try {
            const allSessions = await storageService.getAllSessionsMetadata();
            setSessions(allSessions.sort((a, b) =>
                new Date(b.metadata?.date || b.date).getTime() -
                new Date(a.metadata?.date || a.date).getTime()
            ));
        } catch (e) {
            console.error('Failed to load sessions', e);
        }
    }, []);

    const refreshSessions = useCallback(async () => {
        setIsRefreshing(true);
        await loadSessions();
        setIsRefreshing(false);
    }, [loadSessions]);

    const deleteSession = useCallback(async (id: string) => {
        await storageService.deleteSession(id);
        await loadSessions();
    }, [loadSessions]);

    const batchDeleteSessions = useCallback(async (ids: Set<string>) => {
        for (const id of ids) {
            await storageService.deleteSession(id);
        }
        await loadSessions();
    }, [loadSessions]);

    const updateExportStatus = useCallback(async (id: string, status: 'exported' | 'not_exported') => {
        await storageService.updateExportStatus(id, status);
        // Optimistic update
        setSessions(prev => prev.map(s =>
            s.id === id ? {
                ...s,
                exportStatus: status,
                metadata: { ...(s.metadata || { title: s.chatTitle, model: '', date: s.date, tags: [] }), exportStatus: status }
            } : s
        ));
    }, []);

    const getSessionById = useCallback(async (id: string) => {
        return storageService.getSessionById(id);
    }, []);

    // Initialize
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            if (cancelled) return;
            setIsLoading(true);
            await storageService.migrateLegacyData();
            if (cancelled) return;
            await loadSessions();
            if (cancelled) return;
            setIsLoading(false);
        };
        init();
        return () => { cancelled = true; };
    }, [loadSessions]);

    // Auto-refresh on focus/visibility
    useEffect(() => {
        const handleFocus = () => loadSessions();
        const handleVisibilityChange = () => {
            if (!document.hidden) loadSessions();
        };
        const handleSessionImported = () => loadSessions();

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('sessionImported', handleSessionImported);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('sessionImported', handleSessionImported);
        };
    }, [loadSessions]);

    return {
        sessions,
        isLoading,
        isRefreshing,
        loadSessions,
        refreshSessions,
        deleteSession,
        batchDeleteSessions,
        updateExportStatus,
        getSessionById
    };
}
