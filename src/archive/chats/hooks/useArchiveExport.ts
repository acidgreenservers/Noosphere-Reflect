// useArchiveExport Hook
// Extracted from ArchiveHub.tsx for export orchestration (batch, single, clipboard)

import { useCallback, useState } from 'react';
import { SavedChatSession, SavedChatSessionMetadata, ChatTheme, ParserMode, AppSettings } from '../../../types';
import { generateZipExport, generateBatchZipExport } from '../../../services/converterService';
import { exportService } from '../../../components/exports/services';
import { storageService } from '../../../services/storageService';
import { sanitizeFilename } from '../../../utils/securityUtils';

export type ExportFormat = 'html' | 'markdown' | 'json';
export type ExportPackageType = 'directory' | 'zip' | 'single';

export interface UseArchiveExportReturn {
    isExporting: boolean;
    handleBatchExport: (
        selectedIds: Set<string>,
        sessions: SavedChatSessionMetadata[],
        format: ExportFormat,
        onComplete: () => Promise<void>
    ) => Promise<void>;
    handleSingleExport: (
        sessionMeta: SavedChatSessionMetadata,
        format: ExportFormat,
        packageType: ExportPackageType,
        appSettings: AppSettings,
        onComplete: () => Promise<void>
    ) => Promise<void>;
    handleClipboardExport: (
        selectedIds: Set<string>,
        format: 'markdown' | 'json'
    ) => Promise<void>;
}

