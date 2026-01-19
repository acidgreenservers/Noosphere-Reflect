import { useState } from 'react';
import { SavedChatSession, AppSettings } from '../../../types';
import { storageService } from '../../../services/storageService';
import { sanitizeFilename } from '../../../utils/securityUtils';

export interface ExportOptions {
    format: 'html' | 'markdown' | 'json';
    packageType: 'directory' | 'zip' | 'single';
}

export interface UseExportManagerReturn {
    isExporting: boolean;
    exportError: string | null;
    exportToLocal: (sessionIds: string[], options: ExportOptions, settings: AppSettings) => Promise<void>;
    exportToDrive: (sessionIds: string[], options: ExportOptions, settings: AppSettings) => Promise<void>;
    exportToClipboard: (sessionId: string, format: 'markdown' | 'json') => Promise<void>;
    clearError: () => void;
}

export const useExportManager = (): UseExportManagerReturn => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const clearError = () => setExportError(null);

    const exportToLocal = async (
        sessionIds: string[],
        options: ExportOptions,
        settings: AppSettings
    ) => {
        if (sessionIds.length === 0) {
            setExportError('Please select at least one chat to export.');
            return;
        }

        setIsExporting(true);
        setExportError(null);

        try {
            if (sessionIds.length === 1) {
                // Single export
                await handleSingleExport(sessionIds[0], options, settings);
            } else {
                // Batch export
                await handleBatchExport(sessionIds, options.format, settings);
            }
        } catch (error) {
            console.error('Export failed:', error);
            setExportError(error instanceof Error ? error.message : 'Export failed. Check console for details.');
        } finally {
            setIsExporting(false);
        }
    };

    const exportToDrive = async (
        sessionIds: string[],
        options: ExportOptions,
        settings: AppSettings
    ) => {
        // This will be implemented in the next phase
        // For now, just set an error
        setExportError('Google Drive export not yet implemented in extracted components');
    };

    const exportToClipboard = async (
        sessionId: string,
        format: 'markdown' | 'json'
    ) => {
        setIsExporting(true);
        setExportError(null);

        try {
            const session = await storageService.getSessionById(sessionId);
            if (!session || !session.chatData) {
                throw new Error('Failed to load session data');
            }

            const { exportService } = await import('../../../components/exports/services');
            const theme = session.selectedTheme || 'DarkDefault';
            const userName = session.userName || 'User';
            const aiName = session.aiName || 'AI';
            const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

            let content = '';

            if (format === 'markdown') {
                content = exportService.generate(
                    'markdown',
                    session.chatData,
                    title,
                    undefined,
                    userName,
                    aiName,
                    undefined,
                    session.metadata
                );
            } else if (format === 'json') {
                content = exportService.generate(
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

            await navigator.clipboard.writeText(content);
            // Success - no need to show message here as parent component handles it
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            setExportError('Failed to copy to clipboard.');
        } finally {
            setIsExporting(false);
        }
    };

    return {
        isExporting,
        exportError,
        exportToLocal,
        exportToDrive,
        exportToClipboard,
        clearError,
    };
};

// Helper functions for export operations
async function handleSingleExport(
    sessionId: string,
    options: ExportOptions,
    settings: AppSettings
) {
    const session = await storageService.getSessionById(sessionId);
    if (!session) {
        throw new Error('Failed to load session data');
    }

    const { exportService } = await import('../../../components/exports/services');
    const { generateZipExport } = await import('../../../services/converterService');

    // Generate filename with [AIName] - chatname format
    const sanitizedTitle = sanitizeFilename(
        session.metadata?.title || session.chatTitle,
        settings.fileNamingCase
    );
    const baseFilename = `[${session.aiName || 'AI'}] - ${sanitizedTitle}`;

    if (options.packageType === 'single') {
        // Single file export
        const content = generateSingleFileContent(session, options.format, exportService);
        await downloadSingleFile(content, baseFilename, options.format);
        await storageService.updateExportStatus(session.id, 'exported');
    } else if (options.packageType === 'zip') {
        // ZIP export
        const zipBlob = await generateZipExport(session, options.format);
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseFilename}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        await storageService.updateExportStatus(session.id, 'exported');
    } else {
        // Directory export
        await handleDirectoryExport(session, options.format, settings, exportService, baseFilename);
        await storageService.updateExportStatus(session.id, 'exported');
    }
}

async function handleBatchExport(
    sessionIds: string[],
    format: 'html' | 'markdown' | 'json',
    settings: AppSettings
) {
    const { generateBatchZipExport } = await import('../../../services/converterService');

    // Fetch FULL sessions for export
    const fullSessions: SavedChatSession[] = [];
    for (const id of sessionIds) {
        const full = await storageService.getSessionById(id);
        if (full) fullSessions.push(full);
    }

    // Batch export always uses ZIP
    const zipBlob = await generateBatchZipExport(fullSessions, format);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    // Generate timestamp-datestamp for filename
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    a.download = `Noosphere-Chats-${timestamp}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mark all as exported
    for (const session of fullSessions) {
        await storageService.updateExportStatus(session.id, 'exported');
    }
}

function generateSingleFileContent(
    session: SavedChatSession,
    format: 'html' | 'markdown' | 'json',
    exportService: any
): string {
    const theme = session.selectedTheme || 'DarkDefault';
    const userName = session.userName || 'User';
    const aiName = session.aiName || 'AI';
    const title = session.metadata?.title || session.chatTitle;

    if (format === 'html') {
        return exportService.generate(
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
    } else if (format === 'markdown') {
        return exportService.generate(
            'markdown',
            session.chatData!,
            title,
            undefined,
            userName,
            aiName,
            undefined,
            session.metadata
        );
    } else {
        return exportService.generate(
            'json',
            session.chatData!,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            session.metadata
        );
    }
}

async function downloadSingleFile(
    content: string,
    baseFilename: string,
    format: 'html' | 'markdown' | 'json'
) {
    const mimeType = format === 'html' ? 'text/html' :
                    format === 'markdown' ? 'text/markdown' : 'application/json';
    const extension = format === 'html' ? 'html' :
                     format === 'markdown' ? 'md' : 'json';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseFilename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function handleDirectoryExport(
    session: SavedChatSession,
    format: 'html' | 'markdown' | 'json',
    settings: AppSettings,
    exportService: any,
    baseFilename: string
) {
    if (!('showDirectoryPicker' in window)) {
        throw new Error('Directory export is not supported in this browser. Please use Chrome, Edge, or Opera.');
    }

    const rootDirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
    });

    const theme = session.selectedTheme || 'DarkDefault';
    const userName = session.userName || 'User';
    const aiName = session.aiName || 'AI';
    const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

    // Create a subdirectory for the chat export
    const chatDirHandle = await rootDirHandle.getDirectoryHandle(baseFilename, { create: true });

    // Generate conversation content
    let content: string;
    let extension: string;

    if (format === 'html') {
        content = exportService.generate(
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
        content = exportService.generate(
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
        content = exportService.generate(
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

    // Write conversation file to chat directory
    const fileHandle = await chatDirHandle.getFileHandle(`${baseFilename}.${extension}`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();

    // Handle artifacts
    const allArtifacts = [
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

    // Generate and write export metadata
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
}