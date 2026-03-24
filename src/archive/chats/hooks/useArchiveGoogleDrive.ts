// useArchiveGoogleDrive Hook
// Extracted from ArchiveHub.tsx for Google Drive import/export operations

import { useCallback, useState } from 'react';
import { SavedChatSession, SavedChatSessionMetadata, ChatTheme, ParserMode, AppSettings, ConversationArtifact } from '../../../types';
import { parseChat } from '../../../services/converterService';
import { exportService } from '../../../components/exports/services';
import { storageService } from '../../../services/storageService';
import { googleDriveService, DriveFile } from '../../../services/googleDriveService';
import { sanitizeFilename } from '../../../utils/securityUtils';
import { enrichMetadata } from '../../../utils/metadataEnricher';
import { deduplicateMessages } from '../../../utils/messageDedupe';
import { normalizeTitle } from '../../../utils/textNormalization';

export type ExportFormat = 'html' | 'markdown' | 'json';
export type ExportPackageType = 'directory' | 'zip' | 'single';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

// Detect parser mode from content
function detectMode(text: string): ParserMode {
    if (text.includes('claude-chat-export')) return ParserMode.ClaudeHtml;
    if (text.includes('data-message-author-role') || text.includes('ChatGPT')) return ParserMode.ChatGptHtml;
    if (text.includes('aistudio.google.com') || text.includes('googleusercontent')) return ParserMode.AiStudioHtml;
    if (text.includes('chat.mistral.ai') || text.includes('le-chat')) return ParserMode.LeChatHtml;
    if (text.includes('Gemini')) return ParserMode.GeminiHtml;
    if (text.includes('Grok')) return ParserMode.GrokHtml;
    if (text.includes('llamacoder')) return ParserMode.LlamacoderHtml;
    if (text.includes('kimi.ai') || text.includes('Kimi')) return ParserMode.KimiHtml;
    return ParserMode.Basic;
}


export interface UseArchiveGoogleDriveReturn {
    isSendingToDrive: boolean;
    isImportingFromDrive: boolean;
    handleImportFromGoogleDrive: (
        selectedFiles: DriveFile[],
        accessToken: string,
        loadSessions: () => Promise<void>
    ) => Promise<void>;
    handleExportToDrive: (
        selectedIds: Set<string>,
        sessions: SavedChatSessionMetadata[],
        appSettings: AppSettings,
        accessToken: string,
        driveFolderId: string,
        loadSessions: () => Promise<void>
    ) => Promise<void>;
    handleExportToDriveWithFormat: (
        sessionMeta: SavedChatSessionMetadata,
        format: ExportFormat,
        packageType: ExportPackageType,
        appSettings: AppSettings,
        accessToken: string,
        driveFolderId: string,
        loadSessions: () => Promise<void>
    ) => Promise<void>;
    handleBatchExportToDrive: (
        selectedIds: Set<string>,
        sessions: SavedChatSessionMetadata[],
        format: ExportFormat,
        appSettings: AppSettings,
        accessToken: string,
        driveFolderId: string,
        loadSessions: () => Promise<void>
    ) => Promise<void>;
}

