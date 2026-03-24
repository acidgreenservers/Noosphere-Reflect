// useExtensionBridge Hook
// Extracted from ArchiveHub.tsx for Chrome extension communication

import { useEffect, useCallback } from 'react';
import { SavedChatSession, ConversationArtifact } from '../../../types';
import { storageService } from '../../../services/storageService';
import { deduplicateMessages } from '../../../utils/messageDedupe';
import { normalizeTitle } from '../../../utils/textNormalization';

export interface UseExtensionBridgeReturn {
    checkExtensionBridge: () => Promise<void>;
}

export function useExtensionBridge(loadSessions: () => Promise<void>): UseExtensionBridgeReturn {

    const checkExtensionBridge = useCallback(() => {
        return new Promise<void>((resolve) => {
            try {
                window.postMessage({ type: 'NOOSPHERE_CHECK_BRIDGE' }, '*');

                const handler = async (event: MessageEvent) => {
                    if (event.source !== window) return;

                    if (event.data.type === 'NOOSPHERE_BRIDGE_RESPONSE') {
                        window.removeEventListener('message', handler);

                        const { noosphere_bridge_data, noosphere_bridge_flag } = event.data.data;

                        if (noosphere_bridge_flag?.pending && noosphere_bridge_data) {
                            const sessions = Array.isArray(noosphere_bridge_data)
                                ? noosphere_bridge_data
                                : [noosphere_bridge_data];

                            let importedCount = 0;
                            for (const session of sessions) {
                                try {
                                    const importType = session.metadata?.importType;

                                    if (importType === 'copy') {
                                        await storageService.saveSession(session);
                                        console.log(`✨ Imported as valid copy: ${session.metadata?.title}`);
                                    } else {
                                        const normalizedTitleValue = session.normalizedTitle ||
                                            (session.metadata?.title ? normalizeTitle(session.metadata.title) : '');

                                        let existingSession = null;
                                        if (normalizedTitleValue) {
                                            existingSession = await storageService.getSessionByNormalizedTitle(normalizedTitleValue);
                                        }

                                        if (existingSession) {
                                            const existingMessages = existingSession.chatData?.messages || [];
                                            const newMessages = session.chatData?.messages || [];
                                            const { messages: updatedMessages, skipped, hasNewMessages } = deduplicateMessages(
                                                existingMessages,
                                                newMessages
                                            );

                                            if (!hasNewMessages && skipped > 0) {
                                                console.log(`⏭️ Skipping merge: All ${skipped} messages already exist in session "${existingSession.name}"`);
                                                continue;
                                            }

                                            console.log(`🔄 Merging content into existing session: ${existingSession.name} (${skipped} duplicates skipped)`);

                                            const distinctArtifacts = [...(existingSession.metadata?.artifacts || [])];
                                            const newArtifacts = session.metadata?.artifacts || [];
                                            newArtifacts.forEach((art: ConversationArtifact) => {
                                                if (!distinctArtifacts.some(existing => existing.id === art.id)) {
                                                    distinctArtifacts.push(art);
                                                }
                                            });

                                            const mergedSession: SavedChatSession = {
                                                ...existingSession,
                                                date: new Date().toISOString(),
                                                chatData: {
                                                    messages: updatedMessages,
                                                    metadata: existingSession.chatData?.metadata
                                                },
                                                metadata: {
                                                    title: existingSession.metadata?.title || existingSession.name,
                                                    model: existingSession.metadata?.model || 'Unknown',
                                                    date: existingSession.metadata?.date || new Date().toISOString(),
                                                    tags: existingSession.metadata?.tags || [],
                                                    ...existingSession.metadata,
                                                    artifacts: distinctArtifacts,
                                                },
                                                inputContent: existingSession.inputContent + '\n\n' + session.inputContent
                                            };

                                            await storageService.saveSession(mergedSession);
                                        } else {
                                            await storageService.saveSession(session);
                                        }
                                    }

                                    importedCount++;
                                } catch (error) {
                                    console.error('Failed to import session:', error);
                                }
                            }

                            window.postMessage({ type: 'NOOSPHERE_CLEAR_BRIDGE' }, '*');
                            await loadSessions();

                            if (importedCount > 0) {
                                console.log(`✅ Imported ${importedCount} session(s) from extension`);
                            }
                        }

                        resolve();
                    } else if (event.data.type === 'NOOSPHERE_BRIDGE_ERROR' || event.data.type === 'NOOSPHERE_BRIDGE_CLEARED') {
                        window.removeEventListener('message', handler);
                        resolve();
                    }
                };

                window.addEventListener('message', handler);

                setTimeout(() => {
                    window.removeEventListener('message', handler);
                    resolve();
                }, 2000);
            } catch (error) {
                console.warn('Extension bridge check failed:', error);
                resolve();
            }
        });
    }, [loadSessions]);

    return {
        checkExtensionBridge
    };
}