export function useArchiveExport(): UseArchiveExportReturn {
    const [isExporting, setIsExporting] = useState(false);

    const handleBatchExport = useCallback(async (
        selectedIds: Set<string>,
        sessions: SavedChatSessionMetadata[],
        format: ExportFormat,
        onComplete: () => Promise<void>
    ) => {
        const selectedMetas = sessions.filter(s => selectedIds.has(s.id));
        if (selectedMetas.length === 0) return;

        setIsExporting(true);
        try {
            // Fetch FULL sessions for export
            const fullSessions: SavedChatSession[] = [];
            for (const meta of selectedMetas) {
                const full = await storageService.getSessionById(meta.id);
                if (full) fullSessions.push(full);
            }

            // Batch export always uses ZIP
            const zipBlob = await generateBatchZipExport(fullSessions, format);
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
            a.download = `Noosphere-Chats-${timestamp}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert(`✅ Exported ${selectedMetas.length} conversation(s) as ZIP archive`);

            // Mark all as exported
            for (const s of selectedMetas) {
                await storageService.updateExportStatus(s.id, 'exported');
            }

            await onComplete();
        } catch (error) {
            console.error('Batch export failed:', error);
            alert('Export failed. Check console for details.');
        } finally {
            setIsExporting(false);
        }
    }, []);

    const handleSingleExport = useCallback(async (
        sessionMeta: SavedChatSessionMetadata,
        format: ExportFormat,
        packageType: ExportPackageType,
        appSettings: AppSettings,
        onComplete: () => Promise<void>
    ) => {
        setIsExporting(true);
        try {
            const session = await storageService.getSessionById(sessionMeta.id);
            if (!session) {
                alert('Failed to load session data');
                return;
            }

            // Handle single file export
            if (packageType === 'single') {
                const sanitizedTitle = sanitizeFilename(
                    session.metadata?.title || session.chatTitle,
                    appSettings.fileNamingCase
                );
                const baseFilename = `[${session.aiName || 'AI'}] - ${sanitizedTitle}`;

                let content: string;
                let extension: string;
                let mimeType: string;

                if (format === 'html') {
                    content = await exportService.generate(
                        'html',
                        session.chatData!,
                        session.metadata?.title || session.chatTitle,
                        session.selectedTheme || ChatTheme.DarkDefault,
                        session.userName || 'User',
                        session.aiName || 'AI',
                        session.parserMode || ParserMode.Basic,
                        session.metadata,
                        true,
                        false,
                        session.selectedStyle
                    );
                    extension = 'html';
                    mimeType = 'text/html';
                } else if (format === 'markdown') {
                    content = await exportService.generate(
                        'markdown',
                        session.chatData!,
                        session.metadata?.title || session.chatTitle,
                        undefined,
                        session.userName || 'User',
                        session.aiName || 'AI',
                        undefined,
                        session.metadata
                    );
                    extension = 'md';
                    mimeType = 'text/markdown';
                } else {
                    content = await exportService.generate(
                        'json',
                        session.chatData!,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        session.metadata
                    );
                    extension = 'json';
                    mimeType = 'application/json';
                }

                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${baseFilename}.${extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                await storageService.updateExportStatus(session.id, 'exported');
                await onComplete();
                return;
            }

            // Handle ZIP export
            if (packageType === 'zip') {
                const zipBlob = await generateZipExport(session, format);
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                const filename = sanitizeFilename(
                    session.metadata?.title || session.chatTitle,
                    appSettings.fileNamingCase
                );
                a.download = `${filename}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                await storageService.updateExportStatus(session.id, 'exported');
                await onComplete();
                return;
            }

            // Handle Directory export
            if (packageType === 'directory') {
                if (!('showDirectoryPicker' in window)) {
                    alert('⚠️ Directory export is not supported in this browser. Please use Chrome, Edge, or Opera, or select ZIP export instead.');
                    return;
                }

                const rootDirHandle = await (window as any).showDirectoryPicker({
                    mode: 'readwrite',
                    startIn: 'downloads'
                });

                const theme = session.selectedTheme || ChatTheme.DarkDefault;
                const userName = session.userName || 'User';
                const aiName = session.aiName || 'AI';
                const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

                const sanitizedTitle = sanitizeFilename(
                    session.metadata?.title || session.chatTitle,
                    appSettings.fileNamingCase
                );
                const baseFilename = `[${aiName}] - ${sanitizedTitle}`;
                const chatDirHandle = await rootDirHandle.getDirectoryHandle(baseFilename, { create: true });

                let content: string;
                let extension: string;

                if (format === 'html') {
                    content = await exportService.generate(
                        'html',
                        session.chatData!,
                        title,
                        theme,
                        userName,
                        aiName,
                        session.parserMode,
                        session.metadata,
                        true,
                        false,
                        session.selectedStyle
                    );
                    extension = 'html';
                } else if (format === 'markdown') {
                    content = await exportService.generate(
                        'markdown',
                        session.chatData!,
                        title,
                        undefined,
                        userName,
                        aiName,
                        undefined,
                        session.metadata
                    );
                    extension = 'md';
                } else {
                    content = await exportService.generate(
                        'json',
                        session.chatData!,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        session.metadata
                    );
                    extension = 'json';
                }

                const fileHandle = await chatDirHandle.getFileHandle(`${baseFilename}.${extension}`, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();

                // Collect and deduplicate artifacts
                const allArtifacts: any[] = [
                    ...(session.metadata?.artifacts || []),
                    ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
                ];
                const uniqueArtifacts = Array.from(
                    new Map(allArtifacts.map(a => [a.id, a])).values()
                );

                if (uniqueArtifacts.length > 0) {
                    const artifactsDir = await chatDirHandle.getDirectoryHandle('artifacts', { create: true });
                    for (const artifact of uniqueArtifacts) {
                        const artifactHandle = await artifactsDir.getFileHandle(artifact.fileName, { create: true });
                        const artifactWritable = await artifactHandle.createWritable();
                        const binaryData = Uint8Array.from(atob(artifact.fileData), c => c.charCodeAt(0));
                        await artifactWritable.write(binaryData);
                        await artifactWritable.close();
                    }
                }

                // Export metadata
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

                const metadataHandle = await chatDirHandle.getFileHandle('export-metadata.json', { create: true });
                const metadataWritable = await metadataHandle.createWritable();
                await metadataWritable.write(JSON.stringify(exportMetadata, null, 2));
                await metadataWritable.close();

                alert(`✅ Exported to directory:\n- ${baseFilename}/\n  - ${baseFilename}.${extension}\n  - artifacts/ (${uniqueArtifacts.length} files)\n  - export-metadata.json`);

                await storageService.updateExportStatus(session.id, 'exported');
                await onComplete();
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return; // User cancelled
            console.error('Export failed:', error);
            alert('Export failed. Check console for details.');
        } finally {
            setIsExporting(false);
        }
    }, []);

    const handleClipboardExport = useCallback(async (
        selectedIds: Set<string>,
        format: 'markdown' | 'json'
    ) => {
        if (selectedIds.size !== 1) {
            alert('Please select exactly one chat to copy to clipboard.');
            return;
        }

        const sessionId = Array.from(selectedIds)[0];
        const session = await storageService.getSessionById(sessionId);
        if (!session || !session.chatData) return;

        const userName = session.userName || 'User';
        const aiName = session.aiName || 'AI';
        const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

        let content = '';
        if (format === 'markdown') {
            content = await exportService.generate(
                'markdown',
                session.chatData,
                title,
                undefined,
                userName,
                aiName,
                undefined,
                session.metadata
            );
        } else {
            content = await exportService.generate(
                'json',
                session.chatData,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                session.metadata
            );
        }

        try {
            await navigator.clipboard.writeText(content);
            alert('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy to clipboard.');
        }
    }, []);

    return {
        isExporting,
        handleBatchExport,
        handleSingleExport,
        handleClipboardExport
    };
}
