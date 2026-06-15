import { SavedChatSession, ConversationArtifact } from '../../../types';
import { sanitizeHtml } from '../../../utils/securityUtils';

/**
 * ExportValidator ensures data integrity and security invariants during the export process.
 */
export class ExportValidator {
    /**
     * Validates that a session is ready for export and sanitizes its content.
     */
    static validateAndSanitizeSession(session: SavedChatSession): { isValid: boolean; error?: string } {
        if (!session.id) return { isValid: false, error: 'Session ID is missing' };
        if (!session.chatData || !session.chatData.messages) {
            return { isValid: false, error: 'Session chat content is missing' };
        }

        // Deep sanitization check
        session.chatData.messages = session.chatData.messages.map(msg => ({
            ...msg,
            content: sanitizeHtml(msg.content)
        }));

        return { isValid: true };
    }

    /**
     * Checks if all referenced artifacts in a session are valid and have data.
     */
    static validateArtifacts(session: SavedChatSession): { isValid: boolean; missingIds: string[] } {
        const artifacts: ConversationArtifact[] = [
            ...(session.metadata?.artifacts || []),
            ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
        ];

        const missingIds = artifacts
            .filter(a => !a.fileData || a.fileData.length === 0)
            .map(a => a.id);

        return {
            isValid: missingIds.length === 0,
            missingIds
        };
    }

    /**
     * Estimates the size of an export item in bytes.
     */
    static estimateSize(session: SavedChatSession, format: string): number {
        // Base content size
        let size = JSON.stringify(session.chatData).length;

        // Add size of artifacts (base64 is ~1.33x binary size, so we use actual data length)
        const artifacts = [
            ...(session.metadata?.artifacts || []),
            ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
        ];

        for (const artifact of artifacts) {
            size += (artifact.fileData?.length || 0);
        }

        // Overhead for ZIP headers and metadata
        return size * 1.1;
    }
}
