import { useState, useRef } from 'react';
import { ConversationArtifact, ChatMessage, SavedChatSession } from '../../types';
import { validateFileSize, INPUT_LIMITS, sanitizeFilename, neutralizeDangerousExtension } from '../../../utils/securityUtils';
import { processArtifactUpload, processGlobalArtifactRemoval } from '../../../utils/artifactLinking';
import { storageService } from '../../../services/storageService';

interface UseArtifactManagerProps {
    session: SavedChatSession;
    messages: ChatMessage[];
    onArtifactsChange: (artifacts: ConversationArtifact[]) => void;
    onMessagesChange?: (messages: ChatMessage[]) => void;
    manualMode?: boolean;
}

export const useArtifactManager = ({
    session,
    messages,
    onArtifactsChange,
    onMessagesChange,
    manualMode = false
}: UseArtifactManagerProps) => {
    // Collect ALL artifacts from both sources
    const sessionArtifacts = session.metadata?.artifacts || [];
    const messageArtifacts = messages.flatMap((msg, msgIndex) =>
        (msg.artifacts || []).map(artifact => ({
            ...artifact,
            _messageIndex: msgIndex // Track which message this belongs to
        }))
    );

    const [artifacts, setArtifacts] = useState<ConversationArtifact[]>(sessionArtifacts);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            const newArtifacts: ConversationArtifact[] = [];

            // Process all files first
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate file size
                const validation = validateFileSize(file.size, INPUT_LIMITS.FILE_MAX_SIZE_MB);
                if (!validation.valid) {
                    setError(validation.error || 'File too large');
                    continue;
                }

                // Read file as base64
                const reader = new FileReader();
                const fileData = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        const result = reader.result as string;
                        // Remove data URL prefix to get pure base64
                        const base64 = result.split(',')[1];
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                // Sanitize Filename
                const safeName = neutralizeDangerousExtension(sanitizeFilename(file.name));

                // Create artifact object
                const artifact: ConversationArtifact = {
                    id: crypto.randomUUID(),
                    fileName: safeName,
                    fileSize: file.size,
                    mimeType: file.type || 'application/octet-stream',
                    fileData: fileData,
                    uploadedAt: new Date().toISOString()
                };

                newArtifacts.push(artifact);
            }

            // Use shared utility for auto-matching and deduplication
            const result = processArtifactUpload(newArtifacts, artifacts, messages);

            // Save to IndexedDB if not in manual mode
            if (!manualMode) {
                for (const artifact of result.updatedArtifacts.filter(a =>
                    !artifacts.some(existing => existing.id === a.id)
                )) {
                    await storageService.attachArtifact(session.id, artifact);
                }
            }

            // Update local state
            setArtifacts(result.updatedArtifacts);
            onArtifactsChange(result.updatedArtifacts);

            // Notify parent of message updates if callback exists
            if (onMessagesChange && result.matchCount > 0) {
                onMessagesChange(result.updatedMessages);
            }

            // Build success message with auto-match info
            let successMessage = `✅ ${newArtifacts.length} file(s) uploaded successfully`;
            if (result.matchCount > 0) {
                successMessage += `\n🎯 Auto-matched: ${result.matches.join(', ')}`;
            }

            setSuccess(successMessage);
        } catch (err) {
            setError('Failed to upload file: ' + (err as Error).message);
        } finally {
            setUploading(false);
            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleFileSelect(e.dataTransfer.files);
    };

    const handleRemove = async (artifactId: string, messageIndex?: number) => {
        try {
            if (messageIndex !== undefined) {
                // Message-level removal: unlink only (handled by storageService)
                if (!manualMode) {
                    await storageService.removeMessageArtifact(session.id, messageIndex, artifactId);
                }
                // Note: We don't update local artifacts state for message-level removal
                // as the artifact stays in the pool
                setSuccess('✅ Artifact unlinked from message');
            } else {
                // Session-level removal: use utility for synchronized removal
                const result = processGlobalArtifactRemoval(artifactId, artifacts, messages);

                if (!manualMode) {
                    await storageService.removeArtifact(session.id, artifactId);
                }

                setArtifacts(result.updatedArtifacts);
                onArtifactsChange(result.updatedArtifacts);

                // Notify parent of message updates if callback exists
                if (onMessagesChange) {
                    onMessagesChange(result.updatedMessages);
                }

                setSuccess('✅ Artifact removed from all locations');
            }
        } catch (err) {
            setError('Failed to remove artifact: ' + (err as Error).message);
        }
    };

    const handleInsertLink = async (artifactId: string, messageIndex: number) => {
        try {
            if (!manualMode) {
                await storageService.updateArtifact(session.id, artifactId, {
                    insertedAfterMessageIndex: messageIndex
                });
            }

            // Update local state
            const newArtifacts = artifacts.map(a =>
                a.id === artifactId ? { ...a, insertedAfterMessageIndex: messageIndex } : a
            );
            setArtifacts(newArtifacts);

            setSuccess(`✅ Link inserted after Message #${messageIndex + 1}`);
            onArtifactsChange(newArtifacts);
        } catch (err) {
            setError('Failed to insert link: ' + (err as Error).message);
        }
    };

    return {
        artifacts,
        messageArtifacts,
        uploading,
        error,
        success,
        fileInputRef,
        handleFileSelect,
        handleDragOver,
        handleDrop,
        handleRemove,
        handleInsertLink
    };
};
