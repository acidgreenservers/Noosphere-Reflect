import { ConversationArtifact, ChatMessage } from '../types';
import { extractArtifactNamesFromChat, matchFileName } from './textNormalization';

/**
 * Result of an auto-match operation
 */
export interface AutoMatchResult {
    updatedArtifacts: ConversationArtifact[];
    updatedMessages: ChatMessage[];
    matchCount: number;
    matches: string[]; // Descriptions like "image.png -> Message #3"
}

/**
 * Processes new artifacts, adds them to the pool, and attempts to auto-link to messages.
 * Uses optimized O(M+A) complexity with Map-based lookups.
 * 
 * @param newArtifacts - Artifacts to add (already sanitized)
 * @param currentArtifacts - Existing artifact pool
 * @param currentMessages - Chat messages to scan for matches
 * @returns Updated state with auto-matched artifacts
 */
export const processArtifactUpload = (
    newArtifacts: ConversationArtifact[],
    currentArtifacts: ConversationArtifact[],
    currentMessages: ChatMessage[]
): AutoMatchResult => {
    const matches: string[] = [];
    const updatedMessages = [...currentMessages];
    const finalArtifacts = [...currentArtifacts];

    // Step 1: Build filename -> message indices map (O(M) where M = messages)
    const extractedNames = extractArtifactNamesFromChat(currentMessages);
    const filenameToMessageIndices = new Map<string, number[]>();

    extractedNames.forEach(name => {
        const normalizedName = name.toLowerCase();
        currentMessages.forEach((msg, idx) => {
            if (msg.content.toLowerCase().includes(normalizedName)) {
                if (!filenameToMessageIndices.has(normalizedName)) {
                    filenameToMessageIndices.set(normalizedName, []);
                }
                filenameToMessageIndices.get(normalizedName)!.push(idx);
            }
        });
    });

    // Step 2: Process each new artifact (O(A) where A = artifacts)
    for (const artifact of newArtifacts) {
        // Check for duplicates (filename + size)
        const isDuplicate = finalArtifacts.some(
            existing => existing.fileName === artifact.fileName && existing.fileSize === artifact.fileSize
        );

        if (isDuplicate) {
            console.warn(`⚠️ Duplicate artifact detected: ${artifact.fileName} (${artifact.fileSize} bytes) - skipping`);
            continue;
        }

        // Add to pool
        finalArtifacts.push(artifact);

        // Attempt auto-matching using the pre-built map
        let matchedToMessage = false;
        const normalizedFileName = artifact.fileName.toLowerCase();

        // Check if this filename matches any extracted names OR appears directly in text
        for (const [extractedName, messageIndices] of filenameToMessageIndices.entries()) {
            if (matchFileName(artifact.fileName, extractedName)) {
                // Link to all matching messages
                messageIndices.forEach(msgIndex => {
                    const msg = updatedMessages[msgIndex];
                    const msgArtifacts = msg.artifacts || [];

                    // Avoid duplicate attachments
                    if (!msgArtifacts.some(a => a.id === artifact.id)) {
                        updatedMessages[msgIndex] = {
                            ...msg,
                            artifacts: [...msgArtifacts, artifact]
                        };
                        matches.push(`${artifact.fileName} → Message #${msgIndex + 1} (Extracted)`);
                        matchedToMessage = true;

                        // Set insertedAfterMessageIndex to the first match
                        if (artifact.insertedAfterMessageIndex === undefined) {
                            artifact.insertedAfterMessageIndex = msgIndex;
                        }
                    }
                });
                break; // Found a match via extraction, stop
            }
        }

        // STRATEGY 2: Direct Search (If not matched by extraction)
        // If the filename has spaces (e.g. "My Report.pdf"), regex extraction often fails.
        // We explicitly search the message content for the normalized filename.
        if (!matchedToMessage) {
            const normalizedFileName = artifact.fileName.toLowerCase();
            const searchableName = normalizedFileName.replace(/\.[^/.]+$/, ""); // name without extension

            updatedMessages.forEach((msg, idx) => {
                const content = msg.content.toLowerCase();
                // We check for the full filename OR the base name (if unique enough > 4 chars)
                const hasFullMatch = content.includes(normalizedFileName);
                const hasBaseMatch = searchableName.length > 4 && content.includes(searchableName);

                if (hasFullMatch || hasBaseMatch) {
                    const msgArtifacts = msg.artifacts || [];
                    if (!msgArtifacts.some(a => a.id === artifact.id)) {
                        updatedMessages[idx] = {
                            ...msg,
                            artifacts: [...msgArtifacts, artifact]
                        };
                        matches.push(`${artifact.fileName} → Message #${idx + 1} (Direct Search)`);
                        matchedToMessage = true;

                        if (artifact.insertedAfterMessageIndex === undefined) {
                            artifact.insertedAfterMessageIndex = idx;
                        }
                    }
                }
            });
        }
    }

    return {
        updatedArtifacts: finalArtifacts,
        updatedMessages,
        matchCount: matches.length,
        matches
    };
};

/**
 * Handles removal of an artifact from the Global Pool.
 * Removes it from the pool AND scans all messages to remove it there too.
 * 
 * @param artifactId - ID of artifact to remove
 * @param currentArtifacts - Current artifact pool
 * @param currentMessages - Current messages
 * @returns Updated state with artifact removed everywhere
 */
export const processGlobalArtifactRemoval = (
    artifactId: string,
    currentArtifacts: ConversationArtifact[],
    currentMessages: ChatMessage[]
): { updatedArtifacts: ConversationArtifact[], updatedMessages: ChatMessage[] } => {
    // Remove from pool
    const updatedArtifacts = currentArtifacts.filter(a => a.id !== artifactId);

    // Remove from all messages
    const updatedMessages = currentMessages.map(msg => {
        if (!msg.artifacts || msg.artifacts.length === 0) return msg;

        const filtered = msg.artifacts.filter(a => a.id !== artifactId);

        // Only create new object if something changed
        if (filtered.length === msg.artifacts.length) return msg;

        return { ...msg, artifacts: filtered };
    });

    return { updatedArtifacts, updatedMessages };
};

/**
 * Handles removal of an artifact from a specific message (unlink only).
 * Does NOT remove from the global pool (safety-first approach).
 * 
 * @param artifactId - ID of artifact to unlink
 * @param messageIndex - Index of message to unlink from
 * @param currentMessages - Current messages
 * @returns Updated messages with artifact unlinked from specified message
 */
export const processMessageArtifactUnlink = (
    artifactId: string,
    messageIndex: number,
    currentMessages: ChatMessage[]
): ChatMessage[] => {
    const updatedMessages = [...currentMessages];
    const message = updatedMessages[messageIndex];

    if (message.artifacts) {
        updatedMessages[messageIndex] = {
            ...message,
            artifacts: message.artifacts.filter(a => a.id !== artifactId)
        };
    }

    return updatedMessages;
};