export function useArchiveGoogleDrive(): UseArchiveGoogleDriveReturn {
    const [isSendingToDrive, setIsSendingToDrive] = useState(false);
    const [isImportingFromDrive, setIsImportingFromDrive] = useState(false);

    // Helper: Directory export to Drive
    const handleDirectoryExportToDrive = async (
        session: SavedChatSession,
        format: ExportFormat,
        appSettings: AppSettings,
        accessToken: string,
        driveFolderId: string
    ) => {
        const theme = session.selectedTheme || ChatTheme.DarkDefault;
        const userName = session.userName || 'User';
        const aiName = session.aiName || 'AI';
        const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

        const sanitizedTitle = sanitizeFilename(
            session.metadata?.title || session.chatTitle,
            appSettings.fileNamingCase
        );
        const baseFilename = `[${aiName}] - ${sanitizedTitle}`;

        const mainFolderId = await googleDriveService.createFolder(accessToken, baseFilename, driveFolderId);

        let content: string;
        let extension: string;
        let mimeType: string;

        if (format === 'html') {
            content = await exportService.generate(
                'html', session.chatData!, title, theme, userName, aiName,
                session.parserMode, session.metadata, true, false, session.selectedStyle
            );
            extension = 'html';
            mimeType = 'text/html';
        } else if (format === 'markdown') {
            content = await exportService.generate(
                'markdown', session.chatData!, title, undefined, userName, aiName, undefined, session.metadata
            );
            extension = 'md';
            mimeType = 'text/markdown';
        } else {
            content = await exportService.generate(
                'json', session.chatData!, undefined, undefined, undefined, undefined, undefined, session.metadata
            );
            extension = 'json';
            mimeType = 'application/json';
        }

        await googleDriveService.uploadFile(accessToken, content, `${baseFilename}.${extension}`, mimeType, mainFolderId);

        // Collect and deduplicate artifacts
        const allArtifacts: any[] = [
            ...(session.metadata?.artifacts || []),
            ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
        ];
        const uniqueArtifacts = Array.from(new Map(allArtifacts.map(a => [a.id, a])).values());

        let artifactsUploaded = 0;
        if (uniqueArtifacts.length > 0) {
            const artifactsFolderMetadata = {
                name: 'artifacts',
                mimeType: 'application/vnd.google-apps.folder',
                parents: [mainFolderId],
            };
            const artifactsResponse = await fetch(`${DRIVE_API_BASE}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(artifactsFolderMetadata),
            });

            if (artifactsResponse.ok) {
                const artifactsFolder = await artifactsResponse.json();
                for (const artifact of uniqueArtifacts) {
                    try {
                        const binaryData = Uint8Array.from(atob(artifact.fileData), c => c.charCodeAt(0));
                        const blob = new Blob([binaryData]);
                        await googleDriveService.uploadFile(
                            accessToken, blob, artifact.fileName,
                            artifact.mimeType || 'application/octet-stream', artifactsFolder.id
                        );
                        artifactsUploaded++;
                    } catch (error) {
                        console.error(`Failed to upload artifact ${artifact.fileName}:`, error);
                    }
                }
            }
        }

        // Upload export metadata
        const exportMetadata = {
            exportDate: new Date().toISOString(),
            exportedBy: { tool: 'Noosphere Reflect', version: '0.5.8' },
            chats: [{
                filename: baseFilename,
                originalTitle: title,
                service: aiName,
                exportDate: new Date().toISOString(),
                originalDate: session.metadata?.date || session.date,
                messageCount: session.chatData?.messages.length || 0,
                artifactCount: uniqueArtifacts.length,
                tags: session.metadata?.tags || []
            }],
            summary: {
                totalChats: 1,
                totalMessages: session.chatData?.messages.length || 0,
                totalArtifacts: uniqueArtifacts.length
            }
        };
        await googleDriveService.uploadFile(accessToken, JSON.stringify(exportMetadata, null, 2), 'export-metadata.json', 'application/json', mainFolderId);

        return { folderName: baseFilename, mainFile: `${baseFilename}.${extension}`, artifactsUploaded, hasMetadata: true };
    };

    const handleImportFromGoogleDrive = useCallback(async (
        selectedFiles: DriveFile[],
        accessToken: string,
        loadSessions: () => Promise<void>
    ) => {
        setIsImportingFromDrive(true);
        try {
            let imported = 0, skipped = 0, merged = 0;

            for (const file of selectedFiles) {
                try {
                    const content = await googleDriveService.downloadFile(accessToken, file.id);
                    const mode = detectMode(content);
                    const chatData = await parseChat(content, 'auto', mode);
                    const enrichedMetadata = enrichMetadata(chatData, mode);

                    const normalizedTitleValue = enrichedMetadata.title ? normalizeTitle(enrichedMetadata.title) : '';
                    let existingSession = normalizedTitleValue
                        ? await storageService.getSessionByNormalizedTitle(normalizedTitleValue)
                        : null;

                    if (existingSession) {
                        const existingMessages = existingSession.chatData?.messages || [];
                        const newMessages = chatData.messages || [];
                        const { messages: updatedMessages, skipped: duplicateCount, hasNewMessages } = deduplicateMessages(existingMessages, newMessages);

                        if (!hasNewMessages && duplicateCount > 0) {
                            console.log(`⏭️ Skipping merge: All ${duplicateCount} messages already exist`);
                            skipped++;
                            continue;
                        }

                        const distinctArtifacts = [...(existingSession.metadata?.artifacts || [])];
                        (enrichedMetadata.artifacts || []).forEach((art: ConversationArtifact) => {
                            if (!distinctArtifacts.some(existing => existing.id === art.id)) {
                                distinctArtifacts.push(art);
                            }
                        });

                        const mergedSession: SavedChatSession = {
                            ...existingSession,
                            date: new Date().toISOString(),
                            chatData: { messages: updatedMessages, metadata: existingSession.chatData?.metadata },
                            metadata: {
                                ...existingSession.metadata,
                                ...enrichedMetadata,
                                title: existingSession.metadata?.title || existingSession.name,
                                model: existingSession.metadata?.model || enrichedMetadata.model || 'Unknown',
                                tags: [...new Set([...(existingSession.metadata?.tags || []), ...(enrichedMetadata.tags || [])])],
                                artifacts: distinctArtifacts,
                                exportStatus: existingSession.metadata?.exportStatus
                            },
                            inputContent: existingSession.inputContent + '\n\n' + content
                        };
                        await storageService.saveSession(mergedSession);
                        merged++;
                    } else {
                        const newSession: SavedChatSession = {
                            id: crypto.randomUUID(),
                            name: enrichedMetadata.title,
                            date: enrichedMetadata.date,
                            chatTitle: enrichedMetadata.title,
                            userName: 'User',
                            aiName: enrichedMetadata.model || 'AI',
                            selectedTheme: ChatTheme.DarkDefault,
                            parserMode: mode,
                            inputContent: content,
                            chatData,
                            metadata: enrichedMetadata
                        };
                        await storageService.saveSession(newSession);
                        imported++;
                    }
                } catch (error) {
                    console.error(`Failed to import ${file.name}:`, error);
                    skipped++;
                }
            }

            await loadSessions();

            if (imported > 0 || skipped > 0 || merged > 0) {
                let summary = '✅ Import Complete:';
                if (imported > 0) summary += `\n- ${imported} new chat(s)`;
                if (merged > 0) summary += `\n- ${merged} chat(s) merged`;
                if (skipped > 0) summary += `\n- ${skipped} skipped (all duplicates)`;
                alert(summary);
            }
        } catch (error) {
            console.error('Drive import failed:', error);
            alert(`❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsImportingFromDrive(false);
        }
    }, []);

    const handleExportToDrive = useCallback(async (
        selectedIds: Set<string>,
        sessions: SavedChatSessionMetadata[],
        appSettings: AppSettings,
        accessToken: string,
        driveFolderId: string,
        loadSessions: () => Promise<void>
    ) => {
        const selectedMetas = sessions.filter(s => selectedIds.has(s.id));
        if (selectedMetas.length === 0) return;

        setIsSendingToDrive(true);
        try {
            for (const meta of selectedMetas) {
                const session = await storageService.getSessionById(meta.id);
                if (!session) continue;

                const filename = sanitizeFilename(session.metadata?.title || session.chatTitle, appSettings.fileNamingCase);
                const theme = session.selectedTheme || ChatTheme.DarkDefault;
                const userName = session.userName || 'User';
                const aiName = session.aiName || 'AI';
                const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

                const content = await exportService.generate(
                    'html', session.chatData!, title, theme, userName, aiName,
                    session.parserMode, session.metadata, true, false, session.selectedStyle
                );

                await googleDriveService.uploadFile(accessToken, content, `${filename}.html`, 'text/html', driveFolderId);
                await storageService.updateExportStatus(session.id, 'exported');
            }
            await loadSessions();
            alert(`✅ Exported ${selectedMetas.length} conversation(s) to Google Drive`);
        } catch (error) {
            console.error('Google Drive export failed:', error);
            alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSendingToDrive(false);
        }
    }, []);

    const handleExportToDriveWithFormat = useCallback(async (
        sessionMeta: SavedChatSessionMetadata,
        format: ExportFormat,
        packageType: ExportPackageType,
        appSettings: AppSettings,
        accessToken: string,
        driveFolderId: string,
        loadSessions: () => Promise<void>
    ) => {
        setIsSendingToDrive(true);
        try {
            const session = await storageService.getSessionById(sessionMeta.id);
            if (!session) {
                alert('Failed to load session data');
                return;
            }

            if (packageType === 'directory') {
                const result = await handleDirectoryExportToDrive(session, format, appSettings, accessToken, driveFolderId);
                await storageService.updateExportStatus(session.id, 'exported');
                await loadSessions();
                alert(`✅ Exported to Google Drive folder:\n- ${result.folderName}/\n  - ${result.mainFile}\n  - artifacts/ (${result.artifactsUploaded} files)\n  - export-metadata.json`);
            } else {
                const filename = sanitizeFilename(session.metadata?.title || session.chatTitle, appSettings.fileNamingCase);
                const theme = session.selectedTheme || ChatTheme.DarkDefault;
                const userName = session.userName || 'User';
                const aiName = session.aiName || 'AI';
                const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

                let content: string, mimeType: string, uploadFilename: string;
                if (format === 'html') {
                    content = await exportService.generate('html', session.chatData!, title, theme, userName, aiName, session.parserMode, session.metadata);
                    mimeType = 'text/html';
                    uploadFilename = `${filename}.html`;
                } else if (format === 'markdown') {
                    content = await exportService.generate('markdown', session.chatData!, title, undefined, userName, aiName, undefined, session.metadata);
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = await exportService.generate('json', session.chatData!, undefined, undefined, undefined, undefined, undefined, session.metadata);
                    mimeType = 'application/json';
                    uploadFilename = `${filename}.json`;
                }

                await googleDriveService.uploadFile(accessToken, content, uploadFilename, mimeType, driveFolderId);
                await storageService.updateExportStatus(session.id, 'exported');
                await loadSessions();
                alert(`✅ Uploaded to Google Drive: ${uploadFilename}`);
            }
        } catch (error) {
            console.error('Google Drive export failed:', error);
            alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSendingToDrive(false);
        }
    }, []);

    const handleBatchExportToDrive = useCallback(async (
        selectedIds: Set<string>,
        sessions: SavedChatSessionMetadata[],
        format: ExportFormat,
        appSettings: AppSettings,
        accessToken: string,
        driveFolderId: string,
        loadSessions: () => Promise<void>
    ) => {
        const selectedMetas = sessions.filter(s => selectedIds.has(s.id));
        if (selectedMetas.length === 0) return;

        setIsSendingToDrive(true);
        try {
            for (const meta of selectedMetas) {
                const session = await storageService.getSessionById(meta.id);
                if (!session) continue;

                const filename = sanitizeFilename(session.metadata?.title || session.chatTitle, appSettings.fileNamingCase);
                const theme = session.selectedTheme || ChatTheme.DarkDefault;
                const userName = session.userName || 'User';
                const aiName = session.aiName || 'AI';
                const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

                let content: string, mimeType: string, uploadFilename: string;
                if (format === 'html') {
                    content = await exportService.generate('html', session.chatData!, title, theme, userName, aiName, session.parserMode, session.metadata, true, false, session.selectedStyle);
                    mimeType = 'text/html';
                    uploadFilename = `${filename}.html`;
                } else if (format === 'markdown') {
                    content = await exportService.generate('markdown', session.chatData!, title, undefined, userName, aiName, undefined, session.metadata);
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = await exportService.generate('json', session.chatData!, undefined, undefined, undefined, undefined, undefined, session.metadata);
                    mimeType = 'application/json';
                    uploadFilename = `${filename}.json`;
                }

                await googleDriveService.uploadFile(accessToken, content, uploadFilename, mimeType, driveFolderId);
                await storageService.updateExportStatus(session.id, 'exported');
            }
            await loadSessions();
            alert(`✅ Exported ${selectedMetas.length} conversation(s) to Google Drive`);
        } catch (error) {
            console.error('Google Drive export failed:', error);
            alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSendingToDrive(false);
        }
    }, []);

    return {
        isSendingToDrive,
        isImportingFromDrive,
        handleImportFromGoogleDrive,
        handleExportToDrive,
        handleExportToDriveWithFormat,
        handleBatchExportToDrive
    };
}
