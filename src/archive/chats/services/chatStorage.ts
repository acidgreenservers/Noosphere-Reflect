// Chat Storage Service
// Extracted from storageService.ts for Chat Archive feature isolation

import { SavedChatSession, SavedChatSessionMetadata, ConversationArtifact } from '../types';

// Re-export from main service for now (later we can decouple completely)
export { storageService } from '../../../services/storageService';

// Helper functions specific to chat storage

/**
 * Get a full session by ID
 */
export async function getChatSessionById(id: string): Promise<SavedChatSession | undefined> {
    const { storageService } = await import('../../../services/storageService');
    return storageService.getSessionById(id);
}

/**
 * Get all session metadata (lightweight)
 */
export async function getAllChatSessionsMetadata(): Promise<SavedChatSessionMetadata[]> {
    const { storageService } = await import('../../../services/storageService');
    const sessions = await storageService.getAllSessionsMetadata();
    return sessions.sort((a, b) =>
        new Date(b.metadata?.date || b.date).getTime() -
        new Date(a.metadata?.date || a.date).getTime()
    );
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(id: string): Promise<void> {
    const { storageService } = await import('../../../services/storageService');
    return storageService.deleteSession(id);
}

/**
 * Save a chat session
 */
export async function saveChatSession(session: SavedChatSession): Promise<void> {
    const { storageService } = await import('../../../services/storageService');
    return storageService.saveSession(session);
}

/**
 * Update export status for a session
 */
export async function updateChatExportStatus(id: string, status: 'exported' | 'not_exported'): Promise<void> {
    const { storageService } = await import('../../../services/storageService');
    return storageService.updateExportStatus(id, status);
}

/**
 * Attach artifact to a session
 */
export async function attachArtifactToChat(sessionId: string, artifact: ConversationArtifact): Promise<void> {
    const { storageService } = await import('../../../services/storageService');
    return storageService.attachArtifact(sessionId, artifact);
}

/**
 * Remove artifact from a session
 */
export async function removeArtifactFromChat(sessionId: string, artifactId: string): Promise<void> {
    const { storageService } = await import('../../../services/storageService');
    return storageService.removeArtifact(sessionId, artifactId);
}
